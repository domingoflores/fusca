function get(args) {
    // Process arguments
    var stringifyOutput = false;
    if (typeof args === 'string' || args instanceof String) {
        args = JSON.parse(args);
        stringifyOutput = true;
    }

    var searchName = args.searchName;
    if (!searchName) {
        searchName = "customsearch" + parseInt(args.searchNumber);
    }
	var offset = parseInt( args.offset || '0' );
	var limit = args.limit;
	if (limit === undefined || limit === null)
		limit = Infinity;
	else
		limit = parseInt(limit);
	var output = { 'diagnosticInfo':{ 'suppliedArguments':args } };
	output.diagnosticInfo.processedArguments = { 'searchName':searchName, 'offset':offset, 'limit':limit };

	// Execute the search
	var search = nlapiLoadSearch(null,searchName);
	var columns = search.getColumns();
	output.columnLabels = columns.map( function(column){ return column.getLabel(); } );
	//output.columnFormulas = columns.map( function(column){ return column.getFormula(); } );

	var columnNames = columns.map( function(column){
		if (column.getFormula() == null) { // null or undefined
			// Scripted field mappings written before formula support just used
			// NetSuite's name, despite the fact that it's not always unique.
			return column.getName();
		} else {
			// For formulas, we can rely on the user to supply a good name
			// in the "Custom Label" setting.
			return column.getLabel();
		}
	});
	var nameInUse = {}
	for (var i = 0; i < columnNames.length; i++) {
		var name = columnNames[i];
		var counter = 1;
		while (nameInUse[name]) {
			++counter;
			name = columnNames[i] + '_' + counter;
		}
		columnNames[i] = name;
		nameInUse[name] = true;
	}
	output.columnNames = columnNames;

	var resultSet = search.runSearch();

	// SAFE guide P. 706
	// https://system.netsuite.com/core/media/media.nl?id=5732122&c=NLCORP&h=5fca4bf5dd825a28ab41&_xt=.pdf
	//
	var governanceLimit = 4000; // 5000 minus 1000 that we leave for other work like runSearch
	var maxCalls = governanceLimit / 10; // 10 units per call
	var maxRows = maxCalls * 1000;
	if (limit > maxRows) {
		limit = maxRows;
	}

	// If we try to get 400,000 rows, we get errors from NetSuite, presumably due to resource limitations.
	// Enforce a smaller limit.
	//
	if (limit > 20000) {
		limit = 20000;
	}

	output.diagnosticInfo.batchProperties = {
		'governanceLimit': governanceLimit,
		'maxCalls': maxCalls,
		'maxRows': maxRows
	};

	output.results = [];

	while (output.results.length < limit) {
		var batchSize = Math.min(limit - output.results.length, 1000);
		output.diagnosticInfo.batchProperties.batchSize = batchSize;
		var searchResultBatch = resultSet.getResults(offset, offset+batchSize);
		var outputBatch = searchResultBatch.map( function(searchResult) {
			var values = columns.map( function(column){
				if (searchResult.getText(column) == null) { // null or undefined
					return searchResult.getValue(column);
				} else if (searchResult.getValue(column) !== "") {
					// The weird old backward-compatible format.
					return {
						internalid: searchResult.getValue(column),
						name: searchResult.getText(column)
					};
				} else {
					// Omit fields that would have had a blank internalid.
					// NetSuite sometimes supplies ever-so-helpful non-blank
					// values for getText, and we want our blanks to be blanks.
					return undefined;
				}
			});
			var outputObject = {
				id: searchResult.getId(),
				recordtype: searchResult.getRecordType()
			};
			var outputFields = {};
			for (var i = 0; i < columns.length; i++) {
				if (values[i] !== undefined) {
					outputFields[columnNames[i]] = values[i];
				}
			}
			outputObject.columns = outputFields;
			return outputObject;
		});
		output.results = output.results.concat(outputBatch);
		if (searchResultBatch.length < batchSize) {
			break;
		} else {
			offset += searchResultBatch.length;
		}
	}

	output.diagnosticInfo.numResults = output.results.length;
	output.restletVersion = '1.0';
	if (stringifyOutput) {
		return JSON.stringify(output);
	} else {
		return output;
	}
}
