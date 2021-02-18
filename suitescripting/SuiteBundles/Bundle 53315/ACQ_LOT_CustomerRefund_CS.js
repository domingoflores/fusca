/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 May 2014     smccurry
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type){
	if(type == 'create' || type == 'edit') {
		try {
			var dealLink = nlapiGetFieldValue('custbodyacq_deal_link');
			var accountID = nlapiLookupField('customer', dealLink, 'custentity_acq_payment_account', false);
			if(accountID != null && accountID != '') { //140    && nlapiGetFieldValue('customform') == 138
				nlapiSetFieldValue('account', accountID);
			}
		} catch (e) {
			nlapiLogExecution('ERROR', 'Failed to set ACCOUNT field', 'nlapiSetFieldValue("account", accountID)');
		}
	}
}