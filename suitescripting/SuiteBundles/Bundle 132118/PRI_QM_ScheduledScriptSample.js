/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 * @NModuleScope Public
 */

 //-----------------------------------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------------------------------------------------
//Description:	An example script for processing queue entries using the Prolecto Queue Manager
//Developer: 	Boban
//Date: 		Feb 2017
//Comments:		Other scripts "write" entries to the queue using this sample syntax:
//					qmEngine.addQueueEntry("Sample", {recType: REC.type, recId: REC.id}, null, true);
//					parameters:
//						1:	the queue name to write to
//						2:  the "parameters" (which come back in the 'parms' field)
//						3:  the date/time for "delayed" execution; if specified, the queue entry won't get processed before then; if null, defaults to "now"
//						4:  avoid duplicates flag: if TRUE, and there is already a queue entry that has not yet been processed, and has the same queue name and parameters, then this entry will be marked 'complete' immediately
//				
//------------------------------------------------------------------------------------------------------------------------------------

define(['N/search', 'N/record', 'N/runtime','N/task','/.bundle/132118/PRI_QM_Engine'  ],
    function(search, record, runtime, task, qmEngine) {

		var scriptName = "PRI_QM_ScheduledScriptSample.";

		function execute(context) {
        
			var funcName = scriptName + "execute";
			            
        	var MIN_USAGE_THRESHOLD = 500;						// when governance usage falls below this threshold, script will terminate and attempt to reschedule
        	var QUEUE_NAME = "Sample";							// the name of the queue
        	var SCRIPT_ID = "customscript_pri_qm_example";		// id for this script
        	
        	log.debug(funcName, "Starting");
        	
        	var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
        	
        	while (qEntry !== null && typeof qEntry === 'object') {
				try {

					var parms = qEntry.parms;

					// parms may either be a simple string, or a JSON string, depending on usage; if necessary, JSON.parse() the contents
					

					// 
					// do the work here
					//
					
					// 
					// if the row CAN'T be completed, (eg you run out of resources), then call
					//		qmEngine.markQueueEntryIncomplete(qEntry.id, parms, "any note")
					//	otherwise
					//		qmEngine.markQueueEntryComplete(qEntry.id)

					
					qmEngine.markQueueEntryComplete(qEntry.id);	                    	

				} catch (e) {
					// couldn't complete it, so update the status and let it try again
					log.error(funcName, e);
					qmEngine.abandonQueueEntry(qEntry.id, qEntry.parms, "ERROR: " + e.message);
				}
									
				if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
					log.debug(funcName, "Running out of resources and attempting to reschedule");

					// this code is optional; it will attempt to re-schedule itself; or you can rely on NS if you have your script already scheduled to run every xx minutes
					try {
						var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});
						scriptTask.scriptId = SCRIPT_ID;
						var scriptTaskId = scriptTask.submit();
						log.debug(funcName, "Script rescheduled");
					} catch (e1) {
						log.error(funcName, "Failed to reschedule script: " + e1.message);
					}
					
					return;
				}

	        	var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);				
        	}        	
        
        	log.debug(funcName, "Finishing");

        }
		
        return {
            execute: execute
        };
    }
);