/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       15 Jan 2015     jmarimla         Initial
 * 2.00       21 Mar 2015     jmarimla         Changed to median, added baseline fields
 * 3.00       23 Jul 2015     jmarimla         Added record name
 * 4.00       05 Nov 2015     jmarimla         Added model for personalize panel
 * 5.00       29 Jun 2018     jmarimla         Translation readiness
 * 
 */

function APMModels () {
    Ext4.define('PSGP.APM.DB.Model.recordTilesData', {
        extend : 'Ext4.data.Model',
        fields : [
                  {
                      name : 'id',
                      type : 'int'
                  }, {
                      name : 'record',
                      type : 'string'
                  }, {
                      name : 'oper',
                      type : 'string'
                  }, {
                      name : 'totaltimeMed',
                      type : 'float'
                  }, {
                      name : 'usersTotal',
                      type : 'float'
                  }, {
                      name : 'logsTotal',
                      type : 'float'
                  }, {
                      name : 'baselineMed',
                      type : 'float'
                  }, {
                      name : 'baselineMedPercent',
                      type : 'float'
                  }, {
                      name: 'totaltimeData',
                      type: 'string'
                  }, {
                      name: 'recordName',
                      type: 'string'
                  }
         ]
    });

    Ext4.define('PSGP.APM.DB.Model.personalizePanel', {
        extend: 'Ext4.data.Model',
        fields: [
            {
                name : 'id',
                type : 'string'
            },{
                name : 'cardId',
                type : 'string',
            },{
                name : 'buttonIcon',
                type : 'string',
            },{
                name : 'buttonText',
                type : 'string'
            },{
                name : 'show',
                type : 'boolean'
            },
        ]
    });
}