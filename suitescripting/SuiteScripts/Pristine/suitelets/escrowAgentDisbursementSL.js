/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *
 * This suitelet supports Disbursement Management ATO-103 
 */
define(['N/record', 'N/runtime', 'N/search', 'N/url'
	, '/.bundle/132118/PRI_ShowMessageInUI'
	, '/SuiteScripts/Prolecto/Shared/SRS_Constants'
	, '/SuiteScripts/Prolecto/Shared/SRS_Functions'
	, '/SuiteScripts/Pristine/libraries/dealEscrowLibrary.js'
	, '/.bundle/132118/PRI_AS_Engine'
],

	function (record, runtime, search, url
		, priMessage
		, srsConstants
		, srsFunctions
		, dealEscrowLib
		, appSettings
	) {

		var scriptName = "escrowAgentDisbursementSL.js";

		function onRequest(context) {
			var funcName = scriptName + ".onRequest ";
			log.debug(funcName, "Starting: " + JSON.stringify(context.request.parameters));
			log.debug(funcName, "Starting: " + JSON.stringify(context.request.body));

			var action = context.request.parameters.action || "";
			var parmdisbursementid = context.request.parameters.disbursementid;
			if (!parmdisbursementid) {
				throw "parm disbursementid is required";
			}
			var result = {};
			var options = {};
			var retvalue = {};
			retvalue.results = [];

			try {
				switch (action.toLowerCase()) {
					case "createdisbursementtransactions":
						options.disbursement = {};
						options.creditmemo = {};
						options.customerrefund = {};
						options.firstjournalentry = {};
						options.secondjournalentry = {};
						options.thirdjournalentry = {};

						options.disbursement.internalid = parmdisbursementid;
						options.disbursement = getDisbursementFields(options);
						// var validationResponse = dealEscrowLib.validateDisbursementSL(options.disbursement);
						// if (!validationResponse.success) {
						//     priMessage.prepareMessage('Disbursement failed validation', validationResponse.message, priMessage.TYPE.WARNING);
						//     // context.response.write(JSON.stringify(retvalue));
						//     return;
						// }

						options.all_messages = "";

						result = callCreateCreditMemo(options);
						log.audit("Create Credit Memo result ", JSON.stringify(result));
						retvalue.results.push(result);
						retvalue.message = result.message;
						retvalue.messagetitle = result.messagetitle;
						retvalue.messagetype = result.messagetype;
						retvalue.htmlmessage = result.htmlmessage;

						if (!result.success) {
							callUpdateDisbursement(options, retvalue.htmlmessage);
							priMessage.prepareMessage(retvalue.messagetitle, retvalue.message, priMessage.TYPE.WARNING);
							context.response.write(JSON.stringify(retvalue));
							return;
						}

						result = callCreateCustomerRefund(options);
						log.audit("Create Customer Refund result ", JSON.stringify(result));
						retvalue.results.push(result);
						retvalue.message += result.message;
						retvalue.messagetitle = result.messagetitle;
						retvalue.messagetype = result.messagetype;
						retvalue.htmlmessage += result.htmlmessage;

						if (!result.success) {
							//retvalue.message += result.message;
							callUpdateDisbursement(options, retvalue.message);
							retvalue.messagetitle = result.messagetitle;
							retvalue.messagetype = priMessage.TYPE.ERROR;
							//retvalue.htmlmessage += result.htmlmessage;

							priMessage.prepareMessage(retvalue.messagetitle, retvalue.htmlmessage, priMessage.TYPE.WARNING);

							context.response.write(JSON.stringify(retvalue));
							return;
						}
						/*else { 
							retvalue.message += result.message;
							retvalue.htmlmessage += result.htmlmessage;
						}
						*/
						if (options.disbursement.accruedIntBox == true) {

							result = callCreateJournalEntries(options);
							log.audit("Create Journal Entries result ", JSON.stringify(result));
							retvalue.results.push(result);
							retvalue.message += result.message;
							retvalue.messagetitle = result.messagetitle;
							retvalue.messagetype = result.messagetype;
							retvalue.htmlmessage += result.htmlmessage;

							if (!result.success) {
								//retvalue.message += result.message;
								callUpdateDisbursement(options, retvalue.message);
								retvalue.messagetitle = result.messagetitle;
								retvalue.messagetype = priMessage.TYPE.ERROR;
								//retvalue.htmlmessage += result.htmlmessage;

								priMessage.prepareMessage(retvalue.messagetitle, retvalue.htmlmessage, priMessage.TYPE.WARNING);

								context.response.write(JSON.stringify(retvalue));
								return;
							}
						}
						//retvalue.message += result.message;
						//retvalue.htmlmessage += result.htmlmessage;

						//success
						callUpdateDisbursement(options, retvalue.message);

						log.audit("retvalue.messagetype", retvalue.messagetype);

						priMessage.prepareMessage(retvalue.messagetitle, retvalue.htmlmessage, priMessage.TYPE.CONFIRMATION);

						context.response.write(JSON.stringify(retvalue));
						context.response.end;
						return;

						break;

					default:
						log.error(funcName, "action was not handled.");
				} // CASE


			} catch (e) {
				log.error(funcName, e);
				priMessage.prepareMessage("FAILED", e.message, priMessage.TYPE.ERROR);
				callUpdateDisbursement(options, e.message);
				context.response.write(JSON.stringify({
					"messagetitle": "FAILED",
					"htmlmessage": e.message,
					"messagetype": priMessage.TYPE.ERROR
				}));
				context.response.end;
			}


			return;

		} //function onRequest

		function callUpdateDisbursement(options, status_message) {
			var funcName = "callUpdateDisbursement";

			var REC = record.load({
				type: 'customrecord_escrow_agent_disbursement',
				id: options.disbursement.internalid
			});
			if (options.result.success) {
				REC.setValue("custrecord_ead_status", srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Completed"])
				REC.setValue("custrecord_ead_credit_memo", options.creditmemo.recordid);
				REC.setValue("custrecord_ead_cust_refund", options.customerrefund.recordid);
				REC.setValue("custrecord_ead_first_journal", options.firstjournalentry.recordid);
				REC.setValue("custrecord_ead_second_journal", options.secondjournalentry.recordid);
				REC.setValue("custrecord_ead_third_journal", options.thirdjournalentry.recordid);

			} else {
				if (options.creditmemo.recordid) {
					//if credit memo has been created already, update reference here
					REC.setValue("custrecord_ead_credit_memo", options.creditmemo.recordid);
				}
				REC.setValue("custrecord_ead_status", srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Failed"]);
			}
			REC.setValue("custrecord_ead_processing_summary", status_message);

			REC.save();

		}

		function getAccount(classid) {
			var account = null;
			var recclass = null;
			if (classid) {
				var recclass = record.load({
					type: 'classification',
					id: classid
				});
				account = recclass.getValue("custrecord_ar_account");
			}
			if (!account) {
				throw "Account not found for classification " + classid;
			}
			log.audit("found account " + account + " for class " + classid);
			return account;

		}

		function callCreateCreditMemo(options) {
			var result = {};
			var funcName = "callCreateCreditMemo";
			options.creditmemo = {};

			options.creditmemo.customform = srsConstants.CUSTOM_FORMS.ACQ_DIST_AUTH;
			options.creditmemo.autoapply = false;
			options.creditmemo.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
			options.creditmemo.class = srsConstants.CLASS.ACQUIOM_ESCROW_AGENT;
			options.creditmemo.items = [];
			options.creditmemo.entity = options.disbursement.deal;
			options.creditmemo.trandate = new Date(options.disbursement.date);
			options.creditmemo.memo = options.disbursement.memo;
			options.creditmemo.custbodyacq_deal_link = options.disbursement.deal;
			options.creditmemo.custbody_deal_escrow = options.disbursement.dealescrow;
			var account = getAccount(srsConstants.CLASS.ACQUIOM_ESCROW_AGENT);
			options.creditmemo.account = account;


			var item = {};
			item.item = srsConstants.ITEM.AEA_DISBURSEMENT;
			item.quantity = 1;
			item.amount = options.disbursement.amount;
			item.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
			log.debug("options.creditmemo", JSON.stringify(options));

			options.creditmemo.items.push(item);

			return createCreditMemo(options);
		}

		function callCreateCustomerRefund(options) {
			var result = {};
			var funcName = "callCreateCustomerRefund";
			options.customerrefund = {};
			options.customerrefund.items = [];

			//create customer refund
			options.customerrefund.customform = srsConstants.CUSTOM_FORMS.ACQUIOM_CUST_REFUND;
			options.customerrefund.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
			options.customerrefund.class = srsConstants.CLASS.ACQUIOM_ESCROW_AGENT;
			options.customerrefund.customer = options.disbursement.deal;
			options.customerrefund.trandate = new Date(options.disbursement.date);
			options.customerrefund.memo = options.disbursement.memo;
			options.customerrefund.paymentmethod = srsConstants.PAYMENT_METHODS["Check"];
			options.customerrefund.custbodyacq_deal_link = options.disbursement.deal;
			options.customerrefund.custbody_deal_escrow = options.disbursement.dealescrow;
			options.customerrefund.account = options.disbursement.glaccount; //Added by Ken C 6/11/2019


			var item = {};
			item.item = srsConstants.ITEM.AEA_DISBURSEMENT;
			item.quantity = 1;
			item.amount = options.disbursement.amount;
			item.department = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
			log.debug("options.creditmemo", JSON.stringify(options));

			options.customerrefund.items.push(item);

			return createCustomerRefund(options);

		}

		function _selectLine(currentRecord, options, item) {
			var i = 0;
			var internalid = "";
			var amountdue = 0;
			var linepayment = 0;
			var lineid = "";
			var due = 0;

			var itemcount = currentRecord.getLineCount({
				sublistId: options.sublistid
			});

			log.audit("itemcount ", itemcount);


			//			var csvFile = file.create({
			//	            name: "lineids.json.txt",
			//	            contents: JSON.stringify(currentRecord),			//write header row 
			//	            folder: 356735, 
			//	            fileType: file.Type.PLAINTEXT
			//	        });
			//			csvFile.save();


			//			return;
			//if index is not selected initialize choises if invoice had been selected
			for (i = 0; i < itemcount; i += 1) {
				internalid = currentRecord.getSublistValue({
					sublistId: options.sublistid,
					fieldId: "internalid",
					line: i
				});

				lineid = currentRecord.getSublistValue({
					sublistId: options.sublistid,
					fieldId: "line",
					line: i
				});

				log.audit("internalid vs cm internalid ", internalid + "  " + options.creditmemo.recordid)
				//console.log(internalid + ",  " + invoice)
				if (parseInt(internalid, 10) === parseInt(options.creditmemo.recordid, 10)) {
					currentRecord.selectLine({
						sublistId: options.sublistid,
						line: i
					});
					log.audit("line found");
					currentRecord.setCurrentSublistValue({
						sublistId: options.sublistid,
						value: true,
						fieldId: "apply"
					});


					currentRecord.setCurrentSublistValue({
						sublistId: options.sublistid,
						value: item.amount,
						fieldId: "amount"
					});
					currentRecord.commitLine({
						sublistId: options.sublistid
					});

				}
			}
			//return retValue;
		}

		function createCustomerRefund(options) {
			log.debug('createCustomerRefund');

			var message = '';
			var success = false;
			var recordid = null;
			var messagetype = priMessage.TYPE.ERROR;
			var messagetitle = "FAILED";
			var htmlmessage = "";

			var i = 0;
			var key = "";
			if (!options.result) {
				options.result = {};
				options.result.message = "";
			}

			// // Create customer refund
			var customerrefund = record.create({
				type: record.Type.CUSTOMER_REFUND,
				isDynamic: true
			});

			for (key in options.customerrefund) {
				if (!Array.isArray(options.customerrefund[key])) {
					//Set body fields
					customerrefund.setValue({
						fieldId: key,
						value: options.customerrefund[key]
						//						,ignoreFieldChange: true
					});
				}
			}

			var items = options.customerrefund.items;
			var item = {};
			options.sublistid = "apply";
			for (i = 0; i < items.length; i += 1) {
				item = items[i];
				_selectLine(customerrefund, options, item);
			}

			try {
				recordid = customerrefund.save();
				options.customerrefund.recordid = recordid; //store for future reference 
				//                options.result.message += "Customer Refund " + recordid + " created.";
				message = 'Customer Refund ' + recordid + ' created. ';
				htmlmessage = 'Customer Refund ' + srsFunctions.getAnchor("customerrefund", recordid) + ' created. ' + '<br>';
				success = true;
				messagetype = priMessage.TYPE.CONFIRMATION;
				messagetitle = "Completed";
			} catch (e) {
				log.error('createCustomerRefund', 'e: ' + JSON.stringify(e));
				message = 'Failed to create Customer Refund for Escrow Agent Disbursement. Error: ' + e.message + '<br>';
				htmlmessage = message;
				//                options.result.message += "Failed to create Customer Refund: " + e.message;
			}
			options.result.success = success;

			return {
				"success": success,
				"recordid": recordid,
				"message": message,
				"messagetitle": messagetitle,
				"htmlmessage": htmlmessage,
				"messagetype": messagetype
			};
		}

		function createCreditMemo(options) {
			log.debug('createCreditMemo');


			var message = '';
			var success = false;
			var recordid = null;
			var i = 0;
			var key = "";
			var messagetype = priMessage.TYPE.ERROR;
			var messagetitle = "FAILED";
			var htmlmessage = "";

			if (!options.result) {
				options.result = {};
				options.result.message = "";
			}


			// // Create credit memo
			var creditmemo = record.create({
				type: record.Type.CREDIT_MEMO,
				isDynamic: true
			});

			for (key in options.creditmemo) {
				if (!Array.isArray(options.creditmemo[key])) {
					//Set body fields
					creditmemo.setValue({
						fieldId: key,
						value: options.creditmemo[key]
						//						,ignoreFieldChange: true
					});
				}
			}

			var items = options.creditmemo.items;
			var item = {};
			for (i = 0; i < items.length; i += 1) {
				item = items[i];
				creditmemo.selectNewLine('item');
				for (key in item) {
					creditmemo.setCurrentSublistValue('item', key, item[key]);
				}
				creditmemo.commitLine('item');
			}

			try {
				recordid = creditmemo.save();
				options.creditmemo.recordid = recordid; //store for future reference 

				message = 'Credit Memo ' + recordid + ' created. ';
				htmlmessage = 'Credit Memo ' + srsFunctions.getAnchor("creditmemo", recordid) + ' created. ' + '<br>';

				success = true;
				messagetype = priMessage.TYPE.CONFIRMATION;
				messagetitle = "Completed";


			} catch (e) {
				log.debug('createCreditMemo', 'e: ' + JSON.stringify(e));
				message = 'Failed to create Credit Memo for Escrow Agent Disbursement. Error: ' + e.message + '<br>';
				htmlmessage = message;
			}



			return {
				"success": success,
				"recordid": recordid,
				"message": message,
				"messagetitle": messagetitle,
				"htmlmessage": htmlmessage,
				"messagetype": messagetype
			};
		}

		function getDisbursementFields(options) {
			var retValue = {};
			var dbFieldValues = search.lookupFields({
				type: 'customrecord_escrow_agent_disbursement',
				id: options.disbursement.internalid,
				columns: ['custrecord_ead_deal', 'custrecord_ead_deal_escrow', 'custrecord_ead_statement_memo', 'custrecord_ead_disbursement_dt', 'custrecord_ead_disbursement_amt', 'custrecord_ead_gl_account', 'custrecord_ead_status', 'custrecord_ead_pend_claim_override', 'custrecord_ead_include_accrued_int', 'custrecord_ead_accrued_int_amnt', 'custrecord_ead_amnt_avail_release', 'custrecord_ead_account_balance']
			});

			log.debug('getDisbursementFields', 'dbFieldValues: ' + JSON.stringify(dbFieldValues));

			retValue.dealescrow = Number(dbFieldValues.custrecord_ead_deal_escrow[0].value);
			log.debug('getDisbursementFields', 'dealescrow: ' + JSON.stringify(retValue.dealescrow));

			retValue.deal = Number(dbFieldValues.custrecord_ead_deal[0].value);
			log.debug('getDisbursementFields', 'deal: ' + JSON.stringify(retValue.deal));

			retValue.memo = dbFieldValues.custrecord_ead_statement_memo;
			log.debug('getDisbursementFields', 'memo: ' + JSON.stringify(retValue.memo));

			retValue.date = dbFieldValues.custrecord_ead_disbursement_dt;
			log.debug('getDisbursementFields', 'date: ' + JSON.stringify(retValue.date));

			retValue.amount = Number(dbFieldValues.custrecord_ead_disbursement_amt);
			log.debug('getDisbursementFields', 'amount: ' + JSON.stringify(retValue.amount));

			retValue.glaccount = Number(dbFieldValues.custrecord_ead_gl_account[0].value); //Added by Ken C 6/11/2019
			log.debug('getDisbursementFields', 'glaccount: ' + JSON.stringify(retValue.glaccount)); //Added by Ken C 6/11/2019

			retValue.status = Number(dbFieldValues.custrecord_ead_status[0].value);
			log.debug('accountId', 'status: ' + JSON.stringify(retValue.status));

			retValue.overridePendingClaims = Number(dbFieldValues.custrecord_ead_pend_claim_override);
			log.debug('getDisbursementFields', 'overridePendingClaims: ' + JSON.stringify(retValue.overridePendingClaims));

			retValue.accruedIntBox = dbFieldValues.custrecord_ead_include_accrued_int; //checkbox
			log.debug('getDisbursementFields', 'accruedIntBox: ' + JSON.stringify(retValue.accruedIntBox));

			retValue.accruedInterestAmount = Number(dbFieldValues.custrecord_ead_accrued_int_amnt);
			log.debug('getDisbursementFields', 'accruedInterestAmount: ' + JSON.stringify(retValue.accruedInterestAmount));

			retValue.amountAvailableForRelease = Number(dbFieldValues.custrecord_ead_amnt_avail_release);
			log.debug('getDisbursementFields', 'amountAvailableForRelease: ' + JSON.stringify(retValue.amountAvailableForRelease));

			retValue.GLbalance = Number(dbFieldValues.custrecord_ead_account_balance);
			log.debug('getDisbursementFields', 'GLbalance: ' + JSON.stringify(retValue.GLbalance));

			retValue.internalid = options.disbursement.internalid; //since we will object, preserve its' internal id  

			return retValue;
		}

		function createTransaction(options, recordtype, recordtype_node_name, transaction_type) {
			var message = '';
			var htmlmessage = '';

			try {
				var transaction = record.create({
					type: recordtype,
					isDynamic: true,
				});

				log.debug('creating transaction...', '');

				for (key in options[recordtype_node_name]) {
					if (!Array.isArray(options[recordtype_node_name][key])) {
						//Set body fields
						transaction.setValue({
							fieldId: key,
							value: options[recordtype_node_name][key]
							//						,ignoreFieldChange: true
						});
					}
				}

				var items = options[recordtype_node_name].items;
				for (i = 0; i < items.length; i += 1) {
					item = items[i];
					transaction.selectNewLine('line');
					for (key in item) {
						transaction.setCurrentSublistValue('line', key, item[key]);
					}
					transaction.commitLine('line');
				}
				transaction.save();

			} catch (e) {
				log.error('transaction Error', e.message);
				log.debug('transaction', 'e: ' + JSON.stringify(e));
				message = 'Failed to create ' + transaction_type + ' for Escrow Agent Disbursement. Error: ' + e.message + '<br>';
				htmlmessage += message;
				return {
					'message': message,
					'htmlmessage': htmlmessage,
					'success': false

				};
			}
			log.debug('CREATED transaction id=' + transaction.id);
			recordid = transaction.id;
			options[recordtype_node_name].recordid = recordid
			message += '' + transaction_type + ' ' + recordid + ' created. ';
			htmlmessage += '' + transaction_type + ' ' + srsFunctions.getAnchor(recordtype, recordid) + ' created. ' + '<br>';

			return {
				'message': message,
				'htmlmessage': htmlmessage,
				'success': true
			};
		}

		//ATP-1564 helper function create first journal
		function callCreateJournalEntries(options) {
			var funcName = "callCreateJournalEntries";

			//return object
			var message = '';
			var success = false;
			var recordid = null;
			var messagetype = priMessage.TYPE.ERROR;
			var messagetitle = "FAILED";
			var htmlmessage = "";
			var date = new Date();
			var ead_acct_values = JSON.parse(appSettings.readAppSetting("Escrow Agent Disbursement", "EAD Settings"));
			log.debug('app setting object: ', JSON.stringify(ead_acct_values));

			if (options.disbursement.accruedIntBox == true) {


				options.firstjournalentry = {};
				options.firstjournalentry.items = [];

				// static and non static vars to be used on JEs
				options.firstjournalentry.customform = ead_acct_values.custom_form; // SRS Escrow Agent Form
				options.firstjournalentry.custbody1 = ead_acct_values.escrow_tx_list; // Investment Earnings
				options.firstjournalentry.custbody2 = options.disbursement.deal; // acquiom clearinghouse LLC
				options.firstjournalentry.custbody4 = "Investment Earnings";
				options.firstjournalentry.custbody_esc_tx_status = 'RELEASED';
				options.firstjournalentry.custbodyacq_deal_link = options.disbursement.deal; // Acquiom Clearinghouse LLC (Corporate Record) 
				options.firstjournalentry.custbody_deal_escrow = options.disbursement.dealescrow; 
				options.firstjournalentry.custbody_je_accrual_dt = ''; //today date

				//SET UP TEMPLATE FOR JOURNAL ENTRIES 2 clean references from firstjournalentry
				options.secondjournalentry = JSON.parse(JSON.stringify(options.firstjournalentry));
				options.secondjournalentry.custbody_je_accrual_dt = ''; //today date
				options.secondjournalentry.custbodyacq_deal_link = ead_acct_values.acquiom_ch_llc; // acquiom clearinghouse LLC
				options.secondjournalentry.custbody_deal_escrow = ead_acct_values.deal_escrow; // Acquiom Clearinghouse LLC (Corporate Record)-Corporate Account-18
				options.secondjournalentry.custbody2 = ead_acct_values.acquiom_ch_llc;

				//SET UP TEMPLATE FOR THE THIRD TRANSACTION
				options.thirdjournalentry = JSON.parse(JSON.stringify(options.firstjournalentry));
				options.thirdjournalentry.custbody_je_accrual_dt = ''; 
				options.thirdjournalentry.trandate = new Date(date.getFullYear(), date.getMonth() + 1);
				options.thirdjournalentry.custbodyacq_deal_link = ead_acct_values.acquiom_ch_llc; // acquiom clearinghouse LLC
				options.thirdjournalentry.custbody_deal_escrow = ead_acct_values.deal_escrow; // Acquiom Clearinghouse LLC (Corporate Record)-Corporate Account-18
				options.thirdjournalentry.custbody2 = ead_acct_values.acquiom_ch_llc;

				//CLEAR ITEMS ARRAY
				options.secondjournalentry.items = [];
				options.thirdjournalentry.items = [];
				options.itemdetail = {};

				options.itemdetail.lineAccount1 = ead_acct_values.account_one; // 200001 Acquiom Escrow Agent : Acquiom Clearinghouse EA - Interest Overage
				options.itemdetail.lineAccount2 = ead_acct_values.account_two; // 002585 Acquiom Escrow Agent - DR
				options.itemdetail.lineDepartment = ead_acct_values._department; // Client Accounts - Escrow Agent
				options.itemdetail.lineClass = ead_acct_values.account_three; // Client Accounts - Escrow Agent
				options.itemdetail.lineEntity = ead_acct_values.acquiom_ch_llc; // Acquiom Clearinghouse LLC (Corporate Record)
				options.itemdetail.lineMemo = "Investment Earnings";
				options.itemdetail.lineMemo2 = "Investment Earnings for EAD#" + options.disbursement.internalid;
				options.itemdetail.accruedIntBox = options.disbursement.accruedIntBox;
				options.itemdetail.accruedInterestAmount = options.disbursement.accruedInterestAmount; //lineDebt
				options.itemdetail.amountAvailableForRelease = options.disbursement.amountAvailableForRelease;
				options.itemdetail.GLbalance = options.disbursement.GLbalance;

				// FIRST JOURNAL ENTRY items

				var item = {};
				item.account = options.disbursement.glaccount;
				item.department = options.itemdetail.lineDepartment;
				item.class = options.itemdetail.lineClass;
				item.memo = options.itemdetail.lineMemo;
				item.entity = options.disbursement.deal;
				item.debit = options.disbursement.accruedInterestAmount;
				options.firstjournalentry.items.push(item);

				item = {};
				item.account = options.itemdetail.lineAccount2;
				item.department = options.itemdetail.lineDepartment;
				item.class = options.itemdetail.lineClass;
				item.memo = options.itemdetail.lineMemo;
				item.entity = options.disbursement.deal;
				item.credit = options.itemdetail.accruedInterestAmount;
				options.firstjournalentry.items.push(item);
				log.audit("options.item", JSON.stringify(options));

				// SECOND JOURNAL ENTRY items

				item = {};
				item.account = options.itemdetail.lineAccount1;
				item.department = options.itemdetail.lineDepartment;
				item.class = options.itemdetail.lineClass;
				item.memo = options.itemdetail.lineMemo2;
				item.entity = options.itemdetail.lineEntity;
				item.credit = options.disbursement.accruedInterestAmount;
				options.secondjournalentry.items.push(item);

				item = {};
				item.account = options.itemdetail.lineAccount2;
				item.department = options.itemdetail.lineDepartment;
				item.class = options.itemdetail.lineClass;
				item.memo = options.itemdetail.lineMemo2;
				item.entity = options.itemdetail.lineEntity;
				item.debit = options.itemdetail.accruedInterestAmount;
				options.secondjournalentry.items.push(item);
				log.audit("options.item", JSON.stringify(options));

				// THIRD JOURNAL ENTRY items
				item = {};
				item.account = options.itemdetail.lineAccount1;
				item.department = options.itemdetail.lineDepartment;
				item.class = options.itemdetail.lineClass;
				item.memo = options.itemdetail.lineMemo2;
				item.entity = options.itemdetail.lineEntity;
				item.debit = options.disbursement.accruedInterestAmount;
				options.thirdjournalentry.items.push(item);

				item = {};
				item.account = options.itemdetail.lineAccount2;
				item.department = options.itemdetail.lineDepartment;
				item.class = options.itemdetail.lineClass;
				item.memo = options.itemdetail.lineMemo2;
				item.entity = options.itemdetail.lineEntity;
				item.credit = options.itemdetail.accruedInterestAmount;
				options.thirdjournalentry.items.push(item);
				log.audit("options.item", JSON.stringify(options));

				// JE #1
				// for interest amount using GL account
				log.debug('Creating JEs...')
				var ct_response = createTransaction(options, 'journalentry', 'firstjournalentry', 'Accrued Interest Posting');
				log.debug('ct response', JSON.stringify(ct_response));
				success = ct_response.success;
				message += ct_response.message;
				htmlmessage += ct_response.htmlmessage;
				//throw 'htmlmessage' + htmlmessage;
				messagetitle = "Completed";
				messagetype = priMessage.TYPE.CONFIRMATION;
				/*
				// JE #2
				// for the overage account (GL ACCOUNT #200001 ACQUIOM ESCROW AGENT: ACQUOIM CLEARINHOUSE EA - INTEREST OVERAGE). Internal ID = 13002
				*/
				ct_response = createTransaction(options, 'journalentry', 'secondjournalentry', 'Interest Overage Account Posting');
				success = ct_response.success;
				message += ct_response.message;
				htmlmessage += ct_response.htmlmessage;
				//throw 'htmlmessage' + htmlmessage;
				messagetitle = "Completed";
				/*
				// JE #3
				// Forward date the entry to the 1st day of the following month.
				// This is to deposit into the interest overage account (deposit $$$ of interest) into 
				// the (GL Acct #200001 Acquiom Escrow Agent : Acquiom Clearinghouse EA - Interest Overage Internal ID = 13002) to make it whole again. 
				// I.e. the opposite of the debit/credit from the journal out of the Overage account (I.e. Journal #2)
				*/
				ct_response = createTransaction(options, 'journalentry', 'thirdjournalentry', 'Interest Overage Account Reimbursement');
				success = ct_response.success;
				message += ct_response.message;
				htmlmessage += ct_response.htmlmessage;
				messagetitle = "Completed";
				messagetype = priMessage.TYPE.CONFIRMATION;
			}

			return {
				"success": success,
				"recordid": recordid,
				"message": message,
				"messagetitle": messagetitle,
				"htmlmessage": htmlmessage,
				"messagetype": messagetype
			};
		}

		return {
			onRequest: onRequest
		};
	});