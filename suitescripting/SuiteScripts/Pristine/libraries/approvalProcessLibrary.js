/**
 * approvalProcessLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/record', 'N/runtime'],


	/**
	 * -----------------------------------------------------------
	 * approvalProcessLibrary.js
	 * ___________________________________________________________
	 * Module contains helper methods for generating and approval
	 * process for a given set of records
	 *
	 * Version 1.0
	 * Author: Peter Gail
	 *
	 * Version 2.0 2017-08-04
	 * Author: Ken Crossman - Enabling multiple authorized Departments or Roles per Step
	 * _________________________________________________________________________________
	 */

	function(serverWidget, search, file, record, runtime) {
		"use strict";


		// PRODUCTION WATCH
		var DEVELOPMENT = false;

		var RECORD_ID = null;
		var SUBMIT_FIELD_ID = null;

		var USER;
		var RECORD_TYPE_ID;
		var APPROVAL_STEP_FIELD; //Contains the internal id of the Approval Step ID field as read from the Deal Eventrecord
		var LOG_RECORD_TYPE_ID;
		var NUM_STEPS = 0;
		var SAVE_ACTION_ID;
		var REJECT_ACTION_ID;
		var VIEW_ACTION_ID = null;
		var BUSINESS_PROCESS_ID;
		var restrictions;
		var approvalSteps;
		var httpContext = null;
		var userPermitted = false;

		/**
		 * Initialize the library with default values
		 * @param  {object} user           NetSuite User object
		 * @param  {string} recordType     NetSuite Record Type ID
		 * @param  {string} approvalStepField NetSuite Field ID of the Approval Step ID field for this record
		 * @param  {string} logRecordType  NetSuite Record Type ID for the log record
		 * @param  {string} subSystem   	User Action Record Subsystem Type
		 * @return {null}                void
		 */
		function initialize(user, recordType, approvalStepField, logRecordType, businessProcessID) {
			// PRODUCTION WATCH: uncomment for production
			// if (runtime.envType === 'SANDBOX') {
			// 	DEVELOPMENT = true;
			// }

			USER = user;
			RECORD_TYPE_ID = recordType;
			APPROVAL_STEP_FIELD = approvalStepField;
			LOG_RECORD_TYPE_ID = logRecordType;
			BUSINESS_PROCESS_ID = businessProcessID;
			configureRestrictionTypes();
			businessProcesses = getBusinessProcessTypes();
			approvalSteps = buildApprovalSteps(); //Constructs a list of approval step objects
			return null;
		}



		/* ---------------- GET/SET METHODS ---------------- */

		/**
		 * Set the NetSuite Context of the request
		 * @param {object} context NetSuite Request context
		 * @return {null} 				void
		 */
		function setContext(context) {
			httpContext = context;
			return null;
		}

		/**
		 * Set the Record ID
		 * @param {string} recID desired ID of the current Record
		 * @return {null} 				void
		 */
		function setRecordID(recID) {
			RECORD_ID = recID.toString();
			return null;
		}

		/**
		 * Makes the record ID public
		 * @return {string} Record ID
		 */
		function getRecordID() {
			return RECORD_ID;
		}
		/**
		 * Makes the SaveActionID public
		 * @return {string} Record ID
		 */
		function getSaveActionID() {
			return SAVE_ACTION_ID;
		}
		/**
		 * Makes the RejectActionID public
		 * @return {string} Record ID
		 */
		function getRejectActionID() {
			return REJECT_ACTION_ID;
		}
		/**
		 * Makes the ViewActionID public
		 * @return {string} Record ID
		 */
		function getViewActionID() {
			return VIEW_ACTION_ID;
		}
		/**
		 * Makes the NUMSTEPS public
		 * @return {string} Record ID
		 */
		function getNumSteps() {
			return NUM_STEPS;
		}
		/**
		 * Makes the UserPermittedFlag public
		 * @return {string} Record ID
		 */
		function getUserPermittedFlag() {
			// log.debug('getUserPermittedFlag', 'userPermitted: ' + userPermitted);
			return userPermitted;
		}

		/**
		 * Set the submit button field ID
		 * @param {string} fieldID desired submit button field ID
		 * @return {null} 				void
		 */
		function setSubmitFieldID(fieldID) {
			SUBMIT_FIELD_ID = fieldID;
			return null;
		}

		/**
		 * Makes the submit button field ID public
		 * @return {string} subnmit button field ID
		 */
		function getSubmitFieldID() {
			return SUBMIT_FIELD_ID;
		}


		/* ----------------- STEP FUNCTIONS ----------------- */

		/**
		 * Constructs a list of approval step objects
		 * @return {array}             approval step linked list
		 */
		function buildApprovalSteps() {
			var stepRecords = null;

			stepRecords = approvalStepSearch();
			var stepList = [];
			var step = null;
			for (var i = 0; i < stepRecords.length; i++) {
				step = buildStep(stepRecords[i]);
				if (step.stepNum && parseInt(step.stepNum) > NUM_STEPS) {
					NUM_STEPS = parseInt(step.stepNum);
				}
				stepList.push(step);
			}
			getSaveRejectActionIDs(stepList);

			return stepList;
		}

		/**
		 * Construct an individual approval step object
		 * @param  {object} step raw NetSuite search result
		 * @return {object}      formatted approval step
		 */
		function buildStep(step) {
			return {
				id: step.id,
				name: step.getValue('name') || null,
				prevStepID: step.getValue('custrecord_ap_prev_step_id') || null,
				nextStepID: step.getValue('custrecord_ap_next_step_id') || null,
				stepNum: step.getValue('custrecord_ap_sequence') || null,
				status: step.getText('custrecord_ap_status'),
				action: step.getValue('custrecord_ap_action'),
				save: step.getText('custrecord_ap_save').toLowerCase() === 'yes' ? 'Save' : null,
				reject: step.getText('custrecord_ap_reject').toLowerCase() === 'yes' ? 'Return to step' : null,
				restrictionType: parseInt(step.getValue('custrecord_ap_restriction_type')) || null
			};
		}

		/**
		 * Gets the step object from the list of steps
		 * @param  {integer} stepID ID of an approval step
		 * @return {object}        the approval step object
		 */
		function getStep(stepID) {
			if (!stepID) {
				return null;
			}

			stepID = parseInt(stepID);
			for (var i = 0; i < approvalSteps.length; i++) {
				if (stepID === parseInt(approvalSteps[i].id)) {
					return approvalSteps[i];
				}
			}

			return null;
		}

		/**
		 * Builds and runs a record search for approval steps
		 * @return {array}        approval step search results
		 */
		function approvalStepSearch() {
			var businessProcName = getBusinessProcess(BUSINESS_PROCESS_ID).getValue('name');

			if (!businessProcName) {
				throw new Error("SEARCH RESULT ERROR FOR APPROVAL STEPS");
			}
			var stepSearch = search.create({
				type: 'customrecord_approval_process_step',
				columns: [{
					name: 'name'
				}, {
					name: 'custrecord_ap_business_process'
				}, {
					name: 'custrecord_ap_action'
				}, {
					name: 'custrecord_ap_sequence'
				}, {
					name: 'custrecord_ap_prev_step_id'
				}, {
					name: 'custrecord_ap_next_step_id'
				}, {
					name: 'custrecord_ap_restriction_type'
				}, {
					name: 'custrecord_ap_save'
				}, {
					name: 'custrecord_ap_reject'
				}, {
					name: 'custrecord_ap_status'
				}],
				filters: [{
					name: 'custrecord_ap_business_process',
					operator: search.Operator.IS,
					values: businessProcName
				}]
			});
			var searchResults = stepSearch.run().getRange({
				start: 0,
				end: 200
			});

			if (!searchResults[0] || searchResults[0] === '') {
				throw new Error("SEARCH RESULT ERROR FOR APPROVAL STEPS");
			}
			return searchResults;
		}
		/**
		 * Gets all approvers for a step
		 * @return {array} approvers search results
		 */
		function getApprovers(step) {
			var approversSearch = search.create({
				type: 'customrecord_approval_step_approver',
				columns: [{
					name: 'custrecord_asa_dept'
				}, {
					name: 'custrecord_asa_role'
				}],
				filters: [{
					name: 'custrecord_asa_approval_step',
					operator: search.Operator.IS,
					values: step.id
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});
			var searchResults = approversSearch.run().getRange({
				start: 0,
				end: 200
			});

			return searchResults;
		}

		/**
		 * Determines the interal ids of the Save or Reject user actions.
		 * Assumes that there will only be one "Save" and one "Reject" row
		 * among the steps. 
		 * The recognition criteria for those rows is as follows: 
		 *  1) The Sequence (stepNum) is negativea[]
		 *  2) The Prev and Next Steps should be blank
		 *  3) The Next Action field must = "Save" or "Reject" 
		 * @param  {array} stepList List of user actions
		 * @return {null}          void
		 */
		function getSaveRejectActionIDs(stepList) {
			var step = null;
			for (var i = 0; i < stepList.length; i++) {
				step = stepList[i];
				if ((parseInt(step.stepNum) < 0) && !step.prevStepID && !step.nextStepID) {
					if (step.action.toLowerCase() === 'save') {
						SAVE_ACTION_ID = step.id;
					} else if (step.action.toLowerCase() === 'reject') {
						REJECT_ACTION_ID = step.id;
					} else if (step.action.toLowerCase() === 'view') {
						VIEW_ACTION_ID = step.id;
					}
				}
			}

			return null;
		}

		/* ----------------- HELPER FUNCTIONS ----------------- */

		/**
		 * Gets the Business Process object from the list of Business Processes
		 * @param  {integer} businessProcessID ID of a Business Process
		 * @return {object}        the Business Process object
		 */
		function getBusinessProcess(businessProcessID) {
			if (!businessProcessID) {
				return null;
			}
			for (var i = 0; i < businessProcesses.length; i++) {
				if (parseInt(businessProcessID) === parseInt(businessProcesses[i].id)) {
					return businessProcesses[i];
				}
			}

			return null;
		}

		/**
		 * Builds and runs a record search for Business Process
		 * @return {array}        Business Process search results
		 */
		function getBusinessProcessTypes() {
			var businessProcessSearch = search.create({
				type: 'customrecord_business_process',
				columns: [{
					name: 'name'
				}]
			});
			var searchResults = businessProcessSearch.run().getRange({
				start: 0,
				end: 200
			});

			if (!searchResults[0] || searchResults[0] === '') {
				throw new Error("SEARCH RESULT ERROR FOR BUSINESS PROCESS TYPE");
			}

			return searchResults;
		}

		/**
		 * Builds and runs a record search for approval step restriction types
		 * and sets the restrictions mapper
		 * @return {null}        void
		 */
		function configureRestrictionTypes() {

			// PRODUCTION WATCH: ensure correct internal id
			restrictions = {
				DEPARTMENT: 1,
				ROLE: 2
			};

			return null;
		}

		/**
		 * Adds the current status of the record being approved to the form
		 * @param {string} approvalStepID  Current approval status ID
		 * @param {object} form         The current Suitelet form being built
		 * @return {null} 				void
		 */
		function addCurrentStatusField(approvalStepID, form) {

			var step = getStep(approvalStepID);
			log.debug('addCurrentStatusField', 'step: ' + JSON.stringify(step));
			var approvalStatusDisplay = form.addField({
				id: 'formselstatustext',
				type: serverWidget.FieldType.TEXT,
				label: 'Current Approval Step: ' + step.stepNum + ' of ' + NUM_STEPS
			});

			approvalStatusDisplay.updateDisplayType({
				displayType: serverWidget.FieldDisplayType.DISABLED
			});

			// Add the document selection status text field and populate it
			approvalStatusDisplay.defaultValue = step.status;

			return null;
		}

		/**
		 * Determine if the current user has sufficient
		 * permissions to perform an approval action
		 * @param  {object} step Approval proccess step
		 * @return {boolean}      If user has permission
		 */
		function userHasPermission(user, step) {
			if (DEVELOPMENT) {
				return true;
			}
			var approverList = getApprovers(step);
			var approverCount = approverList.length;
			var approvedDept = null;
			var userDept = user.department;
			var userRole = user.role;
			var i;
			switch (step.restrictionType) {

				case restrictions.DEPARTMENT:
					for (i = 0; i < approverList.length; i++) {
						approvedDept = parseInt(approverList[i].getValue({
							name: 'custrecord_asa_dept'
						}));
						if (userDept === approvedDept) {
							return true;
						}
					}
					break;
				case restrictions.ROLE:
					for (i = 0; i < approverList.length; i++) {
						approvedRole = parseInt(approverList[i].getValue({
							name: 'custrecord_asa_role'
						}));
						if (userRole === approvedRole) {
							return true;
						}
					}
					break;
				default:
					return true;
			}
		}

		/**
		 * Adds the review section on the form where a user can approve/reject a selection
		 * @param {string} approvalStepID  Current approval status ID
		 * @param {object} form         The current Suitelet form being built
		 * @return {null} 				void
		 */
		function addReviewSectionFields(approvalStepID, form) {
			log.debug('addReviewSectionFields', 'approvalStepID: ' + JSON.stringify(approvalStepID));
			form.addFieldGroup({
				id: 'record_review_approve',
				label: 'Review & Approval'
			});
			//This returns the submit button values for a given user - effectively an object containing fields from the current step
			var actionOptions = getSubmitAction(USER, approvalStepID);
			// log.debug('addReviewSectionFields', 'actionOptions: ' + JSON.stringify(actionOptions));

			// Only add the select field if the step has a next action or a save or reject option
			// if (actionOptions && (actionOptions.nextAction || actionOptions.save || actionOptions.reject)) {
			// Changed this to allow a null approvalStepID such as in the case of "view all"

			var actionSelect = form.addField({
				id: SUBMIT_FIELD_ID,
				type: serverWidget.FieldType.SELECT,
				label: 'Approval Action'
			});

			//Add a View option 
			actionSelect.addSelectOption({
				value: JSON.stringify({
					approvalStepID: approvalStepID,
					approvalActionID: VIEW_ACTION_ID
				}),
				text: ' '
			});
			//Add the Save option to the Approval Action select dropdown if the current step has Save = Yes
			if (actionOptions && actionOptions.save) {
				actionSelect.addSelectOption({
					value: JSON.stringify({
						approvalStepID: approvalStepID,
						approvalActionID: SAVE_ACTION_ID
					}),
					text: actionOptions.save
				});
			}
			//If this step has a next step then add that step id to the Approval Action dropdown.  
			if (actionOptions && actionOptions.nextStepID) {
				actionSelect.addSelectOption({
					value: JSON.stringify({
						approvalStepID: actionOptions.nextStepID,
						approvalActionID: actionOptions.nextStepID
					}),
					text: actionOptions.nextAction
				});
			}
			//If this step has a previous step and Reject = Yes then add that step id to the Approval Action dropdown.  
			if (actionOptions && actionOptions.reject && actionOptions.prevStepID) {
				actionSelect.addSelectOption({
					value: JSON.stringify({
						approvalStepID: actionOptions.prevStepID,
						approvalActionID: REJECT_ACTION_ID
					}),
					text: actionOptions.reject
				});
			}

			form.addSubmitButton({
				id: 'record_approve_submit',
				label: 'Submit'
			});
			// }
			if (approvalStepID) {
				addCurrentStatusField(approvalStepID, form);
			}
			return null;
		}

		/**
		 * Retrieve the submit button values for a given user
		 * @param  {object} user Current user performing action
		 * @param  {string} approvalStepID Approval status ID of current Record
		 * @return {object} NetSuite Submit Button Options
		 */
		function getSubmitAction(user, approvalStepID) {
			var currentStep = getStep(parseInt(approvalStepID));

			if (!currentStep || currentStep === '') {
				return null;
			}

			var action = null;
			var reject = null;
			var save = null;
			var prevStep = getStep(currentStep.prevStepID);
			var nextStep = getStep(currentStep.nextStepID);
			if (userHasPermission(user, currentStep)) {
				userPermitted = true;
				if (currentStep.action && nextStep) {
					action = currentStep.action + ' (Move to step ' + nextStep.stepNum + '/' + NUM_STEPS + ')';
				}
				if (currentStep.reject && prevStep) {
					reject = currentStep.reject + ' ' + prevStep.stepNum + '/' + NUM_STEPS;
				}
				save = currentStep.save ? currentStep.save : null;
			}
			log.debug('getSubmitAction', 'userPermitted: ' + userPermitted);
			var actionOptions = {
				prevStepID: prevStep ? prevStep.id.toString() : null,
				nextStepID: nextStep ? nextStep.id.toString() : null,
				stepNum: currentStep.stepNum,
				save: save,
				reject: reject,
				nextAction: action
			};

			return actionOptions;
		}

		/* ----------------- SAVE METHODS ----------------- */

		/**
		 * Updates the Approval Status on the Record and
		 * creates the Approval Log Record
		 * @param  {string} newApprovalStepID The new Approval Process Step ID
		 * @param  {array} fieldUpdates        list of key-value pairs of fields and values for Log Record
		 * @return {string}                     new Log Record ID
		 */
		function update(newApprovalStepID, fieldUpdates) {
			updateRecordApprovalStep(newApprovalStepID);
			return createLogRec(fieldUpdates);
		}

		/**
		 * Updates the Audit Trail Record for this Record
		 * with the User and time an action was performed
		 * @param  {object} record    NetSuite Record Module
		 * @param  {string} newApprovalStepID The new Approval Process Step ID of the Record that will be updated
		 * @return {null}             void
		 */
		function updateRecordApprovalStep(newApprovalStepID) {

			try {
				var currentRecord = record.load({
					type: RECORD_TYPE_ID,
					id: RECORD_ID
				});

				currentRecord.setValue({
					fieldId: APPROVAL_STEP_FIELD,
					value: newApprovalStepID
				});

				// Save this record
				currentRecord.save();
			} catch (e) {
				var error = 'UPDATE APPROVAL STATUS ERROR' + ':' + e.message + ' @ approvalProcessLibrary.js -> updateRecordApprovalStep';
				httpContext.response.write(error);
				log.error('UPDATE APPROVAL STATUS ERROR', e.message);
				throw new Error(error);
			}
			return null;
		}

		/**
		 * Creates an Log Record associated with this Record
		 * @param  {array} fieldUpdates Key-value pair of fields to be updated and their new values
		 * @return {string}           ID of the newly created 'Document Selection Approval' Record
		 */
		function createLogRec(fieldUpdates) {

			try {
				var logRec = record.create({
					type: LOG_RECORD_TYPE_ID
				});
				for (var i = 0; i < fieldUpdates.length; i++) {

					logRec.setValue({
						fieldId: fieldUpdates[i].fieldId,
						value: fieldUpdates[i].value
					});
				}
				var docID = logRec.save();
				if (!docID || docID === '') {
					throw new Error('Error creating Approval Process Log Record');
				}
				return docID;
			} catch (e) {
				throw new Error('UPDATE APPROVAL STATUS LOG ERROR' + ':' + e.message + ' @ createLogRec');
			}
		}


		return {
			initialize: initialize,
			setContext: setContext,
			setRecordID: setRecordID,
			getRecordID: getRecordID,
			getViewActionID: getViewActionID,
			getRejectActionID: getRejectActionID,
			getSaveActionID: getSaveActionID,
			getNumSteps: getNumSteps,
			getUserPermittedFlag: getUserPermittedFlag,
			setSubmitFieldID: setSubmitFieldID,
			getSubmitFieldID: getSubmitFieldID,
			getSubmitAction: getSubmitAction,
			getStep: getStep,
			addReviewSectionFields: addReviewSectionFields,
			update: update,
			createLogRec: createLogRec
		};

	}); // SUITESCRIPT