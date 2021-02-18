//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Work against exchange records submitted. Only update 5b status to 5.  
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/task','/.bundle/132118/PRI_ServerLibrary',
	'./Shared/SRS_Constants'],
		
	function(runtime,record,error,search,file,task,priLibrary, srsConstants) {

	var scriptName = "SRS_MR_Update_ER.";

	
	 function getInputData() {

         var funcName = scriptName + "getInputData";

         log.debug(funcName, "Process is starting");

         var exchangeRecordList = runtime.getCurrentScript().getParameter({ name:'custscript_exchange_records_to_update'  });
 	     
         log.debug(funcName, "exchangeRecordList: " + exchangeRecordList);
        
         var exchangeRecordArray = JSON.parse(exchangeRecordList);
 	    
 	   var arrColumns              = [];
 		var col_InternalId          = search.createColumn({ "name":"internalid"  });
 		arrColumns.push(col_InternalId);
 		
 		var arrFilters   = [         ['isinactive'    ,'IS'       ,false ]
 		                    ,'AND'  ,['internalid'    ,'ANYOF'    ,exchangeRecordArray ]
 		 					,"AND",["custrecord_acq_loth_zzz_zzz_acqstatus","anyof",srsConstants["Acquiom LOT Status"]["5b. Upon Approval Ready for Payment"]]
 	                       ];
 		var searchMapReduceObj = search.create({'type':'customrecord_acq_lot'
 		                                           ,'filters':arrFilters 
 	                                               ,'columns':arrColumns 	       });
                           
         return searchMapReduceObj;        
   }
	
	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map ";

    	try {
    		
    		log.debug(funcName, context); 

    		var obj = JSON.parse(context.value);
    		
    		log.debug(funcName, JSON.stringify(obj)); 
    		
    		/*
    		 * obj:
    		 * {
//				  "recordType": "customrecord_acq_lot",
//				  "id": "145619",
//				  "values": {
//				    "internalid": {
//				      "value": "145619",
//				      "text": "145619"
//				    }
//				  }
//				}
    		 */
    		
    		var ER = record.load({type: "customrecord_acq_lot", id: obj.id}); 
			log.audit("custrecord_acq_loth_zzz_zzz_acqstatus", ER.getValue("custrecord_acq_loth_zzz_zzz_acqstatus"));
			log.audit("Acquiom LOT Status", srsConstants["Acquiom LOT Status"]["5b. Upon Approval Ready for Payment"]);
			if (parseInt(ER.getValue("custrecord_acq_loth_zzz_zzz_acqstatus"),10) === parseInt(srsConstants["Acquiom LOT Status"]["5b. Upon Approval Ready for Payment"],10))
			{
				log.audit("updating ER " +obj.id + "status to 5. Approved for Payment ", srsConstants["Acquiom LOT Status"]["5. Approved for Payment"]);
				ER.setValue("custrecord_acq_loth_zzz_zzz_acqstatus", srsConstants["Acquiom LOT Status"]["5. Approved for Payment"]);
				ER.setValue("custrecord_acq_loth_zzz_zzz_shrhldstat", srsConstants["Shareholder LOT Status"]["5. Ready for Payment"]);
				
				ER.setValue("custrecord_acq_loth_reviewcomplete",  true);
				ER.setValue("custrecord_acq_loth_0_de1_notes",  "");
				ER.save();
				context.write(obj.id, obj.id); 	    
				
			}        	
			
			
    		
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
    	{
    		log.error(funcName, JSON.stringify(errorMsgs));
    	}

    	var exchangeRecordsProcessed = 0;
    	
    	summary.output.iterator().each(function(key, value) {
    		exchangeRecordsProcessed+=1;     		
    		return true;	    		
    	});

    	log.audit(funcName, exchangeRecordsProcessed + " Exchange Records were processed."); 
    		
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
