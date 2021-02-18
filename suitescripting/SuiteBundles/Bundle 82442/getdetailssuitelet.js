	//var datain = new Object();
	//datain.savedsearch = 'customSearch192';
	//datain.filters = '[]';
	//getDetails(datain);
	
function getDetailsSuitelet(request, response)
{
 	
	var savedSearch = request.getParameter('savedSearch');
	var filters = request.getParameter('filters');
	nlapiLogExecution('debug', 'savedSearch', savedSearch);
	nlapiLogExecution('debug', 'filters', filters);
	var datain = new Object();
	datain.savedsearch = savedSearch;
	datain.filters = filters;
	var newSearch = getDetails(datain);
	if (newSearch != null) {
	  newSearch.setRedirectURLToSearchResults();
	}
}
	
	function getDetails(datain) {
		var startTime = new Date().getTime();
		nlapiLogExecution('debug', 'start time', startTime);
		var savedsearch = datain.savedsearch;
		var filterString = datain.filters;
		nlapiLogExecution('debug', 'filterString', filterString);
	
		var status = new Object();
		var resultsArray= new Object();
		try {
			// Define search columns
	
			var oldSearch = nlapiLoadSearch(null, savedsearch);
			var oldType = oldSearch.getSearchType();
			var oldSearchId = oldSearch.getId();
			var oldFilterExpression = oldSearch.getFilterExpression();
			var oldColumns = oldSearch.getColumns();
		
			var newFilters = new Array();
			for ( var i in oldFilterExpression) {
				var filter = oldFilterExpression[i];
				// work around netsuite bug
				if (filter[1] == 'isempty' || filter[1] == 'isnotempty') {
					var fixedFilter = filter.slice(0);
					fixedFilter.push("");
					filter = fixedFilter;
				}
				newFilters.push(filter);
			}
	
			if (filterString != null) {
				var filters = JSON.parse(filterString);
				for ( var filter in filters) {
					var filterName = getColumnName(filter);
					var formula = getFormula(filter);
					var fieldType = null;
					for ( var column in oldColumns) {
						var join = oldColumns[column].getJoin();
						var name = oldColumns[column].getName();
						if (join != null) {
							name = [ join, '.', name ].join("");
						}
						if (name != null && name.equals(filterName)) {
							fieldType = oldColumns[column].getType();
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
					if (fieldType != null
							&& formula == null
							&& (fieldType.equals("select")
									|| fieldType.equals("text") || fieldType
									.equals("checkbox"))) {
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
									|| fieldType.equals("currency2") || fieldType
									.equals("percent"))) {
						var filterValues = filters[filterName];
						var filterExpression = new Array();
						for (i in filterValues) {
							if (i > 0) {
								filterExpression.push('OR');
							}
							if ('- None -'.equals(filterValues[i])) {
								filterExpression.push([ filterName, 'is','@NONE@' ]);
								
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
									|| filterName.equals('formulacurrency') || filterName
									.equals('formulapercent'))) {
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
							&& (filterName.equals('formulatext'))) {
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
	
			nlapiLogExecution('debug', 'newFilters', JSON.stringify(newFilters));
			
			var newSearch = nlapiCreateSearch(oldType, newFilters, oldColumns);
			nlapiLogExecution('DEBUG', 'newSearch: ', newSearch.toString());
			return newSearch;
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
		return null;
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
