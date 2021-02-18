/**
 * © 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       14 May 2014     maquino          Initial version
 * 2.00       15 May 2014     maquino          Updated ScheduledScriptStatusGrid columns to match restlet
 * 3.00       16 May 2014     jmarimla         Added renderer to duration; Added autoScroll to panel of grid
 * 4.00       16 May 2014     jmarimla         Changed script name and deployment name to links
 * 5.00       19 May 2014     jmarimla         Added separate card panels for the charts; Added combobox to switch charts
 * 6.00       19 May 2014     maquino          Added Script Count chart and adjusted width for panel items
 * 7.00       19 May 2014     maquino          Edited x-axis type to properly display queues and removed autoScroll for chart area
 *                                             Added renderer for script count chart data to display different bar colors
 *                                             Added label for script count chart data to display total in bars
 *                                             Added script count chart data export functionality
 * 8.00       20 May 2014     jmarimla         Added utilization chart
 *                                             Added hover tooltips for script count chart and utilization chart
 *                                             Fixed sizes and layout of panels and charts
 * 9.00       22 May 2014     jmarimla         Added button for saving chart images
 *                                             Reorganized panels to remove redundant panels
 *                                             Changed Chart and Grid UI properties (e.g. color, scrolling, labels, height)
 * 10.00      23 May 2014     jmarimla         Autosize columns of the grid based on content
 *                                             Set Script Count chart as default value in chart type
 *                                             Removed trailing comma
 * 11.00      24 May 2014     jmarimla         changed chart bar labels to insideEnd
 * 12.00      29 May 2014     maquino          Added filter footer form
 * 13.00      29 May 2014     jmarimla         Disable dragging and hiding of grid panel headers
 *                                             Added id and listeners (resize and activate) to timeline chart panel
 * 14.00      30 May 2014     jmarimla         Adjusted height for timeline chart panel
 * 15.00      02 Jun 2014     jmarimla         Added class for grid links to apply css
 * 16.00      03 Jun 2014     jmarimla         Added save chart button for timeline chart
 *                                             Made sure labels on y-axis will show 2 decimal places at most
 * 17.00      03 Jun 2014     maquino          Refresh and apply filters when 'Refresh' button is clicked
 *                                             Reset filters to default values when 'Default' button is clicked
 *                                             Update script status filter and onlyy get scripts with 'Complete' status when Timeline and Utilization chart is selected
 *                                             Set initial values for filters
 * 18.00      04 Jun 2014     maquino          Change charts and reload grid only when Refresh button is clicked
 * 19.00      04 Jun 2014     jmarimla         Added call to waitforstores after call to restlet in refresh button
 * 20.00      04 Jun 2014     maquino          Limit start and end date range to 3 days for timeline charts
 *                                             Changed chart panel height
 * 21.00      06 Jun 2014     maquino          Added filter form validation and added params passed to restlet
 * 22.00      06 Jun 2014     maquino          Set filter values based on default or user settings
 * 23.00      10 Jun 2014     jmarimla         Removed animation for charts
 *                                             Set loading screen when Refresh button is clicked
 *                                             Removed switching of charts in refresh button handler
 * 24.00      10 Jun 2014     maquino          Set filter values based on user settings on initial load
 * 25.00      11 Jun 2014     maquino          Added margin between filter buttons
 * 26.00      18 Jun 2014     jmarimla         Modified convertStringToDateFormat to receive only one parameter; Modified calls to convertStringToDateFormat
 * 27.00      19 Jun 2014     jmarimla         Changed column renderer and data index for start date and end date in grid
 * 28.00      26 Jun 2014     jmarimla         Added perftestlogger checkpoint
 * 29.00      27 Jun 2014     jmarimla         Move filters panel to the top; fixed panel headers height
 * 30.00      01 Jul 2014     jmarimla         Added netsuite copyright
 *                                             Added css classes for fields in filters panel
 *                                             14.2 positioning of fields in filters panel
 * 31.00      02 Jul 2014     jmarimla         Combined refresh and default button
 * 32.00      04 Jul 2014     rwong            Added class selector for the grid and adjusted height to reflect 14.2 UI specs.
 * 33.00      04 Jul 2014     jmarimla         Created datepicker object and spacer object
 *                                             Remove focus from refresh button after clicking
 * 34.00      15 Jul 2014     jmarimla         Set filters label widths to 150
 *                                             Set filters title bar to expand/collapse
 *                                             Added classes for grid panel
 * 35.00      17 Jul 2014     jmarimla         Removed default button; moved refresh button outside of filters panel
 * 36.00      17 Jul 2014     rwong            Moved chart type filter from options panel to chart panel
 * 37.00      18 Jul 2014     jmarimla         Moved save chart button to chart header
 *                                             Resize panels and elements to fit in screen
 * 38.00      21 Jul 2014     jmarimla         Added mouseover and mouseout triggers to center panel
 *                                             Converted 'Scripting Chart' title to separate panel
 *                                             Removed mouseover trigger for save chart button
 * 39.00      21 Jul 2014     rwong            Added alert message when filters is 3 or more days
 * 40.00      21 Jul 2014     jmarimla         Changed chart panel to absolute layout; positioned items within chart panel
 * 41.00      21 Jul 2014     rwong            Added alert message when filters is 3 or more days
 * 42.00      22 Jul 2014     jmarimla         Changed padding for filters panel; changed margin for refresh button
 * 43.00      31 Jul 2014     jmarimla         Removed trailing commas
 *                                             Moved call to timeline chart refresh on activate of card panel
 * 44.00      31 Jul 2014     jmarimla         Make start/end date editable; added checking of start/end date on refresh
 * 45.00      06 Aug 2014     jmarimla         Changed script count chart to stacked chart
 *                                             Add additional colors for script count stacked chart
 * 46.00      07 Aug 2014     rwong            Disabled the menu in the grid columns.
 * 47.00      07 Aug 2014     jmarimla         Removed status field in filters panel; remove references to script status
 *                                             Changed order of stacked chart
 * 48.00      08 Aug 2014     rwong            Change label of Total Runtime to Total Duration
 * 49.00      11 Aug 2014     jmarimla         Removed unused variable, status
 * 50.00      12 Aug 2014     jmarimla         Added total in script count hover
 * 51.00      13 Aug 2014     jmarimla         Set up grid for aggregatedGridData store
 *                                             Changed params to startDate and endDate
 * 52.00      15 Aug 2014     jmarimla         Added paging toolbar to grid panel
 * 53.00      15 Aug 2014     jmarimla         Show date range in chart panel
 * 54.00      18 Aug 2014     jmarimla         Added checking to hide grid when no data returned
 * 55.00      20 Aug 2014     jmarimla         Changed colors for chart bars, removed rounded corners for stacked bars
 * 56.00      26 Aug 2014     rwong            Added complete, processing, pending, retry columns to the grid.
 * 57.00      27 Aug 2014     jmarimla         Added components for pop window and grid onclick of aggregated data
 * 58.00      28 Aug 2014     jmarimla         UI adjustments for ssi pop up window
 * 59.00      01 Sep 2014     jmarimla         Refactor onchange of chart type and removed redundant code
 * 60.00      03 Sep 2014     rwong            Added id to summary panel and options panel
 * 61.00      04 Sep 2014     jmarimla         Removed top margin of refresh button
 * 62.00      05 Sep 2014     rwong            Added Scheduled Script Instance Status
 * 63.00      08 Sep 2014     rwong            Removed top margin of refresh button
 * 64.00      08 Sep 2014     jmarimla         Added paging dropdown for ssi popup window
 * 65.00      09 Sep 2014     rwong            Added code for the tooltip of the scheduled script hover
 * 66.00      09 Sep 2014     jmarimla         Added paging dropdown for summary window
 * 67.00      12 Sep 2014     jmarimla         14.2 reskin of pagination
 * 68.00      12 Sep 2014     rwong            Added Links to SSI pop-up for script and deployment name
 * 69.00      15 Sep 2014     jmarimla         Disable grid selection
 *                                             Updated copyright
 * 70.00      18 Sep 2014     rwong            Added condition to not display the totals if there is only one type of script instance present.
 * 71.00      18 Sep 2014     jmarimla         Modified chart theme
 *                                             Expand paging drop down on hover
 * 72.00      24 Sep 2014     rwong            Added padding to pop-up grid.
 *
 */

var utilizationToolTip = new Ext4.Template(
        '<table class="sqm-tooltip">',
            '<tr>', '<td>',
                '<table style="width: 90%; margin: auto;">',
                    '<tr>', '<td class="label">Utilization</td>', '<td class="value">{utilPercent}%</td>', '</tr>',
                    '<tr>', '<td class="label">Script Count</td>', '<td class="value">{scriptCount}</td>', '</tr>',
                    '<tr>', '<td class="label">Total Duration</td>', '<td class="value">{totalRuntime} s</td>', '</tr>',
                '</table>',
                '</td>', '</tr>',
        '</table>');

var scriptCountToolTip = new Ext4.Template(
        '<table class="sqm-tooltip">',
            '<tr>', '<td>',
                '<table style="width: 90%; margin: auto;">',
                    '<tr>', '<td class="label">Complete</td>', '<td class="value">{complete}</td>', '</tr>',
                    '<tr>', '<td class="label">Processing</td>', '<td class="value">{processing}</td>', '</tr>',
                    '<tr>', '<td class="label">Pending</td>', '<td class="value">{pending}</td>', '</tr>',
                    '<tr>', '<td class="label">Retry</td>', '<td class="value">{retry}</td>', '</tr>',
                    '<tr>', '<td class="label">Failed</td>', '<td class="value">{failed}</td>', '</tr>',
                    '<tr class="summary">', '<td class="label">Total</td>', '<td class="value">{total}</td>', '</tr>',
                '</table>',
            '</td>', '</tr>',
        '</table>');

Ext4.define('Ext4.chart.theme.SQMDefaultChart', {
    extend : 'Ext4.chart.theme.Base',
    constructor : function(config) {
        this.callParent([Ext.apply({
            colors : ['#83D97A', '#7AB0D9', '#F3EB5E', '#FAB65D', '#D95E5E'],
            axis: {
                fill: '#666666',
                'stroke-width': 1
            },
            axisLabelLeft: {
                font: '11px Arial',
                fill: '#666'
            },
            axisLabelBottom: {
                font: '11px Arial',
                fill: '#666'
            },
            axisTitleLeft: {
                font: 'bold 18px Arial',
                fill: '#666666'
            },
            axisTitleBottom: {
                font: 'bold 18px Arial',
                fill: '#666666'
            },
        }, config)]);
    }
});

Ext4.define('PSGP.SQM.Component.ScriptCountChart', {
    extend: 'Ext4.chart.Chart',
    store: PSGP.SQM.dataStores.scriptCountData,
    shadow: true,
    minWidth: 500,
    theme: 'SQMDefaultChart',
    axes: [
           {
               title: 'Queue',
               type: 'Category',
               position: 'bottom',
               fields: ['queue'],
               minimum: 0
           },
           {
               title: 'Script Count',
               type: 'Numeric',
               position: 'left',
               fields: ['complete', 'processing', 'pending', 'retry', 'failed'],
               minimum: 0,
               grid: true,
               label : {
                   renderer: function(v) {
                       var st = Ext.util.Format.number(v, '0.00');
                       return parseFloat(st);
                   }
               }
           }
           ],
           legend: {
               position: 'bottom',
               labelFont: '14px Helvetica, sans-serif',
               itemSpacing: 20,
               boxStroke: '#E6E6E6'
           },
           series: [
                    {
                        type: 'column',
                        stacked: true,
                        axis: 'left',
                        xField: ['queue'],
                        yField: ['complete', 'processing', 'pending', 'retry', 'failed'],
                        title: ['Complete', 'Processing', 'Pending', 'Retry', 'Failed'],
                        renderer: function(sprite, record, attr, index, store) {
                            return Ext4.apply(attr, {
                                radius: 0
                            });
                        },
                        style : {
                            opacity : 1
                        },
                        label: {
                            display: 'insideEnd',
                            field: ['complete', 'processing', 'pending', 'retry', 'failed'],
                            color: '#000000',
                            renderer: function(v) {
                                if (v == 0) return '';
                                else return v;
                            }
                        },
                        tips : {
                            trackMouse : true,
                            width : 110,
                            height : 120,
                            dismissDelay : 0,
                            tpl : scriptCountToolTip,
                            ids : 'sqm-tooltip-scriptcount',
                            renderer : function(storeItem, item) {
                                var record = storeItem.raw;
                                this.update(record);
                            }
                        }
                    }
                    ]
}
);

Ext4.define('PSGP.SQM.Component.UtilizationChart', {
    extend: 'Ext4.chart.Chart',
    store: PSGP.SQM.dataStores.utilizationData,
    shadow: true,
    minWidth: 500,
    theme: 'SQMDefaultChart',
    axes: [
           {
               title: 'Queue',
               type: 'Category',
               position: 'bottom',
               fields: ['queue'],
               minimum: 0
           },
           {
               title: 'Utilization Percentage',
               type: 'Numeric',
               position: 'left',
               fields: ['utilPercent'],
               minimum: 0,
               grid: true,
               label : {
                   renderer: function(v) {
                       var st = Ext.util.Format.number(v, '0.00');
                       return parseFloat(st) + '%';
                   }
               }
           }
           ],
           series: [
                    {
                        type: 'column',
                        axis: 'left',
                        xField: ['queue'],
                        yField: ['utilPercent'],
                        renderer: function(sprite, record, attr, index, store) {
                            return Ext4.apply(attr, {
                                radius: 5
                            });
                        },
                        style : {
                            opacity : 1
                        },
                        label: {
                            display: 'insideEnd',
                            field: 'utilPercent',
                            color: '#000000',
                            renderer: function (v) {
                                if (v == 0) return '';
                                else return v + '%';
                            }
                        },
                        tips : {
                            trackMouse : true,
                            width : 160,
                            height : 66,
                            dismissDelay : 0,
                            tpl : utilizationToolTip,
                            ids : 'sqm-tooltip-utilization',
                            renderer : function(storeItem, item) {
                                var record = storeItem.raw;
                                this.update(record);
                            }
                        }
                    }
                    ]
});

Ext4.define('PSGP.SQM.Component.GridToolbar', {
    extend: 'Ext4.toolbar.Toolbar',
    border: false,
    cls: 'sqm-toolbar-grid'
});

Ext4.define('PSGP.SQM.Component.ComboBox', {
    extend : 'Ext4.form.field.ComboBox',
    labelAlign : 'left',
    valueField : 'id',
    displayField : 'name',
    forceSelection : true,
    editable: false,
    allowBlank: false,
    cls: 'sqm-input',
    fieldCls: 'sqm-input-field',
    overCls: 'sqm-input-over'
});

Ext4.define('PSGP.SQM.Component.ComboBox.PagingDropDown', {
    extend: 'PSGP.SQM.Component.ComboBox',
    labelWidth: 75,
    queryMode: 'local',
    matchFieldWidth: false,
    pickerAlign: 'tr-br',
    height: 30,
    margin: '0 20 0 15',
    grow: true,
    cls: 'sqm-input-pagingdropdown',
    fieldCls: 'sqm-input-pagingdropdown-field',
    overCls: 'sqm-input-pagingdropdown-over',
    listConfig: {
        cls: 'sqm-list-pagingdropdown'
    }
});

Ext4.define('PSGP.SQM.Component.PagingToolbar', {
   extend: 'Ext4.toolbar.Paging',
   border: false,
   cls: 'sqm-toolbar-paging',
   margin: '0 5 0 5',
   getPagingItems: function() {
       var me = this;
       return [
            {
                itemId: 'prev',
                tooltip: me.prevText,
                overflowText: me.prevText,
                iconCls: Ext4.baseCSSPrefix + 'tbar-page-prev',
                disabled: true,
                handler: me.movePrevious,
                scope: me
            },
            {
                itemId: 'next',
                tooltip: me.nextText,
                overflowText: me.nextText,
                iconCls: Ext4.baseCSSPrefix + 'tbar-page-next',
                disabled: true,
                handler: me.moveNext,
                scope: me
            }
       ];
   }
});

Ext4.define('PSGP.SQM.Component.TotalPagesField', {
    extend : 'Ext4.form.field.Display',
    fieldLabel: 'Total',
    value: 0,
    labelWidth: 32,
    labelSeparator : ':',
    margin: '0 5 0 5',
    labelCls : 'sqm-display-totalpages-label',
    fieldCls : 'sqm-display-totalpages-field'
});

Ext4.define('PSGP.SQM.Component.ScheduledScriptStatusGrid', {
    extend: 'Ext4.grid.Panel',
    cls: 'sqm-grid',
    store: PSGP.SQM.dataStores.aggregatedGridData,
    border: false,
    width: '100%',
    disableSelection: true,
    dockedItems: Ext4.create('PSGP.SQM.Component.GridToolbar', {
        items: [
            '->',
            Ext4.create('PSGP.SQM.Component.ComboBox.PagingDropDown', {
                id: 'psgp-sqm-combobox-summarypaging',
                store : PSGP.SQM.dataStores.summaryPaging,
                listeners : {
                    select: function (combo, records, eOpts) {
                        var selectedPage = combo.getValue();
                        PSGP.SQM.dataStores.aggregatedGridData.loadPage(selectedPage);
                    },
                    afterrender: function (combo) {
                        combo.el.on('mouseover', function () {
                            combo.expand();
                        }, combo);
                    },
                    expand: function (combo) {
                        combo.getPicker().el.monitorMouseLeave(500, combo.collapse, combo);
                    }
                }
            }),
            Ext4.create('PSGP.SQM.Component.PagingToolbar', {
                id: 'psgp-sqm-pagingtb-summary',
                store: PSGP.SQM.dataStores.aggregatedGridData
            }),
            Ext4.create('PSGP.SQM.Component.TotalPagesField', {
                id: 'psgp-sqm-totalpages-summary'
            })
        ]
    }),
    columns: {
        defaults : {
            hideable : false,
            draggable : false,
            menuDisabled : true,
            height: 28,
            flex: 1
        },
        items : [
                 {
                     text : 'Deployment Name',
                     dataIndex : 'deploymentName',
                     renderer : function (value, meta, record) {
                         return String.format('<a href="{0}"  target="_blank" class="sqm-a">{1}</a></span>', record.data.deploymentURL, value);
                     }
                 },
                 {
                     text : 'Script Name',
                     dataIndex : 'scriptName',
                     renderer : function (value, meta, record) {
                         return String.format('<a href="{0}"  target="_blank" class="sqm-a">{1}</a></span>', record.data.scriptURL, value);
                     }
                 },
                 {
                     text : 'Queue',
                     dataIndex : 'queue'
                 },
                 {
                     text: 'Script Instances',
                     xtype: 'templatecolumn',
                     dataIndex: 'scriptInstances',
                     tpl: Ext4.create('Ext4.XTemplate',
                            '<table id="sqm-grid-script-instances-{id}" class="sqm-grid-script-instances" cellspacing="0px" cellpadding="3px" onclick="showScriptDeploymentPopUp({id})">',
                                '<tr data-qtip="',
                                        '<table id=\'sqm-grid-script-instances-hover-{id}\' class=\'sqm-grid-script-instances-hover\'>',
                                            '<tr> <td class=\'sqm-grid-script-instances-title-hover\' colspan=2 > Scheduled Script Status </td></tr>',
                                            '<tr> <td class=\'sqm-grid-script-instances-complete-hover\'  > </td> <td>Complete</td>   </tr>',
                                            '<tr> <td class=\'sqm-grid-script-instances-processing-hover\'> </td> <td>Processing</td> </tr>',
                                            '<tr> <td class=\'sqm-grid-script-instances-pending-hover\'   > </td> <td>Pending</td>    </tr>',
                                            '<tr> <td class=\'sqm-grid-script-instances-retry-hover\'     > </td> <td>Retry</td>      </tr>',
                                            '<tr> <td class=\'sqm-grid-script-instances-failed-hover\'    > </td> <td>Failed</td>     </tr>',
                                            '<tr> <td class=\'sqm-grid-script-instances-total-hover\'     > </td> <td>Total</td>      </tr>',
                                        '</table>">',
                                    '<tpl if="complete &gt; 0">',
                                        '<td class="sqm-grid-script-instances-complete">{complete}</td>',
                                    '</tpl>',
                                   '<tpl if="processing &gt; 0">',
                                        '<td class="sqm-grid-script-instances-processing">{processing}</td>',
                                    '</tpl>',
                                    '<tpl if="pending &gt; 0">',
                                        '<td class="sqm-grid-script-instances-pending">{pending}</td>',
                                    '</tpl>',
                                    '<tpl if="retry &gt; 0">',
                                        '<td class="sqm-grid-script-instances-retry">{retry}</td>',
                                    '</tpl>',
                                    '<tpl if="failed &gt; 0">',
                                        '<td class="sqm-grid-script-instances-failed">{failed}</td>',
                                    '</tpl>',
                                    '<tpl if="scriptInstances &gt; 0',
                                            '&& (scriptInstances != complete && scriptInstances != processing && scriptInstances != pending && scriptInstances != retry && scriptInstances != failed)">',
                                        '<td class="sqm-grid-script-instances-total">{scriptInstances}</td>',
                                    '</tpl>',
                                '</tr>',
                            '</table>'
                     )
                 },
                 {
                     text : 'Ave Duration',
                     dataIndex : 'aveDuration',
                     renderer : function (v) {
                         return v + ' s';
                     }
                 },
                 {
                     text : 'Ave Wait Time',
                     dataIndex : 'aveWaitTime',
                     renderer : function (v) {
                         return v + ' s';
                     }
                 },
                 {
                     text : 'Utilization',
                     dataIndex : 'utilization',
                     renderer : function (v) {
                         return v + '%';
                     }
                 }
                 ]
    },
    viewConfig: {
        listeners: {
            refresh : function (dataview) {
                var gridStore = dataview.getStore();
                if (gridStore.getAt(0).getId() == undefined) {
                    dataview.hide();
                } else {
                    dataview.show();
                    Ext4.each(dataview.panel.columns, function(column) {
                        column.autoSize();
                    });
                }
            }
        }
    }
});

Ext4.define('PSGP.SQM.Component.DateFilterPanel', {
    extend: 'Ext4.panel.Panel',
    layout: 'hbox',
    border: false
});

Ext4.define('PSGP.SQM.Component.DatePicker', {
    extend: 'Ext4.picker.Date',
    floating: true,
    hidden: true,
    focusOnShow: true,
    renderTo: Ext4.getBody(),
    showToday: false,
    width: 194,
    monthYearFormat: 'M Y'
});

Ext4.define('PSGP.SQM.Component.Date', {
    extend: 'Ext4.form.field.Date',
    editable: true,
    allowBlank: false,
    cls: 'sqm-date-form',
    fieldCls: 'sqm-date-field',
    overCls: 'sqm-date-field-over',
    width: 120,
    showToday: false,
    createPicker: function () {
        var me = this;
        var datepicker = Ext4.create('PSGP.SQM.Component.DatePicker', {
            pickerField: me,
            ownerCt: me.ownerCt,
            listeners: {
                scope: me,
                select: me.onSelect
            },
            keyNavConfig: {
                esc: function() {
                    me.collapse();
                }
            }
        });
        return datepicker;
    }
});

Ext4.define('PSGP.SQM.Component.Time', {
    extend: 'Ext4.form.field.Time',
    width: 100,
    editable: false,
    cls: 'sqm-input',
    fieldCls: 'sqm-input-field',
    overCls: 'sqm-input-over'
});

Ext4.define('PSGP.SQM.Component.DateSeparator', {
    extend : 'Ext4.toolbar.Spacer',
    width : 19
});

Ext4.define('PSGP.SQM.Component.Display', {
    extend : 'Ext4.form.field.Display',
    labelSeparator: '',
    labelWidth: 150,
    labelCls: 'sqm-display-label',
    fieldCls: 'sqm-display-field'
});

Ext4.define('PSGP.SQM.Component.Button', {
    extend: 'Ext4.button.Button',
    cls: 'sqm-rect-btn sqm-rect-btn-gray'
});

Ext4.define('PSGP.SQM.Component.BlueButton', {
    extend: 'Ext4.button.Button',
    cls: 'sqm-rect-btn sqm-rect-btn-blue',
    padding: '0 12 0 12',
    height: 28
});

Ext4.define('PSGP.SQM.Component.SplitButton', {
    extend: 'Ext4.button.Split',
    cls: 'sqm-button-split sqm-button-split-gray',
    height: 28
});

Ext4.define('PSGP.SQM.Component.SplitMenu', {
    extend: 'Ext4.menu.Menu',
    cls: 'sqm-button-split-menu',
    shadow: false
});

Ext4.define('PSGP.SQM.Component.FiltersPanel', {
    id: 'psgp-sqm-filters-panel',
    extend: 'Ext4.panel.Panel',
    cls: 'sqm-filters-panel',
    bodyCls: 'sqm-filters-panel-body',
    title: 'FILTERS',
    layout : 'column',
    border: true,
    align: 'center',
    collapsible : true,
    collapseFirst : true,
    titleCollapse : true,
    animCollapse : false,
    header : {
        height: 26
    },
    items : [
             {
                 width: 270,
                 border: false,
                 align: 'left',
                 items: [
                         {
                             layout: 'hbox',
                             border: false,
                             items: [
                                     Ext4.create('PSGP.SQM.Component.Display', {
                                         fieldLabel: 'Start Date/Time'
                                     })
                                     ]
                         },
                         Ext4.create('PSGP.SQM.Component.DateFilterPanel', {
                             items: [
                                     Ext4.create('PSGP.SQM.Component.Date', {
                                         id: 'psgp-sqm-options-date-startdate'
                                     }),
                                     Ext4.create('PSGP.SQM.Component.DateSeparator'),
                                     Ext4.create('PSGP.SQM.Component.Time', {
                                         id: 'psgp-sqm-options-time-starttime'
                                     })
                                     ]
                         })
                         ]
             },
             {
                 width: 270,
                 border: false,
                 align: 'left',
                 items: [
                         {
                             layout: 'hbox',
                             border: false,
                             items: [
                                     Ext4.create('PSGP.SQM.Component.Display', {
                                         fieldLabel: 'End Date/Time'
                                     })
                                     ]
                         },
                         Ext4.create('PSGP.SQM.Component.DateFilterPanel', {
                             items: [
                                     Ext4.create('PSGP.SQM.Component.Date', {
                                         id: 'psgp-sqm-options-date-enddate'
                                     }),
                                     Ext4.create('PSGP.SQM.Component.DateSeparator'),
                                     Ext4.create('PSGP.SQM.Component.Time', {
                                         id: 'psgp-sqm-options-time-endtime'
                                     })
                                     ]
                         })
                         ]
             }
             ],
             listeners: {
                beforerender: function(panel, eOpts){
                    if(PSGP.SQM.dataStores.filters == "false" || PSGP.SQM.dataStores.filters == false){
                        Ext4.apply(panel, {collapsed : false });
                    } else {
                        Ext4.apply(panel, {collapsed : true });
                    }
                },
             }
});

Ext4.define('PSGP.SQM.Component.ChartPanel', {
    extend : 'Ext4.panel.Panel',
    layout: 'anchor',
    width: '100%',
    resizable: false,
    border: false,
    header : {
        height: 36
    },
    autoScroll : true
});

Ext4.define('PSGP.SQM.Component.ChartToolbar', {
    extend: 'Ext4.toolbar.Toolbar',
    height: 40,
    border: false,
    cls: 'sqm-toolbar'
});

Ext4.define('PSGP.SQM.Component.SaveChartMenu', {
    extend: 'Ext4.menu.Menu',
    cls: 'sqm-menu',
    overCls: 'sqm-menu-over',
    chartType: '',
    items: [
            {
                text: 'Download PNG image',
                handler: function () {
                    var chartArea = Ext4.getCmp('psgp-sqm-chartarea');
                    var activeCard = chartArea.getLayout().getActiveItem();
                    if (activeCard.chartId == 'psgp-sqm-chart-timeline') { //highcharts export
                        timelineChart.exportChart({
                            type: 'image/png'
                        });
                    } else {
                        Ext4.getCmp(activeCard.chartId).save({ //ext js export
                            type: 'image/png'
                        });
                    }
                }
            }/*,
        {
            text: 'Download JPEG image',
            handler: function () {
                var chartArea = Ext4.getCmp('psgp-sqm-chartarea');
                var activeCard = chartArea.getLayout().getActiveItem();
                Ext4.getCmp(activeCard.chartId).save({
                    type: 'image/jpeg'
                });
            }
        },
        {
            text: 'Download SVG image',
            handler: function () {
                var chartArea = Ext4.getCmp('psgp-sqm-chartarea');
                var activeCard = chartArea.getLayout().getActiveItem();
                var s = Ext4.getCmp(activeCard.chartId).save({
                    type: 'image/svg+xml'
                });
                console.log(s);
            }
        }*/
            ]
});

Ext4.define('PSGP.SQM.Component.SaveChartButton', {
    extend: 'Ext4.button.Button',
    cls: 'sqm-menu-btn',
    iconCls: 'sqm-menu-btn-icon',
    height: 36,
    width: 36,
    menuAlign: 'tr-br?'
});

Ext4.define('PSGP.SQM.Component.ChartSubPanel', {
    extend: 'Ext4.panel.Panel',
    cls: 'sqm-chart-subpanel',
    height: 540,
    layout: 'fit',
    border: false,
    minWidth: 500
});

Ext4.define('PSGP.SQM.Component.TbLongSpacer', {
    extend: 'Ext4.toolbar.Spacer',
    width: 20
});

Ext4.define('PSGP.SQM.Component.ComboBox.ChartType', {
    id: 'psgp-sqm-options-combobox-charttype',
    extend: 'PSGP.SQM.Component.ComboBox',
    width: 150,
    labelWidth: 75,
    margin : '15 10 15 50',
    store: PSGP.SQM.dataStores.chartComboBox,
    listeners: {
        change : function (field, newValue, oldValue, eOpts) {
            PSGP.SQM.dataStores.setChartComponents(newValue);
        }
    }
});

Ext4.define('PSGP.SQM.Component.MainPanel', {
    extend: 'Ext4.panel.Panel',
    id: 'psgp-sqm-main',
    cls: 'sqm-panel',
    layout: 'border',
    height: 768,
    border: false,
    defaults: {
        margin: '0 0 0 0',
        bodypadding: 0
    },
    items: [{
        region: 'center',
        collapsible: false,
        width: '50%',
        cls: 'sqm-border-center',
        layout: 'absolute',
        listeners: {
            afterrender: function(p, eOpts) {
                p.body.on('mouseover', function() {
                    Ext4.getCmp('pspg-sqm-btn-chartmenu').show();
                }, p);
                p.body.on('mouseout', function() {
                    Ext4.getCmp('pspg-sqm-btn-chartmenu').hide();
                }, p);
            }
        },
        items : [
                 Ext4.create('Ext4.panel.Panel', {
                     title: 'Scripting Chart',
                     cls: 'sqm-border-center',
                     x: 0,
                     y: 0,
                     header : {
                         height: 36
                     },
                     tools : [
                              Ext4.create('PSGP.SQM.Component.SaveChartButton', {
                                  menu: Ext4.create('PSGP.SQM.Component.SaveChartMenu', {
                                      listeners: {
                                          mouseover: function() {
                                              Ext4.getCmp('pspg-sqm-btn-chartmenu').show();
                                          }
                                      }
                                  }),
                                  id: 'pspg-sqm-btn-chartmenu',
                                  hidden: true
                              })
                              ]
                 }),
                 Ext4.create('PSGP.SQM.Component.ChartPanel', {
                     id : 'psgp-sqm-chartarea',
                     x: 0,
                     y: 36,
                     layout: 'card',
                     header: false,
                     items: [
                             Ext4.create('PSGP.SQM.Component.ChartPanel', {
//                               title : 'Scheduled Scripts Queue Script Count',
                                 id : 'psgp-sqm-card-scriptcount',
                                 chartId : 'psgp-sqm-chart-scriptcount',
                                 header: false,
                                 items : [
                                          Ext4.create('PSGP.SQM.Component.ChartSubPanel', {
                                              padding: '55 0 0 0',
                                              items : [
                                                       Ext4.create('PSGP.SQM.Component.ScriptCountChart', {
                                                           id: 'psgp-sqm-chart-scriptcount'
                                                       })
                                                       ]
                                          })
                                          ]
                             }),
                             Ext4.create('PSGP.SQM.Component.ChartPanel', {
//                               title : 'Scheduled Scripts Queue Utilization',
                                 id : 'psgp-sqm-card-utilization',
                                 chartId : 'psgp-sqm-chart-utilization',
                                 header: false,
                                 items : [
                                          Ext4.create('PSGP.SQM.Component.ChartSubPanel', {
                                              padding: '55 0 0 0',
                                              items : [
                                                       Ext4.create('PSGP.SQM.Component.UtilizationChart', {
                                                           id: 'psgp-sqm-chart-utilization'
                                                       })
                                                       ]
                                          })
                                          ]
                             }),
                             Ext4.create('PSGP.SQM.Component.ChartPanel', {
//                               title : 'Scheduled Scripts Queue Timeline',
                                 id : 'psgp-sqm-card-timeline',
                                 chartId : 'psgp-sqm-chart-timeline',
                                 header: false,
                                 listeners : {
                                     activate : function (panel) {
                                         timelineChartUtil.refreshChart();
                                         timelineChartUtil.resizeChart();
                                     },
                                     resize : function (panel) {
                                         timelineChartUtil.resizeChart();
                                     }
                                 },
                                 items : [
                                          Ext4.create('PSGP.SQM.Component.ChartSubPanel', {
                                              id: 'psgp-sqm-subpanel-timeline'
                                          })
                                          ]
                             })
                             ]

                 }),
                 Ext4.create('PSGP.SQM.Component.ComboBox.ChartType', {
                     x: 0,
                     y: 36
                 }),
                 Ext4.create('PSGP.SQM.Component.Display', {
                     id: 'psgp-sqm-display-daterange',
                     value: '{from} - {to}',
                     x: 210,
                     y: 54
                 })
                 ]
    },{
        title: 'Summary',
        id: 'psgp-sqm-summary-panel',
        region: 'east',
        width: '50%',
        cls: 'sqm-grid-panel',
        collapsedCls: 'sqm-grid-panel-collapsed',
        collapsible: true,
        collapseDirection: 'right',
        layout: 'fit',
        margin : '1 0 0 0',
        header : {
            height: 36
        },
        listeners : {
            beforerender: function(panel, eOpts){
                if(PSGP.SQM.dataStores.summary == "false" || PSGP.SQM.dataStores.summary == false){
                    Ext4.apply(panel, {collapsed : false });
                } else {
                    Ext4.apply(panel, {collapsed : true });
                }
            }
        },
        items : [
                 Ext4.create('PSGP.SQM.Component.ScheduledScriptStatusGrid')
                 ]
    },{
        title: 'Options',
        header: false,
        region: 'north',
        border: false,
        bodyPadding: '0 30 10 30',
        collapsible: false,
        items : [
                 Ext4.create('PSGP.SQM.Component.BlueButton', {
                     id: 'psgp-sqm-btn-refresh',
                     text: 'Refresh',
                     margin: '0 0 10 0',
                     handler: function () {

                         //check dates validity
                         if (!Ext4.getCmp('psgp-sqm-options-date-startdate').isValid()) {
                             alert('Please enter a valid start date.');
                             return false;
                         }
                         if (!Ext4.getCmp('psgp-sqm-options-date-enddate').isValid()) {
                             alert('Please enter a valid end date.');
                             return false;
                         }

                         var startdate = Ext4.getCmp('psgp-sqm-options-date-startdate').getValue();
                         var starttime = Ext4.getCmp('psgp-sqm-options-time-starttime').getValue();
                         var enddate = Ext4.getCmp('psgp-sqm-options-date-enddate').getValue();
                         var endtime = Ext4.getCmp('psgp-sqm-options-time-endtime').getValue();
                         var start = new Date(startdate.getFullYear(), startdate.getMonth(), startdate.getDate(), starttime.getHours(), starttime.getMinutes(), 0, 0);
                         var end = new Date(enddate.getFullYear(), enddate.getMonth(), enddate.getDate(), endtime.getHours(), endtime.getMinutes(), 0, 0);
                         var chart = Ext4.getCmp('psgp-sqm-options-combobox-charttype').getValue();
                         var summary = Ext4.getCmp('psgp-sqm-summary-panel').getCollapsed();
                         var filters = Ext4.getCmp('psgp-sqm-filters-panel').getCollapsed();

                         if(start > end) {
                             alert('Start date must be earlier than end date.');
                             return false;
                         }

                         perfTestLogger.start('on refresh');

                         params = {
                                 startDate: start,
                                 endDate: end,
                                 chart: chart,
                                 summary: summary,
                                 filters: filters
                         };
                         PSGP.SQM.dataStores.params = params;

                         Ext4.getCmp('psgp-sqm-main').setLoading(true);
                         PSGP.SQM.dataStores.callSSIRestlet(params);
                         PSGP.SQM.dataStores.waitForStores();
                     }
                 }),
                 Ext4.create('PSGP.SQM.Component.FiltersPanel')
                 ]
    }
    ]
});

Ext4.define('PSGP.SQM.Component.Window', {
    extend : 'Ext4.window.Window',
    padding : 0,
    closeAction : 'hide',
    autoHeight : true,
    plain : true,
    modal : true,
    resizable : false,
    hidden: true,
    cls : 'sqm-window',
    bodyCls : 'sqm-window-body'
});

Ext4.define('PSGP.SQM.Component.SummaryField', {
    extend : 'Ext4.form.field.Display',
    labelSeparator : '',
    labelCls : 'sqm-display-summary-label',
    fieldCls : 'sqm-display-summary-field',
    labelAlign : 'top'
});

Ext4.define('PSGP.SQM.Component.SSIGrid', {
    extend : 'Ext4.grid.Panel',
    cls : 'sqm-grid',
    store : PSGP.SQM.dataStores.schedScriptInstances,
    border : false,
    width : '100%',
    disableSelection: true,
    dockedItems: Ext4.create('PSGP.SQM.Component.GridToolbar', {
        items: [
            '->',
            Ext4.create('PSGP.SQM.Component.ComboBox.PagingDropDown', {
                id: 'psgp-sqm-combobox-ssipaging',
                store : PSGP.SQM.dataStores.ssiPaging,
                listeners : {
                    select: function (combo, records, eOpts) {
                        var selectedPage = combo.getValue();
                        PSGP.SQM.dataStores.schedScriptInstances.loadPage(selectedPage);
                    },
                    afterrender: function (combo) {
                        combo.el.on('mouseover', function () {
                            combo.expand();
                        }, combo);
                    },
                    expand: function (combo) {
                        combo.getPicker().el.monitorMouseLeave(500, combo.collapse, combo);
                    }
                }
            }),
            Ext4.create('PSGP.SQM.Component.PagingToolbar', {
                id: 'psgp-sqm-pagingtb-ssi',
                store: PSGP.SQM.dataStores.schedScriptInstances
            }),
            Ext4.create('PSGP.SQM.Component.TotalPagesField', {
                id: 'psgp-sqm-totalpages-ssi'
             })
         ]
    }),
    columns: {
        defaults : {
            hideable : false,
            draggable : false,
            menuDisabled : true,
            height: 28,
            flex: 1
        },
        items : [
            {
                text : 'Date Created',
                dataIndex : 'dateCreated'
            },
            {
                text : 'Start',
                dataIndex : 'startDate'
            },
            {
                text : 'End',
                dataIndex : 'endDate'
            },
            {
                text : 'Status',
                dataIndex : 'status'
            },
            {
                text : '% Complete',
                dataIndex : 'percentComplete',
                renderer : function (value, meta, record) {
                    return value + '%';
                }
            },
            {
                text : 'Duration',
                dataIndex : 'duration',
                renderer : function (value, meta, record) {
                    return value + ' s';
                }
            },
            {
                text : 'Wait Time',
                dataIndex : 'waitTime',
                renderer : function (value, meta, record) {
                    return value + ' s';
                }
            }
        ]
    },
    viewConfig: {
        listeners: {
            refresh : function (dataview) {
                var gridStore = dataview.getStore();
                if ((gridStore.getCount() != 0) && (gridStore.getAt(0).getId() == undefined)) {
                    dataview.hide();
                } else {
                    dataview.show();
                    Ext4.each(dataview.panel.columns, function(column) {
                        column.autoSize();
                    });
                }
            }
        }
    }
});

Ext4.define('PSGP.SQM.Component.Window.SSI', {
    extend : 'PSGP.SQM.Component.Window',
    id : 'psgp-sqm-window-ssi',
    title : 'Scheduled Script Instance',
    width : 800,
    bodyPadding: 15,
    border : false,
    header : {
        height: 30
    },
    items : [
             Ext4.create('Ext4.panel.Panel', {
                 id : 'psgp-sqm-window-ssi-summary',
                 //height : 35,
                 layout : 'column',
                 border: false,
                 defaults : {
                     margin : '8 10 8 10'
                 },
                 items : [
                          Ext4.create('PSGP.SQM.Component.SummaryField', {
                              id : 'psgp-sqm-summaryfield-queue',
                              fieldLabel : 'Queue',
                              labelWidth : 50,
                          }),
                          Ext4.create('PSGP.SQM.Component.SummaryField', {
                              id : 'psgp-sqm-summaryfield-deploymentname',
                              fieldLabel : 'Deployment Name',
                              labelWidth : 125,
                          }),
                          Ext4.create('PSGP.SQM.Component.SummaryField', {
                              id : 'psgp-sqm-summaryfield-scriptname',
                              fieldLabel : 'Script Name',
                              labelWidth : 84,
                          })
                          ]
             }),
             Ext4.create('PSGP.SQM.Component.SSIGrid', {
                 id : 'psgp-sqm-grid-ssi',
                 height : 550
             })
             ]
});

function showScriptDeploymentPopUp(recordid) {
    var gridStore = PSGP.SQM.dataStores.aggregatedGridData;
    var gridRecord = gridStore.getById(recordid);
    var deploymentId = gridRecord.get('deploymentId');
    var queue = gridRecord.get('queue');
    var deploymentName = gridRecord.get('deploymentName');
    var deploymentURL = gridRecord.get('deploymentURL');
    var scriptName = gridRecord.get('scriptName');
    var scriptURL = gridRecord.get('scriptURL');
    var deploymentURLValue = String.format('<a href="{0}"  target="_blank" class="sqm-a">{1}</a></span>', deploymentURL, deploymentName);
    var scriptURLValue = String.format('<a href="{0}"  target="_blank" class="sqm-a">{1}</a></span>', scriptURL, scriptName);
    Ext4.getCmp('psgp-sqm-summaryfield-queue').setValue(queue);
    Ext4.getCmp('psgp-sqm-summaryfield-deploymentname').setValue(deploymentURLValue);
    Ext4.getCmp('psgp-sqm-summaryfield-scriptname').setValue(scriptURLValue);
    Ext4.getCmp('psgp-sqm-window-ssi').show();

    PSGP.SQM.dataStores.params.deploymentId = deploymentId;
    PSGP.SQM.dataStores.params.queue = queue;
    PSGP.SQM.dataStores.schedScriptInstances.loadPage(1);
}
