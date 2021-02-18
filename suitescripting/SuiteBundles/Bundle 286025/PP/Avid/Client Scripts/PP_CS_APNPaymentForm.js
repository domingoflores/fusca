/**
 * Client script for the ProcessAPNPayments suitelet
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Apr 2015     maxm
 * 2.16		  05 Nov 2018	  Sunil				S25946 - Filter payments by US and Non-US addresses
 * 
 * This script requires the following libraries:
 * - PPS_Lib_v1.js
 * - PP_UI_SublistTotals.js
 * - PP_UI_Numberer.js
*/

if (typeof console == "undefined") {
    this.console = {log: function() {}};
}

var numberingSublist = 'cust_sublist_unnumbered';
var checkboxFieldName = 'custpage_pp_pc_checkbox';
var sublists = [numberingSublist,'cust_sublist_numbered'];
var sublistTotaler = new SublistTotaler(sublists,{sublistAmountField: 'custpage_pp_pc_amount'});

var paymentNumbererOptions = {
		onSuccess: function(item,i){
			 var ids = 'custpage_pp_pc_checknum_id_' + item.i;
			 jQuery('#' + ids).html(item.checknumber);
		},
		onFail: function(item,i){
			nlapiSetLineItemValue(numberingSublist, checkboxFieldName, item.i,'F');
		}
};
var numberer = new PPPaymentNumberer(paymentNumbererOptions);


/*This client event occurs whenever a field is changed by the user or by a client side call. This event can also occur directly through beforeLoad user event scripts.
This function is automatically passed up to three arguments by the system: type, name, linenum.
This event type is similar to an onChange PP_CS_JumpMenu_NSCL client-side event.*/

function fieldChanged(type, name, linenum) {
	sublistTotaler.callbacks.fire(type, name, linenum);
	
	if(type == numberingSublist && name == checkboxFieldName){
		var checked = nlapiGetLineItemValue(type, checkboxFieldName, linenum);
		var internalid = nlapiGetLineItemValue(type, "custpage_pp_pc_internalid", linenum);
		var checknum = nlapiGetLineItemValue(type, "custpage_pp_pc_checknum", linenum);
		
		var accountid = nlapiGetFieldValue('custpage_account_select');
		var url = null;
		if(checked == "T" && /(To Print)/.test(checknum)){
			numberer.addToNumber({id : internalid, accountid : accountid, i : linenum});
			
		}else{
			numberer.addToUnnumber({id : internalid, accountid : accountid, i : linenum});
		}
	}
	
	
    if (name == 'custpage_account_select') {
        // Use NetSuite to retrieve value
        // Don't have to set start_date and end_date because they will already be part of url or not
    	var acc = nlapiGetFieldValue(name);
        if (acc == -1) {
        	acc = '';
        }
        var params = {
				custpage_account_select : acc
		};
		var p = insertParams(document.location.search,params);
        setWindowChanged(window, false);
        document.location.search = p;
    }
    else if(name == 'custpage_start_date' || name == 'custpage_end_date'){
    	
    	// Note date fields do not trigger fieldChanged when invalid date is entered
    	var startDate = nlapiGetFieldValue('custpage_start_date');
    	var endDate = nlapiGetFieldValue('custpage_end_date');
    	// only set params when both date filters are set or cleared
    	if(startDate && endDate || !startDate && !endDate){
    		var params = {
        			custpage_start_date : startDate,
        			custpage_end_date : endDate,
    				custpage_account_select : nlapiGetFieldValue('custpage_account_select')
    		};
        	var p = insertParams(document.location.search,params);
            setWindowChanged(window, false);
            document.location.search = p;
    	}
    	
    }
    else if(name == 'custpage_subsidiary'){
		var params = {
				custpage_subsidiary : nlapiGetFieldValue('custpage_subsidiary'),
				custpage_account_select : '' // clear account when subsidiary changes
		};
		var p = insertParams(document.location.search,params);
        setWindowChanged(window, false);
        document.location.search = p;
	}
    //S25946 - Filtering by billing address country
    else if(name=='custpage_country_name') {
    	var params = {
    			custpage_country_name: nlapiGetFieldValue('custpage_country_name')
    	}
    	var p = insertParams(document.location.search,params);
        setWindowChanged(window, false);
        document.location.search = p;
    }
    
    return true;
}

function saveRecord(){
	if(numberer.ajaxInProgress || numberer.getNumQueuedItems() > 0){
		alert('Please wait for payment numbering to complete.');
		return false;
	}
	return true;
}

function insertParams(url,params){
	var kvp = url.substr(1).split('&');
	
	var keys = Object.keys(params);
	for(k in keys){
		key = encodeURIComponent(keys[k]);
		value = encodeURIComponent(params[keys[k]]);
		
		var i = kvp.length; var x; while (i--) {
	        x = kvp[i].split('=');

	        if (x[0] == key) {
	            x[1] = value;
	            kvp[i] = x.join('=');
	            break;
	        }
	    }

	    if (i < 0) { kvp[kvp.length] = [key, value].join('='); }
	}
	return kvp.join('&');
}

function numberAll(a){
	
	var c = nlapiGetLineItemCount(numberingSublist);
	var accountid = nlapiGetFieldValue('custpage_account_select');
	
	var objArr = [];
	for(var linenum = 1; linenum <= c; linenum++){
		var v  = nlapiGetLineItemValue(numberingSublist, checkboxFieldName, linenum);
		if(v == 'F'){
			var internalid = nlapiGetLineItemValue(numberingSublist, "custpage_pp_pc_internalid", linenum);
			var checknum = nlapiGetLineItemValue(numberingSublist, "custpage_pp_pc_checknum", linenum);
			objArr.push({id : internalid, accountid : accountid, i : linenum});
			nlapiSetLineItemValue(numberingSublist, checkboxFieldName, linenum,'T');
			sublistTotaler.callbacks.fire(numberingSublist, checkboxFieldName, linenum);
		}
		
	}
	if(objArr.length > 0){
		numberer.addManyToNumber(objArr);
	}
	
}


function redirectToEntity(entityId){
	var recordType = nlapiLookupField('entity', entityId, 'recordtype');
	var url = nlapiResolveURL('record', recordType, entityId);	
	window.location.href = url;
}

function next100(listName) {
    var count = nlapiGetLineItemCount(listName);
    //check
    var checkVal = 1;
    do {
        var checkAgain = true;
        var isChecked = nlapiGetLineItemValue(listName, 'custpage_pp_pc_checkbox', checkVal); //same name for checkbox on the relevant lists for now - check if this is expanded to other sublists
        if (isChecked == 'T') {
            checkVal += 100;
            if (checkVal > count) {
                checkAgain = false; 
            }
        } else {
            checkAgain = false;
        }
    } while (checkAgain == true)

    //now we have a starting point. apply the next 100, or until the end, whichever comes first.
    var diff = parseInt(count - checkVal);

    if (checkVal > count) {
    	//do nothing
    	return;
    } else if (diff < 100) {
        var end = (count + 1); //needs to be one up so we will check the last checkbox.      
    } else {
        var end = parseInt(checkVal + 100);
    }
    for (var a = checkVal; a < parseInt(end); a++) {
        nlapiSetLineItemValue(listName, 'custpage_pp_pc_checkbox', a, 'T');
        sublistTotaler.callbacks.fire(listName, 'custpage_pp_pc_checkbox', a);
    }

}