//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the DEAL POINT STUDY custom record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary) {
	
			var scriptName = "SRS_UE_DealPointStudy.";
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	// once we establish a relationship, don't allow user to change the key information

				var REC = context.newRecord;

    			if (context.type != context.UserEventType.XEDIT) {
    				if (REC.getValue("custrecord_etc_transaction_structures").length > 0) {
    					REC.setValue("custrecord_etc_transaction_structure", REC.getValue("custrecord_etc_transaction_structures")[0]); 
    					log.debug(funcName, "moving 1 of multi to single"); 
    				} else {
    					log.debug(funcName, "moving single " + REC.getValue("custrecord_etc_transaction_structure") + " to multi");
    					REC.setValue("custrecord_etc_transaction_structures", [REC.getValue("custrecord_etc_transaction_structure")]); 
    				}
    				
    				
    				log.debug(funcName, "multi is now " + JSON.stringify(REC.getValue("custrecord_etc_transaction_structures"))); 
    				
    			}

    			
    			if (context.type == context.UserEventType.EDIT) {
    				// disable the fields that were imported, if any
    				if (REC.getValue("custrecord_dp_imported_fields")) {
    					var fieldObj = JSON.parse(REC.getValue("custrecord_dp_imported_fields")); 
    					
    					var keys = Object.keys(fieldObj); 

    					if (keys)
        					for (var i = 0; i < keys.length; i++) 
        						if (fieldObj[keys[i]]) 
        							priLibrary.disableFormFields(keys[i], context.form);         					
    				}
    			}
    			    			
			}


    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeSubmit(context) {

		    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	// once we establish a relationship, don't allow user to change the key information

				var REC = context.newRecord;

    			if (context.type == context.UserEventType.DELETE) {
    				return; 
    			}

    			if (context.type != context.UserEventType.XEDIT) {
    				if (REC.getValue("custrecord_etc_transaction_structures").length > 0)
    					REC.setValue("custrecord_etc_transaction_structure", REC.getValue("custrecord_etc_transaction_structures")[0]); 

    			}
    			    			
			/*  ATP-1575 removed links between "Deal Point Source" and "DPS Enterprise Client" sublist.
			
				if (priLibrary.isSelectFieldItemSelected(REC,"custrecord_dp_source",srsConstants.DPS_SOURCE.ENTERPRISE_CLIENT)) {
					log.debug("is selected");
            		if (REC.getLineCount({sublistId: "recmachcustrecord_dpsec_dps"}) == 0) {
            			throw "When the DEAL POINT SOURCE includes 'Enterprise Client,' you must add at least one Enterprise Client record.";  
            		}
            	} else { 
					log.debug("not selected");
            		if (REC.getLineCount({sublistId: "recmachcustrecord_dpsec_dps"}) > 0) {
            			throw "You may not link Enterprise Clients to this record unless the DEAL POINT SOURCE includes 'Enterprise Client'";  
            		}
            	}
    			
            	
            	// if the only SOURCE is ENTERPRISE CLIENT, then we don't require the DEAL field
            	if (REC.getValue("custrecord_dp_source").length == 1 && priLibrary.isSelectFieldItemSelected(REC,"custrecord_dp_source",srsConstants.DPS_SOURCE.ENTERPRISE_CLIENT))
            		; // do nothing
            	else
            		if (!REC.getValue("custrecord_deal")) {
            			throw "When the DEAL POINT SOURCE includes anything OTHER THAN 'Enterprise Client,' then you must specify the DEAL."; 
            		}
				*/
    			
			}
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		return {
			beforeLoad: 	beforeLoad,
			beforeSubmit:	beforeSubmit
		}
});

