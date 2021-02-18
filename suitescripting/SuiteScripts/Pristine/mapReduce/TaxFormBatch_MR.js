/**
 * Script that supports Tax Form Batch Detail Creation. 
 * 
 * @author Marko Obradovic
 *
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope public
 */
define(["N/record", "N/search", "N/runtime", "N/task","N/url",
        "/.bundle/132118/PRI_ServerLibrary",
        "/SuiteScripts/Prolecto/Shared/SRS_Constants",
        "/SuiteScripts/Pristine/libraries/TaxForm_Library.js"
        ],

    function(record, search, runtime, task, url,
    		priLibrary,
    		srsConstants,
    		tfLibrary
    ) 
    {
		var scriptName = "TaxFormBatch_MR.js-->";
        
        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() 
        {

        	var jsonObject = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_batch_json_object"}));
    	    
            log.audit("START OF RUN", JSON.stringify(jsonObject));

            var taxformBatch = jsonObject.taxformbatch;
            log.audit("taxformBatch");
            
//			var datetime = Date.now();
//	    	var newSavedSearchID = "customsearch_" + datetime;
	    	
			var options = tfLibrary.getTaxFormValues(taxformBatch);
			if (parseInt(options.status,10) !== parseInt(srsConstants["Tax Form Batch Status"]["Processing Submit"],10))
            {
            	log.error("cannot process this batch because it is not in Draft status");
            	throw "Duplicate Batch Processing Request detected.";
            }
//			options.downloadRequested = true;
//			options.newSavedSearchID = newSavedSearchID;
	    	
			var searchObj = tfLibrary.getTaxFormBatchSearch(options);
			var expectedNumberOfForms = options.numberOfForms;
			
			var numberOfFormsToCreate = searchObj.runPaged().count;
			if (numberOfFormsToCreate === 0)
			{
				//if we find no results, there is nothing to do, and so throw an error
				throw "No Detailed records were submitted for processing";
			}
			
			
			if (parseInt(numberOfFormsToCreate,10) !== parseInt(expectedNumberOfForms,10))
			{
				//before we start processing, Tax form batch NUMBER OF FORMS is holding 
				//expected number of forms to be created. This number must match
				//the search count 
				
				var msgtitle ="Unexpected NUMBER OF FORMS found " + expectedNumberOfForms; 
				var msg = "Expected \"Number Of Forms \" (custrecord_txfm_batch_numberofforms) =  " + expectedNumberOfForms + " must match number of forms to be created " + numberOfFormsToCreate;
				log.error(msgtitle, msg);
				throw msg;
			}
			
			return searchObj;
        }

         /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        
        function map(context) {

            var result = JSON.parse(context.value);
            var success = true;
            var recordId = result.id;
      	  	var currDatetime = new Date();
      	  	var funcName = funcName + "id:" + recordId + " time:" + currDatetime.getTime();
            
            log.audit(funcName, context.value);
            
            var jsonObject         = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_batch_json_object"}));
    	    log.audit("MAP: ", JSON.stringify(jsonObject));
            var taxformBatch = jsonObject.taxformbatch;
            var deal = "";
            var tfDetail = null;
            try {

            	deal = (result.values["GROUP(custrecord_acq_loth_zzz_zzz_deal)"] && result.values["GROUP(custrecord_acq_loth_zzz_zzz_deal)"]["value"]) ||"";
            	
            	var tfDetailId = tfLibrary.createTaxFormBatchDetailRecord(result ,taxformBatch  );	

 				
            }
            catch(e) 
	  		{
            	log.error(funcName, "exception: " + e.toString() );
	  			var err_msg_formatted = JSON.stringify(e, null, "\t");
	  			var input_formatted = JSON.stringify(JSON.parse(context.value), null, "\t");
            	tfDetail = record.create({type: "customrecord_tax_form_batch_detail", isDynamic: true});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_batch_id",value:taxformBatch});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_deal",value:deal});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_processing_notes",value:e.message + "\n\nERROR MESSAGE JSON\n\n" + err_msg_formatted + "\n\nINPUT DETAIL JSON\n\n" + input_formatted});
            	tfDetail.setValue({fieldId:"custrecord_txfm_detail_status",value:srsConstants["Tax Form Status"]["Failed"]});
            	tfDetail.save();
            	
            	success = false; 
	  		}
            context.write(recordId, success);        
        }
        
        

        function getSuccessCount(taxFormBatch)
		{
			var detailSearchObj = search.create(
			{
				type: "customrecord_tax_form_batch_detail",
				filters:
 			   [
 			      ["custrecord_txfm_detail_batch_id","anyof",taxFormBatch],
 			     "AND", 
 			     ["custrecord_txfm_detail_status","anyof",srsConstants["Tax Form Status"]["Draft"]],
 			     "AND", 
 			     ["isinactive","is","F"]
 			   ],
 			   columns:
 			   [
 			      search.createColumn({name: "internalid", label: "Internal ID"})
 			   ]
        	});
			var retValue = 0;
			if (detailSearchObj.runPaged().count>0)
			{
		    	//Found entrys with status other than Failed/Completed. Safe to display percentage
		    	retValue = detailSearchObj.runPaged().count;
			}
	        return retValue;
		}
        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) 
        {

        	var funcName = scriptName + "summarize";
  		  	log.debug("funcName", funcName);
  		  	var processingNotes = "";
  		  	var batchStatus = "";
  		  	var tfREC = null;
  		  	var taxformBatch = "";
  		  	try 
	  		{
	  		  	var jsonObject         = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_batch_json_object"}));
	            log.audit("SUMMARY", JSON.stringify(jsonObject));
	            taxformBatch = jsonObject.taxformbatch;
	            tfREC = record.load({type: "customrecord_tax_form_batch", id:taxformBatch, isDynamic: true});
	  			
  		  		var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
	  			  
	  	    	if (errorMsgs.length > 0) 
	  	    	{
	  	    		log.error(funcName ," Summary Errors detected." + JSON.stringify(errorMsgs));
	  	    		
	  	    		tfREC.setValue("custrecord_txfm_batch_status", srsConstants["Tax Form Batch Status"]["Submit Failed"]);
				    tfREC.setValue("custrecord_txfm_batch_processing_notes", JSON.stringify(errorMsgs));
				    tfREC.setValue("custrecord_txfm_batch_processingmetadata", "");
				    tfREC.save();
				    return;
	  	    	}
	  	    	
	  	    		var createdCount = getSuccessCount(taxformBatch);
	  	    		
	  	    		var expectedCount = tfREC.getValue("custrecord_txfm_batch_numberofforms");
	  	    		
  	    		if (parseInt(createdCount,10) !== parseInt(expectedCount,10)) 
		      	  	{ 
		      	  		batchStatus = srsConstants["Tax Form Batch Status"]["Submit Failed"];
		      	  		processingNotes = "Submit Failed. Please review Detail Processing Notes.";
		      	  		log.audit(funcName, processingNotes); 
		      	  	} 
	
	  	    		// ATP-2160 begin +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	  	    		
	  	    		tfLibrary.taxFormBatchUpdateStatistics(taxformBatch ,batchStatus ,processingNotes);
	  	    		
	  	    	    var objValues = {};
	  	    	    objValues["custrecord_txfm_batch_submittedby"]          = runtime.getCurrentUser().id;
	  	    	    objValues["custrecord_txfm_batch_submittedon"]          = new Date();
	  	    	    record.submitFields({ type:"customrecord_tax_form_batch" ,id:taxformBatch ,values:objValues });
//		      	  	log.audit("search results ", JSON.stringify(searchResults));
  	    		// ATP-2160 end +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	            
	            
	            if (parseInt(batchStatus,10) !== parseInt(srsConstants["Tax Form Batch Status"]["Submit Failed"],10))
  	    		{
	            	var request_options = {};
	      	  		request_options.taxformbatch = taxformBatch;
	      	  		request_options.BatchAction = "Submit";
		      	  	var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
	    			mapReduceTask.scriptId     = "customscript_tax_form_cert_mr";
	    			mapReduceTask.params       = {"custscript_mr_taxform_cert_json_object": JSON.stringify(request_options)};
	    			var mapReduceTaskId = mapReduceTask.submit();
	    			
	    			log.debug("Starting MR to update Lot Certificates", mapReduceTaskId);
  	    			
	    			
	    			var status = task.checkStatus({
		    			taskId: mapReduceTaskId
	    	    	});
	    	    	status = JSON.parse(JSON.stringify(status));
	    	    	
	    	    	var strInputSlURL = url.resolveScript({
						scriptId : "customscript_srs_tax_form_batch",
						deploymentId : "customdeploy_srs_tax_form_batch",
						returnExternalUrl: false
					});
	    	    	
	    	    	status.lookupurl = strInputSlURL;
	    	    	
	    	    	//store prepared status with metadata into processing metadata field.
	    	    	var tfbREC = record.load({type: "customrecord_tax_form_batch", id: taxformBatch, isDynamic: true});
	    	    	tfbREC.setValue("custrecord_txfm_batch_processingmetadata", JSON.stringify(status, null, "\t"));
					tfbREC.save();
  	    		}
	  		}
	  		catch(e)
	  		{
	  			log.error("Error Occurred ", e.toString());
	  			
	  			tfREC = record.load({type: "customrecord_tax_form_batch", id:taxformBatch, isDynamic: true});
	  			processingNotes = e.message;
	  			tfREC.setValue("custrecord_txfm_batch_status", srsConstants["Tax Form Batch Status"]["Submit Failed"]);
			    tfREC.setValue("custrecord_txfm_batch_processing_notes", processingNotes);
			    tfREC.setValue("custrecord_txfm_batch_processingmetadata", "");
			    tfREC.save();
	  		}
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
