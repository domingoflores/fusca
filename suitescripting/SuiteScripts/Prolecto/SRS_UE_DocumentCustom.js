//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the DOCUMENT (CUSTOM) record
 * 
 * 	if there is an Agreement ID, sets the External ID to that value -- this will prevent duplicates of the Agreement ID
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget'
	 ,'./Shared/SRS_Functions'
	 ,'./Shared/SRS_Constants'
	   , '/.bundle/132118/PRI_ShowMessageInUI'
	   ,'/.bundle/132118/PRI_ServerLibrary'
	   ],
				
		function(record, search, runtime, error, format, url, serverWidget
		,srsFunctions, srsConstants, priMessage, priLibrary
		) {
	
			var scriptName = "SRS_UE_DocumentCustom.";
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeSubmit(context) {

		    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
				var REC = context.newRecord;
				
				
    			if (context.type == context.UserEventType.CREATE && !REC.getValue("isinactive")) {
    				if (REC.getValue("custrecord_doc_agreement_id")) {
        				var ss = search.create({
        					type:		REC.type,
        					filters:	[
     					        	 		["isinactive",search.Operator.IS,false]
     					        	 		,"AND",
     					        	 		[
     					        	 		 	["externalid",search.Operator.ANYOF,[REC.getValue("custrecord_doc_agreement_id")]]
     					        	 		 	,"OR",["custrecord_doc_agreement_id",search.Operator.IS,REC.getValue("custrecord_doc_agreement_id")]
     					        	 		 ]
        					        	 ],        					
        				}).run().getRange(0,1); 
        				if (ss.length > 0)
        					throw "Duplicate DOCUMENT AGREEMENT ID specified.  Record " + ss[0].id + " is already using this DOCUMENT AGREEMENT ID";
    				}
    			} 

    			if (context.type == context.UserEventType.EDIT && !REC.getValue("isinactive")) {
    				if (REC.getValue("custrecord_doc_agreement_id")) {
        				var ss = search.create({
        					type:		REC.type,
        					filters:	[
        					        	 	["internalid",search.Operator.NONEOF,[REC.id]]
        					        	 	,"AND",["isinactive",search.Operator.IS,false]
        					        	 	,"AND",
        					        	 	[
        					        	 	 	["externalid",search.Operator.ANYOF,[REC.getValue("custrecord_doc_agreement_id")]]
        					        	 	 	,"OR",["custrecord_doc_agreement_id",search.Operator.IS,REC.getValue("custrecord_doc_agreement_id")]
        					        	 	]
        					        	 ],        					
        				}).run().getRange(0,1); 
        				if (ss.length > 0)
        					throw "This is a Duplicate DOCUMENT AGREEMENT ID.  Record " + ss[0].id + " is already using this DOCUMENT AGREEMENT ID.";
    				}
    			} 
    			
    			// ATP-1155 
    			if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT ) {
    				var docRecievedMethod_Offline = 2; // same value in PROD confirmed
					if (REC.getValue("custrecord_doc_document_recvd_method") == docRecievedMethod_Offline) {
						REC.setValue("custrecord_doc_backup_link" ,null);
					}
    			}
    			// end ATP-1155
			}
			
			function beforeLoad(context){
				log.debug("runtime.executionContext", runtime.executionContext);
				log.debug("context.type", context.type);
				if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
	                if (context.type == context.UserEventType.VIEW) 
	                {
                		if (
                			context.newRecord.getValue("custrecord_doc_rsm_run_status")==="T"
                			||
                			context.newRecord.getValue("custrecord_doc_rsm_run_status")===true
                		)
                		{	
                			renderDocumentCustomRSMStatus(context);
						}
	                }
	            }
				
			}
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function afterSubmit(context) {

		    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
				var REC = context.newRecord;
				var oldREC = context.oldRecord;
				
				log.audit("aftersubmit ", funcName);
				
				
    			if ((context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) 
    					&& REC.getValue("custrecord_doc_agreement_id")) {
    				// if we have duplicate agreements, then inactivate all but the latest one and clear their externalid field
    	    		var ss = search.create({
    	    			type:		"customrecord_document_management",
    	    			filters:	[
    	    				          ["isinactive",search.Operator.IS,false]
    	    				          ,"AND",["custrecord_doc_agreement_id",search.Operator.IS,REC.getValue("custrecord_doc_agreement_id")] 
    	    			        	 ],
    	    			columns:	[search.createColumn({name: "internalid", sort: search.Sort.ASC})]
    	    		}).run().getRange(0,1000); 

    	    		log.debug(funcName, "Found " + ss.length + " agreements wit the same Agreement ID"); 
    	    		
    	    		for (var i = 0; i < (ss.length-1); i++) {
    	    			log.debug(funcName, "Inactivating ID " + ss[i].id); 
   	    				record.submitFields({type: "customrecord_document_management", id: ss[i].id, values: {"isinactive": true, "externalid": ""}});
   	    				// if we just modified the "current" record, then reload it
   	    				if (ss[i].id == REC.id)
   	    					REC = record.load({type: REC.type, id: REC.id}); 
    	    		}
    	    		
    	    		
    			}
				
    			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT)
    			{
    				
    				if (REC.getValue("isinactive")) 
    				{
    					if (REC.getValue("externalid"))
    					{
    	    				record.submitFields({type: REC.type, id: REC.id, values: {"externalid": ""}});
    					}
    				} 
    				else
    				{
	    				if (REC.getValue("custrecord_doc_agreement_id") != REC.getValue("externalid")) 
	    				{
	    					log.debug(funcName, "Setting EXTERNAL ID to " + REC.getValue("custrecord_doc_agreement_id")); 
	    					record.submitFields({type: REC.type, id: REC.id, values: {"externalid": REC.getValue("custrecord_doc_agreement_id")}});     					
	    				}
    				}
    			}
    			
    			if (context.type === context.UserEventType.EDIT
            			|| context.type === context.UserEventType.XEDIT		
            	)
            	{
    				log.debug("custrecord_acq_lot_exrec ", oldREC.getValue("custrecord_acq_lot_exrec"));
    				log.debug("custrecord_acq_lot_exrec ", REC.getValue("custrecord_acq_lot_exrec"));
    				log.debug("changed ", priLibrary.fieldChanged(context, "custrecord_acq_lot_exrec"));
            		if (priLibrary.fieldChanged(context, "custrecord_acq_lot_exrec"))
                	{
            			log.audit("adding old exchange record to be re-evaluated", oldREC.getValue("custrecord_acq_lot_exrec"));
                		var records = [];
                		
                		//if we are changing exchange records, then always re-evaluate both new and old
                		//all other fields do not need to be monitored as RSM's Complete/Incomplete function will 
                		//handle their evaluations. 
                		records = srsFunctions.addRecordsToArray(oldREC, REC, "custrecord_acq_lot_exrec", records);

                		//records.push(oldREC.getValue("custrecord_acq_lot_exrec"));
                		
                		
                		srsFunctions.writeExchangeRecordsToRSMQueue(
                				[
                			      ["internalid","anyof",records]
                			   ]
                		
                		); 	
                	}
            	}
    
			}
			function renderDocumentCustomRSMStatus(context) {
		        
				var type = "";
				var title = "";
				var message = "";
				
		        var deficiencies = context.newRecord.getValue("custrecord_doc_deficiencies");
			    log.audit("deficiencies ", deficiencies);
			    
			    var passed = (context.newRecord.getValue("custrecord_doc_rsm_result") == srsConstants["RSM Evaluation Result"]["Passed"]) ? true : false;
			
			   if (deficiencies.length === 0 && passed) 
			   {
				   
				   type = "RSM Status";
				   title = "There are NO deficiencies found on this record.";
				   message = "<h1 style=\"font-size:18px;!important\">RSM PASSED</h1>";
			
		            context.form.addPageInitMessage({
		                type: type,
		                title: title,
		                message: message
		            });
		        }


		    }
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		return {
			beforeLoad: beforeLoad,
			beforeSubmit:	beforeSubmit,
			afterSubmit:	afterSubmit
		}
});

