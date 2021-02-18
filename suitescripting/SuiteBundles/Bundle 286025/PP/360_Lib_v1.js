/**
 * @author Jason Foglia and Others
 * @version 1.1.0
 * @description Used for both Netsuite and Browser
*/
;


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
    }
}

var br = '<br />';

$360 = {};

$360.errors = [];
$360.errorHistory = 20;
$360.debug = false;
$360.where = '$360 ';
$360.httpVerbs = { post: "POST", get: "GET", put: "PUT", del: "DELETE" };

// Helper for adding methods to the Object object
$360.DefineProp = function (prop, func) {
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
    $360.context = nlapiGetContext;
    $360.company = $360.context().company;
    $360.getEnv = function () {
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
            $360.log(e);
            return false;
        }
    };
}

$360.NSRestReq = function (url, post, verb) {
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
    if(!$360.isFunction(nlapiRequestURL)){
    	r.error = "Function nlapiRequestURL doesn't exist.";
    	r.errornum = 1;
        return r;
    }

    try {
        if (!verb){
            verb = $360.httpVerbs.get;
        }
        if (!post){
            verb = $360.httpVerbs.post;
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

$360.NSScriptFilePath = function (name, subpath) {
    $360.where = "NSScriptFilePath";
    $360.log([name, subpath]);
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

$360.log = function (what, where, type) {
    var ex;
    if ($360.debug && nlapiLogExecution) {
        try {
        	var _what = "";
            if ($360.isObject(what) || $360.isArray(what))
                _what = '<pre>' + JSON.stringify(what, null, "\t") + '</pre>';
            else
            	_what = what;
            nlapiLogExecution((type ? type : 'debug'), (where ? where : ($360.where ? $360.where : '')), (_what ? _what : ''));
        } catch (e) {
            ex = e;
        }
    } else
        if ($360.debug && window.console) {
            try {
                if (this.isObject(what) || this.isArray(what))
                    what = JSON.stringify(what, null, "\t");
                console.log(what);
            } catch (e) {
                ex = e;
            }
        }
    var error = {
        show: $360.debug,
        where: $360.where,
        what: what,
        type: type,
        e: null,
        error: 'Unknown error handling! Console & nlapiLogExecution don\'t exists.'
    };
    /*if ($360.errors.length > $360.errorHistory)
        $360.errors.shift();
    $360.errors.push(error);*/
    return error;
};

if (!window.console) {
    window.console = {
        log: function (d) {
            $360.log(d, 'debug');
        },
        error: function (d) {
            $360.log(d, 'error');
        },
        warn: function (d) {
            $360.log(d, 'audit');
        },
        debug: function (d) {
            $360.log(d, 'debug');
        }
    };
}

$360.validateEmail = function (email) {
    return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
};

$360.each = function (callback) {
    if (!$360.IsEmpty(this) && !$360.isArray(this))
        throw new TypeError();

    for (var i = 0; i < this.length; i++) {
        callback(i, this[i]);
    }
};
//Array.prototype.each = $360.each;

$360.parameterized = function (sep1, sep2) {
    if ($360.IsEmpty(this))
        throw new TypeError();

    if (!sep1)
        sep1 = "&";
    if (!sep2)
        sep2 = "=";
    var col = [];
    for (var i in this)
        if (!$360.isFunction(this[i]))
            col.push(i + sep2 + this[i]);
    return col.join(sep1);
};
//Array.prototype.parameterized = $360.parameterized;

$360.fulltrim = function () {
    if (this == null)
        throw new TypeError();
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
};
String.prototype.fulltrim = $360.fulltrim;

$360.stripNonDigits = function () {
    if (this == null)
        throw new TypeError();
    return this.replace(/\D/, "");
};
String.prototype.stripNonDigits = $360.stripNonDigits;

$360.FormatPhone = function () {
    if (this == null)
        throw new TypeError();
    return this.replace(/(\d{3})(\d{3})(\d{4})/, "($1)-$2-$3");
};
String.prototype.FormatPhone = Number.prototype.FormatPhone = $360.FormatPhone;

$360.contains = function (t, search) {
    if ($360.isObject(t))
        return t.hasOwnProperty(search);
    if ($360.isString(t) || $360.isArray(t))
        return t.indexOf(search) != -1;
};

$360.IsEmpty = function (v) {
    if (this.isNull(v) || this.isUndefined(v) || v == "")
        return true;
    return false;
};

$360.types = {
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

$360.gettype = function (t) {
	return Object.prototype.toString.call(t);
};

$360.typeOf = function (t) {
	for(var i in $360.types){
		if ($360.gettype(t) === $360.types[i])
			return i.replace("_", ""); 
	}
};

$360.cap = function(t){
	var t1 = t.substr(0, 1).toUpperCase(); 
	var t2 = t.substr(1, t.length);
	return t1 + t2;
};

/*for(var i in $360.types){
	$360["is" + $360.cap(i.replace("_", ""))] = function(t){
		if (this.gettype(t) == $360.types[i])
	        return true;
	    return false;
	};
}*/


$360.isArray = function (t) {
    if (this.gettype(t) == this.types._array)
        return true;
    return false;
};
$360.isObject = function (t) {
    if (this.gettype(t) == this.types._object)
        return true;
    return false;
};
$360.isNumber = function (t) {
    if (this.gettype(t) == this.types._number)
        return true;
    return false;
};
$360.isBool = function (t) {
    if (this.gettype(t) == this.types._boolean)
        return true;
    return false;
};
$360.isString = function (t) {
    if (this.gettype(t) == this.types._string)
        return true;
    return false;
};
$360.isNull = function (t) {
    if (this.gettype(t) == this.types._null)
        return true;
    return false;
};
$360.isUndefined = function (t) {
    if (this.gettype(t) == this.types._undefined)
        return true;
    return false;
};
$360.isDate = function (t) {
    if (this.gettype(t) == this.types._date)
        return true;
    return false;
};
$360.isMath = function (t) {
    if (this.gettype(t) == this.types._math)
        return true;
    return false;
};
$360.isGlobal = function (t) {
    if (this.gettype(t) == this.types._global)
        return true;
    return false;
};
$360.isFunction = function (t) {
    if (this.gettype(t) == this.types._function)
        return true;
    return false;
};
$360.isRegExp = function (t) {
    if (this.gettype(t) == this.types._regexp)
        return true;
    return false;
};
$360.isJavaObject = function (t) {
    if (this.gettype(t) == this.types._javaobject)
        return true;
    return false;
};

$360.zeroPad = function (len) {
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
String.prototype.zeroPad = Number.prototype.zeroPad = $360.zeroPad;

$360.clone = function (a) {
	if(!$360.isArray(a) && !$360.isObject(a))
		return null;
	var newObj = $360.isArray(a) ? [] : {};
    for (var i in a)
        newObj[i] = a[i];
    return newObj;
};

$360.merge = function (obj1, obj2) {
    try {
        for (var prop in obj2) {
        	obj1[prop] = obj2[prop];
        }
    } catch (e) { $360.log(e); }
    return obj1;
};


/// IE is a problem child!!! It doesn't like adding properties to "Object", you could do it but the object has to be added to the dom. 
/* 
$360.DefineProp("clone", $360.clone);
$360.DefineProp("merge", $360.merge);
$360.DefineProp("contains", $360.contains);
*/

$360.meridian = function () {
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
Date.prototype.meridian = $360.meridian;

$360.simpledate = function () {
    if ($360.IsEmpty(this))
        throw new $360.EmptyArgumentException();
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
Date.prototype.simpledate = $360.simpledate;

$360.EmptyArgumentException = function (message) {
    this.message = "Argument is empty: " + message;
    this.name = "EmptyArgumentException";
};
