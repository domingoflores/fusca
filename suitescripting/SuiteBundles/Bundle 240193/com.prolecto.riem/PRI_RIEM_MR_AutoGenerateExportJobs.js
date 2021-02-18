//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		Finds Export Job Types which have the "Auto Generate" flag turned on; for each one, it checks whether it is time (based on frequency) to create another job for it, 
 * 			and if so, runs the saved search to determine whether there are any candidate records; if there are, create a job
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/format','N/task','./PRI_RIEM_Common'],
		
	function(runtime,record,error,search,format,task,riemCommon) {
   
		var scriptName = "PRI_RIEM_MR_AutoGenerateExportJobs."
	   
	    function getInputData() {
	
			var funcName = scriptName + "getInputData";
			
			log.debug(funcName, "Starting"); 
			
			return search.create({
				type:		riemCommon.CUSTOM_RECORD.JOB_TYPE,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_pri_riem_jobt_process_type",search.Operator.ANYOF,[riemCommon.PROCESS_TYPE.EXPORT]]
				        	 	,"AND",["custrecord_pri_riem_jobt_exp_autogen_job",search.Operator.IS,true]
				        	 	,"AND",["custrecord_pri_riem_jobt_autogen_freq",search.Operator.GREATERTHAN,0]
				        	 ],
				columns:	["name", "custrecord_pri_riem_jobt_exp_ss","custrecord_pri_riem_jobt_autogen_freq", "custrecord_pri_riem_jobt_exp_autogen_dt"]
			}); 
			
	    }
	
    	/* ======================================================================================================================================== */
		
	    function map(context) {
	
	    	var funcName = scriptName + "map";
	    	
	    	try {
	    		
		    	var obj = JSON.parse(context.value);
		    	
		    	log.debug(funcName, obj);
		    	
		    	// check whether enough time has passed
		    	var okToRun = false;
		    	
		    	if (!obj.values.custrecord_pri_riem_jobt_exp_autogen_dt)
		    		okToRun = true; 
		    	
		    	if (!okToRun) {
		    		var msDiff = Math.abs(new Date() - new Date(obj.values.custrecord_pri_riem_jobt_exp_autogen_dt)); 
		    		var nbrMinutes = Math.floor((msDiff/1000)/60);

		    		// log.debug(funcName, "#min=" + nbrMinutes + "   freq=" + obj.values.custrecord_pri_riem_jobt_autogen_freq); 
		    		okToRun = (nbrMinutes >= Number(obj.values.custrecord_pri_riem_jobt_autogen_freq)); 
		    	}

		    	if (!okToRun)
		    		return; 
		    	
		    	
		    	var ss = search.load({id: obj.values.custrecord_pri_riem_jobt_exp_ss.value}); 
		    	
		    	var x = ss.run().getRange(0,1); 
		    	
		    	if (x.length > 0) {
		    		var JOB = record.create({type: riemCommon.CUSTOM_RECORD.JOB}); 
		    		
		    		JOB.setValue("custrecord_pri_riem_job_type",obj.id); 
		    		var jobId = JOB.save();		    		
		    		
		    		record.submitFields({type: riemCommon.CUSTOM_RECORD.JOB_TYPE, id: obj.id, values: {custrecord_pri_riem_jobt_exp_autogen_dt: format.format({value: new Date(), type: format.Type.DATETIME}) }}); 
		    		
		    		log.audit(funcName, "Job " + jobId + " created for Job Type " + obj.values.name + " (" + obj.id + ")" ); 		    		
		    	}
		    			    	
		    			    		
	    	} catch (e) {
	    		log.error(funcName, e);
	    	}
	    	
	    }


    	/* ======================================================================================================================================== */
	
	    function summarize(summary) {
	    	var funcName = scriptName + "summarize";
	    	
	    	var errorMsgs = riemCommon.extractMapReduceErrorMessages(summary);
	    	
    		if (errorMsgs.length > 0) 
    			log.error(funcName, JSON.stringify(errorMsgs));
    		
			log.debug(funcName, "Exiting"); 

	    }
	
    	/* ======================================================================================================================================== */
	    
	    return {
	        getInputData: getInputData,
	        map: map,
	        summarize: summarize
	    };
    
	}
);
