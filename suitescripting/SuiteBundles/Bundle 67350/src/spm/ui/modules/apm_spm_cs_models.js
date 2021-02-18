/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       25 Sep 2014     jmarimla         Initial
 * 2.00       01 Oct 2014     jmarimla         Added totaltime in endToEndTimeData
 * 3.00       03 Oct 2014     rwong            Change the fields of suitescriptDetailData
 * 4.00       05 Nov 2014     rwong            Remove script deployment from suitescriptDetailData model.
 * 5.00       19 Nov 2014     jmarimla         Added summary grid model
 * 6.00       26 Nov 2014     rwong            Added new field to store color of each record.
 ****************************************************************************************************************
 * 1.00       23 Feb 2015     jmarimla         Porting to APM
 * 2.00       01 Apr 2015     rwong            Added workflowtime field
 * 3.00       29 Apr 2015     jmarimla         Added scripttype and triggertype
 * 4.00       19 Jun 2015     rwong            Added scriptwfurl to the suitescriptdetaildata model
 * 5.00       03 Jul 2015     rwong            Added role field to endtoendtimedata
 * 6.00       05 Aug 2015     rwong            Removed role field from endtoendtimedata
 * 7.00       29 Jun 2018     jmarimla         Translation readiness
 * 8.00       18 Oct 2018     jmarimla         Operation id
 *
 */

function APMModels() {
	Ext4.define('PSGP.APM.SPM.Model.endToEndTimeData', {
	    extend : 'Ext4.data.Model',
	    fields : [
	              {
	                  name : 'id',
	                  type : 'int'
	              }, {
	                  name : 'date',
	                  type : 'string'
	              }, {
	                  name : 'email',
	                  type : 'string'
	              },
//	              {
//	                  name : 'role',
//	                  type : 'int'
//	              },
	              {
	                  name : 'clienttime',
	                  type : 'float'
	              }, {
	                  name : 'networktime',
	                  type : 'float'
	              }, {
	                  name : 'suitescripttime',
	                  type : 'float'
	              }, {
	                  name : 'workflowtime',
	                  type : 'float'
	              }, {
	                  name : 'servertime',
	                  type : 'float'
	              },  {
	                  name : 'totaltime',
	                  type : 'float'
	              }, {
	                  name : 'id2',
	                  type : 'int'
	              }, {
	                  name : 'operationId',
	                  type : 'string'
	              }, {
	                  name : 'operationId2',
	                  type : 'string'
	              }
	     ]
	});

	Ext4.define('PSGP.APM.SPM.Model.suitescriptDetailData', {
	    extend : 'Ext4.data.Model',
	    fields : [
	              {
	                  name : 'threadid',
	                  type : 'int'
	              }, {
	                  name : 'totaltime',
	                  type : 'float'
	              }, {
	                  name : 'script',
	                  type : 'string'
	              }, {
	                  name : 'bundle',
	                  type : 'string'
	              }, {
	                  name : 'color',
	                  type : 'string'
	              }, {
	                  name : 'scripttype',
	                  type : 'string'
	              }, {
	                  name : 'triggertype',
	                  type : 'string'
	              }, {
	                  name : 'scriptwfurl',
	                  type : 'string'
	              }
	     ]
	});

	Ext4.define('PSGP.APM.SPM.Model.summaryAggregationGrid', {
	    extend : 'Ext4.data.Model',
	    fields : [
	              {
	                  name : 'id',
	                  type : 'string'
	              }, {
	                  name : 'name',
	                  type : 'string'
	              }, {
	                  name : 'clienttime',
	                  type : 'float'
	              }, {
	                  name : 'networktime',
	                  type : 'float'
	              }, {
	                  name : 'suitescripttime',
	                  type : 'float'
	              }, {
	                  name : 'workflowtime',
	                  type : 'float'
	              }, {
	                  name : 'servertime',
	                  type : 'float'
	              }, {
	                  name : 'totaltime',
	                  type : 'float'
	              }
	     ]
	});
}