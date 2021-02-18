/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       18 Aug 2017     jmarimla         Initial
 * 2.00       24 Aug 2017     jmarimla         Saved search details portlet
 * 3.00       31 Aug 2017     jmarimla         SS context portlet
 * 4.00       05 Sep 2017     jmarimla         SS logs popup
 * 5.00       07 Sep 2017     jmarimla         Misc changes
 * 6.00       18 Sep 2017     jmarimla         Customer debugging
 * 7.00       21 Sep 2017     jmarimla         Header popup
 * 8.00       02 Oct 2017     jmarimla         Label changed
 * 9.00       28 Nov 2017     jmarimla         Loading message
 * 10.00      11 Jun 2018     jmarimla         Translation engine
 * 11.00      19 Jun 2018     justaris         Translation
 * 12.00      02 Jul 2018     justaris         Translation Readiness
 * 13.00      06 Jul 2018     jmarimla         Polishing translation
 * 14.00      03 Aug 2018     jmarimla         FRHT ui
 * 15.00      18 Oct 2018     jmarimla         Redirect to profiler
 * 16.00      26 Oct 2018     jmarimla         Frht labels
 * 17.00      27 Nov 2018     rwong            CSV export
 *
 */

APMSPD = APMSPD || {};

APMSPD._Components = function() {

    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: APMTranslation.apm.spd.label.searchperformancedetails()
    });

    var $CustomerDebuggingDialog =  $('' +
            '<div class="apm-spd-dialog-custdebug">' +
                '<div class="container-field-customer"><span class="psgp-field-label">' + APMTranslation.apm.common.label.companyid() + '</span><div class="field-customer"></div></div>' +
                '<div class="buttons"><div class="btn-save"></div><div class="btn-cancel"></div></div>' +
            '</div>')
            .psgpSettingsDialog({width: 240});

    $CustomerDebuggingDialog.find('.field-customer').psgpTextBox({
        width:  250
    });

    $CustomerDebuggingDialog.find('.btn-save').psgpBlueButton({
        text: APMTranslation.apm.common.button.done(),
        handler: function () {
            var me = this;
            var globalSettings = APMSPD.Services.getGlobalSettings();
            var $dialog = $(me).parents('.apm-spd-dialog-custdebug');
            $dialog.dialog('close');

            var compfil = $dialog.find('.field-customer .psgp-textbox').val();
            globalSettings.compfil = compfil;

            APMSPD.Services.refreshSsListData();
        }
    });

    $CustomerDebuggingDialog.find('.btn-cancel').psgpGrayButton({
        text: APMTranslation.apm.common.button.cancel(),
        handler: function () {
            var me = this;
            var globalSettings = APMSPD.Services.getGlobalSettings();
            var $dialog = $(me).parents('.apm-spd-dialog-custdebug');
            $dialog.dialog('close');

            var oldCompfil = globalSettings.compfil;
            $dialog.find('.field-customer .psgp-textbox').val(oldCompfil);
        }
    });

    var $CustomerDebuggingLabel = $('<div>').addClass('apm-spd-settings-custdebug')
        .psgpSuiteletSettings({
            label: APMTranslation.apm.common.label.customerdebugsettings(),
            $dialog: $CustomerDebuggingDialog
        });

    if (SPD_PARAMS.debugMode) {
        $TitleBar.append($CustomerDebuggingLabel);
    }

    var $BtnRefresh = $('<div>').psgpBlueButton({
        text: APMTranslation.apm.common.button.refresh(),
        handler: function () {
            var stDate = $StartDateTimeFilter.psgpDateTimeField('getDateValue');
            var stTime = $StartDateTimeFilter.psgpDateTimeField('getTimeValue');
            var etDate = $EndDateTimeFilter.psgpDateTimeField('getDateValue');
            var etTime = $EndDateTimeFilter.psgpDateTimeField('getTimeValue');

            //validate dates
            if (!$StartDateTimeFilter.psgpDateTimeField('isDateValid')) {
                alert(APMTranslation.apm.common.alert.entervalidstartdate());
                return;
            }
            if (!$EndDateTimeFilter.psgpDateTimeField('isDateValid')) {
                alert(APMTranslation.apm.common.alert.entervalidenddate());
                return;
            }

            var startDateMS = APMSPD.Services.convertToDateObj(stDate, stTime).getTime();
            var endDateMS = APMSPD.Services.convertToDateObj(etDate, etTime).getTime();
            //validate date range
            if(startDateMS > endDateMS) {
                alert(APMTranslation.apm.common.alert.startdateearlierthanenddate());
                return;
            }
            //max 30 days
            if(endDateMS - startDateMS > 1000*60*60*24*30) {
                alert(APMTranslation.apm.common.alert.daterange._30days());
                return false;
            }

            APMSPD.Services.showLoading();

            startDateMS = APMSPD.Services.convertToPSTms(stDate, stTime);
            endDateMS = APMSPD.Services.convertToPSTms(etDate, etTime);

            var searchId = $SavedSearchFilter.find('.psgp-combobox').val();
            if (!searchId) searchId = '0';

            var globalSettings = APMSPD.Services.getGlobalSettings();
            globalSettings.startDateMS = startDateMS;
            globalSettings.endDateMS = endDateMS;
            globalSettings.searchId = searchId;

            APMSPD.Services.refreshData();
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

    var $FilterPanel = $('<div>').psgpFilterPanel({});

    var $StartDateTimeFilter = $('<div>').psgpDateTimeField({
        label: APMTranslation.apm.common.label.startdatetime()
    });

    var $EndDateTimeFilter = $('<div>').psgpDateTimeField({
        label: APMTranslation.apm.common.label.enddatetime()
    });

    var $SavedSearchFilter = $('<div class="psgp-filter-combo"><div><span class="psgp-field-label">'+ APMTranslation.apm.spd.label.savedsearch() +'</span><div class="filter-savedsearch"></div></div></div>');
    $SavedSearchFilter.find('.filter-savedsearch').psgpComboBox({
        list: [
            { 'name': APMTranslation.apm.spd.alert.searchloadingwait(), 'id': '' }
        ],
        width:  300
    });

    $FilterPanel.psgpFilterPanel('addFilterField', $StartDateTimeFilter);
    $FilterPanel.psgpFilterPanel('addFilterField', $EndDateTimeFilter);
    $FilterPanel.psgpFilterPanel('addFilterField', $SavedSearchFilter);

    var $SsDetailsPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.spd.label.savedsearchdetails()
    });

    var $SsDetailsKPI = $('<div>').psgpKPIPanel({
        width: '100%',
        height: '150px'
    });

    var $SsDetailsCharts = $(
            '<div class="apm-spd-container-ssdetailscharts">' +
            '<div class="chart-row">' +
                '<div class="chart-outer">' +
                    '<div class="chart execution"></div>' +
                '</div>' +
                '<div class="chart-outer">' +
                    '<div class="chart requests"></div>' +
                '</div>' +
            '</div>' +
            '<div class="chart-row">' +
                '<div class="chart-outer">' +
                    '<div class="chart context"></div>' +
                '</div>' +
                '<div class="chart-outer">' +
                    '<div class="chart histogram"></div>' +
                '</div>' +
            '</div>' +
        '</div>'
    );

    $SsDetailsPortlet.psgpPortlet('getBody')
        .append($SsDetailsKPI)
        .append($SsDetailsCharts);

    var $SsContextPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.spd.label.savedsearchbycontext(),
        height: '400px'
    });

    function showLogsPopup (params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-spd-sslogs">' +
                '<div class="header">' +
                    '<div class="display">' +
                        '<div class="label">' +
                        APMTranslation.apm.common.label.startdatetime() +
                        '</div>' +
                        '<div class="value startdate">' +
                        '' +
                        '</div>' +
                    '</div>' +
                    '<div class="display">' +
                        '<div class="label">' +
                        APMTranslation.apm.common.label.enddatetime() +
                        '</div>' +
                        '<div class="value enddate">' +
                        '' +
                        '</div>' +
                    '</div>' +
                    '<div class="display">' +
                        '<div class="label">' +
                        APMTranslation.apm.common.label.context() +
                        '</div>' +
                        '<div class="value context">' +
                        '' +
                        '</div>' +
                    '</div>' +
                    '<div class="display">' +
                        '<div class="label">' +
                        APMTranslation.apm.common.label.executiontime() +
                        '</div>' +
                        '<div class="value executiontime">' +
                        '' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="grid">' +
                '</div>' +
            '</div>';
        $obj = $(markUp);

        var gridOptions = {
                url: APMSPD.Services.getURL('ssLogs'),
                sort: {
                    dataIndex: 'date',
                    dir: false,
                    remote: true
                },
                paging: {
                    pageLimit: 10
                },
                exportCSV: true,
                columns: [{
                    dataIndex: 'date',
                    width: '20%',
                    text: APMTranslation.apm.spd.label.date()
                }, {
                    dataIndex: 'user',
                    width: '20%',
                    text: APMTranslation.apm.common.label.user(),
                    sortable: false
                }, {
                    dataIndex: 'context',
                    width: '20%',
                    text: APMTranslation.apm.common.label.context()
                }, {
                    dataIndex: 'executionTime',
                    text: APMTranslation.apm.common.label.executiontime(),
                    renderer: function (value, record) {
                        return (value) ? value.toFixed(3) + ' s' : 0;
                    }
                }, {
                    dataIndex: 'success',
                    text: APMTranslation.apm.common.label.completed(),
                    renderer: function (value, record) {
                        if (value == 'true'){
                        return value = APMTranslation.apm.spd.label.istrue();
                        }
                        if (value == 'false'){
                        return value = APMTranslation.apm.spd.label.isfalse();
                        }
                        else{
                        return value = '';
                        }
                    }
                }, {
                    dataIndex: 'timeOut',
                    text: APMTranslation.apm.common.label.timeout(),
                    renderer: function (value, record) {
                        if (value == 'true'){
                        return value = APMTranslation.apm.spd.label.istrue();
                        }
                        if (value == 'false'){
                        return value = APMTranslation.apm.spd.label.isfalse();
                        }
                        else{
                        return value = '';
                        }
                    }
                }, {
                    dataIndex: 'viewDetails',
                    text: APMTranslation.apm.r2019a.profilerdetails(),
                    width: '130px',
                    renderer: function(value, record) {
                        var $markUp = $('<div><div class="apm-spd-sslogs-viewdetails-icon"></div></div>');
                        $markUp.find('.apm-spd-sslogs-viewdetails-icon').attr('param-oper', value);
                        return $markUp.html();
                    },
                    resizable: false,
                    sortable: false
                }],

                listeners: {
                    afterRefreshData: function (grid, response) {
                        if (!response) return;
                        var dialog = $('.apm-spd-sslogs');
                        dialog.find('.header .value.startdate').text('');
                        dialog.find('.header .value.enddate').text('');
                        dialog.find('.header .value.context').text('');
                        dialog.find('.header .value.executiontime').text('');
                        if (response.header) {
                            var header = response.header;
                            var translatedContext = APMSPD.Services.translateContext(header.context);
                            dialog.find('.header .value.startdate').text(header.startDate);
                            dialog.find('.header .value.enddate').text(header.endDate);
                            dialog.find('.header .value.context').text(translatedContext);
                            dialog.find('.header .value.executiontime').text(header.executionTime);
                        }
                        var rows = grid.element.find('tbody tr');
                        var gData = grid.options.data;
                        var gParams = grid.options.params;
                        rows.each(function(index) {
                            var me = this;
                            $(me).find('.apm-spd-sslogs-viewdetails-icon').attr('param-rowIndex', $(this).index());
                        });
                        rows.hover(
                            function() {
                                $(this).find('.apm-spd-sslogs-viewdetails-icon').addClass('showicon');
                            },
                            function() {
                                $(this).find('.apm-spd-sslogs-viewdetails-icon').removeClass('showicon');
                            }
                        );
                        rows.find('.apm-spd-sslogs-viewdetails-icon').click(function() {
                            var me = this;
                            var rData = gData[$(me).attr('param-rowIndex')];

                            var globalSettings = APMSPD.Services.getGlobalSettings();
                            var operationId = rData.operationId;
                            var frhtId = rData.frhtId;

                            var params = {
                                compfil: globalSettings.compfil,
                                operationId: operationId,
                                frhtId: frhtId
                            }

                            var paramString = $.param(params);
                            var PRF_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_prf_sl_main&deploy=customdeploy_apm_prf_sl_main';
                            window.open(PRF_URL + '&' + paramString);
                        });
                    }
                }
            };

        $obj.psgpDialog({
            title: APMTranslation.apm.spd.label.savedsearchlogs(),
            width: 900
        });
        $obj.parents('.ui-dialog').css({
            "position": "absolute",
            "top": ( $(window).height() - $obj.parents('.ui-dialog').height() ) / 2+$(window).scrollTop() + "px",
            "left": ( $(window).width() - $obj.parents('.ui-dialog').width() ) / 2+$(window).scrollLeft() + "px"
        });

        var $grid = $obj.find('.grid').psgpGrid(gridOptions);

        $grid.psgpGrid('refreshDataRemote', params);
    }

    $NoDataAvailable = $('<div class="apm-spd-nodataavailable"><div class="icon"></div><div class="message">'+ APMTranslation.apm.common.label.nodataavailable() +'</div></div>');

    function updateDateTimeField ($DateTime, dateBd) {
        var hours = (dateBd[3] < 10) ? '0'+dateBd[3] : ''+dateBd[3];
        var minutes = dateBd[4] - (dateBd[4] % 15);
        minutes = (minutes < 10) ? '0'+minutes : ''+minutes;
        var timeString = hours + ':' + minutes;
        $DateTime.psgpDateTimeField('setDateValue', new Date(dateBd[0], dateBd[1], dateBd[2]));
        $DateTime.psgpDateTimeField('setTimeValue', timeString);
    }

    return {
        $TitleBar: $TitleBar,
        $BtnRefresh: $BtnRefresh,
        $ColumnPanel: $ColumnPanel,

        $FilterPanel: $FilterPanel,
        $StartDateTimeFilter: $StartDateTimeFilter,
        $EndDateTimeFilter: $EndDateTimeFilter,
        $SavedSearchFilter: $SavedSearchFilter,

        $SsDetailsPortlet: $SsDetailsPortlet,
        $SsDetailsKPI: $SsDetailsKPI,

        $SsContextPortlet: $SsContextPortlet,

        $NoDataAvailable: $NoDataAvailable,

        showLogsPopup: showLogsPopup,
        updateDateTimeField: updateDateTimeField
    }

};