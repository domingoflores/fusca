/**
 * Copyright © 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       29 Oct 2014     jmarimla         Initial
 * 2.00       04 Nov 2014     jmarimla         Added filter comboboxes
 * 3.00       07 Nov 2014     jmarimla         Added SuiteScript details grid
 *                                             Added search button functionality
 * 4.00       11 Nov 2014     jmarimla         Commented out references to deployment name combobox
 * 5.00       20 Nov 2014     rwong            Added SSD grid and window component definition
 * 6.00       21 Nov 2014     rwong            Updated suitescript detail grid columns and increase size of ssd window.
 * 7.00       28 Nov 2014     rwong            Added support for parameter passing.
 * 8.00       02 Dec 2014     jmarimla         Added performance chart
 * 9.00       29 Jan 2015     rwong            Updated call to perfchart
 * 10.00      02 Feb 2015     jmarimla         Removed instruction count from SSD window
 * ********************************************************************************
 * 1.00       20 Feb 2015     rwong            Ported SPM to APM
 * 2.00       07 Apr 2015     rwong            Added urlrequests, searches and records column
 * 3.00       19 May 2015     jmarimla         Removed unused code
 * 4.00       01 Jul 2015     jmarimla         Updated loading masks
 * 5.00       09 Jul 2015     jmarimla         Retrieve script name
 * 6.00       13 Aug 2015     jmarimla         Passed date parameters as string
 * 7.00       25 Aug 2015     jmarimla         Compid dropdown components; support for compid mode
 * 8.00       12 Oct 2015     jmarimla         Date range validation
 * 9.00       01 Dec 2015     jmarimla         Added csv export button
 * 10.00      21 Dec 2015     rwong            Adjust the spacing of the export button
 * 11.00      05 Aug 2016     jmarimla         Support for suitescript context
 * 12.00      05 Apr 2018     rwong            Added support for client scripts
 * 13.00      04 May 2018     jmarimla         N/A client script columns
 * 14.00      16 May 2018     jmarimla         en dash
 * 15.00      29 Jun 2018     jmarimla         Translation readiness
 * 16.00      23 Aug 2018     jmarimla         FRHT link
 * 17.00      18 Oct 2018     jmarimla         Redirect to profiler
 * 18.00      26 Oct 2018     jmarimla         Frht label
 * 19.00      04 Jan 2019     rwong            Client Script Event Type translation field
 * 20.00      12 Feb 2019     rwong            Fix issue with client csv export
 * 21.00      07 Mar 2019     jmarimla         Client script disable frht
 * 22.00      28 Jun 2019     erepollo         Translation for new texts
 * 23.00      13 Nov 2019     lemarcelo        Added Error Code column
 * 24.00      27 Nov 2019     lemarcelo        Update error code label and remove error count display condition
 *
 */

function APMComponents() {
    Ext4.define('PSGP.APM.SSA.Component.BlueButton.Search', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.ssa.label.search(),
        handler: function() {
            //check fields validity
            if (!Ext4.getCmp('psgp-apm-ssa-filters-date-startdate').isValid()) {
                alert(APMTranslation.apm.common.alert.entervalidstartdate());
                return false;
            }
            if (!Ext4.getCmp('psgp-apm-ssa-filters-date-enddate').isValid()) {
                alert(APMTranslation.apm.common.alert.entervalidenddate());
                return false;
            }
            if (Ext4.getCmp('psgp-apm-ssa-filters-scripttype').getRawValue() == '') {
                alert(APMTranslation.apm.ssa.alert.enterscripttype());
                return false;
            }

            if ((COMPID_MODE == 'T') && (COMP_FIL)) {
                if (!Ext4.getCmp('psgp-apm-ssa-filters-scriptid').getValue()) {
                    alert(APMTranslation.apm.ssa.alert.enterscriptid());
                    return false;
                }
            } else {
                if (Ext4.getCmp('psgp-apm-ssa-filters-scriptname').getRawValue() == '') {
                    alert(APMTranslation.apm.ssa.alert.selectscriptname());
                    return false;
                }
            }

            var startdate = Ext4.getCmp('psgp-apm-ssa-filters-date-startdate').getValue();
            var starttime = Ext4.getCmp('psgp-apm-ssa-filters-time-starttime').getValue();
            var enddate = Ext4.getCmp('psgp-apm-ssa-filters-date-enddate').getValue();
            var endtime = Ext4.getCmp('psgp-apm-ssa-filters-time-endtime').getValue();
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

            var scriptType = Ext4.getCmp('psgp-apm-ssa-filters-scripttype').getValue();
            var scriptId;
            if ((COMPID_MODE == 'T') && (COMP_FIL)) {
                scriptId = Ext4.getCmp('psgp-apm-ssa-filters-scriptid').getValue();
            } else {
                scriptId = Ext4.getCmp('psgp-apm-ssa-filters-scriptname').getValue();
            }
            var scriptRec = PSGP.APM.SSA.dataStores.scriptNameComboBox.getById(scriptId);
            var scriptName = (scriptRec) ? scriptRec.get('name') : scriptId;

            var context = '';
            if (scriptType.indexOf('userevent') < 0) {
                context = '';
            } else {
                var contextValue = Ext4.getCmp('psgp-apm-ssa-filters-context').getValue();
                context = (contextValue) ? contextValue : '';
            }
            var clientEventType = 'pageInit';
            if(scriptType == 'client'){
                if (Ext4.getCmp('psgp-apm-ssa-filters-clienteventtype').getRawValue() == '') {
                    alert(APMTranslation.apm.ssa.alert.enterclienteventtype());
                    return false;
                }
                clientEventType = Ext4.getCmp('psgp-apm-ssa-filters-clienteventtype').getValue();
            }

            PSGP.APM.SSA.dataStores.suiteScriptParams = {
                        startDate : Ext4.Date.format(startDateObj, 'Y-m-d') + 'T' + Ext4.Date.format(startDateObj, 'H:i:s')
                      , endDate : Ext4.Date.format(endDateObj, 'Y-m-d') + 'T' + Ext4.Date.format(endDateObj, 'H:i:s')
                      , scriptType : scriptType
                      , scriptId : scriptId
                      , scriptName : scriptName
                      , drilldown : 'F'
                      , clientEventType: clientEventType
                      , context : context
            };
            PSGP.APM.SSA.dataStores.callSuiteScriptSummaryRESTlet();
            PSGP.APM.SSA.dataStores.callPerfChartRESTlet();

        }
    });

    Ext4.define('PSGP.APM.SSA.Component.ComboBox.ScriptType', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.SSA.dataStores.scriptTypeComboBox,
        width: 208,
        allowBlank: true,
        listeners: {
            select: function (combo, records, eOpts) {
                var scriptType = combo.getValue();
                Ext4.getCmp('psgp-apm-ssa-filters-scriptname').setValue(0);
                PSGP.APM.SSA.dataStores.scriptNameComboBox.load({
                   params: {
                       scriptType: scriptType
                   }
                });

                if (scriptType.indexOf('userevent') < 0) {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-context').hide();
                } else {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-context').show();
                }

                if (scriptType == 'client') {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-clienteventtype').show();
                } else {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-clienteventtype').hide();
                }
            },
            change: function (combo, records, eOpts) {
                var scriptType = combo.getValue();
                Ext4.getCmp('psgp-apm-ssa-filters-scriptname').setValue(0);

                PSGP.APM.SSA.dataStores.scriptNameComboBox.load({
                    params: {
                        scriptType: scriptType
                    }
                });

                if (scriptType.indexOf('userevent') < 0) {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-context').hide();
                } else {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-context').show();
                }

                if (scriptType == 'client') {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-clienteventtype').show();
                } else {
                    Ext4.getCmp('psgp-apm-ssa-container-filters-clienteventtype').hide();
                }
            }
        }
    });

    Ext4.define('PSGP.APM.SSA.Component.ComboBox.ScriptName', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.SSA.dataStores.scriptNameComboBox,
        width: 258,
        allowBlank: true,
        queryMode: 'local',
        matchFieldWidth: false,
        pickerAlign: 'tr-br'
    });

    Ext4.define('PSGP.APM.SSA.Component.ComboBox.Context', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.SSA.dataStores.contextComboBox,
        width: 150,
        allowBlank: true,
        queryMode: 'local',
        listeners: {
            select: function (combo) {
                if (combo.getValue() == 0 || combo.getValue() == "&nbsp;") {
                    combo.setValue(null);
                }
            }
        }
    });

    Ext4.define('PSGP.APM.SSA.Component.ComboBox.ClientEventType', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.SSA.dataStores.clientEventTypeComboBox,
        width: 208,
        allowBlank: true

    });

    Ext4.define('PSGP.APM.SSA.Component.Grid.SuitescriptDetails', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.SSA.dataStores.suiteScriptSummaryData,
        disableSelection: true,
        listConfig: {
            loadMask: false
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
                         dataIndex : 'name'
                     },
                     {
                         text : APMTranslation.apm.ssa.label.value(),
                         dataIndex : 'value'
                     }
            ]
        }
    });

    Ext4.define('PSGP.APM.SSA.Component.Grid.SSD', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.SSA.dataStores.suiteScriptDetailData,
        viewConfig: {
            emptyText: APMTranslation.apm.common.label.norecordstoshow(),
            loadMask: MASK_CONFIG
        },
        disableSelection: true,
        height: 550,
        width: 750,
        dockedItems: Ext4.create('PSGP.APM.Component.GridToolbar', {
            height: 36,
            items: [
                Ext4.create('PSGP.APM.Component.ExportCSVButton', {
                    id: 'psgp-apm-ssa-btn-exportcsv-ssd',
                    margin: '0 0 0 10',
                    handler: function () {
                        var dataParams = PSGP.APM.SSA.dataStores.suiteScriptParams;
                        var requestParams = {};
                        if (dataParams.drilldown == 'T') {
                            requestParams = {
                                    startDate : dataParams.drilldownStartDate
                                  , endDate : dataParams.drilldownEndDate
                                  , scriptType : dataParams.scriptType
                                  , scriptId : dataParams.scriptId
                                  , clientEventType: dataParams.clientEventType
                                  , context : dataParams.context
                                  , compfil : COMP_FIL
                            };
                        } else {
                            requestParams = {
                                    startDate : dataParams.startDate
                                  , endDate : dataParams.endDate
                                  , scriptType : dataParams.scriptType
                                  , scriptId : dataParams.scriptId
                                  , clientEventType: dataParams.clientEventType
                                  , context : dataParams.context
                                  , compfil : COMP_FIL
                            };
                        }
                        var urlRequest = '/app/site/hosting/scriptlet.nl?script=customscript_apm_ssa_sl_ss_detail&deploy=customdeploy_apm_ssa_sl_ss_detail&testmode='+TEST_MODE
                                        + '&getcsv=T' + '&' + Ext4.urlEncode(requestParams);
                        //window.open(urlRequest);
                        window.location.href = urlRequest;
                    }
                }),
                '->',
                Ext4.create('PSGP.APM.Component.ComboBox.PagingDropDown', {
                    id: 'psgp-apm-ssa-combobox-suitescriptdetailpaging',
                    store: PSGP.APM.SSA.dataStores.suiteScriptDetailPaging,
                    hidden: true,
                    listeners : {
                        select: function (combo, records, eOpts) {
                            var selectedPage = combo.getValue();
                            PSGP.APM.SSA.dataStores.suiteScriptDetailData.loadPage(selectedPage);
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
                    id: 'psgp-apm-ssa-pagingtb-suitescriptdetail',
                    store: PSGP.APM.SSA.dataStores.suiteScriptDetailData,
                    hidden: true
                }),
                Ext4.create('PSGP.APM.Component.TotalPagesField', {
                    id: 'psgp-apm-ssa-totalpages-suitescriptdetail'
                })
            ]
        }),

        columns: {
            defaults: {
                hideable: false,
                draggable: false,
                menuDisabled: true,
                height: 28,
                flex: 1
            },
            items: [
                    {
                        text: APMTranslation.apm.common.label.datetime(),
                        dataIndex: 'date'
                    },
                    {
                        text: APMTranslation.apm.common.label.name(),
                        dataIndex: 'entityname',
                        sortable: false
                    },
                    {
                        text: APMTranslation.apm.common.label.email(),
                        dataIndex: 'email',
                        //sortable : false
                    },
                    {
                        text: APMTranslation.apm.common.label.role(),
                        dataIndex: 'role',
                        //sortable : false
                    },
                    {
                        text: APMTranslation.apm.ssa.label.recordid(),
                        dataIndex: 'recordid'
                    },
                    {
                        text: APMTranslation.apm.common.label.context(),
                        dataIndex: 'context',
                        renderer: function(value) {
                            var contextTypes = PSGP.APM.SSA.dataStores.contextComboBox;
                            var contextRec = contextTypes.getById(value);
                            return (contextRec) ? contextRec.get('name') : value;
                        }
                    },
                    {
                        text: APMTranslation.apm.common.label.totaltime(),
                        dataIndex: 'totaltime'
                    },
                    {
                        text: APMTranslation.apm.ssa.label.usagecount(),
                        dataIndex: 'usagecount',
                        renderer: function(value) {
                            var scriptType = PSGP.APM.SSA.dataStores.suiteScriptParams.scriptType;
                            if (scriptType == 'client') {
                                return '\u2013';
                            }
                            return value;
                        }
                    },
                    {
                        text: APMTranslation.apm.common.label.urlrequests(),
                        dataIndex: 'urlrequests',
                        renderer: function(value) {
                            var scriptType = PSGP.APM.SSA.dataStores.suiteScriptParams.scriptType;
                            if (scriptType == 'client') {
                                return '\u2013';
                            }
                            return value;
                        }
                    },
                    {
                        text: APMTranslation.apm.ssa.label.searchcalls(),
                        dataIndex: 'searches',
                        renderer: function(value) {
                            var scriptType = PSGP.APM.SSA.dataStores.suiteScriptParams.scriptType;
                            if (scriptType == 'client') {
                                return '\u2013';
                            }
                            return value;
                        }
                    },
                    {
                        text: APMTranslation.apm.common.label.recordoperations(),
                        dataIndex: 'records',
                        renderer: function(value) {
                            var scriptType = PSGP.APM.SSA.dataStores.suiteScriptParams.scriptType;
                            if (scriptType == 'client') {
                                return '\u2013';
                            }
                            return value;
                        }
                    },
                    {
                        text: 'Includes Errors',
                        dataIndex: 'errorcode'
                    },
                    Ext4.create('PSGP.APM.Component.ColumnAction.Details',
                         {
                             text: APMTranslation.apm.r2019a.profilerdetails(),
                             items: [
                                 {
                                    handler: function(grid, rowIndex, colIndex) {
                                         var rec = grid.getStore().getAt(rowIndex);

                                         //dont redirect if clientscript
                                         var scriptType = PSGP.APM.SSA.dataStores.suiteScriptParams.scriptType;
                                         if (scriptType == 'client') {
                                             alert(APMTranslation.apm.r2019a.profilerdetailsalert());
                                             return;
                                         }

                                         var operationId = rec.get('operationId');
                                         var frhtId = rec.get('frhtId');
                                         var dataParams = {
                                                 compfil : ((COMPID_MODE == 'T') && (COMP_FIL)) ? COMP_FIL : '',
                                                 operationId: operationId,
                                                 frhtId: frhtId
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

    Ext4.define('PSGP.APM.SSA.Component.Window.SSD', {
        extend: 'PSGP.APM.Component.Window',
        id: 'psgp-apm-ssa-window-ssd',
        title: APMTranslation.apm.ssa.label.suitescriptdetails().toUpperCase(),
        width: 1024,
        bodyPadding: 15,
        layout: 'fit',
        hidden: true,
        items: [
                Ext4.create('PSGP.APM.SSA.Component.Grid.SSD', {

                })
                ]
    });

    Ext4.define('Ext4.chart.theme.PerfChartTheme', {
        extend : 'Ext4.chart.theme.Base',
        constructor : function(config) {
            this.callParent([Ext.apply({
                colors : ['#83D97A', '#7AB0D9', '#F3EB5E', '#FAB65D', '#D95E5E'],
                axis: {
                    fill: '#666666',
                    'stroke-width': 1
                },
                axisLabelLeft: {
                    font: '11px Arial',
                    fill: '#666'
                },
                axisLabelRight: {
                    font: '11px Arial',
                    fill: '#666'
                },
                axisLabelBottom: {
                    font: '11px Arial',
                    fill: '#666'
                },
                axisTitleLeft: {
                    font: 'bold 18px Arial',
                    fill: '#666666'
                },
                axisTitleRight: {
                    font: 'bold 18px Arial',
                    fill: '#666666'
                },
                axisTitleBottom: {
                    font: 'bold 18px Arial',
                    fill: '#666666'
                },
            }, config)]);
        }
    });

    Ext4.define('PSGP.APM.SSA.Component.PerfChart', {
       extend: 'Ext4.chart.Chart',
       store: PSGP.APM.SSA.dataStores.perfChartData,
       theme: 'PerfChartTheme',
       shadow: false,
       legend: {
           position: 'bottom',
           labelFont: '14px Helvetica, sans-serif',
           itemSpacing: 20,
           boxStroke: '#E6E6E6'
       },
       axes: [
           {
               type: 'Numeric',
               position: 'right',
               fields: ['usagecountAve'],
               title: 'Usage Count',
               majorTickSteps: 5,
               grid: false,
               adjustMaximumByMajorUnit: true,
               minimum: 0
           },
           {
               type: 'Numeric',
               position: 'left',
               fields: ['totaltimeAve'],
               title: 'Total Time',
               majorTickSteps: 5,
               grid: true,
               adjustMaximumByMajorUnit: true,
               minimum: 0
           },
           {
               type: 'Time',
               position: 'bottom',
               fields: ['dateObj'],
               title: 'Timeline',
               dateFormat: 'Y-m-d H:i:s',
               step: [Ext4.Date.HOUR, 1/2],
               label : {
                   rotate:{degrees:-270}
               }
           }
       ],
       series: [
           {
               type: 'line',
               axis: 'right',
               xField: 'dateObj',
               yField: 'usagecountAve',
               title: 'Usage Count',
               markerConfig: {
                   type: 'cross',
                   radius: 5,
               },
               style: {
                   'stroke-width': 3
               }
           },
           {
               type: 'line',
               axis: 'left',
               xField: 'dateObj',
               yField: 'totaltimeAve',
               title: 'Total Time',
               markerConfig: {
                   type: 'circle',
                   radius: 5,
               },
               style: {
                   'stroke-width': 3
               }
           },
           {
               type: 'line',
               axis: 'left',
               xField: 'dateObj',
               yField: 'totaltimeAveAll',
               title: 'Mean',
               showMarkers: false,
               style: {
                   'stroke-width': 3,
                   'stroke-dasharray': 6
               }
           },
           {
               type: 'line',
               axis: 'left',
               xField: 'dateObj',
               yField: 'totaltimeMedAll',
               title: 'Median',
               showMarkers: false,
               style: {
                   'stroke-width': 3,
                   'stroke-dasharray': 6
               }
           },
           {
               type: 'line',
               axis: 'left',
               xField: 'dateObj',
               yField: 'totaltime90PAll',
               title: '90th Percentile',
               showMarkers: false,
               style: {
                   'stroke-width': 3,
                   'stroke-dasharray': 6
               }
           }
       ]
    });

    Ext4.define('PSGP.APM.SSA.Component.BlueButton.CompIdQuickSelector.Done', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.common.button.done(),
        handler: function() {
            var newCompFil = Ext4.getCmp('psgp-apm-ssa-quickselector-field-compid').getValue();
            COMP_FIL = newCompFil;
            Ext4.getCmp('psgp-apm-ssa-quicksel-compid').hide();

            //UI changes
            if (COMP_FIL) {
                Ext4.getCmp('psgp-apm-ssa-container-filters-scriptname').hide();
                Ext4.getCmp('psgp-apm-ssa-container-filters-scriptid').show();
            } else {
                Ext4.getCmp('psgp-apm-ssa-container-filters-scriptname').show();
                Ext4.getCmp('psgp-apm-ssa-container-filters-scriptid').hide();
            }
        }
    });

    Ext4.define('PSGP.APM.SSA.Component.GrayButton.CompIdQuickSelector.Cancel', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            Ext4.getCmp('psgp-apm-ssa-quicksel-compid').hide();
        }
    });

    Ext4.define('PSGP.APM.SSA.Component.CompIdQuickSelector', {
        extend: 'PSGP.APM.Component.QuickSelectorMenu',
        id: 'psgp-apm-ssa-quicksel-compid',
        hidden: true,
        listeners: {
            beforerender: function () {
                Ext4.getCmp('psgp-apm-ssa-quickselector-field-compid').setValue(COMP_FIL);
            },
            hide: function () {
                Ext4.getCmp('psgp-apm-ssa-quickselector-field-compid').setValue(COMP_FIL);
            }
        },
        items: [
            Ext4.create('PSGP.APM.Component.Display', {
                fieldLabel: APMTranslation.apm.common.label.companyid(),
                margin: '20 20 0 20'
            }),
            Ext4.create('PSGP.APM.Component.TextField', {
                id: 'psgp-apm-ssa-quickselector-field-compid',
                margin: '0 20 10 20'
            }),
            Ext4.create('PSGP.APM.SSA.Component.BlueButton.CompIdQuickSelector.Done', {
                id: 'psgp-apm-ssa-quickselector-btn-done',
                margin: '10 10 20 20'
            }),
            Ext4.create('PSGP.APM.SSA.Component.GrayButton.CompIdQuickSelector.Cancel', {
                id: 'psgp-apm-ssa-quickselector-btn-cancel',
                margin: '10 20 20 10'
            })
        ]
    });
}

