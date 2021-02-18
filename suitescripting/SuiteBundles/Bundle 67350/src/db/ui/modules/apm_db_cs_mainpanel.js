/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       09 Dec 2014     jmarimla         Initial
 * 2.00       09 Jan 2015     jmarimla         Add components for Record Pages portlet
 * 3.00       15 Jan 2015     jmarimla         Update carousel on load
 * 4.00       28 Jan 2015     jmarimla         Added record chart panels
 * 5.00       07 Mar 2015     jmarimla         Added toolbar to record pages portlet
 * 6.00       10 Mar 2015     rwong            Added menu button for setup pages
 * 7.00       16 Mar 2015     jmarimla         Do not trigger sorting at initial load
 * 8.00       21 Mar 2015     jmarimla         Changed layout
 * 9.00       19 May 2015     jmarimla         Add component Ids
 * 10.00      29 Jul 2015     jmarimla         Trigger update record names on initial render
 * 11.00      25 Aug 2015     jmarimla         Create title toolbar
 * 12.00      04 Sep 2015     rwong            Rename suitelet settings to Customer Debug Settings
 * 13.00      05 Nov 2015     jmarimla         Added personalize panel; added dummy portlet
 * 14.00      26 Aug 2016     rwong            ScheduledScriptUsage portlet
 * 15.00      13 Sep 2016     rwong            Updated scheduled script usage portlet
 * 16.00      26 Jan 2017     jmarimla         Hidden personalize link
 * 17.00      02 Oct 2017     jmarimla         Remove sched script portlet
 * 18.00      29 Jun 2018     jmarimla         Translation readiness
 * 19.00      24 May 2019     erepollo         New portlet container
 *
 */

function APMMainPanel() {
    Ext4.define('PSGP.APM.DB.Component.MainPanel', {
        extend: 'PSGP.APM.Component.Container',
        id: 'psgp-apm-db-mainpanel',
        minWidth: 1250,
        listeners: {
            beforerender: function () {
                //Enable CompId Mode
                if (COMPID_MODE == 'T') {
                    Ext4.getCmp('psgp-apm-db-btn-suiteletsettings').show();
                }
            },
            afterrender: function () {
                Ext4.getCmp('psgp-apm-db-combo-recorddaterange').setValue(1000 * 60 * 60 * 24);
                Ext4.getCmp('psgp-apm-db-combo-recordsorting').suspendEvents();
                Ext4.getCmp('psgp-apm-db-combo-recordsorting').setValue('logsTotal');
                Ext4.getCmp('psgp-apm-db-combo-recordsorting').resumeEvents();
                var carousel = Ext4.getCmp('psgp-apm-db-records-carousel');
                PSGP.APM.DB.dataStores.recordTilesData.updateRecordNames();
                carousel.updateData();
            }
        },
        items: [
            Ext4.create('PSGP.APM.Component.PageToolbar', {
                items: [Ext4.create('PSGP.APM.Component.PageTitle', {
                        value: APMTranslation.apm.common.label.dashboard()
                    }),
                    '->',
                    Ext4.create('PSGP.APM.Component.PageToolbarButton', {
                        id: 'psgp-apm-db-btn-suiteletsettings',
                        text: APMTranslation.apm.common.label.customerdebugsettings(),
                        margin: '0 50 0 0',
                        targetMenu: 'psgp-apm-db-quicksel-compid',
                        hidden: true
                    }),
                    Ext4.create('PSGP.APM.Component.PageToolbarButton', {
                        id: 'psgp-apm-db-btn-personalize',
                        text: 'Personalize',
                        hidden: true,
                        margin: '0 50 0 0',
                        handler: function () {
                            var panel = Ext4.getCmp('psgp-apm-db-panel-personalize');
                            panel.toggleCollapse();
                        }
                    })
                ]
            }), {
                xtype: 'container',
                padding: '0 30 0 30',
                items: [
                    Ext4.create('PSGP.APM.DB.Component.PersonalizePanel', {
                        id: 'psgp-apm-db-panel-personalize'
                    })
                ]
            },
            Ext4.create('PSGP.APM.Component.EmptyPanel', {
                id: 'psgp-apm-db-portletcontainer-dummy',
                margin: '10 30 10 30',
                hidden: true,
                listeners: {
                    afterrender: function (p, eOpts) {
                        p.body.on('mouseover', function () {
                            Ext4.getCmp('psgp-apm-db-menubtn-dummy').show();
                        }, p);
                        p.body.on('mouseout', function () {
                            Ext4.getCmp('psgp-apm-db-menubtn-dummy').hide();
                        }, p);
                    }
                },
                items: [
                    Ext4.create('PSGP.APM.Component.PortletPanel', {
                        id: 'psgp-apm-db-portlet-dummy',
                        title: 'Dummy',
                        height: 100,
                        tools: [
                            Ext4.create('PSGP.APM.Component.PortletMenuButton', {
                                id: 'psgp-apm-db-menubtn-dummy',
                                hidden: true,
                                menu: Ext4.create('PSGP.APM.DB.Component.PortletMenu.Dummy', {
                                    id: 'psgp-apm-db-menu-dummy',
                                    listeners: {
                                        mouseover: function () {
                                            Ext4.getCmp('psgp-apm-db-menubtn-dummy').show();
                                        }
                                    }
                                })
                            })
                        ],
                    })
                ]
            }),
            Ext4.create('PSGP.APM.Component.PortletContainer', {
                margin: '10 30 10 30',
                id: 'psgp-apm-db-portletcontainer-recordpages',
                listeners: {
                    afterrender: function (p, eOpts) {
                        p.body.on('mouseover', function () {
                            Ext4.getCmp('psgp-apm-db-refreshbtn-recordpages').show();
                            Ext4.getCmp('psgp-apm-db-menubtn-recordpages').show();
                        }, p);
                        p.body.on('mouseout', function () {
                            Ext4.getCmp('psgp-apm-db-refreshbtn-recordpages').hide();
                            Ext4.getCmp('psgp-apm-db-menubtn-recordpages').hide();
                        }, p);
                    }
                },
                items: [
                    Ext4.create('PSGP.APM.Component.PortletPanel', {
                        id: 'psgp-apm-db-portlet-recordpages',
                        title: APMTranslation.apm.db.label.recordpages(),
                        tools: [
                            Ext4.create('PSGP.APM.Component.PortletRefreshButton', {
                                id: 'psgp-apm-db-refreshbtn-recordpages',
                                hidden: true,
                                handler: function () {
                                    PSGP.APM.DB.dataStores.refreshRecordTileCharts();
                                }
                            }),
                            Ext4.create('PSGP.APM.Component.PortletMenuButton', {
                                id: 'psgp-apm-db-menubtn-recordpages',
                                hidden: true,
                                menu: Ext4.create('PSGP.APM.DB.Component.PortletMenu.RecordPages', {
                                    id: 'psgp-apm-db-menu-recordpages',
                                    listeners: {
                                        mouseover: function () {
                                            Ext4.getCmp('psgp-apm-db-menubtn-recordpages').show();
                                        }
                                    }
                                })
                            })
                        ],
                        dockedItems: Ext4.create('PSGP.APM.DB.Component.RecordsToolbar', {
                            height: 36,
                            items: [
                                Ext4.create('PSGP.APM.DB.Component.ComboBox.RecordDateRange', {
                                    id: 'psgp-apm-db-combo-recorddaterange',
                                    margin: '0 10 0 10'
                                }),
                                Ext4.create('PSGP.APM.DB.Component.RefreshDateField', {
                                    id: 'psgp-apm-db-display-refreshdate',
                                    margin: '0 10 0 0'
                                }),
                                '->',
                                Ext4.create('Ext4.form.field.Display', {
                                    value: APMTranslation.apm.common.label.sorting().toUpperCase(),
                                    margin: '0 0 0 10',
                                    fieldCls: 'apm-display-toolbar-field'
                                }),
                                Ext4.create('PSGP.APM.DB.Component.ComboBox.RecordSorting', {
                                    id: 'psgp-apm-db-combo-recordsorting',
                                    margin: '0 10 0 10'
                                }),
                                Ext4.create('PSGP.APM.DB.Component.RecordsTotalField', {
                                    id: 'psgp-apm-db-display-recordstotal'
                                })
                            ]
                        }),
                        items: [{
                            xtype: 'container',
                            border: false,
                            layout: 'hbox',
                            defaults: {
                                height: 230
                            },
                            items: [{
                                xtype: 'container',
                                width: 50,
                                layout: {
                                    type: 'vbox',
                                    align: 'center',
                                    pack: 'center'
                                },
                                items: [
                                    Ext4.create('PSGP.APM.DB.Component.CarouselPrevBtn', {
                                        id: 'psgp-apm-db-btn-carouselprev',
                                        width: 40,
                                        height: 171
                                    })
                                ]
                            }, {
                                xtype: 'container',
                                border: false,
                                flex: 1,
                                layout: 'fit',
                                items: [{
                                    xtype: 'panel',
                                    border: false,
                                    items: [
                                        Ext4.create('PSGP.APM.DB.Component.Carousel', {
                                            id: 'psgp-apm-db-records-carousel',
                                            items: [
                                                Ext4.create('PSGP.APM.DB.Component.CarouselPage', {
                                                    items: [
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                    ]
                                                }),
                                                Ext4.create('PSGP.APM.DB.Component.CarouselPage', {
                                                    items: [
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                    ]
                                                }),
                                                Ext4.create('PSGP.APM.DB.Component.CarouselPage', {
                                                    items: [
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                    ]
                                                }),
                                                Ext4.create('PSGP.APM.DB.Component.CarouselPage', {
                                                    items: [
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                        Ext4.create('PSGP.APM.DB.Component.RecordTile', {}),
                                                    ]
                                                }),
                                            ]
                                        })
                                    ]
                                }]
                            }, {
                                xtype: 'container',
                                width: 50,
                                layout: {
                                    type: 'vbox',
                                    align: 'center',
                                    pack: 'center'
                                },
                                items: [
                                    Ext4.create('PSGP.APM.DB.Component.CarouselNextBtn', {
                                        id: 'psgp-apm-db-btn-carouselnext',
                                        width: 40,
                                        height: 171
                                    })
                                ]
                            }]
                        }, {
                            xtype: 'container',
                            id: 'psgp-apm-db-subpanel-recordcharts',
                            cls: 'apm-db-subpanel-recordcharts',
                            border: false,
                            hidden: true,
                            padding: '0 50 20 50',
                            items: [{
                                xtype: 'container',
                                height: 30,
                                width: '100%',
                                padding: '0 10 0 10',
                                margin: '10 10 10 10',
                                layout: {
                                    type: 'hbox',
                                    align: 'bottom'
                                },
                                items: [{
                                    xtype: 'displayfield',
                                    id: 'psgp-apm-db-recordcharts-title',
                                    value: '',
                                    margin: '0 3 0 3',
                                    fieldCls: 'apm-db-display-recordtiletitle',
                                    fieldBodyCls: 'apm-db-display-recordtiletitle-body'
                                }, {
                                    xtype: 'displayfield',
                                    id: 'psgp-apm-db-recordcharts-title-oper',
                                    value: '',
                                    margin: '0 3 0 3',
                                    fieldCls: 'apm-db-display-recordtiletitle-oper',
                                    fieldBodyCls: 'apm-db-display-recordtiletitle-oper-body'
                                }]
                            }, {
                                xtype: 'container',
                                layout: 'hbox',
                                margin: '10 0 0 0',
                                items: [{
                                    xtype: 'container',
                                    cls: 'apm-db-recordchart',
                                    id: 'psgp-apm-db-recordchart-responsetime',
                                    margin: '0 5 0 0',
                                    height: 300,
                                    flex: 1
                                }, {
                                    xtype: 'container',
                                    id: 'psgp-apm-db-recordchart-throughput',
                                    cls: 'apm-db-recordchart',
                                    margin: '0 0 0 5',
                                    height: 300,
                                    flex: 1
                                }]
                            }, {
                                xtype: 'container',
                                layout: 'hbox',
                                margin: '10 0 10 0',
                                items: [{
                                    xtype: 'container',
                                    cls: 'apm-db-recordchart',
                                    id: 'psgp-apm-db-recordchart-uewfbreakdown',
                                    margin: '0 5 0 0',
                                    height: 300,
                                    flex: 1
                                }, {
                                    xtype: 'container',
                                    cls: 'apm-db-recordchart',
                                    id: 'psgp-apm-db-recordchart-histogram',
                                    margin: '0 0 0 5',
                                    height: 300,
                                    flex: 1
                                }]
                            }]
                        }]
                    })
                ]
            })
        ]
    });
}