/**
 * Copyright © 2015, 2017, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       09 Dec 2014     jmarimla         Initial
 * 2.00       15 Jan 2015     jmarimla         Call store to load data
 * 3.00       28 Jan 2015     jmarimla         Pass dates to restlet on load; call highcharts resize
 * 4.00       10 Mar 2015     rwong            Added inital creation of setup record pages
 * 5.00       21 Mar 2015     jmarimla         Call to recordtypes store
 * 6.00       27 Mar 2015     jmarimla         Removed seconds for SPM compatibility
 * 7.00       21 Apr 2015     jmarimla         Load general setup; set css for tabs
 * 8.00       23 Apr 2015     jmarimla         Added feature checking
 * 9.00       23 Apr 2015     rwong            Added initial creation of add watchlist window and custom date time
 * 10.00      29 Apr 2015     jmarimla         Check workflow
 * 11.00      30 Apr 2015     jmarimla         Remove workflow check
 * 12.00      01 Jul 2015     jmarimla         Updated splashscreen
 * 13.00      11 Aug 2015     rwong            Added default color in case headercolor is null
 * 14.00      08 Aug 2015     jmarimla         Initialized Compid dropdown
 * 15.00      28 Aug 2015     jmarimla         Realigned compid selector
 * 16.00      26 Aug 2016     rwong            ScheduledScriptUsage portlet
 * 17.00      02 Oct 2017     jmarimla         Remove sched script portlet
 * 18.00      11 Jun 2018     jmarimla         Translation engine
 * 19.00      29 Jun 2018     jmarimla         Translation readiness
 * 20.00      08 Jan 2019     jmarimla         Translation
 * 21.00      24 May 2019     erepollo         Removed header BG
 *
 */
var splashscreen = {};

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

	    var endDateMS = new Date().setSeconds(0, 0);
	    var startDateMS = endDateMS - (1000 * 60 * 60 * 24); //1 Day ago
	    PSGP.APM.DB.dataStores.recordTilesParams = {
	        startDateMS: startDateMS,
	        endDateMS: endDateMS
	    };
	    PSGP.APM.DB.dataStores.recordTypes.load();
	    PSGP.APM.DB.dataStores.recordTilesData.load();
	    PSGP.APM.DB.dataStores.watchList.load();
	    PSGP.APM.DB.dataStores.customDateTime.load();
	    PSGP.APM.DB.dataStores.getSetupGeneral();
	    waitForStores();
	});
}

var sleep;

function waitForStores() {
    if (PSGP.APM.DB.dataStores.isLoaded()) {
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
    var headerColor = getStyle(element, 'background-color');
    if (headerColor == null) {
        headerColor = "rgb(96, 121, 152)";
    }
    var cssText = '';
    cssText += '.x4-nlg .apm-panel-portlet .x4-panel-header { background-color: ' + headerColor + ' ;}';
    cssText += '.apm-window .x4-window-header { background-color: ' + headerColor + ' ;}';
    cssText += '.apm-tabpanel { background-color: ' + headerColor + ' ;}';
    cssTool.createStyleSheet(cssText, 'apm-css');

    var mainContainer = Ext4.create('PSGP.APM.DB.Component.MainPanel', {
        renderTo: Ext4.getBody(),
        width: Ext.getBody().getViewSize().width
    });

    Ext4.create('PSGP.APM.DB.Component.Window.SetUpRecordPages', {
        id: 'psgp-apm-db-window-setup-record-pages'
    });

    Ext4.create('PSGP.APM.DB.Component.Window.WatchList.AddWatchList', {
        id: 'psgp-apm-db-window-watchlist-addwatchlist'
    });

    Ext4.create('PSGP.APM.DB.Component.Window.CustomDateTime.AddDateTime', {
        id: 'psgp-apm-db-window-customdatetime-adddatetime'
    });

    Ext4.create('PSGP.APM.DB.Component.CompIdQuickSelector');

    Ext4.EventManager.onWindowResize(function () {
        mainContainer.setWidth(Ext.getBody().getViewSize().width);
        mainContainer.doLayout();
        PSGP.APM.DB.Highcharts.resizeAllCharts();
        if (Ext4.getCmp('psgp-apm-db-quicksel-compid').isVisible()) Ext4.getCmp('psgp-apm-db-quicksel-compid').showBy(Ext4.getCmp('psgp-apm-db-btn-suiteletsettings').getEl(), 'tr-br?');
    });

    splashscreen.hide();
};

function getStyle(el, styleProp) {
    if (!el) return null;
    var css;
    if (el.currentStyle)
        css = el.currentStyle[styleProp];
    else if (window.getComputedStyle)
        css = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
    return css;
};

function checkPermissions() {
    var customRecords = nlapiGetContext().getFeature('customrecords');
    var clientScript = nlapiGetContext().getFeature('customcode');
    var serverScript = nlapiGetContext().getFeature('serversidescripting');

    if (!(customRecords && clientScript && serverScript)) {
        alert(APMTranslation.apm.common.alert.enablefeatures());
        window.location = '/app/center/card.nl?sc=-29';
    }
};
