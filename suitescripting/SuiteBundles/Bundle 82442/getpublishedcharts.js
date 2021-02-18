//var datain = new Object();
//datain.charttitle = 'Test Chart 1';
//datain.chartid = 'abcdef';
//publishChart(datain);

function recordAdded() {
	var recordId = nlapiGetRecordId();
	var recordType = nlapiGetRecordType();
	var fields = [ 'name', 'custrecordgetpublishedichartspostackurl',
			'custrecordgetpublishedichartsportletid' ];
	var fieldValues = nlapiLookupField(recordType, recordId, fields);
	var datain = new Object();
	datain.requestid = fieldValues['name'];
	datain.postbackurl = fieldValues['custrecordgetpublishedichartspostackurl'];
	datain.portletid = fieldValues['custrecordgetpublishedichartsportletid'];
	getPublishedCharts(datain);
	nlapiDeleteRecord(recordType, recordId);
}

function getPublishedCharts(datain) {
	var requestid = datain.requestid;
	var postBackURL = datain.postbackurl;
	var portletId = datain.portletid;
	var charts = null;
	var statusCode = "";
	try {

		var portletRecord = nlapiLoadRecord('scriptdeployment', portletId);

		var chartsList = portletRecord
				.getFieldValue('custscriptichartschartids');

		charts = JSON.parse(chartsList);
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

	var postdata = new Object();
	postdata['requestid'] = requestid;
	if (statusCode != null && !statusCode.equals("")) {
		postdata['statuscode'] = statusCode;
	} else {
		postdata['charts'] = charts;
	}
	var header = new Object();
	header['User-Agent-x'] = 'SuiteScript-Call';
	header['Content-Type'] = 'application/json';
	header['Accept'] = 'application/json';

	var response = nlapiRequestURL(postBackURL, JSON.stringify(postdata),
			header);

	return response;
}
