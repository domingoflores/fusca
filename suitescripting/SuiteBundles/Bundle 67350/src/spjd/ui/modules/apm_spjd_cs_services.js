/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       04 Jan 2018     jmarimla         Initial 
 * 2.00       08 Feb 2018     jmarimla         Instance details data
 * 3.00       11 Jun 2018     jmarimla         Translation engine
 * 4.00       02 Jul 2018     rwong            Translation strings
 *
 */

APMSPJD = APMSPJD || {};

APMSPJD._Services = function() {
    
    var _testModeParam = '&testmode=' + TEST_MODE;

    var _urls = {
        deploymentList: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spjd_sl_deploymentlist&deploy=customdeploy_apm_spjd_sl_deploymentlist' + _testModeParam,
        instanceDetails: '/app/site/hosting/scriptlet.nl?script=customscript_apm_spjd_sl_instancedetails&deploy=customdeploy_apm_spjd_sl_instancedetails' + _testModeParam
    };
    
    var _globalParams = {};

    var _globalSettings = {
        startDateMS: '',
        endDateMS: '',
        searchId: '',
        compfil: '',
    };
    
    function getGlobalSettings() {
        return _globalSettings;
    }

    function getURL(name) {
        return _urls[name];
    }

    function getGlobalParams() {
        return _globalParams;
    }
    
    function _getDeploymentListData(params) {
        var $xhr = $.ajax({
            url: _urls.deploymentList,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }
    
    function _getInstanceDetailsData(params) {
        var $xhr = $.ajax({
            url: _urls.instanceDetails,
            type: 'GET',
            data: params,
            dataType: 'json'
        });
        return $xhr;
    }
    
    function refreshDeploymentListData(deploymentListParams) {
        
        if (!deploymentListParams.scriptType) {
            APMSPJD.Components.$DeploymentFilter.find('option').remove();
            APMSPJD.Components.$DeploymentFilter.find('select').append('<option value="' + '' + '">' + '' +'</option>');
            APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').val('');
            APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').selectmenu('refresh');
            return;
        }
        
        APMSPJD.Components.$DeploymentFilter.find('option').remove();
        APMSPJD.Components.$DeploymentFilter.find('select').append('<option value="' + '' + '">' + 'Your deployments are loading. Please wait.' +'</option>');
        APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').val('');
        APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').selectmenu('refresh');
        
        var params = {
                scriptType: deploymentListParams.scriptType
        };
        
        $.when(
                _getDeploymentListData(params)
                .done(function(response) {
                    if (!response.success) {
                        alert(APMTranslation.apm.common.alert.errorinsearch());
                        return;
                    }
                    //console.log(response.data);
                    //update 
                    if (response.data && response.data.length > 0) {
                        APMSPJD.Components.$DeploymentFilter.find('option').remove();
                        var optionsMarkUp = '';
                        for (var i in response.data) {
                            var customValue = response.data[i].id;
                            var customLabel = response.data[i].name;
                            var markUp = '<option value="' + customValue + '">' + customLabel +'</option>';
                            optionsMarkUp += markUp;
                        }                        
                        APMSPJD.Components.$DeploymentFilter.find('select').append(optionsMarkUp);
                        APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').selectmenu('refresh');
                    } else {
                        APMSPJD.Components.$DeploymentFilter.find('option').remove();
                        APMSPJD.Components.$DeploymentFilter.find('select').append('<option value="' + '' + '">' + '' +'</option>');
                        APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').val('');
                        APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').selectmenu('refresh');
                    }
                })
                .fail(function(response) {
                    //console.log(response);
                	alert(APMTranslation.apm.common.alert.errorinsuitelet());
                })
        ).then(
                function () {
                    // Set dropdown if onload params are present
                    if (SPJD_PARAMS.deploymentId) {
                        APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').val(SPJD_PARAMS.deploymentId);
                        APMSPJD.Components.$DeploymentFilter.find('.psgp-combobox').selectmenu('refresh');
                        SPJD_PARAMS.deploymentId = null;
                    }
                }
        );     
    }
    
    function refreshData() {
        var params = {
                startDateMS: _globalSettings.startDateMS,
                endDateMS: _globalSettings.endDateMS,
                scriptType: _globalSettings.scriptType,
                deploymentId: _globalSettings.deploymentId
        };
        
        APMSPJD.Components.$DeploymentsGrid.psgpGrid('refreshDataRemote', params);
        APMSPJD.Services.hideLoading();   
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
    
    return {
        
        getGlobalSettings: getGlobalSettings,
        getURL: getURL,
        refreshDeploymentListData: refreshDeploymentListData,
        refreshData: refreshData,
        
        convertToPSTms: convertToPSTms,
        convertToDateObj: convertToDateObj,
        offsetToPSTms: offsetToPSTms,
        
        showLoading: showLoading,
        hideLoading: hideLoading
    }
    
};