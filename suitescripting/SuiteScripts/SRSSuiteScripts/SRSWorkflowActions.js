/***********************************
 **
 **  getContactByEmail: This function allows for the retrieval of a contact record internal id by
 **                     a given email string.
 **/
function getContactByEmail() {
    //get the target email from the workflow
    var targetEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_mr_email');
    nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getContactEmail', 'Starting function call with email: ' + targetEmail);
    //search for the contact.
    var contactResults = null;
    var contactFilters = new Array();
    var contactColumns = new Array();

    contactFilters[0] = new nlobjSearchFilter('email', null, 'is', targetEmail);

    contactColumns[0] = new nlobjSearchColumn('internalid');

    contactResults = nlapiSearchRecord('contact', null, contactFilters, contactColumns);

    if (contactResults != null) {
        nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getContactEmail', 'Found Result Contact Internal ID: ' + contactResults[0].getValue('internalid'));
        return contactResults[0].getValue('internalid');
    } else {
        nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getContactEmail', 'No Contact Found for Email: ' + targetEmail);
        return 0;
    }
}

/***********************************
 **
 **  getEscrowAccountType: This function allows for the retrieval of an Escrow Account Type value for
 **                        a given Account record.
 **/
function getEscrowAccountType() {
    //Start the workflow action.
    //nlapiLogExecution('DEBUG','SRSWorkflowActions.getEscrowAccountType','Starting function getEscrowAccountType for Transaction: '+nlapiGetNewRecord().getId());
    nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'Starting function getEscrowAccountType for Transaction.  Current usage: ' + nlapiGetContext().getRemainingUsage());

    var accountInternalIds = new Array();
    var returnVal = 0;
    var cnt = nlapiGetLineItemCount('line');
    if (cnt == null || cnt == 0) return returnVal; // make sure we have lines to deal with

    nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'nlapiGetLineItemCount = ' + cnt);

    //Since NetSuite considers data retrieval to be expensive, we're going to aggregate the account IDs and search for them later. 
    for (var i = 1; i <= cnt; i++) {

        if (nlapiGetLineItemValue('line', 'account', i) == null) continue;

        if (accountInternalIds.indexOf(nlapiGetLineItemValue('line', 'account', i)) == -1) {
            nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'What account internal id? ' + nlapiGetLineItemValue('line', 'account', i));
            accountInternalIds.push(nlapiGetLineItemValue('line', 'account', i));
        }
    }

    //Now that we have the account ids, let's get (search) the account types in question (assuming NetSuite allows that).  
    //		NOTE:  	If we ended up with an odd journal entry, we could end up with more than one escrow account type that contradict each other.  While this 
    //				isn't good, we may sooner solve the question of world peace than solve some of these issues, so for now the first escrow type wins.

    try {
        var accountSearchFilters = new Array();
        var accountSearchColumns = new Array();
        var accountSearchResults = null;


        accountSearchFilters[0] = new nlobjSearchFilter('internalid', null, 'anyof', accountInternalIds);
        accountSearchFilters[1] = new nlobjSearchFilter('custrecord_escrow_account_type', null, 'isnotempty', null);
        accountSearchColumns[0] = new nlobjSearchColumn('custrecord_escrow_account_type', null, 'group');

        nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'What account internal id array?  ' + accountInternalIds.toString());
        accountSearchResults = nlapiSearchRecord('account', null, accountSearchFilters, accountSearchColumns);

    } catch (e) {
        if (e instanceof nlobjError) {
            nlapiLogExecution('ERROR', 'SRSWorkflowActions.getEscrowAccountType (nlobjError)', e.getCode() + '\n' + e.getDetails())
        } else {
            nlapiLogExecution('ERROR', 'SRSWorkflowActions.getEscrowAccountType (JavaScript Error)', e.toString());
        }
    }

    // Check to see if we got something.  If so, get the value of the escrow account type.
    if (accountSearchResults != null) {
        //As said earlier, first entry wins.  We can only really handle one escrow account type and it would be wrong to get more than one.
        nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'We found accounts, Stringify the results:' + JSON.stringify(accountSearchResults));
        for (var i = 1; i < accountSearchResults.length; i++) {
            if (accountSearchResults[i].getValue('custrecord_escrow_account_type', null, 'group') != null) {
                nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'We found an escrow account type!  Run with it! ' + accountSearchResults[i].getValue('custrecord_escrow_account_type', null, 'group') + ' / ' + accountSearchResults[i].getText('custrecord_escrow_account_type', null, 'group'));
                nlapiGetNewRecord().setFieldValue('custbody3', accountSearchResults[i].getValue('custrecord_escrow_account_type', null, 'group'));
                nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'Exiting Escrow Account Type Look-up after setting JE field value.' + '.  Current usage: ' + nlapiGetContext().getRemainingUsage());
                return accountSearchResults[i].getValue('custrecord_escrow_account_type', null, 'group');
            }
        }
    }


    nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getEscrowAccountType', 'Exiting Escrow Account Type Look-up.' + '.  Current usage: ' + nlapiGetContext().getRemainingUsage());

    return returnVal;
}

/***********************************
 **
 **  getPrimaryCompanyByContact: This function returns the primary company associated with
 **                              a given Contact record.
 **/
function getPrimaryCompanyByContact() {
    //Get the contact internal ID.
    var targetContactId = nlapiGetContext().getSetting('SCRIPT', 'custscript_mr_contact_id');

    //Next get the contact record.
    var targetContact = nlapiLoadRecord('contact', targetContactId);

    //Finaly return the contact's primary company, if they have one otherwise, 0.
    if (targetContact != null && targetContact.getFieldValue('company') != null && targetContact.getFieldValue('company') > 0) {
        return targetContact.getFieldValue('company');
    } else {
        return 0;
    }
}

/***********************************
 **
 **  getContactByEmail: This function allows for the retrieval of a contact record internal id by
 **                     a given email string.
 **/
function getCustomerByEmail() {
    //get the target email from the workflow
    var targetEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_cust_by_email');
    nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getCustomerByEmail', 'Starting function call with email: ' + targetEmail);
    //search for the customer.
    var customerResults = null;
    var customerFilters = new Array();
    var customerColumns = new Array();

    customerFilters[0] = new nlobjSearchFilter('email', null, 'is', targetEmail);

    customerColumns[0] = new nlobjSearchColumn('internalid');

    customerResults = nlapiSearchRecord('customer', null, customerFilters, customerColumns);

    if (customerResults != null) {
        nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getCustomerByEmail', 'Found Result customer Internal ID: ' + customerResults[0].getValue('internalid'));
        return customerResults[0].getValue('internalid');
    } else {
        nlapiLogExecution('DEBUG', 'SRSWorkflowActions.getCustomerByEmail', 'No customer Found for Email: ' + targetEmail);
        return 0;
    }
}