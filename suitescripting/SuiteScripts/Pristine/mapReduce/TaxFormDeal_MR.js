/**
 * Script that supports Tax Form Deal Creation. 
 * 
 * @author Marko Obradovic
 *
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope public
 */
define(["N/record", "N/search", "N/runtime", "N/task", "N/url",
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
		var scriptName = "TaxFormDeal_MR.js-->";
        
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

        	var jsonObject = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_deal_json_object"}));
    	    
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
			var expectedNumberOfDeals = options.numberOfDeals;
			log.debug("deals ", JSON.stringify(options.Deals));
			var searchObj = search.create({
			   type: "customer",
			   filters:
			   [
			      ["isinactive","is","F"], 
			      "AND", 
			      ["internalid","anyof",options.deals]
			   ],
			   columns:
			   [
			      search.createColumn({
			         name: "internalid",
			         label: "Internal ID"
			      })
			   ]
			});
			log.debug("search", JSON.stringify(searchObj));
			var numberOfDealsToCreate = searchObj.runPaged().count;
			if (numberOfDealsToCreate === 0)
			{
				//if we find no results, there is nothing to do, and so throw an error
				throw "No Deals records were submitted for processing";
			}
			
			
			if (parseInt(numberOfDealsToCreate,10) !== parseInt(expectedNumberOfDeals,10))
			{
				//before we start processing, Tax form batch NUMBER OF Deals 
				//has expected number of Deals to be created. This number must match
				//the search count 
				
				var msgtitle ="Unexpected NUMBER OF DEALS found " + expectedNumberOfDeals; 
				var msg = "Expected \"Number Of Deals \" (custrecord_txfm_batch_numberofdeals) =  " + expectedNumberOfDeals + " must match number of deals to be created " + numberOfDealsToCreate;
				log.error(msgtitle, msg);
				throw msg;
			}
			
			return searchObj;
        }

        
        function map(context) {

            var result = JSON.parse(context.value);
            var success = true;
            var customerid = result.id;
      	  	var currDatetime = new Date();
      	  	var funcName = funcName + "id:" + customerid + " time:" + currDatetime.getTime();
            
            log.audit(funcName, context.value);
            
            var jsonObject         = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_deal_json_object"}));
    	    log.audit("MAP: ", JSON.stringify(jsonObject));
            var taxformBatch = jsonObject.taxformbatch;
            var tbREC = tfLibrary.getTaxFormValues(taxformBatch);
            log.audit("tbREC ", JSON.stringify(tbREC));
            
            var custREC = search.lookupFields({						
				type: "customer",
				id: customerid,
				columns: 
					[
					 "entityid",
					 "custentityacqdea_relationship_associate",
					 "CUSTENTITYACQDEA_RELATIONSHIP_ASSOCIATE.isinactive"
					 ]
            });
            log.audit("custREC ", JSON.stringify(custREC));
            try {
            	var dealname = custREC.entityid + " " +tbREC.reportmethodText;
            	var associate = (custREC.custentityacqdea_relationship_associate && custREC.custentityacqdea_relationship_associate[0] && custREC.custentityacqdea_relationship_associate[0].value) || "";
   	         
            	var tfDeal = record.create({type: "customrecord_tax_form_deal", isDynamic: true});
            	tfDeal.setValue({fieldId:"name",value:dealname});
            	tfDeal.setValue({fieldId:"custrecord_tfd_batch_id",value:taxformBatch});
            	tfDeal.setValue({fieldId:"custrecord_tfd_deal",value:customerid});
            	if (associate && !custREC["CUSTENTITYACQDEA_RELATIONSHIP_ASSOCIATE.isinactive"])
            	{
            		tfDeal.setValue({fieldId:"custrecord_tfd_relationship_associate",value:associate});
            	}
            	var dealid = tfDeal.save();
 				log.debug("created deal ", dealid);
            }
            catch(e) 
	  		{
            	log.error(funcName, "exception: " + e.toString() );
	  			success = false; 
	  		}
            context.write(customerid, success);        
        }
        
        function getSuccessCount(taxFormBatch)
		{
			var SearchObj = search.create(
			{
				type: "customrecord_tax_form_deal",
				filters:
 			   [
 			      ["custrecord_tfd_batch_id","anyof",taxFormBatch],
 			     "AND", 
 			     ["isinactive","is","F"]
 			   ],
 			   columns:
 			   [
 			      search.createColumn({name: "internalid", label: "Internal ID"})
 			   ]
        	});
			var retValue = 0;
			if (SearchObj.runPaged().count>0)
			{
		    	//Found entrys with status other than Failed/Completed. Safe to display percentage
		    	retValue = SearchObj.runPaged().count;
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
	  		  	var jsonObject         = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_deal_json_object"}));
	            log.audit("SUMMARY", JSON.stringify(jsonObject));
	            taxformBatch = jsonObject.taxformbatch;
	            var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
	  			  
	  	    	if (errorMsgs.length > 0) 
	  	    	{
	  	    		log.error(funcName ," Summary Errors detected." + JSON.stringify(errorMsgs));
	  	    		tfREC = record.load({type: "customrecord_tax_form_batch", id:taxformBatch, isDynamic: true});
	  	    		tfREC.setValue("custrecord_txfm_batch_status", srsConstants["Tax Form Batch Status"]["Submit Failed"]);
				    tfREC.setValue("custrecord_txfm_batch_processing_notes", JSON.stringify(errorMsgs));
				    tfREC.save();
				    return;
	  	    	}
  	    		var createdCount = getSuccessCount(taxformBatch);
  	    		tfREC = record.load({type: "customrecord_tax_form_batch", id:taxformBatch, isDynamic: true});
  	    		var expectedCount = tfREC.getValue("custrecord_txfm_batch_numberofdeals");
  	    		
  	    		if (parseInt(createdCount,10) === parseInt(expectedCount,10)) 
	      	  	{ 
	      	  		processingNotes = "All Tax Form Deals Created Successfully.";
	      	  		log.audit(funcName, processingNotes); 
	      	  	}
	      	  	else                                          
	      	  	{ 
	      	  		batchStatus = srsConstants["Tax Form Batch Status"]["Submit Failed"];
	      	  		processingNotes = "Tax Form Deal Creation Failed. Created " + createdCount + ". Expected: " + expectedCount;
	      	  		log.audit(funcName, processingNotes); 
	      	  	} 

	      	  	tfREC = record.load({type: "customrecord_tax_form_batch", id:taxformBatch, isDynamic: true});
	      	  	if (batchStatus)
	      	  	{
	      	  		//only update with failed status 
	      	  		tfREC.setValue("custrecord_txfm_batch_status", batchStatus);
	      	  	}
	      	  	tfREC.setValue("custrecord_txfm_batch_processing_notes", processingNotes);
	      	  	tfREC.setValue("custrecord_txfm_batch_submittedby", runtime.getCurrentUser().id);
	      	  	tfREC.setValue("custrecord_txfm_batch_submittedon", new Date());
	      	  	tfREC.save();
	      	  	
	      	  	if (!batchStatus)
	      	  	{
	      	  		var request_options = {};
	      	  		request_options.taxformbatch = taxformBatch;
    			
		      	  	var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
	    			mapReduceTask.scriptId     = "customscript_tax_form_batch_mr";
	    			mapReduceTask.params       = {"custscript_mr_taxform_batch_json_object": JSON.stringify(request_options)};
	    			var mapReduceTaskId = mapReduceTask.submit();
	    			
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
			    tfREC.save();
	  		}
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
