//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------


/*
 * 
 * Prolecto Record Import/Export Manager (RIEM)
 * 		performs the last step of the EXPORT process by calling the CRE profile to generate the file
 * 
 */



function pri_RIEM_GenerateOutputFile(method) {
	
	var funcName = "pri_RIEM_GenerateOutputFile " + method;

	var PROCESS_TYPE = {IMPORT: 1, EXPORT: 2};
	
	var JOB_STATUS = {PENDING: 1, EXPORT_RECORD_SELECTION: 2, READY_TO_CREATE_EXPORT_FILE: 3, EXPORT_FILE_CREATION_IN_PROGRESS: 4, COMPLETED: 8, COMPLETED_WITH_ERRORS: 9};
	

	var JOB_ID = "customrecord_pri_riem_job";
	var JOB_TYPE_ID = "customrecord_pri_riem_job_type";
	var JOB_TYPE_JOIN_ID = "custrecord_pri_riem_job_type";
	
	nlapiLogExecution("DEBUG", funcName, "Starting");
	
	var context = nlapiGetContext();
	
	var filters = []; 
	
	filters.push(new nlobjSearchFilter("isinactive", null, "is","F"));
	filters.push(new nlobjSearchFilter("custrecord_pri_riem_jobt_process_type", JOB_TYPE_JOIN_ID, "anyof",PROCESS_TYPE.EXPORT));
	filters.push(new nlobjSearchFilter("custrecord_pri_riem_job_status", null, "anyof",JOB_STATUS.READY_TO_CREATE_EXPORT_FILE));

	var columns = [];
	
	columns.push(new nlobjSearchColumn("custrecord_pri_riem_jobt_folder_id",JOB_TYPE_JOIN_ID));
	columns.push(new nlobjSearchColumn("custrecord_pri_riem_jobt_exp_cre_profile",JOB_TYPE_JOIN_ID));
	
	nlapiLogExecution("DEBUG", funcName, "FILTERS=" + JSON.stringify(filters));
	
	var searchResults = nlapiSearchRecord(JOB_ID, null, filters, columns) || [];
	
	nlapiLogExecution("DEBUG", funcName, "Found " + searchResults.length + " rows");
		
	for (var i = 0; i < searchResults.length; i++) {
		
		try {
		
			nlapiLogExecution("DEBUG", funcName, "Processing Job " + searchResults[i].getId());

			var JOB = nlapiLoadRecord(JOB_ID, searchResults[i].getId());			
			JOB.setFieldValue("custrecord_pri_riem_job_status",JOB_STATUS.EXPORT_FILE_CREATION_IN_PROGRESS);
			nlapiSubmitRecord(JOB);

			var JOB = nlapiLoadRecord(JOB_ID, searchResults[i].getId());			

			// var msg = "";

			var profileId = searchResults[i].getValue("custrecord_pri_riem_jobt_exp_cre_profile",JOB_TYPE_JOIN_ID);
			
			var creProfile = new CREProfile(profileId);		
			creProfile.Translate(searchResults[i].getId());	
		    creProfile.Execute();
			
		    	    
			if (!creProfile.fields.DocumentName.translatedValue){				
			 throw nlapiCreateError(funcName, "CRE Profile did not generate a document");
			};
			
			
		    var fileId = creProfile.fields.DocumentName.file.id;
			var file = nlapiLoadFile(fileId);

			file.setFolder(searchResults[i].getValue("custrecord_pri_riem_jobt_folder_id",JOB_TYPE_JOIN_ID));
			nlapiSubmitFile(file);
			
			if (JOB.getFieldValue("custrecord_pri_riem_job_message"))
				JOB.setFieldValue("custrecord_pri_riem_job_status",JOB_STATUS.COMPLETED_WITH_ERRORS);
			else
				JOB.setFieldValue("custrecord_pri_riem_job_status",JOB_STATUS.COMPLETED);
				
			// JOB.setFieldValue("custrecord_pri_riem_job_message",msg);	
			JOB.setFieldValue("custrecord_pri_riem_job_file", fileId);
	    	
			nlapiSubmitRecord(JOB);
			
			if (context.getRemainingUsage() < 1000) {				
				return;
			}

			
		} catch (e) {		
			JOB.setFieldValue("custrecord_pri_riem_job_message",JSON.stringify(e.message));	
			JOB.setFieldValue("custrecord_pri_riem_job_status",JOB_STATUS.COMPLETED_WITH_ERRORS);
			nlapiSubmitRecord(JOB);
			nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
		}

	}
	
	
}



