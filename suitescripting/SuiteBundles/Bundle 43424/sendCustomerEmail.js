
/**************************************************************************
Script creates a custom record merge and sends an email to Deal Contacts in
a given search.

Created By: Quantix
Date Created: 8.1.13(PRW)
Last Modified: 

***************************************************************************/

function ASsendTemplateEmail(type){
	
	if (type == 'delete') return; // Do not run on delete
	
	var sendEmailRec = nlapiLoadRecord('customrecord_qx_sendcustomeremail', nlapiGetRecordId()); //+5
	
	var sendPreview = sendEmailRec.getFieldValue('custrecord_qx_sce_sendsample');
	var sendEmail = sendEmailRec.getFieldValue('custrecord_qx_sce_sendemail');
	var sendEmailInProgress = sendEmailRec.getFieldValue('custrecord_qx_sce_sendinginprogress');
	var template = sendEmailRec.getFieldValue('custrecord_qx_sce_selecttemplate');

	// Send Preview if marked to send preview email
	if (sendPreview == 'T') {
		
		nlapiLogExecution('DEBUG', 'Sending Preview Email');
		
		var context = nlapiGetContext();
		var userEmail = context.getEmail();
		var author = sendEmailRec.getFieldValue('custrecord_qx_sce_emailauthor');
		
		// Run Search and get first result for sample email
		var recipientsList = getRecipients(sendEmailRec);
		var firstRecipient = recipientsList.getResults(0,1)[0]; //+10
		
		// Merge with template and send email
		var emailObject = nlapiMergeRecord(template, 'customrecord_qx_sendcustomeremail', sendEmailRec.getId(), 'contact', firstRecipient.getValue('custrecord60')); //+10
		nlapiSendEmail(author, userEmail, emailObject.getName() + ' (To: ' + firstRecipient.getValue('email', 'custrecord60') + ')', emailObject.getValue()); //+10
	
		nlapiLogExecution('DEBUG', 'Successfully sent Preview Email');
	
		// Unmark Preview box so it can be checked later
		nlapiSubmitField('customrecord_qx_sendcustomeremail', sendEmailRec.getId(), 'custrecord_qx_sce_sendsample', 'F');

	}
	
	
	// Send Email if marked to send email
	if (sendEmail == 'T' && sendEmailInProgress != 'T') {

		// Schedule Email to Send
		var schStatus = nlapiScheduleScript('customscript_qx_sendtemplateemail_sch', null, {custscript_qx_ste_emailrecid: sendEmailRec.getId()}); // +20

		if (schStatus == 'QUEUED'){
			nlapiLogExecution('DEBUG', 'Script Scheduled', 'Script has been scheduled for execution');
			
			// Mark the email "In Progress" box so it can be checked later
			nlapiSubmitField('customrecord_qx_sendcustomeremail', sendEmailRec.getId(), 'custrecord_qx_sce_sendinginprogress', 'T');
			
		} else {
			nlapiLogExecution('ERROR', 'Script NOT Scheduled', 'Scheduled Status: ' + schStatus);
			throw nlapiCreateError('NOTICE', 'Script could not schedule emails to be sent, please ' +
				'try again in a few minutes. Please note that only 5 emails can be scheduled at the ' +
				'same time. The first one must finish before any more can be initiated. Any changes that ' + 
				'that were made to the Customer Email Record have been saved.', true);
		}	
	}
}


function SCHsendTemplateEmail(){

	// Begin Scheduled mass template email
	var context = nlapiGetContext();
	var sendEmailRecId = context.getSetting('SCRIPT', 'custscript_qx_ste_emailrecid');
	
	nlapiLogExecution('DEBUG', 'Mass template email started for Customer Email Record: ' + sendEmailRecId);
	
	var sendEmailRec = nlapiLoadRecord('customrecord_qx_sendcustomeremail', sendEmailRecId); //+5
	var template = sendEmailRec.getFieldValue('custrecord_qx_sce_selecttemplate');
	var author = sendEmailRec.getFieldValue('custrecord_qx_sce_emailauthor'); 
	
	
	// Get Recipients and Loop through each
	var recipientsListResultsSet = getRecipients(sendEmailRec);
	
	var resultsPage = 1;
	var recordsPerPass = 450;
	var fixedUnitsRequired = 25;
	var perEmailUnitsRequired = 20;
	var recipientsList = recipientsListResultsSet.getResults((resultsPage - 1) * recordsPerPass, resultsPage * recordsPerPass); // +10
	
	while (recipientsList != null && recipientsList.length != 0) {

		var nextRec;
		
		// Determine if there are enough units to process the next page of emails
		var unitsLeft = context.getRemainingUsage();
		if (unitsLeft < fixedUnitsRequired + (recordsPerPass * perEmailUnitsRequired)) {
			try{ throw 'Dummy Error'; } catch (noop) { } // Needed to handle bug with nlapiYieldScript()
		
			var state = nlapiYieldScript(); 
			if (state.status == 'FAILURE') {
				nlapiLogExecution('ERROR', 'Failed to yield script', 'Last Email Sent to Contact: ' + 
					((nextRec) ? nextRec.getValue('custrecord60') : 'None') + ' (Internal ID)\nReason: ' + state.reason + 
					', Size: ' + state.size + ', Information: ' + state.information);
				throw "Failed to yield script";
			} else if ( state.status == 'RESUME' ) {
				nlapiLogExecution('AUDIT', 'Resuming script.  Size: ' + state.size);
			}
			// state.status will never be SUCCESS because a success would imply a yield has occurred - the equivalent response would be yield
		}
		
		// Send emails for this page of results
		nlapiLogExecution('DEBUG', 'Initiating email to ' + recipientsList.length + ' deal contacts');
				
		for (var i = 0; i < recipientsList.length; i++) {
			nextRec = recipientsList[i];

			// Attach email to records
			var attTo = new Object();
			attTo['recordtype'] = 'customrecord_qx_sendcustomeremail';
			attTo['record'] = sendEmailRec.getId();
		
			// Merge with template and send email
			try {
				var emailObject = nlapiMergeRecord(template, 'customrecord_qx_sendcustomeremail', sendEmailRec.getId(), 'contact', nextRec.getValue('custrecord60')); //+10
				nlapiSendEmail(author, nextRec.getValue('custrecord60'), emailObject.getName(), emailObject.getValue(), null, null, attTo); //+10
				
			} catch (e) {
				var errResponse = 'Email: ' + sendEmailRec.getFieldText('custrecord_qx_sce_customeremail') + ' (' + sendEmailRec.getId()
					+ ')\nContact: ' + nextRec.getValue('entityid', 'custrecord60') + ' (' + nextRec.getValue('custrecord60') + ')\nCustomer: ' + 
					sendEmailRec.getFieldText('custrecord_qx_sce_customer') + ' (' + sendEmailRec.getFieldValue('custrecord_qx_sce_customer') + ')';
				if (e instanceof nlobjError) errResponse += '\n' + e.getCode() + ": " + e.getDetails();
				else errResponse += '\n' + e.toString();
				nlapiLogExecution('ERROR', 'Failed to Merge and Send Email', errResponse);
			}
		}
		
		resultsPage++;
		recipientsList = recipientsListResultsSet.getResults((resultsPage - 1) * recordsPerPass, resultsPage * recordsPerPass); // +10
		
	}

	nlapiLogExecution('DEBUG', 'Completed sending emails');

	// Record Sent Date and Unmark Email and "In Progress" boxes
	sendEmailRec.setDateTimeValue('custrecord_qx_sce_sentdate', nlapiDateToString(new Date(), 'datetimetz'));
	sendEmailRec.setFieldValue('custrecord_qx_sce_sendinginprogress', 'F');
	sendEmailRec.setFieldValue('custrecord_qx_sce_sendemail', 'F');
	
	// Submit Modified Email Record
	try {
		nlapiSubmitRecord(sendEmailRec, false, true); //+10
		nlapiLogExecution('DEBUG', 'Successfully Updated Email Record');
	} catch (e) {
		var errResponse = 'Email Record: ' + sendEmailRec.getId();
		if (e instanceof nlobjError) errResponse += '\n' + e.getCode() + ": " + e.getDetails();
		else errResponse += '\n' + e.toString();
		nlapiLogExecution('ERROR', 'Failed to Update Email Record', errResponse);
	}
}




function getRecipients(sendEmailRec){
	
	// Get Search
	var searchID = sendEmailRec.getFieldValue('custrecord_qx_sce_recipientsgroup');
	var recipientsSearch = nlapiLoadSearch(null, searchID); //+5

	// Filter By Customer
	recipientsSearch.addFilter(new nlobjSearchFilter('custrecord59', null, 'anyof', sendEmailRec.getFieldValue('custrecord_qx_sce_customer')));
	recipientsSearch.addFilter(new nlobjSearchFilter('custrecord_qx_disablecustomeremails', null, 'is', 'F'));
	
	recipientsSearch.addColumn(new nlobjSearchColumn('email', 'custrecord60'));
	recipientsSearch.addColumn(new nlobjSearchColumn('custrecord60')); // Contact ID
	recipientsSearch.addColumn(new nlobjSearchColumn('entityid', 'custrecord60')); // Contact Name
	
	// Return Results
	return recipientsSearch.runSearch();
	
}