/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Nov 2015     mmenlove
 * 2.11       01 Jun 2017     jreid            S15719 Added more debug logging
 * 2.15       24 Sep 2018     jreid            S25425: Do something about iHerb's missing fixed invoice issue: 
 *                                                     1. replace PO selection on Fix Invoice form
 *                                                     2. add logging to help resolve this  
 * 2.15.1     15 Oct 2018     jreid            S26382: Resolve issues with 1000+ purchases order in the fix invoice dialog : revert S25425 #1
 * 2.18.0.22  8  Aug 2019     dwhetten         S58602: Add AP Processor to the AvidInvoice error queue
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	var context = nlapiGetContext();
	if(context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F'){
		throw nlapiCreateError('PP_AI_NOT_ENABLED','The AvidInvoice feature is not enabled.');
	}
	
	var action = nlapiGetContext().getSetting('script', 'custscript_pp_ai_invoice_action');
	nlapiLogExecution('debug', 'action', action);
	switch(action){
	case 'invalid':
		invalidAction(request, response);
		break;
	case 'fix':
		fixAction(request, response);
		break;
	case 'image':
		viewImageAction(request, response);
		break;
	case 'sync':
		syncAction(request, response);
		break;
	case 'selectbill':
		selectBillAction(request, response);
		break;
	/*case 'view_invoice':
		viewInvoiceAction(request, response);
		break;*/
	default:
		throw('Action not found');
		break;
	}
	
}

function invalidAction(request, response){
	if(request.getMethod() == 'GET'){
		var invRec; 
		var invoiceId = parseInt(request.getParameter('invid'));
		if(invoiceId == NaN){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','The invid parameter is not a valid integer');
		}
		
		try{
			invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId);
			
		}
		catch(e){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','Unable to load the invoice');
		}
		
		//TODO: verify invoice is invalidable what ever that means
		
		var form = nlapiCreateForm('Set Invoice As Invalid', true);
		
		
		form.setScript('customscript_pp_cs_ai_actions');
		form.addField('invalid_reason','textarea','Invalid Reason');
		var invIdField = form.addField('invid','text','Invoice Id');
		invIdField.setDisplayType('hidden');
		invIdField.setDefaultValue(invoiceId.toString());
		
		
		//form.addButton('submit', 'Submit', 'submit()');
		form.addButton('cancel', 'Cancel', 'window.closeWindow()');
		
		form.addSubmitButton('Submit');
		response.writePage(form);
	}
	else{
		var form = nlapiCreateForm('Set Invoice As Invalid', true);
		
		var invoiceId = parseInt(request.getParameter('invid'));
		
		try{
			invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId);
			
		}
		catch(e){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','Unable to load the invoice');
		}
		
		invRec.setFieldValue('custrecord_ai_inv_is_error', 'T');
		invRec.setFieldValue('custrecord_ai_inv_error_code', 'USER_MARKED_INVALID');
		invRec.setFieldValue('custrecord_ai_inv_user_error_message', request.getParameter('invalid_reason'));
      invRec.setFieldValue('custrecord_ai_invalidated_by_user_id', nlapiGetUser());
		
		nlapiSubmitRecord(invRec);
		
		form.setScript('customscript_pp_cs_ai_actions');
		
		// Write field that tells script to close the window
		var cm = form.addField('do_onload_action','text','What to do onload');
		cm.setDisplayType('hidden');
		cm.setDefaultValue('closeAndRefresh');
		
		response.writePage(form);
	}
}


function fixAction(request, response){
  	nlapiLogExecution('DEBUG', 'fixAction', 'Suitelet method = ' + request.getMethod());
	if(request.getMethod() == 'GET'){
		var invRec; 
		var invoiceId = parseInt(request.getParameter('invid'));
		if(invoiceId == NaN){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','The invid parameter is not a valid integer');
		}
		nlapiLogExecution('debug', 'fixAction', 'invoiceId='+invoiceId);
		try{
			invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId);
			
		}
		catch(e){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','Unable to load the invoice');
		}
		
		var form = nlapiCreateForm('Fix Invoice', true);
		
		var edg = form.addFieldGroup('errordetailsgroup', 'Error Details');
		edg.setSingleColumn(false);
		
		
		form.addField('bogusf','inlinehtml',' &nbsp;',null,'bogus');
				
  		nlapiLogExecution('DEBUG', 'fixAction', 'Error Code = ' + invRec.getFieldValue('custrecord_ai_inv_error_code'));
		var errorCodeField = form.addField('error_code','text','Error Code',null,'errordetailsgroup');
		errorCodeField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_error_code'));
		errorCodeField.setDisplayType('inline');
		errorCodeField.setBreakType('startcol');
		
		if(invRec.getFieldValue('custrecord_ai_inv_error_code') == 'USER_MARKED_INVALID'){
	  		nlapiLogExecution('DEBUG', 'fixAction', 'Error Details = ' + invRec.getFieldValue('custrecord_ai_inv_user_error_message'));
			var errorDetailsField = form.addField('error_details','textarea','Error Details',null,'errordetailsgroup');
			errorDetailsField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_user_error_message'));
			errorDetailsField.setDisplayType('inline');
		}
		else{
			// Invoice Vendor 
          	if(invRec.getFieldValue('custrecord_ai_inv_vendor_id') || invRec.getFieldValue('custrecord_ai_inv_vendor_name')){
          		// The custrecord_ai_inv_vendor_id & custrecord_ai_inv_vendor_name are set from the invoice raw data 
    			var invVendor = '(' + invRec.getFieldValue('custrecord_ai_inv_vendor_id') + ') ' + invRec.getFieldValue('custrecord_ai_inv_vendor_name');
    	  		nlapiLogExecution('DEBUG', 'fixAction', 'Invoice Vendor = ' + invVendor);
    			var errorInvVendorField = form.addField('custpage_error_invoice_vendor','text','Invoice Vendor',null,'errordetailsgroup');
    			errorInvVendorField.setDisplayType('inline');
    			errorInvVendorField.setDefaultValue(invVendor);
          	}
          	// Invoice PO Number
          	if(invRec.getFieldValue('custrecord_ai_inv_po_number')){
          		// The custrecord_ai_inv_po_number is set from the invoice raw data 
		  		nlapiLogExecution('DEBUG', 'fixAction', 'PO Number = ' + invRec.getFieldValue('custrecord_ai_inv_po_number'));
    			var errorPONumField = form.addField('error_po_number','text','Invoice PO Number',null,'errordetailsgroup');
    			errorPONumField.setDisplayType('inline');
				errorPONumField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_po_number'));
            }
          	// In the unlikely chance we have valid values from NetSuite, display them
          	// Vendor
          	if(invRec.getFieldValue('custrecord_ai_inv_vendor')){
          		// The custrecord_ai_inv_vendor is set by PP_SS_AIMatch when 
          		// 1. the custrecord_ai_inv_po_number is found and 
          		// 2. the custrecord_ai_inv_vendor_id & the found PO's entity match 
		  		nlapiLogExecution('DEBUG', 'fixAction', 'Vendor = ' + invRec.getFieldValue('custrecord_ai_inv_vendor'));
    			var errorVendorField = form.addField('error_vendor','select','Vendor',null,'errordetailsgroup');
    			errorVendorField.setDisplayType('inline');
				errorVendorField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_vendor'));
            }
          	// Purchase Order
          	if(invRec.getFieldValue('custrecord_ai_inv_purchase_order')){
          		// The custrecord_ai_inv_purchase_order is set by PP_SS_AIMatch when 
          		// 1. the custrecord_ai_inv_po_number is found and 
          		// 2. the custrecord_ai_inv_vendor_id & the PO's entity match 
		  		nlapiLogExecution('DEBUG', 'fixAction', 'PO = ' + invRec.getFieldValue('custrecord_ai_inv_purchase_order'));
    			var errorPOField = form.addField('error_po','select','Purchase Order',null,'errordetailsgroup');
    			errorPOField.setDisplayType('inline');
				errorPOField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_purchase_order'));
            }
        }
		
		
		var mg = form.addFieldGroup('maingroup', 'Invoice Fields');
		mg.setSingleColumn(false);
		
		form.setScript('customscript_pp_cs_ai_actions');
		
		//po select field
  		nlapiLogExecution('DEBUG', 'fixAction', 'Add Purchase Order List field');
		var poField = form.addField('purchase_order','select','Purchase Order','purchaseorder','maingroup');
		poField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_purchase_order'));
		poField.setBreakType('startcol');
		
		//Vendor select field
  		nlapiLogExecution('DEBUG', 'fixAction', 'Add Vendor Select field');
		var vendorField = form.addField('vendor','select','Vendor','vendor','maingroup');
		vendorField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_vendor'));
		vendorField.setMandatory(true);
		//vendorField.setBreakType('none');
		
		//Amount field
		var amountField = form.addField('amount','text','Amount',null,'maingroup');
		amountField.setDefaultValue(invRec.getFieldValue('custrecord_ai_inv_amount'));
		amountField.setMandatory(true);
		//amountField.setBreakType('none');
		
		
		
		var invIdField = form.addField('invid','text','Invoice Id');
		invIdField.setDisplayType('hidden');
		invIdField.setDefaultValue(invoiceId.toString());
		
		
		//form.addButton('submit', 'Submit', 'submit()');
		form.addButton('cancel', 'Cancel', 'window.closeWindow()');
		
		form.addSubmitButton('Submit');
		response.writePage(form);
	}
	else{
		var form = nlapiCreateForm('Set Invoice As Invalid', true);
		
		var invoiceId = parseInt(request.getParameter('invid'));
  		nlapiLogExecution('DEBUG', 'fixAction', 'Save changes for Invoice ID = '+invoiceId);
		
		try{
			invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId,{recordMode: 'dynamic'});
			
		}
		catch(e){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','Unable to load the invoice');
		}
		
		
		var poId = (parseInt(request.getParameter('purchase_order')) || "").toString();
		var vendorId = (parseInt(request.getParameter('vendor')) || "").toString();
		var amount = nlapiFormatCurrency(request.getParameter('amount'));
		
		// make sure purchase order's vendor matches the selected vendor
		if(poId){
			var poVendorId = nlapiLookupField('purchaseorder',poId,'entity');
			
			if(poVendorId != vendorId){
				throw nlapiCreateError('PP_AI_PO_VENDOR_MISMATCH','The vendor of the selected purchase order does not match the selected vendor');
			}
		}
		var changes = [];
		if(invRec.getFieldValue('custrecord_ai_inv_vendor') != vendorId){
	  		nlapiLogExecution('DEBUG', 'fixAction', 'New Vendor ID = '+vendorId);
			var change = {
					field_id : 'custrecord_ai_inv_vendor',
					old_value : invRec.getFieldValue('custrecord_ai_inv_vendor'),
					new_value : vendorId,
					new_text : '',
					reference_value : invRec.getFieldValue('custrecord_ai_inv_vendor_id'),
					reference_text : invRec.getFieldValue('custrecord_ai_inv_vendor_name')
				};
			
			invRec.setFieldValue('custrecord_ai_inv_vendor', vendorId);
			change.new_text = invRec.getFieldText('custrecord_ai_inv_vendor');
			changes.push(change);
		}
		
		if(invRec.getFieldValue('custrecord_ai_inv_purchase_order') != poId){
	  		nlapiLogExecution('DEBUG', 'fixAction', 'New Purchase Order ID = '+poId);
			var change = {
					field_id : 'custrecord_ai_inv_purchase_order',
					old_value : invRec.getFieldValue('custrecord_ai_inv_purchase_order'),
					new_value : poId,
					new_text : (poId ? nlapiLookupField('purchaseorder', poId, 'tranid') : poId), 
					reference_value : invRec.getFieldValue('custrecord_ai_inv_po_number'),
					reference_text : null
				};
			
			invRec.setFieldValue('custrecord_ai_inv_purchase_order', poId);
			changes.push(change);
		}
		
		if(invRec.getFieldValue('custrecord_ai_inv_amount') != amount){
	  		nlapiLogExecution('DEBUG', 'fixAction', 'New Amount = '+amount);
			var change = {
					field_id : 'custrecord_ai_inv_amount',
					old_value : invRec.getFieldValue('custrecord_ai_inv_amount'),
					new_value : amount,
					new_text : '', 
					reference_value : invRec.getFieldValue('custrecord_ai_inv_amount'),
					reference_text : null
				};
			invRec.setFieldValue('custrecord_ai_inv_amount', amount);
			changes.push(change);
		}

		var originalErrorCode = invRec.getFieldValue('custrecord_ai_inv_error_code');
		var originalErrorMessage = invRec.getFieldValue('custrecord_ai_inv_user_error_message');
		
		// clear error fields
		invRec.setFieldValue('custrecord_ai_inv_is_error', 'F');
		invRec.setFieldValue('custrecord_ai_inv_error_code', '');
		invRec.setFieldValue('custrecord_ai_inv_user_error_message', '');
		
		// mark as manually resolved to prevent sync from overwriting these changes
		invRec.setFieldValue('custrecord_ai_inv_was_resolved_by_user', 'T');
		
		invRec.setFieldValue('custrecord_ai_inv_is_matched', 'T');

  		nlapiLogExecution('DEBUG', 'fixAction', 'Submit changes to Imported Invoice Record');
		nlapiSubmitRecord(invRec);
		
		if(changes.length > 0){
	  		nlapiLogExecution('DEBUG', 'fixAction', 'Add a new ChangeSet Record');
			var changesetRec = nlapiCreateRecord('customrecord_pp_ai_changeset');
			changesetRec.setFieldValue('custrecord_ai_imported_inv',invoiceId);
			changesetRec.setFieldValue('custrecord_ai_error_code',originalErrorCode);
			changesetRec.setFieldValue('custrecord_ai_user_error_message',originalErrorMessage);
			
			for(var i = 0; i < changes.length; i++){
				var c = changes[i];
				
				changesetRec.selectNewLineItem('recmachcustrecord_ai_ch_changeset');
				
				changesetRec.setCurrentLineItemValue('recmachcustrecord_ai_ch_changeset','custrecord_ai_ch_field_id',c.field_id);
				changesetRec.setCurrentLineItemValue('recmachcustrecord_ai_ch_changeset','custrecord_ai_ch_old_value',c.old_value);
				changesetRec.setCurrentLineItemValue('recmachcustrecord_ai_ch_changeset','custrecord_ai_ch_new_value',c.new_value);
				changesetRec.setCurrentLineItemValue('recmachcustrecord_ai_ch_changeset','custrecord_ai_ch_reference_text',c.reference_text);
				changesetRec.setCurrentLineItemValue('recmachcustrecord_ai_ch_changeset','custrecord_ai_ch_reference_value',c.reference_value);
				changesetRec.setCurrentLineItemValue('recmachcustrecord_ai_ch_changeset','custrecord_ai_ch_new_text',c.new_text);
				
				changesetRec.commitLineItem('recmachcustrecord_ai_ch_changeset');
			}
			nlapiSubmitRecord(changesetRec);
		}
		
		form.setScript('customscript_pp_cs_ai_actions');
		
		// Write field that tells script to close the window
		var cm = form.addField('do_onload_action','text','What to do onload');
		cm.setDisplayType('hidden');
		cm.setDefaultValue('closeAndRefresh');
  		nlapiLogExecution('DEBUG', 'fixAction', 'Close and Refresh the form');
		response.writePage(form);
	}
}


function selectBillAction(request, response){
	if(request.getMethod() == 'GET'){
		var invRec; 
		var invoiceId = parseInt(request.getParameter('invid'));
		nlapiLogExecution('debug', 'invoiceId', invoiceId);
		if(invoiceId == NaN){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','The invid parameter is not a valid integer');
		}
		
		try{
			invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId);
			
		}
		catch(e){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','Unable to load the invoice');
		}
		
		var form = nlapiCreateForm('Select Bill For Invoice', true);
		
		var poField = form.addField('purchase_order','text','Purchase Order');
		poField.setDefaultValue('<a href="' + nlapiResolveURL('RECORD', 'purchaseorder', invRec.getFieldValue('custrecord_ai_inv_purchase_order')) + '" target="_blank">'+invRec.getFieldText('custrecord_ai_inv_purchase_order')+'</a>');
		poField.setDisplayType('inline');
		poField.setBreakType('startcol');
		nlapiLogExecution('debug', 'custrecord_ai_inv_purchase_order', invRec.getFieldText('custrecord_ai_inv_purchase_order'));
				
		form.setScript('customscript_pp_cs_ai_actions');
		
		var  vendorBillField = form.addField('vendor_bill','select','Vendor Bills',null);
		vendorBillField.setMandatory(true);
		
		var filters = [];
		var columns = [];
		
		filters.push(['createdfrom','anyof',invRec.getFieldValue('custrecord_ai_inv_purchase_order')]);
		filters.push('and',['mainline','is','T']);
		
		columns.push(new nlobjSearchColumn('tranid'));
		columns.push(new nlobjSearchColumn('trandate'));
		columns.push(new nlobjSearchColumn('amount'));

		var searchResults = nlapiSearchRecord('vendorbill',null,filters,columns);
		
		var vendorBillIds = [];
		var vendorBillMap = {};
		if(searchResults){
			//extract ids and name value pairs
			for(var i = 0; i < searchResults.length; i++){
				vendorBillIds.push(searchResults[i].getId());
				var refno = searchResults[i].getValue('tranid');
				var amount = searchResults[i].getValue('amount')
				var billLabel = "Bill";
				if(refno){
					billLabel += '# ' + refno;
				}
				else{
					billLabel += ' ' + searchResults[i].getValue('trandate');
				}
				billLabel += ' for ' + amount;
				vendorBillMap[searchResults[i].getId()] = billLabel;
              	nlapiLogExecution('debug', 'vendorBillMap['+searchResults[i].getId()+']', billLabel);
			}
			
			// filter already used vendor bills out of vendorBillMap
			var columns2 = [new nlobjSearchColumn('custrecord_ai_inv_bill')];
			var filters2 = [['custrecord_ai_inv_bill','anyof',vendorBillIds]];
			var searchResults2 = nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters2,columns2);
			
			if(searchResults2){
				for(var i = 0; i < searchResults2.length; i++){
	              	nlapiLogExecution('debug', 'deleting already used vendorBillMap',vendorBillMap[searchResults2[i].getValue('custrecord_ai_inv_bill')]);//,vendorBillMap[searchResults2[i].getValue('custrecord_ai_inv_bill')]);
					delete vendorBillMap[searchResults2[i].getValue('custrecord_ai_inv_bill')];
				}
			}
			
			vendorBillField.addSelectOption('','');
			for(id in vendorBillMap){
				vendorBillField.addSelectOption(id, vendorBillMap[id]);
			}
		}else{
          	nlapiLogExecution('debug', 'No vendorbills found for PO');
        }
		
		
		var invIdField = form.addField('invid','text','Invoice Id');
		invIdField.setDisplayType('hidden');
		invIdField.setDefaultValue(invoiceId.toString());
		
		form.addButton('cancel', 'Cancel', 'window.closeWindow()');
		
		form.addSubmitButton('Submit');
		response.writePage(form);
	}
	else{
		var form = nlapiCreateForm('Set Invoice As Invalid', true);
		
		var invoiceId = parseInt(request.getParameter('invid'));
		
		try{
			invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId,{recordMode: 'dynamic'});
			
		}
		catch(e){
			throw nlapiCreateError('PP_AI_INVALID_INVOICE','Unable to load the invoice');
		}
		
		
		var vendorBillId = (parseInt(request.getParameter('vendor_bill')) || "").toString();
		
		// make sure purchase order's matches the selected vendor bill
		if(vendorBillId){
			var lookupPOID = nlapiLookupField('vendorbill',vendorBillId,'createdfrom');
			
			if(lookupPOID != invRec.getFieldValue('custrecord_ai_inv_purchase_order')){
				throw nlapiCreateError('PP_AI_PO_BILL_MISMATCH','The vendor bill selected does not match the purchase order of the AvidInvoice record');
			}
			
			invRec.setFieldValue('custrecord_ai_inv_bill', vendorBillId);

			nlapiSubmitRecord(invRec);
			
			form.setScript('customscript_pp_cs_ai_actions');
			
			// Write field that tells script to close the window
			var cm = form.addField('do_onload_action','text','What to do onload');
			cm.setDisplayType('hidden');
			cm.setDefaultValue('closeAndRefresh');
			
			response.writePage(form);
		}
		else{
			throw nlapiCreateError('PP_AI_NO_BILL_PASSED','You must select a vendor bill');
		}
		
	}
}


function viewImageAction(request, response){
	
	
	var invoiceId = parseInt(request.getParameter('invid'));
	var invRec;
	try{
		invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',invoiceId);
	}
	catch(e){
		throw nlapiCreateError('PP_AI_INVALID_INVOICE','Unable to load the invoice');
	}
	
	
	// render the xml to string

	var imageUrl = invRec.getFieldValue('custrecord_ai_inv_image_url');
	if(imageUrl){
		
		
		
		//var imageField = form.addField('image','inlinehtml','Image');
		//imageField.setDefaultValue('<img src="'+imageUrl+'"/>');
		//imageField.setDefaultValue('<embed src="'+imageUrl+'" type="application/pdf" width="650" height="600"/>');
		//imageField.setLayoutType('outsideabove');
		
		var source = $PPS.getTemplate('ai_pdf_html.html');
		var template = Handlebars.compile(source);
		var xml = template({fileurl: imageUrl});
		response.write(xml);
		return;
	}
	else{
		var form = nlapiCreateForm('Invoice', true);
		$PPS.addMessageToForm(form,'warning','This invoice does not have an image');
		form.addButton('close', 'Close', 'window.closeWindow()');
		form.setScript('customscript_pp_cs_ai_actions');
		
		response.writePage(form);
	}
	
}


function syncAction(request, response){
	
	var result = nlapiScheduleScript('customscript_pp_ss_ai_sync','customdeploy_pp_ss_ai_sync_manual');
	
	$PPS.Session.setFlash('success','A sync was scheduled with the status '+ result);
	
	nlapiSetRedirectURL('SUITELET','customscript_pp_sl_ai_invoice_list','customdeploy_pp_sl_ai_invoice_list');
	
	/*var resultObj = {
			result : result,
			success: "1"
	};
	response.set
	response.write(JSON.stringify(resultObj));*/
	
	
}