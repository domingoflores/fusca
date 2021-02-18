//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------



/*
 * SuiteScript 1.0 Scheduled Script
 * 
 * Calls the appropriate CRE Profile to send all Pending Shareholder Letter Records
 * 
 */

var READY_TO_GEN_SUBLIST = 1;
var SENDING_SHAREHOLDER_LETTERS = 4;
var SHAREHOLDER_LETTERS_SENT = 5;

var LETTER_PENDING = 1; 
var LETTER_FAILED_RETRYING = 2; 
var LETTER_COMPLETED = 4; 

const COMMUNICATION_TYPE_IS_SHAREHOLDER_LETTER = 1; 

function sendShareholderLetters(method) {

	var funcName = "sendShareholderLetters " + method;

	try {

		var filters = [], columns, searchResults; 
		
		var context = nlapiGetContext();

//		var profileId = context.getSetting("SCRIPT", "custscript_srs_snd_shr_ltrs_cre_profile");

		nlapiLogExecution("DEBUG", funcName, "Process starting"); 
		
		// finds all RELEASE APPROVAL PROCESS records which are in SENDING SHAREHOLDER LETTERS status
		//	for each one, 
		//		finds all Shareholder Letters which are in PENDING status
		//		send them
		//		set the status of the RAP record to READY_TO_GEN_SUBLIST (back to original state)

		var totalFailCount = 0, totalSuccessCount = 0;
		
		var batchList = findPendingReleaseApprovalRecords(); 
				
		for (var b = 0; b < batchList.length; b++) {
			var rapId = batchList[b].rapId; 
			
			var pendingLetters = findPendingLetters(rapId); 
			
			var failCount = 0, successCount = 0; 
			
			nlapiLogExecution("DEBUG", funcName, "Processing Release Approval Record " + batchList[b].name + " (" + rapId + ")"); 
			
			for (var p = 0; p < pendingLetters.length; p++) {
				
				var letterId = pendingLetters[p].letterId; 
				var profileId = pendingLetters[p].profileId;
				
				try {
					
					nlapiLogExecution("DEBUG", funcName, "Sending letter id " + letterId); 
					
					var creProfile = new CREProfile(profileId);
				    creProfile.Translate(letterId);
				    creProfile.Execute();
					
					nlapiSubmitField("customrecord_srs_shrhldr_letter",letterId,"custrecord_sl_dist_status",LETTER_COMPLETED); 					
					
					successCount++;
					totalSuccessCount++; 
					
				} catch (eSend) {
					nlapiLogExecution("ERROR", funcName, (eSend.name || eSend.getCode()) + ":" + (eSend.message || eSend.getDetails())); 
					nlapiSubmitField("customrecord_srs_shrhldr_letter",letterId,"custrecord_sl_dist_status",LETTER_FAILED_RETRYING);
					failCount++;  
					totalFailCount++;
				}
				
				if (context.getRemainingUsage() < 1000) {
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


			if (!failCount) {
				nlapiSubmitField("customrecord_escrow_payment_approvals",rapId,"custrecord_rap_shr_letter_proc_status",SHAREHOLDER_LETTERS_SENT);
				nlapiLogExecution("AUDIT", funcName, "All " + successCount + " pending Shareholder Letters for Release Approval Process " + batchList[b].name + " were successfully sent.")				
			} else
				nlapiLogExecution("AUDIT", funcName, "NOT All pending Shareholder Letters for Release Approval Process " + batchList[b].name + " were successfully sent.  " + successCount + " were sent; " + failCount + " failed."); 							
		}
		

		nlapiLogExecution("AUDIT", funcName, "Process complete.  " + totalSuccessCount + " letter(s) were sent; " + totalFailCount + " letter(s) failed.  Review the log for specifics."); 
		

	} catch (e) {		
		nlapiLogExecution("ERROR", funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}

}

// ================================================================================================================================

function findPendingLetters(rapId) {
	
	var funcName = "findPendingLetters " + rapId; 
	
	try {

		var recList = [], filters = [], columns = [];

		filters.push(new nlobjSearchFilter("custrecord_sl_dist_status", null, "anyof", [LETTER_PENDING,LETTER_FAILED_RETRYING,"@NONE@"]));
		filters.push(new nlobjSearchFilter("custrecord_rel_app_process_rec", null, "anyof", [rapId]));
		filters.push(new nlobjSearchFilter("custrecord_rc_type", null, "anyof", [COMMUNICATION_TYPE_IS_SHAREHOLDER_LETTER]));
		filters.push(new nlobjSearchFilter("isinactive", null, "is", 'F'));
		columns.push(new nlobjSearchColumn("custrecord_escrow_transaction"));
		columns.push(new nlobjSearchColumn("custrecord_rc_cre_profile")); 
		
		
		var search = nlapiCreateSearch("customrecord_srs_shrhldr_letter", filters, columns);
		
		var completeSearchResults = search.runSearch();
		var searchId = 0; 
		
		do {			
			var searchResults = completeSearchResults.getResults(searchId, searchId + 1000);
			
			nlapiLogExecution("AUDIT", funcName, "Retrieved " + searchResults.length + " search results starting at # " + searchId);
			
			for (var i = 0; i < searchResults.length; i++) {
				if (searchResults[i].getValue("custrecord_escrow_transaction"))
					recList.push({letterId: searchResults[i].getId(), profileId: searchResults[i].getValue("custrecord_rc_cre_profile")}); 
			}
				
			searchId += searchResults.length;
				
		} while (searchResults.length >= 1000);
		
				
/*******		
		var searchResults = nlapiSearchRecord("customrecord_srs_shrhldr_letter", null, filters, columns) || [];
		
		for (var i = 0; i < searchResults.length; i++) {
			if (searchResults[i].getValue("custrecord_escrow_transaction"))
				recList.push({letterId: searchResults[i].getId(), profileId: searchResults[i].getValue("custrecord_rc_cre_profile")}); 
		}
*******/		
		
		nlapiLogExecution("DEBUG", funcName, recList.length + " PENDING SHAREHOLDER LETTERS found");
		
		return recList; 

	} catch (e) {
		nlapiLogExecution("ERROR", funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
		return [];
	}
}

// ================================================================================================================================

function findPendingReleaseApprovalRecords() {
	
	var funcName = "findPendingReleaseApprovalRecords"; 
	
	try {

		var recList = [], filters = [], columns = [];
		
		filters.push(new nlobjSearchFilter("custrecord_rap_shr_letter_proc_status", null, "anyof", SENDING_SHAREHOLDER_LETTERS));
		filters.push(new nlobjSearchFilter("isinactive", null, "is", 'F'));
		columns.push(new nlobjSearchColumn("name"));
		
		var searchResults = nlapiSearchRecord("customrecord_escrow_payment_approvals", null, filters, columns) || [];
		
		for (var i = 0; i < searchResults.length; i++)
			recList.push({rapId: searchResults[i].getId(), name: searchResults[i].getValue("name")}); 
		
		
		nlapiLogExecution("DEBUG", funcName, recList.length + " PENDING RELEASE APPROVAL RECORDS found");
		
		return recList; 

	} catch (e) {
		nlapiLogExecution("ERROR", funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
		return [];
	}
	
}

// ================================================================================================================================
