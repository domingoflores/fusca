/**
 * Copyright © 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Sep 2014     jmarimla         Initial
 * 2.00       26 Sep 2014     jmarimla         Added components for filters and grid panels
 * 3.00       01 Oct 2014     jmarimla         Added Total Time column for performance logs grid
 * 4.00       03 Oct 2014     jmarimla         Added components for performance logs summary
 * 5.00       03 Oct 2014     rwong            Change the columns of the SuitescriptDetail grid.
 * 6.00       09 Oct 2014     jmarimla         Added components for set up summary pop up window
 * 7.00       09 Oct 2014     rwong            Added suitescript chart definition
 * 8.00       10 Oct 2014     jmarimla         Enabled saving of summary set up
 * 9.00       13 Oct 2014     jmarimla         Added pagination components for performance logs grid
 * 10.00      21 Oct 2014     jmarimla         Added color set for pie chart slices
 * 11.00      23 Oct 2014     jmarimla         Set height for set up summary grid
 *                                             Modified reset button function to revert to default
 * 12.00      24 Oct 2014     jmarimla         Enable subpanel collapsible
 * 13.00      29 Oct 2014     jmarimla         Moved reusable components to spm_cs_classes
 * 14.00      04 Nov 2014     rwong            Added support for hiding of pagination controls and default empty text for grid.
 * 15.00      05 Nov 2014     rwong            Remove script deployment from results and no data available default from chart.
 * 16.00      07 Nov 2014     rwong            Implement partial reskin of pie chart to be similar to NS pie chart, update color setting.
 * 17.00      11 Nov 2014     rwong            Updated css of tooltips
 * 18.00      13 Nov 2014     rwong            Rename Search to Refresh; turn off legends in chart; defined minwidth for the columns
 * 19.00      19 Nov 2014     jmarimla         Added summary grid
 * 20.00      21 Nov 2014     jmarimla         Enable set up summary window
 * 21.00      26 Nov 2014     rwong            Added support for color display in suitescript detail grid panel.
 * 22.00      03 Dec 2014     rwong            Updated aggregate column labels and made them unsortable
 * 23.00      04 Dec 2014     rwong            Remove time in endtoendtime grid column labels
 ****************************************************************************************************************
 * 1.00       23 Feb 2015     jmarimla         Porting to APM
 * 2.00       03 Mar 2015     jmarimla         90th to 95th percentile
 * 3.00       21 Mar 2015     jmarimla         Edited parameter to recordtype
 * 4.00       22 Mar 2015     jyeh             Action details column
 * 5.00       23 Mar 2015     jyeh             Pass email and date to PTD
 * 6.00       27 Mar 2015     jmarimla         Response time filter components
 * 7.00       01 Apr 2015     rwong            Added workflow time
 * 8.00       09 Apr 2015     jyeh
 * 9.00       29 Apr 2015     jmarimla         Auto trigger first row of grid
 * 10.00      19 Jun 2015     rwong            Added link from Page Time Summary to SSA.
 * 11.00      25 Jun 2015     jmarimla         Added role combo box component
 * 12.00      01 Jul 2015     jmarimla         Updated loading masks
 * 13.00      03 Jul 2015     rwong            Added role in endtoendtime grid.
 * 14.00      05 Aug 2015     rwong            Remove role in endtoendtime grid.
 * 15.00      06 Aug 2015     rwong            Added url class to suitescriptdetail links
 * 16.00      25 Aug 2015     jmarimla         Comp id dropdown components
 * 17.00      28 Aug 2015     rwong            Added functionality to handle customer debugging
 * 18.00      12 Oct 2015     jmarimla         Date range validation
 * 19.00      01 Dec 2015     jmarimla         Added csv export button
 * 20.00      21 Dec 2015     rwong            Adjust the spacing of the export button
 * 21.00      29 Jun 2018     jmarimla         Translation readiness
 * 22.00      20 Sep 2018     jmarimla         FRHT Column
 * 23.00      18 Oct 2018     jmarimla         Redirect to profiler
 * 24.00      26 Oct 2018     jmarimla         Frht label
 * 25.00      28 Jun 2019     erepollo         Translation for new texts
 * 26.00      30 Jul 2019     rwong            Added workflowtime in ajax call
 * 27.00      11 Oct 2019     jmarimla         Search by operationid
 *
 */

function APMComponents() {
    Ext4.define('PSGP.APM.SPM.Component.BlueButton.Search', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.common.button.refresh(),
        handler: function() {
            //check dates validity
            if (!Ext4.getCmp('psgp-apm-spm-filters-date-startdate').isValid()) {
                alert(APMTranslation.apm.common.alert.entervalidstartdate());
                return false;
            }
            if (!Ext4.getCmp('psgp-apm-spm-filters-date-enddate').isValid()) {
                alert(APMTranslation.apm.common.alert.entervalidenddate());
                return false;
            }

            var startdate = Ext4.getCmp('psgp-apm-spm-filters-date-startdate').getValue();
            var starttime = Ext4.getCmp('psgp-apm-spm-filters-time-starttime').getValue();
            var enddate = Ext4.getCmp('psgp-apm-spm-filters-date-enddate').getValue();
            var endtime = Ext4.getCmp('psgp-apm-spm-filters-time-endtime').getValue();
            var responseTimeOper = Ext4.getCmp('psgp-apm-spm-filters-responsetimeoperator').getValue();
            var responseTime1 = Ext4.getCmp('psgp-apm-spm-filters-responsetime-1').getValue();
            var responseTime2 = Ext4.getCmp('psgp-apm-spm-filters-responsetime-2').getValue();
            var startDateObj = new Date(startdate.getFullYear(), startdate.getMonth(), startdate.getDate(), starttime.getHours(), starttime.getMinutes(), 0, 0);
            var endDateObj = new Date(enddate.getFullYear(), enddate.getMonth(), enddate.getDate(), endtime.getHours(), endtime.getMinutes(), 0, 0);

            if(startDateObj > endDateObj) {
                alert(APMTranslation.apm.common.alert.startdateearlierthanenddate());
                return false;
            }
            if(endDateObj.getTime() - startDateObj.getTime() > 1000*60*60*24*30) {
                alert(APMTranslation.apm.common.alert.daterange._30days());
                return false;
            }

            //response time checks
            if (responseTimeOper != null) {
                var invalidResponseTime = false;
                switch (responseTimeOper) {
                case 'bw':
                    if (!Ext4.getCmp('psgp-apm-spm-filters-responsetime-1').isValid()) invalidResponseTime = true;
                    if (!Ext4.getCmp('psgp-apm-spm-filters-responsetime-2').isValid()) invalidResponseTime = true;
                    if (!responseTime1) invalidResponseTime = true;
                    if (!responseTime2) invalidResponseTime = true;
                    if (responseTime1 > responseTime2) invalidResponseTime = true;
                    break;
                case 'gt':
                case 'lt':
                    if (!Ext4.getCmp('psgp-apm-spm-filters-responsetime-1').isValid()) invalidResponseTime = true;
                    if (!responseTime1) invalidResponseTime = true;
                    break;
                }
                if (invalidResponseTime) {
                    alert(APMTranslation.apm.db.alert.entervalidresponsetime());
                    return false;
                }
            }

            var recordtype = Ext4.getCmp('psgp-apm-spm-filters-recordtype').getValue();
            var oper = Ext4.getCmp('psgp-apm-spm-filters-operation').getValue();
            var email = Ext4.getCmp('psgp-apm-spm-filters-email').getValue();

            PSGP.APM.SPM.dataStores.endToEndTimeParams = {
                    recordtype : recordtype
                    , oper : oper
                    , email : email
                    , startDate : startDateObj
                    , endDate : endDateObj
                    , responseTimeOper : responseTimeOper
                    , responseTime1 : responseTime1
                    , responseTime2 : responseTime2
            };
            PSGP.APM.SPM.dataStores.endToEndTimeData.isSearched = true;
            PSGP.APM.SPM.dataStores.endToEndTimeData.loadPage(1);
            PSGP.APM.SPM.dataStores.callEndToEndSummaryRESTlet();
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.ComboBox.Operation', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.SPM.dataStores.operationComboBox,
        width: 78
    });

    Ext4.define('PSGP.APM.SPM.Component.ComboBox.RecordType', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.SPM.dataStores.recordTypeComboBox,
        width: 158
    });

    Ext4.define('PSGP.APM.SPM.Component.ComboBox.ResponseTimeOperator', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.SPM.dataStores.responseTimeComboBox,
        allowBlank: true,
        width: 115,
        listeners: {
            afterrender: function (comp) {
                var responseTime1 = Ext4.getCmp('psgp-apm-spm-filters-responsetime-1');
                var responseTime2 = Ext4.getCmp('psgp-apm-spm-filters-responsetime-2');
                var responseTimeAnd = Ext4.getCmp('psgp-apm-spm-filters-responsetime-and');

                switch (comp.getValue()) {
                case 'bw':
                    responseTime2.show();
                    responseTimeAnd.show();
                case 'gt':
                case 'lt':
                    responseTime1.show();
                    break;
                }
            },
            select: function (comp) {
                var responseTime1 = Ext4.getCmp('psgp-apm-spm-filters-responsetime-1');
                var responseTime2 = Ext4.getCmp('psgp-apm-spm-filters-responsetime-2');
                var responseTimeAnd = Ext4.getCmp('psgp-apm-spm-filters-responsetime-and');

                if (comp.getValue() == 0 || comp.getValue() == "&nbsp;") {
                    comp.setValue(null);
                    responseTime1.hide();
                    responseTime2.hide();
                    responseTimeAnd.hide();
                    responseTime1.setValue(null);
                    responseTime2.setValue(null);
                } else if (comp.getValue() == 'bw') {
                    responseTime1.show();
                    responseTime2.show();
                    responseTimeAnd.show();
                } else if ((comp.getValue() == 'gt') || (comp.getValue() == 'lt')) {
                    responseTime1.show();
                    responseTime2.hide();
                    responseTimeAnd.hide();
                    responseTime2.setValue(null);
                }
            }
        }
    });

//    Ext4.define('PSGP.APM.SPM.Component.ComboBox.Role', {
//      extend: 'PSGP.APM.Component.ComboBox',
//      store: PSGP.APM.SPM.dataStores.roleComboBox,
//      allowBlank: true,
//      width: 160,
//      listeners: {
//          select: function (comp) {
//              if (comp.getValue() == 0 || comp.getValue() == "&nbsp;") {
//                  comp.setValue(null);
//              }
//          }
//      }
//    });

    Ext4.define('PSGP.APM.SPM.Component.Grid.EndToEndTime', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.SPM.dataStores.endToEndTimeData,
        viewConfig: {
            deferEmptyText: false,
            emptyText: APMTranslation.apm.common.label.norecordstoshow(),
            loadMask: MASK_CONFIG,
            listeners: {
                refresh: function () {
                    var grid = Ext4.getCmp('psgp-apm-spm-grid-endtoendtime');
                    var rec = PSGP.APM.SPM.dataStores.endToEndTimeData.getAt(0);
                    if (rec) grid.getView().fireEvent('itemclick', grid, rec, null, 0);
                }
            }
        },
        dockedItems: Ext4.create('PSGP.APM.Component.GridToolbar', {
            height: 36,
            items: [
                Ext4.create('PSGP.APM.Component.ExportCSVButton', {
                    id: 'psgp-apm-spm-btn-exportcsv-endtoendtimepaging',
                    margin: '0 0 0 10',
                    handler: function () {
                        var dataParams = PSGP.APM.SPM.dataStores.endToEndTimeParams;
                        var urlRequest = '/app/site/hosting/scriptlet.nl?script=customscript_apm_spm_sl_etetime&deploy=customdeploy_apm_spm_sl_etetime&testmode='+TEST_MODE
                                        +'&getcsv=T' + '&' + Ext4.urlEncode(dataParams);
                        //window.open(urlRequest);
                        window.location.href = urlRequest;
                    }
                }),
                '->',
                Ext4.create('PSGP.APM.Component.ComboBox.PagingDropDown', {
                    id: 'psgp-apm-spm-combobox-endtoendtimepaging',
                    store: PSGP.APM.SPM.dataStores.endToEndTimePaging,
                    hidden: true,
                    listeners : {
                        select: function (combo, records, eOpts) {
                            var selectedPage = combo.getValue();
                            PSGP.APM.SPM.dataStores.endToEndTimeData.loadPage(selectedPage);
                        },
                        afterrender: function (combo) {
                            combo.setValue(1);
                            combo.el.on('mouseover', function () {
                                combo.expand();
                            }, combo);
                        },
                        expand: function (combo) {
                            combo.getPicker().el.monitorMouseLeave(500, combo.collapse, combo);
                        }
                    }
                }),
                Ext4.create('PSGP.APM.Component.PagingToolbar', {
                    id: 'psgp-apm-spm-pagingtb-endtoendtime',
                    store: PSGP.APM.SPM.dataStores.endToEndTimeData,
                    hidden: true
                }),
                Ext4.create('PSGP.APM.Component.TotalPagesField', {
                    id: 'psgp-apm-spm-totalpages-endtoendtime'
                })
            ]
        }),
        columns: {
            defaults : {
                hideable : false,
                draggable : false,
                menuDisabled : true,
                height: 28,
                flex: 1
            },
            items : [
                     {
                         text : APMTranslation.apm.common.label.datetime(),
                         dataIndex : 'date'
                     },
                     {
                         text : APMTranslation.apm.common.label.email(),
                         dataIndex : 'email'
                     },
//                   {
//                       text : 'Role',
//                       dataIndex : 'role',
//                       sortable: false
//                   },
                     {
                         text : APMTranslation.apm.common.label.client(),
                         dataIndex : 'clienttime'
                     },
                     {
                         text : APMTranslation.apm.common.label.network(),
                         dataIndex : 'networktime'
                     },
                     {
                         text : APMTranslation.apm.ns.context.suitescript(),
                         dataIndex : 'suitescripttime'
                     },
                     {
                         text : APMTranslation.apm.ns.context.workflow(),
                         dataIndex : 'workflowtime'
                     },
                     {
                         text : APMTranslation.apm.common.label.server(),
                         dataIndex : 'servertime'
                     },
                     {
                         text : APMTranslation.apm.common.label.total(),
                         dataIndex : 'totaltime'
                     },
                     Ext4.create('PSGP.APM.Component.ColumnAction.Details',
                     {
                         text: APMTranslation.apm.ptd.label.pagetimedetails(),
                         items: [
                             {
                                 handler: function(grid, rowIndex, colIndex) {
                                     var rec = grid.getStore().getAt(rowIndex);
                                     var operationId = rec.get('operationId');
                                     var operationId2 = (rec.get('operationId2')) ? '|' + rec.get('operationId2') : '';
                                     var dataParams = {
                                             compfil : ((COMPID_MODE == 'T') && (COMP_FIL)) ? COMP_FIL : '',
                                             operationId: operationId + operationId2
                                     };

                                     var paramString = Ext4.urlEncode(dataParams);
                                     var PRF_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_sia_sl_main&deploy=customdeploy_apm_sia_sl_main';
                                     window.open(PRF_URL + '&' + paramString);
                                 },
                                 scope: this,
                                 getClass: function(value,meta,record,rowIx,colIx, store) {
                                     return 'x-hide-display';  //Hide the action icon
                                 }
                             }
                            ]}
                     ),
                     Ext4.create('PSGP.APM.Component.ColumnAction.Details',
                             {
                                 text: APMTranslation.apm.r2019a.profilerdetails(),
                                 items: [
                                     {
                                        handler: function(grid, rowIndex, colIndex) {
                                             var rec = grid.getStore().getAt(rowIndex);
                                             var operationId = rec.get('operationId');
                                             var operationId2 = (rec.get('operationId2')) ? '|' + rec.get('operationId2') : '';
                                             var dataParams = {
                                                     compfil : ((COMPID_MODE == 'T') && (COMP_FIL)) ? COMP_FIL : '',
                                                     operationId: operationId + operationId2,
                                                     frhtId: ''
                                             };

                                             var paramString = Ext4.urlEncode(dataParams);
                                             var PRF_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_prf_sl_main&deploy=customdeploy_apm_prf_sl_main';
                                             window.open(PRF_URL + '&' + paramString);

                                         },
                                         scope: this,
                                         getClass: function(value,meta,record,rowIx,colIx, store) {
                                             return 'x-hide-display';  //Hide the action icon
                                         }
                                     }
                                 ]
                             }
                         )
                     ]
        },
        listeners : {
            itemclick : function (grid, record) {
                PSGP.APM.SPM.dataStores.suitescriptDetailParams = {
                        threadid : record.getId(),
                        threadid2 : record.get('id2'),
                        servertime: record.get('servertime'),
                        suitescripttime: record.get('suitescripttime'),
                        workflowtime: record.get('workflowtime'),
                        startdate: PSGP.APM.SPM.dataStores.endToEndTimeParams.startDate,
                        enddate: PSGP.APM.SPM.dataStores.endToEndTimeParams.endDate
                };
                PSGP.APM.SPM.dataStores.suitescriptDetailData.loadPage(1);
            },
            itemmouseenter: function (view, record, item, index, e, opts)
            {
                var rowcmp = Ext4.select('#' + Ext4.get(item).id + '  img.x4-action-col-icon');
                rowcmp.addCls('apm-column-action-details');
                rowcmp.removeCls('x-hide-display');
            },
            itemmouseleave: function (view, record, item, index, e, opts)
            {
                var rowcmp = Ext4.select('#' + Ext4.get(item).id + '  img.x4-action-col-icon');
                rowcmp.removeCls('apm-column-action-details');
                rowcmp.addCls('x-hide-display');
            }
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.Grid.SummaryStatistics', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.SPM.dataStores.summaryAggregationGrid,
        disableSelection: true,
        forceFit: true,
        columns: {
            defaults : {
                hideable : false,
                draggable : false,
                menuDisabled : true,
                sortable: false,
                height: 28
            },
            items : [
                     {
                         text : APMTranslation.apm.pts.label.aggregation(),
                         dataIndex : 'name'
                     },
                     {
                         text : APMTranslation.apm.common.label.client(),
                         dataIndex : 'clienttime'
                     },
                     {
                         text : APMTranslation.apm.common.label.network(),
                         dataIndex : 'networktime'
                     },
                     {
                         text : APMTranslation.apm.ns.context.suitescript(),
                         dataIndex : 'suitescripttime'
                     },
                     {
                         text : APMTranslation.apm.ns.context.workflow(),
                         dataIndex : 'workflowtime'
                     },
                     {
                         text : APMTranslation.apm.common.label.server(),
                         dataIndex : 'servertime'
                     },
                     {
                         text : APMTranslation.apm.common.label.total(),
                         dataIndex : 'totaltime'
                     }
                    ]
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.Grid.SuitescriptDetail', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.SPM.dataStores.suitescriptDetailData,
        disableSelection: true,
        viewConfig: {
            deferEmptyText: false,
            emptyText: APMTranslation.apm.common.label.norecordstoshow(),
            loadMask: MASK_CONFIG
        },
        columns: {
            defaults : {
                hideable : false,
                draggable : false,
                menuDisabled : true,
                height: 28,
                flex: 1
            },
            items : [
                     {
                         text : APMTranslation.apm.common.label.name(),
                         dataIndex : 'script',
                         minWidth: 120,
                         xtype: 'templatecolumn',
                         tpl: Ext4.create('Ext4.XTemplate',
                                 '<table>',
                                    '<tr>',
                                        '<td bgcolor = "{color}" width = "15px" style = "min-width: 15px">',
                                        '</td>',
                                        '<tpl if="script == &quot;NetSuite System&quot;">',
                                            '<td>',
                                                '{script}',
                                            '</td>',
                                        '<tpl elseif="scriptwfurl == &quot;&quot;">',
                                            '<td>',
                                                '{script}',
                                            '</td>',
                                        '<tpl else>',
                                            '<td>',
                                                '<a href = "{scriptwfurl}" target="_blank" class="apm-a">{script}</a>',
                                            '</td>',
                                        '</tpl>',
                                    '</tr>',
                                 '</table>'
                         )
                     },
                     {
                         text : APMTranslation.apm.common.label.responsetime(),
                         dataIndex : 'totaltime',
                         minWidth: 90
                     },
                     {
                         text : APMTranslation.apm.pts.label.bundle(),
                         dataIndex : 'bundle',
                         minWidth: 120
                     }
                     ]
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.PortletMenu.PerformanceLogs', {
        extend: 'PSGP.APM.Component.PortletMenu',
        items: [
                {
                    text: APMTranslation.apm.common.label.setup(),
                    handler: function() {
                        Ext4.getCmp('psgp-apm-spm-window-setupsummary').show();
                    }
                }
                ]
    });

    Ext4.define('PSGP.APM.SPM.Component.BlueButton.SetUpSummarySave', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.common.label.save(),
        handler: function() {
            Ext4.getCmp('psgp-apm-spm-window-setupsummary').hide();
            Ext4.getCmp('psgp-apm-spm-subpanel-endtoendsummary').setLoading(MASK_CONFIG);
            var params = new Object();
            var summaryStore = PSGP.APM.SPM.dataStores.setUpSummaryData;
            summaryStore.each(function (record) {
               params[record.getId()] = (record.get('show')) ? 'T' : 'F';
            });
            PSGP.APM.SPM.dataStores.saveSetUpSummary(params);
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.GrayButton.SetUpSummaryCancel', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            PSGP.APM.SPM.dataStores.setUpSummaryData.rejectChanges();
            Ext4.getCmp('psgp-apm-spm-window-setupsummary').hide();
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.GrayButton.SetUpSummaryReset', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.reset(),
        handler: function() {
            var summaryStore = PSGP.APM.SPM.dataStores.setUpSummaryData;
            var defaultShow = [
                               'setup_ave', 'setup_med', 'setup_sd', 'setup_95p'
                           ];
            summaryStore.each(function(record) {
                if (Ext4.Array.indexOf(defaultShow, record.getId()) == -1) {
                    record.set('show', false);
                } else {
                    record.set('show', true);
                }
            });
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.Grid.SetUpSummary', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.SPM.dataStores.setUpSummaryData,
        disableSelection: true,
        height: 220,
        forceFit: true,
        viewConfig: {
            markDirty: false
        },
        columns: {
            defaults: {
                hideable: false,
                draggable: false,
                menuDisabled: true,
                sortable: false,
                height: 28
            },
            items : [
                     {
                         text : APMTranslation.apm.pts.label.columnname(),
                         dataIndex : 'name',
                         flex: 25
                     },
                     {
                         text : APMTranslation.apm.pts.label.description(),
                         dataIndex : 'description',
                         flex: 60
                     },
                     {
                         xtype: 'checkcolumn',
                         text : APMTranslation.apm.pts.label.show(),
                         dataIndex : 'show',
                         flex: 15
                     }
                     ]
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.Window.SetUpSummary', {
        extend: 'PSGP.APM.Component.Window',
        title: APMTranslation.apm.pts.label.setupsummary(),
        width: 800,
        bodyPadding: 17,
        listeners: {
            beforeshow : function () {
                PSGP.APM.SPM.dataStores.setUpSummaryData.rejectChanges();
            }
        },
        items: [
                {
                    xtype: 'container',
                    border: false,
                    items: [
                            Ext4.create('PSGP.APM.SPM.Component.BlueButton.SetUpSummarySave', {
                                id: 'psgp-apm-spm-btn-setupsummary-save-top',
                                margin: '8 7 25 3'
                            }),
                            Ext4.create('PSGP.APM.SPM.Component.GrayButton.SetUpSummaryCancel', {
                                id: 'psgp-apm-spm-btn-setupsummary-cancel-top',
                                margin: '8 7 25 7'
                            }),
                            Ext4.create('PSGP.APM.SPM.Component.GrayButton.SetUpSummaryReset', {
                                id: 'psgp-apm-spm-btn-setupsummary-reset-top',
                                margin: '8 7 25 7'
                            })
                            ]
                },
                Ext4.create('PSGP.APM.SPM.Component.Grid.SetUpSummary', {
                    id: 'psgp-apm-spm-grid-setupsummary',
                    margin: '0 3 22 3'
                }),
                {
                    xtype: 'container',
                    border: false,
                    items: [
                            Ext4.create('PSGP.APM.SPM.Component.BlueButton.SetUpSummarySave', {
                                id: 'psgp-apm-spm-btn-setupsummary-save-bottom',
                                margin: '3 7 8 3'
                            }),
                            Ext4.create('PSGP.APM.SPM.Component.GrayButton.SetUpSummaryCancel', {
                                id: 'psgp-apm-spm-btn-setupsummary-cancel-bottom',
                                margin: '3 7 8 7'
                            }),
                            Ext4.create('PSGP.APM.SPM.Component.GrayButton.SetUpSummaryReset', {
                                id: 'psgp-apm-spm-btn-setupsummary-reset-bottom',
                                margin: '3 7 8 7'
                            })
                            ]
                }
                ]
    });

    Ext4.define('PSGP.APM.SPM.Component.PieChart', {
        extend : 'Ext4.chart.Chart',
        animate : true,
        store : PSGP.APM.SPM.dataStores.suitescriptDetailData,
        shadow : false,
        legend: false,
        insetPadding: 25,
        series : [{
            type : 'pie',
            field : 'totaltime',
            showInLegend: true,
            donut: false,
            colorSet: [
                       '#8ac144','#E8FFB7','#C1F4C1','#92D6B3','#79bd9a',
                       '#3b8686','#3c6d89','#24385B','#5a6984','#919bad',
                       '#c8cdd6','#afbccb','#879ab1','#607998','#9591ad',
                       '#a391ad','#ad91a9','#ad919b','#ad9591','#ada391',
                       '#a9ad91','#9bad91','#91ad95','#91ada3','#91a9ad',
                       '#919bad','#212c3c','#394a62','#425879','#5a769f',
                       '#6384b6','#333333','#24385B','#5a6984','#919bad',
                       '#c8cdd6','#afbccb','#879ab1','#607998','#9591ad',
                       '#a391ad','#ad91a9','#ad919b','#ad9591','#ada391',
                       '#a9ad91','#9bad91','#91ad95','#91ada3','#91a9ad'
                       ],
            tips: {
                trackMouse: true,
                layout: 'fit',
                shrinkWrap: 3,
                style: {
                    'font-family': 'Arial',
                    'font-size': '12px',
                    'color': '#666666',
                    'background-color': '#ffffff'
                },
                renderer: function(storeItem, item) {
                    this.update(storeItem.get('script') + ' : ' + storeItem.get('totaltime') + ' ms');
                }
            },
            highlight: {
                segment: {
                    margin: 20
                }
            },
            label: {
                display: 'outside',
                contrast: false,
                field: 'script',
                renderer : function(value, label, storeItem, item, i, display, animate, index) {
                    //calculate percentage.
                    var total = 0;
                    PSGP.APM.SPM.dataStores.suitescriptDetailData.each(function(rec) {
                        total += rec.get('totaltime');
                    });
                    return Math.round(storeItem.get('totaltime') / total * 100) + '%';
                }

            }
        }]
    });

    Ext4.define('PSGP.APM.SPM.Component.BlueButton.CompIdQuickSelector.Done', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.common.button.done(),
        handler: function() {
            var newCompFil = Ext4.getCmp('psgp-apm-spm-quickselector-field-compid').getValue();
            COMP_FIL = newCompFil;
            Ext4.getCmp('psgp-apm-spm-quicksel-compid').hide();
            PSGP.APM.SPM.dataStores.recordTypeComboBox.load();
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.GrayButton.CompIdQuickSelector.Cancel', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            Ext4.getCmp('psgp-apm-spm-quicksel-compid').hide();
        }
    });

    Ext4.define('PSGP.APM.SPM.Component.CompIdQuickSelector', {
        extend: 'PSGP.APM.Component.QuickSelectorMenu',
        id: 'psgp-apm-spm-quicksel-compid',
        hidden: true,
        listeners: {
            beforerender: function () {
                Ext4.getCmp('psgp-apm-spm-quickselector-field-compid').setValue(COMP_FIL);
            },
            hide: function () {
                Ext4.getCmp('psgp-apm-spm-quickselector-field-compid').setValue(COMP_FIL);
            }
        },
        items: [
            Ext4.create('PSGP.APM.Component.Display', {
                fieldLabel: APMTranslation.apm.common.label.companyid(),
                margin: '20 20 0 20'
            }),
            Ext4.create('PSGP.APM.Component.TextField', {
                id: 'psgp-apm-spm-quickselector-field-compid',
                margin: '0 20 10 20'
            }),
            Ext4.create('PSGP.APM.SPM.Component.BlueButton.CompIdQuickSelector.Done', {
                id: 'psgp-apm-spm-quickselector-btn-done',
                margin: '10 10 20 20'
            }),
            Ext4.create('PSGP.APM.SPM.Component.GrayButton.CompIdQuickSelector.Cancel', {
                id: 'psgp-apm-spm-quickselector-btn-cancel',
                margin: '10 20 20 10'
            })
        ]
    });
}
