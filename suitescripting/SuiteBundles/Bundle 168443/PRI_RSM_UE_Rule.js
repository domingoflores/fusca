//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_UE_Rule.js
//Description: 	Prolecto Record State Manager: Performs validation on the PRI RSM Rule record   	
//Developer: 	Boban
//Date: 		Nov 2018
//------------------------------------------------------------------

define(['N/record','N/search','N/error','N/runtime','N/url','./PRI_RSM_Constants'],

    function(record,search,error,runtime,url,rsmConstants) {
		
    	
		var scriptName = "PRI_RSM_UE_Rule.";
		 	               	    
    	/* ======================================================================================================================================== */ 	    
		
		function beforeLoad(context){
			
			var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + runtime.executionContext;

			var REC = context.newRecord;

			if (context.type == context.UserEventType.VIEW) {
				
				if (REC.getValue("custrecord_pri_rsm_rule_rectype")) {
					var ruleDetails = REC.getValue("custrecord_pri_rsm_rule_eval") || ""; 					
					ruleDetails = ruleDetails.replace(/\<br\>/gi,""); 

					var testURL = url.resolveScript({
	                    scriptId:			rsmConstants.RULE_TEST_SUITELET_SCRIPT_ID,
	                    deploymentId:		rsmConstants.RULE_TEST_SUITELET_DEPLOYMENT_ID, 
	                    returnExternalUrl: 	false,
	                    params:{"custpage_rectype": REC.getValue("custrecord_pri_rsm_rule_rectype"), "custpage_ruledetail": ruleDetails}});

	                var scr = "window.open('"+testURL+"','_blank');";
	                
	                context.form.addButton({
	                	id : "custpage_rule_tester",
	                	label : "Test Rule Evaluation",
	                	functionName: scr
	                });    				                    						
				}
				
			}

			
 	    };

    	/* ======================================================================================================================================== */
 	    
 	    return {
 	    	beforeLoad: beforeLoad
         };
     }
 );