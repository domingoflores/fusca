/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Sep 2014     jmarimla         Initial
 * 2.00       24 Sep 2014     jmarimla         Added filters and grid panels
 * 3.00       03 Oct 2014     jmarimla         Added summary panel in performance logs
 * 4.00       09 Oct 2014     jmarimla         Added portlet menu button, show on hover of panel
 * 5.00       09 Oct 2014     rwong            Added suitescript detail chart
 * 6.00       10 Oct 2014     jmarimla         Set summary fields before render
 * 7.00       16 Oct 2014     rwong            Added parameter to handle
 * 8.00       21 Oct 2014     jmarimla         Set height for suitescript grid
 * 9.00       23 Oct 2014     jmarimla         Added rows for summary fields
 * 10.00      05 Nov 2014     rwong            Move the SuiteScript Detail Panel to the right
 *                                             Added field for No data found.
 *                                             Implemented minimum width to whole panel.
 * 11.00      11 Nov 2014     rwong            Added warning icon to No data available message.
 * 12.00      13 Nov 2014     rwong            Updated margins of suitescript detail grid panel.
 * 13.00      17 Nov 2014     jmarimla         Changed SuiteScript Detail from extjs panel to SPM subpanel class
 * 14.00      19 Nov 2014     jmarimla         Changed layout of summary panel
 * 15.00      21 Nov 2014     jmarimla         Added call to filter summary grid on load;
 * 16.00      27 Nov 2014     rwong            Execution Time is hidden by default.
 * 17.00      09 Feb 2015     jmarimla         Removed extjs chart
 ****************************************************************************************************************
 * 1.00       23 Feb 2014     jmarimla         Porting to APM
 * 2.00       21 Mar 2015     jmarimla         Set default recordtype
 * 3.00       27 Mar 2015     jmarimla         Added response time filter
 * 4.00       08 Apr 2015     rwong            Change title from Suitescript Performance to Server Time Breakdown
 *                                             Change title from Suitescript Details to Details
 *                                             Added Record Type field to Summary
 * 5.00       19 May 2015     jmarimla         Add component ids
 * 6.00       25 Jun 2015     jmarimla         Added role combo box; Fixed spacing in filters
 * 7.00       03 Jul 2015     rwong            Added role field in the summary page.
 * 8.00       05 Aug 2015     rwong            Remove role combobox and role field
 * 9.00       06 Aug 2015     rwong            Set filter panel to be collapsed on load
 * 10.00      25 Aug 2015     jmarimla         Create title toolbar
 * 11.00      04 Sep 2015     rwong            Rename suitelet settings to Customer Debug Settings
 * 12.00      01 Jun 2016     jmarimla         Relayout filter fields to fix border issue
 * 13.00      09 May 2018     jmarimla         Rename portlet
 * 14.00      29 Jun 2018     jmarimla         Translation readiness
 * 15.00      16 Jul 2018     jmarimla         Set translated time
 * 16.00      24 May 2019     erepollo         New portlet container
 * 17.00      01 Aug 2019     erepollo         Collapsible end to end time grid
 * 18.00      01 Aug 2019     erepollo         Adjusted summary subpanel
 * 19.00      14 Aug 2019     jmarimla         Filters expand/collapse
 *
 */

function APMMainPanel() {
	Ext4.define('PSGP.APM.SPM.Component.MainPanel', {
	    extend: 'PSGP.APM.Component.Container',
	    id: 'psgp-apm-spm-mainpanel',
	    params : {
	        rectype: '',
	        oper : '',
	        email: '',
	        sdatetime: '',
	        edatetime: ''
	    },
	    minWidth: 1024,
	    listeners: {
	        beforerender: function () {
	            var params = this.params;

	            //Enable CompId Mode
	            if (COMPID_MODE == 'T') {
	                Ext4.getCmp('psgp-apm-spm-btn-suiteletsettings').show();
	            }

	            if(params.fparam == true) {
	                //set filter fields from parameters
	                Ext4.getCmp('psgp-apm-spm-filters-recordtype').setValue(params.rectype);
	                Ext4.getCmp('psgp-apm-spm-filters-operation').setValue(params.oper);
	                Ext4.getCmp('psgp-apm-spm-filters-date-startdate').setValue(params.sdate);
	                Ext4.getCmp('psgp-apm-spm-filters-date-enddate').setValue(params.edate);
	                Ext4.getCmp('psgp-apm-spm-filters-time-starttime').setValue(Ext4.Date.parse(params.stime, 'H:i'));
	                Ext4.getCmp('psgp-apm-spm-filters-time-endtime').setValue(Ext4.Date.parse(params.etime, 'H:i'));
	                Ext4.getCmp('psgp-apm-spm-filters-responsetimeoperator').setValue(params.responsetimeoper);
	                Ext4.getCmp('psgp-apm-spm-filters-responsetime-1').setValue(params.responsetime1);
	                Ext4.getCmp('psgp-apm-spm-filters-responsetime-2').setValue(params.responsetime2);
	            } else {
	                //initialize filter fields
	                var firstRecord = PSGP.APM.SPM.dataStores.recordTypeComboBox.getAt(0);
	                Ext4.getCmp('psgp-apm-spm-filters-recordtype').setValue(firstRecord.get('id'));
	                Ext4.getCmp('psgp-apm-spm-filters-operation').setValue('v');
	                var today = new Date();
	                var tomorrow = new Date(today.getTime() + 24*60*60*1000);
	                Ext4.getCmp('psgp-apm-spm-filters-date-startdate').setValue(today);
	                Ext4.getCmp('psgp-apm-spm-filters-date-enddate').setValue(tomorrow);
	                Ext4.getCmp('psgp-apm-spm-filters-time-starttime').setValue(Ext4.Date.parse('00:00', 'H:i'));
	                Ext4.getCmp('psgp-apm-spm-filters-time-endtime').setValue(Ext4.Date.parse('00:00', 'H:i'));
	            }

	            //initialize summary fields
	            PSGP.APM.SPM.dataStores.updateSummaryFields();
	            PSGP.APM.SPM.dataStores.filterSummaryGrid();
	        },
            afterrender: function () {
                var params = this.params;
                if(!params.fparam) {
                    Ext4.getCmp('psgp-apm-spm-panel-filters').expand();
                }
            }
	    },
	    items: [
	            Ext4.create('PSGP.APM.Component.PageToolbar', {
	                items: [
	                     Ext4.create('PSGP.APM.Component.PageTitle', {
	                         value: APMTranslation.apm.pts.label.pagetimesummary()
	                     }),
	                     '->',
	                     Ext4.create('PSGP.APM.Component.PageToolbarButton', {
	                         id: 'psgp-apm-spm-btn-suiteletsettings',
	                         text: APMTranslation.apm.common.label.customerdebugsettings(),
	                         margin: '0 50 0 0',
	                         targetMenu: 'psgp-apm-spm-quicksel-compid',
	                         hidden: true
	                     }),
	                ]
	            }),
	            Ext4.create('PSGP.APM.SPM.Component.BlueButton.Search', {
	                id: 'psgp-apm-spm-btn-search',
	                margin: '5 30 15 30'
	            }),
	            Ext4.create('PSGP.APM.Component.FiltersPanel', {
	                id: 'psgp-apm-spm-panel-filters',
	                margin: '0 30 10 30',
	                collapsed: true,
	                defaults: {
	                    height:  56
	                },
	                items: [
	                        {
	                            xtype: 'container',
	                            margin: '0 30 0 0',
	                            border: false,
	                            align: 'left',
	                            items: [
	                                    Ext4.create('PSGP.APM.Component.Display', {
	                                        fieldLabel: APMTranslation.apm.common.label.recordtype()
	                                    }),
	                                    Ext4.create('PSGP.APM.SPM.Component.ComboBox.RecordType', {
	                                        id: 'psgp-apm-spm-filters-recordtype'
	                                    })
	                                    ]
	                        },
	                        {
	                            xtype: 'container',
	                            margin: '0 30 0 0',
	                            border: false,
	                            align: 'left',
	                            items: [
	                                    Ext4.create('PSGP.APM.Component.Display', {
	                                        labelWidth: 70,
	                                        fieldLabel: APMTranslation.apm.common.label.operation()
	                                    }),
	                                    Ext4.create('PSGP.APM.SPM.Component.ComboBox.Operation', {
	                                        id: 'psgp-apm-spm-filters-operation'
	                                    })
	                                    ]
	                        },
	                        {
	                            xtype: 'container',
	                            margin: '0 30 0 0',
	                            border: false,
	                            align: 'left',
	                            items: [
	                                    Ext4.create('PSGP.APM.Component.Display', {
	                                        fieldLabel: APMTranslation.apm.common.label.email()
	                                    }),
	                                    Ext4.create('PSGP.APM.Component.TextField.Email', {
	                                        id: 'psgp-apm-spm-filters-email'
	                                    })
	                                    ]
	                        },
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
	                                                            id: 'psgp-apm-spm-filters-date-startdate',
	                                                            margin: '0 20 0 0'
	                                                        })
	                                                    ]
	                                                },
	                                                {
	                                                    xtype: 'container',
	                                                    items: [
	                                                        Ext4.create('PSGP.APM.Component.Time', {
	                                                            id: 'psgp-apm-spm-filters-time-starttime',
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
	                                                            id: 'psgp-apm-spm-filters-date-enddate',
	                                                            margin: '0 20 0 0'
	                                                        })
	                                                    ]
	                                                },
	                                                {
	                                                    xtype: 'container',
	                                                    items: [
	                                                        Ext4.create('PSGP.APM.Component.Time', {
	                                                            id: 'psgp-apm-spm-filters-time-endtime',
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
	                            margin: '0 30 0 0',
	                            border: false,
	                            align: 'left',
	                            items: [
	                                    Ext4.create('PSGP.APM.Component.Display', {
	                                        labelWidth: 125,
	                                        fieldLabel: APMTranslation.apm.pts.label.responsetimeinseconds()
	                                    }),
	                                    {
	                                        xtype: 'container',
	                                        layout: 'hbox',
	                                        items: [
	                                                {
	                                                    xtype: 'container',
	                                                    items: [
	                                                        Ext4.create('PSGP.APM.SPM.Component.ComboBox.ResponseTimeOperator', {
	                                                            id: 'psgp-apm-spm-filters-responsetimeoperator',
	                                                            margin: '0 2 0 0'
	                                                        })
	                                                    ]
	                                                },
	                                                {
	                                                    xtype: 'container',
	                                                    items: [
	                                                        Ext4.create('PSGP.APM.Component.NumberField', {
	                                                            id: 'psgp-apm-spm-filters-responsetime-1',
	                                                            hidden: true,
	                                                            margin: '0 5 0 5'
	                                                        })
	                                                    ]
	                                                },
	                                                Ext4.create('PSGP.APM.Component.Display', {
	                                                    id: 'psgp-apm-spm-filters-responsetime-and',
	                                                    hidden: true,
	                                                    fieldLabel: APMTranslation.apm.pts.label.and(),
	                                                    margin: '10 0 0 0',
	                                                    width: 25
	                                                }),
	                                                {
	                                                    xtype: 'container',
	                                                    items: [
	                                                        Ext4.create('PSGP.APM.Component.NumberField', {
	                                                            id: 'psgp-apm-spm-filters-responsetime-2',
	                                                            hidden: true,
	                                                            margin: '0 5 0 5'
	                                                        })
	                                                    ]
	                                                }
	                                                ]
	                                    }
	                                    ]
	                        }
//	                        {
//	                            xtype: 'container',
//	                            margin: '0 0 0 0',
//	                            border: false,
//	                            align: 'left',
//	                            items: [
//	                                    Ext4.create('PSGP.APM.Component.Display', {
//	                                        fieldLabel: 'Role'
//	                                    }),
//	                                    Ext4.create('PSGP.APM.SPM.Component.ComboBox.Role', {
//	                                        id: 'psgp-apm-spm-filters-role'
//	                                    })
//	                                    ]
//	                        }
	                        ]
	            }),
	            Ext4.create('PSGP.APM.Component.EmptyPanel', {
	                layout: 'column',
	                items: [
	                        Ext4.create('PSGP.APM.Component.PortletContainer', {
	                            margin: '5 5 10 30',
	                            columnWidth: .75,
	                            listeners: {
	                                afterrender: function(p, eOpts) {
	                                    p.body.on('mouseover', function() {
	                                        Ext4.getCmp('psgp-apm-spm-menubtn-performancelogs').show();
	                                    }, p);
	                                    p.body.on('mouseout', function() {
	                                        Ext4.getCmp('psgp-apm-spm-menubtn-performancelogs').hide();
	                                    }, p);
	                                }
	                            },
	                            items: [
	                                    Ext4.create('PSGP.APM.Component.PortletPanel', {
	                                        id: 'psgp-apm-spm-portlet-performancelogs',
	                                        title: APMTranslation.apm.pts.label.performancelogs(),
	                                        tools: [
	                                                Ext4.create('PSGP.APM.Component.PortletMenuButton', {
	                                                    id: 'psgp-apm-spm-menubtn-performancelogs',
	                                                    hidden: true,
	                                                    menu: Ext4.create('PSGP.APM.SPM.Component.PortletMenu.PerformanceLogs', {
	                                                        listeners: {
	                                                            mouseover: function() {
	                                                                Ext4.getCmp('psgp-apm-spm-menubtn-performancelogs').show();
	                                                            }
	                                                        }
	                                                    })
	                                                })
	                                                ],
	                                                items: [
	                                                        Ext4.create('PSGP.APM.Component.SubPanel', {
	                                                            id: 'psgp-apm-spm-subpanel-endtoendsummary',
	                                                            title: APMTranslation.apm.pts.label.summary(),
	                                                            margin: '20 20 10 20',
	                                                            layout: 'hbox',
	                                                            items: [
	                                                                   {
	                                                                       xtype: 'container',
	                                                                       border: 0,
	                                                                       style: {borderColor:'#DDDDDF', borderStyle:'solid', borderWidth:'1px'},
	                                                                       margin: '10 5 0 0',
	                                                                       autoScroll: false,
	                                                                       items: [
	                                                                               Ext4.create('PSGP.APM.Component.SummaryField', {
	                                                                                   id: 'psgp-apm-spm-display-summary-recordtype',
	                                                                                   fieldLabel: APMTranslation.apm.common.label.recordtype(),
	                                                                                   margin: '3 10 0 10'
	                                                                               }),
	                                                                               Ext4.create('PSGP.APM.Component.SummaryField', {
                                                                                       id: 'psgp-apm-spm-display-summary-operation',
                                                                                       fieldLabel: APMTranslation.apm.common.label.operation(),
                                                                                       margin: '8 10 0 10',
                                                                                   }),
	                                                                               Ext4.create('PSGP.APM.Component.SummaryField', {
	                                                                                   id: 'psgp-apm-spm-display-summary-logstotal',
	                                                                                   fieldLabel: APMTranslation.apm.common.label.numberoflogs(),
	                                                                                   margin: '8 10 0 10'
	                                                                               }),
	                                                                               Ext4.create('PSGP.APM.Component.SummaryField', {
                                                                                       id: 'psgp-apm-spm-display-summary-userstotal',
                                                                                       fieldLabel: APMTranslation.apm.common.label.users(),
                                                                                       margin: '8 10 0 10',
                                                                                   })
	                                                                               /*
	                                                                               Ext4.create('PSGP.APM.Component.SummaryField', {
	                                                                                   id: 'psgp-apm-spm-display-summary-role',
	                                                                                   fieldLabel: 'Role',
	                                                                                   margin: '10 20 10 20',
	                                                                               })*/
	                                                                               ]
	                                                                   },
	                                                                   Ext4.create('PSGP.APM.SPM.Component.Grid.SummaryStatistics', {
	                                                                       id: 'psgp-apm-spm-grid-summarystatistics',
	                                                                       flex: 1,
	                                                                       margin: '10 0 0 5'
	                                                                   })
	                                                              ]
	                                                        }),
	                                                        Ext4.create('PSGP.APM.Component.SubPanel', {
                                                                id: 'psgp-apm-spm-endtoendtime-grid-panel',
                                                                title: APMTranslation.apm.pts.label.details(),
                                                                margin: '20 20 10 20',
                                                                layout: 'fit',
                                                                items: [
                                                                    Ext4.create('PSGP.APM.SPM.Component.Grid.EndToEndTime', {
                                                                        id: 'psgp-apm-spm-grid-endtoendtime',
                                                                        margin: '10 0 20 0',
                                                                        height: 400
                                                                    })
                                                                ]
                                                            })
                                                    ]
	                                    })
	                                    ]
	                        }),
	                        Ext4.create('PSGP.APM.Component.PortletContainer', {
                                margin: '5 5 5 10',
                                columnWidth: .235,
                                items: [
            	                        Ext4.create('PSGP.APM.Component.PortletPanel', {
            	                            id: 'psgp-apm-spm-portlet-suitescriptperformance',
            	                            margin: '0 5 10 5',
            	                            title: APMTranslation.apm.pts.label.scriptworkflowtimebreakdown(),
            	                            columnWidth: .25,
            	                            height: '100%',
            	                            layout: 'vbox',
            	                            items: [
            	                                    Ext4.create('Ext4.panel.Panel', {
            	                                        id: 'psgp-apm-spm-suitescriptdetail-chart-panel',
            	                                        cls: 'apm-suitescriptdetail-chart-panel',
            	                                        bodyBorder: false,
            	                                        border : false,
            	                                        title: APMTranslation.apm.common.label.executiontime(),
            	                                        titleAlign: 'center',
            	                                        width: '100%',
            	                                        height: 400,
            	                                        minHeight: 400,
            	                                        header: {
            	                                            border: false,
            	                                            hidden: true
            	                                        },
            	                                        items: [
            	                                                Ext4.create('Ext4.container.Container', {
            	                                                    id: 'psgp-apm-spm-suitescriptdetail-chart-nodata',
            	                                                    layout: 'hbox',
            	                                                    items: [
            	                                                            Ext4.create('Ext4.panel.Panel', {
            	                                                                id: 'psgp-apm-spm-chart-nodata-icon',
            	                                                                cls: 'apm-suitescriptdetail-chart-warning',
            	                                                                height: 30,
            	                                                                width: 32,
            	                                                                border: false,
            	                                                                margin: '10 0 0 10'
            	                                                            }),
            	                                                            Ext4.create('Ext4.form.Label', {
            	                                                                id: 'psgp-apm-spm-chart-nodata-text',
            	                                                                flex: 1,
            	                                                                border: false,
            	                                                                margin: '10 0 0 10',
            	                                                                text: APMTranslation.apm.common.label.nodataavailable()
            	                                                            })
            	                                                            ]
            	                                                }),
            	                                                Ext4.create('Ext4.container.Container', {
            	                                                    id: 'psgp-apm-spm-suitescriptdetail-chart-container',
            	                                                    height: 400,
            	                                                    width: '100%',
            	                                                    border: false,
            	                                                    margin: '0 0 0 10',
            	                                                    items: []
            	                                                })
            	                                                ]
            	                                    }),
            	                                    Ext4.create('PSGP.APM.Component.SubPanel', {
            	                                        id: 'psgp-apm-spm-suitescriptdetail-grid-panel',
            	                                        title: APMTranslation.apm.pts.label.details(),
            	                                        titleAlign: 'left',
            	                                        width: '100%',
            	                                        height: 300,
            	                                        margin: '10, 10, 10, 10',
            	                                        header: {
            	                                            border: false
            	                                        },
            	                                        layout: 'fit',
            	                                        items: [
            	                                                Ext4.create('PSGP.APM.SPM.Component.Grid.SuitescriptDetail', {
            	                                                    id: 'psgp-apm-spm-grid-suitescriptdetail',
            	                                                    margin: '5, 0, 0, 0',
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