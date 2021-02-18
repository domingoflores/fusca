/**
 * Copyright © 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       18 Jan 2018     jmarimla         Initial
 * 2.00       29 Jan 2018     rwong            Added concurrency heatmap
 * 3.00       02 Feb 2018     rwong            Fixed tooltip display
 * 4.00       06 Feb 2018     jmarimla         Concurrency details
 * 5.00       19 Feb 2018     jmarimla         Heatmap onclick
 * 6.00       19 Feb 2018     rwong            Violation chart
 * 7.00       23 Feb 2018     jmarimla         Remove concurrency details
 * 8.00       03 Mar 2018     jmarimla         Violations data
 * 9.00       04 Apr 2018     jmarimla         Labels
 * 10.00      17 Apr 2018     jmarimla         Customer debugging
 * 11.00      04 May 2018     jmarimla         Heatmap cursor
 * 12.00      11 May 2018     jmarimla         Percentage buckets
 * 13.00      15 May 2018     jmarimla         Modified Notes
 * 14.00      11 Jun 2018     jmarimla         Translation engine
 * 15.00      29 Jun 2018     justaris         Translation Readiness
 * 16.00      26 Jul 2018     rwong            Highcharts translation
 * 17.00      07 Jan 2019     rwong            Added note to customer debugging for concurrency limit
 * 18.00      12 Feb 2019     rwong            Support concurrency limit for customer debugging
 * 19.00      03 Mar 2019     jmarimla         Footnote for invalid concurrency
 *
 */
APMCM = APMCM || {};

APMCM._Highcharts = function() {

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

    var _concurrencyHMData = {};
    var _violationsHMData = {};

    function setConcurrencyHMChart(chartData) {
        _concurrencyHMData = chartData;
    }

    function setViolationsHMChart(chartData) {
        _violationsHMData = chartData;
    }

    function renderConcurrencyHMChart() {

        var chartType = APMCM.Components.$ConcurrencyComboBox.find('.psgp-combobox').val();

        var chartData = null;
        if (chartType == 'concurrency') {
            chartData = _concurrencyHMData;
            $('.apm-cm-concurrency-legend').show();
            $('.apm-cm-concurrency-footnote').html('<i>' + APMTranslation.apm.cm.label.note() + ': </i>' + APMTranslation.apm.cm.label.percentvaluesareapproximate());
			var concLimit = $($( "div[dataindex='concurrencylimit']" )[0]).find('.psgp-kpipanel-item-value').html();
            if ( !concLimit || concLimit == '\u2014' ) {
                $('.apm-cm-concurrency-footnote').append('<br><i>Important:</i><br>The General Concurrency portlet need the concurrency limit to calculate its values.');
                $('.apm-cm-concurrency-footnote').append('<br>When the value of the concurrency limit is not available (\u2014), the General Concurrency portlet assumes a generic limit, which may cause it to display unreliable values.');
            }
        } else {
            chartData = _violationsHMData;
            $('.apm-cm-concurrency-legend').hide();
            $('.apm-cm-concurrency-footnote').html('<i>' + APMTranslation.apm.cm.label.note() + ': </i>' + APMTranslation.apm.cm.label.valuesareexact());
        }

        var $container = $('.apm-cm-concurrency-estimated');

        //determine height based on number of yCategories
        var xLabelHeight = 180;
        var yHeight = 25 * (chartData.yCategories.length ? chartData.yCategories.length : 0)
        var totalHeight = xLabelHeight + yHeight;
        $container.height(totalHeight);

        var chartConfig = {};

        if (chartType == 'concurrency') {
            chartConfig = {
                chart: {
                    type: 'heatmap',
                    plotBorderWidth: 1
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: chartData.xCategories,
                    opposite: false,
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
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    tickLength: 0,
                    min: 0,
                    max: chartData.xCategories.length - 1
                },
                yAxis: {
                    categories: chartData.yCategories,
                    reversed: true,
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
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    }
                },
                colorAxis: {
                    min: 0,
                    max: 125, //chartData.config.concurrencyLimit || 5,
                    minColor: '#FFFFFF',
                    maxColor: '#75ADDD'
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        //if (this.point.value === 0) return false;

                        var chartData = _concurrencyHMData;

                        var pointDate = chartData.yCategories[this.point.y];
                        var fromDate = chartData.xCategories[this.point.x];
                        if (fromDate.endsWith('AM')) {
                            fromDate = fromDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (fromDate.endsWith('PM')) {
                            fromDate = fromDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var toDate = chartData.endTime[this.point.x];
                        if (toDate.endsWith('AM')) {
                            toDate = toDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (toDate.endsWith('PM')) {
                            toDate = toDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var peakConcurrency = this.point.value;

                        var groupAggMS = chartData.config.resolutionMS;
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

                        var label = '0%';
                        if (peakConcurrency > 0 && peakConcurrency <= 25) {
                            label = '1%-25%';
                        } else if (peakConcurrency > 25 && peakConcurrency <= 50) {
                            label = '26%-50%';
                        } else if (peakConcurrency > 50 && peakConcurrency <= 75) {
                            label = '51%-75%';
                        } else if (peakConcurrency > 75 && peakConcurrency <= 100) {
                            label = '76%-100%';
                        } else if (peakConcurrency > 100) {
                            label = APMTranslation.apm.cm.label._101andabove();
                        }

                        var table = '<table>';
                        table += '<tr><td align="center" colspan="3"><b>' + pointDate + '</b></td></tr>';
                        table += '<tr><td align="center" colspan="3"><b>' + groupAggString + ' (' + fromDate + ' - ' + toDate + ')</b></td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.cm.label.concurrencyusage() + '</td><td>:</td><td align="center">' + label + '</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    useHTML: true
                },
                plotOptions: {
                    heatmap: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    var chartData = _concurrencyHMData;

                                    var dateRange = chartData.dateRange[this.x][this.y];

                                    var params = {
                                        startDateMS: dateRange[0],
                                        endDateMS: dateRange[1]
                                    };

                                    redirectToCD(params);
                                }
                            }
                        }
                    }
                },
                series: [{
                    name: APMTranslation.apm.common.label.concurrency(),
                    borderWidth: .5,
                    borderColor: '#EEEEEE',
                    data: chartData.series.concurrency,
                    dataLabels: {
                        enabled: true,
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal',
                            textShadow: false
                        },
                        formatter: function() {
                            var value = this.point.value;
                            var label = '0';
                            if (value > 0 && value <= 25) {
                                label = '25';
                            } else if (value > 25 && value <= 50) {
                                label = '50';
                            } else if (value > 50 && value <= 75) {
                                label = '75';
                            } else if (value > 75 && value <= 100) {
                                label = '100';
                            } else if (value > 100) {
                                label = '>100';
                            }
                            return label;
                        }
                    }
                }]

            };

        } else {
            chartConfig = {
                chart: {
                    type: 'heatmap',
                    plotBorderWidth: 1
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: chartData.xCategories,
                    opposite: false,
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
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    },
                    tickLength: 0,
                    min: 0,
                    max: chartData.xCategories.length - 1
                },
                yAxis: {
                    categories: chartData.yCategories,
                    reversed: true,
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
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    }
                },
                colorAxis: {
                    min: 0,
                    max: 1,
                    minColor: '#DBDBDB',
                    maxColor: '#D95E5E'
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        //if (this.point.value === 0) return false;

                        var chartData = _violationsHMData;

                        var pointDate = chartData.yCategories[this.point.y];
                        var fromDate = chartData.xCategories[this.point.x];
                        if (fromDate.endsWith('AM')) {
                            fromDate = fromDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (fromDate.endsWith('PM')) {
                            fromDate = fromDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var toDate = chartData.endTime[this.point.x];
                        if (toDate.endsWith('AM')) {
                            toDate = toDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                        }
                        if (toDate.endsWith('PM')) {
                            toDate = toDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                        }
                        var violation = this.point.value;

                        var groupAggMS = chartData.config.resolutionMS;
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

                        var table = '<table>';
                        table += '<tr><td align="center" colspan="3"><b>' + pointDate + '</b></td></tr>';
                        table += '<tr><td align="center" colspan="3"><b>' + groupAggString + ' (' + fromDate + ' - ' + toDate + ')</b></td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.common.label.exceededconcurrencycount() + '</td><td>:</td><td align="center">' + violation + '</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    useHTML: true
                },
                plotOptions: {
                    heatmap: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    var chartData = _violationsHMData;

                                    var dateRange = chartData.dateRange[this.x][this.y];

                                    var params = {
                                        startDateMS: dateRange[0],
                                        endDateMS: dateRange[1]
                                    };

                                    redirectToCD(params);
                                }
                            }
                        }
                    }
                },
                series: [{
                    name: 'Violation',
                    borderWidth: .5,
                    borderColor: '#EEEEEE',
                    data: chartData.series.violation,
                    dataLabels: {
                        enabled: true,
                        formatter: function() {
                            return this.point.value ? this.point.value : '';
                        },
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal',
                            textShadow: false
                        }
                    }
                }]

            };
        }

        $container.highcharts(chartConfig);
    }

    function redirectToCD(heatmapParams) {
        var params = {
            startDateMS: heatmapParams.startDateMS,
            endDateMS: heatmapParams.endDateMS,
            compfil: APMCM.Services.getGlobalSettings().compfil
        }

        var paramString = $.param(params);
        var CD_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_cd_sl_main&deploy=customdeploy_apm_cd_sl_main';
        window.open(CD_URL + '&' + paramString);
    }

    return {
        setConcurrencyHMChart: setConcurrencyHMChart,
        setViolationsHMChart: setViolationsHMChart,
        renderConcurrencyHMChart: renderConcurrencyHMChart
    };

};