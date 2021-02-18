/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       25 Feb 2015     jyeh             Initial
 * 2.00       24 Mar 2015     jyeh
 * 3.00       28 Mar 2015     jyeh
 * 4.00       22 Apr 2015     jmarimla         Removed wait for elements
 * 5.00       23 Apr 2015     jmarimla         Added feature checking
 * 6.00       29 Apr 2015     jmarimla         Check workflow
 * 7.00       30 Apr 2015     jmarimla         Remove workflow check
 * 8.00       01 Jul 2015     jmarimla         Updated splashscreen
 * 9.00       11 Aug 2015     rwong            Added default color in case headercolor is null; clean up of unused code.
 * 10.00      11 Jun 2018     jmarimla         Translation engine
 * 11.00      29 Jun 2018     jmarimla         Translation readiness
 * 12.00      01 Jan 2019     rwong            Translation strings replacement
 * 13.00      11 Oct 2019     jmarimla         Search by operationid
 *
 */

var splashscreen = {};
var params = {};

function waitDone() {
    APMExtJSCommon();
    APMModels();
    APMStores();
    APMComponents();
    APMMainPanel();
    APMHighcharts();
    ExtReady();
}

function ExtReady() {
    Ext4.onReady(function () {

        checkPermissions();

        splashscreen = new Ext4.LoadMask(Ext4.getBody(), MASK_CONFIG);
        splashscreen.show();

        params = convertParams();

        if (params.fparam){
            PSGP.APM.SIA.dataStores.params.operationId = params.operationId;
        }
        waitForStores();
    });
}

var sleep;
function waitForStores() {
    if (PSGP.APM.SIA.dataStores.isLoaded()) {
        console.log('READY');
        clearTimeout(sleep);
        init();
    } else {
        console.log('WAITING...');
        sleep = setTimeout(waitForStores, 100);
    }
}

function init() {
    /*
     * Update CSS immediately
     */
    var cssTool = Ext4.util.CSS;
    var nsFont = nlapiGetContext().getPreference('font');
    cssTool.updateRule('.apm-container *', 'font-family', nsFont);
    cssTool.updateRule('.apm-window *', 'font-family', nsFont);

    var element = document.getElementById('ns_navigation');
    var headerColor = getStyle(element,'background-color');
    if(headerColor == null) {
        headerColor = "rgb(96, 121, 152)";
    }
    var cssText = '';
    cssText += '.apm-panel-portlet .x4-panel-header { background-color: '+headerColor+' ;}';
    cssText += '.x4-nlg .apm-panel-portlet .x4-panel-header { background-color: '+headerColor+' ;}';
    cssText += '.apm-window .x4-window-header { background-color: '+headerColor+' ;}';
    cssTool.createStyleSheet(cssText, 'apm-css');

    var mainContainer = Ext4.create('PSGP.APM.SIA.Component.MainPanel', {
        renderTo : Ext4.getBody(),
        width: Ext.getBody().getViewSize().width,
        params: convertParams()
    });
    
    Ext4.create('PSGP.APM.SIA.Component.CompIdQuickSelector');

    Ext4.EventManager.onWindowResize(function() {
        mainContainer.setWidth(Ext.getBody().getViewSize().width);
        mainContainer.doLayout();
        PSGP.APM.SIA.Highcharts.resizeAllCharts();
        if (Ext4.getCmp('psgp-apm-sia-quicksel-compid').isVisible()) Ext4.getCmp('psgp-apm-sia-quicksel-compid').showBy(Ext4.getCmp('psgp-apm-sia-btn-suiteletsettings').getEl(), 'tr-br?');
    });

    if(params.fparam){
        PSGP.APM.SIA.dataStores.suiteScriptDetailData.load();
    }
    else{
        Ext4.getCmp('psgp-apm-sia-suitescriptdetail-chart-nodata').show();
        Ext4.getCmp('psgp-apm-sia-timeline-chart').hide();
    }

    splashscreen.hide();
}

function getStyle(el,styleProp)
{
    if (!el) return null;
    var css;
    if (el.currentStyle)
        css = el.currentStyle[styleProp];
    else if (window.getComputedStyle)
        css = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
    return css;
}

function convertParams() {
    var params = JSON.parse(nlapiGetFieldValue('apm_sia_params'));
    if(params.operationId){
        params.fparam = true;
    } else {
        params.fparam = false;
    }
    return params;
}

function checkPermissions() {
    var customRecords = nlapiGetContext().getFeature('customrecords');
    var clientScript = nlapiGetContext().getFeature('customcode');
    var serverScript = nlapiGetContext().getFeature('serversidescripting');

    if ( !(customRecords && clientScript && serverScript) ) {
        alert(APMTranslation.apm.common.alert.enablefeatures());
        window.location = '/app/center/card.nl?sc=-29';
    }
}
