//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_MR_EvaluateRecord.js
//Description:	Prolecto Record State Manager: Map/Reduce Script to evaluate any record that is passed to it via the Script Parameter Saved Search 
//Developer: 	Boban
//Date: 		Aug 2018
//------------------------------------------------------------------


define(['N/runtime','N/record','N/error','N/search','N/plugin','./PRI_RSM_Constants','./PRI_RSM_Engine'],
		
	function(runtime,record,error,search,plugin,rsmConstants,rsmEngine) {

	var scriptName = "PRI_RSM_MR_EvaluateRecord.";
		
    function getInputData() {

		var funcName = scriptName + "getInputData";
		
		var searchObj = runtime.getCurrentScript().getParameter({'name':'custscript_pri_rsm_mr_search_obj'});

		if (searchObj) {
			// this is a long text string which is a JSON representation of a search; this gives great flexibility, as calling script can run this Map/Reduce and pass it any kind of search on-the-fly
			log.debug(funcName, "Process is starting with search DEF " + searchObj);					
			recSearch = search.create(JSON.parse(searchObj));			
		} else {
			var searchId = runtime.getCurrentScript().getParameter({'name':'custscript_pri_rsm_mr_search'});			
			log.debug(funcName, "Process is starting with search ID " + searchId); 			
			var recSearch = search.load({id: searchId});			
		}		
			
		return recSearch;
		
	}
	
	
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map " + context.key;
    	
    	// log.audit(funcName, context);
    
    	var obj = JSON.parse(context.value);    	

    	var REC = record.load({type: obj.recordType, id: obj.id});
		
		var rsm = rsmEngine.createRecordStateManager(REC);      
		rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.ALL_RULES);

		context.write(obj.id, null); 
		
		//     	context.write(trustId, null);   

	}
		
	// ================================================================================================================================


    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	var errorMsgs = extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));

    	
    	var recsUpdated = 0;
    	summary.output.iterator().each(function (key, value) {
    		recsUpdated++;  
    		return true; 
    	}); 
    	
    	log.debug(funcName, recsUpdated + " record(s) processed.");
    	
    	log.debug(funcName, "Exiting");    	
    }

	// ================================================================================================================================
	// ================================================================================================================================

	function extractMapReduceErrorMessages(summary) {
		var errorMsgs = [];
		
    	var inputSummary = summary.inputSummary;
    	if (inputSummary.error) {
    		var msg = "STAGE=input" + " ERROR=" + inputSummary.error;
    		errorMsgs.push(msg);
    	}
    	
    	var a = extractErrorsFromStage("map", summary.mapSummary);
    	if (a.length > 0)
    		errorMsgs.push(a);

    	a = extractErrorsFromStage("reduce", summary.reduceSummary);
    	if (a.length > 0)
    		errorMsgs.push(a);

    	return errorMsgs;
	}
	
	function extractErrorsFromStage(stage, summary) {
    	var errorMsgs = [];
    	summary.errors.iterator().each(function(key, value) {
    		// var msg = 'Unable to process staging record ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
    		var msg = "STAGE=" + stage + + " KEY=" + key + " ERROR=" + JSON.parse(value).message;	    		
    		errorMsgs.push(msg);
    		return true;
    	});

    	return errorMsgs;
	}


	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================


    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

}
);
