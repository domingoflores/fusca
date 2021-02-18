//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

//------------------------------------------------------------------------------------------------------------
//Script: 		PRI_MR_Touch.js
//Description:	A Map/Reduce version of our TOUCH utility.  This script takes either a Saved Search, or Search 
//				as parameters to identify which records should be touched
//Developer: 	Boban
//Date: 		June 2019
//------------------------------------------------------------------------------------------------------------


define(['N/runtime','N/record','N/error','N/search','N/plugin', '/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,plugin,priLibrary) {

	var scriptName = "PRI_MR_MassUpdate.";
		
    function getInputData() {

		var funcName = scriptName + "getInputData";
		
		var searchDef = runtime.getCurrentScript().getParameter({'name':'custscript_pri_mr_mu_search_def'});

		if (searchDef) {
			// this is an actual saved search, so we just 
			log.debug(funcName, "Process is starting with search DEF " + searchDef);					
			
			var obj = JSON.parse(searchDef);
			
			recSearch = search.create(obj);			
		} else {
			var searchId = runtime.getCurrentScript().getParameter({'name':'custscript_pri_mr_mu_search'});			
			log.debug(funcName, "Process is starting with search ID " + searchId); 			
			var recSearch = search.load({id: searchId});			
		}		

		var fieldsToUpdate = runtime.getCurrentScript().getParameter({'name':'custscript_pri_mr_mu_field_list'});

		log.debug(funcName, "Updating fields using the following parameter: " + fieldsToUpdate);
		
		
		/*
		 * this is a setting that looks something like this:  fieldName=value|fieldName=value
		 * 
		 * real examples:
		 * 			orderstatus=A|total=75|name="John Smith"
		 *
		 * 
		 * NOTES:
		 * 	pipe is the delimiter between fields
		 * 	a field value doesn't need to have quotes around it ... the value will simply be everything after the equal sign, and before the next pipe (or end)
		 * 	values within curly braces will be assumed to be field substitutions (eg lastname={firstname})
		 * 	to specify a formula, use a value of formula:  eg: total=formula:{total}-5.0
		 *
		 */
		
		return recSearch;
		
	}
	
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map ";
    
    	
    	try {
        	var obj = JSON.parse(context.value);    	

        	funcName +=  obj.recordType + " " + context.key;
        	
    		var fieldUpdateParm = runtime.getCurrentScript().getParameter({'name':'custscript_pri_mr_mu_field_list'});
        	
    		var useXedit = runtime.getCurrentScript().getParameter({'name':'custscript_pri_mr_mu_use_xedit'});

    		// in case we need to look up other values
			var REC = record.load({type: obj.recordType, id: obj.id});

   			var fieldsToUpdate = {};
    		
    		var fieldUpdateList = fieldUpdateParm.split("|")
    		for (var i = 0; i < fieldUpdateList.length; i++) {
    			var fieldData = fieldUpdateList [i];
    			
    			var p = fieldData.indexOf("=");
    			
    			if (p < 2)
    				throw "Invalid syntax found: " + fieldData;
    			
    			var fieldName = fieldData.substring(0,p).trim();
    			var fieldValue = fieldData.substring(p+1).trim();
    			
    			if ((fieldValue.startsWith("'") && fieldValue.endsWith("'")) || (fieldValue.startsWith('"') && fieldValue.endsWith('"')))
    				fieldValue = fieldValue.substring(1,fieldValue.length-1);
    			
    			fieldValue = replaceVariables(REC, fieldValue);

    			if (fieldValue.startsWith("formula:")) {
    				fieldValue = eval(fieldValue.substring(8));    				
    			}
    				    			

    			// now try to deal with special fields DATE, DATETIME, and CHECKBOX
    			
    			var fld = REC.getField(fieldName);
    			
    			if (fld.type == "checkbox") {
    				if (fieldValue === true || fieldValue == "T" || fieldValue == "True") {
    	   				fieldsToUpdate[fieldName] = true;
    	   				if (!useXedit)
    	   					REC.setValue(fieldName, true);
    				}
    				else {
    	   				fieldsToUpdate[fieldName] = false;    					
    	   				if (!useXedit)
    	   					REC.setValue(fieldName, false);
    				}    					
    			} else if (fld.type == "date") {
    				fieldValue = new Date(fieldValue);
    				
   	   				fieldsToUpdate[fieldName] = format.format({value: fieldValue, type: format.Type.DATE})
   	   				if (!useXedit)
   	   					REC.setValue(fieldName, fieldValue);
    			} else if (fld.type == "datetime") {
    				fieldValue = new Date(fieldValue);
    				
   	   				fieldsToUpdate[fieldName] = format.format({value: fieldValue, type: format.Type.DATETIME})
   	   				if (!useXedit)
   	   					REC.setValue(fieldName, fieldValue);
    			} else {
   	   				fieldsToUpdate[fieldName] = fieldValue;
   	   				if (!useXedit)
   	   					REC.setValue(fieldName, fieldValue);    				
    			}
   				
    		}
    		
    		
			if (!useXedit)
				log.debug(funcName, "XEDITING using the following values: " + JSON.stringify(fieldsToUpdate));
			else
				log.debug(funcName, "UPDATING using the following values: " + JSON.stringify(fieldsToUpdate));
				
    		if (useXedit)
    			record.submitFields({type: obj.recordType, id: obj.id, values: fieldsToUpdate}); 
    		else
    			REC.save();

        	
        	log.audit(funcName, "Updated " + JSON.stringify(fieldsToUpdate)); 
        	
    		context.write(obj.id, null); 
    		    		
    	} catch (e) {
    		log.error(funcName, e);
    	}
	}
		
	// ================================================================================================================================

    function replaceVariables(REC, fieldValue) {
		var fieldRefs = fieldValue.match(/{.*?}/g);

		var s = fieldValue;

		if (fieldRefs) {
			for (var i = 0; i < fieldRefs.length; i++) {
				var fieldName = fieldRefs[i].substring(1,fieldRefs[i].length-1);
				var fieldValue = REC.getValue(fieldName);
				s = s.replace(fieldRefs[i],fieldValue);
			}
		}

		return s; 
    }
    
	// ================================================================================================================================

    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));

    	
    	var recsUpdated = 0;
    	summary.output.iterator().each(function (key, value) {
    		recsUpdated++;  
    		return true; 
    	}); 
    	
    	log.debug(funcName, recsUpdated + " record(s) updated.");
    	
    	log.debug(funcName, "Exiting");    	
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
