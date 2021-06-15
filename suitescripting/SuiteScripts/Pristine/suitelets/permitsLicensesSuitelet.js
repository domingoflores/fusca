	/**
	 *@NApiVersion 2.x
	 *@NScriptType Suitelet
	 */

	define(['N/ui/serverWidget', 'N/search', 'N/http', 'N/runtime', 'N/record', 'N/redirect', 'N/task'],


		function(serverWidget, search, http, runtime, record, redirect, task) {
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

			// Form fields
			var taskID = null;
			var dealEventFormField = null;
			var stepFormField = null;
			var CHSectionConfigFormField = null;
			var currentDGEFormField = null;

			function onRequest(context) {

				httpContext = context;

				if (runtime.envType === 'SANDBOX') {
					DEVELOPMENT = true;
				}
				log.debug('PermitsLicensesSuitelet invoked in ', runtime.envType);

			

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
				var error = e.title + '\n\t@permitsLicensesSuitelet->' + e.func + '\n\t\t' + e.message;
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