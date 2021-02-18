/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Sep 2016     jmarimla         Initial
 * 2.00       11 Oct 2016     jmarimla         Count portlet
 * 3.00       27 Oct 2016     jmarimla         Overview grid
 * 4.00       10 Nov 2016     rwong            Column panel component
 * 5.00       18 Nov 2016     jmarimla         Added queue status portlet
 * 6.00       23 Nov 2016     jmarimla         Heatmap portlet
 * 7.00       25 Nov 2016     jmarimla         Dialog css adjustment
 * 8.00       25 Nov 2016     rwong            Added support for loading mask
 * 9.00       12 Dec 2016     jmarimla         Global settings components
 * 10.00      10 Jan 2017     jmarimla         Apply global date range
 * 11.00      12 Jan 2017     rwong            Combine Queue Utilization and Script Instance Count
 * 12.00      03 Feb 2017     jmarimla         Add resize event
 * 13.00      06 Jul 2018     jmarimla         Translation readiness
 * 14.00      24 May 2019     erepollo         Removed header BG
 *
 */
APMSQM = APMSQM || {};

APMSQM._mainPanel = function () {

    function render() {

        var $mainContent = $('#sqm-main-content').addClass('psgp-main-content');

        $mainContent.append(APMSQM.Components.$TitleBar)
            .append(APMSQM.Components.$BtnRefresh)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSQM.Components.$ColumnPanel);

        var $mainPanel = $('.psgp-column-panel-1');

        $mainPanel.append(APMSQM.Components.$OverviewPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSQM.Components.$UtilizationPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSQM.Components.$HeatMapPortlet);

        var $sidePanel = $('.psgp-column-panel-2');
        $sidePanel
            .append(APMSQM.Components.$QueueStatusPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }));

        $mainContent.removeClass('psgp-loading-mask');
        
        //resize event
        $(window).resize(function() {
            var delay = 250;
            setTimeout(function () {
                var charts = [
                    APMSQM.Components.$UtilizationPortlet.find('.psgp-utilization-chart').highcharts(),
                    APMSQM.Components.$UtilizationPortlet.find('.psgp-count-chart').highcharts(),
                    APMSQM.Components.$HeatMapPortlet.psgpPortlet('getBody').highcharts()
                ];
                
                for (var i in charts) {
                    if (charts[i]) charts[i].reflow();
                }
            }, delay);
        });

        var globalSettings = APMSQM.Services.getGlobalSettings();
        globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
        globalSettings.dateRangeSelect = '' + 1000*60*60*24;
        APMSQM.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').val(globalSettings.dateRangeSelect);
        APMSQM.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');
        APMSQM.Services.refreshData();
    };

    function adjustCSS() {
        var themeColor = $('#ns_navigation').css('background-color');
        themeColor = themeColor || '#DDDDDD';
        var fontFamily = $('.uir-record-type').css('font-family');
        fontFamily = fontFamily || '#Serif';
        var cssStyle = '' +
            '<style type="text/css">' +
            '.psgp-main-content *, .psgp-dialog *, .psgp-settings-dialog *, .psgp-dialog input, .psgp-settings-dialog input { font-family: ' + fontFamily + ';}' +
            '.psgp-dialog .ui-dialog-titlebar { background-color: ' + themeColor + ';}' +
            '</style>';
        $(cssStyle).appendTo($('#sqm-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};