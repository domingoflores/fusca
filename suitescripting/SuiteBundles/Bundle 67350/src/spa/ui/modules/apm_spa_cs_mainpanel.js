/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Aug 2017     jmarimla         Initial
 * 2.00       10 Aug 2017     jmarimla         Onload data
 * 3.00       11 Jun 2018     jmarimla         Translation engine
 * 4.00       24 May 2019     erepollo         Removed header BG
 *
 */

APMSPA = APMSPA || {};

APMSPA._mainPanel = function () {

    function render() {
        var $mainContent = $('#spa-main-content').addClass('psgp-main-content');
        
        $mainContent.append(APMSPA.Components.$TitleBar)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSPA.Components.$ColumnPanel);
        
        APMSPA.Components.$ColumnPanel.find('.psgp-column-panel-1')
            .append(APMSPA.Components.$TilesPortlet)
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
        
        var globalSettings = APMSPA.Services.getGlobalSettings();
        var initialDateRangeSelect = 1000*60*60*24;
        globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
        globalSettings.dateRangeSelect = '' + initialDateRangeSelect;
        globalSettings.sorting = 'requested';
        APMSPA.Components.$TilesPortlet.find('.apm-spa-tiles-toolbar .combo-date .psgp-combobox').val(globalSettings.dateRangeSelect);
        APMSPA.Components.$TilesPortlet.find('.apm-spa-tiles-toolbar .combo-date .psgp-combobox').selectmenu('refresh');
        APMSPA.Components.$TilesPortlet.find('.apm-spa-tiles-toolbar .combo-sort .psgp-combobox').val(globalSettings.sorting);
        APMSPA.Components.$TilesPortlet.find('.apm-spa-tiles-toolbar .combo-sort .psgp-combobox').selectmenu('refresh');
        
        APMSPA.Services.refreshData();
        
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
        $(cssStyle).appendTo($('#spa-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};