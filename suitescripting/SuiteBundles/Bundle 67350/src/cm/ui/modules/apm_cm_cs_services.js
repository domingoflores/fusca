/**
 * Copyright © 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       18 Jan 2018     jmarimla         Initial
 * 2.00       25 Jan 2018     rwong            Added kpi
 * 3.00       29 Jan 2018     rwong            Added concurrency heatmap
 * 4.00       06 Feb 2018     jmarimla         Concurrency details
 * 5.00       09 Feb 2018     jmarimla         Instance data
 * 6.00       19 Feb 2018     rwong            Violation chart
 * 7.00       23 Feb 2018     jmarimla         Remove concurrency details
 * 8.00       02 Mar 2018     jmarimla         Violations data
 * 9.00       12 Apr 2018     jmarimla         Concurrency data
 * 10.00      17 Apr 2018     jmarimla         Customer debugging
 * 11.00      11 Jun 2018     jmarimla         Translation engine
 * 12.00      02 Jul 2018     justaris         Translation Readiness
 * 13.00      03 Aug 2018     jmarimla         Translate custom date
 * 14.00      14 Dec 2018     jmarimla         Limit not available
 * 15.00      07 Jan 2019     rwong            Added note to customer debugging for concurrency limit
 * 16.00      12 Feb 2019     rwong            Support concurrency limit for customer debugging 
 *
 */

APMCM = APMCM || {};

APMCM._Services = function() {

    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
            kpi: '/app/site/hosting/scriptlet.nl?script=customscript_apm_cm_sl_kpi&deploy=customdeploy_apm_cm_sl_kpi' + _testModeParam,
            concurrencyHM: '/app/site/hosting/scriptlet.nl?script=customscript_apm_cm_sl_concurrencyhm&deploy=customdeploy_apm_cm_sl_concurrencyhm' + _testModeParam,
            violationsHM: '/app/site/hosting/scriptlet.nl?script=customscript_apm_cm_sl_violationshm&deploy=customdeploy_apm_cm_sl_violationshm' + _testModeParam,
    };

    var _kpi1 = [];
    var _kpi2 = [];

    var _globalParams = {};

    var _globalSettings = {
        dateRangeSelect: '' + 1000 * 60 * 60 * 24,
        startDateMS: '',
        asOf: ''
    };

    function getGlobalSettings() {
        return _globalSettings;
    }

    function getURL(name) {
        return _urls[name];
    }

    function getGlobalParams() {
        return _globalParams;
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

    function _getConcurrencyHMData(params) {
        var $xhr = $.ajax({
            url: _urls.concurrencyHM,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getViolationsHMData(params) {
        var $xhr = $.ajax({
            url: _urls.violationsHM,
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

        var startDateMS, endDateMS;
        if (_globalSettings.dateRangeSelect.indexOf('custom_') !== -1) {
            var dateSplit = _globalSettings.dateRangeSelect.split('_');
            endDateMS = dateSplit[2];
            startDateMS = dateSplit[1];
        } else {
            endDateMS = parseInt(_globalSettings.endDateMS);
            startDateMS = endDateMS - parseInt(_globalSettings.dateRangeSelect);
        }

        var params = {
            startDateMS: startDateMS,
            endDateMS: endDateMS,
            compfil: _globalSettings.compfil
        };

        _globalParams = params;

        $.when(
                _getConcurrencyHMData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);
                    APMCM.Highcharts.setConcurrencyHMChart(response.data);
                    _globalSettings.asOf = response.data.config.refreshDate;
                    _kpi1 = response.data.kpi;
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                }),

                _getViolationsHMData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);
                    APMCM.Highcharts.setViolationsHMChart(response.data);
                    _kpi2 = response.data.kpi;
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                })
        ).then(
                function () {

                    if (_kpi1 && _kpi2 && _kpi2.length >= 2) {
                        _kpi1.splice(_kpi1.length - 1, 0, _kpi2[0], _kpi2[1]);
                        APMCM.Components.$OverviewKPI.psgpKPIPanel('refreshData', _kpi1);
                    }

                    APMCM.Highcharts.renderConcurrencyHMChart();
                    APMCM.Components.$SettingsDateRange.trigger('updateLabel');
                    $('.psgp-main-content').removeClass('psgp-loading-mask');
                    _globalSettings.startDateMS = startDateMS;
                    _globalSettings.endDateMS = endDateMS;
                }
        );
    }

    function convertToPSTms(dateObj, timeString) {
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

    function formatAMPM(hours, minutes) {
        var ampm = hours >= 12 ? APMTranslation.apm.common.time.pm() : APMTranslation.apm.common.time.am();
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    function convertMStoDateTimePST(dateObj, timeString) {
        var y, m, d, hr, min;
        y = dateObj.getFullYear();
        m = dateObj.getMonth();
        d = dateObj.getDate();
        hr = timeString.split(':')[0];
        min = timeString.split(':')[1];

        var dateStr = Highcharts.dateFormat('%b %e', new Date(Date.UTC(y, m, d)));
        var timeStr = formatAMPM(parseInt(hr, 10), parseInt(min, 10));

        return dateStr + ' ' + timeStr;
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
        getURL: getURL,
        refreshData: refreshData,
        getGlobalSettings: getGlobalSettings,
        convertToPSTms: convertToPSTms,
        convertMStoDateTimePST: convertMStoDateTimePST,
        offsetToPSTms: offsetToPSTms
    };

 };