//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/*
 * Prolecto Record Import/Export Manager: Generic Map/Reduce script to process any EXPORT file
 * 
 */


define(['N/runtime','N/record','N/error','N/search','N/file','N/email','N/plugin','N/file','N/url','N/https','./PRI_RIEM_Common','/.bundle/132118/PRI_ServerLibrary'],

	function(runtime,record,error,search,file,email,plugin,file,url,https,riemCommon,priLibrary) {

		"use strict"; 
		
		var scriptName = "PRI_RIEM_MR_Export.";

		const PLUGIN_NOT_APPLICABLE = "n/a"; 
		
    	/* ======================================================================================================================================== */
		
		function getInputData() {
	
			var funcName = scriptName + "getInputData";
			
			log.debug(funcName, "Starting");

			// clear out the cache
        	priLibrary.writeToScriptDeploymentCache("{}"); 

			
			// look for any PRI Record I/O Manager records for Exports which are in "Pending" status
			
			var jobSearch = search.create({
				type:		riemCommon.CUSTOM_RECORD.JOB,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_process_type",search.Operator.ANYOF,[riemCommon.PROCESS_TYPE.EXPORT]]
				        	 	,"AND",["custrecord_pri_riem_job_status",search.Operator.ANYOF,[riemCommon.JOB_STATUS.READY_TO_START]]
				        	 ],
				columns:	["custrecord_pri_riem_job_type","custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_exp_ss","custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_plugin_name",
				        	 "custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_exp_max_recs","custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_ref_field_name",
				        	 "custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_ap_reffieldname"
				        	 ]
			}).run().getRange(0,99);
			
			if (jobSearch.length == 0) {
				log.debug(funcName, "No Pending Export Job found.  Exiting");
				return;
			}
			
			
						
			// even though we will process only one, we return multiple, in case someone "grabs" one while we're trying to grab it
			
			log.debug(funcName, "There are " + jobSearch.length + " Jobs ready to be processed.");
			
			for (var i = 0; i < jobSearch.length; i++) {
				var JOB = record.load({type: jobSearch[i].recordType, id: jobSearch[i].id});
				
				var exportSearch = search.load({id: jobSearch[i].getValue({name: "custrecord_pri_riem_jobt_exp_ss", join: "custrecord_pri_riem_job_type"})});
				var pluginName = jobSearch[i].getValue({name: "custrecord_pri_riem_jobt_plugin_name", join: "custrecord_pri_riem_job_type"});
				var refFieldName = jobSearch[i].getValue({name: "custrecord_pri_riem_jobt_ref_field_name", join: "custrecord_pri_riem_job_type"});
				var maxRecs = jobSearch[i].getValue({name: "custrecord_pri_riem_jobt_exp_max_recs", join: "custrecord_pri_riem_job_type"});
				var autoPopulateExportField = jobSearch[i].getValue({name: "custrecord_pri_riem_jobt_ap_reffieldname", join: "custrecord_pri_riem_job_type"}); 
				var columns = [];
	        	var pluginImplementation; 
				
	        	for (var c in exportSearch.columns) {
	        		// log.debug(funcName, "column " + c + "=" + JSON.stringify(exportSearch.columns[c]));
	        		var column = exportSearch.columns[c];
	        		columns.push(column);
	        	}

	        	var parms = {id: JOB.id, plugInName: pluginName, fieldName: refFieldName, autoPopulate: autoPopulateExportField};
	        	
	        	columns.push(search.createColumn({name: "formulatext_99", formula: "'" + JSON.stringify(parms) + "'"}));	        	

	        	// log.debug(funcName, "COLUMNS=" + JSON.stringify(columns));
	        	
	        	exportSearch.columns = columns;
	        	
	        	if (pluginName != PLUGIN_NOT_APPLICABLE)
	        		pluginImplementation = plugin.loadImplementation({type: riemCommon.PLUGIN_TYPES.EXPORT, implementation: pluginName});
	        	
		        try {
		        	if (pluginImplementation)
		        		pluginImplementation.getInputData(JOB, exportSearch);	        	
		        } catch (e) {
		        	if (e.code != "SSS_METHOD_NOT_IMPLEMENTED")
		        		throw e;
		        }

		        try {
		        	// don't use submitFields here; we want to know if we fail to update, which means that someone else grabbed this record already
		        	JOB.setValue("custrecord_pri_riem_job_status",riemCommon.JOB_STATUS.EXPORT_STARTED_RECORD_SELECTION);
		        	JOB.save();

		        	// save the parameters so that the Summarize stage can read them
		        	priLibrary.writeToScriptDeploymentCache(JSON.stringify(parms)); 
		        	
		        	log.debug(funcName, "checking max records");
		        	
			        if (maxRecs) {
			        	// if we are limited by how many rows to get, then perform the search, build the result, and return it
			        	log.debug(funcName, "Max records specified as " + maxRecs + "; running search");
			        	var ss = exportSearch.run().getRange(0, maxRecs);
			        	log.debug(funcName, "Retrieved " + ss.length + " record(s)");
			        	
			        	if (ss.length == 0) {
			        		// no records found, so put the record back, and get out
			    	        record.submitFields({type: JOB.type, id: JOB.id, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED}});
			    	        return;
			        	}
			        	return ss;
			        } else {
			        	log.debug(funcName, "No Max Records specified; running entire search");

			        	// make sure there are some records to be processed
						var ss = search.load({id: jobSearch[i].getValue({name: "custrecord_pri_riem_jobt_exp_ss", join: "custrecord_pri_riem_job_type"})}).run().getRange(0,1);
			        	if (ss.length == 0) {
			        		// no records found, so put the record back, and get out
			    	        record.submitFields({type: JOB.type, id: JOB.id, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED}});
			    	        return;
			        	}
			        	
			        	
			        	return exportSearch;
			        }

		        } catch (e) {
		        	log.error(funcName, "Unable to process JOB " + jobSearch[i] + ": " + e);
		        }		        
			}
    		
	    }
	
		
    	/* ======================================================================================================================================== */

	    function reduce(context) {
	    	var funcName = scriptName + "reduce" + context.key;

//	    	log.debug(funcName, context);

	    	
	    	var searchResult = JSON.parse(context.values[0]);
	    	
//	    	log.debug(funcName, "SEARCH=" + JSON.stringify(searchResult));
	    	
	    	var ctrlObj = JSON.parse(searchResult.values.formulatext_99);

	    	// log.debug(funcName, "PLUGIN=" + ctrlObj.plugInName);


	    	// should the export field be automatically populated (this is what many of the export plugins do)
	    	if (ctrlObj.autoPopulate && ctrlObj.fieldName) {
	    		var fieldsToUpdate = {};
	    		fieldsToUpdate[ctrlObj.fieldName] = ctrlObj.id; 
	    		record.submitFields({type: searchResult.recordType, id: searchResult.id, values: fieldsToUpdate});
	    		
		    	if (ctrlObj.plugInName == PLUGIN_NOT_APPLICABLE) 
		    		context.write(searchResult.id, ctrlObj);	    		
	    	}
	    	
	    	if (ctrlObj.plugInName != PLUGIN_NOT_APPLICABLE) {
		        var pluginImplementation = plugin.loadImplementation({type: riemCommon.PLUGIN_TYPES.EXPORT, implementation: ctrlObj.plugInName});

		        pluginImplementation.reduce(context, searchResult, ctrlObj);	        		    		
	    	}

	    	
	    }	
		
    	/* ======================================================================================================================================== */

	    function summarize(summary) {
	    	var funcName = scriptName + "summarize ";

	    	/*
	    	log.debug(funcName+"S", JSON.stringify(summary));
	    	log.debug(funcName+"I", JSON.stringify(summary.inputSummary));
	    	log.debug(funcName+"M", JSON.stringify(summary.mapSummary));

	    	summary.mapSummary.keys.iterator().each(function (key, value) {
	    		log.debug(funcName, "Mapped " + key + " | " + JSON.stringify(value)); 
	    		return true;
   			});
	    	
	    	
	    	log.debug(funcName+"R", JSON.stringify(summary.reduceSummary));
	    	
	    	summary.reduceSummary.keys.iterator().each(function (key, value) {
	    		log.debug(funcName, "Reduced " + key + " | " + JSON.stringify(value)); 
	    		return true;
   			});
	    	*/
	    	

    		var errorMsgs = riemCommon.extractMapReduceErrorMessages(summary);
		    		
	    	var obj; 
	    	var recordCount = 0;
	    	
	    	summary.output.iterator().each(function(key, value) {
	    		
	    		log.debug(funcName, "Retrieved KEY=" + key + " VALUE=" + JSON.stringify(value));
	    	
	    		if (recordCount == 0)
	    			obj = JSON.parse(value);
	    		
	    		recordCount++
	    		return true;	    		
	    	});
	    	
	    	if (obj)
	    		log.debug(funcName, "OBJ=" + JSON.stringify(obj));
	    	
	    	
	    	var jobParms = JSON.parse(priLibrary.readFromScriptDeploymentCache());
			var jobId = jobParms.id; 
	    		    	
	    	// if there were no records, and there were no errors, then just update this as completed and set the message
	    	if (!obj) {	    		
	    		if (errorMsgs.length > 0) {
	    			// the only error was telling us that there were no record; same as no error
	    			if (errorMsgs[0].indexOf("STAGE=input") >= 0 && errorMsgs[0].indexOf("The return type from getInputData must be an Array") >= 0 ) {
	    				// since we found no records, we don't KNOW which Job got us to this point, so find the job which MOST RECENTLY got moved to this status, and mark it as complete
	    				if (jobId)
	    					record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED, custrecord_pri_riem_job_rec_count: 0}});
	    				log.debug(funcName, "No input data found.  Exiting");
	    				return;
	    			}

	    			log.error(funcName, JSON.stringify(errorMsgs));

	    			// we had no records, 	and we had errors; mark it as "completed with errors" and get out
					var JOB = record.load({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId});
					JOB.setValue("custrecord_pri_riem_job_message",JSON.stringify(errorMsgs));			
					JOB.setValue("custrecord_pri_riem_job_rec_count",0);			
					JOB.setValue("custrecord_pri_riem_job_status",riemCommon.JOB_STATUS.COMPLETED_WITH_ERRORS);			
					JOB.save();

	    		} else {
    				if (jobId)
    					record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED, custrecord_pri_riem_job_rec_count: 0}});
	    			log.audit(funcName, "No records and no errors; exiting");
	    		}
    	    	return;	    			
	    	}

	    	    		    	
	    	log.debug(funcName, "JOB=" + obj.id);
	    	
	    	funcName += obj.id;
	    	
	    	
	        record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: obj.id, values: {custrecord_pri_riem_job_rec_count: recordCount, custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.EXPORT_READY_TO_CREATE_OUTPUT_FILE}});
			
			if (errorMsgs.length > 0) {
				var JOB = record.load({type: riemCommon.CUSTOM_RECORD.JOB, id: obj.id});
				JOB.setValue("custrecord_pri_riem_job_message",JSON.stringify(errorMsgs));			
				JOB.save();
			} 

			if (recordCount == 0) {
				log.debug(funcName, "Exiting for JOB " + obj.id);
				return;
			}

			riemCommon.scheduleExportCREScript();

			// now try to reschedule this script
			riemCommon.rescheduleExportMapReduceScript();
			
	    }

		
    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */

	    function findMostRecentJob() {
	    	// finds the job which most recently moved to status "STARTED RECORD SELECTION"
	    	
			var jobSearch = search.create({
				type:		riemCommon.CUSTOM_RECORD.JOB,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_process_type",search.Operator.ANYOF,[riemCommon.PROCESS_TYPE.EXPORT]]
				        	 	,"AND",["custrecord_pri_riem_job_status",search.Operator.ANYOF,[riemCommon.JOB_STATUS.EXPORT_STARTED_RECORD_SELECTION]]
				        	 ],
				columns:	[search.createColumn({name: "custrecord_pri_riem_job_status_last_chgd", sort: search.Sort.DESC})]
			}).run().getRange(0,1);
			
			if (jobSearch.length > 0)
				return jobSearch[0].id;
	    	
	    }
	    
    	/* ======================================================================================================================================== */

	    return {
	        getInputData: getInputData,
	        reduce: reduce,
	        summarize: summarize
	    };
    
	}
);
