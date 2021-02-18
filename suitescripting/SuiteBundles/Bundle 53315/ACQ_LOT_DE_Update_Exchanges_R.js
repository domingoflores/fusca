/**
 * @param {Object}
 *            dataIn Object represending the Exchange Record IDs, fields and values to update.
 * @returns {Object} Output object
 */
function restletMainFunction(dataIn) {
	nlapiLogExecution('DEBUG', 'postRESTlet(dataIn)', 'function start');
	nlapiLogExecution('DEBUG', 'dataIn', dataIn);
	nlapiLogExecution('DEBUG', 'JSON.stringify(dataIn)', JSON.stringify(dataIn));
	
	var responseData = {'status':'success'}; //Testing purposes
	
	updateExchangeRecords(dataIn);

	return JSON.stringify(responseData);
}

/**
 * Updates Exchange Records based on provided data.
 * 
 * @param dataIn
 *            JSON string representing exchange records to update. Structure is: [record[id, fields[], values[]], record[id, fields[], values[]], etc.]
 */
function updateExchangeRecords(dataIn) {
	var JSONExchangeData = dataIn.exchangeRecordArray;
	
	/*
	 * Loop through exchange records and update fields as needed
	 */
	for (var i = 0; i < JSONExchangeData.length; i++) {
		var exchangeRecordId = JSONExchangeData[i][0];
		//nlapiLogExecution('DEBUG', 'nlapiGetContext().getRemainingUsage() 1', nlapiGetContext().getRemainingUsage());
		nlapiSubmitField('customrecord_acq_lot', exchangeRecordId, JSONExchangeData[i][1], JSONExchangeData[i][2]);
		//nlapiLogExecution('DEBUG', 'nlapiGetContext().getRemainingUsage() 2', nlapiGetContext().getRemainingUsage());
	}
}