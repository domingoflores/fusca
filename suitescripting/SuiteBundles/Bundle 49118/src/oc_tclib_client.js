/**
 * @author tcaguioa
 *
 *
 *
 *
 */
/**
 * Hi all, As you probably know, UI code refactoring is currently going on in
 * order to enable mobile view of records in our upcoming iPhone app. As a part
 * of this refactoring we had to make a few changes to the internal UI api used
 * by other developer teams. In particular, the following javascript variables
 * and functions are no longer supported: - window.ischanged - window.isvalid -
 * window.isinited and window.setIsInited() The variables were encapsulated in a
 * new NS.form javascript object that is defined in NLUtil.jsp. To access them
 * please use the following methods: - NS.form.setChanged(boolean) and
 * NS.form.isChanged() - NS.form.setValid(boolean) and NS.form.isValid() -
 * NS.form.setInited(boolean) and NS.form.isInited() In case you need to change
 * the state of parent window, it is possible prepend the calls with �parent.�
 * or �opener.� prefixes (e.g., parent.NS.form.setInited(true)). The main motive
 * for this change is to be able to perform actions in response to the change of
 * these attributes in the mobile app. IMPORTANT: All occurrences of the
 * deprecated variables in ML and NetLedger_Release_George were replaced. Please
 * check you feature branches and update them appropriately. Please let me or
 * the UI team know if you have any questions or comments regarding this change.
 * Thanks, Ondrej
 */
if (typeof NS == 'undefined') {
    NS = {};
    NS.form = {};
    NS.form.setChanged = function(bool) {
        window.ischanged = bool;
    };

    NS.form.isChanged = function(bool) {
        return window.ischanged;
    };
}

function foo(returnValue) {
    alert('foo() ' + JSON.stringify(returnValue));
}

function ocGetParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results === null) {
        return "";
    }

    else {
        return decodeURIComponent(results[1].replace(/\+/g, " "));
    }

}

/**
 * Add indexOf() for Array object since not all browsers support it
 */
function ocAddIndexOfFunction() {
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) {
                    return i;
                }
            }
            return -1;
        };
    }
}
ocAddIndexOfFunction();

/**
 * Gets the visible height of the browser body
 */
function ocGetInnerHeight() {
    var myHeight = 0;
    if (typeof (window.innerWidth) == 'number') {
        // Non-IE
        // myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        // IE 6+ in 'standards compliant mode'
        // myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        // IE 4 compatible
        // myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    // window.alert( 'Width = ' + myWidth );
    // window.alert( 'Height = ' + myHeight );
    return myHeight;
}

function ocTemplateApply(tmpId, rows) {
    var templateHTML = document.getElementById(tmpId).innerHTML;
    if (Ext.isIE) {
        templateHTML = templateHTML.replace('/*', '');
        templateHTML = templateHTML.replace('*/', '');
    }
    var xTemplate = new Ext.XTemplate('<tpl for=".">' + templateHTML + '</tpl>');
    return xTemplate.apply(rows);
}

function ocTemplateAppend(tmpId, targetId, data) {
    var tmpPost = document.getElementById(tmpId).innerHTML;
    // it seems IE removes CSS entries on an inline style when the value is
    // invalid.
    // so we needed to use data-style instead of style in the template and then
    // here we replace them
    tmpPost = tmpPost.replace(/data-style/g, 'style');
    var myTplPost = new Ext.XTemplate('<tpl for=".">' + tmpPost + '</tpl>');
    myTplPost.append(document.getElementById(targetId), data, false);
}

function addTrimFunctions() {

    // add trim functions if browser has no support
    if (typeof String.trim == 'undefined') {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, "");
        };
    }

    if (typeof String.ltrim == 'undefined') {
        String.prototype.ltrim = function() {
            return this.replace(/^\s+/, "");
        };
    }

    if (typeof String.rtrim == 'undefined') {
        String.prototype.rtrim = function() {
            return this.replace(/\s+$/, "");
        };
    }
}

addTrimFunctions();

/**
 * Hides the New option in a select field
 */
function ocHideNewInOptionList() {
    var logger = new ocobjLogger('ocHideNewInOptionList', true);
    // S3 Issue 240819 : [SuiteSocial] the option -New- should be hidden even in
    // other languages
    // drop down item
    var els = document.getElementsByTagName('div');
    for (var i = 0; i < els.length; i++) {
        var text = els[i].innerHTML;
        if (text.length < 2) {
            continue;
        }
        // for the 'New' options, it is in the format '- New -' where the New
        // changes per language
        if (text.substr(0, 2) == '- ') {
            els[i].style.display = 'none';
        }
    }
    logger.log('DONE');
}

function ocHandleResponse(xmlRequest) {
    // alert('ocHandleResponse');
    // alert('ocHandleResponse ' + xmlRequest.responseText);
    if (xmlRequest.status !== 200) {
        // error
        alert('An unexpected error occurred. xmlRequest.status=' + xmlRequest.status);
        return null;
    }
    if (xmlRequest.responseText.indexOf('ERROR:') > -1) {
        alert(JSON.parse(xmlRequest.responseText));
        return false;
    }

    // <!--
    /**
     * For some reasons, the returned string sometimes contains debug
     * information from core. This debugging information start with <!--. If
     * this string is found, process only the string before this.
     */
    var responseText = xmlRequest.responseText;
    var position = responseText.indexOf('<!--');
    if (position > -1) {
        responseText = responseText.substr(0, position);
    }

    try {
        var returnObject = JSON.parse(responseText);
    } catch (e) {
        alert('xmlRequest.responseText=' + xmlRequest.responseText);
        return false;
    }

    return returnObject;
}

/**
 * Executes a suitelet asynchronously and returns the response as object.
 * 
 * @param {Object}
 *        action
 * @param {Object}
 *        values
 */
function ocSuiteletProcessAsync(action, values, callback, useAdminCredentials) {
    var logger = new ocobjLogger(arguments, true);
    if (typeof useAdminCredentials == 'undefined') {
        useAdminCredentials = true;
    }
    var xmlRequest = new XMLHttpRequest();
    try {
        // var logger = new ocobjLogger(arguments);
        window.status = 'Processing ' + action + '... ';
        // logger.log('action=' + action);
        var data = {};
        data.action = action;
        data.values = values;
        var url = null;
        // logger.log('useAdminCredentials=' + useAdminCredentials);

        if (useAdminCredentials) {
            if (ocHasNoValue(ocGlobal.ocSuiteletProcessAsyncUrl)) {
                url = nlapiResolveURL('SUITELET', 'customscript_oc_admin_backend_suitelet', 'customdeploy_oc_admin_backend_suitelet');
                ocGlobal.ocSuiteletProcessAsyncUrl = url;
            } else {
                url = ocGlobal.ocSuiteletProcessAsyncUrl;
            }
        } else {
            if (ocHasNoValue(ocGlobal.ocSuiteletProcessAsyncUrlUser)) {
                url = nlapiResolveURL('SUITELET', 'customscript_ss_sw_generic_user_cred_sl', 'customdeploy_ss_sw_generic_user_cred_sl');
                ocGlobal.ocSuiteletProcessAsyncUrlUser = url;
            } else {
                url = ocGlobal.ocSuiteletProcessAsyncUrlUser;
            }
        }

        xmlRequest.onreadystatechange = function() {
            if (xmlRequest.readyState == 4) {
                if (xmlRequest.status == 200) {
                    // success
                    var returnValue = ocHandleResponse(xmlRequest);
                    callback(returnValue);
                } else {
                    var text = xmlRequest.responseText;
                    if (text.indexOf('Please provide more detailed keywords so your search does not return too many results') > -1) {
                        setTimeout("Ext.get('placeHolderColleagueOthers').update('Please provide more detailed keywords so your search does not return too many results', 'SuiteSocial');", 500);
                        callback([]);
                        return;

                    }
                    uiShowError(text, 'Unexpected Error');
                    callback([]);
                    return;
                    // if(text.indexOf('Could not determine customer compid') >
                    // -1){
                    // uiShowError('Check if you are still logged into
                    // NetSuite.', 'Unexpected Error');
                    // return;
                    // }
                }
                window.status = 'Ready';
            }
        };
        // parameters
        logger.log('url=' + url);
        xmlRequest.open('POST', url, true /* async */);
        xmlRequest.setRequestHeader("Content-Type", "application/json");
        xmlRequest.send(JSON.stringify(data));
        return;
    } catch (e) {
        alert('ocSuiteletProcessAsync(). action=' + JSON.stringify(action) + '; values=' + JSON.stringify(values) + ocGetErrorDetails(e) + '<br />xmlRequest.responseText=' + xmlRequest.responseText);
    }
}

function ocSuiteletProcessAsyncUser(action, values, callback) {
    ocSuiteletProcessAsync(action, values, callback, false /* useAdminCredentials */);
}

/**
 * Executes a suitelet synchronously and returns the response as object.
 * 
 * @param {Object}
 *        action
 * @param {Object}
 *        values
 */
function ocSuiteletProcessEncoded(action, values) {
    var xmlRequest = new XMLHttpRequest();
    try {
        var logger = new ocobjLogger(arguments);
        logger.log('action=' + action);
        var data = {};
        data.action = action;
        data.values = values;
        if (ocHasNoValue(ocGlobal.ocSuiteletProcessEncodedUrl)) {
            ocGlobal.ocSuiteletProcessEncodedUrl = nlapiResolveURL('SUITELET', 'customscript_oc_service_sl', 'customdeploy_oc_service_sl');
        }
        //
        var url = ocGlobal.ocSuiteletProcessEncodedUrl;
        // parameters
        xmlRequest.open('POST', url, false /* async */);
        xmlRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        // xmlRequest.send(data);

        xmlRequest.send(data);
        // alert(xmlRequest.status)
        if (xmlRequest.status !== 200) {
            // error
            alert('ocSuiteletProcessEncoded() An unexpected error occurred.');
            return false;
        }

        if (xmlRequest.responseText.indexOf('ERROR:') > -1) {
            alert('ocSuiteletProcessEncoded() ' + JSON.parse(xmlRequest.responseText));
            return false;
        }

        // <!--
        /**
         * For some reasons, the returned string sometimes contains debug
         * information from core. This debugging information start with <!--. If
         * this string is found, process only the string before this.
         */
        var responseText = xmlRequest.responseText;
        var position = responseText.indexOf('<!--');
        if (position > -1) {
            responseText = responseText.substr(0, position);
        }
        var returnObject = JSON.parse(responseText);
        return returnObject;

    } catch (e) {
        alert(e.toString() + '\n\n\nxmlRequest.responseText=' + xmlRequest.responseText);
    }
}

/**
 * Executes a suitelet synchronously and returns the response as object.
 * 
 * @param {Object}
 *        action
 * @param {Object}
 *        values
 */
function ocSuiteletProcess(action, values) {
    var xmlRequest = new XMLHttpRequest();
    try {
        var logger = new ocobjLogger('ocSuiteletProcess');
        logger.log('action=' + action);
        var data = {};
        data.action = action;
        data.values = values;
        if (ocHasNoValue(ocGlobal.ocSuiteletProcessAsyncUrl)) {
            ocGlobal.ocSuiteletProcessAsyncUrl = nlapiResolveURL('SUITELET', 'customscript_oc_service_sl', 'customdeploy_oc_service_sl');
        }
        //
        var url = ocGlobal.ocSuiteletProcessAsyncUrl;
        // parameters
        xmlRequest.open('POST', url, false /* async */);
        xmlRequest.setRequestHeader("Content-Type", "application/json");
        // xmlRequest.send(data);

        xmlRequest.send(JSON.stringify(data));
        // alert(xmlRequest.status)
        if (xmlRequest.status !== 200) {
            // error
            alert('ocSuiteletProcess() An unexpected error occurred.');
            return false;
        }

        if (xmlRequest.responseText.indexOf('ERROR:') > -1) {
            alert('ocSuiteletProcess() ' + JSON.parse(xmlRequest.responseText));
            return false;
        }

        // <!--
        /**
         * For some reasons, the returned string sometimes contains debug
         * information from core. This debugging information start with <!--. If
         * this string is found, process only the string before this.
         */
        var responseText = xmlRequest.responseText;
        var position = responseText.indexOf('<!--');
        if (position > -1) {
            responseText = responseText.substr(0, position);
        }
        var returnObject = JSON.parse(responseText);
        return returnObject;

    } catch (e) {
        alert(e.toString() + '\n\n\nxmlRequest.responseText=' + xmlRequest.responseText);
    }
}

/**
 * Hides a netsuite button
 * 
 * @param {Object}
 *        label The label of the button
 */
function ocHideNsButton(label) {
    var el = Ext.select('input[value="' + label + '"]').elements[0];
    if (ocHasNoValue(el)) {
        return;
    }
    if (ocHasNoValue(el.parentNode)) {
        return;
    }
    if (ocHasNoValue(el.parentNode.parentNode)) {
        return;
    }
    el.parentNode.parentNode.style.display = 'none';
}

/**
 * TODO: not working consistently This is used in hiding the row where the Add
 * button is located in sublists
 * 
 * @param {Object}
 *        formElementIds Array of form ids of sublists. The ids can be obtained
 *        by using firebug
 */
function ocHideAddButtonRow(formElementId) {
    var logger = new ocobjLogger(arguments);
    // logger.log('formElementIds.length=' + formElementIds.length);
    // for (var i = 0; i < formElementIds.length; i++) {

    var id = formElementId;

    // alert(id);
    var tb = Ext.get(id).dom.children[0];
    // tb.children[0].style.visibility = 'hidden';
    // tb.children[0].style.display = 'none';
    // tb.children[0].children[0].style.visibility = 'hidden';
    tb.children[0].children[0].style.display = 'none';
    // logger.log(tb.children[0].children[0].innerHTML);
    // alert(tb.children[0].children[0].innerHTML);
    // tb.children[0].children[0].innerHTML = '';

    // }
    logger.end();
}

function outerHTML(node) {
    return node.outerHTML || new XMLSerializer().serializeToString(node);
}

/*
 * removes all lines ina sublist
 */
function uiClearSublist(sublistId) {
    var logger = new ocobjLogger('uiClearSublist');
    if (ocHasNoValue(sublistId)) {
        throw ' ocHasNoValue(sublistId)';
    }
    // Issue: 212985 [SuiteSocial] Confirm deletions in assistant sublists
    // do not show the confirm delete in multiple deletions
    // var batchDeletion;

    var loop = 0;
    logger.log('nlapiGetLineItemCount(sublistId)=' + nlapiGetLineItemCount(sublistId));
    if (nlapiGetLineItemCount(sublistId) == -1) {
        throw 'nlapiGetLineItemCount(sublistId) == -1';
    }
    while (nlapiGetLineItemCount(sublistId) > 0) {

        nlapiSelectLineItem(sublistId, 1);
        nlapiRemoveLineItem(sublistId);

        loop++;
        if (loop > 1000) {
            throw 'loop > 100';
        }
    }
    // Issue: 212985 [SuiteSocial] Confirm deletions in assistant sublists
    // batchDeletion = false;
}

/*
 * browser independent implementation of indexOf since IE does not support it
 */
function uiArrayIndexOf(arr, obj) {
    if (Array.indexOf) {
        return arr.indexOf(obj);
    }
    // no support
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == obj) {
            return i;
        }
    }
    return -1;
}

function uiImplementMissingFunctions() {
    // //*** Array.indexOf implementation
    // if (!Array.indexOf) {
    // Array.prototype.indexOf = function(obj){
    // for (var i = 0; i < this.length; i++) {
    // if (this[i] == obj) {
    // return i;
    // }
    // }
    // return -1;
    // };
    // }

    // jSOn implementation
    var JSON = JSON || {};
    // // implement JSON.stringify serialization
    JSON.stringify = JSON.stringify || Ext.encode;
    JSON.parse = JSON.parse || Ext.decode;

}

// jSOn implementation
var JSON = JSON || {};
// // implement JSON.stringify serialization
JSON.stringify = JSON.stringify || Ext.encode;
JSON.parse = JSON.parse || Ext.decode;

/**
 * Displays an information
 * 
 * @param {Object}
 *        info
 * @param {Object}
 *        title
 */
function uiShowInfo(info, title, dialogWidth) {

    if (ocHasNoValue(title)) {
        title = 'Information';
    }    	//Issue : 297680 [SuiteOrgChart] UI Reskin > Information box button is not centered and a portion of the box has no color      if (ocHasValue(dialogWidth)) {        Ext.MessageBox.minWidth = dialogWidth;        Ext.MessageBox.maxWidth = dialogWidth;    }        Ext.MessageBox.show({
        title : title,
        msg : info,
        buttons : Ext.MessageBox.OK,
        icon : Ext.MessageBox.INFO
    });    //Issue : 297680 [SuiteOrgChart] UI Reskin > Information box button is not centered and a portion of the box has no color      jQuery('.x-window-bl').css('background-color', jQuery('.x-window-mc').css('background-color'));    jQuery('.x-panel-fbar').width(jQuery('.x-window-ml').width());}

/**
 * Displays a warning
 * 
 * @param {Object}
 *        info
 * @param {Object}
 *        title
 */
function uiShowWarning(info, title) {

    if (ocHasNoValue(title)) {
        title = 'Warning';
    }

    Ext.MessageBox.show({
        title : title,
        msg : info,
        buttons : Ext.MessageBox.OK,
        icon : Ext.MessageBox.WARNING
    });
}

/**
 * Displays an error such as run-time errors and validation errors
 * 
 * @deprecated Use uiShowError
 * @param {Object}
 *        error
 * @param {Object}
 *        title
 */
function showError(error, title) {

    if (ocHasNoValue(title)) {
        title = 'Error'.tl();
    }

    Ext.MessageBox.show({
        title : title,
        msg : error,
        buttons : Ext.MessageBox.OK,
        icon : Ext.MessageBox.ERROR
    });
}

function uiShowError(error, title) {
    showError(error, title);
}

function uiGetErrorDetails(ex) {
    var errorDetails;
    if (ex instanceof nlobjError) {
        errorDetails = 'System error. code: ' + ex.getCode() + '<br />Details: ' + ex.getDetails();
        errorDetails += '<br />StackTrace: ' + ex.getStackTrace();
    } else if (ocHasValue(ex.rhinoException)) {
        errorDetails = 'System error. rhinoException: ' + ex.rhinoException.toString();
    } else {
        errorDetails = 'System error. ex: ' + ex.toString();
    }

    return errorDetails;
}

var gocWaitPeriods = '.';
function ocWait(message) {
    if (!document) {
        // should run only on browsers
        return;
    }
    gocWaitPeriods += '.';
    if (gocWaitPeriods == '....') {
        gocWaitPeriods = '.';
    }
    if (ocHasNoValue(message)) {
        message = 'Processing';
    }
    Ext.Msg.wait(message, 'Please wait' + gocWaitPeriods);
}

function ocSaveOk() {
    Ext.Msg.hide();
    // Ext.Msg.alert('Save', 'Save succeeded');
    // NS.form.setChanged(false); needs to be placed here since it seems
    // window.ischanged is set to true after the recalc event
    Ext.MessageBox.show({
        title : 'Save'.tl(),
        msg : 'Save succeeded'.tl(),
        buttons : Ext.MessageBox.OK,
        icon : Ext.MessageBox.INFO,
        fn : function() {
            NS.form.setChanged(false);
        }
    });
}

// var t = typeof (obj);
// if (t != "object" || obj === null) {
// // simple data type
// if (t == "string")
// obj = '"' + obj + '"';
// return String(obj);
// } else {
// // recurse array or object
// var n, v, json = [], arr = (obj && obj.constructor == Array);
// for (n in obj) {
// v = obj[n];
// t = typeof (v);
// if (t == "string")
// v = '"' + v + '"';
// else if (t == "object" && v !== null)
// v = JSON.stringify(v);
// json.push((arr ? "" : '"' + n + '":') + String(v));
// }
// return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
// }
// };
// // implement JSON.parse de-serialization
// JSON.parse = JSON.parse || function() {
// var r = "(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)", k
// = '(?:[^\\0-\\x08\\x0a-\\x1f"\\\\]|\\\\(?:["/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';
// k = '(?:"' + k + '*")';
// var s = new RegExp(
// "(?:false|true|null|[\\{\\}\\[\\]]|" + r + "|" + k + ")", "g"), t = new
// RegExp(
// "\\\\(?:([^u])|u(.{4}))", "g"), u = {
// '"' : '"',
// "/" : "/",
// "\\" : "\\",
// b : "\u0008",
// f : "\u000c",
// n : "\n",
// r : "\r",
// t : "\t"
// };
// function v(h, j, e) {
// return j ? u[j] : String.fromCharCode(parseInt(e, 16));
// }
// var w = new String(""), x = Object.hasOwnProperty;
// return function(h, j) {
// h = h.match(s);
// var e, c = h[0], l = false;
// if ("{" === c)
// e = {};
// else if ("[" === c)
// e = [];
// else {
// e = [];
// l = true;
// }
// for ( var b, d = [ e ], m = 1 - l, y = h.length; m = 0;)
// delete f[i[g]];
// }
// return j.call(n, o, f);
// };
// e = p({
// "" : e
// }, "");
// }
// return e;
// };
// }();

/*
 * An entity here is composed of multiple name-value pairs. Example entity:
 * {name: 'teddy', age: 33} @param {nlobjSubList} sublist. Not sure what the API
 * requires this @param {string} sublistId @param {string[]} columnIds An array
 * of column ids from the sublist @return {object[]} An array of entities
 */
function uiConvertSublistItemToEntity(sublistId, columnIds, lineNumber) {
    // ocWait();
    // var logger = new ocobjLogger('uiConvertSublistItemToEntity');
    var entity = {};
    for ( var j in columnIds) {
        var columnId = columnIds[j];
        // logger.log('columnId=' + columnId);
        entity[columnId] = nlapiGetLineItemValue(sublistId, columnId, lineNumber);
    }
    return entity;
}

/*
 * An entity here is composed of multiple name-value pairs. Example entity:
 * {name: 'teddy', age: 33} @param {nlobjSubList} sublist. Not sure what the API
 * requires this @param {string} sublistId @param {string[]} columnIds An array
 * of column ids from the sublist @return {object[]} An array of entities
 */
function uiConvertSublistItemsToEntities(sublistId, columnIds) {

    var logger = new ocobjLogger('uiConvertSublistItemsToEntities');
    logger.log('sublistId=' + sublistId + '; columnIds=' + columnIds);
    var lineCount = nlapiGetLineItemCount(sublistId);
    logger.log('sublistId=' + sublistId + '; lineCount=' + lineCount);
    var entities = [];
    for (var lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
        var entity = {};
        entity = uiConvertSublistItemToEntity(sublistId, columnIds, lineNumber);
        entities.push(entity);
    }
    logger.log('entities.length=' + entities.length);
    return entities;
}

/*
 * An entity here is composed of multiple name-value pairs. Example entity:
 * {name: 'teddy', age: 33} @param {nlobjSubList} sublist. Not sure what the API
 * requires this @param {string} sublistId @param {string[]} columnIds An array
 * of column ids from the sublist @return {object[]} An array of entities
 */
function uiConvertSublistItemToEntityText(sublistId, columnIds, lineNumber) {
    var logger = new ocobjLogger('uiConvertSublistItemToEntity', true);
    var entity = {};
    for ( var j in columnIds) {
        var columnId = columnIds[j];
        logger.log('columnId=' + columnId);
        var fld = nlapiGetLineItemField(sublistId, columnId, lineNumber);
        if (fld.getType() == 'select') {
            entity[columnId] = nlapiGetLineItemText(sublistId, columnId, lineNumber);
        } else {
            entity[columnId] = nlapiGetLineItemValue(sublistId, columnId, lineNumber);
        }
    }
    return entity;
}

/*
 * This is the same as uiConvertSublistItemsToEntities except that for select
 * columns, the text is obtained instead of the value An entity here is composed
 * of multiple name-value pairs. Example entity: {name: 'teddy', age: 33} @param
 * {nlobjSubList} sublist. Not sure what the API requires this @param {string}
 * sublistId @param {string[]} columnIds An array of column ids from the sublist
 * @return {object[]} An array of entities
 */
function uiConvertSublistItemsToEntitiesText(sublistId, columnIds) {

    var logger = new ocobjLogger('uiConvertSublistItemsToEntities', true);
    logger.log('sublistId=' + sublistId + '; columnIds=' + columnIds);
    var lineCount = nlapiGetLineItemCount(sublistId);
    logger.log('sublistId=' + sublistId + '; lineCount=' + lineCount);
    var entities = [];
    for (var lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
        var entity = {};
        entity = uiConvertSublistItemToEntityText(sublistId, columnIds, lineNumber);
        entities.push(entity);
    }
    logger.log('entities.length=' + entities.length);
    return entities;
}
