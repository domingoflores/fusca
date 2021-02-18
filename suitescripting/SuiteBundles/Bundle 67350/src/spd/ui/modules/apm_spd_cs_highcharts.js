/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       18 Aug 2017     jmarimla         Initial
 * 2.00       24 Aug 2017     jmarimla         Saved search details charts
 * 3.00       31 Aug 2017     jmarimla         SS context chart
 * 4.00       05 Sep 2017     jmarimla         SS logs popup
 * 5.00       07 Sep 2017     jmarimla         Changed cursor to pointer
 * 6.00       18 Sep 2017     jmarimla         Customer debugging
 * 7.00       21 Sep 2017     jmarimla         Minor chart changes
 * 8.00       02 Oct 2017     jmarimla         Decimal places and minor changes
 * 9.00       11 Jun 2018     jmarimla         Translation engine
 * 10.00      19 Jun 2018     justaris         Translation
 * 11.00      02 Jul 2018     justaris         Translation Readiness
 * 12.00      06 Jul 2018     jmarimla         Polishing translation
 * 13.00      26 Jul 2018     rwong            Highcharts translation
 *
 */
APMSPD = APMSPD || {};

APMSPD._Highcharts = function() {

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

    var _colorSet = [
        'rgba(27,158,119,0.8)', 'rgba(217,95,2,0.8)', 'rgba(117,112,179,0.8)', 'rgba(231,41,138,0.8)', 'rgba(102,166,30,0.8)',
        'rgba(0,51,102,0.8)', 'rgba(102,0,0,0.8)', 'rgba(102,102,51,0.8)', 'rgba(204,153,0,0.8)', 'rgba(153,255,102,0.8)',
    ];

    var _colorSetRGB = ['27,158,119', '217,95,2', '117,112,179', '231,41,138', '102,166,30',
        '0,51,102', '102,0,0', '102,102,51', '204,153,0', '153,255,102'
    ];

    var _ssDetailsData = {};

    function setSsDetailsData(chartData) {
        _ssDetailsData = chartData;
    }

    function renderSsDetailsExecutionChart() {
        var $container = $('.apm-spd-container-ssdetailscharts .execution');
        var chartData = _ssDetailsData;

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
                        text: APMTranslation.apm.common.label.median() + ' - ' + chartData.config.executionTimeMed,
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
                        text: APMTranslation.apm.common.label._95th() + ' - ' + chartData.config.executionTime95p,
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
                                syncToolTip('ssDetails', 'execution', pointIndex);
                            },
                            click: function() {
                                var pointIndex = this.index;

                                var completed = chartData.completed[pointIndex][1];
                                var timeout = chartData.timeout[pointIndex][1];
                                var failed = chartData.failed[pointIndex][1];
                                var total = completed + timeout + failed;
                                if (total == 0) return false;

                                var globalSettings = APMSPD.Services.getGlobalSettings();
                                var chartType = 'execution';
                                var startDateMS = APMSPD.Services.offsetToPSTms(parseInt(this.x));
                                var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

                                //correction with global ranges
                                if (globalSettings.startDateMS > startDateMS) startDateMS = globalSettings.startDateMS;
                                if (globalSettings.endDateMS < endDateMS) endDateMS = globalSettings.endDateMS;

                                var params = {
                                    chartType: chartType,
                                    startDateMS: startDateMS,
                                    endDateMS: endDateMS,
                                    searchId: globalSettings.searchId,
                                    compfil: globalSettings.compfil
                                };

                                APMSPD.Components.showLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Execution Time',
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
                name: '95p',
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

    function renderSsDetailsRequestsChart() {
        var $container = $('.apm-spd-container-ssdetailscharts .requests');
        var chartData = _ssDetailsData;

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

                    var completed = chartData.completed[pointIndex][1];
                    var timeout = chartData.timeout[pointIndex][1];
                    var failed = chartData.failed[pointIndex][1];
                    var total = completed + timeout + failed;

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
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.completed() + '</td><td>:</td><td align="center">' + completed + '</td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.timeout() + '</td><td>:</td><td align="center">' + timeout + '</td></tr>';
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
                                syncToolTip('ssDetails', 'requests', pointIndex);
                            },
                            click: function() {
                                var pointIndex = this.index;

                                var completed = chartData.completed[pointIndex][1];
                                var timeout = chartData.timeout[pointIndex][1];
                                var failed = chartData.failed[pointIndex][1];
                                var total = completed + timeout + failed;
                                if (total == 0) return false;

                                var globalSettings = APMSPD.Services.getGlobalSettings();
                                var chartType = 'requests';
                                var startDateMS = APMSPD.Services.offsetToPSTms(parseInt(this.x));
                                var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

                                //correction with global ranges
                                if (globalSettings.startDateMS > startDateMS) startDateMS = globalSettings.startDateMS;
                                if (globalSettings.endDateMS < endDateMS) endDateMS = globalSettings.endDateMS;

                                var params = {
                                    chartType: chartType,
                                    startDateMS: startDateMS,
                                    endDateMS: endDateMS,
                                    searchId: globalSettings.searchId,
                                    compfil: globalSettings.compfil
                                };

                                APMSPD.Components.showLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                name: APMTranslation.apm.common.label.failed(),
                legendIndex: 2,
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#D95E5E',
                fillColor: 'rgba(217, 94, 94, 0.8)',
                lineColor: 'rgba(217, 94, 94, 0.8)',
                lineWidth: 0,
                data: chartData.failed
            }, {
                name: APMTranslation.apm.common.label.timeout(),
                legendIndex: 1,
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#75ADDD',
                fillColor: 'rgba(117, 173, 221, 0.8)',
                lineColor: 'rgba(117, 173, 221, 0.8)',
                lineWidth: 0,
                data: chartData.timeout
            }, {
                name: APMTranslation.apm.common.label.completed(),
                legendIndex: 0,
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#83D97A',
                fillColor: 'rgba(131, 217, 122, 0.8)',
                lineColor: 'rgba(131, 217, 122, 0.8)',
                lineWidth: 0,
                data: chartData.completed
            }]
        };

        $container.highcharts(chartConfig);
    }

    function renderSsDetailsContextChart() {
        var $container = $('.apm-spd-container-ssdetailscharts .context');
        var chartData = _ssDetailsData;

        var chartConfig = {
            chart: {
                type: 'pie',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            title: {
                text: APMTranslation.apm.common.label.context(),
                style: {
                    color: '#666',
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            },
            credits: {
                enabled: false
            },
            legend: {
                layout: 'horizontal',
                maxHeight: 60,
                labelFormatter: function() {
                    var translatedContext = APMSPD.Services.translateContext(this.name);
                    return translatedContext;
                },
                itemStyle: {
                    width: 80
                }
            },
            tooltip: {
                formatter: function() {
                    var translatedContext = APMSPD.Services.translateContext(this.point.name);

                    var table = '<table>';
                    table += '<tr><td colspan="3" align="center"><b>' + translatedContext + ' (' + this.percentage.toFixed(2) + ' %)' + '</b></td></tr>';
                    table += '<tr><td align="left">' + APMTranslation.apm.common.label.requests() + '</td><td>:</td><td align="left">' + this.point.y + '</td></tr>';
                    table += '</table>';

                    return table;
                },
                useHTML: true
            },
            plotOptions: {
                pie: {
                    cursor: 'pointer',
                    allowPointSelect: true,
                    animation: false,
                    borderWidth: 1,
                    slicedOffset: 20,
                    showInLegend: true,
                    dataLabels: {
                        enabled: false,
                        formatter: function() {
                            return Math.round(this.percentage * 100) / 100 + ' %';
                        },
                        distance: 10,
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        },
                        connectorColor: '#666'
                    },
                    colors: _colorSet,
                    states: {
                        hover: {
                            enabled: true,
                            halo: false
                        }
                    },
                    point: {
                        events: {
                            click: function() {
                                var globalSettings = APMSPD.Services.getGlobalSettings();
                                var chartType = 'context';
                                var context = this.name;

                                var params = {
                                    chartType: chartType,
                                    context: context,
                                    startDateMS: globalSettings.startDateMS,
                                    endDateMS: globalSettings.endDateMS,
                                    searchId: globalSettings.searchId,
                                    compfil: globalSettings.compfil
                                };

                                APMSPD.Components.showLogsPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                data: chartData.context
            }]
        }

        $container.highcharts(chartConfig);
    }

    function renderSsDetailsHistogramChart() {
        var $container = $('.apm-spd-container-ssdetailscharts .histogram');
        var chartData = _ssDetailsData;

        var chartConfig = {
            chart: {
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
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            tooltip: {
                formatter: function() {
                    if (this.y == 0) return false;

                    var total = chartData.histogram.total;
                    var percentage = (this.y / total) * 100;

                    var table = '<table>';
                    table += '<tr><td style="color:#2F7ED8">' + APMTranslation.apm.common.label.requests() + '</td>' + '<td>:</td>' + '<td>' + this.y + '</td></tr>';
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
                    formatter: function() {
                        var label = this.value;
                        if (this.value == chartData.histogram.threshold) label = '>' + chartData.histogram.threshold;
                        else if (this.value > chartData.histogram.threshold) label = '';
                        return label;
                    }
                },
                tickLength: 5,
                //tickColor : '#555555',
                lineColor: '#555555',
                lineWidth: 0,
                tickInterval: chartData.histogram.resolution
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
                allowDecimals: false,
                min: 0,
                minRange: .01
            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    color: 'rgba(47, 126, 216, 0.8)',
                    animation: false,
                    states: {
                        hover: {
                            enabled: false
                        }
                    },
                    point: {
                        events: {
                            click: function() {
                                var globalSettings = APMSPD.Services.getGlobalSettings();
                                var chartType = 'histogram';
                                var executionTime = this.x;

                                var params = {
                                    chartType: chartType,
                                    executionTime: executionTime,
                                    startDateMS: globalSettings.startDateMS,
                                    endDateMS: globalSettings.endDateMS,
                                    searchId: globalSettings.searchId,
                                    compfil: globalSettings.compfil
                                };

                                APMSPD.Components.showLogsPopup(params);
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
                data: chartData.histogram.frequency
            }]
        };

        $container.highcharts(chartConfig);
    }

    function renderSsContextChart(chartData) {
        var $container = APMSPD.Components.$SsContextPortlet.psgpPortlet('getBody');
        var series = new Array();

        var seriesCount = 0;
        for (var key in chartData.executionTime) {
            if (chartData.executionTime.hasOwnProperty(key)) {
                series.push({
                    name: chartData.series[key],
                    type: 'spline',
                    animation: false,
                    color: 'rgba(' + _colorSetRGB[seriesCount % _colorSetRGB.length] + ',1.0)',
                    fillColor: 'rgba(' + _colorSetRGB[seriesCount % _colorSetRGB.length] + ',0.8)',
                    lineColor: 'rgba(' + _colorSetRGB[seriesCount % _colorSetRGB.length] + ',1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: 'rgba(' + _colorSetRGB[seriesCount % _colorSetRGB.length] + ',1.0)',
                                lineColor: 'rgba(' + _colorSetRGB[seriesCount % _colorSetRGB.length] + ',1.0)',
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
                min: 0
            },
            series: series
        };

        $container.highcharts(chartConfig);
    }

    function syncToolTip(chartGroup, chartId, point) {

        function showExecutionTooltip() {
            var executionChart = $('.apm-spd-container-ssdetailscharts .execution').highcharts();
            executionChart.tooltip.refresh([executionChart.series[0].data[point]]);
        }

        function showRequestsTooltip() {
            var throughputChart = $('.apm-spd-container-ssdetailscharts .requests').highcharts();
            throughputChart.tooltip.refresh([throughputChart.series[0].data[point]]);
        }


        switch (chartGroup) {
            case 'ssDetails':
                switch (chartId) {

                    case 'execution':
                        showRequestsTooltip();
                        break;

                    case 'requests':
                        showExecutionTooltip();
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
            $('.apm-spd-container-ssdetailscharts .execution').highcharts(),
            $('.apm-spd-container-ssdetailscharts .requests').highcharts()
        ];

        for (var i in charts) {
            var chart = charts[i];
            if (chart) {
                chart.tooltip.hide();
            }
        }
    }

    return {
        setSsDetailsData: setSsDetailsData,

        renderSsDetailsExecutionChart: renderSsDetailsExecutionChart,
        renderSsDetailsRequestsChart: renderSsDetailsRequestsChart,
        renderSsDetailsContextChart: renderSsDetailsContextChart,
        renderSsDetailsHistogramChart: renderSsDetailsHistogramChart,

        renderSsContextChart: renderSsContextChart

    };

};