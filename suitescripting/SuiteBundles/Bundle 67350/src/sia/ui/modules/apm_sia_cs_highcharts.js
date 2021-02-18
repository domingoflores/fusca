/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Feb 2015     jyeh             Initial
 * 2.00       04 Sep 2015     rwong            Disabled focus on selection in grid
 * 3.00       05 May 2018     jmarimla         Format client script labels
 * 4.00       29 Jun 2018     jmarimla         Translation readiness
 * 5.00       06 Jul 2018     jmarimla         Polishing translation
 * 6.00       26 Jul 2018     jmarimla         FRHT link
 * 7.00       18 Oct 2018     jmarimla         Redirect to profiler
 * 8.00       26 Oct 2018     jmarimla         Frht label
 * 9.00       08 Jan 2019     jmarimla         Translation
 * 10.00      07 Mar 2019     jmarimla         Client scripts disable frht
 * 11.00      12 Apr 2019     jmarimla         Move Profiler link
 * 12.00      08 Jul 2019     erepollo         Translation changes
 *
 */

function APMHighcharts() {
    PSGP.APM.SIA.Highcharts = {

            timelineChart : null,
            timelineChartData : null,

            renderTimeline : function (chartData) {
                if ((!chartData)||(chartData.length == 0)) {
                    if (this.timelineChart) {
                        this.timelineChart.destroy();
                        this.timelineChart = null;
                    }
                    return;
                }

                var containerId = 'psgp-apm-sia-timeline-chart';

                this.timelineChartData = chartData;

                var chartConfig = {
                    chart: {
                        renderTo: containerId,
                        animation: false,
                        type: 'columnrange',
                        inverted: true,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        text: ''
                    },
                    subtitle: {
                        text: ''
                    },
                    xAxis: {
                        type: 'Categories (s)',
                        id: 'Categories',
                        categories: chartData.categories,
                        crosshair: true,
                        labels: {
                            formatter: function () {
                                var text = this.value;
                                var formatted = '';
                                var title = '';
                                if (text.indexOf('Network') == 0) {
                                    formatted = text.replace('Network', APMTranslation.apm.common.label.network());
                                    title = formatted;
                                } else if (text.indexOf('Client : Header') == 0) {
                                    formatted = text.replace('Client : Header', APMTranslation.apm.ptd.label.clientheader());
                                    title = formatted;
                                } else if (text.indexOf('Client : Render') == 0) {
                                    formatted = text.replace('Client : Render', APMTranslation.apm.ptd.label.clientrender());
                                    title = formatted;
                                } else if (text.indexOf('Client : Init') == 0) {
                                    formatted = text.replace('Client : Init', APMTranslation.apm.ptd.label.clientinit());
                                    title = formatted;
                                } else if (text.indexOf('Workflow') == 0) {
                                    formatted = text.replace('Workflow', APMTranslation.apm.ns.context.workflow());
                                    title = formatted;
                                    formatted = formatted.length > 25 ? formatted.substring(0, 25) + '<b> ...  <b>' : formatted;
                                } else if (text.indexOf('Script') == 0) {
                                    formatted = text.replace('Script', APMTranslation.apm.ptd.label.script());
                                    title = formatted;
                                    formatted = formatted.length > 25 ? formatted.substring(0, 25) + '<b> ...  <b>' : formatted;
                                } else if (text.indexOf('ClientScript') == 0) {
                                    formatted = text.replace('ClientScript', APMTranslation.apm.ptd.label.script());
                                    title = formatted;
                                    formatted = formatted.length > 25 ? formatted.substring(0, 25) + '<b> ...  <b>' : formatted;
                                    formatted = '&nbsp;&nbsp;&nbsp;&nbsp;' + formatted;
                                } else {
                                    title = formatted;
                                    formatted = text.length > 25 ? text.substring(0, 25) + '<b> ...  <b>' : text;
                                }

                                return '<div class="standard" style="width:150px; overflow:hidden" title="' + title + '">' + formatted + '</div>';
                            },
                            useHTML: true
                        }
                    },
                    yAxis: {
                        title: APMTranslation.apm.ptd.label.time() + ' (s)',
                        min: 0,
                        max: chartData.totaltime,
                        plotBands: [
                        { //Visualizing initial request
                            from: 0 ,
                            to: chartData.redirectstart > 0 ? chartData.redirectstart : chartData.totaltime,
                            label: {
                                text: chartData.redirectstart > 0 ? '- Post -' : null,
                                style: {
                                    color : '#666',
                                    fontFamily : 'Arial',
                                    fontSize : '13px',
                                    fontWeight: 'bold'
                                }

                            }
                        },
                        { //Visualizing redirect request
                            from: chartData.redirectstart > 0 ? chartData.redirectstart : 0,
                            to: chartData.redirectstart > 0 ? chartData.totaltime : 0 ,
                            color: 'rgba(68, 170, 213, .1)',
                            label: {
                                text: chartData.redirectstart > 0 ? '- Get -' : null
                            }
                        }],
                        plotLines: [
                            {
                                id: 'start',
                                label: {
                                    text: 'Request Start',
                                    align: 'left',
                                    style: {
                                        color : '#666',
                                        fontFamily : 'Arial',
                                        fontSize : '11px',
                                        fontWeight: 'normal'
                                    }
                                },
                                color: 'black',
                                dashStyle: 'solid',
                                value: 0,
                                width: 0
                            },
                            {
                            id: 'redirectstart',
                            color: 'red',
                            dashStyle: 'solid',
                            value: chartData.redirectstart > 0 ? chartData.redirectstart : -200,
                            width: 3
                            }
                        ]
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
                    credits: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        formatter: function () {
                            //return this.x+ ' : ' + Number(this.point.high - this.point.low).toFixed(3) + '(s)';
                            var text = this.x;
                            var formatted = '';
                            var addFrhtLink = false;
                            if (text.indexOf('Network') == 0) {
                                formatted = text.replace('Network', APMTranslation.apm.common.label.network());
                            } else if (text.indexOf('Client : Header') == 0) {
                                formatted = text.replace('Client : Header', APMTranslation.apm.ptd.label.clientheader());
                            } else if (text.indexOf('Client : Render') == 0) {
                                formatted = text.replace('Client : Render', APMTranslation.apm.ptd.label.clientrender());
                            } else if (text.indexOf('Client : Init') == 0) {
                                formatted = text.replace('Client : Init', APMTranslation.apm.ptd.label.clientinit());
                            } else if (text.indexOf('Workflow') == 0) {
                                formatted = text.replace('Workflow', APMTranslation.apm.ns.context.workflow());
                                addFrhtLink = true;
                            } else if (text.indexOf('Script') == 0) {
                                formatted = text.replace('Script', APMTranslation.apm.ptd.label.script());
                                addFrhtLink = true;
                            }
                            else if (text.indexOf('ClientScript') == 0) {
                                formatted = text.replace('ClientScript', APMTranslation.apm.ptd.label.script());
                                addFrhtLink = false;
                            }
                            var totalTime = Number(this.point.high - this.point.low).toFixed(3);

                            var markUp = '<table>';
                            markUp += '<tr><td>' + formatted + ' : ' + totalTime + 's' + '</td></tr>';
                            /*
                            if (addFrhtLink) {
                                markUp += '<tr><td align="center"><a href="#" onclick="PSGP.APM.SIA.Highcharts.redirectPRF(' + this.point.x + ');">' + APMTranslation.apm.common.label.viewprofilerdetails() + '</a></td></tr>'
                            }
                            */
                            markUp += '</table>'

                            return markUp;
                        },
                        useHTML: true
                    },
                    series: [
                        {
                            name : 'Time (s)',
                            id: 'Time',
                            color: 'rgba(96, 119, 153, 0.8)',
                            pointPadding: 0.1,
                            groupPadding: 0,
                            pointWidth: 20,
                            point: {
                                events: {
                                    mouseOver: function () {
                                        var grid = Ext4.getCmp('psgp-apm-sia-grid-suitescriptdetail');
                                        var targetRowIndex = grid.store.find('id', this.id);
                                        grid.getSelectionModel().select(targetRowIndex, false, true);
                                    },
                                    mouseOut: function() {
                                        var grid = Ext4.getCmp('psgp-apm-sia-grid-suitescriptdetail');
                                        var targetRowIndex = grid.store.find('id', this.id);
                                        grid.getSelectionModel().deselect(targetRowIndex, false, true);
                                    }
                                }
                            },
                            //borderRadius: 10,
                            height: 0.75,
                            data: chartData.series
                        }
                    ],
                    plotOptions: {
                        columnrange: {
                            allowPointSelect: false,
                            animation: false,
                            borderWidth: 0,
                            slicedOffset: 20,
                            showInLegend: false,
                            dataLabels: {
                                enabled: false,
                                allowOverlap: false,
                                formatter: function () {
                                    return this.y + 's';
                                },
                                style: {
                                    color : '#666',
                                    fontFamily : 'Arial',
                                    fontSize : '11px',
                                    fontWeight: 'normal'
                                },
                                overflow: 'justify',
                                crop: false
                            }
                        }
                    }
                };

                if (this.timelineChart) {
                    this.timelineChart.destroy();
                }
                this.timelineChart = new Highcharts.Chart(chartConfig);
                this.resizeChart(this.timelineChart, containerId);
            },

            redirectPRF: function (idx) {
                var rData = this.timelineChartData.series[idx];
                var operationId = rData.operationId;
                 var frhtId = rData.frhtId;
                 var dataParams = {
                         compfil : ((COMPID_MODE == 'T') && (COMP_FIL)) ? COMP_FIL : '',
                         operationId: operationId,
                         frhtId: frhtId
                 };

                 var paramString = Ext4.urlEncode(dataParams);
                 var PRF_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_prf_sl_main&deploy=customdeploy_apm_prf_sl_main';
                 window.open(PRF_URL + '&' + paramString);
            },

            resizeAllCharts : function () {
                this.resizeChart(this.timelineChart, 'psgp-apm-sia-timeline-chart');
            },

            resizeChart : function (chart, containerId) {
                if (chart) {
                    chart.setSize(Ext4.getCmp(containerId).getWidth() - 20, Ext4.getCmp(containerId).getHeight());
                }
            }
        };
}