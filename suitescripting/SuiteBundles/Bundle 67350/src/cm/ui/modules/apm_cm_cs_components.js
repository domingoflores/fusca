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
 * 4.00       02 Feb 2018     jmarimla         Concurrency details
 * 5.00       09 Feb 2018     jmarimla         Instance popup
 * 6.00       19 Feb 2018     rwong            Violation chart
 * 7.00       23 Feb 2018     jmarimla         Remove concurrency details
 * 8.00       23 Mar 2018     jmarimla         Daterange options
 * 9.00       04 Apr 2018     jmarimla         Labels
 * 10.00      17 Apr 2018     jmarimla         Customer debugging
 * 11.00      11 May 2018     jmarimla         Chart Legend and footnote
 * 12.00      11 Jun 2018     jmarimla         Translation engine
 * 13.00      02 Jul 2018	  justaris         Translation Readiness
 *
 */

APMCM = APMCM || {};

APMCM._Components = function() {

    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: APMTranslation.apm.cm.label.concurrencymonitor()
    });

    var $CustomDateRangeDialog = $('' +
            '<div class="apm-cm-dialog-customdaterange">' +
                '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
                '<div class="field-startdate"></div>' +
                '<div class="field-enddate"></div>' +
            '</div>'
            ).psgpDialog({
                title: APMTranslation.apm.common.label.customdaterange(),
                width: 400,
                autoOpen: false,
                closeOnEscape: false,
                close: function( event, ui ) {
                    //console.log('close');
                }
            });
        $CustomDateRangeDialog.parents('.ui-dialog').find('.ui-dialog-titlebar-close').click(function () {
            var me = this;
            var $dialog = $(me).parents('.ui-dialog');
            var $btnCancel =$dialog.find('.btn-cancel');
            $btnCancel.find('.psgp-btn-default').click();
        });
        $CustomDateRangeDialog.find('.btn-save').psgpBlueButton({
            text: APMTranslation.apm.common.button.set(),
            handler: function () {
                var me = this;
                var $dialog = $(me).parents('.apm-cm-dialog-customdaterange');

                var $startDateTimeField = $dialog.find('.field-startdate');
                var $endDateTimeField = $dialog.find('.field-enddate');

                var stDate = $startDateTimeField.psgpDateTimeField('getDateValue');
                var stTime = $startDateTimeField.psgpDateTimeField('getTimeValue');
                var etDate = $endDateTimeField.psgpDateTimeField('getDateValue');
                var etTime = $endDateTimeField.psgpDateTimeField('getTimeValue');

                //validate dates
                if (!$startDateTimeField.psgpDateTimeField('isDateValid')) {
                    alert(APMTranslation.apm.common.alert.entervalidstartdate());
                    return;
                }
                if (!$endDateTimeField.psgpDateTimeField('isDateValid')) {
                    alert(APMTranslation.apm.common.alert.entervalidenddate());
                    return;
                }

                var startDateMS = APMCM.Services.convertToPSTms(stDate, stTime);
                var endDateMS = APMCM.Services.convertToPSTms(etDate, etTime);

                //validate date range
                if(startDateMS > endDateMS) {
                    alert(APMTranslation.apm.common.alert.startdateearlierthanenddate());
                    return;
                }

                //min 3 days
                if(endDateMS - startDateMS < 1000*60*60*24*3) {
                    alert(APMTranslation.apm.common.alert.daterange._3days());
                    return false;
                }
                
                //max 30 days
                if(endDateMS - startDateMS > 1000*60*60*24*30) {
                    alert(APMTranslation.apm.common.alert.daterange._30days());
                    return false;
                }

                var customValue = 'custom_' + startDateMS + '_' + endDateMS;
                var customLabel = APMTranslation.apm.common.label.custom() + ' (' + APMCM.Services.convertMStoDateTimePST(stDate, stTime) + ' - ' + APMCM.Services.convertMStoDateTimePST(etDate, etTime) + ')';
                var markUp = '<option value="' + customValue + '">' + customLabel +'</option>';
                var $settingsDateRangeDialog =  $('.apm-cm-settings-daterange-dialog');
                $settingsDateRangeDialog.find('.field-daterange option[value*="custom_"]').remove();
                var $customOption = $settingsDateRangeDialog.find('.field-daterange option').last();
                $(markUp).insertBefore($customOption);
                $settingsDateRangeDialog.find('.field-daterange .psgp-combobox').val(customValue);
                $settingsDateRangeDialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');

                $dialog.dialog('close');
            }
        });
        $CustomDateRangeDialog.find('.btn-cancel').psgpGrayButton({
            text: APMTranslation.apm.common.button.cancel(),
            handler: function () {
                var me = this;
                var $dialog = $(me).parents('.apm-cm-dialog-customdaterange');

                var globalSettings = APMCM.Services.getGlobalSettings();
                var oldValue = globalSettings.dateRangeSelect;
                $('.apm-cm-settings-daterange-dialog').find('.field-daterange .psgp-combobox').val(oldValue);
                $('.apm-cm-settings-daterange-dialog').find('.field-daterange .psgp-combobox').selectmenu('refresh');

                $dialog.dialog('close');
            }
        });
        $CustomDateRangeDialog.find('.field-startdate').psgpDateTimeField({
            label: APMTranslation.apm.common.label.from()
        });
        $CustomDateRangeDialog.find('.field-enddate').psgpDateTimeField({
            label: APMTranslation.apm.common.label.to()
        });

    var $SettingsDateRangeDialog =  $('' +
            '<div class="apm-cm-settings-daterange-dialog">' +
                '<div><span class="psgp-field-label">' + APMTranslation.apm.common.label.daterange() + '</span><div class="field-daterange"></div></div>' +
                '<div class="container-field-customer"><span class="psgp-field-label">' + APMTranslation.apm.common.label.companyid() + '</span><div class="field-customer"></div></div>' +
                '<div class="note">' + APMTranslation.apm.common.label.selectionaffectallportlets() + '</div>' +
                '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
            '</div>')
            .psgpSettingsDialog({

            });
    
    if (!CM_PARAMS.debugMode) {
        $SettingsDateRangeDialog.find('.container-field-customer').hide();
    }
    
    $SettingsDateRangeDialog.find('.field-customer').psgpTextBox({
        width:  250
    });
    
    $SettingsDateRangeDialog.find('.field-daterange').psgpComboBox({
        list: [
                { 'name': APMTranslation.apm.common.label.last3days(), 'id': 1000*60*60*24*3 }
              , { 'name': APMTranslation.apm.common.label.last7days(), 'id': 1000*60*60*24*7 }
              , { 'name': APMTranslation.apm.common.label.last14days(), 'id': 1000*60*60*24*14 }
              , { 'name': APMTranslation.apm.common.label.last30days(), 'id': 1000*60*60*24*30 }
              , { 'name': APMTranslation.apm.common.label.custom(), 'id': 'custom' }
                ],
        width:  190,
        change: function( event, ui ) {
            var newValue = ui.item.value;
            if (newValue == 'custom') {
                var $dialog = $CustomDateRangeDialog;
                $dialog
                    .dialog('option', 'position', {my: 'right top', at: 'left bottom', of: $('.apm-cm-settings-daterange')})
                    .dialog('open');
            }
        }
    });
    $SettingsDateRangeDialog.find('.btn-save').psgpBlueButton({
        text: APMTranslation.apm.common.button.done(),
        handler: function () {
            var me = this;
            var $dialog = $(me).parents('.apm-cm-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMCM.Services.getGlobalSettings();
            globalSettings.dateRangeSelect = newValue;
            if (newValue.indexOf('custom_') == -1) {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            var compfil = $dialog.find('.field-customer .psgp-textbox').val();
            globalSettings.compfil = compfil;
            
            APMCM.Services.refreshData();
        }
    });
    $SettingsDateRangeDialog.find('.btn-cancel').psgpGrayButton({
        text: APMTranslation.apm.common.button.cancel(),
        handler: function () {
            var me = this;
            var $dialog = $(me).parents('.apm-cm-settings-daterange-dialog');
            $dialog.dialog('close');
            var globalSettings = APMCM.Services.getGlobalSettings();
            var oldValue = globalSettings.dateRangeSelect;
            $dialog.find('.field-daterange .psgp-combobox').val(oldValue);
            $dialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');
            $dialog.find('.field-customer .psgp-textbox').val(globalSettings.compfil);
        }
    });

    var $SettingsDateRange = $('<div>').addClass('apm-cm-settings-daterange')
        .psgpSuiteletSettings({
            label: '',
            $dialog: $SettingsDateRangeDialog
        });
    $SettingsDateRange.on('updateLabel', function(){
        var $dialog = $('.apm-cm-settings-daterange-dialog');
        $dialog.dialog('close');
        var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
        var newText = $dialog.find('.field-daterange .psgp-combobox').find(':selected').text();
        var globalSettings = APMCM.Services.getGlobalSettings();

        var newSettingsLabel = APMTranslation.apm.common.label.viewing() + ': ';
        if (newValue.indexOf('custom_') !== -1) {
            globalSettings.endDateMS = '';
            newSettingsLabel = newSettingsLabel + newText;
        } else {
            newSettingsLabel = newSettingsLabel + newText + ' ' + APMTranslation.apm.common.label.asof({params: [globalSettings.asOf]}) + ')';
        }
        $('.apm-cm-settings-daterange').psgpSuiteletSettings('updateLabel', newSettingsLabel);

    });

    $TitleBar.append($SettingsDateRange);

    var $BtnRefresh = $('<div>').psgpBlueButton({
        text: APMTranslation.apm.common.button.refresh(),
        handler: function () {
            var $dialog = $('.apm-cm-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMCM.Services.getGlobalSettings();
            if (newValue.indexOf('custom_') !== -1) {

            } else {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            APMCM.Services.refreshData();
        }
    });

    var $ColumnPanel = $('<div>').psgpColumnPanel({
        columndef: [{
            width: '99%',
            padding: '0px 0px 0px 0px'
        }, {
            width: '1%',
            padding: '0px 0px 0px 0px'
        }]
    });

    var $OverviewPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.common.label.overview()
    });

    var $OverviewKPI = $('<div>').psgpKPIPanel({
        width: '100%',
        height: '100px'
    });

    $OverviewPortlet.psgpPortlet('getBody')
    .css('overflow', 'auto')
    .append($OverviewKPI);

    var $ConcurrencyPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.cm.label.generalconcurrency()
    });

    var $ConcurrencyToolbar = $('<div class="apm-cm-concurrency-toolbar"></div>')
    var $ConcurrencyEstimated = $('<div class="apm-cm-concurrency-estimated"></div>')

    var $ConcurrencyComboBox = $('<div></div>').psgpComboBox({
        list: [
            { 'name': APMTranslation.apm.cm.label.requestswithinlimit(), 'id': 'concurrency' },
            { 'name': APMTranslation.apm.cm.label.requestexceedinglimit(), 'id': 'violation' }
            ],
        width:  225,
        change: function( event, ui ) {
            APMCM.Highcharts.renderConcurrencyHMChart();
        }
    });

    $ConcurrencyToolbar.append($ConcurrencyComboBox);
    
    var $ConcurrencyLegend = $(
            '<div class="apm-cm-concurrency-legend">' +
	            '<div class="legend-container">' +
	                '<div class="legend-item">' +
	                    '<div class="legend-icon icon-1">' +
	                    '</div>' +
	                    '<div class="legend-text">' +
	                        '0%' +
	                    '</div>' + 
	                '</div>' +
	                '<div class="legend-item">' +
	                    '<div class="legend-icon icon-2">' +
	                    '</div>' +
	                    '<div class="legend-text">' +
	                        '1%-25%' +
	                    '</div>' + 
	                '</div>' +
	                '<div class="legend-item">' +
	                    '<div class="legend-icon icon-3">' +
	                    '</div>' +
	                    '<div class="legend-text">' +
	                        '26%-50%' +
	                    '</div>' + 
	                '</div>' +
	                '<div class="legend-item">' +
	                    '<div class="legend-icon icon-4">' +
	                    '</div>' +
	                    '<div class="legend-text">' +
	                        '51%-75%' +
	                    '</div>' + 
	                '</div>' +
	                '<div class="legend-item">' +
	                    '<div class="legend-icon icon-5">' +
	                    '</div>' +
	                    '<div class="legend-text">' +
	                        '76%-100%' +
	                    '</div>' + 
	                '</div>' +
	                '<div class="legend-item">' +
	                    '<div class="legend-icon icon-6">' +
	                    '</div>' +
	                    '<div class="legend-text">' +
	                        APMTranslation.apm.cm.label._101andabove() +
	                    '</div>' + 
	                '</div>' + 
	            '</div>' +
	        '</div>'
	);
    
    $ConcurrencyFootnote = $(
    		'<div class="apm-cm-concurrency-footnote"></div>'
    );

    $ConcurrencyPortlet.psgpPortlet('getBody')
        .append($ConcurrencyToolbar)
        .append($ConcurrencyEstimated)
        .append($ConcurrencyLegend)
        .append($ConcurrencyFootnote)

    return {
        $TitleBar: $TitleBar,
        $SettingsDateRange: $SettingsDateRange,
        $SettingsDateRangeDialog: $SettingsDateRangeDialog,
        $BtnRefresh: $BtnRefresh,
        $ColumnPanel: $ColumnPanel,
        $OverviewPortlet: $OverviewPortlet,
        $OverviewKPI: $OverviewKPI,
        $ConcurrencyPortlet: $ConcurrencyPortlet,
        $ConcurrencyComboBox: $ConcurrencyComboBox
    };

 };