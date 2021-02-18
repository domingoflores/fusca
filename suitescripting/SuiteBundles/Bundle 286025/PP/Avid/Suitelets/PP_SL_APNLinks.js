/**
 * Displays a list of links to APN Suitelets
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Dec 2014     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
		var context = nlapiGetContext();
		
		var list = nlapiCreateList('AvidPay Payments', false);
		list.addColumn('link', 'text', 'Link');
		
		var apnEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_apn_network');

		if(apnEnabled == 'T'){
			list.addRow({'link': '<a href="'+nlapiResolveURL('SUITELET','customscript_pp_sl_process_apn_payments','customdeploy_pp_sl_process_apn_payments')+'">AvidPay Network Payments</a>'});
			list.addRow({'link': '<a href="'+nlapiResolveURL('TASKLINK', 'LIST_CUST_' + getRecordTypeId('customrecord_pp_apn_payment_batch'))+'">AvidPay Payment Batches</a>'});
		}
		else{
			list.addRow({'link': 'AvidPay is not enabled. Please go to AvidXchange -> Setup -> Preferences to enable the AvidPay module'});
		}
		
		response.writePage(list);
}


function getRecordTypeId(recType){
	var rec = nlapiCreateRecord(recType);

	return rec.getFieldValue('rectype');
}