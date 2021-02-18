/**
 * This client script is used to set the default value of the CAC ACH checkbox on payment records
 * when payments are made through the creation form.
 * 
 * @author 360 Cloud Solutions
 * @author etg
 */

/* CHANGELOG
 * Date      	Author		Remarks
 * 2012-10-30   etg			Added guard to prevent searching when Payee
 * 							field is changed to empty value;
 * 2013-01-23	etg			Updated documentation; removed logging statements
 * 							as client scripts do not write to NS log
 * 2013-02-06	etg			Added try-catch to field changed handler; NS was
 * 							throwing an error with the getFieldValue call
 * 							at some point.
 */

var globalAccountId;

function clientBeforeSave(){
	// check to see if ach is checked and validate that there is a ach account set
	var isACH = (nlapiGetFieldText('custpage_pp_payment_method_copy') == 'ACH');
	
	if(isACH){
		var achAccount = nlapiGetFieldValue('custbody_pp_ach_account');
		if(!achAccount){
			alert('You must choose a Avid ACH account for ACH payments');
			return false;
		}
	}
	return true;
	
}



/**
 * This function is called whenever a field changes on the edit form for a
 * Check, Vendor Payment, or Customer Refund record.
 * 
 * @appliedtorecord vendorpayment
 * @appliedtorecord customerrefund
 * @appliedtorecord check
 * 
 * @param type
 *            {String} - Sublist internal id
 * @param name
 *            {String} - Field internal id
 * @param linenum
 *            {Number} - Optional line item number, starts from 1
 * 
 * @return {void}
 */
function clientFieldChanged(type, name, linenum) {		
		/* {Any} The value of the field that has been changed */
		var changedValue = '';
	try {
	    /* The Pay Bills screen fires the create event when Payments are created;
		 * the Approval screen fires the xedit event when Payments are modified 
		 */
		if(name == 'custpage_pp_payment_method_copy'){
			changedValue = nlapiGetFieldText(name);
			nlapiSetFieldValue('custbody_pp_payment_method',nlapiGetFieldValue('custpage_pp_payment_method_copy'));
			
			if(changedValue == 'ACH'){
				nlapiDisableField('custpage_pp_ach_account_copy', false);
				// set piracle pay ACH account to primary ach account
				var entityInternalId = nlapiGetFieldValue('entity');
				if(!entityInternalId){
					entityInternalId = nlapiGetFieldValue('customer');
				}
				resetACHAccounts(entityInternalId);
			}
			else{
				nlapiDisableField('custpage_pp_ach_account_copy', true);
	    		nlapiSetFieldValue('custpage_pp_ach_account_copy', '', true);
			}
		}
		else if(name == 'custpage_pp_ach_account_copy'){
			changedValue = nlapiGetFieldText(name);
			nlapiSetFieldValue('custbody_pp_ach_account',nlapiGetFieldValue('custpage_pp_ach_account_copy'));
		}
		else if(name == 'account' || name == 'undepfunds'){
	    	var accountId = nlapiGetFieldValue(name);
	    	// if coming from customer payments, undepfunds can be T or F when the checkbox is selected or not selected
	    	if(accountId == 'T' || accountId == 'F'){
	    		accountId = null;
	    	}
	    	// This code gets triggered when accountid doesn't really change
	    	if(globalAccountId == accountId){
	    		return;
	    	}
	    	else{
	    		globalAccountId = accountId;
	    	}
			var entityInternalId = nlapiGetFieldValue('entity');
			if(!entityInternalId){
				entityInternalId = nlapiGetFieldValue('customer');
			}
			
			resetPaymentMethod(entityInternalId,accountId,(nlapiGetRecordId() ? true : false));
			
	    }
    } catch (ex) {
	    window.console && console.error
	            && console.error('Caught exception: ' + ex.message);
    }
}

function clientPostSourcing(type,name){
	if(name == 'entity' || name == 'customer'){
		try{
			var entityInternalId = nlapiGetFieldValue(name);
			var accountId;
			if(nlapiGetRecordType() == 'customerpayment'){
				var undepfunds = nlapiGetFieldValue('undepfunds');
				if(undepfunds == 'T'){
					accountId = null;
				}
				else{
					accountId = nlapiGetFieldValue('account');
				}
			}
			else{
				accountId = nlapiGetFieldValue('account');
			}
			
			resetPaymentMethod(entityInternalId,accountId,false);
			resetACHAccounts(entityInternalId,accountId);
		}
		catch(ex){
			 window.console && console.error
	            && console.error('Caught exception: ' + ex.message);
		}
	}
}

function resetPaymentMethod(entityInternalId,accountId,preserveSelection){
	var depositOrWithdrawal = 'Deposit';
	if(nlapiGetRecordType() == 'customerpayment'){
		depositOrWithdrawal = 'Withdrawal';
	}
	var defaultPaymentMethodSettings = getEntityPaymentMethodSettings(entityInternalId,accountId,depositOrWithdrawal);
	var paymentMethodSearchSrs = nlapiSearchRecord('customrecord_pp_payment_methods',null,null,new nlobjSearchColumn('name'));
	
	if(preserveSelection){
		var selectedPaymentMethod = nlapiGetFieldText('custpage_pp_payment_method_copy');
		if(defaultPaymentMethodSettings.paymentMethodsToFilterOut.indexOf(selectedPaymentMethod) == -1){
			defaultPaymentMethodSettings.defaultPaymentMethod = selectedPaymentMethod;
		}
	}
	
	// clear the payment method select
	nlapiSetFieldValue('custpage_pp_payment_method_copy','',false);
	for(var i = 0; i < paymentMethodSearchSrs.length; i++){
		nlapiRemoveSelectOption('custpage_pp_payment_method_copy', paymentMethodSearchSrs[i].getId());
	}
	
	// repopulate payment method select
	var field = nlapiGetField('custpage_pp_payment_method_copy');
	for(var i = 0; i < paymentMethodSearchSrs.length; i++){
		if(defaultPaymentMethodSettings.paymentMethodsToFilterOut.indexOf(paymentMethodSearchSrs[i].getValue('name')) == -1){
			nlapiInsertSelectOption('custpage_pp_payment_method_copy', paymentMethodSearchSrs[i].getId(), paymentMethodSearchSrs[i].getValue('name'),false);
		}
	}
	
	// set default payment method
	nlapiSetFieldText('custpage_pp_payment_method_copy',defaultPaymentMethodSettings.defaultPaymentMethod);
}

/** This function mimics the sourcing of ach accounts dropdown
* @param {integer} entityInternalId
*/
function resetACHAccounts(entityInternalId){
	var depositOrWithdrawal = 'Deposit';
	if(nlapiGetRecordType() == 'customerpayment'){
		depositOrWithdrawal = 'Withdrawal';
	}
	
	var achAccountCopyField = nlapiGetField('custpage_pp_ach_account_copy');
	// clear select options
	nlapiRemoveSelectOption('custpage_pp_ach_account_copy', null);
	if(entityInternalId){
		nlapiInsertSelectOption('custpage_pp_ach_account_copy', '','',true);
		var achAccounts = getEntitiesACHAccounts(entityInternalId,depositOrWithdrawal);
		if(achAccounts){
			for(var i = 0; i < achAccounts.length; i++){
    			var sr = achAccounts[i];
    			nlapiInsertSelectOption('custpage_pp_ach_account_copy', sr.id, sr.name,false);
    		}
			
			// SET THE PRIMARY ACH ACCOUNT IF DEFAULT PAYMENT METHOD IS ACH
			var isACH = (nlapiGetFieldText('custpage_pp_payment_method_copy') == 'ACH');
			if(isACH){
				nlapiDisableField('custpage_pp_ach_account_copy', false);
				for(var i = 0; i < achAccounts.length; i++){
					if(achAccounts[i].custrecord_pp_ach_is_primary == 'T'){
						nlapiSetFieldValue('custpage_pp_ach_account_copy', achAccounts[i].id, true, true);
						break;
					}
				}
			}
		}
	}
}

// Get An entities ACH accounts from the server using the public client helper
function getEntitiesACHAccounts(entityId,depositOrWithdrawal){
	var clientHelperUrl = nlapiResolveURL('SUITELET','customscript_pp_sl_clienthelper','customdeploy_pp_sl_clienthelper_pub');
	 
	var jsdata = null;
	jQuery.ajax(clientHelperUrl + '&action=getACHAccountList',{
	    	type: 'POST',
	    	contentType: 'application/json; charset=utf-8',
	    	dataType: 'json',
	    	processData: false,
	    	data: JSON.stringify({'entityId': entityId, depositOrWithdrawal : depositOrWithdrawal}),
	    	async: false,
	    	success: function(data){
	    		jsdata = data;
	    	}
	    });
	
	return jsdata;
}



function getEntityPaymentMethodSettings(entityId,accountId,depositOrWithdrawal){
	var clientHelperUrl = nlapiResolveURL('SUITELET','customscript_pp_sl_clienthelper','customdeploy_pp_sl_clienthelper_pub');
	 
	var jsdata = null;
	jQuery.ajax(clientHelperUrl + '&action=getEntityPaymentMethodSettings',{
	    	type: 'POST',
	    	contentType: 'application/json; charset=utf-8',
	    	dataType: 'json',
	    	processData: false,
	    	data: JSON.stringify({'entityId': entityId, accountId: accountId, depositOrWithdrawal : depositOrWithdrawal}),
	    	async: false,
	    	success: function(data){
	    		jsdata = data;
	    	}
	    });
	
	return jsdata;
}