/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSContactCustomerUtils.js 
* @ AUTHOR        : Steven C. Buttgereit
* @ DATE          : 2011/12/02
*
* Copyright (c) 2011 Shareholder Representative Services LLC
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/***********************************
 **
 **  getContactByEmail: This function allows for the retrieval of a contact record internal id by 
 **                     a given email string.
 **/
function getContactByEmail(targetEmail) {

	nlapiLogExecution('DEBUG','SRSWorkflowActions.getContactEmail','Starting function call with email: '+targetEmail);
	//search for the contact.
	var contactResults = null;
	var contactFilters = new Array();
	var contactColumns = new Array();
	
	contactFilters[0] = new nlobjSearchFilter('email',null,'is',targetEmail);
	
	contactColumns[0] = new nlobjSearchColumn('internalid');
	
	contactResults = nlapiSearchRecord('contact',null,contactFilters,contactColumns);
	
	if(contactResults != null) {
		nlapiLogExecution('DEBUG','SRSWorkflowActions.getContactEmail','Found Result Contact Internal ID: '+contactResults[0].getValue('internalid'));
		return contactResults[0].getValue('internalid');
	} else {
	    nlapiLogExecution('DEBUG','SRSWorkflowActions.getContactEmail','No Contact Found for Email: '+targetEmail);
	    return null;
	}
}


/***********************************
 **
 **  getPrimaryCompanyByContact: This function returns the primary company associated with
 **                              a given Contact record.
 **/
function getPrimaryCompanyByContact(targetContactId) {
	
	//Next get the contact record.
	var targetContact = nlapiLoadRecord('contact',targetContactId);
	
	//Finally return the contact's primary company, if they have one otherwise, 0.
	if(targetContact != null && targetContact.getFieldValue('company') != null && targetContact.getFieldValue('company') > 0) {
		return targetContact.getFieldValue('company');
	} else {
		return null;
	}
}

/***********************************
 **
 **  getContactByEmail: This function allows for the retrieval of a contact record internal id by 
 **                     a given email string.
 **/
function getCustomerByEmail(targetEmail) {

	if(targetEmail == null || targetEmail == '') {
		nlapiLogExecution('DEBUG','SRSWorkflowActions.getCustomerByEmail','No email provided.');
	    return null;
	}
	nlapiLogExecution('DEBUG','SRSWorkflowActions.getCustomerByEmail','Starting function call with email: '+targetEmail);
	//search for the customer.
	var customerResults = null;
	var customerFilters = new Array();
	var customerColumns = new Array();
	
	customerFilters[0] = new nlobjSearchFilter('email',null,'is',targetEmail);
	
	customerColumns[0] = new nlobjSearchColumn('internalid');
	
	customerResults = nlapiSearchRecord('customer',null,customerFilters,customerColumns);
	
	if(customerResults != null) {
		nlapiLogExecution('DEBUG','SRSWorkflowActions.getCustomerByEmail','Found Result customer Internal ID: '+customerResults[0].getValue('internalid'));
		return customerResults[0].getValue('internalid');
	} else {
	    nlapiLogExecution('DEBUG','SRSWorkflowActions.getCustomerByEmail','No customer Found for Email: '+targetEmail);
	    return null;
	}
}