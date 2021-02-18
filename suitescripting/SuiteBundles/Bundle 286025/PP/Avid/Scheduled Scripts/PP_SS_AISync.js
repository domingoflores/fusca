/**
 * Import and sync invoices from AvidInvoice by batch.
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Oct 2015     MMenlove
 * 2.16.0     28 Nov 2018     johnr            S21056: Adjust the from/to sync dates to UTC for late day imports
 *
 */

var myGovernanceThreshold = 200;

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	var context = nlapiGetContext();
	var companyPreferences = nlapiLoadConfiguration('companypreferences');
	
	if(companyPreferences.getFieldValue('custscript_pp_enable_avid_invoice') == 'F'){
		nlapiLogExecution('ERROR','Avid Invoice Is Not Enabled','.');
		return;
	}
	
	var apnSystemUserId = context.getPreference('custscript_pp_apn_avid_system_user');
	if(!apnSystemUserId){
		nlapiLogExecution('ERROR','No AvidSuite system user set','.');
		return;
	}
	
	// Load the APN user credentials of the system user
	var apnCredentials = PPSLibAvidSuite.getUserCredentials(apnSystemUserId);
	if(!apnCredentials){
		throw nlapiCreateError('PP_APN_NO_USER_CREDENTIALS','You have not setup your system avid suite user credentials yet. Go to AvidXchange -> Setup -> Preferences and select an option for the AVIDSUITE SYSTEM USER field');
	}
	
	// Configure and authorize the service
	var serviceConfig = apnCredentials;
	var service = new PPSLibAvidSuite.Service(serviceConfig);
	service.authorize();

	// Get Date setting and Accounting Application ID
	var settings = getSettings(context,companyPreferences);
	
	var accountingApplicationId = getAccountingApplicationId(settings.accountingApplicationName,service);
	var invoiceBatchListUrl = PPSLibAvidSuite.getClosedInvoiceBatchUrl(accountingApplicationId);

	invoiceBatchListUrl += '?closeDateFrom=' + encodeURIComponent(settings.dateFromStr) + '&' + 'closeDateTo='+ encodeURIComponent(settings.dateToStr);
	nlapiLogExecution('DEBUG','invoiceBatchListUrl',invoiceBatchListUrl);
	
	var invoiceBatchListPager = new PPSLibAvidSuite.ResourcePager(invoiceBatchListUrl,service);
	var externalInvoiceBatchItems;
	var batchImportErrorNames = [];
	
	while(externalInvoiceBatchItems = invoiceBatchListPager.next()){
		// Get array of all externalBatchGUIDs to use for search
		var externalBatchGUIDs = [];
		var externalInvoiceBatchItem;
		for(var i = 0; i < externalInvoiceBatchItems.length; i++){
			externalInvoiceBatchItem = externalInvoiceBatchItems[i];
			externalBatchGUIDs.push(externalInvoiceBatchItem.BatchGUID);
		}
		
		// Find all of the invoices already imported into NetSuite
		var invoiceBatchSRs = invoiceBatchSearch(externalBatchGUIDs); // 10 governance units
		var matchingInvoiceBatchRecordSR;

		externalInvoiceBatchItem = null;
		for(var i = 0; i < externalInvoiceBatchItems.length; i++){
			externalInvoiceBatchItem = externalInvoiceBatchItems[i];
			matchingInvoiceBatchRecordSR = null;
			if(invoiceBatchSRs){
				// try and find matching invoice batch record
				for(var j = 0; j < invoiceBatchSRs.length; j++){
					if(invoiceBatchSRs[j].getValue('custrecord_ai_invbat_batch_guid') == externalInvoiceBatchItem.BatchGUID){
						matchingInvoiceBatchRecordSR = invoiceBatchSRs[j];
						break;
					}
				}
			}
			
			if(!matchingInvoiceBatchRecordSR){
				 nlapiLogExecution('DEBUG','Invoice Batch Found?','Invoice batch not found. Creating batch');
				 try{
					 createInvoiceBatch(externalInvoiceBatchItem,service);
				 }
				 catch(e){
					 batchImportErrorNames.push(externalInvoiceBatchItem.BatchName);
					 nlapiLogExecution('ERROR','There was an error creating the invoice to the batch',e.toString());
				 }
			}
			else if(matchingInvoiceBatchRecordSR.getValue('custrecord_ai_invbat_date_closed') != externalInvoiceBatchItem.DateClosed){
				nlapiLogExecution('DEBUG','Invoice Batch Found?','Invoice batch found. Date Closed has changed');
				try{
					syncInvoiceBatch(externalInvoiceBatchItem,service,matchingInvoiceBatchRecordSR);
				}
				catch(e){
					batchImportErrorNames.push(externalInvoiceBatchItem.BatchName);
					nlapiLogExecution('ERROR','There was an error syncing the invoice to the batch',e.toString());
				}
			}
			else{
				nlapiLogExecution('DEBUG','Invoice Batch Found?','Invoice batch found. Date Closed has not changed');
			}

			checkGovernance();
		}
	}	
	
	// dont set last import date if script was run with parameters aka type= userinterface
	if(type == 'scheduled' || type == 'ondemand'){
		// the last import date is stored as a YYYY-MM-DD string because NetSuite's date format/storage is bunk.
		companyPreferences.setFieldValue('custscript_ai_last_import_date',moment().format('YYYY-MM-DD'));
		nlapiSubmitConfiguration(companyPreferences);
	}
	
	// Try and sync errors
	var invoiceBatchErrorSRs = invoiceBatchErrorSearch();
	if(invoiceBatchErrorSRs){
		nlapiLogExecution('DEBUG','Invoice Batches Found With Errors',invoiceBatchErrorSRs.length);
		for(var i = 0; i < invoiceBatchErrorSRs.length; i++){
			var sr = invoiceBatchErrorSRs[i];
			var batchGUID = sr.getValue('custrecord_ai_invbat_batch_guid');
			// find external batch by GUID
			try{
				var externalBatchItem = getBatchByGUID(batchGUID,service);
				syncInvoiceBatch(externalBatchItem,service,sr);
			}
			catch(e){
				batchImportErrorNames.push(sr.getValue('name'));
				nlapiLogExecution('ERROR','There was an error syncing the invoice to the batch',e.toString());
			}
			checkGovernance();
		}
	}
	
	var status = nlapiScheduleScript('customscript_pp_ss_ai_match','customdeploy_pp_ss_ai_match');
	
	if(batchImportErrorNames.length > 0){
		throw nlapiCreateError('PP_AI_SYNC_ERROR','There was an error syncing or creating the following batches: ' + batchImportErrorNames.join(', '));
	}
	
}


function createInvoiceBatch(externalInvoiceBatchItem,service){
	var exportHistoriesUrl = PPSLibAvidSuite.getBatchExportHistoriesUrl();
	// Create the batch record
	var batchRec = nlapiCreateRecord('customrecord_pp_ai_invoice_batches'); // 2 units
	
	batchRec.setFieldValue('custrecord_ai_invbat_batch_guid', externalInvoiceBatchItem.BatchGUID);
	batchRec.setFieldValue('name',externalInvoiceBatchItem.BatchName);
	batchRec.setFieldValue('custrecord_ai_invbat_invoice_count', externalInvoiceBatchItem.InvoiceCount);
	batchRec.setFieldValue('custrecord_ai_invbat_batch_total', externalInvoiceBatchItem.BatchTotal);
	batchRec.setFieldValue('custrecord_ai_invbat_date_closed', externalInvoiceBatchItem.DateClosed);
	
	var batchRecId = nlapiSubmitRecord(batchRec);
	try{
		// reload the record
		batchRec = nlapiLoadRecord('customrecord_pp_ai_invoice_batches',batchRecId);
		
		var invoiceDetailsLink = null;
		invoiceDetailsLink = findLink(externalInvoiceBatchItem.Links,'full-details');

		if(!invoiceDetailsLink){
			throw nlapiCreateError('PP_AI_NO_DETAIL_LINK','The full-details link is missing');
		}

		var importStartDate = new Date();
		// Retrieve all invoices for batch
		var invoicePager = new PPSLibAvidSuite.ResourcePager(PPSLibAvidSuite.getBaseUrl() + invoiceDetailsLink.Href,service);
		var externalInvoices = invoicePager.all();
		
		// Add invoices via batch
		for(var q = 0; q < externalInvoices.length; q++){
			try{
				var externalInvoice = externalInvoices[q];
				addInvoiceToBatch(batchRec,externalInvoice);
			}
			catch(e){
				nlapiLogExecution('ERROR','There was an error adding the invoice to the batch',e.toString());
			}
		}
		
		var recId = nlapiSubmitRecord(batchRec);
		
		// Mark invoice as imported in AvidInvoice
		postExportHistory(externalInvoiceBatchItem.BatchGUID,exportHistoriesUrl,service,importStartDate,new Date());
		
		return batchRecId;
	}
	catch(e){
		nlapiLogExecution('ERROR','createInvoiceBatch: Sync Error Details',e.toString());
		batchRec = nlapiLoadRecord('customrecord_pp_ai_invoice_batches',batchRecId);
		batchRec.setFieldValue('custrecord_ai_s_sync_error', 'T');
		nlapiSubmitRecord(batchRec);
		throw e;
	}
	
}

function syncInvoiceBatch(externalInvoiceBatchItem,service,matchingInvoiceBatchRecordSR){
	try{
		// batchRec has changed, we need to resync everything
		var invoicesToDelete = [];
		var matchingInvoiceList = [];
		var exportHistoriesUrl = PPSLibAvidSuite.getBatchExportHistoriesUrl();
		
		// Load the invoice batch record
		var batchRec = nlapiLoadRecord('customrecord_pp_ai_invoice_batches',matchingInvoiceBatchRecordSR.getId()); // 2 units
		
		//SYNC Batch fields, especially last changed date
		batchRec.setFieldValue('custrecord_ai_invbat_invoice_count', externalInvoiceBatchItem.InvoiceCount);
		batchRec.setFieldValue('custrecord_ai_invbat_batch_total', externalInvoiceBatchItem.BatchTotal);
		batchRec.setFieldValue('custrecord_ai_invbat_date_closed', externalInvoiceBatchItem.DateClosed);	
		batchRec.setFieldValue('custrecord_ai_invbat_batch_guid', externalInvoiceBatchItem.BatchGUID);
		batchRec.setFieldValue('custrecord_ai_s_sync_error', 'F');
		batchRec.setFieldValue('name',externalInvoiceBatchItem.BatchName);
		
		var invoiceDetailsLink = null;
		invoiceDetailsLink = findLink(externalInvoiceBatchItem.Links,'full-details');
		
		if(!invoiceDetailsLink){
			throw nlapiCreateError('PP_AI_NO_DETAIL_LINK','The full-details link is missing');
		}
		
		var importStartDate = new Date();

		// Retrieve all invoices for batch
		var invoicePager = new PPSLibAvidSuite.ResourcePager(PPSLibAvidSuite.getBaseUrl() + invoiceDetailsLink.Href,service);
		var externalInvoices = invoicePager.all(); // 10 units per page of data. 1000 invoices
		
		var c = batchRec.getLineItemCount('recmachcustrecord_ai_inv_batch');
		for(var line = 1; line <= c; line++){
			batchRec.selectLineItem('recmachcustrecord_ai_inv_batch', line);
			var aiInvId = batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_id');
			var matchingExternalInvoice = null;
			
			// try and find matching external invoice
			for(var q = 0; q < externalInvoices.length; q++){
				var ei = externalInvoices[q];
				if(ei.Id == aiInvId){
					matchingExternalInvoice = ei;
					break;
				}
			}
			
			if(matchingExternalInvoice){
				matchingInvoiceList.push(matchingExternalInvoice.Id);
				//TODO: ???WHAT ABOUT IF ACTION WAS TAKEN, THEN LATER MARKED AS INVALID???
				// has invoice changed?
				if(matchingExternalInvoice.LastChangedDate != batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_last_changed_date')){
					// VendorExternalSystemID can contain both the NetSuite vendor internalid and NetSuite vendor address internalid separated by a pipe. E.G. {vendorInternalId}|{vendorAddressInternalId}
					var vendIdsObj = extractVendorIdVendorAddressId(matchingExternalInvoice);
					
					// has invoice been acted on(bill has been set), sync data, but do not trigger rematch
					if(!batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_bill')){
						// trigger rematch if vendor id or po number changed and invoice was not manually fixed by user in NetSuite.
						if((batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_vendor_id') != vendIdsObj.vendorInternalId.toString() || batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_po_number') != (matchingExternalInvoice.PONumber || "").toString()) && batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_was_resolved_by_user') != 'T'){
							batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_is_matched', 'F');
							// only clear error fields here? what if manual error not related to these fields?
							batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_is_error', 'F');
							batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_error_code', '');
						}
					}
						
					setCurrentLineItemValues(batchRec,matchingExternalInvoice);
					
					batchRec.commitLineItem('recmachcustrecord_ai_inv_batch');				
				}
			}
			else{
				nlapiLogExecution('DEBUG','Removed Invoice Found',batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_id'));
				// if invoice has not been acted on, lets delete it?
				if(!batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_bill')){
					// add to invoices to remove list
					nlapiLogExecution('DEBUG','Removed Invoice Is Deletable',batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_id'));
					invoicesToDelete.push(batchRec.getCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'id'));
				}
			}
		}
		
		// loop through external invoices and check to see if any invoices were added, if so add them to the batch
		for(var qq = 0; qq < externalInvoices.length; qq++){
			if(matchingInvoiceList.indexOf(externalInvoices[qq].Id) == -1){
				nlapiLogExecution('DEBUG','New invoice found in existing batch',externalInvoices[qq].Id);
				try{
					addInvoiceToBatch(batchRec,externalInvoices[qq]);
				}
				catch(e){
					nlapiLogExecution('ERROR','There was an error adding the invoice to the batch',e.toString());
				}
			}
		}
		
		nlapiSubmitRecord(batchRec); // # 4 units
		
		if(invoicesToDelete.length > 0){
			deleteInvoices(invoicesToDelete);
		}
		
		// Mark invoice as imported in AvidInvoice
		postExportHistory(externalInvoiceBatchItem.BatchGUID,exportHistoriesUrl,service,importStartDate,new Date());
	}
	catch(e){
		nlapiLogExecution('ERROR','syncInvoiceBatch: Sync Error Details',e.toString());
		// Load the invoice batch record
		var batchRec = nlapiLoadRecord('customrecord_pp_ai_invoice_batches',matchingInvoiceBatchRecordSR.getId()); // 2 units
		batchRec.setFieldValue('custrecord_ai_s_sync_error', 'T');
		nlapiSubmitRecord(batchRec);
		throw e;
	}
	
}


function getSettings(context,companyPreferences){
	var settings = {
			dateToStr: '',
			dateFromStr: '',
			context: context,
			accountingApplicationName : ''
	};
	var dateToStr;
    var dateFromStr;

	nlapiLogExecution('DEBUG','getSettings','type=['+type+']');
    // S21056: Adjust the sync-to date for the current moment to UTC for late day imports
	dateToStr = moment().utc().format('YYYY-MM-DD');
	nlapiLogExecution('DEBUG', 'getSettings','UTC Time=['+moment().utc().format('YYYY-MM-DDTHH:mm:ss.SS')+']');
	if(type == 'userinterface'){
		// use date from and to from scheduled script form
		var dt = context.getPreference('custscript_ai_closed_date_to');
		var df = context.getPreference('custscript_ai_closed_date_from');

		nlapiLogExecution('DEBUG','getSettings','userinterface custscript_ai_closed_date_from=['+df+'] custscript_ai_closed_date_to=['+dt+']');
		if(dt && dt){
			var dtDate = nlapiStringToDate(dt);
			var dfDate = nlapiStringToDate(df);
			
			dateToStr = moment(dtDate).format('YYYY-MM-DD');
			dateFromStr = moment(dfDate).format('YYYY-MM-DD');
		}
		else{
			dateFromStr = moment().subtract(1,'days').format('YYYY-MM-DD');
		}
	}
	else{
		// use the last import date if set otherwise use today as the date?
		var lastImport = companyPreferences.getFieldValue('custscript_ai_last_import_date');
		nlapiLogExecution('DEBUG','getSettings','lastImport=['+lastImport+']');
		
		if(lastImport){
			// the last import date is stored as a YYYY-MM-DD string because NetSuite's date format/storage is bunk.
			dateFromStr = moment(lastImport,'YYYY-MM-DD').format('YYYY-MM-DD');
		}
		else{
			dateFromStr = moment().subtract(1,'days').format('YYYY-MM-DD');
		}
	}
	nlapiLogExecution('DEBUG','getSettings','dateFromStr=['+dateFromStr+'] dateToStr=['+dateToStr+']');
	
	settings.dateToStr = dateToStr;
	settings.dateFromStr = dateFromStr;
	//get accounting application id from configuration
	settings.accountingApplicationName = companyPreferences.getFieldValue('custscript_ai_accounting_system_id');
	
	return settings;
}

/**
 * Send POST request to Avid Invoice to mark the batch as imported
 * 
 * @param batchGUID - {string}
 * @param url - {string}
 * @param service - {PPSLibAvidSuite.Service}
 * @param startDate - {Date}
 * @param endDate - {Date}
 * @returns
 */
function postExportHistory(batchGUID,url,service,startDate,endDate){
	var obj = {
			  "BatchId": batchGUID,
			  "FileId": null,
			  "ExportedByUserId": null,
			  "StartDate" : moment(startDate).utc().format('YYYY-MM-DDTHH:mm:ss.SS'),
			  "EndDate" : moment(endDate).utc().format('YYYY-MM-DDTHH:mm:ss.SS'),
			  "ExportHistoryStatusId": 1 //success
			};
	
	nlapiLogExecution('DEBUG', 'postExportHistory','url='+url+' obj='+JSON.stringify(obj));
	
	var resultObj = service.sendRequest(url,JSON.stringify(obj),{'Accept': 'application/json','Content-Type': 'application/json'},'POST');
	return resultObj;
}

function getBatchByGUID(batchGUID,service){

	var url = PPSLibAvidSuite.getInvoiceBatchUrl();
	
	url += "/" + encodeURI(batchGUID);
	
	var resultObj = service.sendRequest(url,null,{'Accept': 'application/json'},'GET');
	return resultObj;
}

function findLink(links,rel){
	for(var i = 0; i < links.length; i++){
		if(links[i].Rel == rel){
			return links[i];
		}
	}
}


function invoiceBatchErrorSearch(){
	
	var columns = [];
	var filterExpr = ['custrecord_ai_s_sync_error','is','T'];
	
	columns.push(new nlobjSearchColumn('name', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_batch_guid', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_invoice_count', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_batch_total', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_date_closed', null));
	
	return nlapiSearchRecord('customrecord_pp_ai_invoice_batches',null,filterExpr,columns);
	
}


function invoiceBatchSearch(externalBatchGUIDs){
	
	var columns = [];
	var filterExpr = [];
	
	//filters.push(new nlobjSearchFilter('custrecord_ai_invbat_batch_guid',null,'any',externalBatchGUIDs));
	// BUILD THE MEGA OR SINCE NetSuite wont let us do anyof on text fields!
	for(var i = 0; i < externalBatchGUIDs.length; i++){
		filterExpr.push(['custrecord_ai_invbat_batch_guid','is',externalBatchGUIDs[i]]);
		filterExpr.push('or');
	}
	filterExpr.pop();
	
	columns.push(new nlobjSearchColumn('name', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_batch_guid', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_invoice_count', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_batch_total', null));
	columns.push(new nlobjSearchColumn('custrecord_ai_invbat_date_closed', null));
	
	return nlapiSearchRecord('customrecord_pp_ai_invoice_batches',null,filterExpr,columns);
	
}


function setCurrentLineItemValues(batchRec,externalInvoice){
	
	var vendIdsObj = extractVendorIdVendorAddressId(externalInvoice);
	
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_raw_data',JSON.stringify(externalInvoice));
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_amount',externalInvoice.GrossAmount);
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_po_number',(externalInvoice.PONumber || "").toString());
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_vendor_name',externalInvoice.BuyerVendor.VendorName);
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_vendor_id', vendIdsObj.vendorInternalId.toString());
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_vnd_addr_id', vendIdsObj.vendorAddressInternalId.toString());
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_last_changed_date',externalInvoice.LastChangedDate);
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_image_url',externalInvoice.ImageUrl);
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_number',(externalInvoice.Number || "").toString());
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_invoice_date',nlapiDateToString(parseISO8601Date(externalInvoice.InvoiceDate), 'date'));
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_due_date',nlapiDateToString(parseISO8601Date(externalInvoice.InvoiceDueDate), 'date'));
}

function addInvoiceToBatch(batchRec,externalInvoice){
	batchRec.selectNewLineItem('recmachcustrecord_ai_inv_batch');
	
	batchRec.setCurrentLineItemValue('recmachcustrecord_ai_inv_batch', 'custrecord_ai_inv_id',externalInvoice.Id);
	
	setCurrentLineItemValues(batchRec,externalInvoice);
	
	batchRec.commitLineItem('recmachcustrecord_ai_inv_batch');
}

/**
 * Delete imported invoices from NetSuite
 * 
 * @param invoicesToDelete
 */
function deleteInvoices(invoicesToDelete){
	for(var i = 0; i < invoicesToDelete.length; i++){
		try{
			nlapiDeleteRecord('customrecord_ai_imported_invoices',invoicesToDelete[i]);
		}
		catch(e){
			nlapiLogExecution('ERROR', e.name, e.message);
		}
		
		if((i + 1) % 5 == 0){
			checkGovernance();
		}
	}
}

function parseISO8601Date(dateStr){
	var subStr = dateStr.split('T')[0];
	var parts = subStr.split('-');
	var d = new Date(parts[0],parts[1]-1,parts[2]);
	return d;
}

/**
 * Retrieve the numeric accounting application id from AvidSuite
 * 
 * @param accountingApplicationName
 * @param service
 * @returns {integer}
 */
function getAccountingApplicationId(accountingApplicationName,service){
	var acn = accountingApplicationName.trim().toLowerCase();
	var accoutingSystemPager = new PPSLibAvidSuite.ResourcePager(PPSLibAvidSuite.getAccountingSystemsUrl(),service);
	var accountingSystemItems = accoutingSystemPager.all();
	for(var i = 0; i < accountingSystemItems.length; i++){
		if(accountingSystemItems[i].Name.trim().toLowerCase() == acn){
			return accountingSystemItems[i].ID;
		}
	}
	return null;
}


function getMomentDateFormatFromNetSuiteDateFormat(nsDateFormatStr){
	var map = {
			"MM/DD/YYYY":"M/D/YYYY",
			"DD/MM/YYYY":"D/M/YYYY",
			"DD-Mon-YYYY":"D-MMM-YYYY",
			"DD.MM.YYYY":"D.M.YYYY",
			"DD-MONTH-YYYY":"D-MMMM-YYYY",
			"DD MONTH, YYYY":"D MMMM, YYYY",
			"YYYY/MM/DD":"YYYY/M/D",
			"YYYY-MM-DD":"YYYY-M-D"
	};
	
	return map[nsDateFormatStr];
}

function ppDateToString(date,format){
	if(typeof moment != 'undefined'){
		var momentFormat = getMomentDateFormatFromNetSuiteDateFormat(format);
		if(momentFormat){
			return moment(date).format(momentFormat);
		}
	}
	else{
		return nlapiDateToString(date, 'date');
	}
}

function ppStringToDate(dateStr,format){
	//try using NetSuite's unofficial stringtodate function first
	if(typeof stringtodate == 'function'){
		return stringtodate(dateStr,format);
	}
	else if(typeof moment != 'undefined'){
		var momentFormat;
		if(momentFormat = getMomentDateFormatFromNetSuiteDateFormat(format)){
			return moment(dateStr,momentFormat);
		}
	}
	return NaN;
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
			vendorAddressInternalId : ''
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


function setRecoveryPoint(){
	var state = nlapiSetRecoveryPoint(); //100 point governance
	if( state.status == 'SUCCESS' ) return;  //we successfully create a new recovery point
	if( state.status == 'RESUME' ) //a recovery point was previously set, we are resuming due to some unforeseen error
	{
		nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		handleScriptRecovery();
	}
	else if ( state.status == 'FAILURE' )  //we failed to create a new recovery point
	{
		nlapiLogExecution("ERROR","Failed to create recovery point. Reason = "+state.reason + " / Size = "+ state.size);
		handleRecoveryFailure(state);
	}
}
 
function checkGovernance()
{
	var context = nlapiGetContext();
	if( context.getRemainingUsage() < myGovernanceThreshold )
	{
		var state = nlapiYieldScript();
		if(state.status == 'FAILURE'){
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status == 'RESUME' )
		{
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
		// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	}
}
 
function handleRecoverFailure(failure)
{
	if( failure.reason == 'SS_MAJOR_RELEASE' ) throw "Major Update of NetSuite in progress, shutting down all processes";
	if( failure.reason == 'SS_CANCELLED' ) throw "Script Cancelled due to UI interaction";
	if( failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT' ) { throw "Script Exceeded Memory";} //cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
	if( failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE' ) throw "Could not set recovery point because of a reference to a non-recoverable object: "+ failure.information; 
}