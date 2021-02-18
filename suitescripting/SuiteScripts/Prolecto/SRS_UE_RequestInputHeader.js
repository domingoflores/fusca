//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------


var REQUEST_STATUS = {

			"Open" : 1,
			"InProgress" : 2,
			"Failed" : 3,
			"Completed" : 4,
			"Initializing" : 5

		};

	function allDetailRecordsProcessedSuccessfully () 
	{
			var retValue = true;

			var filters = [];
			var columns = [];
			var results = null;
				
			filters[0] = new nlobjSearchFilter("custrecord_pri_cre_request_status",
					null, "noneof", [ REQUEST_STATUS.Completed ]);
			filters[1] = new nlobjSearchFilter("custrecord_pri_cre_request_header",
					null, "is", nlapiGetRecordId());
			filters[2] = new nlobjSearchFilter("isinactive", null, "is", "F"); // skip
			
			results = nlapiSearchRecord("customrecord_pri_cre_request_detail", null, filters, columns);
			if (results && results.length > 0) {
				nlapiLogExecution("audit", "Completed","");
				retValue = false; // completed
			}
			
			
			return (retValue);
		}

function SRS_RequestInputHeaderBeforeSubmit(type) {
	var func = 'SRS_RequestInputHeaderBeforeSubmit ';
	nlapiLogExecution('AUDIT', func + ' starting');
	
	nlapiLogExecution('AUDIT', ' starting ' + nlapiGetContext().getExecutionContext());

	if (!nlapiGetFieldValue('custrecord_pri_cre_request_header_reqid'))
	{
		nlapiSetFieldValue('custrecord_pri_cre_request_header_reqid', nlapiGetRecordId());
	}
	
	
	if (nlapiGetContext().getExecutionContext()==="mapreduce")
	{
		var rawdata = nlapiGetFieldValue('custrecord_pri_cre_request_header_rawdat');
		var creprofile = nlapiGetFieldValue('custrecord_pri_cre_request_profile');
		var id = nlapiGetFieldValue('custrecord_pri_cre_request_header_reqid');
		var outputfolder = nlapiGetFieldValue('custrecord_pri_cre_request_folder');
		var status = nlapiGetFieldValue('custrecord_pri_cre_request_header_status');
		var outputDocument = nlapiGetFieldValue('custrecord_pri_cre_request_header_doc');
		
		
		//nlapiLogExecution('AUDIT', ' rawdata', rawdata);
		nlapiLogExecution('AUDIT', ' outputfolder', outputfolder);
		nlapiLogExecution('AUDIT', ' creprofile', creprofile);
		nlapiLogExecution('AUDIT', ' id', id);
		nlapiLogExecution('AUDIT', ' status', status);
		
		
		if (creprofile && id && parseInt(status,10) === parseInt(REQUEST_STATUS.Open,10) && (!outputDocument))
		{
			try
			{
				if (allDetailRecordsProcessedSuccessfully())
				{
					var creProfile = new CREProfile(creprofile);
					if (rawdata)
					{
						var rawdataToExtend = JSON.parse(rawdata);
						_.extend(creProfile.RawData, rawdataToExtend);
					}
					creProfile.Translate(id);
					
					creProfile.Execute();
					if (creProfile.fields.DocumentName.file) 
					{
						if (outputfolder)
						{
							creProfile.fields.DocumentName.file.setFolder(outputfolder);
						}
						//creProfile.fields.DocumentName.file.setIsOnline(true);
						
						var fileid = nlapiSubmitFile(creProfile.fields.DocumentName.file);
						nlapiSetFieldValue("custrecord_pri_cre_request_header_doc", fileid);
						
					}
				
					nlapiSetFieldValue("custrecord_pri_cre_request_header_status", REQUEST_STATUS.Completed);
				}
				else 
				{
					nlapiSetFieldValue("custrecord_pri_cre_request_header_status", REQUEST_STATUS.Failed);
				}
			}
			catch (e) 
			{
				var msg = "";
				if (e instanceof nlobjError) 
				{
					msg = "Code: " + e.getCode() + ". ";
					msg = msg + " Error: " + e.getDetails();
					nlapiLogExecution("ERROR", "Request Header Error ", e.getCode() + " : " + e.getDetails());
				} else {
					nlapiLogExecution("ERROR", "Request Header ", e.toString());
					msg = e.toString();
				}
				nlapiSetFieldValue("custrecord_pri_cre_request_header_status", REQUEST_STATUS.Failed);
				nlapiSetFieldValue("custrecord_pri_cre_request_header_notes", msg);
			}
			
		}
	}

}