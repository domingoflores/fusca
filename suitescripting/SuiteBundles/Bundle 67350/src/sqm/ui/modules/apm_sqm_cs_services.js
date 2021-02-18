/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Sep 2016     jmarimla         Initial
 * 2.00       11 Oct 2016     jmarimla         Get count chart data
 * 3.00       09 Nov 2016     jmarimla         Grid refresh data
 * 4.00       11 Nov 2016     jmarimla         kpi panel data
 * 5.00       18 Nov 2016     jmarimla         Queue status data
 * 6.00       23 Nov 2016     jmarimla         Call render heatmap
 * 7.00       06 Dec 2016     jmarimla         Get global params
 * 8.00       09 Dec 2016     rwong            Added heatmap data
 * 9.00       12 Dec 2016     jmarimla         Date converters
 * 10.00      10 Jan 2017     jmarimla         Apply global date range
 * 11.00      12 Jan 2017     rwong            Combine Queue Utilization and Script Instance Count
 * 12.00      16 Jan 2017     rwong            Updated Queue Status
 * 13.00      25 Jan 2017     rwong            Queue Status update
 * 14.00      01 Feb 2017     rwong            Added fix ensure pending records are not bold
 * 15.00      22 Sep 2017     rwong            Support for SCP
 * 16.00      06 Jul 2018     jmarimla         Translation readiness
 *
 */
APMSQM = APMSQM || {};

APMSQM._Services = function() {

    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
        scriptDetails: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sqm_sl_scriptdetails&deploy=customdeploy_apm_sqm_sl_scriptdetails' + _testModeParam,
        kpi: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sqm_sl_kpi&deploy=customdeploy_apm_sqm_sl_kpi' + _testModeParam,
        queueStatus: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sqm_sl_queuestatus&deploy=customdeploy_apm_sqm_sl_queuestatus' + _testModeParam,
        utilization: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sqm_sl_utilization&deploy=customdeploy_apm_sqm_sl_utilization' + _testModeParam,
        count: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sqm_sl_count&deploy=customdeploy_apm_sqm_sl_count' + _testModeParam,
        instances: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sqm_sl_instances&deploy=customdeploy_apm_sqm_sl_instances' + _testModeParam,
        heatmap: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sqm_sl_heatmap&deploy=customdeploy_apm_sqm_sl_heatmap' + _testModeParam
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

    function _getQueueStatusData(params) {
        var $xhr = $.ajax({
            url: _urls.queueStatus,
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

    function _getCountData(params) {
        var $xhr = $.ajax({
            url: _urls.count,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }

    function _getHeatMapData(params) {
        var $xhr = $.ajax({
            url: _urls.heatmap,
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
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    function convertMStoDateTimePST(dateObj, timeString) {
        var y, m, d, hr, min;
        y = dateObj.getFullYear();
        m = dateObj.getMonth() + 1;
        d = dateObj.getDate();
        hr = timeString.split(':')[0];
        min = timeString.split(':')[1];

        var dateStr = $.datepicker.formatDate('M d', dateObj);
        var timeStr = formatAMPM(parseInt(hr, 10), parseInt(min, 10));

        return dateStr + ' ' + timeStr;
    }

    function getNowDateTime(dateMS) {
        var dateObj = new Date(dateMS);
        y = dateObj.getFullYear();
        m = dateObj.getMonth() + 1;
        d = dateObj.getDate();
        hr = dateObj.getHours();
        min = dateObj.getMinutes();

        var dateStr = $.datepicker.formatDate('M d', dateObj);
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
            endDateMS: endDateMS
        };

        _globalParams = params;

        $.when(
            _getUtilizationData(params)
            .done(function(response) {
                if (!response.success) {
                    alert('Error encountered in search');
                    return;
                }
                //console.log(response);
                var $container = APMSQM.Components.$UtilizationPortlet.psgpPortlet('getBody').find('.psgp-utilization-chart');
                APMSQM.Highcharts.renderUtilizationChart(response.data, $container);
            })
            .fail(function(response) {
                //console.log(response);
                alert('Error encountered in suitelet');
            }),

            _getCountData(params)
            .done(function(response) {
                if (!response.success) {
                    alert('Error encountered in search');
                    return;
                }
                //console.log(response);
                var $container = APMSQM.Components.$UtilizationPortlet.psgpPortlet('getBody').find('.psgp-count-chart');
                APMSQM.Highcharts.renderCountChart(response.data, $container);
            })
            .fail(function(response) {
                //console.log(response);
                alert('Error encountered in suitelet');
            }),

            _getKPIData(params)
            .done(function(response) {
                if (!response.success) {
                    alert('Error encountered in search');
                    return;
                }
                //console.log(response);
                APMSQM.Components.$OverviewKPI.psgpKPIPanel('refreshData', response.data);
            })
            .fail(function(response) {
                //console.log(response);
                alert('Error encountered in suitelet');
            }),

            _getQueueStatusData()
            .done(function(response) {
                if (!response.success) {
                    alert('Error encountered in search');
                    return;
                }
                //console.log(response);
                APMSQM.Components.$QueueStatusDate.trigger('updateData', 'As of ' + response.data.refreshDate);
                _globalSettings.asOf = response.data.refreshDate;

                APMSQM.Components.$QueueStatusPortlet.psgpPortlet('getBody').empty();

                var queueData = response.data.queueData;

                for (var i = 0; i <= response.data.maxQueues; i++) {

                    var queueSection = $('<div>').attr('id', 'apm-sqm-queue-' + i).addClass('apm-sqm-section');
                    var queueContent = $('<div>').addClass('apm-sqm-content');
                    var queueCircle = $('<div>').addClass('apm-sqm-circle');
                    var queueCircleText = '';
                    if( i == 0)
                        queueCircleText= $('<div>').addClass('apm-sqm-circle-text').append('-');
                    else
                        queueCircleText= $('<div>').addClass('apm-sqm-circle-text').append(i);
                    var queueHeader = $('<div>').addClass('apm-sqm-header');
                    var queueHeaderMore = $('<div>').addClass('apm-sqm-header-text').addClass('apm-sqm-header-more').append('...');

                    var data = queueData[i];

                    if (data.length > 0) {
                        for (var j = 0; j < data.length; j++) {
                            var queueDeploymentName = data[j].deploymentName;
                            var queueStatus = data[j].status;
                            var queueStartDate = data[j].startDate;
                            if (queueStatus == 'Pending' || queueStatus == 'Processing') {
                                queueCircle.addClass('apm-sqm-circle-busy');
                            } else {
                                queueCircle.addClass('apm-sqm-circle-available');
                            }
                            if (queueStatus == 'Processing') {
                                queueHeader.append($('<div>').addClass('apm-sqm-header-text').addClass('apm-sqm-header-text-first').append(queueDeploymentName));
                            } else if (queueStatus == 'Pending') {
                                queueHeader.append($('<div>').addClass('apm-sqm-header-text').append(queueDeploymentName));
                            } else {
                                queueHeader.append($('<div>').addClass('apm-sqm-header-text').addClass('apm-sqm-header-text-lastrun').append("Last Run - " + queueStartDate));
                            }
                        }
                    } else {
                        queueCircle.addClass('apm-sqm-circle-available');
                        queueHeader.append($('<div>').addClass('apm-sqm-header-text').addClass('apm-sqm-header-text-lastrun').append("No Data for Last Run"));
                    }

                    queueCircle.append(queueCircleText);
                    queueContent.append(queueCircle).append(queueHeader);
                    queueSection.append(queueContent);
                    if (data.length > 3) {
                        queueSection.append(queueHeaderMore);
                    }

                    APMSQM.Components.$QueueStatusPortlet.psgpPortlet('getBody').append(queueSection);
                }

                $('.apm-sqm-section').each(function(index, value) {
                    $(value).data('height', $(value).find('.apm-sqm-content').height());
                    $(value).find('.apm-sqm-content').css({
                        height: 45
                    });
                });

                $('.apm-sqm-section .apm-sqm-header-more').click(function() {
                    if ($(this).data('expanded')) {
                        $(this).parent().find('.apm-sqm-content').animate({
                            height: 45
                        });
                        $(this).data('expanded', false);
                    } else {
                        $(this).parent().find('.apm-sqm-content').animate({
                            height: $(this).parent().data('height')
                        });
                        $(this).data('expanded', true);
                    }
                });

            })
            .fail(function(response) {
                //console.log(response);
                alert('Error encountered in suitelet');
            }),

            _getHeatMapData(params)
            .done(function(response) {
                if (!response.success) {
                    alert('Error encountered in search');
                    return;
                }
                //console.log(response);
                var $container = APMSQM.Components.$HeatMapPortlet.psgpPortlet('getBody');
                APMSQM.Highcharts.renderHeatMapChart(response.data, $container);
            })
            .fail(function(response) {
                //console.log(response);
                alert('Error encountered in suitelet');
            })

        ).then(function() {

            APMSQM.Components.$SettingsDateRange.trigger('updateLabel');
            $('.psgp-main-content').removeClass('psgp-loading-mask');

        });

        APMSQM.Components.$OverviewGrid.psgpGrid('refreshDataRemote', params);

    }

    return {
        getURL: getURL,
        getGlobalSettings: getGlobalSettings,
        getGlobalParams: getGlobalParams,
        refreshData: refreshData,
        convertToPSTms: convertToPSTms,
        convertMStoDateTimePST: convertMStoDateTimePST,
        getNowDateTime: getNowDateTime
    };

};