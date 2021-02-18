/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2018     rwong            Initial
 *
 */
function waitDone() {
    (function(initApplication) {

        initApplication($, Highcharts, window, document);

    }(function($, Highcharts, window, document) {

        // load libraries
        ApmJqWidgets();
        APMPRF.Services = new APMPRF._Services();
        APMPRF.Components = new APMPRF._Components();
        APMPRF.Highcharts = new APMPRF._Highcharts();
        APMPRF.mainPanel = new APMPRF._mainPanel();

        // load jquery
        $(function() {
            APMPRF.mainPanel.adjustCSS();
            APMPRF.mainPanel.render();
        });

    }));
}