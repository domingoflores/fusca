//var datain = new Object();
//datain.savedsearch = '979';
//datain.groupfield = 'postingperiod';
//datain.comparefield = '';
//datain.measurefield = 'amount';
//datain.custrecordichartsgetdatameasuresarray='["amount"]';
//datain.filters = '{"postingperiod":["199"]}';
//datain.aggregation = 'sum';
//getData(datain);

function customSearchRecordAdded() {
	var recordId = nlapiGetRecordId();
	var recordType = nlapiGetRecordType();
	var fields = [ 'name', 'custrecordsavedsearch', 'custrecordgroupbyfield',
			'custrecordcomparefield', 'custrecordmeasurefield','custrecordichartsgetdatameasuresarray',
			'custrecordgetdatafilters', 'custrecordsummarytype',
			'custrecordgetdatapostbackurl', 'custrecordgetdatasortdirection' ];
	var fieldValues = nlapiLookupField(recordType, recordId, fields);
	nlapiLogExecution('DEBUG', 'fieldValues', JSON.stringify(fieldValues));
	var datain = new Object();
	datain.requestid = fieldValues['name'];
	datain.savedsearch = fieldValues['custrecordsavedsearch'];
	datain.groupfield = fieldValues['custrecordgroupbyfield'];
	datain.comparefield = fieldValues['custrecordcomparefield'];
	datain.measurefield = fieldValues['custrecordmeasurefield'];
	datain.measuresarray = fieldValues['custrecordichartsgetdatameasuresarray'];
	datain.filters = fieldValues['custrecordgetdatafilters'];
	datain.aggregation = fieldValues['custrecordsummarytype'];
	datain.sortdirection = fieldValues['custrecordgetdatasortdirection'];
	datain.postbackurl = fieldValues['custrecordgetdatapostbackurl'];
	getData(datain);
	nlapiDeleteRecord(recordType, recordId);
}

function getData(datain) {
	var startTime = new Date().getTime();
	nlapiLogExecution("debug", "startTime", startTime);
	var savedsearch = datain.savedsearch;
	var groupfield = datain.groupfield;
	var comparefield = datain.comparefield;
	var measurefield = datain.measurefield;
	var measuresarrayjson = datain.measuresarray;
	var filterString = datain.filters;
	var aggregation = datain.aggregation;
	var sortdirection = datain.sortdirection;
	var postBackURL;
	if (datain.postbackurl != null) {
		postBackURL = datain.postbackurl;
	}
	var resultsArray = new Array();

	var status = new Object();
	// Define search columns
	try {
		var oldSearch = nlapiLoadSearch(null, savedsearch);
		var oldType = oldSearch.getSearchType();
		var oldFilterExpression = oldSearch.getFilterExpression();
		var oldColumns = oldSearch.getColumns();
		var aColumns = new Array();

		var categoryColumn = getSummaryColumn(groupfield, 'group');
		if (categoryColumn != null) {
			var sortDesc = (sortdirection != null && sortdirection
					.equals('DESCENDING'));
			categoryColumn.setSort(sortDesc);
			aColumns.push(categoryColumn);
		}

		if (comparefield != null && comparefield.length > 0) {
			var column = getSummaryColumn(comparefield, 'group');
			if (column != null) {
				aColumns.push(column);
			}
		}

		nlapiLogExecution('DEBUG', 'measurefield: ', measurefield);
		nlapiLogExecution('DEBUG', 'measuresarrayjson: ', measuresarrayjson);
		if (measuresarrayjson != null && measuresarrayjson.length > 0) {
			var measuresArray = JSON.parse(measuresarrayjson);
			for (var index = 0; index < measuresArray.length; index++) {
				var measure = measuresArray[index];
				var column = getSummaryColumn(measure, aggregation);
				if (column != null) {
					aColumns.push(column);
				}
			}
		} 
		// TODO: remove support for single measure field once all customers have updated bundle
		  else 	if (measurefield != null && measurefield.length > 0) {
			var column = getSummaryColumn(measurefield, aggregation);
			if (column != null) {
				aColumns.push(column);
			}
		}

		var newFilters = new Array();
		var hasMainlineFilter = false;
		for ( var i in oldFilterExpression) {
			var filter = oldFilterExpression[i];
			// if there is a mainline filter (true or false) use it
			if (filter[0].equals('mainline')) {
				hasMainlineFilter = true;
			}
			// work around netsuite bug
			if (filter[1].equals('isempty') || filter[1].equals('isnotempty')) {
				var fixedFilter = filter.slice(0);
				fixedFilter.push("");
				filter = fixedFilter;
			}
			newFilters.push(filter);
		}
		if (hasMainlineFilter == false) {
			if (canFilterColumn(oldSearch, oldType, 'mainline')) {
				if (newFilters.length > 0) {
					newFilters.push('AND');
				}
				newFilters.push([ 'mainline', 'is', 'F' ]);
			}
		}

		if (filterString != null) {
			var filters = JSON.parse(filterString);
			for ( var filter in filters) {
				var filterName = getColumnName(filter);
				var formula = getFormula(filter);
				var fieldType = null;
				var isJoin = false;
				for ( var column in oldColumns) {
					var join = null;
					join = oldColumns[column].getJoin();
					var name = oldColumns[column].getName();
					if (join != null) {
						name = [ join, '.', name ].join("");
					}
					if (name != null && name.equals(filterName)) {
						if (join != null) {
							isJoin = true;
						}
						fieldType = oldColumns[column].getType();
						break;
					}
				}
				if (filterName.equals('custcolichartsrecordcounter')
						|| filterName.equals('custbodyichartsrecordcounter')
						|| filterName.equals('custentityichartsrecordcounter')
						|| filterName.equals('custeventichartsrecordcounter')) {
					fieldType = 'integer';
				}
				if (filterName != null && filterName.equals('statusref')) {
					filterName = 'status';
				}
				
				nlapiLogExecution('debug', 'fieldType', fieldType);
				nlapiLogExecution('debug', 'formula', formula);
				nlapiLogExecution('debug', 'isJoin', isJoin);
				if (fieldType != null
						&& formula == null
						&& fieldType.equals("select")
						&& isJoin) {
					var filterValues = filters[filterName];
					var filterExpression = new Array();
                                        var values = new Array();
					for (i in filterValues) {
						if ('- None -'.equals(filterValues[i])) {
							values.push('@NONE@');
							
						} else {
							values.push(filterValues[i]);
						}
					}
					filterExpression.push([ filterName, 'anyof',values ]);
					if (newFilters.length > 0) {
						newFilters.push('AND');
					}
					newFilters.push(filterExpression);
                }
				else if (fieldType != null
						&& formula == null
						&& (fieldType.equals("text") || fieldType.equals("checkbox") 
								|| fieldType.equals("select")|| fieldType.equals("percent"))) {
					var filterValues = filters[filterName];
					var filterExpression = new Array();
					for (i in filterValues) {
						if (i > 0) {
							filterExpression.push('OR');
						}
						if ('- None -'.equals(filterValues[i])) {
							filterExpression.push([ filterName, 'is','@NONE@' ]);
							
						} else {
							filterExpression.push([ filterName, 'is',
								filterValues[i] ]);
						}
					}
					if (newFilters.length > 0) {
						newFilters.push('AND');
					}
					newFilters.push(filterExpression);
				} else if (fieldType != null
						&& formula == null
						&& (fieldType.equals("date") || fieldType
								.equals("datetime"))) {
					var filterValues = filters[filterName];
					var filterExpression = new Array();
					for (i in filterValues) {
						if (i > 0) {
							filterExpression.push('OR');
						}
						if ('- None -'.equals(filterValues[i])) {
							filterExpression.push([ filterName, 'is','@NONE@' ]);
							
						} else {
							filterExpression.push([ filterName, 'on',
								filterValues[i] ]);
						}
					}
					if (newFilters.length > 0) {
						newFilters.push('AND');
					}
					newFilters.push(filterExpression);
				} else if (fieldType != null
						&& formula == null
						&& (fieldType.equals("number")
								|| fieldType.equals("decimal")
								|| fieldType.equals("currency")
								|| fieldType.equals("float")
								|| fieldType.equals("integer")
								|| fieldType.equals("currency2") )) {
					var filterValues = filters[filterName];
					var filterExpression = new Array();
					for (i in filterValues) {
						if (i > 0) {
							filterExpression.push('OR');
						}
						if ('- None -'.equals(filterValues[i])) {
							filterExpression.push([ filterName, 'is',
													'@NONE@' ]);
							
						} else {
							filterExpression.push([ filterName, 'equalto',
								filterValues[i] ]);
						}
					}
					if (newFilters.length > 0) {
						newFilters.push('AND');
					}
					newFilters.push(filterExpression);
				} else if (formula != null
						&& filterName != null
						&& (filterName.equals('formulanumeric')
								|| filterName.equals('formulacurrency'))) {
					var filterValues = filters[filter];
					var filterExpression = new Array();
					for (i in filterValues) {
						if (i > 0) {
							filterExpression.push('OR');
						}
						if ('- None -'.equals(filterValues[i])) {
							filterExpression.push([
													[ filterName, ':', formula ].join(""),
													'is', '@NONE@' ]);
						} else {
						filterExpression.push([
								[ filterName, ':', formula ].join(""),
								'equalto', filterValues[i] ]);
						}
					}
					if (newFilters.length > 0) {
						newFilters.push('AND');
					}
					newFilters.push(filterExpression);
				} else if (formula != null
						&& filterName != null
						&& (filterName.equals('formuladate') || filterName
								.equals('formuladatetime'))) {
					var filterValues = filters[filter];
					var filterExpression = new Array();
					for (i in filterValues) {
						if (i > 0) {
							filterExpression.push('OR');
						}
						if ('- None -'.equals(filterValues[i])) {
							filterExpression.push([
													[ filterName, ':', formula ].join(""),
													'is', '@NONE@' ]);
						} else {
						filterExpression.push([
								[ filterName, ':', formula ].join(""), 'on',
								filterValues[i] ]);
						}
					}
					if (newFilters.length > 0) {
						newFilters.push('AND');
					}
					newFilters.push(filterExpression);
				} else if (formula != null && filterName != null
						&& (filterName.equals('formulatext') 
								|| filterName.equals('formulapercent'))) {
					var filterValues = filters[filter];
					var filterExpression = new Array();
					for (i in filterValues) {
						if (i > 0) {
							filterExpression.push('OR');
						}
						if ('- None -'.equals(filterValues[i])) {
							filterExpression.push([
													[ filterName, ':', formula ].join(""),
													'is', '@NONE@' ]);
						} else {
							filterExpression.push([
								[ filterName, ':', formula ].join(""), 'is',
								filterValues[i] ]);
						}
					}
					if (newFilters.length > 0) {
						newFilters.push('AND');
					}
					newFilters.push(filterExpression);
				}
			}
		}
		nlapiLogExecution('debug', "newFilters", JSON.stringify(newFilters));

		var newSearch = nlapiCreateSearch(oldType, newFilters, aColumns);
		var searchResults = newSearch.runSearch();
		searchResults.forEachResult(function processSearchResult(searchResult) {

			var row = new Object();

			var columns = searchResult.getAllColumns();
			for ( var j in columns) {
				var column = columns[j];
				var cell = new Object();

				var columnName = column.getName();
				var join = column.getJoin();
				if (join != null) {
					columnName = [ join, '.', columnName ].join("");
				} 


				if (column.getFormula() != null) {
					var formularaw = column.getFormula();
					var formula = formularaw.replace(/\s/g, ' ');
					columnName = columnName + '|||' + formula;
				}
				cell["id"] = columnName;
				var label = searchResult.getText(column);
				var value = searchResult.getValue(column);
				if (label == null) {
					label = value;
				}
				if (value == null || value == "" && label != null) {
					value = label;
				}
				cell["label"] = label;
				cell["value"] = value;
				row[columnName] = cell;
			}
			resultsArray.push(row);
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
	postdata['records'] = resultsArray;
	var timings = new Object();
	timings['start'] = startTime;
	timings['finish'] = new Date().getTime();
	postdata['timings'] = timings;

	// post search results to icharts web service
	var header = new Object();
	header['User-Agent-x'] = 'SuiteScript-Call';
	header['Content-Type'] = 'application/json';
	header['Accept'] = 'application/json';

	var jsonPostData = JSON.stringify(postdata);
	nlapiLogExecution('debug', 'jsonPostData', jsonPostData);
	nlapiLogExecution('debug', 'before postBack data',  new Date().getTime());
	var response = nlapiRequestURL(postBackURL, jsonPostData, header);
	var endTime = new Date().getTime();
	nlapiLogExecution('debug', "run time", endTime - startTime);
	nlapiLogExecution('debug', 'script end time', endTime);
	return response;
}

function getSummaryColumn(columnName, summaryType) {
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
	var column = new nlobjSearchColumn(filterName, join, summaryType);
	if (formula != null) {
		column.setFormula(formula);
	}
	return column;
}

function getColumnName(columnNameIn) {
	var columnNameOut = columnNameIn;
	if (columnNameIn.indexOf('|||') != -1) {
		var tokens = columnNameIn.split('|||');
		if (tokens != null && tokens.length > 0 && tokens[0] != null)
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

function canFilterColumn(savedSearch, searchType, columnName) {
	try {
		var filter = new nlobjSearchFilter(columnName, null, 'noneof', '@NONE@');
        var column = new nlobjSearchColumn(columnName, null, null);
		var newSearch = nlapiCreateSearch(searchType, filter, column);

	} catch (e) {
		return false;
	}
	return true;
}