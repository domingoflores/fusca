//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*
 * 
 * uses the Queue Manager to ready queue records which represent RSM Rules to Override, or Cases to create for them 
 * 
 */


define(['N/runtime','N/record','N/error','N/search'
        ,'/.bundle/168443/PRI_RSM_Constants'
        ,'/.bundle/132118/PRI_QM_Engine'
        ,'/.bundle/132118/PRI_AS_Engine'
        ,'/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,rsmConstants,qmEngine,appSettings,priLibrary) {

	var scriptName = "SRS_MR_OverrideRSMRules.";

	const APP_ID = "RSM";

    function getInputData() {

		var funcName = scriptName + "getInputData";
		
		log.debug(funcName, "### STARTING ###"); 
		
		return qmEngine.getAllQueueEntries(appSettings.readAppSetting(APP_ID, "Override RSM Rules Queue Name"));
		
	}
	
	
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map " + context.key;
    
    	var mapObj = JSON.parse(context.value);    	

    	log.debug(funcName, mapObj); 
    	
    	var obj = qmEngine.getQueueEntry(context.key);		
    	
    	var msg = "";
    	
		if (obj !== null && typeof obj === 'object') {

	    	try {
    			var parms = JSON.parse(obj.parms);

    			if (parms.action == "Override Rule") {
    				
    				var fieldsToUpdate = {
    						custrecord_pri_rsm_rule_inst_status:	rsmConstants.RULE_STATUS.OVERRIDDEN,
    						custrecord_pri_rsm_rule_inst_override:	parms.userId,
    						custrecord_pri_rsm_rule_inst_last_chg:	priLibrary.currentDateTimeStr()
    				}
    				
    				if (parms.notes)
    					fieldsToUpdate.custrecord_pri_rsm_rule_inst_notes = parms.notes; 
    				
    				record.submitFields({type: "customrecord_pri_rsm_rule_instance", id: parms.ruleInstanceId, values: fieldsToUpdate});
    				    				
    				log.audit(funcName, "Rule Instance " + parms.ruleInstanceId + " was updated: " + JSON.stringify(fieldsToUpdate));
    				
        			qmEngine.markQueueEntryComplete(obj.id, "Rule Instance Overridden");

    			} else if (parms.action == "Create Case") {
    				// load the Exchange Record 
    				var EXCHG = record.load({type: "customrecord_acq_lot", id: parms.exchangeId});
    				
    				var INSTANCE = record.load({type: "customrecord_pri_rsm_rule_instance", id: parms.ruleInstanceId});
    				
    				var CASE = record.create({type: record.Type.SUPPORT_CASE});
    				
    				var dt = new Date();
    				dt.setHours(dt.getHours() + 1);
    				
    				var am = "am";
    				
    				if (dt.getHours() > 12) {
        				dt.setHours(dt.getHours() - 12);
        				am = "pm";    					
    				}
    				
    				var timeStr = dt.format("m/dd/yyyy h:nn") + am;
    				
    				CASE.setValue("title", INSTANCE.getText("custrecord_pri_rsm_rule_inst_rule") + " - " + EXCHG.getText("custrecord_acq_loth_zzz_zzz_shareholder") + " - " + EXCHG.id + " - " + timeStr);
    				
    				CASE.setValue("custevent_case_department", parms.caseDepartment);
    				CASE.setValue("custevent_case_queue", parms.caseQueue);
    				CASE.setValue("custevent_case_category", parms.caseCategory); 
    				
    				CASE.setValue("company", EXCHG.getValue("custrecord_acq_loth_zzz_zzz_shareholder"));
    				CASE.setValue("contact", EXCHG.getValue("custrecord_acq_loth_zzz_zzz_contact"));
    				CASE.setValue("custevent1", EXCHG.getValue("custrecord_acq_loth_zzz_zzz_deal"));
    				CASE.setValue("custevent_qx_acq_associatedexchangereco", EXCHG.id);
    				CASE.setValue("custevent_rsm_rule_instance", INSTANCE.id); 
    				
    				var msg = "The linked Exchange Record failed the " + INSTANCE.getText("custrecord_pri_rsm_rule_inst_rule") + " RSM rule.  Please reach out to the securityholder accordingly.";
    				if (parms.notes)
    					msg += "\n\n" + parms.notes;
    				
    				CASE.setValue("incomingmessage",msg);
    				
    				var caseId = CASE.save(); 
    				
    				log.audit(funcName, "Case " + caseId + " created."); 
    				
        			qmEngine.markQueueEntryComplete(obj.id, "Case " + caseId + " created.");
    				
        			if (parms.notes) 
        				record.submitFields({type: "customrecord_pri_rsm_rule_instance", id: parms.ruleInstanceId, values: {custrecord_pri_rsm_rule_inst_notes: parms.notes}});        				
    				
    			} else 
    				throw "Unexpected/Unhandled action: " + parms.action;
    			
        		context.write(obj.id, null); 
	    	} catch (e) {
	    		log.error(funcName, e);
	    		qmEngine.abandonQueueEntry(obj.id, null, JSON.stringify(e)); 
	    	}

		}
        			
	}
		
	// ================================================================================================================================


    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));

    	
    	var recsUpdated = 0;
    	summary.output.iterator().each(function (key, value) {
    		recsUpdated++;  
    		return true; 
    	}); 
    	
    	log.debug(funcName, recsUpdated + " record(s) processed'.");
    	
    	log.debug(funcName, "Exiting");    	
    }

	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================


    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

}
);
