/**
 * Module Description
 *
 * This Script is pretty cool, mostly because I am pretty cool.  This script relates to JIRA tickets PPE-92
 * and PPE-95.  The general purpose of this script is to control the drop down selection list of both the 
 * Deal and Exchange Record fields based on the shareholder and type of Payment that has been selected.
 * This script filters using scripted searches and inputs from the Payment Instr Submission record.
 * 
 * 
 * 
 * 
 * Version    Date            Author           Remarks
 * 1.00       12/05/2017      Scott Streule    Client Script for Payment Instructions Submission Record
 *			  2/22/2018		  Alana Thomas	   Per PPE-175, combining the two client scripts for the Submission record
 *			  3/12/2018       Ken Crossman     PPE-229 Payment Method determines Payment Class and Region
 *  		  4/24/2018       Ken Crossman     ATP-133 Payment Method determines Country
 *  		  4/25/2018       Ken Crossman     ATP-44 Warn user when opting to cancel submission
 *			  05/02/2018      Ken Crossman     ATP-142 Reviewer should not be able to edit Exchange Record and Deal fields
 * 			  5/10/2018       Ken Crossman 	   ATP-155 Protect most fields in Approved status
 * 			  5/10/2019		  Robert Bender	   ATP-857 (ATP-933) Disabling "inactivate PI" checkbox when coming from the inactivate PI button
 *			  7/31/2019		  Robert Bender	   ATP-1040 Disables temporary fields (custpage_) when "inactivatePI" checkbox is checked
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/https', 'N/ui/dialog', 'N/log', 'N/runtime'
	   ,'/SuiteScripts/Pristine/libraries/paymtInstrLight.js'
	   ,'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
	   ,'/SuiteScripts/Pristine/libraries/searchLibrary.js'
	   ],

	function(search, currentRecord, https, dialog, log, runtime
			,paymtInstrLight
			,paymtInstrListLibrary
			,searchLibrary
			) {

		var payMeth = paymtInstrListLibrary.piEnum.payMeth;
		var piType = paymtInstrListLibrary.piEnum.piType;
		var subSts = paymtInstrListLibrary.piEnum.subSts;
		var medSts = paymtInstrListLibrary.piEnum.medSts;
		var countries = paymtInstrListLibrary.countries;

		//DECLARE SOME VARIABLES HERE
		var paymtInstrType = null;
		var shareholder = null;
		var exRecIds = [];
		var dealIds = [];
		var dealNames = [];
		var payInstSubmitRec = null;
		var medallionStatus = null;

		//CALLED WHEN PAGE IS INITIALIZED
		function pageInit(context) {

			//THIS CAN BE EDIT, VIEW, CREATE.  MIGHT WANT TO USE THIS LATER
			var mode = context.mode;
			paymtInstrType = getFieldValue(context, 'custrecord_pisb_paymt_instr_type');
			medallionStatus = getFieldValue(context, 'custrecord_pisb_med_status');

			var tempDealList = context.currentRecord.getField({
				fieldId: 'custpage_dealselectfield'
			});
			var dealDropDown = context.currentRecord.getField({
				fieldId: 'custrecord_pisb_deal'
			});

			var tempExRecList = context.currentRecord.getField({
				fieldId: 'custpage_exrecfield'
			});
			var exrecDropDown = context.currentRecord.getField({
				fieldId: 'custrecord_pisb_exchange'
			});

			var shareholder = getFieldValue(context, 'custrecord_pisb_shareholder');
			var currentStatus = parseInt(context.currentRecord.getValue('custrecord_pisb_submission_status'), 10) || null;
			
			//AND HIDE DEAL
			if (mode === 'edit' || mode === 'create') {
				// ATP-142 hide the temp Deal and Exchange fields when not in Dual Entry status
				if (currentStatus === subSts.DualEntry) {
					dealDropDown.isVisible = false;
					exrecDropDown.isVisible = false;
					controlVisabilityOfFields(context, paymtInstrType, tempDealList, tempExRecList, shareholder);
				} else {
					tempDealList.isVisible = false;
					tempExRecList.isVisible = false;
				}
			} else {
				dealDropDown.isVisible = true;
				exrecDropDown.isVisible = true;
				tempDealList.isVisible = false;
				tempExRecList.isVisible = false;
			}
			var paymentMethodID = context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_paymethod'
			});
			setFieldLabelsRed(context, ['custrecord_pisb_paymethod']); //ATP-133
			if (paymentMethodID) {
				highlightMandatoryPayMethodFields(context, paymentMethodID);
            }
            
			//<ATP-933>
			if (mode === 'edit' || mode === 'create') {
				var custrecord_pisb_inactivate_pi = context.currentRecord.getValue({
					fieldId: 'custrecord_pisb_inactivate_pi'
				});
				if (custrecord_pisb_inactivate_pi == true){
                    var custrecord_pisb_inactivate_piFIELD = context.currentRecord.getField({
					    fieldId: 'custrecord_pisb_inactivate_pi'
				    });
					custrecord_pisb_inactivate_piFIELD.isDisabled = true;
				}
				log.debug('ATP-933', 'custrecord_pisb_inactivate_pi='+custrecord_pisb_inactivate_pi)
			}
			//</ATP-933>
			
		}
		
		//===========================================================================================================================
		//===========================================================================================================================
		function hideFields(context ,fieldNamesArray) {
		    for (var ix in fieldNamesArray) {
				var fieldToHide = context.currentRecord.getField({ fieldId: fieldNamesArray[ix] });
				if (fieldToHide) {
					fieldToHide.isVisible = false;
				}
		    }

		}

		//===========================================================================================================================
		//===========================================================================================================================
		function alertAlex(msg) {
            var userAlexFodor = 1047697;
			if (runtime.accountId.toLowerCase() == "772390_sb3") { if (runtime.getCurrentUser().id == userAlexFodor) { alert(msg); } }
		}

		//===========================================================================================================================
		//===========================================================================================================================
		function clearFields(context ,fieldNamesArray) {

		    for (var ix in fieldNamesArray) {
		    	context.currentRecord.setValue({ fieldId:fieldNamesArray[ix] ,value:null ,ignoreFieldChange:true });
		    }

		}
		
		
		//===========================================================================================================================
		//===========================================================================================================================
		function addMessage(messageToAdd ,msgLookup ,messageFieldValue) {

			var inMessage = messageFieldValue.indexOf(msgLookup);
			if (inMessage < 0) {
				messageFieldValue = messageFieldValue + messageToAdd.trim();
			}
			return messageFieldValue;

		}
		
		
		
		//===========================================================================================================================
		// This function is used when validation retirns "pass"
		// It will go through all messages that validation may return and see if any of them are in the current message field
		// If it finds one it will remove it from the message field
		//===========================================================================================================================
		function removeMessage(validationFunctionErrorMessages ,messageField) {

			var messageArray  = messageField.split(";");

			for (var ix in validationFunctionErrorMessages) {
				objMessage = validationFunctionErrorMessages[ix];

				for (var ix2 in messageArray) {
					var msgFound = messageArray[ix2].indexOf(objMessage.msgLookup);
					if (msgFound > -1) {
						messageArray[ix2] = "";
					}
				}

			}

			outputMessage = "";

			for (var ix3 in messageArray) {
				if (messageArray[ix3].length > 1) {
					outputMessage += messageArray[ix3].trim() + "; ";
				}
			}

			return outputMessage;
		}
		
		
		
		//===========================================================================================================================
		//CALLED WHEN SPECIFIC FIELDS ARE CHANGED BY USER
		//===========================================================================================================================
		function fieldChanged(context) {
			var tempDealList = context.currentRecord.getField({
				fieldId: 'custpage_dealselectfield'
			});
			var tempExRecList = context.currentRecord.getField({
				fieldId: 'custpage_exrecfield'
			});
			var paymtInstrType = context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_paymt_instr_type'
			});
			var paymentMethod = context.currentRecord.getValue({ fieldId: 'custrecord_pisb_paymethod' });
			var shareholder = getFieldValue(context, 'custrecord_pisb_shareholder');
			var currentStatus = parseInt(context.currentRecord.getValue('custrecord_pisb_submission_status'), 10) || null;

			if (((context.fieldId == 'custrecord_pisb_paymt_instr_type') || (context.fieldId == 'custrecord_pisb_shareholder')) && (shareholder !== '')) {
				controlVisabilityOfFields(context, paymtInstrType, tempDealList, tempExRecList, shareholder);
			}
			if (((context.fieldId == 'custrecord_pisb_paymt_instr_type') || (context.fieldId == 'custrecord_pisb_shareholder')) && (shareholder === '')) {
				//TRYING TO CONTROL WHICH EXREC AND DEAL FIELDS BEING DISABLED OR ENABLED BASED ON THE PAYMENT INSTR TYPE		
				tempDealList.isDisabled = true;
				resetList(tempDealList, 0, 'Please Select a Shareholder');
				tempExRecList.isDisabled = true;
				resetList(tempExRecList, 0, 'Please Select a Shareholder');
			}


			// PPE-225 Populate Bank Name/Intmed Bank Name (TODO: replace with PPE-203)
			if (context.fieldId == 'custrecord_pisb_ep_bankname_in' || context.fieldId == 'custrecord_pisb_ep_imb_bankname_in') {
				var bankNameEntry = context.currentRecord.getValue({
					fieldId: context.fieldId
				});
				context.currentRecord.setValue({
					fieldId: context.fieldId.substring(0, context.fieldId.length - 3),
					value: bankNameEntry,
					ignoreFieldChange: true
				});
			}

			// PPE-142 ABA Routing Number Entry & Intmed ABA Number Entry Validation
			// PPE-196 SWIFT/BIC Number Entry & Intmed SWIFT/BIC Number Entry Validation
			// PPE-195 IBAN Number Entry Validation
			// valid codes for testing:
			// ABA: 122105155
			// SWIFT/BIC: FIRNZAJJ896
			// IBAN: DE89370400440532013000
			var validationFunction = null,
				entryField = context.fieldId;
            var isABA = false;   // ATP-165
			switch (entryField) {
				case 'custrecord_pisb_ep_abarouting_in': // ABA Routing Number Entry
				case 'custrecord_pisb_ep_imb_abarouting_in': // Intmed ABA Number Entry
					validationFunction = paymtInstrLight.validateABARouting;
                    isABA = true;   // ATP-165
					break;
				case 'custrecord_pisb_ep_swiftbic_in': // SWIFT/BIC Number Entry
				case 'custrecord_pisb_ep_imb_swiftbic_in': // Intmed SWIFT/BIC Number Entry
					validationFunction = paymtInstrLight.validateSwiftBIC;
					break;
				case 'custrecord_pisb_ep_iban_in': // IBAN Number Entry
					validationFunction = paymtInstrLight.validateIBAN;
					break;
			}

			var resultsJSON = null;
			if (validationFunction) {
				var messageField = 'custrecord_pisb_ep_validation_msg';
				if (context.fieldId.includes('_ep_imb_')) {
					messageField = 'custrecord_pisb_ep_imb_validation_msg';
				}
				var numberEntry = context.currentRecord.getValue({ fieldId:context.fieldId });

				var messageValue = context.currentRecord.getValue({ fieldId:messageField });
				var displayValue = '';
				if (numberEntry != '') { // only do validation if field change was entering a value
                    if (isABA) {
                       // ATP-165 Invoke ABA validation without data entry "forgiveness" of the entry value
                       resultsJSON = validationFunction(numberEntry ,context.fieldId ,paymentMethod);
                    } else {
					   resultsJSON = validationFunction(numberEntry);                        
                    }

					messageValue = removeMessage(validationFunction.ErrorMessages ,messageValue);
                    
					switch (resultsJSON.result) {
						case 'pass':
							displayValue = resultsJSON.validatedValue;
							break;
						case 'fail':
						case 'warn':
							// messageValue = resultsJSON.validationIssue;
							messageValue = addMessage(resultsJSON.validationIssue ,resultsJSON.msgLookup ,messageValue)
							break;
						case 'unable':
							//messageValue = resultsJSON.testExceptionMessage;
							messageValue = addMessage(resultsJSON.testExceptionMessage ,resultsJSON.msgLookup ,messageValue)
							log.error('PROBLEM VALIDATING EPAY FIELD', resultsJSON.testExceptionMessage);
							break;
					}
				}
				
				var clearFieldsList = [];
				var destinationField = context.fieldId.substring(0, context.fieldId.length - 3);
				
				if ( isABA ) {
					var currRcd = context.currentRecord;
	
					if ( context.fieldId == "custrecord_pisb_ep_abarouting_in") {
						var paymentMethod_ACH = 1;
						var jsonValue = JSON.stringify(resultsJSON);

						if (resultsJSON && resultsJSON.objLookup && resultsJSON.objLookup.bankName) { // This indicates an entry was found for the routing number
							if (paymentMethod == paymentMethod_ACH) { 
								currRcd.setValue({ fieldId:"custrecord_pisb_ep_abarouting_ach" ,value:resultsJSON.objLookup.internalId        ,ignoreFieldChange:true });
								currRcd.setValue({ fieldId:"custrecord_pisb_ep_ababank_ach"    ,value:resultsJSON.objLookup.bankName          ,ignoreFieldChange:true });
								currRcd.setValue({ fieldId:"custrecord_pisb_ep_abastatus_ach"  ,value:resultsJSON.objLookup.abaStatusCodeText ,ignoreFieldChange:true });
								clearFieldsList      = ["custrecord_pisb_ep_abarouting_wire"
							    	                   ,"custrecord_pisb_ep_ababank_wire"
							    	                   ,"custrecord_pisb_ep_abastatus_wire"
							                           ];
							} 
							else { 
								currRcd.setValue({ fieldId:"custrecord_pisb_ep_abarouting_wire" ,value:resultsJSON.objLookup.internalId        ,ignoreFieldChange:true });
								currRcd.setValue({ fieldId:"custrecord_pisb_ep_ababank_wire"    ,value:resultsJSON.objLookup.bankName          ,ignoreFieldChange:true });
								currRcd.setValue({ fieldId:"custrecord_pisb_ep_abastatus_wire"  ,value:resultsJSON.objLookup.abaStatusCodeText ,ignoreFieldChange:true });
								clearFieldsList      = ["custrecord_pisb_ep_abarouting_ach"
				    	                               ,"custrecord_pisb_ep_ababank_ach"
				    	                               ,"custrecord_pisb_ep_abastatus_ach"
								                       ];
							}
							
						}
						else {
						    clearFieldsList = ["custrecord_pisb_ep_abarouting_wire"
			    	                          ,"custrecord_pisb_ep_ababank_wire"
			    	                          ,"custrecord_pisb_ep_abastatus_wire"
			    	                          ,"custrecord_pisb_ep_abarouting_ach"
		    	                              ,"custrecord_pisb_ep_ababank_ach"
		    	                              ,"custrecord_pisb_ep_abastatus_ach"
			                                  ];
						}
						 
						clearFields(context ,clearFieldsList);

					} // if ( context.fieldId == "custrecord_pisb_ep_abarouting_in")
					else 
					if ( context.fieldId == "custrecord_pisb_ep_imb_abarouting_in") {
						if (resultsJSON && resultsJSON.objLookup && resultsJSON.objLookup.bankName) { // This indicates an entry was found for the routing number
							currRcd.setValue({ fieldId:"custrecord_pisb_ep_imb_abaroutg_wire"   ,value:resultsJSON.objLookup.internalId        ,ignoreFieldChange:true });
							currRcd.setValue({ fieldId:"custrecord_pisb_ep_imb_ababank_wire"    ,value:resultsJSON.objLookup.bankName          ,ignoreFieldChange:true });
							currRcd.setValue({ fieldId:"custrecord_pisb_ep_imb_abastatus_wire"  ,value:resultsJSON.objLookup.abaStatusCodeText ,ignoreFieldChange:true });
						} 
						else {
						    clearFieldsList = ["custrecord_pisb_ep_imb_abaroutg_wire"
			    	                          ,"custrecord_pisb_ep_imb_ababank_wire"
			    	                          ,"custrecord_pisb_ep_imb_abastatus_wire"
			                                  ];
						}
						 
						clearFields(context ,clearFieldsList);

					}
				}
				else {
					context.currentRecord.setValue({ fieldId:destinationField ,value:displayValue ,ignoreFieldChange:true });
				}
				
				context.currentRecord.setValue({ // TODO: Does anything else use this validation field?
					fieldId: messageField,
					value: messageValue, //currentError + '; ' + messageValue,
					ignoreFieldChange: true
				});
				if (messageValue > "") { setFieldLabelsRed(context, [messageField]); }

				var entryDisplayValue = '';
				if (resultsJSON != undefined) {
					entryDisplayValue = resultsJSON.displayValue;
					if (resultsJSON.displayValue == '') {
						entryDisplayValue = resultsJSON.inputValue;
					}
				}
				context.currentRecord.setValue({
					fieldId: entryField,
					value: entryDisplayValue,
					ignoreFieldChange: true
				});
			}

			// PPE-229 Populate Payment Class and Payment Region based on Payment Method selected
			// ATP-133 Populate Country based on Payment Method selected
			if (context.fieldId == 'custrecord_pisb_paymethod') {
				var paymentMethodID = context.currentRecord.getValue({
					fieldId: context.fieldId
				});
				var allPaymentFields = paymtInstrLight.getAllPaymentFields();

				// First clear and disable all Payment fields
				disableAndClearFieldsByObject(context, allPaymentFields);
				// Then remove the red label from mandatory fields
				unhighlightPaymentFields(context, allPaymentFields);

				if (paymentMethodID) {
					// Get the Class, Region and Country based on Payment Method
					var pmDetails = paymtInstrLight.getPaymentMethodDetails(paymentMethodID);

					// Set Class and Region
					var payClass = pmDetails.payClass;
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_payclass',
						value: payClass
					});

					var payRegion = pmDetails.payRegion;
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_payment_region',
						value: payRegion
					});

					// Set Country based on payment method
					switch (parseInt(paymentMethodID)) {
						case payMeth.DomesticCheck:
							context.currentRecord.setValue({
								fieldId: 'custrecord_pisb_chk_country',
								value: pmDetails.payCountry
							});
							break;
						case payMeth.ACH:
						case payMeth.DomesticWire:
							context.currentRecord.setValue({
								fieldId: 'custrecord_pisb_ep_bankcountryname',
								value: pmDetails.payCountry
							});
							break;
						default:
							context.currentRecord.setValue({
								fieldId: 'custrecord_pisb_chk_country',
								value: ''
							});
							context.currentRecord.setValue({
								fieldId: 'custrecord_pisb_ep_bankcountryname',
								value: ''
							});
					}
					// Get all fields which should be enabled by Payment Method
					var modifiablePaymentMethodFields = paymtInstrLight.getModifiablePaymentFieldsByMethod(paymentMethodID);
					enableFields(context, modifiablePaymentMethodFields);
					highlightMandatoryPayMethodFields(context, paymentMethodID);
				} else {
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_payclass',
						value: ''
					});
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_payment_region',
						value: ''
					});
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_chk_country',
						value: ''
					});
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_ep_bankcountryname',
						value: ''
					});
				}
			}

			//If user selects Canada or Mexico 
			if (context.fieldId == 'custrecord_pisb_chk_country') {
				var chkCountry = parseInt(context.currentRecord.getValue({
					fieldId: context.fieldId
				}), 10) || null;

				if (chkCountry === countries.mexico || chkCountry === countries.canada) {
					setFieldLabelsRed(context, ['custrecord_pisb_chk_state']);
				} else {
					unhighlightFieldLabels(context, ['custrecord_pisb_chk_state']);
				}
			}

			// PPE-281: Populate Pointer to existing Payment Instr as soon as fields in "Payment Instruction Submission Type" field band are set
			if (context.fieldId == 'custrecord_pisb_paymt_instr_type' || context.fieldId == 'custrecord_pisb_shareholder' ||
				context.fieldId == 'custpage_dealselectfield' || context.fieldId == 'custpage_exrecfield') {

				var piDeal = context.currentRecord.getValue({
					fieldId: 'custpage_dealselectfield'
				});
				var piExchange = context.currentRecord.getValue({
					fieldId: 'custpage_exrecfield'
				});
				if (shareholder != '' && paymtInstrType != '') {
					var searchPayInstrResult = paymtInstrLight.searchIdenticalPaymentInstructions({
						shareholder: shareholder,
						paymtInstrType: paymtInstrType,
						deal: piDeal,
						exchangeRecord: piExchange
					});

					var fieldsToUpdate = {};
					if (searchPayInstrResult.length == 0) { // this submission is to create a new PI
						fieldsToUpdate['custrecord_pisb_updating_paymt_instr'] = '';
						fieldsToUpdate['custrecord_pisb_changing_existing'] = false;
					} else if (searchPayInstrResult.length == 1) { // this is an update to an existing PI
						var payInstrInternalId = searchPayInstrResult[0].getValue({
							name: 'internalid'
						});
						fieldsToUpdate['custrecord_pisb_updating_paymt_instr'] = payInstrInternalId;
						fieldsToUpdate['custrecord_pisb_changing_existing'] = true;
					} else if (searchPayInstrResult.length > 1) { // there are multiple PI that fit this criteria (unlikely)
						// if >1, then add error message to existing fields. "More than one PI matching this submission type. Please cancel this submission and ..."
						// list IDs of dupes in detail
						var multiplePI = '';
						for (i = 0; i < searchPayInstrResult.length; i++) {
							multiplePI += searchPayInstrResult[i].getValue({
								name: 'internalid'
							}) + ', ';
						}
						multiplePIFinal = multiplePI.substring(0, multiplePI.length - 2);
						dialog.alert({
							title: '<font color="crimson">PROBLEM SAVING THIS SUBMISSION</font>',
							message: '<font color="red">ERROR</font></br>' +
								'More than one Payment Instruction matching this submission type: [' + multiplePIFinal +
								'].<br/><br/>Please verify your criteria or cancel this submission and ensure that only one Payment Instructions exists for this shareholder and this Paymt Instr Type.'
						});
						fieldsToUpdate['custrecord_pisb_updating_paymt_instr'] = '';
						fieldsToUpdate['custrecord_pisb_changing_existing'] = false;
						if (paymtInstrType == piType.Default) {
							fieldsToUpdate['custrecord_pisb_paymt_instr_type'] = '';
						} else if (piExchange) {
							fieldsToUpdate['custpage_exrecfield'] = 0;
						} else if (piDeal) {
							fieldsToUpdate['custrecord_pisb_deal'] = 0;
						}
					}

					// Are there any other open (e.g. not Canceled or Promoted) Paymt Instr Submissions that point to these same
					// criteria? Alert the user and prevent them from creating another one (ATP-27)
					var searchPayInstrSubResult = paymtInstrLight.searchIdenticalPaymtInstrSubmissions({
						shareholder: shareholder,
						paymtInstrType: paymtInstrType,
						deal: piDeal,
						exchangeRecord: piExchange
					});

					var identicalSubmissions = [];
					for (var i = 0; i < searchPayInstrSubResult.length; i++) {
						var subId = searchPayInstrSubResult[i].getValue({
							name: 'internalid'
						});
						if (subId != context.currentRecord.id) {
							identicalSubmissions.push(subId);
						}
					}
					if (identicalSubmissions.length > 0) {
						var paymtInstrTypeText = getFieldText(context, 'custrecord_pisb_paymt_instr_type');
						var shareholderText = getFieldText(context, 'custrecord_pisb_shareholder');

						var myMessage = '<font color="red">ERROR</font></br>' +
							'More than one open PI Submission currently matches this submission type: [' + identicalSubmissions +
							'].<br/><br/>Please ensure that only one open PI Submission exists for this PI Submission Type criteria:</br>' +
							'</br><b>Paymt Instr Type:</b> ' + paymtInstrTypeText + '</br><b>Shareholder:</b> ' + shareholderText;
						if (piDeal != 0) {
							myMessage += '</br><b>Deal:</b> ' + getFieldText(context, 'custpage_dealselectfield');
						} else if (piExchange != 0) {
							myMessage += '</br><b>Exchange Record:</b> ' + getFieldText(context, 'custpage_exrecfield');
						}

						dialog.alert({
							title: '<font color="crimson">PROBLEM SAVING THIS SUBMISSION</font>',
							message: myMessage
						});

						fieldsToUpdate['custrecord_pisb_updating_paymt_instr'] = '';
						fieldsToUpdate['custrecord_pisb_changing_existing'] = false;
						if (paymtInstrType == piType.Default) {
							fieldsToUpdate['custrecord_pisb_paymt_instr_type'] = '';
						} else if (piExchange != 0) {
							if (tempExRecList.getSelectOptions().length > 1) {
								fieldsToUpdate['custpage_exrecfield'] = 0;
							} else {
								fieldsToUpdate['custrecord_pisb_paymt_instr_type'] = '';
								resetList(tempExRecList, 0, 'N/A');
								tempExRecList.isDisabled = true;
							}
						} else if (piDeal != 0) {
							if (tempDealList.getSelectOptions().length > 1) {
								fieldsToUpdate['custpage_dealselectfield'] = 0;
							} else {
								fieldsToUpdate['custrecord_pisb_paymt_instr_type'] = '';
								resetList(tempDealList, 0, 'N/A');
								tempDealList.isDisabled = true;
							}
						}
					}

					for (prop in fieldsToUpdate) {
						context.currentRecord.setValue({
							fieldId: prop,
							value: fieldsToUpdate[prop],
							ignoreFieldChange: true
						});
					}
				}
			}

			// ATP-24: Limit who can change Medallion Status to specific statuses
			if (context.fieldId == 'custrecord_pisb_med_status') {
				var currentStatus = context.currentRecord.getValue('custrecord_pisb_submission_status');
				var medStatusValue = context.currentRecord.getValue('custrecord_pisb_med_status');

				if (runtime.getCurrentUser().role != 1025 &&
					// (medStatusValue == medSts.Accepted || medStatusValue == medSts.Waived) && //ATP-155
					(medStatusValue == medSts.Accepted || medStatusValue == medSts.Waived)) { //ATP-155
					// (currentStatus == subSts.DualEntry || currentStatus == subSts.Review)) {   //ATP-155 
					dialog.alert({
						title: 'Invalid Medallion Status',
						message: 'Only users using the role SRS Operations Manager may Accept or Waive Medallions.'
					});
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_med_status',
						value: medallionStatus,
						ignoreFieldChange: true
					});
					return true;
				}

				if (currentStatus == subSts.Review && medStatusValue == medSts.NotRequired) {
					dialog.alert({
						title: 'Invalid Medallion Status',
						message: 'You cannot change Medallion status to Not Required while Submission is in ' +
							'Review status. Use the Reject button to return the Submission to Dual Entry status ' +
							'to make this change.'
					});
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_med_status',
						value: medallionStatus,
						ignoreFieldChange: true
					});
					return true;
				}
			}

		}

		//CALLED WHEN RECORD IS SAVED
		function saveRecord(context) {
			// ATP-142 - The Exchange and Deal fields are only set in Dual Entry status
			var currentStatus = parseInt(context.currentRecord.getValue('custrecord_pisb_submission_status'), 10) || null;
			if (currentStatus === subSts.DualEntry) {
				//SET THE ACTUAL DEAL FIELD TO HAVE THE VALUE SELECTED IN THE TEMP FIELD
				//SET THE ACTUAL EXCHANGE RECORD FIELD TO HAVE THE VALUE SELECTED IN THE TEMP FIELD
				var tempDealListValue = getFieldValue(context, 'custpage_dealselectfield');
				var tempExRecListValue = getFieldValue(context, 'custpage_exrecfield');

				//SET THE EXREC FIELD WITH THE VALUE IN THE TEMP EXREC DROPDOWN
				if ((tempExRecListValue != 0) && (tempExRecListValue !== null)) {
					// log.debug({
					// 	title: 'In the tempExRecListValue IF'
					// });
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_exchange',
						value: tempExRecListValue,
						ignoreFieldChange: true
					});
				} else {
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_exchange',
						value: '',
						ignoreFieldChange: true
					});
				}
				//SET THE DEAL FIELD WITH THE VALUE IN THE TEMP DEAL DROPDOWN
				if ((tempDealListValue != 0) && (tempDealListValue !== null)) {
					// log.debug({
					// 	title: 'In the tempDealListValue IF'
					// });
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_deal',
						value: tempDealListValue,
						ignoreFieldChange: true
					});
				} else {
					context.currentRecord.setValue({
						fieldId: 'custrecord_pisb_deal',
						value: '',
						ignoreFieldChange: true
					});
				}
			}
			return true;
		}

		function disableAndClearFields(context, fieldArray) {
			for (var i = 0; i < fieldArray.length; i++) {
				var tempField = context.currentRecord.getField({
					fieldId: fieldArray[i]
				});
				if (tempField) {
					tempField.isDisabled = true;
					context.currentRecord.setValue({
						fieldId: fieldArray[i],
						value: '',
						ignoreFieldChange: true
					});
				}
			}
		}

		function enableFieldsByObject(context, fieldTypeMap) {
			for (var prop in fieldTypeMap) {
				for (var i = 0; i < fieldTypeMap[prop].length; i++) {
					var tempField = context.currentRecord.getField({
						fieldId: fieldTypeMap[prop][i]
					});
					if (tempField) {
						tempField.isDisabled = false;
					}
				}
			}
		}

		function enableFields(context, fieldArray) {
			for (var i = 0; i < fieldArray.length; i++) {
				var tempField = context.currentRecord.getField({
					fieldId: fieldArray[i]
				});
				if (tempField) {
					tempField.isDisabled = false;
				}
			}
		}

		function disableAndClearFieldsByObject(context, fieldTypeMap) {
			for (var prop in fieldTypeMap) {
				disableAndClearFields(context, fieldTypeMap[prop]);
			}
		}
		//CONTROL WHICH FIELDS ARE ABLE TO BE EDITED AND WHICH FIELDS ARE LOCKED TO THE USER BASED ON THE TYPE AND SHAREHOLDER
		function controlVisabilityOfFields(context, paymtInstrType, tempDealList, tempExRecList, shareholder) {
			//TRYING TO CONTROL WHICH EXREC AND DEAL FIELDS BEING DISABLED OR ENABLED BASED ON THE PAYMENT INSTR TYPE
			//Had to change these ids for PROD deploy - Ken - 3/31/2018 16:02
			if (paymtInstrType == piType.Default) {
				tempDealList.isDisabled = true;
				resetList(tempDealList, 0, 'N/A');
				tempExRecList.isDisabled = true;
				resetList(tempExRecList, 0, 'N/A');
			} else if (paymtInstrType == piType.AcquiomDeal) {
				//RUN ACQUIOM DEAL SEARCH HERE
				dealSearch(context, tempDealList, shareholder, 'customrecord_acq_lot', 'custrecord_acq_loth_zzz_zzz_shareholder', 'custrecord_acq_loth_zzz_zzz_deal');
				tempDealList.isDisabled = false;
				tempExRecList.isDisabled = true;
				resetList(tempExRecList, 0, 'N/A');
			} else if (paymtInstrType == piType.ExchangeRecord) {
				//RUN EXREC SEARCH HERE
				exRecSearch(context, tempExRecList, shareholder);
				tempDealList.isDisabled = true;
				resetList(tempDealList, 0, 'N/A');
				tempExRecList.isDisabled = false;
			} else if (paymtInstrType == piType.SRSDeal) {
				//RUN SRS DEAL SEARCH HERE
				dealSearch(context, tempDealList, shareholder, 'customrecord2', 'custrecord_participating_shareholder', 'custrecord_participating_escrow');
				tempDealList.isDisabled = false;
				tempExRecList.isDisabled = true;
				resetList(tempExRecList, 0, 'N/A');
			} else {
				tempDealList.isDisabled = true;
				resetList(tempDealList, 0, 'N/A');
				tempExRecList.isDisabled = true;
				resetList(tempExRecList, 0, 'N/A');
			}
			// <ATP-1040>
			var PIdisableCheckbox = getFieldValue(context, 'custrecord_pisb_inactivate_pi');
			if ( Boolean(PIdisableCheckbox) ){
				tempDealList.isDisabled = true;
				tempExRecList.isDisabled = true;
			}
			//</ATP-1040>
		}

		//RESET THE DROPDOWN LIST TO HAVE NO VALUES EXCEPT 1 DEFAULT
		function resetList(list, value, text) {
			list.removeSelectOption({
				value: null,
			});
			list.insertSelectOption({
				value: value,
				text: text
			});
		}

		//SEARCH FOR EXRECS BASED ON THE SHAREHOLDER SELECTED
		function exRecSearch(context, tempExRecList, shareholder) {
			//alert("Alex1");
			//GET THE VALUE OF THE EXISTING SELECTIONG IN THE EXREC FIELD TO SET THIS AS THE SELECTED OPTION WHEN THE TEMP EXREC DROPDOWN LIST IS CREATED
			var exrecDropDownValue = getFieldValue(context, 'custrecord_pisb_exchange');

			//IF YOU ARE GONNA SEARCH FOR EXRECS, THEN REMOVE ALL THE OPTIONS FROM THE LIST FIRST
			tempExRecList.removeSelectOption({ value: null });

			var searchFilters = [];
			searchFilters.push({ name:'custrecord_acq_loth_zzz_zzz_shareholder' ,operator:search.Operator.IS ,values:shareholder	});
			searchFilters.push({ name:'isinactive'                              ,operator:search.Operator.IS ,values: 'F'			});
			
			var searchExRecs = search.create({ type: 'customrecord_acq_lot'
				                           ,columns:[{name:'internalid'} 
				                                    ,{name:'custrecord_acq_loth_related_trans'}
                                                    ,{name:'custrecord_acq_loth_zzz_zzz_acqstatus'} 
                                                    ,{name:'custrecord_acq_loth_zzz_zzz_shrhldstat'} 
                                                    ]
				                           ,filters: searchFilters
			                                 }).run();

			//RUN THE SEARCH FOR EXRECS
			//var searchExRecsResult = searchExRecs.run().getRange(0, 1000);
			var searchExRecsResult = searchLibrary.getSearchResultData(searchExRecs);

			if (searchExRecsResult.length > 0) {
				if (searchExRecsResult.length > 1) {
					tempExRecList.insertSelectOption({ value:0 ,text:'Please select an Exchange Record' ,isSelected:true });
				}
				for (var i = 0; i < searchExRecsResult.length; i++) {
					var selectedExRec = false;
					var exRecId        = searchExRecsResult[i].getValue({ name:'internalid' });
					var cMemo          = searchExRecsResult[i].getValue({ name:'custrecord_acq_loth_related_trans' });
					var acquiomStatus  = searchExRecsResult[i].getValue({ name:'custrecord_acq_loth_zzz_zzz_acqstatus' });
					var shrhldrStatus  = searchExRecsResult[i].getValue({ name:'custrecord_acq_loth_zzz_zzz_shrhldstat' });
					var addThisExchangeRecord = true;
					if (cMemo) { addThisExchangeRecord = false; }
					if (!paymtInstrListLibrary.objExRecAcqStatusLessThan5[acquiomStatus] ) { addThisExchangeRecord = false; }
					if (!paymtInstrListLibrary.objExRecShrStatusLessThan5[shrhldrStatus] ) { addThisExchangeRecord = false; }
					
					if (addThisExchangeRecord) {
						exRecIds.push(exRecId);
						if (exRecId == exrecDropDownValue) { selectedExRec = true; }
						tempExRecList.insertSelectOption({ value:exRecId ,text:exRecId ,isSelected:selectedExRec });
					}
				}
			} 
			else { tempExRecList.insertSelectOption({ value:0 ,text:'No Exchange Records Found' }); }
		}

		//SEARCH FOR DEALS BASED ON THE SHAREHOLDER SELECTED
		function dealSearch(context, tempDealList, shareholder, recordType, filterName, columnName) {
			//GET THE VALUE OF THE EXISTING SELECTIONG IN THE DEAL FIELD TO SET THIS AS THE SELECTED OPTION WHEN THE TEMP DEAL DROPDOWN LIST IS CREATED
			var dealDropDownValue = getFieldValue(context, 'custrecord_pisb_deal');
			//IF YOU ARE GONNA SEARCH FOR DEALS, THEN REMOVE ALL THE OPTIONS FROM THE LIST FIRST
			tempDealList.removeSelectOption({
				value: null,
			});

			var searchFilters = [];
			//DEFAULT SEARCH FILTER FOR SHAREHOLDER	
			searchFilters.push({
				name: filterName,
				operator: search.Operator.IS,
				values: shareholder
			});
			searchFilters.push({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: 'F'
			});

			var searchDeals = search.create({
				type: recordType,
				columns: [{
					name: columnName,
					summary: search.Summary.GROUP
				}],
				filters: searchFilters
			}).run();

			//RUN THE SEARCH
			//var searchDealsResult = searchDeals.run().getRange(0, 1000);
			var searchDealsResult = searchLibrary.getSearchResultData(searchDeals);

			if (searchDealsResult.length > 0) {
				if (searchDealsResult.length > 1) {
					tempDealList.insertSelectOption({
						value: 0,
						text: 'Please select a Deal',
						isSelected: true
					});
				}
				for (var i = 0; i < searchDealsResult.length; i++) {
					var selectedDeal = false;
					var dealId = searchDealsResult[i].getValue({
						name: columnName,
						summary: search.Summary.GROUP
					});
					var dealName = searchDealsResult[i].getText({
						name: columnName,
						summary: search.Summary.GROUP
					});
					dealIds.push(dealId);
					dealNames.push(dealName);
					if (dealId == dealDropDownValue) {
						selectedDeal = true;
					}
					//TRY AND ADD AN OPTION HERE
					tempDealList.insertSelectOption({
						value: dealId,
						text: dealName,
						isSelected: selectedDeal
					});
				}
			} else {
				tempDealList.insertSelectOption({
					value: 0,
					text: 'No Deals Found'
				});
			}
		}

		//THIS FUNCTION SIMPLY RETRIEVES THE VALUE OF A FIELD
		function getFieldValue(context, fieldId) {
			var value = context.currentRecord.getValue({
				fieldId: fieldId
			});
			return value;
		}

		function getFieldText(context, fieldId) {
			return context.currentRecord.getText({
				fieldId: fieldId
			});
		}

		// PPE-175
		function cancel_pi_submission() {
			// ATP-44 Give user chance to consider...
			var options = {
				title: 'Are you sure you want to cancel this Paymt Instr Submission record?',
				message: "If you're updating an existing Payment Instruction record, the Submission Hold on that Instruction will be cleared."
			};
			dialog.confirm(options).then(function(result) {
					if (result) {
						//If user presses OK then go ahead and cancel
						var record = currentRecord.get();
						myDataObj = ({
							custscript_pi_submission_id: record.id,
							custrecord_pisb_submission_status: subSts.Canceled
						});
						var cancelPISubResult = https.put({
							url: '/app/site/hosting/restlet.nl?script=1250&deploy=1',
							body: myDataObj
						});
						// console.log('cancel_pi_submission','cancelPISubResult: ' + JSON.stringify(cancelPISubResult));
						// if (!cancelPISubResult.success) {
						// 	paymtInstrLight.showErrorMessage('PI Submission cancellation failed', cancelPISubResult.message);
						// 	// Wait for error message to fade before reloading page
						// 	setTimeout(function() {
						// 		location.reload(true);
						// 	}, 7000);
						// } else {
							location.reload(true);
						// }
					}
				})
				.catch(function(reason) {});

		}

		function highlightMandatoryPayMethodFields(context, paymentMethodID) {
			var chkCountry = parseInt(context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_chk_country'
			}), 10) || null;
			var wireFFCName = context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_ep_ffcname'
			}) || null;
			var wireFFCAccountNumber = context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_ep_ffcacctnum'
			}) || null;
			var bankAccountNbr = context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_ep_bankacctnum'
			}) || null;
			var ibanNbr = context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_ep_iban'
			}) || null;
			var swiftbicNbr = context.currentRecord.getValue({
				fieldId: 'custrecord_pisb_ep_swiftbic'
			}) || null;
			var mandatoryFields = paymtInstrLight.getMandatoryPaymentFieldsByMethod(paymentMethodID, chkCountry, wireFFCName, wireFFCAccountNumber, bankAccountNbr, ibanNbr, swiftbicNbr);
			setFieldLabelsRed(context, mandatoryFields);
		}

		function setFieldLabelsRed(context, fields) {
			var formField = null;
			var fieldLabel = null;
			for (var i = 0; i < fields.length; i++) {
				formField = context.currentRecord.getField({
					fieldId: fields[i]
				});
				fieldLabel = formField.label;
				formField.label = '<font color="red">' + fieldLabel + '</font>';
			}
		}

		function unhighlightFieldLabels(context, fields) {
			var formField = null;
			var fieldLabel = null;
			var labelStart = null;
			var labelEnd = null;

			for (var i = 0; i < fields.length; i++) {
				formField = context.currentRecord.getField({
					fieldId: fields[i]
				});
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

		function unhighlightPaymentFields(context, paymentFields) {
			for (var prop in paymentFields) {
				unhighlightFieldLabels(context, paymentFields[prop]);
			}
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			saveRecord: saveRecord,
			cancel_pi_submission: cancel_pi_submission
		};
	});