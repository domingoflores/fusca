/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       04 Jan 2018     jmarimla         Initial 
 * 2.00       08 Jan 2018     jmarimla         Instance details grid
 * 3.00       11 Jan 2018     jmarimla         Instance details chart
 * 4.00       09 Feb 2018     jmarimla         Label change
 * 5.00       04 Apr 2018     jmarimla         Labels
 * 6.00       11 Jun 2018     jmarimla         Translation engine
 * 7.00       16 Jul 2018     rwong            Translation strings 
 * 8.00       19 Jul 2018     rwong            Translation strings
 * 9.00       26 Jul 2018     jmarimla         FRHT column
 * 10.00      20 Sep 2018     jmarimla         Comment out FRHT column
 * 11.00      23 Nov 2018     jmarimla         Export CSV
 *
 */

APMSPJD = APMSPJD || {};

APMSPJD._Components = function () {
    
    var $TitleBar = $('<div>').psgpSuiteletTitle({
    	title: APMTranslation.apm.spjd.label.suitecouldprocessorsjobdetails()
    });
    
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

            var startDateMS = APMSPJD.Services.convertToDateObj(stDate, stTime).getTime();
            var endDateMS = APMSPJD.Services.convertToDateObj(etDate, etTime).getTime();
            //validate date range
            if(startDateMS > endDateMS) {
            	alert(APMTranslation.apm.common.alert.startdateearlierthanenddate());
                return;
            }
            //max 30 days
            if(endDateMS - startDateMS > 1000*60*60*24*30) {
            	alert(apm.common.alert.daterange._30days());
                return false;
            }
            
            var scriptType = $ScriptTypeFilter.find('.psgp-combobox').val();
            var deploymentId = $DeploymentFilter.find('.psgp-combobox').val();
            
            APMSPJD.Services.showLoading();
            
            startDateMS = APMSPJD.Services.convertToPSTms(stDate, stTime);
            endDateMS = APMSPJD.Services.convertToPSTms(etDate, etTime);
            
            var globalSettings = APMSPJD.Services.getGlobalSettings();
            globalSettings.startDateMS = startDateMS;
            globalSettings.endDateMS = endDateMS;
            globalSettings.scriptType = scriptType;
            globalSettings.deploymentId = deploymentId;
            
            APMSPJD.Services.refreshData();
        }
    });
    
    var $FilterPanel = $('<div>').psgpFilterPanel({});
    
    var $StartDateTimeFilter = $('<div>').psgpDateTimeField({
    	label: APMTranslation.apm.common.label.startdatetime()
    });
    
    var $EndDateTimeFilter = $('<div>').psgpDateTimeField({
    	label: APMTranslation.apm.common.label.enddatetime()
    });
    
    var $ScriptTypeFilter = $('<div class="psgp-filter-combo"><div><span class="psgp-field-label">' + APMTranslation.apm.spjd.label.tasktype() + '</span><div class="filter-scripttype"></div></div></div>'); 
    $ScriptTypeFilter.find('.filter-scripttype').psgpComboBox({
        list: [
            { 'name': '- ' + APMTranslation.apm.spjd.label.alltasktypes() + ' -', 'id': '' },
            { 'name': '' + APMTranslation.apm.common.label.mapreduce() + '', 'id': 'MAPREDUCE' },
            { 'name': '' + APMTranslation.apm.common.label.scheduled() + '', 'id': 'SCHEDULED' }
        ],
        width:  130,
        change: function( event, ui ) {
            var newValue = ui.item.value;
            APMSPJD.Services.refreshDeploymentListData({
                scriptType : newValue
            });
        }
    });
    
    var $DeploymentFilter = $('<div class="psgp-filter-combo"><div><span class="psgp-field-label">' + APMTranslation.apm.spjd.label.deployment() + '</span><div class="filter-deployment"></div></div></div>');
    $DeploymentFilter.find('.filter-deployment').psgpComboBox({
        list: [
            { 'name': '- ' + APMTranslation.apm.spjd.label.alldeployments() + ' -', 'id': '' }
            //{ 'name': 'Your deployments are loading. Please wait.', 'id': '' }
        ],
        width:  300
    });
    
    $FilterPanel.psgpFilterPanel('addFilterField', $StartDateTimeFilter);
    $FilterPanel.psgpFilterPanel('addFilterField', $EndDateTimeFilter);
    $FilterPanel.psgpFilterPanel('addFilterField', $ScriptTypeFilter);
    $FilterPanel.psgpFilterPanel('addFilterField', $DeploymentFilter);
    
    var $InstanceDetailsPortlet = $('<div>').psgpPortlet({
    	title: APMTranslation.apm.spjd.label.jobdetails()
    });
    
    var deploymentsGridOptions = {
            url: APMSPJD.Services.getURL('instanceDetails'),
            sort: {
                dataIndex: 'dateCreated',
                dir: false,
                remote: true
            },
            paging: {
                pageLimit: 10
            },
            exportCSV: true,
            columns: [
                {
                    dataIndex: 'dateCreated',
                    text: APMTranslation.apm.spjd.label.datecreated()
                },
                {
                    dataIndex: 'startDate',
                    text: APMTranslation.apm.common.label.startdate()
                },
                {
                    dataIndex: 'endDate',
                    text: APMTranslation.apm.common.label.enddate()
                },
                {
                    dataIndex: 'deploymentName',
                    text: APMTranslation.apm.common.label.deploymentname(),
                    width: '15%',
                    renderer: function (value, record) {
                        var url = record.deploymentURL;
                        return '<a target="_blank" href="' + url + '">' + value + '</a>';
                    }
                },
                {
                    dataIndex: 'scriptName',
                    text: APMTranslation.apm.common.label.scriptname(),
                    width: '15%',
                    renderer: function (value, record) {
                        var url = record.scriptURL;
                        return '<a target="_blank" href="' + url + '">' + value + '</a>';
                    }
                },
                {
                    dataIndex: 'scriptType',
                    text: APMTranslation.apm.spjd.label.tasktype(),
                    renderer: function (value) {
                        if(value == 'MAPREDUCE')
                            return APMTranslation.apm.common.label.mapreduce();
                        if(value == 'SCHEDULED')
                        	return APMTranslation.apm.common.label.scheduled();
                        return value;
                    }

                },
                {
                    dataIndex: 'waitTime',
                    text: APMTranslation.apm.common.label.waittime(),
                    renderer: function (value) {
                        return value.toFixed(2) + ' s';
                    }
                },
                {
                    dataIndex: 'executionTime',
                    text: APMTranslation.apm.common.label.executiontime(),
                    renderer: function (value) {
                        return value.toFixed(2) + ' s';
                    }
                },
                {
                    dataIndex: 'origPrio',
                    text: APMTranslation.apm.spjd.label.originalpriority(),
                    renderer: function (value) {
                        if(value == 1)
                            return APMTranslation.apm.common.priority.high();
                        if(value == 2)
                            return APMTranslation.apm.common.priority.standard();
                        if(value == 3)
                        	return APMTranslation.apm.common.priority.standard();
                        return value;
                    }
                },
                {
                    dataIndex: 'elevPrio',
                    text: APMTranslation.apm.common.label.elevatedpriority(),
                    renderer: function (value) {
                        if(value == 1)
                        	return APMTranslation.apm.common.priority.high();
                        if(value == 2)
                        	return APMTranslation.apm.common.priority.standard();
                        if(value == 3)
                        	return APMTranslation.apm.common.priority.standard();
                        return value;
                    }
                },
                {
                    dataIndex: 'status',
                    text: APMTranslation.apm.common.label.status(),
                    renderer: function(value) {
                        switch (value) {
                            case "Complete":
                                return APMTranslation.apm.scpm.label.complete();
                            case "Processing":
                                return APMTranslation.apm.scpm.label.processing();
                            case "Pending":
                                return APMTranslation.apm.scpm.label.pending();
                            case "Deferred":
                                return APMTranslation.apm.scpm.label.deferred();
                            case "Retry":
                                return APMTranslation.apm.scpm.label.retry();
                            case "Failed":
                                return APMTranslation.apm.common.label.failed();
                            case "Cancelled":
                                return APMTranslation.apm.scpm.label.cancelled();
                            default:
                                return value;
                        }
                    }
                },
                {
                    dataIndex: 'queue',
                    text: APMTranslation.apm.common.label.queue(),
                    renderer: function (value) {
                        if(value == 0)
                            return '- ' + APMTranslation.apm.common.label.none() +' -';
                        return value;
                    }
                },
                {
                    dataIndex: 'mrStage',
                    text: APMTranslation.apm.spjd.label.mapreducestage(),
                    renderer: function (value) {
                        return (value) ? value : '-';
                    }
                }/*, 
	            {
	                dataIndex: 'viewDetails',
	                text: APMTranslation.apm.common.label.viewfrhtdetails(),
	                width: '130px',
	                renderer: function(value, record) {
	                    var $markUp = $('<div><div class="apm-spjd-instancedetails-viewdetails-icon"></div></div>');
	                    $markUp.find('.apm-spjd-instancedetails-viewdetails-icon').attr('param-oper', value);
	                    return $markUp.html();
	                },
	                resizable: false,
	                sortable: false
	            }*/
            ],
            listeners: {
                afterRefreshData: function (grid) {
//                	  var rows = grid.element.find('tbody tr');
//                    var gData = grid.options.data;
//                    var gParams = grid.options.params;
//                    rows.each(function(index) {
//                        var me = this;
//                        $(me).find('.apm-spjd-instancedetails-viewdetails-icon').attr('param-rowIndex', $(this).index());
//                    });
//                    rows.hover(
//                        function() {
//                            $(this).find('.apm-spjd-instancedetails-viewdetails-icon').addClass('showicon');
//                        },
//                        function() {
//                            $(this).find('.apm-spjd-instancedetails-viewdetails-icon').removeClass('showicon');
//                        }
//                    );
//                    rows.find('.apm-spjd-instancedetails-viewdetails-icon').click(function() {
//                        console.log('view frht details');
//                    });
                    if (APMSPJD.Highcharts) {
                        APMSPJD.Highcharts.renderInstanceDetailsChart(grid.options.data);
                    } 
                }
            }
    };
    var $DeploymentsGrid = $('<div class="apm-spjd-instancedetails-grid">').psgpGrid(deploymentsGridOptions);

    var $InstanceDetailsLegend = $(
            '<div class="apm-spjd-instancedetails-legend">' +
                '<div class="legend-container">' +
                    '<div class="legend-item">' +
                        '<div class="legend-icon scheduled wt">' +
                        '</div>' +
                        '<div class="legend-text">' +
                            APMTranslation.apm.spjd.label.scheduledwaittime() +
                        '</div>' + 
                    '</div>' +
                    '<div class="legend-item">' +
                        '<div class="legend-icon scheduled et">' +
                        '</div>' +
                        '<div class="legend-text">' +
                            APMTranslation.apm.spjd.label.scheduledexecutiontime() +
                        '</div>' + 
                    '</div>' +
                    '<div class="legend-item">' +
                        '<div class="legend-icon mapreduce wt">' +
                        '</div>' +
                        '<div class="legend-text">' +
                            APMTranslation.apm.spjd.label.mapreducewaittime() +
                        '</div>' + 
                    '</div>' +
                    '<div class="legend-item">' +
                        '<div class="legend-icon mapreduce et">' +
                        '</div>' +
                        '<div class="legend-text">' +
                            APMTranslation.apm.spjd.label.mapreduceexecutiontime() + 
                        '</div>' + 
                    '</div>' + 
                '</div>' +
            '</div>'
    )
    
    $InstanceDetailsPortlet.psgpPortlet('getBody')
        .css('overflow', 'auto')
        .append($DeploymentsGrid)
        .append('<div class="apm-spjd-instancedetails-chart"></div>')
        .append($InstanceDetailsLegend);
    
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
        $FilterPanel: $FilterPanel,
        $StartDateTimeFilter: $StartDateTimeFilter,
        $EndDateTimeFilter: $EndDateTimeFilter,
        $ScriptTypeFilter: $ScriptTypeFilter,
        $DeploymentFilter: $DeploymentFilter,
        $InstanceDetailsPortlet: $InstanceDetailsPortlet,
        $DeploymentsGrid: $DeploymentsGrid,
        updateDateTimeField: updateDateTimeField

    };

};
