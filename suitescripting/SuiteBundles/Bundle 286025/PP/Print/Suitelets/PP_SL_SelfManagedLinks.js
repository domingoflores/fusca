/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Mar 2016     mmenlove
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	var context = nlapiGetContext();
	
	var list = nlapiCreateList('Process Payments', false);
	list.addColumn('link', 'text', 'Options');
	//list.setStyle('plain');
	
	var action = context.getSetting('SCRIPT','custscript_pp_process_action');
	var ppEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_paypal_mp');
	var wachEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_wach');
	
	
	var indentStr = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
	var rows = [];
	
	rows.push({'link':'<b>AvidPay Network</b<'});
	var apnEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_apn_network');

	if(apnEnabled == 'T'){
		rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_process_apn_payments','customdeploy_pp_sl_process_apn_payments')+'">AvidPay Network Payments</a>'});
		rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('TASKLINK', 'LIST_CUST_' + getRecordTypeId('customrecord_pp_apn_payment_batch'))+'">AvidPay Payment Batches</a>'});
	}
	else{
		rows.push({'link': 'AvidPay is not enabled. Please go to AvidXchange -> Setup -> Preferences to enable the AvidPay module'});
	}

	rows.push({'link':'<b>Self-Managed</b>'});
	rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_processpayments')+'">Checks and ACH</a>'});
	if(ppEnabled){
		rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_process_paypal_payments','customdeploy_pp_process_paypal_payments')+'">PayPal Mass Payments</a>'});
	}
	if(wachEnabled){
		rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_wach')+'">Withdrawal ACH</a>'});
	}
	rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_blank_checks','customdeploy_pp_sl_blank_checks')+'">Blank Checks</a>'});
	rows.push({'link':'<b>File Generation</b>'});
	rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_ach_file_gen','customdeploy_pp_sl_ach_file_gen')+'">ACH</a>'});
	rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_pospay_file_gen','customdeploy_pp_sl_pospay_file_gen')+'">Positive Pay</a>'});
	rows.push({'link':'<b>Reprocess Payments</b>'});
	rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_reprocesspayments')+'">Checks and ACH</a>'});
	if(wachEnabled){
		rows.push({'link':indentStr + '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_processpayments','customdeploy_pp_sl_rwach')+'">Withdrawal ACH</a>'});
	}
	rows.push({'link':'<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_filerecovery','customdeploy_pp_sl_filerecovery')+'">Pending Downloads</a>'});
	rows.push({'link':'<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_ach_invite','customdeploy_pp_sl_ach_invite')+'">ACH Invites</a>'});
	rows.push({'link':'<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_ach_reset','customdeploy_pp_sl_ach_reset')+'">ACH File Generation Reset</a>'});
	
	list.addRows(rows);
	
	response.writePage(list);
}


function getRecordTypeId(recType){
	var rec = nlapiCreateRecord(recType);

	return rec.getFieldValue('rectype');
}