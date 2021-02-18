//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * this script can be generically deployed against any record type; it is used to pre-fill data on a CREATE event (or EDIT, though less common)
 * 		for example, if the url contains paymentmethod=2&amount=100 then the beforeLoad will try to do a setValue("paymentmethod",2) and setValue("amount",100)
 * 
 */

define(['N/record'],
				
		function(record) {
	
			var scriptName = "pri_UE_loadURLParameters.";

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    	
		    	try {
	    			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
	    				var parms = context.request.parameters;
	    				
	    				if (parms) {
	        				var keys = Object.keys(parms);
	        				if (keys)
	        					for (var i = 0; i < keys.length; i++) {
	        						try {
		        						log.debug(funcName, "Setting field [" + keys[i] + " to [" + parms[keys[i]] + "]");
		        						context.newRecord.setValue(keys[i], parms[keys[i]]);    						        							
	        						} catch (e1) {
	        							log.error(funcName, "Unable to set field " + keys[i] + " to value " + parms[keys[i]] + ": " + e1);
	        						}
	        					}
	    				}
	    			}		    		
		    	} catch (e) {
		    		log.error(funcName, e);
		    	}
		    	
		                        			
			} // beforeLoad
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		return {
			beforeLoad: beforeLoad			
		}
});

