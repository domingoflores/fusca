/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Sep 2014     jmarimla         Initial
 * 2.00       26 Sep 2014     jmarimla         Initialize css for header panels
 * 3.00       09 Oct 2014     jmarimla         Set css for windows, create set up summary window
 * 4.00       10 Oct 2014     jmarimla         Load summary set up first before UI
 * 5.00       16 Oct 2014     rwong            Support for parameter passing
 * 6.00       21 Oct 2014     jmarimla         Added function convertToDateTime for date and time parameters
 * 7.00       23 Oct 2014     jmarimla         Compute for browser width onload and when resizing
 * 8.00       19 Nov 2014     jmarimla         Commented out setup summary window
 * 9.00       21 Nov 2014     jmarimla         Removed comments for setup summary window
 * 10.00      09 Feb 2015     jmarimla         Added call to resize highcharts
 ****************************************************************************************************************
 * 1.00       23 Feb 2015     jmarimla         Porting to APM
 * 2.00       03 Mar 2015     jmarimla         Modified parameter passing
 * 3.00       21 Mar 2015     jmarimla         Added call to record type combo box store
 * 4.00       24 Mar 2015     jmarimla         Fixed 12PM in parameter passing
 * 5.00       27 Mar 2015     jmarimla         Added response time parameters
 * 6.00       31 Mar 2015     jmarimla         Fixed parsing of hour value in convertTime
 * 7.00       23 Apr 2015     jmarimla         Added feature checking
 * 8.00       29 Apr 2015     jmarimla         Check workflow
 * 9.00       30 Apr 2015     jmarimla         Remove workflow check
 * 10.00      25 Jun 2015     jmarimla         Load role combo box store
 * 11.00      01 Jul 2015     jmarimla         Updated splashscreen
 * 12.00      05 Aug 2015     rwong            Removed role combo box store
 * 13.00      11 Aug 2015     rwong            Added default color in case headercolor is null; clean up of unused code.
 * 14.00      25 Aug 2015     jmarimla         Initialize comp id dropdown
 * 15.00      28 Aug 2015     jmarimla         Realign compid selector
 * 16.00      08 Sep 2015     jmarimla         Indicate radix for parseInt
 * 17.00      01 Dec 2015     jmarimla         Initialize tooltips
 * 18.00      11 Jun 2018     jmarimla         Translation engine
 * 19.00      29 Jun 2018     jmarimla         Translation readiness
 * 20.00      16 Jul 2018     jmarimla         Modify converttime
 * 21.00      08 Jan 2019     jmarimla         Translation
 * 22.00      24 May 2019     erepollo         Removed header BG
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
	        PSGP.APM.SPM.dataStores.endToEndTimeParams = {
	                recordtype : params.rectype  ,
	                oper : params.oper          ,
	                email : params.email        ,
	                startDate : params.sdatetime,
	                endDate : params.edatetime  ,
	                responseTimeOper : params.responsetimeoper,
	                responseTime1 : params.responsetime1,
	                responseTime2 : params.responsetime2
	        };
	    }
	    PSGP.APM.SPM.dataStores.recordTypeComboBox.load();
//	    PSGP.APM.SPM.dataStores.roleComboBox.load();
	    PSGP.APM.SPM.dataStores.getSetUpSummary();
	    waitForStores();
	});
}

var sleep;
function waitForStores() {
    if (PSGP.APM.SPM.dataStores.isLoaded()) {
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
    cssText += '.x4-nlg .apm-panel-portlet .x4-panel-header { background-color: '+headerColor+' ;}';
    cssText += '.apm-window .x4-window-header { background-color: '+headerColor+' ;}';
    cssTool.createStyleSheet(cssText, 'apm-css');

    var mainContainer = Ext4.create('PSGP.APM.SPM.Component.MainPanel', {
        renderTo : Ext4.getBody(),
        width: Ext.getBody().getViewSize().width,
        params: params
    });
    var setUpSummaryWindow = Ext4.create('PSGP.APM.SPM.Component.Window.SetUpSummary', {
        id: 'psgp-apm-spm-window-setupsummary'
    });
    
    Ext4.create('PSGP.APM.SPM.Component.CompIdQuickSelector');

    Ext4.EventManager.onWindowResize(function() {
        mainContainer.setWidth(Ext.getBody().getViewSize().width);
        mainContainer.doLayout();
        PSGP.APM.SPM.Highcharts.resizeAllCharts();
        if (Ext4.getCmp('psgp-apm-spm-quicksel-compid').isVisible()) Ext4.getCmp('psgp-apm-spm-quicksel-compid').showBy(Ext4.getCmp('psgp-apm-spm-btn-suiteletsettings').getEl(), 'tr-br?');
    });

    if(fParams){
        PSGP.APM.SPM.dataStores.endToEndTimeData.loadPage(1);
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
    var params = JSON.parse(nlapiGetFieldValue('apm_spm_params'));
    if(params.rectype != '' && params.oper != '' && params.sdatetime != '' && params.edatetime != ''){
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
