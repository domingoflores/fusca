//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Finds Duplicate Document (Custom) records based on Agreement ID, and deletes all but the "most recently changed" one
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/task','/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,file,task,priLibrary) {

	var scriptName = "SRS_MR_CleanupDuplicateAgreements.";


    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Process is starting");

		
		var ss = search.create({
			type: "customrecord_document_management",
			filters: [
			          ["isinactive",search.Operator.IS,false]
			          ,"AND",["custrecord_doc_agreement_id","isnotempty",""] 
			          ,"AND",["count(internalid)","greaterthan","1"]
			          ],
			 columns:
				   	[
				   	 search.createColumn({name: "custrecord_doc_agreement_id",summary: "GROUP",}),
				   	 search.createColumn({name: "internalid",summary: "COUNT",})
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
    		
    		log.debug(funcName, context); 

    		var obj = JSON.parse(context.value);
    		
    		/*
    		 * OBJ: 
				{
					"recordType":null,
					"id":"2",
					"values":{
						"GROUP(custrecord_doc_agreement_id)":"3AAABLblqZhDAg4DW2VcUR11a-RpiUAfd374_H4EmkTALUwyj4sZhI91kL0ZygGTuVjG4kchyco0m9-tPZ8TQgcRE2phu4Fjf",
						"COUNT(internalid)":"2"}}"
					}
    		 */
    		
    		var agreementId = obj.values["GROUP(custrecord_doc_agreement_id)"];
    		
    		var ss = search.create({
    			type:		"customrecord_document_management",
    			filters:	[
    				          ["isinactive",search.Operator.IS,false]
    				          ,"AND",["custrecord_doc_agreement_id",search.Operator.IS,agreementId] 
    			        	 ],
    			columns:	[search.createColumn({name: "internalid", sort: search.Sort.ASC})]
    		}).run().getRange(0,1000); 
    		
    		log.debug(funcName, "Agreement " + agreementId + " has " + ss.length + " rows.");
    		
    		for (var i = 0; i < ss.length; i++) {
    			if (i == (ss.length - 1)) {
    				record.submitFields({type: "customrecord_document_management", id: ss[i].id, values: {"externalid": agreementId}});
    				log.debug(funcName, "Record " + ss[i].id + " for Agreement " + agreementId + " updated External ID"); 
    			} else {
    				log.debug(funcName, "Inactivating duplicate Agreement Record " + ss[i].id + " for agreement " + agreementId); 
    				record.submitFields({type: "customrecord_document_management", id: ss[i].id, values: {"isinactive": true, "externalid": ""}});
//    				record.delete({type: "customrecord_document_management", id: ss[i].id}); 
    			}
    		}
    		
	    	context.write(agreementId, agreementId); 	    	        	
    		
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

    	log.audit(funcName, exchangeRecordsCleaned + " Document (Custom) Records were de-duped."); 
    		
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
