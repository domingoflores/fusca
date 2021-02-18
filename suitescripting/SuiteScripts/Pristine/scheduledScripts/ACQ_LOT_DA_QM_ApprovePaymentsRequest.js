/**
*@NApiVersion 2.x
*@NScriptType ScheduledScript
* @NModuleScope Public
*/
//-----------------------------------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------
//Description:    A scheduled script that uses the Prolecto Queue Manager for processing Exchange Records
//Developer:      Alex Fodor 
//Date:           October 2018
//------------------------------------------------------------------------------------------------------------------------------------
define(['N/search', 'N/record', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/xml', '/.bundle/132118/PRI_QM_Engine' 
	   ],

    function(search, record, runtime, task, format, file, xml, qmEngine) {

        var scriptName = "ACQ_LOT_DA_QM_ApprovePaymentsRequest.js";
        var ShipConStatusRcd;
        var ItemsCount;
        var objParms;
        var status;
        var PROCESSSATUS = {NOTSUPPLIED: 'NOTSUPPLIED', QUEUED: 'QUEUED', PROCESSING: 'PROCESSING', SUCCESS: 'SUCCESS', FAILED: 'FAILED', DUPLICATE: 'DUPLICATE', REAPPROVE: 'REAPPROVE'};
        
        function execute(context) {

    	    var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
    	    var NewRemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            var funcName = scriptName;
            var MIN_USAGE_THRESHOLD = 600;// when governance usage falls below this threshold, script will terminate and attempt to reschedule
            var QUEUE_NAME = "ApprovePaymentsRequest";
            var SCRIPT_ID = "customscript_acq_lot_da_qm_aprv_pmt_rqst";        // id for this script
            log.debug(funcName, "=== Starting =====================================================");
            log.debug(funcName, "==================================================================");
            // Get Queue Manager entry to be processed
            var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
            var thisScript = runtime.getCurrentScript();

            // Loop to process Queue Manager entries 
            while (qEntry !== null && typeof qEntry === 'object') { 
                var qEntryAsString = JSON.stringify(qEntry);
                funcName = "ApprovePaymentsRequest Q=" + qEntry.id
            	
                try {
                    objParms = JSON.parse(qEntry.parms);
                    
                    // ATO-149 Prod support
            		var nbrMinutes = Math.ceil(objParms.exchangeRecordList.length / 2.5);
            		if (nbrMinutes < 4) { nbrMinutes = 4; }
            		var nextAttempt = new Date();
            		var nbrMillisecs = nextAttempt.getTime() + ( nbrMinutes * 60 * 1000); //Add nbr of minutes to current datetime in milliseconds
            		nextAttempt.setTime(nbrMillisecs); // Update datetime variable using new milliseconds value
            		try {
            			record.submitFields({ type:'customrecord_pri_qm_queue' ,id:qEntry.id ,values:{ custrecord_pri_qm_next_attempt:nextAttempt } });
            		}
            		catch(e0) { log.error(funcName, "QEntry " + qEntry.id + " Error updating nextAttempt on qEntry:" + e0.message ); }
                    // end ATO-149 
                   
                    var Complete = true;
                    log.debug(funcName, "startingIndex:" + objParms.startingIndex);
        	        var ctr = 0;
    				
        	        // Trigger the Map/Reduce script 
        	        try {
            			var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
            			mapReduceTask.scriptId     = 'customscript_acq_lot_da_mr_proc_pymt';
            			objParms["requestQueueId"] = qEntry.id;
            			mapReduceTask.params       = { 'custscript_mr_acq_obj_parms' : JSON.stringify(objParms)
            					                     };
            			log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
            			var mapReduceTaskId = mapReduceTask.submit();
        	        }
        	        catch(eTrigger) {
        	        	Complete = false;
        	        }

        	        
                    if (Complete) { // if this Queue Manager entry is completed tell QM to mark it complete
            			qmEngine.markQueueEntryComplete(qEntry.id); 
                    	log.debug(scriptName, "Complete");              
                    } 
                    else {
                    	// The Queue Entry is not complete, we have run out of usage for this instance of the script
                    	// Tell QM to mark the entry as incomplete
                    	log.debug(scriptName, "Rescheduling    objParms.startingIndex:" + objParms.startingIndex);   
            			var objParmsAsString = JSON.stringify(objParms);
            			qmEngine.markQueueEntryIncomplete(qEntry.id, objParmsAsString, "Rescheduled due to governance");
                    	
            			// Reschedule the script to run immediately so processing can continue
            			try {
                    		var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});                                   
                    		scriptTask.scriptId = SCRIPT_ID;                                   
                    		var scriptTaskId = scriptTask.submit();                                 
            			}
            			// If reschedule fails it is likely that there is not an available deployment, they are all running
            			// Not a problem as one of those that are running will pick up this entry when it 
            			// has finished with the one it is working on
            			catch(e0) { log.error(funcName, "Failed to reschedule script: " + e0.message); }
            			
                    	return;
                    }
                    
                } catch (e) {
                    // Got an error, couldn't complete it, so update the status
                	// In this case we will tell Queue Manager to abandon this Queue Entry
                	// If it is possible the error is of temporary nature we could just mark it incomplete
                	// and allow Queue Manager to try this Queue Entry again
                	log.error(funcName, e);                      
                	var objParmsAsString = JSON.stringify(objParms);
                	qmEngine.abandonQueueEntry(qEntry.id, objParmsAsString, "ERROR: " + e.message);
                }   // End of try

                        
                // Script has finished with a Queue Entry, check remaining usage before asking for another Queue Entry
                // if there isn't enough remaining usage just reschedule the script
                if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {                              
                	log.debug(funcName, "Running out of resources and attempting to reschedule for next qEntry");
                              
                	try {                                    
                		var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});                                   
                		scriptTask.scriptId = SCRIPT_ID;                                   
                		var scriptTaskId = scriptTask.submit();                                 
                		log.debug(funcName, "Script rescheduled");                           
                	} catch (e2) { log.error(funcName, "Failed to reschedule script: " + e2.message); }                             

                	return;
                } //if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) 

                // Ask Queue Manager if there is another Queue Entry to be processed
                var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
            }  // while (qEntry !== null && typeof qEntry === 'object')

            log.debug(funcName, "Finishing");
        }
        
        function checkIfRecordAlreadyProcessing(id) {
            var funcName = "checkIfRecordAlreadyProcessing";
        	var canBeProcessed = false;
        	
			try { canBeProcessed = setRecordToProcessing(id); }
			catch (saveException) {
				if (saveException.name == "RCRD_HAS_BEEN_CHANGED") {
					// try once more just in case
					try { canBeProcessed = setRecordToProcessing(id); }
					catch(saveException2) { log.error(funcName, "Exception setting exchange rcd status to queued(5e):  " + id + ",  message:" + saveException2.message ); }
				}
				else {
	                log.error(funcName, "Exception setting exchange rcd status to queued(5e):  " + id + ",  message:" + saveException.message );         					
				}
			} // catch
        	
        	return canBeProcessed;
        }
        
        //=================================================================================================================================
        //=================================================================================================================================
        function setRecordToProcessing(id) {
			var funcName = "setRecordToProcessing";
          
			var rcdExchange = record.load({ type:'customrecord_acq_lot' ,id:id });
			status = rcdExchange.getValue("custrecord_acq_loth_zzz_zzz_acqstatus"); 
			if (status == 15 || status == 16) {
                log.debug(funcName, "Exchange Record already queued, skipped:  " + id + ",  status:" + status );         					
			}
			else {
				rcdExchange.setValue("custrecord_acq_loth_zzz_zzz_acqstatus",15);
				rcdExchange.save();
				return true;
			}
        	return false;
        }

        //=================================================================================================================================
        //=================================================================================================================================
        return {
            execute: execute
        };

    }

);