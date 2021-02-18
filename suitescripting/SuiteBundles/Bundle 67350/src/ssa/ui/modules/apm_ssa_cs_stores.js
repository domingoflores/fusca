/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       04 Nov 2014     jmarimla         Initial
 * 2.00       07 Nov 2014     jmarimla         Added store components for suitescript details summary
 * 3.00       11 Nov 2014     jmarimla         Commented out deploymentid
 * 4.00       20 Nov 2014     rwong            Added suiteScriptDetailData store
 * 5.00       02 Dec 2014     jmarimla         Added store for performance chart
 *                                             Changed execution to total time in summary grid
 * 6.00       09 Jan 2015     rwong            Added code to call the highcharts object
 * 7.00       29 Jan 2015     rwong            Redesigned store to match use of highcharts
 * 8.00       02 Feb 2015     jmarimla         Added error count, hide median and instruction count in suitescript summary
 * 9.00       09 Feb 2015     rwong            Added additional parameters to handle drilldowns
 **************************************************************************************************************************
 * 1.00       20 Feb 2015     rwong            Ported SPM to APM
 * 2.00       27 Feb 2015     rwong            Ported to Performance Search API
 * 3.00       03 Mar 2015     jmarimla         Changed drilldown boolean
 * 4.00       06 Apr 2015     rwong            Added support for user event trigger types
 * 5.00       07 Apr 2015     rwong            Change data from average to median
 * 6.00       08 Apr 2015     rwong            Removed (Med) in suitescript details
 * 7.00       10 Apr 2015     rwong            Changed reference of script from restlet to suitelet
 * 9.00       28 Apr 2015     jmarimla         Corrected beforesubmit typo
 * 10.00      15 May 2015     jmarimla         Pass testmode parameter
 * 11.00      19 May 2015     jmarimla         Removed unused code
 * 12.00      01 Jul 2015     jmarimla         Updated loading masks
 * 13.00      09 Jul 2015     jmarimla         Update summary fields; sync suitescript details with drilldown/drillup
 * 14.00      14 Jul 2015     jmarimla         Use truncated total for pagination
 * 15.00      11 Aug 2015     jmarimla         Support for company filter
 * 16.00      11 Aug 2015     rwong            Added code to save pointInterval of perfChart for drilldown
 * 17.00      13 Aug 2015     jmarimla         Manually convert date strings to objects
 * 18.00      25 Aug 2015     jmarimla         Passed compfil parameter to store
 * 19.00      28 Aug 2015     jmarimla         Show script id on summary panel when in compid mode
 * 20.00      08 Sep 2015     jmarimla         Indicate radix for parseInt
 * 21.00      05 Aug 2016     jmarimla         Support for suitescript context
 * 22.00      23 Aug 2016     jmarimla         Add webstore support
 * 23.00      05 Apr 2018     rwong            Added support for client scripts
 * 24.00      04 May 2018     jmarimla         Removed parseFloat
 * 25.00      29 Jun 2018     jmarimla         Translation readiness
 * 26.00      18 Oct 2018     jmarimla         Fixed label
 * 27.00      17 Jul 2019     erepollo         Added script name in customer debug
 *
 */

function APMStores() {
    PSGP.APM.SSA.dataStores = {

            suiteScriptParams : {
                startDate : ''
                , endDate : ''
                , scriptType : ''
                , scriptId: ''
                , scriptName: ''
//              , deploymentId : ''
                , drilldown: 'F'
                , drilldownStartDate: ''
                , drilldownEndDate: ''
                , clientEventType: ''
            },

            scriptTypeComboBox : Ext4.create('Ext4.data.Store', {
                id : 'scriptTypeComboBox',
                fields : ['name', 'id'],
                data : [
                        { 'name': APMTranslation.apm.ssa.label.usereventbeforeload(), 'id': 'usereventbeforeload' },
                        { 'name': APMTranslation.apm.ssa.label.usereventbeforesubmit(), 'id': 'usereventbeforesubmit' },
                        { 'name': APMTranslation.apm.ssa.label.usereventaftersubmit(), 'id': 'usereventaftersubmit' },
                        { 'name': APMTranslation.apm.common.label.scheduled(), 'id': 'scheduled' },
                        { 'name': APMTranslation.apm.ssa.label.suitelet(), 'id': 'suitelet' },
                        { 'name': APMTranslation.apm.common.label.restlet(), 'id': 'restlet' },
                        { 'name': APMTranslation.apm.common.label.client(), 'id': 'client'},
                        ]
            }),

            clientEventTypeComboBox: Ext4.create('Ext4.data.Store', {
                id: 'clientEventTypeComboBox',
                fields: ['name', 'id'],
                data: [
                    {'name': 'pageInit', 'id': 'pageInit'},
                    {'name': 'saveRecord', 'id': 'saveRecord'},
                    {'name': 'validateField', 'id': 'validateField'},
                    {'name': 'fieldChanged', 'id': 'fieldChanged'},
                    {'name': 'postSourcing', 'id': 'postSourcing'},
                    {'name': 'lineInit', 'id': 'lineInit'},
                    {'name': 'validateLine', 'id': 'validateLine'},
                    {'name': 'recalc', 'id': 'recalc'},
                    {'name': 'validateInsert', 'id': 'validateInsert'},
                    {'name': 'validateDelete', 'id': 'validateDelete'},
                ]
            }),

            contextComboBox : Ext4.create('Ext4.data.Store', {
                id : 'contextComboBox',
                fields : ['name', 'id'],
                data : [
                        { 'name': '&nbsp;', 'id':0},
                        { 'name': APMTranslation.apm.ssa.label.userinterface(), 'id': 'userinterface' },
                        { 'name': APMTranslation.apm.ns.context.workflow(), 'id': 'workflow' },
                        { 'name': APMTranslation.apm.ssa.label.suitelet(), 'id': 'suitelet' },
                        { 'name': APMTranslation.apm.common.label.webservice(), 'id': 'webservices' },
                        { 'name': APMTranslation.apm.common.label.csvimport(), 'id': 'csvimport' },
                        { 'name': APMTranslation.apm.ssa.label.webstore(), 'id': 'webstore' }
                        ]
            }),

            scriptNameComboBox : Ext4.create('Ext4.data.Store', {
                id : 'scriptNameComboBox',
                fields : ['id', 'name'],
                isLoaded : true,
                proxy : {
                    type : 'rest',
                    url : '/app/site/hosting/scriptlet.nl?script=customscript_apm_ssa_sl_scripts&deploy=customdeploy_apm_ssa_sl_scripts',
                    timeout : 180000,
                    reader : {
                        type : 'json',
                        root : 'data',
                        idProperty : 'id',
                        totalProperty : 'total'
                    }
                },
                listeners : {
                    beforeload : function (store, operation, eOpts) {
                        store.isLoaded = false;
                    },
                    load : function (store, records, success, eOpts) {
                        store.isLoaded = true;
                        if (!success) {
                            alert(APMTranslation.apm.common.alert.errorinsearch());
                            store.loadData([], false);
                            return false;
                        }
                    }
                }
            }),

            callSuiteScriptSummaryRESTlet: function () {

                Ext4.getCmp('psgp-apm-ssa-container-suitescriptdetails').setLoading(MASK_CONFIG);
                var dataParams = this.suiteScriptParams;
                var requestParams = {};

                if (dataParams.drilldown == 'T') {
                    requestParams = {
                            startDate : dataParams.drilldownStartDate
                          , endDate : dataParams.drilldownEndDate
                          , scriptType : dataParams.scriptType
                          , scriptId : dataParams.scriptId
                          , clientEventType: dataParams.clientEventType
                          , context : dataParams.context
                    };
                } else {
                    requestParams = {
                            startDate : dataParams.startDate
                          , endDate : dataParams.endDate
                          , scriptType : dataParams.scriptType
                          , scriptId : dataParams.scriptId
                          , clientEventType: dataParams.clientEventType
                          , context : dataParams.context
                    };
                }

                Ext4.Ajax.request({
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_ssa_sl_ss_summary&deploy=customdeploy_apm_ssa_sl_ss_summary&testmode='+TEST_MODE+'&compfil='+COMP_FIL,
                    timeout: 180000,
                    params: requestParams,
                    method: 'GET',
                    success: function (response) {
                        var jsonResponse = Ext4.decode(response.responseText);
                        var summaryRows = PSGP.APM.SSA.dataStores.suiteScriptSummaryData;
                        for (var key in jsonResponse.data) {
                            var row = summaryRows.getById(key);
                            row.set('value', jsonResponse.data[key]);
                        }
                        summaryRows.commitChanges();
                        PSGP.APM.SSA.dataStores.updateSummaryFields();
                        Ext4.getCmp('psgp-apm-ssa-container-suitescriptdetails').setLoading(false);
                    },
                    failure: function (response) {
                        console.log('callSuiteScriptSummaryRESTlet failed: '+ response.responseText);
                        Ext4.getCmp('psgp-apm-ssa-container-suitescriptdetails').setLoading(false);
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                    }
                });
            },

            suiteScriptSummaryData : Ext4.create('Ext4.data.Store', {
                id : 'suiteScriptSummaryData',
                storeId : 'id',
                fields : ['id', 'name', 'value'],
                data : [
                        {
                            id: 'logsTotal'
                            , name: APMTranslation.apm.common.label.numberoflogs()
                            , value: 0
                        },
                        {
                            id: 'usersTotal'
                            , name: APMTranslation.apm.common.label.users()
                            , value: 0
                        },
                        {
                            id: 'totaltimeMed'
                            , name: APMTranslation.apm.common.label.totaltime()
                            , value: 0
                        },
                        {
                            id: 'usagecountMed'
                            , name: APMTranslation.apm.ssa.label.usagecount()
                            , value: 0
                        },
                        {
                            id: 'urlrequestsMed'
                            , name: APMTranslation.apm.common.label.urlrequests()
                            , value: 0
                        },
                        {
                            id: 'searchesMed'
                            , name: APMTranslation.apm.ssa.label.searchcalls()
                            , value: 0
                        },
                        {
                            id: 'recordsMed'
                            , name: APMTranslation.apm.common.label.recordoperations()
                            , value: 0
                        },
                        {
                            id: 'errorCount'
                            , name: APMTranslation.apm.ssa.label.errorcount()
                            , value: 0
                        }
                        ]
            }),

            callPerfChartRESTlet: function () {

                Ext4.getCmp('psgp-apm-ssa-container-perfchart').setLoading(MASK_CONFIG);
                Ext4.getCmp('psgp-apm-ssa-container-perfchart-nodata').hide();

                var dataParams = this.suiteScriptParams;

                Ext4.Ajax.request({
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_ssa_sl_perfchart&deploy=customdeploy_apm_ssa_sl_perfchart&testmode='+TEST_MODE+'&compfil='+COMP_FIL,
                    timeout: 180000,
                    params: dataParams,
                    method: 'GET',
                    success: function (response) {
                        var jsonResponse = Ext4.decode(response.responseText);

                        if (jsonResponse.data.length == 0) {
                            Ext4.getCmp('psgp-apm-ssa-container-perfchart-nodata').show();
                            Ext4.getCmp('psgp-apm-ssa-container-perfchart').hide();
                        } else {
                            Ext4.getCmp('psgp-apm-ssa-container-perfchart-nodata').hide();
                            Ext4.getCmp('psgp-apm-ssa-container-perfchart').show();
                            PSGP.APM.SSA.Highcharts.perfChartInterval = jsonResponse.config.pointInterval;
                            PSGP.APM.SSA.Highcharts.perfChartConfig = jsonResponse.config;
                            PSGP.APM.SSA.Highcharts.renderPerfChart(jsonResponse.data, jsonResponse.config);
                        }
                        Ext4.getCmp('psgp-apm-ssa-container-perfchart').setLoading(false);
                    },
                    failure: function (response) {
                        console.log('callPerfChartRESTlet failed: '+ response.responseText);
                        Ext4.getCmp('psgp-apm-ssa-container-perfchart').setLoading(false);
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                    }
                });
            },

            callPerfChartDrilldownRESTlet: function (chart, point) {

                Ext4.getCmp('psgp-apm-ssa-container-perfchart').setLoading(MASK_CONFIG);

                var dataParams = this.suiteScriptParams;

                Ext4.Ajax.request({
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_ssa_sl_perfchart&deploy=customdeploy_apm_ssa_sl_perfchart&testmode='+TEST_MODE+'&compfil='+COMP_FIL,
                    timeout: 180000,
                    params: dataParams,
                    method: 'GET',
                    success: function (response) {
                        var jsonResponse = Ext4.decode(response.responseText);
                        var data = jsonResponse.data;
                        var config = jsonResponse.config;
                        var xAxisMin = config.xAxis.min;
                        var xAxisMax = config.xAxis.max;
                        PSGP.APM.SSA.Highcharts.perfChartInterval = config.pointInterval;
                        PSGP.APM.SSA.Highcharts.perfChartDrilldownConfig = config;

                        if(data){
                            var series = { name: PSGP.APM.SSA.dataStores.suiteScriptParams.drilldownStartDate, data: data };
                            chart.addSeriesAsDrilldown(point, series);
                            setTimeout( function() {
                                chart.xAxis[0].setExtremes(xAxisMin, xAxisMax);
                            }, 100);
                        } else {
                            console.log('No drilldown data returned.');
                            alert(APMTranslation.apm.common.label.nodrilldowndata());
                        }

                        Ext4.getCmp('psgp-apm-ssa-container-perfchart').setLoading(false);
                    },
                    failure: function (response) {
                        console.log('callPerfChartDrilldownRESTlet failed: '+ response.responseText);
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        Ext4.getCmp('psgp-apm-ssa-container-perfchart').setLoading(false);
                    }
                });
            },

            convertStringToDateObj : function (dateStr) {
                if (!dateStr) return;
                var datetime = dateStr.replace('T', ',').replace(/-/g,'/').replace(' ', ',').split(',');
                var date = datetime[0].split('/');
                var time = datetime[1].split(':');
                var convertedDate = new Date(date[0], date[1]-1, date[2], time[0] || 0, time[1] || 0, time[2] || 0);
                return convertedDate;
            },

            suiteScriptDetailData : Ext4.create('Ext4.data.Store', {
                id : 'suiteScriptDetailData',
                model: 'PSGP.APM.SSA.Model.suiteScriptDetailData',
                pageSize: 100,
                remoteSort: true,
                isLoaded: true,
                proxy: {
                    type: 'rest',
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_ssa_sl_ss_detail&deploy=customdeploy_apm_ssa_sl_ss_detail&testmode='+TEST_MODE,
                    timeout: 180000,
                    reader: {
                        type : 'json',
                        root : 'data',
                        totalProperty : 'totalTrunc'
                    },
                    simpleSortMode: true
                },
                listeners: {
                    beforeLoad : function (store, operation, eOpts) {
                        store.isLoaded = false;
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
                        store.proxy.extraParams = requestParams;
                        Ext4.getCmp('psgp-apm-ssa-combobox-suitescriptdetailpaging').hide();
                        Ext4.getCmp('psgp-apm-ssa-pagingtb-suitescriptdetail').hide();
                    },
                    load: function (store, records, success, eOpts) {
                        store.isLoaded = true;
                        if (!success) {
                            alert(APMTranslation.apm.common.alert.errorinsearch());
                            store.loadData({}, false);
                            return false;
                        }

                        var response = store.proxy.reader.jsonData;
                        PSGP.APM.SSA.dataStores.suiteScriptDetailPaging.loadData(response.pages);

                        var currPage = store.currentPage;
                        Ext4.getCmp('psgp-apm-ssa-combobox-suitescriptdetailpaging').suspendEvents();
                        Ext4.getCmp('psgp-apm-ssa-combobox-suitescriptdetailpaging').setValue(currPage);
                        Ext4.getCmp('psgp-apm-ssa-combobox-suitescriptdetailpaging').resumeEvents();

                        var totalLogs = response.total;
                        Ext4.getCmp('psgp-apm-ssa-totalpages-suitescriptdetail').setValue(totalLogs);

                        if(store.getCount() > 0){
                            Ext4.getCmp('psgp-apm-ssa-combobox-suitescriptdetailpaging').show();
                            Ext4.getCmp('psgp-apm-ssa-pagingtb-suitescriptdetail').show();
                        }
                    }
                },
                sorters : [{
                    property: 'date',
                    direction: 'ASC'
                }]
            }),

            suiteScriptDetailPaging : Ext4.create('Ext4.data.Store', {
                id : 'suiteScriptDetailPaging',
                fields : ['id', 'name'],
                data : [{ id: 1, name: ' '}]
            }),

            updateSummaryFields : function (clearAll) {

                if (clearAll) {
                    Ext4.getCmp('psgp-apm-ssa-display-summary-scriptname').setValue('-');
                    Ext4.getCmp('psgp-apm-ssa-display-summary-scripttype').setValue('-');
                    Ext4.getCmp('psgp-apm-ssa-display-summary-fromdate').setValue('-');
                    Ext4.getCmp('psgp-apm-ssa-display-summary-todate').setValue('-');
                    Ext4.getCmp('psgp-apm-ssa-display-summary-context').hide();
                } else {
                    var dataParams = this.suiteScriptParams;

                    if ((COMPID_MODE == 'T') && (COMP_FIL)) {
                        //Make sure scriptId and scriptName are not the same
                        var script = (dataParams.scriptName && dataParams.scriptName != dataParams.scriptId) ? dataParams.scriptId + ' ' + dataParams.scriptName : dataParams.scriptId;
                        Ext4.getCmp('psgp-apm-ssa-display-summary-scriptname').setValue(script);
                    } else {
                        Ext4.getCmp('psgp-apm-ssa-display-summary-scriptname').setValue(dataParams.scriptName);
                    }

                    var scriptTypeRec = PSGP.APM.SSA.dataStores.scriptTypeComboBox.getById(dataParams.scriptType);
                    var scriptTypeName = (scriptTypeRec) ? scriptTypeRec.get('name') : dataParams.scriptType;
                    Ext4.getCmp('psgp-apm-ssa-display-summary-scripttype').setValue(scriptTypeName);

                    if ((dataParams.scriptType.indexOf('userevent') >= 0) && (dataParams.context)) {
                        Ext4.getCmp('psgp-apm-ssa-display-summary-context').show();
                        var contextRec = PSGP.APM.SSA.dataStores.contextComboBox.getById(dataParams.context);
                        var contextName = (contextRec) ? contextRec.get('name') : dataParams.context;
                        Ext4.getCmp('psgp-apm-ssa-display-summary-context').setValue(contextName);
                    } else {
                        Ext4.getCmp('psgp-apm-ssa-display-summary-context').hide();
                    }

                    if (dataParams.drilldown == 'T') {
                        var startDateObj = this.convertDateStringToDateObject(dataParams.drilldownStartDate);
                        var endDateObj = this.convertDateStringToDateObject(dataParams.drilldownEndDate);
                        var startDateText = Ext4.Date.format(startDateObj, 'M j, g:i A');
                        var endDateText = Ext4.Date.format(endDateObj, 'M j, g:i A');
                        Ext4.getCmp('psgp-apm-ssa-display-summary-fromdate').setValue(startDateText);
                        Ext4.getCmp('psgp-apm-ssa-display-summary-todate').setValue(endDateText);
                    } else {
                        var startDateObj = this.convertDateStringToDateObject(dataParams.startDate);
                        var endDateObj = this.convertDateStringToDateObject(dataParams.endDate);
                        var startDateText = Ext4.Date.format(startDateObj, 'M j, g:i A');
                        var endDateText = Ext4.Date.format(endDateObj, 'M j, g:i A');
                        Ext4.getCmp('psgp-apm-ssa-display-summary-fromdate').setValue(startDateText);
                        Ext4.getCmp('psgp-apm-ssa-display-summary-todate').setValue(endDateText);
                    }

                }

            },

            convertDateStringToDateObject : function (dateString) {
                if (!dateString) return null;
                return new Date(
                        parseInt(dateString.substring(0,4), 10),
                        parseInt(dateString.substring(5,7), 10) - 1,
                        parseInt(dateString.substring(8,10), 10),
                        parseInt(dateString.substring(11,13), 10),
                        parseInt(dateString.substring(14,16), 10)
                );
            }
    };
}