/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Apr 2014     smccurry
 * 1.01       01 Jul 2015     tjtyrrell
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function attachExchangeRecordtoHashScheduled(type, hashRecID, exRecID) {
	// Change this so that it works with the ACQ_LOT_Hash_Library.js, removing redundant code.
	// Search for any exchange records that do not have an exchange hash assigned and then assign one.
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_exchangehash', null, 'anyof', '@NONE@');
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_exchangehash');
	columns[1] = new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_identcode');
	var exchangeRecords = nlapiSearchRecord('customrecord_acq_lot', null, filters, columns );
	for (var hLoop = 0; exchangeRecords != null && hLoop < exchangeRecords.length; hLoop++ ) {
		nlapiLogExecution('DEBUG', 'Entry to Loop Record ID', exchangeRecords[hLoop].id);
		var exchangeRecord = exchangeRecords[hLoop];
		if(exchangeRecord.getValue('custrecord_acq_loth_zzz_zzz_exchangehash') == null || exchangeRecord.getValue('custrecord_acq_loth_zzz_zzz_exchangehash') == '') {
			var exRec = nlapiLoadRecord('customrecord_acq_lot', exchangeRecord.id);
			
			/* The hashNumber variable will be set to either an existing hash if one is found matching the contact
			 *  or it will set to a new hash record number
			 *  */
			var hashNumber = null;
			// Load other needed values
			var deal = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_deal');
			var exRecContact = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_contact');
			var exRecContactName = exRec.getFieldText('custrecord_acq_loth_zzz_zzz_contact');
			nlapiLogExecution('DEBUG', 'exRecID', exchangeRecord.id);
			nlapiLogExecution('DEBUG', 'exRecContact', exRecContact);
			// Search for existing hash records that have a customer contact and deal that can be used to existing hashes for assignment to new ex record
			var filters = new Array();
			//filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'noneof', '@NONE@');
			filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'is', deal);
			//filters[1] = new nlobjSearchFilter('custrecord_acq_hash_contact', null, 'anyof', exRecContactName);
			filters[1] = new nlobjSearchFilter('isinactive', null, 'anyof', 'F');
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('custrecord_acq_hash_deal_link');
			columns[1] = new nlobjSearchColumn('custrecord_acq_hash_exch_email');
			columns[2] = new nlobjSearchColumn('custrecord_acq_hash_contact');
			columns[3] = new nlobjSearchColumn('isinactive');
			columns[4] = new nlobjSearchColumn('id').setSort();
			var hashRecords = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
			var totalRecords  = ( hashRecords != null ) ? hashRecords.length : 0;
			nlapiLogExecution('DEBUG', 'HashRecord Length', totalRecords);
			//nlapiLogExecution('DEBUG', 'HashRecords', hashRecords);
			for (var sLoop = 0; hashRecords != null && sLoop < hashRecords.length; sLoop++ ) {
				var hashRecord = hashRecords[sLoop];
				if((exRecContact != null && exRecContact != '') && exRecContact == hashRecord.getValue('custrecord_acq_hash_contact') && hashRecord.getValue('isinactive') == 'F') {
					hashNumber = hashRecord.id;
					break;
					//break if match found
				}
			}
			//var exRecHashField = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash');
			// If exchange record already has a hash code, then exit out of this function
			//if(exRecHashField != null) {
			//	nlapiLogExecution('DEBUG', 'Exchange Record already has a hash number.', exRec.id);
			//	return;
			//} 
			/* If the exchange record does not have a hash record, but a matching contact has been found,then set
			 *  the exchange record to the existing hash record, ... */
			if(hashNumber != null) {
				// Order of this section is important
				var hashRec = nlapiLoadRecord('customrecord_acq_exchange_hash', hashNumber);
				exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash', hashNumber);
				exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_identcode', hashRec.getFieldValue('name'));
				// If exRecHashField is empty, and a hash record matching contact does not already exist then search for empty hash record to use.
			} else { 
				var filters = new Array();
				filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'anyof', '@NONE@');
				var columns = new Array();
				columns[0] = new nlobjSearchColumn('name');
				columns[1] = new nlobjSearchColumn('custrecord_acq_hash_deal_link');
				columns[2] = new nlobjSearchColumn('custrecord_acq_hash_contact');
				columns[3] = new nlobjSearchColumn('id').setSort();
				var emptyHashResults = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
				var hashNumber = emptyHashResults[0].getId();
				// Assign hash to the LOT / Exchange record
				// Assign hashRec to Exchange Record and Exchange Record to hash record
				if(hashNumber != null && hashNumber != '') {
					// Order of this section is important
					var hashRec = nlapiLoadRecord('customrecord_acq_exchange_hash', hashNumber);
					hashRec.setFieldValue('custrecord_acq_hash_deal_link', deal);
					if(exRecContact != null && exRecContact != '') {
						hashRec.setFieldValue('custrecord_acq_hash_exch_email', exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldemail')); // alternate: this would source the email from the contact nlapiLookupField('customer', exRecContact, 'email')
						hashRec.setFieldValue('custrecord_acq_hash_contact', exRecContact);
					}
					exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash', hashNumber);
					exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_identcode', hashRec.getFieldValue('name'));
				}
			}
			try {
				var id = nlapiSubmitRecord(hashRec);
				var exId = nlapiSubmitRecord(exRec);
				nlapiLogExecution('DEBUG', 'nlapiSubmitRecord(hashRec)', 'Returned ID: ' + id);
				nlapiLogExecution('DEBUG', 'nlapiSubmitRecord(exRec)', 'Returned ID: ' + exId);
			} catch (e) {
				nlapiLogExecution('DEBUG', 'attachExchangeRecordtoHash()', 'Hash record did not submit after adding deal record.');
				nlapiLogExecution('DEBUG', 'attachExchangeRecordtoHash()', 'Error Message is ' + e + '  The Exchange Record is ' + exchangeRecord.id);
			}	
		}	
	}
}
