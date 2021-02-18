//-----------------------------------------------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

// "use strict";
    

var BATCH_HEADER_CLIENT_SCRIPT_ID = "customscript_srs_dtr_batch_records";

function srs03_dtrBatchHeaderBeforeLoad(type, form, request) {
	
	var funcName = "srs03_batchHeaderBeforeLoad (" + type + " " + nlapiGetRecordType() + " " + nlapiGetRecordId() + ")";

	nlapiLogExecution("DEBUG", funcName, "Starting");
			
	try {

		if (type != "view") 
			return;
		
		
		// they should never edit the record directly
		
		var btn = form.getButton("edit");
		if (btn) 
			btn.setVisible(false);

		var btn = form.getButton("save");
		if (btn) 
			btn.setVisible(false);
		
		// instead, they can either kick off the "send emails" process, or they can kick off the "delete batch" process
		//		but only if the record is in the correct state

		form.setScript(BATCH_HEADER_CLIENT_SCRIPT_ID);	
		

		if (nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_REPORTS_CREATED ||
				nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_EMAILS_SENT 
				) 
			form.addButton("custpage_send_emails_button","Email Reports","srs03_sendReportsClick()");

		if (nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_REPORTS_CREATED ||
				nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_EMAILS_SENT || 
				nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_ERROR )
			form.addButton("custpage_delete_batch_button","Delete Batch","srs03_deleteBatchClick()");

		if (nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_SUBMITTED
				|| nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_IDENTIFYING_SHAREHOLDERS 
				|| nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_CREATING_REPORTS 
				) 
			form.addButton("custpage_send_emails_button","Continue Generating","srs03_continueGeneratingClick()");
		

		if (nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_SENDING_EMAILS)
			form.addButton("custpage_send_emails_button","Continue Sending","srs03_continueSendingClick()");


		if (nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_BEING_DELETED)
			form.addButton("custpage_send_emails_button","Continue Deleting","srs03_deleteBatchClick()");
		

		var msg;
		
		if (nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_IDENTIFYING_SHAREHOLDERS)
			if (nlapiGetFieldValue("custrecord_srs_dtr_hdr_report_count")) 
				msg = "Identified " + getBatchDetailCount(nlapiGetRecordId()) + " out of " + nlapiGetFieldValue("custrecord_srs_dtr_hdr_report_count") + " shareholders so far.";

		if (nlapiGetFieldValue(TAX_REPORT_BATCH_STATUS_FIELD) == TAX_REPORT_BATCH_STATUS_CREATING_REPORTS) 
			msg = "Generated " + getBatchGeneratedReportCount(nlapiGetRecordId()) + " out of " + nlapiGetFieldValue("custrecord_srs_dtr_hdr_report_count") + " reports so far.";
		
		if (msg) 
			form.addField("custpage_srs_status_msg",'label',"<font color=blue>" + msg + "</font>");

		if (nlapiGetFieldValue(TAX_REPORT_BATCH_FOLDER_ID_FIELD)) {
			var url = nlapiResolveURL("RECORD", "folder", nlapiGetFieldValue(TAX_REPORT_BATCH_FOLDER_ID_FIELD));
			
			// form.addField("custpage_srs_url",'label',url);

			// form.addField("custpage_srs_folder_url","url").setDisplayType("inline").setLinkText("folder").setDefaultValue(url);
		}
		

	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}
	
}


function getBatchDetailCount(batchId) {
	
	var filters = new Array();
	
	filters.push(new nlobjSearchFilter('custrecord_srs_dtr_dtl_header', null, 'anyof', batchId));

	var columns = new Array();

	columns.push(new nlobjSearchColumn("internalid",null,"count"));

	var searchResults = nlapiSearchRecord(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, null , filters , columns) || [];

	if (searchResults.length > 0)
		return searchResults[0].getValue("internalid",null,"count")
	else
		return 0;
	
	
}


function getBatchGeneratedReportCount(batchId) {
	
	var filters = new Array();
	
	filters.push(new nlobjSearchFilter('custrecord_srs_dtr_dtl_header', null, "anyof", batchId));
	filters.push(new nlobjSearchFilter('custrecord_srs_dtr_dtl_report', null, "noneof", "@NONE@"));

	var columns = new Array();

	columns.push(new nlobjSearchColumn("internalid",null,"count"));

	var searchResults = nlapiSearchRecord(DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID, null , filters , columns) || [];

	if (searchResults.length > 0)
		return searchResults[0].getValue("internalid",null,"count")
	else
		return 0;
	
	
}


/////////////////////////////////////////////// SUITELET ////////////////////////////////////////////////////

// since a script can't be scheduled from client script, the client must call a suitelet, and the suitelet must then call the scheduler

function srs03_scheduleGenerate(request, response) {

    var funcName = "srs03_scheduleGenerate";
    
    try {

	    if (request.getParameter("batchId")) {
	        var parms = {custscript_batch_id: request.getParameter("batchId")};
	        
	        
	        nlapiScheduleScript(GENERATE_DETAILED_TAX_REPORT_SCHEDULED_SCRIPT_ID, null, parms);
	        
	        response.write("Batch has been resubmitted to the queue.");
	        	        
	    } else {
	    	nlapiLogExecution("ERROR", funcName, "No batch id was provided.");
	    	response.write("No batch id provided.  Cannot continue batch.");
	    }
	    	
	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}	
}




function srs03_scheduleBatchDelete(request, response) {

    var funcName = "srs03_scheduleBatchDelete";
    
    try {

	    if (request.getParameter("batchId")) {
	        var parms = {custscript_delete_batch_id: request.getParameter("batchId")};
	        
	        
	        nlapiScheduleScript(DELETE_DETAILED_TAX_REPORT_BATCH_SCHEDULED_SCRIPT_ID, null, parms);
	        
	        response.write("Delete job has been scheduled.");
	        // response.write("Delete job has been scheduled.  Parms=" + JSON.stringify(parms));
	        	        
	    } else {
	    	nlapiLogExecution("ERROR", funcName, "No batch id was provided.");
	    	response.write("No batch id provided.  Cannot delete batch.");
	    }
	    	
	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}	
}



function srs03_scheduleEmailSending(request, response) {

    var funcName = "srs03_scheduleEmailSending";
    
    try {

	    if (request.getParameter("batchId")) {
	        var parms = {custscript_send_batch_id: request.getParameter("batchId")};
	        	        
	        nlapiScheduleScript(SEND_DETAILED_TAX_REPORT_BATCH_SCHEDULED_SCRIPT_ID, null, parms);
	        
	        // nlapiLogExecution("DEBUG", funcName, "Reports are being sent via script " + SEND_DETAILED_TAX_REPORT_BATCH_SCHEDULED_SCRIPT_ID + " using parms " + JSON.stringify(parms) );
	        response.write("Emails are being sent in the background.  Refresh this screen to view progress.");
	        	        
	    } else {
	    	nlapiLogExecution("ERROR", funcName, "No batch id was provided.");
	    	response.write("No batch id provided.  Cannot send reports.");
	    }
	    	
	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}	
}


/////////////////////////////////////////////// CLIENT SIDE CODE ////////////////////////////////////////////////////


// called when the user clicks the "Send Emails" button on the DTR Batch Header record

function srs03_sendReportsClick() {
	
	var funcName = "srs03_sendReportsClick";
	
	try {
		
		if (!confirm("This will email each report to the designated recipient.  If the email was previously sent, it will NOT be sent again.  \n\nAre you SURE you want to do this?"))
			return;
		
		var url = nlapiResolveURL('SUITELET', 'customscript_srs_dtr_schedule_batch_send', 'customdeploy_srs_dtr_schedule_batch_send') + '&batchId=' + nlapiGetRecordId();
		
		var objResp = nlapiRequestURL(url, null, null);
		
		alert(objResp.getBody());

        var url = nlapiResolveURL("RECORD", "customrecord_srs_tax_report_batch_header", nlapiGetRecordId());
        
        location.assign(url);
                
	} catch (e) {
		nlapiLogExecution("ERROR", funcName, e.message);
		alert("ERROR: " + e.message);
	}	
}


//called when the user clicks the "Send Emails" button on the DTR Batch Header record

function srs03_continueGeneratingClick() {
	
	var funcName = "srs03_continueGeneratingClick";
	
	try {

		if (!confirm("You should only execute this if you uploaded this batch and need to process it, or if you are fairly certain that this batch is 'stuck' and needs to be continued.  Do you want to continue?"))
			return;

		var url = nlapiResolveURL('SUITELET', 'customscript_srs_dtr_schedule_batch_gen', 'customdeploy_srs_dtr_schedule_batch_gen') + '&batchId=' + nlapiGetRecordId();
		
		var objResp = nlapiRequestURL(url, null, null);
		
		alert(objResp.getBody());

        var url = nlapiResolveURL("RECORD", "customrecord_srs_tax_report_batch_header", nlapiGetRecordId());
        
        location.assign(url);
                
	} catch (e) {
		nlapiLogExecution("ERROR", funcName, e.message);
		alert("ERROR: " + e.message);
	}	
}


//called when the user clicks the "Send Emails" button on the DTR Batch Header record

function srs03_deleteBatchClick() {
	
	var funcName = "srs03_deleteBatchClick";
	
	try {
		
		if (!confirm("This will delete the Batch Header and all the Batch Detail records.\n\nIf the PDF was already attached to a shareholder, it will NOT be deleted; otherwise it will.\n\nAre you SURE you want to do this?"))
			return;
		
		var url = nlapiResolveURL('SUITELET', 'customscript_srs_dtr_schedule_batch_del', 'customdeploy_srs_dtr_schedule_batch_del') + '&batchId=' + nlapiGetRecordId();
		
		var objResp = nlapiRequestURL(url, null, null);
		
		alert(objResp.getBody());
        
        var url = "/app/common/custom/custrecordentrylist.nl?rectype=621";
        
        location.assign(url);
		
		return;

	} catch (e) {
		nlapiLogExecution("ERROR", funcName, e.message);
		alert("ERROR: " + e.message);
	}	
}




