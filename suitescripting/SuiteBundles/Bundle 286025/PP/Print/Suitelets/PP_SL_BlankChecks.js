function suitelet(request, response){
	
	var form = nlapiCreateForm('Create Blank Checks', false);
	var bAccount = request.getParameter("custpage_account_select");
	
	if(request.getMethod() == 'POST'){
		
		var accountRec = nlapiLoadRecord('account', bAccount);
		var nextCheckNumber = accountRec.getFieldValue('curdocnum');
		var printer = request.getParameter("custpage_printer_select");
		
		var startNum,endNum;
		try{
			startNum = parseInt(request.getParameter('start_num'));
			endNum = parseInt(request.getParameter('end_num'));
		}
		catch(e){
			throw nlapiCreateError('START_END_NAN', 'The starting and ending check numbers must be valid numbers', true);
		}
		
		if(startNum == 'NaN' || endNum == 'NaN'){
			throw nlapiCreateError('START_END_NAN', 'The starting and ending check numbers must be valid numbers', true);
		}
		
		if(startNum > endNum){
			throw nlapiCreateError('START_GT_END', 'The starting check number is greater than your ending check number', true);
		}
		
		var usedCheckNumbers = findUsedCheckNumbers(startNum,endNum,bAccount);
		if(usedCheckNumbers.length > 0){
			throw nlapiCreateError('CHECK_NUMBERS_USED','The following check numbers have already been used: ' + usedCheckNumbers.join(','),true);
		}
		
		var checkNumbers = [];
		for(var i = startNum; i <= endNum; i++){
			checkNumbers.push(i);
		}
		
		//Setup PP SSO URL 
        var url = $PPS.nlapiOutboundSSO();
        
        $PPS.log("url: " + url);
        
		var ppsObj = {
				checkNumbers : checkNumbers,
				accountId : bAccount,
				printerOffsets : getPrinterOffsets(printer)
		};
		// Send data to PPS
	    var data = $PPS.NSRestReq(url, JSON.stringify(ppsObj), $PPS.httpVerbs.post)
		
	    $PPS.log(data);
        if(data.httpcode == '401'){
        	form.addField("label", "label", "Error: Your AvidXchange Self-Managed account has not been setup or is inactive. "+
        			"Please contact AvidXchange support at 800.621.5720 or send an email to <a href=\"mailto:supportdepartment@avidxchange.com\">supportdepartment@avidxchange.com</a>.");
        }
        try{
            var jobid = JSON.parse(data.httpbody).jobID;

            if (data.error == null) {
                if (JSON.parse(data.httpbody).commanderrmsg == null) {
                	var myInlineHtml = form.addField( 'custcontent', 'inlinehtml');
                	myInlineHtml.setLayoutType('outsideabove', 'startrow');
                	myInlineHtml.setDefaultValue("");
                	
                    var innerhtml = form.addField("output1", "inlinehtml");
                    innerhtml.setDefaultValue('<input type="hidden" id="jobid" value="' + JSON.parse(data.httpbody).jobID + '" />');

                    var innerhtml = form.addField("output2", "inlinehtml");
                    innerhtml.setDefaultValue('<div id="job"></div>');
                    
                    if(nextCheckNumber == startNum){
                    	accountRec.setFieldValue('curdocnum', endNum + 1);
                    	nlapiSubmitRecord(accountRec, false, true);
                    }
                } else {
                    var innerhtml = form.addField("output1", "inlinehtml");
                    innerhtml.setDefaultValue('Error! ' + JSON.parse(data.httpbody).commanderrmsg);
                }
            } 
            else {
                form.addField("label", "label", "Error: " + data.error);
            }

        } catch (e) {
            form.addField("label", "label", "Error: No Job ID in request.");
            $PPS.log(e);
        }
		
		/* Load up the PPS's Library for helper methods */
        form = loadScriptFile("PPS_Lib_v1.js", form);
        /* Load up the main handler script for UI */
        form = loadScriptFile("PP_CS_Status_Progress.js", form);
        
		nlapiLogExecution('DEBUG', 'Check Numbers', JSON.stringify(checkNumbers));
		
			
	}
	else{
		form.setScript("customscript_pp_cs_jumpmenu");
		var acctSelectField = createAccountSelect(form,bAccount);
		if(bAccount){
			
			createPrinterSelect(form);
			// display form options
			var account = nlapiLoadRecord('account', bAccount);
			var nextCheckNumber = account.getFieldValue('curdocnum');
			
			var startNumField = form.addField('start_num', 'integer', 'Starting Check Number');
			startNumField.setDefaultValue(nextCheckNumber);
			
			var endNumField = form.addField('end_num', 'integer', 'Ending Check Number');
			endNumField.setDefaultValue(nextCheckNumber);
			endNumField.setHelpText('The highest check number to print including this number.');
			
			form.addSubmitButton('Submit');
		}
		else{
			
		}
	}
	response.writePage(form);
	
}


function createAccountSelect(form,selectedAccount) {

    //form.addFieldGroup('custpage_firstgroup', 'Bank Account Selection');
    var accountSelect = form.addField('custpage_account_select', 'select', 'Bank Account', null, null);
    accountSelect.addSelectOption(-1, '');

    $PPS.buildAccountSelectOptions(accountSelect,selectedAccount);

    return accountSelect;
}


function createPrinterSelect(form) {

	var prefs = nlapiLoadConfiguration('userpreferences');
	var printerOffset = prefs.getFieldValue('custscript_user_printer_offset_printer');
	
    var printerSelect = form.addField('custpage_printer_select', 'select', 'Printer Offset', null, null);
    
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

function findUsedCheckNumbers(startNum,endNum,bAccount){
	var usedCheckNumbers = [];
	var columns = [];
	var filters = [];
	
	columns.push(new nlobjSearchColumn('tranid'));
	
	filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
	filters.push(new nlobjSearchFilter('account', null, 'anyof', [bAccount]));
	filters.push(new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']));
	filters.push(new nlobjSearchFilter('number',null,'greaterthanorequalto',startNum));
	filters.push(new nlobjSearchFilter('number',null,'lessthanorequalto',endNum));
	
	var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			usedCheckNumbers.push(searchResults[i].getValue('tranid'));
		}
	}
	
	return usedCheckNumbers;
}

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
	        $PPS.log('getPrinterOffsets reutrned no results.');
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

/*function findUsedCheckNumbers(bAccount,checkNumbers){
	var usedCheckNumbers = [];
	var columns = [];
	var filters = [];
	
	columns.push(new nlobjSearchColumn('tranid'));
	
	filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
	filters.push(new nlobjSearchFilter('account', null, 'anyof', [bAccount]));
	filters.push(new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']));
	filters.push(new nlobjSearchFilter('tranid',null,'anyof',checkNumbers));
	
	//var searchResults = nlapiCreateSearch('transaction', null, filters, columns);
	var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			usedCheckNumbers.push(searchResults[i].getValue('tranid'));
		}
	}
	
	return usedCheckNumbers;
}*/