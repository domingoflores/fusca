/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       27 Oct 2017     jmarimla         Initial
 * 2.00       10 Nov 2017     jmarimla         Status, queue/processor data
 * 3.00       17 Nov 2017     jmarimla         Remove deployments call
 * 4.00       11 Dec 2017     jmarimla         Proc settings, elevated status
 * 5.00       14 Dec 2017     jmarimla         Utilization, concurrency
 * 6.00       18 Dec 2017     jmarimla         Scripts by priority
 * 7.00       11 Jun 2018     jmarimla         Translation engine
 * 8.00       02 Jul 2018     rwong            Translation strings
 * 9.00       19 Jul 2018     rwong            Translation strings
 * 10.00      03 Aug 2018     jmarimla         Translate custom date
 *
 */
APMSCPM = APMSCPM || {};

APMSCPM._Services = function() {

    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
        kpi: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_kpi&deploy=customdeploy_apm_scpm_sl_kpi' + _testModeParam,
        deployments: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_deployments&deploy=customdeploy_apm_scpm_sl_deployments' + _testModeParam,
        statuses: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_statuses&deploy=customdeploy_apm_scpm_sl_statuses' + _testModeParam,
        queueDetails: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_queuedetails&deploy=customdeploy_apm_scpm_sl_queuedetails' + _testModeParam,
        scriptPriority: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_scriptpriority&deploy=customdeploy_apm_scpm_sl_scriptpriority' + _testModeParam,
        procSettings: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_procsettings&deploy=customdeploy_apm_scpm_sl_procsettings' + _testModeParam,
        utilization: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_utilization&deploy=customdeploy_apm_scpm_sl_utilization' + _testModeParam,
        concurrencyHM: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_concurrencyhm&deploy=customdeploy_apm_scpm_sl_concurrencyhm' + _testModeParam,
        concurrencyDet: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_concurrencydet&deploy=customdeploy_apm_scpm_sl_concurrencydet' + _testModeParam,
        elevatedPrio: '/app/site/hosting/scriptlet.nl?script=customscript_apm_scpm_sl_elevatedprio&deploy=customdeploy_apm_scpm_sl_elevatedprio' + _testModeParam
    };

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

    function _getDeploymentsData(params) {
        var $xhr = $.ajax({
            url: _urls.deployments,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getStatusesData(params) {
        var $xhr = $.ajax({
            url: _urls.statuses,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getQueueDetailsData(params) {
        var $xhr = $.ajax({
            url: _urls.queueDetails,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getScriptPriorityData(params) {
        var $xhr = $.ajax({
            url: _urls.scriptPriority,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getProcSettingsData(params) {
        var $xhr = $.ajax({
            url: _urls.procSettings,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getUtilizationData(params) {
        var $xhr = $.ajax({
            url: _urls.utilization,
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

    function _getConcurrencyDetData(params) {
        var $xhr = $.ajax({
            url: _urls.concurrencyDet,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getElevatedPrioData(params) {
        var $xhr = $.ajax({
            url: _urls.elevatedPrio,
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
            endDateMS: endDateMS
        };

        _globalParams = params;

        var _getConcurrencyPortletData;
        if (endDateMS - startDateMS > 1000 * 60 * 60 * 24 * 3) { //above 3 days show heatmap
            _getConcurrencyPortletData = _getConcurrencyHMData;
        } else {
            _getConcurrencyPortletData = _getConcurrencyDetData;
        }

        $.when(
            _getConcurrencyPortletData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                if (endDateMS - startDateMS > 1000 * 60 * 60 * 24 * 3) { //above 3 days show heatmap
                    APMSCPM.Highcharts.renderConcurrencyHMChart(response.data);
                } else {
                    var $container = APMSCPM.Components.$ConcurrencyPortlet.psgpPortlet('getBody');
                    $container.height(400);
                    APMSCPM.Highcharts.renderConcurrencyDetChart(response.data, $container);
                }
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getKPIData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                _globalSettings.asOf = response.config.refreshDate;
                APMSCPM.Components.$OverviewKPI.psgpKPIPanel('refreshData', response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getStatusesData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMSCPM.Highcharts.renderStatusesChart(response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getProcSettingsData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMSCPM.Components.updateProcSettings(response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getElevatedPrioData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMSCPM.Highcharts.renderElevatedPrioChart(response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getUtilizationData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMSCPM.Highcharts.renderUtilizationChart(response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getScriptPriorityData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMSCPM.Highcharts.renderScriptPriorityChart(response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getQueueDetailsData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMSCPM.Highcharts.renderQueueInstancesChart(response.data.instances);
                APMSCPM.Highcharts.renderQueueWaitTimeChart(response.data.waitTime);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            })

        ).then(
            function() {
                APMSCPM.Components.$SettingsDateRange.trigger('updateLabel');
                $('.psgp-main-content').removeClass('psgp-loading-mask');
                _globalSettings.startDateMS = startDateMS;
                _globalSettings.endDateMS = endDateMS;
            }
        );

        APMSCPM.Components.$DeploymentsGrid.psgpGrid('refreshDataRemote', params);

    }

    function refreshConcurrencyDetailsData(params) {
        var $container = $('.apm-scpm-dialog-concurrencydet .chart');

        _getConcurrencyDetData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMSCPM.Highcharts.renderConcurrencyDetChart(response.data, $container);
            })
            .fail(function(response) {
                //console.log(response);
            	alert(APMTranslation.apm.common.alert.errorinsuitelet());
            });

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

    return {
        getURL: getURL,
        refreshData: refreshData,
        refreshConcurrencyDetailsData: refreshConcurrencyDetailsData,
        getGlobalSettings: getGlobalSettings,
        convertToPSTms: convertToPSTms,
        convertMStoDateTimePST: convertMStoDateTimePST
    };

};