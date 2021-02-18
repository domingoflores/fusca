/**
 * @author durbano
 * Scott Streule - 4/16/18 - Removed hard coded URL and replaced with nlapiResolveURL() LINE #198
 */

var GOVERNANCELIMIT = 500;

// objects
var Code = 
{
    Valid: 'VALID',
    InvalidProRataSum: 'INVALID_PRO_RATA_NOT_1.0',
    ProRataNotFound: 'INVALID_PRO_RATA_MISSING',
    ValidationUnknown: 'UNKNOWN_VALIDATION',
    NegativeBalance: 'NEGATIVE_BALANCE_FOUND',
    NoShareholderData: 'NO_SHAREHOLDER_DATA',
    AccountNotFound: 'ACCOUNT_NOT_FOUND',
    ShareholderMissing: 'SHAREHOLDER_MISSING',
    cRdRNull: 'CR_DR_BOTH_NULL',
    NegativeAmountCalculated: 'NEGATIVE_AMOUNT_CALCULATED_FOR_POSITIVE_AMOUNT',
    PositiveAmountCalculated: 'POSTIVE_AMOUNT_CALCULATED_FOR_NEGATIVE_AMOUNT',
    NotAShareholder: 'SHAREHOLDER_NOT_OF_CATEGORY_SHAREHOLDER',
    NotACustomer: 'SHAREHOLDER_NOT_OF_TYPE_CUSTOMER',
    NotDealOrShareholder: 'SHAREHOLDER_NOT_OF_CATEGORY_SHAREHOLDER_OR_DEAL'
}

function Shareholder(shareholderId,lot,balance,proRata, proRataRecordId, createdFromCert)
{
    this.internalid = shareholderId;
    this.lot = lot;
    this.proRata = proRata;
    this.currentBalance = balance;
    this.newBalance = 0.00; // the currentBalance + newAmount
    this.newAmount = 0.00;    // this.newBalance - this.currentBalance
    this.proRataRecordId = proRataRecordId;
    this.createdFromCert = createdFromCert; // added for Subsequent Payment Creation process
}

function Account(accountId,accountName)
{
    this.accountId = accountId;
    this.accountName = accountName;
    this.errorCode = Code.ValidationUnknown;
    this.shareholders = null;
    this.currentBalance = 0.00;
}

var Loader = 
{
    InitAccount: function(accountId,accountName,tx,getShareholders)
    {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.Loader.InitAccount", "Initiating account");
        try {
            var account = new Account(accountId,accountName);
            
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.Loader.InitAccount", "getShareholders = " + getShareholders);
            if(getShareholders)
            {
                var shareholders = getShareholderData(accountId,accountName,tx);
                account.errorCode = Code.Valid;
                account.shareholders = shareholders;
                
                var currentBalance = 0.00;
                for(var i = 0; i < account.shareholders.length; i++)
                {
                    var sh = account.shareholders[i];
                    currentBalance += sh.currentBalance;
                }
                account.currentBalance = Math.round(currentBalance * 100) / 100;
                nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.Account", "currentBalance being set to " + account.currentBalance);
            }
            else
            {
                account.errorCode = Code.Valid;
            }
        } catch (e) {
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.Account", "error found = " + e);
            account.errorCode = e;
        }
        return account;
    }
}

// saved searches
function getTransactionBalances()
{
    var searchResults = nlapiSearchRecord('transaction','customsearch_escrow_account_tx_summary');
    return searchResults;
}

function getShareholderTransactionBalances()
{
    var searchResults = nlapiSearchRecord('customrecord18','customsearch_shareholder_acct_tx_summary');
    return searchResults;    
}

function getPendingAllocations(filter)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getPendingAllocations", "Entering method.");
    var filters = new Array();
    
    if(filter == 'allocation')
    {
        filters.push(new nlobjSearchFilter('custbody_esc_tx_status', null, 'isnot', 'ALLOCATED'));
        filters.push(new nlobjSearchFilter('custbody_esc_tx_status', null, 'isnot', 'RECONCILED'));
        filters.push(new nlobjSearchFilter('custbody_esc_tx_status', null, 'isnot', 'PENDING_RECONCILEMENT'));
        filters.push(new nlobjSearchFilter('custbody_esc_tx_status', null, 'isnot', 'PENDING_RELEASE'));
    }
    else if(filter == 'reconcilement')
    {
        filters.push(new nlobjSearchFilter('custbody_esc_tx_status', null, 'is','ALLOCATED'));
    }
    else if(filter == 'release')
    {
        filters.push(new nlobjSearchFilter('custbody_esc_tx_status', null, 'is', 'RECONCILED'));
    }
    else if(filter == 'runAllocator')
    {    // kick off the scheduler
        nlapiScheduleScript('customscript_process_sched_allocations','customdeploy_sched_allocation_handler3');
    }
        else if(filter == 'transfer')
    {
        filters.push(new nlobjSearchFilter('custbody1', null, 'anyof', [9]));
    }

    var searchResults = nlapiSearchRecord('transaction','customsearch_trans_ready_for_processing',filters);
    return searchResults;    
}

function getPendingActions()
{
    var searchResults = nlapiSearchRecord('transaction','customsearch_pending_transaction_actions');
    return searchResults;    
}

// searches
function getGlBalance(date,glAccount)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getGlBalance", "date = " + date);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getGlBalance", "glAccount = " + glAccount);

    var filters     = [new nlobjSearchFilter('trandate', null, 'onorbefore', date)];
        filters[1]     = new nlobjSearchFilter('account', null, 'is', glAccount);
    var columns     = [new nlobjSearchColumn('amount',null,'sum')];
    
    var searchResults = nlapiSearchRecord('transaction',null, filters, columns);     
    if(searchResults == null || searchResults.length == 0) return 0;
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getGlBalance", "searchResults.length = " + searchResults.length);
    var result = searchResults[0];
    
    var balance = result.getValue('amount',null,'sum');
    if(balance == null) balance = 0;
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getGlBalance", "balance = " + balance);
    return balance;    
}

function getShareholderBalance(date,deal,glAccount,txId,line)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderBalance", "Entering method.");
    var filters     = [new nlobjSearchFilter('custrecord65', null, 'onorbefore', date)];     // date - test = custrecord105
        filters[1]     = new nlobjSearchFilter('custrecord66', null, 'is', deal);                 // deal - test = custrecord106
        filters[2]     = new nlobjSearchFilter('custrecord_glaccount', null, 'is', glAccount); // acct - test = custrecord116
        filters[3]     = new nlobjSearchFilter('isinactive', null, 'is', 'F');                 // acct - test = custrecord116
    
    var columns        = [new nlobjSearchColumn('custrecord70',null,'sum')];                    // amount - prod = custrecord111
    if(txId != null && line != null)
    {    // this gives us the amount for this specific transaction
        filters[4] = new nlobjSearchFilter('custrecord_transaction_line', null, 'equalto', line);     // line - test = custrecord119
        filters[5] = new nlobjSearchFilter('custrecord_journal_id', null, 'is', txId);             // txid - test = custrecord114
    }
    
    var searchResults = nlapiSearchRecord('customrecord18',null, filters, columns);         // prod = customrecord_test_escrow_transactions
    
    if(searchResults == null || searchResults.length == 0) return 0;
    var result = searchResults[0];
    
    var balance = result.getValue('custrecord70',null,'sum');        // custrecord111
    if(balance == null || balance == '') balance = 0;
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderBalance", "balance = " + balance);
    return balance;
}

// helper functions
function compareBalances(transactionBalances, shareholderBalances)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.compareBalances", "Entering method.");
    // each search has the following fields
    // Deal, Account Type, GL Account, Last TX Date, Balance
    for (var i = 0; i < transactionBalances.length; i++)
    {
        var txBalResult = transactionBalances[i];
    }
}

function renderPendingAllocations(results,request) {
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.renderPendingAllocations", "Entering method.");

    var viewEntryUrl = nlapiResolveURL('TASKLINK','EDIT_TRAN_JOURNAL') + '&id=';  //'https://system.netsuite.com/app/accounting/transactions/journal.nl?id=';
    var viewGlActUrl = '/app/reporting/reportrunner.nl?reporttype=REGISTER&acctid=';
    var dealUrl         = '/app/common/entity/custjob.nl?id=';
    var filter = request.getParameter('filter');
    if(!filter || filter == null)
        filter == '';
    
    var list = nlapiCreateList('Pending Allocations',true);

    list.addColumn('number','text','Number','LEFT');
    list.addColumn('date','date','Date','LEFT');
    list.addColumn('deal','text','Deal','LEFT');
    list.addColumn('account','text','Account','LEFT');
    list.addColumn('memo','text','Memo','LEFT');
    list.addColumn('amount','currency','Amount','LEFT');
    list.addColumn('action','text','Action','LEFT');    
    
    for (var i = 0; results != null && i < results.length; i++) { // setup view url {
        var result = results[i];
        
        var hash = new Array();
        hash.internalid    = result.getId();
        hash.date         = result.getValue('trandate');
        hash.memo        = result.getValue('custbody4');
        hash.amount        = result.getValue('amount');
        
        hash.deal         = '<a href="' + dealUrl + result.getValue('custbody2') + '" target="_parent">' + result.getText('custbody2') + '</a>';
        hash.account    = '<a href="' + viewGlActUrl + result.getValue('internalid','account') + '" target="_parent">' + result.getText('account') + '</a>'; 
        hash.number        = '<a href="' + viewEntryUrl + result.getValue('internalid') + '" target="_parent">' + result.getValue('number') + '</a>';
        
        var cleared     = result.getValue('cleared');
        var type        = translateType(result.getValue('type'));
        var status        = result.getValue('custbody_esc_tx_status');
        var actinternalid = result.getValue('internalid','account');
        var line        = parseInt(result.getValue('line')) + 1;
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.renderPendingAllocations", "Account int id =" + actinternalid);        
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.renderPendingAllocations", "Escrow tx Status =" + status);
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.renderPendingAllocations", "Before hash.action");
        hash.action = handleActionLink(status,cleared,actinternalid,hash.internalid,type,result.getValue('number'),line,filter);
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.renderPendingAllocations", "After hash.action");
        list.addRow(hash);
    }
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.renderPendingAllocations", "END");
    return list;
}

function handleActionLink(status, cleared,actinternalid,internalid,type,transnum,line,filter)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.handleActionLink", "Entering method.");
    var portletUrl = nlapiResolveURL('SUITELET','customscript_allocation_action_handler','customdeploy_allocation_action_handler','FALSE');
    var reconcileUrl = nlapiResolveURL('TASKLINK','TRAN_RECONCILE',null,'FALSE') + '&acctid=';
    
    //if((status == 'NEW' || status == 'UPDATED') && cleared == 'F')
    //if(status == 'ALLOCATED' && cleared == 'F')                                                                // RE Tracker #404
    //    return '<a href="' + reconcileUrl + actinternalid + '&filter='+filter+'" target="_parent">Rec TX</a>';    // RE Tracker #404
    //else if((status == 'NEW' || status == 'UPDATED') && cleared == 'T')
    //else
    if(filter == 'transfer') {
        return '<a href="' + portletUrl + '&page=doTransfer&internalid=' + internalid + '">Transfer</a>';   
    } 
    else if(status == 'NEW' || status == 'UPDATED'){
        return '<a href="' + portletUrl + '&page=allocate&internalid=' + internalid + '&type=' + type + '&transnum=' + transnum + '&filter='+filter+'">Allocate</a>';
    }
    else if(status == 'MINOR_UPDATE') {
        return '<a href="' + portletUrl + '&page=update&internalid=' + internalid + '&filter='+filter+'">Update</a>';
    }
    else if(status == 'ALLOCATED') {
        return '<a href="' + portletUrl + '&page=reconcile&internalid=' + internalid + '&type=' + type + '&line=' + line + '&filter='+filter+'">Rec SH</a>';
    }
    else if(status == 'NEW_PENDING_ALLOCATION' || status == 'UPDATED_PENDING_ALLOCATION' || status == 'MINOR_UPDATE_PENDING_MINOR_UPDATE') {
        return 'Scheduled';
    }
    else if(status == 'PENDING_ALLOCATION' || status == 'PENDING_MINOR_UPDATE') {
        return 'Processing';
    }
    else if(status == 'RECONCILED') {
        return '<a href="' + portletUrl + '&page=RELEASE&internalid=' + internalid + '&type=' + type + '&line=' + line + '&filter='+filter+'">Release</a>';
    }
    else if(status == 'PENDING_VERIFY' || status == 'PENDING_RELEASE') {
        return 'Scheduled';
    }
    else {
        //return 'Unknown';
        throw 'Unknown status translation: ' + status;
    }
}

function translateType(rawtype) {
    switch(rawtype) {
        case 'Journal':
            return 'journalentry';
        case 'journal':
            return 'journalentry';
        default:
            return null;
    }
    return null;
}

function previousStatus(status)
{
    if(status == 'NEW_PENDING_ALLOCATION'){
        return 'NEW';
    }else if(status == 'UPDATED_PENDING_ALLOCATION'){
        return 'UPDATED';        
    }else if(status == 'MINOR_UPDATE_PENDING_MINOR_UPDATE'){
        return 'MINOR_UPDATE';
    } else {
        nlapiLogExecution("AUDIT", "SRSAllocation_ServerSideLibrary.previousStatus", "Unknown status to translate " + status);
        return 'UNKNOWN'; // unknown
    }
}

function nextStatus(status)
{
    if(status == 'NEW_PENDING_ALLOCATION'){
        return 'PENDING_ALLOCATION';
    }else if(status == 'UPDATED_PENDING_ALLOCATION'){
        return 'PENDING_ALLOCATION';
    }else if(status == 'MINOR_UPDATE_PENDING_MINOR_UPDATE'){
        return 'PENDING_MINOR_UPDATE';
    } else {
        nlapiLogExecution("AUDIT", "SRSAllocation_ServerSideLibrary.nextStatus", "Unknown status to translate " + status);
        return 'UNKNOWN'; // unknown
    }    
}

// major functions
function processTransaction(transid,recordType)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.processTransaction", "Entering method.");
    // load the tx
    var tx = nlapiLoadRecord(recordType,transid);
    var oldStatus = previousStatus(tx.getFieldValue('custbody_esc_tx_status'));
    var newStatus = nextStatus(tx.getFieldValue('custbody_esc_tx_status'));

    // update the record
    tx.setFieldValue('custbody_esc_tx_status',newStatus);
    nlapiSubmitRecord(tx,false,false);
    tx = nlapiLoadRecord(recordType,transid); // reload the record

    var success = false;
    if(newStatus == 'PENDING_ALLOCATION' ) {
        success = processPendingAllocation(tx);
    }
    else if(newStatus == 'PENDING_MINOR_UPDATE') {
        success = processPendingMinorUpdate(tx);
    }

    if(!success) {
        tx.setFieldValue('custbody_esc_tx_status',oldStatus);
        nlapiLogExecution('ERROR', 'processTransaction unsuccessful.', 'Rolling back to ' + oldStatus + ' status.');
    }
    else {
        //tx.setFieldValue('custbody_esc_tx_status','ALLOCATED'); // this will force a reconcilement between transaction and escrow transaction records 
        tx.setFieldValue('custbody_esc_tx_status','RECONCILED'); // formerly rec sh
    }

    nlapiSubmitRecord(tx,false,false);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.processTransaction", "COMPLETE");
}

function getEntityCategory(entityId)
{
    if(entityId == null || entityId == '') {
        return false;
    }
    
    try {
        var type = nlapiLookupField('customer', entityId, 'category');

        if(type == null) return false;
        if(type == 1) return 'Deal'; // 1 == deal
        if(type == 2 || type == '2') return 'Shareholder'; // 2 == shareholder
    }
    catch(e)
    {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getEntityCategory", "error found = " + e.getCode());
        if(e.getCode() == 'RCRD_DSNT_EXIST') throw 'Problem with the entity used. Did you select an employee on the name column? EntityId = ' + entityId;
        throw e;
    }
    
    return false;
}

function entityIsShareholder(entityId)
{
    if(entityId == null || entityId == '') {
        return false;
    }
    
    try {
        var type = nlapiLookupField('customer', entityId, 'category');

        if(type == null) return false;
        
        if(type == 2 || type == '2') return true; // 2 == shareholder
    }
    catch(e)
    {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.entityIsShareholder", "error found = " + e.getCode());
        if(e.getCode() == 'RCRD_DSNT_EXIST') throw 'Problem with the entity used. Did you select an employee on the name column? EntityId = ' + entityId;
        throw e;
    }
    
    return false;
}

function processPendingAllocation(tx) {
    nlapiLogExecution('DEBUG', 'SRSAllocation_ServerSideLibrary.processPendingAllocation', 'Entering method.');
    // remove any former ID's
    var txId = tx.getId();
    var txType = translateType(tx.getFieldValue('type'));
    removeAnyFormerEntries(txId,txType);

    var dealId = tx.getFieldValue('custbody2');
    var trandate = tx.getFieldValue('trandate');
    // iterate through the line items
    var cnt = tx.getLineItemCount('line');

    for(var i = 1; i < (cnt + 1); i++) {
        // get the transaction data
        var accountId = tx.getLineItemValue('line','account',i); // account internal id
        var accountName = tx.getLineItemText('line', 'account', i);  // skip any line item where the account is anything other than 10***
        var drAmount = tx.getLineItemValue('line', 'debit', i);  // skip any line item where the amount is 0.00
        var crAmount = tx.getLineItemValue('line', 'credit', i); // skip any line item where the amount is 0.00
        var entityId = tx.getLineItemValue('line', 'entity', i);

        if(crAmount != null) crAmount = crAmount * -1;

        // validate account information is ok for processing
        if(!validateAccount(accountName,crAmount,drAmount))    continue;
        
        var newAmount = crAmount;
        if(drAmount != null)    newAmount = drAmount;
        newAmount = parseFloat(newAmount);

        // compare the balance in escrow transactions to the amount to be allocated
        // if the balance will be wiped out by the allocation amount, take each
        // shareholder's current balance as the amount to be allocated
        var shBalance = getShareholderBalance(trandate,dealId,accountId,null,null);
        shBalance = parseFloat(shBalance);

        var entityCategory = getEntityCategory(entityId);
        //var isShareholder = entityIsShareholder(entityId);
        var account = Loader.InitAccount(accountId,accountName,tx, entityCategory == 'Shareholder' ? false : true);  // we only want to get the list of shareholders if we are allocating to all shareholders
        if(account.errorCode != Code.Valid) throw 'Error found: ' + account.errorCode;     // If entityId != dealId, entityId is likely a shareholder and the entire amount will
        
        if(entityCategory == 'Shareholder') {
            allocateToShareholder(account,accountId,accountName,newAmount,entityId,trandate);
        }
        else if((newAmount + shBalance) == 0) { // TODO: talk to Jason Morris 
            allocateBasedOnBalance(account,accountId,accountName,newAmount);
        }
        else if (entityCategory == 'Deal') { 
            // perform the allocation and rounding process
            allocateTransaction(account,accountId,accountName,newAmount);    
        }
        else {
            throw 'ERROR ' + Code.NotDealOrShareholder + ': Shareholder ' + entityId + ' does not belong to either the Deal or the Shareholder category.';
        }

        // var isShareholder = entityIsShareholder(entityId);
        // var account = Loader.InitAccount(accountId,accountName,tx,!isShareholder);         // we only want to get the list of shareholders if we are allocating to all shareholders
        // if(account.errorCode != Code.Valid) throw 'Error found: ' + account.errorCode;     // If entityId != dealId, entityId is likely a shareholder and the entire amount will
        
        // if(isShareholder) {
        //     allocateToShareholder(account,accountId,accountName,newAmount,entityId,trandate);
        // }
        // else if((newAmount + shBalance) == 0) {
        //     allocateBasedOnBalance(account,accountId,accountName,newAmount);
        // }
        // else {   
        //     // perform the allocation and rounding process
        //     allocateTransaction(account,accountId,accountName,newAmount);          
        // }

        // import the amounts
        importTransactions(account,tx,i);
    }
    return true;
}

function processPendingMinorUpdate(transaction)
{
    return true;
}

function removeAnyFormerEntries(txId,txType)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.removeAnyFormerEntries", "Entering method.");

    //set filters and column    
    var filters = new Array();
    filters.push(new nlobjSearchFilter('custrecord_journal_id', null, 'anyof', [txId]));
    filters.push(new nlobjSearchFilter('custrecord_tx_record_type', null, 'is', txType));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

    var columns = new Array();
    columns.push(new nlobjSearchColumn('internalid'));  
    while(true)
    {
        // get the first or next 1000 records
        var searchResults = nlapiSearchRecord('customrecord18',null, filters, columns);    // customrecord_test_escrow_transactions 
        if(searchResults == null || searchResults.length == 0)
        {
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.removeAnyFormerEntries", "No more entries found to delete.");
            break;
        } 
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.removeAnyFormerEntries", "Found " + searchResults.length + " entries to delete.");
        
        // loop through and delete
        //var id = -1;
        for (var i = 0; i < searchResults.length; i++) // setup view url
        {
            var result = searchResults[i];
            var id = result.getValue('internalid');

            var rcd = nlapiLoadRecord('customrecord18',id);
                rcd.setFieldValue('isinactive','T');
                nlapiSubmitRecord(rcd);

            if((i+1) < searchResults.length) {
                checkGovernance(GOVERNANCELIMIT);
            }
        }

        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.removeAnyFormerEntries", "Post SetRecovery txId - " + txId);
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.removeAnyFormerEntries", "Post SetRecovery txType - " + txType);
    }
}

function setRecoveryPoint()
{
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
 
function checkGovernance(governanceLimit) {
    var context = nlapiGetContext();
    //nlapiLogExecution("DEBUG","context.getRemainingUsage() = " + context.getRemainingUsage());
    
    if(context.getRemainingUsage() < governanceLimit) {
        nlapiLogExecution('DEBUG', 'Uh-oh, we have to re-schedule!');
        setRecoveryPoint();
        var state = nlapiYieldScript();
         if( state.status == 'FAILURE') {
                nlapiLogExecution('ERROR', 'Failed to yield script, exiting: Reason = ' + state.reason + ' /Size = '+ state.size);
                throw "Failed to yield script";
         }
         else if ( state.status == 'RESUME' ) {
            nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+". Size = "+ state.size);
         }
        // state.status will never be SUCCESS because a success would imply a yield has occurred. The equivalent response would be yield
    }
}
 
function handleRecoverFailure(failure)
{
 if( failure.reason == 'SS_MAJOR_RELEASE' )                 throw "Major Update of NetSuite in progress, shutting down all processes";
 if( failure.reason == 'SS_CANCELLED' )                     throw "Script Cancelled due to UI interaction";
 if( failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT' )     { cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
 if( failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE' )     throw "Could not set recovery point because of a reference to a non-recoverable object: "+ failure.information; 
}

function cleanUpMemory()
{
    // ...set references to null, dump values seen in maps, etc
}

function allocateBasedOnBalance(account,accountId,accountName,newAmount)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateBasedOnBalance", "Entering method.");
    var shareholders = account.shareholders;
    var checkAmount = 0.00;
    for (var i = 0; i < shareholders.length; i++)
    {
        var shareholder = shareholders[i];
        shareholder.newAmount = Math.round((parseFloat(shareholder.currentBalance) * -1) * 100) / 100;
        checkAmount = Math.round((checkAmount + shareholder.newAmount) * 100) / 100;
    }
    
    if(newAmount == checkAmount)    return;    // sum of shareholder.newAmount equals the newAmount passed in
    
    // error trying to zero out account
    allocateTransaction(account,accountId,accountName,newAmount);
}

function allocateToShareholder(account,accountId,accountName,newAmount,shareholderId,txDate)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateToShareholder", "Entering method.");
    // nlapiLogExecution("AUDIT", "SRSAllocation_ServerSideLibrary.allocateToShareholder", "shareholderId = " + shareholderId);
    // load up shareholder and ensure it is of category 'Shareholder', return error if not
    // nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateToShareholder", "About to load shareholder.");
    // var customer = nlapiLoadRecord('customer',shareholderId);
    // nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateToShareholder", "Done loading shareholder.");
    // if(customer == null) throw 'Error ' + Code.NotAShareholder + ': internalid = ' + shareholderId;
    
    // if(customer.getFieldText('category') != 'Shareholder')
    //     throw 'Error ' + Code.NotAShareholder + ': Entity ' + customer.getFieldText('firstname') + ' is not of category Shareholder.';
    // nlapiLogExecution("AUDIT", "SRSAllocation_ServerSideLibrary.allocateToShareholder", "customer.getFieldText('category') = " + customer.getFieldText('category'));
    
    // get the balance of the shareholder in escrow transactions
    /*var filters = new Array();
    var columns = new Array();

    filters[0] = new nlobjSearchFilter('custrecord_glaccount',null,'is',accountId);     // glaccount - test = custrecord116
    filters[1] = new nlobjSearchFilter('custrecord65',null,'onorbefore',txDate);        // tx date
    filters[2] = new nlobjSearchFilter('custrecord67',null,'anyof',[shareholderId]);
    columns[0] = new nlobjSearchColumn('custrecord67',null,'group');                    // shareholder - test = custrecord107  
    columns[1] = new nlobjSearchColumn('custrecord70',null,'sum');                        // balance - test = custrecord111 

    var searchResults = nlapiSearchRecord('customrecord18', null, filters, columns);      // test = customrecord_test_escrow_transactions 
    
    var balance = 0.00;
    if(searchResults != null && searchResults.length == 1)
    {
        nlapiLogExecution("AUDIT", "SRSAllocation_ServerSideLibrary.allocateToShareholder", "found result balance for shareholder.");
        var result = searchResults[0];
        balance = parseFloat(result.getValue('custrecord70',null,'sum')); // test = custrecord111
    }

    // create new Shareholder with the pro rata of 1.0
    var shareholder = new Shareholder(shareholderId,'',balance,1.0);
    */
    var shareholder = new Shareholder(shareholderId,'',0.0,1.0);

    // create a new array and assign it to account.shareholders
    var shareholders = new Array();
    shareholders.push(shareholder);
    
    account.shareholders = shareholders;
    nlapiLogExecution("AUDIT", "SRSAllocation_ServerSideLibrary.allocateToShareholder", "About to allocate to the shareholder.");
    
    // call allocateTransaction
    allocateTransaction(account,accountId,accountName,newAmount);
}

function allocateTransaction(account,accountId,accountName,newAmount)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "Entering method.");
    if (newAmount == null) throw 'Error ' + Code.cRdRNull + ': Both the debit and credit are null. ' + accountName;
    
    // the new transaction
    var newBalance = Math.round((account.currentBalance + newAmount) * 100.00) / 100;
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "New ending balance should be " + newBalance);
    
    // allocate total balance plus amount based on pro rata using simple rounding
    var shareholders = account.shareholders;
    //shareholders.sort(sortByProRata);
    var calculatedTotalBalance = 0.00;
    var maxShareholderProRata = 0;
    var largestShareholders = new Array();
    var accuracy = 1000000000000000;

    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "max shareholder amount starting with : " + maxShareholderProRata);
    for(var i = 0; i < shareholders.length; i++)
    {
        var shareholder = shareholders[i];
        shareholder.newBalance = Math.round(shareholder.proRata * newBalance * 100.00) / 100;
        calculatedTotalBalance += shareholder.newBalance;
        var shareholderProRata = shareholder.proRata * accuracy; 
        if(shareholderProRata > maxShareholderProRata) {
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "Found new max shareholder, redoing array : " + shareholder.lot + "/" + shareholderProRata + "/" + maxShareholderProRata);
            maxShareholderProRata = shareholderProRata;
            largestShareholders = new Array();
        }
        if(shareholderProRata == maxShareholderProRata) {
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "Adding new max shareholder : " + shareholder.lot + "/" + shareholderProRata + "/" + maxShareholderProRata);
            largestShareholders[largestShareholders.length] = shareholder;
        }
    }
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "Number of largest shareholders found : " + largestShareholders.length);    
    calculatedTotalBalance = Math.round(calculatedTotalBalance * 100.00) / 100;
        
    // fix any rounding errors to the total balance
    if(calculatedTotalBalance != newBalance)
    {    // find largest shareholder(s), give difference to largest shareholder, or spread across the largest shareholders.
        var difference = Math.round((newBalance - calculatedTotalBalance) * 100.00) / 100;
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "Rounding error detected - difference is : " + difference);
        
        var adjustment = 0.01;         // adjust one penny at a time
        if(difference < 0.00) adjustment = -0.01;
        largestShareholders.sort(sortLargeShareholder);                // sort largestShareholders by descending balance order.
        while(difference != 0)
        {
            for (var i = 0; i < largestShareholders.length && difference != 0; i++)
            {
                //var shareholder = shareholders[i];
                var shareholder = largestShareholders[i];
                shareholder.newBalance = shareholder.newBalance + adjustment;
                difference = Math.round((difference - adjustment) * 100.00) / 100;
                if(difference == 0) break;
            }
        }
    }

    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "Calculating import amounts");
    // subtract each shareholder's balance from the new balance to determine the import amount
    for (var i = 0; i < shareholders.length; i++)
    {
        var shareholder = shareholders[i];
        shareholder.newAmount = Math.round((shareholder.newBalance - shareholder.currentBalance) * 100) / 100;        
        /*if(newAmount > 0.00)
        {
            if(shareholder.newAmount < 0.00)
            {
                nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "lot/newAmount/newBalance/currentBalance" + shareholder.lot + "/" + shareholder.newAmount + "/" + shareholder.newBalance + "/" + shareholder.currentBalance);
                throw 'Error ' + Code.NegativeAmountCalculated + ': Negative Amount Calculated During Allocation for allocation of ' + newAmount + ' in account ' + accountName + '. ' + "lot/newAmount/newBalance/currentBalance:" + shareholder.lot + "/" + shareholder.newAmount + "/" + shareholder.newBalance + "/" + shareholder.currentBalance; 
            }
        }
        else    // we expect this to be a negative amount
        {
            if(shareholder.newAmount > 0.00)
            {
                nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "lot/newAmount/newBalance/currentBalance" + shareholder.lot + "/" + shareholder.newAmount + "/" + shareholder.newBalance + "/" + shareholder.currentBalance);
                throw 'Error ' + Code.PositiveAmountCalculated + ': Positive Amount Calculated During Allocation for allocation of ' + newAmount + ' in account ' + accountName + '. ' + "lot/newAmount/newBalance/currentBalance:" + shareholder.lot + "/" + shareholder.newAmount + "/" + shareholder.newBalance + "/" + shareholder.currentBalance;
            }
        }*/
    }
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.allocateTransaction", "Import amounts calculated");
}

function importTransactions(account,transaction,line)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.importTransactions", "Importing new amounts");

    var shareholders = account.shareholders;
    for(i = 0; i < shareholders.length; i++) {
        var shareholder = shareholders[i];
        
        var escrowTX = nlapiCreateRecord('customrecord18');        // test = customrecord_test_escrow_transactions
        escrowTX.setFieldValue('custrecord65',transaction.getFieldValue('trandate'));    // Date of transaction - test = custrecord105
        escrowTX.setFieldValue('custrecord66',transaction.getFieldValue('custbody2'));    // Escrow - test = custrecord106 
        escrowTX.setFieldValue('custrecord67',shareholder.internalid);                    // Shareholder - test = custrecord107 
        escrowTX.setFieldText('custrecord68',transaction.getFieldText('custbody3'));    // Escrow Account Type - test = custrecord108 
        escrowTX.setFieldText('custrecord69',transaction.getFieldText('custbody1'));    // Escrow Transaction Type - test = custrecord109 
        escrowTX.setFieldText('custrecord85',transaction.getFieldText('currency'));        // Denomination - test = custrecord110 
        escrowTX.setFieldValue('custrecord70',shareholder.newAmount);                    // Amount - test = custrecord111 
        escrowTX.setFieldValue('custrecord71',shareholder.lot);                            // Lot - test = custrecord112 
        escrowTX.setFieldValue('custrecord72',transaction.getFieldValue('custbody4'));    // Memo - test = custrecord113 
        escrowTX.setFieldValue('custrecord_journal_id',transaction.getId());            // Transaction ID  - test = custrecord114 
        escrowTX.setFieldValue('custrecord_glaccount',account.accountId);                // GL Account - test = custrecord116 
        escrowTX.setFieldValue('custrecord_tx_record_type','journalentry');                // Transaction Record Type - test = custrecord117 
        escrowTX.setFieldValue('custrecord_transaction_line',line);                        // Transaction Line ID - test = custrecord119 
        escrowTX.setFieldText('custrecord_et_status','NEW');                            // Status - test = custrecord118
        escrowTX.setFieldText('custrecord_escrow_tx_created_from_cert',shareholder.createdFromCert);    // Pro Rata Tx Created From Cert ID
        
        nlapiSubmitRecord(escrowTX, true, false);

        if((i+1) < shareholders.length) {
            checkGovernance(GOVERNANCELIMIT);
        }
    }
}

function validateAccount(account, crAmount, drAmount)
{
    //if(account.length != 5 || account.substring(0,2) != '10')
    if(account.substring(0,2) != '10')    // @TODO figure out a better way to isolate the account number
    {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.validateAccount", "Skipping account " + account);
        return false;
    }
    if((crAmount == 0 && drAmount == 0) || (crAmount == null && drAmount == null))
    {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.validateAccount", "Skipping CR or DR. Both zero or null.");
        return false;
    }
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.validateAccount", "No Errors found");
    
    return true;
}

function getShareholderData(accountInternalId,accountName,tx)
{     
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderData", "Getting shareholder data");
    // determine the status of the account
    /*var filters = new Array();
    var columns = new Array();
    filters[0] = new nlobjSearchFilter('internalid',null,'is',accountInternalId);
    columns[0] = new nlobjSearchColumn('custrecord_account_status',null,null);    // will be either Open or Closed
    var searchResults = nlapiSearchRecord('account', null, filters, columns);  // set search results
    if(searchResults == null || searchResults.length == 0) throw 'Error ' + Code.AccountNotFound + ' found: ' + accountName;
    */
    
    var trandate = tx.getFieldValue('trandate');
    var allocByBal = tx.getFieldValue('custbody_allocate_by_balance');
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderData", "allocByBal = " + allocByBal);
    if(allocByBal == 'F')    // allocate by calculating a pro rata based on the current balances
    {
        var shareholders = getShareholdersByProRataTable(accountInternalId,accountName);
        //shareholders = getShareholderCurrentBalances(shareholders,accountInternalId,accountName,trandate);        
        return shareholders;
    }
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderData", "Getting balances to calculate pro rata");
    var shareholders = getShareholdersByCurrentBalance(accountInternalId,accountName,trandate);
    if(shareholders == null || shareholders.length == 0)
        shareholders = getShareholdersByProRataTable(accountInternalId,accountName);
    
    return shareholders;
}

function getIdFilters(shareholders)
{
    shareholders.sort(shareholderLotSort);    // sorted by shareholder.internalid and shareholder.lot
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getIdFilters", "shareholders.length = " + shareholders.length);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getIdFilters", "First shareholder.internalid = " + shareholders[0].internalid);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getIdFilters", "Last shareholder.internalid = " + shareholders[shareholders.length - 1].internalid);
    
    var idFilters = new Array(); // an array of ending shareholder ids
    var cnt = Math.round(shareholders.length / 500);    // 2 (if shareholders.length 1165 found)
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getIdFilters", "cnt = " + cnt);
    var lastInternalId = -1;
    for(var i = 0; i < cnt; i++)
    {
        var pos = parseInt((i + 1) * 500);    // this will give me the approximate spot of the shareholder/lot
        
        if(pos > shareholders.length)
        {
            cnt--;
            break;
        }
        
        var shareholder = shareholders[pos];
        var theId = shareholder.internalid;
        idFilters[i] = [lastInternalId, shareholder.internalid];
        lastInternalId = shareholder.internalid;
    }
    
    // add the last position
    var shareholder = shareholders[shareholders.length - 1];
    idFilters[cnt] = [lastInternalId, shareholder.internalid];
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getIdFilters", "END");
    return idFilters;    
}

function getShareholderCurrentBalances(shareholders,accountInternalId,accountName,txDate)
{
    return shareholders;
    /*nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "START");

    var filters     = [new nlobjSearchFilter('custrecord_glaccount',null,'is',accountInternalId)];     // glaccount - test = custrecord116
        filters[1]     = new nlobjSearchFilter('custrecord65',null,'onorbefore',txDate);                // tx date
    var columns     = [new nlobjSearchColumn('custrecord67',null,'group')];                            // shareholder - test = custrecord107 
        columns[1]     = new nlobjSearchColumn('custrecord71',null,'group');                            // lot - test = custrecord112 
        columns[2]     = new nlobjSearchColumn('custrecord70',null,'sum');                                // balance - test = custrecord111 

    // get the list of shareholder balances in groups of approximately 500
    var idFilters = getIdFilters(shareholders);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "idFilters.length = " + idFilters.length);
    for(var i = 0; i < idFilters.length; i++)
    {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "getting filter i = " + i);
        var idFilter = idFilters[i];
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "filter range = " + idFilter[0] + " to " + idFilter[1]);
        filters[2] = new nlobjSearchFilter('internalidnumber','custrecord67','greaterthan',idFilter[0]);         // shareholder - test = custrecord107
        filters[3] = new nlobjSearchFilter('internalidnumber','custrecord67','lessthanorequalto',idFilter[1]);     // shareholder - test = custrecord107
        
        var searchResults = nlapiSearchRecord('customrecord18', null, filters, columns);  // test = customrecord_test_escrow_transactions 
        if(searchResults == null || searchResults.length == 0) break;
        
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "searchResults.length = " + searchResults.length);
                
        for(var j = 0; j < searchResults.length; j++)
        {
            result = searchResults[j];
            var shareholderId = result.getValue('custrecord67',null,'group');     // test = custrecord107 
            //var shareholder = result.getText('custrecord67',null,'group');
            var lot = result.getValue('custrecord71',null,'group');                 // test = custrecord112
            var balance = parseFloat(result.getValue('custrecord70',null,'sum')); // test = custrecord111
            
            var matchFound = false;
            for(var k = 0; k < shareholders.length; k++)
            {
                shareholder = shareholders[k];
                
                if(shareholder == null || 
                    typeof(shareholder.internalid) == "undefined" || 
                    typeof(shareholder.lot) == "undefined" || 
                    typeof(shareholder.currentBalance) == "undefined" ||
                    typeof(balance) == "undefined")
                {
                    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "Found null shareholder or typeof undefined error");
                    continue;
                }
                
                if(shareholder.internalid != null && shareholder.internalid !== shareholderId) continue;
                if(shareholder.lot != null && shareholder.lot !== lot) continue;
                shareholder.currentBalance = parseFloat(shareholder.currentBalance) + balance;    // just in case a previous match was found, add the balances
                break;                    
            }
        }
    }
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "END");
    return shareholders;*/
}

function getShareholderTxBalance(shareholders,txId,line)
{
    var filters     = [new nlobjSearchFilter('custrecord_journal_id',null,'is',txId)];         // glaccount - test = custrecord116
        filters[1]    = new nlobjSearchFilter('custrecord_transaction_line',null,'is',line);
    var columns     = [new nlobjSearchColumn('custrecord67',null,'group')];                    // shareholder - test = custrecord107 
        columns[1]     = new nlobjSearchColumn('custrecord71',null,'group');                    // lot - test = custrecord112 
        columns[2]     = new nlobjSearchColumn('custrecord70',null,'sum');                        // balance - test = custrecord111 

    // get the list of shareholder balances in groups of approximately 500
    var idFilters = getIdFilters(shareholders);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "idFilters.length = " + idFilters.length);
    for (var i = 0; i < idFilters.length; i++) 
    {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "getting filter i = " + i);
        var idFilter = idFilters[i];
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "filter range = " + idFilter[0] + " to " + idFilter[1]);
        filters[2] = new nlobjSearchFilter('internalidnumber', 'custrecord67', 'greaterthan', idFilter[0]); // shareholder - test = custrecord107
        filters[3] = new nlobjSearchFilter('internalidnumber', 'custrecord67', 'lessthanorequalto', idFilter[1]); // shareholder - test = custrecord107
        
        var searchResults = nlapiSearchRecord('customrecord18', null, filters, columns); // test = customrecord_test_escrow_transactions 
        if (searchResults == null || searchResults.length == 0) break;

        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "searchResults.length = " + searchResults.length);
                
        for(var j = 0; j < searchResults.length; j++)
        {
            result = searchResults[j];
            var shareholderId = result.getValue('custrecord67',null,'group');      // test = custrecord67
            var lot = result.getValue('custrecord71',null,'group');                  // test = custrecord112
            var balance = parseFloat(result.getValue('custrecord70',null,'sum')); // test = custrecord111
            
            var matchFound = false;
            for(var k = 0; k < shareholders.length; k++)
            {
                shareholder = shareholders[k];
                
                if(shareholder == null || 
                    typeof(shareholder.internalid) == "undefined" || 
                    typeof(shareholder.lot) == "undefined" || 
                    typeof(shareholder.newAmount) == "undefined" ||
                    typeof(balance) == "undefined")
                {
                    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "Found null shareholder or typeof undefined error");
                    continue;
                }
                
                if(shareholder.internalid != null && shareholder.internalid !== shareholderId) continue;
                if(shareholder.lot != null && shareholder.lot !== lot) continue;
                shareholder.newAmount = parseFloat(shareholder.newAmount) + balance;    // just in case a previous match was found, add the balances
                break;                    
            }
        }
    }    
    return shareholders;
}

/*function getShareholderCurrentBalancesOld(shareholders,accountInternalId,accountName)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "Getting shareholder current balances");
    var filters = new Array();
    var columns = new Array();
    
    filters[0] = new nlobjSearchFilter('custrecord116',null,'is',accountInternalId);     // glaccount - prod = custrecord_glaccount
    columns[0] = new nlobjSearchColumn('custrecord107',null,'group');                    // shareholder - prod = custrecord67
    columns[1] = new nlobjSearchColumn('custrecord112',null,'group');                    // lot - prod = custrecord71
    columns[2] = new nlobjSearchColumn('custrecord111',null,'sum');                        // balance - prod = custrecord70
    
    var lastInternalId = -1;
    var cnt = 0;
    while (true)
    {
        filters[1] = new nlobjSearchFilter('internalidnumber','custrecord107','greaterthan',lastInternalId);
        var searchResults = nlapiSearchRecord('customrecord_test_escrow_transactions', null, filters, columns);  // prod = customrecord18
        if(searchResults == null || searchResults.length == 0) break;

        for(var i = 0; i < searchResults.length; i++)
        {
            result = searchResults[i];
            var shareholderId = result.getValue('custrecord107',null,'group');        // prod = custrecord67
            var lot = result.getValue('custrecord112',null,'group');                // prod = custrecord71
            var balance = parseFloat(result.getValue('custrecord111',null,'sum'));    // prod = custrecord70
            
            var matchFound = false;
            for(var j = 0; j < shareholders.length; j++)
            {
                shareholder = shareholders[j];
                if(shareholder.internalid != shareholderId) continue;
                if(shareholder.lot != lot) continue;
                matchFound = true;
                shareholder.currentBalance = shareholder.currentBalance + balance;    // just in case a previous match was found, add the balances
            }
            //if(!matchFound && balance > 0) throw 'Error ' + Code.ShareholderMissing + ' found: Shareholder not found - ' + shareholder + ':' + lot + ':' + accountName;
        }
        cnt = cnt + 1;
        if(cnt > 10)
        {
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "PROBLEMS BREAKING OUT OF LOOP");
            break;
        }
    }    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderCurrentBalances", "Returning shareholder data");

    return shareholders;
}*/

function getShareholdersByCurrentBalance(accountInternalId,accountName,txDate)
{
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByCurrentBalance", "accountId/accountName" + accountInternalId + "/" + accountName);
    var filters = new Array();
    var columns = new Array();

    filters[0] = new nlobjSearchFilter('custrecord_glaccount',null,'is',accountInternalId);
    filters[1] = new nlobjSearchFilter('custrecord70',null,'notequalto',0);                      //amount
    filters[2] = new nlobjSearchFilter('custrecord65',null,'onorbefore',txDate);                // tx date
    columns[0] = new nlobjSearchColumn('custrecord67',null,'group');                            // shareholder
    columns[1] = new nlobjSearchColumn('custrecord71',null,'group');                            // lot
    columns[2] = new nlobjSearchColumn('custrecord70',null,'sum');                                // balance
    
    var searchResults = nlapiSearchRecord('customrecord18', null, filters, columns);  // test = customrecord_test_escrow_transactions
    if(searchResults == null || searchResults.length == 0) return null;

    var shareholders = new Array();
    var totalBalance = 0.0;
    for(var i = 0; i < searchResults.length; i++)
    {
        result = searchResults[i];
        
        var shareholder = result.getText('custrecord67',null,'group');
        var shareholderId = result.getValue('custrecord67',null,'group');
        var lot = result.getText('custrecord71',null,'group');
        var balance = parseFloat(result.getValue('custrecord70',null,'sum'));
        
        if(balance == 0) continue;
        if(balance < 0) throw 'Error ' + Code.NegativeBalance + ' found: ' + accountName + ':' + shareholder + ':' + lot + ':' + balance;
        totalBalance += balance;
        
        var sh = new Shareholder(shareholderId,lot,balance,0.00000000000000);
        shareholders.push(sh);
    }
    totalBalance = Math.round((parseFloat(totalBalance)) * 100) / 100;
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByCurrentBalance", "Returning shareholder data");
    if(totalBalance < 0) throw 'Error ' + Code.NegativeBalance + ' found: ' + accountName + ':' + ' Deal Balance is ' + totalBalance;
    if(totalBalance == 0) return null;
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByCurrentBalance", "totalBalance = " + totalBalance);
    
    for(var i = 0; i < shareholders.length; i++)        // calculate the pro ratas based on the total balance
    {
        sh = shareholders[i];
        sh.proRata = sh.currentBalance / totalBalance;
    }
    return shareholders;
}

function getShareholdersByProRataTable(accountInternalId,accountName)
{
    // if there is a zero total balance, get the pro rata from the pro rata table
    var filters = new Array();
    var columns = new Array();
    filters[0] = new nlobjSearchFilter('custrecordescrow_account',null,'is',accountInternalId);
    filters[1] = new nlobjSearchFilter('custrecordpro_rata_deci',null,'greaterthan',0);
    columns[0] = new nlobjSearchColumn('internalid',null,null);
    columns[0].setSort();    // sort by internalid
    columns[1] = new nlobjSearchColumn('custrecordlot',null,null);                // lot
    columns[2] = new nlobjSearchColumn('custrecordshareholder',null,null);        // shareholder
    columns[3] = new nlobjSearchColumn('custrecordpro_rata_text',null,null);    // pro rata
    columns[4] = new nlobjSearchColumn('custrecord_pro_rata_created_from_cert',null,null);  // created from: Cert ID

    var lastInternalId = -1;
    var floatSum = 0;
    var precision = 1000000000000000;    // 15 decimal places
    var shareholders = new Array();
    
    var cnt = 0;
    while(true)
    {
        filters[2] = new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastInternalId);
        var searchResults = nlapiSearchRecord('customrecordespr', null, filters, columns);  // set search results, shareholder pro rata record
        
        if(searchResults == null || searchResults.length == 0) break;
        nlapiLogExecution('DEBUG', 'searchResults.length = ' + searchResults.length);
        for(var i = 0; i < searchResults.length; i++)
        {
            var result = searchResults[i];
            var shareholder = result.getText('custrecordshareholder');
            var shareholderId = result.getValue('custrecordshareholder');
            var lot = result.getValue('custrecordlot');
            var proRataStr = result.getValue('custrecordpro_rata_text');
            var proRata = parseFloat(proRataStr);
            var proRataRecordId = result.getValue('internalid');
            var createdFromCert = result.getValue('custrecord_pro_rata_created_from_cert');
            floatSum += Math.round(proRata * precision);

            if(shareholderId == null)
            {
                nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "shareholderId null for shareholder/lot/proRata " + shareholder + "/" + lot + "/" + proRata);
            }
            var sh = new Shareholder(shareholderId,lot,0.00,proRata,proRataRecordId, createdFromCert);
            shareholders[cnt] = sh;

            lastInternalId = parseInt(proRataRecordId);

            cnt = cnt + 1;
        }
        // if(cnt > 5000)
        // {
        //     nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "PROBLEMS BREAKING OUT OF LOOP");
        //     break;
        // }
    }
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "shareholders.length = " + shareholders.length);
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "floatSum = " + floatSum);
    if(shareholders.length == 0) throw 'Error ' + Code.NoShareholderData + ' found: For account ' + accountName;

    // make sure the shareholder pro ratas sums to 1.0
    // if they do not, return the invalid code: PRO_RATA_ERR
    var diff = precision - floatSum;
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "Pro Rata Difference = " + diff);
    if (diff != 0) {
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "Pro Ratas do not sum to 1.0.");
        if(Math.abs(diff).toString().length <= 3) { // off by digits in the 13th, 14th, and 15th decimal places
            var oldShareholderProRata = shareholders[0].proRata;
            shareholders.sort(function(a,b) {
                return b.proRata - a.proRata;
            });
            // calculate the adjusted pro rata NEW
            var proRataString = shareholders[0].proRata.toString();
            while(proRataString.length < 17) {          // want 15 characters after the decimal plus the leading '0.'
                proRataString = proRataString + '0';
            }
            var proRataSubstring = proRataString.substring(2, proRataString.length); // cut off '0.' - we'll add this back later
            var longInt = parseInt(proRataSubstring, 10);   // convert into an Integer so we can do base-10 Integer arithmetic
            var newProRata = (longInt + diff).toString();    // calculate pro rata difference
            while(newProRata.length < 15) {                 // re-add any leading zeroes that were discarded by parseInt
                newProRata = '0' + newProRata;
            }
            newProRata = '0.' + newProRata;                 // re-add that '0.'
            
            shareholders[0].proRata = parseFloat(newProRata);
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "Changed largest SH's pro rata from " + proRataStr + ' to ' + newProRata);
            
            // recheck the pro rata sum in case of error TODO: ProRatas must add up to WHOLE NUMBER - 3 escrows = 3.0, 1 escrow = 1.0
            // floatSum -= Math.round(oldShareholderProRata * precision); // subtract old ProRata to the sum of ProRata
            // floatSum += Math.round(newProRata * precision);            // add new ProRata to the sum of ProRata
            // var newDiff = precision - floatSum;
            // nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "New Adjust Pro Rata Sum is: " + newDiff);
            // if(newDiff != 0) {
            //     nlapiLogExecution("ERROR", "SRSAllocation_ServerSideLibrary.getShareholdersByProRataTable", "Auto-adjust failed. Throwing error.");
            //     throw 'Error ' + Code.InvalidProRataSum + '. Script unable to auto-adjust pro rata for account: ' + accountName + '. Please verify.'
            // }

            var fields = ['custrecordpro_rata_text', 'custrecordpro_rata_deci'];
            var values = [newProRata, (Math.round(newProRata*100000000)/100000000)];
            nlapiSubmitField('customrecordespr', shareholders[0].proRataRecordId, fields, values);
        } 
        else {
            throw 'Error ' + Code.InvalidProRataSum + ' found outside of tolerance threshold: For account ' + accountName + '. Sum is ' + (floatSum / precision);
        }
    }
    
    return shareholders;    
}

function getShareholderProRata(shareholderId,glAccountId)
{
    var filters = new Array();
        filters.push(new nlobjSearchFilter('custrecordshareholder'   , null, 'is', shareholderId));
        filters.push(new nlobjSearchFilter('custrecordescrow_account', null, 'is', glAccountId));
    
    var columns = new Array();
        columns.push(new nlobjSearchColumn('internalid', null, null));
        columns.push(new nlobjSearchColumn('custrecordpro_rata_text', null, null));
        columns.push(new nlobjSearchColumn('custrecordpro_rata_deci', null, null));
        columns.push(new nlobjSearchColumn('custrecordlot', null, null));
        columns.push(new nlobjSearchColumn('custrecordescrow', null, null));
        columns.push(new nlobjSearchColumn('custrecord_pro_rata_created_from_cert', null, null)); // added for Subsequent Payment Creation process
    
    var searchResults = nlapiSearchRecord('customrecordespr',null, filters, columns);     // test = customrecord_test_escrow_transactions
    if(searchResults == null || searchResults.length == 0) return null;
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.getShareholderProRata", "searchResults size = " + searchResults.length);
    
    var data = new Array();
    for(var i = 0; i < searchResults.length; i++)
    {
        var result = searchResults[i];
        
        var datum = {
                 'id'             : result.getValue('internalid')
                ,'pro_rata_text' : result.getValue('custrecordpro_rata_text')
                ,'pro_rata_deci' : result.getValue('custrecordpro_rata_deci')
                ,'lot'             : result.getValue('custrecordlot')
                ,'shareholder_id': shareholderId
                ,'account_id'     : glAccountId
                ,'deal_id'         : result.getValue('custrecordescrow')
                ,'cert'          : result.getValue('custrecord_pro_rata_created_from_cert') // added for Subsequent Payment Creation process
        };
        nlapiLogExecution('ERROR', 'datum', JSON.stringify(datum));
        
        data.push(datum);
    }
    return data;
}


function updateShTxStatus(date,deal,glAccount,txId,line,newStatus)
{
    nlapiLogExecution('DEBUG', 'SRSAllocation_ServerSideLibrary.updateShTxStatus', 'Checking remaining usage: ' + nlapiGetContext().getRemainingUsage());
                
    var filters = new Array();
    var columns = new Array();
    
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "date = " + date);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "deal = " + deal);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "glAccount = " + glAccount);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "txId = " + txId);
    nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "line = " + line);
    
    filters[0] = new nlobjSearchFilter('custrecord65', null, 'on', date);                 // date - test = custrecord105 
    filters[1] = new nlobjSearchFilter('custrecord66', null, 'is', deal);                 // deal - test = custrecord106 
    filters[2] = new nlobjSearchFilter('custrecord_glaccount', null, 'is', glAccount);     // acct - test = custrecord116 
    filters[3] = new nlobjSearchFilter('custrecord_journal_id', null, 'is', txId);         // acct - test = custrecord114
    filters[4] = new nlobjSearchFilter('custrecord_transaction_line', null, 'is', line);// acct - test = custrecord119 
    filters[5]     = new nlobjSearchFilter('isinactive', null, 'is', 'F');  //make sure only getting active escrow transactions
       columns[0] = new nlobjSearchColumn('internalid', null, null);
    columns[0].setSort();

    var today = new Date();
    var month = today.getMonth() + 1;
    var dStr = month + "/" + today.getDate() + "/" + today.getFullYear();        // today's date
    
    var lastInternalId = -1;
    while(true)
    {
        filters[4] = new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastInternalId);
        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "lastInternalId = " + lastInternalId);
        var searchResults = nlapiSearchRecord('customrecord18',null, filters, columns);     // test = customrecord_test_escrow_transactions 
        if(searchResults == null || searchResults.length == 0)
        {
            nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "No more entries found to update");
            break;
        } 

        for(var i = 0; i < searchResults.length; i++)    
        {

            if((i+1) < searchResults.length) {
                checkGovernance(GOVERNANCELIMIT);
            }

            var result = searchResults[i];
            var shTxId = result.getValue('internalid');
            
            var shTx = nlapiLoadRecord('customrecord18',shTxId);    // test = customrecord_test_escrow_transactions
            shTx.setFieldText('custrecord_et_status',newStatus);    // status - test = custrecord118
            if(newStatus == 'RECONCILED') {
                shTx.setFieldValue('custrecord_reconciled_date',dStr);    // reconciled date - test = custrecord115 
            }
            nlapiSubmitRecord(shTx);
            lastInternalId = parseInt(shTxId);
        }

        nlapiLogExecution("DEBUG", "SRSAllocation_ServerSideLibrary.updateShTxStatus", "lastInternalId = " + lastInternalId);
    }
    
    return true;
}

function shareholderLotSort(a,b)
{
    var aVar = parseInt(a.internalid);    // compare by internal id
    var bVar = parseInt(b.internalid);
    
    if(aVar == bVar)            // compare by lot
    {
        aVar = a.lot;
        bVar = b.lot;
    }
    
    if(aVar < bVar)
        return -1;
    if(aVar > bVar)
        return 1;
    return 0;    // kick out duplicates    
}

// sort by shareholder internal id, then by lot
// this is specific to the pro rata table
function lotShareholderSort(a, b) 
{
    var x = a.getValue('custrecordshareholder');
    var y = b.getValue('custrecordshareholder');
    
    if(x == y)
    {    // comparing same shareholder
        x = a.getText('custrecordlot');
        y = b.getText('custrecordlot');
    }
    
    if (x < y) 
    { 
        return -1; 
    } 
    else if (x > y) 
    { 
        return 1; 
    } 
    else 
    { 
        return 0; 
    } 
}  

// sort by shareholder internal id, then by lot
// this is specific to the escrow transaction table
function lotShareholderSort2(a, b) 
{
    var x = a.getValue('custrecord67'); // shareholder
    var y = b.getValue('custrecord67'); 

    if(x == y)
    {    // comparing same shareholder
        x = a.getText('custrecord71'); // lot
        y = b.getText('custrecord71');
    }    
    
    if (x < y) 
    { 
        return -1; 
    } 
    else if (x > y) 
    { 
        return 1; 
    } 
    else 
    { 
        return 0; 
    } 
}

function sortByInternalid(a,b)
{
    var idA = parseInt(a.getValue('internalid'));
    var idB = parseInt(b.getValue('internalid'));
    
    if(idA < idB)
        return -1;
    if(idA > idB)
        return 1;
        
    return -1;    // for null case
}

function sortLargeShareholder(a,b)
{
    var balA = a.newBalance;
    var balB = b.newBalance;
    
    if(balA < balB)    return 1;
    if(balB > balA) return -1;
    return 0;
}

function sortByProRata(a,b)
{
    var proA = a.proRata;
    var proB = b.proRata;
    
    if(proA < proB) return 1;
    if(proA > proB) return -1;
    return 1; // if they are equal, we do not want to kick out records from the result set.
}

var Settings =
{
    ErrorNotification:
    {
        From: "6367" //internal id of employee
        , To: "durbano@shareholderrep.com"

    },
    TaskNotifications:
    {
        From: "28154" //internal id of employee.
        , Subject: "New Tasks Assigned"
    }
}

var Messaging =
{
    SendMessage: function(from, to, subject, body)
    {
        /// <summary>Sends an email to specified recipient.</summary>
        /// <param name="from" type="string" mayBeNull="false">The Internal ID of an employee indicating the sender of the email.</param>
        /// <param name="to" type="string" mayBeNull="false">Recipients email address.</param>
        /// <param name="subject" type="string" mayBeNull="false">Email subject</param>
        /// <param name="body" type="string" mayBeNull="false">Email body</param>

        nlapiSendEmail(from, to, subject, body, null, null, null);
    },
    SendErrorNotification: function(scriptInfo, message)
    {
        /// <summary>Sends an error notification to specified recipient.</summary>
        /// <param name="scriptInfo" type="string" mayBeNull="false">Script and function name where error occured.</param>
        /// <param name="message" type="string" mayBeNull="false">Error message.</param>
        
        var currentContext = nlapiGetContext();
        var currentUserID = currentContext.getUser();
        if(currentUserID == null)
        {
            currentUserID = Settings.ErrorNotification.To;
        }
        
        var subject = "Unexpected error occured in " + scriptInfo;
        nlapiSendEmail(Settings.ErrorNotification.From, currentUserID, subject, message, null, null, null);
    }
}