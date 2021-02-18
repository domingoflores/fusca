/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
 
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       27 Oct 2017     jmarimla         Initial
 * 2.00       10 Nov 2017     jmarimla         New portlets
 * 3.00       11 Dec 2017     jmarimla         Elevated status
 * 4.00       14 Dec 2017     jmarimla         Utilization, concurrency
 * 5.00       18 Dec 2017     jmarimla         Scripts by priority
 * 6.00       11 Jun 2018     jmarimla         Translation engine
 * 7.00       24 May 2019     erepollo         Removed header BG
 *
 */

APMSCPM = APMSCPM || {};

APMSCPM._mainPanel = function () {

    function render() {
        var $mainContent = $('#scpm-main-content').addClass('psgp-main-content');
        
        $mainContent.append(APMSCPM.Components.$TitleBar)
            .append(APMSCPM.Components.$BtnRefresh)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSCPM.Components.$ColumnPanel);
        
        APMSCPM.Components.$ColumnPanel.find('.psgp-column-panel-1')
            .append(APMSCPM.Components.$OverviewPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSCPM.Components.$ScriptPriorityPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSCPM.Components.$UtilizationPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSCPM.Components.$ConcurrencyPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSCPM.Components.$QueueDetailsPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }));
        
        APMSCPM.Components.$ColumnPanel.find('.psgp-column-panel-2')
            .append(APMSCPM.Components.$ProcessorSettingsPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSCPM.Components.$ElevatedPrioPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSCPM.Components.$StatusPortlet)
            .append($('<div>').psgpSpacer({
                height: 15
            }));
        
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
        
        var globalSettings = APMSCPM.Services.getGlobalSettings();
        var initialDateRangeSelect = 1000*60*60*24;
        globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
        globalSettings.dateRangeSelect = '' + initialDateRangeSelect;
        APMSCPM.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').val(globalSettings.dateRangeSelect);
        APMSCPM.Components.$SettingsDateRangeDialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');
        
        APMSCPM.Services.refreshData();
        
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
        $(cssStyle).appendTo($('#scpm-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};