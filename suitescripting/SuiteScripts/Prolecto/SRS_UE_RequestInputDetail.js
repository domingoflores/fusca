//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

function getErrorSubstring(str, find)
{
	var retValue = "";
	var errorStartIndex = str.indexOf(find);
	var errorEndIndex = str.indexOf("...", errorStartIndex);
	
	if (errorEndIndex<0)
	{
		var maxlengthToDisplay = 200;
		if (str.length>=maxlengthToDisplay)
		{
			errorEndIndex = errorStartIndex + maxlengthToDisplay;
		}
		else 
		{
			errorEndIndex = str.length;
		}
	}
	retValue = str.substring(errorStartIndex,errorEndIndex);
	return retValue;
}

function errorFound(str)
{
	var retValue = "";
	
	var errorArr = str.match(/^[A-Z][0-9]+(?:_[A-Z][0-9]+)+ : /); 
	//SSS_MISSING_REQD_ARGUMENT : id while translating value {var const_useomnibus= parseInt(data_in
	//["constants"]["PFT Account Options"]["Uses Omnibus Account"]...
	if (errorArr && errorArr.length>0)
	{
		//these errors occur when there is a javascript error 
		//or when we use throw nlapiCreateError("SRS_GET_FILE_BASE64_CONTENTS_ERROR"
		//it expects capital letters or numbers or underscore, at beginning of string, plus ' : ' at the end
		//it catches both errors throw by netsuite, and errors thrown by developer 
		//end of errors are indicated by ...
		
		nlapiLogExecution('AUDIT', 'found error', errorArr.toString());
		
		var errorStartIndex = 0;
		var errorEndIndex = str.indexOf("...", errorStartIndex);
		
		nlapiLogExecution('AUDIT', 'errorStartIndex', errorStartIndex);
		nlapiLogExecution('AUDIT', 'errorEndIndex', errorEndIndex);
		
		if (errorEndIndex<0)
		{
			var maxlengthToDisplay = 200;
			if (str.length>=maxlengthToDisplay)
			{
				errorEndIndex = errorStartIndex + maxlengthToDisplay;
			}
			else 
			{
				errorEndIndex = str.length;
			}
		}
		retValue = str.substring(errorStartIndex,errorEndIndex);
	}
	else if (str.indexOf("[ERROR:")>=0)
	{
		retValue = getErrorSubstring(str, "[ERROR:");
	}
	else if (str.indexOf("TrimPath template ParseError")>=0)
	{
		retValue = getErrorSubstring(str, "TrimPath template ParseError");
	}
	return retValue;
	
}

function SRS_RequestInputDetailBeforeSubmit(type) {
	var func = 'SRS_RequestInputDetailBeforeSubmit ';
	nlapiLogExecution('AUDIT', func + ' starting');
	
	nlapiLogExecution('AUDIT', ' starting' + nlapiGetContext().getExecutionContext());

	var REQUEST_STATUS = {

			"Open" : 1,
			"InProgress" : 2,
			"Failed" : 3,
			"Completed" : 4,
			"Initializing" : 5

		};
	
	if (nlapiGetContext().getExecutionContext()==="mapreduce")
	{
		var rawdata = nlapiGetFieldValue('custrecord_pri_cre_request_rawdata');
		var creprofile = nlapiGetFieldValue('custrecord_pri_cre_request_creprofile');
		var id = nlapiGetFieldValue('custrecord_pri_cre_request_id');
		var outputfolder = nlapiGetFieldValue('custrecord_pri_cre_request_output_folder');
		var status = nlapiGetFieldValue('custrecord_pri_cre_request_status');
		var outputDocument = nlapiGetFieldValue('custrecord_pri_cre_request_output_doc');
		
		nlapiLogExecution('AUDIT', ' rawdata', rawdata);
		nlapiLogExecution('AUDIT', ' outputfolder', outputfolder);
		nlapiLogExecution('AUDIT', ' creprofile', creprofile);
		nlapiLogExecution('AUDIT', ' id', id);
		
		if (creprofile && id && parseInt(status,10) === parseInt(REQUEST_STATUS.Open,10) && (!outputDocument))
		{
			try
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
					creProfile.fields.DocumentName.file.setIsOnline(true);
					var fileid = nlapiSubmitFile(creProfile.fields.DocumentName.file);
					
					var objNewFile = nlapiLoadFile(fileid);
					var url = objNewFile.getURL();//creProfile.fields.DocumentName.file.getURL();
					
					nlapiSetFieldValue("custrecord_pri_cre_request_output_dlink", url);
					nlapiSetFieldValue("custrecord_pri_cre_request_output_doc", fileid);
				
				}
				
				nlapiLogExecution('AUDIT', ' creProfile.fields.BodyTemplate.translatedValue', creProfile.fields.BodyTemplate.translatedValue);
				
				var errorsMessage = errorFound(creProfile.fields.BodyTemplate.translatedValue);
				if (errorsMessage)
				{
					nlapiSetFieldValue("custrecord_pri_cre_request_status", REQUEST_STATUS.Failed);
					nlapiSetFieldValue("custrecord_pri_cre_request_notes", errorsMessage);
				}
				else 
				{
					nlapiSetFieldValue("custrecord_pri_cre_request_status", REQUEST_STATUS.Completed);
				}
				//nlapiSetFieldValue("custrecord_pri_cre_request_notes", "completed");
			} 
			catch (e) 
			{
				var msg = "";
				if (e instanceof nlobjError) 
				{
					msg = "Code: " + e.getCode() + ". ";
					msg = msg + " Error: " + e.getDetails();
					nlapiLogExecution("ERROR", "Request Detail Error ", e.getCode() + " : " + e.getDetails());
				} else {
					nlapiLogExecution("ERROR", "Request Detail Error ", e.toString());
					msg = e.toString();
				}
				nlapiSetFieldValue("custrecord_pri_cre_request_status", REQUEST_STATUS.Failed);
				nlapiSetFieldValue("custrecord_pri_cre_request_notes", msg);
			}
		}
	}

}