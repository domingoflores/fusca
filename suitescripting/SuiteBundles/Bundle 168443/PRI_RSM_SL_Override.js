//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_SL_Override.js
//Description:	Prolecto Record State Manager: Suitelet for Overriding Rules 
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

define(['N/url','N/log','N/record','N/search','N/runtime','N/plugin','./PRI_RSM_Engine','./PRI_RSM_Constants'],
		
	function(url, log, record, search, runtime, plugin, rsmEngine, rsmConstants) {
	
		"use strict";
	
		function onRequest(context) {

			var funcName = "PRI_RSM_SL_Override.onReques ";
			
			try {
				
				if (context.request.method === 'GET') {
					var ruleInstanceId = context.request.parameters.ruleInstanceId;
					var recType = context.request.parameters.recType;
					var recId = context.request.parameters.recId;
					var notes = context.request.parameters.notes || "";
					
					funcName += ruleInstanceId + " | " + recType + " | " + recId;
			
					
					var REC = record.load({type: recType, id: recId});
					
					rsmEngine.manualRuleInstanceOverride(REC, ruleInstanceId, notes) 
						 
					/*	 
					 
					
					var RULE = record.load({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE_INSTANCE, id: ruleInstanceId});
					
					
			        var clientPlugin = plugin.loadImplementation({type: 'customscript_pri_rsm_plugin'});

			        log.debug(funcName, "override=" + JSON.stringify(clientPlugin));

					var REC = record.load({type: recType, id: recId});
			        
					// look up rule short name
					var ruleName = search.lookupFields({type: rsmConstants.CUSTOM_RECORD_TYPE.PRI_RSM_RULE, id: RULE.getValue("custrecord_pri_rsm_rule_inst_rule"), columns: ["custrecord_pri_rsm_rule_short_name"]}).custrecord_pri_rsm_rule_short_name;
					
			        // if the client plugin didn't handle this override, then we need to
			        if (clientPlugin.manualOverride(REC, ruleName)) {
						// if the manual override fixed the record, then it probably changed it, so we need the latest version of it for the RSM engine to re-evaluate 
						REC = record.load({type: recType, id: recId});
			        } else {
			        	// otherwise, we continue to hard-override the rule
						RULE.setValue("custrecord_pri_rsm_rule_inst_status", rsmConstants.RULE_STATUS.OVERRIDDEN);
						RULE.setValue("custrecord_pri_rsm_rule_inst_override", runtime.getCurrentUser().id);
						RULE.setValue("custrecord_pri_rsm_rule_inst_last_chg", new Date());
						
						var id = RULE.save();
						
						log.debug(funcName, "Rule saved.  id=" + id);
			        } 
					*/

					// now re-evaluate the underlying record
					var rsm = rsmEngine.createRecordStateManager(REC);      
					rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.ALL_RULES);

					context.response.sendRedirect({type: "RECORD", identifier: recType, id: recId});
				}
	
			} catch (e) {
				log.error(funcName, e);
			}

		}
		
    return {
        onRequest: onRequest
    };
    
});


