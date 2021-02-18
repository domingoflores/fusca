//var datain = new Object();
//datain.postbackurl = 'http://www.google.com';
//datain.requestid = 'getchartportletsrequest1403220903094_565';
//getIChartPortlets(datain);

function recordAdded() {
	var recordId = nlapiGetRecordId();
	var recordType = nlapiGetRecordType();

	var fields = [ 'name', 'custrecordgetportletspostbackurl' ];
	var fieldValues = nlapiLookupField(recordType, recordId, fields);

	var datain = new Object();
	datain.requestid = fieldValues['name'];
	datain.postbackurl = fieldValues['custrecordgetportletspostbackurl'];
	
	getIChartPortlets(datain);
	
	nlapiDeleteRecord(recordType, recordId);
}

function getIChartPortlets(datain) {

	nlapiLogExecution('DEBUG', 'getUser', nlapiGetContext().getUser());
	nlapiLogExecution('DEBUG', 'getRole' , nlapiGetContext().getRole());
	nlapiLogExecution('DEBUG', 'getExecutionContext' , nlapiGetContext().getExecutionContext());

	var requestid = datain.requestid;
	var postBackURL = datain.postbackurl;

	var currentUser = nlapiGetContext().getUser();
	
	var portlets = new Array();
	var statusCode = "";
	try {
		var searchFilters = new Array();
		var searchColumns = new Array();
		searchColumns.push(new nlobjSearchColumn('internalid'));
		searchColumns.push(new nlobjSearchColumn('scripttype'));
		searchColumns.push(new nlobjSearchColumn('title'));
		searchColumns.push(new nlobjSearchColumn('script'));

		var searchResults = nlapiSearchRecord('scriptdeployment', null,
				searchFilters, searchColumns);

		for (var i = 0; searchResults != null && i < searchResults.length; i++) {
			var searchResult = searchResults[i];
			var scriptType = searchResult.getValue('scriptType');

			if (scriptType != null && scriptType.equalsIgnoreCase('PORTLET')) {
				var internalid = searchResult.getValue('internalid');
				nlapiLogExecution('debug', 'script internalid', internalid);
				var portletEditor = '';
				try {
				if(internalid){
					var record = nlapiLoadRecord('scriptdeployment', internalid);
					portletEditor = record.getFieldValue('custscriptichartsportleteditor');
				}
				
				//only portletEditor can publish charts to the portlet
// TODO: why can't any user with permission publish to portlet?				
//				if(currentUser == portletEditor){
					var scriptTitle = searchResult.getValue('title');
                                         nlapiLogExecution('debug', 'user is portlet editor, title=', scriptTitle);
					var script = searchResult.getValue('script');
                    var scriptid = null;
					if (script) {
						scriptid = nlapiLookupField('portlet', script,
								'scriptid');
					}
				nlapiLogExecution('debug', 'scriptid', scriptid);
					if ('customscriptichartsportlet'.equalsIgnoreCase(scriptid)) {
				nlapiLogExecution('debug', 'adding portlet', scriptid);

						portlets.push({
							'scriptid' : internalid,
							'scripttitle' : scriptTitle
						});
					}
// TODO: why can't any user with permission publish to portlet?				
//				}
				} catch (recordException) {
					// ignore record level exceptions and go on to try next record.
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

	nlapiLogExecution('DEBUG', 'portlets' , JSON.stringify(portlets));

	var postdata = new Object();
	postdata['requestid'] = requestid;
	if (statusCode != null && !statusCode.equals("")) {
		postdata['statuscode'] = statusCode;
	} else {
		postdata['portlets'] = portlets;
	}
	// post search results to icharts web service
	var header = new Object();
	header['User-Agent-x'] = 'SuiteScript-Call';
	header['Content-Type'] = 'application/json';
	header['Accept'] = 'application/json';

	var result = nlapiRequestURL(postBackURL, JSON.stringify(postdata), header);

	return result;
}
