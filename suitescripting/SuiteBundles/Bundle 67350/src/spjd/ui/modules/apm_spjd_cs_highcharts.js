/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       04 Jan 2018     jmarimla         Initial
 * 2.00       11 Jan 2018     jmarimla         Instance details chart
 * 3.00       23 Jan 2018     jmarimla         Tooltip
 * 4.00       09 Feb 2018     jmarimla         Label Change
 * 5.00       04 Apr 2018     jmarimla         Labels
 * 6.00       11 Jun 2018     jmarimla         Translation engine
 * 7.00       16 Jul 2018     rwong            Translation strings
 * 8.00       26 Jul 2018     rwong            Highcharts translation
 * 9.00       31 Jul 2018     rwong            Translation strings
 *
 */
APMSPJD = APMSPJD || {};

APMSPJD._Highcharts = function() {

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

    var _instanceDetailsChart = [];

    var instanceDetailsColors = {
        'SCHEDULED': {
            waitTime: 'rgba(250, 182, 93, 0.5)',
            executionTime: 'rgba(250, 182, 93, 0.8)'
        },
        'MAPREDUCE': {
            waitTime: 'rgba(122, 176, 217, 0.5)',
            executionTime: 'rgba(122, 176, 217, 0.8)'
        }
    }

    function renderInstanceDetailsChart(chartData) {
        var $container = $('.apm-spjd-instancedetails-chart');
        _instanceDetailsChart = chartData;

        var chartCategories = [];
        var chartSeries = [];
        if (chartData && chartData.length > 0) {
            for (var i = 0; i < chartData.length; i++) {
                var dataIdx = parseInt(i);
                var colors = instanceDetailsColors[chartData[i].scriptType];
                var colorWaitTime = (colors) ? colors.waitTime : '';
                var colorExecutionTime = (colors) ? colors.executionTime : '';

                chartCategories.push(i);
                chartSeries.push({
                    x: dataIdx,
                    color: colorWaitTime,
                    low: chartData[i].dateCreatedMS,
                    high: chartData[i].startDateMS
                });
                chartSeries.push({
                    x: dataIdx,
                    color: colorExecutionTime,
                    low: chartData[i].startDateMS,
                    high: chartData[i].endDateMS
                });
            }
        }

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                animation: false,
                type: 'columnrange',
                inverted: true,
                zoomType: 'y',
                marginRight: 40,
                marginLeft: 40
            },
            title: {
                text: APMTranslation.apm.spjd.label.jobdetailstimeline(),
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
                    text: '',
                    style: {
                        color: '#666666',
                        fontFamily: 'Arial',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }
                },
                labels: {
                    style: {
                        color: '#666',
                        fontFamily: 'Arial',
                        fontSize: '11px'
                    },
                    formatter: function() {
                        return '';
                    }
                },
                lineColor: '#666666',
                lineWidth: 1,
                tickColor: '#666666',
                tickLength: 0,
                categories: chartCategories
            },
            yAxis: {
                title: {
                    text: '',
                    style: {
                        color: '#666666',
                        fontFamily: 'Arial',
                        fontSize: '18px',
                        fontWeight: 'bold'
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
                        fontSize: '11px'
                    }
                },
                lineColor: '#444444',
                lineWidth: 1,
                tickColor: '#444444',
                type: 'datetime',
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
            tooltip: {
                crosshairs: {
                    width: 1,
                    color: '#bbbbbb',
                    dashStyle: 'solid'
                },
                formatter: function() {
                    var pointIndex = this.x;

                    function getPrio(prio) {
                        var prioText = {
                            '1': APMTranslation.apm.common.priority.high(),
                            '2': APMTranslation.apm.common.priority.standard(),
                            '3': APMTranslation.apm.common.priority.low()
                        }
                        return prioText['' + prio];
                    }

                    var dateCreated = chartData[pointIndex].dateCreated;
                    if (dateCreated.endsWith('AM')) {
                        dateCreated = dateCreated.replace(/AM$/, APMTranslation.apm.common.time.am());
                    }
                    if (dateCreated.endsWith('PM')) {
                        dateCreated = dateCreated.replace(/PM$/, APMTranslation.apm.common.time.pm());
                    }
                    var startDate = chartData[pointIndex].startDate;
                    if (startDate.endsWith('AM')) {
                        startDate = startDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                    }
                    if (startDate.endsWith('PM')) {
                        startDate = startDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                    }
                    var endDate = chartData[pointIndex].endDate;
                    if (endDate.endsWith('AM')) {
                        endDate = endDate.replace(/AM$/, APMTranslation.apm.common.time.am());
                    }
                    if (endDate.endsWith('PM')) {
                        endDate = endDate.replace(/PM$/, APMTranslation.apm.common.time.pm());
                    }
                    var deploymentName = chartData[pointIndex].deploymentName;
                    var scriptName = chartData[pointIndex].scriptName;
                    var scriptType = chartData[pointIndex].scriptType;
                    if (scriptType == 'MAPREDUCE')
                        scriptType = APMTranslation.apm.common.label.mapreduce();
                    if (scriptType == 'SCHEDULED')
                        scriptType = APMTranslation.apm.common.label.scheduled();
                    var waitTime = chartData[pointIndex].waitTime;
                    waitTime = (waitTime) ? waitTime.toFixed(2) + ' s' : ''
                    var executionTime = chartData[pointIndex].executionTime;
                    executionTime = (executionTime) ? executionTime.toFixed(2) + ' s' : ''
                    var origPrio = chartData[pointIndex].origPrio;
                    origPrio = (origPrio) ? getPrio(origPrio) : '';
                    var elevPrio = chartData[pointIndex].elevPrio;
                    elevPrio = (elevPrio) ? getPrio(elevPrio) : '';
                    var status = chartData[pointIndex].status; //TODO expand to translate the standard status
                    switch (status) {
                        case "Complete":
                            status = APMTranslation.apm.scpm.label.complete();
                            break;
                        case "Processing":
                            status = APMTranslation.apm.scpm.label.processing();
                            break;
                        case "Pending":
                            status = APMTranslation.apm.scpm.label.pending();
                            break;
                        case "Deferred":
                            status = APMTranslation.apm.scpm.label.deferred();
                            break;
                        case "Retry":
                            status = APMTranslation.apm.scpm.label.retry();
                            break;
                        case "Failed":
                            status = APMTranslation.apm.common.label.failed();
                            break;
                        case "Cancelled":
                            status = APMTranslation.apm.scpm.label.cancelled();
                            break;
                        default:
                            status;
                    }

                    var queue = chartData[pointIndex].queue;
                    queue = (queue) ? queue : '- ' + APMTranslation.apm.common.label.none() + ' -';
                    var mrStage = chartData[pointIndex].mrStage;
                    mrStage = (mrStage) ? mrStage : '-';
                    var taskId = chartData[pointIndex].taskId;

                    var table = '<table>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.spjd.label.datecreated() + '</td><td>:</td><td align="center">' + dateCreated + '</td>';
                    table += '<td align="center">' + APMTranslation.apm.spjd.label.originalpriority() + '</td><td>:</td><td align="center">' + origPrio + '</td>';
                    table += '</tr>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.startdate() + '</td><td>:</td><td align="center">' + startDate + '</td>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.elevatedpriority() + '</td><td>:</td><td align="center">' + elevPrio + '</td>';
                    table += '</tr>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.enddate() + '</td><td>:</td><td align="center">' + endDate + '</td>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.status() + '</td><td>:</td><td align="center">' + status + '</td>';
                    table += '</tr>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.deploymentname() + '</td><td>:</td><td align="center">' + deploymentName + '</td>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.queue() + '</td><td>:</td><td align="center">' + queue + '</td>';
                    table += '</tr>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.scriptname() + '</td><td>:</td><td align="center">' + scriptName + '</td>';
                    table += '<td align="center">' + APMTranslation.apm.spjd.label.mapreducestage() + '</td><td>:</td><td align="center">' + mrStage + '</td>';
                    table += '</tr>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.spjd.label.tasktype() + '</td><td>:</td><td align="center">' + scriptType + '</td>';
                    table += '<td align="center">' + APMTranslation.apm.spjd.label.taskid() + '</td><td>:</td><td align="center">' + taskId.substr(0, 40) + '</td>';
                    table += '</tr>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.waittime() + '</td><td>:</td><td align="center">' + waitTime + '</td>';
                    table += '<td align="center"></td><td></td><td align="center">' + taskId.substr(40, 40) + '</td>';
                    table += '</tr>';
                    table += '<tr>';
                    table += '<td align="center">' + APMTranslation.apm.common.label.executiontime() + '</td><td>:</td><td align="center">' + executionTime + '</td><td align="center"></td>';
                    table += '<td></td><td align="center">' + taskId.substr(80, 40) + '</td>';
                    table += '</tr>';
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

    return {
        renderInstanceDetailsChart: renderInstanceDetailsChart
    }

};