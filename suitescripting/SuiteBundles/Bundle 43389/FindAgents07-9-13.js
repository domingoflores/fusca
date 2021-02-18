/**************************************************************************

Dynamically sets the Escrow Agent and Paying Agent when the page is loaded. 
If more than one is found, the agent most recently attached to this customer 
is used.

Date Created: 5.14.13 (PRW)
Last Modified: 5.31.13 (PRW)
	7.6.13 (PRW) Auto-fill the # of Escrows

***************************************************************************/



function BLFindAgents(type){
	
	if (type == 'create' || type == 'copy') return;
	if (nlapiGetFieldValue('category') != '1') return; // '1' = Deal
	
	// Prep searches
	var recId = nlapiGetRecordId();
	
	// Search and set Escrow Agent
	var EAfilters = new Array();
	EAfilters.push(new nlobjSearchFilter('custrecord59', null, 'anyof', recId));
	EAfilters.push(new nlobjSearchFilter('custrecord_esc_con_roles', null, 'anyof', '7')) // '7' = Escrow Agent
	var EASearchResults = nlapiSearchRecord('customrecord16', 'customsearch_qx_agentssearch', EAfilters);
	
	if (EASearchResults != null){
		nlapiSetFieldValue('custentity_qx_escrowagent', EASearchResults[0].getValue('custrecord60'));
	}
	nlapiGetField('custentity_qx_escrowagent').setDisplayType('inline');
	
	// Search and set Paying Agent
	var PAfilters = new Array();
	PAfilters.push(new nlobjSearchFilter('custrecord59', null, 'anyof', recId));
	PAfilters.push(new nlobjSearchFilter('custrecord_esc_con_roles', null, 'anyof', '16')) // '16' = Paying Agent
	var PASearchResults = nlapiSearchRecord('customrecord16', 'customsearch_qx_agentssearch', PAfilters);
	
	if (PASearchResults != null){
		nlapiSetFieldValue('custentity_qx_payingagent', PASearchResults[0].getValue('custrecord60'));
	}
	nlapiGetField('custentity_qx_payingagent').setDisplayType('inline');
	
	// Search and set Number of Escrows
	var numEscSearchResults = nlapiSearchRecord('customrecord_qx_escrowinformation', 'customsearch_qx_numescrows', new nlobjSearchFilter('custrecord_qx_esc_customer', null, 'anyof', recId));
	var numEscrows = 0;
	if (numEscSearchResults != null) {
		numEscrows = numEscSearchResults[0].getValue('custrecord_qx_esc_escrownumber', null, 'max');
	}
	
	nlapiSetFieldValue('custentity_qx_numberofescrows', numEscrows);
	nlapiGetField('custentity_qx_numberofescrows').setDisplayType('inline');
}

