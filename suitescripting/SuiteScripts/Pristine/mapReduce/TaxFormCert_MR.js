/**
 * Script that supports Tax Form Certificate Updates. 
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
		var scriptName = "TaxFormCert_MR.js-->";
        
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

        	var jsonObject = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_cert_json_object"}));
    	    
        	
            log.audit("START OF RUN", JSON.stringify(jsonObject));
            var objSublistAction = jsonObject.subslistAction;
            
            
            var taxformBatch = jsonObject.taxformbatch;
            
            log.debug("taxformBatch", taxformBatch);
            
			var options = tfLibrary.getTaxFormValues(taxformBatch);
			options.lotCertificatesRequested = true;
	    	var datetime = Date.now();
	    	var newSavedSearchID = "customsearch_" + datetime;
	    	options.newSavedSearchID = newSavedSearchID;
	    	options.excludeSummary = true; 
	    	if (objSublistAction && (!objSublistAction.allDetailRecordsRequested))
			{
	    		//when coming via Revise/Correct, we will have objSublistAction
				//if only SOME detail records have been requested for processing
				//then identify deals / shareholders so that 
				//search can be focused only to selected detail records 
	    		options.deals = objSublistAction.dealArray;
	    		options.shareholders = objSublistAction.shareholderArray;
			}
	    	log.audit("options ", JSON.stringify(options));
	    	
	    	var searchObj = tfLibrary.getTaxFormBatchSearch(options);
			
	    	
	    	
			return searchObj;
        }

        
        function map(context) {

            var result = JSON.parse(context.value);
            var success = true;
            var erid = result.id;
      	  	var currDatetime = new Date();
      	  	var funcName = "map";
      	  	funcName = funcName + " erid:" + erid + " time:" + currDatetime.getTime();
            
            log.debug(funcName, context.value);
            var shareholder = (result.values["custrecord_acq_loth_zzz_zzz_shareholder"] && result.values["custrecord_acq_loth_zzz_zzz_shareholder"]["value"]) ||"";
            if (!shareholder)
        	{
        		throw "Shareholder not found";
        	}
            var deal = (result.values["custrecord_acq_loth_zzz_zzz_deal"] && result.values["custrecord_acq_loth_zzz_zzz_deal"]["value"]) ||"";
            if (!deal)
        	{
        		throw "Deal not found";
        	}
            var certid = (result.values["internalid.CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT"] && result.values["internalid.CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT"]["value"]) ||"";
            if (!certid)
        	{
        		throw "Cert ID not found";
        	}
            var jsonObject         = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_cert_json_object"}));
    	    log.debug("MAP: ", JSON.stringify(jsonObject));
            var taxformBatch = jsonObject.taxformbatch;
            var tbREC = tfLibrary.getTaxFormValues(taxformBatch);
            log.debug("tbREC ", JSON.stringify(tbREC));
            log.debug("shareholder ", shareholder);
            log.debug("certid ", certid);
            var SearchObj = search.create({
            	   type: "customrecord_tax_form_batch_detail",
            	   filters:
            	   [
            	      ["custrecord_txfm_detail_shareholder","anyof",shareholder], 
            	      "AND", 
            	      ["custrecord_txfm_detail_batch_id","anyof",taxformBatch],
            	      "AND", 
            	      ["custrecord_txfm_detail_deal","anyof",deal], 
            	      "AND", 
            	      ["isinactive","is","F"]
            	   ],
            	   columns:
            	   []
            	});
            var searchResults  = SearchObj.run().getRange(0,1); 
            log.debug("searchResults  ", searchResults.length);
            
            if (searchResults.length === 0
            	|| searchResults.length > 1
            ) { 
            	throw "Expected to find 1 Tax Form Detail Record, but found " +searchResults.length;
            }
            log.debug("searchResults ", JSON.stringify(searchResults));
            try {
            	log.debug("Tax Form Batch Detail: " + searchResults[0].id);
            	var certREC = record.load({type: "customrecord_acq_lot_cert_entry", id:certid, isDynamic: true});
            	certREC.setValue("custrecord_cert_tax_form_detail_record", searchResults[0].id);
            	certid = certREC.save();
			    
			    log.debug("Certificate " + certid + " has been updated with " + searchResults[0].id);
            }
            catch(e) 
	  		{
            	log.error(funcName, "exception: " + e.toString() );
	  			success = false; 
	  		}
            context.write(erid, success);        
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
  		  	var taxformStatus = "";
  		  	var taxformNotes = "";
  		  	try 
	  		{
	  		  	var jsonObject         = JSON.parse(runtime.getCurrentScript().getParameter({ name:"custscript_mr_taxform_cert_json_object"}));
	            log.debug("SUMMARY", JSON.stringify(jsonObject));
	            var objSublistAction = jsonObject.sublistAction;
	            taxformBatch = jsonObject.taxformbatch; 
	            if (objSublistAction)
	            {
	            	taxformBatch = objSublistAction.taxFormBatchId;
	            	taxformStatus = objSublistAction.taxFormBatchStatus;
	            }
	            taxformNotes = jsonObject.processingNotes;
	            
	            var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);
	  			  
	  	    	if (errorMsgs.length > 0) 
	  	    	{
	  	    		log.error(funcName ," Summary Errors detected." + JSON.stringify(errorMsgs));
	  	    		tfREC = record.load({type: "customrecord_tax_form_batch", id:taxformBatch, isDynamic: true});
	  	    		tfREC.setValue("custrecord_txfm_batch_status", srsConstants["Tax Form Batch Status"]["Submit Failed"]);
	  	    		tfREC.setValue("custrecord_txfm_batch_processingmetadata", "");
	  	    		tfREC.setValue("custrecord_txfm_batch_processing_notes", JSON.stringify(errorMsgs));
				    tfREC.save();
				    return;
	  	    	}
	  	    	if (!taxformStatus)
	  	    	{
	  	    		taxformStatus = srsConstants["Tax Form Batch Status"]["Submitted"];
	  	    	}
	  	    	if (!taxformNotes)
	  	    	{
	  	    		taxformNotes = "All Processed.";
	  	    	}
	  	    	var successCount = 0;
	  	    	var processedCount = 0;
	  	    	summary.output.iterator().each(function(key, value) 
	  	    	{ 
	  	    		processedCount = processedCount + 1;  
	  	    		return true;
	  	    	});
	  	    	taxformNotes = taxformNotes + " Processed "+ processedCount + " Lot Certificates.";
	  	    	
	  	    	tfLibrary.taxFormBatchUpdateStatistics(taxformBatch,taxformStatus, taxformNotes);
	  	    	
	  	    	var objValues = {};
  	    	    objValues["custrecord_txfm_batch_processingmetadata"] = "";
  	    	    record.submitFields({ type:"customrecord_tax_form_batch" ,id:taxformBatch ,values:objValues });
	  		}
	  		catch(e)
	  		{
	  			log.error("Error Occurred ", e.toString());
	  			
	  			tfREC = record.load({type: "customrecord_tax_form_batch", id:taxformBatch, isDynamic: true});
	  			processingNotes = e.message;
	  			tfREC.setValue("custrecord_txfm_batch_status", srsConstants["Tax Form Batch Status"]["Submit Failed"]);
	  			tfREC.setValue("custrecord_txfm_batch_processingmetadata", "");
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
