/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * Payment Instruction User Event customscript_payment_instruction_ue payment_instruction_UE.js
 * ___________________________________________________________
 * Description here
 *
 * Version 1.0
 * Author: Alana Thomas
 * Story      Date            Author           Remarks
 * ATP-242    08/09/2018      Ken Crossman     Removed hard coded record type reference
 * ATP-843	  04/08/2019	  Robert Bender	   Added button for PI Hold
 * ATP-857	  04/24/2019	  Robert Bender	   Duplication detection & buttons to create Inactivate PI
 * ATP-970	  06/07/2019	  Robert Bender	   (ATP-857) Locking all fields if PI is inactive
 * ATP-986	  08/12/2019	  Robert Bender	   PI dupe detection & handling via Library and Suitelet
 * ___________________________________________________________
 */

define(['N/ui/serverWidget', 'N/log', 'N/runtime', 'N/error', '/SuiteScripts/Pristine/libraries/alphaRecordLibrary.js', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js', 'N/url','N/record', '/.bundle/132118/PRI_AS_Engine', '/SuiteScripts/Pristine/libraries/searchLibrary', 'N/search', '/.bundle/132118/PRI_ShowMessageInUI'],
function(serverWidget, log, runtime, error, alphaRecord, piListLib, url, record, appSettings, searchLibrary, search, priMessage) {
	    var recordType = piListLib.recordType;
		var fieldId = piListLib.fieldId;
		var piSubmStatusConstant = piListLib.piEnum.subSts;
		var piSubSource = piListLib.piEnum.subSource;
		var subSts = piListLib.piEnum.subSts;
		var subSource = piListLib.piEnum.subSource;
		var payInstrHoldSts = piListLib.piEnum.payInstrHoldSts;
		var paymtSuspenseReason = piListLib.piEnum.paymtSuspenseReason;
		var paymtInstrHoldReason = piListLib.piEnum.paymtInstrHoldReason;
		var paymtInstrHoldSrc = piListLib.piEnum.paymtInstrHoldSrc;
		var piType = piListLib.piEnum.piType;
   

		function beforeLoad(context) {
			// <ATP-970>
          	//Robert adding log debug to see if this is touched on native merge.
          	log.debug('BEFORELOAD', 'PI touched in context type='+context.type+' exeCon='+runtime.executionContext);
			if ( (context.newRecord.getValue("isinactive") == true) && context.type == 'edit' || context.type == 'xedit' ){		
				throw "Users cannot edit an inactive Payment Instruction."		
			}
			//</ATP-970>

		 	// PPE-186: Block user from directly creating a Payment Instruction record
			if (context.type == 'create' && runtime.executionContext == 'USERINTERFACE') {
				var errorMessage = 'ACCESS DENIED.\n\nYou cannot access this record directly. ' +
					'To create, edit, or inactivate a Payment Instruction, ' +
					'please <a href="/app/common/custom/custrecordentry.nl?rectype=' + recordType.piSubId + '">create a Payment Instruction Submission</a>.'; //ATP-242
				throw errorMessage;
			}

			// ATP-20: Block all imports into Payment Instruction (TODO: temporary until Imports implemented)
			if (runtime.executionContext == 'CSVIMPORT') {
				var importError = error.create({
					name: 'IMPORTS_NOT_ALLOWED',
					message: 'Payment Instructions do not currently support Imports. ' +
						'Please use the Payment Instruction Submission user interface to update or create a Payment Instruction.',
					notifyOff: true
				});
				throw importError.name + ': ' + importError.message;
			}


			//<ATP-857> : Update PI or Inactivate PI button depending on if it's a dupe or not.		
			if (context.type == 'view' && runtime.executionContext == 'USERINTERFACE') {
				var recordIsDuplicate = false;		
                var domainURL = url.resolveDomain({ 		
                    hostType: url.HostType.APPLICATION		
				});		
                var savedSearchIdJSON = JSON.parse(appSettings.readAppSetting("General Settings", "PI and PISB Duplicates Saved Searches") );		
                log.debug('savedSearchIdJSON='+savedSearchIdJSON, 'PI='+savedSearchIdJSON.PI+' PISB='+savedSearchIdJSON.PISB+ ' typeof='+ typeof(savedSearchIdJSON) );		
				
				//LOAD SEARCH		
				var savedSearch = search.load({		
					id: savedSearchIdJSON.PI		
				});		
   		
                // RUN SEARCH 		
                var searchResults = savedSearch.run();		
                searchResults = searchLibrary.getSearchResultData(searchResults)		
                log.debug({		
                    title: 'loadAndRunSearch',		
                    details: 'searchResults.length='+searchResults.length		
                });		
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
					var idsToCheck = internal_ids.split(",");		
					for(var z=0; z<idsToCheck.length; z++){		
						if ( idsToCheck[z] == context.newRecord.getValue("id") ){		
							log.debug('PI DUPLICATE MATCH DETECTED', 'PI internal ID='+idsToCheck[z]+' for Shareholder='+searchResults[i].getValue({"name": "custrecord_pi_shareholder", "summary": search.Summary.GROUP}) );		
							recordIsDuplicate = true;    // the parameter == the dupe search result		
						}		
					}                        		
				}		
				log.debug('this internal id='+context.newRecord.getValue("id")+ ', ALL DUPLICATES INT IDs =', allDupeInternalIds );		
				
				// add button here based on recordIsDuplicate		
				if ( recordIsDuplicate == true){
					log.debug('recordIsDuplicate=TRUE');		
					var PIinactivateURL = url.resolveRecord({		
						recordType:			"customrecord_paymt_instr_submission",		
						returnExternalUrl: true,		
						params:{		
									"record.custrecord_pisb_submission_status"	: piSubmStatusConstant.DualEntry,		// piListLib.piEnum.subSts	// 2=Dual Entry 			subSts: Enum.Enum("zero", "Entered", "DualEntry", "Validate", "Failed", "Review", "DECompare", "DEReject", "Canceled", "Approved", "Promoting", "Promoted"),
									"record.custrecord_pisb_changing_existing"	: "T",		
								"record.custrecord_pisb_updating_paymt_instr"	: context.newRecord.getValue("id"),		
												"record.custrecord_pisb_source"	: piSubSource.PIUserInterface,									// 16 = PI UI  // subSource: Enum.Enum("zero", '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', "Import", "DualEntry", "CopyEditAs", "PIUserInterface", "ClearingHouse", "ExchangeRecord"),
										"record.custrecord_pisb_shareholder"	: context.newRecord.getValue("custrecord_pi_shareholder"),		
												"record.custrecord_pisb_deal"	: context.newRecord.getValue("custrecord_pi_deal"),		
												"record.custrecord_pi_exchange"	: context.newRecord.getValue("custrecord_pisb_exchange"),		
									"record.custrecord_pisb_paymt_instr_type"	: context.newRecord.getValue("custrecord_pi_paymt_instr_type"),		
										"record.custrecord_pisb_inactivate_pi"	: "T",		
												"comingFromInactivatePIbutton"	: true		
								}
					});
					
					// no reason to inactivate it if its already inactive
					if ( context.newRecord.getValue("isinactive") != true ) {
						context.form.addButton({		
							id : "custpage_inactivate_pi",		
							label : "Inactivate PI",		
							functionName: "window.location.href='" + PIinactivateURL + "'; console"		
						});							
					}


					//PRI Message		
					priMessage.prepareMessage("Duplicate PI Detected", "This is a duplicate Payment Instruction record.", priMessage.TYPE.WARNING);		


					//<ATP-986>
					var SHid = context.newRecord.getValue({
						fieldId: 'custrecord_pi_shareholder'
					});

					var returnThis = alphaRecord.returnPIsToBeProcessed(SHid);
					log.debug('PI.UE_returnThis', returnThis );
					var PIdupes = returnThis[0];
					var processedPIs = returnThis[1];
					var PIdupesIDs = [];
					log.debug('PIdupes', PIdupes);
					if (PIdupes.length>0){ PIdupesIDtoHold = PIdupes[0].internal_ids; } else { PIdupesIDtoHold = []; }
					log.debug('processedPIs', processedPIs);

					if (PIdupes[0] != null){
						for (var i=0; i<PIdupes.length; i++ ){
							for (var ii=0; ii<PIdupes.length; ii++ ){
								PIdupesIDs.push(PIdupes[i].internal_ids[ii] )
							}
						}
					}


					var pisprocessed = context.request.parameters.pisprocessed;

					if (pisprocessed){
						log.debug('pisprocessed',pisprocessed);
						var pisProcessedForMessage = ""
						var pisProcessedArray = pisprocessed.split(",");
						for (var z=0; z<pisProcessedArray.length; z++){
							// UNflag the PI as updated
							record.submitFields({
								type: 'customrecord_paymt_instr', 
								id: pisProcessedArray[z],
								values: {
									'custrecord_pi_updating': false
								},
								options: {
									enableSourcing: false, 
									ignoreMandatoryFields : true
								} 
							});

	                        var currentPIrec = url.resolveRecord({
								recordType: 'customrecord_paymt_instr',
								recordId: pisProcessedArray[z]
		                        });
		
							pisProcessedForMessage = pisProcessedForMessage + "<a href='"+ currentPIrec +"'>Payment Instruction #"+pisProcessedArray[z]+"</a> has been placed on Duplicate Hold.<br />"
						}

						priMessage.prepareMessage("All Duplicate PIs have been placed on <b>Hold</b> for Customer <b>"+ context.newRecord.getText({fieldId: 'custrecord_pi_shareholder'}) +"</b>", "The system has created <b>Duplicate Hold(s)</b> the following Payment Instruction(s):<br />"+ pisProcessedForMessage + "<br />", priMessage.TYPE.INFORMATION);
						



					}

					//var PIdupesIDtoHold = PIdupesIDs.internal_ids;
					log.debug('%%%%%%%%%%%%%%%%% '+PIdupesIDs.length, 'PIdupesIDs='+PIdupesIDs+' processedPIs='+processedPIs+ ' dupes to handle now='+PIdupesIDtoHold+', processedPIs='+processedPIs );
					if (PIdupesIDtoHold.length>0){


						//priMessage.prepareMessage("All Duplicate PIs on Hold for Customer #"+	SHid+"", "Created <b>Duplicate Hold(s)</b> the following Payment Instruction(s):<br />"+ PIdupesIDs + "<br />Please wait.. This page will refresh when complete.", priMessage.TYPE.INFORMATION);
						
						var onLoad = context.form.addField({
							id:'custpage_on_load_suitelet',
							label:'not shown',
							type: serverWidget.FieldType.INLINEHTML
						});

						var current_id = context.newRecord.getValue("id");
						var processedPIsString = "";
						for (var z=0; z<processedPIs.length; z++){
							processedPIsString = processedPIsString + processedPIs[z];
							if (z != processedPIs.length-1){ processedPIsString = processedPIsString+"-"; }
						}



						var suiteletURL = url.resolveScript({
							scriptId: 'customscript_dupepiandpisb_load_sl',
							deploymentId: 'customdeploy_dupepiandpisb_load_sl',
							params:	{ 
								'custscript_suitelet_auth' : '!authorizedSuitelet772390', 
								'custscript_shid' : SHid, 
								'custscript_current_id' : current_id, 
								'custscript_processedpis' : processedPIsString
							},
							returnExternalUrl: true
						});
						
						// call Suitelet to do the work here
						try{
							/*
							https.get({
								url: suiteletURL,
								body: {},
								headers: {"Content-Type": "application/json"}
							});
							*/
							log.debug('suiteletURL',suiteletURL);
							context.newRecord.setValue("custpage_on_load_suitelet", "<script>window.location.href = '"+ suiteletURL +"'</script>");

							//log.debug('https.post try', window)
						}catch(e){
							log.error('err try', e.message)
						}finally{
							//var newURL ="custrecordentry.nl?rectype=878&id="+ current_id + "&l=T&pisprocessed="+ processedPIs;
							//log.debug('finally, processedPIs='+ PIdupesIDs, 'newURL='+newURL);	
							//context.newRecord.setValue("custpage_on_load_suitelet", "<script>window.location.href = '"+ newURL +"'</script>");
						}
					}
					//</ATP-986>							
                    		
				} else {
					//recordIsDuplicate = false;		
					log.debug('recordIsDuplicate=FALSE');		
					var domainURL = url.resolveDomain({ 		
						hostType: url.HostType.APPLICATION		
					});		
					var PIupdateURL = url.resolveRecord({		
						recordType:			"customrecord_paymt_instr_submission",		
						returnExternalUrl: true,		
						params:{		
									"record.custrecord_pisb_submission_status"	: 2,		
									"record.custrecord_pisb_changing_existing"	: "T",		
								"record.custrecord_pisb_updating_paymt_instr"	: context.newRecord.getValue("id"),		
												"record.custrecord_pisb_source"	: 16,		
										"record.custrecord_pisb_shareholder"	: context.newRecord.getValue("custrecord_pi_shareholder"),		
												"record.custrecord_pisb_deal"	: context.newRecord.getValue("custrecord_pi_deal"),		
												"record.custrecord_pi_exchange"	: context.newRecord.getValue("custrecord_pisb_exchange"),		
									"record.custrecord_pisb_paymt_instr_type"	: context.newRecord.getValue("custrecord_pi_paymt_instr_type"),
											"record.custrecord_pisb_exchange"	: context.newRecord.getValue("custrecord_pi_exchange"),
											"record.custpage_exrecfield"		: context.newRecord.getValue("custrecord_pi_exchange")
								}		
					});
					log.debug('PI UPDATE URL=',domainURL+PIupdateURL);		
					if (context.newRecord.getValue("isinactive") != true ){		
                      context.form.addButton({		
                          id : "custpage_update_pi",		
                          label : "Update PI",		
                          functionName: "window.location.href='" + PIupdateURL + "'; console"		
                      });		
					}
				}

			}
			// </ATP-857>


		}

		function beforeSubmit(context) {
			if (context.type == 'edit') {
				var runTimeCTX = runtime.executionContext;
				// remove submission/submission TS and change the source, as this was done through the UI
				// BobP 1/30/18 - commenting these out.  It is not clear why the submission info would be cleared.
				// var updateFields = {
				// custrecord_pi_submission_ts: '',
				// custrecord_pi_submission: '',
				// custrecord_pi_source: sourceList.PIUserInterface
				// };
				// for(prop in updateFields) {
				// context.newRecord.setValue({
				// fieldId: prop,
				// value: updateFields[prop]
				// });
				// }

				var inactivatePI = context.newRecord.getValue({
					fieldId: 'isinactive'
				});

				if ((runTimeCTX == 'USERINTERFACE') || (runTimeCTX == 'USEREVENT') || (runTimeCTX == 'CSV_IMPORT')) {

					var newPIRecord = context.newRecord;
					var oldPIRecord = context.oldRecord;

					//--------------
					// support for SRS Tracking
					//--------------
					// NOTE: SRS Tracking in PI Record would only be changed if done via import update or by direct UI edits
					//  There is no need for the script below to run when changes to PI are invoked from other records
					//  The logic below only needs to run when changes were DIRECTLY made in the UI of Payment Instruction
					// Pay Agent
					var payagntConfirm = newPIRecord.getValue({
						fieldId: 'custrecord_pi_payagnt_confirm'
					});
					var payagntConfirmTS = newPIRecord.getValue({
						fieldId: 'custrecord_pi_payagnt_confirm_ts'
					});
					var payagntConfirmedBy = newPIRecord.getValue({
						fieldId: 'custrecord_pi_payagnt_confirmed_by'
					});
					var payagntCase = newPIRecord.getValue({
						fieldId: 'custrecord_pi_payagnt_case'
					});
					var hasOldPayagntConfirm = false;
					var oldPayagntConfirm = 0;
					try {
						oldPayagntConfirm = oldPIRecord.getValue({
							fieldId: 'custrecord_pi_payagnt_confirm'
						});
						hasOldPayagntConfirm = true;

					} catch (e) {
						hasOldPayagntConfirm = false;
					}
					// Buyer			
					var buyerConfirm = newPIRecord.getValue({
						fieldId: 'custrecord_pi_buyer_confirm'
					});
					var buyerConfirmTS = newPIRecord.getValue({
						fieldId: 'custrecord_pi_buyer_confirm_ts'
					});
					var buyerConfirmedBy = newPIRecord.getValue({
						fieldId: 'custrecord_pi_buyer_confirmed_by'
					});
					var buyerCase = newPIRecord.getValue({
						fieldId: 'custrecord_pi_buyer_case'
					});
					var hasOldBuyerConfirm = false;
					var oldBuyerConfirm = 0;
					try {
						oldBuyerConfirm = oldPIRecord.getValue({
							fieldId: 'custrecord_pi_buyer_confirm'
						});
						hasOldBuyerConfirm = true;

					} catch (e) {
						hasOldBuyerConfirm = false;
					}
					// Escrow
					var escrowConfirm = newPIRecord.getValue({
						fieldId: 'custrecord_pi_escrow_confirm'
					});
					var escrowConfirmTS = newPIRecord.getValue({
						fieldId: 'custrecord_pi_escrow_confirm_ts'
					});
					var escrowConfirmedBy = newPIRecord.getValue({
						fieldId: 'custrecord_pi_escrow_confirmed_by'
					});
					var escrowCase = newPIRecord.getValue({
						fieldId: 'custrecord_pi_escrow_case'
					});
					var hasOldEscrowConfirm = false;
					var oldEscrowConfirm = 0;
					try {
						oldEscrowConfirm = oldPIRecord.getValue({
							fieldId: 'custrecord_pi_escrow_confirm'
						});
						hasOldEscrowConfirm = true;

					} catch (e) {
						hasOldEscrowConfirm = false;
					}

					// Handle logic for SRS Tracking
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
						//log.error('escrowConfirm', 'escrowConfirm=>' + escrowConfirm + '<');
						if (escrowConfirm) {
							//log.error('escrowConfirm', '(escrowConfirm) is true');
							//a non-blank value (1 = Yes, 2 = No)
							if (!oldEscrowConfirm || (oldEscrowConfirm && oldEscrowConfirm != escrowConfirm)) {
								//log.error('escrowConfirm', 'inside SET block');
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

					// SRS Tracking field updates
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_payagnt_confirm_ts',
						value: payagntConfirmTS,
						ignoreFieldChange: true
					});
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_payagnt_confirmed_by',
						value: payagntConfirmedBy,
						ignoreFieldChange: true
					});
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_payagnt_case',
						value: payagntCase,
						ignoreFieldChange: true
					});
					// Buyer
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_buyer_confirm_ts',
						value: buyerConfirmTS,
						ignoreFieldChange: true
					});
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_buyer_confirmed_by',
						value: buyerConfirmedBy,
						ignoreFieldChange: true
					});
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_buyer_case',
						value: buyerCase,
						ignoreFieldChange: true
					});
					// Escrow
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_escrow_confirm_ts',
						value: escrowConfirmTS,
						ignoreFieldChange: true
					});
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_escrow_confirmed_by',
						value: escrowConfirmedBy,
						ignoreFieldChange: true
					});
					newPIRecord.setValue({
						fieldId: 'custrecord_pi_escrow_case',
						value: escrowCase,
						ignoreFieldChange: true
					});
					// ----------------  end SRS Tracking ------------------				

				}

				if (inactivatePI == 'T') {
					alphaRecord.createPaymtHistRecord(context);
				}
			}
		}

		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit
		};
	}
);