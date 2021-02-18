/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Jun 2017     jmarimla         Initial
 * 2.00       16 Jun 2017     jmarimla         Perf details charts
 * 3.00       17 Jul 2017     jmarimla         Pass parameters
 * 4.00       20 Jul 2017     rwong            Top Record Performance
 * 5.00       25 Jul 2017     jmarimla         Company filter
 * 6.00       11 Jun 2018     jmarimla         Translation engine
 * 7.00       24 May 2019     erepollo         Removed header BG
 *
 */

APMWSOD = APMWSOD || {};

APMWSOD._MainPanel = function() {

    function render() {
        var $mainContent = $('#wsod-main-content').addClass('psgp-main-content');

        $mainContent.append(APMWSOD.Components.$TitleBar)
            .append($('<div>').psgpSpacer({
                height: 55
            }))
            .append(APMWSOD.Components.$ColumnPanel);

        APMWSOD.Components.$ColumnPanel.find('.psgp-column-panel-1')
            .append(APMWSOD.Components.$OverviewPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMWSOD.Components.$PerfDetailsPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMWSOD.Components.$TopRecPerf);

        $mainContent.removeClass('psgp-loading-mask');

        //resize event
        $(window).resize(function() {
            var delay = 250;
            setTimeout(function () {
                var charts = [

                ];

                for (var i in charts) {
                    if (charts[i]) charts[i].reflow();
                }
            }, delay);
        });

        var globalSettings = APMWSOD.Services.getGlobalSettings();
        globalSettings.startDateMS = WSOD_PARAMS.startDateMS;
        globalSettings.endDateMS = WSOD_PARAMS.endDateMS;
        globalSettings.integration = WSOD_PARAMS.integration;
        globalSettings.operation = WSOD_PARAMS.operation;
        globalSettings.compfil = WSOD_PARAMS.compfil;

        APMWSOD.Services.refreshData();
    }

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
        $(cssStyle).appendTo($('#wsod-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};
