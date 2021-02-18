/**
 * Module Description
 * 
 * Version    Date            Author           	Remarks
 * 1.03       23 June 2014    smccurry		   	Installed on production
 * 1.04		  04 Sept 2014	  smccurry		   	Updated production from changes made during testing on staging.
 * 1.05		  10 Sept 2014	  smccurry			Fixed 2014.2 issues and added a 'Delete' button.  returnauthorization is still not working for this version.
 * 1.05		  12 Sept 2014    smccurry			Moved this version to Production.
 * 1.06		  09 Oct  2014	  smccurry			Updated this code to handle changes in the 1.9.1 version of the Piracle
 * 1.06       09 May  2018    Ken Crossman      ATP-103 As Operations, I want the delete credit memo/refund button on the Exchange Record, to be updated to first check 
 *												if the accounting period on the transactions you are trying to delete is closed and, if it's closed, then stop and do 
 *												not allow the user to delete.
 *            10 Aug 2018     Ken Crossman      ATP-242 Show PI information
 *            08 Oct 2018     Alex Fodor        ATP-353 Convert Payment Dashboard to use Queue Manager
 *            04 APR 2019     Alex Fodor        ATO-92  Prod support fix,  function getResultsProcessPaymentStatuses returning incorrect list of Payment Process records 
 *
 * Description: This is the core code used by the 'Approve and Create DA' button
 * which is which is on the Exchange Record and the Return Authorization.
 */
ERROR_MESSAGES = function(obj) { 
	this.returnMessages = new Array(); 
//	this.returnRecId = null;
};
ERROR_MESSAGES.prototype.getMessages = function() { 
	return this.returnMessages; 
};
ERROR_MESSAGES.prototype.addMessage = function(message) { 
	this.returnMessages.push({ 'message' : message }); 
};
ERROR_MESSAGES.prototype.isSuccess = function() { 
	return this.returnStatus == ERROR_MESSAGES.RETURNSTATUS.SUCCESS; 
};
ERROR_MESSAGES.prototype.isError = function() { 
	return this.returnStatus == ERROR_MESSAGES.RETURNSTATUS.ERROR; 
};
ERROR_MESSAGES.prototype.setStatusSuccess = function() { 
	this.returnStatus = ERROR_MESSAGES.RETURNSTATUS.SUCCESS; 
};
ERROR_MESSAGES.prototype.setStatusError = function() {
	this.returnStatus = ERROR_MESSAGES.RETURNSTATUS.ERROR; 
};
ERROR_MESSAGES.prototype.setReturnRecID = function(recID) { 
	this.returnRecID = recID; 
};
ERROR_MESSAGES.prototype.getReturnRecID = function() {
	return this.returnRecID; 
};
ERROR_MESSAGES.RETURNSTATUS = { SUCCESS : "Success", ERROR : "Error"};


//Create and Add the Line Item Fees for the Payment Method
function addLineItemFee(itemName, amount, cMemo){
	var itemID = getLineItemID(itemName);
	
	cMemo.selectNewLineItem('item');
	cMemo.setCurrentLineItemValue('item', 'item', itemID);
	cMemo.setCurrentLineItemValue('item', 'quantity', 1 );
	cMemo.setCurrentLineItemValue('item', 'amount', amount);
	var fee = cMemo.getCurrentLineItemValue('item', 'amount');
	cMemo.commitLineItem('item');
	return parseFloat(fee);
}

function getLineItemID(itemName){
	var filterItemName = itemName + '_fee',
		filters = [],
		columns = [],
		results = null;
	
	filters.push(new nlobjSearchFilter('custitem_reference_id', null, 'is', filterItemName));
	columns.push(new nlobjSearchColumn('custitem_reference_id'));
	
	results = nlapiSearchRecord('item', null, filters, columns) || [];
	
	return results && results.length ? results[0].getId() : 0;
}

function searchCustomerRefundforPayment(cMemoID) {
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('payingtransaction',null,'is',cMemoID));
		var columns = [];
		columns.push(new nlobjSearchColumn('tranid'));
		columns.push(new nlobjSearchColumn('payingtransaction'));
		
		return nlapiSearchRecord('customerrefund', null, filters, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchCustomerRefundforPayment() FAILED', JSON.stringify(err));
	}
	return null;
}

//function searchPiracleACHrecords(shareholder, newAccountNum, newRoutingNum, newAccountType) {
//	var piracle = {};
//	// Filter based on the shareholder
//	var filters = new Array();
//	filters[0] = new nlobjSearchFilter('custrecord_pp_ach_entity', null, 'ANYOF', shareholder);
//	// return opportunity sales rep, customer custom field, and customer ID
//	var columns = new Array();
//	columns[0] = new nlobjSearchColumn('custrecord_pp_ach_entity');
//	columns[1] = new nlobjSearchColumn('custrecord_pp_ach_account_number');
//	columns[2] = new nlobjSearchColumn('custrecord_pp_ach_routing_number');
//	columns[3] = new nlobjSearchColumn('custrecord_pp_ach_transaction_code');
//	
//	// execute the search, passing all filters and return columns
//	var searchresults = nlapiSearchRecord('customrecord_pp_ach_account', null, filters, columns );
//	
//	// loop through the results
//	for(var i = 0; searchresults != null && i < searchresults.length; i++) {
//		// get result values
//		var searchresult = searchresults[i];
//		if(searchresult.getValue('custrecord_pp_ach_account_number') == newAccountNum && searchresult.getValue('custrecord_pp_ach_routing_number') == newRoutingNum ) {
//			var resultAcctType = searchresult.getValue('custrecord_pp_ach_transaction_code');
//			if(((newAccountType == 1 || newAccountType == 3) && resultAcctType == 7) || ((newAccountType == 2 || newAccountType == 4) && resultAcctType == 8)) {
//				piracle.id = searchresult.getId();
//				piracle.accountType = searchresult.getValue('custrecord_pp_ach_transaction_code');
//				piracle.accountNumb = searchresult.getValue('custrecord_pp_ach_account_number');
//				piracle.routingNUmb = searchresult.getValue('custrecord_pp_ach_routing_number');
//				return piracle;
//			}
//		}
//	}
//	piracle = null;
//	return piracle;
//}
// Create a Piracle Pay record and attach to the Shareholder (customer) record.
//function createPiraclePayACHRecord(lotFields) {
//	var ppayObj = {};
//	var myDate = new Date();
//	var startTime = myDate.getTime();
//	var sHolderRec = nlapiLoadRecord('customer', lotFields.shareholder); // TODO : Can this be rewritten? Also how to test this?
//	var myDate = new Date();
//	var endTime = myDate.getTime();
//	nlapiLogExecution('ERROR', 'ACQ_LOT_DA_Library.createPiraclePayACHRecord run time: ' + (endTime-startTime));
//	var ppRec = nlapiCreateRecord('customrecord_pp_ach_account');
//	ppRec.setFieldValue('name', sHolderRec.getFieldValue('name') || sHolderRec.getFieldValue('nameorig'));
//	ppRec.setFieldValue('custrecord_pp_ach_entity', lotFields.shareholder);
//	ppRec.setFieldValue('custrecord_pp_ach_account_number', lotFields.bankAccount);
//	ppRec.setFieldValue('custrecord_pp_ach_routing_number', lotFields.bankabaRouting);
//	var bankType = lotFields.bankAcctType;
//	if(bankType == 1 || bankType == 3) { // 1: Checking  3: Commercial Checking
//		ppRec.setFieldValue('custrecord_pp_ach_transaction_code', 7);
//	} else if (bankType == 2 || bankType == 4) { // 2: Savings  4: Commercial Savings
//		ppRec.setFieldValue('custrecord_pp_ach_transaction_code', 8);
//	}
//	ppRec.setFieldValue('custrecord_pp_ach_is_primary', "T");
//	ppRec.setFieldValue('custrecord_pp_ach_sec_code', 4);//CCD=1;CTX=2;IAT=3;PPD=4;EDI=5;
//	try {
//		ppayObj.id = nlapiSubmitRecord(ppRec);
//	} catch (e) {
//		var err = e;
//		msg.setStatusError();
//		msg.addMessage('Problem submitting the Piracle ACH record. ' + e.message);
//		ppayObj.msg = msg;
//		nlapiLogExecution('DEBUG', 'Submit Piracle ACH Record', err);
//        return ppayObj;
//	}
//	sHolderRec.setFieldValue("custentity_pp_ach_enabled", "T");
//	sHolderRec.setFieldValue("custentity_pp_ach_account_number", lotFields.bankAccount);
//	sHolderRec.setFieldValue("custentity_pp_ach_deposit_withdrawal", 1);  //Deposit = 1; Withdrawal = 2;
//	try {
//		ppayObj.sholder = nlapiSubmitRecord(sHolderRec);
//	} catch (e) {
//		var err = e;
//		msg.setStatusError();
//		msg.addMessage('Problem attaching the Piracle ACH record to the Shareholder. ' + e.message);
//		ppayObj.msg = msg;
//		nlapiLogExecution('DEBUG', 'Submit Piracle ACH Record FAILED', JSON.stringify(err));
//	}
//	return ppayObj;
//}

function determineHashExist(hashNumber) {
	var hashExist = false;
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'anyof', '@NONE@');
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('name');
	var searchresults = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
	for ( var i = 0; searchresults != null && i < searchresults.length; i++ ) {
            var searchresult = searchresults[i];
            var hashNumberSearch = searchresult.getValue('name');
            if(hashNumberSearch.trim() == hashNumber.trim()) {
            	hashExist = true;
            	break;
			}
	}
	return hashExist;
}

function createEmailbody(templateID, recType, recId) {
	var body = nlapiMergeRecord(275, recType, recId).getValue(); //290 is the tempalate in PRODUCTION
	return body;
}


function searchACHBankName(bankabaRouting) {
	if(bankabaRouting != null && bankabaRouting != '') {
		bankabaRouting = bankabaRouting.toString();
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord162', null, 'is', bankabaRouting);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord162');
		columns[1] = new nlobjSearchColumn('custrecord168');
		columns[2] = new nlobjSearchColumn('custrecord171');
		try{
			return nlapiSearchRecord('customrecord416', null, filters, columns);
		} catch(e) {
			var err = e;
			nlapiLogExecution('DEBUG', searchACHBankName(lotFields), JSON.stringify(err));
			return
		}
	} 
	return;
}

function determineABAorSWIFT(abaSwiftNum) {
	// This function test to see if the number is 9 digits.
	var pattern = /[0-9]{9}/g;
	return pattern.test(abaSwiftNum);
}

function searchWireBankName(bankabaRouting) {
	if(bankabaRouting != null && bankabaRouting != '') {
		bankabaRouting = bankabaRouting.toString();
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord153', null, 'is', bankabaRouting);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord153');
		columns[1] = new nlobjSearchColumn('custrecord155');
		columns[2] = new nlobjSearchColumn('custrecord156');
		try {
			return nlapiSearchRecord('customrecord415', null, filters, columns);
		} catch(e) {
			var err = e;
			nlapiLogExecution('DEBUG', searchWireBankName(lotFields), JSON.stringify(err));
			return;
		}
	}
	return;
}

function searchRelatedCerts(exRecID) {
//	 	SEARCH LOT FOR ATTACHED CERTIFICATES.
//	 	IS THIS SEARCH EVEN NEEDED, CAN'T WE JUST LOOP THRU THE EXCHANGE RECORD AND CHECK.
		var certSearchResults = new Array();
		var certSearchFilters = new Array();
		var certSearchColumns = new Array();
//		DO THE SEARCH FOR ASSOCIATED CERTIFICATE RECORDS HERE
		certSearchFilters[0] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot',null,'is',exRecID);
		certSearchFilters[1] = new nlobjSearchFilter('isinactive',null,'is','F');	
		// have commented this out and added to the columns so that I can separate out the error messages to show.
//		certSearchFilters[2] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_lotcestatus', null, 'is', 5);
		
		certSearchColumns[0] = new nlobjSearchColumn('internalid',null,null);
		certSearchColumns[1] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certnumber',null);
		certSearchColumns[2] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certtype',null);
		certSearchColumns[3] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certdesc',null);
		certSearchColumns[4] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null);
		certSearchColumns[5] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment',null);
		certSearchColumns[6] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_lotcestatus',null);
		certSearchColumns[7] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_currencytyp',null);
		
		return nlapiSearchRecord('customrecord_acq_lot_cert_entry',null,certSearchFilters,certSearchColumns);
}

function removeHashRecordSetInactive(type, hashRecID, exRecID, dateTime) {
	nlapiLogExecution('DEBUG', 'attachExchangeRecordtoHash', 'hashRecID: '+hashRecID);
	var exchangeRecords = searchExchangeRecordsThatUseHash(hashRecID);
	var exchangeRecIDs = [];
	var userID = nlapiGetContext().getUser();
	for (var hLoop = 0; exchangeRecords != null && hLoop < exchangeRecords.length; hLoop++ ) {
		var exchangeRecord = exchangeRecords[hLoop];
		var fldNames = ['custrecord_acq_loth_zzz_zzz_exchangehash', 'custrecord_acq_loth_zzz_zzz_identcode'];
		var fldValues = [null, null];
		nlapiSubmitField('customrecord_acq_lot', exchangeRecord.id, fldNames, fldValues);
		exchangeRecIDs.push(exchangeRecord.id);	
	}
		// Load the Hash Record and set to inactive and delete fields.
		var hashRec = nlapiLoadRecord('customrecord_acq_exchange_hash', hashRecID);
		hashRec.setFieldValue('isinactive', 'T');
		// Create some logging notes to go in the log details field on the exchange hash record
		var hashLogMsg = createLogMessage(hashRec, exchangeRecord.id, userID, dateTime);
		var hashLog = hashRec.getFieldValue('custrecord_acq_hash_log_details');
		if(hashLog != null && hashLog != '') {
			hashRec.setFieldValue('custrecord_acq_hash_log_details', hashLog + '\n' + hashLogMsg);
		} else {
			hashRec.setFieldValue('custrecord_acq_hash_log_details', hashLogMsg);
		}
		// Leave the following line commented out, this will leave the deal set on an exchange hash to make sure the hash does not get re-used.
//		hashRec.setFieldValue('custrecord_acq_hash_deal_link', null);
		hashRec.setFieldValue('custrecord_acq_hash_exch_email', null);
		hashRec.setFieldValue('custrecord_acq_hash_contact', null);
	try {
		var hashID = nlapiSubmitRecord(hashRec);
		nlapiLogExecution('DEBUG', 'nlapiSubmitRecord(hashRec)', 'Changed Hash Record: ' + hashID);
	} catch (e) {
		nlapiLogExecution('DEBUG', 'attachExchangeRecordtoHash()', 'Error');
	}
	return exchangeRecIDs;
}
// Search all exchange records that use an existing hash, so they can also be updated.
function searchExchangeRecordsThatUseHash(hashRecID) {
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_exchangehash', null, 'anyof', hashRecID);
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_exchangehash');
	columns[1] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_identcode');
	var exchangeRecords = nlapiSearchRecord('customrecord_acq_lot', null, filters, columns );
	return exchangeRecords;
}
function createLogMessage(hashRec, exchangeRecordID, userID, dateTime) {
	var userName = getUserName(userID);
	var hashLogMsg = dateTime + ' - by user: ' + userName + ' - ' + 'This hash was removed from Exchange Record ID #' + exchangeRecordID + ' and set to inactive.\nDO NOT REUSE THIS HASH NUMBER.\n';
	hashLogMsg += dateTime + ' - by user: ' + userName + ' - "Exchange Records Email" removed value was:' + hashRec.getFieldValue('custrecord_acq_hash_exch_email') + '\n';
	hashLogMsg += dateTime + ' - by user: ' + userName + ' - "Exchange Records Contact" removed was' + hashRec.getFieldText('custrecord_acq_hash_contact') + '\n';
	return hashLogMsg;
}
function searchExchangeRecordsThatMatchDealandContact(exRecID) {
	var fields = ['custrecord_acq_loth_zzz_zzz_deal', 'custrecord_acq_loth_zzz_zzz_contact', 'custrecord_acq_loth_1_src_shrhldemail'];
	var exchangeRec = nlapiLookupField('customrecord_acq_lot', exRecID, fields);
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal', null, 'anyof', exchangeRec.custrecord_acq_loth_zzz_zzz_deal);
	filters[1] = new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_contact', null, 'anyof', exchangeRec.custrecord_acq_loth_zzz_zzz_contact);
//	filters[2] = new nlobjSearchFilter('custrecord_acq_loth_1_src_shrhldemail', null, 'anyof', exchangeRec.custrecord_acq_loth_1_src_shrhldemail); // This line should only be used in dev
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal');
	columns[1] = new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldemail');
	columns[2] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_contact');
	var exchangeRecordswithHash = nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
	// Loop through the search results and put the exchange record ids in an array
	var exchangeRecWithHashIDs = [];
	for (var hLoop = 0; exchangeRecordswithHash != null && hLoop < exchangeRecordswithHash.length; hLoop++ ) {
		var exchangeRecord = exchangeRecordswithHash[hLoop];
		exchangeRecWithHashIDs.push(exchangeRecord.id);	
	}
	// this line will return an array of exchange record ids that have a deal and contact that match the current exchange record from which the button was pushed.
	return exchangeRecWithHashIDs;
}
function getUserName(userID) {
	var userName = nlapiLookupField('employee', userID, 'entityid'); 
	return userName;
}
function searchCreditMemosFromExRec(exRecId) {
	var filters = [];
	if(exRecId != null && exRecId != '') {
		filters.push(new nlobjSearchFilter('custbody_acq_lot_createdfrom_exchrec', null, 'is', exRecId));
	}
	var columns = [];
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('tranid'));
	return nlapiSearchRecord('creditmemo', null, filters, columns );
}



/*
 * Utility and data methods for the Payment Dashboard
 * 
 */

function getPaymentDashboardRecords(page, post){
		var searchObject = {},
			searchResultSet = {},
			searchResults = [],
			searchFilters = null,
			lotid = post['lotid'] || -1,
			searchObjectErr = '',
			block = 75; // Can grab around 98 of these before run out of governance in Suitelet
		var totalLength = 0;

		//Validate our start and end values
		start = ((page - 1) * block);
		end = page * block;
        // nlapiLogExecution("DEBUG", Scriptname,  "getPaymentDashboardRecords(page, post) " );
		
		try{

            if ( lotid && lotid > 0 ) {
              searchFilters = [];
              searchFilters.push(new nlobjSearchFilter('id', null, 'equalto', lotid));
              searchFilters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_shareholder', null, 'noneof', "@NONE@"));
              searchFilters.push(new nlobjSearchFilter('status', 'custrecord_acq_loth_related_trans', 'noneof', ["CustCred:B"]));
            } 
            else {
              searchFilters = getSearchFiltersNew(post);
            }

			var currencyFilterValue = null;
			for (var index in post){
				value = post[index];				
				if(index.indexOf('currency') >= 0 && value && value != ' '){ currencyFilterValue = value; }
			}
			if (currencyFilterValue) {
				var currencyColumns = [];
				currencyColumns.push(new nlobjSearchColumn('internalid' ,null ,"group"));
				var searchCurrencyObject = nlapiCreateSearch('customrecord_acq_lot', searchFilters, currencyColumns);
				searchCurrencyObject.addFilter(new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_currencytyp', 'custrecord_acq_lotce_zzz_zzz_parentlot', 'anyof', [currencyFilterValue]));
				searchCurrencyResultSet = searchCurrencyObject.runSearch();
				searchCurrencyResults = searchCurrencyResultSet.getResults(0, 1000);
				var currencyFilterIdList = [];
				for (ix in searchCurrencyResults) { currencyFilterIdList.push( searchCurrencyResults[ix].getValue("internalid" ,null ,"group") ); }
	            searchFilters = [];
	            searchFilters.push(['internalid', 'anyof', currencyFilterIdList ]);
			}
          
			searchObject = nlapiCreateSearch('customrecord_acq_lot', searchFilters, getSearchColumns());
			searchResultSet = searchObject.runSearch();

			totalLength = searchResultSet.getResults(0, 1000).length;
			searchResults = searchResultSet.getResults(start, end);
		}
		catch(err){
			deSearchObjectErr = err.toString();
			nlapiLogExecution('ERROR', 'ERROR SEARCHING FOR RECORDS', deSearchObjectErr);
		}
		
		return { results: searchResults, err: searchObjectErr, block: block, length: totalLength };
}




//==================================================================================================================================================================
//==================================================================================================================================================================
function getResultsProcessPaymentStatuses(exrecs){
//	  nlapiLogExecution('DEBUG', 'PROD support', "getResultsProcessPaymentStatuses  exrecs.length: " + exrecs.length + "" + "");
//	  nlapiLogExecution('DEBUG', 'PROD support', "getResultsProcessPaymentStatuses  exrecs: " + JSON.stringify(exrecs) + "" + "");
	var searchObject = {},
		searchResultSet = {},
		searchResults = [],
		results = {},
		searchObjectErr = '',
		filterExpression = [],
		columns = [new nlobjSearchColumn('custrecord_process_status'), new nlobjSearchColumn('custrecord_processpayment_exrecid'), new nlobjSearchColumn('custrecord_process_error')],
		exrecids = [],
		start = 0,
		end = 1000;
	
	function getExrecIDsFilter(exrecs){
	  var arr = [];
	  //nlapiLogExecution('DEBUG', 'PROD support', "getExrecIDsFilter  exrecs: " + JSON.stringify(exrecs) + "" + "");

	  for(var i=0; i<exrecs.length; i++){
		if (i>0) { arr.push('or'); }
	    arr.push(['custrecord_processpayment_exrecid', 'equalto', exrecs[i].getId()]);
	  }

//	  nlapiLogExecution('DEBUG', 'PROD support', "arr: " + JSON.stringify(arr) + "" + "");

	  return arr;
	}
		
	function getStatusFilterArray(){
	  return [['custrecord_process_status', 'is', 'QUEUED'], 'or', ['custrecord_process_status', 'is', 'PROCESSING'], 'or', ['custrecord_process_status', 'is', 'FAILED']];
	}
	
	function getActiveRecordsOnly(){
		return [['isinactive', 'is', 'F']];
	}
	
	function getLast30DaysOnly(){
		var myDate = new Date();
		var ms = myDate.getTime() - (86400000 * 30);
		var thirtyDaysAgo = new Date(ms);
		var month = thirtyDaysAgo.getMonth()+1; 
		var str1 = month + "/" + thirtyDaysAgo.getDate() + "/" + thirtyDaysAgo.getFullYear() + " 12:00 am";
//		nlapiLogExecution('DEBUG', 'PROD support', "thirtyDaysAgo.tostring(): " + str1 + "" + "");
		return [['created', 'onorafter', str1 ]];
	}

	//  nlapiLogExecution('DEBUG', 'PROD support', "getResultsProcessPaymentStatuses 2  exrecs: " + JSON.stringify(exrecs) + "" + "");

	//  filterExpression.push(getExrecIDsFilter(exrecids));
	filterExpression.push(getExrecIDsFilter(exrecs));
	filterExpression.push('and');
	filterExpression.push(getStatusFilterArray());
	filterExpression.push('and');
	filterExpression.push(getActiveRecordsOnly());
//	filterExpression.push('and');
//	filterExpression.push(getLast30DaysOnly());
	
	//custrecord_processpayment_exrecid
	try{
		searchObject = nlapiCreateSearch('customrecord_paymentprocess', filterExpression, columns);
//		nlapiLogExecution('DEBUG', 'PROD support', "filterExpression: " + JSON.stringify(filterExpression) + "" + "");
		searchResultSet = searchObject.runSearch();
		searchResults = searchResultSet.getResults(start, end);
	}
	catch(err){
		deSearchObjectErr = err.toString();
	}
//	nlapiLogExecution('DEBUG', 'PROD support', "searchResults.length: " + searchResults.length + "" + "");
	if(searchResults && searchResults.length > 0){
		var id = null;
		
		for(var k=0; k<searchResults.length; k++){
			id = searchResults[k].getValue('custrecord_processpayment_exrecid');
			
			if(!results[id]){
				results[id] = {status: searchResults[k].getValue('custrecord_process_status'),
						error: searchResults[k].getValue('custrecord_process_error')};
			}
		}
	}
	
	return { results: results, err: searchObjectErr };	
}
//===========================================================================================================================================================
//===========================================================================================================================================================



//DEPRECATED: Remove
function buildPaymentDashboardTableFromTemplate(model){
	var html = '',
		modelTemplate = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DA_PaymentDashboard.html'),
		modelTemplateData = modelTemplate.getValue();
	
	html = parseDashboardTemplate(modelTemplateData, model);
	
	return html;
}

//DEPRECATED: Remove
function parseDashboardTemplate(template, model){
	
	var _parsedTemplateArray = template.split('=='),
		_parsedTemplateSection = _parsedTemplateArray[1],
		modeledSectionArray = [];
	
	for(var j=0; j<model.length; j++){
		modeledSectionArray.push(modelTemplateData(_parsedTemplateSection, model[j]));
	}
	
	_parsedTemplateArray[1] = modeledSectionArray.join('');
	
	return _parsedTemplateArray.join('');
}

function modelTemplateData(template, model){
	
	//TODO: Update template names
	var _modeledTemplateData = {
		custrecord_acq_loth_1_de2_shrhldaddr1: model.getText('custrecord_acq_loth_zzz_zzz_deal'),
		custrecord_acq_loth_1_de2_shrhldauth: model.getValue('custrecord_acq_loth_zzz_zzz_deal'),
		custrecord_acq_loth_0_de2_notes: model.getText('custrecord_acq_loth_zzz_zzz_shareholder'),
		custrecord_acq_loth_1_de2_shrhldcity: model.getValue('custrecord_acq_loth_zzz_zzz_shareholder'),
		custrecord_acq_loth_1_de2_shrhldname: model.getText('custrecord_acq_loth_4_de1_lotpaymethod'),
		custrecord_id: model.getId()
	};
	
	function replaceFields(match){
		
		//Loop through model indexes and see if there is a matching field for the template argument.
		for(var i in _modeledTemplateData){
			if(match.indexOf(i) > -1){
				return _modeledTemplateData[i];
			}
		}
		
		return 'no-data';
	}
	
	return template.replace(/{[a-zA-Z0-9_]*}/g, replaceFields);
}

function getSearchColumns(){
	
	var columns = [];
	
	//Exchange Record fields
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_4_de1_lotpaymethod'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_related_trans'));//Credit Memo
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_related_refund'));//Refund
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_payout_type'));//Payment Type
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_topaydate'));//Payment Date
	columns.push(new nlobjSearchColumn('custentity_acq_deal_financial_bank_compa','custrecord_acq_loth_zzz_zzz_deal'));
	columns.push(new nlobjSearchColumn('custrecord_suspense_reason'));
	columns.push(new nlobjSearchColumn('custrecord_payout_waive_fees' ,'custrecord_acq_lot_payout_type')); // ATP-1298
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_pri_pmt_waive_fees' ,'custrecord_acq_lot_priority_payment')); // ATP-1543

	columns.push(new nlobjSearchColumn('custrecord_exrec_waive_fees')); // ATP-1123 

	// ATP-242 Make Payments Dashboard Alpha PI-aware
	columns.push(new nlobjSearchColumn('custrecord_exrec_payment_instruction'));
	columns.push(new nlobjSearchColumn('custrecord_exrec_paymt_instr_sub'));
	columns.push(new nlobjSearchColumn('custrecord_pi_onhold','custrecord_exrec_payment_instruction'));
	columns.push(new nlobjSearchColumn('custrecord_pi_paymethod','custrecord_exrec_payment_instruction'));
	columns.push(new nlobjSearchColumn('custrecord_pisb_paymethod','custrecord_exrec_paymt_instr_sub'));

	//Fields for retrieving Piracle payments
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_5a_de1_bankacctnum'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_5a_de1_abaswiftnum'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_5a_de1_bankaccttype'));

	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_exrec_shrhldr_settle_curr'));
	columns.push(new nlobjSearchColumn('custrecord_acq_lot_payment_import_record'));

	return columns;
}


function getSearchFiltersNew(post){ 
	
	var type = post['inpt_custpage_paymentmethod'] || '';
	var filters = getDefaultSearchFilters(post);
	filters.push('and');
	var secondaryFilters = [];
	var payrollFilters = [];
	var nonPayrollFilters = [];
	
	payrollFilters.push(['custrecord_acq_loth_4_de1_lotpaymethod', 'is', '6']);
	payrollFilters.push('and');
	payrollFilters.push(['custrecord_acq_loth_related_trans', 'anyof', '@NONE@']);

	nonPayrollFilters.push(['custrecord_acq_loth_4_de1_lotpaymethod', 'noneof', '6']);

	if(!type || type == ' '){
		                                       secondaryFilters.push(payrollFilters);
		                                       secondaryFilters.push('or');
		                                       secondaryFilters.push(nonPayrollFilters);
		                                       filters.push(secondaryFilters);
	}
	else if(type.toLowerCase() == 'payroll'){  filters.push(payrollFilters);	  }
	else{		                               filters.push(nonPayrollFilters);	}
	
	return filters;
}



//High level function that retrieves filters based on Payment Method filter
function getSearchFilters(post){
	
	var type = post['inpt_custpage_paymentmethod'] || '',
		payrollFilters = getDefaultSearchFilters(post),
		nonPayrollFilters = getDefaultSearchFilters(post),
		filters = [];
	
	if(!type || type == ' '){
		filters.push(getPayrollFilters(payrollFilters));
		filters.push('or');
		filters.push(getNonPayrollFilters(nonPayrollFilters));
	}
	else if(type.toLowerCase() == 'payroll'){
		filters.push(getPayrollFilters(payrollFilters));
	}
	else{
		filters.push(getNonPayrollFilters(nonPayrollFilters));
	}
	
	return filters;
}

function getDefaultSearchFilters(post){

	var value = '',
		_filters = [],
		showall = false;
	
	_filters.push(['custrecord_acq_loth_zzz_zzz_acqstatus', 'is', 5]);
	_filters.push('and');
	_filters.push(['isinactive', 'is', 'F']);
	_filters.push('and');
    _filters.push(['custrecord_acq_loth_zzz_zzz_shareholder', 'noneof', '@NONE@']);
	_filters.push('and');
    _filters.push(['custrecord_acq_loth_related_trans.status' ,'noneof' ,["CustCred:B"]  ]);
//    new nlobjSearchFilter('status', 'custrecord_acq_loth_related_trans', 'noneof', ["CustCred:B"])

	for(var index in post){
		value = post[index];
		
		if(index.indexOf('paymenttype') >= 0 && value && value != ' '){
			_filters.push('and');
			_filters.push(['custrecord_acq_lot_payout_type', 'is', value]);
		}
		else if(index.indexOf('paymentmethod') >= 0 && value && value != ' '){
			_filters.push('and');
			//ATP-242
			_filters.push([
				[
					['custrecord_acq_loth_4_de1_lotpaymethod', 'is', value],
					'and', 
					['custrecord_exrec_paymt_instr_sub', 'is', '@NONE@'],
					'and',
					['custrecord_exrec_payment_instruction', 'is', '@NONE@']
				],
				'or',
				['custrecord_exrec_paymt_instr_sub.custrecord_pisb_paymethod', 'is', value],
				'or',
				['custrecord_exrec_payment_instruction.custrecord_pi_paymethod', 'is', value]
			]);
		}
		else if(index.indexOf('showall') >= 0){
			showall = true;
		}
		else if(index == 'custpage_deal' && value && value != ' '){
			_filters.push('and');
			_filters.push(['custrecord_acq_loth_zzz_zzz_deal', 'is', value]);
		}
	}

	if(!showall){
		_filters.push('and');
		_filters.push(['custrecord_acq_loth_related_refund', 'anyof', ["@NONE@"]]);
	}
	
	return _filters;
}

//Return standard filters plus Payroll Payment Method filter to get Payroll LOTs with Credit Memos
function getPayrollFilters(filters){

	filters.push('and');
	filters.push(['custrecord_acq_loth_4_de1_lotpaymethod', 'is', '6']);
	filters.push('and');
	filters.push(['custrecord_acq_loth_related_trans', 'anyof', '@NONE@']);
	filters.push('and');
    filters.push(['custrecord_acq_loth_zzz_zzz_shareholder', 'noneof', '@NONE@']);
	
	return filters;
}

//Return standard filters plus filter for all LOTs that do not match Payment Method of Payroll
function getNonPayrollFilters(filters){
	
	filters.push('and');
	filters.push(['custrecord_acq_loth_4_de1_lotpaymethod', 'noneof', '6']);
	filters.push('and');
    filters.push(['custrecord_acq_loth_zzz_zzz_shareholder', 'noneof', '@NONE@']);
	
	return filters;
}


//TODO: Remove once new filtereing has ben verified for accuracy
//Returns a list of nlobjSearchFilters that are populated with the specified filters from the post data
/*function getSearchFilters(post){
	var value = '',
		_filters = [],
		showall = false;
	
	_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_acqstatus', null, 'is', 5));
	
	for(var index in post){

		value = post[index];
		
		//TODO: Add sorting check and sorting functionality
		if(index.indexOf('login') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_login_status', null, 'is', value));
		}
		else if(index.indexOf('lockout') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_lockout_stas', null, 'is', value));
		}
		else if(index.indexOf('contactinformation') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_cntct_info', null, 'is', value));
		}
		else if(index.indexOf('verify') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_vrfy_hldngs', null, 'is', value));
		}
		else if(index.indexOf('taxinformation') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_tax_doc_stas', null, 'is', value));
		}
		else if(index.indexOf('paymentinformation') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_pay_info', null, 'is', value));
		}
		else if(index.indexOf('medallion') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_mdlin_status', null, 'is', value));
		}
		else if(index.indexOf('esigned') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_esign_status', null, 'is', value));
		}
		else if(index.indexOf('additionaldocuments') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_add_doc_stat', null, 'is', value));
		}
		else if(index.indexOf('paymenttype') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_lot_payout_type', null, 'is', value));
		}
		else if(index.indexOf('paymentmethod') >= 0 && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_4_de1_lotpaymethod', null, 'is', value));
		}
		else if(index.indexOf('showall') >= 0){
			showall = true;
		}
		else if(index == 'custpage_deal' && value && value != ' '){
			_filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal', null, 'is', value));
		}
	}
	
	if(!showall){
		_filters.push(new nlobjSearchFilter('custrecord_acq_loth_related_refund', null, 'anyof', '@NONE@'));
	}
	
	return _filters;
}*/
	
function getFilters(post){
	var filters = {};
	
	for(var index in filterSelectMap){
		filters[index] = post['inpt_custpage_' + index];
	}
	
	return filters;
}

function getFee(dealID, payMethodName){
	var dealResults = getDealForFee(dealID);
	
	if(dealResults != null && dealResults != '') {
		var deal = dealResults[0],
			fee = 0.00;
		
		switch (payMethodName) {
			case "ach":
				fee = deal.getValue('custentity_acq_deal_lotach') || null;
				break;
			case "domestic_check":
				fee = deal.getValue('custentity_qx_acq_deal_domesticcheck') || null;
				break;
			case "international_check":  
				fee = deal.getValue('custentity_qx_acq_deal_internationalchec') || null;
				break;
			case "domestic_wire_to_brokerage":
		    case "domestic_wire_to_bank":
			case "domestic_wire":
				fee = deal.getValue('custentity_qx_acq_deal_domesticwire') || null;
				break;
			case "international_wire_to_brokerage":
		    case "international_wire_to_bank":
			case "international_wire":
				fee = deal.getValue('custentity_qx_acq_deal_internationalwire') || null;
				break;
//			case "aes_ach":
//				fee = deal.getValue('custentity_qx_acq_deal_aes_ach') || null;
//				break;
//			case "aes_domestic_check":
//				fee = deal.getValue('custentity_qx_acq_deal_aes_domestic_chck') || null;
//				break;
//			case "aes_international_check":
//				fee = deal.getValue('custentity_qx_acq_deal_aes_intl_check') || null;
//				break;
//			case "aes_domestic_wire":
//				fee = deal.getValue('custentity_qx_acq_deal_aes_domestic_wire') || null;
//				break;
//			case "aes_international_wire":
//				fee = deal.getValue('custentity_qx_acq_deal_aes_intl_wire') || null;
//				break;
		}
		
		if(fee == '.00') {
			fee = '0.00';
		}
		
		return fee;
	}
}

function getDealForFee(dealID){
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('internalid',null,'is',dealID));
		var columns = [];
		columns.push(new nlobjSearchColumn('custentity_acq_deal_lotach'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_domesticcheck'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_domesticwire'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_internationalchec'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_internationalwire'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_wirefeeswaived'));
		//Added in AES fee columns for page load
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_ach'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_domestic_wire'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_intl_wire'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_domestic_chck'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_intl_check'));
		
		return nlapiSearchRecord('customer', null, filters, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchExchangeRecords() FAILED', JSON.stringify(err));
	}
	return null;
}

/*
 * 
 * Filters for Payment Dashboard
 * 
 */
var filters = {
		'login': [{value: '', key: ''}],
		'lockout': [{value: '', key: ''}],
		'verifyholdings': [{value: '', key: ''}],
		'contactinformation': [{value: '', key: ''}],
		'taxinformation': [{value: '', key: ''}],
		'paymentinformation': [{value: '', key: ''}],
		'medallionguarantee': [{value: '', key: ''}],
		'esigned': [{value: '', key: ''}],
		'additionaldocuments': [{value: '', key: ''}],
		'finalfunding': [{value: '', key: ''}],
		'reviewcomplete': [{value: '', key: ''}],
		'paymenttype': [{value: '', key: ''}],
		'paymentmethod': [{value: '', key: ''}],
		'currency': [{value: '', key: ''}]
};

var filterSelectMap = {
		'login': 'Log In',
		'lockout': 'Lock Out',
		'verifyholdings': 'Verify Holdings',
		'contactinformation': 'Contact Information',
		'taxinformation': 'Tax Information',
		'paymentinformation': 'Payment Information',
		'medallionguarantee': 'Medallion Guarantee',
		'esigned': 'E-Signed',
		'additionaldocuments': 'Additional Documents Required',
		'finalfunding': 'Final Funding',
		'reviewcomplete': 'Review Complete',
		'paymenttype': 'Payment Type',
		'paymentmethod': 'Payment Method',
		'currency': 'Currency',
		'showall': 'Show All'
};

function loadDashboardFilters(){
	/*getFiltersFromList('customlist_acq_login_status', 'login');
	getFiltersFromList('customlist_acq_lockout_status', 'lockout');
	getFiltersFromList('customlist_acq_verify_holdings', 'verifyholdings');
	getFiltersFromList('customlist_acq_tax_info_status', 'taxinformation');
	getFiltersFromList('customlist_acq_pay_info_status', 'paymentinformation');
	getFiltersFromList('customlist_acq_medallion_status', 'medallionguarantee');*/ 
	
	getFiltersFromList('customrecord_payment_type', 'paymenttype'); // ATP-1298
	getFiltersFromList('customlist_acq_lot_payment_method', 'paymentmethod');
	getFiltersFromList('currency', 'currency');
}

function getFiltersFromList(filterID, filter){
	var _filters = [ ['isinactive' ,'is' ,false ] ];
	var _columns = [new nlobjSearchColumn('name'), new nlobjSearchColumn('internalid') ,new nlobjSearchColumn('isinactive')  ]
	if (filter == 'currency') { _columns.push(new nlobjSearchColumn('symbol')); }
	results = nlapiSearchRecord(filterID, null, _filters, _columns);
		
	for(var i=0; i<results.length; i++){
		if (filter == 'currency') {
			var symbol = parseInt(  results[i].getValue('symbol').toString().trim()  );
			if(isNaN(symbol)){ filters[filter].push({ value:results[i].getValue('internalid') ,key:results[i].getValue('name') }); }
		}
		else { filters[filter].push({ value:results[i].getValue('internalid') ,key:results[i].getValue('name') }); }
	}
}

function renderFilter(form, filter, selected){
	
	if(filter == 'showall'){
		form.addField('custpage_' + filter, 'checkbox', filterSelectMap[filter], null, 'filtersgroup');
		
		return;
	}
	var options = filters[filter];
	
	if(!options){ return null; }
		
	//Generate select with appropriate name and id
	var select = form.addField('custpage_' + filter, 'select', filterSelectMap[filter], null, 'filtersgroup');

	//Generate options
	for(var i=0; i<options.length; i++){
		select.addSelectOption(options[i].value,options[i].key);
	}
}


/*
 * ProcessPayment search and validation code 
 */
function getCurrentProcessPayments(){
	var filters = [new nlobjSearchFilter('custrecord_processpayment_status', null, 'is', 'SUCCESS')],
		columns = [];
	nlapiSearchRecord('customrecord_acq_lot_processpayment', null, filters, columns);
}

/*
 * 
 * Base template code
 * 
 */

function renderResultsTable(results, statuses, isSingle, page, blockSize, resultsLength){
	
	var buttons = ['<div class="dashboard-button-container" style="margin-top:5px;">',
		               '<input type="button" value="APPROVE SELECTED" class="btn btn-sm btn-default btn-control btn-filter approve-selected-qm" />', //AF
		               '<input type="button" value="DUMMY BUTTON" class="btn btn-sm btn-default btn-control btn-filter dummy-button" style="display:none;" />', //AF
		               '<input type="button" value="PREVIOUS PAGE" class="btn btn-sm btn-default btn-control btn-filter previous-page" />',
		               '<input type="button" value="NEXT PAGE" class="btn btn-sm btn-default btn-control btn-filter next-page" />',
		               '<div id="divSpinner" style="display:none;margin-left:200px;"><i class="fa fa-spinner fa-spin" style="font-size:24px;color:red;"></i></div>',
	               '</div>'];

	var pageNumber;
	if(results.length != 0) {
		pageNumber = ['<div style="text-align:right">',
	            	'Page ' + page + ' showing results ' + ((page-1) * blockSize + 1) + '-' + ((page-1) * blockSize + results.length) + ' of ' + (resultsLength >= 1000 ? '1000+' : resultsLength),
                	'</div>'];
	}	
	else {
		pageNumber = ['<div style="text-align:right">', 'Page ' + page + ' showing 0 results', '</div>'];
	}
	
	var fullViewButton = ['<div class="dashboard-button-container">',
	                      	'<a class="btn btn-sm btn-default btn-control btn-filter view-dashboard-full" href="'+  nlapiResolveURL('SUITELET', 'customscript_acq_lot_da_approv_list_s', 'customdeploy_acq_lot_da_approv_list_s', false) +'">VIEW DASHBOARD</a>',
	                      '</div>'];
	
	var tableHtml = ['<table class="table table-striped table-condensed" id="payment-dashboard">',
	                 	'<thead>',
	                 		'<tr>',
	                 			'<th>',
	                 				'ID #',
	                 			'</th>',
	                 			'<th>',
	                 				'DEAL',
	                 			'</th>',
	                 			'<th>',
	                 				'BANK',
	                 			'</th>',
	                 			'<th>',
	                 				'SHAREHOLDER',
	                 			'</th>',
	                 			'<th>',
	                 		        'PAYMENT METHOD',
                 			    '</th>',
                 			    '<th>',
                 			    	'PAYMENT TYPE',
                 			    '</th>',
                 			    '<th>',
     				    			'SH SETL CURRENCY',
     				    		'</th>',
                 			    '<th>',
             				    	'CURRENCY',
             				    '</th>',
             				    '<th style="text-align:right;">',
                 					'PAYMENT AMOUNT',
                 				'</th>',
                 				'<th style="text-align:right;width:5em;">',
             						'FEE',
             					'</th>',
             					'<th>',
                 					'PAYMENT DATE',
                 				'</th>',
//	             				'<th>',
//	             					'PIRACLE RECORD',
//	             				'</th>',
	             				'<th>',
             						'CREDIT MEMO #',
	             				'</th>',
	             				'<th>',
		         					'CUSTOMER REFUND #',
		         				'</th>',
			     				'<th>',
				 					'APPROVE',
				 				'</th>',
				 				'<th>',
				 					'<label>',
				 						'<span>',
				 							'SELECT ALL',
				 						'</span>',
				 						'<input name="check_approval" type="checkbox" class="btn btn-xs btn-warning" id="approve-selected-all" value="1" />',
				 					'</label>',
				 				'</th>',
	                 		'</tr>',
	                 	'</thead>',
             		'<tbody>'];
	
	if(!isSingle){
		tableHtml = tableHtml.concat(buttons);
	}
	else{
		tableHtml = tableHtml.concat(fullViewButton);
	}
	tableHtml = tableHtml.concat(pageNumber);

	var tableRow = null,
		naText = 'N/A';
	
	var exrecID = '',
		dealID = '',
		sholderID = '',
		newAccountNum = '',
		newRoutingNum = '',
		newAccountType = '',
		payMethodName = '',
		cleanedPayMethodName = '',
		relatedCreditMemo = '',
		relatedCustomerRefund = '',
		bankName = '',
		currency = '???',
		fee = 0.00,
		gross = 0.00,
		approveButton = null,
		result = null;
	
	
	/*
	 * 
	 * Error Messge functionality forked from ACQ_LOT_DA_Library
	 * 
	 */	
//	var shareholders = [];
//	for (ix in results){
//		shareholders.push( results[ix].getValue('custrecord_acq_loth_zzz_zzz_shareholder') );
//	}
//	try {
//		var filters = [];
//		filters.push(new nlobjSearchFilter('internalid' ,null                       ,'anyof' ,shareholders ));
//		//filters.push(new nlobjSearchFilter('currency'   ,'customercurrencybalance'  ,'anyof' ,[objCurrency.id] ));
//		var columns = [];
//		columns.push( new nlobjSearchColumn('internalid') );
//		columns.push( new nlobjSearchColumn('currency' ,'customercurrencybalance' ) );
//		var shareholdersCurrencies = nlapiSearchRecord('customer' ,null ,filters ,columns);
//	} catch(e) { nlapiLogExecution('ERROR', 'search shareholders currencies FAILED', JSON.stringify(e)); }
//	
//	var ders = [];
//	for (ix in results){
//		ders.push( results[ix].getValue('custrecord_acq_lot_payment_import_record') );
//	}
//	try {
//		var filters = [];
//		filters.push(new nlobjSearchFilter('internalid' ,null                       ,'anyof' ,ders ));
//		var columns = [];
//		var col_internalid       = new nlobjSearchColumn('internalid' );
//		var col_glAccountName    = new nlobjSearchColumn('name'       ,'CUSTRECORD_PAY_IMPORT_GLACCOUNT');
//		var col_glAccountId      = new nlobjSearchColumn('internalid' ,'CUSTRECORD_PAY_IMPORT_GLACCOUNT');
//		var col_glAccountsName   = new nlobjSearchColumn('name'       ,'CUSTRECORD_PAY_IMPORT_GLACCOUNTS');
//		var col_glAccountsId     = new nlobjSearchColumn('internalid' ,'CUSTRECORD_PAY_IMPORT_GLACCOUNTS');
//		columns.push(col_internalid);
//		columns.push(col_glAccountName);
//		columns.push(col_glAccountId);
//		columns.push(col_glAccountsName);
//		columns.push(col_glAccountsId);
//		var derGlAccountsResults = nlapiSearchRecord('customrecord_payment_import_record' ,null ,filters ,columns);
//		nlapiLogExecution('DEBUG', "ATP-427", "derGlAccountsResults.length: " + derGlAccountsResults.length );
//
//		var derGlAccounts = [];
//		for (ix in derGlAccountsResults) {
//			var id = derGlAccountsResults[ix].getValue(col_glAccountsId);
//			
//			if (id) {			
//				var glAccount = {};
//				glAccount["derId"]        = derGlAccountsResults[ix].getValue(col_internalid);
//				glAccount["name"]         = derGlAccountsResults[ix].getValue(col_glAccountsName);
//				glAccount["internalid"]   = id;
//				var accountRec            = nlapiLoadRecord('account', id);		
//				glAccount["currency"]     = accountRec.getFieldValue("currency");
//				derGlAccounts.push(glAccount);
//			}
//			else{
//				var glAccount = {};
//				glAccount["derId"]        = derGlAccountsResults[ix].getValue(col_internalid);
//				glAccount["name"]         = derGlAccountsResults[ix].getValue(col_glAccountName);
//				glAccount["internalid"]   = derGlAccountsResults[ix].getValue(col_glAccountId);
//				var accountRec            = nlapiLoadRecord('account', glAccount["internalid"]);		
//				glAccount["currency"]     = accountRec.getFieldValue("currency");
//				derGlAccounts.push(glAccount);
//			}
//		}
//		nlapiLogExecution('DEBUG', "ATP-427", "derGlAccounts.length: " + derGlAccounts.length );
//	} catch(e) { nlapiLogExecution('ERROR', "search DER's currencies FAILED", JSON.stringify(e)); }


	for(var index in results){
		result = results[index];
		// ATP-242
		var formattedPayMethod;
		if(result.getText('custrecord_exrec_paymt_instr_sub')) {
			payMethodName = result.getText('custrecord_pisb_paymethod','custrecord_exrec_paymt_instr_sub') || 'Hold';
			formattedPayMethod = formatPayMethod('SUBMISSION', result.getText('custrecord_exrec_paymt_instr_sub'), payMethodName);
		} else if(result.getText('custrecord_exrec_payment_instruction')) {
			payMethodName = result.getText('custrecord_pi_paymethod','custrecord_exrec_payment_instruction') || naText;
			formattedPayMethod = formatPayMethod('INSTRUCTION', result.getText('custrecord_exrec_payment_instruction'), payMethodName);
		} else {
			payMethodName = result.getText('custrecord_acq_loth_4_de1_lotpaymethod') || null;
			formattedPayMethod = payMethodName;
		}
		cleanedPayMethodName = cleanPayMethodName(payMethodName) || '';

		exrecID = result.getId();
		dealID = result.getValue('custrecord_acq_loth_zzz_zzz_deal');
		sholderID = result.getValue('custrecord_acq_loth_zzz_zzz_shareholder');
		newAccountNum = result.getValue('custrecord_acq_loth_5a_de1_bankacctnum');
		newRoutingNum = result.getValue('custrecord_acq_loth_5a_de1_abaswiftnum');
		newAccountType = result.getValue('custrecord_acq_loth_5a_de1_bankaccttype');
		relatedCreditMemo = result.getValue('custrecord_acq_loth_related_trans');
		relatedCustomerRefund = result.getText('custrecord_acq_loth_related_refund');

		var suspenseReason = result.getText('custrecord_suspense_reason') || '';
		if (suspenseReason > '') { suspenseReason = 'SUSPENDED: ' + suspenseReason; }

		fee = getFee(dealID, cleanedPayMethodName);
		
		// SEARCH FOR EXISTING PIRACLE RECORD
//		var piracle = searchPiracleACHrecords(sholderID, newAccountNum, newRoutingNum, newAccountType);
		
	    // SEARCH FOR EXISTING CREDIT MEMOS TO SHOW IN CASE PAYMENT HAS ALREADY BEEN MADE
		//var cResults = searchCreditMemoforPayment(exrecID);
		var cResults = getCreditMemoById(relatedCreditMemo);
		var refund = getCustomerRefundById(relatedCustomerRefund);
		
		//Get certificates associated with current Exchange Record
		var certs = getExchangeRecordCertificates(exrecID);
		
//		var piraclePaymentLink = getPiraclePaymentLink(piracle) || naText,
		var piraclePaymentLink = naText;
		var creditMemoLink = getCreditMemoLink(cResults) || naText;
		var customerRefundLink = getCustomerRefundLink(refund) || naText;
		
		gross = getPaymentGross(certs);
		objCurrency = getCurrency(certs); // ATP-427
		currency = objCurrency.name; // ATP-427
		settlementCurrency = result.getText('custrecord_exrec_shrhldr_settle_curr');
		
		if (suspenseReason == "") {
			var semiColon = "";
//			if (certs && certs.length > 1) {
//				var certCurrency = certs[0].getValue('custrecord_acq_lotce_zzz_zzz_currencytyp');
//				for (cx in certs) {
//					if (certCurrency != certs[cx].getValue('custrecord_acq_lotce_zzz_zzz_currencytyp') ) { suspenseReason += semiColon + "All Certificates should be of the same currency type"; semiColon = ";  "; }
//				}
//			}
			
//			var currencyFound = false;
//			if (shareholdersCurrencies) {
//				for (sx in shareholdersCurrencies) {
//					var shRow = shareholdersCurrencies[sx];
//					if (sholderID == shRow.getValue('internalid')) {
//						if (shRow.getValue('currency' ,'customercurrencybalance') == objCurrency.name) { currencyFound = true; }
//					}
//				}
//			}
//			if (!currencyFound) { suspenseReason += semiColon + "Customer is missing currency '{0}'".replace("{0}",objCurrency.name); semiColon = ";  "; }
//			
//			//Check GL Accounts on DER to make sure there is an account matching this currency (Alex)
//			if (derGlAccounts) {
//				var derId = result.getValue('custrecord_acq_lot_payment_import_record');
//				nlapiLogExecution('DEBUG', "ATP-427", " Exrec derId: " + derId + ",    objCurrency.id: " + objCurrency.id);
//				var glCurrencyFound = false;
//			
//				for (ix in derGlAccounts) {
//					nlapiLogExecution('DEBUG', "ATP-427", "derGlAccounts[ix].derId: " + derGlAccounts[ix].derId
//							                            + ",     derGlAccounts[ix].currency: " + derGlAccounts[ix].currency);
//					if (derGlAccounts[ix].derId == derId  && derGlAccounts[ix].currency == objCurrency.id) { glCurrencyFound = true; break; }
//				}
//			
//				if (!glCurrencyFound) { suspenseReason += semiColon + "DER is missing GL Account with currency '{0}'".replace("{0}",objCurrency.name); semiColon = ";  "; }
//			
//			}
			
			
//			var derGlAccounts = [];
//			for (ix in derGlAccountsResults) {
//				var id = derGlAccountsResults[0].getValue(col_glAccountsId);
//				
//				if (id) {			
//					var glAccount = {};
//					glAccount["derId"]        = searchResults[ix].getValue(col_internalid);
//					glAccount["name"]         = searchResults[ix].getValue(col_glAccountsName);
//					glAccount["internalid"]   = id;
//					var accountRec            = nlapiLoadRecord('account', id);		
//					glAccount["currency"]     = accountRec.getFieldValue("currency");
//					glAccounts.push(glAccount);
//				}
//				else{
//					var glAccount = {};
//					glAccount["derId"]        = searchResults[ix].getValue(col_internalid);
//					glAccount["name"]         = searchResults[ix].getValue(col_glAccountName);
//					glAccount["internalid"]   = searchResults[ix].getValue(col_glAccountId);
//					var accountRec            = nlapiLoadRecord('account', glAccount["internalid"]);		
//					glAccount["currency"]     = accountRec.getFieldValue("currency");
//					glAccounts.push(glAccount);
//				}
			
			
			
			
			
			if (cleanedPayMethodName == "") { suspenseReason += semiColon + "Payment Method is missing"; semiColon = ";  "; }
			
			if (suspenseReason > '') { suspenseReason = 'ERROR(S): ' + suspenseReason; }
		}
		
		approveButton = renderApproveButton(piraclePaymentLink,
				creditMemoLink,
				customerRefundLink,
				naText,
				cleanedPayMethodName,
				statuses.results[exrecID],
				suspenseReason
		);
		//console.log("aft approveButton");
		
		// ATO-147
		var feeStyle = ' style="text-align:right;" ';
		if ( gross <= 0  &&  fee > 0 ) { feeStyle = ' style="text-align:right;text-decoration:line-through;" '; }
		// end ATO-147
//		// ATO-37
//		var payoutType_Escheated     = 22;
//		var payoutType_SentToBuyer   = 23;
//		var payoutType_DebtRepayment = 24;
//		var payoutType_VendorPaymentNoFees = 20; // ATP-1198
//		var payoutType = result.getValue('custrecord_acq_lot_payout_type');
//		nlapiLogExecution('DEBUG', 'ATO-37', "payoutType: " + payoutType );
//		if (   payoutType == payoutType_Escheated 
//			|| payoutType == payoutType_SentToBuyer 
//			|| payoutType == payoutType_DebtRepayment
//			|| payoutType == payoutType_VendorPaymentNoFees // ATP-1198
//			) 
//		   { feeStyle = ' style="text-decoration:line-through;" '; }
//		// end ATO-37

		// ATP-1298
		var payoutTypeWaiveFees = result.getValue('custrecord_payout_waive_fees' ,'custrecord_acq_lot_payout_type');
		var priorityPaymentTypeWaiveFees = result.getValue('custrecord_acq_lot_pri_pmt_waive_fees' ,'custrecord_acq_lot_priority_payment');
		if (payoutTypeWaiveFees == "T" || priorityPaymentTypeWaiveFees == "T") { feeStyle = ' style="text-align:right;text-decoration:line-through;" ';  }
		// end ATP-1298
		
		// ATP-1123
		if ( result.getValue('custrecord_exrec_waive_fees') >= "1" ) { feeStyle = ' style="text-align:right;text-decoration:line-through;" '; }
		// end ATP-1123
		
		tableRow = ['<tr{class}>',
		            	'<td>',
		            		getExchangeRecordLink(exrecID),
		            	'</td>',
		            	'<td>',
		            		getDealLink(result, naText),
		            	'</td>',
		            	'<td>',
		            		getBank(result, naText),
		            	'</td>',
		            	'<td>',
		            		getShareholder(result, naText),
		            	'</td>',
		            	'<td>',
		            		formattedPayMethod || naText,//result.getText('custrecord_acq_loth_4_de1_lotpaymethod') || naText,
		            	'</td>',
		            	'<td>',
		            		result.getText('custrecord_acq_lot_payout_type') || naText,
		            	'</td>',
		            	'<td>',
    		    			settlementCurrency, //ATP-427
    		    		'</td>',
		            	'<td>',
            		    	currency, //ATP-427
            		    '</td>',
            		    '<td class="gross" style="text-align:right" data-gross="'+ gross +'">',
	            	    	formatNumberWithCommas(gross),//Payment Gross
	            	    	'</td>',
	            	    '<td class="feeAmt" style="text-align:right;width:5em;">',
	            			'<span class="fee-container">',
	            				'<span class="fee"' + feeStyle + '>' + fee +'</span>', // ATO-147
	            				'<input class="feeamt_freetext" type="hidden" value="'+ fee +'" data-default-fee="'+ fee +'" />',
	            				'<i class="fa fa-pencil-square fa-3 hide"></i>',
	            			'</span>',
	            		'</td>',
		            	'<td>',
		            		result.getText('custrecord_acq_loth_zzz_zzz_topaydate') || naText,
		            	'</td>',
//		            	'<td>',
//		            		piraclePaymentLink,//Piracle Record
//		            	'</td>',
		            	'<td>',
		            		creditMemoLink,//Credit Memo #
		            	'</td>',
		            	'<td class="refund">',
		            		customerRefundLink,//Customer Refund #
		            	'</td>',
		            	'<td class="approval-column">',
		            		approveButton,
		            	'</td>',
		            	'<td>',
		            		getApproveCheckbox(approveButton),
		            	'</td>',
		        	'</tr>'
		            ];
		
		tableRow[0] = tableRow[0].replace('{class}', (approveButton.indexOf('ERROR') > -1 ? ' class="error"' : ''));
		
		tableHtml = tableHtml.concat(tableRow);
		
		tableRow = null;
		
		//Reset fields for next pass.
		exrecID = '',
		dealID = '',
		sholderID = '',
		newAccountNum = '',
		newRoutingNum = '',
		newAccounttype = '',
		payMethodName = '',
		cleanedPayMethodName = '',
		fee = 0.00,
		gross = 0.00;
		certs = null;
		result = null;
		approveButton = '';
	}
	
	tableHtml.push('</tbody></table>');
	
	if(!isSingle){
		tableHtml = tableHtml.concat(buttons);
	}
	
	return tableHtml.join('');
}


function getExchangeRecordCertificates(exchangerecordid){
	
	var filters = [],
		columns = [];
	
	filters.push(new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot',null,'is',exchangerecordid));
	columns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_currencytyp'));
	
	columns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment'));
	columns.push(new nlobjSearchColumn('symbol', 'custrecord_acq_lotce_zzz_zzz_currencytyp'));
	
	return nlapiSearchRecord('customrecord_acq_lot_cert_entry', null, filters, columns);
		
}


function getCurrency(certs) {
	var returnValue = {id:"1" ,name:"USD"};
	
	if(certs && certs.length > 0){
		returnValue.id   = certs[0].getValue('custrecord_acq_lotce_zzz_zzz_currencytyp');
		returnValue.name = certs[0].getText('custrecord_acq_lotce_zzz_zzz_currencytyp');
	}
	
	return returnValue;
}


//Sums the Certificates for a given Exchange Record and returns the value; this is a copy of getCertificateGross() in ACQ_LOT_DA_ApprovalStatusPage.
function getPaymentGross(certs){
	var total = 0,
		currentGross = 0;
	
	function formatTotal(gross){
		return total.toFixed(2);
	}
	
	if(!certs){ return formatTotal(0); }
	
	for(var i=0; i<certs.length; i++){
		currentGross = parseFloat(certs[i].getValue('custrecord_acq_lotce_zzz_zzz_payment'));
		
		var symbol = certs[i].getValue('symbol', 'custrecord_acq_lotce_zzz_zzz_currencytyp');
		if (isNaN(Number(symbol))) { // Ignore Stock Certs,  only currencies with alpha symbols are cash currencies, stocks have numeric symbols
			if(!isNaN(currentGross)){
				total += currentGross;
			}			
		}		
	}
	
	return formatTotal(total);
}

//Search for refund and generate link.
function getCustomerRefundLink(refund){
	var custRefundId = '',
		custRefundTranId = '',
		custRefundLink = '';
	
	if(refund && refund != ' ') {
		custRefundId = refund.getId();
		custRefundTranId = refund.getFieldValue('tranid');
		
		if(custRefundId != null && custRefundTranId != null && custRefundId != '' && custRefundTranId != '') {
			custRefundLink = '<a data-refundid="'+ custRefundId +'" href="'+nlapiResolveURL('RECORD', 'customerrefund', custRefundId, 'VIEW')+'" target="_blank">Refund '+ custRefundTranId +'</a>';
		}
	}
	
	return custRefundLink;
}

function formatNumberWithCommas(myNumber) { // thanks, Stack Overflow!
	return myNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//Return link to piracle payment if it exists.
//function getPiraclePaymentLink(piracle){
//	return piracle && piracle.id ? '<a href="'+nlapiResolveURL('RECORD', 'customrecord_pp_ach_account', piracle.id, 'VIEW')+'" target="_blank">Piracle '+ piracle.id +'</a>' : '';
//}

function getExchangeRecordLink(exrecID){
	//https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=474&deploy=1&txnid=6&txntype=customrecord_acq_lot&tran_id=6
	return '<a class="exrecid" href="'+nlapiResolveURL('RECORD', 'customrecord_acq_lot', exrecID, 'VIEW')+'" target="_blank" data-exrecid="'+ exrecID +'">Exchange Record:&nbsp;'+ exrecID +'</a>';
	//return '<a href="'+nlapiResolveURL('SUITELET', 474, 1)+'&txnid='+ exrecID +'&txntype=customrecord_acq_lot&tran_id='+ exrecID +'" target="_blank" data-exrecid="'+ exrecID +'">Exchange Record:&nbsp;'+ exrecID +'</a>';
}

//Search for any Credit Memos associatd with the Exchange Record.
function searchCreditMemoforPayment(exRecID) {
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('custbody_acq_lot_createdfrom_exchrec',null,'is',exRecID));
		var columns = [];
		columns.push(new nlobjSearchColumn('tranid'));
		
		return nlapiSearchRecord('creditmemo', null, filters, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchCreditMemoforPayment() FAILED', JSON.stringify(err));
	}
	return null;
}

//Returns the specified Credi Memo vis nlapiLoadRecord; cannot execute search for transaction by id.
function getCreditMemoById(creditMemoId){
	if(creditMemoId && creditMemoId != ' '){
		try {
			return nlapiLoadRecord('creditmemo', creditMemoId);
		} catch(e) {
			var err = e;
			nlapiLogExecution('ERROR', 'getCreditMemoById() FAILED', JSON.stringify(err));
		}
		return null;
	}
	
	return null;
}

//Returns the specified Credi Memo vis nlapiLoadRecord; cannot execute search for transaction by id.
function getCustomerRefundById(refundId){
	if(refundId && refundId != ' '){
		try {
			return nlapiLoadRecord('customerrefund', refundId);
		} catch(e) {
			var err = e;
			nlapiLogExecution('ERROR', 'getCustomerRefundById() FAILED', JSON.stringify(err));
		}
		return null;
	}
	
	return null;
}


//Search for Credit Memo and returnk link to it.
function getCreditMemoLink(record){
	var cMemoLink = '';
	
	if(record && record != '') {
		cMemoID = record.getId();
		cMemoTranID = record.getFieldValue('tranid');

		var lineItemCount = record.getLineItemCount('item'),
			lineItemAmount = 0;
		
		for(var i=0; i<lineItemCount; i++){
			lineItemAmount = record.getLineItemValue('item', 'amount', i+1); 
			if(lineItemAmount <= 0){
				feeOverride = lineItemAmount;
				break;
			}
		}
		
		if(cMemoID != null && cMemoTranID != null && cMemoID != '' && cMemoTranID != '') {
			cMemoLink = '<a href="'+nlapiResolveURL('RECORD', 'creditmemo', cMemoID, 'VIEW')+'" target="_blank">Credit Memo '+ cMemoTranID +'</a>';
		} else {
			cMemoLink = '';
		}
		
		return cMemoLink;
	}
}

function getBank(result, naText) {
	var x = JSON.parse(JSON.stringify(result));
	var y = JSON.stringify(x.columns.custentity_acq_deal_financial_bank_compa);
	if(typeof y != 'undefined') {
		var bankName = JSON.stringify(x.columns.custentity_acq_deal_financial_bank_compa.name);
		return bankName.substring(1, bankName.length-1);	
	}
	return naText;
}

function getDealLink(result, naText){
	var dealText = result.getText('custrecord_acq_loth_zzz_zzz_deal'),
		dealId = result.getValue('custrecord_acq_loth_zzz_zzz_deal');
	
	if(dealText){
		return '<a href="'+nlapiResolveURL('RECORD', 'customer', dealId, 'VIEW')+'" target="_blank">'+ dealText +'</a>';
	}
	
	return naText;
}

function getShareholder(result, naText){
	var shareholderText = result.getText('custrecord_acq_loth_zzz_zzz_shareholder'),
		shareholderId = result.getValue('custrecord_acq_loth_zzz_zzz_shareholder');
	
	if(shareholderText){
		return '<a href="'+nlapiResolveURL('RECORD', 'customer', shareholderId, 'VIEW')+'" target="_blank">'+ shareholderText +'</a>';
	}
	
	return naText;
}

function getApproveCheckbox(approveButton){
	
	if(!approveButton || approveButton.indexOf('void') != -1 || approveButton.indexOf('reprocess') != -1 || approveButton.indexOf('SUSPENDED') != -1){
		return '';
	}
	
	return approveButton.indexOf('button') != -1 ? '<input class="btn btn-xs btn-control btn-approve-selected" name="check_approval" type="checkbox" />' : '';
}

function getABAStatus(cmemo, exchangerecord){
	
	if(!cmemo || cmemo.length == 0 || !exchangerecord){
		return null;
	}
	
	var cMemoID = cmemo[0].getId(),
		newRoutingNum = exchangerecord.getValue('custrecord_acq_loth_5a_de1_abaswiftnum');
	
	var achVerifiedHTML = '';
	if(cMemoID != '' && cMemoID != null && newRoutingNum != null && newRoutingNum != '') {
		var abaVerifiedResults = searchACHBankName(newRoutingNum);
		var refResults = searchCustomerRefundforPayment(cMemoID);
		if(abaVerifiedResults != null && abaVerifiedResults.length > 0) {
			var achFedResult = abaVerifiedResults[0].getId();
			if(achFedResult != null && achFedResult != '') {
				achVerifiedHTML = '<span class="valid">VERIFIED!<span>';
			}
		} else {
			achVerifiedHTML = '<span class="invalid">NOT VERIFIED!<span>';
		}
	}
	
	return achVerifiedHTML;
}

function cleanPayMethodName(paymethod){
	if(!paymethod){ return null; }
	
	return paymethod.trim().replace(/[^a-z0-9A-Z\s]/g, '').replace(/\s/g, '_').toLowerCase();
}

function renderApproveButton(piraclePayment, creditMemo, customerRefund, naText, payMethod, status, suspenseReason){
	
	var button = '<button class="btn btn-xs btn-control approveBtn" type="submit"> Approve </button>',
		error = '<span class="approval-code">ERROR</span><span class="approval-error approval-status" data-error="{error}"><i class="fa fa-exclamation fa-3 error"></i></span>',
		approved = '<span class="approval-status">APPROVED</span>',
		reapprove = '<button class="btn btn-xs btn-control approveBtn" type="submit"> Reapprove </button><span class="approval-error approval-status" data-error="{error}"><i class="fa fa-exclamation fa-3 error"></i></span>',
		reprocess = '<button class="btn btn-xs btn-control reprocessBtn" type="submit"> Reprocess </button>',
		_void = '<button class="btn btn-xs btn-control voidBtn" type="submit">Void</button>',
		_status = '<span class="approval-status">{status}</status>',
		suspenseAlert = suspenseReason,
		errorArray = [],
		errorText = '';
	
	//Render error
	//nlapiLogExecution('DEBUG', 'PROD support', "status: " + status + "" + "");
	if (status && suspenseReason == "") {
//		var str1 = JSON.stringify(status);
//		nlapiLogExecution('DEBUG', 'renderApproveButton', "status: " + str1);
		if(status.status.toLowerCase() == 'failed'){
			errorArray = status.error.replace(/({|})/g,'').split('=');
			var errorText;
			if(errorArray[1] != null) {
				for(var i = 2; i < errorArray.length; i++) {
					errorArray[1] += '=' + errorArray[i];
				}
				errorText = errorArray[1];
			} else { 
				errorText = status.error; 
			}

			if(payMethod.toLowerCase().indexOf('payroll') == -1 && creditMemo != naText && customerRefund == naText){
				return reprocess.replace('{error}', errorText);
			}

			return reapprove.replace('{error}', errorText);
		}
		
		return _status.replace('{status}', status.status);
	}//No error so render varoius buttons
	else{

		if(suspenseReason != '') {
			return suspenseAlert;
		}
		
		//Render approve button for payroll
		if(payMethod && payMethod.toLowerCase().indexOf('payroll') != -1 && creditMemo != naText){
			return button;
		}
		
		//Render reprocess for those that have been voided
		if(payMethod && creditMemo != naText && customerRefund == naText){
			return reprocess.replace('{error}', '');
		}
		
		//Render buttons for ach cases
		if(payMethod && payMethod.toLowerCase().indexOf('ach') != -1){
			if(creditMemo == naText && customerRefund == naText){
				return button;
			}
			
			if(piraclePayment != naText && creditMemo != naText && customerRefund != naText){
				return _void;
			}
			
			return error.replace('{error}', '');
		}//Render buttons for non-ach/non-payroll
		else{
			if(creditMemo != naText && customerRefund != naText){
				return _void;
			}
			
			if(creditMemo == naText && customerRefund == naText){
				return button;
			}
			
			return error.replace('{error}', '');
		}
	}
}
// ATP-242
function formatPayMethod(typeFlag, recordId, payMethodName) {
	var recordType;
	if(typeFlag == 'INSTRUCTION') {
		recordType = 'customrecord_paymt_instr';
	} else {
		recordType = 'customrecord_paymt_instr_submission';
	}
	var recordURL = nlapiResolveURL('RECORD', recordType, recordId);
	return '<a href="' + recordURL + '">' + payMethodName + '</a>';

}

//ATP-103
function isTxnPeriodClosed(periodID) {
	var periodClosed = null;
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('internalid', null, 'is', periodID));
		var columns = [];
		columns.push(new nlobjSearchColumn('closed'));

		var searchResults = nlapiSearchRecord('accountingperiod', null, filters, columns);
		if (searchResults.length > 0) {
			periodClosed = searchResults[0].getValue('closed');
		}
		if (periodClosed === 'T') {
			return true;
		} else {
			return false;
		}
		return periodClosed;
	} catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'isTxnPeriodClosed() FAILED', JSON.stringify(err));
	}
	return null;
}