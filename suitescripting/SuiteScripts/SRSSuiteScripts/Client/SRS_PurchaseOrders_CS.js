/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 May 2014     smccurry
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum){
	if((type == 'expense') && (name  == 'account')) {
		nlapiSelectLineItem('expense', linenum);
		nlapiSetCurrentLineItemValue('expense', 'department', nlapiGetFieldValue('department'));
		nlapiSetCurrentLineItemValue('expense', 'class', nlapiGetFieldValue('class'));
	} 
}
