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
// This script replaces UpdateCustomerRefundScheduledScript.js
//
//  Parm: {"startingIndex":0 ,"CustRefundArray":[999901 ,999902 ,999904]}
//
//------------------------------------------------------------------------------------------------------------------------------------
define(['N/search' ,'N/record' ,'N/runtime' ,'N/task' ,'N/format' ,'N/file' ,'N/xml' ,'N/email' ,'N/url'
	   ,'/.bundle/132118/PRI_QM_Engine' 
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ],

    function(search ,record ,runtime ,task ,format ,file ,xml ,email ,url ,qmEngine ,appSettings) {

        var scriptName = "PaymentFileApprovedUpdateCustRefunds_QM.js";
        var ShipConStatusRcd;
        var ItemsCount;
        var objParms;
        var status;
        var testingCounter = 0;

        function execute(context) {

    	    var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
    	    var NewRemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            var funcName = scriptName;
            var MIN_USAGE_THRESHOLD = 600;// when governance usage falls below this threshold, script will terminate and attempt to reschedule
            var QUEUE_NAME = "PaymentFileApprovedUpdateCustRefunds";
            var SCRIPT_ID = "customscript_qm_pmtfile_apprv_upd_cusref";        // id for this script
            log.debug(funcName, "=== Starting =====================================================");
            log.debug(funcName, "==================================================================");
            // Get Queue Manager entry to be processed
            var qEntry = qmEngine.getNextQueueEntry(QUEUE_NAME);
            var thisScript = runtime.getCurrentScript();
            

            // Loop to process Queue Manager entries 
            while (qEntry !== null && typeof qEntry === 'object') { 
                var qEntryAsString = JSON.stringify(qEntry);
                funcName = "CreateCustRefundsForTesting Q=" + qEntry.id
            	
                try {
                    objParms = JSON.parse(qEntry.parms);
                    
                    if (!objParms.failedUpdatesList) { objParms.failedUpdatesList = []; }
                    
                    var Complete = true;
        	        var ctr = 0;
        	        var customerRefundRecord = null;
       	            				
        	        // Loop to process Customer Refunds list on this Queue Manager entry
					for (var ix=objParms.startingIndex; ix < objParms.CustRefundArray.length; ix++){ 
						objParms.startingIndex = ix;

	                    // Check to see if remaining usage is low and the Queue Entry needs to be rescheduled
						if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) { 
    						log.debug(funcName, "QEntry " + qEntry.id + " Ran out of Governance,   Number of rcds:" + objParms.CustRefundArray.length + ",   Restart Index:" + ix );	
    						Complete = false;
    						break;    						
    					}
    					
						var refundUpdated = false;
            			try { refundUpdated = updateCustomerRefund(objParms.CustRefundArray[ix] ,objParms.payFileCreationRecordID); }
            			catch(err){
            				log.error(funcName, 'ERROR UPDATING CUSTOMER REFUND with id: ' + objParms.CustRefundArray[ix] + ', will retry;    exception: ' + JSON.stringify(err));
            			}
            			
            			if (!refundUpdated) {
                			try { refundUpdated = updateCustomerRefund(objParms.CustRefundArray[ix] ,objParms.payFileCreationRecordID); }
                			catch(err){
                				log.error(funcName, 'Attempt #2: ERROR UPDATING CUSTOMER REFUND with id: ' + objParms.CustRefundArray[ix] + ', will retry;    exception: ' + JSON.stringify(err));
                			}
            			}
            			
            			if (!refundUpdated) {
                			try { refundUpdated = updateCustomerRefund(objParms.CustRefundArray[ix] ,objParms.payFileCreationRecordID); }
                			catch(err){
                				log.error(funcName, 'Attempt #3: ERROR UPDATING CUSTOMER REFUND with id: ' + objParms.CustRefundArray[ix] + ', will NOT retry;    exception: ' + JSON.stringify(err));
                				log.audit(funcName, 'Payment File UPDATE of CUSTOMER REFUND with id: ' + objParms.CustRefundArray[ix] + ' FAILED (update was attempted 3 times) ');
                				objParms.failedUpdatesList.push(objParms.CustRefundArray[ix]);
                			}
            			}

            			thisScript.percentComplete = parseInt( ( (ix+1) * 100 ) / objParms.CustRefundArray.length );
    				} // for (var ix=objParms.startingIndex; ix < objParms.CustRefundArray.length; ix++)
        	        
        	        
                    if (Complete) { // if this Queue Manager entry is completed tell QM to mark it complete
                    	var exceptionsEmailSender      = appSettings.readAppSetting("Payment File Creation", "Exceptions Email Sender Employee ID");
                    	var exceptionsEmailAddressList = appSettings.readAppSetting("Payment File Creation", "Exceptions Email Address List");
                    	var arrEmailAddressList = exceptionsEmailAddressList.split(';');
                    	
                        // HOTFIX - Alex Fodor, code reviewed Ken Crossman.  Date: 2019-04-11
                        try {
                    	    var payFileCreationRecord = record.load({type:'customrecord_payment_file' ,id:objParms.payFileCreationRecordID });
            			    payFileCreationRecord.setValue({ fieldId:'custrecord_pay_file_status' ,value:4 ,ignoreFieldChange:true });
            			    payFileCreationRecordID = payFileCreationRecord.save({ enableSourcing:false ,ignoreMandatoryFields:false });
                        }
                        catch(eComplete) {
                            log.error(funcName, "Error saving Payment File Creation record to set status to complete: " + eComplete.message);

                        	var pfcURL = url.resolveRecord({recordType:"customrecord_payment_file", recordId:objParms.payFileCreationRecordID});
                            var pfcLink = "<a href='" + pfcURL + "'>Payment File Creation record " + objParms.payFileCreationRecordID + "</a> <br/>";
                        	var body = "An error has occurred, the process that is triggered by Payment File creation to update the customer refunds paid in that file was not able to set the status of the Payment File Creation record to 'COMPLETE'."
                        		     + "<br/><br/>"
                        			 + pfcLink;
                      		email.send({ author:exceptionsEmailSender ,recipients:arrEmailAddressList ,subject:"Error setting Payment File Creation record to status 'COMPLETE'" ,body:body });
                        }
                        // END HOTFIX
                        log.debug("Testing", "objParms.failedUpdatesList.length: " + objParms.failedUpdatesList.length);
                        if (objParms.failedUpdatesList.length > 0) {
                        	var pfcURL = url.resolveRecord({recordType:"customrecord_payment_file", recordId:objParms.payFileCreationRecordID});
                            var pfcLink = "<a href='" + pfcURL + "'>Payment File Creation record " + objParms.payFileCreationRecordID + "</a> <br/>";
                        	var body = "An error has occurred, the process that is triggered by Payment File creation to update the customer refunds paid in that file was not able to update all of the Customer Refund transactions."
                        		     + "<br/><br/>"
                        			 + pfcLink 
                        			 + "<br/><br/>"
                        			 + "The updates that would have been applied to each Customer Refund transaction are . . .<br/>"
                        			 + "1. SUBMITTED TO PAYMENT SYSTEM (custbody10) is set to True (checked)<br/>"
                        			 + "2. AVID PAYMENT METHOD (custbody_pp_payment_method) is set to 'Do Not Process With AvidXchange' (4)<br/>"
                        			 + "3. PAYMENT FILE CREATION RECORD (custbody_pay_file_record) is set to point the record above<br/>"
                        			 + "<br/><br/>"
                        			 + "Here is a list of those Customer Refund transactions that were not updated."
                        			 + "<br/><br/>";

                        	for each (tranId in objParms.failedUpdatesList) {
                            	var ioURL = url.resolveRecord({recordType:record.Type.CUSTOMER_REFUND, recordId:tranId});
                                var ioLink = "<a href='" + ioURL + "'>Customer Refund " + tranId + "</a> <br/>";
                            	body = body + ioLink;    		
                        	}
                      		email.send({ author:exceptionsEmailSender ,recipients:arrEmailAddressList ,subject:"ERROR: Payment File Customer Refunds were not updated" ,body:body });
                        }
                    	
            			qmEngine.markQueueEntryComplete(qEntry.id); 
                    	log.debug(scriptName, "Complete");              
                    } 
                    else {
                    	// The Queue Entry is not complete, we have run out of usage for this instance of the script
                    	// Tell QM to mark the entry as incomplete
                    	log.debug(scriptName, "Rescheduling    objParms.CustRefundArray.length:" + objParms.CustRefundArray.length + ",  startingIndex" + objParms.startingIndex);   
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
                	
                	var exceptionsEmailSender      = appSettings.readAppSetting("Payment File Creation", "Exceptions Email Sender Employee ID");
                	var exceptionsEmailAddressList = appSettings.readAppSetting("Payment File Creation", "Exceptions Email Address List");

                	var pfcLink = "";
                	try {
                    	var pfcURL = url.resolveRecord({recordType:"customrecord_payment_file", recordId:objParms.payFileCreationRecordID});
                        pfcLink = "<a href='" + pfcURL + "'>Payment File Creation record " + objParms.payFileCreationRecordID + "</a> <br/>";
                	}
                	catch(e0) { }
                	var body = "An error has occurred and the process that is triggered by Payment File creation to update the customer refunds has failed, please contact IT. The script is question is " + scriptName
                		     + "<br/><br/>"
                			 + pfcLink;
              		email.send({ author:exceptionsEmailSender ,recipients:arrEmailAddressList ,subject:"Error processing Customer Refunds for Payment File Creation" ,body:body });
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
        } // function execute(context)
        
        
        //=================================================================================================================================
        //=================================================================================================================================
        function updateCustomerRefund(refundId ,payFileCreationRecordID) {
        	
			customerRefundRecord = record.load({ type:record.Type.CUSTOMER_REFUND ,id:refundId });
			//Update custbody10 (SUBMITTED TO PAYMENT SYSTEM) value
			customerRefundRecord.setValue({ fieldId:'custbody10' ,value:true ,ignoreFieldChange:true });
			//Update custbody_pp_payment_method to relect that this record will not be paid using Avid Exchange
			customerRefundRecord.setValue({ fieldId:'custbody_pp_payment_method' ,value:4 ,ignoreFieldChange:true});  // ATP-1981 - leaving in place
			//Update custbody_pay_file_record value
			customerRefundRecord.setValue({ fieldId:'custbody_pay_file_record' ,value:payFileCreationRecordID ,ignoreFieldChange:true });
			//Save the Customer Refund Record
			refundID = customerRefundRecord.save({ enableSourcing:false ,ignoreMandatoryFields:true});
        	
        	return true;
        }
        

        //=================================================================================================================================
        //=================================================================================================================================
        return {
            execute: execute
        };

    }

);