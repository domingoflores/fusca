/**
 * Hook AvidInvoice functionality into NetSuite's vendor credit record
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 May 2017     jreid
 *
 */



// use formula to get purchase order record so avidinvoice records with null purchase order values are returned in OneWorld for roles without cross subsidiary viewing enabled
var poColumn = new nlobjSearchColumn('formulatext');
poColumn.setFormula('case when {custrecord_ai_inv_purchase_order.id} is null then \'\' else {custrecord_ai_inv_purchase_order.id}||\':\'||{custrecord_ai_inv_purchase_order} end');


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord vendorcredit
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	
	//TODO: do we want this to run for anything other execution context other than UI. No? What about if customer has way to automatically create credits?
	// if coming from a receipt
	try{
		var context = nlapiGetContext();
		if(context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F'){
			return;
		}
		
		if(type == 'create' && context.getExecutionContext() == 'userinterface'){
			form.addTab('custpage_ai', 'AvidInvoice');
			
			var invoiceId = parseInt(request.getParameter('ai_id')).toString();
			//var aiIdParam = request.getParameter('ai_id');
			//var compid = request.getParameter('compid'); //only really comes up with testdrive accounts, but sometimes that rolls the ai_id parameter up into them, so this is a workaround
			//if ((aiIdParam =='' || aiIdParam == null) && (compid != '' && compid != null)) {
			//	//get aiId from compid
			//	aiIdParam = compid.substr(compid.lastIndexOf('=') + 1);
			//	nlapiLogExecution('debug', 'new aiIdParam', aiIdParam);
			//}
            //var invoiceId = parseInt(aiIdParam).toString();
            nlapiLogExecution('debug', 'invoiceId', invoiceId);

			if(typeof invoiceId != 'undefined' && !isNaN(invoiceId)){
				// make sure it is a valid invoice
				var searchResults = applyableInvoiceSearch(null,invoiceId);
				if(searchResults){
					var invoiceRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId);
					
					addAndBuildSublist(form,searchResults,invoiceId,true);
					
					var poId = invoiceRec.getFieldValue('custrecord_ai_inv_purchase_order');
					
					// PRELOAD FIELDS
					/*<<S15719: no duedate in credits>>
					//TODO: If the due date is in the past, it sets it to the invoice date.. 
					nlapiSetFieldValue('duedate',invoiceRec.getFieldValue('custrecord_ai_inv_due_date'));
					var aidd = form.addField('custpage_ai_due_date', 'date', 'My Due Date');
					aidd.setDisplayType('hidden');
					aidd.setDefaultValue(invoiceRec.getFieldValue('custrecord_ai_inv_due_date'));
					*/
					nlapiLogExecution('DEBUG','RecordType = ' + nlapiGetRecordType());
					nlapiSetFieldValue('trandate',invoiceRec.getFieldValue('custrecord_ai_inv_invoice_date'));
					nlapiSetFieldValue('tranid',invoiceRec.getFieldValue('custrecord_ai_inv_number'));
					
					// only set amount if invoice does not have corresponding purchase order
					if(!poId){
						nlapiSetFieldValue('usertotal',invoiceRec.getFieldValue('custrecord_ai_inv_amount'));
					}
					
					
					// Set billing address from imported invoice 
					var invAddressId = invoiceRec.getFieldValue('custrecord_ai_inv_vnd_addr_id');
					if(invAddressId){
						
						// check if vendor actually has address
						function isValidVendorAddressId(vendorId,vendorAddressId){
							var filters = [];
							var columns = [];
							
							filters.push(new nlobjSearchFilter('internalid', null, 'is', vendorId));
							columns.push(new nlobjSearchColumn('addressinternalid'));
							
							var vendorAddressSearchResults = nlapiSearchRecord('vendor',null,filters,columns);
							if(vendorAddressSearchResults.length > 0){
								// should only be one
								for(var i = 0; i < vendorAddressSearchResults.length; i++){
									if(vendorAddressSearchResults[i].getValue('addressinternalid') == invAddressId){
										return true;
									}
								}
							}
							return false;
						}
						
						// write the vendor address id to a hidden field and use it to set the addresslist via client script since we can't force the vendor address to load via the user event script
						if(isValidVendorAddressId(invoiceRec.getFieldValue('custrecord_ai_inv_vendor'),invAddressId)){
							var invAddrIdField = form.addField('custpage_inv_address_id', 'text', 'Inv Addr Id');
							invAddrIdField.setDefaultValue(invAddressId);
							invAddrIdField.setDisplayType('hidden');
						}
						else{
							nlapiLogExecution('ERROR','Invalid custrecord_ai_inv_vnd_addr_id',invAddressId + ' is not a valid address id for vendor with id ' + invoiceRec.getFieldValue('custrecord_ai_inv_vendor'));
						}

					}
					
					var useAIMemoEnabled = (context.getSetting('SCRIPT', 'custscript_pp_ai_use_memo') == 'T' ? true : false);
					var vendorFields = nlapiLookupField('vendor',invoiceRec.getFieldValue('custrecord_ai_inv_vendor'),['custentity_pp_ai_acct_num_override','accountnumber']);
					var accountNumOverrideEnabled = (vendorFields.custentity_pp_ai_acct_num_override == 'T' ? true : false);
					
					// PRELOAD FIELDS THAT COME FROM RAW DATA
					try{
						var rawInvoiceData = JSON.parse(invoiceRec.getFieldValue('custrecord_ai_inv_raw_data'));
						
						
						// Only calculate and override the memo if one of the two overrides are enabled
						if(useAIMemoEnabled || accountNumOverrideEnabled){
							
							// First calculate the account number
							var accountNo = null;
							
							if(accountNumOverrideEnabled && typeof rawInvoiceData.BuyerVendorAccount != 'undefined' && rawInvoiceData.BuyerVendorAccount.AccountNo){
								var aiAccountNo  = rawInvoiceData.BuyerVendorAccount.AccountNo;
								if(typeof aiAccountNo == 'number'){
									aiAccountNo = aiAccountNo.toFixed();
								}
								
								// write the account number to a hidden field and use it to set the memo via client script since we can't force it via the user event script
								if(aiAccountNo.toLowerCase() != 'none'){
									accountNo = aiAccountNo;
								}
							}
							
							// try and fallback to vendor account number if we still have no accountNo
							if(!accountNo && vendorFields.accountnumber){
								accountNo = vendorFields.accountnumber;
							}
							
							// Second calculate the base memo
							var memo = '';
							if(useAIMemoEnabled && rawInvoiceData.Memo){
								memo = rawInvoiceData.Memo;
							}
							
							// try and fallback to purchase order memo if we still have no memo
							if(!memo && poId){
								memo = nlapiLookupField('purchaseorder',poId,'memo');
							}
							
							// Finally calculate the memo override
							var memoOverride = '';
							if(accountNo && memo){
								memoOverride = accountNo + ' - ' + memo;
							}
							else if(accountNo){
								memoOverride = accountNo;
							}
							else if(memo){
								memoOverride = memo;
							}
							
							if(memoOverride){
								var memoOverideField = form.addField('custpage_memo_override','text','Memo Override');
								memoOverideField.setDefaultValue(memoOverride);
								memoOverideField.setDisplayType('hidden');
							}
						}
						
						
						if(context.getSetting('SCRIPT', 'custscript_pp_ai_use_terms') == 'T'){
							var termTypeName = rawInvoiceData.TermType.termTypeName;
							nlapiSetFieldText('terms',termTypeName);
						}
						
					}
					catch(e){
						nlapiLogExecution('ERROR','Error using raw data',e.toString());
					}
				}
			}
		}
		else if(type == 'view' || type == 'edit' && context.getExecutionContext() == 'userinterface'){
			form.addTab('custpage_ai', 'AvidInvoice');
			var searchResults = appliedInvoiceSearch(nlapiGetRecordId());
			addAndBuildSublist(form,searchResults,null,true);
			
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



//TODO: PREVENT USERS FROM SUBMITTING INVOICES THAT DO NOT BELONG TO THE ENTITY
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
	var context = nlapiGetContext();
	if(context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F'){
		return true;
	}
	if(type == 'create'){

		var newRec = nlapiGetNewRecord();

		// DATA VALIDATION: Only one invoice can be selected and the selected invoice PO must match the submitted createdfrom value.
		var appliedInvoiceIds = [];
		var itemCount = nlapiGetLineItemCount('custpage_ai_invoices');
		
		if(itemCount > 0){
			for(var i = 0; i < itemCount; i++){
				if(nlapiGetLineItemValue('custpage_ai_invoices', 'apply', i+1) == 'T'){
					appliedInvoiceIds.push(nlapiGetLineItemValue('custpage_ai_invoices', 'internalid', i+1));
				}
			}
			
			if(appliedInvoiceIds.length > 1){
				throw nlapiCreateError('PP_AI_MULTIPLE_INVOICES_SELECTED','There can only be one invoice selected per receipt');
			}
			else if(appliedInvoiceIds.length == 1){
				var lookup = nlapiLookupField('customrecord_ai_imported_invoices',appliedInvoiceIds[0],['custrecord_ai_inv_vendor','custrecord_ai_inv_purchase_order']);
				if(lookup.custrecord_ai_inv_vendor != nlapiGetFieldValue('entity')){
					nlapiLogExecution('DEBUG','Lookup != createdfrom','Lookup = ' + lookup.lookupVendorId + '; entity = ' + nlapiGetFieldValue('entity'));
					throw nlapiCreateError('PP_AI_INVALID_INVOICE_SELECTED','The selected invoice\'s vendor does not match the credit\'s vendor');
				}
				else if(newRec.getFieldValue('transform') == 'purchord' && lookup.custrecord_ai_inv_purchase_order != newRec.getFieldValue('podocnum')){
					nlapiLogExecution('DEBUG','Lookup != podocnum','Lookup = ' + lookup.custrecord_ai_inv_purchase_order + '; podocnum = ' + newRec.getFieldValue('podocnum'));
					throw nlapiCreateError('PP_AI_INVALID_INVOICE_SELECTED','The selected invoice\'s purchase order does not match the credit\'s purchase order');
				}
			}
		}
	}
}






/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord vendorcredit
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time credit, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	try{
		var context = nlapiGetContext();
		if(context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F'){
			return true;
		}
		if(type == 'create' && context.getExecutionContext() == 'userinterface'){
			
			// find applied invoices from sublist
			var appliedInvoiceIds = [];
			var itemCount = nlapiGetLineItemCount('custpage_ai_invoices');
			if(itemCount > 0){
				for(var i = 0; i < itemCount; i++){
					if(nlapiGetLineItemValue('custpage_ai_invoices', 'apply', i+1) == 'T'){
						appliedInvoiceIds.push(nlapiGetLineItemValue('custpage_ai_invoices', 'internalid', i+1));
					}
				}
			}
			
			// there should only ever be one applied invoice per receipt. Made this a loop in case this ever changes.
			if(appliedInvoiceIds.length > 1){
				nlapiLogExecution('ERROR','More than one invoice was applied to a credit',appliedInvoiceIds.length);
			}
			
			for(var i = 0; i < appliedInvoiceIds.length; i++){
				var invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',appliedInvoiceIds[i]);
				invRec.setFieldValue('custrecord_ai_inv_credit',nlapiGetRecordId());
				nlapiSubmitRecord(invRec);
			}
			
			if(appliedInvoiceIds.length > 0){
				nlapiSetRedirectURL('SUITELET','customscript_pp_sl_ai_invoice_list','customdeploy_pp_sl_ai_invoice_list');
			}
		}
	}
	catch(e){
		nlapiLogExecution('ERROR',e.name,e.message);
	}
}

function addAndBuildSublist(form,searchResults,selectedInvoiceId,viewMode){
	//form.addTab('custpage_ai', 'AvidInvoice');
	var sublist = form.addSubList('custpage_ai_invoices', 'list', 'Avid Invoice','custpage_ai');

	var applyF = sublist.addField('apply','checkbox','Apply');
	if(viewMode){
		applyF.setDisplayType('disabled');
	}
	sublist.addField('invoice_number','text','Invoice #');
	sublist.addField('amount','currency','Amount');
	sublist.addField('po','text','Purchase Order');
	//sublist.addField('receipt','text','Item Receipt');
	sublist.addField('link_to_image','text','Invoice');
	sublist.addField('internalid','text').setDisplayType('hidden');
	
	var sr = null;
	// There could be multiple invoices with matching PO, do we make the user choose one at a time?
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			sr = searchResults[i];
			if(viewMode || selectedInvoiceId == sr.getId()){
				sublist.setLineItemValue('apply', i+1, 'T');
			}
			
			var poValue = null;
			var poText = null;
			var poRaw = sr.getValue(poColumn);
			
			if(poRaw){
				var poParts = poRaw.split(':');
				poValue = poParts[0];
				poText = poParts[1];
			}
			
			sublist.setLineItemValue('invoice_number', i+1,  sr.getValue('custrecord_ai_inv_number'));
			sublist.setLineItemValue('amount', i+1,  sr.getValue('custrecord_ai_inv_amount'));
			sublist.setLineItemValue('po', i+1,  poText);
			sublist.setLineItemValue('internalid', i+1,  sr.getId());
			sublist.setLineItemValue('link_to_image', i+1,  '<a href="javascript:window.viewInvoice('+sr.getId()+')">View Invoice</a>');
		}
		
	}
	return sublist;
}


/**
 * Find all invoices that can be applied to this credit
 * 
 * @param purchaseOrderId {integer} optional
 * @param invoiceId {integer} optional
 * @returns [nlobjSearchResult]
 */
function applyableInvoiceSearch(purchaseOrderId,invoiceId){

	var filters = [];
	var columns = [];
	
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_po_number'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_id'));
	columns.push(poColumn);
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_amount'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_number'));
	columns.push(new nlobjSearchColumn('created'));
	
	if(!purchaseOrderId && !invoiceId){
		throw nlapiCreateError('PP_FUNC_ERR','purchaseOrderId or invoiceId must be passed to applyableInvoiceSearch');
	}
	
	if(invoiceId){
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', invoiceId));
	}
	
	if(purchaseOrderId){
		filters.push(new nlobjSearchFilter('custrecord_ai_inv_purchase_order', null, 'anyof', purchaseOrderId));
	}
	
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_bill', null, 'anyof', '@NONE@'));
	
	return  nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters,columns);
}

/**
 * Find all invoices applied to this credit
 * 
 * @param billId
 * @returns [nlobjSearchResult]
 */
function appliedInvoiceSearch(billId){

	var filters = [];
	var columns = [];
	
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_po_number'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_id'));
	columns.push(poColumn);
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_amount'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_number'));
	columns.push(new nlobjSearchColumn('created'));
	
	if(!billId){
		throw nlapiCreateError('PP_FUNC_ERR','billId is required');
	}
	
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_bill', null, 'anyof', billId));
	
	return  nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters,columns);
}


function findInvoiceIdsByPurchaseOrderId(purchaseOrderId){
	var results = [];
	var filters = [];
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_purchase_order', null, 'anyof', purchaseOrderId));
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_bill', null, 'anyof', '@NONE@'));
	
	var searchResults = nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			results.push(searchResults[i].getId());
		}
	}
	return results;
}


function findInvoiceIdByBillId(billId){
	var filters = [];
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_bill', null, 'anyof', billId));
	
	var searchResults = nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters);
	if(searchResults){
		return searchResults[0].getId();
	}
	return null;
}


/**
 * 
 * VendorExternalSystemID can contain both the NetSuite vendor internalid and NetSuite vendor address internalid separated by a pipe. E.G. {vendorInternalId}|{vendorAddressInternalId}
 *
 */
function extractVendorIdVendorAddressId(matchingExternalInvoice){
	var vendorExternalSystemID = matchingExternalInvoice.BuyerVendor.VendorExternalSystemID || "";
	var obj = {
			vendorInternalId: '',
			vendorAddressInternalId : null
	};
	
	var parts = vendorExternalSystemID.split("|",2);
	if(parts.length > 1){
		obj.vendorInternalId = parts[0];
		obj.vendorAddressInternalId = parts[1];
	}
	else{
		obj.vendorInternalId = vendorExternalSystemID;
	}
	return obj;
}
