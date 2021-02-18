/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       05 Dec 2014     jmarimla         Initial
 * 2.00       18 Feb 2015     rwong            Added time range resolution functions
 * 3.00       27 Feb 2015     rwong            Updated time range resolution functions
 * 4.00       03 Mar 2015     rwong
 * 5.00       07 Mar 2015     jmarimla         Updated time range resolution function for readability
 * 6.00       21 Mar 2015     jmarimla         New function getRecordTypesJSON
 * 7.00       23 Mar 2015     jyeh
 * 8.00       25 Mar 2015     jyeh
 * 9.00       21 Apr 2015     jmarimla         Skip invalid entries in getRecordTypesJson
 *10.00       23 Apr 2015     jbabaran         Fix Item} issue
 *11.00       25 Apr 2015     rwong            Update function to support changes in the nlapiGetPerformanceMetaData
 *12.00       29 Apr 2015     jmarimla         Changed resolution values
 *13.00       14 May 2015     jmarimla         Removed logger reference
 *14.00       15 May 2015     jmarimla         Read .json files
 *15.00       14 Jul 2015     jmarimla         Added maximum results for consolidateSearchResults
 *16.00       11 Aug 2015     jmarimla         Support for company filter
 *17.00       25 Aug 2015     jmarimla         Added account for qa automation
 *18.00       17 Sep 2015     jmarimla         Added qa bundles for customer debugging
 *19.00       24 Feb 2016     jmarimla         getUserscorecardColor and getSitePageStandard
 *20.00       07 Mar 2016     rwong            updated the colors of the getuserscorecardColor
 *21.00       11 Mar 2016     jmarimla         getDomain and removeDomain functions
 *22.00       07 Jul 2016     rwong            Removed functions related to SC APM
 *23.00       26 Jan 2017     jmarimla         New customer debugging account
 *24.00       18 Sep 2017     jmarimla         Add account
 *25.00       09 Oct 2017     jmarimla         WSDL API functions
 *26.00       24 Nov 2017     jmarimla         Changed unreleased tag
 *27.00       04 Apr 2019     jmarimla         APM NA
 *
 */

var psgp_apm;
if (!psgp_apm) { psgp_apm = {}; }
if (!psgp_apm.serverlibrary) { psgp_apm.serverlibrary = {}; }

/**
 * Check Object Validity
 */
psgp_apm.serverlibrary.isValidObject = function(objectToTest) {
    var isValidObject = false;
    isValidObject = (objectToTest!=null && objectToTest!='' && objectToTest!=undefined) ? true : false;
    return isValidObject;
};

/**
 * Logging utility.
 */
psgp_apm.serverlibrary.logger = function(logTitle, isClientside, isEnabled) {
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
psgp_apm.serverlibrary.getFailMessage = function (message) {
    var err = new Object();
    err.success = false;
    err.message= message;
    return JSON.stringify(err);
};

/**
 * Convert String to JSON
 */
psgp_apm.serverlibrary.toJson = function (json) {
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
psgp_apm.serverlibrary.isJson = function (json) {
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
 * Convert Date to String format (YYYY-MM-DDTHH:MM:SS)
 */
psgp_apm.serverlibrary.convertDateToStringFormat = function (date) {
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
psgp_apm.serverlibrary.convertStringToDateFormat = function (dateStr) {
    if (!dateStr) return;
    var convertedDate = '';
    var datetime = dateStr.replace('T', ',').replace(/-/g,'/').replace(' ', ',').split(',');
    var date = datetime[0].split('/');
    var time = datetime[1].split(':');
    convertedDate = new Date(date[0], date[1]-1, date[2], time[0] || 0, time[1] || 0, time[2] || 0);
    return nlapiDateToString(convertedDate, 'datetime');
};

psgp_apm.serverlibrary.convertStringToDateWithMillisecond = function (dateStr) {
    if (!dateStr) return;
    var datetime = dateStr.replace('T', ',').replace('Z', ' ').replace(/-/g,'/').replace(' ', ',').replace('.', ':').trim().split(',');
    var date = datetime[0].split('/');
    var time = datetime[1].split(':');
    return new Date(date[0], date[1]-1, date[2], time[0] || 0, time[1] || 0, time[2] || 0, time[3] || 0);
};

/**
 * Retrieve all search result sets from a search result
 */
psgp_apm.serverlibrary.consolidateSearchResults = function (searchResults, batchLimit, iterLimit, searchLimit) {
    var allSearchResults = new Array();
    // default limits: 1000 results per getResult, 50 calls to getResult (500 governance units), 10000 results max
    var limitPerBatch = (batchLimit) ? batchLimit : 1000;
    var limitIterations = (iterLimit)? iterLimit : 50;
    var searchMax = (searchLimit) ? searchLimit : 10000;

    var countPerBatch = 0;
    var iterations = 0;
    var allSearchResults = new Array();
    do {
        var searchSubSet = searchResults.getResults(iterations*limitPerBatch, (iterations*limitPerBatch) + limitPerBatch);
        countPerBatch = searchSubSet.length;
        allSearchResults = allSearchResults.concat(searchSubSet);
        iterations++;
    } while ((countPerBatch == limitPerBatch) && (iterations < limitIterations) && ((iterations*limitPerBatch) + limitPerBatch <= searchMax));
    return allSearchResults;
};

/**
 * Constant Definition for Time
 */
var ONE_DAY = 24*60*60*1000; // hours * minutes * seconds * milliseconds
var ONE_HOUR = 60*60*1000;
var ONE_MINUTE = 60*1000;
var ONE_SECOND = 1000;
var ONE_MILLISECOND = 1;

var pointInterval = 0;

/**
 * Data Structure to Store the Time Range Resolution
 */
var TIME_RANGE_RESOLUTION = [ // range in milliseconds, resolution value, resolution time (y - year, M - month, w - week, d - day, h - hour, m - min, s - second)
                              { range: 1000*60*60,    resvalue: 1, restime: "m" },
                              { range: 1000*60*60*3,   resvalue: 3, restime: "m" },
                              { range: 1000*60*60*6,   resvalue: 5, restime: "m" },
                              { range: 1000*60*60*12,   resvalue: 10, restime: "m" },
                              { range: 1000*60*60*24,   resvalue: 15, restime: "m" },
                              { range: 1000*60*60*24*3,  resvalue: 1, restime: "h" },
                              { range: 1000*60*60*24*7,  resvalue: 2, restime: "h" },
                              { range: 1000*60*60*24*14, resvalue: 4, restime: "h" },
                              { range: 1000*60*60*24*30, resvalue: 8, restime: "h" }
                              ];
/**
 * Return the Aggregation Given the Resolution Value and Resolution Time
 */
psgp_apm.serverlibrary.getDateAggregation = function (resvalue, restime) {
    var dateAggregation = resvalue.toString().concat(restime);
    switch(restime) {
    case 'd':
        pointInterval = resvalue * ONE_DAY;
        break;
    case 'h':
        pointInterval = resvalue * ONE_HOUR;
        break;
    case 'm':
        pointInterval = resvalue * ONE_MINUTE;
        break;
    case 's':
        pointInterval = resvalue * ONE_SECOND;
        break;
    };
    return dateAggregation;
};

/**
 * Get the Time Range Resolution from the TIME_RANGE_RESOLUTION
 */
psgp_apm.serverlibrary.getTimeRangeResolution = function (range) {
    var resvalue = 0;
    var restime = '';
    for (var i in TIME_RANGE_RESOLUTION) {
        if(range <= TIME_RANGE_RESOLUTION[i].range) {
            resvalue = TIME_RANGE_RESOLUTION[i].resvalue;
            restime = TIME_RANGE_RESOLUTION[i].restime;
            break;
        }
    }

    if(resvalue == 0 || restime == ''){
        resvalue = 1;
        restime = 'd';
    }

    return psgp_apm.serverlibrary.getDateAggregation(resvalue, restime);
};

/**
 * Get the Difference between two dates
 */
psgp_apm.serverlibrary.getDateDiff = function (date1, date2, time) {
    return Math.round(Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) / time);
};

/**
 * Retrive file url based on the company and bundle path
 */
psgp_apm.serverlibrary.getBundlePath = function (request) {
    var url = request.getURL().substring(0, request.getURL().indexOf('/app'));
    var companyID = nlapiGetContext().getCompany();
    var bundleID = nlapiGetContext().getBundleId() || '65074';

    return url + '/c.' + companyID + "/suitebundle" + bundleID + '/src';
};

/**
 * Retrieve file url based on filename and return in html code
 */
psgp_apm.serverlibrary.getFileHtmlCode = function (fileName) {
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
            htmlCode = file.getValue();
        }
    }
    if (fileName.indexOf('.json') > -1) {
        if (file === null) {
            file = nlapiLoadFile(fileId);
            htmlCode = file.getValue();
        }
    }
    return htmlCode;
};

/**
 * Retrieve record types and create JSON object
 */
psgp_apm.serverlibrary.getRecordTypesJson = function () {
    var rawData = nlapiGetPerformanceMetaData();
    return (!rawData) ? new Object() : rawData ;
};

/**
 * Validate scompid
 */
psgp_apm.serverlibrary.validateCompanyFilter = function (companyFilter) {
    var allowedList = [
                       'NLCORP'
                     , '5515663' //APM-NA
                     , '4642954' //APM-EU
                     , '3930908' //dev account
                     , '3547087' //dev account
                     , '3949168' //qa account
                     , '4197165' //qa automation
                     , '4294543' //qa
                     , '4290356' //qa
                     , '4290353' //qa
                     ];
    if (nlapiGetContext().getVersion() < 2015.2) {
        return '';
    }
    var thisCompany = nlapiGetContext().getCompany();
    if (allowedList.indexOf(thisCompany) == -1)  {
        return '';
    } else {
        if ((thisCompany == 'NLCORP') && (!companyFilter)) {
            return 'NLCORP';
        } else {
            return companyFilter;
        }
    }
};

/**
 * Is WSDL Released
 */
psgp_apm.serverlibrary.isWsdlReleased = function (wsDomain, currVersion) {
    var currVersionString = currVersion.replace('.', '_');
    var wsdlURL = 'https://' + wsDomain + '/wsdl/v' + currVersionString + '_0/netsuite.wsdl'
    var wsdlResponse;
    var wsdlBody;
    var message = 'Release Status: Unreleased';
    try {
        wsdlResponse = nlapiRequestURL(wsdlURL, null);
        wsdlBody = wsdlResponse.getBody();
    } catch (wsdlEx) {
        //if url is not found; treat as not released
        wsdlBody = message;
    }
    return (wsdlBody.indexOf(message) == -1) ? true : false;
}

/**
 * Get API Groups
 */
psgp_apm.serverlibrary.getAPIGroups = function (currVersion, isWsdlReleased) {
    var notReleasedVersion = currVersion;
    var supportedVersion = parseFloat(currVersion) - 3;
    var notSupportedVersion = parseFloat(supportedVersion) - 4;
    if (isWsdlReleased) {
        notReleasedVersion = parseFloat(notReleasedVersion) + .1;
        supportedVersion = parseFloat(supportedVersion) + .1;
        notSupportedVersion = parseFloat(notSupportedVersion) + .1;
    }
    return {
        notReleasedVersion: notReleasedVersion,
        supportedVersion: supportedVersion,
        notSupportedVersion: notSupportedVersion
    }
}
