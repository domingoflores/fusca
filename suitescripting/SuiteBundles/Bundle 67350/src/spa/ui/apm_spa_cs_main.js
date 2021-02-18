/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Aug 2017     jmarimla         Initial
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
        APMSPA.Services = new APMSPA._Services();
        APMSPA.Components = new APMSPA._Components();
        APMSPA.Highcharts = new APMSPA._Highcharts();
        APMSPA.mainPanel = new APMSPA._mainPanel();
            
        // load jquery
        $(function() {
            APMSPA.mainPanel.adjustCSS();
            APMSPA.mainPanel.render();
        });
        
    }) 
    );
}