/**
 * Exchange Record Client Script
 *
 *
 * Version    Date              Author              Remarks
 * 1.00       8/2/2019          Robert Bender       Requires User Note on change of Suspense Reason upon Save
 *            8/13/2019         Robert Bender       ATP-1104 disable fields for UI only, allow for ODS
 */

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(['N/runtime', 'N/format', 'N/ui/message', 'N/ui/dialog', 'N/currentRecord', 'N/record', 'N/https', 'N/url', 'N/search'
	   ,'/SuiteScripts/Pristine/libraries/paymtInstrLight.js'
	   ,'/SuiteScripts/Pristine/libraries/ExRecAlphaPIClientLibrary.js'
	   ],

	function (runtime, format, message, dialog, currentRecord, record, https, url, search 
			 ,pymtInstr
    		 ,ExRecAlphaPIClient
			 ) {

		var currentDateTime = null;
		var currentUser = null;
		var checkboxFields = [];
		var tsFields = [];
		var userFields = [];

	    var FIELDS   = ExRecAlphaPIClient.objValidation.FIELDS;
		var messages = ExRecAlphaPIClient.objValidation.messages;
		
		//var fxContractField = '';

		var suspenseReasonChanged;
		var suspenseReasonsOld;
		var suspenseReasonsList;

		//======================================================================================================================
		//======================================================================================================================
		function pageInit(context) {
			var mode = context.mode;

			//<ATP-1104>
			var custrecord_exrec_lotechosign_url = context.currentRecord.getField({
				fieldId: "custrecord_exrec_lotechosign_url"
			});

			var custrecord_exrec_exceptionechosign_url = context.currentRecord.getField({
				fieldId: "custrecord_exrec_exceptionechosign_url"
			});

			custrecord_exrec_lotechosign_url.isDisabled = true;
			custrecord_exrec_exceptionechosign_url.isDisabled = true;
			//</ATP-1104>

			// ATO-233
			suspenseReasonChanged = false;
			var rcd = currentRecord.get();
			suspenseReasonsOld = rcd.getValue("custrecord_suspense_reason"); // Get value before any changes are made
			var suspenseReasonsFld = rcd.getField('custrecord_suspense_reason')
			console.log("suspenseReasonsFld: " + JSON.stringify(suspenseReasonsFld));
			suspenseReasonsList = suspenseReasonsFld.getSelectOptions();
			console.log("suspenseReasonsList: " + JSON.stringify(suspenseReasonsList));
			// end ATO-233
			
			var acq_loth_5a_de1_abaswiftnum = context.currentRecord.getValue({ fieldId:"custrecord_acq_loth_5a_de1_abaswiftnum" });
			if (acq_loth_5a_de1_abaswiftnum > "") {
				var acq_lot_aba_ach_status = context.currentRecord.getValue({ fieldId:"custrecord_acq_lot_aba_ach_status" });
				if ( !(acq_lot_aba_ach_status > "") ) { context.currentRecord.setValue({ fieldId:FIELDS.ACH_STATUS ,value:messages.msg_RoutingNumberInvalid_ACH }); }				
			}


		}


		//===========================================================================================================================
		//===========================================================================================================================
		function alertAlex(msg) { // 1144324 - Sara
            var userAlexFodor = 1047697;
			if (runtime.accountId.toLowerCase() == "772390_sb3") { if (runtime.getCurrentUser().id == userAlexFodor) { alert(msg); } }
		}

		
		//======================================================================================================================
		//======================================================================================================================
		function fieldChanged(context) {

			//ATP-1300
			if (context.fieldId === 'custrecord_exrec_giin_validated') {
				checkboxFields = ['custrecord_exrec_giin_validated'];
				tsFields = ['custrecord_exrec_giin_validated_ts'];
				userFields = ['custrecord_exrec_giin_validated_by'];
				setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields);

			}
			
			// ATP-1543
			if (context.fieldId === 'custrecord_acq_lot_priority_payment' || context.fieldId === 'custrecord_acq_lot_payout_type') {
								
				var REC = currentRecord.get();

				const WAIVE_FEES_ALL_PAYMENTS = "2";

				var pmtWaiveFees, payoutWaiveFees;
            	
				if (REC.getValue("custrecord_acq_lot_priority_payment")) 
					pmtWaiveFees = search.lookupFields({type: "customrecord_acq_lot_priority_payment", id: REC.getValue("custrecord_acq_lot_priority_payment"), columns: ["custrecord_acq_lot_pri_pmt_waive_fees"]}).custrecord_acq_lot_pri_pmt_waive_fees;
						
				if (REC.getValue("custrecord_acq_lot_payout_type")) 
					payoutWaiveFees = search.lookupFields({type: "customrecord_payment_type", id: REC.getValue("custrecord_acq_lot_payout_type"), columns: ["custrecord_payout_waive_fees"]}).custrecord_payout_waive_fees;    					

				// if either field has WAVE FEES, and that field is not already correct, then set it
				if ((pmtWaiveFees || payoutWaiveFees) && REC.getValue("custrecord_exrec_waive_fees") != WAIVE_FEES_ALL_PAYMENTS) {
					REC.setValue("custrecord_exrec_waive_fees", WAIVE_FEES_ALL_PAYMENTS);
					dialog.alert({
						title:   "'WAIVE FEES' updated",
						message: 'The WAIVE FEES field was set as a result of your selection'
					});							
				}					

				// if we have both fields, and neither has WAIVE FEES set, and it is currently set, then clear it
				if (REC.getValue("custrecord_acq_lot_priority_payment") && REC.getValue("custrecord_acq_lot_payout_type") && !pmtWaiveFees && !payoutWaiveFees && REC.getValue("custrecord_exrec_waive_fees")) {
					REC.setValue("custrecord_exrec_waive_fees", "");					
					dialog.alert({
						title:   "'WAIVE FEES' cleared",
						message: 'The WAIVE FEES field was cleared as a result of your selection'
					});														
				}				
			}
			
			/**
			 * This function uses N/format module
			 * @return {string}
			 */
			function getCurrentDateTime() {
				// grabs the current Javascript Date/Time and parses it into a format NetSuite accepts
				var now = new Date();
				return format.parse({
					value: now,
					type: format.Type.DATETIMETZ
				});
			}

			/**
			 * This function can timestamp datetime and current user based on the checkbox value
			 * @param {object} context 
			 * @param {boolean} checkboxFields 
			 * @param {string} tsFields :
			 * @param {string} userFields :
			 */
			function setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields) {
				for (var i = 0; i < checkboxFields.length; i++) {
					var fieldValue = context.currentRecord.getValue({
						fieldId: checkboxFields[i]
					});

					if (fieldValue) {
						currentDateTime = getCurrentDateTime();
						currentUser = runtime.getCurrentUser().id;
					} else {
						currentDateTime = '';
						currentUser = '';
					}
					context.currentRecord.setValue({
						fieldId: tsFields[i],
						value: currentDateTime,
						ignoreFieldChange: true

					});
					context.currentRecord.setValue({
						fieldId: userFields[i],
						value: currentUser,
						ignoreFieldChange: true

					});
				}
			}

			// ATP-1162 ========================================================================================================

			const ABA_STATUS_CODES = {
				GOOD: '1',
				BAD: '3',
				INVALID_DATA: '2',
				NOT_FOUND: '4'
			};

			var rec = context.currentRecord;
			var validatedData = '';
			var validRoutingNumber = '';
			var fxContractValue = '';

			switch (context.fieldId) {
				//------------------------------------------------------------------------------------------------------------
				case 'custrecord_suspense_reason':
					suspenseReasonChanged = true;
					console.log("suspenseReasonChanged");
					break;
					
				//------------------------------------------------------------------------------------------------------------
				/* // commented out since custpage field is no longer being used and resetting custom drop down not needed.

				case FIELDS.FX_CURRENCY:
					var currency = rec.getValue({
						fieldId: FIELDS.FX_CURRENCY
					});
					fxContractField = rec.getField({
						fieldId: FIELDS.CUSTOM_FX_CONTRACT
					});

					if (Boolean(currency)) {

						fxContractField.isDisabled = false;

						// Clear out all options in case the Currency field is changed multiple times
						fxContractField.removeSelectOption({
							value: null
						});
						fxContractField.insertSelectOption({
							value: 0,
							text : ' '
						});

						rec.setValue({
							fieldId: FIELDS.CUSTOM_FX_CONTRACT,
							value: ''
						});
					}

					// Disable the custom Contract field if the Currency is set back to blank
					if (!Boolean(currency)) {

						fxContractField.isDisabled = true;
						break;
					}

					fxContractValue = rec.getValue({
						fieldId: FIELDS.CUSTOM_FX_CONTRACT
					});

					if (Boolean(fxContractValue)) {

						// Set the hidden 'native' Contract field back to blank so other sourced fields blank out too
						rec.setValue({
							fieldId: FIELDS.FX_CONTRACT,
							value: ''
						});
					}

					// Get our list of Contracts that match the currency
					var contractList = getFXContracts(currency);

					// Add each Contract to the custom Contract field
					if (Boolean(contractList.length)) {

						fxContractField.isDisabled = false;

						for (var i = 0; i < contractList.length; i++) {

							fxContractField.insertSelectOption({
								value: contractList[i].internalId,
								text: contractList[i].name
							});
						}
					}
					break;
					
				//------------------------------------------------------------------------------------------------------------
				/* // commented out since it the custpage field is no longer being used. 
				case FIELDS.CUSTOM_FX_CONTRACT:
					// Add the value selected in the custom Contract field to the hidden 'native' Contract field
					fxContractValue = rec.getValue({
						fieldId: FIELDS.CUSTOM_FX_CONTRACT
					});

					if ( fxContractValue != 0 ){
						rec.setValue({
							fieldId: FIELDS.FX_CONTRACT,
							value: fxContractValue
						});						
					} else {
						rec.setValue({
							fieldId: FIELDS.FX_CONTRACT,
							value: ''
						});		
					}


					break;
				*/
				//------------------------------------------------------------------------------------------------------------
				case FIELDS.WIRE_NUMBER:
					var paymentMethod_domWire           = 4;
					var paymentMethod_domWire_brokerage = 14;
					var paymentMethod_domWire_bank      = 15;
					var paymentMethod_intWire           = 5;
					var paymentMethod_intWire_brokerage = 12;
					var paymentMethod_intWire_bank      = 13;
					var wireNumber                 = rec.getValue({fieldId:FIELDS.WIRE_NUMBER    });
					var paymentMethod              = rec.getValue({fieldId:FIELDS.PAYMENT_METHOD });
					
					if ( !(wireNumber.trim() > "") ) {
						rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value: null    });
						rec.setValue({ fieldId:FIELDS.WIRE_BANK                  ,value: ''	     });
						rec.setValue({ fieldId:FIELDS.WIRE_STATUS                ,value: ''      });
						rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS          ,value: ''      });
						break;
					}
					
					if (   paymentMethod == paymentMethod_domWire 
						|| paymentMethod == paymentMethod_domWire_brokerage
						|| paymentMethod == paymentMethod_domWire_bank ) { // Domestic Wire - edit for valid ABA Number
						
						var validObj = pymtInstr.validateABARouting(wireNumber ,FIELDS.WIRE_NUMBER ,paymentMethod);
						
						if (validObj && validObj.objLookup && validObj.objLookup.bankName) {
							rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value:validObj.objLookup.internalId        ,ignoreFieldChange:true });
							rec.setValue({ fieldId:FIELDS.WIRE_BANK                  ,value:validObj.objLookup.bankName          ,ignoreFieldChange:true });
							rec.setValue({ fieldId:FIELDS.WIRE_STATUS                ,value:validObj.objLookup.abaStatusCodeText ,ignoreFieldChange:true });
						}
						else {
							var msg = messages.msg_RoutingNumberInvalid_Wire;
							alert(msg);
							rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value: null   });
							rec.setValue({ fieldId:FIELDS.WIRE_BANK                  ,value: ''	    });
							rec.setValue({ fieldId:FIELDS.WIRE_STATUS                ,value: msg	});
						}
						
						rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS              ,value: ''     });
					}
					else 
					if (   paymentMethod == paymentMethod_intWire
						|| paymentMethod == paymentMethod_intWire_brokerage
						|| paymentMethod == paymentMethod_intWire_bank) { // International Wire - edit for valid swift/bic number

						var validObj = pymtInstr.validateSwiftBIC(wireNumber ,null ,null ,null ,false);

						rec.setValue({ fieldId:FIELDS.WIRE_ROUTING_VERIFICATION  ,value: null   });
						rec.setValue({ fieldId:FIELDS.WIRE_BANK                  ,value: ''	    });
						rec.setValue({ fieldId:FIELDS.WIRE_STATUS                ,value: ''     });
						
						if ( validObj && validObj.result === "pass" ) { 
							rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS      ,value: ''     });
						}
						else {
							alert(messages.msg_RoutingNumberInvalid_Swift + ", " + validObj.validationIssue);
							rec.setValue({ fieldId:FIELDS.WIRE_SWIFT_STATUS      ,value: messages.msg_RoutingNumberInvalid_Swift + ", " + validObj.validationIssue });
						}
						
					}
					
					break;
					
				//------------------------------------------------------------------------------------------------------------
				case FIELDS.ACH_NUMBER:
					var achNumber              = rec.getValue({fieldId:FIELDS.ACH_NUMBER });
					var paymentMethod          = rec.getValue({fieldId:FIELDS.PAYMENT_METHOD });
					
					if ( !(achNumber.trim() > "") ) {
						rec.setValue({ fieldId:FIELDS.ABA_ROUTING_VERIFICATION  ,value: null    });
						rec.setValue({ fieldId:FIELDS.ACH_BANK                  ,value: ''	    });
						rec.setValue({ fieldId:FIELDS.ACH_STATUS                ,value: ''	    });
						break;
					}
					
					var validObj = pymtInstr.validateABARouting(achNumber ,FIELDS.ACH_NUMBER ,paymentMethod);
					
					if (validObj && validObj.objLookup && validObj.objLookup.bankName) {
						rec.setValue({ fieldId:FIELDS.ABA_ROUTING_VERIFICATION  ,value:validObj.objLookup.internalId        ,ignoreFieldChange:true });
						rec.setValue({ fieldId:FIELDS.ACH_BANK                  ,value:validObj.objLookup.bankName          ,ignoreFieldChange:true });
						rec.setValue({ fieldId:FIELDS.ACH_STATUS                ,value:validObj.objLookup.abaStatusCodeText ,ignoreFieldChange:true });
					}
					else {
						var msg = messages.msg_RoutingNumberInvalid_ACH;
						rec.setValue({ fieldId:FIELDS.ABA_ROUTING_VERIFICATION  ,value: null    });
						rec.setValue({ fieldId:FIELDS.ACH_BANK                  ,value: ''	    });
						rec.setValue({ fieldId:FIELDS.ACH_STATUS                ,value: msg	    });
					}
					
					break;
					
				//------------------------------------------------------------------------------------------------------------
				case FIELDS.INTMED_ABA_NUMBER:
					var intmedNumber           = rec.getValue({fieldId:FIELDS.INTMED_ABA_NUMBER });
					var paymentMethod          = rec.getValue({fieldId:FIELDS.PAYMENT_METHOD });
					
					if ( !(intmedNumber.trim() > "") ) {
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_VERIFICATION  ,value: null    });
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_BANK          ,value: ''	    });
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_STATUS        ,value: ''	    });
						break;
					}
					
					var validObj = pymtInstr.validateABARouting(intmedNumber ,FIELDS.INTMED_ABA_NUMBER ,paymentMethod);
					
					if (validObj && validObj.objLookup && validObj.objLookup.bankName) {
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_VERIFICATION  ,value:validObj.objLookup.internalId        ,ignoreFieldChange:true });
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_BANK          ,value:validObj.objLookup.bankName          ,ignoreFieldChange:true });
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_STATUS        ,value:validObj.objLookup.abaStatusCodeText ,ignoreFieldChange:true });
					}
					else {
						var msg = messages.msg_RoutingNumberInvalid_Intmed;
						alert(msg);
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_VERIFICATION  ,value: null    });
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_BANK          ,value: ''	    });
						rec.setValue({ fieldId:FIELDS.INTMED_ABA_STATUS        ,value: msg	    });
					}
					
					break;
					
				//------------------------------------------------------------------------------------------------------------
				case FIELDS.INTMED_SWIFT_BIC:
					var intmedSwift = rec.getValue({fieldId:FIELDS.INTMED_SWIFT_BIC });
					
					if ( !(intmedSwift.trim() > "") ) { rec.setValue({ fieldId:FIELDS.INTMED_SWIFT_BIC_STATUS ,value: ''}); break; }
					
					var validObj    = pymtInstr.validateSwiftBIC(intmedSwift ,null ,null ,null ,false);
					
					if ( !(validObj && validObj.result === "pass") ) { alert(messages.msg_SwiftInvalid_Intmed + ", " + validObj.validationIssue); }
					if ( validObj && validObj.result === "pass" ) { 
						rec.setValue({ fieldId:FIELDS.INTMED_SWIFT_BIC_STATUS    ,value: ''     });
					}
					else {
						rec.setValue({ fieldId:FIELDS.INTMED_SWIFT_BIC_STATUS    ,value: messages.msg_SwiftInvalid_Intmed + ", " + validObj.validationIssue });
					}
					
					break;

				//---- ATP-1617 -----------------------------------------------------------------------------------------------
				case "custrecord_acq_loth_4_de1_lotpaymethod":
					if ( rec.getValue({	fieldId:context.fieldId }) ) {
						if ( ! rec.getValue({ fieldId:"custrecord_exrec_shrhldr_settle_curr" }) ) { // if it is empty, default it
							var settlementCurrency_USD = 1;
							rec.setValue({ fieldId:"custrecord_exrec_shrhldr_settle_curr" ,value:settlementCurrency_USD });
						}
					}
					break; // end ATP-1617

					
			} // switch (context.fieldId)

		}
		function postSourcing(context) { }
		/* // commented out the postsourcing function for it is no longer needed.
		function postSourcing(context) {

			var rec = context.currentRecord;
			var fxCurrency = rec.getValue({
				fieldId: FIELDS.FX_CURRENCY
			});

			if (context.fieldId === FIELDS.FX_CURRENCY) {

				// If the Currency field gets set back to blank, clear out the necessary fields
				if (!Boolean(fxCurrency)) {

					rec.setValue({
						fieldId: FIELDS.FX_CONTRACT,
						value: ''
					});

					// Remove the list of values that was added to the custom Contract field before the Currency field was changed to blank
					fxContractField.removeSelectOption({
						value: null
					});

				} else {

					var contract = context.currentRecord.getValue({
						fieldId: FIELDS.CUSTOM_FX_CONTRACT
					});

					if (Boolean(contract) && contract !=0 ) {
						rec.setValue({
							fieldId: FIELDS.FX_CONTRACT,
							value: contract
						});
					} else {
						rec.setValue({
							fieldId: FIELDS.FX_CONTRACT,
							value: ''
						});
					}

				}
			}
		}
		*/

		//======================================================================================================================
		//======================================================================================================================
		function saveRecord(context) {
			var rcd = currentRecord.get();
			var found;

			// ATO-233
			if (suspenseReasonChanged) {
				var suspenseReasonsNew = rcd.getValue("custrecord_suspense_reason");

				if (suspenseReasonsNew != suspenseReasonsOld) {
					var suspenseReasonsAdded = [];
					var suspenseReasonsRemoved = [];
					for (var i = 0; i < suspenseReasonsNew.length; i++) {
						found = false;
						if (suspenseReasonsNew[i] != "") { // empty field contains one empty entry, ignore it
							for (var j = 0; j < suspenseReasonsOld.length; j++) {
								if (suspenseReasonsNew[i] == suspenseReasonsOld[j]) {
									found = true;
								}
							}
							if (!found) {
								suspenseReasonsAdded.push(suspenseReasonsNew[i]);
							}
						}
					}

					for (var ii = 0; ii < suspenseReasonsOld.length; ii++) {
						found = false;
						if (suspenseReasonsOld[ii] != "") { // empty field contains one empty entry, ignore it
							for (var jj = 0; jj < suspenseReasonsNew.length; jj++) {
								if (suspenseReasonsOld[ii] == suspenseReasonsNew[jj]) {
									found = true;
								}
							}
							if (!found) {
								suspenseReasonsRemoved.push(suspenseReasonsOld[ii]);
							}
						}
					}

					if (suspenseReasonsAdded.length > 0 || suspenseReasonsRemoved.length > 0) {
						var notesToBeAdded = [];
						var objNote;

						for (var i = 0; i < suspenseReasonsAdded.length; i++) {
							objNote = getSuspenseReasonNote("adding", suspenseReasonsAdded[i]);
							if (!objNote) {
								return saveCancelled();
							}
							notesToBeAdded.push(objNote);
						}

						for (var j = 0; j < suspenseReasonsRemoved.length; j++) {
							objNote = getSuspenseReasonNote("removing", suspenseReasonsRemoved[j]);
							if (!objNote) {
								return saveCancelled();
							}
							notesToBeAdded.push(objNote);
						}

						var fieldNotesToBeAdded = document.getElementById("custpage_notes_to_be_added");
						if (fieldNotesToBeAdded) {
							fieldNotesToBeAdded.value = JSON.stringify(notesToBeAdded);
						}
					}
				}

			} // if (suspenseReasonChanged)
			// end ATO-233

			return true;
		}

		/**
		 * Searches for all Foreign Currency Conversion Contract records that are not locked and have a Converted Currency that matches
		 * what is selected in the UI
		 *
		 * @param {string} currency - Internal ID of the Currency record
		 *
		 * @returns {Object[]} Array of FCCC Records that match our criteria
		 */
		function getFXContracts(currency) {

			var returnArray = [];

			var columns = [];
			columns.push(search.createColumn({
				name: 'name'
			}));

			var filters = [
				[
					['custrecord_fx_conv_first_approved', 'is', 'F'], 'AND', ['custrecord_fx_conv_second_approved', 'is', 'F']
				],
				'AND',
				['isinactive', 'is', 'F'],
				'AND',
				['custrecord_fx_conv_converted_currency', 'anyof', currency]
			];


			// filters.push(search.createFilter({
			// 	name: 'isinactive',
			// 	operator: search.Operator.IS,
			// 	values: 'F'
			// }));
			// filters.push(search.createFilter({
			// 	name: 'custrecord_fx_conv_converted_currency',
			// 	operator: search.Operator.ANYOF,
			// 	values: currency
			// }));
			// filters.push(search.createFilter({
			// 	name: 'custrecord_fx_conv_is_locked',
			// 	operator: search.Operator.IS,
			// 	values: 'F'
			// }));

			var fxContractSearch = search.create({
				type: 'customrecord_fx_conv_contract',
				columns: columns,
				filters: filters
			});

			var pagedData = fxContractSearch.runPaged({
				pageSize: 1000
			});
			for (var i = 0; i * 1000 < pagedData.count; i++) {
				pagedData.fetch({
					index: i
				}).data.forEach(function (result) {
					var obj = {};
					obj.name = result.getValue({
						name: 'name'
					});
					obj.internalId = result.id;

					returnArray.push(obj);

					return true;
				});
			}

			return returnArray;
		}

		/**
		 * Validates a Routing Number to ensure it is the correct length and does not have any letters.
		 *
		 * @param {string} routingNumber - Routing number provided on the Exchange Record
		 * @returns {boolean}
		 */
		function validateRoutingNumber(routingNumber) {

			var validFormat = /^[0-9]{9}$/;

			return validFormat.test(routingNumber);
		}

		/**
		 * Searches for a Fed ACH or Fed Wire Routing Code record based on a Routing Number.
		 *
		 * @param {Object} data
		 * @param {string} data.routingNumber - Routing number provided on the Exchange Record
		 * @param {string} data.type - Type of Routing Code record to search for - either ACH or Wire
		 * @returns {Object} returnObject - Object containing data from the search results, if there was any
		 */
		function findMatchingFedCode(data) {

			var achFields = {
				achRoutingCode: 'custrecord162',
				achRecordTypeCode: 'custrecord165',
				achBankName: 'custrecord168'
			};

			var wireFields = {
				wireRoutingNumber: 'custrecord153',
				wireTransferStatus: 'custrecord158',
				wireBankName: 'custrecord155'
			};

			var returnObject = {};
			returnObject.hasMatchingRoutingCode = false;

			var searchRecordType = data.type === 'ACH' ? 'customrecord416' : 'customrecord415';

			var columns = [];
			var filters = [];

			if (data.type === 'ACH') {

				for (var key in achFields) {

					columns.push(search.createColumn({
						name: achFields[key]
					}));
				}

				filters.push(search.createFilter({
					name: achFields.achRoutingCode,
					operator: search.Operator.IS,
					values: data.routingNumber
				}));


			} else {

				for (var key in wireFields) {

					columns.push(search.createColumn({
						name: wireFields[key]
					}));
				}

				filters.push(search.createFilter({
					name: wireFields.wireRoutingNumber,
					operator: search.Operator.IS,
					values: data.routingNumber
				}));
			}

			var fedRecordSearch = search.create({
				type: searchRecordType,
				columns: columns,
				filters: filters
			});

			var hasResults = fedRecordSearch.runPaged().count > 0;

			if (hasResults) {

				fedRecordSearch.run().each(function (result) {

					returnObject.hasMatchingRoutingCode = true;

					if (data.type === 'ACH') {

						for (var key in achFields) {

							returnObject[key] = result.getValue({
								name: achFields[key]
							});
						}
					} else {

						for (var key in wireFields) {

							returnObject[key] = result.getValue({
								name: wireFields[key]
							});
						}
					}
				});
			}

			return returnObject;
		}


		//======================================================================================================================
		//======================================================================================================================
		function getSuspenseReasonNote(addingRemoving, value) {
			console.log("getSuspenseReasonNote   value: " + value);

			var suspenseReasonText;
			for (var i = 0; i < suspenseReasonsList.length; i++) {
				if (suspenseReasonsList[i].value == value) {
					suspenseReasonText = suspenseReasonsList[i].text;
				}
			}

			var userReason = prompt('Please enter an explanation for {0} suspense reason "'.replace("{0}", addingRemoving) + suspenseReasonText + '"');

			if (userReason == null) {
				return false;
			}
			if (userReason == undefined) {
				return false;
			}
			userReason = userReason.trim();
			if (userReason == "") {
				return false;
			}

			var objNote = {};
			objNote["action"] = addingRemoving;
			objNote["value"] = value;
			objNote["text"] = suspenseReasonText;
			objNote["userReason"] = userReason;

			return objNote;
		}


		//======================================================================================================================
		//======================================================================================================================
		function saveCancelled(addedRemoved, value) {
			alert("You did not enter a reason for your suspense reason change, the record will not be saved.");
			return false;
		}


		//======================================================================================================================
		//======================================================================================================================
		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			postSourcing: postSourcing,
			saveRecord: saveRecord
		};

	});