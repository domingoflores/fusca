/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Sep 2016     jmarimla         Initial
 * 2.00       11 Oct 2016     jmarimla         Render count chart
 * 3.00       10 Nov 2016     rwong            Convert queue utilization to bar chart
 * 4.00       23 Nov 2016     jmarimla         Render heatmap
 * 5.00       25 Nov 2016     jmarimla         Onclick queue utilization
 * 6.00       25 Nov 2016     rwong            Removed gridlines and height autosizes depending on queue count
 * 7.00       28 Nov 2016     jmarimla         Move onclick trigger to utilization series
 * 8.00       06 Dec 2016     jmarimla         Onclick count series
 * 9.00       09 Dec 2016     rwong            Updated heatmap to read from backend
 * 10.00      10 Jan 2017     jmarimla         Show entire range in heat map
 * 11.00      12 Jan 2017     rwong            Combine Queue Utilization and Script Instance Count
 * 12.00      20 Jan 2017     jmarimla         Place labels below heatmap
 * 13.00      24 Jan 2017     jmarimla         Onclick heatmap series
 * 14.00      03 Feb 2017     jmarimla         Fix heatmap container sizing
 * 15.00      22 Sep 2017     rwong            Support for SCP
 * 16.00      02 Oct 2017     jmarimla         Minor chart changes
 * 17.00      06 Jul 2018     jmarimla         Translation readiness
 *
 */
APMSQM = APMSQM || {};

APMSQM._Highcharts = function () {

    var _utilizationData = {};
    var _countData = {};
    var _heatMapData = {};

    function renderUtilizationChart(chartData, $container) {

        _utilizationData = chartData;

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginTop: 25,
                marginRight: 25,
                marginLeft: 75
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
            tooltip: {
                crosshairs: {
                    width: 1,
                    color: '#bbbbbb',
                    dashStyle: 'solid'
                },
                formatter: function () {
                    if (this.y === 0) return false;

                    var queue = chartData.categories[this.x];
                    if(queue == 0) queue = 'No Queue';
                    else queue = 'Queue ' + queue;
                    var duration = chartData.totalDuration[this.x][1];
                    var utilization = chartData.utilLabel[this.x][1];

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + queue + '</b></td></tr>';
                    table += '<tr><td align="center">Utilization</td><td>:</td><td align="center">' + utilization + ' %</td></tr>';
                    table += '<tr><td align="center">Duration</td><td>:</td><td align="center">' + duration + ' hrs</td></tr>';
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
                    },
                    formatter: function(){
                        if(this.value == '0')
                            return '- None -';
                        return this.value;
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
                    text: 'Percentage',
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
                max: 100
            },
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        color: 'rgba(102,102,102)',
                        format: '{y}%'
                },
                cursor: 'pointer',
                events : {
                    mouseOut : function () {
                       hideTooltip();
                    }
                },
                point: {
                    events: {
                        mouseOver: function () {
                            if (this.y == 0) return false;
                            syncToolTip('queue', 'utilization', this.x);
                        },
                        click: function () {
                            var dialogData = _utilizationData.dialog[this.x];
                            if (!dialogData || !this.y) return;

                            var $obj;

                            var markUp = '' +
                                '<div class="apm-sqm-dialog-queueutil">' +
                                    '<div class="kpi">' +
                                    '</div>' +
                                    '<div class="divider">' +
                                    '</div>' +
                                    '<div class="statements">' +
                                    '</div>' +
                                '</div>';
                            $obj = $(markUp);

                            var itemsMarkUp = '';
                            function addItemsMarkUp (itemValue, description) {
                                if (itemValue && description) {
                                    itemsMarkUp +=
                                        '<div class="item">' +
                                            '<span class="value">' + itemValue + '</span>' +
                                            '<span class="description">' + description + '</span>' +
                                        '</div>';
                                }
                            }
                            addItemsMarkUp(dialogData.items.utilization, ' of the queue was utilized');
                            addItemsMarkUp(dialogData.items.completed, ' scripts were completed');
                            addItemsMarkUp(dialogData.items.failed, ' scripts encountered an error');
                            addItemsMarkUp(dialogData.items.availableTime, ' available time');
                            addItemsMarkUp(dialogData.items.totalCompletedTime, ' total completed time');
                            addItemsMarkUp(dialogData.items.totalUnusedTime, ' total unused time');
                            addItemsMarkUp(dialogData.items.totalWaitTime, ' total wait time');
                            $obj.find('.statements').append(itemsMarkUp);

                            //Psuedo renderer
                            if(dialogData.kpi[0].value == 0) dialogData.kpi[0].value = 'None';

                            $obj.find('.kpi').psgpKPIPanel({
                                width: '100%',
                                height: '150px'
                            }).psgpKPIPanel('refreshData', dialogData.kpi);

                            $obj.psgpDialog({
                                title: 'Queue Utilization',
                                width: 600
                            });
                            $obj.parents('.ui-dialog').css({
                                "position": "absolute",
                                "top": ( $(window).height() - $obj.parents('.ui-dialog').height() ) / 2+$(window).scrollTop() + "px",
                                "left": ( $(window).width() - $obj.parents('.ui-dialog').width() ) / 2+$(window).scrollLeft() + "px"
                            });
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Utilization',
                type: 'column',
                animation: false,
                color: 'rgba(33, 113, 181, 0.7)',
                fillColor: 'rgba(33, 113, 181, 0.7)',
                lineColor: 'rgba(33, 113, 181, 0.7)',
                lineWidth: 0,
                data: chartData.utilization
            }]
        };
        $container.highcharts(chartConfig);
    }

    function renderCountChart(chartData, $container) {

        _countData = chartData;

        var chartConfig = {
            chart: {
                zoomType: 'xy',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                plotBorderColor: '#555555',
                plotBorderWidth: 0,
                marginTop: 25,
                marginRight: 25,
                marginLeft: 75
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
                formatter: function () {
                    if (this.y === 0) return false;

                    var idx = this.x;
                    var queue = chartData.categories[idx];
                    if(queue == 0) queue = 'No Queue';
                    else queue = 'Queue ' + queue;
                    var complete = parseInt(chartData.complete[idx][1]);
                    var processing = parseInt(chartData.processing[idx][1]);
                    var pending = parseInt(chartData.pending[idx][1]);
                    var retry = parseInt(chartData.retry[idx][1]);
                    var failed = parseInt(chartData.failed[idx][1]);
                    var total = complete + processing + pending + retry + failed;

                    var table = '<table>';
                    table += '<tr><td align="center" colspan="3"><b>' + queue + '</b></td></tr>';
                    table += '<tr><td align="center">Complete</td><td>:</td><td align="center">' + complete + '</td></tr>';
                    table += '<tr><td align="center">Processing</td><td>:</td><td align="center">' + processing + '</td></tr>';
                    table += '<tr><td align="center">Pending</td><td>:</td><td align="center">' + pending + '</td></tr>';
                    table += '<tr><td align="center">Retry</td><td>:</td><td align="center">' + retry + '</td></tr>';
                    table += '<tr><td align="center">Failed</td><td>:</td><td align="center">' + failed + '</td></tr>';
                    table += '<tr><td align="center"><b>Total</b></td><td>:</td><td align="center">' + total + '</td></tr>';
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
                    },
                    formatter: function(){
                        if(this.value == '0')
                            return '- None -';
                        return this.value;
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
                    text: 'Instance Count',
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
                    events : {
                        mouseOut : function () {
                            hideTooltip();
                        }
                    },
                    point: {
                        events: {
                            mouseOver: function () {
                                if (this.y == 0) return false;
                                syncToolTip('queue', 'count', this.x);
                            },
                            click: function () {
                                if (!this.y) return;

                                var globalParams = APMSQM.Services.getGlobalParams();

                                var params = {
                                        startDateMS: globalParams.startDateMS,
                                        endDateMS: globalParams.endDateMS,
                                        queue: this.category
                                };

                                APMSQM.Components.showInstancesPopup(params);
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Complete',
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#83D97A',
                fillColor: 'rgba(131, 217, 122, 0.8)',
                lineColor: 'rgba(131, 217, 122, 0.8)',
                lineWidth: 0,
                data: chartData.complete
            }, {
                name: 'Processing',
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#7AB0D9',
                fillColor: 'rgba(122, 176, 217, 0.8)',
                lineColor: 'rgba(122, 176, 217, 0.8)',
                lineWidth: 0,
                data: chartData.processing
            }, {
                name: 'Pending',
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#F3EB5E',
                fillColor: 'rgba(243, 235, 94, 0.8)',
                lineColor: 'rgba(243, 235, 94, 0.8)',
                lineWidth: 0,
                data: chartData.pending
            }, {
                name: 'Retry',
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#FAB65D',
                fillColor: 'rgba(250, 182, 93, 0.8)',
                lineColor: 'rgba(250, 182, 93, 0.8)',
                lineWidth: 0,
                data: chartData.retry
            }, {
                name: 'Failed',
                type: 'column',
                stacking: 'normal',
                animation: false,
                color: '#D95E5E',
                fillColor: 'rgba(217, 94, 94, 0.8)',
                lineColor: 'rgba(217, 94, 94, 0.8)',
                lineWidth: 0,
                data: chartData.failed
            }]
        };

        $container.highcharts(chartConfig);

    }

    function renderHeatMapChart (chartData, $container) {
        _heatMapData = chartData;

        //determine height based on number of queues
        var xLabelHeight = 180;
        var queueHeight = 25 * (chartData.yCategories.length ? chartData.yCategories.length : 0)
        var totalHeight = xLabelHeight + queueHeight;
        $container.height(totalHeight);

        var chartConfig = {

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
                        text: 'Queue',
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '14px',
                            fontWeight: 'normal'
                        }
                    },
                    labels: {
                        format: 'Queue {value}',
                        style: {
                            color: '#666',
                            fontFamily: 'Arial',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        },
                        formatter: function(){
                            if(this.value == '0')
                                return '-None-';
                            return '' + this.value;
                        }
                    },
                    min: 0,
                    max: chartData.yCategories.length - 1
                },
                colorAxis: {
                    min: 0,
                    minColor: '#FFFFFF',
                    maxColor: '#7AB0D9'
                },
                legend: {
                    align: 'center',
                    layout: 'horizontal'
                },
                plotOptions: {
                    heatmap: {
                        point: {
                            events: {
                                click: function () {
                                    var chartData = _heatMapData;

                                    var queue = chartData.yCategories[this.y];
                                    var dateRange = chartData.dateRange[this.x];

                                    var params = {
                                            search: 'heatmap',
                                            startDateMS: dateRange[0],
                                            endDateMS: dateRange[1],
                                            queue: queue
                                    };

                                    APMSQM.Components.showInstancesPopup(params);
                                }
                            }
                        }
                    }
                },
                tooltip: {
                    formatter: function () {
                        //if (this.point.value === 0) return false;

                        var chartData = _heatMapData;

                        var queue = chartData.yCategories[this.point.y];
                        if(queue == 0) queue = 'No Queue';
                        else queue = 'Queue ' + queue;
                        var fromDate = chartData.xCategories[this.point.x];
                        var toDate = chartData.endDate[this.point.x];
                        var waitTime = this.point.value;
                        waitTime = (waitTime && waitTime > 0) ? waitTime + ' s' : '0';

                        var groupAggMS = chartData.config.resolutionMS;
                        var groupAggString = '';
                        if (groupAggMS < 1000 * 60 * 60) {
                            var value = groupAggMS / (1000 * 60);
                            var label = (value > 1) ? 'mins' : 'min';
                            groupAggString = '' + value + ' ' + label;
                        } else {
                            var value = groupAggMS / (1000 * 60 * 60);
                            var label = (value > 1) ? 'hrs' : 'hr';
                            groupAggString = '' + value + ' ' + label;
                        }

                        var table = '<table>';
                        table += '<tr><td align="center" colspan="3"><b>' + queue + '</b></td></tr>';
                        table += '<tr><td align="center" colspan="3"><b>' + groupAggString + ' from ' + fromDate + ' - ' + toDate + '</b></td></tr>';
                        table += '<tr><td align="center">Total Wait Time</td><td>:</td><td align="center">' + waitTime + '</td></tr>';
                        table += '</table>';

                        return table;
                    },
                    useHTML: true
                },
                series: [{
                    name: 'Wait Time',
                    borderWidth: 0,
                    borderColor: '#DDDDDD',
                    data: chartData.series,
                    dataLabels: {
                        enabled: false
                    }
                }]

            };

        $container.highcharts(chartConfig);
    }

    function syncToolTip ( chartGroup, chartId, point ) {

        switch (chartGroup) {
        case 'queue' :
            switch (chartId) {
            case 'count' :
                var utilizationChart = APMSQM.Components.$UtilizationPortlet.find('.psgp-utilization-chart').highcharts();
                utilizationChart.tooltip.refresh([ utilizationChart.series[0].data[point] ]);
                break;
            case 'utilization':
                var countChart = APMSQM.Components.$UtilizationPortlet.find('.psgp-count-chart').highcharts();
                countChart.tooltip.refresh([ countChart.series[0].data[point] ]);
                break;
            default:
                return;
            }

            break;

        default:
            return;
        }
    }

    function hideTooltip () {
        var charts = [
                APMSQM.Components.$UtilizationPortlet.find('.psgp-utilization-chart').highcharts(),
                APMSQM.Components.$UtilizationPortlet.find('.psgp-count-chart').highcharts()
        ];

        for (var i in charts) {
            var chart = charts[i];
            if(chart) {
                chart.tooltip.hide();
            }
        }
    }

    return {
        renderUtilizationChart: renderUtilizationChart,
        renderCountChart: renderCountChart,
        renderHeatMapChart: renderHeatMapChart
    };

};
