/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Aug 2016     jmarimla         Initial
 * 2.00       24 Aug 2016     jmarimla         Logic bug
 * 3.00       23 Sep 2016     jmarimla         Added file functions
 * 4.00       09 Sep 2016     jmarimla         Added consolidateSearchResults
 * 5.00       11 Nov 2016     jmarimla         Added getArraySum and getArrayAve
 * 6.00       18 Nov 2016     jmarimla         Added convertMStoDatePST
 * 7.00       09 Dec 2016     rwong            Added dateRoundDownToNearest, dateAggregation
 * 8.00       20 Jan 2017     jmarimla         Added getAggregationConfig
 * 9.00       03 Feb 2017     jmarimla         Corrected aggregations
 * 10.00      25 Jul 2017     jmarimla         Validate company filter
 * 11.00      09 Sep 2017     jmarimla         BreakdownDate
 * 12.00      18 Sep 2017     jmarimla         Add account
 * 13.00      09 Oct 2017     jmarimla         Use abstraction module
 * 14.00      22 Dec 2017     jmarimla         Added dateAggregation bucket
 * 15.00      22 Nov 2018     jmarimla         convertMStoDateTimePSTtoSQLFormat
 * 16.00      04 Mar 2019     jmarimla         APM NA
 *
 */

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

define(['./apm_abstraction_ss2'],

function(nAPM) {

    function getBundleId() {
        var bundleID = nAPM.getRuntime().getCurrentScript().bundleIds;
        bundleID = (nAPM.getRuntime().getCurrentScript().bundleIds[0]) ? nAPM.getRuntime().getCurrentScript().bundleIds[0] : '89490';
        return bundleID;
    }

    function getFile(filename) {
        if (!filename) throw 'filename is required.';
        var file_search = nAPM.getSearch().create({
            type: 'file'
          , filters: [['name', nAPM.getSearch().Operator.IS, filename]]
        });
        var file_results = file_search.run().getRange(0,1);
        if (!file_results || file_results.length < 1) {
            throw 'getContentsFromFile file not found';
        }
        var fileObj = nAPM.getFile().load({
            id: file_results[0].id
        });
        return fileObj;
    }

    return {

        isValidObject : function(objectToTest) {
            var isValidObject = false;
            isValidObject = (objectToTest!=null && objectToTest!='' && objectToTest!=undefined) ? true : false;
            return isValidObject;
        },

        getContentsFromFile : function ( filename ) {
            var fileObj = getFile(filename);
            return fileObj.getContents();
        },

        getFileURL : function ( filename ) {
            var fileObj = getFile(filename);
            return fileObj.url;
        },

        getBundlePath : function (context) {
            var url = context.request.url.substring(0, context.request.url.indexOf('/app'));
            var companyID = nAPM.getRuntime().accountId;
            var bundleID = getBundleId();

            return url + '/c.' + companyID + "/suitebundle" + bundleID + '/src';
        },

        getBundleId : getBundleId,

        convertMStoDateTime : function( dateMS, timeOnly ) {
            if (!dateMS) return '';
            var format = nAPM.getFormat();
            var tempDateObj = new Date(parseInt(dateMS));
            var tempDateStrPST = format.format({
                value: tempDateObj, type: format.Type.DATETIME
            });
            var dateObj = format.parse({
                value: tempDateStrPST, type: format.Type.DATETIME, timezone: format.Timezone.AMERICA_LOS_ANGELES
            });
            var dateStr = format.format({
                value: dateObj, type: format.Type.DATE
            });
            var timeStr = format.format({
                value: dateObj, type: format.Type.TIMEOFDAY
            });
            var dateTime = (timeOnly) ? timeStr : dateStr + ' ' + timeStr;
            return (dateTime) ? dateTime : '';
        },

        convertMStoDateTimePST : function( dateMS ) {
            if (!dateMS) return '';
            var format = nAPM.getFormat();
            var tempDateObj = new Date(parseInt(dateMS));
            var tempDateStrPST = format.format({
                value: tempDateObj, type: format.Type.DATETIME
            });
            var dateObj = format.parse({
                value: tempDateStrPST, type: format.Type.DATETIME
            });
            var dateStr = format.format({
                value: dateObj, type: format.Type.DATE
            });
            var timeStr = format.format({
                value: dateObj, type: format.Type.TIMEOFDAY
            });
            var dateTime = dateStr + ' ' + timeStr;
            return (dateTime) ? dateTime : '';
        },
        
        convertMStoDateTimePSTtoSQLFormat : function( dateMS ) {
            //converts to format: YYYY-MM-DD HH24:MI:SS
            if (!dateMS) return '';
            var tempDateObj = new Date(parseInt(dateMS));
            var YYYY = tempDateObj.getFullYear();
            var MM = tempDateObj.getMonth()+1;
            MM = (MM < 10) ? '0' + MM : MM;
            var DD = tempDateObj.getDate();
            DD = (DD < 10) ? '0' + DD : DD;
            var HH24 = tempDateObj.getHours();
            HH24 = (HH24 < 10) ? '0' + HH24 : HH24;
            var MI = tempDateObj.getMinutes();
            MI = (MI < 10) ? '0' + MI : MI;
            var SS = tempDateObj.getSeconds();
            SS = (SS < 10) ? '0' + SS : SS;
            var dateTime = YYYY + '-' + MM + '-' + DD + ' ' + HH24 + ':' + MI + ':' + SS;
            return dateTime;
        },

        convertSecondsToHHMMSS : function (seconds) {
            seconds = Number(seconds);
            var h = Math.floor(seconds / 3600);
            var m = Math.floor(seconds % 3600 / 60);
            var s = seconds % 3600 % 60;
            return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
        },

        consolidateSearchResults : function (searchObj, batchLimit, iterLimit, searchLimit) {
            // default limits: 1000 results per getResult, 50 calls to getResult (500 governance units), 10000 results max
            var limitPerBatch = (batchLimit) ? batchLimit : 1000;
            var limitIterations = (iterLimit)? iterLimit : 50;
            var searchMax = (searchLimit) ? searchLimit : 10000;
            var countPerBatch = 0;
            var iterations = 0;
            var allSearchResults = new Array();
            do {
                var searchSubSet = searchObj.run().getRange(iterations*limitPerBatch, (iterations*limitPerBatch) + limitPerBatch);
                countPerBatch = searchSubSet.length;
                allSearchResults = allSearchResults.concat(searchSubSet);
                iterations++;
            } while ((countPerBatch == limitPerBatch) && (iterations < limitIterations) && ((iterations*limitPerBatch) + limitPerBatch <= searchMax));
            return allSearchResults;
        },

        getArraySum : function (arr) {
            if (!arr || arr.length == 0) return 0;
            return arr.reduce(function (a, b) {
                return a + b;
              });
        },

        getArrayAve : function (arr) {
            if (!arr || arr.length == 0) return 0;
            return this.getArraySum(arr) / arr.length;
        },

        dateRoundDownToNearest: function(dateMS, targetMS) {
            return dateMS - (dateMS % targetMS);
        },

        dateAggregation : function( startDateMS, endDateMS, resolutionMS) {
            var dateAggregationArray = new Array();

            for(var i = startDateMS; i < endDateMS + resolutionMS; i = i + resolutionMS ){
                dateAggregationArray.push({
                    start: i,
                    end: i + resolutionMS
                });
            }

            return dateAggregationArray;
        },
        
        getAggregationConfig : function (startDateMS, endDateMS) {
            var TIME_RANGE_RESOLUTION = [ 
                { range: 1000*60*60, resolutionMS: 1000*60*3, roundingMS: 1000*60 },
                { range: 1000*60*60*3, resolutionMS: 1000*60*10, roundingMS: 1000*60*10 },
                { range: 1000*60*60*6, resolutionMS: 1000*60*15, roundingMS: 1000*60*15 },
                { range: 1000*60*60*12, resolutionMS: 1000*60*30, roundingMS: 1000*60*30 },
                { range: 1000*60*60*24, resolutionMS: 1000*60*60, roundingMS: 1000*60*60 },
                { range: 1000*60*60*24*3, resolutionMS: 1000*60*60*3, roundingMS: 1000*60*60 },
                { range: 1000*60*60*24*7, resolutionMS: 1000*60*60*8, roundingMS: 1000*60*60 },
                { range: 1000*60*60*24*14, resolutionMS: 1000*60*60*12, roundingMS: 1000*60*60 },
                { range: 1000*60*60*24*30, resolutionMS: 1000*60*60*24, roundingMS: 1000*60*60 },
                //custom higher date ranges
                { range: 1000*60*60*24*90, resolutionMS: 1000*60*60*24*7, roundingMS: 1000*60*60 },
                { range: 1000*60*60*24*180, resolutionMS: 1000*60*60*24*14, roundingMS: 1000*60*60 },
                { range: 1000*60*60*24*390, resolutionMS: 1000*60*60*24*30, roundingMS: 1000*60*60 }
            ];
            
            var diffMS = endDateMS - startDateMS;
            
            //defaults
            var configObj = {
                    diffMS : diffMS,
                    resolutionMS : 1000*60*60*90,
                    roundingMS: 1000*60*60
            };
            
            for (var i in TIME_RANGE_RESOLUTION) {
                if(diffMS <= TIME_RANGE_RESOLUTION[i].range) {
                    configObj.resolutionMS = TIME_RANGE_RESOLUTION[i].resolutionMS;
                    configObj.roundingMS = TIME_RANGE_RESOLUTION[i].roundingMS;
                    break;
                }
            }
            
            return configObj;
        },
        
        validateCompanyFilter: function (companyFilter) {
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
            var thisCompany = nAPM.getRuntime().accountId;
            if (allowedList.indexOf(thisCompany) == -1)  {
                return '';
            } else {
                if ((thisCompany == 'NLCORP') && (!companyFilter)) {
                    return 'NLCORP';
                } else {
                    return companyFilter;
                }      
            }
        },
        
        breakdownDate: function (dateMS) {
            //[fullYear, Month, Date, Hours, Minutes]
            if (!dateMS) return [0,0,0,0,0];
            var dateObj = new Date(dateMS);
            return [
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                dateObj.getHours(),
                dateObj.getMinutes(),
                dateObj.getSeconds()
            ];
        }

    };

});
