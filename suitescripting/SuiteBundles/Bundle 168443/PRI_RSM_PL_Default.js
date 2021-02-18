//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------


/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType plugintypeimpl
 */


//------------------------------------------------------------------
//Script: 		PRI Record State Manager - Default Plugin
//Description: 
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

define(['N/runtime','N/log','N/record','N/search'],
	function(runtime,log,record,search) {
	
		var scriptName = "PRI_RSM_PL_Default.";
	
		// evaluates a specific rule against a specific record

		function evaluateRule(ruleName, ruleParams, ruleMsg, REC, executionType){
			
			var funcName = scriptName + "evaluateRule " + REC.type + ":" + REC.id + " | " + ruleName;
		
			log.debug(funcName, "starting");
			
			var ruleStatus = {notChecked: false, notApplicable: false, passed: false, message: ruleMsg || ""};
			
			switch(REC.type.toString().toLowerCase() + "." + ruleName.toLowerCase()){
				case "salesorder.firstrule": 
						evaluateFirstRule(ruleStatus, ruleParams, ruleMsg, REC);

        	}
			return ruleStatus;
		}

		/**
		* 1st Rule: xxx
		*
		*/
		function evaluateFirstRule(ruleStatus, ruleParams, ruleMsg, REC) {
			var funcName = scriptName + "evaluateFirstRule " + REC.type + ":" + REC.id + " | " + ruleParams;
			
		}

		
    	/* ======================================================================================================================================== */

		// determines whether this record has been fully processed, and doesn't need to be evaluated any further
		//	return TRUE or FALSE
		function checkComplete(REC) {
			var funcName = scriptName + "checkComplete " + REC.type + ":" + REC.id;

			switch(REC.type.toString().toLowerCase()){
				default:
					log.error(funcName, "script not ready for this record type");
					return true;
			}	

		}
				
    	/* ======================================================================================================================================== */

		// called when all rules have passed (eg passed, overridden, or inapplicable)
		//	this function should then perform whatever action needs to be done, and/or otherwise mark the record complete so that the "checkComplete" function 
		//	will know to return TRUE on the next invocation
		function markComplete(REC) {
			var funcName = scriptName + "markComplete " + REC.type + ":" + REC.id;
			
			switch(REC.type.toString().toLowerCase()){
				default:
					log.error(funcName, "script not ready for this record type");
			}	
		}
		

    	/* ======================================================================================================================================== */

		// called when the RSM engine determines that NOT all rules have passed
		//		this is not a frequently implemented function, but it can be helpful to know that RSM ran, but some rules failed (or were not evaluated yet) 
		function markIncomplete(REC) {
			var funcName = scriptName + "markIncomplete " + REC.type + ":" + REC.id;
			
			switch(REC.type.toString().toLowerCase()){
				default:
					log.debug(funcName, "script not ready for this record type");
			}	
		}
		

    	/* ======================================================================================================================================== */

		
		// called whenever the RSM engine moves one of the status fields to another state
		//	this function may not need to do anything ... it depends on the context
		function changeStatus(REC, statusField, currentStatus, nextStatus, ultimateStatus) {
			var funcName = scriptName + "changeStatus " + REC.type + "/" + REC.id + " | " + statusField + " | " + oldStatus + " | " + newStatus + " | " + finalStatus;
			
		}
		

    	/* ======================================================================================================================================== */

		// called whenever the RSM engine has been asked to manually override a rule; the engine will first call this function, and if the function 
		//		returns TRUE, then RSM will NOT do anythiing (in other words, it will assume that this function has performed the necessary "override"
		//		by changing the underlying data (cleared a checkbox, etc.); 
		//		otherwise (if this function returns anything equivalent to FALSE), RSM will override the rule
		function manualOverride(REC, ruleName) {
			var funcName = scriptName + "manualOverride " + REC.type + ":" + REC.id + " | " + ruleName;

			log.debug(funcName, "Default Implementation");
		}
		
		
    	/* ======================================================================================================================================== */


    return {
        evaluateRule: evaluateRule,        
        checkComplete : checkComplete,
        markComplete : markComplete, 
        changeStatus : changeStatus,
        manualOverride : manualOverride,
        markIncomplete: markIncomplete
    }
});