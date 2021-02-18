/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       14 May 2014     maquino          Initial version
 * 2.00       15 May 2014     maquino          Updated scheduledScriptData store to match restlet
 * 3.00       16 May 2014     jmarimla         Added callSSIRestlet function to get data from restlet
 * 4.00       19 May 2014     jmarimla         Added chartComboBox store
 * 5.00       19 May 2014     maquino          Added scriptCountData store
 * 6.00       20 May 2014     jmarimla         Added utilizationData store
 * 7.00       29 May 2014     maquino          Added scriptStatusComboBox store
 * 8.00       02 Jun 2014     jmarimla         Retrieve timeline chart data from ajax request
 * 9.00       03 Jun 2014     maquino          Added value field in scriptStatusComboBox store
 *                                             Cleared data from store before loading
 *                                             Added params and method in Ajax request
 *                                             Added params in callSSIRestlet function
 * 10.00      04 Jun 2014     jmarimla         Added sleep, waitforstores and refresh function
 * 11.00      06 Jun 2014     maquino          Added loading of params
 * 12.00      09 Jun 2014     jmarimla         Set totalSSI and limitSSI
 *                                             Add new function checkSSIlimit to check if data reached the 24k limit
 * 13.00      10 Jun 2014     jmarimla         Added switching of chart in refresh function
 *                                             Hide loading screen at end of refresh function
 * 14.00      16 Jun 2014     jmarimla         Set ajax call timeout to 3 mins
 *                                             Added error message for ajax timeout
 *                                             Initialized params to default when ajax timeouts
 * 15.00      26 Jun 2014     jmarimla         Added perftestlogger checkpoint
 * 16.00      07 Aug 2014     rwong            Added default sort upon grid load, added copyright.
 * 17.00      07 Aug 2014     jmarimla         Removed status in params
 * 18.00      13 Aug 2014     jmarimla         Added aggregatedGridData store; removed scheduledscriptdata store
 *                                             Changed params to startDate and endDate
 *                                             Remove references to grid data in ajax call
 * 19.00      15 Aug 2014     jmarimla         Modified aggregatedGridData to support pagination
 * 20.00      20 Aug 2014     jmarimla         Increased grid rows per page to 11
 * 21.00      26 Aug 2014     rwong            Fix issue with the sorter not working.
 * 22.00      27 Aug 2014     jmarimla         Added new store, schedScriptInstances
 *                                             Always pass parameters for aggregatedGridData requests
 * 23.00      29 Aug 2014     rwong            Added function for saving of settings data.
 * 24.00      01 Sep 2014     jmarimla         Added function for setting values of UI components
 * 25.00      03 Sep 2014     rwong            Added support for saving of filters and summary page saving.
 * 26.00      08 Sep 2014     jmarimla         Added new store ssiPaging; loads ssiPaging onload of ssi details
 * 27.00      09 Sep 2014     jmarimla         Added summaryPaging, loads summaryPaging onload of aggregated grid data
 *                                             Increased timeout of store proxies
 * 28.00      12 Sep 2014     jmarimla         Update page label on load of stores                                            
 *
 */

var rowsPerPage = 11;

PSGP.SQM.dataStores = {
        isLoaded : function() {
            var ready = true;

            //check if auto loaded stores are ready
            var requiredStores = [
                                  'aggregatedGridData'
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
            callSSIRestlet : false
        },

        restletResult : {
            successSSIRestlet : false
        },

        sleep : 0,

        params : null,

        getParams : function () {
            return this.params;
        },

        waitForStores : function () {
            if (PSGP.SQM.dataStores.isLoaded()) {
                console.log('READY');
                clearTimeout(PSGP.SQM.dataStores.sleep);
                PSGP.SQM.dataStores.refresh();
            } else {
                console.log('WAITING...');
                PSGP.SQM.dataStores.sleep = setTimeout(PSGP.SQM.dataStores.waitForStores, 100);
            }
        },

        refresh : function() {
            Ext4.getCmp('psgp-sqm-main').doLayout();
            timelineChartUtil.refreshChart();

            perfTestLogger.stop();

            PSGP.SQM.dataStores.setChartComponents();
            PSGP.SQM.dataStores.checkSSIlimit();

            Ext4.getCmp('psgp-sqm-main').setLoading(false);
        },

        totalSSI : 0,

        limitSSI : 24000, // defined limit for SSI: 24k

        timeoutSSI : 180000, // defined timeout for SSI: 3 mins

        checkSSIlimit : function () {
            if (PSGP.SQM.dataStores.restletResult.successSSIRestlet) {
                if (PSGP.SQM.dataStores.totalSSI >= PSGP.SQM.dataStores.limitSSI) {
                    alert('Results exceed 24000 scheduled script instances. Kindly refine your search options.');
                }
                if (PSGP.SQM.dataStores.totalSSI == 0) {
                    alert('No scheduled script instances retrieved.');
                }
            }
        },

        callSettingsRestlet : function (settingsParam) {
            var timeoutSSI = this.timeoutSSI;
            Ext4.Ajax.request({
                url: '/app/site/hosting/restlet.nl?script=customscript_sqm_ss_settings&deploy=customdeploy_sqm_ss_settings',
                timeout: timeoutSSI,
                params : JSON.stringify(settingsParam),
                method: 'POST',
                headers : {'Content-Type' : 'application/json'}
            });
        },

        callSSIRestlet : function (dataParams) {
            var timeoutSSI = this.timeoutSSI;
            var ready = this.restletReady;
            var result = this.restletResult;
            ready.callSSIRestlet = false;
            result.successSSIRestlet = false;
            var startSSIRestlet = new Date().getTime();

            var chartCountData = this.scriptCountData;
            var utilizationData = this.utilizationData;
            //console.log(dataParams);

            Ext4.Ajax.request({
                url: '/app/site/hosting/restlet.nl?script=customscript_sqm_ss_schedscripts&deploy=customdeploy_sqm_ss_schedscripts',
                timeout : timeoutSSI, //default: 30000 (30 secs)
                params : dataParams,
                method: 'GET',
                success: function(response) {
                    //console.log(response.responseText);
                    var jsonResponse = Ext4.decode(response.responseText);

                    utilizationData.removeAll();
                    chartCountData.removeAll();

                    PSGP.SQM.dataStores.totalSSI = jsonResponse.data.totalSSI;

                    chartCountData.loadData(jsonResponse.data.scriptCountStore);
                    utilizationData.loadData(jsonResponse.data.utilizationStore);
                    timelineData.records = jsonResponse.data.timelineStore;
                    timelineData.renderQueue = jsonResponse.data.renderQueue;
                    PSGP.SQM.dataStores.params = jsonResponse.data.paramsStore;

                    PSGP.SQM.dataStores.callSettingsRestlet(jsonResponse.data.paramsStore);
                    PSGP.SQM.dataStores.filters = jsonResponse.data.paramsStore.filters;
                    PSGP.SQM.dataStores.summary = jsonResponse.data.paramsStore.summary;

                    ready.callSSIRestlet = true;
                    result.successSSIRestlet = true;
                },
                failure : function(response) {
                    console.log('callSSIRestlet failed: '+ response.responseText);

                    var failureMS = (new Date().getTime()) - startSSIRestlet;
                    if (failureMS > (timeoutSSI - 3000)) { //3-second margin
                        //message for search timeout error
                        alert('Your search has timed out. Please refine your search and try again.');
                    } else {
                        //generic message for other search errors
                        alert('Error encountered in search');
                    }

                    function convertDateToStringFormat (date) {
                        var dateStr = (date.getMonth()+1) + '-' + date.getDate() + '-' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
                        return dateStr;
                    }

                    var today = new Date();
                    today.setHours(0,0,0,0);
                    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                    tomorrow.setHours(0,0,0,0);
                    PSGP.SQM.dataStores.params = {
                            startDate : convertDateToStringFormat(today),
                            endDate : convertDateToStringFormat(tomorrow),
                            chart : 'S'
                    };

                    ready.callSSIRestlet = true;
                    result.successSSIRestlet = false;
                }
            });
            this.aggregatedGridData.loadPage(1);
        },

        setFieldComponents : function () {
            var params = PSGP.SQM.dataStores.getParams();
            var start = params.startDate;
            var end = params.endDate;
            var chart = params.chart;

            var startdate = this.convertStringToDateFormat(start);
            Ext4.getCmp('psgp-sqm-options-date-startdate').setValue(startdate);
            Ext4.getCmp('psgp-sqm-options-time-starttime').setValue(this.convertTimeToString(startdate.getHours(), startdate.getMinutes()));

            var enddate = this.convertStringToDateFormat(end);
            Ext4.getCmp('psgp-sqm-options-date-enddate').setValue(enddate);
            Ext4.getCmp('psgp-sqm-options-time-endtime').setValue(this.convertTimeToString(enddate.getHours(), enddate.getMinutes()));

            Ext4.getCmp('psgp-sqm-options-combobox-charttype').suspendEvents();
            Ext4.getCmp('psgp-sqm-options-combobox-charttype').setValue(chart);
            Ext4.getCmp('psgp-sqm-options-combobox-charttype').resumeEvents();
        },

        setChartComponents : function (chartType) {
            var params = PSGP.SQM.dataStores.getParams();
            var start = params.startDate;
            var end = params.endDate;
            var chart = (chartType)? chartType : params.chart;

            var startdate = this.convertStringToDateFormat(start);
            var enddate = this.convertStringToDateFormat(end);

            var chartArea = Ext4.getCmp('psgp-sqm-chartarea');
            var dateRangeDisplay = Ext4.getCmp('psgp-sqm-display-daterange');
            switch(chart){
            case 'S' :
                chartArea.getLayout().setActiveItem('psgp-sqm-card-scriptcount');
                Ext4.getCmp('psgp-sqm-chart-scriptcount').redraw();
                dateRangeDisplay.setRawValue(Ext4.Date.format(startdate,'m/d/Y g:i A') + ' - ' + Ext4.Date.format(enddate,'m/d/Y g:i A'));
                break;
            case 'U' :
                chartArea.getLayout().setActiveItem('psgp-sqm-card-utilization');
                Ext4.getCmp('psgp-sqm-chart-utilization').redraw();
                dateRangeDisplay.setRawValue(Ext4.Date.format(startdate,'m/d/Y g:i A') + ' - ' + Ext4.Date.format(enddate,'m/d/Y g:i A'));
                break;
            case 'T' :
                chartArea.getLayout().setActiveItem('psgp-sqm-card-timeline');
                if(this.daysBetween(startdate, enddate) > 3){
                    var startdate3days = new Date(startdate.getTime() + 1000 * 60 * 60 * 24 * 3);
                    dateRangeDisplay.setRawValue(Ext4.Date.format(startdate,'m/d/Y g:i A') + ' - ' + Ext4.Date.format(startdate3days,'m/d/Y g:i A'));
                    alert("Timeline Chart data only shows 3 days from Start Date.");
                } else {
                    dateRangeDisplay.setRawValue(Ext4.Date.format(startdate,'m/d/Y g:i A') + ' - ' + Ext4.Date.format(enddate,'m/d/Y g:i A'));
                }
                break;
            default : console.log('invalid chart type value');
            }
        },

        convertStringToDateFormat : function(dateStr) {
            var convertedDate = '';
            var datetime = dateStr.replace('T', ',').replace(/-/g,'/').replace(' ', ',').split(',');
            var date = datetime[0].split('/');
            var time = datetime[1].split(':');
            convertedDate = new Date(date[0], date[1]-1, date[2], time[0], time[1], time[2] ? time[2] : 0);
            return convertedDate;
        },

        convertTimeToString : function(hour, minutes){
            var time = '';
            minutes = minutes > 9 ? minutes : '0' + minutes;
            if(hour == 0)
                time = '12:' + minutes + ' AM';
            else if(hour <= 11)
                time = hour + ':' + minutes + ' AM';
            else if(hour == 12)
                time = hour + ':' + minutes + ' PM';
            else if(hour > 12)
                time = (hour-12) + ':' + minutes + ' PM';
            return time;
        },

        daysBetween : function (date1, date2) {
            // The number of milliseconds in one day
            var ONE_DAY = 1000 * 60 * 60 * 24
            // Convert both dates to milliseconds
            var date1_ms = date1.getTime();
            var date2_ms = date2.getTime();
            // Calculate the difference in milliseconds
            var difference_ms = Math.abs(date1_ms - date2_ms)
            // Convert back to days and return
            return Math.round(difference_ms/ONE_DAY)
        },

        scriptCountData : Ext4.create('Ext4.data.Store', {
            id : 'scriptCountData',
            model : 'PSGP.SQM.Model.scriptCountData',
            isLoaded : true,
            listeners : {
                load : function(store, records, success) {
                    store.isLoaded = true;
                }
            }
        }),

        utilizationData : Ext4.create('Ext4.data.Store', {
            id : 'utilizationData',
            model : 'PSGP.SQM.Model.utilizationData',
            isLoaded : true,
            listeners : {
                load : function(store, records, success) {
                    store.isLoaded = true;
                }
            }
        }),

        aggregatedGridData : Ext4.create('Ext4.data.Store', {
            id : 'aggregatedGridData',
            model : 'PSGP.SQM.Model.aggregatedGridData',
            pageSize : rowsPerPage,
            remoteSort : true,
            isLoaded : true,
            proxy : {
                type : 'rest',
                url : '/app/site/hosting/restlet.nl?script=customscript_sqm_ss_grid&deploy=customdeploy_sqm_ss_grid',
                timeout : 180000,
                reader : {
                    type : 'json',
                    root : 'data',
                    idProperty : 'id',
                    totalProperty : 'total'
                },
                simpleSortMode : true
            },
            listeners : {
                beforeload : function (store, operation, eOpts) {
                    store.isLoaded = false;
                    store.proxy.extraParams = PSGP.SQM.dataStores.params;
                },
                load : function (store, records, success, eOpts) {
                    if (!success) {
                        alert('Error encountered in search');
                        store.loadData({}, false);
                        return false;
                    }
                    store.isLoaded = true;
                    var response = store.proxy.reader.jsonData;
                    var summaryPages = response.pages;
                    PSGP.SQM.dataStores.summaryPaging.loadData(summaryPages);
                    var currPage = store.currentPage;
                    Ext4.getCmp('psgp-sqm-combobox-summarypaging').suspendEvents();
                    Ext4.getCmp('psgp-sqm-combobox-summarypaging').setValue(currPage);
                    Ext4.getCmp('psgp-sqm-combobox-summarypaging').resumeEvents();
                    var totalPages = response.total;
                    Ext4.getCmp('psgp-sqm-totalpages-summary').setValue(totalPages);
                },
            },
            sorters : [{
                property : 'deploymentName',
                direction : 'ASC'
            }]
        }),

        schedScriptInstances : Ext4.create('Ext4.data.Store', {
            id : 'schedScriptInstances',
            model : 'PSGP.SQM.Model.SchedScriptInstances',
            pageSize : rowsPerPage,
            remoteSort : true,
            isLoaded : true,
            proxy : {
                type : 'rest',
                url : '/app/site/hosting/restlet.nl?script=customscript_sqm_ss_ssidetails&deploy=customdeploy_sqm_ss_ssidetails',
                timeout : 180000,
                reader : {
                    type : 'json',
                    root : 'data',
                    idProperty : 'id',
                    totalProperty : 'total'
                },
                simpleSortMode : true
            },
            listeners : {
                beforeload : function (store, operation, eOpts) {
                    store.proxy.extraParams.startDate = PSGP.SQM.dataStores.params.startDate;
                    store.proxy.extraParams.endDate = PSGP.SQM.dataStores.params.endDate;
                    store.proxy.extraParams.deploymentId = PSGP.SQM.dataStores.params.deploymentId;
                    store.proxy.extraParams.queue = PSGP.SQM.dataStores.params.queue;
                },
                load : function (store, records, success, eOpts) {
                    if (!success) {
                        alert('Error encountered in search');
                        store.loadData({}, false);
                        return false;
                    }
                    var response = store.proxy.reader.jsonData;
                    var ssiPages = response.pages;
                    PSGP.SQM.dataStores.ssiPaging.loadData(ssiPages);
                    var currPage = store.currentPage;
                    Ext4.getCmp('psgp-sqm-combobox-ssipaging').suspendEvents();
                    Ext4.getCmp('psgp-sqm-combobox-ssipaging').setValue(currPage);
                    Ext4.getCmp('psgp-sqm-combobox-ssipaging').resumeEvents();
                    var totalPages = response.total;
                    Ext4.getCmp('psgp-sqm-totalpages-ssi').setValue(totalPages);
                }
            },
            sorters : [{
                property : 'dateCreated',
                direction : 'ASC'
            }]
        }),

        scriptStatusComboBox : Ext4.create('Ext4.data.Store', {
            id : 'scriptStatusComboBox',
            fields : ['name', 'value'],
            data : [
                    { 'name': 'Pending', 'value': 'PENDING' },
                    { 'name': 'Processing', 'value': 'PROCESSING' },
                    { 'name': 'Failed', 'value': 'FAILED' },
                    { 'name': 'Complete', 'value': 'COMPLETE' },
                    { 'name': 'Retry', 'value': 'RETRY' }
                    ]
        }),

        chartComboBox : Ext4.create('Ext4.data.Store', {
            id : 'chartComboBox',
            fields : ['id', 'name'],
            data : [
                    { 'id': 'S', 'name': 'Script Count' },
                    { 'id': 'U', 'name': 'Utilization' },
                    { 'id': 'T', 'name': 'Timeline' }
                    ]
        }),
        
        ssiPaging : Ext4.create('Ext4.data.Store', {
            id : 'ssiPaging',
            fields : ['id', 'name']
        }),
        
        summaryPaging : Ext4.create('Ext4.data.Store', {
            id : 'summaryPaging',
            fields : ['id', 'name']
        })
};