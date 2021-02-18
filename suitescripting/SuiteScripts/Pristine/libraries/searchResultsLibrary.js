/**
 * searchResultsLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/search', 'N/log'],

	/**
	 * -----------------------------------------------------------
	 * searchResultsLibrary.js
	 * ___________________________________________________________
	 * Offers methods to convert a Search.ResultSet object into 
	 * arrays containing the headers and the data.
	 *
	 * Version 1.0
	 * Author: Alana Thomas
	 * ___________________________________________________________
	 */

	 // ***** SEE USAGE GUIDE AT BOTTOM; ALSO AVAILABLE ON GOOGLE DRIVE "searchResultsLibrary Usage Guide" *****

	function(search, log) {

		function getDataObjectArray(resultSet) {
			var dataObjectArray = [],
				batch,
				batchSize = 1000,
				startIndex = 0,
				endIndex = batchSize;
			do {
				var tempResults = resultSet.getRange({
					start: startIndex,
					end: endIndex
				});
				for(var i = 0; i < tempResults.length; i++) {
					var tempObject = {};
					for(var j = 0; j < resultSet.columns.length; j++) {
						var thisResult = tempResults[i];
						var thisColumn = resultSet.columns[j];
						log.error('thisColumn', thisColumn);
						tempObject[thisColumn.name] = thisResult.getValue({
							name: thisColumn
						});
						var textResult = thisResult.getText({
								name: thisColumn
						});
						if(textResult) {
							tempObject[thisColumn.name + '_text'] = textResult;
						}
					}
					dataObjectArray.push(tempObject);
				}
			} while (tempResults.length == batchSize);
			return dataObjectArray;
		}

		/**
		 * Takes a Search.ResultSet object and grabs all the results
		 * by cycling through using getRange()
		 * @param  {Object} resultSet The results of a NetSuite saved search 
		 * (Search.ResultSet object)
		 */
		function getSearchResultData(resultSet) {
			var all = [],
				results = [],
				batchSize = 1000,
				startIndex = 0,
				endIndex = batchSize;

			do {
				results = resultSet.getRange({
					start: startIndex,
					end: endIndex
				});
				all = all.concat(results);
				startIndex += batchSize;
				endIndex += batchSize;
			} while (results.length == batchSize);
			return all;
		}

		/**
		 * "Converts" a Search.ResultSet object into an array 
		 * containing the search data.
		 * @param  {Object} resultSet The results of a NetSuite saved search 
		 * (Search.ResultSet object)
		 * @param  {Boolean} getDataByIDFlag A flag set by the user to indicate 
		 * whether the results should be the IDs of the data items OR the name
		 * behind the ID (if possible). This defaults to false, returning the 
		 * name behind the ID (if possible).
		 * @return {Object} dataArray The results of the search in the form of
		 * an array of arrays, each containing a different line of the search
		 * results
		 */
		function getData(resultSet, getDataByIDFlag) {
			var dataArray = [];
			var tempResult = [];
			var batch; // will store arrays returned from the getRange() call
			var batchSize = 1000; // ask for batches of 1000 (maximum for getRange)

			// get the data from each column for each record returned by the search
			var startIndex = 0,
				endIndex = batchSize;
			do {
				batch = resultSet.getRange(startIndex, endIndex);
				startIndex = endIndex;
				endIndex += batchSize;

				for (var i = 0; i < batch.length; i++) { // cycles over records in current batch array
					for (var j = 0; j < resultSet.columns.length; j++) { // cycles through each column
						if(getDataByIDFlag) {
							// getValue() returns internal IDs (e.g. 12345 instead of John Doe)
							var tempString = batch[i].getValue({
								name: batch[i].columns[j]
							});
						}
						else {
							// getDataItem() will return the name behind the ID if possible (e.g. John Doe instead of 12345)
							var tempString = getDataItem(batch[i], j);
						}
						tempResult.push(tempString);
					}
					dataArray.push(tempResult);
					tempResult = [];
				}
			} while (batch.length == endIndex - startIndex); // NEED TO TEST numRecords % 1000 = 0

			return dataArray;
		}

		/**
		 * Gets the names of each column in the search and stores the
		 * list as an array
		 * @param  {Object} Search.ResultSet The results of a NetSuite saved search
		 * @return {Object} Array The name of each column stored as an array
		 */
		function getColumnHeaders(resultSet) {
			var columnHeaderArray = [];
			for (var i = 0; i < resultSet.columns.length; i++) {
				columnHeaderArray.push(resultSet.columns[i].label);
			}
			return columnHeaderArray;
		}

		/**
		 * (1) Gets the names of each column in the search and stores the
		 * list as an array (2) "Converts" a Search.ResultSet object into an array 
		 * containing the search data (3) Stores both in an object with two
		 * properties, headers and data.
		 * @param  {Object} resultSet The results of a NetSuite saved search 
		 * (Search.ResultSet object)
		 * @param  {Boolean} getDataByIDFlag A flag set by the user to indicate 
		 * whether the results should be the IDs of the data items OR the name
		 * behind the ID (if possible). This defaults to false, returning the 
		 * name behind the ID (if possible).
		 * @return {Object} results The results of the search in the form of
		 * an array of arrays, each containing a different line of the search
		 * results
		 */
		function getAll(resultSet, getDataByIDFlag) {
			return {
				headers: getColumnHeaders(resultSet),
				data: getData(resultSet, getDataByIDFlag)
			};
		}

		/**
		 * A helper function used if getDataByIDFlag is false. Calls getText()
		 * on each Result and checks if it is NULL; if it is NULL, calls
		 * getValue() on the Result instead.
		 * @param  {Object} result A single piece of Search.ResultSet data. 
		 * (Search.Result object)
		 * @param  {int} columnNum The column where the data piece falls.
		 * @return {string} tempString The res
		 */
		function getDataItem(result, columnNum) { // accepts search.Result, integer
			// when using getValue(), some search results are returned as IDs - getText() grabs the text behind the IDs
			// but returns null when the result is not an ID. Then getValue() is called on the result instead.
			var tempString = result.getText({
				name: result.columns[columnNum]
			});
			if (tempString == null) {
				return result.getValue({
					name: result.columns[columnNum]
				});
			};
			return tempString;
		}

	return {
		getData: getData,
		getColumnHeaders: getColumnHeaders,
		getAll: getAll,
		getSearchResultData: getSearchResultData,
		getDataObjectArray: getDataObjectArray
	};

});

/*
GET STARTED
Add the searchResultsLibrary.js file as a dependency for your script.
 
METHODS
I. getAll(resultSet, getDataByIDFlag)
PARAMETERS
Search.ResultSet object
	Returned when using the run() method on a Search.Search object
Boolean representing whether the results should be the IDs of the data items (true) OR the name if possible (false). DEFAULT: FALSE.
	Example: Given a customer record with an internal ID of 12345 and a name of Jane Doe...
		If TRUE: the method returns 12345.
		If FALSE: the method returns “Jane Doe”.
RETURNS
Object with two properties:
	headers: An array containing the name of each column header in the search.
	data: An array containing each line in the search results as an array (e.g. an array of arrays).
 
getColumnHeaders(resultSet)
PARAMETERS
Search.ResultSet object
	Returned when using the run() method on a Search.Search object
RETURNS
Array containing the name of each column header in the search.
 
getData(resultSet, getDataByIDFlag)
PARAMETERS
Search.ResultSet object
	Returned when using the run() method on a Search
A boolean representing whether the results should be the IDs of the data items (true) OR the name if possible (false). DEFAULT: FALSE.
	Example: Given a customer record with an internal ID of 12345 and a name of Jane Doe...
		If TRUE: the method returns 12345.
		If FALSE: the method returns “Jane Doe”.
RETURNS
Array containing each line in the search results as an array (e.g. an array of arrays).
 
EXAMPLE CODE
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 
define('N/search', '/path/to/searchResultsLibrary'], 
function(search, searchResultsLibrary) {
function onRequest(context) {
 
		if (context.request.method === 'GET') {
			
			var mySearch = search.load({
				id: 'myCustomSearch'
			}).run();
 
			var headers = searchResultsLibrary.getColumnHeaders(mySearch);
			log.debug('Headers:', headers);
 
			var data = searchResultsLibrary.getData(mySearch, true);
			log.debug('Data: ', data);
 
			var all = searchResultsLibrary.getAll(mySearch);
			log.debug('All: ', all);
			log.debug('All headers', all.headers);
			log.debug('All data', all.data);
 
		} else { // context.request.method === 'POST'
			// code here	
		}
	}
	return {
		onRequest: onRequest
	};	
});
 
*/
