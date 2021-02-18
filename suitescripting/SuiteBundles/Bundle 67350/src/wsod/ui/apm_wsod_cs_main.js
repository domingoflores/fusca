/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Jun 2017     jmarimla         Initial
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
        APMWSOD.Services = new APMWSOD._Services();
        APMWSOD.Components = new APMWSOD._Components();
        APMWSOD.Highcharts = new APMWSOD._Highcharts();
        APMWSOD.MainPanel = new APMWSOD._MainPanel();
            
        // load jquery
        $(function() {
            APMWSOD.MainPanel.adjustCSS();
            APMWSOD.MainPanel.render();
        });
        
    }) 
    );
}