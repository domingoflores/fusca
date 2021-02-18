/**
 * Add an applyable sublist of invoices to the item receipt form.
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Mar 2015     maxm
 *
 */

/**
 * @appliedtorecord itemreceipt
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	nlapiLogExecution('DEBUG', 'type', type);
	var context = nlapiGetContext();
	if(context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F'){
		return;
	}
	try{
		
		if(type == 'create' && context.getExecutionContext() == 'userinterface'){
			// assume createdfrom is a Purchase Order
			var createdFrom = nlapiGetFieldValue('createdfrom');
			var aiId = parseInt(request.getParameter('ai_id'));
			if(createdFrom){
				nlapiLogExecution('DEBUG', 'createdfrom is', createdFrom);
				if(aiId && !isNaN(aiId)){
					var invoiceRec = nlapiLoadRecord('customrecord_ai_imported_invoices',aiId);
					// PRELOAD FIELDS THAT COME FROM RAW DATA
					try{
						var rawInvoiceData = JSON.parse(invoiceRec.getFieldValue('custrecord_ai_inv_raw_data'));
						
						var memo = rawInvoiceData.Memo;
						nlapiSetFieldValue('memo',memo);
					}
					catch(e){
						nlapiLogExecution('ERROR','Error using raw data',e.toString());
					}
				}
				
				var searchResults = applyableInvoiceSearch(createdFrom);
				addAndBuildSublist(form,searchResults,aiId,true);
			}
		}
		else if((type == 'view' || type == 'edit') && context.getExecutionContext() == 'userinterface'){
			var searchResults = appliedInvoiceSearch(nlapiGetRecordId());
			var aiId = null;
			if(searchResults){
				aiId = searchResults[0].getId();
			}
			addAndBuildSublist(form,searchResults,aiId,true);
			
			if(type == 'view'){
				// Make the view invoice link work since client script deployments do not attach to the view action
				form.setScript('customscript_pp_cs_ai_ue_sublist');
			}
		}
	}
	catch(e){
		nlapiLogExecution('ERROR',e.name,e.message);
	}
	
}

/**
 * @appliedtorecord itemreceipt
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
}

/**
 * @appliedtorecord itemreceipt
 * 
 * * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 */
function userEventAfterSubmit(type){
	var context = nlapiGetContext();
	
	var newRec = nlapiGetNewRecord();
	var submitinv = newRec.getFieldValue('submitinv'); //Save & Bill
	
	if(context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F'){
		return true;
	}
	try{
		if(type == 'create'){
			
			var ai_id = null;
			var appliedInvoiceIds = [];
			var itemCount = nlapiGetLineItemCount('custpage_ai_invoices');
			if(itemCount > 0){
				for(var i = 0; i < itemCount; i++){
					if(nlapiGetLineItemValue('custpage_ai_invoices', 'apply', i+1) == 'T'){
						appliedInvoiceIds.push(nlapiGetLineItemValue('custpage_ai_invoices', 'internalid', i+1));
						ai_id = nlapiGetLineItemValue('custpage_ai_invoices', 'internalid', i+1);
					}
				}
			}
			
			// overide redirect url when Save & Bill is clicked so we can tack on ai_id parameter
			if(submitinv && ai_id){
				var params = {
						ai_id: ai_id,
						transform: "purchord",
						id: newRec.getFieldValue('createdfrom'),
						memdoc : "0",
						e: "T",
						itemrcpt: newRec.getId()
				};
				
				nlapiSetRedirectURL('RECORD', 'vendorbill', null, null, params);
			}
		}
	}
	catch(e){
		nlapiLogExecution('ERROR',e.name,e.message);
	}
}

/**
 * Find all invoices that can be applied to this item receipt
 * 
 * @param poId {integer} optional
 * 
 * @returns [nlobjSearchResult]
 */
function applyableInvoiceSearch(poId){
	var filters = [];
	var columns = [];

	filters.push(new nlobjSearchFilter('custrecord_ai_inv_is_error',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_is_matched',null,'is','T'));
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_purchase_order',null,'is',poId));
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_item_receipt',null,'anyof',['@NONE@']));
	
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_purchase_order'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_amount'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_number'));
	
	var searchResults = nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters,columns);
	return searchResults;
}

/**
 * Find all invoices applied to this receipt
 * 
 * @param receiptId
 * @returns [nlobjSearchResult]
 */
function appliedInvoiceSearch(receiptId){
	var filters = [];
	var columns = [];

	filters.push(new nlobjSearchFilter('custrecord_ai_inv_is_error',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_is_matched',null,'is','T'));
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_item_receipt',null,'anyof',[receiptId]));
	
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_purchase_order'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_amount'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_number'));
	
	var searchResults = nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters,columns);
	return searchResults;
}

function addAndBuildSublist(form,searchResults,selectedInvoiceId,viewMode){
	form.addTab('custpage_ai', 'AvidInvoice');
	var sublist = form.addSubList('custpage_ai_invoices', 'list', 'Avid Invoice','custpage_ai');

	var applyF = sublist.addField('apply','checkbox','Apply');
	if(viewMode){
		applyF.setDisplayType('disabled');
	}
	else{
		form.setScript('customscript_pp_cs_ai_ue_sublist');
	}
	
	sublist.addField('invoice_number','text','Invoice #');
	sublist.addField('amount','currency','Amount');
	sublist.addField('po','text','Purchase Order');
	sublist.addField('link_to_image','text','Invoice');
	sublist.addField('internalid','text').setDisplayType('hidden');
	
	var sr = null;
	// There could be multiple invoices with matching PO, do we make the user choose one at a time?
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			sr = searchResults[i];
			if(selectedInvoiceId == sr.getId()){
				sublist.setLineItemValue('apply', i+1, 'T');
			}
			sublist.setLineItemValue('po', i+1,  sr.getText('custrecord_ai_inv_purchase_order'));
			sublist.setLineItemValue('invoice_number', i+1,  sr.getValue('custrecord_ai_inv_number'));
			sublist.setLineItemValue('amount', i+1,  sr.getValue('custrecord_ai_inv_amount'));
			sublist.setLineItemValue('internalid', i+1,  sr.getId());
			sublist.setLineItemValue('link_to_image', i+1,  '<a href="javascript:window.viewInvoice('+sr.getId()+')">View Invoice</a>');
		}
		
	}
	return sublist;
}