/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.02       08 June 2014     smccurry		   Installed on production
 *
 * Description: This is the core code used by the 'Assign New Hash' button
 * which is currently intended for administrators use only, but may be released
 * to others later as possible 'reset password' kind of feature for the
 * Clearing House web site.
 * 
 */
ERROR_MESSAGES = function(obj) { 
	this.returnMessages = new Array(); 
	this.returnRecId = null;
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

function removeHashRecordSetInactive(type, hashRecID, exRecID, dateTime) {
	nlapiLogExecution('DEBUG', 'removeHashRecordSetInactive', 'hashRecID: '+hashRecID);
	// Search for exchange records that use this hash so they can also have their hash replaced.
	var exchangeRecords = searchExchangeRecordsThatUseHash(hashRecID);
	

	var exchangeRecIDs = [];
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
		var hashLogMsg = createLogMessage(hashRec, exchangeRecord.id, dateTime);
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
		nlapiLogExecution('DEBUG', 'removeHashRecordSetInactive() nlapiSubmitRecord(hashRec)', 'Changed Hash Record: ' + hashID);
	} catch (e) {
		nlapiLogExecution('DEBUG', 'removeHashRecordSetInactive()', 'Error');
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
	var hashLogMsg = dateTime + ' - UserID: ' + userID + ' - ' + 'This hash was removed from Exchange Record ID #' + exchangeRecordID + ' and set to inactive. DO NOT REUSE THIS HASH NUMBER.\n';
	hashLogMsg += dateTime + ' - UserID: ' + userID + ' - ' + hashRec.getFieldValue('custrecord_acq_hash_exch_email') + '\n';
	hashLogMsg += dateTime + ' - UserID: ' + userID + ' - ' + hashRec.getFieldText('custrecord_acq_hash_contact') + '\n';
	return hashLogMsg;
}

function searchExchangeRecordsThatMatchDealandContact(exRecID) {
	// TODO: Possibly rebuild this to not have to load the exchange record
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
	var exchangeRecordsMatch = nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
	// Loop through the search results and put the exchange record ids in an array
	var exchangeRecMatchDealContact = [];
	for (var hLoop = 0; exchangeRecordsMatch != null && hLoop < exchangeRecordsMatch.length; hLoop++ ) {
		var exchangeRecord = exchangeRecordsMatch[hLoop];
		exchangeRecMatchDealContact.push(exchangeRecord.id);	
	}
	// this line will return an array of exchange record ids that have a deal and contact that match the current exchange record from which the button was pushed.
	return exchangeRecMatchDealContact;
}

function getUserName(userID) {
	var userName = nlapiLookupField('employee', userID, 'entityid'); 
	return userName;
}


