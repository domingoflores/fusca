/**
 * User event script for the PP PayPal Mass Payments custom record type
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Apr 2014     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord  customrecord_pp_paypal_mass_payments
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	var context = nlapiGetContext();
	
	if(type == 'create' && context.getExecutionContext() == 'userinterface'){
		nlapiSetRedirectURL('SUITELET', 'customscript_pp_process_paypal_payments', 'customdeploy_pp_process_paypal_payments');
	}
		
	// disable fields
	if(type == 'edit' && context.getExecutionContext() == 'userinterface'){
		var fieldsToDisable = ['custrecord_pp_paypal_mp_status','custrecord_pp_paypal_mp_error_code','custrecord_pp_paypal_mp_server_response',
		                       'custrecord_pp_paypal_mp_payment_status','custrecord_pp_paypal_mp_account',
		                       'custrecord_pp_paypal_mp_fee','custrecord_pp_paypal_mp_total_paid','custrecord_pp_paypal_mp_total'];
		
		for(var i = 0; i < fieldsToDisable.length; i++){
			$PPS.setDisplayType(form.getField(fieldsToDisable[i]),'disabled');
		}
		
		// Make MassPay transactions sublist readonly from ui
		buildTranSublist(form);
		var sublist = form.getSubList('recmachcustrecord_pp_paypal_mptran_mass_payment');
		sublist.setDisplayType('hidden');
		
	}
	if(type == 'view' && context.getExecutionContext() == 'userinterface'){
		// Make MassPay transactions sublist readonly from ui
		buildTranSublist(form);
		var sublist = form.getSubList('recmachcustrecord_pp_paypal_mptran_mass_payment');
		sublist.setDisplayType('hidden');
	}
	
}

/**
 * Builds a readonly sublist of the custrecord_pp_paypal_mptran_mass_payment custom record type
 * associated to this mass payment record type
 * 
 * @param {nlobjForm} form
 */
function buildTranSublist(form){
	
	// Denied
	var statuses = ['Completed','Failed','Denied','Returned','Reversed','Unclaimed','Pending','Blocked'];
	var statusCount = {};
	for(var i = 0; i < statuses.length; i++){
		statusCount[statuses[i]] = 0;
	}
	
	// setup sublist ui
	var tab = form.addTab('custpage_mpstran', 'MassPay Transactions');
	var sublist = form.addSubList('custpage_mp_transactions', 'staticlist', 'Associated Payments','custpage_mpstran');
	sublist.addField('custpage_status','text','Status');
	sublist.addField('custpage_payment','text','Transaction');
	sublist.addField('custpage_entity','text','Entity');
	sublist.addField('custpage_txn_id','text','Mass Pay Txn Id');
	sublist.addField('custpage_reason_code','text','Reason Code');
	sublist.addField('custpage_fee','currency','Fee');
	sublist.addField('custpage_gross_amt','currency','Gross Amount');
	
	// get search results
	var searchResults = massPaymentsTransactionSearch(nlapiGetRecordId());
	var transactionBaseUrl = '/app/accounting/transactions/transaction.nl?id=';
	
	// write to sublist
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var sr = searchResults[i];
			var status = sr.getValue('custrecord_pp_paypal_mptran_tran_status');
			sublist.setLineItemValue('custpage_status',i+1,status);
			sublist.setLineItemValue('custpage_payment', i+1, '<a href="' + transactionBaseUrl + sr.getValue('custrecord_pp_paypal_mptran_transaction') + '">' + sr.getText('custrecord_pp_paypal_mptran_transaction') + '</a>');
			sublist.setLineItemValue('custpage_entity',i+1,sr.getText('entity','custrecord_pp_paypal_mptran_transaction'));
			sublist.setLineItemValue('custpage_txn_id',i+1,sr.getValue('custrecord_pp_paypal_mptran_mp_txn_id'));
			sublist.setLineItemValue('custpage_reason_code',i+1,sr.getValue('custrecord_pp_paypal_mptran_reason_code'));
			sublist.setLineItemValue('custpage_fee',i+1,sr.getValue('custrecord_pp_paypal_mptran_fee'));
			sublist.setLineItemValue('custpage_gross_amt',i+1,sr.getValue('custrecord_pp_paypal_mptran_gross_amt'));
			
			if(status){
				statusCount[status] ++;
			}
		}
	}
	
	var fg = form.addFieldGroup('custpage_summary_grp', 'Status Summary');
	fg.setSingleColumn(true);
	var statusSummary = form.addField('custpage_summary', 'inlinehtml', 'Status Summary',null,'custpage_summary_grp');
	var html = '';
	for(var i = 0; i < statuses.length; i++){
		html += statuses[i] + ': ' + statusCount[statuses[i]] + '<br/>';
	}
	statusSummary.setDefaultValue(html);
}

/**
 * Get Mass Pay transaction line item details
 * 
 * @param massPayRecId
 * @returns {Array}
 */
function massPaymentsTransactionSearch(massPayRecId){
	var filters = [];
	var columns = [];
	
	//columns.push(new nlobjSearchColumn('recordtype','custrecord_pp_paypal_mptran_transaction'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_transaction'));
	columns.push(new nlobjSearchColumn('entity','custrecord_pp_paypal_mptran_transaction'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_tran_status'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_mp_txn_id'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_reason_code'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_fee'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_gross_amt'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_currency_cod'));

	filters.push(new nlobjSearchFilter('custrecord_pp_paypal_mptran_mass_payment',null,'is',massPayRecId));
	filters.push(new nlobjSearchFilter('mainline','custrecord_pp_paypal_mptran_transaction','is','T'));

	return nlapiSearchRecord('customrecord_pp_paypal_mp_transactions', null, filters, columns);
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	nlapiLogExecution('DEBUG', 'userEventAfterSubmit', 'start');
	if(type == 'create' || type == 'edit'){
		if(nlapiGetFieldValue('custrecord_pp_paypal_mp_needs_sync') == 'T'){
			nlapiScheduleScript('customscript_pp_ss_paypal_masspay_sync', 'customdeploy_pp_ss_paypal_masspay_sync', {custscript_masspay_id : nlapiGetRecordId()});		
		}
	}
}
