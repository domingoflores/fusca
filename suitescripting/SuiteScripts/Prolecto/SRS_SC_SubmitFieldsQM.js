//------------------------------------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//------------------------------------------------------------------------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */

/*
 * 
 * Uses QM to perform "submitfields" operations
 * 
 * 
 */

define(['N/search', 'N/record', 'N/runtime', 'N/email', 'N/task', '/.bundle/132118/PRI_QM_Engine'],
    function(search, record, runtime, email, task, qmEngine) {

		"use strict";

		var scriptName = "SRS_SC_SubmitFieldsQM.";

    	const MIN_USAGE_THRESHOLD = 100;
    	
    	const QUEUE_NAME = "SubmitFields"; 
    	const SCRIPT_ID = "customscript_srs_sc_submitfields_qm"; 
    	
    		
		function execute(context) {
        
			var funcName = scriptName + "execute";
			                    	
        	do {
            	var obj = qmEngine.getNextQueueEntry(QUEUE_NAME);
            	
				if (obj !== null && typeof obj === 'object') {
					
					try {

						var submitFieldsObj = JSON.parse(obj.parms); 
						
						log.debug(funcName, submitFieldsObj); 
						
						record.submitFields(submitFieldsObj); 
						
						qmEngine.markQueueEntryComplete(obj.id, "");	                    	
						
					} catch (e) {
						log.error(funcName, e);
						qmEngine.abandonQueueEntry(obj.id, null, "ERROR: " + e.message);						
					}
								
					if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
						log.debug(funcName, "Running out of resources and attempting to reschedule");
						rescheduleScript(); 						
						return;
					}

					
				} else	// we didn't get anything back from the queue
					return;
				            		
	    	} while (true);

            	
        	log.debug(funcName, "*** EXITING ***");
        	
        }
	
		// ================================================================================================================================

		function rescheduleScript() {
			// this code is optional; it will attempt to re-schedule itself; or you can rely on NS if you have your script already scheduled to run every xx minutes
			try {
				var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});
				scriptTask.scriptId = SCRIPT_ID; 
				var scriptTaskId = scriptTask.submit();
				log.audit(funcName, "Script rescheduled");
			} catch (e1) {
				log.error(funcName, "Failed to reschedule script: " + e1.message);
			}
		}
		
		// ================================================================================================================================

		
        return {
            execute: execute
        };
    }
);