/**
 * This library script defines utility functions used by the CAC scripts.
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Sep 2012     Eric Grubaugh
 *
 */

/**
 * Generates the URL to link to the entity record
 * 
 * @param {nlobjSearchResult} record - The search result containing the entity for which the URL is
 * 		generated.
 * @returns {string} The complete URL for the entity link 
 */
function CAC_getEntityUrl(record) {
	var recordType = nlapiLookupField('entity', record.getValue('entity'), 'recordtype'),
		url = nlapiResolveURL('record', recordType, record.getValue('entity')),		
		show = true,
		where = 'getEntityUrl';
	
	afnLog(show, where, 'Entity URL: ' + url);

	return url;
}

/**
 * Generates the URL to link to the payment record.
 * 
 * @param {nlobjSearchResult} record - The search result representing the payment for which the URL
 * 		is generated.
 * @returns {string} The complete URL for the payment link 
 */
function CAC_getPaymentUrl(record) {
	var url = nlapiResolveURL('record', record.getValue('recordtype'), record.getId()),
		show = true,
		where = 'getPaymentUrl';
	
	//afnLog(show, where, 'Payment URL: ' + url);
	
	return url;
}

/**
 * Convenience wrapper for NetSuite logging.
 * 
 * @param {boolean} show - Whether or not the log message should be shown. 
 * @param {string} where - Description of where the log message is occurring.
 * @param {string} what - The actual message to log.
 * @private
 */
function afnLog(show, where, what)
{
	if (show) {
		nlapiLogExecution('DEBUG', where ? where : '', what ? what : '');
	}
}
