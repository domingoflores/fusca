/**
 * Module Description
 * Built to be used as a custom workflow action to send emails to groups of people with documents 
 * attached based on the data in the Release Payment Approvals custom record.  
 * This Script is used by the "Release Payment BUTTONS and ACTIONS workflow".
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Sep 2016     Scott			   THIS IS WET
 * 1.00       25 Oct 2016     Scott			   Added sections for Group 6 information.  Added lines 51, 90-96, 105, 368-418
 * 1.00       07 Feb 2017     Scott			   Added the findFinalInstructionsAddressCreateCase() function.  This function creates a case if
 *												finalinstructions@ is one of the email addresses in the group
 *
 * 1.00       22 Feb 2017     Scott			   THIS IS STILL WET
 * 1.00       09 Aug 2017     Scott			   Added "SECURE " to the email subject in the nlapisendemail call so emails sent are secured using Zix
 * 1.00       14 Dec 2017     Scott			   Changed nlapiSendEmail command at the bottom of script to have "notifySenderOnBounce" set to false
 * 1.00       25 Jan 2018     Scott			   Changed nlapiSendEmail command at the bottom of script to have "notifySenderOnBounce" set to true
 *
 */

//Lets Make some logs
var logType = 'DEBUG';

//Get some initial params for this function to even begin to work and make sense
var recType = nlapiGetRecordType();
var recId = nlapiGetRecordId();
var newRec = nlapiGetNewRecord();
//What's the Deal Name that will be used in the subject?  Oh here it is...
var dealName = newRec.getFieldText('custrecord_escrow_payment_deal');

function createCustomEmail(){

	nlapiLogExecution(logType, 'DEBUG 1', 'Just want to see if this function is even called')

	//Lets get the sender email address that will be used in the nlapiSendEmail command
	var senderEmail = newRec.getFieldValue('custrecord_escrow_payment_sender');
	nlapiLogExecution(logType, 'function createCustomEmail', 'senderEmail is' + senderEmail);

	//First lets see what we have for documents
	var document1 = newRec.getFieldValue('custrecord_escrow_payment_doc1');
	var document2 = newRec.getFieldValue('custrecord_escrow_payment_doc2');
	var document3 = newRec.getFieldValue('custrecord_escrow_payment_doc3');
	var document4 = newRec.getFieldValue('custrecord_escrow_payment_doc4');
	var document5 = newRec.getFieldValue('custrecord_escrow_payment_doc5');
	var document6 = newRec.getFieldValue('custrecord_escrow_payment_doc6');

	//Second lets see what we have for email addresses
	var emailGroup1 = newRec.getFieldValue('custrecord_escrow_payment_bank_emails');
	var emailGroup2 = newRec.getFieldValue('custrecord_escrow_payment_buyer_emails');
	var emailGroup3 = newRec.getFieldValue('custrecord_escrow_payments_shrhldr_email');
	var emailGroup4 = newRec.getFieldValue('custrecord_escrow_payment_other_emails');
	var emailGroup5 = newRec.getFieldValue('custrecord_escrow_payment_emails5'); //NAME ERROR
	var emailGroup6 = newRec.getFieldValue('custrecord_escrow_payment_emails6');

	//Third lets see what we have for checkbox values in the Group Docuement Matrix
	//Group 1 Document Checkboxes
	var emailGroup1Doc1 = newRec.getFieldValue('custrecord_escrow_payment_doc1_bank');
	var emailGroup1Doc2 = newRec.getFieldValue('custrecord_escrow_payment_doc2_bank');
	var emailGroup1Doc3 = newRec.getFieldValue('custrecord_escrow_payment_doc3_bank');
	var emailGroup1Doc4 = newRec.getFieldValue('custrecord_escrow_payment_doc4_bank');
	var emailGroup1Doc5 = newRec.getFieldValue('custrecord_escrow_pamment_doc5_bank');
	var emailGroup1Doc6 = newRec.getFieldValue('custrecord_escrow_payment_doc6_bank');
	//Group 2 Document Checkboxes
	var emailGroup2Doc1 = newRec.getFieldValue('custrecord_escrow_payment_doc1_buyer');
	var emailGroup2Doc2 = newRec.getFieldValue('custrecord_escrow_payment_doc2_buyer');
	var emailGroup2Doc3 = newRec.getFieldValue('custrecord_escrow_payment_doc3_buyer');
	var emailGroup2Doc4 = newRec.getFieldValue('custrecord_escrow_payment_doc4_buyer');
	var emailGroup2Doc5 = newRec.getFieldValue('custrecord_escrow_payment_doc5_buyer');
	var emailGroup2Doc6 = newRec.getFieldValue('custrecord_escrow_payment_doc6_buyer');
	//Group 3 Document Checkboxes
	var emailGroup3Doc1 = newRec.getFieldValue('custrecord_escrow_payment_doc1_shrhldr');
	var emailGroup3Doc2 = newRec.getFieldValue('custrecord_escrow_payment_doc2_shrhldr');
	var emailGroup3Doc3 = newRec.getFieldValue('custrecord_escrow_payment_doc3_shrhldr');
	var emailGroup3Doc4 = newRec.getFieldValue('custrecord_escrow_payment_doc4_shrhldr');
	var emailGroup3Doc5 = newRec.getFieldValue('custrecord_escrow_payment_doc5_shrhldr');
	var emailGroup3Doc6 = newRec.getFieldValue('custrecord_escrow_payment_doc6_shrhldr');
	//Group 4 Document Checkboxes
	var emailGroup4Doc1 = newRec.getFieldValue('custrecord_escrow_payment_doc1_other');
	var emailGroup4Doc2 = newRec.getFieldValue('custrecord_escrow_payment_doc2_other');
	var emailGroup4Doc3 = newRec.getFieldValue('custrecord_escrow_payment_doc3_other');
	var emailGroup4Doc4 = newRec.getFieldValue('custrecord_escrow_payment_doc4_other');
	var emailGroup4Doc5 = newRec.getFieldValue('custrecord_escrow_payment_doc5_other');
	var emailGroup4Doc6 = newRec.getFieldValue('custrecord_escrow_payment_doc6_other');
	//Group 5 Document Checkboxes
	var emailGroup5Doc1 = newRec.getFieldValue('custrecord_escrow_payment_doc1_group5');
	var emailGroup5Doc2 = newRec.getFieldValue('custrecord_escrow_payment_doc2_group5');
	var emailGroup5Doc3 = newRec.getFieldValue('custrecord_escrow_payment_doc3_group5');
	var emailGroup5Doc4 = newRec.getFieldValue('custrecord_escrow_payment_doc4_group5');
	var emailGroup5Doc5 = newRec.getFieldValue('custrecord_escrow_payment_doc5_group5');
	var emailGroup5Doc6 = newRec.getFieldValue('custrecord_escrow_payment_doc6_group5');

	//Group 6 Document Checkboxes
	var emailGroup6Doc1 = newRec.getFieldValue('custrecord_escrow_payment_doc1_group6');
	var emailGroup6Doc2 = newRec.getFieldValue('custrecord_escrow_payment_doc2_group6');
	var emailGroup6Doc3 = newRec.getFieldValue('custrecord_escrow_payment_doc3_group6');
	var emailGroup6Doc4 = newRec.getFieldValue('custrecord_escrow_payment_doc4_group6');
	var emailGroup6Doc5 = newRec.getFieldValue('custrecord_escrow_payment_doc5_group6');
	var emailGroup6Doc6 = newRec.getFieldValue('custrecord_escrow_payment_doc6_group6');

	//Here goes the business logic to determine which group gets what documents
	//Lets initialize a document array for each group
	var emailGroup1Docs = [];
	var emailGroup2Docs = [];
	var emailGroup3Docs = [];
	var emailGroup4Docs = [];
	var emailGroup5Docs = [];
	var emailGroup6Docs = [];

	//Build the Group 1 array of Documents
	if(emailGroup1 != ''){

		//Find out which documents this Group needs attached to the email
		if(emailGroup1Doc1 == 'T'){
			if(document1 != ''){
				emailGroup1Docs.push(document1);
			}
		}
		if(emailGroup1Doc2 == 'T'){
			if(document2 != ''){
				emailGroup1Docs.push(document2);
			}
		}
		if(emailGroup1Doc3 == 'T'){
			if(document3 != ''){
				emailGroup1Docs.push(document3);
			}
		}
		if(emailGroup1Doc4 == 'T'){
			if(document4 != ''){
				emailGroup1Docs.push(document4);
			}
		}
		if(emailGroup1Doc5 == 'T'){
			if(document5 != ''){
				emailGroup1Docs.push(document5);
			}
		}
		if(emailGroup1Doc6 == 'T'){
			if(document6 != ''){
				emailGroup1Docs.push(document6);
			}
		}
		
		//Take the array of documents, loop through the array and load each file and then create an array of loaded files
		var emailGroup1DocsLength = emailGroup1Docs.length;
		var documentsArrayGroup1 = [];
		
		for (var i = 0; i < emailGroup1DocsLength; i++) {
			documentsArrayGroup1.push(nlapiLoadFile(emailGroup1Docs[i]));
		}

		//Format the email addresses into an array
		var emailAddresses = createEmailByGroup(emailGroup1);

		//Get the body of the message for this Group
		var emailBodyGroup1 = newRec.getFieldValue('custrecord_escrow_payment_message1');

		//Time to send the email for Group 1
		sendCustomEmail(senderEmail, emailAddresses, documentsArrayGroup1, dealName + ' - Release Instruction', emailBodyGroup1, emailGroup1Docs);
	}

	//Build the Group 2 array of Documents
	if(emailGroup2 != ''){
		
		if(emailGroup2Doc1 == 'T'){
			if(document1 != ''){
				emailGroup2Docs.push(document1);
			}
		}
		if(emailGroup2Doc2 == 'T'){
			if(document2 != ''){
				emailGroup2Docs.push(document2);
			}
		}
		if(emailGroup2Doc3 == 'T'){
			if(document3 != ''){
				emailGroup2Docs.push(document3);
			}
		}
		if(emailGroup2Doc4 == 'T'){
			if(document4 != ''){
				emailGroup2Docs.push(document4);
			}
		}
		if(emailGroup2Doc5 == 'T'){
			if(document5 != ''){
				emailGroup2Docs.push(document5);
			}
		}
		if(emailGroup2Doc6 == 'T'){
			if(document6 != ''){
				emailGroup2Docs.push(document6);
			}
		}

		//Take the array of documents, loop through the array and load each file and then create an array of loaded files
		var emailGroup2DocsLength = emailGroup2Docs.length;
		var documentsArrayGroup2 = [];
		
		for (var i = 0; i < emailGroup2DocsLength; i++) {
			documentsArrayGroup2.push(nlapiLoadFile(emailGroup2Docs[i]));
		}
		
		//Format the email addresses into an array
		var emailAddresses = createEmailByGroup(emailGroup2);

		//Get the body of the message for this Group
		var emailBodyGroup2 = newRec.getFieldValue('custrecord_escrow_payment_message2');

		//Time to send the email for Group 2
		sendCustomEmail(senderEmail, emailAddresses, documentsArrayGroup2, dealName + ' - Release Instruction', emailBodyGroup2, emailGroup2Docs);
	}

	//Build the Group 3 array of Documents
	if(emailGroup3 != ''){
		
		if(emailGroup3Doc1 == 'T'){
			if(document1 != ''){
				emailGroup3Docs.push(document1);
			}
		}
		if(emailGroup3Doc2 == 'T'){
			if(document2 != ''){
				emailGroup3Docs.push(document2);
			}
		}
		if(emailGroup3Doc3 == 'T'){
			if(document3 != ''){
				emailGroup3Docs.push(document3);
			}
		}
		if(emailGroup3Doc4 == 'T'){
			if(document4 != ''){
				emailGroup3Docs.push(document4);
			}
		}
		if(emailGroup3Doc5 == 'T'){
			if(document5 != ''){
				emailGroup3Docs.push(document5);
			}
		}
		if(emailGroup3Doc6 == 'T'){
			if(document6 != ''){
				emailGroup3Docs.push(document6);
			}
		}

		//Take the array of documents, loop through the array and load each file and then create an array of loaded files
		var emailGroup3DocsLength = emailGroup3Docs.length;
		var documentsArrayGroup3 = [];
		
		for (var i = 0; i < emailGroup3DocsLength; i++) {
			documentsArrayGroup3.push(nlapiLoadFile(emailGroup3Docs[i]));
		}
		
		//Format the email addresses into an array
		var emailAddresses = createEmailByGroup(emailGroup3);

		//Get the body of the message for this Group
		var emailBodyGroup3 = newRec.getFieldValue('custrecord_escrow_payment_message3');

		//Time to send the email for Group 3
		sendCustomEmail(senderEmail, emailAddresses, documentsArrayGroup3, dealName + ' - Release Instruction', emailBodyGroup3, emailGroup3Docs);
	}

	//Build the Group 4 array of Documents
	if(emailGroup4 != ''){
		
		if(emailGroup4Doc1 == 'T'){
			if(document1 != ''){
				emailGroup4Docs.push(document1);
			}
		}
		if(emailGroup4Doc2 == 'T'){
			if(document2 != ''){
				emailGroup4Docs.push(document2);
			}
		}
		if(emailGroup4Doc3 == 'T'){
			if(document3 != ''){
				emailGroup4Docs.push(document3);
			}
		}
		if(emailGroup4Doc4 == 'T'){
			if(document4 != ''){
				emailGroup4Docs.push(document4);
			}
		}
		if(emailGroup4Doc5 == 'T'){
			if(document5 != ''){
				emailGroup4Docs.push(document5);
			}
		}
		if(emailGroup4Doc6 == 'T'){
			if(document6 != ''){
				emailGroup4Docs.push(document6);
			}
		}

		//Take the array of documents, loop through the array and load each file and then create an array of loaded files
		var emailGroup4DocsLength = emailGroup4Docs.length;
		var documentsArrayGroup4 = [];
		
		for (var i = 0; i < emailGroup4DocsLength; i++) {
			documentsArrayGroup4.push(nlapiLoadFile(emailGroup4Docs[i]));
		}
		
		//Format the email addresses into an array
		var emailAddresses = createEmailByGroup(emailGroup4);

		//Get the body of the message for this Group
		var emailBodyGroup4 = newRec.getFieldValue('custrecord_escrow_payment_message4');

		//Time to send the email for Group 4
		sendCustomEmail(senderEmail, emailAddresses, documentsArrayGroup4, dealName + ' - Release Instruction', emailBodyGroup4, emailGroup4Docs);
	}

	//Build the Group 5 array of Documents
	if(emailGroup5 != ''){
		
		if(emailGroup5Doc1 == 'T'){
			if(document1 != ''){
				emailGroup5Docs.push(document1);
			}
		}
		if(emailGroup5Doc2 == 'T'){
			if(document2 != ''){
				emailGroup5Docs.push(document2);
			}
		}
		if(emailGroup5Doc3 == 'T'){
			if(document3 != ''){
				emailGroup5Docs.push(document3);
			}
		}
		if(emailGroup5Doc4 == 'T'){
			if(document4 != ''){
				emailGroup5Docs.push(document4);
			}
		}
		if(emailGroup5Doc5 == 'T'){
			if(document5 != ''){
				emailGroup5Docs.push(document5);
			}
		}
		if(emailGroup5Doc6 == 'T'){
			if(document6 != ''){
				emailGroup5Docs.push(document6);
			}
		}

		//Take the array of documents, loop through the array and load each file and then create an array of loaded files
		var emailGroup5DocsLength = emailGroup5Docs.length;
		var documentsArrayGroup5 = [];
		
		for (var i = 0; i < emailGroup5DocsLength; i++) {
			documentsArrayGroup5.push(nlapiLoadFile(emailGroup5Docs[i]));
		}
		
		//Format the email addresses into an array
		var emailAddresses = createEmailByGroup(emailGroup5);

		//Get the body of the message for this Group
		var emailBodyGroup5 = newRec.getFieldValue('custrecord_escrow_payment_message5');

		//Time to send the email for Group 5
		sendCustomEmail(senderEmail, emailAddresses, documentsArrayGroup5, dealName + ' - Release Instruction', emailBodyGroup5, emailGroup5Docs);
	}

	//Build the Group 6 array of Documents
	if(emailGroup6 != ''){
		
		if(emailGroup6Doc1 == 'T'){
			if(document1 != ''){
				emailGroup6Docs.push(document1);
			}
		}
		if(emailGroup6Doc2 == 'T'){
			if(document2 != ''){
				emailGroup6Docs.push(document2);
			}
		}
		if(emailGroup6Doc3 == 'T'){
			if(document3 != ''){
				emailGroup6Docs.push(document3);
			}
		}
		if(emailGroup6Doc4 == 'T'){
			if(document4 != ''){
				emailGroup6Docs.push(document4);
			}
		}
		if(emailGroup6Doc5 == 'T'){
			if(document5 != ''){
				emailGroup6Docs.push(document5);
			}
		}
		if(emailGroup5Doc6 == 'T'){
			if(document6 != ''){
				emailGroup6Docs.push(document6);
			}
		}

		//Take the array of documents, loop through the array and load each file and then create an array of loaded files
		var emailGroup6DocsLength = emailGroup6Docs.length;
		var documentsArrayGroup6 = [];
		
		for (var i = 0; i < emailGroup6DocsLength; i++) {
			documentsArrayGroup6.push(nlapiLoadFile(emailGroup6Docs[i]));
		}
		
		//Format the email addresses into an array
		var emailAddresses = createEmailByGroup(emailGroup6);

		//Get the body of the message for this Group
		var emailBodyGroup6 = newRec.getFieldValue('custrecord_escrow_payment_message6');

		//Time to send the email for Group 6
		sendCustomEmail(senderEmail, emailAddresses, documentsArrayGroup6, dealName + ' - Release Instruction', emailBodyGroup6, emailGroup6Docs);
	}

}
 

function createEmailByGroup(groupEmails) {
	
	groupEmails = groupEmails.replace( /\s/g, "");

	var emailArray = new Array();
		emailArray = groupEmails.split(",");

	return emailArray;
	
}

function getSenderEmailAddress(senderEmail){

	if(senderEmail != ''){
		var senderEmployeeRecord = nlapiLoadRecord('employee', senderEmail);
		var senderEmailAddress = senderEmployeeRecord.getFieldValue('email');
		return senderEmailAddress;
	
	}else{
		//Do Nothing, you have wasted my time
	}

}

//This function is self explanatory.  But just in case you don't have 4 years of experience at SRS, this function will search the
//emailGroup that is passed in to try and find the finalinstructions@ email address
//If found, then this function will create a case and categorize the case for Final Instructions.
//This function also takes on the awesome task of searching for any documents / files that need to be included in the Case, 
//and associate those files to the case through the creation of a Message record as a Line Item to the case.
//Also, we create a Link to the RAP record and add it to the body of the message so the Ops Analysts can get to the RAP record
//to view the files / documents. 
function findFinalInstructionsAddressCreateCase(emailArray, documentIDsArray, subject, body){

	var emailArrayJoin = emailArray.join(',').toLowerCase(); //set the email addresses to ALL lowercase

	if(emailArrayJoin.indexOf('finalinstructions@') > -1){       	
    	var newCase = nlapiCreateRecord('supportcase'); //Create the New Case
	    	//Set the fields in the new case
	    	newCase.setFieldValue('title', dealName + ' Release Instructions');
	    	newCase.setFieldText('company', dealName);
	    	newCase.setFieldValue('custevent_case_department', 35); //Acquiom Operations
	    	newCase.setFieldValue('custevent_case_queue', 79); //Final Instructions
	    	newCase.setFieldValue('custevent_case_category', 361); //Miscellaneous
	    	newCase.setFieldValue('assigned', 446983); //Sue Milberger

    	var newCaseID = nlapiSubmitRecord(newCase, 'false', 'true');

    	var rapURL = nlapiResolveURL('RECORD', recType, recId, 'VIEW'); //Create a link to the RAP Record in the message body
    	var rapLink = '<a href='+rapURL+'>Associated Release Approval Record - ID '+recId+'</a><br><br>';
    		body =  rapLink + body;

    	var msgRecord = nlapiCreateRecord('message'); //creating new message record
			msgRecord.setFieldValue('activity', newCaseID); // links message to support case
			msgRecord.setFieldValue('message', body);
			msgRecord.setFieldValue( 'subject', subject);

			for (var i = 0; i < documentIDsArray.length; i++) {
				
				nlapiLogExecution(logType, 'findFinalInstructionsAddressCreateCase FUNCTION', 'FOR LOOP!!! documentIDsArray[i] is ' + documentIDsArray[i]); 
				msgRecord.selectNewLineItem('mediaitem'); 
				msgRecord.setCurrentLineItemValue('mediaitem','mediaitem', documentIDsArray[i]);
				msgRecord.commitLineItem('mediaitem');
				
			}
			
		nlapiSubmitRecord(msgRecord); 

    	nlapiLogExecution(logType, 'findFinalInstructionsAddressCreateCase FUNCTION', 'FOUND IT!!! emailArray is ' + emailArray);
    	nlapiLogExecution(logType, 'findFinalInstructionsAddressCreateCase FUNCTION', 'FOUND IT!!! newCaseID is ' + newCaseID);
    	//nlapiLogExecution(logType, 'searchEmailsForFinalInstructionsAddress FUNCTION', 'FOUND IT!!! documentsArray is ' + documentString);
	}else{
    	
    	nlapiLogExecution(logType, 'findFinalInstructionsAddressCreateCase FUNCTION', 'DID NOT FIND IT!!! This is embarassing.  Just please move along.  Nothing to See Here.');
	}

}

function sendCustomEmail(senderEmail, emailAddresses, documentsArray, subject, body, documentIDsArray){
	nlapiLogExecution(logType, 'function sendCustomEmail', 'senderEmail is' + senderEmail);

	//The cc and the replyTo will be set to the email address on the employee record listed as the Sender Email on the release record
	var ccEmail = getSenderEmailAddress(senderEmail);
	var replyTo = ccEmail;

	//Lets send that email out to the Awesome customers we have...  WooHoo!!!
	//NEED a way to put in a template so that we can brand this, but which template do we need to use?
	nlapiLogExecution(logType, 'senderEmail is ', senderEmail);
	nlapiLogExecution(logType, 'cc is ', ccEmail);
	nlapiLogExecution(logType, 'replyTo is ', replyTo);

	nlapiSendEmail(senderEmail, emailAddresses, "SECURE " + subject, body, ccEmail, null, {"recordtype": "customrecord_escrow_payment_approvals", "record": recId}, documentsArray, true, false, replyTo);

	//NEED TO CALL searchEmailsForFinalInstructionsAddress AND CREATE THE CASE RIGHT IN THAT FUNCTION
	findFinalInstructionsAddressCreateCase(emailAddresses, documentIDsArray, subject, body);
}


