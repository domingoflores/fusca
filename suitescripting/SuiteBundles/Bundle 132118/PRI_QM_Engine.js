//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/*
 * 
 * This script implements the Prolecto Queue Manager
 * 
 * see accompanying sample file for usage examples
 * 
 */


define(['N/record','N/search','N/task'],
		
	function(record, search, task) {

		"use strict";

		const scriptName = "PRI_QM_Engine.";
		
		const SCRIPT_QUEUE_RECORD_NAME = "customrecord_pri_qm_queue";
		const SCRIPT_QUEUE_BATCH_RECORD_NAME = "customrecord_pri_qm_queue_batch";
		
		const BATCH_SUBLIST_ID = "recmachcustrecord_pri_qm_batch";
		

		var MS_PER_MINUTE = 60000;

		var MINUTES_TO_WAIT = 10;		// how many minutes a row should remain "assigned" before we consider it abandoned and assign it to someone else

		// ================================================================================================================================

		function addQueueEntry(queueName, paramString, doNotRunUntil, preventDuplicates, scheduledScriptId, priority) {
			
			var funcName = scriptName + "addQueueEntry " + queueName + " | " + paramString + " | " + doNotRunUntil;
			
			try {

				log.debug(funcName, "Starting");

				var qObj = {queueName: "", params: "", doNotRunUntil: null, preventDuplicates: false, priority: null, scheduledScriptId: null, giveUpAfter: null};

				var REC = record.create({type: SCRIPT_QUEUE_RECORD_NAME});

				if (typeof queueName === 'object') {
					qObj = queueName;
				} else {
					// old style parameters; stuff them into the object					
					qObj.queueName = queueName;
					qObj.params = paramString;
					qObj.doNotRunUntil = doNotRunUntil;
					if (priority)
						qObj.priority = priority;
					qObj.preventDuplicates = preventDuplicates; 
					qObj.scheduledScriptId = scheduledScriptId;
				}
					
				
				if (qObj.params !== null && typeof qObj.params === 'object')
					qObj.params = JSON.stringify(qObj.params);
				
				if (!qObj.queueName) 
					throw "Prolecto Queue Manager: 'queueName' parameter is required in addQueueEntry function";
				
				REC.setValue("custrecord_pri_qm_queue_name", qObj.queueName);
				REC.setValue("custrecord_pri_qm_parameters", qObj.params);
				if (qObj.doNotRunUntil) 
					REC.setValue("custrecord_pri_qm_next_attempt", new Date(qObj.doNotRunUntil));
				if (qObj.priority)
					REC.setValue("custrecord_pri_qm_priority", qObj.priority);
				if (qObj.giveUpAfter || qObj.giveUpAfter === "0")
					REC.setValue("custrecord_pri_qm_give_up_after_count", qObj.giveUpAfter);
				
				if (qObj.preventDuplicates) {
					var dupeId = queueEntryExists(qObj.queueName, qObj.params);
					if (dupeId) {
						REC.setValue("custrecord_pri_qm_completed_on", new Date());
						REC.setValue("custrecord_pri_qm_complete", true);
						REC.setValue("custrecord_pri_qm_next_attempt", "");
						REC.setValue("custrecord_pri_qm_notes", "Queue entry would have been a duplicate with ID " + dupeId);
						
						// no need to schedule a background task
						qObj.scheduledScriptId = null;
					}					
				}
				
				var qId = REC.save();
				
				log.debug(funcName, "Row " + qId + " added to queue.");
				
				if (qObj.scheduledScriptId) 
					scheduleBackgroundTask(qObj.scheduledScriptId);
				
				return qId;
				
			} catch (e) {		
				log.error(funcName, e);
				return;
			}

		}

		// ================================================================================================================================

		/*
		 * this function allows you to create many q entries at once.  the first parameter is an array of objects with these properties:
		 * 	{
		 * 		queueName:		"?",		required
		 * 		paramString:	"?",		optional
		 * 		doNotRunUntil:	"?",		optional
		 * 		giveUpAfter:	"?",		optional
		 * 		priority:		"?"			optional
		 *  }
		 *  
		 *  NOTE that when creating many entries at once, you CAN'T use the "preventDuplicates" feature
		 *  
		 *  if you provide a scheduledScriptId, then you may also provide the executionCount.  In that case, the script will attempt to schedule that many executions
		 *  
		 */
		
		function addQueueEntries(qEntries, scheduledScriptId, executionCount) {
			
			var funcName = scriptName + "addQueueEntries "; 
			
			log.debug(funcName, "Starting");

			if (!(qEntries instanceof Array)) 
				throw funcName + ": First parameter must be an array of objects";
			
			if (qEntries.length == 0)
				throw funcName + ": The Queue Entries parameters has a length of 0";

			if (qEntries.length > 9999)
				throw funcName + ": The Queue Entries parameter has too many entries (" + qEntries.length + ").  Max allowed is 9999.";

			for (var i = 0; i < qEntries.length; i++) {
				if (typeof qEntries[i] !== 'object')
					throw funcName + ": Array entry " + i + " is not an array";
				
				if (!qEntries[i].queueName) 
					throw funcName + ": Array entry " + i + " is missing required property 'queueName'";
			}
					
			
			var REC = record.create({type: SCRIPT_QUEUE_BATCH_RECORD_NAME});
			
			
			for (var i = 0; i < qEntries.length; i++) {
				var qObj = qEntries[i];
				
				REC.setSublistValue({sublistId: BATCH_SUBLIST_ID, fieldId: "custrecord_pri_qm_queue_name", line: i, value: qObj.queueName});
				REC.setSublistValue({sublistId: BATCH_SUBLIST_ID, fieldId: "custrecord_pri_qm_parameters", line: i, value: qObj.paramString || qObj.params || ""});
				
				if (qObj.doNotRunUntil) 
					REC.setSublistValue({sublistId: BATCH_SUBLIST_ID, fieldId: "custrecord_pri_qm_next_attempt", line: i, value: new Date(qObj.doNotRunUntil)});

				if (qObj.priority)
					REC.setSublistValue({sublistId: BATCH_SUBLIST_ID, fieldId: "custrecord_pri_qm_priority", line: i, value: qObj.priority});
				
				if (qObj.giveUpAfter || qObj.giveUpAfter === "0")
					REC.setSublistValue({sublistId: BATCH_SUBLIST_ID, fieldId: "custrecord_pri_qm_give_up_after_count", line: i, value: qObj.giveUpAfter});
				
			}
			
			var batchId = REC.save();
			
			log.debug(funcName, "Batch Record " + batchId + " created to add " + qEntries.length + " entries to queue.");
			
			if (scheduledScriptId) {
				executionCount = executionCount || 1;
				for (var i = 0; i < executionCount; i++)
					scheduleBackgroundTask(scheduledScriptId);
			}
			
			return batchId;
				
		}

		// ================================================================================================================================


		function queueEntryExists(qName, paramString) {
			paramString = paramString || "";
			var searchString = (paramString.length > 300) ? paramString.substring(0,300) : paramString;
				
			var ss = search.create({type: SCRIPT_QUEUE_RECORD_NAME,
				filters: [
		                  	["isinactive",search.Operator.IS,false]				                  	
		                  	,"AND",["custrecord_pri_qm_queue_name",search.Operator.IS,qName]
		                  	,"AND",["custrecord_pri_qm_complete",search.Operator.IS,false]
		                  	,"AND",["custrecord_pri_qm_parameters",search.Operator.STARTSWITH,searchString]
		                ],
		                columns: ["custrecord_pri_qm_parameters"]
			}).run().getRange(0,99);
			
			// since we had to search for a truncated string, we need to compare to all possible rows until we find one with the exact value
			for (var i = 0; i < ss.length; i++)
				if (ss[i].getValue("custrecord_pri_qm_parameters") == paramString)
					return ss[i].id;
		}

		// ================================================================================================================================
		
		function getNextQueueEntry(qName, minutesToWait) {

			var funcName = scriptName + "getNextQueueEntry " + qName;
			
			try {
				
				var ss = search.create({type: SCRIPT_QUEUE_RECORD_NAME,
						filters: [
				                  	["isinactive",search.Operator.IS,false]				                  	
				                  	,"AND",["custrecord_pri_qm_queue_name",search.Operator.IS,qName]
				                  	,"AND",["custrecord_pri_qm_complete",search.Operator.IS,false]
				                  	,"AND",["formulanumeric: CASE WHEN {custrecord_pri_qm_next_attempt} <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END", search.Operator.EQUALTO, 1]
				                ],
						columns: [
						          search.createColumn({name: "custrecord_pri_qm_priority", sort: search.Sort.ASC}),
						          search.createColumn({name: "custrecord_pri_qm_next_attempt", sort: search.Sort.ASC}),
						          "custrecord_pri_qm_version"
						         ]
				}).run().getRange(0,10);
				
				log.debug(funcName, "Found " + ss.length + " potential rows");
				
              	minutesToWait = minutesToWait || MINUTES_TO_WAIT;
              
				for (var i = 0; i < ss.length; i++) {

					log.debug(funcName, "Considering row " + (i+1) + " id " + ss[i].id);
					
					try {
						var Q = record.load({type: SCRIPT_QUEUE_RECORD_NAME, id: ss[i].id});

						// if the record is now complete, or if it has been changed since we got it in the search, then we can't use this one
						if (!Q.getValue("custrecord_pri_qm_complete") && Q.getValue("custrecord_pri_qm_version") == ss[i].getValue("custrecord_pri_qm_version")) {								
							var dt = new Date();
							dt.setTime(dt.getTime() + (minutesToWait * MS_PER_MINUTE));
							
							Q.setValue("custrecord_pri_qm_next_attempt",dt);
							Q.setValue("custrecord_pri_qm_in_progress",true);

							Q.setValue("custrecord_pri_qm_version",Q.getValue("custrecord_pri_qm_version")+1);	// increment the version with every save
							Q.save();
							
							var obj = {id: Q.id};
							obj.parms = Q.getValue("custrecord_pri_qm_parameters");
							
							log.debug(funcName, "Queue Record " + Q.id + " assigned.");
							
							return obj;
						} else 
							log.debug(funcName, "Queue Record " + Q.id + " was assigned to another thread in the meantime.  Skipping.");
							
						
					} catch (e1) {
						log.error(funcName, "Failed to update/assign queue entry.  Continuing. " + e1.message);								
					}
				}
					
							
			} catch (e) {		
				log.error(funcName, e);
			}
			
		}

		// ================================================================================================================================

		function getAllQueueEntries(qName) {
			
			var funcName = scriptName + "getAllQueueEntries " + qName;
			
			try {
				
				var ss = search.create({type: SCRIPT_QUEUE_RECORD_NAME,
						filters: [
				                  	["isinactive",search.Operator.IS,false]				                  	
				                  	,"AND",["custrecord_pri_qm_queue_name",search.Operator.IS,qName]
				                  	,"AND",["custrecord_pri_qm_complete",search.Operator.IS,false]
				                  	,"AND",["formulanumeric: CASE WHEN {custrecord_pri_qm_next_attempt} <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END", search.Operator.EQUALTO, 1]
				                ],
						columns: [
						          search.createColumn({name: "custrecord_pri_qm_priority", sort: search.Sort.ASC}),
						          search.createColumn({name: "custrecord_pri_qm_next_attempt", sort: search.Sort.ASC})
						         ]
				});
				
				return ss;
							
			} catch (e) {		
				log.error(funcName, e);
			}
		}

		// ================================================================================================================================

		// tries to load a SPECIFIC queue entry; the entry will only be returned if it is "available" for work; if it is already in progress, or completed, 
		//	then nothing is returned
		//	this is generally used in a Map/Reduce script where getAllQueueEntries was called in the "getInputData" stage, and now each one individually needs
		//	to be confirmed
		
		function getQueueEntry(qId, minutesToWait) {
			
			var funcName = scriptName + "getQueueEntry " + qId;
			
          	minutesToWait = minutesToWait || MINUTES_TO_WAIT;
          
			try {
				var Q = record.load({type: SCRIPT_QUEUE_RECORD_NAME, id: qId});

				if (!Q.getValue("custrecord_pri_qm_complete")) {								
					var dt = new Date();
					dt.setTime(dt.getTime() + (minutesToWait * MS_PER_MINUTE));
					
					Q.setValue("custrecord_pri_qm_next_attempt",dt);
					Q.setValue("custrecord_pri_qm_in_progress",true);
					Q.setValue("custrecord_pri_qm_version",Q.getValue("custrecord_pri_qm_version")+1);	// increment the version with every save

					Q.save();
					
					var obj = {id: Q.id};
					obj.parms = Q.getValue("custrecord_pri_qm_parameters");
					
					log.debug(funcName, "Queue Record " + Q.id + " returned.");
					
					return obj;								
				}
				
			} catch (e1) {
				log.error(funcName, "Failed to update/assign queue entry.  Continuing. " + e1.message);								
			}
							
		}

		// ================================================================================================================================


		function markQueueEntryComplete(qId, notes) {
			var funcName = scriptName + "markQueueEntryComplete " + qId;
			
			try {
				var Q = record.load({type: SCRIPT_QUEUE_RECORD_NAME, id: qId});

				Q.setValue("custrecord_pri_qm_completed_on",new Date());
				Q.setValue("custrecord_pri_qm_in_progress",false);
				Q.setValue("custrecord_pri_qm_next_attempt","");
				Q.setValue("custrecord_pri_qm_complete",true);
				if (notes)
					Q.setValue("custrecord_pri_qm_notes",notes);
				Q.setValue("custrecord_pri_qm_version",Q.getValue("custrecord_pri_qm_version")+1);	// increment the version with every save
				Q.save();
				
				log.debug(funcName, "Done.");				
			} catch (e) {
				log.error(funcName, e);
			}			
		}
		
		// ================================================================================================================================

		function snoozeQueueEntryUntil(qId, snoozeUntil, notes) {
			var funcName = scriptName + "snoozeQueueEntryUntil " + qId + " " + snoozeUntil;
			
			try {
				var Q = record.load({type: SCRIPT_QUEUE_RECORD_NAME, id: qId});

				if (!Q.getValue("custrecord_pri_qm_complete")) {
					Q.setValue("custrecord_pri_qm_next_attempt",snoozeUntil);
					Q.setValue("custrecord_pri_qm_in_progress",false);
					if (notes)
						Q.setValue("custrecord_pri_qm_notes",notes);
					Q.setValue("custrecord_pri_qm_version",Q.getValue("custrecord_pri_qm_version")+1);	// increment the version with every save
					Q.save();					
				}
								
				log.debug(funcName, "Done.");				
			} catch (e) {
				log.error(funcName, e);
			}			
		}
		
		// ================================================================================================================================


		// use this when you are done for now, but the entry needs further processing;
		// parameters and notes will get (optionally) updated, and entry will be flagged for immediate re-scheduling
		function markQueueEntryIncomplete(qId, paramString, notes) {
			var funcName = scriptName + "markQueueEntryIncomplete " + qId + " | " + JSON.stringify(paramString) + " | " + notes;
			
			try {
				var Q = record.load({type: SCRIPT_QUEUE_RECORD_NAME, id: qId});

				if (paramString) {
					if (paramString !== null && typeof paramString === 'object')
						paramString = JSON.stringify(paramString);
					Q.setValue("custrecord_pri_qm_parameters",paramString);					
				} 

				if (notes)
					Q.setValue("custrecord_pri_qm_notes",notes);

				Q.setValue("custrecord_pri_qm_in_progress",false);
				Q.setValue("custrecord_pri_qm_next_attempt",new Date());

				Q.setValue("custrecord_pri_qm_version",Q.getValue("custrecord_pri_qm_version")+1);	// increment the version with every save
				Q.save();
				
				log.debug(funcName, "Done.");				
			} catch (e) {
				log.error(funcName, e);
			}			
		}
		
		// ================================================================================================================================
		

		// use this function if something went wrong, and you want the entry to get reprocessed
		//	the "failed count" will increment, and it will be rescheduled based on how many past failures it had
		
		function abandonQueueEntry(qId, paramString, notes) {
			var funcName = scriptName + "abandonQueueEntry " + qId + " | " + JSON.stringify(paramString) + " | " + notes;
			
			try {
				var Q = record.load({type: SCRIPT_QUEUE_RECORD_NAME, id: qId});
				
				if (paramString) {
					if (paramString !== null && typeof paramString === 'object')
						paramString = JSON.stringify(paramString);
					Q.setValue("custrecord_pri_qm_parameters",paramString);					
				} 

				if (notes)
					Q.setValue("custrecord_pri_qm_notes",notes);

				var failedAttempts = parseInt(Q.getValue("custrecord_pri_qm_failed_attempts") || 0) + 1;
				Q.setValue("custrecord_pri_qm_failed_attempts", failedAttempts);
				Q.setValue("custrecord_pri_qm_in_progress",false);
				
				if (Q.getValue("custrecord_pri_qm_give_up_after_count") > 0 && failedAttempts >= Q.getValue("custrecord_pri_qm_give_up_after_count")) {
					Q.setValue("custrecord_pri_qm_complete", true);
					Q.setValue("custrecord_pri_qm_gave_up", true);		
					Q.setValue("custrecord_pri_qm_completed_on",new Date());
				} else {					
					// the more times we failed, the longer we wait to try again, up to a max of 60 minutes
					var minutesToWait = Math.min(Math.pow(failedAttempts, 2), 360);
					
					// and if we have failed more than a couple of times, then we lower the priority of this entry to the lowest
					if (failedAttempts > 2)
						Q.setValue("custrecord_pri_qm_priority", 9);
					
					var dt = new Date();
					dt.setTime(dt.getTime() + (MS_PER_MINUTE  * minutesToWait));		// wait before trying again
					Q.setValue("custrecord_pri_qm_next_attempt", dt);		
				}
				
				Q.setValue("custrecord_pri_qm_version",Q.getValue("custrecord_pri_qm_version")+1);	// increment the version with every save
				Q.save();
				
				log.debug(funcName, "Queue Record Updated.");
			} catch (e) {
				log.error(funcName, e);
			}			
		}
		
		// ================================================================================================================================

		// do this when you only want to update the notes or parameters, and nothing else
		//		this can be done "in a loop" where you are processing the queue, and you want the parameters to reflect how much work was done so far
		function updateQueueEntry(qId, paramString, notes) {
			var funcName = scriptName + "updateQueueEntry " + qId + " | " + JSON.stringify(paramString) + " | " + notes;
			
			try {
				var Q = record.load({type: SCRIPT_QUEUE_RECORD_NAME, id: qId});

				// we are updating notes or parameters; otherwise there is nothing to do
				if (!paramString && !notes)
					return;
				
				if (paramString) {
					if (paramString !== null && typeof paramString === 'object')
						paramString = JSON.stringify(paramString);
					Q.setValue("custrecord_pri_qm_parameters",paramString);					
				} 

				if (notes)
					Q.setValue("custrecord_pri_qm_notes",notes);

				Q.setValue("custrecord_pri_qm_version",Q.getValue("custrecord_pri_qm_version")+1);	// increment the version with every save
				Q.save();
				
				log.debug(funcName, "Queue Record Updated.");
			} catch (e) {
				log.error(funcName, e);
			}			
		}
		
		// ================================================================================================================================

		function scheduleBackgroundTask (scriptId) {
			var funcName = scriptName + "scheduleBackgroundTask " + scriptId;
			
			try {					
				var scriptTask = task.create({'taskType': task.TaskType.SCHEDULED_SCRIPT});
	            scriptTask.scriptId = scriptId;
	            var scriptTaskId = scriptTask.submit();

	            log.debug(funcName, "Task Started");							
			} catch(e) {
				// log.error(funcName, "Failed to schedule script: " + e);
			}
        }

		// ================================================================================================================================

		return {
			addQueueEntry : 			addQueueEntry,
			addQueueEntries:			addQueueEntries,
			getNextQueueEntry : 		getNextQueueEntry,
			getAllQueueEntries:			getAllQueueEntries, 		// generally used by Map/Reduce scripts to retrieve ALL available entries
			getQueueEntry : 			getQueueEntry,				//		the Map/Reduce then calls this on each row to confirm that it is still not complete, etc.
			markQueueEntryComplete : 	markQueueEntryComplete,		// if you have successfully processed the queue entry
			markQueueEntryIncomplete : 	markQueueEntryIncomplete,	// if you haven't completed the work, but nothing went wrong
			
			snoozeQueueEntryUntil:		snoozeQueueEntryUntil,		// sets the "next attempt" to some future date because the entry is not really ready to be processed yet		
			
			updateQueueEntry : 			updateQueueEntry,			// just update notes and/or parameters
			
			abandonQueueEntry : 		abandonQueueEntry			// if you haven't completed due to an error
			
		}

	}	

);