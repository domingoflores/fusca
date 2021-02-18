//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

//-----------------------------------------------------------------------------------------------------------
//Script: 		PRI_RSM_SL_RuleEvaluator.js
//Description: 	Suitelet which allows a user to test the RULE EVALUATION logic against any record   	
//Developer: 	Boban
//Date: 		Nov 2018
//-----------------------------------------------------------------------------------------------------------


define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/ui/message'],		
		
	function(record, runtime, search, format, serverWidget, message) {

		var scriptName = "PRI_RSM_SL_RuleEvaluator.";

		
		String.prototype.startsWith = String.prototype.startsWith || function(searchString) {
			return this.substr(0, searchString.length) === searchString;
		};


		function onRequest(context) {
			
			var funcName = scriptName + "onRequest";
			
	        try {
				
				var funcName = scriptName = "onRequest";
				
	        	var formPosted = false;
	        	
	        	if (context.request.method != "GET") 
	        		formPosted = true;

				var msgTitle = "Instructions"
				var msgText = "Select the RECORD to test with, and enter your RULE DETAILS.  Then click 'Evaluate'";
				var msgType = message.Type.INFORMATION;

	            try {

		        	var recType = context.request.parameters.custpage_rectype;  
		        	var recId = context.request.parameters.custpage_recid;
		        	var ruleDetail = context.request.parameters.custpage_ruledetail || "";
	    	    	var recTypeName = getRecordTypeName(recType); 
	    	    		
		        	var form = serverWidget.createForm({title: "Evaluate Rule / Syntax Tester"}); 
		        	var fld;
		        	
		        	
		            fld = form.addField({
		                id: "custpage_rectype",
		                type: serverWidget.FieldType.TEXT,
		                label: "RecType"
		            });
		            fld.defaultValue = recType; 
		            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
	
		            fld = form.addField({
		                id: 	"custpage_recid",
		                type: 	serverWidget.FieldType.SELECT,
		                source:	recType,
		                label: "Select " + recTypeName 
		            });
		            fld.defaultValue = recId;  
	
	
		            fld = form.addField({
		                id: 	"custpage_ruledetail",
		                type: 	serverWidget.FieldType.TEXTAREA,
		                label: "Rule"
		            });
		            fld.updateDisplaySize({height : 10,width : 90});		            
		            fld.defaultValue = ruleDetail;   


	            	if (recType && recId) {
	            		
	            		var searchFilter; 
	            		if (ruleDetail) {
			            	var searchFilter = JSON.parse("[[" + ruleDetail + "]]");
			            	searchFilter.push("AND");
			            	searchFilter.push(["internalid",search.Operator.ANYOF,recId]);	            			
	            		} else
	            			searchFilter = ["internalid",search.Operator.ANYOF,recId]; 

		            	log.debug(funcName, searchFilter); 
		            	
		            	var ss = search.create({
		            		type:		recType,
		            		filters:	searchFilter
		            	}).run().getRange(0,1);  
		            	
		            	// log.debug(funcName, "AFTER=" + JSON.stringify(ss));

		            	
		            	if (ss.length > 0) {
		            		msgTitle = "TRUE";
		            		msgText = "That Rule evaluated to TRUE for the selected " + recTypeName; 
		            	}
		                else  {
		            		msgTitle = "FALSE";
		            		msgText = "That Rule evaluated to FALSE for the selected " + recTypeName; 		                	
		                }
	            	}


	            } catch (e) {
		    		log.error(funcName, e);

					msgText = e.message;
					msgTitle = "Error"
					msgType = message.Type.ERROR; 	            	
	            }
	            	    	    
	    	    form.addSubmitButton('Evaluate');

		        if (msgText)
		        	form.addPageInitMessage({type: msgType, title: msgTitle, message: msgText}); 

	    	    context.response.writePage(form);
	        	
	        } catch (e) {
	    		log.error(funcName, e);
	    		context.response.write("ERROR: " + e.message);		        	
	        }
		
		}
					
		//-------------------------------------------------------------------------------------------------------------
		
		function getRecordTypeName(recType) {
			
			if (recType.startsWith("customrecord")) {
				var ss = search.create({
					type:		"customrecordtype",
					filters:	["scriptid","is",recType],
					columns:	["name","scriptid"]
				}).run().getRange(0,1);
				
				if (ss.length > 0)
					return ss[0].getValue("name");  
			} else
				return recType; 
			
		}
		//-------------------------------------------------------------------------------------------------------------
		
		return {
			onRequest : onRequest
		};
});
