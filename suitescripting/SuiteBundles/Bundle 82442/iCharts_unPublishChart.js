//var datain = new Object();
//datain.portletid= '656';
//datain.chartid = 'M3nVzC5F';
//unPublishChart(datain);

function recordAdded() {
    var recordId = nlapiGetRecordId();
    var recordType = nlapiGetRecordType();
    var fields = ['name', 'custrecordichartsportletid'];
    var fieldValues = nlapiLookupField(recordType, recordId, fields);
    var datain = new Object();
    datain.portletid = fieldValues['custrecordichartsportletid'];
    datain.chartid = fieldValues['name'];
    
    unPublishChart(datain);
    
    nlapiDeleteRecord(recordType, recordId);
}
		 
function unPublishChart(datain)
{
    var result = null; 
    var searchFilters = new Array();
    var searchColumns = new Array();
    
    searchColumns.push(new nlobjSearchColumn('internalId'));
    searchColumns.push(new nlobjSearchColumn('script'));
    searchColumns.push(new nlobjSearchColumn('scripttype'));
    searchFilters.push(new nlobjSearchFilter('scriptid', null, 'is', datain.portletid));
    
    nlapiLogExecution('DEBUG', 'portletId', datain.portletid);
    nlapiLogExecution('DEBUG', 'chartId', datain.chartid);
    
    try {
	    var portletIntenalId = null;
	    var searchResults = nlapiSearchRecord('scriptdeployment', null, searchFilters, searchColumns);
    
	    for ( var i = 0; searchResults != null && i < searchResults.length; i++ ){
	        var searchResult = searchResults[ i ];
	        var scriptType = searchResult.getValue('scriptType');
	        var script = '';
	        var scriptid = '';
	        
			if (scriptType != null && scriptType.equalsIgnoreCase('PORTLET')) {
				
				script = searchResult.getValue('script');
				if (script) {
					scriptid = nlapiLookupField('portlet', script, 'scriptid');
				
					if ('customscriptichartsportlet'.equalsIgnoreCase(scriptid)) {
					    portletIntenalId = searchResult.getValue('internalid');
					    
					    if(portletIntenalId){
					    	try{
							    var record = nlapiLoadRecord('scriptdeployment', portletIntenalId);
							    var chartsList = record.getFieldValue('custscriptichartschartids');
								    
							    var portletEditor = record.getFieldValue('custscriptichartsportleteditor');
							    var context = nlapiGetContext();
							    var currentUser = context.getUser();
							    
							    //var currentUserEmail = context.getEmail();
							    nlapiLogExecution('DEBUG', 'portletEditor', portletEditor);
							    nlapiLogExecution('DEBUG', 'user', currentUser);
							    
							    if(currentUser == portletEditor){
							        var charts = JSON.parse(chartsList);
							        if (charts.length > 0) {
								        for (j in charts) {
								            if(charts[j].id == datain.chartid){
								                charts.splice(j, 1);
								                break;
								            }
								        }
								        record.setFieldValue('custscriptichartschartids', JSON.stringify(charts));    
								        result = nlapiSubmitRecord(record, true);
								    } else {								    
									    nlapiLogExecution('DEBUG', 'search datain.portletid', datain.portletid);
									    nlapiLogExecution('DEBUG', 'search datain.chartid', datain.chartid);
								    	var searchFilters = new Array();
								    	searchFilters.push(new nlobjSearchFilter('custrecordichartsmappingportletid', null, 'is', datain.portletid));
								    	searchFilters.push(new nlobjSearchFilter('custrecordichartsmappingchartid', null, 'is', datain.chartid));
								    	var searchColumns = new Array();
								    	searchColumns.push(new nlobjSearchColumn('owner'));
								    	
								    	var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null, searchFilters, searchColumns);
								    	for (i in searchResults) {
								    	   var searchResult = searchResults[i];
									       nlapiLogExecution('DEBUG', 'searchResultId', searchResult.getId());
							    		   nlapiDeleteRecord('customrecordichartsportletchartmapping', searchResult.getId());
								    	}
								    }
							    } else {
							    
								    nlapiLogExecution('DEBUG', 'search datain.portletid', datain.portletid);
								    nlapiLogExecution('DEBUG', 'search datain.chartid', datain.chartid);
							    	var searchFilters = new Array();
							    	searchFilters.push(new nlobjSearchFilter('custrecordichartsmappingportletid', null, 'is', datain.portletid));
							    	searchFilters.push(new nlobjSearchFilter('custrecordichartsmappingchartid', null, 'is', datain.chartid));
							    	searchFilters.push(new nlobjSearchFilter('owner', null, 'is', currentUser));
							    	var searchColumns = new Array();
							    	searchColumns.push(new nlobjSearchColumn('owner'));
							    	
							    	var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null, searchFilters, searchColumns);
							    	for (i in searchResults) {
							    	   var searchResult = searchResults[i];
							    	   var owner = searchResult.getValue('owner');
								        nlapiLogExecution('DEBUG', 'owner', owner);
								        nlapiLogExecution('DEBUG', 'searchResultId', searchResult.getId());
							    	   if (owner == currentUser) {
							    		   nlapiDeleteRecord('customrecordichartsportletchartmapping', searchResult.getId());
							    	   }
							    	}
							    }
					    	}
					    	catch (recordException) {
								// ignore record level exceptions and go on to try next record.
							    nlapiLogExecution('DEBUG', 'exception', recordException);

							}
						}
					}
				}
			}
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
    return result;    
}
 
