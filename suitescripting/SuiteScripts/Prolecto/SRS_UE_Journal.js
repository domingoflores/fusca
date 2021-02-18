//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the JOURNAL record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary) {
	
			var scriptName = "SRS_UE_Journal.";
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function afterSubmit(context) {

		    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

		    	
		    	var REC = context.newRecord; 
		    			    	
    			if (context.type == context.UserEventType.CREATE) {

    				if (REC.getValue("createdfrom")) {
    					if (priLibrary.transactionType(REC.getValue("createdfrom")) == record.Type.CUSTOMER_PAYMENT) {
    	    				log.debug(funcName, "Journal is Voiding a Payment.  Removing all linked Payment Allocations for " + REC.getText("createdfrom")); 
    	    				var ss = search.create({
    	    					type:		"customrecord_pmt_allocation",
    	    					filters:	[
    	    					        	 	["custrecord_pa_pmt_transaction",search.Operator.ANYOF,[REC.getValue("createdfrom")]]
    	    					        	 ]
    	    				}).run().getRange(0,1000); 
    	    				
    	    				for (var i = 0; i < ss.length; i++) {
    	    					log.audit(funcName, "Deleting Payment Allocation " + ss[i].id + " because its Payment has been applied to a Journal"); 
    	    					record.delete({type: "customrecord_pmt_allocation", id: ss[i].id}); 
    	    				}    						
    					}    					
    					
    				}
    				
    			}
    			    			
			}

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		return {
			afterSubmit:	afterSubmit
		}
});
