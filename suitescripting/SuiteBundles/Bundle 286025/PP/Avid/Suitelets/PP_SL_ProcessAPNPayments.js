/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       03 Nov 2012     Jay
 * 2.14       26 Apr 2018     johnr            S22288 Accommodate Check Numbers Starting with "08" and "09"
 * 2.16		  05 Nov 2018     Sunil		       S25946 - Filter payments by US and Non-US addresses
 * 2.18		  13 Sep 2019	  DWhetten	       B68940 - AvidPay Network Payments: When first entering the page, the All is selected for the Country, but it only shows payments for US
 *                                             B49929 - AvidPay Network Payments Page: Filtering By Start Date and  End date displays 'no records to show' message, even though the payments record exists
 */

// setting devMode to true will write responses and xml payloads to textareas to help debug
var devMode = false; 
$PPS.debug = true;
$PPS.where = 'PP_SL_ProcessAPNPayments';
var context = nlapiGetContext();
var environment = context.getEnvironment();
var accountId = -1;
var subsidiariesEnabled = context.getFeature('SUBSIDIARIES');
var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');
var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
var amountField = 'amount';
var acceptedCurrencyIds;
if(multiCurrencyEnabled){
	amountField = 'fxamount';
	acceptedCurrencyIds = getAcceptedCurrencyIds();
}
var runningJobsPaymentIds = [];
var paymentMethodList = $PPS.nlapiGetList('customrecord_pp_payment_methods');

var dataCallbackPlugin;
if(typeof PPDataHookPlugInType != 'undefined'){
	dataCallbackPlugin = new PPDataHookPlugInType();
}

/* Setup object field descriptions/functionality 
properties:  

name = string 
type = string 
label = string
value = string
record = string
displaytype = string
text = boolean 
sort = boolean
rectype = boolean 
format = function(value, rectype, index) // should return value

combine = object // Combine one column with another 
	_call = function(value, combine_value, rectype, index) // should return value
	fieldname = string

*/ 


var fields = {
    checkbox: {
        name: 'custpage_pp_pc_checkbox',
        type: 'checkbox',
        label: 'Process',
        value: 'F'
    },
    edit: {
        name: 'custpage_pp_pc_edit',
        type: 'text',
        record: 'internalid',
        label: 'Edit | View',
        format: function (n, rectype) {/* formatting */

        	var v = nlapiResolveURL('RECORD', $PPS.Transaction.convertToType(rectype), n, 'VIEW');
        	var e = nlapiResolveURL('RECORD', $PPS.Transaction.convertToType(rectype), n, 'EDIT');
        	var view = '<a href="' + v + '">View</a>';
        	var edit = '<a href="' + e + '">Edit</a>';
        	
            return edit + " | " + view;
        }
    },
    name: {
        name: 'custpage_pp_pc_name',
        type: 'text',
        label: 'Payee',
        record: 'entity',
        text: true,
        combine: {
        	_call:function(n, x, t, i){
        		return '<a href="#" onclick="redirectToEntity('+x+')" >'+n+'</a>';
        	},
	        fieldname:'entity'
        }
    },
    account: {
        name: 'custpage_pp_pc_account',
        type: 'text',
        label: 'Account',
        record: 'account',
        text: true
    },
    checknum: {
        name: 'custpage_pp_pc_checknum',
        type: 'text',
        label: 'Check #',
        record: 'tranid',
        sort: true,
        format: function(n, x, i) {
			return '<span id="custpage_pp_pc_checknum_id_' + i + '">' + (n == "" ? 'To Print' : n) + '</span>';
		}
    },
    recordtype: {
        name: 'custpage_pp_pc_recordtype',
        record: 'type',
        type: 'text',
        label: 'Payment Type',
        //rectype: true,
        format: function(n){
        	return $PPS.Transaction.convertToTypeName(n);
        }
    },
    date: {
        name: 'custpage_pp_pc_date',
        type: 'date',
        label: 'Date',
        record: 'trandate'
    },
    amount: {
        name: 'custpage_pp_pc_amount',
        type: 'currency',
        label: 'Amount',
        record: amountField,
        format: function (n) {// formatting 
            return Math.abs(parseFloat(n));
        }
    },
    type: {
        name: 'custpage_pp_pc_type',
        type: 'text',
        label: 'Type',
        record: 'type',
        displaytype: 'hidden'
    },
    status: {
        name: 'custpage_pp_pc_status',
        type: 'text',
        label: 'Status',
        record: 'statusref',
        displaytype: 'hidden',
        text: true
    },
    internalid: {
        name: 'custpage_pp_pc_internalid',
        type: 'text',
        label: 'Internal ID',
        record: 'internalid',
        displaytype: 'hidden',
        format: function (n, t) {// formatting 
            return n + ':' + t;
        }
    },
    tempid: {
        name: 'custpage_pp_pc_tempid',
        type: 'text',
        label: 'internalid',
        displaytype: 'hidden',
        record: 'internalid'
    },
};

if(subsidiariesEnabled){
	fields.subsidiary = {
		name: 'custpage_pp_pc_subsidiary',
		type: 'text',
		label: 'Subsidiary',
		record: 'subsidiary',
		text: true
	};
}

if(dataCallbackPlugin){
	try{
		 // uiBeforeCreate has been added to the original plugin so some customers will not have an implementation for it.
		dataCallbackPlugin.uiBeforeCreate(fields);
	}
	catch(e){
		nlapiLogExecution('ERROR', 'Error with plugin', e.message);
	}
}

/* Set NetSuite Form */ 
var form = nlapiCreateForm('AvidPay Network Payments', false);

/* Global Variables */
var	enable_approvals = false,
	bAccount = null,
	allSublists = [],
	common_col_fields = [];

/* Create a group to properly layout things */
var group = form.addFieldGroup('custpage_maingroup', ' ');
group.setSingleColumn(false);


// Start Suitelet "GET"
function startSuitelet(request, response) {
	var demoMode = false;
    $PPS.log("*** Start suitelet print checks ***");
    try{
    	form.addPageLink('crosslink', 'Payment Batch List', nlapiResolveURL('TASKLINK', 'LIST_CUST_' + getRecordTypeId('customrecord_pp_apn_payment_batch')));
    }
    catch(e){
    	nlapiLogExecution('DEBUG','Unable to add payment batch list breadcrumb',e.toString());
    }
    
    var action = context.getSetting('SCRIPT','custscript_pp_proc_apn_action');	
    enable_approvals = context.getSetting('SCRIPT', 'custscript_enable_approvals') == 'T' ? true : false;
    
    // Get the choosing bank account 
    bAccount = request.getParameter("custpage_account_select");
        
    if(request.getParameter("custpage_sublists") && request.getMethod() == 'POST'){
    	if(demoMode){
    		//form = nlapiCreateForm('AvidPay Network Payment');
    		var sf = form.addField('custpage_success','inlinehtml','Success Message');
    		sf.setDefaultValue('<div>Your payments were successfully sent to the AvidPay Network. <br/><br/><b>Batch #:</b> 1001<br/><b>Payments sent:</b> 2<br/><b>Batch total:</b> $340.23</div>');
    		response.writePage(form);
    		return;
    	}
    	 $PPS.log("*** Process form/sublist ***");

         form = sendToPrint(request, response, action);
         /* Load up the PPS's Library for helper methods */
         form = loadScriptFile("PPS_Lib_v1.js", form);
    }
    else {
    	//form.setScript("customscript_pp_cs_menunumbering");
    	form.setScript("customscript_pp_cs_apn_payment_form");

    	
    	if(subsidiariesEnabled){
    		createSubsidiarySelect(request.getParameter('custpage_subsidiary'));
    		createAccountSelect(request.getParameter('custpage_subsidiary'));
    	}
    	else{
    		createAccountSelect();
    	}
        // create Account selection box
        
		//S25946 - Create country select field
        var countryName = request.getParameter('custpage_country_name');
        createCountrySelect(countryName);
        
        //createScheduledCheckbox();
        var startDate = request.getParameter('custpage_start_date');
        var endDate = request.getParameter('custpage_end_date');
        createDateFields(form,startDate,endDate);

        // Create the form
        form = createForm(action);
        
        $PPS.log("Units remaining: " + context.getRemainingUsage());
	
    }

    response.writePage(form);
    $PPS.log("*** End suitelet print checks ***");
}

// Send to Piracle "POST"
function sendToPrint(request, response, action) {
    $PPS.log("*** Send To Print ***");

    var checknums = [];
    var paymentIds = {};
    //var useScheduleScript = request.getParameter("custpage_use_scheduled_script") || "F";
    
    form.addFieldGroup('custpage_detail_group', 'Details');
    form.addFieldGroup('custpage_validation_errors', 'Validation Errors');
    
    /*try{
    	var prefs = nlapiLoadConfiguration('userpreferences');
    	prefs.setFieldValue('custscript_user_use_scheduled_script',useScheduleScript);
    	nlapiSubmitConfiguration(prefs);
    	
    }catch(e){
    	//$PPS.log(['SCRIPT', 'custscript_user_printer_offset_printer', printer, e, e.message]);
    	$PPS.log("Unable to submit preferences");
    }*/
    
    var custpage_sublists = request.getParameter("custpage_sublists");
    if (custpage_sublists)
        allSublists = custpage_sublists.split(",");
    
    
    // Loop through each sublist
    for (var cks = 0; cks < allSublists.length; cks++) {
        //$PPS.log("List : " + allSublists[cks]);
        var c = request.getLineItemCount(allSublists[cks]);

        //$PPS.log("Number of Checks: " + c);
        // Loop through each line and filter out the non-checked checkboxes
        for (var i = 1; i <= c; i++) {
            var checkbox = request.getLineItemValue(allSublists[cks], fields.checkbox.name, i);
            if (checkbox == "T") {
                var iid = request.getLineItemValue(allSublists[cks], fields.internalid.name, i);
                
                if (iid != null) {
                    var siid = iid.split(":");
                    checknums.push(
                    	{
                    		"id": siid[0], 
                    		"type": siid[1]
                    	}
                    );
                    paymentIds[siid[0]] = siid[1];
                }
            }
        }
    }
    
    try{
    	
        if (checknums.length > 0) {
    		// send request to the APN Processor
    		var rh = {cookie: request.getHeader('Cookie')};
    		rh['Content-Type'] = 'application/json';
    		var url = request.getURL().match(/^.+?[^\/:](?=[?\/]|$)/) + nlapiResolveURL('SUITELET', 'customscript_pp_sl_apn_processor','customdeploy_pp_sl_apn_processor');
    		var resp = nlapiRequestURL(url,JSON.stringify({paymentIds: paymentIds}),rh,'POST');
    		
    		nlapiLogExecution('DEBUG','APN Processor Response Code',resp.getCode());
    		if(resp.getCode() == '200'){
    			nlapiLogExecution('DEBUG','APN Processor Response Body',resp.getBody());
    			var respJSON = JSON.parse(resp.getBody());
    			
    			if(respJSON.validationErrors && respJSON.validationErrors.length > 0){
	    			// write validation errors to form
	    			for(var i = 0; i < respJSON.validationErrors.length; i++){
	    				var f = form.addField('custpage_validation_error_' + i, 'inlinehtml', null, null, 'custpage_validation_errors');
	    				f.setDefaultValue((i+1)+'. ' + respJSON.validationErrors[i]);
	    			}
    			}
    			
    			if(respJSON.status == "success"){
    				if(respJSON.validationErrors && respJSON.validationErrors.length > 0){
    					$PPS.addMessageToForm(form,'warning',"Your payment submission encountered errors. One or more payments did not pass validation, the other payments were successfully submitted to the AvidPay Network. Please correct the errors and resubmit only those payments. (Refer to the list of errors below).");
    				}
    				else{
    					$PPS.addMessageToForm(form,'success',"Your payments were successfully sent to the AvidPay Network.");
    				}
    				//Write success messages to form
    	    		var sf = form.addField('custpage_success','inlinehtml','Success Message',null,'custpage_detail_group');
    	    		sf.setDefaultValue('<div><br/><br/><b>Batch Id:</b> '+respJSON.batchNumber+'<br/><b>Payments sent:</b> '+respJSON.totalPaymentsValid +' out of '+respJSON.totalPayments+'<br/><b>Batch total:</b> $'+respJSON.totalAmount+'<br/><br/></div>');
    	    	
    			}
    			else{
    				$PPS.addMessageToForm(form,'error',respJSON.errorMessage);
    			}
    		}
    		else{
    			throw nlapiCreateError('PP_CANT_ACCESS_SUITELET','The user/role needs access to the "customscript_pp_sl_apn_processor" script deployment in order to process APN payments.');
    		}
        }
        else{
        	$PPS.addMessageToForm(form,'error',"Error: No items were selected.");
        }
    } catch (e) {
    	$PPS.addMessageToForm(form,'error',"Error: "+ e.name + '<br/>' + e.message);
    }
    return form;
}


/**
 * 
 * @param subsidiaryId -optional
 * @returns
 */
function createAccountSelect(subsidiaryId) {

    //form.addFieldGroup('custpage_firstgroup', 'Bank Account Selection');
    var accountSelect = form.addField('custpage_account_select', 'select', 'Bank Account', null, 'custpage_maingroup');
    accountSelect.addSelectOption(-1, '');

    var columns = [],
	filters = [];
	
    columns.push(new nlobjSearchColumn('name'));
	
    filters.push(new nlobjSearchFilter('type', null, 'is', 'Bank'));
    filters.push(new nlobjSearchFilter('custrecord_pp_account_exclude',null,'is','F'));
    filters.push(new nlobjSearchFilter('custrecord_pp_act_apn_enabled',null,'is','T'));
    
    if(subsidiaryId){
    	filters.push(new nlobjSearchFilter('subsidiary',null,'anyof',subsidiaryId));
    }
    	
    var search = nlapiCreateSearch('account',filters,columns);
	var resultSet = search.runSearch();
	var i = 0;
	resultSet.forEachResult(function(searchResult){
		accountSelect.addSelectOption(searchResult.getId(), searchResult.getValue('name'), bAccount == searchResult.getId());
		i++;
		return i < 4000; // return true to keep iterating
	});

    return accountSelect;
}


function createScheduledCheckbox() {
	var prefs = nlapiLoadConfiguration('userpreferences');
	var userUseScheduledScript = prefs.getFieldValue('custscript_user_use_scheduled_script');
	
    var checkbox = form.addField('custpage_use_scheduled_script', 'checkbox', 'Use Scheduled Script', null, 'custpage_maingroup');
    checkbox.setDefaultValue(userUseScheduledScript);
    checkbox.setHelpText("Check this box to make the payment builder run in a scheduled script. Running a job through a scheduled script is slower, but will ensure governance does not run out for large jobs.", false);
    return checkbox;
}


function createDateFields(form,startDate,endDate){

	var startDateField = form.addField('custpage_start_date','date','Start Date',null,'custpage_maingroup');
	if(startDate){
		startDateField.setDefaultValue(startDate);
	}
	
	var endDateField = form.addField('custpage_end_date','date','End Date',null,'custpage_maingroup');
	if(endDate){
		endDateField.setDefaultValue(endDate);
	}
}

function createSubsidiarySelect(subsidiaryId){
	var subsidiaryField = form.addField('custpage_subsidiary','select','Subsidiary',null,'custpage_maingroup');
	var filters = [new nlobjSearchFilter('iselimination',null,'is','F'), new nlobjSearchFilter('isinactive',null,'is','F')];
	var columns = [new nlobjSearchColumn('name')];
	var searchResults  = nlapiSearchRecord('subsidiary',null,filters,columns);
	if(searchResults){
		subsidiaryField.addSelectOption("", "");
		for(var i = 0; i < searchResults.length; i++){
			subsidiaryField.addSelectOption(searchResults[i].getId(), searchResults[i].getValue('name'));
		}
	}
	
	if(subsidiaryId){
		subsidiaryField.setDefaultValue(subsidiaryId);
	}
}

//S25946 Create country select field
function createCountrySelect(country_name) {
	var country = form.addField('custpage_country_name', 'select','Country', null, 'custpage_maingroup');	
	country.addSelectOption('afn_so_US','US');
	country.addSelectOption('afn_so_NonUS', 'Non-US');
	country.addSelectOption('afn_so_All', 'All');
	country.setHelpText('Show only the payments for payees with addresses listed in specific country.');
	if (country_name) {
		country.setDefaultValue(country_name);
	} else {
		country.setDefaultValue("afn_so_All");
	}
}
// Create the form and build the UI
function createForm(action) {

    if(action == 'process'){
    	runningJobsPaymentIds = findRunningJobsPaymentIds();
    	
    	var unnummberdSublist = new $PPS.SublistBuilder(UnnumberedChecks);
    	unnummberdSublist.create(form,fields);
    	
    	unnummberdSublist.sublist.setHelpText('<span id="numberingStatus">&nbsp;</span>');
    	unnummberdSublist.sublist.addButton('custpage_number_all','Number All','numberAll');
	   
    	var nummberdSublist = new $PPS.SublistBuilder(NumberedChecks);
    	nummberdSublist.create(form,fields);
        var numSub = form.getSubList('cust_sublist_numbered');
        //nlapiLogExecution('debug', 'numSub', numSub);
        numSub.addButton('custpage_sub_num_next100', 'Mark Next 100', "next100('cust_sublist_numbered');");

    }
    else if(action == 'reprocess'){
    	delete fields.recordmethod.combine;
	    ProcessedChecks.display($PPS.multiSublistBuilder.setupUiSublist(form, ProcessedChecks.title, fields, 'cust_sublist_processed', true));
    }
    else{
    	return form;
    }
    var innerhtml = form.addField("output1", "inlinehtml");
    innerhtml.setDefaultValue('<input type="hidden" id="custpage_sublists" name="custpage_sublists" value="' + allSublists.join(",") + '" />');

    form.addSubmitButton('Process');
    
    form.addFieldGroup('custpage_total_group', 'Totals').setShowBorder(false);
	var tamf = form.addField('custpage_total_amount','currency','Amount',null,'custpage_total_group');
	tamf.setDisplayType('disabled');
	tamf.setDefaultValue(0);
	
	var tasf = form.addField('custpage_total_selected','text','Items Selected',null,'custpage_total_group');
	tasf.setDisplayType('disabled');
	tasf.setDefaultValue('0');
	
	
	
    return form;
}


/**
 * Find all transactionids of print jobs that are not complete or failed.
 * 
 * @returns {Array} an array of transactionIds
 */
function findRunningJobsPaymentIds(){
	
	var apnBatchStatusList = $PPS.nlapiGetList('customlist_pp_apn_pb_status');
	var ids = [];
	var filters = [];
	var columns = [];
	
	// find all where job status is not Fail or Complete with set
	filters.push(new nlobjSearchFilter('custrecord_pp_apn_pb_status',null,'noneof',[apnBatchStatusList.getKey('Complete'),apnBatchStatusList.getKey('Fail')]));
	
	columns.push(new nlobjSearchColumn('custrecord_pp_apn_pb_payments'));
	var createdCol = new nlobjSearchColumn('created');
	createdCol.setSort(true);
	columns.push(createdCol);
	
	var searchResults = nlapiSearchRecord('customrecord_pp_apn_payment_batch', null, filters, columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var searchResult = searchResults[i];
			var internalIdsStr = searchResult.getValue('custrecord_pp_apn_pb_payments');
			var internalIdsObj;
			
			// search results will only return text up to 2000 chars
			// if string returned is not complete use nlapiLookupField to get the entire string
			try{
				internalIdsObj = JSON.parse(internalIdsStr);
			}
			catch(e){
				try{
					internalIdsObj = JSON.parse(nlapiLookupField('customrecord_pp_apn_payment_batch', searchResult.getId(), 'custrecord_pp_apn_pb_payments'));
				}
				catch(e){
					// log error
					nlapiLogExecution('AUDIT', 'Parse Error', 'Could not parse custrecord_pp_apn_pb_payments using JSON.parse');
				}
			}
			
			if(typeof internalIdsObj != 'undefined'){
				var extractedIds = Object.keys(internalIdsObj);
				ids = ids.concat(extractedIds);
			}
		}
	}
	ids = array_unique(ids);
	return ids;
}


/* Sublist processing objects */
var NumberedChecks = {
	    title:'Payments to be Processed',
	    id: 'cust_sublist_numbered',
	    addMarkAllButtons: true,
        addMark100Button: true,
	    filters: function () {

	        var filter = [
	            new nlobjSearchFilter('tobeprinted', null, 'is', 'F'),
	            new nlobjSearchFilter('mainline', null, 'is', "T"),
	            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
	            new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof', [paymentMethodList.getKey('AvidPay Network')]),
	            new nlobjSearchFilter('voided', null, 'is', 'F'),
	            new nlobjSearchFilter('memorized', null, 'is', 'F'),
	            new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check'])
	        ];
	        
	        if(bAccount && bAccount != -1){
	        	filter.push(new nlobjSearchFilter('account', null, 'anyof', bAccount));
	        }
	        
	        if(runningJobsPaymentIds.length > 0){
	        	filter.push(new nlobjSearchFilter('internalid', null, 'noneof',runningJobsPaymentIds));
	        }
	        
	        // Only include checks with valid check numbers
	        var checkNumberFilter = new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0');
	        checkNumberFilter.setFormula('NVL(TO_NUMBER({number}),0)');
	        filter.push(checkNumberFilter);
	        
	        if(enable_approvals){
	        	filter.push(new nlobjSearchFilter('custbody_pp_is_approved',null,'is','T'));
	        }
	        
	        if(accountingPeriodsEnabled){
	        	filter.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
	        }
	        
	        if(multiCurrencyEnabled){
	        	filter.push(new nlobjSearchFilter('currency', null, 'anyof', acceptedCurrencyIds));
	        }
	        
	        var startDate = request.getParameter('custpage_start_date');
	        var endDate = request.getParameter('custpage_end_date');
	        if(startDate && endDate){
	        	filter.push(new nlobjSearchFilter('trandate',null,'within',startDate,endDate));
	        }
	        
	        if(subsidiariesEnabled){
	        	var subsidiaryId = request.getParameter('custpage_subsidiary');
	        	if(subsidiaryId){
	        		filter.push(new nlobjSearchFilter('subsidiary', null, 'anyof', subsidiaryId));
	        	}
	        }
			//S25946 Payments are filtered by US and Non-US addresses. 
	        //Default is US and selecting All will display all payments (US as well as Non-US addresses) 
	        
	        var _country = request.getParameter('custpage_country_name');
	        //if (!_country) {
	        //	_country = 'afn_so_US'
	        //}
	        
	        if (_country == 'afn_so_US') {
	        	filter.push(new nlobjSearchFilter('billaddress',null,'contains', 'United States'));
	        } else if (_country == 'afn_so_NonUS') {
	        	filter.push(new nlobjSearchFilter('billaddress',null,'doesnotcontain', 'United States'));
	        } //---
	        return filter;
	    },
	    resultValidate: function(field){
	    	var n = field.getValue(fields.checknum.record);
	    	//S22288 Accommodate Check Numbers Starting with "08" and "09"
        	if(!isNaN(parseFloat(n)) && isFinite(n)){
        		return true;
        	}
        	return false;
	    },
	    recordType: 'transaction'
	};

var UnnumberedChecks = {
	    title: 'Payments Awaiting Numbering',
	    id: 'cust_sublist_unnumbered',
	    filters: function () {

	        var filter = [
	            new nlobjSearchFilter('mainline', null, 'is', "T"),
	            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
	            new nlobjSearchFilter('tobeprinted', null, 'is', "T"),
	            new nlobjSearchFilter('voided', null, 'is', 'F'),
	            new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof', [paymentMethodList.getKey('AvidPay Network')]),
	            new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check'])
	        ];
	        
	        if(bAccount && bAccount != -1){
	        	filter.push(new nlobjSearchFilter('account', null, 'anyof', bAccount));
	        }
	        
	        if(runningJobsPaymentIds.length > 0){
	        	filter.push(new nlobjSearchFilter('internalid', null, 'noneof',runningJobsPaymentIds));
	        }

	        if(enable_approvals){
	        	filter.push(new nlobjSearchFilter('custbody_pp_is_approved',null,'is','T'));
	        }
	        
	        if(accountingPeriodsEnabled){
	        	filter.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
	        }
	        
	        if(multiCurrencyEnabled){
	        	filter.push(new nlobjSearchFilter('currency', null, 'anyof', acceptedCurrencyIds));
	        }
	        
	        var startDate = request.getParameter('custpage_start_date');
	        var endDate = request.getParameter('custpage_end_date');
	        if(startDate && endDate){
	        	filter.push(new nlobjSearchFilter('trandate',null,'within',startDate,endDate));
	        }
	        
	        if(subsidiariesEnabled){
	        	var subsidiaryId = request.getParameter('custpage_subsidiary');
	        	if(subsidiaryId){
	        		filter.push(new nlobjSearchFilter('subsidiary', null, 'anyof', subsidiaryId));
	        	}
	        }
	        
	        return filter;
	    },
	    resultValidate: function(field){
	    	 var f = field.getValue(fields.checknum.record);
	         return /\D/g.test(f) || f == '';
	    },
	    recordType: 'transaction'
	};

/* Helper to retreive proper script paths and place in ns form. */
var scriptindex = 0; /* Safe custpage naming! */
function loadScriptFile(filename, form) { /* cost is 20 units */
    /* TODO: filter by folder maybe and by date maybe // search bundles first then search suitescripts */
	//var file = 'file';
	var fileSearch = nlapiSearchRecord('file', null, new nlobjSearchFilter('name', null, 'is', filename), null);
	var file = null;
	if(fileSearch){
		var fileid = fileSearch[0].getId();
		file = nlapiLoadFile(fileid);
	}
	
    if (file && form) {
        var url = file.getURL();
        if (url != "") {
            var innerhtml = form.addField("custpage_script_" + scriptindex, "inlinehtml");
            innerhtml.setDefaultValue('<script type="text/javascript" src="' + url + '"></script>');
            scriptindex++;
        }
    }
    return form;
}


function getAcceptedCurrencyIds(){
	var currencyIds = [];
	var columns = [new nlobjSearchColumn('symbol')];
	
	/*var filterExp = [
	                 [
	                  [['symbol','is','USD'],'and',['exchangerate','equalto',1.0]],
	                  'or',
	                  ['symbol','is','CAD']
	                  ]
	                 ];*/
	// Only US to US
	var filterExp = [[['symbol','is','USD'],'and',['exchangerate','equalto',1.0]]];

	var res = nlapiSearchRecord('currency',null,filterExp,columns);
	if(res){
		for(var i = 0; i < res.length; i++){
			currencyIds.push(res[i].getId());
		}
	}
	return currencyIds;
	
}

function getRecordTypeId(recType){
	var rec = nlapiCreateRecord(recType);

	return rec.getFieldValue('rectype');
}