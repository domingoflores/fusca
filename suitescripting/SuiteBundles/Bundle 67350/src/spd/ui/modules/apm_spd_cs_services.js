/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Aug 2017     jmarimla         Initial
 * 2.00       24 Aug 2017     jmarimla         Saved search details data
 * 3.00       31 Aug 2017     jmarimla         SS context data
 * 4.00       05 Sep 2017     jmarimla         offsetToPSTms
 * 5.00       07 Sep 2017     jmarimla         Misc changes
 * 6.00       18 Sep 2017     jmarimla         Customer debugging
 * 7.00       11 Jun 2018     jmarimla         Translation engine
 * 8.00       19 Jun 2018     justaris         Translation
 * 9.00       06 Jul 2018     jmarimla         Polishing translation
 * 10.00      03 Aug 2018     jmarimla         Fixed translateContext
 *
 */

APMSPD = APMSPD || {};

APMSPD._Services = function() {
    
    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
        recordTypes: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sl_recordtypes&deploy=customdeploy_apm_sl_recordtypes',
        ssList: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spd_sl_sslist&deploy=customdeploy_apm_spd_sl_sslist' + _testModeParam,
        ssDetails: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spd_sl_ssdetails&deploy=customdeploy_apm_spd_sl_ssdetails' + _testModeParam,
        ssContext: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spd_sl_sscontext&deploy=customdeploy_apm_spd_sl_sscontext' + _testModeParam,
        ssLogs: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spd_sl_sslogs&deploy=customdeploy_apm_spd_sl_sslogs' + _testModeParam
    };
    
    var _globalParams = {};

    var _globalSettings = {
        startDateMS: '',
        endDateMS: '',
        searchId: '',
        compfil: '',
    };
    
    var _recordTypes = [];
    function getRecordName(recId) {
        var typeMatch = _recordTypes.filter(function (obj) {
            return obj.id == recId;
        });
        if (!typeMatch || typeMatch.length < 1) return '';
        var recordName = typeMatch[0].name;
        return recordName ? recordName : '';
    }

    function getGlobalSettings() {
        return _globalSettings;
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
    
    function _getSsListData(params) {
        var $xhr = $.ajax({
            url: _urls.ssList,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }
    
    function _getSsDetailsData(params) {
        var $xhr = $.ajax({
            url: _urls.ssDetails,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }
    
    function _getSsContextData(params) {
        var $xhr = $.ajax({
            url: _urls.ssContext,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }
    
    function refreshSsListData() {
        
        var params = {
                compfil: _globalSettings.compfil
        };
        
        $.when(
                _getSsListData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response.data);
                    //update 
                    if (response.data && response.data.length > 0) {
                        APMSPD.Components.$SavedSearchFilter.find('option').remove();
                        var optionsMarkUp = '';
                        for (var i in response.data) {
                            var customValue = response.data[i].id;
                            var customLabel = response.data[i].name;
                            var markUp = '<option value="' + customValue + '">' + customLabel +'</option>';
                            optionsMarkUp += markUp;
                        }                        
                        APMSPD.Components.$SavedSearchFilter.find('select').append(optionsMarkUp);
                        APMSPD.Components.$SavedSearchFilter.find('.psgp-combobox').selectmenu('refresh');
                    } else {
                        APMSPD.Components.$SavedSearchFilter.find('option').remove();
                        APMSPD.Components.$SavedSearchFilter.find('select').append('<option value="' + '0' + '">' + '' +'</option>');
                        APMSPD.Components.$SavedSearchFilter.find('.psgp-combobox').val('0');
                        APMSPD.Components.$SavedSearchFilter.find('.psgp-combobox').selectmenu('refresh');
                    }
                    
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                })
        ).then(
                function () {
                    // Set dropdown if onload params are present
                    if (SPD_PARAMS.searchId) {
                        APMSPD.Components.$SavedSearchFilter.find('.psgp-combobox').val(SPD_PARAMS.searchId);
                        APMSPD.Components.$SavedSearchFilter.find('.psgp-combobox').selectmenu('refresh');
                        SPD_PARAMS.searchId = null;
                    }
                }
        );     
    }
    
    function refreshData() {
        var params = {
                startDateMS: _globalSettings.startDateMS,
                endDateMS: _globalSettings.endDateMS,
                searchId: _globalSettings.searchId,
                compfil: _globalSettings.compfil
        };
        
        $.when(
                _getSsDetailsData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response.data);
                    if ($.isEmptyObject(response.data.kpi) || response.data.histogram.total <= 0) {
                        $('.psgp-kpipanel').empty();
                        $('.apm-spd-container-ssdetailscharts .chart').empty();
                        APMSPD.Components.$NoDataAvailable.clone().appendTo($('.psgp-kpipanel'));
                    } else {
                        $('.apm-spd-nodataavailable').remove();
                        APMSPD.Components.$SsDetailsKPI.psgpKPIPanel('refreshData', response.data.kpi);
                        
                        APMSPD.Highcharts.setSsDetailsData(response.data);
                        APMSPD.Highcharts.renderSsDetailsExecutionChart();
                        APMSPD.Highcharts.renderSsDetailsRequestsChart();
                        APMSPD.Highcharts.renderSsDetailsContextChart();
                        APMSPD.Highcharts.renderSsDetailsHistogramChart();
                    }
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                }),
                
                _getSsContextData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response.data);
                    if ($.isEmptyObject(response.data.series)) {
                        APMSPD.Components.$SsContextPortlet.psgpPortlet('getBody').empty();
                        APMSPD.Components.$NoDataAvailable.clone().appendTo(APMSPD.Components.$SsContextPortlet.psgpPortlet('getBody'));
                    } else {
                        $('.apm-spd-nodataavailable').remove();
                        APMSPD.Highcharts.renderSsContextChart(response.data);
                    }
                })
                .fail(function(response) {
                    //console.log(response);
                    alert(APMTranslation.apm.common.alert.errorinsuitelet());
                })
        ).then(
                function () {
                    APMSPD.Services.hideLoading();
                }
        );     
        
    }
    
    function convertToPSTms(dateObj, timeString) {
        var ISOdateObj = convertToDateObj(dateObj, timeString);
        var PSTdateMS = offsetToPSTms(ISOdateObj.getTime());

        return PSTdateMS;
    }
    
    function convertToDateObj (dateObj, timeString) {
        var y, m, d, hr, min;
        y = dateObj.getFullYear();
        m = dateObj.getMonth() + 1;
        d = dateObj.getDate();
        hr = timeString.split(':')[0];
        min = timeString.split(':')[1];
        //console.log(''+ y + ' ' + m + ' ' + d + ' ' + hr + ' ' + min);

        //format to YYYY-MM-DDThh:mm:00.000Z
        var ISOString = '' + y + '-' + (m < 10 ? ('0' + m) : m) + '-' + (d < 10 ? ('0' + d) : d) + 'T' + hr + ':' + min + ':00.000Z';
        //convert to dateObj
        var ISOdateObj = new Date(Date.parse(ISOString));
        return ISOdateObj;
    }
    
    //function used for highcharts dates 
    function offsetToPSTms(dateMS) {
        //convert to dateObj
        var ISOdateObj = new Date(dateMS);
        //convert to GMT netsuite string
        var GMTString = NSFORMAT.format({
            value: ISOdateObj,
            type: NSFORMAT.Type.DATETIME,
            timezone: NSFORMAT.Timezone.GMT
        });
        //convert to PST date object
        var PSTdateObj = NSFORMAT.parse({
            value: GMTString,
            type: NSFORMAT.Type.DATETIME,
            timezone: NSFORMAT.Timezone.AMERICA_LOS_ANGELES
        });
        //convert to MS
        var PSTdateMS = PSTdateObj.getTime();
        return PSTdateMS;
    }
    
    function showLoading() {
        var maskHeight = $(window).height() - 100;
        $('.psgp-main-content').css({
            height: maskHeight + 'px'
        }).addClass('psgp-loading-mask');
    }
    
    function hideLoading() {
        $('.psgp-main-content').removeClass('psgp-loading-mask');
    }
    
    function translateContext(context) {
    	var translatedContext = '';
    	switch (context.toLowerCase()) {
    	case 'customfielddefault': translatedContext = APMTranslation.apm.ns.context.customfielddefault().toUpperCase(); break;
    	case 'backend': translatedContext = APMTranslation.apm.ns.context.backend().toUpperCase(); break;
    	case 'workflow': translatedContext = APMTranslation.apm.ns.context.workflow().toUpperCase(); break;
    	case 'emailalert': translatedContext = APMTranslation.apm.ns.context.emailalert().toUpperCase(); break;
    	case 'suitescript': translatedContext = APMTranslation.apm.ns.context.suitescript().toUpperCase(); break;
    	case 'machine': translatedContext = APMTranslation.apm.ns.context.machine().toUpperCase(); break;
    	case 'website': translatedContext = APMTranslation.apm.ns.context.website().toUpperCase(); break;
    	case 'snapshot': translatedContext = APMTranslation.apm.ns.context.snapshot().toUpperCase(); break;
    	case 'emailscheduled': translatedContext = APMTranslation.apm.ns.context.emailscheduled().toUpperCase(); break;
    	case 'other': translatedContext = APMTranslation.apm.ns.context.other().toUpperCase(); break;
    	default: translatedContext = context;
    	}
    	return translatedContext;
    }
    
    return {
        getGlobalSettings: getGlobalSettings,
        getRecordName: getRecordName,
        getURL: getURL,
        refreshSsListData: refreshSsListData,
        refreshData: refreshData,
        
        convertToPSTms: convertToPSTms,
        convertToDateObj: convertToDateObj,
        offsetToPSTms: offsetToPSTms,
        
        showLoading: showLoading,
        hideLoading: hideLoading,
        
        translateContext: translateContext
    }
    
};