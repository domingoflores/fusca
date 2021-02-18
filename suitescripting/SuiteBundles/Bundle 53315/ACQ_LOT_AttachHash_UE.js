/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Apr 2014     smccurry
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function _beforeSubmit(type) {
        try {
        	nlapiLogExecution('DEBUG', 'type argument:', type);
        	if(type == 'create') {
        		var exRec = nlapiGetNewRecord();
        		var exRecHashField = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash');
        		nlapiLogExecution('DEBUG', 'exRecHashField', exRecHashField);
        		if(exRecHashField == '') {
        			attachExchangeRecordtoHash(exRec);
        		} else {
        			nlapiLogExecution('ERROR', 'Exchange Record already has a hash number.', 'Exchange Record User Event _beforeSumit already has a hash number: Exchange Record: ' + exRec.getID());
        		}
        	} 
        } catch (e) {
        	var err = e;
			nlapiLogExecution('ERROR',"_beforeSubmit",JSON.stringify(err));	
        }
}

function attachExchangeRecordtoHash(exRec) {
	/* The hashNumber variable will be set to either an existing hash if one is found matching the contact
	*  or it will set to a new hash record number
	*  */
	var hashNumber = null;
	// Load other needed values
	var deal = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_deal');
	var exRecContact = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_contact');
	// Search for existing hash records that have a customer contact and deal that can be used to existing hashes for assignment to new ex record
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'noneof', '@NONE@');
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_acq_hash_deal_link');
	columns[1] = new nlobjSearchColumn('custrecord_acq_hash_exch_email');
	columns[2] = new nlobjSearchColumn('custrecord_acq_hash_contact');
	columns[3] = new nlobjSearchColumn('id').setSort('true');
	var hashRecords = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
	for (var sLoop = 0; hashRecords != null && sLoop < hashRecords.length; sLoop++ ) {
		var hashRecord = hashRecords[sLoop];
		if((exRecContact != null && exRecContact != '') && exRecContact == hashRecord.getValue('custrecord_acq_hash_contact')) {
			hashNumber = hashRecord.getId();
			break;
			//break out if match found
		}
	}
	var exRecHashField = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash');
	// If exchange record already has a hash code, then exit out of this function
	if(exRecHashField != '') {
		nlapiLogExecution('DEBUG', 'Exchange Record already has a hash number.', exRec.getID());
		return;
	} 
	/* If the exchange record does not have a hash recored, but a matching contact has been found,then set
	*  the exchange record to the existing hash record, ... */
	if(hashNumber != null && hashNumber != '') {
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
		columns[3] = new nlobjSearchColumn('id').setSort('true');
		var emptyHashResults = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
		var hashNumber = emptyHashResults[0].getId();
		// Assign hash to the LOT / Exchange record
		// Assign hashRec to Exchange Record and Exchange Record to hash record
		if(hashNumber != null && hashNumber != '') {
			// Order of this section is important
			var hashRec = nlapiLoadRecord('customrecord_acq_exchange_hash', hashNumber);
			hashRec.setFieldValue('custrecord_acq_hash_deal_link', deal);
			if(exRecContact != null && exRecContact != '') {
				hashRec.setFieldValue('custrecord_acq_hash_exch_email', exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldemail'));
				hashRec.setFieldValue('custrecord_acq_hash_contact', exRecContact);
			}
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash', hashNumber);
			exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_identcode', hashRec.getFieldValue('name'));
		}
	}
	try {
		nlapiSubmitRecord(hashRec);
	} catch (e) {
		nlapiLogExecution('DEBUG', 'attachExchangeRecordtoHash()', 'Hash record did not submit after adding deal record.');
	}
}
