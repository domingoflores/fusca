/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2018     rwong            Initial
 * 2.00       10 Aug 2018     jmarimla         Frht chart and grid
 * 3.00       04 Sep 2018     jmarimla         Frht button icons
 * 4.00       28 Sep 2018     jmarimla         Drilldown timeline
 * 5.00       26 Oct 2018     jmarimla         Kpi labels
 * 6.00       14 Dec 2018     jmarimla         Update labels
 * 7.00       25 Mar 2019     rwong            Adjusted profiler columns
 * 8.00       11 Apr 2019     erepollo         Renamed path id to profiler id. Removed parent id. Added request urls and web services
 * 9.00       12 Apr 2019     jmarimla         Has children
 * 10.00      15 Apr 2019     rwong            Added support for filtering api calls, merge ids under name
 * 11.00      16 Apr 2019     rwong            Added support for links in name
 * 12.00      17 Apr 2019     rwong            Adjusted labels for record and remove webservices
 * 13.00      18 Jun 2019     jmarimla         New grid columns
 * 14.00      19 Jun 2019     jmarimla         Request url column
 * 15.00      28 Jun 2019     erepollo         Translation for new texts
 * 16.00      08 Jul 2019     erepollo         Translation for new text
 * 17.00      08 Aug 2019     erepollo         Added deployment name
 *
 */
APMPRF = APMPRF || {};

APMPRF._Components = function() {

    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: APMTranslation.apm.r2019a.profiler()
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

    var $ProfilerDetailsPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.r2019a.profilerdetails()
    });

    var $Breadcrumbs = $('<div class="apm-prf-breadcrumbs">');

    var $KPIDetails = $('<div>')

    var $FrhtChartSubPanel = $('<div class="apm-prf-subpanel-frhtchart">').psgpSubPanel({
        title: APMTranslation.apm.common.label.timeline()
    });

    var $FrhtGridSubPanel = $('<div class="apm-prf-subpanel-frhtgrid">').psgpSubPanel({
        title: APMTranslation.apm.r2019a.timingdetails()
    });

    var frhtGridOptions = {
        url: APMPRF.Services.getURL('frhtLogs'),
        exportCSV: true,
        sort: {
            remote: false
        },
        columns: [{
                dataIndex: 'date',
                sortable: false,
                text: APMTranslation.apm.r2019a.datetime()
            },
            {
                dataIndex: 'type',
                sortable: false,
                text: APMTranslation.apm.common.label.type()
            },
            {
                dataIndex: 'name',
                sortable: false,
                text: APMTranslation.apm.common.label.name(),
                renderer: function(value, record) {
                    var globalSettings = APMPRF.Services.getGlobalSettings();
                    if(globalSettings.compfil == 0 && record.nameUrl != '') {
                        return '<a href="' + record.nameUrl + '" target="_blank" class="apm-a">'
                        + value + '</a>';
                    }
                    return value;
                }
            },
            {
                dataIndex: 'executionTime',
                sortable: false,
                text: APMTranslation.apm.common.label.executiontime(),
                renderer: function(value, record) {
                    return (value) ? value.toFixed(3) + ' s' : 0;
                }
            },
            {
                dataIndex: 'email',
                sortable: false,
                text: APMTranslation.apm.common.label.user()
            },
            {
                dataIndex: 'operation',
                sortable: false,
                text: APMTranslation.apm.common.label.operation()
            },
            {
                dataIndex: 'searches',
                sortable: false,
                text: APMTranslation.apm.ptd.label.searches()
            },
            {
                dataIndex: 'workflows',
                sortable: false,
                text: APMTranslation.apm.r2019a.workflows()
            },
            {
                dataIndex: 'customRecordOperations',
                sortable: false,
                text: APMTranslation.apm.r2019a.recordsfromscriptsworkflows()
            },
            {
                dataIndex: 'requestUrls',
                sortable: false,
                text: APMTranslation.apm.r2019a.requesturls()
            },
            {
                dataIndex: 'recordType',
                sortable: false,
                text: APMTranslation.apm.common.label.recordtype()
            },

            {
                dataIndex: 'context',
                sortable: false,
                text: APMTranslation.apm.common.label.context()
            },
            {
                dataIndex: 'scriptType',
                sortable: false,
                text: APMTranslation.apm.ssa.label.scripttype()
            },
            {
                dataIndex: 'deployment',
                sortable: false,
                text: APMTranslation.apm.spjd.label.deployment(),
                renderer: function(value, record) {
                    var globalSettings = APMPRF.Services.getGlobalSettings();
                    if(globalSettings.compfil == 0 && record.deploymentUrl != '') {
                        return '<a href="' + record.deploymentUrl + '" target="_blank" class="apm-a">'
                        + value + '</a>';
                    }
                    return value;
                }
            },
            {
                dataIndex: 'entryPoint',
                sortable: false,
                text: APMTranslation.apm.r2019a.entrypoint()
            },
            {
                dataIndex: 'triggerType',
                sortable: false,
                text: APMTranslation.apm.r2019a.triggertype()
            },
            {
                dataIndex: 'bundle',
                sortable: false,
                text: APMTranslation.apm.pts.label.bundle()
            },
            {
                dataIndex: 'method',
                sortable: false,
                text: APMTranslation.apm.r2019a.method()
            },
            {
                dataIndex: 'wsOperation',
                sortable: false,
                text: APMTranslation.apm.r2019a.webserviceoperation()
            },
            {
                dataIndex: 'apiVersion',
                sortable: false,
                text: APMTranslation.apm.r2019a.apiversion()
            },
            {
                dataIndex: 'viewCalls',
                text: '',
                width: '40px',
                renderer: function(value, record) {
                    var type = record.type;
                    var frhtConfig = APMPRF.Highcharts.frhtTypes[type];
                    frhtConfig = frhtConfig ? frhtConfig : APMPRF.Highcharts.frhtTypes['default'];
                    var enableBtn = frhtConfig.viewCalls;
                    if (enableBtn && record.viewCalls) {
                        var $markUp = $('<div><div class="apm-prf-frhtgrid-viewcalls-icon"></div></div>');
                        $markUp.find('.apm-prf-frhtgrid-viewcalls-icon').attr('param-oper', value);
                        return $markUp.html();
                    } else {
                        return '';
                    }
                },
                resizable: false,
                sortable: false
            },
            {
                dataIndex: 'drillDown',
                text: '',
                width: '40px',
                renderer: function(value, record) {
                    var hasChildren = record.hasChildren;
                    var enableBtn = (hasChildren) ? true : false;
                    if (enableBtn) {
                        var $markUp = $('<div><div class="apm-prf-frhtgrid-drilldown-icon"></div></div>');
                        $markUp.find('.apm-prf-frhtgrid-drilldown-icon').attr('param-oper', value);
                        return $markUp.html();
                    } else {
                        return '';
                    }
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
                    $(me).find('.apm-prf-frhtgrid-viewcalls-icon').attr('param-rowIndex', $(this).index());
                    $(me).find('.apm-prf-frhtgrid-drilldown-icon').attr('param-rowIndex', $(this).index());
                });
                rows.hover(
                    function() {
                        $(this).find('.apm-prf-frhtgrid-viewcalls-icon').addClass('showicon');
                        $(this).find('.apm-prf-frhtgrid-drilldown-icon').addClass('showicon');
                    },
                    function() {
                        $(this).find('.apm-prf-frhtgrid-viewcalls-icon').removeClass('showicon');
                        $(this).find('.apm-prf-frhtgrid-drilldown-icon').removeClass('showicon');
                    }
                );
                rows.find('.apm-prf-frhtgrid-viewcalls-icon').click(function() {
                    var me = this;
                    var idx = $(me).attr('param-rowIndex');
                    APMPRF.Highcharts.viewCalls(idx);
                });
                rows.find('.apm-prf-frhtgrid-drilldown-icon').click(function() {
                    var me = this;
                    var idx = $(me).attr('param-rowIndex');
                    APMPRF.Highcharts.drillDownTimeline(idx);
                });
                if (APMPRF.Highcharts) {
                    APMPRF.Highcharts.renderFrhtLogsChart(grid.options.data);
                }
            }
        }
    };
    var $FrhtGrid = $('<div class="apm-prf-frht-grid">').psgpGrid(frhtGridOptions);
    $FrhtGridSubPanel.psgpSubPanel('getBody').append($FrhtGrid);

    $ProfilerDetailsPortlet.psgpPortlet('getBody')
        .append($Breadcrumbs)
        .append($KPIDetails)
        .append($FrhtChartSubPanel)
        .append($FrhtGridSubPanel);

    function refreshKPI(kpiData) {
        var kpiConfig = [{
                id: 'operationId',
                label: APMTranslation.apm.r2019a.profileroperationid()
            },
            {
                id: 'startDate',
                label: APMTranslation.apm.r2019a.starttimeanddate()
            },
            {
                id: 'scripts',
                label: APMTranslation.apm.r2019a.scripts()
            },
            {
                id: 'searches',
                label: APMTranslation.apm.ptd.label.searches()
            },
            {
                id: 'workflows',
                label: APMTranslation.apm.r2019a.workflows()
            },
            {
                id: 'records',
                label: APMTranslation.apm.r2019a.recordsfromscriptsworkflows()
            },
            {
                id: 'requesturls',
                label: APMTranslation.apm.r2019a.requesturls()
            },
        ];

        var blockMarkUp =
            '<div class="apm-prf-kpi-block">' +
            '<div class="label"></div>' +
            '<div class="value"></div>' +
            '</div>';

        var rowMarkUp = '<div class="apm-prf-kpi-row"></div>';

        var $kpiContainer = $('<div class="apm-prf-kpi-container"></div>');

        var maxColumns = 3;
        for (var i = 0; i < kpiConfig.length; i = i + maxColumns) {
            var $row = $(rowMarkUp);

            for (var j = 0; j < maxColumns; j++) {
                if (i + j < kpiConfig.length) {
                    var $block = $(blockMarkUp);
                    $block.find('.label').text(kpiConfig[i + j].label);
                    $block.find('.value').text(kpiData[kpiConfig[i + j].id]);
                    $row.append($block);
                }
            }

            $kpiContainer.append($row);
        }

        $KPIDetails.empty();
        $KPIDetails.append($kpiContainer);
    }

    $NoDataAvailable = $('<div class="apm-prf-nodataavailable"><div class="icon"></div><div class="message">' + APMTranslation.apm.common.label.nodataavailable() + '</div></div>');

    function showApiCallsPopup(params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-prf-apicalls">' +
            '<div class="grid">' +
            '</div>' +
            '</div>';
        $obj = $(markUp);

        var gridOptions = {
            url: APMPRF.Services.getURL('apiCalls'),
            sort: {
                dataIndex: 'startTimeMS',
                dir: false,
                remote: false
            },
            columns: [{
                    dataIndex: 'startTimeMS',
                    text: APMTranslation.apm.db.label.starttime(),
                    renderer: function(value, record) {
                        return record.startTime;
                    }
                },
                {
                    dataIndex: 'name',
                    text: APMTranslation.apm.common.label.name()
                },
                {
                    dataIndex: 'executionTime',
                    text: APMTranslation.apm.common.label.executiontime(),
                    renderer: function(value, record) {
                        return (value) ? value.toFixed(3) + ' s' : 0;
                    }
                }
            ]
        };

        $obj.psgpDialog({
            title: APMTranslation.apm.r2019a.apicalls(),
            width: 900
        });
        $obj.parents('.ui-dialog').css({
            "position": "absolute",
            "top": ($(window).height() - $obj.parents('.ui-dialog').height()) / 2 + $(window).scrollTop() + "px",
            "left": ($(window).width() - $obj.parents('.ui-dialog').width()) / 2 + $(window).scrollLeft() + "px"
        });

        var $grid = $obj.find('.grid').psgpGrid(gridOptions);

        $grid.psgpGrid('refreshData', params.apiCalls);
    }

    function refreshBreadcrumbs() {
        var breadcrumbs = APMPRF.Services.getGlobalSettings().breadcrumbs;
        var frhtTypes = APMPRF.Highcharts.frhtTypes;
        var markup = '';
        for (var i in breadcrumbs) {
            var frhtConfig = frhtTypes[breadcrumbs[i].type];
            frhtConfig = frhtConfig ? frhtConfig : frhtTypes['default'];
            var breadcrumbsFunc = 'APMPRF.Components.getBreadcrumbsData(' + i + ')';
            if (i == 0) {
                if (breadcrumbs.length > 1) {
                    markup += '<a href="#" onclick="' + breadcrumbsFunc + ';return false;">' + APMTranslation.apm.r2019a.top().toUpperCase() + '</a>'
                }
            } else if (i == (breadcrumbs.length - 1)) {
                markup += ' > ';
                markup += frhtConfig.label;
            } else {
                markup += ' > ';
                markup += '<a href="#" onclick="' + breadcrumbsFunc + ';return false;">' + frhtConfig.label + '</a>';
            }
        }
        $Breadcrumbs.empty();
        $Breadcrumbs.html(markup);
    }

    function getBreadcrumbsData(idx) {
        console.log(idx);
        var currentCrumb = APMPRF.Services.getGlobalSettings().breadcrumbs[idx];
        if (idx == 0) {
            APMPRF.Services.getGlobalSettings().breadcrumbs = [];
        } else {
            APMPRF.Services.getGlobalSettings().breadcrumbs = APMPRF.Services.getGlobalSettings().breadcrumbs.slice(0, idx);
        }
        var globalSettings = APMPRF.Services.getGlobalSettings();
        globalSettings.parentId = currentCrumb.parentId;
        globalSettings.type = currentCrumb.type;
        console.log(APMPRF.Services.getGlobalSettings().breadcrumbs);
        APMPRF.Services.refreshData();
    }

    return {
        $TitleBar: $TitleBar,
        $ColumnPanel: $ColumnPanel,
        $ProfilerDetailsPortlet: $ProfilerDetailsPortlet,
        $KPIDetails: $KPIDetails,
        $FrhtGrid: $FrhtGrid,
        $FrhtChartSubPanel: $FrhtChartSubPanel,
        $NoDataAvailable: $NoDataAvailable,
        showApiCallsPopup: showApiCallsPopup,
        refreshKPI: refreshKPI,
        refreshBreadcrumbs: refreshBreadcrumbs,
        getBreadcrumbsData: getBreadcrumbsData
    };

};