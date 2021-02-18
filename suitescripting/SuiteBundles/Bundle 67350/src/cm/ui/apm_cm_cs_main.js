/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       18 Jan 2018     jmarimla         Initial
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
        APMCM.Services = new APMCM._Services();
        APMCM.Components = new APMCM._Components();
        APMCM.Highcharts = new APMCM._Highcharts();
        APMCM.mainPanel = new APMCM._mainPanel();
            
        // load jquery
        $(function() {
            APMCM.mainPanel.adjustCSS();
            APMCM.mainPanel.render();
        });
        
    }) 
    );
}