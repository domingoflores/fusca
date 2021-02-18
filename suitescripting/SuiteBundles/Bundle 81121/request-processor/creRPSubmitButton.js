//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

var SCHEDULE_SCRIPT_ID = "customscript_pri_cre_process_headers";
var SCHEDULE_DEPLOY_ID = "customdeploy_pri_cre_process_headers";

var REQUEST_STATUS = {

	"Open" : 1,
	"InProgress" : 2,
	"Failed" : 3,
	"Completed" : 4,
	"Initializing" : 5
};
// ------------------------------------------------------------------
// Function: startCREExecutionProcessSuitelet
// Record:
// Subtab:
// Script Type: Suitelet
// Script ID: customscript_pri_cre_rp_execute_cre_suit
// Deployment ID: customdeploy_pri_cre_rp_execute_cre_suit
// Deployment URL:
// Description: Script that is attached to the Start CRE Processing button
// Developer: MO
// Task:
// https://app.assembla.com/spaces/prolecto/tickets/2363-cre-request-processor/details
// Date: 20161209
// ------------------------------------------------------------------
function startCREExecutionProcessSuitelet(request, response) {
	"use strict";
	var func = "startCREExecutionProcessSuitelet";
	nlapiLogExecution("DEBUG", "Start");

	var requestid = request.getParameter("requestid");

	if (requestid) {
		var params = {};
		params.custscript_pri_rp_process_header_id = requestid;

		var requestrec = nlapiLoadRecord("customrecord_pri_cre_request_header",
				requestid);
		var status = requestrec
				.getFieldValue("custrecord_pri_cre_request_header_status");

		if (parseInt(status, 10) === REQUEST_STATUS.Open) {
			// schedule
			var schedulestatus = nlapiScheduleScript(SCHEDULE_SCRIPT_ID,
					SCHEDULE_DEPLOY_ID, params);

			nlapiLogExecution("DEBUG", "Script status: ", schedulestatus);
			response.write("Script status: " + schedulestatus);
		}
	}
}

// ------------------------------------------------------------------
// Function: startCREProcessing
// Record:
// Subtab:
// Script Type: Client
// Script ID: customscript_pri_cre_rp_execute_cre
// Deployment ID: customdeploy_pri_cre_rp_execute_cre
// Deployment URL:
// Description: Script that is attached to the Start CRE Processing button
// Developer: MO
// Task:
// https://app.assembla.com/spaces/prolecto/tickets/2363-cre-request-processor/details
// Date: 20161209
// ------------------------------------------------------------------
function startCREProcessing(requestid) {
	// "use strict"; //cannot use strict due to browser compatibility issues
	var func = "startCREProcessing";
	var msg = "";
	try {
		// alert("test" + requestid);
		nlapiLogExecution("DEBUG", func + " Started " + requestid);
		//		

		var url = nlapiResolveURL("SUITELET",
				"customscript_pri_cre_rp_execute_cre_suit",
				"customdeploy_pri_cre_rp_execute_cre_suit")
				+ "&requestid=" + requestid;
		var objResp = nlapiRequestURL(url, null, null);
		var response = objResp.getBody();
		// console.log(JSON.stringify(objResp));
		// alert("Detail line processing started for header id " + requestid);
		alert("Process Detail Lines started.");
		location.reload(true);

	} catch (e) {
		if (e instanceof nlobjError) {
			msg = e.getCode() + " : " + e.getDetails();
			nlapiLogExecution("ERROR", func, e.getCode() + " : "
					+ e.getDetails());
		} else {
			msg = e.toString();
			nlapiLogExecution("ERROR", func, e.toString());
		}
		alert(msg);
	}

}

// ------------------------------------------------------------------
// Function: Execute CRE Header
// Record:
// Subtab:
// Script Type: User Event
// Script ID: customscript_pri_cre_rp_execute_btn
// Deployment ID: customdeploy_pri_cre_rp_execute_btn
// Deployment URL:
// Description: Display button for unprocessed CRE Headers.
// Developer: MO
// Task:
// https://app.assembla.com/spaces/prolecto/tickets/2363-cre-request-processor/details
// Date: 20161209
// Note: 20170609/Carl, Added a refresh button in certain condition(Marty)
// ------------------------------------------------------------------
function ExecuteCREHeaderBeforeLoad(type, form) {
	"use strict";
	var func = "ExecuteCREHeaderBeforeLoad";
	var recordid = nlapiGetRecordId();
	var status = nlapiGetFieldValue("custrecord_pri_cre_request_header_status");
	var isinactive = nlapiGetFieldValue("isinactive");
	nlapiLogExecution("DEBUG", "type " + type);
	nlapiLogExecution("DEBUG", "status " + status);
	nlapiLogExecution("DEBUG", "recordid " + recordid);
	if (recordid) {
		nlapiLogExecution("DEBUG", "recordid - ok");
		if ((parseInt(status, 10) === REQUEST_STATUS.Open)
				&& (isinactive === "F") && (String(type) === "view")) {
			form.addButton("custpage_start_cre_processing",
					"Process Detail Lines", "startCREProcessing(" + recordid
							+ ");");
			form.setScript("customscript_pri_cre_rp_execute_cre");
		} else if (parseInt(status, 10) === REQUEST_STATUS.InProgress
				|| parseInt(status, 10) === REQUEST_STATUS.Initializing) {

			form.addButton("custpage_start_cre_refresh", "Refresh",
					"btn_refresh_Click();");
			form.setScript("customscript_pri_cre_rp_execute_cre");
		}
	}
}

// ------------------------------------------------------------------
// Function: Refresh Button Client Event
// Record: PRI CRE Request Input Header
// Subtab:
// Script Type: User Event
// Script ID: customscript_pri_cre_rp_execute_btn
// Deployment ID: customdeploy_pri_cre_rp_execute_btn
// Deployment URL:
// Description: Display button for refresh CRE Headers page.
// Developer: Carl
// Task:
// https://app.assembla.com/spaces/prolecto/tickets/2871-lead-the-connection-of-cre-batch-from-input-request-to-process-request-/details
// Date: 20170609
// ------------------------------------------------------------------
function btn_refresh_Click() {

	// Void popup message
	if (window.onbeforeunload) {
		window.onbeforeunload = function() {
			null;
		};
	}

	location.href = location.href;
}