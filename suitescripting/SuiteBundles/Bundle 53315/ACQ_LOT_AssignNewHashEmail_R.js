/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.01       08 Jun 2014     smccurry		   Installed on production.
 * 1.02       12 Jun 2014     smccurry		   Fixed bugs
 * 1.03		  26 Jun 2014     smccurry   	   Changed lines 247-250 to use nlapiLoadRecord instead of nlapiSubmitFields
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */

function processNewHashEmail(dataIn) {
//	nlapiLogExecution('DEBUG', 'Test', 'START RESTLET JSON dataIn: ' + JSON.stringify(dataIn));
	var msg = new ERROR_MESSAGES();
	var responseObj = {};
	msg.setStatusSuccess();
	responseObj.msg = msg;
	
	var exRecID = dataIn.txnid;
	if(exRecID != null && exRecID != '') {
		try {
			var exRec = nlapiLoadRecord('customrecord_acq_lot', exRecID);
			var sholderEmail = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldemail');
			var contactID = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_contact');
			var contact;
			if(contactID != null && contactID != '') {
				contact = nlapiLoadRecord('contact', contactID);
			} else {
				contactID = searchReturnContact(exRecID);
				contact = nlapiLoadRecord('contact', contactID);
			}
			var contactName = contact.getFieldValue('entityid');
			var dealEmail = exRec.getFieldValue('custrecord_qx_acq_loth_dealemail');
			var oldSholderURL = exRec.getFieldValue('custrecord_qx_acq_loth_url');
		} catch (e) {
			var err = e;
//			nlapiLogExecution('ERROR', 'Load Exchange Record and Contact Record', );
		}
		
	}
	
    if(dealEmail == null || dealEmail == '') {
    	dealEmail = 'support@shareholderrep.com';
    }
	
	if(dataIn.calltype == 'resethash') {
		try {
			responseObj = attachExchangeRecordtoHash(null, dataIn.hashid, dataIn.txnid, dataIn.userid, dataIn.calltype);
			return responseObj;
		} catch (e) {
			var err = e;
//			nlapiLogExecution('ERROR', 'dataIn.calltype == "resethash"', JSON.stringify(err));
			msg.addMessage('Problem initiating function attachExchangeRecordtoHash() in the Restlet processNewHashEmail()');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	} 
	if(dataIn.calltype == 'previewemailbeforereset') {
		try {
//			sendEmailCustomerWorkflow(exRecID);
			var emailObj = previewEmailBeforeTemplate(exRecID, sholderEmail, contactName, dealEmail, oldSholderURL);
			responseObj.emailBody = emailObj.body;
			responseObj.subject = emailObj.subject;
			responseObj.sholderEmail = sholderEmail;
			responseObj.contactName = contactName;
			responseObj.dealEmail = dealEmail;
			return responseObj;
		} catch (e) {
			var err = e;
//			nlapiLogExecution('ERROR', 'dataIn.calltype == "previewemailbeforereset"', JSON.stringify(err));
			msg.addMessage('Problem initiating function previewEmailBeforeTemplate() in the Restlet processNewHashEmail()');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	}
	if(dataIn.calltype == 'previewemailafterreset') {
		try {
			var emailObj = previewEmailAfterTemplate(exRecID, sholderEmail, contactName, dealEmail, oldSholderURL);
			responseObj.emailBody = emailObj.body;
			responseObj.subject = emailObj.subject;
			responseObj.sholderEmail = sholderEmail;
			responseObj.contactName = contactName;
			responseObj.dealEmail = dealEmail;
			return responseObj;
		} catch (e) {
			var err = e;
//			nlapiLogExecution('ERROR', 'dataIn.calltype == "previewemailafterreset"', JSON.stringify(err));
			msg.addMessage('Problem initiating function previewEmailAfterTemplate() in the Restlet processNewHashEmail()');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	}
	if(dataIn.calltype == 'sendemail') {
		try {
			responseObj.emailSuccess = sendEmailCustomerScripted(dataIn);
			return responseObj;
		} catch (e) {
			var err = e;
//			nlapiLogExecution('ERROR', 'dataIn.calltype == "sendemail"', JSON.stringify(err));
			msg.addMessage('Problem initiating function sendEmailCustomerScripted() in the Restlet processNewHashEmail()');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	}
	if(dataIn.calltype == 'resetsendemail') {
		try {
			responseObj = attachExchangeRecordtoHash(null, dataIn.hashid, dataIn.txnid, dataIn.userid, dataIn.calltype);
			// Reload the record after submitting it to get new hash
			var exRec = nlapiLoadRecord('customrecord_acq_lot', exRecID);
			//Load oldHash and newHash from the attachExchangeRecordtoHash that just completed.
			dataIn.newHash = responseObj.newHash;
			dataIn.oldHash = responseObj.oldHash;
			//Load contactName from beginning of this script since it should not have changed.
			dataIn.contactName = contactName;
			dataIn.dealEmail = exRec.getFieldValue('custrecord_qx_acq_loth_dealemail');
			dataIn.newSholderURL = exRec.getFieldValue('custrecord_qx_acq_loth_url');
			responseObj.emailSuccess = resetSendEmailCustomerScripted(dataIn);
			return responseObj;
		} catch (e) {
			var err = e;
//			nlapiLogExecution('ERROR', 'dataIn.calltype == "resetsendemail"', JSON.stringify(err));
			msg.addMessage('Problem initiating function sendEmailCustomerWorkflow() in the Restlet processNewHashEmail()');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	}
	return responseObj;
}

function attachExchangeRecordtoHash(type, hashRecID, exRecID, userID, calltype) {
	nlapiLogExecution('DEBUG', 'attachExchangeRecordtoHash()', 'START');
	var responseObj = {};
	responseObj.calltype = calltype;
	var msg = new ERROR_MESSAGES();
	responseObj.msg = msg;
	msg.setStatusSuccess();
	responseObj.msg = msg;
	
	var userName = getUserName(userID);
	var d = new Date();
	var dateTime = nlapiDateToString(d, 'datetime');
	var exRecArray = [];
	/* IF there IS a hash record attached to the current exchange record, then
	 * load that record, remove contact, and set inactive.  Also assign the variables 
	 * of the oldHash and oldHashId to be used later in the report.
	 * ELSE there would be no hash
	 */
	if(hashRecID != null && hashRecID != 'null' && hashRecID !='') { 
		// Search for ex records that need to have their hash removed
		exRecArray = removeHashRecordSetInactive(type, hashRecID, exRecID, dateTime);
		/* If there were some ex records that should have a this hash but are empty
		* they would not be picked up by the above search so add the search
		* based on deal and contact */
		var additionalRecords = searchExchangeRecordsThatMatchDealandContact(exRecID);
		// Then use the unique prototype to merge the two arrays without duplicates.
		exRecArray = exRecArray.concat(additionalRecords).unique();
		
		
		responseObj.oldHash = nlapiLookupField('customrecord_acq_exchange_hash', hashRecID, 'name');
		responseObj.oldHashId = hashRecID;
	} else {
		// TODO: (smccurry 06/11/14) Need to fix this.  If the variable hashRecID is empty (but should not be) then the above IF statement will not mark inactive the old hash record.
		// This search returns an array of the exchange records that match the deal and contact.
		exRecArray = searchExchangeRecordsThatMatchDealandContact(exRecID);
	}
	if(exRecArray == null || exRecArray.length == 0) {
		exRecArray.push(exRecID);
	}
	nlapiLogExecution('DEBUG', 'removeHashRecordSetInactive()', 'COMPLETE');
	/* Take the array of exchange records that need a hash assigned (exRecArray)
	 * perform a search for unassigned hashes based on the criteria of 
	 * Deal link is empty, contact is empty, and isinactive is false.
	 * 
	 */
	if(exRecArray != null && exRecArray != '') {
		nlapiLogExecution('DEBUG', 'attachExchangeRecordtoHash', 'START');
		// Search for any exchange records that do not have an exchange hash assigned and then assign one.
		
		// Load values needed throughout script
		var exRec = nlapiLoadRecord('customrecord_acq_lot',exRecID);
		var deal = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_deal');
		var exRecContact = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_contact');

		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'anyof', '@NONE@');
		filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		filters[2] = new nlobjSearchFilter('custrecord_acq_hash_contact', null, 'anyof', '@NONE@');
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('name');
		columns[1] = new nlobjSearchColumn('custrecord_acq_hash_deal_link');
		columns[2] = new nlobjSearchColumn('custrecord_acq_hash_contact');
		var unassignedHashRecords = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
		// TODO: Need error handling in case there are not any hash records returns from the above search.
		if(unassignedHashRecords == null) {
			msg.addMessage('No empty hash records found in search.');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
		var newHashNumber = unassignedHashRecords[0].getId();
		// Assign hash to the LOT / Exchange record by
		// Assign hashRec to Exchange Record and Exchange Record to hash record
		var newHashLogMsg;
		if(newHashNumber != null && newHashNumber != '') {
			// Order of this section is important
			hashRec = nlapiLoadRecord('customrecord_acq_exchange_hash', newHashNumber);
			hashRec.setFieldValue('custrecord_acq_hash_deal_link', deal);
			if(exRecContact != null && exRecContact != '') {
				hashRec.setFieldValue('custrecord_acq_hash_exch_email', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldemail')); //nlapiLookupField('customer', exRecContact, 'email')
				hashRec.setFieldValue('custrecord_acq_hash_contact', exRecContact);
				if(responseObj.oldHash) {
					newHashLogMsg = dateTime + ' by user ' + userName + ' - This hash record replaced a previous hash number: ' + responseObj.oldHash;
				} else {
					newHashLogMsg = dateTime + ' by user ' + userName + ' - This hash record was added to an empty field.';
				}
				var hashLog = hashRec.getFieldValue('custrecord_acq_hash_log_details');
				if(hashLog != null && hashLog != '') {
					hashRec.setFieldValue('custrecord_acq_hash_log_details', hashLog + '\n' + newHashLogMsg);
				} else {
					hashRec.setFieldValue('custrecord_acq_hash_log_details', newHashLogMsg);
				}
				if(msg.returnMessages.length > 0) {
					msg.setStatusError();
					responseObj.msg = msg;
    				return responseObj;
    			};
				try {
					var hashID = nlapiSubmitRecord(hashRec);
					responseObj.newHash = hashRec.getFieldValue('name');
					responseObj.newHashId = hashID;
				} catch (e) {
					var err = e;
					msg.addMessage(JSON.stringify(err));
					msg.setStatusError();
					responseObj.msg = msg;
				}
			} else {
				msg.addMessage("ERROR: Your request cannot be completed, there were no empty hashes found to attach. Please generate some hashes and try again.");
				msg.setStatusError();
				responseObj.msg = msg;
			}
		} else {
			// TODO: else condition
		}
		/* This loops through the exchange records array (if multiple found that also have same hash to replace).
		 * And this also creates a new array (updatedExRecArray) that stores the exchange record id that were
		 * successfully submitted.
		 * TODO: Add a catch for the records that failed to submit so we know which ones may need to be undone.
		 */
		var updatedExRecArray = [];
		var failedExRecordsArray = exRecArray;
		var completedRecords = '';
		var failedRecords = null;
		nlapiLogExecution('DEBUG', 'exRecArray', exRecArray.length);
		
		for (var hLoop = 0; hLoop < exRecArray.length; hLoop++ ) {
			var exchangeRecord = exRecArray[hLoop];
				var exRec = nlapiLoadRecord('customrecord_acq_lot', exRecArray[hLoop]);
				exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash', newHashNumber);
				exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_identcode', hashRec.getFieldValue('name'));
				exRecId = nlapiSubmitRecord(exRec);
				completedRecords += exRecId + ' ';
				updatedExRecArray.push(exRecId);
		}
		if(updatedExRecArray.length != exRecArray.length) {
			nlapiLogExecution('ERROR', 'Failed or Partial Submit on For Loop', 'There was a problem submitting exchange record(s)');
			msg.addMessage("ERROR: There was a problem submitting exchange record(s)");
			msg.setStatusError();
			responseObj.msg = msg;
		}
		nlapiLogExecution('DEBUG', 'failedExRecordsArray.length', failedExRecordsArray.length);
		nlapiLogExecution('DEBUG', 'updatedExRecArray.length', updatedExRecArray.length);
		responseObj.failedexRecords = failedExRecordsArray;
		responseObj.exRecords = updatedExRecArray;
	}
	return responseObj;
}
// TODO: (smccurry) This trigger workflow does not work.
function sendEmailCustomerWorkflow(exrecid) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var responseObj = {};
	try {
		nlapiTriggerWorkflow('customrecord_acq_lot', exrecid, 'customworkflow_acq_sendlotemail_reset');
//		nlapiTriggerWorkflow(recType, recId, workflowId, actionId)
		responseObj.msg = msg;
    	return responseObj;
	} catch(e) {
		nlapiLogExecution('DEBUG', 'nlapiTriggerWorkflow', 'sendEmailCustomerWorkflow()');
		msg.setStatusError();
		responseObj.msg = msg;
    	return responseObj;
	}
}

function previewEmailBeforeTemplate(exRecID, sholderEmail, contactName, dealEmail, oldSholderURL) {
	var emailObj = {};
	var emailtemplate = nlapiLoadRecord('emailtemplate', 430);
	var subject = emailtemplate.getFieldValue('subject');
	var content = emailtemplate.getFieldValue('content');
	content = content.replace(/<holder.name>/gi, contactName);
	/*  Important!  This email preview will have the wrong URL because the hash has not been replaced yet.
	*	The send email will replace this with the new hash id and update the url.
	*/
	content = content.replace(/<sholder.url>/gi, oldSholderURL);
	content = content.replace(/<deal.email>/gi, dealEmail);
	emailObj.body = content;
	emailObj.subject = subject;
	return emailObj;
}

function previewEmailAfterTemplate(exRecID, sholderEmail, contactName, dealEmail, newSholderURL) {
	var emailObj = {};
	try {
		var emailtemplate = nlapiLoadRecord('emailtemplate', 430);
		var subject = emailtemplate.getFieldValue('subject');
		var content = emailtemplate.getFieldValue('content');
	} catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'previewEmailAfterTemplate()', JSON.stringify(err));
	}
	content = content.replace(/<holder.name>/gi, contactName);
	/*  Important!  This email preview will have the wrong URL because the hash has not been replaced yet.
	 *	The send email will replace this with the new hash id and update the url.
	 */
	content = content.replace(/<sholder.url>/gi, newSholderURL);
	content = content.replace(/<deal.email>/gi, dealEmail);
	emailObj.body = content;
	emailObj.subject = subject;
	return emailObj;
}

function replaceEmailFields(contactName, url, dealEmail) {
	content = content.replace(/<holder.name>/gi, contactName);
	/*  Important!  This email preview will have the wrong URL because the hash has not been replaced yet.
	*	The send email will replace this with the new hash id and update the url.
	*/
	content = content.replace(/<sholder.url>/gi, url);
	content = content.replace(/<deal.email>/gi, dealEmail);
	return content;
}
// 'Send Email With This New Hash' buttonw will trigger thiss script.
function sendEmailCustomerScripted(dataIn) {
	nlapiLogExecution('DEBUG', 'START of sendEmailCustomerScripted(dataIn)', JSON.stringify(dataIn));
	var responseObj = {};
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var content = dataIn.body;
	var emailtemplate = nlapiLoadRecord('emailtemplate', 430);
	var subject = emailtemplate.getFieldValue('subject');
	
	var records = new Object();
	if(nlapiGetContext().getUser() == 399229) {
		records['recordtype'] = 382;
		records['record'] = dataIn.txnid;
	} else {
		records = null;
	}
	
    try {
    	nlapiSendEmail(321083, dataIn.sendto, subject, content, null, null, records, null);
//    	nlapiSendEmail(dataIn.sendfrom, dataIn.sendto, subject, dataIn.body, null, null, null, null);
    	msg.setStatusSuccess();
    	responseObj.msg = msg;
    	return responseObj;
    } catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'sendEmailCustomerScripted(dataIn)', JSON.stringify(err));
//		msg.setStatusError();
		responseObj.msg = msg;
		return responseObj;
    }
}
function resetSendEmailCustomerScripted(dataIn) {
	var responseObj = {};
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var emailObj = {};
	var emailtemplate = nlapiLoadRecord('emailtemplate', 430);
	var subject = emailtemplate.getFieldValue('subject');
	var content = emailtemplate.getFieldValue('content');
	content = content.replace(/<holder.name>/gi, dataIn.contactName);
	/*  Important!  This email preview will have the wrong URL because the hash has not been replaced yet.
	 *	The send email will replace this with the new hash id and update the url.
	 */
	content = content.replace(/<sholder.url>/gi, dataIn.newSholderURL);
	content = content.replace(/<deal.email>/gi, dataIn.dealEmail);
	emailObj.body = content;
	emailObj.subject = subject;
	emailObj.msg = msg;
	
	var records = new Object();
	if(nlapiGetContext().getUser() == 399229) {
		records['recordtype'] = 382;
		records['record'] = dataIn.txnid;
	} else {
		records = null;
	}
	
    try {
    	nlapiSendEmail(321083, dataIn.sendto, subject, content, null, null, records, null);
//    	responseObj.msg = msg;
    	return emailObj;
    } catch (e) {
    	var err = e;
    	nlapiLogExecution('ERROR', 'resetSendEmailCustomerScripted(dataIn)', JSON.stringify(err));
//		msg.setStatusError();
//		responseObj.msg = msg;
//		return responseObj;
    }
}

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

// TEMP FIX FOR CONTACT
function searchReturnContact(exRecID) {
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('id', null, 'is', exRecID);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_exchangehash');
		columns[1] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_identcode');
		columns[2] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_contact');
		var exchangeRecords = nlapiSearchRecord('customrecord_acq_lot', null, filters, columns );
		
		if(exchangeRecords != null && exchangeRecords.length > 0) {
			var oneResult = exchangeRecords[0];
			contact = oneResult.getValue('custrecord_acq_loth_zzz_zzz_contact');
			return contact;
		} else {
			return null;
		}
};
