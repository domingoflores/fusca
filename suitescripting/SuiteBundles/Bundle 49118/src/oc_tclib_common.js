/**
 * @fileOverview Common library used by client and server
 * @author tcaguioa
 * 
 * Member variables                         Instantiation Location
 * ocGlobal.HOURGLASS                       oc_tclib_common.js
 * ocGlobal.APPNAME                         oc_tclib_common.js
 * ocGlobal.ocSuiteletProcessAsyncUrl       oc_tclib_client.js
 * ocGlobal.subordinatesDataSet             oc_tclib_org_chart_navigator_client.js
 * ocGlobal.ocGetFieldPropertiesByText_record oc_tclib_server.js
 */
// 
/**
 * @namespace Global object for storing global variables
 */
var ocGlobal = ocGlobal || {};
ocGlobal.HOURGLASS = '<img src="/images/setup/hourglass.gif" />';
ocGlobal.APPNAME = 'SuiteOrgChart BETA';
ocGlobal.CUSTSEARCH_EMP_FLDS_ID = 'customsearch_oc_employee_fields';
ocGlobal.CUSTSEARCH_EMP_EXCLUDED_DETAILS = [ 'firstname', 'lastname', 'image' ]; // Search
// columns
// that
// will
// be
// excluded
// in
// card
// details
ocGlobal.CUSTSEARCH_EMP_DETAILS_COUNT = 5; // The number of details the
// response should create
ocGlobal.ORG_CHART_FRAME_HEIGHT = 730;

/**
 * Creates a random unique number
 */
function tcapiRandom() {
    return (new Date()).getTime() + Math.floor((Math.random() * 1000) + 1);
}

/**
 * returns true if using the new ui
 * 
 * @returns {Boolean}
 */
function ocIsNewUI() {
    return true;
}

/**
 * Returns the "_oldui" suffix if old ui
 * 
 * @returns
 */
function ocAddSuffixIfOldUI() {
    return ocIsNewUI() ? '' : '_oldui';
}

/**
 * Obtains debugging information from the built in object arguments
 * 
 * @param {object}
 *        args Built-in arguments object from a function
 * @return {string} The details of a function's arguments
 */
function ocGetArgumentDetails(args) {
    var details = '';
    try {
        // get the function name and parameters
        var fullFunc = args.callee.toString();
        var funcAndArgs = fullFunc.substr(0, fullFunc.indexOf('{')).replace('function ', '');
        // get array of argument name
        var paramsStr = funcAndArgs.replace(args.callee.name, '').replace(')', '').replace('(', '');
        var params = paramsStr.split(',');
        details = ocGetNewLine(1) + 'Function=' + funcAndArgs.replace('\n', ' ');
        if (args.length > 0) {
            details += ocGetNewLine() + 'ARGUMENTS:' + ocGetNewLine(1);
            for (var i = 0; i < args.length; i++) {
                var paramName = 'arg' + i;
                if (ocHasValue(params[i])) {
                    paramName = params[i].trim();
                }
                var arg = '';
                if (typeof args[i] == 'object') {
                    // is it an array
                    if (args[i] instanceof Array) {
                        for (var x = 0; x < args[i].length; x++) {
                            // // arg += args[i][x];
                            // // arg += JSON.stringify((args[i][x]));
                            // var obj = (args[i])[x];
                            // if (obj instanceof nlobjSearchFilter) {
                            // arg += JSON.stringify(args[i]) ;
                            arg += ocGetObjectDetail(args[i]);
                        }
                    }

                    else {
                        try {
                            // arg += JSON.stringify(args[i]);
                            arg += args[i];
                        } catch (e) {
                            arg += args[i];
                        }

                        // nlapiLogExecution('debug', 'haller', '8 ' + i);
                    }
                } else {
                    arg = args[i];
                }
                details += paramName + '=' + arg + '<br />';
            }
        }
    } catch (e) {
        nlapiLogExecution('error', 'Subsidiary Navigator', 'error in ocGetArgumentDetails');
        return '';
    }
    return details;
}

/**
 * Error handling routine
 * 
 * @param {Object}
 *        e Exception
 * @param {Object}
 *        customMessage Any message you want included
 */
function ocHandleError(e, customMessage) {
    try {
        var fullMessage = 'EXECUTION CONTEXT' + ocGetNewLine() + ocGetContextDetails() + ocGetNewLine(1) + 'customMessage=' + customMessage + ocGetNewLine(2);
        var isInBrowser = (typeof document != 'undefined');
        if (ocHasNoValue(customMessage)) {
            customMessage = '';
        }

        fullMessage += ocGetErrorDetails(e);
        // =====================================================================================================
        // client-side stack trace
        // =====================================================================================================
        if (isInBrowser) {
            var clientStackTrace = '';
            if (ocHasValue(Error)) {
                var err = new Error();
                clientStackTrace = err.stack;
                fullMessage += 'CLIENT STACK TRACE=' + clientStackTrace + ocGetNewLine(2);
            }
            if (typeof console != 'undefined') {
                if (typeof console.error != 'undefined') {
                    console.error(ocGlobal.TITLE + ' Error: ' + fullMessage);
                    return fullMessage;
                }

                if (typeof console.log != 'undefined') {
                    console.log(ocGlobal.TITLE + ' Error: ' + fullMessage);
                    return fullMessage;
                }
            }
            nlapiLogExecution('error', ocGlobal.TITLE, 'Error in ocHandleError(); fullMessage=' + fullMessage);
            return fullMessage;

        } else {
            // =====================================================================================================
            // server-side stack trace
            // =====================================================================================================
            var html = fullMessage.replace(new RegExp('\n', 'gi'), '<br />');
            nlapiLogExecution('error', ocGlobal.TITLE + ' Error', html);
        }
        return fullMessage;
    } catch (e) {
        nlapiLogExecution('error', ocGlobal.TITLE, 'Error in ocHandleError(); e=' + e);
        // comment line below when released
        // throw e;
    }
}

/**
 * Returns true is the param is undefined or null or empty
 * 
 * @param {any}
 *        param
 * @return {boolean}
 */
function ocHasNoValue(param) {
    if (typeof param == 'undefined') {
        return true;
    }
    if (param === null) {
        return true;
    }
    if (param === '') {
        return true;
    }
    return false;
}

/**
 * Returns true is the param is undefined or null or empty
 * 
 * @param {any}
 *        param
 * @return {boolean}
 */
function ocHasValue(param) {
    return !ocHasNoValue(param);
}

/**
 * Returns newlines depending on the execution context
 * 
 * @param {integer}
 *        repeat Number of newlines to return
 */
function ocGetNewLine(repeat) {
    if (typeof repeat == 'undefined') {
        repeat = 1;
    }
    var newline = '';
    for (var i = 1; i <= repeat; i++) {
        // if (ocHasValue(console)) {
        if (typeof console !== 'undefined') {
            newline += '\n';
        } else {
            newline += '\n';
        }
    }
    return newline;
}

/**
 * Returns details about the execution context
 * 
 * @return {string}
 */
function ocGetContextDetails() {
    var detail = '';
    try {
        var userId = nlapiGetUser();
        var context = nlapiGetContext();
        detail += 'Company: ' + context.getCompany() + ocGetNewLine();
        try {
            if (context.getFeature('departments')) {
                detail += 'Department: ' + nlapiGetDepartment() + ocGetNewLine();
            }
        } catch (e) {
            detail += 'Department: error ' + e + ocGetNewLine();
        }

        try {
            if (context.getFeature('locations')) {
                detail += 'Location: ' + nlapiGetLocation() + ocGetNewLine();
            }
        } catch (e) {
            detail += 'Location: error ' + e + ocGetNewLine();
        }

        try {
            if (context.getFeature('subsidiaries')) {
                detail += 'Subsidiary: ' + nlapiGetSubsidiary() + ocGetNewLine();
            }
        } catch (e) {
            detail += 'Subsidiary: error ' + e + ocGetNewLine();
        }

        detail += 'User Id: ' + userId + ocGetNewLine();
        detail += 'User Name: ' + context.getName() + ocGetNewLine();
        detail += 'Role: ' + nlapiGetRole() + ocGetNewLine();
        detail += 'Role Center: ' + context.getRoleCenter() + ocGetNewLine();
        try {
            detail += 'DeploymentId: ' + context.getDeploymentId() + ocGetNewLine();
        } catch (e) {
            detail += 'DeploymentId: error ' + e + ocGetNewLine();
        }

        detail += 'User Email: ' + context.getEmail() + ocGetNewLine();
        detail += 'Environment: ' + context.getEnvironment() + ocGetNewLine();
        detail += 'ExecutionContext: ' + context.getExecutionContext() + ocGetNewLine();
        detail += 'Name: ' + context.getName() + ocGetNewLine();
        detail += 'ScriptId: ' + context.getScriptId() + ocGetNewLine();
        detail += 'Version: ' + context.getVersion() + ocGetNewLine();

    } catch (e) {
        detail = 'Error in ocGetContextDetails(); ' + e;
    }
    return detail;
}

/**
 * @class Object used in logging. Used in both client and server
 * @example // sample 1 var logger = new ocobjlogger(arguments); // sample 2 var
 *          logger = new ocobjlogger(arguments, false, 'getData()');
 * @param {Object}
 *        args 'arguments' is a built-in object in functions. Pass 'arguments'
 *        always.
 * @param {Boolean}
 *        (optional) isDisabled Set to true to temporarily disable logging.
 *        Default to false.
 * @param {String}
 *        commonLog (optional) All succeeding calls to log will prepend the
 *        commonLog .
 * @return {void}
 */
function ocobjLogger(args, isDisabled, commonLog) {

    commonLog = commonLog || '';
    var sw = new ocobjStopWatch();
    // this is an array of commonLog values. If a commonLog is in this list, it
    // is disabled
    var disabledCommonLogs = [ 'ocGetFieldPropertiesByText', 'ocGetOptionsRecordSelectFieldsByName' ];

    var _disabled = false;
    if (ocHasValue(isDisabled)) {
        _disabled = isDisabled;
    }

    /**
     * @deprecated Use the class public function setDisabled instead
     * @description (deprecated) Enable or disables logging
     * @param {Boolean}
     *        isDisabled
     */
    function setDisabled(isDisabled) {
        _disabled = isDisabled;
    }
    var _commonLog;
    var _argumentsDetails = '';
    if (typeof args == 'object') {
        _commonLog = (args.callee.name || commonLog) + '()';
        _argumentsDetails = ocGetArgumentDetails(args);// ocGetArgumentDetailsTableFormat(args);
    } else {
        _commonLog = commonLog + ' ' + args + '()';
    }
    // _commonLog = ocPadRight(_commonLog, 45);

    this.auditReset = function(msg) {
        return sw.measureSegment();
    };

    this.audit = function(msg) {
        if (_disabled === false) {
            var MAX_ARG_LENGTH = 100;
            if (ocHasValue(msg)) {
                msg = msg + '; ' + _argumentsDetails;
            } else {
                msg = _argumentsDetails;
            }

            if (msg.length > MAX_ARG_LENGTH) {
                msg = msg.substr(0, MAX_ARG_LENGTH);
            }

            // if (ocArrayIndexOf(disabledCommonLogs, _commonLog) > -1) {
            // return;
            // }
            var finalMsg = _commonLog + ' ';
            finalMsg += ocPad(ocAddCommas(sw.measureFromScript()), 6) + ' ms; &nbsp;&nbsp;';
            finalMsg += ocPad(ocAddCommas(sw.measureFromFunction()), 6) + ' ms; &nbsp;&nbsp;';
            finalMsg += ocPad(ocAddCommas(sw.measureSegment()), 6) + ' ms; &nbsp;&nbsp;';
            finalMsg += msg;

            finalMsg = '<span style="font-family: courier new">' + finalMsg + '</span>';
            ocLog(finalMsg, null, null, 'audit');
        }
    };

    this.log = function(msg) {
        if (_disabled === false) {
            if (ocArrayIndexOf(disabledCommonLogs, _commonLog) > -1) {
                return;
            }
            ocLog(_commonLog + ' ' + sw.measure() + 'ms; ' + msg);
        }
    };
    /**
     * @public
     * @description Logs everytime even if _disabled is true
     * @param {Object}
     *        msg
     */
    this.logAlways = function(msg) {
        ocLog(_commonLog + ' ' + sw.measure() + 'ms; ' + msg);
    };

    /**
     * @public
     * @description Logs an error. In NetSuite, error log entries have red
     *              background.
     * @param {Object}
     *        msg
     */
    this.error = function(msg) {
        if (_disabled === false) {
            if (ocArrayIndexOf(disabledCommonLogs, _commonLog) > -1) {
                return;
            }
            ocLogError(_commonLog + ' ' + sw.measure() + 'ms; ' + msg);
        }
    };
    /**
     * @public
     * @description Logs a warning. In NetSuite, warning log entries have yellow
     *              background.
     * @param {Object}
     *        msg
     */
    this.warn = function(msg) {
        if (_disabled === false) {
            if (ocArrayIndexOf(disabledCommonLogs, _commonLog) > -1) {
                return;
            }
            ocLogWarn(_commonLog + ' ' + sw.measure() + 'ms; ' + msg);
        }
    };
    /**
     * @public
     * @description Logs a successful activity. In NetSuite, 'successful' log
     *              entries have green background.
     * @param {Object}
     *        msg
     */
    this.ok = function(msg) {
        if (_disabled === false) {
            if (ocArrayIndexOf(disabledCommonLogs, _commonLog) > -1) {
                return;
            }
            ocLogOk(_commonLog + ' ' + sw.measure() + 'ms; ' + msg);
        }
    };

    this.end = function(msg) {
        // var MAX_ARG_LENGTH =70;
        // var shortArgumentsDetails = _argumentsDetails;
        // if(shortArgumentsDetails.length > MAX_ARG_LENGTH){
        // shortArgumentsDetails = shortArgumentsDetails.substr(0,
        // MAX_ARG_LENGTH);
        // }
        var shortArgumentsDetails = '';
        if (ocHasValue(msg)) {
            msg = 'END ' + shortArgumentsDetails + '; ' + msg;
        } else {
            msg = 'END ' + shortArgumentsDetails;
        }

        if (_disabled === false) {
            // if (ocArrayIndexOf(disabledCommonLogs, _commonLog) > -1) {
            // return;
            // }
            this.log(msg);
        }
    };

    /**
     * @public
     * @description Enable or disables logging
     * @param {Boolean}
     *        isDisabled
     */
    this.setDisabled = function(isDisabled) {
        _disabled = isDisabled;
    };

    this.log(_argumentsDetails);

}

/**
 * @class This is used in measuring execution time in milli-seconds
 */
function ocobjStopWatch() {

    ocGlobal = ocGlobal || {};
    if (ocHasNoValue(ocGlobal.startOfScriptMilliseconds)) {
        ocGlobal.startOfScriptMilliseconds = (new Date()).getTime();
    }

    var startMilliSeconds = (new Date()).getTime();
    var lastCallToMeasure = (new Date()).getTime();

    /**
     * @public
     * @description Starts the timer
     */
    this.start = function() {
        startMilliSeconds = (new Date()).getTime();
    };

    /**
     * @public
     * @description Returns the current elapsed time (in ms) and resets the
     *              start time
     */
    this.stop = function() {
        var currentMilliSeconds = (new Date()).getTime();
        var ms = currentMilliSeconds - startMilliSeconds;
        startMilliSeconds = currentMilliSeconds;
        return ms;
    };

    /**
     * @public
     * @description Returns the current elapsed time (in ms) WITHOUT resetting
     *              the start time (from the last call to start or stop)
     */
    this.measure = function() {
        var currentMilliSeconds = (new Date()).getTime();
        var ms = currentMilliSeconds - startMilliSeconds;
        return ms;
    };

    /**
     * Returns the current elapsed time (in ms) from start of the script call
     */
    this.measureFromScript = function() {
        var currentMilliSeconds = (new Date()).getTime();
        var ms = currentMilliSeconds - ocGlobal.startOfScriptMilliseconds;
        return ms;
    };

    /**
     * Returns the current elapsed time (in ms) from start of the function call
     */
    this.measureFromFunction = function() {
        var currentMilliSeconds = (new Date()).getTime();
        var ms = currentMilliSeconds - startMilliSeconds;
        return ms;
    };

    /**
     * Returns the current elapsed time (in ms) starting from the last call to
     * measureSegment but WITHOUT resetting the start time (from the last call
     * to start or stop)
     */
    this.measureSegment = function() {
        var currentMilliSeconds = (new Date()).getTime();
        var ms = currentMilliSeconds - lastCallToMeasure;
        lastCallToMeasure = currentMilliSeconds;
        return ms;
    };
}

/**
 * Browser and server independent implementation of indexOf since IE does not
 * support it
 * 
 * @param {object[]}
 *        arr
 * @param {object}
 *        obj
 */
function ocArrayIndexOf(arr, obj) {
    if (arr.indexOf) {
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

/**
 * Used in logging
 * 
 * @param {string}
 *        msg
 * @param {string}
 *        otherDetails Not being used?
 * @param {string}
 *        source Not being used?
 */
function ocLog(msg, otherDetails, source, type) {
    var completeMsg = msg;// + ': ' + eval(msg);
    if (ocHasNoValue(type)) {
        type = 'debug';
    }

    if (!ocHasNoValue(otherDetails)) {
        completeMsg = completeMsg + ' otherDetails=' + otherDetails;
    }
    if (!ocHasNoValue(source)) {
        completeMsg = source + '() ' + completeMsg;
    }
    if (typeof document !== 'undefined') {
        if (typeof console !== 'undefined') {
            console.log(completeMsg);
        }
    } else {
        completeMsg = '(' + nlapiGetContext().getRemainingUsage() + ') ' + completeMsg;
        nlapiLogExecution(type, 'ocobjLogger', completeMsg);
    }
    return completeMsg;
}

/**
 * Logs an error
 * 
 * @param {Object}
 *        msg
 * @param {Object}
 *        otherDetails
 * @param {Object}
 *        source
 */
function ocLogError(msg, otherDetails, source) {
    if (typeof document !== 'undefined' && typeof console !== 'undefined') {
        ocLog('ERROR: ' + msg);
    } else {
        ocLog('<span style="background-color: pink">' + msg + '</span>', otherDetails, source, 'error');
    }
}

/**
 * Logs a successful activity
 * 
 * @param {Object}
 *        msg
 * @param {Object}
 *        otherDetails
 * @param {Object}
 *        source
 */
function ocLogOk(msg, otherDetails, source) {
    if (typeof document !== 'undefined' && typeof console !== 'undefined') {
        ocLog('SUCCESS: ' + msg);
    } else {
        ocLog('<span style="background-color: lightgreen">' + msg + '</span>', otherDetails, source, 'debug');
    }
}

/**
 * Logs a warning
 * 
 * @param {Object}
 *        msg
 * @param {Object}
 *        otherDetails
 * @param {Object}
 *        source
 */
function ocLogWarn(msg, otherDetails, source) {
    if (typeof document !== 'undefined' && typeof console !== 'undefined') {
        ocLog('WARNING: ' + msg);
    } else {
        ocLog('<span style="background-color: yellow">' + msg + '</span>', otherDetails, source, 'debug');
    }
}

function ocPad(s, length) {
    var diff = length - s.length;
    if (diff > 0) {
        for (var i = 1; i <= diff; i++) {
            s = '&nbsp;' + s;
        }
    } else {
        s = s.substr(0, length);
    }
    return s;
}

function ocAddCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function ocGetErrorDetails(ex) {
    var errorDetails = '';
    try {
        errorDetails = 'ERROR DETAILS' + ocGetNewLine();
        errorDetails += 'ex=' + ex.toString() + ocGetNewLine();

        if (ex.getDetails) {
            errorDetails += 'Details: ' + ex.getDetails() + ocGetNewLine();
        }
        if (ex.getCode) {
            errorDetails += 'Code: ' + ex.getCode() + ocGetNewLine();
        }
        if (ex.getId) {
            errorDetails += 'Id: ' + ex.getId() + ocGetNewLine();
        }
        if (ex.getStackTrace) {
            errorDetails += 'StackTrace: ' + ex.getStackTrace() + ocGetNewLine();
        }
        if (ex.getUserEvent) {
            errorDetails += 'User event: ' + ex.getUserEvent() + ocGetNewLine();
        }
        if (ex.getInternalId) {
            errorDetails += 'Internal Id: ' + ex.getInternalId() + ocGetNewLine();
        }
        if (ex.rhinoException) {
            errorDetails += 'RhinoException: ' + ex.rhinoException.toString() + ocGetNewLine();
        }
        if (ex.stack) {
            errorDetails += 'Stack=' + ex.stack;
        }

        if (ex instanceof nlobjError) {
            errorDetails += 'Type: nlobjError' + ocGetNewLine();
        } else if (ocHasValue(ex.rhinoException)) {
            errorDetails += 'Type: rhinoException' + ocGetNewLine();
        } else {
            errorDetails += 'Type: Generic Error' + ocGetNewLine();
        }

    } catch (e) {
        errorDetails += ' Error in ocGetErrorDetails=' + e;
    }
    return errorDetails;
}

/**
 * Converts a resultset to JSON array
 * 
 * @param {Object}
 *        results
 * @returns {Array}
 */
function ocParseResults(results) {
    var logger = new ocobjLogger(arguments, true);
    if (results === null) {
        return null;
    }
    var rows = JSON.stringify(results);
    rows = JSON.parse(rows);
    logger.log('ocParseResults() rows.length=' + rows.length);
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        row.internalid = row.id;
        var columns = row.columns;
        logger.log('ocParseResults() columns=' + columns);
        row.detailcount = 0;
        row.details = [];
        for ( var p in columns) {
            var value = '';
            if (columns[p].name) {
                row[p + '_name'] = columns[p].name;
                row[p + '_internalid'] = columns[p].internalid;
                value = columns[p].name;
            } else {
                row[p] = columns[p];
                value = columns[p];
            }

            if (ocGlobal.CUSTSEARCH_EMP_EXCLUDED_DETAILS.indexOf(p) < 0 && p.indexOf('internalid') < 0) {
                row.detailcount++;
                row.details.push({
                    'placeholderkey' : p,
                    'placeholdervalue' : value
                });
            }
        }

        // Push for more rows
        logger.log('ocParseResults() details.length=' + row.details.length);
        if (row.details.length < ocGlobal.CUSTSEARCH_EMP_DETAILS_COUNT) {
            for (var d = row.details.length - 1; d < ocGlobal.CUSTSEARCH_EMP_DETAILS_COUNT; d++) {
                row.details.push({
                    'placeholderkey' : 'empty',
                    'placeholdervalue' : null
                });
            }
        }

        rows[i] = row;
    }

    return rows;
}

/**
 * used in getting detailed info on an object
 * 
 * @param {Object}
 *        obj
 * @returns {string} details of the object
 */
function ocGetObjectDetail(obj) {
    // Calling JSON.stringify on some nl objects like nlobjAssistant,
    // nlobjResponse,nlobjRequest and nlobjSelectOptions throws an error even
    // when inside a try catch statement
    var objS = obj.toString();
    if ([ 'nlobjAssistant' ].indexOf(objS) > -1) {
        return objS;
    }

    if (objS.indexOf('nlobjResponse') > -1) {
        return objS;
    }
    if (objS.indexOf('nlobjRequest') > -1) {
        return objS;
    }
    if (objS.indexOf('nlobjForm') > -1) {
        return objS;
    }

    if (obj instanceof Array) {
        if (obj[0] && obj[0].getId && obj[0].getText) {
            var detail = 'nlobjSelectOptions[' + obj.length + ']';
            if (obj.length <= 10) {
                // show items if they are not more than 10
                detail += '[';
                var count = obj.length;
                for (var i = 0; i < count; i++) {
                    var option = obj[0];
                    detail += '{id: ' + option.getId() + ', text:' + option.getText() + '}';
                }
                detail += ']';
            }
            return detail;
        }
    }

    // Calling JSON.stringify on nlobjSelectOption throws an error
    if (obj && obj.getId && obj.getText) {
        var detail = 'nlobjSelectOption';
        detail += '{id: ' + obj.getId() + ', text:' + obj.getText() + '}';
        return detail;
    }

    // for other objects
    try {
        detail = JSON.stringify(obj);
    } catch (e) {
        return null;
    }
    return detail;
}
