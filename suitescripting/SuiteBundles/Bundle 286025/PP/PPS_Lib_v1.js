/**
 * @author Jason Foglia and Others
 * @version 1.1.0
 * @description Used for both Netsuite and Browser
 *
 * Version    Date          Author      Remarks
 * 2.11.0.20  01/29/2018    sdonald	    S19454 - User Preference Date Conversions (adding date format function: $PPS.formatNetSuiteDate)
 * 2.11.0.22  02/08/2018	sdonald     S20762 - Update the AFN bundle (not middleware) for 2018.1 sandbox change (Sandboxes refreshed after Jan 11 2018 
 *										         will be in the NetSuite production domain and not in the sandbox domain
 * 2.11.1     08 Dec 2017   johnr       S19112 Entity ACH Account Subsidiary: assign the ACH Account to a subsidiary  
 *                                      + add Server namespace
 *                                      + added $PPS.Server.getEntityType to return the entity's record type
 *                                      + added $PPS.Server.isMseEntity to identify multi-subsidiary enabled entities
 *                                      + added $PPS.Server.getRolesSubsidiaryIds to return a list of subsidiary ids for the given role
 *                                      + added $PPS.Server.getEntitySubsidiaries to return a list of subsidiaries for the given entity  
 * 2.11.1     15 Jan 2018   johnr       S19116 Entity ACH Account Subsidiary: 
 *                                      + restrict ACH Accounts by the user/role's subsidiaries in $PPS.ACH.getEntitiesACHAccounts
 * 2.12.0     08 Feb 2018   johnr		S20520: Enable multi-subsidiary customers and test ACH with them
 * 2.13.2	  06/11/2018    sdonald     S21049 - Allow APN payments to Canadian payees using US Dollars
 * 2.14.0     21 Jun 2018   johnr       S23730: Check to see if multisubsidiarycustomer is enabled for customers
 * 2.14.0     28 Jun 2018   johnr       S23663: Clean up & support client script
 * 2.16.0     27 Nov 2018   johnr       S27047: Remove the need for users to have the "set up company" permission on Production
 * 2.18.0     23 Apr 2019   johnr       S5997: Updated handling of error responses in $PPS.Transaction.sendVoidToExernalServer()
 * 2.18.0     14 Jun 2019   johnr       S31096: Remove "sandbox refreshed" functionality from bundle
 */


////// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 1) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}

/**
 * Remove duplicate items from array.
 * @param {Array} arr 
 * @returns {Array} new array with duplicates removed
 *  
 * @Note: Had to do this procedural instead of prototyping Array because
 * there are some for in loops used incorrectly throughout the code
 */
function array_unique(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        if (result.indexOf(arr[i]) == -1) {
            result.push(arr[i]);
        }
    }
    return result;
}

var br = '<br />';

$PPS = {};

$PPS.errors = [];
$PPS.errorHistory = 20;
$PPS.debug = false;
$PPS.where = '$PPS ';
$PPS.httpVerbs = { post: "POST", get: "GET", put: "PUT", del: "DELETE" };

// Helper for adding methods to the Object object
$PPS.DefineProp = function (prop, func) {
    if (!Object.prototype.hasOwnProperty(prop)){
	    try {
	        Object.defineProperty(Object.prototype, prop, { value: func, enumerable: false });
	    } catch (e) {
	        if (Object.prototype)
	        	Object.prototype[prop] = func;
	    }
    }
};

if (nlapiGetContext) {
    $PPS.context = nlapiGetContext;
    $PPS.company = $PPS.context().company;
    $PPS.getEnv = function () {
        try {
            var env = this.context().getEnvironment();
            this.company = this.context().getCompany();
            if (env === 'SANDBOX') {
                if (/_SB/.test(this.company))
                    return 'tst';
                return 'dev';
            }
            if (env === 'PRODUCTION') {
                if (/TST/.test(this.company))
                    return 'tst';
                return 'prd';
            }
        }
        catch (e) {
            $PPS.log(e);
            return false;
        }
    };
}

$PPS.NSRestReq = function (url, post, verb) {
    var where = "NSRestReq";

    var r = {
        url: url,
        error: "URL is empty or no nlapiRequestURL function can't be found.",
        httpcode: null,
        headers: null,
        httpbody: null,
        post: post,
        verb: verb,
        errornum: 0
    };

    if (!(url != "")){
        return r;
    } 
    if(!$PPS.isFunction(nlapiRequestURL)){
    	r.error = "Function nlapiRequestURL doesn't exist.";
    	r.errornum = 1;
        return r;
    }

    try {
        if (!verb){
            verb = $PPS.httpVerbs.get;
        }
        if (!post){
            verb = $PPS.httpVerbs.post;
        }
        var res = nlapiRequestURL(url,
                post,
                { 'Content-Type': 'application/json' },
                null,
                verb);	
        
        var arrHeaderNameList = res.getAllHeaders();
        var arrHeaders = {};
        for (var f in arrHeaderNameList){
            arrHeaders[arrHeaderNameList[f]] = res.getHeader(arrHeaderNameList[f]);
        }
        
        r.headers = arrHeaders;
        r.httpcode = res.getCode();
        if (arrHeaders['Content-Type'].toLowerCase() == 'application/json'){
            r.json = JSON.parse(res.getBody());
        }
        r.error = res.getError();
        r.httpbody = res.getBody();
        r.errornum = 2;

    } catch (e) {
        r.error = ( e instanceof nlobjError ) ? e.getDetails() : e.message;
        r.errornum = 3;
    }

    return r;
};

$PPS.NSScriptFilePath = function (name, subpath) {
    $PPS.where = "NSScriptFilePath";
    $PPS.log([name, subpath]);
    if (!name)
        return false;
    try {
        var _url = nlapiLoadFile("SuiteScripts/" + subpath + name);
        if (_url != "") {
            var url = _url.getURL();
            if (url != "")
                return url;
        }
    } catch (e) {
        console.error(e);
    }
    return false;
};

$PPS.log = function (what, where, type) {
    var ex;
    if ($PPS.debug && nlapiLogExecution) {
        try {
        	var _what = "";
            if ($PPS.isObject(what) || $PPS.isArray(what))
                _what = '<pre>' + JSON.stringify(what, null, "\t") + '</pre>';
            else
            	_what = what;
            nlapiLogExecution((type ? type : 'debug'), (where ? where : ($PPS.where ? $PPS.where : '')), (_what ? _what : ''));
        } catch (e) {
            ex = e;
        }
    } else
        if ($PPS.debug && window.console) {
            try {
                if (this.isObject(what) || this.isArray(what))
                    what = JSON.stringify(what, null, "\t");
                console.log(what);
            } catch (e) {
                ex = e;
            }
        }
    var error = {
        show: $PPS.debug,
        where: $PPS.where,
        what: what,
        type: type,
        e: null,
        error: 'Unknown error handling! Console & nlapiLogExecution don\'t exists.'
    };
    /*if ($PPS.errors.length > $PPS.errorHistory)
        $PPS.errors.shift();
    $PPS.errors.push(error);*/
    return error;
};

if (!window.console) {
    window.console = {
        log: function (d) {
            $PPS.log(d, 'debug');
        },
        error: function (d) {
            $PPS.log(d, 'error');
        },
        warn: function (d) {
            $PPS.log(d, 'audit');
        },
        debug: function (d) {
            $PPS.log(d, 'debug');
        }
    };
}

$PPS.validateEmail = function (email) {
    return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
};

$PPS.each = function (callback) {
    if (!$PPS.IsEmpty(this) && !$PPS.isArray(this))
        throw new TypeError();

    for (var i = 0; i < this.length; i++) {
        callback(i, this[i]);
    }
};
//Array.prototype.each = $PPS.each;

$PPS.parameterized = function (sep1, sep2) {
    if ($PPS.IsEmpty(this))
        throw new TypeError();

    if (!sep1)
        sep1 = "&";
    if (!sep2)
        sep2 = "=";
    var col = [];
    for (var i in this)
        if (!$PPS.isFunction(this[i]))
            col.push(i + sep2 + this[i]);
    return col.join(sep1);
};
//Array.prototype.parameterized = $PPS.parameterized;

$PPS.fulltrim = function () {
    if (this == null)
        throw new TypeError();
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
};
String.prototype.fulltrim = $PPS.fulltrim;

$PPS.stripNonDigits = function () {
    if (this == null)
        throw new TypeError();
    return this.replace(/\D/, "");
};
String.prototype.stripNonDigits = $PPS.stripNonDigits;

$PPS.FormatPhone = function () {
    if (this == null)
        throw new TypeError();
    return this.replace(/(\d{3})(\d{3})(\d{4})/, "($1)-$2-$3");
};
String.prototype.FormatPhone = Number.prototype.FormatPhone = $PPS.FormatPhone;

$PPS.contains = function (t, search) {
    if ($PPS.isObject(t))
        return t.hasOwnProperty(search);
    if ($PPS.isString(t) || $PPS.isArray(t))
        return t.indexOf(search) != -1;
};

$PPS.IsEmpty = function (v) {
    if (this.isNull(v) || this.isUndefined(v) || v == "")
        return true;
    return false;
};

$PPS.types = {
    '_string'		: "[object String]",
    '_number'		: "[object Number]",
    '_array'		: "[object Array]",
    '_object'		: "[object Object]",
    '_boolean'		: "[object Boolean]",
    '_date'			: "[object Date]",
    '_math'			: "[object Math]",
    '_global'		: "[object global]",
    '_null'			: "[object Null]",
    '_undefined'	: "[object Undefined]",
    '_function'		: "[object Function]",
    '_regexp'		: "[object RegExp]",
    '_javaobject'	: "[object JavaObject]"
};

$PPS.gettype = function (t) {
	return Object.prototype.toString.call(t);
};

$PPS.typeOf = function (t) {
	for(var i in $PPS.types){
		if ($PPS.gettype(t) === $PPS.types[i])
			return i.replace("_", ""); 
	}
};

$PPS.cap = function(t){
	var t1 = t.substr(0, 1).toUpperCase(); 
	var t2 = t.substr(1, t.length);
	return t1 + t2;
};

/*for(var i in $PPS.types){
	$PPS["is" + $PPS.cap(i.replace("_", ""))] = function(t){
		if (this.gettype(t) == $PPS.types[i])
	        return true;
	    return false;
	};
}*/


$PPS.isArray = function (t) {
    if (this.gettype(t) == this.types._array)
        return true;
    return false;
};
$PPS.isObject = function (t) {
    if (this.gettype(t) == this.types._object)
        return true;
    return false;
};
$PPS.isNumber = function (t) {
    if (this.gettype(t) == this.types._number)
        return true;
    return false;
};
$PPS.isBool = function (t) {
    if (this.gettype(t) == this.types._boolean)
        return true;
    return false;
};
$PPS.isString = function (t) {
    if (this.gettype(t) == this.types._string)
        return true;
    return false;
};
$PPS.isNull = function (t) {
    if (this.gettype(t) == this.types._null)
        return true;
    return false;
};
$PPS.isUndefined = function (t) {
    if (this.gettype(t) == this.types._undefined)
        return true;
    return false;
};
$PPS.isDate = function (t) {
    if (this.gettype(t) == this.types._date)
        return true;
    return false;
};
$PPS.isMath = function (t) {
    if (this.gettype(t) == this.types._math)
        return true;
    return false;
};
$PPS.isGlobal = function (t) {
    if (this.gettype(t) == this.types._global)
        return true;
    return false;
};
$PPS.isFunction = function (t) {
    if (this.gettype(t) == this.types._function)
        return true;
    return false;
};
$PPS.isRegExp = function (t) {
    if (this.gettype(t) == this.types._regexp)
        return true;
    return false;
};
$PPS.isJavaObject = function (t) {
    if (this.gettype(t) == this.types._javaobject)
        return true;
    return false;
};

$PPS.zeroPad = function (len) {
    if (this == null)
        throw new TypeError();
    var str = this.toString();
    if (len == null)
        len = 2;
    while (str.length < len) {
        str = '0' + str;
    }
    return str;
};
String.prototype.zeroPad = Number.prototype.zeroPad = $PPS.zeroPad;

$PPS.clone = function (a) {
	if(!$PPS.isArray(a) && !$PPS.isObject(a))
		return null;
	var newObj = $PPS.isArray(a) ? [] : {};
    for (var i in a)
        newObj[i] = a[i];
    return newObj;
};

$PPS.merge = function (obj1, obj2) {
    try {
        for (var prop in obj2) {
        	obj1[prop] = obj2[prop];
        }
    } catch (e) { $PPS.log(e); }
    return obj1;
};

$PPS.extend = function(){
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
};


/// IE is a problem child!!! It doesn't like adding properties to "Object", you could do it but the object has to be added to the dom. 
/* 
$PPS.DefineProp("clone", $PPS.clone);
$PPS.DefineProp("merge", $PPS.merge);
$PPS.DefineProp("contains", $PPS.contains);
*/

$PPS.meridian = function () {
    if (this == null)
        throw new TypeError();
    var mer = 'am';
    var hours = this.getHours();
    if (hours == 0)
        hours = 12;
    else if (hours == 12)
        mer = 'pm';
    else if (hours > 12) {
        hours -= 12;
        mer = 'pm';
    }
    return { hours: hours, meridian: mer };
};
Date.prototype.meridian = $PPS.meridian;

$PPS.simpledate = function () {
    if ($PPS.IsEmpty(this))
        throw new $PPS.EmptyArgumentException();
    var d = this;
    var date = {};
    date.month = d.getMonth() + 1;
    date.day = d.getDate();
    date.year = d.getFullYear();
    date.standardHours = d.meridian().hours;
    date.meridian = d.meridian().meridian;
    date.hours = d.getHours();
    date.minutes = d.getMinutes();
    date.seconds = d.getSeconds();
    return {
        dateTime:
			date.month.zeroPad() + '/' +
			date.day.zeroPad() + '/' +
			date.year.zeroPad() + ' ' +
			date.standardHours.zeroPad() + ':' +
			date.minutes.zeroPad() + ':' +
			date.seconds.zeroPad() + ' ' +
			date.meridian,
        dateNow:
			date.month.zeroPad() + '/' +
			date.day.zeroPad() + '/' +
			date.year.zeroPad(),
        date: date
    };
};
Date.prototype.simpledate = $PPS.simpledate;

$PPS.EmptyArgumentException = function (message) {
    this.message = "Argument is empty: " + message;
    this.name = "EmptyArgumentException";
};

$PPS.iframeContent = function(id,url){
	 var content = '<iframe src="' + url + '" id="'+id+'" frameborder="0" style="min-width:500px; min-height:400px; width:98%; height:500px; margin:0; border:0; padding:0"></iframe>';
	    content += '<![if IE]> <script type="text/javascript">';
	    content += 'jQuery(function(){ jQuery("#'+id+'").closest("table").css({width:"100%"}) });';
	    content += 'if(navigator.userAgent.indexOf("Trident/6.0") > -1 && document.documentMode == 5){jQuery("#'+id+'").css({width: "950px"})}';
	    content += '</script> <![endif]>';
	    return content;
};

/*
 * Wrapper for netsuite nlapiOutboundSSO
 * Adds the accountid and partner params to the nlapiOutboundSSO url
 */
$PPS.nlapiOutboundSSO = function(){
	var context = nlapiGetContext();
	var partner = '';
	
	switch(context.getEnvironment()){
	case 'SANDBOX':
		partner = 'NetSuiteSandbox';
		break;
	case 'BETA':
		partner = 'NetsuiteBeta';
		break;
	case 'PRODUCTION':
	default:
		partner = 'NetSuite';
		break;
	}

	/* S31096: Remove "sandbox refreshed" functionality from bundle
	// Sandbox accounts that are refreshed after Jan 11 2018 will no longer be in the sandbox domain. Just use the NetSuite system URLs (system.netsuite.com).
	if (context.getEnvironment().toUpperCase() == 'SANDBOX'){
		// S27047: Only check custscript_pp_sandbox_refresh from company preferences when in sandbox accounts
		var companyInfo = nlapiLoadConfiguration('companypreferences');
		if(companyInfo.getFieldValue('custscript_pp_sandbox_refresh') == 'T') {
			partner = 'NetSuite';
			nlapiLogExecution('DEBUG', 'partner', 'Sandbox refreshed - ' + companyInfo.getFieldValue('custscript_pp_sandbox_refresh'));
		}
	}
	*/
	var url = nlapiOutboundSSO('customsso_piracle_pay_services');
	url = url + '&accountid=' + context.getCompany() + '&partner=' + partner;
	return url;
};

$PPS.List = function(){
	var items = [];
	this.addItem = function(key,value){
		items.push({key : key, value : value});
	};
	
	this.getValue = function(key){
		for(var i = 0; i < items.length; i++){
			if(items[i].key == key){
				return items[i].value;
			}
		}
		return undefined;
	};
	this.getKey = function(value){
		for(var i = 0; i < items.length; i++){
			if(items[i].value == value){
				return items[i].key;
			}
		}
		return undefined;
	};
	
	this.getItems = function(){
		return items;
	};
	
	this.filter = function(test){
		var list = new $PPS.List;
		for (var i = 0; i < items.length; i++) {
		    if (test(items[i]))
		      list.addItem(items[i].key,items[i].value);
		}
		return list;
	};
	
	this.length = function(){
		return items.length;
	};
	
	this.forEach = function(action){
		for (var i = 0; i < items.length; i++) {
		    action(items[i],i);
		}
	};
};

// Cache lists in the store
$PPS._store = {};

$PPS.nlapiGetList = function(listId){
	if(listId in $PPS._store){
		return $PPS._store[listId];
	}
	var list = new $PPS.List;
	var columns = [new nlobjSearchColumn('name')];
	var searchResults = nlapiSearchRecord(listId,null,null,columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var result = searchResults[i];
			list.addItem(result.getId(),result.getValue('name'));
		}
	}
	$PPS._store[listId] = list;
	return list;
};

// wrapper for setting displayType that checks if the field exists
$PPS.setDisplayType = function(field,displayType){
	if(field){
		field.setDisplayType(displayType);
	}
};

$PPS.SublistManager = {
	sublistsIdx : 0
};

$PPS.SublistBuilder = function(config){

	var defaults = {
		title : "",
		id : "",
		addMarkAllButtons: false,
		/** Build filters that are used to filter results added to sublist
		 *  @returns Array of nlobjSearchFilter objects
		 */
		filters: function(){
			return [];
		},
		/** Run extra validation against a search result to see if it should be ommited from the sublist.
		 *  @param nlobjSearchResult sr
		 	@returns Boolean - true to add item to sublist, and false to omit it
		**/
		resultValidate: function(sr){
			return true;
		},
		recordType: "transaction"
	};
	
	config = $PPS.extend({},defaults,config);
	
	var helpers = {
		// builds columns that get passed to the setupUiSublist method
		buildColumns : function(fields){
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
			return common_col_fields;
		},
		// creates the nlobjSublist object using fields to add columns
		setupUiSublist : function(form, title, _fields, _listName, addMarkAllButtons) {
			if (!form) return null; // No form no go
			if (!title) title = "Sub list " + $PPS.SublistManager.sublistsIdx; // default title naming
			var listName = "cust_sublist_" + $PPS.SublistManager.sublistsIdx;
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
			
			if(addMarkAllButtons){
				sublist.addMarkAllButtons();// Add btn's for marking/unmarking all checkboxs
			}
			
			$PPS.SublistManager.sublistsIdx++;// increment sublist
			return sublist;
		},
		// Parse the results for the sublists - add each result to the sublist.
		parseResults : function(sublist, trans, condition) {
			var _in = 0;
			try{
				_in = sublist.getLineItemCount();
			}catch(e){ $PPS.log(e); }
				
			// Sublist line item index
			var inx = 1 + (_in < 0 ? 0 : _in);
			// Results line item index
			if (!$PPS.IsEmpty(trans)) {
				var itemsToAdd = [];
				for (var i in trans) {
					var sr = trans[i];
					if ($PPS.isJavaObject(sr)) {
						
						try {
							if (condition(sr)) { // callback method used to check which ever conditions are needed
								
								var __i = [];
								var rectype = $PPS.Transaction.convertToShortType(sr.getValue('type'));
								for (var k in fields) { // Work through the field object placing data and values where needed based on the fields object itself
									var fld = fields[k];
									var r = "";

									if (fld.hasOwnProperty('text') && 
										!fld.value && 
										fld.hasOwnProperty('record')){// By default check record in field - retrieve by using getText
										
										r = sr.getText(fld.record);
										
									}else if (fld.text == null && 
											!fld.value && 
											fld.hasOwnProperty('record')){// By default check record in field - retrieve by using getValue
										
										r = sr.getValue(fld.record);
										
									}else if (fld.hasOwnProperty('value')){// Use a default value
										
										r = fld.value;
										
									}
									
									
									if (fld.hasOwnProperty('format')){// if there is a reason to format the value do so
										r = fld.format(r, rectype, inx);
									}
								
									if(fld.hasOwnProperty('combine')){
										r = fld.combine._call(r, sr.getValue(fld.combine.fieldname), rectype, inx);
									}
									
									__i[fld.name] = r;
									
								}
								itemsToAdd.push(__i);
								inx++;
							}
							else {
								$PPS.log('cb fail');
							}
						} catch (e) {
							$PPS.log([e, ' index: ' + i, fields.checknum.record]);
						}
					}
				}
				 // setLineItenValues is much faster than adding items one at a time
				sublist.setLineItemValues(itemsToAdd);
				
			}

			return sublist;
		},
		// run the search
		getSearch: function(search, filters, columns) {
			var data = nlapiSearchRecord(
				search,
				null,
				filters,
				columns);

			return data;
		},
		// add the number of results to the title of the sublist
		setTitle: function(title, sublist) {
		    var cnt = sublist.getLineItemCount();
		    if ($PPS.context().getPreference('UNLAYEREDTABS') == "F"){
		        sublist.setLabel(title + ' - ' + (cnt < 0 ? 0 : cnt));
		    }
		}
	};
	
	var me = this;
	this.create = function(form,fields){
		this.sublist = helpers.setupUiSublist(form,config.title,fields,config.id,config.addMarkAllButtons);
		var searchResults = helpers.getSearch(config.recordType,config.filters(),helpers.buildColumns(fields));
		this.sublist = helpers.parseResults(this.sublist,searchResults,config.resultValidate);
		helpers.setTitle(config.title,this.sublist);
	};
	
	return this;
};


// add transaction namespace to PPS lib
$PPS.Transaction = {};
$PPS.Transaction.convertToShortType = function(t){
	switch (t) {
    case "Customer Refund":
    case "CustRfnd":
    case "customerrefund":
        return 'r';
        break;
    case "Check":
    case "check":
        return 'c';
        break;
    case "Vendor Payment":
    case "VendPymt":
    case "vendorpayment":
        return 'p';
        break;
    case "Customer Payment":
    case "CustPymt":
    case "customerpayment":
        return 'cp';
        break;
	}
};

$PPS.Transaction.convertToType = function(t){
	switch (t) {
    case "r":
    case "CustRfnd":
        return 'customerrefund';
        break;
    case "c":
    case "Check":
        return 'check';
        break;
    case "p":
    case "VendPymt":
        return 'vendorpayment';
        break;
    case "cp":
    case "CustPymt":
    	return 'customerpayment';
    	break;
	}
};

$PPS.Transaction.convertToSearchType = function(t){
	switch (t) {
    case "r":
    case "customerrefund": 
        return "CustRfnd";
        break;
    case "c":
    case "check":
        return 'Check';
        break;
    case "p":
    case "vendorpayment":
        return 'VendPymt';
        break;
    case "cp":
    case "customerpayment":
        return 'CustPymt';
        break;
	}
};

$PPS.Transaction.convertToTypeName = function(t){
	switch (t) {
    case "r":
    case "CustRfnd":
    case "customerrefund": 
        return 'Customer Refund';
        break;
    case "c":
    case "Check":
    case "check":
        return 'Check';
        break;
    case "p":
    case "VendPymt":
    case "vendorpayment":
        return 'Vendor Payment';
        break;
    case "cp":
    case "CustPymt":
    case "customerpayment":
        return 'Customer Payment';
        break;
}
};

/**
 * Sends a void API call to PPS or APN server. This method does checks to make sure that the corresponding void call should be made. 
 * 
 *  @param {String} tranId - The internalid of the transaction that has been voided
 */
$PPS.Transaction.sendVoidToExernalServer = function(tranId){
	
	// if voiding from Journal Entry then statusref will not be set to voided yet
	var searchResult = tranVoidSearch(tranId);
	
	//if(searchResult && (!checkStatusRef || searchResult[0].getValue('statusref') == 'voided') && searchResult[0].getValue('custbody_pp_is_printed') == 'T'){
	if(!searchResult){
		nlapiLogExecution('DEBUG','NO TRAN FOUND', 'No transaction found to void for transaction with internalid ' + tranId);
		return;
	}
	
	var sr = searchResult[0];
	if(sr.getText('custbody_pp_payment_method') == 'AvidPay Network' && nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_enable_apn_network') == 'T'){
		nlapiLogExecution('DEBUG', 'Voided Payment MethodAvidPay NetWork Payment','AvidPay NetWork Payment');
		if(!sr.getValue('custbody_pp_apn_payment_status').match(/^Void/i)){
			try{
				PPSLibAvidSuite.voidPayment(tranId,sr.getRecordType());
			}
			catch(e){
				nlapiLogExecution('ERROR','Error sending void',e.toString());
				nlapiLogExecution('ERROR',e.name,e.message);
			}
			
		}
	}
	else if(['ACH','Check'].indexOf(sr.getText('custbody_pp_payment_method')) > -1 && searchResult[0].getValue('custbody_pp_is_printed') == 'T'){
		
		var ppsObj = {};
		ppsObj.checkNumber = searchResult[0].getValue('tranid');
		ppsObj.checkDate = $PPS.formatNetSuiteDate(searchResult[0].getValue('trandate'));
		//result.amount = Math.abs(searchResult[0].getValue(amountField)).toFixed(2);
		ppsObj.accountId = searchResult[0].getValue('account');
		ppsObj.id = searchResult[0].getId();
		
		if(ppsObj){
			var url = $PPS.nlapiOutboundSSO();
			nlapiLogExecution('DEBUG', 'nlapiOutboundSSOUrl', url);
			url = $PPS.nlapiOutboundSSO();
			nlapiLogExecution('DEBUG', 'nlapiOutboundSSOUrl 2', url);
			var data = $PPS.NSRestReq(url, JSON.stringify(ppsObj), $PPS.httpVerbs.post);
			
		    if(data.httpcode != '200'){
		    	throw nlapiCreateError('PPS_VOID_ERR', 'There was an error sending a void request to the AvidXchange server. If you are using PosPay please edit and save this transaction to mark this transaction as voided in the Positive Pay log. ' + ' httpcode ' + data.httpcode, true);
		    	//nlapiLogExecution('ERROR', 'Error voiding transaction', 'httpcode ' + data.httpcode);
		    }
		    else if(data.error){
		    	throw nlapiCreateError('PPS_VOID_ERR', 'There was an error sending a void request to the AvidXchange server. If you are using PosPay please edit and save this transaction to mark this transaction as voided in the Positive Pay log. ' + 'Error: Server not responding.', true);
		    	//nlapiLogExecution('ERROR', 'Error voiding transaction', 'Error: Server not responding.');
		    }
		    else{
		    	var result = JSON.parse(data.httpbody);
		    	if(result.commandstatus != 'Success'){//'commandstatus' => 'Fail'
		    		// These are the commanderrmsg strings returned
		    		if((result.commanderrmsg=='An unexpected error occurred.')||(result.commanderrmsg=='Error creating void record')){
		    			// These errors indicate a problem with the database or internal connection on our servers
			    		//{'commanderrmsg' => 'An unexpected error occurred.'};		//message when checking for voided item
			    		//{'commanderrmsg' => 'Error creating void record' };		//message when cannot set record to void
				    	throw nlapiCreateError('PPS_VOID_ERR', 'An unexpected error occurred attempting to void the payment on the AvidXchange server. Please edit and save this transaction to mark this transaction as voided in the Positive Pay log.', true);
			    		//nlapiLogExecution('ERROR', 'Error voiding transaction', 'Server returned Fail status. ' + result.commanderrmsg);
		    		}else if(result.commanderrmsg=='Item not found'){
		    			// This error indicates a transaction is expected but not logged
			    		//{'commanderrmsg' => 'Item not found' };					//message when the payment is not found in the pospaylog
			    		//		'error_messages' => $vresult->messages_to_hash};	//message when one of the passed params is invalid
			    		nlapiLogExecution('ERROR', 'Error voiding transaction', 'Fail status: ' + result.commanderrmsg);
		    		}else if(result.commanderrmsg=='One or more fields is invalid or missing.'){
		    			// This error indicates a malformed request
			    		//{'commanderrmsg' => 'One or more fields is invalid or missing.', 
			    		//		'error_messages' => $vresult->messages_to_hash};	//message when one of the passed params is invalid
			    		nlapiLogExecution('DEBUG', 'Error in request to void transaction', 'Fail status: ' + result.commanderrmsg);
		    		}else{ 
		    			// These are not errors but rather status messages 
			    		//{'commanderrmsg' => 'No PosPay format set for account.'};	//message when a pospay format has not been selected for the account
			    		//{'commanderrmsg' => 'Item already logged as voided' };	//message when voided item is found
			    		//{'commanderrmsg' => 'Account no found'};					//message when the Account has not been setup in cacacnts 
			    		nlapiLogExecution('DEBUG', 'Did not void transaction', 'Fail status: ' + result.commanderrmsg);
		    		}
		    	}
		    }
		}
	}
	else{
		return;
	}
	
	
	function tranVoidSearch(tranId){
		
		/*var context = nlapiGetContext();
		
		var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
		var amountField = 'amount';
		if(multiCurrencyEnabled){
			amountField = 'fxamount';
		}*/
		
		var filters = [];
		var columns = [];
		
		filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
		filters.push(new nlobjSearchFilter('internalid',null,'anyof',[tranId]));
		filters.push(new nlobjSearchFilter('voided',null,'is','T'));
		
		columns.push(new nlobjSearchColumn('tranid'));
		columns.push(new nlobjSearchColumn('trandate'));
		columns.push(new nlobjSearchColumn('account'));
		columns.push(new nlobjSearchColumn('custbody_pp_is_printed'));
		columns.push(new nlobjSearchColumn('tranid'));
		columns.push(new nlobjSearchColumn('custbody_pp_apn_payment_status'));
		columns.push(new nlobjSearchColumn('custbody_pp_payment_method'));
		
		
		// columns.push(new nlobjSearchColumn('statusref')); statusref only gets set to voided when not using voided journal entries
		//columns.push(new nlobjSearchColumn(amountField));
		
		return nlapiSearchRecord('transaction', null, filters, columns);
	}
};

/**
 *  Calculates the default payment method settings for a payment and returns an object that helps
 *  create a payment method drop down. The paymentMethodsToFilterOut array should be used to remove
 *  invalid payment methods from a list of all payment methods.
 *  
 *  @param {String} entityId - The internalid of the entity the transaction is to
 *  @param {String} accountId - The internalid of the account the transaction is assigned to 
 *  @param {String} depositOrWithdrawal - Optional param defaults to 'deposit'
 *  
 *  
 *  Returns on object with:
 * 	{String} defaultPaymentMethod - The entities default payment method
 *  {Array}  paymentMethodsToFilterOut - List of payment methods not supported by the entity
 *  {String} primACHAcctId - If the payment method is ACH, this property will contain the id of the primary ACH account
 */
$PPS.Transaction.getEntityPaymentMethodSettings = function(entityId,accountId,depositOrWithdrawal){
	nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','enter');
	
	if(depositOrWithdrawal != 'Withdrawal'){
		depositOrWithdrawal = 'Deposit';
	}
	
	if(depositOrWithdrawal == 'Deposit'){
		nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','Deposit');
		var obj = {
				defaultPaymentMethod : 'Check',
				paymentMethodsToFilterOut : [],
				primACHAcctId : undefined
		};
		
		var accountFields = null;
		if(accountId){
			accountFields = nlapiLookupField('account', accountId, ['custrecord_pp_is_paypal_account','custrecord_pp_account_exclude','custrecord_pp_act_apn_enabled'], false);
		}
		
		if(!entityId){
			obj.paymentMethodsToFilterOut.push('PayPal');
			obj.paymentMethodsToFilterOut.push('ACH');
			obj.paymentMethodsToFilterOut.push('AvidPay Network');
			if(accountFields && accountFields.custrecord_pp_account_exclude == 'T'){
				obj.paymentMethodsToFilterOut.push('Check');
				obj.defaultPaymentMethod = 'Do Not Process With AvidXchange';
			}
			nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','return 1');
			return obj;
		}
		
		var lookupObj = nlapiLookupField('entity', entityId,['custentity_pp_ach_enabled','custentity_pp_paypal_enabled','custentity_pp_exclude_from_pp','custentity_pp_apn_enabled']);
		
		if((accountFields && accountFields.custrecord_pp_account_exclude == 'T') || lookupObj.custentity_pp_exclude_from_pp == 'T'){
			obj.paymentMethodsToFilterOut.push('PayPal');
			obj.paymentMethodsToFilterOut.push('ACH');
			obj.paymentMethodsToFilterOut.push('Check');
			obj.paymentMethodsToFilterOut.push('AvidPay Network');
			obj.defaultPaymentMethod = 'Do Not Process With AvidXchange';
			nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','return 2');
			return obj;
		}
		
		// ach enabled trumps paypal enabled
		if(lookupObj.custentity_pp_ach_enabled == 'T'){
			var primACHAcctId = $PPS.ACH.getEntitiesPrimaryACHAccount(entityId,'Deposit');
			if(primACHAcctId){
				obj.defaultPaymentMethod = 'ACH';
				obj.primACHAcctId = primACHAcctId;
			}
			else{
				obj.paymentMethodsToFilterOut.push('ACH');
			}
		}
		else{
			obj.paymentMethodsToFilterOut.push('ACH');
		}
		
		var paypalEnabled = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_enable_paypal_mp') == 'T';
		if(paypalEnabled && lookupObj.custentity_pp_paypal_enabled == 'T' && accountFields && accountFields.custrecord_pp_is_paypal_account == 'T'){
			obj.defaultPaymentMethod = 'PayPal';
		}
		else{
			obj.paymentMethodsToFilterOut.push('PayPal');
		}
		
		var apnNetworkEnabled = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_enable_apn_network') == 'T';
		if(apnNetworkEnabled && lookupObj.custentity_pp_apn_enabled == 'T' && accountFields && accountFields.custrecord_pp_act_apn_enabled == 'T'){
			obj.defaultPaymentMethod = 'AvidPay Network';
		}
		else{
			obj.paymentMethodsToFilterOut.push('AvidPay Network');
		}
		
		nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','return 3');
		return obj;
	}
	else{
		nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','Withdrawal');
		var obj = {
				defaultPaymentMethod : 'Do Not Process With AvidXchange',
				paymentMethodsToFilterOut : ['Check','PayPal','AvidPay Network'],
				primACHAcctId : undefined
		};
		
		// account needs to be excluded by default for customer payments since it is possible to
		// save them with no account associated with them
		var accountExcluded = true;
		if(accountId){
			accountExcluded = nlapiLookupField('account', accountId, 'custrecord_pp_account_exclude') == 'T';
		}
		
		if(!entityId || accountExcluded){
			obj.paymentMethodsToFilterOut.push('ACH');
			nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','return 4');
			return obj;
		}
		
		var lookupObj = nlapiLookupField('entity', entityId,['custentity_pp_ach_enabled','custentity_pp_exclude_from_pp']);
		// ach enabled trumps paypal enabled
		if(lookupObj.custentity_pp_ach_enabled == 'T'){
			var primACHAcctId = $PPS.ACH.getEntitiesPrimaryACHAccount(entityId,'Withdrawal');
			if(primACHAcctId){
				obj.defaultPaymentMethod = 'ACH';
				obj.primACHAcctId = primACHAcctId;
			}
			else{
				obj.paymentMethodsToFilterOut.push('ACH');
			}
		}
		else{
			obj.paymentMethodsToFilterOut.push('ACH');
		}
		nlapiLogExecution('DEBUG', '$PPS.Transaction.getEntityPaymentMethodSettings','return 5');
		return obj;
	}
};


$PPS.ACH = {};
$PPS.ACH.getEntitiesPrimaryACHAccount = function(entityId,depositOrWithdrawal){
	nlapiLogExecution('DEBUG', '$PPS.ACH.getEntitiesPrimaryACHAccount','enter');
	var filters = [];

	filters.push(new nlobjSearchFilter('custrecord_pp_ach_entity',null,'is',entityId));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_is_primary',null,'is','T'));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_deposit_withdrawal',null,'is',$PPS.nlapiGetList('customlist_pp_ach_deposit_withdrawal').getKey(depositOrWithdrawal)));

	var searchResults = nlapiSearchRecord('customrecord_pp_ach_account',null,filters,null);
	if(searchResults){
		nlapiLogExecution('DEBUG', '$PPS.ACH.getEntitiesPrimaryACHAccount','return subId = '+searchResults[0].getId());
		return searchResults[0].getId();
	}
	nlapiLogExecution('DEBUG', '$PPS.ACH.getEntitiesPrimaryACHAccount','return false');
	return false;
};

$PPS.ACH.getEntitiesACHAccounts = function(entityId,depositOrWithdrawal){
	nlapiLogExecution('DEBUG', '$PPS.ACH.getEntitiesACHAccounts','enter');
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_entity',null,'is',entityId));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_deposit_withdrawal',null,'is',$PPS.nlapiGetList('customlist_pp_ach_deposit_withdrawal').getKey(depositOrWithdrawal)));

	//[S19116] If a One World account, restrict ACH Accounts by the user/role's subsidiaries.
	var subsIds = $PPS.Server.getRoleSubsidiaries();
	if(subsIds.length > 0){
		filters.push(new nlobjSearchFilter('custrecord_pp_ach_subsidiaries',null,'anyof',subsIds));
		nlapiLogExecution('DEBUG', '$PPS.ACH.getEntitiesACHAccounts','restrict ACH Accounts by subsidiaries');
	}
	
	columns.push(new nlobjSearchColumn('name'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_is_primary'));
	
	var searchResults = nlapiSearchRecord('customrecord_pp_ach_account',null,filters,columns);
	nlapiLogExecution('DEBUG', '$PPS.ACH.getEntitiesACHAccounts','end');
	return searchResults;
};


$PPS.Session = {};
$PPS.Session.flashNamespace = 'pps.flash';
$PPS.Session.validFlashTypes = ['success','info','error','warning'];
/**
 * Write a flash message to the session object
 * 
 * @param type {string} - Valid strings are: success,info,error,warning
 * @param message {string} - The content of the message
 */
$PPS.Session.setFlash = function(type,message){
	if($PPS.Session.validFlashTypes.indexOf(type) == -1){
		throw nlapiCreateError('PP_INVALID_FLASH_TYPE', 'Must be a valid flash type', false);
	}
	
	var context = nlapiGetContext();
	context.setSessionObject(this.flashNamespace + '.' + type, message);
};

/**
 * Keep track of the number of messages added to the form to keep the message ids unique
 */
$PPS.messageFormCount = {
};

for(var i = 0; i < $PPS.Session.validFlashTypes.length; i++){
	$PPS.messageFormCount[$PPS.Session.validFlashTypes[i]] = 0;
}

/**
 * Adds a message dialog to a form
 * 
 * @param form {nlobjForm}
 * @param type {string} - The style of the message. Valid strings are: success,info,error,warning
 * @param message {string} - The content of the message
 */
$PPS.addMessageToForm = function(form,type,message){
	if($PPS.Session.validFlashTypes.indexOf(type) == -1){
		throw nlapiCreateError('PP_INVALID_FLASH_TYPE', 'Must be a valid flash type', false);
	}
	
	$PPS.messageFormCount[type] += 1;
	var messageField = form.addField('custpage_message_' + type + '_' + $PPS.messageFormCount[type], 'inlinehtml', null , null, null);
	messageField.setLayoutType('outsideabove','startrow');
	if(type == 'success'){
		messageField.setDefaultValue('<p style="border: 1px solid; margin:10px 0px; padding:8px 10px 8px 10px;' +
		         ' background-repeat: no-repeat; background-position: 10px center; color: #4F8A10;' +
		         ' background-color: #DFF2BF;">' + message + '</p>');
	}
	else if(type == 'error'){
		messageField.setDefaultValue('<p style="border: 1px solid; margin:10px 0px; padding:8px 10px 8px 10px;' +
		         ' background-repeat: no-repeat; background-position: 10px center; color: #8a1f11;' +
		         ' background-color: #fbe3e4;">' + message + '</p>');
	}
	else if(type == 'info'){
		messageField.setDefaultValue('<p style="border: 1px solid; margin:10px 0px; padding:8px 10px 8px 10px;' +
		         ' background-repeat: no-repeat; background-position: 10px center; color: #205791;' +
		         ' background-color: #d5edf8;">' + message + '</p>');
	}
	else if(type == 'warning'){
		messageField.setDefaultValue('<p style="border: 1px solid; margin:10px 0px; padding:8px 10px 8px 10px;' +
		         ' background-repeat: no-repeat; background-position: 10px center; color: #C8A316;' +
		         ' background-color: #fff6bf;">' + message + '</p>');
	}
};

/**
 * Write all flash messages to form
 * 
 * @param form {nlobjForm}
 */
$PPS.writeFlashMessagesToForm = function(form){
	var context = nlapiGetContext();
	var message = null;
	$PPS.Session.validFlashTypes.forEach(function(type){
		message = context.getSessionObject($PPS.Session.flashNamespace + '.' + type);
		if(message !== null){
			$PPS.addMessageToForm(form,type,message);
			context.setSessionObject($PPS.Session.flashNamespace + '.' + type,null);
		}
	});
};

/**
* Parses a multiline US address string into an object. Returns null
* if the address was not valid.
*
* @param {String} address
* @returns {Object} addressObject
*/
$PPS.parseMultilineAddress = function(address){
	if(typeof address != "string"){
		throw "Address must be a string";
	}
	
	// default address object
	var addrObject = {
		addressLines : [],
		city: null,
		state: null,
		zip: null,
		country: null
	};

	var zipLine = null;
	var line = '';
	
	// split on newline characters
	var addressArr = address.split(/\r?\n/g);

	// Find the city state zip line
	for(var i = addressArr.length - 1; i >= 0; i--){
		line = addressArr[i];
		line = line.trim(line);
		
		if(!zipLine){
			var res = parseCityStateZip(line);
			if(res){
				zipLine = i;
				addrObject.city = res.city;
				addrObject.state = res.state;
				addrObject.zip = res.zip;
				// if there was a line after this, check to see if it was country abbreviation
				if(zipLine + 1 == addressArr.length - 1){
					addrObject.country = addressArr[i+1].trim();
				}
			}
		}
		else{
			if(line.length > 0){
				addrObject.addressLines.unshift(line);
			}
		}
	}
	//address must have a valid city state zip line and have atleast 1 address line
	if(!zipLine || addressArr.length == 0){
		return null;
	}
	return addrObject;
	
	function parseCityStateZip(line){
		var cityStateZipObj = {
			city: null,
			state: null,
			zip: null
		};
		// test for a valid zip code at the end of the line
		var res = line.match(/\d{5}(?:[-\s]\d{4})?$/);
		
		// if US zip codes do not not match, check for Canadian zip codes
		if (!res) {
          res = line.match(/(\s|^)[A-Za-z]\d[A-Za-z]\s+\d[A-Za-z]\d$/);
        }
		
		if(res){
			var zip = res[0].trim();
			var city = '';
			var state = '';
			
			// parse out state and city into string
			var cityStateStr = line.substring(0,line.length - zip.length);
			cityStateStr = cityStateStr.trim();
			
			// Try 1: try to split on comma
			var cityStateParts = cityStateStr.split(',');
			if(cityStateParts.length > 1){
				city = cityStateParts[0].trim();
				state = cityStateParts[1].trim();
				return {city:city, state:state, zip:zip};
			}
			
			// Try 2: break apart by a 2 letter state abbreviation
			var st = cityStateStr.match(/ [a-zA-Z][a-zA-Z]$/);
			if(st){
				state = st[0].trim();
				city = cityStateStr.substring(0,cityStateStr.length - st[0].length).trim();
				return {city:city, state:state, zip:zip};
			}
		}
		return null;
	}
};


$PPS.getTemplate = function(filename){
	var filters = [];
	
	filters.push(new nlobjSearchFilter('name',null,'is',filename));
	var sr = nlapiSearchRecord('file',null,filters,null);
	if(sr){
		var f = nlapiLoadFile(sr[0].getId());
		return f.getValue();
	}
	return null;
};

$PPS.logException = function(e,logLevel){
	var errorName = '';
	var errorMessage = '';
	var ll = logLevel || 'error';
	
	if(typeof e == 'string'){
		errorName = 'error';
		errorMessage = e;
	}
	else if(typeof e == 'object'){
		if(e.hasOwnProperty('name') && e.hasOwnProperty('message')){
			errorName = e.name;
			errorMessage = e.message;
		}
		else{
			errorName = 'error';
			errorMessage = e.toString();
		}
	}
	else{
		throw "Unexpected exception type passed to logException";
	}
	nlapiLogExecution(ll, errorName, errorMessage);
};

$PPS.buildAccountSelectOptions = function(accountField,selectedAccountId,extraFilters){
	nlapiLogExecution('DEBUG', '$PPS.buildAccountSelectOptions','enter');
	var context = nlapiGetContext();
	var subsidiaryIds = [];
	
	var currentRole = context.getRole();
	var isAdmin = (currentRole == 3);
	
	if(context.getFeature('SUBSIDIARIES') && !isAdmin){
		
		// Try to hit clienthelper to get list of subsidiaries
		try{
			subsidiaryIds = $PPS.getSubsidiaryIds(currentRole);
		}
		catch(e){
			//Couldn't get subsidiaryIds
			$PPS.logException(e, 'ERROR');
		}
		subsidiaryIds.push(context.getSubsidiary());
		
	}
	

    var columns = [],
	filters = [];
	
    columns.push(new nlobjSearchColumn('name'));
    if(context.getFeature('SUBSIDIARIES') && !isAdmin){
    	filters.push(new nlobjSearchFilter('subsidiary',null,'anyof',subsidiaryIds));
    }
	
    filters.push(new nlobjSearchFilter('type', null, 'is', 'Bank'));
    filters.push(new nlobjSearchFilter('custrecord_pp_account_exclude',null,'is','F'));
    if(extraFilters){
    	filters.concat(extraFilters);
    }
    
    	
    var search = nlapiCreateSearch('account',filters,columns);
	var resultSet = search.runSearch();
	var i = 0;
	resultSet.forEachResult(function(searchResult){
		accountField.addSelectOption(searchResult.getId(), searchResult.getValue('name'), selectedAccountId == searchResult.getId());
		i++;
		return i < 4000; // return true to keep iterating
	});

	nlapiLogExecution('DEBUG', '$PPS.buildAccountSelectOptions','end');
    return accountField;
	
};

/*
 * Get a array of subsidiaryIds from the public clienthelper. Throws error on failure.
 */
$PPS.getSubsidiaryIds = function(roleId){
	var context = nlapiGetContext();
    if (context.getExecutionContext() == 'suitelet') { //only runs if the script is a suitelet, as the nlapiCreateForm will not function in other contexts.
        var subsidiaryIds = $PPS.getSubsidiaryIdsSuite(roleId);
        return subsidiaryIds;
    } else {
    	var rh = {cookie: request.getHeader('Cookie')};
    	rh['Content-Type'] = 'application/json';
    	// assume we are in a suitelet and request is global
    	var url = request.getURL().match(/^.+?[^\/:](?=[?\/]|$)/) + nlapiResolveURL('SUITELET','customscript_pp_sl_clienthelper','customdeploy_pp_sl_clienthelper_pub');
    	url += '&action=getRolesSubsidiaryIds';
    	
    	
    	var resp = nlapiRequestURL(url,JSON.stringify({roleId: roleId}),rh,'POST');
    	

    	if(resp.getCode() == '200'){
    		var respJSON = JSON.parse(resp.getBody());
    		return subsidiaryIds = respJSON.subsidiaryIds;
    	}
    	else{
    		throw nlapiCreateError('PP_RESP_CODE_NOT_200','Expected response code 200, got ' + resp.getCode());
    	}
	}
};

$PPS.getSubsidiaryIdsSuite = function(roleId) {
    var form = nlapiCreateForm('getSubsidiaries');
    var subsidField = form.addField('custpage_subsidiary', 'select', 'Subsidiary', 'subsidiary');
    var subsidOptions = subsidField.getSelectOptions();
    var subsidiaryIds = [];
    for (var a = 0; a<subsidOptions.length; a++) {
        subsidiaryIds.push(subsidOptions[a].getId());
    }   
    nlapiLogExecution('debug', 'subsidiaryIds', subsidiaryIds.toString());
    return subsidiaryIds;
}

//add Server namespace to PPS lib
$PPS.Server = {};

/**
* Get the entity type {vendor, customer, employee, etc.}
* 
 * @returns recordType
*/
$PPS.Server.getEntityType = function(entityId){
	// S19112 added getEntityType to return the entity's record type 
	nlapiLogExecution('DEBUG', '$PPS.Server.getEntityType');
	var filters = [];

	filters.push(new nlobjSearchFilter('internalid',null,'anyof',[entityId]));
	var searchResults = nlapiSearchRecord('entity', null, filters, null);
	if(searchResults){
		return searchResults[0].recordType;
	}
	return null;
};

/**
* Return true if entity can have secondary subsidiaries 
* - as of 2017.2, vendors
* - as of 2018.1, vendors & customers
* @param entityId - The entityId of the current record
* @returns Boolean - true if entity can have secondary subsidiaries
*/
$PPS.Server.isMseEntity = function(entityId){
	// S19112 added isMseEntity to identify multi-subsidiary enabled entities 
	nlapiLogExecution('DEBUG', '$PPS.Server.isMseEntity');
	var context = nlapiGetContext();
	var nsVersion = context.getVersion();
	var subsidiariesEnabled = context.getFeature('SUBSIDIARIES');
	var entType = $PPS.Server.getEntityType(entityId);
	//S20520: Enable multi-subsidiary customers
	//[S23730] customers are only MSE when Multi-Subsidiary Customer is enabled 
	var multiSubsidiaryCustomer = context.getFeature('MULTISUBSIDIARYCUSTOMER');
	var isMSE = (subsidiariesEnabled && (entType == 'vendor' || (entType == 'customer' && multiSubsidiaryCustomer)));
	nlapiLogExecution('DEBUG', '$PPS.Server.isMseEntity', 'isMSE = '+isMSE+' = (subsidiariesEnabled='+subsidiariesEnabled+', entityType='+entType+', nsVersion='+nsVersion+', multiSubsidiaryCustomer='+multiSubsidiaryCustomer+')');
	return (isMSE);
};

/**
* Return an array of the subsidiary ids for the given role
* 
 * @param roleId - The entityId of the current record
* @returns array - list of subsidiary ids
*/
$PPS.Server.getRolesSubsidiaryIds = function(roleId){
	// S19112 added getRolesSubsidiaryIds to return a list of subsidiary ids for the given role 
	nlapiLogExecution('DEBUG', '$PPS.Server.getRolesSubsidiaryIds','enter');
	var filters = [['internalid','is',roleId]];
	var columns = [new nlobjSearchColumn('subsidiaries')];
	var subsidiaryIds = [];
	// [S16735] Put the search in a try-catch block so we handle any errors, the most likely being, "Permission Violation: You need the 'Bulk Manage Roles' permission to access this page. Please contact your account administrator." 
	try{
		var searchResults = nlapiSearchRecord('Role',null,filters,columns);
		if(searchResults){
			for(var i = 0; i < searchResults.length; i++){
				var subId = searchResults[i].getValue('subsidiaries');
				if(subId || subId === 0){
					nlapiLogExecution('DEBUG', '$PPS.Server.getRolesSubsidiaryIds','subId = '+subId);
					subsidiaryIds.push(subId);
				}
			}
		}else{
			nlapiLogExecution('DEBUG', '$PPS.Server.getRolesSubsidiaryIds','no subsidiaries found for the role '+roleId);
		}
	}
	catch(e){
		//Couldn't get subsidiaryIds
		$PPS.logException(e, 'ERROR');
	}
	nlapiLogExecution('DEBUG', '$PPS.Server.getRolesSubsidiaryIds','end');
	return subsidiaryIds;
};

/**
 * Creates and array of the ACH subsidiaries for an entity 
 * 
 * @param entityId - The entityId of the current record
 * @returns array - an array of all subsidiaries for and entity
 */
$PPS.Server.getEntitySubsidiaries = function(entityId){
	nlapiLogExecution('DEBUG', '$PPS.Server.getEntitySubsidiaries','enter');
	// S19112 added getEntitySubsidiaries to return a list of subsidiaries for the given entity 
	// fill the subsidiary copy field with valid subsidiaries for the entity
	var filters = [];				// create a search filter for the entity 
	var columns = [];			// create search result columns
	var entitySubsidiaries = [];		// array of subsidiaries for the entityId
	var searchResults = null;
	if($PPS.Server.isMseEntity(entityId)){
		// [S16735] Let Netsuite restrict the ACH Account records this user/role sees based on the "Apply Role Restrictions" setting on the Subsidiary field in the Avid ACH Account record
		// only show subsidiaries valid for this role 
		var subsidiaryIds = $PPS.Server.getRoleSubsidiaries();
		nlapiLogExecution('debug', '$PPS.Server.getEntitySubsidiaries : getRoleSubsidiaries', subsidiaryIds.toString());

		// get the primary and secondary subsidiaries for the vendor -- only available for vendors  in NS 2017.2 or later  
		filters.push(new nlobjSearchFilter('internalid',null,'is',entityId));
		// [S23663] don't include inactive subsidiaries
		filters.push(new nlobjSearchFilter('isinactive','msesubsidiary','is','F'));
		
	  	columns.push(new nlobjSearchColumn('internalid'));
	  	// the msesubsidiary link is only valid for vendors in NS 2017.2, it contains all subsidiaries the vendor is assigned to.
	  	columns.push(new nlobjSearchColumn('internalid','msesubsidiary',null));
	  	columns.push(new nlobjSearchColumn('name','msesubsidiary',null));
	  	columns.push(new nlobjSearchColumn('parent','msesubsidiary',null));
	  	columns.push(new nlobjSearchColumn('primary','msesubsidiary',null));
	  	//[S20520] search the entity for its subsidiaries; in NS 2018.1 customers became MSE
	  	var entType = $PPS.Server.getEntityType(entityId);
	  	searchResults = nlapiSearchRecord(entType, null, filters, columns);
		for(var i = 0; searchResults != null && i < searchResults.length; i++){
			var searchResult = searchResults[i];
			var mseSubsidiary = searchResult.getValue('internalid','msesubsidiary',null);
			// [S16735] Let Netsuite restrict the ACH Account records this user/role sees based on the "Apply Role Restrictions" setting on the Subsidiary field in the Avid ACH Account record
			var mseSubsidiaryName = searchResult.getValue('name','msesubsidiary',null);
			var mseSubsidiaryParent = searchResult.getValue('parent','msesubsidiary',null);
			var mseSubsidiaryPrimary = searchResult.getValue('primary','msesubsidiary',null);
			// add the subsidiary, select it if it is the primary
			entitySubsidiaries.push( {id : mseSubsidiary, name : mseSubsidiaryName, primary : mseSubsidiaryPrimary, parent : mseSubsidiaryParent} );
			nlapiLogExecution('debug', '$PPS.Server.getEntitySubsidiaries','msesubsidiary'+'('+mseSubsidiary+','+mseSubsidiaryName+','+mseSubsidiaryPrimary+','+mseSubsidiaryParent+')');
		}
	}else{
		// if not an MSE entity, just add the primary for this entity
		var entityPrimarySubsidiary = nlapiLookupField('entity', entityId, 'subsidiary');
		// get the primary subsidiary name
		filters.push(new nlobjSearchFilter('internalid',null,'is',entityPrimarySubsidiary));
		// [S23663] don't include inactive subsidiaries
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	  	columns.push(new nlobjSearchColumn('name'));
		searchResults = nlapiSearchRecord('subsidiary', null, filters, columns);
		if(searchResults){
			var subsidiaryName = searchResults[0].getValue('name');
			nlapiLogExecution('DEBUG', '$PPS.Server.getEntitySubsidiaries : primary subsidiary', entityPrimarySubsidiary+'='+subsidiaryName);
			entitySubsidiaries.push( {id : entityPrimarySubsidiary, name : subsidiaryName, primary : true} );
		}
	}
	return  entitySubsidiaries;
};

/**
 * Creates and array of the ACH subsidiaries for the curent role 
 * 
 * @returns array - an array of all subsidiaries for a role
 */
$PPS.Server.getRoleSubsidiaries = function (){
	//S19112 added getRoleSubsidiaries to get a list of the subsidiaries for the current role
	// this code was copied from buildAccountSelectOptions() in PPS_Lib_v1.js 
	nlapiLogExecution('DEBUG', '$PPS.Server.getRoleSubsidiaries','enter');
	var context = nlapiGetContext();
	var subsidiaryIds = [];
	
	var currentRole = context.getRole();
	var isAdmin = (currentRole == 3);
	
	if(context.getFeature('SUBSIDIARIES') && !isAdmin){
		try{
			// [S19025] Try to hit clienthelper to get list of subsidiaries to get around users w/o Bulk Manage Role permissions
			subsidiaryIds = $PPS.getSubsidiaryIds(currentRole);
		}
		catch(e){
			//Couldn't get subsidiaryIds
			$PPS.logException(e, 'ERROR');
		}
		if (subsidiaryIds.length < 1){
			nlapiLogExecution('debug', '$PPS.Server.getRoleSubsidiaries', 'Role has no subsidiaries, using context');
			subsidiaryIds.push(context.getSubsidiary());
		}
	}
	nlapiLogExecution('DEBUG', '$PPS.Server.getRoleSubsidiaries','return');
	return subsidiaryIds;
};

$PPS.formatNetSuiteDate = function(date) {
	var netSuiteDate = nlapiStringToDate(date);
	var day = netSuiteDate.getDate();
	var month = netSuiteDate.getUTCMonth() + 1;
	var year = netSuiteDate.getFullYear();
	var formattedDate = month + '/' + day + '/' + year;
	return formattedDate;
}