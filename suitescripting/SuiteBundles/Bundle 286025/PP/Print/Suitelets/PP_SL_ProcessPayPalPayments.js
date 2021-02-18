/**
 * Display a list of PayPal payments to process as a mass payment. Once payments have been selected and submitted, 
 * a mass payments will be created and sent to PayPal.
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Mar 2014     maxm
 *
 */

var context = nlapiGetContext();
var environment = context.getEnvironment();
var accountId = -1;
var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');
var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
var approvalsEnabled = context.getSetting('SCRIPT', 'custscript_enable_approvals') == 'T' ? true : false;
var amountField = 'amount';
if(multiCurrencyEnabled){
	amountField = 'fxamount';
}
var CAC_FORM_SUBLIST_ID = 'custpage_paypal_trans';

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){

	var form = nlapiCreateForm('PayPal Mass Payments', false);
	
	var paypalEnabled = context.getSetting('SCRIPT', 'custscript_pp_enable_paypal_mp') == 'T';
	if(!paypalEnabled){
		form.addField('custpage_paypal_disabled', 'label', 'PayPal Mass Payments are not enabled');
		response.writePage(form);
		return;
	}
	
	var massPaymentRecordListUrl = nlapiResolveURL('RECORD', 'customrecord_pp_paypal_mass_payments',null,'EDIT').replace('custrecordentry','custrecordentrylist');
	
	form.addPageLink('crosslink', 'Mass Payment List', massPaymentRecordListUrl);
	
	var bAccount = request.getParameter("custpage_account_select");
	
	if(request.getMethod() == 'POST'){
		try{
			var numSublistItems = request.getLineItemCount(CAC_FORM_SUBLIST_ID);
			
			var tranIds = [];
			for(var i = 1; i <= numSublistItems; i++){
				var processItem = request.getLineItemValue(CAC_FORM_SUBLIST_ID, 'custpage_pp_pc_checkbox', i);
				if(processItem == 'T'){
					tranIds.push(request.getLineItemValue(CAC_FORM_SUBLIST_ID, 'internalid', i));
				}
			}
			
			if(tranIds.length == 0){
				throw nlapiCreateError('NO_ITEMS_SELECTED', 'No items selected.', false);
			}
			
			var badIds = transactionCheck(tranIds);
			if(badIds.length > 0){
				throw nlapiCreateError('PAYMENTS_IN_PROGRESS', 'One or more of the payments is already being processed or completed.', false);
			}

			var currencyTranMap = mapTransactionsToCurrency(tranIds);
			
			nlapiLogExecution('DEBUG','currencyTranMap',JSON.stringify(currencyTranMap));
			
			// load configuration			
			var paypalAPIConfig =  PPSLibPayPal.loadPayPalConfig(bAccount);
			
			var keys = Object.keys(currencyTranMap);
			
			var errors = [];
			var successfulSentMPs = 0;
			var successfulSentTrans = 0;
			for(var i = 0; i < keys.length; i++){
				try{
					paypalAPIConfig.currencyCode = currencyTranMap[keys[i]].currencyCode;
					// split mass payments by currency
					PPSLibPayPal.sendMassPayment(paypalAPIConfig,currencyTranMap[keys[i]].tranIds,bAccount);
					successfulSentMPs++;
					successfulSentTrans += currencyTranMap[keys[i]].tranIds.length;
				}
				catch(e){
					errors.push(e);
				}
			}
			
			// Display status message to user
			var label = 'Mass Payments Created: ' + successfulSentMPs + '<br/>';
			label += 'Payments sent: ' + successfulSentTrans + '<br/>';
			label += 'Errors: ' + errors.length + '<br/>';
			if(errors.length > 0){
				label += 'Errors Details: ' + '<br/>';
				for(var i = 0; i < errors.length; i++){
					label += errors[i].toString() + '<br/>';
				}
			}
			label += '<a href="'+massPaymentRecordListUrl+'">View Mass Payments</a>';
			form.addField('info_label', 'label', label);
		}
		catch(e){
			nlapiLogExecution('ERROR', e.name, e.message);
			form.addField('error_label', 'label', 'Error: ' + e.message);
		}
		
	}
	else{
		form.setScript('customscript_pp_cs_process_paypal_paymen');
		var acctSelectField = createAccountSelect(form,bAccount);
		if(bAccount){
			var sublist = setupUiSublist(form);
			// Find all unprocessed paypal payments and add to a list
			var searchResults = findAllProcessablePayPalPayments(bAccount);
			writeResults(searchResults,sublist);
			
			form.addSubmitButton('Process');
		}
		else{
			// automatically redirect to only paypal account
			var so = acctSelectField.getSelectOptions();
			if(so && so.length == 1){
				nlapiSetRedirectURL('SUITELET', context.getScriptId(), context.getDeploymentId(), null, {custpage_account_select: so[0].getId()});
			}
		}
	}
	response.writePage(form);
}

/**
 * Creates the SubList UI component that will hold search results.
 * 
 * @param form {nlobjForm} - The Form to which the SubList will be added.
 * 
 * @return {nlobjSubList} A reference to the SubList UI component.
 */
function setupUiSublist(form) {
	var sublist = {},
		listTitle = 'PayPal Payments';
	
	sublist = form.addSubList(CAC_FORM_SUBLIST_ID, 'list', listTitle);
	
	sublist.addMarkAllButtons();
	
	sublist.addField('custpage_pp_pc_checkbox','checkbox','Process');
	sublist.addField('edit','text','Edit | View');
	sublist.addField('entityname', 'text', 'Entity');
	sublist.addField('amount', 'currency', 'Amount');
	
	if(multiCurrencyEnabled){
		sublist.addField('currency', 'text', 'Currency');
	}
	
	//sublist.addField('account', 'text', 'Account');
	sublist.addField('recordtype', 'text', 'Type');
	sublist.addField('trandate', 'date', 'Date');
	sublist.addField('memo', 'textarea', 'Memo');
	

	sublist.addField('internalid', 'text', 'Internal ID').setDisplayType('hidden');
	
	
	return sublist;
}

/**
 * Write search results to provided SubList component.
 * 
 * @param {nlobjSearchResult[]} results - The search results to write to the SubList.
 * @param {nlobjSubList} sublist - The SubList component to which results are being written.
 * @private 
 */
function writeResults(results, sublist) {
	var resultIndex = results.length - 1,
		lineIndex = 1,
		entityHTML = '',
		paymentHTML = '',
		show = true,
		where = 'writeResults';
	
	var itemsToAdd = [];
	if (results && sublist) {
		for (; resultIndex >= 0; resultIndex--) {
			
			var searchResult = results[resultIndex];
			var __i = {};

			/* Set Entity Name field to be a link to the Entity record */
			entityHTML = '<a href="#" onclick="redirectToEntity(' + searchResult.getValue('entity') + ' )" />' +
				searchResult.getText('entity') + "</a>";
			__i.entityname = entityHTML;
			
			var v = nlapiResolveURL('RECORD', searchResult.getValue('recordtype'), searchResult.getId(), 'VIEW');
        	var e = nlapiResolveURL('RECORD', searchResult.getValue('recordtype'),searchResult.getId() , 'EDIT');
        	var view = '<a href="' + v + '">View</a>';
        	var edit = '<a href="' + e + '">Edit</a>';
        	__i.edit =  edit + " | " + view;
        	
			__i.memo = searchResult.getValue('memo');
			__i.amount = Math.abs(searchResult.getValue(amountField)).toFixed(2);
			if(multiCurrencyEnabled){
				__i.currency = searchResult.getText('currency');
			}
			__i.recordtype = $PPS.Transaction.convertToTypeName(searchResult.getValue('recordtype'));
			__i.trandate = searchResult.getValue('trandate');
			__i.internalid = searchResult.getId();
				
			itemsToAdd.push(__i);
		}
		// setLineItenValues is much faster than adding items one at a time
		sublist.setLineItemValues(itemsToAdd);
	} 
}

function createAccountSelect(form,selectedAccount) {

    //form.addFieldGroup('custpage_firstgroup', 'Bank Account Selection');
    var accountSelect = form.addField('custpage_account_select', 'select', 'Bank Account', null, null);
    accountSelect.addSelectOption(-1, '');

    var columns = [],
	filters = [];
	
    columns.push(new nlobjSearchColumn('name'));
	
    filters.push(new nlobjSearchFilter('type', null, 'is', 'Bank'));
    filters.push(new nlobjSearchFilter('custrecord_pp_account_exclude',null,'is','F'));
    filters.push(new nlobjSearchFilter('custrecord_pp_is_paypal_account',null,'is','T'));
    	
    var search = nlapiCreateSearch('account',filters,columns);
	var resultSet = search.runSearch();
	var i = 0;
	resultSet.forEachResult(function(searchResult){
		accountSelect.addSelectOption(searchResult.getId(), searchResult.getValue('name'), selectedAccount == searchResult.getId());
		i++;
		return i < 4000; // return true to keep iterating
	});

    return accountSelect;
}

/**
 * Check if any transactions are already being used or have a status of Completed in a mass payment.
 * @param {Array} tranIds
 * 
 * @returns {Array} - an array of transaction ids
 * 
 */
function transactionCheck(tranIds){
	var filterExp = [
	                 ['custrecord_pp_paypal_mptran_transaction','anyof',tranIds],
	                 'and',
	                 ['custrecord_pp_paypal_mptran_mass_payment.custrecord_pp_paypal_mp_status','isnot','Failed']
	                ];
	
	var columns = [];
	
	// NetSuite wont let me group on Transaction, this is how I get around it
	var tranIdColumn = new nlobjSearchColumn('formulanumeric',null,'group');
	tranIdColumn.setFormula('{custrecord_pp_paypal_mptran_transaction.id}');
	columns.push(tranIdColumn);
	
	var searchResults = nlapiSearchRecord('customrecord_pp_paypal_mp_transactions', null, filterExp, columns);
	
	var badTranIds = []; 
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			badTranIds.push(searchResults[i].getValue(tranIdColumn));
		}
	}
	return badTranIds;
}

function findAllProcessablePayPalPayments(bAccount){
	// build the search
    var filters = [
        //new nlobjSearchFilter('custbody_pp_payment_method', null, 'is', "PayPal"),
        new nlobjSearchFilter('custbody_pp_payment_method', null, 'is', "3"),
        new nlobjSearchFilter('mainline', null, 'is', "T"),
        new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
        //new nlobjSearchFilter('account', null, 'anyof', bAccount),
        new nlobjSearchFilter('voided', null, 'is', 'F'),
        new nlobjSearchFilter('memorized', null, 'is', 'F'),
        new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']),
        new nlobjSearchFilter('account', null, 'anyof', [bAccount])
    ];
    
    var columns = [];
    
    columns.push(new nlobjSearchColumn(amountField));
    columns.push(new nlobjSearchColumn('type'));
    columns.push(new nlobjSearchColumn('trandate'));
    columns.push(new nlobjSearchColumn('entity'));
    columns.push(new nlobjSearchColumn('memo'));
    columns.push(new nlobjSearchColumn('recordtype'));
    
    
    if(approvalsEnabled){
    	filters.push(new nlobjSearchFilter('custbody_pp_is_approved',null,'is','T'));
    }
    
    if(accountingPeriodsEnabled){
    	filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
    }
    
    if(multiCurrencyEnabled){
    	columns.push(new nlobjSearchColumn('currency'));
    }
    
    var search = nlapiCreateSearch('transaction', filters, columns);
    var searchResultSet = search.runSearch();
    
    var allSearchResults = [];
    var startIndex = 0;
    var go = true;
    while(go){
    	// get searchResults 1000 at a time
    	var searchResults = searchResultSet.getResults(startIndex, startIndex + 1000);
    	
    	if(!searchResults || searchResults.length == 0){
    		break;
    	}
    	
    	// make a copy of search results so we can splice them
    	// NetSuite prevents us from splicing the array they return for some reason
    	var srs = [];
    	for(var i = 0; i < searchResults.length; i++){
    		srs.push(searchResults[i]);
    	}
    	
    	searchResults = srs;
    	
    	nlapiLogExecution('DEBUG', 'PayPal results found', searchResults.length);
    	// stop loop if less than 1000 results are returned
    	if(searchResults.length < 1000){
    		go = false;
    	}
    	
    	//extract tranIds
        var tranIds = [];
        for(var i = 0; i < searchResults.length; i++){
        	tranIds.push(searchResults[i].getId());
        }
        
        // find transactions to filter out
        var tranIdsToFilter = transactionCheck(tranIds);
        nlapiLogExecution('DEBUG','tranIdsToFilter',JSON.stringify(tranIdsToFilter));
        
        // filter out bad transactions
        for(var i = 0; i < tranIdsToFilter.length; i++){
        	for(var j = 0; j < searchResults.length; j++){
        		if(searchResults[j].getId() == tranIdsToFilter[i]){
        			searchResults.splice(j,1);
        			break;
        		}
        	}
        }
        
        nlapiLogExecution('DEBUG','Results after filter',searchResults.length);
        // append all non filtered results to allSearchResults
        allSearchResults = allSearchResults.concat(searchResults);
        startIndex += 1000;
    }

    return allSearchResults;
}


/**
 * Get transaction ids grouped by currency
 * 
 * @param {Array} tranIds - an array of transaction ids
 * 
 * @returns {Object} - an object like {3: {tranIds: [1001,1002], currencySymbol: 'USD'}, 4: {tranIds: [1003,1004], currencySymbol: 'CAN'}}
 */
function mapTransactionsToCurrency(tranIds){
	var currencyMapObj = {};
	
	if(multiCurrencyEnabled){
		var filters = [];
		var columns = [];
		
		filters.push(new nlobjSearchFilter('mainline', null, 'is', "T"));
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', tranIds));
		columns.push(new nlobjSearchColumn('currency'));
		
		var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
		
		for(var i = 0; i < searchResults.length; i++){
			var sr = searchResults[i];
			if(!(sr.getValue('currency') in currencyMapObj)){
				currencyMapObj[sr.getValue('currency')] = {tranIds : []};
			}
			currencyMapObj[sr.getValue('currency')].tranIds.push(sr.getId());
		}
		
		var currencyIds = Object.keys(currencyMapObj);
		
		var currencySRs = currencySearch(currencyIds);
		for(var i = 0; i < currencySRs.length; i++){
			var csr = currencySRs[i];
			currencyMapObj[csr.getId()].currencyCode = csr.getValue('symbol');
		}
	}
	else{
		// try and load basecurrency, if USA, set to USD else throw error that multicurrency must be enabled
		var companyInfo = nlapiLoadConfiguration('companyinformation');
		var currencyLocale = companyInfo.getFieldText('basecurrency');
		if(currencyLocale.toUpperCase() == 'USA'){
			currencyMapObj["0"] = {tranIds : tranIds, urrencySymbol: 'USD'};
		}
		else{
			throw nlapiCreateError('PP_PAYPAL_MULTICURRENCY_NOT_ENABLED','Multicurrency must be enabled when base currency locale is not USA.');
		}
	}
	
	
	return currencyMapObj;
}

function currencySearch(currencyIds){
	
	var columns = [new nlobjSearchColumn('symbol')];
	var filters = [new nlobjSearchFilter('internalid',null,'anyof',currencyIds)];

	return nlapiSearchRecord('currency',null,filters,columns);
}