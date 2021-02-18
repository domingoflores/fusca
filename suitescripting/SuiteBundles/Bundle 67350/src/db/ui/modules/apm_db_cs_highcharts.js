/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Jan 2015     jmarimla         Initial
 * 2.00       28 Jan 2015     jmarimla         Record Tile Charts
 * 3.00       05 Feb 2015     jmarimla         Modified chart axes config
 * 4.00       07 Mar 2015     jmarimla         Set startontick and endontick to false
 * 5.00       12 Mar 2015     jmarimla         Added onclick triggers for url redirect
 *                                             TODO: enable redirect url when ported to new record type API
 * 6.00       16 Mar 2015     jmarimla         Add hover to record charts and other chart UI changes
 * 7.00       21 Mar 2015     jmarimla         Remove chart borders, enable linking to SPM
 * 8.00       23 Mar 2015     jmarimla         User event and workflow stacked chart; fixed zooming
 * 9.00       24 Mar 2015     jmarimla         Disable clicking for zero values, set minimum range to .01
 * 10.00      27 Mar 2015     jmarimla         Linking of histogram to SPM
 * 11.00      31 Mar 2015     jmarimla         Fixed totaltime in response time chart; x-axis formatting in histogram
 * 12.00      10 Apr 2015     rwong            Change line width and color of the plotoptions for the recordtilechart.
 *                                             Added date in the tooltip of certain charts.
 *                                             Added synchronize mouseOver
 * 13.00      29 Apr 2015     jmarimla         Removed 'Over Time', removed 'Timeline' title
 *                                             Changed response time chart colors
 * 14.00      26 Jun 2015     jmarimla         Add plotlines in response time chart
 * 15.00      02 Jul 2015     jmarimla         Added mouseout event
 * 16.00      28 Jul 2015     rwong            Added zIndex to ensure that plotline is shown,
 *                                             Added plotline labels, change plotline color and
 *                                             Added minRange to ensure that 95th is always shown
 * 17.00      29 Jul 2015     jmarimla         Show number of users in throughput chart
 * 18.00      06 Aug 2015     rwong            Change number of users into bar chart
 *                                             Change no of instances in spline chart
 *                                             Change color of y axis
 * 19.00      28 Aug 2015     jmarimla         Add compfil in url redirect
 * 20.00      11 Sep 2015     jmarimla         Allow zoom in below 95th percentile
 * 21.00      26 Aug 2016     rwong            ScheduledScriptUsage portlet
 * 22.00      13 Sep 2016     rwong            Updated scheduled script usage portlet
 * 23.00      02 Oct 2017     jmarimla         Remove sched script portlet
 * 24.00      07 Jun 2018     jmarimla         Label change
 * 25.00      29 Jun 2018     jmarimla         Translation readiness
 * 26.00      26 Jul 2018     rwong            Highcharts translation
 *
 */
function APMHighcharts() {
    PSGP.APM.DB.Highcharts = {

        recordTileData: {},
        recordTileChartsArray: new Array(),

        recordResponseTimeChart: null,
        recordThroughputChart: null,
        recordUEWFBreakdownChart: null,
        recordHistogramChart: null,

        renderRecordTileChart: function(renderTo, index, stringData, threshold) {

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

            var chartData = (stringData) ? JSON.parse(stringData) : [
                [0, 0]
            ];

            var chartConfig = {
                chart: {
                    renderTo: renderTo,
                    type: 'line',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    plotBorderColor: '#555555',
                    plotBorderWidth: 0
                },
                title: {
                    text: ''
                },
                exporting: {
                    enabled: false,
                    buttons: {
                        exportButton: {
                            enabled: false
                        },
                        printButton: {
                            enabled: false
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    enabled: false
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        formatter: function() {
                            var label = this.axis.defaultLabelFormatter.call(this);
                            if (label.endsWith('AM')) {
                                label = label.replace(/AM$/, APMTranslation.apm.common.time.am());
                            }
                            if (label.endsWith('PM')) {
                                label = label.replace(/PM$/, APMTranslation.apm.common.time.pm());
                            }
                            return label;
                        },
                        enabled: false
                    },
                    tickLength: 0,
                    lineColor: '#555555',
                    lineWidth: 0,
                    tickInterval: PSGP.APM.DB.dataStores.recordTilesChartConfig.intervalMS,
                    min: PSGP.APM.DB.dataStores.recordTilesChartConfig.startDateMS,
                    max: PSGP.APM.DB.dataStores.recordTilesChartConfig.endDateMS,
                    startOnTick: false,
                    endOnTick: false
                },
                yAxis: {
                    title: {
                        text: ''
                    },
                    labels: {
                        style: {
                            color: '#999999',
                            fontFamily: 'Arial',
                            fontSize: '8px'
                        }
                    },
                    plotLines: [{
                        color: '#666666',
                        width: 1,
                        dashStyle: 'Dash',
                        value: threshold,
                        zIndex: 5
                    }],
                    min: 0,
                    minRange: threshold
                },
                plotOptions: {
                    series: {
                        lineWidth: 0.75,
                        color: '#2b78e4',
                        animation: false,
                        marker: {
                            enabled: false
                        },
                        states: {
                            hover: {
                                enabled: false
                            }
                        }
                    }
                },
                series: [{
                    data: chartData
                }]
            };

            if (this.recordTileChartsArray[index]) {
                this.recordTileChartsArray[index].destroy();
            }
            this.recordTileChartsArray[index] = new Highcharts.Chart(chartConfig);
            this.recordTileChartsArray[index].container.onclick = null; //to enable ExtJS panel trigger

        },

        renderRecordResponseTimeChart: function(chartData) {
            if ((!chartData.clientTime) || (chartData.clientTime.length == 0)) {
                if (this.recordResponseTimeChart) {
                    this.recordResponseTimeChart.destroy();
                    this.recordResponseTimeChart = null;
                }
                return;
            }

            var containerId = 'psgp-apm-db-recordchart-responsetime';

            var redirectFxn = this.SPMRedirect;

            var chartConfig = {
                chart: {
                    renderTo: containerId,
                    type: 'area',
                    zoomType: 'xy',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    plotBorderColor: '#555555',
                    plotBorderWidth: 0
                },
                title: {
                    text: APMTranslation.apm.common.label.responsetime(),
                    style: {
                        color: '#666666',
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }
                },
                subtitle: {
                    text: '(' + APMTranslation.apm.db.responsetimechart.clientnetworkserver() + ')',
                    style: {
                        color: '#666666',
                        fontFamily: 'Arial',
                        fontSize: '13px',
                        fontWeight: 'normal'
                    }
                },
                exporting: {
                    enabled: false,
                    buttons: {
                        exportButton: {
                            enabled: false
                        },
                        printButton: {
                            enabled: false
                        }
                    }
                },
                legend: {
                    borderWidth: 0
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    crosshairs: {
                        width: 1,
                        color: '#bbbbbb',
                        dashStyle: 'solid'
                    },
                    formatter: function() {
                        if (this.y == 0) return false;

                        var chartData = PSGP.APM.DB.Highcharts.recordTileData.responseTime;
                        var pointIndex = PSGP.APM.DB.Highcharts.recordTileData.indexData[this.x];

                        var clientTime = chartData.clientTime[pointIndex][1];
                        var networkTime = chartData.networkTime[pointIndex][1];
                        var serverTime = chartData.serverTime[pointIndex][1];
                        var totalTime = chartData.totalTime[pointIndex][1];

                        var groupAggMS = PSGP.APM.DB.dataStores.recordTilesChartConfig.groupAggMS;
                        var groupAggString = '';
                        if (groupAggMS < 1000 * 60 * 60) {
                            var value = groupAggMS / (1000 * 60);
                            var label = (value > 1) ? APMTranslation.apm.common.label.mins() : APMTranslation.apm.common.label.min();
                            groupAggString = '' + value + ' ' + label;
                        } else {
                            var value = groupAggMS / (1000 * 60 * 60);
                            var label = (value > 1) ? APMTranslation.apm.common.label.hrs() : APMTranslation.apm.common.label.hr();
                            groupAggString = '' + value + ' ' + label;
                        }

                        var fromDate = Highcharts.dateFormat('%l:%M %p', this.x);
                        if (fromDate.endsWith('AM')) {
                            fromDate = fromDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (fromDate.endsWith('PM')) {
                            fromDate = fromDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var toDate = Highcharts.dateFormat('%l:%M %p', this.x + groupAggMS);
                        if (toDate.endsWith('AM')) {
                            toDate = toDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (toDate.endsWith('PM')) {
                            toDate = toDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var pointDate = Highcharts.dateFormat('%b %d %Y', this.x);

                        var table = '<table>';
                        table += '<tr><td align="center" colspan="3"><b>' + pointDate + '</b></td></tr>';
                        table += '<tr><td align="center" colspan="3"><b>' + groupAggString + ' (' + fromDate + ' - ' + toDate + ')</b></td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.common.label.total() + '</td><td>:</td><td align="center">' + totalTime.toFixed(3) + ' s</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.common.label.client() + '</td><td>:</td><td align="center">' + clientTime.toFixed(3) + ' s</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.common.label.network() + '</td><td>:</td><td align="center">' + networkTime.toFixed(3) + ' s</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.common.label.server() + '</td><td>:</td><td align="center">' + serverTime.toFixed(3) + ' s</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    shared: true,
                    useHTML: true
                },
                xAxis: {
                    type: 'datetime',
                    title: {
                        text: '',
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '14px',
                            fontWeight: 'normal'
                        }
                    },
                    labels: {
                        formatter: function() {
                            var label = this.axis.defaultLabelFormatter.call(this);
                            if (label.endsWith('AM')) {
                                label = label.replace(/AM$/, APMTranslation.apm.common.time.am());
                            }
                            if (label.endsWith('PM')) {
                                label = label.replace(/PM$/, APMTranslation.apm.common.time.pm());
                            }
                            return label;
                        },
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    tickLength: 5,
                    //tickColor : '#555555',
                    lineColor: '#555555',
                    lineWidth: 0,
                    dateTimeLabelFormats: {
                        second: '%l:%M:%S %p',
                        minute: '%l:%M %p',
                        hour: '%l:%M %p',
                        day: '%m/%d<br>%l:%M %p',
                        week: '%m/%d<br>%l:%M %p',
                        month: '%m/%d<br>%l:%M %p',
                        year: '%l:%M %p'
                    },
                    //tickInterval: PSGP.APM.DB.dataStores.recordTilesChartConfig.intervalMS,
                    minRange: 60 * 1000,
                    min: PSGP.APM.DB.dataStores.recordTilesChartConfig.startDateMS,
                    max: PSGP.APM.DB.dataStores.recordTilesChartConfig.endDateMS,
                    startOnTick: false,
                    endOnTick: false
                },
                yAxis: {
                    title: {
                        text: APMTranslation.apm.common.label.responsetime(),
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
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    plotLines: [{
                        color: '#4F5ED6',
                        width: 1,
                        dashStyle: 'Dash',
                        zIndex: 5,
                        label: {
                            align: 'left',
                            text: APMTranslation.apm.common.label.median().toUpperCase() + ' - ' + chartData.totalTimeMed,
                            style: {
                                color: '#4F5ED6',
                                fontWeight: 'bold',
                                fontSize: '10px',
                                fontFamily: 'Open Sans,Helvetica,sans-serif'
                            },
                            x: 10,
                            y: 10
                        },
                        value: chartData.totalTimeMed
                    }, {
                        color: '#FA3424',
                        width: 1,
                        dashStyle: 'Dash',
                        zIndex: 5,
                        label: {
                            align: 'left',
                            text: APMTranslation.apm.common.label._95th().toUpperCase() + ' - ' + chartData.totalTime95p,
                            style: {
                                color: '#FA3424',
                                fontWeight: 'bold',
                                fontSize: '10px',
                                fontFamily: 'Open Sans,Helvetica,sans-serif'
                            },
                            x: 10
                        },
                        value: chartData.totalTime95p
                    }],
                    min: 0
                },
                plotOptions: {
                    area: {
                        stacking: 'normal',
                        animation: false,
                        states: {
                            hover: {
                                lineWidth: 0,
                                lineWidthPlus: 0
                            }
                        },
                        events: {
                            mouseOut: function() {
                                PSGP.APM.DB.Highcharts.hideTooltip();
                            }
                        },
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    var chartData = PSGP.APM.DB.Highcharts.recordTileData.responseTime;
                                    var pointIndex = PSGP.APM.DB.Highcharts.recordTileData.indexData[this.x];

                                    var clientTime = chartData.clientTime[pointIndex][1];
                                    var networkTime = chartData.networkTime[pointIndex][1];
                                    var serverTime = chartData.serverTime[pointIndex][1];

                                    if (clientTime == 0 && networkTime == 0 && serverTime == 0) return;

                                    var rectype = PSGP.APM.DB.dataStores.recordChartsParams.recordtype;
                                    var oper = PSGP.APM.DB.dataStores.recordChartsParams.oper.substr(0, 1);
                                    var sdatetime = new Date(this.x).toISOString().substr(0, 19);
                                    var dateDiffMS = PSGP.APM.DB.dataStores.recordTilesChartConfig.groupAggMS;
                                    var edatetime = new Date(this.x + dateDiffMS).toISOString().substr(0, 19);
                                    var params = {
                                        rectype: rectype,
                                        oper: oper,
                                        sdatetime: sdatetime,
                                        edatetime: edatetime
                                    };
                                    //console.log(params);
                                    redirectFxn(params);
                                },
                                mouseOver: function() {
                                    //console.log(this.series.chart.container);
                                    PSGP.APM.DB.Highcharts.syncTooltip(this.series.chart.container, this.x);
                                }
                            }
                        }
                    }
                },
                series: [{
                    name: APMTranslation.apm.common.label.client(),
                    color: '#fc8d59',
                    fillColor: 'rgba(252,141,89,0.8)',
                    lineColor: 'rgba(252,141,89,1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#fc8d59',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.clientTime
                }, {
                    name: APMTranslation.apm.common.label.network(),
                    color: '#ffffbf',
                    fillColor: 'rgba(255,255,180,0.8)',
                    lineColor: 'rgba(255,255,180,1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#ffffbf',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.networkTime
                }, {
                    name: APMTranslation.apm.common.label.server(),
                    color: '#91bfdb',
                    fillColor: 'rgba(145,191,219,0.8)',
                    lineColor: 'rgba(145,191,219,1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#91bfdb',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.serverTime
                }, {
                    name: '95p',
                    type: 'column',
                    color: 'rgba(255,255,255,0)',
                    borderColor: 'rgba(255,255,255,0)',
                    marker: {
                        enabled: false
                    },
                    showInLegend: false,
                    data: [
                        [chartData.clientTime[0][0], Math.round(chartData.totalTime95p)]
                    ]
                }]
            };

            if (this.recordResponseTimeChart) {
                this.recordResponseTimeChart.destroy();
            }
            this.recordResponseTimeChart = new Highcharts.Chart(chartConfig);
            this.resizeChart(this.recordResponseTimeChart, containerId);

        },

        renderRecordThroughputChart: function(chartData) {

            if ((!chartData) || (chartData.length == 0)) {
                if (this.recordThroughputChart) {
                    this.recordThroughputChart.destroy();
                    this.recordThroughputChart = null;
                }
                return;
            }

            var containerId = 'psgp-apm-db-recordchart-throughput';

            var redirectFxn = this.SPMRedirect;

            var chartConfig = {
                chart: {
                    renderTo: containerId,
                    zoomType: 'xy',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    plotBorderColor: '#555555',
                    plotBorderWidth: 0
                },
                title: {
                    text: APMTranslation.apm.db.label.throughput(),
                    style: {
                        color: '#666666',
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }
                },
                exporting: {
                    enabled: false,
                    buttons: {
                        exportButton: {
                            enabled: false
                        },
                        printButton: {
                            enabled: false
                        }
                    }
                },
                legend: {
                    borderWidth: 0
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    crosshairs: {
                        width: 1,
                        color: '#bbbbbb',
                        dashStyle: 'solid'
                    },
                    formatter: function() {
                        if (this.y == 0) return false;

                        var chartData = PSGP.APM.DB.Highcharts.recordTileData.throughput;
                        var pointIndex = PSGP.APM.DB.Highcharts.recordTileData.indexData[this.x];

                        var logsTotal = chartData.logsTotal[pointIndex][1];
                        var usersTotal = chartData.usersTotal[pointIndex][1];

                        var groupAggMS = PSGP.APM.DB.dataStores.recordTilesChartConfig.groupAggMS;
                        var groupAggString = '';
                        if (groupAggMS < 1000 * 60 * 60) {
                            var value = groupAggMS / (1000 * 60);
                            var label = (value > 1) ? APMTranslation.apm.common.label.mins() : APMTranslation.apm.common.label.min();
                            groupAggString = '' + value + ' ' + label;
                        } else {
                            var value = groupAggMS / (1000 * 60 * 60);
                            var label = (value > 1) ? APMTranslation.apm.common.label.hrs() : APMTranslation.apm.common.label.hr();
                            groupAggString = '' + value + ' ' + label;
                        }

                        var fromDate = Highcharts.dateFormat('%l:%M %p', this.x);
                        if (fromDate.endsWith('AM')) {
                            fromDate = fromDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (fromDate.endsWith('PM')) {
                            fromDate = fromDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var toDate = Highcharts.dateFormat('%l:%M %p', this.x + groupAggMS);
                        if (toDate.endsWith('AM')) {
                            toDate = toDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (toDate.endsWith('PM')) {
                            toDate = toDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var pointDate = Highcharts.dateFormat('%b %d %Y', this.x);

                        var recordsText = (logsTotal == 1) ? APMTranslation.apm.db.label.recordinstance().toLowerCase() : APMTranslation.apm.db.label.recordinstances().toLowerCase();
                        var usersText = (usersTotal == 1) ? APMTranslation.apm.common.label.user().toLowerCase() : APMTranslation.apm.common.label.users().toLowerCase();

                        var table = '<table>';
                        table += '<tr><td align="center"><b>' + pointDate + '</b></td></tr>';
                        table += '<tr><td><b>' + groupAggString + ' (' + fromDate + ' - ' + toDate + ')</b></td></tr>';
                        table += '<tr><td>' + logsTotal + ' ' + recordsText + '</td></tr>';
                        table += '<tr><td>' + usersTotal + ' ' + usersText + '</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    shared: true,
                    useHTML: true
                },
                xAxis: {
                    type: 'datetime',
                    title: {
                        text: '',
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '14px',
                            fontWeight: 'normal'
                        }
                    },
                    labels: {
                        formatter: function() {
                            var label = this.axis.defaultLabelFormatter.call(this);
                            if (label.endsWith('AM')) {
                                label = label.replace(/AM$/, APMTranslation.apm.common.time.am());
                            }
                            if (label.endsWith('PM')) {
                                label = label.replace(/PM$/, APMTranslation.apm.common.time.pm());
                            }
                            return label;
                        },
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    tickLength: 5,
                    //tickColor : '#555555',
                    lineColor: '#555555',
                    lineWidth: 0,
                    dateTimeLabelFormats: {
                        second: '%l:%M:%S %p',
                        minute: '%l:%M %p',
                        hour: '%l:%M %p',
                        day: '%m/%d<br>%l:%M %p',
                        week: '%m/%d<br>%l:%M %p',
                        month: '%m/%d<br>%l:%M %p',
                        year: '%l:%M %p'
                    },
                    //tickInterval: PSGP.APM.DB.dataStores.recordTilesChartConfig.intervalMS,
                    minRange: 60 * 1000,
                    min: PSGP.APM.DB.dataStores.recordTilesChartConfig.startDateMS,
                    max: PSGP.APM.DB.dataStores.recordTilesChartConfig.endDateMS,
                    startOnTick: false,
                    endOnTick: false
                },
                yAxis: [{
                    title: {
                        text: APMTranslation.apm.db.label.recordinstances(),
                        style: {
                            color: '#FC8D59',
                            fontFamily: 'Arial',
                            fontSize: '14px',
                            fontWeight: 'normal'
                        }
                    },
                    labels: {
                        style: {
                            color: '#FC8D59',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        },
                    },
                    allowDecimals: false,
                    min: 0,
                    minRange: .01
                }, {
                    opposite: true,
                    title: {
                        text: APMTranslation.apm.common.label.numberofusers(),
                        style: {
                            color: '#91BFDB',
                            fontFamily: 'Arial',
                            fontSize: '14px',
                            fontWeight: 'normal'
                        }
                    },
                    labels: {
                        style: {
                            color: '#91BFDB',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        },
                    },
                    allowDecimals: false,
                    min: 0,
                    minRange: .01
                }],
                plotOptions: {
                    series: {
                        animation: false,
                        states: {
                            hover: {
                                lineWidth: 0,
                                lineWidthPlus: 0
                            }
                        },
                        events: {
                            mouseOut: function() {
                                PSGP.APM.DB.Highcharts.hideTooltip();
                            }
                        },
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    if (this.y == 0) return false;

                                    var rectype = PSGP.APM.DB.dataStores.recordChartsParams.recordtype;
                                    var oper = PSGP.APM.DB.dataStores.recordChartsParams.oper.substr(0, 1);
                                    var sdatetime = new Date(this.x).toISOString().substr(0, 19);
                                    var dateDiffMS = PSGP.APM.DB.dataStores.recordTilesChartConfig.groupAggMS;
                                    var edatetime = new Date(this.x + dateDiffMS).toISOString().substr(0, 19);
                                    var params = {
                                        rectype: rectype,
                                        oper: oper,
                                        sdatetime: sdatetime,
                                        edatetime: edatetime
                                    };
                                    //console.log(params);
                                    redirectFxn(params);
                                },
                                mouseOver: function() {
                                    //console.log(this.series.chart.container);
                                    PSGP.APM.DB.Highcharts.syncTooltip(this.series.chart.container, this.x);
                                }
                            }
                        }
                    }
                },
                series: [{
                    name: APMTranslation.apm.common.label.numberofusers(),
                    type: 'column',
                    color: '#91BFDB',
                    fillColor: 'rgba(145, 191, 219, 0.8)',
                    lineColor: 'rgba(145, 191, 219, 1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#3366ff',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.usersTotal,
                    yAxis: 1
                }, {
                    name: APMTranslation.apm.db.label.recordinstances(),
                    type: 'spline',
                    color: '#FC8D59',
                    fillColor: 'rgba(252, 141, 89, 0.8)',
                    lineColor: 'rgba(252, 141, 89, 1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#83D97A',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.logsTotal,
                }]
            };

            if (this.recordThroughputChart) {
                this.recordThroughputChart.destroy();
            }
            this.recordThroughputChart = new Highcharts.Chart(chartConfig);
            this.resizeChart(this.recordThroughputChart, containerId);

        },

        renderRecordUEWFBreakdownChart: function(chartData) {
            if ((!chartData.suitescriptTime) || (chartData.suitescriptTime.length == 0)) {
                if (this.recordUEWFBreakdownChart) {
                    this.recordUEWFBreakdownChart.destroy();
                    this.recordUEWFBreakdownChart = null;
                }
                return;
            }

            var containerId = 'psgp-apm-db-recordchart-uewfbreakdown';

            var redirectFxn = this.SPMRedirect;

            var chartConfig = {
                chart: {
                    renderTo: containerId,
                    type: 'area',
                    zoomType: 'xy',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    plotBorderColor: '#555555',
                    plotBorderWidth: 0
                },
                title: {
                    text: APMTranslation.apm.db.label.usereventworkflow(),
                    style: {
                        color: '#666666',
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }
                },
                exporting: {
                    enabled: false,
                    buttons: {
                        exportButton: {
                            enabled: false
                        },
                        printButton: {
                            enabled: false
                        }
                    }
                },
                legend: {
                    borderWidth: 0
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    crosshairs: {
                        width: 1,
                        color: '#bbbbbb',
                        dashStyle: 'solid'
                    },
                    formatter: function() {
                        var chartData = PSGP.APM.DB.Highcharts.recordTileData.UEWFBreakdown;
                        var pointIndex = PSGP.APM.DB.Highcharts.recordTileData.indexData[this.x];

                        if (typeof pointIndex === 'undefined') return false;

                        var suitescriptTime = chartData.suitescriptTime[pointIndex][1];
                        var workflowTime = chartData.workflowTime[pointIndex][1];

                        if (suitescriptTime == 0 && workflowTime == 0) return false;

                        var groupAggMS = PSGP.APM.DB.dataStores.recordTilesChartConfig.groupAggMS;
                        var groupAggString = '';
                        if (groupAggMS < 1000 * 60 * 60) {
                            var value = groupAggMS / (1000 * 60);
                            var label = (value > 1) ? APMTranslation.apm.common.label.mins() : APMTranslation.apm.common.label.min();
                            groupAggString = '' + value + ' ' + label;
                        } else {
                            var value = groupAggMS / (1000 * 60 * 60);
                            var label = (value > 1) ? APMTranslation.apm.common.label.hrs() : APMTranslation.apm.common.label.hr();
                            groupAggString = '' + value + ' ' + label;
                        }

                        var fromDate = Highcharts.dateFormat('%l:%M %p', this.x);
                        if (fromDate.endsWith('AM')) {
                            fromDate = fromDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (fromDate.endsWith('PM')) {
                            fromDate = fromDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var toDate = Highcharts.dateFormat('%l:%M %p', this.x + groupAggMS);
                        if (toDate.endsWith('AM')) {
                            toDate = toDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (toDate.endsWith('PM')) {
                            toDate = toDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var pointDate = Highcharts.dateFormat('%b %d %Y', this.x);

                        var table = '<table>';
                        table += '<tr><td align="center" colspan="3"><b>' + pointDate + '</b></td></tr>';
                        table += '<tr><td align="center" colspan="3"><b>' + groupAggString + ' (' + fromDate + ' - ' + toDate + ')</b></td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.common.label.userevent() + '</td><td>:</td><td align="center">' + suitescriptTime.toFixed(3) + ' s</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.ns.context.workflow() + '</td><td>:</td><td align="center">' + workflowTime.toFixed(3) + ' s</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    shared: true,
                    useHTML: true
                },
                xAxis: {
                    type: 'datetime',
                    title: {
                        text: '',
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '14px',
                            fontWeight: 'normal'
                        }
                    },
                    labels: {
                        formatter: function() {
                            var label = this.axis.defaultLabelFormatter.call(this);
                            if (label.endsWith('AM')) {
                                label = label.replace(/AM$/, APMTranslation.apm.common.time.am());
                            }
                            if (label.endsWith('PM')) {
                                label = label.replace(/PM$/, APMTranslation.apm.common.time.pm());
                            }
                            return label;
                        },
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    tickLength: 5,
                    //tickColor : '#555555',
                    lineColor: '#555555',
                    lineWidth: 0,
                    dateTimeLabelFormats: {
                        second: '%l:%M:%S %p',
                        minute: '%l:%M %p',
                        hour: '%l:%M %p',
                        day: '%m/%d<br>%l:%M %p',
                        week: '%m/%d<br>%l:%M %p',
                        month: '%m/%d<br>%l:%M %p',
                        year: '%l:%M %p'
                    },
                    //tickInterval: PSGP.APM.DB.dataStores.recordTilesChartConfig.intervalMS,
                    minRange: 60 * 1000,
                    min: PSGP.APM.DB.dataStores.recordTilesChartConfig.startDateMS,
                    max: PSGP.APM.DB.dataStores.recordTilesChartConfig.endDateMS,
                    startOnTick: false,
                    endOnTick: false
                },
                yAxis: {
                    title: {
                        text: APMTranslation.apm.common.label.executiontime(),
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
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    min: 0,
                    minRange: .01
                },
                plotOptions: {
                    area: {
                        stacking: 'normal',
                        animation: false,
                        states: {
                            hover: {
                                lineWidth: 0,
                                lineWidthPlus: 0
                            }
                        },
                        events: {
                            mouseOut: function() {
                                PSGP.APM.DB.Highcharts.hideTooltip();
                            }
                        },
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    var chartData = PSGP.APM.DB.Highcharts.recordTileData.UEWFBreakdown;
                                    var pointIndex = PSGP.APM.DB.Highcharts.recordTileData.indexData[this.x];

                                    var suitescriptTime = chartData.suitescriptTime[pointIndex][1];
                                    var workflowTime = chartData.workflowTime[pointIndex][1];

                                    if (suitescriptTime == 0 && workflowTime == 0) return;

                                    var rectype = PSGP.APM.DB.dataStores.recordChartsParams.recordtype;
                                    var oper = PSGP.APM.DB.dataStores.recordChartsParams.oper.substr(0, 1);
                                    var sdatetime = new Date(this.x).toISOString().substr(0, 19);
                                    var dateDiffMS = PSGP.APM.DB.dataStores.recordTilesChartConfig.groupAggMS;
                                    var edatetime = new Date(this.x + dateDiffMS).toISOString().substr(0, 19);
                                    var params = {
                                        rectype: rectype,
                                        oper: oper,
                                        sdatetime: sdatetime,
                                        edatetime: edatetime
                                    };
                                    //console.log(params);
                                    redirectFxn(params);
                                },
                                mouseOver: function() {
                                    //console.log(this.series.chart.container);
                                    PSGP.APM.DB.Highcharts.syncTooltip(this.series.chart.container, this.x);
                                }
                            }
                        }
                    }
                },
                series: [{
                    name: APMTranslation.apm.common.label.userevent(),
                    color: '#7bccc4',
                    fillColor: 'rgba(123, 204, 196, 0.8)',
                    lineColor: 'rgba(123, 204, 196, 0.8)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#7bccc4',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.suitescriptTime
                }, {
                    name: APMTranslation.apm.ns.context.workflow(),
                    color: '#0868ac',
                    fillColor: 'rgba(8, 104, 172, 0.8)',
                    lineColor: 'rgba(8, 104, 172, 0.8)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#0868ac',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.workflowTime
                }]
            };

            if (this.recordUEWFBreakdownChart) {
                this.recordUEWFBreakdownChart.destroy();
            }
            this.recordUEWFBreakdownChart = new Highcharts.Chart(chartConfig);
            this.resizeChart(this.recordUEWFBreakdownChart, containerId);
        },

        renderRecordHistogramChart: function(chartData) {

            if ((!chartData.frequency) || (chartData.frequency.length == 0)) {
                if (this.recordHistogramChart) {
                    this.recordHistogramChart.destroy();
                    this.recordHistogramChart = null;
                }
                return;
            }

            var containerId = 'psgp-apm-db-recordchart-histogram';

            var redirectFxn = this.SPMRedirect;

            var chartConfig = {
                chart: {
                    renderTo: containerId,
                    type: 'column',
                    zoomType: 'xy',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    plotBorderColor: '#555555',
                    plotBorderWidth: 0
                },
                title: {
                    text: APMTranslation.apm.common.label.histogram(),
                    style: {
                        color: '#666666',
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }
                },
                exporting: {
                    enabled: false,
                    buttons: {
                        exportButton: {
                            enabled: false
                        },
                        printButton: {
                            enabled: false
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        if (this.y == 0) return false;

                        var total = PSGP.APM.DB.Highcharts.recordTileData.histogram.total;
                        var percentage = (this.y / total) * 100;

                        var table = '<table>';
                        table += '<tr><td style="color:#2F7ED8">' + APMTranslation.apm.db.label.recordinstances() + '</td>' + '<td>:</td>' + '<td>' + this.y + '</td></tr>';
                        table += '<tr><td style="color:#2F7ED8">' + APMTranslation.apm.common.tooltip.percentfromtotal() + '</td>' + '<td>:</td>' + '<td>' + parseFloat(percentage.toFixed(2)) + '%</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    shared: true,
                    useHTML: true
                },
                xAxis: {
                    type: 'linear',
                    title: {
                        text: APMTranslation.apm.common.label.responsetime(),
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
                            fontSize: '11px',
                            fontWeight: 'normal'
                        },
                        formatter: function() {
                            var label = this.value;
                            if (this.value == chartData.threshold) label = '>' + chartData.threshold;
                            else if (this.value > chartData.threshold) label = '';
                            return label;
                        }
                    },
                    tickLength: 5,
                    //tickColor : '#555555',
                    lineColor: '#555555',
                    lineWidth: 0,
                    tickInterval: PSGP.APM.DB.dataStores.recordTilesChartConfig.histogramTicks
                },
                yAxis: {
                    title: {
                        text: APMTranslation.apm.db.label.recordinstances(),
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
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    allowDecimals: false,
                    min: 0,
                    minRange: .01
                },
                plotOptions: {
                    series: {
                        color: 'rgba(47, 126, 216, 0.8)',
                        animation: false,
                        states: {
                            hover: {
                                enabled: false
                            }
                        },
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    if (this.y == 0) return false;

                                    var rectype = PSGP.APM.DB.dataStores.recordChartsParams.recordtype;
                                    var oper = PSGP.APM.DB.dataStores.recordChartsParams.oper.substr(0, 1);
                                    var sdatetime = new Date(PSGP.APM.DB.dataStores.recordTilesParams.startDateMS - OFFSET_MS).toISOString().substr(0, 19);
                                    var edatetime = new Date(PSGP.APM.DB.dataStores.recordTilesParams.endDateMS - OFFSET_MS).toISOString().substr(0, 19);
                                    var threshold = PSGP.APM.DB.Highcharts.recordTileData.histogram.threshold;
                                    var resolution = PSGP.APM.DB.Highcharts.recordTileData.histogram.resolution;

                                    var responsetimeoper = null;
                                    var responsetime1 = null;
                                    var responsetime2 = null;

                                    if (this.x < threshold) {
                                        responsetimeoper = 'bw';
                                        responsetime1 = this.x;
                                        responsetime2 = this.x + resolution;
                                    } else {
                                        responsetimeoper = 'gt';
                                        responsetime1 = threshold;
                                    }

                                    var params = {
                                        rectype: rectype,
                                        oper: oper,
                                        sdatetime: sdatetime,
                                        edatetime: edatetime,
                                        responsetimeoper: responsetimeoper,
                                        responsetime1: responsetime1,
                                        responsetime2: responsetime2
                                    };
                                    //console.log(params);
                                    redirectFxn(params);
                                }
                            }
                        }
                    },
                    column: {
                        groupPadding: 0,
                        pointPadding: 0.03,
                        borderColor: '#FFFFFF',
                        borderWidth: 0,
                        pointPlacement: .5
                    }
                },
                series: [{
                    data: chartData.frequency
                }]
            };

            if (this.recordHistogramChart) {
                this.recordHistogramChart.destroy();
            }
            this.recordHistogramChart = new Highcharts.Chart(chartConfig);
            this.resizeChart(this.recordHistogramChart, containerId);

        },

        resizeAllCharts: function() {
            this.resizeChart(this.recordResponseTimeChart, 'psgp-apm-db-recordchart-responsetime');
            this.resizeChart(this.recordThroughputChart, 'psgp-apm-db-recordchart-throughput');
            this.resizeChart(this.recordUEWFBreakdownChart, 'psgp-apm-db-recordchart-uewfbreakdown');
            this.resizeChart(this.recordHistogramChart, 'psgp-apm-db-recordchart-histogram');
        },

        resizeChart: function(chart, containerId) {
            if (chart) {
                chart.setSize(Ext4.getCmp(containerId).getWidth() - 20, Ext4.getCmp(containerId).getHeight());
            }
        },

        syncTooltip: function(container, p) {
            var i = 0,
                j = 0,
                data;
            //console.log(container.id, PSGP.APM.DB.Highcharts.recordThroughputChart.container.id);

            if (container.id == PSGP.APM.DB.Highcharts.recordResponseTimeChart.container.id) {
                data = PSGP.APM.DB.Highcharts.recordResponseTimeChart.series[0].data;
                if (PSGP.APM.DB.Highcharts.recordResponseTimeChart.tooltip.shared) {
                    for (; j < data.length; j++) {
                        if (data[j].x === p) {
                            PSGP.APM.DB.Highcharts.recordThroughputChart.tooltip.refresh([PSGP.APM.DB.Highcharts.recordThroughputChart.series[0].data[j]]);
                            PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.tooltip.refresh([PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.series[0].data[j]]);
                        }
                    }

                } else {
                    PSGP.APM.DB.Highcharts.recordThroughputChart.tooltip.refresh(PSGP.APM.DB.Highcharts.recordThroughputChart.series[0].data[p]);
                    PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.tooltip.refresh(PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.series[0].data[j]);
                }
            } else if (container.id == PSGP.APM.DB.Highcharts.recordThroughputChart.container.id) {
                data = PSGP.APM.DB.Highcharts.recordThroughputChart.series[0].data;
                if (PSGP.APM.DB.Highcharts.recordThroughputChart.tooltip.shared) {
                    for (; j < data.length; j++) {
                        if (data[j].x === p) {
                            PSGP.APM.DB.Highcharts.recordResponseTimeChart.tooltip.refresh([PSGP.APM.DB.Highcharts.recordResponseTimeChart.series[0].data[j]]);
                            PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.tooltip.refresh([PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.series[0].data[j]]);
                        }
                    }

                } else {
                    PSGP.APM.DB.Highcharts.recordResponseTimeChart.tooltip.refresh(PSGP.APM.DB.Highcharts.recordResponseTimeChart.series[0].data[p]);
                    PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.tooltip.refresh(PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.series[0].data[j]);
                }
            } else {
                data = PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.series[0].data;
                if (PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.tooltip.shared) {
                    for (; j < data.length; j++) {
                        if (data[j].x === p) {
                            PSGP.APM.DB.Highcharts.recordResponseTimeChart.tooltip.refresh([PSGP.APM.DB.Highcharts.recordResponseTimeChart.series[0].data[j]]);
                            PSGP.APM.DB.Highcharts.recordThroughputChart.tooltip.refresh([PSGP.APM.DB.Highcharts.recordThroughputChart.series[0].data[j]]);
                        }
                    }

                } else {
                    PSGP.APM.DB.Highcharts.recordResponseTimeChart.tooltip.refresh(PSGP.APM.DB.Highcharts.recordResponseTimeChart.series[0].data[p]);
                    PSGP.APM.DB.Highcharts.recordThroughputChart.tooltip.refresh(PSGP.APM.DB.Highcharts.recordThroughputChart.series[0].data[j]);
                }
            }
        },

        hideTooltip: function() {
            PSGP.APM.DB.Highcharts.recordResponseTimeChart.tooltip.hide();
            PSGP.APM.DB.Highcharts.recordThroughputChart.tooltip.hide();
            PSGP.APM.DB.Highcharts.recordUEWFBreakdownChart.tooltip.hide();
        },

        SPMRedirect: function(params) {
            window.open(SPM_URL +
                '&rectype=' + params.rectype +
                '&oper=' + params.oper +
                '&sdatetime=' + params.sdatetime +
                '&edatetime=' + params.edatetime +
                '&responsetimeoper=' + params.responsetimeoper +
                '&responsetime1=' + params.responsetime1 +
                '&responsetime2=' + params.responsetime2 +
                '&compfil=' + COMP_FIL
            );
        },

        SSARedirect: function(params) {
            window.open(SSA_URL +
                '&scripttype=' + params.scripttype +
                '&scriptid=' + params.scriptid +
                '&sdatetime=' + params.sdatetime +
                '&edatetime=' + params.edatetime +
                '&compfil=' + COMP_FIL
            );
        }

    };
}