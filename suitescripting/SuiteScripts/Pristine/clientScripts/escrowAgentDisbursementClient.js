/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime', 'N/ui/dialog', 'N/currentRecord', 'N/record', "N/url", 'N/ui/message', 'N/https', 'N/search', 'N/runtime', 'N/format',
		'/SuiteScripts/Pristine/libraries/dealEscrowLibrary.js',
		'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	],
	/**
	 * -----------------------------------------------------------
	 * escrowAgentDisbursementClient.js
	 * ___________________________________________________________
	 * Escrow Agent Disbursement client script
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2019-05-21	
	 * ___________________________________________________________
	 */
	function (runtime, dialog, currentRecord, record, url, message, https, search, runtime, format, dealEscrowLib, srsConstants) {

		var scriptName = "escrowAgentDisbursementClient.";
		var REC;
		var ctx = null;

		const YES = 1; // from List Yes/No
		const NO = 2;

		function pageInit(context) {
			REC = context.currentRecord;
			console.log('Runtime ContextType: ', JSON.stringify(runtime.executionContext));
			// If account is entered then make amount field modifiable
			// If blanked out then make it zero and protect it
			toggleAmountFieldDisplayTypeByAccount(context);

			controlCallbackContactField(context);
			makeCommentMandatory(context);


			// Acquiom Escrow 0 = value of 1
			var dealEscrow = REC.getValue("custrecord_ead_deal_escrow");
			var dealEscrowProductCode = search.lookupFields({
				type: 'customrecord_deal_escrow',
				id: dealEscrow,
				columns: ['custrecord_de_product_code']
			});
			console.log('INIT-dealEscrowProductCode JSON = ' + JSON.stringify(dealEscrowProductCode));
			dealEscrowProductCode = Number(dealEscrowProductCode.custrecord_de_product_code[0].value);
			console.log('INIT-dealEscrowProductCode = ' + dealEscrowProductCode);

			var includeAccruedInterest = REC.getValue("custrecord_ead_include_accrued_int"); // checkbox
			console.log('includeAccruedInterest = ' + includeAccruedInterest);

			// if product code is equal to "Acquiom Escrow 0" (internalID=1) ENABLE checkbox
			var includeAccruedInterestObj = REC.getField({
				fieldId: "custrecord_ead_include_accrued_int"
			});
			if (dealEscrowProductCode == 1) {
				console.log('INIT-dealEscrowProductCode != Product Code 0 ');
				includeAccruedInterestObj.isDisabled = true;
			} else {
				console.log('INIT-dealEscrowProductCode == Product Code 0 ');
				includeAccruedInterestObj.isDisabled = false;
			}

			accruedInterestFields(context)

		}


		function saveRecord(context) {

			if (context.currentRecord.getValue("custrecord_ead_callback_required") == YES) {
				var c = context.currentRecord.getValue({
					fieldId: 'custrecord_ead_callback_contacts'
				});
				console.log('saveRecord', 'callbackContacts: ' + c);
				if (!(c.length > 0 && c[0])) {
					alert("You must select at least one CALLBACK CONTACT when CALLBACK REQUIRED is Yes");
					return false;
				}

			}
			if (context.currentRecord.getValue("custrecord_ead_callback_required") == NO) {
				var callbackComments = context.currentRecord.getValue({
					fieldId: 'custrecord_ead_callback_comments'
				});
				console.log('saveRecord', 'callbackComments: ' + callbackComments);
				if (!callbackComments) {
					alert("Callback Comments are mandatory when CALLBACK REQUIRED is No");
					return false;
				}

			}


			return true;

		}

		function fieldChanged(context) {
			console.log('fieldChanged', 'context.fieldId: ' + context.fieldId);
			// Toggle By and Date fields based on override checkbox	
			if (context.fieldId == "custrecord_ead_pend_claim_override")
				toggleOverrideTimestamp(context);

			// If account is entered then make amount field modifiable
			// If blanked out then make it zero and protect it
			if (context.fieldId === 'custrecord_ead_gl_account') {
				setAccountBalance(context);
				toggleAmountFieldDisplayTypeByAccount(context);
			}
			// If Amount entered validate it to disallow negative numbers
			if (context.fieldId === 'custrecord_ead_disbursement_amt') {
				validateAmount(context);
			}

			if (context.fieldId == "custrecord_ead_callback_required")
				controlCallbackContactField(context);

			if (context.fieldId === 'custrecord_ead_include_accrued_int') {
				accruedInterestFields(context)
			}

			// update custrecord_ead_amnt_avail_release
			if (context.fieldId == 'custrecord_ead_accrued_int_amnt') {
				REC = context.currentRecord;
				var includeAccruedInterest = REC.getValue("custrecord_ead_include_accrued_int"); // checkbox
				var includeAccruedInterestAmountObj = REC.getField({
					fieldId: "custrecord_ead_accrued_int_amnt"
				});
				if (includeAccruedInterest == true) {
					console.log('FLD CHNG-custrecord_ead_disbursement_amt && includeAccruedInterest = true');
					var custrecord_ead_account_balance = REC.getValue("custrecord_ead_account_balance");
					var custrecord_ead_accrued_int_amnt = REC.getValue("custrecord_ead_accrued_int_amnt");
					var availableRelease = (custrecord_ead_account_balance + custrecord_ead_accrued_int_amnt).toFixed(2);
					REC.setValue({
						fieldId: 'custrecord_ead_amnt_avail_release',
						value: availableRelease,
						ignoreFieldChange: true
					});
					includeAccruedInterestAmountObj.isDisabled = false;
				}
			}

			makeCommentMandatory(context);
		}

		function accruedInterestFields(context) {
			REC = context.currentRecord;
			var includeAccruedInterest = REC.getValue("custrecord_ead_include_accrued_int"); // checkbox

			var includeAccruedInterestAmountObj = REC.getField({
				fieldId: "custrecord_ead_accrued_int_amnt"
			});
			if (includeAccruedInterest == true) {
				console.log('INIT-includeAccruedInterest = true');
				//the user can enter an amount in the ACCRUED INTEREST AMOUNT field
				//Set AMOUNT AVAILABLE FOR RELEASE = GL ACCOUNT BALANCE + ACCRUED INTEREST AMOUNT
				// 									custrecord_ead_account_balance + custrecord_ead_accrued_int_amnt
				/*
				var custrecord_ead_account_balance = REC.getValue("custrecord_ead_account_balance");
				var custrecord_ead_accrued_int_amnt = REC.getValue("custrecord_ead_accrued_int_amnt");
				var availableRelease = (custrecord_ead_account_balance + custrecord_ead_accrued_int_amnt).toFixed(2) ;
				REC.setValue({
					fieldId: 'custrecord_ead_amnt_avail_release',
					value: availableRelease,
					ignoreFieldChange: true
				});
				this is being done before the field is even enabled. 
				*/
				includeAccruedInterestAmountObj.isDisabled = false;

			} else {
				console.log('INIT-includeAccruedInterest = false');
				//the user cannot enter an amount in the ACCRUED INTEREST AMOUNT field
				//Set AMOUNT AVAILABLE FOR RELEASE = GL ACCOUNT BALANCE
				var availableRelease = REC.getValue("custrecord_ead_account_balance");
				REC.setValue({
					fieldId: 'custrecord_ead_amnt_avail_release',
					value: availableRelease,
					ignoreFieldChange: true
				});
				includeAccruedInterestAmountObj.isDisabled = true

				REC.setValue({
					fieldId: 'custrecord_ead_accrued_int_amnt',
					value: "",
					ignoreFieldChange: true
				});
			}
		}


		function cancelDisbursement() {
			console.log('cancelDisbursement');
			// Offer confirmation dialog before proceeding
			var options = {
				message: 'Are you sure?',
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function (result) {
					if (result) {
						//If user presses OK then go ahead and void
						console.log('cancelDisbursement', 'Cancellation Requested');
						reallyCancelDisbursement();
					}
				})
				.catch(function (reason) {});
		}

		function reallyCancelDisbursement() {
			var currentRec = currentRecord.get();
			try {
				var id = record.submitFields({
					type: 'customrecord_escrow_agent_disbursement',
					id: currentRec.id,
					values: {
						'custrecord_ead_status': srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Canceled"]
					}
				});
			} catch (e) {
				console.log('reallyCancelDisbursement', 'e: ' + JSON.stringify(e));
			}

			location.reload(true);
		}

		function controlCallbackContactField(context) {

			var enableField = (context.currentRecord.getValue("custrecord_ead_callback_required") == YES);

			var fld = context.currentRecord.getField({
				fieldId: 'custrecord_ead_callback_contacts'
			});

			if (fld)
				if (enableField) {
					fld.isDisabled = false;
					fld.isMandatory = true;
				}

			else {
				fld.isDisabled = true;
				fld.isMandatory = false;
				//context.currentRecord.setValue("custrecord_ead_callback_contacts","");
				context.currentRecord.setValue({
					fieldId: 'custrecord_ead_callback_contacts',
					value: '',
					ignoreFieldChange: true
				});
			}


			var fld = context.currentRecord.getField({
				fieldId: 'custrecord_ead_callback_completed'
			});

			if (fld)
				if (enableField)
					fld.isDisabled = false;
				else {
					fld.isDisabled = true;
					//context.currentRecord.setValue("custrecord_ead_callback_completed",false);
					context.currentRecord.setValue({
						fieldId: 'custrecord_ead_callback_completed',
						value: false,
						ignoreFieldChange: true
					});
				}
		}

		function makeCommentMandatory(context) {
			var rcd = context.currentRecord;
			var formField = {};
			var callback_req = rcd.getValue("custrecord_ead_callback_required");
			console.log("makeCommentMandatory", "callback_req" + JSON.stringify(callback_req));
			formField = context.currentRecord.getField('custrecord_ead_callback_comments');
			console.log("makeCommentMandatory", "callback field" + JSON.stringify(formField));
			if (callback_req == "2") {
				formField.isMandatory = true;
			} else {
				formField.isMandatory = false;
			}

		}

		function createDisbursementTxns(includeAccruedInterest) {
			console.log('createDisbursementTxns');
			// Get the current record object...
			var REC = currentRecord.get();
			//...so that you can get the ID and lookup all the field values you need 
			var disbursement = dealEscrowLib.getDisbursementFields(REC.id);
			//CHANGE MESSAGE BASED ON THE CHECKBOX
			var includeAccruedInterest;
			// checkbox
			console.log('Runtime ContextType: ', JSON.stringify(runtime.executionContext));
			var validationResponse = dealEscrowLib.validateDisbursement(disbursement);
			console.log("checkbox is checked2? ", +includeAccruedInterest);
			console.log('createDisbursementTxns', 'validationResponse: ' + JSON.stringify(validationResponse));

			var m1 = "Are you sure you want to create related Credit Memo and Customer Refund Transactions?"; //include journal entries
			if (includeAccruedInterest) {
				m1 = "Are you sure you want to create related Credit Memo, Customer Refund Transactions and Journal Entries?";
			}
			if (validationResponse.success) {

				var options = {
					message: m1,
					title: 'Press OK to Continue'
				};
				dialog.confirm(options).then(function (result) {
						if (result) {
							createDisbursementTxnsSL(includeAccruedInterest);
						}
					})
					.catch(function (reason) {});
			} else {
				showErrorMessage('Cannot initiate transaction creation', validationResponse.message);
			}
		}

		function createDisbursementTxnsSL(includeAccruedInterest) {
			var currentRec = currentRecord.get();
			var RecID = currentRec.id;
			console.log('is the checkbox checked? : ', includeAccruedInterest);
			// var parmFieldValues = "Testing";
			var messagetype = null;
			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_srs_disbursement_mng',
				deploymentId: 'customdeploy_srs_disbursement_mng',
				returnExternalUrl: false
			});

			var domain = url.resolveDomain({
				hostType: url.HostType.APPLICATION
			});
			console.log("domain: " + domain);

			var fullSuiteletURL = "https://" + domain + suiteletURL + "&action=createDisbursementTransactions" + "&disbursementid=" + RecID;
			console.log("fullSuiteletURL: " + fullSuiteletURL);

			var m1 = "Creating Credit Memo and Customer Refund. Please wait...";

			if (includeAccruedInterest == true) {
				m1 = "Creating Credit Memo, Customer Refund and Journal Entries. Please wait...";
			}

			var myMsg2 = message.create({
				title: "Create Transaction Started",
				message: m1,
				type: message.Type.INFORMATION
			});

			myMsg2.show();


			https.post.promise({
					url: fullSuiteletURL,
					body: {}
					// headers: {"Content-Type": "application/json"}
				})
				.then(function (response) {

					//		    	var index = response.body.lastIndexOf("}");
					//		    	if (index > 0)
					//		    	{
					//remove all extra data netsuite prints:
					// which breaks parsing of the json
					//		    		{"results":[{"success":true,"recordid":4710821,"message":"Credit Memo 4710821 created.","title":"Completed","htmlmessage":"v <a href=\"/app/accounting/transactions/custcred.nl?id=4710821&compid=772390_SB3\" target=\"_blank\">4710821</a></td> created.<br>","messagetype":0},{"success":true,"recordid":4710822,"message":"Customer Refund 4710822 created.","title":"Completed","htmlmessage":"Customer Refund <a href=\"/app/accounting/transactions/custrfnd.nl?id=4710822&compid=772390_SB3\" target=\"_blank\">4710822</a></td> created.<br>","messagetype":0}],"messagetype":0,"htmlmessage":"v <a href=\"/app/accounting/transactions/custcred.nl?id=4710821&compid=772390_SB3\" target=\"_blank\">4710821</a></td> created.<br>Customer Refund <a href=\"/app/accounting/transactions/custrfnd.nl?id=4710822&compid=772390_SB3\" target=\"_blank\">4710822</a></td> created.<br>"}<!-- 3,853 s: 44% #1313 cache: 1% #139 -->
					//		    		<!-- Host [ a23.prod.sv ] App Version [ 2019.1.0.96 ] -->
					//		    		<!-- COMPID [ 772390_SB3 ]  EMAIL [ mobradovic@shareholderrep.com ] URL [ /app/site/hosting/scriptlet.nl ] Time [ Fri Jun 07 11:07:50 PDT 2019 ] -->
					//		    		<!-- Not logging slowest SQL -->

					//		    		var body = response.body.substring(0, index+1);
					//		    		var result = JSON.parse(body);
					//		    		myMsg2.hide();
					//			    	myMsg2 = message.create({
					//			            title: result.messagetitle, 
					//			            message: result.htmlmessage, 
					//			            type: result.messagetype
					//			        });
					//			        myMsg2.show();


					location.reload(true);

					//		    	}
					//		    	else 
					//		    	{
					//		    		console.log(response);
					//		    	}

				})
				.catch(function onRejected(reason) {
					log.error({
						title: 'Invalid Request: ',
						details: reason
					});
					location.reload(true);
				})
		}

		function toggleAmountFieldDisplayTypeByAccount(context) {
			console.log('toggleAmountFieldDisplayTypeByAccount', 'context.currentRecord: ' + JSON.stringify(context.currentRecord));
			var thisId = context.currentRecord.getValue({
				fieldId: 'id'
			});
			console.log('toggleAmountFieldDisplayTypeByAccount', 'thisId: ' + thisId);
			var account = context.currentRecord.getValue({
				fieldId: 'custrecord_ead_gl_account'
			});
			var amountField = context.currentRecord.getField({
				fieldId: 'custrecord_ead_disbursement_amt',
			});

			// ATP-1116: this field should no longer get auto-populated from the escrow balance
			if (account) {
				amountField.isDisabled = false;
				//				context.currentRecord.setValue({
				//					fieldId: 'custrecord_ead_disbursement_amt',
				//					value: dealEscrowLib.disbursementAccountAvailableBalance(account, thisId),
				//					ignoreFieldChange: true
				//				});
			} else {
				amountField.isDisabled = true;
				context.currentRecord.setValue({
					fieldId: 'custrecord_ead_disbursement_amt',
					value: 0,
					ignoreFieldChange: true
				});
			}

		}

		function validateAmount(context) {
			var amount = context.currentRecord.getValue({
				fieldId: 'custrecord_ead_disbursement_amt'
			});
			if (amount < 0) {
				dialog.alert({
					title: 'Invalid Amount',
					message: 'Amount may not be negative. Click OK to continue.'
				}).then().catch();
				context.currentRecord.setValue({
					fieldId: 'custrecord_ead_disbursement_amt',
					value: ''
				});
			}

			var amountAvailable = context.currentRecord.getValue({
				fieldId: 'custrecord_ead_amnt_avail_release'
			});
			if (amount > amountAvailable) {
				dialog.alert({
					title: 'Invalid Amount',
					message: 'Amount may not be more than Amount Available for Release. Click OK to continue.'
				}).then().catch();
				context.currentRecord.setValue({
					fieldId: 'custrecord_ead_disbursement_amt',
					value: ''
				});
			}

		}

		function toggleOverrideTimestamp(context) {
			if (REC.getValue("custrecord_ead_pend_claim_override")) {
				REC.setValue("custrecord_ead_pend_claim_override_by", runtime.getCurrentUser().id);
				REC.setValue("custrecord_ead_pend_claim_override_dt", new Date());
			} else {
				REC.setValue("custrecord_ead_pend_claim_override_by", "");
				REC.setValue("custrecord_ead_pend_claim_override_dt", "");
			}
		}

		function setAccountBalance(context) {
			console.log('setAccountBalance', 'context.fieldId: ' + context.fieldId);
			var account = REC.getValue({
				fieldId: 'custrecord_ead_gl_account'
			});
			console.log('setAccountBalance', 'account: ' + account);
			REC.setValue('custrecord_ead_account_balance', dealEscrowLib.getAccountBalance(account), true);
			REC.setValue({
				fieldId: 'custrecord_ead_amnt_avail_release',
				value: dealEscrowLib.getAccountBalance(account),
				ignoreFieldChange: true
			});
		}

		//======================================================================================================================
		function showErrorMessage(msgTitle, msgText) {
			var myMsg = message.create({
				title: msgTitle,
				message: msgText,
				type: message.Type.WARNING
			});
			myMsg.show({
				duration: 12900
			});
			window.scrollTo(0, 0);
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			saveRecord: saveRecord,
			cancelDisbursement: cancelDisbursement,
			createDisbursementTxns: createDisbursementTxns
		};
	});