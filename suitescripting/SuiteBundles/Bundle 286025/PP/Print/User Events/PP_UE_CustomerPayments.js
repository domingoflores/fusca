/**
 * This user event script hooks customer payments into the AvidXchange withdrawal ACH system when
 * withdrawal ach is enabled, and hides the AvidXchange fields otherwise
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Sep 2014     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customerpayment
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */

function beforeLoad(type, form, request){
	// default fields that do not apply to customer payments
	var fieldsToHide = [
	                    'custbody_pp_ach_is_ach','custbody_pp_approval_status',
	                    'custbody_pp_reason_for_rejection','custbody_pp_comment','custbody_pp_no_process',
	                    CAC_IS_APPROVED_ID,'custbody_pp_override_sig_a','custbody_pp_override_sig_b',
	                    'custbody_pp_paypal_tran_status','custbody_pp_paypal_tran_status',
	                    'custbody_pp_paypal_txn_id','custbody_pp_paypal_reason_code','custbody_pp_paypal_mass_payment'
	                    ];
	
	for(var i = 0; i < fieldsToHide.length; i++){
		$PPS.setDisplayType(form.getField(fieldsToHide[i]),'hidden');
	}
	
	forceRebrandTransactionForm(form);
	
	var currentContext = nlapiGetContext();
	var cpACHEnabled = nlapiLoadConfiguration('companypreferences').getFieldValue('custscript_pp_enable_wach') == 'T' ? true : false;
	// dont hook up to customer payments. The CUSTOMER role center applies to shopping cart as well
	// Note for later: the execution context for the customer center is userinterface and webstore for the web store
	if(!cpACHEnabled || currentContext.getRoleCenter() == 'CUSTOMER'){
		$PPS.setDisplayType(form.getField('custbody_pp_is_printed'),'hidden');
		$PPS.setDisplayType(form.getField('custbody_pp_payment_method'),'hidden');
		$PPS.setDisplayType(form.getField('custbody_pp_ach_account'),'disabled');
		return;
	}
	else{
		if(currentContext.getExecutionContext() == 'userinterface'){
			$PPS.setDisplayType(form.getField('custbody_pp_is_printed'),'disabled');
		}
		
		if (type == 'create' || type == 'edit') {
			//setDefaultACH(form);
			var entityId = getEntityId();
			
			var paymentMethodField = form.getField('custbody_pp_payment_method');
			//var achAccountField = form.getField('custbody_pp_ach_account');
			var achAccountField = nlapiGetField('custbody_pp_ach_account');
			
			if(paymentMethodField){
				var paymentMethodSettings = $PPS.Transaction.getEntityPaymentMethodSettings(entityId,nlapiGetFieldValue('account'),'Withdrawal');
				if(type == 'create'){
					// set default payment method
					nlapiSetFieldText('custbody_pp_payment_method',paymentMethodSettings.defaultPaymentMethod);
					if(paymentMethodSettings.defaultPaymentMethod == 'ACH'){
						// set ACH account
						nlapiSetFieldValue('custbody_pp_ach_account', paymentMethodSettings.primACHAcctId);
					}
				}
				
				// create copy of ach accounts so we can filter account list on depost/withdrawal
				$PPS.setDisplayType(form.getField('custbody_pp_ach_account'),'hidden');
				var achAccountLabel = 'AvidXchange ACH Account';
				var achAccountsCopy = form.addField('custpage_pp_ach_account_copy','select',achAccountLabel);
				form.insertField(achAccountsCopy,'custbody_pp_is_printed');
				achAccountsCopy.addSelectOption('','');
				if(entityId){
					var selectedACHAccount = nlapiGetFieldValue('custbody_pp_ach_account');
					// get options ach accounts
					var achAccountsSrs = $PPS.ACH.getEntitiesACHAccounts(entityId,'Withdrawal');
					if(achAccountsSrs){
						for(var i = 0; i < achAccountsSrs.length; i++){
							var sr = achAccountsSrs[i];
							achAccountsCopy.addSelectOption(sr.getId(),sr.getValue('name'),sr.getId() == selectedACHAccount);
						}
					}
				}
				
				if(paymentMethodSettings.defaultPaymentMethod != 'ACH'){
					nlapiGetField('custpage_pp_ach_account_copy').setDisplayType('disabled');
				}
				
				// create copy of payment method and filter out invalid payment methods
				var paymentMethodCopy = form.addField('custpage_pp_payment_method_copy','select',paymentMethodField.getLabel());
				//TODO: set help text paymentMethodCopy.setHelpText('');
				form.insertField(paymentMethodCopy,'custpage_pp_ach_account_copy');
				var selectOptions = paymentMethodField.getSelectOptions();
				var selectedPaymentMethod = nlapiGetFieldValue('custbody_pp_payment_method');
				for(var i = 0; i < selectOptions.length; i++){
					var so = selectOptions[i];
					// if editing an existing payment and the existing payment method is no longer valid, preserve the current selection for record keeping
					if(paymentMethodSettings.paymentMethodsToFilterOut.indexOf(so.getText()) == -1 || (type == 'edit' && so.getId() == selectedPaymentMethod)){
						paymentMethodCopy.addSelectOption(so.getId(),so.getText(),so.getId() == selectedPaymentMethod);
					}
				}
				
				// hide original payment method field
				paymentMethodField.setDisplayType('hidden');
			}
		}
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customerpayment
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function beforeSubmit(type){
	
	nlapiLogExecution('DEBUG','before submit','Start');
	var currentContext = nlapiGetContext();
	var executionContext = currentContext.getExecutionContext();

	nlapiLogExecution('DEBUG','executionContext',executionContext);
	var cpACHEnabled = nlapiLoadConfiguration('companypreferences').getFieldValue('custscript_pp_enable_wach') == 'T' ? true : false;
	// dont hook up to customer payments. The CUSTOMER role center applies to shopping cart as well
	if(!cpACHEnabled || currentContext.getRoleCenter() == 'CUSTOMER'){
		return;
	}
	
	// validate ACH payment method option and choose a primary withdrawal account if none is selected
	if(type == 'create' && ['suitelet','userevent','scheduled','debugger'].indexOf(executionContext) > -1 && nlapiGetFieldText('custbody_pp_payment_method') == 'ACH'){
		var entityId = nlapiGetFieldValue('customer');
		var achEnabled = nlapiLookupField('entity', entityId,'custentity_pp_ach_enabled');
		if(achEnabled == 'T'){
			if(!nlapiGetFieldValue('custbody_pp_ach_account')){
				var primACHAcctId = $PPS.ACH.getEntitiesPrimaryACHAccount(entityId,'Withdrawal');
				if(primACHAcctId){
					nlapiSetFieldValue('custbody_pp_ach_account', primACHAcctId);
				}
				else{
					throw nlapiCreateError('PPS_ENTITY_NO_PRIMARY_ACH_WITHDRAWAL_ACCOUNT', 'The entity must have a primary withdrawal Avid ACH account to use AvidXchange ACH payment method with no ACH account specified');
				}
			}
		}
		else{
			throw nlapiCreateError('PPS_ENTITY_NOT_ACH_ENABLED', 'The entity must be ACH enabled with AvidXchange in order to use the ACH payment method');
		}
	}
}

/**
 * Get Entities internalid on form
 * @returns {String} 
 */
function getEntityId(){
	var field;
	if (nlapiGetField('entity')) {
		field = 'entity';
	} else {
		field = 'customer';
	}
	
	return nlapiGetFieldValue(field);
}

/**
 * Rebrand Piracle Pay to AvidXchange since bundle update will not force label updates on custom forms
 */
function forceRebrandTransactionForm(form){
	var tabs = form.getTabs();
	for(var i = 0; i < tabs.length; i++){
		var tab = form.getTab(tabs[i]);
		if(tab.getLabel() && tab.getLabel().toLowerCase() == "piracle pay status"){
			tab.setLabel('AvidXchange');
			break;
		}
	}
	
	var fieldsToBrand = ['custbody_pp_approval_status','custbody_pp_comment','custbody_pp_reason_for_rejection','custbody_pp_is_approved',
	                     'custbody_pp_payment_method','custbody_pp_ach_account','custbody_pp_is_printed'];
	
	for(var i = 0; i < fieldsToBrand.length; i++){
		var f = form.getField(fieldsToBrand[i]);
		if(f && f.getLabel().match(/Piracle Pay/i)){
			f.setLabel(f.getLabel().replace(/Piracle Pay/ig,'Avid'));
		}
	}
}