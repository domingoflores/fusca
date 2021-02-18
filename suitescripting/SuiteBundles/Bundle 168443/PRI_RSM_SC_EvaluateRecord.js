//------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_SC_EvaluateRecord.js
//Description:	Prolecto Record State Manager: Scheduled Script which evaluates records while it has governor capacity to do so 
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

define(['N/record', 'N/runtime', 'N/task', './PRI_RSM_Engine','./PRI_RSM_Constants','/.bundle/132118/PRI_QM_Engine'],
		
	function(record,runtime,task,rsmEngine,rsmConstants,qmEngine) {

		function execute(context) {

			var funcName = "PRI_RSM_SC_EvaluateRecord.execute";

			var MIN_USAGE_THRESHOLD = 1000;
            
            try {
            	
            	var allDone = false;
            	
                log.debug(funcName, "*** STARTING ***");
            	
            	do {
                	var obj = qmEngine.getNextQueueEntry(rsmConstants.QUEUE_NAME);
                	
    				if (obj !== null && typeof obj === 'object') {
    					
    					log.debug(funcName, "Processing next record: " + JSON.stringify(obj));
    					
    					var parms = JSON.parse(obj.parms);

    					try {
        					var REC = record.load({type: parms.recType, id: parms.recId});
        					
        					var rsm = rsmEngine.createRecordStateManager(REC);      
        					rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.ALL_RULES);

        					qmEngine.markQueueEntryComplete(obj.id);    						
    					} catch (e1) {
    						if (e1.name == "RCRD_DSNT_EXIST") {
            					qmEngine.markQueueEntryComplete(obj.id, "Record no longer exists, and this entry was abandoned.");    						    							
    						} else {
    							log.error(funcName, e1);
    							qmEngine.abandonQueueEntry(obj.id, null, "ERROR: " + JSON.stringify(e1))    							
    						}
    					}
    					
    					if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
    						log.debug(funcName, "Running out of resources and attempting to reschedule");
    						rescheduleScript();     						
    						allDone = true;
    					}
    					
    				} else
    					allDone = true;
    				            		
            	} while (!allDone);

            	log.debug(funcName, "Exiting");

            } catch (e) {
                log.error(funcName, e);
            }
            
            log.debug(funcName, "*** EXITING ***");
        }

		// ================================================================================================================================

		function rescheduleScript() {
			try {
				var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});
				scriptTask.scriptId = "customscript_pri_rsm_sc_evaluate_record"; 
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