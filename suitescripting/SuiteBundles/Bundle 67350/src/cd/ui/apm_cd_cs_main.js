/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Feb 2018     jmarimla         Initial
 * 2.00       11 Jun 2018     jmarimla         Translation engine
 * 3.00       06 Jul 2018     jmarimla         Widget library
 *
 */

function waitDone() {
    (function (initApplication) {
        
        initApplication($, Highcharts, window, document);
        
    } ( function ($, Highcharts, window, document) {
        
        // load libraries
    	ApmJqWidgets();
        APMCD.Services = new APMCD._Services();
        APMCD.Components = new APMCD._Components();
        APMCD.Highcharts = new APMCD._Highcharts();
        APMCD.mainPanel = new APMCD._mainPanel();
            
        // load jquery
        $(function() {
            APMCD.mainPanel.adjustCSS();
            APMCD.mainPanel.render();
        });
        
    }) 
    );
}