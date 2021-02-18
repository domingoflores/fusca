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
//Date:           Feb 2019
//------------------------------------------------------------------------------------------------------------------------------------
//
// Notes on usage
//
// Here is a sample parm object for this script
// {"nbrToCreate":2 ,"startingIndex":0 ,"startingAmount":1005 ,"amountIncrement":5 ,"amount":0 ,"modelCreditMemoId":2666010 ,"modelCustomerRefundId":2666003 }
//
//  parm object properties
//  ----------------------
//  nbrToCreate            - This specifies how many credit mems/customer refunds you wish to create
//  startingIndex          - This is always zero, the script uses when it has to reschedule itself
//  startingAmount         - This is the amount that will be put on the first credit memo created
//  amountIncrement        - This alows you to increment the amount on each subsequent credit memo
//  amount                 - This is used by the script to keep track of the amount
//  modelCreditMemoId      - This is the internal id of a Credit Memo the script will copy when creating a credit memo
//  modelCustomerRefundId  - This is the internal id of a Customer Refund the script will copy when creating a customer refund
//
//  The way this works is that you create a credit memo for the customer of your choice, you need only one item as this script 
//  only updates the amount on the first item on the credit memo.
//
//  Then you create a customer refund using the credit memo you just created. These are your "models".
//
//  Then you have to go back to your credit memo and zero out your credit memo by changing the amount on the item to zero.
//  This is necessary to keep the credit refund creation process from using your "model" credit memo, so it is available to be copied
//  for each credit memo that is to be created.
//  Your credit memo must have a total amount of zero, but it must have one item with a zero amount.
//
//------------------------------------------------------------------------------------------------------------------------------------
define(['N/search', 'N/record', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/xml', '/.bundle/132118/PRI_QM_Engine' 
	   ],

    function(search, record, runtime, task, format, file, xml, qmEngine) {

        var scriptName = "CreateCustRefundsForTesting_QM.js";
        var ShipConStatusRcd;
        var ItemsCount;
        var objParms;
        var status;

        function execute(context) {

    	    var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
    	    var NewRemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            var funcName = scriptName;
            var MIN_USAGE_THRESHOLD = 600;// when governance usage falls below this threshold, script will terminate and attempt to reschedule
            var QUEUE_NAME = "CreateCustRefundsForTesting";
            var SCRIPT_ID = "customscript_qm_createcustfefunds4test";        // id for this script
            log.debug(funcName, "=== Starting =====================================================");
            log.debug(funcName, "==================================================================");
            // Get Queue Manager entry to be processed
            var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
            var thisScript = runtime.getCurrentScript();
            
            
            if (runtime.envType.toString().toUpperCase() != "SANDBOX") { throw "THIS SCRIPT CAN BE RUN IN SANDBOX ONLY!!!" }

            // Loop to process Queue Manager entries 
            while (qEntry !== null && typeof qEntry === 'object') { 
                var qEntryAsString = JSON.stringify(qEntry);
                funcName = "CreateCustRefundsForTesting Q=" + qEntry.id
            	
                try {
                    objParms = JSON.parse(qEntry.parms);
                    
                    var Complete = true;
        	        var ctr = 0;
					
					if (objParms.startingIndex == 0) { objParms.amount = objParms.startingAmount; }
       	            				
        	        // Loop to process Exchange Records list on this Queue Manager entry
					for (var ix=objParms.startingIndex; ix < objParms.nbrToCreate; ix++){ 
						objParms.startingIndex = ix;

	                    // Check to see if remaining usage is low and the Queue Entry needs to be rescheduled
						if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) { 
    						log.debug(funcName, "QEntry " + qEntry.id + " Ran out of Governance,   Number of rcds:" + objParms.nbrToCreate + ",   Restart Index:" + ix );	
    						Complete = false;
    						break;    						
    					}
    					
            			try {
            				   
            				   var objCreditMemo = record.copy({ type:record.Type.CREDIT_MEMO, id:objParms.modelCreditMemoId ,isDynamic:true ,defaultValues:{} });

            				   objCreditMemo.selectLine({ sublistId:'item' ,line:0 });
            				   objCreditMemo.setCurrentSublistValue({sublistId:'item' ,fieldId:'amount' ,value:objParms.amount ,ignoreFieldChange:true });
            				   objCreditMemo.commitLine({ sublistId:'item' });
            				   
            				   var idCreditMemo = objCreditMemo.save();
            				   
            				   
            				   var objSeedRecord = record.load({ type:record.Type.CUSTOMER_REFUND, id:objParms.modelCustomerRefundId ,isDynamic:true });
            				   var defaultValues = {     entity:objSeedRecord.getValue("customer")
            			                            ,customform:140    };

            				   var objRecord = record.create({type:record.Type.CUSTOMER_REFUND ,isDynamic:true ,defaultValues:defaultValues });
            				   
            				   objRecord.setValue({fieldId:"department" ,value:objSeedRecord.getValue("department") });
            				   objRecord.setValue({fieldId:"class" ,value:objSeedRecord.getValue("class") });
            				   objRecord.setValue({fieldId:"custbody_acq_lot_createdfrom_exchrec" ,value:objSeedRecord.getValue("custbody_acq_lot_createdfrom_exchrec") });
            				   objRecord.setValue({fieldId:"custbodyacq_deal_link" ,value:objSeedRecord.getValue("custbodyacq_deal_link") });
            				   objRecord.setValue({fieldId:"paymentmethod" ,value:objSeedRecord.getValue("paymentmethod") });
            				   objRecord.setValue({fieldId:"memo" ,value:"Alex test" });
            				   
            				   var numLines = objRecord.getLineCount({ sublistId:'apply'});
            				   log.debug(funcName, "numLines: " + numLines );
            				   
            				   if (numLines > 0) {
                				   log.debug(funcName, "applying "  );
            					   objRecord.selectLine({ sublistId:'apply' ,line:0 });
            					   objRecord.setCurrentSublistValue({ sublistId:'apply' ,fieldId:'apply' ,value:true });
            					   objRecord.commitLine({ sublistId:'apply' });

            					   var newRecordId = objRecord.save();
            					   log.debug(funcName, "newRecordId: "  + newRecordId );
            				   } // if (numLines > 0)
            				
            			}
            			catch(err){
            				log.error(funcName, 'ERROR CREATING CREDIT REFUND   ' + JSON.stringify(err));
            			}
                        				
            			objParms.amount = objParms.amount + objParms.amountIncrement;

            			thisScript.percentComplete = parseInt( ( (ix+1) * 100 ) / objParms.nbrToCreate );
    				} // for (var ix=objParms.startingIndex; ix < nbrToCreate; ix++)
        	        
        	        
                    if (Complete) { // if this Queue Manager entry is completed tell QM to mark it complete
            			qmEngine.markQueueEntryComplete(qEntry.id); 
                    	log.debug(scriptName, "Complete");              
                    } 
                    else {
                    	// The Queue Entry is not complete, we have run out of usage for this instance of the script
                    	// Tell QM to mark the entry as incomplete
                    	log.debug(scriptName, "Rescheduling    objParms.nbrToCreate:" + objParms.nbrToCreate + ",  startingIndex" + objParms.startingIndex);   
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
        

        //=================================================================================================================================
        //=================================================================================================================================
        return {
            execute: execute
        };

    }

);