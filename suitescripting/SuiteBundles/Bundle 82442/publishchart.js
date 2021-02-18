//		var datain = new Object();
//		datain.portletid= '595';
//		datain.chartid = 'qrs';
//		publishChart(datain);
		 
		 
		function recordAdded() {
		    var recordId = nlapiGetRecordId();
			var recordType = nlapiGetRecordType();
			var fields = ['name', 'custrecordchartportletid', 'custrecordchartwidth', 'custrecordchartheight', 'custrecordichartschartname'];
			var fieldValues = nlapiLookupField(recordType, recordId, fields);
		    var datain = new Object();
		    datain.portletid = fieldValues['custrecordchartportletid'];
		    datain.chartid = fieldValues['name'];
		    datain.chartwidth = fieldValues['custrecordchartwidth'];
		    datain.chartheight = fieldValues['custrecordchartheight'];
		    datain.chartname = fieldValues['custrecordichartschartname'];
		    publishChart(datain);
		    nlapiDeleteRecord(recordType, recordId);
	}
		 
		function publishChart(datain)
		{
		    var result = null;
		    var chartId = datain.chartid;
		    var portletInternalId = datain.portletid;
		    var chartWidth = datain.chartwidth;
		    var chartHeight = datain.chartheight;
		    var chartName = datain.chartname;
		    
		    var chart = new Object();
		    chart.id = chartId;
		    chart.width = chartWidth;
		    chart.height = chartHeight;
		    
	        var portletRecord = nlapiLoadRecord('scriptdeployment', portletInternalId);
	        var chartsList = portletRecord.getFieldValue('custscriptichartschartids');
	        var portletId = portletRecord.getFieldValue('scriptid');
	        var portletName = portletRecord.getFieldValue('custscriptichartsportlettitle');
	        nlapiLogExecution('debug', 'portletInternalId', portletInternalId)
	        nlapiLogExecution('debug', 'portletId', portletId)
	        var charts = JSON.parse(chartsList);
	        var insertIndex = charts.length;
	        
    		//add new chart in place of existing one. else add it to the end
	        if(insertIndex > 0){
	        	for (i in charts) {
	        		if(charts[i].id == chart.id){
		                charts.splice(i, 1);
		                insertIndex = i;
		                break;
		            }
	        	}
	        	charts.splice(insertIndex, 0, chart);
		        
		        portletRecord.setFieldValue('custscriptichartschartids', JSON.stringify(charts));    
		        result = nlapiSubmitRecord(portletRecord, true);
        	} else {
        		var mappingRecord = getExistingRecordForChartAndPortlet(chartId, portletId);
        		if (null == mappingRecord) {
        			mappingRecord = nlapiCreateRecord('customrecordichartsportletchartmapping');
        			var sortOrder = getMaximumSortOrderForPortlet(portletId);
            		mappingRecord.setFieldValue('custrecordichartsmappingchartorder', sortOrder);
        		}
        		var recordName = portletId+ '_' + chartId;
        		mappingRecord.setFieldValue('name', recordName);
        		mappingRecord.setFieldValue('custrecordichartsmappingportletid', portletId);
        		mappingRecord.setFieldValue('custrecordichartsmappingchartid', chartId);
        		mappingRecord.setFieldValue('custrecordichartsmappingchartwidth', chartWidth);
        		mappingRecord.setFieldValue('custrecordichartsmappingchartheight', chartHeight);
        		if (chartName != null) {
        			mappingRecord.setFieldValue('custrecordichartsmappingchartname', chartName);
        		}
        		mappingRecord.setFieldValue('custrecordichartsmappingportletname', portletName);
        		
        		
		        result = nlapiSubmitRecord(mappingRecord, true);
        	}
		 
		    return result;    
		}
		
		function getExistingRecordForChartAndPortlet(chartId, portletId) {
			var result = null;
		
        	var searchFilters = new Array();
        	searchFilters.push(	new nlobjSearchFilter('custrecordichartsmappingportletid', null, 'is', portletId));
        	searchFilters.push(	new nlobjSearchFilter('custrecordichartsmappingchartid', null, 'is', chartId));
        	var searchColumns = new Array();
        	var internalIdColumn = new nlobjSearchColumn('internalid');
        	searchColumns.push(internalIdColumn);
        	var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null, searchFilters, searchColumns);
           	for (i in searchResults) {
        		var searchResult = searchResults[i];
        		var recordId = searchResult.getValue(internalIdColumn);
        		var result = nlapiLoadRecord('customrecordichartsportletchartmapping', recordId);
        		break;
           	}
			return result;
		}
		
		function getMaximumSortOrderForPortlet(portletId) {
			var sortOrder = 10
        	var searchFilters = new nlobjSearchFilter('custrecordichartsmappingportletid', null, 'is', portletId);
        	var searchColumns = new Array();
        	var orderColumn = new nlobjSearchColumn('custrecordichartsmappingchartorder', null, 'max');
        	searchColumns.push(orderColumn);
        	var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null, searchFilters, searchColumns);
           	for (i in searchResults) {
        		var maxSortOrderRecord = searchResults[i];
        		var maxSortOrder = maxSortOrderRecord.getValue(orderColumn);
        		if (maxSortOrder != null && maxSortOrder > 0) {
        			sortOrder = Number(maxSortOrder) + 10;
        			break;
        		}
           	}
    		return sortOrder;
			
		}
		   