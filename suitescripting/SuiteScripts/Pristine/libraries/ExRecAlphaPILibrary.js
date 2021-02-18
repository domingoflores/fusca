/**
 * ExRecAlphaPILibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * Centralized library of functions used in the Payment Dashboard Alpha PI Aware project
 *
 * include '/SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
 * Version    Date            Author           Remarks
 *	1.0		  				  Alana Thomas	   Initial version 
 *            12/12/2018      Ken Crossman     ATP-456 Exclude any Exchange Record with Paymethod = Payroll from being tagged with a PI/PI Sub
 */
define(['N/search', 'N/record', 'N/runtime' ,'N/task'
	   ,'SuiteScripts/Pristine/libraries/searchLibrary'
	   ,'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
	   ,'/SuiteScripts/Prolecto/Shared/SRS_Functions'
	   ,'/.bundle/132118/PRI_QM_Engine'
	   ],
	function(search, record, runtime, task, searchLib, piListLib, srsFunctions
			,qmEngine
			) {

		var piTypeConstant = piListLib.piEnum.piType;
		var paymtSuspReason = piListLib.piEnum.paymtSuspenseReason;
		var piSubmStatusConstant = piListLib.piEnum.subSts;
		var recordType = piListLib.recordType;
		var fieldId = piListLib.fieldId;
		var exRecPayMethod = piListLib.exRecPayMethod; //ATP-456
		var scriptName = 'ExRecAlphaPILibrary.js';
		
		
		
		
		
		//=========================================================================================================
		//=========================================================================================================
		function addSuspenseReasonsToRecord(exRec ,suspenseReasonsToAdd) {
			
		    var suspenseReasons = exRec.getValue("custrecord_suspense_reason");
			// suspenseReasons is not an array, it is an iterable object, so we will convert it to an array
		    // Stringify it first
			var suspenseReasonsString = JSON.stringify( suspenseReasons ) ;
			// Parse it to an array now
			var newSuspenseReasons    = JSON.parse( suspenseReasonsString );
			
			for (ix in suspenseReasonsToAdd) {
				// The new array ends up as an array of strings, so add new suspense reason id as a string
				suspenseReasonToAdd = suspenseReasonsToAdd[ix].toString()
				// It's ok if the reaason you are adding is already there
				newSuspenseReasons.push(suspenseReasonToAdd);
			}

			exRec.setValue("custrecord_suspense_reason" ,newSuspenseReasons);
			
			return newSuspenseReasons;  // return new list of suspense reasons
		}
		
		
		//=========================================================================================================
		//=========================================================================================================
		function removeSuspenseReasonsFromRecord(exRec ,suspenseReasonsToRemove ) {
			
		    var suspenseReasons = exRec.getValue("custrecord_suspense_reason");
			// suspenseReasons is not an array, it is an iterable object, so we will convert it to an array
		    // Stringify it first
			var suspenseReasonsString = JSON.stringify( suspenseReasons ) ;
			// Parse it to an array now
			var newSuspenseReasons    = JSON.parse( suspenseReasonsString );
			
			for (ix in suspenseReasonsToRemove) {
				// The new array ends up as an array of strings, so make remove suspense reason id a string
				suspenseReasonToRemove = suspenseReasonsToRemove[ix].toString()
				
				for (jx in newSuspenseReasons) {
					if (newSuspenseReasons[jx] == suspenseReasonToRemove) 
					{ newSuspenseReasons.splice(jx ,1); }
				}

			}

			exRec.setValue("custrecord_suspense_reason" ,newSuspenseReasons);
			
			return newSuspenseReasons;  // return new lis of suspense reasons
		}
		
		
		//=========================================================================================================
		//=========================================================================================================
		function paymtInstrHist(objPiToEx ,piRec ,exRec) {
			var returnObject = { value:null };
			
			var piInternalid = piRec.getValue("id");
	    	var filterInternalid = search.createFilter({ name:'custrecord_pihs_paymt_instr' ,operator:"IS"    ,values:[piInternalid] });
	    	var arrFilters = [];
	    	arrFilters.push(filterInternalid);
			
			var piHistSearchObj = search.create({ type:"customrecord_paymt_instr_hist"
				                              ,filters: arrFilters
				                              ,columns: [ search.createColumn({ name:'internalid'		                   })
					                                     ,search.createColumn({ name:'created'      ,sort:search.Sort.DESC })
					   		                            ]
					                            });


			var piHistSearch        = piHistSearchObj.run(); //returns search object
			var piHistSearchResults = piHistSearch.getRange(0,1);
			
			if (piHistSearchResults > 0) { returnObject.value = piHistSearchResults[0].getValue("internalid"); }

			return returnObject;
		}

			
		//=========================================================================================================
		//=========================================================================================================
		function medallionStatus(objPiToEx ,piRec ,exRec) {
			var returnObject = { value:null };

			var constant = { piMedStatus: { NotRequired:13 ,Accepted:16 ,Waived:17 ,Rejected:18 }
					        ,erMedStatus: { NoMedallionNeeded:5 ,MedallionApproved:4 ,CustomerElectsNoMedallion:7 ,MedallionRejected:6 }
					             ,piType: { Default:9 ,AcquiomDeal:10 ,SRSDeal:12 ,ExRec:11 }
					        ,piPayMethod: { ach:1 ,domCheck:2 ,intCheck:3 ,domWire:4 ,intWire:5 }
					        ,erPayMethod: { ach:1 ,domCheck:2, intCheck:3, domWire:4, intWire:5, payroll:6 
					        	           ,aes_ach:7 ,aes_domCheck:8 ,aes_intCheck:9 ,aes_domWire:10 ,aes_intWire:11 
					        	           ,intWire_Brokerage:12 ,intWire_Bank:13 ,domWire_Brokerage:14 ,domWire_Bank:15 
						                   ,shareDistribution:16 ,documentCollectionOnly:17 ,noCashPayment:18 }
				           };
			
			var medallionStatus = piRec.getValue(objPiToEx.piField);
			
			if (medallionStatus) {
				switch (Number(medallionStatus)) {
					case constant.piMedStatus.NotRequired: returnObject.value = constant.erMedStatus.NoMedallionNeeded;  break;
					case constant.piMedStatus.Accepted:    returnObject.value = constant.erMedStatus.MedallionApproved;  break;
					case constant.piMedStatus.Waived:      returnObject.value = constant.erMedStatus.CustomerElectsNoMedallion;  break;
					case constant.piMedStatus.Rejected:    returnObject.value = constant.erMedStatus.MedallionRejected;  break;
				}
			}

			
			return returnObject;
		}

			
		//=========================================================================================================
		//=========================================================================================================
		function addlInstructions(objPiToEx ,piRec ,exRec) {
			var returnObject = { value:null ,payoutTypeId:null ,payout_no_override_ref_txt:null };
			
			var overrideReferenceText = true;
			
			returnObject.payoutTypeId = exRec.getValue("custrecord_acq_lot_payout_type");
			
			if (returnObject.payoutTypeId) {
				var objRecordFields = search.lookupFields({type:"customrecord_payment_type" ,id:returnObject.payoutTypeId
                                                       ,columns:["custrecord_payout_no_override_ref_txt" ]});
				returnObject["payout_no_override_ref_txt"] = objRecordFields["custrecord_payout_no_override_ref_txt"];
				if ( returnObject["payout_no_override_ref_txt"] ) { overrideReferenceText = false; }
			}
			
			if (overrideReferenceText) { returnObject.value = piRec.getValue(objPiToEx.piField); } // return value from PI
			else                       { returnObject.value = exRec.getValue(objPiToEx.exField); } // return existing value
			
			return returnObject;
		}

		
		//======================================================================================================================================
		// This function returns the value to go into custrecord_acq_loth_5b_de1_abaswiftnum
		// Unfortunately that value can come from one of two fields depending on Payment Method
		// The PI has separate fields to store the ABA (Domestic) and Swift (international)
		// Unfortunately the Exchange record has a single field to hold either of these values
		// When Domestic; the ABA goes into the Exchange rec Wire ABA/Swift field and also goes into the ABA Verify field
		// When International Wire the ABA Verify is left blank
		// The Wire ABA/Swift still goes into the Wire ABA/Swift field, but that value needs to be validated and the result 
		// goes into the SWIFT/BIC NUMBER STATUS field
		// This function will return the value for custrecord_acq_loth_5b_de1_abaswiftnum and update the other fields here
		//======================================================================================================================================
		function wireSwiftOrAba(objPiToEx ,piRec ,exRec) {
			var returnObject = { value:null };
			
			
			
			// 
			var acq_loth_4_de1_lotpaymethod = exRec.getValue("custrecord_acq_loth_4_de1_lotpaymethod");
			
			var lotpaymethod_domesticWire                =  4; 
			var lotpaymethod_domesticWire_brokerage      = 14; 
			var lotpaymethod_domesticWire_bank           = 15; 
			var lotpaymethod_internationalWire           =  5;
			var lotpaymethod_internationalWire_brokerage = 12; 
			var lotpaymethod_internationalWire_bank      = 13;
			
			if (   acq_loth_4_de1_lotpaymethod == lotpaymethod_domesticWire
				|| acq_loth_4_de1_lotpaymethod == lotpaymethod_domesticWire_bank
				|| acq_loth_4_de1_lotpaymethod == lotpaymethod_domesticWire_brokerage  ) {
				// Domestic Wire means we are updating custrecord_acq_loth_5b_de1_abaswiftnum from PI field custrecord_pi_ep_abarouting_wire
				var pi_ep_abarouting_wire = piRec.getValue("custrecord_pi_ep_abarouting_wire");
				returnObject.value = pi_ep_abarouting_wire;
				// This value also needs to go into field "DE1-E3) Wire ABA Verification"
				exRec.setValue("custrecord_acq_loth_5b_de1_wireverify" ,pi_ep_abarouting_wire);
			}
			
			else
				
			if (   acq_loth_4_de1_lotpaymethod == lotpaymethod_internationalWire
				|| acq_loth_4_de1_lotpaymethod == lotpaymethod_internationalWire_bank
				|| acq_loth_4_de1_lotpaymethod == lotpaymethod_internationalWire_brokerage ) {
				// International Wire means we are updating custrecord_acq_loth_5b_de1_abaswiftnum from PI field custrecord_pi_ep_swiftbic
				var pi_ep_swiftbic = piRec.getValue("custrecord_pi_ep_swiftbic");
				returnObject.value = pi_ep_swiftbic;
			}

			
			return returnObject;
		}
				
		
		
		
		//=========================================================================================================
		//=========================================================================================================
		function applyPaymentInstructionToExrec(context) {
			var funcName = scriptName + '==>' + 'applyPaymentInstructionToExrec';
			
			var arrayPiToEx = piListLib.arrayPiToExchangeRecord;
			try {
				var exRec      = context.newRecord;

				var piId       = exRec.getValue("custrecord_exrec_payment_instruction");
				var piRec      = record.load({type:'customrecord_paymt_instr' ,id:piId ,isDynamic:true });
		  	  	var pmtMethod  = piRec.getValue("custrecord_pi_paymethod");
		  	  	exRec.setValue("custrecord_acq_loth_4_de1_lotpaymethod" ,pmtMethod);

			    for (ix in arrayPiToEx) {
			    	  var objPiToEx = null;
			    	  var value;
			    	  
			    	  // Only process those fields that either specify as PI Source field or a Function 
			    	  // and have no Payment Method specified or match the Payment Method on the PI record
			    	  if (arrayPiToEx[ix].piField > "" || arrayPiToEx[ix].func > "") {
				    	  if (arrayPiToEx[ix].pmtMethods.length > 0 ) {
				    		  if (arrayPiToEx[ix].pmtMethods.indexOf(pmtMethod) > -1) {
					    		  objPiToEx = arrayPiToEx[ix];
				    		  }
				    	  }
				    	  else { objPiToEx = arrayPiToEx[ix]; }
			    	  }
			    	  
			    	  if (objPiToEx) {
				    	  if (objPiToEx.func > "") {
				    		  // Here a function has been specified to obtain a value
				    		  var piFunction = this[objPiToEx.func];
				    		  var result = piFunction(objPiToEx ,piRec ,exRec);
				    		  value = result.value;
				    	  }
				    	  else 
				    	  if ( Array.isArray(objPiToEx.piField) ) {
				    		  // This is a case where piField is a list of field id's rather than a simple string
				    		  // Pick value of first field in list that is > empty string
				    		  value = "";
				    		  for (jx in objPiToEx.piField) {  
				    			  var sourceValue = piRec.getValue(objPiToEx.piField[jx]);
				    			  if (sourceValue && sourceValue.toString().trim() > "") {
				    				  value = sourceValue;
				    				  break;
				    			  }
				    		  }
				    	  } 
				    	  else 
				    	  if (objPiToEx.getText) {
				    		  try {value = piRec.getText(objPiToEx.piField);}
				    		  catch(eGetText) { value = piRec.getValue(objPiToEx.piField); }
				    	  }
				    	  else {
				    		  value = piRec.getValue(objPiToEx.piField);
				    		  
				    	  }
			    		  
				  		  exRec.setValue(objPiToEx.exField ,value );
			    	  } // if (objPiToEx)

			    } // for (ix in arrayPiToEx)
				
			}
			catch(e) {
				log.error(funcName, "Exception: " + e);
				var returnObject = { success:false };
				returnObject.exception = e;
				return returnObject;
			}
			
			return { success:true };
		}
		
		
		//=========================================================================================================
		//=========================================================================================================
		function clearPIDataOnExrec(context) {
			var funcName = scriptName + '==>' + 'clearPIDataOnExrec';
			
			var arrayPiToEx = piListLib.arrayPiToExchangeRecord;
			try {
				var exRec = context.newRecord;

			    for (ix in arrayPiToEx) {
			    	var objPiToEx = arrayPiToEx[ix];
				  	exRec.setValue(objPiToEx.exField ,objPiToEx.clearFieldValue );
			    } // for (ix in arrayPiToEx)
				
			}
			catch(e) {
				log.error(funcName, "Exception: " + e);
				var returnObject = { success:false };
				returnObject.exception = e;
				return returnObject;
			}
			
			return { success:true };
		}
		
		
		
		
		//=========================================================================================================
		//=========================================================================================================
		function applyPiModificationToExRecViaQueueManager(exRecId ,callingScript ) {
			var funcName = scriptName + '==>' + 'applyPiModificationToExRecViaQueueManager';
			
			// Queue up this exchange record to have the PI change applied to the Exchange Record    
			// This will cover changing the PI or simply removing it
			var QManagerParm = {"func":"applyPiModificationToExrec" ,"exRecId":exRecId ,"callingScript":callingScript };  
			var intQid = qmEngine.addQueueEntry("AlphaPIExchangeRecord" ,QManagerParm ,null ,true ,'customscript_exrec_alpha_pi_qm');
			
		}

		
		
		//=========================================================================================================
		//=========================================================================================================
		function updateExRecViaQueueManager(shareholder ,deal ,exRec ,callingScript ) {
			var funcName = scriptName + '==>' + 'updateExRecViaQueueManager';
			
			//Now Queue up this exchange record to be processed for Alpha PI            				
			var QManagerParm = {"func":"tagExchangeRecord" ,"exRecId":exRec ,"shareholder":shareholder ,"deal":deal ,"callingScript":callingScript };                			
			var intQid = qmEngine.addQueueEntry("AlphaPIExchangeRecord" ,QManagerParm ,null ,true ,'customscript_exrec_alpha_pi_qm');
			
		}
		
		
		//=========================================================================================================
		//=========================================================================================================
		function updateRelatedExRecsViaMapReduce(shareholder ,deal ,exRec ,callingScript ) {
			var funcName = scriptName + '==>' + 'updateRelatedExRecsViaMapReduce';
			
			var exRecSearchResults = getShareholderExRecs(shareholder, deal, exRec);
			
			if (exRecSearchResults.length == 0) { return; }
			
			var exchangeRecordList = [];
			for (var i = 0; i < exRecSearchResults.length; i++) {
				exchangeRecordList.push(exRecSearchResults[i].id);
			}
			
			log.debug(funcName ,"shareholder: " + shareholder + ",    deal: " + deal + ",    exRec: " + exRec );
			log.debug(funcName ,"exchangeRecordList: " + JSON.stringify(exchangeRecordList) );
			
			var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
			mapReduceTask.scriptId     = 'customscript_exrec_alpha_pi_mapreduce';
			//mapReduceTask.deploymentId = 'customdeploy_exrec_alpha_pi_mapreduce1';
			mapReduceTask.params = { 'custscript_exrec_mr_shareholder'   : shareholder 
									,'custscript_exrec_mr_deal'          : deal
									,'custscript_exrec_mr_exrec_list'    : exchangeRecordList
									,'custscript_exrec_mr_callingscript' : callingScript
					               };
			
			log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
			var mapReduceTaskId = mapReduceTask.submit();
		}

		//=========================================================================================================
		//=========================================================================================================
		/**
		 * Finds every unpaid and active Exchange Record linked to the shareholder, deal and exchange record combination.
		 * Finds every PI and PI Sub linked to the shareholder
		 * Links each exchange record to the correct (highest ranked) PI or PI Sub. 
		 * @param {string}        Record ID - The ID of either a PI or a PI Submission
		 * @param {string}        The internal id of the record type - either PI or PI Submission 
		 * @param {string}        Shareholder ID 
		 * @return {object} 		
		 */
		function updateRelatedExRecs(shareholder, deal, exRec) {
			var funcName = scriptName + '==>' + 'updateRelatedExRecs';
			log.debug(funcName, 'shareholder: ' + shareholder);
			log.debug(funcName, 'deal: ' + deal);
			log.debug(funcName, 'exRec: ' + exRec);
			var success = true;
			var message = '';
			var currentScript = runtime.getCurrentScript();
			var remainingUsage = currentScript.getRemainingUsage();
			var updateExRecWithAlphaPIResult = null;
			var dealId = null;
			var exRecId = null;
			var suspenseReasons = null;

			// Get all exchange records linked to shareholder
			var exRecSearchResults = getShareholderExRecs(shareholder, deal, exRec);
			log.debug(funcName, 'exRecSearchResults: ' + JSON.stringify(exRecSearchResults));
			// Get all Payment Instructions for the Shareholder
			var shareholderPIs = getShareholderPIs(recordType.pi, shareholder); //This costs 10 units
			// Get all Payment Instruction Submissions for the Shareholder
			var shareholderPISubs = getShareholderPIs(recordType.piSub, shareholder); //This costs 10 units
			log.debug(funcName, 'remainingUsage before 1st Ex Rec: ' + remainingUsage);
			// Loop through every unpaid, active Exchange Record linked to the shareholder  
			// and link it to the highest ranked PI or PI Sub.
			for (var i = 0; i < exRecSearchResults.length; i++) {
				dealId = exRecSearchResults[i].getValue(fieldId.exRecDeal);
				exRecId = exRecSearchResults[i].id;
				suspenseReasons = exRecSearchResults[i].getValue(fieldId.exRecSuspReason);

				if (suspenseReasons) {
					suspenseReasons = suspenseReasons.split(',');
				}
				updateExRecWithAlphaPIResult = updateExRecWithAlphaPI(shareholder, exRecId, dealId, suspenseReasons, shareholderPIs, shareholderPISubs); // This costs 2 units
				success = updateExRecWithAlphaPIResult.success;
				message = updateExRecWithAlphaPIResult.message;
				if (!success) {
					break;
				}
				remainingUsage = currentScript.getRemainingUsage();
				if (remainingUsage < 5) {
					//We need to stop processing
					success = false;
					message = 'Governance Units too low to continue. Remaining Units: ' + remainingUsage + ' out of 1000 \n\n';
					message += i + ' Exchange Records out of ' + exRecSearchResults.length + ' linked to shareholder updated.\n\n';
					message += 'PLEASE CONTACT I.T. SUPPORT IN ORDER FOR THIS ISSUE TO BE ADDRESSED';
					break;
				}
			}
			log.debug('updateRelatedExRecs', 'remainingUsage after ' + exRecSearchResults.length + ' Ex Recs: ' + remainingUsage);

			return {
				success: success,
				message: message
			};
		}

		//=========================================================================================================
		//=========================================================================================================
		function getShareholderExRecs(shareholder ,deal ,exRec) {
			log.debug('getShareholderExRecs', 'exRecPayMethod.payroll: ' + exRecPayMethod.payroll);
			var filters = [];
			filters.push([fieldId.exRecShareholder, 'anyof', shareholder]);
			filters.push('and');
			filters.push([fieldId.exRecCreditMemo, 'anyof', '@NONE@']);
			filters.push('and');
			filters.push([fieldId.exRecPayMethod, 'noneof', exRecPayMethod.payroll]); //ATP-456
			filters.push('and');														//ATP-456
			if (deal) {
				filters.push([fieldId.exRecDeal, 'anyof', deal]);
				filters.push('and');
			}
			if (exRec) {
				filters.push(['internalid', 'anyof', exRec]);
				filters.push('and');
			}
			filters.push(['isinactive', 'is', 'F']);

			var myExRecSearch = search.create({
				type: recordType.exRec,
				filters: filters,
				columns: [fieldId.exRecShareholder, fieldId.exRecDeal, fieldId.exRecSuspReason]
			}).run();
			log.debug('getShareholderExRecs', 'exRecSearchResults = searchLib.getSearchResultData(myExRecSearch);');
			var exRecSearchResults = searchLib.getSearchResultData(myExRecSearch); // This cost 10 units
			return exRecSearchResults;
		}

		//=========================================================================================================
		//=========================================================================================================
		/**
		 * Finds every PI and PI Submission that pertains to an Exchange record and then
		 * ranks them and then links the Exchange Record to the highest ranked PI/PI Sub
		 * @param {string}        Shareholder ID
		 * @param {string}        Exchange Record ID 
		 * @param {string}        Deal ID 
		 * @param {multi-select}  Suspense reasons 
		 * @param {object array}  Shareholder Payment Instructions
		 * @param {object array}  Shareholder PI Submissions 
		 * @return {object} 		
		 */
		function updateExRecWithAlphaPI(shareholder, exRecId, dealId, suspenseReasons, shareholderPIs, shareholderPISubs) { // This function costs 2 units
			log.debug('updateExRecWithAlphaPI', 'shareholder: ' + shareholder);
			log.debug('updateExRecWithAlphaPI', 'dealId: ' + dealId);
			log.debug('updateExRecWithAlphaPI', 'exRecId: ' + exRecId);
			log.debug('updateExRecWithAlphaPI', 'suspenseReasons: ' + JSON.stringify(suspenseReasons));
			log.debug('updateExRecWithAlphaPI', 'shareholderPIs: ' + JSON.stringify(shareholderPIs));
			log.debug('updateExRecWithAlphaPI', 'shareholderPISubs: ' + JSON.stringify(shareholderPISubs));
			var success = false;
			var message = '';
			var currentScript = runtime.getCurrentScript();

			var finalSuspenseReasons = cleanAlphaPISuspenseReasons(suspenseReasons);
			var masterPIList = {};
			// Find every active PI which contains this Exchange Record within its scope i.e. Default level, Deal level with same Deal as Ex Rec or Ex Rec Level with matching Ex Rec 
			var exRecPIs = getExRecPIs(recordType.pi, shareholder, exRecId, dealId, shareholderPIs);
			log.debug('updateExRecWithAlphaPI', 'exRecPIs: ' + JSON.stringify(exRecPIs));
			masterPIList = buildRelatedPIList('PI', fieldId.piPIType, exRecPIs, masterPIList);
			log.debug('updateExRecWithAlphaPI', 'masterPIList with PIs: ' + JSON.stringify(masterPIList));
			var exRecSubs = getExRecPIs(recordType.piSub, shareholder, exRecId, dealId, shareholderPISubs);
			log.debug('updateExRecWithAlphaPI', 'exRecSubs: ' + JSON.stringify(exRecSubs));
			masterPIList = buildRelatedPIList('Sub', fieldId.piSubPIType, exRecSubs, masterPIList);
			log.debug('updateExRecWithAlphaPI', 'masterPIList with subs: ' + JSON.stringify(masterPIList));
			piFinal = findMatchingPI(masterPIList);
			log.debug('updateExRecWithAlphaPI', 'piFinal: ' + JSON.stringify(piFinal));
			var submitFieldsToExRecResult = submitFieldsToExRec(exRecId, piFinal, finalSuspenseReasons); //This costs 2 units
			success = submitFieldsToExRecResult.success;
			message = submitFieldsToExRecResult.message;
			return {
				success: success,
				message: message
			};
		}

		//=========================================================================================================
		//=========================================================================================================
		function submitFieldsToExRec(exRecId, piFinal, finalSuspenseReasons) {
			var success = '';
			var message = '';
			var fieldsToUpdate = {
				custrecord_exrec_payment_instruction: '',
				custrecord_exrec_paymt_instr_sub: ''
			};
		
			if (piFinal) {
				if (piFinal.suspenseReason) {
					for (var i = 0; i < piFinal.suspenseReason.length; i++) {
						finalSuspenseReasons.push(piFinal.suspenseReason[i]);
					}
				}
				fieldsToUpdate[piFinal.piField] = piFinal.piId;
			}
			fieldsToUpdate.custrecord_suspense_reason = finalSuspenseReasons;
			// The dummy field custrecord_triggerExRecRefreshFromPI is created and set to true now.
			// This ensures that the UE script pullpIUpdates.js will refresh the Exchange Record becuase it checks for this flag 
			fieldsToUpdate.custrecord_triggerExRecRefreshFromPI = true;
		
			try {
				record.submitFields({
					type: recordType.exRec,
					id: exRecId,
					values: fieldsToUpdate
				});
				
				success = true;
			} catch (e) {
				log.error(e.name, e.message + ' // ' + e.stack);
				message = e.message;
				success = false;
			}
			return {
				success: success,
				message: message
			};
		}

		
		//=========================================================================================================
		//=========================================================================================================
		/**
		 * Selects the highest ranked PI/PI Sub in the masterPIList
		 * 
		 * @param {object array}  masterPIList - the combined list of related PIs and PI Subs  
		 * @return {object}       Containing new values for the following Exchange Record fields: PI, PI Sub and Suspense Reason		
		 */
		function findMatchingPI(masterPIList) {

			var piPriority = ['exRecSub', 'exRecPI', 'dealSub', 'dealPI', 'defaultSub', 'defaultPI'];
			for (var i = 0; i < piPriority.length; i++) {
				if (masterPIList.hasOwnProperty(piPriority[i])) {
					var submissionFlag = piPriority[i].indexOf('Sub') != -1 ? true : false; //Indicates whether this is a PI or PI Submission we are looking at
					var exRecPiField = getExRecPIField(piPriority[i]); // The internal id of either the PI or PI Sub field on the Exchange Record
					var piId = masterPIList[piPriority[i]][0].id; // Get the id of the 1st(and only) PI or PI Subm with the current PI Type/PI Priority 
					if (masterPIList[piPriority[i]].length > 1) { // duplicates ahoy
						if (!submissionFlag) {
							// duplicate Payment Instructions
							return {
								piField: exRecPiField,
								suspenseReason: [paymtSuspReason.DuplicatePI],
								piId: piId
							};
						}
						// duplicate Payment Instruction Submissions
						return {
							piField: exRecPiField,
							suspenseReason: [paymtSuspReason.DuplicatePISubm, paymtSuspReason.OutstandingPISubm],
							piId: piId
						};
					}
					if (submissionFlag) { // If this is a Payment Instruction Submission
						return {
							piField: exRecPiField,
							suspenseReason: [paymtSuspReason.OutstandingPISubm],
							piId: piId
						};
					}
					if (masterPIList[piPriority[i]][0].getValue(fieldId.piOnHold)) {
						return {
							piField: exRecPiField,
							suspenseReason: [paymtSuspReason.PIOnHold],
							piId: piId
						};
					}
					return {
						piField: exRecPiField,
						piId: piId
					};
				}
			}
			return false;
		}


		//=========================================================================================================
		//=========================================================================================================
		function getExRecPIField(piType) {
			switch (piType) {
				case 'exRecPI':
				case 'dealPI':
				case 'defaultPI':
					return fieldId.exRecPI;
			}
			return fieldId.exRecPISub;
		}

		
		//=========================================================================================================
		//=========================================================================================================
		/**
		 * Builds an object containing all PIs and PI Subs related to this Exchange Record
		 * @param {string}        piRecType - Indicates whether the input is PIs or PI Subs
		 * @param {string}        piTypeField - the internal id of the PI Type field (either on the PI or PI Sub) 
		 * @param {object array}  searchResults - list of either related PI or PI Subs 
		 * @param {object array}  masterPIList - the combined list of related PIs and PI Subs  
		 * @return {object} 		
		 */
		function buildRelatedPIList(piRecType, piTypeField, searchResults, masterPIList) {
			if (searchResults.length > 0) {
				var exRecPIType = null;
				var piType = null;
				for (var i = 0; i < searchResults.length; i++) {
					piType = Number(searchResults[i].getValue(piTypeField));
					switch (piType) {
						case piTypeConstant.Default:
							exRecPIType = 'default' + piRecType;
							break;
						case piTypeConstant.AcquiomDeal:
						case piTypeConstant.SRSDeal:
							exRecPIType = 'deal' + piRecType;
							break;
						case piTypeConstant.ExchangeRecord:
							exRecPIType = 'exRec' + piRecType;
							break;
					}

					if (!masterPIList.hasOwnProperty(exRecPIType)) {
						masterPIList[exRecPIType] = [];
					}
					masterPIList[exRecPIType].push(searchResults[i]);
				}
			}
			return masterPIList;
		}

		
		//=========================================================================================================
		//=========================================================================================================
		function getShareholderPIs(searchType, shareholder) {

			var shareholderField = fieldId.piShareholder;
			var exRecField = fieldId.piExRec;
			var dealField = fieldId.piDeal;
			var typeField = fieldId.piPIType;
			var columns = [
				search.createColumn({
					name: exRecField,
					sort: search.Sort.ASC
				}),
				search.createColumn({
					name: dealField,
					sort: search.Sort.ASC
				}),
				search.createColumn({
					name: typeField,
					sort: search.Sort.ASC
				}),
				search.createColumn({
					name: fieldId.piOnHold
				}),
			];

			if (searchType == recordType.piSub) {
				shareholderField = fieldId.piSubShareholder;
				exRecField = fieldId.piSubExRec;
				dealField = fieldId.piSubDeal;
				typeField = fieldId.piSubPIType;
				columns = [
					search.createColumn({
						name: exRecField,
						sort: search.Sort.ASC
					}),
					search.createColumn({
						name: dealField,
						sort: search.Sort.ASC
					}),
					search.createColumn({
						name: typeField,
						sort: search.Sort.ASC
					}),
					search.createColumn({
						name: fieldId.piSubStatus
					})
				];
			}

			var filters = [];
			filters.push([shareholderField, 'anyof', shareholder]);
			filters.push('and');
			filters.push(['isinactive', 'is', 'F']);

			if (searchType == recordType.piSub) {
				filters.push('and');
				filters.push([fieldId.piSubStatus, 'noneof', piSubmStatusConstant.Promoted]);
				filters.push('and');
				filters.push([fieldId.piSubStatus, 'noneof', piSubmStatusConstant.Canceled]); // Submission status is NOT Canceled or Promoted
			}
			var mySearchResultSet = search.create({
				type: searchType,
				filters: filters,
				columns: columns
			}).run();
			log.debug('getShareholderPIs', 'return searchLib.getSearchResultData(mySearchResultSet);');
			return searchLib.getSearchResultData(mySearchResultSet);
		}

		
		//=========================================================================================================
		//=========================================================================================================
		function getExRecPIs(searchType, shareholder, exRecId, dealId, shareholderPIs) {
			var piTypeField = fieldId.piPIType;
			var exRecField = fieldId.piExRec;
			var dealField = fieldId.piDeal;
			if (searchType == recordType.piSub) {
				piTypeField = fieldId.piSubPIType;
				exRecField = fieldId.piSubExRec;
				dealField = fieldId.piSubDeal;
			}
			var exRecPIs = [];
			for (var i = 0; i < shareholderPIs.length; i++) {
				// log.debug('getExRecPIs', 'shareholderPIs[i]: ' + JSON.stringify(shareholderPIs[i]));
				var piExRecId = shareholderPIs[i].getValue(exRecField);
				// log.debug('getExRecPIs', 'piExRecId: ' + piExRecId);
				var piDealId = shareholderPIs[i].getValue(dealField);
				// log.debug('getExRecPIs', 'piDealId: ' + piDealId);
				var piTypeId = Number(shareholderPIs[i].getValue(piTypeField));
				// log.debug('getExRecPIs', 'piTypeId: ' + piTypeId);
				// The PI/PISub is a contender if it meets one of the following conditions:
				// 1) the PI is Type Default i.e. Matching shareholder
				// 2) the PI is Type Deal with matching Deal 
				// 3) the PI is Type Ex Rec with matching Ex Rec
				switch (piTypeId) {
					case piTypeConstant.Default:
						// log.debug('getExRecPIs', 'Push Default');
						exRecPIs.push(shareholderPIs[i]);
						break;
					case piTypeConstant.AcquiomDeal:
					case piTypeConstant.SRSDeal:
						// log.debug('getExRecPIs', 'PI Type is Deal');
						if (Number(piDealId) === Number(dealId)) {
							// log.debug('getExRecPIs', 'Push Deal');
							exRecPIs.push(shareholderPIs[i]);
						}
						break;
					case piTypeConstant.ExchangeRecord:
						// log.debug('getExRecPIs', 'PI Type is ExRec');
						if (Number(piExRecId) === Number(exRecId)) {
							// log.debug('getExRecPIs', 'Push ExRec');
							exRecPIs.push(shareholderPIs[i]);
						}
						break;
				}
				// if (piExRecId === exRecId || (piExRecId === '' && piDealId === dealId) || (piExRecId === '' && piDealId === '')) {
				// 	exRecPIs.push(shareholderPIs[i]);
				// }
			}
			return exRecPIs;
		}

		
		//=========================================================================================================
		//=========================================================================================================
		function cleanAlphaPISuspenseReasons(suspenseReasons) {
			// removes Alpha PI-related Suspense Reasons so we can start fresh
			var finalSuspenseReasons = [];
			for (var i = 0; i < suspenseReasons.length; i++) {
				if (Number(suspenseReasons[i]) === Number(paymtSuspReason.PIOnHold) || Number(suspenseReasons[i]) === Number(paymtSuspReason.OutstandingPISubm) ||
					Number(suspenseReasons[i]) === Number(paymtSuspReason.DuplicatePI) || Number(suspenseReasons[i]) === Number(paymtSuspReason.DuplicatePISubm)) {} else {
					finalSuspenseReasons.push(suspenseReasons[i]);
				}
			}
			return finalSuspenseReasons;
		}

		
		//=========================================================================================================
		//=========================================================================================================
		function getFieldValue(context, fieldId) {
			var newRecFields = context.newRecord.getFields();
			var fieldValue = null;
			fieldValue = context.newRecord.getValue(fieldId);
			var fieldPos = null;
			if (context.type === 'xedit') {
				fieldPos = newRecFields.indexOf(fieldId);
				if (fieldPos === -1) {
					fieldValue = context.oldRecord.getValue(fieldId);
				}
			}
			return fieldValue;
		}

		return {
			cleanAlphaPISuspenseReasons: cleanAlphaPISuspenseReasons,
			getShareholderPIs: getShareholderPIs,
			getShareholderExRecs : getShareholderExRecs,
			buildRelatedPIList: buildRelatedPIList,
			findMatchingPI: findMatchingPI,
			submitFieldsToExRec: submitFieldsToExRec,
			updateExRecWithAlphaPI: updateExRecWithAlphaPI,
			updateRelatedExRecs: updateRelatedExRecs,
			updateRelatedExRecsViaMapReduce: updateRelatedExRecsViaMapReduce,
			updateExRecViaQueueManager: updateExRecViaQueueManager,
			getFieldValue: getFieldValue
			                                ,piListLib: piListLib
			                          ,medallionStatus: medallionStatus
			                         ,addlInstructions: addlInstructions
			                           ,wireSwiftOrAba: wireSwiftOrAba
			                           ,paymtInstrHist: paymtInstrHist
			           ,applyPaymentInstructionToExrec: applyPaymentInstructionToExrec
			                       ,clearPIDataOnExrec: clearPIDataOnExrec
			               ,addSuspenseReasonsToRecord: addSuspenseReasonsToRecord 
			          ,removeSuspenseReasonsFromRecord: removeSuspenseReasonsFromRecord
			,applyPiModificationToExRecViaQueueManager: applyPiModificationToExRecViaQueueManager
		};
	});