//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

var REQUEST_STATUS = {

	"Open" : 1,
	"InProgress" : 2,
	"Failed" : 3,
	"Completed" : 4,
	"Initializing" : 5

};

var CUSTOM_RECORD_IDS = {
	CRE_REQUEST_INPUT_HEADER : "customrecord_pri_cre_request_header",
	CRE_REQUEST_INPUT_DETAIL : "customrecord_pri_cre_request_detail",
	CRE_REQUEST_OPTION_GROUP : "customrecord_pri_cre_request_option_grp",
	CRE_REQUEST_OPTIONS : "customrecord_pri_cre_request_options"

};

var TESTING = {
	ON : 0
// during development 0 would omit changing status to in progress; saves some
// time.
};

var COMPLETED_STRING = "Completed";

var USAGE_THRESHOLD_BEFORE_RESCHEDULING = 1000; // reschedule if available
// usage goes below this
// number

function getRecordInternalIDNumber(recid) {
	"use strict";
	var recordurl = nlapiResolveURL("RECORD", recid);

	// return recordurl.split("=")[1];
	return /rectype=([^&]+)/.exec(recordurl)[1];
}
function generateUniqueID() {
	"use strict";
	return "xxxxxxxx".replace(/[x]/g, function(c) {
		var r = Math.random() * 16 | 0;
		return r.toString(16);
	});
}

function addnote(requestid, customrecordid, importnote) {
	"use strict";
	if (requestid && customrecordid && importnote) {
		// var handwrittennoteid = 7;
		var note = nlapiCreateRecord("note");
		note.setFieldValue("title", "Batch Import Note");
		note.setFieldValue("record", requestid);
		note.setFieldValue("recordtype", customrecordid);
		note.setFieldValue("note", importnote);
		importnote = importnote.substr(0, 4000); // ensure max width of note
		// note.setFieldValue( "notetype", handwrittennoteid );

		nlapiLogExecution("DEBUG", "Adding note record " + customrecordid
				+ ", ID: " + requestid);
		nlapiSubmitRecord(note);
	}
}
function DetailManager(params) {
	"use strict";
	var detailManager = this;
	detailManager.detailid = params.detailid;
	detailManager.headerid = params.headerid;
	detailManager.outputFolder = params.outputFolder;
	detailManager.options = params.options;

	nlapiLogExecution("audit", "DetailManager params", JSON.stringify(params));

	detailManager.status = "";
	detailManager.recordType = "";
	detailManager.recordSubTypeValue = "";
	detailManager.recordSubTypeText = "";
	detailManager.internalID = "";
	detailManager.outputDocument = "";
	detailManager.processingNotes = "";

	detailManager.getCreProfile = function() {
		var profileid = "";
		if (!detailManager.options) {
			throw "detailManager.getCreProfile: Option Group Options not defined";
		}
		if (!detailManager.options.length) {
			throw "detailManager.getCreProfile: Option Group Options not available";
		}
		detailManager.options.forEach(function(option) {
			if (option.SubTypeValue === detailManager.recordSubTypeValue) {
				profileid = option.CREProfileValue;
			}

		});
		if (!profileid) {
			throw "detailManager.getCreProfile: Option not defined for "
					+ detailManager.recordSubTypeText + " ("
					+ detailManager.recordSubTypeValue + ")";
		}
		return profileid;
	};
	detailManager.start = function() {
		var fileid = null;
		if (!detailManager.headerid) {
			throw "detailManager.start: Header ID is required";
		}
		if (!detailManager.detailid) {
			throw "detailManager.start: Detail ID is required";
		}
		if (!detailManager.outputFolder) {
			throw "detailManager.start: Output Folder ID is required";
		}
		if (!detailManager.options) {
			throw "detailManager.start: Option Group options are required.";
		}
		if (!detailManager.options.length) {
			throw "detailManager.start: Option Group options are required!";
		}

		var detailrec = nlapiLoadRecord("customrecord_pri_cre_request_detail",
				detailManager.detailid);
		if (!TESTING.ON) {
			detailrec.setFieldValue("custrecord_pri_cre_request_status",
					REQUEST_STATUS.InProgress);
			detailrec.setFieldValue("custrecord_pri_cre_request_notes", "");
		}
		nlapiSubmitRecord(detailrec);

		detailManager.recordType = detailrec
				.getFieldValue("custrecord_pri_cre_request_recordtype");
		detailManager.recordSubTypeValue = detailrec
				.getFieldValue("custrecord_pri_cre_request_recordsubtype");
		detailManager.recordSubTypeText = detailrec
				.getFieldText("custrecord_pri_cre_request_recordsubtype");
		detailManager.internalID = detailrec
				.getFieldValue("custrecord_pri_cre_request_id");

		detailManager.CREProfile = detailManager.getCreProfile();

		nlapiLogExecution("audit", "detailrec", JSON.stringify(detailrec));

		nlapiLogExecution("DEBUG", "detailManager.detailid ",
				detailManager.detailid);
		nlapiLogExecution("DEBUG", "detailManager.recordType ",
				detailManager.recordType);
		nlapiLogExecution("DEBUG", "detailManager.recordSubTypeValue ",
				detailManager.recordSubTypeValue);
		nlapiLogExecution("DEBUG", "detailManager.recordSubTypeText ",
				detailManager.recordSubTypeText);
		nlapiLogExecution("DEBUG", "detailManager.internalID ",
				detailManager.internalID);

		nlapiLogExecution("DEBUG", "detailManager.headerid ",
				detailManager.headerid);

		nlapiLogExecution("DEBUG", "detailManager.outputFolder ",
				detailManager.outputFolder);

		nlapiLogExecution("DEBUG", "detailManager.CREProfile ",
				detailManager.CREProfile);

		detailrec = nlapiLoadRecord("customrecord_pri_cre_request_detail",
				detailManager.detailid);

		var creProfile = new CREProfile(detailManager.CREProfile);
		creProfile.Translate(detailManager.internalID);

		nlapiLogExecution("audit", "detailManager.CREProfile ",
				creProfile.fields.DocumentName.TranslatedValue);
		creProfile.Execute();
		if (creProfile.fields.DocumentName.file) {
			creProfile.fields.DocumentName.file
					.setFolder(detailManager.outputFolder);
			creProfile.fields.DocumentName.file.setIsOnline(true);
			fileid = nlapiSubmitFile(creProfile.fields.DocumentName.file);
			var url = creProfile.fields.DocumentName.file.getURL();
			nlapiLogExecution("audit", "url", url);
			detailrec.setFieldValue("custrecord_pri_cre_request_output_dlink",
					url);
			detailrec.setFieldValue("custrecord_pri_cre_request_output_doc",
					fileid);
		}

		detailrec.setFieldValue("custrecord_pri_cre_request_status",
				REQUEST_STATUS.Completed);
		detailrec.setFieldValue("custrecord_pri_cre_request_notes",
				COMPLETED_STRING);
		nlapiSubmitRecord(detailrec);

		// throw "Completed a row";
	};

}

function HeaderManager(headerid) {
	"use strict";
	var headerManager = this;
	headerManager.headerid = headerid;
	headerManager.Status = "";
	headerManager.CREProfile = "";
	headerManager.optionGroup = "";
	headerManager.outputFolder = "";
	headerManager.ProcessingNotes = "";
	headerManager.options = [];
	headerManager.rescheduled = false;
	headerManager.getOutputFolderID = function(url) {
		if (!url) {
			throw "Output Folder ID Hyperlink is not specified";
		}
		if (url.indexOf("=") < 0) {
			throw "Output Folder ID Hyperlink is not defined";
		}

		return url.split("=")[1];
	};
	headerManager.isCompleted = function() {
		var retvalue = false;

		var filters = [];
		var columns = [];
		var results = null;
		filters[0] = new nlobjSearchFilter("custrecord_pri_cre_request_status",
				null, "noneof", [ REQUEST_STATUS.Open,
						REQUEST_STATUS.InProgress, REQUEST_STATUS.Failed,
						REQUEST_STATUS.Initializing ]);
		filters[1] = new nlobjSearchFilter("custrecord_pri_cre_request_header",
				null, "is", headerManager.headerid);
		filters[2] = new nlobjSearchFilter("isinactive", null, "is", "F"); // skip
		// all
		// inactive
		// lines

		results = nlapiSearchRecord("customrecord_pri_cre_request_detail",
				null, filters, columns);
		if (results && results.length) {
			nlapiLogExecution("audit", "headerManager.isCompleted ",
					"Records to process " + results.length);
			retvalue = true; // completed
		}

		return retvalue;
	};
	headerManager.getOptions = function() {
		if (!headerManager.optionGroup) {
			throw "headerManager.getOptions: Option Group ID is required";
		}

		var filters = [];
		var columns = [];
		var option = {};
		var i = 0;

		nlapiLogExecution("DEBUG", "headerManager.optionGroup ", "'"
				+ headerManager.optionGroup + "'");

		filters[0] = new nlobjSearchFilter(
				"custrecord_pri_cre_request_options_opt", null, "is",
				headerManager.optionGroup);
		// filters[1] = new
		// nlobjSearchFilter("custrecord_pri_cre_request_options_rtype", null,
		// "is", detailManager.recordType);
		filters[1] = new nlobjSearchFilter("isinactive", null, "is", "F"); // skipp
		// all
		// inactive
		// lines

		columns[0] = new nlobjSearchColumn(
				"custrecord_pri_cre_request_options_cre");
		columns[1] = new nlobjSearchColumn(
				"custrecord_pri_cre_request_options_rtype");
		columns[2] = new nlobjSearchColumn(
				"custrecordpri_cre_request_options_stype");

		var results = nlapiSearchRecord("customrecord_pri_cre_request_options",
				null, filters, columns);

		if (!results) {

			throw "Option for group " + headerManager.optionGroup
					+ " for header id " + headerManager.headerid
					+ " IS NOT DEFINED.";
		}
		if (!results.length) {
			throw "Option for group " + headerManager.optionGroup
					+ " for header id " + headerManager.headerid
					+ " IS NOT DEFINED.";
		}

		var length = results.length;
		for (i = 0; i < length; i += 1) {
			option = {};
			option.internalid = results[i].getId();
			option.CREProfileValue = results[i]
					.getValue("custrecord_pri_cre_request_options_cre");
			option.CREProfileText = results[i]
					.getText("custrecord_pri_cre_request_options_cre");
			option.TransactionValue = results[i]
					.getValue("custrecord_pri_cre_request_options_rtype");
			option.TransactionText = results[i]
					.getText("custrecord_pri_cre_request_options_rtype");

			option.SubTypeValue = results[i]
					.getValue("custrecordpri_cre_request_options_stype");
			option.SubTypeText = results[i]
					.getText("custrecordpri_cre_request_options_stype");
			headerManager.options.push(option);
			// nlapiLogExecution("DEBUG","entryid ", entryid);
		}

		// options
		// [
		// {
		// "internalid": "1",
		// "CREProfileValue": "53",
		// "CREProfileText": "FM: Sample Convert NetSuite Invoice to CRE PDF",
		// "TransactionValue": "-30",
		// "TransactionText": "Transaction"
		// },
		// {
		// "internalid": "2",
		// "CREProfileValue": "10",
		// "CREProfileText": "FM: Sample Customer Transactions PDF",
		// "TransactionValue": "-2",
		// "TransactionText": "Customer"
		// }
		// ]
		// return results[0].getValue("custrecord_pri_cre_request_options_cre");

	};

	headerManager.start = function() {
		var detailManager = null;
		var params = {};
		// var dateTime = nlapiDateToString(new Date(), "datetimetz");
		var i = 0;
		var msg = "";
		var headerfileid = null;
		var headermsg = "";
		var detailrec = null;
		var detailerrrors = false;
		if (!headerManager.headerid) {
			throw "Header ID is required";
		}
		var requestrec = nlapiLoadRecord("customrecord_pri_cre_request_header",
				headerManager.headerid);
		if (!TESTING.ON) {
			requestrec.setFieldValue("custrecord_pri_cre_request_header_notes",
					"");
			requestrec.setFieldValue(
					"custrecord_pri_cre_request_header_status",
					REQUEST_STATUS.InProgress);
		}
		nlapiSubmitRecord(requestrec);

		requestrec = nlapiLoadRecord("customrecord_pri_cre_request_header",
				headerManager.headerid);
		headerManager.CREProfile = requestrec
				.getFieldValue("custrecord_pri_cre_request_profile");
		headerManager.optionGroup = requestrec
				.getFieldValue("custrecord_pri_cre_request_option");
		headerManager.outputFolder = headerManager.getOutputFolderID(requestrec
				.getFieldValue("custrecord_pri_cre_request_folder_link"));

		nlapiLogExecution("DEBUG", "headerManager.CREProfile ",
				headerManager.CREProfile);
		nlapiLogExecution("DEBUG", "headerManager.optionGroup ",
				headerManager.optionGroup);
		nlapiLogExecution("DEBUG", "headerManager.outputFolder ",
				headerManager.outputFolder);

		if (!headerManager.optionGroup) {
			throw "headerManager.start: Option Group ID is required";
		}

		if (!headerManager.outputFolder) {
			throw "headerManager.start: Output Folder ID is required";
		}

		if (!headerManager.CREProfile) {
			throw "headerManager.start: CREProfile ID is required";
		}

		headerManager.getOptions();

		var filters = [];
		var columns = [];
		var status = "";

		nlapiLogExecution("DEBUG", "headerManager.headerid ",
				headerManager.headerid);
		filters[0] = new nlobjSearchFilter("custrecord_pri_cre_request_status",
				null, "is", REQUEST_STATUS.Open); // always request open
		// detail records
		filters[1] = new nlobjSearchFilter("custrecord_pri_cre_request_header",
				null, "is", headerManager.headerid);
		filters[2] = new nlobjSearchFilter("isinactive", null, "is", "F"); // skip
		// all
		// inactive
		// lines

		var results = nlapiSearchRecord("customrecord_pri_cre_request_detail",
				null, filters, columns);

		// throw "customrecord_pri_cre_request_detail " + results.length;

		if (results && results.length) {
			var length = results.length;
			for (i = 0; i < length; i += 1) {
				params = {};
				params.headerid = headerManager.headerid;
				params.detailid = results[i].getId();

				params.outputFolder = headerManager.outputFolder;
				params.options = headerManager.options;
				detailManager = new DetailManager(params);
				try {
					detailManager.start();
					if (nlapiGetContext().getRemainingUsage() < USAGE_THRESHOLD_BEFORE_RESCHEDULING) {
						// nlapiLogExecution("DEBUG","Running low on resources
						// --
						// attempting to reschedule script", counter);
						headerManager.rescheduled = true;
						params = {};
						params.custscript_pri_rp_process_header_id = headerManager.headerid;
						status = nlapiScheduleScript(nlapiGetContext()
								.getScriptId(), nlapiGetContext()
								.getDeploymentId(), params);
						addnote(
								headerManager.headerid,
								getRecordInternalIDNumber(CUSTOM_RECORD_IDS.CRE_REQUEST_INPUT_HEADER),
								"Rescheduling, status: " + status + ", usage "
										+ nlapiGetContext().getRemainingUsage());
						nlapiLogExecution("DEBUG",
								"Rescheduled invoices with status: ", status);
						return;
					}
				} catch (e) {
					msg = "";
					if (e instanceof nlobjError) {
						msg = "Code: " + e.getCode() + ". ";
						msg = msg + " Error: " + e.getDetails();
						nlapiLogExecution("ERROR", "Detail Manager Error ", e
								.getCode()
								+ " : " + e.getDetails());
					} else {
						nlapiLogExecution("ERROR", "Detail Manager Error ", e
								.toString());
						msg = e.toString();
					}

					nlapiLogExecution("audit", "Loading detail record .",
							results[i].getId());
					nlapiLogExecution("audit", "Parent record .",
							headerManager.headerid);
					detailrec = nlapiLoadRecord(
							"customrecord_pri_cre_request_detail", results[i]
									.getId());
					detailrec.setFieldValue(
							"custrecord_pri_cre_request_status",
							REQUEST_STATUS.Failed);
					nlapiLogExecution("audit", "Setting status to failed.", msg);
					detailrec.setFieldValue("custrecord_pri_cre_request_notes",
							msg);
					detailerrrors = true;
					nlapiSubmitRecord(detailrec);

					addnote(
							detailManager.detailid,
							getRecordInternalIDNumber(CUSTOM_RECORD_IDS.CRE_REQUEST_INPUT_DETAIL),
							msg);
					addnote(
							headerManager.headerid,
							getRecordInternalIDNumber(CUSTOM_RECORD_IDS.CRE_REQUEST_INPUT_HEADER),
							msg);
				}

				// nlapiLogExecution("DEBUG","entryid ", entryid);

			}

			if (headerManager.isCompleted()) {
				requestrec.setFieldValue(
						"custrecord_pri_cre_request_header_status",
						REQUEST_STATUS.Completed);
				requestrec
						.setFieldValue(
								"custrecord_pri_cre_request_header_notes",
								(detailerrrors) ? "Finished with errors.  Inspect detail."
										: COMPLETED_STRING);
				var creProfile = new CREProfile(headerManager.CREProfile);
				creProfile.Translate(headerManager.headerid);
				// nlapiLogExecution("audit","detailManager.CREProfile ",
				// creProfile.fields.DocumentName.TranslatedValue);
				creProfile.Execute();
				if (creProfile.fields.DocumentName.file) {
					headerfileid = creProfile.fields.DocumentName.file.getId();
					requestrec.setFieldValue(
							"custrecord_pri_cre_request_header_doc",
							headerfileid);
				}
			} else {
				requestrec.setFieldValue(
						"custrecord_pri_cre_request_header_status",
						REQUEST_STATUS.Failed);
				requestrec
						.setFieldValue(
								"custrecord_pri_cre_request_header_notes",
								(detailerrrors) ? "Finished with errors.  Inspect detail."
										: COMPLETED_STRING);
			}
		} else {
			headermsg = "0 'Status:Open' Detail entries to process for header "
					+ headerManager.headerid;
			nlapiLogExecution("audit", headermsg);
			if (headerManager.isCompleted()) {
				requestrec.setFieldValue(
						"custrecord_pri_cre_request_header_status",
						REQUEST_STATUS.Completed);
				requestrec
						.setFieldValue(
								"custrecord_pri_cre_request_header_notes",
								(detailerrrors) ? "Finished with errors.  Inspect detail."
										: COMPLETED_STRING);
			} else {
				requestrec.setFieldValue(
						"custrecord_pri_cre_request_header_status",
						REQUEST_STATUS.Failed);
				requestrec
						.setFieldValue(
								"custrecord_pri_cre_request_header_notes",
								(detailerrrors) ? "Finished with errors.  Inspect detail."
										: COMPLETED_STRING);
			}
		}

		nlapiLogExecution("audit", "header status ", requestrec
				.getFieldValue("custrecord_pri_cre_request_header_status"));

		if (headermsg) {
			nlapiLogExecution("audit", "updating notes");
			// save any ouput notes
			requestrec.setFieldValue("custrecord_pri_cre_request_header_notes",
					headermsg);
			addnote(
					headerManager.headerid,
					getRecordInternalIDNumber(CUSTOM_RECORD_IDS.CRE_REQUEST_INPUT_HEADER),
					headermsg);
		}

		nlapiSubmitRecord(requestrec);
		nlapiLogExecution("audit", "submitting record ");

		// throw "Completed a row";
	};

	// if (headerManager.headerid)
	// {
	// headerManager.start(); //automatically start
	// }

}

function SC_ProcessRequestHeaders(type) {
	"use strict";
	var i = 0;
	var headerManager = null;
	var params = {};
	var status = "";
	var msg = "";
	var func = "SC_ProcessRequestHeaders";
	var requestrec = null;
	nlapiLogExecution("DEBUG", func + ".getRemainingUsage() start",
			nlapiGetContext().getRemainingUsage());

	// USER INTERFACE MAY need to be dropped in production.
	if ((String(type) !== "ondemand") && (String(type) !== "userinterface")
			&& (String(type) !== "scheduled")) {
		return;
	}

	var requestID = nlapiGetContext().getSetting("SCRIPT",
			"custscript_pri_rp_process_header_id");

	var filters = [];
	var entryid = "";

	// if (requestID) {
	// filters[0] = new nlobjSearchFilter(
	// "custrecord_pri_cre_request_header_status", null, "anyof", [
	// REQUEST_STATUS.Open, REQUEST_STATUS.InProgress ]);
	// filters[1] = new nlobjSearchFilter("isinactive", null, "is", "F");
	// filters[2] = new nlobjSearchFilter("internalid", null, "is", requestID);
	// nlapiLogExecution("audit", "On Demand requestID: ", requestID);
	// } else {
	filters[0] = new nlobjSearchFilter(
			"custrecord_pri_cre_request_header_status", null, "anyof", [
					REQUEST_STATUS.Open, REQUEST_STATUS.InProgress ]);
	filters[1] = new nlobjSearchFilter("isinactive", null, "is", "F");

	var results = nlapiSearchRecord("customrecord_pri_cre_request_header",
			null, filters);

	if (results && results.length) {

		var length = results.length;
		nlapiLogExecution("audit", "open header results length:", length);

		var arrEntryIds = [];
		for (i = 0; i < length; i += 1)
			arrEntryIds.push(results[i].getId());

		// Priority on requestID
		if (arrEntryIds.indexOf(requestID) != -1) {
			arrEntryIds.splice(arrEntryIds.indexOf(requestID), 1);
			arrEntryIds.splice(0, 0, requestID);
		}

		for (i = 0; i < arrEntryIds.length; i += 1) {
			entryid = arrEntryIds[i];

			headerManager = new HeaderManager(entryid);
			try {
				if (headerManager.rescheduled) {
					return;
				} else {
					headerManager.start();
					if (nlapiGetContext().getRemainingUsage() < USAGE_THRESHOLD_BEFORE_RESCHEDULING) {

						params = {};
						// params.custscript_pri_rp_process_header_id =
						// entryid;
						status = nlapiScheduleScript(nlapiGetContext()
								.getScriptId(), nlapiGetContext()
								.getDeploymentId(), params);
						addnote(
								entryid,
								getRecordInternalIDNumber(CUSTOM_RECORD_IDS.CRE_REQUEST_INPUT_HEADER),
								"Rescheduling, status: " + status
										+ ", usage remaining "
										+ nlapiGetContext().getRemainingUsage());
						nlapiLogExecution("DEBUG",
								"Rescheduled invoices with status: ", status);
						return;
					}
				}
			} catch (e) {
				msg = "";
				if (e instanceof nlobjError) {
					msg = "Code: " + e.getCode() + ". ";
					msg = msg + " Error: " + e.getDetails();
					nlapiLogExecution("ERROR",
							"Header Manager Error, usage remaining "
									+ nlapiGetContext().getRemainingUsage(), e
									.getCode()
									+ " : " + e.getDetails());
				} else {
					nlapiLogExecution("ERROR",
							"Header Manager Error, usage remaining "
									+ nlapiGetContext().getRemainingUsage(), e
									.toString());
					msg = e.toString();
				}

				requestrec = nlapiLoadRecord(
						"customrecord_pri_cre_request_header", entryid);
				requestrec.setFieldValue(
						"custrecord_pri_cre_request_header_status",
						REQUEST_STATUS.Failed);
				requestrec.setFieldValue(
						"custrecord_pri_cre_request_header_notes", msg);
				nlapiSubmitRecord(requestrec);

				addnote(
						entryid,
						getRecordInternalIDNumber(CUSTOM_RECORD_IDS.CRE_REQUEST_INPUT_HEADER),
						msg);
			}

			nlapiLogExecution("DEBUG", "entryid ", entryid);
		}
	}

	nlapiLogExecution("DEBUG", func + ".getRemainingUsage() end",
			nlapiGetContext().getRemainingUsage());

}
