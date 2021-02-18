//var datain = new Object();
//datain.savedsearch = 'customsearch662';
//datain.groupfield = 'formulatext|||{account}';
//datain.groupfield = 'salesRep.title';
//getFilterElements(datain);

function getFilterElementsRecordAdded() {
	var startTime = new Date().getTime();
	nlapiLogExecution('debug', 'Script started at: ', new Date().toTimeString());
	nlapiLogExecution('debug', 'Script Start Time: ', startTime);
	var recordId = nlapiGetRecordId();
	var recordType = nlapiGetRecordType();
	var fields = [ 'name', 'custrecordgetfilterelementssavedsearch',
			'custrecordgetfilterelementscolumn',
			'custrecordgetfilterelementspostbackurl' ];
	var fieldValues = nlapiLookupField(recordType, recordId, fields);
	var datain = new Object();
	datain.requestid = fieldValues['name'];
	datain.savedsearch = fieldValues['custrecordgetfilterelementssavedsearch'];
	datain.groupfield = fieldValues['custrecordgetfilterelementscolumn'];
	datain.postbackurl = fieldValues['custrecordgetfilterelementspostbackurl'];
	nlapiLogExecution('debug', 'call getFilterElements(): ', (new Date()
			.getTime() - startTime));

	getFilterElements(datain);
	nlapiDeleteRecord(recordType, recordId);
	nlapiLogExecution('debug', 'Script finished: ',
			(new Date().getTime() - startTime));
	nlapiLogExecution('debug', 'Script finished at: ', new Date()
			.toTimeString());
}

function getFilterElements(datain) {
	var startTime = new Date().getTime();
	nlapiLogExecution('debug', 'start time', startTime);
	nlapiLogExecution('DEBUG', 'getFilterElements: ', JSON.stringify(datain));
	var savedsearch = datain.savedsearch;
	var groupField = datain.groupfield;
	var postBackURL = datain.postbackurl;

	var resultsArray = new Array();
	var status = new Object();
	try {
		// Define search columns

		var oldSearch = nlapiLoadSearch(null, savedsearch);
		var oldType = oldSearch.getSearchType();
		var oldFilters = oldSearch.getFilters();
		var columns = new Array();

		var column = getColumn(groupField);
		if (column != null) {
			columns.push(column);
		}

		// Execute the search and return results

		var newSearch = nlapiCreateSearch(oldType, oldFilters, columns);

		var searchResults = newSearch.runSearch();

		searchResults.forEachResult(function processSearchResult(searchResult) {

			var row = new Object();

			var columns = searchResult.getAllColumns();
			for ( var j in columns) {
				var column = columns[j];
				var value = searchResult.getValue(column);
				var text = searchResult.getText(column);
				if (value != null && value != "" && text != null && text != "") {
					row[value] = text;
				} else if (value != null && value != "" && text == null) {
					row[value] = value;
				} else if ((value == null || value == "") && text != null && text != "") {
					row[text] = text;
				} else {
					row = null;
				}

			}
			if (row != null) {	
				resultsArray.push(row);		
			}
			return true;
		});

	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n'
					+ e.getDetails());
			status['code'] = e.getCode();
			status['message'] = e.getDetails();
		} else {
			nlapiLogExecution('ERROR', 'unexpected error', e.toString());
			status['code'] = e.toString();
			status['message'] = e.toString();
		}
	}

	var postdata = new Object();
	postdata['requestid'] = datain.requestid;
	postdata['status'] = status;
	postdata['filterElements'] = resultsArray;
	var timings = new Object();
	timings['start'] = startTime;
	timings['finish'] = new Date().getTime();
	postdata['timings'] = timings;
	
	// post search results to icharts web service
	var header = new Object();
	header['User-Agent-x'] = 'SuiteScript-Call';
	header['Content-Type'] = 'application/json';
	header['Accept'] = 'application/json';
	nlapiLogExecution('DEBUG', 'getFilterElements Response: ', JSON
			.stringify(postdata));
	nlapiLogExecution('debug', 'before post back',new Date().getTime());

	var response = nlapiRequestURL(postBackURL, JSON.stringify(postdata),
			header);
	nlapiLogExecution('debug', 'finish time', new Date().getTime());

	return response;
}

function getColumn(columnName) {
	var formula = null;
	var filterName = columnName;
	if (columnName.indexOf('|||') != -1) {
		var tokens = columnName.split('|||');
		if (tokens[0] != null)
			filterName = tokens[0];
		if (tokens[1] != null)
			formula = tokens[1];
	}
	var join = null;
	if (filterName.indexOf('.') != -1) {
		var tokens = filterName.split('.');
		if (tokens[0] != null)
			join = tokens[0];
		if (tokens[1] != null)
			filterName = tokens[1];

	}
	var column = new nlobjSearchColumn(filterName, join, 'group');
	column.setSort(false);
	if (formula != null) {
		column.setFormula(formula);
	}
	return column;
}
