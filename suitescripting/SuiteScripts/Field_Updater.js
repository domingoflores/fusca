/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 May 2014     smccurry
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
//create search; alternatively nlapiLoadSearch() can be used to load a saved search
	var search = nlapiCreateSearch('customer', ['category', 'is', 2]);
	var searchResults = search.runSearch();
	
// resultIndex points to record starting current resultSet in the entire results array 
	var resultIndex = 0; 
	var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
	var resultSet; // temporary variable used to store the result set
	do 
	{
		// fetch one result set
		resultSet = searchResults.getResults(resultIndex, resultIndex + resultStep);
		//for(var int = 0; int < resultSet.length; int++) {
		for(var int = 0; int < 2; int++) {
			resultOne = resultSet[int];
			var custRec = nlapiLoadRecord('customer', resultSet[int].getId());
			custRec.setFieldValue('customform', 15);
			try {
				var custRecID = nlapiSubmitRecord(custRec);
			} catch (e) {
				var err = e;
				nlapiLogExecution('DEBUG', 'SUBMIT RECORD FAILED', JSON.stringify(err));
			}
		}
		// increase pointer
		resultIndex = resultIndex + resultStep;
		
		// process or log the results
		nlapiLogExecution('DEBUG', 'resultSet returned', resultSet.length 
				+ ' records returned');
// once no records are returned we already got all of them
	} while (resultSet.length > 0) ;
}


