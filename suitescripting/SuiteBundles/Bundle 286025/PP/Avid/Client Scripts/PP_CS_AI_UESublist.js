/**
 * Only selected one invoice to be applied
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Nov 2015     mmenlove
 * 2.10.1     16 Jun 2017	  jreid			   S15719: honor the address and memo override logic for vendorcredit records (ref: S15832 & S15833)
 *
 */


var ppAiPageType;

function clientPageInit(type){
	ppAiPageType = type;
	
	try{
		var recType = nlapiGetRecordType();
		if((recType == 'vendorbill' || recType == 'vendorcredit')&& (type == 'create' || type == 'copy')){
			
			var invAddrIdField = nlapiGetField('custpage_inv_address_id');
			if(invAddrIdField){
				nlapiLogExecution('debug', 'invAddrIdField', invAddrIdField);
				try{
					nlapiSetFieldValue('billaddresslist',nlapiGetFieldValue('custpage_inv_address_id'));
                } catch(ex) {
					nlapiLogExecution('error', 'error', ex.message);
                }
			}
			
			var memoOverrideField = nlapiGetField('custpage_memo_override');
			if(memoOverrideField){
				nlapiLogExecution('debug', 'memoOverrideField', memoOverrideField);
				try{
					nlapiSetFieldValue('memo',nlapiGetFieldValue('custpage_memo_override'));
					nlapiLogExecution('debug', 'custpage_memo_override', nlapiGetFieldValue('custpage_memo_override'));
                } catch(ex) {
					nlapiLogExecution('error', 'error', ex.message);
                }
			}
		}
	}
	catch(e){
		 window.console && console.error
         && console.error('Caught exception: ' + e.message);
	}
	
	
	/*var recType = nlapiGetRecordType();
	if(recType == 'vendorbill' && (type == 'copy' || type == 'create')){
		
		var dd = nlapiGetFieldValue('custpage_ai_due_date');
		console.log(dd);
		setTimeout(function(){nlapiSetFieldValue('duedate',nlapiGetFieldValue('custpage_ai_due_date'),false);},1000);
		// reset the user total in setTimeout to prevent NetSuite from overwriting this value when a line item is selected
		if(nlapiGetFieldValue('usertotal')){
			setTimeout(function(){nlapiSetFieldValue('usertotal',nlapiGetFieldValue('usertotal'),false);},1000);
		}
	}*/
}


function clientPostSourcing(type,name){
	//console.log('post source ' + name);
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord itemreceipt
 * @appliedtorecord vendorbill
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum){
	if(type == 'custpage_ai_invoices' && name == "apply"){
		// if checking, uncheck all other invoice lines
		var val = nlapiGetLineItemValue(type,name,linenum);
		if(val == 'T'){
			var numItems = nlapiGetLineItemCount(type);
			if(numItems > 1){
				for(var i = 1; i <= numItems; i++){
					if(i == linenum){
						continue;
					}
					nlapiSetLineItemValue(type,name,i,'F');
				}
			}
		}
	}
}


function clientSaveRecord(type){
	var recType = nlapiGetRecordType();
	
	if(recType == 'vendorbill' && (ppAiPageType == 'create' || ppAiPageType == 'copy')){	
		if(hasSelectedInvoice()){
			var usertotal = nlapiGetFieldValue('usertotal');
			var selectedInvoiceTotal = getSelectedInvoiceTotal();
			
			if(usertotal != selectedInvoiceTotal){
				return confirm('The selected AvidInvoice total does not match the bill total. Do you still want to create this bill?');
			}
			
			var aiDueDate = nlapiGetFieldValue('custpage_ai_due_date');
			if(aiDueDate && aiDueDate != nlapiGetFieldValue('duedate')){
				return confirm('The selected AvidInvoice\'s due date does not match the selected due date. Do you still want to create this bill?');
			}
		}
	}
	return true;
}

function hasSelectedInvoice(){
	var numItems = nlapiGetLineItemCount('custpage_ai_invoices');
	
	for(var i = 1; i <= numItems; i++){
		if(nlapiGetLineItemValue('custpage_ai_invoices','apply',i) == 'T'){
			return true;
		}
	}
	return false;
}


function getSelectedInvoiceTotal(){
	var numItems = nlapiGetLineItemCount('custpage_ai_invoices');
	
	var total = '0.00'; 
	for(var i = 1; i <= numItems; i++){
		if(nlapiGetLineItemValue('custpage_ai_invoices','apply',i) == 'T'){
			total = nlapiGetLineItemValue('custpage_ai_invoices','amount',i);
			break;
		}
	}
	
	return total;
}


function viewInvoice(invId){	
	var url = window.location.protocol + '//' + window.location.host + nlapiResolveURL('SUITELET','customscript_pp_sl_ai_actions', 'customdeploy_pp_sl_ai_actions_image') + '&invid=' + invId;
	window.open(url,'Invoice Image',"width=700, height=720, menubar=no, toolbar=no, scrollbars=yes");
}

