//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		Find the first Import job which is in status 'Ready to Start' and converts the file into JSON objects which are written to the Staging table
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/task','N/xml','./PRI_RIEM_Common','/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,file,task,nsXML,riemCommon,priLibrary) {
   
		var scriptName = "PRI_RIEM_MR_ImportJobManager."
	   
	    function getInputData() {
	
			var funcName = scriptName + "getInputData";

			priLibrary.writeToScriptDeploymentCache("{}"); 

			try {
				
				var jobSearch = search.create({
					type:		riemCommon.CUSTOM_RECORD.JOB,
					filters:	[
					        	 	["isinactive",search.Operator.IS,false]
					        	 	,"AND",["custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_process_type",search.Operator.ANYOF,[riemCommon.PROCESS_TYPE.IMPORT]]
					        	 	,"AND",["custrecord_pri_riem_job_status",search.Operator.ANYOF,[riemCommon.JOB_STATUS.READY_TO_START]]
					        	 ],
					columns:	["custrecord_pri_riem_job_type","custrecord_pri_riem_job_file", "custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_imp_grp_col",
					        	 "custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_imp_file_type",
					        	 "custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_rec_type","custrecord_pri_riem_job_type.custrecord_pri_riem_jobt_imp_msng_col_pf",
					        	 search.createColumn({name: "lastmodified", sort : search.Sort.ASC})
					        	 ]
				}).run().getRange(0,100);
				
				// instead of just getting one job, get a bunch, in case there are errors with any, we can continue
				
				if (jobSearch.length == 0) {
					log.debug(funcName, "No Pending Import Job found.  Exiting");
	    			priLibrary.writeToScriptDeploymentCache(JSON.stringify({})); 
					return;
				}

				for (jobNdx = 0; jobNdx < jobSearch.length; jobNdx++) {

		    		var F = file.load({id: jobSearch[jobNdx].getValue("custrecord_pri_riem_job_file")});
		    		
		    		log.debug(funcName, "Starting with job " + jobSearch[jobNdx].id + " file " + jobSearch[jobNdx].getText("custrecord_pri_riem_job_file") + " of recordType " + jobSearch[jobNdx].getText("custrecord_pri_riem_job_type"));

	    			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobSearch[jobNdx].id, values: {custrecord_pri_riem_job_message: "Parsing Last Attempted on " + new Date()}});
	    			
		    		// for now we assume that it's a CSV file
		    		
	    			var fileType = jobSearch[jobNdx].getValue({name: "custrecord_pri_riem_jobt_imp_file_type", join: "custrecord_pri_riem_job_type"}); 
	    			
		    		try {
		    			var recordData = riemCommon.parseFile(F.getContents(), jobSearch[jobNdx].getValue({name: "custrecord_pri_riem_jobt_imp_msng_col_pf", join: "custrecord_pri_riem_job_type"}), fileType,jobSearch[jobNdx].getValue({name: "custrecord_pri_riem_jobt_imp_grp_col", join: "custrecord_pri_riem_job_type"}));	    			
		    		} catch (e1) {
		    			log.error(funcName, e1);
		    			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobSearch[jobNdx].id, values: {custrecord_pri_riem_job_message: e1.toString()}});
		    			log.debug(funcName, "Job updated with error message.  Continuing to look for other available jobs.");
		    			continue; 
		    		}
	    			
		    		/*
	    			var rowCount = 0;
	    			
	    			F.lines.iterator().each(function (line) {
	    				rowCount++;
	    				// log.audit(funcName, "Line " + rowCount + " of file was: " + JSON.stringify(line));
	    				return true;
	    			});
	    			*/
		    		
		    		// simply counting lines by CR/LF caused a discrepancy when a CSV cell contained a \n inside it.
		    		//	now we are making the row count be the same as it would be if you viewed the CSV in Excel ... the # of rows in Excel
	    			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobSearch[jobNdx].id, values: {custrecord_pri_riem_job_row_count: recordData.length}});
	    			
	    			log.debug(funcName, "Import file had " + recordData.length + " lines");


	    			// if the import file was effectively empty (only headers), then mark the job as complete and get out; 
	    			
	    			if (recordData.length == 0) {
	        			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobSearch[jobNdx].id, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED}});
	        			continue; 
	    			}

	    			
	    			for (var i = 0; i < recordData.length; i++) {
	    				var obj = recordData[i];
	    				obj.riemJob = jobSearch[jobNdx].id;
	    				obj.riemFileType = fileType; 
	    				obj.riemJobType = jobSearch[jobNdx].getValue("custrecord_pri_riem_job_type");
	    				obj.riemGroupColumn = jobSearch[jobNdx].getValue({name: "custrecord_pri_riem_jobt_imp_grp_col", join: "custrecord_pri_riem_job_type"});
	    				obj.riemRecordType = jobSearch[jobNdx].getValue({name: "custrecord_pri_riem_jobt_rec_type", join: "custrecord_pri_riem_job_type"});
	    				
	    				// no grouping on XML files (the Grouping column contains the xPath which was already used)
	    				//		we don't want the Map/Reduce to group these, as each one is already a "standalone" record
	    				if (fileType == riemCommon.IMPORT_TYPE.XML)
	    					obj.riemGroupColumn = ""; 
	    				else
	    					obj.riemLineNbr = i; 
	    				
	    				recordData[i] = obj;
	    			}
	    				
	    			priLibrary.writeToScriptDeploymentCache(JSON.stringify({jobId: jobSearch[jobNdx].id})); 

	    			return recordData;

				}

				
				
			} catch (e) {
	    		log.error(funcName, e);				
			}
			
    		
	    }
	
    	/* ======================================================================================================================================== */
		
	    function map(context) {
	
	    	var funcName = scriptName + "map";
	    	
	    //	try {
	    		
	    		log.debug(funcName, "OBJ=" + context.value);
	    		
		    	var obj = JSON.parse(context.value);
		    	
		    	var groupColumnName =  obj.riemGroupColumn;
		    	
		    	if (groupColumnName) 
			    	var groupId = obj[groupColumnName];
		    	else
		    		var groupId = generateRandomString(16);		// generates a random 16-character string
		    	
		    	log.debug(funcName, "group col=" + groupColumnName + ";  id=" + groupId);
		    	
		    	context.write(groupId, obj);		    	
		    		
	    //	} catch (e) {
	    //		log.error(funcName, e);
	    //	}
	    	
	    }

    	/* ======================================================================================================================================== */

	    // context.values is an array of STRINGS
	    
	    function reduce(context) {
	    	var funcName = scriptName + "reduce";
	    	
	    	try {
	    			    		
	    		log.debug(funcName, JSON.stringify(context));
	    		
	    		var obj = [];
	    		var riemJob, riemJobType, riemRecordType, riemGroupColumnName;
	    		
	    		for (var i = 0; i < context.values.length; i++) {
	    			var tempObj = JSON.parse(context.values[i]);
	    			
	    			if (!riemJob) {
	    				riemJob = tempObj.riemJob;
	    				riemJobType = tempObj.riemJobType;
	    				riemRecordType = tempObj.riemRecordType;
	    				riemGroupColumn = tempObj.riemGroupColumn;
	    			}

	    			delete tempObj.riemJob;
	    			delete tempObj.riemJobType;
	    			delete tempObj.riemRecordType;
	    			delete tempObj.riemGroupColumn;
	    				    			
	    			if (tempObj.riemFileType == riemCommon.IMPORT_TYPE.XML) {
	    	        	var xmlDoc = nsXML.Parser.fromString({text: tempObj.xml}); 

	    				tempObj = riemCommon.xml2json(xmlDoc);	
	    				
	    				// JSON will have a "high level" property that is the XML ROOT NODE wrapper; so remove it, by extracting that property only
	    				// also, with XML, we will (should) never have multiple records, so we don't want obj to be an array (as it is with other file types).  so we just set obj instead of push to obj
	    				obj = tempObj[riemCommon.XML_ROOT_NODE]; 
	    				
	    			} else {
		    			delete tempObj.riemFileType;
		    			obj.push(tempObj);	    				
	    			}
	    			
	    		}
	    		
	    		obj.sort(function(a, b){
	    			if (a.riemLineNbr < b.riemLineNbr)
	    				return -1;
	    			else 
	    				return 1;
	    		});

	    		var R = record.create({type: riemCommon.CUSTOM_RECORD.IMPORT_STAGING});
		    	
	    		R.setValue("custrecord_pri_riem_impstg_job", riemJob);
	    		R.setValue("custrecord_pri_riem_impstg_jobtype", riemJobType);
		    	R.setValue("custrecord_pri_riem_impstg_rectype", riemRecordType);
	    		
		    	R.setValue("custrecord_pri_riem_impstg_payload", JSON.stringify(obj));
		    	
		    	
		    	if (riemGroupColumn)
			    	R.setValue("custrecord_pri_riem_impstg_key", obj[0][riemGroupColumn]);
		    		
		    	
		    	// R.setValue("custrecord_mcg_ris_record_key", obj[0].importRecordKey);
		    	
		    	var id = R.save();
		    			   
		    	context.write(riemJob, obj[0]);
		    	
		    	
		    	log.debug(funcName, "Record created for job " + riemJob + " with " + context.values.length + " entries.  ID=" + id);
	    		
	    	} catch (e) {
	    		log.error(funcName, e);
	    	}	    	
	    }
	
    	/* ======================================================================================================================================== */
	
	    function summarize(summary) {
	    	var funcName = scriptName + "summarize";
	    	
	    	var errorMsgs = riemCommon.extractMapReduceErrorMessages(summary);
	    	
	    	// log.debug(funcName, "ERRORS=" + JSON.stringify(errorMsgs));
	    	
	    	var jobId; 
	    	var recordCount = 0;
	    	
	    	summary.output.iterator().each(function(key, value) {
	    		
	    		// log.debug(funcName, "Retrieved KEY=" + key + " VALUE=" + JSON.stringify(value));
	    	
	    		if (recordCount == 0)
	    			jobId = key; 
	    		
	    		recordCount++
	    		return true;	    		
	    	});
	    	
	    	// if there were no records, and there were no errors, then just update this as completed and set the message
	    	if (!jobId) {
	    		
	    		var jobData = JSON.parse(priLibrary.readFromScriptDeploymentCache());
	    		jobId = jobData.jobId; 
	    		
	    		if (!jobId)		// then getInputData exited without setting up any data, so there was nothing to process
	    			return;
	    		
	    		if (errorMsgs.length > 0) {
	    			if (errorMsgs[0].indexOf("STAGE=input") >= 0 && errorMsgs[0].indexOf("The return type from getInputData must be an Array") >= 0 ) {
	    				log.debug(funcName, "No input data found.  Exiting");
	    				// mark the job as complete
	        			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED}});	    				
	    				return;
	    			}
	    			log.error(funcName, JSON.stringify(errorMsgs));
	    		}
	    		else {
	    			log.audit(funcName, "No records and no errors; exiting");
	    		}
	    		
    			record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId, values: {custrecord_pri_riem_job_status: riemCommon.JOB_STATUS.COMPLETED_WITH_PARSING_ERRORS}});	    					    			
    	    	return;	    			
	    	}

	    	
			var JOB = record.load({type: riemCommon.CUSTOM_RECORD.JOB, id: jobId});

	    	// at this point we know the jobId; else we would have exited
    		if (errorMsgs.length > 0) {
				// parsing errors need to be handled differently, because if even SOME of the import file could not be parsed correctly, then we don't want to continue, because it might create an import mess 
    			log.error(funcName, JSON.stringify(errorMsgs));
				log.audit(funcName, "Marked job as COMPLETED WITH PARSING ERRORS")
				JOB.setValue("custrecord_pri_riem_job_message",JSON.stringify(errorMsgs));			
				JOB.setValue("custrecord_pri_riem_job_status",riemCommon.JOB_STATUS.COMPLETED_WITH_PARSING_ERRORS);			
    		} else {
    			// no error messages; so if the record count is good, we're golden; otherwise we have a problem
    			JOB.setValue("custrecord_pri_riem_job_rec_count", recordCount); 
				if (JOB.getValue("custrecord_pri_riem_job_exp_rec_count") && JOB.getValue("custrecord_pri_riem_job_exp_rec_count") != recordCount) {
					JOB.setValue("custrecord_pri_riem_job_status",riemCommon.JOB_STATUS.COMPLETED_WITH_PARSING_ERRORS);
					JOB.setValue("custrecord_pri_riem_job_message","Expected " + JOB.getValue("custrecord_pri_riem_job_exp_rec_count") + " records, but parser found " + recordCount);
					log.audit(funcName, "Expected Record Count did not match parsed record count for job " + jobId);
				}
				else
					JOB.setValue("custrecord_pri_riem_job_status",riemCommon.JOB_STATUS.IMPORT_FILE_IMPORTED_INTO_STAGING);
    		}

			JOB.save();

					    	
			// log.debug(funcName, "Exiting for JOB " + jobId);

			if (recordCount > 0) {
				log.debug(funcName, "Records were processed, so scheduling Staging Processor Job");
				riemCommon.scheduleStagingImportScript();	// process records that were just staged
			}

			log.debug(funcName, "Rescheduling self...");
			
			// now try to reschedule this script
			riemCommon.scheduleJobManagerScript();
	    	
	    }
	
    	/* ======================================================================================================================================== */
	    
		// used for generating passwords, etc., as long as they don't have special requirements such as MUST have letter, number, etc.
		function generateRandomString(len) {	
			var CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-=_+,./|?";
			var s = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, function(c)
					{ return CHARSET[parseInt(Math.random() * CHARSET.length)]; });

			return (len > 50) ? s : s.substring(0,len);
		}


	    
    	/* ======================================================================================================================================== */

	    return {
	        getInputData: getInputData,
	        map: map,
	        reduce: reduce,
	        summarize: summarize
	    };
    
	}
);
