/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 * ATP-1072 - ATP-1073
 */

define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/ui/message', 'N/url', 'N/redirect'
        ,'/.bundle/132118/PRI_AS_Engine'
        , '/SuiteScripts/Prolecto/Shared/SRS_Constants'
        , '/SuiteScripts/Pristine/libraries/clientReleaseFundTrackingLibrary.js'
        ,'/.bundle/132118/PRI_ShowMessageInUI'
        ],

	/**
		Client Fund Release Tracking - UserEvent Script
	*/
	function (record, search, serverWidget, runtime, message, url, redirect
			, appSettings
			, srsConstants
			, crflibrary
			, priMessage
			) {

		var userObj = runtime.getCurrentUser();
		var userDept = runtime.getCurrentUser().department;
		var userRoleId = runtime.getCurrentUser().role;
		var employeeID = runtime.getCurrentUser().id;
		var clientReleaseGroupAccess = false;
		var errorMessage = "";
		var currencies_and_balances;
		var dealID;

		function beforeLoad(context) {
			log.debug("beforeload", "In!")
			var executionContext = runtime.executionContext;
			log.debug("CONTEXT", executionContext);
			var form = context.form;
			var rap_link_field = form.getField({
				id: 'custrecord_crf_trk_rap_link'
			});

			if (context.type == context.UserEventType.CREATE && !Boolean(rap_link_field.defaultValue) && executionContext == 'USERINTERFACE') {
				throw "You can only create Client Release Fund Tracking records from the Release Approval Process record"
			}
			
			if (context.type == context.UserEventType.COPY && executionContext == 'USERINTERFACE') {
				throw "You can only create Client Release Fund Tracking records from the Release Approval Process record"
			}

			dealID = context.newRecord.getValue('custrecord_crf_trk_deal');

			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
				currencies_and_balances = crflibrary.currencies_and_balances(dealID);
			}

			var form = context.form;
			var availableBalance = form.getField({
				id: 'custrecord_crf_trk_available_bal'
			});

			var depositBalance = form.getField({
				id: 'custrecord_crf_trk_cus_deposit_bal'
			})

			var currencyField = form.getField({
				id: 'custrecord_crf_trk_currency'
			})

			if (context.type == context.UserEventType.CREATE) {
				depositBalance.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.NORMAL
				});
				currencyField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});
			}

			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
				depositBalance.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
			}

			if (context.type == context.UserEventType.EDIT) {
				currencyField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});
			}

			if (context.type == context.UserEventType.VIEW) 
			{
				priMessage.showPreparedMessage(context);
				
				var currencyID = context.newRecord.getValue('custrecord_crf_trk_currency');

				currencies_and_balances = crflibrary.currencies_and_balances(dealID);
				log.debug("beforeload: currencies_and_balances =", JSON.stringify(currencies_and_balances));
				log.debug("beforeload: dealID, currencyID, crfID ", dealID + " " + currencyID)
				activeCRFtotal = crflibrary.active_crf_amounts(dealID, currencyID, null);

				log.debug("beforeload: active CRF TOTAL ", activeCRFtotal);
				log.debug("beforeload: activeCRF TOTAL TYPE ", (typeof activeCRFtotal));

				var custDepositBal = crflibrary.getCustomerDepositBalance(currencyID, currencies_and_balances);

				var availableBalanceInit = 0;
				availableBalanceInit = custDepositBal - activeCRFtotal;
				availableBalanceInit = availableBalanceInit.toFixed(2);

				context.newRecord.setValue({
					fieldId: 'custrecord_crf_trk_cus_deposit_bal',
					value: custDepositBal,
				})

				context.newRecord.setValue({
					fieldId: 'custrecord_crf_trk_available_bal',
					value: availableBalanceInit,
				})
			}


			if (context.type == context.UserEventType.CREATE) {
				availableBalance.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.NORMAL
				});
			}

			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
				availableBalance.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
			}

			if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY || context.type == context.UserEventType.CREATE) {
				evaluateClientReleaseFundApproverGroup();

				var form = context.form;
				var savedCurrency = context.newRecord.getValue('custrecord_crf_trk_currency');

				var crf_currency = form.addField({
					id: 'custpage_crf_currency',
					type: serverWidget.FieldType.SELECT,
					label: 'CURRENCY',
					type: 'select'
				});

				form.insertField({
					field: crf_currency,
					nextfield: 'custrecord_crf_trk_pay_from_acc'
				});
				for (var i = 1; i <= currencies_and_balances.length; i++) {
					crf_currency.addSelectOption({
						value: currencies_and_balances[i - 1].currencyID,
						text: currencies_and_balances[i - 1].currency
					});
				}
				crf_currency.isMandatory = true;

			}
			if (Boolean(savedCurrency)) {
				context.newRecord.setValue({
					fieldId: 'custpage_crf_currency',
					value: savedCurrency,
					ignoreFieldChange: true
				})
			}

			if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE) {
				rap_link_field.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
			}

			//buttons ATP-1073
			var currentApprover = context.newRecord.getValue('custrecord_crf_trk_approver');
			var Status = context.newRecord.getValue('custrecord_crf_trk_status');
			log.debug("status: ", Status);
			log.debug("employeeID: ", employeeID);
			log.debug("currentApprover: ", currentApprover);

			switch (context.type) {

				case context.UserEventType.VIEW:
					if (Status == crflibrary.status_in_progress) {
						log.debug("status 2: ", Status);
						addButtons();
					}

					if (Status == crflibrary.status_pending_approval && userRoleId != srsConstants.USER_ROLE.ADMINISTRATOR) {
						if (employeeID == currentApprover) {
							var form = context.form;
							form.removeButton({
								id: 'edit',
							});
							addRejectApproveButtons(context);
						}
					}

					if (Status == crflibrary.status_approved && userRoleId != srsConstants.USER_ROLE.ADMINISTRATOR) {
						var form = context.form;
						form.removeButton({
							id: 'edit',
						});
						//if any of the 4 transactions have been created, do not show the button 
						if (!(
								context.newRecord.getValue('custrecord_crf_trk_bill') ||
								context.newRecord.getValue('custrecord_crf_trk_bill_paymt') ||
								context.newRecord.getValue('custrecord_crf_trk_invoice') ||
								(context.newRecord.getValue('custrecord_crf_trk_deposit_appl') && context.newRecord.getValue('custrecord_crf_trk_deposit_appl').length > 0)
							)) {
							addProcessTransactionsButton(context);
						}

					}

					//ATP-1238 - removing edit button when status is equal cancelled
					if (Status == crflibrary.status_cancelled && userRoleId != srsConstants.USER_ROLE.ADMINISTRATOR) {
						var form = context.form;
						form.removeButton({
							id: 'edit',
						});
					}
					//ATP-1267 - removing edit button when status is equal failed
					if (Status == crflibrary.status_failed && userRoleId != srsConstants.USER_ROLE.ADMINISTRATOR) {
						var form = context.form;
						form.removeButton({
							id: 'edit',
						});
					}

					if (Status == crflibrary.status_completed && userRoleId != srsConstants.USER_ROLE.ADMINISTRATOR) {
						var form = context.form;
						form.removeButton({
							id: 'edit',
						});
					}
					break;

				case context.UserEventType.EDIT:
					if (userRoleId == srsConstants.USER_ROLE.ADMINISTRATOR) {
						break;
					}
					if (Status == crflibrary.status_approved) {
						throw ('An approved Client Fund Release Tracking Record can not be edited.');
					}
					if (Status == crflibrary.status_pending_approval) {
						if (employeeID == currentApprover) {
							throw ('Client Fund Release Tracking Record can not be edited if you are the Approver. You must either reject or approve.');
						}
					}
					//ATP-1238 - not allowing url manipulation if status equals canclled
					if (Status == crflibrary.status_cancelled) {
						throw ('Client Fund Release Tracking Record can not be edited if the current status equals Cancelled.');
					}
					//ATP-1267 - not allowing url manipulation if status equals failed
					if (Status == crflibrary.status_failed) {
						throw ('Client Fund Release Tracking Record can not be edited if the current status equals Failed.');
					}
					if (Status == crflibrary.status_completed) {
						throw ('Client Fund Release Tracking Record can not be edited if the current status equals Completed.');
					}
					break;
				default:
					return
			}
			// end of switch statement

			function addButtons() {
				context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/clientReleaseFundTracking_CL.js';
				context.form.addButton({
					id: 'custpage_send_for_review',
					label: 'Send for Review',
					functionName: 'sendForReview()'
				});

			}

			function addRejectApproveButtons(context) {
				log.debug("context: ", JSON.stringify(context));
				var recID = context.newRecord.id;
				var recTYPE = context.newRecord.type;
				var currencyID = context.newRecord.getValue('custrecord_crf_trk_currency');
				var dealID = context.newRecord.getValue('custrecord_crf_trk_deal');
				var crf_amount = context.newRecord.getValue('custrecord_crf_trk_amount');
				var approver = context.newRecord.getValue('custrecord_crf_trk_approver');


				log.debug("reject button: ", recID + " " + recTYPE + " ");

				context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/clientReleaseFundTracking_CL.js';
				context.form.addButton({
					id: 'custpage_reject',
					label: 'Reject',
					functionName: 'reject(' + recID + ',"' + recTYPE + '")'
				});
				context.form.addButton({
					id: 'custpage_approve',
					label: 'Approve',
					functionName: 'approve(' + currencyID + ',' + dealID + ',' + crf_amount + ',' + recID + ',' + approver + ')'
				});
			}

			function addProcessTransactionsButton(context) {

				var suiteletURL = url.resolveScript({
					scriptId: srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
					deploymentId: srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
					returnExternalUrl: false,
					params: {
						"action": "ProcessClientFundTransactions",
						"cfid": context.newRecord.id
					}
				});

				context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/clientReleaseFundTracking_CL.js';
				context.form.addButton({
					id: 'custpage_process_transactions',
					label: 'Process Transactions',
					functionName: 'processTransactions("' + suiteletURL + '")'
				});
			}

		} // end of beforeLoad

		//**********************************************END OF BEFORE LOAD*********************************

		//**********************************************HELPER FUNCTIONS*********************************
		/**
		 * Description: Permissions for the record
		 * throws error if does not meet requirements
		 */
		function evaluateClientReleaseFundApproverGroup() {
			// Are you in the correct dept
			if (!Boolean(userDept == srsConstants.DEPT.DATA_MANAGEMENT_AND_RELEASE)) {
				errorMessage += " You must be in the DATA MANAGEMENT AND RELEASE DEPARTMENT to perform this action <br>";
			}
			// Are you in the correct role
			if (!Boolean(userRoleId == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER || userRoleId == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST)) {
				errorMessage += " You must be in the SRS OPERATIONS MANAGER or ANALYST role to perform this action <br>";
			}
			//back door for admin
			if (userRoleId == srsConstants.USER_ROLE.ADMINISTRATOR) {
				errorMessage = "";
			}
			if (errorMessage != "") {
				throw errorMessage;
			} else {
				clientReleaseGroupAccess = true;
			}
		}

		return {
			beforeLoad: beforeLoad,
		}

	});