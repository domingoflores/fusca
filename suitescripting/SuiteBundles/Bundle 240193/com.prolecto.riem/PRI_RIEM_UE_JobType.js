//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		Performs validationetc., on the Job Type record
 * 
 */

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/url', 'N/format', 'N/file', 'N/ui/serverWidget','./PRI_RIEM_Common'],
				
		function(record, search, runtime, error, url, format, file, serverWidget, riemCommon) {
	
			var scriptName = "PRI_RIEM_UE_JobType.";

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

		    	var REC = context.newRecord;

		    	
				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.VIEW) {
					if (REC.getValue("custrecord_pri_riem_jobt_folder_id")) {
						var fld = REC.getField("custrecord_pri_riem_jobt_folder_id");
						fld.label = "99";
                      log.debug(funcName, "setting field");
					}
					
				}     					
    					
			}
			
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		return {
			beforeLoad: beforeLoad,
//			beforeSubmit: beforeSubmit,
//			afterSubmit: afterSubmit
			
		}
});

