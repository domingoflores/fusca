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
//Description:    A scheduled script that uses the Prolecto Queue Manager for ODS Sync processing
//Developer:      Alex Fodor 
//Date:           October 2018
//------------------------------------------------------------------------------------------------------------------------------------
define(['N/search' ,'N/https' ,'N/http' ,'N/runtime' ,'N/record'
	   ,'/.bundle/132118/PRI_QM_Engine' 
	   ,'/SuiteScripts/Pristine/libraries/odsSyncLibrary'
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ],

    function(search ,https ,http ,runtime ,record 
    		,qmEngine ,odsSync ,appSettings
    		) {

        var scriptName = "odsSyncRecordQM.js";
        var objParms;
        var status;

        function execute(context) {

    	    var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
    	    var NewRemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            var funcName = scriptName;
            var MIN_USAGE_THRESHOLD = 600;// when governance usage falls below this threshold, script will terminate and attempt to reschedule
            var QUEUE_NAME = "ODSSyncRecord";
            var SCRIPT_ID = "customscript_ods_sync_record_qm";        // id for this script
            log.debug(funcName, "=== Starting ===...==================================================");
            log.debug(funcName, "==================================================================");
            // Get Queue Manager entry to be processed
            var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
            var thisScript = runtime.getCurrentScript();
            
            var appSetting_AuthKeys = JSON.parse( appSettings.readAppSetting("ODS Sync" ,"Auth Keys") );

            // Loop to process Queue Manager entries 
            while (qEntry !== null && typeof qEntry === 'object') { 
                var qEntryAsString = JSON.stringify(qEntry);
                funcName = "Queue Mgr ODS Sync"
            	
                try {
                    objParms = JSON.parse(qEntry.parms);
                    funcName = funcName + " recType:" + objParms.recType;
                    if (objParms.recordIdList.length == 1) { funcName = funcName + " recId:" + objParms.recordIdList[0]; }
                    var notes = "";
                    
                    if (!objParms.successfulCount) { 
                    	objParms.successfulCount = 0;
                    	objParms.failedRecords = [];
                   	}
                    
                	log.debug(funcName, "objParms: " + JSON.stringify(objParms) ); 
                	
                	
                	//notes = JSON.stringify(syncResult);
                	
                	var Complete = true;
        	        // Loop to process Exchange Records list on this Queue Manager entry
					for (var ix = objParms.startingIndex; ix < objParms.recordIdList.length; ix++){ 

						// Update starting index so if we reschedule the queue entry that execution will start  
						// on the correct exchange record
						objParms.startingIndex = ix;

	                    // Check to see if remaining usage is low and the Queue Entry needs to be rescheduled
						log.debug(funcName, "RemainingUsage: " + runtime.getCurrentScript().getRemainingUsage() );
						if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) { 
    						log.debug(funcName, "QEntry " + qEntry.id + " Ran out of Governance,   Number of rcds:" + objParms.recordIdList.length + ",   Restart Index:" + ix );	
    						Complete = false;
    						break;    						
    					}
    					

            			try {
    	                	var syncResult = odsSync.odsSyncOneRow(context, objParms ,ix ,appSetting_AuthKeys);
            				log.debug(funcName, "after sync: " + JSON.stringify(syncResult)  );

            				var sync_result = 2;
    	                	if (syncResult.success) { objParms.successfulCount += 1;  sync_result = 1;  }
    	                	else                    { objParms.failedRecords.push(objParms.recordIdList[ix]); }

    	                	try {
                				var rcdAuditTrail = record.create({type:'customrecord_ods_sync_audit_trail' ,isDynamic:true });
                				rcdAuditTrail.setValue('custrecord_osat_record_type'     ,objParms.recType             );
                				rcdAuditTrail.setValue('custrecord_osat_record_id'       ,objParms.recordIdList[ix]    );
                				rcdAuditTrail.setValue('custrecord_osat_sync_result'     ,sync_result);
                				rcdAuditTrail.setValue('custrecord_osat_sync_datetime'   ,syncResult.syncDatetime);
                				rcdAuditTrail.setValue('custrecord_osat_calling_script'  ,objParms.callingScript);
                				var rcdId = rcdAuditTrail.save();
    	                	}
    	                	catch(e) {
                				log.error(funcName, 'ODS SYNC ERROR writing Audit Trail: ' + ",  index: " + ix + ",   syncResult: " + JSON.stringify(syncResult) + ",  objParms: " + JSON.stringify(objParms) + ",  Error: "  + JSON.stringify(e) );    	                		
    	                	}
            				
            				objParms.startingIndex += 1;
            				var updatedParameters = JSON.stringify(objParms);
            				qmEngine.updateQueueEntry( qEntry.id ,updatedParameters );
            			}
            			catch(err){
            				log.error(funcName, 'ODS SYNC ERROR: ' + JSON.stringify(err));
            			}
                        
            			thisScript.percentComplete = parseInt( ( (ix+1) * 100 ) / objParms.recordIdList.length );
    				} // for (var ix = objParms.startingIndex; ix < objParms.exchangeRecordIdList.length; ix++)
					
                    if (!Complete) {
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
            			catch(e0) { log.audit(funcName, "Failed to reschedule script: " + e0.message); }
            			
                    	return;
                    }

                	if (objParms.callingScript == "odsSyncSS.js") {
                		try {
                    		
            				var syncStatus = 3;
            				if (objParms.successfulCount == objParms.recordIdList.length) { syncStatus = 2; }
                            objValues = {};
                            objValues["custrecord_osr_nbr_records_processed"]  = objParms.recordIdList.length;     			
            				objValues["custrecord_osr_nbr_records_successful"] = objParms.successfulCount;
            				objValues["custrecord_osr_last_sync_completed"]    = new Date();
            				objValues["custrecord_osr_last_sync_status"]       = syncStatus;
                      		record.submitFields({ type:"customrecord_ods_sync_rectype" ,id:objParms.ODSSyncRecordTypeId ,values:objValues });
                		}
                		catch(eProgressUpdate) {
                        	log.error(funcName, "Exception when updating request progress: " + eProgressUpdate);                      
                		}
                	}

                	notes = "Processing Completed";
        			qmEngine.markQueueEntryComplete(qEntry.id ,notes); 
        	        
                    
                } catch (e) {
                    // Got an error, couldn't complete it, so update the status
                	// In this case we will tell Queue Manager to abandon this Queue Entry
                	// If it is possible the error is of temporary nature we could just mark it incomplete
                	// and allow Queue Manager to try this Queue Entry again
                	log.error(funcName, "Exception: " + e);                      
                	var objParmsAsString = JSON.stringify(objParms);
                	// qmEngine.abandonQueueEntry(qEntry.id, objParmsAsString, "ERROR: " + e.message);
        			qmEngine.markQueueEntryIncomplete(qEntry.id, objParmsAsString, "Exception encountered, marked incomplete to try again; e=" + e.message);
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

        }
        

    	
        //=================================================================================================================================
        //=================================================================================================================================
        return {
            execute: execute
        };

    }

);