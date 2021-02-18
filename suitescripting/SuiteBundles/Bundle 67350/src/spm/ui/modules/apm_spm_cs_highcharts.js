/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       09 Feb 2015     jmarimla         Initial
 ****************************************************************************************************************
 * 1.00       23 Feb 2015     jmarimla         Porting to APM
 * 2.00       24 Mar 2015     jmarimla         commented itemwidth in legend
 * 3.00       08 Apr 2015     rwong            Adjusted plot options and remove data labels
 * 4.00       27 Apr 2015     jmarimla         New tooltip
 * 5.00       29 Jun 2018     jmarimla         Translation readiness
 *
 */

function APMHighcharts() {
	PSGP.APM.SPM.Highcharts = {

	        suiteScriptDetailChart : null,

	        renderSuiteScriptDetailChart : function (chartData) {
	            if ((!chartData)||(chartData.length == 0)) {
	                if (this.suiteScriptDetailChart) {
	                    this.suiteScriptDetailChart.destroy();
	                    this.suiteScriptDetailChart = null;
	                }
	                return;
	            }

	            var containerId = 'psgp-apm-spm-suitescriptdetail-chart-container';

	            var chartConfig = {
	                    chart: {
	                        renderTo: containerId,
	                        type: 'pie',
	                        backgroundColor:'rgba(255, 255, 255, 0.1)',
	                    },
	                    title:{
	                        text: APMTranslation.apm.common.label.executiontime(),
	                        style : {
	                            color : '#666',
	                            fontFamily : 'Arial',
	                            fontSize : '16px',
	                            fontWeight : 'bold'
	                        }
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
	                    credits : {
	                        enabled : false
	                    },
	                    legend: {
	                        layout: 'horizontal',
	                        maxHeight: 60,
	                        //width:200,
	                        //itemWidth:100,
	                        itemStyle: {
	                          width:80
	                        }
	                    },
	                    tooltip: {
	                        formatter: function() {
	                            
	                            var table = '<table>';
	                            table += '<tr><td colspan="3" align="center"><b>' + this.point.name + ' (' + this.percentage.toFixed(2) + ' %)' + '</b></td></tr>';
	                            table += '<tr><td align="left">' + APMTranslation.apm.common.label.executiontime() + '</td><td>:</td><td align="left">'+ this.point.y +'s</td></tr>';
	                            if (this.point.scripttype) {
	                                var scriptType = this.point.scripttype.toLowerCase();
	                                switch(scriptType) {
	                                case 'client':  scriptType = APMTranslation.apm.common.label.client(); break;
	                                case 'userevent': scriptType = APMTranslation.apm.common.label.userevent(); break;
	                                case 'workflow': scriptType = APMTranslation.apm.ns.context.workflow(); break;
	                                }
	                                table += '<tr><td align="left">' + APMTranslation.apm.ssa.label.scripttype() + '</td><td>:</td><td align="left">'+ scriptType +'</td></tr>';
	                            }
	                            if (this.point.triggertype) {
	                                table += '<tr><td align="left">' + APMTranslation.apm.common.label.executioncontext() + '</td><td>:</td><td align="left">'+ this.point.triggertype +'</td></tr>';
	                            }
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
	                                    return Math.round(this.percentage*100)/100 + ' %';
	                                },
	                                distance: 10,
	                                style: {
	                                    color : '#666',
	                                    fontFamily : 'Arial',
	                                    fontSize : '11px',
	                                    fontWeight: 'normal'
	                                },
	                                connectorColor: '#666'
	                            },
	                            colors: [
	                                            'rgba(138,193,68,0.8)','rgba(232,255,183,0.8)','rgba(193,244,193,0.8)','rgba(146,214,179,0.8)','rgba(121,189,154,0.8)',
	                                            'rgba(59,134,134,0.8)','rgba(60,109,137,0.8)','rgba(36,56,91,0.8)','rgba(90,105,132,0.8)','rgba(145,155,173,0.8)',
	                                            'rgba(200,205,214,0.8)','rgba(175,188,203,0.8)','rgba(135,154,177,0.8)','rgba(96,121,152,0.8)','rgba(149,145,173,0.8)',
	                                            'rgba(163,145,173,0.8)','rgba(173,145,169,0.8)','rgba(173,145,155,0.8)','rgba(173,149,145,0.8)','rgba(173,163,145,0.8)',
	                                            'rgba(169,173,145,0.8)','rgba(155,173,145,0.8)','rgba(145,173,149,0.8)','rgba(145,173,163,0.8)','rgba(145,169,173,0.8)',
	                                            'rgba(145,155,173,0.8)','rgba(33,44,60,0.8)','rgba(57,74,98,0.8)','rgba(66,88,121,0.8)','rgba(90,118,159,0.8)',
	                                            'rgba(99,132,182,0.8)','rgba(51,51,51,0.8)','rgba(36,56,91,0.8)','rgba(90,105,132,0.8)','rgba(145,155,173,0.8)',
	                                            'rgba(200,205,214,0.8)','rgba(175,188,203,0.8)','rgba(135,154,177,0.8)','rgba(96,121,152,0.8)','rgba(149,145,173,0.8)',
	                                            'rgba(163,145,173,0.8)','rgba(173,145,169,0.8)','rgba(173,145,155,0.8)','rgba(173,149,145,0.8)','rgba(173,163,145,0.8)',
	                                            'rgba(169,173,145,0.8)','rgba(155,173,145,0.8)','rgba(145,173,149,0.8)','rgba(145,173,163,0.8)','rgba(145,169,173,0.8)'
	                                        ],
	                            states: {
	                                hover: {
	                                    enabled: true
	                                }
	                            }/*,
	                            point: {
	                                events: {
	                                    mouseOver: function () {
	                                        this.firePointEvent('click');
	                                    }
	                                }
	                            }*/
	                        }
	                    },

	                    series: [{
	                        data: chartData
	                    }]
	            };

	            if (this.suiteScriptDetailChart) {
	                this.suiteScriptDetailChart.destroy();
	            }
	            this.suiteScriptDetailChart = new Highcharts.Chart(chartConfig);
	            this.resizeChart(this.suiteScriptDetailChart, containerId);
	        },

	        resizeAllCharts : function () {
	            this.resizeChart(this.suiteScriptDetailChart, 'psgp-apm-spm-suitescriptdetail-chart-container');
	        },

	        resizeChart : function (chart, containerId) {
	            if (chart) {
	                chart.setSize(Ext4.getCmp(containerId).getWidth() - 20, Ext4.getCmp(containerId).getHeight());
	            }
	        }
	};
}