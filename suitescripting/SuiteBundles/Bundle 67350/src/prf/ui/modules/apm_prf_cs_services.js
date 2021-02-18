/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2018     rwong            Initial
 * 2.00       10 Aug 2018     jmarimla         Chart and grid data
 * 3.00       28 Sep 2018     jmarimla         Drilldown timeline
 * 4.00       16 Oct 2018     jmarimla         Frht id
 * 5.00       11 Apr 2019     erepollo         Added drilldown param as flag when drilling down
 * 6.00       15 Apr 2019     rwong            Added support for filtering api calls, merge ids under name
 *
 */

APMPRF = APMPRF || {};

APMPRF._Services = function() {

    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
            kpi: '/app/site/hosting/scriptlet.nl?script=customscript_apm_prf_sl_kpi&deploy=customdeploy_apm_prf_sl_kpi' + _testModeParam,
            frhtLogs: '/app/site/hosting/scriptlet.nl?script=customscript_apm_prf_sl_frhtlogs&deploy=customdeploy_apm_prf_sl_frhtlogs' + _testModeParam,
    };

    var _globalParams = {};

    var _globalSettings = {
            compfil: null,
            operationId: null,
            parentId: null,
            frhtId: null,
            type: null,
            breadcrumbs: [],
            drillDown: false
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

    function refreshData() {
        var maskHeight = $(window).height() - 100;
        $('.psgp-main-content').css({
            height: maskHeight + 'px'
        }).addClass('psgp-loading-mask');

        var params = {
                operationId : _globalSettings.operationId,
                parentId: _globalSettings.parentId,
                frhtId: _globalSettings.frhtId,
                compfil: _globalSettings.compfil,
                drillDown: _globalSettings.drillDown
            };

        $.when(
                _getKPIData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);

                    if(params.drillDown != true) {
                        APMPRF.Components.refreshKPI(response.data);
                    }

                    _globalSettings.breadcrumbs = response.data.breadcrumbs;
                    APMPRF.Components.refreshBreadcrumbs();
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                })
        ).then(
                function () {
                    _globalSettings.frhtId = null;
                    $('.psgp-main-content').removeClass('psgp-loading-mask');
                }
        );

        APMPRF.Components.$FrhtGrid.psgpGrid('refreshDataRemote', params);
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