//var datain = new Object();
//datain.requestid = '1';
//datain.savedsearchid = '664';
//datain.postbackurl = 'https://www.google.com/';
//getSavedSearchColumns(datain);

function recordAdded() {
	var recordId = nlapiGetRecordId();
	var recordType = nlapiGetRecordType();
	nlapiLogExecution('DEBUG', 'recordId', recordId);
	var fields = [ 'name', 'custrecordgetfilterssavedsearch',
			'custrecordgetfilterspostbackurl' ];
	var fieldValues = nlapiLookupField(recordType, recordId, fields);
	nlapiLogExecution('DEBUG', 'fieldValues', JSON.stringify(fieldValues));
	var datain = new Object();

	datain.requestid = fieldValues['name'];
	datain.savedsearchid = fieldValues['custrecordgetfilterssavedsearch'];
	datain.postbackurl = fieldValues['custrecordgetfilterspostbackurl'];
	getSavedSearchColumns(datain);
	nlapiDeleteRecord(recordType, recordId);
}

function getSavedSearchColumns(datain) {
	nlapiLogExecution('debug', 'start time', new Date().getTime());
	var requestid = datain.requestid;
	var savedsearchid = datain.savedsearchid;
	var postBackURL = datain.postbackurl;
	nlapiLogExecution('DEBUG', 'requestId', requestid);
	nlapiLogExecution('DEBUG', 'savedsearchId', savedsearchid);
	nlapiLogExecution('DEBUG', 'postBackURL', postBackURL);
	var columns = new Array();
	var status = new Object();
	try {
		// Define search columns

		var savedSearch = nlapiLoadSearch(null, savedsearchid);
		var searchType = savedSearch.getSearchType();
		var savedSearchColumns = savedSearch.getColumns();

		var formulatypes = [ 'formulacurrency', 'formuladate',
				'formuladatetime', 'formulanumeric', 'formulapercent',
				'formulatext' ];
		for (i in savedSearchColumns) {
			if (!savedSearchColumns[i].getName().equals('mainline')
					&& !savedSearchColumns[i].type.equals('clobtext')) {
				var column = new Object();
				var fieldType = savedSearchColumns[i].type; 
				column['type'] = fieldType;
				column['label'] = savedSearchColumns[i].label;
				if (canFilterColumn(savedSearch, searchType, savedSearchColumns[i])) {
					column['name'] = savedSearchColumns[i].name;
					if (formulatypes.indexOf(column['name']) != -1) {
						var formularaw = savedSearchColumns[i].formula;
						var formula = formularaw.replace(/\s/g, ' ');
						column['name'] = column['name'] + '|||' + formula;
					}
					var join = savedSearchColumns[i].join;
					if (join != null) {
						column['name'] = [ join, '.', column['name'] ].join("");
					}
				} else {
					var formulatype = 'formulatext';
					if (fieldType.equals("number")
							|| fieldType.equals("decimal")
							|| fieldType.equals("float")
							|| fieldType.equals("integer")
							) {
						formulatype = 'formulanumeric';
					} else if (fieldType.equals("currency")
							|| fieldType.equals("currency2")) {
						formulatype = 'formulacurrency';
					} else if (fieldType.equals("percent")) {
						formulatype = 'formulapercent';
					} else if (fieldType.equals("date")) {
						formulatype = 'formuladate';
					} else if (fieldType.equals("datetime")) {
						formulatype = 'formuladatetime';
					}

					column['name'] = formulatype + '|||{'+savedSearchColumns[i].name+'}';
				}
				columns.push(column);
			}
		}
	
		// add record counter column
		var column = new Object();
		column['name'] = 'formulanumeric|||1';
		column['type'] = 'integer';
		column['label'] = 'Record Count';
		columns.push(column);
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
	postdata['requestid'] = requestid;
	postdata['status'] = status;
	postdata['columns'] = columns;
	
	// post search results to icharts web service
	var header = new Object();
	header['User-Agent-x'] = 'SuiteScript-Call';
	header['Content-Type'] = 'application/json';
	header['Accept'] = 'application/json';

	nlapiLogExecution('DEBUG', 'postdata', JSON.stringify(postdata));
	var response = nlapiRequestURL(postBackURL, JSON.stringify(postdata),
			header);

	return response;
}

function canFilterColumn(savedSearch, searchType, column) {
	try {
		if (column.getName().indexOf('formula') == 0) {
			return true;
		}
		var filter = new nlobjSearchFilter(column.getName(), column.getJoin(), 'noneof', '@NONE@');
		var newSearch = nlapiCreateSearch(searchType, filter, column);

	} catch (e) {
		return false;
	}
	return true;
}

