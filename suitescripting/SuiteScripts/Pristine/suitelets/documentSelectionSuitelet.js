	/**
	 *@NApiVersion 2.x
	 *@NScriptType Suitelet
	 */

	define(['N/ui/serverWidget', 'N/search', 'N/http', 'N/runtime', 'N/record', 'N/redirect', 'N/task', '/SuiteScripts/Pristine/libraries/approvalProcessLibrary'],

		/**
		 * -----------------------------------------------------------
		 * documentSelectionSuitelet.js
		 * ___________________________________________________________
		 * Module builds the Document Selection Suitelet for the
		 * Document Collection Process of a Deal Event
		 *
		 * Version 1.0
		 * Author: Ken Crossman & Peter Gail
		 *		
		 * Version 1.1 Enhancement to allow additional documents to be added to a Selection and generation 
		 * Ken Crossman 2017-10-24
		 * ___________________________________________________________
		 */

		function(serverWidget, search, http, runtime, record, redirect, task, approvalProcess) {
			'use strict';

			var DEVELOPMENT = false;

			// Constants
			var APPROVAL_STEP_FIELD = 'custrecord_dge_ds_step'; //Field on Document Generation Event record
			var RECORD_TYPE = 'customrecord_doc_gen_event'; // Document Generation Event record
			var APPROVAL_LOG_RECORD_TYPE = 'customrecord_doc_selection_appr_log';
			var APPROVAL_STATUS_FIELD = 'custrecord_dge_ds_status'; //Field on Deal Event record
			var ACTION_FIELD_ID = 'custpage_selected_action';
			var DOC_GENERATE_TASK_FIELD = 'custrecord_dge_gen_task_id'; //Field on Document Generation Event record
			var DOC_DELETE_TASK_FIELD = 'custrecord_dge_del_task_id'; //Field on Document Generation Event record
			var DOC_GENERATE_SCRIPT_ID = 'customscript_doc_gen_mr';
			var DOC_DELETE_SCRIPT_ID = 'customscript_doc_del_sched_script';

			var selectedCellFieldType = 'select'; //alternatives are 'checkbox' or 'select'

			// PRODUCTION WATCH: ensure correct internal id
			var APPROVAL_BUSINESS_PROCESS = 1; // 'Document Collection'

			var docGenTaskID = null;
			var docDelTaskID = null;
			var user = null;
			var dealEvent = null;

			// Form fields
			var dealEventFormField = null;
			var stepFormField = null;
			var CHSectionConfigFormField = null;
			var currentDGEFormField = null;
			var dgeSelectFormField = null;
			var jobStatusFormField = null;
			var sectypecountFormField = null;
			var custpage_doctemplcountFormField = null;
			var exrecgpcountFormField = null;
			var docSelectionFormSublist = null;
			var dsFormSublistSecTypeIDColumn = null;
			var dsFormSublistExRecGpIDColumn = null;
			var dsFormSublistDocTemplColumn = null;

			// Other
			var currentStepID = null;
			var currentStep = null;
			var currentStepSequence = null;

			var selectedStepID = null;
			var selectedStepSequence = null;
			var selectedStep = null;
			var selectedActionID = null;
			var selectedAction = null;
			var currentActionID = null;
			var currentAction = null;

			var sectypecount = null;
			var securityTypes = null;
			var docTemplates = null;
			var custpage_doctemplcount = null;
			var exrecgpcount = null;
			var exRecGps = null;
			var thisSuiteletID = null;
			var httpContext = null;
			var action = null;

			var sublistFields = null;
			var sublistData = null;
			var params = null;
			var formColCount = null;

			var userPermitted = null;
			var dgeList = null;

			var selectedDGEID = null;
			var selectedDGE = null;
			var currentDGEID = null;
			var currentDGE = null;
			var deletedDGEID = null;
			var newDGEID = null;
			var documentCount = 0;

			function onRequest(context) {

				httpContext = context;

				if (runtime.envType === 'SANDBOX') {
					DEVELOPMENT = true;
				}
				//log.debug('Doc Selection Suitelet invoked in ', runtime.envType);

				//Set the correct suitelet ID
				if (DEVELOPMENT) {
					thisSuiteletID = 1047;
				} else {
					thisSuiteletID = 1047;
				}

				user = runtime.getCurrentUser();

				approvalProcess.initialize(user, RECORD_TYPE, APPROVAL_STEP_FIELD, APPROVAL_LOG_RECORD_TYPE, APPROVAL_BUSINESS_PROCESS);
				// Pass ACTION_FIELD_ID over to library
				approvalProcess.setSubmitFieldID(ACTION_FIELD_ID);

				//log.debug('request', 'method: ' + JSON.stringify(context.request.method));
				if (context.request.method === 'GET') {
					// Get the Deal Event parameter and find a default doc gen event
					getInitialize(context);
				} else {
					postInitialize(context);
					// Only update if you're not viewing. A DGE choice of All or New implies a View action.
					if ((selectedAction.action.toLowerCase() !== 'view' &&
							selectedDGEID !== '-99') || parseInt(selectedDGEID) === 0) {
						try {
							if (selectedAction && selectedAction.action.toLowerCase() === 'delete dge') {
								deletedDGEID = deleteDGE(dealEvent, selectedDGEID);
								//log.debug('onRequest', 'deletedDGEID: ' + deletedDGEID);
							} else {
								if (parseInt(selectedDGEID) === 0) {
									newDGEID = newDGERequest(context, dealEvent, dgeList);
								} else {
									postUpdateDatabase(sdsList, selectedAction, currentStepSequence, selectedStepSequence, dealEvent, selectedDGE, selectedDGEID, sublistFields, sublistData, sectypecount, exrecgpcount, formColCount);
									postCreateLogRecordEntry();
									postUpdateDGERecord(selectedDGEID, selectedStepID, docGenTaskID, docDelTaskID);
								}
							}
						} catch (e) {
							context.response.write(e.message + ' \n\nPlease notify the SRS Acquiom Technology Team');
							log.error('ERROR ON POST HANDLER:', e.message);
						}
						// Re-read the DGEs from the database now that updates have happened
						postRereadDGEs(dealEvent);
					}
				}
				/* ----------------- GET AND POST SECTION ----------------- */
				/**
				 * Create and set up the form 
				 * This section applies to both GET events and POST events after updates
				 * 
				 */

				// Pass context across to approval process library
				approvalProcess.setContext(context);

				// Retrieve DER - Deal Event record 
				var dealEventRec = getDealEvent(dealEvent);

				// Create form
				var form = serverWidget.createForm({
					title: 'Document Selection for ' + dealEventRec[0].getValue({
						name: 'name'
					})
				});
				// Declare the path to the client script to be used on this form
				form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/dsSuiteletClient.js';

				// Store Deal Event in hidden form field for use later in POST context
				storeDealEvent(form);

				addDGESelectField(form, dgeList, selectedDGEID);

				// Add hidden Document Selection Step ID field
				storeStep(context, form, selectedStepID);

				// Add hidden DGE ID field to be read in a POST context as Current DGE ID
				// What is now the user selected DGE ID will be current after form submission
				storeDGE(form, selectedDGEID);

				// This is where the submit button is displayed
				addFormHeaderFields(selectedDGEID, selectedStepID, form, dealEventRec, selectedCellFieldType);

				// Count the number of docs already existing for this DGE
				if (selectedDGEID !== '0') {
					documentCount = getDocumentCount(dealEvent, selectedDGEID);
				}

				// Get the job statuses for doc generation or deletion
				var remainingUSAGEbeforeRetrieve = runtime.getCurrentScript().getRemainingUsage();
            	log.audit("remainingUSAGEbeforeRetrieve before retrieveAndDisplayJobStatuses: ", remainingUSAGEbeforeRetrieve);
				retrieveAndDisplayJobStatuses(context, form, selectedStepID, selectedDGEID, selectedDGE, dealEventRec, selectedCellFieldType, documentCount);
				var remainingUSAGEafterRetrieve = runtime.getCurrentScript().getRemainingUsage();
            	log.audit("remainingUSAGEafterRetrieve after retrieveAndDisplayJobStatuses: ", remainingUSAGEafterRetrieve);

				/* ----------------- Is User Permitted for this step? ----- */

				userPermitted = approvalProcess.getUserPermittedFlag();
				// log.debug('Line 335', 'userPermitted: ' + userPermitted);

				// Store Doc Template, Sec Type and Ex Rec counts in hidden fields 
				storeCounts(form);

				/* ----------------- SUBLIST SECTION ----------------- */
				// Add the Document Selection Sublist to the form 
				addDocSelSublist(form);
				// Get all Document Selection rows for the Deal Event
				var sdsList = buildStoredDocSelections(dealEvent, '-99');
				loadDSSublist(selectedDGEID, selectedDGE, dgeList, sdsList, docSelectionFormSublist, securityTypes, exRecGps, docTemplates, selectedStepSequence);
				// Now add the  Status Change Log SubList
				loadStatusChangeLogSublist(form, selectedDGEID);

				context.response.writePage(form);
			}

			function getDocumentCount(dealEvent, selectedDGEID) {
				var docCount = 0;
				var docSearch = search.create({
					type: 'customrecord_document_management',
					title: 'docs',
					columns: [{
						name: 'custrecord_doc_doc_gen_event',
						summary: search.Summary.GROUP,
					}, {
						name: 'internalid',
						summary: search.Summary.COUNT,
					}],
					filters: [{
						name: 'custrecord_document_mpr',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'custrecord_doc_doc_gen_event',
						operator: search.Operator.IS,
						values: selectedDGEID
					}, {
						name: 'custrecord_doc_created_by_script',
						operator: search.Operator.IS,
						values: thisSuiteletID // Document Selection Suitelet
					}]

				}).run();
			
				var docRecords = getSearchResultData(docSearch);
				if (docRecords.length > 0) {
					docCount = docRecords[0].getValue({
						name: 'internalid',
						summary: search.Summary.COUNT
					});
				}
				return docCount;
			}

			function getInitialize(context) {
				// Get the Deal Event parameter
				dealEvent = context.request.parameters.custscript_dss_deal_event;
				//log.debug('getInitialize', 'dealEvent: ' + dealEvent);
				// Because in a GET context the user has not had the opportunity to select a DGE, 
				// I do it for them by selecting the Most recent incomplete DGE
				dgeList = buildDGEs(dealEvent);
				// log.debug('getInitialize', 'dgeList: ' + JSON.stringify(dgeList));
				// If we encounter a Deal Event without a DGE then we should create the 1st one for the user
				if (dgeList.length === 0) {
					newDGEID = createNewDGE(parseInt(dealEvent), dgeList);
					// If successful then link all prior Doc Selections and generated documents 
					// to the new DGE  and re-build the dgeList
					if (newDGEID) {
						linkDGE2DocSelections(dealEvent, newDGEID);
						linkDGE2Documents(dealEvent, newDGEID);
						linkDGE2Log(dealEvent, newDGEID);
						dgeList = buildDGEs(dealEvent);
					}
				}
				getHandleDGE(context, dealEvent, dgeList);
				if (selectedDGE) {
					getHandleAction(selectedDGE);
				}
			}

			function linkDGE2DocSelections(dealEvent, newDGEID) {
				var sdsRecords = getStoredDocSelectionMatrix(dealEvent, '-99');
				var updatedRecID = null;
				var dgeID = null;
				try {
					for (var i = 0; i < sdsRecords.length; i++) {
						dgeID = sdsRecords[i].getValue({
							name: 'custrecord_ds_doc_gen_event'
						});
						if (dgeID !== newDGEID) {
							updatedRecID = record.submitFields({
								type: 'customrecord_document_selection',
								id: sdsRecords[i].id,
								values: {
									custrecord_ds_doc_gen_event: newDGEID
								},
								options: {
									enableSourcing: false,
									ignoreMandatoryFields: true
								}
							});
						}
					}
				} catch (e) {
					var error = {
						title: 'UPDATE DOC SELECTION RECORD ERROR:',
						message: e.message,
						func: 'linkDGE2DocSelections',
						extra: null
					};
					handleError(error);
				}
			}

			function linkDGE2Documents(dealEvent, newDGEID) {
				var updatedRecID = null;
				try {
					var docSearch = search.create({
						type: 'customrecord_document_management',
						title: 'docs',
						columns: [{
							name: 'internalid'
						}],
						filters: [{
							name: 'custrecord_document_mpr',
							operator: search.Operator.IS,
							values: dealEvent
						}, {
							name: 'custrecord_doc_doc_gen_event',
							operator: search.Operator.NONEOF,
							values: newDGEID // Document Selection Suitelet
						}, {
							name: 'custrecord_doc_created_by_script',
							operator: search.Operator.IS,
							values: thisSuiteletID // Document Selection Suitelet
						}]

					}).run();
					
					var docRecords = getSearchResultData(docSearch);
					var docID = null;
					//log.debug('linkDGE2Documents', 'docRecords: ' + JSON.stringify(docRecords));
					for (var i = 0; i < docRecords.length; i++) {
						docID = docRecords[i].id;
						updatedRecID = record.submitFields({
							type: 'customrecord_document_management',
							id: docID,
							values: {
								custrecord_doc_doc_gen_event: newDGEID
							},
							options: {
								enableSourcing: false,
								ignoreMandatoryFields: true
							}
						});
					}
				} catch (e) {
					var error = {
						title: 'UPDATE DOC RECORD ERROR:',
						message: e.message,
						func: 'linkDGE2Documents',
						extra: null
					};
					handleError(error);
				}
			}

			function linkDGE2Log(dealEvent, newDGEID) {
				var updatedRecID = null;
				try {
					var logSearch = search.create({
						type: 'customrecord_doc_selection_appr_log',
						title: 'logs',
						columns: [{
							name: 'internalid'
						}],
						filters: [{
							name: 'custrecord_dsa_deal_event',
							operator: search.Operator.IS,
							values: dealEvent
						}, {
							name: 'custrecord_dsa_doc_gen_event',
							operator: search.Operator.NONEOF,
							values: newDGEID
						}]

					}).run();
				
					var logRecords = getSearchResultData(logSearch);
					var logID = null;
					//log.debug('linkDGE2Log', 'logRecords: ' + JSON.stringify(logRecords));
					for (var i = 0; i < logRecords.length; i++) {
						logID = logRecords[i].id;
						updatedRecID = record.submitFields({
							type: 'customrecord_doc_selection_appr_log',
							id: logID,
							values: {
								custrecord_dsa_doc_gen_event: newDGEID
							},
							options: {
								enableSourcing: false,
								ignoreMandatoryFields: true
							}
						});
					}
				} catch (e) {
					var error = {
						title: 'UPDATE LOG RECORD ERROR:',
						message: e.message,
						func: 'linkDGE2Log',
						extra: null
					};
					handleError(error);
				}
			}

			function postInitialize(context) {
				params = context.request.parameters;
				// log.debug('postInitialize', 'params: ' + JSON.stringify(params));
				sublistData = params.doc_sel_sublistdata.split(/\u0002/);
				// log.debug('postInitialize', 'sublistData: ' + JSON.stringify(sublistData));
				sublistFields = params.doc_sel_sublistfields.split(/\u0001/);
				// log.debug('postInitialize', 'sublistFields: ' + JSON.stringify(sublistFields));

				// Grab and store the Deal Event ID
				dealEvent = params.custpage_dealevent;

				// Build list of all DGEs linked to the Deal Event
				dgeList = buildDGEs(dealEvent);
				// log.debug('postInitialize', 'dgeList: ' + JSON.stringify(dgeList));

				postHandleDGESelection(context, dealEvent, dgeList, params);
				postHandleActionSelection(context, dealEvent, dgeList, params);

				if ((selectedStep && parseInt(selectedStep.action) === 'Delete DGE') || selectedDGEID === 0) {} else {
					// Get the Cell Field Type
					selectedCellFieldType = params.custpage_cell_field;

					// Get doc template count
					formColCount = parseInt(params.custpage_doctemplcount) + 4;

					// Get security type count
					sectypecount = params.custpage_sectypecount;

					// Get ex rec group count
					exrecgpcount = params.custpage_exrecgpcount;

					// Get all Document Selection rows for the Deal Event
					sdsList = buildStoredDocSelections(dealEvent, '-99');
				}
			}

			function deleteDGE(dealEvent, selectedDGEID) {
				//log.debug('deleteDGE', 'dealEvent: ' + JSON.stringify(dealEvent));
				//log.debug('deleteDGE', 'selectedDGEID: ' + JSON.stringify(selectedDGEID));
				var deletedDocSelList = deleteXJoinRows(parseInt(dealEvent), selectedDGEID);
				//log.debug('deleteDGE', 'deletedDocSelList: ' + JSON.stringify(deletedDocSelList));
				var deletedLogList = deleteDGELog(selectedDGEID);

				var deletedDGEID = record.delete({
					type: 'customrecord_doc_gen_event',
					id: selectedDGEID,
				});
				return deletedDGEID;
			}

			function deleteDGELog(selectedDGEID) {
				try {
					var logSearch = search.create({
						type: 'customrecord_doc_selection_appr_log',
						title: 'logs',
						columns: [{
							name: 'internalid'
						}],
						filters: [{
							name: 'custrecord_dsa_doc_gen_event',
							operator: search.Operator.IS,
							values: selectedDGEID
						}]
					});

					logSearch.run().each(function(result) {
						var logID = result.getValue({
							name: 'internalid'
						});
						record.delete({
							type: 'customrecord_doc_selection_appr_log',
							id: logID
						});

						return true;
					});
				} catch (e) {
					// email.send({
					// 	author: EMAIL_SENDER,
					// 	recipients: userEmailAddress,
					// 	subject: 'NetSuite Scheduled Script: ERROR',
					// 	body: 'An error has occured when attempting to delete log records ' + runtime.getCurrentScript().id + '\nERROR:' + '\n' + JSON.stringify(e)
					// });

					var error = {
						title: 'DELETE LOG RECORD ERROR:',
						message: e.message,
						func: 'deleteDGELog',
						extra: null
					};
					handleError(error);
				}
			}

			function postRereadDGEs(dealEvent) {
				dgeList = buildDGEs(dealEvent);
				if (deleteDGE) {
					selectedDGEID = null;
				}
				if (!selectedDGEID) {
					selectedDGEID = getDefaultDGE(dgeList); //Most recent incomplete DGE
				} else {
					if (newDGEID) {
						selectedDGEID = newDGEID;
					}
				}
				if (parseInt(selectedDGEID) !== -99) {
					selectedDGE = getDGE(selectedDGEID);
					//log.debug('postRereadDGEs', 'selectedDGE: ' + JSON.stringify(selectedDGE));
					if (selectedDGE) {
						selectedStepID = selectedDGE.step;
						//log.debug('postRereadDGEs', 'selectedStepID: ' + JSON.stringify(selectedStepID));
					}

					if (selectedStepID) {
						selectedStep = approvalProcess.getStep(parseInt(selectedStepID)) || null;
						//log.debug('postRereadDGEs', 'selectedStep: ' + JSON.stringify(selectedStep));
						if (selectedStep) {
							selectedStepSequence = parseInt(selectedStep.stepNum);
							//log.debug('postRereadDGEs', 'selectedStepSequence: ' + JSON.stringify(selectedStepSequence));
						}
					}
				}
			}

			function getHandleAction(selectedDGE) {
				// Get current step of defaulted DGE
				selectedStepID = selectedDGE.step;
				//log.debug('getHandleAction', 'selectedStepID: ' + JSON.stringify(selectedStepID));
				if (selectedStepID) {
					selectedStep = approvalProcess.getStep(parseInt(selectedStepID)) || null;
					//log.debug('getHandleAction', 'selectedStep: ' + JSON.stringify(selectedStep));
					if (selectedStep) {
						selectedStepSequence = parseInt(selectedStep.stepNum);
						//log.debug('getHandleAction', 'selectedStepSequence: ' + JSON.stringify(selectedStepSequence));
					}
				}
				selectedActionID = 9; // View
				//log.debug('getHandleAction', 'selectedActionID: ' + JSON.stringify(selectedActionID));
				if (selectedActionID) {
					selectedAction = approvalProcess.getStep(parseInt(selectedActionID)) || null;
					//log.debug('getHandleAction', 'selectedAction: ' + JSON.stringify(selectedAction));
				}

				// Set the current step = selected step 
				currentStepID = selectedDGE.step;
				//log.debug('getHandleAction', 'currentStepID: ' + currentStepID);
				if (currentStepID) {
					currentStep = approvalProcess.getStep(parseInt(currentStepID)) || null;
					log.debug('getHandleAction', 'currentStep: ' + JSON.stringify(currentStep));
					if (currentStep) {
						currentStepSequence = parseInt(currentStep.stepNum);
						log.debug('getHandleAction', 'currentStepSequence: ' + currentStepSequence);
					}
				}
			}

			function postHandleActionSelection(context, dealEvent, dgeList, params) {
				// Get the action field and act upon it
				action = JSON.parse(params[ACTION_FIELD_ID]);
				//log.debug('postHandleActionSelection', 'action: ' + JSON.stringify(action));

				// Get the user selected action
				selectedActionID = action.selectedActionID;
				//log.debug('postHandleActionSelection', 'selectedActionID: ' + JSON.stringify(selectedActionID));
				if (selectedActionID) {
					selectedAction = approvalProcess.getStep(parseInt(selectedActionID)) || null;
					//log.debug('postHandleActionSelection', 'selectedAction: ' + JSON.stringify(selectedAction));
				}

				// If user selected to see all DGEs then there should be no selectedStepID or currentStepID
				// Same if user wants to delete DGE 
				if (selectedDGEID !== -99 && parseInt(selectedDGEID) !== 0 && selectedAction && selectedAction.action !== 'Delete DGE') {
					// If there has not been a change in DGE then get 
					// the user selected step from the action field
					// otherwise selectedStepID should be set to the current step of the new DGE
					if (currentDGEID === selectedDGEID) {
						selectedStepID = action.selectedStepID;
					} else {
						selectedStepID = selectedDGE.step;
					}
					//log.debug('postHandleActionSelection', 'selectedStepID: ' + JSON.stringify(selectedStepID));
					if (selectedStepID) {
						selectedStep = approvalProcess.getStep(parseInt(selectedStepID)) || null;
						//log.debug('postHandleActionSelection', 'selectedStep: ' + JSON.stringify(selectedStep));
						if (selectedStep) {
							selectedStepSequence = parseInt(selectedStep.stepNum);
							//log.debug('postHandleActionSelection', 'selectedStepSequence: ' + JSON.stringify(selectedStepSequence));
						}
					}
					// Get the current step
					// If there has not been a change in DGE then get 
					// the user selected step from the action field
					// otherwise selectedStepID should be set to the current step of the new DGE
					if (currentDGEID === selectedDGEID) {
						currentStepID = parseInt(params.custpage_current_step_id);
					} else {
						currentStepID = selectedDGE.step;
					}
					// currentStepID = parseInt(params.custpage_current_step_id);
					//log.debug('postHandleActionSelection', 'currentStepID: ' + currentStepID);
					if (currentStepID) {
						currentStep = approvalProcess.getStep(parseInt(currentStepID)) || null;
						//log.debug('postHandleActionSelection', 'currentStep: ' + JSON.stringify(currentStep));
						if (currentStep) {
							currentStepSequence = parseInt(currentStep.stepNum);
							//log.debug('postHandleActionSelection', 'currentStepSequence: ' + currentStepSequence);
						}
					}
				}
			}

			function getHandleDGE(context, dealEvent, dgeList) {
				// log.debug('getHandleDGE', 'dgeList: ' + JSON.stringify(dgeList));
				// log.debug('getHandleDGE', 'dgeList.length: ' + dgeList.length);

				selectedDGEID = getDefaultDGE(dgeList); //Most recent incomplete DGE
				//log.debug('getHandleDGE', 'selectedDGEID: ' + selectedDGEID);
				if (selectedDGEID) {
					selectedDGE = getDGE(selectedDGEID);
					//log.debug('getHandleDGE', 'selectedDGE: ' + JSON.stringify(selectedDGE));
				}
				// Pass the selected Doc Gen Event record ID to the approval process library for its use
				approvalProcess.setRecordID(selectedDGEID);
			}

			function postHandleDGESelection(context, dealEvent, dgeList, params) {
				// Get and handle the Current DGE (the selected DGE ID before form submission)
				currentDGEID = parseInt(params.custpage_current_dge_id);
				//log.debug('postHandleDGESelection', 'currentDGEID: ' + currentDGEID);
				switch (currentDGEID) {
					case 0: // New DGE 
					case -99: // All DGEs
						break;
					default: // Individual DGEs
						currentDGE = getDGE(currentDGEID);
						break;
				}
				//log.debug('postHandleDGESelection', 'currentDGE: ' + JSON.stringify(currentDGE));

				// Get and handle the selected DGE ID
				// That includes creating a new DGE if requested
				selectedDGEID = parseInt(params.custpage_selected_dge_id);
				//log.debug('postHandleDGESelection', 'selectedDGEID: ' + selectedDGEID);
				switch (selectedDGEID) {
					case 0: // New DGE 
						// var newDGEID = newDGERequest(context, dealEvent, dgeList);
						break;
					case -99: // All DGEs
						break;
					default: // Individual DGEs
						selectedDGE = getDGE(selectedDGEID);
						break;
				}
				//log.debug('postHandleDGESelection', 'selectedDGE: ' + JSON.stringify(selectedDGE));

				// Pass the selected Doc Gen Event record ID to the approval process library for its use
				approvalProcess.setRecordID(selectedDGEID);
			}

			function getSelectedDGE(dgeList, selectedDGEID) {
				var found = false;
				for (var i = 0; i < dgeList.length; i++) {
					if (dgeList[i].docGenEvent === selectedDGEID) {
						found = true;
						break;
					}
				}
				if (found)
					return dgeList[i];
				else
					return null;
			}

			function storeDealEvent(form) {
				dealEventFormField = form.addField({
					id: 'custpage_dealevent',
					type: serverWidget.FieldType.TEXT,
					label: 'Deal Event'
				});

				dealEventFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});

				dealEventFormField.defaultValue = dealEvent;
			}

			// function addSignedDocField(form) {
			// 	signedDocFormField = form.addField({
			// 		id: 'custpage_signed_doc',
			// 		type: serverWidget.FieldType.TEXT,
			// 		label: 'Signed Doc'
			// 	});

			// 	signedDocFormField.updateDisplayType({
			// 		displayType: serverWidget.FieldDisplayType.HIDDEN
			// 	});

			// 	// signedDocFormField.defaultValue = null;
			// }

			function addCHSectionConfigFormField(form, DER) {
				var fieldHelpText = null;
				var CHSectionConfig = DER[0].getText({
					name: 'custrecord_de_ch_section_config'
				});

				CHSectionConfigFormField = form.addField({
					id: 'custpage_ch_section_config',
					type: serverWidget.FieldType.TEXT,
					label: 'Clearinghouse Section Configuration'
				});

				CHSectionConfigFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});

				CHSectionConfigFormField.defaultValue = CHSectionConfig;

				fieldHelpText = 'This is the Clearinghouse section configuration which applies to the Deal Event';
				CHSectionConfigFormField.setHelpText({
					help: fieldHelpText
				});
			}

			function storeStep(context, form, selectedStepID) {
				stepFormField = form.addField({
					id: 'custpage_current_step_id',
					type: serverWidget.FieldType.TEXT,
					label: 'Approval Process Step'
				});

				stepFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});

				stepFormField.defaultValue = selectedStepID;
			}

			function storeDGE(form, selectedDGEID) {
				currentDGEFormField = form.addField({
					id: 'custpage_current_dge_id',
					type: serverWidget.FieldType.TEXT,
					label: 'Doc Gen Event'
				});

				currentDGEFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});

				currentDGEFormField.defaultValue = selectedDGEID;
			}

			function retrieveAndDisplayJobStatuses(context, form, selectedStepID, selectedDGEID, selectedDGE, dealEventRec, selectedCellFieldType, documentCount) {

				var genDocJobStatus = null;
				var delDocJobStatus = null;
				var defaultStatusValue = null;
				if (parseInt(selectedDGEID) !== -99) {
					if (selectedDGE && parseInt(selectedStepID) === 5) {
						genDocJobStatus = getGenDocJobStatus(selectedDGE.genTaskID) || null;
						defaultStatusValue = 'Document Generation Status: ' + genDocJobStatus;
						defaultStatusValue += ' Document Count: ' + documentCount;
					} else {
						if (selectedDGE && selectedDGE.delTaskID) {
							delDocJobStatus = getDelDocJobStatus(selectedDGE.delTaskID) || null;
							if (parseInt(selectedStepID) === 1) {
								defaultStatusValue = 'Document Deletion status: ' + delDocJobStatus;
							} else {
								if (delDocJobStatus !== 'COMPLETE') {
									defaultStatusValue = 'Document Deletion Status: ' + delDocJobStatus;
									defaultStatusValue += ' Document Count: ' + documentCount;
								}
							}
						}
					}
				}
				addGenDelJobStatusField(form, defaultStatusValue);
			}

			function addGenDelJobStatusField(form, defaultStatusValue) {
				var fieldHelpText = null;
				jobStatusFormField = form.addField({
					id: 'custpage_scheduled_script_status',
					type: serverWidget.FieldType.TEXTAREA,
					label: 'Document Generation/Deletion Status'
				});
				jobStatusFormField.defaultValue = defaultStatusValue;
				jobStatusFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.READONLY
				});
				jobStatusFormField.updateBreakType({
					breakType: serverWidget.FieldBreakType.STARTCOL
				});
				fieldHelpText = 'This shows the status of document generation or deletion after such an action has been requested';
				jobStatusFormField.setHelpText({
					help: fieldHelpText
				});
			}

			function addFormHeaderFields(selectedDGEID, selectedStepID, form, dealEventRec, selectedCellFieldType) {
				// NOTE FOR KEN:
				// May be better to not offer the Delete Docs selection at all if docs have been signed.
				var currentStepSelOpt = null;
				var rejectText = null;
				var genDocJobStatus = null;
				var delDocJobStatus = null;
				var addRejectOption = false;

				VIEW_ACTION_ID = approvalProcess.getViewActionID();
				SAVE_ACTION_ID = approvalProcess.getSaveActionID();
				REJECT_ACTION_ID = approvalProcess.getRejectActionID();

				form.addSubmitButton({
					id: 'custpage_submit_button',
					label: 'Submit'
				});

				//This returns an object containing fields from the current step
				if (selectedStepID) {
					currentStepSelOpt = approvalProcess.getSubmitAction(user, selectedStepID);
					//log.debug('addFormHeaderFields', 'currentStepSelOpt: ' + JSON.stringify(currentStepSelOpt));
				}

				var actionSelectFormField = form.addField({
					id: ACTION_FIELD_ID,
					type: serverWidget.FieldType.SELECT,
					label: 'Action'
				});

				//Add a View option 
				actionSelectFormField.addSelectOption({
					value: JSON.stringify({
						selectedStepID: selectedStepID,
						selectedActionID: VIEW_ACTION_ID
					}),
					text: 'View'
				});
				// Only add other select options if the selected DGE is not "All"
				if (selectedDGEID !== -99) {
					//Add the Save option to the Approval Action select dropdown if the current step has Save = Yes
					if (currentStepSelOpt && currentStepSelOpt.save) {
						actionSelectFormField.addSelectOption({
							value: JSON.stringify({
								selectedStepID: selectedStepID,
								selectedActionID: SAVE_ACTION_ID
							}),
							text: currentStepSelOpt.save
						});
					}
					//If this step has a next step then add that step id to the Approval Action dropdown.  
					if (currentStepSelOpt && currentStepSelOpt.nextStepID && currentStepSelOpt.nextAction) {
						actionSelectFormField.addSelectOption({
							value: JSON.stringify({
								selectedStepID: currentStepSelOpt.nextStepID,
								selectedActionID: currentStepSelOpt.nextStepID
							}),
							text: currentStepSelOpt.nextAction
						});
					}
					//If this step has a previous step and Reject = Yes then add that step id to the Approval Action dropdown.  
					if (currentStepSelOpt && currentStepSelOpt.reject && currentStepSelOpt.prevStepID) {
						// If the Step is 5 (Docs Generated) then make sure user knows this is a delete docs moment 
						if (parseInt(selectedStepID) === 5) {
							// Check Document Generation job status and only offer this delete step if it is COMPLETE
							genDocJobStatus = getGenDocJobStatus(selectedDGE.genTaskID) || null;
							//log.debug('addFormHeaderFields', 'genDocJobStatus: ' + genDocJobStatus);
							if (genDocJobStatus === 'COMPLETE' || genDocJobStatus === 'UNKNOWN') {
								rejectText = 'Delete Documents and ' + currentStepSelOpt.reject;
								addRejectOption = true;
							}
						} else {
							addRejectOption = true;
							rejectText = currentStepSelOpt.reject;
						}
						if (addRejectOption) {
							actionSelectFormField.addSelectOption({
								value: JSON.stringify({
									selectedStepID: currentStepSelOpt.prevStepID,
									selectedActionID: REJECT_ACTION_ID
								}),
								text: rejectText
							});
						}
					}
					// If the DGE is at Step 1 then the Delete DGE option should be offered
					if (selectedStepID && parseInt(selectedStepID) === 1 && dgeList.length > 1) {
						// Check Document Deletion job status and only offer this DGE delete step if it is COMPLETE
						delDocJobStatus = getDelDocJobStatus(selectedDGE.delTaskID) || null;
						//log.debug('addFormHeaderFields', 'delDocJobStatus: ' + delDocJobStatus);
						if (delDocJobStatus === 'COMPLETE' || delDocJobStatus === 'UNKNOWN') {
							actionSelectFormField.addSelectOption({
								value: JSON.stringify({
									selectedStepID: '10',
									selectedActionID: '10'
								}),
								text: 'Delete Document Generation Event'
							});
						}
					}
				}

				actionSelectFormField.setHelpText({
					help: "Choose an action you would like performed when the Submit button is pressed."
				});

				addCellFieldTypeSelectField(form, selectedCellFieldType);


				addCurrentStatusField(selectedStepID, form);
				// Display Clearinghouse Section Configuration on form
				addCHSectionConfigFormField(form, dealEventRec);

				return null;
			}

			function addCellFieldTypeSelectField(form, selectedCellFieldType) {
				// log.debug('addCellFieldTypeSelectField', 'selectedCellFieldType: ' + selectedCellFieldType);
				var cellFieldTypeSelectField = form.addField({
					id: 'custpage_cell_field',
					type: serverWidget.FieldType.SELECT,
					label: 'Cell Field Type: '
				});
				//Add Options
				cellFieldTypeSelectField.addSelectOption({
					value: 'select',
					text: 'Select'
						// isSelected: true
				});
				cellFieldTypeSelectField.addSelectOption({
					value: 'checkbox',
					text: 'Checkbox'
				});
				cellFieldTypeSelectField.updateBreakType({
					breakType: serverWidget.FieldBreakType.STARTCOL
				});
				if (selectedCellFieldType) {
					cellFieldTypeSelectField.defaultValue = selectedCellFieldType;
				}
				cellFieldTypeSelectField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});
			}

			/**
			 * Adds the current status of the record being approved to the form
			 * @param {string} selectedStepID  Current approval status ID
			 * @param {object} form         The current Suitelet form being built
			 * @return {null} 				void
			 */
			function addCurrentStatusField(selectedStepID, form) {

				var dgeStatusFormField = form.addField({
					id: 'custpage_dge_status_display',
					type: serverWidget.FieldType.TEXT,
					label: 'Document Generation Event Status'
						// label: 'Current Step: ' + step.stepNum + ' of ' + NUM_STEPS
				});

				dgeStatusFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
				var formFieldValue = null;
				if (selectedStepID) {
					var NUM_STEPS = approvalProcess.getNumSteps();
					var step = approvalProcess.getStep(selectedStepID);
					formFieldValue = step.status;
				}
				dgeStatusFormField.defaultValue = formFieldValue;

				dgeStatusFormField.updateBreakType({
					breakType: serverWidget.FieldBreakType.STARTCOL
				});
				dgeStatusFormField.setHelpText({
					help: "Shows the status of the Document Generation Event"
				});

				return null;
			}

			function storeCounts(form) {
				// Now first get list of document templates for this Deal Event and store the count in a hidden screen field
				retrieveDocTemplates(form);

				// Now get list of security types for this Deal Event and store the count in a hidden screen field
				// Also - add the Document Selection sublist/tab to the form
				retrieveSecurityTypes(form);

				// Now get list of Exchange Record Groups for this Deal Event and store the count in a hidden screen field
				retrieveExRecGroups(form);

				// Create hidden field to hold signed document information to be used to intervene in a doc deletion request
				// addSignedDocField(form);
			}

			function retrieveDocTemplates(form) {
				docTemplates = buildDocTemplates(dealEvent);
				doctemplcount = docTemplates.length;
				doctemplcountFormField = form.addField({
					id: 'custpage_doctemplcount',
					type: serverWidget.FieldType.INTEGER,
					label: 'Document Template Count'
				});

				doctemplcountFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});

				doctemplcountFormField.defaultValue = docTemplates.length;
			}

			function retrieveSecurityTypes(form) {
				securityTypes = buildSecTypes(dealEvent);

				sectypecount = securityTypes.length;
				sectypecountFormField = form.addField({
					id: 'custpage_sectypecount',
					type: serverWidget.FieldType.INTEGER,
					label: 'Security Type Count'
				});

				sectypecountFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});

				sectypecountFormField.defaultValue = securityTypes.length;
			}
			/**
			 * Constructs a list of Doc Gen Event objects
			 * @return {array}             approval step linked list
			 */
			function buildSecTypes(dealEvent) {
				var secTypeRecs = null;

				secTypeRecs = getSecurityTypes(dealEvent);
				var secTypeList = [];
				var secType = null;
				for (var i = 0; i < secTypeRecs.length; i++) {
					secType = buildSecType(secTypeRecs[i]);
					secTypeList.push(secType);
				}

				return secTypeList;
			}

			/**
			 * Construct an individual doc gen event object
			 * @param  {object} step raw NetSuite search result
			 * @return {object}      formatted approval step
			 */
			function buildSecType(secType) {
				return {
					id: secType.getValue({
						name: 'custrecord_acq_lotce_3_src_certtype', //This is the DE0-T1) Certificate Type field on the LOT Certificate Entry record type
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot', //This is the Exchange Record field on the LOT Certificate Entry record type
						summary: search.Summary.GROUP,
						sort: search.Sort.ASC
					}) || null,
					name: secType.getText({
						name: 'custrecord_acq_lotce_3_src_certtype', //This is the DE0-T1) Certificate Type field on the LOT Certificate Entry record type
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot', //This is the Exchange Record field on the LOT Certificate Entry record type
						summary: search.Summary.GROUP,
						sort: search.Sort.ASC
					}) || null
				};
			}

			function addDocSelSublist(form) {
				// Now add the Document Selection Tab to the form
				docSelectionFormSublist = form.addSublist({
					id: 'doc_sel_sublist',
					type: serverWidget.SublistType.LIST,
					label: 'Document Selection'
				});
				// docSelectionFormSublist.helpText = "Help Text Goes Here."; // Nice - but I don't need it
				// docSelectionFormSublist.addMarkAllButtons(); // Does not work with selection type sublist fields only checkboxes
			}

			function retrieveExRecGroups(form) {

				exRecGps = buildExRecGps(dealEvent);
				exrecgpcount = exRecGps.length;

				exrecgpcountFormField = form.addField({
					id: 'custpage_exrecgpcount',
					type: serverWidget.FieldType.INTEGER,
					label: 'Ex Rec Group Count'
				});

				exrecgpcountFormField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});

				exrecgpcountFormField.defaultValue = exRecGps.length;
			}
			/**
			 * Constructs a list of Doc Gen Event objects
			 * @return {array}             approval step linked list
			 */
			function buildExRecGps(dealEvent) {
				var exRecGpRecs = null;

				exRecGpRecs = getExchRecGroups(dealEvent);
				var exRecGpList = [];
				var exRecGp = null;
				for (var i = 0; i < exRecGpRecs.length; i++) {
					exRecGp = buildExRecGp(exRecGpRecs[i]);
					exRecGpList.push(exRecGp);
				}

				return exRecGpList;
			}

			/**
			 * Construct an individual doc gen event object
			 * @param  {object} step raw NetSuite search result
			 * @return {object}      formatted approval step
			 */
			function buildExRecGp(exRecGp) {
				return {
					id: exRecGp.getValue({
						name: 'internalid', //The id of the exchange rec group
						summary: search.Summary.GROUP
					}) || null,
					name: exRecGp.getValue({
						name: 'name', //The name of the exchange rec group
						summary: search.Summary.MAX,
						sort: search.Sort.ASC
					}) || null
				};
			}

			function loadDSSublist(selectedDGEID, selectedDGE, dgeList, sdsList, dsSublist, securityTypes, exRecGps, docTemplates, selectedStepSequence) {

				// log.debug('loadDSSublist', 'sdsList: ' + JSON.stringify(sdsList));
				// log.debug('loadDSSublist', 'dsSublist: ' + JSON.stringify(dsSublist));
				addDSSublistColumns(selectedDGEID, selectedDGE, dgeList, sdsList, dsSublist, docTemplates);

				// Now store the security types in rows on the screen
				loadSecTypeRows(dsSublist, securityTypes);

				// Now store the ex rec grps in rows on the screen
				loadExRecGpRows(dsSublist, exRecGps);
				// log.debug('loadDSSublist', 'dsSublist: ' + JSON.stringify(dsSublist));

				// Now read the current document selection for this deal event and Doc Gen Event 
				// and check the boxes to display the current choice
				displayDocSelection(selectedDGEID, selectedDGE, dsSublist, sdsList, securityTypes, exRecGps, docTemplates, selectedStepSequence);
			}

			function addDSSublistColumns(selectedDGEID, selectedDGE, dgeList, sdsList, sublist, docTemplates) {
				// The Security Type column
				var secTypeColLabel = '<div style="font-weight: bold" title="Document distribution assigned';
				secTypeColLabel += ' as part of the Exchange Record group overrides document assignments at the Security Type level.';
				secTypeColLabel += ' An exchange record can belong to more than one Security Type group">Security Type</div>';

				sublist.addField({
					id: 'custpage_sectype',
					type: serverWidget.FieldType.TEXTAREA,
					label: secTypeColLabel
				});
				// The Exchange Record Group column
				// Add rollover text
				var exRecGpColLabel = '<div style="font-weight: bold" title="Document distribution assigned';
				exRecGpColLabel += ' as part of the Group overrides document assignments made at the Security Type level.';
				exRecGpColLabel += ' An exchange record cannot be part of more than one Exchange Record group">Group</div>';

				sublist.addField({
					id: 'custpage_exrecgp',
					type: serverWidget.FieldType.TEXTAREA,
					label: exRecGpColLabel

				});
				// The hidden Security Type ID column
				dsFormSublistSecTypeIDColumn = sublist.addField({
					id: 'custpage_sectypeid',
					type: serverWidget.FieldType.TEXT,
					label: 'Security Type ID'
				});
				dsFormSublistSecTypeIDColumn.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});
				// The hidden Ex Rec Gp ID column
				dsFormSublistExRecGpIDColumn = sublist.addField({
					id: 'custpage_exrecgpid',
					type: serverWidget.FieldType.TEXT,
					label: 'Group ID'
				});
				dsFormSublistExRecGpIDColumn.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});

				// Now add checkbox field for every Document Template
				addDocTemplSublistColumns(selectedDGEID, selectedDGE, dgeList, sdsList, sublist, docTemplates);
			}

			function loadSecTypeRows(sublist, securityTypes) {
				// log.debug('loadSecTypeRows', 'sublist: ' + JSON.stringify(sublist));
				var certtype = '';
				var certtypeID = null;
				var certtypeLink = '';
				var certtypeURL = '';
				for (var i = 0; i < sectypecount; i++) {
					certtype = securityTypes[i].name;
					certtypeID = securityTypes[i].id;

					// Make each certificate type a link to a saved search which shows all exchange records for the deal event and security type	
					certtypeURL = '/app/common/search/searchresults.nl?rectype=382&searchtype=Custom&CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD=';
					certtypeURL += dealEvent + '&BEV_CUSTRECORD_ACQ_LOTCE_3_SRC_CERTTYPE=';
					certtypeURL += certtypeID + '&style=NORMAL&report=&grid=&searchid=customsearch_exrecs_by_sectype';

					certtypeLink = '<div> <a href=' + certtypeURL + ' style="text-decoration: none;">' + certtype + '</a>';

					sublist.setSublistValue({
						id: 'custpage_sectype',
						line: i,
						value: certtypeLink
					});


					if (certtypeID && certtypeID !== '') {
						sublist.setSublistValue({
							id: 'custpage_sectypeid',
							line: i,
							value: certtypeID
						});
					}
				}

			}

			function loadExRecGpRows(sublist, exRecGps) {
				// log.debug('loadExRecGpRows', 'sublist: ' + JSON.stringify(sublist));
				var exRecGp = '';
				var exRecGpID = '';
				var exRecGpLink = '';
				var exRecGpURL = '';
				var subListRow = sectypecount;
				// var combinedRowCount = sectypecount + exrecgpcount;

				for (var k = 0; k < exrecgpcount; k++) {
					exRecGp = exRecGps[k].name;
					exRecGpID = exRecGps[k].id;
					// Make each exchange record group a link to a saved search which shows all exchange records for the deal event and exchange record group	
					exRecGpURL = '/app/common/search/searchresults.nl?rectype=382&searchtype=Custom&CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD=';
					exRecGpURL += dealEvent + '&CUSTRECORD_EXCH_REC_GROUP=';
					exRecGpURL += exRecGpID + '&style=NORMAL&report=&grid=&searchid=customsearch_exrecs_by_group';

					exRecGpLink = '<div> <a href=' + exRecGpURL + ' style="text-decoration: none;">' + exRecGp + '</a>';

					sublist.setSublistValue({
						id: 'custpage_exrecgp',
						line: subListRow,
						value: exRecGpLink
					});

					sublist.setSublistValue({
						id: 'custpage_exrecgpid',
						line: subListRow,
						value: exRecGpID
					});
					subListRow = subListRow + 1;
				}
			}

			function addDocTemplSublistColumns(selectedDGEID, selectedDGE, dgeList, sdsList, sublist, docTemplates) {
				log.debug('addDocTemplSublistColumns', 'docTemplates: ' + JSON.stringify(docTemplates));
				// Create a checkbox field for each document template linked to the Deal Event
				// log.debug('addDocTemplSublistColumns', 'sublist: ' + JSON.stringify(sublist));
				var cellFieldID = '';
				var docTemplColHead = '';
				var docTemplName = null;

				for (var j = 0; j < docTemplates.length; j++) {
					cellFieldID = 'custpage_col' + docTemplates[j].id;

					docTemplName = docTemplates[j].name;
					// NOTE TO KEN
					// Work this a bit more to break up doc templ names into fixed width chunks
					// log.debug('addDocTemplSublistColumns', 'docTemplName: ' + docTemplName);
					// docTemplName = docTemplName.replace(/.{20}/g, "$&" + "<br>");
					// log.debug('addDocTemplSublistColumns', 'docTemplName: ' + docTemplName);

					//Make 1st part of column heading a hyperlink to the external file location of the document template
					if (docTemplates[j].extLoc === '') {
						docTemplColHead = '<div style="font-weight: bold">' + docTemplates[j].name + '</div>';
					} else {
						// docTemplColHead = '<div> <a href=' + docTemplates[j].extLoc + ' style="text-decoration: none; font-weight: bold; display: inline-block; height: 50px">' + docTemplates[j].name + '</a> <br><br>';
						docTemplColHead = '<div> <a href=' + docTemplates[j].extLoc;
						docTemplColHead += ' style="text-decoration: none; font-weight: bold; height: 50px">';
						docTemplColHead += docTemplName + '</a> <br><br><style>td.listheadertd {width:200px;} ';
						docTemplColHead += 'td.listheadertdleft {width:200px;}</style></div>';
					}

					// Cell field type can be Select or Checkbox
					if (selectedCellFieldType === 'checkbox') {
						dsFormSublistDocTemplColumn = sublist.addField({
							id: cellFieldID,
							type: serverWidget.FieldType.CHECKBOX,
							label: docTemplColHead
						});
					} else { // field type = select
						//log.debug('addDocTemplSublistColumns', 'cellFieldID: ' + cellFieldID);
						dsFormSublistDocTemplColumn = sublist.addField({
							id: cellFieldID,
							type: serverWidget.FieldType.SELECT,
							label: docTemplColHead,
							source: ''
						});

						dsFormSublistDocTemplColumn.addSelectOption({
							value: JSON.stringify({
								dgeID: '-3',
								docTemplID: docTemplates[j].id
							}),
							text: ' '
						});
						//Add an option for each DGE 
						addOptionPerDGE(dsFormSublistDocTemplColumn, dgeList, docTemplates[j].id);
					}

					dsFormSublistDocTemplColumn.updateDisplaySize({
						height: 60,
						width: 100
					});

					if (parseInt(selectedDGEID) !== -99 && parseInt(selectedStepID) === 1 && userPermitted) { // 1.Selection in Progress and user has permission
					} else {
						dsFormSublistDocTemplColumn.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});
					}
				}
			}

			function setLabelWidth(anyString, width) {
				return anyString.replace(/.{width}/g, "$&" + "<br>");
			}

			function addOptionPerDGE(formField, dgeList, docTemplID) {
				var fieldText = null;
				for (var j = 0; j < dgeList.length; j++) {
					formField.addSelectOption({
						value: JSON.stringify({
							dgeID: dgeList[j].id,
							docTemplID: docTemplID
						}),
						text: dgeList[j].name
					});
				}
			}

			function displayDocSelection(selectedDGEID, selectedDGE, sublist, sdsList, securityTypes, exRecGps, docTemplates, selectedStepSequence) {
				// log.debug('displayDocSelection', 'sdsList: ' + JSON.stringify(sdsList));
				// log.debug('displayDocSelection', 'selectedDGEID: ' + selectedDGEID);
				// log.debug('displayDocSelection', 'exRecGps Length: ' + exRecGps.length);
				// var docTemplID = '';
				var cellFieldID = '';
				var certtypeID = null;
				var exRecGpID = null;
				var subListRow = null;
				var combinedRowCount = null;
				var DGEID = null;
				var DGEIDhtml = null;

				// First the security type rows
				for (var a = 0; a < securityTypes.length; a++) {
					// Get each cert type id
					certtypeID = securityTypes[a].id || null;
					exRecGpID = null;
					displayDSRow(selectedDGEID, selectedDGE, sublist, a, sdsList, certtypeID, exRecGpID, docTemplates, selectedStepSequence);
				}

				// Then the exchange rec groups rows
				combinedRowCount = securityTypes.length + exRecGps.length;
				for (var b = 0; b < exRecGps.length; b++) {
					// Get each ex rec gp id
					exRecGpID = exRecGps[b].id;
					certtypeID = null;
					subListRow = a + b;
					displayDSRow(selectedDGEID, selectedDGE, sublist, subListRow, sdsList, certtypeID, exRecGpID, docTemplates, selectedStepSequence);
				}
			}

			function displayDSRow(selectedDGEID, selectedDGE, sublist, sublistLineNbr, sdsList, certtypeID, exRecGpID, docTemplates, selectedStepSequence) {

				var cellFieldID = null;
				var docIsSelectedForCurrentDER = null;
				var showIt = false;
				var docIsSelectedForCurrentDGE = null;
				var dgeID = null;
				var dgeName = null;

				for (var b = 0; b < docTemplates.length; b++) {
					showIt = false;
					docIsSelectedForCurrentDER = isDocSelected(sdsList, certtypeID, exRecGpID, docTemplates[b].id);
					docIsSelectedForCurrentDGE = isDocSelectedForCurrentDGE(selectedDGEID, sdsList, certtypeID, exRecGpID, docTemplates[b].id);

					if (docIsSelectedForCurrentDER) {
						dgeID = docIsSelectedForCurrentDER;
						if (docIsSelectedForCurrentDGE) {
							dgeID = docIsSelectedForCurrentDGE;
						}
						// If current step is 1 then show selections for all DGEs only if cell type is select
						if (parseInt(selectedStepSequence) === 1 && selectedCellFieldType === 'select') {
							showIt = true;
						} else { //Any other step - show only current DGE unless it is a View All request
							if (docIsSelectedForCurrentDGE || selectedDGEID === -99) {
								showIt = true;
							}
						}
						if (showIt) {
							cellFieldID = 'custpage_col' + docTemplates[b].id;
							if (selectedCellFieldType === 'checkbox') {
								sublist.setSublistValue({
									id: cellFieldID,
									line: sublistLineNbr,
									value: 'T'
								});

							} else { // field type = select
								sublist.setSublistValue({
									id: cellFieldID,
									line: sublistLineNbr,
									value: JSON.stringify({
										dgeID: dgeID,
										docTemplID: docTemplates[b].id
									}),
								});
							}
						}
					}
				}
			}

			function isDocSelectedForCurrentDGE(docGenEvent, sdsList, certtypeID, exRecGpID, docTemplID) {
				var dgeID = null;
				for (var i = 0; i < sdsList.length; i++) {
					if (sdsList[i].certtype == certtypeID && sdsList[i].exRecGp == exRecGpID && sdsList[i].docTempl == docTemplID) {
						if (sdsList[i].docGenEvent == docGenEvent) {
							dgeID = sdsList[i].docGenEvent;
							break;
						}
					}
				}
				return dgeID;
			}

			function loadStatusChangeLogSublist(form, docGenEvent) {
				var sclSublist = form.addSublist({
					id: 'status_chg_log_sublist',
					type: serverWidget.SublistType.LIST,
					label: 'Status Change Log'
				});

				sclSublist.addField({
					id: 'logtimestamp',
					type: serverWidget.FieldType.TEXT,
					label: 'Timestamp'
				});
				sclSublist.addField({
					id: 'loguser',
					type: serverWidget.FieldType.TEXT,
					label: 'User'
				});
				sclSublist.addField({
					id: 'logbeforestatus',
					type: serverWidget.FieldType.TEXT,
					label: 'Before Status'
				});
				sclSublist.addField({
					id: 'usersubmitaction',
					type: serverWidget.FieldType.TEXT,
					label: 'User Action'
				});
				sclSublist.addField({
					id: 'logafterstatus',
					type: serverWidget.FieldType.TEXT,
					label: 'After Status'
				});

				// Now get all doc selection status change log recs
				var statusLogList = getStatusLog(docGenEvent);
				var statusLog = null;
				var statusLogCount = statusLogList.length;

				// Now add them to the sublist
				var logUser = '';
				var logTimeStamp = '';
				var logBeforeStatus = '';
				var logAfterStatus = '';
				var approvalAction = '';

				for (var sl = 0; sl < statusLogCount; sl++) {
					statusLog = statusLogList[sl];
					logUser = statusLog.getText({
						name: 'custrecord_dsa_approver',
					});

					sclSublist.setSublistValue({
						id: 'loguser',
						line: sl,
						value: logUser
					});

					logTimeStamp = statusLog.getValue({
						name: 'custrecord_dsa_timestamp',
					});
					sclSublist.setSublistValue({
						id: 'logtimestamp',
						line: sl,
						value: logTimeStamp
					});

					logBeforeStatus = statusLog.getText({
						name: 'custrecord_dsa_before_status',
					});
					sclSublist.setSublistValue({
						id: 'logbeforestatus',
						line: sl,
						value: logBeforeStatus || '--- Missing Data! ---'
					});

					approvalAction = statusLog.getText({
						name: 'custrecord_dsa_user_action',
					});
					sclSublist.setSublistValue({
						id: 'usersubmitaction',
						line: sl,
						value: approvalAction || '--- Missing Data! ---'
					});

					logAfterStatus = statusLog.getText({
						name: 'custrecord_dsa_after_status',
					});
					sclSublist.setSublistValue({
						id: 'logafterstatus',
						line: sl,
						value: logAfterStatus || '--- Missing Data! ---'
					});
				}

			}

			function newDGERequest(context, dealEvent, dgeList) {
				//log.debug('newDGERequest', 'dgeList: ' + JSON.stringify(dgeList));
				var newDGEID = null;
				// If an incomplete DGE already exists then don't create another 
				if (incompleteDGE(dgeList)) {
					//NOTE TO KEN - Catch this on the client side perhaps and display dialog 
					// log.debug('newDGERequest', 'incompleteDGE');
				} else {
					// log.debug('newDGERequest', 'incompleteDGE Does not Exist');
					try {
						newDGEID = createNewDGE(dealEvent, dgeList);
						// log.debug('newDGERequest', 'newDGEID: ' + newDGEID);
					} catch (e) {
						context.response.write(e.message + ' \n\nPlease notify the SRS Acquiom Technology Team');
						log.error('ERROR CREATING NEW DOC GEN EVENT:', e.message);
						handleError(e);
					}
				}
				return newDGEID;
			}

			function docTemplSelectedInOtherDGE(sdsList, docTemplID, docGenEvent) {
				// log.debug('docTemplSelectedInOtherDGE', 'docTemplID: ' + docTemplID);
				// log.debug('docTemplSelectedInOtherDGE', 'docGenEvent: ' + docGenEvent);
				var found = false;
				for (var i = 0; i < sdsList.length; i++) {
					if (sdsList[i].docTempl === docTemplID && sdsList[i].docGenEvent !== docGenEvent) {
						// log.debug('docTemplSelectedInOtherDGE', 'sdsList[i].docTempl: ' + sdsList[i].docTempl);
						// log.debug('docTemplSelectedInOtherDGE', 'sdsList[i].docGenEvent: ' + sdsList[i].docGenEvent);
						found = true;
					}
					if (found === true)
						break;
				}
				// log.debug('docTemplSelectedInOtherDGE', 'found: ' + found);
				return found;
			}

			function getStatusLog(docGenEvent) {
				var appsearch = search.create({
					type: APPROVAL_LOG_RECORD_TYPE,
					columns: [{
						name: 'custrecord_dsa_approver'
					}, {
						name: 'custrecord_dsa_timestamp',
						sort: search.Sort.DESC
					}, {
						name: 'custrecord_dsa_before_status'
					}, {
						name: 'custrecord_dsa_after_status'
					}, {
						name: 'custrecord_dsa_user_action'
					}],
					filters: [{
						name: 'custrecord_dsa_doc_gen_event',
						operator: search.Operator.IS,
						values: docGenEvent
					}]
				}).run();
				
				var searchResults = getSearchResultData(appsearch);
				return searchResults;
			}

			function getDealEvent(dealEvent) {
				var desearch = search.create({
					type: 'customrecord_payment_import_record',
					columns: [{
						name: 'name',
					}, {
						name: 'custrecord_de_ch_section_config',
					}, {
						name: 'custrecord_de_ds_ap_status', // Approval Process Status
					}, {
						name: 'custrecord_de_ds_ap_step', // Approval Process Step
					}, {
						name: 'custrecord_de_doc_del_task_id', // Doc Deletion Task ID
					}, {
						name: 'custrecord_de_doc_gen_task_id', // Doc Generation Task ID
					}, {
						name: 'custrecord_de_title', // Event Title
					}],
					filters: [{
						name: 'internalid',
						operator: search.Operator.IS,
						values: dealEvent
					}]
				}).run();
				
				var searchResults = getSearchResultData(desearch);
				return searchResults;
			}
			/**
			 * Constructs a list of Doc Gen Event objects
			 * @return {array}             approval step linked list
			 */
			function buildDGEs(dealEvent) {
				var dgeRecords = null;

				dgeRecords = getDocGenEvents(dealEvent);
				var dgeList = [];
				var dge = null;
				for (var i = 0; i < dgeRecords.length; i++) {
					dge = buildDGE(dgeRecords[i]);
					dgeList.push(dge);
				}

				return dgeList;
			}

			/**
			 * Construct an individual doc gen event object
			 * @param  {object} step raw NetSuite search result
			 * @return {object}      formatted approval step
			 */
			function buildDGE(dge) {
				return {
					id: dge.id,
					name: dge.getValue('name') || null,
					step: dge.getValue('custrecord_dge_ds_step') || null,
					stepName: dge.getText('custrecord_dge_ds_step') || null,
					status: dge.getValue('custrecord_dge_ds_status') || null,
					genTaskID: dge.getValue('custrecord_dge_gen_task_id') || null,
					delTaskID: dge.getValue('custrecord_dge_del_task_id') || null,
				};
			}

			/**
			 * Gets the step object from the list of steps
			 * @param  {integer} stepID ID of an approval step
			 * @return {object}        the approval step object
			 */
			function getDGE(DGEID) {
				if (!DGEID) {
					return null;
				}

				DGEID = parseInt(DGEID);
				for (var i = 0; i < dgeList.length; i++) {
					if (DGEID === parseInt(dgeList[i].id)) {
						return dgeList[i];
					}
				}

				return null;
			}

			function getDocGenEvents(dealEvent) {

				var dgesearch = search.create({
					type: 'customrecord_doc_gen_event',
					columns: [{
						name: 'internalid'
					}, {
						name: 'name'
					}, {
						name: 'custrecord_dge_ds_step'
					}, {
						name: 'custrecord_dge_ds_status'
					}, {
						name: 'custrecord_dge_gen_task_id'
					}, {
						name: 'custrecord_dge_del_task_id'
					}],
					filters: [{
						name: 'custrecord_dge_deal_event',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();

				var searchResults = getSearchResultData(dgesearch);
				return searchResults;
			}
			/**
			 * Constructs a list of Doc Template objects
			 * @return {array}     
			 */
			function buildDocTemplates(dealEvent) {
				var dtRecords = null;

				dtRecords = getDocTemplates(dealEvent);
				var dtList = [];
				var dt = null;
				for (var i = 0; i < dtRecords.length; i++) {
					dt = buildDocTemplate(dtRecords[i]);
					dtList.push(dt);
				}

				return dtList;
			}
			/**
			 * Construct an individual doc gen event object
			 * @param  {object} step raw NetSuite search result
			 * @return {object}      formatted approval step
			 */
			function buildDocTemplate(dt) {

				return {
					id: dt.getValue('custrecord_dedt_doc_template') || null, //The id of the document template
					name: dt.getValue({
						name: 'name', //The name of the document template
						join: 'custrecord_dedt_doc_template'
					}) || null,
					extLoc: dt.getValue({
						name: 'custrecord_dt_ext_file', //The external location of the actual document template
						join: 'custrecord_dedt_doc_template'
					}) || null,
					sortOrder: dt.getValue({
						name: 'custrecord_dt_sort_order', //The sort order field
						join: 'custrecord_dedt_doc_template',
						sort: search.Sort.ASC
					}) || null
				};
			}
			/**
			 * Constructs a list of Stored Doc Selection objects for the whole Deal Event
			 * @return {array}             approval step linked list
			 */
			function buildStoredDocSelections(dealEvent, docGenEvent) {
				var sdsRecords = null;
				sdsRecords = getStoredDocSelectionMatrix(dealEvent, docGenEvent);
				var sdsList = [];
				var sds = null;
				for (var i = 0; i < sdsRecords.length; i++) {
					sds = buildSDS(sdsRecords[i]);
					sdsList.push(sds);
				}
				return sdsList;
			}


			/**
			 * Construct an individual document selection row as an object
			 * @param  {object} sds  raw NetSuite search result
			 * @return {object}      formatted approval step
			 */
			function buildSDS(sds) {
				return {
					id: sds.id,
					dealEvent: sds.getValue('custrecord_ds_deal_event') || null,
					docGenEvent: sds.getValue('custrecord_ds_doc_gen_event') || null,
					dgeName: sds.getValue({
						name: 'name',
						join: 'custrecord_ds_doc_gen_event'
					}) || null,
					docTempl: sds.getValue('custrecord_ds_doc_template') || null,
					certtype: sds.getValue('custrecord_ds_cert_type') || null,
					exRecGp: sds.getValue('custrecord_ds_exrec_gp') || null,
					dtExtFile: sds.getValue({
						name: 'custrecord_dt_ext_file',
						join: 'custrecord_ds_doc_template'
					}) || null,
				};
			}

			function addDGESelectField(form, dgeList, selectedDGEID) {

				var isSelected = null;
				var dropdownSelectionHasBeenMade = false;
				var fieldHelpText = null;

				//Create Dropdown list showing the Doc Gen Events for this Deal Event
				dgeSelectFormField = form.addField({
					id: 'custpage_selected_dge_id',
					type: serverWidget.FieldType.SELECT,
					label: 'Document Generation Event'
				});

				if (dgeList.length > 1) {
					if (parseInt(selectedDGEID) === -99) {
						isSelected = true;
						dropdownSelectionHasBeenMade = true;
					} else {
						isSelected = false;
					}
					dgeSelectFormField.addSelectOption({
						value: '-99',
						text: 'All',
						isSelected: isSelected
					});
				}
				// If there is already a DGE with an incomplete status (Step Sequence not = 5) 
				// then don't give the user the option to create another 
				if (!incompleteDGE(dgeList)) {
					dgeSelectFormField.addSelectOption({
						value: '00',
						text: 'New'
					});
				}

				for (var j = 0; j < dgeList.length; j++) {
					isSelected = false;
					if (parseInt(dgeList[j].id) === parseInt(selectedDGEID)) {
						isSelected = true;
						dropdownSelectionHasBeenMade = true;
					} else if (dgeList[j].id === incompleteDGE(dgeList) && !dropdownSelectionHasBeenMade) {
						isSelected = true;
					}
					dgeSelectFormField.addSelectOption({
						value: dgeList[j].id,
						text: dgeList[j].name + ' (' + dgeList[j].stepName.trim() + ')',
						isSelected: isSelected
					});
				}
				fieldHelpText = 'Select an existing Document Generation Event or "All"';
				fieldHelpText += ' to see the selections for all DGEs or "New" to create a new DGE.';
				fieldHelpText += ' The option to create a new DGE is only offered when there is not already an "incomplete" DGE in progress';
				dgeSelectFormField.setHelpText({
					help: fieldHelpText
				});

			}

			function getDefaultDGE(dgeList) {
				var defaultDGE = null;
				var dgeID = null;
				var dgeStep = null;
				var j = null;
				// First - if there is only one then use it
				if (dgeList.length === 1) {
					defaultDGE = dgeList[0].id;
					// else - check for one that is incomplete	
				} else {
					for (j = 0; j < dgeList.length; j++) {
						dgeID = dgeList[j].id;
						dgeStep = dgeList[j].step;
						if (dgeStep !== '5') {
							defaultDGE = dgeID;
							break;
						}
					}
				}
				// If still no luck then pick the highest id (most recent)
				if (!defaultDGE && dgeList.length > 0) {
					defaultDGE = dgeList[j - 1].id;
				}
				return defaultDGE;
			}

			function incompleteDGE(dgeList) {
				var incompleteDGE = null;
				for (j = 0; j < dgeList.length; j++) {
					dgeID = dgeList[j].id;
					dgeStep = dgeList[j].step;
					if (dgeStep !== '5') {
						incompleteDGE = dgeID;
						break;
					}
				}
				return incompleteDGE;
			}

			function createNewDGE(dealEvent, dgeList) {
				var lastDGEName = null;
				var newDGEName = null;
				var newDGENbr = null;
				var derRecord = null;
				var step = null;
				var status = null;
				var genTaskID = null;
				var delTaskID = null;
				// If there is already at least one DGE for the Deal Event then try to determine the name of the new DGE
				// based on what is there already
				if (dgeList.length > 0) {
					// Set name to whatever integer is found in the last DGE and add 1				
					lastDGEName = dgeList[dgeList.length - 1].name;
					//log.debug('createNewDGE', 'lastDGEName: ' + dgeList[dgeList.length - 1].name);
					newDGENbr = parseInt(lastDGEName.substr(lastDGEName.search('-') + 1, 3).trim()) + 1;
					//log.debug('createNewDGE', 'newDGENbr: ' + newDGENbr);
					newDGEName = dealEvent + '-' + newDGENbr;
					// newDGEName = parseInt(dgeList[dgeList.length - 1].name) + 1;
					// If that results in a non number then make the name the DGE count plus 1
					if (isNaN(newDGENbr)) {
						newDGEName = dealEvent + '-' + parseInt(dgeList.length + 1).toString();
					} else {
						newDGEName = newDGEName.toString();
					}
					step = 1;
				} else {
					//log.debug('createNewDGE', 'Creating First DGE');
					// This is the first DGE for this Deal Event
					// We need to check if this Deal Event has ever been involved with Document Collection 
					// If so we need to get the current status and other details of possible document generations etc and
					// transfer that info to the DGE we are about to create
					newDGEName = dealEvent + '-1';
					derRecord = getDealEvent(dealEvent);
					if (derRecord[0].getValue({
							name: 'custrecord_de_ds_ap_step'
						})) {
						step = derRecord[0].getValue({
							name: 'custrecord_de_ds_ap_step'
						});
					} else {
						step = 1; // If we cannot tell what step the original generation was at then default to step 1
					}
					if (derRecord[0].getValue({
							name: 'custrecord_de_doc_gen_task_id'
						})) {
						genTaskID = derRecord[0].getValue({
							name: 'custrecord_de_doc_gen_task_id'
						});
					}
					if (derRecord[0].getValue({
							name: 'custrecord_de_doc_del_task_id'
						})) {
						delTaskID = derRecord[0].getValue({
							name: 'custrecord_de_doc_del_task_id'
						});
					}
				}

				var DGERec = record.create({
					type: 'customrecord_doc_gen_event'
				});
				DGERec.setValue({
					fieldId: 'name',
					value: newDGEName
				});
				DGERec.setValue({
					fieldId: 'custrecord_dge_deal_event',
					value: dealEvent
				});
				DGERec.setValue({
					fieldId: 'custrecord_dge_ds_step',
					value: step
				});
				DGERec.setValue({
					fieldId: 'custrecord_dge_ds_status',
					value: status
				});
				DGERec.setValue({
					fieldId: 'custrecord_dge_gen_task_id',
					value: genTaskID
				});
				DGERec.setValue({
					fieldId: 'custrecord_dge_del_task_id',
					value: delTaskID
				});
				var DGERecID = DGERec.save();
				return DGERecID;
			}

			function getSecurityTypes(dealEvent) {
				var sectypesearch = search.create({
					type: 'customrecord_acq_lot', //Exchange Record
					title: 'My Security Types',
					columns: [{
						name: 'custrecord_acq_lotce_3_src_certtype', //This is the DE0-T1) Certificate Type field on the LOT Certificate Entry record type
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot', //This is the Exchange Record field on the LOT Certificate Entry record type
						summary: search.Summary.GROUP,
						sort: search.Sort.ASC
					}],
					filters: [{
						name: 'custrecord_acq_lot_payment_import_record',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();
				
				var searchResults = getSearchResultData(sectypesearch);
				return searchResults;
			}

			function getExchRecGroups(dealEvent) {
				var exchRecGpSearch = search.create({
					type: 'customrecord_exch_rec_group', //Exchange Record Group
					title: 'Exchange Record Groups',
					columns: [{
						name: 'internalid', //The id of the exchange rec group
						summary: search.Summary.GROUP
					}, {
						name: 'name', //The name of the exchange rec group
						summary: search.Summary.MAX,
						sort: search.Sort.ASC
					}],
					filters: [{
						name: 'custrecord_erg_deal_event',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'internalid', //internal id of the exchange record member
						join: 'custrecord_exch_rec_group', //exchange record group field on exchange rec
						operator: search.Operator.GREATERTHAN,
						summary: search.Summary.COUNT,
						values: 0
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();
				
				var searchResults = getSearchResultData(exchRecGpSearch);
				return searchResults;
			}

			function getDocTemplates(dealEvent) {
				var docTemplSearch = search.create({
					type: 'customrecord_deal_event_doc_template',
					columns: [{
						name: 'custrecord_dedt_doc_template' //The id of the document template
					}, {
						name: 'custrecord_dt_sort_order', //The sort order field
						join: 'custrecord_dedt_doc_template',
						sort: search.Sort.ASC
					}, {
						name: 'name', //The name of the document template
						join: 'custrecord_dedt_doc_template',
						sort: search.Sort.ASC
					}, {
						name: 'custrecord_dt_ext_file', //The external location of the actual document template
						join: 'custrecord_dedt_doc_template'

					}],
					filters: [{
						name: 'custrecord_dedt_deal_event',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();

				var searchResults = getSearchResultData(docTemplSearch);
				return searchResults;
			}

			function isDocSelected(sdsList, certtypeID, exRecGpID, docTemplID) {

				var dgeID = null;
				for (var i = 0; i < sdsList.length; i++) {
					if (sdsList[i].certtype == certtypeID && sdsList[i].exRecGp == exRecGpID && sdsList[i].docTempl == docTemplID) {
						dgeID = sdsList[i].docGenEvent;
						break;
					}
				}
				return dgeID;
			}

			function getExchangeRecs(dealEvent) {
				var exchangeRecSearch = search.create({
					type: 'customrecord_acq_lot_cert_entry',
					title: 'xchrecs',
					columns: [{
						name: 'custrecord_acq_lotce_3_src_certtype',
						summary: search.Summary.GROUP,
						sort: search.Sort.ASC
					}, {
						name: 'custrecord_acq_lotce_zzz_zzz_parentlot', //Exchange Rec
						summary: search.Summary.GROUP,
						sort: search.Sort.ASC
					}, {
						name: 'custrecord_exch_rec_group', //Exchange Rec Gp
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot',
						summary: search.Summary.MAX,
					}],
					filters: [{
						name: 'custrecord_acq_lot_payment_import_record',
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'isinactive',
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot',
						operator: search.Operator.IS,
						values: 'F'
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();

				var searchResults = getSearchResultData(exchangeRecSearch);
				return searchResults;
			}

			function getGpExRecs(dealEvent) {
				var gpExRecSearch = search.create({
					type: 'customrecord_acq_lot',
					title: 'gpxchrecs',
					columns: [{
						name: 'internalid'
					}, {
						name: 'custrecord_exch_rec_group'
					}],
					filters: [{
						name: 'custrecord_acq_lot_payment_import_record',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'custrecord_exch_rec_group',
						operator: search.Operator.ISEMPTY
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();

				var searchResults = getSearchResultData(gpExRecSearch);
				return searchResults;
			}
			/**
			 * Determines if the Deal Event Document selection should be saved
			 * @param  {string} currentStepID   The old Deal Event Document Selection Aproval Process Step ID
			 * @param  {string} selectedStepID   The updated Deal Event Document Selection Aproval Process Step ID
			 * @param  {string} dealEvent     ID of this Deal Event
			 * @param  {array} sublistFields User selection of fields to configure for this Deal Event
			 * @param  {object} sublistData   Data of selection of fields to configure for this Deal Event
			 * @param  {number} sectypecount  Count of security types to configure for this Deal Event
			 * @param  {integer} formColCount  Count of selections of fields to configure for this Deal Event
			 * @return {null}               void
			 */
			function postUpdateDatabase(sdsList, selectedAction, currentStepSequence, selectedStepSequence, dealEvent, selectedDGE, docGenEvent, sublistFields, sublistData, sectypecount, exrecgpcount, formColCount) {
				switch (selectedStepSequence) {
					case 1: // Selection in Progress
						// Get all existing Document Selection rows for this Deal Event and delete and recreate them
						if (currentStepSequence && (selectedStepSequence >= currentStepSequence)) { // Not a rejection step
							deleteXJoinRows(dealEvent, docGenEvent);
							createXJoinRows(sdsList, sublistFields, sublistData, sectypecount, exrecgpcount, formColCount, dealEvent, docGenEvent);
						} else {
							//If we are here because user requested to delete all documents then do it
							if (currentStepSequence === 5) { // Docs generated was previous step
								if (selectedStepSequence != currentStepSequence) {
									// log.debug('postUpdateDatabase', 'deleting docs');
									var signedDoc = docAlreadySigned(dealEvent, docGenEvent);
									// signedDocFormField.defaultValue = signedDoc;
									//log.debug('postUpdateDatabase', 'signedDoc: ' + signedDoc);
									//log.debug('postUpdateDatabase', 'signedDoc: ' + JSON.stringify(signedDoc));
									if (signedDoc) {
										log.debug('postUpdateDatabase', 'No Documents were deleted because at least one has already been signed. ' + signedDoc.ID);
									} else {
										if (parseInt(selectedDGE.step) === 0) {
											log.debug('postUpdateDatabase', 'Not deleting docs. User should close window');
										} else {
											log.debug('postUpdateDatabase', 'Deleting Documents');
											docDelTaskID = deleteDocs(dealEvent, docGenEvent);
											log.debug('postUpdateDatabase', 'docDelTaskID: ' + docDelTaskID);
										}
									}
								}
							}
						}
						break;

					case 2: // Selection Completed - Sent For Review
						// Get all existing Document Selection rows for this Deal Event and delete and recreate them
						if (currentStepSequence && (selectedStepSequence >= currentStepSequence)) { // Not a rejection step
							deleteXJoinRows(dealEvent, docGenEvent);
							createXJoinRows(sdsList, sublistFields, sublistData, sectypecount, exrecgpcount, formColCount, dealEvent, docGenEvent);
						}
						break;
					case 5: // Document Generation
						if (selectedStepSequence > currentStepSequence) {
							// If the DGE shows that this step has already been performed then do not attempt to
							// generate docs once more. The user probably refreshed the screen and blew through the
							// Confirm form Resubmission dialog warning.
							if (parseInt(selectedDGE.step) === 5) {
								log.debug('postUpdateDatabase', 'Not generating docs. User should close window');
							} else {
								log.debug('postUpdateDatabase', 'Generating Documents');
								docGenTaskID = generateDocs(dealEvent, docGenEvent);
								var remainingUSAGE = runtime.getCurrentScript().getRemainingUsage();
            					log.audit("remainingUSAGE after docGenTaskID: ", remainingUSAGE);
								log.debug('postUpdateDatabase', 'docGenTaskID: ' + docGenTaskID);
							}
						}
						break;
					default:
						break;
				}

				return null;
			}

			function postCreateLogRecordEntry() {
				var timestamp = new Date();

				var fieldUpdates = [{
					// 	fieldId: 'custrecord_dsa_deal_event', 
					// 	value: dealEvent
					// }, {
					fieldId: 'custrecord_dsa_doc_gen_event',
					value: selectedDGEID
				}, {
					fieldId: 'custrecord_dsa_approver',
					value: user.id
				}, {
					fieldId: 'custrecord_dsa_timestamp',
					value: timestamp
				}, {
					fieldId: 'custrecord_dsa_before_step',
					value: parseInt(currentStepID)
				}, {
					fieldId: 'custrecord_dsa_after_step',
					value: selectedStepID
				}, {
					fieldId: 'custrecord_dsa_user_action',
					value: selectedActionID
				}];

				approvalProcess.createLogRec(fieldUpdates);
			}

			function deleteXJoinRows(dealEvent, docGenEvent) {
				var xjoins = getStoredDocSelectionMatrix(parseInt(dealEvent), docGenEvent);
				log.debug('deleteXJoinRows', 'xjoins: ' + JSON.stringify(xjoins));
				var xjoincount = xjoins.length;
				log.debug('deleteXJoinRows', 'xjoincount: ' + JSON.stringify(xjoincount));
				var deletedxjoinid = [];
				for (var x = 0; x < xjoincount; x++) {
					var xjoinid = xjoins[x].getValue({
						name: 'internalid'
					});
					deletedxjoinid[x] = record.delete({
						type: 'customrecord_document_selection',
						id: xjoinid
					});
				}
				return deletedxjoinid;
			}

			function createXJoinRows(sdsList, sublistFields, sublistData, sectypecount, exrecgpcount, formcolcount, dealEvent, docGenEvent) {
				// log.debug('createXJoinRows', 'sdsList: ' + JSON.stringify(sdsList));
				// log.debug('createXJoinRows', 'sectypecount: ' + sectypecount);
				// log.debug('createXJoinRows', 'exrecgpcount: ' + exrecgpcount);
				// log.debug('createXJoinRows', 'formcolcount: ' + formcolcount);
				// log.debug('createXJoinRows', 'docGenEvent: ' + docGenEvent);

				// First the security type selections
				var sublistStartingLineNbr = 0;
				storeSelections(sdsList, sublistFields, sublistData, sublistStartingLineNbr, sectypecount, formcolcount, dealEvent, docGenEvent);
				// Then the Exchange Rec Group selections
				sublistStartingLineNbr = sectypecount;
				storeSelections(sdsList, sublistFields, sublistData, sublistStartingLineNbr, exrecgpcount, formcolcount, dealEvent, docGenEvent);
			}

			function storeSelections(sdsList, sublistFields, sublistData, sublistStartingLineNbr, rowCount, formcolcount, dealEvent, docGenEvent) {
				// Now create xjoin rows
				var secTypeID = null;
				var exRecGpID = null;
				var docTemplID = null;
				var sublistLine = '';
				var sublistLineNbr = Number(sublistStartingLineNbr);
				var colID = '';
				var cell = null;
				var cellObj = null;
				var columns = [];
				var dgeID = null;
				var dgeName = null;

				for (var i = 0; i < rowCount; i++) {
					sublistLine = sublistData[sublistLineNbr];
					columns = sublistLine.split(/\u0001/);
					for (var j = 0; j < formcolcount; j++) {
						colID = sublistFields[j];
						if (colID.toLowerCase() == 'custpage_sectypeid') {
							secTypeID = columns[j] || null;
						}
						if (colID.toLowerCase() == 'custpage_exrecgpid') {
							exRecGpID = columns[j] || null;
						}
						if (colID.substring(0, 12).toLowerCase() === 'custpage_col') { // One of the doc template columns
							docTemplID = colID.substring(12, colID.length);
							// log.debug('storeSelections', 'docTemplID: ' + docTemplID);
							cell = columns[j];
							if (cell) {
								cellObj = JSON.parse(cell);
								// log.debug('storeSelections', 'cellObj: ' + JSON.stringify(cellObj));
								// I assume that when checkboxes are in use the only checked boxes are for the selected DGE
								// When a 'select' field is used then I expect the user to have chosen the selected DGE 
								if ((selectedCellFieldType === 'checkbox' && cell == 'T') || (selectedCellFieldType === 'select' && cellObj.dgeID == docGenEvent)) {
									// Create one xjoin row whether this same selection has previously been made in a prior Doc Gen Event or not
									// The user has already been warned via the client script and has opted to continue
									// Note that no Exchange Record will ever be allocated the same document (template) twice
									createXJoinRow(dealEvent, docGenEvent, secTypeID, exRecGpID, docTemplID);
								}
							}
						}
					}
					sublistLineNbr++;
				}
			}

			function createXJoinRow(dealEvent, docGenEvent, secTypeID, exRecGpID, docTemplID) {
				// log.debug('createXJoinRow', 'Creating');
				var xJoinRec = record.create({
					type: 'customrecord_document_selection'
				});
				xJoinRec.setValue({
					fieldId: 'custrecord_ds_deal_event',
					value: dealEvent
				});
				xJoinRec.setValue({
					fieldId: 'custrecord_ds_doc_gen_event',
					value: docGenEvent
				});
				xJoinRec.setValue({
					fieldId: 'custrecord_ds_cert_type',
					value: secTypeID
				});
				xJoinRec.setValue({
					fieldId: 'custrecord_ds_exrec_gp',
					value: exRecGpID
				});

				xJoinRec.setValue({
					fieldId: 'custrecord_ds_doc_template',
					value: docTemplID
				});
				var xJoinRecID = xJoinRec.save();
			}
			/**
			 * Looks for any mapreduce script for this Deal Event
			 * and returns the status if any are not complete
			 * @return {string}     mapreduce script job status
			 */
			function getGenDocJobStatus(docGenTaskID) {
				var genTaskStatus;
				try {
					// genTaskStatus = docGenTaskID ? task.checkStatus(docGenTaskID).status : 'NONE';
					genTaskStatus = task.checkStatus(docGenTaskID).status;
				} catch (e) {
					genTaskStatus = 'UNKNOWN';
					log.error('ERROR CHECKING Map/Reduce SCRIPT STATUS:', e);
				}
				//log.debug('getGenDocJobStatus', 'genTaskStatus: ' + genTaskStatus);

				return genTaskStatus;
			}

			function getDelDocJobStatus(docDelTaskID) {
				var delTaskStatus;
				try {
					delTaskStatus = task.checkStatus(docDelTaskID).status;
				} catch (e) {
					delTaskStatus = 'UNKNOWN';
					log.error('ERROR CHECKING SCHEDULED SCRIPT STATUS:', e);
				}
				//log.debug('getDelDocJobStatus', 'delTaskStatus: ' + delTaskStatus);

				return delTaskStatus;
			}

			/**
			 * Builds the map/reduce script task for document generation
			 * @param  {integer} thisSuiteletID internal ID of this suitelet
			 * @param  {integer} dealEvent      internal ID of the Deal Event associated with the records
			 * @return {object}                map/reduce script for document generation
			 */
			function createDocGenTask(thisSuiteletID, dealEvent, docGenEvent) {
				log.debug('createDocGenTask', 'thisSuiteletID: ' + thisSuiteletID);
				log.debug('createDocGenTask', 'dealEvent: ' + dealEvent);
				log.debug('createDocGenTask', 'docGenEvent: ' + docGenEvent);
				var scriptID = DOC_GENERATE_SCRIPT_ID;
				var generateDocsTask = task.create({
					taskType: task.TaskType.MAP_REDUCE,
					scriptId: scriptID,
					params: {
						custscript_mrdg_deal_event: dealEvent, //PRODUCTION WATCH
						custscript_mrdg_doc_gen_event: docGenEvent,
						custscript_mrdg_launch_script: thisSuiteletID,
						custscript_mrdg_user_email: user.email
					}

				});

				return generateDocsTask;
			}

			/**
			 * Builds the scheduled script task for document deletion
			 * @param  {integer} thisSuiteletID internal ID of this suitelet
			 * @param  {integer} dealEvent      internal ID of the Deal Event associated with the records
			 * @return {object}                scheduled script for document deletion
			 */
			function createDocDelTask(thisSuiteletID, dealEvent, docGenEvent) {
				var scriptID = DOC_DELETE_SCRIPT_ID;
				var deleteDocsTask = task.create({
					taskType: task.TaskType.SCHEDULED_SCRIPT,
					scriptId: scriptID,
					params: {
						custscript_dd_deal_event: dealEvent, //PRODUCTION WATCH
						custscript_dd_doc_gen_event: docGenEvent,
						custscript_dd_launch_script: thisSuiteletID,
						custscript_dd_user_email: user.email
					}

				});
				// log.debug('createDocDelTask', 'deleteDocsTask: ' + JSON.stringify(deleteDocsTask));
				return deleteDocsTask;
			}

			/**
			 * Adds a map/reduce script to the execution queue in NetSuite
			 * to generate document records for the Deal Event
			 * @param  {number} dealEvent the internal ID of the Deal Event associated with documents
			 * @return {null}           void
			 */
			function generateDocs(dealEvent, docGenEvent) {

				var generateDocsTask = createDocGenTask(thisSuiteletID, dealEvent, docGenEvent);
				docGenTaskID = generateDocsTask.submit();

				return docGenTaskID;
			}

			/**
			 * Adds a scheduled script to the execution queue in NetSuite
			 * to delete generated document records for the Deal Event
			 * @param  {number} dealEvent the internal ID of the Deal Event associated with documents
			 * @return {null}           void
			 */
			function deleteDocs(dealEvent, docGenEvent) {
				var deleteDocsTask = createDocDelTask(thisSuiteletID, dealEvent, docGenEvent);
				docDelTaskID = deleteDocsTask.submit();

				return docDelTaskID;
			}

			function docAlreadySigned(dealEvent, docGenEvent) {
				//log.debug('docAlreadySigned', 'dealEvent: ' + JSON.stringify(dealEvent));
				//log.debug('docAlreadySigned', 'docGenEvent: ' + JSON.stringify(docGenEvent));

				var signedDocList = findSignedDoc(dealEvent, docGenEvent);
				//log.debug('docAlreadySigned', 'signedDocList: ' + JSON.stringify(signedDocList));

				var signedDoc = null;
				if (signedDocList.length > 0) {
					//log.debug('docAlreadySigned', 'signedDocList Count: ' + JSON.stringify(signedDocList.length));
					var signedDocID = signedDocList[0].getValue({
						name: 'internalid',
					}) || null;
					var signedDocSignedStatus = signedDocList[0].getText({
						name: 'custrecord_doc_signed_status',
					}) || null;
					var signedDocDGEID = signedDocList[0].getText({
						name: 'custrecord_doc_doc_gen_event',
					}) || null;
					var signedDocEsign = signedDocList[0].getText({
						name: 'custrecord_doc_backup_link',
					}) || null;
					var signedDocEsignJSON = signedDocList[0].getText({
						name: 'custrecord_echosign_json',
					}) || null;
					signedDoc = JSON.stringify({
						dgeID: signedDocDGEID,
						count: signedDocList.length,
						id: signedDocID,
						signedStatus: signedDocSignedStatus,
						esign: signedDocEsign,
						esignJSON: signedDocEsignJSON
					});
				}
				return signedDoc;
			}

			function findSignedDoc(dealEvent, docGenEvent) {
				var signedDocSearch = search.create({
					type: 'customrecord_document_management',
					title: 'signed docs',
					columns: [{
						name: 'internalid'
					}, {
						name: 'custrecord_doc_doc_gen_event'
					}, {
						name: 'custrecord_doc_signed_status'
					}, {
						name: 'custrecord_doc_backup_link'
					}, {
						name: 'custrecord_echosign_json'
					}],
					filters: [{
						name: 'custrecord_document_mpr',
						operator: search.Operator.IS,
						values: dealEvent
					}, {
						name: 'custrecord_doc_doc_gen_event',
						operator: search.Operator.IS,
						values: docGenEvent
					}, {
						name: 'custrecord_doc_signed_status',
						operator: search.Operator.NONEOF,
						values: '@NONE@'
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();

				var searchResults = getSearchResultData(signedDocSearch);
				return searchResults;
			}

			function getStoredDocSelectionMatrix(dealEvent, docGenEvent) {
				var filters = [{
					name: 'custrecord_ds_deal_event',
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}];
				// Add the DGE filter if the user has not requested to see ALL DGEs
				if (docGenEvent !== '-99') {
					filters.push({
						name: 'custrecord_ds_doc_gen_event',
						operator: search.Operator.IS,
						values: docGenEvent
					});
				}
				var xjoinsearch = search.create({
					type: 'customrecord_document_selection',
					title: 'XjoinRows',
					columns: [{
						name: 'internalid',
						sort: search.Sort.DESC
					}, {
						name: 'name',
						join: 'custrecord_ds_doc_template'
					}, {
						name: 'custrecord_ds_cert_type'
					}, {
						name: 'custrecord_ds_deal_event'
					}, {
						name: 'custrecord_ds_doc_gen_event'
					}, {
						name: 'custrecord_ds_exrec_gp'
					}, {
						name: 'custrecord_ds_doc_template'
					}, {
						name: 'custrecord_dt_ext_file',
						join: 'custrecord_ds_doc_template'
					}, {
						name: 'name',
						join: 'custrecord_ds_doc_gen_event'
					}],
					filters: filters
				}).run();

				var searchResults = getSearchResultData(xjoinsearch);
				return searchResults;
			}
			/**
			 * Updates the Audit Trail Record for this Deal Event
			 * with the User and time an action was performed
			 * @param  {string} selectedStepID The new Approval Process Step ID of the Deal Event Doc Config that will be updated
			 * @param  {string} dealEvent    ID of this Deal Event Record
			 * @return {null}             void
			 */
			function postUpdateDGERecord(docGenEvent, selectedStepID, docGenTaskID, docDelTaskID) {
				var timestamp = new Date();
				var dgeRecord = record.load({
					type: RECORD_TYPE,
					id: docGenEvent
				});

				dgeRecord.setValue({
					fieldId: APPROVAL_STEP_FIELD,
					value: selectedStepID
				});

				if (docGenTaskID) {
					dgeRecord.setValue({
						fieldId: DOC_GENERATE_TASK_FIELD,
						value: docGenTaskID
					});
				}

				if (docDelTaskID) {
					dgeRecord.setValue({
						fieldId: DOC_DELETE_TASK_FIELD,
						value: docDelTaskID
					});
				}
				// Save this record
				dgeRecord.save({
					enableSourcing: true
				});
			}

			/**
			 * Takes a Search.ResultSet object and grabs all the results
			 * by cycling through using getRange()
			 * @param  {Object} resultSet The results of a NetSuite saved search 
			 * (Search.ResultSet object)
			 */
			function getSearchResultData(resultSet) {
				var all = [],
					results = [],
					batchSize = 1000,
					startIndex = 0,
					endIndex = batchSize;

				do {
					results = resultSet.getRange({
						start: startIndex,
						end: endIndex
					});
					all = all.concat(results);
					startIndex += batchSize;
					endIndex += batchSize;
				} while (results.length == batchSize);
				return all;
			}
			/**
			 * Handles error logging and display
			 * @param  {object} e custom error object
			 * @return {Error}   new custom Error
			 */
			function handleError(e) {
				log.debug('handleError', 'e: ' + e);
				var error = e.title + '\n\t@documentSelectionSuitelet->' + e.func + '\n\t\t' + e.message;
				if (e.extra) {
					error += '\n\t\t(Additional Info: ' + e.extra + ')';
				}
				httpContext.response.write(error);
				log.error(e.title, e.message);
				throw new Error(error);
			}

			return {
				onRequest: onRequest
			};
		});