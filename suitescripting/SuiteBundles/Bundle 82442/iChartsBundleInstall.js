

//installICharts();

function installICharts() {
	var context = nlapiGetContext();
	var account = context.getCompany();

   	nlapiLogExecution('debug', 'account', account);
    var userEmail = context.getEmail();
 
   	nlapiLogExecution('debug', 'email', userEmail);

    var companyInfo = nlapiLoadConfiguration( 'companyinformation' );
    var companyName = companyInfo.getFieldValue('companyname');
   	nlapiLogExecution('debug', 'company name', companyName);
   	
   	var user = context.getUser();
   	var userFirstLastName = getFirstLastName(user);
   	

   	var viewDataSuiteletId = getViewDataSuiteletId();
   	
    var postdata = new Object();
    
    postdata['externalAccountId'] = account;
    postdata['customerName'] = companyName;
    postdata['userEmail'] = userEmail;
    postdata['userFirstName'] = userFirstLastName['firstName'];
    postdata['userLastName'] = userFirstLastName['lastName'];
    postdata['viewDataSuiteletId'] = viewDataSuiteletId;
    
    //post search results to icharts web service
    var header = new Object();
    header['User-Agent-x'] = 'SuiteScript-Call';
    header['Content-Type'] = 'application/json';   
    header['Accept'] = 'text/plain';
    var response = nlapiRequestURL('https://accounts.icharts.net/gallery2.0/rest/accounts/createnewexternalcustomer', 
    		JSON.stringify(postdata), header);
    
    var vizKits= ['Finance', 'Support', 'Sales', 'Executive', 'Marketing'];
    for (var i = 0; i < vizKits.length; i++) {
        copyVizKit(userEmail, vizKits[i]);
    }
    
    addMissingPortletDeploymentsForVizKits(vizKits);
    
    return response;
}

function checkUserAllowed()
{
	var context = nlapiGetContext();
	var account = context.getCompany();

   	nlapiLogExecution('debug', 'account', account);
    var userEmail = context.getEmail();


   	nlapiLogExecution('debug', 'email', userEmail);

    var companyInfo = nlapiLoadConfiguration( 'companyinformation' );
    var companyName = companyInfo.getFieldValue('companyname');
   	nlapiLogExecution('debug', 'company name', companyName);

   
          if ( userEmail.indexOf('@netsuite.com') == -1 && userEmail.indexOf('@icharts.net') == -1) 
           {
                   throw new nlobjError('INSTALLATION_ERROR','This is an internal SuiteApp for use by NetSuite employees. If you are interested in iCharts for NetSuite SuiteApp, please contact us at netsuite@icharts.net or (650)472-0650.');
          }
 
}

function getViewDataSuiteletId() {
	try {
		var result = "";
		var searchFilters = new Array();
		var searchColumns = new Array();
		searchColumns.push(new nlobjSearchColumn('internalid'));
		searchColumns.push(new nlobjSearchColumn('scriptid'));
		searchFilters.push(new nlobjSearchFilter('scriptid', null, 'is', 'customscriptichartsgetdetailssuitelet'));

		var searchResults = nlapiSearchRecord('script', null,
				searchFilters, searchColumns);

		for (var i = 0; searchResults != null && i < searchResults.length; i++) {
			var searchResult = searchResults[i];
				var internalid = searchResult.getValue('internalid');
				nlapiLogExecution('debug', 'script internalid', internalid);
				result = internalid;
				break;
		}
	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n'
					+ e.getDetails());
		} else {
			nlapiLogExecution('ERROR', 'unexpected error', e.toString());
		}
	}
	return result;

}

function getFirstLastName(employeeId) {
	var result = new Object();

	try {
		var searchFilters = new Array();
		var searchColumns = new Array();
		searchColumns.push(new nlobjSearchColumn('firstname'));
		searchColumns.push(new nlobjSearchColumn('lastname'));
		searchFilters.push(new nlobjSearchFilter('internalid', null, 'is', employeeId));

		var searchResults = nlapiSearchRecord('employee', null,
				searchFilters, searchColumns);

		for (var i = 0; searchResults != null && i < searchResults.length; i++) {
			var searchResult = searchResults[i];
				result['firstName'] = searchResult.getValue('firstname');
				result['lastName'] = searchResult.getValue('lastname');
				break;
		}
	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n'
					+ e.getDetails());
		} else {
			nlapiLogExecution('ERROR', 'unexpected error', e.toString());
		}
	}
	return result;

}

function copyVizKit(targetUserEmail, vizKit) {
  var userEmailIdToCopyChartsFrom = 'dashboard_bundler@icharts.net';
  var chartIdsToCopy = getChartsToCopyForVizKit(vizKit);
  var postdata = new Object();
  postdata['sourceUserId'] = userEmailIdToCopyChartsFrom;
  postdata['targetUserId'] = targetUserEmail;
  postdata['canCopyAllCharts'] = 'false';
  postdata['chartIds'] = chartIdsToCopy;
  
  //post search results to icharts web service
  var header = new Object();
  header['User-Agent-x'] = 'SuiteScript-Call';
  header['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';   
  header['Accept'] = 'application/json';
  var response = nlapiRequestURL('http://accounts.icharts.net/gallery2.0/rest/accounts/copyobjects', 
  		postdata, header);
  
  var responseBody  = response.getBody();
  nlapiLogExecution('debug', 'responseBody', responseBody);
  try {
	  var copiedChartMapping = JSON.parse(responseBody);
	  updateMappingsForCopiedCharts(vizKit, copiedChartMapping);
  } catch (e) {
    nlapiLogExecution('error', 'Invalid response from copyobjects web service', responseBody);
  }
}

function getChartsToCopyForVizKit(vizKit) {
	var chartIds = "";
	try {
		var searchFilters = new Array();
		var searchColumns = new Array();
		searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingchartid'));
		searchFilters.push(new nlobjSearchFilter('custrecordichartsmappingvizkit', null, 'is', vizKit));
		searchFilters.push(new nlobjSearchFilter('custrecordichartsmappingenabled', null, 'is', 'F'));

		var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null,
				searchFilters, searchColumns);

		for (var i = 0; searchResults != null && i < searchResults.length; i++) {
			var searchResult = searchResults[i];
			if (i > 0) {
				chartIds += ',';
			}
			chartIds += searchResult.getValue('custrecordichartsmappingchartid');
		}
	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n'
					+ e.getDetails());
		} else {
			nlapiLogExecution('ERROR', 'unexpected error', e.toString());
		}
	}
    return chartIds;
}

function addMissingPortletDeploymentsForVizKits(vizKits) {
	try {
		var searchFilters = new Array();
		var searchColumns = new Array();
		searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingportletid'));
		searchColumns.push(new nlobjSearchColumn('custrecordichartsmappingportletname'));

        for (var i = 0; i < vizKits.length; i++) {
           if (i > 0) {
             searchFilters.push('or');
           }  
		   searchFilters.push(['custrecordichartsmappingvizkit', 'is', vizKits[i]]);
        }

		var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null,
				searchFilters, searchColumns);

		for (var i = 0; searchResults != null && i < searchResults.length; i++) {
			var searchResult = searchResults[i];
			var portletId = searchResult.getValue('custrecordichartsmappingportletid');
			var portletName = searchResult.getValue('custrecordichartsmappingportletname');
			addPortletDeploymentIfMissing(portletId, portletName);
		}
	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n'
					+ e.getDetails());
		} else {
			nlapiLogExecution('ERROR', 'unexpected error', e.toString());
		}
	}
}

function updateMappingsForCopiedCharts(vizKit, chartMapping) {
	for (var oldChartId in chartMapping) {
		var newChartId = chartMapping[oldChartId];
		var recordsToUpdate = getRecordsForVizKitAndChart(vizKit, oldChartId);
		for (var i = 0; i < recordsToUpdate.length; i++) {
                  var mappingRecord = recordsToUpdate[i];
    		  mappingRecord.setFieldValue('custrecordichartsmappingchartid', newChartId);
    		  mappingRecord.setFieldValue('custrecordichartsmappingsourcechartid', oldChartId);
    		  mappingRecord.setFieldValue('custrecordichartsmappingenabled', 'T');
	        result = nlapiSubmitRecord(mappingRecord, true);
		}
	}
	
}

function getRecordsForVizKitAndChart(vizKit, chartId) {
	var result = new Array();

	var searchFilters = new Array();
	searchFilters.push(	new nlobjSearchFilter('custrecordichartsmappingvizkit', null, 'is', vizKit));
	searchFilters.push(	new nlobjSearchFilter('custrecordichartsmappingchartid', null, 'is', chartId));
	
	var searchColumns = new Array();
	var internalIdColumn = new nlobjSearchColumn('internalid');
	searchColumns.push(internalIdColumn);
	var searchResults = nlapiSearchRecord('customrecordichartsportletchartmapping', null, searchFilters, searchColumns);
   	for (i in searchResults) {
		var searchResult = searchResults[i];
		var recordId = searchResult.getValue(internalIdColumn);
		result.push( nlapiLoadRecord('customrecordichartsportletchartmapping', recordId));
   	}
	return result;
}

function addPortletDeploymentIfMissing(portletId, portletName) {
	var portletFound = findPortletDeployment(portletId);
	// if the portlet was found we don't need to create it
	if  (portletFound == false) {
		createPortletDeployment(portletId, portletName);
	}
}

function findPortletDeployment(portletId) {
	var result = false;
	try {
		var searchFilters = new Array();
		var searchColumns = new Array();
		searchColumns.push(new nlobjSearchColumn('title'));

		searchFilters.push( new nlobjSearchFilter('scriptid', null, 'is', portletId)); 

		var searchResults = nlapiSearchRecord('scriptdeployment', null,
				searchFilters, searchColumns);
		if (searchResults != null && searchResults.length > 0) {
			result = true;
		}
	} catch (e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n'
					+ e.getDetails());
		} else {
			nlapiLogExecution('ERROR', 'unexpected error', e.toString());
		}
	}
	return result;
}

function createPortletDeployment(portletId, portletName) {
	var searchFilters = new Array();
	var searchColumns = new Array();
	searchColumns.push(new nlobjSearchColumn('internalid'));
	searchFilters.push(new nlobjSearchFilter('scriptid', null, 'is', 'customscriptichartsportlet'));

	var script = null;
	var searchResults = nlapiSearchRecord('script', null, searchFilters, searchColumns);
	for ( var i = 0; searchResults != null && i < searchResults.length; i++ )
	{
		var searchResult = searchResults[ i ];
		script = searchResult.getValue('internalid');
		break;
	}
		
	var record = nlapiCreateRecord('scriptdeployment', {'script':script});
    record.setFieldValue('title', portletName);
    var strippedPortletId = portletId.replace('customdeploy', '');
    record.setFieldValue('scriptid', strippedPortletId);
    record.setFieldValue('status', "RELEASED");
    record.setFieldValue('loglevel', "DEBUG");
    record.setFieldValue('audslctrole', 3); // Administrator
	var context = nlapiGetContext();
	var user = context.getUser();

    record.setFieldValue('audemployee', user);
    record.setFieldValue('custscriptichartsportleteditor', user.toString());
    var customDeployId = nlapiSubmitRecord(record, true);
	nlapiLogExecution('DEBUG', 'portlet deployed', customDeployId);

}

function beforeInstall()
{
	checkUserAllowed();
}
 
function afterInstall()
{
	installICharts();
}
 
function beforeUpdate()
{
	checkUserAllowed();

}
 
function afterUpdate()
 
{
	installICharts();
}