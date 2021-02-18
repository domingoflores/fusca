/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime', 'N/transaction', 'N/currentRecord', 'N/log', 'N/ui/dialog', 'N/ui/message', 'N/record', 'N/search', 'N/url', 'N/https'
		,'/SuiteScripts/Pristine/libraries/voidTrackingListLibrary.js'
		,'/SuiteScripts/Pristine/libraries/voidTrackingLibrary.js'
	],
	/**
	 * -----------------------------------------------------------
	 * voidTrackingClient.js
	 * ___________________________________________________________
	 * Void Tracking client script
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2018-05-21	
	 *
 	 * 2019-12 Updated as part of ticket ATP-1350 by Ken C
	 * ___________________________________________________________
	 */
	function(runtime, transaction, currentRecord, log, dialog, msg, record, search, url, https
		,vtListLib, vtLib
		) {

		var scriptName = "voidTrackingClient.js";
		var vtStatus = vtListLib.vtList.vtStatus;
		var voidTrackingRecType = vtListLib.recordType.VoidTracking;
		var transactionConstant = vtListLib.transactionConstant;

		function pageInit(context) {
			var funcName = scriptName + '-->pageInit';
			console.log(funcName);
			// If there is a Case then protect the Create Case field
			var linkedCase = parseInt(context.currentRecord.getValue('custrecord_vt_case')) || null;
			if (linkedCase) {
				createCaseField = context.currentRecord.getField('custrecord_vt_create_case');
				createCaseField.isDisabled = true;
			}

			var isFxContractReturnedPayment = false;
			if (context.currentRecord.getValue('custrecord_vt_fx_curr_contract')) { isFxContractReturnedPayment = true; }
			
			// Get the Credit Memo ID because we derive values from that transaction 
			var creditMemoID = parseInt(context.currentRecord.getValue('custrecord_vt_credit_memo')) || null;
			console.log(funcName, 'creditMemoID: ' + JSON.stringify(creditMemoID));
			// Get the Customer Refund ID because we derive values from that transaction
			var custRefundID = parseInt(context.currentRecord.getValue('custrecord_vt_customer_refund')) || null;
			console.log(funcName, 'custRefundID: ' + JSON.stringify(custRefundID));
			// Derive the Amount fields from the Credit Memo and calculate Bank fee
			var amountFields = deriveAmountFields(context, creditMemoID, custRefundID);
			console.log(funcName, 'amountFields: ' + JSON.stringify(amountFields));
			// Handle Responsible Party field
			handleRespPartyField(context, amountFields.bankFeeAmount);

			//Highlight Mandatory fields
			var mandatoryFields = ['custrecord_vt_return_reason'];
			var paymentMethod = context.currentRecord.getValue('custrecord_vt_paymethod');
			if (paymentMethod == transactionConstant.paymentMethodWireTfr) { mandatoryFields.push('custrecord_vt_bank_return_amount'); }
			if (amountFields.bankFeeAmount > 0)                            { mandatoryFields.push('custrecord_vt_responsible_party');  }
			if (isFxContractReturnedPayment)                               { 
				mandatoryFields.push('custrecord_vt_bank_return_curr');   
				mandatoryFields.push('custrecord_vt_bank_ref_nbr');   
			}
			setFieldLabelsRed(context, mandatoryFields);
		}

		function fieldChanged(context) {
			var funcName = scriptName + '-->fieldChanged';
			// console.log(funcName);
			console.log(funcName, 'context.fieldId: ' + context.fieldId);
		
			// If the user changes the Bank Return Amount on the form then:
			// 1) validate it (cannot be negative). 
			// 2) the Bank Fee field should be recalculated
			if (context.fieldId === 'custrecord_vt_bank_return_amount') {

				var srsPaymtFeeAmount = context.currentRecord.getValue('custrecord_vt_srs_paymt_fee_amount') || 0;
				var refundAmount = context.currentRecord.getValue('custrecord_vt_refund_amount') || 0;

				var bankReturnAmount = context.currentRecord.getValue('custrecord_vt_bank_return_amount') || 0;
				enforcePositiveBankReturnAmount(context, bankReturnAmount);

				var bankFeeAmount = vtLib.calcBankFeeAmount(bankReturnAmount, refundAmount);
				console.log(funcName, 'bankFeeAmount: ' + bankFeeAmount);

				//Now set the field value on the form
				context.currentRecord.setValue({
					fieldId: 'custrecord_vt_bank_fee_amount',
					value: bankFeeAmount,
					ignoreFieldChange: true
				});
				var paymentMethod = context.currentRecord.getValue('custrecord_vt_paymethod') || 0;
				enforceBankFeeAmountRules(context, bankFeeAmount, paymentMethod);
			
				// Handle Responsible Party field
				handleRespPartyField(context, bankFeeAmount);
			}
		}

		// This function is invoked when the Process Returned Payment button on the Exchange Record is pressed
		// See the button setup in user event script Returned Payment Button
		function processReturnedPayment() {

			var currentExRec = currentRecord.get();
			var exRecID = currentExRec.id;
			// Find out if there is already an active and incomplete Void Tracking record
			// If so, take the user to that row in edit mode.
			// If not, take the user to a new Void Tracking record in edit mode
			var existingVTRecID = vtLib.getExistingVTRec(exRecID, '');
			var voidTrackingURL = null;
			if (existingVTRecID) {
				voidTrackingURL = '/app/common/custom/custrecordentry.nl?id=';
				voidTrackingURL += existingVTRecID;
				voidTrackingURL += '&rectype=';
				voidTrackingURL += voidTrackingRecType;
				// voidTrackingURL += '&e=T';
			} else {
				voidTrackingURL = '/app/common/custom/custrecordentry.nl?rectype=';
				voidTrackingURL += voidTrackingRecType;
				voidTrackingURL += '&record.custrecord_vt_exchange_record=';
				voidTrackingURL += exRecID;
			}

			window.open(voidTrackingURL, "New Void Tracking Record");
		}

		
		//============================================================================================================================
		// This function is invoked when the Void Payment button on the Void Tracking record is pressed
		// and the payment involved a Foreign Currency Conversion 
		//============================================================================================================================
		function voidPaymentFxCurrencyConversion() {
			
			try {document.getElementById("tr_custpage_void_payment_button").style.display = "none";}catch(e){}
			// Get the current Void Tracking record object...
			var currentVTRec = currentRecord.get();
			var vtRecID = currentVTRec.id;
			var vtFieldValues = search.lookupFields({
				type: 'customrecord_void_tracking',
				id: vtRecID,
				columns: [ 'id', 'custrecord_vt_exchange_record', 'custrecord_vt_review_note','custrecord_vt_shareholder', 'custrecord_vt_return_reason'					  
					      ,'custrecord_vt_bank_return_amount', 'custrecord_vt_create_case', 'custrecord_vt_status'
					      ,'custrecord_vt_void_activity', 'custrecord_vt_case', 'custrecord_vt_deal', 'custrecord_vt_deal.custentity_acq_deal_financial_bank_accou'
					      ,'custrecord_vt_responsible_party'
					      ,'custrecord_vt_fx_curr_contract'
					      ,'custrecord_vt_bank_ref_nbr'
					      ]
				});
			
			// Check the status of the Void Tracking record and exit if = Voiding, Completed, Canceled
			var currVTStatus = Number(vtFieldValues.custrecord_vt_status[0].value);
			if (currVTStatus === vtStatus.Completed || vtStatus === vtStatus.Canceled || vtStatus === vtStatus.Voiding) { return; }
			
			var vtValidationResponse = vtLib.validateVoidPayment(vtFieldValues);
			console.log('voidPayment' ,'vtValidationResponse: ' + JSON.stringify(vtValidationResponse));
			var alertOptions = null;
			if (vtValidationResponse.vtRecValid) {
				// Offer confirmation dialog before proceeding
				var options = { message:'Are you sure you want to continue?' ,title:"Void Payment?" };
				dialog.confirm(options).then(function(result) {
						if (result) { //If user presses OK then go ahead and void
							console.log('voidPaymentFxCurrencyConversion', 'Void Requested');
							processVoidPaymentSL(vtRecID ,true);
						}
					}).catch(function(reason) {});
			} 
			else { showErrorMessage('Cannot initiate Void Payment', vtValidationResponse.vtValidationErrors); }
			
		}

		
		//============================================================================================================================
		// This function is invoked when the Void Payment button on the Void Tracking record is pressed
		// See the button setup in user event script Void Tracking UE
		//============================================================================================================================
		function voidPayment() {
			try {document.getElementById("tr_custpage_void_payment_button").style.display = "none";}catch(e){}
			// Get the current Void Tracking record object...
			var currentVTRec = currentRecord.get();
			//...so that you can get the ID and lookup all the field values you need 
			var vtRecID = currentVTRec.id;
			var vtFieldValues = search.lookupFields({
				type: 'customrecord_void_tracking',
				id: vtRecID,
				columns: ['id', 'custrecord_vt_exchange_record', 'custrecord_vt_review_note', 'custrecord_vt_credit_memo',
					'custrecord_vt_credit_memo.tranid', 'custrecord_vt_shareholder', 'custrecord_vt_return_reason',
					'custrecord_vt_customer_refund', 'custrecord_vt_bank_fee_amount', 'custrecord_vt_responsible_party',
					'custrecord_vt_bank_return_amount', 'custrecord_vt_create_case', 'custrecord_vt_srs_waives_fut_fee', 'custrecord_vt_status',
					'custrecord_vt_void_activity', 'custrecord_vt_case', 'custrecord_vt_deal', 'custrecord_vt_deal.custentity_acq_deal_financial_bank_accou',
					'custrecord_vt_srs_paymt_fee_amount'
				   ,'custrecord_vt_fx_curr_contract'
				   ,'custrecord_vt_bank_ref_nbr'
				]
			});
			
			// Check the status of the Void Tracking record and exit if = Voiding, Completed, Canceled
			var currVTStatus = Number(vtFieldValues.custrecord_vt_status[0].value);
			if (currVTStatus === vtStatus.Completed || vtStatus === vtStatus.Canceled || vtStatus === vtStatus.Voiding) {
				// I'm hoping this catches the situation where the user presses the void button more than once
			} else {
				// Call the validation function passing all the looked up fields and 
				// receiving an object indicating validation success or failure and 
				// validation errors and anything else that could be useful
				var vtValidationResponse = vtLib.validateVoidPayment(vtFieldValues);
				console.log('voidPayment', 'vtValidationResponse: ' + JSON.stringify(vtValidationResponse));
				var alertOptions = null;
				if (vtValidationResponse.vtRecValid) {
					// Offer confirmation dialog before proceeding
					// To enable user to confirm Bank Fee is acceptable
					var options = {
						message: 'Are you sure you want to continue?',
						title: "Bank Fee amount is $" + vtValidationResponse.bankFeeAmount 
					};
					dialog.confirm(options).then(function(result) {
							if (result) {
								//If user presses OK then go ahead and void
								console.log('voidPayment', 'Void Requested');
								processVoidPaymentSL(vtRecID);
							}
						})
						.catch(function(reason) {});

				} else {
					showErrorMessage('Cannot initiate Void Payment', vtValidationResponse.vtValidationErrors);
				}
			}
		}

		function cancelVoidTracking() {

			var currentVTRec = currentRecord.get();
			// Check the status of the Void Tracking record and exit if = Voiding, Completed, Canceled
			var vtFieldValues = search.lookupFields({
				type: 'customrecord_void_tracking',
				id: currentVTRec.id,
				columns: ['custrecord_vt_status']
			});
			var currVTStatus = Number(vtFieldValues.custrecord_vt_status[0].value);
			if (currVTStatus === vtStatus.Completed || currVTStatus === vtStatus.Canceled || currVTStatus === vtStatus.Voiding) {} else {
				vtLib.updateVTStatus(currentVTRec.id, vtStatus.Canceled);
			}
			location.reload(true);
		}

		function completeVoidTracking() {
			var currentVTRec = currentRecord.get();
			// Check the status of the Void Tracking record and exit if = Voiding, Completed, Canceled
			var vtFieldValues = search.lookupFields({
				type: 'customrecord_void_tracking',
				id: currentVTRec.id,
				columns: ['custrecord_vt_status']
			});
			var currVTStatus = Number(vtFieldValues.custrecord_vt_status[0].value);
			if (currVTStatus === vtStatus.Voiding) {
				vtLib.updateVTStatus(currentVTRec.id, vtStatus.Completed);
			}
			location.reload(true);
		}

		function processVoidPaymentSL(vtRecID ,isForeignCurrencyConversionPayment) {
			console.log("processVoidPaymentSL - : vtRecID" + JSON.stringify(vtRecID));
			var messagetype = null;
			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_utility_sl', // Utilities Suitelet
				deploymentId: 'customdeploy_utility_sl',
				returnExternalUrl: false
			});

			var domain = url.resolveDomain({ hostType:url.HostType.APPLICATION });
			console.log("domain: " + domain);

			var action = "";
			if (isForeignCurrencyConversionPayment) { action = "processVoidPaymentFCCPayment";  }
			else { action = "processVoidPayment"; }
			
			var fullSuiteletURL = "https://" + domain + suiteletURL + "&action=" + action + "&vtRecID=" + vtRecID;
			console.log("fullSuiteletURL: " + JSON.stringify(fullSuiteletURL));

			var myMsg2 = msg.create({
	            title: "Voiding Transactions", 
	            message: "Voiding transactions. Please wait...", 
	            type: msg.Type.INFORMATION
	        });

	        myMsg2.show();
		        
			https.post.promise({url: fullSuiteletURL,body: {}})
				.then(function(response) { location.reload(true); })
		    	.catch(function onRejected(reason) {
		        	log.error({title: 'Invalid Request: ', details: reason });
		    		location.reload(true);
		    	})
		}

		function setFieldLabelsRed(context, fields) {
			var formField = null;
			var fieldLabel = null;
			for (var i = 0; i < fields.length; i++) {
				formField = context.currentRecord.getField(fields[i]);
				fieldLabel = formField.label;
				if (fieldLabel.search('<font') === -1) {
					formField.label = '<font color="red">' + fieldLabel + '</font>';
				}
			}
		}

		function unhighlightFieldLabels(context, fields) {
			var formField = null;
			var fieldLabel = null;
			var labelStart = null;
			var labelEnd = null;

			for (var i = 0; i < fields.length; i++) {
				formField = context.currentRecord.getField(fields[i]);
				fieldLabel = formField.label;
				labelStart = fieldLabel.search('>');
				if (labelStart !== -1) {
					fieldLabel = fieldLabel.substring(labelStart + 1, 80);
					labelEnd = fieldLabel.search('<');
					if (labelEnd !== -1) {
						fieldLabel = fieldLabel.substring(0, labelEnd);
					}
				}
				formField.label = fieldLabel;
			}
		}

		function enforcePositiveBankReturnAmount(context, bankReturnAmount) {
			if (bankReturnAmount < 0) {
				dialog.alert({
					title: 'Invalid Bank Return Amount',
					message: 'Bank Return Amount may not be negative. Click OK to continue.'
				}).then().catch();
				// context.currentRecord.setValue('custrecord_vt_bank_return_amount','',true);
				context.currentRecord.setValue({
					fieldId: 'custrecord_vt_bank_return_amount',
					value: '',
					ignoreFieldChange: true
				});
			}
		}

		function enforceBankFeeAmountRules (context, bankFeeAmount, paymentMethod) {
			var funcName = scriptName + '-->enforceBankFeeAmountRules';
			console.log(funcName, 'bankFeeAmount: ' + bankFeeAmount);
			console.log(funcName, 'paymentMethod: ' + paymentMethod);
			console.log(funcName, 'transactionConstant.paymentMethodWireTfr: ' + transactionConstant.paymentMethodWireTfr);
			
			if (context.currentRecord.getValue('custrecord_vt_fx_curr_contract')) {
				if (context.currentRecord.getValue('custpage_settle_currency') != context.currentRecord.getValue('custpage_refund_currency')) { return; }
			}

			if (bankFeeAmount < 0) {
				dialog.alert({
					title: 'Invalid Bank Fee Amount',
					message: 'Bank Fee Amount may not be negative. Click OK to continue.'
				}).then().catch();
				// context.currentRecord.setValue('custrecord_vt_bank_return_amount','',true);
				context.currentRecord.setValue({
					fieldId: 'custrecord_vt_bank_return_amount',
					value: '',
					ignoreFieldChange: true
				});
			} else {
				if (paymentMethod != transactionConstant.paymentMethodWireTfr && bankFeeAmount != 0) {
					dialog.alert({
						title: 'Invalid Bank Fee Amount',
						message: 'Bank Fee Amount only permitted for Wire Transfers. Click OK to continue.'
					}).then().catch();
					// context.currentRecord.setValue('custrecord_vt_bank_return_amount','', true);				
					context.currentRecord.setValue({
						fieldId: 'custrecord_vt_bank_return_amount',
						value: '',
						ignoreFieldChange: true
					});
				}
			}
		}

		function deriveAmountFields(context, creditMemoID, custRefundID) {
			var funcName = scriptName + '-->deriveAmountFields';
			// Get the Payment Method
			var payMethod = context.currentRecord.getValue('custrecord_vt_paymethod');
			console.log(funcName, 'payMethod: ' + JSON.stringify(payMethod));
			//Get SRS Fee charged from Credit Memo 
			var srsPaymtFeeAmount = context.currentRecord.getValue('custrecord_vt_srs_paymt_fee_amount') || 0;
			srsPaymtFeeAmount = vtLib.getSRSPaymtFeeAmount(creditMemoID) || 0;
			// context.currentRecord.setValue('custrecord_vt_srs_paymt_fee_amount', srsPaymtFeeAmount , true);
			context.currentRecord.setValue({
				fieldId: 'custrecord_vt_srs_paymt_fee_amount',
				value: srsPaymtFeeAmount,
				ignoreFieldChange: true
			});

			// Get Refund Amount from Customer Refund only if the field is zero
			var refundAmount = context.currentRecord.getValue('custrecord_vt_refund_amount') || 0;
			refundAmount = vtLib.getRefundAmount(custRefundID) || 0;
			// context.currentRecord.setValue('custrecord_vt_refund_amount', refundAmount, true);
			context.currentRecord.setValue({
				fieldId: 'custrecord_vt_refund_amount',
				value: refundAmount,
				ignoreFieldChange: true
			});

			// Now set the bank return amount = the refund amount if not wire transfer and protect field
			var bankReturnAmount = 0;
			if (payMethod == transactionConstant.paymentMethodWireTfr) { 
				bankReturnAmount = context.currentRecord.getValue('custrecord_vt_bank_return_amount')
			} else {
				bankReturnAmount = refundAmount;
				bankReturnAmountField = context.currentRecord.getField('custrecord_vt_bank_return_amount');
				bankReturnAmountField.isDisabled = true;
			}
			//Now set the field value on the form
			context.currentRecord.setValue({
				fieldId: 'custrecord_vt_bank_return_amount',
				value: bankReturnAmount,
				ignoreFieldChange: true
			});
			
			// Now calculate the bank fee amount
			var bankFeeAmount = vtLib.calcBankFeeAmount(bankReturnAmount, refundAmount);

			//Now set the field value on the form
			context.currentRecord.setValue({
				fieldId: 'custrecord_vt_bank_fee_amount',
				value: bankFeeAmount,
				ignoreFieldChange: true
			});
			var amountFields = {
				srsPaymtFeeAmount: srsPaymtFeeAmount,
				refundAmount: refundAmount,
				bankReturnAmount: bankReturnAmount,
				bankFeeAmount: bankFeeAmount
			};
			return amountFields;
		}


		function showErrorMessage(msgTitle, msgText) {
			var myMsg = msg.create({
				title: msgTitle,
				message: msgText,
				type: msg.Type.ERROR
			});
			myMsg.show({
				duration: 7500
			});
		}

		function handleRespPartyField(context, bankFeeAmount) {
			var funcName = scriptName + '-->handleRespPartyField';
			console.log(funcName, 'bankFeeAmount: ' + bankFeeAmount);
			
			// If Bank Fee Amount is $0.00 then Responsible Party field should be set to blank or Not Applicable and should not be editable
			var respPartyField = context.currentRecord.getField('custrecord_vt_responsible_party');
			// If the Bank Fee Amount is > $0.00 then this field must be populated so that the system will know how to process the fee taken by the bank:
			if (bankFeeAmount > 0) {
				console.log(funcName, 'bankFeeAmount > 0 ' + bankFeeAmount);
				respPartyField.isDisabled = false;
				var mandatoryFields = ['custrecord_vt_responsible_party'];
				setFieldLabelsRed(context, mandatoryFields);
			} else {
				console.log(funcName, 'bankFeeAmount <= 0 ' + bankFeeAmount);
				// The field must be disabled before setting the value otherwise the setValue does not work
				if (respPartyField) {
					respPartyField.isDisabled = true;
				}
				// context.currentRecord.setValue('custrecord_vt_responsible_party','',true);
				context.currentRecord.setValue({
					fieldId: 'custrecord_vt_responsible_party',
					value: '',
					ignoreFieldChange: true
				});
				unhighlightFieldLabels(context, ['custrecord_vt_responsible_party']);
			}
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			processReturnedPayment: processReturnedPayment,
			voidPayment: voidPayment,
			cancelVoidTracking: cancelVoidTracking,
			completeVoidTracking: completeVoidTracking
		   ,voidPaymentFxCurrencyConversion: voidPaymentFxCurrencyConversion	
		};
	});