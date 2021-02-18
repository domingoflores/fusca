/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Mar 2017     jmarimla         Initial
 * 2.00       10 Mar 2017     jmarimla         Overview portlet
 * 3.00       17 Mar 2017     jmarimla         Top WSRP portlet
 * 4.00       31 Mar 2017     jmarimla         Status breakdown portlet
 * 5.00       21 Apr 2017     jmarimla         Integration portlet
 * 6.00       05 May 2017     jmarimla         Resize event
 * 7.00       12 May 2017     jmarimla         Global settings
 * 8.00       16 May 2017     jmarimla         Top WSO charts
 * 9.00       06 Jun 2017     jmarimla         Integration data
 * 10.00      22 Jun 2017     jmarimla         API portlet
 * 11.00      11 Jun 2018     jmarimla         Translation engine
 * 12.00      24 May 2019     erepollo         Removed header BG
 *
 */

APMWSA = APMWSA || {};

APMWSA._mainPanel = function () {

    function render() {
        var $mainContent = $('#wsa-main-content').addClass('psgp-main-content');
        
        $mainContent.append(APMWSA.Components.$TitleBar)
            .append(APMWSA.Components.$BtnRefresh)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMWSA.Components.$ColumnPanel);
        
        APMWSA.Components.$ColumnPanel.find('.psgp-column-panel-1')
            .append(APMWSA.Components.$OverviewPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMWSA.Components.$TopWSRPPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMWSA.Components.$StatusBreakdownPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMWSA.Components.$ApiPortlet);
        
        $mainContent.removeClass('psgp-loading-mask');
        
        //resize event
        $(window).resize(function() {
            var delay = 250;
            setTimeout(function () {
                var charts = [
                    APMWSA.Components.$OverviewPortlet.find('.apm-wsa-container-wsocharts .execution').highcharts(),
                    APMWSA.Components.$OverviewPortlet.find('.apm-wsa-container-wsocharts .throughput').highcharts(),
                    APMWSA.Components.$OverviewPortlet.find('.apm-wsa-container-wsocharts .errorrate').highcharts(),
                    APMWSA.Components.$OverviewPortlet.find('.apm-wsa-container-wsocharts .records').highcharts(),
                    APMWSA.Components.$TopWSRPPortlet.find('.apm-wsa-topwsrp-chart').highcharts(),
                    APMWSA.Components.$StatusBreakdownPortlet.find('.apm-wsa-statusbreakdown-chart.panel-1').highcharts(),
                    APMWSA.Components.$StatusBreakdownPortlet.find('.apm-wsa-statusbreakdown-chart.panel-2').highcharts(),
                    APMWSA.Components.$ApiPortlet.psgpPortlet('getBody').highcharts()
                ];
                
                for (var i in charts) {
                    if (charts[i]) charts[i].reflow();
                }
            }, delay);
        });
        
        var globalSettings = APMWSA.Services.getGlobalSettings();
        var initialDateRangeSelect = 1000*60*60*24;
        globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
        globalSettings.dateRangeSelect = '' + initialDateRangeSelect;
        APMWSA.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').val(globalSettings.dateRangeSelect);
        APMWSA.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');
        
        var integParams = {
                startDateMS : globalSettings.endDateMS - initialDateRangeSelect,
                endDateMS : globalSettings.endDateMS
        }
        APMWSA.Services.refreshIntegrationData(integParams);
        
        APMWSA.Services.refreshData();
        
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
        $(cssStyle).appendTo($('#wsa-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};