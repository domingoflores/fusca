/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Jun 2017     jmarimla         Initial
 * 2.00       16 Jun 2017     jmarimla         Perf details data
 * 3.00       14 Jul 2017     jmarimla         Pass parameters
 * 4.00       20 Jul 2017     rwong            Top Record Performance
 * 5.00       25 Jul 2017     jmarimla         Company filter
 * 6.00       11 Jun 2018     jmarimla         Translation engine
 * 7.00       17 Jun 2018     rwong            Translation strings
 * 8.00       26 Jul 2018     jmarimla         Logs backend
 *
 */

APMWSOD = APMWSOD || {};

APMWSOD._Services = function() {

    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
        kpi: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsod_sl_kpi&deploy=customdeploy_apm_wsod_sl_kpi' + _testModeParam,
        perfDetails: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsod_sl_perfdetails&deploy=customdeploy_apm_wsod_sl_perfdetails' + _testModeParam,
        topRecPerf: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsod_sl_toprecperf&deploy=customdeploy_apm_wsod_sl_toprecperf' + _testModeParam,
        wsoLogs: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsod_sl_wsologs&deploy=customdeploy_apm_wsod_sl_wsologs' + _testModeParam,
        wsrpLogs: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsod_sl_wsrplogs&deploy=customdeploy_apm_wsod_sl_wsrplogs' + _testModeParam
    };

    var _globalParams = {};

    var _globalSettings = {
        operation: '',
        startDateMS: '',
        endDateMS: '',
        compfil: '',
        integration: -999 // - ALL -
    };

    function getGlobalSettings() {
        return _globalSettings;
    }
    
    function getURL(name) {
        return _urls[name];
    }

    function _getKPIData(params) {
        var $xhr = $.ajax({
            url: _urls.kpi,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getPerfDetailsData(params) {
        var $xhr = $.ajax({
            url: _urls.perfDetails,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getTopRecPerfData(params) {
        var $xhr = $.ajax({
            url: _urls.topRecPerf,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function refreshData() {
        var maskHeight = $(window).height() - 100;
        $('.psgp-main-content').css({
            height: maskHeight + 'px'
        }).addClass('psgp-loading-mask');

        var params = {
                startDateMS: _globalSettings.startDateMS,
                endDateMS: _globalSettings.endDateMS,
                integration: _globalSettings.integration,
                operation: _globalSettings.operation,
                compfil: _globalSettings.compfil
        };

        $.when(
                _getKPIData(params)
                .done(function(response) {
                    if (!response.success) {
                    	alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);
                    APMWSOD.Components.refreshDetailsPortlet(response.data);
                })
                .fail(function(response) {
                    //console.log(response);
                	alert(APMTranslation.apm.common.alert.errorinsuitelet());
                }),

                _getPerfDetailsData(params)
                .done(function(response) {
                    if (!response.success) {
                    	alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);
                    APMWSOD.Highcharts.setPerfDetailsData(response.data);
                    APMWSOD.Highcharts.renderPerfDetailsExecutionChart();
                    APMWSOD.Highcharts.renderPerfDetailsThroughputChart();
                    APMWSOD.Highcharts.renderPerfDetailsErrorRateChart();
                    APMWSOD.Highcharts.renderPerfDetailsRecordsChart();
                })
                .fail(function(response) {
                    //console.log(response);
                	alert(APMTranslation.apm.common.alert.errorinsuitelet());
                }),

                _getTopRecPerfData(params)
                .done(function(response) {
                    if (!response.success) {
                    	alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);
                    APMWSOD.Highcharts.renderTopRecPerf(response.data);

                })
                .fail(function(response) {
                    //console.log(response);
                	alert(APMTranslation.apm.common.alert.errorinsuitelet());
                })

        ).then(
                function () {
                    $('.psgp-main-content').removeClass('psgp-loading-mask');
                }
        );


    }
    
    function convertToPSTms(dateObj, timeString) {
        var ISOdateObj = convertToDateObj(dateObj, timeString);
        var PSTdateMS = offsetToPSTms(ISOdateObj.getTime());

        return PSTdateMS;
    }
    
    function convertToDateObj (dateObj, timeString) {
        var y, m, d, hr, min;
        y = dateObj.getFullYear();
        m = dateObj.getMonth() + 1;
        d = dateObj.getDate();
        hr = timeString.split(':')[0];
        min = timeString.split(':')[1];
        //console.log(''+ y + ' ' + m + ' ' + d + ' ' + hr + ' ' + min);

        //format to YYYY-MM-DDThh:mm:00.000Z
        var ISOString = '' + y + '-' + (m < 10 ? ('0' + m) : m) + '-' + (d < 10 ? ('0' + d) : d) + 'T' + hr + ':' + min + ':00.000Z';
        //convert to dateObj
        var ISOdateObj = new Date(Date.parse(ISOString));
        return ISOdateObj;
    }
    
    //function used for highcharts dates 
    function offsetToPSTms(dateMS) {
        //convert to dateObj
        var ISOdateObj = new Date(dateMS);
        //convert to GMT netsuite string
        var GMTString = NSFORMAT.format({
            value: ISOdateObj,
            type: NSFORMAT.Type.DATETIME,
            timezone: NSFORMAT.Timezone.GMT
        });
        //convert to PST date object
        var PSTdateObj = NSFORMAT.parse({
            value: GMTString,
            type: NSFORMAT.Type.DATETIME,
            timezone: NSFORMAT.Timezone.AMERICA_LOS_ANGELES
        });
        //convert to MS
        var PSTdateMS = PSTdateObj.getTime();
        return PSTdateMS;
    }

    return {
        refreshData: refreshData,
        getURL: getURL,
        getGlobalSettings: getGlobalSettings,
        
        convertToPSTms: convertToPSTms,
        convertToDateObj: convertToDateObj,
        offsetToPSTms: offsetToPSTms
    };

};
