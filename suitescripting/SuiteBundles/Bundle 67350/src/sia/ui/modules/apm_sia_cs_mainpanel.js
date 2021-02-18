/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Feb 2015     jyeh             Initial
 * 2.00       24 Mar 2015     jmarimla         Changed portlet name
 * 3.00       28 Mar 2015     jyeh
 * 4.00       09 Apr 2015     jyeh
 * 5.00       22 Apr 2015     jmarimla         callPerfInstanceChartRESTlet in afterrender of container
 * 6.00       25 Aug 2015     jmarimla         Create title toolbar
 * 7.00       04 Sep 2015     rwong            Added Suitescripttime and Workflowtime
 * 8.00       19 May 2016     rwong            Added loading mask to the timeline chart
 * 9.00       29 Jun 2018     jmarimla         Translation readiness
 * 10.00      12 Apr 2019     jmarimla         Move profiler link
 * 11.00      17 Apr 2019     rwong            Adjusted profiler link
 * 12.00      24 May 2019     erepollo         Changed portlet container
 * 13.00      28 Jun 2019     erepollo         Translation for new texts
 * 14.00      11 Oct 2019     jmarimla         Search by operationid
 *
 */

function APMMainPanel() {
    Ext4.define('PSGP.APM.SIA.Component.MainPanel', {
        extend: 'PSGP.APM.Component.Container',
        id: 'psgp-apm-sia-mainpanel',
        minWidth: 1024,
        listeners: {
            beforerender: function () {
                //Enable CompId Mode
                if (COMPID_MODE == 'T') {
                    Ext4.getCmp('psgp-apm-sia-btn-suiteletsettings').show();
                }
            },
            afterrender: function () {
                if ( params.fparam && params.operationId ) {
                    Ext4.getCmp('psgp-apm-sia-filters-operationid').setValue(params.operationId);
                }
            }
        },
        items: [
            Ext4.create('PSGP.APM.Component.PageToolbar', {
                items: [
                    Ext4.create('PSGP.APM.Component.PageTitle', {
                        value: APMTranslation.apm.ptd.label.pagetimedetails()
                    }),
                    '->',
                    {
                        xtype: 'container',
                        border: false,
                        flex: 1,
                        items: [
                            {
                                id: 'psgp-apm-sia-display-profilerlink',
                                border: false,
                                margin: '0 0 0 0',
                                html: '<a class="apm-redirectlink" onclick="PSGP.APM.SIA.dataStores.redirectToProfiler()" href="javascript:void(0);">' + APMTranslation.apm.r2019a.profilerdetails() + '</a>'
                            }
                        ]
                    },
                    Ext4.create('PSGP.APM.Component.PageToolbarButton', {
                        id: 'psgp-apm-sia-btn-suiteletsettings',
                        text: APMTranslation.apm.common.label.customerdebugsettings(),
                        margin: '0 50 0 0',
                        targetMenu: 'psgp-apm-sia-quicksel-compid',
                        hidden: true
                    })
               ]
            }),
            Ext4.create('PSGP.APM.Component.EmptyPanel', {
                id: 'psgp-apm-sia-panel-filters',
                layout: {
                    type: 'hbox',
                    align: 'bottom'
                },
                margin: '10 20 10 20',
                items: [
                    {
                        xtype: 'container',
                        margin: '0 30 0 0',
                        border: false,
                        align: 'left',
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: 'Operation ID'
                                }),
                                Ext4.create('PSGP.APM.Component.TextField', {
                                    id: 'psgp-apm-sia-filters-operationid',
                                    width: 300
                                })
                         ]
                    },
                    Ext4.create('PSGP.APM.SIA.Component.BlueButton.Search', {
                        id: 'psgp-apm-sia-btn-search',
                        margin: '5 0 0 0',
                    })
                ]
            }),
            Ext4.create('PSGP.APM.Component.EmptyPanel', {
                layout: 'column',
                items: [
                    Ext4.create('PSGP.APM.Component.PortletContainer', {
                        margin: '10, 20, 10, 20',
                        columnWidth: 1,
                        items: [
                            Ext4.create('PSGP.APM.Component.PortletPanel', {
                            id: 'psgp-apm-sia-portlet-suitescriptdetail',
                            title: APMTranslation.apm.common.label.overview(),
                            items: [
                                Ext4.create('PSGP.APM.Component.EmptyPanel', {
                                    id: 'psgp-apm-sia-panel-overview-1',
                                    layout: 'hbox',
                                    margin: '0, 30, 10, 30',
                                    items: [
                                        {
                                            xtype: 'container',
                                            flex: 1,
                                            border: false,
                                            align: 'left',
                                            items: [
                                                Ext4.create('PSGP.APM.Component.SummaryField', {
                                                    id: 'psgp-apm-sia-display-summary-operationid',
                                                    fieldLabel: 'Operation ID',
                                                    margin: '10 20 10 20',
                                                    value : null
                                                })
                                            ]
                                        },
                                        {
                                            xtype: 'container',
                                            flex: 1,
                                            border: false,
                                            align: 'left',
                                            items: [
                                                Ext4.create('PSGP.APM.Component.SummaryField', {
                                                    id: 'psgp-apm-sia-display-summary-page',
                                                    fieldLabel: APMTranslation.apm.ptd.label.page(),
                                                    margin: '10 20 10 20',
                                                    value : null
                                                })
                                            ]
                                        },
                                        {
                                            xtype: 'container',
                                            flex: 1,
                                            border: false,
                                            align: 'left',
                                            items: [
                                                Ext4.create('PSGP.APM.Component.SummaryField', {
                                                    id: 'psgp-apm-sia-display-summary-time',
                                                    fieldLabel: APMTranslation.apm.ptd.label.time(),
                                                    margin: '10 20 10 20',
                                                    value : null
                                                })
                                            ]
                                        }
                                    ]
                                }),

                                Ext4.create('PSGP.APM.Component.EmptyPanel', {
                                    id: 'psgp-apm-sia-panel-overview-2',
                                    layout: 'hbox',
                                    margin: '0, 30, 10, 30',
                                    items: [
                                        {
                                            xtype: 'container',
                                            flex: 1,
                                            border: false,
                                            align: 'left',
                                            items: [
                                                Ext4.create('PSGP.APM.Component.SummaryField', {
                                                    id: 'psgp-apm-sia-display-summary-email',
                                                    fieldLabel: APMTranslation.apm.common.label.email(),
                                                    margin: '10 20 10 20',
                                                    value : null
                                                })
                                            ]
                                        },
                                        {
                                            xtype: 'container',
                                            flex: 1,
                                            border: false,
                                            align: 'left',
                                            items: [
                                                Ext4.create('PSGP.APM.Component.SummaryField', {
                                                    id: 'psgp-apm-sia-display-summary-suitescripttime',
                                                    fieldLabel: APMTranslation.apm.ns.context.suitescript(),
                                                    margin: '10 20 10 20',
                                                    value : null
                                                })
                                            ]
                                        },
                                        {
                                            xtype: 'container',
                                            flex: 1,
                                            border: false,
                                            align: 'left',
                                            items: [
                                                Ext4.create('PSGP.APM.Component.SummaryField', {
                                                    id: 'psgp-apm-sia-display-summary-workflowtime',
                                                    fieldLabel: APMTranslation.apm.ns.context.workflow(),
                                                    margin: '10 20 10 20',
                                                    value : null
                                                })
                                            ]
                                        }

                                    ]
                                }),

                                Ext4.create('PSGP.APM.Component.SubPanel', {
                                    id: 'psgp-apm-sia-subpanel-timeline',
                                    title: APMTranslation.apm.common.label.timeline(),
                                    emptyText: APMTranslation.apm.common.label.norecordstoshow(),
                                    margin: '10, 10, 10, 10',
                                    layout: 'fit',
                                    items: [
                                            Ext4.create('Ext4.container.Container',
                                            {
                                                id: 'psgp-apm-sia-no-data-container',
                                                border: 0,
                                                layout: 'column',
                                                style: {borderColor:'#DDDDDF', borderStyle:'solid', borderWidth:'1px'},
                                                margin: '5, 5, 10, 0',
                                                items: [
                                                    Ext4.create('Ext4.container.Container', {
                                                        id: 'psgp-apm-sia-suitescriptdetail-chart-nodata',
                                                        hidden: true,
                                                        layout: 'hbox',
                                                        items: [
                                                            Ext4.create('Ext4.panel.Panel', {
                                                                cls: 'apm-suitescriptdetail-chart-warning',
                                                                height: 35,
                                                                width: 40,
                                                                border: false,
                                                                margin: '5, 0, 0, 0'
                                                            }),
                                                            Ext4.create('Ext4.form.Label', {
                                                                columnWidth: 1,
                                                                border: false,
                                                                margin: '5, 0, 0, 0',
                                                                text: APMTranslation.apm.common.label.norecordstoshow()
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            Ext4.create('Ext4.container.Container', {
                                                id: 'psgp-apm-sia-timeline-chart',
                                                height: 500,
                                                border: false,
                                                margin: '5, 5, 10, 0',
                                                listeners: {
                                                    afterrender: function () {
                                                        Ext4.getCmp('psgp-apm-sia-subpanel-timeline').setLoading(MASK_CONFIG);
                                                        PSGP.APM.SIA.dataStores.callPerfInstanceChartRESTlet();
                                                    }
                                                },
                                                items: []
                                            })
                                    ],
                                    listeners: {
                                        expand : {
                                            fn: function() {console.log ('expanded');
                                                PSGP.APM.SIA.Highcharts.resizeAllCharts();
                                            }
                                        }
                                    }
                                }),

                                Ext4.create('PSGP.APM.Component.SubPanel', {
                                    id: 'psgp-apm-sia-suitescriptdetail-grid-panel',
                                    title: APMTranslation.apm.ptd.label.suitescriptworkflowdetails(),
                                    titleAlign: 'left',
                                    height: 400,
                                    margin: '10, 10, 10, 10',
                                    header: {
                                        border: false
                                    },
                                    layout: 'fit',
                                    items: [
                                        Ext4.create('PSGP.APM.SIA.Component.Grid.SuiteScriptDetail', {
                                            id: 'psgp-apm-sia-grid-suitescriptdetail',
                                            margin: '5, 5, 0, 0',
                                            flex: 1
                                        })
                                    ]
                                })
                            ]
                            })
                        ]
                    })
                ]
            })
        ]
    });

}
