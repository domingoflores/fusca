/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Aug 2017     jmarimla         Initial
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
        APMSPD.Services = new APMSPD._Services();
        APMSPD.Components = new APMSPD._Components();
        APMSPD.Highcharts = new APMSPD._Highcharts();
        APMSPD.mainPanel = new APMSPD._mainPanel();
            
        // load jquery
        $(function() {
            APMSPD.mainPanel.adjustCSS();
            APMSPD.mainPanel.render();
        });
        
    }) 
    );
}