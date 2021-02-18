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
//Script: 		PRI_RSM_UE_RecordTypeValidator.js
//Description: 	Prolecto Record State Manager: Performs validation on the PRI RSM Record Type record   	
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

define(['N/record','N/search','N/error','N/runtime','N/url'],

    function(record,search,error,runtime,url) {
		
		var scriptName = "PRI_RSM_UE_RecordTypeValidator.";

    	/* ======================================================================================================================================== */ 	    
		
		function beforeLoad(context){
			
			var funcName = scriptName + "beforeLoad" + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + runtime.executionContext;
			
			if (context.type == context.UserEventType.VIEW) {
				var scriptURL = url.resolveScript({
	                 scriptId:				"customscript_pri_rsm_sl_rule_debugger",
	                 deploymentId:			"customdeploy_pri_rsm_sl_rule_debugger",
	                 returnExternalUrl: 	false,
	                 params:{"custpage_rectype": context.newRecord.getValue("name")}});

	          
				// var scr = "window.location.href='" + scriptURL + "'; console.log";
	          
                var scr = "window.open('"+scriptURL+"');";

				context.form.addButton({
					id : "custpage_debug_rules",
					label : "Debug Rules",
					functionName: scr
				});    				 				
			}
			
		}
		
    	/* ======================================================================================================================================== */ 	    
		
		function beforeSubmit(context){
			
			var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + runtime.executionContext;
			
			if (context.type != context.UserEventType.EDIT && context.type != context.UserEventType.CREATE)
			     return;
			
			var REC = context.newRecord;
			 
			if (!REC.getValue("custrecord_pri_rsm_rectype_is_tran") && !REC.getValue("custrecord_pri_rsm_rectype_is_entity") && !REC.getValue("custrecord_pri_rsm_rectype_p_ref_field"))
				 throw "You must either specify that this RECORD IS TRANSACTION, or this RECORD IS ENTITY, or provide the RULE INSTANCE PARENT FIELD NAME";
			 
			if (REC.getValue("custrecord_pri_rsm_rectype_status_ctrl")) {
				 try {
					 var x = JSON.parse(REC.getValue("custrecord_pri_rsm_rectype_status_ctrl"))
				 } catch (e) {
					 throw "The STATUS CONTROL is not valid JSON: <p/>&nbsp;</p>" + e.message;
				 }
			}
				 
			
			// finally, to make sure that the record name is valid, perform a search on the record
			try {
				var ss = search.create({type: REC.getValue("name")}).run().getRange(0,1);
			} catch (e) {
				 throw "Record type " + REC.getValue("name").toString().toUpperCase() + " is invalid, or can't be searched: <p/>&nbsp;</p>" + e.message;			
			}
                           
 	    };

    	/* ======================================================================================================================================== */
 	    
 	    return {
 	    	beforeLoad:		beforeLoad,
         	beforeSubmit: 	beforeSubmit
         };
     }
 );