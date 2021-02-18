//-----------------------------------------------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

//-----------------------------------------------------------------------------------------------------------
//Script: 		PRI_RSM_SL_OverrideRules.js
//Description: 	Suitelet which allows a user to override multiple rules (to which they have permission)   	
//Developer: 	Boban
//Date: 		Aug 2018
//-----------------------------------------------------------------------------------------------------------


define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/plugin', './PRI_RSM_Engine','./PRI_RSM_Constants'],		
		
		function(record, runtime, search, format, serverWidget, plugin, rsmEngine, rsmConstants) {
	
			var scriptName = "PRI_RSM_SL_OverrideRules.";
			
			function onRequest(context) {
				
				var funcName = scriptName + "onRequest";
				
		        try {
					
					var funcName = scriptName = "onRequest";
					
		        	var formPosted = false;
		        	
		        	if (context.request.method != "GET") 
		        		formPosted = true;

		        	var recType = context.request.parameters.custpage_rectype;  
		        	var recId = context.request.parameters.custpage_recid; 

		        	var REC = record.load({type: recType, id: recId});

		            if (formPosted) 		            	
		            	if (processFormPost(context, REC)) {
		            		// if function returns TRUE, then some rules were overridden; so force parent to refresh
			            	var html = "<script>";
			            	html += "window.top.location.reload();"; 		            	
			            	html += "window.close();"
			            		
			            	// html += "window.opener.location.reload(false);";
			            	// html += "parent.location.href=parent.location.href;";
			            		
			            	html += "</script>";
			            	
		            		log.debug(funcName, "Returning...");
			            	context.response.write(html);
			            	return;	            		                			
		            	} 
		            		
		            
	    	    	var rsm = rsmEngine.createRecordStateManager(REC);      

		        	// var form = serverWidget.createForm({title: rsm.overrideRulesSuiteletLabel});
	    	    	var form = serverWidget.createForm({title: rsm.overrideRulesSuiteletLabel || "Override Rules"});
		        	var message = "";
		        	var fld;
		        	
		        	
		            fld = form.addField({
		                id: "custpage_rectype",
		                type: serverWidget.FieldType.TEXT,
		                label: "RecType",
		                container : SEL_CRITERIA_GROUP		                	
		            });
		            fld.defaultValue = recType; 
		            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

		            fld = form.addField({
		                id: "custpage_recid",
		                type: serverWidget.FieldType.TEXT,
		                label: "RecId",
		                container : SEL_CRITERIA_GROUP		                	
		            });
		            fld.defaultValue = recId;  
		            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});


		     		var SEL_CRITERIA_GROUP = "custpage_selection_criteria_group";
		     		
		     		var grp = form.addFieldGroup({
		     			id: SEL_CRITERIA_GROUP,
		     			label: "Rules for " + REC.type + " " + REC.id		     			
		     		});
					
		    	    var rules = form.addSublist({
		    	    	id: "custpage_rules",
		    	    	label: rsm.recordName,  
		    	    	type: serverWidget.SublistType.LIST
		    	    });
		    	    
		    	    rules.addField({id: "selected", type: serverWidget.FieldType.CHECKBOX, label: " "});
		    	    rules.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
		    	    rules.addField({id: "name", type: serverWidget.FieldType.TEXT, label: "Name"});
		    	    var f = rules.addField({id: "explanation", type: serverWidget.FieldType.TEXTAREA, label: "Explanation"}).updateDisplaySize({width: 30, height: 1});
		    	    rules.addField({id: "notes", type: serverWidget.FieldType.TEXTAREA, label: "Notes"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.ENTRY}).updateDisplaySize({width: 100, height: 3});
		    	    
		    	    rules.addMarkAllButtons();
		    	    
		    	    var lineNbr = 0;
		    	    
		    	    log.debug(funcName, "count=" + rsm.ruleInstances.length);
		    	    
		    	    
		    	    for (var r = 0; r < rsm.ruleInstances.length; r++) {
		    	    	var ruleInstance = rsm.ruleInstances[r];
		    	    	var rule = rsm.rules[ruleInstance.ruleId];
		    	    	
		    	    	if (rsm.ruleInstanceFailed(ruleInstance) && rsm.userCanOverrideRule(rule)) {
			    	    	rules.setSublistValue({id: "id",line: lineNbr,value: ruleInstance.id});
			    	    	rules.setSublistValue({id: "name",line: lineNbr,value: ruleInstance.ruleName || " "});
			    	    	rules.setSublistValue({id: "explanation",line: lineNbr,value: ruleInstance.failureDetails || " "});
			    	    	rules.setSublistValue({id: "notes",line: lineNbr,value: ruleInstance.instanceNotes || " "});
				    	    	
			    	    	lineNbr++;		    	    		
		    	    	}		    	    	
		    	    }; 
		    	    		     	    
 		    	    form.addSubmitButton('Submit');

		    	    context.response.writePage(form);
		        	
		        } catch (e) {
		    		log.error(funcName, e);
		    		context.response.write("ERROR: " + e.message);		        	
		        }
			
			}
						
			//-------------------------------------------------------------------------------------------------------------

			function processFormPost(context, REC) {
				
				var funcName = scriptName + "processFormPost";

				var sublistLines = context.request.parameters.custpage_rulesdata.split(rsmConstants.FORM_DELIMITERS.LINE_DELIMITER);

	    	    
            	// process all the overrides, and then we will need to reload the entire thing
            	
            	var rulesOverridden = false;
                for (line = 0; line < sublistLines.length; line++) {
                	var sublistFields = sublistLines[line].split(rsmConstants.FORM_DELIMITERS.FIELD_DELIMITER);
                	
                	if (sublistFields[0] == "T") {
                		 var ruleInstanceId = sublistFields[1];
                		 var notes = sublistFields[4];
                		 
                		 rsmEngine.manualRuleInstanceOverride(REC, ruleInstanceId, notes);
                		 rulesOverridden = true;                 		 
                	}
                }
                
                if (rulesOverridden) {
					REC = record.load({type: REC.type, id: REC.id});
					var rsm = rsmEngine.createRecordStateManager(REC);      
					rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.ALL_RULES);

					return true; 
                }
			}
			
			
			return {
				onRequest : onRequest
			};
});
