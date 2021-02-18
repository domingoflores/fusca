/**
 * Enabled/disable account multiselect when Select all accounts field is checked or not.
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Sep 2013     maxm
 *
 */

/**
 * @appliedtorecord customrecord_pp_approval_process 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type){
   var allaccts = nlapiGetFieldValue('custrecord_pp_ap_all_accounts');
   
   if(allaccts == 'T'){
	   var acctsFld = nlapiGetField('custrecord_pp_accounts');
	   nlapiDisableField('custrecord_pp_accounts', true);
   }
}

/** 
 * @appliedtorecord customrecord_pp_approval_process
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum){
	if(name == 'custrecord_pp_ap_all_accounts'){
		var allaccts = nlapiGetFieldValue('custrecord_pp_ap_all_accounts');
		var acctsFld = nlapiGetField('custrecord_pp_accounts');
		
		if(allaccts == 'T'){
			nlapiDisableField('custrecord_pp_accounts', true);
		}
		else{
			nlapiDisableField('custrecord_pp_accounts', false);
		}
	}
}
