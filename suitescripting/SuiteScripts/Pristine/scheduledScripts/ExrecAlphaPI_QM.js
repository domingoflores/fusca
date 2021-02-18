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
	   ,'SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js' 
	   ],

    function(search, record, runtime, task, format
    		,qmEngine 
    		,ExRecAlphaPI
    		) {

        var scriptName = "ExrecAlphaPI_QM.js";
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
            var QUEUE_NAME = "AlphaPIExchangeRecord";
            var SCRIPT_ID = "customscript_exrec_alpha_pi_qm";        // id for this script
            log.debug(funcName, "=== Starting =====================================================");
            // Get Queue Manager entry to be processed
            var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
            var thisScript = runtime.getCurrentScript();

            // Loop to process Queue Manager entries 
            while (qEntry !== null && typeof qEntry === 'object') { 
                var qEntryAsString = JSON.stringify(qEntry);
                funcName = scriptName + " QID=" + qEntry.id;
            	
                try {
                    objParms = JSON.parse(qEntry.parms);
                    if (!objParms.callingScript) { objParms.callingScript = "???"; }
                    funcName = objParms.callingScript + "-->" + scriptName + ",  Function:" + objParms.func + ",  ExRec=" + objParms.exRecId + " Shareholder=" + objParms.shareholder + " Deal=" + objParms.deal;
                    var notes = "";
                    
          		  	try {
          		  		
          		  		switch (objParms.func) {
          		  		case "tagExchangeRecord":
                    		
                    		try {  
                  		  		var objReturn = ExRecAlphaPI.updateRelatedExRecs(objParms.shareholder, objParms.deal, objParms.exRecId);
                  		  		if (!objReturn.success) { throw "AlphaPI error returned from updateRelatedExRecs: " + objReturn.message; }
                    		} 
                    		catch (e) { 
                    			if (e.name == "RCRD_HAS_BEEN_CHANGED") { 
                    	            rescheduleThisRecord(objParms.func ,objParms ,qEntry);
                  		  			break;
                    			}
                    			throw e;
                    		} // 
                    		
                  		  	qmEngine.markQueueEntryComplete(qEntry.id ,notes);
              		  		break;
          		  			
          		  		case "applyPiModificationToExrec":
//          		  			var exRec        = record.load({type:'customrecord_acq_lot' ,id:objParms.exRecId ,isDynamic:true });
          		  			var exRec        = record.load({type:'customrecord_acq_lot' ,id:objParms.exRecId });
          		  			var localContext = { "newRecord":exRec };
          		  			var piId         = exRec.getValue("custrecord_exrec_payment_instruction");
          		  			
          		  			if (piId) { 
          		  				ExRecAlphaPI.clearPIDataOnExrec(localContext);
          		  				ExRecAlphaPI.applyPaymentInstructionToExrec(localContext); 
          		  			}
          		  			else { 
          		  				ExRecAlphaPI.clearPIDataOnExrec(localContext); 
          		  			}
          		  			
          		  			var paymtSuspenseReason = ExRecAlphaPI.piListLib.piEnum.paymtSuspenseReason;
                    		ExRecAlphaPI.removeSuspenseReasonsFromRecord(exRec ,[ paymtSuspenseReason.PmtInstrApplyRemoveIncomplete ] );     
                    		
                    		try { var rcdId = exRec.save(); } 
                    		catch (e) { 
                    			if (e.name == "RCRD_HAS_BEEN_CHANGED" || e.name == "CUSTOM_RECORD_COLLISION") { 
                    	            rescheduleThisRecord(objParms.func ,objParms ,qEntry);
                  		  			break;
                    			}
                    			throw e;
                    		} // 
                    		
                  		  	qmEngine.markQueueEntryComplete(qEntry.id ,notes);
          		  			break;

          		  		} // end switch (objParms.func)
          		  		
          		  	    notes = "Processed Successfully";
          		  	}
          		  	catch(e) {
          		  		log.error(funcName, scriptName + " exception:   Requested Function:" + objParms.func + ",  Detail: " + e);
            			notes = e.message;
            			qmEngine.markQueueEntryComplete(qEntry.id ,notes); 
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
        
        //=================================================================================================================================
        //=================================================================================================================================
        function rescheduleThisRecord(functionName ,objParms ,qEntry) {
			if (objParms.retryCount) { objParms.retryCount = objParms.retryCount + 1; }
            else { objParms.retryCount = 1; }
			if (objParms.retryCount > 5) { throw "Error: qEntry ' + functionName + ' seems to be in an infinite error loop, it has gotten same error 5 times. " }
			var paramString = JSON.stringify(objParms);
			qmEngine.markQueueEntryIncomplete(qEntry.id , paramString ,"unable to save, record changed by another user, rescheduling this record"); 
        }

        //=================================================================================================================================
        //=================================================================================================================================
        return {
            execute: execute
        };

    }

);