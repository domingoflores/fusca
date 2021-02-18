/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       29 Oct 2014     jmarimla         Initial
 * 2.00       20 Nov 2014     rwong            Added create for SSD pop-up window
 * 3.00       28 Nov 2014     rwong            Added support for parameter passing.
 * 4.00       02 Dec 2014     jmarimla         Added initial call for performance chart
 * 5.00       09 Feb 2015     rwong            Added perf chart resize event.
 * ********************************************************************************
 * 1.00       18 Feb 2015     rwong            Ported code to APM
 * 2.00       03 Mar 2015     jmarimla         Modified parameter passing
 * 3.00       24 Mar 2015     jmarimla         Fixed 12pm in parameter passing
 * 4.00       31 Mar 2015     jmarimla         Fixed parsing of hour value in convertTime
 * 5.00       23 Mar 2015     jmarimla         Added feature checking
 * 6.00       29 Apr 2015     jmarimla         Check workflow
 * 7.00       30 Apr 2015     jmarimla         Remove workflow check
 * 8.00       01 Jul 2015     jmarimla         Updated splashscreen
 * 9.00       09 Jul 2015     jmarimla         Added drilldown default on parameter passing
 * 10.00      16 Jul 2015     jmarimla         Added script name in parameter passing
 * 11.00      11 Aug 2015     rwong            Added default color in case headercolor is null; clean up of unused code.
 * 12.00      13 Aug 2015     jmarimla         Passed date parameters as string
 * 13.00      25 Aug 2015     jmarimla         Initialize comp id dropdown
 * 14.00      28 Aug 2015     jmarimla         Realign compid selector
 * 15.00      08 Sep 2015     jmarimla         Indicate radix for parseInt
 * 16.00      01 Dec 2015     jmarimla         Initialize tooltips
 * 17.00      05 Aug 2016     jmarimla         Suppport for suitescript context
 * 18.00      05 Apr 2018     rwong            Added support for client scripts
 * 19.00      11 Jun 2018     jmarimla         Translation engine
 * 20.00      29 Jun 2018     jmarimla         Translation readiness
 * 21.00      16 Jul 2018     jmarimla         Set translated time
 *
 */

var splashscreen = {};
var fParams = false;
var params = new Object();

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

        Ext4.QuickTips.init();

        splashscreen = new Ext4.LoadMask(Ext4.getBody(), MASK_CONFIG);
        splashscreen.show();

        params = convertParams();
        fParams = params.fparam;

        if (params.fparam == true){
            PSGP.APM.SSA.dataStores.suiteScriptParams = {
                      startDate : params.sdatetime
                    , endDate : params.edatetime
                    , scriptType : params.scripttype
                    , scriptId: params.scriptid
                    , scriptName: params.scriptname
                    , clientEventType: 'pageInit'
                    , context: params.context
                    , drilldown: 'F'
            };
        }

        init();
    });
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

    var mainContainer = Ext4.create('PSGP.APM.SSA.Component.MainPanel', {
        renderTo : Ext4.getBody(),
        width: Ext4.getBody().getViewSize().width,
        params: params
    });

    Ext4.create('PSGP.APM.SSA.Component.Window.SSD');
    Ext4.create('PSGP.APM.SSA.Component.CompIdQuickSelector');

    Ext4.EventManager.onWindowResize(function() {
        mainContainer.setWidth(Ext.getBody().getViewSize().width);
        mainContainer.doLayout();
        PSGP.APM.SSA.Highcharts.resizePerfChart();
        if (Ext4.getCmp('psgp-apm-ssa-quicksel-compid').isVisible()) Ext4.getCmp('psgp-apm-ssa-quicksel-compid').showBy(Ext4.getCmp('psgp-apm-ssa-btn-suiteletsettings').getEl(), 'tr-br?');
    });

    if(fParams){
        PSGP.APM.SSA.dataStores.callSuiteScriptSummaryRESTlet();
        PSGP.APM.SSA.dataStores.callPerfChartRESTlet();
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
    var params = JSON.parse(nlapiGetFieldValue('ssa_params'));
    if(params.sdatetime != '' && params.edatetime != '' && params.scripttype != '' && params.scriptid != ''){
        params.sdate = convertDate(params.sdatetime);
        params.edate = convertDate(params.edatetime);
        params.stime = convertTime(params.sdatetime);
        params.etime = convertTime(params.edatetime);
        params.fparam = true;
    } else {
        params.fparam = false;
    }
    return params;
}

function convertDate (dateStr) {
    if (!dateStr) return;
    var datetime = dateStr.replace('T', ',').replace(/-/g,'/').replace(' ', ',').split(',');
    var date = datetime[0].split('/');
    var convertedDate = new Date(date[0], date[1]-1, date[2], 0, 0, 0);
    return convertedDate;
}

function convertTime (dateStr) {
    if (!dateStr) return;
    var datetime = dateStr.replace('T', ',').replace(/-/g,'/').replace(' ', ',').split(',');
    var timeRaw = datetime[1];
    return timeRaw.substring(0, 5);
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
