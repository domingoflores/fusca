/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       29 Oct 2014     jmarimla         Initial
 * 2.00       04 Nov 2014     jmarimla         Added filter panel
 * 3.00       07 Nov 2014     jmarimla         Added performance chart and suitescript detail panels
 * 4.00       11 Nov 2014     jmarimla         Commented out deployment name combobox
 * 5.00       20 Nov 2014     rwong            Added view all logs button
 * 6.00       28 Nov 2014     rwong            Implement support parameter setting of filters
 * 7.00       02 Dec 2014     jmarimla         Added components for performance chart portlet
 * 8.00       09 Jan 2015     rwong            Set psgp-apm-ssa-container-perfchart chart to be shown by default. Remove ExtJS Chart
 * 9.00       29 Jan 2015     rwong            Added height definition to psgp-apm-ssa-container-perfchart. Removed commented code.
 * 10.00      02 Feb 2015     jmarimla         Removed height in ssd summary portlet
 * ********************************************************************************
 * 1.00       23 Feb 2015     rwong            Ported SPM to APM.
 * 2.00       19 May 2015     jmarimla         Add component ids
 * 3.00       09 Jul 2015     jmarimla         Added summary fields in suitescript details
 * 4.00       06 Aug 2015     rwong            Added class url to links
 *                                             Renamed "View All Logs" to "View Logs"
 *                                             Filter Panel is collapsed on load
 * 5.00       25 Aug 2015     jmarimla         Create title toolbar; Added script id field for compid mode
 * 6.00       04 Sep 2015     rwong            Rename suitelet settings to Customer Debug Settings
 * 7.00       06 Jun 2016     jmarimla         Relayout filter fields to fix border issue
 * 8.00       05 Aug 2016     jmarimla         Support for suitescript context
 * 9.00       05 Apr 2018     rwong            Added support for client scripts
 * 10.00      11 May 2018     jmarimla         SuiteScript label
 * 11.00      29 Jun 2018     jmarimla         Translation readiness
 * 12.00      16 Jul 2018     jmarimla         Set translated time
 * 13.00      24 May 2019     erepollo         Removed header BG
 * 14.00      19 Aug 2019     jmarimla         Filters expand/collapse
 * 15.00      27 Nov 2019     lemarcelo        Remove display condition of error count
 *
 */

function APMMainPanel() {
    Ext4.define('PSGP.APM.SSA.Component.MainPanel', {
        extend: 'PSGP.APM.Component.Container',
        id: 'psgp-apm-ssa-mainpanel',
        params: {
            sdatetime: '',
            edatetime: '',
            scripttype: '',
            scriptid: ''
        },
        minWidth: 1024,
        listeners: {
            beforerender: function () {
                var params = this.params;

                //Enable CompId Mode
                if (COMPID_MODE == 'T') {
                    Ext4.getCmp('psgp-apm-ssa-btn-suiteletsettings').show();

                    if (COMP_FIL) {
                        Ext4.getCmp('psgp-apm-ssa-container-filters-scriptname').hide();
                        Ext4.getCmp('psgp-apm-ssa-container-filters-scriptid').show();
                    }
                }

                if(params.fparam == true) {
                    //set filter fields from parameters
                    Ext4.getCmp('psgp-apm-ssa-filters-date-startdate').setValue(params.sdate);
                    Ext4.getCmp('psgp-apm-ssa-filters-date-enddate').setValue(params.edate);
                    Ext4.getCmp('psgp-apm-ssa-filters-time-starttime').setValue(Ext4.Date.parse(params.stime, 'H:i'));
                    Ext4.getCmp('psgp-apm-ssa-filters-time-endtime').setValue(Ext4.Date.parse(params.etime, 'H:i'));
                    Ext4.getCmp('psgp-apm-ssa-filters-scripttype').setValue(params.scripttype);
                    if(params.scripttype == 'client'){
                        Ext4.getCmp('psgp-apm-ssa-filters-clienteventtype').setValue('pageInit');
                    }
                    if ((COMPID_MODE == 'T') && (COMP_FIL)) {
                        Ext4.getCmp('psgp-apm-ssa-filters-scriptid').setValue(params.scriptid);
                    } else {
                        Ext4.getCmp('psgp-apm-ssa-filters-scriptname').setValue(params.scriptid);
                    }
                    if (params.scripttype.indexOf('userevent') < 0) {
                        Ext4.getCmp('psgp-apm-ssa-container-filters-context').hide();
                    } else {
                        Ext4.getCmp('psgp-apm-ssa-container-filters-context').show();
                    }
                    if (params.context) Ext4.getCmp('psgp-apm-ssa-filters-context').setValue(params.context);

                } else {
                    var today = new Date();
                    var tomorrow = new Date(today.getTime() + 24*60*60*1000);
                    Ext4.getCmp('psgp-apm-ssa-filters-date-startdate').setValue(today);
                    Ext4.getCmp('psgp-apm-ssa-filters-date-enddate').setValue(tomorrow);
                    Ext4.getCmp('psgp-apm-ssa-filters-time-starttime').setValue(Ext4.Date.parse('00:00', 'H:i'));
                    Ext4.getCmp('psgp-apm-ssa-filters-time-endtime').setValue(Ext4.Date.parse('00:00', 'H:i'));
                }

            },
            afterrender: function () {
                var params = this.params;
                if(!params.fparam) {
                    Ext4.getCmp('psgp-apm-ssa-panel-filters').expand();
                }
            }
        },
        items: [
            Ext4.create('PSGP.APM.Component.PageToolbar', {
                items: [
                     Ext4.create('PSGP.APM.Component.PageTitle', {
                         value: APMTranslation.apm.ssa.label.suitescriptanalysis()
                     }),
                     '->',
                     Ext4.create('PSGP.APM.Component.PageToolbarButton', {
                         id: 'psgp-apm-ssa-btn-suiteletsettings',
                         text: APMTranslation.apm.common.label.customerdebugsettings(),
                         margin: '0 50 0 0',
                         targetMenu: 'psgp-apm-ssa-quicksel-compid',
                         hidden: true
                     }),
                ]
            }),
            Ext4.create('PSGP.APM.SSA.Component.BlueButton.Search', {
                id: 'psgp-apm-ssa-btn-search',
                margin: '5 30 15 30'
            }),
            Ext4.create('PSGP.APM.Component.FiltersPanel', {
                id: 'psgp-apm-ssa-panel-filters',
                margin: '0 30 10 30',
                collapsed: true,
                items: [
                    {
                        xtype: 'container',
                        margin: '0 28 0 0',
                        border: false,
                        align: 'left',
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: APMTranslation.apm.common.label.startdatetime()
                                }),
                                {
                                    xtype: 'container',
                                    layout: 'hbox',
                                    items: [
                                            {
                                                xtype: 'container',
                                                items: [
                                                    Ext4.create('PSGP.APM.Component.Date', {
                                                        id: 'psgp-apm-ssa-filters-date-startdate',
                                                        margin: '0 20 0 0'
                                                    })
                                                ]
                                            },
                                            {
                                                xtype: 'container',
                                                items: [
                                                    Ext4.create('PSGP.APM.Component.Time', {
                                                        id: 'psgp-apm-ssa-filters-time-starttime',
                                                        margin: '0 2 0 0'
                                                    })
                                                ]
                                            }
                                            ]
                                }
                                ]
                    },
                    {
                        xtype: 'container',
                        margin: '0 28 0 0',
                        border: false,
                        align: 'left',
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: APMTranslation.apm.common.label.enddatetime()
                                }),
                                {
                                    xtype: 'container',
                                    layout: 'hbox',
                                    items: [
                                            {
                                                xtype: 'container',
                                                items: [
                                                    Ext4.create('PSGP.APM.Component.Date', {
                                                        id: 'psgp-apm-ssa-filters-date-enddate',
                                                        margin: '0 20 0 0'
                                                    })
                                                ]
                                            },
                                            {
                                                xtype: 'container',
                                                items: [
                                                    Ext4.create('PSGP.APM.Component.Time', {
                                                        id: 'psgp-apm-ssa-filters-time-endtime',
                                                        margin: '0 2 0 0'
                                                    })
                                                ]
                                            }
                                            ]
                                }
                                ]
                    },
                    {
                        xtype: 'container',
                        width: 240,
                        border: false,
                        align: 'left',
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: APMTranslation.apm.ssa.label.scripttype()
                                }),
                                Ext4.create('PSGP.APM.SSA.Component.ComboBox.ScriptType', {
                                    id: 'psgp-apm-ssa-filters-scripttype'
                                })
                                ]
                    },
                    {
                        xtype: 'container',
                        id: 'psgp-apm-ssa-container-filters-scriptname',
                        width: 290,
                        border: false,
                        align: 'left',
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: APMTranslation.apm.common.label.scriptname()
                                }),
                                Ext4.create('PSGP.APM.SSA.Component.ComboBox.ScriptName', {
                                    id: 'psgp-apm-ssa-filters-scriptname'
                                })
                                ]
                    },
                    {
                        xtype: 'container',
                        id: 'psgp-apm-ssa-container-filters-scriptid',
                        hidden: true,
                        width: 110,
                        border: false,
                        align: 'left',
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: APMTranslation.apm.ssa.label.scriptid()
                                }),
                                Ext4.create('PSGP.APM.Component.NumberField', {
                                    id: 'psgp-apm-ssa-filters-scriptid'
                                })
                                ]
                    },
                    {
                        xtype: 'container',
                        id: 'psgp-apm-ssa-container-filters-context',
                        width: 290,
                        border: false,
                        align: 'left',
                        hidden: true,
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: APMTranslation.apm.common.label.context()
                                }),
                                Ext4.create('PSGP.APM.SSA.Component.ComboBox.Context', {
                                    id: 'psgp-apm-ssa-filters-context'
                                })
                                ]
                    },
                    {
                        xtype: 'container',
                        id: 'psgp-apm-ssa-container-filters-clienteventtype',
                        width: 290,
                        border: false,
                        align: 'left',
                        hidden: true,
                        items: [
                                Ext4.create('PSGP.APM.Component.Display', {
                                    fieldLabel: APMTranslation.apm.ssa.label.clienteventtype()
                                }),
                                Ext4.create('PSGP.APM.SSA.Component.ComboBox.ClientEventType', {
                                    id: 'psgp-apm-ssa-filters-clienteventtype'
                                })
                                ]
                    }
                ]
            }),
            {
                xtype: 'container',
                border: false,
                layout: 'column',
                items: [
                    Ext4.create('PSGP.APM.Component.PortletContainer', {
                        margin: '0 5 10 30',
                        columnWidth: .75,
                        items: [
                            Ext4.create('PSGP.APM.Component.PortletPanel', {
                                id: 'psgp-apm-ssa-portlet-performancechart',
                                title: APMTranslation.apm.ssa.label.performancechart(),
                                height: 521,
                                items: [
                                    {
                                        xtype: 'container',
                                        id: 'psgp-apm-ssa-container-perfchart-nodata',
                                        layout: 'hbox',
                                        items: [
                                                Ext4.create('Ext4.panel.Panel', {
                                                    id: 'psgp-apm-ssa-chart-nodata-icon',
                                                    cls: 'apm-suitescriptdetail-chart-warning',
                                                    height: 30,
                                                    width: 32,
                                                    border: false,
                                                    margin: '10 0 0 10'
                                                }),
                                                Ext4.create('Ext4.form.Label', {
                                                    id: 'psgp-apm-ssa-chart-nodata-text',
                                                    flex: 1,
                                                    border: false,
                                                    margin: '10 0 0 10',
                                                    text: APMTranslation.apm.common.label.nodataavailable()
                                                })
                                        ]
                                    },
                                    {
                                        xtype: 'container',
                                        border: false,
                                        layout: 'fit',
                                        height: 470,
                                        id: 'psgp-apm-ssa-container-perfchart',
                                    }
                                ]
                            })
                        ]
                    }),
                    Ext4.create('PSGP.APM.Component.PortletContainer', {
                        margin: '0 30 10 5',
                        columnWidth: .25,
                        items: [
                            Ext4.create('PSGP.APM.Component.PortletPanel', {
                                id: 'psgp-apm-ssa-portlet-suitescriptdetails',
                                title: APMTranslation.apm.ssa.label.suitescriptdetails(),
                                items: [
                                    {
                                        xtype: 'container',
                                        id: 'psgp-apm-ssa-container-suitescriptdetails',
                                        width: '100%',
                                        layout: {
                                            type: 'vbox',
                                            align: 'center'
                                        },
                                        items: [
                                            {
                                                xtype: 'container',
                                                width: '100%',
                                                margin: '20 20 0 20',
                                                layout: {
                                                    type: 'vbox',
                                                    align: 'left'
                                                },
                                                items: [
                                                    Ext4.create('PSGP.APM.Component.SummaryField', {
                                                        id: 'psgp-apm-ssa-display-summary-scriptname',
                                                        fieldLabel: APMTranslation.apm.common.label.scriptname(),
                                                        width: '100%',
                                                        value: '-',
                                                        margin: '0 0 10 0'
                                                    }),
                                                    Ext4.create('PSGP.APM.Component.SummaryField', {
                                                        id: 'psgp-apm-ssa-display-summary-scripttype',
                                                        fieldLabel: APMTranslation.apm.ssa.label.scripttype(),
                                                        width: '100%',
                                                        value: '-',
                                                        margin: '0 0 10 0'
                                                    }),
                                                    Ext4.create('PSGP.APM.Component.SummaryField', {
                                                        id: 'psgp-apm-ssa-display-summary-context',
                                                        fieldLabel: APMTranslation.apm.common.label.context(),
                                                        width: '100%',
                                                        value: '-',
                                                        margin: '0 0 10 0',
                                                        hidden: true
                                                    }),
                                                    {
                                                        xtype: 'container',
                                                        width: '100%',
                                                        layout: {
                                                            type: 'hbox'
                                                        },
                                                        items: [
                                                            Ext4.create('PSGP.APM.Component.SummaryField', {
                                                                id: 'psgp-apm-ssa-display-summary-fromdate',
                                                                fieldLabel: APMTranslation.apm.common.label.from(),
                                                                flex: 1,
                                                                value: '-'
                                                            }),
                                                            Ext4.create('PSGP.APM.Component.SummaryField', {
                                                                id: 'psgp-apm-ssa-display-summary-todate',
                                                                fieldLabel: APMTranslation.apm.common.label.to(),
                                                                flex: 1,
                                                                value: '-'
                                                            })
                                                        ]
                                                    }
                                                ]
                                            },
                                            Ext4.create('PSGP.APM.SSA.Component.Grid.SuitescriptDetails', {
                                                id: 'psgp-apm-ssa-grid-suitescriptdetails',
                                                margin: '20 20 20 20',
                                                width: '100%'
                                            }),
                                            Ext4.create('PSGP.APM.Component.GrayButton', {
                                                id: 'psgp-apm-ssa-btn-viewalllogs',
                                                text: APMTranslation.apm.ssa.label.viewlogs(),
                                                margin: '0, 20, 20, 20',
                                                height: 26,
                                                handler: function() {
                                                    PSGP.APM.SSA.dataStores.suiteScriptDetailData.loadPage(1);
                                                    Ext4.getCmp('psgp-apm-ssa-window-ssd').show();
                                                }
                                            })
                                        ]
                                    }
                                ]
                            })
                        ]
                    })
                ]
            }
        ]
    });
};

