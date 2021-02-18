/**
 * Hide Avid transaction body fields on records they have no business being on, but are there due to NetSuite's lack of granularity. 
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Jun 2016     mmenlove
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord PurchaseOrder
 * @appliedtorecord VendorBill
 * @appliedtorecord VendorCredit
 * @appliedtorecord CustomerDeposit
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	if(type == 'create' || type == 'edit' || type == 'view' || type == 'copy'){
		try{
			var transactionType =  nlapiGetFieldValue('type');
			nlapiLogExecution('DEBUG','transaction type',transactionType);
			// AvidXchange Tab should not show up for vendor bills or customer payments
			// If you hide all fields in a tab, then the tab disappears. 
	
			var fieldsToHide = [
			                    'custbody_pp_is_printed','custbody_pp_ach_is_ach','custbody_pp_approval_status',
			                    'custbody_pp_reason_for_rejection','custbody_pp_comment','custbody_pp_no_process',
			                    CAC_IS_APPROVED_ID,'custbody_pp_override_sig_a','custbody_pp_override_sig_b',
			                    'custbody_pp_payment_method','custbody_pp_paypal_tran_status','custbody_pp_paypal_tran_status',
			                    'custbody_pp_paypal_txn_id','custbody_pp_paypal_reason_code','custbody_pp_paypal_mass_payment',
			                    'custbody_pp_apn_payment_status','custbody_pp_apn_reason_for_exception','custbody_pp_apn_payment_batch',
			                    'custbody_pp_apn_check_number','custbody_pp_apn_payment_method'
			                    ];
			
			for(var i = 0; i < fieldsToHide.length; i++){
				$PPS.setDisplayType(form.getField(fieldsToHide[i]),'hidden');
			}
			
			// Set custbody_pp_ach_account field to disabled instead of hidden because it is setup to source and will cause client side error if set to hidden
			$PPS.setDisplayType(form.getField('custbody_pp_ach_account'),'disabled');
			
			forceRebrandTransactionForm(form);
			return;
			
		}
		catch(e){
			$PPS.logException(e, 'ERROR');
		}
	}
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
