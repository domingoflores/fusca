/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 May 2014     smccurry
 *
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
function userEventBeforeLoad(type, form, request){
	var cMemo = nlapiGetNewRecord();
	var finalFunding = cMemo.getFieldValue('custbody_acq_finalfunding');
	var refundButton = form.getButton('refund'); 
	if(refundButton != null && finalFunding == 'F') {
		refundButton.setVisible(false); 
	}
}
