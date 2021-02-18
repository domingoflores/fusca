/// <reference path="../../_references.js" />


$360.debug = true;
$360.where = 'PP_SL_PrintChecks';
var context = nlapiGetContext();
var environment = context.getEnvironment();
var accountId = -1;

// Setup object field descriptions/functionality 
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
        format: function (n, rectype) {// formatting

        	var v = nlapiResolveURL('RECORD', changeTypetotype(rectype), n, 'VIEW');
        	var e = nlapiResolveURL('RECORD', changeTypetotype(rectype), n, 'EDIT');
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
        text: true
    },
    status: {
        name: 'custpage_pp_pc_status',
        type: 'text',
        label: 'Status',
        record: 'statusref',
        displaytype: 'hidden',
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
    type: {
        name: 'custpage_pp_pc_type',
        type: 'text',
        label: 'Type',
        record: 'type',
        displaytype: 'hidden'
    },
    recordmethod: {
        name: 'custpage_pp_pc_recordmethod',
        record: 'custbody_pp_ach_is_ach',
        type: 'text',
        label: 'Payment Method',
        format: function(n, t){
        	if(n == "T")
        		return 'ACH';
        	else
        		return 'Check';
        },
        combine: {
        	_call:function(n, x, i, t){
	        	return '<a href="#' + x + ':' + t + '" class="custpage_payment_method">' + n + '</a>';
	        },
	        fieldname:'internalid'
        }        
    },
    recordtype: {
        name: 'custpage_pp_pc_recordtype',
        type: 'text',
        label: 'Payment Type',
        rectype: true
    },
    date: {
        name: 'custpage_pp_pc_date',
        type: 'text',
        label: 'Date',
        record: 'trandate'
    },
    amount: {
        name: 'custpage_pp_pc_amount',
        type: 'currency',
        label: 'Amount',
        record: 'amount',
        format: function (n) {// formatting 
            return Math.abs(parseFloat(n));
        }
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
    ach: {
        name: 'custpage_pp_pc_ach',
        type: 'text',
        label: 'ACH',
        record: 'custbody_pp_ach_is_ach',
        displaytype: 'hidden',
        format: function (n) {// formating 
            return n == "T" ? "true" : "false";
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

// set form to New NetSuite Form
var form = nlapiCreateForm('Piracle Pay Services', false),
	enable_approvals = false,
	bAccount = null,
	allSublists = [],
	common_col_fields = [];

//Build the NS columns to search
for (var ii in fields) {
	if (fields[ii].hasOwnProperty('combine')) {
        var col = new nlobjSearchColumn(fields[ii].combine.fieldname);
        if (fields[ii].sort){
            col.setSort(fields[ii].sort);
        }
        common_col_fields.push(col);
    }
	
    if (fields[ii].record != null) {
        var col = new nlobjSearchColumn(fields[ii].record, fields[ii].parent);
        if (fields[ii].sort){
            col.setSort(fields[ii].sort);
        }
        common_col_fields.push(col);
    }
}

// Start Suitelet "GET"
function startSuitelet(request, response) {
    $360.log("*** Start suitelet print checks ***");

    // Load up the jbox plugin for jquery
    form = loadScriptFile("jquery.jbox.js", form);
    
    // Check for enabled approvals
    enable_approvals = nlapiLoadConfiguration('companypreferences').getFieldValue('custscript_enable_approvals') == 'T' ? true : false;
    
    // Get the choosing bank account 
    bAccount = request.getParameter("custpage_account_select");

    //Jump Menu Native client script // Step 1
    if (request.getMethod() == 'GET'){
        form.setScript("customscript_pp_cs_menunumbering");
    }
    
    // Display search and results as soon as the page is accessed // Step 2
    if (request.getMethod() == 'GET' && bAccount !== null) {
        $360.log("*** Create form/sublist ***");

        createAccountSelect();
        createPrinterSelect();
        // Create the form
        form = createForm();

        // attempt to create a back button - I think this needs help ~~
        var innerhtml = form.addField("custpage_back_url", "inlinehtml");
        var reqFileUrl = nlapiResolveURL('SUITELET', 'customscript_pp_sl_printchecks', 'customdeploy_pp_sl_printchecks');
        innerhtml.setDefaultValue('<input type="hidden" id="pp_back_url" value="' + reqFileUrl + '" />');
    } else if (request.getMethod() == 'GET' && bAccount === null) {
        
        createAccountSelect();
        // Load up the 360's Library for helper methods and Jump Menu script
        //form = loadScriptFile("PP_CS_JumpMenu.js", piraclePath + 'Client Scripts/', form);
    }

    // Retreive checked checks to be printed // Step 3
    if (request.getMethod() == 'POST') {
        $360.log("*** Process form/sublist ***");

        form = sendToPrint(request, response);
        // Load up the 360's Library for helper methods
        form = loadScriptFile("360_Lib_v1.js", form);
        // Load up the main handler script for UI
        form = loadScriptFile("PP_CS_Status_Progress.js", form);
    }

    response.writePage(form);

    $360.log("*** End suitelet print checks ***");
}

// Send to Piracle "POST"
function sendToPrint(request, response) {
    $360.log("*** Send To Print ***");

    var checknums = [];
    var printer = request.getParameter("custpage_printer_select");
    var custpage_sublists = request.getParameter("custpage_sublists");
    if (custpage_sublists != "")
        allSublists = custpage_sublists.split(",");
    

    /* OLD DIRECTION */
    function runOldCollection(){
	    for (var cks = 0; cks < allSublists.length; cks++) {
	        //$360.log("List : " + allSublists[cks]);
	        var c = request.getLineItemCount(allSublists[cks]);
	
	        //$360.log("Number of Checks: " + c);
	        // Loop through each line and filter out the non-checked checkboxes
	        for (var i = 1; i <= c; i++) {
	            var checkbox = request.getLineItemValue(allSublists[cks], fields.checkbox.name, i);
	            if (checkbox == "T") {
	                var iid = request.getLineItemValue(allSublists[cks], fields.internalid.name, i);
	                if (iid != null) {
	                    var siid = iid.split(":");
	                    checknums[siid[0]] = siid[1];
	                }
	            }
	        }
	    }
    }
    /* END OLD DIRECTION */
    
    
    /* NEW DIRECTION */
    function runNewCollection(){
	    // Loop through each sublist
	    for (var cks = 0; cks < allSublists.length; cks++) {
	        //$360.log("List : " + allSublists[cks]);
	        var c = request.getLineItemCount(allSublists[cks]);
	
	        //$360.log("Number of Checks: " + c);
	        // Loop through each line and filter out the non-checked checkboxes
	        for (var i = 1; i <= c; i++) {
	            var checkbox = request.getLineItemValue(allSublists[cks], fields.checkbox.name, i);
	            if (checkbox == "T") {
	                var iid = request.getLineItemValue(allSublists[cks], fields.internalid.name, i);
	                var ach = request.getLineItemValue(allSublists[cks], fields.ach.name, i);
	                if (iid != null) {
	                    var siid = iid.split(":");
	                    checknums.push(
	                    	{
	                    		"id": siid[0], 
	                    		"type": siid[1], 
	                    		"ach": ach 
	                    	}
	                    );
	                }
	            }
	        }
	    }
    }
    /* END NEW DIRECTION */
    
    
    
    runNewCollection();
    
    
    try{

        if (checknums != null) {
            $360.log("*** Send to Piracle ***");

            //Setup Piracle PP SSO URL 
            var url = $PPS.nlapiOutboundSSO();
            
            $360.log("url: " + url);
            
            var offsets = getPrinterOffsets(printer);
            
            var dataToSend = $360.merge( { "payments": checknums }, offsets);

            $360.log("checknums: " + JSON.stringify(checknums));
            $360.log("printer: " + printer);
            $360.log("offsets: " + JSON.stringify(offsets));
            $360.log("post: " + JSON.stringify(dataToSend));
            
            var data = $360.NSRestReq(url, JSON.stringify(dataToSend), $360.httpVerbs.post);

            $360.log(data);

            try{
                var jobid = JSON.parse(data.httpbody).jobID;

                try{
                    var rec = nlapiCreateRecord('customrecord_pp_print_status');
                    // need to populate this now because the method is doing common work between create and update
                    rec.setFieldValue("custrecord_pp_ps_created_date", nlapiDateToString(new Date()));

                    var job = {
                        jobid: jobid,
                        achcount: 0,
                        itemcount: 0,
                        jobstatus: "",
                        fileurl: "",
                        overflowcount: 0,
                        itemsprinted: 0,
                        itemsprocessed: 0,
                        voidcount: 0,
                        internal_ids: []
                    };

                    setData(rec, job);
                } catch (e) {
                    $360.log(e);
                }


                if (data.error == null) {
                    if (JSON.parse(data.httpbody).commanderrmsg == null) {
                        var innerhtml = form.addField("output1", "inlinehtml");
                        innerhtml.setDefaultValue('<input type="hidden" id="jobid" value="' + JSON.parse(data.httpbody).jobID + '" />');

                        var innerhtml = form.addField("output2", "inlinehtml");
                        innerhtml.setDefaultValue('<div id="job"></div>');
                    } else {
                        var innerhtml = form.addField("output1", "inlinehtml");
                        innerhtml.setDefaultValue('Error! ' + JSON.parse(data.httpbody).commanderrmsg);
                    }
                } else
                    form.addField("label", "label", "Error: " + data.error);

            } catch (e) {
                form.addField("label", "label", "Error: No Job ID in request.");
                $360.log(e);
            }
        }
    } catch (e) {
        $360.log(e);
    }
    return form;
}

function setData(_rec, job) {
    try {
        _rec.setFieldValue("custrecord_pp_ps_jobid", job.jobid);
        _rec.setFieldValue("custrecord_pp_ps_status_date", nlapiDateToString(new Date(), 'datetime'));
        _rec.setFieldValue("custrecord_pp_ps_status", job.jobstatus.toString());
        _rec.setFieldValue("custrecord_pp_ps_itemsprinted", job.itemsprinted);
        _rec.setFieldValue("custrecord_pp_ps_itemcount", job.itemcount);
        _rec.setFieldValue("custrecord_pp_ps_fileurl", job.fileurl.toString());
        _rec.setFieldValue("custrecord_pp_ps_internal_ids", JSON.stringify(job.internal_ids));
        _rec.setFieldValue("custrecord_pp_ps_internal_ids_processing", JSON.stringify(job.internal_ids));
        nlapiSubmitRecord(_rec);
    } catch (e) {
        $360.log(e);
    }
}

function createPrinterSelect() {

	//form.addTab('custpage_secondtab', 'Printer Selection');
    var printerSelect = form.addField('custpage_printer_select', 'select', 'Printer Offset', null, null);//'custpage_secondtab'
    printerSelect.addSelectOption(-1, '');

    // TODO: Put search in here to get a list of printer offsets
    //customrecord_pp_printer_offsets
    
    var prints = findPrinterOffsets();
    // Populate Account dropdown with search results with internal ID as the option ID
    if (prints.length > 0)
        for (var ri = 0; ri < prints.length; ri++)
        	printerSelect.addSelectOption(prints[ri].getId(), prints[ri].getValue('custrecord_pp_printer_name'), prints[ri].getValue('custrecord_pp_default_printer') == "T");
    //printerSelect.addSelectOption(id, name, selected);

    return printerSelect;
}

function createAccountSelect() {
	//form.addTab('custpage_firsttab', 'Bank Selection');
    var accountSelect = form.addField('custpage_account_select', 'select', 'Bank Account', null, null);//'custpage_secondtab'
    accountSelect.addSelectOption(-1, '');

    var accs = findBankAccounts();
    // Populate Account dropdown with search results with internal ID as the option ID
    if (accs.length > 0)
        for (var ri = 0; ri < accs.length; ri++)
            accountSelect.addSelectOption(accs[ri].getId(), accs[ri].getValue('name'), bAccount == accs[ri].getId());

    return accountSelect;
}

// Create the form and build the UI
function createForm() {
    //form.addFieldGroup('custpage_itemgroup', ' ');

    if(fields.edit && context.email != "jfoglia@360cloudsolutions.com")
    	delete fields.edit;
    
    
    // Create and populate sublists using common objects
    UnnumberedChecks.display(setupUiSublist(form, UnnumberedChecks.title, fields, 'cust_sublist_unnumbered'));
    
    var before = fields.checknum.label;
    fields.checknum.label = "Item #";
    ACH.display(setupUiSublist(form, ACH.title, fields, 'cust_sublist_ach'));
    fields.checknum.label = before;
    //PositivePay.display(setupUiSublist(form, PositivePay.title, fields, 'cust_sublist_positive'));
    
    NumberedChecks.display(setupUiSublist(form, NumberedChecks.title, fields, 'cust_sublist_numbered'));
    
    delete fields.recordmethod.combine;
    
    ProcessedChecks.display(setupUiSublist(form, ProcessedChecks.title, fields, 'cust_sublist_processed'));
    
    var innerhtml = form.addField("output1", "inlinehtml");
    innerhtml.setDefaultValue('<input type="hidden" id="custpage_sublists" name="custpage_sublists" value="' + allSublists.join(",") + '" />');

    form.addSubmitButton('Process');
    return form;
}

// Create subist
var sublistsIdx = 0;
function setupUiSublist(form, title, _fields, _listName) {
    if (!form) return null; // No form no go
    if (!title) title = "Sub list " + sublistsIdx; // default title naming
    var listName = "cust_sublist_" + sublistsIdx;
    if(_listName) listName = _listName;
    var sublist = form.addSubList(listName, 'list', title);// create the sublist
    allSublists.push(listName);
    if (_fields != null) {// no fields no go
        for (var i in _fields) {
            var field = sublist.addField(_fields[i].name, _fields[i].type, _fields[i].label); // add field using field object 
            if (_fields[i].displaytype){// if field object contains a display type lets set it.
                field.setDisplayType(_fields[i].displaytype);
            }
        }
    }
    sublist.addMarkAllButtons();// Add btn's for marking/unmarking all checkboxs
    sublistsIdx++;// increment sublist
    return sublist;
}

/* Sublist processing objects */
// Objects for each sublist - holds title of sublist - searches for checks - populates sublists 
var NumberedChecks = {
    title:'Checks to be Printed',
    get: function () {
        $360.log("*** " + this.title + " ***");
        var _transactions = {};
        /**** Search for checks ****/
        var filter = [
            new nlobjSearchFilter('tobeprinted', null, 'is', 'F'),

            new nlobjSearchFilter('mainline', null, 'is', "T"),
            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
            new nlobjSearchFilter('custbody_pp_ach_is_ach', null, 'is', "F")
            , new nlobjSearchFilter('account', null, 'anyof', bAccount)
        ];
        
        if(enable_approvals)
        	filter.push(new nlobjSearchFilter('custbody_pp_approval_status', null, 'anyof', "1"));
        
        
        _transactions["p"] = GetSearch('vendorpayment', filter, common_col_fields);
        _transactions["r"] = GetSearch('customerrefund', filter, common_col_fields);
        _transactions["c"] = GetSearch('check', filter, common_col_fields);

        /**** Search for checks ****/

        return _transactions;
    },
    display: function (sublist) {
        var trans = NumberedChecks.get();
        for (var c in trans) {
            if(!$360.IsEmpty(trans[c])){
                sublist = parseResults(sublist, trans[c], function (field) {
	                return /\d/g.test(field.getValue(fields.checknum.record));
	            }, c);
            }
        }

        setTitle(NumberedChecks.title, sublist);

        return sublist;
    }
};

var UnnumberedChecks = {
    title: 'Checks Awaiting Numbering',
    get: function () {
        $360.log("*** " + this.title + " ***");
        var _transactions = {};
        /**** Search for checks ****/
        var filter = [
            new nlobjSearchFilter('mainline', null, 'is', "T"),
            new nlobjSearchFilter('tobeprinted', null, 'is', "T"),
            new nlobjSearchFilter('account', null, 'anyof', bAccount),
            new nlobjSearchFilter('custbody_pp_ach_is_ach', null, 'is', "F")
        ];

        if(enable_approvals)
        	filter.push(new nlobjSearchFilter('custbody_pp_approval_status', null, 'anyof', "1"));
        
        
        _transactions["p"] = GetSearch('vendorpayment', filter, common_col_fields);
        _transactions["r"] = GetSearch('customerrefund', filter, common_col_fields);
        _transactions["c"] = GetSearch('check', filter, common_col_fields);

        /**** Search for checks ****/

        return _transactions;
    },
    display: function (sublist) {
        var trans = UnnumberedChecks.get();        
        for (var c in trans) {
            if (!$360.IsEmpty(trans[c])){
                sublist = parseResults(sublist, trans[c], function (field) {
	                var f = field.getValue(fields.checknum.record);
	                return /\D/g.test(f) || f == '';
	            }, c);
            }
        }

        setTitle(UnnumberedChecks.title, sublist);

        return sublist;
    }
};

var ProcessedChecks = {
    title: 'Processed Payments',
    get: function () {
        $360.log("*** " + this.title + " ***");
        var _transactions = {};
        /**** Search for checks ****/
        
        var filter = [
            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'T'),
            new nlobjSearchFilter('mainline', null, 'is', "T")
        ];
        
        _transactions["p"] = GetSearch('vendorpayment', filter, common_col_fields);        
        _transactions["r"] = GetSearch('customerrefund', filter, common_col_fields);
        _transactions["c"] = GetSearch('check', filter, common_col_fields);
                
        /**** Search for checks ****/

        return _transactions;
    },
    display: function (sublist) {
        var trans = this.get();
        
        for (var c in trans) {
            if (!$360.IsEmpty(trans[c])){
                sublist = parseResults(sublist, trans[c], function (field) {
                	return true;
                }, c, "p");
            }
        }

        setTitle(this.title, sublist);

        return sublist;
    }
};

var ACH = {
    title: 'ACH',
    get: function () {
        $360.log("*** " + this.title + " ***");
        var _transactions = {};
        /**** Search for checks ****/
        
        var filter = [
            new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
            new nlobjSearchFilter('mainline', null, 'is', "T"),
            new nlobjSearchFilter('custbody_pp_ach_is_ach', null, 'is', "T")
        ];        

        
        if(enable_approvals)
        	filter.push(new nlobjSearchFilter('custbody_pp_approval_status', null, 'anyof', "1"));
        
        _transactions["p"] = GetSearch('vendorpayment', filter, common_col_fields);
        _transactions["r"] = GetSearch('customerrefund', filter, common_col_fields);
        _transactions["c"] = GetSearch('check', filter, common_col_fields);
        
        /**** Search for checks ****/

        return _transactions;
    },
    display: function (sublist) {
        var trans = ACH.get();
        for (var c in trans) {
            if (!$360.IsEmpty(trans[c])){
                sublist = parseResults(sublist, trans[c], function (field) {
	                return true;
	            }, c);
            }
        }

        setTitle(ACH.title, sublist);

        return sublist;
    }
};

// No Longer used but kept the code just in case
var PositivePay = {
    title: 'Positive Pay Payments',
    get: function () {
        $360.log("*** " + this.title + " ***");
        var _transactions = {};
        /**** Search for checks ****/
        /*
        var filter = [
            new nlobjSearchFilter('tranid', null, 'isnotempty'),// This doesn't work
            new nlobjSearchFilter('tranid', null, 'isnot', ' '),// Nor does this
            new nlobjSearchFilter('mainline', null, 'is', "T")// This works tho
        ];
        
        
        if(enable_approvals)
        	filter.push(new nlobjSearchFilter('custbody_pp_approval_status', null, 'anyof', "1"));
        
        _transactions["p"] = GetSearch('vendorpayment', filter, common_col_fields);
        _transactions["r"] = GetSearch('customerrefund', filter, common_col_fields);
        _transactions["c"] = GetSearch('check', filter, common_col_fields);

        /**** Search for checks ****/

        return _transactions;
    },
    display: function (sublist) {
        var trans = PositivePay.get();
        
        for (var c in trans) {
            if (!$360.IsEmpty(trans[c])){
                sublist = parseResults(sublist, trans[c], function (field) {
	                return true;
	            }, c);
	        }
        }

        setTitle(PositivePay.title, sublist);

        return sublist;
    }
};
/* Sublist processing objects */

function setTitle(title, sublist) {
    var cnt = sublist.getLineItemCount();
    if ($360.context().getPreference('UNLAYEREDTABS') == "F"){
        sublist.setLabel(title + ' - ' + (cnt < 0 ? 0 : cnt));
    }
}

// Parse the results for the sublists - add each result to the sublist.
function parseResults(sublist, trans, condition, rectype, q) {	
	var _in = 0;
	try{
		_in = sublist.getLineItemCount();
	}catch(e){ $360.log(e); }
		
    // Sublist line item index
    var inx = 1 + (_in < 0 ? 0 : _in);
    // Results line item index
    
    if (!$360.IsEmpty(trans)) {
        for (var i in trans) {
            if ($360.isJavaObject(trans[i])) {
                try {
                    if (condition(trans[i])) { // callback method used to check which ever conditions are needed
                    	
                    	var __t = [];
                    	
                        for (var k in fields) { // Work through the field object placing data and values where needed based on the fields object itself
                        	
                            var r = "";

                            if (fields[k].hasOwnProperty('text') && 
                        		!fields[k].value && 
                        		fields[k].hasOwnProperty('record')){// By default check record in field - retrieve by using getText
                                
                            	r = trans[i].getText(fields[k].record);
                            	
                            }else if (fields[k].text == null && 
                            		!fields[k].value && 
                            		fields[k].hasOwnProperty('record')){// By default check record in field - retrieve by using getValue
                                
                            	r = trans[i].getValue(fields[k].record);
                                
                        	}else if (fields[k].hasOwnProperty('value')){// Use a default value
                                
                        		r = fields[k].value;
                        		
                    		}else if (fields[k].hasOwnProperty('rectype')){
                                
                    			r = changeType(rectype);
                    			
                    		}
                            
                            if (fields[k].hasOwnProperty('format')){// if there is a reason to format the value do so
                                r = fields[k].format(r, rectype, inx);
                            }
                        
                            if(fields[k].hasOwnProperty('combine')){
                            	r = fields[k].combine._call(r, trans[i].getValue(fields[k].combine.fieldname), inx, rectype);
                            }
                            
                            sublist.setLineItemValue(fields[k].name, inx, r);// finally set the value to a line and column
                            __t.push([fields[k].name, inx, r]);
                        }
                    	
                        inx++;
                    }
                } catch (e) {
                    $360.log([e, ' index: ' + i, fields.checknum.record]);
                }
            }
        }
    }

    return sublist;
}


// I have no idea why I did this, I thought it was suppose to be more complex.
function GetSearch(search, filters, columns) {
    var data = nlapiSearchRecord(
        search,
        null,
        filters,
		columns);

    return data;
}


// Helper to retreive proper script paths and place in ns form.
var scriptindex = 0; // Safe custpage naming!
function loadScriptFile(filename, form) { // cost is 20 units
    //// TODO: filter by folder maybe and by date maybe // search bundles first then search suitescripts
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


/**
 * Searches for all Bank Accounts.
 * 
 * @returns {nlobjSearchResult[]} Results obtained from Account Record search or an empty array if
 * 		there are no results.
 * @private
 */
function findBankAccounts() {
    var columns = [],
		filters = [],
		results = [];

    $360.log('Searching bank accounts');

    columns.push(new nlobjSearchColumn('name'));
    filters.push(new nlobjSearchFilter('type', null, 'is', 'Bank'));
    results = nlapiSearchRecord('account', null, filters, columns);

    /* nlapiSearchRecord returns null for empty results; return empty array instead. */
    if (!results) {
        $360.log('Account Search returned no results.');
        results = [];
    }
    return results;
}

function findPrinterOffsets() {
    var columns = [],
		filters = [],
		results = [];

    $360.log('findPrinterOffsets');

    columns.push(new nlobjSearchColumn('custrecord_pp_printer_name'));
    
	results = nlapiSearchRecord('customrecord_pp_printer_offsets', null, filters, columns);

    /* nlapiSearchRecord returns null for empty results; return empty array instead. */
    if (!results) {
        $360.log('findPrinterOffsets returned no results.');
        results = [];
    }

    return results;
}
function getPrinterOffsets(id) {
    var columns = [],
		filters = [],
		results = [];

    $360.log('getPrinterOffsets');

    columns.push(new nlobjSearchColumn('custrecord_pp_printer_name'));
    columns.push(new nlobjSearchColumn('custrecord_pp_horizontal_page_offest'));
    columns.push(new nlobjSearchColumn('custrecord_pp_vertical_page_offset'));
    columns.push(new nlobjSearchColumn('custrecord_pp_horizontal_micr_offset'));
    columns.push(new nlobjSearchColumn('custrecord_pp_vertical_micr_offset'));
    
    filters.push(new nlobjSearchFilter('internalid', null, 'anyof', id));
    
    results = nlapiSearchRecord('customrecord_pp_printer_offsets', null, filters, columns);

    /* nlapiSearchRecord returns null for empty results; return empty array instead. */
    if (!results) {
        $360.log('getPrinterOffsets returned no results.');
        results = [];
        return {
    		"page_offsets": {
                "x": "",
                "y": ""
            },
            "micr_offsets": {
                "x": "",
                "y": ""
            }
    	};
    }
    
    return {
		"page_offsets": {
            "x": results[0].getValue('custrecord_pp_horizontal_page_offest'),
            "y": results[0].getValue('custrecord_pp_vertical_page_offset')
        },
        "micr_offsets": {
            "x": results[0].getValue('custrecord_pp_horizontal_micr_offset'),
            "y": results[0].getValue('custrecord_pp_vertical_micr_offset')
        }
	};
}

function changeTypetotype(t) {
    switch (t) {
        case "r":
            return 'customerrefund';
            break;
        case "c":
            return 'check';
            break;
        case "p":
            return 'vendorpayment';
            break;
    }
}

function changeType(t) {
    switch (t) {
        case "r":
            return 'Customer Refund';
            break;
        case "c":
            return 'Check';
            break;
        case "p":
            return 'Vendor Payment';
            break;
    }
}