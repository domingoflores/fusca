/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * voidTrackingUE.js
 * ___________________________________________________________
 * 
 * 
 * Version 1.0  Ken Crossman
 * Add button to begin the Void Payment Process
 * ATP-257 - 7/13/2018 Ken
 *
 * 2019-12 Updated as part of ticket ATP-1350 by Ken C
 * ___________________________________________________________
 */

define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/format', 'N/runtime', '/SuiteScripts/Pristine/libraries/searchLibrary.js',
		'/SuiteScripts/Pristine/libraries/voidTrackingListLibrary.js', '/SuiteScripts/Pristine/libraries/voidTrackingLibrary.js'
		,'/.bundle/132118/PRI_ShowMessageInUI'
		,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	],
	function(serverWidget, record, search, format, runtime, searchLibrary, vtListLib, vtLib
			,priMessage
			,toolsLib
		) {   

		var vtStatus = vtListLib.vtList.vtStatus;
		var vtPayMethod = vtListLib.vtList.vtPayMethod;
		var yesNo = vtListLib.vtList.yesNo;
		var respParty = vtListLib.vtList.respParty;
		var voidTrackingRecType = vtListLib.recordType.VoidTracking;
		var objPermissionList = {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"};
		var scriptName = "voidTrackingUE.js";
		var funcName;
		var transactionConstant = vtListLib.transactionConstant;
		var isFxContractReturnedPayment = false;
		var objExchangeRecordFields;
		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function beforeLoad(context) {
			var thisRecID = context.newRecord.getValue('id');
			funcName = scriptName + "->beforeLoad exec:" + runtime.executionContext + ", type:" + context.type + ", id:" + thisRecID;
			var thisVTStatus = Number(context.newRecord.getValue('custrecord_vt_status'));
			log.debug(funcName, 'thisVTStatus: ' + thisVTStatus);

			var runTimeCTX = runtime.executionContext;
			// Block all imports
			if (runTimeCTX == 'CSVIMPORT') {
				throw 'Void Tracking does not currently support Imports. Please use the Process Returned Payment button on the Exchange Record.';
			}
			
			// Check that user permissions are sufficient
			var hasAccess = toolsLib.checkPermission(objPermissionList);
			if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {	
				if (!hasAccess) {	
					throw 'You do not have permission to complete this request';
				}
			}
			
			objExchangeRecordFields = get_exchangeRecordFields(context); 			
			isFxContractReturnedPayment = evaluateIsFxContractReturnedPayment(context); 

			switch (context.type) {
				case context.UserEventType.VIEW:
					if (hasAccess) {
						var mandatoryMissing = mandatoryFields(context);
						if (!mandatoryMissing) { addButtons(context, thisVTStatus); }
						} 
					else {context.form.removeButton("edit");}
					break;
				case context.UserEventType.EDIT:
					setFieldDisplayTypes(context, thisRecID, thisVTStatus);
					break;
				case context.UserEventType.CREATE:
					//Set Created By field to Current User  
					context.newRecord.setValue({ fieldId:'custrecord_vt_created_by' ,value:runtime.getCurrentUser().id });
					if (isFxContractReturnedPayment) {
						context.newRecord.setValue({ fieldId:'custrecord_vt_bank_ref_nbr' ,value:objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.custbody_payment_ref_number"] });
					}
					break;
			}

			switch (context.type) {
			case context.UserEventType.VIEW:
			case context.UserEventType.EDIT:
			case context.UserEventType.CREATE:
				if (isFxContractReturnedPayment) { setupFormForReturnedFXPayment(context); }
				else                             { setupFormNotReturnedFXPayment(context); }
			}
		
		}
		
		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function mandatoryFields(context){
			var fieldNames = {"custrecord_vt_return_reason":"RETURN REASON"
					         ,"custrecord_vt_bank_return_amount":"BANK RETURN AMOUNT"
						     ,"custrecord_vt_responsible_party":"RESPONSIBLE PARTY"
							 ,"custrecord_vt_bank_return_curr":"BANK RETURN CURRENCY"
							 ,"custrecord_vt_bank_ref_nbr":"BANK REFERENCE NBR"
			                 };
			
			var custRefundID = objExchangeRecordFields["custrecord_acq_loth_related_refund"][0].value;
			var refundAmount = vtLib.getRefundAmount(custRefundID) || 0;
			var payMethod = context.newRecord.getValue('custrecord_vt_paymethod');
			var bankReturnAmount = 0;
			if (payMethod == transactionConstant.paymentMethodWireTfr) { 
				bankReturnAmount = context.newRecord.getValue('custrecord_vt_bank_return_amount');
			} 
			else {
				bankReturnAmount = refundAmount;
			}
			var bankFeeAmount = vtLib.calcBankFeeAmount(bankReturnAmount, refundAmount);
			
			var mandatoryFields = ['custrecord_vt_return_reason'];
			var paymentMethod = context.newRecord.getValue('custrecord_vt_paymethod');
			if (paymentMethod == transactionConstant.paymentMethodWireTfr) { mandatoryFields.push('custrecord_vt_bank_return_amount'); }
			if (bankFeeAmount > 0)                            { mandatoryFields.push('custrecord_vt_responsible_party');  }
			if (isFxContractReturnedPayment)                               { 
				mandatoryFields.push('custrecord_vt_bank_return_curr');   
				mandatoryFields.push('custrecord_vt_bank_ref_nbr');   
			}
			
			var messageText = "";
			for (ix in mandatoryFields) {
				var value = context.newRecord.getValue(mandatoryFields[ix]); 
				if (!value) { messageText += fieldNames[mandatoryFields[ix]] +  "<br/>"; }				
			}
			
			if (messageText) {
				messageText = "The following fields are mandatory <br/><br/>" + messageText;
                priMessage.prepareMessage('Incomplete Data', messageText, priMessage.TYPE.WARNING);
                priMessage.showPreparedMessage(context);
                return true;
			}
			
			return false;
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function get_exchangeRecordFields(context) {
			var rcdId = context.newRecord.getValue('custrecord_vt_exchange_record');
			if (!rcdId) { rcdId = context.oldRecord.getValue('custrecord_vt_exchange_record'); }
			if (!rcdId) { return {}; }
			objExchangeRecordFields = search.lookupFields({type:"customrecord_acq_lot" ,id:rcdId 
	            ,columns: ["internalid" 
	            		  ,"custrecord_exrec_fx_conv_contract"
	            	      ,"CUSTRECORD_ACQ_LOTH_ZZZ_ZZZ_DEAL.custentity_acq_deal_financial_bank_compa"
	            	      ,"CUSTRECORD_EXREC_FX_CONV_CONTRACT.custrecord_fx_conv_bank"
	            	      ,"custrecord_exrec_shrhldr_settle_curr"
	            	      ,"custrecord_acq_loth_related_refund"
	            	      ,"CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"
	            	      ,"custrecord_acq_loth_related_trans"
	            	      ,"CUSTRECORD_ACQ_LOTH_RELATED_TRANS.custbody_payment_ref_number"
	                      ]});
						
			log.debug(funcName, 'objExchangeRecordFields: ' +  JSON.stringify(objExchangeRecordFields) );
			return objExchangeRecordFields;
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function evaluateIsFxContractReturnedPayment(context) {
			if (objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"].length == 0) { return false; }
			if (objExchangeRecordFields["custrecord_exrec_shrhldr_settle_curr"].length == 0)        { return false; }
			if ( objExchangeRecordFields["custrecord_exrec_fx_conv_contract"].length > 0 ) { 
				if ( objExchangeRecordFields["custrecord_exrec_shrhldr_settle_curr"][0].value != objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"][0].value ) {
					return true; 
				}
			}
			return false;
		}
		
		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function addCustpageFields(context) {
			
			var value;
			
			if (objExchangeRecordFields["CUSTRECORD_EXREC_FX_CONV_CONTRACT.custrecord_fx_conv_bank"].length>0) { value = objExchangeRecordFields["CUSTRECORD_EXREC_FX_CONV_CONTRACT.custrecord_fx_conv_bank"][0].text; } else { value = ""; }
			var fldIssuingBank = context.form.addField({ id: 'custpage_issuing_bank' ,type:serverWidget.FieldType.TEXT ,label:'Issuing Bank' });
			fldIssuingBank.defaultValue = value;
			fldIssuingBank.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });
			fldIssuingBank.setHelpText({	help:"Issuing Bank obtained from the FX Currency Conversion Contract." });
			context.form.insertField({ field:fldIssuingBank ,nextfield:'custrecord_vt_refund_amount' });
			
			if (objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_ZZZ_ZZZ_DEAL.custentity_acq_deal_financial_bank_compa"].length>0) { value = objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_ZZZ_ZZZ_DEAL.custentity_acq_deal_financial_bank_compa"][0].text; } else { value = ""; }
			var fldPayingBank = context.form.addField({ id: 'custpage_paying_bank' ,type:serverWidget.FieldType.TEXT ,label:'Paying Bank' });
			fldPayingBank.defaultValue = value;
			fldPayingBank.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });
			fldPayingBank.setHelpText({	help:"Paying Bank obtained from the Deal." });
			context.form.insertField({ field:fldPayingBank ,nextfield:'custrecord_vt_refund_amount' });
			
			if (objExchangeRecordFields["custrecord_exrec_shrhldr_settle_curr"].length>0) { value = objExchangeRecordFields["custrecord_exrec_shrhldr_settle_curr"][0].text; } else { value = ""; }
			var fldSettleCurrency = context.form.addField({ id: 'custpage_settle_currency' ,type:serverWidget.FieldType.TEXT ,label:'Settlement Currency' });
			fldSettleCurrency.defaultValue = value;
			fldSettleCurrency.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });
			fldSettleCurrency.setHelpText({	help:"Settlement Currency obtained from the Exchange record." });
			context.form.insertField({ field:fldSettleCurrency ,nextfield:'custrecord_vt_bank_ref_nbr' });
			
			if (objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"].length>0) { value = objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"][0].text; } else { value = ""; }
			var fldRefundCurrency = context.form.addField({ id: 'custpage_refund_currency' ,type:serverWidget.FieldType.TEXT ,label:'Customer Refund Currency' });
			fldRefundCurrency.defaultValue = value;
			fldRefundCurrency.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });
			fldRefundCurrency.setHelpText({	help:"Customer Refund currency." });
			context.form.insertField({ field:fldRefundCurrency ,nextfield:'custrecord_vt_bank_ref_nbr' });
			
		}
		
		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function setupFormForReturnedFXPayment(context) {
			log.debug(funcName, 'setupFormForReturnedFXPayment ');
			toolsLib.setFieldDisplayType(context, ['custrecord_vt_refund_amount' ,'custrecord_vt_srs_paymt_fee_amount' ,'custrecord_vt_bank_fee_amount'], serverWidget.FieldDisplayType.HIDDEN);
			
			inlineProtectFields(context, ['custrecord_vt_return_der' ,'custrecord_vt_priority_pmt_type'] );
			inlineProtectFields(context, ['custrecord_vt_return_deal'] );
			
			context.newRecord.setValue({ fieldId:'custrecord_vt_return_deal' ,value:null             });
			context.newRecord.setValue({ fieldId:'custrecord_vt_return_der'  ,value:null             });
			
			if (isFxContractReturnedPayment) { addCustpageFields(context); }
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function setupFormNotReturnedFXPayment(context) {
			log.debug(funcName, 'setupFormNotReturnedFXPayment ');
			toolsLib.setFieldDisplayType(context, ['custrecord_vt_bank_return_curr' ,'custrecord_vt_return_deal' ,'custrecord_vt_return_der' ,'custrecord_vt_priority_pmt_type' ], serverWidget.FieldDisplayType.HIDDEN);
		}
		

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function beforeSubmit(context) {
			var thisRecID = context.newRecord.getValue('id');
			funcName = scriptName + "-->beforeSubmit  execContext:" + runtime.executionContext + ", type:" + context.type + ", id:" + thisRecID;
			var thisVTStatus = Number(context.newRecord.getValue('custrecord_vt_status'));
			log.debug(funcName, 'thisVTStatus: ' + thisVTStatus);

			var newVoidRecord = context.newRecord;
			var oldVoidRecord = context.oldRecord;
			var thisRecID = context.newRecord.getValue('id');
			var thisVTStatus = Number(context.newRecord.getValue('custrecord_vt_status'));
			
			objExchangeRecordFields = get_exchangeRecordFields(context); 
			isFxContractReturnedPayment = evaluateIsFxContractReturnedPayment(context); 
			

			switch (context.type) {
				case context.UserEventType.EDIT:
					// In an edit I expect there to be an exchange record id in newRecord
				case context.UserEventType.CREATE:
					// If this is a create then there will be an exchange record id if initiated from the 
					// Process returned Payment button on the Exchange Record
					// A create initiated any other way is impermissable
					var exRecID = context.newRecord.getValue('custrecord_vt_exchange_record');
					log.debug('beforeSubmit', 'exRecID: ' + exRecID);
					
					if (isFxContractReturnedPayment) {
						
						var objFxReturnMatrix = lookupFxReturnMatrix(context ,objExchangeRecordFields);
						
						context.newRecord.setValue({ fieldId:'custrecord_vt_return_deal'        ,value:objFxReturnMatrix["deal"]             });
						context.newRecord.setValue({ fieldId:'custrecord_vt_return_der'         ,value:objFxReturnMatrix["der"]              });
						context.newRecord.setValue({ fieldId:'custrecord_vt_priority_pmt_type'  ,value:objFxReturnMatrix["priorityPmtType"]  });
					}
				
					break;
				case context.UserEventType.XEDIT:
					// It may be that this is a cancellation which is executed via record.submitfields 
					// which includes only changed fields in newRecord, in which case, grab exchange record id  from oldRecord. 
					exRecID = context.oldRecord.getValue('custrecord_vt_exchange_record');
					log.debug('beforeSubmit', 'exRecID: ' + exRecID);
					// Set Void Processed DateStamp upon cancellation or completion
					if (thisVTStatus === vtStatus.Canceled || thisVTStatus === vtStatus.Completed) {
						setVoidProcessedTimeStamp(context, newVoidRecord);
					}
					break;
				default:
					return;
			}
			// A Void Tracking record must have an Exchange Record link
			if (exRecID) {
				// Find out if there is already an active and incomplete Void Tracking record
				// If so, stop the save
				var existingVTRecID = vtLib.getExistingVTRec(exRecID, thisRecID);
				log.debug('beforeSubmit', 'existingVTRecID: ' + existingVTRecID);
				if (existingVTRecID) {
					throw 'There is already an incomplete and uncancelled Void Tracking record for this Exchange Record. Please complete or cancel that one before attempting to create a new one.';
				}
			} else {
				throw 'This Void Tracking record must have an Exchange Record link. Please create Void Tracking records by pressing the Process Returned Payment button on the Exchange Record.';
			}
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function lookupFxReturnMatrix(context ,objExchangeRecordFields) {
			
			var currencyUSD         = 1;
			var bankReturnCurrency  = context.newRecord.getValue('custrecord_vt_bank_return_curr');
			var isUSD               = "F";
			if ( bankReturnCurrency == currencyUSD ) { isUSD = "T"; };
			
			var objFxReturnMatrix = {"deal":null 
                                    ,"der":null
                                    ,"priorityPmtType":null };
			
			
			// SEARCH
	    	var filter0 = search.createFilter({ name:'isinactive'                               ,operator:"IS"      ,values:["F"]                         });
	    	var filter1 = search.createFilter({ name:'custrecord_fx_rpm_key_return_curr_usd'    ,operator:"IS"      ,values:[isUSD]                       });
	    	var filter2 = search.createFilter({ name:'custrecord_fx_rpm_key_issuing_bank'       ,operator:"ANYOF"   ,values:[objExchangeRecordFields["CUSTRECORD_EXREC_FX_CONV_CONTRACT.custrecord_fx_conv_bank"][0].value] });
	    	var filter3 = search.createFilter({ name:'custrecord_fx_rpm_key_paying_bank'        ,operator:"ANYOF"   ,values:[objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_ZZZ_ZZZ_DEAL.custentity_acq_deal_financial_bank_compa"][0].value] });
	    	var arrFilters = [];
	    	arrFilters.push(filter0);
	    	arrFilters.push(filter1);
	    	arrFilters.push(filter2);
	    	arrFilters.push(filter3);
			
	        var col_returnDeal            = search.createColumn({ name:"custrecord_fx_rpm_assign_return_deal"    ,join:null });
	        var col_returnDER             = search.createColumn({ name:"custrecord_fx_rpm_assign_return_der"     ,join:null });
	        var col_priorityPaymentType   = search.createColumn({ name:"custrecord_fx_rpm_assign_prty_pmt_type"  ,join:null });
	    	var arrColumns = [];
	    	arrColumns.push(col_returnDeal);
	    	arrColumns.push(col_returnDER);
	    	arrColumns.push(col_priorityPaymentType);
			
			var searchFxReturnMatrixObj = search.create({ type:"customrecord_fx_return_payment_matrix"
				                             ,filters:arrFilters
				                             ,columns:arrColumns  });
			
			log.debug(funcName , JSON.stringify(searchFxReturnMatrixObj) );
			var searchFxReturnMatrix        = searchFxReturnMatrixObj.run();
			var searchFxReturnMatrixResults = searchFxReturnMatrix.getRange(0,1);
			
			log.debug(funcName , JSON.stringify(searchFxReturnMatrixResults) );
			if (searchFxReturnMatrixResults.length > 0) { 
				objFxReturnMatrix["deal"]            = searchFxReturnMatrixResults[0].getValue(col_returnDeal);
				objFxReturnMatrix["der"]             = searchFxReturnMatrixResults[0].getValue(col_returnDER);
				objFxReturnMatrix["priorityPmtType"] = searchFxReturnMatrixResults[0].getValue(col_priorityPaymentType);
			}
			
			log.debug(funcName , JSON.stringify(objFxReturnMatrix) );
			return objFxReturnMatrix;
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function afterSubmit(context) {
			var thisRecID = context.newRecord.getValue('id');
			funcName = scriptName + "-->afterSubmit  execContext:" + runtime.executionContext + ", type:" + context.type + ", id:" + thisRecID;
			var thisVTStatus = Number(context.newRecord.getValue('custrecord_vt_status'));
			log.debug(funcName, 'thisVTStatus: ' + thisVTStatus);
			
			// ATP-179
			var createCase = context.newRecord.getValue('custrecord_vt_create_case');
			var relatedCaseId = context.newRecord.getValue('custrecord_vt_case');
			var exRecId = context.newRecord.getValue('custrecord_vt_exchange_record');

			if (!relatedCaseId && createCase == yesNo.Yes) {
				var createVoidCaseResult = createVoidCase(context, exRecId);
				log.debug('afterSubmit', 'createVoidCaseResult: ' + JSON.stringify(createVoidCaseResult));
				if (!createVoidCaseResult.success) {
					throw createVoidCaseResult.message;
				}
			}
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function createVoidCase(context, exRecId) {
			var success = false;
			var message = '';
			var caseCreation = vtListLib.caseCreation;
			var voidTrackingId = context.newRecord.id;
			var shareholderId = context.newRecord.getValue('custrecord_vt_shareholder');
			var dealId = context.newRecord.getValue('custrecord_vt_deal'); //ATP-257
			// Cannot use getText in create situation
			var fieldLookUp = search.lookupFields({
				type: 'customrecord_void_tracking',
				id: voidTrackingId,
				columns: ['custrecord_vt_paymethod', 'custrecord_vt_shareholder', 'custrecord_vt_return_reason']
			});
			var shareholderText = fieldLookUp.custrecord_vt_shareholder[0].text;
			var exRecPaymentMethod = fieldLookUp.custrecord_vt_paymethod[0].text;
			var returnReason = '';
			if (fieldLookUp.custrecord_vt_return_reason.length > 0) {
				returnReason = fieldLookUp.custrecord_vt_return_reason[0].text;
			}
			var currentDate = vtLib.getCurrentDateAsString();

			var tempCase = record.create({
				type: record.Type.SUPPORT_CASE
			});
			var caseFields = {
				title: 'Voided ' + exRecPaymentMethod + ' for Exchange Record ' + exRecId + ' (' + shareholderText + ') ' + currentDate + ' ' + returnReason,
				custevent_case_category: caseCreation.category, // Information Update (Contact / Payment) 
				custevent_case_queue: caseCreation.queue, // Payments Support
				custevent_case_department: caseCreation.department, // Acquiom Operations
				status: caseCreation.status, // Not Started
				assigned: '',
				custevent_qx_acq_associatedexchangereco: exRecId,
				company: shareholderId,
				custevent1: dealId, //ATP-257
				custevent_dealactionreq: caseCreation.dealAction, // No (Yes/No/Unknown)
			};
			for (prop in caseFields) {
				tempCase.setValue({
					fieldId: prop,
					value: caseFields[prop]
				});
			}
			var caseId;
			try {
				caseId = tempCase.save();
				if (caseId) {
					message = 'Case ' + caseId + ' successfully created;<br>';
					var updatedVTId = record.submitFields({
						type: 'customrecord_void_tracking',
						id: voidTrackingId,
						values: {
							custrecord_vt_case: caseId
						}
					});
					if (updatedVTId) {
						message += 'Void Tracking record ' + updatedVTId + ' successfully updated with link to case ' + caseId + ';<br>';
						success = true;
					}
				}

			} catch (e) {
				log.error(e.name, e.message + ' // ' + e.stack);
				message += e.message;
			}
			return {
				success: success,
				message: message
			};
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function setVoidProcessedTimeStamp(context, newVoidRecord) {
			var voidProcessedDate = context.oldRecord.getValue('custrecord_vt_void_processed_date');
			var voidProcessedBy = context.oldRecord.getValue('custrecord_vt_void_processed_by');
			if (!voidProcessedDate || !voidProcessedBy) {
				newVoidRecord.setValue({
					fieldId: 'custrecord_vt_void_processed_by',
					value: runtime.getCurrentUser().id,
					ignoreFieldChange: true
				});
				newVoidRecord.setValue({
					fieldId: 'custrecord_vt_void_processed_date',
					value: vtLib.getCurrentDateTime(),
					ignoreFieldChange: true
				});
			}
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function addButtons(context, thisVTStatus) {
			log.debug('addButtons', 'thisVTStatus: ' + thisVTStatus);
			context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/voidTrackingClient.js';
			// Only show Void and Cancel buttons if VT is not already cancelled or completed
			if (thisVTStatus === vtStatus.Completed || thisVTStatus === vtStatus.Canceled || thisVTStatus === vtStatus.Voiding) {
				if (thisVTStatus === vtStatus.Voiding) {
					context.form.addButton({
						id: 'custpage_void_payment_button',
						label: 'Complete',
						functionName: 'completeVoidTracking()'
					});
				}
			} 
			else {
				log.debug('addButtons', 'thisVTStatus is NOT completed or canceled ' + thisVTStatus);
				if (isFxContractReturnedPayment) {
					// To void a payment on a foreign currency exchange payment there needs to be an entry 
					// in the "FX Return Payment Matrix List" that specifies a DEAL, DER, and Priority Pmt Type 
					// to be used in the void processing.
					// If that is not the case, then an entry will need to be created before this payment can be voided.
					// Do not show the user a Void Payment button, but display a message informing them of the requirement
					var objFxReturnMatrix    = lookupFxReturnMatrix(context ,objExchangeRecordFields);
					var addVoidPaymentButton = true;
					var messageText          = "";
					if (   !objFxReturnMatrix 
						|| !objFxReturnMatrix["deal"] 
					    || !objFxReturnMatrix["der"] 
					    || !objFxReturnMatrix["priorityPmtType"] ) {
						addVoidPaymentButton = false; 
						messageText += "This payment involves a Foreign Currency Conversion."
						             + "<br/>" + "It is not possible to void this payment because there is configuration data missing in the 'FX Return Payment Matrix' list." 
							         + "<br/>" + "The entries in that list must specify a Deal, DER, and Priority Payment Type to be used during the Void Processing."
							         + "<br/>" + "There is not a valid entry in that list which matches this payment based on Return Currency, Issuing Bank, and Paying Bank.";
					}
					

					// Validate DER "Gl Accounts" list to insure that there is an account that supports the "Bank Return Currency"
					// If there is not an account with that currency, display a warning and prevent the 'Void Payment' button from being displayed
					var derId = context.newRecord.getValue('custrecord_vt_return_der');
					var bankReturnCurrencyName = context.newRecord.getText('custrecord_vt_bank_return_curr');
					if (derId && bankReturnCurrencyName) {
						var searchFilters          = [];
						searchFilters.push({ name:'internalid'                       ,operator:search.Operator.ANYOF                                          ,values:[derId] 	});
						searchFilters.push({ name:'custrecord_account_currency_name' ,operator:search.Operator.IS    ,join:"custrecord_pay_import_glaccounts" ,values:[bankReturnCurrencyName] });
						
						var derSearchObj = search.create({ type: 'customrecord_payment_import_record'
							                           ,columns:[ {name:'internalid'} ]
							                           ,filters: searchFilters
						                                 }).run();

						var derSearchResults = derSearchObj.getRange(0,1);

						if (derSearchResults.length == 0) {
							addVoidPaymentButton = false; 
							if (messageText) { messageText += "<br/><br/>"; }
							messageText += "This payment involves a Foreign Currency Conversion."
							             + "<br/>" + "The DER assigned to this Void Tracking record does not have a GL Account for currency '" + bankReturnCurrencyName + "'." 
						}
					}
					
					var dealId = context.newRecord.getValue('custrecord_vt_return_deal');
					if (derId && bankReturnCurrencyName) {
						var rcdDeal = record.load({ type:'customer' ,id:dealId ,isDynamic:true });
						if (rcdDeal) {
							var bankReturnCurrency = context.newRecord.getValue('custrecord_vt_bank_return_curr');
							var nbrCurrencies = rcdDeal.getLineCount({ sublistId:'currency'});
							var found = false;
							for (ix=0; ix<nbrCurrencies; ix++) {
								rcdDeal.selectLine({ sublistId:'currency' ,line:ix });
								var currencyId = rcdDeal.getCurrentSublistValue('currency' ,'currency');
								if (bankReturnCurrency == currencyId) { found = true; }
							}
							if (!found) {
								addVoidPaymentButton = false; 
								if (messageText) { messageText += "<br/><br/>"; }
								messageText += "This payment involves a Foreign Currency Conversion."
								             + "<br/>" + "The Deal assigned to this Void Tracking record does not have currency '" + bankReturnCurrencyName + "'." 
							}
						}
					}
					
					
					if (messageText) {
                        priMessage.prepareMessage('Invalid Configuration', messageText, priMessage.TYPE.WARNING);
                        priMessage.showPreparedMessage(context);
					}
					if (addVoidPaymentButton) { context.form.addButton({ id:'custpage_void_payment_button' ,label:'Void Payment' ,functionName:'voidPaymentFxCurrencyConversion()' }); }
				} // $("#Contentable").hide();
				else {
					context.form.addButton({ id:'custpage_void_payment_button' ,label:'Void Payment' ,functionName:'voidPayment()' });
				}

				context.form.addButton({ id:'custpage_cancel_void_tracking_button' ,label:'Cancel' ,functionName:'cancelVoidTracking' });
			}
			return true;
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function setFieldDisplayTypes(context, thisRecID, thisVTStatus) {
			funcName = scriptName + "-->setFieldDisplayTypes ";
			var thisRecord = null;
			var recordFields = null;
			var allCustomFields = null;
			baseRecordType = context.newRecord.getValue('baserecordtype');
			// Disable most fields when status = Completed
			if (thisVTStatus === vtStatus.Completed) {
				thisRecord = record.load({
					type: baseRecordType,
					id: thisRecID
				});
				recordFields = thisRecord.getFields();
				// Disable all custom fields 
				allCustomFields = vtLib.getAllCustomFields(recordFields);
				inlineProtectFields(context, allCustomFields);
				// Enable the fields below
				var completedStatusEditableFields = vtLib.getCompletedStatusEditableFields();
				enableFields(context, completedStatusEditableFields);
			}
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function enableFields(context, fieldArray) {
			var theForm = context.form;
			for (var i = 0; i < fieldArray.length; i++) {
				theForm.getField({
					id: fieldArray[i]
				}).updateDisplayType({
					displayType: serverWidget.FieldDisplayType.NORMAL
				});
			}
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function inlineProtectFields(context, fieldArray) {
			var theForm = context.form;
			for (var i = 0; i < fieldArray.length; i++) {
				theForm.getField({
					id: fieldArray[i]
				}).updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
			}
		}

		
		//=================================================================================================================================================
		//=================================================================================================================================================
		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	}
);