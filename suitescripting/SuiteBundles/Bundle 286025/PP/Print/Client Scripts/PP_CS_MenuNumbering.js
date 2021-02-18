/**
 * @author Jay
 * 11/14/2012 11:23:12 AM
 * This client script contains both NS Client Script and jQuery to run on the clients browser. 
 * 
 * This script requires the following libraries:
 * - PPS_Lib_v1.js
 * - PP_UI_SublistTotals.js
 * - PP_UI_Numberer.js
*/

$PPS.debug = true;
$PPS.where = "PP_CS_MenuNumbering";

var timeout;

if (typeof console == "undefined") {
    this.console = {log: function() {}};
}

//var lists = ['cust_sublist_unnumbered', 'cust_sublist_ach'];

var sublists = ['cust_sublist_unnumbered','cust_sublist_numbered','cust_sublist_ach','cust_sublist_processed','cust_sublist_wach'];
var sublistTotaler = new SublistTotaler(sublists,{sublistAmountField: 'custpage_pp_pc_amount'});

var paymentNumbererOptions = {
		onSuccess: function(item,i){
			 var ids = 'custpage_pp_pc_checknum_id_' + item.i;
			 jQuery('#' + ids).html(item.checknumber);
		},
		onFail: function(item,i){
			nlapiSetLineItemValue('cust_sublist_unnumbered', "custpage_pp_pc_checkbox", item.i,'F');
		}
};
var numberer = new PPPaymentNumberer(paymentNumbererOptions);



/*This client event occurs whenever a field is changed by the user or by a client side call. This event can also occur directly through beforeLoad user event scripts.
This function is automatically passed up to three arguments by the system: type, name, linenum.
This event type is similar to an onChange PP_CS_JumpMenu_NSCL client-side event.*/

function fieldChanged(type, name, linenum) {
	sublistTotaler.callbacks.fire(type, name, linenum);
	
	if((type == 'cust_sublist_unnumbered'/* || type == 'cust_sublist_ach'*/) && name == "custpage_pp_pc_checkbox"){
		var checked = nlapiGetLineItemValue(type, "custpage_pp_pc_checkbox", linenum);
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
	
	
    var field = 'custpage_account_select';
    if (field == name) {
        // Use NetSuite to retrieve value
        var acc = nlapiGetFieldValue(field);
        if (acc > 0) {
            var p = insertParam(field, acc);
            setWindowChanged(window, false);
            document.location.search = p;
        }
    }

    if (name == 'custpage_start_date_range' || name =='custpage_end_date_range') {
    	//recalc/reload with limited range of transactions
    	var fieldVal = nlapiGetFieldValue(name);
        if (fieldVal != null && fieldVal != '') {
        	var dateObj = nlapiStringToDate(fieldVal);
        	//var acc = dateObj.getTime(); //gets milliseconds since midnight on Jan 1, 1970 and date - easier to send and parse around different date formats
        	//acc = parseInt(acc) + parseInt(dateObj.getTimezoneOffset());
        	var year = dateObj.getFullYear();
        	var month = dateObj.getMonth();
        	var day = dateObj.getDate();
        	var dateString = year + '-' + month + '-' + day;
            var p = insertParam(name, dateString);
            setWindowChanged(window, false);
            document.location.search = p;
        } else {
        	p = removeParam(name);
        	setWindowChanged(window, false);
        	document.location.search = p;
        }
    }

    if (name == 'custpage_use_scheduled_script') {
    	var schedVal = nlapiGetFieldValue('custpage_use_scheduled_script');
    	if (schedVal == 'F') {
    		var curCount = nlapiGetFieldValue('custpage_total_selected');
    		if (curCount >= 50) {
    			alert('With this many transactions selected, the script will use the scheduled version to avoid governance limitations.');
    			nlapiSetFieldValue('custpage_use_scheduled_script', 'T');
    		}
    	}
    }
    return true;
}

function saveRecord(){
	setCookie('presist_printer', nlapiGetFieldValue('custpage_printer_select'), 365);
	if(numberer.ajaxInProgress || numberer.getNumQueuedItems() > 0){
		alert('Please wait for payment numbering to complete.');
		return false;
	}
	return true;
}


function insertParam(key, value) {
    key = escape(key); value = escape(value);

    var kvp = document.location.search.substr(1).split('&');

    var i = kvp.length; var x; while (i--) {
        x = kvp[i].split('=');

        if (x[0] == key) {
            x[1] = value;
            kvp[i] = x.join('=');
            break;
        }
    }

    if (i < 0) { kvp[kvp.length] = [key, value].join('='); }
    return kvp.join('&');
    //this will reload the page, it's likely better to store this until finished
}

function removeParam(key) {
	key = escape(key);
	var kvp = document.location.search.substr(1).split('&'); //now have 'param=value' sets
	var paramList = [];

	var i = kvp.length; var x; while (i--) {
		x = kvp[i].split('=');
		
		if (x[0] == key) {
			//do nothing
		} else {
			paramList.push(kvp[i]); //adds whole param=value set		}
		}
	}
	if (i < 0) {
		return paramList.join('&'); //returns param list without removed param.
	}
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


function numberAll(a){
	
	var c = nlapiGetLineItemCount('cust_sublist_unnumbered');
	var accountid = nlapiGetFieldValue('custpage_account_select');
	
	var objArr = [];
	for(var linenum = 1; linenum <= c; linenum++){
		var v  = nlapiGetLineItemValue('cust_sublist_unnumbered', "custpage_pp_pc_checkbox", linenum);
		if(v == 'F'){
			var internalid = nlapiGetLineItemValue('cust_sublist_unnumbered', "custpage_pp_pc_internalid", linenum);
			var checknum = nlapiGetLineItemValue('cust_sublist_unnumbered', "custpage_pp_pc_checknum", linenum);
			objArr.push({id : internalid, accountid : accountid, i : linenum});
			nlapiSetLineItemValue('cust_sublist_unnumbered', "custpage_pp_pc_checkbox", linenum,'T');
			sublistTotaler.callbacks.fire('cust_sublist_unnumbered', 'custpage_pp_pc_checkbox', linenum);
		}
		
	}
	if(objArr.length > 0){
		numberer.addManyToNumber(objArr);
	}
	
}

function numberChecks(){
	/*
	var all_checked = [];
	var increment25 = [];
	
	for(var c in lists){
		var listCount = nlapiGetLineItemCount(lists[c]);
		for(var i = 1; i <= listCount; i++){
			var checked = nlapiGetLineItemValue(lists[c], "custpage_pp_pc_checkbox", i);
			if(checked == "T"){
				var internalidParts = nlapiGetLineItemValue(lists[c], "custpage_pp_pc_internalid", i);
				all_checked.push(internalidParts);
				if(all_checked.length == 25 || listCount == i){
					increment25.push(all_checked);
					all_checked = [];
				}
			}
		}
	}
	
	try{
		
		jQuery.fn.jbox({
			width:jQuery(window).width()/2,
			header:"Numbering Checks",
			content:"Please wait a moment while we number these checks for you!",
	        modalclickclose: false,
	        showCloseBtn: false
		});
		
		var done = [];
		for(var s = 0; s < increment25.length; s++){
			
			var accountid = nlapiGetFieldValue('custpage_account_select');
			var url = nlapiResolveURL('SUITELET', 'customscript_pp_sl_numberchecks', 'customdeploy_pp_sl_numberchecks');
			
			nlapiRequestURL(url, { 'ids': increment25[s], 'accountid': accountid }, null, function(d){
				var b = JSON.parse(d.getBody());
				if(b.success == "true"){
					done.push("");
				}					
				if(done.length == increment25.length){					
		            setWindowChanged(window, false);
					window.location.href = window.location.href;
				}
			});
		}
	}catch(e){
		$PPS.log(e);
	}
	*/
	//alert(JSON.stringify(all_checked));
}

function setCookie(c_name, value, exdays){
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value) + ((exdays==null) ? "" : "; expires=" + exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name){
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++){
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x=x.replace(/^\s+|\s+$/g,"");
		if (x==c_name){
			return unescape(y);
		}
	}
}


jQuery(function(){
	
	var pp = getCookie('presist_printer');
	if(pp != "" && nlapiSetFieldValue){
		try{
			nlapiSetFieldValue('custpage_printer_eslect', pp);
		}catch(e){}
	}
	
	jQuery(".custpage_payment_method").click(function(){
		var ths = jQuery(this);
		var id = ths.attr("href").replace("#", "").split(":");
		
		var t = '<div id="achconf" style="padding: 10px 15px">' +
		'<input type="radio" id="custpage_radio_payment_method_ach" name="custpage_radio_payment_method" value="ACH" '+ (ths.html() == "ACH" ? 'checked="checked"' : '') +' /> <label for="custpage_radio_payment_method_ach">ACH</label><br/>' +
		'<input type="radio" id="custpage_radio_payment_method_check" name="custpage_radio_payment_method" value="Check" '+ (ths.html() == "Check" ? 'checked="checked"' : '') +' /> <label for="custpage_radio_payment_method_check">Check</label><br/>' +
		'<!--POS <input type="radio" name="custpage_radio_payment_method" value="PosPay" '+ (ths.html() == "PosPay" ? 'checked="checked"' : '') +' />-->' + 
		'</div>';
		
		var win = new Ext.Window({
			html: t,
            layout:'fit',
            title: 'Select Payment Method',
            width:500,
            height:200,
            modal: true,
            plain: true,
            listeners: {
	            beforeshow: function(w){
	          
	            	jQuery('#' + w.id + ' input[name="custpage_radio_payment_method"]').click(function(){
		        		var val = jQuery(this).val();
		        		var _typeof = changeTypetotype(id[1]); 
		        		clearInterval(timeout);
		        		timeout = setTimeout(function(){
		        			
		        			var entityId = nlapiLookupField(_typeof, id[0], 'entity'); // 10 units
		        			if(!entityId){
		        				entityId = nlapiLookupField(_typeof, id[0], 'customer'); // 10 units
		        			}
		        			
		        			if(achEnabled(entityId)){
				        		if(val == "ACH"){
				        			try{
				        				var achAccountId = $PPS.ACH.getEntitiesPrimaryACHAccount(entityId,'Deposit')
				        				var paymentMethodList = $PPS.nlapiGetList('customrecord_pp_payment_methods');
					        			if(achAccountId){
					        				nlapiSubmitField(_typeof, id[0], ['custbody_pp_payment_method','custbody_pp_ach_account'], [paymentMethodList.getKey('ACH'),achAccountId]);
							        		ths.html('ACH');
					        			}
					        			else{
					        				alert('Could not convert the payment to ACH. The entity does not have a primary ACH Account.');
					        			}
				        			}
				        			catch(e){
				        				alert(e.message);
				        			}
				        			
					        		win.close();
				        		}
		        			}else{
		        				jQuery('#achconf').html("This account is not an ACH account.");
	        				}
	        				if(val == "Check"){
	        					try{
	        						var paymentMethodList = $PPS.nlapiGetList('customrecord_pp_payment_methods');
	        						nlapiSubmitField(_typeof, id[0], ['custbody_pp_payment_method','custbody_pp_ach_account'], [paymentMethodList.getKey('Check'),null]);
	        						ths.html('Check');
	        					}
	        					catch(e){
	        						console.log(e);
	        					}

			        			win.close();
			        		}
		        		}, 0);
		        	});
	            }
            },
            buttons: [{
                text: 'Close',
                handler: function(){
                    win.close();
                }
            }]
        });
		
		win.show();
	});	
});


/**
 * Check if entity has ACH enabled.
 * 
 * @param entityId {int} - The internalId of the entity
 * 		
 **/
function achEnabled(entityId){ // 20 units
	try{
		if(nlapiLookupField('entity', entityId, 'custentity_pp_ach_enabled') == 'T'){ // 10 units
			return true;
		}
		else{
			return false;
		}
		
	}catch(e){
		alert(e.message);
	}
	return false;
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
                checkAgain = false; //is this quite right?
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