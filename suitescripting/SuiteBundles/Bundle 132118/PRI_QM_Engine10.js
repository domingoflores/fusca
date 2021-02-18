//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------



/*
 * 
 * This script implements the Prolecto Queue Manager for SuiteScript 1.0
 * 
 * see accompanying sample file for usage examples
 * 
 */


"use strict";

var scriptName = "PRI_QM_Engine10.";

var SCRIPT_QUEUE_RECORD_NAME = "customrecord_pri_qm_queue";

var MS_PER_MINUTE = 60000;

//================================================================================================================================

function addQueueEntry(queueName, paramString, doNotRunUntil, preventDuplicates, scheduledScriptId, priority) {
	
	var funcName = scriptName + "addQueueEntry " + queueName + " | " + paramString + " | " + doNotRunUntil;
	
	try {

		nlapiLogExecution("DEBUG",funcName, "Starting");

		var qObj = {queueName: "", params: "", doNotRunUntil: null, preventDuplicates: false, priority: null, scheduledScriptId: null};

		var REC = nlapiCreateRecord(SCRIPT_QUEUE_RECORD_NAME);
		
		var timeZone = getTimeZone();

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
		
		REC.setFieldValue("custrecord_pri_qm_queue_name", qObj.queueName);
		REC.setFieldValue("custrecord_pri_qm_parameters", qObj.params);
		if (qObj.doNotRunUntil)
			setDateTimeField(REC,"custrecord_pri_qm_next_attempt",new Date(qObj.doNotRunUntil)); 			
			// REC.setDateTimeValue("custrecord_pri_qm_next_attempt",nlapiDateToString(new Date(qObj.doNotRunUntil),"datetimetz"), timeZone);
		
		if (qObj.priority)
			REC.setFieldValue("custrecord_pri_qm_priority", qObj.priority);
		
		if (qObj.preventDuplicates) {
			var dupeId = queueEntryExists(qObj.queueName, qObj.params);
			if (dupeId) {
				// REC.setDateTimeValue("custrecord_pri_qm_completed_on",nlapiDateToString(new Date(),"datetimetz"), timeZone);
				setDateTimeField(REC,"custrecord_pri_qm_completed_on",new Date()); 			
				
				REC.setFieldValue("custrecord_pri_qm_complete", "T");
				REC.setFieldValue("custrecord_pri_qm_next_attempt", "");
				REC.setFieldValue("custrecord_pri_qm_notes", "Queue entry would have been a duplicate with ID " + dupeId);
				
				// no need to schedule a background task
				qObj.scheduledScriptId = null;
			}					
		}
		
		var qId = nlapiSubmitRecord(REC);
		
		nlapiLogExecution("DEBUG",funcName, "Row " + qId + " added to queue.");
		
		if (qObj.scheduledScriptId) 
			scheduleBackgroundTask(qObj.scheduledScriptId);
		
		return qId;
		
	} catch (e) {		
		nlapiLogExecution("ERROR",funcName, e);
		return;
	}

}


// ================================================================================================================================

function queueEntryExists(qName, paramString) {
	
	var filters = [];		
	filters.push(new nlobjSearchFilter("isinactive",null,"is","F"));
	filters.push(new nlobjSearchFilter("custrecord_pri_qm_queue_name",null,"is",qName));
	filters.push(new nlobjSearchFilter("custrecord_pri_qm_complete",null,"is","F"));
	filters.push(new nlobjSearchFilter("custrecord_pri_qm_parameters",null,"is",paramString));

	var searchResults = nlapiSearchRecord(SCRIPT_QUEUE_RECORD_NAME, null, filters) || [];

	if (searchResults.length > 0)
		return searchResults[0].getId();	
}

// ================================================================================================================================
		

function getNextQueueEntry(qName) {

	var MINUTES_TO_WAIT = 10;		// how many minutes a row should remain "assigned" before we consider it abandoned and assign it to someone else
	
	var funcName = scriptName + "getNextQueueEntry " + qName;
	
	try {

		var timeZone = getTimeZone();

		var filters = [
   		   ["isinactive","is","F"]
   		   ,"AND",["custrecord_pri_qm_queue_name","is",qName]
		   ,"AND",["custrecord_pri_qm_complete","is","F"]
		   ,"AND",["formulanumeric: CASE WHEN {custrecord_pri_qm_next_attempt} <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END","equalto","1"] 
		]; 

		/*
		filters.push(new nlobjSearchFilter("isinactive",null,"is","F"));
		filters.push(new nlobjSearchFilter("custrecord_pri_qm_queue_name",null,"is",qName));
		filters.push(new nlobjSearchFilter("custrecord_pri_qm_complete",null,"is","F"));

		var f = new nlobjSearchFilter("formulanumeric",null,"equalto",1);
		f.setFormula("CASE WHEN {custrecord_pri_qm_next_attempt} <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END");
		filters.push(f);
		*/
		
		var columns = [];
		
		columns.push(new nlobjSearchColumn("custrecord_pri_qm_priority").setSort());
		columns.push(new nlobjSearchColumn("custrecord_pri_qm_next_attempt").setSort());

		var ss = nlapiSearchRecord(SCRIPT_QUEUE_RECORD_NAME, null, filters, columns) || [];
				
		nlapiLogExecution("DEBUG",funcName, "Found " + ss.length + " potential rows");
		
		for (i = 0; i < ss.length; i++) {

			nlapiLogExecution("DEBUG",funcName, "Considering row " + (i+1) + " id " + ss[i].id);
			
			try {
				var Q = nlapiLoadRecord(SCRIPT_QUEUE_RECORD_NAME, ss[i].getId());

				if (Q.getFieldValue("custrecord_pri_qm_complete") != "T") {
					if (Q.getFieldValue("custrecord_pri_qm_next_attempt") == ss[i].getValue("custrecord_pri_qm_next_attempt")) {
						var dt = new Date();
						dt.setTime(dt.getTime() + (MINUTES_TO_WAIT * MS_PER_MINUTE));
						
						setDateTimeField(Q,"custrecord_pri_qm_next_attempt",dt); 
						// Q.setDateTimeValue("custrecord_pri_qm_next_attempt",nlapiDateToString(dt,"datetimetz"), timeZone);
						Q.setFieldValue("custrecord_pri_qm_in_progress","T");

						nlapiSubmitRecord(Q);
						
						var obj = {id: Q.id};
						obj.parms = Q.getFieldValue("custrecord_pri_qm_parameters");
						
						nlapiLogExecution("DEBUG",funcName, "Queue Record " + Q.id + " assigned.");
						
						return obj;
						
					} else
						nlapiLogExecution("DEBUG", funcName, "Entry was already started by another thread:  S=" + ss[i].getValue("custrecord_pri_qm_next_attempt") + ";  Q=" + Q.getFieldValue("custrecord_pri_qm_next_attempt")); 					
												
				}
				
			} catch (e1) {
				nlapiLogExecution("ERROR",funcName, "Failed to update/assign queue entry.  Continuing. " + e1.message);								
			}
		}
			
					
	} catch (e) {		
		nlapiLogExecution("ERROR",funcName, e);
	}
	
}


// ================================================================================================================================
		
function markQueueEntryComplete(qId, notes) {
	var funcName = scriptName + "markQueueEntryComplete " + qId;
	
	try {
		
		var timeZone = getTimeZone();

		var Q = nlapiLoadRecord(SCRIPT_QUEUE_RECORD_NAME, qId);

		// Q.setDateTimeValue("custrecord_pri_qm_completed_on",nlapiDateToString(new Date(),"datetimetz"), timeZone);
		setDateTimeField(Q,"custrecord_pri_qm_completed_on",new Date()); 

		Q.setFieldValue("custrecord_pri_qm_in_progress","F");
		Q.setFieldValue("custrecord_pri_qm_next_attempt","");
		Q.setFieldValue("custrecord_pri_qm_complete","T");
		if (notes)
			Q.setFieldValue("custrecord_pri_qm_notes",notes);

		nlapiSubmitRecord(Q);
		
		nlapiLogExecution("DEBUG",funcName, "Done.");				
	} catch (e) {
		nlapiLogExecution("ERROR",funcName, e);
	}			
}

// ================================================================================================================================

// use this when you are done for now, but the entry needs further processing;
// parameters and notes will get (optionally) updated, and entry will be flagged for immediate re-scheduling
function markQueueEntryIncomplete(qId, paramString, notes) {
	var funcName = scriptName + "markQueueEntryIncomplete " + qId + " | " + JSON.stringify(paramString) + " | " + notes;
	
	try {
		
		var timeZone = getTimeZone();

		var Q = nlapiLoadRecord(SCRIPT_QUEUE_RECORD_NAME, qId);

		if (paramString) {
			if (paramString !== null && typeof paramString === 'object')
				paramString = JSON.stringify(paramString);
			Q.setFieldValue("custrecord_pri_qm_parameters",paramString);					
		} 

		if (notes)
			Q.setFieldValue("custrecord_pri_qm_notes",notes);

		Q.setFieldValue("custrecord_pri_qm_in_progress","F");
		// Q.setDateTimeValue("custrecord_pri_qm_next_attempt",nlapiDateToString(new Date(),"datetimetz"), timeZone);
		setDateTimeField(Q,"custrecord_pri_qm_next_attempt",new Date()); 

		nlapiSubmitRecord(Q);
		
		nlapiLogExecution("DEBUG",funcName, "Done.");				
	} catch (e) {
		nlapiLogExecution("ERROR",funcName, e);
	}			
}

// ================================================================================================================================


// use this function if something went wrong, and you want the entry to get reprocessed
//	the "failed count" will increment, and it will be rescheduled based on how many past failures it had

function abandonQueueEntry(qId, paramString, notes) {
	var funcName = scriptName + "abandonQueueEntry " + qId + " | " + JSON.stringify(paramString) + " | " + notes;
	
	try {
		
		var timeZone = getTimeZone();

		var Q = nlapiLoadRecord(SCRIPT_QUEUE_RECORD_NAME, qId);
		
		if (paramString) {
			if (paramString !== null && typeof paramString === 'object')
				paramString = JSON.stringify(paramString);
			Q.setFieldValue("custrecord_pri_qm_parameters",paramString);					
		} 

		if (notes)
			Q.setFieldValue("custrecord_pri_qm_notes",notes);

		var failedAttempts = parseInt(Q.getFieldValue("custrecord_pri_qm_failed_attempts")) + 1;
		// the more times we failed, the longer we wait to try again, up to a max of 60 minutes
		var minutesToWait = Math.min(Math.pow(failedAttempts, 2), 360);
		
		// and if we have failed more than a couple of times, then we lower the priority of this entry to the lowest
		if (failedAttempts > 2)
			Q.setFieldValue("custrecord_pri_qm_priority", 9);
		
		var dt = new Date();
		dt.setTime(dt.getTime() + (MS_PER_MINUTE  * minutesToWait));		// wait before trying again

		// Q.setDateTimeValue("custrecord_pri_qm_next_attempt",nlapiDateToString(dt,"datetimetz"), timeZone);
		setDateTimeField(Q,"custrecord_pri_qm_next_attempt",dt); 
		
		Q.setFieldValue("custrecord_pri_qm_in_progress","F");
		Q.setFieldValue("custrecord_pri_qm_failed_attempts", failedAttempts);

		nlapiSubmitRecord(Q);
		
		nlapiLogExecution("DEBUG",funcName, "Queue Record Updated.");
	} catch (e) {
		nlapiLogExecution("ERROR",funcName, e);
	}			
}

// ================================================================================================================================

// do this when you only want to update the notes or parameters, and nothing else
//		this can be done "in a loop" where you are processing the queue, and you want the parameters to reflect how much work was done so far
function updateQueueEntry(qId, paramString, notes) {
	var funcName = scriptName + "updateQueueEntry " + qId + " | " + JSON.stringify(paramString) + " | " + notes;
	
	try {
		var Q = nlapiLoadRecord(SCRIPT_QUEUE_RECORD_NAME, qId);

		// we are updating notes or parameters; otherwise there is nothing to do
		if (!paramString && !notes)
			return;
		
		if (paramString) {
			if (paramString !== null && typeof paramString === 'object')
				paramString = JSON.stringify(paramString);
			Q.setFieldValue("custrecord_pri_qm_parameters",paramString);					
		} 

		if (notes)
			Q.setFieldValue("custrecord_pri_qm_notes",notes);

		nlapiSubmitRecord(Q);
		
		nlapiLogExecution("DEBUG",funcName, "Queue Record Updated.");
	} catch (e) {
		nlapiLogExecution("ERROR",funcName, e);
	}			
}

// ================================================================================================================================

function scheduleBackgroundTask (scriptId) {
	var funcName = scriptName + "scheduleBackgroundTask " + scriptId;
	
	try {			
		nlapiScheduleScript(scriptId);		
        nlapiLogExecution("DEBUG",funcName, "Task Started");							
	} catch(e) {
		nlapiLogExecution("DEBUG",funcName, "Failed to schedule script: " + e);
	}
}

// ================================================================================================================================


function setDateTimeField(REC, fieldName, dt) {
	 var yyyy = dt.getFullYear().toString();
	 var mm = (dt.getMonth() + 1).toString();
	 var dd = dt.getDate().toString();
	 var time = formatAMPM(dt);
	 var val = (mm[1] ? mm : mm[0]) + '/' + (dd[1] ? dd : dd[0]) + '/' + yyyy + " " + time;
	 var conf = nlapiLoadConfiguration('userpreferences');
	 var tz = conf.getFieldValue('TIMEZONE');
	 // The current date and time captured within the server is set to PST that is why we need to set it first to "America/Los_Angeles"
	 // "custbody_orig_date" is the internal id of the custom field with field type of "Date/Time"
	 
	 REC.setDateTimeValue(fieldName, val, 'America/Los_Angeles');
	 // We then set the Time Zone to the User's preferred
	 REC.setDateTimeValue(fieldName, REC.getDateTimeValue(fieldName), tz);
}

function formatAMPM(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
	return strTime;
} 




function getTimeZone() {

	if (nlapiGetUser() == -4)
		return 5;				// 5 = Los Angeles
	else {
		var pref = nlapiLoadConfiguration("userpreferences");
		return pref.getFieldValue("TIMEZONE");		
	}
	
}


