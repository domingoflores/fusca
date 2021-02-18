/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       14 May 2014     maquino          Initial version
 * 2.00       15 May 2014     maquino          Updated scheduledScriptData model to match restlet
 * 3.00       16 May 2014     jmarimla         Added scriptURL and deploymentURL to model; changed duration data type to int
 * 4.00       19 May 2014     maquino          Added scriptCountData model
 * 5.00       20 May 2014     jmarimla         Added utilizationData model
 * 6.00       19 Jun 2014     jmarimla         Added startTS and endTS to grid model
 * 7.00       08 Aug 2014     rwong            Added waitTime to the scheduledScriptData model, added copyright info
 * 8.00       13 Aug 2014     jmarimla         Added aggregatedGridData model; removed scheduledscriptdata model
 * 9.00       15 Aug 2014     jmarimla         Changed ave waittime, ave duration, utilization to float
 * 10.00      26 Aug 2014     rwong            Added complete, processing, pending, retry fields to the grid model.
 * 11.00      27 Aug 2014     jmarimla         added new model, schedScriptInstances
 *
 */

Ext4.define('PSGP.SQM.Model.scriptCountData', {
    extend : 'Ext4.data.Model',
    fields : [
              {
                  name : 'id',
                  type : 'int'
              }, {
                  name : 'queue',
                  type : 'int'
              }, {
                  name : 'total',
                  type : 'int'
              }, {
                  name : 'complete',
                  type : 'int'
              }, {
                  name : 'pending',
                  type : 'int'
              }, {
                  name : 'processing',
                  type : 'int'
              }, {
                  name : 'failed',
                  type : 'int'
              }, {
                  name : 'retry',
                  type : 'int'
              }
              ]
});

Ext4.define('PSGP.SQM.Model.utilizationData', {
    extend : 'Ext4.data.Model',
    fields : [
              {
                  name : 'queue',
                  type : 'int'
              }, {
                  name : 'totalRuntime',
                  type : 'int'
              }, {
                  name : 'scriptCount',
                  type : 'int'
              }, {
                  name : 'utilPercent',
                  type : 'string'
              }
              ]
});

Ext4.define('PSGP.SQM.Model.aggregatedGridData', {
    extend : 'Ext4.data.Model',
    fields : [
              {
                  name : 'id',
                  type : 'int'
              }, {
                  name : 'deploymentId',
                  type : 'int'
              }, {
                  name : 'deploymentName',
                  type : 'string'
              }, {
                  name : 'scriptName',
                  type : 'string'
              }, {
                  name : 'queue',
                  type : 'int'
              }, {
                  name : 'scriptInstances',
                  type : 'int'
              }, {
                  name : 'complete',
                  type : 'int'
              }, {
                  name : 'processing',
                  type : 'int'
              }, {
                  name : 'pending',
                  type : 'int'
              }, {
                  name : 'retry',
                  type : 'int'
              }, {
                  name : 'failed',
                  type : 'int'
              }, {
                  name : 'totalDuration',
                  type : 'int'
              }, {
                  name : 'totalWaitTime',
                  type : 'int'
              }, {
                  name : 'aveDuration',
                  type : 'float'
              }, {
                  name : 'aveWaitTime',
                  type : 'float'
              }, {
                  name : 'utilization',
                  type : 'float'
              }, {
                  name : 'scriptURL',
                  type : 'string'
              }, {
                  name : 'deploymentURL',
                  type : 'string'
              }
      ]
});

Ext4.define('PSGP.SQM.Model.SchedScriptInstances', {
    extend : 'Ext4.data.Model',
    fields : [
        {
            name : 'id',
            type : 'int'
        }, {
            name : 'dateCreated',
            type : 'string'
        }, {
            name : 'startDate',
            type : 'string'
        }, {
            name : 'endDate',
            type : 'string'
        }, {
            name : 'status',
            type : 'string'
        }, {
            name : 'percentComplete',
            type : 'float'
        }, {
            name : 'duration',
            type : 'int'
        }, {
            name : 'waitTime',
            type : 'int'
        }
    ]
});