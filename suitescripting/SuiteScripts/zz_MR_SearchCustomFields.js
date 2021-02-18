//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * loops through all possible custom fields
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/format'],
		
	function(runtime,record,error,search,format) {

	var scriptName = "zz_MR_SearchCustomRecordTypes.";
	
	const MAX_FIELD_ID = 10000;
	
    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Starting with " + MAX_FIELD_ID); 
	
		var fieldIdList = [];
		
		for (var i = 1; i <= MAX_FIELD_ID; i++)
			fieldIdList.push(i);
				
		return fieldIdList;		
	}
	
	
	// ================================================================================================================================

    function reduce(context) {
    	
    	var funcName = scriptName + "map " + context.key;
    	    	
    	try {
    		
    		// log.debug(funcName, context); 
    		
        	var fieldId = context.values[0];
        	
            checkTransactionBodyField(fieldId);
            checkEntityField(fieldId);
    		
            
    	} catch (e) {
    		log.error(funcName, e);    		
    	}
    	
    }

	
	// ================================================================================================================================

    function checkTransactionBodyField(fieldId) {
    	try {
    		var FLD = record.load({type: "transactionbodycustomfield", id: fieldId}); 
    		
    		if (FLD.getValue("searchdefault"))
    			log.audit("TRANSACTION BODY Field " + fieldId,FLD.getValue("label") + " (" + FLD.getValue("scriptid") + ") uses Saved Search '" + FLD.getText("searchdefault") + "'");     			
    			
    	} catch (e) {
    		;    		
    	}
    }
	
	// ================================================================================================================================

    function checkEntityField(fieldId) {
    	var funcName = "checkEntityField " + fieldId;
    	
    	try {
    		var FLD = record.load({type: "entitycustomfield", id: fieldId}); 
    		
    		if (FLD.getValue("searchdefault"))
    			log.audit("ENTITY Field " + fieldId,FLD.getValue("label") + " (" + FLD.getValue("scriptid") + ") uses Saved Search '" + FLD.getText("searchdefault") + "'");     			
    			
    	} catch (e) {
    		// log.error(funcName, e);
    		;
    	}
    }
	
	// ================================================================================================================================


    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	var errorMsgs = extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));

    	log.audit(funcName, "Exiting");    	
    }
    
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
    		// var msg = 'Unable to process staging record ' + key + '.
			// Error was: ' + JSON.parse(value).message + '\n';
    		var msg = "STAGE=" + stage + + " KEY=" + key + " ERROR=" + JSON.parse(value).message;	    		
    		errorMsgs.push(msg);
    		return true;
    	});

    	return errorMsgs;
	}
    
	// ================================================================================================================================


    return {
        getInputData: 	getInputData,
        reduce: 		reduce,
        summarize: 	summarize
    };

}
);
