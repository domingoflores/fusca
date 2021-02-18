/**
 * User Event Script for the PP APN Payment Batch custom record. This script does the following:
 * 
 * 	- Schedule customdeploy_pp_ss_apn_batch_sync_manual when record is saved and sync is true
 *  - Redirect create record UI to the process apn payment suitelet
 *  - Disables UI fields on edit
 *  - Adds a sublist of transactions associated to the batch
 * 
 * @appliedtorecord customrecord_pp_apn_payment_batch
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2015     mmenlove
 *
 */


function userEventBeforeLoad(type, form){
	var context = nlapiGetContext();
	
	if(type == 'create' && context.getExecutionContext() == 'userinterface'){
		nlapiSetRedirectURL('SUITELET', 'customscript_pp_sl_process_apn_payments', 'customdeploy_pp_sl_process_apn_payments');
		return;
	}
	
	if(type == 'view' || type == 'edit'){
		if(nlapiGetFieldText('custrecord_pp_apn_pb_status') != 'Fail'){
			form.setScript('customscript_pp_cs_apn_payment_batch_rec');
			form.addButton('custpage_sync','Sync','triggerAPNSync()');
		}
		
	
		addPaymentSublist();
		
		// disable fields
		if(type == 'edit' && context.getExecutionContext() == 'userinterface'){
			var fieldsToDisable = ['custrecord_pp_apn_batch_number','custrecord_pp_apn_external_batch_status','custrecord_pp_apn_batch_hash',
			                       'custrecord_pp_apn_pb_payments','custrecord_pp_apn_pb_error_message','custrecord_pp_apn_pb_status',
			                       'custrecord_pp_apn_batch_last_synced'];
			
			if(nlapiGetFieldText('custrecord_pp_apn_pb_status') == 'Fail'){
				fieldsToDisable.push('custrecord_pp_apn_pb_sync');
			}
			for(var i = 0; i < fieldsToDisable.length; i++){
				$PPS.setDisplayType(form.getField(fieldsToDisable[i]),'disabled');
			}
		}
	}
	
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_pp_apn_payment_batch
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	nlapiLogExecution('DEBUG','userEventAfterSubmit','start');
	var context = nlapiGetContext();
	//if(context.getExecutionContext() == '')
	if(type == 'edit'){
		var needsSync = nlapiGetFieldValue('custrecord_pp_apn_pb_sync');
		if(needsSync == 'T'){
			var result = nlapiScheduleScript('customscript_pp_ss_apn_batch_sync', 'customdeploy_pp_ss_apn_batch_sync_manual');
			nlapiLogExecution('DEBUG','execure scheduled script result',result);
		}
	}
	
	nlapiLogExecution('DEBUG','userEventAfterSubmit','end');
}


function addPaymentSublist(){
	// setup sublist ui
	var tab = form.addTab('custpage_transactions', 'Transactions');
	var sublist = form.addSubList('custpage_apn_batch_transactions', 'list', 'Associated Payments','custpage_transactions');
	
	sublist.addField('custpage_entity','text','Entity');
	sublist.addField('custpage_tranid','text','Check #');
	sublist.addField('custpage_amount','currency','Amount');
	sublist.addField('custpage_status','text','APN Status');
	sublist.addField('custpage_payment_method','text','APN Payment Method');
	sublist.addField('custpage_reason_code','text','Error Reason');
	
	var paymentSrs = findBatchesPayments();
	var sr;
	if (paymentSrs != null) {
		for(var i = 0; i < paymentSrs.length; i++){
			sr = paymentSrs[i];
			sublist.setLineItemValue('custpage_entity',i+1,sr.getText('entity'));
			sublist.setLineItemValue('custpage_tranid',i+1,'<a href="' + nlapiResolveURL('RECORD', sr.getRecordType(), sr.getId()) +'" >' + sr.getValue('tranid') + '</a>');
			sublist.setLineItemValue('custpage_amount',i+1,sr.getValue('amount'));
			sublist.setLineItemValue('custpage_status',i+1,sr.getValue('custbody_pp_apn_payment_status'));
			
			var pm = sr.getValue('custbody_pp_apn_payment_method');
			if(pm == 'Check' && sr.getValue('custbody_pp_apn_check_number')){
				pm += ' - Check #' + sr.getValue('custbody_pp_apn_check_number');
			}
			sublist.setLineItemValue('custpage_payment_method',i+1,pm);
			
			sublist.setLineItemValue('custpage_reason_code',i+1,sr.getValue('custbody_pp_apn_reason_for_exception'));
			
		}
	}
}

function findBatchesPayments(){
	
	var paymentIds = JSON.parse(nlapiGetFieldValue('custrecord_pp_apn_pb_payments'));
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('internalid',null,'anyof',Object.keys(paymentIds)));
	filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
	
	columns.push(new nlobjSearchColumn('entity'));
	columns.push(new nlobjSearchColumn('trandate'));
	columns.push(new nlobjSearchColumn('tranid'));
	columns.push(new nlobjSearchColumn('account'));
	columns.push(new nlobjSearchColumn('recordtype'));
	columns.push(new nlobjSearchColumn('amount'));
	columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_status'));
	columns.push(new nlobjSearchColumn('custbody_pp_apn_reason_for_exception'));
	columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_method'));
	columns.push(new nlobjSearchColumn('custbody_pp_apn_check_number'));

	
	return nlapiSearchRecord('transaction',null,filters,columns);
}