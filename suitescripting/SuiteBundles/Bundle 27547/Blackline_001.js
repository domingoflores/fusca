//------------------------------------------------------------------
//------------------------------------------------------------------
// Copyright 2013-2015, All rights reserved, Blackline Systems, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Blackline Systems, Inc.
//------------------------------------------------------------------
//------------------------------------------------------------------
var CONST_ENTITY  = 'entity';
var CONST_ENTITYTYPE='entity_type';
var CONST_ACCOUNT = 'account';
var CONST_MULTICURR = 'multicurr';
var CONST_BANKREC = 'bankrec';
var CONST_ALL 	  = 'all';
var CONST_COMPUTE = 'compute'; // recompute balances
var CONST_COMP_ACCOUNT = 'compacc'; // recompute balances and then run account export
var CONST_DEL_COMPUTE  = 'delcomp'; // delete and then recompute
var CONST_STARTSCHED = 'sched';											// &start=sched to start the schedued script immediately
var CONST_ENTITY_SCRIPTID = 'customscript_bl001_create_entity_export';	// the scheduled script id that is queued
var CONST_ACCOUNT_SCRIPTID = 'customscript_bl001_create_account_export';
var CONST_BANKREC_SCRIPTID = 'customscript_bl001_create_bankrec_export';
var CONST_RECOMPUTE_SCRIPTID = 'customscript_bl001_sched_compute_balance';
var CONST_DELETE_SCRIPTID    = 'customscript_bl001_delete_balances';
var CONST_COPYCURR_SCRIPTID = 'customscript_bl001_copy_account_currency';		// script to copy the accounts
var CONST_BLACKLINE_SETUP_SUITELET= 'customscript_bl001_connector_setup';		// the setup suitelet
var CONST_FILEPICKUP_SUITELET = 'customscript_bl001_connector_file_pickup';
var CONST_REDIR_SUITELET = "customscript_bl001_redirector_suitelet";			// the suitelet for the register report redirector from the Blackline app
var CONST_TESTSUITELET_SCRIPTID = 'customscript_bl001_test_saved_search';		// suitelet for testing the web service
var CONST_HOST_DEFAULT = "https://system.netsuite.com/"; // default to use for the url in the email
var CONST_EXPORTLOG_SAVEDSEARCH = "customsearch_bl001_exportlog_last"; // to find the most recent export log to show above blackline portlet
var CONST_LOOPSAFETY = 300;						// when exporting the bank rec or account export, only loop this many times
var CONST_ACCOUNT_MAX_RECORDS = 1000;			// we'll use a variable and cap it ourselves, which is good for testing
var CONST_ACCOUNT_SAVEDSEARCH = "customsearch_bl001_transaction_summary";	// the default saved search to use for the account export file
var CONST_ACCOUNT_SAVEDSEARCH_OW = "customsearch_bl001_transactionsummary_ow";	// the default saved search to use for One World account export file
var CONST_ACCOUNT_SINGLE_SAVEDSEARCH = "customsearch_bl001_single_account_summ";   // the saved search for account balance computation
var CONST_ACCOUNT_LIST_SAVEDSEARCH = "customsearch_bl001_account_list";				// saved search for account list sorted by internalid; we need the sort
var CONST_BALANCES_SAVEDSEARCH = "customsearch_bl001_balances_search";			// used in recompute balances to fetch the current records; we need the sort capability of the saved search
var CONST_ACCOUNT_REPROCESS_STATUS = 'Re-processing export'; // status to show when we need to reprocess
var CONST_ACCOUNT_COMPUTE_STATUS = 'Computing balances';   // status to show when recomputing balances
var CONST_ACCOUNT_OMIT_CURR = "1"; // omit currency columns in account export
var CONST_ACCOUNT_KEEP_BANK_CURR = "2"; // preserve bank currency in account export; all other accounts in subsidiary currency
var CONST_ACCOUNT_MULTI_CURR = "3";   // output multi-currency export format
var CONST_ACCOUNT_TYPE_BANK = "Bank";	// when we need to identify bank accounts to preserve currency
var CONST_ACCOUNT_DEFAULT_CURROPT = "1"; // default currency option is omit currency columns
var CONST_ENTITY_KEY_DEFAULT = "2"; // Subsidiary is the default key for the entity export; determine which records to export as entities:
var CONST_ENTITY_KEY_SUB = "2";	// subsidiary
var CONST_ENTITY_KEY_DEP = "3";	// department
var CONST_ENTITY_KEY_LOC = "4";	// location
var CONST_ENTITY_KEY_CLA = "5";	// class
var CONST_PARENT_COMPANY = "Parent Company";	// the value that shows up for default subsidiary
var CONST_COL_LOCAL = 0;						// the first 4 columns of the account export must be fixed
var CONST_COL_FUNC = 1;							// lock first 4 columns
var CONST_COL_REPORT = 2;						// lock first 4 columns
var CONST_COL_SORT = 3;							// lock first 4 columns
var CONST_BASE_NOCURR = "XXX";					// when no currency is used

var CONST_FILTER_IGNORE = "1";			// determine how to handle the Account Filter List
var CONST_FILTER_INCLUDE = "2";
var CONST_FILTER_EXCLUDE = "3";
var CONST_FILTER_BALSHEET = "4";
var CONST_FILTER_ASSETS   = "5";
var CONST_FILTER_LIABEQ   = "6";
var CONST_FILTER_PL		  = "7";

var CONST_FREQ_NIGHTLY 	  = "1";
var CONST_FREQ_HOURLY 	  = "2";
var CONST_FREQ_FOURHOURS  = "5";
var CONST_FREQ_TWOHOURS   = "6";
var CONST_FREQ_TIME	  	  = "7";
var CONST_FREQ_30MIN 	  = "8";
var CONST_FREQ_15MIN 	  = "9";

var CONST_IFRAME_URL	  = "https://blog.blackline.com/?src=NS";

// TODO: should be false for release
var CONST_DISABLE_TB_ZERO  = true;			// set to true to disable the trial balance foot check

var CONST_DISABLE_EXCHANGE = true;			// set to true to show options in setup that disable exchange rate web service and use custom record as workaround
var CONST_ALLOW_PL_BS	   = true;			// set to true to allow a P&L account in the include list even if balance sheet is enabled; this will automatically disable the Trial Balance foot-to-zero check
// automatically disable the Trial Balance foot-to-zero check
//if (CONST_ALLOW_PL_BS){
//	CONST_DISABLE_TB_ZERO = true;
//}

var CONST_ADMIN_ROLE = 3;                  // full permission when evaluating if user is administrator; 
var g_bAdmin = false;                           // is the current user an administrator?
if (nlapiGetRole() == CONST_ADMIN_ROLE)
{
    g_bAdmin = true;
}

// global variables for the error handler
var g_Email = '';	// for error reporting, this is the email address to use; if empty, it will be sent to the user running the query
var g_Email_error_only = 'T'; // only email errors; if 'F', also email when complete
var g_Profile_ID = '0';		  // hold the profile ID if it is used
var g_Status_Field = '';	  // the export status field to update -- either Account or Entity status
var g_Devmode = false;		  // when true, this throws regular errors and sends NS error email; false reports error to profile // TODO: remove
							  // also simulates extra looping in recompute script

//load company settings
var g_company_settings = new bl001_company_settings();		// this holds functions for company settings

// load the Blackline Connector settings
var g_connector_settings = new bl001_connector_settings();	// this holds the connector settings


//------------------------------------------------------------------
//Function:         BL001_Balances_Recompute
//Script Type:      Scheduled Script
//Script ID:
//Deployment ID:
//Description:		This script removes all balance records that are stored in customrecord_bl001_connector_balances
//
//Date:             SG 20130923
//------------------------------------------------------------------
function BL001_Balances_DeleteAll()
{
	nlapiLogExecution('DEBUG', 'BL001_Balances_DeleteAll starting');
    var context = nlapiGetContext();
    // get script parameters
    var delete_finished = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_delete_finished'), '').trim();
	if (delete_finished.length==0){
		var results = bl_noempty( nlapiSearchRecord('customrecord_bl001_connector_balances'), {length:0});
		if (results.length>0){
			var rlen = results.length;
			nlapiLogExecution('DEBUG', 'delete results', rlen);
			for (var i=0; i<rlen; i++){
				var id = results[i].getId();
				nlapiDeleteRecord('customrecord_bl001_connector_balances', id);
				// we may run out of script resources... re-queue
				if (i>900){
					nlapiScheduleScript(CONST_DELETE_SCRIPTID, context.getDeploymentId());
				}
			}
			nlapiLogExecution('DEBUG', 'Delete loop finished');
			
			// automatically re-run the schedule; if it returns nothing, it will start the recompute job
			if (rlen>0){
				var status = nlapiScheduleScript(CONST_DELETE_SCRIPTID, context.getDeploymentId());
				nlapiLogExecution('DEBUG', 'Requeue delete', status);
			}
		} 
	}
	// reset the account last dates
	if (!bl001_reset_account_dates(context)){
		// if return false, we rescheduled the delete job to finish
		return;
	};
	
	// start the recompute script
	//var status = nlapiScheduleScript(CONST_RECOMPUTE_SCRIPTID);
	//nlapiLogExecution('DEBUG', 'Start recompute script', status);
}
// this updates the last processed dates in the account record so we can process everything from scratch
function bl001_reset_account_dates(context){
	nlapiLogExecution('AUDIT', 'bl001_reset_account_dates', 'Resetting process dates');
	var results = bl_noempty( nlapiSearchRecord('customrecord_bl001_connector_accounts', null
			, [new nlobjSearchFilter('custrecord_bl001_balance_date', null, 'after', '1/1/2000')]), {length:0});
	nlapiLogExecution('DEBUG', 'accounts length', results.length);
	if (results.length>0){
		var rlen = results.length;
		for (var i=0; i<rlen; i++){
			var id = results[i].getId();
			nlapiLogExecution('DEBUG', 'clearing old account date', id);
			var record = nlapiLoadRecord('customrecord_bl001_connector_accounts', id);
			record.setFieldValue('custrecord_bl001_balance_date', '1/1/2000');
			nlapiSubmitRecord(record, false, true);
		}
		if (context){
			var params = new Array();
			params['custscript_bl001_delete_finished'] = 'T';
			var status = bl_noempty(nlapiScheduleScript(CONST_DELETE_SCRIPTID, context.getDeploymentId(), params), 'Unable to requeue');
			nlapiLogExecution('AUDIT', status, 'Reset cache dates');
			return false;
		}
	}
	return true;
}




//------------------------------------------------------------------
//Function:         BL001_Balances_Recompute
//Script Type:      Scheduled Script
//Script ID:
//Deployment ID:
//Description:		This script recomputes account balances
//					for accounts listed in customrecord_bl001_connector_accounts.
//					Balances are stored in customrecord_bl001_connector_balances
//
//Date:             SG 20130923
//------------------------------------------------------------------
function BL001_Balances_Recompute()
{	
	if (!g_connector_settings.initial_setup){
		return;
	}
	var func = 'BL001_Balances_Recompute ';
	nlapiLogExecution('AUDIT', func + 'starting');
	
    var context = nlapiGetContext();
    // get script parameters
    // the account ID; if empty, process all of them
    //var account_id = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_balance_proc_account'), '').trim();
    g_Profile_ID = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_profile_to_run'), '').trim();
    if (g_Profile_ID.length>0){
    	nlapiLogExecution('DEBUG', 'g_Profile_ID to run', g_Profile_ID);
    }
    
    // custrecord_bl001_balance_date we keep the last date we recomputed balances so we don't keep doing it
    // this updates the last processed dates in the account record so we can process everything from scratch
    // normally, we only expect to do this once a day; therefore, this script won't keep running
    // when the Recompute button is pressed on the settings page, this is set to T so it forces a recompute
    var reset_dates = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_refresh_balances'), 'F');
    var nni = context.getSetting('SCRIPT', 'custscript_bl001_recompute_loop_next');
    var next_i = parseInt(bl_noempty(nni , '0'));
	nlapiLogExecution('DEBUG', 'reset_dates  | next_i', reset_dates + ' | ' + next_i);
    if (reset_dates=='T'){
    	nlapiLogExecution('DEBUG', 'Call bl001_reset_account_dates');
    	bl001_reset_account_dates();
    }
    var now = bl_fixdate_for_search(bl_now(), true);
    // get a list of the accounts we need to process
    var filters = [];
   	filters[filters.length] = new nlobjSearchFilter('custrecord_bl001_balance_date', null, 'before', now);
    /*
    if (account_id.length>0){
    	nlapiLogExecution('DEBUG', 'Adding account filter', account_id.length+'|'+account_id+'|');
    	filters[filters.length] = new nlobjSearchFilter('custrecord_bl001_account', null, 'is', account_id);
    }
    */
    var columns = [new nlobjSearchColumn('custrecord_bl001_account')
    				, new nlobjSearchColumn('type', 'custrecord_bl001_account') ];
    var account_list = bl_noempty(nlapiSearchRecord('customrecord_bl001_connector_accounts', null, filters, columns),{length:0});
    
   	if (account_list.length){
	   	// loop through each account and process it
	   	var a_len = account_list.length;
   		nlapiLogExecution('DEBUG', 'Processing # accounts', a_len);
	   	for (var ai=0; ai<a_len; ai++){
	   		var record = account_list[ai];
	   		var acc = record.getValue('custrecord_bl001_account');
	   		var typ = record.getValue('type', 'custrecord_bl001_account');
	   		var id = record.getId();
	   		//if (g_Profile_ID.length>0){
	   	    	//bl001_log_export(g_Profile_ID, CONST_ACCOUNT, "", CONST_ACCOUNT_COMPUTE_STATUS + " " + typ, acc);
	   	    //}
	   		if (bl001_balance_recompute(acc, typ, next_i)){
	   			// if we finished computing, update the account so we don't keep fetching it
		   		var fin_date = bl_fixdate_for_search(bl_now(),true);
		   		nlapiLogExecution('DEBUG', 'bl001_balance_recompute complete '+fin_date, acc + '|' + typ);
		   		// timestamp the record so we know when we last refreshed the balance
		   		var rec_to_update = nlapiLoadRecord('customrecord_bl001_connector_accounts', id);
		   		rec_to_update.setFieldValue('custrecord_bl001_balance_date', fin_date);
		   		nlapiSubmitRecord(rec_to_update);   	
	   		}else{
	   			// returning false means we re-queued the schedule; quit
	   			return;
	   		}
	   		
	   		// if there are more rows
	   		if ((ai+1)<a_len){
		   		// if a next_i was passed in, we were looping. therefore, force a new job to start the next account
		   		if (next_i>0){
					//bl001_Start_Export(CONST_COMP_ACCOUNT, g_Profile_ID, true);
					var params = new Array();
					params['custscript_bl001_profile_to_run'] = g_Profile_ID;
				    var status = bl_noempty(nlapiScheduleScript(CONST_RECOMPUTE_SCRIPTID, context.getDeploymentId(), params), 'Unable to requeue');
					nlapiLogExecution('AUDIT', 'next_i=' + next_i + ' Requeue recompute script', status);
					return;	   			
		   		}else{
			   		// before we loop, check gov limits
			   		// if we are low, restart this script
			   		// it should proceed to next account
					var context = nlapiGetContext();
					var remain_units = context.getRemainingUsage();
					nlapiLogExecution('DEBUG', 'remain_units', remain_units);
					var usedperloop = (parseInt(10000) - parseInt(remain_units))/(parseInt(ai)+parseInt(1));
					if ( parseInt(remain_units) < (parseInt(usedperloop)*parseInt(2))){
						nlapiLogExecution('DEBUG', ai+ '. Recompute Looping. g_Profile_ID to run|usedperloop', g_Profile_ID + ' | ' + usedperloop);
						var params = new Array();
						params['custscript_bl001_profile_to_run'] = g_Profile_ID;
					    var status = bl_noempty(nlapiScheduleScript(CONST_RECOMPUTE_SCRIPTID, context.getDeploymentId(), params), 'Unable to requeue');
						nlapiLogExecution('AUDIT', 'Requeue recompute script', status);
						return;
					}
	   		}
	   		}
	   	}
	   	
   	}
   	// if we are finished recomputing and there is a g_Profile_ID, start it
   	if (g_Profile_ID.length>0){
   		bl001_Start_Export(CONST_ACCOUNT, g_Profile_ID, true);
   	}
   	
   	
}
// recompute all periods for the specified account
// don't recompute if it is before the start date
// however, make sure the records are created the first time
// return true if it finishes
function bl001_balance_recompute(account_id, account_type, next_i)
{
	nlapiLogExecution('AUDIT', 'bl001_balance_recompute account_id', account_id+'|'+account_type);
	// get a list of all accounting periods
	var columns = [new nlobjSearchColumn('closed')
		, new nlobjSearchColumn('enddate')
		, new nlobjSearchColumn('closedondate')
	];
	var filters = [new nlobjSearchFilter('isyear', null, 'is', 'F')
		, new nlobjSearchFilter('isquarter', null, 'is', 'F')
	];
	var period_list = bl_noempty(nlapiSearchRecord('accounting'+'period', null, filters, columns),{length:0});
	if (!period_list.length)return true;
	
	// get an existing list of all balance rows
	var balance_list = new bl001_balance_list(account_id);
	nlapiLogExecution('DEBUG', 'bl001_balance_recompute balance_list.results.length|period_list.length', balance_list.results.length+'|'+period_list.length);
	
	// if there is a cutoff_period, loop the collection and get the date to use for cutoff
	var plen = period_list.length;
	var cutoff_close = g_connector_settings.cutoff_close;
	var cutoff_period= g_connector_settings.cutoff_period;
	var cutoff_date  = null;
	if (cutoff_period.length>0){
		for (var pi=0; pi<plen; pi++){
			var period_id = period_list[pi].getId();
			if (period_id == cutoff_period){
				var cols = period_list[pi].getAllColumns();
				cutoff_date = period_list[pi].getValue(cols[1]);
				break;
			}
		}
	}
	nlapiLogExecution('DEBUG', 'cutoff_date', cutoff_date);
	// loop through each period
	// if the account/period balance controls do not exist, we build for first time balances
	// if the controls exist and the period should be examined, get the new controls and compare; if different, rebuild totals
	var gov_check = 0;
	for (var pi=next_i; pi<plen; pi++){
		gov_check = parseInt(gov_check) + parseInt(1);
		
		if (gov_check > 10){
			gov_check = 0;
	   		// before we loop, check gov limits
	   		// if we are low, restart this script
	   		// it should proceed to next account
			var context = nlapiGetContext();
			var remain_units = context.getRemainingUsage();
			nlapiLogExecution('DEBUG', 'remain_units', remain_units);
			if (g_Devmode || parseInt(remain_units) < 1000){
				var params = new Array();
				if (bl_noempty(g_Profile_ID,"").length>0){
					params['custscript_bl001_profile_to_run'] = g_Profile_ID;
				}
				params['custscript_bl001_recompute_loop_next'] = ''+pi+'';
				params['custscript_bl001_refresh_balances'] = 'F';
			    var status = bl_noempty(nlapiScheduleScript(CONST_RECOMPUTE_SCRIPTID, context.getDeploymentId(), params), 'Unable to requeue');
				nlapiLogExecution('AUDIT', status + ' Remain units low ' + remain_units, pi + '|' + g_Profile_ID);
				// retun false if we aren't finished
				return false;
			}

		}
		var period_result = period_list[pi]; 
		var period_id = period_result.getId();
		var cols = period_result.getAllColumns();
		var closed = period_result.getValue(cols[0]);
		var end_date = period_result.getValue(cols[1]);
		nlapiLogExecution('DEBUG', pi + '. looping periods', period_id);
		var rebuild = false;
		var first_time = false;
		// is there a control balance for this account/period? if nothing, we need to rebuild
		if (!balance_list.control_exists(period_id)){
			rebuild = true;
			first_time = true;
			nlapiLogExecution('DEBUG', pi + '. nocontrols for account_id|period_id', account_id + '|' + period_id);
		}else{
			// there is a control balance
			// is this period good to recompute?
			
			// if we look to locked periods
			if (cutoff_close){
				// and it is not yet locked, rebuild the period
				if (closed == 'F'){
					// the period is not closed; if the cutoff_date condition is met, we will skip rebuild
					rebuild = true;
					// however, if there is a cutoff date that has passed, don't rebuild
					if ( cutoff_date ){
						if (nlapiStringToDate(cutoff_date) >= nlapiStringToDate(end_date)){
							rebuild = false;
						}
					}
				}
			}else{
				rebuild = true;
				if ( cutoff_date ){
					if (nlapiStringToDate(cutoff_date) >= nlapiStringToDate(end_date)){
						rebuild = false;
					}
				}
			}
			nlapiLogExecution('DEBUG', pi + '. '+rebuild + ' cutoff_close && closed && cutoff_date >= end_date', cutoff_close + ' && ' + closed + ' && ' + cutoff_date + ' >= ' + end_date);
		}
		
		if (!rebuild){
			nlapiLogExecution('AUDIT', pi + '. Not rebuilding: account_id|period_id|closed|end_date|cutoff_date', account_id + '|' + period_id + '|' + closed + '|' + end_date + '|' + cutoff_date);
			continue;	
		}else{
			nlapiLogExecution('DEBUG', pi + '. Examining firstime-'+first_time+': account_id|period_id|closed|end_date|cutoff_date', account_id + '|' + period_id + '|' + closed + '|' + end_date + '|' + cutoff_date);
		}
		
		/*var context = nlapiGetContext();
		var remain_units = context.getRemainingUsage();
		nlapiLogExecution('DEBUG', 'remain_units', remain_units);
		*/
		
		// fetch the current control totals for this account + period
		// and then compare them to the last stored values
		var current_controls = new bl001_controls_list(account_id, account_type, period_id);
		var clen = current_controls.results.length;
		if(!clen){
			// there are no transactions for this account
			if (first_time){
				// add a row to balance so we can skip through old periods in future runs
				bl001_create_balance('1', account_id, null, null, null, period_id, null, 0, 0, 0, 0, null);
			}
			nlapiLogExecution('DEBUG', pi + '. No transactions for this account/period; loop', account_id +'|'+ account_type +'|'+ period_id);
			continue;
		}
		nlapiLogExecution('DEBUG', pi + '. current_controls.results.length', clen);
		
		// compare the control totals
		// these represent the account+periods where we have transactions
		// for each of these rows, there should be a control total
		// if there isn't, it means we haven't built it yet
		for (var ci=0; ci<clen; ci++){
			var control_result = current_controls.results[ci];
			var cols = control_result.getAllColumns();
			var sub = control_result.getValue(cols[0]);
			var acc = control_result.getValue(cols[1]);
			var dep = control_result.getValue(cols[2]);
			var loc = control_result.getValue(cols[3]);
			var cls = control_result.getValue(cols[4]);
			var cur = control_result.getValue(cols[5]);
			var txcount = control_result.getValue(cols[6]);
			var txmax = control_result.getValue(cols[7]);
			var txlast = bl_fixdate_for_search(control_result.getValue(cols[8]));
			nlapiLogExecution('DEBUG', pi+'.'+ci+'. class:'+cls+':txcount|txmax|txlast', txcount+'|'+txmax+'|'+txlast);
			// if they agree, nothing to do
			var balance = balance_list.get(period_id, sub, acc, dep, loc, cls, cur);
			var bAgree = false;
			if (balance){
				var bc = balance.getAllColumns();
				var balcount = balance.getValue(bc[8]);
				var balmax = balance.getValue(bc[9]);
				var ballast = bl_fixdate_for_search(balance.getValue(bc[10]));
				var cur2 = balance.getValue(bc[5]);
				nlapiLogExecution('DEBUG', pi+'.'+ci+'. currency-'+cur+'|'+cur2+':balcount|balmax|ballast', balcount+'|'+balmax+'|'+ballast);
				if (balcount==txcount && balmax==txmax && ballast==txlast){
					bAgree = true;
					nlapiLogExecution('AUDIT', pi+'.'+ci+'. Matching Controls: account_id|period_id|closed|end_date|cutoff_date', account_id + '|' + period_id + '|' + closed + '|' + end_date + '|' + cutoff_date);
				}
			}
			
			if (bAgree)continue;

			// if we are here, we need to rebuild the balance for this item
			if (balance){
				var balance_id = balance.getId();
				// delete the record before we create a new one
				nlapiDeleteRecord('customrecord_bl001_connector_balances', balance_id);
				nlapiLogExecution('AUDIT', pi+'.'+ci+'. Remove+Rebuild-'+balance_id+':account_id|period_id|closed|end_date|cutoff_date', account_id + '|' + period_id + '|' + closed + '|' + end_date + '|' + cutoff_date);
			}else{
				nlapiLogExecution('AUDIT', pi+'.'+ci+'. Creating: account_id|period_id|closed|end_date|cutoff_date', account_id + '|' + period_id + '|' + closed + '|' + end_date + '|' + cutoff_date);
			}
			
			
			// load the saved search and run it for this account/period
			// for OW, this saved search must have Consolidated Exchange Rate = None so we get subsidiary currency values for debit-credit
			var custom_search = g_connector_settings.balance_recompute_saved_search;
			
			nlapiLogExecution('DEBUG', pi+'.'+ci+'. load saved search', custom_search);

	    	var this_search = nlapiLoadSearch('transaction', custom_search);
	    	if (!this_search){
	    		bl001_logerror('Error recomputing balances; there is no saved search', custom_search);
	    		return true;
	    	}
			
	    	nlapiLogExecution('DEBUG', pi+'.'+ci+'. filters acctype|acc|dep|loc|cls|cur|period', account_type + '|' + acc + '|' + dep + '|' + loc + '|' + cls + '|' + cur + '|' + period_id);
    		var new_filters = new Array();
    		// add the account filter
    		new_filters[0] = new nlobjSearchFilter('accounttype', null, 'is', account_type);
    		new_filters[1] = new nlobjSearchFilter('account', null, 'is', acc);
    		if (g_company_settings.feature_dept){
	    		if (dep.length>0){
	    			new_filters[new_filters.length] = new nlobjSearchFilter('department', null, 'is', dep);
	    		}else{
	    			new_filters[new_filters.length] = new nlobjSearchFilter('department', null, 'is', '@NONE@');
	    		}
    		}
    		if (g_company_settings.feature_location){
	    		if (loc.length>0){
	    			new_filters[new_filters.length] = new nlobjSearchFilter('location', null, 'is', loc);
	    		}else{
	    			new_filters[new_filters.length] = new nlobjSearchFilter('location', null, 'is', '@NONE@');
	    		}
    		}
    		if (g_company_settings.feature_class){
	    		if (cls.length>0){
	    			new_filters[new_filters.length] = new nlobjSearchFilter('class', null, 'is', cls);
	    		}else{
	    			new_filters[new_filters.length] = new nlobjSearchFilter('class', null, 'is', '@NONE@');
	    		}	
    		}
    		if (g_connector_settings.bOneWorld){
    			new_filters[new_filters.length] = new nlobjSearchFilter('subsidiary', null, 'is', sub);
    		}
    		if (g_company_settings.feature_multi_curr){
    			new_filters[new_filters.length] = new nlobjSearchFilter('currency', null, 'is', cur);
    		}
    		
    		// add the period filters
   			new_filters[new_filters.length] = new nlobjSearchFilter('postingperiod', null, 'is', period_id);
	    	
   			// run the search
   			var results = nlapiSearchRecord('transaction', custom_search, new_filters, null);
   			if (results){
	   			if (results.length){
	   				var rrlen = results.length;
	   				nlapiLogExecution('DEBUG', pi+'.'+ci+'. '+custom_search + ' results', rrlen);
	   				for (var rri=0; rri<rrlen; rri++){
		   				// save the new balances + control totals
		   				var result = results[rri];
		   				var cols = result.getAllColumns();
		   				var acc_balance = result.getValue(cols[0]);
		   				var sub_balance = result.getValue(cols[1]); 
		   				// add the control totals
		   				var dt = nlapiDateToString(nlapiStringToDate(txlast), 'datetimetz');
		   				bl001_create_balance(sub, acc, dep, loc, cls, period_id, cur, acc_balance, sub_balance, txcount, txmax, dt);
	   				}
   			}
   			}
		}
	}
	return true;
}
function bl001_create_balance(sub, acc, dep, loc, cls, period_id, cur, acc_balance, sub_balance, txcount, txmax, dt)
{
		var new_balance = nlapiCreateRecord('customrecord_bl001_connector_balances');
		new_balance.setFieldValue('custrecord_bl001_balances_subsidiary', sub);
		new_balance.setFieldValue('custrecord_bl001_balances_account', acc);
		if (g_company_settings.feature_dept){
			if (dep){
	    		if (dep.length>0){
	    			new_balance.setFieldValue('custrecord_bl001_balances_department', dep);
    		}
			}
		}
		if (g_company_settings.feature_location){
			if (loc){
	    		if (loc.length>0){
	    			new_balance.setFieldValue('custrecord_bl001_balances_location', loc);
	    		}
			}
		}
		if (g_company_settings.feature_class){
			if (cls){
	    		if (cls.length>0){
	    			new_balance.setFieldValue('custrecord_bl001_balances_class', cls);
	    		}
			}
		}
		new_balance.setFieldValue('custrecord_bl001_balances_period', period_id);
		new_balance.setFieldValue('custrecord_bl001_balances_acc_curr', cur);
		new_balance.setFieldValue('custrecord_bl001_balances_acc_bal', acc_balance);
		new_balance.setFieldValue('custrecord_bl001_balances_sub_bal', sub_balance);
		new_balance.setFieldValue('custrecord_bl001_balances_num_trans', txcount);
		new_balance.setFieldValue('custrecord_bl001_balances_max_trans', txmax);
		new_balance.setFieldValue('custrecord_bl001_balances_max_date', dt);
		
		nlapiSubmitRecord(new_balance, false, true);	
}
function bl001_controls_list(account_id, account_type, period_id){
	this.account_id = account_id;
	this.account_type = account_type;
	this.period_id = period_id;
	this.results = null;
	this.load = function(){
		var columns = [];
		if (g_connector_settings.bOneWorld){
			columns[0] = new nlobjSearchColumn('subsidiary', null, 'group');
		}else{
			var sub = new nlobjSearchColumn('formulatext', null, 'group');
			sub.setFormula("'1'");
			sub.setLabel('subsidiary');
			columns[0] = sub;
		}
		columns[1] = new nlobjSearchColumn('account', null, 'group');
		if (g_company_settings.feature_dept){
			columns[2] = new nlobjSearchColumn('department', null, 'group');
		}else{
			var col = new nlobjSearchColumn('formulatext', null, 'group');
			col.setFormula("''");
			col.setLabel('department');
			columns[2] = col;
		}
		if (g_company_settings.feature_location){
			columns[3] = new nlobjSearchColumn('location', null, 'group');
		}else{
			var col = new nlobjSearchColumn('formulatext', null, 'group');
			col.setFormula("''");
			col.setLabel('location');
			columns[3] = col;
		}
		if (g_company_settings.feature_class){
			columns[4] = new nlobjSearchColumn('class', null, 'group');
		}else{
			var col = new nlobjSearchColumn('formulatext', null, 'group');
			col.setFormula("''");
			col.setLabel('class');
			columns[4] = col;
		}
		if (g_company_settings.feature_multi_curr){
			columns[5] = new nlobjSearchColumn('currency', null, 'group');
		}else{
			var curr = new nlobjSearchColumn('formulatext', null, 'group');
			curr.setFormula("'0'");
			curr.setLabel('currency');
			columns[5] = curr;
		}
		columns[6] = new nlobjSearchColumn('internalid', null, 'count');
		columns[7] = new nlobjSearchColumn('internalid', null, 'max');
		columns[8] = new nlobjSearchColumn('lastmodifieddate', null, 'max');
		
		var filters = [new nlobjSearchFilter('account', null, 'is', this.account_id)
						, new nlobjSearchFilter('accounttype', null, 'is', this.account_type)
						, new nlobjSearchFilter('postingperiod', null, 'is', this.period_id)
						];
		this.results = bl_noempty(nlapiSearchRecord('transaction', null, filters, columns),{length:0});
	};
	this.load();
}
function bl001_balance_list(account_id){
	this.account_id = account_id;
	this.results = null;
	
	this.list = new Array();
	this.keys = new Array();
	this.periods = new Array();
	
	this.get = function(period, sub, acc, dept, loc, cls, curr){
		var key = this.make_key(period, sub, acc, dept, loc, cls, curr);
		nlapiLogExecution('DEBUG', 'balace GET key (period, sub, acc, dept, loc, cls, curr)', key);
		var strKey = '_' + key;
		if (strKey in this.list){
			return this.list[strKey];
		}
		return null;
	};
	
	// does a control total already exist for this period?
	this.control_exists = function(period_id){
		var strKey = '_' + period_id;
		if (strKey in this.periods){
			return true;
		}else{
			return false;
		}
	};
	
	this.load = function(){
		var i = 0;
		var last_id = null;
		// prevent endless loop with hardcoded max 
		while(i<10){ 
			/*
			var columns = [new nlobjSearchColumn('custrecord_bl001_balances_subsidiary')
						, new nlobjSearchColumn('custrecord_bl001_balances_account')
						, new nlobjSearchColumn('custrecord_bl001_balances_department')
						, new nlobjSearchColumn('custrecord_bl001_balances_location')
						, new nlobjSearchColumn('custrecord_bl001_balances_class')
						, new nlobjSearchColumn('custrecord_bl001_balances_acc_curr')
						, new nlobjSearchColumn('custrecord_bl001_balances_period')
						, new nlobjSearchColumn('enddate', 'custrecord_bl001_balances_period')
						, new nlobjSearchColumn('custrecord_bl001_balances_num_trans')
						, new nlobjSearchColumn('custrecord_bl001_balances_max_trans')
						, new nlobjSearchColumn('custrecord_bl001_balances_max_date')
						, new nlobjSearchColumn('custrecord_bl001_balances_acc_bal')
						];
			*/
			var filters = [new nlobjSearchFilter('custrecord_bl001_balances_account', null, 'is', this.account_id)];
			if (i>0){
				nlapiLogExecution('DEBUG', 'bl001_balance_list.filters(last_id)', last_id);
				var new_f = filters.length;
				//filters[new_f] = new nlobjSearchFilter('internalid', null, 'greaterthan', last_id);
				filters[new_f] = new nlobjSearchFilter('formulanumeric', null, 'greaterthan', last_id);
				filters[new_f].setFormula('{internalid}');
			}
			this.results = bl_noempty(nlapiSearchRecord('customrecord_bl001_connector_balances', CONST_BALANCES_SAVEDSEARCH, filters, null),{length:0});
			if (this.results.length){
				nlapiLogExecution('DEBUG', 'bl001_balance_list results length', this.results.length);
				/*
				this.results.sort(function(a, b) {
					// sort by column #7 
					var ac = a.getAllColumns();
					var bc = b.getAllColumns();
				    va = a.getValue(ac[7]);
				    vb = b.getValue(bc[7]);
				    return va < vb ? -1 : (va > vb ? 1 : 0);
				});
				*/
			
				this.process();
			}
			
			if (this.results.length<1000)break;	
			last_id = this.results[999].getId();  
			nlapiLogExecution('DEBUG', 'bl001_balance_list.load(last_id)', last_id);
			i++;
		}
	};
    this.add = function(period, sub, acc, dept, loc, cls, curr, value)
    {
    
    	var key = this.make_key(period, sub, acc, dept, loc, cls, curr);
    	nlapiLogExecution('DEBUG', 'balace load key', key);
    	
        // only add this item if it doesn't exist in the collection
        var strKey = '_' + key;
        
        if (!(strKey in this.list))
        {
            this.keys[this.keys.length] = key;
            
            this.list[strKey] = value;
        }
        
        var strPeriodKey = '_' + period;
        if (!(strPeriodKey in this.periods))
       	{
        	this.periods[strPeriodKey] = period;
       	}
        
    };	
    this.make_key = function(period, sub, acc, dept, loc, cls, curr){
    	if (dept){
    		if (dept=='- None -'){
    			dept = '';
    		}
    	}else{
    		dept = '';
    	}
    	if (loc){
    		if (loc == '- None -'){
    			loc = '';
    		}
    	}else{
    		loc = '';
    	}
    	if (cls){
    		if (cls == '- None -'){
    			cls = '';
    		}
    	}
    	if (curr){
    		if (curr =='- None -'){
    			curr = '';
    		}
    	}else{
    		curr = '';
    	}
    	return period + '|' + sub + '|' + acc + '|' + dept + '|' + loc + '|' + cls + '|' + curr;	
    };
	this.process = function(){
		if (this.results.length)
		{
			var rlen = this.results.length;
			for (var i=0; i<rlen; i++)
			{
				if (i>999)break; // we shouldn't get more than 1000 results... but, in case we do, we need to keep in synch
				var result = this.results[i];
				var cols = result.getAllColumns();
				var sub = result.getValue(cols[0]);
				var acc = result.getValue(cols[1]);
				var dept = result.getValue(cols[2]);
				var loc = result.getValue(cols[3]);
				var cls = result.getValue(cols[4]);
				var curr = result.getValue(cols[5]);
				var period = result.getValue(cols[6]);
				this.add(period, sub, acc, dept, loc, cls, curr, result);
			}
		}
	};
	this.load();
}
// Before installing the bundle, make sure some basic features exist
function BL001_Bundle_BeforeInstall(toversion)
{
	nlapiLogExecution('AUDIT', 'Blackline Data Connect: Bundle before install verification', 'version:'+toversion);
	if (!g_company_settings.verifysetup()){
		throw new nlobjError('INSTALLATION_ERROR','The following feature(s) '+g_company_settings.verifysetup_error+' must be enabled. Please enable the feature(s) and re-try.');
	}
}
// After the script is installed, fix the saved searches
// this only applies if it is upgrading
function BL001_Bundle_AfterInstall(fromversion, toversion)
{
	/*
	nlapiLogExecution('AUDIT', 'Blackline Data Connect: Bundle after install setup', 'version:'+fromversion+'->'+toversion);
	if (fromversion){
		
		g_company_settings = new bl001_company_settings();		
		g_connector_settings = new bl001_connector_settings();	
		
		if (g_connector_settings.initial_setup==true){
			
			var record_object = nlapiLoadRecord('customrecord_bl001_connector_setup', g_connector_settings.id);
	    	var sOneWorld = record_object.getFieldValue('custrecord_bl001_setup_oneworld');
	    	var sDefaultSearch = record_object.getFieldValue('custrecord_bl001_setup_account_export');

			BL001_FixSavedSearch(sDefaultSearch, sOneWorld);
			
		}
	}
	*/
}

// the Company Settings object; read the settings and expose them via this wrapper objects
function bl001_company_settings()
{
	this.base_currency = null;			// this will contain {id: name:} object for the currency ID
	this.base_currency_iso = null;
	
	this.feature_docs = false;
	this.feature_multi_curr = false;
	this.feature_dept = false;
	this.feature_class = false;
	this.feature_location = false;
	this.feature_webservices = false;
	
	this.currency_list = null;
	
	this.number_of_subs = -1;
	
	this.verifysetup_error = "";	// the verifysetup() function will store an error here if it returns false
	
	this.context = null;
	
	this.account = null;
	
	this.load = function(){
		this.context = nlapiGetContext();
		var context = this.context;
		this.account = context.getCompany();
		
		var exe_context = context.getExecutionContext();
		if (!(exe_context == 'userinterface' || exe_context == 'scheduled' || exe_context == 'portlet' || exe_context == 'suitelet')){
			return;
		}
		
	    var feature_enabled = context.getSetting('FEATURE', 'DOCUMENTS');
	    //nlapiLogExecution('DEBUG', 'doc_enabled', doc_enabled);
	    if (feature_enabled == 'T')
	    	{
	    		this.feature_docs = true;
	    	}
	    var feature_enabled = context.getSetting('FEATURE', 'MULTICURRENCY');
	    if (feature_enabled == 'T')
	    	{
	    		this.feature_multi_curr = true;
	    	}
	    var feature_enabled = context.getSetting('FEATURE', 'CLASSES');
	    if (feature_enabled == 'T')
	    	{
	    		this.feature_class = true;
	    	}
	    var feature_enabled = context.getSetting('FEATURE', 'DEPARTMENTS');
	    if (feature_enabled == 'T')
	    	{
	    		this.feature_dept = true;
	    	}
	    var feature_enabled = context.getSetting('FEATURE', 'LOCATIONS');
	    if (feature_enabled == 'T')
	    	{
	    		this.feature_location = true;
	    	}
	    // this only works if multi curr is enabled
	    if (exe_context != 'portlet'){
	    	    if (this.feature_multi_curr){
	    		    this.currency_list = new bl001_currency_list();
	    		    this.currency_list.load();
	    		    
	    		    this.base_currency = this.get_base_currency(); 
	    		    this.base_currency_iso = this.currency_list.getISOsymbol(this.base_currency, 'USD');    
	    	    }
	    	    else {
	    	    	this.currency_list = new bl001_currency_list();
	    	    	this.base_currency = {id:'', name:''};
	    	    	this.base_currency_iso = '';
	    	    }
	    }

	    
	};
	//detect if we are oneworld account / check for multiple subsidiary records
	this.is_oneworld = function()
	{
		try{
			// has it already been run?
			if (this.number_of_subs >= 0){
				return true;
			}
			var context = this.context;
		    var feature_enabled = context.getSetting('FEATURE', "SUBSIDIARIES");
		    if (feature_enabled == 'T'){
				var subs = nlapiSearchRecord('subsidiary', null, null, null);
				this.number_of_subs = subs.length;
				if (this.number_of_subs>1){
					return true;
				}else{
					return false;
				}
		    }
		}catch (e){
		}
		this.number_of_subs = 0;
		return false;
	};
	// get the base currency; if the parameter is not specified, get the reporting currency from companyinformation
	this.get_base_currency = function(optional_sub_id)
	{
		// 2013.2 fix: We discovered that this does not work anymore; this unit test fails
    	//          var comp_info = nlapiLoadConfiguration('companyinformation');
		//          jsUnity.assertions.assertNotNull(comp_info.getFieldText('basecurrency'), 'basecurrency:'+comp_info.getFieldText('basecurrency'));
		// therefore, set the Sub_ID to 1 to get the parent company setting
		//if (!optional_sub_id){
		//	optional_sub_id = 1;
		//}
		// End 2013.2 fix
		if (!optional_sub_id){
			var comp_info = nlapiLoadConfiguration('companyinformation');
			return {id:comp_info.getFieldValue('basecurrency'), name:comp_info.getFieldText('basecurrency')};
		}else{
			var sub = nlapiLoadRecord('subsidiary', optional_sub_id);
			return {id:sub.getFieldValue('currency'), name:sub.getFieldText('currency')};
		}
	};
	// in main setup suitelet, first verify that these settings are enabled to proceed with setup
	this.verifysetup = function()
	{
		var this_error = new Array();
		var ret_val = true;
		var context = this.context;
		var other_features = [	    //"CUSTOMCODE"
		                    	    //,"SERVERSIDESCRIPTING"
		                      	    "DOCUMENTS"
		                      	    //,"MULTICURRENCY"  // remove dependency 05/02/2013
		                    	    ,"ACCOUNTING"
		                    	    ,"ACCOUNTINGPERIODS"
		                    	    ,"CUSTOMRECORDS"
		                    	    ,"WEBSERVICESEXTERNAL"];
		for ( var i = 0; i < other_features.length; i++) {
		    var feature_enabled = context.getSetting('FEATURE', other_features[i]);
		    if (feature_enabled != 'T')
		    	{
		    		ret_val = false;
		    		this_error[this_error.length] = other_features[i];
		    	}
			
		}
		
		// make sure the company currency is setup if multi-curr is enabled
		if (this.feature_multi_curr){
			if (!this.base_currency){
				ret_val = false;
				this_error[this_error.length] = "Company Currency Not Defined";
			}else{
				if (!this.base_currency.name){
					ret_val = false;
					this_error[this_error.length] = "Company Currency Not Defined";
				}
			}
		}
		
		if (!ret_val){
			this.verifysetup_error = this_error.join(', ');
		}
		return ret_val;
	};
	
	this.load();
}
//the Blackline Connector settings object; read the connector setup record and expose the settings via this wrapper object
function bl001_connector_settings()
{
	this.id = 0;
	this.initial_setup = false;					// has the connector been setup? look for a row in the customrecord_bl001_connector_setup 
	this.url = null;							// what is the blackline URL to use for the Portlet
	this.bOneWorld = false;						// is this a oneworld implementation? This is a field in the customrecord_bl001_connector_setup
	this.default_account_saved_search = null;	// what is the default saved search to use?
	this.timeout_types = "";							// account types that timeout
	this.results = null;						// hold the record customrecord_bl001_connector_setup
	this.default_currency_noForex = "";			// when multi-currency is off, this is the default currency that appears in the account extract
	this.cutoff_close = false;					// when true, don't try to recompute balances for a closed period
	this.cutoff_period = "";					// the accounting period of the cutoff; don't recompute balances before this date
	this.balance_recompute_saved_search = "";	// the saved search to recompute account balance records
	this.ws_url = "";							// web service to fetch balances
	this.ws_user = "";							// web service to fetch balances
	this.ws_pw = "";							// web service to fetch balances
	this.ws_role = '3';							// web service to fetch balances
	this.donotuse_exchrate_ws = false;			// when true, the consolidated exchange rate web service is broken and we need to use the custom record
												// to fetch exchange rates, customrecord_bl001_exchange_rates 
	//this.export_all_accounts = "F";				// by default, new records will be set to "T" but existing clients will be null, which we treat as "F"
	
	this.load = function(){
		try
		{
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('custrecord_bl001_setup_url');
			columns[1] = new nlobjSearchColumn('custrecord_bl001_setup_oneworld');
			columns[2] = new nlobjSearchColumn('custrecord_bl001_setup_account_export');
			columns[3] = new nlobjSearchColumn('custrecord_bl001_accttype_timeout');
			columns[4] = new nlobjSearchColumn('custrecord_bl001_default_currency_code');
			columns[5] = new nlobjSearchColumn('custrecord_bl001_setup_cutoff_close');
			columns[6] = new nlobjSearchColumn('custrecord_bl001_setup_cutoff_period');
			columns[7] = new nlobjSearchColumn('custrecord_bl001_setup_recomp_savesearch');
			columns[8] = new nlobjSearchColumn('custrecord_bl001_webservices_url');
			columns[9] = new nlobjSearchColumn('custrecord_bl001_webservices_username');
			columns[10] = new nlobjSearchColumn('custrecord_bl001_webservices_pw');
			columns[11] = new nlobjSearchColumn('custrecord_bl001_donotuse_exchrate_ws');
			columns[12] = new nlobjSearchColumn('custrecord_bl001_webservices_role');
			//columns[13] = new nlobjSearchColumn('custrecord_bl001_export_all_accounts');
			
			this.results = nlapiSearchRecord('customrecord_bl001_connector_setup', null, [new nlobjSearchFilter('isinactive', null, 'is', 'F')], columns);
			if (this.results){
				rlen = this.results.length;
				if (rlen>0){
					this.initial_setup = true;
					var row = this.results[0];	// there should only be one row
					this.id = row.getId();
					this.url = row.getValue('custrecord_bl001_setup_url');
					this.bOneWorld = (row.getValue('custrecord_bl001_setup_oneworld') == 'T');
					this.default_account_saved_search = row.getValue('custrecord_bl001_setup_account_export');
					this.timeout_types = ""; //row.getValue('custrecord_bl001_accttype_timeout');
					this.default_currency_noForex = bl_noempty(row.getValue('custrecord_bl001_default_currency_code'),"");
					var cutoff_close = bl_noempty(row.getValue('custrecord_bl001_setup_cutoff_close'),'F');
					if (cutoff_close=='T'){
						this.cutoff_close = true;
					}else{
						this.cutoff_close = false;
					}
					this.cutoff_period = bl_noempty(row.getValue('custrecord_bl001_setup_cutoff_period'),"");
					this.balance_recompute_saved_search = bl_noempty(row.getValue('custrecord_bl001_setup_recomp_savesearch'), CONST_ACCOUNT_SINGLE_SAVEDSEARCH);
					this.ws_url = bl_noempty(row.getValue('custrecord_bl001_webservices_url'),"");
					this.ws_user = bl_noempty(row.getValue('custrecord_bl001_webservices_username'), "");
					this.ws_pw = bl_noempty(row.getValue('custrecord_bl001_webservices_pw'), "");
					this.ws_role = bl_noempty(row.getValue('custrecord_bl001_webservices_role'), "3");
					var donotuse_exch = bl_noempty(row.getValue('custrecord_bl001_donotuse_exchrate_ws'), "");
					if (donotuse_exch == 'T'){
						this.donotuse_exchrate_ws = true;
					}else{
						this.donotuse_exchrate_ws = false;
					}
					//this.export_all_accounts = bl_noempty(row.getValue('custrecord_bl001_export_all_accounts'), "F");
				}
			}
		}
		catch (e){}
	};
	
	this.add_type_timeout = function(this_type){
		// is it already part of the list? don't do anything if it is
		if ((','+this.timeout_types+',').indexOf(','+this_type+',') < 0){
			var record = nlapiLoadRecord('customrecord_bl001_connector_setup', this.id);
			var this_array = this.timeout_types.split(',');
			this_array[this_array.length] = this_type;
			var new_str = this_array.join(',');
			record.setFieldValue('custrecord_bl001_accttype_timeout', new_str);
			this.timeout_types = new_str;
			nlapiSubmitRecord(record, false, true);
		}
	};
	
	// load this object upon instantiation
	this.load();
}
// get the default account saved search to use depending on oneworld; this reads from the g_connector_settings object
function bl001_default_account_savedsearch()
{
	return g_connector_settings.default_account_saved_search;
}

// mass update function to delete records; used for dev
function BL001_MassUpdate_Delete(recType, recId)
{
	nlapiLogExecution('AUDIT', 'BL001_MassUpdate_Delete Starting', recType +'|'+recId);
	
	nlapiDeleteRecord(recType, recId);
}
// return a JS Date object formatted for company system time
function local_now()
{
	var rec = nlapiCreateRecord('customrecord_bl001_nsconnector_status', {recordmode: 'dynamic'});
	var local_now = nlapiStringToDate(rec.getFieldValue('custrecord_bl001_schedule_next_run'));
	return local_now;
}
//------------------------------------------------------------------
//Function:         BL001_Blackline_Scheduler
//Script Type:      Scheduled Script
//Script ID:
//Deployment ID:
//Description:		When the Blackline Scheduler is enabled,
//					it uses this single script to look for 
//					Blackline Profiles that need to be run
//
//Date:             SG 20121116
//------------------------------------------------------------------
function BL001_Blackline_Scheduler(type)
{
	nlapiLogExecution('AUDIT', 'BL001_Blackline_Scheduler Starting', type);
	if (type=='skipped')return;
	
	try
	{
		if (!g_connector_settings.initial_setup){
			return;
		}
	
		// look for records in the profile that have the schedule enabled
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord_bl001_enable_schedule', null, 'is', 'T');
		var now = local_now();
		var now_str = nlapiDateToString(now, 'datetime');
		nlapiLogExecution('DEBUG', 'Now', now_str);
		filters[1] = new nlobjSearchFilter('custrecord_bl001_schedule_next_run', null, 'onorbefore', now_str);
		
		// where the script is scheduled to run on this day of week
		var today_date = new Date();
		var current_dow = today_date.getDay();	// javascript is base 0
		nlapiLogExecution('DEBUG', 'current_dow', current_dow);
		switch (current_dow){
		case 0:
			filters[2] = new nlobjSearchFilter('custrecord_bl001_schedule_sunday', null, 'is', 'T');
			break;
		case 1:
			filters[2] = new nlobjSearchFilter('custrecord_bl001_schedule_monday', null, 'is', 'T');
			break;
		case 2:
			filters[2] = new nlobjSearchFilter('custrecord_bl001_schedule_tuesday', null, 'is', 'T');
			break;
		case 3:
			filters[2] = new nlobjSearchFilter('custrecord_bl001_schedule_wednesday', null, 'is', 'T');
			break;
		case 4:
			filters[2] = new nlobjSearchFilter('custrecord_bl001_schedule_thursday', null, 'is', 'T');
			break;
		case 5:
			filters[2] = new nlobjSearchFilter('custrecord_bl001_schedule_friday', null, 'is', 'T');
			break;
		case 6:
			filters[2] = new nlobjSearchFilter('custrecord_bl001_schedule_saturday', null, 'is', 'T');
			break;
		default:
		}
		
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_bl001_run_entity');
		columns[1] = new nlobjSearchColumn('custrecord_bl001_run_account');
		columns[2] = new nlobjSearchColumn('custrecord_bl001_schedule_stop');
		columns[3] = new nlobjSearchColumn('custrecord_bl001_entity_export_status');
		columns[4] = new nlobjSearchColumn('custrecord_bl001_account_export_status');
		columns[5] = new nlobjSearchColumn('custrecord_bl001_multicurr_export_status');
		columns[6] = new nlobjSearchColumn('custrecord_bl001_run_multicurrency');
		
		var results = nlapiSearchRecord('customrecord_bl001_nsconnector_status', null, filters, columns);
		
		if (!results){
			//nlapiLogExecution('DEBUG', 'results is null');
			return;
		}
		
		var rlen = results.length;
		for (var i=0; i<rlen; i++)
			{
				var result = results[i];
				var config_id = result.getId();
				
				var run_entity = result.getValue('custrecord_bl001_run_entity');
				var run_account= result.getValue('custrecord_bl001_run_account');
				var status_entity = result.getValue('custrecord_bl001_entity_export_status');
				var status_account= result.getValue('custrecord_bl001_account_export_status');
				var run_multicurr= result.getValue('custrecord_bl001_run_multicurrency');
				var status_multicurr = result.getValue('custrecord_bl001_multicurr_export_status');
				//var run_bankrec= result.getValue('custrecord_bl001_run_bankrec');
				//var status_bankrec= result.getValue('custrecord_bl001_bankrec_export_status');
				
				if (run_entity == 'T' && status_entity != 'Processing' && status_entity != 'Queued')
				{
					bl001_Start_Export(CONST_ENTITY, config_id, true);
				}
				if (run_account == 'T' && status_account != 'Processing' && status_account != 'Queued')
				{
					bl001_Start_Export(CONST_ACCOUNT, config_id, true);
				}
				if (run_multicurr == 'T' && status_multicurr != 'Processing' && status_multicurr != 'Queued')
				{
					bl001_Start_Export(CONST_MULTICURR, config_id, true);
				}
				//if (run_bankrec == 'T' && status_bankrec != 'Processing' && status_bankrec != 'Queued')
				//{
				//	bl001_Start_Export(CONST_BANKREC, config_id, true);
				//}
				
			}
	}
	catch(e){
		bl001_logerror('Blackline Data Connect Scheduler Error', 'An error was raised in the Blackline Data Connect master scheduler script.', e);
	}
	
	return;
}

//------------------------------------------------------------------
//Function:         BL001_Connector_Config_BeforeSubmit
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      User Event - Before Submit
//Script ID:
//Deployment ID:
//Description:		Delete the child records customrecord_bl001_nsconnector_exportlog
//					When saving a non-multi-curr record, update the currency fields as necessary
//Task:
//Date:             SG 20121115
//------------------------------------------------------------------
function BL001_Connector_Config_BeforeSubmit(type)
{
	nlapiLogExecution('AUDIT', 'BL001_Connector_Config_BeforeSubmit Starting', type);
	
	// if multi-currency is not enabled, hide the fields
	if (type != 'delete'){		
		if (!g_company_settings.feature_multi_curr){
			nlapiSetFieldValue('custrecord_bl001_reporting_sub', '1');
			nlapiSetFieldValue('custrecord_bl001_currencytrans_adj', nlapiGetFieldValue('custrecord_bl001_retained_earnings'));
			nlapiSetFieldValue('custrecord_bl001_account_curr_opt', CONST_ACCOUNT_DEFAULT_CURROPT);
		}
		
		var dont_delete = bl_noempty(nlapiGetFieldValue('custpage_leave_temp_files', 'F'));
		if (dont_delete=='T'){
			var filen = 'DND_' + nlapiGetFieldValue('custrecord_bl001_account_filename');
			nlapiSetFieldValue('custrecord_bl001_account_filename', filen);
		}
		
		// if the schedule is enabled
		var old_record = nlapiGetOldRecord();
		if (bl_noempty(nlapiGetFieldValue('custrecord_bl001_enable_schedule'),'F')=='T'){
			// if the next date is empty or we are just turning on the schedule, set the next date
			// this is based on Pacific Time Zone of NS Servers
			var freq = nlapiGetFieldValue('custrecord_bl001_schedule_frequency');
			if (bl_noempty(nlapiGetFieldValue('custrecord_bl001_schedule_next_run'),'').length==0 || old_record.getFieldValue('custrecord_bl001_enable_schedule')=='F' || old_record.getFieldValue('custrecord_bl001_schedule_frequency')!=freq){
				var dnow = new Date(); 
				var new_value = '';
				switch (freq){
				case CONST_FREQ_NIGHTLY: //'Nightly':
					dnow.setHours(23, 0);
					new_value = nlapiDateToString(dnow, 'datetimetz');
					break;
				case CONST_FREQ_FOURHOURS: //'Every 4 Hours':
					dnow.setHours(dnow.getHours()+4);
					new_value = nlapiDateToString(dnow, 'datetimetz');
					break;
				case CONST_FREQ_TWOHOURS: //'Every 2 Hours':
					dnow.setHours(dnow.getHours()+2);
					new_value = nlapiDateToString(dnow, 'datetimetz');
					break;
				case CONST_FREQ_HOURLY: //'Hourly':
					dnow.setHours(dnow.getHours()+1);
					new_value = nlapiDateToString(dnow, 'datetimetz');
					break;
				case CONST_FREQ_TIME: // Daily at a Specific Time
					var at_time = nlapiGetFieldValue('custrecord_bl001_schedule_runtime');
					if (!at_time)at_time='';
					// there was no time specified... make it top of current hour tomorrow
					if (at_time.length==0){
						dnow.setMinutes(0);
						dnow.setSeconds(0);
						dnow.setDate(dnow.getDate()+1);
						new_value = nlapiDateToString(dnow, 'datetimetz');
					}else{
						var aAMPM = at_time.split(' ');
						var ampm = aAMPM[1];
						var aTime = aAMPM[0].split(':');
						var new_hour = aTime[0];
						if (ampm == 'pm'){
							new_hour = parseInt(new_hour) + parseInt(12);
						}
						dnow.setHours(new_hour);
						dnow.setMinutes(aTime[1]);
						dnow.setSeconds(0);
						dnow.setDate(dnow.getDate()+1);
						new_value = nlapiDateToString(dnow, 'datetimetz');
					}
					break;
				case CONST_FREQ_30MIN: //30 minutes
					dnow.setMinutes(dnow.getMinutes()+30);
					new_value = nlapiDateToString(dnow, 'datetimetz');
					break;
				case CONST_FREQ_15MIN: //'15 minutes
					dnow.setMinutes(dnow.getMinutes()+15);
					new_value = nlapiDateToString(dnow, 'datetimetz');
					break;
				default:
					break;
				}
				if (new_value.length>0){
					nlapiSetDateTimeValue('custrecord_bl001_schedule_next_run', new_value, 5);	
				}
			}
		}
		
		
	}
	
	

	
	if (type != 'delete')return;	
	
	var id = nlapiGetRecordId();
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_bl001_config_parent', null, 'is', id);
	
	var rlen = 0;
	var results = nlapiSearchRecord('customrecord_bl001_nsconnector_exportlog', null, filters, null);
	if (results){
		if (results.length){
			rlen = results.length;
			for (var i=0; i<rlen; i++)
				{
					var result = results[i];
					var log_id = result.getId();
					nlapiDeleteRecord('customrecord_bl001_nsconnector_exportlog', log_id);
				}
		}
	}
	
	nlapiLogExecution('AUDIT', 'BL001_Connector_Config_BeforeSubmit Finished', id+'|'+rlen);
}
/* this has been moved to Blackline_001PU.js
//------------------------------------------------------------------
//Function:         BL001_Download_File_Suitelet
//Record:			 customrecord_bl001_nsconnector_status          
//Subtab:
//Script Type:      Suitelet to download a file
//Script ID:
//Deployment ID:
//Description:		A Unique Key is provided as a QueryString parameter
//					This key allows us to lookup a profile record to download the latest file
//					Match source IP Address to allowed-list is 2nd level of security
//Task:
//Date:             SG 20130213
//Modified:			SG 20140626 Add Multi-currency pickup
//------------------------------------------------------------------
function BL001_Download_File_Suitelet(request, response)
{
  var sFunc = 'BL001_Download_File_Suitelet';
  var sMethod = request.getMethod();
  nlapiLogExecution('AUDIT', sFunc + ' Starting. method, userid, m_bAdmin', sMethod + '|' + g_bAdmin);
  
  
  // get the valid IP address; this is the only allowed IP address that can download the file
  var context = nlapiGetContext();
  var blackline_ip = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_ip_restriction'), '');
  if (blackline_ip.length==0)return;

  // get the querystring variables
  var unique_key = bl_noempty(request.getParameter('key'),'');	// the key to the profile record
  var file_type = bl_noempty(request.getParameter('type'),'A');	// the file type to download
  if (unique_key.length==0)return;
  if (file_type.length==0)return;

  // lookup the profile based on the file api key
  var filters = new Array();
  filters[0] = new nlobjSearchFilter('custrecord_bl001_profile_file_api_key', null, 'is', unique_key);
  var columns = new Array();
  columns[0] = new nlobjSearchColumn('custrecord_bl001_account_download');
  columns[1] = new nlobjSearchColumn('custrecord_bl001_entitytype_download');
  columns[2] = new nlobjSearchColumn('custrecord_bl001_entity_download');
  columns[3] = new nlobjSearchColumn('custrecord_bl001_multicurr_download');
  columns[4] = new nlobjSearchColumn('custrecord_bl001_saved_search_id');
  columns[5] = new nlobjSearchColumn('custrecord_bl001_saved_search_headers');
  var results = nlapiSearchRecord('customrecord_bl001_nsconnector_status', null, filters, columns);
  
  if (!results)return;
  if (results.length==0)return;
  
  // make sure the ip address matches the blackline data center
  var params = request.getAllHeaders();
  var remote_ip = params['NS-Client-IP'];
  if (!bl001_checkips(remote_ip, blackline_ip))return;
  
  // the ip matches; now open the most recent file and download it
  // we need to get the file ID out of the URL
  var file_url = ''; // https://system.na1.netsuite.com/core/media/media.nl?id=1047&c=TSTDRV985077&h=948371a93f73ce428c0d&mv=hdgp31eg&_xt=.txt&_xd=T&e=T
  switch (file_type){
  case 'A':
	  file_url = results[0].getValue('custrecord_bl001_account_download');
	  break;
  case 'E':
	  file_url = results[0].getValue('custrecord_bl001_entity_download');
	  break;
  case 'ET':
	  file_url = results[0].getValue('custrecord_bl001_entitytype_download');
	  break;
  case 'MC':
	  file_url = results[0].getValue('custrecord_bl001_multicurr_download');
	  break;
  case 'SS':
	  response.write("test");
	  return;
	  var ss = results[0].getValue('custrecord_bl001_saved_search_id');
	  var inc_headers = results[0].getValue('custrecord_bl001_saved_search_headers');
	  var ret_val = bl001_run_saved_search(response, ss, inc_headers);
	  response.write(ret_val);
	  return;
  default:
	 return;
  }
  var fileid = bl001_id_from_url(file_url);
  if (!bl_isNonZeroNumber(fileid))return;
  
  var oFile = nlapiLoadFile(fileid);
  response.write(oFile.getValue());
  
  return;
  
}
*/

function bl001_id_from_url(file_url){
	  var ret_id = 0;
	  var iPos = file_url.indexOf('?id='); 
	  if (iPos<0)iPos = file_url.indexOf('&id=');
	  if (iPos<0)return;
	  file_url = file_url.substring(parseInt(iPos)+parseInt(4));
	  iPos = file_url.indexOf('&');
	  if (iPos>0){
		  ret_id = file_url.substring(0,iPos);
	  }	
	  return ret_id;
}
// see if one of the IPs matches
function bl001_checkips(remote_ip, blackline_ip){
	  if (!blackline_ip)return false;
	  if (!(typeof blackline_ip == 'string'))return;
	  var aValidList = blackline_ip.split(',');
	  var i = 0;
	  len = aValidList.length;
	  for (i=0;i<len;i++){
		  var valid_ip = aValidList[i];
		  if (bl001_matchip(remote_ip, valid_ip)){
			  return true;
		  }
	  }
	  return false;
}
// make sure ipaddress matches the mask; any position may contain a *
function bl001_matchip(ipaddress, mask) {
	var aIP = ipaddress.split('.');
	var aMask = mask.split('.');
	for (var i=0;i<4;i++){
		if (aMask[i]!='*'){
			if ( aIP[i] != aMask[i]){
				return false;
			}			
		}
	}
	return true;
}

//------------------------------------------------------------------
//Function:         BL001_Connector_Test_Suitelet
//Record:			           
//Subtab:
//Script Type:      Suitelet
//Script ID:
//Deployment ID:
//Description:		 Suitelet to test various functions / compatibility
//					
//Task:
//Date:             SG 20140515
//Modified:			SG 20140805 The saved search tests were causing the page to timeout; these are moved to a scheduled script
//------------------------------------------------------------------
function BL001_Connector_Test_Suitelet(request, response)
{
	var sFunc = 'BL001_Connector_Test_Suitelet';
    var sMethod = request.getMethod();
    nlapiLogExecution('AUDIT', sFunc + ' Starting. method, userid, m_bAdmin', sMethod + '|' + g_bAdmin);
    
    // hold list of messages 
	var msg_list = new Array();
	
    if (!g_company_settings.verifysetup()){
    	msg_list[msg_list.length] = 'ERROR. These NetSuite features are pre-requisites for Blackline Data Connect to run: '+g_company_settings.verifysetup_error;
    }
    
    var context = nlapiGetContext();
	var bProduction = true;
	if (context.getEnvironment() != 'PRODUCTION'){
		bProduction = false;
	}
	
	var bOneWorld = g_company_settings.is_oneworld();
	var bMulticurr = g_company_settings.feature_multi_curr;
	
	var sWS_URL = bl_noempty(request.getParameter('custpage_wsurl'), '');
	var hold_URL = sWS_URL;
	var sWS_User = bl_noempty(request.getParameter('custpage_wsuser'), '');
	var sWS_Pw = bl_noempty(request.getParameter('custpage_wspw'), '');
	var sWS_PwC = bl_noempty(request.getParameter('custpage_confirmpw'), '');
	var sWS_Role = bl_noempty(request.getParameter('custpage_role'), '3');
	
	// the saved search test for multi-currency extract
	var sRunSavedSearchTest = bl_noempty(request.getParameter('custpage_runsearch'), 'T');
	if (!bMulticurr){
		sRunSavedSearchTest = 'F';
	}
	
    //:: SAVE DATA
    //:::::::::::::::::::::::
    // user clicked save
    if (sMethod == 'POST')
    {
    	var end_period = bl001_get_period(0, false, false);
    	var period_end_date = end_period.enddate;
    	
    	var test_results_record = nlapiCreateRecord('customrecord_bl001_test_instance');
    	test_results_record.setFieldValue('custrecord_bl001_ws_test_results', 'ERROR: nothing checked');
    	test_results_record.setFieldValue('custrecord_bl001_ss_test_results', 'n/a');
    	
		// if the password fields are empty, we can't test this
		if (sWS_Pw.length > 0 && sWS_PwC.length > 0 && sWS_User.length > 0){
	    	if (sWS_Pw.length==0 || sWS_PwC.length==0){
	    		throw(nlapiCreateError("-99", "Password and Confirm Password must have a value"));
	    		return;
	    	}
	    	if (!(sWS_Pw == sWS_PwC)){
	    		throw(nlapiCreateError("-99", "Password and Confirm Password do not match"));
	    		return;
	    	}
	    	try{
		    	// get the url
	        	var sysURL = "https://rest.netsuite.com/rest/roles";
	        	if (!bProduction){
	        		sysURL = "https://rest.sandbox.netsuite.com/rest/roles";
	        	}
	            //Setting up Headers 
	            var headers = new Array();
	            headers['User-Agent-x'] = 'SuiteScript-Call';
	            headers['Authorization'] = 'NLAuth nlauth_account='+g_company_settings.account+', nlauth_email='+sWS_User+', nlauth_signature='+sWS_Pw+', nlauth_role='+sWS_Role;
	            //response.write(headers['Authorization']);
	            //return;
	            headers['Content-Type'] = 'application/json';
	            var resp = nlapiRequestURL( sysURL, null , headers );
	            var JSON_String = resp.getBody();
	            if (JSON_String.indexOf("USER_ERROR")>=0){
	            	msg_list[msg_list.length] = "Role lookup failed. Unable to authenticate username/password against web service; please verify Username and Password and make sure that user has admin privileges.";
	            }else{
		            var json_obj = JSON.parse(JSON_String, reviver);
		            if (json_obj){
		            	if (json_obj.length>0){
		            		var URL_Type = "webservicesDomain"; // restDomain, systemDomain
		            		sWS_URL = json_obj[0].dataCenterURLs[URL_Type];
		            		if (URL_Type=="webservicesDomain"){
		            			sWS_URL += "/services/NetSuitePort_2013_2";
		            		}
		            	}
		            }
	            }
	            nlapiLogExecution('DEBUG', 'sWS_URL', sWS_URL);
	            if(sWS_URL.length==0){
	            	msg_list[msg_list.length] = "Unable to fetch web service information; please verify Username and Password and make sure that user has admin privileges.";
	            }
	    	}catch(e){
	    		sWS_URL = hold_URL;
	    		if (e){
	    			if ( e instanceof nlobjError ){
	    				msg_list[msg_list.length] = "WARNING: " + e.getDetails();
	    			}else{
	    				msg_list[msg_list.length] = "WARNING: " + e.toString();
	    			}
	    		}
	    	}
	    	
	    	// test the web service
	    	try{
	    		nlapiLogExecution('DEBUG', 'sWS_URL', sWS_URL);
	    		sWS_URL = '';
		    	var bAuth = false;
		    	var soap_action = 'getPostingTransactionSummary';
		    	// build the request string
		    	var str_xml = xml_testws(sWS_URL, sWS_User, sWS_Pw, sWS_Role);
		    	// fetch the xml
		    	var resp_xml = call_ws(str_xml, soap_action, sWS_URL);
				var xml = nlapiStringToXML(resp_xml);
				if (1==2){
					response.setContentType('XMLDOC');
					response.write(resp_xml);
					return;
				}
				try{
					var nnode = nlapiSelectNode(xml, "//platformCore:status");	
				}catch(e){
					throw(nlapiCreateError("-99", "Test of getPostingTransactionSummary failed."));
				}
				if (nnode){
					if (nnode.hasAttributes()){
						var resp = nnode.attributes.getNamedItem('isSuccess').value;
						if (resp){
							if (resp.length>0){
								if (resp == "true"){
									bAuth = true;
								}
							}
						}
					}
				}
		    	if (!bAuth){
		    		msg_list[msg_list.length] = "Test of getPostingTransactionSummary failed.";
			    }else{
			    	msg_list[msg_list.length] = "Test of getPostingTransactionSummary succeeded.";
			    }
	    	}catch(e){
	    		if (e){
	    			var WSURL_Msg = '';
					if (WSURL_Msg.length==0){
						WSURL_Msg = "WARNING: ";
					}
	    			if ( e instanceof nlobjError ){
	    				WSURL_Msg = WSURL_Msg +" "+ e.getDetails();	
	    			}else{
						WSURL_Msg = WSURL_Msg + " " + e.toString();
	    			}
	    			msg_list[msg_list.length] = WSURL_Msg;
	    		}
	    	}
	    	
	    	// if one-world, test the consolidated exchange rate web service
	    	if (bOneWorld){
		    	try{
		    		var this_period = end_period.id;
			    	var bAuth = false;
			    	var soap_action = 'getConsolidatedExchangeRate';
			    	// build the request string
			    	var str_xml = xml_test_exchws(sWS_URL, sWS_User, sWS_Pw, sWS_Role, this_period);
			    	// fetch the xml
			    	var resp_xml = call_ws(str_xml, soap_action, sWS_URL);
					var xml = nlapiStringToXML(resp_xml);
					if (1==2){
						response.setContentType('XMLDOC');
						response.write(resp_xml);
						return;
					}
					var nnode = null;
					try{
						nnode = nlapiSelectNode(xml, "//platformCore:status");	
					}catch(e){
						msg_list[msg_list.length] = "Test of getConsolidatedExchangeRate failed.";
					}
					if (nnode){
						if (nnode.hasAttributes()){
							var resp = nnode.attributes.getNamedItem('isSuccess').value;
							if (resp){
								if (resp.length>0){
									if (resp == "true"){
										bAuth = true;
									}
								}
							}
						}
					}
			    	if (!bAuth){
			    		msg_list[msg_list.length] = "Test of getConsolidatedExchangeRate failed.";
				    }else{
			    		msg_list[msg_list.length] = "Test of getConsolidatedExchangeRate succeeded.";
				    }
		    	}catch(e){
		    		if (e){
		    			var WSURL_Msg = '';
	    				if (WSURL_Msg.length==0){
	    					WSURL_Msg = "WARNING: ";
	    				}
		    			if ( e instanceof nlobjError ){
		    				WSURL_Msg = WSURL_Msg +" "+ e.getDetails();	
		    			}else{
	    					WSURL_Msg = WSURL_Msg + " " + e.toString();
		    			}
		    			msg_list[msg_list.length] = WSURL_Msg;
		    		}
	
		    	}
	    	}
	    	
		}else{
			msg_list[msg_list.length] = "ERROR: To test the web service, the username and password must be provided.";
		} // if passwords provided
    	test_results_record.setFieldValue('custrecord_bl001_ws_test_results', msg_list.join('\n'));	
    	var new_id = nlapiSubmitRecord(test_results_record);
    	
    	
		nlapiLogExecution('DEBUG', 'sRunSavedSearchTest', sRunSavedSearchTest);
    	if (sRunSavedSearchTest=='T'){
    		// if the multicurrency feature is enable on the account, try to run the necessary search
    		var sDefaultSearch = CONST_ACCOUNT_SAVEDSEARCH;
    		var sOneWorld = 'F';
    		if (bOneWorld){
    			sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH_OW;
    			sOneWorld = 'T';
    		}
    		// fix the saved search based on these defaults
    		BL001_FixSavedSearch(sDefaultSearch, sOneWorld);
    		
    		
    		// the saved searches are tested using a scheduled script
    		// the array of account types is passed to the scheduled script
    		// the sched script pops off the last type from the array to run
    		// and requeues the script with the array of remaining types to test  
    		var account_types = bl001_Connector_Test_FetchAccountTypes();
    		var str_types = account_types.join(',');
    		nlapiLogExecution('DEBUG', 'account types', str_types);
    		
    		var params = new Array();
			params['custscript_bl001_test_saved_search'] = sDefaultSearch;
			params['custscript_bl001_test_period_end'] = period_end_date;
			params['custscript_bl001_test_recordid'] = new_id;
			params['custscript_bl001_test_accounttypes'] = str_types;
			var status = bl_noempty(nlapiScheduleScript(CONST_TESTSUITELET_SCRIPTID, null, params), 'Unable to queue');
			nlapiLogExecution('AUDIT', status, 'Queue scheduled script to run saved searches');
			
			var rec_update = nlapiLoadRecord('customrecord_bl001_test_instance',new_id);
			rec_update.setFieldValue('custrecord_bl001_ss_test_results', 'Running saved search tests');
			nlapiSubmitRecord(rec_update);

    		/* this times out 
            // fetch the full list through the ending period; closing balance sheet
            var result_array = bl001_Connector_Test_SuiteletRunSearch(period_end_date, sDefaultSearch);
    		if (result_array.length>0){
    			msg_list[msg_list.length] = 'Multi-currency search results:';
    			msg_list[msg_list.length] = result_array.join(' <br>\n');
    		}
    		*/
    	}
    	
    	
    	// the test is complete; redirect back to record
    	nlapiSetRedirectURL('RECORD', 'customrecord_bl001_test_instance', new_id);
    	
    	
    }
	
	var form = nlapiCreateForm('Blackline Data Connect Test Tool');
	form.addSubmitButton('Run Test');
	
	if (sMethod == 'POST'){
		if (msg_list.length == 0){
			msg_list[msg_list.length] = "Test results: No Errors.";
		}
	}
    
    if (msg_list.length>0){
        var gmsg = form.addFieldGroup( 'heading_msg', 'Msg');
        gmsg.setShowBorder(false);
        gmsg.setSingleColumn(false);
    	var msg_html = '<div style="background-color:#eeeeee;padding:20px;"><b>Test Results</b><br />' + msg_list.join('<br />') + '</div>';
    	var fldx = form.addField('custpage_msg', 'inlinehtml', '', null, 'heading_msg');
    	fldx.setDefaultValue(msg_html);
    }
    
    with(form.addFieldGroup( 'heading_group_wsurl', 'Web Service')){
    	setShowBorder(true);
    	setSingleColumn(false);
    }
    with(form.addFieldGroup( 'heading_group_wsuser', 'Username')){
    	setShowBorder(false);
    	setSingleColumn(false);
    }
    with(form.addFieldGroup( 'heading_group_wsrole', 'Role')){
    	setShowBorder(false);
    	setSingleColumn(false);
    }
    with(form.addFieldGroup( 'heading_group_wspw', 'Web Service Password')){
    	setShowBorder(false);
    	setSingleColumn(false);
    }
    bl001_addfield(form, 'Web Service URL', 'custpage_wsurl', 'heading_group_wsurl', 'text', null, 'This is the web service end point for your NetSuite account. Quickly fetching balances and exchange rates can only be performed using the NetSuite web service. The credentials are necessary for the Scheduled Script to call the web service. The URL is typically https://webservices.na1.netsuite.com/services/NetSuitePort_2013_2 or https://webservices.netsuite.com/services/NetSuitePort_2013_2 \n\n Leave the URL empty and complete the username and password fields to automatically lookup the URL.', sWS_URL);
    bl001_addfield(form, 'Web Service Username/email', 'custpage_wsuser', 'heading_group_wsuser', 'text', null, 'The web service username/email and password. When you enter the username and password and click "Run Test", the web service will be tested.', sWS_User);
    var rolefld = bl001_addfield(form, 'Web Service Role', 'custpage_role', 'heading_group_wsrole', 'select', null, '', sWS_Role, 'role');
    bl001_add_roles(rolefld, sWS_Role);
    
    var disp_type = null;
    if (1==2 && sWS_URL.length>0 && sWS_User.length>0 && sWS_Pw.length>0){
    	disp_type = 'hidden';
    	bl001_addfield(form, 'Web Service Password', 'custpage_wspw', 'heading_group_wspw', 'text', disp_type, 'The web service password.', sWS_Pw);
    	bl001_addfield(form, 'Web Service Password', 'custpage_confirmpw', 'heading_group_wspw', 'text', disp_type, 'The web service password.', sWS_Pw);
    }else{
    	var sver = context.getVersion().split('.');
    	var stopmargin = '';
    	var sextraspace = '';
    	if ( parseInt(sver[0])>2014 || (parseInt(sver[0])==2014 && parseInt(sver[1])==2) ){
    		stopmargin= 'margin-top:20px;'; 
    	}else{
    		sextraspace = '<br />';
    	}
    	var fld_html = 	'<div class="uir-field-wrapper">'+
    					'<span class="labelSpanEdit smallgraytextnolink uir-label" style="white-space: wrap;'+stopmargin+'" id="custpage_wsconfirmpw_lbl">'+
    					'<a class="smallgraytextnolink">Web Service Password</a> </span>'+
    					'<input type="password" id="custpage_wspw" name="custpage_wspw" value="" />'+
    					'</div>'+sextraspace+
    					'<div class="uir-field-wrapper">'+
    					'<span class="labelSpanEdit smallgraytextnolink uir-label" style="white-space: wrap;'+stopmargin+'" id="custpage_wsconfirmpw_lbl2">'+
    					'<a class="smallgraytextnolink">Confirm Password</a> </span>'+
    					'<input type="password" id="custpage_confirmpw" name="custpage_confirmpw" value="" />'+
    					'<br />&nbsp;<br />'+
    					'</div>';
		var fld = form.addField ('custpage_flds', 'inlinehtml', null, null, 'heading_group_wspw');
		fld.setDefaultValue (fld_html);
    }

	if (bMulticurr){
	    with(form.addFieldGroup( 'heading_group_search', 'Multi-Currency')){
	    	setShowBorder(true);
	    	setSingleColumn(false);
	    }
	    
	    bl001_addfield(form, 'Run Saved Search Test?', 'custpage_runsearch', 'heading_group_search', 'checkbox', null, 'A transaction saved search is used to roll-up foreign currency transactions in non-subsidiary currencies for the Multi-Currency Export. The search can time-out for some accounts with significant transaction volume. This tests for potential time-out problems.', sRunSavedSearchTest);

	}
	
    response.writePage( form );
	
}
// this function is the scheduled script controller to run the saved search tests
function BL001_Connector_Test_Sched()
{
	var sFunc = 'BL001_Connector_Test_Sched';
    nlapiLogExecution('AUDIT', sFunc + ' Starting.');
	
    // get script parameters
    var context = nlapiGetContext();
    var sDefaultSearch = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_test_saved_search'), '');
    var period_end_date = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_test_period_end'), '');
    var new_id = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_test_recordid'), '');
    var str_types = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_test_accounttypes'), '');
    
    // load the results record
    var results_record = nlapiLoadRecord('customrecord_bl001_test_instance', new_id);
    
    // create an array of the remaining account types and fetch the last value
    var account_types = str_types.split(',');
    var accounttype = account_types.pop();
    
    // run the search
    var msg = bl001_Connector_Test_RunSearch(period_end_date, sDefaultSearch, accounttype);
    
    // save results
    var new_msg = bl_noempty( results_record.getFieldValue('custrecord_bl001_ss_test_results'), '') + '\n' + msg;
    results_record.setFieldValue('custrecord_bl001_ss_test_results', new_msg);
    nlapiSubmitRecord(results_record);
    
    // requeue the script
    if (account_types.length>0){
    	var context = nlapiGetContext();
		var params = new Array();
		params['custscript_bl001_test_saved_search'] = sDefaultSearch;
		params['custscript_bl001_test_period_end'] = period_end_date;
		params['custscript_bl001_test_recordid'] = new_id;
		params['custscript_bl001_test_accounttypes'] = account_types.join(',');
		var status = bl_noempty(nlapiScheduleScript(CONST_TESTSUITELET_SCRIPTID, context.getDeploymentId(), params), 'Unable to queue');
		nlapiLogExecution('AUDIT', status, 'Queue scheduled script to run saved searches');
    }else{
    	var results_record = nlapiLoadRecord('customrecord_bl001_test_instance', new_id);
        var end_msg = bl_noempty( results_record.getFieldValue('custrecord_bl001_ss_test_results'), '') + '\n' + 'Test complete.';
        results_record.setFieldValue('custrecord_bl001_ss_test_results', end_msg);
        nlapiSubmitRecord(results_record);
    }

}
// this function fetches the list of account types and returns a string
function bl001_Connector_Test_FetchAccountTypes()
{
	var ret_val = new Array();
	
	// get a list of account types
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('type', null, 'group');
	columns[1] = new nlobjSearchColumn('internalid', null, 'count');
	var account_types = nlapiSearchRecord('account', null, null, columns);
	
	var type_len = account_types.length;
	nlapiLogExecution('DEBUG', 'account_types.length', type_len);
	for (var ti=0; ti<type_len; ti++){
		var type_row = account_types[ti];
		var cols = type_row.getAllColumns();
		var accounttype = type_row.getValue(cols[0]);
		var accounttype_txt = type_row.getText(cols[0]);
		var rev = "NonPosting|Income|OthIncome|";
		if (rev.indexOf('|'+accounttype+'|')>=0)
			{
			continue;
			}	
		var exp = "|COGS|Expense|OthExpense|";
		if (exp.indexOf('|'+accounttype+'|')>=0)
			{
			continue;
			}	
		
		nlapiLogExecution('DEBUG', ti + '. ' + accounttype, accounttype_txt);
		ret_val[ret_val.length] = accounttype;
	}
	
	return ret_val;
}
//this function fetches the list of account types and returns a string
function bl001_Connector_Test_RunSearch(period_end_date, sSavedSearch, accounttype)
{
	
	var ret_val = accounttype + ' Search failed'; 

	// get the column definition from the saved search so we can get the formula when we need to loop
	var this_search = nlapiLoadSearch('transaction', sSavedSearch);
	if (!this_search)return -1;
	var columns = this_search.getColumns();
	var last_sort_val = null; 					// hold the last sort_val as we loop
	var sort_formula = columns[3].getFormula();	// this is the formula for the sort column
	
	var loop_counter = 0;	// keep track of # of loops to fetch all records
	var all_done = false;
	while (all_done==false){
		
		var new_filters = new Array();
		
		// add the account type filter
		new_filters[new_filters.length] = new nlobjSearchFilter('accounttype', null, 'is', accounttype);
		
		// add the period filters
		new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'onorbefore', period_end_date);
		
		// if we are looping, we add a new filter on the sort column so we don't re-fetch the same rows
		//var debug_string = "";
		if (loop_counter>0){
	        var oFilt = new nlobjSearchFilter('formulanumeric', null, 'equalto', 1);
	        var new_formula = "case when " + sort_formula + " > '" + last_sort_val + "' then 1 else 0 end"; 
	        oFilt.setFormula(new_formula);
	        new_filters[new_filters.length] = oFilt;
	        //debug_string = new_formula;
		}
		
		//nlapiLogExecution('DEBUG', 'about to run search');
		var results = null;
		// run the search
		try{
			results = bl_noempty(nlapiSearchRecord('transaction', sSavedSearch, new_filters, null),{length:0});
			ret_val = accounttype + ' Search succeeded with ' + results.length + ' records.';
			nlapiLogExecution('DEBUG', 'Ran search:', ret_val);
		}catch(ie){
			if ( ie instanceof nlobjError ){
				ret_val = accounttype + ' Search failed ' + ie.getCode();
				nlapiLogExecution('DEBUG', 'search failed',  ie.getCode());
			}else{
				nlapiLogExecution('DEBUG', 'search failed');
			}
			results = {length:0};
		}
		// if the number of results is our maximum, we need get the sort value for our filter when we re-run/loop
		if (results.length == CONST_ACCOUNT_MAX_RECORDS){
			// get a reference to the last nlobjSearchResult object
			var final_result = results[CONST_ACCOUNT_MAX_RECORDS-1];
			var final_cols = final_result.getAllColumns();
			var sort_col = final_cols[CONST_COL_SORT];
			// get the sort value from the sort column
			last_sort_val = final_result.getValue(sort_col);
		} else {
			all_done = true;
		}
		
		// loop safety
		loop_counter += 1;
		if (loop_counter > CONST_LOOPSAFETY)return -1;
	}
	//nlapiLogExecution('AUDIT', loop_counter + '.' + accounttype, ret_val + ' records');
	
	return ret_val;
	
}

/* reprocess in scheduled script
// this function adds the new filters and runs the saved search for testing; it returns a string array of results 
function bl001_Connector_Test_SuiteletRunSearch(period_end_date, sSavedSearch)
{
	nlapiLogExecution('DEBUG', 'bl001_Connector_Test_SuiteletRunSearch', period_end_date+'|'+sSavedSearch);
	
	var ret_val = new Array(); // return the results

	// get a list of account types
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('type', null, 'group');
	columns[1] = new nlobjSearchColumn('internalid', null, 'count');
	var account_types = nlapiSearchRecord('account', null, null, columns);
	
	// run the query for each account type so we don't get everything at once
	var type_len = account_types.length;
	nlapiLogExecution('DEBUG', 'account_types.length', type_len);
	var i = -1;
	for (var ti = 0; ti < type_len; ti++){
		// get the account type that we will filter on
		var type_row = account_types[ti];
		var cols = type_row.getAllColumns();
		var accounttype = type_row.getValue(cols[0]);
		var accounttype_txt = type_row.getText(cols[0]);
		//nlapiLogExecution('DEBUG', ti + '. ' + accounttype, accounttype);
		
		var rev = "|Income|Other Income|";
		if (rev.indexOf('|'+accounttype_txt+'|')>=0)
			{
			continue;
			}	
		var exp = "|Cost of Goods Sold|Expense|Other Expense|";
		if (exp.indexOf('|'+accounttype_txt+'|')>=0)
			{
			continue;
			}	
		
		i++;
		ret_val[i] = accounttype + ' Search failed'; 

    	// get the column definition from the saved search so we can get the formula when we need to loop
    	var this_search = nlapiLoadSearch('transaction', sSavedSearch);
    	if (!this_search)return -1;
		var columns = this_search.getColumns();
		var last_sort_val = null; 					// hold the last sort_val as we loop
		var sort_formula = columns[3].getFormula();	// this is the formula for the sort column
		
    	var loop_counter = 0;	// keep track of # of loops to fetch all records
    	var all_done = false;
    	while (all_done==false){
    		
    		var new_filters = new Array();
    		
    		// add the account type filter
    		new_filters[new_filters.length] = new nlobjSearchFilter('accounttype', null, 'is', accounttype);
    		
    		// add the period filters
			new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'onorbefore', period_end_date);
    		
    		// if we are looping, we add a new filter on the sort column so we don't re-fetch the same rows
    		//var debug_string = "";
    		if (loop_counter>0){
    	        var oFilt = new nlobjSearchFilter('formulanumeric', null, 'equalto', 1);
    	        var new_formula = "case when " + sort_formula + " > '" + last_sort_val + "' then 1 else 0 end"; 
    	        oFilt.setFormula(new_formula);
    	        new_filters[new_filters.length] = oFilt;
    	        //debug_string = new_formula;
    		}
    		
    		//nlapiLogExecution('DEBUG', 'about to run search');
    		var results = null;
    		// run the search
    		try{
    			results = bl_noempty(nlapiSearchRecord('transaction', sSavedSearch, new_filters, null),{length:0});
    			ret_val[i] = accounttype + ' Search succeeded with ' + results.length + ' records.';
    			nlapiLogExecution('DEBUG', 'Ran search:', ret_val[i]);
    		}catch(ie){
    			if ( ie instanceof nlobjError ){
    				ret_val[i] = accounttype + ' Search failed ' + ie.getCode();
    				nlapiLogExecution('DEBUG', 'search failed',  ie.getCode());
    			}else{
    				nlapiLogExecution('DEBUG', 'search failed');
    			}
    			results = {length:0};
    		}
    		// if the number of results is our maximum, we need get the sort value for our filter when we re-run/loop
    		if (results.length == CONST_ACCOUNT_MAX_RECORDS){
    			// get a reference to the last nlobjSearchResult object
    			var final_result = results[CONST_ACCOUNT_MAX_RECORDS-1];
    			var final_cols = final_result.getAllColumns();
    			var sort_col = final_cols[CONST_COL_SORT];
    			// get the sort value from the sort column
    			last_sort_val = final_result.getValue(sort_col);
    		} else {
    			all_done = true;
    		}
    		
    		// loop safety
    		loop_counter += 1;
    		if (loop_counter > CONST_LOOPSAFETY)return -1;
    	}
    	
    	//nlapiLogExecution('AUDIT', loop_counter + '.' + accounttype, ret_val + ' records');
	}
	return ret_val;
}
*/

// beforeLoad custom record: customrecord_bl001_test_instance 
// redirect immediately to the suitelet upon 'create'
function BL001_Connector_Test_BeforeLoad(type, form)
{
	nlapiLogExecution('AUDIT', 'BL001_Connector_Test_BeforeLoad Starting', type);
	
	if (type=='create'){
		nlapiSetRedirectURL('SUITELET', 'customscript_bl001_test_suitelet', '1');
	}
	

}

//------------------------------------------------------------------
//Function:         BL001_Connector_BLLogin_Suitelet
//Script Type:      Suitelet to show the blackline login page
//Script ID:
//Deployment ID:
//Description:		Edit the Connector Settings row; 
//					Update the columns in the saved searches for Account Export depending on features enabled
//Task:
//Date:             SG 20130213
//					SG 20140318 Add web services information
//					SG 20140911 Add user role option for web service user authentication
//------------------------------------------------------------------
function BL001_Connector_BLLogin_Suitelet(request, response)
{
	if (bl_noempty(g_connector_settings.url,'').length>0){
		var resp = nlapiRequestURL(g_connector_settings.url);
		var content = resp.getBody();
		response.write('<BASE href="' + g_connector_settings.url + '" target="_parent" />');
		response.write(content);
		return;
	}
	throw(nlapiCreateError('SETUP_ERROR', 'Blackline Data Connect is not setup with a login URL. Contact your administrator.'));
}
//------------------------------------------------------------------
//Function:         BL001_Connector_Setup_Suitelet
//Record:			customrecord_bl001_connector_setup           
//Subtab:
//Script Type:      Suitelet to edit a single record and create it, if necessary
//Script ID:
//Deployment ID:
//Description:		Edit the Connector Settings row; 
//					Update the columns in the saved searches for Account Export depending on features enabled
//Task:
//Date:             SG 20130213
//					SG 20140318 Add web services information
//					SG 20140911 Add user role option for web service user authentication
//------------------------------------------------------------------
function BL001_Connector_Setup_Suitelet(request, response)
{
	var sFunc = 'BL001_Connector_Setup_Suitelet';
    var sMethod = request.getMethod();
    nlapiLogExecution('AUDIT', sFunc + ' Starting. method, userid, m_bAdmin', sMethod + '|' + g_bAdmin);
    
    /* make sure features are enabled
	this.base_currency = null;			// this will contain {id: name:} object for the currency ID
	this.base_currency_iso = null;
	this.feature_docs = false;
	this.feature_multi_curr = false;
	this.feature_dept = false;
	this.feature_class = false;
	this.feature_location = false;  */
    if (!g_company_settings.verifysetup()){
        throw nlapiCreateError('10000', 'ERROR. These NetSuite features are pre-requisites for Blackline Data Connect to run: '+g_company_settings.verifysetup_error);
    }
    
	var WSURL_Msg = ''; // show message; if we discover the web service has a different URL, warn user
    
	var whatismyip = bl_noempty(request.getParameter('whatismyip'),'');
	if (whatismyip.length>0){
    	var resp = nlapiRequestURL( 'http://www.whatismyip.com/');
    	var myip = resp.getBody();
    	response.write(myip);
    	return;
	}
	
    // if the user clicked the button to create exchange rate records
    var createexchrate = bl_noempty(request.getParameter('createexchrate'),"");
    if (createexchrate.length>0){
    	// get the parent reporting subsidiary from the first profile record
    	var profiles = bl_noempty(nlapiSearchRecord('customrecord_bl001_nsconnector_status'),{length:0});
    	if (profiles.length==0){
    		throw nlapiCreateError('10000', 'ERROR: Before creating exchange records, you must setup one profile record. The parent reporting ID is required.');
    		return;
    	}
    	var profile_id = profiles[0].getId();
    	var profile = nlapiLoadRecord('customrecord_bl001_nsconnector_status', profile_id);
    	var parent_id = bl_noempty(profile.getFieldValue('custrecord_bl001_reporting_sub'),"");
    	if (parent_id.length==0){
    		throw nlapiCreateError('10000', 'ERROR: Before creating exchange records, you must setup a profile record and define the reporting parent for currency translation.');
    		return;
    	}
    	// fetch the accounting period from the profile
		var account_reportingperiod = profile.getFieldValue('custrecord_bl001_account_reportingperiod');
    	var end_date = profile.getFieldValue('custrecord_bl001_period_end_date');
		var period = bl001_period(account_reportingperiod, start_date, end_date);
		end_date = period.end;
		var period_id = bl001_Get_Accounting_Period(end_date).id;
		// load the subsidiary to obtain the parent currency
		var sub_record = bl_noempty(nlapiSearchRecord('subsidiary', null, [new nlobjSearchFilter('internalid', null, 'anyof', [parent_id])], [new nlobjSearchColumn('currency')]),{length:0});
		if (sub_record.length==0){
			throw nlapiCreateError("10000", "ERROR: Unable to fetch subsidiary");
			return;
		}
		var sub_curr = sub_record[0].getValue('currency');
		nlapiLogExecution('DEBUG', 'sub_curr', sub_curr);
		
		// get a list of subsidiaries that have a different currency
		// and create a consol exch rate record for each one for the selected period
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('currency', null, 'noneof', [sub_curr]);
		filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('currency');
		var child_subs = bl_noempty(nlapiSearchRecord('subsidiary', null, filters, columns),{length:0});
		var clen = child_subs.length;
		var cc = 0;
		for (var c=0; c<clen; c++){
			var child_id = child_subs[c].getId();
			var child_curr = child_subs[c].getValue('currency');
			nlapiLogExecution('DEBUG', 'child_curr', child_curr);
			if (child_curr != sub_curr){
				cc++;
				var new_rec = nlapiCreateRecord('customrecord_bl001_exchange_rates');
				new_rec.setFieldValue('custrecord_bl001_exchrate_period', period_id);
				new_rec.setFieldValue('custrecord_bl001_exchrate_fromsub', child_id);
				new_rec.setFieldValue('custrecord_bl001_exchrate_tosub', parent_id);
				nlapiSubmitRecord(new_rec, false, true);
			}
		}
		if (cc==0){
			throw nlapiCreateError("10000", "ERROR: There are no child subsidiaries with a different currency");
			return;
		}

		// redirect back to this page so we don't rebuild them
		WSURL_Msg = "NOTICE: " + clen + " records created for consolidated exchange rate period id " + period_id;
	    	params = new Array();
	    	params["custparam_msg"] = WSURL_Msg;
		nlapiSetRedirectURL('SUITELET', CONST_BLACKLINE_SETUP_SUITELET, 1, null, params);
		return;
		
    }
    
    // DEBUG MODE
    // did we request the XML fetch?
	var debug_xml = bl_noempty(request.getParameter('custparam_debugxml'),"");
	if (debug_xml.length==0){
		debug_xml = bl_noempty(request.getParameter('custpage_debugxml'),"");
	}
	if (debug_xml.length>0){
    	
		// the profile will give us data to use for the web service query and the reporting subsidiary for the exchange rate call
		var profile_id = bl_noempty(request.getParameter('custparam_profileid'),"");
		if (profile_id.length==0){
			profile_id = bl_noempty(request.getParameter('custpage_profileid'),"");
		}
		var custpage_request_page = bl_noempty(request.getParameter('custpage_request_page'), '');
		
		// this is a field on the page; are we posting?
		if (custpage_request_page.length>0){
			var custpage_reporting_sub = bl_noempty(request.getParameter('custpage_reporting_sub'), '');
			var custpage_period_start = bl_noempty(request.getParameter('custpage_period_start'), '');
			var custpage_period_end = bl_noempty(request.getParameter('custpage_period_end'), '');
			// get the period number / name from this info
			// should we show the request or the response XML?
			var request_or_response = bl_noempty(request.getParameter('custpage_request_or_response'), '');
			if (custpage_reporting_sub.length>0 && custpage_period_start.length>0 && custpage_period_end.length>0){
				var custpage_save_response  = bl_noempty(request.getParameter('custpage_save_response'), 'F');
				var custpage_save_postprocess = bl_noempty(request.getParameter('custpage_save_postprocess'), 'F');
				var xml_show = '<error>Unknown error; unable to show xml</error>';
				switch(debug_xml){
				case 'account':
			    	// determine which fields to load based on what keys we need
					var profile = nlapiLoadRecord('customrecord_bl001_nsconnector_status', profile_id);
					var sub_filter = profile.getFieldValues('custrecord_bl001_account_sub_filter');
				    var sub_filter_txt = '';
				    if (sub_filter){
				    	if (sub_filter.constructor === Array){
						    if (sub_filter.length > 1){
						    	sub_filter_txt = sub_filter.join(',');
						    }else if (sub_filter.length == 1){
						    	sub_filter_txt = sub_filter[0];
						    }else{
						    	sub_filter_txt = '';
						    }
					    }else{
					    	if (sub_filter.length>0){
					    		sub_filter_txt = sub_filter;
					    	}else{
					    		sub_filter_txt = '';
					    	}
				    	}
				    }else{
				    	sub_filter_txt = '';
				    }
				    var single_sub_filter = null;
				    if (sub_filter_txt.length>0){
				    	if (sub_filter_txt.indexOf(',')<=0){
				    		single_sub_filter = sub_filter_txt;
				    	}
				    }
				    
					var key1 = profile.getFieldValue('custrecord_bl001_account_key_1');
					var key3 = profile.getFieldValue('custrecord_bl001_account_key_3');
					var key4 = profile.getFieldValue('custrecord_bl001_account_key_4');
					var key5 = profile.getFieldValue('custrecord_bl001_account_key_5');
			    	var hide_sub = true;
			    	var hide_location = true;
			    	var hide_class = true;
			    	var hide_department = true;
			    	if (key1 == "Subsidiary" || key1 == CONST_ENTITY_KEY_SUB 
			    	    	 || key3 == "Subsidiary" || key3 == CONST_ENTITY_KEY_SUB
			    	    	 || key4 == "Subsidiary" || key4 == CONST_ENTITY_KEY_SUB
			    	    	 || key5 == "Subsidiary" || key5 == CONST_ENTITY_KEY_SUB){
			    		hide_sub = false;
			    	    	}
			    	if (key1 == "Location" || key1 == CONST_ENTITY_KEY_LOC 
			    	    	 || key3 == "Location" || key3 == CONST_ENTITY_KEY_LOC
			    	    	 || key4 == "Location" || key4 == CONST_ENTITY_KEY_LOC
			    	    	 || key5 == "Location" || key5 == CONST_ENTITY_KEY_LOC){
			    		hide_location = false;
			    	    	}
			    	if (key1 == "Class" || key1 == CONST_ENTITY_KEY_CLA 
			    	    	 || key3 == "Class" || key3 == CONST_ENTITY_KEY_CLA
			    	    	 || key4 == "Class" || key4 == CONST_ENTITY_KEY_CLA
			    	    	 || key5 == "Class" || key5 == CONST_ENTITY_KEY_CLA){
			    		hide_class = false;
			    	    	}
			    	if (key1 == "Department" || key1 == CONST_ENTITY_KEY_DEP 
			    	    	 || key3 == "Department" || key3 == CONST_ENTITY_KEY_DEP
			    	    	 || key4 == "Department" || key4 == CONST_ENTITY_KEY_DEP
			    	    	 || key5 == "Department" || key5 == CONST_ENTITY_KEY_DEP){
			    		hide_department = false;
			    	    	}
    				// build the request string
			    	if (custpage_save_response == 'T'){

			    	    	// this function loads the summary rows via the web service for all accounts/periods/subsidiaries
			    	    	var soap_action = 'getPostingTransactionSummary';
			    	    	
			    	    	var cnt = 1;
			    	    	var keep_looking = true;
			    	    	var rows = [];
			    	    	
			    	    	while (keep_looking){
			    	    		
			    				// build the request string
			    				var str_xml = xml_getPostingTransactionSummary(cnt, hide_sub, hide_location, hide_class, hide_department, single_sub_filter);
			    				
			    	    		// fetch the xml
			    	    		var resp_xml = call_ws(str_xml, soap_action);
			    	    		
			    	    		if (custpage_save_postprocess == 'F'){
			    	    			rows[rows.length] = resp_xml;
			    	    		}
			    	    		
			    	    		//response.setContentType('XMLDOC');
			    	    		//response.write(resp_xml);
			    	    		//return;
			    	    		var xml = nlapiStringToXML(resp_xml);
			    	    		var nodes = nlapiSelectNodes(xml, "//platformCore:postingTransactionSummary");
			    	    		var nlen = nodes.length;
			    	    		//nlapiLogExecution('DEBUG', 'nodes.length', nlen);
			    	    		// we don't keep looking if we didn't get the maximum number of records back
			    	    		if (nlen < CONST_ACCOUNT_MAX_RECORDS){
			    	    			keep_looking = false;
			    	    		}
			    	    		if (custpage_save_postprocess == 'T'){
				    	    		// load the rows from the response nodes
				    	    		for (var n=0; n<nlen; n++){
				    	    			var node = nodes[n];
				    	    			//response.write("<HR>"+node.nodeName+"<BR>");
				    	    			var row = {};
				    	    			row["subsidiary"] = null;
				    	    			row["account"] = null;
				    	    			row["location"] = null;
				    	    			row["class"] = null;
				    	    			row["department"] = null;
				    	    			row["period"] = null;
				    	    			row["amount"] = 0;
				    	    			if (node.hasChildNodes()){
				    	    				var nnode = node.firstChild;
				    	    				while (nnode){
				    	    					var fld = nnode.nodeName.split(':')[1];
				    	    					var val = null;
				    	    					if (fld=='amount'){
				    	    						val = nnode.firstChild.nodeValue;
				    	    					}else{
				    	    						val = nnode.attributes.getNamedItem('internalId').value;
				    	    					}
				    	    					row[fld] = val;
				    	    					nnode = nnode.nextSibling;
				    	    				}
				    	    			}
				    	    			// if the period is null, this node is a current balance node
				    	    			// which we will disregard
				    	    			if ( bl_noempty(row["period"],"").length > 0 ){
				    	    				rows[rows.length] = row;	
				    	    			}
				    	    		}
			    	    		}
			    	    		
			    	    		
			    	    		// fetch the next page if necessary
			    	    		cnt++;
			    	    		
			    	    		if (cnt > 50){		// in a suitelet, we don't have too many cpu resources so we limit
			    	    			throw(nlapiCreateError('FETCH_ERROR', 'Too many pages'));
			    	    			return rows;
			    	    		}
			    	    	}

			    	        // create the file
			    	        // make sure the folder exists; create it if necessary
			    	        var folder_id = bl001_getfolder("temp");
			    	        var tempfile = 'fetch_balances_xml';
			    	        if (custpage_save_postprocess=='T'){
			    	        	tempfile = 'fetch_balances_postprocess';
			    	        }
			    	        var chunksize = 5000000;
							var contents = JSON.stringify(rows);
							var len = contents.length;
							var ctr = 0;
							var files_created = [];
							while (len > 0){
								ctr++;
								// is there more than our max chunk?
								var chunk = null;
								if (len>chunksize){
									chunk = contents.substring(0, chunksize);
									contents = contents.substring(chunksize);
								}else{
									chunk = contents;
									contents = '';
								}
								len = contents.length;
								var filename = tempfile.concat(ctr).concat('.txt');
				    	    	var et_file = nlapiCreateFile(filename, 'PLAINTEXT', chunk);
				    	    	et_file.setFolder(folder_id);
				    	    	// save the file
				    	    	var file_id = nlapiSubmitFile(et_file);
				    	    	if (file_id){
				    	    		files_created[files_created.length] = filename;	
				    	    	}
							}
							
							var account_list = new bl001_lookuplist('account');
			    	    	var et_file = nlapiCreateFile('accounts.txt', 'PLAINTEXT', JSON.stringify(account_list.list_obj()));
			    	    	et_file.setFolder(folder_id);
			    	    	// save the file
			    	    	var file_id = nlapiSubmitFile(et_file);
			    	    	if (file_id){
			    	    		files_created[files_created.length] = 'accounts.txt';	
			    	    	}

							var period_list = new bl001_lookuplist('accountingperiod');
			    	    	var et_file = nlapiCreateFile('periods.txt', 'PLAINTEXT', JSON.stringify(period_list.list_obj()));
			    	    	et_file.setFolder(folder_id);
			    	    	// save the file
			    	    	var file_id = nlapiSubmitFile(et_file);
			    	    	if (file_id){
			    	    		files_created[files_created.length] = 'periods.txt';	
			    	    	}
							
			    	    	// output results
			    	    	if(files_created.length>0){
			    	    		response.write("Debug file(s) created in File Cabinet: Documents > temp > <br>");
			    	    		response.write(files_created.join('<br>'));
			    	    	}else{
			    	    		response.write("Error creating debug file");
			    	    	}
			    	    	
			    	    	return;
			    		
			    	}else{
						var soap_action = 'getPostingTransactionSummary';
	    				var str_xml = xml_getPostingTransactionSummary(custpage_request_page, hide_sub, hide_location, hide_class, hide_department, single_sub_filter);
	    				if (request_or_response == 'T'){
	    					xml_show = bl001_cleanpass(str_xml);
	    				}else{
	    					// fetch the xml
	    					xml_show = call_ws(str_xml, soap_action);
	    				}
						break;
			    	}
				case 'exchange':
					// get the matching period for the end date
					var this_period = bl001_Get_Accounting_Period(custpage_period_end, false, false);
					if (!this_period){
						xml_show = '<error>period is null performing lookup for ' + custpage_period_end + '</error>';
					}else{
						if (this_period.id){
	    					// fetch the xml
	    					var soap_action = 'getConsolidatedExchangeRate';
	    					var str_xml = xml_getConsolidatedExchangeRate(this_period.id, custpage_reporting_sub);
	        				if (request_or_response == 'T'){
	        					xml_show = bl001_cleanpass(str_xml);
	        				}else{
	        					xml_show = call_ws(str_xml, soap_action);
	        				}
						}else{
							xml_show = '<error>period.id is null performing lookup for ' + custpage_period_end + '</error>';
						}
					}
					break;
				default:
					xml_show = '<error>debug_xml parameter must be account or exchange</error>';
					break;
				}
				if (xml_show.indexOf('<html>')<0){
					response.setContentType('XMLDOC');
				}
        		response.write(xml_show);
        		return;
			}else{
				throw(nlapiCreateError("-99", "Reporting subsidiary and period start and end dates must be specified"));
			} 
			
		}else{
        	var form = nlapiCreateForm('Blackline Data Connect Debug Tool');
        	form.addSubmitButton('Show XML');
        	
    		with(form.addFieldGroup('custpage_debug_group', 'Debug Options')){
    			setShowBorder(false);
    			setSingleColumn(true);
    		}

    		// default to prior period YTD
        	var def_period = bl001_month(-1);
        	var yr = bl001_year(0);
        	def_period.start = yr.start;
        	var start_date = def_period.start;
        	var end_date = def_period.end;
        	var subid = 1;
        	var period = null;
        	var profile_name = "";
        	if (profile_id.length>0){
        		//try{
        			var profile = nlapiLoadRecord('customrecord_bl001_nsconnector_status', profile_id);
        			profile_name = profile.getFieldValue('name');
        			subid = profile.getFieldValue('custrecord_bl001_reporting_sub');
        			var account_reportingperiod = profile.getFieldValue('custrecord_bl001_account_reportingperiod');
        			period = bl001_period(account_reportingperiod, start_date, end_date);
        			start_date = period.start;
        			end_date = period.end;
        		//}catch(e){
        		//}
        	}
        	
    		var html = '<div class="input">';
    		html += 'This debug tool facilitates interactive tests of the NetSuite web service. By default, it will select the ';
    		html += 'reporting subsidiary for currency translation and the period start and end dates based on the profile. ';
    		html += 'You may change the values for testing purposes to see different XML output.';
    		html += '</div>';
    		with(form.addField("custpage_debug_txt", "inlinehtml", "", null, 'custpage_debug_group')){
    			setDefaultValue(html);
    		}

        	with(form.addField('custpage_profileid', 'text', 'Profile', null, 'custpage_debug_group')){
        		setDefaultValue(profile_id);
        	}
        	with(form.addField('custpage_reporting_profile', 'text', 'Profile Name', null, 'custpage_debug_group')){
        		setDefaultValue(profile_name);
        		setDisplayType('inline');
        	}
        	with(form.addField('custpage_reporting_sub', 'select', 'Reporting Parent Subsidiary for Currency', 'subsidiary', 'custpage_debug_group')){
        		setDefaultValue(subid);
        	}
        	with(form.addField('custpage_period_start', 'date', 'Period Start Date', null, 'custpage_debug_group')){
        		setDefaultValue(start_date);
        	}
        	with(form.addField('custpage_period_end', 'date', 'Period End Date', null, 'custpage_debug_group')){
        		setDefaultValue(end_date);
        	}
			var this_period = bl001_Get_Accounting_Period(end_date, false, false);
        	with(form.addField('custpage_accounting_period', 'text', 'Accounting Period', null, 'custpage_debug_group')){
        		setDefaultValue(this_period.periodname + ' [' + this_period.id + ']');
        		setDisplayType('inline');
        	}
        	with(form.addField('custpage_request_page', 'integer', 'Page Number', null, 'custpage_debug_group')){
        		setDefaultValue(1);
        	}
        	with(form.addField('custpage_debugxml', 'select', 'XML to Show', null, 'custpage_debug_group')){
        		var selected;
        		if (debug_xml=='account'){
        			selected = true;
        		}else{
        			selected = false;
        		}
        		addSelectOption('account', 'getPostingTransactionSummary', selected);
        		if (debug_xml=='exchange'){
        			selected = true;
        		}else{
        			selected = false;
        		}
        		if (g_connector_settings.bOneWorld){
        			addSelectOption('exchange', 'getConsolidatedExchangeRate', selected);
        		}
        	}
        	with(form.addField('custpage_request_or_response', 'checkbox', 'Show Request XML', null, 'custpage_debug_group')){
        		setDefaultValue('F');
        	}
        	with(form.addField('custpage_save_response', 'checkbox', 'Save Response', null, 'custpage_debug_group')){
        		setDefaultValue('F');
        	}
        	with(form.addField('custpage_save_postprocess', 'checkbox', 'Save Post Processed JSON', null, 'custpage_debug_group')){
        		setDefaultValue('F');
        	}
        	
        	response.writePage( form );
        	return;
		}
		
	response.write('Please try again');
	return;
	}

	var context = nlapiGetContext();
    //:::::::::::::::::::::::
    //:: SAVE DATA
    //:::::::::::::::::::::::
    // user clicked save
    if (sMethod == 'POST')
    {
    	var bProduction = true;
    	if (context.getEnvironment() != 'PRODUCTION'){
    		bProduction = false;
    	}
    	var sOneWorld = request.getParameter('custpage_oneworld');
    	var sWS_URL = bl_noempty(request.getParameter('custpage_wsurl'), '');
    	var hold_URL = sWS_URL;
    	var sWS_User = bl_noempty(request.getParameter('custpage_wsuser'), '');
    	var sWS_Pw = bl_noempty(request.getParameter('custpage_wspw'), '');
    	var sWS_PwC = bl_noempty(request.getParameter('custpage_confirmpw'), '');
    	var sWS_Role = bl_noempty(request.getParameter('custpage_role'), '3');
    	
    	//var donotuse_exchrate_ws = "";
    	var donotuse_exchrate_ws = bl_noempty(request.getParameter('custpage_donotuse_exchrate_ws'), 'F');
    	
    	// if one field has a value, they both should
    	if ((sWS_Pw.length>0 || sWS_PwC.length>0) && (!(sWS_Pw.length>0 && sWS_PwC.length>0))){
    		throw(nlapiCreateError("-99", "Password and Confirm Password must have a value to test the web service."));
    		return;
    	}
    	// if the password fields are empty, we will not update the password
    	if (sWS_Pw.length > 0 && sWS_PwC.length > 0 && sWS_User.length > 0 && sWS_Role.length > 0){
	    	if (!(sWS_Pw == sWS_PwC)){
	    		throw(nlapiCreateError("-99", "Password and Confirm Password do not match"));
	    		return;
	    	}
	    	try{
		    	// get the url
	        	var sysURL = "https://rest.netsuite.com/rest/roles";
	        	if (!bProduction){
	        		sysURL = "https://rest.sandbox.netsuite.com/rest/roles";
	        	}
	            //Setting up Headers 
	            var headers = new Array();
	            headers['User-Agent-x'] = 'SuiteScript-Call';
	            headers['Authorization'] = 'NLAuth nlauth_account='+g_company_settings.account+', nlauth_email='+sWS_User+', nlauth_signature='+sWS_Pw+', nlauth_role='+sWS_Role;
	            //response.write(headers['Authorization']);
	            //return;
	            headers['Content-Type'] = 'application/json';
	            var resp = nlapiRequestURL( sysURL, null , headers );
	            var JSON_String = resp.getBody();
	            if (JSON_String.indexOf("USER_ERROR")>=0){
	            	throw(nlapiCreateError("-99", "Role lookup failed. Unable to authenticate username/password against web service; please verify Username and Password and make sure that user has admin privileges."));
	            }
	            var json_obj = JSON.parse(JSON_String, reviver);
	            if (json_obj){
	            	if (json_obj.length>0){
	            		var URL_Type = "webservicesDomain"; // restDomain, systemDomain
	            		sWS_URL = json_obj[0].dataCenterURLs[URL_Type];
	            		if (URL_Type=="webservicesDomain"){
	            			sWS_URL += "/services/NetSuitePort_2013_2";
	            		}
	            	}
	            }
	            if(sWS_URL.length==0){
	            	throw(nlapiCreateError("-99", "Role lookup failed. Unable to fetch web service information; please verify Username and Password and make sure that user has admin privileges."));
	            }
	    	}catch(e){
	    		sWS_URL = hold_URL;
	    		if (e){
	    			if ( e instanceof nlobjError ){
	    				WSURL_Msg = "WARNING: " + e.getDetails();
	    			}else{
	    				WSURL_Msg = "WARNING: " + e.toString();
	    			}
	    		}
	    	}
	    	
	    	// test the web service
	    	try{
		    	var bAuth = false;
		    	var soap_action = 'getPostingTransactionSummary';
		    	// build the request string
		    	var str_xml = xml_testws(sWS_URL, sWS_User, sWS_Pw, sWS_Role);
		    	// fetch the xml
		    	var resp_xml = call_ws(str_xml, soap_action, sWS_URL);
				var xml = nlapiStringToXML(resp_xml);
				if (1==2){
					response.setContentType('XMLDOC');
					response.write(resp_xml);
					return;
				}
				try{
					var nnode = nlapiSelectNode(xml, "//platformCore:status");	
				}catch(e){
					throw(nlapiCreateError("-99", "Test of getPostingTransactionSummary failed. Please verify username/password and role."));
				}
				if (nnode){
					if (nnode.hasAttributes()){
						var resp = nnode.attributes.getNamedItem('isSuccess').value;
						if (resp){
							if (resp.length>0){
								if (resp == "true"){
									bAuth = true;
								}
							}
						}
					}
				}
		    	if (!bAuth){
			    	throw(nlapiCreateError("-99", "Test of getPostingTransactionSummary failed. Please verify username/password and role."));
			    }
	    	}catch(e){
	    		if (e){
    				if (WSURL_Msg.length==0){
    					WSURL_Msg = "WARNING: ";
    				}
	    			if ( e instanceof nlobjError ){
	    				WSURL_Msg = WSURL_Msg +" "+ e.getDetails();	
	    			}else{
    					WSURL_Msg = WSURL_Msg + " " + e.toString();
	    			}
	    		}
	    	}
	    	
	    	// if one-world, test the consolidated exchange rate web service
	    	if (sOneWorld == 'T'){
		    	try{
		    		var this_period = bl001_get_period(0, false, false).id;
			    	var bAuth = false;
			    	var soap_action = 'getConsolidatedExchangeRate';
			    	// build the request string
			    	var str_xml = xml_test_exchws(sWS_URL, sWS_User, sWS_Pw, sWS_Role, this_period);
			    	// fetch the xml
			    	var resp_xml = call_ws(str_xml, soap_action, sWS_URL);
					var xml = nlapiStringToXML(resp_xml);
					if (1==2){
						response.setContentType('XMLDOC');
						response.write(resp_xml);
						return;
					}
					try{
						var nnode = nlapiSelectNode(xml, "//platformCore:status");	
					}catch(e){
						throw(nlapiCreateError("-99", "Test of getPostingTransactionSummary failed."));
					}
					if (nnode){
						if (nnode.hasAttributes()){
							var resp = nnode.attributes.getNamedItem('isSuccess').value;
							if (resp){
								if (resp.length>0){
									if (resp == "true"){
										bAuth = true;
									}
								}
							}
						}
					}
			    	if (!bAuth){
			    		donotuse_exchrate_ws = 'T';
				    	throw(nlapiCreateError("-99", "Test of getConsolidatedExchangeRate failed."));
				    }else{
				    	donotuse_exchrate_ws = 'F';
				    }
		    	}catch(e){
		    		if (e){
	    				if (WSURL_Msg.length==0){
	    					WSURL_Msg = "WARNING: ";
	    				}
		    			if ( e instanceof nlobjError ){
		    				WSURL_Msg = WSURL_Msg +" "+ e.getDetails();	
		    			}else{
	    					WSURL_Msg = WSURL_Msg + " " + e.toString();
		    			}
		    		}

		    	}
	    	}
	    	
    	} // if passwords provided
    	
    	// get the values from the form
    	var sUrl = request.getParameter('custpage_url');
    	var sDefaultSearch = request.getParameter('custpage_account_export');
    	var default_currency = bl_noempty(request.getParameter('custpage_currency_iso_code'),"");
    	var record_object = null;
    	if (g_connector_settings.initial_setup){
    		// update the record
    		record_object = nlapiLoadRecord('customrecord_bl001_connector_setup', g_connector_settings.id);
    	}else{
    		// create a new record
    		record_object = nlapiCreateRecord('customrecord_bl001_connector_setup');
    	}
    	var setup_cutoff_close  = bl_noempty(request.getParameter('custpage_setup_cutoff_close'),'F');
    	var setup_cutoff_period = bl_noempty(request.getParameter('custpage_setup_cutoff_period'), '');
    	//var sExportAllAccounts = bl_noempty(request.getParameter('custrecord_bl001_export_all_accounts'), 'F');

    	record_object.setFieldValue('custrecord_bl001_setup_url', sUrl.trim());
    	record_object.setFieldValue('custrecord_bl001_setup_oneworld', sOneWorld);
    	record_object.setFieldValue('custrecord_bl001_setup_account_export', bl_noempty(sDefaultSearch,'').trim());
   		record_object.setFieldValue('custrecord_bl001_default_currency_code', bl_noempty(default_currency,'').trim());
   		record_object.setFieldValue('custrecord_bl001_setup_cutoff_close', setup_cutoff_close);
   		if (setup_cutoff_period.length>0){
   			record_object.setFieldValue('custrecord_bl001_setup_cutoff_period', setup_cutoff_period);
   		}else{
   			record_object.setFieldValue('custrecord_bl001_setup_cutoff_period', null);
   		}
   		record_object.setFieldValue('custrecord_bl001_accttype_timeout', null);
   		
   		record_object.setFieldValue('custrecord_bl001_webservices_username', sWS_User);
   		
   		//record_object.setFieldValue('custrecord_bl001_export_all_accounts', sExportAllAccounts);
   		
   		nlapiLogExecution('DEBUG', 'sWS_URL', sWS_URL);
   		nlapiLogExecution('DEBUG', 'hold_URL', hold_URL);
   		if (sWS_URL != hold_URL){
   			if (hold_URL.length>0){
   				if (WSURL_Msg.length==0){
   					WSURL_Msg = "WARNING: The web service URL auto-discover suggests the following " + sWS_URL;
   					sWS_URL = hold_URL;
   				}
   			}
   		}
   		
		record_object.setFieldValue('custrecord_bl001_webservices_url', sWS_URL);
   		if (!(sWS_Pw.length == 0 && sWS_PwC.length == 0)){
   			record_object.setFieldValue('custrecord_bl001_webservices_pw', sWS_Pw);
   		}
   		record_object.setFieldValue('custrecord_bl001_webservices_role', sWS_Role);
   		
   		//nlapiLogExecution('DEBUG', 'About to run FixSavedSearch', sDefaultSearch);
		BL001_FixSavedSearch(sDefaultSearch, sOneWorld);
		
		if (donotuse_exchrate_ws.length>0){
			record_object.setFieldValue('custrecord_bl001_donotuse_exchrate_ws', donotuse_exchrate_ws);
		}
		
    	// save the settings
    	nlapiSubmitRecord(record_object);
    	
    	//nlapiScheduleScript(CONST_DELETE_SCRIPTID); 
	    //nlapiScheduleScript(CONST_COPYCURR_SCRIPTID);
	    
    	// redirect back to this page
	    var params = null;
	    if (WSURL_Msg.length>0){
	    	params = new Array();
	    	params["custparam_msg"] = WSURL_Msg;
	    }
	    
	    nlapiLogExecution('DEBUG', 'WSURL_Msg', WSURL_Msg);
	    
    	nlapiSetRedirectURL('SUITELET', CONST_BLACKLINE_SETUP_SUITELET, 1, null, params);
    	
    	return;
    	
    }// if POST
    
    //:::::::::::::::::::::::
    //:: DRAW FORM
    //:::::::::::::::::::::::
    if ( sMethod == 'GET' || sMethod == 'POST')
    {
    	var form = nlapiCreateForm('Blackline Data Connect Setup');
    	form.addSubmitButton('Save');
    	form.setScript('customscript_bl001_config_client_scripts');
    	
    	if (g_connector_settings.donotuse_exchrate_ws){
    		form.addButton('custform_setupexch', 'Create Exchange Rate Records', 'BL001_CreateConsolExchRate()');
    		form.addButton('custform_setupexch', 'Setup Exchange Rates', 'BL001_SetupConsolExchRate()');
    	}
    	
    	// these are the system settings if we need to create a record
    	var sUrl = '';
    	var bOneWorld = g_company_settings.is_oneworld();
    	var sOneWorld = 'F';
    	var sDefaultSearch = '';
    	if (bOneWorld){
    		sDefaultSearch = CONST_ACCOUNT_SAVEDSEARCH_OW;
    	}else{
    		sDefaultSearch = CONST_ACCOUNT_SAVEDSEARCH;
    	}
    	var default_currency = "";
    	//var default_setup_cutoff_close = 'T';
    	//var default_setup_cutoff_period = null;
    	var sWS_URL = '';
    	var sWS_User = '';
    	var sWS_Pw = '';
    	var sWS_Role = '3';
    	
    	//var sExportAllAccounts = 'T';
    	// don't show this anymore
    	// if there are accounts in the cache list, show the buttons and respond to actions
    	/*
    	var acct_results = bl_noempty(nlapiSearchRecord('customrecord_bl001_connector_accounts'),{length:0});
    	if (acct_results.length){
	    	// look for parameter &start=[export_type]
	    	// This will queue the applicable scheduled script
	    	var export_type = bl_noempty(request.getParameter('start'),"");
	    	if (export_type.length){
	    		bl001_Start_Export(export_type);
	    	}
	        form.addButton("custpage_btn_start_compute", "Recalculate Balances Now", "BL001_StartExport('" + CONST_COMPUTE + "',0)");
    		form.addButton("custpage_btn_start_delcomp", "Delete and Recalculate All", "if(confirm('Are you sure you want to continue? \n This will remove the existing balance cache and rebuild it.')){BL001_StartExport('" + CONST_DEL_COMPUTE + "',0);return true;}");
    	}
    	*/
    	
    	// if we have a record, g_connector_settings has been initialized with it
    	if (g_connector_settings.initial_setup){
    		sDefaultSearch = g_connector_settings.default_account_saved_search;
    		bOneWorld = g_connector_settings.bOneWorld;
    		sUrl = g_connector_settings.url;
    		default_currency = g_connector_settings.default_currency_noForex;
    		
    		//response.writeLine(g_connector_settings.cutoff_close);
    		if (g_connector_settings.cutoff_close){
    			//response.writeLine('set T');
    			default_setup_cutoff_close = 'T';
    		}else{
    			default_setup_cutoff_close = 'F'; 
    		}
    		default_setup_cutoff_period = g_connector_settings.cutoff_period;
    		sWS_URL = g_connector_settings.ws_url;
    		sWS_User = g_connector_settings.ws_user;
    		sWS_Pw =g_connector_settings.ws_pw;
    		sWS_Role = bl_noempty(g_connector_settings.ws_role, '3');
    		//sExportAllAccounts = bl_noempty(g_connector_settings.export_all_accounts, 'F');
    	}
		//response.writeLine(default_setup_cutoff_close);
		//return;
    	
        var msg = bl_noempty(request.getParameter("custparam_msg"),"");
        if (msg.length==0){
        	msg = WSURL_Msg;
        }
        if (msg.length>0){
            var gmsg = form.addFieldGroup( 'heading_msg', 'Msg');
            gmsg.setShowBorder(false);
            gmsg.setSingleColumn(false);
        	var msg_html = '<div>' + msg + '</div>';
        	var fldx = form.addField('custpage_msg', 'inlinehtml', '', null, 'heading_msg');
        	fldx.setDefaultValue(msg_html);
        }
        
		

    	// switch Boolean to the netsuite checkbox value 
		if (bOneWorld){
			sOneWorld = 'T';
		}
		
        var group1 = form.addFieldGroup( 'heading_group1', 'Blackline Dashboard');
        group1.setShowBorder(true);
        group1.setSingleColumn(false);
        
        var group4 = form.addFieldGroup( 'heading_group4', 'Blackline Automatic File Pickup');
        group4.setShowBorder(true);
        group4.setSingleColumn(false);

        with(form.addFieldGroup( 'heading_group4b', 'Blackline Redirector URL')){
        	setShowBorder(true);
        	setSingleColumn(false);
        }
        
        var group2 = form.addFieldGroup( 'heading_group2', 'One World');
        group2.setShowBorder(true);
        group2.setSingleColumn(false);
        
        with(form.addFieldGroup( 'heading_group_wsurl', 'Web Service')){
        	setShowBorder(true);
        	setSingleColumn(false);
        }
        with(form.addFieldGroup( 'heading_group_wsuser', 'Web Service Username')){
        	setShowBorder(false);
        	setSingleColumn(false);
        }
        with(form.addFieldGroup( 'heading_group_wsrole', 'Role')){
        	setShowBorder(false);
        	setSingleColumn(false);
        }
        with(form.addFieldGroup( 'heading_group_wspw', 'Web Service Password')){
        	setShowBorder(false);
        	setSingleColumn(false);
        }
        /*
        with(form.addFieldGroup( 'heading_group_exportall', 'Export All Active Accounts')){
        	setShowBorder(true);
        	setSingleColumn(false);
        }
        */

        if (g_company_settings.feature_multi_curr){
        	var group3 = form.addFieldGroup( 'heading_group3', 'Account Export Saved Search');
        	group3.setShowBorder(true);
        	group3.setSingleColumn(false);
        }



        bl001_addfield(form, 'URL of Blackline Main Page', 'custpage_url', 'heading_group1', 'text', null, 'The URL of the Blackline web site. Typically, this will be <nobr>https://www.blacklineondemand.com/[YOURID]/Login/Login.aspx</nobr>', sUrl);
        
        bl001_addfield(form, 'Use NetSuite One World Configuration', 'custpage_oneworld', 'heading_group2', 'checkbox', null, 'This check box is selected if this is a One World implementation. Upon installation, Blackline Data Connect will automatically detect and select this check box, if necessary. Typically, this does not need to be changed.', sOneWorld); 
        
        bl001_addfield(form, 'Web Service URL', 'custpage_wsurl', 'heading_group_wsurl', 'text', null, 'This is the web service end point for your NetSuite account. Quickly fetching balances and exchange rates can only be performed using the NetSuite web service. The credentials are necessary for the Scheduled Script to call the web service. The URL is typically https://webservices.na1.netsuite.com/services/NetSuitePort_2013_2 or https://webservices.netsuite.com/services/NetSuitePort_2013_2 \n\n Leave the URL empty and complete the username and password fields to automatically lookup the URL.', sWS_URL);
        bl001_addfield(form, 'Web Service Username/email', 'custpage_wsuser', 'heading_group_wsuser', 'text', null, 'The web service username/email and password. When you enter the username and password and click "Save", the web service will be tested.', sWS_User);
        var rolefld = bl001_addfield(form, 'Web Service Role', 'custpage_role', 'heading_group_wsrole', 'select', null, '', sWS_Role, 'role');
        //rolefld.addSelectOption('3', 'Administrator');
        bl001_add_roles(rolefld, sWS_Role);
        
        
        var disp_type = null;
        if (1==2 && sWS_URL.length>0 && sWS_User.length>0 && sWS_Pw.length>0){
        	disp_type = 'hidden';
        	bl001_addfield(form, 'Web Service Password', 'custpage_wspw', 'heading_group_wspw', 'text', disp_type, 'The web service password.', sWS_Pw);
        	bl001_addfield(form, 'Web Service Password', 'custpage_confirmpw', 'heading_group_wspw', 'text', disp_type, 'The web service password.', sWS_Pw);
        }else{
        	var sver = context.getVersion().split('.');
        	var stopmargin = '';
        	var sextraspace = '';
        	if ( parseInt(sver[0])>2014 || (parseInt(sver[0])==2014 && parseInt(sver[1])==2) ){
        		stopmargin= 'margin-top:20px;'; 
        	}else{
        		sextraspace = '<br />';
        	}
        	var fld_html = 	'<div class="uir-field-wrapper">'+
        					'<span class="labelSpanEdit smallgraytextnolink uir-label" style="white-space: wrap;'+stopmargin+'" id="custpage_wsconfirmpw_lbl">'+
        					'<a class="smallgraytextnolink">Web Service Password</a> </span>'+
        					'<input type="password" id="custpage_wspw" name="custpage_wspw" value="" />'+
        					'</div>'+sextraspace+
        					'<div class="uir-field-wrapper">'+
        					'<span class="labelSpanEdit smallgraytextnolink uir-label" style="white-space: wrap;'+stopmargin+'" id="custpage_wsconfirmpw_lbl2">'+
        					'<a class="smallgraytextnolink">Confirm Password</a> </span>'+
        					'<input type="password" id="custpage_confirmpw" name="custpage_confirmpw" value="" />'+
        					'<br />&nbsp;<br />'+
        					'</div>';
        	//form.addField(field_id, field_type, title, field_select, field_group); 
    		var fld = form.addField ('custpage_flds', 'inlinehtml', null, null, 'heading_group_wspw');
    		fld.setDefaultValue (fld_html);
        }
        
        //bl001_addfield(form, 'Export All Active Accounts', 'custrecord_bl001_export_all_accounts', 'heading_group_exportall', 'checkbox', null, 'This check box is selected to create an account export with all active accounts including zero balances and accounts with no activity.', sExportAllAccounts);
        
        if (g_company_settings.feature_multi_curr){
        	bl001_addfield(form, 'Default Saved Search for Multi-Currency Export', 'custpage_account_export', 'heading_group3', 'text', null, 'The ID of the default saved search that is the source of data for the Multi-currency Export. After initial installation, the Blackline Data Connect will automatically detect whether the system is a NetSuite One World account. This will determine the default saved search to use when generating the Export. If desired, the value can be changed to a custom search, which can be created to enforce custom filters or account keys.', sDefaultSearch);
        }
        
        var sFileUrl = nlapiResolveURL('SUITELET', CONST_FILEPICKUP_SUITELET, 1, true);
        bl001_addfield(form, 'URL for File Pickup', 'custpage_file_pickup_url', 'heading_group4', 'text', 'inline', 'When Blackline configures your service to automatically pick-up the export files, they will need this URL and the File API Key from the export profile.', sFileUrl);

        var redir_link = nlapiResolveURL('SUITELET', CONST_REDIR_SUITELET, 1, true).replace('forms.','system.').concat('&number=[Account Number]&crit_1_mod=CUSTOM&crit_1_from=[Start Date]&crit_1_to=[End Date]');

        bl001_addfield(form, 'Register Redirector URL', 'custpage_redirector', 'heading_group4b', 'text', 'inline', 'Use this URL to enable the links from Blackline to the NetSuite account register.', redir_link);


        // if the multi-currency feature is not on, allow admin to define default currency ISO
        if (!g_company_settings.feature_multi_curr){
            var group4 = form.addFieldGroup( 'heading_group5', 'Currency ISO Code');
            group4.setShowBorder(true);
            group4.setSingleColumn(false);
            bl001_addfield(form, 'Currency ISO Code for Account Export', 'custpage_currency_iso_code', 'heading_group5', 'text', null, 'The Currency ISO Code is required for the Blackline Account Export.', default_currency);        	
        }
        
        // this error does not exist; still found errors with exchange rate file
        //if (g_connector_settings.donotuse_exchrate_ws){
        //    var group6 = form.addFieldGroup( 'heading_group6', 'Consolidated Exchange Rate Error');
        //    group6.setShowBorder(true);
        //    group6.setSingleColumn(false);
        //    bl001_addfield(form, 'Do not use consolidated exchange rate web services', 'custpage_consold_exch', 'heading_group6', 'checkbox', 'inline', 'The Blackline Connector has detected an error with the Consolidated Exchange Rate web service. This is a known problem if the multi-calendar feature is enabled. Until this error is resolved, consolidated exchange rates must be entered manually.\n\nClick the Create Exchange Rate button at the top of the page to create new exchange rate records for the period. The period is defined in the Connector Profile. \n\n Once the records are created, click the "Setup Exchange Rates" button to add the rates.\n\n To disable this workaround and retest the web service, enter the web service password and click "Save"', 'T');        	
        //}
        if (bOneWorld && (g_connector_settings.donotuse_exchrate_ws || CONST_DISABLE_EXCHANGE)){
            var group6 = form.addFieldGroup( 'heading_group6', 'Do Not Use Consolidated Exchange Rate Web Service');
            group6.setShowBorder(true);
            group6.setSingleColumn(false);
            var set_val = 'F';
            if (g_connector_settings.donotuse_exchrate_ws){
            	set_val = 'T';
            }
            bl001_addfield(form, 'Do not use consolidated exchange rate web services', 'custpage_donotuse_exchrate_ws', 'heading_group6', 'checkbox', null, 'The Blackline Connector can use its own custom record for consolidated exchange rates when an error is detected with the Consolidated Exchange Rate web service. Until this error is resolved, consolidated exchange rates must be entered manually.\n\nClick the Create Exchange Rate button at the top of the page to create new exchange rate records for the period. The period is defined in the Connector Profile. \n\n Once the records are created, click the "Setup Exchange Rates" button to add the rates.\n\n To disable this workaround and retest the web service, uncheck this box, enter the web service password and click "Save"', set_val);        	
    	}
        
        
        
        /* no longer doing this
        // add cut-off info
        if (acct_results.length){
            with(form.addFieldGroup( 'heading_group_sb', 'Stored Balance Recalculation')){
            	setShowBorder(true);
            	setSingleColumn(false);
            }
            with(form.addFieldGroup( 'heading_group_cop', 'Cut off period')){
            	setShowBorder(false);
            	setSingleColumn(false);
            }
            var hlp1 = 'Blackline stores the period balances in a custom record. Prior to sending data to Blackline every day, the balances must be refreshed.';
            var hlp2 = 'When checked, balances are not refreshed for closed periods. In addition, a cut-off period that falls after the most recent closed period can be defined. Balances will not be refreshed for this and prior periods. Specifying a recent period can dramatically improve performance of the account export because it will not keep refreshing old periods every day. If you are recording transactions to prior months, do not enter a period that falls after those transaction dates.'+
						'<br />&nbsp;<br />'+
						'Use the "Recalculate" buttons to force an immediate refresh of the stored balances.'+
						'<br />1. Select "Recalculate Balances Now" to immediately start the refresh job.'+
						'<br />2. Select "Delete and Recalculate All" to remove all stored balances and refresh everything from the beginning. ';
            bl001_addfield(form, 'Do not refresh balances for closed periods', 'custpage_setup_cutoff_close', 'heading_group_sb', 'checkbox', null, hlp1, default_setup_cutoff_close);
            bl001_addfield(form, 'Do not refresh balances prior to', 'custpage_setup_cutoff_period', 'heading_group_cop', 'select', null, hlp2, default_setup_cutoff_period, 'accountingperiod');
            /*
            var group6 = form.addFieldGroup( 'heading_group6', 'Stored Balance Recalculation');
        	group6.setShowBorder(true);
        	group6.setSingleColumn(false);
        	
        	var fld = form.addField('custpage_setup_cutoff_close', 'checkbox', 'Do not recalculate balances for closed periods', null, 'heading_group6');
        	fld.setDefaultValue(default_setup_cutoff_close);
        	var fld = form.addField('custpage_setup_cutoff_period', 'select', 'Do not recalculate balances prior to', 'accountingperiod', 'heading_group6');
        	fld.setDefaultValue(default_setup_cutoff_period);
        	fld.setLayoutType('outside', 'startrow');
        	var fld = form.addField('custpage_setup_cutoff_close_help', 'textarea', '', null, 'heading_group6');
        	fld.setDisplayType('inline');
        	fld.setDefaultValue('For G/L accounts with high transaction volume, Blackline stores the period balances in a custom record. Prior to sending data to Blackline every day, the balances must be recalculated from the underlying transactions.'+
        			'<br />&nbsp;<br />'+
        			'When checked, balances are not recalculated for closed periods. In addition, a cut-off period that falls after the most recent closed period can be defined. Balances will not be recalculated for this and prior periods. Specifying a recent period can dramatically improve performance of the account export because it will not keep recalculating old periods every day. If you are recording transactions to prior months, do not enter a period that falls after those transaction dates.'+
        			'<br />&nbsp;<br />'+
        			'Use the "Recalculate" buttons to force an immediate recalculation of the stored balances.'+
        			'<br />1. Select "Recalculate Balances Now" to immediately start the recalculate job.'+
        			'<br />2. Select "Delete and Recalculate All" to remove all stored balances and recalculate everything from the beginning. '+
        			'');
        	
        	var css_code = "<STYLE>#custpage_setup_cutoff_period_fs, #custpage_setup_cutoff_period_fs_lbl {position:relative;top:-170px;}</STYLE>";
    		var newField = form.addField ('custpage_css', 'inlinehtml', '');
    		newField.setDefaultValue (css_code);
        	*/
        	/*
            with(form.addField(field_id + '_help', 'textarea', '', null, field_group)){
            	setDisplayType('inline');
            	setDefaultValue(help_text);
            }
            */	
        	/*
        	bl001_addfield(form, 'Do not recompute balances for closed periods', 'custpage_setup_cutoff_close', 'heading_group6', 'checkbox', null, 'When checked, balances are not re-computed for closed periods. In addition, a cut-off period can be defined. Balances will not be recomputed for this and prior periods. A recent period can dramatically improve performance of the account export.', default_setup_cutoff_close);
        	var fld = bl001_addfield(form, 'Do not recompute balances prior to', 'custpage_setup_cutoff_period', 'heading_group6', 'select', null, null, default_setup_cutoff_period, 'accountingperiod');
        	fld.setLayoutType('outside', 'startrow');
        	*/
        	
        //}
        

        response.writePage( form );


    }
}
// add role options to select dropdown field
function bl001_add_roles(fld, default_value)
{
	var cols = [new nlobjSearchColumn('role', null, 'group')];
	var results = bl_noempty(nlapiSearchRecord('employee', null, null, cols),{length:0});
	var rlen = results.length;
	for (var i=0; i<rlen; i++){
		var result = results[i];
		var cols = result.getAllColumns();
		var val = result.getValue(cols[0]);
		var txt = result.getText(cols[0]);
		if (txt.indexOf('None')>=0){
			continue;
		}
		var selected = false;
		if (default_value){
			if (val == default_value){
				selected = true;
			}
		}
		fld.addSelectOption(val, txt, selected);
	}
}
// remove the password from the xml
function bl001_cleanpass(input_xml){
	var pos1 = input_xml.indexOf('<password');
	var pos2 = input_xml.indexOf('</password>');
	var beg_xml = input_xml.substring(0,pos1) + '<password xmlns="urn:core_2013_1.platform.webservices.netsuite.com">XXXXXXXXX';
	var end_xml = input_xml.substring(pos2);
	return beg_xml+end_xml;
	
}
// fix the specified saved search
function BL001_FixSavedSearch(sDefaultSearch, sOneWorld){
	nlapiLogExecution('DEBUG', 'BL001_FixSavedSearch', sDefaultSearch + '|' + sOneWorld);
	var base_currency = g_company_settings.base_currency.name;
	
	/*
	// first, fix the single account saved search used to fetch balances
	// this saved search has the same formula for local currency but uses debitamount-creditamount for the funcational/subsidiary balance
	// since we run this period by period, we don't want the query to apply exchange rates. Therefore the saved search is created with
	// Consolidated Exchange Rate = None.
	var saved_search = nlapiLoadSearch('transaction', CONST_ACCOUNT_SINGLE_SAVEDSEARCH);
	var cols = saved_search.getColumns();
	var local_col = cols[0];
	var func_col = cols[1];
	if (sOneWorld == 'T'){
		var xloc_formula  = "case when {account.type}='Bank' and {currency}<>{account.custrecord_bl001_bank_currency} then " +
		"case when abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number))*(case when {subsidiary.currency}={currency} then 1 else NVL({exchangerate},1) end) else abs(NVL({netamountnotax},0)) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end " +  
		" else " +
		"case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number)) else abs(NVL({netamountnotax},0))/(case when {subsidiary.currency}={currency} then 1 else NVL({exchangerate},1) end) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end" + 
		" end ";
		//local_col.setFormula("case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number)) else abs(NVL({netamountnotax},0))/(case when {subsidiary.currency}={currency} then 1 else NVL({exchangerate},1) end) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end");
		local_col.setFormula(xloc_formula);
	}else{
		local_col.setFormula("case when NVL({currency},'" + base_currency + "')='" + base_currency + "' then NVL({debitamount},0)-NVL({creditamount},0) else case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number)) else abs(NVL({netamountnotax},0))/( NVL({exchangerate},1)) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end end");
	}
	func_col.setFormula("NVL({debitamount},0)-NVL({creditamount},0)");
	cols[0] = local_col;
	cols[1] = func_col;
	saved_search.setColumns(cols);
	saved_search.saveSearch();
	*/

	// if the install uses a system saved search, we need to modify it depending on the features
	if (sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH_OW || sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH){
		
		// look whether department, classes & locations features are setup
		var bMultiCurr = g_company_settings.feature_multi_curr;
		var bDept  = g_company_settings.feature_dept;
		var bClass = g_company_settings.feature_class;
		var bLoc   = g_company_settings.feature_location;
		
		// if one of these feature is off, we need to adjust the saved search columns
		// the sort column #4: NVL({subsidiary.internalid},'') || '|' || NVL({account.internalid},'') || '|' || NVL({department.internalid},'') || '|' || NVL({location.internalid},'') || '|' || NVL({class.internalid},'') || '|' || NVL({currency},'')
		var sort_cols = new Array();
		// subsidiary ID
		if (sOneWorld == 'T'){
			sort_cols[sort_cols.length] = "NVL({subsidiary.internalid},'')";
		}else{
			sort_cols[sort_cols.length] = "'1'";
		}
		// Account ID
		sort_cols[sort_cols.length] = "NVL({account.internalid},'')";
		// Department ID
		if (bDept){
			sort_cols[sort_cols.length] = "NVL({department.internalid},'')";
		}else{
			sort_cols[sort_cols.length] = "''";
		}
		// Location ID
		if (bLoc){
			sort_cols[sort_cols.length] = " NVL({location.internalid},'')";
		}else{
			sort_cols[sort_cols.length] = "''";
		}
		// Class ID
		if (bClass){
			sort_cols[sort_cols.length] = "NVL({class.internalid},'')";
		}else{
			sort_cols[sort_cols.length] = "''";
		}
		// Currency
		if (bMultiCurr){
			sort_cols[sort_cols.length] = "NVL({account.custrecord_bl001_bank_currency},NVL({currency},'" + base_currency + "'))";
		}else{
			sort_cols[sort_cols.length] = "'" + "" + "'";
		}
		
		// load the saved search and update the sort column (col#3)
		var saved_search = nlapiLoadSearch('transaction', sDefaultSearch);
		var cols = saved_search.getColumns();
		
		if (sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH){
	    	// fix the formula columns to look at the base currency for non oneworld query
			// if multi-curr is not enabled, all amounts = debit-credit
			// if multi-curr is enabled,
	    	// local/account currency column:
			//case when NVL({currency},'USA')='USA' then NVL({debitamount},0)-NVL({creditamount},0) else case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number)) else abs(NVL({netamountnotax},0))/( NVL({exchangerate},1)) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end end
	    	// functional currency:
	    	//case when NVL({currency},'USA')='USA' then NVL({debitamount},0)-NVL({creditamount},0) else case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number))*( NVL({exchangerate},1)) else abs(NVL({netamountnotax},0)) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end end
	    	var local_col = cols[CONST_COL_LOCAL];
	    	var func_col = cols[CONST_COL_FUNC];
	    	var rep_col = cols[CONST_COL_REPORT];
	    	if (bMultiCurr){
	    		if (sOneWorld == 'T'){
	    			// this case shouldn't run; use basic amount fields
	    			var xformula = "NVL({debitamount},0)-NVL({creditamount},0)";
	    			local_col.setFormula(xformula);
	    			func_col.setFormula(xformula);
	    			//local_col.setFormula("case when NVL({currency},'" + base_currency + "')='" + base_currency + "' then NVL({debitamount},0)-NVL({creditamount},0) else case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number)) else round(abs(NVL({netamountnotax},0))/( NVL({exchangerate},1)),2) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end end");
	    			//func_col.setFormula("case when NVL({currency},'" + base_currency + "')='" + base_currency + "' then NVL({debitamount},0)-NVL({creditamount},0) else case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then round(abs(cast({fxamount} as number))*( NVL({exchangerate},1)) else abs(NVL({netamountnotax},0)),2) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end end");
	    		}else{
	    			// subsidiary functional currency
	    			var xfunc_formula = "NVL({debitamount},0)-NVL({creditamount},0)";
	    			func_col.setFormula(xfunc_formula);
	    			// account/local currency
		    		var xloc_formula  = "case when {type}='Currency Revaluation' then 0 else "+
		    							"case when {account.type}='Bank' and {currency}<>{account.custrecord_bl001_bank_currency} then " +
										xfunc_formula + 
										" else " +
										"case when NVL({currency},'" + base_currency + "')='" + base_currency + "' then NVL({debitamount},0)-NVL({creditamount},0) else case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(cast({fxamount} as number)) else round(abs(NVL({netamountnotax},0))/( NVL({exchangerate},1)),2) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end end" +
										" end end";
		    		local_col.setFormula(xloc_formula);
	    		}
	    	}else{
	    		local_col.setFormula("NVL({debitamount},0)-NVL({creditamount},0)");
	    		func_col.setFormula("NVL({debitamount},0)-NVL({creditamount},0)");
	    	}
	    	rep_col.setFormula("NVL({debitamount},0)-NVL({creditamount},0)");
	    	cols[CONST_COL_LOCAL] = local_col;
	    	cols[CONST_COL_FUNC] = func_col;
	    	cols[CONST_COL_REPORT] = rep_col;
		}else if (sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH_OW ){
			nlapiLogExecution('DEBUG', 'fixing CONST_ACCOUNT_SAVEDSEARCH_OW', sDefaultSearch);
	    	var local_col = cols[CONST_COL_LOCAL];
	    	var func_col = cols[CONST_COL_FUNC];
	    	var rep_col = cols[CONST_COL_REPORT];
	    	if (bMultiCurr && sOneWorld == 'T'){
	    		var xfunc_formula = "case when abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then round(abs(cast({fxamount} as number))*(case when {subsidiary.currency}={currency} then 1 else NVL({exchangerate},1) end),2) else abs(NVL({netamountnotax},0)) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end";
	    		// if the transaction currency is not the bank currency, it must be a cash account denominated in subsidiary currency; therefore, use the functional currency value
	    		// else, use the fxamount fieldc, 
	    		// else convert netamountnotax to the local account currency value if there is an exchange rate
	    		var xloc_formula  = "case when {type}='Currency Revaluation' then 0 else "+
	    							"case when {account.type}='Bank' and {currency}<>{account.custrecord_bl001_bank_currency} then " +
	    							xfunc_formula +  
									" else " +
									"case when  abs(cast(NVL({fxamount},0) as number))+abs(NVL({netamountnotax},0))=0 and (NVL({debitamount},0)-NVL({creditamount},0))<>0 then (NVL({debitamount},0)-NVL({creditamount},0)) else case when abs(cast(NVL({fxamount},0) as number))>0 then abs(round(cast({fxamount} as number),2)) else round(abs(NVL({netamountnotax},0))/(case when {subsidiary.currency}={currency} then 1 else NVL({exchangerate},1) end),2) end * case when NVL({debitamount},0)<NVL({creditamount},0) then -1 else 1 end end" + 
									" end end";
	    		local_col.setFormula( xloc_formula );
    			func_col.setFormula( xfunc_formula );
	    	}else{
	    		local_col.setFormula("NVL({debitamount},0)-NVL({creditamount},0)");
	    		func_col.setFormula("NVL({debitamount},0)-NVL({creditamount},0)");
	    	}
	    	rep_col.setFormula("NVL({debitamount},0)-NVL({creditamount},0)");
	    	cols[CONST_COL_LOCAL] = local_col;
	    	cols[CONST_COL_FUNC] = func_col;
	    	cols[CONST_COL_REPORT] = rep_col;
		}
		
		var sort_col = cols[CONST_COL_SORT];
		sort_col.setFormula(sort_cols.join("||'|'||"));
		cols[CONST_COL_SORT] = sort_col;
		
		
		// find the account column... 
	    var account_col = 0;
	    // figure out what column the account is in
	    var c_len = cols.length;
	    for (var ci=0; ci<c_len; ci++){
	    	var col = cols[ci];
	    	if (col){
	    		if (col.getName() == 'account'){
	    			account_col = ci;
	    			break;
	    		}
	    	}
	    }
	   
	   // remove the columns from currency to end
	   cols = bl001_copy_cols(cols, account_col-1);
	   // set these columns
		  saved_search.setColumns(cols);	
	    
	   // add columns
		   // the following columns should be Currency, Account, Department, Location, Class
		   if ( sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH_OW && bMultiCurr ){
				var new_col = new nlobjSearchColumn('formulatext', null, 'group');
				new_col.setFormula("NVL({account.custrecord_bl001_bank_currency},NVL({currency},'"+base_currency+"'))");
				new_col.setLabel('Currency');
				saved_search.addColumn(new_col);
		   }else if ( sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH && bMultiCurr ){
				var new_col = new nlobjSearchColumn('formulatext', null, 'group');
				new_col.setFormula("NVL({account.custrecord_bl001_bank_currency},NVL({currency},'"+base_currency+"'))");
				new_col.setLabel('Currency');
				saved_search.addColumn(new_col);
		   }else{
			  	saved_search.addColumn( bl001_add_column(bMultiCurr, 'Currency', 'currency', "'" + " " + "'") );
		   }
		   saved_search.addColumn( bl001_add_column(true, 'Account', 'account'));
		   saved_search.addColumn( bl001_add_column(bDept, 'Department', 'department', "' '"));
		   saved_search.addColumn( bl001_add_column(bLoc, 'Location', 'location', "' '"));
		   saved_search.addColumn( bl001_add_column(bClass, 'Class', 'class', "' '"));
		
	   if ( sDefaultSearch == CONST_ACCOUNT_SAVEDSEARCH_OW ){
			// add the subsidiary column to the end
		   saved_search.addColumn( bl001_add_column(true, 'Subsidiary', 'subsidiary', "1"));
	   }
	
		saved_search.saveSearch();
	}		
}

// in inital connector setup, fix the reports; this adds a column if the feature isn't enabled
function bl001_add_column(bFeature, column_label, column_field, default_val)
{
	var ret_val = null;
	// if the feature is not on, insert a formula dummy column
	if (!bFeature){
		ret_val = new nlobjSearchColumn('formulatext', null, 'group');
		ret_val.setFormula(default_val);
		ret_val.setLabel(column_label);
	}else{
		// needs to be the field. The feature may have been turned back on...
		ret_val = new nlobjSearchColumn(column_field, null, 'group');
		ret_val.setLabel(column_label);                		
	}
	return ret_val;
}
// the column may be here if the feature was on when the bundle was installed
// but not working if the feature was turned on after bundle installation
// we either need to insert a phantom column or fix the one that is there
function bl001_fix_column(cols, bFeature, this_col, column_label, column_field, default_val)
{
	// the following columns should be Department, Location, Class
	// unless the feature doesn't exist; insert a dummy column if necessary
	var test_col = cols[this_col];
	if (!bFeature){
		if (test_col){
			if (test_col.getLabel() != column_label){
				// if this isn't the department column, shift the columns down to make room for the new department column
				cols = bl001_shift_cols(cols, this_col);                		
			}
		}
		cols[this_col] = new nlobjSearchColumn('formulatext', null, 'group');
		cols[this_col].setFormula(default_val);
		cols[this_col].setLabel(column_label);
	}else{
		// is the department a formula but needs to be the field? The feature was turned back on...
		var this_formula = "-1";
		if (test_col){
			this_formula = test_col.getFormula();
			if (!this_formula)this_formula='';
		}
		if (this_formula.length > 0){
	    	cols[this_col] = new nlobjSearchColumn(column_field, null, 'group');
	    	cols[this_col].setLabel(column_label);                		
		}
	}
}
// insert a new column; shift the existing columns down
function bl001_copy_cols(col_array, max_len)
{
	var new_cols = new Array();
	if (!col_array)return col_array;
	if (col_array.length==0)return new_cols;
	clen = col_array.length;
	if (clen>max_len)clen=max_len;
	for (var i=0;i<clen;i++){
		new_cols[i] = col_array[i];
	}
	return new_cols;
}
// add fields to suitelet form
function bl001_addfield(form, title, field_id, field_group, field_type, display_type, help_text, default_value, field_select)
{	
	var fld = form.addField(field_id, field_type, title, field_select, field_group); 
	with(fld)
	{
		if (default_value){
			setDefaultValue(default_value);
		}
		if (display_type){
			setDisplayType(display_type);
		}
	}
	if (help_text){
		if (!(bl_noempty(display_type,'')=='hidden')){
	        with(form.addField(field_id + '_help', 'textarea', '', null, field_group)){
	        	setDisplayType('inline');
	        	setDefaultValue(help_text);
	        }		
		}
	}
	return fld;
}
//------------------------------------------------------------------
//Function:         BL001_Connector_Config_BeforeLoad
//Record:			customrecord_bl001_nsconnector_status           
//Subtab:
//Script Type:      User Event - Before Load
//Script ID:
//Deployment ID:
//Description:		In the beforeload, add the buttons across the top of the form.
//					Also, if "start" parameter is included, it means we pressed one of the buttons
//					This means we need to start the scheduled script for the applicable export file.
//					Once it is started, redirect back to this page
//Task:
//Date:             SG 20121108
//------------------------------------------------------------------
function BL001_Connector_Config_BeforeLoad(type, form, request)
{
	nlapiLogExecution('AUDIT', 'BL001_Connector_Config_BeforeLoad Starting', type);
	
	
	
	if (!g_connector_settings.initial_setup){
		nlapiSetRedirectURL('SUITELET', CONST_BLACKLINE_SETUP_SUITELET, '1');
		return;
	}
	
	
	/*
	var fld = form.getField('custrecord_bl001_account_datasource');
	if (fld){
		fld.setDisplayType('hidden');
	}
	*/
	
	
    var context = nlapiGetContext();
    var client_scripts = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_config_client_scripts'), 'customscript_bl001_config_client_scripts');
	form.setScript(client_scripts);
	
	// if multi-currency is not enabled, hide the fields
	if (!g_company_settings.feature_multi_curr){
		var fld = form.getField('custrecord_bl001_reporting_sub');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_currencytrans_adj');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_account_curr_opt');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_mc_asset_list_filter');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_mc_liab_list_filter');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_multicurr_filename');
		if (fld){
			fld.setDisplayType('hidden');
		}
		
		var fld = form.getField('custrecord_bl001_multicurr_export_status');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_multicurr_download');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_account_datasource');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl001_run_multicurrency');
		if (fld){
			fld.setDisplayType('hidden');
		}
		
		
	}
	
	// if location is not enabled, hide the location filter
	if (!g_company_settings.feature_location){
		var fld = form.getField('custrecord_bl001_account_loc_filter');
		if (fld){
			fld.setDisplayType('hidden');
		}
		var fld = form.getField('custrecord_bl008_inc_excl_loc');
		if (fld){
			fld.setDisplayType('hidden');
		}
	}
	// if not OneWorld, hide the Sub filter
	if (!g_connector_settings.bOneWorld){
		var fld = form.getField('custrecord_bl001_account_sub_filter');
		if (fld){
			fld.setDisplayType('hidden');
		}
	}
	
	// add buttons
	if (type=='edit'){
		//if (g_bAdmin){
			form.addButton("custpage_btn_refresh", "Reset Status Messages", "BL001_Reset()");
		//}
	}
	
	if (type=='view' || type=='edit' || type=='create' || type=='copy'){
		// check which filter needs to be hidden
		// during create/edit/copy, always hide the old one
		var old_filt = form.getField('custrecord_bl001_account_incl_or_excl');
		var new_filt  = form.getField('custrecord_bl001_account_filter_options');
		if (type=='edit' || type=='create'){
			if (old_filt){
				old_filt.setDisplayType('hidden');
			}
		}else{
			// in view mode, show the new one if the value is > 0 or the old value is 0
			var val_old_filt = bl_noempty(nlapiGetFieldValue('custrecord_bl001_account_incl_or_excl'),0);
			var val_new_filt = bl_noempty(nlapiGetFieldValue('custrecord_bl001_account_filter_options'),0);
			nlapiLogExecution('DEBUG', 'old_filt:'+val_old_filt, 'new_filt:'+val_new_filt);
			if (parseInt(val_new_filt)>0 || parseInt(val_old_filt)==0){
				if (old_filt){
					old_filt.setDisplayType('hidden');
				}
			}else{
				if (new_filt){
					new_filt.setDisplayType('hidden');
				}
			}
		}
	}
	
	// add debug buttons and options
	var filen = bl_noempty(nlapiGetFieldValue('custrecord_bl001_account_filename'),'');
	if (request){
		var default_nodelete = 'F';
		if ( filen.length>5){
			nlapiLogExecution('AUDIT', 'filen.substring(0,4)', filen.substring(0,4));
			if (filen.substring(0,4)=='DND_'){
				default_nodelete = 'T';
			}
		}
		var debug_qs = bl_noempty(request.getParameter('debug'),'');
		if (debug_qs.length>0){
			with(form.addFieldGroup('custpage_debug_group', 'Debug Options')){
				setSingleColumn(true);
			}
			with(form.addField("custpage_leave_temp_files", 'checkbox', "Do not delete temp files", null, 'custpage_debug_group')){
				setDefaultValue(default_nodelete);
				setHelpText('When selected, a temporary file is not deleted in the "temp" folder of the file cabinet. This can be used to debug the period computation of current period and prior period balances for each account. This is an intermediate file that is persisted after the web service is queried and before the trial balance is computed.', false);
			}
			var profile_id = nlapiGetRecordId();
			var xml_url = nlapiResolveURL('SUITELET', CONST_BLACKLINE_SETUP_SUITELET, '1') + '&custparam_profileid=' + profile_id;
			with(form.addField("custpage_account_link", "url", "Test Web Service", null, 'custpage_debug_group')){
				setDisplayType('inline');
				setLinkText('Show Account XML');
				setDefaultValue(xml_url+ '&custparam_debugxml=account' );
				setHelpText('Click the Show XML links to show the web service Request and Response to the api calls that are made inside the Connector. The Account XML runs the getPostingTransactionSummary() web service method; the Exchange Rate XML runs the getConsolidatedExchangeRate() web service method (applies to NetSuite OneWorld accounts only).', false);
			}
			if (g_connector_settings.bOneWorld){
				with(form.addField("custpage_exch_link", "url", "", null, 'custpage_debug_group')){
					setDisplayType('inline');
					setLinkText('Show Exchange Rate XML');
					setDefaultValue(xml_url+'&custparam_debugxml=exchange');
				}
			}
			/*
			var file_key = bl_noempty(nlapiGetFieldValue('custrecord_bl001_profile_file_api_key'),'');
			var ss = bl_noempty(nlapiGetFieldValue('custrecord_bl001_saved_search_id'),'');
			if (file_key.length>0 && ss.length>0)
			with(form.addField("custpage_savedsearch_export", "url", "Test Saved Search Export", null, 'custpage_debug_group')){
				setDisplayType('inline');
				setLinkText('Show Export');
				setDefaultValue(nlapiResolveURL('SUITELET', CONST_FILEPICKUP_SUITELET, '1') + '&type=SS&key=' + file_key);
				setHelpText('Click the Show Export link to show the saved search export.', false);
			}
			*/
	}
	}

	
	
	
	
	if (type != 'view')return;	
	
	var id = nlapiGetRecordId();

	var reset_api_key = bl_noempty(request.getParameter('newkey'),'');
	//nlapiLogExecution('DEBUG', 'reset_api_key', reset_api_key);
	if (reset_api_key == 'T'){
		var new_guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
		nlapiLogExecution('DEBUG', 'new_guid', new_guid);
		var this_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', id);
		this_record.setFieldValue('custrecord_bl001_profile_file_api_key', new_guid);
		nlapiSubmitRecord(this_record);
		nlapiSetRedirectURL('RECORD', 'customrecord_bl001_nsconnector_status', id);
	}
	form.addButton("custpage_btn_new_api_key", "Generate New API Key", "BL001_New_API_Key()");
	
	// look for parameter &start=[export_type]
	// This will queue the applicable scheduled script
	// and redirect back to this page without the start parameter
	var export_type = request.getParameter('start');
	if (export_type){
		bl001_Start_Export(export_type, id);	
	}
	
	// current status
	var entitystatus  = bl_noempty(nlapiGetFieldValue('custrecord_bl001_entity_export_status'),  '');
	var accountstatus = bl_noempty(nlapiGetFieldValue('custrecord_bl001_account_export_status'), '');
	var multicurrstatus= bl_noempty(nlapiGetFieldValue('custrecord_bl001_multicurr_export_status'), '');
	//var bankrecstatus = bl_noempty(nlapiGetFieldValue('custrecord_bl001_bankrec_export_status'), '');
	
	// if the status is empty, prompt to start the export
	var entity_button = "Start Entity Export";
	var bEntity_disable = false;
	var account_button = "Start Account Export";
	var bAccount_disable = false;
	var multicurr_button = "Start Multi-Currency Export";
	var bMulticurr_disable = false;
	//var bankrec_button = "Start BankRec Export";
	//var bBankRec_disable = false;
	// if the status is queued or processing, disable the buttons
	if (entitystatus != ''){
		entity_button = "Rerun Entity Export";
		if (entitystatus == 'Queued' || entitystatus == 'Processing'){
			bEntity_disable = true;
		}
	}
	if (accountstatus != ''){
		account_button = "Rerun Account Export";		
		if (accountstatus == 'Queued' || accountstatus == 'Processing' || accountstatus.indexOf(CONST_ACCOUNT_REPROCESS_STATUS)>=0 || accountstatus.indexOf(CONST_ACCOUNT_COMPUTE_STATUS)>=0){
			bAccount_disable = true;
		}
	}
	if (multicurrstatus != ''){
		multicurr_button = "Rerun Multi-Currency Export";		
		if (multicurrstatus == 'Queued' || multicurrstatus == 'Processing' || multicurrstatus.indexOf(CONST_ACCOUNT_REPROCESS_STATUS)>=0 || multicurrstatus.indexOf(CONST_ACCOUNT_COMPUTE_STATUS)>=0){
			bMulticurr_disable = true;
		}
	}
	//if (bankrecstatus != ''){
	//	bankrec_button = "Rerun BankRec Export";
	//	if (bankrecstatus == 'Queued' || bankrecstatus == 'Processing'){
	//		bBankRec_disable = true;
	//	}
	//}
	
	// add buttons
	form.addButton("custpage_btn_refresh", "Refresh", "BL001_Refresh()");
	
	// add buttons to start scheduled scripts
	//if (g_Devmode){
	//	form.addButton("custpage_btn_start_compute", "Recompute Balances Now", "BL001_StartExport('" + CONST_COMPUTE + "'," + id + ")");
	//}
	var oBtnStartEntityExport = form.addButton("custpage_btn_start_entity", entity_button, "BL001_StartExport('" + CONST_ENTITY + "'," + id + ")");
	if (bEntity_disable){
		oBtnStartEntityExport.setDisabled(true);
	}			
	//var oBtnStartAccountExport= form.addButton("custpage_btn_start_account", account_button, "BL001_StartExport('" + CONST_COMP_ACCOUNT + "'," + id + ")");
	var oBtnStartAccountExport= form.addButton("custpage_btn_start_account", account_button, "BL001_StartExport('" + CONST_ACCOUNT + "'," + id + ")");
	if (bAccount_disable){
		oBtnStartAccountExport.setDisabled(true);
	}

	if (g_company_settings.feature_multi_curr){
		var oBtnStartMulticurrExport= form.addButton("custpage_btn_start_multicurr", multicurr_button, "BL001_StartExport('" + CONST_MULTICURR + "'," + id + ")");
		if (bMulticurr_disable){
			oBtnStartMulticurrExport.setDisabled(true);
		}
	}
	
	var file_key = bl_noempty(nlapiGetFieldValue('custrecord_bl001_profile_file_api_key'),'');
	var ss = bl_noempty(nlapiGetFieldValue('custrecord_bl001_saved_search_id'),'');
	if (file_key.length>0 && ss.length>0){
		var new_fld = form.addField("custpage_savedsearch_export", "url", "View Saved Search Export", null, null);
		new_fld.setDisplayType('inline');
		new_fld.setLinkText('Show Export');
		new_fld.setDefaultValue(nlapiResolveURL('SUITELET', CONST_FILEPICKUP_SUITELET, '1') + '&type=SS&key=' + file_key);
		new_fld.setHelpText('Click the Show Export link to show the saved search export.', false);
		form.insertField(new_fld, 'custrecord_bl001_saved_search_id');
	}
	
	//var oBtnStartBankRecExport = form.addButton("custpage_btn_start_bankrec", bankrec_button, "BL001_StartExport('" + CONST_BANKREC + "'," + id + ")");
	//if (bBankRec_disable){
	//	oBtnStartBankRecExport.setDisabled(true);
	//}
	//var oBtnStartAllExport= form.addButton("custpage_btn_start_all", "Run All Exports", "BL001_StartExport('" + CONST_ALL + "'," + id + ")");
	//if (bAccount_disable || bEntity_disable || bBankRec_disable){
	//if (bAccount_disable || bEntity_disable){
	//	oBtnStartAllExport.setDisabled(true);
	//}
	
	
}
// this function starts the scheduled script and redirects back to the profile page
function bl001_Start_Export(export_type, id, skip_redirect, temp_file_id)
{
	nlapiLogExecution('AUDIT', 'bl001_Start_Export Starting', export_type+'|'+id + '|' + skip_redirect);
	
	if (export_type == CONST_ALL){
		bl001_Start_Export(CONST_ENTITY, id, true);
		bl001_Start_Export(CONST_ACCOUNT, id, true);
		bl001_Start_Export(CONST_MULTICURR, id);
		//bl001_Start_Export(CONST_BANKREC, id);
		return;
	}
	// begin the schedule 
	if (export_type == CONST_STARTSCHED){
	    var status = bl_noempty(nlapiScheduleScript('customscript_bl001_blackline_scheduler', null, null), 'Unable to requeue');
	    nlapiLogExecution('AUDIT', 'bl001_Start_Export Start Scheduled', status);
	    if (!skip_redirect)nlapiSetRedirectURL('RECORD', 'customrecord_bl001_nsconnector_status', id);
	    return;
	}
	
	// begin delete balance script which automatically recomputes balances
	if (export_type == CONST_DEL_COMPUTE){
		nlapiScheduleScript(CONST_DELETE_SCRIPTID);
		if (!skip_redirect){
			nlapiSetRedirectURL('TASKLINK','LIST_SCRIPTSTATUS');
			return;
		}
		return;
	}

    var scriptid = "";
    var params = new Array();

	if (export_type == CONST_COMPUTE){
		// force a refresh of balances
		params['custscript_bl001_refresh_balances'] = 'T';
		var status = nlapiScheduleScript(CONST_RECOMPUTE_SCRIPTID, null, params);
		nlapiLogExecution('AUDIT', 'Running scheduled task to recompute', status);
		if (!skip_redirect){
			nlapiSetRedirectURL('TASKLINK','LIST_SCRIPTSTATUS');
			return;
		}
		return;
	}
	id = bl_noempty(id,'');
	if (export_type == CONST_COMP_ACCOUNT && id.length==0){
		nlapiLogExecution('ERROR','CONST_COMP_ACCOUNT should not be called with empty profile id',CONST_COMP_ACCOUNT); 
		return;
	}

	// load the configuration settings
	nlapiLogExecution('DEBUG', 'load profile', id);
	var loadobj = nlapiLoadRecord('customrecord_bl001_nsconnector_status', id);

	// begin balance computation and set parameter to then run account export
	if (export_type == CONST_COMP_ACCOUNT){
		
		params['custscript_bl001_profile_to_run'] = id;
	    var status = bl_noempty(nlapiScheduleScript(CONST_RECOMPUTE_SCRIPTID, null, params), 'Unable to requeue');
	    if (status == 'QUEUED')
	    	{
	    	status = 'Queued';
	    	}
	    nlapiLogExecution('AUDIT', 'Queue scheduled task ' + export_type, status + '|' + id);
	    
	    // redirect back to record page
		if (!skip_redirect){
		    // update the status    
			loadobj.setFieldValue("custrecord_bl001_account_export_status", status);
			loadobj.setFieldValue('custrecord_bl001_account_download', '');	// clear out the link to the file
			nlapiSubmitRecord(loadobj, false, true);
			//
			nlapiSetRedirectURL('RECORD', 'customrecord_bl001_nsconnector_status', id);

		}
		return;
	}
	
	// general
	var folder_name = loadobj.getFieldValue('custrecord_bl001_folder_name');
	g_Email = loadobj.getFieldValue('custrecord_bl001_account_emailto');
	g_Email_error_only = loadobj.getFieldValue('custrecord_bl001_error_alerts_only');
	// entity
	var sub_level = loadobj.getFieldValue('custrecord_bl001_level_names');
	var entitytype_file = loadobj.getFieldValue('custrecord_bl001_entitytype_filename');
	var entity_file = loadobj.getFieldValue('custrecord_bl001_entity_filename');
	// account
	var report_sub = loadobj.getFieldValue('custrecord_bl001_reporting_sub');
	var cta_account = loadobj.getFieldValue('custrecord_bl001_currencytrans_adj');
	var re_account = loadobj.getFieldValue('custrecord_bl001_retained_earnings');
	var account_reportingperiod = loadobj.getFieldValue('custrecord_bl001_account_reportingperiod');
	var start_date = loadobj.getFieldValue('custrecord_bl001_period_start_date');
	var end_date = loadobj.getFieldValue('custrecord_bl001_period_end_date');
	var account_file = loadobj.getFieldValue('custrecord_bl001_account_filename');
	var account_list_filter  = loadobj.getFieldValues('custrecord_bl001_account_list_filter');
	var account_incl_or_excl = loadobj.getFieldValue('custrecord_bl001_account_incl_or_excl');
	var account_filter_options = loadobj.getFieldValue('custrecord_bl001_account_filter_options');
	var key_1 = loadobj.getFieldValue('custrecord_bl001_account_key_1');
	var key_3 = loadobj.getFieldValue('custrecord_bl001_account_key_3');
	var key_4 = loadobj.getFieldValue('custrecord_bl001_account_key_4');
	var key_5 = loadobj.getFieldValue('custrecord_bl001_account_key_5');
	//var no_currency = loadobj.getFieldValue('custrecord_bl001_account_no_currency');
	var curr_option = loadobj.getFieldValue('custrecord_bl001_account_curr_opt');
	var data_source = loadobj.getFieldValue('custrecord_bl001_account_datasource');
	var sub_filter = loadobj.getFieldValues('custrecord_bl001_account_sub_filter');
	var loc_filter = loadobj.getFieldValues('custrecord_bl001_account_loc_filter');
	var loc_filter_incl_or_excl = loadobj.getFieldValue('custrecord_bl008_inc_excl_loc');
	
	// multicurr
	var custrecord_bl001_mc_asset_list_filter = bl_noempty(loadobj.getFieldValues('custrecord_bl001_mc_asset_list_filter'),[]);
	var custrecord_bl001_mc_liab_list_filter = bl_noempty(loadobj.getFieldValues('custrecord_bl001_mc_liab_list_filter'),[]);
	var custrecord_bl001_multicurr_filename = loadobj.getFieldValue('custrecord_bl001_multicurr_filename');
	
	// if we are running multicurrency extract, switch the values
	// so we run the Account Extract with M-C options
	nlapiLogExecution('DEBUG', 'bl001_Start_Export export_type |CONST_MULTICURR|CONST_ACCOUNT_MULTI_CURR', export_type+'|'+CONST_MULTICURR+'|'+CONST_ACCOUNT_MULTI_CURR);
	if (export_type == CONST_MULTICURR ){
		account_incl_or_excl = CONST_FILTER_INCLUDE;
		account_file = custrecord_bl001_multicurr_filename; 
		var sHoldAccounts = '';
		// combine the asset + liability account lists
		if (custrecord_bl001_mc_asset_list_filter.length>0){
			sHoldAccounts = sHoldAccounts + custrecord_bl001_mc_asset_list_filter.join(',');
		}
		if(custrecord_bl001_mc_liab_list_filter.length>0){
			if (sHoldAccounts.length>0){
				sHoldAccounts = sHoldAccounts + ',';
			}
			sHoldAccounts = sHoldAccounts + custrecord_bl001_mc_liab_list_filter.join(','); 
		}
		account_list_filter = sHoldAccounts.split(',');
		curr_option = CONST_ACCOUNT_MULTI_CURR;
	}else{
		curr_option = CONST_ACCOUNT_OMIT_CURR;
	}
	
	
	
	// bankrec
	//var bankrec_accounts = loadobj.getFieldValues('custrecord_bl001_bankrec_accounts');
	//var bankrec_unmatched = loadobj.getFieldValue('custrecord_bl001_bankrec_unmatched');
	//var bankrec_ignore_date = loadobj.getFieldValue('custrecord_bl001_bankrec_ignore_date');
	//var bankrec_file = loadobj.getFieldValue('custrecord_bl001_bankrec_filename');
	
    var status_field = "";
    var deploy_id = null;
    
    switch(export_type) {
    case CONST_ENTITY:
    	scriptid = CONST_ENTITY_SCRIPTID;
    	status_field = "custrecord_bl001_entity_export_status";// the status field to update below
    	loadobj.setFieldValue('custrecord_bl001_entitytype_download', '');	// clear out the link to the file
    	loadobj.setFieldValue('custrecord_bl001_entity_download', '');	// clear out the link to the file
	    params['custscript_bl001_level_names'] = sub_level;       
	    params['custscript_bl001_entity_key_type'] = key_1;					// the type of entity file to export (sub, dept,class,loc)
	    params['custscript_bl001_entitytype_filename'] = entitytype_file;
	    params['custscript_bl001_entity_filename'] = entity_file;
	    params['custscript_bl001_entity_folder_name'] = folder_name;
	    params['custscript_bl001_entity_configurationid'] = id;
	    params['custscript_bl001_entity_emailto'] = g_Email;
	    params['custscript_bl001_entity_email_error_only'] = g_Email_error_only;
	    break;
    case CONST_ACCOUNT: case CONST_MULTICURR:
    	scriptid = CONST_ACCOUNT_SCRIPTID;
    	if (export_type == CONST_MULTICURR){
    		status_field = "custrecord_bl001_multicurr_export_status";// the status field to update below
        	loadobj.setFieldValue('custrecord_bl001_multicurr_download', '');	// clear out the link to the file
        	deploy_id = 'customdeploy_bl001_create_account_exprt2';
    	}else{
    		status_field = "custrecord_bl001_account_export_status";// the status field to update below	
        	loadobj.setFieldValue('custrecord_bl001_account_download', '');	// clear out the link to the file
        	deploy_id = 'customdeploy_bl001_create_account_export';
    	}
		params['custscript_bl001_account_filename'] = account_file;
		params['custscript_bl001_account_folder_name'] = folder_name;
		params['custscript_bl001_account_configurationid'] = id;
		params['custscript_bl001_account_emailto'] = g_Email;
	    params['custscript_bl001_account_email_error_onl'] = g_Email_error_only;
	    if (account_list_filter){
	    	if (account_list_filter.length>0){
	    		params['custscript_bl001_account_list_filter'] = account_list_filter.join(',');
	    		nlapiLogExecution('DEBUG', 'account_list_filter', account_list_filter.join(','));
	    	}
	    }
	    account_filter_options	= bl_noempty(account_filter_options, 0);
	    account_incl_or_excl	= bl_noempty(account_incl_or_excl, 0);
	    if (parseInt(account_filter_options)>0){
	    	params['custscript_bl001_account_incl_or_excl'] = account_filter_options;	    	
	    }else{
	    	params['custscript_bl001_account_incl_or_excl'] = account_incl_or_excl;	
	    }
	    var sub_filter_txt = '';
	    if (sub_filter){
	    	if (sub_filter.constructor === Array){
			    if (sub_filter.length > 1){
			    	sub_filter_txt = sub_filter.join(',');
			    }else if (sub_filter.length == 1){
			    	sub_filter_txt = sub_filter[0];
			    }else{
			    	sub_filter_txt = '';
			    }
		    }else{
		    	if (sub_filter.length>0){
		    		sub_filter_txt = sub_filter;
		    	}else{
		    		sub_filter_txt = '';
		    	}
	    	}
	    }else{
	    	sub_filter_txt = '';
	    }
	    params['custscript_bl001_account_sub_filter'] = sub_filter_txt;
	    var loc_filter_txt = '';
	    if (loc_filter){
	    	if (loc_filter.constructor === Array){
			    if (loc_filter.length > 1){
			    	loc_filter_txt = loc_filter.join(',');
			    }else if (loc_filter.length == 1){
			    	loc_filter_txt = loc_filter[0];
			    }else{
			    	loc_filter_txt = '';
			    }
		    }else{
		    	if (loc_filter.length>0){
		    		loc_filter_txt = loc_filter;
		    	}else{
		    		loc_filter_txt = '';
		    	}
	    	}
	    }else{
	    	loc_filter_txt = '';
	    }
	    params['custscript_bl001_account_loc_filter'] = loc_filter_txt;
	    params['custscript_bl001_account_loc_incexcl'] = loc_filter_incl_or_excl;
	    var period = bl001_period(account_reportingperiod, start_date, end_date);
    	nlapiLogExecution('DEBUG', 'start_date|end_date', start_date + '|' + end_date);
		params['custscript_bl001_period_start_date'] = period.start;
		params['custscript_bl001_period_end_date'] = period.end;
		params['custscript_bl001_retained_earnings'] = re_account;
		params['custscript_bl001_currencytrans_adj'] = cta_account;
		params['custscript_bl001_reporting_sub'] = report_sub;
	    params['custscript_bl001_account_key_1'] = key_1;
	    params['custscript_bl001_account_key_3'] = key_3;
	    params['custscript_bl001_account_key_4'] = key_4;
	    params['custscript_bl001_account_key_5'] = key_5;
	    params['custscript_bl001_account_no_currency'] = curr_option;
	    data_source = bl_noempty(data_source,'');
	    if (temp_file_id){
	    	data_source = data_source + '|' + temp_file_id; 
	    }
	    if (data_source.length>0){
	    	params['custscript_bl001_account_datasource'] = data_source;
	    }
	    nlapiLogExecution('DEBUG', 'params curr_option:'+curr_option,  export_type+'|'+params['custscript_bl001_account_no_currency']);
		break;
    //case CONST_BANKREC:
    //	scriptid = CONST_BANKREC_SCRIPTID;
    //	status_field = "custrecord_bl001_bankrec_export_status";		// the status field to update below
    //	loadobj.setFieldValue('custrecord_bl001_bankrec_download', '');	// clear out the link to the file
	//	params['custscript_bl001_bankrec_filename'] = bankrec_file;
	//	params['custscript_bl001_bankrec_folder_name'] = folder_name;
	//	params['custscript_bl001_bankrec_configurationid'] = id;
	//	params['custscript_bl001_bankrec_emailto'] = g_Email;
	//	params['custscript_bl001_bankrec_error_alerts_on'] = g_Email_error_only;
	//	params['custscript_bl001_bankrec_accounts'] = bankrec_accounts.join(',');
	//	params['custscript_bl001_bankrec_ignore_date'] = bankrec_ignore_date;
	//	params['custscript_bl001_bankrec_unmatched'] = bankrec_unmatched;
	//	
    //	break;
    default:
      return;
    }    
    
	// make sure we don't try to schedule if it is already in queue
    if (!temp_file_id){
	    if (export_type==CONST_ACCOUNT || export_type==CONST_MULTICURR){ 
			var prev_status = loadobj.getFieldValue(status_field);
			if (prev_status=='Queued' || prev_status=='Processing'){
				if (!skip_redirect){
					nlapiSetRedirectURL('RECORD', 'customrecord_bl001_nsconnector_status', id);
				}else{
					return;
				}
			}
    }
    }
    
    //queue
    var status = null;
    if (temp_file_id){
    	var context = nlapiGetContext();
    	status = bl_noempty(nlapiScheduleScript(scriptid, context.getDeploymentId(), params), 'Unable to requeue');	
    }else{
    	status = bl_noempty(nlapiScheduleScript(scriptid, deploy_id, params), 'Unable to requeue');
    	if (status == 'INQUEUE' || status == 'INPROGRESS'){
    		if ( deploy_id.indexOf('customdeploy_bl001_create_account')>=0){
    			for (var i_retry=3; i_retry<=5; i_retry++){
        			deploy_id = 'customdeploy_bl001_create_account_exprt'.concat(i_retry.toString());
        			nlapiLogExecution('AUDIT', 'deploy_id', deploy_id);
        			status = bl_noempty(nlapiScheduleScript(scriptid, deploy_id, params), 'Unable to requeue');
        			if (status != 'INQUEUE' && status != 'INPROGRESS'){
        				break;
        			}
    			}
    		}
    	}
    }
    if (status == 'QUEUED')
    	{
    	status = 'Queued';
    	}
    nlapiLogExecution('AUDIT', 'Queue scheduled task ' + export_type, status + '|' + scriptid + '|' + deploy_id);
    
    // update the status    
	loadobj.setFieldValue(status_field, status);
	nlapiSubmitRecord(loadobj, false, true);
    
    // redirect back to record page
	if (!skip_redirect) nlapiSetRedirectURL('RECORD', 'customrecord_bl001_nsconnector_status', id);
}
function bl001_period(account_reportingperiod, start_date, end_date)
{
	var period = null;
    switch(account_reportingperiod){
    case "2": // Current Month
    	period = bl001_month(0);
    	break;
    case "3": // Current Year
    	period = bl001_year(0);
    	break;
    case "4": // Current Quarter
    	period = bl001_quarter(0);
    	break;
    case "5": // Previous Month
    	period = bl001_month(-1);
    	break;
    case "6": // Previous Quarter
    	period = bl001_quarter(-1);
    	break;
    case "9": // Previous Year
    	period = bl001_year(-1);
    	break;
    case "7": // Next Month
    	period = bl001_month(1);
    	break;
    case "8": // Next Quarter
    	period = bl001_quarter(1);
    	break;
    case "10": // Current Period (YTD)
    	period = bl001_month(0);
    	var yr = bl001_year(0);
    	period.start = yr.start;
    	break;
    case "11": // Previous Period (YTD)
    	period = bl001_month(-1);
    	var yr = bl001_year(0);
    	period.start = yr.start;
    	break;
    default:
    	period = {};
		period.start = start_date;
		period.end = end_date;
    	break;
    }
    return period;
}
function bl001_year(skip_year)
{
	var period = {start:"",end:""};
	var get_year = bl001_get_period(skip_year, false, true);
	if (get_year){
		period.start = get_year.startdate;
		period.end = get_year.enddate;
	}else{
	    var d = new Date();
	    if (skip_year){
	    	d.setFullYear(d.getFullYear()+skip_year);
	    }
	    var y = d.getFullYear();
	    
	    period.start = nlapiDateToString(FirstDayOfMonth(y,1));
	    period.end   = nlapiDateToString(LastDayOfMonth(y,12));
	    //period.start = '1/1/' + y;
	    //period.end = '12/31/' + y;
	}
	return period;
}
function LastDayOfMonth(Year, Month) {
	   return new Date( (new Date(Year, Month,1))-1 );
}
function FirstDayOfMonth(Year, Month) {
	   return new Date( (new Date(Year, Month+1,1)) );
}
function bl001_month(skip_month)
{
	var period = {start:"",end:""};
	
	var get_period = bl001_get_period(skip_month, false, false);
	if (get_period){
		period.start = get_period.startdate;
		period.end = get_period.enddate;
	}else{
		if (!skip_month){
			skip_month=1;
		} else {
			skip_month += 1;
		}
	    var d = new Date();
	    var m = d.getMonth();
	    var y = d.getFullYear();
	    period.start = FirstDayOfMonth(y, (m+skip_month));
		//period.start = (m+skip_month) + '/1/' + y;
		d.setMonth(m+skip_month);
		d.setDate(0);
		//var nm =d.getDate();
		period.end = LastDayOfMonth(y, (m+skip_month));
		//period.end = (m+skip_month) + '/' + nm + '/' + y;
	}
	return period;
}
function bl001_quarter(skip_quarter)
{
	var get_quarter = bl001_get_period(skip_quarter, true, false);
	if (get_quarter){
		var period = {start:"",end:""};
		period.start = get_quarter.startdate;
		period.end = get_quarter.enddate;
		return period;
	}else{
		var d = new Date();
		if (skip_quarter)
			{
			dd = d.getDate();
			if (dd==31)
				{
				d.setDate(-1);
				}
			d.setMonth(d.getMonth()+(skip_quarter*3));
			}
		var m = d.getMonth()+1;
		var y = d.getFullYear();
		var q = 0;
		if (m>=1 && m<=3){q=1;}
		else if (m>=4 && m<=6){q=2;}
		else if (m>=7 && m<=9){q=3;}
		else if (m>=10 && m<=12){q=4;}
		var period = {start:"",end:""};
		switch(q)
		{
		case 1:
			period.start = "1/1/" + y;
			period.end = "3/31/" + y;
			break;
		case 2:
			period.start = "4/1/" + y;
			period.end = "6/30/" + y;
			break;
		case 3:
			period.start = "7/1/" + y;
			period.end = "9/30/" + y;
			break;
		case 4:
			period.start = "10/1/" + y;
			period.end = "12/31/" + y;
			break;
		}
		
		return period;
	}
}
//------------------------------------------------------------------
//Function:         BL001_Export_Entity
//Record:			Subsidiary           
//Subtab:
//Script Type:      Scheduled script / run at month end
//Script ID:
//Deployment ID:
//Description:      Create two TXT files with contents of entity types and entities (subsidiaries)
//
//Script Params:	[custscript_bl001_level_names] 			the level names correspond to the levels of the subsidiary tree. it is optional
//					[custscript_bl001_entitytype_filename]	the filename of the entity type export file
//					[custscript_bl001_entity_filename]		the filename of the entity export file
//					[custscript_bl001_entity_folder_name]	the folder name
//					[custscript_bl001_entity_configurationid] id of custom record for the blackline export configuration
//
// Dependencies:	
//
//Task:
//Date:             SG 20121022
//------------------------------------------------------------------
function BL001_Export_Entity(type)
{
	// if no entity level names are defined on the script, use this label + the level # (e.g., Level 1, Level 2, Level 3)
    nlapiLogExecution('AUDIT', 'BL001_Export_Entity Starting', type);
    
    try
    {	
    	var level_default = 'Level';		

    	if (!g_connector_settings.initial_setup){
    		return;
    	}

	    var context = nlapiGetContext();
	    
	    // get script parameters
	    // the export configuration id to link back to; public vars for global error handling
	    g_Profile_ID = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_entity_configurationid'), '');
	    g_Email = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_entity_emailto'), '');
	    g_Email_error_only = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_entity_email_error_only'), '');
	    g_Status_Field = 'custrecord_bl001_entity_export_status';
	    
	    // the level names correspond to the levels of the subsidiary tree. it is optional
	    // it is either a comma delim list corresponding to each level; or, without the comma, it is the level_default label
	    var level_names = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_level_names'), '');
	    var entity_key_type = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_entity_key_type'), CONST_ENTITY_KEY_DEFAULT);
	    // load the file names for the two files
	    var entitytype_file = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_entitytype_filename'), 'blackline_entitytype_export.txt');
	    var entity_file = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_entity_filename'), 'blackline_entity_export.txt');
	    // the files will be put into this folder
	    var folder_name = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_entity_folder_name'), 'blackline_exports');
	    
	    //nlapiLogExecution('DEBUG', 'entity_key_type', entity_key_type);
	    //nlapiLogExecution('DEBUG', 'level_names|entitytype_file|entity_file|folder_name|g_Profile_ID', level_names + '|' + entitytype_file + '|' + entity_file + '|' + folder_name+ '|'+ g_Profile_ID + '|' + g_Email);
	    
	    // if we have a config_id, mark it as in process
		// update the config status fields
		if (bl_isNonZeroNumber(g_Profile_ID))
			{
				var upd_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', g_Profile_ID);
				upd_record.setFieldValue(g_Status_Field, 'Processing');
				nlapiSubmitRecord(upd_record, false, true);
			}
	      
		var sub_list = new bl001_subsidiarylist();
	    var sub_count = sub_list.load(entity_key_type);
	    // count the max # of : in the subsidiary levels to get the # of levels
	    var max_level = sub_list.maxlevel();    
	    //nlapiLogExecution('DEBUG', 'sub_count', sub_count);
	    //nlapiLogExecution('DEBUG', 'max_level', max_level);
	    
	    // look for the names and make sure the # of levels match subsidiary list
	    if (parseInt(sub_count) == 0)
	    	{
	    	bl001_logerror('Your Blackline Entity Export Failed', 'No entities defined');
	    	return;
	    	}
	    
	    // if this is from the config form scheduler, we put the config_id and time on the front
	    if (g_Profile_ID.length>0){
	    	var file_date = new Date();
	    	entitytype_file = g_Profile_ID + '_' + file_date.getHours() + ''+ file_date.getMinutes() + ''+ file_date.getDate() + ''+ (file_date.getMonth()+1) + '_' +entitytype_file;
	    	entity_file = g_Profile_ID + '_' + file_date.getHours() + ''+ file_date.getMinutes() + '_'+ file_date.getDate() + ''+ (file_date.getMonth()+1) + '_' +entity_file;
	    }
	    
		var bLevelNames = false;	// level names have been defined from script parameter	
		var level_array = null;		// the list of levels
		// are there any level names defined with the script
	    if (level_names.length>0)
		{
	    	if (level_names.indexOf(',')>0)
	    		{
	    			level_array = level_names.split(',');
	    			if (level_array.length == max_level)
	    				{
	    					bLevelNames = true;
	    				}        			
	    		}
	    	else
	    		{
	    			level_default = level_names;
	    		}
		}
	    // no names defined in script parameter or the count is mismatched
	    // create the list of level names based on the level_default string defined above; the value can also be passed via script parameter
		if (!bLevelNames)
		{
			level_array = new Array();
			for (var i=1;i<=max_level;i++)
				{
					level_array[i-1] = level_default + ' ' + i;
				}
		}
		//nlapiLogExecution('DEBUG', 'level_array', level_array.toString());
		
	    // create content of entity types
		var export_entity_types = "";
		var et_len = level_array.length;
		for (var i=0;i<et_len;i++)
			{
				var num = i+1;
				export_entity_types += num + '\t' + level_array[i] + '\n';
			}	
		var url1 = bl001_writefile(folder_name, entitytype_file, export_entity_types);
		
		bl001_log_export(g_Profile_ID, CONST_ENTITYTYPE, url1);
		
		var key_logic = new bl001_account_list();	// this has logic to build the key from the name + [id]
		
		// now create entity file; spin through collection
		var export_entity = "";
		for(var sub_key in sub_list.list)
		{
			var sub = sub_list.list[sub_key];
			var sub_id = sub.id;
			var sub_level = sub.level(max_level);
			var sub_name = sub.namenohierarchy;
			
			// this key is converted to name+[id]
			var sub_parent_id = sub_list.parent_sub_id(sub_id);
			
			// convert this into name +[id]
			sub_id = key_logic.make_key(sub_id, sub_name, 1);
			//nlapiLogExecution('DEBUG', 'sub_key|sub_parent', sub_id + '*' + sub_parent_id);
			
			export_entity += sub_id + '\t' + sub_name + '\t' + sub_level + '\t' + sub_parent_id + '\n';
		}
		
		var url2 = bl001_writefile(folder_name, entity_file, export_entity);
		
		bl001_log_export(g_Profile_ID, CONST_ENTITY, url2);
		
		if (g_Profile_ID.length > 0)
			{
				var url_to_send = bl001_ns_host() + nlapiResolveURL('RECORD', 'customrecord_bl001_nsconnector_status', g_Profile_ID);
				bl001_sendemail(false, 'Your Blackline Entity exports are complete', 'Link:' + url_to_send);
			}
		else
			{
				bl001_sendemail(false, 'Your Blackline Entity exports are complete', 'Link:' + url1 + '\r\n' + url2);
			}

	}
	catch (e){
		
		try{
	    	if (bl_isNonZeroNumber(g_Profile_ID))
			{
				var upd_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', g_Profile_ID);
				upd_record.setFieldValue('custrecord_bl001_entity_export_status', "Unexpected Error");
				nlapiSubmitRecord(upd_record, false, true);
			}
	
			bl001_logerror("Blackline Data Connect unexpected error", "Unable to process Entity Export", e);
						
		}catch(xx){}
		
	}	
	
    nlapiLogExecution('AUDIT', 'BL001_Export_Entity Done', type);
}
//------------------------------------------------------------------
//Function:         BL001_Export_Accounts
//Record:			Transaction
//Subtab:
//Script Type:      
//Script ID:
//Deployment ID:
//Description:      Create a TXT file with contents of all subsidiary trial balances
//
//Script Params:	[custscript_bl001_account_filename]		the filename of the entity type export file
//					[custscript_bl001_account_folder_name]	the folder name
//					[custscript_bl001_account_emailto] 		email address to send alerts to
//					[custscript_bl001_account_error_alerts_only] only send error alerts
//					[custscript_bl001_account_configurationid] id of custom record for the blackline export configuration
//					[custscript_bl001_account_standard_types] override the value from the the Account record and use the standard relationship to account type
//					[custscript_bl001_period_start_date]	the starting date for the trial balance
//					[custscript_bl001_period_end_date]		the ending date for the trial balance
//					[custscript_bl001_retained_earnings]	the retained earnings account to close
//					[custscript_bl001_currencytrans_adj]	the currency adjustment account
//					[custscript_bl001_reporting_sub]		the reporting sub for the currency adjustment
//					[custscript_bl001_account_key_1]		the field to use for position #1 of the key
//					[custscript_bl001_account_key_3]		the field to use for position #3 of the key
//					[custscript_bl001_account_key_4]		the field to use for position #4 of the key
//					[custscript_bl001_account_key_5]		the field to use for position #5 of the key
//					[custscript_bl001_account_datasource]	the saved search to use to drive the export
// 
// Saved Searches:	[customsearch_bl001_transaction_summary]posting transactions summarized by period, subsidiary, account, department, class, location
//					[customsearch_bl001_exchange_rates] 	exchange rate data for translation to reporting currency
//
//
// Create an array of account rows - each represents a row that will be output
// Each row contains 3 amounts (opening balance, current activity, closing balance) in 3 currency values (account currency, functional/subsidiary currency, reporting currency)
// The current activity and closing balance have reliable translation into reporting currency
// Populate the 3 amounts:
// 	1	Run the saved search that returns posting transactions, summarized by period, subsidiary, account.
// 		Filter the saved search to only return rows before the first day of the end accounting period (custscript_bl001_period_start_date).
// 		This will give us the opening balances
// 		Loop through the results: 
//			Create a summary by account, department, class, location:
//				If the account is p&l, add the amount to the retained earnings account, custscript_bl001_retained_earnings
// 
// 	2	Now fetch the transactions for the current period and run the same saved search of posting transactions
// 		Filter the saved search to only return rows onorafter the first day and onorbefore the last day of the end accounting period (custscript_bl001_period_start_date to custscript_bl001_period_end_date)
// 		This will give us the transactions for the period -- both in functional currency and translated
// 		Loop through the results: 
//			Create a summary by account, department, class, location:
//			The export file needs a flag to identify whether there is activity during the current period
//
//	3	The third pass, fetch the transactions through the end of the period
// 		Filter the saved search to only return rows through the end of the accounting period (onorbefore the last day)
// 		This will give us the closing balances translated
//
// Perform a search of all currencies; get a lookup array of currency code to ISO symbol; Blackline needs ISO currency code
//
// Output results. Loop through account summary array and output each row.
//		Balance Sheet accounts:
// 			All Amounts go directly to trial balance - local, functional, reporting
//		P&L accounts
//			Period amounts go to directly to the trial balance
//			Period amounts get subtracted from the Retained Earnings summary 
//			Closing amounts go the Retained Earnings summary
//		
//
//Task:
//
//Date:             SG 20121025
//------------------------------------------------------------------
function BL001_Export_Accounts(type)
{
	nlapiLogExecution('AUDIT', 'BL001_Export_Accounts Starting', type);
	
	    var context = nlapiGetContext();
	
		if (!g_connector_settings.initial_setup){
			return;
		}
	
	    // get script parameters
	    // the export configuration id to link back to; public vars for global error handling
	    g_Profile_ID = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_configurationid'), '');
	    g_Email = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_emailto'), '');
	    g_Email_error_only = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_email_error_onl'), '');
	    
	    // load the file names for the two files
	    var account_file = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_filename'), 'blackline_account_export_YYYYMM.txt');
        var prev_filename = bl_noempty(context.getSetting('SCRIPT', 'custscript_bl001_account_filename'),'').trim();
	    // the files will be put into this folder
	    var folder_name = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_folder_name'), 'blackline_exports');
	    // get the start/end periods for the report
	    var period_start = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_period_start_date'), '');
	    var period_end 	 = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_period_end_date')  , '');
	    var retained_earnings_account = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_retained_earnings'), '');
	    var currencytrans_adj_account = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_currencytrans_adj'), '');
	    var reporting_sub = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_reporting_sub'), '');
	    var account_standard_types = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_standard_types'), '');
	    var account_key_1 = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_key_1'), '');
	    var account_key_3 = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_key_3'), '');
	    var account_key_4 = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_key_4'), '');
	    var account_key_5 = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_key_5'), '');
	    var account_saved_search = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_datasource'), '');
	    var temp_file_id = '';	// this is the file id stored with balances mid-way through the saved search
	    if (account_saved_search.length>0){
	    	if (account_saved_search.indexOf('|')>=0){
	    		var a_val = account_saved_search.split('|');
	    		account_saved_search = a_val[0];
	    		temp_file_id = a_val[1];
	    	}
	    }
	    var account_curr_option = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_no_currency'), CONST_ACCOUNT_OMIT_CURR);
	    g_Status_Field = 'custrecord_bl001_account_export_status';
	    if (account_curr_option == CONST_ACCOUNT_MULTI_CURR){
		    g_Status_Field = 'custrecord_bl001_multicurr_export_status';
	    }
	    nlapiLogExecution('DEBUG', 'account_curr_option g_Status_Field prev_filename', account_curr_option +'|'+g_Status_Field + '|'+prev_filename);
	    
	    var account_list_filter = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_list_filter'), '');
	    var account_incl_or_excl = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_incl_or_excl'), CONST_FILTER_IGNORE);
	    var sub_filter = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_sub_filter'), '');
	    var loc_filter = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_loc_filter'), '');
	    var loc_filter_incl_or_excl = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_loc_incexcl'), CONST_FILTER_IGNORE);
	    
	    bl001_export_accounts(account_file, prev_filename, folder_name, period_start, period_end, retained_earnings_account, currencytrans_adj_account, reporting_sub 
	    		, account_standard_types, account_key_1, account_key_3, account_key_4, account_key_5, account_saved_search, account_curr_option, account_list_filter
	    		, account_incl_or_excl, sub_filter, loc_filter, loc_filter_incl_or_excl, temp_file_id);
	    
	    
}
function bl001_export_accounts(account_file, prev_filename, folder_name, period_start, period_end, retained_earnings_account, currencytrans_adj_account, reporting_sub 
		, account_standard_types, account_key_1, account_key_3, account_key_4, account_key_5, account_saved_search, account_curr_option, account_list_filter
		, account_incl_or_excl, sub_filter, loc_filter, loc_filter_incl_or_excl, temp_file_id){

	try
	{
	    //var context = nlapiGetContext();
	    //var key1_list_filter = '';
	    //var key1_list_filter = bl_noempty( context.getSetting('SCRIPT', 'custscript_bl001_account_key1_list_filt'), '');
	    //if (key1_list_filter.length>0){
	    //	key1_list_filter = ','+key1_list_filter+',';
	    //}
	    //nlapiLogExecution('DEBUG', 'account_incl_or_excl*account_list_filter', account_incl_or_excl+'*'+account_list_filter);
	    //nlapiLogExecution('AUDIT', 'fields',  account_file + '|' + folder_name + '|' + period_start + '|' + period_end + '|' + retained_earnings_account + '|' + currencytrans_adj_account + '|' + reporting_sub + '|' + g_Profile_ID + '|' + g_Email + '|' + account_standard_types + ' >>'+ 'account_file|folder_name|period_start|period_end|retained_earnings_account|currencytrans_adj_account| reporting_sub|export_id|g_Email|account_standard_types');
	    nlapiLogExecution('AUDIT', 'sub_filter account_list_filter loc_filter', sub_filter +'|'+account_list_filter +'|'+loc_filter+ '|' + period_start + '|' + period_end );
	    
	    // there are three options here, although only two are implemented with the account export
	    // preserve_account_currency is always false for now until we implement multi-currency balance; by default, BL can't import an account with more than one currency
	    var preserve_account_currency = false;	// this is true for multi-currency balances; false means we don't export the account currency
	    // if the omit currency option is selected, we don't output the extra currency columns
	    var bShowCurrency = true;
	    // if the preserve bank currency option is selected, we keep the account currency for bank accounts only; otherwise, we output the subsidiary currency
	    var preserve_bank_currency = false;
	    
	    switch(account_curr_option){
	    case CONST_ACCOUNT_OMIT_CURR:
	    	bShowCurrency = false;
	    	break;
	    case CONST_ACCOUNT_KEEP_BANK_CURR:
	    	bShowCurrency = true;
	    	preserve_bank_currency = true;
	    	break;
	    case CONST_ACCOUNT_MULTI_CURR:
	    	preserve_bank_currency = true;
	    	preserve_account_currency = true;
	    	bShowCurrency = true;
	    	break;
	    }
	    
	    //nlapiLogExecution('DEBUG', 'preserve_account_currency|preserve_bank_currency|bShowCurrency', preserve_account_currency+'|'+preserve_bank_currency+'|'+bShowCurrency);
	    // if the company base currency is not defined, we need the ISO for the Account Export
	    if (g_company_settings.base_currency_iso.length==0){
	    	nlapiLogExecution('DEBUG', 'Adding base currency ISO from connector settings', g_connector_settings.default_currency_noForex);
	    	g_company_settings.base_currency_iso = g_connector_settings.default_currency_noForex;
	    }
	
	    
	   // if we have a config_id, mark it as in process
		// update the config status fields
		if (bl_isNonZeroNumber(g_Profile_ID))
			{
				var upd_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', g_Profile_ID);
				var curr_stat = upd_record.getFieldValue(g_Status_Field);
				// if we are requeueing, don't change the status to Processing...
				if (curr_stat.indexOf(CONST_ACCOUNT_REPROCESS_STATUS)<0){
					upd_record.setFieldValue(g_Status_Field, 'Processing');
					nlapiSubmitRecord(upd_record, false, true);
				}
			
			}
	    
		// determine if we have a oneworld account
		// we load this value with connector_settings; we don't look at sub table except during initial setup
		//g_connector_settings.bOneWorld = g_company_settings.is_oneworld();
		
		// before we replace filename, check for DND - do not delete temp files for debugging
		var DND = false;
	    if (account_file.substring(0,4)=='DND_'){
	    	DND = true;
	    	nlapiLogExecution('AUDIT', 'donotdeletetempfiles', account_file);
	    }
	    
	    // replace YYYYMM of filename
	    if ((account_file.indexOf('YYYY')>=0 || account_file.indexOf('MM')>=0))
	    	{
		    	if (period_end.indexOf('/')>0){
		    		var aDate = period_end.split('/');
		    		var mdate = aDate[0];
		    		if (mdate.length==1){
		    			mdate = "0" + mdate;
		    		}
		    		account_file = account_file.replace('YYYY', aDate[2]).replace('MM', mdate);
		    	}else{
		    		var ddd = nlapiStringToDate(period_end);
		    		var ddmonth = parseInt(ddd.getMonth()) + parseInt(1);
		    		if (parseInt(ddmonth)<10){
		    			ddmonth = "0_" + "" + ddmonth + "";
		    		}
		    		var ddyear = ddd.getFullYear();
		    		account_file = account_file.replace('YYYY', ddyear).replace('MM', ddmonth);
		    	}
	    	}
	    // if this is from the config form scheduler, we put the config_id and time on the front
	    if (g_Profile_ID.length>0){
	    	var file_date = new Date();
	    	account_file = g_Profile_ID + '_' + file_date.getHours() + ''+ file_date.getMinutes() + '_'+ file_date.getDate() + ''+ (file_date.getMonth()+1) + '_' +account_file; 
	    }
	    
	    // is the sub_filter a single sub? If yes, we will pass it into the load so we can filter the web service call
	    var single_sub_filter = null;
	    if (sub_filter.length>0){
	    	if (sub_filter.indexOf(',')<=0){
	    		single_sub_filter = sub_filter;
	    	}
	    }
	    
	    
	    // load the account transaction summary data from the saved search and load the account_list object
	    var account_list = new bl001_account_list();
	    if (account_curr_option==CONST_ACCOUNT_MULTI_CURR){
	    	account_list.export_type = CONST_MULTICURR;
	    }else{
	    	account_list.export_type = CONST_ACCOUNT;
	    }
	    account_list.donotdeletetempfiles = DND;
	    account_list.currency_option = account_curr_option;
	    account_list.key1 = account_key_1;				// specify the fields to use for the keys
	    account_list.key3 = account_key_3;
	    account_list.key4 = account_key_4;
	    account_list.key5 = account_key_5;
	    account_list.reporting_sub = reporting_sub;
	    //nlapiLogExecution('DEBUG', 'account keys', account_key_1 +'|'+ account_key_3 + '|' + account_key_4 + '|' + account_key_5);
	    account_list.preserve_account_currency = preserve_account_currency;		// for multi-currency when we implement that in the future
	    if (bl_noempty(account_saved_search,'').length>0){						// if a custom search is defined, use it
	    	account_list.save_search = account_saved_search;
	    }
	    account_list.currency_adj_sub = reporting_sub;		// this is used for non-oneworld as the subsidiary key if it is empty
	    var ret = null;
	    // multi-currency extract uses the saved search
	    if (preserve_account_currency){
		    ret = account_list.load_savedsearch(period_start, period_end, account_list_filter, sub_filter);		// LOAD THE DATA
	    }else{
		    ret = account_list.load(period_start, period_end, single_sub_filter, temp_file_id);		// LOAD THE DATA
	    }
	    if (ret){
	    	if (ret<1){
	    		return;
	    	}
	    }
	    
	    // at this point, we put in the list of forced account includes so even zero balance accounts are included
	    if (!preserve_account_currency){
		    if (account_list_filter.length>0 && account_incl_or_excl != CONST_FILTER_IGNORE && account_incl_or_excl != CONST_FILTER_EXCLUDE){
		    	var xarray = account_list_filter.split(',');
		    	var xlen = xarray.length;
				for (var x=0;x<xlen;x++){
					var x_account = xarray[x];

			        var row_type 	     = account_list.account_list.accounttype(x_account); // result.getText('type', 'account', 'group');

					// we also need to get the list of subsidiaries to process here
					var sub_list = [1];
					if (g_connector_settings.bOneWorld){
						if (row_type == 'Bank'){	// bank only belongs to single sub
							var acc_record = nlapiLoadRecord('account', x_account);
							var acc_subs = bl_noempty(acc_record.getFieldValue('subsidiary'),'');
							nlapiLogExecution('AUDIT', 'acc_subs', acc_subs + ':' + acc_subs.toString().length);
							if (acc_subs.toString().length>0){
								sub_list = [acc_subs];
							}
							nlapiLogExecution('AUDIT', 'sub_list', sub_list);
						}else{
							// our list is either everything... or, just the sub filter
							if (sub_filter.length>0){
								sub_list = sub_filter.split(',');
							}else{
								sub_list = account_list.sublist.keys;
							}
						}
					}
					nlapiLogExecution('AUDIT', 'account:' + x_account, 'sub_list:' + sub_list);
					var slen = sub_list.length;
					for (var s=0; s<slen; s++){
						var x_sub_id = sub_list[s];
						
						
				        var row_account_name = account_list.account_list.name(x_account); //result.getText('account', null, 'group');
				        //nlapiLogExecution('DEBUG', row_account_name+' row_type', row_type);
				        var row_acctnum 	 = account_list.account_list.number(x_account); //result.getValue('number', 'account', 'group');
				        var row_currency	 = null; //result.getValue('currency', null, 'group');
				        var row_subcurr 	 = null;
				        if (g_connector_settings.bOneWorld){
				        	row_subcurr = account_list.sublist.get(x_sub_id).currency; //result.getValue('currency', 'subsidiary', 'group');
				        	if (row_subcurr.length==0){
				        		row_subcurr = g_company_settings.base_currency.id;
				        	}
				        }else{
				        	row_subcurr = g_company_settings.base_currency.id;
				        }
				        row_currency = row_subcurr;
				        var row_ratetype	 = account_list.account_list.generalratetype(x_account); //result.getValue('generalratetype', 'account', 'group');
				        var row_inactive	 = account_list.account_list.isinactive(x_account); //result.getValue('isinactive', 'account', 'group');
				        var row_blacklinetype= account_list.account_list.export_type(x_account); //result.getValue('custrecord_bl001_account_export_type', 'account', 'group');
				        
				        // get the basic keys; assume the start is the account column found above
				        var row_account   = x_account; //result.getValue(row_columns[i_account]);					// the account must be this position in the search because it must always be key #2
				        var row_dept 	  = '';
				        var row_dept_name = '';
				        var row_loc	 	  = '';
				        var row_loc_name  = '';
				        var row_class 	  = '';
				        var row_class_name= '';
				        var row_sub 	  = x_sub_id; // result.getValue(row_columns[i_sub]);	// this column may be empty if not-oneworld; therefore, it may also be a custom key of the client defined search
				        var row_sub_name  = account_list.sublist.get(row_sub).name; // result.getText(row_columns[i_sub]);	
				        if (!row_sub)row_sub='';
				        if (row_sub.length==0){
				        	row_sub = account_list.currency_adj_sub; // get the default currency_adj_sub
				        }
				        // process beginning / ending / period balances
				        var open_period_or_close = 0;
						var beg_period_amt 		= 0;
						// first process beginning
				        var row_amt_local = beg_period_amt; 
				        var row_amt_funct = beg_period_amt; 
				        var row_amt_rep   = 0; 
				        open_period_or_close = 3;
				        var row_extendedkey = "";
				        account_list.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, false);
						
					}
				}	    	
		    }
	    }
	    
	    var number_of_accounts = account_list.count();
	    nlapiLogExecution('DEBUG', 'number_of_accounts', number_of_accounts);

	    // as we output the rows, we need to evaluate whether the account is to be included or excluded
	    // if the list is blank, we will include everything
	    // however, if the list has a value, we need to determine if they should be included or excluded or ignored
	    // if ignored, clear the list and treat it like nothing was submit -- i.e., include all
	    // if included, the default row_include is false and then we test if the list contains a match; if yes, we switch the row_include to true
	    var default_row_include = true;
	    var output_if_match = true;
	    var sub_default_row_include = true;
	    var sub_output_if_match = true;
	    var loc_default_row_include = true;
	    var loc_output_if_match = true;
		// only output the row to the file if it is included in the filter list
		if (account_list_filter.length > 0 || sub_filter.length > 0 || loc_filter.length > 0 ){
			switch(account_incl_or_excl){
			case CONST_FILTER_IGNORE:
				// clear out the filter; we will ignore it and include all rows
				account_list_filter = "";
				default_row_include = true;
				output_if_match = true;
				break;
			case CONST_FILTER_INCLUDE:
				// by default, do not include the row; if the filter contains a match, we'll show it
				default_row_include = false;
				output_if_match = true;
				break;
			case CONST_FILTER_EXCLUDE:
				// by default, show the row; if the filter contains a match, don't show it
				default_row_include = true;
				output_if_match = false;
				break;
			default:
				break;
			}
			if (sub_filter.length > 0){
				sub_default_row_include = false;
				sub_filter = ','+sub_filter+',';
			}
			if (loc_filter.length > 0){
				loc_filter = ','+loc_filter+',';
			}
			switch(loc_filter_incl_or_excl){
			case CONST_FILTER_IGNORE:
				// clear out the filter; we will ignore it and include all rows
				loc_filter = "";
				loc_default_row_include = true;
				loc_output_if_match = true;
				break;
			case CONST_FILTER_INCLUDE:
				// by default, do not include the row; if the filter contains a match, we'll show it
				loc_default_row_include = false;
				loc_output_if_match = true;
				break;
			case CONST_FILTER_EXCLUDE:
				// by default, show the row; if the filter contains a match, don't show it
				loc_default_row_include = true;
				loc_output_if_match = false;
				break;
			default:
				break;
			}
		}
		
		//nlapiLogExecution('DEBUG', 'account_list_filter|account_incl_or_excl|default_row_include|output_if_match', account_list_filter+'|'+account_incl_or_excl+'|'+default_row_include+'|'+output_if_match);
		nlapiLogExecution('DEBUG', 'account_list_filter output_if_match:'+output_if_match, account_list_filter);
	    
	    // keep a tally of the reporting currency; this holds the difference, which is plugged at the end to the Currency Translation Account
	    var currency_translation_adjustment = 0;
	    // we carry these amounts when there are actual balances in the CTA account that need to be combined in the last row
	    var functional_translation_adjustment = 0;	// if there is a balance in the CTA account directly, carry it in the func + account columns
	    var account_translation_adjustment = 0;
	    
	    // keep a tally of the tb; if we are out of balance, abort output and requeue the job
	    var functional_tb_check = 0;
	    var account_tb_check = 0;
	    
	    // get the  account information for the retained earnings account
	    retained_earnings_account = bl_noempty(retained_earnings_account,'');
	    var re_name = null;
	    var re_num = null;
	    var re_type = null;
	    var re_bl_type = null;
	    if (retained_earnings_account.length>0){
		    var re_account = nlapiLoadRecord('account', retained_earnings_account);
		    re_name = bl_noempty(re_account.getFieldValue('acctname'),'Retained Earnings');
		    re_num  = bl_noempty(re_account.getFieldValue('acctnumber'),'');
		    re_type = bl_noempty(re_account.getFieldValue('accttype'), 'Equity');
		    re_bl_type = bl_noempty(re_account.getFieldValue('custrecord_bl001_account_export_type'), '');
	    }else{
	    	retained_earnings_account = '-9999';
		    re_name = 'Retained Earnings';
		    re_num  = '';
		    re_type = 'Equity';
		    re_bl_type = '';
	    }
		var k_account = account_list.make_key(retained_earnings_account, re_num + ' ' +re_name, 2, re_num);

		currencytrans_adj_account = bl_noempty(currencytrans_adj_account,'');
		var cta_account = null;
		var cta_num = null;
		var cta_type = null;
		var cta_bl_type = null;
		var cta_k_account = null;
		var key_cta_to_test = null;
	    if (currencytrans_adj_account.length>0 && g_company_settings.feature_multi_curr){
		    cta_account = nlapiLoadRecord('account', currencytrans_adj_account);
		    cta_name = cta_account.getFieldValue('acctname');
		    cta_num  = bl_noempty(cta_account.getFieldValue('acctnumber'),'');
		    cta_type = bl_noempty(cta_account.getFieldValue('accttype'), 'Equity');
		    cta_bl_type = bl_noempty(cta_account.getFieldValue('custrecord_bl001_account_export_type'), '');
			cta_k_account = account_list.make_key(currencytrans_adj_account, cta_num + ' ' + cta_name, 2, cta_num);
		    key_cta_to_test = account_list.key(reporting_sub, cta_k_account, "", "", "", "");	// this is the CTA account to test against below to prevent duplicate rows
	    }else{
	    	if (g_company_settings.feature_multi_curr){
	    		currencytrans_adj_account = '-999';
			    cta_name = 'Currency Translation';
			    cta_num  = '';
			    cta_type = 'Equity';
			    cta_bl_type = '';
				cta_k_account = account_list.make_key(currencytrans_adj_account, cta_num + ' ' + cta_name, 2, cta_num);
			    key_cta_to_test = account_list.key(reporting_sub, cta_k_account, "", "", "", "");	// this is the CTA account to test against below to prevent duplicate rows
	    	}else{
		    	cta_k_account = CONST_BASE_NOCURR;
		    	key_cta_to_test = CONST_BASE_NOCURR;
	    	}
	    }
	    
		// if we need to process bank currencies, we will load the balances
		var bank_balance_list = null;
		if (account_curr_option == CONST_ACCOUNT_KEEP_BANK_CURR){
			bank_balance_list = new bl001_bank_balances(period_end, account_list.save_search);
		}

		// make sure the string is wrapped in ',' for our indexOf() comparison
	    if (account_list_filter.length>0){
	    	account_list_filter = ','+account_list_filter+',';
	    }
	    
	    // the period_end is in a locale format
	    // it needs to be MM/DD/YYYY for Blackline export
	    var bl_period_end = bl001_format_period_end(period_end);

	    // loop through the accounts and output them
	    var debug_array = new Array();
	    var account_rows = new Array();		// hold output for each row; use array.join() to speed string processing
	    for(var key in account_list.list)
	    {
	    	//nlapiLogExecution('DEBUG', 'loop through the accounts and output them: account_list[key]', key);
	    	var row = account_list.list[key];
	    	
	    	// we should export zero balances
	    	// if account is zero, nothing to do
	    	//if (!(bl_isNonZeroNumber(row.functionalclosingbalance) || bl_isNonZeroNumber(row.functionalperiodactivity) || bl_isNonZeroNumber(row.reportingclosingbalance) || bl_isNonZeroNumber(row.reportingperiodactivity) || bl_isNonZeroNumber(row.accountperiodactivity) || bl_isNonZeroNumber(row.accountclosingbalance))){
	    	//	//nlapiLogExecution('DEBUG', 'row is zero', 'exit');
	    	//	continue;
	    	//}
	    	
	    	var filt_sub_id = row.sub_id;
	    	var filt_loc_id = row.loc_id;
			var this_sub_id = row.key.split('|')[0];				// this is key #1
			var this_account_id = row.account_id;					// this is key #2 (account)
	    	var account_type = row.accounttype;
	    	var ns_accounttype = row.nsaccounttype;
	    	var this_period_activity = 'FALSE';
	    	if (bl_isNonZeroNumber(row.accountperiodactivity))
			{
				this_period_activity = 'TRUE';
			}
			var account_active = 'TRUE';
			if (row.inactive == 'T')
				{
				account_active = 'FALSE';
				}
	
	    	// create an array of the columns for this row
			// the first 10 columns represent the keys
			// our key for the summary is row_sub + '|' + row_account + '|' + row_dept + '|' + row_loc + '|' + row_class + '|' + row_currency;
			// remove the currency with pop()
			//nlapiLogExecution('DEBUG', 'key', row.key);
			var new_array = row.key.split('|');
			var debug_row = row.key.split('|');
			if (preserve_account_currency){
				new_array.pop();
				debug_row.pop();
			}
			var key_test_duplicate = new_array.join('|');	// use this below so we can compare to the RE and CTA accounts
			
			// make sure it has 10 items
			var key_len = new_array.length;
			for (var i=key_len; i<10;i++)
				{
				new_array[new_array.length] = '';
				debug_row[debug_row.length] = '';
				}
			new_array[10] = row.name;
			new_array[11] = row.acctnumber;
			new_array[12] = bl001_exporttype(row.accounttype, row.blacklinetype, account_standard_types);
			new_array[13] = row.accounttype;
			new_array[14] = account_active;
			new_array[15] = this_period_activity;
			new_array[16] = g_company_settings.currency_list.getISOsymbol(row.functionalcurrency,g_company_settings.base_currency_iso);
			new_array[17] = g_company_settings.currency_list.getISOsymbol(row.accountcurrency,g_company_settings.base_currency_iso) ;
			new_array[18] = bl_period_end;

			debug_row[debug_row.length] = row.name;
			debug_row[debug_row.length] = row.acctnumber;
			debug_row[debug_row.length] = bl001_exporttype(row.accounttype, row.blacklinetype, account_standard_types);
			debug_row[debug_row.length] = row.accounttype;
			debug_row[debug_row.length] = account_active;
			debug_row[debug_row.length] = this_period_activity;
			debug_row[debug_row.length] = g_company_settings.currency_list.getISOsymbol(row.functionalcurrency,g_company_settings.base_currency_iso);
			debug_row[debug_row.length] = g_company_settings.currency_list.getISOsymbol(row.accountcurrency,g_company_settings.base_currency_iso) ;
			debug_row[debug_row.length] = bl_period_end;

	    	var is_PL_account = bl001_isIncomeExpenseAccount(account_type);
	    	
	    	debug_row[debug_row.length] = is_PL_account;
	    	
	    	
	//      :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
	//		LOGIC OF NEXT SECTION    	
	//		Balance Sheet accounts:
	//			All Amounts go directly to trial balance - local, functional, reporting
	//		P&L accounts
	//			Period amounts go to directly to the trial balance
	//			Period amounts get subtracted from the Retained Earnings summary 
	//			Closing amounts go the Retained Earnings summary
	//		Except:
	//			Retained Earnings and Currency Adjustment - Eliminate duplicate rows
	//				If sub + account match but the other keys are empty,
	//				we can't output the row with the balance sheet; we need to hold the row
	//				until the end. We need to add the amounts to the computed values			
	//				and output a single row. A duplicate row with the same account will 
	//				not get imported into Blackline.
	    	
	    	// look for RE and CurrTrans account match
	    	//nlapiLogExecution('DEBUG', 'row.account_id | retained_earnings_account | currencytrans_adj_account', row.account_id  + ' | ' + retained_earnings_account + ' | ' + currencytrans_adj_account);
	    	// to match the records, i need to create the keys that would be output to see if they match
			var key_re_to_test = account_list.key(row.sub_id, k_account, "", "", "");
			
		    //nlapiLogExecution('DEBUG', 'key_cta_to_test | key_re_to_test | key_test_duplicate', key_cta_to_test + ' ** '+ key_re_to_test + ' ** '+ key_test_duplicate );
		    
			
	    	// this is a R.E. row; therefore, add it to the balances that we'll output at the end
	    	if ( key_test_duplicate ==  key_re_to_test){
	    			account_list.add_retainedearnings(this_sub_id, row.accountcurrency, row.accountclosingbalance, row.functionalclosingbalance, row.reportingclosingbalance, 0, 0, 0);
	    			debug_row[debug_row.length] = "RE Account";
	    			debug_row[debug_row.length] = (row.functionalclosingbalance);
	    			debug_row[debug_row.length] = (row.accountclosingbalance);
	    			debug_row[debug_row.length] = (row.reportingclosingbalance);
	    			// we don't want to output this row; therefore loop
	    			continue;
	    		//}
	    	}
	    	// if this is a CTA row, add the functional + account balances to the CTA row that we output last; the reporting is a plug so we don't worry about it here
	    	if ( key_test_duplicate == key_cta_to_test ){
	    			functional_translation_adjustment += parseFloat(row.functionalclosingbalance);
	    			account_translation_adjustment += parseFloat(row.accountclosingbalance);
	    			debug_row[debug_row.length] = "CTA Account";
	    			debug_row[debug_row.length] = (row.functionalclosingbalance);
	    			debug_row[debug_row.length] = (row.accountclosingbalance);
	    			debug_row[debug_row.length] = 0;
	    			// we don't want to output this row; therefore loop
	    			continue;
	    		//}
	    	}
	    	
	    	
	    	// Balance sheet accounts - output the closing balances
	    	if (!is_PL_account)
	    		{
	    			new_array[19] = row.reportingclosingbalance;
					new_array[20] = row.functionalclosingbalance;
					//nlapiLogExecution('DEBUG', 'ns_accounttype ' + account_curr_option, ns_accounttype);
					if (account_curr_option == CONST_ACCOUNT_KEEP_BANK_CURR && ns_accounttype == CONST_ACCOUNT_TYPE_BANK){
						new_array[21] = bank_balance_list.balance(this_account_id);
						//nlapiLogExecution('DEBUG', 'new_array[21] ', new_array[21] );
					}else{
						new_array[21] = row.accountclosingbalance;	
					}
	    		}
	    	else // P&L accounts - output the period activity & add to the R.E. balance
	    		{
	    			// if we are running balance sheet only, roll-up current period income into RE
					if ( account_incl_or_excl==CONST_FILTER_BALSHEET || account_incl_or_excl==CONST_FILTER_LIABEQ ){
						if (CONST_ALLOW_PL_BS){
							new_array[19] = row.reportingperiodactivity;
							new_array[20] = row.functionalperiodactivity;
							new_array[21] = row.accountperiodactivity;
							
							// adjust the foot-to-zero check
							functional_tb_check -= parseFloat(new_array[20]);
							currency_translation_adjustment -= parseFloat(new_array[19]);
						}else{
							new_array[19] = 0;
							new_array[20] = 0;
							new_array[21] = 0;
						}
						account_list.add_retainedearnings(this_sub_id, row.accountcurrency, row.accountclosingbalance, row.functionalclosingbalance, row.reportingclosingbalance, 0, 0, 0);
					}else{
						new_array[19] = row.reportingperiodactivity;
						new_array[20] = row.functionalperiodactivity;
						new_array[21] = row.accountperiodactivity;
						account_list.add_retainedearnings(this_sub_id, row.accountcurrency, row.accountclosingbalance, row.functionalclosingbalance, row.reportingclosingbalance, row.accountperiodactivity, row.functionalperiodactivity, row.reportingperiodactivity);
					}
	    		};
	    	
	    	// make sure the trial balance foots to zero
	        functional_tb_check += parseFloat(new_array[20]);;
	        account_tb_check += parseFloat(new_array[21]);;
	        
	        // round to zero if necessary for output - don't return scientific notation
	        new_array[19] = bl001_roundzero(new_array[19]); 
			new_array[20] = bl001_roundzero(new_array[20]);
			new_array[21] = bl001_roundzero(new_array[21]);
			
			debug_row[debug_row.length] = new_array[19];
			debug_row[debug_row.length] = new_array[20];
			debug_row[debug_row.length] = new_array[21];
			
			debug_array[debug_array.length] = debug_row.join('\t');
			
	        // if we need to preserve the bank account currency and this is a bank account
	        if ( preserve_account_currency==false && preserve_bank_currency==true && ns_accounttype==CONST_ACCOUNT_TYPE_BANK ){
	        	 // don't replace the values... but, we need to carry the difference for the CTA adjustment at the end
	        	//nlapiLogExecution('DEBUG', 'preserve_bank_currency', preserve_bank_currency);
	        	account_translation_adjustment += (parseFloat(new_array[20]) - parseFloat(new_array[21]));
	        	account_tb_check += (parseFloat(new_array[20]) - parseFloat(new_array[21]))*-1;
	        }
	        // multi-currency balance export
	        else if (preserve_account_currency==true && preserve_bank_currency==true){
	        	// let this go through normally; nothing to change except column sequence, which we will do immediately
	        	// prior to writing the array to the file
	        	//nlapiLogExecution('DEBUG', 'multi-currency', new_array.join('|'));
	        }
	    	// not multi-currency balance export - therefore we don't keep account balance in it's own currency; we just use the functional(subsidiary) currency. therefore, replace account info with functional info
	        else if ((!preserve_account_currency)){
	        	//nlapiLogExecution('DEBUG', 'preserve_account_currency', preserve_account_currency);
	    		new_array[17] = new_array[16];
	    		new_array[21] = new_array[20];
	    	}
	    	// the omit currency checkbox selected; hide the functional currency columns
	    	if (!bShowCurrency){
	    		new_array[16] = '';
	    		new_array[20] = '';    		
	    	}
	    	
	    	// plug the CTA for the last row
	    	currency_translation_adjustment += parseFloat(new_array[19]);
	
	    	var bWriteRow = null;
	    	var bAccWriteRow = default_row_include;
	    	var bSubWriteRow = sub_default_row_include;
	    	var bLocWriteRow = loc_default_row_include;
	    	if (account_list_filter.length > 0){
	    		if (account_list_filter.indexOf(','+this_account_id+',')>=0){
	    			bAccWriteRow = output_if_match;
	    		}
	    	}
	    	
	    	// if we are balancesheet, asset only, etc...
	    	var post_check = false;							// if true, we'll try to match against include list again to force accounts
			switch(account_incl_or_excl){
			case CONST_FILTER_BALSHEET:
				if (bl001_isBalanceSheetAccount(row.accounttype)){
					bAccWriteRow = true;
				}else{
					bAccWriteRow = false;
					post_check = true;
				}
				break;
			case CONST_FILTER_ASSETS:
				if (bl001_isAssetAccount(row.accounttype)){
					bAccWriteRow = true;
				}else{
					bAccWriteRow = false;
					post_check = true;
				}
				break;
			case CONST_FILTER_LIABEQ:
				if (bl001_isLiabEquityAccount(row.accounttype)){
					bAccWriteRow = true;
				}else{
					bAccWriteRow = false;
					post_check = true;
				}
				break;
			case CONST_FILTER_PL:
				if (bl001_isIncomeExpenseAccount(row.accounttype)){
					bAccWriteRow = true;
				}else{
					bAccWriteRow = false;
					post_check = true;
				}
				break;
			default:
				break;
			}
			// should we include an account that isn't in balance sheet list? e.g., let us include a single P&L account with our balance sheet
			if (post_check && bAccWriteRow==false && CONST_ALLOW_PL_BS){
		    	if (account_list_filter.length > 0){
		    		if (account_list_filter.indexOf(','+this_account_id+',')>=0){
		    			bAccWriteRow = true;
		    		}
		    	}
			}
	
	    	//if (key1_list_filter.length>0){
	    	//	if (key1_list_filter.indexOf(','+this_sub_id+',')>=0){
	    	//		bWriteRow = output_if_match;
	    	//	}
	    	//}
	    	if (sub_filter.length>0){
	    		if (sub_filter.indexOf(','+filt_sub_id+',')>=0){
	    			bSubWriteRow = sub_output_if_match;
	    		}
	    	}
	    	if (loc_filter.length>0){
	    		if (loc_filter.indexOf(','+filt_loc_id+',')>=0){
	    			bLocWriteRow = loc_output_if_match;
	    		}
	    	}
	    	bWriteRow = (bAccWriteRow && bSubWriteRow && bLocWriteRow);
	    	if (bWriteRow){
	    		if (preserve_account_currency==true && preserve_bank_currency==true){
	    			new_array = bl001_multicurr_format(new_array);
	    		}
	    		account_rows[account_rows.length] = new_array.join('\t');
	    	}
	    	
	    }
	    
	    // output the retained earnings
	    for (var key in account_list.sub_list_retainedearnings)
		{
	    	nlapiLogExecution('DEBUG', 'loop through RE and output them: account_list.sub_list_retainedearnings[key]', key);
	    	var row = account_list.sub_list_retainedearnings[key];     	// {local:0,functional:0,reporting:0,key:row_sub,currency:row_currency,subcurr:row_subcurr};
			var account_active = 'TRUE';
	    	var functional_currency = row.subcurr;
	    	var account_currency = row.currency;
	    	var this_period_activity = 'TRUE';
	    	var re_array = account_list.key(row.key, k_account, "", "", "", "").split('|');
	    	for (var i=re_array.length;i<10;i++)
	    		{
	    		re_array[re_array.length] = '';
	    		}
	    	re_array[10] = re_name;
	    	re_array[11] = re_num;
	    	re_array[12] = bl001_exporttype(re_type, re_bl_type, account_standard_types);
	    	re_array[13] = re_type;
			re_array[14] = account_active;
			re_array[15] = this_period_activity;
			re_array[16] = g_company_settings.currency_list.getISOsymbol(functional_currency,g_company_settings.base_currency_iso);
			re_array[17] = g_company_settings.currency_list.getISOsymbol(account_currency,g_company_settings.base_currency_iso) ;
			re_array[18] = bl_period_end;
			re_array[19] = row.reporting;
			re_array[20] = row.functional;
			re_array[21] = row.local;
	
	    	// make sure the trial balance foots to zero
	        functional_tb_check += parseFloat(re_array[20]);;
	        account_tb_check += parseFloat(re_array[21]);;
	
			// the account currency and functional currencies should be the functional currency only
			if (!preserve_account_currency){
				re_array[17] = re_array[16];
				re_array[21] = re_array[20];
			}
			
			// the user has selected not to show functional currency column
			if (!bShowCurrency){
				re_array[16] = '';
				re_array[20] = '';
			}
	
			currency_translation_adjustment += parseFloat(re_array[19]);
			
	        // round to zero if necessary for output - don't return scientific notation
			re_array[19] = bl001_roundzero(re_array[19]); 
			re_array[20] = bl001_roundzero(re_array[20]);
			re_array[21] = bl001_roundzero(re_array[21]);
	    	
			if (preserve_account_currency){
				continue;
			}
			
			if (parseInt(retained_earnings_account)>=0){
		    	var bWriteRow = null;
		    	var bAccWriteRow = default_row_include;
		    	var bSubWriteRow = sub_default_row_include;
		    	var bLocWriteRow = loc_default_row_include;
		    	// only output the row to the file if it is included in the filter list
		    	if (account_list_filter.length > 0){
		    		if (account_list_filter.indexOf(','+retained_earnings_account+',')>=0){
		    			bAccWriteRow = output_if_match;
		    		}
		    	}
		    	// if we are balancesheet, asset only, etc...
				switch(account_incl_or_excl){
				case CONST_FILTER_BALSHEET:
					bAccWriteRow = true;
					break;
				case CONST_FILTER_ASSETS:
					bAccWriteRow = false;
					break;
				case CONST_FILTER_LIABEQ:
					bAccWriteRow = true;
					break;
				case CONST_FILTER_PL:
					bAccWriteRow = false;
					break;
				default:
					break;
				}
				//if (key1_list_filter.length>0){
		    	//	if (key1_list_filter.indexOf(','+row.key+',')>=0){
		    	//		bWriteRow = output_if_match;
		    	//	}
		    	//}
		    	if (sub_filter.length>0){
		    		if (sub_filter.indexOf(','+row.key+',')>=0){
		    			bSubWriteRow = sub_output_if_match;
		    		}
		    	}
		    	bWriteRow = (bAccWriteRow && bSubWriteRow && bLocWriteRow);
		    	if (bWriteRow){
		    		if (preserve_account_currency==true && preserve_bank_currency==true){
		    			re_array = bl001_multicurr_format(re_array);
		    		}
		    		account_rows[account_rows.length] = re_array.join('\t');
		    	}
			}
		}
	    
	    if (g_company_settings.feature_multi_curr){
		    // output the final currency translation adjustment
		    if (bl_isNonZeroNumber(currency_translation_adjustment))
		    	{
		    		var k_sub = '';
		    		var sub_curr = '';
		    		// this will fail if we don't have a one-world implementation; 
		    		try{
		    			var cta_sub = nlapiLoadRecord('subsidiary', reporting_sub);
		    			var sub_name = cta_sub.getFieldValue('name');
		    			sub_curr = g_company_settings.currency_list.getISOsymbol(cta_sub.getFieldValue('currency'),g_company_settings.base_currency_iso);
		    	        if (account_list.key1 == CONST_ENTITY_KEY_SUB){
		    	        	k_sub = account_list.make_key(reporting_sub, sub_name, 1);	// this creates a key for a single column, which depends on the position
		                }else {
		                	k_sub = account_list.make_key(reporting_sub, sub_name, 3);
		                }
		    		} catch (e){
		    			// for non-oneworld accounts
		    	        if (account_list.key1 == CONST_ENTITY_KEY_SUB){
		    	        	k_sub = account_list.make_key(reporting_sub, CONST_PARENT_COMPANY, 1);
		                }else {
		                	k_sub = account_list.make_key(reporting_sub, CONST_PARENT_COMPANY, 3);
		                }
		    	        sub_curr = g_company_settings.base_currency_iso;
		    		}
					var account_active = 'TRUE';
					var this_period_activity = 'TRUE';
					//var cta_array = new Array();
					//cta_array[0] = reporting_sub;
					//cta_array[1] = currencytrans_adj_account;
					var cta_array = account_list.key(k_sub, cta_k_account, "", "", "", "").split('|');
					for (var i=cta_array.length;i<10;i++)
						{
						cta_array[cta_array.length] = '';
						}
					cta_array[10] = cta_name;
					cta_array[11] = cta_num;
					cta_array[12] = bl001_exporttype(cta_type, cta_bl_type, account_standard_types);
					cta_array[13] = bl001_translate_accounttype(cta_type);
					cta_array[14] = account_active;
					cta_array[15] = this_period_activity;
					cta_array[16] = sub_curr;
					cta_array[17] = sub_curr;
					cta_array[18] = bl_period_end;
					cta_array[19] = bl_fixtinynumber(parseFloat(currency_translation_adjustment) * parseFloat(-1));
					cta_array[20] = bl_fixtinynumber(functional_translation_adjustment);
					if (account_curr_option == CONST_ACCOUNT_KEEP_BANK_CURR){
						cta_array[21] = 0;
					}else{
						cta_array[21] = bl_fixtinynumber(account_translation_adjustment);	
					}
					
		
			    	// make sure the trial balance foots to zero
			        functional_tb_check += parseFloat(cta_array[20]);;
			        account_tb_check += parseFloat(cta_array[21]);;
					
					// the user has selected not to show functional currency column
					if (!bShowCurrency){
						cta_array[16] = '';
						cta_array[20] = '';
					}

			        // round to zero if necessary for output - don't return scientific notation
					cta_array[19] = bl001_roundzero(cta_array[19]); 
					cta_array[20] = bl001_roundzero(cta_array[20]);
					cta_array[21] = bl001_roundzero(cta_array[21]);

				    // do not output CTA for multi-curr export
				    if (!preserve_account_currency){
						if (parseInt(currencytrans_adj_account)>=0){
					    	var bWriteRow = null;
					    	var bAccWriteRow = default_row_include;
					    	var bSubWriteRow = sub_default_row_include;
					    	var bLocWriteRow = loc_default_row_include;
					    	// only output the row to the file if it is included in the filter list
					    	if (account_list_filter.length > 0){
					    		if (account_list_filter.indexOf(','+currencytrans_adj_account+',')>=0){
					    			bAccWriteRow = output_if_match;
					    		}
					    	}
					    	// if we are balancesheet, asset only, etc...
							switch(account_incl_or_excl){
							case CONST_FILTER_BALSHEET:
								bAccWriteRow = true;
								break;
							case CONST_FILTER_ASSETS:
								bAccWriteRow = false;
								break;
							case CONST_FILTER_LIABEQ:
								bAccWriteRow = true;
								break;
							case CONST_FILTER_PL:
								bAccWriteRow = false;
								break;
							default:
								break;
							}
					    	//if (key1_list_filter.length>0){
					    	//	if (key1_list_filter.indexOf(','+k_sub+',')>=0){
					    	//		bWriteRow = output_if_match;
					    	//	}
					    	//}
					    	if (sub_filter.length>0){
					    		if (sub_filter.indexOf(','+reporting_sub+',')>=0){
					    			bSubWriteRow = sub_output_if_match;
					    		}
					    	}
					    	bWriteRow = (bAccWriteRow && bSubWriteRow && bLocWriteRow);
					    	if (bWriteRow){
					    		if (preserve_account_currency==true && preserve_bank_currency==true){
					    			cta_array = bl001_multicurr_format(cta_array);
					    		}
					    		account_rows[account_rows.length] = cta_array.join('\t');
					    	}
						}
				    }
		    	}
		}
	    
		// make sure the trial balance foots to zero; requeue the script if it doesn't
	    // don't verify the footing of t.b. if we are using a custom saved search
	    if (CONST_DISABLE_TB_ZERO){
	    	nlapiLogExecution('AUDIT', 'Skipping trial balance final foot-to-zero check because dev mode functional|account diff', functional_tb_check + '|' +account_tb_check);
	    } else if (bl_noempty(account_saved_search,'').length>0){
	    	nlapiLogExecution('AUDIT', 'Skipping trial balance final foot-to-zero check because of a custom saved search', account_saved_search + '|' +  functional_tb_check + '|' +account_tb_check);
	    } else if (preserve_account_currency){
	    	nlapiLogExecution('DEBUG', 'Skipping trial balance final foot-to-zero check because multi-currency'); 
	    }else {
		    functional_tb_check = Math.abs(Math.round(functional_tb_check));
		    account_tb_check = Math.abs(Math.round(account_tb_check));
		    //if (functional_tb_check > 1 || account_tb_check > 1){
		    if ( functional_tb_check > 1 ){
    	    	if (bl_isNonZeroNumber(g_Profile_ID))
    			{
    	    		//nlapiLogExecution('DEBUG', 'Updating status for requeue failure', g_Profile_ID);
    				var upd_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', g_Profile_ID);
    				upd_record.setFieldValue(g_Status_Field, 'Error: Trial balance does not foot to zero (diff:' +functional_tb_check+ ') ' + bl_nowtimestring());
    				nlapiSubmitRecord(upd_record, false, true);
    			}
				return;
 
		    }
	    }
	    
	    // write debug file
	    if (DND){
	        // create the file
	        var debug_folder_id = bl001_getfolder("temp");
   	    	var dfile_date = new Date();
   	    	var dtempfile = g_Profile_ID + '_' + dfile_date.getHours() + ''+ dfile_date.getMinutes() + '_'+ dfile_date.getDate() + ''+ (dfile_date.getMonth()+1) + '_account_export.txt'; 
	    	var det_file = nlapiCreateFile(dtempfile, 'PLAINTEXT', debug_array.join('\n'));
	    	det_file.setFolder(debug_folder_id);
	    	// save the file
	    	nlapiSubmitFile(det_file);
	    	
	    }
	    
	    
	    // write the file to the folder
	    var url = "";
	    if (account_rows.length>0){
	    	url = bl001_writefile(folder_name, account_file, account_rows.join('\n'));	
	    }else{
	    	bl001_log_export(g_Profile_ID, account_list.export_type, "", "No records to output");
	    	bl001_sendemail(false, 'Your Blackline '+account_list.export_type+' export contained no records', 'Your Blackline '+account_list.export_type+' export contained no records');
	    	nlapiLogExecution('AUDIT', 'BL001_Export_Accounts Done - no records to output');
	    	return;
	    }
	    
	    bl001_log_export(g_Profile_ID, account_list.export_type, url, null, period_start + '-' + period_end);
	    
	    if (g_Profile_ID.length > 0){	
	    	var url_to_send = bl001_ns_host() + nlapiResolveURL('RECORD', 'customrecord_bl001_nsconnector_status', g_Profile_ID);
	    	bl001_sendemail(false, 'Your Blackline '+account_list.export_type+' export is complete', 'Link:' + url_to_send);
	    } else{
	    	bl001_sendemail(false, 'Your Blackline '+account_list.export_type+' export is complete', 'Link:' + url);
	    }
	}
	catch (e){
		
		try{
	    	if (bl_isNonZeroNumber(g_Profile_ID))
			{
				var upd_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', g_Profile_ID);
				upd_record.setFieldValue(g_Status_Field, "Unexpected Error");
				nlapiSubmitRecord(upd_record, false, true);
			}

			bl001_logerror("Blackline Data Connect unexpected error", "Unable to process Export", e);
						
		}catch(xx){
			if (g_Devmode){
				throw xx;
			}
		}
		
	}

    nlapiLogExecution('AUDIT', 'BL001_Export_Accounts Done');
	
	return;

}
// format the lacale formatted date to MM/DD/YYYY for blackline
function bl001_format_period_end(period_end)
{
	var this_date = nlapiStringToDate(period_end);
	var mm = parseInt(parseInt(this_date.getMonth()) + parseInt(1)).toString();
	var dd = this_date.getDate().toString();
	var yy = this_date.getFullYear().toString();
	return mm.concat('/').concat(dd).concat('/').concat(yy);
}
// round to zero if there are too many decimal places - don't show scientific notation
function bl001_roundzero(check_input)
{
	if (!check_input)return "0";
	if (!bl_isNumber(check_input))return "0";
	if (parseFloat(check_input)==0)return 0;
	if (parseFloat(check_input)<0.0000001 && parseFloat(check_input)>-0.0000001)return 0;
	check_input = (Math.round(parseFloat(check_input)*parseFloat(1000000)))/parseFloat(1000000);
	return check_input;
}
// this function switches a row format from the account export to the format for the multi-curr export
function bl001_multicurr_format(old_array)
{
	var new_array = new Array();
	
	// the first 10 columns are identical
	for (var i=0; i<10; i++)
	{
		new_array[new_array.length] = old_array[i];
	}
	
	new_array[10] = ""; // SourceType (K)
	new_array[11] = "Balance_GL"; // Balance Type (L)

	new_array[12] = old_array[18]; // Period End Date (M) --> Column (S) on Account Export
	new_array[13] = old_array[19];	// Reporting Balance (N)   --> Column (T) on Account Export
	new_array[14] = old_array[19];  // Reporting Balance (O)   --> Column (T) on Account Export
	new_array[15] = old_array[20];  // Functional Balance (P)  --> Column (U) on Account Export
	new_array[16] = old_array[21];  // Account Amount (Q)	   --> Column (V) on Account Export
	new_array[17] = old_array[17];  // Account Currency Code (R)-> Column (R) 

	//new_array[12] = old_array[18]; // Period End Date (M) --> Column (S) on Account Export
	//new_array[13] = old_array[20];	// Functional Balance (N)  --> Column (U) on Account Export
	//new_array[14] = old_array[19];  // Reporting Balance (O)   --> Column (T) on Account Export
	//new_array[15] = old_array[21];  // Account Balance (P)     --> Column (V) on Account Export
	//new_array[16] = old_array[21];  // Amount (Q)			   --> Column (V) on Account Export
	//new_array[17] = old_array[17];  // Account Currency Code (R)-> Column (R) 

	return new_array;

}
// avoid scientific notation output of tiny number; output zero
function bl_fixtinynumber(inp){
	if (parseFloat(inp)<.000001 && parseFloat(inp)>0){
		return 0;
	}else if (parseFloat(inp)>-.000001 && parseFloat(inp)<0){
		return 0;
	}
	
	return inp;
}
// obtain the hostname for the url to send via email
function bl001_ns_host(){
	var sFileUrl = bl_noempty( nlapiResolveURL('SUITELET', CONST_FILEPICKUP_SUITELET, 1, true), '');
	if (sFileUrl.length>0){
		var ret_val = "https://";
		sFileUrl = sFileUrl.replace(ret_val,'').replace('forms','system');
		var aUrl = sFileUrl.split('/');
		if (aUrl.length>0){
			return ret_val + aUrl[0] + '/';
		}
	}
	return CONST_HOST_DEFAULT;
}
// algorithm to evaluate the Financial Statement column value based on the input parameters
function bl001_exporttype(account_type, export_type, account_standard_types)
{
	if (!export_type)export_type="";
	if (export_type.length>0 && account_standard_types=='F'){
		return bl001_exportmatrix(export_type);
	}else{
		if (bl001_isIncomeExpenseAccount(account_type)){
			return 'I';
		}else{
			return 'A';	
		}
	}
	return 'A';
}
// the standard export types based on the NS account type
function bl001_exportmatrix(export_type){	
	if (!export_type)return 'A';
	if (export_type=='Reconciliation')return 'A';
	if (export_type=='Variance Analysis')return 'I';
	if (export_type=='Consolidation Module')return 'C';
	return 'A';
}
// create the export log record
function bl001_log_export(config_id, export_type, url, msg, sub_msg)
{
	//	nlapiLogExecution('DEBUG', 'config_id|export_type|url', config_id + '|' + export_type + '|' + url);
	if (!config_id)return;
	if (!config_id.length)return;

	// default message
	if (!msg)
	{
		msg = "Complete ";
	}
	if (!sub_msg)
	{
		sub_msg = "";
	} else {
		sub_msg = " " + sub_msg;
	}

	// add download insruction for file
	if (url){
		url += "&_xd=T&e=T";
	}
	
	// insert the new log record
	var new_record = nlapiCreateRecord('customrecord_bl001_nsconnector_exportlog');
	if (url){
		new_record.setFieldValue('custrecord_bl001_log_link_to_file', url);
	}
	if (msg){
		new_record.setFieldValue('custrecord_bl001_log_export_type', export_type + ' (' + msg.trim() + sub_msg + ')');
	} else {
		new_record.setFieldValue('custrecord_bl001_log_export_type', export_type);
	}
	new_record.setFieldValue('custrecord_bl001_config_parent', config_id);
	nlapiSubmitRecord(new_record, true, true);

	// also update the config status fields
	var load_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', config_id);
	
	
	var bUpdate = false;
	if (export_type==CONST_ENTITY){
		load_record.setFieldValue('custrecord_bl001_entity_export_status', msg + ' ' + bl_nowtimestring());
		if (url){
			load_record.setFieldValue('custrecord_bl001_entity_download', url);
		}
		bUpdate = true;
	}
	if (export_type==CONST_ENTITYTYPE){
		if (url){
			load_record.setFieldValue('custrecord_bl001_entitytype_download', url);
		}
		bUpdate = true;		
	}
	if (export_type==CONST_ACCOUNT || export_type==CONST_MULTICURR){
		var status_fld = 'custrecord_bl001_account_export_status';
		var dl_fld = 'custrecord_bl001_account_download';
		if (export_type==CONST_MULTICURR){
			status_fld = 'custrecord_bl001_multicurr_export_status';
			dl_fld = 'custrecord_bl001_multicurr_download';
		}
		load_record.setFieldValue(status_fld, msg + ' ' + bl_nowtimestring());
		if (url){
			load_record.setFieldValue(dl_fld, url);
		}
		bUpdate = true;
	}
	//if (export_type==CONST_BANKREC){
	//	load_record.setFieldValue('custrecord_bl001_bankrec_export_status', msg + ' ' + bl_nowtimestring());
	//	if (url){
	//		load_record.setFieldValue('custrecord_bl001_bankrec_download', url);
	//	}
	//	bUpdate = true;
	//}
	
	// update the schedule
	if (load_record.getFieldValue('custrecord_bl001_enable_schedule')=='T'){
		var freq = load_record.getFieldValue('custrecord_bl001_schedule_frequency');
		var dnow = new Date();
		switch (freq){
		case CONST_FREQ_NIGHTLY: //'Nightly':
			dnow.setHours(23, 0);
			load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			break;
		case CONST_FREQ_FOURHOURS: //'Every 4 Hours':
			dnow.setHours(dnow.getHours()+4);
			load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			break;
		case CONST_FREQ_TWOHOURS: //'Every 2 Hours':
			dnow.setHours(dnow.getHours()+2);
			load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			break;
		case CONST_FREQ_HOURLY: //'Hourly':
			dnow.setHours(dnow.getHours()+1);
			load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			break;
		case CONST_FREQ_TIME: // Daily at a Specific Time
			var at_time = load_record.getFieldValue('custrecord_bl001_schedule_runtime');
			if (!at_time)at_time='';
			// there was no time specified... make it top of current hour tomorrow
			if (at_time.length==0){
				dnow.setMinutes(0);
				dnow.setSeconds(0);
				dnow.setDate(dnow.getDate()+1);
				load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			}else{
				var aAMPM = at_time.split(' ');
				var ampm = aAMPM[1];
				var aTime = aAMPM[0].split(':');
				var new_hour = aTime[0];
				if (ampm == 'pm'){
					new_hour = parseInt(new_hour) + parseInt(12);
				}
				dnow.setHours(new_hour);
				dnow.setMinutes(aTime[1]);
				dnow.setSeconds(0);
				dnow.setDate(dnow.getDate()+1);
				load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			}
			break;
		case CONST_FREQ_30MIN: //30 minutes  // set 5 minutes earlier so the scheduler doesn't just miss it
			dnow.setMinutes(dnow.getMinutes()+20);
			load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			break;
		case CONST_FREQ_15MIN: //'15 minutes  // set 5 minutes earlier so the scheduler doesn't just miss it
			dnow.setMinutes(dnow.getMinutes()+10);
			load_record.setDateTimeValue('custrecord_bl001_schedule_next_run', nlapiDateToString(dnow, 'datetimetz'),5);
			break;
		default:
			break;
		}
	}
	
	
	if (bUpdate)nlapiSubmitRecord(load_record, false, true);
	
	return;
}
function bl001_sendemail(is_error, subject, text)
{
	//nlapiLogExecution('AUDIT', 'sendemail g_Email|g_Email_error_only|is_error', subject + '|' + g_Email + '|' + g_Email_error_only + '|' + is_error);
	if (!g_Email) return;
	if (g_Email.length == 0) return;
	if (is_error == false && bl_noempty(g_Email_error_only,'T') == 'T') return;
	
	try{
		nlapiSendEmail(nlapiGetContext().getUser(), g_Email, subject, text);	
	}
	catch(e){
		nlapiLogExecution('ERROR', 'unable to send mail', g_Email + ':' + subject + ':' + text);
	}
	return;
}
// create a timestring to append to the end of the status
function bl_nowtimestring()
{
	/*
	var currentTime = new Date();
	var dtpart = (parseInt(currentTime.getMonth()) + parseInt(1)) + '/' + currentTime.getDate() + '/' + currentTime.getFullYear();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();
	if (minutes < 10){
		minutes = "0" + minutes;
	}
	var suff = '';
	if(hours > 11){
		if (hours>12){
			hours = parseInt(hours)-parseInt(12);	
		}
		suff = ' pm';
	} else {
		suff = ' am';
	}	
	return dtpart + " " + hours + ":" + minutes + suff;
	*/
	return nlapiDateToString(local_now(), 'datetime');
	
}
// return true if the NS account type or Blackline account type is a P&L account
function bl001_isIncomeExpenseAccount(account_type)
{
    // define constants for the account types
    // balance sheet accounts
	/*
	var ACCOUNT_TYPE_BANK = "Bank";
	var ACCOUNT_TYPE_AR = "Accounts Receivable";
	var ACCOUNT_TYPE_OCA = "Other Current Asset";
	var ACCOUNT_TYPE_FA = "Fixed Asset";
	var ACCOUNT_TYPE_OA = "Other Asset";
	var ACCOUNT_TYPE_AP = "Accounts Payable";
	var ACCOUNT_TYPE_CC = "Credit Card";
	var ACCOUNT_TYPE_OCL = "Other Current Liability";
	var ACCOUNT_TYPE_LTL = "Long Term Liability";
	var ACCOUNT_TYPE_EQ = "Equity";
	var ACCOUNT_TYPE_DR = "Deferred Revenue";
	var ACCOUNT_TYPE_DE = "Deferred Expense";
	var ACCOUNT_TYPE_UAR = "Unbilled Receivable";
	*/
	// p&l accounts
	/*
	var ACCOUNT_TYPE_INC = "Income";
	var ACCOUNT_TYPE_CGS = "Cost of Goods Sold";
	var ACCOUNT_TYPE_EXP = "Expense";
	var ACCOUNT_TYPE_OI = "Other Income";
	var ACCOUNT_TYPE_OE = "Other Expense";
	
	
	
var typeToCategoryMap = {
        'AcctPay': {
            'category': 'LIABILITIES & EQUITY',
            'subcategory': 'Current Liabilities'
        },
        'AcctRec': {
            'category': 'ASSETS',
            'subcategory': 'Current Assets'
        },
        'Bank': {
            'category': 'ASSETS',
            'subcategory': 'Current Assets'
        },
        'COGS': {
            'category': 'EXPENSE',
            'subcategory': 'Cost Of Sales'
        },
        'CredCard': {
            'category': 'LIABILITIES & EQUITY',
            'subcategory': 'Current Liabilities'
        },
        'DeferExpense': {
            'category': 'ASSETS',
            'subcategory': 'Current Assets'
        },
        'DeferRevenue': {
            'category': 'LIABILITIES & EQUITY',
            'subcategory': 'Current Liabilities'
        },
        'Equity': {
            'category': 'LIABILITIES & EQUITY',
            'subcategory': 'Equity'
        },
        'Expense': {
            'category': 'EXPENSE',
            'subcategory': 'Expense'
        },
        'FixedAsset': {
            'category': 'ASSETS',
            'subcategory': 'Fixed Assets'
        },
        'Income': {
            'category': 'INCOME',
            'subcategory': 'Income'
        },
        'LongTermLiab': {
            'category': 'LIABILITIES & EQUITY',
            'subcategory': 'Long Term Liabilities'
        },
        'OthAsset': {
            'category': 'ASSETS',
            'subcategory': 'Other Assets'
        },
        'OthCurrAsset': {
            'category': 'ASSETS',
            'subcategory': 'Current Assets'
        },
        'OthCurrLiab': {
            'category': 'LIABILITIES & EQUITY',
            'subcategory': 'Current Liabilities'
        },
        'OthExpense': {
            'category': 'OTHER EXPENSE',
            'subcategory': 'Other Expense'
        },
        'OthIncome': {
            'category': 'OTHER INCOME',
            'subcategory': 'Other Income'
        },
        'UnbilledRec': {
            'category': 'ASSETS',
            'subcategory': 'Current Assets'
        }	
	*/
	var pnl = "|Income|Cost of Goods Sold|Expense|Other Income|Other Expense|Revenue|COGS|OthExpense|OthIncome|";
	if (pnl.indexOf('|'+account_type+'|')>=0)
		{
		return true;
		}	
	return false;
}
// return based on Blackline account type
function bl001_isBalanceSheetAccount(account_type){
	var lll = "|Asset|Liability|Equity|";
	if (lll.indexOf('|'+account_type+'|')>=0)
		{
		return true;
		}	
	return false;
}
//return based on Blackline account type
function bl001_isAssetAccount(account_type){
	var lll = "|Asset|";
	if (lll.indexOf('|'+account_type+'|')>=0)
		{
		return true;
		}	
	return false;
}
//return based on Blackline account type
function bl001_isLiabEquityAccount(account_type){
	var lll = "|Liability|Equity|";
	if (lll.indexOf('|'+account_type+'|')>=0)
		{
		return true;
		}	
	return false;
}

// convert NetSuite account type to Blackline account type
//Asset, Equity, Expense, Liability, Revenue
function bl001_translate_accounttype(account_type){
	var rev = "|Income|Other Income|OthIncome|";
	if (rev.indexOf('|'+account_type+'|')>=0)
		{
		return 'Revenue';
		}	
	var exp = "|Cost of Goods Sold|Expense|Other Expense|OthExpense|COGS|";
	if (exp.indexOf('|'+account_type+'|')>=0)
		{
		return 'Expense';
		}	
	var ass = "|Bank|Accounts Receivable|Other Current Asset|Fixed Asset|Other Asset|Unbilled Receivable|Deferred Expense|AcctRec|Bank|DeferExpense|FixedAsset|OthAsset|OthCurrAsset|UnbilledRec|";
	if (ass.indexOf('|'+account_type+'|')>=0)
		{
		return 'Asset';
		}	
	var liab = "|Accounts Payable|Credit Card|Other Current Liability|Long Term Liability|Deferred Revenue|AcctPay|CredCard|DeferRevenue|LongTermLiab|OthCurrLiab|";
	if (liab.indexOf('|'+account_type+'|')>=0)
		{
		return 'Liability';
		}	
	var eq = "|Equity|";
	if (eq.indexOf('|'+account_type+'|')>=0)
		{
		return 'Equity';
		}	
	
	throw(nlapiCreateError("INVALID_TRANSLATE_TYPE", account_type + " is not recognized."));
	
	return '';
}
// this array is to lookup the ISO code based on the currency ID
function bl001_currency_list()
{
    this.list = new Array();		// the ISO symbol for the currency
    this.listname = new Array();		// the ISO symbol for the currency lookup by name
    this.keys = new Array();		// list of keys
    this.results = null;			// the results of the search
    
    this.getISOsymbol = function(key, default_val)
    {
        var strKey = '_' + key;
        
        if ((strKey in this.list))
        {
            return this.list[strKey];
        }
        
    	return default_val;
    };
    this.getIdByName = function(key, default_val)
    {
        var strKey = '_' + key;
        
        if ((strKey in this.listname))
        {
            return this.listname[strKey];
        }
        
    	return default_val;
    };
        
    this.load = function()
    {
    	var ret_val = 0;
    	
        // fetch currency list
        var columns = new Array();
        columns[0] = new nlobjSearchColumn('symbol');
        columns[1] = new nlobjSearchColumn('name');
        this.results = nlapiSearchRecord('currency', null, null, columns);
        
        ret_val = this.process(this.results);
        
        return ret_val;
       	
    };
    this.process = function(results)
    {
        // loop records and add them to the internal arrays
        var rec_len = 0;
        if (results)
        {
            if ( results.length > 0)
            {
                rec_len = results.length;
                //nlapiLogExecution('DEBUG', 'bl001_currency_list.results.length', rec_len);
                for (var i=0;i<rec_len;i++)
                {
                    var result = results[i];
                    var curr_id = result.getId();
                    var curr_symbol = result.getValue('symbol');
                    var curr_name   = result.getValue('name');
                    
                    this.add(curr_id, curr_symbol);
                    this.addname(curr_name, curr_id);
                    
                };
            };
         }   
        return rec_len;
    };
    
    this.add = function(key, value)
    {
    	
        // only add this item if it doesn't exist in the collection
        var strKey = '_' + key;
        
        if (!(strKey in this.list))
        {
            this.keys[this.keys.length] = key;
            
            this.list[strKey] = value;
        };
        
    };
    this.addname = function(key, value)
    {
    	
        // only add this item if it doesn't exist in the collection
        var strKey = '_' + key;
        
        if (!(strKey in this.listname))
        {
            this.listname[strKey] = value;
        };
        
    };
    
    
}
//this represents an individual row that will be output with the account export file
// it is used in the collection below
function bl001_account_row()	
{
	// key = row_sub + '|' + row_account + '|' + row_dept + '|' + row_loc + '|' + row_class;
	// but, keys 1, 3, 4, 5 can be switched around; account is always #2
	this.key = "";
	this.extendedkey = ""; // if the user defined extra fields, use them
	
	this.sub_id = "";		// also keep the original values; once we resequence the keys, these are harder to figure out again
	this.account_id = "";
	this.dept_id = "";
	this.loc_id = "";
	this.class_id = "";		// end original values
	
	this.name = "";
	this.acctnumber = "";
	this.accounttype = "";		// the ns account type translated to the BL type
	this.nsaccounttype = "";	// hold the native account type
	this.activityinperiod = false;
	this.inactive = '';
	this.functionalcurrency = "";
	this.accountcurrency = "";
	this.ratetype = "";				// current, average, historical
	this.blacklinetype = "";	// financial statement column in the account export file
	
	this.fix_exchangerate = false;	// for accounts that need an exchange rate applied after the results are built
	
	this.accountopeningbalance = 0;					// the first pass, we have the opening balances
	this.accountperiodactivity = 0;					// the second pass, we have the period activity amounts
	this.accountclosingbalance = 0;					// the third pass, we have the closing balances
	
	this.functionalopeningbalance = 0;
	this.functionalperiodactivity = 0;
	this.functionalclosingbalance = 0;
	
	this.reportingopeningbalance = 0;
	this.reportingperiodactivity = 0;				// the 2nd pass, we have the p&l translated
	this.reportingclosingbalance = 0;				// the 3rd time through, we have final, ending balance sheet translated
	
	this.add = function(account_amount, functional_amount, reporting_amount, open_period_or_close)
	{
		if (open_period_or_close == 1)
			{
				this.accountopeningbalance += parseFloat(account_amount);
				this.functionalopeningbalance += parseFloat(functional_amount);
				this.reportingopeningbalance += parseFloat(reporting_amount);
			}
		else if (open_period_or_close == 2)
			{
				this.accountperiodactivity += parseFloat(account_amount);
				this.functionalperiodactivity += parseFloat(functional_amount);
				this.reportingperiodactivity += parseFloat(reporting_amount);
				this.activityinperiod = true;
			}
		else if (open_period_or_close == 3)
			{
				this.accountclosingbalance += parseFloat(account_amount);
				this.functionalclosingbalance += parseFloat(functional_amount);
				this.reportingclosingbalance += parseFloat(reporting_amount);
				//nlapiLogExecution("AUDIT", "account_row.add "+this.key, this.accountclosingbalance+'|'+this.functionalclosingbalance+'|'+this.reportingclosingbalance);
			}
	};	
}



function bl001_credentials()
{
	this.ws_url = "";							// web service to fetch balances
	this.ws_user = "";							// web service to fetch balances
	this.ws_pw = "";							// web service to fetch balances
	this.ws_role = "3";

    this.account = g_company_settings.account;
    this.email = g_connector_settings.ws_user;
    this.password = encode_pass(g_connector_settings.ws_pw);
    //this.password = encodeURIComponent(g_connector_settings.ws_pw); zQU7p6A%25r%5B zQU7p6A%r[
    this.role = g_connector_settings.ws_role;    
    this.wsurl = g_connector_settings.ws_url;
    /*
    this.wsurl = 'https://webservices.na1.netsuite.com/services/NetSuitePort_2013_2';
    */
}
function encode_pass(inp_pass)
{
	return inp_pass.split('%').join('%25').split('&').join('&amp;').split('>').join('&gt;').split('<').join('&lt;').split('[').join('%5B').split(']').join('%5D');
}

//Create the XML string for the SOAP post
function xml_getPostingTransactionSummary(pageIndex, hide_sub, hide_location, hide_class, hide_department, single_sub_filter)
{
	//nlapiLogExecution('DEBUG', 'xml_getPostingTransactionSummary page', pageIndex);
	var cred = new bl001_credentials();
	var xml = '<soap:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' + 
    '<soap:Header>'+
        '<passport xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<email xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+cred.email+'</email>'+
            '<password xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+cred.password+'</password>'+
            '<account xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+cred.account+'</account>'+
            '<role internalId="'+cred.role+'" xmlns="urn:core_2013_1.platform.webservices.netsuite.com"/>'+
        '</passport>'+
        '<preferences xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<warningAsError>false</warningAsError>'+
        '</preferences>'+
    '</soap:Header>'+
    '<soap:Body>'+
    	'<getPostingTransactionSummary>'+
		    '<fields>'+
		    	'<period>true</period>'+
		    	'<account>true</account>';
		    	if (!hide_sub){
		    	xml += '<subsidiary>true</subsidiary>';
		    	}
				if (!hide_location){
		    	xml += '<location>true</location>';
				}
				if (!hide_class){
		    	xml += '<class>true</class>';
				}
				if (!hide_department){
		    	xml += '<department>true</department>';
				}
		    xml += '</fields>'+
		    '<filters> '; 	    	//'<period xmlns="urn:core_2013_2.platform.webservices.netsuite.com">'+'<recordRef type="accountingPeriod" internalId="17"/>'+'</period>'+
		    if (single_sub_filter){
		    	if (single_sub_filter.length>0){
			    	xml += '<subsidiary xmlns="urn:core_2013_2.platform.webservices.netsuite.com">'+
			    		'<recordRef type="subsidiary" internalId="' + single_sub_filter + '"/>'+
			    	'</subsidiary>';
		    	}
		    }
		    xml += '</filters>'+
		    '<pageIndex>'+pageIndex+'</pageIndex>'+  
		    '</getPostingTransactionSummary>'+     
    '</soap:Body>'+
    '</soap:Envelope>';
	return xml;
}

function xml_getConsolidatedExchangeRate(period_id, parent_sub_id)
{
	var cred = new bl001_credentials();
	return '<soap:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' + 
    '<soap:Header>'+
        '<passport xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<email xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+cred.email+'</email>'+
            '<password xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+cred.password+'</password>'+
            '<account xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+cred.account+'</account>'+
            '<role internalId="'+cred.role+'" xmlns="urn:core_2013_1.platform.webservices.netsuite.com"/>'+
        '</passport>'+
        '<preferences xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<warningAsError>false</warningAsError>'+
        '</preferences>'+
    '</soap:Header>'+
    '<soap:Body>'+
		'<getConsolidatedExchangeRate>'+
	        '<consolidatedExchangeRateFilter>'+    
	           '<period internalId="'+period_id+'" />'+    
	           '<toSubsidiary internalId="'+parent_sub_id+'" />'+
	        '</consolidatedExchangeRateFilter>'+  
         '</getConsolidatedExchangeRate>'+ 
      '</soap:Body>'+
   '</soap:Envelope>';


}

function xml_testws(sWS_URL, sWS_User, sWS_Pw, sWS_Role)
{
	sWS_Role = bl_noempty(sWS_Role, '3');
	
	var xml = '<soap:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' + 
    '<soap:Header>'+
        '<passport xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<email xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+sWS_User+'</email>'+
            '<password xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+encode_pass(sWS_Pw)+'</password>'+
            '<account xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+g_company_settings.account+'</account>'+
            '<role internalId="'+sWS_Role+'" xmlns="urn:core_2013_1.platform.webservices.netsuite.com"/>'+
        '</passport>'+
        '<preferences xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<warningAsError>false</warningAsError>'+
        '</preferences>'+
    '</soap:Header>'+
    '<soap:Body>'+
    	'<getPostingTransactionSummary>'+
		    '<fields>'+
		    	'<period>true</period>'+
		    	'<account>true</account>'+
		    '</fields>'+
		    '<filters> '+
		    	'<period xmlns="urn:core_2013_2.platform.webservices.netsuite.com">'+
		    		'<recordRef type="accountingPeriod" internalId="1"/>'+
		    	'</period>'+
		    	'<subsidiary xmlns="urn:core_2013_2.platform.webservices.netsuite.com">'+
		    		'<recordRef type="subsidiary" internalId="1"/>'+
		    	'</subsidiary>'+
		    '</filters>'+
		    '<pageIndex>1</pageIndex>'+  
		    '</getPostingTransactionSummary>'+     
    '</soap:Body>'+
    '</soap:Envelope>';
	return xml;
	
}

function xml_test_exchws(sWS_URL, sWS_User, sWS_Pw, sWS_Role, period_id)
{
	sWS_Role = bl_noempty(sWS_Role, '3');
	
	return '<soap:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' + 
    '<soap:Header>'+
        '<passport xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<email xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+sWS_User+'</email>'+
            '<password xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+encode_pass(sWS_Pw) + '</password>'+
            '<account xmlns="urn:core_2013_1.platform.webservices.netsuite.com">'+g_company_settings.account+'</account>'+
            '<role internalId="'+sWS_Role+'" xmlns="urn:core_2013_1.platform.webservices.netsuite.com"/>'+
        '</passport>'+
        '<preferences xmlns="urn:messages_2013_1.platform.webservices.netsuite.com">'+
            '<warningAsError>false</warningAsError>'+
        '</preferences>'+
    '</soap:Header>'+
    '<soap:Body>'+
		'<getConsolidatedExchangeRate>'+
	        '<consolidatedExchangeRateFilter>'+    
	           '<period internalId="'+period_id+'" />'+
	           '<toSubsidiary internalId="1" />'+
	        '</consolidatedExchangeRateFilter>'+  
         '</getConsolidatedExchangeRate>'+ 
      '</soap:Body>'+
   '</soap:Envelope>';
}

function call_ws(xml, soap_action, sUrl){
	
	var url = '';
	if(!sUrl){
		var cred = new bl001_credentials();
    	//nlapiLogExecution('DEBUG', 'cred', cred.wsurl);
    	//WS Endpoint              
    	url = cred.wsurl;
	}else{
		url = sUrl;
	}
	
    //Setting up Headers 
    var headers = new Array();
    headers['User-Agent-x'] = 'SuiteScript-Call';
    //headers['Authorization'] = 'NLAuth nlauth_account='+cred.account+', nlauth_email='+cred.email+', nlauth_signature='+cred.password+', nlauth_role='+cred.role;
    headers['Content-Type'] = 'text/xml';
    headers['SOAPAction'] = soap_action;
    
    var resp = null;
    
    if (xml)
    {
    	// blindly re-try upon error
    	try{
    		resp = nlapiRequestURL( url, xml , headers );
    	}catch(e){
    		resp = nlapiRequestURL( url, xml , headers );
    	}
        
    } else 
    {
    	resp = nlapiRequestURL( url, null , headers );
    }
    
    return resp.getBody();
    
}

//the collection of account rows built from the web service
function bl001_account_list()
{
    this.list = new Array();		// collection of bl001_account_row objects
    this.keys = new Array();		// list of keys 

    this.sub_list_retainedearnings = new Array();		// collection of subsidiary to hold retained earnings
    this.sub_keys = new Array();
    
    this.save_search = bl001_default_account_savedsearch();  // the default saved search to use for Bank 
    
    this.key1 = "Subsidiary";						 // the default sequence of the keys
    this.key2 = "Account";
    this.key3 = "Department";
    this.key4 = "Location";
    this.key5 = "Class";
    
    this.export_type = null;						// this is either CONST_ACCOUNT or CONST_MULTICURR
    
    this.currency_adj_sub = "";						// this is used if the subsidiary is null in the recordset which we use if not oneworld
    
    this.preserve_account_currency = false;			// set to true to export multi-currency balances; false we'll sum the reporting/functional balance and ignore the account balance
    
    this.accountbalance_list = new Array();			// hold the list of accounts that we keep balances for
    this.balancecount = 0;
    
    this.sublist = null;					// load the subs so we can lookup the currency
    this.subcount = 0;
    
    this.sub_exchangerate_list = new Array();	// this contains a list of subs and for each ratetype (avg, curr, hist), it keeps the functional  +reporting amounts so we can recompute the rate
    this.sub_exchangeratecount = 0;				// each element contains another array with "AVG", "CURR" and "HIST" as the keys
    											// which contains an object with functional and reporting properties
    this.department_list = null;			// lookup lists for ID/Names
    this.class_list = null;
    this.location_list = null;
    this.account_list = null;				// account list = name|type
    this.exchange_list = null;				// consolidated exchange rates
    this.reporting_sub = null;				// reporting sub for consolidated exchange rate
	
	this.donotdeletetempfiles = false;				// in debug mode, we can leave the temp files

	/*
    // when final account balances are added to the array, keep track of the exchange rate conversions in aggregate
    this.add_exchangerate = function(row_sub, row_ratetype, row_amt_funct, row_amt_rep)
    {
    	this.sub_exchangeratecount += 1;
    	
    	var strKey = '_' + row_sub;
    	//nlapiLogExecution('DEBUG', 'add sub key', strKey + ' * ' + row_ratetype + ' * ' + row_amt_funct + ' * ' + row_amt_rep);
    	var sums = null;
    	if (!(strKey in this.sub_exchangerate_list)){
    		sums = [];
    		sums["AVERAGE"] = {functional:0, reporting:0};
    		sums["CURRENT"] = {functional:0, reporting:0};
    		sums["HISTORICAL"] = {functional:0, reporting:0};
    	}else{
    		sums = this.sub_exchangerate_list[strKey];
    	}
		var rec = sums[row_ratetype];
		if (rec){
			rec.functional += Math.abs(parseFloat(row_amt_funct));
			rec.reporting += Math.abs(parseFloat(row_amt_rep));
			sums[row_ratetype] = rec;
			this.sub_exchangerate_list[strKey] = sums;
		}
    };
    // loop through the results and fix the rates
    this.fix_exchangerates = function(){
    	//nlapiLogExecution('DEBUG', 'fix_exchangerates starting #keys', this.keys.length);
    	for(var key in this.list){
    		var row = this.list[key];
    		//nlapiLogExecution('DEBUG', 'key + fix_exchangerate', key + ' * ' + row.fix_exchangerate);
    		if (row.fix_exchangerate){
    			var row_sub = row.sub_id;
    			var strKey = '_'+row_sub;
    			//nlapiLogExecution('DEBUG', 'strKey', strKey);
    			if (strKey in this.sub_exchangerate_list){
    				
    				var row_type = row.ratetype;
    				var sums = this.sub_exchangerate_list[strKey];
    				var rec = sums[row_type];
    				var rate = 0;
    				if (parseFloat(rec.functional) != 0 ){
    					rate = parseFloat(rec.reporting)/parseFloat(rec.functional);
    				}

    				nlapiLogExecution('DEBUG', 'fix_exchangerates'+strKey, rate);

    				row.reportingopeningbalance = parseFloat(row.functionalopeningbalance) * parseFloat(rate);
    				row.reportingperiodactivity = parseFloat(row.functionalperiodactivity) * parseFloat(rate);
    				row.reportingclosingbalance = parseFloat(row.functionalclosingbalance) * parseFloat(rate);
    				
    			}
    			
    		}
    	}
    };
	this.load_multicurr = function(period_end_date, multicurr_account_list, multicurr_sub_list){
		nlapiLogExecution('DEBUG', 'load_multicurr() starting', period_end_date+'|'+multicurr_account_list+'|'+multicurr_sub_list);
		var new_filters = new Array();
		new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'onorbefore', period_end_date);
		new_filters[new_filters.length] = new nlobjSearchFilter('account', null, 'anyof', multicurr_account_list.split(','));
		var results = null;
	  	try
	  	{
			// this defines what type of record to load
			results = nlapiSearchRecord('transaction', this.save_search, new_filters, null);
			nlapiLogExecution('DEBUG', 'load_multicurr results.length', results.length);
	  	} catch (e)
	  	{
	  		throw nlapiCreateError("99", "Unable to run multi-currency balance search");
	  		return;
	  	}
  	
      // loop records and add them to the internal arrays
      var rec_len = 0;
      if (results)
      {
          if ( results.length > 0)
          {
          	rec_len = results.length;
          	for (var i=0; i<rec_len; i++){
          		var result = results[i];
          		var cols = result.getAllColumns();
          		//NVL({subsidiary.internalid},'') || '|' || NVL({account.internalid},'') || '|' || NVL({department.internalid},'') || '|' || NVL({location.internalid},'') || '|' || NVL({class.internalid},'') || '|' || NVL({currency},'')
          		var _id = result.getValue(cols[3]);	// key/sortcolumn
          		var _bal = result.getValue(cols[0]); 	// ending balance
          		var _name = '|' + _bal;
              	this.add_mc(_id, _name);
          	}
          }
        }
    };
	this.add_mc = function(_id, _name)
	{
		var key = _id;
	    var strKey = '_' + key;
	    if (!(strKey in this.mc_list))
	    {
		    // only add this item if it doesn't exist in the collection
	        this.mc_keys[this.keys.length] = key;
	        this.mc_list[strKey] = _name;
	    }else{
	    	// add the new balance to the existing row
	    	var bal = parseFloat(this.balance(_id)) + parseFloat(bl_noempty(_name.split('|')[1],0));
	    	_name = '|' + bal;
	    	this.list[strKey] = _name;
	    }
	};
	this.balance = function(key)  // return account type for account list
	{
	    var strKey = '_' + key;
	    if (!(strKey in this.mc_list))
	    {
	        return "";
	    } else
	    {
	        return bl_noempty(this.mc_list[strKey].split('|')[1],0) ;
	    };
	};
    */
    this.load_subs = function(){
		this.sublist = new bl001_subsidiarylist();
	    this.subcount = this.sublist.load(CONST_ENTITY_KEY_SUB);
    };
    this.sub_curr = function(sub_id)
    {
   		if (!g_connector_settings.bOneWorld){
    		return g_company_settings.base_currency.id;
    	}else{
	    	var strKey = '_'+sub_id;
	    	if (strKey in this.sublist.list){
	    		var sub = this.sublist.list[strKey];
	    		return sub.currency;
	    	}
    	}
    	return "";
    };
    /*
    this.use_balance = function(account_id){		// return true/false -> does this account use balances
    	var strKey = '_'+account_id;
    	if (strKey in this.accountbalance_list){
    		return true;
    	}else{
    		return false;
    	}
    };
    this.load_accountbalance = function()
    {
    	var results = nlapiSearchRecord('customrecord_bl001_connector_accounts', null, null, [new nlobjSearchColumn('custrecord_bl001_account')]);
    	if (results){
    		if (results.length>0){
    			var rlen = results.length;
    			this.balancecount = rlen;
    			for (var i=0; i<rlen; i++){
    				var account_id = results[i].getValue('custrecord_bl001_account');
    				var strKey = '_'+account_id;
    				if (!(strKey in this.accountbalance_list)){
    					this.accountbalance_list[strKey] = account_id;
    				}
    			}
    		}
    	}
    };
    */
    // create the key value from the inputs
    this.key = function(row_sub, row_account, row_dept, row_loc, row_class, row_extendedkey, row_currency)
    {
    	// this creates a key in the order we selected on the script parameters
    	var key1 = this.pickkey(this.key1, row_sub, row_account, row_dept, row_loc, row_class);    	
    	var key2 = this.pickkey(this.key2, row_sub, row_account, row_dept, row_loc, row_class);
    	var key3 = this.pickkey(this.key3, row_sub, row_account, row_dept, row_loc, row_class);
    	var key4 = this.pickkey(this.key4, row_sub, row_account, row_dept, row_loc, row_class);
    	var key5 = this.pickkey(this.key5, row_sub, row_account, row_dept, row_loc, row_class);
    	
    	// for final cta, we don't have currency
    	if (!row_extendedkey)
    		{
    		row_extendedkey="";
    		//nlapiLogExecution('DEBUG', 'row_extendedkey', row_extendedkey);
    		}
    	if (row_extendedkey.length>0){
    		row_extendedkey = '|' + row_extendedkey;
    	}
    	if (row_currency)
    	{
    		if (row_currency.length>0){
    			row_currency = '|' + row_currency;
    		}
    	} else {
    		row_currency = "";
    	}
    	//nlapiLogExecution('DEBUG', 'returnkey', key1 + '|' + key2 + '|' + key3 + '|' + key4 + '|' + key5 + row_extendedkey + row_currency);
    	if (this.preserve_account_currency){
    		return key1 + '|' + key2 + '|' + key3 + '|' + key4 + '|' + key5 + row_extendedkey + row_currency;
    	} else {
    		return key1 + '|' + key2 + '|' + key3 + '|' + key4 + '|' + key5 + row_extendedkey;
    	}
    };
    // based on the selected key field, return the value for the selected position
    this.pickkey = function(key_type, row_sub, row_account, row_dept, row_loc, row_class)
    {
    	//nlapiLogExecution('DEBUG', 'key_type', key_type+row_sub+ row_account+ row_dept+ row_loc+ row_class);
    	
    	var retval = "";
    	
    	switch (key_type)
    	{
    	case CONST_ENTITY_KEY_SUB: //"2": //"Subsidiary":				// the field is returned as the key frm the list customlist_bl001_account_key_field
    		retval = row_sub;					// except for "Account" which doesn't come through the script parameter; account is hardcoded into position #2
    		break;
    	case "Subsidiary":
    		retval = row_sub;
    		break;    		
    	case "Account":
    		retval = row_account;
    		break;
    	case CONST_ENTITY_KEY_DEP: //"3": //"Department":
    		retval = row_dept;
    		break;
    	case "Department":
    		retval = row_dept;
    		break;
    	case CONST_ENTITY_KEY_LOC: //"4": //"Location":
    		retval = row_loc;
    		break;
    	case "Location":
    		retval = row_loc;
    		break;
    	case CONST_ENTITY_KEY_CLA: //"5": //"Class":
    		retval = row_class;
    		break;
    	case "Class":
    		retval = row_class;
    		break;
    	default:
    		retval = "";
    		break;
    	}
    	
    	return retval;
    };
    
    this.count = function()
    {
    	return this.keys.length;
    };
    // load the collection with data from the web service
    this.load = function(period_start_date, period_end_date, single_sub_filter, temp_file_id)
    {
    	// the temp file is created on the first running of the scheduled script; with large accounts, it runs out of script processing (too many instructions)
    	// therefore, we save an intermediate file with a JSON string and requeue the script with the file 
    	// the second time through, we read the file and continue processing
    	if (temp_file_id.length==0){
			this.period_list = new bl001_lookuplist('accountingperiod');
	    	// call the web service for all balances and periods and loop through the results and build the array
	    	var rows = this.loadallsummaryrows(single_sub_filter);
	    	
	    	var dPeriodStart = nlapiStringToDate(period_start_date);
	    	var dPeriodEnd = nlapiStringToDate(period_end_date);
	    	
	    	var rlen = rows.length;
	    	nlapiLogExecution('DEBUG', 'rlen', rlen);
	    	
	    	var store_rows = {};	// we will store this array into a file to pickup
	    	for (var r=0; r<rlen; r++){
	    		var row = rows[r];
	    		/*
				row["subsidiary"] = null;
				row["account"] = null;
				row["location"] = null;
				row["class"] = null;
				row["department"] = null;
				row["amount"] = 0;
	    		 */
	    		var amt = bl_noempty(row["amount"],0);
	    		// skip zero rows
	    		if (parseFloat(amt)==0){
	    			continue;
	    		}
	    		var beg_act_end = 0;				//beginning balance (1), current period (2)
	    		var row_period = row["period"];
	    		//nlapiLogExecution('DEBUG', r+'. period startdate', row_period + ' ' + this.period_list.startdate(row_period));
	    		
	    		var d_start_date = nlapiStringToDate(this.period_list.startdate(row_period));
	    		// if the period start is after our end period range, ignore this row
	    		if (d_start_date.getTime() > dPeriodEnd.getTime()){
	    			continue;
	    		}
	    		var d_end_date   = nlapiStringToDate(this.period_list.enddate(row_period));
	    		// if the end of this period is before the period start, this is a beginning balance (beg_act_end==1)
	    		// otherwise it is current period balance (beg_act_end==2) which combined with beginning balance + current = ending balance
	    		if (d_end_date.getTime() < dPeriodStart.getTime()){
	    			beg_act_end = 1;
	    		}else{
	    			beg_act_end = 2;
	    		} 
	    		var key = '_|'+row["subsidiary"] + "|" + row["account"] + "|" + row["location"] + "|" + row["class"] + "|" + row["department"];
	    		//nlapiLogExecution('DEBUG', 'key', key + ' * ' + amt);
	    		if ((key in store_rows)){
	    			var obj = store_rows[key];
	    			if (beg_act_end == 1){
	    				obj.beg = parseFloat(obj.beg) + parseFloat(amt);
	    			}else{
	    				obj.cur = parseFloat(obj.cur) + parseFloat(amt);
	    			}
	    			store_rows[key] = obj;
	    		}else{
	    			var obj = {};
	    			obj.beg = 0;
	    			obj.cur = 0;
	    			if (beg_act_end == 1){
	    				obj.beg = amt;
	    			}else{
	    				obj.cur = amt;
	    			}
	    			store_rows[key] = obj;
	    		}
	    	}
	    	var contents = JSON.stringify(store_rows, replacer);
	    	if (contents){
	    		if (contents.length>0){
	    			nlapiLogExecution('DEBUG', 'contents.length', contents.length);
	    			
	    	        // make sure the folder exists; create it if necessary
	    	        var folder_id = bl001_getfolder("temp");
	    	        //nlapiLogExecution('DEBUG', 'folder_id', folder_id);
	    	    	
	    	        // create the file
	    	        var tempfile = 'tempfile.txt';
	    	        if (this.donotdeletetempfiles){
	    	        	// if we are going to keep the file, give it a unique name
    	    	    	var file_date = new Date();
    	    	    	tempfile = g_Profile_ID + '_' + file_date.getHours() + ''+ file_date.getMinutes() + '_'+ file_date.getDate() + ''+ (file_date.getMonth()+1) + '_' + tempfile; 
	    	        }
	    	    	var et_file = nlapiCreateFile(tempfile, 'PLAINTEXT', contents);
	    	        //var et_file = nlapiCreateFile(file_name.replace('.txt','.csv'), 'CSV', contents);		// this simplifies import into Excel for testing
	    	    	et_file.setFolder(folder_id);
	    	    	
	    	    	// save the file
	    	    	var file_id = nlapiSubmitFile(et_file);
	    	    	
	    	    	//nlapiLogExecution('AUDIT', 'file_id', file_id);
	    	    	
	    	    	// get url
	    	    	var thisfile = nlapiLoadFile(file_id);
	    	    	var url = thisfile.getURL();
	    	    	nlapiLogExecution('AUDIT', 'file_id|getURL', file_id + '|'+ url);
	    	    	
	    	    	// restart the script
	    			bl001_Start_Export(this.export_type, g_Profile_ID, true, file_id);
	    			return -1;
	    		}
	    	}
	    	nlapiLogExecution('DEBUG', 'Nothing to process in contents');
    	}else{
    		
    		nlapiLogExecution('DEBUG', 'process temp_file', temp_file_id + '|'+ period_start_date + '|'+ period_end_date);
    		
			var oFile = nlapiLoadFile(temp_file_id);
			var json_string = oFile.getValue();
			
			// don't delete the temp file if we have opted
			if (!this.donotdeletetempfiles){
				nlapiDeleteFile(temp_file_id);	
			}

	    	this.load_subs();
	    	this.account_list = new bl001_lookuplist('account');
			if (g_company_settings.feature_dept){
				this.department_list = new bl001_lookuplist('department');
			}else{
				this.department_list = new bl001_lookuplist();
			}
			if (g_company_settings.feature_location){
				this.location_list = new bl001_lookuplist('location');
			}else{
				this.location_list = new bl001_lookuplist();
			}
			if (g_company_settings.feature_class){
				this.class_list = new bl001_lookuplist('classification');
			}else{
				this.class_list = new bl001_lookuplist();
			}			
			var this_period = bl001_Get_Accounting_Period(period_end_date, false, false);
			nlapiLogExecution('DEBUG', 'Fetched period '+ this_period.id +' for', period_end_date);
			this.exchange_list = new bl001_exchangerates(this_period.id, this.reporting_sub);
			
			var rows = JSON.parse(json_string, reviver);
			// loop the JSON keys 
			var keys = Object.keys(rows);
			var klen = keys.length;
			for (var i=0; i<klen; i++){
				var field = keys[i];
				//var key = 'a|'+row["subsidiary"] + "|" + row["account"] + "|" + row["location"] + "|" + row["class"] + "|" + row["department"];
				//nlapiLogExecution('DEBUG', 'field', field + ' * ' + rows[field].beg + ' | ' + rows[field].cur);
				var aKeys = field.split('|');
				//var fld_type = (typeof obj_record[field]);
				//nlapiLogExecution('DEBUG', field + ' fld_type', fld_type);
				
				var row = {};
				row["subsidiary"] = aKeys[1];
				row["account"] = this.nonull(aKeys[2]);
				row["location"] = this.nonull(aKeys[3]);
				row["class"] = this.nonull(aKeys[4]);
				row["department"] = this.nonull(aKeys[5]);
	    		
		        var row_type 	     = this.account_list.accounttype(row["account"]); // result.getText('type', 'account', 'group');
		        var row_account_name = this.account_list.name(row["account"]); //result.getText('account', null, 'group');
		        //nlapiLogExecution('DEBUG', row_account_name+' row_type', row_type);
		        var row_acctnum 	 = this.account_list.number(row["account"]); //result.getValue('number', 'account', 'group');
		        var row_currency	 = null; //result.getValue('currency', null, 'group');
		        var row_subcurr 	 = null;
		        if (g_connector_settings.bOneWorld){
		        	row_subcurr = this.sublist.get(row["subsidiary"]).currency; //result.getValue('currency', 'subsidiary', 'group');
		        	if (row_subcurr.length==0){
		        		row_subcurr = g_company_settings.base_currency.id;
		        	}
		        }else{
		        	row_subcurr = g_company_settings.base_currency.id;
		        }
		        row_currency = row_subcurr;
		        var row_ratetype	 = this.account_list.generalratetype(row["account"]); //result.getValue('generalratetype', 'account', 'group');
		        var row_inactive	 = this.account_list.isinactive(row["account"]); //result.getValue('isinactive', 'account', 'group');
		        var row_blacklinetype= this.account_list.export_type(row["account"]); //result.getValue('custrecord_bl001_account_export_type', 'account', 'group');
		        
		        // get the basic keys; assume the start is the account column found above
		        var row_account   = row["account"]; //result.getValue(row_columns[i_account]);					// the account must be this position in the search because it must always be key #2
		        var row_dept 	  = row["department"]; //result.getValue(row_columns[i_dept]);
		        var row_dept_name = this.department_list.name(row_dept); //result.getText(row_columns[i_dept]);
		        var row_loc	 	  = row["location"]; //result.getValue(row_columns[i_loc]);
		        var row_loc_name  = this.location_list.name(row_loc); // result.getText(row_columns[i_loc]);
		        var row_class 	  = row["class"]; // result.getValue(row_columns[i_class]);
		        var row_class_name= this.class_list.name(row_class); // result.getText(row_columns[i_class]);
		        var row_sub 	  = row["subsidiary"]; // result.getValue(row_columns[i_sub]);	// this column may be empty if not-oneworld; therefore, it may also be a custom key of the client defined search
		        var row_sub_name  = this.sublist.get(row_sub).name; // result.getText(row_columns[i_sub]);	
		        if (!row_sub)row_sub='';
		        if (row_sub.length==0){
		        	row_sub = this.currency_adj_sub; // get the default currency_adj_sub
		        }
		        
		        //nlapiLogExecution('DEBUG', 'column name', row_columns[9].getName() + '|' + row_columns[10].getName()+ '|' + row_columns[11].getName()+ '|' + row_columns[12].getName()+ '|' + row_columns[13].getName()+ '|' + row_columns[14].getName());
		        
		        // get the extended keys if applicable
		        var row_extendedkey = "";
		
		        var fxrate = 1;
		        switch(row_ratetype){
		        case "HISTORICAL":
		        	fxrate = this.exchange_list.historicalRate(row_sub);
		        	break;
		        case "AVERAGE":
		        	fxrate = this.exchange_list.averageRate(row_sub);
		        	break;
		        case "CURRENT":
		        	fxrate = this.exchange_list.currentRate(row_sub);
		        	break;
		        }
		        fxrate = bl_noempty(fxrate,1);
		        
		        // process beginning / ending / period balances
		        var open_period_or_close = 0;
				var amt_obj = rows[field];
				var beg_period_amt 		= amt_obj.beg;
				var current_period_amt 	= amt_obj.cur;
				// first process beginning
		        var row_amt_local = beg_period_amt; 
		        var row_amt_funct = beg_period_amt; 
		        var row_amt_rep   = 0; 
		        row_amt_rep = parseFloat(row_amt_funct) * parseFloat(fxrate);
		        
		        // reporting amount is based on consolidated exchange rate
		        //nlapiLogExecution('DEBUG', i+'. Sub:'+row_sub + ' RateType:'+row_ratetype + ' * Acc:' + row_account_name + ' * Period:' + 'BEG' + ' Fx:'+fxrate, row_amt_rep + '|' + row_amt_funct);
		        // if the period is prior to our period start date, we need to add to beginning balance + ending balance
		        open_period_or_close = 1;
		        this.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, false);
		        open_period_or_close = 3;
		        this.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, false);

				// second: process current period
		        var row_amt_local = current_period_amt; 
		        var row_amt_funct = current_period_amt; 
		        var row_amt_rep   = 0; 
		        row_amt_rep = parseFloat(row_amt_funct) * parseFloat(fxrate);
		        // reporting amount is based on consolidated exchange rate
		        //nlapiLogExecution('DEBUG', i+'. Sub:'+row_sub + ' RateType:'+row_ratetype + ' * Acc:' + row_account_name + ' * Period:' + 'CURRENT' + ' Fx:'+fxrate, row_amt_rep + '|' + row_amt_funct);
	        	// if the period is within our period start and end dates, we need to add to period activity + ending balance
	        	open_period_or_close = 2;
	        	this.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, false);
	        	open_period_or_close = 3;
	        	this.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, false);
			}
			return this.keys;
    	}	
	    
    	return -1;
    	
    };
    this.nonull = function(inp){
    	if (inp == 'null'){
    		return null;
    	}
    	return inp;
    };
    
    // load the collection with data from the saved search
    this.reload = function(period_start_date, period_end_date)
    {
    	  var oFile = nlapiLoadFile(fileid);
    	  response.write(oFile.getValue());

    	
    };

    // this function loads the summary rows via the web service for all accounts/periods/subsidiaries
    this.loadallsummaryrows = function(single_sub_filter){
    	var soap_action = 'getPostingTransactionSummary';
    	
    	// determine which fields to load based on what keys we need
    	var hide_sub = true;
    	var hide_location = true;
    	var hide_class = true;
    	var hide_department = true;
    	if (this.key1 == "Subsidiary" || this.key1 == CONST_ENTITY_KEY_SUB 
    	    	 || this.key3 == "Subsidiary" || this.key3 == CONST_ENTITY_KEY_SUB
    	    	 || this.key4 == "Subsidiary" || this.key4 == CONST_ENTITY_KEY_SUB
    	    	 || this.key5 == "Subsidiary" || this.key5 == CONST_ENTITY_KEY_SUB){
    		hide_sub = false;
    	    	}
    	if (this.key1 == "Location" || this.key1 == CONST_ENTITY_KEY_LOC 
    	    	 || this.key3 == "Location" || this.key3 == CONST_ENTITY_KEY_LOC
    	    	 || this.key4 == "Location" || this.key4 == CONST_ENTITY_KEY_LOC
    	    	 || this.key5 == "Location" || this.key5 == CONST_ENTITY_KEY_LOC){
    		hide_location = false;
    	    	}
    	if (this.key1 == "Class" || this.key1 == CONST_ENTITY_KEY_CLA 
    	    	 || this.key3 == "Class" || this.key3 == CONST_ENTITY_KEY_CLA
    	    	 || this.key4 == "Class" || this.key4 == CONST_ENTITY_KEY_CLA
    	    	 || this.key5 == "Class" || this.key5 == CONST_ENTITY_KEY_CLA){
    		hide_class = false;
    	    	}
    	if (this.key1 == "Department" || this.key1 == CONST_ENTITY_KEY_DEP 
    	    	 || this.key3 == "Department" || this.key3 == CONST_ENTITY_KEY_DEP
    	    	 || this.key4 == "Department" || this.key4 == CONST_ENTITY_KEY_DEP
    	    	 || this.key5 == "Department" || this.key5 == CONST_ENTITY_KEY_DEP){
    		hide_department = false;
    	    	}
    	
    	nlapiLogExecution('AUDIT', 'Fetching account fields hide: sub|loc|class|dept from webservice', hide_sub+'|'+hide_location+'|'+hide_class+'|'+hide_department + '|sub:'+single_sub_filter);
    	
    	var cnt = 1;
    	var keep_looking = true;
    	var rows = [];
    	
    	while (keep_looking){
    		
    		// build the request string
    		var str_xml = xml_getPostingTransactionSummary(cnt, hide_sub, hide_location, hide_class, hide_department, single_sub_filter);
    		// fetch the xml
    		var resp_xml = call_ws(str_xml, soap_action);
    		//response.setContentType('XMLDOC');
    		//response.write(resp_xml);
    		//return;
    		var xml = nlapiStringToXML(resp_xml);
    		var nodes = nlapiSelectNodes(xml, "//platformCore:postingTransactionSummary");
    		/*
    		<platformCore:postingTransactionSummaryList>
    		<platformCore:postingTransactionSummary>
    			<platformCore:account internalId="121"/>
    			<platformCore:class internalId="5"/>
    			<platformCore:location internalId="1"/>
    			<platformCore:subsidiary internalId="1"/>
    			<platformCore:amount>35004.91</platformCore:amount>
    		</platformCore:postingTransactionSummary>	 
    		 */
    		var nlen = nodes.length;
    		//nlapiLogExecution('DEBUG', 'nodes.length', nlen);
    		// we don't keep looking if we didn't get the maximum number of records back
    		if (nlen < CONST_ACCOUNT_MAX_RECORDS){
    			keep_looking = false;
    		}
    		
    		// load the rows from the response nodes
    		for (var n=0; n<nlen; n++){
    			var node = nodes[n];
    			//response.write("<HR>"+node.nodeName+"<BR>");
    			var row = {};
    			row["subsidiary"] = null;
    			row["account"] = null;
    			row["location"] = null;
    			row["class"] = null;
    			row["department"] = null;
    			row["period"] = null;
    			row["amount"] = 0;
    			if (node.hasChildNodes()){
    				var nnode = node.firstChild;
    				while (nnode){
    					var fld = nnode.nodeName.split(':')[1];
    					var val = null;
    					if (fld=='amount'){
    						val = nnode.firstChild.nodeValue;
    					}else{
    						val = nnode.attributes.getNamedItem('internalId').value;
    					}
    					row[fld] = val;
    					/*
    					response.write(nnode.nodeName+"<BR>");
    					if (nnode.hasAttributes()){
    						response.write('-has attributes<BR>');
    						var id = nnode.attributes.getNamedItem('internalId').value;
    						if (id){
    							response.write(id+"<BR>");
    						}
    					}
    					*/
    					nnode = nnode.nextSibling;
    				}
    			}
    			// if the period is null, this node is a current balance node
    			// which we will disregard
    			if ( bl_noempty(row["period"],"").length > 0 ){
    				rows[rows.length] = row;	
    			}
    			
    		}
    		
    		// fetch the next page if necessary
    		cnt++;
    		
    		if (cnt > 900){
    			nlapiLogExecution('ERROR', 'Too many rows', cnt);
    			return rows;
    		}
    	}

    	return rows;
    };

    // load data with the saved search for the multi-currency account balances
    this.load_savedsearch = function(period_start_date, period_end_date, account_list, sub_list){
    	
    	if (account_list.length==0){
    		throw(nlapiCreateError("INVALID_PARAMETERS", "For the Multi-currency to run, you must select at least one asset or liability account."));
    		return;
    	}
    	
    	// set a filter on transaction create date before now; help prevent getting out of balance with new transactions
    	var today_date = new Date();	
    	today_date.setMinutes(today_date.getMinutes() - 1);

    	var ret_val = 0;
        
        // fetch the full list through the ending period; closing balance sheet
        open_period_or_close = 3;
        var result_count = this.runsearch(period_start_date, period_end_date, open_period_or_close, today_date, account_list, sub_list);
        ret_val += result_count;

        return ret_val;
       	
    };
    // this function adds the new filters and runs the saved search 
    this.runsearch = function(period_start_date, period_end_date, open_period_or_close, today_date, account_list, sub_list)
    {
    	var ret_val = 0; // return the total # of records
    	
    	nlapiLogExecution('DEBUG', 'Running runsearch|open_period_or_close|period_end_date|account_list|sub_list', this.save_search + '|'+open_period_or_close+'|'+period_end_date+'|'+account_list+'|'+sub_list);
    	
    	// get the column definition from the saved search so we can get the formula when we need to loop
    	var this_search = nlapiLoadSearch('transaction', this.save_search);
    	if (!this_search)return -1;
		var columns = this_search.getColumns();
		var last_sort_val = null; 					// hold the last sort_val as we loop
		var sort_formula = columns[3].getFormula();	// this is the formula for the sort column
		
    	var loop_counter = 0;	// keep track of # of loops to fetch all records
    	var all_done = false;
    	while (all_done==false){
    		
    		var new_filters = new Array();
    		
    		// filter on the multi-curr account list
    		new_filters[new_filters.length] = new nlobjSearchFilter('account', null, 'anyof', account_list.split(','));
    		if (g_connector_settings.bOneWorld){
	    		if (sub_list.length>0){
	    			new_filters[new_filters.length] = new nlobjSearchFilter('subsidiary', null, 'anyof', sub_list.split(','));
	    		}
    		}
    		
    		// add the period filters
    		switch (open_period_or_close){
    		case 1:
    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'before', period_start_date);
    			break;
    		case 2:
    			new_filters[new_filters.length] = new nlobjSearchFilter('startdate', 'accountingperiod', 'onorafter', period_start_date);
    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate',   'accountingperiod', 'onorbefore', period_end_date);
    			break;
    		case 3:
    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'onorbefore', period_end_date);
    			break;
    		default:
    			return -1;
    		}
    		
    		// add the create date filter; try to avoid picking up new transactions
    		//nlapiLogExecution('DEBUG', 'date filter', nlapiDateToString(today_date, 'datetimetz') + ' | ' + nlapiDateToString(today_date));
    		
    		//new_filters[new_filters.length] = new nlobjSearchFilter('datecreated', null, 'onorbefore', bl_fixdate_for_search(nlapiDateToString(today_date, 'datetimetz')));
    		
    		// if we are looping, we add a new filter on the sort column so we don't re-fetch the same rows
    		//var debug_string = "";
    		if (loop_counter>0){
    	        var oFilt = new nlobjSearchFilter('formulanumeric', null, 'equalto', 1);
    	        var new_formula = "case when " + sort_formula + " > '" + last_sort_val + "' then 1 else 0 end"; 
    	        oFilt.setFormula(new_formula);
    	        new_filters[new_filters.length] = oFilt;
    	        //debug_string = new_formula;
    		}
    		
    		// run the search
    		var results = bl_noempty(nlapiSearchRecord('transaction', this.save_search, new_filters, null),{length:0});
    		nlapiLogExecution('DEBUG', 'results.length', results.length);
    		if (results.length==0){
    			if (sub_list.length>0){
    				throw(nlapiCreateError('FILTER_ERROR', 'Make sure the account and subsidiary filter combinations are valid'));
    			}
    		}
    		// summarize the results into the array
    		var this_result_count = this.summarize_results(results, open_period_or_close);
    		ret_val += 	this_result_count;
    		//nlapiLogExecution('DEBUG', open_period_or_close +'.'+loop_counter+' results summarized|filters.len|loop_filter', this_result_count + '|' + new_filters.length + '|' + debug_string);
    		
    		// if the number of results is our maximum, we need get the sort value for our filter when we re-run/loop
    		if (this_result_count == CONST_ACCOUNT_MAX_RECORDS){
    			// get a reference to the last nlobjSearchResult object
    			var final_result = results[CONST_ACCOUNT_MAX_RECORDS-1];
    			var final_cols = final_result.getAllColumns();
    			var sort_col = final_cols[CONST_COL_SORT];
    			// get the sort value from the sort column
    			last_sort_val = final_result.getValue(sort_col);
    		} else {
    			all_done = true;
    		}
    		
    		// loop safety
    		loop_counter += 1;
    		if (loop_counter > CONST_LOOPSAFETY)return -1;
    	}
    	nlapiLogExecution('AUDIT', open_period_or_close +'.'+loop_counter, ret_val + ' records');
    	return ret_val;
    };
    

    this.summarize_results = function(results, open_period_or_close)
    {
        // loop records and add them to the internal arrays
        var rec_len = 0;
        if (results)
        {
            if ( results.length > 0)
            {
                rec_len = results.length;
                // cap records
                if (rec_len>CONST_ACCOUNT_MAX_RECORDS){
                	rec_len = CONST_ACCOUNT_MAX_RECORDS;
                }
                //nlapiLogExecution('DEBUG', 'customsearch_bl001_transaction_summary.results.length', rec_len);
                var curr_col = 0;
                if (rec_len>0){
                    // figure out what column the account is in
                    var result = results[0];                    
                    var row_columns = result.getAllColumns();
                    var c_len = row_columns.length;
                    for (var ci=0; ci<c_len; ci++){
                    	var col = row_columns[ci];
                    	if (col){
                    		if (col.getName() == 'account'){
                            	curr_col = ci;
                    			break;
                    		}
                    	}
                    }
                }
                for (var i=0;i<rec_len;i++)
                {
                    var result = results[i];
                    
                    var row_columns = result.getAllColumns();
                    var c_len = row_columns.length;
                    //nlapiLogExecution('DEBUG', 'row_columns.length', row_columns.length);
                    
                    var row_type 	= result.getText('type', 'account', 'group');
                    var row_account_name=result.getText('account', null, 'group');
                    var row_acctnum = result.getValue('number', 'account', 'group');
                    // currency is in the column preceeding account
                    //var row_currency= result.getValue('currency', null, 'group');
                    var row_subcurr = null;
                    if (g_connector_settings.bOneWorld){
                    	row_subcurr = result.getValue('currency', 'subsidiary', 'group');
                    }else{
                    	row_subcurr = g_company_settings.base_currency.id;
                    }
                    var row_ratetype= result.getValue('generalratetype', 'account', 'group');
                    var row_inactive= result.getValue('isinactive', 'account', 'group');
                    var row_blacklinetype= result.getValue('custrecord_bl001_account_export_type', 'account', 'group');
                    
                    // get the basic keys; assume the start is the account column found above
                    var i_account = curr_col;
                    var i_curr = parseInt(curr_col)-parseInt(1); // currency is in the column preceeding account
                    var i_dept = parseInt(curr_col)+parseInt(1);
                    var i_loc = parseInt(curr_col)+parseInt(2);
                    var i_class = parseInt(curr_col)+parseInt(3);
                    var i_sub = parseInt(curr_col)+parseInt(4);
                    var row_currency= result.getValue(row_columns[i_curr]);
                    if (g_connector_settings.bOneWorld){
                    	row_currency = g_company_settings.currency_list.getIdByName(row_currency, "1");
                    }
                    var row_account = result.getValue(row_columns[i_account]);					// the account must be this position in the search because it must always be key #2
                    var row_dept 	= result.getValue(row_columns[i_dept]);
                    var row_dept_name=result.getText(row_columns[i_dept]);
                    var row_loc	 	= result.getValue(row_columns[i_loc]);
                    var row_loc_name= result.getText(row_columns[i_loc]);
                    var row_class 	= result.getValue(row_columns[i_class]);
                    var row_class_name=result.getText(row_columns[i_class]);
                    var row_sub = '';
                    var row_sub_name = '';
                    if (parseInt(i_sub) < parseInt(c_len)){
                    	row_sub 	= result.getValue(row_columns[i_sub]);	// this column may be empty if not-oneworld; therefore, it may also be a custom key of the client defined search
                    	row_sub_name= result.getText(row_columns[i_sub]);	
                    }
                    if (!row_sub)row_sub='';
                    if (row_sub.length==0){
                    	row_sub = this.currency_adj_sub; // get the default currency_adj_sub
                    }
                    
                    //nlapiLogExecution('DEBUG', 'column name', row_columns[9].getName() + '|' + row_columns[10].getName()+ '|' + row_columns[11].getName()+ '|' + row_columns[12].getName()+ '|' + row_columns[13].getName()+ '|' + row_columns[14].getName());
                    
                    // get the extended keys if applicable
                    var c_len = row_columns.length;
                    var row_extendedkey = "";
                    var i_start = parseInt(curr_col)+parseInt(5);
                    if (c_len > i_start){
                    	for (var nc_i = i_start; nc_i<c_len; nc_i++){
                    		row_extendedkey = row_extendedkey + "|" + result.getValue(row_columns[nc_i]);
                    	}
                    }
                    //nlapiLogExecution('DEBUG', 'row_sub|row_accountj|row_dept|row_loc|row_class', row_sub+'|'+row_account+'|'+row_dept+'|'+row_loc+'|'+row_class+'|'+row_extendedkey); 

                    var row_amt_local=result.getValue(row_columns[CONST_COL_LOCAL]);
                    var row_amt_funct=result.getValue(row_columns[CONST_COL_FUNC]);
                    var row_amt_rep = result.getValue(row_columns[CONST_COL_REPORT]);
                    
                    //nlapiLogExecution('DEBUG', 'row_sub|row_type|row_account|row_account_name|row_dept|row_loc|row_class|row_currency|row_subcurr|row_ratetype|row_amt_local|row_amt_funct', row_sub+'|'+row_type+'|'+row_account+'|'+row_account_name+'|'+row_dept+'|'+row_loc+'|'+row_class+'|'+row_currency+'|'+row_subcurr+'|'+row_ratetype+'|'+row_amt_local+'|'+row_amt_funct+'|' + row_amt_rep); 
                    //nlapiLogExecution('DEBUG', 'ratetype', row_ratetype);
                	//this.add(row_sub, row_type, row_account, row_account_name, row_dept, row_loc, row_class, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close);
                    this.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, false);
                	
                	
                };
            };
         }   
        return rec_len;
    };
    // For Key#1:
    //	return just the ID because BL keeps the entity table normalized
    // For Key#2 (Account):
    //	the ID is just the account number
    // For all others:
	// 		make the key a combination of the internal ID and the name '2090 Accounts Payable [42]'
	// 		if there is a hierarchy, trim the level so they don't take up too much room
    this.make_key = function(internal_id, s_name, iLevel, account_num){
    	if (!internal_id)return '';
    	if (internal_id.length==0)return'';
    	if (!s_name)return internal_id;
    	if (s_name.length==0)return internal_id;
    	// level 1 is just the id
    	if (iLevel==1)return internal_id;
    	// level 2 is the natural account number only; it is the first thing on the front; make sure it is numeric
    	if (iLevel==2){
    		if (account_num){
    			if (account_num.length>0){
    				if (account_num != '- None -'){
    					return account_num;	
    				}
    			}
    		}
    		if (s_name.indexOf(' ')>=0){
    			var aName = s_name.split(' ');
    			var acc_num = aName[0];
    			if (bl_isNonZeroNumber(acc_num)){
    				return acc_num;
    			} else {
    				return internal_id;
    			}
    		} else {
    			return internal_id;
    		}
    	}
    	if (s_name){
    		//if ( s_name.length > (parseInt(50)-parseInt(3)-parseInt((internal_id+'').length))){
    		if ( s_name.length > parseInt(50) ){
		    	if (s_name.indexOf(':')>=0){
		    		var aname = s_name.split(':');
		    		var alen = aname.length;
		    		for (var i=0;i<alen;i++){
		    			var level_name = aname[i];
		    			level_name = level_name.trim();
		    			// don't truncate the last item
		    			if (i<(alen-1)){
			    			if (level_name.length>9){
			    				level_name = level_name.substring(0,8);
			    				aname[i] = level_name;
			    			}
		    			}
		    		}
		    		s_name = aname.join(':');
		    	}
    		}
    	}
    	if (this.isUniqueKey(s_name, internal_id)){
    		return s_name;
    	} else {
    		// now overall trim for the id on the end
    		if ( s_name.length > (parseInt(50)-parseInt(3)-parseInt((internal_id+'').length))){
    			s_name = s_name.substring(0,(parseInt(50)-(internal_id+'').length-parseInt(3)));
    		}
    		return s_name + ' [' + internal_id + ']';
    	}
    };
    
    // create an array to hold associate array where we keep the key and the internal id. If they match, return true; else, return false
    this.unique_keys = new Array();
    // if the key is not unique, we will add the [ID] onto the end
    this.isUniqueKey = function(key, id){
    	var strKey = '_' + key;    	 
    	// if it doesn't exist, add it and return true
        if (!(strKey in this.unique_keys)) {
            this.unique_keys[strKey] = id;
            return true;
        	}
        else {
        	// the key exists; check the id; if it matches, return true
        	var check_id = this.unique_keys[strKey];
        	if (check_id == id){
        		return true;
        	} else {
        		return false;
        	}
        }
    };
    
    // this helper function for this.make_key returns 1 or 3; if the entity_type is used in key#1, we use 1; else 3
    this.isKeyLevel1 = function(entity_type){
    	if (this.key1 == entity_type) {
    		return 1;
    	}
    	return 3;
    };
    
    
    
    // add the row to the collection
//    this.add = function(row_sub, row_type, row_account, row_account_name, row_dept, row_loc, row_class, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close)
    this.add = function(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, fix_exchangerate)
    {
    	
    	// we store the BL type and the NS type
    	var ns_rowtype = row_type;
    	row_type = bl001_translate_accounttype(row_type);
    	
    	// convert the keys into the sequence specified on the front end; the user can pick which key appears in which column, except account which is always key#2
        var k_account = this.make_key(row_account, row_account_name, 2, row_acctnum); // we pass in the row_acctnum so we can use it
        var k_dept = this.make_key(row_dept, row_dept_name, this.isKeyLevel1(CONST_ENTITY_KEY_DEP));
        var k_loc = this.make_key(row_loc, row_loc_name, this.isKeyLevel1(CONST_ENTITY_KEY_LOC));
        var k_class = this.make_key(row_class, row_class_name, this.isKeyLevel1(CONST_ENTITY_KEY_CLA));
        var k_sub = this.make_key(row_sub, row_sub_name, this.isKeyLevel1(CONST_ENTITY_KEY_SUB));
        
        // now remove the "2000" from "2000 Accounts Payable"
        // only if k_account is 2000
        var i_name = row_account_name.indexOf(' ');
        if (i_name>0){
            if (k_account == row_account_name.substring(0, i_name)){
            	row_account_name = row_account_name.substring(i_name+1);
            }
        }
    	
    	// make sure the currency is the last item in the key; it gets removed from the key when we output the row
    	var key = this.key(k_sub, k_account, k_dept, k_loc, k_class, row_extendedkey, row_currency);
    	
        // only add this item if it doesn't exist in the collection
        var strKey = '_' + key;
        
        if (!(strKey in this.list))
        {
            this.keys[this.keys.length] = key;
            //this.values[this.values.length] = sub_name.replace('|', '!') + '|' + key;

            var sub = new bl001_account_row();
            sub.sub_id = row_sub;
            sub.account_id = row_account;
            sub.dept_id = row_dept;
            sub.loc_id = row_loc;
            sub.class_id = row_class;
            sub.extendedkey = row_extendedkey;
            sub.key = key;
            sub.name = row_account_name;
            sub.acctnumber = row_acctnum;
            sub.accounttype = row_type;
            sub.nsaccounttype = ns_rowtype;
            sub.functionalcurrency = row_subcurr;
            sub.accountcurrency = row_currency;
            sub.ratetype = row_ratetype;
            sub.inactive = row_inactive;
            sub.blacklinetype = row_blacklinetype;
            sub.fix_exchangerate = fix_exchangerate;
            sub.add(row_amt_local, row_amt_funct, row_amt_rep, open_period_or_close);
            
            this.list[strKey] = sub;
        } else
    	{
    		var sub = this.list[strKey];
    		sub.add(row_amt_local, row_amt_funct, row_amt_rep, open_period_or_close);
    		//this.list[strKey] = sub;
    	}
        
        //nlapiLogExecution('DEBUG', 'open_period_or_close|fix_exchangerate', open_period_or_close+'|'+fix_exchangerate);
        if (open_period_or_close == 3) // we only need to do this the last pass through; we have all accounts in this one.
        	{
        	//nlapiLogExecution('DEBUG', 'fix_exchangerate', fix_exchangerate);
        	
        	// if this sub is a different currence than the base, we need to
        	// keep the currency exchange rates for the period from sub to parent
        	// we can't access these rates directly; therefore, we will keep tally and reverse into it
        	if (!fix_exchangerate){
        		//nlapiLogExecution('DEBUG','	row_subcurr != g_company_settings.base_currency.id', row_subcurr + ' | ' + g_company_settings.base_currency.id);
        	 
        		/*
        		if (row_subcurr != g_company_settings.base_currency.id){
        			this.add_exchangerate(row_sub, row_ratetype, row_amt_funct, row_amt_rep);
        		}
        		*/
        	}
        	
	        // add to the subsidiary retained earnings list
	        var re_key = null;
	        if (this.preserve_account_currency){
	    		if (row_currency.length==0){
	    			row_currency = g_company_settings.base_currency.id;
	    		}
	        	re_key = '_' + k_sub + '|' + row_currency;
        	} else {
        		re_key = '_' + k_sub;
        	}
	        if (!(re_key in this.sub_list_retainedearnings))
	        	{
	        		if (this.preserve_account_currency){
	        			this.sub_keys[this.sub_keys.length] = k_sub + '|' + row_currency;
	        		} else {
	        			this.sub_keys[this.sub_keys.length] = k_sub;
	        		}
	        		this.sub_list_retainedearnings[re_key] = {local:0,functional:0,reporting:0,key:k_sub,currency:row_currency,subcurr:row_subcurr};
	        	};
        	};
        
    };
    
    this.add_retainedearnings = function(row_sub, row_currency, row_amt_local_closing, row_amt_functional_closing, row_amt_reporting_closing, row_amt_local_period, row_amt_functional_period, row_amt_reporting_period)
    {
    	//nlapiLogExecution('DEBUG', 'RE '+row_sub+' row_amt_functional_closing row_amt_reporting_closing row_amt_functional_period', row_amt_functional_closing +'*'+row_amt_reporting_closing+'*'+ row_amt_functional_period +'*'+row_amt_reporting_period);
    	var re_key = null;
    	if (this.preserve_account_currency){
    		if (row_currency.length==0){
    			row_currency = g_company_settings.base_currency.id;
    		}
    		re_key = '_' + row_sub +'|' + row_currency;
    	} else {
    		re_key = '_' + row_sub;
    	}
    	if (re_key in this.sub_list_retainedearnings)
    		{
    			var sub_re = this.sub_list_retainedearnings[re_key];
    			sub_re.local += (parseFloat(row_amt_local_closing) - parseFloat(row_amt_local_period));
    			sub_re.functional += (parseFloat(row_amt_functional_closing) - parseFloat(row_amt_functional_period));
    			sub_re.reporting += (parseFloat(row_amt_reporting_closing) - parseFloat(row_amt_reporting_period)); 
    		}
    	else 
    		{
    			nlapiLogExecution('ERROR', 're_key not in sub_list_re', re_key);
    		};
    };
    
};



/*
// the collection of account rows
function old_bl001_account_list()
{
    this.list = new Array();		// collection of bl001_account_row objects
    this.keys = new Array();		// list of keys 

    this.sub_list_retainedearnings = new Array();		// collection of subsidiary to hold retained earnings
    this.sub_keys = new Array();
    
    this.custom_search = bl001_default_account_savedsearch();  // the default saved search to use
    
    this.key1 = "Subsidiary";						 // the default sequence of the keys
    this.key2 = "Account";
    this.key3 = "Department";
    this.key4 = "Location";
    this.key5 = "Class";
    
    this.currency_adj_sub = "";						// this is used if the subsidiary is null in the recordset which we use if not oneworld
    
    this.preserve_account_currency = false;			// set to true to export multi-currency balances; false we'll sum the reporting/functional balance and ignore the account balance
    
    this.accountbalance_list = new Array();			// hold the list of accounts that we keep balances for
    this.balancecount = 0;
    
    this.sublist = null;					// load the subs so we can lookup the currency
    this.subcount = 0;
    
    this.sub_exchangerate_list = new Array();	// this contains a list of subs and for each ratetype (avg, curr, hist), it keeps the functional  +reporting amounts so we can recompute the rate
    this.sub_exchangeratecount = 0;				// each element contains another array with "AVG", "CURR" and "HIST" as the keys
    											// which contains an object with functional and reporting properties
    this.department_list = null;			// lookup lists for ID/Names
    this.class_list = null;
    this.location_list = null;
    
    
    // when final account balances are added to the array, keep track of the exchange rate conversions in aggregate
    this.add_exchangerate = function(row_sub, row_ratetype, row_amt_funct, row_amt_rep)
    {
    	this.sub_exchangeratecount += 1;
    	
    	var strKey = '_' + row_sub;
    	//nlapiLogExecution('DEBUG', 'add sub key', strKey + ' * ' + row_ratetype + ' * ' + row_amt_funct + ' * ' + row_amt_rep);
    	var sums = null;
    	if (!(strKey in this.sub_exchangerate_list)){
    		sums = [];
    		sums["AVERAGE"] = {functional:0, reporting:0};
    		sums["CURRENT"] = {functional:0, reporting:0};
    		sums["HISTORICAL"] = {functional:0, reporting:0};
    	}else{
    		sums = this.sub_exchangerate_list[strKey];
    	}
		var rec = sums[row_ratetype];
		if (rec){
			rec.functional += Math.abs(parseFloat(row_amt_funct));
			rec.reporting += Math.abs(parseFloat(row_amt_rep));
			sums[row_ratetype] = rec;
			this.sub_exchangerate_list[strKey] = sums;
		}
    };
    // loop through the results and fix the rates
    this.fix_exchangerates = function(){
    	//nlapiLogExecution('DEBUG', 'fix_exchangerates starting #keys', this.keys.length);
    	for(var key in this.list){
    		var row = this.list[key];
    		//nlapiLogExecution('DEBUG', 'key + fix_exchangerate', key + ' * ' + row.fix_exchangerate);
    		if (row.fix_exchangerate){
    			var row_sub = row.sub_id;
    			var strKey = '_'+row_sub;
    			//nlapiLogExecution('DEBUG', 'strKey', strKey);
    			if (strKey in this.sub_exchangerate_list){
    				
    				var row_type = row.ratetype;
    				var sums = this.sub_exchangerate_list[strKey];
    				var rec = sums[row_type];
    				var rate = 0;
    				if (parseFloat(rec.functional) != 0 ){
    					rate = parseFloat(rec.reporting)/parseFloat(rec.functional);
    				}

    				nlapiLogExecution('DEBUG', 'fix_exchangerates'+strKey, rate);

    				row.reportingopeningbalance = parseFloat(row.functionalopeningbalance) * parseFloat(rate);
    				row.reportingperiodactivity = parseFloat(row.functionalperiodactivity) * parseFloat(rate);
    				row.reportingclosingbalance = parseFloat(row.functionalclosingbalance) * parseFloat(rate);
    				
    			}
    			
    		}
    	}
    };
    
    this.load_subs = function(){
		this.sublist = new bl001_subsidiarylist();
	    this.subcount = this.sublist.load(CONST_ENTITY_KEY_SUB);
    };
    this.sub_curr = function(sub_id)
    {
   		if (!g_connector_settings.bOneWorld){
    		return g_company_settings.base_currency.id;
    	}else{
	    	var strKey = '_'+sub_id;
	    	if (strKey in this.sublist.list){
	    		var sub = this.sublist.list[strKey];
	    		return sub.currency;
	    	}
    	}
    	return "";
    };
    
    this.use_balance = function(account_id){		// return true/false -> does this account use balances
    	var strKey = '_'+account_id;
    	if (strKey in this.accountbalance_list){
    		return true;
    	}else{
    		return false;
    	}
    };
    this.load_accountbalance = function()
    {
    	var results = nlapiSearchRecord('customrecord_bl001_connector_accounts', null, null, [new nlobjSearchColumn('custrecord_bl001_account')]);
    	if (results){
    		if (results.length>0){
    			var rlen = results.length;
    			this.balancecount = rlen;
    			for (var i=0; i<rlen; i++){
    				var account_id = results[i].getValue('custrecord_bl001_account');
    				var strKey = '_'+account_id;
    				if (!(strKey in this.accountbalance_list)){
    					this.accountbalance_list[strKey] = account_id;
    				}
    			}
    		}
    	}
    };
    
    // create the key value from the inputs
    this.key = function(row_sub, row_account, row_dept, row_loc, row_class, row_extendedkey, row_currency)
    {
    	// this creates a key in the order we selected on the script parameters
    	var key1 = this.pickkey(this.key1, row_sub, row_account, row_dept, row_loc, row_class);    	
    	var key2 = this.pickkey(this.key2, row_sub, row_account, row_dept, row_loc, row_class);
    	var key3 = this.pickkey(this.key3, row_sub, row_account, row_dept, row_loc, row_class);
    	var key4 = this.pickkey(this.key4, row_sub, row_account, row_dept, row_loc, row_class);
    	var key5 = this.pickkey(this.key5, row_sub, row_account, row_dept, row_loc, row_class);
    	
    	// for final cta, we don't have currency
    	if (!row_extendedkey)
    		{
    		row_extendedkey="";
    		//nlapiLogExecution('DEBUG', 'row_extendedkey', row_extendedkey);
    		}
    	if (row_extendedkey.length>0){
    		row_extendedkey = '|' + row_extendedkey;
    	}
    	if (row_currency)
    	{
    		if (row_currency.length>0){
    			row_currency = '|' + row_currency;
    		}
    	} else {
    		row_currency = "";
    	}
    	//nlapiLogExecution('DEBUG', 'returnkey', key1 + '|' + key2 + '|' + key3 + '|' + key4 + '|' + key5 + row_extendedkey + row_currency);
    	if (this.preserve_account_currency){
    		return key1 + '|' + key2 + '|' + key3 + '|' + key4 + '|' + key5 + row_extendedkey + row_currency;
    	} else {
    		return key1 + '|' + key2 + '|' + key3 + '|' + key4 + '|' + key5 + row_extendedkey;
    	}
    };
    // based on the selected key field, return the value for the selected position
    this.pickkey = function(key_type, row_sub, row_account, row_dept, row_loc, row_class)
    {
    	//nlapiLogExecution('DEBUG', 'key_type', key_type+row_sub+ row_account+ row_dept+ row_loc+ row_class);
    	
    	var retval = "";
    	
    	switch (key_type)
    	{
    	case CONST_ENTITY_KEY_SUB: //"2": //"Subsidiary":				// the field is returned as the key frm the list customlist_bl001_account_key_field
    		retval = row_sub;					// except for "Account" which doesn't come through the script parameter; account is hardcoded into position #2
    		break;
    	case "Subsidiary":
    		retval = row_sub;
    		break;    		
    	case "Account":
    		retval = row_account;
    		break;
    	case CONST_ENTITY_KEY_DEP: //"3": //"Department":
    		retval = row_dept;
    		break;
    	case "Department":
    		retval = row_dept;
    		break;
    	case CONST_ENTITY_KEY_LOC: //"4": //"Location":
    		retval = row_loc;
    		break;
    	case "Location":
    		retval = row_loc;
    		break;
    	case CONST_ENTITY_KEY_CLA: //"5": //"Class":
    		retval = row_class;
    		break;
    	case "Class":
    		retval = row_class;
    		break;
    	default:
    		retval = "";
    		break;
    	}
    	
    	return retval;
    };
    
    this.count = function()
    {
    	return this.keys.length;
    };
    // load the collection with data from the saved search
    this.load = function(period_start_date, period_end_date)
    {
    	// load the list of accounts that we need to get balances from custom record
    	this.load_accountbalance();
    	if (this.balancecount>0){
    		this.load_subs();
    		
    		// also load the lookup lists for classes, departments and locations
    		if (g_company_settings.feature_dept){
    			this.department_list = new bl001_lookuplist('department');
    		}else{
    			this.department_list = new bl001_lookuplist();
    		}
    		if (g_company_settings.feature_location){
    			this.location_list = new bl001_lookuplist('location');
    		}else{
    			this.location_list = new bl001_lookuplist();
    		}
    		if (g_company_settings.feature_class){
    			this.class_list = new bl001_lookuplist('classification');
    		}else{
    			this.class_list = new bl001_lookuplist();
    		}
    	}
    	
    	var columns = new Array();
    	columns[0] = new nlobjSearchColumn('type', null, 'group');
    	columns[1] = new nlobjSearchColumn('internalid', null, 'count');
    	var account_types = nlapiSearchRecord('account', null, null, columns);
    	
    	// set a filter on transaction create date before now; help prevent getting out of balance with new transactions
    	var today_date = new Date();	
    	today_date.setMinutes(today_date.getMinutes() - 1);

    	var ret_val = 0;

        // fetch opening balance sheet transactions using custom search
        var open_period_or_close = 1;
        var result_count = this.runsearch(period_start_date, period_end_date, open_period_or_close, today_date, account_types); 
        if (result_count<0){
        	return -1;
        }
        ret_val += result_count;
        
        // fetch period activity using custom search
        open_period_or_close = 2;
        var result_count = this.runsearch(period_start_date, period_end_date, open_period_or_close, today_date, account_types);
        ret_val += result_count;
        
        // fetch the full list through the ending period; closing balance sheet
        open_period_or_close = 3;
        var result_count = this.runsearch(period_start_date, period_end_date, open_period_or_close, today_date, account_types);
        ret_val += result_count;
        
        // fix the currency exchange rates, if necessary
        nlapiLogExecution('DEBUG', 'this.sub_exchangeratecount', this.sub_exchangeratecount);
        if (this.sub_exchangeratecount > 0){
        	this.fix_exchangerates();
        }

        return ret_val;
       	
    };
    // this function adds the new filters and runs the saved search 
    this.runsearch = function(period_start_date, period_end_date, open_period_or_close, today_date, account_types)
    {
    	var ret_val = 0; // return the total # of records
    	
    	// we will skip these account types and run saved search for individual accounts
    	var account_types_to_skip = g_connector_settings.timeout_types;
    	//nlapiLogExecution('DEBUG', 'Runing runsearch|open_period_or_close', this.custom_search + '|'+open_period_or_close);
    	
    	
    	// run the query for each account type so we don't get everything at once
    	var type_len = account_types.length;
    	for (var ti = 0; ti < type_len; ti++){
    		
    		// get the account type that we will filter on
    		var type_row = account_types[ti];
    		var cols = type_row.getAllColumns();
    		var accounttype = type_row.getValue(cols[0]);
    		//var accounttype_txt = type_row.getText(cols[0]);
    		//nlapiLogExecution('DEBUG', ti + '. ' + accounttype_txt, accounttype);
    		
	    	// get the column definition from the saved search so we can get the formula when we need to loop
	    	var this_search = nlapiLoadSearch('transaction', this.custom_search);
	    	if (!this_search)return -1;
			var columns = this_search.getColumns();
			var last_sort_val = null; 					// hold the last sort_val as we loop
			var sort_formula = columns[3].getFormula();	// this is the formula for the sort column
			
	    	var loop_counter = 0;	// keep track of # of loops to fetch all records
	    	var all_done = false;
	    	while (all_done==false){
	    		
	    		var new_filters = new Array();
	    		
	    		// add the account type filter
	    		new_filters[new_filters.length] = new nlobjSearchFilter('accounttype', null, 'is', accounttype);
	    		
	    		// add the period filters
	    		switch (open_period_or_close){
	    		case 1:
	    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'before', period_start_date);
	    			break;
	    		case 2:
	    			new_filters[new_filters.length] = new nlobjSearchFilter('startdate', 'accountingperiod', 'onorafter', period_start_date);
	    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate',   'accountingperiod', 'onorbefore', period_end_date);
	    			break;
	    		case 3:
	    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'onorbefore', period_end_date);
	    			break;
	    		default:
	    			return -1;
	    		}
	    		
	    		// add the create date filter; try to avoid picking up new transactions
	    		//nlapiLogExecution('DEBUG', 'date filter', nlapiDateToString(today_date, 'datetimetz') + ' | ' + nlapiDateToString(today_date));
	    		
	    		new_filters[new_filters.length] = new nlobjSearchFilter('datecreated', null, 'onorbefore', bl_fixdate_for_search(nlapiDateToString(today_date, 'datetimetz')));
	    		
	    		// if we are looping, we add a new filter on the sort column so we don't re-fetch the same rows
	    		//var debug_string = "";
	    		if (loop_counter>0){
	    	        var oFilt = new nlobjSearchFilter('formulanumeric', null, 'equalto', 1);
	    	        var new_formula = "case when " + sort_formula + " > '" + last_sort_val + "' then 1 else 0 end"; 
	    	        oFilt.setFormula(new_formula);
	    	        new_filters[new_filters.length] = oFilt;
	    	        //debug_string = new_formula;
	    		}
	    		
	    		// run the search
	    		var bRunAccount = false;
	    		var results = null;
	    		try{
	    			// look for the account types to skip; simulate an error condition
	    			if ((','+account_types_to_skip+',').indexOf(','+accounttype+',')>=0){
	    				var ie = nlapiCreateError("SSS_SEARCH_TIMEOUT", 'Simulate error');
	    				throw ie;
	    			}
	    			
	    			//if (g_Devmode){
	    				//nlapiLogExecution('DEBUG', 'accounttype', accounttype);
		    			// simulate error
	    				
		    			//if (accounttype=='AcctRec'){
		    			//	var ie = nlapiCreateError("SSS_SEARCH_TIMEOUT", 'Test error');
		    			//	throw ie;
		    			//}
		    			
		    		//}
	    			
	    			results = nlapiSearchRecord('transaction', this.custom_search, new_filters, null);
	    		}catch(ie){
	    			if ( ie instanceof nlobjError ){
	    				if (ie.getCode() == "SSS_SEARCH_TIMEOUT"){
	    					// if this is a real timeout, save this account type so we don't timeout again
	    					if (ie.getDetails() != 'Simulate error'){
	    						nlapiLogExecution('AUDIT', 'Search Timeout for account type', accounttype);
	    						g_connector_settings.add_type_timeout(accounttype);
	    					}
	    					// this only runs once; exit loop to get next accounttype
	    					all_done = true;
	    					
	    					// turn on this flag so we don't re-summarize results below this error block
	    					bRunAccount = true;
	    					
	    					// get a list of accounts for this account type
	    					var account_filter = new Array();
	    					account_filter[0] = new nlobjSearchFilter('type', null, 'is', accounttype);
	    					account_filter[1] =  new nlobjSearchFilter('isinactive', null, 'is', 'F');
	    					var account_list = nlapiSearchRecord('account', null, account_filter, [new nlobjSearchColumn('name')]);
	    					
	    					var acct_len = 0;
	    					if (account_list){
	    						acct_len = account_list.length;
	    					}
	    					nlapiLogExecution('DEBUG', 'account_list.length', acct_len);
	    					
	    					for (var aix = 0; aix < acct_len; aix++){
	    						var account_row = account_list[aix];
	    						var account_id = account_row.getId();
	    						var account_name = account_row.getValue('name');
	    						
	    						if (this.use_balance(account_id)){
	    							nlapiLogExecution('AUDIT', 'Using balances for accountid', account_id);
	    							
	    							var bal_results = this.get_balances(account_id, period_start_date, period_end_date, open_period_or_close);
	    							
	    							// this runs the same basic loop as this.summarize_results() below
	    							if (bal_results){
	    								if (bal_results.length){
	    									var blen = bal_results.length;
	    									for (var bi=0; bi<blen; bi++){
	    										var b_result = bal_results[bi];
	    										var bcols = b_result.getAllColumns();
	    										
	    										//0 var columns = [new nlobjSearchColumn('custrecord_bl001_balances_subsidiary')
	    										//1, new nlobjSearchColumn('custrecord_bl001_balances_account')
	    										//2, new nlobjSearchColumn('custrecord_bl001_balances_department')
	    										//3, new nlobjSearchColumn('custrecord_bl001_balances_location')
	    										//4, new nlobjSearchColumn('custrecord_bl001_balances_class')
	    										//5, new nlobjSearchColumn('custrecord_bl001_balances_acc_curr')
	    										//6, new nlobjSearchColumn('custrecord_bl001_balances_period')
	    										//7, new nlobjSearchColumn('enddate', 'custrecord_bl001_balances_period')
	    										//8, new nlobjSearchColumn('custrecord_bl001_balances_acc_bal')
												//9, new nlobjSearchColumn('custrecord_bl001_balances_sub_bal')
												//10, new nlobjSearchColumn('custrecord_bl001_account_export_type', 'custrecord_bl001_balances_account')
												//11, new nlobjSearchColumn('type', 'custrecord_bl001_balances_account')
												//12, new nlobjSearchColumn('generalratetype', 'custrecord_bl001_balances_account')
												//13, new nlobjSearchColumn('number', 'custrecord_bl001_balances_account')
	    										//];	    										
	    										var row_sub = b_result.getValue(bcols[0]);
	    										var row_sub_name = "";
	    										var row_type = b_result.getText(bcols[11]);
	    										//nlapiLogExecution('AUDIT', 'row_type', row_type);
	    										var row_account = b_result.getValue(bcols[1]);
	    										var row_account_name = account_name; //b_result.getText(bcols[1]);
	    										var row_dept = b_result.getValue(bcols[2]);
	    										var row_dept_name = this.department_list.name(row_dept); //b_result.getText(bcols[2]);
	    										var row_loc = b_result.getValue(bcols[3]);
	    										var row_loc_name = this.location_list.name(row_loc); //b_result.getText(bcols[3]);
	    										var row_class = b_result.getValue(bcols[4]);
	    										var row_class_name = this.class_list.name(row_class); //b_result.getText(bcols[4]);
	    										var row_currency =  b_result.getValue(bcols[5]);
	    										var row_subcurr = this.sub_curr(row_sub);
	    										var row_ratetype = b_result.getValue(bcols[12]);
	    										var row_amt_local = b_result.getValue(bcols[8]);
	    										var row_amt_funct = b_result.getValue(bcols[9]);
	    										var fix_exchangerate = true; // this flags the row that we need to apply the exchange rate before output
	    										var row_amt_rep = 0;
	    										if (row_subcurr == g_company_settings.base_currency.id){
	    											fix_exchangerate = false;
	    											row_amt_rep = b_result.getValue(bcols[9]);
	    										}
	    										var row_inactive = "F";
	    										var row_acctnum = b_result.getValue(bcols[13]);
	    										var row_blacklinetype = b_result.getValue(bcols[10]);
	    										var row_extendedkey = "";
	    											
	    										this.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, fix_exchangerate);
	    									}
	    								}
	    							}
	    							continue;
	    						}
	    						
	    						
	    						nlapiLogExecution('AUDIT', 'Running search for accountid', account_id);
	    						
	    						var new_filters = new Array();

	    						// add the account filter
	    			    		new_filters[new_filters.length] = new nlobjSearchFilter('account', null, 'is', account_id);	    			    		

	    			    		// add the account type filter
	    			    		new_filters[new_filters.length] = new nlobjSearchFilter('accounttype', null, 'is', accounttype);
	    			    		
	    			    		// add the period filters
	    			    		switch (open_period_or_close){
	    			    		case 1:
	    			    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'before', period_start_date);
	    			    			break;
	    			    		case 2:
	    			    			new_filters[new_filters.length] = new nlobjSearchFilter('startdate', 'accountingperiod', 'onorafter', period_start_date);
	    			    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate',   'accountingperiod', 'onorbefore', period_end_date);
	    			    			break;
	    			    		case 3:
	    			    			new_filters[new_filters.length] = new nlobjSearchFilter('enddate', 'accountingperiod', 'onorbefore', period_end_date);
	    			    			break;
	    			    		default:
	    			    			return -1;
	    			    		}
	    			    		
	    			    		// add the create date filter; try to avoid picking up new transactions
	    			    		//nlapiLogExecution('DEBUG', 'date filter', nlapiDateToString(today_date, 'datetimetz') + ' | ' + nlapiDateToString(today_date));
	    			    		
	    			    		new_filters[new_filters.length] = new nlobjSearchFilter('datecreated', null, 'onorbefore', bl_fixdate_for_search(nlapiDateToString(today_date, 'datetimetz')));
	    			    		try{
	    			    			// simulate error A/R in Dev
	    			    			//if (g_Devmode){
	    			    				
		    			    			//if (account_id==7){
		    			    			//	var xie = nlapiCreateError("SSS_SEARCH_TIMEOUT", 'Test error');
		    			    			//	throw xie;
		    			    			//}
		    			    			
	    			    			//}
	    			    			
	    			    			results = nlapiSearchRecord('transaction', this.custom_search, new_filters, null);
	    			    		}catch(xie){
	    			    			// the result timed-out by account; we need to add an exception and recompute balances
	    			    			if ( xie instanceof nlobjError ){
	    			    				if (xie.getCode() == "SSS_SEARCH_TIMEOUT"){
	    			    					var new_account = nlapiCreateRecord('customrecord_bl001_connector_accounts');
	    			    					new_account.setFieldValue('custrecord_bl001_account', account_id);
	    			    					new_account.setFieldValue('custrecord_bl001_balance_date', '1/1/2000');
	    			    					nlapiSubmitRecord(new_account);
	    			    					var strKey = '_'+account_id;
	    			        				if (!(strKey in this.accountbalance_list)){
	    			        					this.accountbalance_list[strKey] = account_id;
	    			        					this.balancecount += 1;
	    			        				}
	    			    					bl001_log_export(g_Profile_ID, CONST_ACCOUNT, "", "Error: search timeout for account. Computing balance cache.", account_id);
	    			    					bl001_Start_Export(CONST_COMP_ACCOUNT, g_Profile_ID, true);
	    			    					return -1;
	    			    				}
	    			    			}
	    			    		}

	    		    			if (results){
	    			    			if (results.length){
	    	    			    		nlapiLogExecution('DEBUG', aix + '.' + accounttype + ' accountid:'+ account_id + '  results.length', results.length);
	    	    			    		
	    	    			    		var acct_count = this.summarize_results(results, open_period_or_close);
	    	    			    		ret_val += 	acct_count;	    	    			    		
	    			    			}
	    			    		}
	    					}
	    					
	    				}else{
	    					throw ie;
	    				}
	    			}else{
	    				throw ie;
	    			}	    			
	    		}
	    		// if we already ran & summarized this accounttype for each account, don't resummarize here...
	    		if (bRunAccount == false){
		    		// summarize the results into the array
		    		var this_result_count = this.summarize_results(results, open_period_or_close);
		    		ret_val += 	this_result_count;
		    		//nlapiLogExecution('DEBUG', open_period_or_close +'.'+loop_counter+' results summarized|filters.len|loop_filter', this_result_count + '|' + new_filters.length + '|' + debug_string);
		    		
		    		// if the number of results is our maximum, we need get the sort value for our filter when we re-run/loop
		    		if (this_result_count == CONST_ACCOUNT_MAX_RECORDS){
		    			// get a reference to the last nlobjSearchResult object
		    			var final_result = results[CONST_ACCOUNT_MAX_RECORDS-1];
		    			var final_cols = final_result.getAllColumns();
		    			var sort_col = final_cols[CONST_COL_SORT];
		    			// get the sort value from the sort column
		    			last_sort_val = final_result.getValue(sort_col);
		    		} else {
		    			all_done = true;
	    		}
	    		}
	    		// loop safety
	    		loop_counter += 1;
	    		if (loop_counter > CONST_LOOPSAFETY)return -1;
	    	}
	    	
	    	nlapiLogExecution('AUDIT', open_period_or_close +'.'+loop_counter + '.' + accounttype, ret_val + ' records');
    	}
    	return ret_val;
    };
    this.get_balances = function(account_id, period_start_date, period_end_date, open_period_or_close)
    {
		var columns = [new nlobjSearchColumn('custrecord_bl001_balances_subsidiary')
		, new nlobjSearchColumn('custrecord_bl001_balances_account')
		, new nlobjSearchColumn('custrecord_bl001_balances_department')
		, new nlobjSearchColumn('custrecord_bl001_balances_location')
		, new nlobjSearchColumn('custrecord_bl001_balances_class')
		, new nlobjSearchColumn('custrecord_bl001_balances_acc_curr')
		, new nlobjSearchColumn('custrecord_bl001_balances_period')
		, new nlobjSearchColumn('enddate', 'custrecord_bl001_balances_period')
		, new nlobjSearchColumn('custrecord_bl001_balances_acc_bal')
		, new nlobjSearchColumn('custrecord_bl001_balances_sub_bal')
		, new nlobjSearchColumn('custrecord_bl001_account_export_type', 'custrecord_bl001_balances_account')
		, new nlobjSearchColumn('type', 'custrecord_bl001_balances_account')
		, new nlobjSearchColumn('generalratetype', 'custrecord_bl001_balances_account')
		, new nlobjSearchColumn('number', 'custrecord_bl001_balances_account')
		];
		
		var filters = [new nlobjSearchFilter('custrecord_bl001_balances_account', null, 'is', account_id)];
		// add the period filters
		switch (open_period_or_close){
		case 1:
			filters[filters.length] = new nlobjSearchFilter('enddate', 'custrecord_bl001_balances_period', 'before', period_start_date);
			break;
		case 2:
			filters[filters.length] = new nlobjSearchFilter('startdate', 'custrecord_bl001_balances_period', 'onorafter', period_start_date);
			filters[filters.length] = new nlobjSearchFilter('enddate',   'custrecord_bl001_balances_period', 'onorbefore', period_end_date);
			break;
		case 3:
			filters[filters.length] = new nlobjSearchFilter('enddate', 'custrecord_bl001_balances_period', 'onorbefore', period_end_date);
			break;
		default:
			return 0;
		}		
		
		var results = bl_noempty(nlapiSearchRecord('customrecord_bl001_connector_balances', null, filters, columns),{length:0});
		
		return results;

    };
    
    this.summarize_results = function(results, open_period_or_close)
    {
        // loop records and add them to the internal arrays
        var rec_len = 0;
        if (results)
        {
            if ( results.length > 0)
            {
                rec_len = results.length;
                // cap records
                if (rec_len>CONST_ACCOUNT_MAX_RECORDS){
                	rec_len = CONST_ACCOUNT_MAX_RECORDS;
                }
                //nlapiLogExecution('DEBUG', 'customsearch_bl001_transaction_summary.results.length', rec_len);
                var curr_col = 0;
                if (rec_len>0){
                    // figure out what column the account is in
                    var result = results[0];                    
                    var row_columns = result.getAllColumns();
                    var c_len = row_columns.length;
                    for (var ci=0; ci<c_len; ci++){
                    	var col = row_columns[ci];
                    	if (col){
                    		if (col.getName() == 'account'){
                            	curr_col = ci;
                    			break;
                    		}
                    	}
                    }
                }
                for (var i=0;i<rec_len;i++)
                {
                    var result = results[i];
                    
                    var row_columns = result.getAllColumns();
                    var c_len = row_columns.length;
                    //nlapiLogExecution('DEBUG', 'row_columns.length', row_columns.length);
                    
                    var row_type 	= result.getText('type', 'account', 'group');
                    var row_account_name=result.getText('account', null, 'group');
                    var row_acctnum = result.getValue('number', 'account', 'group');
                    var row_currency= result.getValue('currency', null, 'group');
                    var row_subcurr = null;
                    if (g_connector_settings.bOneWorld){
                    	row_subcurr = result.getValue('currency', 'subsidiary', 'group');
                    }else{
                    	row_subcurr = g_company_settings.base_currency.id;
                    }
                    var row_ratetype= result.getValue('generalratetype', 'account', 'group');
                    var row_inactive= result.getValue('isinactive', 'account', 'group');
                    var row_blacklinetype= result.getValue('custrecord_bl001_account_export_type', 'account', 'group');
                    
                    // get the basic keys; assume the start is the account column found above
                    var i_account = curr_col;
                    var i_dept = parseInt(curr_col)+parseInt(1);
                    var i_loc = parseInt(curr_col)+parseInt(2);
                    var i_class = parseInt(curr_col)+parseInt(3);
                    var i_sub = parseInt(curr_col)+parseInt(4);
                    var row_account = result.getValue(row_columns[i_account]);					// the account must be this position in the search because it must always be key #2
                    var row_dept 	= result.getValue(row_columns[i_dept]);
                    var row_dept_name=result.getText(row_columns[i_dept]);
                    var row_loc	 	= result.getValue(row_columns[i_loc]);
                    var row_loc_name= result.getText(row_columns[i_loc]);
                    var row_class 	= result.getValue(row_columns[i_class]);
                    var row_class_name=result.getText(row_columns[i_class]);
                    var row_sub = '';
                    var row_sub_name = '';
                    if (parseInt(i_sub) < parseInt(c_len)){
                    	row_sub 	= result.getValue(row_columns[i_sub]);	// this column may be empty if not-oneworld; therefore, it may also be a custom key of the client defined search
                    	row_sub_name= result.getText(row_columns[i_sub]);	
                    }
                    if (!row_sub)row_sub='';
                    if (row_sub.length==0){
                    	row_sub = this.currency_adj_sub; // get the default currency_adj_sub
                    }
                    
                    //nlapiLogExecution('DEBUG', 'column name', row_columns[9].getName() + '|' + row_columns[10].getName()+ '|' + row_columns[11].getName()+ '|' + row_columns[12].getName()+ '|' + row_columns[13].getName()+ '|' + row_columns[14].getName());
                    
                    // get the extended keys if applicable
                    var c_len = row_columns.length;
                    var row_extendedkey = "";
                    var i_start = parseInt(curr_col)+parseInt(5);
                    if (c_len > i_start){
                    	for (var nc_i = i_start; nc_i<c_len; nc_i++){
                    		row_extendedkey = row_extendedkey + "|" + result.getValue(row_columns[nc_i]);
                    	}
                    }
                    //nlapiLogExecution('DEBUG', 'row_sub|row_accountj|row_dept|row_loc|row_class', row_sub+'|'+row_account+'|'+row_dept+'|'+row_loc+'|'+row_class+'|'+row_extendedkey); 

                    var row_amt_local=result.getValue(row_columns[CONST_COL_LOCAL]);
                    var row_amt_funct=result.getValue(row_columns[CONST_COL_FUNC]);
                    var row_amt_rep = result.getValue(row_columns[CONST_COL_REPORT]);
                    
                    //nlapiLogExecution('DEBUG', 'row_sub|row_type|row_account|row_account_name|row_dept|row_loc|row_class|row_currency|row_subcurr|row_ratetype|row_amt_local|row_amt_funct', row_sub+'|'+row_type+'|'+row_account+'|'+row_account_name+'|'+row_dept+'|'+row_loc+'|'+row_class+'|'+row_currency+'|'+row_subcurr+'|'+row_ratetype+'|'+row_amt_local+'|'+row_amt_funct+'|' + row_amt_rep); 
                    //nlapiLogExecution('DEBUG', 'ratetype', row_ratetype);
                	//this.add(row_sub, row_type, row_account, row_account_name, row_dept, row_loc, row_class, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close);
                    this.add(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, false);
                	
                	
                };
            };
         }   
        return rec_len;
    };
    // For Key#1:
    //	return just the ID because BL keeps the entity table normalized
    // For Key#2 (Account):
    //	the ID is just the account number
    // For all others:
	// 		make the key a combination of the internal ID and the name '2090 Accounts Payable [42]'
	// 		if there is a hierarchy, trim the level so they don't take up too much room
    this.make_key = function(internal_id, s_name, iLevel, account_num){
    	if (!internal_id)return '';
    	if (internal_id.length==0)return'';
    	if (!s_name)return internal_id;
    	if (s_name.length==0)return internal_id;
    	// level 1 is just the id
    	if (iLevel==1)return internal_id;
    	// level 2 is the natural account number only; it is the first thing on the front; make sure it is numeric
    	if (iLevel==2){
    		if (account_num){
    			if (account_num.length>0){
    				if (account_num != '- None -'){
    					return account_num;	
    				}
    			}
    		}
    		if (s_name.indexOf(' ')>=0){
    			var aName = s_name.split(' ');
    			var acc_num = aName[0];
    			if (bl_isNonZeroNumber(acc_num)){
    				return acc_num;
    			} else {
    				return internal_id;
    			}
    		} else {
    			return internal_id;
    		}
    	}
    	if (s_name){
    		//if ( s_name.length > (parseInt(50)-parseInt(3)-parseInt((internal_id+'').length))){
    		if ( s_name.length > parseInt(50) ){
		    	if (s_name.indexOf(':')>=0){
		    		var aname = s_name.split(':');
		    		var alen = aname.length;
		    		for (var i=0;i<alen;i++){
		    			var level_name = aname[i];
		    			level_name = level_name.trim();
		    			// don't truncate the last item
		    			if (i<(alen-1)){
			    			if (level_name.length>9){
			    				level_name = level_name.substring(0,8);
			    				aname[i] = level_name;
			    			}
		    			}
		    		}
		    		s_name = aname.join(':');
		    	}
    		}
    	}
    	if (this.isUniqueKey(s_name, internal_id)){
    		return s_name;
    	} else {
    		// now overall trim for the id on the end
    		if ( s_name.length > (parseInt(50)-parseInt(3)-parseInt((internal_id+'').length))){
    			s_name = s_name.substring(0,(parseInt(50)-(internal_id+'').length-parseInt(3)));
    		}
    		return s_name + ' [' + internal_id + ']';
    	}
    };
    
    // create an array to hold associate array where we keep the key and the internal id. If they match, return true; else, return false
    this.unique_keys = new Array();
    // if the key is not unique, we will add the [ID] onto the end
    this.isUniqueKey = function(key, id){
    	var strKey = '_' + key;    	 
    	// if it doesn't exist, add it and return true
        if (!(strKey in this.unique_keys)) {
            this.unique_keys[strKey] = id;
            return true;
        	}
        else {
        	// the key exists; check the id; if it matches, return true
        	var check_id = this.unique_keys[strKey];
        	if (check_id == id){
        		return true;
        	} else {
        		return false;
        	}
        }
    };
    
    // this helper function for this.make_key returns 1 or 3; if the entity_type is used in key#1, we use 1; else 3
    this.isKeyLevel1 = function(entity_type){
    	if (this.key1 == entity_type) {
    		return 1;
    	}
    	return 3;
    };
    
    
    
    // add the row to the collection
//    this.add = function(row_sub, row_type, row_account, row_account_name, row_dept, row_loc, row_class, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close)
    this.add = function(row_sub, row_sub_name, row_type, row_account, row_account_name, row_dept, row_dept_name, row_loc, row_loc_name, row_class, row_class_name, row_currency, row_subcurr, row_ratetype, row_amt_local, row_amt_funct, row_amt_rep, row_inactive, row_acctnum, row_blacklinetype, row_extendedkey, open_period_or_close, fix_exchangerate)
    {
    	
    	// we store the BL type and the NS type
    	var ns_rowtype = row_type;
    	row_type = bl001_translate_accounttype(row_type);
    	
    	// convert the keys into the sequence specified on the front end; the user can pick which key appears in which column, except account which is always key#2
        var k_account = this.make_key(row_account, row_account_name, 2, row_acctnum); // we pass in the row_acctnum so we can use it
        var k_dept = this.make_key(row_dept, row_dept_name, this.isKeyLevel1(CONST_ENTITY_KEY_DEP));
        var k_loc = this.make_key(row_loc, row_loc_name, this.isKeyLevel1(CONST_ENTITY_KEY_LOC));
        var k_class = this.make_key(row_class, row_class_name, this.isKeyLevel1(CONST_ENTITY_KEY_CLA));
        var k_sub = this.make_key(row_sub, row_sub_name, this.isKeyLevel1(CONST_ENTITY_KEY_SUB));
        
        // now remove the "2000" from "2000 Accounts Payable"
        // only if k_account is 2000
        var i_name = row_account_name.indexOf(' ');
        if (i_name>0){
            if (k_account == row_account_name.substring(0, i_name)){
            	row_account_name = row_account_name.substring(i_name+1);
            }
        }
    	
    	// make sure the currency is the last item in the key; it gets removed from the key when we output the row
    	var key = this.key(k_sub, k_account, k_dept, k_loc, k_class, row_extendedkey, row_currency);
    	
        // only add this item if it doesn't exist in the collection
        var strKey = '_' + key;
        
        if (!(strKey in this.list))
        {
            this.keys[this.keys.length] = key;
            //this.values[this.values.length] = sub_name.replace('|', '!') + '|' + key;

            var sub = new bl001_account_row();
            sub.sub_id = row_sub;
            sub.account_id = row_account;
            sub.dept_id = row_dept;
            sub.loc_id = row_loc;
            sub.class_id = row_class;
            sub.extendedkey = row_extendedkey;
            sub.key = key;
            sub.name = row_account_name;
            sub.acctnumber = row_acctnum;
            sub.accounttype = row_type;
            sub.nsaccounttype = ns_rowtype;
            sub.functionalcurrency = row_subcurr;
            sub.accountcurrency = row_currency;
            sub.ratetype = row_ratetype;
            sub.inactive = row_inactive;
            sub.blacklinetype = row_blacklinetype;
            sub.fix_exchangerate = fix_exchangerate;
            sub.add(row_amt_local, row_amt_funct, row_amt_rep, open_period_or_close);
            
            this.list[strKey] = sub;
        } else
    	{
    		var sub = this.list[strKey];
    		sub.add(row_amt_local, row_amt_funct, row_amt_rep, open_period_or_close);
    		//this.list[strKey] = sub;
    	}
        
        //nlapiLogExecution('DEBUG', 'open_period_or_close|fix_exchangerate', open_period_or_close+'|'+fix_exchangerate);
        if (open_period_or_close == 3) // we only need to do this the last pass through; we have all accounts in this one.
        	{
        	//nlapiLogExecution('DEBUG', 'fix_exchangerate', fix_exchangerate);
        	
        	// if this sub is a different currence than the base, we need to
        	// keep the currency exchange rates for the period from sub to parent
        	// we can't access these rates directly; therefore, we will keep tally and reverse into it
        	if (!fix_exchangerate){
        		//nlapiLogExecution('DEBUG','	row_subcurr != g_company_settings.base_currency.id', row_subcurr + ' | ' + g_company_settings.base_currency.id);
        	 
        		if (row_subcurr != g_company_settings.base_currency.id){
        			this.add_exchangerate(row_sub, row_ratetype, row_amt_funct, row_amt_rep);
        		}
        	}
        	
	        // add to the subsidiary retained earnings list
	        var re_key = null;
	        if (this.preserve_account_currency){
	    		if (row_currency.length==0){
	    			row_currency = g_company_settings.base_currency.id;
	    		}
	        	re_key = '_' + k_sub + '|' + row_currency;
        	} else {
        		re_key = '_' + k_sub;
        	}
	        if (!(re_key in this.sub_list_retainedearnings))
	        	{
	        		if (this.preserve_account_currency){
	        			this.sub_keys[this.sub_keys.length] = k_sub + '|' + row_currency;
	        		} else {
	        			this.sub_keys[this.sub_keys.length] = k_sub;
	        		}
	        		this.sub_list_retainedearnings[re_key] = {local:0,functional:0,reporting:0,key:k_sub,currency:row_currency,subcurr:row_subcurr};
	        	};
        	};
        
    };
    
    this.add_retainedearnings = function(row_sub, row_currency, row_amt_local_closing, row_amt_functional_closing, row_amt_reporting_closing, row_amt_local_period, row_amt_functional_period, row_amt_reporting_period)
    {
    	var re_key = null;
    	if (this.preserve_account_currency){
    		if (row_currency.length==0){
    			row_currency = g_company_settings.base_currency.id;
    		}
    		re_key = '_' + row_sub +'|' + row_currency;
    	} else {
    		re_key = '_' + row_sub;
    	}
    	if (re_key in this.sub_list_retainedearnings)
    		{
    			var sub_re = this.sub_list_retainedearnings[re_key];
    			sub_re.local += (parseFloat(row_amt_local_closing) - parseFloat(row_amt_local_period));
    			sub_re.functional += (parseFloat(row_amt_functional_closing) - parseFloat(row_amt_functional_period));
    			sub_re.reporting += (parseFloat(row_amt_reporting_closing) - parseFloat(row_amt_reporting_period)); 
    		}
    	else 
    		{
    			nlapiLogExecution('ERROR', 're_key not in sub_list_re', re_key);
    		};
    };
    
};
*/


// an individual subsidiary item
function bl001_subsidiary()
{
	this.id = 0;
	this.name = "";
	this.namenohierarchy = "";
	this.currency = "";
	this.country = "";
	this.iselimination = "";
	this.entity_key_type = 0;
	this.level = function(maxlevel)
	{
		// In blackline, the levels are the reverse of Netsuite
		// That is, the parent is the bottom level in Blackline and the top level in Netsuite
		// this is for output to Blackline; therefore, we need to reverse it from the maxlevels on bl001_subsidiarylist.list
		var aLen = this.name.split(':');
		// the top level key should be the max+1 for non-subsidiary key#1 profiles
		if (this.entity_key_type!=CONST_ENTITY_KEY_SUB){
			if (this.id == ''){
				return parseInt(maxlevel)+parseInt(1);
			}
		}
		return parseInt(maxlevel) - parseInt(aLen.length) + parseInt(1);
	};
}
// a collection of subsidiaries
function bl001_subsidiarylist()
{
    this.list = new Array();		// collection of bl001_subsidiary objects
    this.keys = new Array();		// list of keys
    //this.values = new Array();	// list of values; use this for dropdowns
    this.results = null;
    this.m_maxlevel = 0;
    
    this.entity_key_type = 0;
    
    // lookup the parent subsidiary id
    this.parent_sub_id = function(sub_id)
    {
    	var ret_val = '0';
    	if (this.entity_key_type != CONST_ENTITY_KEY_SUB){
    		ret_val = '';
    	}    		
    	// get the sub from the collection and get the name of the parent
    	var key = sub_id;
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
        	return ret_val;
        }
        var sub = this.list[strKey];
        var max_level = this.maxlevel();
        // if this is at the top level, there aren't any subs
        if (sub.level(max_level) == this.m_maxlevel)
        	{
        	return ret_val;
        	}
        // the subsidiary name is in the format "parent:child" 
        var name = sub.name;
        var aLevels = name.split(':');
        if (!aLevels.length>0)
        	{
        		return ret_val;
        	}
		// remove the last element
		aLevels.pop();
		// this is the name of the parent
		var parent_name = aLevels.join(':').trim();
		//nlapiLogExecution('DEBUG', 'parent_name', parent_name);
		
		// now scan for it
    	for(var sub_key in this.list)
    	{
    		var sub = this.list[sub_key];
    		//nlapiLogExecution('DEBUG', 'sub.name.trim()', sub.name.trim());
    		if (sub.name.trim() == parent_name)
    			{
    				var key_logic = new bl001_account_list();	// this has logic to build the key from the name + [id]
    				ret_val = key_logic.make_key(sub.id, parent_name, 1);
    				break;
    			};
    	}
    	return ret_val;    	
    };
    
    this.maxlevel = function()
    {
    	if (this.m_maxlevel)
    		{
    		return this.m_maxlevel;
    		}
    	
    	var retval = 1;
    	
    	for(var sub_key in this.list)
    	{
    		var sub = this.list[sub_key];
    		
    		if (sub.name.indexOf(':') < 0)
    			{
    			continue;
    			}
    		var aLen = sub.name.split(':');
    		if (aLen)
			{
    			if (aLen.length)
    				{
    					if (parseInt(aLen.length) > parseInt(retval))
    						{
    							retval = aLen.length;
    						};
    				};
			};
    	}
    	this.m_maxlevel = retval;
    	return retval;
    };

    this.load = function(entity_key_type)
    {
    	
    	var columns = new Array();
    	columns[0] = new nlobjSearchColumn('name');
    	columns[1] = new nlobjSearchColumn('namenohierarchy');
    	
    	// this defines what type of record to load
    	var rec_type = null;
    	switch (entity_key_type){
    	case CONST_ENTITY_KEY_SUB:
    	    // load the subsidiary list
    	    rec_type = 'subsidiary';
    	    columns[2] = new nlobjSearchColumn('currency');
    	    columns[3] = new nlobjSearchColumn('country');
    	    columns[4] = new nlobjSearchColumn('iselimination');
    		break;
    	case CONST_ENTITY_KEY_DEP:
    		rec_type = 'department';
    		break;
    	case CONST_ENTITY_KEY_LOC:
    		rec_type = 'location';
    		break;
    	case CONST_ENTITY_KEY_CLA:
    		rec_type = "classification";
    		break;
    	default:
    		break;
    	}
    	//nlapiLogExecution('DEBUG', 'rec_type|entity_key_type', rec_type + '|' + entity_key_type);
    	if (!rec_type){
    		return;		
    	}
    	
    	try
    	{
    		this.results = nlapiSearchRecord(rec_type, null, null, columns);
    	} catch (e)
    	{
    		this.add("1", CONST_PARENT_COMPANY, CONST_PARENT_COMPANY, "","","");
    		return;
    	}
    	
        // loop records and add them to the internal arrays
        var rec_len = 0;
        if (this.results)
        {
            if ( this.results.length > 0)
            {
            	// if we are looking at non-sub key (dept, class, loc), we should insert a blank key for the top level
            	if (entity_key_type!=CONST_ENTITY_KEY_SUB){
            		this.add("", "", "", "","","");
            	}
                rec_len = this.results.length;
                //nlapiLogExecution('DEBUG', 'rec_type.results.length', rec_len);
                for (var i=0;i<rec_len;i++)
                {
                    var result = this.results[i];
                    /* 
                    var column_list = result.getAllColumns();
                    show columns
                    var col_len = column_list.length;
                    for (i=0; i<col_len; i++)
                    {
                        var col = column_list[i];
                        var col_name = col.getName();
                        var col_label= col.getLabel();
                        var col_form = col.getFormula();
                        var col_func = col.getFunction();
                        nlapiLogExecution('DEBUG', 'col_name col_label', col_name + '|' + col_label);
                    }
                    */
                    var sub_id = result.getId();
                    var sub_name = result.getValue('name');
                    var sub_namenohierarchy = result.getValue('namenohierarchy');
                    var sub_currency = '';
                    var sub_country = '';
                    var sub_iselimination = '';
                    if (entity_key_type==CONST_ENTITY_KEY_SUB){
                    	sub_currency = result.getValue('currency');
                    	sub_country = result.getValue('country');
                    	sub_iselimination = result.getValue('iselimination');
                    }
                    this.add(sub_id, sub_name, sub_namenohierarchy, sub_currency, sub_country, sub_iselimination);                    
                };
            };
          }

          return rec_len;
        };
	

    this.count = function()
    {
        return this.keys.length;
    };
    
    this.add = function(sub_id, sub_name, sub_namenohierarchy, sub_currency, sub_country, sub_iselimination)
    {
    	var key = sub_id;

        // only add this item if it doesn't exist in the collection
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            this.keys[this.keys.length] = key;
            //this.values[this.values.length] = sub_name.replace('|', '!') + '|' + key;

            var sub = new bl001_subsidiary();
            sub.id = sub_id;
            sub.name = sub_name;
            sub.namenohierarchy = sub_namenohierarchy;
            sub.currency = sub_currency;
            sub.country = sub_country;
            sub.iselimination = sub_iselimination;
            sub.entity_key_type = this.entity_key_type;
            this.list[strKey] = sub;
        };
    };

    this.contains = function(key)
    {
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return false;
        } else
        {
            return true;
        };
    };
    this.get = function(key)
    {
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
        	var obj = {};
        	obj.name = "";
        	obj.currency = "";
            return obj;
        } else
        {
            return this.list[strKey];
        };
    };
}


//------------------------------------------------------------------
//Function: _writefile
//Input: foldername, filename, contents
//Output: the folder id 
//Description: write a plaintext file; create the folder if necessary
//Date: SG 20121025
//------------------------------------------------------------------
function bl001_writefile(folder_name, file_name, contents)
{
    // make sure the folder exists; create it if necessary
    var folder_id = bl001_getfolder(folder_name);
    //nlapiLogExecution('DEBUG', 'folder_id', folder_id);
	
    // create the file
	var et_file = nlapiCreateFile(file_name, 'PLAINTEXT', contents);
    //var et_file = nlapiCreateFile(file_name.replace('.txt','.csv'), 'CSV', contents);		// this simplifies import into Excel for testing
	et_file.setFolder(folder_id);
	
	// save the file
	var file_id = nlapiSubmitFile(et_file);
	
	// get url
	var thisfile = nlapiLoadFile(file_id);
	var url = thisfile.getURL();
	nlapiLogExecution('AUDIT', 'file_id|getURL', file_id + '|'+ url);
	
	return url;
}
//------------------------------------------------------------------
//Function: _getfolder
//Input: string
//Output: the folder id 
//Description: fetch the folder id for the given folder name; create it if necessary
//Date: SG 20121025
//------------------------------------------------------------------
function bl001_getfolder(folder_name)
{
	var ret_val = 0;
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('name', null, 'is', folder_name);
	var results = nlapiSearchRecord('folder', null, filters, null);
	if (results)
		{
			if (results.length)
				{
					var result = results[0];
					ret_val = result.getId();
				};
		};
	
	// folder was not found; create it
	if (!ret_val)
		{
			var folderRecord = nlapiCreateRecord('folder');
			folderRecord.setFieldValue( 'name', folder_name);
			folderRecord.setFieldValue( 'description', 'Blackline export files');
			ret_val = nlapiSubmitRecord( folderRecord );
			
		}
	
	return ret_val;
}

//------------------------------------------------------------------
//Function: _isNumber
//Input: string
//Output: true if this is a numeric value 
//Description: 
//Date: MO 20110904
//------------------------------------------------------------------
function bl_isNumber(n) 
{
	
	var bNan = isNaN(parseFloat(n));
	var bFin =  isFinite(n);
	if (bNan){
		return false;
	}
	if (bFin){
		return true;
	}
	return false;
	//return (!(isNaN(parseFloat(n)) && isFinite(n)));
}
//------------------------------------------------------------------
//Function: _isNonZeroNumber
//Input: a number or string to test
//Output: true if this is a non zero number
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
function bl_isNonZeroNumber(n)
{
    if (typeof n != "undefined")
    {
        if (n) {
            if ( bl_isNumber(n) )
            {
                if ( parseFloat( n ) != 0)
                {
                    return true;
                }
            }
        }
    }
    return false;
}
//------------------------------------------------------------------
//Function: _now
//Output: current date/time formatted to insert into NetSuite
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
function bl_now()
{
 var now = new Date();
 return nlapiDateToString(now, 'datetimetz');    
}
//------------------------------------------------------------------
// Function: _fixdate_for_search
// Output:	The time without seconds; the search filter chokes
// Date: SG 20130125
//------------------------------------------------------------------
function bl_fixdate_for_search(inp_date, date_only)
{
	//nlapiLogExecution('DEBUG', 'inp_date', inp_date);
	var retVal = inp_date;
	if (inp_date){
		if (inp_date.length>9){
			if (inp_date.indexOf(':')>0){
				var adate = inp_date.split(':');
				if (adate.length>2){
					var ampm = adate[2];
					adate.pop();
					if (ampm.indexOf('pm')>=0){
						retVal = adate.join(':') + ' pm';
					} else if (ampm.indexOf('am')>=0) {
						retVal = adate.join(':') + ' am';
					} else {
						retVal = adate.join(':');
					}
				}
			}
		}
	}
	if (date_only){
		if (retVal.indexOf(' ')>0){
			retVal = retVal.split(' ')[0];
		}
	}
	return retVal;
}
//------------------------------------------------------------------
//Function: _noempty
//Output: return the input_value if it has a value else the default value
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
function bl_noempty(input_value, default_value)
{
    if (!input_value)
    {
        return default_value;
    }
    if (input_value.length==0)
    {
        return default_value;
    }
    return input_value;
};
//------------------------------------------------------------------
//Function: bl001_logerror
//Output: 	
//Description: log the error and send an email 
//Date: SG 20120311
//------------------------------------------------------------------
function bl001_logerror(err_title, err_description, e){
	if (g_Devmode){
		throw(e);
		return;
	}
	try
	{
		if (e){
			if ( e instanceof nlobjError ){
				//err_description = err_description + ' nlobjError:' + e.getCode() + '|' + e.getDetails() + '|' + e.getStackTrace();
				err_description = err_description + ' ' + e.getCode() + ' ' + e.getDetails();
				//if (CONST_SHOW_STACKTRACE){
				//	err_description = err_description + " " + e.getStackTrace();
				//}
			}else{
				err_description = err_description + ' ' + e.toString();
			}
		}
		nlapiLogExecution('ERROR', 'Error ' + err_title, err_description);
		// send email...
		if (!g_Email)g_Email = '';
		if (g_Email.length>0){
			bl001_sendemail(true, err_title, err_description);
		}
		if(g_Profile_ID){
			if (g_Profile_ID.length >0 && g_Status_Field.length > 0){
				var upd_record = nlapiLoadRecord('customrecord_bl001_nsconnector_status', g_Profile_ID);
				upd_record.setFieldValue(g_Status_Field, 'Error: ' + err_title + '. ' + err_description);
				nlapiSubmitRecord(upd_record, false, true);			
			}
	}
	}catch(e){
		nlapiLogExecution('ERROR', err_title, err_description);
	} 
}
//HTML Home Portlet
function BL001_DrawHTMLPage(request, response)
{
	var context = nlapiGetContext();

	if	(context.getExecutionContext() == 'portlet')
		{
		//var url = context.getSetting('SCRIPT', 'custscript_portlet_url');
		//var title = context.getSetting('SCRIPT', 'custscript_portlet_title');
		var title = "Blackline";
		// fetch the profile record
		var results = nlapiSearchRecord('customrecord_bl001_connector_setup', null, null, [new nlobjSearchColumn('custrecord_bl001_setup_url')]);		
		var content = '';
		if (results){
			var result = results[0];
			var url = result.getValue('custrecord_bl001_setup_url');
			if (url)
				{
				// show a ribbon with the most recent export data
				// use the saved search
				var ribbon = '';
				var results = nlapiSearchRecord('customrecord_bl001_nsconnector_exportlog', CONST_EXPORTLOG_SAVEDSEARCH);
				if (results){
					if (results.length>0){
						var result = results[0];
						var created = result.getValue('created');
						//var link = result.getValue('custrecord_bl001_log_link_to_file');
						var export_parent = result.getValue('custrecord_bl001_config_parent');
						var export_type = result.getValue('custrecord_bl001_log_export_type'); 
						
						ribbon = '<div id="custpage_portlet_ribbon" class="smallgraytextnolink"><ul>';
						ribbon += '<li>Last export file created at: ' + created + '</li>';
						
						if (export_parent){
							if (bl_isNonZeroNumber(export_parent)){
								ribbon += '<li> Type: ' + result.getText('custrecord_bl001_config_parent') + ' ' + export_type.replace("Complete ", "").replace("(","").replace(")","") + '</li>';
								/*
								var profile_link = nlapiResolveURL('RECORD', 'customrecord_bl001_nsconnector_status', export_parent);
								if (profile_link.length>0){
									ribbon += '<li><a href="' + profile_link + '">Open export profile</a></li>';
								}
								*/
							}
						}
						/*
						if (link){
							if (link.length>0){
								ribbon += '<li><a href="' + link +'">Download export file</a></li>';
							}
						}
						*/
						//ribbon += '<li>Click <a target="_blank" href="' + url + '">here</a> to open Blackline login page in a new window.</li>';
						ribbon += '</ul></div>\r\n';
						ribbon += '<style>';
						ribbon += '#custpage_portlet_ribbon li {float:left;margin-left:10px;font-size:13px !important;} #custpage_portlet_ribbon {height:40px;}';
						ribbon += '</style>';
						
					}
				}
				if (ribbon.length>0){
					height = "95%";
				}else{
					height = "100%";
				}
				
				// This is running for Stephen to explore why the Blackline site doesn't show up inside IFRAME
				//content = ribbon + '<iframe frameBorder=0 width=100% height=' + height + ' style=height:640px; src="' + g_connector_settings.url + '"></iframe>';
				//content = ribbon + '<iframe frameBorder=0 width=100% height=' + height + ' style=height:640px; src=' + CONST_IFRAME_URL + '></iframe>';
				
				// this approach scrapes the login page
				//var login_suitelet = nlapiResolveURL('SUITELET', 'customscript_bl001_login_page', '1');
				//content = ribbon + '<iframe frameBorder=0 width=100% height=' + height + ' style=height:640px; src="' + login_suitelet + '"></iframe>';
				
				
				
				// for now, only show the ribbon + link
				content = ribbon;
				if (bl_noempty(url, "").length > 0){
					//content += '<div class="smallgraytextnolink">&nbsp;&nbsp;&nbsp;<a target="_blank" href="' + url + '">Blackline Systems</a>';
					//content += '<br /><br />&nbsp;&nbsp;&nbsp;Click <a target="_blank" href="' + url + '">here</a> to go to your instance</div>';
					content += '&nbsp;&nbsp;&nbsp;Click <a target="_blank" href="' + url + '">here</a> to go to your Blackline instance</div>';
					
				}
			}
		}
		if (content.length==0){
			var url = nlapiResolveURL("SUITELET", CONST_BLACKLINE_SETUP_SUITELET, "1");
			if (!url)url = '';
			if ( url.length >0 ){
				url = ' <nobr><a href="' + url + '">Click here for Blackline Data Connect settings.</a></nobr>';
			}
			content = '<div id="custpage_blackline_portlet" class="input"><p>The Blackline Data Connect setup is not complete. This Portlet is intended to show a link to the Blackline web site.' + url + '</p></div>';
		}

		request.setTitle(title); //really a portlet context
		request.setHtml(content);
		}

	if	(context.getExecutionContext() == 'suitelet')
		{
		var url = context.getSetting('SCRIPT', 'custscript_suitelet_url');
		var title = context.getSetting('SCRIPT', 'custscript_suitelet_title');
		//var content = '<iframe frameBorder=0 width=1200px height=100% style="height:640px;" src=' + url + '></iframe>';
		var content = '<a target="_blank" href="' + url + '">Blackline ' + url + '</a>';
		var newForm = nlapiCreateForm('drawHTML');
		var newField = newForm.addField ('content', 'inlinehtml', title);
		newForm.addField('extra', 'inlinehtml', '');
		newForm.setTitle (title);
		newField.setLayoutType('outsidebelow');
		newField.setDefaultValue (content);
		response.writePage( newForm );
		}
}
// off_set_from_current_period must be 0/-1/1 to represent current period, last period, next period
/*
nlapiLogExecution('AUDIT', 'next quarter', bl001_get_period(1, true).enddate);
nlapiLogExecution('AUDIT', 'current quarter', bl001_get_period(0, true).enddate);
nlapiLogExecution('AUDIT', 'last quarter', bl001_get_period(-1, true).enddate);
nlapiLogExecution('AUDIT', 'this year', bl001_get_period(0, false, true).enddate);
nlapiLogExecution('AUDIT', 'last year', bl001_get_period(-1, false, true).enddate);
*/
function bl001_get_period(off_set_from_current_period, use_quarter, use_year){
	var curr_period = bl001_Get_Accounting_Period(new Date, use_quarter, use_year);
	if (off_set_from_current_period && curr_period){
		var new_period = null;
		if(off_set_from_current_period < 0){
			new_period = nlapiAddDays(nlapiStringToDate(curr_period.startdate), -1);
		}else{
			new_period = nlapiAddDays(nlapiStringToDate(curr_period.enddate), 1);
		}
		if (new_period){
			return bl001_Get_Accounting_Period(new_period, use_quarter, use_year);
		}
	}else{
		return curr_period;
	}
	return null;
}
//------------------------------------------------------------------
//Function: 		bl001_Get_Accounting_Period
//Record: 			Accounting Period
//Script Type: 		
//Description:  	Takes a date and returns the accounting period begin date, end date
//Date:				MZ 20121018
//Enhanced:			MZ 20121113
//					SG 20130411 add return object and ability to use quarter, year Boolean parameters
//------------------------------------------------------------------
function bl001_Get_Accounting_Period(transdate, use_quarter, use_year)
{
	//set search criteria: find all periods that date falls into that aren't quarter or year
	var id = null;
	var periodname = null;
	var enddate = null;
	var startdate = null;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('startdate', null, 'onorbefore', transdate);
	filters[1] = new nlobjSearchFilter('enddate', null, 'onorafter', transdate);
	if (use_quarter){
		filters[2] = new nlobjSearchFilter('isquarter', null, 'is', 'T');
	}else{
		filters[2] = new nlobjSearchFilter('isquarter', null, 'is', 'F');	
	}	
	if (use_year){
		filters[3] = new nlobjSearchFilter('isyear', null, 'is', 'T');	
	}else{
		filters[3] = new nlobjSearchFilter('isyear', null, 'is', 'F');
	}
	
	filters[4] = new nlobjSearchFilter('isadjust', null, 'is', 'F'); // 01/21/2013 <sean>
	
	var recordtype = 'accounting' + 'period';
	var searchresults = nlapiSearchRecord(recordtype, null, filters, [new nlobjSearchColumn('periodname'), new nlobjSearchColumn('enddate'), new nlobjSearchColumn('startdate')]);
	if (searchresults != null && searchresults.length>0){
		id = searchresults[0].getId();
		periodname = searchresults[0].getValue('periodname');
		enddate = searchresults[0].getValue('enddate');
		startdate = searchresults[0].getValue('startdate');
	}
	
	if (!id){
		return null;
	}
	
	return {id:id, periodname:periodname, enddate:enddate, startdate:startdate};
}
//------------------------------------------------------------------
//Function: 		bl001_Get_Accounting_Period_First
//Record: 			Accounting Period
//Script Type: 		
//Description:  	Find the earliest date
//Date:				SG 20130819
//------------------------------------------------------------------
function bl001_Get_Accounting_Period_First(transdate, use_quarter, use_year)
{
	//set search criteria: find all periods that date falls into that aren't quarter or year
	var id = null;
	var periodname = null;
	var enddate = null;
	var startdate = null;
	
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('startdate', null, 'onorbefore', transdate);
	filters[1] = new nlobjSearchFilter('enddate', null, 'onorafter', transdate);
	if (use_quarter){
		filters[2] = new nlobjSearchFilter('isquarter', null, 'is', 'T');
	}else{
		filters[2] = new nlobjSearchFilter('isquarter', null, 'is', 'F');	
	}	
	if (use_year){
		filters[3] = new nlobjSearchFilter('isyear', null, 'is', 'T');	
	}else{
		filters[3] = new nlobjSearchFilter('isyear', null, 'is', 'F');
	}
	
	filters[4] = new nlobjSearchFilter('isadjust', null, 'is', 'F'); // 01/21/2013 <sean>
	
	var recordtype = 'accounting' + 'period';
	var searchresults = nlapiSearchRecord(recordtype, null, filters, [new nlobjSearchColumn('periodname'), new nlobjSearchColumn('enddate'), new nlobjSearchColumn('startdate')]);
	if (searchresults != null && searchresults.length>0){
		id = searchresults[0].getId();
		periodname = searchresults[0].getValue('periodname');
		enddate = searchresults[0].getValue('enddate');
		startdate = searchresults[0].getValue('startdate');
	}
	
	if (!id){
		return null;
	}
	
	return {id:id, periodname:periodname, enddate:enddate, startdate:startdate};
}

//a simple list ID/Name lookup for Classes, Departments
function bl001_lookuplist(rectype)
{
	this.rectype = rectype;
    this.list = new Array();		// collection values
    this.keys = new Array();		// list of keys

    // return this.list as an object for JSON.stringify
    this.list_obj = function()
    {
    	var obj = [];
    	var klen = this.keys.length;
    	for (var i=0; i<klen; i++){
    		var key = this.keys[i];
    		var strKey = '_'.concat(key);
    		obj[obj.length] = key.concat('=').concat(this.list[strKey]);
    	}
    	return obj;
    };
    
    this.load = function()
    {
    	
    	var keep_looping = true;
    	var last_id = '';
    	while (keep_looping){
	    	var columns = new Array();
	    	if (this.rectype=='account'){
	        	columns[0] = new nlobjSearchColumn('name');
	    		columns[1] = new nlobjSearchColumn('t'+'ype');
	    		columns[2] = new nlobjSearchColumn('n'+'umber');
	    		columns[3] = new nlobjSearchColumn('g'+'eneralratetype');
	    		columns[4] = new nlobjSearchColumn('is'+'inactive');
	    		columns[5] = new nlobjSearchColumn('custrecord_bl001_account_export_type');
	    	}
	    	if (this.rectype=='accountingperiod'){
	        	columns[0] = new nlobjSearchColumn('period'+'name');
	    		columns[1] = new nlobjSearchColumn('start'+'date');
	    		columns[2] = new nlobjSearchColumn('end'+'date');
	    	}
	    	var filters = [new nlobjSearchFilter('isinactive', null, 'anyof', ['T','F','@NONE@'])];
	    	if (last_id.length>0){
	    		filters[filters.length] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', last_id);
	    	}
	    	
	    	var results = null;
	    	try
	    	{
	    		if (this.rectype=='account'){
	    			results = nlapiSearchRecord(this.rectype, CONST_ACCOUNT_LIST_SAVEDSEARCH, filters, columns);
	    		}else{
	    			// this defines what type of record to load
	    			results = nlapiSearchRecord(this.rectype, null, filters, columns);
	    		}
	    	} catch (e)
	    	{
	    		return;
	    	}
	    	
	        // loop records and add them to the internal arrays
	        var rec_len = 0;
	        keep_looping = false;
	        if (results)
	        {
	            if ( results.length > 0)
	            {
	            	rec_len = results.length;
	            	for (var i=0; i<rec_len; i++){
	            		var result = results[i];
	            		var _id = result.getId();
	            		last_id = _id;
	            		var _name = '';
	                	if (this.rectype=='account'){
	                    	_name = result.getValue('name');
	                		_name += '|' + result.getValue('type');
	                		_name += '|' + result.getValue('number');
	                		_name += '|' + result.getValue('generalratetype');
	                		_name += '|' + result.getValue('isinactive');
	                		_name += '|' + result.getValue('custrecord_bl001_account_export_type');
	                		
	                	}
	                	if (this.rectype=='accountingperiod'){
	                		_name = result.getValue('periodname');
	                		_name += '|' + result.getValue('startdate');
	                		_name += '|' + result.getValue('enddate');
	                	}
	                	this.add(_id, _name);         
	            	}
	            	
	            	if (results.length == CONST_ACCOUNT_MAX_RECORDS){
	            		keep_looping = true;
	            	}
	            };
	        }
	          
    	}
    	return this.keys.length;
    };

    this.count = function()
    {
        return this.keys.length;
    };
    
    this.add = function(_id, _name)
    {
    	var key = _id;
        // only add this item if it doesn't exist in the collection
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            this.keys[this.keys.length] = key;
            this.list[strKey] = _name;
        };
    };

    this.name = function(key)
    {
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return bl_noempty(key,"");
        } else
        {
        	if (this.rectype=='account' || this.rectype=='accountingperiod'){
        		return bl_noempty(this.list[strKey].split('|')[0],key);
        	}else{
        		return bl_noempty(this.list[strKey],key) ;
        	}
        };
    };
    this.accounttype = function(key)  // return account type for account list
    {
    	if (this.rectype!='account')return "";
    	
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return "";
        } else
        {
            return bl_noempty(this.list[strKey].split('|')[1],key) ;
        };
    };
    this.number = function(key)  // return account type for account list
    {
    	if (this.rectype!='account')return "";
    	
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return "";
        } else
        {
            return bl_noempty(this.list[strKey].split('|')[2],key) ;
        };
    };
    this.generalratetype = function(key)  // return account type for account list
    {
    	if (this.rectype!='account')return "";
    	
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return "";
        } else
        {
            return bl_noempty(this.list[strKey].split('|')[3],key) ;
        };
    };
    this.isinactive = function(key)  // return account type for account list
    {
    	if (this.rectype!='account')return "";
    	
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return "";
        } else
        {
            return bl_noempty(this.list[strKey].split('|')[4],key) ;
        };
    };
    this.export_type = function(key)  // return account type for account list
    {
    	if (this.rectype!='account')return "";
    	
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return "";
        } else
        {
            return bl_noempty(this.list[strKey].split('|')[5],key) ;
        };
    };
    // accounting period
    this.startdate = function(key)  // return accounting period
    {
    	if (this.rectype!='accountingperiod')return "";
    	
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return "";
        } else
        {
            return bl_noempty(this.list[strKey].split('|')[1],key) ;
        };
    };
    this.enddate = function(key)  // return for accounting period
    {
    	if (this.rectype!='accountingperiod')return "";
    	
        var strKey = '_' + key;
        if (!(strKey in this.list))
        {
            return "";
        } else
        {
            return bl_noempty(this.list[strKey].split('|')[2],key) ;
        };
    };
    
    
    // auto load the list
    if (this.rectype){
    	if (this.rectype.length>0){
    		this.load();
    	}
    }

}

//a list to hold & lookup consolidated exchange rates
function bl001_exchangerates(period_id, parent_sub_id)
{
	this.period_id = period_id;
	this.parent_sub_id = parent_sub_id;
	this.rectype = "consolidatedexchangerates";
	this.list = new Array();		// collection values
	this.keys = new Array();		// list of keys

	this.load = function(){
		// if the client has multi-calendar, we need to go to workaround custom record for consolidated exch rates
		if (g_connector_settings.donotuse_exchrate_ws){
			this.loadrec();
		}else{
			this.loadws();
		}
	};
	this.loadrec = function(){
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord_bl001_exchrate_tosub', null, 'is', this.parent_sub_id);
		filters[1] = new nlobjSearchFilter('custrecord_bl001_exchrate_period', null, 'is', this.period_id);
		nlapiLogExecution('DEBUG', 'parent period', this.parent_sub_id + ' | ' + this.period_id);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_bl001_exchrate_fromsub');
		columns[1] = new nlobjSearchColumn('custrecord_bl001_exchrate_current');
		columns[2] = new nlobjSearchColumn('custrecord_bl001_exchrate_average');
		columns[3] = new nlobjSearchColumn('custrecord_bl001_exchrate_historical');
		var results = bl_noempty(nlapiSearchRecord('customrecord_bl001_exchange_rates', null, filters, columns),{length:0});
		nlapiLogExecution('DEBUG', 'bl001_exchangerates results.length', results.length);
		if (results.length>0){
			var rlen = results.length;
			nlapiLogExecution('DEBUG', 'bl001_exchangerates len', rlen);
			for (var r=0; r<rlen; r++){
				var result = results[r];
		  		var _id = result.getValue("custrecord_bl001_exchrate_fromsub");
		  		var _name = result.getValue("custrecord_bl001_exchrate_current");
		     		_name += '|' + result.getValue("custrecord_bl001_exchrate_average");
		     		_name += '|' + result.getValue("custrecord_bl001_exchrate_historical");
		     		
		      	this.add(_id, _name);         
				
			}
		}
		
	};
	this.loadws = function(){
	  	
	  	// build the request string
	  	var str_xml = xml_getConsolidatedExchangeRate(this.period_id, this.parent_sub_id);
	  	
	  	// fetch the xml
	  	var soap_action = 'getConsolidatedExchangeRate';
	  	var resp_xml = call_ws(str_xml, soap_action);
	  	nlapiLogExecution('DEBUG', 'exch rate', resp_xml);
		var xml = nlapiStringToXML(resp_xml);
		var nodes = nlapiSelectNodes(xml, "//platformCore:consolidatedExchangeRate");
		/*
		<platformCore:consolidatedExchangeRateList>
		<platformCore:consolidatedExchangeRate>
		<platformCore:period internalId="13"/>
		<platformCore:fromSubsidiary internalId="2"/>
		<platformCore:toSubsidiary internalId="1"/>
		<platformCore:currentRate>1.0</platformCore:currentRate>
		<platformCore:averageRate>1.0</platformCore:averageRate>
		<platformCore:historicalRate>1.0</platformCore:historicalRate>
		</platformCore:consolidatedExchangeRate>
		 */
		var nlen = nodes.length;
		nlapiLogExecution('DEBUG', 'bl001_exchangerates nodes.length for period:'+this.period_id + ' sub:'+ this.parent_sub_id, nlen);
		// load the rows from the response nodes
		for (var n=0; n<nlen; n++){
			var node = nodes[n];
			var row = {};
			row["fromSubsidiary"] = null;
			row["currentRate"] = null;
			row["averageRate"] = null;
			row["historicalRate"] = null;
			if (node.hasChildNodes()){
				var nnode = node.firstChild;
				while (nnode){
					var fld = nnode.nodeName.split(':')[1];
					var val = null;
					if (fld=='currentRate' || fld=='averageRate' || fld=='historicalRate'){
						val = nnode.firstChild.nodeValue;
					}else if (fld == 'fromSubsidiary'){
						val = nnode.attributes.getNamedItem('internalId').value;
					}else{
						// ignore the other elements
						val = '';
					}
					if (val.length>0){
						row[fld] = val;
					}
					
					nnode = nnode.nextSibling;
				}
			}
			
  		var _id = row["fromSubsidiary"];
  		var _name = row["currentRate"];
     		_name += '|' + row["averageRate"];
     		_name += '|' + row["historicalRate"];
     		
      	this.add(_id, _name);         
			
		}
	};

  this.count = function()
  {
      return this.keys.length;
  };
  
  this.add = function(_id, _name)
  {
  	var key = _id;
      // only add this item if it doesn't exist in the collection
      var strKey = '_' + key;
      if (!(strKey in this.list))
      {
          this.keys[this.keys.length] = key;
          this.list[strKey] = _name;
      };
  };

  this.currentRate = function(key)
  {
	  if (!g_connector_settings.bOneWorld){
		  return 1;
	  }
      var strKey = '_' + key;
      if (!(strKey in this.list))
      {
    	  if (g_connector_settings.donotuse_exchrate_ws){
    		  return 1;
    	  }else{
    		  return 0;
    	  }
      } else
      {
     	  return bl_noempty(this.list[strKey].split('|')[0],0);
      };
  };
  this.averageRate = function(key)  // return account type for account list
  {
	  if (!g_connector_settings.bOneWorld){
		  return 1;
	  }
      var strKey = '_' + key;
      if (!(strKey in this.list))
      {
    	  if (g_connector_settings.donotuse_exchrate_ws){
    		  return 1;
    	  }else{
    		  return 0;
    	  }
      } else
      {
          return bl_noempty(this.list[strKey].split('|')[1],0) ;
      };
  };
  this.historicalRate = function(key)  // return account type for account list
  {
	  if (!g_connector_settings.bOneWorld){
		  return 1;
	  }
      var strKey = '_' + key;
      if (!(strKey in this.list))
      {
    	  if (g_connector_settings.donotuse_exchrate_ws){
    		  return 1;
    	  }else{
    		  return 0;
    	  }
      } else
      {
          return bl_noempty(this.list[strKey].split('|')[2],0) ;
      };
  };
  
  // auto load the list
  if (this.rectype){
  	if (this.rectype.length>0){
		if (g_connector_settings.bOneWorld){
			this.load();
		}
  	}
  }

}



//a list to hold bank/cc accounts and account currency balances
function bl001_bank_balances(period_end_date, save_search)
{
	
	this.save_search = save_search;
	this.period_end_date = period_end_date;
	this.custom_search = '';
	this.rectype = "transaction";
	this.list = new Array();		// collection values
	this.keys = new Array();		// list of keys
	

	this.load = function(){
		var new_filters = new Array();
		new_filters[new_filters.length] = new nlobjSearchFilter('accounttype', null, 'anyof', ['Bank', 'CreditCard']);
		new_filters[new_filters.length] = new nlobjSearchFilter('enddate',   'accountingperiod', 'onorbefore', this.period_end_date);
		var results = null;
	  	try
	  	{
			// this defines what type of record to load
			results = nlapiSearchRecord('transaction', this.save_search, new_filters, null);
			nlapiLogExecution('DEBUG', 'results.length', results.length);
	  	} catch (e)
	  	{
	  		return;
	  	}
  	
      // loop records and add them to the internal arrays
      var rec_len = 0;
      if (results)
      {
          if ( results.length > 0)
          {
          	rec_len = results.length;
          	for (var i=0; i<rec_len; i++){
          		var result = results[i];
          		var cols = result.getAllColumns();
          		var _id = result.getValue(cols[11]);	// account id
          		var _curr = result.getValue(cols[10]);	// currency
          		var _bal = result.getValue(cols[0]); 	// ending balance
          		var _name = '';
          		_name += _curr + '|' + _bal;
              	this.add(_id, _name);         
          	}
          }
        }
  };
	
	this.count = function()
	{
	    return this.keys.length;
	};
	
	this.add = function(_id, _name)
	{
		var key = _id;
	    var strKey = '_' + key;
	    if (!(strKey in this.list))
	    {
		    // only add this item if it doesn't exist in the collection
	        this.keys[this.keys.length] = key;
	        this.list[strKey] = _name;
	    }else{
	    	// add the new balance to the existing row
	    	var curr = this.currency(_id); 
	    	var bal = parseFloat(this.balance(_id)) + parseFloat(bl_noempty(_name.split('|')[1],0));
	    	_name = curr + '|' + bal;
	    	this.list[strKey] = _name;
	    }
	};
	
	this.currency = function(key)
	{
	    var strKey = '_' + key;
	    if (!(strKey in this.list))
	    {
	        return bl_noempty(key,"");
	    } else
	    {
	   		return bl_noempty(this.list[strKey].split('|')[0],key);
	    };
	};
	this.balance = function(key)  // return account type for account list
	{
	    var strKey = '_' + key;
	    if (!(strKey in this.list))
	    {
	        return "";
	    } else
	    {
	        return bl_noempty(this.list[strKey].split('|')[1],0) ;
	    };
	};

	// auto load the list
	if (this.rectype){
		if (this.rectype.length>0){
			this.load();	
		}
	};


}


//------------------------------------------------------------------
//Function:         BL001_Account_BeforeSubmit
//Script Type:      BeforeSubmit - Account record
//Script ID:
//Deployment ID:
//Description:		when saving the account, if type is Bank, store the bank currency copy in custrecord_bl001_bank_currency
//
//Date:             SG 20140403
//------------------------------------------------------------------
function BL001_Account_BeforeSubmit(type)
{
	nlapiLogExecution('AUDIT', 'BL001_Account_BeforeSubmit started.');
	try{
		if (type=='create'){
			var acc_type = nlapiGetFieldText('accttype');
			if (acc_type == CONST_ACCOUNT_TYPE_BANK){
				var acc_curr = nlapiGetFieldValue('currency');
				nlapiSetFieldValue('custrecord_bl001_bank_currency', acc_curr);
			}
		}
		
	}catch(e){
		nlapiLogExecution('ERROR', 'Error updating bank currency');
	}
}


//------------------------------------------------------------------
//Function:         BL001_Sched_AccountCurrency
//Script Type:      Scheduled script
//Script ID:
//Deployment ID:
//Description:		search bank accounts and update custrecord_bl001_bank_currency
//
//Date:             SG 20140403
//------------------------------------------------------------------
function BL001_Sched_AccountCurrency(type)
{
	nlapiLogExecution('AUDIT', 'BL001_Sched_AccountCurrency started.');
	
	var filt = new Array();
	filt[0] = new nlobjSearchFilter('custrecord_bl001_bank_currency', null, 'is', '@NONE@');
	filt[1] = new nlobjSearchFilter('type', null, 'is', CONST_ACCOUNT_TYPE_BANK);
	var results = bl_noempty(nlapiSearchRecord('account', null, filt, null),{length:0});
	var rlen = results.length;
	nlapiLogExecution('DEBUG', 'results.length', rlen);
	for (var r=0; r<rlen; r++){
		var result = results[r];
		var id = result.getId();
		var acc_record = nlapiLoadRecord('account', id);
		var acc_curr = acc_record.getFieldValue('currency');
		acc_record.setFieldValue('custrecord_bl001_bank_currency', acc_curr);
		try{
			nlapiSubmitRecord(acc_record, false, true);	
		}catch(e){
			
		}
	}
}
//JSON handlers
function replacer(key, value) {
    if (typeof value === 'number' && !isFinite(value)) {
        return String(value);
    }
    return value;
}
function reviver(key, value) {
    var type;
    if (value && typeof value === 'object') {
        type = value.type;
        if (typeof type === 'string' && typeof window[type] === 'function') {
            return new (window[type])(value);
        }
    }
    return value;
}
