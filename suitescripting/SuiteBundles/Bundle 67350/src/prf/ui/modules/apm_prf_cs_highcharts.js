/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2018     rwong            Initial
 * 2.00       10 Aug 2018     jmarimla         Frht chart
 * 3.00       04 Sep 2018     jmarimla         Frht button icons
 * 4.00       28 Sep 2018     jmarimla         Drilldown timeline
 * 5.00       04 Oct 2018     rwong            Api Calls backend
 * 6.00       26 Oct 2018     jmarimla         Chart labels
 * 7.00       30 Oct 2018     jmarimla         Tooltip
 * 8.00       14 Dec 2018     jmarimla         Update labels
 * 9.00       15 Jan 2019     jmarimla         Chart min height
 * 10.00      17 Jan 2019     jmarimla         Destory chart
 * 11.00      21 Mar 2019     rwong            Added support for requestUrl and filtering of apicalls
 * 12.00      11 Apr 2019     erepollo         Added drilldown param as flag when drilling down
 * 13.00      12 Apr 2019     jmarimla         Has children
 * 14.00      15 Apr 2019     rwong            Added support for filtering api calls, merge ids under name
 * 15.00      18 Jun 2019     jmarimla         Change yaxis to numeric
 * 16.00      19 Jun 2019     jmarimla         Request urls column
 * 17.00      28 Jun 2019     erepollo         Translation for new texts
 * 18.00      08 Jul 2019     erepollo         Translation changes
 * 19.00      08 Aug 2019     erepollo         Added deployment name
 *
 */
APMPRF = APMPRF || {};

APMPRF._Highcharts = function() {

    Highcharts.setOptions({
        lang: {
            drillUpText: APMTranslation.apm.common.highcharts.drilluptext(),
            loading: APMTranslation.apm.common.label.loading() + '...',
            months: [
                APMTranslation.apm.common.month.january(),
                APMTranslation.apm.common.month.february(),
                APMTranslation.apm.common.month.march(),
                APMTranslation.apm.common.month.april(),
                APMTranslation.apm.common.month.may(),
                APMTranslation.apm.common.month.june(),
                APMTranslation.apm.common.month.july(),
                APMTranslation.apm.common.month.august(),
                APMTranslation.apm.common.month.september(),
                APMTranslation.apm.common.month.october(),
                APMTranslation.apm.common.month.november(),
                APMTranslation.apm.common.month.december()
            ],
            noData: APMTranslation.apm.common.highcharts.nodata(),
            resetZoom: APMTranslation.apm.common.highcharts.resetzoom(),
            resetZoomTitle: APMTranslation.apm.common.highcharts.resetzoomtitle(),
            shortMonths: [
                APMTranslation.apm.common.shortmonth.january(),
                APMTranslation.apm.common.shortmonth.february(),
                APMTranslation.apm.common.shortmonth.march(),
                APMTranslation.apm.common.shortmonth.april(),
                APMTranslation.apm.common.shortmonth.may(),
                APMTranslation.apm.common.shortmonth.june(),
                APMTranslation.apm.common.shortmonth.july(),
                APMTranslation.apm.common.shortmonth.august(),
                APMTranslation.apm.common.shortmonth.september(),
                APMTranslation.apm.common.shortmonth.october(),
                APMTranslation.apm.common.shortmonth.november(),
                APMTranslation.apm.common.shortmonth.december()
            ],
            weekdays: [
                APMTranslation.apm.common.weekday.sunday(),
                APMTranslation.apm.common.weekday.monday(),
                APMTranslation.apm.common.weekday.tuesday(),
                APMTranslation.apm.common.weekday.wednesday(),
                APMTranslation.apm.common.weekday.thursday(),
                APMTranslation.apm.common.weekday.friday(),
                APMTranslation.apm.common.weekday.saturday()
            ],
        }
    });

    var frhtChartData = null;

    frhtTypes = {
            'record': {
                color: 'rgba(217, 94, 94, 0.8)',
                label: APMTranslation.apm.r2019a.record(),
                drilldown: true,
                viewCalls: false,
                columns: ['date', 'executionTime', 'email', 'operation', 'searches', 'workflows', 'customRecordOperations', 'requestUrls', 'recordType']
            },
            'requestUrl': {
                color: 'rgba(163, 120, 217, 0.8)',
                label: APMTranslation.apm.r2019a.requesturl(),
                drilldown: true,
                viewCalls: false,
                columns: ['date', 'executionTime', 'email', 'operation', 'searches', 'workflows', 'customRecordOperations', 'requestUrls', 'method']
            },
            'script': {
                color: 'rgba(122, 176, 217, 0.8)',
                label: APMTranslation.apm.ptd.label.script(),
                drilldown: true,
                viewCalls: true,
                columns: ['date', 'executionTime', 'email', 'operation', 'searches', 'workflows', 'customRecordOperations', 'requestUrls', 'recordType', 'context', 'scriptType', 'name', 'deployment', 'entryPoint', 'triggerType', 'bundle']
            },
            'search': {
                color: 'rgba(243, 235, 94, 0.8)',
                label: APMTranslation.apm.ssa.label.search(),
                drilldown: false,
                viewCalls: false,
                columns: ['date', 'executionTime', 'email', 'operation', 'searches', 'workflows', 'customRecordOperations', 'requestUrls', 'recordType', 'name']
            },
            'workflow': {
                color: 'rgba(250, 182, 93, 0.8)',
                label: APMTranslation.apm.ns.context.workflow(),
                drilldown: true,
                viewCalls: false,
                columns: ['date', 'executionTime', 'email', 'operation', 'searches', 'workflows', 'customRecordOperations', 'requestUrls', 'recordType', 'context', 'name', 'entryPoint']
            },
            'webservice': {
                color: 'rgba(131, 217, 122, 0.8)',
                label: APMTranslation.apm.common.label.webservice(),
                drilldown: true,
                viewCalls: false,
                columns: ['date', 'executionTime', 'email', 'operation',  'searches', 'workflows', 'customRecordOperations', 'requestUrls', 'wsOperation', 'apiVersion']
            },
            'default': {
                color: 'rgba(192, 192, 192, 0.8)',
                label: APMTranslation.apm.r2019a.unclassified(),
                drilldown: false,
                viewCalls: false,
                columns: ['date', 'executionTime', 'email', 'operation']
            }
        };

        var frhtColumns = {
                'date': {
                    label: APMTranslation.apm.r2019a.datetime()
                },
                'executionTime' : {
                    label: APMTranslation.apm.common.label.executiontime(),
                    formatter: function (value) {
                        return value + ' s';
                    }
                },
                'email': {
                    label: APMTranslation.apm.common.label.user()
                },
                'operation': {
                    label: APMTranslation.apm.common.label.operation()
                },
                'name': {
                    label: APMTranslation.apm.common.label.name()
                },
                'recordType': {
                    label: APMTranslation.apm.common.label.recordtype()
                },
                'method': {
                    label: APMTranslation.apm.r2019a.method()
                },
                'context': {
                    label: APMTranslation.apm.common.label.context()

                },
                'scriptType': {
                    label: APMTranslation.apm.ssa.label.scripttype()
                },
                'deployment': {
                    label: APMTranslation.apm.spjd.label.deployment()
                },
                'entryPoint': {
                    label: APMTranslation.apm.r2019a.entrypoint()
                },
                'triggerType': {
                    label: APMTranslation.apm.r2019a.triggertype()
                },
                'bundle': {
                    label: APMTranslation.apm.pts.label.bundle()
                },
                'url': {
                    label: APMTranslation.apm.r2019a.url()
                },
                'searches': {
                    label: APMTranslation.apm.ptd.label.searches()
                },
                'workflows': {
                    label: APMTranslation.apm.r2019a.workflows()
                },
                'customRecordOperations': {
                    label: APMTranslation.apm.r2019a.recordsfromscriptsworkflows()
                },
                'requestUrls': {
                    label: APMTranslation.apm.r2019a.requesturls()
                },
                'wsOperation': {
                    label: APMTranslation.apm.r2019a.webserviceoperation()
                },
                'apiVersion': {
                    label: APMTranslation.apm.r2019a.apiversion()
                },
                'default' : {

                }
        }

    function renderFrhtLogsChart(chartData) {
        var $container = APMPRF.Components.$FrhtChartSubPanel.psgpSubPanel('getBody');

        _frhtChartData = chartData;

        var chartCategories = [];
        var chartSeries = [];
        if (chartData && chartData.length > 0) {
            for (var i = 0; i < chartData.length; i++) {
                var dataIdx = parseInt(i);
                var type = chartData[i].type;

                var frhtConfig = frhtTypes[type];
                frhtConfig = frhtConfig ? frhtConfig : frhtTypes['default'];

                chartCategories.push(i);
                chartSeries.push({
                    x: dataIdx,
                    color: frhtConfig.color,
                    low: ( chartData[i].lowMS ) / 1000 ,
                    high: ( chartData[i].highMS ) / 1000
                });
            }
        } else {
            $container.height(100);
            if ($container.highcharts()) $container.highcharts().destroy();
            $container.empty();
            APMPRF.Components.$NoDataAvailable.clone().appendTo($container);
            return;
        }

        //determine height based on number of yCategories
        var xLabelHeight = 180;
        var yHeight = 25 * (chartCategories.length ? chartCategories.length : 0)
        var totalHeight = xLabelHeight + yHeight;
        var minHeight = 370;
        totalHeight = totalHeight > minHeight ? totalHeight : minHeight;
        $container.height(totalHeight);

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                animation: false,
                type: 'columnrange',
                inverted: true,
                zoomType: 'y'
            },
            title: {
                text: '',
                style: {
                    color: '#666666',
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            },
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            xAxis: {
                title: {
                    text: APMTranslation.apm.r2019a.profilertype(),
                    style: {
                        color: '#666',
                        fontFamily: 'Arial',
                        fontSize: '14px',
                        fontWeight: 'normal'
                    }
                },
                labels: {
                    style: {
                        color: '#666',
                        fontFamily: 'Arial',
                        fontSize: '11px'
                    },
                    formatter: function() {
                        var point = this.value;
                        var logDetails = chartData[point];
                        var type = logDetails.type;
                        var hierarchy = logDetails.hierarchy;
                        var hasChildren = logDetails.hasChildren;
                        var frhtConfig = frhtTypes[type];
                        frhtConfig = frhtConfig ? frhtConfig : frhtTypes['default'];

                        var typeLabel = frhtConfig.label;
                        //if (hierarchy == 'child') typeLabel = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + typeLabel;

                        var viewCallsFunc = 'APMPRF.Highcharts.viewCalls(' + point + ')';
                        var drillDownFunc = 'APMPRF.Highcharts.drillDownTimeline(' + point + ')';

                        var label = '<div class="apm-prf-frhtchart-xaxis-label">' +
                            '<div class="xaxis-label">' + typeLabel + '</div>';

                        if (frhtConfig.viewCalls && logDetails.viewCalls) {
                            label += '<a href="#" onclick="' + viewCallsFunc + ';return false;"><div class="xaxis-icon-vc">' + '</div></a>';
                        }
                        if (hasChildren) {
                            label += '<a href="#" onclick="' + drillDownFunc + ';return false;"><div class="xaxis-icon-dd">' + '</div></a>';
                        }

                        label += '</div>';

                        return label;
                    },
                    useHTML: true
                },
                lineColor: '#666666',
                lineWidth: 1,
                tickColor: '#666666',
                tickLength: 0,
                categories: chartCategories
            },
            yAxis: {
                title: {
                    text: APMTranslation.apm.ptd.label.time(),
                    style: {
                        color: '#666',
                        fontFamily: 'Arial',
                        fontSize: '14px',
                        fontWeight: 'normal'
                    }
                },
                labels: {
                    style: {
                        color: '#666',
                        fontFamily: 'Arial',
                        fontSize: '11px'
                    }
                },
                lineColor: '#444444',
                lineWidth: 1,
                tickColor: '#444444',
                type: 'linear',
                min: 0,
                startOnTick: true,
                endOnTick: false
            },
            tooltip: {
                crosshairs: {
                    width: 1,
                    color: '#bbbbbb',
                    dashStyle: 'solid'
                },
                formatter: function() {
                    var pointIndex = this.x;
                    var chartPoint = chartData[pointIndex];

                    var type = chartPoint.type;
                    var frhtConfig = frhtTypes[type];
                    frhtConfig = frhtConfig ? frhtConfig : frhtTypes['default'];
                    var columns = frhtConfig.columns;

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + frhtConfig.label + '</b></td></tr>';
                    for (var i in columns) {
                        var columnData = frhtColumns[columns[i]] ? frhtColumns[columns[i]]: frhtColumns['default'];
                        var label = columnData.label ? columnData.label : '';
                        var value = chartPoint[columns[i]] ?  chartPoint[columns[i]] : '';
                        value = columnData.formatter ? columnData.formatter(value) : value;
                        table += '<tr>';
                        table += '<td align="center">' + label + '</td><td>:</td><td align="center">' + value + '</td>';
                        table += '</tr>';
                    }
                    table += '</table>';

                    return table;
                },
                shared: true,
                useHTML: true
            },
            series: [{
                name: 'timeline',
                animation: false,
                data: chartSeries
            }]

        }

        $container.highcharts(chartConfig);
    }

    function viewCalls(dataIdx) {
        //console.log(dataIdx);
        var frhtData = _frhtChartData[dataIdx];
        var params = {
            frhtId: frhtData.id,
            apiCalls: frhtData.apiCalls
        };
        APMPRF.Components.showApiCallsPopup(params);
    }

    function drillDownTimeline(dataIdx) {
        var frhtData = _frhtChartData[dataIdx];
        var globalSettings = APMPRF.Services.getGlobalSettings();
        globalSettings.parentId = frhtData.id;
        globalSettings.type = frhtData.type;
        globalSettings.drillDown = true;
        APMPRF.Services.refreshData();
    }

    return {
        frhtTypes: frhtTypes,
        renderFrhtLogsChart: renderFrhtLogsChart,
        viewCalls: viewCalls,
        drillDownTimeline: drillDownTimeline
    };
};