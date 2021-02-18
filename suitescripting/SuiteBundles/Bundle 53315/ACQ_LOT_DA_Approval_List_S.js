/**
 * Module Description
 * 
 * This creates a page that list all of the payments ready to be made
 * based on the 'LOT'S TO PAY TODAY' search and the 'CLEARINGHOUSE LOT'S READY TO PAY TODAY'
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Jul 2014     smccurry		   Installed on Production
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function suitelet(request, response){
	var userRole = nlapiGetRole(); // 1025 for SRS Operations Manager, 3 for administrator
	var userDept = nlapiGetDepartment(); // 35 for Operations & Technology : Client Operations : Acquiom Operations
	var httpMethod = request.getMethod();
	
	if(checkPermissions()) {
		 switch(httpMethod) {
			case 'GET':
				renderGET(request, response);
				break;
			case 'POST':
				renderPOST(request, response);
				break;
		}
	}
 	else {
 		renderGETOUT(request, response);
 	}
}

function checkPermissions() {
	var objPermissionList = {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"};
	
	var searchresults = [];
    var arrayUsers    = [];
	try {
		var filters = [];
		var columns = [];
		filters[0] = new nlobjSearchFilter('custrecord_pri_as_app', null, 'is', 'PaymentsProcessing');
		filters[1] = new nlobjSearchFilter('name', null, 'is', 'accessPermission');
		columns[0] = new nlobjSearchColumn('custrecord_pri_as_value');
		searchresults = nlapiSearchRecord('customrecord_pri_app_setting', null, filters, columns );
		objPermissionList = JSON.parse(searchresults[0].getValue('custrecord_pri_as_value'));
	}
	catch(e0) { nlapiLogExecution('DEBUG', 'exception encountered: ' , e0.message ); }
	
	
	return checkPermission(objPermissionList);		
}

//=================================================================================================================================================
// checks the current user against a "standard" permission object to determine whether they match
//          the standard object is either a single object, or an array of objects
//          each element can contain any combination of userId, userRole, and userDept
//=================================================================================================================================================    
function checkPermission(permissionObj) {
	if (!permissionObj) return false; 
	
	var userId      = nlapiGetUser(); 		
	var userRole    = nlapiGetRole(); 	
	var userDept    = nlapiGetDepartment(); 		
	var environment = String(nlapiGetContext().getEnvironment())
  
	if (typeof permissionObj == "string") {
    	try { permissionObj = JSON.parse(permissionObj); } 
        catch (e) { return false; }                             
	} 

	if ((permissionObj instanceof Array)) {
		var tempObj = permissionObj[0];
		if (tempObj.hasOwnProperty("appName") && tempObj.hasOwnProperty("settingName")) {
			permissionObj = tempObj; 
		}
	}
  
	// instead of passing in a permission object, user can also pass in an app setting reference; in that case, this function will read the app setting and do the rest of the work
	if (permissionObj.hasOwnProperty("appName") && permissionObj.hasOwnProperty("settingName")) {
        // they didn't pass in a permission object; they passed in a reference to an App Setting
        var permissionObjAsString = appSettings.readAppSetting(permissionObj.appName, permissionObj.settingName); 
        if (permissionObjAsString) permissionObj = JSON.parse(permissionObjAsString); 
	}
  
	// If permission object is just a simple object place it in an array so it is a list     
	if (!(permissionObj instanceof Array)) permissionObj = [permissionObj];
  
	// if any row of the permission list passes, then user is permitted
	for (var i = 0; i < permissionObj.length; i++) {
		var permissionObjRow = permissionObj[i];
	
		var userMatchesAllProperties = true;
		for (var property in permissionObjRow) {
			var propertyValue = permissionObjRow[property];
	
	    	switch (property) {
	    	case "userId":
	    		if (propertyValue != userId)         userMatchesAllProperties = false;
	    		break;
	    	case "userRole":
	    		if (propertyValue != userRole)       userMatchesAllProperties = false;
	    		break;
	    	case "userDept":
	    		if (propertyValue != userDept)       userMatchesAllProperties = false;
	    		break;
	    	case "environment":
	    		if (propertyValue != environment)    userMatchesAllProperties = false;
	    		break;
	    	default:
	    		userMatchesAllProperties = false; // Unsupported properties will result in a failure
	    	} // switch(property)
	
		} // for(var property in permissionObjRow)
    
    	if (userMatchesAllProperties) return true;                              
	} // for (var i = 0; i < permissionObj.length; i++)
              
  	return false; 
}



function renderGETOUT(request, response) {
	throw 'PERMISSION_DENIED: You do not have permissions to access Payments Dashboard. Please contact your NetSuite administration if you believe this is in error.';
}


function renderGET(request, response){
	
	var mainPage = renderPaymentDashboard(1, request.getAllParameters());
    response.writePage(mainPage);
}


function renderPOST(request, response){
	//Get all of the posted fields/parameters
	var _post = request.getAllParameters(),
		page = _post['page'] || 1;
	
	var mainPage = renderPaymentDashboard(page, request.getAllParameters());
    response.writePage(mainPage);
}

//Builds the Payment Dashboard landing page.
function renderPaymentDashboard(page, filters) {
	var curUser = nlapiGetContext().getUser(),
		form = nlapiCreateForm('Payment Dashboard', false),  //Setup the generation form
		isSingle = filters['lotid'] && filters['lotid'] > 0;
		
	form.setScript('customscript_paymentdashboard_cs');

	loadDashboardFilters();

	//Load resources
	var bootStrapcss = nlapiLoadFile('SuiteBundles/Bundle 53315/css/bootstrap.min.css'),//1836551); // this id will change on production;
		ACQ_LOT_DA_PaymentDashboard_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DA_PaymentDashboard_CSS.css'),
		jQuery_UI_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/jquery-ui.min.css'),
		jQuery_UI_Structure_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/jquery-ui.structure.min.css'),
		jQuery_UI_Theme_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/jquery-ui.theme.min.css');

	//Create filtergroups for grouping/layout
	var filtersGroup = form.addFieldGroup('filtersgroup', 'Filters'),
		filterGroup = form.addFieldGroup('filtergroup', 'Filter'),
		resultsGroup = form.addFieldGroup('resultsgroup', 'Results');
	
	filtersGroup.setShowBorder(false);
	filterGroup.setShowBorder(false);
	resultsGroup.setShowBorder(false);

	var resultsField = form.addField('custpage_results', 'inlinehtml', '', null, 'resultsgroup');
	var search = getPaymentDashboardRecords(page || 1, filters);
	var statusRecords = getResultsProcessPaymentStatuses(search.results);
	nlapiLogExecution('DEBUG', 'PROD support', "search.results.length: " + search.results.length + "" + "");
	nlapiLogExecution('AUDIT', 'PROD support', "search.results: " + JSON.stringify(search) );
	var	resultsHTML = renderResultsTable(search.results, statusRecords, isSingle, page, search.block, search.length);
	resultsField.setDefaultValue(resultsHTML);

	if(!isSingle){
		renderFilters(form, filters);
	}
	
	var pageField = form.addField('custpage_page', 'inlinehtml', '', null, 'resultsgroup');
	pageInputHTML = '<input type="hidden" name="page" id="dashboard-page" value="'+ page +'" />';
	pageField.setDefaultValue(pageInputHTML);
	
	var objToday    = new Date();
	var sToday      = (objToday.getMonth() + 1) + "/" + objToday.getDate() + "/" + objToday.getFullYear(); 
	var nextBusinessDayHTML = '<span class="smallgraytext" style="font-size:12px;" >PAYMENT EFFECTIVE DATE </span>' 
                              + '<input type="text" id="txtPaymentsEffectiveDate" readonly="readonly" style="width:80px;margin-left:5px;margin-right:15px;" value="{0}">'.replace("{0}" ,sToday)
                              + '<input type="checkbox" id="chkNextBusinessDay" onchange="payNextBusinessDayChanged()" value="next">' 
                              + '<span class="smallgraytext" style="font-size:12px;" >&nbsp;Change Payment Effective Date</span>';
	
	var userId   = nlapiGetUser();
	var userRole = nlapiGetRole();        // 1025 for SRS Operations Manager, 3 for administrator		
	var userDept = nlapiGetDepartment();  // 35 for Operations & Technology : Client Operations : Acquiom Operations		

	var searchresults = [];
    var arrayUsers    = [];
	try {
		var filters = [];
		var columns = [];
		filters[0] = new nlobjSearchFilter('name', null, 'is', 'Users with Administrator override in sandbox');
		columns[0] = new nlobjSearchColumn('custrecord_pri_as_value');
		searchresults = nlapiSearchRecord('customrecord_pri_app_setting', null, filters, columns );
		arrayUsers = JSON.parse(searchresults[0].getValue('custrecord_pri_as_value'));
	}
	catch(e0) { nlapiLogExecution('DEBUG', 'xception encountered: ' , e0.message ); }
	
	var userHasAccess = false;
	if( userRole == 1025 && userDept == 35 ) { userHasAccess = true; } 
	if( userRole == 3    && String(nlapiGetContext().getEnvironment()) === "SANDBOX" ) {
		if (arrayUsers.indexOf(parseInt(userId)) > -1) { userHasAccess = true; }
	} 
	if ( !userHasAccess ) { nextBusinessDayHTML = ""; } 
	
	if(!isSingle){
		var buttonField = form.addField('custpage_button', 'inlinehtml', '', null, 'filtergroup');
		var buttonhtml  = '<input id="filterdashboard" type="submit" class="btn btn-sm btn-default btn-control" value="Filter" />';
		buttonhtml     += '<input id="refreshdashboard" type="submit" class="btn btn-sm btn-default btn-control" value="Refresh" />';
		buttonhtml     += '<div style="margin:0px 0px 25px 10px;margin-bottom:10px;display:inline-block;">';
		buttonhtml     += nextBusinessDayHTML;
		buttonhtml     += '</div>';
		buttonhtml     += '<div style="margin:5px 0px 10px 25px;display:inline-block;font-size:12px;">* Results are Payments ready for approval only.</div>';
		buttonField.setDefaultValue(buttonhtml);
	}
	else {
		var nextBusinessDayField = form.addField('custpage_nextbusinessday', 'inlinehtml', '', null, 'filtergroup');
		nextBusinessDayField.setDefaultValue(nextBusinessDayHTML);
	}

	var recList = form.addField('custpage_status_list', 'inlinehtml', '', null, 'filtersgroup');
	var listHTML = '&nbsp;';
	recList.setDefaultValue(listHTML);
	recList.setLayoutType('outsidebelow');
	var scriptField = form.addField('custpage_script', 'inlinehtml', '', null, 'list_group');
	var htmlscript = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js">';
	htmlscript += '</script>';
	var ACQ_LOT_DA_Bootstrap_JavaScript = nlapiLoadFile('SuiteBundles/Bundle 53315/js_libraries/bootstrap.min.js');
	htmlscript += '<script>' + ACQ_LOT_DA_Bootstrap_JavaScript.getValue() + '</script>';
	var jQueryUI_JS = nlapiLoadFile('SuiteBundles/Bundle 53315/js_libraries/jquery-ui.min.js');
	htmlscript += '<script>' + jQueryUI_JS.getValue() + '</script>';

	scriptField.setDefaultValue(htmlscript);
	
	var cssField = form.addField('custpage_csssection', 'inlinehtml', '');
	var cssFieldHTML = '<style>';
	
	cssFieldHTML += bootStrapcss.getValue();
	cssFieldHTML += ACQ_LOT_DA_PaymentDashboard_CSS.getValue();
	cssFieldHTML += jQuery_UI_CSS.getValue();
	cssFieldHTML += jQuery_UI_Structure_CSS.getValue();
	cssFieldHTML += jQuery_UI_Theme_CSS.getValue();
	
	cssFieldHTML += '</style>';
	
	cssFieldHTML += '<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet">';
	cssField.setDefaultValue(cssFieldHTML);
	
	form.setScript('customscript_acq_lot_da_approv_ajax_cs');

	return form;
};

//Render all search filters at top of page.
function renderFilters(form, filters){
	var prefex = 'inpt_custpage_';
	
	form.addField('custpage_deal', 'select', 'Deal', 'customer', 'filtersgroup');
	
	renderFilter(form, 'paymenttype', filters['paymenttype']);
	renderFilter(form, 'paymentmethod', filters['paymentmethod']);
	renderFilter(form, 'currency', filters['currency']);
	renderFilter(form, 'showall', filters['showall']);
	
	//Set default values
	form.setFieldValues(filters);
};