//var datain = new Object();
//datain.charttitle = 'Test Chart 1';
//datain.chartid = 'abcdef';
//publishChart(datain);
 
 
function recordAdded() {
	nlapiLogExecution('DEBUG', 'recordAdded');
	var recordId = nlapiGetRecordId();
	var recordType = nlapiGetRecordType();
	var fields = ['name', 'custrecordportlettitle', 'custrecordaddportletpostbackurl'];
	//	var record = nlapiLoadRecord(recordType, recordId);
	var fieldValues = nlapiLookupField(recordType, recordId, fields);
	nlapiLogExecution('DEBUG', 'fieldValues', JSON.stringify(fieldValues));
	var datain = new Object();
    datain.portlettitle = fieldValues['custrecordportlettitle'];
	datain.requestid = fieldValues['name'];
	datain.postbackurl = fieldValues['custrecordaddportletpostbackurl'];
	createPortlet(datain);
	nlapiDeleteRecord(recordType, recordId);
}

function createPortlet(datain)
{
	nlapiLogExecution('DEBUG', 'createPortlet', JSON.stringify(datain));
	var portlettitle = datain.portlettitle;
	var requestid = datain.requestid;
	var postBackURL = datain.postbackurl;   

	var searchFilters = new Array();
	var searchColumns = new Array();
	searchColumns.push(new nlobjSearchColumn('internalid'));
	searchFilters.push(new nlobjSearchFilter('scriptid', null, 'is', 'customscriptichartsportlet'));

	var script = null;
	var searchResults = nlapiSearchRecord('portlet', null, searchFilters, searchColumns);
	for ( var i = 0; searchResults != null && i < searchResults.length; i++ )
	{
		var searchResult = searchResults[ i ];
		script = searchResult.getValue('internalid');
		break;
	}

	nlapiLogExecution('DEBUG', 'script', script);
	
	
	var record = nlapiCreateRecord('scriptdeployment', {'script':script});
    record.setFieldValue('title', portlettitle);
    record.setFieldValue('status', "RELEASED");
	var context = nlapiGetContext();
	var user = context.getUser();

    record.setFieldValue('audemployee', user);
    record.setFieldValue('custscriptichartsportleteditor', user.toString());
    record.setFieldValue('custscriptichartsportlettitle', portlettitle);
    var portletId  = nlapiSubmitRecord(record, true);

    var postdata = new Object();
    postdata['requestid'] = requestid;
    postdata['portletid'] = portletId;
    
    //post search results to icharts web service
    var header = new Object();
    header['User-Agent-x'] = 'SuiteScript-Call';
    header['Content-Type'] = 'application/json';   
    header['Accept'] = 'application/json';

	nlapiLogExecution('DEBUG', 'postdata', JSON.stringify(postdata));
    var result = nlapiRequestURL(postBackURL, JSON.stringify(postdata), header);

    return result;	
}
   
 