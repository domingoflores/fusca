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
 * code related to the Invoice record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary) {
	
			var scriptName = "SRS_UE_EscrowAgentStatementBatch.";
			
			const EDIT_ERROR_MSG = "Only users from GLOBAL BUSINESS DEVELOPMENT, ACQUIOM OPERATIONS, or DATA MANAGEMENT & RELEASE are authorized to edit this record."; 
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	log.debug(funcName, "Starting"); 
		    	
		    	var REC = context.newRecord; 
		    	

				priLibrary.preventEdit(context, userIsAuthorizedToEdit(), EDIT_ERROR_MSG); 
		    	
		    	
    			if (context.type == context.UserEventType.VIEW) {
			if (userIsAuthorizedToEdit()) {
    				if (REC.getValue("custrecord_easb_status") == srsConstants.AEA_STATEMENT_BATCH_STATUS.GENERATED) {
    					var buttonURL = url.resolveScript({
                        scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                        deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                        returnExternalUrl: 	false,
                        params:{"action": "aea_Statement_mass_approve", "batchId": REC.id}});

    					var scr = 'if (confirm("Are you sure you want to MASS APPROVE all of the GENERATED detail records?")) window.location.href="' + buttonURL + '"; console.log';
                 
	    				context.form.addButton({
	                        id : "custpage_aea_approve",
	                        label : "Mass Approve",
	                        functionName: scr
	                    });    				                    	    					


    					var buttonURL = url.resolveScript({
                            scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                            deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                            returnExternalUrl: 	false,
                            params:{"action": "aea_Statement_mass_reject", "batchId": REC.id}});

        				var scr = 'if (confirm("Are you sure you want to MASS REJECT all of the GENERATED detail records?")) window.location.href="' + buttonURL + '"; console.log';
                     
        				context.form.addButton({
        					id : "custpage_aea_reject",
        					label : "Mass Reject",
        					functionName: scr
    	                });    				                    	    					
    				}
    				
        				
    				if (REC.getValue("custrecord_easb_status") == srsConstants.AEA_STATEMENT_BATCH_STATUS.GENERATED || REC.getValue("custrecord_easb_status") == srsConstants.AEA_STATEMENT_BATCH_STATUS.READY_TO_SEND) {    				
    					var buttonURL = url.resolveScript({
                            scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                            deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                            returnExternalUrl: 	false,
                            params:{"action": "aea_Statement_cancel", "batchId": REC.id}});

        				var scr = 'if (confirm("Are you sure you want to CANCEL this batch?  Cancelling will prevent you from taking any more actions on this batch.")) window.location.href="' + buttonURL + '"; console.log';
                     
        				context.form.addButton({
        					id : "custpage_aea_cancel",
        					label : "Cancel Batch",
        					functionName: scr
    	                });    				                    	    					
    				}
    				
    				
    				var showSendButton = false;
    				
    				log.debug(funcName, "status=" + srsConstants.AEA_STATEMENT_BATCH_STATUS.READY_TO_SEND); 
    				
    				if (REC.getValue("custrecord_easb_status") == srsConstants.AEA_STATEMENT_BATCH_STATUS.READY_TO_SEND) 
    					showSendButton = true; 

    				/* for some reason, this is not working ... don't have time to investigate, so using slower method instead
    				if (REC.getValue("custrecord_easb_status") != srsConstants.AEA_STATEMENT_BATCH_STATUS.CANCELLED)  {
    					log.debug(funcName, "checking lines.  count=" + REC.getLineCount({sublistId: "recmachcustrecord_easd_batch_id"})); 
    					for (var i = 0; i < REC.getLineCount({sublistId: "recmachcustrecord_easd_batch_id"}); i++) {
    						log.debug(funcName, "line " + i + " status=" + REC.getSublistValue({sublistId: "recmachcustrecord_easd_batch_id", fieldId: "custrecord_easd_status", line: i})); 
    						if (REC.getSublistValue({sublistId: "recmachcustrecord_easd_batch_id", fieldId: "custrecord_easd_status", line: i}) == srsConstants.AEA_STATEMENT_DETAIL_STATUS.APPROVED)
    							showSendButton = true;     					
    					}
    				}
    				*/
    				
    				if (!showSendButton && REC.getValue("custrecord_easb_status") != srsConstants.AEA_STATEMENT_BATCH_STATUS.CANCELLED)  {
	    			
	            		var statusSearch = search.create({
	           			   type: 		"customrecord_escrow_agent_stmt_detail",
	           			   filters:		[
	           			           		 	["isinactive","is","F"]
	           			           		 	,"AND",["custrecord_easd_batch_id",search.Operator.ANYOF,[REC.id]]
	           			           		 	,"AND",["custrecord_easd_status",search.Operator.ANYOF,[srsConstants.AEA_STATEMENT_DETAIL_STATUS.APPROVED]]
	           			           		 	]
	              		}).run().getRange(0,1);
	            		if (statusSearch.length > 0)
	            			showSendButton = true; 
    				}	            		
	    				    				
    				if (showSendButton) {
    					var buttonURL = url.resolveScript({
                        scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                        deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                        returnExternalUrl: 	false,
                        params:{"action": "aea_Statement_send", "batchId": REC.id}});

    					var scr = 'if (confirm("Are you sure you want to SEND all of the APPROVED detail records?")) window.location.href="' + buttonURL + '"; console.log';
                 
	    				context.form.addButton({
	                        id : "custpage_aea_send",
	                        label : "Send",
	                        functionName: scr
	                    });    				                    	    					
    				}
    				
    				
    				
    				if (REC.getValue("custrecord_easb_status") == srsConstants.AEA_STATEMENT_BATCH_STATUS.REJECTED) {
    					var buttonURL = url.resolveScript({
    						scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
    						deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
    						returnExternalUrl: 	false,
    						params:{"action": "aea_Statement_regenerate", "batchId": REC.id}
    					});

    					var scr = 'if (confirm("Are you sure you want to REGENERATE all new detail records?  Existing reccords will remain but will not be acted on?")) window.location.href="' + buttonURL + '"; console.log';
                 
	    				context.form.addButton({
	                        id : "custpage_aea_regen",
	                        label : "Regenerate",
	                        functionName: scr
	                    });    				                    	    					
    				}

    				}

    				
    				
    			}  // VIEW mode

			}
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeSubmit(context) {

		    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	if (!userIsAuthorizedToEdit())
		    		throw EDIT_ERROR_MSG;  
		    	
			}
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function userIsAuthorizedToEdit() {
	        	return (runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR || runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS || runtime.getCurrentUser().department == srsConstants.DEPT.DATA_MANAGEMENT_AND_RELEASE);	        	
			}
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		return {
			beforeLoad: 	beforeLoad,
			beforeSubmit: 	beforeSubmit
		}
});

