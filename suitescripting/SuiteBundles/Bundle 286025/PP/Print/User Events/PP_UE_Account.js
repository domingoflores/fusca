/**
 * Account user event script. Hides Exclude From AvidXchange option from non bank accounts.
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Oct 2013     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord Account
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
$PPS.debug = true;
$PPS.where = 'PP_UE_Account.js';
function userEventBeforeLoad(type, form, request){
	try{
		var context = nlapiGetContext();
		var paypalEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_paypal_mp') == 'T';
		var apnEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_apn_network') == 'T';
		
		// PayPal Fields In Order
		var paypalFields = ['custrecord_pp_is_paypal_account','custrecord_pp_paypal_api_username','custrecord_pp_paypal_api_signature',
		                    'custpage_pp_paypal_api_password_fake','custpage_pp_paypal_set_password','custrecord_pp_paypal_payer_id','custrecord_pp_paypal_api_sandbox',
		                    'custrecord_pp_paypal_fee_expense_account','custrecord_pp_paypal_fee_payee'];
		
		var fieldsToOrder = ['custrecord_pp_account_exclude'];
		var fieldsToHide = [];
		
		
		if(type == 'edit'){
			//var debug = form.addField('custpage_debug','text','Debug');
			// load record to get accttype because the value you get using nlapiGetFieldValue
			// can be renamed in Setup -> Company -> Rename Records/Transactions
			var rec = nlapiLoadRecord('account', nlapiGetRecordId());
			var accttype = rec.getFieldValue('accttype');
			if(accttype != 'Bank'){
				nlapiGetField('custrecord_pp_account_exclude').setDisplayType('hidden');
			}
			
			if(paypalEnabled){
				var existingAPIPass = nlapiLookupField('account',nlapiGetRecordId(),'custrecord_pp_paypal_api_password');
				if(existingAPIPass){
					var fakePW = form.addField('custpage_pp_paypal_api_password_fake','password','PayPal API Password');
					fakePW.setDisplayType('disabled');
					fakePW.setDefaultValue('********');
				}
				form.addField('custpage_pp_paypal_set_password','password','Change PayPal API Password').setMaxLength(50);
			}
		}
		else if(type == 'create' && paypalEnabled){
			form.addField('custpage_pp_paypal_set_password','password','PayPal API Password').setMaxLength(50);
		}
	
	
		if((type == 'edit' || type == 'create' || type == 'view') && nlapiGetContext().getExecutionContext() == 'userinterface'){
			
			if(apnEnabled){
				fieldsToOrder.push('custrecord_pp_act_apn_enabled');
			}
			else{
				fieldsToHide.push('custrecord_pp_act_apn_enabled');
			}
			
			if(paypalEnabled){
				fieldsToOrder = fieldsToOrder.concat(paypalFields);
			}
			else{
				fieldsToHide = fieldsToHide.concat(paypalFields);
			}
		
		
			// Force order of custom fields
			for(var i = fieldsToOrder.length - 1; i > 0; i--){
				var f1 = form.getField(fieldsToOrder[i-1]);
				var f2 = form.getField(fieldsToOrder[i]);
				if(f1 && f2){
					form.insertField(f1,fieldsToOrder[i]);
				}
			}
		
			// hide custom fields
			for(var i = 0; i < fieldsToHide.length; i++){
				$PPS.setDisplayType(form.getField(fieldsToHide[i]),'hidden');
			}
		
		}
	}
	catch(e){
		$PPS.log(e);
	}
}


function userEventBeforeSubmit(type){
	var context = nlapiGetContext();
	var paypalEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_paypal_mp') == 'T';
	
	if(paypalEnabled){
		var recordId = nlapiGetRecordId();
		var payPalApiSetPassword = nlapiGetFieldValue('custpage_pp_paypal_set_password');
		if(payPalApiSetPassword){
			var crypto = new PPCrypto();
			nlapiSetFieldValue('custrecord_pp_paypal_api_password',crypto.encrypt(payPalApiSetPassword));
		}
	}
}
