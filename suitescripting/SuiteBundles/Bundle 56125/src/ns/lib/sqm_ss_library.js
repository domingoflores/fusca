/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       14 May 2014     jmarimla         Initial version: isValidObject, Logger, getFailMessage, toJson, isJson
 * 2.00       02 Jun 2014     jmarimla         Added new function: convertTimestampToMS
 * 3.00       06 Jun 2014     maquino          Added new functions: convertDateToStringFormat and convertStringToDateFormat
 * 4.00       18 Jun 2014     jmarimla         Modified date conversion functions
 * 5.00       13 Aug 2014     jmarimla         Added new function: getUserSettings
 * 6.00       03 Sep 2014     rwong            Added new fields in the getUserSetting method
 * 7.00       08 Sep 2014     jmarimla         Added new function: consolidateSearchResults
 * 8.00       03 Mar 2015     jmarimla         Added new functions: getBundlePath, getFileHtmlCode
 *
 */

var psgp_sqm;
if (!psgp_sqm) { psgp_sqm = {}; }
if (!psgp_sqm.serverlibrary) { psgp_sqm.serverlibrary = {}; }


/**
 * Check Object Validity
 */
psgp_sqm.serverlibrary.isValidObject = function(objectToTest) {
    var isValidObject = false;
    isValidObject = (objectToTest!=null && objectToTest!='' && objectToTest!=undefined) ? true : false;
    return isValidObject;
};

/**
 * Logging utility.
 */
psgp_sqm.serverlibrary.logger = function(logTitle, isClientside, isEnabled) {
    // Logger Constants
    var startLogMessage     = '=====Start=====';
    var endLogMessage       = '======End======';
    var setStartLogMessage  = function(newStartLogMessage) { startLogMessage = newStartLogMessage;  };
    var setEndLogMessage    = function(newEndtLogMessage)  { endLogMessage   = newEndLogMessage;    };

    this.getStartLogMessage = function() { return startLogMessage;  };
    this.getEndLogMessage   = function() { return endLogMessage;    };

    // logTitle manipulation
    var logTitle           = logTitle;
    this.setLogTitle       = function(newLogTitle) { logTitle = newLogTitle;  };
    this.getLogTitle       = function() { return logTitle;  };

    // Determines whether to print a log or display an alert message
    var isClientside       = (!isClientside) ? false : isClientside;
    var isForceClientside  = false;

    this.forceClientside   = function() { isForceClientside = true;  };          // Force Client Side logging via alerts
    this.unforceClientside = function() { isForceClientside = false; };          // Unforce Client Side logging via alerts

    // Defines the logLevel similar to that of log4j
    var ALL        = 0; // The ALL has the lowest possible rank and is intended to turn on all logging.
    var AUDIT      = 1; // The AUDIT Level designates finer-grained informational events than the DEBUG
    var DEBUG      = 2; // The DEBUG Level designates fine-grained informational events that are most useful to debug an application.
    var ERROR      = 3; // The ERROR level designates error events that might still allow the application to continue running.
    var EMERGENCY  = 4; // The EMERGENCY level designates very severe error events that will presumably lead the application to abort.
    var OFF        = 5; // The OFF has the highest possible rank and is intended to turn off logging.

    var LOG_LEVELS = new Array('ALL', 'AUDIT', 'DEBUG', 'ERROR', 'EMERGENCY', 'OFF');
    var logLevel   = OFF; // current log level - default is OFF

    // Convenience method to set log level to ALL, AUDIT, DEBUG, ERROR, EMERGENCY and OFF
    this.setLogLevelToAll       = function() { logLevel = ALL;       };
    this.setLogLevelToAudit     = function() { logLevel = AUDIT;     };
    this.setLogLevelToDebug     = function() { logLevel = DEBUG;     };
    this.setLogLevelToError     = function() { logLevel = ERROR;     };
    this.setLogLevelToEmergency = function() { logLevel = EMERGENCY; };
    this.setLogLevelToOff       = function() { logLevel = OFF;       };

    this.enable   = function() { this.setLogLevelToAll(); };                     // Enable the logging mechanism
    this.disable  = function() { this.setLogLevelToOff(); };                     // Disable the logging mechanism
    if (!isEnabled) {
        this.disable();
    } else {
        if (isEnabled == true) this.enable();
    }

    // Facility for pretty-fying the output of the logging mechanism
    var TAB             = '\t';                                                 // Tabs
    var SPC             = ' ';                                                  // Space
    var indentCharacter = SPC;                                                  // character to be used for indents:
    var indentations    = 0;                                                    // number of indents to be padded to message

    this.indent   = function() { indentations++; };
    this.unindent = function() { indentations--; };

    // Prints a log either as an alert for CSS or a server side log for SSS
    this.log = function (logType, newLogTitle, logMessage) {
        // Pop an alert window if isClientside or isForceClientside
        if ((isClientside) || (isForceClientside)) {
            alert(LOG_LEVELS[logType] + ' : ' + newLogTitle + ' : ' + logMessage);
        }

        // Prints a log message if !isClientside
        if (!isClientside) {
            for (var i = 0; i < indentations; i++) {
                logMessage = indentCharacter + logMessage;
            }
            logMessage = '<pre>' + logMessage + '</pre>';
            nlapiLogExecution(LOG_LEVELS[logType], newLogTitle, logMessage);
        }
    };

    // Validates the log parameter before calling tha actual log function
    this.validateParamsThenLog = function(logType, newLogTitle, logMessage) {
        if (!logType) logType = EMERGENCY;                                      // default logType to EMERGENCY - minimal log messages
        if (logLevel > logType) return;                                         // current logLevel does not accomodate logType

        if (newLogTitle && !logMessage) {                                       // If newLogTitle exist and logMessage is undefined,
            logMessage  = newLogTitle;                                          // then the newLogTitle should be displayed as the logMessage
            newLogTitle = null;
        }

        if (!newLogTitle) newLogTitle = logTitle;
        this.log(logType, newLogTitle, logMessage);
    };

    // Convenience method to log a AUDIT, DEBUG, INFO, WARN, ERROR and EMERGENCY messages
    this.audit     = function(newLogTitle, logMessage) { this.validateParamsThenLog(AUDIT,     newLogTitle, logMessage); };
    this.debug     = function(newLogTitle, logMessage) { this.validateParamsThenLog(DEBUG,     newLogTitle, logMessage); };
    this.error     = function(newLogTitle, logMessage) { this.validateParamsThenLog(ERROR,     newLogTitle, logMessage); };
    this.emergency = function(newLogTitle, logMessage) { this.validateParamsThenLog(EMERGENCY, newLogTitle, logMessage); };
};

/**
 * JSON Fail Message
 */
psgp_sqm.serverlibrary.getFailMessage = function (message) {
    var err = new Object();
    err.success = false;
    err.message= message;
    return JSON.stringify(err);
};

/**
 * Convert String to JSON
 */
psgp_sqm.serverlibrary.toJson = function (json) {
    try {
        if (json) {
            return JSON.parse(json);
        }
    }
    catch(ex) {
        return json;
    }
};

/**
 * Check if JSON
 */
psgp_sqm.serverlibrary.isJson = function (json) {
    try {
        if (json) {
            JSON.parse(json);
        }

        return true;
    }
    catch(ex) {
        return false;
    }
};

/**
 * Convert Timestamp string to Milliseconds
 */
psgp_sqm.serverlibrary.convertTimestampToMS = function (tsString) {
    if (!tsString) throw 'Invalid tsString in convertTimestampToMS';
    // Split timestamp into [ Y, M, D, h, m, s ]
    var t = tsString.split(/[- :]/);
    // Apply each element to the Date function
    var d = new Date(t[0], t[1]-1, t[2], t[3] || 0, t[4] || 0, t[5] || 0);
    //return milliseconds
    return d.getTime() - (d.getTimezoneOffset() * 1000 * 60); //convert to UTC equivalent
};

/**
 * Convert Date to String format (YYYY-MM-DDTHH:MM:SS)
 */
psgp_sqm.serverlibrary.convertDateToStringFormat = function(date) {
    var dateStr = (date.getFullYear()) + '-'
                + (date.getMonth()+1) + '-'
                + (date.getDate()) + 'T'
                + (date.getHours()||'00') + ':'
                + (date.getMinutes()||'00') + ':'
                + (date.getSeconds()||'00')
                ;
    return dateStr;
};

/**
 * Convert String (YYYY-MM-DDTHH:MM:SS) to NS Date format
 */
psgp_sqm.serverlibrary.convertStringToDateFormat = function(dateStr) {
    if (!dateStr) return;
    var convertedDate = '';
    var datetime = dateStr.replace('T', ',').replace(/-/g,'/').replace(' ', ',').split(',');
    var date = datetime[0].split('/');
    var time = datetime[1].split(':');
    convertedDate = new Date(date[0], date[1]-1, date[2], time[0] || 0, time[1] || 0, time[2] || 0);
    return nlapiDateToString(convertedDate, 'datetime');
};

/**
 * Retrieve SQM User Settings
 */
psgp_sqm.serverlibrary.getUserSettings = function() {
    var sf = new Array();
    var sc = new Array();

    var userId = nlapiGetContext().getUser();
    sf.push(new nlobjSearchFilter('custrecord_sqm_user', null, 'anyof', [userId]));

    sc.push(new nlobjSearchColumn('custrecord_sqm_start_date'));
    sc.push(new nlobjSearchColumn('custrecord_sqm_end_date'));
    sc.push(new nlobjSearchColumn('custrecord_sqm_chart_type'));
    sc.push(new nlobjSearchColumn('custrecord_sqm_summary'));
    sc.push(new nlobjSearchColumn('custrecord_sqm_filters'));
    var results = nlapiSearchRecord('customrecord_sqm_settings', null, sf, sc);

    return results;
};

/**
 * Retrieve all search result sets from a search result
 */
psgp_sqm.serverlibrary.consolidateSearchResults = function (searchResults, batchLimit, iterLimit) {
    var allSearchResults = new Array();
    // default limits: 1000 results per getResult, 400 calls to getResult (4000 governance units)
    var limitPerBatch = (batchLimit) ? batchLimit : 1000; 
    var limitIterations = (iterLimit)? iterLimit : 400; 

    var countPerBatch = 0;
    var iterations = 0;
    var allSearchResults = new Array();
    do {
        var searchSubSet = searchResults.getResults(iterations*limitPerBatch, (iterations*limitPerBatch) + limitPerBatch);
        countPerBatch = searchSubSet.length;
        allSearchResults = allSearchResults.concat(searchSubSet);
        iterations++;
    } while ((countPerBatch == limitPerBatch) && (iterations < limitIterations));
    logger.debug('consolidateSearchResults',
            'getRemainingUsage(): ' + nlapiGetContext().getRemainingUsage() + '\r\n'
            + 'allSearchResults.length: ' + allSearchResults.length + '\r\n'
            + 'getResults iterations: ' + iterations + '\r\n'
    );
    return allSearchResults;
};

/**
 * Retrive file url based on the company and bundle path
 */
psgp_sqm.serverlibrary.getBundlePath = function (request) {
    var url = request.getURL().substring(0, request.getURL().indexOf('/app'));
    var companyID = nlapiGetContext().getCompany();
    var bundleID = nlapiGetContext().getBundleId() || '54130';

    return url + '/c.' + companyID + "/suitebundle" + bundleID + '/src';
};

/**
 * Retrieve file url based on filename and return in html code 
 */
psgp_sqm.serverlibrary.getFileHtmlCode = function (fileName) {
    var fileId = null;
    var file = null;

    // file name only, so search it first
    var results = nlapiSearchRecord("file", null, [ 'name', 'is', fileName ]);
    if (results === null) {
        throw 'results === null; fileName=' + fileName;
    }
    if (results.length > 1) {
        throw 'results.length > 1; fileName=' + fileName;
    }
    // we expect only 1 file
    fileId = results[0].getId();

    var url = nlapiResolveURL('mediaitem', fileId);
    var htmlCode = '';
    if (fileName.indexOf('.css') > -1) {
        htmlCode = '<link type="text/css" rel="stylesheet" href="' + url + '" />';
    }

    if (fileName.indexOf('.js') > -1) {
        htmlCode = '<script type="text/javascript" src="' + url + '"></script>';
    }
    if (fileName.indexOf('.html') > -1) {
        if (file === null) {
            file = nlapiLoadFile(fileId);
        }
        htmlCode = file.getValue();
    }
    return htmlCode;
};
