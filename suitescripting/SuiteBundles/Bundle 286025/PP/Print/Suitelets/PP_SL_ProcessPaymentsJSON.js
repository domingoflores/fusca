/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Nov 2012     Jay
 * 2.14       23 Apr 2018     johnr            S22288 Accommodate Check Numbers Starting with "08" and "09"
 *
 */

$PPS.debug = true;
$PPS.where = 'PP_SL_ProcessPayments';
var context = nlapiGetContext();
var environment = context.getEnvironment();
var accountId = -1;
var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');
var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
var amountField = 'amount';
if(multiCurrencyEnabled){
	amountField = 'fxamount';
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
    /*warnings: {
    	name:'custpage_pp_pc_warnings',
    	type: 'text',
    	record: 'internalid',
    	label: 'Warning',
    	format: function(n,x,i){
    		return 'n='+n + ', x='+x + ', i='+ i;
    	}
    },*/
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
    recordmethod: {
        name: 'custpage_pp_pc_recordmethod',
        record: 'custbody_pp_payment_method',
        type: 'text',
        label: 'Payment Method',
        text: true,
        combine: {
        	_call:function(n, x, t, i){
	        	return '<a href="#' + x + ':' + t + '" class="custpage_payment_method">' + n + '</a>';
	        },
	        fieldname:'internalid'
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
    paymentMethod: { // used on poast
        name: 'custpage_pp_pc_payment_method',
        type: 'text',
        text: true,
        label: 'Payment Method',
        record: 'custbody_pp_payment_method',
        displaytype: 'hidden'
        /*format: function (n) {// formating 
            return n == "T" ? "true" : "false";
        }*/
    },
    tempid: {
        name: 'custpage_pp_pc_tempid',
        type: 'text',
        label: 'internalid',
        displaytype: 'hidden',
        record: 'internalid'
    },
};

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
var form = nlapiCreateForm('AvidXchange Self-Managed Checks and ACH', false);

/* Global Variables */
var	enable_approvals = false,
	bAccount = null,
	allSublists = [],
	common_col_fields = [],
    startDate = null,
    endDate = null;

/* Create a group to properly layout things */
var group = form.addFieldGroup('custpage_maingroup', ' ');
group.setSingleColumn(false);

// Start Suitelet "GET"
function startSuitelet(request, response) {

    $PPS.log("*** Start suitelet print checks ***");

    // Load up the jbox plugin for jquery
    form = loadScriptFile("jquery.jbox.js", form);
    
    var action = context.getSetting('SCRIPT','custscript_pp_process_payment_action');
    
    if(action == 'wach' || action == 'wach'){
    	form.setTitle('AvidXchange Self-Managed Withdrawal ACH');
    }
    /*var prefs = nlapiLoadConfiguration('companypreferences');
    
    // Check for enabled approvals
    enable_approvals = prefs.getFieldValue('custscript_enable_approvals') == 'T' ? true : false;
    var enable_sps = prefs.getFieldValue('custscript_enable_sps') == 'T' ? true : false;*/
    enable_approvals = context.getSetting('SCRIPT', 'custscript_enable_approvals') == 'T' ? true : false;
    var enable_sps = context.getSetting('SCRIPT', 'custscript_enable_sps') == 'T' ? true : false;
    
    // Get the choosing bank account 
    bAccount = request.getParameter("custpage_account_select");
    startDate = request.getParameter('custpage_start_date_range');
    endDate = request.getParameter('custpage_end_date_range');

        
    if(request.getParameter("custpage_sublists") && request.getMethod() == 'POST'){
    	 $PPS.log("*** Process form/sublist ***");

         form = sendToPrint(request, response, action);
         /* Load up the PPS's Library for helper methods */
         form = loadScriptFile("PPS_Lib_v1.js", form);
         /* Load up the main handler script for UI */
         form = loadScriptFile("PP_CS_Status_Progress.js", form);
    }
    else {
    	form.setScript("customscript_pp_cs_menunumbering");
    	
    	if(bAccount !== null){
    		$PPS.log("*** Create form/sublist ***");

            // create Account selection box
            createAccountSelect();
            
            if(enable_sps && action != 'wach' && action != 'rwach'){
            	createSPSCheckbox();
            }
            
            if(action != 'wach' && action != 'rwach'){
            	// create Printer Offsets collection box
            	createPrinterSelect();
            }
            
            createScheduledCheckbox();
            //addDateFields();

            // Create the form
            form = createForm(action);

            // Add back button
            var innerhtml = form.addField("custpage_back_url", "inlinehtml");
            var reqFileUrl = nlapiResolveURL('SUITELET', 'customscript_pp_sl_processpayments', 'customdeploy_pp_sl_processpayments');
            innerhtml.setDefaultValue('<input type="hidden" id="pp_back_url" value="' + reqFileUrl + '" />');
            
            $PPS.log("Units remaining: " + context.getRemainingUsage());
    	}
    	else{
    		/*create Account selection box */
            createAccountSelect();
    	}
    	
    }

    response.writePage(form);
    $PPS.log("*** End suitelet print checks ***");
}

// "POST"
function sendToPrint(request, response, action) {
    $PPS.log("*** Send To Print ***");

    var checknums = [];
    var paymentIds = {};
    var achCount = 0;
    var printer = request.getParameter("custpage_printer_select");
    var print_to_sps = request.getParameter("custpage_print_to_sps") || "F";
    var useScheduleScript = request.getParameter("custpage_use_scheduled_script") || "F";
    
    try{
    	var prefs = nlapiLoadConfiguration('userpreferences');
    	prefs.setFieldValue('custscript_user_printer_offset_printer',printer);
    	prefs.setFieldValue('custscript_user_sps', print_to_sps);
    	prefs.setFieldValue('custscript_user_use_scheduled_script',useScheduleScript);
    	nlapiSubmitConfiguration(prefs);
    	
    }catch(e){
    	$PPS.log(['SCRIPT', 'custscript_user_printer_offset_printer', printer, e, e.message]);
    }
    
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
                var paymentMethod = request.getLineItemValue(allSublists[cks], fields.paymentMethod.name, i);

                if(paymentMethod == 'ACH'){
                	achCount++;
                }
                if (iid != null) {
                    var siid = iid.split(":");
                    checknums.push(
                    	{
                    		"id": siid[0], 
                    		"type": siid[1], 
                    		"ach": (paymentMethod == 'ACH' ? 'T' : 'F')
                    	}
                    );
                    paymentIds[siid[0]] = siid[1];
                }
            }
        }
    }

    if (checknums.length >= 50) {
        useScheduleScript == 'T';
    }
    try{
        var prefs = nlapiLoadConfiguration('userpreferences');
        prefs.setFieldValue('custscript_user_printer_offset_printer',printer);
        prefs.setFieldValue('custscript_user_sps', print_to_sps);
        prefs.setFieldValue('custscript_user_use_scheduled_script',useScheduleScript);
        nlapiSubmitConfiguration(prefs);
        
    }catch(e){
        $PPS.log(['SCRIPT', 'custscript_user_printer_offset_printer', printer, e, e.message]);
    }
    
    if(print_to_sps == 'T' && achCount > 0){
    	form.addField("label", "label", "Error: ACH items are not allowed for SPS jobs.");
    	return form;
    }
    try{

        if (checknums.length > 0) {
            $PPS.log("*** Send to PPS ***");

            var action_type = (action == 'wach' || action =='rwach' ? 'AR' : 'AP')
            //Setup PP SSO URL 
            var url = $PPS.nlapiOutboundSSO();
            
            url = url.replace(/:action_type/,action_type);
            
            $PPS.log("url: " + url);
            
            var offsets = getPrinterOffsets(printer);
            
            $PPS.log('paymentIds ' + JSON.stringify(paymentIds));
        	//var ppsObj = ppsPaymentBuilder.getData(paymentIds);
            //var dataToSend = $PPS.merge( ppsObj, {'offsets' : offsets});
            //var dataToSend = $PPS.merge( { "payments": checknums }, offsets);
            
            /*if(print_to_sps == 'T'){
            	dataToSend.sps = '1';
            }*/

            $PPS.log("checknums: " + JSON.stringify(checknums));
            $PPS.log("printer: " + printer);
            $PPS.log("offsets: " + JSON.stringify(offsets));
            //$PPS.log("post: " + JSON.stringify(dataToSend));
            
            
            var rec = nlapiCreateRecord('customrecord_pp_print_status');
            // need to populate this now because the method is doing common work between create and update
            rec.setFieldValue("custrecord_pp_ps_created_date", nlapiDateToString(new Date()));

            var defaultStatus = "Pending Execution";
            if(useScheduleScript == "T" || checknums.length >= 50){
            	defaultStatus = "Scheduled";
            }
            var job = {
                //jobid: jobid,
                achcount: 0,
                itemcount: 0,
                jobstatus: defaultStatus,
                fileurl: url,
                overflowcount: 0,
                itemsprinted: 0,
                itemsprocessed: 0,
                voidcount: 0,
                internal_ids: paymentIds,
                printer: printer,
                isSps: print_to_sps,
                action_type : action_type
            };

            var printStatusListId = setData(rec, job);
            
            var myInlineHtml = form.addField( 'custcontent', 'inlinehtml');
        	myInlineHtml.setLayoutType('outsideabove', 'startrow');
        	myInlineHtml.setDefaultValue("");
        	
            var innerhtml = form.addField("output1", "inlinehtml");
            innerhtml.setDefaultValue('<input type="hidden" id="printStatusListId" value="' + printStatusListId + '" />');

            var innerhtml = form.addField("output2", "inlinehtml");
            innerhtml.setDefaultValue('<div id="job"></div>');
            
            var innerhtml = form.addField("output3", "inlinehtml");
            innerhtml.setDefaultValue('<input type="hidden" id="useScheduledScript" value="' + useScheduleScript + '" />');

        }
        else{
        	form.addField("label", "label", "Error: No items were selected.");
        }
    } catch (e) {
        $PPS.log(e);
    }
    return form;
}

function setData(_rec, job) {
    //_rec.setFieldValue("custrecord_pp_ps_jobid", job.jobid);
    _rec.setFieldValue("custrecord_pp_ps_status_date", nlapiDateToString(new Date(), 'datetimetz'));
    _rec.setFieldValue("custrecord_pp_ps_status", job.jobstatus.toString());
    _rec.setFieldValue("custrecord_pp_ps_itemcount", job.itemcount);
    _rec.setFieldValue("custrecord_pp_ps_fileurl", job.fileurl.toString());
    _rec.setFieldValue("custrecord_pp_ps_internal_ids", JSON.stringify(job.internal_ids));
    _rec.setFieldValue("custrecord_pp_ps_internal_ids_processing", JSON.stringify(job.internal_ids));
    _rec.setFieldValue("custrecord_pp_ps_printer_offset",job.printer);
    _rec.setFieldValue("custrecord_pp_ss_sps",job.isSps);
    _rec.setFieldValue("custrecord_pp_ps_action",job.action_type);
    
    return nlapiSubmitRecord(_rec);
}

function createPrinterSelect() {

	var prefs = nlapiLoadConfiguration('userpreferences');
	var printerOffset = prefs.getFieldValue('custscript_user_printer_offset_printer');
	
    var printerSelect = form.addField('custpage_printer_select', 'select', 'Printer Offset', null, 'custpage_maingroup');
    
    var prints = findPrinterOffsets();
    // Populate Account dropdown with search results with internal ID as the option ID
    if (prints.length > 0){
        for (var ri = 0; ri < prints.length; ri++){
        	var printerId = prints[ri].getId();
        	var selected = (printerOffset == printerId ? true : false);
        	printerSelect.addSelectOption(printerId, prints[ri].getValue('custrecord_pp_printer_name'),selected);
        	//$PPS.log(persist_printer +' == '+ prints[ri].getId());
        }
    }

    return printerSelect;
}


function createAccountSelect() {

	var accountSelect = form.addField('custpage_account_select', 'select', 'Bank Account', null, 'custpage_maingroup');
	accountSelect.addSelectOption(-1, '');

	$PPS.buildAccountSelectOptions(accountSelect,bAccount);

    return accountSelect;
}
	

function createSPSCheckbox() {
	var prefs = nlapiLoadConfiguration('userpreferences');
	var userSPS = prefs.getFieldValue('custscript_user_sps');
	
    var spsCheckbox = form.addField('custpage_print_to_sps', 'checkbox', 'Print to Secure Printing Service', null, 'custpage_maingroup').setDefaultValue(userSPS);
    return spsCheckbox;
}

function createScheduledCheckbox() {
	var prefs = nlapiLoadConfiguration('userpreferences');
	var userUseScheduledScript = prefs.getFieldValue('custscript_user_use_scheduled_script');
	
    var checkbox = form.addField('custpage_use_scheduled_script', 'checkbox', 'Use Scheduled Script', null, 'custpage_maingroup');
    checkbox.setDefaultValue(userUseScheduledScript);
    checkbox.setHelpText("Check this box to make the payment builder run in a scheduled script. Running a job through a scheduled script is slower, but will ensure governance does not run out for large jobs.", false);
    return checkbox;
}

function addDateFields() {
        var startDateField = form.addField('custpage_start_date_range', 'date', 'Start Date', null, 'custpage_maingroup');
        if (startDate != null && startDate != '') {
            var sDate = cleanupDate(startDate);
            startDateField.setDefaultValue(sDate);
        }
        var endDateField = form.addField('custpage_end_date_range', 'date', 'End Date', null, 'custpage_maingroup');
        if (endDate != null && endDate != '') {
            var eDate = cleanupDate(endDate);
            endDateField.setDefaultValue(eDate);
        }
}

// Create the form and build the UI
function createForm(action) {

    /*if(fields.edit && context.email != "maxm@piracle.com")
    	delete fields.edit;*/
    
    var numOutstandingJobs = findNumOutstandingJobs();
	if(numOutstandingJobs > 0){
		// display link to job manager
		var jobManagerUrl = nlapiResolveURL('SUITELET', 'customscript_pp_sl_job_manager', 'customdeploy_pp_sl_job_manager');
		var runningJobsWarning = form.addField('custpage_warning','inlinehtml','',null,null);
		runningJobsWarning.setLayoutType('outsideabove','startrow');
		runningJobsWarning.setDefaultValue('<span style="color: #FFA500; font-weight: bold">One or more jobs have been running for over an hour. <a href="'+jobManagerUrl+'">Click here</a> to manage running jobs.</span>');
	}
    
    if(action == 'process'){
    	runningJobsPaymentIds = findRunningJobsPaymentIds();
    	
    	var unnummberdSublist = new $PPS.SublistBuilder(UnnumberedChecks);
    	unnummberdSublist.create(form,fields);
    	
    	unnummberdSublist.sublist.setHelpText('<span id="numberingStatus">&nbsp;</span>');
    	unnummberdSublist.sublist.addButton('custpage_number_all','Number All','numberAll');
	    
	    var before = fields.checknum.label;
	    fields.checknum.label = "Item #";
	    var achSublist = new $PPS.SublistBuilder(ACH);
	    achSublist.create(form,fields);
	    fields.checknum.label = before;
        var achSub = form.getSubList('cust_sublist_ach');
        achSub.addButton('custpage_sub_ach_next100', 'Mark Next 100', "next100('cust_sublist_ach')");
	    
	    var nummberdSublist = new $PPS.SublistBuilder(NumberedChecks);
    	nummberdSublist.create(form,fields);
                var numSub = form.getSubList('cust_sublist_numbered');
        numSub.addButton('custpage_sub_num1_next100', 'Mark Next 100', "next100('cust_sublist_numbered')");


    }
    else if(action == 'reprocess'){
    	delete fields.recordmethod.combine;
        addDateFields();
    	var processedChecksSublist = new $PPS.SublistBuilder(ProcessedChecks);
    	processedChecksSublist.create(form,fields);
    }
    else if(action == 'wach'){
    	nlapiLogExecution('DEBUG','action','wach');
    	fields.recordmethod = {
    			name: 'custpage_pp_pc_recordmethod',
    			type: 'text',
    			label: 'Payment Method',
    			value: 'ACH'
    		};
    	fields.checknum.label = 'Payment #';
    	var withdrawalACHSublist = new $PPS.SublistBuilder(WithdrawalACH);
    	withdrawalACHSublist.create(form,fields);
    	
    }
    else if(action == 'rwach'){
    	nlapiLogExecution('DEBUG','action','rwach');
    	fields.recordmethod = {
    			name: 'custpage_pp_pc_recordmethod',
    			type: 'text',
    			label: 'Payment Method',
    			value: 'ACH'
    		};
    	fields.checknum.label = 'Payment #';
    	var reprocessWithdrawalACHSublist = new $PPS.SublistBuilder(ReprocessWithdrawalACH);
    	reprocessWithdrawalACHSublist.create(form,fields);
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
	
	var ids = [];
	var filters = [];
	var columns = [];
	
	// find all where job status is not Fail or Complete with set
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Fail'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Complete'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnotempty'));
	
	columns.push(new nlobjSearchColumn('custrecord_pp_ps_status'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ps_jobid'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ps_internal_ids'));
	var createdCol = new nlobjSearchColumn('created');
	createdCol.setSort(true);
	columns.push(createdCol);
	
	var searchResults = nlapiSearchRecord('customrecord_pp_print_status', null, filters, columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var searchResult = searchResults[i];
			var internalIdsStr = searchResult.getValue('custrecord_pp_ps_internal_ids');
			var internalIdsObj;
			
			// search results will only return text up to 2000 chars
			// if string returned is not complete use nlapiLookupField to get the entire string
			try{
				internalIdsObj = JSON.parse(internalIdsStr);
			}
			catch(e){
				try{
					internalIdsObj = JSON.parse(nlapiLookupField('customrecord_pp_print_status', searchResult.getId(), 'custrecord_pp_ps_internal_ids'));
				}
				catch(e){
					// log error
					nlapiLogExecution('AUDIT', 'Parse Error', 'Could not parse custrecord_pp_ps_internal_ids using JSON.parse');
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

/**
 * Find the number of jobs that have been running for over an hour
 * 
 * @returns {Number} 
 */
function findNumOutstandingJobs(){
	
	var filters = [];
	var columns = [];
	
	// find all where job status is not Fail or Complete with set
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Fail'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Complete'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnotempty'));
    
    // Filters jobs that were created over an hour ago
    var createdFilter = new nlobjSearchFilter('formulanumeric',null,'equalto','1');
    createdFilter.setFormula("CASE WHEN {created} < {now} - 1/24 THEN 1 ELSE 0 END");
    filters.push(createdFilter);
	
	var searchResults = nlapiSearchRecord('customrecord_pp_print_status', null, filters, columns);
	if(searchResults){
		return searchResults.length;
	}
	else{
		return 0;
	}	
}

/* Sublist processing objects */
// Objects for each sublist - holds title of sublist - searches for checks - populates sublists 
var NumberedChecks = {
    title:'Checks to be Printed',
    id: 'cust_sublist_numbered',
    addMarkAllButtons: true,
    addMark100Button: true,
    filters: function () {
       
        var filter = [
            new nlobjSearchFilter('tobeprinted', null, 'is', 'F'),
            new nlobjSearchFilter('mainline', null, 'is', "T"),
            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
            new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof', [paymentMethodList.getKey('Check')]),
            new nlobjSearchFilter('account', null, 'anyof', bAccount),
            new nlobjSearchFilter('voided', null, 'is', 'F'),
            new nlobjSearchFilter('memorized', null, 'is', 'F'),
            new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check'])
        ];
        
        
        if(runningJobsPaymentIds.length > 0){
        	filter.push(new nlobjSearchFilter('internalid', null, 'noneof',runningJobsPaymentIds));
        }
        
        // Only include checks with valid check numbers
        var checkNumberFilter = new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0');
        checkNumberFilter.setFormula('NVL(TO_NUMBER({number}),0)');
        filter.push(checkNumberFilter);
        
        if(enable_approvals){
        	filter.push(new nlobjSearchFilter(CAC_IS_APPROVED_ID,null,'is','T'));
        }
        
        if(accountingPeriodsEnabled){
        	filter.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
        }
        
        return filter;
    },
    resultValidate: function(field){
    	var n = field.getValue(fields.checknum.record);
    	//S22288 Accommodate Check Numbers Starting with "08" and "09"
    	if(!isNaN(parseFloat(n)) && isFinite(n)){
    		return true;
    	}
        $PPS.log('[resultValidate] Invalid check number='+n);
    	return false;
    },
    recordType: 'transaction'
};

var UnnumberedChecks = {
    title: 'Payments Awaiting Numbering',
    id: 'cust_sublist_unnumbered',
    addMarkAllButtons: false,
    filters: function () {
        var filter = [
            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
            new nlobjSearchFilter('mainline', null, 'is', "T"),
            new nlobjSearchFilter('tobeprinted', null, 'is', "T"),
            new nlobjSearchFilter('account', null, 'anyof', bAccount),
            new nlobjSearchFilter('voided', null, 'is', 'F'),
            new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof', [paymentMethodList.getKey('ACH'),paymentMethodList.getKey('Check')]),
            new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check'])
            //new nlobjSearchFilter('custbody_pp_ach_is_ach', null, 'is', "F")
        ];
        
        if(runningJobsPaymentIds.length > 0){
        	filter.push(new nlobjSearchFilter('internalid', null, 'noneof',runningJobsPaymentIds));
        }

        if(enable_approvals){
        	filter.push(new nlobjSearchFilter(CAC_IS_APPROVED_ID,null,'is','T'));
        }
        
        if(accountingPeriodsEnabled){
        	filter.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
        }
        return filter;
    },
    resultValidate: function(field){
   	 	var f = field.getValue(fields.checknum.record);
        return /\D/g.test(f) || f == '';
    },
    recordType: 'transaction'
};

var ProcessedChecks = {
    title: 'Processed Payments',
    id: 'cust_sublist_processed',
    addMarkAllButtons: true,
    filters: function () {
        
        var filter = [
            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'T'),
            new nlobjSearchFilter('mainline', null, 'is', "T"),
            new nlobjSearchFilter('account', null, 'anyof', bAccount),
            new nlobjSearchFilter('voided', null, 'is', 'F'),
            new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof', [paymentMethodList.getKey('ACH'),paymentMethodList.getKey('Check')]),
            new nlobjSearchFilter('tranid', null, 'isnot', 'To Print'),
            new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check'])
        ];
        
        if(accountingPeriodsEnabled){
        	filter.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
        }
        if (startDate != null && startDate != '') {
            startDate = cleanupDate(startDate);
            filter.push(new nlobjSearchFilter('trandate', null, 'onorafter', startDate));
        }
        if (endDate != null && endDate != '') {
            endDate = cleanupDate(endDate);
            filter.push(new nlobjSearchFilter('trandate', null, 'onorbefore', endDate));
        }
        
        return filter;
    },
    recordType: "transaction"
};

function cleanupDate(dateString) {
    dateArray = dateString.split('-');
    var date = new Date(dateArray[0], dateArray[1], dateArray[2]);
    return date;
}

var ACH = {
    title: 'ACH',
    id: 'cust_sublist_ach',
    addMarkAllButtons: true,
    addMark100Button: true,
    filters: function () {        
        var filter = [
            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
            new nlobjSearchFilter('mainline', null, 'is', "T"),
            new nlobjSearchFilter('tobeprinted', null, 'is', "F"),
            new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof', [paymentMethodList.getKey('ACH')]),
            new nlobjSearchFilter('account', null, 'anyof', bAccount),
            new nlobjSearchFilter('voided', null, 'is', 'F'),
            new nlobjSearchFilter('memorized', null, 'is', 'F'),
            new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check'])
        ];        

        if(runningJobsPaymentIds.length > 0){
        	filter.push(new nlobjSearchFilter('internalid', null, 'noneof',runningJobsPaymentIds));
        }
        
        if(enable_approvals){
        	filter.push(new nlobjSearchFilter(CAC_IS_APPROVED_ID,null,'is','T'));
        }
        
        if(accountingPeriodsEnabled){
        	filter.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
        }
        return filter;
    },
    recordType: 'transaction'
};


function commonWACHFilters(){
	var filter = [
        new nlobjSearchFilter('mainline', null, 'is', "T"),
        new nlobjSearchFilter('account', null, 'anyof', bAccount),
        new nlobjSearchFilter('voided', null, 'is', 'F'),
        new nlobjSearchFilter('memorized', null, 'is', 'F'),
        new nlobjSearchFilter('type', null, 'anyof', ['CustPymt']),
        new nlobjSearchFilter('custbody_pp_payment_method', null, 'anyof', [paymentMethodList.getKey('ACH')])
    ];        
    
    if(accountingPeriodsEnabled){
    	filter.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
    }
    return filter;
}

var WithdrawalACH = {
	    title: 'ACH',
	    id: 'cust_sublist_wach',
	    addMarkAllButtons: true,
	    filters: function (reprocess) {
	        var filter = commonWACHFilters();
	        filter.push(new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'));
	        return filter;
	    },
	    recordType: 'transaction'
};

var ReprocessWithdrawalACH = {
	    title: 'Reprocess ACH',
	    id: 'cust_sublist_reprocess_wach',
	    addMarkAllButtons: true,
	    filters: function (reprocess) {
	        var filter = commonWACHFilters();
	        filter.push(new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'T'));
	        return filter;
	    },
	    recordType: 'transaction'
};


/* Helper to retreive proper script paths and place in ns form. */
var scriptindex = 0; /* Safe custpage naming! */
function loadScriptFile(filename, form) { /* cost is 20 units */
    /* TODO: filter by folder maybe and by date maybe // search bundles first then search suitescripts */
	var file = 'file';
	var fileSearch = nlapiSearchRecord(file, null, new nlobjSearchFilter('name', null, 'is', filename), null);
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

function findPrinterOffsets() {
	
    var columns = [],
		filters = [],
		results = [];
  	
  		//Added filters to remove inactive printer offsets from drop down list
    	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
  
	try{	
	    $PPS.log('findPrinterOffsets');	
	    columns.push(new nlobjSearchColumn('custrecord_pp_printer_name'));	    
		results = nlapiSearchRecord('customrecord_pp_printer_offsets', null, filters, columns);
	
	    /* nlapiSearchRecord returns null for empty results; return empty array instead. */
	    if (!results) {
	        $PPS.log('findPrinterOffsets returned no results.');
	        results = [];
	    }
	}catch(e){
		$PPS.log(e.message);
    }
	
    return results;
}

function getPrinterOffsets(id) {
    var columns = [],
		filters = [],
    	offsets = {
	    		"page_offsets": {
	                "x": "",
	                "y": ""
	            },
	            "micr_offsets": {
	                "x": "",
	                "y": ""
	            },
	            "printer_name":""
	    	};
    
    $PPS.log('getPrinterOffsets');

    try{

	    columns.push(new nlobjSearchColumn('custrecord_pp_printer_name'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_horizontal_page_offest'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_vertical_page_offset'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_horizontal_micr_offset'));
	    columns.push(new nlobjSearchColumn('custrecord_pp_vertical_micr_offset'));
	    
	    filters.push(new nlobjSearchFilter('internalid', null, 'anyof', id));
	    
	    var results = nlapiSearchRecord('customrecord_pp_printer_offsets', null, filters, columns);
	
	    /* nlapiSearchRecord returns null for empty results; return empty array instead. */
	    if (!results) {
	        $PPS.log('getPrinterOffsets returned no results.');
	    }else{
	    	offsets.page_offsets.x = results[0].getValue('custrecord_pp_horizontal_page_offest');
	    	offsets.page_offsets.y = results[0].getValue('custrecord_pp_vertical_page_offset');
	    	offsets.micr_offsets.x = results[0].getValue('custrecord_pp_horizontal_micr_offset');
	    	offsets.micr_offsets.y = results[0].getValue('custrecord_pp_vertical_micr_offset');
	    	offsets.printer_name = results[0].getValue('custrecord_pp_printer_name') + "_" + id;
	    }
    }catch(e){
		$PPS.log(e.message);
    }
    
    return offsets;
}