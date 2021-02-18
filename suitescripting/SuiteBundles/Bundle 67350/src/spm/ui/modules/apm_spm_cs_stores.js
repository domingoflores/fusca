/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       25 Sep 2014     jmarimla         Initial
 * 2.00       03 Oct 2014     jmarimla         Added ajax call to end to end summary restlet
 * 3.00       09 Oct 2014     jmarimla         Added store for set up summary window
 * 4.00       10 Oct 2014     jmarimla         Added restlet calls to retrieve and save summary set up
 * 5.00       13 Oct 2014     jmarimla         Added support for performance logs pagination
 * 6.00       23 Oct 2014     jmarimla         Added store items for median, standard deviation, 90th percentile
 * 7.00       04 Nov 2014     rwong            Added code to handle clearing of grid and chart upon search.
 * 8.00       05 Nov 2014     rwong            Updated code to handle the no data error message better.
 * 9.00       19 Nov 2014     jmarimla         Added new store for summary grid; commented out unused functions
 * 10.00      21 Nov 2014     jmarimla         Enable set up for summary grid
 * 11.00      26 Nov 2014     rwong            Clear suitescriptdetail params on endtoendtime store load.
 *                                             Hide execution time header when chart is empty.
 * 12.00      09 Feb 2015     jmarimla         Contruct and pass data to highcharts
 ****************************************************************************************************************
 * 1.00       23 Feb 2015     jmarimla         Porting to APM
 * 2.00       27 Feb 2015     jmarimla         Redirect restlet calls to suitelet calls
 * 3.00       12 Mar 2015     jmarimla         90th to 95th percentile
 * 4.00       21 Mar 2015     jmarimla         Suitelet call for recordtypes
 * 5.00       27 Mar 2015     jmarimla         Added response time combobox store
 * 6.00       01 Apr 2015     rwong            Added workflowtime
 * 7.00       09 Apr 2015     jyeh             
 * 8.00       10 Apr 2015     rwong            Added Record Type in summary page
 * 9.00       10 Apr 2015     rwong            Change setup summary from restlet to suitelet
 * 10.00      27 Apr 2015     jmarimla         Pass scripttype and triggertype to chart
 * 11.00      15 May 2015     jmarimla         Pass testmode parameter
 * 12.00      19 May 2015     jmarimla         Removed unused code
 * 13.00      25 Jun 2015     jmarimla         Added role combo box store; Refactored updateSummaryFields
 * 14.00      01 Jul 2015     jmarimla         Updated loading masks
 * 15.00      14 Jul 2015     jmarimla         Use truncated total for pagination
 * 16.00      05 Aug 2015     rwong            Removed role combo box store
 * 17.00      11 Aug 2015     jmarimla         Support for company filter
 * 18.00      28 Aug 2015     rwong            Added functionality to support customer debugging
 * 19.00      29 Jun 2018     jmarimla         Translation readiness
 * 20.00      01 Aug 2019     erepollo         Set default sort to descending response time
 *
 */

function APMStores() {
	PSGP.APM.SPM.dataStores = {
	        isLoaded : function () {
	            var ready = true;

	            //check if auto loaded stores are ready

	            var requiredStores = [
	                                  'recordTypeComboBox'//, 'roleComboBox'
	                                  ];
	            for ( var i = 0; i < requiredStores.length; i++) {
	                if (!Ext4.StoreManager.get(requiredStores[i]).isLoaded) {
	                    //console.log(requiredStores[i] + ' still loading');
	                    ready = false;
	                }
	            }

	            //check if ajax calls are ready
	            var restletReady = this.restletReady;
	            for (var key in restletReady) {
	                if (restletReady.hasOwnProperty(key) && (!restletReady[key])) {
	                    ready = false;
	                }
	            }

	            return ready;
	        },

	        restletReady : {
	            setUpSummary : false
	        },

	        endToEndTimeParams : {
	            recordURL : ''
	          , oper : ''
	          , email : ''
	          , startDate : ''
	          , endDate : ''
	        },

	        suitescriptDetailParams : {
	            threadid : ''
	        },

	        endToEndSummaryData : {
	            recordtype: 0
	          , logsTotal : 0
	          , usersTotal : 0
	          , operation : ''
	          , stats : [
	            {
	                id : 'setup_ave'
	              , name : APMTranslation.apm.pts.label.meanaverage()
	              , clienttime : 0
	              , networktime : 0
	              , suitescripttime : 0
	              , servertime : 0
	              , workflowtime : 0
	              , totaltime : 0
	            },
	            {
	                id : 'setup_med'
	              , name : APMTranslation.apm.common.label.median()
	              , clienttime : 0
	              , networktime : 0
	              , suitescripttime : 0
	              , servertime : 0
	              , workflowtime: 0
	              , totaltime : 0
	            },
	            {
	                id : 'setup_sd'
	              , name : APMTranslation.apm.pts.label.standarddeviation()
	              , clienttime : 0
	              , networktime : 0
	              , suitescripttime : 0
	              , servertime : 0
	              , workflowtime: 0
	              , totaltime : 0
	            },
	            {
	                id : 'setup_95p'
	              , name : APMTranslation.apm.common.label._95thpercentile()
	              , clienttime : 0
	              , networktime : 0
	              , suitescripttime : 0
	              , servertime : 0
	              , workflowtime: 0
	              , totaltime : 0
	            }
	          ]
	        },

	        operationComboBox : Ext4.create('Ext4.data.Store', {
	            id : 'operationComboBox',
	            fields : ['name', 'id'],
	            data : [
	                    { 'name': APMTranslation.apm.common.label.view(), 'id': 'v' }
	                  , { 'name': APMTranslation.apm.common.label.edit(), 'id': 'e' }
	                  , { 'name': APMTranslation.apm.common.label.new(), 'id': 'n' }
	                  , { 'name': APMTranslation.apm.common.label.save(), 'id': 's' }
	            ]
	        }),

	        responseTimeComboBox : Ext4.create('Ext4.data.Store', {
	            id : 'responseTimeComboBox',
	            fields : ['name', 'id'],
	            data : [
	                    { 'name': '&nbsp;', 'id':0}
	                  , { 'name': APMTranslation.apm.pts.label.greaterthan(), 'id': 'gt' }
	                  , { 'name': APMTranslation.apm.pts.label.lessthan(), 'id': 'lt' }
	                  , { 'name': APMTranslation.apm.pts.label.between(), 'id': 'bw' }
	            ]
	        }),

	        recordTypeComboBox :  Ext4.create('Ext4.data.Store', {
	            id : 'recordTypeComboBox',
	            fields : ['id', 'name'],
	            isLoaded: true,
	            sortOnLoad : true,
	            sorters: {
	                property: 'name'
	            },
	            proxy : {
	                type : 'rest',
	                url : '/app/site/hosting/scriptlet.nl?script=customscript_apm_sl_recordtypes&deploy=customdeploy_apm_sl_recordtypes',
	                timeout : 180000,
	                reader : {
	                    type : 'json',
	                    root : 'data'
	                }
	            },
	            listeners : {
	                beforeload : function (store, operation, eOpts) {
	                    store.isLoaded = false;
	                    store.proxy.extraParams.compfil = COMP_FIL;
	                },
	                load : function (store, records, success, eOpts) {
	                    store.isLoaded = true;
	                    if (!success) {
	                        alert(APMTranslation.apm.common.alert.errorinsearch());
	                        store.loadData({}, false);
	                        return false;
	                    }
	                }
	            }
	        }),
	        
//	        roleComboBox :  Ext4.create('Ext4.data.Store', {
//	            id : 'roleComboBox',
//	            fields : ['id', 'name'],
//	            isLoaded: true,
//	            sortOnLoad : true,
//	            sorters: {
//	                property: 'name'
//	            },
//	            proxy : {
//	                type : 'rest',
//	                url : '/app/site/hosting/scriptlet.nl?script=customscript_apm_sl_roles&deploy=customdeploy_apm_sl_roles',
//	                timeout : 180000,
//	                reader : {
//	                    type : 'json',
//	                    root : 'data'
//	                }
//	            },
//	            listeners : {
//	                beforeload : function (store, operation, eOpts) {
//	                    store.isLoaded = false;
//	                },
//	                load : function (store, records, success, eOpts) {
//	                    store.isLoaded = true;
//	                    if (!success) {
//	                        alert('Error encountered in search');
//	                        store.loadData({}, false);
//	                        return false;
//	                    }
//	                }
//	            }
//	        }),

	        endToEndTimeData : Ext4.create('Ext4.data.Store', {
	            id : 'endToEndTimeData',
	            model : 'PSGP.APM.SPM.Model.endToEndTimeData',
	            pageSize : 100,
	            remoteSort : true,
	            isLoaded : true,
	            isSearched : false,
	            proxy : {
	                type : 'rest',
	                url : '/app/site/hosting/scriptlet.nl?script=customscript_apm_spm_sl_etetime&deploy=customdeploy_apm_spm_sl_etetime&testmode='+TEST_MODE,//+'&compfil='+COMP_FIL,
	                timeout : 180000,
	                reader : {
	                    type : 'json',
	                    root : 'data',
	                    idProperty : 'id',
	                    totalProperty : 'totalTrunc'
	                },
	                simpleSortMode : true
	            },
	            listeners : {
	                beforeload : function (store, operation, eOpts) {
	                    store.isLoaded = false;
	                    store.proxy.extraParams = PSGP.APM.SPM.dataStores.endToEndTimeParams;
	                    store.proxy.extraParams.compfil = COMP_FIL;
	                    Ext4.getCmp('psgp-apm-spm-combobox-endtoendtimepaging').hide();
	                    Ext4.getCmp('psgp-apm-spm-pagingtb-endtoendtime').hide();
	                    Ext4.getCmp('psgp-apm-spm-suitescriptdetail-chart-nodata').show();
	                    Ext4.getCmp('psgp-apm-spm-grid-suitescriptdetail').getStore().removeAll();
	                    Ext4.getCmp('psgp-apm-spm-suitescriptdetail-chart-container').hide();
	                    PSGP.APM.SPM.dataStores.suitescriptDetailParams = { threadid : '' };
	                },
	                load : function (store, records, success, eOpts) {
	                    store.isLoaded = true;
	                    var isSearched = store.isSearched;
	                    store.isSearched = false;
	                    if (!success) {
	                        alert(APMTranslation.apm.common.alert.errorinsearch());
	                        store.loadData({}, false);
	                        return false;
	                    }
	                    var response = store.proxy.reader.jsonData;
	                    PSGP.APM.SPM.dataStores.endToEndTimePaging.loadData(response.pages);
	                    var currPage = store.currentPage;
	                    Ext4.getCmp('psgp-apm-spm-combobox-endtoendtimepaging').suspendEvents();
	                    Ext4.getCmp('psgp-apm-spm-combobox-endtoendtimepaging').setValue(currPage);
	                    Ext4.getCmp('psgp-apm-spm-combobox-endtoendtimepaging').resumeEvents();
	                    var totalLogs = response.total;
	                    Ext4.getCmp('psgp-apm-spm-totalpages-endtoendtime').setValue(totalLogs);

	                    // refresh summary if does not match with end to end time data
	                    if (!isSearched) {
	                        var summaryNumberOfLogs = PSGP.APM.SPM.dataStores.endToEndSummaryData.logsTotal;
	                        if (totalLogs != summaryNumberOfLogs) PSGP.APM.SPM.dataStores.callEndToEndSummaryRESTlet();
	                    }
	                    if(store.getCount() > 0){
	                        Ext4.getCmp('psgp-apm-spm-combobox-endtoendtimepaging').show();
	                        Ext4.getCmp('psgp-apm-spm-pagingtb-endtoendtime').show();
	                    }
	                }
	            },
	            sorters : [{
	                property : 'date',
	                direction : 'ASC'
	            }]
	        }),

	        suitescriptDetailData : Ext4.create('Ext4.data.Store', {
	            id : 'suitescriptDetailData',
	            model : 'PSGP.APM.SPM.Model.suitescriptDetailData',
	            pageSize : 1000,
	            remoteSort : true,
	            isLoaded : true,
	            proxy : {
	                type : 'rest',
	                url : '/app/site/hosting/scriptlet.nl?script=customscript_apm_spm_sl_ssdetail&deploy=customdeploy_apm_spm_sl_ssdetail&testmode='+TEST_MODE,//+'&compfil='+COMP_FIL,
	                timeout : 180000,
	                reader : {
	                    type : 'json',
	                    root : 'data',
	                    totalProperty : 'total'
	                },
	                simpleSortMode : true
	            },
	            listeners : {
	                beforeload : function (store, operation, eOpts) {
	                    store.isLoaded = false;
	                    store.proxy.extraParams = PSGP.APM.SPM.dataStores.suitescriptDetailParams;
	                    store.proxy.extraParams.compfil = COMP_FIL;
	                },
	                load : function (store, records, success, eOpts) {
	                    store.isLoaded = true;
	                    if (!success) {
	                        alert(APMTranslation.apm.common.alert.errorinsearch());
	                        store.loadData({}, false);
	                        return false;
	                    }
	                    if(store.getCount() > 0){
	                        Ext4.getCmp('psgp-apm-spm-suitescriptdetail-chart-nodata').hide();
	                        Ext4.getCmp('psgp-apm-spm-suitescriptdetail-chart-container').show();
	                        store.constructHighchartsData();
	                    }
	                }
	            },
	            sorters : [{
	                property : 'totaltime',
	                direction : 'DESC'
	            }],
	            constructHighchartsData : function () {
	                var store = this;
	                var chartData = new Array();
	                store.each(function(record) {
	                    chartData.push({
	                        name: record.get('script') 
	                      , y: parseFloat(record.get('totaltime'))
	                      , scripttype: record.get('scripttype')
	                      , triggertype: record.get('triggertype')
	                    });
	                });
	                PSGP.APM.SPM.Highcharts.renderSuiteScriptDetailChart(chartData);
	            }
	        }),

	        callEndToEndSummaryRESTlet: function () {

	            Ext4.getCmp('psgp-apm-spm-subpanel-endtoendsummary').setLoading(MASK_CONFIG);
	            var dataParams = this.endToEndTimeParams;

	            Ext4.Ajax.request({
	               url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spm_sl_etesummary&deploy=customdeploy_apm_spm_sl_etesummary&testmode='+TEST_MODE+'&compfil='+COMP_FIL,
	               timeout: 180000,
	               params: dataParams,
	               method: 'GET',
	               success: function (response) {
	                   var jsonResponse = Ext4.decode(response.responseText);
	                   PSGP.APM.SPM.dataStores.endToEndSummaryData = jsonResponse.data;
	                   PSGP.APM.SPM.dataStores.updateSummaryFields();
	                   PSGP.APM.SPM.dataStores.filterSummaryGrid();
	               },
	               failure: function (response) {
	                   console.log('callEndToEndSummaryRESTlet failed: '+ response.responseText);
	                   Ext4.getCmp('psgp-apm-spm-subpanel-endtoendsummary').setLoading(false);
	                   alert(APMTranslation.apm.common.alert.errorinsearch());
	               }
	            });
	        },

	        saveSetUpSummary : function (params) {
	            Ext4.Ajax.request({
	                url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spm_sl_setup_summary&deploy=customdeploy_apm_spm_sl_setup_summary',
	                timeout: 180000,
	                params: params,
	                method: 'POST',
	                success: function (response) {
	                    var summaryStore = PSGP.APM.SPM.dataStores.setUpSummaryData;
	                    summaryStore.commitChanges();
	                    PSGP.APM.SPM.dataStores.filterSummaryGrid();
	                },
	                failure: function (response) {
	                    var summaryStore = PSGP.APM.SPM.dataStores.setUpSummaryData;
	                    summaryStore.rejectChanges();
	                    console.log('saveSetUpSummary failed: '+ response.responseText);
	                    alert(APMTranslation.apm.common.alert.errorinsearch());
	                    Ext4.getCmp('psgp-apm-spm-subpanel-endtoendsummary').setLoading(false);
	                }
	            });
	        },

	        getSetUpSummary : function () {
	            Ext4.Ajax.request({
	                url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spm_sl_setup_summary&deploy=customdeploy_apm_spm_sl_setup_summary',
	                timeout: 180000,
	                method: 'GET',
	                success: function (response) {
	                    var jsonResponse = Ext4.decode(response.responseText);
	                    var summaryStore = PSGP.APM.SPM.dataStores.setUpSummaryData;
	                    summaryStore.each(function(record) {
	                       var id = record.getId();
	                       var show = (jsonResponse.data[id] == 'T') ? true : false;
	                       record.set('show', show);
	                    });
	                    summaryStore.commitChanges();
	                    PSGP.APM.SPM.dataStores.filterSummaryGrid();
	                    PSGP.APM.SPM.dataStores.restletReady.setUpSummary = true;
	                },
	                failure: function (response) {
	                    var summaryStore = PSGP.APM.SPM.dataStores.setUpSummaryData;
	                    summaryStore.rejectChanges();
	                    console.log('getSetUpSummary failed: '+ response.responseText);
	                    alert(APMTranslation.apm.common.alert.errorinsearch());
	                    PSGP.APM.SPM.dataStores.restletReady.setUpSummary = true;
	                }
	            });
	        },

	        filterSummaryGrid: function () {
	            var summarySetUp = PSGP.APM.SPM.dataStores.setUpSummaryData;
	            var summaryGrid = PSGP.APM.SPM.dataStores.summaryAggregationGrid;
	            summaryGrid.clearFilter();
	            summaryGrid.filterBy(function (record, id) {
	                var setup = summarySetUp.getById(id);
	                if (setup.get('show')) return true;
	                else return false;
	            }, this);
	            Ext4.getCmp('psgp-apm-spm-subpanel-endtoendsummary').setLoading(false);
	        },

	        updateSummaryFields: function () {
	            var endToEndSummaryData = PSGP.APM.SPM.dataStores.endToEndSummaryData;
	            var recordTypesStore = PSGP.APM.SPM.dataStores.recordTypeComboBox;
	            var recordType = recordTypesStore.getById(endToEndSummaryData.recordtype);
	            var recordName = (recordType) ? recordType.get('name') : endToEndSummaryData.recordtype;
	            Ext4.getCmp('psgp-apm-spm-display-summary-recordtype').setValue(recordName);
	            Ext4.getCmp('psgp-apm-spm-display-summary-logstotal').setValue(endToEndSummaryData.logsTotal);
	            Ext4.getCmp('psgp-apm-spm-display-summary-userstotal').setValue(endToEndSummaryData.usersTotal);

	            var operRecord = PSGP.APM.SPM.dataStores.operationComboBox.getById(endToEndSummaryData.operation);
	            Ext4.getCmp('psgp-apm-spm-display-summary-operation').setValue((operRecord) ? operRecord.get('name') : '');

	            PSGP.APM.SPM.dataStores.summaryAggregationGrid.loadData(endToEndSummaryData.stats, false);

	            Ext4.getCmp('psgp-apm-spm-subpanel-endtoendsummary').setLoading(false);
	        },

	        summaryAggregationGrid : Ext4.create('Ext4.data.Store', {
	            id: 'summaryAggregationGrid',
	            storeId : 'id',
	            model : 'PSGP.APM.SPM.Model.summaryAggregationGrid'
	        }),

	        setUpSummaryData : Ext4.create('Ext4.data.Store', {
	            id : 'setUpSummaryData',
	            storeId : 'id',
	            fields : ['id', 'name', 'description', 'show'],
	            data : [
	                    {
	                        id: 'setup_ave'
	                      , name: APMTranslation.apm.pts.label.meanaverage()
	                      , description: APMTranslation.apm.pts.description.average()
	                      , show: true
	                    },
	                    {
	                        id: 'setup_med'
	                      , name: APMTranslation.apm.common.label.median()
	                      , description: APMTranslation.apm.pts.description.median()
	                      , show: true
	                    },
	                    {
	                        id: 'setup_sd'
	                      , name: APMTranslation.apm.pts.label.standarddeviation()
	                      , description: APMTranslation.apm.pts.description.standarddeviation()
	                      , show: true
	                    },
	                    {
	                        id: 'setup_95p'
	                      , name: APMTranslation.apm.common.label._95thpercentile()
	                      , description: APMTranslation.apm.pts.description._95thpercentile()
	                      , show: true
	                    }
	            ]
	        }),

	        endToEndTimePaging : Ext4.create('Ext4.data.Store', {
	            id : 'endToEndTimePaging',
	            fields : ['id', 'name'],
	            data : [{ id: 1, name: ' '}]
	        }),

	};
}