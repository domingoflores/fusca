/**
 * © Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       25 Feb 2015     jyeh             Initial
 * 2.00
 * 3.00
 * 4.00
 * 5.00       13 Mar 2015     jmarimla         Reference new suitelets
 * 6.00       15 May 2015     jmarimla         Pass testmode parameter
 * 7.00       11 Aug 2015     jmarimla         Support for company filter
 * 8.00       28 Aug 2015     rwong            Added support for customer debugging.
 * 9.00       04 Sep 2015     rwong            Added Suitescripttime and Workflowtime
 * 10.00      19 May 2016     rwong            Added loading mask to the timeline chart
 * 11.00      29 Jun 2018     jmarimla         Translation readiness
 * 12.00      12 Apr 2019     jmarimla         Move profiler link
 * 13.00      11 Oct 2019     jmarimla         Search by operationid
 * 14.00      25 Oct 2019     jmarimla         Profiler error message
 * 15.00      14 Nov 2019     lemarcelo         Update the Profiler error message
 *
 */

function APMStores() {
	PSGP.APM.SIA.dataStores = {
		    isLoaded : function () {
		        var ready = true;
		        var requiredStores = [
		            'suiteScriptDetailData'
		        ];

		        for ( var i = 0; i < requiredStores.length; i++) {
		            if (!Ext4.StoreManager.get(requiredStores[i]).isLoaded) {
		                ready = false;
		            }
		        }

		        var restletReady = this.restletReady;
		        for (var key in restletReady) {
		            if (restletReady.hasOwnProperty(key) && (!restletReady[key])) {
		                ready = false;
		            }
		        }
		        return ready;
		    },

		    restletReady : {},
		    categories: {},
		    series : {},
		    params : {
                operationId: ''
            },
		    profilerParams : {
                operationId: ''
            },

		    suiteScriptDetailData :  Ext4.create('Ext4.data.Store', {
		        id : 'suiteScriptDetailData',
		        model : 'PSGP.APM.SIA.Model.suitescriptDetailData',
		        isLoaded : true,
		        remoteSort: false,
		        isSearched : false,
		        proxy : {
		            type : 'rest',
		            url : '/app/site/hosting/scriptlet.nl?script=customscript_apm_sia_sl_ssd&deploy=customdeploy_apm_sia_sl_ssd&testmode='+TEST_MODE,//+'&compfil='+COMP_FIL,
		            timeout : 180000,
		            reader : {
		                type : 'json',
		                root : 'data'
		            },
		            simpleSortMode : true
		        },
		        listeners : {
		            beforeload : function (store, operation, eOpts) {
		                //don't need to change this to true.
		                store.isLoaded = false;
		                store.proxy.extraParams = PSGP.APM.SIA.dataStores.params;
		                store.proxy.extraParams.compfil = COMP_FIL;
		            },
		            load : function (store, records, success, eOpts) {
		                store.isLoaded = true;
		                if (!success) {
		                    alert(APMTranslation.apm.common.alert.errorinsearch());
		                    Ext4.getCmp('psgp-apm-sia-grid-suitescriptdetail').setLoading(false);
		                    store.loadData({}, false);
		                    return false;
		                }
		                var response = store.proxy.reader.jsonData;
		            }
		        }
		    }),

		    callPerfInstanceChartRESTlet: function()
		    {
		        var params  = PSGP.APM.SIA.dataStores.params;
		        Ext4.Ajax.request({
		            url: '/app/site/hosting/scriptlet.nl?script=customscript_apm_sia_sl_chart&deploy=customdeploy_apm_sia_sl_chart&testmode='+TEST_MODE+'&compfil='+COMP_FIL,
		            timeout: 180000,
		            params: params,
		            method: 'GET',
		            success: function (response) {
		                var jsonResponse = Ext4.decode(response.responseText);
		                if (jsonResponse.data && jsonResponse.data.series && jsonResponse.data.series.length > 0)
                        {
                            Ext4.getCmp('psgp-apm-sia-suitescriptdetail-chart-nodata').hide();
                            Ext4.getCmp('psgp-apm-sia-timeline-chart').show();
                            Ext4.getCmp('psgp-apm-sia-display-summary-operationid').setValue(jsonResponse.operationId);
                            Ext4.getCmp('psgp-apm-sia-display-summary-page').setValue(jsonResponse.page);
                            Ext4.getCmp('psgp-apm-sia-display-summary-email').setValue(jsonResponse.email);
                            Ext4.getCmp('psgp-apm-sia-display-summary-time').setValue(jsonResponse.time);
                            Ext4.getCmp('psgp-apm-sia-display-summary-suitescripttime').setValue(jsonResponse.suitescripttime);
                            Ext4.getCmp('psgp-apm-sia-display-summary-workflowtime').setValue(jsonResponse.workflowtime);
                            PSGP.APM.SIA.dataStores.profilerParams.operationId = jsonResponse.operationId;
                            PSGP.APM.SIA.Highcharts.renderTimeline(jsonResponse.data);
                            Ext4.getCmp('psgp-apm-sia-subpanel-timeline').setLoading(false);
                        } else
                        {
                            //alert(APMTranslation.apm.common.alert.errorinsearch());
                            Ext4.getCmp('psgp-apm-sia-suitescriptdetail-chart-nodata').show();
                            Ext4.getCmp('psgp-apm-sia-timeline-chart').hide();
                            Ext4.getCmp('psgp-apm-sia-display-summary-operationid').setValue('-');
                            Ext4.getCmp('psgp-apm-sia-display-summary-page').setValue('-');
                            Ext4.getCmp('psgp-apm-sia-display-summary-email').setValue('-');
                            Ext4.getCmp('psgp-apm-sia-display-summary-time').setValue('-');
                            Ext4.getCmp('psgp-apm-sia-display-summary-suitescripttime').setValue('-');
                            Ext4.getCmp('psgp-apm-sia-display-summary-workflowtime').setValue('-');
                            PSGP.APM.SIA.dataStores.profilerParams.operationId = '';
                            Ext4.getCmp('psgp-apm-sia-subpanel-timeline').setLoading(false)
                        }
		            },
		            failure: function (response) {
		                console.log('callPerfChartRESTlet failed: '+ response.responseText);
		                alert(APMTranslation.apm.common.alert.errorinsearch());
		            }
		        });
		    },
            
            redirectToProfiler: function () {
                if (!PSGP.APM.SIA.dataStores.profilerParams.operationId) {
                    var doNotRedirect = 'You cannot load Profiler Details, because you have not entered a valid operation ID in the Search by Operation ID field. To close this message, click OK.';
                    alert(doNotRedirect);
                } else {
                    var dataParams = {
                            compfil : ((COMPID_MODE == 'T') && (COMP_FIL)) ? COMP_FIL : '',
                            operationId: PSGP.APM.SIA.dataStores.profilerParams.operationId
                    };

                    var paramString = Ext4.urlEncode(dataParams);
                    var PRF_URL = '/app/site/hosting/scriptlet.nl?script=customscript_apm_prf_sl_main&deploy=customdeploy_apm_prf_sl_main';
                    window.open(PRF_URL + '&' + paramString);
                }
            }
		};
}
