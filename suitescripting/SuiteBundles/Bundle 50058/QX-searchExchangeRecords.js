/**
 * Module Description
 * Script runs designated search with filter for Exchange Records with 
 * the same Exchange Hash.
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 May 2014     Pete
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function searchExchangeRecords() {
	
	// Get Parameters
	var ctx = nlapiGetContext();
	var searchId = ctx.getSetting('SCRIPT', 'custscript_qx_acq_ser_searchid');
	var hashRec = ctx.getSetting('SCRIPT', 'custscript_qx_acq_ser_hashrecord');
	
	// Execute Search
	var hashFilter = new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_exchangehash', null, 'anyof', hashRec);
	var currRecFilter = new nlobjSearchFilter('internalid', null, 'noneof', nlapiGetRecordId());
	var searchRes = nlapiSearchRecord('customrecord_acq_lot', searchId, [hashFilter, currRecFilter]);	
	
	// Return Response
	var foundResults;
	if (searchRes && searchRes.length != 0){
		foundResults = 'T';
	} else {
		foundResults = 'F';
	}
	
	return foundResults;

}
