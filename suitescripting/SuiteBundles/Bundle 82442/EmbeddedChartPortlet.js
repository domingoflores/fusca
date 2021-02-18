//getCustomRecordMapping();

function buildPortlet(portlet, column)
{
	var startTime = new Date().getTime();
   var context = nlapiGetContext();
    
    var chartsString  = context.getSetting('SCRIPT', 'custscriptichartschartids');
    var charts = JSON.parse(chartsString);
    
    var portletTitle = context.getSetting('SCRIPT', 'custscriptichartsportlettitle');
    portlet.setTitle(portletTitle);
    
    var portletEditor = context.getSetting('SCRIPT', 'custscriptichartsportleteditor');
    var portletId = context.getDeploymentId();
    var currentUser = context.getUser();
    var baseUrl = nlapiOutboundSSO('customssoichartssso');
    var recordMapping = getCustomRecordMapping();
    
    nlapiLogExecution('DEBUG', 'baseUrl', baseUrl);
    nlapiLogExecution('DEBUG', 'current user', currentUser);
    nlapiLogExecution('DEBUG', 'portletEditor', portletEditor);
    nlapiLogExecution('DEBUG', 'recordMapping', recordMapping);
    

    if(portletEditor == currentUser){
        baseUrl = baseUrl + "&editMode=1&portletId=" + portletId;
    }

    nlapiLogExecution('DEBUG', 'charts', charts.length);
    var content = '';
    if (charts.length > 0) {
	    for (i in charts) {
	        var chart = charts[i];
	        var url = baseUrl + '&id='+ chart.id +'&portletTime=' + startTime;
	        if (recordMapping != null) {
	          url += '&customRecordTypes='+encodeURI(recordMapping);
	        }
	        nlapiLogExecution('DEBUG', 'url', url);
	        content = content + '<iframe src="'+url+'" height="'+chart.height+'" width="'+chart.width+'" frameborder="0"></iframe>  &nbsp; &nbsp';
	    }
    } else {
        nlapiLogExecution('DEBUG', 'no charts', null);
        nlapiLogExecution('DEBUG', 'portletId', portletId);
        var searchFilters = new Array();
    	searchFilters.push(['custrecordichartsmappingportletid', 'is', portletId]);

        searchFilters.push('AND');
    	
    	var mappingExpression = new Array();

    	mappingExpression.push(['custrecordichartsmappingenabled', 'is', 'T']);

    	mappingExpression.push('OR');
    	mappingExpression.push(['custrecordichartsmappingenabled', 'isempty', 0]);

    	searchFilters.push(mappingExpression);
   	
     	var searchColumns = new Array();
    	searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingchartorder').setSort());
    	searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingportletid'));
    	searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingchartid').setSort(false));
    	searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingchartwidth'));
    	searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingchartheight'));
    	searchColumns.push(new nlobjSearchColumn('owner'));
    	
    	var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null, searchFilters, searchColumns);
        nlapiLogExecution('DEBUG', 'searchResults', searchResults);
    	for (i in searchResults) {
    		var mappingRecord = searchResults[i];
    		var chartId = mappingRecord.getValue('custrecordichartsmappingchartid');
            nlapiLogExecution('DEBUG', 'chartId', chartId);
            var chartWidth = mappingRecord.getValue('custrecordichartsmappingchartwidth');
    		var chartHeight = mappingRecord.getValue('custrecordichartsmappingchartheight');

    		var url = baseUrl + '&id='+ chartId +'&portletTime=' + startTime;
	        if (recordMapping != null) {
	          url += '&customRecordTypes='+encodeURI(recordMapping);
	        }
	        nlapiLogExecution('DEBUG', 'url', url);
	        content = content + '<iframe src="'+url+'" height="'+chartHeight+'" width="'+chartWidth+'" frameborder="0"></iframe>  &nbsp; &nbsp';
    	}
    }
    
    portlet.setHtml( content ); 
}

function getCustomRecordMapping() {
	var recordMap = new Object();
	try {
	var searchFilters = new Array();
	var searchColumns = new Array();
	searchColumns.push(new nlobjSearchColumn('scriptid'));
	searchColumns.push(new nlobjSearchColumn('internalid'));
	searchFilters.push(new nlobjSearchFilter('scriptid', null, 'startswith', 'customrecordicharts'));

	var searchResults = nlapiSearchRecord('customrecordtype', null, searchFilters, searchColumns);
	for ( var i = 0; searchResults != null && i < searchResults.length; i++ )
	{
		var searchResult = searchResults[ i ];
		var scriptid = searchResult.getValue('scriptid');
		var internalid  = searchResult.getValue('internalid');
		recordMap[scriptid.toLowerCase()] = internalid;
		
	}
	} catch (e) {
		return null;
	}
	var result = JSON.stringify(recordMap);
	return result;
	
}