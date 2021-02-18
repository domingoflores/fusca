/**
 * Module Description
 *
 * 
 * 
 * 
 * 
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 NOV 2017     Scott Streule    User Event getOpenHolds for Payment Instructions Submission Record
 * 1.1        11 DEC 2017     Bob Powell       Merged in Block 20 to check for Dual Entry By and Revert DE Field Changes when not in Dual Entry
 * 1.2        18 JAN 2018     Scott Streule    Added controlTempFields function to add the Temp Sropdown Fields to be used by the Client Script
 * 											   to filter ExRecs and Deals based on Shareholder and Payment Instruction Type.
 * 1.3        06 FEB 2018 	  Bob Powell	   PPE-55 Medallion Reviewer can enter medallion data and acceptance status	
 * 1.4 	      28 Feb 2018     Ken Crossman     PPE-192 - Bug fix (Turns out there was no bug but the changes to this script are still worth keeping)
 * 1.5        07 Mar 2018     Ken Crossman     PPE-229 - Payment Method - New record type etc 
 * 1.6        13 Mar 2018     Ken Crossman     PPE-198/199 - Adding paymtInstrLight library.
 * 1.7        14 Mar 2018     Scott Streule    PPE-193 - Added submitfield to update the submission record with the PI ID if creating PI record
 * 1.8        22 Mar 2018     Ken              PPE-284 - Protect fields when reviewing
 * 							 				   										 PPE-177 - Prevent promotion in event of error in Dual Entry Field Change Detection
 *                                             PPE-257 - Make fields mandatory when sent for review based on Payment Method
 *			  		16 Apr 2018     Ken              ATP-29 - Create Send for Review button here so we can link it to the client script
 *  		  		4/24/2018       Ken Crossman     ATP-133 Payment Method determines Country
 *			  		4/25/2018       Ken Crossman     ATP-125 Payment History record should be created for each PI create and then after each PI update
 *            5/09/2018       Ken Crossman 	   ATP-136 Incorrect Status Error Summary message when Medallion Signature Present validation fails
 *            5/10/2018       Ken Crossman 	   ATP-155 Protect most fields in Approved status
 *            7/10/2018       AFodor           ATP-253 Import Id validation
 *            7/18/2018       Ken Crossman 	   ATP-305 Protect Shareholder and prevent updates after initial create
 *            4/15/2019       Paul Shea		   	 ATP-840 Checking 'Inactive PI' clears all Paymt Instr Holds and clears 'On Hold' checkbox from PI record
 * 			  		5/10/2019		  	Robert Bender	   ATP-857 (defect ATP-950) added checked to skip validation so the error summary & detail are blank if inactivating
 * 			  		5/10/2019		  	Robert Bender	   ATP-857 (enhancement ATP-971) if only one dupe hold left, then clear it
 * 			  		6/7/2019		  	Robert Bender	   ATP-857 (defect ATP-976) unchecks PI hold checkbox if PISB instr type changes
 * 						7/31/2019				Robert Bender		 ATP-1040 Disabling all fields except comments when Inactivate PI checkbox is checked - 7/31 : added check on null fields
 */

/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/ui/serverWidget', '/SuiteScripts/Pristine/libraries/alphaRecordLibrary.js',
		'/SuiteScripts/Pristine/libraries/searchResultsLibrary.js', '/SuiteScripts/Pristine/libraries/toolsLibrary.js',
		'/SuiteScripts/Pristine/libraries/paymtInstrLight.js', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js', 
		'/.bundle/132118/PRI_AS_Engine', '/SuiteScripts/Pristine/libraries/searchLibrary'
	],
	function(record, search, runtime, error, serverWidget, alphaRecord, searchResultsLibrary, toolsLib, paymtInstrLight, paymtInstrListLibrary, appSettings, searchLibrary) {

		var subSts = paymtInstrListLibrary.piEnum.subSts;
		var subSource = paymtInstrListLibrary.piEnum.subSource;
		var dfltsSource = paymtInstrListLibrary.piEnum.dfltsSource;
		var medSts = paymtInstrListLibrary.piEnum.medSts;
		var importSts = paymtInstrListLibrary.piEnum.importSts;
		var piType = paymtInstrListLibrary.piEnum.piType;
		var exchgAcqSts = paymtInstrListLibrary.piEnum.exchgAcqSts; // ATP-457
		var payMeth = paymtInstrListLibrary.piEnum.payMeth;
		var payInstrHoldSts = paymtInstrListLibrary.piEnum.payInstrHoldSts;
		var paymtInstrHoldSrc = paymtInstrListLibrary.piEnum.paymtInstrHoldSrc;
		var paymtInstrHoldReason = paymtInstrListLibrary.piEnum.paymtInstrHoldReason;
		var role = paymtInstrListLibrary.role;
		var department = paymtInstrListLibrary.department;
		var employeeFunction = paymtInstrListLibrary.employeeFunction;
		var PISB_fieldIds = paymtInstrListLibrary.PISB_fieldIds;

		function beforeLoad(context) {
			// log.debug('beforeLoad');
			var thisRecord = null;
			var recordFields = null;
			var allCustomFields = null;
			var baseRecordType = null;
			var recordID = null;
			var runTimeCTX = runtime.executionContext;
			var theForm = context.form;
			var eventType = context.type;
			var newRec = context.newRecord;
			log.debug('beforeLoad', 'eventType: ' + eventType + ',    runTimeCTX: ' + runTimeCTX + ',   newRec: ' + JSON.stringify(newRec));
			//log.debug('beforeLoad', 'oldRec: ' + JSON.stringify(context.oldRecord));

			baseRecordType = newRec.getValue('baserecordtype');
			recordID = newRec.getValue('id');

			var submissionStatus = parseInt(newRec.getValue('custrecord_pisb_submission_status'));
			var paymentMethod = newRec.getValue('custrecord_pisb_paymethod');

			// ATP-343
			var checkUserPermissionsResult = localCheckUserPermissions(context, submissionStatus);
			if (!checkUserPermissionsResult.success) {
				throw checkUserPermissionsResult.message;
				//var msg = "Testing - " + checkUserPermissionsResult.message;
				//throw checkUserPermissionsResult.message;
				//throw msg;
			}

			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.EDIT:
					// PPE-284 Disable most fields in edit mode
					if (context.type === context.UserEventType.EDIT) {
						thisRecord = record.load({
							type: baseRecordType,
							id: recordID
						});
						recordFields = thisRecord.getFields();
						setFieldDisplayTypesForEdit(context, recordFields, thisRecord, submissionStatus);
					}

					controlTempFields(context, theForm);

					var allPaymentFields = paymtInstrLight.getAllPaymentFields();
					disableFieldsByObject(context, allPaymentFields);
					if (paymentMethod && submissionStatus === subSts.DualEntry) { //ATP-155
						var modifiablePaymentMethodFields = paymtInstrLight.getModifiablePaymentFieldsByMethod(paymentMethod);
						enableFields(context, modifiablePaymentMethodFields);
					}
					break;
				case context.UserEventType.VIEW:
					context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/PaymtInstrSubmissionClient.js';
					// If PI Submission record already cancelled or promoted then don't add the cancel button
					if (submissionStatus !== subSts.Promoted && submissionStatus !== subSts.Canceled && submissionStatus !== subSts.Promoting) {
						// Restrict to Ops Manager and Ops Analyst roles ATP-343
						var arrayRoles = [];
						arrayRoles.push(role.opsManager);
						arrayRoles.push(role.opsAnalyst);
						if (runtime.accountId.toLowerCase() == "772390_sb3") { arrayRoles.push('administrator'); }
						checkUserPermissionsResult = toolsLib.checkUserPermissions(arrayRoles);
//						log.debug('beforeLoad', 'checkUserPermissionsResult: ' + JSON.stringify(checkUserPermissionsResult));
						if (checkUserPermissionsResult.success) {
							context.form.addButton({
								id: 'custpage_cancel_pi_submission_button',
								label: 'Cancel Submission',
								functionName: 'cancel_pi_submission'
							});
						}
						//ATP-29 Create Send for Review button and point it to the client script
						// context.form.addButton({
						// 	id: 'custpage_send_for_review_button',
						// 	label: 'Send for Review',
						// 	functionName: 'sendForReview(context)'
						// });
					}
					break;
				default:
					return;
			}

			//<ATP-1040>
//			log.debug('ATP-1040','context.type='+context.type);
			if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {

				var custrecord_pisb_inactivate_pi = newRec.getValue({
					fieldId: 'custrecord_pisb_inactivate_pi'
				});

				if ( Boolean(custrecord_pisb_inactivate_pi) ){	// incativate PI is 'T' or 'true'
					// disable all fields
					for ( var i=0; i < PISB_fieldIds.length; i++ ){
						if ( theForm.getField({id: PISB_fieldIds[i]})  ){
							theForm.getField({
								id: PISB_fieldIds[i]
							}).updateDisplayType({
								displayType: serverWidget.FieldDisplayType.DISABLED
							});
						} else {
							//log.debug('ATP-1040 FIELD NOT FOUND.. Boolean='+  Boolean(theForm.getField({id: PISB_fieldIds[i]})) , PISB_fieldIds[i] );
						}
					}

					// enable only the comments
					theForm.getField({
						id: 'custrecord_pisb_pi_comment'
					}).updateDisplayType({
						displayType: serverWidget.FieldDisplayType.NORMAL
					});
					
				} // if inactive checkbox is true

			} // EDIT or CREATE mode
			//</ATP-1040>

		}
		
		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function set_abarouting(pisbFieldName ,objRecord ,DestinationField) { // ATP-1366
			var routingText = "";
			if (pisbFieldName == "custrecord_pisb_ep_abarouting_ach") {
				recordType ="customrecord416";
				fieldName = "custrecord162";
			}
			else 
			if (pisbFieldName == "custrecord_pisb_ep_abarouting_wire" || pisbFieldName == "custrecord_pisb_ep_imb_abaroutg_wire") {
				recordType ="customrecord415";
				fieldName = "custrecord153";
			}
			
			var objRoutingFields = search.lookupFields({type:recordType ,id:objRecord.getValue(pisbFieldName) ,columns:[fieldName ]});
			routingText = objRoutingFields[fieldName];
			
			objRecord.setValue({ fieldId:DestinationField ,value:routingText ,ignoreFieldChange: true });
		}

		//===========================================================================================================================================================
		//===========================================================================================================================================================
		function beforeSubmit(context) {
			var thisRecord = null;
			var recordFields = null;
			var baseRecordType = null;
			var recordID = null;
			var runTimeCTX = runtime.executionContext;
			log.debug('beforeSubmit', 'context.type: ' + context.type + ',   runtime.executionContext: ' + runTimeCTX);
			var i = null; //For re-usable index

			// 03 - Script Variable Initialization (including hoisted vars)
			// Used in Block 50, 20
			var statusErrSummary = '';
			var errorDetail = '';

			//GET DATA FROM THE RECORD BEING CREATED
			// 05 - Pull data from NetSuite NEW Record Object
			var newPaySubRecord = context.newRecord;
			var oldPaySubRecord = context.oldRecord;

            baseRecordType = newPaySubRecord.getValue('baserecordtype');
			recordID = newPaySubRecord.getValue('id');
			// log.debug('beforeSubmit', 'recordID: ' + JSON.stringify(recordID));
			if (context.type === 'edit') {
				thisRecord = record.load({
					type: baseRecordType,
					id: recordID
				});
				recordFields = thisRecord.getFields();
			}

			// ATP-1366
			if (newPaySubRecord.getValue("custrecord_pisb_ep_abarouting_ach") > "") {
				set_abarouting("custrecord_pisb_ep_abarouting_ach"  ,newPaySubRecord ,"custrecord_pisb_ep_abarouting");
			} 
			else
			if (newPaySubRecord.getValue("custrecord_pisb_ep_abarouting_wire") > "") {
				set_abarouting("custrecord_pisb_ep_abarouting_wire" ,newPaySubRecord ,"custrecord_pisb_ep_abarouting");
			}
			
			if (newPaySubRecord.getValue("custrecord_pisb_ep_imb_abaroutg_wire") > "") {
				set_abarouting("custrecord_pisb_ep_imb_abaroutg_wire" ,newPaySubRecord ,"custrecord_pisb_ep_imb_abarouting");
			} 
			// end ATP-1366

			// =====================================================================================
			// AFODOR - ATP-253 Add Import Record ID to Payment Instruction when importing from .csv
			// =====================================================================================
			var scriptFullName = "paymt_instr_submission_UE.js--->beforeSubmit";
			var importError;
			if (runtime.executionContext == 'CSVIMPORT') {
				var ImportId = newPaySubRecord.getValue({
					fieldId: 'custrecord_pisb_import_id'
				})

				if (!ImportId || ImportId == 0) {
					importError = error.create({
						name: 'IMPORT_ID_REQUIRED',
						message: 'When importing Payment Instructions via csv it is necessary to have an Import Record in the system and identify ' +
							' it by specifying the numeric ID of that import record using the Import Id field. (custrecord_pisb_import_id)',
						notifyOff: true
					});
					throw importError.name + ': ' + importError.message;
				} else {
					var objImportRecordFields = search.lookupFields({
						type: 'customrecord_import_record',
						id: ImportId,
						columns: ["internalid", "isinactive", "custrecord_imp_status"]
					});

					if (!objImportRecordFields.internalid) {
						importError = error.create({
							name: 'IMPORT_ID_INVALID',
							message: 'The import id specified in the csv file did not belong to an existing Import Record. ',
							notifyOff: true
						});
						throw importError.name + ': ' + importError.message;
					}

					if (objImportRecordFields.isinactive) {
						importError = error.create({
							name: 'IMPORT_RECORD_INACTIVE',
							message: 'The import id specified in the csv file belongs to an Import Record that is marked as inactive. ',
							notifyOff: true
						});
						throw importError.name + ': ' + importError.message;
					}

					if (objImportRecordFields.custrecord_imp_status[0].value == importSts.Completed) {
						importError = error.create({
							name: 'IMPORT_RECORD_INVALID_STATUS',
							message: 'The import id specified in the csv file did belongs to an Import Record whose status indicates it cannot be used for this import. ',
							notifyOff: true
						});
						throw importError.name + ': ' + importError.message;
					}

//					log.debug(scriptFullName, "ATP-253 Import record looks ok");
				}


			}
			// =====================================================================================
			// End ATP-253
			// =====================================================================================


			var submissionId = newPaySubRecord.id;
			var submissionStatus = parseInt(newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_submission_status'
			}), 10);
			// var submissionStatus = Number(exRecAlpha.getFieldValue(context,'custrecord_pisb_submission_status'));
			var requestedState = parseInt(newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_requested_state'
			}), 10);
			var sourceValue = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_source'
			});
			var createdBy = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_created_by'
			});
			var inactivatePI = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_inactivate_pi'
			});
			var changeExisting = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_changing_existing'
			});

			var updatingPaymtInstr = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_updating_paymt_instr'
			});
			var lastReviewActionByUser = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_rvw_last_action_by'
			});

			//--------------
			// support for SRS Tracking
			//--------------
			// Pay Agent
			var payagntConfirm = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_payagnt_confirm'
			});
			var payagntConfirmTS = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_payagnt_confirm_ts'
			});
			var payagntConfirmedBy = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_payagnt_confirmed_by'
			});
			var payagntCase = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_payagnt_case'
			});
			var hasOldPayagntConfirm = false;
			var oldPayagntConfirm = 0;
			try {
				oldPayagntConfirm = oldPaySubRecord.getValue({
					fieldId: 'custrecord_pisb_payagnt_confirm'
				});
				hasOldPayagntConfirm = true;

			} catch (e) {
				hasOldPayagntConfirm = false;
			}
			// Buyer			
			var buyerConfirm = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_buyer_confirm'
			});
			var buyerConfirmTS = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_buyer_confirm_ts'
			});
			var buyerConfirmedBy = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_buyer_confirmed_by'
			});
			var buyerCase = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_buyer_case'
			});
			var hasOldBuyerConfirm = false;
			var oldBuyerConfirm = 0;
			try {
				oldBuyerConfirm = oldPaySubRecord.getValue({
					fieldId: 'custrecord_pisb_buyer_confirm'
				});
				hasOldBuyerConfirm = true;

			} catch (e) {
				hasOldBuyerConfirm = false;
			}
			// Escrow
			var escrowConfirm = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_escrow_confirm'
			});
			var escrowConfirmTS = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_escrow_confirm_ts'
			});
			var escrowConfirmedBy = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_escrow_confirmed_by'
			});
			var escrowCase = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_escrow_case'
			});
			var hasOldEscrowConfirm = false;
			var oldEscrowConfirm = 0;
			try {
				oldEscrowConfirm = oldPaySubRecord.getValue({
					fieldId: 'custrecord_pisb_escrow_confirm'
				});
				hasOldEscrowConfirm = true;

			} catch (e) {
				hasOldEscrowConfirm = false;
			}

			// Bob P - PPE-55 Fields to support Medallion
			var medallionStatus = parseInt(newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_status'
			}), 10);
			if (!medallionStatus) {
				// initialize as not required if no incoming value
				medallionStatus = medSts.NotRequired;
			}
			var medallionReq = parseInt(newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_required'
			}), 10);
			var medallionNumber = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_number'
			});
			var medallionSignature = parseInt(newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_sigpresent'
			}), 10);
			var medallionReceivedTS = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_received_ts'
			});
			var medallionWaivedBy = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_waived_by'
			});
			var medallionWaivedTS = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_waived_ts'
			});
			var medallionRejectedBy = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_rejected_by'
			});
			var medallionRejectedTS = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_rejected_ts'
			});
			var medallionAcceptedBy = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_accepted_by'
			});
			var medallionAcceptedTS = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_med_accepted_ts'
			});
			try {
				oldMedallionStatus = parseInt(oldPaySubRecord.getValue({
					fieldId: 'custrecord_pisb_med_status'
				}), 10);
				if (!oldMedallionStatus) {
					oldMedallionStatus = 0;
				}
			} catch (e) {
				oldMedallionStatus = 0;
			}

			// (BobP 12/11) CAUTION: These are dual entry monitored fields.  If you add more DE monitored fields (they exist in Block 20 deFldList array)
			//    then you also need to add to the switch statement in block 20 that re-loads this var if a value reversion is triggered
			var paymtInstrType = newPaySubRecord.getValue({
				fieldId: 'custrecord_pisb_paymt_instr_type'
			});
			// var paymtInstrType = exRecAlpha.getFieldValue(context, 'custrecord_pisb_paymt_instr_type');

			var piDeal        = parseInt(newPaySubRecord.getValue({ fieldId:'custrecord_pisb_deal'			}), 10);
			var piExchange    = parseInt(newPaySubRecord.getValue({ fieldId:'custrecord_pisb_exchange'		}), 10);
			var paymentMethod = parseInt(newPaySubRecord.getValue({ fieldId:'custrecord_pisb_paymethod'		}), 10);
			var shareholder   =          newPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder'	});
			
			//--------------------------------------------------------------------------------------------------------
			// ATP-457 If Exchange Record has Credit Refund assigned do not allow creation of PI Submission
			var ShareholderStatusReadyForPayment = 6;
			if (piExchange > "") {
				if (context.type == context.UserEventType.CREATE) {
					var objExchangeRecordFields = search.lookupFields({type:'customrecord_acq_lot' ,id:piExchange
		                                                           ,columns: ["custrecord_acq_loth_related_trans" ,"isinactive" ,"custrecord_acq_loth_zzz_zzz_acqstatus" ,"custrecord_acq_loth_zzz_zzz_shrhldstat"]});			
				    if (objExchangeRecordFields.isinactive == true) { throw "ERROR: Exchange record is INACTIVE, PI Submission create is not allowed";}
				    if (   objExchangeRecordFields.custrecord_acq_loth_related_trans[0].value > "" 
				        && objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_acqstatus[0].value == exchgAcqSts.ApprovedForPayment 
				        && objExchangeRecordFields.custrecord_acq_loth_zzz_zzz_shrhldstat[0].value == ShareholderStatusReadyForPayment ) 
				       { throw "ERROR: Exchange record is already paid, Credit Memo exists, PI Submission create is not allowed";}
				}
			}
			// end ATP-457 
			//--------------------------------------------------------------------------------------------------------

			//SETTING DEFAULTS
			// ------------------------------------------------
			// 		10 - Data Defaults
			//
			// ------------------------------------------------

			// compute the payment method meta class of the payment method
			// PPE-198/199 Populate Payment Class and Payment Region based on Payment Method selected
			var paymentMethodClass = null;
			var paymentMethodRegion = null;
			var pmDetails = null;
			if (paymentMethod) {
				pmDetails = paymtInstrLight.getPaymentMethodDetails(paymentMethod);
				paymentMethodClass = pmDetails.payClass;
				paymentMethodRegion = pmDetails.payRegion;
			}

			//Ignore medallion if we are inactivating an existing payment instruction
			if (inactivatePI) {
				medallionReq = 2; // Y/N with No=2
				medallionStatus = medSts.NotRequired;
			}
			var mySource;
			if (context.type == context.UserEventType.CREATE) {

				if (runTimeCTX == 'CSVIMPORT') {
					submissionStatus = subSts.Validate;
					mySource = subSource.Import;

				} else if ((runTimeCTX == 'USERINTERFACE') || (runTimeCTX == 'USEREVENT')) {
					submissionStatus = subSts.DualEntry;
					mySource = subSource.PIUserInterface;
				} else {
					submissionStatus = subSts.Validate;
				}

				var sourceFields = ['custrecord_pisb_source', 'custrecord_pisb_original_source'];
				for (i = 0; i < sourceFields.length; i++) {
					newPaySubRecord.setValue({
						fieldId: sourceFields[i],
						value: mySource,
						ignoreFieldChange: true
					});
				}
			} else if (context.type == context.UserEventType.EDIT) {
				if (runTimeCTX == 'CSVIMPORT') {
					mySource = subSource.Import;
				} else if ((runTimeCTX == 'USERINTERFACE') || (runTimeCTX == 'USEREVENT')) {
					mySource = subSource.PIUserInterface;
				}
			}
			
			//===================================================================================================================================
			//===================================================================================================================================
			// ATP-537 valaidate that deal is valid if this is not coming from the UI
			//if ( (runTimeCTX != 'USERINTERFACE') && (context.type != context.UserEventType.DELETE) && (UserId == 1015772) ) {

//			if ( (runTimeCTX != 'USERINTERFACE') && (context.type != context.UserEventType.DELETE) ) {
//				var fieldList;
//				var InstructionType;
//				var idExchange;
//				var idDeal;
//				var idShareholder;
//				var objThisRecordFields;
//				log.debug("Deal Validation" ,"===== STARTING =================================================================================");
//				
//				if (context.type == context.UserEventType.XEDIT) { 
//		            objThisRecordFields = search.lookupFields({type:'customrecord_paymt_instr_submission' ,id:context.newRecord.id 
//                        ,columns: ["custrecord_pisb_exchange" ,"custrecord_pisb_deal" ,"custrecord_pisb_shareholder" ,"custrecord_pisb_paymt_instr_type" ]});
//					log.debug("Deal Validation - objThisRecordFields" ,JSON.stringify(objThisRecordFields));
//					fieldList = context.newRecord.getFields();
//					if (fieldList.indexOf('custrecord_pisb_paymt_instr_type') >= 0) { InstructionType = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_paymt_instr_type' }); }
//					else { 
//						var objInstructionType = objThisRecordFields.custrecord_pisb_paymt_instr_type; 
//						InstructionType = objInstructionType[0].value;
//					}
//				}
//				else { 
//					InstructionType = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_paymt_instr_type' });
//				}
//								
//				var INSTRUCTION_TYPE_ExchangeRecord      = 11;
//				var INSTRUCTION_TYPE_AcquiomDealSpecific = 10;
//				var INSTRUCTION_TYPE_SRSDeal             = 12;
//				
//				log.debug("Deal Validation -ExchangeRecord" ,"InstructionType: " + InstructionType);
//				if (InstructionType == INSTRUCTION_TYPE_ExchangeRecord) { // Instruction Type is exchange record, make sure deal and/or shareholder match that record
//					log.debug("Deal Validation -ExchangeRecord" ,"");
//					// Get values for Exchange record and Shareholder
//					if (context.type == context.UserEventType.XEDIT) { 
//						if ( (fieldList.indexOf('custrecord_pisb_exchange') >= 0) || (fieldList.indexOf('custrecord_pisb_shareholder') >= 0) ) { 
//							if (fieldList.indexOf('custrecord_pisb_exchange') >= 0) { idExchange = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_exchange' }); }
//							else { 
//								var objExchange = objThisRecordFields.custrecord_pisb_exchange;
//								idExchange = objExchange[0].value;
//								if (idExchange.toString()==""){idExchange=null} 
//								}
//							if (fieldList.indexOf('custrecord_pisb_shareholder') >= 0) { idShareholder = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }); }
//							else { 
//								objShareholder = objThisRecordFields.custrecord_pisb_shareholder; 
//							    var idShareholder = objShareholder[0].value;
//								if (idShareholder.toString()==""){idShareholder=null} }
//						}
//					}
//					else 
//						if (   (newPaySubRecord.getValue({ fieldId:'custrecord_pisb_exchange' })    != oldPaySubRecord.getValue({ fieldId:'custrecord_pisb_exchange'    }) )
//							|| (newPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }) != oldPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }) )  ) {
//							idExchange  = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_exchange' }); 
//							idShareholder   = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }); 
//						}
//					
//					if (idExchange) {
//			            var objExchangeFields = search.lookupFields({type:'customrecord_acq_lot' ,id:idExchange 
//	                        ,columns: ["isinactive" ,"custrecord_acq_loth_zzz_zzz_deal" ,"custrecord_acq_loth_zzz_zzz_shareholder" ]});
//						log.debug("Deal Validation - objExchangeFields" ,JSON.stringify(objExchangeFields));
//						
//						if (objExchangeFields.isinactive) {
//							newPaySubRecord.setValue({ fieldId:'custrecord_pisb_exchange' ,value:null });  log.debug("Deal Validation" ,"exchg set to null inactive");
//						}
//						
//						if (idShareholder) { 
//							if (objExchangeFields.custrecord_acq_loth_zzz_zzz_shareholder[0].value != idShareholder) {
//								newPaySubRecord.setValue({ fieldId:'custrecord_pisb_exchange' ,value:null }); log.debug("Deal Validation" ,"exchg set to null shrhldr");
//							}
//						}
//					}
//				}
//				else if (InstructionType == INSTRUCTION_TYPE_AcquiomDealSpecific || InstructionType == INSTRUCTION_TYPE_SRSDeal) {
//					// Get values for Shareholder and Deal
//					if (context.type == context.UserEventType.XEDIT) { 
//						if ( (fieldList.indexOf('custrecord_pisb_deal') >= 0) || (fieldList.indexOf('custrecord_pisb_shareholder') >= 0) ) { 
//							if (fieldList.indexOf('custrecord_pisb_deal') >= 0) { idDeal = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_deal' }); }
//							else { 
//								var objDeal = objThisRecordFields.custrecord_pisb_deal;
//								idDeal = objDeal[0].value;
//								if (idDeal.toString()=="") {idDeal=null} 
//								}
//							if (fieldList.indexOf('custrecord_pisb_shareholder') >= 0) { idShareholder = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }); }
//							else { 
//								var objShareholder = objThisRecordFields.custrecord_pisb_shareholder;
//								idShareholder = objShareholder[0].value;  
//								if (idShareholder.toString()==""){idShareholder=null} 
//							}
//						}
//					}
//					else  
//						if (   (newPaySubRecord.getValue({ fieldId:'custrecord_pisb_deal' })        != oldPaySubRecord.getValue({ fieldId:'custrecord_pisb_deal' })        ) 
//							|| (newPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }) != oldPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }) )  ) {
//							idDeal          = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_deal' }); 
//							idShareholder   = newPaySubRecord.getValue({ fieldId:'custrecord_pisb_shareholder' }); 
//						}
//					
//					log.debug("Deal Validation" ,"idShareholder:" + idShareholder + ",    idDeal:" + idDeal );
//
//					if (idShareholder && idDeal) { // There is both a shareholder and a deal, search to make sure a matching exchange rcd exists
//		            	var arrColumns        = new Array();
//		            	var col_id            = search.createColumn({ name:'isinactive'  });
//		            	arrColumns.push(col_id);
//		            	var arrFilters = [        ['isinactive' ,'IS' ,false]
//  	                                      ,'AND' ,['custrecord_acq_loth_zzz_zzz_deal'        ,'ANYOF' ,idDeal ]
//  	                                      ,'AND' ,['custrecord_acq_loth_zzz_zzz_shareholder' ,'ANYOF' ,idShareholder ]
//		                                 ];
//		        		var searchExchangeRcdObj = search.create({    'type':'customrecord_acq_lot'
//		        		                                          ,'filters':arrFilters 
//		                                                          ,'columns':arrColumns 	       });
//		        		var searchExchangeRcd = searchExchangeRcdObj.run();
//		                var searchExchangeRcdResults = searchExchangeRcd.getRange(0,1000); 
//		            	log.debug("Deal Validation", "searchExchangeRcd.length: " +  searchExchangeRcdResults.length);
//		            	// If results are empty set deal to null
//		            	if (searchExchangeRcdResults.length == 0) { 
//							newPaySubRecord.setValue({ fieldId:'custrecord_pisb_deal' ,value:null }); log.debug("Deal Validation" ,"deal set to null ");
//		            	}
//					}
//				} // else if (InstructionType == INSTRUCTION_TYPE_AcquiomDealSpecific || InstructionType == INSTRUCTION_TYPE_SRSDeal)
//			}
			// end ATP-537
			//===================================================================================================================================

			// ------------------------------------------------
			// 		20 - Dual Entry Field Change Detection
			//
			// ------------------------------------------------

			var deFldList = ["paymt_instr_type", "shareholder", "deal", "exchange", "paymethod",
				'ep_abarouting_in', 'ep_achaccttype', 'ep_addlinst', 'ep_bankname_in', 'ep_ffcname', 'ep_ffcacctnum', 'ep_swiftbic_in',
				'ep_bankacctnum', 'ep_bankaddr', 'ep_bankcity', 'ep_bankstate', 'ep_bankpostal', 'ep_iban_in', 'ep_iban_sortcode', 'ep_nameonbnkacct',
				'ep_bankcontact', 'ep_bankphone', 'ep_bankcountryname',
				"chk_payto", "chk_mailto", "chk_addr1", "chk_addr2", "chk_addr3", "chk_city", "chk_comment", "chk_state", "chk_zip",
				"chk_country", 'ep_imb_abarouting_in', 'ep_imb_swiftbic_in', 'ep_imb_bankname_in', 'ep_imb_use_bankname_in', 'ep_imb_nameonbnkacct',
				'ep_imb_bankacctnum', 'ep_abarouting', 'ep_swiftbic', 'ep_iban', 'ep_bankname', 'ep_bankcountry', 'ep_imb_abarouting', 'ep_imb_swiftbic', 'ep_imb_bankname'
			];

			var argJSON;
			var oldVal;
			var newVal;
			var deFieldsWithInputValues = [];
			var dflt_fld_list = "";
			var updateDualEntryBy = false;
			var valueChanged = false;
			var oldType;
			var newType;
			var canSet = false;
			var undefinedCnt = 0;
			var nullCnt = 0;
			var undefinedList = '';
			var nullList = '';
			var revertCnt = 0;
			var revertFailCnt = 0;
			var thisArgJSON;



			if (inactivatePI) {
				// do not bother looking for dual entry field changes if we are trying to inactivate a payment instruction
				if (runTimeCTX == 'USERINTERFACE' && submissionStatus == subSts.DualEntry) {
					// however, if we are editing in UI and the inactivate checkbox is ON, then do record/update the dual entry user
					updateDualEntryBy = true;
				}
			} else {

				for (i = 0; i < deFldList.length; i++) {
					try {
						argJSON = '{ "fieldId": "custrecord_pisb_' + deFldList[i] + '"}';
						thisArgJSON = JSON.parse(argJSON);

						if (context.type == context.UserEventType.CREATE) {

							// For a record CREATE by import or script, capture any non-blank values as incoming defaults
							// This will facilitate partial dual entry so that we know which values were initially
							//    populated as incoming defaults

							if (runTimeCTX == 'CSVIMPORT' || runTimeCTX == 'USERINTERFACE') { // this row is the real, correct row
								// intentionally excluding USERINTERFACE - we only want script generated or imported values
								//  to trigger adding the field name to the incoming field list
								newVal = newPaySubRecord.getValue(thisArgJSON); // only call the API to extract if all conditions are true
								// TODO: below would need enhancement if a field to be entered by user is checkbox with value FALSE

								if (newVal) {
									// since this is a non-blank value, include it in the list of incoming defaults
									deFieldsWithInputValues.push(deFldList[i]);
									if (runTimeCTX == 'USERINTERFACE') {
										// set this field if some DE fields were set in the UI with non-blank values
										updateDualEntryBy = true;
									}
								}
							}

						} else if (context.type == context.UserEventType.EDIT && (runTimeCTX == 'USERINTERFACE' || runTimeCTX == 'CSVIMPORT')) { //PPE-177 - to allow import edits
							// compare old and new values to determine if any dual entry fields
							// had their values changed
							newVal = newPaySubRecord.getValue(thisArgJSON);
							newType = typeof(newVal);
							oldVal = oldPaySubRecord.getValue(thisArgJSON);
							oldType = typeof(oldVal);

							valueChanged = false;
							if (newType === 'undefined' || oldType === 'undefined') {
								undefinedCnt = undefinedCnt + 1;
								undefinedList = undefinedList + deFldList[i] + ', ';
							} else if (newType === null || oldType === null) {
								nullCnt = nullCnt + 1;
								nullList = nullList + deFldList[i] + ', ';
							} else {
								// any var that is falsy on (var) should be 0 or false
								//  at this point instead of undefined or null
								if (oldVal && newVal) {
									// both have truthy values
									if (oldVal != newVal) {
										// the value has changed
										valueChanged = true;
									}
								} else if (oldVal && !newVal) {
									// the field has been emptied or blanked out
									valueChanged = true;
								} else if (!oldVal && newVal) {
									// the previously empty field now has a value
									valueChanged = true;
								}
								// both falsy means no value change
							}

							if (valueChanged) {
								if (submissionStatus == subSts.DualEntry) {
									// handle that we are changing a dual entry field
									updateDualEntryBy = true;

									// TODO: remove this field from defaults list
								} else {
									// for any other status, DENY the ability to change any of these fields
									// If the field type is string, number or boolean then the value of the field before it was changed is inserted 
									// into argJSON which will eventually be used to update the record - effectively undoing the change to the field value
									canSet = false;
									argJSON = '{ "fieldId": "custrecord_pisb_' + deFldList[i] + '", "value": ';

									if (oldType === "string") {
										// TODO: need to JSON escape the oldVal in case it leads to malformed JSON                                        
										argJSON = argJSON + '"' + oldVal + '", ';
										canSet = true;
									} else if (oldType === "number") {
										argJSON = argJSON + " " + oldVal + ", ";
										canSet = true;
									} else if (oldType === "boolean") {
										if (oldVal) {
											argJSON = argJSON + " true, ";
										} else {
											argJSON = argJSON + " false, ";
										}
										canSet = true;
									}

									if (canSet) {
										argJSON += '"ignoreFieldChange": true }';

										try {
											// This next statement reverts the value to old value
											newPaySubRecord.setValue(JSON.parse(argJSON));
											revertCnt += 1;

											// any reverted fields that were previously extracted in code block 05 need to be re-retrieved after reversion
											//  for these dual entry monitored fields
											switch (deFldList[i]) {
												case "paymt_instr_type":
													paymtInstrType = newPaySubRecord.getValue({
														fieldId: 'custrecord_pisb_paymt_instr_type'
													});
													break;
												case "shareholder":
													shareholder = newPaySubRecord.getValue({
														fieldId: 'custrecord_pisb_shareholder'
													});
													break;
												case "deal":
													piDeal = parseInt(newPaySubRecord.getValue({
														fieldId: 'custrecord_pisb_deal'
													}), 10);
													break;
												case "exchange":
													piExchange = parseInt(newPaySubRecord.getValue({
														fieldId: 'custrecord_pisb_exchange'
													}), 10);
													break;
												case "paymethod":
													paymentMethod = parseInt(newPaySubRecord.getValue({
														fieldId: 'custrecord_pisb_paymethod'
													}), 10);
													pmDetails = paymtInstrLight.getPaymentMethodDetails(paymentMethod);
													paymentMethodClass = pmDetails.payClass;
													paymentMethodRegion = pmDetails.payRegion;
													break;
											}
										} catch (e) {
											log.error('Cannot revert dual entry field ' + deFldList[i], 'Failed to revert value of changed dual entry field (' + deFldList[i] + '/' + oldType + ') to prior value of (' + oldVal + '): ' + e.message + '  argJSON=' + argJSON);
											revertFailCnt += 1;
										}
									}
								}
							}
						}
					} catch (e) {
						log.error('Error checking dual entry field for changes: ' + deFldList[i], e.message + '#' + e.lineNumber);
					}
				}
			}
			// if we found anything, then make a string we can store in the submission record field
			if (deFieldsWithInputValues.length > 0) {
				dflt_fld_list = JSON.stringify(deFieldsWithInputValues);
				newPaySubRecord.setValue({
					fieldId: 'custrecord_pisb_dflt_fld_list',
					value: dflt_fld_list
				});
			}
			if (updateDualEntryBy) {
				newPaySubRecord.setValue({
					fieldId: 'custrecord_pisb_de_by',
					value: runtime.getCurrentUser().id,
					ignoreFieldChange: true
				});
			}
			if (undefinedCnt > 0) {
				// log.debug('Some Dual Entry Change Detection Fields were undefined (check deFldList for typos): ' + undefinedList);
			}
			if (nullCnt > 0) {
				// log.debug('Some Dual Entry Change Detection Fields were js null: ' + nullList);
			}
			if (revertCnt + revertFailCnt !== 0) {
				statusErrSummary += 'Disallowed edits of dual entry fields; ';
				if (revertCnt > 0) {
					errorDetail += '[' + revertCnt + '] dual entry fields reverted back to original values -- use Allow Edits to return to Dual Entry status.';
				}
				if (revertFailCnt > 0) {
					errorDetail += 'Unable to revert [' + revertFailCnt + '] dual entry fields back to original values -- see execution log for details.  Edit fields only while in Dual Entry status.';
				}

			}


			// ------------------------------------------------
			// 		30 - SRS Tracking Fields
			//
			// ------------------------------------------------	
			if (hasOldPayagntConfirm) {
				if (payagntConfirm) {
					//a non-blank value (1 = Yes, 2 = No)
					if (!oldPayagntConfirm || (oldPayagntConfirm && oldPayagntConfirm != payagntConfirm)) {
						payagntConfirmTS = alphaRecord.getCurrentDateTime();
						payagntConfirmedBy = runtime.getCurrentUser().id;
					}
				} else {
					//We are editing an existing record and the Y/N field is blank
					payagntConfirmTS = null;
					payagntConfirmedBy = null;
					payagntCase = null;
				}
			} else if (payagntConfirm) {
				//this is an unsaved record CREATE, so populate these if Y/N field has some non-blank value
				payagntConfirmTS = alphaRecord.getCurrentDateTime();
				payagntConfirmedBy = runtime.getCurrentUser().id;
			}
			// Buyer
			if (hasOldBuyerConfirm) {
				if (buyerConfirm) {
					//a non-blank value (1 = Yes, 2 = No)
					if (!oldBuyerConfirm || (oldBuyerConfirm && oldBuyerConfirm != buyerConfirm)) {
						buyerConfirmTS = alphaRecord.getCurrentDateTime();
						buyerConfirmedBy = runtime.getCurrentUser().id;
					}
				} else {
					//We are editing an existing record and the Y/N field is blank
					buyerConfirmTS = null;
					buyerConfirmedBy = null;
					buyerCase = null;
				}
			} else if (buyerConfirm) {
				//this is an unsaved record CREATE, so populate these if Y/N field has some non-blank value
				buyerConfirmTS = alphaRecord.getCurrentDateTime();
				buyerConfirmedBy = runtime.getCurrentUser().id;
			}
			// Escrow Agent
			if (hasOldEscrowConfirm) {
				if (escrowConfirm) {
					//a non-blank value (1 = Yes, 2 = No)
					if (!oldEscrowConfirm || (oldEscrowConfirm && oldEscrowConfirm != escrowConfirm)) {
						escrowConfirmTS = alphaRecord.getCurrentDateTime();
						escrowConfirmedBy = runtime.getCurrentUser().id;
					}
				} else {
					//We are editing an existing record and the Y/N field is blank
					escrowConfirmTS = null;
					escrowConfirmedBy = null;
					escrowCase = null;
				}
			} else if (escrowConfirm) {
				//this is an unsaved record CREATE, so populate these if Y/N field has some non-blank value
				escrowConfirmTS = alphaRecord.getCurrentDateTime();
				escrowConfirmedBy = runtime.getCurrentUser().id;
			}


			// ------------------------------------------------
			// 		40 - Medallion Rules (PPE-55)
			//
			//
			// ------------------------------------------------		
			if (!medallionStatus) {
				// if we have no value for this field, initialize to Not Required
				medallionStatus = medSts.NotRequired;
			}
			var wipeMedExceptionTS = false;
			var wipeAcceptanceFields = false;
			var medStatusChanged = false;
			if (medallionStatus != oldMedallionStatus) {
				medStatusChanged = true;
			}

			// Set flags according to value tests
			var validMedallionNumber = false;
			var validMedallion = false;
			var nonStandardMedallionNumber = false;
			var validMedallionSignature = false;
			if (medallionSignature) {
				if (medallionSignature == 1) {
					validMedallionSignature = true;
				}
			}
			if (medallionNumber) {
				// we have some value, so test its quality
				medallionNumber = medallionNumber.toUpperCase();
				validMedallionNumber = isValidMedallionNumber(medallionNumber);
				nonStandardMedallionNumber = isNonStandardMedallionNumber(medallionNumber);
				if (validMedallionNumber && validMedallionSignature) {
					validMedallion = true;
				}
			} else {
				if (validMedallionSignature) {
					// if the medallion number is blank, it makes no sense to indicate Yes for Mediallion Signature
					validMedallionSignature = false;
					medallionSignature = null;
				}
			}

			// Automatically move to medallion review?
			if (validMedallion && medallionStatus == medSts.Pending) {
				medallionStatus = medSts.Review;
				medStatusChanged = true;
			}

			switch (medallionStatus) {
				case medSts.NotRequired:
					medallionReq = 2; // No
					wipeMedExceptionTS = true;
					wipeAcceptanceFields = true;
					medallionReceivedTS = null;
					break;
				case medSts.Pending:
					medallionReq = 1; // Yes
					wipeMedExceptionTS = true;
					wipeAcceptanceFields = true;
					medallionReceivedTS = null;
					break;
				case medSts.Review:
					medallionReq = 1; // Yes
					wipeAcceptanceFields = true;
					wipeMedExceptionTS = true;
					if (medallionReceivedTS) {} else {}
					if (medallionNumber) {
						if (medStatusChanged && !medallionReceivedTS) {
							medallionReceivedTS = alphaRecord.getCurrentDateTime();
						}
					} else {
						medallionReceivedTS = null;
					}

					if (!validMedallion) {
						// force back to review status
						if (!medallionNumber) {
							statusErrSummary += 'Medallion Number Missing; ';
							errorDetail += 'Medallion Number is missing; ';
						} else {
							// statusErrSummary += 'Medallion Number Invalid; '; // ATP-136
							statusErrSummary += 'Error in Medallion section; '; //ATP-136

							if (validMedallionNumber && !validMedallionSignature) {
								errorDetail += 'Medallion Signature Present is not Yes; ';
							} else if (!validMedallionNumber && validMedallionSignature) {
								errorDetail += 'Medallion Number is not valid; ';
							} else if (!validMedallionNumber && !validMedallionSignature) {
								errorDetail += 'Medallion Number is not valid and Signature Present is not Yes; ';
							}
						}
					}
					break;
				case medSts.Accepted:
					medallionReq = 1; // Yes
					wipeMedExceptionTS = true;
					if (medallionNumber) {
						if (medStatusChanged && !medallionReceivedTS) {
							medallionReceivedTS = alphaRecord.getCurrentDateTime();
						}
					} else {
						medallionReceivedTS = null;
					}

					if (!validMedallion) {
						// force back to review status
						medallionStatus = medSts.Review;
						if (!medallionNumber) {
							statusErrSummary += 'Medallion Number Missing; ';
							errorDetail += 'Medallion cannot be Accepted because Medallion Number is missing; ';
						} else {
							// statusErrSummary += 'Medallion Number Invalid; '; //ATP-136
							statusErrSummary += 'Error in Medallion section; '; //ATP-136
							if (validMedallionNumber && !validMedallionSignature) {
								errorDetail += 'Medallion cannot be Accepted because Medallion Signature Present is not Yes; ';
							} else if (!validMedallionNumber && validMedallionSignature) {
								errorDetail += 'Medallion cannot be Accepted because Medallion Number is not valid; ';
							} else if (!validMedallionNumber && !validMedallionSignature) {
								errorDetail += 'Medallion cannot be Accepted because Medallion Number is not valid and Signature Present is not Yes; ';
							}
						}
					} else {
						// this is a valid medallion (PPE-166)
						if (medStatusChanged) {
							medallionAcceptedBy = runtime.getCurrentUser().id;
							medallionAcceptedTS = alphaRecord.getCurrentDateTime();
						}
						wipeMedExceptionTS = true;
					}
					break;
				case medSts.Waived:
					medallionReq = 2; // No
					if (medStatusChanged) {
						medallionWaivedBy = runtime.getCurrentUser().id;
						medallionWaivedTS = alphaRecord.getCurrentDateTime();
					}
					medallionRejectedBy = null;
					medallionRejectedTS = null;
					wipeAcceptanceFields = true;
					medallionReceivedTS = null;
					break;
				case medSts.Rejected:
					medallionReq = 1; // Yes
					if (medStatusChanged) {
						medallionRejectedBy = runtime.getCurrentUser().id;
						medallionRejectedTS = alphaRecord.getCurrentDateTime();
					}
					medallionWaivedBy = null;
					medallionWaivedTS = null;
					wipeAcceptanceFields = true;
					medallionReceivedTS = null;
					break;
				default:
					// null;
			}
			if (wipeMedExceptionTS) {
				medallionWaivedBy = null;
				medallionWaivedTS = null;
				medallionRejectedBy = null;
				medallionRejectedTS = null;
			}
			if (wipeAcceptanceFields) {
				medallionAcceptedBy = null;
				medallionAcceptedTS = null;
			}

			// ------------------------------------------------
			// 		50 - Test for Errors (Required Fields)
			//
			// Check if the Payment Instruction Type is valid
			//
			// ------------------------------------------------
			// NOTE: (BobP 12/11) - some vars used in block 50 are hoisted to top for earlier code block use
			var piTypeValid = true;
			var payToValid = true;

			// check that PI Type is populated and SH is populated - otherwise, set piTypeValid = false
			// Note: We let NetSuite itself throw an error for Record level required fields: 
			//		pisb_paymt_instr_type, pisb_shareholder, pisb_submission_status
			// but this is additional check for edge cases
			if (paymtInstrType == '' || shareholder == '') {
				piTypeValid = false;
			}

			// If Deal Type but not value selected for Deal ID, then register an error
			if ((paymtInstrType == piType.AcquiomDeal || paymtInstrType == piType.SRSDeal) && (!piDeal)) {
				piTypeValid = false;
				errorDetail = errorDetail + 'Deal-type Payment Instruction specified, but no Deal yet selected; ';
			}
			// TODO: potentially validate deeper that populated DealID is a deal type in customer

			// If Exchange Type but not value selected for Exchange ID, then register an error
			if (paymtInstrType == piType.ExchangeRecord && (!piExchange)) {
				piTypeValid = false;
				errorDetail = errorDetail + 'Exchange-type Payment Instruction specified, but no Exchange Record yet selected; ';
			}
			// TODO: potentially validate deeper that populated ExchangeID is one that is also associated with this shareholder

			// Alternate value should be blank/null
			if (paymtInstrType == piType.Default && (piDeal || piExchange)) {
				piTypeValid = false;
				errorDetail = errorDetail + 'Default Payment Instruction specified, but Deal or Exchange ID is selected; ';
			} else if ((paymtInstrType == piType.AcquiomDeal || paymtInstrType == piType.SRSDeal) && (piExchange)) {
				piTypeValid = false;
				errorDetail = errorDetail + 'Deal Type Payment Instruction specified, but Exchange ID is selected; ';
			} else if (paymtInstrType == piType.ExchangeRecord && (piDeal)) {
				piTypeValid = false;
				errorDetail = errorDetail + 'Exchange Record Payment Instruction specified, but Deal ID is selected; ';
			}

			// Are there any other open (e.g. not Canceled or Promoted) Paymt Instr Submissions that point to these same
			// criteria? If so, block transitions and let the user know. (ATP-27)
			//<ATP-856>
			if (!inactivatePI && context.type != context.UserEventType.XEDIT){
			//</ATP-856>
				var searchPayInstrSubResult = paymtInstrLight.searchIdenticalPaymtInstrSubmissions({
					shareholder: shareholder,
					paymtInstrType: paymtInstrType,
					deal: piDeal,
					exchangeRecord: piExchange
				});
				var identicalSubmissions = [];
				for (var i = 0; i < searchPayInstrSubResult.length; i++) {
					var subId = searchPayInstrSubResult[i].getValue({
						name: 'internalid'
					});
					if (subId != submissionId) {
						identicalSubmissions.push(subId);
					}
				}
				if (identicalSubmissions.length > 0) {
					if (requestedState == subSts.DECompare || requestedState == subSts.Approved) {
						requestedState = 0; // deny these requested transitions
					}
					statusErrSummary += 'Multiple open PI Submissions exist pointing to these criteria ' +
						' (Paymt Instr Type / Shareholder / Deal / Exchange Record); ';
					errorDetail += 'The following open PI Submissions point to the same criteria as this Submission: [' +
						identicalSubmissions + ']. Please ensure only one open PI Submission exists for this criteria.' +
						' (Paymt Instr Type / Shareholder / Deal / Exchange Record); ';
				}
			}
			
				if (inactivatePI) { // PPE-64: Bypass enforced logic to require paymentMethod
					var dummyValue = 'inactivate';
					paymentMethod = dummyValue;
					paymentMethodClass = dummyValue;
				}



			// Set error summary based on all tests and determine disposition if errors
			if (runTimeCTX == 'CSVIMPORT') {
				// these errors are very serious for Import Create or Update
				if (!piTypeValid) {
					requestedState = subSts.Failed;
					submissionStatus = subSts.Failed;
					statusErrSummary = statusErrSummary + 'Invalid Payment Instruction Type; ';
				}
				if (!paymentMethod) {
					requestedState = subSts.Failed;
					submissionStatus = subSts.Failed;
					statusErrSummary = statusErrSummary + 'Payment Method is Required; ';
					errorDetail = errorDetail + 'Import must include valid Payment Method selection; ';
				}
			} else {
				if (!piTypeValid) {
					statusErrSummary = statusErrSummary + 'Invalid Payment Instruction Type; ';
					if (requestedState == subSts.DECompare || requestedState == subSts.Approved) {
						requestedState = 0; // deny these requested transitions
					}
				}

				if ((requestedState == subSts.Review || requestedState == subSts.Approved) && !inactivatePI) {
					var validationResult = validatePayMethodMandatoryFields(context, paymentMethod, recordFields, thisRecord);
					if (!validationResult.success) {
						requestedState = 0; // deny these requested transitions
						statusErrSummary += validationResult.statusErrSummary;
						errorDetail += validationResult.errorDetail;
					}

					var ePayValidationMessage = newPaySubRecord.getValue({
						fieldId: 'custrecord_pisb_ep_validation_msg'
					});
					var ePayValidationSummary = ePayValidationMessage.split(';')[0];
					if (ePayValidationMessage) {
						requestedState = 0;
						statusErrSummary += ePayValidationSummary + '; ';
						errorDetail += ePayValidationMessage + '; ';
					}

					var intMedValidationMessage = newPaySubRecord.getValue({
						fieldId: 'custrecord_pisb_ep_imb_validation_msg'
					});
					var intMedValidationSummary = intMedValidationMessage.split(';')[0];
					if (intMedValidationMessage) {
						requestedState = 0;
						statusErrSummary += 'Foreign Wire Intermediary: ' + intMedValidationSummary + '; ';
						errorDetail += 'Foreign Wire Intermediary: ' + intMedValidationMessage + '; ';
					}
				}
			}

			if (inactivatePI && !updatingPaymtInstr) {
				requestedState = 0; // deny the requested transition
				inactivatePI = false;
				statusErrSummary = statusErrSummary + 'No existing payment found to Deactivate; ';
				errorDetail = errorDetail + 'Payment Instruction must exist in order to deactivate it. ' +
					'Inactivate has been unchecked; ';
			}

			// 60 Populate Pointer to Existing PI
			// PPE-281: This is also handled in the PI Submission client script.
			// *************************** <ATP-950> ***********************
			if ( !inactivatePI && context.type != context.UserEventType.XEDIT){	// DONT DO THIS IF WE'RE INACTIVATING
			// *************************** </ATP-950> ***********************
				if (piTypeValid) {
					var searchPayInstrResult = paymtInstrLight.searchIdenticalPaymentInstructions({
						shareholder: shareholder,
						paymtInstrType: paymtInstrType,
						deal: piDeal,
						exchangeRecord: piExchange
					});
					if (searchPayInstrResult.length > 1) { // there are multiple PI that fit this criteria (unlikely)
						// if >1, then add error message to existing fields. "More than one PI matching this submission type. Please cancel this submission and ..."
						// list IDs of dupes in detail
						requestedState = 0; // deny the requested transition
						var multiplePI = '';
						for (i = 0; i < searchPayInstrResult.length; i++) {
							multiplePI += searchPayInstrResult[0].getValue({
								name: 'internalid'
							}) + ', ';
						}
						multiplePIFinal = multiplePI.substring(0, multiplePI.length - 2);
						statusErrSummary = statusErrSummary + 'More than one PI matching this submission type; ';
						errorDetail = errorDetail + 'More than one PI matching this submission type: [' + multiplePIFinal +
							']. Please cancel this submission and ensure that only one PI exists for this submission; ';
					}
				}
			}

			// 90 MANAGE THE SUBMISSION STATUS
//			log.debug('BeforeSubmit Section 90', 'piTypeValid: ' + piTypeValid);
//			log.debug('BeforeSubmit Section 90', 'requestedState: ' + requestedState);
//			log.debug('BeforeSubmit Section 90', 'submissionStatus: ' + submissionStatus);
			var oldSubmissionStatus = submissionStatus;
			var lastAction = '';
			var lastReviewActionByUser = '';

			if (!piTypeValid && (requestedState == subSts.Approved || requestedState == subSts.DECompare)) {
				requestedState = 0; // deny the requested transition
				statusErrSummary += "Submission Type is Invalid; ";
				errorDetail += "Submission Type is Not Valid and a status change was requested to Approve or DECompare." +
					" Provide a valid submission type before approval or sending for dual-entry comparison.; ";
			}
//			log.debug('BeforeSubmit Section 90', 'line 1074');
			// PPE-102 - DE1 user that last updated PI Submission cannot Force Approve own record
			if (piTypeValid && submissionStatus == subSts.Review && requestedState == subSts.Approved) {
//				log.debug('BeforeSubmit Section 90', 'line 1077');
				// grab current value of this field as it might have changed in logic above
				var deUserId = parseInt(newPaySubRecord.getValue({
					fieldId: 'custrecord_pisb_de_by'
				}), 10);
//				log.debug('BeforeSubmit Section 90', 'deUserId: ' + deUserId);
//				log.debug('BeforeSubmit Section 90', 'CurrentUser().id: ' + runtime.getCurrentUser().id);
				if (runtime.getCurrentUser().id == deUserId) {
					var deBlockApproval = true;
//					log.debug('BeforeSubmit Section 90', 'Environment: ' + runtime.envType);

					if (runtime.envType == 'SANDBOX') {
						var lastReviewComment = newPaySubRecord.getValue({
							fieldId: 'custrecord_pisb_rvw_last_comment'
						});
						log.debug('BeforeSubmit Section 90', 'lastReviewComment: ' + lastReviewComment);
						var paymtInstrComment = newPaySubRecord.getValue({
							fieldId: 'custrecord_pisb_pi_comment'
						});
						log.debug('BeforeSubmit Section 90', 'paymtInstrComment: ' + paymtInstrComment);

						if (lastReviewComment == 'FORCEAPPROVE' || paymtInstrComment == 'FORCEAPPROVE') {
							deBlockApproval = false;
							statusErrSummary += "BY-PASSED(Dual Entry User cannot approve submission); ";
						}
					}
					if (deBlockApproval) {
						// disallow this user from performing this state change to Approved
						requestedState = 0;
						statusErrSummary += "Dual Entry User cannot approve submission; ";
						errorDetail += "Current User [" + runtime.getCurrentUser().name + "] is also listed as the most recent Dual Entry By user; ";
					}
				}
			}

			submissionStatus = check_submission_status(submissionStatus, requestedState);
			if (oldSubmissionStatus == subSts.Review) {
				lastReviewActionByUser = runtime.getCurrentUser().id;
				var employeeRecordSystem = 1647017;
				if (lastReviewActionByUser < 1) { lastReviewActionByUser = employeeRecordSystem; }
			}

			if (oldSubmissionStatus != submissionStatus) {
				// update timestamp whenever Submission Status changes
				newPaySubRecord.setValue({
					fieldId: 'custrecord_pisb_status_ts',
					value: alphaRecord.getCurrentDateTime()
				});

				if (oldSubmissionStatus == subSts.Review) {
					switch (submissionStatus) {
						case subSts.DualEntry:
							lastAction = 'Allow Edits';
							break;
						case subSts.Approved:
							lastAction = 'Force Approve';
							break;
						case subSts.Canceled:
							lastAction = 'Canceled';
							break;
					}
				}
			}
			requestedState = '';

			// 100 MANAGE PROMOTION OF PAY SUBMISSION TO PAY INFORMATION
			if ((submissionStatus == subSts.Approved) && ((medallionStatus == medSts.NotRequired) || (medallionStatus == medSts.Accepted) || (medallionStatus == medSts.Waived))) {
				submissionStatus = subSts.Promoting;
			}

			//---------------------------------------------------------
			//
			// 199 - Push Values back into NetSuite Record Object
			//
			//---------------------------------------------------------
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_source',
				value: subSource.PIUserInterface
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_status_err_summary',
				value: statusErrSummary,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_error_detail',
				value: errorDetail,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_submission_status',
				value: submissionStatus,
				ignoreFieldChange: true
			});
			//SET THE VALUE OF THE REQUESTED STATE
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_requested_state',
				value: requestedState,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_rvw_last_action',
				value: lastAction,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_rvw_last_action_by',
				value: lastReviewActionByUser,
				ignoreFieldChange: true
			});

			// SRS Tracking field updates
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_payagnt_confirm_ts',
				value: payagntConfirmTS,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_payagnt_confirmed_by',
				value: payagntConfirmedBy,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_payagnt_case',
				value: payagntCase,
				ignoreFieldChange: true
			});
			// Buyer
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_buyer_confirm_ts',
				value: buyerConfirmTS,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_buyer_confirmed_by',
				value: buyerConfirmedBy,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_buyer_case',
				value: buyerCase,
				ignoreFieldChange: true
			});
			// Escrow
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_escrow_confirm_ts',
				value: escrowConfirmTS,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_escrow_confirmed_by',
				value: escrowConfirmedBy,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_escrow_case',
				value: escrowCase,
				ignoreFieldChange: true
			});

			// Mediallion fields
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_status',
				value: medallionStatus,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_required',
				value: medallionReq,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_number',
				value: medallionNumber,
				ignoreFieldChange: true
			});

			if (medallionSignature && (medallionSignature == 1 || medallionSignature == 2)) {
				newPaySubRecord.setValue({
					fieldId: 'custrecord_pisb_med_sigpresent',
					value: medallionSignature,
					ignoreFieldChange: true
				});
			} else {
				newPaySubRecord.setValue({
					fieldId: 'custrecord_pisb_med_sigpresent',
					value: '',
					ignoreFieldChange: true
				});
			}
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_received_ts',
				value: medallionReceivedTS,
				ignoreFieldChange: true
			});

			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_waived_by',
				value: medallionWaivedBy,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_waived_ts',
				value: medallionWaivedTS,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_rejected_by',
				value: medallionRejectedBy,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_rejected_ts',
				value: medallionRejectedTS,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_accepted_by',
				value: medallionAcceptedBy,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_med_accepted_ts',
				value: medallionAcceptedTS,
				ignoreFieldChange: true
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_inactivate_pi',
				value: inactivatePI, //PPE-238 inactivateBoxValue,
				ignoreFieldChange: true
			});
			// Payment Method fields
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_payclass',
				value: paymentMethodClass
			});
			newPaySubRecord.setValue({
				fieldId: 'custrecord_pisb_payment_region',
				value: paymentMethodRegion
			});
			// var didPromotion = false; //This variable is never referenced




			// TODO: add to Scott's workflow? - locked by 'Lock canceled PI Submission' workflow when submissionStatus = Promoted	OR Canceled

			function blankOutField(fieldId) {
				newPaySubRecord.setValue({
					fieldId: fieldId,
					value: '',
					ignoreFieldChange: true
				});
			}

			function isValidMedallionNumber(medallionNumber) {
				// accept as valid when starts with valid letter and followed by 7 numeric digits AND may have additional values after this
				var re = /^(A|B|C|D|E|F|X|Y|Z)\d{7}.{0,30}/gi;
				//var re = new RegExp('\\d{3}','g');
				if (medallionNumber && typeof(medallionNumber) == 'string') {
					if (medallionNumber.match(re)) {
						return true;
					}
				}
				return false;
			}

			function isNonStandardMedallionNumber(medallionNumber) {
				// accept as valid when starts with valid letter and followed by 7 numeric digits AND may have additional values after this	
				// Stardard is considered to be 8 char in length only and start with valid letter end with 7 numeric digits
				// NOTE: This will return FALSE if the input is not at all a valid mediallion number
				//         so this method MUST be used in combination with isValidMedallionNumber
				var re = /^(A|B|C|D|E|F|X|Y|Z)\d{7}.{0,30}/gi;
				var strictRE = /^(A|B|C|D|E|F|X|Y|Z)\d{7}$/gi;
				if (medallionNumber && typeof(medallionNumber) == 'string') {
					if (medallionNumber.match(re) && (!medallionNumber.match(strictRE))) {
						return true;
					}
				}
				return false;
			}

		}

		function afterSubmit(context) {
			log.debug('afterSubmit', 'context: ' + JSON.stringify(context) + ',    newRecord: ' + JSON.stringify(newRecord));
			var newRecord = context.newRecord;
			var oldRecord = context.oldRecord;
			var submissionId = newRecord.id;
			var shareholder = newRecord.getValue('custrecord_pisb_shareholder');
			var updatingPI = newRecord.getValue('custrecord_pisb_updating_paymt_instr');
			var submissionStatus = newRecord.getValue('custrecord_pisb_submission_status');
			// var submissionStatus = exRecAlpha.getFieldValue(context,'custrecord_pisb_submission_status');
			var createdBy = newRecord.getValue('custrecord_pisb_created_by');
			var inactivatePI = newRecord.getValue('custrecord_pisb_inactivate_pi');
			var i = null;
			var promotionObj;

			if (submissionStatus == subSts.Promoting) {
				promotionObj = updateOrCreatePaymtInstr(context, updatingPI);
				// log.debug('afterSubmit', 'promotionObj returned from update create PI function: ' + JSON.stringify(promotionObj));
				// remove outdated Promotion Error messages.
				var currentErrorSummary = newRecord.getValue('custrecord_pisb_status_err_summary');
				var currentErrorDetail = newRecord.getValue('custrecord_pisb_error_detail');
				if (currentErrorSummary == '') {
					currentErrorSummary = oldRecord.getValue('custrecord_pisb_status_err_summary');
					currentErrorDetail = oldRecord.getValue('custrecord_pisb_error_detail');
				}
				var currentErrorSummaryArray = currentErrorSummary.split('; ');
				var currentErrorDetailArray = currentErrorDetail.split('; ');
				var newErrorSummary = '';
				var newErrorDetail = '';

				for (i = 0; i < currentErrorSummaryArray.length; i++) {
					if (currentErrorSummaryArray[i] != '' && currentErrorSummaryArray[i].indexOf('PROBLEM PROMOTING PAYMENT SUBMISSION') < 0) {
						newErrorSummary += currentErrorSummaryArray[i] + '; ';
					}
				}
				for (i = 0; i < currentErrorDetailArray.length; i++) {
					if (currentErrorDetailArray[i] != '' && currentErrorDetailArray[i].indexOf('PROMOTION ERROR') < 0) {
						newErrorDetail += currentErrorDetailArray[i] + '; ';
					}
				}

				var fieldsToUpdate = {};
				if (promotionObj.paymtInstrId) { // Promotion was successful!
					// update ExRecs!!!
					fieldsToUpdate = {
						'custrecord_pisb_submission_status': subSts.Promoted,
						'custrecord_pisb_status_err_summary': newErrorSummary,
						'custrecord_pisb_error_detail': newErrorDetail
					};
					if (!inactivatePI) {
						fieldsToUpdate['custrecord_pisb_updating_paymt_instr'] = promotionObj.paymtInstrId // PPE-193
					}
					submissionStatus = subSts.Promoted;
				} else { // Promotion failed! Append error messages to error fields.
					fieldsToUpdate = {
						'custrecord_pisb_status_err_summary': (newErrorSummary + 'PROBLEM PROMOTING PAYMENT SUBMISSION; '),
						'custrecord_pisb_error_detail': (newErrorDetail + 'PROMOTION ERROR: ' + promotionObj.errorName + ': ' + promotionObj.errorMessage + '; ')
					};
				}
				try {
					record.submitFields({
						type: newRecord.type,
						id: submissionId,
						values: fieldsToUpdate
					});
				} catch (e) {
					log.error('ERROR UPDATING PAYMENT SUBMISSION WHEN ATTEMPTING PROMOTION', e.name + ': ' + e.message + ' /// ' + e.stack);
				}

				//log.debug('inactivatePI: ' + inactivatePI);
				// if (!inactivatePI) {
				// 	log.debug('not deactivating - update them normally');
				// 	// var shareholder = newRecord.getValue('custrecord_pisb_shareholder');
				// 	var PIType = newRecord.getValue('custrecord_pisb_paymt_instr_type');
				// 	var PIOnHold = search.lookupFields({
				// 		type: 'customrecord_paymt_instr',
				// 		id: promotionObj.paymtInstrId,
				// 		columns: 'custrecord_pi_onhold'
				// 	}).custrecord_pi_onhold;
				// 	var exRecId = newRecord.getValue('custrecord_pisb_exchange');
				// 	var dealId = newRecord.getValue('custrecord_pisb_deal');
				// 	// exRecAlpha.pushPIInfoToExRec(promotionObj.paymtInstrId, shareholder, PIType, PIOnHold, exRecId, dealId);
				// }
			}

			var holdSearchResults = checkForHoldsBySubmission(submissionId);

			if (!updatingPI || submissionStatus == subSts.Canceled || submissionStatus == subSts.Promoted) {
				// if this Submission is no longer pointing toward a valid PI
				// (Submission is now creating a new PI and not editing an existing one)
				// OR if this Submission has been Promoted or Canceled
				// (Targeted PI has been either successfully updated OR this Submission changes are no longer needed)
				// we need to remove any Holds related to this Submission
				removeHolds(holdSearchResults);
			} else {
				// we have a valid PI Type, Shareholder, and Deal/ExRe ID if relevant
				// (Submission is targeting a valid PI)
				var haveHold = false;
				for (i = 0; i < holdSearchResults.length; i++) {
					if (holdSearchResults[i].paymentInstruction == updatingPI) {
						// log.debug('A hold already exists for this Submission and Payment Instruction.');
						haveHold = true;
					} else {
						// this Hold points to a different PI, so release it
						removeHold(holdSearchResults[i].holdId);
						alphaRecord.manageHoldStatus(holdSearchResults[i].paymentInstruction);
					}
				}

				if (!haveHold) {
					// if a hold for THIS submission with THIS PI link does not exist, create one
					var holdId = createHoldRecord(updatingPI, submissionId, createdBy, updatingPI);	//<ATP-950> added context
					// log.debug('Created Hold Record #' + holdId);
				}
			}

			if (updatingPI && !inactivatePI) {

				alphaRecord.manageHoldStatus(updatingPI);
			}
          
          	// ATP{-840 Inactivating Payment Instruction does not cancel all open Paymt Instr Hold records		
			//--------------------------------------------------------------------------------------------------------		
			if (inactivatePI && submissionStatus === subSts.Promoted) {		
				// THIS HAS BEEN REPLACED BY <ATP-791> FUNCTIONALITY
				//alphaRecord.clearHoldsByPI(updatingPI, inactivatePI);	
				// </ATP-791>	
			}		
			// end ATP-840		
			//--------------------------------------------------------------------------------------------------------

			//<ATP-971>
			// if its a Duplicate Hold Reason then clear the other dupe
			//log.debug('ATP-971 - start', 'submissionStatus='+submissionStatus+' inactivatePI='+inactivatePI+ ' context='+runtime.executionContext );
			if (submissionStatus == subSts.Promoted && inactivatePI){

				// get the vars we need from the PISB
				var PI_SH = newRecord.getValue('custrecord_pisb_shareholder');
				var PI_Type = newRecord.getValue('custrecord_pisb_paymt_instr_type');
				var PI_Deal = newRecord.getValue('custrecord_pisb_deal');
				if (PI_Deal == ""){ PI_Deal = '@NONE@'; }
				
				//log.debug('ATP-971', 'PI_SH='+PI_SH+' PI_Type='+PI_Type+' PI_Deal='+PI_Deal+' updatingPI='+updatingPI);

				// search to see a count of all holds by reason
				var searchJSON = [];
				var customrecord_paymt_instrSearchObj = search.create({
					type: "customrecord_paymt_instr",
					filters:
					[
					   ["custrecord_pi_shareholder","anyof", PI_SH], 
					   "AND", 
					   ["custrecord_pi_paymt_instr_type","anyof", PI_Type ], 
					   "AND", 
					   ["custrecord_pi_deal","anyof", PI_Deal ], 
					   "AND", 
					   ["custrecord_pi_onhold","is","T"], 
					   "AND", 
					   ["custrecord_pihd_paymt_instr.custrecord_pihd_hold_status","anyof","1"]
					],
					columns:
					[
					   search.createColumn({
						  name: "internalid",
						  summary: "GROUP"
					   }),
					   search.createColumn({
						  name: "custrecord_pihd_hold_reason",
						  join: "CUSTRECORD_PIHD_PAYMT_INSTR",
						  summary: "COUNT"
					   }),
					   search.createColumn({
						  name: "formulatext",
						  summary: "MIN",
						  formula: "REPLACE(NS_CONCAT(TO_CHAR({custrecord_pihd_paymt_instr.custrecord_pihd_hold_reason})), ',', ',')"
					   }),
					   search.createColumn({
						name: "formulatext",
						summary: "MIN",
						formula: "REPLACE(NS_CONCAT(TO_CHAR({custrecord_pihd_paymt_instr.internalid})), ',', ',')"
					 })
					]
				 });
				 var searchResultCount = customrecord_paymt_instrSearchObj.runPaged().count;
				 //log.debug("customrecord_paymt_instrSearchObj result count",searchResultCount);
				 customrecord_paymt_instrSearchObj.run().each(function(result){
					// .run().each has a limit of 4,000 results
					// build the JSON due to multi formula NS limitations
					var searchResultsJSON = result.toJSON();
					var searchResultsJSONstring = JSON.stringify(searchResultsJSON);
					var searchResultsJSONparse = JSON.parse( searchResultsJSONstring.replace("MIN(formulatext)","hold_reasons").replace("MIN(formulatext)_1", "internal_ids") );
					var internal_ids = searchResultsJSONparse.values.internal_ids.split(",");
					var hold_reasons = searchResultsJSONparse.values.hold_reasons.split(",");

					searchJSON.push({
						'PI'		:	result.getValue({ name : 'internalid', summary : 'GROUP' }),
						'holdStatus'	:	hold_reasons,
						'internalids'	:	internal_ids
					});	

					return true;
				 });
			 
				 //log.debug('ATP-971 --- JSON DATA', JSON.stringify(searchJSON) );

				// helper functions
				function clearHoldRecord(holdID){
					//log.debug('#########CLEARING HOLD '+holdID);
					record.submitFields({
						type: 'customrecord_paymt_instr_hold', 
						id:  holdID,
						values: {
							'custrecord_pihd_hold_status': 3		// for holds 1=open, 3=cleared
						},
						options: {
							enableSourcing: false, 
							ignoreMandatoryFields : true
						}
					});
				}

				function clearPIholdCheckbox(PI){
					//log.debug('#########CLEARING PI CHECKBOX '+PI);
					record.submitFields({
						type: 'customrecord_paymt_instr',
						id: PI,
						values: {
							'custrecord_pi_onhold' : 'F'
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields : true
						}
					});							
				}

				function inactivatePIrecord(PI){
					//log.debug('#########INACTIVATING PI '+PI);
					record.submitFields({
						type: 'customrecord_paymt_instr',
						id: PI,
						values: {
							'isinactive' : 'T'
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields : true
						}
					});
					//clearPISBs(PI);						
				}






				// So, each PI is on a its own row
				//log.debug('ATP-971 BEFORE searchJSON '+ searchJSON.length , JSON.stringify(searchJSON)); 
				// Now, move the current PI to the top
				for (var i=0; i<searchJSON.length; i++){
					if (updatingPI == searchJSON[i].PI){
						var temp = searchJSON[i];
						searchJSON.splice(i, 1);
						searchJSON.unshift(temp);
					}
				}
				//log.debug('ATP-971 AFTER searchJSON '+ searchJSON.length , JSON.stringify(searchJSON)); 
				var finishedEverything = false;
				

				// ************************* BEGIN MAIN LOOP ****************************
				mainloop:
				for (var i=0; i<searchJSON.length; i++){
					// We need to clear the dupe holds here
					// and, we need to determine if its OK to clear the PI checkbox
					// so, if any of the holds are NOT dupe hold then we dont clear that PI checkbox
					// we only want to clear the other PI's dupe hold if its the LAST PI

					// •1 DUPE PI
					if (searchJSON.length == 1 && finishedEverything == false && searchJSON[i].PI != updatingPI){
						log.audit('#1', 'searchJSON.length='+searchJSON.length+' searchJSON[i].PI='+searchJSON[i].PI+' updatingPI='+updatingPI );
						for (var ii=0; ii<searchJSON[i].holdStatus.length; ii++){
							if (searchJSON[i].holdStatus[ii] != "Duplicate Payment Instruction"){
								searchJSON[i].clearPIcheckbox = false;
							}
						}
						if (searchJSON[i].clearPIcheckbox != false ){ 
							//log.debug('#1 - clearPIcheckbox', 'searchJSON[i].clearPIcheckbox='+searchJSON[i].clearPIcheckbox+' searchJSON[i].holdStatus[ii]='+searchJSON[i].holdStatus[ii]+' i='+i+' ii='+ii);
							clearPIholdCheckbox(searchJSON[i].PI);		// no non-dupe holds on this
						}
						if (searchJSON[i].holdStatus[i] == "Duplicate Payment Instruction"){
							//log.debug('#1 - clearHoldRecord', 'searchJSON[i].internalids[i]='+searchJSON[i].internalids[i]+' i='+i+' ii='+ii);
							clearHoldRecord(searchJSON[i].internalids[i] );	//clear the dupe hold for this rec
						}
						finishedEverything = true;
						//log.debug('ATP-971 - FINISHED LAST PI, i='+i, 'searchJSON[i].PI='+searchJSON[i].PI+' searchJSON[i].internalids[i]='+searchJSON[i].internalids[i]+' searchJSON[i].clearPIcheckbox='+searchJSON[i].clearPIcheckbox+ ' searchJSON[i].holdStatus[i]='+searchJSON[i].holdStatus[i]);
					}

					// •2 DUPE PIs
					//log.debug('ATP-971 - i='+ i +' PI='+ searchJSON[i].PI +' updatingPI='+updatingPI+' - checking length==2', 'searchJSON.length='+searchJSON.length+' finishedEverything='+finishedEverything+' ');
					if (searchJSON.length == 2 && finishedEverything == false && searchJSON[i].PI == updatingPI){
						log.audit('#2', 'searchJSON.length='+searchJSON.length+' searchJSON[i].PI='+searchJSON[i].PI+' updatingPI='+updatingPI );
						// loop thru the statuses to determine to determine the PIcheckbox setting and clear the dupe holds
						searchJSON[i].clearPIcheckbox = true; // assume we will clear that checkbox until the loop below proves us wrong
						for (var ii=0; ii<searchJSON[i].holdStatus.length; ii++){
							if (searchJSON[i].holdStatus[ii] != "Duplicate Payment Instruction"){
								searchJSON[i].clearPIcheckbox = false;
							} else {
								//log.debug('ATP-971 - PI '+ searchJSON[i].PI +' clearing dupe hold','PI is '+parseInt(i+1)+'/'+ searchJSON.length +' hold id='+searchJSON[i].internalids[ii]);
								clearHoldRecord(searchJSON[i].internalids[ii]);
							}
						}
						// now that we know, we can set the PI checkbox (we only want to clear the other PI's dupe hold if its the LAST PI)
						if (searchJSON[i].clearPIcheckbox == true){
							//log.debug('ATP-971 - PI '+ searchJSON[i].PI +' clearing PI checkbox' );
							clearPIholdCheckbox(searchJSON[i].PI);
							// inactivate PI UNLESS it's the last PI
							//log.debug('ATP-791 - Remaining PIs = '+ parseInt(searchJSON.length - parseInt(i+1)) );
						}
						// check remaining PI to remove dupe hold only
						if ( searchJSON.length - parseInt(i+1) == 1 ) {
							//log.debug('ATP-971 - i='+i+' last PI = '+ searchJSON[i+1].PI +' clearing its dupe hold i='+i, new Date() );
							var clearRemainingPIcheckbox = true;
							for (var z=0; z<searchJSON[i+1].holdStatus.length; z++ ){
								if (searchJSON[i+1].holdStatus[z] == "Duplicate Payment Instruction"){
									clearHoldRecord(searchJSON[i+1].internalids[z]);
								}
								if (searchJSON[i+1].holdStatus[z] != "Duplicate Payment Instruction"){
									clearRemainingPIcheckbox = false;
								}
							}
							if (clearRemainingPIcheckbox == true){
								clearPIholdCheckbox(searchJSON[i+1].PI);
							}
							finishedEverything = true;
						}
					}

					// •3 or More DUPE PIs
					if (searchJSON.length >= 3 ) {	// 3 or more PIs detected *************************************************
						log.audit('#3', 'searchJSON.length='+searchJSON.length+' searchJSON[i].PI='+searchJSON[i].PI+' updatingPI='+updatingPI );
						// we want to ONLY AFFECT the current PI if it's a crowd of PIs (3 or more)
						if (updatingPI == searchJSON[i].PI ){
							searchJSON[i].clearPIcheckbox = true;
							for (var ii=0; ii<searchJSON[i].holdStatus.length; ii++){
								if (searchJSON[i].holdStatus[ii] != "Duplicate Payment Instruction"){
									searchJSON[i].clearPIcheckbox = false;
								} else {
									//log.debug('ATP-971 - PI '+ searchJSON[i].PI +' clearing dupe hold','PI is '+parseInt(i+1)+'/'+ searchJSON.length +' hold id='+searchJSON[i].internalids[ii]);
									clearHoldRecord(searchJSON[i].internalids[ii]);
								}
							}
							if (searchJSON[i].clearPIcheckbox == true){
								//log.debug('ATP-971 - PI '+ searchJSON[i].PI +' clearing PI checkbox & INACTIVATING PI' );
								clearPIholdCheckbox(searchJSON[i].PI);
								inactivatePIrecord(searchJSON[i].PI);
								// inactive the PI here ONLY if it's NOT the last PI we're looking at		'isinactive' : 'T'
								//log.debug('ATP-791 - Remaining PIs = '+ parseInt(searchJSON.length - parseInt(i+1)) );
							}
						}
						break mainloop;
					} // i++
                } // END MAIN LOOP





				 //log.debug('ATP-971 - FINISHED','iterated thru '+searchJSON.length+' PIs');

			} // if Inactive & Promoted
			//</ATP-971>
		

			
			//<ATP-976>
			if (context.type == context.UserEventType.EDIT){
				//log.debug('ATP-976', 'oldRec PI type='+oldRecord.getValue('custrecord_pisb_paymt_instr_type')+ ' newRec PI type='+newRecord.getValue('custrecord_pisb_paymt_instr_type') +  ' oldRecord='+oldRecord.length+' newRecord='+newRecord.length+' old rec JSON='+ JSON.stringify(oldRecord) );
				if ( oldRecord.getValue('custrecord_pisb_paymt_instr_type') != newRecord.getValue('custrecord_pisb_paymt_instr_type') ){
					var targetedPI = oldRecord.getValue('custrecord_pisb_updating_paymt_instr');
					// check if there are not any other holds before removing the PI hold checkbox
					if (targetedPI){	//<ATP-1089> hotfix
						var customrecord_paymt_instr_holdSearchObj = search.create({
							type: "customrecord_paymt_instr_hold",
							filters:
							[
								["custrecord_pihd_paymt_instr","anyof", targetedPI],
								"AND", 
								["custrecord_pihd_hold_status","anyof","1"]
							],
							columns:
							[
								search.createColumn({
									name: "id",
									sort: search.Sort.ASC
								}),
								"scriptid",
								"custrecord_pihd_paymt_instr",
								"custrecord_pihd_hold_src",
								"custrecord_pihd_hold_reason",
								"custrecord_pihd_hold_status",
								"custrecord_pihd_created_by",
								"custrecord_pihd_created_ts",
								"custrecord_pihd_offhold_by",
								"custrecord_pihd_offhold_ts"
							]
							});
						var searchResultCount = customrecord_paymt_instr_holdSearchObj.runPaged().count;
						//log.debug("customrecord_paymt_instr_holdSearchObj result count",searchResultCount);
						customrecord_paymt_instr_holdSearchObj.run().each(function(result){
						// .run().each has a limit of 4,000 results
						return true;
						});

						if (searchResultCount == 0){
							record.submitFields({
								type: 'customrecord_paymt_instr',
								id: targetedPI,
								values: {
									custrecord_pi_onhold: 'F'
								}
							});
						}

					} //</ATP-1089> hotfix
				}
			}
			//</ATP-976>

		} // end aftersubmit
		/**
		 * Do all the Before Load permission checks ATP-343
		 * 
		 * @param  {Object} context
		 * @param  {string} the status of the PI Submission record
		 * @return {Object} success - boolean (indicates whether user has the right permissions)
		 *          		message - string (includes all success and error messages) 
		 */
		function localCheckUserPermissions(context, submissionStatus) {
			var checkUserPermissionsResult = {};
			var success = true;
			var message = '';
			var arrayRoles = [];
			arrayRoles.push(role.opsManager);
			arrayRoles.push(role.opsAnalyst);
			if (runtime.accountId.toLowerCase() == "772390_sb3") { arrayRoles.push('administrator'); }

			switch (context.type) {
				case context.UserEventType.CREATE:
					// Check role restrictions for users creating in the UI (ATP-343)
					if (runtime.executionContext === 'USERINTERFACE') {
						checkUserPermissionsResult = toolsLib.checkUserPermissions(arrayRoles);
						success = checkUserPermissionsResult.success;
						message = checkUserPermissionsResult.message;
					}
					break;
				case context.UserEventType.EDIT:
					switch (runtime.executionContext) {
						case 'USERINTERFACE':
							switch (submissionStatus) {
								case subSts.DualEntry:
									// Check role restrictions for users editing in the UI when Status = Dual Entry (ATP-343)
									// Restrict to Ops Manager and Ops Analyst roles
									checkUserPermissionsResult = toolsLib.checkUserPermissions(arrayRoles);
									success = checkUserPermissionsResult.success;
									message = checkUserPermissionsResult.message;
									break;
								case subSts.Review:
									// Restrict to Ops Manager and Ops Analyst roles and Dept Acquiom Ops
									var arrayDepartments = [];
									arrayDepartments.push(department.acquiomOperations);
									if (runtime.accountId.toLowerCase() == "772390_sb3") { arrayDepartments.push(12); }
									checkUserPermissionsResult = toolsLib.checkUserPermissions(arrayRoles, arrayDepartments, '', 'AND');
									success = checkUserPermissionsResult.success;
									message = checkUserPermissionsResult.message;
									break;
								case subSts.Promoting:
									// PPE-183: Block user from editing a Submission record in 'Promoting' status
									success = false;
									message = 'ACCESS DENIED.\n\nYou cannot access this record directly. ' +
										'This submission is in PROMOTING status, which is the result of a system error. ' +
										'Please return to the previous screen and press Retry Promotion to promote this record. ' +
										'Contact your system administrator if you believe you are receiving this message in error.';
									break;
								default:
							}
							break;
						case 'CSVIMPORT':
							// Check permissions if this is a CSV Import - Role must be Ops Analyst or Ops Manager AND 
							// User must have row in the Employee Function table where Function = "Import PI Submission records" (ATP-343)
							checkUserPermissionsResult = toolsLib.checkUserPermissions(arrayRoles, [], employeeFunction.importPISubRecords, 'AND');
							success = checkUserPermissionsResult.success;
							message = checkUserPermissionsResult.message;
							//log.debug("result: " + JSON.stringify(checkUserPermissionsResult) );
							break;
						default:
					}
					break;
				default:
			}

			return {
				success: success,
				message: message
			};
		}

		function check_submission_status(submissionStatus, requestedState) {

			//log.debug('check_submission_status', 'submissionStatus: ' + submissionStatus);
			//log.debug('check_submission_status', 'requestedState: ' + requestedState);

			if (requestedState) {
				//Currently, all other sources use these state machine transition rules
				//(Import follows different rules)
				switch (submissionStatus) {
					case subSts.Entered:
						allowedStates = [subSts.Entered, subSts.Validate];
						break;
					case subSts.Validate:
						allowedStates = [subSts.Validate, subSts.DualEntry, subSts.Failed, subSts.Review, subSts.Approved, subSts.Canceled];
						break;
					case subSts.Failed:
						allowedStates = [subSts.Failed, subSts.DualEntry, subSts.Canceled, subSts.Validate, subSts.Review];
						break;
					case subSts.Review:
						allowedStates = [subSts.Review, subSts.DualEntry, subSts.Canceled, subSts.Approved];
						break;
					case subSts.Approved:
						allowedStates = [subSts.Approved, subSts.Promoting, subSts.Canceled];
						break;
					case subSts.DualEntry:
						allowedStates = [subSts.DualEntry, subSts.Review, subSts.DECompare, subSts.Failed, subSts.Canceled];
						break;
					case subSts.DECompare:
						allowedState = [subSts.DECompare, subSts.DEReject, subSts.DualEntry];
						break;
					case subSts.DEReject:
						allowedStates = [subSts.DEReject, subSts.DualEntry, subSts.Canceled];
						break;
					default:
						allowedStates = [];
				}
				// log.debug('allowedStates is ' + allowedStates.toString());
				if (allowedStates.indexOf(requestedState) === -1) {
					// log.debug('return submissionStatus');
					return submissionStatus;
				} else {
					// log.debug('return requestedState');
					return requestedState;
				}
			} else {
				return submissionStatus;
			}
		}

		function disableFields(context, fieldArray) {
			var theForm = context.form;
			for (var i = 0; i < fieldArray.length; i++) {
				theForm.getField({
					id: fieldArray[i]
				}).updateDisplayType({
					displayType: serverWidget.FieldDisplayType.DISABLED
				});
			}
		}

		function disableFieldsByObject(context, fieldTypeMap) {
			var theForm = context.form;
			for (var prop in fieldTypeMap) {
				for (var i = 0; i < fieldTypeMap[prop].length; i++) {
					theForm.getField({
						id: fieldTypeMap[prop][i]
					}).updateDisplayType({
						displayType: serverWidget.FieldDisplayType.DISABLED
					});

				}
			}
		}

		function inlineProtectFields(context, fieldArray) {
			var theForm = context.form;
			for (var i = 0; i < fieldArray.length; i++) {
				theForm.getField({
					id: fieldArray[i]
				}).updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
			}
		}

		function enableFields(context, fieldArray) {
			var theForm = context.form;
			for (var i = 0; i < fieldArray.length; i++) {
				theForm.getField({
					id: fieldArray[i]
				}).updateDisplayType({
					displayType: serverWidget.FieldDisplayType.NORMAL
				});
			}
		}
		/**
		 * Creates dropdown fields on the form for Deal and Exchange Record selection
		 * @param {object} context      Current context
		 * @param {object} form         Current form
		 * @return {null} 				void
		 */
		function controlTempFields(context, theForm) {
			var dealField = theForm.addField({
				id: 'custpage_dealselectfield',
				type: serverWidget.FieldType.SELECT,
				label: 'DEAL'
			});
			dealField.addSelectOption({
				value: '0',
				text: 'Please Select a Shareholder'
			});
			theForm.insertField({
				field: dealField,
				nextfield: 'custrecord_pisb_deal'
			});
			var exRecField = theForm.addField({
				id: 'custpage_exrecfield',
				type: serverWidget.FieldType.SELECT,
				label: 'EXCHANGE RECORD'
			});
			exRecField.addSelectOption({
				value: '0',
				text: 'Please Select a Shareholder'
			});
			theForm.insertField({
				field: exRecField,
				nextfield: 'custrecord_pisb_deal'
			});
			return;
		}

		function freeUpHolds(holdSearchResults, updatingPI) {
			for (var i = 0; i < holdSearchResults.length; i++) {
				if (holdSearchResults[i].paymentInstruction == updatingPI) {
					removeHold(holdSearchResults[i].holdId);
				}
			}
		}

		function createHoldRecord(payInstrInternalId, submissionId, createdBy, updatingPI) {
			var holdRecord = record.create({
				type: 'customrecord_paymt_instr_hold'
			});

			var holdRecordFields = {
				custrecord_pihd_paymt_instr: payInstrInternalId,
				custrecord_pihd_submission: submissionId,
				custrecord_pihd_hold_src: paymtInstrHoldSrc.Submission,
				custrecord_pihd_hold_reason: paymtInstrHoldReason.PendingSubmission,
				custrecord_pihd_hold_status: payInstrHoldSts.Open,
				custrecord_pihd_created_by: createdBy,
				custrecord_pihd_created_ts: alphaRecord.getCurrentDateTime()
			};


			//<ATP-950>

			// Here we get the info to create the HOLD rec as a Duplicate
			var recordIsDuplicate = false;
			//var domainURL = url.resolveDomain({ 
			//	hostType: url.HostType.APPLICATION
			//});
			var savedSearchIdJSON = JSON.parse(appSettings.readAppSetting("General Settings", "PI and PISB Duplicates Saved Searches") );
			//log.debug('savedSearchIdJSON='+savedSearchIdJSON, 'PI='+savedSearchIdJSON.PI+' PISB='+savedSearchIdJSON.PISB+ ' typeof='+ typeof(savedSearchIdJSON) );


			//LOAD SEARCH
			var savedSearch = search.load({
				id: savedSearchIdJSON.PI
			});


			// RUN SEARCH 
			var searchResults = savedSearch.run();
			searchResults = searchLibrary.getSearchResultData(searchResults)
			//log.debug({ title: 'loadAndRunSearch' ,details:'searchResults.length='+searchResults.length });
			var searchResultsLength = searchResults.length;


			// Create JSON array of saved search data
			var PIdupes = [];
			var allDupeInternalIds = [];
			for (var i=0; i<searchResultsLength; i++){
				var searchResultsJSON = searchResults[i].toJSON();
				var searchResultsJSONstring = JSON.stringify(searchResultsJSON);
				var searchResultsJSONparse = JSON.parse( searchResultsJSONstring.replace("MIN(formulatext)","internal_ids").replace("MIN(formulatext)_1", "payment_methods") );
				var internal_ids = searchResultsJSONparse.values.internal_ids;
				var payment_methods = searchResultsJSONparse.values.payment_methods;

				PIdupes.push({
					'custrecord_pi_shareholder'     :   searchResults[i].getValue({"name": "custrecord_pi_shareholder", "summary": search.Summary.GROUP}),
					'custrecord_pi_paymt_instr_type':   searchResults[i].getValue({"name": "custrecord_pi_paymt_instr_type", "summary": search.Summary.GROUP}),
					'custrecord_pi_deal'            :   searchResults[i].getValue({"name": "custrecord_pi_deal", "summary": search.Summary.GROUP}),
					'custrecord_pi_exchange'        :   searchResults[i].getValue({"name": "custrecord_pi_exchange", "summary": search.Summary.COUNT}),
					'id_count'                      :   searchResults[i].getValue({"name": "id", "summary": search.Summary.COUNT}),
					'internal_ids'                  :   internal_ids
				});
				allDupeInternalIds.push( PIdupes[i].internal_ids );
				
				//custrecord_pisb_updating_paymt_instr = updatingPI
				var idsToCheck = internal_ids.split(",");
				for(var z=0; z<idsToCheck.length; z++){
					
					if ( idsToCheck[z] == updatingPI ){
						//log.debug('PI DUPLICATE MATCH DETECTED', 'PI internal ID='+idsToCheck[z]+' for Shareholder='+searchResults[i].getValue({"name": "custrecord_pi_shareholder", "summary": search.Summary.GROUP}) );
						recordIsDuplicate = true;    // the parameter == the dupe search result
					}
				}
			}

			//log.debug('*****ATP-950', 'is duplicate='+recordIsDuplicate);
			if (recordIsDuplicate){
				var holdRecordFields = {
					custrecord_pihd_paymt_instr: payInstrInternalId,
					custrecord_pihd_submission: submissionId,
					custrecord_pihd_hold_src: paymtInstrHoldSrc.Submission,
					custrecord_pihd_hold_reason: paymtInstrHoldReason.Duplicate,
					custrecord_pihd_hold_status: payInstrHoldSts.Open,
					custrecord_pihd_created_by: createdBy,
					custrecord_pihd_created_ts: alphaRecord.getCurrentDateTime()
				};
				//mark PI as on hold
				record.submitFields({ type:'customrecord_paymt_instr', id: payInstrInternalId, values: {'custrecord_pi_onhold': 'T' } });
			}
			//</ATP-950>


			for (var prop in holdRecordFields) {
				holdRecord.setValue({
					fieldId: prop,
					value: holdRecordFields[prop]
				});
			}
			return holdRecord.save();

		}

		function checkForHoldsBySubmission(submissionId) {
			// check if a hold for this submission exists already
			var filters = [];
			// Looking for holds that have the same Submission ID as this Submission...
			var submissionIdFilter = search.createFilter({
				name: 'custrecord_pihd_submission',
				operator: search.Operator.IS,
				values: submissionId
			});
			filters.push(submissionIdFilter);

			return checkForHolds(filters);
		}

		function checkForHolds(filters) {

			var statusFilter = search.createFilter({
				name: 'custrecord_pihd_hold_status',
				operator: search.Operator.IS,
				values: payInstrHoldSts.Open
			});
			filters.push(statusFilter);

			var holdSearch = search.create({
				type: 'customrecord_paymt_instr_hold',
				filters: filters,
				columns: ['internalid', 'custrecord_pihd_paymt_instr']
			}).run();

			var holdSearchResults = searchResultsLibrary.getSearchResultData(holdSearch),
				holdList = [];
			for (var i = 0; i < holdSearchResults.length; i++) {
				holdList.push({
					holdId: holdSearchResults[i].id,
					paymentInstruction: holdSearchResults[i].getValue('custrecord_pihd_paymt_instr')
				});
			}
			return holdList; // holdList is an array of IDs of Hold Records
		}

		function removeHold(holdId) {
			//PPE-178
			try {
				record.submitFields({
					type: 'customrecord_paymt_instr_hold',
					id: holdId,
					values: {
						custrecord_pihd_hold_status: payInstrHoldSts.Cleared
					}
				});
				//log.debug('Cleared Hold Record #' + holdId);
			} catch (e) {
				log.error('ERROR CLEARING HOLD WHEN ATTEMPTING PROMOTION', e.name + ': ' + e.message + ' /// ' + e.stack);
			}
		}

		function removeHolds(holdList) {
			// log.debug('removeHolds', 'holdList: ' + JSON.stringify(holdList));
			for (var i = 0; i < holdList.length; i++) {
				removeHold(holdList[i].holdId);
			}
		}

		function updateOrCreatePaymtInstr(context, payInstrInternalId) {
			var newRecord = JSON.parse(JSON.stringify(context.newRecord));
			var newFields = newRecord.fields;
			var thisRecord = newRecord.id;
			var thisType = newRecord.type;
			var inactivatePI = newFields.custrecord_pisb_inactivate_pi;
			var paymtInstr = null;
			var piRec = null;
			var piId = null;
			var newValues = {};
			var pmtHistoryId = null;

			try {
				newValues.custrecord_pi_submission = thisRecord; // Paymt Instr Submission that initiated the change
				newValues.custrecord_pi_submission_ts = alphaRecord.cleanData(newFields.custrecord_pisb_status_ts);
				newValues.custrecord_pi_promotion_ts = alphaRecord.getCurrentDateTime(); // Promotion timestamp - only for create

				if (inactivatePI == 'F') {
					for (prop in newFields) {
						if (alphaRecord.isNotSystemField(prop)) { // this is not a system field - prefixed with cust_record
							newValues[findRelatedPIField(prop)] = alphaRecord.cleanData(newFields[prop]);
						}
					}
				}

				if (payInstrInternalId) { // this PI Submission is updating an existing PI 
					delete newValues['custrecord_pisb_original_source'];

					// Load the PI being updated because we want this done NOW, not asynch
					piRec = record.load({
						type: 'customrecord_paymt_instr',
						id: payInstrInternalId
					});

					var myPaymtInstr = JSON.parse(JSON.stringify(piRec));
					var paymtInstrFields = myPaymtInstr.fields;
					delete paymtInstrFields['custrecord_pi_onhold'];
					delete paymtInstrFields['custrecord_pi_updating'];

					// blank out the old fields
					if (inactivatePI == 'F') {
						for (prop in paymtInstrFields) {
							if (alphaRecord.isNotSystemField(prop)) {
								piRec.setValue({
									fieldId: prop,
									value: ''
								});
							}
						}
					} else {
						newValues.isinactive = alphaRecord.cleanData(inactivatePI);
						//<ATP-971> clearPISBs
						//log.debug('@@@@@@@ INACTIVATE @@@@@@@','payInstrInternalId='+payInstrInternalId+' newValues='+JSON.stringify(newValues) );

						var PI = payInstrInternalId;
						var PI_SH = piRec.getValue({ fieldId : 'custrecord_pi_shareholder' });

							//log.debug('entered function clearPISBs(PI) PI='+PI);
							var clearPISBSearchObj = search.create({
								type: "customrecord_paymt_instr_submission",
								filters:
								[
									["custrecord_pisb_shareholder","anyof", PI_SH], 
									"AND", 
									["custrecord_pisb_submission_status","noneof","11","8"]	// promoted, canceled
								],
								columns:
								[
									search.createColumn({
										name: "id",
										sort: search.Sort.ASC
									}),
									"custrecord_pisb_updating_paymt_instr",
									"custrecord_pisb_submission_status"
								]
								});
								var searchResultCount = clearPISBSearchObj.runPaged().count;
								//log.debug("clearPISBSearchObj result count",searchResultCount);
								clearPISBSearchObj.run().each(function(result){
								// match the PI we just inactivated
								var currentPI = result.getValue({ name : 'custrecord_pisb_updating_paymt_instr' });
								var currentPISB = result.getValue({ name : 'id' });
								if ( currentPI == PI ){
									// cancel the submissions
									//log.debug('#########CLEARING PISB '+currentPISB);
									record.submitFields({
										type: 'customrecord_paymt_instr_submission',
										id: currentPISB,
										values: {
											'custrecord_pisb_submission_status' : 8
										},
										options: {
											enableSourcing: false,
											ignoreMandatoryFields : true
										}
									});	
								}
								return true;
								});
						
						//</ATP-971>
					}

					for (prop in newValues) {
						piRec.setValue({
							fieldId: prop,
							value: newValues[prop]
						});
					}

					// create the Paymt Instr History FIRST because it's easier to roll back if the PI update fails
					try {
						pmtHistoryId = alphaRecord.createPaymtHistRecord(piRec, payInstrInternalId);
					} catch (e) {
						log.error('ERROR CREATING HISTORY: ' + e.name, 'MESSAGE: ' + e.message + ' // STACKTRACE: ' + e.stack);
						return {
							errorName: e.name,
							errorMessage: e.message + ' when creating Payment History record'
						};
					}

					// if that succeeded, let's save the Payment Instruction
					try {
						piId = piRec.save();
					} catch (e) {
						log.error('ERROR SAVING UPDATE TO PAYMENT INSTRUCTION #' + payInstrInternalId + ': ' + e.name, 'MESSAGE: ' + e.message + ' // STACKTRACE: ' + e.stack);
						// if we didn't successfully update our Payment Instruction, "roll back" (e.g. delete) our History record
						pmtHistoryId = record.delete({
							type: 'customrecord_paymt_instr_hist',
							id: pmtHistoryId
						});
						return {
							errorName: e.name,
							errorMessage: e.message + ' when updating Payment Instruction'
						};
					}
					log.debug('Updated Payment Instruction #' + payInstrInternalId);
				}
				// else this PI Submission is NOT updating an existing PI 
				else {
					// create the new Payment Instruction FIRST so we have something attach the History record to
					// we'll delete the Payment Instruction if the History record fails

					// mandatory fields for Payment Instruction record
					newValues.custrecord_pi_created_by = runtime.getCurrentUser().id;
					newValues.custrecord_pi_original_source = newValues.custrecord_pi_source;

					piRec = record.create({
						type: 'customrecord_paymt_instr'
					});
					for (prop in newValues) {
						piRec.setValue({
							fieldId: prop,
							value: newValues[prop]
						});
					}

					try {
						piId = piRec.save();
					} catch (e) {
						log.error('ERROR CREATING PAYMENT INSTRUCTION: ' + e.name, 'MESSAGE: ' + e.message + ' // STACKTRACE: ' + e.stack);
						return {
							errorName: e.name,
							errorMessage: e.message + ' when creating Payment Instruction'
						};
					}

					try {
						pmtHistoryId = alphaRecord.createPaymtHistRecord(piRec, piId);
					} catch (e) {
						log.error('ERROR CREATING PAYMT INSTR HISTORY: ' + e.name, 'MESSAGE: ' + e.message + ' // STACKTRACE: ' + e.stack);
						// if we didn't successfully create our Paymt Instr History, "roll back" (e.g. delete) our Payment Instruction record
						piId = record.delete({
							type: 'customrecord_paymt_instr',
							id: piId
						});
						return {
							errorName: e.name,
							errorMessage: e.message + ' when creating Payment History record'
						};
					}
				}

				return {
					paymtInstrId: piId
				};
			} catch (e) {
				log.error('ERROR CREATING/UPDATING PAYMENT INSTRUCTION #' + paymtInstr + ': ' + e.name, 'MESSAGE: ' + e.message + ' // STACKTRACE: ' + e.stack);
				return {
					errorName: e.name,
					errorMessage: e.message
				};
			}
		}

		function findRelatedPIField(prop) {
			// field ID suffixes match up; change the prefix so these field IDs are compatible with the Payment Instruction record
			return alphaRecord.findRelatedField(prop, 'customrecord_paymt_instr_submission', 'customrecord_paymt_instr');
		}

		function validatePayMethodMandatoryFields(context, paymentMethod, recordFields, thisRecord) {
			var mandatoryFields = [];
			var errorDetail = '';
			var statusErrSummary = '';
			var success = true;
			var fieldObj = null;
			var fieldLabel = null;
			var formField = null;
			var formFieldLabel = null;
			// var thisForm = context.form;
			var chkCountry = parseInt(context.newRecord.getValue({
				fieldId: 'custrecord_pisb_chk_country'
			}), 10) || null;
			var wireFFCName = context.newRecord.getValue({
				fieldId: 'custrecord_pisb_ep_ffcname'
			}) || null;
			var wireFFCAccountNumber = context.newRecord.getValue({
				fieldId: 'custrecord_pisb_ep_ffcacctnum'
			}) || null;
			var bankAccountNbr = context.newRecord.getValue({
				fieldId: 'custrecord_pisb_ep_bankacctnum'
			}) || null;
			// var ibanNbr = context.newRecord.getValue({
			// 	fieldId: 'custrecord_pisb_ep_iban'
			// }) || null;
			// var swiftbicNbr = context.newRecord.getValue({
			// 	fieldId: 'custrecord_pisb_ep_swiftbic'
			// }) || null;
			var ibanNbrEntry = context.newRecord.getValue({
				fieldId: 'custrecord_pisb_ep_iban_in'
			}) || null;
			var swiftbicNbrEntry = context.newRecord.getValue({
				fieldId: 'custrecord_pisb_ep_swiftbic_in'
			}) || null;

			// Retrieve list of fields which are always mandatory for a Pay Method  
			mandatoryFields = paymtInstrLight.getMandatoryPaymentFieldsByMethod(paymentMethod, chkCountry, wireFFCName, wireFFCAccountNumber, bankAccountNbr, /*ibanNbr, swiftbicNbr,*/ ibanNbrEntry, swiftbicNbrEntry);

			for (var i = 0; i < mandatoryFields.length; i++) {
				var mandatoryFieldValue = context.newRecord.getValue({
					fieldId: mandatoryFields[i]
				});

				if (!mandatoryFieldValue) {
					fieldObj = thisRecord.getField({
						fieldId: mandatoryFields[i]
					});
					fieldLabel = fieldObj.label;
					if (errorDetail) {
						errorDetail += ', ' + fieldLabel;
					} else {
						errorDetail += 'Missing mandatory field: ' + fieldLabel;
					}
				}
			}
			if (errorDetail) {
				errorDetail += '; ';
				statusErrSummary = 'Missing mandatory payment method fields; ';
				success = false;
			}

			return {
				success: success,
				errorDetail: errorDetail,
				statusErrSummary: statusErrSummary,
				mandatoryFields: mandatoryFields
			};

		}

		function setFieldDisplayTypesForEdit(context, recordFields, thisRecord, submissionStatus) {
			// log.debug('setFieldDisplayTypesForEdit');
			if (submissionStatus === subSts.DualEntry) {
				var inlineFields = ['custrecord_pisb_rvw_last_comment', 'custrecord_pisb_shareholder']; //ATP-305
				inlineProtectFields(context, inlineFields);
			} else {
				// Disable all custom fields 
				var allCustomFields = alphaRecord.getAllCustomFields(recordFields);
				inlineProtectFields(context, allCustomFields);
				// ATP-155 Only enable Last Review Comment for status = Review
				if (submissionStatus === subSts.Review) {
					// Enable the fields below for Review edit
					var editableReviewEditFields = alphaRecord.getEditableReviewEditFields();
					enableFields(context, editableReviewEditFields);
				}
				// ATP-155 Enable Medallion and Tracking fields for all statii
				var editableMedFields = alphaRecord.getEditableMedallionFields();
				enableFields(context, editableMedFields);
				var editableTrackingFields = alphaRecord.getEditableTrackingFields();
				enableFields(context, editableTrackingFields);
			}
		}

		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	});