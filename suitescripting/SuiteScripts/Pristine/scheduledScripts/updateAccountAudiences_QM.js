//------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */

/*
 *
 * Process results that may otherwise time out 
 * 
 */

define(["N/search", "N/record", "N/runtime", "N/task"
	, "/SuiteScripts/Prolecto/Shared/SRS_Constants"
	, "/.bundle/132118/PRI_QM_Engine"
	, "/SuiteScripts/Pristine/libraries/searchLibrary.js"
    
	],
    function(search, record, runtime, task
    		, srsConstants
    		, qmEngine
    		, searchLibrary
			) {

		"use strict";

		var scriptName = "updateAccountAuidiences_QM.";

    	var MIN_USAGE_THRESHOLD = 500;    
    	
    	//this function will return 
		//all accounts associated with this escrow id that 
		//are subaccounts of 200 300k
		function getAccounts(escrowTypeID, accounts) 
		{
			var filters = [];
			
			filters.push(search.createFilter({ name:"parent" ,operator:"anyof" ,values:accounts }));
			filters.push(search.createFilter({ name:"custrecord_account_override_audience" ,operator:"is" ,values:"F" }));
			filters.push(search.createFilter({ name:"custrecord_escrow_account_type" ,operator:"ANYOF" ,values:escrowTypeID }));
			
			
			var accountSearch = search.create({
				type: "account",
				title: "Accounts that are Sub-Accounts of",
				columns: [{
					name: "name"
				}],

				filters: filters
			}).run();

			var searchResults = searchLibrary.getSearchResultData(accountSearch);					
			return searchResults;
			
		}
    	
		function execute(context) {
        
			var funcName = scriptName + "execute";
			            
        	var allDone = false;
        	
        	log.debug(funcName, "Starting");
        	
        	var obj = null;
        	var lists = null;
        	var processCompleted = false;
        	var currentindex = 0;
        	var audience = null;
			
			var jobID = "";
			var scriptTask = null;
			var scriptTaskId = "";
			var i = 0;
			var parentAccounts = [];
			var accountsToProcessCount = 0;
			var accountID = "";
			var REC = null;
			var rcdId = null;
			var escrowTypeId = "";
			
        	do {
            	obj = qmEngine.getNextQueueEntry(srsConstants.QUEUE_NAMES.UPDATE_ACCOUNT_AUDIENCE);
            	
				if (obj !== null && typeof obj === "object") {
					
					try {
						
						lists = JSON.parse(obj.parms); 
//						log.audit("lists ", JSON.stringify(lists));
						
						processCompleted = false;
						
						currentindex = lists.currentindex;
						log.debug("currentindex ", currentindex);
						
						audience = lists.audience;
						escrowTypeId = lists.escrowTypeId;
						parentAccounts = lists.parentAccounts;
						
						if (!lists.accountsToUpdate)
						{
							lists.accountsToUpdate = JSON.parse(JSON.stringify(getAccounts(escrowTypeId, parentAccounts)));
						}
//						[
//						  {
//						    "recordType": "account",
//						    "id": "19171",
//						    "values": {
//						      "name": "00007 Acquiom Escrow Agent : Checking Accounts : SRS Acquiom Holdings LLC Comerica (Payroll) : Escrow Accounts : L2F Middleby Marshall : [testing]"
//						    }
//						  },
//						  {
//						    "recordType": "account",
//						    "id": "137",
//						    "values": {
//						      "name": "001010 Acquiom Escrow Agent : Checking Accounts"
//						    }
//						  }
//						]
						log.debug("accountsToUpdate ", JSON.stringify(lists.accountsToUpdate));
						
						
						
						
						jobID = "";
						accountsToProcessCount = lists.accountsToUpdate.length;
						
						for (i = currentindex; i < accountsToProcessCount; i+=1) 
						{
							accountID = lists.accountsToUpdate[i].id;
							
							REC = record.load({type:"account" ,id:accountID ,isDynamic:true });
							REC.setValue({ fieldId:"custrecord_account_audience",value:audience});
							rcdId = REC.save({ enableSourcing:false ,ignoreMandatoryFields:true});
							
							
							if (i === (accountsToProcessCount-1))
							{
								processCompleted = true; 
							}
							if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) 
							{
			                		processCompleted = false;
			                }
							
							
							if (processCompleted) 
							{
				        		qmEngine.markQueueEntryComplete(obj.id, "Completed successfully.");	                    	
							}
							else
							{
								lists.currentindex = (i+1);
								qmEngine.markQueueEntryIncomplete(obj.id, JSON.stringify(lists), "Rescheduling due to governance");			                		
							
								if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
									log.debug(funcName, "Usage consumed.  Rescheduling");
									scriptTask = task.create({"taskType": task.TaskType.SCHEDULED_SCRIPT});
						            scriptTask.scriptId = srsConstants.SCRIPT_NAMES.PAID_UNPAID;
						            scriptTaskId = scriptTask.submit();
		
									return;
								}
							}
							
							
						}
						
						log.audit("remaining usage ", runtime.getCurrentScript().getRemainingUsage());
				} catch (e) {
						// couldn't complete it, so update the status and let it try again
						log.error(funcName, e);
						qmEngine.abandonQueueEntry(obj.id, null, "ERROR: " + e.message);
					}
										
					
				} 
				else	// we didn't get anything back from the queue
				{
					return;
				}           		
	    	} while (true);

            	
        	log.debug(funcName, "*** EXITING ***");
        	
        }
		
		// ================================================================================================================================


        return {
            execute: execute
        };
    }
);