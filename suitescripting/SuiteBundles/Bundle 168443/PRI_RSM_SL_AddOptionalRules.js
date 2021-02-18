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
//Script: 		PRI_RSM_SL_AddOptionalRules.js
//Description: 	Suitelet which allows a user to add any rules which are marked "optional" or "ad-hoc"   	
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

		        	// need to load it here because the "override function" relies on it
	    	    	var rsm = rsmEngine.createRecordStateManager(REC);      

		            if (formPosted) 		            	
		            	var addMsg = processFormPost(context, rsm, REC.id); 
		            
		            log.debug(funcName, "msg=" + addMsg);
		            
		            // but need to re-load it to see what has been changed
	    	    	var rsm = rsmEngine.createRecordStateManager(REC);      

	    	    	
		        	var form = serverWidget.createForm({title: rsm.addRulesSuiteletLabel + " - " + rsm.recordName});
		        	var message = "";
		        	var fld;
		        	
		        	
		            fld = form.addField({
		                id: "custpage_rectype",
		                type: serverWidget.FieldType.TEXT,
		                label: "RecType"
		            });
		            fld.defaultValue = recType; 
		            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

		            fld = form.addField({
		                id: "custpage_recid",
		                type: serverWidget.FieldType.TEXT,
		                label: "RecId"
		            });
		            fld.defaultValue = recId;  
		            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

		            					
		            fld = form.addField({id: "custpage_instructions",type: serverWidget.FieldType.TEXT,label: "Instructions"});
		            fld.defaultValue = "Check the box next to each " + rsm.ruleNameSingular + " you wish to add.  Do NOT edit the NAME for OPTIONAL " + rsm.ruleNamePlural + ", as the field won't be saved.  You MUST provide a NAME for AD-HOC " + rsm.ruleNamePlural + ".";     
		            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});		     		
		     		
		            if (addMsg) {
		            	log.debug(funcName, "adding message");
			            fld = form.addField({id: "custpage_errors",type: serverWidget.FieldType.TEXT,label: "Status"});
			            fld.defaultValue = "<font color=red><b>" + addMsg + "</b></font>";      
			            fld.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW})
			            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});		            	
		            }
		            
		    	    var rules = form.addSublist({
		    	    	id: "custpage_rules",
		    	    	label: rsm.ruleNameSingular + " to Add",  
		    	    	type: serverWidget.SublistType.LIST
		    	    });
		    	    
		    	    rules.addField({id: "selected", type: serverWidget.FieldType.CHECKBOX, label: " "});
		    	    rules.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
		    	    rules.addField({id: "ruletype", type: serverWidget.FieldType.SELECT, source : "customlist_pri_rsm_rule_type", label: "Type"}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}); 
		    	    rules.addField({id: "name", type: serverWidget.FieldType.TEXT, label: "Name"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.ENTRY}).updateDisplaySize({width: 60, height: 1});
		    	    rules.addField({id: "description", type: serverWidget.FieldType.TEXT, label: "Description"}); 

		    	    
		    	    var existingRules = form.addSublist({
		    	    	id: "custpage_existing_rules",
		    	    	label: "Existing Optional and Ad-Hoc " + rsm.ruleNamePlural,   
		    	    	type: serverWidget.SublistType.LIST
		    	    });
		    	    
		    	    // existingRules.addField({id: "selected", type: serverWidget.FieldType.CHECKBOX, label: " "});
		    	    existingRules.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
		    	    existingRules.addField({id: "ruletype", type: serverWidget.FieldType.SELECT, source : "customlist_pri_rsm_rule_type", label: "Type"}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}); 
		    	    existingRules.addField({id: "name", type: serverWidget.FieldType.TEXT, label: "Name"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});
		    	    existingRules.addField({id: "description", type: serverWidget.FieldType.TEXT, label: "Description"}); 
		    	    
		    	    
		    	    rules.addMarkAllButtons();
		    	    
		    	    var lineNbr = 0;
		    	    
		    	    // we will show all 
		    	    //		OPTIONAL lines which have not yet been added
		    	    //		AD-HOC lines x 3 opportunities to add them
		    	    
		    	    
		    	    for (var r in rsm.rules) {
		    	    	var rule = rsm.rules[r];
		    	    	
		    	    	// if this rule is optional, and it doesn't exist, and user is authorized to override it, then make it eligible to be added
		    	    	
		    	    	if (rsm.userCanOverrideRule(rule)) {
			    	    	if (rule.ruleType == rsmConstants.RULE_TYPE.OPTIONAL) {
			    	    		var showRule = true;
			    	    		for (var i = 0; i < rsm.ruleInstances.length; i++)
			    	    			if (rsm.ruleInstances[i].ruleId == rule.id)
			    	    				showRule = false;
			    	    		
			    	    		if (showRule) {
					    	    	rules.setSublistValue({id: "id",line: lineNbr,value: rule.id});
					    	    	rules.setSublistValue({id: "name",line: lineNbr,value: (rule.ruleName || " ") + " (CHANGES TO THIS NAME WILL BE IGNORED)"});
					    	    	rules.setSublistValue({id: "ruletype",line: lineNbr,value: rule.ruleType});
					    	    	rules.setSublistValue({id: "description",line: lineNbr,value: rule.description || " "});
						    	    	
					    	    	lineNbr++;		    	    				    	    			
			    	    		}
			    	    	} else if (rule.ruleType == rsmConstants.RULE_TYPE.AD_HOC) {
			    	    		// allow user to add 3 instances of the ad-hoc rule

			    	    		for (var i = 0; i < 3; i++) {
					    	    	rules.setSublistValue({id: "id",line: lineNbr,value: rule.id});
					    	    	rules.setSublistValue({id: "name",line: lineNbr,value: (rule.ruleName || " ")});
					    	    	rules.setSublistValue({id: "ruletype",line: lineNbr,value: rule.ruleType});
					    	    	rules.setSublistValue({id: "description",line: lineNbr,value: rule.description || " "});
						    	    	
					    	    	lineNbr++;		    	    				    	    					    	    			
			    	    		}
			    	    	}
		    	    		
		    	    	}
		    	    }
		    	    
		    	    var lineNbr = 0; 

    	    		for (var i = 0; i < rsm.ruleInstances.length; i++) {
    	    			var ruleInstance = rsm.ruleInstances[i];
    	    			var rule = rsm.rules[ruleInstance.ruleId]; 
    	    			
    	    			if (rule.ruleType == rsmConstants.RULE_TYPE.OPTIONAL || rule.ruleType == rsmConstants.RULE_TYPE.AD_HOC) {
        	    			existingRules.setSublistValue({id: "id",line: lineNbr,value: rule.id});
        	    			existingRules.setSublistValue({id: "name",line: lineNbr,value: (ruleInstance.ruleName || " ")});
        	    			existingRules.setSublistValue({id: "ruletype",line: lineNbr,value: rule.ruleType});
        	    			existingRules.setSublistValue({id: "description",line: lineNbr,value: rule.description || " "});
    			    	    	
    		    	    	lineNbr++;		    	    				    	    					    	    			    	    				
    	    			}
    	    		}
		    	    
		    	    
		    	    
 		    	    form.addSubmitButton('Submit');

		    	    context.response.writePage(form);
		        	
		        } catch (e) {
		    		log.error(funcName, e);
		    		context.response.write("ERROR: " + e.message);		        	
		        }
			
			}
						
			//-------------------------------------------------------------------------------------------------------------

			function processFormPost(context, rsm, parentId) {
				
				var funcName = scriptName + "processFormPost";

				var errorMsg = "";
				var msg = "";
				var sublistLines = context.request.parameters.custpage_rulesdata.split(rsmConstants.FORM_DELIMITERS.LINE_DELIMITER);
	    	    
            	// process all the overrides, and then we will need to reload the entire thing

				var rulesAdded = 0;
				
                for (line = 0; line < sublistLines.length; line++) {
                	var sublistFields = sublistLines[line].split(rsmConstants.FORM_DELIMITERS.FIELD_DELIMITER);
                	
                	log.debug(funcName, "line " + line + "=" + sublistFields[0]); 
                	if (sublistFields[0] == "T") {
                		 var ruleId = sublistFields[1];
                		 var ruleName = sublistFields[3]
                
                		 try {
                			 
                			 if (!ruleName)
                				 throw "'Name' is required for new Ad-Hoc " + rsm.ruleNamePlural + ".  " + rsm.ruleNameSingular + " not added.";
                			 log.debug(funcName, "  adding rule");
                    		 rsm.addOptionalRuleInstance(ruleId, ruleName, parentId);
                    		 rulesAdded++; 
                		 } catch (e) {
                			 errorMsg = errorMsg + e + "<br>";
                		 }
                	}
                }
                
               	if (rulesAdded > 0)
               		var msg = rulesAdded + " rule(s) added.<br>"; 
               	
               	return errorMsg + msg;
                	 
			}
			
			//-------------------------------------------------------------------------------------------------------------
			
			return {
				onRequest : onRequest
			};
});
