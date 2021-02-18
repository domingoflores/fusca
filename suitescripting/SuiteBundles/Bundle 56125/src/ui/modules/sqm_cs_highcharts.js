/**
 * © 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code. 
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       29 May 2014     jmarimla         Initial UI for timeline chart
 * 2.00       30 May 2014     jmarimla         Adjusted axes, fonts and tooltip for chart
 * 3.00       02 Jun 2014     jmarimla         Removed dummy data, connected chart with restlet data on first load
 *                                             Added links in chart tooltip
 * 4.00       03 Jun 2014     jmarimla         Hide default export button
 *                                             Adjust chart background color and placement
 * 5.00       04 Jun 2014     jmarimla         Added refresh chart function
 * 6.00       09 Jun 2014     jmarimla         Added checking to avoid accessing an null chart
 *                                             Handle empty data for timeline chart by removing and adding the series
 * 7.00       10 Jun 2014     jmarimla         Hide 'highcharts.com'
 *                                             Disable animation for chart
 *                                             Reset yaxis when chart is refreshed
 * 8.00       11 Jun 2014     jmarimla         Set position and appearance for reset zoom button
 * 9.00       19 Jun 2014     jmarimla         Added new function insertDummyData to ensure proper rendering of axis and bars
 * 10.00      07 Jul 2014     jmarimla         Added copyright
 *                                             Remove 1000 limit by setting turboThreshold to 0
 * 11.00      21 Jul 2014     jmarimla         Changed position of reset zoom button to top-right of chart
 *                                             Changed style of reset zoom button
 * 12.00      24 Jul 2014     jmarimla         Changed turboThreshold to 25000
 * 13.00      25 Jul 2014     jmarimla         Set font sizes in pixels
 * 14.00      31 Jul 2014     jmarimla         Disabled exporting button
 *                                             Set formatting for datetime axis
 *                                             Remove trailing commas
 * 15.00      08 Aug 2014     rwong            Added wait time to grid timeline hover
 * 16.00      15 Aug 2014     jmarimla         Adjusted zoom button position
 * 17.00      20 Aug 2014     jmarimla         Changed bar color
 * 18.00      18 Sep 2014     jmarimla         Changed axis style
 *
 */

Highcharts.setOptions({
    lang: {
        resetZoom: 'Reset Zoom'
    }
});

var timelineChart = null;

var timelineData = {
        renderQueue : 0
        , records : new Array()
};

var timelineChartConfig = {

        chart : {
            renderTo : 'psgp-sqm-subpanel-timeline',
            type : 'columnrange',
            inverted : true,
            zoomType : 'y',
            backgroundColor:'rgba(255, 255, 255, 0.1)',
            marginTop: 55,
            marginRight: 50,
            resetZoomButton: {
                position: {
                    x: 0,
                    y: -40
                },
                theme: {
                    fill: {
                        linearGradient: { x1: .5, x2: .5, y1: 0, y2: 1 },
                        stops: [
                                [0, '#fafafa'],
                                [1, '#e5e5e5']
                                ]
                    },
                    stroke: '#b2b2b2',
                    style : {
                        color : '#333333',
                        fontSize : '14px',
                        fontWeight: 500
                    },
                    states: {
                        hover: {
                            fill: '#e5e5e5',
                            stroke: '#b2b2b2'
                        }
                    }
                }
            }
        },

        credits : {
            enabled : false
        },

        title : {
            text : ''
        },

        exporting : {
            enabled : false,
            buttons : {
                exportButton : {
                    enabled : false
                },
                printButton : {
                    enabled : false
                }
            }
        },

        xAxis : {
            title : {
                text : 'Queues',
                style : {
                    color : '#666666',
                    fontFamily : 'Arial',
                    fontSize : '18px',
                    fontWeight : 'bold'
                }
            },
            labels : {
                style : {
                    color : '#666',
                    fontFamily : 'Arial',
                    fontSize : '11px'
                }
            },
            lineColor : '#666666',
            lineWidth : 1,
            tickColor : '#666666',
            categories : ['1','2','3','4','5'],
            min : 0,
            max : 4
        },

        yAxis : {
            title : {
                text : 'Execution Timeline',
                style : {
                    color : '#666666',
                    fontFamily : 'Arial',
                    fontSize : '18px',
                    fontWeight : 'bold'
                }
            },
            labels : {
                style : {
                    color : '#666',
                    fontFamily : 'Arial',
                    fontSize : '11px'
                },
                formatter : function () {
                    return Highcharts.dateFormat('%m/%d, %l:%M:%S %p', this.value);
                },
                step : 2,
                overflow : 'justify',
                maxStaggerLines : 2,
                staggerLines : 2
            },
            lineColor : '#444444',
            lineWidth : 1,
            tickColor : '#444444',
            type : 'datetime',
            /*dateTimeLabelFormats: {
                second: '%l:%M:%S %p',
                minute: '%l:%M %p',
                hour: '%l:%M %p',
                day: '%m/%d, %l:%M %p',
                week: '%m/%d, %l:%M %p',
                month: '%m/%d, %l:%M %p',
                year: '%l:%M %p'
            },*/
            minRange : 60000 // 1 minute
        },

        plotOptions : {
            columnrange : {
                borderWidth : 0,
                borderRadius : 3
            },
            series : {
                color : 'rgba(131,217,122, 1)',
                animation : false,
                turboThreshold : 25000
            }
        },

        legend : {
            enabled : false
        },

        tooltip : {
            useHTML : true,
            borderColor : '#999',
            borderWidth : 1,
            backgroundColor : 'rgba(255, 255, 255, 1)',
            formatter : function() {

                var scriptName = this.point.scriptName;
                var deploymentName = this.point.deploymentName;
                var scriptURL = this.point.scriptURL;
                var deploymentURL = this.point.deploymentURL;
                var duration = this.point.duration;
                var waitTime = this.point.waitTime;
                //var start = Highcharts.dateFormat('%m/%d/%Y %l:%M:%S %p', this.point.low);
                //var end = Highcharts.dateFormat('%m/%d/%Y %l:%M:%S %p', this.point.high);
                var start = this.point.startDate;
                var end = this.point.endDate;

                var table = '<table class="sqm-hc-tooltip" style="white-space: nowrap;">' +
                '<tr><td class="label">Script Name</td><td class="value">' +
                '<a href="' + scriptURL + '" target="_blank" class="sqm-a">' + scriptName + '</a>' + '</td></tr>' +
                '<tr><td class="label">Deployment Name</td><td class="value">' +
                '<a href="' + deploymentURL + '" target="_blank" class="sqm-a">' + deploymentName + '</a>' + '</td></tr>' +
                '<tr><td class="label">Start</td><td class="value">' + start + '</td></tr>' +
                '<tr><td class="label">End</td><td class="value">' + end + '</td></tr>' +
                '<tr><td class="label">Duration</td><td class="value">' + parseFloat(duration) + ' s</td></tr>' +
                '<tr><td class="label">Wait Time</td><td class="value">' + parseFloat(waitTime) + ' s</td></tr>' +
                '</table>';

                return table;
            }
        },

        series : [{
            name : 'timeline',
            data : [
                    //dummy data
                    ]
        }]

};

var timelineChartUtil = {

        resizeChart : function () {
            if (timelineChart) {
                timelineChart.setSize(Ext4.getCmp('psgp-sqm-subpanel-timeline').getWidth() - 20, Ext4.getCmp('psgp-sqm-subpanel-timeline').getHeight());
            }
        },

        initializeChart : function () {
            this.insertDummyData();
            timelineChartConfig.series[0].data = timelineData.records;
            timelineChartConfig.xAxis.categories = this.getCategories(timelineData.renderQueue);
            timelineChartConfig.xAxis.max = timelineData.renderQueue - 1;
            timelineChart = new Highcharts.Chart(timelineChartConfig);
        },

        getCategories : function (renderQueue) {
            var categories = new Array();
            for (var i = 1; i <= renderQueue; i++) {
                categories.push(i.toString());
            }
            return categories;
        },

        refreshChart : function () {
            if (timelineChart) {
                if (timelineChart.series[0]) timelineChart.series[0].remove(false);
                this.insertDummyData();
                if (timelineData.records.length > 0) {
                    timelineChart.addSeries({
                        name : 'timeline',
                        data : timelineData.records
                    }, false);
                    //timelineChart.series[0].setData(timelineData.records, false);
                }
                timelineChart.xAxis[0].setCategories(this.getCategories(timelineData.renderQueue), false);
                timelineChart.xAxis[0].setExtremes(0, timelineData.renderQueue-1, false);
                timelineChart.yAxis[0].setExtremes(null, null, false);
                timelineChart.redraw();
            } else {
                this.initializeChart();
            }
        },

        //function to make sure axis and bars are properly spaced
        insertDummyData : function () {
            for (var i = 0; i < timelineData.renderQueue; i++) {
                timelineData.records.push({
                    x : i
                    , low : null
                    , high : null
                });
            }
        }
};