/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Jun 2017     jmarimla         Initial
 * 2.00       16 Jun 2017     jmarimla         Perf details charts
 * 3.00       22 Jun 2017     jmarimla         Modify request chart
 * 4.00       14 Jul 2017     jmarimla         Removed unused statuses
 * 5.00       20 Jul 2017     rwong            Top Record Performance
 * 6.00       28 Jul 2017     jmarimla         Fixed no data bug
 * 7.00       21 Sep 2017     jmarimla         Minor chart changes
 * 8.00       09 Oct 2017     jmarimla         Spline chart type
 * 9.00       16 Oct 2017     jmarimla         Concurrency statuses
 * 10.00      11 Jun 2018     jmarimla         Translation engine
 * 11.00      02 Jul 2018     rwong            Translation strings
 * 12.00      19 Jul 2018     rwong            Translation strings
 * 13.00      26 Jul 2018     jmarimla         FRHT link
 * 14.00      26 Jul 2018     rwong            Highcharts translation
 * 15.00      31 Jul 2018     rwong            Translation strings
 *
 */
APMWSOD = APMWSOD || {};

APMWSOD._Highcharts = function() {

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

    var colorSet = ['27,158,119', '217,95,2', '117,112,179', '231,41,138', '102,166,30'];

    var _perfDetailsData = {};

    function setPerfDetailsData(chartData) {
        _perfDetailsData = chartData;
    }

    function renderPerfDetailsExecutionChart() {
        var $container = $('.apm-wsod-container-perfdetailscharts .execution');
        var chartData = _perfDetailsData;

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginRight: 25,
                marginLeft: 75
            },
            title: {
                text: APMTranslation.apm.common.label.executiontime(),
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
            tooltip: {
                crosshairs: {
                    width: 1,
                    color: '#bbbbbb',
                    dashStyle: 'solid'
                },
                formatter: function() {
                    if (this.y == 0) return false;

                    var pointIndex = chartData.indices[this.x];

                    var executionTime = chartData['executionTime'][pointIndex][1];

                    var groupAggMS = chartData.config.groupAggMS;
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
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.executiontime() + '</td><td>:</td><td align="center">' + executionTime.toFixed(3) + ' s</td></tr>';
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
                tickColor: '#555555',
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
                minRange: 60 * 1000,
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
                    },
                    format: '{value} s'
                },
                min: 0,
                plotLines: [{
                    color: '#4F5ED6',
                    width: 1,
                    dashStyle: 'Dash',
                    zIndex: 5,
                    label: {
                        align: 'left',
                        text: APMTranslation.apm.common.label.median().toUpperCase() + ' - ' + chartData.config.executionTimeMed,
                        style: {
                            color: '#4F5ED6',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Open Sans,Helvetica,sans-serif'
                        },
                        x: 10,
                        y: 10
                    },
                    value: chartData.config.executionTimeMed
                }, {
                    color: '#FA3424',
                    width: 1,
                    dashStyle: 'Dash',
                    zIndex: 5,
                    label: {
                        align: 'left',
                        text: APMTranslation.apm.common.label._95th().toUpperCase() + ' - ' + chartData.config.executionTime95p,
                        style: {
                            color: '#FA3424',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Open Sans,Helvetica,sans-serif'
                        },
                        x: 10
                    },
                    value: chartData.config.executionTime95p
                }],
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        mouseOut: function() {
                            hideTooltip();
                        }
                    },
                    point: {
                        events: {
                            mouseOver: function() {
                                var pointIndex = chartData.indices[this.x];
                                syncToolTip('perfdetails', 'execution', pointIndex);
                            },
                            click: function() {
                                var pointIndex = this.index;

                                var globalSettings = APMWSOD.Services.getGlobalSettings();
                                var startDateMS = APMWSOD.Services.offsetToPSTms(parseInt(this.x));
                                var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

                                //correction with global ranges
                                if (globalSettings.startDateMS > startDateMS) startDateMS = globalSettings.startDateMS;
                                if (globalSettings.endDateMS < endDateMS) endDateMS = globalSettings.endDateMS;

                                var params = {
                                    startDateMS: startDateMS,
                                    endDateMS: endDateMS,
                                    operation: globalSettings.operation,
                                    integration: globalSettings.integration,
                                    compfil: globalSettings.compfil
                                };

                                APMWSOD.Components.showWsoLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                name: APMTranslation.apm.common.label.executiontime(),
                type: 'spline',
                animation: false,
                color: '#75ADDD',
                fillColor: 'rgba(117, 173, 221, 0.8)',
                lineColor: 'rgba(117, 173, 221, 1.0)',
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            fillColor: '#FFFFFF',
                            lineColor: '#75ADDD',
                            radiusPlus: 2,
                            lineWidthPlus: 1
                        }
                    }
                },
                data: chartData.executionTime
            }, {
                name: APMTranslation.apm.common.label._95th(),
                type: 'column',
                color: 'rgba(255,255,255,0)',
                borderColor: 'rgba(255,255,255,0)',
                marker: {
                    enabled: false
                },
                showInLegend: false,
                data: [
                    [(chartData.executionTime[0]) ? chartData.executionTime[0][0] : 0, chartData.config.executionTime95p]
                ]
            }]
        };

        $container.highcharts(chartConfig);
    }

    function renderPerfDetailsThroughputChart() {
        var $container = $('.apm-wsod-container-perfdetailscharts .throughput');
        var chartData = _perfDetailsData;

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginRight: 25
            },
            title: {
                text: APMTranslation.apm.common.label.requests(),
                style: {
                    color: '#666666',
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    fontWeight: 'bold'
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
                    var pointIndex = chartData.indices[this.x];

                    var finished = chartData.throughput['finished'][pointIndex][1];
                    var rejecteduserconcurrency = chartData.throughput['rejecteduserconcurrency'][pointIndex][1];
                    var rejectedaccountconcurrency = chartData.throughput['rejectedaccountconcurrency'][pointIndex][1];
                    var failed = chartData.throughput['failed'][pointIndex][1];
                    var total = finished + failed + rejecteduserconcurrency + rejectedaccountconcurrency;

                    if (total == 0) return false;

                    var groupAggMS = chartData.config.groupAggMS;
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
                    table += '<tr><td align="center">' + APMTranslation.apm.ns.status.finished() + '</td><td>:</td><td align="center">' + finished + '</td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.rejecteduserconcurrency() + '</td><td>:</td><td align="center">' + rejecteduserconcurrency + '</td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.rejectedaccountconcurrency() + '</td><td>:</td><td align="center">' + rejectedaccountconcurrency + '</td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.failed() + '</td><td>:</td><td align="center">' + failed + '</td></tr>';
                    table += '<tr><td align="center"><b>' + APMTranslation.apm.common.label.total() + '</b></td><td>:</td><td align="center">' + total + '</td></tr>';
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
                tickColor: '#555555',
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
                minRange: 60 * 1000,
                startOnTick: false,
                endOnTick: false
            },
            yAxis: {
                title: {
                    text: APMTranslation.apm.common.label.requests(),
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
                min: 0
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        mouseOut: function() {
                            hideTooltip();
                        }
                    },
                    point: {
                        events: {
                            mouseOver: function() {
                                var pointIndex = chartData.indices[this.x];
                                syncToolTip('perfdetails', 'throughput', pointIndex);
                            },
                            click: function() {
                                var pointIndex = this.index;

                                var globalSettings = APMWSOD.Services.getGlobalSettings();
                                var startDateMS = APMWSOD.Services.offsetToPSTms(parseInt(this.x));
                                var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

                                //correction with global ranges
                                if (globalSettings.startDateMS > startDateMS) startDateMS = globalSettings.startDateMS;
                                if (globalSettings.endDateMS < endDateMS) endDateMS = globalSettings.endDateMS;

                                var params = {
                                    startDateMS: startDateMS,
                                    endDateMS: endDateMS,
                                    operation: globalSettings.operation,
                                    integration: globalSettings.integration,
                                    compfil: globalSettings.compfil
                                };

                                APMWSOD.Components.showWsoLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                    name: APMTranslation.apm.common.label.failed(),
                    legendIndex: 3,
                    type: 'area',
                    stacking: 'normal',
                    animation: false,
                    color: '#D95E5E',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: 'rgba(217, 94, 94, 1)',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.throughput['failed']
                },
                {
                    name: APMTranslation.apm.common.label.rejectedaccountconcurrency(),
                    legendIndex: 2,
                    type: 'area',
                    stacking: 'normal',
                    animation: false,
                    color: '#FAB65D',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: 'rgba(250, 182, 93, 0.8)',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.throughput['rejectedaccountconcurrency']
                },
                {
                    name: APMTranslation.apm.common.label.rejecteduserconcurrency(),
                    legendIndex: 1,
                    type: 'area',
                    stacking: 'normal',
                    animation: false,
                    color: '#F3EB5E',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: 'rgba(243, 235, 94, 0.8)',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.throughput['rejecteduserconcurrency']
                },
                {
                    name: APMTranslation.apm.ns.status.finished(),
                    legendIndex: 0,
                    type: 'area',
                    stacking: 'normal',
                    animation: false,
                    color: '#83D97A',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: 'rgba(131, 217, 122, 1)',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.throughput['finished']
                }
            ]
        };

        $container.highcharts(chartConfig);
    }

    function renderPerfDetailsErrorRateChart() {
        var $container = $('.apm-wsod-container-perfdetailscharts .errorrate');
        var chartData = _perfDetailsData;

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginRight: 25,
                marginLeft: 75
            },
            title: {
                text: APMTranslation.apm.common.label.errorrate(),
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
            tooltip: {
                crosshairs: {
                    width: 1,
                    color: '#bbbbbb',
                    dashStyle: 'solid'
                },
                formatter: function() {
                    if (this.y == 0) return false;

                    var pointIndex = chartData.indices[this.x];

                    var errorRate = chartData['errorRate'][pointIndex][1];

                    var groupAggMS = chartData.config.groupAggMS;
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
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.errorrate() + '</td><td>:</td><td align="center">' + errorRate.toFixed(2) + ' %</td></tr>';
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
                tickColor: '#555555',
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
                minRange: 60 * 1000,
                startOnTick: false,
                endOnTick: false
            },
            yAxis: {
                title: {
                    text: APMTranslation.apm.common.label.percentage(),
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
                    format: '{value} %'
                },
                min: 0
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        mouseOut: function() {
                            hideTooltip();
                        }
                    },
                    point: {
                        events: {
                            mouseOver: function() {
                                var pointIndex = chartData.indices[this.x];
                                syncToolTip('perfdetails', 'errorrate', pointIndex);
                            },
                            click: function() {
                                var pointIndex = this.index;

                                var globalSettings = APMWSOD.Services.getGlobalSettings();
                                var startDateMS = APMWSOD.Services.offsetToPSTms(parseInt(this.x));
                                var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

                                //correction with global ranges
                                if (globalSettings.startDateMS > startDateMS) startDateMS = globalSettings.startDateMS;
                                if (globalSettings.endDateMS < endDateMS) endDateMS = globalSettings.endDateMS;

                                var params = {
                                    startDateMS: startDateMS,
                                    endDateMS: endDateMS,
                                    operation: globalSettings.operation,
                                    integration: globalSettings.integration,
                                    compfil: globalSettings.compfil
                                };

                                APMWSOD.Components.showWsoLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                name: APMTranslation.apm.common.label.errorrate(),
                type: 'column',
                animation: false,
                color: 'rgba(33, 113, 181, 0.7)',
                fillColor: 'rgba(33, 113, 181, 0.7)',
                lineColor: 'rgba(33, 113, 181, 0.7)',
                lineWidth: 0,
                data: chartData.errorRate
            }]
        };

        $container.highcharts(chartConfig);
    }

    function renderPerfDetailsRecordsChart() {
        var $container = $('.apm-wsod-container-perfdetailscharts .records');
        var chartData = _perfDetailsData;

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0
            },
            title: {
                text: APMTranslation.apm.common.label.records(),
                style: {
                    color: '#666666',
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    fontWeight: 'bold'
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

                    var pointIndex = chartData.indices[this.x];

                    var recordsTotal = chartData['records']['total'][pointIndex][1];
                    var recordsRate = chartData['records']['rate'][pointIndex][1];

                    var groupAggMS = chartData.config.groupAggMS;
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
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.totalrecords() + '</td><td>:</td><td align="center">' + recordsTotal + '</td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.recordsperminute() + '</td><td>:</td><td align="center">' + recordsRate.toFixed(2) + '</td></tr>';
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
                tickColor: '#555555',
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
                minRange: 60 * 1000,
                startOnTick: false,
                endOnTick: false
            },
            yAxis: [{
                opposite: true,
                title: {
                    text: APMTranslation.apm.common.label.recordsperminute(),
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
                min: 0
            }, {
                title: {
                    text: APMTranslation.apm.common.label.totalrecords(),
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
                min: 0
            }],
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    events: {
                        mouseOut: function() {
                            hideTooltip();
                        }
                    },
                    point: {
                        events: {
                            mouseOver: function() {
                                var pointIndex = chartData.indices[this.x];
                                syncToolTip('perfdetails', 'records', pointIndex);
                            },
                            click: function() {
                                var pointIndex = this.index;

                                var globalSettings = APMWSOD.Services.getGlobalSettings();
                                var startDateMS = APMWSOD.Services.offsetToPSTms(parseInt(this.x));
                                var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

                                //correction with global ranges
                                if (globalSettings.startDateMS > startDateMS) startDateMS = globalSettings.startDateMS;
                                if (globalSettings.endDateMS < endDateMS) endDateMS = globalSettings.endDateMS;

                                var params = {
                                    startDateMS: startDateMS,
                                    endDateMS: endDateMS,
                                    operation: globalSettings.operation,
                                    integration: globalSettings.integration,
                                    compfil: globalSettings.compfil
                                };

                                APMWSOD.Components.showWsoLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                name: APMTranslation.apm.common.label.totalrecords(),
                type: 'column',
                animation: false,
                color: 'rgba(145, 191, 219, 0.8)',
                fillColor: 'rgba(145, 191, 219, 0.8)',
                lineColor: 'rgba(145, 191, 219, 0.8)',
                lineWidth: 0,
                data: chartData.records['total'],
                yAxis: 1
            }, {
                name: APMTranslation.apm.common.label.recordsperminute(),
                type: 'spline',
                color: '#FC8D59',
                animation: false,
                fillColor: 'rgba(252, 141, 89, 0.8)',
                lineColor: 'rgba(252, 141, 89, 1.0)',
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            fillColor: '#FFFFFF',
                            lineColor: '#FC8D59',
                            radiusPlus: 2,
                            lineWidthPlus: 1
                        }
                    }
                },
                data: chartData.records['rate']
            }]
        };

        $container.highcharts(chartConfig);
    }

    function syncToolTip(chartGroup, chartId, point) {

        function showExecutionTooltip() {
            var executionChart = $('.apm-wsod-container-perfdetailscharts .execution').highcharts();
            executionChart.tooltip.refresh([executionChart.series[0].data[point]]);
        }

        function showThroughputTooltip() {
            var throughputChart = $('.apm-wsod-container-perfdetailscharts .throughput').highcharts();
            throughputChart.tooltip.refresh([throughputChart.series[0].data[point]]);
        }

        function showErrorRateTooltip() {
            var errorRateChart = $('.apm-wsod-container-perfdetailscharts .errorrate').highcharts();
            errorRateChart.tooltip.refresh([errorRateChart.series[0].data[point]]);
        }

        function showRecordsTooltip() {
            var recordsChart = $('.apm-wsod-container-perfdetailscharts .records').highcharts();
            recordsChart.tooltip.refresh([recordsChart.series[0].data[point]]);
        }


        switch (chartGroup) {
            case 'perfdetails':
                switch (chartId) {

                    case 'execution':
                        showThroughputTooltip();
                        showErrorRateTooltip();
                        showRecordsTooltip();
                        break;

                    case 'throughput':
                        showExecutionTooltip();
                        showErrorRateTooltip();
                        showRecordsTooltip();
                        break;

                    case 'errorrate':
                        showExecutionTooltip();
                        showThroughputTooltip();
                        showRecordsTooltip();
                        break;

                    case 'records':
                        showExecutionTooltip();
                        showThroughputTooltip();
                        showErrorRateTooltip();
                        break;

                    default:
                        return;
                }

                break;

            default:
                return;
        }
    }

    function hideTooltip() {
        var charts = [
            $('.apm-wsod-container-perfdetailscharts .execution').highcharts(),
            $('.apm-wsod-container-perfdetailscharts .throughput').highcharts(),
            $('.apm-wsod-container-perfdetailscharts .errorrate').highcharts(),
            $('.apm-wsod-container-perfdetailscharts .records').highcharts(),
        ];

        for (var i in charts) {
            var chart = charts[i];
            if (chart) {
                chart.tooltip.hide();
            }
        }
    }

    function renderTopRecPerf(chartData) {
        var $container = APMWSOD.Components.$TopRecPerf.psgpPortlet('getBody');
        var series = new Array();

        var seriesCount = 0;
        var seriesKeys = '';
        for (var key in chartData.executionTime) {
            if (chartData.executionTime.hasOwnProperty(key)) {
                seriesKeys += key + '|';
                series.push({
                    name: chartData.series[key],
                    type: 'spline',
                    animation: false,
                    color: 'rgba(' + colorSet[seriesCount % colorSet.length] + ',1.0)',
                    fillColor: 'rgba(' + colorSet[seriesCount % colorSet.length] + ',0.8)',
                    lineColor: 'rgba(' + colorSet[seriesCount % colorSet.length] + ',1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: 'rgba(' + colorSet[seriesCount % colorSet.length] + ',1.0)',
                                lineColor: 'rgba(' + colorSet[seriesCount % colorSet.length] + ',1.0)',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData.executionTime[key]
                })
                seriesCount += 1;
            }
        }

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginTop: 50,
                marginRight: 50
            },
            title: false,
            legend: {
                enabled: true
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
                    var pointIndex = chartData.indices[this.x];

                    var groupAggMS = chartData.config.groupAggMS;
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

                    $.each(this.points, function() {
                        table += '<tr><td align="center" style="color:' + this.series.color + '">' + this.series.name + '</td><td>:</td><td align="center">' + this.y.toFixed(3) + ' s</td></tr>';
                    })

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
                tickColor: '#555555',
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
                minRange: 60 * 1000,
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
                    },
                    format: '{value} s'
                },
                min: 0,
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function() {
                                var pointIndex = this.index;

                                var globalSettings = APMWSOD.Services.getGlobalSettings();
                                var startDateMS = APMWSOD.Services.offsetToPSTms(parseInt(this.x));
                                var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

                                //correction with global ranges
                                if (globalSettings.startDateMS > startDateMS) startDateMS = globalSettings.startDateMS;
                                if (globalSettings.endDateMS < endDateMS) endDateMS = globalSettings.endDateMS;

                                var params = {
                                    startDateMS: startDateMS,
                                    endDateMS: endDateMS,
                                    operation: globalSettings.operation,
                                    integration: globalSettings.integration,
                                    compfil: globalSettings.compfil,
                                    recordTypeKeys: seriesKeys
                                };

                                APMWSOD.Components.showWsrpLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: series
        };

        $container.highcharts(chartConfig);
    }

    return {
        setPerfDetailsData: setPerfDetailsData,
        renderPerfDetailsExecutionChart: renderPerfDetailsExecutionChart,
        renderPerfDetailsThroughputChart: renderPerfDetailsThroughputChart,
        renderPerfDetailsErrorRateChart: renderPerfDetailsErrorRateChart,
        renderPerfDetailsRecordsChart: renderPerfDetailsRecordsChart,
        renderTopRecPerf: renderTopRecPerf
    };

};