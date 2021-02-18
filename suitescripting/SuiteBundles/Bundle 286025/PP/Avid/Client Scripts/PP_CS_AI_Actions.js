/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Nov 2015     mmenlove
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
	
	var doOnLoadAction = nlapiGetFieldValue('do_onload_action');
		
	switch(doOnLoadAction){
	case 'closeAndRefresh':
		window.opener.closeAndRefresh(window);
		break;
	}
}

function closeWindow(){
	window.close();
}

function submit(){
	nlapiSubmitForm();
}
