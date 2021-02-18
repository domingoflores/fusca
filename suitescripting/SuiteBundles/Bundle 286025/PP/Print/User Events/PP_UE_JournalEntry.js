/**
 * This User Event script sends a void payment request to PPS when a payment is voided via reverse journal entry.
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Apr 2014     maxm
 *
 */

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
	
	//if(type == 'create' && nlapiGetFieldValue('createdfrom')){
	if(nlapiGetFieldValue('createdfrom')){
		$PPS.Transaction.sendVoidToExernalServer(nlapiGetFieldValue('createdfrom'));
	}
}
