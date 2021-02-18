//var datain = new Object();
//datain.savedsearch = 'customSearch192';
//datain.filters = '[]';
//getDetails(datain);

function recordAdded() {
	var recordId = nlapiGetRecordId();
	var recordType = nlapiGetRecordType();
	var fields = [ 'name', 'custrecordichartsgetdetailssavedsearch',
			'custrecordichartsgetdetailsfilters',
			'custrecordichartsgetdetailspostbackurl' ];
	var fieldValues = nlapiLookupField(recordType, recordId, fields);
	nlapiLogExecution('debug', 'fieldValues', JSON.stringify(fieldValues));
	var datain = new Object();
	datain.requestid = fieldValues['name'];
	datain.savedsearch = fieldValues['custrecordichartsgetdetailssavedsearch'];
	datain.filters = fieldValues['custrecordichartsgetdetailsfilters'];
	datain.postbackurl = fieldValues['custrecordichartsgetdetailspostbackurl'];
	getDetails(datain);
	nlapiDeleteRecord(recordType, recordId);
}

function getDetails(datain) {
	var startTime = new Date().getTime();
	nlapiLogExecution('debug', 'start time', startTime);
	var savedsearch = datain.savedsearch;
	var filterString = datain.filters;
	nlapiLogExecution('debug', 'filterString', filterString);
	var postBackURL = datain.postbackurl;

	var status = new Object();
	var resultsArray = new Object();

	var url = "";
	try {
		var searchFilters = new Array();
		var searchColumns = new Array();
		nlapiLogExecution('debug', 'set columns');
		searchColumns.push(new nlobjSearchColumn('internalid'));
		searchColumns.push(new nlobjSearchColumn('scriptid'));
		nlapiLogExecution('debug', 'set filters');
		searchFilters.push(new nlobjSearchFilter('scriptid', null, 'is', 'customdeployichartsgetdetailssuitelet'));

		nlapiLogExecution('debug', 'run search');
		var searchResults = nlapiSearchRecord('scriptdeployment', null,
				searchFilters, searchColumns);

		nlapiLogExecution('debug', 'search results');
		for (var i = 0; searchResults != null && i < searchResults.length; i++) {
			var searchResult = searchResults[i];
				var internalid = searchResult.getValue('internalid');
				nlapiLogExecution('debug', 'script internalid', internalid);
                var record= nlapiLoadRecord('scriptdeployment', internalid);
                url = record.getFieldValue('url')
				nlapiLogExecution('debug', 'script url ', url );		
		}
	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n'
					+ e.getDetails());
			statusCode = e.getDetails();
		} else {
			nlapiLogExecution('ERROR', 'unexpected error', e.toString());
			statusCode = e.toString();
		}
	}
	status['code'] = 'DEPRECATED';
	status['message'] = url;
	
	var postdata = new Object();
	postdata['requestid'] = datain.requestid;
	postdata['status'] = status;
	postdata['rows'] = resultsArray;
	var timings = new Object();
	timings['start'] = startTime;
	timings['finish'] = new Date().getTime();
	postdata['timings'] = timings;

	nlapiLogExecution('debug', 'postdata', JSON.stringify(postdata));

	// post search results to icharts web service
	var header = new Object();
	header['User-Agent-x'] = 'SuiteScript-Call';
	header['Content-Type'] = 'application/json';
	header['Accept'] = 'application/json';
	nlapiLogExecution('debug', 'before post back', new Date().getTime());
	var response = nlapiRequestURL(postBackURL, JSON.stringify(postdata),
			header);
	nlapiLogExecution('debug', 'finish time', new Date().getTime());

	return response;
}

function getColumnName(columnNameIn) {
	var columnNameOut = columnNameIn;
	if (columnNameIn.indexOf('|||') != -1) {
		var tokens = columnNameIn.split('|||');
		if (tokens[0] != null)
			columnNameOut = tokens[0];
	}
	return columnNameOut;

}

function getFormula(columnNameIn) {
	var formula = null;
	if (columnNameIn.indexOf('|||') != -1) {
		var tokens = columnNameIn.split('|||');
		if (tokens != null && tokens.length > 1 && tokens[1] != null)
			formula = tokens[1];
	}
	return formula;

}
