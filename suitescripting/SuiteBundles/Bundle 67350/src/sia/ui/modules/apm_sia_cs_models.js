/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       23 Feb 2015     jyeh             Initial
 * 2.00       29 Jun 2018     jmarimla         Translation readiness
 * 3.00       18 Oct 2018     jmarimla         Frht id
 * 4.00       17 Jul 2019     erepollo         Converted to linux EOL
 * 5.00       17 Jul 2019     erepollo         Added script name in customer debug
 * 6.00       08 Aug 2019     erepollo         Changed deployment types
 * 7.00       14 Aug 2019     erepollo         Added fields for sorting script/workflow and deployment names
 *
 */

function APMModels() {
	Ext4.define('PSGP.APM.SIA.Model.suitescriptDetailData', {
	    extend : 'Ext4.data.Model',
	    fields : [
	        {
	            name : 'date',
	            type : 'string'
	        }, {
	            name : 'scripttype',
	            type : 'string'
	        }, {
	            name : 'script',
	            type : 'string'
	        }, {
	            name : 'triggertype',
	            type : 'string'
	        }, {
	            name : 'scriptid',
	            type : 'string'
	        }, {
	            name : 'deployment',
	            type : 'string',
	            useNull : true
	        }, {
	            name : 'totaltime',
	            type : 'float'
	        },  {
	            name : 'usagecount',
	            type : 'int'
	        },  {
	            name : 'records',
	            type : 'int'
	        }, {
	            name : 'urlrequests',
	            type : 'int'
	        }, {
	            name : 'searches',
	            type : 'int'
	        }, {
	            name : 'threadid',
	            type : 'int'
	        }, {
	            name : 'id',
	            type : 'string'
	        }, {
	            name : 'ssaend',
	            type : 'string'
	        }, {
	            name : 'ssastart',
	            type : 'string'
	        }, {
	            name : 'scriptwfurl',
	            type : 'string'
	        }, {
	            name : 'deploymenturl',
	            type : 'string'
	        }, {
	            name : 'operationId',
	            type : 'string'
	        }, {
	            name : 'frhtId',
	            type : 'string'
	        }, {
                name : 'customscriptid',
                type : 'string'
	        }, {
                name : 'scriptName',
                type : 'string'
            }, {
                name : 'deploymentName',
                type : 'string'
            }, {
                name : 'deploymentId',
                type : 'string'
            }, {
                name : 'customDeploymentId',
                type : 'string'
            }
	    ]
	});
}
