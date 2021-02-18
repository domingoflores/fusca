/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Feb 2018     jmarimla         Initial
 * 2.00       22 Feb 2018     jmarimla         Drilldown
 * 3.00       03 Apr 2018     jmarimla         Modify grid
 * 4.00       04 Apr 2018     jmarimla         Labels
 * 5.00       05 May 2018     jmarimla         Status column
 * 6.00       24 May 2018     jmarimla         Append LIMITEXCEEDED
 * 7.00       07 Jun 2018     jmarimla         Hide back button
 * 8.00       11 Jun 2018     jmarimla         Translation engine
 * 9.00       02 Jul 2018	  justaris         Translation Readiness
 * 10.00      27 Nov 2018     jmarimla         CSV export
 * 11.00      15 Jan 2019     jmarimla         Translation
 * 
 */

APMCD = APMCD || {};

APMCD._Components = function() {

    var $TitleBar = $('<div>').psgpSuiteletTitle({
        title: APMTranslation.apm.cd.label.concurrencydetails()
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

    var $ConcurrencyDetailsPortlet = $('<div>').psgpPortlet({
        title: APMTranslation.apm.cd.label.detailedconcurrency()
    });
    
    $ConcurrencyMainDiv = $('<div class="apm-cd-exactconcurrency-main"></div>');
    
    var $BtnDrillUp = $('<div class="apm-cd-btn-drillup"></div>').psgpGrayButton({
        text: APMTranslation.apm.cd.button.back(),
        handler: function () {
            APMCD.Services.refreshData();
        }
    }).hide();
    
    $ConcurrencyMainDiv
        .append($BtnDrillUp)
        .append('<div class="apm-cd-exactconcurrency panel-1"></div>')
        .append('<div class="apm-cd-exactconcurrency panel-2"></div>');
    
    $ConcurrencyDetailsPortlet.psgpPortlet('getBody')
        .append($ConcurrencyMainDiv);
    
    function showInstancesPopup(params) {
        var $obj;

        var markUp = '' +
            '<div class="apm-cd-popup-instances">' +
                '<div class="grid">' +
                '</div>' +
            '</div>';
        $obj = $(markUp);

        var gridOptions = {
                url: APMCD.Services.getURL('instances'),
                sort: {
                    dataIndex: 'startDate',
                    dir: false,
                    remote: true
                },
                paging: {
                    pageLimit: 10
                },
                exportCSV: true,
                columns: [{
                    dataIndex: 'startDate',
                    width: '15%',
                    text: APMTranslation.apm.common.label.startdate()
                }, {
                    dataIndex: 'endDate',
                    width: '15%',
                    text: APMTranslation.apm.common.label.enddate()
                }, {
                    dataIndex: 'type',
                    text: APMTranslation.apm.common.label.type(),
					renderer: function (value, record) {
                        if(value == "WEBSERVICE"){
						return value = APMTranslation.apm.common.label.webservice().toUpperCase();
						}
						if(value == "RESTLET"){
						return value = APMTranslation.apm.common.label.restlet().toUpperCase();
						}
						else{
						return value;
						}
                    }
                }, {
                    dataIndex: 'integration',
                    text: APMTranslation.apm.common.label.integration(),
                    sortable: false,
                    renderer: function (value, record) {
                        return (value) ? value : '-';
                    }
                }, {
                    dataIndex: 'operation',
                    text: APMTranslation.apm.common.label.operation(),
                    renderer: function (value, record) {
                        return (value) ? value : '-';
                    }
                }, {
                    dataIndex: 'scriptName',
                    text: APMTranslation.apm.common.label.scriptname(),
                    sortable: false,
                    renderer: function (value, record) {
                        return (value) ? value : '-';
                    }
                }, {
                    dataIndex: 'status',
                    width: '20%',
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
                        if (record.wouldBeRejected && value != 'REJECTEDACCOUNTCONCURRENCY' && value != 'REJECTEDUSERCONCURRENCY' ) {
                            return translated + '-LIMITEXCEEDED';
                        }
                        return translated;
                    }
                }]
            };

        $obj.psgpDialog({
            title: APMTranslation.apm.cd.label.instancedetails(),
            width: 1000
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
        $TitleBar: $TitleBar,
        $ColumnPanel: $ColumnPanel,
        $ConcurrencyDetailsPortlet: $ConcurrencyDetailsPortlet,
        
        showInstancesPopup: showInstancesPopup
    };

 };