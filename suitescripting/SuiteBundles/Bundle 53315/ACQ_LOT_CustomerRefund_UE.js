/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Apr 2014     smccurry
 * 1.01		  17 July 2014    smccurry         Fixed a bug that caused this script to fail when a blank Customer Refund was created
 * 											   Add in the cMemoID != null into the if statement to make sure this script only runs on
 * 											   Refunds that are created from a Credit Memo.
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function beforeLoadCopyPaymentInfo(type, form, request){
//	nlapiLogExecution('DEBUG', 'TYPE', type);
	var contxt = nlapiGetContext().getExecutionContext();
	if(type == 'create' && contxt == 'userinterface') {
		var cMemoID = request.getParameter('cred');
		if(cMemoID != null && cMemoID != '') {
			try {
				var cRefund = nlapiGetNewRecord();
				nlapiLogExecution('DEBUG', 'Credit Memo ID', cMemoID);
				var cMemo = nlapiLoadRecord('creditmemo', cMemoID);
				
				var payMethods = [];
				payMethods['ACH'] = 9;
				payMethods['Wire Transfer'] = 7;
				payMethods['Domestic Wire'] = 7;
				payMethods['International Wire'] = 7;
				payMethods['Check'] = 2;
				payMethods['Domestic Check'] = 2;
				payMethods['International Check'] = 2;
				var payMethodText = cMemo.getFieldText('custbody_acq_lot_payment_method_3');
				if(payMethodText != null && payMethodText != '') {
					cRefund.setFieldValue('paymentmethod', payMethods[payMethodText]);
					if(payMethodText == 'ACH') {
						cRefund.setFieldValue('custbody_pp_ach_is_ach', 'T');
					}
				}
				
				
				var accountID = nlapiLookupField('customer', cMemo.getFieldValue('custbodyacq_deal_link'), 'custentity_acq_payment_account', false);
				if(accountID != null && accountID != '' && cRefund.getFieldValue('customform') == 140) { // 140 is id of Acquiom Customer Refund Custom Transaction Form
//				nlapiSetFieldValue('account', accountID);
					cRefund.setFieldValue('account', accountID);
				}
				
				cRefund.setFieldValue('custbody_aqm_1_abaroutingnumber', cMemo.getFieldValue('custbody_aqm_1_abaroutingnumber'));
				cRefund.setFieldValue('custbody_aqm_1_bankaccountnumber', cMemo.getFieldValue('custbody_aqm_1_bankaccountnumber'));
				cRefund.setFieldValue('custbody_aqm_1_accounttype', cMemo.getFieldValue('custbody_aqm_1_accounttype'));
				cRefund.setFieldValue('custbody_aqm_1_namesonbankaccount', cMemo.getFieldValue('custbody_aqm_1_namesonbankaccount'));
				cRefund.setFieldValue('custbody_aqm_1_bankname', cMemo.getFieldValue('custbody_aqm_1_bankname'));
				cRefund.setFieldValue('custbody_aqm_1_bankaddress', cMemo.getFieldValue('custbody_aqm_1_bankaddress'));
				cRefund.setFieldValue('custbody_aqm_1_bankaddresscity', cMemo.getFieldValue('custbody_aqm_1_bankaddresscity'));
				cRefund.setFieldValue('custbody_aqm_1_bankaddressstate', cMemo.getFieldValue('custbody_aqm_1_bankaddressstate'));
				cRefund.setFieldValue('custbody_aqm_1_bankaddresszip', cMemo.getFieldValue('custbody_aqm_1_bankaddresszip'));
				cRefund.setFieldValue('custbody_aqm_1_nameofbankcontactperson', cMemo.getFieldValue('custbody_aqm_1_nameofbankcontactperson'));
				cRefund.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', cMemo.getFieldValue('custbody_aqm_1_phonenumberofbankcontac'));
				cRefund.setFieldValue('custbody_aqm_1_forfurthercreditaccount', cMemo.getFieldValue('custbody_aqm_1_forfurthercreditaccount'));
				cRefund.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', cMemo.getFieldValue('custbody_aqm_1_2forfurthercreditaccoun'));
				cRefund.setFieldValue('entity', cMemo.getFieldValue('entity'));
				cRefund.setFieldValue('class', cMemo.getFieldValue('class'));
				cRefund.setFieldValue('custbodyacq_deal_link', cMemo.getFieldValue('custbodyacq_deal_link'));
//				cRefund.setFieldValue('custbody_acq_lot_createdfrom_exchrec', exRecID);
				cRefund.setFieldValue('department', cMemo.getFieldValue('department'));
				
				cRefund.setFieldValue('custbody_aqm_1_payeeaddress1', cMemo.getFieldValue('custbody_aqm_1_payeeaddress1'));
				cRefund.setFieldValue('custbody_aqm_1_payeecity', cMemo.getFieldValue('custbody_aqm_1_payeecity'));
				cRefund.setFieldValue('custbody_aqm_1_payeestate', cMemo.getFieldValue('custbody_aqm_1_payeestate'));
				cRefund.setFieldValue('custbody_aqm_1_payeezip', cMemo.getFieldValue('custbody_aqm_1_payeezip'));
			} catch (e) {
				var err = e;
//			nlapiLogExecution('DEBUG', 'Create Customer Refund Failed', JSON.stringify(err));
			}
		}
	}
}



