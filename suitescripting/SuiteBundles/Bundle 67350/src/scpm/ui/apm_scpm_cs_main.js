/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
 
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       27 Oct 2017     jmarimla         Initial
 * 2.00       11 Jun 2018     jmarimla         Translation engine
 * 3.00       06 Jul 2018     jmarimla         Widget library
 * 4.00       21 Dec 2018     jmarimla         Language restriction
 *
 */

function waitDone() {
    (function (initApplication) {
        
        initApplication($, Highcharts, window, document);
        
    } ( function ($, Highcharts, window, document) {
    	
    	//check language
        var en_languages = [
            'en',
            'en_AU',
            'en_CA',
            'en_GB',
            'en_US'
            ];
        if (en_languages.indexOf(APMLocale)<0) {
        	var errorMsg = 'The SuiteCloud Processor Monitor in APM does not support your language preference at this time. To use this tool, set your language to English before you go to the page.'
        		+ '\n' + 'To set your language preference, go to Home > Set Preferences.';
            alert(errorMsg);
            window.location = '/app/center/card.nl?sc=-29';
        }
        
        // load libraries
    	ApmJqWidgets();
        APMSCPM.Services = new APMSCPM._Services();
        APMSCPM.Components = new APMSCPM._Components();
        APMSCPM.Highcharts = new APMSCPM._Highcharts();
        APMSCPM.mainPanel = new APMSCPM._mainPanel();
            
        // load jquery
        $(function() {
            APMSCPM.mainPanel.adjustCSS();
            APMSCPM.mainPanel.render();
        });
        
    }) 
    );
}