//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(["N/record", "N/task", "N/runtime", "N/search"
        , "/.bundle/132118/PRI_ServerLibrary"
        , "/.bundle/132118/PRI_QM_Engine"
        ,"/.bundle/132118/PRI_AS_Engine"
        ,"/SuiteScripts/Pristine/libraries/toolsLibraryClient.js"
        ,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
        ],
		

	function(record, task, runtime, search
			, priLibrary
			, qmEngine
			, appSettings
			, toolsClient
			, srsConstants) {

		"use strict";

		var scriptName = "SRS_UE_EscrowType.";
		
		function userIsAuthorizedToEditAudience() 
		{	
			return toolsClient.checkPermission({appName: srsConstants.SRS_GENERAL_APP_NAME, settingName: "Update Account Audience Permission"}); 
		}
		function beforeSubmit(context) 
		{
			var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + JSON.stringify(runtime.executionContext) + " by user: " + runtime.getCurrentUser().roleId ;
	    	log.debug("beforeSubmit " , funcName);
			 
			 //	         context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
//			 log.audit("new record ", JSON.stringify(context.newRecord));
//			 log.audit("old record ", JSON.stringify(context.oldRecord));
//			 log.audit("fieldchanged ", (priLibrary.fieldChanged(context, "custrecord_et_audience")));
//			 log.audit("multiSelecthasChanged ", toolsClient.multiSelecthasChanged(context, "custrecord_et_audience"))

			 if (context.type == context.UserEventType.EDIT 
		 			|| context.type == context.UserEventType.CREATE 
		 			|| context.type == context.UserEventType.XEDIT) 
			 {  
				 if (!userIsAuthorizedToEditAudience())
				 {
					 if (toolsClient.multiSelecthasChanged(context, "custrecord_et_audience"))
		    		 {
						 throw "You are not authorized to set Audience"; 	
		    		 }
				 }
			 }

		}
		
		function afterSubmit(context) {
			var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + JSON.stringify(runtime.executionContext);
	    	log.debug("afterSubmit " , funcName);
			var REC = context.newRecord;
			if (context.type != context.UserEventType.DELETE) 
			{
				if (toolsClient.multiSelecthasChanged(context, "custrecord_et_audience"))
    			{
					if (!userIsAuthorizedToEditAudience())
					{
						return; 
					}
					log.debug("custrecord_et_audience changed ");
					var parentAccounts = JSON.parse(appSettings.readAppSetting("General Settings", "Escrow Type Audience Parent Accounts"));
					var parentAccountsArray = parentAccounts["accounts_"+runtime.accountId];
//					{
//						"accounts_772390_SB3": ["12999","19168"],
//						"accounts_772390_SB1": ["12999","17235"],
//						"accounts_772390": ["12999","24975"],
//						"useMapReduce":false
//						}
					
					log.debug ("parentAccounts.useMapReduce " , parentAccounts.useMapReduce);
			 		
					if (parentAccounts.useMapReduce)
	        		{
						log.debug("Using Map Reduce ");
						
						var audience = REC.getValue({
				            fieldId: "custrecord_et_audience"
				        });
						var objRequest = { escrowTypeId: REC.id ,audienceArr: audience};
						var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
						mapReduceTask.scriptId     = "customscript_utility_functions_mr";
						mapReduceTask.params       = { "custscript_mr_uf_json_object"       : JSON.stringify(objRequest)
													  ,"custscript_mr_uf_function"          : "updateAccountAudienceBasedonEscrowTypeAudience"
													  ,"custscript_mr_uf_callingscript"     : scriptName
													  ,"custscript_mr_uf_record_type"       : record.Type.ACCOUNT
								                     };
						log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
						var mapReduceTaskId = mapReduceTask.submit();
	        		}
	        		else 
	        		{
	        			log.debug("using Queue Manager ");
	        			
	        			var qm_json = {};
	    				qm_json.currentindex = 0;
	    				qm_json.audience = REC.getValue({
				            fieldId: "custrecord_et_audience"
				        });
	    				qm_json.accountsToUpdate = null;
	    				
	    				qm_json.escrowTypeId = REC.id;
	    				qm_json.parentAccounts = parentAccountsArray;
	    				log.debug("addQueueEntry parameters ", JSON.stringify(qm_json));
		        		qmEngine.addQueueEntry(srsConstants.QUEUE_NAMES.UPDATE_ACCOUNT_AUDIENCE, qm_json, null, true, srsConstants.SCRIPT_NAMES.UPDATE_ACCOUNT_AUDIENCES_QM_SCRIPT);

	        		}
    			}
			}
		}
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    		return {
    			beforeSubmit:	beforeSubmit,
    			afterSubmit:	afterSubmit
    		}
});

