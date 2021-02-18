/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Nov 2015     MMenlove
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */



var filterHelper = new NSFormFilterClientHelper();

function clientPageInit(type){
	filterHelper.registerFilters(filtersToRegister);
	var lineCount = nlapiGetLineItemCount('custpage_invoices');
	for (var line = 1; line <= lineCount; line++) {
		//var hasPO = false;
		var prevError = nlapiGetLineItemValue('custpage_invoices', 'custpage_prev_err', line);
		var poStatus = nlapiGetLineItemValue('custpage_invoices', 'po_status', line);
		if (prevError == 'T' || poStatus == 'Fully Billed' || poStatus == 'Pending Receipt') {
			//disable checkbox
			var checkBox = nlapiGetLineItemField('custpage_invoices', 'inv_select', line);
			nlapiSetLineItemDisabled('custpage_invoices', 'inv_select', true, line);
		}
	}
}

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
	filterHelper.onFieldChange(type, name, linenum);
}

function invalidbtnClick(invId){
	
	var url = window.location.protocol + '//' + window.location.host + nlapiResolveURL('SUITELET','customscript_pp_sl_ai_actions', 'customdeploy_pp_sl_ai_actions_invalid') + '&invid=' + invId;
	window.open(url,'Invalid Form',"width=500, height=500, menubar=no, toolbar=no");
}

function fixbtnClick(invId){
	
	var url = window.location.protocol + '//' + window.location.host + nlapiResolveURL('SUITELET','customscript_pp_sl_ai_actions', 'customdeploy_pp_sl_ai_actions_fix') + '&invid=' + invId;
	window.open(url,'Invoice Fix Form',"width=500, height=500, menubar=no, toolbar=no, scrollbars=yes");
}

function selectBillBtnClick(invId){
	
	var url = window.location.protocol + '//' + window.location.host + nlapiResolveURL('SUITELET','customscript_pp_sl_ai_actions', 'customdeploy_pp_sl_ai_actions_select_bil') + '&invid=' + invId;
	window.open(url,'Select Bill Form',"width=500, height=500, menubar=no, toolbar=no, scrollbars=yes");
}

function viewInvoice(invId){	
	var url = window.location.protocol + '//' + window.location.host + nlapiResolveURL('SUITELET','customscript_pp_sl_ai_actions', 'customdeploy_pp_sl_ai_actions_image') + '&invid=' + invId;
	window.open(url,'Invoice Image',"width=700, height=720, menubar=no, toolbar=no, scrollbars=yes");
}

/*
 * Close the popup window and refresh this window
 */
function closeAndRefresh(win){
	win.close();
	location.reload();
}


function displayMessage(msg,a){
	//alert(msg);
	if(typeof Ext != 'undefined'){
		Ext.Msg.alert('Error Details', msg);
	}
	else{
		alert(msg);
	}
	
}