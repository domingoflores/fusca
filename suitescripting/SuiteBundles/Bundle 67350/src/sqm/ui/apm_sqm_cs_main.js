/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Sep 2016     jmarimla         Initial
 * 2.00       06 Jul 2018     jmarimla         Translation readiness
 *
 */

function waitDone() {
    (function (initApplication) {
        
        initApplication($, Highcharts, window, document);
        
    } ( function ($, Highcharts, window, document) {
        
        // load libraries
    	ApmJqWidgets();
        APMSQM.Services = new APMSQM._Services();
        APMSQM.Components = new APMSQM._Components();
        APMSQM.Highcharts = new APMSQM._Highcharts();
        APMSQM.mainPanel = new APMSQM._mainPanel();
            
        // load jquery
        $(function() {
            APMSQM.mainPanel.adjustCSS();
            APMSQM.mainPanel.render();
        });
        
    }) 
    );
}