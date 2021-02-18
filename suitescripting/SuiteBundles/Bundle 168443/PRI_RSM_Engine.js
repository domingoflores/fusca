//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_Engine.js
//Description:	Prolecto Record State Manager 
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

//TODO: 
//	if called as "create" or "edit" -- and not all rules were evaluated for THAT reason, then schedule it
//			rely on queue manager

define(['N/record', 'N/search', 'N/runtime', 'N/log', 'N/plugin', 'N/task', 'N/util', 'N/format', './PRI_RSM_Constants','/.bundle/132118/PRI_QM_Engine', '/.bundle/132118/PRI_CommonLibrary'],
		
	function(record, search, runtime, log, plugin, task, util, format, rsmConstants, qmEngine, priLibrary) {
	
		"use strict";
	 
		var scriptName = "PRI_RSM_Engine.";

    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */

        function createRecordStateManager(REC) {
        	return new RecordStateManager(REC);
        }
        
        function RecordStateManager(REC) {
        	var funcName = scriptName + "RecordStateEngine";

			try {

	        	this.rules = {};
	        	this.ruleInstances = [];
	        	this.startTime = util.nanoTime(); 

	        	this.REC = REC;
	        	
		    	var s = search.create({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RECORD_TYPE, filters: [["name", search.Operator.IS, REC.type]]}).run().getRange(0,1);
		    	if (s.length == 0)
		    		throw "State Engine is not configured for record type '" + REC.type + "'";
	
		    	// CONFIG is the custom record which holds the definition for this  
		    	this.CONFIG = record.load({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RECORD_TYPE, id: s[0].id});
		    	
		        this.showRuleSummary = this.CONFIG.getValue("custrecord_pri_rsm_rectype_show_summary");
		        this.showOnlyFailedRules = this.CONFIG.getValue("custrecord_pri_rsm_rectype_sum_fail_only");
		        this.summaryTitle = this.CONFIG.getValue("custrecord_pri_rsm_rectype_summary_title");
		        this.summaryTableCSS = this.CONFIG.getValue("custrecord_pri_rsm_rectype_sum_css");
		        this.storeRuleLastEval = this.CONFIG.getValue("custrecord_pri_rsm_rectype_last_eval"); 		        
		        this.pluginName = this.CONFIG.getValue("custrecord_pri_rsm_rectype_plugin"); 		        
		        
		        if (this.CONFIG.getValue("custrecord_pri_rsm_rectype_max_buttons") == "0")
		        	this.maxNbrOfButtons = 0; 
		        else
		        	this.maxNbrOfButtons = this.CONFIG.getValue("custrecord_pri_rsm_rectype_max_buttons") || 999;
		    		
		        this.overrideRulesTab = this.CONFIG.getValue("custrecord_pri_rsm_rectype_override_tab"); 
		        
		    	// this.overrideRulesSuiteletLabel = this.CONFIG.getValue("custrecord_pri_rsm_rectype_override_lbl");
		    	this.recordNameFormat = this.CONFIG.getValue("custrecord_pri_rsm_rectype_rec_name") || ""; 
		    	this.addRulesSuiteletLabel = this.CONFIG.getValue("custrecord_pri_rsm_rectype_add_lbl");

	    		this.ruleNameSingular = "Rule"; 
	    		this.ruleNamePlural = "Rules";  
	    		this.overrideTabLabel = "Override Rules"; 
	    		this.overrideRulesSuiteletLabel = "Override Rules"; 
	    		
		    	if (this.CONFIG.getValue("custrecord_pri_rsm_rectype_adv_settings")) {
		    		var ADV = JSON.parse(this.CONFIG.getValue("custrecord_pri_rsm_rectype_adv_settings")); 
		    		
					var keys = Object.keys(ADV); 

					if (keys)
    					for (var i = 0; i < keys.length; i++) 
    						if (ADV[keys[i]]) 
    							this[keys[i]] = ADV[keys[i]];         					
					/*
		    		this.ruleNameSingular = ADV.ruleNameSingular || this.ruleNameSingular; 
		    		this.ruleNamePlural = ADV.ruleNamePlural || this.ruleNamePlural; 
		    		this.overrideTabLabel = ADV.overrideTabLabel || this.overrideTabLabel; 
		    		this.ruleSummaryPlacement = ADV.overrideTabLabel || this.ruleSummaryPlacement;
		    		this.ignoreStateSequence 
		    		*/ 
		    	}
		    	
		    	this.recordName = this.formatRecordName(); 
		    		
		    		// rule.id			the id of rule from the "master rule table" (customrecord_pri_rsm_rules)   this is also the entry in the rule table
		    	
		    	this.clientImplementation = loadPluginImplementation(this.pluginName);
		    	
		    	
		        // load the applicable rules immediately
	    		this.loadMasterRules();    		
	    		this.loadRuleInstances();
	    		this.loadDefaultInstances(REC);
	    		

	    		// log.debug(funcName, "INSTANCES=" + JSON.stringify(this.ruleInstances)); 
	    		
			} catch (e) {
				log.error(funcName, e);
			}
        	
        }
        
    	/* ======================================================================================================================================== */

        RecordStateManager.prototype.formatRecordName = function() {
        	var funcName = scriptName + "formatRecordName"; 
        	
        	var s = this.recordNameFormat;  
        	
        	var found = s.match(/{(.*?)}/g);
        	
        	if (found) 
        		for (var i = 0; i < found.length; i++) {
        			var fieldName = found[i]; 
        			fieldName = fieldName.substring(1,fieldName.length-1);
        			var fieldValue = this.REC.getText(fieldName) ? this.REC.getText(fieldName) : this.REC.getValue(fieldName); 
        			s = s.replace("{"+fieldName+"}", fieldValue); 
        		}
        	
        	return s;         			
        }
                
        /* ======================================================================================================================================== */

        RecordStateManager.prototype.loadMasterRules = function () {

        	var funcName = scriptName + "loadMasterRules " + this.REC.type;
        	
        	try {
        		
        		var s = search.create({
                    type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE,
                    filters: [["isinactive",search.Operator.IS,false],"AND",["custrecord_pri_rsm_rule_rectype", search.Operator.IS, this.REC.type]],
                    columns:["name","custrecord_pri_rsm_rule_short_name","custrecord_pri_rsm_rule_desc","custrecord_pri_rsm_rule_type","custrecord_pri_rsm_rule_btn_lbl","custrecord_pri_rsm_rule_ovr_role",
                             "custrecord_pri_rsm_rule_recheck","custrecord_pri_rsm_rule_chk_create","custrecord_pri_rsm_rule_chk_edit","custrecord_pri_rsm_rule_eval","custrecord_pri_rsm_rule_msg",
                             "custrecord_pri_rsm_rule_params","custrecord_pri_rsm_rule_ovr_depts","custrecord_pri_rsm_rule_eval_reverse","custrecord_pri_rsm_rule_dnc_until"]
                }).run().getRange(0,1000);
      
                this.rules = {};
                
                for(var i = 0; i < s.length; i++){        
                	this.rules[s[i].id] = {
                    		'id'				:s[i].id,
                    		'recordId'			:this.REC.id,
                    		'ruleName'			:s[i].getValue("name"),
                    		'ruleType'			:s[i].getValue("custrecord_pri_rsm_rule_type"),
                    		'shortName'			:s[i].getValue("custrecord_pri_rsm_rule_short_name"),
                    		'description'		:s[i].getValue("custrecord_pri_rsm_rule_desc"),
                			'overrideRoles'		:s[i].getValue("custrecord_pri_rsm_rule_ovr_role"),                												
                			'overrideDepartments' :s[i].getValue("custrecord_pri_rsm_rule_ovr_depts"),                												
                    		'buttonLabel' 		:s[i].getValue("custrecord_pri_rsm_rule_btn_lbl"),
                    		'alwaysRecheck'		:s[i].getValue("custrecord_pri_rsm_rule_recheck"),
                    		'checkDuringCreate'	:s[i].getValue("custrecord_pri_rsm_rule_chk_create"),
                    		'checkDuringEdit'	:s[i].getValue("custrecord_pri_rsm_rule_chk_edit"),
                    		'ruleEval'			:s[i].getValue("custrecord_pri_rsm_rule_eval"),
                    		'params'			:s[i].getValue("custrecord_pri_rsm_rule_params"),
                    		'message'			:s[i].getValue("custrecord_pri_rsm_rule_msg"),
                    		'reverseRuleEval'	:s[i].getValue("custrecord_pri_rsm_rule_eval_reverse"),
                    		'doNotCheckUntil'	:s[i].getValue("custrecord_pri_rsm_rule_dnc_until"),
                            'status'			:rsmConstants.RULE_STATUS.NOT_YET_CHECKED,
                            'statusName'		:"Not Yet Checked",
                            'failureDetails'	:"",
                            'instanceLoaded'	:false
                    	};
                }
        		// log.debug(funcName,"RULES=" + JSON.stringify(this.rules));
			} catch (e) {
        		log.error(funcName, e);
        	}
        }

    	/* ======================================================================================================================================== */
		
        // this function loads the applicable rules for the record type from the rules table, and then overlays their current status from the rule status table
        
        RecordStateManager.prototype.loadRuleInstances = function () {	        
	    	// this function will create the initial set of rules for a record by copying the rules into the rule status table
	    	
	    	var funcName = scriptName + "loadRuleInstances " + this.REC.id;
	    	
	    	try {
	    		
	    		this.parentFieldName = this.CONFIG.getValue("custrecord_pri_rsm_rectype_p_ref_field");
	    		if (!this.parentFieldName) 
	    			if (this.CONFIG.getValue("custrecord_pri_rsm_rectype_is_tran"))
	    				this.parentFieldName = "custrecord_pri_rsm_rule_inst_tran_ref";
	    			else if (this.CONFIG.getValue("custrecord_pri_rsm_rectype_is_entity"))
	    				this.parentFieldName = "custrecord_pri_rsm_rule_inst_entity_ref";
                
	    		// log.debug(funcName, "parent record reference is field " + this.parentFieldName);
	    		var s = search.create({
	                type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE,
	                filters: [
	                          	["isinactive", search.Operator.IS, false]
	                          	,"AND",[this.parentFieldName , search.Operator.ANYOF, this.REC.id]
	                          ],
	                'columns':["custrecord_pri_rsm_rule_inst_name","custrecord_pri_rsm_rule_inst_rule","custrecord_pri_rsm_rule_inst_status","custrecord_pri_rsm_rule_inst_last_chg","custrecord_pri_rsm_rule_inst_override","custrecord_pri_rsm_rule_inst_expl","custrecord_pri_rsm_rule_inst_notes","custrecord_pri_rsm_rule_inst_rule.custrecord_pri_rsm_rule_type"]
	            }).run().getRange(0,1000);

	            for(var i = 0; i < s.length; i++) {	     
	            	var ruleId = s[i].getValue("custrecord_pri_rsm_rule_inst_rule");
	            	var rule = this.rules[ruleId];
	            	var instanceId = s[i].id;
	            	// this rule should have already been loaded from the "master" table -- if it doesn't exist, then somehow this transaction has a rule which is no longer valid (or exists) in the master table
	            	//		so ignore it
//	            	if (this.ruleInstances[ruleId]) {
	            	if (rule) {
		            	
		            	var ruleInstance = {
		            		id:					s[i].id,
		            		ruleId: 			ruleId,
			            	recordId: 			this.REC.id,
			            	ruleName:			s[i].getValue('custrecord_pri_rsm_rule_inst_name') || rule.ruleName,
			            	ruleType: 			s[i].getValue({name: "custrecord_pri_rsm_rule_type", join: "custrecord_pri_rsm_rule_inst_rule"}),
			            	status: 			s[i].getValue('custrecord_pri_rsm_rule_inst_status'),
			            	statusName: 		s[i].getText('custrecord_pri_rsm_rule_inst_status'), 
			            	statusLastChanged: 	s[i].getValue('custrecord_pri_rsm_rule_inst_last_chg'),
			            	overriddenBy: 		s[i].getValue('custrecord_pri_rsm_rule_inst_override'),
			            	failureDetails: 	s[i].getValue('custrecord_pri_rsm_rule_inst_expl'),	            		
			            	instanceNotes: 		s[i].getValue('custrecord_pri_rsm_rule_inst_notes'),	            		
			            	instanceLoaded: 	true 	            			            			
		            	};
		            	
		            	// if (!ruleInstance.ruleName) 
		            	// 	ruleInstance.ruleName = rule.ruleName; 
		            	
		            	/*
		            	if (ruleInstance.ruleType == rsmConstants.RULE_TYPE.AD_HOC) {
			            	ruleInstance.status = rsmConstants.RULE_STATUS.FAILED; 
			            	ruleInstance.statusName = "Failed";
		            	}
		            	*/
		            		          
		            	// log.debug(funcName, ruleInstance); 
		            	this.ruleInstances.push(ruleInstance);
	            	
	            	
	            	}
	            };

        		 // log.debug(funcName, "Overlaid Rules=" + JSON.stringify(this.rules));

	    	} catch (e) {
        		log.error(funcName, e);
	    	}
        } // loadRuleInstances

        
    	/* ======================================================================================================================================== */
		
        // this function confirms that each rule has a default instance, or creates one if it is missing
        
        RecordStateManager.prototype.loadDefaultInstances = function () {	        
	    	// this function will create the initial set of rules for a record by copying the rules into the rule status table
	    	
	    	var funcName = scriptName + "loadDefaultInstances " + this.REC.id;
	    	
	    	try {

        		for (var r in this.rules) {
        			var rule = this.rules[r];
        			
        			if (rule.ruleType == rsmConstants.RULE_TYPE.FIXED) {
        				
            			var ruleFound = false;
            			
            			for (var i = 0; i < this.ruleInstances.length; i++)
            				if (this.ruleInstances[i].ruleId == rule.id) {
            					ruleFound = true;
            					break; 
            				}
        				
            			
            			if (!ruleFound) {
        	            	var ruleInstance = {
        		            		ruleId: 			rule.id,
        			            	recordId: 			this.REC.id, 
        			            	ruleType: 			rule.ruleType,
        			            	id: 				null,
        			            	status: 			rsmConstants.RULE_STATUS.NOT_YET_CHECKED,
        			            	ruleName:			rule.ruleName,
        			            	statusName: 		"Not Yet Checked", 
       				            	failureDetails: 	"",	            		
       				            	instanceNotes: 		"",	            		
        		            	};
        	            	this.ruleInstances.push(ruleInstance);            				
            			}
        			}        				        			
        		}
        			    		
	    	} catch (e) {
        		log.error(funcName, e);
	    		
	    	}
        } // loadDefaultInstances
        
    	/* ======================================================================================================================================== */

        RecordStateManager.prototype.evaluateRules = function(executionType, debugMode) {
        	// evaluates all the "applicable" rules, depending on executionType
        	// after checking, every rule that has been changed (or is new) gets saved

        	var funcName = scriptName + "evaluateRules " + this.REC.id + " | " + executionType + " DEBUG? " + debugMode;
        	
        	try {

        		var scheduleTask = false;
        		
        		for (var r = 0; r < this.ruleInstances.length; r++) {
	    		 
        			var ruleInstance = this.ruleInstances[r];
        			// log.debug(funcName, "INSTANCE=" + JSON.stringify(ruleInstance));

        			var rule = this.rules[ruleInstance.ruleId];        			
        			// log.debug(funcName, "RULE=" + JSON.stringify(rule));

            		var checkRule = false;
            		
            		// if we don't have already have an id, then this rule instance has never been saved, and so we need to save it now, assuming it is "fixed"
            		//		other kinds of rules are added optionally, and so they don't have to exist
            		var dirty = (!ruleInstance.id && ruleInstance.ruleType == rsmConstants.RULE_TYPE.FIXED);		
            		
    				if (ruleInstance.status == rsmConstants.RULE_STATUS.NOT_YET_CHECKED || ruleInstance.status == rsmConstants.RULE_STATUS.FAILED  || ruleInstance.status == rsmConstants.RULE_STATUS.NOT_APPLICABLE || (ruleInstance.status == rsmConstants.RULE_STATUS.PASSED && rule.alwaysRecheck)) {
        				if (executionType == rsmConstants.RULE_STATUS_CHECK_TYPE.RECORD_CREATE)
        					checkRule = rule.checkDuringCreate;
        				else if (executionType == rsmConstants.RULE_STATUS_CHECK_TYPE.RECORD_EDIT)
        					checkRule = rule.checkDuringEdit;
        				else
        					checkRule = true;
        				
        				// if any rules are not going to get checked now because we are in the wrong context, then we need to schedule a background task for a complete run
        				if (!checkRule) {
        					scheduleTask = true;
        					log.debug(funcName, "scheduling task because of rule " + JSON.stringify(rule));
        					
        				}        				
    				}
    				
    				if (debugMode)
    					checkRule = true; 
    				
    				if (checkRule && ruleInstance.status == rsmConstants.RULE_STATUS.NOT_YET_CHECKED) {
    					// 2019.07 : if user rule is configured to only check the rule once a condition has been met, then see if the condition is met
    					if (rule.doNotCheckUntil) 
    						checkRule = testSearchResults(this.REC, rule.doNotCheckUntil);
    				}
    				
    				// log.debug(funcName, "rule " + JSON.stringify(rule) + " being checked? " + checkRule);
    				
    				// ad hoc rules never have any "logic" around them; they are always manually overridden
    				if (checkRule && rule.ruleType != rsmConstants.RULE_TYPE.AD_HOC) {    				

    					// log.debug(funcName, "A checking rule instance " + ruleInstance.id + ": " + JSON.stringify(ruleInstance)); 
    					
    					// log.debug(funcName, "RULE=" + JSON.stringify(rule)); 
    					
    					var checkResult; 
    					
    					if (rule.ruleEval) 
    						checkResult = this.evaluateRuleDefault(rule.ruleEval,rule.reverseRuleEval,rule.message,this.REC);
    					else {
    						checkResult = this.clientImplementation.evaluateRule(rule.shortName,rule.params,rule.message,this.REC, executionType);
    						if (this.storeRuleLastEval) 
        						ruleInstance.lastEvaluated = new Date();     							
    					}

    					
    					if (debugMode)	// don't save anything; just continue to next rule    						
    						continue;  
    					
    					// log.debug(funcName, "CHECK=" + JSON.stringify(checkResult)); 
    					
    					// log.debug(funcName, "Rule " + rule.shortName + " Evaluated: " + JSON.stringify(checkResult));
    					
    					var newStatus = {};
    					
    					newStatus.status = ruleInstance.status;	// initially we keep previous status
    					newStatus.failureDetails = ruleInstance.failureDetails;
    					
    					// log.debug(funcName, "NEWSTATUS: " + JSON.stringify(newStatus)); 
    					
    					
    					// if the rule was actually checked 

    					// log.debug(funcName, "B checking rule instance " + ruleInstance.id + ": " + JSON.stringify(ruleInstance)); 

    					if (checkResult.notChecked)
    						newStatus.status = rsmConstants.RULE_STATUS.NOT_YET_CHECKED;
						else {
    						if (checkResult.notApplicable) 
    							newStatus.status = rsmConstants.RULE_STATUS.NOT_APPLICABLE;
    						else
    							if (checkResult.passed)
    								newStatus.status = rsmConstants.RULE_STATUS.PASSED;
    							else
    								newStatus.status = rsmConstants.RULE_STATUS.FAILED;
        					newStatus.failureDetails = checkResult.message;
    					}

    					// log.debug(funcName, "C checking rule instance " + ruleInstance.id + ": " + JSON.stringify(ruleInstance)); 

    					if ((ruleInstance.status != newStatus.status) || (ruleInstance.failureDetails != newStatus.failureDetails) || this.storeRuleLastEval) {
    						
    						// log.debug(funcName, "oldfailure=" + ruleInstance.failureDetails + "; newfailure=" + newStatus.failureDetails); 
    						
    						
    						if (ruleInstance.status != newStatus.status) {
    							log.debug(funcName, "rule instance " + ruleInstance.id + " changed status from " + ruleInstance.status + " to " + newStatus.status);
        						this.ruleInstances[r].statusLastChanged = new Date();
    						} else
    							this.ruleInstances[r].statusLastChanged = null;		// this will prevent it from getting updated

    						if (this.storeRuleLastEval)
    							this.ruleInstances[r].lastEvaluated = ruleInstance.lastEvaluated; 
    						
   							this.ruleInstances[r].status = newStatus.status;    						
    						this.ruleInstances[r].failureDetails = newStatus.failureDetails;
    						
    						dirty = true;
    					}
    				}
    					
					if (dirty) {
						log.debug(funcName, "rule instance " + ruleInstance.id + " has changed, and is now being saved: " + JSON.stringify(ruleInstance));
						this.saveRuleInstance (ruleInstance);						
					}    					
            	} // for loop

        		if (debugMode)
        			return; 
        		
        		
				if (scheduleTask) {
					qmEngine.addQueueEntry(rsmConstants.QUEUE_NAME, {recType: this.REC.type, recId: this.REC.id}, null, true, rsmConstants.SCHEDULED_SCRIPT_ID);
					// this.scheduleBackgroundTask();
				}

	    	} catch (e) {
        		log.error(funcName, e);
	    	}

        	
        } // evaluateRules
          
    	/* ======================================================================================================================================== */
    	
        RecordStateManager.prototype.saveRuleInstance = function(ruleInstance) {
        	// saves the rule back to the customrecord_pri_tran_hold_status table (transaction rule table)
        	
			var funcName = scriptName + "saveRuleInstance ";
			
			try {
				var RULE;
				
				// log.debug(funcName, "parent record reference is field " + _parentFieldName);
				
	        	if (ruleInstance.id) {
	        		// log.debug(funcName, "saving existing rule: " + JSON.stringify(rule));
	        		// we have already previously saved this rule, which means that this is an update; load it, and pass certain fields which need to be updated
	            	RULE = record.load({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE, id: ruleInstance.id});
	            	
	            	RULE.setValue({fieldId: "custrecord_pri_rsm_rule_inst_override", value: ruleInstance.overriddenBy});
	        	} else {
	        		// log.debug(funcName, "saving new rule: " + JSON.stringify(rule));
	            	// first time saving
	        		RULE = record.create({type:rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE});
	        		RULE.setValue({fieldId: this.parentFieldName, value: this.REC.id})
	            	RULE.setValue({fieldId: "custrecord_pri_rsm_rule_inst_rule", value: ruleInstance.ruleId});
	        	}

	        	if (ruleInstance.statusLastChanged)
	        		RULE.setValue({fieldId: "custrecord_pri_rsm_rule_inst_last_chg", value: new Date(ruleInstance.statusLastChanged)});

	        	if (ruleInstance.lastEvaluated)
		        	RULE.setValue({fieldId: "custrecord_pri_rsm_rule_inst_last_eval", value: ruleInstance.lastEvaluated});
	        		
	        	RULE.setValue({fieldId: "custrecord_pri_rsm_rule_inst_expl", value: ruleInstance.failureDetails});
	        	RULE.setValue({fieldId: "custrecord_pri_rsm_rule_inst_status", value: ruleInstance.status});        		
	        	RULE.setValue({fieldId: "custrecord_pri_rsm_rule_inst_name", value: ruleInstance.ruleName});	        	

	        	ruleInstance.id = RULE.save({'enableSourcing':true,'ignoreMandatoryFields':true});
	        	// log.debug(funcName,"Rule " + rule.ruleInstanceId + " saved.");
	        	
			} catch (e) {
        		log.error(funcName, e);
        	}

        }

    	/* ======================================================================================================================================== */

        RecordStateManager.prototype.evaluateRuleDefault = function(ruleEval,reverseRuleEval,msg,REC) {
        	
			var funcName = scriptName + "evaluateRuleDefault ";

        	try {
            	var searchSuccess = testSearchResults(REC,ruleEval);
            	
            	if ((searchSuccess && !reverseRuleEval) || (!searchSuccess && reverseRuleEval))
            		return {notChecked: false, notApplicable: false, passed: true, message: ""};
                else 
                	return {notChecked: false, notApplicable: false, passed: false, message: msg};        	

        	} catch (e) {
        		log.error(funcName, e); 
        		
        		if (e.message)
        			return {notChecked: false, notApplicable: false, passed: false, message: e.message};
        		else
        			return {notChecked: false, notApplicable: false, passed: false, message: "Unexpected Error " + e.name + " when performing search-based rule evaluation.  Check Rule Definition."};
        				
        	}         	
        }

        
    	/* ======================================================================================================================================== */
        
        // returns TRUE if the search results yielded a record; FALSE otherwise
        function testSearchResults(REC,searchFilter) {
        	var funcName = scriptName + "testSearchResults"; 
        	
        	searchFilter = JSON.parse("[[" + searchFilter + "]]");

        	searchFilter.push("AND");
        	searchFilter.push(["internalid",search.Operator.ANYOF,REC.id.toString()]);

//        	log.debug(funcName, "FILTER=" + JSON.stringify(searchFilter));
        	
        	var ss = search.create({
        		type:		REC.type,
        		filters:	searchFilter
        	}).run().getRange(0,1);  
        	
        	return (ss.length > 0);
        }

    	/* ======================================================================================================================================== */
        
        RecordStateManager.prototype.allRulesPassed = function() {
        	
    		for (var r = 0; r < this.ruleInstances.length; r++) {	    		 
    			var ruleInstance = this.ruleInstances[r];
    			if (!this.ruleInstancePassed(ruleInstance))
	    			 return false;
    			
    			// if ( (ruleInstance.status != rsmConstants.RULE_STATUS.PASSED) && (ruleInstance.status != rsmConstants.RULE_STATUS.OVERRIDDEN) && (ruleInstance.status != rsmConstants.RULE_STATUS.NOT_APPLICABLE))
        	}
        	return true;
        } 

    	/* ---------------------------------------------------------------------------------------------------------------------------------------- */
        
        RecordStateManager.prototype.rulePassedByName = function(ruleShortName) {
    		for (var r = 0; r < this.ruleInstances.length; r++) {	    		 
    			var ruleInstance = this.ruleInstances[r];
    			var rule = this.rules[ruleInstance.ruleId];
    			
    			if (rule.shortName.toLowerCase() == ruleShortName.toLowerCase()) {
    				// log.debug("rulePassedByName", "  checking rule " + ruleShortName + " ... " + JSON.stringify(ruleInstance)); 
    				return this.ruleInstancePassed(ruleInstance);
    			}
        	}
	    	 
        	return false;
        } 
        
    	/* ---------------------------------------------------------------------------------------------------------------------------------------- */

        RecordStateManager.prototype.ruleInstancePassed = function(ruleInstance) {
  			 return ((ruleInstance.status == rsmConstants.RULE_STATUS.PASSED) || (ruleInstance.status == rsmConstants.RULE_STATUS.OVERRIDDEN) || (ruleInstance.status == rsmConstants.RULE_STATUS.NOT_APPLICABLE))
        } 
       
    	/* ---------------------------------------------------------------------------------------------------------------------------------------- */
        
        RecordStateManager.prototype.ruleInstanceFailed = function(ruleInstance) {
 			 return (ruleInstance.status == rsmConstants.RULE_STATUS.FAILED); 
        } 
      
    	/* ---------------------------------------------------------------------------------------------------------------------------------------- */

        RecordStateManager.prototype.userCanOverrideRule = function(rule) {
	    	var userRole = String(runtime.getCurrentUser().role);
	    	var userDept = String(runtime.getCurrentUser().department);

	    	if (!rule.buttonLabel)
	    		return false; 
            
	    	if (userRole == rsmConstants.ROLE_IS_ADMIN)
	    		return true; 

	    	
	    	var roles = rule.overrideRoles;
	    	var depts = rule.overrideDepartments; 

	    	if (roles.length && depts.length)
	    		return (roles.indexOf(userRole) >= 0 && depts.indexOf(userDept) >= 0);
	    	else
		    	if (roles.length)
		    		return (roles.indexOf(userRole) >= 0);
		    	else
		    		return (depts.indexOf(userDept) >= 0); 	    			
        } 
     
    	/* ---------------------------------------------------------------------------------------------------------------------------------------- */
        
        RecordStateManager.prototype.overridableRulesCount = function() {
	    	// counts all rules which have failed, CAN be overridden, and user is authorized to override them
        	
	    	var count = 0;

	    	var userRole = String(runtime.getCurrentUser().role);
	    	
            for (var r = 0; r < this.ruleInstances.length; r++) {
            	var ruleInstance = this.ruleInstances[r];
           	 	var rule = this.rules[ruleInstance.ruleId];
           	 	
           	 	if (this.ruleInstanceFailed(ruleInstance)) 
                    if (rule.buttonLabel) 
                    	if (this.userCanOverrideRule(rule))
                    		count++;
            }
            
            return count;
        	
	    }

    	/* ---------------------------------------------------------------------------------------------------------------------------------------- */

        RecordStateManager.prototype.userCanAddOptionalRules = function() {
	    	// checks whether there are any optional/ad-hoc rules which COULD be added to this record, and to which the current user has permission
        	
	    	var count = 0;

	    	var userRole = String(runtime.getCurrentUser().role);
	    	
	    	
    	    for (var r in this.rules) {
    	    	var rule = this.rules[r];
    	    	
    	    	if (this.userCanOverrideRule(rule)) {

	    	    	if (rule.ruleType == rsmConstants.RULE_TYPE.AD_HOC) 
	    	    		return true; 
    	    		
	    	    	if (rule.ruleType == rsmConstants.RULE_TYPE.OPTIONAL) {
	    	    		var ruleExists = false;
	    	    		for (var i = 0; i < this.ruleInstances.length; i++)
	    	    			if (this.ruleInstances[i].ruleId == rule.id)
	    	    				ruleExists = true;

	    	    		if (!ruleExists)
	    	    			return true;
	    	    	}
    	    	}
    	    }
    	    
    	    return false;
	    }

    	/* ======================================================================================================================================== */

        RecordStateManager.prototype.addOptionalRuleInstance = function(ruleId, name, parentId) {        	
	    	// adds an instance of an optional or ad-hoc rule

			 var INSTANCE = record.create({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE});

			 // log.debug("add","starting field=" + this.parentFieldName + "; parent=" + parentId);
			 
			 INSTANCE.setValue("custrecord_pri_rsm_rule_inst_status", rsmConstants.RULE_STATUS.FAILED);
			 INSTANCE.setValue("custrecord_pri_rsm_rule_inst_rule", ruleId);
			 INSTANCE.setValue(this.parentFieldName, parentId);

			 if (this.rules[ruleId].ruleType == rsmConstants.RULE_TYPE.AD_HOC) {
				 if (!name) 
					 throw "Name is required when adding instances of Ad-Hoc Rules.  Rule based on " + this.rules[ruleId].ruleName + " was not added.";
				 INSTANCE.setValue("custrecord_pri_rsm_rule_inst_name", name);
			 }    								
			 
			var id = INSTANCE.save();
			
			log.debug("add", id);
        }

    	/* ======================================================================================================================================== */

        RecordStateManager.prototype.scheduleBackgroundTask = function() {
			var funcName = scriptName + "scheduleBackgroundTask";
			
			try{					
				var retryCount = 1;
				var MAX_RETRIES = 5;
				
				do {						
					try {
						var scriptTask = task.create({'taskType': task.TaskType.SCHEDULED_SCRIPT});
			            scriptTask.scriptId = rsmConstants.SCHEDULED_SCRIPT_ID;
			            var scriptTaskId = scriptTask.submit();

			            log.debug(funcName, "Task Started");
						return;
						
					} catch (e1) {
						log.audit(funcName, "Failed attempt # " + retryCount + " to run scheduled script: " + e1.toString());
					}
				} while (retryCount++ < MAX_RETRIES);
				
				log.error(funcName, "Failed to schedule script.");
			
			}catch(e){
				log.error(funcName, e)
			}
        	
        }


    	/* ======================================================================================================================================== */

        RecordStateManager.prototype.evaluateRecord = function(executionType, debugMode) {
        			
        	var funcName = scriptName + "evaluateRecord " + this.REC.type + ":" + this.REC.id + " " + executionType + " DEBUG? " + debugMode;
        	
        	try {

        		if (!this.CONFIG)
        			return; 
        		
        		log.debug(funcName, "show=" + this.showRSMRunStatusField); 
        		
    			if (this.clientImplementation.checkComplete(this.REC, executionType)) {
    				log.debug(funcName, "Record has already been processed by PRI RSM.  Nothing left to do");
    				
    				if (this.showRSMRunStatusField)
    					if (this.REC.getValue(this.showRSMRunStatusField) != false) {
    						var submitValues = {};
    						submitValues[this.showRSMRunStatusField] = false;
    						if (!debugMode)
    							record.submitFields({type: this.REC.type, id: this.REC.id, values: submitValues, ignoreMandatoryFields: true});
    					}
    				if (!debugMode)	// if debugging, we continue regardless
    					return;
    			}
    			
				if (this.showRSMRunStatusField && this.REC.getValue(this.showRSMRunStatusField) != true) {
					var submitValues = {};
					submitValues[this.showRSMRunStatusField] = true; 
					if (!debugMode)
						record.submitFields({type: this.REC.type, id: this.REC.id, values: submitValues, ignoreMandatoryFields: true});
				}
    			
    			
    			this.evaluateRules(executionType, debugMode);
    			
    			if (debugMode) {
            		log.audit(funcName, "Evaluate Complete. " + elapsedTime(this.startTime).toFixed(2) + " seconds elapsed from instantiation of RSM to this point."); 
    				return; 
    			}
    			
    			
        		if (this.CONFIG.getValue("custrecord_pri_rsm_rectype_p_fr_list")) {
        			var fieldName = this.CONFIG.getValue("custrecord_pri_rsm_rectype_p_fr_list");
        			this.REC.setValue(fieldName, "");

        			var ruleList = [];
        			
            		for (var r = 0; r < this.ruleInstances.length; r++) {	    		 
            			var ruleInstance = this.ruleInstances[r];
            			var rule = this.rules[ruleInstance.ruleId];
            			
            			if (rule.ruleType == rsmConstants.RULE_TYPE.FIXED || rule.ruleType == rsmConstants.RULE_TYPE.OPTIONAL)
            				if (!this.ruleInstancePassed(ruleInstance))
           	    		 		ruleList.push(rule.id);
            		}
            		
        			/*
            		for (var r in this.rules) 
       	    		 	if (!this.rulePassed(this.rules[r]))
       	    		 		// this.REC.setValue(fieldName, this.rules[r].id);
       	    		 		ruleList.push(this.rules[r].id);
            		*/
            		
            		// log.debug(funcName, "These rules failed: " + JSON.stringify(ruleList)); 
            		
					var submitValues = {};
					submitValues[fieldName] = ruleList;
					record.submitFields({type: this.REC.type, id: this.REC.id, values: submitValues, ignoreMandatoryFields: true});
            		
            		// this.REC.setValue(fieldName, ruleList);
            		// this.REC.save();
        		}

        		
    			// log.debug(funcName, "rules evaluated.  control=" + this.CONFIG.getValue("custrecord_pri_rsm_rectype_status_ctrl"));
    			
    			
    			var controlObj = JSON.parse(this.CONFIG.getValue("custrecord_pri_rsm_rectype_status_ctrl") || "{}");
    			
    			for (var statusField in controlObj) {
    				// each entry here represents a status field which needs to be "moved along"

    				var currentStateNdx = -1, finalStateNdx = -1;		// this is how far we can go based on the rules at the moment 
    				
    				// first find out where we currently are

    				for (i = 0; i < controlObj[statusField].length; i++) 
    					if (controlObj[statusField][i].state == this.REC.getValue(statusField)) {
    						currentStateNdx = i;
    						break;
    					}
    				
    				// now, find out the "last" state we can get to based on the current state of rules
    				for (i = 0; i < controlObj[statusField].length; i++) {
    					var state = controlObj[statusField][i].state;
    					var stateRules = controlObj[statusField][i].rules;
    					    
    					// log.debug(funcName, "STATE=" + JSON.stringify(state) + "; RULES=" + JSON.stringify(stateRules)); 
    					// check whether all required rules have passed
    					var allRulesForStatePassed = true;
    					for (x = 0; x < stateRules.length; x++) {
    						
    						// log.debug(funcName, "  checking rule " + stateRules[x] + ": " + this.rulePassedByName(stateRules[x])); 
    						
    						if (!this.rulePassedByName(stateRules[x])) {
    							allRulesForStatePassed = false;
    							break;
    						}     					
    						
    					}
    					
    					if (allRulesForStatePassed)
    						finalStateNdx = i;
    					else
    						break;
    				}
    				
    				// we have determined the new status for the current status field
    				
    				if (finalStateNdx >= 0) {
        				log.debug(funcName, "Field " + statusField + " is currently " + this.REC.getValue(statusField) + " with an index of " + currentStateNdx + "; based on passed rules, it can go to index " + finalStateNdx);
    					// log.debug(funcName, "iterating through the status values ...");
    					
    					var currentState = (currentStateNdx < 0) ? null : controlObj[statusField][currentStateNdx].state;
    					
    					for (stateNdx = currentStateNdx+1; stateNdx <= finalStateNdx; stateNdx++) {
    						
    						if (this.REC.getValue(statusField) < controlObj[statusField][stateNdx].state || this.ignoreStateSequence) {
        						var submitValues = {};
        						submitValues[statusField] = controlObj[statusField][stateNdx].state;
        						
        						log.debug(funcName, "Changing Status: " + JSON.stringify(submitValues) + " using " + this.updateStatusUsingEditSave ? "Edit/Save" : "XEDIT"); 
        						
        						if (this.updateStatusUsingEditSave) {
        							var REC = record.load({type: this.REC.type, id: this.REC.id}); 
        							REC.setValue(statusField, submitValues[statusField]);
        							REC.save();
        						} else
        							record.submitFields({type: this.REC.type, id: this.REC.id, values: submitValues, ignoreMandatoryFields: true});

        						this.clientImplementation.changeStatus(this.REC, statusField, currentState, controlObj[statusField][stateNdx].state, controlObj[statusField][finalStateNdx].state);
        						
        						currentState = controlObj[statusField][stateNdx].state;    							
    						} 
    						// else
    						//	log.debug(funcName, "Skipping status '" + controlObj[statusField][stateNdx].state + "' because record is already beyond that");
    					}
    					
    					//todo: need to submit status, as well as control field with all failed rules
    					// _REC.setValue(statusField, controlObj[statusField][finalStateNdx].state);
    				}     				
    			}
    			
        		if (this.allRulesPassed())
        			this.clientImplementation.markComplete(this.REC);
        		else {
        			try {
            			this.clientImplementation.markIncomplete(this.REC);        				
        			} catch (e1) {
        				if (e1.code != "SSS_METHOD_NOT_IMPLEMENTED")
    		        		throw e1;
        			}
        		}

        		log.audit(funcName, "Evaluate Complete. " + elapsedTime(this.startTime).toFixed(2) + " seconds elapsed from instantiation of RSM to this point."); 
        		
        		
			} catch (e) {
        		log.error(funcName, e);
        	}
        		
        }
        
    	/* ======================================================================================================================================== */

        RecordStateManager.prototype.showRuleOnSummaryTable = function(ruleInstance) {
        	var fld = this.CONFIG.getValue("custrecord_pri_rsm_rectype_rules_to_show");
        	return fld.length == 0 || priLibrary.isSelectFieldItemSelected(this.CONFIG, "custrecord_pri_rsm_rectype_rules_to_show", ruleInstance.status); 
        }
                
        /* ======================================================================================================================================== */
        
        function elapsedTime(startTime) {        	
        	var NANOTIME_PER_SECOND = 1000000000; 
        	
        	return ((util.nanoTime() - startTime) / NANOTIME_PER_SECOND);
        }

        
    	/* ======================================================================================================================================== */

        function manualRuleInstanceOverride(REC, ruleInstanceId, notes) {
        	
			var funcName = scriptName + "manualRuleInstanceOverride" + ruleInstanceId + " | " + REC.type + " | " + REC.id; 
	
			var INSTANCE = record.load({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE, id: ruleInstanceId});
			
	
			// we need to determine whether this record type has its own plugin implementation
			
			var ss = search.create({
				type:		rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RECORD_TYPE,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["name",search.Operator.IS,REC.type]				        	 	 
				        	 ],
				columns:	["custrecord_pri_rsm_rectype_plugin"]				
			}).run().getRange(0,1); 
			
			var pluginName = "";
			if (ss.length > 0 && ss[0].getValue("custrecord_pri_rsm_rectype_plugin"))
				pluginName = ss[0].getValue("custrecord_pri_rsm_rectype_plugin");
			
			
			clientImplementation = loadPluginImplementation(pluginName);

			// var REC = record.load({type: recType, id: recId});
	        
			// look up rule short name
			var ruleName = search.lookupFields({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE, id: INSTANCE.getValue("custrecord_pri_rsm_rule_inst_rule"), columns: ["custrecord_pri_rsm_rule_short_name"]}).custrecord_pri_rsm_rule_short_name;
			
	        // if the client plugin didn't handle this override, then we need to
	        if (!clientImplementation.manualOverride(REC, ruleName)) {
	        	INSTANCE.setValue("custrecord_pri_rsm_rule_inst_status", rsmConstants.RULE_STATUS.OVERRIDDEN);
	        	INSTANCE.setValue("custrecord_pri_rsm_rule_inst_override", runtime.getCurrentUser().id);
	        	INSTANCE.setValue("custrecord_pri_rsm_rule_inst_last_chg", new Date());
	        	INSTANCE.setValue("custrecord_pri_rsm_rule_inst_notes", notes);
				
				var id = INSTANCE.save();
				
				log.debug(funcName, "Rule Instance saved.  id=" + id);
	        } 			
        }        
        
    	/* ======================================================================================================================================== */

        function loadPluginImplementation(pluginName) {
        	var funcName = scriptName + "loadPluginImplementation " + pluginName; 
        	
	    	if (pluginName) {
	    		log.debug(funcName, "Loading Custom Plugin"); 		    		
	    	} else {
        		pluginName = plugin.findImplementations({type: rsmConstants.PLUGIN_NAME, includeDefault: false})[0];
	        	log.debug(funcName, "Loading Default/Only Plugin " + pluginName); 
	    	}

    		return plugin.loadImplementation({type: rsmConstants.PLUGIN_NAME, implementation: pluginName});
        }
        
    	/* ======================================================================================================================================== */

        // use this when a rule was manually overridden in the past, but now you want to clear that override, so that in the next evaluation it will get re-evaluated
        // because this function is called from a client-specific script, it can't use the engine itself, because the engine loads the plugins, which won't work from any script 
        //	which is not part of the bundle
        function clearRuleInstanceOverride(REC, ruleShortName) {
        	
			var funcName = scriptName + "clearRuleInstanceOverride " + REC.type + " " + REC.id + " " + ruleShortName;
			
			try {
				
		    	var s = search.create({
		    		type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RECORD_TYPE, 
		    		filters: [["name", search.Operator.IS, REC.type]], 
		    		columns: ["custrecord_pri_rsm_rectype_is_tran","custrecord_pri_rsm_rectype_p_ref_field","custrecord_pri_rsm_rectype_is_entity"]
		    	}).run().getRange(0,1);
		    	
		    	if (s.length == 0)
		    		throw "State Engine is not configured for record type '" + REC.type + "'";
	

		    	var parentFieldName = "";
		    	if (s[0].getValue("custrecord_pri_rsm_rectype_p_ref_field"))
		    		parentFieldName = s[0].getValue("custrecord_pri_rsm_rectype_p_ref_field");
		    	else
	    			if (s[0].getValue("custrecord_pri_rsm_rectype_is_tran"))
	    				parentFieldName = "custrecord_pri_rsm_rule_inst_tran_ref";
	    			else if (s[0].getValue("custrecord_pri_rsm_rectype_is_entity"))
	    				parentFieldName = "custrecord_pri_rsm_rule_inst_entity_ref";
                
		    	
		    	// now find the rule instance for this record, and matching the rule short name
	    		var s = search.create({
	                type: 		rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE,
	                filters:	[
	                          		["isinactive", search.Operator.IS, false]
	                          		,"AND",[parentFieldName, search.Operator.ANYOF, REC.id]
	                          		,"AND",["custrecord_pri_rsm_rule_inst_rule.custrecord_pri_rsm_rule_short_name",search.Operator.IS,ruleShortName]
	                          	],
	                columns:	["custrecord_pri_rsm_rule_inst_status"]
	            }).run().getRange(0,1);
	    		
	    		log.debug(funcName, s); 
	    		
	    		// if we found the instance, and it is in OVERRIDDEN status, then we can go ahead and clear it
	    		if (s.length > 0) {
	    			if (s[0].getValue("custrecord_pri_rsm_rule_inst_status") == rsmConstants.RULE_STATUS.OVERRIDDEN) {
	    				log.debug(funcName, "Clearing Instance " + s[0].id); 
	    				record.submitFields({
	    					type:		rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE,
	    					id:			s[0].id,
	    					values: 	{
	    						custrecord_pri_rsm_rule_inst_status:	rsmConstants.RULE_STATUS.NOT_YET_CHECKED,
	    						custrecord_pri_rsm_rule_inst_override:	"",
	    						custrecord_pri_rsm_rule_inst_last_chg:	format.format({value: new Date(), type: format.Type.DATETIME}),
	    						custrecord_pri_rsm_rule_inst_expl:		"",
	    						custrecord_pri_rsm_rule_inst_notes:		""
	    					}
	    				})
	    			}
	    		} 
		    	
			} catch (e) {
        		log.error(funcName, e);
        	}
        }

    	/* ======================================================================================================================================== */
        

        return {
        	createRecordStateManager: 		createRecordStateManager, 
        	
        	manualRuleInstanceOverride:		manualRuleInstanceOverride,
        	
        	clearRuleInstanceOverride:		clearRuleInstanceOverride
        };

	}	
);

