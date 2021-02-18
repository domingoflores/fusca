/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Aug 2015     mmenlove
 * 2.11       01 Jun 2017     jreid            S15719 Create Bill Credit from Negative Amount Invoice
 * 2.15		  21 Sep 2018	  sdonald		   S23116 Added PO Status and PO # filters to Invoice List page
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */


/*
 
 field that is being filtered
 the type of filter (select,date,date range, text)
 if text, the type of text filter - contains,starts with, is, etc
 default value
 store in session
 
 
 Add field/fields to form
 Set field values/defaults from session or url parameters
 Writes info to client side so it can pick it up and use it
 
 
 
 */
// S23116 - the POFilterStatusMap maps the NetSuite PO status to the name of the status that we display in the list. 
var poFilterStatusMap = {
		"": "",
		"PurchOrd:E" : "Pending Billing/Partially Received", // Has no bill, partially received
		"PurchOrd:D" : "Partially Received", // Has one or more bills, partially received
		"PurchOrd:G": "Fully Billed", // Fully billed and received
		"PurchOrd:B": "Pending Receipt", // No receipts or bills.
		"PurchOrd:F" : "Pending Bill" // Zero or more bills, fully received.
};

var formFilters = [
		   {
		       	field: 'custrecord_ai_inv_vendor',
				label: 'Vendor',
				type: 'select',
				recordType: 'vendor',
				//options: function(){ return list of options;},
		       	storeInSession: true
		  },
		  {
             	field: 'custrecord_ai_inv_number',
             	label: 'Invoice #',
             	type: 'text',
             	storeInSession: true
		  },
		  {
	           	field: 'custrecord_ai_inv_batch',
	           	label: 'Invoice Batch',
	           	type: 'select',
	           	recordType: 'customrecord_pp_ai_invoice_batches',
	           	storeInSession: true
	      },
          {
	    	  	field: 'custrecord_ai_inv_start_date',
	         	label: 'Bill Date Start',
	         	type: 'date',
	         	storeInSession: true,
	         	connectedField: 'custrecord_ai_inv_end_date',
	         	connectedRule: 'interconnected',
	         	breakType: 'startcol'
         },
         {
	 	   		field: 'custrecord_ai_inv_end_date',
	         	label: 'Bill Date End',
	         	type: 'date',
	         	storeInSession: true,
	         	connectedField: 'custrecord_ai_inv_start_date',
	         	connectedRule: 'interconnected'
        },
        {
	    	  	field: 'custrecord_ai_inv_start_due_date',
	         	label: 'Due Date Start',
	         	type: 'date',
	         	storeInSession: true,
	         	connectedField: 'custrecord_ai_inv_end_due_date',
	         	connectedRule: 'interconnected',
	         	breakType: 'startcol'
        },
        {
	 	   		field: 'custrecord_ai_inv_end_due_date',
	         	label: 'Due Date End',
	         	type: 'date',
	         	storeInSession: true,
	         	connectedField: 'custrecord_ai_inv_start_due_date',
	         	connectedRule: 'interconnected'
        },
		{
        	// ADDED FOR S23116 
	       	field: 'custrecord_ai_inv_purchase_order_status',
			label: 'Purchase Order Status',
			type: 'select',
			options:
				function() {	
								var poOptions = [];
								for (var o in poFilterStatusMap) {
									poOptions.push([o, poFilterStatusMap[o]]);
								}
								return poOptions;
							},
	       	storeInSession: true,
	       	breakType: 'startcol'
        },
        {
	       	field: 'custrecord_ai_inv_purchase_order',
			label: 'Purchase Order #',
			type: 'text',
			//options: function(){ return list of options;},
	       	storeInSession: true
        },
       
];

// use formula to get purchase order record so avidinvoice records with null purchase order values are returned in OneWorld for roles without cross subsidiary viewing enabled
var poColumn = new nlobjSearchColumn('formulatext');
poColumn.setFormula('case when {custrecord_ai_inv_purchase_order.id} is null then \'\' else {custrecord_ai_inv_purchase_order.id}||\':\'||{custrecord_ai_inv_purchase_order} end');


var poStatusColumn = new nlobjSearchColumn('formulatext');
poStatusColumn.setFormula('{custrecord_ai_inv_purchase_order.status.id}');


var poAmountUnbilledColumn = new nlobjSearchColumn('formulatext');
poAmountUnbilledColumn.setFormula('{custrecord_ai_inv_purchase_order.amountunbilled}');



/*
 * This code replaces and wraps NetSuite's nlobjSearchFilter object
 * so we can capture and access the values of nlobjSearchFilter.
 * This allows us to later convert nlobjSearchFilter to filter expressions.
 */
var nlobjSearchFilterOrig = nlobjSearchFilter;
nlobjSearchFilter = function(name,join,operator,value1,value2){
	
	var values = [value1,value2];
	
	this.getValues = function(){
		return values;
	};
	this.searchFilter = new nlobjSearchFilterOrig(name,join,operator,value1,value2);
	this.searchFilter.getValues = function(){
		return values;
	};
	return this.searchFilter;
};

function suitelet(request, response){
	if (request.getMethod() == 'GET') {
		var context = nlapiGetContext();
		var form =  nlapiCreateForm('AvidInvoice Invoice List');
		
		if(context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F'){
			form.addField('custpage_ai_disabled', 'label', 'The AvidInvoice feature is not enabled');
			response.writePage(form);
			return;
		}
		
		var distLinesEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_dist_line_map');
		var errLink = nlapiResolveURL('suitelet','customscript_pp_sl_ai_invoice_error_list','customdeploy_pp_sl_ai_invoice_error_list');
		form.addPageLink('crosslink', 'Error List', errLink);
		
		var changelogLink = nlapiResolveURL('suitelet','customscript_pp_sl_ai_changelog','customdeploy_pp_sl_ai_changelog');
		form.addPageLink('crosslink', 'Fixlog', changelogLink);
		
		form.setScript('customscript_pp_cs_ai_invoice_list');
		
		$PPS.writeFlashMessagesToForm(form);
		
		
		var syncUrl = nlapiResolveURL('SUITELET','customscript_pp_sl_ai_actions','customdeploy_pp_sl_ai_actions_sync');
		form.addButton('syncbtn','Sync','window.location = \'' + syncUrl + '\'');
		if (distLinesEnabled == 'T') {	
			form.addSubmitButton('Create Selected Bills');
		}
		
		var opts = {
				 filters : formFilters,
		         group : {
		        	 name: 'filters',
		        	 label: 'Filters'
		         }
		};
		
		var nsFormFilter = new NSFormFilter(opts,form);
		nsFormFilter.renderFilters();

		var filterParams = nsFormFilter.getFilterValues();
		
		var extraFilters = [];
		
		// build extra filters from UI filters
		if(filterParams['custrecord_ai_inv_vendor']){
			extraFilters.push(['custrecord_ai_inv_vendor','is',filterParams['custrecord_ai_inv_vendor']]);
		}
		
		if(filterParams['custrecord_ai_inv_batch']){
			extraFilters.push(['custrecord_ai_inv_batch', 'is', filterParams['custrecord_ai_inv_batch']]);
		}
		
		if(filterParams['custrecord_ai_inv_number']){
			extraFilters.push(['custrecord_ai_inv_number', 'is', filterParams['custrecord_ai_inv_number']]);
		}
		
		if(filterParams['custrecord_ai_inv_start_date'] && filterParams['custrecord_ai_inv_end_date']){
			extraFilters.push(['custrecord_ai_inv_invoice_date', 'within', filterParams['custrecord_ai_inv_start_date'],filterParams['custrecord_ai_inv_end_date']]);
		}
		
		if(filterParams['custrecord_ai_inv_start_due_date'] && filterParams['custrecord_ai_inv_end_due_date']){
			extraFilters.push(['custrecord_ai_inv_due_date', 'within', filterParams['custrecord_ai_inv_start_due_date'],filterParams['custrecord_ai_inv_end_due_date']]);
		}
		
		// S23116
		if(filterParams['custrecord_ai_inv_purchase_order_status']){
			extraFilters.push(['custrecord_ai_inv_purchase_order.status', 'is', filterParams['custrecord_ai_inv_purchase_order_status']]);
		}
		
		if(filterParams['custrecord_ai_inv_purchase_order']){
			extraFilters.push(['custrecord_ai_inv_purchase_order.tranid','contains',filterParams['custrecord_ai_inv_purchase_order']]);
		}
		
		var invoiceSearch = createInvoiceSearch(extraFilters);
		
		var numErrors = findNumInvoicesInError();
		
		if(numErrors > 0){
			var efg = form.addFieldGroup('errors','Errors');
			efg.setShowBorder(false);
			var errField = form.addField('errors','inlinehtml','',null,'errors');
			errField.setBreakType('startrow');
			errField.setDefaultValue('<br/><br/>There are ' + numErrors + ' invoices in an error state. Click <a href="'+errLink+'">here</a> to fix them.');
		}
		
		var sublist = setupUiSublist(form);
		
		writeResults(sublist,invoiceSearch);
		
		response.writePage(form);
	} else { //POST call
		var form = nlapiCreateForm("POST"); //change later
		var textField1 = form.addField('custpage_text_1', 'text', '');
		textField1.setDefaultValue('Your Request has been submitted. One moment please.');
		textField1.setDisplayType('inline');

		var lineCount = request.getLineItemCount('custpage_invoices');
		var toProcessList = [];
		for (var line = 1; line <= lineCount; line++) {
			if (request.getLineItemValue('custpage_invoices', 'inv_select', line) == 'T') {
				var aiId = request.getLineItemValue('custpage_invoices', 'ai_id_hidden', line);
				toProcessList.push(aiId);
			}
		}
		var paramString = toProcessList.toString();
		if (paramString == null) {
			paramString = '';
		}
		var paramField = form.addField('custpage_params_to_pass', 'longtext', 'AI IDs being passed: ');
		paramField.setDefaultValue(paramString);
		paramField.setDisplayType('inline');

		var params = {
			custscript_ia_id_list: paramString,
			custscript_restart_on: 0
		}
		
		var status = nlapiScheduleScript('customscript_pp_ss_create_bills', 'customdeploy_pp_ss_create_bills', params);
		nlapiLogExecution('debug', 'status', status);
		$PPS.Session.setFlash('success','The bills have been scheduled to be processed with the status '+ status + '. This may take a few minutes.');

		response.writePage(form);
		//var status = nlapiScheduleScript('customscript_pp_ss_create_bills', 'customdeploy_pp_ss_create_bills', params);
		//nlapiLogExecution('debug', 'status', status);
		if (status == 'QUEUED') {
			//think about what I'm doing for other statuses
			//eventually change this to cover action note on the invoice list page
			nlapiSetRedirectURL('SUITELET', 'customscript_pp_sl_ai_invoice_list', 'customdeploy_pp_sl_ai_invoice_list');
		}
	}
}


function writeResults(sublist,invoiceSearch){
	var resultSet = invoiceSearch.runSearch();
	var context = nlapiGetContext();
	var subsidiariesEnabled = context.getFeature('SUBSIDIARIES');

	var start = 0; //incluse start index
	var end = 1000; //exlusive end index
	var sr;
	var status;
	var actions;
	var itemsToAdd = [];
	
	
	var itemReceiptUrl = nlapiResolveURL( 'tasklink', 'EDIT_TRAN_ITEMRCPT');
	if(itemReceiptUrl.match(/\?/)){
		itemReceiptUrl += '&';
	}
	else{
		itemReceiptUrl += '?';
	}
	itemReceiptUrl += 'transform=purchord&e=T&memdoc=0';
	
	var billUrl = nlapiResolveURL( 'tasklink', 'EDIT_TRAN_VENDBILL',null,'EDIT');
	if(billUrl.match(/\?/)){
		billUrl += '&';
	}
	else{
		billUrl += '?';
	}
	
	//S15719: Add vendor credits for negative total invoices
	var creditUrl = nlapiResolveURL( 'tasklink', 'EDIT_TRAN_VENDCRED',null,'EDIT');
	if(creditUrl.match(/\?/)){
		creditUrl += '&';
	}
	else{
		creditUrl += '?';
	}

	var poStatusMap = {
			pendingBillPartReceived : "Pending Billing/Partially Received", // Has no bill, partially received
			partiallyReceived : "Partially Received", // Has one or more bills, partially received
			fullyBilled: "Fully Billed", // Fully billed and received
			pendingReceipt: "Pending Receipt", // No receipts or bills.
			pendingBilling : "Pending Bill" // Zero or more bills, fully received.
	};
	
	while(true){
		var searchResults = resultSet.getResults(start,end);
		for(var i = 0; i < searchResults.length; i++){
			sr = searchResults[i];
			actions = [];
			
			var poValue = null;
			var poText = null;
			var poRaw = sr.getValue(poColumn);
			
			var poStatus = sr.getValue(poStatusColumn);
			var poDisplayStatus = "";
			
			if(poRaw){
				var poParts = poRaw.split(':');
				poValue = poParts[0];
				poText = poParts[1];
			}
			
			if(poValue){
				
				if(subsidiariesEnabled){
					// in oneworld you can bill a purchase order before it is received.
					var poAmountUnbilled = sr.getValue(poAmountUnbilledColumn);
					if(poAmountUnbilled){
						poAmountUnbilled = Math.abs(poAmountUnbilled);
					}
					else{
						poAmountUnbilled = 0;
					}
					// is billable?
					if(poAmountUnbilled > 0){
						actions.push('<a href="'+billUrl+'transform=purchord&e=T&id=' +poValue+'&memdoc=0&ai_id='+sr.getId()+'">Bill</a>');
					}
				}
				else{
					// is billable?
					if(poStatus == 'pendingBilling' || poStatus == 'pendingBillPartReceived' || poStatus == 'partiallyReceived'){
						actions.push('<a href="'+billUrl+'transform=purchord&e=T&id=' +poValue+'&memdoc=0&ai_id='+sr.getId()+'">Bill</a>');
					}
				}
				
				
				// is receivable?
				if(poStatus == 'pendingReceipt' || poStatus == 'pendingBillPartReceived' || poStatus == 'partiallyReceived'){
					actions.push('<a href="'+itemReceiptUrl+'&id=' + poValue + '&ai_id='+ sr.getId() +'">Receive</a>');
				}
				
				if(poStatus == 'fullyBilled'){
					actions.push('<a href="javascript:selectBillBtnClick('+ sr.getId()+')">Select Bill</a>');
				}
				
				poDisplayStatus = poStatusMap[poStatus];
			}
			else{
				// has no PO
				status = 'Pending Bill';
				//S15719: Add vendor credits for negative total invoices
				var amt = sr.getValue('custrecord_ai_inv_amount');
				var u = billUrl;
				var b = 'Bill';
				if(amt < 0){
					u = creditUrl;
					b += ' Credit';
				}
				u += 'ai_id=' + sr.getId();
				if(sr.getValue('custrecord_ai_inv_vendor')){
					u += '&entity=' + sr.getValue('custrecord_ai_inv_vendor');
				}
				actions.push('<a href="'+u+'">'+b+'</a>');
			}
			
			var invalidLink = '<a href="javascript:invalidbtnClick('+ sr.getId()+')">Invalid</a>';
			
			var poLink = '--';
			if(poValue){
				poLink = '<a href="'+nlapiResolveURL('RECORD','purchaseorder',poValue)+'">'+poText+'</a>';
			}
		
			var vendorLink = 'ERROR: No Vendor Set';
			if(sr.getValue('custrecord_ai_inv_vendor')){
				vendorLink = '<a href="'+nlapiResolveURL('RECORD','vendor',sr.getValue('custrecord_ai_inv_vendor'))+'">'+sr.getText('custrecord_ai_inv_vendor')+'</a>';
			}
			
			var invoiceLink = '<a href="javascript:window.viewInvoice('+sr.getId()+')">View Invoice</a>';
			
			var __i = {};
			__i.bill_or_receive = actions.join(' | ');
			__i.invoice_number = sr.getValue('custrecord_ai_inv_number');
			__i.invoice_date = sr.getValue('custrecord_ai_inv_invoice_date');
			__i.due_date = sr.getValue('custrecord_ai_inv_due_date');
			__i.amount = sr.getValue('custrecord_ai_inv_amount');
			__i.po = poLink;
			__i.po_status = poDisplayStatus;
			__i.vendor = vendorLink;
			__i.batch = sr.getText('custrecord_ai_inv_batch');
			__i.image =  invoiceLink;
			__i.invalid = invalidLink;
			__i.ai_id_hidden = sr.getId();
			__i.custpage_prev_err = sr.getValue('custrecord_ai_inv_bill_process_error');
			itemsToAdd.push(__i);
		}
		if(searchResults.length < 1000){
			break;
		}
		start += 1000;
		end += 1000;
	}
	sublist.setLineItemValues(itemsToAdd);
	
}

function setupUiSublist(form){
	var sublist = form.addSubList('custpage_invoices', 'list', 'Invoices');
	
	var selectField = sublist.addField('inv_select', 'checkbox', 'Select for Billing');
	sublist.addField('bill_or_receive','text','Bill / Receive');
	sublist.addField('invoice_number','text','Invoice #');
	sublist.addField('vendor','text','Vendor');
	sublist.addField('po','text','Purchase Order');
	sublist.addField('po_status','text','Purchase Order Status');
	sublist.addField('invoice_date','date','Bill Date');
	sublist.addField('due_date','date','Due Date');
	sublist.addField('amount','text','Amount');
	sublist.addField('batch','text','Batch');
	sublist.addField('image','text','Image');	
	sublist.addField('invalid','text','Invalid');
	var aiField = sublist.addField('ai_id_hidden', 'text', 'AI ID');
	aiField.setDisplayType('hidden'); //hides field, as we only need it for internal var
	var prevErrField = sublist.addField('custpage_prev_err', 'checkbox', 'Bill Creation Error');
	prevErrField.setDisplayType('disabled');
	//prevErrField.setDisplayType('hidden');
	if (nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_enable_dist_line_map') == 'T') {
		sublist.addMarkAllButtons();
	} else {
		prevErrField.setDisplayType('hidden');
		selectField.setDisplayType('hidden');
	}
	return sublist;
}

function createInvoiceSearch(extraFilters){
	
	var filters = [];
	var columns = [];
	
	
	filters.push(['custrecord_ai_inv_is_matched','is','T']);
	filters.push('and',['custrecord_ai_inv_bill','anyof','@NONE@']);
	filters.push('and',['custrecord_ai_inv_is_error','is','F']);
	filters.push('and',[['custrecord_ai_inv_purchase_order','anyof','@NONE@'],'or',['custrecord_ai_inv_purchase_order.mainline','is','T']]);
	filters.push('and', ['isinactive', 'is', 'F']);

	nlapiLogExecution('debug', 'createInvoiceSearch', 'Filter on custrecord_ai_inv_is_matched is T');
	nlapiLogExecution('debug', 'createInvoiceSearch', 'Filter on custrecord_ai_inv_bill anyof @NONE@');
	nlapiLogExecution('debug', 'createInvoiceSearch', 'Filter on custrecord_ai_inv_is_error is F');
	nlapiLogExecution('debug', 'createInvoiceSearch', 'Filter on (custrecord_ai_inv_purchase_order anyof @NONE@) or (custrecord_ai_inv_purchase_order.mainline is T)');
	nlapiLogExecution('debug', 'createInvoiceSearch', 'Filter on isinactive is F');
	
	//check subsidiary access, and restrict if appropriate Add to extraFilters
	//only if is oneworld account
	var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES'); //gets subsidiary from user preferences

	if (isOneWorld) {
		var subsidAccessList = filterSubsid();
		if (subsidAccessList != null) {
			filters.push('and',['custrecord_pp_subsid_list', 'anyof', subsidAccessList]);
			nlapiLogExecution('debug', 'createInvoiceSearch', 'Filter on custrecord_pp_subsid_list anyof ['+subsidAccessList+']');
		}
	}
	

	// add filters from extraFilters param. extraFilters as filter expressions are treated like ands
	// and nlobjSearchFilter objects are converted to filter expressoins
	if(extraFilters){
		var f= null;
		
		for(var i = 0; i < extraFilters.length; i++){
			f = extraFilters[i];
			// is array of arrays or string
			if(Array.isArray(f)){
				filters.push('and',f);
				nlapiLogExecution('debug', 'createInvoiceSearch', 'UI Filter['+i+'] added ['+f+']');
			}
			else if(f instanceof nlobjSearchFilter || f instanceof nlobjSearchFilterOrig){
				
				var vals = f.getValues();
				var name = f.getName();
				if(f.getJoin()){
					name = f.getJoin() + '.' + name;
				}
				
				filters.push('and',[name, f.getOperator(),vals[0].toString()]);
				nlapiLogExecution('debug', 'createInvoiceSearch', 'UI Filters['+i+'] added ['+name+' '+f.getOperator()+' '+vals[0].toString()+']');
			}
		}
	}
	
	columns.push(poColumn);
	columns.push(poStatusColumn);
	columns.push(poAmountUnbilledColumn);
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_vendor'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_batch'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_amount'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_number'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_invoice_date'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_due_date'));
	
	columns.push(new nlobjSearchColumn('created'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_bill_process_error'));
	
	return nlapiCreateSearch('customrecord_ai_imported_invoices',filters,columns);
}


function findNumInvoicesInError(extraFilters){
	var filters = [];
	var columns = [];
	
	var cc = new nlobjSearchColumn('internalid', null, 'count');
	columns.push(cc);
	
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_is_error',null,'is','T'));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	
	if(extraFilters){
		filters = filters.concat(extraFilters);
	}
	
	var res = nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters,columns);
	return res[0].getValue(cc);	
}

function processBills(form, sublist) {
	try {
			nlapiLogExecution('debug', 'button selected', 'test');
		//get AI ID for each line that is selected
		var toProcessList = [];
		var lineCount = sublist.getLineItemCount();
		for (var line = 1; line <= lineCount; line++) {
			if (sublist.getLineItemValue('custpage_invoices', 'inv_select', line) == 'T') {
				var aiId = sublist.getLineItemValue('custpage_invoices', 'ai_id_hidden', line);
				toProcessList.push(aiId);
				nlapiLogExecution('debug', 'add to ToProcessList', aiId);
			}
		}
		//pass to scheduled script in parameter?
	} catch (ex) {
		nlapiLogExecution('error', 'error', ex.message);
	}
}

function filterSubsid() {
	try {
		var context = nlapiGetContext();
		var role = context.getRole();
		var user = context.getUser(); //don't know that we need that
		nlapiLogExecution('debug', 'role/user', role + '/' + user);

		var subsidAccess = [];

		var newForm = nlapiCreateForm('subsid temp form');
		var subsidField = newForm.addField('hidden_subsid', 'select', 'testsubsid', 'subsidiary');
		var selectOptions = subsidField.getSelectOptions();
		nlapiLogExecution('debug', 'selectOptions', selectOptions);
		if (selectOptions != null) {
			for (var q = 0; q<selectOptions.length; q++) {
				nlapiLogExecution('debug', 'select option ' + q, selectOptions[q].getId() +', '+ selectOptions[q].getText());
				subsidAccess.push(selectOptions[q].getId());
			}
			return subsidAccess;
		} else {
			return null;
		}

	} catch(ex) {
		nlapiLogExecution('error', 'Error in filterSub', ex.message);
	}
}