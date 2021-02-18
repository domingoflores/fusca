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
define(['N/search', 'N/record', 'N/runtime', 'N/task', 'N/format'
	   ,'/.bundle/132118/PRI_QM_Engine' 
	   ,'/SuiteScripts/Pristine/libraries/TINCheckLibrary.js' 
	   ],

    function(search, record, runtime, task, format, qmEngine ,tinCheck) {

        var scriptName = "TINCheckNotifyTargetQM.js";
        var funcName;
        var ShipConStatusRcd;
        var ItemsCount;
        var objParms;
        var status;

        function execute(context) {

            funcName = scriptName;
    	    var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
    	    var NewRemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            var MIN_USAGE_THRESHOLD = 600;// when governance usage falls below this threshold, script will terminate and attempt to reschedule
            var QUEUE_NAME = "TINCheckNotifyTarget";
            var SCRIPT_ID = "customscript_tinchk_notify_target_qm";        // id for this script
            log.debug(funcName, "=== Starting =====================================================");
            log.debug(funcName, "==================================================================");
            // Get Queue Manager entry to be processed
            var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
            var thisScript = runtime.getCurrentScript();

            // Loop to process Queue Manager entries 
            while (qEntry !== null && typeof qEntry === 'object') { 
                var qEntryAsString = JSON.stringify(qEntry);
                funcName = scriptName + " QID=" + qEntry.id
            	
                try {
                    objParms = JSON.parse(qEntry.parms);
                    var notes = "";
                    var reschedule = false;
                    
					switch (objParms.targetSystem) {
					case "ExchangeRecord":
						var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:objParms.targetId
                                                                       ,columns: ["custrecord_acq_loth_zzz_zzz_acqstatus" ]});
						var aquiomStatus = objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_acqstatus[0].value;
						var aquiomStatusValues = {paymentDashQueued:"15" ,paymentDashProcessing:"16"};
						if (aquiomStatus == aquiomStatusValues.paymentDashQueued || aquiomStatus == aquiomStatusValues.paymentDashProcessing) { reschedule = true; }
						break;
					} //switch (objParms.targetSystem)
                   
                    if (reschedule) {
                    	var snoozeUntil = new Date();
                    	var oneMinuteFromNow = snoozeUntil.getTime() + ( 1000 * 60);
                    	snoozeUntil.setTime(oneMinuteFromNow);
                    	qmEngine.snoozeQueueEntryUntil(qEntry.id, snoozeUntil, "rescheduled; Payment Dashboard is processing");
                    }
                    else {
                        tinCheck.notifyTarget(objParms.idTinCheck ,objParms.targetSystem ,objParms.targetId);
            			qmEngine.markQueueEntryComplete(qEntry.id); 
            		}
                    
                } catch (e) {
                	
                    var retryThisRecord = false;
                    var retryMessage    = "got an exception, retry this record.";
        			if (e.name == "RCRD_HAS_BEEN_CHANGED" || e.name == "CUSTOM_RECORD_COLLISION") { 
        				if (objParms.retryCount) { objParms.retryCount = objParms.retryCount + 1; }
        	            else                     { objParms.retryCount = 1; }
        				if (objParms.retryCount > 5) { throw "Error: Queue Entry " + qEntry.id  + " seems to be in an infinite error loop, it has gotten same RCRD_HAS_BEEN_CHANGED error 5 times. " }
        				retryThisRecord = true;
        				retryMessage    = "unable to save target record, RCRD_HAS_BEEN_CHANGED exception, rescheduling this record to retry";
        				log.debug("RESCHEDULE" ,"Will retry this record due to RCRD_HAS_BEEN_CHANGED exception");
        			}

        			if (retryThisRecord) {
        				var paramString = JSON.stringify(objParms);
        				qmEngine.markQueueEntryIncomplete(qEntry.id , paramString ,retryMessage); 
        			}
        			else {
                        // Got an error, couldn't complete it, so update the status
                    	// In this case we will tell Queue Manager to abandon this Queue Entry
                    	// If it is possible the error is of temporary nature we could just mark it incomplete
                    	// and allow Queue Manager to try this Queue Entry again
        				log.error(funcName, "Exception encountered ---> " +
            					"tinCheckId:" + objParms.idTinCheck + ",    targetSystem:" + objParms.targetSystem + ",    targetId:" + objParms.targetId +
            					",     exceptionMessage: " + e.message);
            			log.error(funcName ,e);
                    	var objParmsAsString = JSON.stringify(objParms);
                    	qmEngine.abandonQueueEntry(qEntry.id, objParmsAsString, "Not Processed due to ERROR: " + e.message);
        			}
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
        
        

        //=================================================================================================================================
        //=================================================================================================================================
        return {
            execute: execute
        };

    }

);