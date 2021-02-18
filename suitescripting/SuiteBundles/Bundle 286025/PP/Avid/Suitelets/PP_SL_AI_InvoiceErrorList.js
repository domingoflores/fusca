/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Aug 2015     mmenlove
 * 2.18.0.22  8  Aug 2019     dwhetten         S58602: Add AP Processor to the AvidInvoice error queue
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function suitelet(request, response) {

	if (request.getMethod() == 'GET') {
		displayForm(request, response);
	}
	else {
		generateCSV(request, response);
	}
}

var formFilters = [
	{
		field: 'custrecord_ai_inv_batch',
		label: 'Invoice Batch',
		type: 'select',
		recordType: 'customrecord_pp_ai_invoice_batches',
		storeInSession: true
	},
	{
		field: 'custrecord_ai_inv_number',
		label: 'Invoice #',
		type: 'text',
		storeInSession: true
	},
	{
		field: 'custrecord_ai_inv_start_date',
		label: 'Invoice Start Date',
		type: 'date',
		storeInSession: true,
		connectedField: 'custrecord_ai_inv_end_date',
		connectedRule: 'interconnected'
	},
	{
		field: 'custrecord_ai_inv_end_date',
		label: 'Invoice End Date',
		type: 'date',
		storeInSession: true,
		connectedField: 'custrecord_ai_inv_start_date',
		connectedRule: 'interconnected'
	}];

function displayForm(request, response) {
	var context = nlapiGetContext();
	var form = nlapiCreateForm('AvidInvoice Invoice Errors');

	if (context.getSetting('SCRIPT', 'custscript_pp_enable_avid_invoice') == 'F') {
		form.addField('custpage_ai_disabled', 'label', 'The AvidInvoice feature is not enabled');
		response.writePage(form);
		return;
	}

	var listLink = nlapiResolveURL('suitelet', 'customscript_pp_sl_ai_invoice_list', 'customdeploy_pp_sl_ai_invoice_list');
	form.addPageLink('crosslink', 'Invoice List', listLink);

	var changelogLink = nlapiResolveURL('suitelet', 'customscript_pp_sl_ai_changelog', 'customdeploy_pp_sl_ai_changelog');
	form.addPageLink('crosslink', 'Fixlog', changelogLink);

	form.setScript('customscript_pp_cs_ai_invoice_list');

	var opts = {
		filters: formFilters,
		group: {
			name: 'filters',
			label: 'Filters'
		}
	};

	var nsFormFilter = new NSFormFilter(opts, form);

	nsFormFilter.renderFilters();

	var filterParams = nsFormFilter.getFilterValues();

	var sublist = setupUiSublist(form);

	var extraFilters = [];

	if (filterParams['custrecord_ai_inv_batch']) {
		extraFilters.push(['custrecord_ai_inv_batch', 'is', filterParams['custrecord_ai_inv_batch']]);
	}

	if (filterParams['custrecord_ai_inv_number']) {
		extraFilters.push(['custrecord_ai_inv_number', 'is', filterParams['custrecord_ai_inv_number']]);
	}

	if (filterParams['custrecord_ai_inv_start_date'] && filterParams['custrecord_ai_inv_end_date']) {
		extraFilters.push(['custrecord_ai_inv_invoice_date', 'within', filterParams['custrecord_ai_inv_start_date'], filterParams['custrecord_ai_inv_end_date']]);
	}

	var invoiceSearch = createInvoiceSearch(extraFilters);
	writeResults(sublist, invoiceSearch);
	form.addSubmitButton('Export CSV');
	response.writePage(form);
}

function generateCSV(request, response) {
	var csvFilename = 'errorlist_export';
	var opts = {
		filters: formFilters,
		group: {
			name: 'filters',
			label: 'Filters'
		}
	};

	var nsFormFilter = new NSFormFilter(opts, null);
	var filterParams = nsFormFilter.getFilterValues();
	var extraFilters = [];


	if (filterParams['custrecord_ai_inv_batch']) {
		extraFilters.push(new nlobjSearchFilter('custrecord_ai_inv_batch', null, 'is', filterParams['custrecord_ai_inv_batch']));
	}

	if (filterParams['custrecord_ai_inv_number']) {
		extraFilters.push(new nlobjSearchFilter('custrecord_ai_inv_number', null, 'is', filterParams['custrecord_ai_inv_number']));
	}

	if (filterParams['custrecord_ai_inv_start_date'] && filterParams['custrecord_ai_inv_end_date']) {
		extraFilters.push(new nlobjSearchFilter('custrecord_ai_inv_invoice_date', null, 'within', filterParams['custrecord_ai_inv_start_date'], filterParams['custrecord_ai_inv_end_date']));
	}

	var invoiceSearch = createInvoiceSearch(extraFilters);

	var resultSet = invoiceSearch.runSearch();

	var start = 0; //incluse start index
	var end = 1000; //exlusive end index

	var rows = [];
	// push headers
	rows.push(["Invoice Number","Error Code","User Error Message","AP Processor","Vendor","Purchase Order","Invoice Date","Amount","Batch"]);

	// push data rows
	while (true) {
		var searchResults = resultSet.getResults(start, end);
		for (var i = 0; i < searchResults.length; i++) {
			var sr = searchResults[i];
			var row = [];

			row.push(sr.getValue('custrecord_ai_inv_number'));
			row.push(sr.getValue('custrecord_ai_inv_error_code'));
			row.push(sr.getValue('custrecord_ai_inv_user_error_message'));
			row.push(sr.getValue('entityid','custrecord_ai_invalidated_by_user_id'));
			row.push(sr.getValue('custrecord_ai_inv_vendor_name'));
			row.push(sr.getValue('custrecord_ai_inv_po_number'));
			row.push(sr.getValue('custrecord_ai_inv_invoice_date'));
			row.push(sr.getValue('custrecord_ai_inv_amount'));
			row.push(sr.getText('custrecord_ai_inv_batch'));
			rows.push(row);
		}

		if (searchResults.length < 1000) {
			break;
		}
		start += 1000;
		end += 1000;
	}

	// generate csv string
	var csvStr = exportToCsv(rows);

	response.setContentType('CSV', csvFilename + '.csv');
	response.write(csvStr);
}


function exportToCsv(rows) {
	var processRow = function (row) {
		var finalVal = '';
		for (var j = 0; j < row.length; j++) {
			var innerValue = row[j] === null ? '' : row[j].toString();
			if (row[j] instanceof Date) {
				innerValue = row[j].toLocaleString();
			};
			var result = innerValue.replace(/"/g, '""');
			if (result.search(/("|,|\n)/g) >= 0)
				result = '"' + result + '"';
			if (j > 0)
				finalVal += ',';
			finalVal += result;
		}
		return finalVal + '\n';
	};

	var csvStr = '';
	for (var i = 0; i < rows.length; i++) {
		csvStr += processRow(rows[i]);
	}

	return csvStr;
}



function writeResults(sublist, invoiceSearch) {
	var resultSet = invoiceSearch.runSearch();

	var start = 0; //incluse start index
	var end = 1000; //exlusive end index
	var sr;
	//var status;
	var actions;
	var itemsToAdd = [];


	var itemReceiptUrl = nlapiResolveURL('tasklink', 'EDIT_TRAN_ITEMRCPT');
	if (itemReceiptUrl.match(/\?/)) {
		itemReceiptUrl += '&';
	}
	else {
		itemReceiptUrl += '?';
	}
	itemReceiptUrl += 'transform=purchord&e=T&memdoc=0';

	//var billUrl = nlapiResolveURL('tasklink','EDIT_TRAN_VENDBILL',null,'EDIT');

	while (true) {
		var searchResults = resultSet.getResults(start, end);
		for (var i = 0; i < searchResults.length; i++) {
			sr = searchResults[i];
			//status = getInvoiceStatus(sr.getValue('custrecord_ai_inv_purchase_order'),sr.getValue('custrecord_ai_inv_item_receipt'),sr.getValue('custrecord_ai_inv_bill'));
			actions = [];

			actions.push('<a href="javascript:fixbtnClick(' + sr.getId() + ')">Fix</a>');

			var poNumber = sr.getValue('custrecord_ai_inv_po_number');

			var invoiceLink = '<a href="javascript:window.viewInvoice(' + sr.getId() + ')">View Invoice</a>';

			var errorMessage = '';
			var errorDetails = '';
			switch (sr.getValue('custrecord_ai_inv_error_code')) {
				case 'PO_VENDOR_MISMATCH':
					errorMessage = 'PO VENDOR MISMATCH';
					//errorMessage = 'The vendor set on the invoice does not match that of the purchase order';
					break;
				case 'PO_NOT_FOUND':
					errorMessage = 'PO NOT FOUND';
					//errorMessage = 'No matching purchase order was found';
					break;
				case 'VENDOR_NOT_FOUND':
					errorMessage = 'VENDOR NOT FOUND';
					//errorMesage = 'No match vendor was found';
					break;
				case 'USER_MARKED_INVALID':
					errorMessage = 'USER MARKED INVALID';
					errorDetails = sr.getValue('custrecord_ai_inv_user_error_message');
					//errorMessage = 'This invoice was marked invalid by a user';
					break;
				case 'UNEXPECTED_MATCH_ERROR':
					errorMessage = 'UNEXPECTED MATCH ERROR';
					//errorMessage = 'An unexpected error occured when attempting to match the invoice';
					break;
			}



			var __i = {};
			__i.error_message = (errorDetails ? '<a href="javascript:displayMessage(\'' + htmlEscape(errorDetails) + '\',this)">' + errorMessage + '</a>' : errorMessage);
			//__i.error_message = errorMessage + ' ' + (errorDetails ? '<a onclick="displayMessage(\''+htmlEscape(errorDetails)+'\',this); return false;"><em style="font-style: italic; text-decoration: underline;">( info )</em></a>' : '');
			__i.ap_processor = sr.getValue('entityid','custrecord_ai_invalidated_by_user_id');
			__i.invoice_number = sr.getValue('custrecord_ai_inv_number');
			__i.invoice_date = sr.getValue('custrecord_ai_inv_invoice_date');
			__i.amount = sr.getValue('custrecord_ai_inv_amount');
			__i.po_number = poNumber;
			__i.vendor = '(' + sr.getValue('custrecord_ai_inv_vendor_id') + ') ' + sr.getValue('custrecord_ai_inv_vendor_name');
			__i.batch = sr.getText('custrecord_ai_inv_batch');
			__i.image = invoiceLink;
			__i.actions = actions.join(' | ');
			itemsToAdd.push(__i);
		}
		if (searchResults.length < 1000) {
			break;
		}
		start += 1000;
		end += 1000;
	}
	sublist.setLineItemValues(itemsToAdd);

}

function htmlEscape(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function setupUiSublist(form) {
	var sublist = form.addSubList('custpage_invoices', 'list', 'Invoices');

	sublist.addField('invoice_number', 'text', 'Invoice #');
	sublist.addField('error_message', 'textarea', 'Error');
	sublist.addField('ap_processor', 'text', 'AP Processor');
	sublist.addField('vendor', 'text', 'Vendor');
	sublist.addField('po_number', 'text', 'Purchase Order #');
	sublist.addField('invoice_date', 'date', 'Invoice Date');
	sublist.addField('amount', 'text', 'Amount');
	sublist.addField('batch', 'text', 'Batch');
	sublist.addField('image', 'text', 'Image');
	sublist.addField('actions', 'text', 'Actions');

	return sublist;
}

function createInvoiceSearch(extraFilters) {

	var filters = [];
	var columns = [];

	filters.push(['custrecord_ai_inv_is_error', 'is', 'T']);
	filters.push('and', ['isinactive', 'is', 'F']);

	if (extraFilters) {
		var f;

		for (var i = 0; i < extraFilters.length; i++) {
			f = extraFilters[i];
			// is array of arrays or string
			if (Array.isArray(f)) {
				filters.push('and', f);
			}
		}
	}

	columns.push(new nlobjSearchColumn('custrecord_ai_inv_error_code'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_user_error_message'));
	columns.push(new nlobjSearchColumn('entityid','custrecord_ai_invalidated_by_user_id'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_po_number'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_id'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_vendor_name'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_vendor_id'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_batch'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_amount'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_number'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_invoice_date'));
	columns.push(new nlobjSearchColumn('created'));

	return nlapiCreateSearch('customrecord_ai_imported_invoices', filters, columns);
}