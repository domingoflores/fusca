//------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */

/*
 *
 * each row in the queue represents a Release Approval Process record which needs to have Expiration Letter records generated
 * 
 */

define(['N/search', 'N/record', 'N/runtime', 'N/task', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_QM_Engine', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_ServerLibrary'],
    function(search, record, runtime, task, srsConstants, srsFunctions, qmEngine, appSettings, priLibrary) {

		"use strict";

		var scriptName = "SRS_SC_GeneExpirationLetterRecords.";

    	var MIN_USAGE_THRESHOLD = 500;    	

    	const RELEASE_COMMUNICATION_IS_EXPIRATION_LETTER = 2;

		var MAX_CUSTOMERS_TO_SELECT;

		function execute(context) {
        
			var funcName = scriptName + "execute";
			            
        	var allDone = false;
        	
        	log.debug(funcName, "Starting");
        	
    		MAX_CUSTOMERS_TO_SELECT = appSettings.readAppSetting("Expiration Letters", "Max Customers", 500);	// default to 500 if we don't have the setting

    		log.debug(funcName, "Starting with MAX_CUSTOMERS_TO_SELECT = " + MAX_CUSTOMERS_TO_SELECT); 
        	
        	do {
            	var obj = qmEngine.getNextQueueEntry(srsConstants.QUEUE_NAMES.GENERATE_EXPIRATION_LETTER_RECORDS);
            	
				if (obj !== null && typeof obj === 'object') {
					
					try {

						var rapId = Number(obj.parms); 

						var RAP = record.load({type: "customrecord_escrow_payment_approvals", id: rapId}); 
						
						
						var lettersToCreate = determineRequiredLetters(RAP); 

						if (lettersToCreate.length == 0) {
							qmEngine.markQueueEntryComplete(obj.id);
			        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_rap_shr_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.SUBLIST_GENERATED}});
			        		log.debug(funcName, "No more required letters found.  Marking process 'COMPLETE'"); 
							break; 
						}
						
						var existingLetters = findExistingLetters(RAP);
						
						var processCompleted = true; 
						
						for (var i = 0; i < lettersToCreate.length; i++) {
							if (!letterExists(lettersToCreate[i],existingLetters)) {

								if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
			                		processCompleted = false;
			                		break; 
								}
								
//								if (lettersToCreate[i].escrowIds && lettersToCreate[i].escrowIds.length > 0) {
									log.debug(funcName, "Need to create letter for " + JSON.stringify(lettersToCreate[i])); 
									
									var L = record.create({type: "customrecord_srs_shrhldr_letter"}); 
									
									// L.setValue("name", lettersToCreate[i].contactName + " SH Letter - " + i);
									
									L.setValue("custrecord_rel_app_process_rec", rapId); 
									L.setValue("custrecord_contact", lettersToCreate[i].contactId); 
									L.setValue("custrecord_shareholder_shletter",lettersToCreate[i].custId); 
									L.setValue("custrecord_jrnl_entries", RAP.getValue("custrecord_release_journals"));
									
//									L.setValue("custrecord_escrow_transaction", lettersToCreate[i].escrowIds);
									L.setValue("custrecord_sl_dist_status", srsConstants.SHAREHOLDER_LETTER_DISTRIBUTION_STATUS.PENDING);
									L.setValue("custrecord_rc_type", RELEASE_COMMUNICATION_IS_EXPIRATION_LETTER)
									
									var id = "?"; 
									var id = L.save(); 
																		
									log.audit(funcName, "Expiration Letter Created for Release Approval Process " + RAP.id + "/" + RAP.getValue("name") + " : " + id); 								
									
//								} else
//									log.audit(funcName, "Expiration Letter NOT Created for Release Approval Process " + RAP.id + "/" + RAP.getValue("name") + " - No Escrow Transactions Found");  								
								
							}
						}
						
						
						if (processCompleted) {
			        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_exp_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.SUBLIST_GENERATED}}); 
							qmEngine.markQueueEntryComplete(obj.id);	                    	
						}
						else
							qmEngine.markQueueEntryIncomplete(obj.id);			                		
						
						if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
							log.debug(funcName, "Usage consumed.  Rescheduling");
							var scriptTask = task.create({'taskType': task.TaskType.SCHEDULED_SCRIPT});
				            scriptTask.scriptId = srsConstants.SCRIPT_NAMES.GENERATE_EXPIRATION_LETTER_RECORDS; 
				            var scriptTaskId = scriptTask.submit();

							return;
						}
													

					} catch (e) {
						// couldn't complete it, so update the status and let it try again
						log.error(funcName, e);
						qmEngine.abandonQueueEntry(obj.id, null, "ERROR: " + e.message);
					}
										
					
				} else	// we didn't get anything back from the queue
					return;
				            		
	    	} while (true);

            	
        	log.debug(funcName, "*** EXITING ***");
        	
        }
	
		// ================================================================================================================================

		function letterExists(letterRecord, existingLetters) {
			var funcName = scriptName + "letterExists"; 
			
			for (var i = 0; i < existingLetters.length; i++) {
				// log.debug(funcName, "Comparing entry " + i + " " + JSON.stringify(letterRecord) + " to " + JSON.stringify(existingLetters[i])); 
				
				if (existingLetters[i].contactId == letterRecord.contactId) {
					
				
				// if (existingLetters[i].contactId == letterRecord.contactId && existingLetters[i].custId == letterRecord.custId) {
					// log.debug(funcName, "   - match");
					return true;				
				}// else
					// log.debug(funcName, "   - no match");
			}
				
			
			return false;
		}
		
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================

		function determineRequiredLetters(RAP) {
			var funcName = scriptName + "determineRequiredLetters " + RAP.id; 
			
			log.debug(funcName, "Starting");
			
			if (!RAP.getValue("custrecord_rap_gl_accounts") || RAP.getValue("custrecord_rap_gl_accounts").length == 0) {
				log.error(funcName, "Release Approval Process record had no Expiration Letter GL Account Entries.  Nothing to generate.");
				return [];
			}
		
			var requiredLetters = []; 
			var custList = []; 

			// Search the Shareholder Escrow Pro Rata record (customrecordespr)
			//	where the GL Account field (custrecordescrow_account) matches a GL Account on the RAP record 
			//		and the Pro Rate - Rounded Decimal field (custrecordpro_rata_deci) is greater than 0
			//		and then take the associated Shareholder (custrecordshareholder) field
			
			
			var shareholderSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecordespr",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecordescrow_account",search.Operator.ANYOF,RAP.getValue("custrecord_rap_gl_accounts")]
				        	 	,"AND",["custrecordpro_rata_deci",search.Operator.GREATERTHAN,"0.00"]
				        	 ],
				columns:	[
						      search.createColumn({name: "custrecordshareholder",summary: "GROUP"})
						      ,search.createColumn({name: "internalid",summary: "COUNT"})
				        	 ]
			})); 
			
			
			
			for (var i = 0; i < shareholderSearch.length; i++)
				custList.push(shareholderSearch[i].getValue({name: "custrecordshareholder", summary: search.Summary.GROUP})); 
			
			if (custList.length == 0)
				return []; 
			
//				first, find all customers using the Shareholder Data Access record
			loadCustomerShareholderDataAccessRecords(requiredLetters, custList, RAP); 

			
//				next, find customers whose parent is of category "Investor Group"
			var investorGroupSearch = priLibrary.searchAllRecords(search.create({
				type:		record.Type.CUSTOMER,
				filters:	[
				        	 ["isinactive",search.Operator.IS,false]
				        	 ,"AND",["internalid",search.Operator.ANYOF,custList]
				        	 ,"AND",["parentcustomer.category",search.Operator.ANYOF,[srsConstants.CUSTOMER_CATEGORY.INVESTOR_GROUP]]
				        	 ],
				columns:	["parentcustomer.internalid"]
			}));  
						
			var investorGroupList = []; 
			
			for (var i = 0; i < investorGroupSearch.length; i++)
				investorGroupList.push({custId: investorGroupSearch[i].id, groupId: investorGroupSearch[i].getValue({name: "internalid", join: "parentcustomer"})});


//			and for those investor groups, find the appropriate SDA records
//			ATP-1403: need to pass the custList to this function, as it will need to validate against that list
			loadInvestorGroupShareholderDataAccessRecords(requiredLetters, investorGroupList, custList, RAP); 

			log.debug(funcName, "We now have " + requiredLetters.length + " after adding Investor Group records via SDA ."); 
			
			
			// we now need to merge them based on the Contact
			
			var newLetters = [];
			
			for (var i = 0; i < requiredLetters.length; i++) {
				// first see if this letter is already in our new list
				var foundIdx = -1; 
				
				for (var j = 0; j < newLetters.length; j++)
					if (requiredLetters[i].contactId == newLetters[j].contactId) {
						foundIdx = j; 
						break; 
					}
				
				if (foundIdx < 0) {
					// doesn't exist yet, so add it and turn the custId field into an Array
					newLetters.push(requiredLetters[i]);
					log.error(funcName, "       added as new entry " + newLetters.length-1); 
					newLetters[newLetters.length-1].custId = [newLetters[newLetters.length-1].custId];		// turn the custId into an array 					
				} else 						
					// does exist, so just add the current customer to the array
					newLetters[foundIdx].custId.push(requiredLetters[i].custId); 
			}
			
			return newLetters; 
			// return requiredLetters; 
			
			
		}
		
		// ================================================================================================================================

		function loadCustomerShareholderDataAccessRecords(requiredLetters, custList, RAP) {

			var funcName = "loadCustomerShareholderDataAccessRecords"; 
			
          
   			log.debug(funcName, "custList.length=" + custList.length); 
			log.debug(funcName, "custList=" + JSON.stringify(custList)); 
			log.debug(funcName, "DEAL=" + RAP.getValue("custrecord_escrow_payment_deal")); 

			// if the list of customers is too big, then call yourself recursively with smaller lists, since each call builds on the requiredLetters 			
			
			if (custList.length > MAX_CUSTOMERS_TO_SELECT) {
				for (var i = 0; i < custList.length / MAX_CUSTOMERS_TO_SELECT; i++) {
					var min = (i * MAX_CUSTOMERS_TO_SELECT);									// eg 0, 500, 1000
					var max = Math.min((i+1) * MAX_CUSTOMERS_TO_SELECT,custList.length);		// eg 500, 1000, 1500
				  
					var subList = custList.slice(min, max); 

					log.debug(funcName, "Running recursive process for customers " + min + " to " + max); 
					
					loadCustomerShareholderDataAccessRecords(requiredLetters, subList, RAP); 
				}
				return; 				
			}
			
			
			var sdaSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecord_shareholder_data_access",
				filters:	[
				        	 	["custrecord_shareholder",search.Operator.ANYOF,custList]
				        	 	,"AND",["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.email",search.Operator.ISNOTEMPTY,null]
				        	 	,"AND",["custrecord_escrow",search.Operator.ANYOF,[RAP.getValue("custrecord_escrow_payment_deal")]]
				        	 ],
				columns:	["custrecord_user","custrecord_shareholder"]
			})); 

			for (var i = 0; i < sdaSearch.length; i++) {
				var result = sdaSearch[i];

				if (result.getValue("custrecord_shareholder")) {
					var shareholderList =  result.getValue("custrecord_shareholder").split(",");
					for (var j = 0; j < shareholderList.length; j++) {
						var custId = shareholderList[j];

						// multiple customers are listed ... only take the one that is part of our "customer list"						
						if (custList.indexOf(custId) >= 0) {
							var obj = {};
							
							obj.contactId = result.getValue("custrecord_user"); 
							obj.contactName = result.getText("custrecord_user"); 
							obj.custId = shareholderList[j];  
							// obj.escrowIds = custEscrows[obj.custId]; 
							obj.journalIds = RAP.getValue("custrecord_release_journals"); 
							
							if (!customerContactExists(obj, requiredLetters))
//								if (obj.escrowIds)
									requiredLetters.push(obj); 																	
						}						
					}						
				}
				
			}
		}
		

		// ================================================================================================================================

		function loadInvestorGroupShareholderDataAccessRecords(requiredLetters, investorGroupList, custList, RAP) {
			
			if (investorGroupList.length == 0)
				return;
			
			// extract all unique investor groups
			var groupList = [];
			for (var i = 0; i < investorGroupList.length; i++)
				if (groupList.indexOf(investorGroupList[i].groupId) < 0)
					groupList.push(investorGroupList[i].groupId); 

			var sdaSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecord_shareholder_data_access",
				filters:	[
				        	 	["custrecord_investor_group",search.Operator.ANYOF,groupList]
				        	 	,"AND",["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.email",search.Operator.ISNOTEMPTY,null]
				        	 	,"AND",["custrecord_escrow",search.Operator.ANYOF,[RAP.getValue("custrecord_escrow_payment_deal")]]
				        	 ],
				columns:	["custrecord_user","custrecord_shareholder","custrecord_investor_group"]
			})); 

			for (var i = 0; i < sdaSearch.length; i++) {
				var result = sdaSearch[i];
				
				if (result.getValue("custrecord_shareholder")) {					
					// only take the shareholders listed in this group
					var shareholderList =  result.getValue("custrecord_shareholder").split(",");
					for (var j = 0; j < shareholderList.length; j++) {
						var custId = shareholderList[j];
						
						if (custList.indexOf(custId) >= 0) {
							var obj = {};
							
							obj.contactId = result.getValue("custrecord_user"); 
							obj.contactName = result.getText("custrecord_user"); 
							obj.custId = shareholderList[j];  
//							obj.escrowIds = custEscrows[obj.custId]; 
							obj.journalIds = RAP.getValue("custrecord_release_journals"); 
							
							if (!customerContactExists(obj, requiredLetters))
//								if (obj.escrowIds)
									requiredLetters.push(obj); 											
							
						}													
					}						
					
				} else {
					// take all shareholders who are part of this group
					for (var j = 0; j < investorGroupList.length; j++) {
						
						if (result.getValue("custrecord_investor_group") == investorGroupList[j].groupId) {
							var custId = investorGroupList[j].custId;
							if (custList.indexOf(custId) >= 0) {
								var obj = {};
								
								obj.contactId = result.getValue("custrecord_user"); 
								obj.contactName = result.getText("custrecord_user"); 
								obj.custId = investorGroupList[j].custId;  
//								obj.escrowIds = custEscrows[obj.custId]; 
								obj.journalIds = RAP.getValue("custrecord_release_journals"); 
								
								if (!customerContactExists(obj, requiredLetters))
//									if (obj.escrowIds)
										requiredLetters.push(obj); 																		
								
							}
						}
						
					}											
				}				
			}
		}
		
		
		// ================================================================================================================================
		
		function customerContactExists(obj, requiredLetters) {
			for (var i = 0; i < requiredLetters.length; i++) 
				if (requiredLetters[i].contactId == obj.contactId && requiredLetters[i].custId == obj.cistId)
					return true;
		}
		
		
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================


		// find shareholder letters which already exist in PENDING status, so that we don't duplicate them
		
		function findExistingLetters(RAP) {
			var funcName = scriptName + "findExistingLetters " + RAP.id; 
			
			log.debug(funcName, "Starting");

			var ss = priLibrary.searchAllRecords(search.create({
				type: 		"customrecord_srs_shrhldr_letter",
				filters:	[
				        	 	["isinactive","is","F"] 
				        	 	,"AND",["custrecord_rel_app_process_rec",search.Operator.ANYOF,[RAP.id]]
				        	 	,"AND",["custrecord_sl_dist_status",search.Operator.ANYOF,[srsConstants.SHAREHOLDER_LETTER_DISTRIBUTION_STATUS.PENDING,"@NONE@"]]
				        	 	,"AND",["custrecord_rc_type",search.Operator.ANYOF,[RELEASE_COMMUNICATION_IS_EXPIRATION_LETTER]]
				        	 ],
				columns:	["custrecord_contact","custrecord_shareholder_shletter"]
			})); 
			
			log.debug(funcName, "Retrieved " + ss.length + " LETTER rows");

			var existingLetters = []; 			

			for (var i = 0; i < ss.length; i++) {
				var result = ss[i];
				
				var contactId = result.getValue("custrecord_contact"); 
				var shareholderId = result.getValue("custrecord_shareholder_shletter");
				
				var obj = {contactId: result.getValue("custrecord_contact"), custId: result.getValue("custrecord_shareholder_shletter")}; 
				
				existingLetters.push(obj); 
/*				
				counter++;
				if (counter > 900) {
					log.error(funcName, "*** loop ***");
					return;
					
				}
*/				
			}
			
						
			log.debug(funcName, existingLetters.length + " Shareholder Letter Record(s) already exist.");  			

			return existingLetters; 
			
		}
		
		// ================================================================================================================================


        return {
            execute: execute
        };
    }
);