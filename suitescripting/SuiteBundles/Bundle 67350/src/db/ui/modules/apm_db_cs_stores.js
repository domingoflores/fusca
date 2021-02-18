/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Jan 2015     jmarimla         Initial
 * 2.00       28 Jan 2015     jmarimla         Retrieve record charts data
 * 3.00       05 Feb 2015     jmarimla         Retrieve chart config
 * 4.00       03 Mar 2015     jmarimla         Enable sorting and date range for record tiles
 * 5.00       10 Mar 2015     rwong            Created store for setup record pages
 * 6.00       12 Mar 2015     jmarimla         Store recordchartsparams
 * 7.00       16 Mar 2015     jmarimla         Navigate to page 1 after refresh
 * 8.00       17 Mar 2015     jmarimla         load recordtype from suitelet, css changes
 * 9.00       23 Mar 2015     jmarimla         Exact search for recordtype, added sorting for delta from baseline
 * 10.00      27 Mar 2015     jmarimla         Removed seconds for SPM compatibility
 * 11.00      21 Apr 2015     jmarimla         Support for getting and saving general setup
 * 12.00      23 Apr 2015     rwong            Renamed setuprecordpages into watchlist and added support for custom date time
 * 13.00      27 Apr 2015     jmarimla         Include custom date range in date range dropdown
 * 14.00      29 Apr 2015     jmarimla         Adjusted resolution values
 * 15.00      15 May 2015     jmarimla         Pass testmode parameter
 * 16.00      01 Jul 2015     jmarimla         Updated loading masks
 * 17.00      02 Jul 2015     jmarimla         Modified date format for custom date
 * 18.00      23 Jul 2015     jmarimla         Update record names of tiles; Sorting for record type and operation
 * 19.00      06 Aug 2015     rwong            Clear refresh date text if custom date range is selected
 * 20.00      11 Aug 2015     jmarimla         Support for company filter
 * 21.00      28 Aug 2015     jmarimla         Passed compfil to store calls
 * 22.00      08 Sep 2015     jmarimla         Replaced Date.parse with custom function
 * 23.00      16 Sep 2015     jmarimla         Hide highest delta from baseline
 * 24.00      23 Nov 2015     jmarimla         Added personalize panel store
 * 25.00      03 Dec 2015     rwong            Fixed for incorrect offset during DST
 * 26.00      26 Aug 2016     rwong            ScheduledScriptUsage portlet
 * 27.00      02 Oct 2017     jmarimla         Remove sched script portlet
 * 28.00      29 Jun 2018     jmarimla         Translation readiness
 *
 */

function APMStores() {
    PSGP.APM.DB.dataStores = {

            isLoaded: function () {
                var ready = true;

                //check if auto loaded stores are ready
                var requiredStores = [
                    'recordTypes',
                    'recordTilesData',
                    'setUpWatchList',
                    'setUpCustomDateTime'
                ];
                for (var i = 0; i < requiredStores.length; i++) {
                    if (!Ext4.StoreManager.get(requiredStores[i]).isLoaded) {
                        ready = false;
                    }
                }

                //check if ajax calls are ready
                var ajaxReady = this.ajaxReady;
                for (var key in ajaxReady) {
                    if (ajaxReady.hasOwnProperty(key) && (!ajaxReady[key])) {
                        ready = false;
                    }
                }

                return ready;
            },

            ajaxReady: {
                setupGeneral: false
            },

            recordTilesParams: {},

            recordChartsParams: {},

            recordTilesChartConfig: {},

            setupGeneral: {},

            personalizePanel: Ext4.create('Ext4.data.Store', {
                id: 'personalizePanel',
                model: 'PSGP.APM.DB.Model.personalizePanel',
                data: [{
                    id: 'dummy',
                    cardId: 'card-standardcontent',
                    buttonIcon: 'customportlet',
                    buttonText: 'Dummy',
                    show: false
                }, {
                    id: 'recordpages',
                    cardId: 'card-standardcontent',
                    buttonIcon: 'reportsnapshot',
                    buttonText: 'Record Pages',
                    show: true
                }]
            }),

            recordTilesData: Ext4.create('Ext4.data.Store', {
                id: 'recordTilesData',
                model: 'PSGP.APM.DB.Model.recordTilesData',
                isLoaded: true,
                isRefreshed: false,
                proxy: {
                    type: 'rest',
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_db_sl_record_tile&deploy=customdeploy_apm_db_sl_record_tile&testmode=' + TEST_MODE,
                    timeout: 180000,
                    reader: {
                        type: 'json',
                        root: 'data'
                    }
                },
                listeners: {
                    beforeload: function (store, operation, eOpts) {
                        store.isLoaded = false;
                        store.proxy.extraParams = PSGP.APM.DB.dataStores.recordTilesParams;
                        store.proxy.extraParams.compfil = COMP_FIL;
                    },
                    load: function (store, records, success, eOpts) {
                        store.isLoaded = true;
                        var refreshed = store.isRefreshed;
                        store.isRefreshed = false;
                        if (!success) {
                            alert(APMTranslation.apm.common.alert.errorinsearch());
                            store.loadData({}, false);
                            if (refreshed) Ext4.getCmp('psgp-apm-db-portlet-recordpages').setLoading(false);
                            return false;
                        }
                        var response = store.proxy.reader.jsonData;
                        PSGP.APM.DB.dataStores.recordTilesChartConfig.startDateMS = response.config.startDateMS;
                        PSGP.APM.DB.dataStores.recordTilesChartConfig.endDateMS = response.config.endDateMS;
                        PSGP.APM.DB.dataStores.recordTilesChartConfig.intervalMS = response.config.intervalMS;
                        PSGP.APM.DB.dataStores.recordTilesChartConfig.histogramTicks = response.config.histogramTicks;
                        PSGP.APM.DB.dataStores.recordTilesChartConfig.groupAggMS = response.config.groupAggMS;

                        var dateRangeId = Ext4.getCmp('psgp-apm-db-combo-recorddaterange').getValue();
                        var refreshDateText = '';
                        if (isNaN(dateRangeId)) { //custom date range
                            refreshDateText = "";
                        } else { //default date range
                            refreshDateText = APMTranslation.apm.common.label.asof({params: [response.config.endDateStr]});
                        }
                        Ext4.getCmp('psgp-apm-db-display-refreshdate').setValue(refreshDateText);

                        store.updateRecordNames();

                        if (refreshed) {
                            var carousel = Ext4.getCmp('psgp-apm-db-records-carousel');
                            carousel.updateData();
                            carousel.showChild(0);
                            Ext4.getCmp('psgp-apm-db-portlet-recordpages').setLoading(false);
                        }
                    }
                },
                sortByCombobox: function () {
                    var store = this;
                    var property = Ext4.getCmp('psgp-apm-db-combo-recordsorting').getValue();
                    if (!property) property = 'logsTotal';
                    switch (property) {
                    case 'logsTotal':
                    case 'usersTotal':
                    case 'totaltimeMed':
                    case 'baselineMedPercent':
                        store.sort({
                            direction: 'DESC',
                            property: property
                        });
                        break;
                    case 'recordName':
                        store.sort({
                            direction: 'ASC',
                            property: 'oper'
                        });
                        store.sort({
                            direction: 'ASC',
                            property: 'recordName'
                        });
                        break;
                    case 'oper':
                        store.sort({
                            direction: 'ASC',
                            property: 'recordName'
                        });
                        store.sort({
                            direction: 'ASC',
                            property: 'oper'
                        });
                        break;
                    default:
                        store.sort({
                            direction: 'DESC',
                            property: 'logsTotal'
                        });
                        break;
                    }
                },
                updateRecordNames: function () {
                    var me = this;
                    me.each(function (record, index) {
                        var recordType = PSGP.APM.DB.dataStores.recordTypes.findRecord('id', record.get('record'), null, null, null, true);
                        var recordTypeName = (recordType) ? recordType.get('name') : APMTranslation.apm.db.label.unknown();
                        record.set('recordName', recordTypeName);
                    });
                    me.commitChanges();
                }
            }),

            recordTypes: Ext4.create('Ext4.data.Store', {
                id: 'recordTypes',
                fields: ['id', 'name'],
                isLoaded: true,
                sortOnLoad: true,
                sorters: {
                    property: 'name'
                },
                proxy: {
                    type: 'rest',
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sl_recordtypes&deploy=customdeploy_apm_sl_recordtypes',
                    timeout: 180000,
                    reader: {
                        type: 'json',
                        root: 'data'
                    }
                },
                listeners: {
                    beforeload: function (store, operation, eOpts) {
                        store.isLoaded = false;
                        store.proxy.extraParams.compfil = COMP_FIL;
                    },
                    load: function (store, records, success, eOpts) {
                        store.isLoaded = true;
                        if (!success) {
                            alert(APMTranslation.apm.common.alert.errorinsearch());
                            store.loadData({}, false);
                            return false;
                        }
                    }
                }
            }),

            refreshRecordTileCharts: function () {
                Ext4.getCmp('psgp-apm-db-portlet-recordpages').setLoading(MASK_CONFIG);
                Ext4.getCmp('psgp-apm-db-subpanel-recordcharts').hide();

                var endDateMS = 0;
                var startDateMS = 0;
                var dateRangeId = Ext4.getCmp('psgp-apm-db-combo-recorddaterange').getValue();

                if (isNaN(dateRangeId)) { //custom date range
                    var dateSplit = dateRangeId.split('_');
                    var startDateWithOffsetObj = this.convertDateStringToDateObject(dateSplit[0]);
                    var endDateWithOffsetObj = this.convertDateStringToDateObject(dateSplit[1]);
                    startDateMS = startDateWithOffsetObj.getTime() - (startDateWithOffsetObj.getTimezoneOffset() * 60 * 1000) + parseInt(OFFSET_MS, 10);
                    endDateMS = endDateWithOffsetObj.getTime() - (endDateWithOffsetObj.getTimezoneOffset() * 60 * 1000) + parseInt(OFFSET_MS, 10);
                } else { //default date range
                    endDateMS = new Date().setSeconds(0, 0);
                    startDateMS = endDateMS - dateRangeId;
                }

                PSGP.APM.DB.dataStores.recordTilesParams = {
                    startDateMS: startDateMS,
                    endDateMS: endDateMS
                };
                PSGP.APM.DB.dataStores.recordTilesData.isRefreshed = true;
                PSGP.APM.DB.dataStores.recordTilesData.load();
            },

            getRecordTileCharts: function (recordTileInner) {
                var carousel = Ext4.getCmp('psgp-apm-db-records-carousel');
                var tileIndex = recordTileInner.tileIndex;
                // if same tile is selected
                if ((carousel.selectedTile == tileIndex)) return;
                // if there is previously selected tile
                if (carousel.selectedTile > -1) {
                    var oldRecordTileOuter = Ext4.ComponentQuery.query('#' + carousel.id + ' #recordtile-outer')[carousel.selectedTile];
                    oldRecordTileOuter.removeCls('apm-db-recordtile-outer-selected');
                }
                var recordTileOuter = Ext4.ComponentQuery.query('#' + carousel.id + ' #recordtile-outer')[tileIndex];
                recordTileOuter.addCls('apm-db-recordtile-outer-selected');
                carousel.selectedTile = tileIndex;

                var record = PSGP.APM.DB.dataStores.recordTilesData.getAt(tileIndex);
                var recordTypeName = record.get('recordName');
                var recordOper = record.get('oper');
                switch(recordOper) {
                    case 'new'  : recordOper = APMTranslation.apm.common.label.new(); break;
                    case 'edit' : recordOper = APMTranslation.apm.common.label.edit(); break;
                    case 'save' : recordOper = APMTranslation.apm.common.label.save(); break;
                    case 'view' : recordOper = APMTranslation.apm.common.label.view(); break;
                }

                Ext4.getCmp('psgp-apm-db-subpanel-recordcharts').setLoading(MASK_CONFIG);
                Ext4.getCmp('psgp-apm-db-subpanel-recordcharts').show();
                Ext4.getCmp('psgp-apm-db-recordcharts-title').setValue(recordTypeName);
                Ext4.getCmp('psgp-apm-db-recordcharts-title-oper').setValue(recordOper.charAt(0).toUpperCase() + recordOper.slice(1));

                this.recordChartsParams = {
                    recordtype: record.get('record'),
                    oper: record.get('oper'),
                    startDateMS: this.recordTilesParams.startDateMS,
                    endDateMS: this.recordTilesParams.endDateMS
                };
                this.callRecordChartsRestlet();

            },

            callRecordChartsRestlet: function () {

                var dataParams = this.recordChartsParams;

                Ext4.Ajax.request({
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_db_sl_record_charts&deploy=customdeploy_apm_db_sl_record_charts&testmode=' + TEST_MODE + '&compfil=' + COMP_FIL,
                    timeout: 180000,
                    params: dataParams,
                    method: 'GET',
                    success: function (response) {
                        var jsonResponse = Ext4.decode(response.responseText);
                        if (jsonResponse.success) {
                            PSGP.APM.DB.Highcharts.recordTileData = jsonResponse.data;
                            PSGP.APM.DB.Highcharts.renderRecordThroughputChart(jsonResponse.data.throughput);
                            PSGP.APM.DB.Highcharts.renderRecordResponseTimeChart(jsonResponse.data.responseTime);
                            PSGP.APM.DB.Highcharts.renderRecordUEWFBreakdownChart(jsonResponse.data.UEWFBreakdown);
                            PSGP.APM.DB.Highcharts.renderRecordHistogramChart(jsonResponse.data.histogram);
                        } else {
                            if (jsonResponse.message) alert(jsonResponse.message);
                        }
                        Ext4.getCmp('psgp-apm-db-subpanel-recordcharts').setLoading(false);
                    },
                    failure: function (response) {
                        console.log('callRecordChartsRestlet failed: ' + response.responseText);
                        Ext4.getCmp('psgp-apm-db-subpanel-recordcharts').setLoading(false);
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                    }
                });
            },

            recordDateRangeComboBox: Ext4.create('Ext4.data.Store', {
                id: 'recordDateRangeComboBox',
                fields: ['name', 'id'],
                updateData: function () {
                    var me = this;
                    me.removeAll();
                    var defaultData = [{
                        'name': APMTranslation.apm.common.label.last1hour(),
                        'id': 1000 * 60 * 60
                    }, {
                        'name': APMTranslation.apm.common.label.last3hours(),
                        'id': 1000 * 60 * 60 * 3
                    }, {
                        'name': APMTranslation.apm.common.label.last6hours(),
                        'id': 1000 * 60 * 60 * 6
                    }, {
                        'name': APMTranslation.apm.common.label.last12hours(),
                        'id': 1000 * 60 * 60 * 12
                    }, {
                        'name': APMTranslation.apm.common.label.last24hours(),
                        'id': 1000 * 60 * 60 * 24
                    }, {
                        'name': APMTranslation.apm.common.label.last3days(),
                        'id': 1000 * 60 * 60 * 24 * 3
                    }, {
                        'name': APMTranslation.apm.common.label.last7days(),
                        'id': 1000 * 60 * 60 * 24 * 7
                    }, {
                        'name': APMTranslation.apm.common.label.last14days(),
                        'id': 1000 * 60 * 60 * 24 * 14
                    }, {
                        'name': APMTranslation.apm.common.label.last30days(),
                        'id': 1000 * 60 * 60 * 24 * 30
                    }];

                    var customDateTime = PSGP.APM.DB.dataStores.customDateTime;
                    customDateTime.each(function (record, index) {
                        var startdate = record.get('startdate');
                        var starttime = record.get('starttime');
                        var enddate = record.get('enddate');
                        var endtime = record.get('endtime');

                        var formatDate = function (date) {
                            var dateSplit = date.split('-');
                            var tempDate = new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2], 0, 0, 0);
                            return Ext4.Date.format(tempDate, 'M j');
                        };

                        var formatTime = function (time) {
                            var timeSplit = time.split(':');
                            var tempDate = new Date(1970, 0, 1, timeSplit[0], timeSplit[1], 0);
                            return Ext4.Date.format(tempDate, 'g:i A');
                        };

                        var name = formatDate(startdate) + ' ' + formatTime(starttime) + ' - ' + formatDate(enddate) + ' ' + formatTime(endtime);
                        var id = startdate + 'T' + starttime + '_' + enddate + 'T' + endtime;

                        defaultData.push({
                            name: name,
                            id: id
                        });

                    });

                    me.loadData(defaultData);
                    me.commitChanges();
                }
            }),

            recordSortingComboBox: Ext4.create('Ext4.data.Store', {
                id: 'recordSortingComboBox',
                fields: ['name', 'id'],
                data: [{
                        'name': APMTranslation.apm.db.label.mostutilized(),
                        'id': 'logsTotal'
                    }, {
                        'name': APMTranslation.apm.common.label.mostusers(),
                        'id': 'usersTotal'
                    }, {
                        'name': APMTranslation.apm.db.label.highestresponsetime(),
                        'id': 'totaltimeMed'
                    }
                    //, { 'name': 'Highest Delta From Baseline', 'id': 'baselineMedPercent'}
                    , {
                        'name': APMTranslation.apm.common.label.recordtype(),
                        'id': 'recordName'
                    }, {
                        'name': APMTranslation.apm.common.label.operation(),
                        'id': 'oper'
                    }
                ]
            }),

            watchList: Ext4.create('Ext4.data.Store', {
                id: 'setUpWatchList',
                fields: ['internalid', 'recordtype', 'operation'],
                isLoaded: true,
                isSynced: true,
                proxy: {
                    type: 'ajax',
                    batchActions: true,
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_db_sl_setup_recordpages&deploy=customdeploy_apm_db_sl_setup_recordpages',
                    timeout: 180000,
                    reader: {
                        type: 'json',
                        root: 'data'
                    },
                    writer: {
                        type: 'json',
                        allowSingle: false
                    }
                },
                listeners: {
                    beforesync: function () {
                        this.isSynced = false;
                    },
                    beforeload: function (store, operation, eOpts) {
                        store.isLoaded = false;
                    },
                    load: function (store, records, success, eOpts) {
                        store.isLoaded = true;
                    }
                },
            }),

            customDateTime: Ext4.create('Ext4.data.Store', {
                id: 'setUpCustomDateTime',
                fields: ['internalid', 'startdate', 'starttime', 'enddate', 'endtime'],
                isLoaded: true,
                isSynced: true,
                proxy: {
                    type: 'ajax',
                    batchActions: true,
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_db_sl_setup_date_range&deploy=customdeploy_apm_db_sl_setup_date_range',
                    timeout: 180000,
                    reader: {
                        type: 'json',
                        root: 'data'
                    },
                    writer: {
                        type: 'json',
                        allowSingle: false
                    }
                },
                listeners: {
                    beforesync: function () {
                        this.isSynced = false;
                    },
                    beforeload: function (store, operation, eOpts) {
                        store.isLoaded = false;
                    },
                    load: function (store, records, success, eOpts) {
                        store.isLoaded = true;
                        PSGP.APM.DB.dataStores.recordDateRangeComboBox.updateData();
                    }
                },
            }),

            getSetupGeneral: function () {

                PSGP.APM.DB.dataStores.ajaxReady.setupGeneral = false;

                Ext4.Ajax.request({
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_db_sl_setup_general&deploy=customdeploy_apm_db_sl_setup_general',
                    timeout: 180000,
                    method: 'GET',
                    success: function (response) {
                        var jsonResponse = Ext4.decode(response.responseText);
                        PSGP.APM.DB.dataStores.setupGeneral = jsonResponse.data;
                        PSGP.APM.DB.dataStores.ajaxReady.setupGeneral = true;
                    },
                    failure: function (response) {
                        console.log('getSetupGeneral failed: ' + response.responseText);
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        PSGP.APM.DB.dataStores.ajaxReady.setupGeneral = true;
                    }
                });
            },

            saveSetupGeneral: function (params) {

                PSGP.APM.DB.dataStores.ajaxReady.setupGeneral = false;

                Ext4.Ajax.request({
                    url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_db_sl_setup_general&deploy=customdeploy_apm_db_sl_setup_general',
                    timeout: 180000,
                    method: 'POST',
                    params: params,
                    success: function (response) {
                        var jsonResponse = Ext4.decode(response.responseText);
                        PSGP.APM.DB.dataStores.ajaxReady.setupGeneral = true;
                    },
                    failure: function (response) {
                        console.log('saveSetupGeneral failed: ' + response.responseText);
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        PSGP.APM.DB.dataStores.ajaxReady.setupGeneral = true;
                    }
                });
            },

            convertDateStringToDateObject: function (dateString) {
                if (!dateString) return null;
                return new Date(
                    parseInt(dateString.substring(0, 4), 10),
                    parseInt(dateString.substring(5, 7), 10) - 1,
                    parseInt(dateString.substring(8, 10), 10),
                    parseInt(dateString.substring(11, 13), 10),
                    parseInt(dateString.substring(14, 16), 10)
                );
            }
            
        };
}