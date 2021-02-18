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
 * 4.00       22 Mar 2017     jmarimla         WSO breakdown popup
 * 5.00       31 Mar 2017     jmarimla         Status breakdown portlet
 * 6.00       04 Apr 2017     jmarimla         Minor grid changes
 * 7.00       18 Apr 2017     jmarimla         Grid columns changes
 * 8.00       21 Apr 2017     jmarimla         Integration portlet
 * 9.00       05 May 2017     jmarimla         DateTime filters
 * 10.00      12 May 2017     jmarimla         Global settings
 * 11.00      16 May 2017     jmarimla         Top WSO charts
 * 12.00      19 May 2017     jmarimla         WSRP popup
 * 13.00      06 Jun 2017     jmarimla         Integration param
 * 14.00      22 Jun 2017     jmarimla         API portlet
 * 15.00      17 Jul 2017     jmarimla         Record type name
 * 16.00      25 Jul 2017     jmarimla         Customer filter
 * 17.00      21 Sep 2017     jmarimla         30 days checking
 * 18.00      02 Oct 2017     jmarimla         On blur customer id field
 * 19.00      11 Oct 2017     jmarimla         Added space
 * 20.00      11 Jun 2018     jmarimla         Translation engine
 * 21.00      02 Jul 2018     rwong            Translation strings
 * 22.00      19 Jul 2018     rwong            Translation strings
 * 23.00      03 Aug 2018     jmarimla         Fixed custom date
 *
 */
APMWSA = APMWSA || {};

APMWSA._Components = function() {

    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: APMTranslation.apm.wsa.label.webservicesanalysis()
    });

    var $CustomDateRangeDialog = $('' +
        '<div class="apm-wsa-dialog-customdaterange">' +
        '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
        '<div class="field-startdate"></div>' +
        '<div class="field-enddate"></div>' +
        '</div>'
    ).psgpDialog({
        title: APMTranslation.apm.common.label.customdaterange(),
        width: 400,
        autoOpen: false,
        closeOnEscape: false,
        close: function(event, ui) {
            //console.log('close');
        }
    });
    $CustomDateRangeDialog.parents('.ui-dialog').find('.ui-dialog-titlebar-close').click(function() {
        var me = this;
        var $dialog = $(me).parents('.ui-dialog');
        var $btnCancel = $dialog.find('.btn-cancel');
        $btnCancel.find('.psgp-btn-default').click();
    });
    $CustomDateRangeDialog.find('.btn-save').psgpBlueButton({
        text: APMTranslation.apm.common.button.set(),
        handler: function() {
            var me = this;
            var $dialog = $(me).parents('.apm-wsa-dialog-customdaterange');

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

            var startDateMS = APMWSA.Services.convertToPSTms(stDate, stTime);
            var endDateMS = APMWSA.Services.convertToPSTms(etDate, etTime);

            //validate date range
            if (startDateMS > endDateMS) {
                alert(APMTranslation.apm.common.alert.startdateearlierthanenddate());
                return;
            }

            //max 30 days
            if (endDateMS - startDateMS > 1000 * 60 * 60 * 24 * 30) {
                alert(APMTranslation.apm.common.alert.daterange._30days());
                return false;
            }

            var customValue = 'custom_' + startDateMS + '_' + endDateMS;
            var customLabel = APMTranslation.apm.common.label.custom() + ' (' + APMWSA.Services.convertMStoDateTimePST(stDate, stTime) + ' - ' + APMWSA.Services.convertMStoDateTimePST(etDate, etTime) + ')';
            var markUp = '<option value="' + customValue + '">' + customLabel + '</option>';
            var $settingsDateRangeDialog = $('.apm-wsa-settings-daterange-dialog');
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
        handler: function() {
            var me = this;
            var $dialog = $(me).parents('.apm-wsa-dialog-customdaterange');

            var globalSettings = APMWSA.Services.getGlobalSettings();
            var oldValue = globalSettings.dateRangeSelect;
            $('.apm-wsa-settings-daterange-dialog').find('.field-daterange .psgp-combobox').val(oldValue);
            $('.apm-wsa-settings-daterange-dialog').find('.field-daterange .psgp-combobox').selectmenu('refresh');

            $dialog.dialog('close');
        }
    });
    $CustomDateRangeDialog.find('.field-startdate').psgpDateTimeField({
        label: APMTranslation.apm.common.label.from()
    });
    $CustomDateRangeDialog.find('.field-enddate').psgpDateTimeField({
        label: APMTranslation.apm.common.label.to()
    });

    var $SettingsDateRangeDialog = $('' +
            '<div class="apm-wsa-settings-daterange-dialog">' +
            '<div><span class="psgp-field-label">' + APMTranslation.apm.common.label.daterange() + '</span><div class="field-daterange"></div></div>' +
            '<div class="container-field-customer"><span class="psgp-field-label">' + APMTranslation.apm.common.label.companyid() + '</span><div class="field-customer"></div></div>' +
            '<div><span class="psgp-field-label">' + APMTranslation.apm.common.label.integration() + '</span><div class="field-integration"></div></div>' +
            '<div class="note">' + APMTranslation.apm.common.label.selectionaffectallportlets() + '</div>' +
            '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
            '</div>')
        .psgpSettingsDialog({

        });

    if (!WSA_PARAMS.debugMode) {
        $SettingsDateRangeDialog.find('.container-field-customer').hide();
    }

    $SettingsDateRangeDialog.find('.field-customer').psgpTextBox({
        width: 250
    })

    $SettingsDateRangeDialog.find('.field-customer .psgp-textbox').blur(function() {
        var me = this;
        var compfil = $(me).val();
        var integParams = {
            compfil: compfil
        }
        APMWSA.Services.refreshIntegrationData(integParams);
    });

    $SettingsDateRangeDialog.find('.field-integration').psgpComboBox({
        list: [{
            'name': '- ' + APMTranslation.apm.common.label.all() + ' -',
            'id': 'all'
        }],
        width: 250
    });
    $SettingsDateRangeDialog.find('.field-daterange').psgpComboBox({
        list: [{
            'name': APMTranslation.apm.common.label.last1hour(),
            'id': 1000 * 60 * 60
        }, {
            'name': APMTranslation.apm.common.label.last3hours(),
            'id': 1000 * 60 * 60 * 3
        }, {
            'name': APMTranslation.apm.common.label.last6hours(),
            'id': 1000 * 60 * 60 * 6
        }, {
            'name': APMTranslation.apm.common.label.last12hours(),
            'id': 1000 * 60 * 60 * 12
        }, {
            'name': APMTranslation.apm.common.label.last24hours(),
            'id': 1000 * 60 * 60 * 24
        }, {
            'name': APMTranslation.apm.common.label.last3days(),
            'id': 1000 * 60 * 60 * 24 * 3
        }, {
            'name': APMTranslation.apm.common.label.last7days(),
            'id': 1000 * 60 * 60 * 24 * 7
        }, {
            'name': APMTranslation.apm.common.label.last14days(),
            'id': 1000 * 60 * 60 * 24 * 14
        }, {
            'name': APMTranslation.apm.common.label.last30days(),
            'id': 1000 * 60 * 60 * 24 * 30
        }, {
            'name': APMTranslation.apm.common.label.custom(),
            'id': 'custom'
        }],
        width: 190,
        change: function(event, ui) {
            var newValue = ui.item.value;
            if (newValue == 'custom') {
                var $dialog = $CustomDateRangeDialog;
                $dialog
                    .dialog('option', 'position', {
                        my: 'right top',
                        at: 'left bottom',
                        of: $('.apm-wsa-settings-daterange')
                    })
                    .dialog('open');
            }
        }
    });
    $SettingsDateRangeDialog.find('.btn-save').psgpBlueButton({
        text: APMTranslation.apm.common.button.done(),
        handler: function() {
            var me = this;
            var $dialog = $(me).parents('.apm-wsa-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMWSA.Services.getGlobalSettings();
            globalSettings.dateRangeSelect = newValue;
            if (newValue.indexOf('custom_') == -1) {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            var newInteg = $dialog.find('.field-integration .psgp-combobox').val();
            globalSettings.integration = newInteg;

            var compfil = $dialog.find('.field-customer .psgp-textbox').val();
            globalSettings.compfil = compfil;

            APMWSA.Services.refreshData();
        }
    });
    $SettingsDateRangeDialog.find('.btn-cancel').psgpGrayButton({
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            var me = this;
            var $dialog = $(me).parents('.apm-wsa-settings-daterange-dialog');
            $dialog.dialog('close');
            var globalSettings = APMWSA.Services.getGlobalSettings();
            var oldValue = globalSettings.dateRangeSelect;
            $dialog.find('.field-daterange .psgp-combobox').val(oldValue);
            $dialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');

            var oldCompfil = globalSettings.compfil;
            $dialog.find('.field-customer .psgp-textbox').val(oldCompfil);
            var integParams = {
                compfil: oldCompfil,
                restoreOldValue: true,
                oldIntegration: globalSettings.integration
            }
            APMWSA.Services.refreshIntegrationData(integParams);
        }
    });

    var $SettingsDateRange = $('<div>').addClass('apm-wsa-settings-daterange')
        .psgpSuiteletSettings({
            label: '',
            $dialog: $SettingsDateRangeDialog
        });
    $SettingsDateRange.on('updateLabel', function() {
        var $dialog = $('.apm-wsa-settings-daterange-dialog');
        $dialog.dialog('close');
        var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
        var newText = $dialog.find('.field-daterange .psgp-combobox').find(':selected').text();
        var globalSettings = APMWSA.Services.getGlobalSettings();

        var newSettingsLabel = APMTranslation.apm.common.label.viewing() + ': ';
        if (newValue.indexOf('custom_') !== -1) {
            globalSettings.endDateMS = '';
            newSettingsLabel = newSettingsLabel + newText;
        } else {
            newSettingsLabel = newSettingsLabel + newText + ' (' + APMTranslation.apm.common.label.asof({
                params: [globalSettings.asOf]
            }) + ')';
        }
        $('.apm-wsa-settings-daterange').psgpSuiteletSettings('updateLabel', newSettingsLabel);

    });

    $TitleBar.append($SettingsDateRange);

    var $BtnRefresh = $('<div>').psgpBlueButton({
        text: APMTranslation.apm.common.button.refresh(),
        handler: function() {
            var $dialog = $('.apm-wsa-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMWSA.Services.getGlobalSettings();
            if (newValue.indexOf('custom_') !== -1) {} else {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            APMWSA.Services.refreshData();
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
        title: APMTranslation.apm.wsa.label.topwebservicesoperations()
    });

    var $OverviewKPI = $('<div>').psgpKPIPanel({
        width: '100%',
        height: '150px'
    });

    var $OverviewCharts = $(
        '<div class="apm-wsa-container-wsocharts">' +
        	'<div class="chart-row">' +
        		'<div class="chart-outer">' +
        			'<div class="chart execution"></div>' +
        		'</div>' +
        		'<div class="chart-outer">' +
        			'<div class="chart throughput"></div>' +
        		'</div>' +
        	'</div>' +
        	'<div class="chart-row">' +
        		'<div class="chart-outer">' +
        			'<div class="chart errorrate"></div>' +
        		'</div>' +
        		'<div class="chart-outer">' +
        			'<div class="chart records"></div>' +
        		'</div>' +
        	'</div>' +
        '</div>'
    );

    $OverviewPortlet.psgpPortlet('getBody')
        .css('overflow', 'auto')
        .append($OverviewKPI)
        .append($OverviewCharts);

    var $TopWSRPPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.wsa.label.topwebservicesrecordprocessing()
    });

    var $TopWSRPToolbar = $('<div class="apm-wsa-topwsrp-toolbar"></div>')
    var $TopWSRPChart = $('<div class="apm-wsa-topwsrp-chart"></div>');

    $TopWSRPPortlet.psgpPortlet('getBody')
        .append($TopWSRPToolbar)
        .append($TopWSRPChart);

    var $TopWSRPCombobox = $('<div></div>').psgpComboBox({
        list: [{
                'name': APMTranslation.apm.common.label.executiontime(),
                'id': 'execution'
            },
            {
                'name': APMTranslation.apm.common.label.instancecount(),
                'id': 'instance'
            }
        ],
        width: 150,
        change: function(event, ui) {
            APMWSA.Highcharts.renderTopWsrpChart();
        }
    });

    $TopWSRPToolbar.append($TopWSRPCombobox);

    var $StatusBreakdownPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.wsa.label.statusbreakdown()
    });

    $StatusBreakdownPortlet.psgpPortlet('getBody')
        .append('<div class="apm-wsa-statusbreakdown-chart panel-1"></div>')
        .append('<div class="apm-wsa-statusbreakdown-chart panel-2"></div>');

    var $ApiPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.wsa.label.apiversionusage(),
        height: '400px'
    });

    function showWsrpChartsPopup(params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-wsa-dialog-wsrpcharts">' +
            	'<div class="toolbar"><div class="combo-operation"></div></div>' +
            	'<div class="chart"></div>' +
            '</div>';
        $obj = $(markUp);

        var recordName = APMWSA.Services.getRecordName(params.recordType);
        recordName = recordName ? recordName : 'unknown';
        var dialogTitle = APMTranslation.apm.wsa.label.webservicesrecordprocessing({
            params: [recordName]
        });
        var dialogTitle = APMTranslation.apm.wsa.label.webservicesrecordprocessing() + ' (' + recordName +')';

        $obj.psgpDialog({
            title: dialogTitle,
            width: 900
        });
        $obj.parents('.ui-dialog').css({
            "position": "absolute",
            "top": ($(window).height() - $obj.parents('.ui-dialog').height()) / 2 + $(window).scrollTop() + "px",
            "left": ($(window).width() - $obj.parents('.ui-dialog').width()) / 2 + $(window).scrollLeft() + "px"
        });

        $obj.find('.combo-operation').psgpComboBox({
            list: [{
                    'name': APMTranslation.apm.ns.common.add(),
                    'id': 'add'
                },
                {
                    'name': APMTranslation.apm.ns.wsa.update(),
                    'id': 'update'
                },
                {
                    'name': APMTranslation.apm.ns.wsa.delete(),
                    'id': 'delete'
                }
            ],
            width: 100,
            change: function(event, ui) {
                APMWSA.Highcharts.renderWsrpDetailsChart();
            }
        });

        APMWSA.Services.refreshWsrpDetailsData(params);
    }

    function showWsoBreakdownPopup(params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-wsa-dialog-wsobreakdown">' +
            	'<div class="chart"></div>' +
            '</div>';
        $obj = $(markUp);

        $obj.psgpDialog({
            title: 'Web Service Operations Breakdown (' + params.operation + ')',
            width: 900
        });
        $obj.parents('.ui-dialog').css({
            "position": "absolute",
            "top": ($(window).height() - $obj.parents('.ui-dialog').height()) / 2 + $(window).scrollTop() + "px",
            "left": ($(window).width() - $obj.parents('.ui-dialog').width()) / 2 + $(window).scrollLeft() + "px"
        });

        APMWSA.Services.refreshWsoBreakdownData(params);
    }

    return {

        $TitleBar: $TitleBar,
        $SettingsDateRange: $SettingsDateRange,
        $SettingsDateRangeDialog: $SettingsDateRangeDialog,
        $BtnRefresh: $BtnRefresh,
        $ColumnPanel: $ColumnPanel,
        $OverviewPortlet: $OverviewPortlet,
        $OverviewKPI: $OverviewKPI,
        $TopWSRPPortlet: $TopWSRPPortlet,
        $TopWSRPCombobox: $TopWSRPCombobox,
        $StatusBreakdownPortlet: $StatusBreakdownPortlet,
        $ApiPortlet: $ApiPortlet,
        showWsrpChartsPopup: showWsrpChartsPopup,
        showWsoBreakdownPopup: showWsoBreakdownPopup

    };

};