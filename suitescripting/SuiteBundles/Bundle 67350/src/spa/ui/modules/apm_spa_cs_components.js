/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Aug 2017     jmarimla         Initial
 * 2.00       08 Aug 2017     jmarimla         Saved search tiles
 * 3.00       07 Sep 2017     jmarimla         Modified search tiles
 * 4.00       18 Sep 2017     jmarimla         Customer debugging
 * 5.00       02 Oct 2017     jmarimla         Label changed
 * 6.00       11 Oct 2017     jmarimla         Default to 'custom'
 * 7.00       17 Nov 2017     jmarimla         Adjust tiles
 * 8.00       11 Jun 2018     jmarimla         Translation engine
 * 9.00       19 Jun 2018     justaris         Translation
 * 10.00      02 Jul 2018	  justaris         Translation Readiness
 * 11.00      03 Aug 2018     jmarimla         Set html search name
 * 12.00      29 Mar 2019     jmarimla         Average time
 * 13.00      03 Apr 2019     jmarimla         Translation
 *
 */

APMSPA = APMSPA || {};

APMSPA._Components = function() {
    
    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: APMTranslation.apm.spa.label.searchperformanceanalysis()
    });
    
    var $CustomerDebuggingDialog =  $('' +
            '<div class="apm-spa-dialog-custdebug">' +
                '<div class="container-field-customer"><span class="psgp-field-label">' + APMTranslation.apm.common.label.companyid() + '</span><div class="field-customer"></div></div>' +
                '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
            '</div>')
            .psgpSettingsDialog({width: 240});
    
    $CustomerDebuggingDialog.find('.field-customer').psgpTextBox({
        width:  250
    });
    
    $CustomerDebuggingDialog.find('.btn-save').psgpBlueButton({
        text: APMTranslation.apm.common.button.done(),
        handler: function () {
            var me = this;
            var globalSettings = APMSPA.Services.getGlobalSettings();
            var $dialog = $(me).parents('.apm-spa-dialog-custdebug');
            $dialog.dialog('close');
            
            var compfil = $dialog.find('.field-customer .psgp-textbox').val();
            globalSettings.compfil = compfil;
            globalSettings.endDateMS = '' + new Date().setSeconds(0, 0); 
            APMSPA.Services.refreshData();
        }
    });
    
    $CustomerDebuggingDialog.find('.btn-cancel').psgpGrayButton({
        text: APMTranslation.apm.common.button.cancel(),
        handler: function () {
            var me = this;
            var globalSettings = APMSPA.Services.getGlobalSettings();
            var $dialog = $(me).parents('.apm-spa-dialog-custdebug');
            $dialog.dialog('close');
            
            var oldCompfil = globalSettings.compfil;
            $dialog.find('.field-customer .psgp-textbox').val(oldCompfil);
        }
    });
    
    var $CustomerDebuggingLabel = $('<div>').addClass('apm-spa-settings-custdebug')
        .psgpSuiteletSettings({
            label: APMTranslation.apm.common.label.customerdebugsettings(),
            $dialog: $CustomerDebuggingDialog
        });
    
    if (SPA_PARAMS.debugMode) {
        $TitleBar.append($CustomerDebuggingLabel);
    }
    
    var $ColumnPanel = $('<div>').psgpColumnPanel({
        columndef: [{
            width: '99%',
            padding: '0px 0px 0px 0px'
        }, {
            width: '1%',
            padding: '0px 0px 0px 0px'
        }]
    });
    
    var $TilesPortletRefreshBtn = $('<div>').psgpPortletRefreshBtn({
        handler: function () {
            var globalSettings = APMSPA.Services.getGlobalSettings();
            globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);            
            APMSPA.Services.refreshData();
        }
    });
    
    var $TilesPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.spa.label.savedsearches(),
        buttons: [
            $TilesPortletRefreshBtn
        ]
    });
    
    var $TilesToolbar = $('<div class="apm-spa-tiles-toolbar"><div class="left"></div><div class="right"></div></div>');
    
    $TilesPortlet.psgpPortlet('getBody')
        .append($TilesToolbar);

    var $TilesDateCombobox = $('<div class="combo-date"></div>').psgpComboBox({
            list: [
                { 'name': APMTranslation.apm.common.label.last1hour(), 'id': 1000*60*60 }
              , { 'name': APMTranslation.apm.common.label.last3hours(), 'id': 1000*60*60*3 }
              , { 'name': APMTranslation.apm.common.label.last6hours(), 'id': 1000*60*60*6 }
              , { 'name': APMTranslation.apm.common.label.last12hours(), 'id': 1000*60*60*12 }
              , { 'name': APMTranslation.apm.common.label.last24hours(), 'id': 1000*60*60*24 }
              , { 'name': APMTranslation.apm.common.label.last3days(), 'id': 1000*60*60*24*3 }
              , { 'name': APMTranslation.apm.common.label.last7days(), 'id': 1000*60*60*24*7 }
              , { 'name': APMTranslation.apm.common.label.last14days(), 'id': 1000*60*60*24*14 }
              , { 'name': APMTranslation.apm.common.label.last30days(), 'id': 1000*60*60*24*30 }
            ],
        width:  190,
        change: function( event, ui ) {
            var newValue = ui.item.value;
            var globalSettings = APMSPA.Services.getGlobalSettings();
            globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            globalSettings.dateRangeSelect = '' + newValue;
            
            APMSPA.Services.refreshData();
        }
    });
    
    var $TilesSortCombobox = $('<div class="combo-sort"></div>').psgpComboBox({
            list: [
                { 'name': APMTranslation.apm.spa.label.mostrequested(), 'id': 'requested' }
              , { 'name': APMTranslation.apm.common.label.mostusers(), 'id': 'users' }
              , { 'name': APMTranslation.apm.spa.label.mosttimeouts(), 'id': 'timeouts' }
              , { 'name': APMTranslation.apm.spa.label.highestexecutiontime(), 'id': 'execution' }
            ],
        width:  190,
        change: function( event, ui ) {
            var newValue = ui.item.value;
            var globalSettings = APMSPA.Services.getGlobalSettings();
            globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            globalSettings.sorting = newValue;
            
            APMSPA.Services.refreshData();
        }
    });
    
    $TilesToolbar.find('.left')
        .append($TilesDateCombobox)
        .append('<div class="text-date"></div>');
    $TilesToolbar.find('.right')
        .append('<div class="label">' + APMTranslation.apm.common.label.sorting() + '</div>')
        .append($TilesSortCombobox);
    
    function renderTiles(tilesData, config){
        var $Portlet = $TilesPortlet.psgpPortlet('getBody');
        $Portlet.find('.apm-spa-tiles-column').remove();
        
        if (!tilesData || tilesData.length < 1) return;
        
        var tilesPerColumn = 5;
        var tilesTotal = tilesData.length;
        var columnTotal = Math.ceil(tilesTotal/tilesPerColumn);
        
        var columnMarkUp = '<div class="apm-spa-tiles-column"></div>'
        
        var tileMarkUp = '<div class="apm-spa-tile">' +
                            '<div class="main">' +
                                '<div class="header">' +
                                    '<div class="searchname">' +
                                    '</div>' +
                                    '<div class="searchid">' +
                                    '</div>' +
                                    '<div class="recordtype">' +
                                    '</div>' +
                                '</div>' +
                                '<div class="body">' +
                                    '<div class="kpi-label executiontime">' +
                                        APMTranslation.apm.common.label.executiontime().toLowerCase() +
                                    '</div>' +
                                    '<div class="kpi-row-1">' +
                                        '<div class="kpi col-1">' +
                                            '<div class="kpi-value executiontimeavg">' +
                                            '</div>' +
                                            '<div class="kpi-label">' +
                                                'average' +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="kpi col-2">' +
                                            '<div class="kpi-value executiontimemed">' +
                                            '</div>' +
                                            '<div class="kpi-label">' +
                                                APMTranslation.apm.common.label.median().toLowerCase() +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="kpi-row-2">' +
                                        '<div class="kpi col-1">' +
                                            '<div class="kpi-value timeoutrate">' +
                                            '</div>' +
                                            '<div class="kpi-label">' +
                                                APMTranslation.apm.common.label.timeoutrate().toLowerCase() +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="kpi col-2">' +
                                            '<div class="kpi-icon">'+
                                                '<div class="kpi-label-icon totalrequests">' +
                                                '</div>' +
                                                '<div class="kpi-value totalrequests">' +
                                                '</div>' +
                                            '</div>'+
                                            '<div class="kpi-icon">'+
                                                '<div class="kpi-label-icon totalusers">' +
                                                '</div>' +
                                                '<div class="kpi-value totalusers">' +
                                                '</div>' +
                                            '</div>'+
                                        '</div>' +
                                    '</div>' +
                                    '<div class="chart">' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
        
        for (var i = 0; i < columnTotal; i++ ) {
            var $Column = $(columnMarkUp);
            $Portlet.append($Column);   
        }
        
        for (var i = 0; i < tilesTotal; i++) {
            var $Tile = $(tileMarkUp);
            var tileData = tilesData[i];
            $Tile.find('.main').attr('tileId', tileData.id);
            $Tile.find('.searchname').html(tileData.searchName);
            $Tile.find('.searchname').attr('title',tileData.searchName);
            $Tile.find('.searchid').text(tileData.searchId);
            $Tile.find('.searchid').attr('title',tileData.searchId);
//            var recordName = APMSPA.Services.getRecordName(tileData.recordId);
//            recordName = (recordName) ? recordName : tileData.recordType;
            var recordName = tileData.recordType;
            $Tile.find('.recordtype').text(recordName);
            $Tile.find('.kpi-value.totalusers').text(tileData.totalUsers);
            $Tile.find('.kpi-value.totalrequests').text(tileData.totalRequests);
            $Tile.find('.kpi-value.executiontimemed').text(tileData.executionTimeMed + 's');
            $Tile.find('.kpi-value.timeoutrate').text(tileData.timeOutRate + '%');
            $Tile.find('.kpi-value.executiontimeavg').text(tileData.executionTimeAvg + 's');
            
            $Tile.find('.main').click(function () {
                var me = this;
                var searchId = $(me).attr('tileId');
                
                var globalSettings = APMSPA.Services.getGlobalSettings();
                var params = {
                        searchId: searchId,
                        startDateMS: globalSettings.startDateMS,
                        endDateMS: globalSettings.endDateMS,
                        compfil: globalSettings.compfil
                }
                APMSPA.Services.redirectToSPD(params)
            });
            
            var columnIndex = Math.floor(i/tilesPerColumn);
            $Portlet.find('.apm-spa-tiles-column').eq(columnIndex).append($Tile);
            
            var $chartContainer = $Tile.find('.chart');
            APMSPA.Highcharts.renderTileChart($chartContainer, tileData.executionTimeSeries, config);
        }
        
    }
    
    return {
        $TitleBar: $TitleBar,
        $ColumnPanel: $ColumnPanel,
        
        $TilesPortlet: $TilesPortlet,
        
        renderTiles: renderTiles
    }
    
};