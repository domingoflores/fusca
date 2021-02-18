//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Takes an Escrow Agent Statement Batch record, and generates all the details for this record
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/url','N/task','./Shared/SRS_Constants','/.bundle/132118/PRI_ServerLibrary', '/.bundle/132118/PRI_AS_Engine'],
		
	function(runtime,record,error,search,file,url,task,srsConstants,priLibrary,appSettings) {

	var scriptName = "SRS_MR_GenerateEscrowAgentStatementDetails.";

	const GL_ACCOUNT_IS_CLOSED = 2;
	const ESCROW_AGENT_STATEMENTS_APP_NAME = "Escrow Agent Statements"; 

    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Process is starting");

		var batchId = runtime.getCurrentScript().getParameter({'name':"custscript_mr_escrow_agent_stmt_batch_1"});
		
		log.debug(funcName, "Processing Batch " + batchId); 

    	var deptId = appSettings.readAppSetting(ESCROW_AGENT_STATEMENTS_APP_NAME, "Dept Id");

		var BATCH = record.load({type: "customrecord_escrow_agent_stmt_batch", id: batchId}); 
		
		var dealList = []; 
		
		if (BATCH.getValue("custrecord_easb_deal")) {
			log.debug(funcName, "Single Deal Selected: " + BATCH.getValue("custrecord_easb_deal")); 
			var dealSearch = priLibrary.searchAllRecords(search.create({
				type:		record.Type.CUSTOMER,
				filters:	[
				        	 	["category","anyof","1"] 
				        	    ,"AND",["internalid",search.Operator.ANYOF,[BATCH.getValue("custrecord_easb_deal")]]
				        	 ]
			})); 
		} else {
			// if RELATIONSHIP MANAGER specified, find only Deals for that person
			if (BATCH.getValue("custrecord_easb_rel_mgr")) {
				log.debug(funcName, "Relationship Manager Selected: " + BATCH.getValue("custrecord_easb_rel_mgr")); 
				var dealSearch = priLibrary.searchAllRecords(search.create({
					type:		record.Type.CUSTOMER,
					filters:	[
					        	 	["category","anyof","1"] 
					        	    ,"AND",["custentitycustentity_acq_deal_relationma",search.Operator.ANYOF,[BATCH.getValue("custrecord_easb_rel_mgr")]]
					        	 ]
				})); 				
			} else {				
				// no DEAL specified; find all of them

				log.debug(funcName, "ALL Deals Selected");  

				var dealSearch = priLibrary.searchAllRecords(search.create({
					type:		record.Type.CUSTOMER,
					filters:	[
					        	 	["category","anyof","1"] 
					        	    ,"AND",["custentity_acq_escrow_agent","is","T"]
					        	 ]
				})); 				
			}			
		}
		for (var i = 0; i < dealSearch.length; i++)
			dealList.push(dealSearch[i].id); 			

		log.debug(funcName, "DEAL LIST: " + JSON.stringify(dealList)); 
		
		var escrowList = BATCH.getValue("custrecord_easb_deal_escrow"); 
		
//		if (BATCH.getValue("custrecord_easb_deal_escrow")) {
		if (escrowList && escrowList.length > 0) {
			// get only the escrows which were specified on the batch
			
			log.debug(funcName, "Specific Escrow(s) Selected: " + JSON.stringify(BATCH.getValue("custrecord_easb_deal_escrow"))); 

			var escrowSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecord_deal_escrow",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false] 
				        	    ,"AND",["internalid",search.Operator.ANYOF,BATCH.getValue("custrecord_easb_deal_escrow")]
				        	 ],
				columns:	["custrecord_de_deal"]
			})); 			
		} else {
			// get all the escrows associated with the selected deal(s)
			log.debug(funcName, "ALL Escrow(s) Selected");  

			var escrowSearch  = priLibrary.searchAllRecords(search.create({
				type:		"customrecord_deal_escrow",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false] 
				        	    ,"AND",["custrecord_de_deal",search.Operator.ANYOF,dealList]
				        	 ],
				columns:	["custrecord_de_deal"]
			})); 						
		}
		
		log.debug(funcName, "ESCROW SEARCH: " + JSON.stringify(escrowSearch));
		
//		for (var i = 0; i < escrowSearch.length; i++)
//			log.debug(funcName, "Escrow " + i + "=" + JSON.stringify(escrowSearch[i])); 
		
		
		// find every Deal Contact for any of these deals, and the Escrow for which they are to get statements
		
		
		if (BATCH.getValue("custrecord_easb_deal_contact")) {
			log.debug(funcName, "Specific Contact Selected: " + BATCH.getValue("custrecord_easb_deal_contact")); 

			var contactSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecord16",		// Deal Contact
				filters:	[
				        	 	["isinactive",search.Operator.IS,false] 
				        	    ,"AND",["custrecord_dc_rcv_aea_stmts",search.Operator.IS,true]
				        	 	,"AND",["internalid",search.Operator.ANYOF,[BATCH.getValue("custrecord_easb_deal_contact")]]
				        	 ],
				columns: 	["name","custrecord_dc_deal_escrow_statements","custrecord60.email","custrecord59"]
			})); 		
		} else {
			log.debug(funcName, "ALL Contacts Selected: " + BATCH.getValue("custrecord_easb_deal_contact")); 
			var contactSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecord16",		// Deal Contact
				filters:	[
				        	 	["isinactive",search.Operator.IS,false] 
				        	    ,"AND",["custrecord_dc_rcv_aea_stmts",search.Operator.IS,true]
				        	 	,"AND",["custrecord59",search.Operator.ANYOF,dealList]
				        	 ],
				columns: 	["name","custrecord_dc_deal_escrow_statements","custrecord60.email","custrecord59"]
			})); 			
		}

		log.debug(funcName, "CONTACT SEARCH: " + JSON.stringify(contactSearch)); 
		
//		for (var i = 0; i < contactSearch.length; i++)
//			log.debug(funcName, "Contact " + i + "=" + JSON.stringify(contactSearch[i])); 

		// loop through all deals
		//  then loop through all escrows
		//	 then loop through all Contacts
		//		if the Contact is marked to receive ALL escrows, or the specified one, then add entry to array
		
        
		var detailList = []; 
		
		for (var dx = 0; dx < dealSearch.length; dx++) {
			
			if (dealSearch[dx].id == 501820)
				log.audit(funcName, "Deal: " + JSON.stringify(dealSearch[dx])); 
			
			for (var ex = 0; ex < escrowSearch.length; ex++) {

//				if (dealSearch[dx].id == 501820)
//					log.audit(funcName, " - escrow " + JSON.stringify(escrowSearch[ex])); 

				// only take this escrow if it is part of the current deal				
				if (escrowSearch[ex].getValue("custrecord_de_deal") == dealSearch[dx].id) {
					
//					if (dealSearch[dx].id == 501820)
//						log.audit(funcName, " -   match");  

					
					for (var cx = 0; cx < contactSearch.length; cx++) {
						
//						if (dealSearch[dx].id == 501820)
//							log.audit(funcName, " -    contact " + JSON.stringify(contactSearch[cx])); 

						var contactSelected = (dealSearch[dx].id == contactSearch[cx].getValue("custrecord59"));		//does the DEAL match the DEAL on the CONTACT   
						
						if (contactSelected) {
							// if the contact deal matches the deal, then check whether this deal contact wants only a subset of escrows
							if (contactSearch[cx].getValue("custrecord_dc_deal_escrow_statements")) {
								var escrowList = contactSearch[cx].getValue("custrecord_dc_deal_escrow_statements").split();
								// this call puts all the entries into a single array element:  eg ["32,175,92435,26"]
								
//								if (dealSearch[dx].id == 501820)
//									log.audit(funcName, " -    escrowList A " + JSON.stringify(escrowList)); 

								escrowList = escrowList[0].split(",");
								
//								if (dealSearch[dx].id == 501820)
//									log.audit(funcName, " -    escrowList B " + JSON.stringify(escrowList)); 
								
								
								contactSelected = false; 
								for (var i = 0; i < escrowList.length; i++) {
//									if (dealSearch[dx].id == 501820)
//										log.audit(funcName, " -    escrowList[" + i + "]=" + JSON.stringify(escrowList[i])); 

									if (escrowList[i] == escrowSearch[ex].id)
										contactSelected = true; 								

								}
							}
						}
						
						
						if (dealSearch[dx].id == 501820)
							log.audit(funcName, " -        selected: " + contactSelected);  
						
						if (contactSelected) {
							// log.debug(funcName, "Deal " + JSON.stringify(dealSearch[dx]) + " Escrow " + JSON.stringify(escrowSearch[ex]) + " Contact " + JSON.stringify(contactSearch[cx]));
							var obj = {
									batchId: batchId,
									dealId: dealSearch[dx].id,
									escrowId: escrowSearch[ex].id,
									deptId: deptId,
									contactId: contactSearch[cx].id,
									fromDate: BATCH.getValue("custrecord_easb_from_date"),
									thruDate: BATCH.getValue("custrecord_easb_thru_date"),
									zeroBalanceOk: BATCH.getValue("custrecord_zero_balance_statements"),
									emailAddress: contactSearch[cx].getValue({name: "email", join: "custrecord60"}) 							
							}
							detailList.push(obj); 
						}
					}					
				}
				
			}
		}

		if (detailList.length == 0) {
    		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.GENERATED}});
    		log.audit(funcName, "No Detail Records to generate.  Marking Batch as GENERATED"); 
		}
		
		return detailList; 
		 		
	}
	
	
	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map ";

    	try {
    		
    		log.debug(funcName, context); 
    		
        	var obj = JSON.parse(context.value);

        	var batchId = obj.batchId; 
        	var escrowId = obj.escrowId; 
        	var createRecord = true;  
        	
        	// are there any NON-closed gl accounts linked to this escrow; if not, then don't create a record
        	var ss = search.create({
        		type:		record.Type.ACCOUNT,
        		filters:	[
        		        	 	["custrecord_deal_escrow",search.Operator.ANYOF,[obj.escrowId]]
        		        	 	,"AND",["custrecord_account_status",search.Operator.NONEOF,[GL_ACCOUNT_IS_CLOSED]]
        		        	 ],
        		columns:	["custrecord_account_status"]
        	}).run().getRange(0,1); 
        	
        	if (ss.length == 0) {
        		createRecord = false;
    			log.debug(funcName, "No record was created for deal " + obj.dealId + " escrow " + obj.escrowId + " because no GL accounts were found which were not closed"); 
        	}

        	
        	if (createRecord) {
        		
        		var glAccountId = ss[0].id; 
        		
        		log.debug(funcName, "Search escrow=" + obj.escrowId + "; account=" + glAccountId); 
        		
            	var ss = priLibrary.searchAllRecords(search.create({
            		type:		search.Type.TRANSACTION,
            		filters:	[
            		        	 	["department",search.Operator.ANYOF,obj.deptId]
            		        	 	,"AND",["custbody_deal_escrow",search.Operator.ANYOF,[obj.escrowId]]
            		        	 	,"AND",["account",search.Operator.ANYOF,[glAccountId]]
            		        	 	,"AND",["mainline",search.Operator.IS,true]
            		        	 	,"AND",["amount",search.Operator.NOTEQUALTO,"0.00"]
            		        	 ],
            		columns:	[search.createColumn({name: "trandate",sort: search.Sort.ASC}),"fxamount"]
            	}));  

            	var openingBalance = 0; 
            	var statementTranCount = 0;
            	
            	var fromDate = new Date(obj.fromDate);
            	var thruDate = new Date(obj.thruDate); 
            	
            	for (var i = 0; i < ss.length; i++) {
            		
            		log.debug(funcName, "Tran Info " + JSON.stringify(ss[i])); 
            		
            		var tranDate = new Date(ss[i].getValue("trandate")); 
            		
            		if (tranDate < fromDate) 
            			openingBalance += Number(ss[i].getValue("fxamount")); 

            		
            		if (tranDate >= fromDate && tranDate <= thruDate) 
            			statementTranCount++; 
            	} 

        		log.debug(funcName, "Deal " + obj.dealId + " escrow " + obj.escrowId + " had " + ss.length + " transactions, opened with " + openingBalance + " and had " + statementTranCount + " transactions in the reported period");

            	if (openingBalance == 0 && statementTranCount == 0)
            		if (!obj.zeroBalanceOk) {
            			createRecord = false;
            			log.debug(funcName, "No record was created for deal " + obj.dealId + " escrow " + obj.escrowId + " because it had a $0 opening balance and no activity"); 
            		}
            		
        	}
        	
        	
        	if (createRecord) {
            	var DTL = record.create({type: "customrecord_escrow_agent_stmt_detail"});
            	
            	DTL.setValue("custrecord_easd_batch_id", obj.batchId); 
            	DTL.setValue("custrecord_easd_deal", obj.dealId); 
            	DTL.setValue("custrecord_easd_deal_escrow", obj.escrowId); 
            	DTL.setValue("custrecord_easd_deal_contact", obj.contactId); 
            	DTL.setValue("custrecord_easd_recipient", obj.emailAddress); 
            	        	
            	var id = DTL.save(); 

    			var linkURL = url.resolveScript({
    				scriptId:			"customscript_pri_cre_profile_test",
    				deploymentId:		"customdeploy_pri_comm_profile_suitelet",
    				returnExternalUrl: 	false,
    				params:{
    						"custpage_profile": srsConstants.AEA_CRE_PROFILE, 
    						"custpage_recid": id,
    						"selectedtab": "custpage_filepreviewtab"
    						}
    			});
    			record.submitFields({type: "customrecord_escrow_agent_stmt_detail", id: id, values: {custrecord_easd_preview_link: linkURL}}); 

    			
            	log.audit(funcName, "Detail Record " + id + " created: " + JSON.stringify(obj));  
        	}
        	
	    	context.write(obj.batchId, id);  	    	        	
    		
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
    	else {
    		var batchId;
    		var recCount = 0;
        	summary.output.iterator().each(function(key, value) {
        		batchId = key;
        		recCount++; 
        		return true;	    		
        	});
        	
        	if (batchId) {
        		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.GENERATED}}); 
        		
            	log.audit(funcName, "Created " + recCount + " detail records for batch " + batchId);
            	
            	var rootFolderId = appSettings.readAppSetting(ESCROW_AGENT_STATEMENTS_APP_NAME, "Statement Root Folder"); 
            	
            	var FOLDER = record.create({type: "folder"}); 
            	FOLDER.setValue("name", "Batch " + batchId); 
            	FOLDER.setValue("parent", rootFolderId); 
            	var folderId = FOLDER.save(); 

        		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_folder_id": folderId}}); 

            	log.audit(funcName, "Created folder # " + folderId + " for the PDFs of batch " + batchId);
        	}    		
    	}
    	
    		
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
