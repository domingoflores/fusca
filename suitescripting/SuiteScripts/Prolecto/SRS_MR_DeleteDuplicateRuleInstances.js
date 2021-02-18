//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Finds Duplicate Rule Instances on Exchange Record, and deletes all but the "most recently changed" one
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/task','/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,file,task,priLibrary) {

	var scriptName = "SRS_MR_DeleteDuplicateRuleInstances.";


    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Process is starting");

		var ss = search.create({
			type: 		"customrecord_pri_rsm_rule_instance",
			filters:	[
			        	 	["custrecord_pri_rsm_rule_inst_exchg_ref","noneof","@NONE@"] 
			        	 	,"AND",["count(internalid)","greaterthan","1"]
			        	 ],
			columns:	[
			        	 search.createColumn({name: "internalid",join: "CUSTRECORD_PRI_RSM_RULE_INST_EXCHG_REF",summary: "GROUP",label: "Internal ID"}),
			        	 search.createColumn({name: "custrecord_pri_rsm_rule_inst_rule",summary: "GROUP",label: "Rule Reference"}),
			        	 search.createColumn({name: "internalid",summary: "COUNT",label: "Internal ID"})
			        	 ]
			});	 
		
		return ss; 		
	}
	
	
	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map ";

    	try {
    		
    		// log.debug(funcName, context); 
    		
    		/*
    		 * {"type":"mapreduce.MapContext","isRestarted":false,"executionNo":1,"key":"1","value":"{"recordType":null,"id":"1",
    		 * 	"values":{
    		 * 		"GROUP(internalid.CUSTRECORD_PRI_RSM_RULE_INST_EXCHG_REF)":{"value":"519275","text":"519275"},
    		 * 		"GROUP(custrecord_pri_rsm_rule_inst_rule)":{"value":"3","text":"Counsel Approved to Pay"},
    		 * 		"COUNT(internalid)":"2"}}"}
    		 *
    		*/
        	var obj = JSON.parse(context.value);
    		
        	var exchangeRecId = obj.values["GROUP(internalid.CUSTRECORD_PRI_RSM_RULE_INST_EXCHG_REF)"].value;
        	var ruleId = obj.values["GROUP(custrecord_pri_rsm_rule_inst_rule)"].value;
        	
        	log.debug(funcName, "Looking for duplicates of rule " + ruleId + " on Exchange Record " + exchangeRecId); 
        	
        	var ss = search.create({
        		type:		"customrecord_pri_rsm_rule_instance",
        		filters:	[
        		        	 	["custrecord_pri_rsm_rule_inst_exchg_ref",search.Operator.ANYOF,[exchangeRecId]]
        		        	 	,"AND",["custrecord_pri_rsm_rule_inst_rule",search.Operator.ANYOF,[ruleId]]
        		        	 ],
        		columns:	[
        		        	 	search.createColumn({name: "custrecord_pri_rsm_rule_inst_last_chg", sort: search.Sort.DESC})
        		        	 ]
        	}).run().getRange(0,100); 
        	
        	// delete all instances after the 1st one; we sorted in DESCENDING order, so the "newest" one is on top
        	for (var i = 1; i < ss.length; i++) {
        		record.delete({type: "customrecord_pri_rsm_rule_instance", id: ss[i].id}); 
        		log.audit(funcName, "Deleting Rule Instance for Rule " + ruleId + " on Exchange Record " + exchangeRecId); 
        	}
        	
	    	context.write(exchangeRecId, ruleId); 	    	        	
    		
    	} catch (e) {
    		log.error(funcName, e); 
    	}
		
	}

	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	log.debug(funcName, summary); 
    	
    	var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));
    	

    	var exchangeRecordsCleaned = 0;
    	
    	summary.output.iterator().each(function(key, value) {
    		exchangeRecordsCleaned++;     		
    		return true;	    		
    	});

    	log.audit(funcName, exchangeRecordsCleaned + " Exchange Record Rules were de-duped."); 
    		
    	log.debug(funcName, "Exiting");    	
    }


	// ================================================================================================================================
	// ================================================================================================================================


    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };

}
);
