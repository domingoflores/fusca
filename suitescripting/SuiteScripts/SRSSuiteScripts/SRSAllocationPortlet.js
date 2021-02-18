/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/**
 * @author durbano
 * 
 */
function loadPortlet(portlet,column)
{
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.loadPortlet", "Entering method.");
	portlet.setTitle('Escrow Transaction & Allocation Portlet');
	
	var portletUrl = nlapiResolveURL('SUITELET','customscript_allocation_action_handler','customdeploy_allocation_action_handler','FALSE');
	
	var wrapperPage = 'wrapper';
	var wrapperUrl = portletUrl + '&page=' + wrapperPage + '&frame=default';

	var iFrameContent = '<td id="SRSAllocationPortletTD" height="700px" ><iframe frameborder="0" name="SRSAllocationtPortlet" src="' + wrapperUrl + '" width="100%" height="700px" scrolling="no"></iframe></td>';
	
	portlet.setHtml(iFrameContent);
}

function handleRequest(portletRequest,portletResponse) {
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.handleRequest", "Entering method.");
	// process request
	var page = portletRequest.getParameter('page');

	if(page == null) {
		nlapiLogExecution('DEBUG','SRSAllocationPortlet.handleRequest','Page is null');		
		portletResponse.write('Request parameter "page" is null');
		return;
	}

	if(page == 'wrapper') {
		nlapiLogExecution('DEBUG','SRSAllocationPortlet.handleRequest','Page is Wrapper');
		writeWrapper(request,response);
		return;		
	}

	var content = null;
	if(page == 'default') {
		content = allocationsPendingAllocationDisplay(portletRequest);
	}
	else if(page == 'allocate' || page == 'VERIFY' || page == 'RELEASE') {
		var transid 	= portletRequest.getParameter('internalid');
		var recordType 	= portletRequest.getParameter('type');
		var line		= portletRequest.getParameter('line');
		var tx = nlapiLoadRecord(recordType,transid);
		var status = null;
		if(page == 'allocate') {
			status = tx.getFieldValue('custbody_esc_tx_status');
			if(status == 'NEW' || status == 'UPDATED') {
				status = status + '_PENDING_ALLOCATION';
			}
			else if(status == 'MINOR_UPDATE') {
				status = status + '_PENDING_MINOR_UPDATE';
			}
			else {
				return; // do not process
			}
		}
		else if(page == 'VERIFY' || page == 'RELEASE') {
			// update transaction and then render default page
			status = 'PENDING_' + page;
		}
		tx.setFieldValue('custbody_esc_tx_status',status);
		nlapiSubmitRecord(tx,false,false);

		var params = new Array();
		params['custscript_transaction_id'] = transid;
		params['custscript_transaction_type'] = recordType;
		params['custscript_allocation_action'] = page;
		params['custscript_transaction_line'] = line;
		nlapiScheduleScript('customscript_alloc_scheduler_handler','customdeploy_alloc_scheduler_handler',params);

		content = allocationsPendingAllocationDisplay(portletRequest);
	}
	else if(page == 'reconcile') {
		try {
			content = reconcileTransactionDisplay(portletRequest);
			portletResponse.write(content);
			return;
		}
		catch(error) {
			if(error == 'PROBLEM_WITH_TRANSACTION-UNKNOWN_LINE_NUMBER_FOUND') {
				portletResponse.write('PROBLEM_WITH_TRANSACTION-UNKNOWN_LINE_NUMBER_FOUND');
				return;				
			}
			throw error + ': SRSAllocationPortlet.handleRequest';
		}
	}
	else if(page == 'monthEnd') {
		writeMonthEnd(portletResponse,portletRequest);
		return;
	}
	else if(page == 'transfer') {
		content = writeTransferPage(portletResponse,portletRequest);
	}
	else if(page == 'doTransfer') {
		writeDoTransferPage(portletResponse,portletRequest);
		return;
	}
	else if(page == 'doCompleteTransfer') {
		doProRataTransfer(portletRequest);
		writeDoTransferPage(portletResponse,portletRequest);
		return;
	}
	else {
		response.write('Page ' + page + ' not found.');
		return;
	}

	// process response
	portletResponse.writePage(content);
}

function writeWrapper(request,response) {
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.writeWrapper", "Entering method.");
	var portletUrl = nlapiResolveURL('SUITELET','customscript_allocation_action_handler','customdeploy_allocation_action_handler','FALSE');
	
	var frame = request.getParameter('frame');
	var defaultPage = 'default';
	var defaultUrl = portletUrl + '&page=' + frame;
	
	var wrapperPage = 'wrapper';
	var wrapperUrl  = portletUrl + '&page=' + wrapperPage + '&frame=' + defaultPage;
	
	var releasePage = 'releaseAll';
	var releaseUrl  = portletUrl + '&page=' + releasePage;

	var monthEndPage = 'monthEnd';
	var monthEndUrl  = portletUrl + '&page=' + wrapperPage + '&frame=' + monthEndPage;

	var trnsferPage = 'transfer';
	var transferUrl  = portletUrl + '&page=' + wrapperPage + '&frame=transfer&filter=transfer';

	var headerContent = '<font size="1"> &nbsp; '
						+ '<a href="' + wrapperUrl + '">View All</a> &nbsp; | &nbsp; '
						+ '<a href="' + wrapperUrl + '&filter=allocation">Waiting for Allocation</a> &nbsp; | &nbsp; '
						+ '<a href="' + wrapperUrl + '&filter=reconcilement">Waiting for Reconcilement</a>  &nbsp; | &nbsp; '
						+ '<a href="' + wrapperUrl + '&filter=release">Waiting for Release</a>  &nbsp; | &nbsp; '
						+ '<a href="' + wrapperUrl + '&filter=runAllocator">Run Allocator</a>  &nbsp; | &nbsp; '
						+ '<a href="' + transferUrl + '">Transfers</a>  '; //&nbsp; | &nbsp; '
						//+ '<a href="' + monthEndUrl + '">Month End</a> ';
						//+ '<a href="' + releaseUrl + '">Release All</a> </font>';

	var filter = request.getParameter('filter');
	if(filter && filter != null && filter.length > 0) {
		defaultUrl += '&filter=' + filter;
	}
	var iFrameContent = '<iframe frameborder="0" name="SRSCustomerPortalAccessBody" width="100%" height="100%" src="' + defaultUrl + '" scrolling="auto"></iframe>';

	response.write(headerContent);
	response.write(iFrameContent);	
}

function writeMonthEnd(response,request) {
	var portletUrl   = nlapiResolveURL('SUITELET','customscript_allocation_action_handler','customdeploy_allocation_action_handler','FALSE');
	var monthEndUrl  = portletUrl + '&page=monthEnd';
	var currDate	 = request.getParameter('monthEndDate');

	var html = '<table><tr>';
	
	var activeDate = new Date();
	activeDate.setDate(1);	// default active date should be last month
	activeDate.setMonth(activeDate.getMonth() - 1);
	activeDate.setDate(getDaysInMonth(activeDate.getMonth() + 1,activeDate.getYear()));
	if(currDate && currDate != null) {
		activeDate = new Date(currDate);
	}
	
	var startDate = new Date();
	startDate.setDate(getDaysInMonth(startDate.getMonth() + 1,startDate.getYear()));
	for(var i = 0; i < 5; i++) {
		if(dateToString(activeDate) == dateToString(startDate)) {
			html += '<th>' + dateToString(startDate) + '</th>';
		}
		else {
			html += '<td><a href="foo">' + dateToString(startDate) + '</a></td>';
		}

		// increment down
		startDate.setDate(1);	// set to first of month, then increment down
		startDate.setMonth(startDate.getMonth() - 1);
		startDate.setDate(getDaysInMonth(startDate.getMonth() + 1,startDate.getYear()));
	}
	html += '</tr></table>';
	response.write(html);
}

function writeTransferPage(response,request) {
	var filter = request.getParameter('filter');
	
	var results = getPendingAllocations(filter);
	
	var content = renderPendingAllocations(results, request);

	return content;	
}

function writeDoTransferPage(response,request) {
	var txId = request.getParameter('internalid');
	if(txId == null || txId.length == 0) return 'No transaction id found.';
	var tx = nlapiLoadRecord('journalentry',txId);
	
	var html = '<table>';
	
	html += '<tr><th align="right">Deal</th><td>' + tx.getFieldText('custbody2') + '</td></tr>';
	html += '<tr><th align="right">Escrow Account Type</th><td>' + tx.getFieldText('custbody3') + '</td></tr>';
	html += '<tr><th align="right">Memo</th><td>' + tx.getFieldValue('custbody4') + '</td></tr>';
	html += '<tr><th align="right">Status</th><td>' + tx.getFieldValue('custbody_esc_tx_status') + '</td></tr>';
	
	var transferCompleted = false;
	try {
		var sourceShareholderHtml = displayShareholderLines(tx,'credit');
		
		html += '<tr><th align="left" colspan="2">Source Shareholder(s)</th><th>Transfer Amount</th><th>Total Pro Rata</th></tr>';
		html += sourceShareholderHtml;
	}
	catch(e) {
		if(e != 'PRO_RATA_TRANSFER_COMPLETED')	throw e;
		transferCompleted = true;
	}
	
	html += '<tr><th align="left" colspan="2">Target Shareholder</th><th>Transfer Amount</th><th>Total Pro Rata</th></tr>';
	html += displayShareholderLines(tx,'debit');
	
	// go through the line itmes and display the "debit" shareholders
	if(transferCompleted == true){
		html += '<tr><td>Transfer Already Completed</td></tr>';
	}
	else {
		var portletUrl = nlapiResolveURL('SUITELET','customscript_allocation_action_handler','customdeploy_allocation_action_handler','FALSE');
		html += '<tr><td><br/><a href="' + portletUrl + '&page=doCompleteTransfer&internalid=' + txId + '">Complete Transfer</a></td></tr>';
	}
	
	html += '</table>';
	response.write(html);
}

function doProRataTransfer(request) {
	var txId = request.getParameter('internalid');
	if(txId == null || txId.length == 0) throw 'No transaction id found';
	var txRcd = nlapiLoadRecord('journalentry',txId);
	
	var cnt = txRcd.getLineItemCount('line');
	
	// Get the target shareholder. Only one should exist.
	var targetShareholderId = null;
	for(var i = 1; i < (cnt + 1); i++) {
		var dbAmount 	= txRcd.getLineItemValue('line', 'debit', i);  // skip any line item where the amount is 0.00
		if(dbAmount == null) {
			continue; 								   // this is a 'source' shareholder
		}
		if(targetShareholderId != null)	{
			throw 'MORE THAN ONE TARGET SHAREHOLDER FOUND IN TRANSACTION';
		}
		targetShareholderId = txRcd.getLineItemValue('line', 'entity', i);	// do not break here. We want certainty that we only find one target.
	}
	if(targetShareholderId == null)	{
		throw 'NO TARGET SHAREHOLDER FOUND IN TRANSACTION';
	}
	
	// verify the target shareholder is of category 'shareholder'
	if(!entityIsShareholder(targetShareholderId)) {
		throw Code.NotAShareholder;
	}
	
	// get the list of 'source' shareholders
	var sourceShareholders = new Array();
	for(var i = 1; i < (cnt + 1); i++) {
		var crAmount 	= txRcd.getLineItemValue('line', 'credit', i);  // skip any line item where the amount is 0.00
		if(crAmount == null) {
			continue; 								   // this is a 'source' shareholder
		}
		var entityId 	= txRcd.getLineItemValue('line', 'entity', i);
		var accountId 	= txRcd.getLineItemValue('line','account',i); // account internal id
		
		var proRataData = getShareholderProRata(entityId,accountId);
		if(proRataData == null || proRataData.length == 0) {
			continue;
		}
		
		sourceShareholders.push(proRataData);
		
		// for each source shareholder, update their pro rata information to have 'zero' pro rata
		for(var j = 0; j < proRataData.length; j++) {
			var datum = proRataData[j];
			
			var proRataRcd = nlapiLoadRecord('customrecordespr',datum.id);
			proRataRcd.setFieldValue('custrecordpro_rata_deci',0.00);
			proRataRcd.setFieldValue('custrecordpro_rata_text','0.000000000000000');
			
			nlapiSubmitRecord(proRataRcd,false,false);
		}
	}
	
	// for each source shareholder, create a new pro rata record for the 'target' shareholders
	for(var i = 0; i < sourceShareholders.length; i++) {
		var shareholderProRata = sourceShareholders[i];
		for(var j = 0; j < shareholderProRata.length; j++) {
			var datum = shareholderProRata[j];
			
			var newRcd = nlapiCreateRecord('customrecordespr', 	  datum.id);
				newRcd.setFieldValue('custrecordescrow',		  datum.deal_id);
				newRcd.setFieldValue('custrecordescrow_account',  datum.account_id);
				newRcd.setFieldValue('custrecordshareholder',	  targetShareholderId);
				newRcd.setFieldValue('custrecordlot',			  'TSFR-' + datum.lot);
				newRcd.setFieldValue('custrecordpro_rata_deci',	  datum.pro_rata_deci);
				newRcd.setFieldValue('custrecordpro_rata_text',	  datum.pro_rata_text);
				newRcd.setFieldValue('custrecord_escrow_tx_created_from_cert',	  datum.cert); // added for Subsequent Payment Creation process
			
			nlapiSubmitRecord(newRcd,false,false);
		}
	}
}

function displayShareholderLines(txRcd,crDbName)
{
	// go through the line items and display the "credit" shareholders
	var cnt = txRcd.getLineItemCount('line');
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.displayShareholderLines", "cnt = " + cnt);
	var html = '';
	for(var i = 1; i < (cnt + 1); i++)
	{
		// get the transaction data
		var accountId 	= txRcd.getLineItemValue('line','account',i); // account internal id
		var accountName = txRcd.getLineItemText('line', 'account', i);  // skip any line item where the account is anything other than 10***
		var crDbAmount 	= txRcd.getLineItemValue('line', crDbName, i);  // skip any line item where the amount is 0.00
		var entityId 	= txRcd.getLineItemValue('line', 'entity', i);
		var entityNm 	= txRcd.getLineItemText('line', 'entity', i);
		
		if(!entityIsShareholder(entityId)) throw entityNm + ' IS NOT OF TYPE SHAREHOLDER'; 
		
		if(crDbAmount == null) continue;
		
		var proRataData = getShareholderProRata(entityId,accountId);
		var totalProRata = 0.00;
		if(proRataData != null && proRataData.length > 0)
		{
			for(var j = 0; j < proRataData.length; j++)
			{
				var datum = proRataData[j];
				nlapiLogExecution("DEBUG", "SRSAllocationPortlet.displayShareholderLines", "datum.pro_rata = " + datum.pro_rata_text);
				totalProRata += parseFloat(datum.pro_rata_text);
			}
		}
		if(crDbName == 'credit' && totalProRata == 0.00) throw 'PRO_RATA_TRANSFER_COMPLETED';
		if(totalProRata == 0.00) totalProRata = '**none found**';
		
		html += '<tr><td align="left" colspan="2">' + entityNm + '</td><td align="right">' + crDbAmount + '</td><td align="left">' + totalProRata + '</td></tr>';
	}
	return html;
}

function scheduledHandler() {
	var searchResults = getPendingActions();
	if(searchResults == null || searchResults.length == 0) {
		nlapiLogExecution("DEBUG", "SRSAllocationPortlet.scheduledHandler", "No results found");
		return;
	}

	for (var i = 0; i < searchResults.length; i++) {
		if(i == 1) {
			nlapiScheduleScript('customscript_process_sched_allocations','customdeploy_sched_allocation_handler3');
			break; // need to catch timeout error and have this reschedule itself...
		} 
		
		var result = searchResults[i];
		var transid = result.getId();
		var recordType = result.getValue('type');
		var status = result.getValue('custbody_esc_tx_status');
		var line = parseInt(result.getValue('line')) + 1;

		if(transid == null || recordType == null) {
			continue;
		}
		recordType = translateType(recordType);
		nlapiLogExecution("DEBUG", "SRSAllocationPortlet.scheduledHandler", "Found unprocessed transactions. Processing " + transid + "/" + recordType + "/" + status);
		
		if(status == 'PENDING_VERIFY') {
			nlapiLogExecution('ERROR', 'scheduledHandler.Entering for PENDING_VERIFY if');
			nlapiLogExecution("DEBUG", "SRSAllocationPortlet.scheduledHandler", "Updating status to RECONCILED");
			updateAccountStatus(transid,recordType,line,'RECONCILED');
		}
		else if(status == 'PENDING_RELEASE') {
			nlapiLogExecution('ERROR', 'scheduledHandler.Entering for PENDING_RELEASE if');
			nlapiLogExecution("DEBUG", "SRSAllocationPortlet.scheduledHandler", "Updating status to RELEASED");
			updateAccountStatus(transid,recordType,line,'RELEASED');
		}
		else {
			nlapiLogExecution('ERROR', 'scheduledHandler.Entered else (status not PENDING_VERIFY or PENDING_RELEASE');
			handleAllocationAction(transid,recordType);
		}			
	}
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.scheduledHandler", "END");
}

function handleSchedule() {
	var context = nlapiGetContext();
	var action  = context.getSetting('SCRIPT','custscript_allocation_action');
	var transid = context.getSetting('SCRIPT','custscript_transaction_id');
	var type 	= context.getSetting('SCRIPT','custscript_transaction_type');
	var line	= context.getSetting('SCRIPT','custscript_transaction_line');
	
	if(action == 'allocate') {
		nlapiLogExecution('ERROR', 'handleSchedule.entered allocate');
		handleAllocationAction(transid,type);
	}
	else if(action == 'VERIFY') {
		nlapiLogExecution('ERROR', 'handleSchedule.entered VERIFY');
		updateAccountStatus(transid,type,line,'RECONCILED');
	}
	else if(action == 'RELEASE') {
		nlapiLogExecution('ERROR', 'handleSchedule.entered RELEASE');
		updateAccountStatus(transid,type,line,'RELEASED');
	}
}

function handleAllocationAction(transid,type) {
	var tx = nlapiLoadRecord(type,transid);
	var status = tx.getFieldValue('custbody_esc_tx_status');

	try {
		processTransaction(transid,type);
	} catch (e) {
		// email the error out for notification
		Messaging.SendErrorNotification('SRSAllocationPortlet.handleAllocationAction',e);

		tx = nlapiLoadRecord(type,transid);
		status = previousStatus(status);
		nlapiLogExecution("DEBUG", "SRSAllocationPortlet.handleAllocationAction", "status = " + status);
		tx.setFieldValue('custbody_esc_tx_status',status);
		nlapiSubmitRecord(tx,false,false);
	}	
}

/**
 * @return html content
 */
function statusDisplay(portletRequest) {
	var handler = nlapiResolveURL('SUITELET','customscript_allocation_action_handler','customdeploy_allocation_action_handler','FALSE');
	
	var transactionBalances = getTransactionBalances();
	var shareholderBalances = getShareholderTransactionBalances();
	
	var outOfBalance = compareBalances(transactionBalances, shareholderBalances);
	
	var content = "";
	return content;
}

/**
 * @return html content
 */
function outofBalanceAccountsDisplay()
{
	
}

/**
 * @return html content
 */
function proRataSumErrorsDisplay()
{
	
}

/**
 * @return html content
 */
function allocationsPendingAllocationDisplay(request) {
	var filter = request.getParameter('filter');
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.allocationsPendingAllocationDisplay", "filter = " + filter);
	var results = getPendingAllocations(filter);
	
	var content = renderPendingAllocations(results, request);
	return content;	
}

/**
 * @return html content
 */
function allocationInterfaceDisplay()
{
	
}

function reconcileTransactionDisplay(request) // rec sh
{
	var transid 	= request.getParameter('internalid');
	var recordType 	= request.getParameter('type');
	var line	 	= request.getParameter('line');

	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.reconcileTransactionDisplay", "transid = " + transid);
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.reconcileTransactionDisplay", "recordType = " + recordType);
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.reconcileTransactionDisplay", "line = " + line);

	var tx = nlapiLoadRecord(recordType,transid);
	var status = tx.getFieldValue('custbody_esc_tx_status');
	if(status != 'ALLOCATED') return 'Transaction must be in state ALLOCATED to proceed.';

	var portletUrl = nlapiResolveURL('SUITELET','customscript_allocation_action_handler','customdeploy_allocation_action_handler','FALSE');

	var deal = tx.getFieldValue('custbody2');
	var dealtext = tx.getFieldText('custbody2');
	var acct = tx.getFieldText('custbody3');
	var trandate = tx.getFieldValue('trandate');
	var drAmount = tx.getLineItemValue('line', 'debit', line);  // skip any line item where the amount is 0.00
	var crAmount = tx.getLineItemValue('line', 'credit', line); // skip any line item where the amount is 0.00
	var glAccount = tx.getLineItemValue('line', 'account', line); // skip any line item where the amount is 0.00
	var glAccountName = tx.getLineItemText('line', 'account', line); // skip any line item where the amount is 0.00

	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.reconcileTransactionDisplay", "glAccount = " + glAccount);
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.reconcileTransactionDisplay", "glAccountName = " + glAccountName);
	
	if(glAccount == null) throw 'PROBLEM_WITH_TRANSACTION-UNKNOWN_LINE_NUMBER_FOUND';
	
	var txAmount = drAmount;
	if(txAmount == null || txAmount == 0)	{
		txAmount = crAmount * -1;
	}
	txAmount = Math.round(txAmount * 100.00) / 100;
	
	var glBalance = getGlBalance(trandate,glAccount);
	var shTxAmount = getShareholderBalance(trandate,deal,glAccount,transid,line);
	var shBalance = getShareholderBalance(trandate,deal,glAccount,null,null);
	
	var html = '<table>';
	html += '<tr><th align="right">Deal:</th><td align="left">' + dealtext + '</td>';
	html += '<th align="Right">Account Type</th><td align="left">' + acct + '</td></tr>';
	html += '<tr><th align="right">Date:</th><td align="left">' + trandate + '</td>';
	html += '<th align="Right">Line ID</th><td align="left">' + line + '</td></tr>';
	html += '<tr><th align="right">Transaction Amount:</th><td align="left">' + txAmount + '</td>';
	html += '<th align="right">Amount Allocated:</th><td align="left">' + shTxAmount + '</td></tr>';
	html += '<tr><th align="right">TX Balance as of date:</th><td align="left">' + glBalance + '</td>';
	html += '<th align="right">SH Balance as of date:</th><td align="left">' + shBalance + '</td></tr>';
	html += '<tr><td>&nbsp;</td></tr>';
	
	if(txAmount == shTxAmount) {
		html += '<tr><td></td><td><a href="' + portletUrl + '&internalid=' + transid + '&type=' + recordType + '&line=' + line + '&page=VERIFY">Verify</a> ';	
	}
	else {
		html += '<tr><td></td><td>Can Not Verify ';
	}
	
	html += '&nbsp; &nbsp; | &nbsp; &nbsp; <a href="' + portletUrl + '&page=default">Cancel</a></td></tr>';
	html += '</table>'

	// get shareholder pro rata, each current balance, and each amount allocated for this transaction
	var shareholders = null; 
	
	try {
		shareholders = getShareholdersByProRataTable(glAccount,glAccountName);		// get all shareholders with a pro rata recorded
		if(shareholders == null || shareholders.length == 0) {
			html += '<br/><font color="red"><b>No shareholder pro ratas found for this account. Can not perform automated validations. Please perform manual shareholder pro rata/balance reconcilement.</b></font>';
			return html;
		}
	}
	catch(error) {
		html += '<br/><font color="red"><b>No shareholder pro ratas found for this account. Can not perform automated validations. Please perform manual shareholder pro rata/balance reconcilement.</b></font>';
		return html;
	}
	
	shareholders = getShareholderCurrentBalances(shareholders,glAccount,glAccountName,trandate);	// get the current balance as of the tx date for each shareholder
	shareholders = getShareholderTxBalance(shareholders,transid,line);									// get the amount allocated for this specific transaction

	html += '<font size="2">';
	var maxVariance = 0.1;
	var failureDetected = false;
	for(var i = 0; i < shareholders.length; i++)
	{
		var shareholder = shareholders[i];
		
		// check current balance
		var balanceVariance = Math.round((shareholder.proRata * glBalance - shareholder.currentBalance) * 100) / 100;
		var allocateVariance = Math.round((shareholder.proRata * txAmount - shareholder.newAmount) * 100) / 100;
		if(!failureDetected && (Math.abs(balanceVariance) > maxVariance || Math.abs(allocateVariance) > maxVariance))
		{
			failureDetected = true;
			html += '<br/><font color="red"><b>Automated total balance & allocation amounts reconcilement FAILED (maximum variance allowed is ' + maxVariance + '). <br/>Please perform manual shareholder pro rata/balance reconcilement.</b></font>';
			html += '<br/>Shareholder error: ' + shareholder.internalid + '/Lot ' + shareholder.lot + ' with balanceVariance = ' + balanceVariance + ' and allocateVariance = ' + allocateVariance;
		}
		else if(balanceVariance > maxVariance || allocateVariance > maxVariance)
		{
			html += '<br/>Shareholder error: ' + shareholder.internalid + '/Lot ' + shareholder.lot + ' with balance variance = ' + balanceVariance + ' and allocation variance = ' + allocateVariance;
		}
	}
	if(!failureDetected)
	{
		html += '<br/><font color="green"><b>Automated total balance & allocation amounts reconcilement PASSED with a maximum variance of '+maxVariance+'.</b></font>';
	}
	html += '</font>';

	return html;
}

function updateAccountStatus(transid,recordType,line,status) {
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "transid = " + transid);
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "recordType = " + recordType);
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "line = " + line);
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "status = " + status);
	
	var tx = nlapiLoadRecord(recordType,transid);
	
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "CHECK 1");
	
	var deal = tx.getFieldValue('custbody2');
	var trandate = tx.getFieldValue('trandate');
	
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "CHECK 2");
	//if(line == 0) line++;
	
	var glAccount = tx.getLineItemValue('line', 'account', line); // skip any line item where the amount is 0.00
	
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "CHECK 3");
	
	updateShTxStatus(trandate,deal,glAccount,transid,line,status);
	
	nlapiLogExecution("DEBUG", "SRSAllocationPortlet.updateAccountStatus", "CHECK 4");
	
	tx.setFieldValue('custbody_esc_tx_status',status);
	nlapiSubmitRecord(tx,false,false);
}