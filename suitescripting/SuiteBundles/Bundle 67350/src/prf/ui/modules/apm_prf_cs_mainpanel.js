/**
 * Copyright � 2018, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       08 Aug 2018     rwong            Initial
 * 2.00       16 Oct 2018     jmarimla         Frht id
 * 3.00       24 May 2019     erepollo         Removed header BG
 *
 */
APMPRF = APMPRF || {};

APMPRF._mainPanel = function() {

    function render() {
        var $mainContent = $('#prf-main-content').addClass('psgp-main-content');

        $mainContent
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMPRF.Components.$ColumnPanel);

        APMPRF.Components.$ColumnPanel.find('.psgp-column-panel-1')
            .append(APMPRF.Components.$ProfilerDetailsPortlet);

        $mainContent.removeClass('psgp-loading-mask');

        //resize event
        $(window).resize(function() {
            var delay = 250;
            setTimeout(function() {
                var charts = [

                ];

                for (var i in charts) {
                    if (charts[i]) charts[i].reflow();
                }
            }, delay);
        });

        var globalSettings = APMPRF.Services.getGlobalSettings();
        globalSettings.operationId = PRF_PARAMS.operationId;
        globalSettings.frhtId = PRF_PARAMS.frhtId;
        globalSettings.parentId = PRF_PARAMS.parentId;
        globalSettings.compfil = PRF_PARAMS.compfil;
        APMPRF.Services.refreshData();

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
        $(cssStyle).appendTo($('#prf-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};