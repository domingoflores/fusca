//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Changes the Prepared Email records for a particular job to a particular status
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/task','/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,file,task,priLibrary) {

	var scriptName = "SRS_MR_PreparedEmail_HandleMassStatusChange.";

	const JOB_STATUS = {
			  NEW: 1,
			  IN_PROCESS: 2,
			  CANCELED: 3,
			  COMPLETED: 4,
			  ERROR: 5,
			  READY_FOR_CONFIRMATION: 6,
			  APPROVED: 7,
			  REJECTED: 8,
			  REVIEW_COMPLETE: 9,
			  PAUSED: 10
			}

    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Process is starting");

		var jobId = runtime.getCurrentScript().getParameter({'name':"custscript_mr_prepared_email_job_id_c"});
	    var newEmailJobStatus = runtime.getCurrentScript().getParameter({'name':"custscript_mr_prepared_email_job_status"})  
		
		if (!jobId) 
			throw "No Job ID passed in as parameter";

		if (!newEmailJobStatus) 
			throw "New status not specified";


		log.debug(funcName, "Setting emails of job job " + jobId + " to status " + newEmailJobStatus); 
		
		var ss = search.create({
			type:		"customrecord_prepared_emails",
			filters:	[
			        	 	["custrecord_prepared_email_job",search.Operator.IS,jobId]
			        	 	,"AND",["custrecord_prepared_email_status",search.Operator.NONEOF,[JOB_STATUS.COMPLETED]]
			        	 	,"AND",["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_prepared_email_status",search.Operator.ANYOF,[JOB_STATUS.NEW,JOB_STATUS.READY_FOR_CONFIRMATION]]
//			        	 	,"AND",["internalidnumber",search.Operator.EQUALTO,[3574285]]
			        	 ],
			columns:	["custrecord_prepared_email_job",search.createColumn({name: "formulatext_99", formula: "'" + jobId + "'"}),search.createColumn({name: "formulatext_98", formula: "'" + newEmailJobStatus + "'"})]
		}); 
		
//		ss.filters.push("AND");				
//	    if(parseInt(newEmailJobStatus) == JOB_STATUS.APPROVED)
//	        ss.filters.push(["custrecord_prepared_email_status",search.Operator.ANYOF,[JOB_STATUS.READY_FOR_CONFIRMATION]]);
//	    else
//	        ss.filters.push(["custrecord_prepared_email_status",search.Operator.ANYOF,[JOB_STATUS.NEW,JOB_STATUS.READY_FOR_CONFIRMATION]]);		
	        
		return ss; 		
	}
	
	
	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map ";

    	try {
    		
        	var obj = JSON.parse(context.value);
    		
        	var emailId = obj.id; 

        	funcName += emailId; 

	    	var jobId = obj.values.formulatext_99;
	    	var newStatus = obj.values.formulatext_98;

    		log.debug(funcName, context); 
    		
        	var EMAIL = record.load({type: "customrecord_prepared_emails", id: emailId});        	
        	EMAIL.setValue("custrecord_prepared_email_status", newStatus); 
        	EMAIL.save(); 
    		
	    	context.write(jobId, jobId); 	    	
        	
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
    	
    	
    	var jobId;   
    	
    	summary.output.iterator().each(function(key, value) {
    		if (!jobId) {
    			jobId = value;  
    			return false;
    		}    		
    		return true;	    		
    	});

    	if (jobId)
    		record.submitFields({type: "customrecord_prepared_email_job", id: jobId, values: {custrecord_prepared_email_job_status: JOB_STATUS.REVIEW_COMPLETE}}); 

    		
    	log.debug(funcName, "Exiting");    	
    }


	// ================================================================================================================================
	// ================================================================================================================================


    return {
        getInputData: getInputData,
        map: map,
//        reduce: reduce,
        summarize: summarize
    };

}
);
