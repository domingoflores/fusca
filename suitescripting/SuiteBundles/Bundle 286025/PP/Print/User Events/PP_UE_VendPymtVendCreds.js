/**
 * User event script for the "Avid VendPymt VendCreds" custom record type.
 * 
 * This script tries to enforce a unique combination key on custrecord_pp_offset_bill and custrecord_pp_offset_bill_credit fields
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Feb 2014     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_pp_vendpymt_vendcreds
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
	nlapiLogExecution('AUDIT', 'Before Submit', 'Start');
	if(type == 'create' || type == 'edit'){
		var billId = nlapiGetFieldValue('custrecord_pp_offset_bill');
		var creditId = nlapiGetFieldValue('custrecord_pp_offset_bill_credit');
		
		var filters = [];
		
		filters.push(new nlobjSearchFilter('custrecord_pp_offset_bill',null,'is',billId));
		filters.push(new nlobjSearchFilter('custrecord_pp_offset_bill_credit',null,'is',creditId));
		
		var searchResults = nlapiSearchRecord('customrecord_pp_vendpymt_vendcreds', null, filters, null);
		if(searchResults && searchResults.length > 0){
			throw nlapiCreateError('UNIQUE_CONTRAINT_ERR', 'A customrecord_pp_vendpymt_vendcreds entry already exists with the same bill and bill credit.', true);
		}
	}
}
