/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       27 Oct 2017     jmarimla         Initial
 * 2.00       10 Nov 2017     jmarimla         New portlets
 * 3.00       17 Nov 2017     jmarimla         Fixed grid sorting
 * 4.00       29 Nov 2017     rwong            Support for correct labels
 * 5.00       11 Dec 2017     jmarimla         Proc settings, elevated status
 * 6.00       14 Dec 2017     jmarimla         Utilization, concurrency
 * 7.00       18 Dec 2017     jmarimla         Scripts by priority
 * 8.00       28 Dec 2017     jmarimla         Elevation interval
 * 9.00       15 Jan 2018     jmarimla         Redirect to SPJD
 * 10.00      23 Jan 2018     jmarimla         Utilization instances chart
 * 11.00      09 Feb 2018     jmarimla         Label change
 * 12.00      04 Apr 2018     jmarimla         Labels
 * 13.00      12 Apr 2018     jmarimla         Labels
 * 14.00      12 Apr 2018     rwong            Added check to limit search to only 30 days from current date
 * 15.00      17 May 2018     jmarimla         Changed labels
 * 16.00      11 Jun 2018     jmarimla         Translation engine
 * 17.00      02 Jul 2018     rwong            Translation strings
 * 18.00      31 Jul 2018     rwong            Translation strings
 * 19.00      23 Nov 2018     jmarimla         Export CSV
 *
 */
APMSCPM = APMSCPM || {};

APMSCPM._Components = function() {

    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: APMTranslation.apm.spm.label.suitecloudprocessormonitor()
    });

    var $CustomDateRangeDialog = $('' +
        '<div class="apm-scpm-dialog-customdaterange">' +
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
            var $dialog = $(me).parents('.apm-scpm-dialog-customdaterange');

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

            var startDateMS = APMSCPM.Services.convertToPSTms(stDate, stTime);
            var endDateMS = APMSCPM.Services.convertToPSTms(etDate, etTime);

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

            //start date can not be more than 30 days from current date
            if (new Date().getTime() - startDateMS > 1000 * 60 * 60 * 24 * 30) {
                alert(APMTranslation.apm.common.alert.startdateearlierthanenddate());
                return false;
            }

            var customValue = 'custom_' + startDateMS + '_' + endDateMS;
            var customLabel = APMTranslation.apm.common.label.custom() + ' (' + APMSCPM.Services.convertMStoDateTimePST(stDate, stTime) + ' - ' + APMSCPM.Services.convertMStoDateTimePST(etDate, etTime) + ')';
            var markUp = '<option value="' + customValue + '">' + customLabel + '</option>';
            var $settingsDateRangeDialog = $('.apm-scpm-settings-daterange-dialog');
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
            var $dialog = $(me).parents('.apm-scpm-dialog-customdaterange');

            var globalSettings = APMSCPM.Services.getGlobalSettings();
            var oldValue = globalSettings.dateRangeSelect;
            $('.apm-scpm-settings-daterange-dialog').find('.field-daterange .psgp-combobox').val(oldValue);
            $('.apm-scpm-settings-daterange-dialog').find('.field-daterange .psgp-combobox').selectmenu('refresh');

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
            '<div class="apm-scpm-settings-daterange-dialog">' +
            '<div><span class="psgp-field-label">' + APMTranslation.apm.common.label.daterange() + '</span><div class="field-daterange"></div></div>' +
            '<div class="note">' + APMTranslation.apm.common.label.selectionaffectallportlets() + '</div>' +
            '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
            '</div>')
        .psgpSettingsDialog({

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
                        of: $('.apm-scpm-settings-daterange')
                    })
                    .dialog('open');
            }
        }
    });

    $SettingsDateRangeDialog.find('.btn-save').psgpBlueButton({
        text: APMTranslation.apm.common.button.done(),
        handler: function() {
            var me = this;
            var $dialog = $(me).parents('.apm-scpm-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMSCPM.Services.getGlobalSettings();
            globalSettings.dateRangeSelect = newValue;
            if (newValue.indexOf('custom_') == -1) {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            APMSCPM.Services.refreshData();
        }
    });

    $SettingsDateRangeDialog.find('.btn-cancel').psgpGrayButton({
        text: APMTranslation.apm.common.button.cancel(),
        handler: function() {
            var me = this;
            var $dialog = $(me).parents('.apm-scpm-settings-daterange-dialog');
            $dialog.dialog('close');
            var globalSettings = APMSCPM.Services.getGlobalSettings();
            var oldValue = globalSettings.dateRangeSelect;
            $dialog.find('.field-daterange .psgp-combobox').val(oldValue);
            $dialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');
        }
    });

    var $SettingsDateRange = $('<div>').addClass('apm-scpm-settings-daterange')
        .psgpSuiteletSettings({
            label: '',
            $dialog: $SettingsDateRangeDialog
        });

    $SettingsDateRange.on('updateLabel', function() {
        var $dialog = $('.apm-scpm-settings-daterange-dialog');
        $dialog.dialog('close');
        var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
        var newText = $dialog.find('.field-daterange .psgp-combobox').find(':selected').text();
        var globalSettings = APMSCPM.Services.getGlobalSettings();

        var newSettingsLabel = APMTranslation.apm.common.label.viewing() + ': ';
        if (newValue.indexOf('custom_') !== -1) {
            globalSettings.endDateMS = '';
            newSettingsLabel = newSettingsLabel + newText;
        } else {
            newSettingsLabel = newSettingsLabel + newText + ' (' + APMTranslation.apm.common.label.asof({
                params: [globalSettings.asOf]
            }) + ')';
        }
        $('.apm-scpm-settings-daterange').psgpSuiteletSettings('updateLabel', newSettingsLabel);

    });

    $TitleBar.append($SettingsDateRange);

    var $BtnRefresh = $('<div>').psgpBlueButton({
        text: APMTranslation.apm.common.button.refresh(),
        handler: function() {
            var $dialog = $('.apm-scpm-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMSCPM.Services.getGlobalSettings();
            if (newValue.indexOf('custom_') !== -1) {} else {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            APMSCPM.Services.refreshData();
        }
    });

    var $ColumnPanel = $('<div>').psgpColumnPanel({
        columndef: [{
            width: '75%',
            padding: '0px 5px 0px 0px'
        }, {
            width: '25%',
            padding: '0px 0px 0px 5px'
        }]
    });

    var $OverviewPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.common.label.overview()
    });

    var $OverviewKPI = $('<div>').psgpKPIPanel({
        width: '100%',
        height: '150px'
    });

    var deploymentsGridOptions = {
        url: APMSCPM.Services.getURL('deployments'),
        sort: {
            dataIndex: 'deploymentName',
            dir: false,
            remote: true
        },
        paging: {
            pageLimit: 8
        },
        exportCSV: true,
        columns: [{
                dataIndex: 'deploymentName',
                text: APMTranslation.apm.common.label.deploymentname(),
                width: '15%',
                renderer: function(value, record) {
                    var url = record.deploymentURL;
                    return '<a target="_blank" href="' + url + '">' + value + '</a>';
                }
            },
            {
                dataIndex: 'scriptName',
                text: APMTranslation.apm.common.label.scriptname(),
                width: '15%',
                renderer: function(value, record) {
                    var url = record.scriptURL;
                    return '<a target="_blank" href="' + url + '">' + value + '</a>';
                }
            },
            {
                dataIndex: 'scriptType',
                text: APMTranslation.apm.common.label.type(),
                renderer: function(value) {
                    if (value == 'MAPREDUCE')
                        return APMTranslation.apm.common.label.mapreduce();
                    if (value == 'SCHEDULED')
                        return APMTranslation.apm.common.label.scheduled();
                    return value;
                }

            },
            {
                dataIndex: 'completed',
                text: APMTranslation.apm.common.label.completed(),
                renderer: function(value) {
                    if (value == 0)
                        return '0';
                    return value;
                }
            },
            {
                dataIndex: 'failed',
                text: APMTranslation.apm.common.label.failed(),
                renderer: function(value) {
                    if (value == 0)
                        return '0';
                    return value;
                }
            },
            {
                dataIndex: 'aveDuration',
                text: APMTranslation.apm.scpm.label.aveexecutiontime(),
                renderer: function(value) {
                    return value.toFixed(2) + ' s';
                }
            },
            {
                dataIndex: 'aveWaitTime',
                text: APMTranslation.apm.scpm.label.avewaittime(),
                renderer: function(value) {
                    return value.toFixed(2) + ' s';
                }
            },
            {
                dataIndex: 'priority',
                text: APMTranslation.apm.scpm.label.priority(),
                renderer: function(value) {
                    if (value == 1)
                        return APMTranslation.apm.common.priority.high();
                    if (value == 2)
                        return APMTranslation.apm.common.priority.standard();
                    if (value == 3)
                        return APMTranslation.apm.common.priority.low();
                    return value;
                }
            },
            {
                dataIndex: 'queue',
                text: APMTranslation.apm.common.label.queue(),
                renderer: function(value) {
                    if (value == 0)
                        return '- ' + APMTranslation.apm.common.label.none() + ' -';
                    return value;
                }
            },
            {
                dataIndex: 'viewDetails',
                text: APMTranslation.apm.common.label.viewdetails(),
                width: '100px',
                renderer: function(value, record) {
                    var $markUp = $('<div><div class="apm-scpm-overviewgrid-viewdetails-icon"></div></div>');
                    $markUp.find('.apm-scpm-overviewgrid-viewdetails-icon').attr('param-oper', value);
                    return $markUp.html();
                },
                resizable: false,
                sortable: false
            }
        ],
        listeners: {
            afterRefreshData: function(grid) {
                var rows = grid.element.find('tbody tr');
                var gData = grid.options.data;
                var gParams = grid.options.params;
                rows.each(function(index) {
                    var me = this;
                    $(me).find('.apm-scpm-overviewgrid-viewdetails-icon').attr('param-rowIndex', $(this).index());
                });
                rows.hover(
                    function() {
                        $(this).find('.apm-scpm-overviewgrid-viewdetails-icon').addClass('showicon');
                    },
                    function() {
                        $(this).find('.apm-scpm-overviewgrid-viewdetails-icon').removeClass('showicon');
                    }
                );
                rows.find('.apm-scpm-overviewgrid-viewdetails-icon').click(function() {
                    var me = this;
                    var rData = gData[$(me).attr('param-rowIndex')];

                    var deploymentId = rData.deploymentId;
                    var scriptType = rData.scriptType;
                    switch (scriptType) {
                        case 'Scheduled':
                            scriptType = 'SCHEDULED';
                            break;
                        case 'Map Reduce':
                            scriptType = 'MAPREDUCE';
                            break;
                    }

                    var params = {
                        startDateMS: gParams.startDateMS,
                        endDateMS: gParams.endDateMS,
                        deploymentId: (deploymentId) ? deploymentId : '',
                        scriptType: (scriptType) ? scriptType : scriptType
                    };

                    redirectToSPJD(params);
                });
            }
        }
    };

    var $DeploymentsGrid = $('<div class="apm-scpm-grid-deployments">').psgpGrid(deploymentsGridOptions);

    $OverviewPortlet.psgpPortlet('getBody')
        .css('overflow', 'auto')
        .append($OverviewKPI)
        .append($DeploymentsGrid);

    var $QueueDetailsPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.scpm.label.queueprocessordetails()
    });

    $QueueDetailsPortlet.psgpPortlet('getBody')
        .append('<div class="apm-scpm-queuedetails-chart panel-1"></div>')
        .append('<div class="apm-scpm-queuedetails-chart panel-2"></div>');

    var $ScriptPriorityPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.scpm.label.waittimebypriority()
    });

    $ScriptPriorityPortlet.psgpPortlet('getBody')
        .append('<div class="apm-scpm-scriptpriority-chart panel-1"></div>')
        .append('<div class="apm-scpm-scriptpriority-chart panel-2"></div>');

    var $ProcessorSettingsPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.scpm.label.processorsettings()
    });

    var processorSettings = $(
        '<div class="apm-scpm-processorsettings">' +
            '<div class="block totalproc">' +
                '<div class="label"><span>' +
                    APMTranslation.apm.scpm.label.totalnoofprocessors() +
                '</span></div>' +
                '<div class="value"><span>-' +
                '</span></div>' +
            '</div>' +
            '<div class="block priority">' +
                '<div class="label"><span>' +
                    APMTranslation.apm.scpm.label.priorityelevation() +
                '</span></div>' +
                '<div class="value"><span>-' +
                '</span></div>' +
            '</div>' +
            '<div class="block elevationinterval">' +
                '<div class="label"><span>' +
                    APMTranslation.apm.scpm.label.elevationinterval() +
                '</span></div>' +
                '<div class="value"><span>-' +
                '</span></div>' +
            '</div>' +
            '<div class="block procreservation">' +
                '<div class="label"><span>' +
                    APMTranslation.apm.scpm.label.processorreservation() +
                '</span></div>' +
                '<div class="value"><span>-' +
                '</span></div>' +
            '</div>' +
            '<div class="block reservedproc">' +
                '<div class="label"><span>' +
                    APMTranslation.apm.scpm.label.noofreservedprocessors() +
                '</span></div>' +
                '<div class="value"><span>-' +
                '</span></div>' +
            '</div>' +
            '<div class="block currreserved">' +
                '<div class="label"><span>' +
                    APMTranslation.apm.scpm.label.reservedprocessorsinuse() +
                '</span></div>' +
                '<div class="value"><span>-' +
                '</span></div>' +
            '</div>' +
            '<div class="block reuseidleproc">' +
                '<div class="label"><span>' +
                    APMTranslation.apm.scpm.label.reuseidleprocessors() +
                '</span></div>' +
                '<div class="value"><span>-' +
                '</span></div>' +
            '</div>' +
        '</div>'
    );

    $ProcessorSettingsPortlet.psgpPortlet('getBody').append(processorSettings);

    var $ElevatedPrioPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.common.label.elevatedpriority(),
        height: 350
    });

    var $StatusPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.scpm.label.jobstatus(),
        height: 350
    });

    var $UtilizationPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.scpm.label.processorutilization()
    });

    $UtilizationPortlet.psgpPortlet('getBody')
        .append('<div class="apm-scpm-utilization-chart panel-1"></div>')
        .append('<div class="apm-scpm-utilization-chart panel-2"></div>');

    var $ConcurrencyPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.scpm.label.processorconcurrency(),
        height: 400
    });

    function updateProcSettings(procData) {
        $('.apm-scpm-processorsettings .totalproc .value span').text(procData.totalproc ? procData.totalproc : '0');
        $('.apm-scpm-processorsettings .priority .value span').text(procData.priority ? procData.priority.charAt(0).toUpperCase() + procData.priority.slice(1) : '-');
        $('.apm-scpm-processorsettings .elevationinterval .value span').text(procData.elevationinterval ? procData.elevationinterval : 'Disabled');
        $('.apm-scpm-processorsettings .procreservation .value span').text(procData.procreservation ? 'Enabled' : 'Disabled');
        $('.apm-scpm-processorsettings .reservedproc .value span').text(procData.reservedproc ? procData.reservedproc : '0');
        $('.apm-scpm-processorsettings .currreserved .value span').text(procData.currreserved ? procData.currreserved : '0');
        $('.apm-scpm-processorsettings .reuseidleproc .value span').text(procData.reuseidleproc ? 'Enabled' : 'Disabled');
    }

    function showConcurrencyDetailsPopup(params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-scpm-dialog-concurrencydet">' +
            '<div class="chart"></div>' +
            '</div>';
        $obj = $(markUp);

        $obj.psgpDialog({
            title: APMTranslation.apm.cd.label.concurrencydetails(),
            width: 900
        });
        $obj.parents('.ui-dialog').css({
            "position": "absolute",
            "top": ($(window).height() - $obj.parents('.ui-dialog').height()) / 2 + $(window).scrollTop() + "px",
            "left": ($(window).width() - $obj.parents('.ui-dialog').width()) / 2 + $(window).scrollLeft() + "px"
        });

        APMSCPM.Services.refreshConcurrencyDetailsData(params);
    }

    function redirectToSPJD(params) {
        var paramString = $.param(params);
        var SPJD_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_spjd_sl_main&deploy=customdeploy_apm_spjd_sl_main';
        window.open(SPJD_URL + '&' + paramString);
    }

    return {
        $TitleBar: $TitleBar,
        $SettingsDateRange: $SettingsDateRange,
        $SettingsDateRangeDialog: $SettingsDateRangeDialog,
        $BtnRefresh: $BtnRefresh,
        $ColumnPanel: $ColumnPanel,
        $OverviewPortlet: $OverviewPortlet,
        $OverviewKPI: $OverviewKPI,
        $DeploymentsGrid: $DeploymentsGrid,
        $ScriptPriorityPortlet: $ScriptPriorityPortlet,
        $QueueDetailsPortlet: $QueueDetailsPortlet,
        $ProcessorSettingsPortlet: $ProcessorSettingsPortlet,
        $ElevatedPrioPortlet: $ElevatedPrioPortlet,
        $StatusPortlet: $StatusPortlet,
        $UtilizationPortlet: $UtilizationPortlet,
        $ConcurrencyPortlet: $ConcurrencyPortlet,
        updateProcSettings: updateProcSettings,
        showConcurrencyDetailsPopup: showConcurrencyDetailsPopup
    };
};