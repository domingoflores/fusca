//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * finds all the custom record types, ...
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
	
    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Starting"); 
				
		var ss = search.create({
			type:		"customrecordtype",
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 ],
			columns:	["internalid","name","scriptid"]
		})
				
		return ss;		
	}
	
	
	// ================================================================================================================================

    function reduce(context) {
    	
    	var funcName = scriptName + "map " + context.key;
    	    	
    	try {
    		
    		// log.debug(funcName, context); 
    		
        	var obj = JSON.parse(context.values[0]);

        	log.debug(funcName, obj);  
        	
            
            var REC = record.load({type: "customrecordtype", id: obj.values.internalid.value});

            
            for (var i = 0; i < REC.getLineCount({sublistId: "customfield"}); i++) {
         	   var fieldId = REC.getSublistValue({sublistId: "customfield", fieldId: "fieldid", line: i}); 
                            
         	   var FLD = record.load({type: "customrecordcustomfield", id: fieldId});
         	   
         	   if (FLD.getValue("searchdefault"))
         		   log.audit(funcName, "Custom Record '" + obj.values.name + "' (" + obj.values.scriptid + ") Field '" + FLD.getValue("label") + "' uses Saved Search '" + FLD.getText("searchdefault") + "'"); 

         	   // var fieldType = FLD.getValue("fieldtype"); 

            }

            
    	} catch (e) {
    		log.error(funcName, e);    		
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
