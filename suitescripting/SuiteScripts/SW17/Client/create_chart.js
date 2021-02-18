require(['N/search'], function(search) {

// NOTE: Commented-out code is just example of what you *could* do with these charts

	new Chartist.Line('#chart1', {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		series: [ [ 1, 3, 7, 13, 21, 31 ] ]
	}, {
		height: '200px',
		width: '300px'
	});

	new Chartist.Bar('#chart2', {
		  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		  series: [
		    [ 10, 3, 17, 13, 21, 31 ], [ 12, 4, 16, 8, 10, 12]
		  ]
		}, {
		  seriesBarDistance: 10,
		  axisX: {
		    offset: 60
		  },
		  axisY: {
		    offset: 80,
		    labelInterpolationFnc: function(value) {
		      return '$' + value
		    },
		    scaleMinSpace: 15
		  }
		});

//	var paymentsByMonthSearch = search.load({
//		id: 'customsearch_payments_by_month'
//	}).run();
//	var resultsArray = getDataOnly(paymentsByMonthSearch);
//	var paymentsArray = [];
//	for(var i = 0; i < resultsArray.length; i++) {
//		paymentsArray.push(resultsArray[i][3]);
//	}
		
	// new Chartist.Line('#chart1', {
	// 	labels: ['Jan', 'Feb', 'Mar'],
	// 	series: [ paymentsArray ]
	// }, {
	// 	height: '200px',
	// 	width: '300px'
	// });
	
	// var revenuePerDaySearch = search.load({
	// 	id: 'customsearch_revenue_per_day'
	// }).run();
	// var resultsArray = getDataOnly(revenuePerDaySearch);
	// var expectedArray = [], actualArray = [], dateArray = [];
	// for(var i = 0; i < resultsArray.length; i++) {
	// 	dateArray.push(resultsArray[i][0]);
	// 	expectedArray.push(resultsArray[i][3]);
	// 	actualArray.push(resultsArray[i][5]);
	// }

	// new Chartist.Bar('#chart2', {
	// 	  labels: dateArray,
	// 	  series: [
	// 	    expectedArray, actualArray
	// 	  ]
	// 	}, {
	// 	  seriesBarDistance: 10,
	// 	  axisX: {
	// 	    offset: 60
	// 	  },
	// 	  axisY: {
	// 	    offset: 80,
	// 	    labelInterpolationFnc: function(value) {
	// 	      return '$' + value
	// 	    },
	// 	    scaleMinSpace: 15
	// 	  }
	// 	});
	
	// function getDataOnly(searchResults) { // accepts search.ResultSet object		
	// 	// gets the search results and stores the pieces in an array as strings
	// 	// then stores the array in another array
	// 	// returns array of arrays containing data pieces for each result
	// 	var dataArray = [];
	// 	var tempResult = [];
	// 	var batch; // will store arrays returned from the getRange() call
	// 	var batchSize = 1000; // ask for batches of 1000 (maximum for getRange)

	// 	// get the data from each column for each record returned by the search
	// 	var startIndex = 0,
	// 		endIndex = batchSize;
	// 	do {
	// 		batch = searchResults.getRange(startIndex, endIndex);
	// 		startIndex = endIndex;
	// 		endIndex += batchSize;

	// 		for (var i = 0; i < batch.length; i++) { // cycles over records in current batch array
	// 			for (var j = 0; j < searchResults.columns.length; j++) { // cycles through each column
	// 				var tempString = getDataItem(batch[i], j);
	// 				tempResult.push(tempString);
	// 			}
	// 			dataArray.push(tempResult);
	// 			tempResult = [];
	// 		}
	// 	} while (batch.length == endIndex - startIndex); // NEED TO TEST numRecords % 1000 = 0

	// 	return dataArray;
	// }

	// function getDataItem(result, columnNum) { // accepts search.Result, integer
	// 	// when using getValue(), some search results are returned as IDs - getText() grabs the text behind the IDs
	// 	// but returns null when the result is not an ID. Then getValue() is called on the result instead.
	// 	var tempString = result.getText({
	// 		name: result.columns[columnNum]
	// 	});
	// 	if (tempString == null) {
	// 		return result.getValue({
	// 			name: result.columns[columnNum]
	// 		});
	// 	};
	// 	return tempString;
	// }
	
});