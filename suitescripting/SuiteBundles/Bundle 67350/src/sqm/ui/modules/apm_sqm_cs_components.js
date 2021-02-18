/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Sep 2016     jmarimla         Initial
 * 2.00       11 Oct 2016     jmarimla         Count Portlet
 * 3.00       27 Oct 2016     jmarimla         Overview Grid
 * 4.00       09 Nov 2016     jmarimla         Grid configuration
 * 5.00       10 Nov 2016     rwong            Column panel component
 * 6.00       11 Nov 2016     jmarimla         Add kpi panel
 * 7.00       18 Nov 2016     jmarimla         Add queue status portlet
 * 8.00       23 Nov 2016     jmarimla         Heatmap component
 * 9.00       25 Nov 2016     rwong            Updated ratio for columns
 * 10.00      28 Nov 2016     jmarimla         Set default sizes
 * 11.00      12 Dec 2016     jmarimla         Global settings components
 * 12.00      10 Jan 2017     jmarimla         Apply global date range
 * 13.00      12 Jan 2017     jmarimla         Move enddate reset
 * 14.00      12 Jan 2017     rwong            Combine Queue Utilization and Script Instance Count
 * 15.00      16 Jan 2017     rwong            Updated Queue Status
 * 16.00      20 Jan 2017     jmarimla         Add date validations; change date range labels
 * 17.00      24 Jan 2017     jmarimla         Script instance popup
 * 18.00      25 Jan 2017     rwong            Queue Status update
 * 19.00      22 Sep 2017     rwong            Support for SCP
 * 20.00      02 Oct 2017     jmarimla         Grid renderer
 * 21.00      10 Oct 2017     jmarimla         Added space
 * 22.00      06 Jul 2018     jmarimla         Translation readiness
 *
 */
APMSQM = APMSQM || {};

APMSQM._Components = function () {

    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: 'Script Queue Monitor'
    });

    var $CustomDateRangeDialog = $('' +
        '<div class="apm-sqm-dialog-customdaterange">' +
            '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
            '<div class="field-startdate"></div>' +
            '<div class="field-enddate"></div>' +
        '</div>'
        ).psgpDialog({
            title: 'Custom Date Range',
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
        text: 'Set',
        handler: function () {
            var me = this;
            var $dialog = $(me).parents('.apm-sqm-dialog-customdaterange');

            var $startDateTimeField = $dialog.find('.field-startdate');
            var $endDateTimeField = $dialog.find('.field-enddate');

            var stDate = $startDateTimeField.psgpDateTimeField('getDateValue');
            var stTime = $startDateTimeField.psgpDateTimeField('getTimeValue');
            var etDate = $endDateTimeField.psgpDateTimeField('getDateValue');
            var etTime = $endDateTimeField.psgpDateTimeField('getTimeValue');

            //validate dates
            if (!$startDateTimeField.psgpDateTimeField('isDateValid')) {
                alert('Please enter a valid start date.');
                return;
            }
            if (!$endDateTimeField.psgpDateTimeField('isDateValid')) {
                alert('Please enter a valid end date.');
                return;
            }

            var startDateMS = APMSQM.Services.convertToPSTms(stDate, stTime);
            var endDateMS = APMSQM.Services.convertToPSTms(etDate, etTime);

            //validate date range
            if(startDateMS > endDateMS) {
                alert('Start date must be earlier than end date.');
                return;
            }

            var customValue = 'custom_' + startDateMS + '_' + endDateMS;
            var customLabel = 'Custom (' + APMSQM.Services.convertMStoDateTimePST(stDate, stTime) + ' - ' + APMSQM.Services.convertMStoDateTimePST(etDate, etTime) + ')';
            var markUp = '<option value="' + customValue + '">' + customLabel +'</option>';
            var $settingsDateRangeDialog =  $('.apm-sqm-settings-daterange-dialog');
            $settingsDateRangeDialog.find('.field-daterange option[value*="custom_"]').remove();
            var $customOption = $settingsDateRangeDialog.find('.field-daterange option').last();
            $(markUp).insertBefore($customOption);
            $settingsDateRangeDialog.find('.field-daterange .psgp-combobox').val(customValue);
            $settingsDateRangeDialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');

            $dialog.dialog('close');
        }
    });
    $CustomDateRangeDialog.find('.btn-cancel').psgpGrayButton({
        text: 'Cancel',
        handler: function () {
            var me = this;
            var $dialog = $(me).parents('.apm-sqm-dialog-customdaterange');

            var globalSettings = APMSQM.Services.getGlobalSettings();
            var oldValue = globalSettings.dateRangeSelect;
            $('.apm-sqm-settings-daterange-dialog').find('.field-daterange .psgp-combobox').val(oldValue);
            $('.apm-sqm-settings-daterange-dialog').find('.field-daterange .psgp-combobox').selectmenu('refresh');

            $dialog.dialog('close');
        }
    });
    $CustomDateRangeDialog.find('.field-startdate').psgpDateTimeField({
        label: 'From'
    });
    $CustomDateRangeDialog.find('.field-enddate').psgpDateTimeField({
        label: 'To'
    });


    var $SettingsDateRangeDialog =  $('' +
        '<div class="apm-sqm-settings-daterange-dialog">' +
            '<div><span class="psgp-field-label">Date Range</span><div class="field-daterange"></div></div>' +
            '<div class="note">Selections affect all portlets</div>' +
            '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
        '</div>')
        .psgpSettingsDialog({

        });

    $SettingsDateRangeDialog.find('.field-daterange').psgpComboBox({
        list: [
                { 'name': 'Last 1 Hour', 'id': 1000*60*60 }
              , { 'name': 'Last 3 Hours', 'id': 1000*60*60*3 }
              , { 'name': 'Last 6 Hours', 'id': 1000*60*60*6 }
              , { 'name': 'Last 12 Hours', 'id': 1000*60*60*12 }
              , { 'name': 'Last 24 Hours', 'id': 1000*60*60*24 }
              , { 'name': 'Last 3 Days', 'id': 1000*60*60*24*3 }
              , { 'name': 'Last 7 Days', 'id': 1000*60*60*24*7 }
              , { 'name': 'Last 14 Days', 'id': 1000*60*60*24*14 }
              , { 'name': 'Last 30 Days', 'id': 1000*60*60*24*30 }
              , { 'name': 'Custom', 'id': 'custom' }
                ],
        width:  190,
        change: function( event, ui ) {
            var newValue = ui.item.value;
            if (newValue == 'custom') {
                var $dialog = $CustomDateRangeDialog;
                $dialog
                    .dialog('option', 'position', {my: 'right top', at: 'left bottom', of: $('.apm-sqm-settings-daterange')})
                    .dialog('open');
            }
        }
    });
    $SettingsDateRangeDialog.find('.btn-save').psgpBlueButton({
        text: 'Done',
        handler: function () {
            var me = this;
            var $dialog = $(me).parents('.apm-sqm-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMSQM.Services.getGlobalSettings();
            globalSettings.dateRangeSelect = newValue;
            if (newValue.indexOf('custom_') == -1) {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            APMSQM.Services.refreshData();
        }
    });
    $SettingsDateRangeDialog.find('.btn-cancel').psgpGrayButton({
        text: 'Cancel',
        handler: function () {
            var me = this;
            var $dialog = $(me).parents('.apm-sqm-settings-daterange-dialog');
            $dialog.dialog('close');
            var globalSettings = APMSQM.Services.getGlobalSettings();
            var oldValue = globalSettings.dateRangeSelect;
            $dialog.find('.field-daterange .psgp-combobox').val(oldValue);
            $dialog.find('.field-daterange .psgp-combobox').selectmenu('refresh');
        }
    });

    var $SettingsDateRange = $('<div>').addClass('apm-sqm-settings-daterange')
        .psgpSuiteletSettings({
            label: '',
            $dialog: $SettingsDateRangeDialog
        });
    $SettingsDateRange.on('updateLabel', function(){
        var $dialog = $('.apm-sqm-settings-daterange-dialog');
        $dialog.dialog('close');
        var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
        var newText = $dialog.find('.field-daterange .psgp-combobox').find(':selected').text();
        var globalSettings = APMSQM.Services.getGlobalSettings();

        var newSettingsLabel = 'Viewing: ';
        if (newValue.indexOf('custom_') !== -1) {
            globalSettings.endDateMS = '';
            newSettingsLabel = newSettingsLabel + newText;
        } else {
            newSettingsLabel = newSettingsLabel + newText + '(As of ' + globalSettings.asOf + ')';
        }
        $('.apm-sqm-settings-daterange').psgpSuiteletSettings('updateLabel', newSettingsLabel);

    });

    $TitleBar.append($SettingsDateRange);

    var $BtnRefresh = $('<div>').psgpBlueButton({
        text: 'Refresh',
        handler: function () {
            var $dialog = $('.apm-sqm-settings-daterange-dialog');
            $dialog.dialog('close');
            var newValue = $dialog.find('.field-daterange .psgp-combobox').val();
            var globalSettings = APMSQM.Services.getGlobalSettings();
            if (newValue.indexOf('custom_') !== -1) {

            } else {
                globalSettings.endDateMS = '' + new Date().setSeconds(0, 0);
            }

            APMSQM.Services.refreshData();
        }
    });

    var $OverviewPortlet = $('<div>').psgpPortlet({
        title: 'Overview',
        height: 500
    });

    var psgpGridOptions = {
        url: APMSQM.Services.getURL('scriptDetails'),
        sort: {
            dataIndex: 'deploymentName',
            dir: false,
            remote: true
        },
        paging: {
            pageLimit: 8
        },
        columns: [{
            dataIndex: 'deploymentName',
            width: '30%',
            text: 'Deployment Name',
            renderer: function (value, record) {
                var url = record.deploymentURL;
                return '<a target="_blank" href="' + url + '">' + value + '</a>';
            }
        }, {
            dataIndex: 'scriptName',
            width: '30%',
            text: 'Script Name',
            renderer: function (value, record) {
                var url = record.scriptURL;
                return '<a target="_blank" href="' + url + '">' + value + '</a>';
            }
        }, {
            dataIndex: 'queue',
            text: 'Queue',
            renderer: function (value) {
                if(value == 0)
                    return '- None -';
                return value;
            }
        }, {
            dataIndex: 'complete',
            text: 'Script Completed',
            renderer: function (value) {
                if(value == 0)
                    return '0';
                return value;
            }
        }, {
            dataIndex: 'failed',
            text: 'Script Failed',
            renderer: function (value) {
                if(value == 0)
                    return '0';
                return value;
            }
        }, {
            dataIndex: 'aveDuration',
            text: 'Ave Duration',
            renderer: function (value) {
                return value.toFixed(2) + ' s';
            }
        }, {
            dataIndex: 'aveWaitTime',
            text: 'Ave Wait Time',
            renderer: function (value) {
                return value.toFixed(2) + ' s';
            }
        }]
    };
    var $OverviewGrid = $('<div>').psgpGrid(psgpGridOptions);

    var $OverviewKPI = $('<div>').psgpKPIPanel({
        width: '100%',
        height: '150px'
    });

    $OverviewPortlet.psgpPortlet('getBody')
                    .css('overflow', 'auto')
                    .append($OverviewKPI)
                    .append($OverviewGrid);

    var $QueueStatusDate = $(
            '<div class="apm-sqm-queuestatus-date">' +
                '<span></span>' +
            '</div>')
            .on('updateData', function (event, text) {
                var me = this;
                $(me).children('span').text(text);
            });

    var $QueueStatusDiagram = $('<div class="apm-sqm-queuestatus">')
        .on('updateData', function (event, maxQueues, processing) {
            var me = this;
            $(me).children().remove();
            if ($(me).data('ui-tooltip')) $(me).tooltip('destroy');
            if (!maxQueues) return;
            var QUEUES_PER_ROWS = 5;
            var rows = Math.ceil( maxQueues / QUEUES_PER_ROWS );
            var rowMarkUp = '';
            for (var i = 0; i < rows; i++) {
                rowMarkUp += '<div class="apm-sqm-queuestatus-row"></div>';
            }
            var $rows = $(rowMarkUp);
            for (var i = 0; i < maxQueues; i++) {
                var queue = i + 1;
                var row = Math.ceil(queue / QUEUES_PER_ROWS) - 1 ;
                $rows.eq(row)
                    .append('<div class="apm-sqm-queuestatus-queue"><div class="apm-sqm-queuestatus-queue-box"><div>' + queue + '</div></div></div>');
            }
            var $queues = $rows.find('.apm-sqm-queuestatus-queue');
            $.each(processing, function (index, obj) {
                $queues.eq(obj.queue - 1)
                    .addClass('busy')
                    .children().data(obj);
            });
            $(me).tooltip({
                tooltipClass: 'apm-sqm-tooltip-queuestatus',
                items: '.apm-sqm-queuestatus-queue.busy .apm-sqm-queuestatus-queue-box',
                content: function () {
                    var el = $(this);
                    var data = el.data();
                    var markUp = '<span class="deployment-name">' + data.deploymentName + '</span><br>' +
                                '<span class="label">Start </span><span class="start-date">' + data.startDate + '</span>';
                    return $(markUp);
                }
            });

            $(me).append($rows);
        });

    var $QueueStatusLegend = $('<div class="apm-sqm-queuestatus-legend">' +
                                '<div class="apm-sqm-queuestatus-legend-inner">' +
                                '<div class="color color-available"></div><div class="label">Available</div>' +
                                '<div class="color color-busy"></div><div class="label">Busy</div>' +
                                '</div>' +
                                '</div>');

    var $UpcomingDeploymentsGrid = $('<div>')
        .css({
            'height': '150px',
            'overflow': 'auto'
        })
        .psgpGrid({
            sort: {
                dataIndex: 'deploymentName',
                dir: false,
                remote: false
            },
            columns: [{
                dataIndex: 'deploymentName',
                text: 'Upcoming Deployments',
                renderer: function (value, record) {
                    var url = record.deploymentURL;
                    return '<a target="_blank" href="' + url + '">' + value + '</a>';
                }
            }, {
                dataIndex: 'scriptName',
                text: 'Script Name',
                renderer: function (value, record) {
                    var url = record.scriptURL;
                    return '<a target="_blank" href="' + url + '">' + value + '</a>';
                }
            }, {
                dataIndex: 'queue',
                width: '80px',
                text: 'Queue'
            }]
        });

    var $QueueStatusPortlet = $('<div>').psgpPortlet({
        title: 'Queue Status'
    });

    var $UtilizationPortlet = $('<div>').psgpPortlet({
        title: 'Queue Utilization',
        height: 600
    });

    $UtilizationPortlet.psgpPortlet('getBody')
        .append($('<div class="psgp-utilization-chart">').height(300))
        .append($('<div class="psgp-count-chart">').height(300));

    var $HeatMapPortlet = $('<div>').psgpPortlet({
        title: 'Script Instance Heat Map',
        height: 500
    });

    $HeatMapPortlet.psgpPortlet('getBody')
        .append('<div class="apm-sqm-heatmap"></div>');
    $HeatMapPortlet.find('.apm-sqm-heatmap').css({
        'width' : '100%',
        'height' : '100%'
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

    function showInstancesPopup (params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-sqm-dialog-count">' +
                '<div class="grid">' +
                '</div>' +
            '</div>';
        $obj = $(markUp);

        var gridOptions = {
                url: APMSQM.Services.getURL('instances'),
                sort: {
                    dataIndex: 'deploymentName',
                    dir: false,
                    remote: true
                },
                paging: {
                    pageLimit: 10
                },
                columns: [{
                    dataIndex: 'deploymentName',
                    width: '20%',
                    text: 'Deployment Name',
                    renderer: function (value, record) {
                        var url = record.deploymentURL;
                        return '<a target="_blank" href="' + url + '">' + value + '</a>';
                    }
                }, {
                    dataIndex: 'scriptName',
                    width: '20%',
                    text: 'Script Name',
                    renderer: function (value, record) {
                        var url = record.scriptURL;
                        return '<a target="_blank" href="' + url + '">' + value + '</a>';
                    }
                }, {
                    dataIndex: 'status',
                    width: '7%',
                    text: 'Status'
                }, {
                    dataIndex: 'dateCreated',
                    text: 'Date Created'
                }, {
                    dataIndex: 'startDate',
                    text: 'Start'
                }, {
                    dataIndex: 'endDate',
                    text: 'End'
                }, {
                    dataIndex: 'duration',
                    width: '10%',
                    text: 'Duration',
                    renderer: function (value) {
                        return (value) ? value.toFixed(2) + ' s' : 0;
                    }
                }]
            };

        var $grid = $obj.find('.grid').psgpGrid(gridOptions);

        $obj.psgpDialog({
            title: 'Scheduled Script Instance',
            width: 900
        });
        $obj.parents('.ui-dialog').css({
            "position": "absolute",
            "top": ( $(window).height() - $obj.parents('.ui-dialog').height() ) / 2+$(window).scrollTop() + "px",
            "left": ( $(window).width() - $obj.parents('.ui-dialog').width() ) / 2+$(window).scrollLeft() + "px"
        });

        $grid.psgpGrid('refreshDataRemote', params);
    }

    return {

        $TitleBar: $TitleBar,
        $SettingsDateRange: $SettingsDateRange,
        $SettingsDateRangeDialog: $SettingsDateRangeDialog,
        $BtnRefresh: $BtnRefresh,

        $OverviewPortlet: $OverviewPortlet,
        $OverviewGrid: $OverviewGrid,
        $OverviewKPI: $OverviewKPI,

        $QueueStatusPortlet: $QueueStatusPortlet,
        $QueueStatusDiagram: $QueueStatusDiagram,
        $QueueStatusDate: $QueueStatusDate,
        $UpcomingDeploymentsGrid: $UpcomingDeploymentsGrid,

        $UtilizationPortlet: $UtilizationPortlet,

        $HeatMapPortlet: $HeatMapPortlet,

        $ColumnPanel: $ColumnPanel,

        showInstancesPopup: showInstancesPopup

    };

};
