/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Aug 2017     jmarimla         Initial
 * 2.00       10 Aug 2017     jmarimla         Saved search data
 * 3.00       07 Sep 2017     jmarimla         Redirect function
 * 4.00       18 Sep 2017     jmarimla         Customer debugging
 * 5.00       11 Jun 2018     jmarimla         Translation engine
 * 6.00       19 Jun 2018     justaris         Translation
 * 7.00       02 Jul 2018	  justaris         Translation Readiness
 *
 */

APMSPA = APMSPA || {};

APMSPA._Services = function() {
    
    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
        recordTypes: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sl_recordtypes&deploy=customdeploy_apm_sl_recordtypes',
        tiles: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spa_sl_tiles&deploy=customdeploy_apm_spa_sl_tiles' + _testModeParam,
    };
    
    var _globalParams = {};
    var _tilesData = {};
    var _tilesConfig = {};

    var _globalSettings = {
        dateRangeSelect: '' + 1000 * 60 * 60 * 24,
        startDateMS: '',
        endDateMS: '',
        sorting: '',
        asOf: '',
        compfil: '',
    };

    function getGlobalSettings() {
        return _globalSettings;
    }
    
    var _recordTypes = [];
    function getRecordName(recId) {
        var typeMatch = _recordTypes.filter(function (obj) {
            return obj.id == recId;
        });
        if (!typeMatch || typeMatch.length < 1) return '';
        var recordName = typeMatch[0].name;
        return recordName ? recordName : '';
    }

    function getURL(name) {
        return _urls[name];
    }

    function getGlobalParams() {
        return _globalParams;
    }
    
    function _getRecordTypesData(params) {
        var $xhr = $.ajax({
            url: _urls.recordTypes,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }
    
    function _getTilesData(params) {
        var $xhr = $.ajax({
            url: _urls.tiles,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }
    
    function refreshData () {
        var maskHeight = $(window).height() - 100;
        $('.psgp-main-content').css({
            height: maskHeight + 'px'
        }).addClass('psgp-loading-mask');
        
        var startDateMS, endDateMS;
        if (_globalSettings.dateRangeSelect.indexOf('custom_') !== -1) {
            var dateSplit = _globalSettings.dateRangeSelect.split('_');
            endDateMS = dateSplit[2];
            startDateMS = dateSplit[1];
        } else {
            endDateMS = parseInt(_globalSettings.endDateMS);
            startDateMS = endDateMS - parseInt(_globalSettings.dateRangeSelect);
        }

        var sorting = _globalSettings.sorting;
        
        var params = {
            startDateMS: startDateMS,
            endDateMS: endDateMS,
            sorting: sorting,
            compfil: _globalSettings.compfil
        };
        
        $.when(
                _getRecordTypesData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);
                    _recordTypes = response.data;
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                }),
                
                _getTilesData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response);
                    _tilesData = response.data;
                    _tilesConfig = response.config;
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                })
        ).then(
                function () {
                    _globalSettings.asOf = _tilesConfig.refreshDate;
                    _globalSettings.startDateMS = startDateMS;
                    _globalSettings.endDateMS = endDateMS;
                    
                    APMSPA.Components.renderTiles(_tilesData, _tilesConfig);
                    $('.apm-spa-tiles-toolbar .text-date').text(APMTranslation.apm.common.label.asof({params: [_globalSettings.asOf]}));
                    $('.psgp-main-content').removeClass('psgp-loading-mask');
                }
        );
        
    } 
    
    function redirectToSPD (params) {
        var paramString = $.param(params);
        var SPD_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_spd_sl_main&deploy=customdeploy_apm_spd_sl_main';
        window.open(SPD_URL + '&' + paramString);
    }
    
    return {
        getGlobalSettings: getGlobalSettings,
        getRecordName: getRecordName,
        refreshData: refreshData,
        redirectToSPD: redirectToSPD
    }
    
};