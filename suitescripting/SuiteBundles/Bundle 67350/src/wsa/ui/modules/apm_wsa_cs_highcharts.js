/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Mar 2017     jmarimla         Initial
 * 2.00       17 Mar 2017     jmarimla         Top WSRP chart
 * 3.00       22 Mar 2017     jmarimla         WSO breakdown chart
 * 4.00       31 Mar 2017     jmarimla         Status charts
 * 5.00       04 Apr 2017     jmarimla         Minor chart changes
 * 6.00       18 Apr 2017     jmarimla         Add plotlines
 * 7.00       21 Apr 2017     jmarimla         Integration charts
 * 8.00       16 May 2017     jmarimla         Top WSO charts
 * 9.00       19 May 2017     jmarimla         WSRP popup
 * 10.00      07 Jun 2017     jmarimla         WSOD redirect
 * 11.00      16 Jun 2017     jmarimla         Minor chart config
 * 12.00      22 Jun 2017     jmarimla         API chart
 * 13.00      17 Jul 2017     jmarimla         Record type names
 * 14.00      28 Jul 2017     jmarimla         Fixed no data bug
 * 15.00      21 Sep 2017     jmarimla         Minor chart changes
 * 16.00      02 Oct 2017     jmarimla         Unused code and minor changes
 * 17.00      16 Oct 2017     jmarimla         Concurrency statuses
 * 18.00      17 Oct 2017     rwong            Include new status in total count
 * 19.00      17 Nov 2017     jmarimla         Pass compfil
 * 20.00      11 Jun 2018     jmarimla         Translation engine
 * 21.00      21 Jul 2018     rwong            Translation strings
 * 22.00      26 Jul 2018     rwong            Highcharts translation
 * 23.00      31 Jul 2018     rwong            Translation strings
 *
 */
APMWSA = APMWSA || {};

APMWSA._Highcharts = function() {
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

    var _topWsrpData = {};
    var _topOperationsData = {};
    var _wsrpDetailsData = {};
    var _wsoBreakdownData = {};
    var _wsoStatusData = {};
    var _wsrpStatusData = {};
    var _apiUsageData = {};

    var colorSet = [
        '138,193,68', '232,255,183', '193,244,193', '146,214,179', '121,189,154',
        '59,134,134', '60,109,137', '36,56,91', '90,105,132', '145,155,173',
        '200,205,214', '175,188,203', '135,154,177', '96,121,152', '149,145,173',
        '163,145,173', '173,145,169', '173,145,155', '173,149,145', '173,163,145',
        '169,173,145', '155,173,145', '145,173,149', '145,173,163', '145,169,173',
        '145,155,173', '33,44,60', '57,74,98', '66,88,121', '90,118,159',
        '99,132,182', '51,51,51', '36,56,91', '90,105,132', '145,155,173',
        '200,205,214', '175,188,203', '135,154,177', '96,121,152', '149,145,173',
        '163,145,173', '173,145,169', '173,145,155', '173,149,145', '173,163,145',
        '169,173,145', '155,173,145', '145,173,149', '145,173,163', '145,169,173'
    ];

    function setTopOperationsData(chartData) {
        _topOperationsData = chartData;
    }

    function setWsrpDetailsData(chartData) {
        _wsrpDetailsData = chartData;
    }

    function setTopWsrpData(chartData) {
        _topWsrpData = chartData;
    }

    function renderTopWsrpChart() {

        var $container = $('.apm-wsa-topwsrp-chart');
        var chartData = _topWsrpData;

        var chartType = APMWSA.Components.$TopWSRPCombobox.find('.psgp-combobox').val()

        var chartConfig = {};

        if (chartType == 'execution') {

            chartConfig = {
                chart: {
                    zoomType: 'xy',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    plotBorderColor: '#555555',
                    plotBorderWidth: 0,
                    //marginTop: 25,
                    marginLeft: 75
                },
                title: {
                    text: APMTranslation.apm.wsa.label.executiontimeperrecordtype(),
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
                        var recordType = this.x;
                        var recordName = APMWSA.Services.getRecordName(recordType);
                        recordName = recordName ? recordName : 'unknown';
                        var idx = chartData.categories.indexOf(this.x);
                        var addValue = chartData.execution["add"][idx][1];
                        var updateValue = chartData.execution["update"][idx][1];
                        var deleteValue = chartData.execution["delete"][idx][1];

                        var table = '<table>';
                        table += '<tr><td align="center" colspan="3"><b>' + recordName + '</b></td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.ns.common.add() + '</td><td>:</td><td align="center">' + addValue + ' s</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.ns.wsa.update() + '</td><td>:</td><td align="center">' + updateValue + ' s</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.ns.wsa.delete() + '</td><td>:</td><td align="center">' + deleteValue + ' s</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    shared: true,
                    useHTML: true
                },
                xAxis: {
                    type: 'category',
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
                        },
                        formatter: function() {
                            var recordId = this.value;
                            var recordName = APMWSA.Services.getRecordName(recordId);
                            recordName = recordName ? recordName : 'unknown';
                            return '<a class="apm-wsa-a" href="javascript:APMWSA.Components.showWsrpChartsPopup({recordType:&quot;' + recordId + '&quot;})">' + recordName + '</a>';
                        },
                        useHTML: true
                    },
                    tickLength: 5,
                    tickColor: '#555555',
                    lineColor: '#555555',
                    lineWidth: 0,
                    categories: chartData.categories
                },
                yAxis: {
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
                        },
                        format: '{value} s'
                    },
                    min: 0
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    var recordType = chartData.categories[this.x];

                                    var params = {
                                        recordType: recordType
                                    }

                                    APMWSA.Components.showWsrpChartsPopup(params);
                                }
                            }
                        }
                    }
                },
                series: [{
                    name: APMTranslation.apm.ns.common.add(),
                    type: 'column',
                    animation: false,
                    color: '#7AB0D9',
                    fillColor: 'rgba(122, 176, 217, 0.8)',
                    lineColor: 'rgba(122, 176, 217, 0.8)',
                    lineWidth: 0,
                    data: chartData.execution['add']
                }, {
                    name: APMTranslation.apm.ns.wsa.update(),
                    type: 'column',
                    animation: false,
                    color: '#83D97A',
                    fillColor: 'rgba(131, 217, 122, 0.8)',
                    lineColor: 'rgba(131, 217, 122, 0.8)',
                    lineWidth: 0,
                    data: chartData.execution['update']
                }, {
                    name: APMTranslation.apm.ns.wsa.delete(),
                    type: 'column',
                    animation: false,
                    color: '#FAB65D',
                    fillColor: 'rgba(250, 182, 93, 0.8)',
                    lineColor: 'rgba(250, 182, 93, 0.8)',
                    lineWidth: 0,
                    data: chartData.execution['delete']
                }]
            }

        } else {

            chartConfig = {
                chart: {
                    zoomType: 'xy',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    plotBorderColor: '#555555',
                    plotBorderWidth: 0,
                    //marginTop: 25,
                    marginLeft: 75
                },
                title: {
                    text: APMTranslation.apm.wsa.label.instancecountperrecordtype(),
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
                        var recordType = this.x;
                        var recordName = APMWSA.Services.getRecordName(recordType);
                        recordName = recordName ? recordName : 'unknown';
                        var idx = chartData.categories.indexOf(this.x);
                        var addValue = chartData.instances["add"][idx][1];
                        var updateValue = chartData.instances["update"][idx][1];
                        var deleteValue = chartData.instances["delete"][idx][1];

                        var table = '<table>';
                        table += '<tr><td align="center" colspan="3"><b>' + recordName + '</b></td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.ns.common.add() + '</td><td>:</td><td align="center">' + addValue + '</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.ns.wsa.update() + '</td><td>:</td><td align="center">' + updateValue + '</td></tr>';
                        table += '<tr><td align="center">' + APMTranslation.apm.ns.wsa.delete() + '</td><td>:</td><td align="center">' + deleteValue + '</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    shared: true,
                    useHTML: true
                },
                xAxis: {
                    type: 'category',
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
                        },
                        formatter: function() {
                            var recordId = this.value;
                            var recordName = APMWSA.Services.getRecordName(recordId);
                            recordName = recordName ? recordName : 'unknown';
                            return '<a class="apm-wsa-a" href="javascript:APMWSA.Components.showWsrpChartsPopup({recordType:&quot;' + recordId + '&quot;})">' + recordName + '</a>';
                        },
                        useHTML: true
                    },
                    tickLength: 5,
                    tickColor: '#555555',
                    lineColor: '#555555',
                    lineWidth: 0,
                    categories: chartData.categories
                },
                yAxis: {
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
                    min: 0
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    var recordType = chartData.categories[this.x];

                                    var params = {
                                        recordType: recordType
                                    }

                                    APMWSA.Components.showWsrpChartsPopup(params);
                                }
                            }
                        }
                    }
                },
                series: [{
                    name: APMTranslation.apm.ns.common.add(),
                    type: 'column',
                    animation: false,
                    color: '#7AB0D9',
                    fillColor: 'rgba(122, 176, 217, 0.8)',
                    lineColor: 'rgba(122, 176, 217, 0.8)',
                    lineWidth: 0,
                    data: chartData.instances['add']
                }, {
                    name: APMTranslation.apm.ns.wsa.update(),
                    type: 'column',
                    animation: false,
                    color: '#83D97A',
                    fillColor: 'rgba(131, 217, 122, 0.8)',
                    lineColor: 'rgba(131, 217, 122, 0.8)',
                    lineWidth: 0,
                    data: chartData.instances['update']
                }, {
                    name: APMTranslation.apm.ns.wsa.delete(),
                    type: 'column',
                    animation: false,
                    color: '#FAB65D',
                    fillColor: 'rgba(250, 182, 93, 0.8)',
                    lineColor: 'rgba(250, 182, 93, 0.8)',
                    lineWidth: 0,
                    data: chartData.instances['delete']
                }]
            }

        }

        $container.highcharts(chartConfig);
    }

    function renderWsoStatusChart(chartData) {
        _wsoStatusData = chartData;

        var $container = $('.apm-wsa-statusbreakdown-chart.panel-1');

        var chartConfig = {
            chart: {
                type: 'pie',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            title: {
                text: APMTranslation.apm.wsa.label.webservicesoperationstatus(),
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
                itemStyle: {
                    width: 80
                },
                labelFormatter: function() {
                    var name = this.name;
                    if(name == 'Finished')
                        return APMTranslation.apm.ns.status.finished();
                    if(name == 'Failed')
                        return APMTranslation.apm.common.label.failed();
                    if(name == 'Rejected User Concurrency')
                        return APMTranslation.apm.common.label.rejecteduserconcurrency();
                    if(name == 'Rejected Account Concurrency')
                        return APMTranslation.apm.common.label.rejectedaccountconcurrency();
                }
            },
            tooltip: {
                formatter: function() {

                    var name = this.point.name;
                    if(name == 'Finished')
                        name = APMTranslation.apm.ns.status.finished();
                    if(name == 'Failed')
                        name = APMTranslation.apm.common.label.failed();
                    if(name == 'Rejected User Concurrency')
                        name = APMTranslation.apm.common.label.rejecteduserconcurrency();
                    if(name == 'Rejected Account Concurrency')
                        name = APMTranslation.apm.common.label.rejectedaccountconcurrency();

                    var table = '<table>';
                    table += '<tr><td colspan="3" align="center"><b>' + name + ' (' + this.percentage.toFixed(2) + ' %)' + '</b></td></tr>';
                    table += '<tr><td align="left">' + APMTranslation.apm.common.label.requests() + '</td><td>:</td><td align="left">' + this.point.y + '</td></tr>';
                    table += '</table>';

                    return table;
                },
                useHTML: true
            },
            plotOptions: {
                pie: {
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
                    colors: chartData.colors,
                    states: {
                        hover: {
                            enabled: true,
                            halo: false
                        }
                    }
                }
            },
            series: [{
                data: chartData.instances
            }]
        }

        $container.highcharts(chartConfig);
    }

    function renderWsrpStatusChart(chartData) {
        _wsrpStatusData = chartData;

        var $container = $('.apm-wsa-statusbreakdown-chart.panel-2');

        var chartConfig = {
            chart: {
                type: 'pie',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            title: {
                text: APMTranslation.apm.wsa.label.webservicesrecordprocessingstatus(),
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
                itemStyle: {
                    width: 80
                },
                labelFormatter: function() {
                    var name = this.name;
                    if(name == 'Finished')
                        return APMTranslation.apm.ns.status.finished();
                    if(name == 'Failed')
                        return APMTranslation.apm.common.label.failed();
                }
            },
            tooltip: {
                formatter: function() {

                    var name = this.point.name;
                    if(name == 'Finished')
                        name = APMTranslation.apm.ns.status.finished();
                    if(name == 'Failed')
                        name = APMTranslation.apm.common.label.failed();

                    var table = '<table>';
                    table += '<tr><td colspan="3" align="center"><b>' + name + ' (' + this.percentage.toFixed(2) + ' %)' + '</b></td></tr>';
                    table += '<tr><td align="left">' + APMTranslation.apm.common.label.records() + '</td><td>:</td><td align="left">' + this.point.y + '</td></tr>';
                    table += '</table>';

                    return table;
                },
                useHTML: true
            },
            plotOptions: {
                pie: {
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
                    colors: chartData.colors,
                    states: {
                        hover: {
                            enabled: true,
                            halo: false
                        }
                    }
                }
            },
            series: [{
                data: chartData.instances
            }]
        }

        $container.highcharts(chartConfig);
    }

    function renderApiUsageChart(chartData) {
        _apiUsageData = chartData;

        var $container = APMWSA.Components.$ApiPortlet.psgpPortlet('getBody');

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginTop: 50,
                marginRight: 50
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
                    var apiVersion = this.x;
                    var requests = 0;
                    for (var i in this.points) {
                        requests += this.points[i].y;
                    }
                    if (requests == 0) return;

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + apiVersion + '</b></td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.requests() + '</td><td>:</td><td align="center">' + requests + '</td></tr>';
                    table += '</table>';

                    return table;
                },
                shared: true,
                useHTML: true
            },
            xAxis: {
                type: 'category',
                labels: {
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
                categories: chartData.categories
            },
            yAxis: {
                title: {
                    text: APMTranslation.apm.common.label.totalrequests(),
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
            series: [{
                name: APMTranslation.apm.wsa.apiversionusage.retired(),
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#D95E5E',
                fillColor: 'rgba(217, 94, 94, 0.8)',
                lineColor: 'rgba(217, 94, 94, 0.8)',
                lineWidth: 0,
                data: chartData['retired']
            }, {
                name: APMTranslation.apm.wsa.apiversion.notsupported(),
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#FAB65D',
                fillColor: 'rgba(250, 182, 93, 0.8)',
                lineColor: 'rgba(250, 182, 93, 0.8)',
                lineWidth: 0,
                data: chartData['notSupported']
            }, {
                name: APMTranslation.apm.wsa.apiversion.supported(),
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#83D97A',
                fillColor: 'rgba(131, 217, 122, 0.8)',
                lineColor: 'rgba(131, 217, 122, 0.8)',
                lineWidth: 0,
                data: chartData['supported']
            }, {
                name: APMTranslation.apm.wsa.apiversion.notreleased(),
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#7AB0D9',
                fillColor: 'rgba(122, 176, 217, 0.8)',
                lineColor: 'rgba(122, 176, 217, 0.8)',
                lineWidth: 0,
                data: chartData['notReleased']
            }]
        };

        $container.highcharts(chartConfig);
    }

    function renderOperationsExecutionChart() {
        var $container = $('.apm-wsa-container-wsocharts .execution');
        var chartData = _topOperationsData;

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
                    if (this.y === 0) return false;

                    var recordType = this.x;
                    var executionTime = this.y;

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + recordType + '</b></td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.executiontime() + '</td><td>:</td><td align="center">' + executionTime + ' s</td></tr>';
                    table += '</table>';

                    return table;
                },
                shared: true,
                useHTML: true
            },
            xAxis: {
                type: 'category',
                labels: {
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
                categories: chartData.categories
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
                        text: APMTranslation.apm.common.label.median() + ' - ' + chartData.executionTimeMed,
                        style: {
                            color: '#4F5ED6',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Open Sans,Helvetica,sans-serif'
                        },
                        x: 10,
                        y: 10
                    },
                    value: chartData.executionTimeMed
                }, {
                    color: '#FA3424',
                    width: 1,
                    dashStyle: 'Dash',
                    zIndex: 5,
                    label: {
                        align: 'left',
                        text: APMTranslation.apm.common.label._95th() + ' - ' + chartData.executionTime95p,
                        style: {
                            color: '#FA3424',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            fontFamily: 'Open Sans,Helvetica,sans-serif'
                        },
                        x: 10
                    },
                    value: chartData.executionTime95p
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
                            click: function() {
                                var operation = chartData.categories[this.x];
                                redirectToWSOD(operation);
                            },
                            mouseOver: function() {
                                syncToolTip('wso', 'execution', this.x);
                            }
                        }
                    }
                }
            },
            series: [{
                name: APMTranslation.apm.common.label.executiontime(),
                type: 'column',
                animation: false,
                color: 'rgba(33, 113, 181, 0.7)',
                fillColor: 'rgba(33, 113, 181, 0.7)',
                lineColor: 'rgba(33, 113, 181, 0.7)',
                lineWidth: 0,
                data: chartData.executionTime
            }, {
                name: APMTranslation.apm.common.label._95th(),
                type: 'line',
                color: 'rgba(255,255,255,0)',
                borderColor: 'rgba(255,255,255,0)',
                marker: {
                    enabled: false
                },
                showInLegend: false,
                data: [
                    [(chartData.executionTime[0]) ? chartData.executionTime[0][0] : 0, chartData.executionTime95p]
                ]
            }]
        };

        $container.highcharts(chartConfig);
    }

    function renderOperationsThroughputChart() {
        var $container = $('.apm-wsa-container-wsocharts .throughput');
        var chartData = _topOperationsData;

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
                    var idx = chartData.categories.indexOf(this.x);
                    var finished = chartData.throughput['finished'][idx][1];
                    var rejecteduserconcurrency = chartData.throughput['rejecteduserconcurrency'][idx][1];
                    var rejectedaccountconcurrency = chartData.throughput['rejectedaccountconcurrency'][idx][1];
                    var failed = chartData.throughput['failed'][idx][1];
                    var total = finished + failed + rejecteduserconcurrency + rejectedaccountconcurrency;

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + this.x + '</b></td></tr>';
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
                type: 'category',
                labels: {
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
                categories: chartData.categories
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
                min: 0,
                allowDecimals: false
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
                            click: function() {
                                var operation = chartData.categories[this.x];
                                redirectToWSOD(operation);
                            },
                            mouseOver: function() {
                                syncToolTip('wso', 'throughput', this.x);
                            }
                        }
                    }
                }
            },
            series: [{
                name: APMTranslation.apm.common.label.failed(),
                legendIndex: 3,
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#D95E5E',
                fillColor: 'rgba(217, 94, 94, 0.8)',
                lineColor: 'rgba(217, 94, 94, 0.8)',
                lineWidth: 0,
                data: chartData.throughput['failed']
            }, {
                name: APMTranslation.apm.common.label.rejectedaccountconcurrency(),
                legendIndex: 2,
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#FAB65D',
                fillColor: 'rgba(250, 182, 93, 0.8)',
                lineColor: 'rgba(250, 182, 93, 0.8)',
                lineWidth: 0,
                data: chartData.throughput['rejectedaccountconcurrency']
            }, {
                name: APMTranslation.apm.common.label.rejecteduserconcurrency(),
                legendIndex: 1,
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#F3EB5E',
                fillColor: 'rgba(243, 235, 94, 0.8)',
                lineColor: 'rgba(243, 235, 94, 0.8)',
                lineWidth: 0,
                data: chartData.throughput['rejecteduserconcurrency']
            }, {
                name: APMTranslation.apm.ns.status.finished(),
                legendIndex: 0,
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#83D97A',
                fillColor: 'rgba(131, 217, 122, 0.8)',
                lineColor: 'rgba(131, 217, 122, 0.8)',
                lineWidth: 0,
                data: chartData.throughput['finished']
            }]
        };

        $container.highcharts(chartConfig);
    }

    function renderOperationsErrorRateChart() {
        var $container = $('.apm-wsa-container-wsocharts .errorrate');
        var chartData = _topOperationsData;

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
                    if (this.y === 0) return false;

                    var recordType = this.x;
                    var executionTime = this.y;

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + recordType + '</b></td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.errorrate() + '</td><td>:</td><td align="center">' + executionTime + ' %</td></tr>';
                    table += '</table>';

                    return table;
                },
                shared: true,
                useHTML: true
            },
            xAxis: {
                type: 'category',
                labels: {
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
                categories: chartData.categories
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
                            click: function() {
                                var operation = chartData.categories[this.x];
                                redirectToWSOD(operation);
                            },
                            mouseOver: function() {
                                syncToolTip('wso', 'errorrate', this.x);
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

    function renderOperationsRecordsChart() {
        var $container = $('.apm-wsa-container-wsocharts .records');
        var chartData = _topOperationsData;

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
                    if (this.y === 0) return false;

                    var idx = chartData.categories.indexOf(this.x);
                    var totalRecords = chartData.records['total'][idx][1];
                    var rate = chartData.records['rate'][idx][1];

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + this.x + '</b></td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.totalrecords() + '</td><td>:</td><td align="center">' + totalRecords + '</td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.recordsperminute() + '</td><td>:</td><td align="center">' + rate + '</td></tr>';
                    table += '</table>';

                    return table;
                },
                shared: true,
                useHTML: true
            },
            xAxis: {
                type: 'category',
                labels: {
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
                categories: chartData.categories
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
                            click: function() {
                                var operation = chartData.categories[this.x];
                                redirectToWSOD(operation);
                            },
                            mouseOver: function() {
                                syncToolTip('wso', 'records', this.x);
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
                type: 'line',
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

    function renderWsrpDetailsChart() {

        var $container = $('.apm-wsa-dialog-wsrpcharts .chart');
        var chartData = _wsrpDetailsData;

        var chartType = $('.apm-wsa-dialog-wsrpcharts .combo-operation .psgp-combobox').val();

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginTop: 25
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

                    var executionTime = chartData[chartType]['executionTime'][pointIndex][1];
                    var instances = chartData[chartType]['count'][pointIndex][1];

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
                    table += '<tr><td align="center" colspan="3"><b>' + groupAggString + ' from ' + fromDate + ' - ' + toDate + '</b></td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.common.label.executiontime() + '</td><td>:</td><td align="center">' + executionTime.toFixed(3) + ' s</td></tr>';
                    table += '<tr><td align="center">' + APMTranslation.apm.wsa.label.requestcount() + '</td><td>:</td><td align="center">' + instances + '</td></tr>';
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
                title: {
                    text: APMTranslation.apm.common.label.executiontime(),
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
                    format: '{value} s'
                },
                min: 0
            }, {
                title: {
                    text: APMTranslation.apm.wsa.label.requestcount(),
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
                    }
                },
                min: 0,
                opposite: true
            }],
            series: [{
                    name: APMTranslation.apm.wsa.label.requestcount(),
                    yAxis: 1,
                    type: 'column',
                    animation: false,
                    color: '#91BFDB',
                    fillColor: 'rgba(145, 191, 219, 0.8)',
                    lineColor: 'rgba(145, 191, 219, 1.0)',
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                fillColor: '#FFFFFF',
                                lineColor: '#91BFDB',
                                radiusPlus: 2,
                                lineWidthPlus: 1
                            }
                        }
                    },
                    data: chartData[chartType]['count']
                },
                {
                    name: APMTranslation.apm.common.label.executiontime(),
                    type: 'spline',
                    animation: false,
                    color: '#FC8D59',
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
                    data: chartData[chartType]['executionTime']
                }
            ]
        };

        $container.highcharts(chartConfig);
    }

    function syncToolTip(chartGroup, chartId, point) {

        function showExecutionTooltip() {
            var executionChart = $('.apm-wsa-container-wsocharts .execution').highcharts();
            executionChart.tooltip.refresh([executionChart.series[0].data[point]]);
        }

        function showThroughputTooltip() {
            var throughputChart = $('.apm-wsa-container-wsocharts .throughput').highcharts();
            throughputChart.tooltip.refresh([throughputChart.series[0].data[point]]);
        }

        function showErrorRateTooltip() {
            var errorRateChart = $('.apm-wsa-container-wsocharts .errorrate').highcharts();
            errorRateChart.tooltip.refresh([errorRateChart.series[0].data[point]]);
        }

        function showRecordsTooltip() {
            var recordsChart = $('.apm-wsa-container-wsocharts .records').highcharts();
            recordsChart.tooltip.refresh([recordsChart.series[0].data[point]]);
        }


        switch (chartGroup) {
            case 'wso':
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
            $('.apm-wsa-container-wsocharts .execution').highcharts(),
            $('.apm-wsa-container-wsocharts .throughput').highcharts(),
            $('.apm-wsa-container-wsocharts .errorrate').highcharts(),
            $('.apm-wsa-container-wsocharts .records').highcharts(),
        ];

        for (var i in charts) {
            var chart = charts[i];
            if (chart) {
                chart.tooltip.hide();
            }
        }
    }

    function redirectToWSOD(operation) {
        var globalSettings = APMWSA.Services.getGlobalSettings();

        var params = {
            operation: operation,
            startDateMS: globalSettings.startDateMS,
            endDateMS: globalSettings.endDateMS,
            integration: globalSettings.integration,
            compfil: globalSettings.compfil
        }

        var paramString = $.param(params);
        var WSOD_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_wsod_sl_main&deploy=customdeploy_apm_wsod_sl_main';
        window.open(WSOD_URL + '&' + paramString);
    }

    return {
        setTopWsrpData: setTopWsrpData,
        setTopOperationsData: setTopOperationsData,
        setWsrpDetailsData: setWsrpDetailsData,
        renderTopWsrpChart: renderTopWsrpChart,
        renderWsrpDetailsChart: renderWsrpDetailsChart,
        renderWsoStatusChart: renderWsoStatusChart,
        renderWsrpStatusChart: renderWsrpStatusChart,
        renderApiUsageChart: renderApiUsageChart,
        renderOperationsExecutionChart: renderOperationsExecutionChart,
        renderOperationsThroughputChart: renderOperationsThroughputChart,
        renderOperationsErrorRateChart: renderOperationsErrorRateChart,
        renderOperationsRecordsChart: renderOperationsRecordsChart
    };

};