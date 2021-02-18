/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       18 Jan 2018     jmarimla         Initial
 * 2.00       25 Jan 2018     rwong            Added kpi
 * 3.00       29 Jan 2018     rwong            Added concurrency heatmap
 * 4.00       23 Mar 2018     jmarimla         Default daterange
 * 5.00       11 Jun 2018     jmarimla         Translation engine
 * 6.00       24 May 2019     erepollo         Removed header BG
 *
 */

APMCM = APMCM || {};

APMCM._mainPanel = function () {

    function render() {
        var $mainContent = $('#cm-main-content').addClass('psgp-main-content');

        $mainContent.append(APMCM.Components.$TitleBar)
            .append(APMCM.Components.$BtnRefresh)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMCM.Components.$ColumnPanel);


        APMCM.Components.$ColumnPanel.find('.psgp-column-panel-1')
        .append(APMCM.Components.$OverviewPortlet)
        .append($('<div>').psgpSpacer({
            height: 15
        }));

        APMCM.Components.$ColumnPanel.find('.psgp-column-panel-1')
        .append($('<div>').psgpSpacer({
            height: 15
        }))
        .append(APMCM.Components.$ConcurrencyPortlet);

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

        var globalSettings = APMCM.Services.getGlobalSettings();
        var initialDateRangeSelect = 1000*60*60*24 *3; //default: last 3 days
        globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
        globalSettings.dateRangeSelect = '' + initialDateRangeSelect;
        APMCM.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').val(globalSettings.dateRangeSelect);
        APMCM.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');

        APMCM.Services.refreshData();

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
        $(cssStyle).appendTo($('#cm-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};