/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Jan 2015     jmarimla         Initial
 * 2.00       15 Jan 2015     jmarimla         Enable update for carousel and record tiles data
 * 3.00       28 Jan 2015     jmarimla         Enable record tile selection
 * 4.00       07 Mar 2015     jmarimla         Added components for record pages toolbar
 * 5.00       10 Mar 2015     rwong            Added components for setup record pages
 * 6.00       11 Mar 2015     rwong            Added check for more than 10 records in the watchlist.
 *                                             TODO: Add check for duplicate data entry in watchlist
 * 7.00       12 Mar 2015     jmarimla         Added refresh after save of watchlist
 * 8.00       16 Mar 2015     jmarimla         Remove page reset in updateData of carousel
 * 9.00       21 Mar 2015     jmarimla         New UI for record tiles
 * 10.00      22 Mar 2015     jmarimla         Exact search in record types
 * 11.00      21 Apr 2015     jmarimla         UI for setup tabs and setup histogram interval
 * 12.00      23 Apr 2015     rwong            Updated code for watchlist and custom date time
 * 13.00      27 Apr 2015     jmarimla         Changed formatting of dates in custom date & time set up
 * 14.00      28 Apr 2015     jmarimla         Add cancel button minor ui changes for addwatchlist and addcustomdate windows
 * 15.00      29 Apr 2015     jmarimla         Adjusted width of sorting dropdown
 * 16.00      19 May 2015     jmarimla         Add component id
 * 17.00      01 Jul 2015     jmarimla         Updated loading masks
 * 18.00      23 Jul 2015     jmarimla         Move sorting inside updateData function
 * 19.00      25 Aug 2015     jmarimla         Defined comp id dropdown
 * 20.00      28 Aug 2015     jmarimla         Compid mode ui changes
 * 21.00      10 Sep 2015     jmarimla         Add setup option for record tiles
 * 22.00      12 Oct 2015     jmarimla         Date range validation
 * 23.00      21 Oct 2015     jmarimla         Remove page when zero record tiles
 * 24.00      05 Nov 2015     jmarimla         Define personalize panel; Added remove portlet option
 * 25.00      03 Dec 2015     rwong            Fixed for incorrect offset during DST
 * 26.00      21 Dec 2015     rwong            Added export functionality to the record pages portlet
 * 27.00      06 Jan 2015     jmarimla         Hide 'remove portlet'; Added 'General' section in set up
 * 28.00      29 Jun 2018     jmarimla         Translation readiness
 * 29.00      06 Jul 2018     jmarimla         Polishing translation
 * 30.00      26 Jul 2018     jmarimla         Translation string
 *
 */

function APMComponents() {
    Ext4.define('PSGP.APM.DB.Component.RecordsSubPanel', {
        extend: 'Ext4.panel.Panel',
        cls: 'apm-db-recordssubpanel',
    });

    Ext4.define('PSGP.APM.DB.Component.RecordsToolbar', {
        extend: 'Ext4.toolbar.Toolbar',
        border: false,
        cls: 'apm-db-recordstoolbar'
    });

    Ext4.define('PSGP.APM.DB.Component.CarouselPrevBtn', {
        extend: 'Ext4.button.Button',
        cls: 'apm-db-btn-carouselprev',
        handler: function () {
            Ext4.getCmp('psgp-apm-db-records-carousel').previousChild();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.CarouselNextBtn', {
        extend: 'Ext4.button.Button',
        cls: 'apm-db-btn-carouselnext',
        handler: function () {
            Ext4.getCmp('psgp-apm-db-records-carousel').nextChild();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.Carousel', {
        extend: 'Ext4.container.Container',
        layout: {
            type: 'hbox',
            align: 'stretch'
        },
        tilesPerPage: 5,
        maxPages: 4,
        currentPage: 0, //starts with zero
        selectedTile: -1,
        defaults: { flex: 1 },
        syncSizeToOwner: function () {
            var me = this;
            if (me.ownerCt) {
                me.setSize(me.ownerCt.el.getWidth() * me.items.items.length, me.ownerCt.el.getHeight());
                var item = me.items.items[me.currentPage];
                var left = item.el.getLeft() - me.el.getLeft();
                me.el.first().move('l', left, true);
            }
        },
        showChild: function (index) {
            var me = this;
            var item = me.items.items[index];
            var left = item.el.getLeft() - me.el.getLeft();
            me.el.first().move('l', left, true);
            me.currentPage = index;
            Ext4.getCmp('psgp-apm-db-display-recordstotal').updateValue();
        },
        nextChild: function () {
            var me = this;
            var newIndex = (me.currentPage+1 < me.maxPages) ? me.currentPage+1 : 0;
            me.showChild(newIndex);
        },
        previousChild: function () {
            var me = this;
            var newIndex = (me.currentPage > 0)? me.currentPage-1 : me.maxPages-1;
            me.showChild(newIndex);
        },
        onRender: function () {
            var me = this;

            if (me.ownerCt) {
                me.relayEvents(me.ownerCt, ['resize'], 'owner');
                me.on({
                    ownerresize: me.syncSizeToOwner
                });
            }
            me.callParent(arguments);
        },
        updateData : function () {
            var carousel = this;
            var recordTilesData = PSGP.APM.DB.dataStores.recordTilesData;
            recordTilesData.sortByCombobox();

            //Set record pages
            var totalTiles = recordTilesData.getCount();
            carousel.maxPages = (totalTiles > 0) ? Math.ceil(totalTiles/carousel.tilesPerPage) : 1;
            Ext4.getCmp('psgp-apm-db-display-recordstotal').updateValue();

            //deselect selected tiles
            if (carousel.selectedTile > -1) {
                var oldRecordTileOuter = Ext4.ComponentQuery.query('#'+carousel.id+' #recordtile-outer')[carousel.selectedTile];
                oldRecordTileOuter.removeCls('apm-db-recordtile-outer-selected');
                carousel.selectedTile = -1;
            }

            //Show/hide record tiles
            var recordTileInnerArray = Ext4.ComponentQuery.query('#'+this.id+' #recordtile-inner');
            for (var i in recordTileInnerArray) {
                if (i < totalTiles) {
                    recordTileInnerArray[i].show();
                    recordTileInnerArray[i].tileIndex = i;
                } else {
                    recordTileInnerArray[i].hide();
                    recordTileInnerArray[i].tileIndex = -1;
                }
            }

            //Set record tile values
            recordTilesData.each(function(record, index){
                var carouselIndex = Math.floor(index/carousel.tilesPerPage);
                var carouselPage = carousel.items.getAt(carouselIndex);
                var recordTile = carouselPage.items.getAt(index % carousel.tilesPerPage);

                var recordTypeName = record.get('recordName');
                var recordOper = record.get('oper');
                switch(recordOper) {
                    case 'new'  : recordOper = APMTranslation.apm.common.label.new(); break;
                    case 'edit' : recordOper = APMTranslation.apm.common.label.edit(); break;
                    case 'save' : recordOper = APMTranslation.apm.common.label.save(); break;
                    case 'view' : recordOper = APMTranslation.apm.common.label.view(); break;
                }

                var recordTileTitle = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-title')[0];
                var recordTileTitleTrunc = recordTypeName.substr(0,13);
                if (recordTypeName.length > 13) recordTileTitleTrunc = recordTileTitleTrunc + '...';
                recordTileTitle.setValue(recordTileTitleTrunc);
                var recordTileOper = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-title-oper')[0];
                recordTileOper.setValue(recordOper.charAt(0).toUpperCase() + recordOper.slice(1));
                var recordTotaltimeMed = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-totaltimemed')[0];
                recordTotaltimeMed.setValue(record.get('totaltimeMed').toFixed(2)+'s');
                var recordResponseTimeText = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-responsetime-text')[0];

                if (record.get('baselineMedPercent') > 30) { //greater than 30%
                    recordTotaltimeMed.addCls('apm-db-display-warning');
                    recordResponseTimeText.addCls('apm-db-display-warning');
                } else {
                    recordTotaltimeMed.removeCls('apm-db-display-warning');
                    recordResponseTimeText.removeCls('apm-db-display-warning');
                }

                var recordUsersTotal = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-userstotal')[0];
                recordUsersTotal.setValue(record.get('usersTotal'));
                var recordLogsTotal = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-logstotal')[0];
                recordLogsTotal.setValue(record.get('logsTotal'));


                //render highchart
                var recordTileChart = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-chart')[0];
                PSGP.APM.DB.Highcharts.renderRecordTileChart(recordTileChart.id, index, record.get('totaltimeData'), record.get('baselineMed'));

                //show or hide data
                var bodyData = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-body-data')[0];
                var bodyNoData = Ext4.ComponentQuery.query('#'+recordTile.id+' #recordtile-body-nodata')[0];
                if (record.get('logsTotal') > 0) {
                    bodyData.show();
                    bodyNoData.hide();
                } else {
                    bodyData.hide();
                    bodyNoData.show();
                }

            });
        }
    });

    Ext4.define('PSGP.APM.DB.Component.CarouselPage', {
        extend: 'Ext4.container.Container',
        layout: 'hbox',
        border: false,
        defaults: {
            height: 230
        },
        includePage: true
    });

    Ext4.define('PSGP.APM.DB.Component.RecordTile',{
        extend: 'Ext4.container.Container',
        flex: 1,
        layout: {
            type: 'vbox',
            pack: 'center',
            align: 'center'
        },
        items: [
                {
                    xtype: 'container',
                    width: 186,
                    height: 212,
                    layout: {
                        type: 'vbox',
                        pack: 'center',
                        align: 'center'
                    },
                    itemId: 'recordtile-outer',
                    cls: 'apm-db-recordtile-outer',
                    items: [
                        {
                            xtype: 'container',
                            width: 186,
                            height: 172,
                            itemId: 'recordtile-inner',
                            tileIndex: -1,
                            cls: 'apm-db-recordtile',
                            layout: {
                                type: 'vbox'
                            },
                            listeners: {
                                afterrender: function (c) {
                                    var element = c.getEl();

                                    element.on('mouseover', function() {
                                        var record = PSGP.APM.DB.dataStores.recordTilesData.getAt(c.tileIndex);
                                        if (record.get('logsTotal') == 0) return;
                                        c.addCls('apm-db-recordtile-hover');
                                    });

                                    element.on('mouseout', function() {
                                        var record = PSGP.APM.DB.dataStores.recordTilesData.getAt(c.tileIndex);
                                        if (record.get('logsTotal') == 0) return;
                                        c.removeCls('apm-db-recordtile-hover');
                                    });

                                    element.on('click', function() {
                                        var record = PSGP.APM.DB.dataStores.recordTilesData.getAt(c.tileIndex);
                                        if (record.get('logsTotal') == 0) return;
                                        PSGP.APM.DB.dataStores.getRecordTileCharts(c);
                                    });
                                }
                            },
                            items: [
                                    {
                                        xtype: 'container',
                                        height: 30,
                                        width: '100%',
                                        cls: 'apm-db-recordtile-header',
                                        padding: '0 10 0 10',
                                        layout: {
                                            type: 'hbox',
                                            align: 'bottom'
                                        },
                                        items: [
                                                {
                                                    xtype: 'displayfield',
                                                    itemId: 'recordtile-title',
                                                    value: '',
                                                    margin: '0 3 0 3',
                                                    fieldCls : 'apm-db-display-recordtiletitle',
                                                    fieldBodyCls: 'apm-db-display-recordtiletitle-body'
                                                },
                                                {
                                                    xtype: 'displayfield',
                                                    itemId: 'recordtile-title-oper',
                                                    value: '',
                                                    margin: '0 3 0 3',
                                                    fieldCls: 'apm-db-display-recordtiletitle-oper',
                                                    fieldBodyCls: 'apm-db-display-recordtiletitle-oper-body'
                                                }
                                         ]
                                    },
                                    {
                                        xtype: 'container',
                                        flex: 1,
                                        width: '100%',
                                        layout: 'fit',
                                        items: [
                                                {
                                                    xtype: 'container',
                                                    cls: 'apm-db-recordtile-body-data',
                                                    itemId: 'recordtile-body-data',
                                                    layout: 'vbox',
                                                    padding: '3 3 3 3',
                                                    items: [
                                                            {
                                                                xtype: 'container',
                                                                flex: 4,
                                                                width: '100%',
                                                                layout: 'hbox',
                                                                items: [
                                                                        {
                                                                            xtype: 'container',
                                                                            flex: 60,
                                                                            height: '100%',
                                                                            layout: {
                                                                                type: 'vbox',
                                                                                pack: 'end'
                                                                            },
                                                                            padding: '0 0 0 7',
                                                                            items: [
                                                                                    {
                                                                                        xtype: 'displayfield',
                                                                                        itemId: 'recordtile-totaltimemed',
                                                                                        width: '100%',
                                                                                        height: 24,
                                                                                        value: '',
                                                                                        fieldCls : 'apm-db-display-recordtiletotaltime',
                                                                                    },
                                                                                    {
                                                                                        xtype: 'displayfield',
                                                                                        itemId: 'recordtile-responsetime-text',
                                                                                        width: '100%',
                                                                                        height: 16,
                                                                                        value: APMTranslation.apm.common.label.responsetime().toLowerCase(),
                                                                                        fieldCls: 'apm-db-display-recordtileresponsetimetext',
                                                                                    }
                                                                            ]
                                                                        },
                                                                        {
                                                                            xtype: 'container',
                                                                            flex: 40,
                                                                            height: '100%',
                                                                            layout: 'vbox',
                                                                            items: [
                                                                                    {
                                                                                        xtype: 'container',
                                                                                        flex: 1,
                                                                                        width: '100%',
                                                                                        layout: {
                                                                                            type: 'hbox',
                                                                                            pack: 'start'
                                                                                        },
                                                                                        items: [
                                                                                                {
                                                                                                    xtype: 'container',
                                                                                                    width: 20,
                                                                                                    height: '100%',
                                                                                                    cls: 'apm-db-recordtileusers-icon'
                                                                                                },
                                                                                                {
                                                                                                    xtype: 'displayfield',
                                                                                                    itemId: 'recordtile-userstotal',
                                                                                                    height: '100%',
                                                                                                    value: '',
                                                                                                    fieldCls : 'apm-db-display-recordtilefield',
                                                                                                    fieldBodyCls: 'apm-db-display-recordtilefield-body'
                                                                                                }
                                                                                        ]
                                                                                    },
                                                                                    {
                                                                                        xtype: 'container',
                                                                                        flex: 1,
                                                                                        width: '100%',
                                                                                        layout: {
                                                                                            type: 'hbox',
                                                                                            pack: 'start'
                                                                                        },
                                                                                        items: [
                                                                                                {
                                                                                                    xtype: 'container',
                                                                                                    width: 20,
                                                                                                    height: '100%',
                                                                                                    cls: 'apm-db-recordtilelogs-icon'
                                                                                                },
                                                                                                {
                                                                                                    xtype: 'displayfield',
                                                                                                    itemId: 'recordtile-logstotal',
                                                                                                    height: '100%',
                                                                                                    value: '',
                                                                                                    fieldCls : 'apm-db-display-recordtilefield',
                                                                                                    fieldBodyCls: 'apm-db-display-recordtilefield-body'
                                                                                                }
                                                                                        ]
                                                                                    }
                                                                            ]
                                                                        }
                                                                ]
                                                            },
                                                            {
                                                                xtype: 'container',
                                                                itemId: 'recordtile-chart',
                                                                width: 183,
                                                                height: 75
                                                            }
                                                    ]
                                                },
                                                {
                                                    xtype: 'container',
                                                    cls: 'apm-db-recordtile-body-nodata',
                                                    itemId: 'recordtile-body-nodata',
                                                    hidden: true,
                                                    layout: 'hbox',
                                                    items: [
                                                            {
                                                                xtype: 'container',
                                                                cls: 'apm-db-recordtile-body-nodata-icon',
                                                                width: 64,
                                                                height: 64
                                                            },
                                                            {
                                                                xtype: 'container',
                                                                cls: 'apm-db-recordtile-body-nodata-text',
                                                                flex: 1,
                                                                height: 64,
                                                                html: '<b>' + APMTranslation.apm.common.alert.nocontent() + '</b> </br> ' + APMTranslation.apm.common.label.notiledatavailable()
                                                            }
                                                    ]
                                                }
                                        ]
                                    },
                              ]
                         }
                    ]
                }
         ]
    });

    Ext4.define('PSGP.APM.DB.Component.RecordsTotalField', {
        extend : 'Ext4.form.field.Display',
        value: '',
        margin: '0 10 0 0',
        width: 100,
        fieldCls : 'apm-display-toolbar-field',
        fieldStyle:  'text-align:right;',
        updateValue: function () {
            var me = this;
            var totalTiles = PSGP.APM.DB.dataStores.recordTilesData.getCount();
            var carousel = Ext4.getCmp('psgp-apm-db-records-carousel');
            var currPage = carousel.currentPage;
            var maxPages = carousel.maxPages;
            var tilesPerPage = carousel.tilesPerPage;
            var startPage = currPage * tilesPerPage + 1;
            var endPage;
            if (currPage < maxPages-1) {
                endPage = startPage + tilesPerPage - 1;
            } else {
                var remaining = ((totalTiles-1) % tilesPerPage) + 1;
                endPage = startPage + remaining - 1;
            }
            me.setValue(APMTranslation.apm.db.label.outof({params: [startPage + '-' + endPage,totalTiles]}));
            if (totalTiles <= 0) {
                me.setValue('');
            }
        }
    });

    Ext4.define('PSGP.APM.DB.Component.ComboBox.RecordDateRange', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.DB.dataStores.recordDateRangeComboBox,
        editable: false,
        width: 280,
        height: 25,
        queryMode: 'local'
    });

    Ext4.define('PSGP.APM.DB.Component.ComboBox.RecordSorting', {
        extend: 'PSGP.APM.Component.ComboBox',
        store: PSGP.APM.DB.dataStores.recordSortingComboBox,
        editable: false,
        width: 200,
        height: 25,
        listeners: {
            change : function (combo) {
                Ext4.getCmp('psgp-apm-db-portlet-recordpages').setLoading(MASK_CONFIG);
                var carousel = Ext4.getCmp('psgp-apm-db-records-carousel');
                carousel.updateData();
                Ext4.getCmp('psgp-apm-db-portlet-recordpages').setLoading(false);
            }
        }
    });

    Ext4.define('PSGP.APM.DB.Component.RefreshDateField', {
        extend : 'Ext4.form.field.Display',
        value: APMTranslation.apm.common.label.asof({params: [ '' ]}),
        fieldCls : 'apm-display-toolbar-field',
        updateValue: function () {
            var me = this;
        }
    });

    Ext4.define('PSGP.APM.DB.Component.BlueButton.SetUpRecordPagesSave', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.common.label.save(),
        handler: function() {

            //validation
            if (!Ext4.getCmp('psgp-apm-db-setup-general-histograminterval').isValid()) {
                alert(APMTranslation.apm.db.alert.entervalidhistograminterval());
                return false;
            }

            var setupGeneralParams = {
                    histogramInterval : Ext4.getCmp('psgp-apm-db-setup-general-histograminterval').getValue()
                  , recordTiles: Ext4.getCmp('psgp-apm-db-setup-general-recordtiles').getValue()
            };
            PSGP.APM.DB.dataStores.saveSetupGeneral(setupGeneralParams);

            var watchList = PSGP.APM.DB.dataStores.watchList;
            watchList.getProxy().actionMethods = {create: 'POST', read: 'GET', update: 'PUT', destroy: 'DELETE'};
            watchList.sync({
                callback : function () {
                    watchList.isSynced = true;
                },
                success : function () {
                    watchList.load();
                }
            });

            var customDateTime = PSGP.APM.DB.dataStores.customDateTime;
            customDateTime.getProxy().actionMethods = {create: 'POST', read: 'GET', update: 'PUT', destroy: 'DELETE'};
            customDateTime.sync({
                callback: function () {
                    customDateTime.isSynced = true;
                },
                success: function() {
                    customDateTime.load();
                }
            });
            this.waitForSave();
        },
        waitForSave : function () {
            var sleep;
            Ext4.getCmp('psgp-apm-db-window-setup-record-pages').setLoading(MASK_CONFIG);
            var waitDone = function() {
                PSGP.APM.DB.dataStores.refreshRecordTileCharts();
                Ext4.getCmp('psgp-apm-db-window-setup-record-pages').setLoading(false);
                Ext4.getCmp('psgp-apm-db-window-setup-record-pages').hide();
            };
            var waitFunction = function () {
                if (PSGP.APM.DB.dataStores.ajaxReady.setupGeneral &&
                        PSGP.APM.DB.dataStores.watchList.isSynced &&
                        PSGP.APM.DB.dataStores.customDateTime.isSynced) {
                    console.log('READY');
                    clearTimeout(sleep);
                    waitDone();
                } else {
                    console.log('WAITING...');
                    sleep = setTimeout(waitFunction, 100);
                }
            };
            waitFunction();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.GrayButton.SetUpRecordPagesCancel', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            var setupGeneral = PSGP.APM.DB.dataStores.setupGeneral;
            Ext4.getCmp('psgp-apm-db-setup-general-histograminterval').setValue(setupGeneral.histogramInterval);
            Ext4.getCmp('psgp-apm-db-setup-general-recordtiles').setValue(setupGeneral.recordTiles);
            PSGP.APM.DB.dataStores.watchList.rejectChanges();
            PSGP.APM.DB.dataStores.customDateTime.rejectChanges();
            Ext4.getCmp('psgp-apm-db-window-setup-record-pages').hide();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.GrayButton.SetUpRecordPagesReset', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.reset(),
        handler: function() {
            var setupGeneral = PSGP.APM.DB.dataStores.setupGeneral;
            Ext4.getCmp('psgp-apm-db-setup-general-histograminterval').setValue(setupGeneral.histogramInterval);
            Ext4.getCmp('psgp-apm-db-setup-general-recordtiles').setValue(setupGeneral.recordTiles);
            PSGP.APM.DB.dataStores.watchList.rejectChanges();
            PSGP.APM.DB.dataStores.customDateTime.rejectChanges();
        }
    });

    /* *********************** */

    Ext4.define('PSGP.APM.DB.Component.GrayButton.WatchList.AddWatchList', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.db.label.addwatchlist(),
        handler: function() {
            Ext4.getCmp('psgp-apm-db-window-watchlist-addwatchlist').show();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.GrayButton.WatchList.RemoveAll', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.db.label.removeall(),
        handler: function() {
            PSGP.APM.DB.dataStores.watchList.removeAll();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.Grid.WatchList', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.DB.dataStores.watchList,
        disableSelection: false,
        height: 220,
        forceFit: true,
        viewConfig: {
            markDirty: false,
            loadMask: false
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
                         text : APMTranslation.apm.common.label.recordtype(),
                         dataIndex : 'recordtype',
                         flex: 25,
                         renderer: function(value) {
                             var recordTypes = PSGP.APM.DB.dataStores.recordTypes;
                             var recordType = recordTypes.getById(value);
                             return (recordType) ? recordType.get('name') : value;
                         }
                     },
                     {
                         text : APMTranslation.apm.common.label.operation(),
                         dataIndex : 'operation',
                         flex: 15,
                         renderer: function(value) {
                             switch(value) {
                             case 'new'  : return APMTranslation.apm.common.label.new();
                             case 'edit' : return APMTranslation.apm.common.label.edit();
                             case 'save' : return APMTranslation.apm.common.label.save();
                             case 'view' : return APMTranslation.apm.common.label.view();
                             default: return value;
                             }
                         }
                     },
                     {
                         xtype: 'actioncolumn',
                         flex: 5,
                         items: [{
                             text: 'Delete',
                             iconCls: 'apm-db-setup-record-pages-delete',
                             tooltip: 'Remove Item',
                             handler: function(grid, rowIndex, colIndex) {
                                 PSGP.APM.DB.dataStores.watchList.removeAt(rowIndex);
                             }
                         }]
                     }
                     ]
        }
    });

    Ext4.define('PSGP.APM.DB.Component.BlueButton.WatchList.Add', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.ns.common.add(),
        handler: function() {
            var recordtype = Ext4.getCmp('psgp-apm-db-watchlist-recordtype').getValue();
            var operation = Ext4.getCmp('psgp-apm-db-watchlist-operation').getValue();

            if(recordtype == null) {
                alert(APMTranslation.apm.db.alert.recordtyperequired());
                return;
            }
            if(operation == null) {
                alert(APMTranslation.apm.db.alert.operationrequired());
                return;
            }

            var recordIndex = PSGP.APM.DB.dataStores.watchList.findBy(
                    function(record, id){
                        if(record.get('recordtype') === recordtype &&
                                record.get('operation') === operation) {
                            return true;  // a record with this data exists
                        }
                        return false;  // there is no record in the store with this data
                    }
            );

            if(recordIndex != -1){
                alert(APMTranslation.apm.db.label.duplicaterecordtypeoperation());
                return;
            }
            if(PSGP.APM.DB.dataStores.watchList.getCount() == 10){
                alert(APMTranslation.apm.db.alert.watchlist10items());
            } else {
                PSGP.APM.DB.dataStores.watchList.add({
                    'recordtype' : recordtype,
                    'operation'  : operation
                });
                Ext4.getCmp('psgp-apm-db-window-watchlist-addwatchlist').hide();
            }
        }
    });

    Ext4.define('PSGP.APM.DB.Component.GrayButton.WatchList.Cancel', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            Ext4.getCmp('psgp-apm-db-window-watchlist-addwatchlist').hide();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.Window.WatchList.AddWatchList', {
        extend: 'PSGP.APM.Component.Window',
        title: APMTranslation.apm.db.label.addwatchlist(),
        width: 350,
        items: [
                Ext4.create('PSGP.APM.Component.Display', {
                    fieldLabel: APMTranslation.apm.common.label.recordtype(),
                    padding: '5 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.ComboBox', {
                    id:'psgp-apm-db-watchlist-recordtype',
                    store: PSGP.APM.DB.dataStores.recordTypes,
                    queryMode: 'local',
                    padding: '0 0 0 10',
                    width: 250,
                    typeAhead: true,
                    displayField: 'name',
                    valueField: 'id',
                    listeners: {
                        select: function (combo, records, eOpts) {
                            var node = combo.picker.getNode(records[0]);
                            combo.picker.listEl.insertFirst(node);
                        },
                        specialkey: function(field, event) {
                            if (event.getKey() == event.TAB) {
                                field.triggerBlur();
                            }
                        }
                    }
                }),
                Ext4.create('PSGP.APM.Component.Display', {
                    fieldLabel: APMTranslation.apm.common.label.operation(),
                    padding: '0 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.ComboBox', {
                    id: 'psgp-apm-db-watchlist-operation',
                    store: Ext4.create('Ext4.data.Store', {
                        fields: ['value', 'name'],
                        data: [
                               {'name' : APMTranslation.apm.common.label.new(), 'value': 'new'},
                               {'name' : APMTranslation.apm.common.label.edit(), 'value': 'edit'},
                               {'name' : APMTranslation.apm.common.label.save(), 'value': 'save'},
                               {'name' : APMTranslation.apm.common.label.view(), 'value': 'view'},
                               ]
                    }),
                    padding: '0 0 0 10',
                    typeAhead: true,
                    displayField: 'name',
                    valueField: 'value'
                }),
                Ext4.create('PSGP.APM.DB.Component.BlueButton.WatchList.Add', {
                    id: 'psgp-apm-db-watchlist-add',
                    margin: '10 7 10 10'
                }),
                Ext4.create('PSGP.APM.DB.Component.GrayButton.WatchList.Cancel', {
                    id: 'psgp-apm-db-watchlist-cancel',
                    margin: '10 10 10 7'
                })
                ]
    });

    ////////////////////////////////

    Ext4.define('PSGP.APM.DB.Component.GrayButton.CustomDateTime.AddCustomDateTime', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.db.label.adddatetime(),
        handler: function() {
            Ext4.getCmp('psgp-apm-db-customdatetime-startdate').setValue('');
            Ext4.getCmp('psgp-apm-db-customdatetime-starttime').setValue('');
            Ext4.getCmp('psgp-apm-db-customdatetime-enddate').setValue('');
            Ext4.getCmp('psgp-apm-db-customdatetime-endtime').setValue('');
            Ext4.getCmp('psgp-apm-db-window-customdatetime-adddatetime').show();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.GrayButton.CustomDateTime.RemoveAll', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.db.label.removeall(),
        handler: function() {
            PSGP.APM.DB.dataStores.customDateTime.removeAll();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.Grid.CustomDateTime', {
        extend: 'PSGP.APM.Component.Grid',
        store: PSGP.APM.DB.dataStores.customDateTime,
        disableSelection: false,
        height: 220,
        forceFit: true,
        viewConfig: {
            markDirty: false,
            loadMask: false
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
                         text : APMTranslation.apm.common.label.startdate(),
                         dataIndex : 'startdate',
                         flex: 25,
                         renderer: function(value) {
                             var dateSplit = value.split('-');
                             var tempDate = new Date(dateSplit[0], dateSplit[1]-1, dateSplit[2], 0, 0, 0);
                             return Ext4.Date.format(tempDate, 'm/d/Y');
                         }
                     },
                     {
                         text : APMTranslation.apm.db.label.starttime(),
                         dataIndex : 'starttime',
                         flex: 25,
                         renderer: function(value) {
                             var timeSplit = value.split(':');
                             var tempDate = new Date(1970, 0, 1, timeSplit[0], timeSplit[1], 0);
                             return Ext4.Date.format(tempDate, 'g:i A');
                         }
                     },
                     {
                         text: APMTranslation.apm.common.label.enddate(),
                         dataIndex : 'enddate',
                         flex: 25,
                         renderer: function(value) {
                             var dateSplit = value.split('-');
                             var tempDate = new Date(dateSplit[0], dateSplit[1]-1, dateSplit[2], 0, 0, 0);
                             return Ext4.Date.format(tempDate, 'm/d/Y');
                         }
                     },
                     {
                         text: APMTranslation.apm.db.label.endtime(),
                         dataIndex : 'endtime',
                         flex: 25,
                         renderer: function(value) {
                             var timeSplit = value.split(':');
                             var tempDate = new Date(1970, 0, 1, timeSplit[0], timeSplit[1], 0);
                             return Ext4.Date.format(tempDate, 'g:i A');
                         }
                     },
                     {
                         xtype: 'actioncolumn',
                         flex: 5,
                         items: [{
                             text: 'Delete',
                             iconCls: 'apm-db-setup-record-pages-delete',
                             tooltip: 'Remove Item',
                             handler: function(grid, rowIndex, colIndex) {
                                 PSGP.APM.DB.dataStores.customDateTime.removeAt(rowIndex);
                             }
                         }]
                     }
                     ]
        }
    });

    Ext4.define('PSGP.APM.DB.Component.BlueButton.CustomDateTime.Add', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.ns.common.add(),
        handler: function() {
            var startdate = Ext4.getCmp('psgp-apm-db-customdatetime-startdate').getValue();
            var starttime = Ext4.getCmp('psgp-apm-db-customdatetime-starttime').getValue();
            var enddate = Ext4.getCmp('psgp-apm-db-customdatetime-enddate').getValue();
            var endtime = Ext4.getCmp('psgp-apm-db-customdatetime-endtime').getValue();

            if(!startdate) {
            	alert(APMTranslation.apm.common.alert.startdaterequired());
                return;
            }
            if (!Ext4.getCmp('psgp-apm-db-customdatetime-startdate').isValid()) {
                alert(APMTranslation.apm.common.alert.invalidstartdate());
                return;
            }
            if(!starttime) {
            	alert(APMTranslation.apm.db.alert.starttimerequired());
                return;
            }
            if(!enddate) {
                alert(APMTranslation.apm.common.alert.endaterequired());
                return;
            }
            if (!Ext4.getCmp('psgp-apm-db-customdatetime-enddate').isValid()) {
                alert(APMTranslation.apm.common.alert.invalidenddate());
                return;
            }
            if(!endtime) {
                alert(APMTranslation.apm.common.label.endtimerequired());
                return;
            }

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

            var adjustDate = function (date) {
                var ms = date.getTime() - date.getTimezoneOffset()*60*1000;
                var adjusted = new Date(ms);
                return adjusted.toISOString();
            };

            PSGP.APM.DB.dataStores.customDateTime.add({
                'startdate' : adjustDate(startdate).substr(0,10),
                'starttime' : adjustDate(starttime).substr(11,5),
                'enddate'   : adjustDate(enddate).substr(0,10),
                'endtime'   : adjustDate(endtime).substr(11,5)
            });
            Ext4.getCmp('psgp-apm-db-window-customdatetime-adddatetime').hide();

        }
    });

    Ext4.define('PSGP.APM.DB.Component.GrayButton.CustomDateTime.Cancel', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            Ext4.getCmp('psgp-apm-db-window-customdatetime-adddatetime').hide();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.Window.CustomDateTime.AddDateTime', {
        extend: 'PSGP.APM.Component.Window',
        title: APMTranslation.apm.db.label.adddatetime(),
        width: 280,
        items: [
                Ext4.create('PSGP.APM.Component.Display', {
                    fieldLabel: APMTranslation.apm.common.label.startdate(),
                    padding: '5 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.Date', {
                    id: 'psgp-apm-db-customdatetime-startdate',
                    padding: '0 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.Display', {
                    fieldLabel: APMTranslation.apm.db.label.starttime(),
                    padding: '0 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.Time', {
                    id: 'psgp-apm-db-customdatetime-starttime',
                    padding: '0 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.Display', {
                    fieldLabel: APMTranslation.apm.common.label.enddate(),
                    padding: '5 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.Date', {
                    id: 'psgp-apm-db-customdatetime-enddate',
                    padding: '0 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.Display', {
                    fieldLabel: APMTranslation.apm.db.label.endtime(),
                    padding: '0 0 0 10'
                }),
                Ext4.create('PSGP.APM.Component.Time', {
                    id: 'psgp-apm-db-customdatetime-endtime',
                    padding: '0 0 0 10'
                }),
                Ext4.create('PSGP.APM.DB.Component.BlueButton.CustomDateTime.Add', {
                    id: 'psgp-apm-db-customdatetime-add',
                    margin: '10 7 10 10'
                }),
                Ext4.create('PSGP.APM.DB.Component.GrayButton.CustomDateTime.Cancel', {
                    id: 'psgp-apm-db-customdatetime-cancel',
                    margin: '10 10 10 7'
                }),
                ]
    });

    ///////////////////////////////

    Ext4.define('PSGP.APM.DB.Component.Window.SetUpRecordPages', {
        extend: 'PSGP.APM.Component.Window',
        title: APMTranslation.apm.db.label.setuprecordpages(),
        width: 800,
        bodyPadding: 17,
        listeners: {
            beforerender: function () {
                var setupGeneral = PSGP.APM.DB.dataStores.setupGeneral;
                Ext4.getCmp('psgp-apm-db-setup-general-histograminterval').setValue(setupGeneral.histogramInterval);
                Ext4.getCmp('psgp-apm-db-setup-general-recordtiles').setValue(setupGeneral.recordTiles);
            }
        },
        items: [{
            xtype: 'container',
            border: false,
            items: [
                    Ext4.create('PSGP.APM.DB.Component.BlueButton.SetUpRecordPagesSave', {
                        id: 'psgp-apm-db-btn-setup-record-pages-save-top',
                        margin: '8 7 25 3'
                    }),
                    Ext4.create('PSGP.APM.DB.Component.GrayButton.SetUpRecordPagesCancel', {
                        id: 'psgp-apm-db-btn-setup-record-pages-cancel-top',
                        margin: '8 7 25 7'
                    }),
                    Ext4.create('PSGP.APM.DB.Component.GrayButton.SetUpRecordPagesReset', {
                        id: 'psgp-apm-db-btn-setup-record-pages-reset-top',
                        margin: '8 7 25 7'
                    })
                    ]
        },
        Ext4.create('PSGP.APM.Component.TabPanel', {
            id: 'psgp-apm-db-tabpanel-setuprecordpages',
            height: 330,
            items: [{
                title: APMTranslation.apm.db.label.chartpreferences(),
                items: [
                    {
                        xtype: 'container',
                        border: false,
                        padding: '0 10 0 10',
                        items: [
                            Ext4.create('PSGP.APM.Component.SubPanel', {
                                title: APMTranslation.apm.common.label.histogram(),
                                collapsible: false,
                                margin: '10 0 10 0',
                                bodyPadding: '10 15 10 15',
                                items: [
                                    Ext4.create('PSGP.APM.Component.Display', {
                                        fieldLabel: APMTranslation.apm.db.setup.interval()
                                    }),
                                    Ext4.create('PSGP.APM.Component.NumberField', {
                                        id: 'psgp-apm-db-setup-general-histograminterval',
                                        allowBlank: false,
                                        allowDecimals: false,
                                        minValue: 1,
                                        width: 50,
                                        value: 1
                                    })
                                ]
                            }),
                            Ext4.create('PSGP.APM.Component.SubPanel', {
                                title: APMTranslation.apm.db.label.general(),
                                collapsible: false,
                                margin: '10 0 10 0',
                                bodyPadding: '10 15 10 15',
                                items: [
                                    Ext4.create('PSGP.APM.Component.Display', {
                                        fieldLabel: APMTranslation.apm.db.label.recordtiles()
                                    }),
                                    Ext4.create('PSGP.APM.Component.ComboBox', {
                                        id: 'psgp-apm-db-setup-general-recordtiles',
                                        store: Ext4.create('Ext4.data.Store', {
                                            fields: ['value', 'name'],
                                            data: [
                                                   {'name' : APMTranslation.apm.db.label.showallrecordtiles(), 'value': 'all'},
                                                   {'name' : APMTranslation.apm.db.label.showwatchlistonly(), 'value': 'wlonly'}
                                                   ]
                                        }),
                                        editable: false,
                                        displayField: 'name',
                                        valueField: 'value'
                                    })
                                ]
                            })
                        ]
                    }
                ]
            }, {
                title: APMTranslation.apm.db.label.watchlist(),
                items: [
                    {
                        xtype: 'container',
                        border: false,
                        padding: '0 10 0 10',
                        items: [
                            Ext4.create('PSGP.APM.DB.Component.GrayButton.WatchList.AddWatchList', {
                                id: 'psgp-apm-db-btn-watchlist-addwatchlist',
                                margin: '8 7 7 3'
                            }),
                            Ext4.create('PSGP.APM.DB.Component.GrayButton.WatchList.RemoveAll', {
                                id: 'psgp-apm-db-btn-watchlist-removeall',
                                margin: '8 7 7 3'
                            }),
                            Ext4.create('PSGP.APM.DB.Component.Grid.WatchList', {
                                id: 'psgp-apm-db-grid-watchlist'
                            })
                        ]
                    }
                ]
            }, {
                title: APMTranslation.apm.db.label.customdatetime(),
                items: [
                        {
                        xtype: 'container',
                        border: false,
                        padding: '0 10 0 10',
                        items: [
                                Ext4.create('PSGP.APM.DB.Component.GrayButton.CustomDateTime.AddCustomDateTime', {
                                    id: 'psgp-apm-db-btn-customdatetime-addcustomdatetime',
                                    margin: '8 7 7 3'
                                }),
                                Ext4.create('PSGP.APM.DB.Component.GrayButton.CustomDateTime.RemoveAll', {
                                    id: 'psgp-apm-db-btn-customdatetime-removeall',
                                    margin: '8 7 7 3'
                                }),
                                Ext4.create('PSGP.APM.DB.Component.Grid.CustomDateTime', {
                                    id: 'psgp-apm-db-grid-customdatetime'
                                })
                                ]
                        }]
            }]
        }),
        {
            xtype: 'container',
            border: false,
            items: [
                    Ext4.create('PSGP.APM.DB.Component.BlueButton.SetUpRecordPagesSave', {
                        id: 'psgp-apm-db-btn-setup-record-pages-save-bottom',
                        margin: '3 7 8 3'
                    }),
                    Ext4.create('PSGP.APM.DB.Component.GrayButton.SetUpRecordPagesCancel', {
                        id: 'psgp-apm-db-btn-setup-record-pages-cancel-bottom',
                        margin: '3 7 8 7'
                    }),
                    Ext4.create('PSGP.APM.DB.Component.GrayButton.SetUpRecordPagesReset', {
                        id: 'psgp-apm-db-btn-setup-record-pages-reset-bottom',
                        margin: '3 7 8 7'
                    })
                    ]
        },
        ]
    });

    Ext4.define('PSGP.APM.DB.Component.PortletMenu.Dummy', {
        extend: 'PSGP.APM.Component.PortletMenu',
        items: [
                {
                    text: 'Remove',
                    handler: function() {
                        Ext4.ComponentQuery.query('[itemButtonId=dummy]')[0].handler();
                    }
                }
                ]
    });

    Ext4.define('PSGP.APM.DB.Component.PortletMenu.RecordPages', {
        extend: 'PSGP.APM.Component.PortletMenu',
        items: [
                {
                    text: APMTranslation.apm.common.label.setup(),
                    handler: function() {
                        Ext4.getCmp('psgp-apm-db-window-setup-record-pages').show();
                    }
                },
                {
                    text: APMTranslation.apm.db.label.export(),
                    handler: function() {
                        var dataParams = PSGP.APM.DB.dataStores.recordTilesParams;
                        var urlRequest = '/app/site/hosting/scriptlet.nl?script=customscript_apm_db_sl_record_tile&deploy=customdeploy_apm_db_sl_record_tile&testmode='+TEST_MODE
                                        +'&getcsv=T' + '&' + Ext4.urlEncode(dataParams);
                        window.location.href = urlRequest;
                    }
                },
                {
                    text: 'Remove',
                    hidden: true,
                    handler: function() {
                        Ext4.ComponentQuery.query('[itemButtonId=recordpages]')[0].handler();
                    }
                }
                ]
    });

    Ext4.define('PSGP.APM.DB.Component.BlueButton.CompIdQuickSelector.Done', {
        extend: 'PSGP.APM.Component.BlueButton',
        text: APMTranslation.apm.common.button.done(),
        handler: function() {
            var newCompFil = Ext4.getCmp('psgp-apm-db-quickselector-field-compid').getValue();
            COMP_FIL = newCompFil;
            Ext4.getCmp('psgp-apm-db-quicksel-compid').hide();

            //UI changes
            PSGP.APM.DB.dataStores.recordTypes.load({
                callback: function(records, operation, success) {
                    PSGP.APM.DB.dataStores.refreshRecordTileCharts();
                }
            });

        }
    });

    Ext4.define('PSGP.APM.DB.Component.GrayButton.CompIdQuickSelector.Cancel', {
        extend: 'PSGP.APM.Component.GrayButton',
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            Ext4.getCmp('psgp-apm-db-quicksel-compid').hide();
        }
    });

    Ext4.define('PSGP.APM.DB.Component.CompIdQuickSelector', {
        extend: 'PSGP.APM.Component.QuickSelectorMenu',
        id: 'psgp-apm-db-quicksel-compid',
        hidden: true,
        listeners: {
            beforerender: function () {
                Ext4.getCmp('psgp-apm-db-quickselector-field-compid').setValue(COMP_FIL);
            },
            hide: function () {
                Ext4.getCmp('psgp-apm-db-quickselector-field-compid').setValue(COMP_FIL);
            }
        },
        items: [
            Ext4.create('PSGP.APM.Component.Display', {
                fieldLabel: APMTranslation.apm.common.label.companyid(),
                margin: '20 20 0 20'
            }),
            Ext4.create('PSGP.APM.Component.TextField', {
                id: 'psgp-apm-db-quickselector-field-compid',
                margin: '0 20 10 20'
            }),
            Ext4.create('PSGP.APM.DB.Component.BlueButton.CompIdQuickSelector.Done', {
                id: 'psgp-apm-db-quickselector-btn-done',
                margin: '10 10 20 20'
            }),
            Ext4.create('PSGP.APM.DB.Component.GrayButton.CompIdQuickSelector.Cancel', {
                id: 'psgp-apm-db-quickselector-btn-cancel',
                margin: '10 20 20 10'
            })
        ]
    });

    Ext4.define('PSGP.APM.DB.Component.PersonalizePanel', {
        extend: 'PSGP.APM.Component.PersonalizePanel',
        portletIdPrefix: 'psgp-apm-db-portletcontainer-',
        personalizePanelUsedCard: 'card-currentlyused',
        personalizePanelIdPrefix: 'psgp-apm-db-personalizepanel-',
        personalizePanelStore: PSGP.APM.DB.dataStores.personalizePanel,
        personalizePanelTabs: [
            {
                id: 'psgp-apm-db-personalizepanel-tab-standardcontent',
                targetCardItem: 'psgp-apm-db-personalizepanel-card-standardcontent',
                html: 'Standard Content'
            },
            {
                id: 'psgp-apm-db-personalizepanel-tab-currentlyused',
                targetCardItem: 'psgp-apm-db-personalizepanel-card-currentlyused',
                html: 'Currently Used',
                border: '2 0 0 0', style: { borderColor: '#999999', borderStyle: 'solid' }
            }
        ],
        personalizePanelCards: [
            {
                id: 'psgp-apm-db-personalizepanel-card-standardcontent'
            },
            {
                id: 'psgp-apm-db-personalizepanel-card-currentlyused'
            }
        ],
    });
}
