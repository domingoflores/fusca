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
//Script: 		PRI_RSM_SL_RuleDebugger.js
//Description: 	Suitelet which allows a user to run RSM against a record in a "non-updating" manner
//				User can specify that rules should be evaluated even the "checkComplete" function returns TRUE
//Developer: 	Boban
//Date: 		Feb 2019
//-----------------------------------------------------------------------------------------------------------


define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/ui/message','./PRI_RSM_Constants','./PRI_RSM_Engine'],		
		
	function(record, runtime,search,format,serverWidget,message,rsmConstants,rsmEngine) {

		var scriptName = "PRI_RSM_SL_RuleDebugger.";

		
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

	        	var msg = {title: "Instructions", text: "Select the RECORD to test with, and then click 'Evaluate'", type: message.Type.INFORMATION}

	            try {

		        	var recType = context.request.parameters.custpage_rectype;  
		        	var recId = context.request.parameters.custpage_recid;
	    	    	var recTypeName = getRecordTypeName(recType); 
	    	    		
		        	var form = serverWidget.createForm({title: "Rule Debugger"}); 
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
		

	            	if (recType && recId) {
	            		
	                	var REC = record.load({type: recType, id: recId});
	            		
	            		var rsm = rsmEngine.createRecordStateManager(REC);      
	            		rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.ALL_RULES, true);	

	            		msg.title = "Done";
	            		msg.type = message.Type.CONFIRMATION; 
	            		msg.text = "RSM has been executed against the selected record in DEBUG (non-updating) mode.";  		                	
	            	}


	            } catch (e) {
		    		log.error(funcName, e);

					msg.text = e.message;
					msg.title = "Error"
					msg.type = message.Type.ERROR; 	            	
	            }
	            	    	    
	    	    form.addSubmitButton('Evaluate');

		        if (msg.text)
		        	form.addPageInitMessage({type: msg.type, title: msg.title, message: msg.text}); 

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
