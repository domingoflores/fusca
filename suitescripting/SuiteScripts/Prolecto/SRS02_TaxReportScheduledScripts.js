//-----------------------------------------------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------



function srs02_GenerateDetailedTaxReport(method) {
	
	var funcName = "srs02_GenerateDetailedTaxReport " + method;
	
	try {

		var context = nlapiGetContext();

		var batchId = context.getSetting("SCRIPT", "custscript_batch_id");
		
		nlapiLogExecution("AUDIT", funcName, "Starting with batch id " + batchId);
		
		// if one was provided, run it now
		if (batchId) 
			srs02_GenerateDetailedTaxReportBatch(batchId);
		
		// now find any batches which are still waiting to run, and run them
		
		var filters = [], columns, searchResults; 
		
		filters.push(new nlobjSearchFilter(TAX_REPORT_BATCH_STATUS_FIELD, null, "anyof", [TAX_REPORT_BATCH_STATUS_SUBMITTED,TAX_REPORT_BATCH_STATUS_IDENTIFYING_SHAREHOLDERS,TAX_REPORT_BATCH_STATUS_CREATING_REPORTS]));

		var searchResults = nlapiSearchRecord(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, null, filters, null) || [];
		
		for (var i = 0; i < searchResults.length; i++) {
			srs02_GenerateDetailedTaxReportBatch(searchResults[i].getId());
			
			if (context.getRemainingUsage() < 1000)
				return;
			
		}
		
	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}
	
}



function srs02_GenerateDetailedTaxReportBatch(batchId) {
	
	var funcName = "srs02_GenerateDetailedTaxReportBatch " + batchId;
	
	try {

		var context = nlapiGetContext();

		// var batchId = context.getSetting("SCRIPT", "custscript_batch_id");
		var creProfileId = context.getSetting("SCRIPT", "custscript_dtr_cre_profile");
		var rootFolderName = context.getSetting("SCRIPT", "custscript_srs_dtr_folder_name");
		
		nlapiLogExecution("DEBUG", funcName, "creProfileId=" + creProfileId);
		nlapiLogExecution("DEBUG", funcName, "rootFolderName (from COMPANY parameters)=" + rootFolderName);
		
		var BATCH = nlapiLoadRecord(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, batchId);
		
		if (!BATCH) {
			nlapiLogExecution("ERROR", funcName, "Unable to load batch record.");
			return;
		}
		
		// if (BATCH.getFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) != TAX_REPORT_BATCH_STATUS_SUBMITTED) {
		// 	nlapiLogExecution
		// }
		
		if (!BATCH.getFieldValue(TAX_REPORT_BATCH_STATE_FIELD)) 
			BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD,JSON.stringify({}));
			
		var batchState = JSON.parse(BATCH.getFieldValue(TAX_REPORT_BATCH_STATE_FIELD));
	
		var taxYear = BATCH.getFieldValue("custrecord_srs_dtr_hdr_tax_year");

		var dealId = BATCH.getFieldValue("custrecord_srs_dtr_hdr_deal");
		var onlyActivityForThisDeal = BATCH.getFieldValue("custrecord_srs_dtr_hdr_only_this_deal");
		var shareholderId = BATCH.getFieldValue("custrecord_srs_dtr_hdr_shareholder");
		
		// nlapiLogExecution("AUDIT", funcName, "this deal=" + onlyActivityForThisDeal);
		
		// we may be running this in "continuation" mode, so first determine what "state" we're in, and execute accordingly

		var folderId; 
		
		nlapiLogExecution("AUDIT", funcName, "Processing Batch " + batchId + " with status " + BATCH.getFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) + " and state " + BATCH.getFieldValue(TAX_REPORT_BATCH_STATE_FIELD));
		
		
		if (BATCH.getFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_SUBMITTED) {
			
			batchState.batchDetailsList = [];
			
			nlapiLogExecution("AUDIT", funcName, "in step 1");
			
			
			var shareholderList = srs00_findShareholdersWithActivity(taxYear, shareholderId, dealId);
			
			if (shareholderList.length == 0) {
				nlapiLogExecution("ERROR", funcName, "No shareholders found with this criteria.  Exiting");
				BATCH.setFieldValue(TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_ERROR);				
				BATCH.setFieldValue(TAX_REPORT_BATCH_ERROR_MSG_FIELD, "No shareholders found with this criteria.");				
				BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD, JSON.stringify(batchState));
				nlapiSubmitRecord(BATCH);
						
				return;
			}
			
			nlapiLogExecution("AUDIT", funcName, "Returned " + shareholderList.length + " shareholders");
		
			batchState.shareHolders = shareholderList.reverse();			
			
				
			BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD, JSON.stringify(batchState));
			BATCH.setFieldValue(TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_IDENTIFYING_SHAREHOLDERS);
			BATCH.setFieldValue("custrecord_srs_dtr_hdr_report_count", shareholderList.length);
			

			// now, create a subfolder for this batch, under the root folder name
			
			var rootFolderId = srs00_findFileByName(rootFolderName);
			nlapiLogExecution("DEBUG", funcName, "Root Folder=" + rootFolderId);
			
			if (rootFolderId) {
				var F = nlapiCreateRecord("folder");
				
				var folderName = BATCH.getFieldValue("id");
				if (BATCH.getFieldText("custrecord_srs_dtr_hdr_deal"))
					folderName += " : " + BATCH.getFieldText("custrecord_srs_dtr_hdr_deal");
				if (BATCH.getFieldText("custrecord_srs_dtr_hdr_shareholder"))
					folderName += " : " + BATCH.getFieldText("custrecord_srs_dtr_hdr_shareholder");
				
				
				F.setFieldValue("description","Contains Detailed Tax Reports for Batch # " + BATCH.getFieldValue("id"));
				F.setFieldValue("name", folderName);
				F.setFieldValue("parent", rootFolderId);
				
				folderId = nlapiSubmitRecord(F);
				
				nlapiLogExecution("DEBUG", funcName, "New Folder=" + folderId);
				BATCH.setFieldValue(TAX_REPORT_BATCH_FOLDER_ID_FIELD, folderId);
				
			} 
				
			nlapiSubmitRecord(BATCH);

		} else {
			folderId = BATCH.getFieldValue(TAX_REPORT_BATCH_FOLDER_ID_FIELD);
		}
		
			
		
		if (BATCH.getFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_IDENTIFYING_SHAREHOLDERS) {
			
			nlapiLogExecution("AUDIT", funcName, "in step 2");

			// now loop through all the shareholders and create the necessary bath detail record for each of them
			
			var batchDetailList = batchState.batchDetailsList;  // in case we are returning
			
			var batchDetailId; // will hold the ID of each batch detail record, as it is built
			
			
			do {
				shareholderId = batchState.shareHolders.pop();
				
				var DTL = nlapiCreateRecord(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID);
				
				// run a search to find all the applicable exchange records and 
				
				var exchangeRecords = [];
				
				// if request is to narrow down to this deal only, then pass the deal to the search
				if (dealId && (onlyActivityForThisDeal == 'T'))
					exchangeRecords = srs02_findApplicableExchangeRecords(taxYear, shareholderId, dealId);
				else
					// otherwise all activity for this shareholder
					exchangeRecords = srs02_findApplicableExchangeRecords(taxYear, shareholderId);
					
				
				
				if (exchangeRecords.length > 0) {
					nlapiLogExecution("AUDIT", funcName, "Found " + exchangeRecords.length + " exchange records for shareholder " + shareholderId + "; Remaining Usage=" + context.getRemainingUsage());
						
					DTL.setFieldValue("custrecord_srs_dtr_dtl_header", batchId);
					DTL.setFieldValues("custrecord_srs_dtr_dtl_exchange_list", exchangeRecords);
					DTL.setFieldValue("custrecord_srs_dtr_dtl_shareholder", shareholderId);
					DTL.setFieldValue("custrecord_srs_dtr_dtl_tax_year", taxYear);
					
					// DTL.setFieldValue("custrecord_tax_dtl_shareholder_name", nlapiLookupField("customer", shareholderId, "name"));
					
					
					var batchDetailId = nlapiSubmitRecord(DTL);
					
					// add the detail record to the list of records which will need to be generated
					batchDetailList.push(batchDetailId);			
					batchState.batchDetails = batchDetailList;
	
					BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD, JSON.stringify(batchState));
					nlapiSubmitRecord(BATCH);				
				} else
					nlapiLogExecution("ERROR", funcName, "Expected to find Exchange Records for Shareholder " + shareholderId + " but found none.");
	
				// always bow to the governor
				if (context.getRemainingUsage() < 1000) {
					nlapiLogExecution("AUDIT", funcName, "Rescheduling script due to usage limitations (a).");

	                var parms = {custscript_batch_id: batchId};

					nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), parms);
					return;

					/*
					nlapiLogExecution("AUDIT", funcName, "Yielding script due to usage limitations (a).");
					var yieldState = nlapiYieldScript();
					if (yieldState.status == 'FAILURE') {
						nlapiLogExecution("ERROR",funcName, "Failed to yield script, exiting: Reason = "+ yieldState.reason + " Size = "+ yieldState.size);
						BATCH.setFieldValue(TAX_REPORT_BATCH_ERROR_MSG_FIELD, "Failed to yield script, exiting: Reason = "+ yieldState.reason + " Size = "+ yieldState.size);				
						BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD, JSON.stringify(batchState));
						nlapiSubmitRecord(BATCH);
						return;
					} else if (yieldState.status == 'RESUME' ) {
						nlapiLogExecution("AUDIT", funcName, "Resuming script because of " + yieldState.reason+". Size = "+ yieldState.size);
					}
					*/				
				}
					
			} while (batchState.shareHolders.length > 0);

			batchState.batchDetails.reverse();	// since we use the pop() method (which takes items from the end), reverse it, so that we process these in correct sequence
			
			BATCH.setFieldValue(TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_CREATING_REPORTS);
			BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD, JSON.stringify(batchState));
			nlapiSubmitRecord(BATCH);

		}
		
		
		
		if (BATCH.getFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_CREATING_REPORTS) {

			nlapiLogExecution("AUDIT", funcName, "in step 3");

			// all the batch details have been built, now we can start hacking against the CRE one record at a time
			
			if (batchState.batchDetails.length == 0) {
				nlapiLogExecution("ERROR", funcName, "No shareholders were identified for tax reporting.  Exiting.");
				return;
			}
			
			do {
				var detailId = batchState.batchDetails.pop();
				
				var DTL = nlapiLoadRecord(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, detailId);
	
				srs02_generateReportForShareholder(DTL, creProfileId, BATCH.getFieldValue(TAX_REPORT_BATCH_FOLDER_ID_FIELD));
							
				nlapiSubmitRecord(DTL);
	
				DTL = null;
				
				BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD, JSON.stringify(batchState));
				nlapiSubmitRecord(BATCH);				
	
				// always bow to the governor
				if (context.getRemainingUsage() < 1000) {
					nlapiLogExecution("AUDIT", funcName, "Rescheduling script due to usage limitations (b).");

					var parms = {custscript_batch_id: batchId};

					nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), parms);
					return;
					
					/*
					nlapiLogExecution("AUDIT", funcName, "Yielding script due to usage limitations. (b) -- " + batchState.batchDetails.length + " reports left to generate.");
					var yieldState = nlapiYieldScript();
					if (yieldState.status == 'FAILURE') {
						nlapiLogExecution("ERROR",funcName, "Failed to yield script, exiting: Reason = "+ yieldState.reason + " Size = "+ yieldState.size);
						BATCH.setFieldValue(TAX_REPORT_BATCH_ERROR_MSG_FIELD, "Failed to yield script, exiting: Reason = "+ yieldState.reason + " Size = "+ yieldState.size);									
						BATCH.setFieldValue(TAX_REPORT_BATCH_STATE_FIELD, JSON.stringify(batchState));
						BATCH.setFieldValue(TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_ERROR);
						nlapiSubmitRecord(BATCH);
						return;
					} else if (yieldState.status == 'RESUME' ) {
						nlapiLogExecution("AUDIT", funcName, "Resuming script because of " + yieldState.reason+". Size = "+ yieldState.size);
					}
					*/				
				}
					
			} while (batchState.batchDetails.length > 0);
			
	
			BATCH.setFieldValue(TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_REPORTS_CREATED);
			nlapiSubmitRecord(BATCH);
			
			nlapiLogExecution("AUDIT", funcName, "Processing for batch " + batchId + " has been completed.  All reports generated and ready to be sent.");
		
		}
		

	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));

		// if we have a batch record, then set its status to error so that no further actions can be done with it later
		if (BATCH) {
			BATCH.setFieldValue(TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_ERROR);
			BATCH.setFieldValue(TAX_REPORT_BATCH_ERROR_MSG_FIELD, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));									
			nlapiSubmitRecord(BATCH);			
		}
		return;
	}
	
}


function srs02_generateReportForShareholder(DTL, creProfileId, folderId) {
	
	var funcName = "srs02_generateReportForShareholder";
	
	var context = nlapiGetContext();

	try {

		nlapiLogExecution("AUDIT", funcName, "Generating Report for " + DTL.getFieldText("custrecord_srs_dtr_dtl_shareholder") + "; Remaining Usage=" + context.getRemainingUsage())
		// call the CRE to generate the PDF
		
		var creProfile = new CREProfile(creProfileId);
		creProfile.Translate(DTL.getFieldValue("id"));
		
		// nlapiLogExecution("DEBUG", funcName, "Profile has been translated.  Now Executing...");
		
		creProfile.Execute();				

		// now store the output in the detail record
		
		// DTL.setFieldValue("custrecord_sender", creProfile.fields.Sender.translatedValue);
		DTL.setFieldValue("custrecord_srs_dtr_dtl_recipient", creProfile.fields.Recipient.translatedValue);
		DTL.setFieldValue("custrecord_srs_dtr_dtl_subject", creProfile.fields.Subject.translatedValue);
		DTL.setFieldValue("custrecord_srs_dtr_dtl_body_introduction", creProfile.fields.BodyMessageIntroduction.translatedValue);
		// DTL.setFieldValue("custrecord_srs_dtr_dtl_body", creProfile.fields.BodyTemplate.translatedValue);
		
		var pdfDoc = creProfile.fields.DocumentName.file;
		
		// nlapiLogExecution("DEBUG", funcName, "File=" + pdfDoc);
		
		if (pdfDoc) {			
			DTL.setFieldValue("custrecord_srs_dtr_dtl_report", pdfDoc.getId());
			pdfDoc.setFolder(folderId);
			nlapiSubmitFile(pdfDoc);
		}
		
		pdfDoc = null;
		creProfile = null;
		
	} catch (e) {		
		nlapiLogExecution("ERROR", funcName, (e instanceof nlobjError) ? (e.getCode() + " : " + e.getDetails() + " : " + e.getStackTrace().join(":") + " : " + e.getUserEvent()) : (e.name + " : " + e.message));
		DTL.setFieldValue("custrecord_srs_dtr_dtl_error_msg", (e instanceof nlobjError) ? (e.getCode() + " : " + e.getDetails() + " : " + e.getStackTrace().join(":") + " : " + e.getUserEvent()) : (e.name + " : " + e.message));
	}

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//scheduled script to delete an entire batch, and its associated PDFs (unless they were already emailed, and thus attached to shareholders)

function srs02_DeleteBatch(method) {
	
	var funcName = "srs02_DeleteBatch " + method;
	
	try {

		var filters = [], columns, searchResults; 
		
		var context = nlapiGetContext();

		var batchId = context.getSetting("SCRIPT", "custscript_delete_batch_id");

		nlapiLogExecution("DEBUG", funcName, "batchId=" + batchId);
		
		if (!batchId || batchId == 0) {
			nlapiLogExecution("ERROR", funcName, "No batch provided.  Exiting");
			return;
		}
			

		nlapiLogExecution("DEBUG", funcName, "Starting with batchID=" + batchId);
			
		filters.push(new nlobjSearchFilter("custrecord_srs_dtr_dtl_header", null, "anyof", batchId));
	
		var search = nlapiCreateSearch(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, filters);
		
		var completeSearchResults = search.runSearch();
	
		var searchId = 0;
		customerList = [];
		var delCount = 0;
	
		do {			
			var searchResults = completeSearchResults.getResults(searchId, searchId + 1000);
			
			nlapiLogExecution("AUDIT", funcName, "Retrieved " + searchResults.length + " search results starting at # " + searchId);
			
			for (var i = 0; i < searchResults.length; i++) {
				
				var alreadySentFlag = nlapiLookupField(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, searchResults[i].getId(), "custrecord_srs_dtr_dtl_sent_flag");
						
				delCount += 1;
				nlapiLogExecution("DEBUG", funcName, "Deleting # " + delCount + " -- batch detail id " + searchResults[i].getId() + " -- sent flag=[" + alreadySentFlag + "]; Remaining Usage=" + context.getRemainingUsage());
				
				if (alreadySentFlag != 'T') {
					var fileId = nlapiLookupField(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, searchResults[i].getId(), "custrecord_srs_dtr_dtl_report");
					if (fileId)
						nlapiDeleteFile(fileId);				
				}

				nlapiDeleteRecord(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, searchResults[i].getId());
							
				if (context.getRemainingUsage() < 1000) {
					nlapiLogExecution("AUDIT", funcName, "Rescheduling script due to usage limitations (a).");
						                
	    	        var parms = {custscript_delete_batch_id: batchId};

					nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), parms);
					return;
					
					/*
					nlapiLogExecution("AUDIT", funcName, "Yielding script due to usage limitations.");
					var yieldState = nlapiYieldScript();
					if (yieldState.status == 'FAILURE') {
						nlapiLogExecution("ERROR",funcName, "Failed to yield script, exiting: Reason = "+ yieldState.reason + " Size = "+ yieldState.size);
						return;
					} else if (yieldState.status == 'RESUME' ) {
						nlapiLogExecution("AUDIT", funcName, "Resuming script because of " + yieldState.reason+". Size = "+ yieldState.size);
					}
					*/				
				}
				
			}
				
			searchId += searchResults.length;
			
		} while (searchResults.length >= 1000);
		
		
		try {
			var folderId = nlapiLookupField(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, batchId, TAX_REPORT_BATCH_FOLDER_ID_FIELD);
			if (folderId) {
				nlapiDeleteRecord("folder", folderId);
				nlapiLogExecution("DEBUG", funcName, "Deleted folder " + folderId);				
			} 
		} catch (folderError) {
			nlapiLogExecution("ERROR", funcName, "Failed to delete folder " + folderId + " script continuing anyway.");			
		}
		
		nlapiDeleteRecord(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, batchId);
		
		nlapiLogExecution("AUDIT", funcName, "Batch " + batchId + " and all (" + searchResults.length + ") detail record(s) have been deleted.");
		
		
	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// scheduled script to send (email) all the completed reports

function srs02_SendBatch(method) {

	var funcName = "srs02_SendBatch " + method;

	try {

		var filters = [], columns, searchResults; 
		
		var context = nlapiGetContext();

		var batchId = context.getSetting("SCRIPT", "custscript_send_batch_id");
		var senderId = context.getSetting("SCRIPT", "custscript_srs_email_sender");

		nlapiLogExecution("DEBUG", funcName, "batchId=" + batchId);
		
		
		if (!batchId || batchId == 0) {
			nlapiLogExecution("ERROR", funcName, "No batch provided.  Exiting");
			return;
		}
			

		nlapiLogExecution("AUDIT", funcName, "Sending all unsent reports for batchID=" + batchId);

		nlapiSubmitField(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, batchId, TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_SENDING_EMAILS);
				
		filters.push(new nlobjSearchFilter("custrecord_srs_dtr_dtl_header", null, "anyof", batchId));
		filters.push(new nlobjSearchFilter("custrecord_srs_dtr_dtl_sent_flag", null, "is", 'F'));
		filters.push(new nlobjSearchFilter("custrecord_srs_dtr_dtl_recipient", null, "isnotempty"));
		
		var searchResults = nlapiSearchRecord(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, null, filters, null) || [];
		
		var detailId = null;
		
		var sentCount = 0;
		
		for (var i = 0; i < searchResults.length; i++) {
			
			var DTL = nlapiLoadRecord(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, searchResults[i].getId());

			detailId = searchResults[i].getId();

			var records = [];
			records['entity'] = DTL.getFieldValue("custrecord_srs_dtr_dtl_shareholder");
			
			var f = nlapiLoadFile(DTL.getFieldValue("custrecord_srs_dtr_dtl_report"));
			
			try {
				nlapiSendEmail(senderId, DTL.getFieldValue("custrecord_srs_dtr_dtl_recipient"), 
						DTL.getFieldValue("custrecord_srs_dtr_dtl_subject"), 
						DTL.getFieldValue("custrecord_srs_dtr_dtl_body_introduction"), null, null, records, f); 

				nlapiSubmitField(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, searchResults[i].getId(), "custrecord_srs_dtr_dtl_sent_flag", 'T');
				
				nlapiLogExecution("DEBUG", funcName, "Report for shareholder " + DTL.getFieldText("custrecord_srs_dtr_dtl_shareholder") + " sent to " + DTL.getFieldValue("custrecord_srs_dtr_dtl_recipient"));
				
				sentCount += 1;
			} catch (sendError) {
				nlapiSubmitField(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, detailId, "custrecord_srs_dtr_dtl_error_msg", (sendError.name || sendError.getCode()) + ":" + (sendError.message || sendError.getDetails()));				
			}
			
			if (context.getRemainingUsage() < 1000) {
				detailId = null;
				nlapiLogExecution("AUDIT", funcName, "Yielding script due to usage limitations.");
				var yieldState = nlapiYieldScript();
				if (yieldState.status == 'FAILURE') {
					nlapiLogExecution("ERROR",funcName, "Failed to yield script, exiting: Reason = "+ yieldState.reason + " Size = "+ yieldState.size);
					return;
				} else if (yieldState.status == 'RESUME' ) {
					nlapiLogExecution("AUDIT", funcName, "Resuming script because of " + yieldState.reason+". Size = "+ yieldState.size);
				}				
			}
		}

		detailId = null;
		
		nlapiSubmitField(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, batchId, TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_EMAILS_SENT);

		nlapiLogExecution("AUDIT", funcName, "Sending completed for batch " + batchId + "; " + sentCount + " report(s) sent.");
		

	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
		if (detailId) 
			nlapiSubmitField(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, detailId, "custrecord_srs_dtr_dtl_error_msg", (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));				
		else
			nlapiSubmitField(DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID, batchId, TAX_REPORT_BATCH_STATUS_FIELD, TAX_REPORT_BATCH_STATUS_ERROR);
	}

}

	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// this function returns an array of exchange records that are "reportable" for a given shareholder in a given calendar year (and related to a specific deal, if supplied)

function srs02_findApplicableExchangeRecords(taxYear, shareholderId, dealId) {
	
    "use strict";

	var funcName = "srs02_findApplicableExchangeRecords year=" + taxYear + " shareholder=" + shareholderId + " deal=" + dealId;
	
	try {

		exchangeList = [];

		var search = nlapiLoadSearch("customrecord_acq_lot", REPORTABLE_EXCHANGE_RECORDS_FOR_SHAREHOLDER_SEARCH_ID);		// was a transaction search
		// related_trans (for credit memo) or related_refund (for customer refund)
		search.addFilter(new nlobjSearchFilter("trandate","CUSTRECORD_ACQ_LOTH_RELATED_TRANS","within","01/01/" + taxYear, "12/31/" + taxYear));
		
		if (dealId) 
		 	search.addFilter(new nlobjSearchFilter("custrecord_acq_loth_zzz_zzz_deal", null,"anyof",dealId));
		if (shareholderId) 
			search.addFilter(new nlobjSearchFilter("custrecord_acq_loth_zzz_zzz_shareholder", null,"anyof",shareholderId));
			
		var completeSearchResults = search.runSearch();
		
		var searchId = 0;
		exchangeList = [];

		nlapiLogExecution("DEBUG", funcName, "Search Completed");
		
		
		do {			
			var searchResults = completeSearchResults.getResults(searchId, searchId + 1000);
			
			for (var i = 0; i < searchResults.length; i++)
				exchangeList.push(searchResults[i].getId())

			searchId += searchResults.length;
			
		} while (searchResults.length >= 1000);
		
		return exchangeList;
		
	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
		return [];
	}
	
}

