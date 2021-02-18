//-----------------------------------------------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------


// shared functions, constants, etc.


var DETAILED_TAX_REPORT_BATCH_HEADER_RECORD_ID = "customrecord_srs_tax_report_batch_header";		// also hardcoded in SRS03_BatchRecord
var DETAILED_TAX_REPORT_BATCH_DETAIL_RECORD_ID = "customrecord_srs_tax_report_batch_detail";


var TAX_REPORT_BATCH_STATUS_SUBMITTED = 1;
var TAX_REPORT_BATCH_STATUS_IDENTIFYING_SHAREHOLDERS = 2;
var TAX_REPORT_BATCH_STATUS_CREATING_REPORTS = 3;
var TAX_REPORT_BATCH_STATUS_REPORTS_CREATED = 4;
var TAX_REPORT_BATCH_STATUS_SENDING_EMAILS = 5;
var TAX_REPORT_BATCH_STATUS_EMAILS_SENT = 6;
var TAX_REPORT_BATCH_STATUS_ERROR = 7;
var TAX_REPORT_BATCH_STATUS_BEING_DELETED = 8;

var TAX_REPORT_BATCH_STATUS_FIELD = "custrecord_srs_dtr_hdr_status";
var TAX_REPORT_BATCH_ERROR_MSG_FIELD = "custrecord_srs_dtr_hdr_error_msg";
var TAX_REPORT_BATCH_STATE_FIELD = "custrecord_srs_dtr_hdr_state";
var TAX_REPORT_BATCH_FOLDER_ID_FIELD = "custrecord_srs_dtr_hdr_folder_id";
var TAX_REPORT_BATCH_ONLY_THIS_DEAL_FIELD = "custrecord_srs_dtr_hdr_only_this_deal";

var CUSTOMER_CATEGORY_IS_DEAL = 1;
var CUSTOMER_CATEGORY_IS_SHAREHOLDER = 2;


var GENERATE_DETAILED_TAX_REPORT_SCHEDULED_SCRIPT_ID = "customscript_srs_gen_dtl_tax_rpt";
var SEND_DETAILED_TAX_REPORT_SCHEDULED_SCRdIPT_ID = "?";
var DELETE_DETAILED_TAX_REPORT_BATCH_SCHEDULED_SCRIPT_ID = "customscript_srs_del_dtl_tax_batch";
var SEND_DETAILED_TAX_REPORT_BATCH_SCHEDULED_SCRIPT_ID = "customscript_srs_send_dtl_tax_rpt";

var SHAREHOLDER_CREDIT_MEMO_SEARCH_ID = "customsearch_srs_dtr_shr_credit_memos";

// this saved search finds all unique customers/shareholders (grouping) who had exchange records with refunds 
// before this search is executed, we dynamically add the trandate filter for the selected calendar year, and optionally the deal
var SHAREHOLDERS_WITH_REPORTABLE_EXCHANGE_RECORDS_SEARCH_ID = "customsearch_srs_dtr_shrhld_w_rptbl_exch";
var REPORTABLE_EXCHANGE_RECORDS_FOR_SHAREHOLDER_SEARCH_ID = "customsearch_srs_dtr_reportable_exchg";

// var SHAREHOLDER_CUSTOMER_REFUNDS_SEARCH_ID = "customsearch_srs_dtr_customer_refunds";


// this saved search returns a list of exchange records which are reportable for a given shareholder (eg they had linked refunds)
//	at runtime, code will add filters by deal, if applicable, by calendar year, and by shareholder
// var REPORTABLE_EXCHANGE_RECORDS_FOR_SHAREHOLDER_SEARCH_ID = "?";





function srs00_massUpdateDeleteReccord(recType, recId) {

	var funcName = "sc000_massUpdateDeleteReccord (" + recType + " " + recId + ")";
	nlapiLogExecution("DEBUG", funcName, "Starting");
	
	try {
		nlapiDeleteRecord(recType, recId);		
		nlapiLogExecution("DEBUG", funcName, "Record deleted.");
		
	} catch (e) {
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
	}
			
}



function srs00_findFileByName(fileName, startingFolder) {
	var filters = new Array();
	
	if (startingFolder) 
		filters.push(new nlobjSearchFilter('internalid', null, 'is', startingFolder));

	filters.push(new nlobjSearchFilter('name', null, 'startswith', fileName.substring(0,2)));

	var columns = new Array();

	columns.push(new nlobjSearchColumn("name"));
	columns.push(new nlobjSearchColumn("internalid"));

	var searchResults = nlapiSearchRecord('folder', null , filters , columns) || [];

	for (var i = 0 ; i < searchResults.length; i++) {
		
		// var folderId = searchResults[0].getId();
		
		// nlapiLogExecution("DEBUG", "fileFileByName", "id=" + searchResult[i].getValue(fileIdCol) + " name = " + searchResult[i].getValue(fileNameCol) + " folder id=" + folderId);
		// nlapiLogExecution("DEBUG", "findFileByName", "id=" + searchResults[i].getValue("internalid") + " name = " + searchResults[i].getValue("name") + " id=" + folderId);
		
		if (searchResults[i].getValue("name") == fileName) 
			return searchResults[i].getValue("internalid");	
		
	}
	
	return nothing;
}


function srs00_findShareholdersWithActivity(taxYear, shareholderId, dealId) {
	
    "use strict";

	var funcName = "srs00_findShareholdersWithActivity year=" + taxYear + " shareholder=" + shareholderId + " deal=" + dealId;
	
	try {

      nlapiLogExecution("DEBUG", funcName, "Starting");
      
		customerList = [];
				
		var search = nlapiLoadSearch("customrecord_acq_lot", SHAREHOLDERS_WITH_REPORTABLE_EXCHANGE_RECORDS_SEARCH_ID);		// was a transaction search
		search.addFilter(new nlobjSearchFilter("trandate","CUSTRECORD_ACQ_LOTH_RELATED_TRANS","within","01/01/" + taxYear, "12/31/" + taxYear));
		
		if (dealId) 
		 	search.addFilter(new nlobjSearchFilter("custrecord_acq_loth_zzz_zzz_deal", null,"anyof",dealId));		
		if (shareholderId) 
	 		search.addFilter(new nlobjSearchFilter("custrecord_acq_loth_zzz_zzz_shareholder", null,"anyof",shareholderId));
					
		var completeSearchResults = search.runSearch();
		
		var searchId = 0;
		customerList = [];

		// if (completeSearchResults.length == 0) 
		// 	return [];
		
		nlapiLogExecution("DEBUG", funcName, "Search Completed");
		
		
		do {			
			var searchResults = completeSearchResults.getResults(searchId, searchId + 1000);
			
			// nlapiLogExecution("DEBUG", funcName, "found " + searchResults.length + " rows");
			
			
			// if (searchId == 0)
			//	dumpSearchResults(searchResults);
			
			for (var i = 0; i < searchResults.length; i++)
				customerList.push(searchResults[i].getValue("internalid","CUSTRECORD_ACQ_LOTH_ZZZ_ZZZ_SHAREHOLDER","GROUP"));
				// customerList.push(searchResults[i].getValue("internalid","customerMain","GROUP"));

			searchId += searchResults.length;
			
		} while (searchResults.length >= 1000);
		
      nlapiLogExecution("DEBUG", funcName, "Found " + customerList.length + " customers"); 
      
		return customerList;
		
	} catch (e) {		
		nlapiLogExecution('ERROR', funcName, (e.name || e.getCode()) + ":" + (e.message || e.getDetails()));
		return [];
	}
	
}

