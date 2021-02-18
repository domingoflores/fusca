//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

// "use strict";
    

/*
 * 
 * This is a USER EVENT script on the Escrow Agent Batch Detail record.  It controls status changes, and ensures that in order for a detail record to move to APPROVED, a PDF is first generated
 * 
 * 
 */

const EDIT_ERROR_MSG = "Only users from GLOBAL BUSINESS DEVELOPMENT, ACQUIOM OPERATIONS, or DATA MANAGEMENT & RELEASE are authorized to edit this record."; 

const ADMINISTRATOR = 3; 
const RESTLET_ADMINISTRATOR = 1072;
const CUSTOM_ADMINISTRATOR = 1050; 

const GLOBAL_BUSINESS_DEVELOPMENT = 4;
const ACQUIOM_OPERATIONS = 35;
const DATA_MANAGEMENT_AND_RELEASE = 34; 


function userIsAuthorizedToEdit() {	
	var userRole = nlapiGetRole();  
	var userDept = nlapiGetDepartment();  
		
	return (userDept  == GLOBAL_BUSINESS_DEVELOPMENT || userDept == ACQUIOM_OPERATIONS || userDept == DATA_MANAGEMENT_AND_RELEASE || userRole == ADMINISTRATOR || userRole == RESTLET_ADMINISTRATOR || userRole == CUSTOM_ADMINISTRATOR);
	
}

function eaeStatementBatchDetail_beforeLoad(type, form, request) {
	
	var funcName = "eaeStatementBatchDetail_beforeLoad(" + type + " " + nlapiGetRecordType() + " " + nlapiGetRecordId() + ")";

	if (type == "edit" || type == "xedit" || type == "delete")
		if (!userIsAuthorizedToEdit())
			throw EDIT_ERROR_MSG;   
}


/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


function eaeStatementBatchDetail_beforeSubmit(type, form, request) {
	
	var funcName = "eaeStatementBatchDetail_beforeSubmit (" + type + " " + nlapiGetRecordType() + " " + nlapiGetRecordId() + ")";

	const CRE_PROFILE_ID = 22; 
	
	var AEA_STATEMENT_DETAIL_STATUS = {
		GENERATED:			1,
		APPROVED:			2,
		REJECTED:			3,
		SENT:				4
	}; 
	
	
	nlapiLogExecution("DEBUG", funcName, "Starting");

	if (type == "edit" || type == "xedit" || type == "delete")
		if (!userIsAuthorizedToEdit())
			throw EDIT_ERROR_MSG;   

	if (type == "delete") 
		if (nlapiGetFieldValue("custrecord_easd_status") == AEA_STATEMENT_DETAIL_STATUS.SENT) 
			throw "You may not delete a Detail record which has been SENT.";
	

	if (type == "edit" || type == "xedit") {
		var statusChanged = false;

		var OLD = nlapiGetOldRecord();

		if (type == "edit") {
			var OLD = nlapiGetOldRecord();
			
			nlapiLogExecution("DEBUG", funcName, "curr=" + nlapiGetFieldValue("custrecord_easd_status") + ";   OLD=" + OLD.getFieldValue("custrecord_easd_status")); 
			
			if (nlapiGetFieldValue("custrecord_easd_status") != OLD.getFieldValue("custrecord_easd_status"))
				statusChanged = true;
		}

		if (type == "xedit") {
			var fieldList = nlapiGetNewRecord().getAllFields(); 
			for (var i = 0; i < fieldList.length; i++)
				if (fieldList[i] == "custrecord_easd_status")
					statusChanged = true;
		}
		
		nlapiLogExecution("DEBUG", funcName, "stat changed=" + statusChanged); 
		
		// the CREATE PREVIEW is set in the Map/Reduce script which creates the records 
		
		if (statusChanged) {
			nlapiSetFieldValue("custrecord_easd_error_msg", ""); 
			
			// only certain status changes are allowed
			if (OLD.getFieldValue("custrecord_easd_status") == AEA_STATEMENT_DETAIL_STATUS.SENT)
				throw "The STATUS of a SENT detail record may not be changed.";
			
			// if user is trying to move to APPROVED status, then generate the PDF, etc.
			if (nlapiGetFieldValue("custrecord_easd_status") == AEA_STATEMENT_DETAIL_STATUS.APPROVED) {
				
				var creProfile = new CREProfile(CRE_PROFILE_ID);		
				creProfile.Translate(nlapiGetRecordId());	
			    creProfile.Execute();
								    	    
				if (!creProfile.fields.DocumentName.translatedValue)
					throw nlapiCreateError(funcName, "CRE did not successfully create a PDF.  Review the error logs for details");
				
				var folderId = nlapiLookupField("customrecord_escrow_agent_stmt_batch",OLD.getFieldValue("custrecord_easd_batch_id"), "custrecord_easb_folder_id"); 
				
			    var fileId = creProfile.fields.DocumentName.file.id;
				var FILE = nlapiLoadFile(fileId);

				
				if (!FILE){
					throw nlapiCreateError(funcName, "Unable to load file for move operation: " +  creProfile.fields.DocumentName.translatedValue);
				};
				
				FILE.setFolder(folderId);
				nlapiSubmitFile(FILE);
			    
				var fileURL = "/core/media/previewmedia.nl?id=" + fileId;
				
				nlapiSetFieldValue("custrecord_easd_statement", fileId);
				
				nlapiSetFieldValue("custrecord_easd_preview_link", fileURL); 								

			} else {
				if (nlapiGetFieldValue("custrecord_easd_status") != AEA_STATEMENT_DETAIL_STATUS.SENT) {
					// set the link to be a true PREVIEW
					var linkURL = nlapiResolveURL('SUITELET', 'customscript_pri_cre_profile_test','customdeploy_pri_comm_profile_suitelet', null) + "&custpage_profile=" + CRE_PROFILE_ID + "&custpage_recid=" + nlapiGetRecordId() + "&selectedtab=custpage_filepreviewtab"; 
					nlapiSetFieldValue("custrecord_easd_preview_link", linkURL); 								
					nlapiSetFieldValue("custrecord_easd_statement", "");						
				}
			}
		}
		
	}
}
