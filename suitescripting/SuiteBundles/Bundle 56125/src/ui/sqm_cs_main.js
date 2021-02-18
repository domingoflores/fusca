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
 * Version    Date            Author            Remarks
 * 1.00       14 May 2014     maquino           Initial version
 * 2.00       16 May 2014     jmarimla          Add call to restlet for initial data
 * 3.00       20 May 2014     jmarimla          Auto resizing of height when window resizes
 * 4.00       22 May 2014     jmarimla          Removed height resizing
 * 5.00       29 May 2014     jmarimla          Initialize timeline chart; handle resizing of timeline chart
 * 6.00       02 Jun 2014     jmarimla          Changed call to initialize timeline chart
 * 7.00       09 Jun 2014     jmarimla          Do not initialize chart when there is no data
 *                                              Check on load if data reached the limit (24k)
 * 8.00       19 Jun 2014     jmarimla          Added check permission function before loading of application
 * 9.00       26 Jun 2014     jmarimla          Added perftestlogger checkpoint
 * 10.00      22 Jul 2014     jmarimla          Added copyright
 *                                              Added getStyle function; use getStyle to change color for headers
 * 11.00      25 Jul 2014     jmarimla          Used createStyleSheet for setting headerColor
 * 12.00      27 Aug 2014     jmarimla          Instantiate ssi details pop up window
 * 13.00      28 Aug 2014     jmarimla          Set css for ssi pop up window
 * 14.00      01 Sep 2014     jmarimla          Added calls to initiatialize UI
 * 15.00      08 Sep 2014     rwong             Added quicktip initialization
 *
 */

var splashscreen = {};
Ext4.onReady(function () {

    checkPermissions();

    splashscreen = Ext4.getBody().mask('Loading application', 'splashscreen');

    Ext4.tip.QuickTipManager.init();
    Ext4.apply(Ext4.tip.QuickTipManager.getQuickTip(),{
    	dismissDelay: 10000
    });

    PSGP.SQM.dataStores.callSSIRestlet();
    waitForStores();
});

var sleep;
function waitForStores() {
    if (PSGP.SQM.dataStores.isLoaded()) {
        console.log('READY');
        clearTimeout(sleep);
        init();
    } else {
        console.log('WAITING...');
        sleep = setTimeout(waitForStores, 100);
    }
}

function init(){

    /*
    * Update font immediately, necessary for positioning components during their initialization
    */
    var cssTool = Ext4.util.CSS;
    var nsFont = nlapiGetContext().getPreference('font');
    cssTool.updateRule('.sqm-panel *', 'font-family', nsFont);
    cssTool.updateRule('.sqm-window *', 'font-family', nsFont);

    var element = document.getElementById('ns_navigation');
    var headerColor;
    if (element) { //versions 14.2 and above
        headerColor = getStyle(element,'background-color');
    } else { //older versions
        var bgbar = document.getElementsByClassName('bgbar');
        element = bgbar[0];
        headerColor = getStyle(element,'background-color');
    }
    if(headerColor) {
        var cssText = '';
        cssText += '.sqm-border-center .x4-panel-header, .sqm-grid-panel .x4-panel-header { background-color: '+headerColor+' ;}';
        cssText += '.sqm-grid-panel-collapsed.x4-panel-header { background-color: '+headerColor+' ;}';
        cssText += '.x4-nlg .sqm-border-center .x4-panel-header, .x4-nlg .sqm-grid-panel .x4-panel-header { background-color: '+headerColor+' ;}';
        cssText += '.x4-nlg .sqm-grid-panel-collapsed.x4-panel-header { background-color: '+headerColor+' ;}';
        cssText += '.sqm-window .x4-window-header { background-color: '+headerColor+' ;}';
        cssTool.createStyleSheet(cssText, 'sqm-css');
    }

    var mainPanel = Ext4.create('PSGP.SQM.Component.MainPanel', {
        renderTo : Ext4.getBody()
    });
    var SSIwindow = Ext4.create('PSGP.SQM.Component.Window.SSI', {
           id : 'psgp-sqm-window-ssi'
    });

    if (timelineData.records.length > 0) timelineChartUtil.initializeChart();

    Ext4.EventManager.onWindowResize(function() {
        mainPanel.doLayout();
        timelineChartUtil.resizeChart();
    });

    Ext4.getBody().unmask();
    perfTestLogger.stop();
    PSGP.SQM.dataStores.setFieldComponents();
    PSGP.SQM.dataStores.setChartComponents();
    PSGP.SQM.dataStores.checkSSIlimit();
}

function checkPermissions() {
    var customRecords = nlapiGetContext().getFeature('customrecords');
    var clientScript = nlapiGetContext().getFeature('customcode');
    var serverScript = nlapiGetContext().getFeature('serversidescripting');

    if ( !(customRecords && clientScript && serverScript) ) {
        alert('[Custom Records], [Client SuiteScript], and [Server SuiteScript] Features must be enabled. Please enable the features and try again.');
        window.location = '/app/center/card.nl?sc=-29';
    }
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