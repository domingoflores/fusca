/**
 * dealEscrowLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities 
 * 
 *
 * Version    Date            Author           Remarks
 *	1.0		  2018-12-01	  Ken Crossman	   Meant to be a receptacle for useful scripting tools/functions/utilities in the Deal Escrow area
 *  ATO-103   2019-05-24      Ken Crossman	   Add function to find pending claims 
 */
define(['N/search', 'N/runtime', '/.bundle/132118/PRI_AS_Engine', '/SuiteScripts/Prolecto/Shared/SRS_Constants'],

	function (search, runtime, appSettings, srsConstants) {


		function getHighestAquEscrAgentGLAccountNbr(dealEscrowId) {
			var objAppSettings = appSettings.createAppSettingsObject("Acquiom Escrow Agent");
			// log.debug(funcName, "objAppSettings: " + JSON.stringify(objAppSettings));
			var searchResults = [];
			if (dealEscrowId) {
				try {
					var accountSearch = search.create({
						type: 'account', //GL Account
						title: 'Deal Escrow Bank Account',
						columns: [{
							name: 'type',
							summary: search.Summary.MAX
						}, {
							name: 'number',
							summary: search.Summary.MAX,
							sort: search.Sort.DESC
						}, {
							name: 'name',
							summary: search.Summary.MAX
						}, {
							name: 'internalid',
							summary: search.Summary.MAX
						}],

						filters: [{
							name: 'parent',
							operator: search.Operator.IS,
							values: objAppSettings.settings["AEA Parent Bank Account ID"] // Acquiom Escrow Agent 200000
						}, {
							name: 'type',
							operator: search.Operator.IS,
							values: 'Bank'
						}]
					}).run();
					searchResults = accountSearch.getRange(0, 1); // Only expecting 1 row
				} catch (e) {
					log.error('getHighestAquEscrAgentGLAccountNbr', 'e: ' + JSON.stringify(e));
				}
			}

			return searchResults;
		} //getHighestAquEscrAgentGLAccountNbr

		function getDealEscrowGLAccounts(dealEscrowId) {
			var objAppSettings = appSettings.createAppSettingsObject("Acquiom Escrow Agent");
			// log.debug(funcName, "objAppSettings: " + JSON.stringify(objAppSettings));
			var searchResults = [];
			if (dealEscrowId) {
				try {
					var accountSearch = search.create({
						type: 'account', //GL Account
						title: 'Deal Escrow Bank Account',
						columns: [{
							name: 'type',
						}, {
							name: 'number',
							sort: search.Sort.DESC
						}, {
							name: 'name'
						}, {
							name: 'internalid'
						}],

						filters: [{
							name: 'custrecord_deal_escrow',
							operator: search.Operator.IS,
							values: dealEscrowId
						}, {
							name: 'parent',
							operator: search.Operator.IS,
							values: objAppSettings.settings["AEA Parent Bank Account ID"] // Acquiom Escrow Agent 200000
						}, {
							name: 'type',
							operator: search.Operator.IS,
							values: 'Bank'
						}]
					}).run();
					searchResults = accountSearch.getRange(0, 1000); // Only expecting max 10 rows

				} catch (e) {
					log.error('getDealEscrowGLAccounts', 'e: ' + JSON.stringify(e));
				}
			}

			return searchResults;
		} //getDealEscrowGLAccounts

		function deriveBankAccountName(dealEscrowId, deFieldValues) {
			var deBankAcctName = deFieldValues.custrecord_de_bank_account_name;
			var nextAccountName = deBankAcctName.substr(0, 57);
			var highestAccountNameSuffix = '';
			var nextAccountNameSuffix = '';
			// Get all GL Bank Accounts with Acquiom Escrow Agent as parent and linked to Deal Escrow
			// Sorted by Number descending - i.e. most recently created
			var deBankAccts = getDealEscrowGLAccounts(dealEscrowId);
			// If this is the first Bank Account created for this Deal Escrow then there will be no suffix
			// Only the 2nd and subsequent Bank Accounts for this Deal Escrow will get a 2 digit suffix starting with '01'
			if (deBankAccts.length > 0) {
				if (deBankAccts.length > 1) {
					// Calculate the next Account Name Suffix as current plus one
					highestAccountNameSuffix = deBankAccts[0].getValue({
						name: 'name'
					}).trim().substr(-2, 2);
				} else {
					highestAccountNameSuffix = '00';
				}
				nextAccountNameSuffix = Number(highestAccountNameSuffix) + 1;
				if (nextAccountNameSuffix < 10) {
					nextAccountNameSuffix = '0' + nextAccountNameSuffix;
				}
			}

			log.debug('deriveBankAccountName', 'nextAccountNameSuffix: ' + JSON.stringify(nextAccountNameSuffix));
			log.debug('deriveBankAccountName', 'highestAccountNameSuffix: ' + JSON.stringify(highestAccountNameSuffix));
			var accountName = nextAccountName + ' ' + nextAccountNameSuffix;
			return accountName;
		}

		function deriveBankAccountNbr(dealEscrowId) {
			// Get the highest GL Bank Account Nbr with Acquiom Escrow Agent as parent and add 1 for next number
			var highestGLAccountNbrRow = getHighestAquEscrAgentGLAccountNbr(dealEscrowId);
			var highestGLAccountNbr;
			var nextGLAccountNbr;

			if (highestGLAccountNbrRow.length > 0) {
				highestGLAccountNbr = Number(highestGLAccountNbrRow[0].getValue({
					name: 'number',
					summary: search.Summary.MAX,
					sort: search.Sort.DESC
				})) || null;
			} else {
				highestGLAccountNbr = objAppSettings.settings["AEA Parent Bank Account Nbr"]; //200000
			}
			if (highestGLAccountNbr) {
				nextGLAccountNbr = highestGLAccountNbr + 1;
			}
			return nextGLAccountNbr;
		}

		function getPendingClaims(dealEscrowId) {
			log.debug('getPendingClaims', 'dealEscrowId: ' + dealEscrowId);
			var settlementType = {
				'Pending': 1
			};
			var searchResults = [];
			if (dealEscrowId) {
				try {
					var pendClaimSearch = search.create({
						type: 'customrecord_deal_action',
						title: 'Pending Claims',
						columns: [{
							name: 'internalid'
						}],

						filters: [{
							name: 'custrecord_da_deal_escrow',
							operator: search.Operator.IS,
							values: dealEscrowId
						}, {
							name: 'isinactive',
							operator: search.Operator.IS,
							values: 'F'
						}, {
							name: 'custrecord_da_department',
							operator: search.Operator.IS,
							values: srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT
						}, {
							name: 'isinactive',
							join: 'custrecord_deal_action_resolution',
							operator: search.Operator.IS,
							values: 'F'
						}, {
							name: 'custrecord_dar_department',
							join: 'custrecord_deal_action_resolution',
							operator: search.Operator.IS,
							values: srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT
						}, {
							name: 'custrecord_resolution_type',
							join: 'custrecord_deal_action_resolution',
							operator: search.Operator.IS,
							values: settlementType.Pending
						}]
					}).run();
					searchResults = pendClaimSearch.getRange(0, 1000); // Only expecting max 10 rows

				} catch (e) {
					log.error('getDealEscrowGLAccounts', 'e: ' + JSON.stringify(e));
				}
			}

			return searchResults;

		}

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

		function getAccountBalance(accountId) {
			var accountBalance = 0;
			if (accountId) {
				var accountValues = search.lookupFields({
					type: search.Type.ACCOUNT,
					id: accountId,
					columns: ['balance', 'name', 'number']
				});
				log.debug('dealEscrowLibrary.js-->getAccountBalance', 'accountValues: ' + JSON.stringify(accountValues));
				accountBalance = accountValues.balance;
			}
			return accountBalance;
		}

		function userIsAuthorizedToDisburse() {
			if (
				runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR ||
				((runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST ||
					runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER) &&
					runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS) ||
				((runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_SALES_MANAGER ||
					runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST) &&
					runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT)) {
				return true;
			} else {
				return false
			}
		}

		function initiatedDisbursementTotal(accountId, excludedDisbursementId) {
			log.debug('dealEscrowLibrary.js-->initiatedDisbursementTotal', 'accountId: ' + accountId);
			log.debug('dealEscrowLibrary.js-->initiatedDisbursementTotal', 'excludedDisbursementId: ' + excludedDisbursementId);
			var disbursementTotal = 0;
			var searchFilters = [];
			searchFilters.push({
				name: 'custrecord_ead_gl_account',
				operator: search.Operator.IS,
				values: accountId
			}, {
				name: 'custrecord_ead_status',
				operator: search.Operator.ANYOF,
				values: srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Initiated"]
			}, {
				name: 'isinactive',
				operator: search.Operator.IS,
				values: 'F'
			});
			if (excludedDisbursementId) {
				searchFilters.push({
					name: 'internalid',
					operator: search.Operator.NONEOF,
					values: excludedDisbursementId
				});
			}
			var eadSearch = search.create({
				type: 'customrecord_escrow_agent_disbursement',
				title: 'EAD Search',
				columns: [{
					name: 'custrecord_ead_disbursement_amt',
					summary: search.Summary.SUM
				}],
				filters: searchFilters
			}).run();
			var searchResults = eadSearch.getRange(0, 1); //I only expect one row to return

			if (searchResults.length > 0) {
				disbursementTotal = searchResults[0].getValue({
					name: 'custrecord_ead_disbursement_amt',
					summary: search.Summary.SUM
				});
			}
			log.debug('dealEscrowLibrary.js-->initiatedDisbursementTotal', 'disbursementTotal: ' + disbursementTotal);
			return disbursementTotal;
		}

		function disbursementAccountAvailableBalance(accountId, excludedDisbursementId) {
			return getAccountBalance(accountId) - initiatedDisbursementTotal(accountId, excludedDisbursementId);
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		function validateDisbursement(disbursement) {
			log.debug('dealEscrowLibrary.js-->validateDisbursement', 'disbursement: ' + JSON.stringify(disbursement));
			var success = true;
			var message = '';
			// If in Initiated status - check that Pending Claim Override is set if there are pending claims - otherwise reject change
			var eadStatus = disbursement.status;
			var pendClaimOverride = disbursement.overridePendingClaims;
			if (eadStatus == srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Initiated"] && !pendClaimOverride) {
				var checkForPendingClaimsResponse = checkForPendingClaims(disbursement.dealescrow);
				success = checkForPendingClaimsResponse.success;
				message = checkForPendingClaimsResponse.message;
			}
			// Check that the amount does not exceed the bank account available balance and that it is not negative
			var accountId = disbursement.glaccount;
			var amountAvailableForRelease = disbursement.amountAvailableForRelease;
			log.debug('dealEscrowLibrary.js-->validateDisbursement', 'disbursement.amount: ' + disbursement.amount);
			var eadAmount = disbursement.amount;
			log.debug('dealEscrowLibrary.js-->validateDisbursement', 'eadAmount: ' + eadAmount);
			var accountAvailableBalance = 0;
			if (accountId) {
				var accountAvailableBalance = amountAvailableForRelease;
				//var accountAvailableBalance = disbursementAccountAvailableBalance(accountId, disbursement.internalid);
			}

			if (eadAmount < 0) {
				success = false;
				message += '<br>  The amount entered is negative.' +
					'. Please modify if you still want to proceed with the disbursement.';
			} else {
				if (eadAmount > accountAvailableBalance) {
					success = false;
					message += '<br>  The amount entered, $' + eadAmount + ' exceeds the GL Account available balance of $' + accountAvailableBalance +
						'. Please modify if you still want to proceed with the disbursement.';
				}
			}
			var callbackReq = disbursement.callbackReq;
			var callbackComments = disbursement.callbackComments;
			if (callbackReq == 2 && callbackComments == "") {
				success = false;
				message += '<br>  When callback Required = No, then callback Comments are required.' +
					'. Please modify if you still want to proceed with the disbursement.';
			}
			return {
				success: success,
				message: message
			};
		}

		/*-------------------------------------------------------------------------------------------------------------------------------------------------------- */

		function checkForPendingClaims(dealEscrowId) {
			log.debug('dealEscrowLibrary.js-->checkForPendingClaims', 'dealEscrowId: ' + JSON.stringify(dealEscrowId));
			var success = true;
			var message = '';

			var pendingClaims = getPendingClaims(dealEscrowId);
			log.debug('checkForPendingClaims', 'pendingClaims: ' + JSON.stringify(pendingClaims));
			if (pendingClaims.length > 0) {
				success = false;
				message = 'One or more claims are pending for the Deal Escrow. Please check the "Override Pending Claims" checkbox if you still want to proceed with the disbursement.';
			}
			return {
				success: success,
				message: message
			};
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		function getDisbursementFields(disbursementId) {
			var retValue = {};
			var dbFieldValues = search.lookupFields({
				type: 'customrecord_escrow_agent_disbursement',
				id: disbursementId,
				columns: ['custrecord_ead_deal', 'custrecord_ead_deal_escrow', 'custrecord_ead_statement_memo', 'custrecord_ead_disbursement_dt', 'custrecord_ead_disbursement_amt', 'custrecord_ead_gl_account',
					'custrecord_ead_status', 'custrecord_ead_pend_claim_override', 'custrecord_ead_amnt_avail_release'
				]
			});
			log.debug('getDisbursementFields', 'dbFieldValues: ' + JSON.stringify(dbFieldValues));

			retValue.dealescrow = Number(dbFieldValues.custrecord_ead_deal_escrow[0].value);
			retValue.deal = Number(dbFieldValues.custrecord_ead_deal[0].value);
			retValue.memo = dbFieldValues.custrecord_ead_statement_memo;
			retValue.date = dbFieldValues.custrecord_ead_disbursement_dt;
			retValue.amount = Number(dbFieldValues.custrecord_ead_disbursement_amt);
			retValue.glaccount = Number(dbFieldValues.custrecord_ead_gl_account[0].value);
			retValue.amountAvailableForRelease = Number(dbFieldValues.custrecord_ead_amnt_avail_release[0].value);
			retValue.status = Number(dbFieldValues.custrecord_ead_status[0].value);
			retValue.overridePendingClaims = Number(dbFieldValues.custrecord_ead_pend_claim_override);
			retValue.internalid = disbursementId;

			return retValue;
		}

		return {
			getHighestAquEscrAgentGLAccountNbr: getHighestAquEscrAgentGLAccountNbr,
			getDealEscrowGLAccounts: getDealEscrowGLAccounts,
			deriveBankAccountName: deriveBankAccountName,
			deriveBankAccountNbr: deriveBankAccountNbr,
			getPendingClaims: getPendingClaims,
			getFieldValue: getFieldValue,
			getAccountBalance: getAccountBalance,
			userIsAuthorizedToDisburse: userIsAuthorizedToDisburse,
			initiatedDisbursementTotal: initiatedDisbursementTotal,
			disbursementAccountAvailableBalance: disbursementAccountAvailableBalance,
			validateDisbursement: validateDisbursement,
			getDisbursementFields: getDisbursementFields
		};
	});