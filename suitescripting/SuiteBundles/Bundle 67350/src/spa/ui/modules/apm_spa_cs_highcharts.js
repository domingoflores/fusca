/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       03 Aug 2017     jmarimla         Initial
 * 2.00       10 Aug 2017     jmarimla         Tile charts
 * 3.00       11 Jun 2018     jmarimla         Translation engine
 * 4.00       26 Jul 2018     rwong            Highcharts translation
 *
 */
APMSPA = APMSPA || {};

APMSPA._Highcharts = function() {

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

    function renderTileChart($container, chartData, config) {

        var chartConfig = {
            chart: {
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
                    enabled: false,
                    formatter: function() {
                        var label = this.axis.defaultLabelFormatter.call(this);
                        if (label.endsWith('AM')) {
                            label = label.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (label.endsWith('PM')) {
                            label = label.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        return label;
                    }
                },
                tickLength: 0,
                lineColor: '#555555',
                lineWidth: 0,
                tickInterval: config.intervalMS,
                min: config.startDateMS,
                max: config.endDateMS,
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
                min: 0
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

        $container.highcharts(chartConfig);
    }

    return {
        renderTileChart: renderTileChart
    }

};