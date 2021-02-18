/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Nov 2014     rwong            Initial
 * 2.00       21 Nov 2014     rwong            Added new fields in the model
 * 3.00       02 Dec 2014     jmarimla         Added model for performance chart
 * 4.00       02 Feb 2015     jmarimla         Removed instruction count from suitescriptDetailData
 * ********************************************************************************
 * 1.00       20 Feb 2015     rwong            Ported SPM to APM
 * 2.00       07 Apr 2015     rwong            Added support for urlrequests, searches, and records.
 * 3.00       05 Aug 2016     jmarimla         Support for suitescript context
 * 4.00       29 Jun 2018     jmarimla         Translation readiness
 * 5.00       18 Oct 2018     jmarimla         Frht id
 * 6.00       13 Nov 2019     lemarcelo        Added support for Error Code
 *
 */

function APMModels() {
    Ext4.define('PSGP.APM.SSA.Model.suiteScriptDetailData', {
        extend : 'Ext4.data.Model',
        fields : [
                  {
                      name : 'date',
                      type : 'string'
                  }, {
                      name : 'entityid',
                      type : 'int'
                  },{
                      name : 'entityname',
                      type : 'string'
                  },{
                      name : 'email',
                      type : 'string'
                  }, {
                      name : 'role',
                      type : 'string'
                  }, {
                      name : 'recordid',
                      type : 'string'
                  }, {
                      name : 'totaltime',
                      type : 'float'
                  }, {
                      name : 'usagecount',
                      type : 'int'
                  }, {
                      name : 'urlrequests',
                      type : 'int'
                  }, {
                      name : 'searches',
                      type : 'int'
                  }, {
                      name : 'records',
                      type : 'int'
                  }, {
                      name : 'errorcode',
                      type : 'string'
                  }, {
                      name: 'context',
                      type: 'string'
                  }, {
                      name: 'operationId',
                      type: 'string'
                  }, {
                      name: 'frhtId',
                      type: 'string'
                  }
         ]
    });

    Ext4.define('PSGP.APM.SSA.Model.perfChartData', {
        extend : 'Ext4.data.Model',
        fields : [
                  {
                      name : 'dateTS',
                      type : 'string',
                  },{
                      name : 'dateObj',
                      type : 'date'
                  },{
                      name : 'totaltimeAve',
                      type : 'float'
                  },{
                      name : 'usagecountAve',
                      type : 'float'
                  },{
                      name : 'logsTotal',
                      type : 'int'
                  },{
                      name : 'totaltimeAveAll',
                      type : 'float',
                      defaultValue : 0
                  },{
                      name : 'totaltimeMedAll',
                      type : 'float',
                      defaultValue : 0
                  },{
                      name : 'totaltime90PAll',
                      type : 'float',
                      defaultValue : 0
                  }
         ]
    });
}