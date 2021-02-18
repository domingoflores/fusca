/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
 
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       02 Jan 2018     jmarimla         Initial
 * 2.00       08 Jan 2018     jmarimla         Instance details grid
 * 3.00       11 Jun 2018     jmarimla         Translation engine
 * 4.00       24 May 2019     erepollo         Removed header BG
 *
 */

APMSPJD = APMSPJD || {};

APMSPJD._mainPanel = function () {

    function render() {
        var $mainContent = $('#spjd-main-content').addClass('psgp-main-content');
        
        $mainContent.append(APMSPJD.Components.$TitleBar)
            .append(APMSPJD.Components.$BtnRefresh)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSPJD.Components.$FilterPanel)
            .append($('<div>').psgpSpacer({
                height: 15
            }))
            .append(APMSPJD.Components.$InstanceDetailsPortlet)
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
        
        //Onload Refresh Data
        if ( SPJD_PARAMS.startDateMS && SPJD_PARAMS.endDateMS ) {
            APMSPJD.Services.showLoading();
            var globalSettings = APMSPJD.Services.getGlobalSettings();
            globalSettings.startDateMS = SPJD_PARAMS.startDateMS;
            globalSettings.endDateMS = SPJD_PARAMS.endDateMS;
            globalSettings.scriptType = SPJD_PARAMS.scriptType;
            globalSettings.deploymentId = SPJD_PARAMS.deploymentId;
            APMSPJD.Components.updateDateTimeField(APMSPJD.Components.$StartDateTimeFilter, SPJD_PARAMS.startDateBd);
            APMSPJD.Components.updateDateTimeField(APMSPJD.Components.$EndDateTimeFilter, SPJD_PARAMS.endDateBd);
            
            if (SPJD_PARAMS.scriptType && (SPJD_PARAMS.scriptType == 'SCHEDULED' || SPJD_PARAMS.scriptType == 'MAPREDUCE')) {
                APMSPJD.Services.refreshDeploymentListData({
                    scriptType : SPJD_PARAMS.scriptType
                });
                APMSPJD.Components.$ScriptTypeFilter.find('.psgp-combobox').val(SPJD_PARAMS.scriptType);
                APMSPJD.Components.$ScriptTypeFilter.find('.psgp-combobox').selectmenu('refresh');
                SPJD_PARAMS.scriptType = null;
            }
            
            APMSPJD.Services.refreshData();
            APMSPJD.Services.hideLoading();
        }
        
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
        $(cssStyle).appendTo($('#spjd-main-content'));
    }

    return {
        adjustCSS: adjustCSS,
        render: render
    };

};