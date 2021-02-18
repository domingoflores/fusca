/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Jun 2017     jmarimla         Initial
 * 2.00       16 Jun 2017     jmarimla         Perf details portlet
 * 3.00       20 Jul 2017     rwong            Top Record Performance
 * 4.00       11 Jun 2018     jmarimla         Translation engine
 * 5.00       02 Jul 2018     rwong            Translation strings
 * 6.00       26 Jul 2018     jmarimla         Pop up window logs
 * 7.00       18 Oct 2018     jmarimla         Redirect to profiler
 * 8.00       26 Oct 2018     jmarimla         Frht labels
 * 9.00       27 Nov 2018     rwong            CSV export
 * 10.00      08 Jan 2019     jmarimla         Translation
 *
 */
APMWSOD = APMWSOD || {};

APMWSOD._Components = function() {

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
        title: APMTranslation.apm.wsod.label.webservicesoperationdetails()
    });

    var $PerfDetailsPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.wsod.label.performancedetails()
    });

    var $PerfDetailsCharts = $(
        '<div class="apm-wsod-container-perfdetailscharts">' +
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

    $PerfDetailsPortlet.psgpPortlet('getBody')
        .append($PerfDetailsCharts);

    var $TopRecPerf = $('<div>').psgpPortlet({
        title: APMTranslation.apm.wsod.label.toprecordsperformance(),
        height: '500px'
    });

    function refreshDetailsPortlet(kpiData) {
        var kpiConfig = [{
                id: 'operation',
                label: APMTranslation.apm.common.label.operation()
            },
            {
                id: 'executionTime',
                label: APMTranslation.apm.common.label.executiontime()
            },
            {
                id: 'totalUsers',
                label: APMTranslation.apm.common.label.numberofusers()
            },
            {
                id: 'totalRequests',
                label: APMTranslation.apm.common.label.totalrequests()
            },
            {
                id: 'totalFailed',
                label: APMTranslation.apm.common.label.failedrequests()
            },
            {
                id: 'errorRate',
                label: APMTranslation.apm.common.label.errorrate() + ' (%)'
            },
            {
                id: 'totalRecords',
                label: APMTranslation.apm.common.label.totalrecords()
            },
            {
                id: 'recordRate',
                label: APMTranslation.apm.common.label.recordsperminute()
            },
            {
                id: 'timeRange',
                label: APMTranslation.apm.wsod.label.timerange()
            }
        ];

        var blockMarkUp =
            '<div class="apm-wsod-kpi-block">' +
                '<div class="label"></div>' +
                '<div class="value"></div>' +
            '</div>';

        var rowMarkUp = '<div class="apm-wsod-kpi-row"></div>';

        var $kpiContainer = $('<div class="apm-wsod-kpi-container"></div>');

        var maxColumns = 3;
        for (var i = 0; i < kpiConfig.length; i = i + maxColumns) {
            var $row = $(rowMarkUp);

            for (var j = 0; j < maxColumns; j++) {
                var $block = $(blockMarkUp);
                $block.find('.label').text(kpiConfig[i + j].label);
                $block.find('.value').text(kpiData[kpiConfig[i + j].id]);
                $row.append($block);
            }

            $kpiContainer.append($row);
        }

        $OverviewPortlet.psgpPortlet('getBody').empty();
        $OverviewPortlet.psgpPortlet('getBody').append($kpiContainer);
    }

    function showWsoLogsPopup(params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-wsod-wsologs">' +
                '<div class="grid">' +
                '</div>' +
            '</div>';
        $obj = $(markUp);

        var gridOptions = {
                url: APMWSOD.Services.getURL('wsoLogs'),
                sort: {
                    dataIndex: 'date',
                    dir: false,
                    remote: true
                },
                paging: {
                    pageLimit: 10
                },
                exportCSV: true,
                columns: [
                    {
                        dataIndex: 'date',
                        width: '15%',
                        text: APMTranslation.apm.common.label.datetime()
                    },
                    {
                        dataIndex: 'email',
                        width: '25%',
                        text: APMTranslation.apm.common.label.email()
                    },
                    {
                        dataIndex: 'executionTime',
                        text: APMTranslation.apm.common.label.executiontime(),
                        renderer: function (value, record) {
                            return (value) ? value.toFixed(3) + ' s' : 0;
                        }
                    },
                    {
                        dataIndex: 'totalRecords',
                        text: APMTranslation.apm.common.label.totalrecords()
                    },
                    {
                        dataIndex: 'status',
                        width: '25%',
                        text: APMTranslation.apm.common.label.status(),
                        renderer: function (value, record) {
                        	var translated = '';
                        	switch (value) {
                        	case 'FINISHED': 
                        		translated = APMTranslation.apm.ns.status.finished();
                        		break;
                        	case 'FAILED': 
                        		translated = APMTranslation.apm.common.label.failed();
                        		break;
                        	case 'REJECTEDACCOUNTCONCURRENCY': 
                        		translated = APMTranslation.apm.common.label.rejectedaccountconcurrency();
                        		break;
                        	case 'REJECTEDUSERCONCURRENCY': 
                        		translated = APMTranslation.apm.common.label.rejecteduserconcurrency();
                        		break;
                        	default: translated = value;
                        	}
                            return translated;
                        }
                    },
                    {
                        dataIndex: 'viewDetails',
                        text: APMTranslation.apm.r2019a.profilerdetails(),
                        width: '130px',
                        renderer: function(value, record) {
                            var $markUp = $('<div><div class="apm-wsod-wsologs-viewdetails-icon"></div></div>');
                            $markUp.find('.apm-wsod-wsologs-viewdetails-icon').attr('param-oper', value);
                            return $markUp.html();
                        },
                        resizable: false,
                        sortable: false
                    }
                ],

                listeners: {
                    afterRefreshData: function (grid, response) {
                        var rows = grid.element.find('tbody tr');
                        var gData = grid.options.data;
                        var gParams = grid.options.params;
                        rows.each(function(index) {
                            var me = this;
                            $(me).find('.apm-wsod-wsologs-viewdetails-icon').attr('param-rowIndex', $(this).index());
                        });
                        rows.hover(
                            function() {
                                $(this).find('.apm-wsod-wsologs-viewdetails-icon').addClass('showicon');
                            },
                            function() {
                                $(this).find('.apm-wsod-wsologs-viewdetails-icon').removeClass('showicon');
                            }
                        );
                        rows.find('.apm-wsod-wsologs-viewdetails-icon').click(function() {
                            var me = this;
                            var rData = gData[$(me).attr('param-rowIndex')];

                            var globalSettings = APMWSOD.Services.getGlobalSettings();
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
            title: APMTranslation.apm.wsod.label.webservicesoperationlogs(),
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

    function showWsrpLogsPopup(params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-wsod-wsrplogs">' +
                '<div class="grid">' +
                '</div>' +
            '</div>';
        $obj = $(markUp);

        var gridOptions = {
                url: APMWSOD.Services.getURL('wsrpLogs'),
                sort: {
                    dataIndex: 'date',
                    dir: false,
                    remote: true
                },
                paging: {
                    pageLimit: 10
                },
                exportCSV: true,
                columns: [
                    {
                        dataIndex: 'date',
                        width: '15%',
                        text: APMTranslation.apm.common.label.datetime()
                    },
                    {
                        dataIndex: 'email',
                        width: '25%',
                        text: APMTranslation.apm.common.label.email()
                    },
                    {
                        dataIndex: 'executionTime',
                        text: APMTranslation.apm.common.label.executiontime(),
                        renderer: function (value, record) {
                            return (value) ? value.toFixed(3) + ' s' : 0;
                        }
                    },
                    {
                        dataIndex: 'recordType',
                        width: '15%',
                        text: APMTranslation.apm.common.label.recordtype()
                    },
                    {
                        dataIndex: 'operation',
                        text: APMTranslation.apm.common.label.operation(),
                        renderer: function(value, record) {
                            var translated = value;
                            switch (value.toLowerCase()) {
                            case 'add' :
                                translated = APMTranslation.apm.ns.common.add();
                                break;
                            case 'update':
                                translated = APMTranslation.apm.ns.wsa.update();
                                break;
                            case 'delete':
                                translated = APMTranslation.apm.ns.wsa.delete();
                                break;
                            }
                            return translated;
                        }
                    },
                    {
                        dataIndex: 'viewDetails',
                        text: APMTranslation.apm.r2019a.profilerdetails(),
                        width: '130px',
                        renderer: function(value, record) {
                            var $markUp = $('<div><div class="apm-wsod-wsrplogs-viewdetails-icon"></div></div>');
                            $markUp.find('.apm-wsod-wsrplogs-viewdetails-icon').attr('param-oper', value);
                            return $markUp.html();
                        },
                        resizable: false,
                        sortable: false
                    }
                ],

                listeners: {
                    afterRefreshData: function (grid, response) {
                        var rows = grid.element.find('tbody tr');
                        var gData = grid.options.data;
                        var gParams = grid.options.params;
                        rows.each(function(index) {
                            var me = this;
                            $(me).find('.apm-wsod-wsrplogs-viewdetails-icon').attr('param-rowIndex', $(this).index());
                        });
                        rows.hover(
                            function() {
                                $(this).find('.apm-wsod-wsrplogs-viewdetails-icon').addClass('showicon');
                            },
                            function() {
                                $(this).find('.apm-wsod-wsrplogs-viewdetails-icon').removeClass('showicon');
                            }
                        );
                        rows.find('.apm-wsod-wsrplogs-viewdetails-icon').click(function() {
                            var me = this;
                            var rData = gData[$(me).attr('param-rowIndex')];

                            var globalSettings = APMWSOD.Services.getGlobalSettings();
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
            title: APMTranslation.apm.wsod.label.webservicesrecordprocessinglogs(),
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

    return {
        $ColumnPanel: $ColumnPanel,
        $OverviewPortlet: $OverviewPortlet,
        $PerfDetailsPortlet: $PerfDetailsPortlet,
        $TopRecPerf: $TopRecPerf,
        refreshDetailsPortlet: refreshDetailsPortlet,
        showWsoLogsPopup: showWsoLogsPopup,
        showWsrpLogsPopup: showWsrpLogsPopup
    };

};