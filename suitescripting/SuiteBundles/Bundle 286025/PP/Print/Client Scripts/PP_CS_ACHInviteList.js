/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Feb 2014     maxm
 *
 */

function submitAction(recordId,action){
	nlapiSetFieldValue('custpage_ach_invite_id', recordId, false);
	nlapiSetFieldValue('custpage_action', action, false);
	
	jQuery('form#main_form').submit();
}