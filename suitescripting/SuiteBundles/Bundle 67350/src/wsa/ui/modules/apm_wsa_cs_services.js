/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Mar 2017     jmarimla         Initial
 * 2.00       10 Mar 2017     jmarimla         Overview portlet data
 * 3.00       17 Mar 2017     jmarimla         Top WSRP data
 * 4.00       22 Mar 2017     jmarimla         WSO breakdown data
 * 5.00       31 Mar 2017     jmarimla         Statuses data
 * 6.00       21 Apr 2017     jmarimla         Integration data
 * 7.00       12 May 2017     jmarimla         Global settings
 * 11.00      16 May 2017     jmarimla         Top WSO data
 * 12.00      17 May 2017     jmarimla         WSRP popup data
 * 13.00      06 Jun 2017     jmarimla         Integration data
 * 14.00      07 Jun 2017     jmarimla         Set dateMS settings
 * 15.00      22 Jun 2017     jmarimla         API data
 * 16.00      17 Jul 2017     jmarimla         Record types data
 * 17.00      25 Jul 2017     jmarimla         Customer param
 * 18.00      01 Aug 2017     jmarimla         Pass ws domain
 * 19.00      02 Oct 2017     jmarimla         Unused code
 * 20.00      28 Nov 2017     jmarimla         Pass compfil
 * 21.00      11 Jun 2018     jmarimla         Translation engine
 * 22.00      02 Jul 2018     rwong            Translation strings
 * 23.00      03 Aug 2018     jmarimla         Translate custom date
 *
 */
APMWSA = APMWSA || {};

APMWSA._Services = function() {

    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
        recordTypes: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sl_recordtypes&deploy=customdeploy_apm_sl_recordtypes',
        kpi: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsa_sl_kpi&deploy=customdeploy_apm_wsa_sl_kpi' + _testModeParam,
        topOperations: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsa_sl_topoperations&deploy=customdeploy_apm_wsa_sl_topoperations' + _testModeParam,
        wsrpDetails: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsa_sl_wsrpdetails&deploy=customdeploy_apm_wsa_sl_wsrpdetails' + _testModeParam,
        topWsrp: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsa_sl_topwsrp&deploy=customdeploy_apm_wsa_sl_topwsrp' + _testModeParam,
        statuses: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsa_sl_statuses&deploy=customdeploy_apm_wsa_sl_statuses' + _testModeParam,
        api: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsa_sl_api&deploy=customdeploy_apm_wsa_sl_api' + _testModeParam,
        integration: '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsa_sl_integration&deploy=customdeploy_apm_wsa_sl_integration' + _testModeParam
    };

    var _globalParams = {};

    var _globalSettings = {
        dateRangeSelect: '' + 1000 * 60 * 60 * 24,
        startDateMS: '',
        asOf: '',
        compfil: '',
        integration: -999 // - ALL -
    };

    var _recordTypes = [];

    function getRecordName(recId) {
        var typeMatch = _recordTypes.filter(function(obj) {
            return obj.id == recId;
        });
        if (!typeMatch || typeMatch.length < 1) return recId;
        var recordName = typeMatch[0].name;
        return recordName ? recordName : '';
    }

    function getGlobalSettings() {
        return _globalSettings;
    }

    function getURL(name) {
        return _urls[name];
    }

    function getGlobalParams() {
        return _globalParams;
    }

    function _getRecordTypesData(params) {
        var $xhr = $.ajax({
            url: _urls.recordTypes,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
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

    function _getTopOperationsData(params) {
        var $xhr = $.ajax({
            url: _urls.topOperations,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getWsrpDetailsData(params) {
        var $xhr = $.ajax({
            url: _urls.wsrpDetails,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getTopWsrpData(params) {
        var $xhr = $.ajax({
            url: _urls.topWsrp,
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

    function _getApiData(params) {
        var $xhr = $.ajax({
            url: _urls.api,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getIntegrationData(params) {
        var $xhr = $.ajax({
            url: _urls.integration,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
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
            integration: _globalSettings.integration,
            compfil: _globalSettings.compfil,
            wsDomain: WSA_PARAMS.wsDomain
        };

        _globalParams = params;

        $.when(
            _getRecordTypesData(params)
            .done(function(response) {
                if (!response.success) {
                	alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                _recordTypes = response.data;
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
                APMWSA.Components.$OverviewKPI.psgpKPIPanel('refreshData', response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getTopOperationsData(params)
            .done(function(response) {
                if (!response.success) {
                	alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMWSA.Highcharts.setTopOperationsData(response.data);
                APMWSA.Highcharts.renderOperationsExecutionChart();
                APMWSA.Highcharts.renderOperationsThroughputChart();
                APMWSA.Highcharts.renderOperationsErrorRateChart();
                APMWSA.Highcharts.renderOperationsRecordsChart();
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getTopWsrpData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMWSA.Highcharts.setTopWsrpData(response.data);
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
                APMWSA.Highcharts.renderWsoStatusChart(response.data.wso);
                APMWSA.Highcharts.renderWsrpStatusChart(response.data.wsrp);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            }),

            _getApiData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMWSA.Highcharts.renderApiUsageChart(response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            })

        ).then(
            function() {
                APMWSA.Highcharts.renderTopWsrpChart();
                APMWSA.Components.$SettingsDateRange.trigger('updateLabel');
                $('.psgp-main-content').removeClass('psgp-loading-mask');
                _globalSettings.startDateMS = startDateMS;
                _globalSettings.endDateMS = endDateMS;
            }
        );
    }

    function refreshWsrpDetailsData(params) {

        params.startDateMS = _globalSettings.startDateMS;
        params.endDateMS = _globalSettings.endDateMS;
        params.integration = _globalSettings.integration;
        params.compfil = _globalSettings.compfil;

        _getWsrpDetailsData(params)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }
                //console.log(response);
                APMWSA.Highcharts.setWsrpDetailsData(response.data);
                APMWSA.Highcharts.renderWsrpDetailsChart();
            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            });
    }

    function refreshIntegrationData(params) {
        var integParams = {
            compfil: params.compfil
        };
        _getIntegrationData(integParams)
            .done(function(response) {
                if (!response.success) {
                    alert(APMTranslation.apm.common.alert.errorinsearch());
                    return;
                }

                //update 
                if (response.data) {
                    $('.apm-wsa-settings-daterange-dialog .field-integration option').remove();
                    var optionsMarkUp = '';
                    for (var i in response.data) {
                        var customValue = response.data[i].id;
                        var customLabel = response.data[i].name;
                        var markUp = '<option value="' + customValue + '">' + customLabel + '</option>';
                        optionsMarkUp += markUp;
                    }
                    $('.apm-wsa-settings-daterange-dialog .field-integration select').append(optionsMarkUp);
                    $('.apm-wsa-settings-daterange-dialog .field-integration .psgp-combobox').selectmenu('refresh');
                }

                //restore old value
                if (params.restoreOldValue) {
                    $('.apm-wsa-settings-daterange-dialog .field-integration select').val(params.integration);
                    $('.apm-wsa-settings-daterange-dialog .field-integration .psgp-combobox').selectmenu('refresh');
                }

            })
            .fail(function(response) {
                //console.log(response);
                alert(APMTranslation.apm.common.alert.errorinsuitelet());
            })
    }

    return {
        getURL: getURL,
        getRecordName: getRecordName,
        refreshData: refreshData,
        refreshWsrpDetailsData: refreshWsrpDetailsData,
        refreshIntegrationData: refreshIntegrationData,
        getGlobalSettings: getGlobalSettings,
        convertToPSTms: convertToPSTms,
        convertMStoDateTimePST: convertMStoDateTimePST
    };

};