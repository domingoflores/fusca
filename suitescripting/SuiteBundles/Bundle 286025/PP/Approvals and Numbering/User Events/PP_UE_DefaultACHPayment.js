/**
 * Module Description
 * This user event script is used to set the default value of the CAC ACH checkbox on payment
 * records when payments are made through the NetSuite Pay Bills screen.
 * 
 * Version    Date            Author                Remarks
 * 1.00       03 Oct 2012     Eric Grubaugh
 * 2.10.2	  11 Jul 2017     John Reid             S15088 - Do not set approval status when not processing through payment Avid
 * 2.17.0	  2018.12.26      John Reid             ADO-13673 - AccountID misassignments result in not seeing payments in Approvals
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord vendorpayment
 * @appliedtorecord customerrefund
 * @appliedtorecord check
 * 
 * @param {String} type - The current mode in which the record is open; can be one of:
 * <ul>
 * <li>create</li>
 * <li>edit</li>
 * <li>delete</li>
 * <li>xedit</li>
 * </ul>
 *
 * @returns {Void}
 */

function beforeLoad(type, form, request){
	
	var show = true,
	where = 'beforeLoad';
	try{
		var transactionType =  nlapiGetFieldValue('type');
		// AvidXchange Tab should not show up for vendor bills or customer payments
		// If you hide all fields in a tab, then the tab disappears. 
		if(transactionType != 'check' && transactionType != 'custrfnd' && transactionType != 'vendpymt'){
			return;
		}
		afnLog(show, where, "type=["+type+"]; transactionType=["+transactionType+"]");//moved to after the test so as not to unnecessarily fill the execution log
		
		var currentContext = nlapiGetContext();
		afnLog(show, where, "executionContext=["+currentContext.getExecutionContext()+"]");
		// Disable is printed check-box. Should really be in a user event script in the Print package.
		// Only disable from UI so that web-service can update the field.
		if(currentContext.getExecutionContext() == 'userinterface'){
			$PPS.setDisplayType(form.getField('custbody_pp_is_printed'),'disabled');
		}

		// If transaction is getting copied we need to clear all our of fields(except payment method and ach account)
		// so copied transaction does not have values set that should not be
		// NOTE: When AUTOFILL is enabled, the type gets set to copy when a vendor is selected 
		if(type == 'copy' && currentContext.getExecutionContext() == 'userinterface'){
			nlapiSetFieldValue('custbody_pp_is_printed','F');
			nlapiSetFieldValue('custbody_pp_is_approved','F');
			nlapiSetFieldValue('custbody_pp_approval_status','');
			nlapiSetFieldValue('custbody_pp_override_sig_a','');
			nlapiSetFieldValue('custbody_pp_override_sig_b','');
			
			nlapiSetFieldValue('custbody_pp_paypal_txn_id','');
			nlapiSetFieldValue('custbody_pp_paypal_mass_payment','');
			nlapiSetFieldValue('custbody_pp_paypal_tran_status','');
			nlapiSetFieldValue('custbody_pp_paypal_reason_code','');
			
			nlapiSetFieldValue('custbody_pp_apn_payment_status','');
			nlapiSetFieldValue('custbody_pp_apn_reason_for_exception','');
			nlapiSetFieldValue('custbody_pp_apn_payment_batch','');
			nlapiSetFieldValue('custbody_pp_apn_payment_method','');
			nlapiSetFieldValue('custbody_pp_apn_check_number','');
		}

		var enable_approvals = nlapiLoadConfiguration('companypreferences').getFieldValue('custscript_enable_approvals') == 'T' ? true : false;
		if(!enable_approvals) {
			try{
				if(form){
					$PPS.setDisplayType(form.getField('custbody_pp_approval_status'),'hidden');
					$PPS.setDisplayType(form.getField(CAC_IS_APPROVED_ID),'hidden');
					$PPS.setDisplayType(form.getField('custbody_pp_reason_for_rejection'),'hidden');
					$PPS.setDisplayType(form.getField('custbody_pp_comment'),'hidden');
					$PPS.setDisplayType(form.getField('custbody_pp_override_sig_a'),'hidden');
					$PPS.setDisplayType(form.getField('custbody_pp_override_sig_b'),'hidden');
				}
			}catch(e){
				afnLog(show, where, e.message);
			}
		}
		else {
			// Approval status cannot be selected
			$PPS.setDisplayType(form.getField('custbody_pp_approval_status'),'disabled');
			$PPS.setDisplayType(form.getField(CAC_IS_APPROVED_ID),'disabled');
		}
		
		// hide paypal transaction fields if they are not relevant
		if(type == 'create' || type == 'copy' || ((type == 'view' || type == 'edit') && nlapiGetFieldText('custbody_pp_payment_method') != 'PayPal')){
			$PPS.setDisplayType(form.getField('custbody_pp_paypal_tran_status'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_paypal_txn_id'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_paypal_reason_code'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_paypal_mass_payment'),'hidden');
		}
		
		// hide APN transaction fields if they are not relevant
		if(type == 'create' || type == 'copy' || ((type == 'view' || type == 'edit') && nlapiGetFieldText('custbody_pp_payment_method') != 'AvidPay Network')){
			$PPS.setDisplayType(form.getField('custbody_pp_apn_payment_status'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_apn_reason_for_exception'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_apn_payment_batch'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_apn_check_number'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_apn_payment_method'),'hidden');
		}
		
		
		
		/*
		/// Display Live PayPal mass transaction fields
		if((type == 'edit' || type == 'view') && nlapiGetFieldText('custbody_pp_payment_method') == 'PayPal'){
			var filters = [];
			var columns = [];
			
			filters.push(new nlobjSearchFilter('custrecord_pp_paypal_mptran_transaction',null,'is',nlapiGetRecordId()));
			
			columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_tran_status'));
			columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_mp_txn_id'));
			columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_reason_code'));
			
			var createdCol = new nlobjSearchColumn('created');
			createdCol.setSort(true);
			columns.push(createdCol);
			
			var searchResults = nlapiSearchRecord('customrecord_pp_paypal_mp_transactions', null, filters, columns);
			
			var payPalValues = {
					status : '',
					mp_txn_id : '',
					reason_code : null
			};
			if(searchResults){
				searchResult = searchResults[0];
				payPalValues.status = searchResult.getValue('custrecord_pp_paypal_mptran_tran_status');
				payPalValues.mp_txn_id = searchResult.getValue('custrecord_pp_paypal_mptran_mp_txn_id');
				payPalValues.reason_code = searchResult.getValue('custrecord_pp_paypal_mptran_reason_code');
				
			}
			
			var paypalStatusField = form.addField('custpage_pp_paypal_tran_status','text','PayPal Status');
			paypalStatusField.setDefaultValue(payPalValues.status);
			paypalStatusField.setDisplayType('disabled');
			form.insertField(paypalStatusField,'custbody_pp_payment_method');
			
			if(payPalValues.status == 'Failed'){
				var paypalReasonCodeField = form.addField('custpage_pp_paypal_mptran_mp_reason_code','text','Reason for failure');
				paypalReasonCodeField.setDefaultValue(payPalValues.reason_code);
				paypalReasonCodeField.setDisplayType('disabled');
				form.insertField(paypalReasonCodeField,'custbody_pp_payment_method');
			}
			
			var paypalTxnIdField = form.addField('custpage_pp_paypal_mptran_mp_txn_id','text','PayPal Transaction Id');
			paypalTxnIdField.setDefaultValue(payPalValues.mp_txn_id);
			paypalTxnIdField.setDisplayType('disabled');
			form.insertField(paypalTxnIdField,'custbody_pp_payment_method');
			
			form.insertField(form.getField('custbody_pp_payment_method'),'custpage_pp_paypal_tran_status');
		}
		*/
		
		
		// Hide old ACH checkbox fields
		if (type == 'create' || type == 'copy' || type == 'edit' || type == 'view'){
			$PPS.setDisplayType(form.getField('custbody_pp_ach_is_ach'),'hidden');
			$PPS.setDisplayType(form.getField('custbody_pp_no_process'),'hidden');
			
			forceRebrandTransactionForm(form);
		}

		if (type == 'create' || type == 'edit') {
			//setDefaultACH(form);
			var entityId = getEntityId();
			
			var paymentMethodField = form.getField('custbody_pp_payment_method');
			//var achAccountField = form.getField('custbody_pp_ach_account');
			var achAccountField = nlapiGetField('custbody_pp_ach_account');
			
			if(paymentMethodField){
				// ADO-13673 In a userinterface context, if we have an entityId, then the filterOut value is valid; otherwise, accept all values 
				var accountId = nlapiGetFieldValue('account');
				afnLog(show, where, "entityId=["+entityId+"]; account=["+accountId+"]");
				var paymentMethodSettings = $PPS.Transaction.getEntityPaymentMethodSettings(entityId,accountId);
				if(type == 'create'){
					// set default payment method
					afnLog(show, where, "paymentMethodSettings.defaultPaymentMethod=["+paymentMethodSettings.defaultPaymentMethod+"]");
					nlapiSetFieldText('custbody_pp_payment_method',paymentMethodSettings.defaultPaymentMethod);
					if(paymentMethodSettings.defaultPaymentMethod == 'ACH'){
						// set ACH account
						afnLog(show, where, "paymentMethodSettings.primACHAcctId=["+paymentMethodSettings.primACHAcctId+"]");
						nlapiSetFieldValue('custbody_pp_ach_account', paymentMethodSettings.primACHAcctId);
					}
				}
				
				// create copy of ach accounts so we can filter account list on depost/withdrawal
				$PPS.setDisplayType(form.getField('custbody_pp_ach_account'),'hidden');
				var achAccountLabel = 'Avid ACH Account';
				var achAccountsCopy = form.addField('custpage_pp_ach_account_copy','select',achAccountLabel);
				form.insertField(achAccountsCopy,'custbody_pp_is_printed');
				achAccountsCopy.addSelectOption('','');
				if(entityId){
					// get the previously selected ACH Account 
					var selectedACHAccount = nlapiGetFieldValue('custbody_pp_ach_account');
					afnLog(show, where, "selectedACHAccount=["+selectedACHAccount+"]");
					// get options ach accounts
					var achAccountsSrs = $PPS.ACH.getEntitiesACHAccounts(entityId,'Deposit');
					if(achAccountsSrs){
						for(var i = 0; i < achAccountsSrs.length; i++){
							var sr = achAccountsSrs[i];
							afnLog(show, where, "achAccountsSrs["+i+"] getId()=["+sr.getId()+"]; getValue('name')=["+sr.getValue('name')+"]");
							if(achAccountsSrs.length > 1){
								achAccountsCopy.addSelectOption(sr.getId(),sr.getValue('name'),sr.getId() == selectedACHAccount);
							}else{
								achAccountsCopy.addSelectOption(sr.getId(),sr.getValue('name'),true);
							}
						}
					}
				}
				
				if(paymentMethodSettings.defaultPaymentMethod != 'ACH'){
					nlapiGetField('custpage_pp_ach_account_copy').setDisplayType('disabled');
				}else{
					// don't pre-select the ACH Account when the primary is not in the list & there is more than 1
					var selectedACHAccount = nlapiGetFieldValue('custpage_pp_ach_account_copy');
					afnLog(show, where, 'pre-selected ach = '+selectedACHAccount);
					nlapiSetFieldValue('custbody_pp_ach_account', selectedACHAccount);
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
					// ADO-13673 In a userinterface context, if we have an entityId & accountId, then the filterOut value is valid; otherwise, accept all values 
					if(currentContext.getExecutionContext() == 'userinterface' && entityId && accountId){
						if( paymentMethodSettings.paymentMethodsToFilterOut.indexOf(so.getText()) == -1 || (type == 'edit' && so.getId() == selectedPaymentMethod)){
							paymentMethodCopy.addSelectOption(so.getId(),so.getText(),so.getId() == selectedPaymentMethod);
							afnLog(show, where, "added selectOptions["+i+"] getId()=["+so.getId()+"]; getText()=["+so.getText()+"]; filterOut=["+paymentMethodSettings.paymentMethodsToFilterOut.indexOf(so.getText())+"]");
						}
					}else{
						// ADO-13673 When no entityId & accountId the selectedPaymentMethod is not trusted, so don't set DNPWAX
						if(selectedPaymentMethod != 'Do Not Process With AvidXchange'){
							paymentMethodCopy.addSelectOption(so.getId(),so.getText(),false);
						}else{
							paymentMethodCopy.addSelectOption(so.getId(),so.getText(),so.getId() == selectedPaymentMethod);
						}
						afnLog(show, where, "added selectOptions["+i+"] getId()=["+so.getId()+"]; getText()=["+so.getText()+"]; filterOut=["+paymentMethodSettings.paymentMethodsToFilterOut.indexOf(so.getText())+"]");
					}
				}
				
				// hide original payment method field
				paymentMethodField.setDisplayType('hidden');
			}
			
			// If the request is set then we know this event came from a form and not the Pay Bills screen.
			// Set a hidden flag so we do not overwrite the automatic ACH beforeSubmit
			afnLog(show, where, "typeof request=["+selectedACHAccount+"]");
			if(typeof request != 'undefined'){
				var dummy = form.addField('custpage_no_update_ach', 'text', 'Dummy');
				dummy.setDisplayType('hidden');
				nlapiSetFieldValue('custpage_no_update_ach', 'T');
				afnLog(show, where, 'custpage_no_update_ach = true');
			}
		}//end if (type == 'create' || type == 'edit') 
	}catch(e){
		afnLog(show, where, e.message);
	}
	afnLog(show, where, "end");
}

function beforeSubmit(type){
	var show = true,
	where = 'beforeSubmit';
	
	var currentContext = nlapiGetContext();
	var transactionType =  nlapiGetFieldValue('type');
	if(transactionType != 'check' && transactionType != 'custrfnd' && transactionType != 'vendpymt'){
		return true;
	}
	try{		
		executionContext = currentContext.getExecutionContext();	//[jr 2018.12.26]
		afnLog(show, where, "type=["+type+"]; transactionType=["+transactionType+"]; executionContext=["+executionContext+"]");
		
		if(type == 'create' || type == 'edit'){
			var total = nlapiGetFieldValue('total');
			if(total == null){
				total = nlapiGetFieldValue('usertotal');
			}
			
			//[jr 2018.12.26] if in a non-UI context, get the payment method for any correction to the entityid or accountid; 
			if((type == 'create')&&(executionContext != 'userinterface')){
				var paymentMethodField = nlapiGetField('custbody_pp_payment_method');
				if(paymentMethodField){
					var entityId = getEntityId();
					var accountId = nlapiGetFieldValue('account');
					afnLog(show, where, "entityId=["+entityId+"]; account=["+accountId+"]");
					var paymentMethodSettings = $PPS.Transaction.getEntityPaymentMethodSettings(entityId,accountId);
					// set default payment method
					afnLog(show, where, "paymentMethodSettings.defaultPaymentMethod=["+paymentMethodSettings.defaultPaymentMethod+"]");
					nlapiSetFieldText('custbody_pp_payment_method',paymentMethodSettings.defaultPaymentMethod);
					if(paymentMethodSettings.defaultPaymentMethod == 'ACH'){
						// set ACH account
						afnLog(show, where, "paymentMethodSettings.primACHAcctId=["+paymentMethodSettings.primACHAcctId+"]");
						nlapiSetFieldValue('custbody_pp_ach_account', paymentMethodSettings.primACHAcctId);
					}
				}
			}
			
			afnLog(show, where, 'nlapiGetFieldText(custbody_pp_payment_method) = ' + nlapiGetFieldText('custbody_pp_payment_method'));
			// S15088: Do not set approval status when not processing through payment Avid
			if(nlapiGetFieldText('custbody_pp_payment_method') != 'Do Not Process With AvidXchange'){
				afnLog(show, where, "total=["+total+"]; account=["+nlapiGetFieldValue('account')+"]");
				var defaultApprovalStatus = PPSLibApprovals.findDefaultApprovalStatus(total,nlapiGetFieldValue('account'));
				var deafaultApprovalStatusId = null;
				var isApprovedFlag = 'F';
				if(defaultApprovalStatus){
					deafaultApprovalStatusId = defaultApprovalStatus.getId();
					if(PPSLibApprovals.isApprovedStatus(deafaultApprovalStatusId)){
						isApprovedFlag = 'T';
					}
					afnLog(show, where, "deafaultApprovalStatusId=["+deafaultApprovalStatusId+"]; isApprovedFlag=["+isApprovedFlag+"]");
				}
			
				// check to see if changing approval process limit boundary, if so set to default status of new boundary
				var currentStatusId = nlapiGetFieldValue('custbody_pp_approval_status');
				if(currentStatusId){
					if(defaultApprovalStatus.getValue('custrecord_pp_approval_process') != nlapiLookupField('customrecord_pp_pmt_approval_status', currentStatusId, 'custrecord_pp_approval_process')){
						nlapiSetFieldValue('custbody_pp_approval_status',deafaultApprovalStatusId);
						nlapiSetFieldValue(CAC_IS_APPROVED_ID,isApprovedFlag);
						if(type == 'edit'){
							PPSLibApprovals.clearApproverStack(nlapiGetRecordId());
							// write action to approval log
							var rec = nlapiCreateRecord('customrecord_pp_approval_log');
							rec.setFieldValue('custrecord_pp_al_transaction', nlapiGetRecordId());
							rec.setFieldValue('custrecord_pp_al_user', currentContext.getUser());
							rec.setFieldValue('custrecord_pp_al_action', 'reset');
							rec.setFieldValue('custrecord_pp_al_status',deafaultApprovalStatusId);
							nlapiSubmitRecord(rec);
						}
						afnLog(show, where, "Stat " + deafaultApprovalStatusId);
					}
				}
				else{
					// approval status was null, lets set a default
					nlapiSetFieldValue('custbody_pp_approval_status',deafaultApprovalStatusId);
					nlapiSetFieldValue(CAC_IS_APPROVED_ID,isApprovedFlag);
					afnLog(show, where, "Status set to " + deafaultApprovalStatusId);
				}
            }
		}
		
		
		// Only setDefaultACH if coming from Pay Bills screen
		var noUpdateACH = nlapiGetFieldValue('custpage_no_update_ach');
		if (type == 'create' && noUpdateACH != 'T') {
			afnLog(show, where, "Auto ACH");
			var entityId = getEntityId();
			afnLog(show,where,"entityId=["+entityId+"]; account=["+nlapiGetFieldValue('account')+"]")
			var paymentMethodSettings = $PPS.Transaction.getEntityPaymentMethodSettings(entityId,nlapiGetFieldValue('account'));
			// set default payment method
			afnLog(show, where, "defaultPaymentMethod=["+paymentMethodSettings.defaultPaymentMethod+"]");
			nlapiSetFieldText('custbody_pp_payment_method',paymentMethodSettings.defaultPaymentMethod);
			if(paymentMethodSettings.defaultPaymentMethod == 'ACH'){
				// set ACH account
				afnLog(show, where, "primACHAcctId=["+paymentMethodSettings.primACHAcctId+"]");
				nlapiSetFieldValue('custbody_pp_ach_account', paymentMethodSettings.primACHAcctId);
			}

		}
		
	}catch(e){
		afnLog(show, where, e.message);		
	}
	afnLog(show, where, "end");
	return true;
}

function afterSubmit(type){
	nlapiLogExecution('DEBUG', 'after submit', 'start');
	
	var transactionType =  nlapiGetRecordType();
	if(transactionType != 'check' && transactionType != 'customerrefund' && transactionType != 'vendorpayment'){
		return true;
	}
	
	var recordId = nlapiGetRecordId();
	if(type == 'edit' && recordId){
		$PPS.Transaction.sendVoidToExernalServer(recordId);
	}
	nlapiLogExecution('DEBUG', 'after submit', 'end');
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

/**
 * Get payment method settings for an entity. 
 * 
 * Returns on object with:
 * 	{String} defaultPaymentMethod - The entities default payment method
 *  {Array}  paymentMethodsToFilterOut - List of payment methods not supported by the entity
 * 
 * @param entityId *optional
 * @returns {Object}
 */
