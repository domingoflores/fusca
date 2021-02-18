//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		Processes all records in the Import Staging Table, using the appropriate plugin to perform the actual work
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/plugin','N/task','N/url','./PRI_RIEM_Common'],
		
	function(runtime,record,error,search,plugin,task,url,riemCommon) {

	var scriptName = "PRI_RIEM_MR_ProcessImportStagingRecords."
	
    function getInputData() {

		var funcName = scriptName + "getInputData";
		

		var recSearch = search.create({
			type: 		riemCommon.CUSTOM_RECORD.IMPORT_STAGING,
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pri_riem_impstg_status",search.Operator.ANYOF,[riemCommon.STAGING_STATUS.PENDING,riemCommon.STAGING_STATUS.FAILED_RETRYING]]
			        	 	,"AND",["custrecord_pri_riem_impstg_job.custrecord_pri_riem_job_status",search.Operator.ANYOF,[riemCommon.JOB_STATUS.IMPORT_FILE_IMPORTED_INTO_STAGING,riemCommon.JOB_STATUS.IMPORT_PROCESSING_STAGING_RECORDS]]
			        	 	,"AND",["custrecord_pri_riem_impstg_jobtype.custrecord_pri_riem_jobt_plugin_name",search.Operator.STARTSWITH,"customscript"]
			        	 ],
			columns: 	["custrecord_pri_riem_impstg_job","custrecord_pri_riem_impstg_jobtype.custrecord_pri_riem_jobt_plugin_name","custrecord_pri_riem_impstg_jobtype.custrecord_pri_riem_jobt_imp_ext_id_ptrn","custrecord_pri_riem_impstg_jobtype.custrecord_pri_riem_jobt_imp_max_retries","custrecord_pri_riem_impstg_job.custrecord_pri_riem_job_file"]
		}); // .run().getRange(0,999);
		
		// log.debug(funcName, "Found " + recSearch.length + " rows");
		
		
		return recSearch;
		
	}
	

	
	// ================================================================================================================================

    function reduce(context) {
    	var funcName = scriptName + "reduce";
    	
    	// log.audit(funcName, "Processing ID " + context.key + " : " + JSON.stringify(context));
    	
		var R = record.load({type: riemCommon.CUSTOM_RECORD.IMPORT_STAGING, id: context.key});

		// if the parent job is not in the right status, then update it
		var jobStatus = search.lookupFields({type: riemCommon.CUSTOM_RECORD.JOB, id: R.getValue("custrecord_pri_riem_impstg_job"), columns: "custrecord_pri_riem_job_status"}).custrecord_pri_riem_job_status;
		
		if (jobStatus.length > 0 && jobStatus[0].value != riemCommon.JOB_STATUS.IMPORT_PROCESSING_STAGING_RECORDS)
			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: R.getValue("custrecord_pri_riem_impstg_job"), values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.IMPORT_PROCESSING_STAGING_RECORDS}})
					
			
		// if this record is not eligible for work, then get out
		if (R.getValue("custrecord_pri_riem_impstg_status") != riemCommon.STAGING_STATUS.PENDING && R.getValue("custrecord_pri_riem_impstg_status") != riemCommon.STAGING_STATUS.FAILED_RETRYING) {
			context.write(R.getValue("custrecord_pri_riem_impstg_job"), null);
	    	return;
		}
		
		
		try {
			
			var obj = JSON.parse(context.values[0]);

        	var failCount = R.getValue("custrecord_pri_riem_impstg_failures") || 0;
        	// if (!failCount || isNaN(failCount))
//         		failCount = 0;
        	
			var pluginName = obj.values["custrecord_pri_riem_jobt_plugin_name.custrecord_pri_riem_impstg_jobtype"]; 
			

        	var pluginImplementation = plugin.loadImplementation({type: riemCommon.PLUGIN_TYPES.IMPORT, implementation: pluginName});

        	// build the externalId based on the field settings; implementation can override if necessary
        	var externalId = obj.values["custrecord_pri_riem_jobt_imp_ext_id_ptrn.custrecord_pri_riem_impstg_jobtype"];
        	
        	if (externalId) {
        		var payloadObj = JSON.parse(R.getValue("custrecord_pri_riem_impstg_payload"));
        		
        		var loopCount = 0;
        		// replace all referenced field names
        		var nextField = externalId.match(/{(.*?)}/);
        		while (nextField) {
        			var fieldName = nextField[1];
        			var fieldValue = "";
        			if (payloadObj.length > 0)
        				fieldValue = payloadObj[0][fieldName];
        			
        			externalId = externalId.replace(nextField[0],fieldValue);        			

            		var nextField = externalId.match(/{(.*?)}/);
            		
            		// infinite loop preventor
            		if (loopCount++ > 20)
            			break;
        		}
        	}
        	
	        // plugin will update the record, so we only need to save it
	         var respObj = pluginImplementation.createRecord(R.getValue("custrecord_pri_riem_impstg_payload"), externalId, context);
	         
	         if (respObj && respObj.status) {
	        	 R.setValue("custrecord_pri_riem_impstg_status",respObj.status);
	        	 if (respObj.status == riemCommon.STAGING_STATUS.FAILED_RETRYING)
	        		 failCount++;	        		 
	         }
	         
	         if (respObj && respObj.hasOwnProperty("message"))
	        	 if (respObj.message.length > 4000)
	        		 R.setValue("custrecord_pri_riem_impstg_message",respObj.message.substring(0,4000));
	        	 else
	        		 R.setValue("custrecord_pri_riem_impstg_message",respObj.message);
	        
	         if (respObj && respObj.recordType)
	        	 R.setValue("custrecord_pri_riem_impstg_rectype",respObj.recordType);
	         if (respObj && respObj.recordId)
	        	 R.setValue("custrecord_pri_riem_impstg_recid",respObj.recordId);
	         
	         if (R.getValue("custrecord_pri_riem_impstg_rectype") && R.getValue("custrecord_pri_riem_impstg_recid")) {	        	 
	        	 R.setValue("custrecord_pri_riem_impstg_link", url.resolveRecord({recordType: R.getValue("custrecord_pri_riem_impstg_rectype"), recordId: R.getValue("custrecord_pri_riem_impstg_recid")}));	        	 	        	 
	         }
	        
	         
	        // write out the JOB ID; at the end of this script, we will look at all the JOBS and update their status in case all records for them were completed
	        
	    	context.write(R.getValue("custrecord_pri_riem_impstg_job"), null);
	    	
	    	
		} catch (e) {
			R.setValue("custrecord_pri_riem_impstg_message", e.toString());
			R.setValue("custrecord_pri_riem_impstg_status", riemCommon.STAGING_STATUS.FAILED_RETRYING);
			failCount++;
			log.error(funcName, e);

		} finally {
			R.setValue("custrecord_pri_riem_impstg_failures",failCount);
			
			log.debug(funcName, "failCount=" + failCount + ";  max=" + obj.values["custrecord_pri_riem_jobt_imp_max_retries.custrecord_pri_riem_impstg_jobtype"]);
			
			if (obj.values["custrecord_pri_riem_jobt_imp_max_retries.custrecord_pri_riem_impstg_jobtype"])
				if (failCount >= obj.values["custrecord_pri_riem_jobt_imp_max_retries.custrecord_pri_riem_impstg_jobtype"])
					if (R.getValue("custrecord_pri_riem_impstg_status") != riemCommon.STAGING_STATUS.PROCESSED && R.getValue("custrecord_pri_riem_impstg_status") != riemCommon.STAGING_STATUS.SKIPPED)
						R.setValue("custrecord_pri_riem_impstg_status",riemCommon.STAGING_STATUS.FAILED_ABANDONED);
				
			R.save();
		}
		
	}
		
	// ================================================================================================================================


    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	var errorMsgs = riemCommon.extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));


    	var jobsProcessed = [];
    	
    	summary.output.iterator().each(function(key, value) {
    		
    		// log.debug(funcName, "Retrieved KEY=" + key + " VALUE=" + JSON.stringify(value));
    	
    		if (jobsProcessed.indexOf(key) < 0)
    			jobsProcessed.push(key);

    		return true;	    		
    	});

    	jobsProcessed.forEach(function (jobId) {    	
    		log.debug(funcName, "Checking whether JOB " + jobId + " is now complete");
    		checkJobStatus(jobId);
    	});
    	
    	
    	// final cleanup; see if there are any jobs which are still in "processing" status, but which have no import records ready to be processed
    	log.debug(funcName, "Looking for Jobs which need to be closed out.");
		var jobSearch = search.create({
			type:		riemCommon.CUSTOM_RECORD.JOB,
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pri_riem_job_status",search.Operator.ANYOF,[riemCommon.JOB_STATUS.IMPORT_PROCESSING_STAGING_RECORDS]]
			        	 ]
		}).run().getRange(0,100);
		
		
		for (var i = 0; i < jobSearch.length; i++)
			checkJobStatus(jobSearch[i].id);
		
		
    	log.debug(funcName, "Exiting");
    	
    }

	// ================================================================================================================================

    function checkJobStatus(jobId) {
    	var funcName = scriptName + "checkJobStatus " + jobId;

		var pendingSearch = search.create({
			type:		riemCommon.CUSTOM_RECORD.IMPORT_STAGING,
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pri_riem_impstg_job",search.Operator.ANYOF,[jobId]]
			        	 	,"AND",["custrecord_pri_riem_impstg_status",search.Operator.ANYOF,[riemCommon.STAGING_STATUS.PENDING,riemCommon.STAGING_STATUS.FAILED_RETRYING]]
			        	 ]
		}).run().getRange(0,1);
		
		if (pendingSearch.length == 0) {
			// there are no staging records which are still waiting to be processed ... so the job should be complete.  
			//		if any failed, then mark it as "complete with errors"
			//		otherwise, mark it as "complete"
			
			// job is complete; check whether any failed and were abandoned
    		var failedSearch = search.create({
    			type:		riemCommon.CUSTOM_RECORD.IMPORT_STAGING,
    			filters:	[
    			        	 	["isinactive",search.Operator.IS,false]
    			        	 	,"AND",["custrecord_pri_riem_impstg_job",search.Operator.ANYOF,[jobId]]
    			        	 	,"AND",["custrecord_pri_riem_impstg_status",search.Operator.ANYOF,[riemCommon.STAGING_STATUS.FAILED_ABANDONED]]
    			        	 ]
    		}).run().getRange(0,1);
			
    		if (failedSearch.length == 0) {
    			log.audit(funcName, "Marking Job as 'Complete', since there are no unprocessed staging records left.");
    			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED}})        			
    		} else {
    			log.audit(funcName, "Marking Job as 'Completed with Errors', since there are no unprocessed staging records left, but some were abandoned.");
    			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED_WITH_ERRORS}})
    		}    			
		}    		
    	
    }

	// ================================================================================================================================


    return {
        getInputData: getInputData,
        // map: map,
        reduce: reduce,
        summarize: summarize
    };

}
);
