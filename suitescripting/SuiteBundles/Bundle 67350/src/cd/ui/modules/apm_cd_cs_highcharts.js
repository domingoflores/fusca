/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Feb 2018     jmarimla         Initial
 * 2.00       22 Feb 2018     jmarimla         Drilldown
 * 3.00       23 Mar 2018     jmarimla         Fixed tooltip
 * 4.00       04 Apr 2018     jmarimla         Labels
 * 5.00       12 Apr 2018     jmarimla         Labels
 * 6.00       17 Apr 2018     jmarimla         Customer debugging
 * 7.00       24 May 2018     jmarimla         Always show limit
 * 8.00       07 Jun 2018     jmarimla         Label change
 * 9.00       11 Jun 2018     jmarimla         Translation engine
 * 10.00      02 Jul 2018     justaris         Translation Readiness
 * 11.00      26 Jul 2018     rwong            Highcharts translation
 * 12.00      27 Nov 2018     jmarimla         Corrected strings
 * 13.00      12 Apr 2019     jmarimla         Corrected strings
 *
 */
APMCD = APMCD || {};

APMCD._Highcharts = function() {

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

    var _concurrencyDetailsData = {};
    var _violationsData = {};

    var _currentTooltip = null;

    function renderConcurrencyDetailsChart(chartData) {
        _concurrencyDetailsData = chartData;

        var $container = $('.apm-cd-exactconcurrency.panel-1');

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0
            },
            title: {
                text: APMTranslation.apm.cd.label.detailedconcurrency(),
                style: {
                    color: '#666666',
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            },
            legend: {
                enabled: false,
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

                    var concurrency = chartData.concurrency[pointIndex][1];

                    var groupAggMS = chartData.config.groupAggMS;
                    var groupAggString = '';
                    if (groupAggMS < 1000 * 60) {
                        var value = groupAggMS / (1000);
                        var label = (value > 1) ? APMTranslation.apm.cd.label.secs() : APMTranslation.apm.cd.label.sec();
                        groupAggString = '' + value + ' ' + label;
                    } else if (groupAggMS < 1000 * 60 * 60) {
                        var value = groupAggMS / (1000 * 60);
                        var label = (value > 1) ? APMTranslation.apm.common.label.mins() : APMTranslation.apm.common.label.min();
                        groupAggString = '' + value + ' ' + label;
                    } else {
                        var value = groupAggMS / (1000 * 60 * 60);
                        var label = (value > 1) ? APMTranslation.apm.common.label.hrs() : APMTranslation.apm.common.label.hr();
                        groupAggString = '' + value + ' ' + label;
                    }

                    var fromDate = Highcharts.dateFormat('%l:%M:%S %p', this.x);
                    if (fromDate.endsWith('AM')) {
                        fromDate = fromDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                    }
                    if (fromDate.endsWith('PM')) {
                        fromDate = fromDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                    }
                    var toDate = Highcharts.dateFormat('%l:%M:%S %p', this.x + groupAggMS);
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
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.concurrency() + '</td><td>:</td><td align="center">' + concurrency + '</td></tr>';
                    table += '<tr><td align="center" colspan="3"><a href="#" onclick="APMCD.Highcharts.viewConcurrencyInstances();return false;">' + APMTranslation.apm.cd.label.viewrequests() + '</a></td></tr>';
                    table += '</table>';

                    _currentTooltip = this;
                    return table;
                },
                shared: true,
                style: {
                    pointerEvents: 'auto'
                },
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
                    text: APMTranslation.apm.common.label.concurrencycount(),
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
                plotLines: [{
                    color: '#FAB65D',
                    width: 1,
                    dashStyle: 'Dash',
                    zIndex: 5,
                    label: {
                        align: 'left',
                        text: '80%',
                        style: {
                            color: '#FAB65D',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Open Sans,Helvetica,sans-serif'
                        },
                        x: 10
                    },
                    value: (chartData.config.maxConcurrency) ? (chartData.config.maxConcurrency * .8) : 0
                }, {
                    color: '#FA3424',
                    width: 1,
                    dashStyle: 'Dash',
                    zIndex: 5,
                    label: {
                        align: 'left',
                        text: APMTranslation.apm.cd.label.max({
                            params: [chartData.config.maxConcurrency]
                        }),
                        style: {
                            color: '#FA3424',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Open Sans,Helvetica,sans-serif'
                        },
                        x: 10
                    },
                    value: (chartData.config.maxConcurrency) ? (chartData.config.maxConcurrency) : 0
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
                                syncToolTip('concurrency', 'concurrencyDetails', pointIndex);
                            },
                            click: function() {
                                var chartData = _concurrencyDetailsData;
                                var params = {
                                    x: this.x,
                                    groupAggMS: chartData.config.groupAggMS
                                }
                                APMCD.Services.refreshData(true, params);
                            }
                        }
                    }
                }
            },
            series: [{
                    name: 'Concurrency',
                    type: 'column',
                    animation: false,
                    color: 'rgba(33, 113, 181, 0.7)',
                    fillColor: 'rgba(33, 113, 181, 0.7)',
                    lineColor: 'rgba(33, 113, 181, 0.7)',
                    lineWidth: 0,
                    data: chartData.concurrency
                },
                {
                    name: 'limit',
                    type: 'column',
                    color: 'rgba(255,255,255,0)',
                    borderColor: 'rgba(255,255,255,0)',
                    marker: {
                        enabled: false
                    },
                    showInLegend: false,
                    data: [
                        [chartData.concurrency[0][0], chartData.config.maxConcurrency]
                    ]
                }
            ]
        };

        $container.highcharts(chartConfig);
    }

    function renderViolationsChart(chartData) {
        _violationsData = chartData;

        var $container = $('.apm-cd-exactconcurrency.panel-2');

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0
            },
            title: {
                text: APMTranslation.apm.cd.label.exceededconcurrency(),
                style: {
                    color: '#666666',
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            },
            legend: {
                enabled: false,
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

                    var violations = chartData.violations[pointIndex][1];

                    var groupAggMS = chartData.config.groupAggMS;
                    var groupAggString = '';
                    if (groupAggMS < 1000 * 60) {
                        var value = groupAggMS / (1000);
                        var label = (value > 1) ? APMTranslation.apm.cd.label.secs() : APMTranslation.apm.cd.label.sec();
                        groupAggString = '' + value + ' ' + label;
                    } else if (groupAggMS < 1000 * 60 * 60) {
                        var value = groupAggMS / (1000 * 60);
                        var label = (value > 1) ? APMTranslation.apm.common.label.mins() : APMTranslation.apm.common.label.min();
                        groupAggString = '' + value + ' ' + label;
                    } else {
                        var value = groupAggMS / (1000 * 60 * 60);
                        var label = (value > 1) ? APMTranslation.apm.common.label.hrs() : APMTranslation.apm.common.label.hr();
                        groupAggString = '' + value + ' ' + label;
                    }

                    var fromDate = Highcharts.dateFormat('%l:%M:%S %p', this.x);
                    if (fromDate.endsWith('AM')) {
                        fromDate = fromDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                    }
                    if (fromDate.endsWith('PM')) {
                        fromDate = fromDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                    }
                    var toDate = Highcharts.dateFormat('%l:%M:%S %p', this.x + groupAggMS);
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
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.exceededconcurrencycount() + '</td><td>:</td><td align="center">' + violations + '</td></tr>';
                    table += '<tr><td align="center" colspan="3"><a href="#" onclick="APMCD.Highcharts.viewConcurrencyInstances();return false;">' + APMTranslation.apm.cd.label.viewrequests() + '</a></td></tr>';
                    table += '</table>';

                    _currentTooltip = this;
                    return table;
                },
                shared: true,
                style: {
                    pointerEvents: 'auto'
                },
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
                    text: APMTranslation.apm.common.label.exceededconcurrencycount(),
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
                                syncToolTip('concurrency', 'violations', pointIndex);
                            },
                            click: function() {
                                var chartData = _violationsData;
                                if (chartData.config.groupAggMS <= 1000) {
                                    return;
                                }
                                var params = {
                                    x: this.x,
                                    groupAggMS: chartData.config.groupAggMS
                                }
                                APMCD.Services.refreshData(true, params);
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Violations',
                type: 'column',
                animation: false,
                color: 'rgba(217, 94, 94, 0.7)',
                fillColor: 'rgba(217, 94, 94, 0.7)',
                lineColor: 'rgba(217, 94, 94, 0.7)',
                lineWidth: 0,
                data: chartData.violations
            }]
        };

        $container.highcharts(chartConfig);
    }

    function viewConcurrencyInstances() {
        var chartData = _violationsData;

        var startDateMS = APMCD.Services.offsetToPSTms(parseInt(_currentTooltip.x));
        var endDateMS = startDateMS + parseInt(chartData.config.groupAggMS);

        var params = {
            startDateMS: startDateMS,
            endDateMS: endDateMS,
            compfil: APMCD.Services.getGlobalSettings().compfil
        };

        APMCD.Components.showInstancesPopup(params);
    }

    function syncToolTip(chartGroup, chartId, point) {

        function showConcurrencyDetailsTooltip() {
            var chartObj = $('.apm-cd-exactconcurrency.panel-1').highcharts();
            chartObj.tooltip.refresh([chartObj.series[0].data[point]]);
        }

        function showViolationsTooltip() {
            var chartObj = $('.apm-cd-exactconcurrency.panel-2').highcharts();
            chartObj.tooltip.refresh([chartObj.series[0].data[point]]);
        }

        switch (chartGroup) {
            case 'concurrency':
                switch (chartId) {

                    case 'concurrencyDetails':
                        showViolationsTooltip();
                        break;

                    case 'violations':
                        showConcurrencyDetailsTooltip();
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
            $('.apm-cd-exactconcurrency.panel-1').highcharts(),
            $('.apm-cd-exactconcurrency.panel-2').highcharts()
        ];

        for (var i in charts) {
            var chart = charts[i];
            if (chart) {
                chart.tooltip.hide();
            }
        }
    }

    return {
        renderConcurrencyDetailsChart: renderConcurrencyDetailsChart,
        renderViolationsChart: renderViolationsChart,
        viewConcurrencyInstances: viewConcurrencyInstances
    };

};