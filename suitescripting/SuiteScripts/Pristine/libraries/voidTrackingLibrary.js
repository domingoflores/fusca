/**
 * voidTrackingLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities 
 * 
 * include '/SuiteScripts/Pristine/libraries/voidTrackingLibrary.js'
 *
 * Version    	Date            Author          Remarks
 *	1.0		  				  	Ken C 			Initial version 
 *  2.0 		Dec 2019		Ken C 			ATP-1350			
 *
 */
define(['N/search', 'N/runtime', 'N/format', 'N/url', 'N/transaction', 'N/record'
		,'/SuiteScripts/Pristine/libraries/voidTrackingListLibrary.js'
		,'/SuiteScripts/Pristine/libraries/alphaRecordLibrary.js'
		,'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
		,'/SuiteScripts/Pristine/libraries/toolsLibraryClient.js'
	],

	function(search, runtime, format, url, transaction, record
			,vtListLib
			,alphaLib
			,piListLib	
			,toolsLibClient
		) {

		var scriptName = "voidTrackingLibrary.js";
		var vtStatus = vtListLib.vtList.vtStatus;
		var yesNo = vtListLib.vtList.yesNo;
		var respParty = vtListLib.vtList.respParty;
		var voidTrackingRecType = vtListLib.recordType.VoidTracking;
		var transactionConstant = vtListLib.transactionConstant;
		var paymtInstrHoldReason = piListLib.piEnum.paymtInstrHoldReason;
		var nativeBillApprovalSts = piListLib.piEnum.nativeBillApprovalSts;
		var completedStatusEditableFields = [];
		var objPermissionList = {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"};

		function getExistingVTRec(exRecID, vtRecID) {

			log.debug('getExistingVTRec', 'vtRecID: ' + vtRecID);
			var existingVTRecID = null;
			var searchFilters = [];
			searchFilters.push({
				name: 'custrecord_vt_exchange_record',
				operator: search.Operator.IS,
				values: exRecID
			}, {
				name: 'custrecord_vt_status',
				operator: search.Operator.NONEOF,
				values: [vtStatus.Canceled, vtStatus.Completed]
			});
			if (vtRecID) {
				searchFilters.push({
					name: 'internalid',
					operator: search.Operator.NONEOF,
					values: vtRecID
				});
			}

			var vtSearch = search.create({
				type: 'customrecord_void_tracking',
				title: 'VT Search',
				columns: [{
					name: 'internalid'
				}],
				filters: searchFilters
			}).run();
			var searchResults = vtSearch.getRange(0, 1); //I only expect one row to return
			if (searchResults.length > 0) {
				existingVTRecID = searchResults[0].getValue({
					name: 'internalid'
				});
			}
			return existingVTRecID;
		}

		function calcBankFeeAmount(bankReturnAmount, refundAmount) {
			var bankFeeAmount = 0;
			bankFeeAmount = Number(refundAmount - bankReturnAmount).toFixed(2);
			log.debug('calcBankFeeAmount', 'bankFeeAmount: ' + bankFeeAmount);
			return bankFeeAmount;
		}

		function getSRSPaymtFeeAmount(creditMemoID) {
			var paymtFeeAmount = 0;
			if (creditMemoID) {
				var paymtFeeSearch = search.create({
					type: search.Type.CREDIT_MEMO,
					title: 'Payment Fee',
					columns: [{
						name: 'amount',
						summary: search.Summary.SUM
					}],
					filters: [{
						name: 'internalid',
						operator: search.Operator.IS,
						values: creditMemoID
					}, {
						name: 'name',
						join: 'item',
						operator: search.Operator.STARTSWITH,
						values: 'Shareholder Charges'
					}]
				}).run();
				var searchResults = paymtFeeSearch.getRange(0, 1); //I only expect one row to return
				if (searchResults) {
					paymtFeeAmount = searchResults[0].getValue({
						name: 'amount',
						summary: search.Summary.SUM
					});
				}
			}
			return Number(paymtFeeAmount);
		}

		function getSRSPaymtFeeLines(creditMemoID) {
			var searchResults = null;
			if (creditMemoID) {
				var paymtFeeSearch = search.create({
					type: search.Type.CREDIT_MEMO,
					title: 'Payment Fee',
					columns: ['item', 'quantity', 'amount'],
					filters: [{
						name: 'internalid',
						operator: search.Operator.IS,
						values: creditMemoID
					}, {
						name: 'name',
						join: 'item',
						operator: search.Operator.STARTSWITH,
						values: 'Shareholder Charges'
					}]
				}).run();
				searchResults = paymtFeeSearch.getRange(0, 50); //I only expect one row to return
			}
			return searchResults;
		}

		function getRefundAmount(custRefundID) {
			log.debug('voidTrackingLibary getRefundAmount', 'custRefundID: ' + JSON.stringify(custRefundID));
			var refundAmount = 0;
			if (custRefundID) {
				var refundSearch = search.create({
					type: search.Type.CUSTOMER_REFUND,
					title: 'Refund Total',
					columns: [search.createColumn({
						name: 'total'
					})],
					filters: [search.createFilter({
						name: 'internalid',
						operator: search.Operator.IS,
						values: custRefundID
					})],
				}).run();
				var searchResults = refundSearch.getRange(0, 1); //I only expect one row to return
				if (searchResults) {
					refundAmount = searchResults[0].getValue({
						name: 'total'
					});
					// If the amount field is negative - I convert it for simplicity
					refundAmount = Math.abs(Number(refundAmount));
				}
			}
			log.debug('voidTrackingLibary getRefundAmount', 'refundAmount: ' + JSON.stringify(refundAmount));
			return refundAmount;
		}

		function getAllCustomFields(recordFields) {
			var customFields = [];
			for (var i = 0; i < recordFields.length; i++) {
				if (recordFields[i].substr(0, 10) === 'custrecord') {
					customFields.push(recordFields[i]);
				}
			}
			return customFields;
		}

		function getCompletedStatusEditableFields() {
			return completedStatusEditableFields;
		}

		function getCurrentDateTime() {
			// grabs the current Javascript Date/Time and parses it into a format NetSuite accepts
			var now = new Date();
			return format.parse({
				value: now,
				type: format.Type.DATETIMETZ
			});
		}

		function getCurrentDateAsString() {
			var now = new Date();
			var dd = ('0' + now.getDate()).slice(-2);
			var mm = ('0' + (now.getMonth() + 1)).slice(-2);
			var yyyy = now.getFullYear();
			return mm + '-' + dd + '-' + yyyy;
		}

		
		//========================================================================================================================
		//========================================================================================================================
		function processVoidPaymentFCCPayment(vtRecID) {
			
			var funcName     = "VoidPaymentFCCPayment id=" + vtRecID;
			var success      = true;
			var voidActivity = "";
			var brSlash      = ";<br>";
			var step         = 0;
			
			var vtFieldValues = search.lookupFields({
				type: 'customrecord_void_tracking',
				id: vtRecID,
				columns: ['id', 'custrecord_vt_exchange_record', 'custrecord_vt_review_note', 'custrecord_vt_credit_memo'
					     ,'custrecord_vt_credit_memo.tranid', 'custrecord_vt_shareholder', 'custrecord_vt_return_reason'
					     ,'custrecord_vt_customer_refund', 'custrecord_vt_bank_fee_amount', 'custrecord_vt_responsible_party'
					     ,'custrecord_vt_bank_return_amount', 'custrecord_vt_create_case', 'custrecord_vt_srs_waives_fut_fee'
					     ,'custrecord_vt_status'
					     ,'custrecord_vt_void_activity', 'custrecord_vt_case', 'custrecord_vt_deal'
					     ,'custrecord_vt_deal.custentity_acq_deal_financial_bank_accou'
					     ,'custrecord_vt_srs_paymt_fee_amount'
					     ,'custrecord_vt_fx_curr_contract'
					     ,'custrecord_vt_return_deal'
					     ,'custrecord_vt_return_der'
					     ,'custrecord_vt_priority_pmt_type'
					     ,'CUSTRECORD_VT_PRIORITY_PMT_TYPE.custrecord_acq_lot_pri_pmt_waive_fees'
					     ,'custrecord_vt_bank_ref_nbr'
					     ,'custrecord_vt_bank_return_curr'
					     ,'custrecord_vt_case'
					     ,'CUSTRECORD_VT_EXCHANGE_RECORD.custrecord_qx_acq_loth_buyername'
					     ,'CUSTRECORD_VT_EXCHANGE_RECORD.custrecord_qx_acq_loth_sellername'
				]
			});
			
			// Set status to voiding to start with 
			var currStatus = vtFieldValues.custrecord_vt_status[0].value;
			if (currStatus !== vtStatus.Voiding) { updateVTStatus(vtRecID, vtStatus.Voiding); }

			
			// STEP 1 - make a copy of the exchange record
			step += 1;
			var newExRecId;
			var objExchangeRecord;
			try {
				var acqStatus_readyForReview   = 4;
				var shrStatus_readyForApproval = 5;
				var fxSettlementAmount = 0;
				if (vtFieldValues.custrecord_vt_bank_return_curr[0].value != 1) { fxSettlementAmount = Number(vtFieldValues.custrecord_vt_bank_return_amount); }
				var lotdelivery_Offline        = 16;
				var waiveFees = null;
				if (vtFieldValues["CUSTRECORD_VT_PRIORITY_PMT_TYPE.custrecord_acq_lot_pri_pmt_waive_fees"]) { waiveFees = 1; }
				
				var importReviewNotes = "";
				var origBuyerName     = vtFieldValues["CUSTRECORD_VT_EXCHANGE_RECORD.custrecord_qx_acq_loth_buyername"];
				var origSellerName    = vtFieldValues["CUSTRECORD_VT_EXCHANGE_RECORD.custrecord_qx_acq_loth_sellername"];
				if ( origBuyerName &&  origSellerName ) 	{ importReviewNotes = "For equity held in {0} acquired by {1}".replace("{0}",origSellerName).replace("{1}",origBuyerName); }
				else 
				if (!origBuyerName && !origSellerName ) 	{ importReviewNotes = "Proceeds from sale of equity"; }
				else 
				if (!origBuyerName) 						{ importReviewNotes = "For equity held in {0}".replace("{0}",origSellerName); }
				
				else 										{ importReviewNotes = "For payment in {0} transaction".replace("{0}",origBuyerName); }
				
				objExchangeRecord = record.copy({type:"customrecord_acq_lot" ,id:vtFieldValues.custrecord_vt_exchange_record[0].value ,isDynamic:true});
				objExchangeRecord.setValue("custrecord_alpha_er_record"                 ,vtFieldValues.custrecord_vt_exchange_record[0].value );
				objExchangeRecord.setValue("custrecord_acq_loth_zzz_zzz_deal"           ,vtFieldValues.custrecord_vt_return_deal[0].value );
				objExchangeRecord.setValue("custrecord_acq_lot_payment_import_record"   ,vtFieldValues.custrecord_vt_return_der[0].value );
				objExchangeRecord.setValue("custrecord_acq_lot_priority_payment"        ,vtFieldValues.custrecord_vt_priority_pmt_type[0].value );
				objExchangeRecord.setValue("custrecord_exrec_waive_fees"                ,waiveFees );
//				objExchangeRecord.setValue("custrecord_acq_loth_0_de1_notes"            ,vtFieldValues.custrecord_vt_bank_ref_nbr );
				objExchangeRecord.setValue("custrecord_exrec_fx_conv_contract"          ,null );
				objExchangeRecord.setValue("custrecord_acq_loth_related_trans"          ,null );
				objExchangeRecord.setValue("custrecord_acq_loth_related_refund"         ,null );
				objExchangeRecord.setValue("custrecord_acq_loth_reviewcomplete"         ,false );
				objExchangeRecord.setValue("custrecordacq_loth_2_de1_taxidmethod"       ,null );
				objExchangeRecord.setValue("custrecord_exrec_tax_form_collected"        ,null );
				objExchangeRecord.setValue("custrecord_acq_pay_approve_date"            ,null );
				objExchangeRecord.setValue("custrecord_exrec_payment_eff_date"          ,null );
				objExchangeRecord.setValue("custrecord_exrec_solg"                      ,null );
				objExchangeRecord.setValue("custrecord_exch_rec_group"                  ,null );
//				objExchangeRecord.setValue("custrecord_acq_loth_0_de2_notes"            ,importReviewNotes );
				objExchangeRecord.setValue("custrecord_acq_loth_zzz_zzz_lotdelivery"    ,lotdelivery_Offline );
				objExchangeRecord.setValue("custrecord_acq_loth_zzz_zzz_acqstatus"      ,acqStatus_readyForReview );
				objExchangeRecord.setValue("custrecord_acq_loth_zzz_zzz_shrhldstat"     ,shrStatus_readyForApproval );
				objExchangeRecord.setValue("custrecord_exrec_fx_settlement_amount"      ,fxSettlementAmount );
				objExchangeRecord.setValue("custrecord_exrec_orig_payment_ref_nbr"      ,vtFieldValues.custrecord_vt_bank_ref_nbr );
				objExchangeRecord.setValue("custrecord_exrec_orig_payment_remit_info"   ,importReviewNotes );
				
				newExRecId = objExchangeRecord.save();
				voidActivity += "Step " + step + ": Exchange record " + newExRecId + " created. " + brSlash;
  				log.debug(funcName + " step:" + step ,'voidActivity: ' + voidActivity);
			}
			catch(e) {
				success = false;
				log.error(funcName + " step:" + step ,'Exchange record exception: ' + JSON.stringify(e));
				voidActivity += "Step " + step + ": Exchange record exception: " + JSON.stringify(e) + brSlash;
			}
			
			
			// STEP 2 - Update Deficiency Case if a case was created on Void Tracking record 
			step += 1;
			try {
				if (success) {
					if (vtFieldValues.custrecord_vt_case.length > 0 && vtFieldValues.custrecord_vt_case[0].value) {
						var casePriority_high = 1;
						var caseSubmitFieldsValues = {};
						caseSubmitFieldsValues["custevent_qx_acq_associatedexchangereco"] = newExRecId;
						caseSubmitFieldsValues["priority"]                                = casePriority_high;
						caseSubmitFieldsValues["custevent_srs_case_claim_summary"]        = "";
						
						var id = record.submitFields({ type:'supportcase' ,id:vtFieldValues.custrecord_vt_case[0].value ,values:caseSubmitFieldsValues });
						
						voidActivity += "Step " + step + ": Deficiency Case modified. " + brSlash;
		  				log.debug(funcName + " step:" + step ,'voidActivity: ' + voidActivity);
					}
				}
			}
			catch(e) {
				success = false;
				log.error(funcName + " step:" + step ,'Deficiency Case exception: ' + JSON.stringify(e));
				voidActivity += "Step " + step + ": Deficiency Case exception: " + JSON.stringify(e) + brSlash;
			}
			
			
			// STEP 3 - Make a LOT Certificate and attach to new exchange record above
			step += 1;
			var lotCertId;
			var rcdLotCertificate;
			try {
				if (success) {
					var certStatus_NoCertificateNeeded = 7;
					var certType_Other                 = 8;
					  
					rcdLotCertificate = record.create({type:'customrecord_acq_lot_cert_entry' ,isDynamic:true });
					rcdLotCertificate.setValue('custrecord_acq_lotce_zzz_zzz_parentlot'       ,newExRecId );
					rcdLotCertificate.setValue('custrecord_lot_cert_deal'                     ,objExchangeRecord.getValue("custrecord_acq_loth_zzz_zzz_deal") );
					rcdLotCertificate.setValue('custrecord_lot_cert_shareholder'              ,objExchangeRecord.getValue("custrecord_acq_loth_zzz_zzz_shareholder") );
					rcdLotCertificate.setValue('custrecord_acq_lotce_zzz_zzz_lotcestatus'     ,certStatus_NoCertificateNeeded );
					rcdLotCertificate.setValue('custrecord_acq_lotce_3_src_certtype'          ,certType_Other );
					rcdLotCertificate.setValue('custrecord_acq_lotce_zzz_zzz_payment'         ,Number(vtFieldValues.custrecord_vt_bank_return_amount) );
					rcdLotCertificate.setValue('custrecord_acq_lotce_zzz_zzz_currencytyp'     ,vtFieldValues.custrecord_vt_bank_return_curr[0].value );

	  				lotCertId = rcdLotCertificate.save();
	  				voidActivity += "Step " + step + ": LOT Certificate " + lotCertId + " created. " + brSlash;
	  				log.debug(funcName + " step:" + step ,'voidActivity: ' + voidActivity);
				}
			}
			catch(e) {
				success = false;
				log.error(funcName + " step:" + step ,'LOT Certificate exception: ' + JSON.stringify(e));
				voidActivity += "Step " + step + ": LOT Certificate: " + JSON.stringify(e) + brSlash;
			}
			
			
			// STEP 4 - Create an Invoice record
			step += 1;
			var invoiceId;
			var rcdInvoice;
			var class_ClientAccounts_Acquiom  = 51;
			var dept_ClientAccounts_Acquiom   = 20;
			var item_ShareholderProceeds      = 264;
			var costEstType_ItemDefinedCost   = 0000;
			try {
				if (success) {
					log.debug(funcName + " step:" + step ,'trying ' );
					rcdInvoice = record.create({type:record.Type.INVOICE ,isDynamic:true });
					rcdInvoice.setValue('amount'                                 ,Number(vtFieldValues.custrecord_vt_bank_return_amount) );
					rcdInvoice.setValue('entity'                                 ,objExchangeRecord.getValue("custrecord_acq_loth_zzz_zzz_deal") );
					rcdInvoice.setValue('custbodyacq_deal_link'                  ,objExchangeRecord.getValue("custrecord_acq_loth_zzz_zzz_deal") );
					rcdInvoice.setValue('custrecord_lot_cert_shareholder'        ,objExchangeRecord.getValue("custrecord_acq_loth_zzz_zzz_shareholder") );
					rcdInvoice.setValue('memo'                                   ,"Deposit Amount" );
					rcdInvoice.setValue('currency'                               ,vtFieldValues.custrecord_vt_bank_return_curr[0].value );
					rcdInvoice.setValue('department'                             ,dept_ClientAccounts_Acquiom );
					rcdInvoice.setValue('class'                                  ,class_ClientAccounts_Acquiom );
					rcdInvoice.setValue('custbody_acq_lot_createdfrom_exchrec'   ,newExRecId );

					rcdInvoice.selectNewLine('item');
					rcdInvoice.setCurrentSublistValue({ sublistId:'item' ,fieldId:'item'             ,value: item_ShareholderProceeds                               ,ignoreFieldChange: false });
					rcdInvoice.setCurrentSublistValue({ sublistId:'item' ,fieldId:'amount'           ,value: Number(vtFieldValues.custrecord_vt_bank_return_amount) ,ignoreFieldChange: true });
					rcdInvoice.setCurrentSublistValue({ sublistId:'item' ,fieldId:'quantity'         ,value: 1                                                      ,ignoreFieldChange: true });
					rcdInvoice.setCurrentSublistValue({ sublistId:'item' ,fieldId:'department'       ,value: dept_ClientAccounts_Acquiom                            ,ignoreFieldChange: false });
					rcdInvoice.commitLine('item');
					
					invoiceId = rcdInvoice.save();
	  				voidActivity += "Step " + step + ": Invoice " + invoiceId + " created. " + brSlash;
	  				log.debug(funcName + " step:" + step ,'voidActivity: ' + voidActivity);
				}
			}
			catch(e) {
				success = false;
				log.error(funcName + " step:" + step ,'Invoice exception: ' + JSON.stringify(e));
				voidActivity += "Step " + step + ": Invoice exception: " + JSON.stringify(e) + brSlash;
			}

			
			// STEP 5 - Create a Payment record
			step += 1;
			var paymentId;
			var rcdPayment;
			var returnDerAccount = null;
			try {
				if (success) {
					// Get Account from DER GL Accounts list that matches the Bank Return Currency
					var derId                  = objExchangeRecord.getValue("custrecord_acq_lot_payment_import_record");
					var bankReturnCurrencyName = vtFieldValues.custrecord_vt_bank_return_curr[0].text;
					var searchFilters          = [];
					searchFilters.push({ name:'internalid'                       ,operator:search.Operator.ANYOF                                          ,values:[derId] 	});
					searchFilters.push({ name:'custrecord_account_currency_name' ,operator:search.Operator.IS    ,join:"custrecord_pay_import_glaccounts" ,values:[bankReturnCurrencyName] });
					var derSearchObj = search.create({ type: 'customrecord_payment_import_record'
						                           ,columns:[ {name:'internalid' ,join:"custrecord_pay_import_glaccounts" } 
						                                    ]
						                           ,filters: searchFilters
					                                 }).run();
					var derSearchResults = derSearchObj.getRange(0,1);
					if (derSearchResults.length > 0) {
						returnDerAccount = derSearchResults[0].getValue({name:'internalid' ,join:"custrecord_pay_import_glaccounts"});
					}
					
					rcdPayment = record.create({type:record.Type.CUSTOMER_PAYMENT ,isDynamic:true });
					rcdPayment.setValue('customer'                                     ,objExchangeRecord.getValue("custrecord_acq_loth_zzz_zzz_deal") );
					rcdPayment.setValue('custbodyacq_deal_link'                        ,objExchangeRecord.getValue("custrecord_acq_loth_zzz_zzz_deal") );
					rcdPayment.setValue('custbody_deal_event'                          ,objExchangeRecord.getValue("custrecord_acq_lot_payment_import_record") );
					rcdPayment.setValue('currency'                                     ,vtFieldValues.custrecord_vt_bank_return_curr[0].value );
					rcdPayment.setValue('memo'                                         ,"Deposit Amount");
					rcdPayment.setValue('department'                                   ,dept_ClientAccounts_Acquiom );
					rcdPayment.setValue('class'                                        ,class_ClientAccounts_Acquiom );
					rcdPayment.setValue('payment'                                      ,Number(vtFieldValues.custrecord_vt_bank_return_amount) );
					rcdPayment.setValue('account'                                      ,returnDerAccount );
					
					var nbrApply = rcdPayment.getLineCount({ sublistId:'apply'});
					
					log.debug(funcName ,"Look for Invoice " + invoiceId + " in apply sublist, nbr available invoices in list: " + nbrApply );
					for (ix=0; ix<nbrApply; ix++) {
						rcdPayment.selectLine({ sublistId:'apply' ,line:ix });
						var lineInvoiceId = rcdPayment.getCurrentSublistValue('apply' ,'internalid');
						log.debug(funcName ,"Invoice ID: " + lineInvoiceId );
						if (lineInvoiceId == invoiceId) {
							rcdPayment.commitLine('apply');
							log.debug(funcName ,"Invoice " + lineInvoiceId + " applied");
						}
					}
					   
					paymentId = rcdPayment.save();
					voidActivity += "Step " + step + ": Payment " + paymentId + " created. " + brSlash;
	  				log.debug(funcName + " step:" + step ,'voidActivity: ' + voidActivity);
				}
			}
			catch(e) {
				success = false;
				log.error(funcName + " step:" + step ,'Payment exception: ' + JSON.stringify(e));
				voidActivity += "Step " + step + ": Payment exception: " + JSON.stringify(e) + brSlash;
			}

			
			// STEP 6 - Update Void Tracking record
			step += 1;
			var submitFieldsValues = {};
			try {
				submitFieldsValues["custrecord_vt_void_activity"] = voidActivity;
				if (newExRecId) { submitFieldsValues["custrecord_vt_fx_ret_exchange_rcd"] = newExRecId; }
				if (invoiceId)  { submitFieldsValues["custrecord_vt_fx_return_invoice"]   = invoiceId;  }
				if (paymentId)  { submitFieldsValues["custrecord_vt_fx_return_payment"]   = paymentId;  }
				if (success)    { submitFieldsValues["custrecord_vt_status"]              = vtStatus.Completed;  }
				
				var id = record.submitFields({ type:'customrecord_void_tracking' ,id:vtRecID ,values:submitFieldsValues });
				voidActivity += "Step " + step + ": Update Void Tracking done. " + brSlash;
			} 
			catch(e) {
				success = false;
				log.error(funcName + " step:" + step , 'Update Void Tracking record failed after processing completed, exception: ' + JSON.stringify(e));
				log.debug(funcName + " step:" + step , 'submitFieldsValues: ' + JSON.stringify(submitFieldsValues));
				voidActivity += "Step " + step + ": Update Void Tracking exception: " + JSON.stringify(e) + brSlash;
				var submitFieldsValuesEx = {"custrecord_vt_void_activity":voidActivity};
				var id = record.submitFields({ type:'customrecord_void_tracking' ,id:vtRecID ,values:submitFieldsValuesEx });
			}
			
			// Return to client script calling function
			return { success:success ,voidActivity:voidActivity };
			
		}
		
		//========================================================================================================================
		//========================================================================================================================
		function processVoidPayment(vtRecID) {

			var vtFieldValues = search.lookupFields({
				type: 'customrecord_void_tracking',
				id: vtRecID,
				columns: ['id', 'custrecord_vt_exchange_record', 'custrecord_vt_review_note', 'custrecord_vt_credit_memo',
					'custrecord_vt_credit_memo.tranid', 'custrecord_vt_shareholder', 'custrecord_vt_return_reason',
					'custrecord_vt_customer_refund', 'custrecord_vt_bank_fee_amount', 'custrecord_vt_responsible_party',
					'custrecord_vt_bank_return_amount', 'custrecord_vt_create_case', 'custrecord_vt_srs_waives_fut_fee', 'custrecord_vt_status',
					'custrecord_vt_void_activity', 'custrecord_vt_case', 'custrecord_vt_deal', 'custrecord_vt_deal.custentity_acq_deal_financial_bank_accou',
					'custrecord_vt_srs_paymt_fee_amount'
				]
			});

			var success = null;
			var voidActivity = vtFieldValues.custrecord_vt_void_activity;

			// Set status to voiding to start with 
			var currStatus = vtFieldValues.custrecord_vt_status[0].value;
			if (currStatus !== vtStatus.Voiding) {
				updateVTStatus(vtRecID, vtStatus.Voiding);
			}

			// Create variables for some of the field values you will need
			var exRecId = vtFieldValues.custrecord_vt_exchange_record[0].value;
			var dealId = vtFieldValues.custrecord_vt_deal[0].value;
			var voidReviewNotes = vtFieldValues.custrecord_vt_review_note;
			var custRefundID = vtFieldValues.custrecord_vt_customer_refund[0].value;
			var custRefundText = vtFieldValues.custrecord_vt_customer_refund[0].text;
			var creditMemoID = vtFieldValues.custrecord_vt_credit_memo[0].value;
			var responsiblePartyID = null;
			if (vtFieldValues.custrecord_vt_responsible_party.length > 0) {
				responsiblePartyID = Number(vtFieldValues.custrecord_vt_responsible_party[0].value);
			}

			//Get the balance of the Deal Bank Service Charge Clearing Account before we create any transactions
			//Only required when SRS is responsible
			var dealBankChargeClearingAccountBalance = 0;
			if (responsiblePartyID !== respParty.Payee) {
				dealBankChargeClearingAccountBalance = getDealBankChargeClearingAccountBalance(dealId);
			}
			// log.debug('processVoidPayment', 'dealBankChargeClearingAccountBalance: ' + JSON.stringify(dealBankChargeClearingAccountBalance));

			// Void the Customer Refund and Credit memo
			var voidPaymentTxnsResult = voidPaymentTxns(vtRecID, custRefundID, custRefundText, creditMemoID, vtFieldValues);
			voidActivity += voidPaymentTxnsResult.voidActivity;
			success = voidPaymentTxnsResult.success;
			if (success) {
				// If successful so far, create the transactions for any fees there may be
				var processBankFeeResult = processBankFee(vtFieldValues, dealBankChargeClearingAccountBalance);
				// log.debug('processVoidPayment', 'processBankFeeResult: ' + JSON.stringify(processBankFeeResult));
				voidActivity += processBankFeeResult.voidActivity;
				success = processBankFeeResult.success;
				if (success) {
					// Place hold on Payment Instruction if any applies
					var holdPIResult = holdPaymentInstruction(vtFieldValues);
					// log.debug('processVoidPayment', 'holdPIResult: ' + JSON.stringify(holdPIResult));
					voidActivity += holdPIResult.voidActivity;
					success = holdPIResult.success;
					if (success) {
						//Update the Exchange Record
						var updateExRecResult = updateExchangeRecord(vtRecID, exRecId, voidReviewNotes);
						// log.debug('processVoidPayment', 'updateExRecResult: ' + JSON.stringify(updateExRecResult));
						voidActivity += updateExRecResult.voidActivity;
						success = updateExRecResult.success;
						// If Exchange Record successfuly updated then we're done
						// Update VT status to voided
						if (success) {
							var submitFieldsValues = {};
							try {
								submitFieldsValues = {
										'custrecord_vt_status': vtStatus.Completed,
										'custrecord_vt_cm_void_jnl': voidPaymentTxnsResult.creditMemoVoidingJE,
										'custrecord_vt_cr_void_jnl': voidPaymentTxnsResult.custRefundVoidingJE,
										'custrecord_vt_bf_invoice': processBankFeeResult.invoiceId,
										'custrecord_vt_bf_cust_paymt': processBankFeeResult.custPaymtId,
										'custrecord_vt_srsa_reimb_vend_bill': processBankFeeResult.srsaReimbVendorBillId,
										'custrecord_vt_srsa_reimb_vend_paymt': processBankFeeResult.srsaReimbVendorPaymtId,
										'custrecord_vt_cbf_vendor_bill': processBankFeeResult.contraBankVendorBillId,
										'custrecord_vt_cbf_vendor_paymt': processBankFeeResult.contraBankVendorPaymtId,
										'custrecord_vt_void_activity': voidActivity
									};
								
								var id = record.submitFields({ type:'customrecord_void_tracking' ,id:vtRecID ,values:submitFieldsValues });
							} 
							catch (e) {
								log.error('processVoidPayment', 'e: ' + JSON.stringify(e));
								log.debug('processVoidPayment', 'submitFields values: ' + JSON.stringify(e));
								success = false;
								voidActivity += "Void Activity record update failed after processing successfully completed.";
							}
						}
					}
				}
			}
			
			// If there was a failure, the voidActivity field contains the error message so write it to the VT record
			if (!success) {
				try { var id = record.submitFields({ type:'customrecord_void_tracking' ,id:vtRecID ,values:{ 'custrecord_vt_void_activity':voidActivity } }); } 
				catch (e) { 
					log.error('processVoidPayment' ,'Processing failed, error updating Void Activity on VT Record, e: ' + JSON.stringify(e)); 
					log.debug('processVoidPayment' ,'Void Activity: ' + JSON.stringify(voidActivity) ); 
				}
			}
			
			return {
				success: success,
				voidActivity: voidActivity
			};
		}

		
		//=========================================================================================
		//=========================================================================================
		function updateVTStatus(vtID, vtReqStatus) {
			try { var id = record.submitFields({ type:'customrecord_void_tracking' ,id:vtID, values:{ 'custrecord_vt_status':vtReqStatus } }); } 
			catch (e) { log.error('voidTrackingLibrary.js-->updateVTStatus' ,'e: ' + JSON.stringify(e)); }
		}

		
		//=========================================================================================
		//=========================================================================================
		function getDealBankChargeClearingAccountBalance(dealId) {
			log.debug('getDealBankChargeClearingAccountBalance', 'dealId: ' + JSON.stringify(dealId));
			var clearingAccountTotal = 0;
			if (dealId) {
				var clearingAccountSearch = search.create({
					type: search.Type.TRANSACTION,
					title: 'Clearing Account Balance',
					columns: [{
						name: 'amount',
						summary: search.Summary.SUM
					}, {
						name: 'custbodyacq_deal_link',
						summary: search.Summary.GROUP
					}],
					filters: [{
						name: 'custbodyacq_deal_link',
						operator: search.Operator.IS,
						values: dealId
					}, {
						name: 'account',
						operator: search.Operator.IS,
						values: transactionConstant.acquiomClientFundsBankServiceChargeClearingAccount
					}, {
						name: 'posting',
						operator: search.Operator.IS,
						values: 'T'
					}]
				}).run();
				log.debug('getDealBankChargeClearingAccountBalance', 'after search run' + JSON.stringify(dealId));
				var searchResults = clearingAccountSearch.getRange(0, 1); //I only expect one row to return
				if (searchResults.length > 0) {
					clearingAccountTotal = searchResults[0].getValue({
						name: 'amount',
						summary: search.Summary.SUM
					});
				}
			}
			return Number(clearingAccountTotal);
		}

		function voidPaymentTxns(vtRecID, custRefundID, custRefundText, creditMemoID, vtFieldValues) {
			var success = false;
			var voidActivity = '';

			var custRefundVoidResult = voidCustRefund(vtRecID, custRefundID, custRefundText);
			voidActivity += custRefundVoidResult.voidActivity;
			success = custRefundVoidResult.success;
			// Only continue if certain the Cust Refund has been voided
			if (success) {
				// Void the Credit Memo
				var creditMemoVoidResult = voidCreditMemo(vtRecID, creditMemoID);
				voidActivity += creditMemoVoidResult.voidActivity;
				success = creditMemoVoidResult.success;
				// If the Credit Memo has already been voided correctly then this is unexpected and so stop all processing (Could be caused by pressing the Void button > once)
				if (success) {
					//Now try to apply the voiding JE to the Credit Memo
					var applyResult = applyCreditMemoToVoidingJE(creditMemoID, creditMemoVoidResult);
					voidActivity += applyResult.voidActivity;
					success = applyResult.success;
				}
			}
			return {
				success: success,
				voidActivity: voidActivity,
				creditMemoVoidingJE: creditMemoVoidResult.creditMemoVoidingJE,
				custRefundVoidingJE: custRefundVoidResult.custRefundVoidingJE
			};
		}

		function voidCustRefund(vtRecID, custRefundID, custRefundText) {
			var custRefundVoidingJE = null;
			var custRefundVoidingJENbr = null;
			var custRefundVoidingJEFieldValues = null;
			var errorMsg = null;
			var success = null;
			var voidActivity = '';

			var custRefundVoidResult = isCustRefundVoided(custRefundID);
			// First check to see if the Customer Refund has already been voided
			// If so, do no more
			if (custRefundVoidResult.custRefundVoided) {
				custRefundVoidingJE = custRefundVoidResult.custRefundVoidingJE;
				voidActivity += 'Customer Refund already voided. Please complete manually;<br>';
				success = false;
			} else {
				// Otherwise this Refund needs to be voided
				try {
					custRefundVoidingJE = transaction.void({
						type: record.Type.CUSTOMER_REFUND,
						id: custRefundID
					});
				} catch (e) {
					log.debug('voidCustRefund', 'e: ' + JSON.stringify(e));
					errorMsg = e.message;
					success = false;
				}
				// If custRefundVoidingJE is populated then we assume void success
				if (custRefundVoidingJE) {
					// Get the number of the journal for referencing 
					custRefundVoidingJEFieldValues = search.lookupFields({
						type: search.Type.JOURNAL_ENTRY,
						id: custRefundVoidingJE,
						columns: ['tranid']
					});
					custRefundVoidingJENbr = custRefundVoidingJEFieldValues.tranid;
					//Update the voidActivity field which will be returned
					voidActivity += 'Voided Customer Refund with Journal #' + custRefundVoidingJENbr + ';<br>';
					// Update the Voiding JE Memo field to leave reference to Customer Refund
					var jeMemo = 'Voiding ' + custRefundText;
					try {
						var id = record.submitFields({
							type: record.Type.JOURNAL_ENTRY,
							id: custRefundVoidingJE,
							values: {
								'memo': jeMemo
							}
						});
						// voidActivity += 'Updated Journal #' + custRefundVoidingJENbr + ';<br>'; //Commented out to reduce logging noise
						success = true;
					} catch (e) {
						log.debug('voidCustRefund', 'e: ' + JSON.stringify(e));
						voidActivity += 'Failed to update Journal #' + custRefundVoidingJENbr + ' with error: ' + e.message + ';<br>';
						success = false;
					}

				} else
				// If there is no Cust refund voiding Jnl then something has gone awry with the void
				// Write a final message to the log and stop void processing
				{
					voidActivity += 'Failed to void Customer Refund. Error: ' + errorMsg + ';<br>';
					success = false;
				}
			}
			return {
				success: success,
				custRefundAlreadyVoided: custRefundVoidResult.custRefundVoided,
				custRefundVoidingJE: custRefundVoidingJE,
				voidActivity: voidActivity
			};
		}

		function isCustRefundVoided(custRefundID) {
			var custRefundVoided = false;
			var voidingJEText = null;
			var custRefundVoidingJE = null;

			var filters = [];
			filters.push({
				name: 'internalid',
				operator: search.Operator.IS,
				values: custRefundID
			});
			filters.push({
				name: 'voided',
				operator: search.Operator.IS,
				values: 'T'
			});
			var columns = ['internalid', 'applyingtransaction'];
			var crSearch = search.create({
				type: search.Type.CUSTOMER_REFUND,
				title: 'Voided',
				columns: columns,
				filters: filters
			}).run();
			var searchResults = crSearch.getRange(0, 50); //I only expect a few rows to return
			if (searchResults.length > 0) {
				// Find the line with the voiding journal
				for (var i = 0; i < searchResults.length; i++) {
					voidingJEText = searchResults[i].getText({
						name: 'applyingtransaction'
					});
					if (voidingJEText.substring(0, 7) === 'Journal') {
						custRefundVoidingJE = searchResults[i].getValue({
							name: 'applyingtransaction'
						});
						break;
					}
				}
				custRefundVoided = true;
			}
			return {
				custRefundVoided: custRefundVoided,
				custRefundVoidingJE: custRefundVoidingJE
			};
		}

		function voidCreditMemo(vtRecID, creditMemoID) {
			var creditMemoVoidingJE = null;
			var creditMemoVoidingJENbr = null;
			var creditMemoVoidingJEFieldValues = null;
			var applyResults = null;
			var errorMsg = null;
			var success = null;
			var voidActivity = '';

			// First check to see if the Credit Memo has already been voided
			// If so, do no more
			var creditMemoLines = getCreditMemo(creditMemoID);

			var creditMemoVoidResult = isCreditMemoVoided(creditMemoLines);
			if (creditMemoVoidResult.creditMemoVoided) {
				creditMemoVoidingJE = creditMemoVoidResult.creditMemoVoidingJE;
				success = false;
				voidActivity += 'Credit Memo already voided. Please complete manually;<br>';
			} else {
				createCMVoidJEResult = createCreditMemoVoidingJE(creditMemoLines);
				creditMemoVoidingJE = createCMVoidJEResult.voidingJE;
				// If a Journal entry is returned then we assume success
				if (creditMemoVoidingJE) {
					// Get the number of the journal for referencing 
					creditMemoVoidingJEFieldValues = search.lookupFields({
						type: search.Type.JOURNAL_ENTRY,
						id: creditMemoVoidingJE,
						columns: ['tranid']
					});
					creditMemoVoidingJENbr = creditMemoVoidingJEFieldValues.tranid;
					voidActivity += ' Voided Credit Memo with Journal #' + creditMemoVoidingJENbr + ';<br>';
					success = true;
				} else
				// If there is no voiding Jnl then something has gone awry with the void
				// Write a final message to the log
				{
					voidActivity += ' Failed to create voiding Journal for Credit Memo. Error: ' + createCMVoidJEResult.errorMsg + ';<br>';
					success = false;
				}
			}
			return {
				success: success,
				creditMemoAlreadyVoided: creditMemoVoidResult.creditMemoVoided,
				creditMemoVoidingJE: creditMemoVoidingJE,
				creditMemoVoidingJENbr: creditMemoVoidingJENbr,
				voidActivity: voidActivity
			};
		}

		function getCreditMemo(creditMemoID) {
			var filters = [];
			filters.push({
				name: 'internalid',
				operator: search.Operator.IS,
				values: creditMemoID
			});
			var columns = ['transactionnumber', 'entity', 'custbody_acq_lot_createdfrom_exchrec', 'custbodyacq_deal_link',
				'statusref', 'class', 'department', 'appliedtotransaction', 'appliedtolinktype', 'line', 'item', 'account', 'accounttype', 'amount', 'memo',
				'currency'
			];

			var cmSearch = search.create({
				type: search.Type.CREDIT_MEMO,
				title: 'Credit Memo',
				columns: columns,
				filters: filters
			}).run();
			var searchResults = cmSearch.getRange(0, 50); //I expect an average of 3 rows to return
			return searchResults;
		}

		function isCreditMemoVoided(creditMemoLines) {
			var creditMemoVoidingJE = null;
			var txnVoided = false;
			var cmStatus = creditMemoLines[0].getValue({
				name: 'statusref'
			});
			var cmAppliedToTxnName = creditMemoLines[0].getText({
				name: 'appliedtotransaction'
			});
			var cmAppliedToTxnId = creditMemoLines[0].getValue({
				name: 'appliedtotransaction'
			});
			if (cmStatus === 'applied' && cmAppliedToTxnName.substring(0, 7) === 'Journal') {
				txnVoided = true;
				creditMemoVoidingJE = cmAppliedToTxnId;
			}
			return {
				creditMemoVoided: txnVoided,
				creditMemoVoidingJE: creditMemoVoidingJE
			};
		}

		function createCreditMemoVoidingJE(creditMemoLines) {
			log.debug('createCreditMemoVoidingJE');
			var creditMemoVoidingJE = null;
			var creditMemoVoidingJEId = null;
			var errorMsg = null;
			// Get the Transaction Number
			var cmTxnNbr = creditMemoLines[0].getValue({
				name: 'transactionnumber'
			});

			//Get Entity/Class
			var cmEntity = creditMemoLines[0].getValue({
				name: 'class'
			});

			// Get the Deal
			var cmDeal = creditMemoLines[0].getValue('custbodyacq_deal_link');

			// Get the Exchange Record
			var cmExRec = creditMemoLines[0].getValue('custbody_acq_lot_createdfrom_exchrec');

			// Get the Currency
			var cmCurrency = creditMemoLines[0].getValue('currency');

			// Create Voiding JE
			creditMemoVoidingJE = record.create({
				type: record.Type.JOURNAL_ENTRY
			});
			//Set body fields
			creditMemoVoidingJE.setValue('currency',cmCurrency);
			creditMemoVoidingJE.setValue('class',cmEntity);
			creditMemoVoidingJE.setValue('custbodyacq_deal_link',cmDeal);
			creditMemoVoidingJE.setValue('custbody_acq_lot_createdfrom_exchrec',cmExRec);
			creditMemoVoidingJE.setValue('memo','Voiding Credit Memo #' + cmTxnNbr);
			//Set line fields 
			var cmAccount = null;
			var cmAmount = 0;
			var cmLine = null;
			var cmDepartment = null;
			var cmShareholder = null;
			var cmMemo = null;
			var lineMemo = null;
			var currentJELine = 0;

			for (var i = 0; i < creditMemoLines.length; i++) {
				cmLine = Number(creditMemoLines[i].getValue('line'));
				//Set JE Line Amount
				cmAmount = Number(creditMemoLines[i].getValue('amount'));
				//Set JE Line Account
				cmAccount = creditMemoLines[i].getValue('account');

				if (currentJELine !== cmLine) {
					continue;
				}
				creditMemoVoidingJE.setSublistValue('line', 'account', currentJELine, cmAccount);

				// Line zero always seems to be the AR account
				if (cmLine === 0 || cmAmount > 0) {
					creditMemoVoidingJE.setSublistValue('line', 'debit', currentJELine, Math.abs(cmAmount));
				} else {
					creditMemoVoidingJE.setSublistValue('line', 'credit', currentJELine, Math.abs(cmAmount));
				}

				//Set JE Line Department
				cmDepartment = creditMemoLines[i].getValue({
					name: 'department'
				});

				creditMemoVoidingJE.setSublistValue('line', 'department', currentJELine, cmDepartment);

				//Set JE Line Entity/Class
				creditMemoVoidingJE.setSublistValue('line', 'class', currentJELine, cmEntity);

				// Set JE Line Entity (Shareholder)
				cmShareholder = creditMemoLines[i].getValue('entity');
				creditMemoVoidingJE.setSublistValue('line', 'entity', currentJELine, cmShareholder);

				// Set JE Line Memo
				cmMemo = creditMemoLines[i].getValue({
					name: 'memo'
				});
				if (cmLine === 0) {
					lineMemo = 'Void of Credit Memo #' + cmTxnNbr;
					creditMemoVoidingJE.setSublistValue('line', 'memo', currentJELine, lineMemo);
				} else {
					creditMemoVoidingJE.setSublistValue('line', 'memo', currentJELine, cmMemo);
				}
				currentJELine++;
			}

			try {
				creditMemoVoidingJEId = creditMemoVoidingJE.save();
			} catch (e) {
				log.debug('createCreditMemoVoidingJE', 'e: ' + JSON.stringify(e));
				errorMsg = e.message;
			}
			return {
				voidingJE: creditMemoVoidingJEId,
				errorMsg: errorMsg
			};
		}

		function applyCreditMemoToVoidingJE(creditMemoID, creditMemoVoidResult) {

			var updatedCMId = null;
			var errorMsg = null;
			var success = false;
			var voidActivity = '';

			//Load Credit Memo because you need to set a sublist value 
			// Trying dynamic because standard mode would not allow sublist update
			var cmRec = record.load({
				type: record.Type.CREDIT_MEMO,
				id: creditMemoID,
				isDynamic: true
			});

			// Get the line count for the apply sublist
			var applySublistlineCount = cmRec.getLineCount('apply');
			var applySublistApply = null;
			var applySublistInternalId = null;
			// Step through each line in the apply sublist to reveal key values
			for (var i = 0; i < applySublistlineCount; i++) {
				applySublistApply = cmRec.getSublistValue('apply', 'apply', i);
				applySublistInternalId = Number(cmRec.getSublistValue('apply', 'internalid', i));

				// If the apply sublist line is applied and NOT to the Credit Memo voiding JE 
				// then let's unapply it
				if (applySublistApply && applySublistInternalId !== creditMemoVoidResult.creditMemoVoidingJE) {
					// This is how to set a sublist value in dynamic mode
					cmRec.selectLine('apply',i);
					cmRec.setCurrentSublistValue('apply','apply',false);
					cmRec.commitLine('apply');
				}
				// If however the apply sublist line is unapplied and is the link to the Credit Memo voiding JE 
				// then let's apply it
				if (applySublistInternalId === creditMemoVoidResult.creditMemoVoidingJE) {
					if (applySublistApply) {} else {
						// This is how to set a sublist value in dynamic mode
						cmRec.selectLine('apply',i);
						cmRec.setCurrentSublistValue('apply','apply', true);
						cmRec.commitLine('apply');
					}
				}
			}
			// Now save the Credit Memo
			try {
				updatedCMId = cmRec.save();
			} catch (e) {
				log.debug('applyCreditMemoToVoidingJE - Set Sublist Value failed', 'e: ' + JSON.stringify(e));
				errorMsg = e.message;
				voidActivity += ' Failed to apply voiding Journal #' + creditMemoVoidResult.creditMemoVoidingJENbr + ' to Credit Memo #' + creditMemoID + '. Error: ' + errorMsg + ';<br>';
			}

			//Do a final check to see that the Credit Memo is Fully Applied
			var cmFieldValues = search.lookupFields({
				type: record.Type.CREDIT_MEMO,
				id: creditMemoID,
				columns: ['status', 'transactionnumber']
			});
			var cmStatus = cmFieldValues.status[0].value;
			var cmNumber = cmFieldValues.transactionnumber;

			if (updatedCMId && cmStatus === 'applied') {
				//Update the VT rec with the progress
				// voidActivity += ' Applied Voiding JE #' + creditMemoVoidResult.creditMemoVoidingJENbr + ' to Credit Memo #' + cmNumber + ';<br>'; //Commented out to reduce logging noise
				success = true;
			}
			return {
				success: success,
				updatedCMId: updatedCMId,
				voidActivity: voidActivity,
				cmStatus: cmStatus
			};
		}
			
		function processBankFee(vtFieldValues, dealBankChargeClearingAccountBalance) {
			log.debug('processBankFee');
			var voidActivity = '';
			var success = true;
			var invoiceId = null;
			var custPaymtId = null;
			var srsaReimbVendorBillId = null;
			var srsaReimbVendorPaymtId = null;
			var contraBankVendorBillId = null;
			var contraBankVendorPaymtId = null;
			var bankFeeSRSResponsibleResult = null;
			var bankFeePayeeResponsibleResult = null;

			//Get the Customer Refund for any field values needed ahead
			var custRefundID = vtFieldValues.custrecord_vt_customer_refund[0].value;
			var getCustRefundResult = getCustRefund(custRefundID);

			var responsiblePartyID = null;
			if (vtFieldValues.custrecord_vt_responsible_party.length > 0) {
				responsiblePartyID = Number(vtFieldValues.custrecord_vt_responsible_party[0].value);
			}

			switch (responsiblePartyID) {
				case respParty.Payee:
				case respParty.Counsel:
				case respParty.Buyer:
					//ATP-176
					bankFeePayeeResponsibleResult = processBankFeePayeeResponsible(vtFieldValues, getCustRefundResult.custRefundBankAccount, responsiblePartyID);
					log.debug('processBankFee', 'bankFeePayeeResponsibleResult: ' + JSON.stringify(bankFeePayeeResponsibleResult));
					voidActivity = bankFeePayeeResponsibleResult.voidActivity;
					success = bankFeePayeeResponsibleResult.success;
					invoiceId = bankFeePayeeResponsibleResult.invoiceId;
					contraBankVendorBillId = bankFeePayeeResponsibleResult.contraBankVendorBillId;
					contraBankVendorPaymtId = bankFeePayeeResponsibleResult.contraBankVendorPaymtId;
					break;
				case respParty.SRS:

					// ATP-185
					bankFeeSRSResponsibleResult = processBankFeeSRSResponsible(vtFieldValues, getCustRefundResult.custRefundBankAccount, responsiblePartyID, dealBankChargeClearingAccountBalance);
					log.debug('processBankFee', 'bankFeeSRSResponsibleResult: ' + JSON.stringify(bankFeeSRSResponsibleResult));
					voidActivity = bankFeeSRSResponsibleResult.voidActivity;
					success = bankFeeSRSResponsibleResult.success;
					invoiceId = bankFeeSRSResponsibleResult.invoiceId;
					custPaymtId = bankFeeSRSResponsibleResult.custPaymtId;
					srsaReimbVendorBillId = bankFeeSRSResponsibleResult.srsaReimbVendorBillId;
					srsaReimbVendorPaymtId = bankFeeSRSResponsibleResult.srsaReimbVendorPaymtId;
					contraBankVendorBillId = bankFeeSRSResponsibleResult.contraBankVendorBillId;
					contraBankVendorPaymtId = bankFeeSRSResponsibleResult.contraBankVendorPaymtId;
					break;
			}
			return {
				success: success,
				voidActivity: voidActivity,
				invoiceId: invoiceId,
				custPaymtId: custPaymtId,
				srsaReimbVendorBillId: srsaReimbVendorBillId,
				srsaReimbVendorPaymtId: srsaReimbVendorPaymtId,
				contraBankVendorBillId: contraBankVendorBillId,
				contraBankVendorPaymtId: contraBankVendorPaymtId
			};
		}

		function getCustRefund(custRefundID) {
			log.debug('getCustRefund');
			var custRefundBankAccount = null;

			var filters = [];
			filters.push({
				name: 'internalid',
				operator: search.Operator.IS,
				values: custRefundID
			});
			filters.push({
				name: 'accounttype',
				operator: search.Operator.IS,
				values: 'Bank'
			});
			var columns = ['internalid', 'account', 'accounttype'];
			var crSearch = search.create({
				type: search.Type.CUSTOMER_REFUND,
				title: 'CustRefund',
				columns: columns,
				filters: filters
			}).run();
			var searchResults = crSearch.getRange(0, 50); //I only expect a few rows to return
			if (searchResults.length > 0) {
				custRefundBankAccount = searchResults[0].getValue({
					name: 'account'
				});
			}

			return {
				custRefundBankAccount: custRefundBankAccount
			};
		}

		function processBankFeePayeeResponsible(vtFieldValues, custRefundBankAccount, responsiblePartyID) {
			log.debug('processBankFeePayeeResponsible');
			var voidActivity = '';
			var success = true;

			var createInvoiceResult = createInvoice(vtFieldValues, responsiblePartyID);
			log.debug('processBankFeePayeeResponsible', 'createInvoiceResult: ' + JSON.stringify(createInvoiceResult));
			voidActivity += createInvoiceResult.voidActivity;
			success = createInvoiceResult.success;
			var createContraBankVendorBillResult = null;
			var createContraBankVendorPaymtResult = null;
			// Only continue if certain the invoice has been created
			if (success) {
				//Now try to create a vendor bill
				createContraBankVendorBillResult = createContraBankVendorBill(vtFieldValues);
				log.debug('processBankFeePayeeResponsible', 'createContraBankVendorBillResult: ' + JSON.stringify(createContraBankVendorBillResult));
				voidActivity += createContraBankVendorBillResult.voidActivity;
				success = createContraBankVendorBillResult.success;
				if (success) {
					//Now try to create a vendor bill payment
					createContraBankVendorPaymtResult = createContraBankVendorPaymt(vtFieldValues, createContraBankVendorBillResult.vendorBillId, custRefundBankAccount);
					log.debug('processBankFeePayeeResponsible', 'createContraBankVendorPaymtResult: ' + JSON.stringify(createContraBankVendorPaymtResult));
					voidActivity += createContraBankVendorPaymtResult.voidActivity;
					success = createContraBankVendorPaymtResult.success;
				}
			}
			return {
				success: success,
				voidActivity: voidActivity,
				invoiceId: createInvoiceResult.invoiceId,
				contraBankVendorBillId: createContraBankVendorBillResult.vendorBillId,
				contraBankVendorPaymtId: createContraBankVendorPaymtResult.vendorPaymtId
			};
		}

		function processBankFeeSRSResponsible(vtFieldValues, custRefundBankAccount, responsiblePartyID, dealBankChargeClearingAccountBalance) {
			log.debug('processBankFeeSRSResponsible');
			var voidActivity = '';
			var success = false;
			var createCustPaymtResult = null;
			var createSRSAReimbVendorBillResult = null;
			var createSRSAReimbVendorPaymtResult = null;
			var createContraBankVendorBillResult = null;
			var createContraBankVendorPaymtResult = null;

			var createInvoiceResult = createInvoice(vtFieldValues, responsiblePartyID, dealBankChargeClearingAccountBalance);
			log.debug('bankFeeSRSResponsible', 'createInvoiceResult: ' + JSON.stringify(createInvoiceResult));
			voidActivity += createInvoiceResult.voidActivity;
			success = createInvoiceResult.success;
			// Only continue if certain the invoice has been created
			if (success) {
				// Create Customer Payment
				createCustPaymtResult = createCustPaymt(vtFieldValues, createInvoiceResult.invoiceId, custRefundBankAccount);
				log.debug('bankFeeSRSResponsible', 'createCustPaymtResult: ' + JSON.stringify(createCustPaymtResult));
				voidActivity += createCustPaymtResult.voidActivity;
				success = createCustPaymtResult.success;
				if (success) {
					//Now create SRSA reimbursement vendor bill
					createSRSAReimbVendorBillResult = createSRSAReimbVendorBill(vtFieldValues);
					log.debug('bankFeeSRSResponsible', 'createSRSAReimbVendorBillResult: ' + JSON.stringify(createSRSAReimbVendorBillResult));
					voidActivity += createSRSAReimbVendorBillResult.voidActivity;
					success = createSRSAReimbVendorBillResult.success;
					if (success) {
						//Now pay the bill
						createSRSAReimbVendorPaymtResult = createSRSAReimbVendorPaymt(vtFieldValues, createSRSAReimbVendorBillResult.vendorBillId, createSRSAReimbVendorBillResult.vendorId);
						log.debug('bankFeeSRSResponsible', 'createSRSAReimbVendorPaymtResult: ' + JSON.stringify(createSRSAReimbVendorPaymtResult));
						voidActivity += createSRSAReimbVendorPaymtResult.voidActivity;
						success = createSRSAReimbVendorPaymtResult.success;
						if (success) {
							//Now create contra bank vendor bill
							createContraBankVendorBillResult = createContraBankVendorBill(vtFieldValues);
							log.debug('bankFeeSRSResponsible', 'createContraBankVendorBillResult: ' + JSON.stringify(createContraBankVendorBillResult));
							voidActivity += createContraBankVendorBillResult.voidActivity;
							success = createContraBankVendorBillResult.success;
							if (success) {
								//Now pay that bill
								createContraBankVendorPaymtResult = createContraBankVendorPaymt(vtFieldValues, createContraBankVendorBillResult.vendorBillId, custRefundBankAccount);
								log.debug('bankFeeSRSResponsible', 'createContraBankVendorPaymtResult: ' + JSON.stringify(createContraBankVendorPaymtResult));
								voidActivity += createContraBankVendorPaymtResult.voidActivity;
								success = createContraBankVendorPaymtResult.success;
							}
						}
					}
				}
			}
			log.debug('bankFeeSRSResponsible', 'voidActivity: ' + JSON.stringify(voidActivity));
			return {
				success: success,
				voidActivity: voidActivity,
				invoiceId: createInvoiceResult.invoiceId,
				custPaymtId: createCustPaymtResult.custPaymtId,
				srsaReimbVendorBillId: createSRSAReimbVendorBillResult.vendorBillId,
				srsaReimbVendorPaymtId: createSRSAReimbVendorPaymtResult.vendorPaymtId,
				contraBankVendorBillId: createContraBankVendorBillResult.vendorBillId,
				contraBankVendorPaymtId: createContraBankVendorPaymtResult.vendorPaymtId
			};
		}

		function createInvoice(vtFieldValues, responsiblePartyID, dealBankChargeClearingAccountBalance) {
			log.debug('createInvoice');
			var voidActivity = '';
			var success = false;
			var invoiceId = null;

			var shareholderId = Number(vtFieldValues.custrecord_vt_shareholder[0].value);
			var dealId = Number(vtFieldValues.custrecord_vt_deal[0].value);
			var exRecId = Number(vtFieldValues.custrecord_vt_exchange_record[0].value);
			var vtId = Number(vtFieldValues.id);
			var bankFeeAmount = Number(vtFieldValues['custrecord_vt_bank_fee_amount']);
			var creditMemoID = vtFieldValues.custrecord_vt_credit_memo[0].value;
			var srsPaymtFeeAmount = Number(vtFieldValues['custrecord_vt_bank_fee_amount']);

			// var dealBankChargeClearingAccountBalance = getDealBankChargeClearingAccountBalance(dealId);
			// log.debug('createInvoice', 'dealBankChargeClearingAccountBalance: ' + JSON.stringify(dealBankChargeClearingAccountBalance));
			var srsPaymtFeeLines = getSRSPaymtFeeLines(creditMemoID);
			log.debug('createInvoice', 'srsPaymtFeeLines: ' + JSON.stringify(srsPaymtFeeLines));

			if (responsiblePartyID === respParty.Payee) {
				customerId = shareholderId;
			} else {
				customerId = dealId;
			}

			// Create invoice
			var invoice = record.create({
				type: record.Type.INVOICE,
				isDynamic: true
			});

			//Set body fields
			invoice.setValue('customform',transactionConstant.customformAcquiomInvoice);
			invoice.setValue('entity',customerId);
			invoice.setValue('class', transactionConstant.classClientAccountsAcquiom);
			invoice.setValue('department', transactionConstant.departmentClientAccountsAcquiom);
			invoice.setValue('custbodyacq_deal_link',dealId);
			invoice.setValue('custbody_acq_lot_createdfrom_exchrec',exRecId);
			invoice.setValue('memo','Returned Payment Bank Fee. See Void Tracking # ' + vtId);

			//Set item line fields 
			invoice.selectNewLine('item');
			invoice.setCurrentSublistValue('item', 'item', transactionConstant.itemBankFeeReimbursement);
			invoice.setCurrentSublistValue('item', 'quantity', 1);
			invoice.setCurrentSublistValue('item', 'amount', bankFeeAmount);
			invoice.setCurrentSublistValue('item', 'department', transactionConstant.departmentClientAccountsAcquiom);
			invoice.commitLine('item');

			var pfItem = null;
			var pfAmount = null;

			// Add Shareholder Charges from the voided Credit Memo to the invoice if: 
			// a) Payee Responsible or 
			// b) SRS Responsible and the balance of the Deal Bank Service Charge Clearing Account is less than the Shareholder Charges from the voided Credit Memo

			if (responsiblePartyID === respParty.Payee) {
				addShareholderCharges(invoice, srsPaymtFeeLines);
			} else {
				if (dealBankChargeClearingAccountBalance < srsPaymtFeeAmount) {
					addShareholderCharges(invoice, srsPaymtFeeLines);
				}
			}

			try {
				invoiceId = invoice.save();
				voidActivity += 'Created Invoice #' + invoiceId + ' for reimbursement of bank fee' + ';<br>';
				success = true;
			} catch (e) {
				log.debug('createInvoice', 'e: ' + JSON.stringify(e));
				voidActivity += 'Failed to create Invoice for reimbursement of bank fee. Error: ' + e.message + ';<br>';
			}

			return {
				success: success,
				invoiceId: invoiceId,
				voidActivity: voidActivity
			};
		}

		function addShareholderCharges(invoice, srsPaymtFeeLines) {
			var pfItem = null;
			var pfAmount = 0;
			for (var i = 0; i < srsPaymtFeeLines.length; i++) {
				invoice.selectNewLine('item');
				pfItem = srsPaymtFeeLines[i].getValue({
					name: 'item'
				});
				pfAmount = Number(srsPaymtFeeLines[i].getValue({
					name: 'amount'
				}));
				invoice.setCurrentSublistValue('item', 'item', pfItem);
				invoice.setCurrentSublistValue('item', 'quantity', 1);
				invoice.setCurrentSublistValue('item', 'amount', pfAmount);
				invoice.setCurrentSublistValue('item', 'department', transactionConstant.departmentClientAccountsAcquiom);
				invoice.commitLine('item');
			}
		}

		function createCustPaymt(vtFieldValues, invoiceId, custRefundBankAccount) {
			log.debug('createCustPaymt', 'custRefundBankAccount: ' + JSON.stringify(custRefundBankAccount));
			var voidActivity = '';
			var success = false;
			var custPaymtId = null;
			var vtId = Number(vtFieldValues.id);
			var dealId = Number(vtFieldValues.custrecord_vt_deal[0].value);
			var exRecId = Number(vtFieldValues.custrecord_vt_exchange_record[0].value);

			var custPaymt = record.transform({
				fromType: record.Type.INVOICE,
				fromId: invoiceId,
				toType: record.Type.CUSTOMER_PAYMENT,
				isDynamic: true
			});

			custPaymt.setValue('custbodyacq_deal_link',dealId);
			custPaymt.setValue('class',transactionConstant.classClientAccountsAcquiom);
			custPaymt.setValue('department',transactionConstant.departmentClientAccountsAcquiom);
			custPaymt.setValue('memo','Returned Payment Bank Fee. See Void Tracking # ' + vtId);
			try {
				custPaymtId = custPaymt.save();
				voidActivity += 'Created Customer Payment #' + custPaymtId + ';<br>';
				success = true;
			} catch (e) {
				log.debug('createCustPaymt', 'e: ' + JSON.stringify(e));
				voidActivity += 'Failed to create Customer Payment for reimbursement of bank fee. Error: ' + e.message + ';<br>';
			}
			try {
				var id = record.submitFields({
					type: record.Type.CUSTOMER_PAYMENT,
					id: custPaymtId,
					values: {
						'account': custRefundBankAccount
					}
				});
				// voidActivity += 'Updated Customer Payment #' + custPaymtId + ';<br>'; //Commented out to reduce logging noise
				success = true;
			} catch (e) {
				log.debug('createCustPaymt', 'e: ' + JSON.stringify(e));
				voidActivity += 'Failed to update Customer Payment #' + custPaymtId + ' with account number ' + custRefundBankAccount + '. Error: ' + e.message + ';<br>';
				success = false;
			}
			return {
				success: success,
				custPaymtId: custPaymtId,
				voidActivity: voidActivity
			};
		}

		function createSRSAReimbVendorBill(vtFieldValues) {
			var funcName = scriptName + '-->createSRSAReimbVendorBill';
			log.debug('funcName', 'vtFieldValues: ' + JSON.stringify(vtFieldValues));

			var voidActivity = '';

			var dealId = Number(vtFieldValues.custrecord_vt_deal[0].value);
			var dealPayingBankAccount = Number(vtFieldValues['custrecord_vt_deal.custentity_acq_deal_financial_bank_accou']);
			log.debug('createSRSAReimbVendorBill', 'dealPayingBankAccount: ' + JSON.stringify(dealPayingBankAccount));
			var exRecId = Number(vtFieldValues.custrecord_vt_exchange_record[0].value);
			var vtId = Number(vtFieldValues.id);
			var bankFeeAmount = Number(vtFieldValues['custrecord_vt_bank_fee_amount']);

			var	vendorId = transactionConstant.vendorAcquiomClearinghouse;
			var	classEntity = transactionConstant.classAcquiomClearinghouse;

			var tranid = 'SRSA Reimbursement ' + exRecId;
			var createVendorBillresult = createVendorBill(vtId, bankFeeAmount, vendorId, exRecId, dealId,
				transactionConstant.expenseCategoryAcqClearinghouseFeeReimbursement, tranid, transactionConstant.apAccountTradeAdjustments,
				transactionConstant.departmentAcquiomOperations, classEntity);

			if (createVendorBillresult.success) {
				voidActivity = 'Created SRSA Reimbursement Vendor Bill #' + createVendorBillresult.vendorBillId + ';<br>';
			} else {
				voidActivity = createVendorBillresult.voidActivity;
			}
			return {
				success: createVendorBillresult.success,
				vendorBillId: createVendorBillresult.vendorBillId,
				voidActivity: voidActivity,
				vendorId: vendorId
			};
		}

		function createContraBankVendorBill(vtFieldValues) {
			log.debug('createContraBankVendorBill');

			var voidActivity = '';
			var dealId = Number(vtFieldValues.custrecord_vt_deal[0].value);
			var exRecId = Number(vtFieldValues.custrecord_vt_exchange_record[0].value);
			var vtId = Number(vtFieldValues.id);
			var bankFeeAmount = Number(vtFieldValues['custrecord_vt_bank_fee_amount']);
			var tranid = 'Contra Bank Fee ' + exRecId;
			var createVendorBillresult = createVendorBill(vtId, bankFeeAmount, transactionConstant.vendorContraBank,
				exRecId, dealId, transactionConstant.expenseCategoryFeeChargedByBank, tranid, transactionConstant.apAccountAcquiom1,
				transactionConstant.departmentClientAccountsAcquiom, transactionConstant.classClientAccountsAcquiom);

			if (createVendorBillresult.success) {
				voidActivity = 'Created Contra Bank Vendor Bill #' + createVendorBillresult.vendorBillId + ';<br>';
			} else {
				voidActivity = createVendorBillresult.voidActivity;
			}
			return {
				success: createVendorBillresult.success,
				vendorBillId: createVendorBillresult.vendorBillId,
				voidActivity: voidActivity
			};
		}

		function createVendorBill(vtId, bankFeeAmount, vendorId, exRecId, dealId, expenseCategory, tranid, apAccount, department, classEntity) {
			var funcName = scriptName + '-->createVendorBill';
			log.debug(funcName, 'department1: ' + JSON.stringify(department));

			var voidActivity = '';
			var success = false;
			var vendorBillId = null;
			var memo = 'Returned Payment Bank Fee. See Void Tracking # ' + vtId;

			// Create vendor bill
			var vendorBill = record.create({
				type: record.Type.VENDOR_BILL,
				isDynamic: true
			});

			//Set body fields
			vendorBill.setValue('customform',transactionConstant.customformAcquiomVendorBill);
			vendorBill.setValue('entity',vendorId);
			if (apAccount) {
				vendorBill.setValue('account',apAccount);
			}
			if (classEntity) {
				vendorBill.setValue('class',classEntity);
			}
			if (department) {
				vendorBill.setValue('department',department);
			}
			vendorBill.setValue('custbodyacq_deal_link',dealId);
			vendorBill.setValue('custbody_acq_lot_createdfrom_exchrec',exRecId);
			vendorBill.setValue('memo',memo);
			vendorBill.setValue('approvalstatus',nativeBillApprovalSts.Approved);
			vendorBill.setValue('tranid',tranid);

			//Set expense line fields 
			vendorBill.selectNewLine('expense');
			vendorBill.setCurrentSublistValue('expense', 'category', expenseCategory);
			vendorBill.setCurrentSublistValue('expense', 'quantity', 1);
			vendorBill.setCurrentSublistValue('expense', 'amount', bankFeeAmount);
			vendorBill.setCurrentSublistValue('expense', 'department', department);	
			vendorBill.setCurrentSublistValue('expense', 'customer', dealId);
			vendorBill.setCurrentSublistValue('expense', 'memo', memo);
			vendorBill.commitLine('expense');

			try {
				vendorBillId = vendorBill.save();
				// voidActivity += 'Created Vendor Bill #' + vendorBillId + ' for reimbursement of bank fee' + ';<br>';
				success = true;
			} catch (e) {
				log.debug('createVendorBill', 'e: ' + JSON.stringify(e));
				voidActivity += 'Failed to create Vendor Bill for reimbursement of bank fee. Error: ' + e.message + ';<br>';
			}

			return {
				success: success,
				vendorBillId: vendorBillId,
				voidActivity: voidActivity
			};
		}

		function createSRSAReimbVendorPaymt(vtFieldValues, vendorBillId, vendorId) {
			log.debug('createSRSAReimbVendorPaymt');
			var voidActivity = '';
			
			var dealId = Number(vtFieldValues.custrecord_vt_deal[0].value);
			var exRecId = Number(vtFieldValues.custrecord_vt_exchange_record[0].value);
			var	bankAccount = transactionConstant.bankAccountAcqClearinghouseVectraOperating;
			var	classEntity = transactionConstant.classAcquiomClearinghouse;
			
			var payVendorBillResult = payVendorBill(vendorBillId, bankAccount, exRecId, dealId, transactionConstant.departmentAcquiomOperations, classEntity);
			if (payVendorBillResult.success) {
				voidActivity = 'Created SRSA Reimbursement Vendor Payment #' + payVendorBillResult.vendorPaymtId + ';<br>';
			} else {
				voidActivity = payVendorBillResult.voidActivity;
			}
			return {
				success: payVendorBillResult.success,
				voidActivity: voidActivity,
				vendorPaymtId: payVendorBillResult.vendorPaymtId
			};
		}

		function createContraBankVendorPaymt(vtFieldValues, vendorBillId, custRefundBankAccount) {
			log.debug('createContraBankVendorPaymt');
			var voidActivity = '';

			var dealId = Number(vtFieldValues.custrecord_vt_deal[0].value);
			var exRecId = Number(vtFieldValues.custrecord_vt_exchange_record[0].value);

			var payVendorBillResult = payVendorBill(vendorBillId, custRefundBankAccount, exRecId, dealId, 
				transactionConstant.departmentClientAccountsAcquiom, transactionConstant.classClientAccountsAcquiom);
			if (payVendorBillResult.success) {
				voidActivity = 'Created Contra Bank Vendor Payment #' + payVendorBillResult.vendorPaymtId + ';<br>';
			} else {
				voidActivity = payVendorBillResult.voidActivity;
			}
			return {
				success: payVendorBillResult.success,
				voidActivity: voidActivity,
				vendorPaymtId: payVendorBillResult.vendorPaymtId
			};
		}

		function payVendorBill(vendorBillId, bankAccount, exRecId, dealId, department, classEntity) {
			log.debug('payVendorBill');
			var vendorPaymtId = null;
			var voidActivity = '';
			var success = false;

			var vendorPaymt = record.transform({
				fromType: record.Type.VENDOR_BILL,
				fromId: vendorBillId,
				toType: record.Type.VENDOR_PAYMENT,
				isDynamic: true
			});
			vendorPaymt.setValue('account',bankAccount);
			vendorPaymt.setValue('class',classEntity);
			vendorPaymt.setValue('department',department);
			vendorPaymt.setValue('custbody_acq_lot_createdfrom_exchrec',exRecId);
			vendorPaymt.setValue('custbodyacq_deal_link',dealId);
			// If Vendor has been set up with ACH Processing then this box will get checked by default
			// That triggers a "native" Netsuite ACH payment (via Coastal Software) instead of generating a Check number
			// We don't want that  
			vendorPaymt.setValue('toach', false);
			try {
				vendorPaymtId = vendorPaymt.save();
				log.debug('payVendorBill', 'vendorPaymtId: ' + JSON.stringify(vendorPaymtId));
				// voidActivity += 'Created Vendor Payment #' + vendorPaymtId + ' for reimbursement of bank fee' + ';<br>';
				success = true;
			} catch (e) {
				log.debug('payVendorBill', 'e: ' + JSON.stringify(e));
				voidActivity += 'Failed to create Vendor Payment for reimbursement of bank fee. Error: ' + e.message + ';<br>';
			}
			return {
				success: success,
				voidActivity: voidActivity,
				vendorPaymtId: vendorPaymtId
			};
		}

		function holdPaymentInstruction(vtFieldValues) {
			log.debug('holdPaymentInstruction');
			var success = false;
			var createPIHoldResult = null;
			var holdId = null;
			var caseId = null;
			var relatedPI = null;
			var voidActivity = '';

			// ATP-191: this takes ~2-2.5 seconds
			var exRecId = vtFieldValues.custrecord_vt_exchange_record[0].value;
			log.debug('holdPaymentInstruction', 'exRecId: ' + exRecId);
			if (vtFieldValues.custrecord_vt_case.length > 0) {
				caseId = vtFieldValues.custrecord_vt_case[0].value;
			}
			log.debug('holdPaymentInstruction', 'caseId: ' + caseId);
			var exRecFieldValues = search.lookupFields({ // 0.3-0.4 seconds
				type: 'customrecord_acq_lot',
				id: exRecId,
				columns: ['custrecord_exrec_paymt_instr_hist', 'custrecord_exrec_paymt_instr_hist.custrecord_pihs_paymt_instr']
			});
			log.debug('holdPaymentInstruction', 'exRecFieldValues: ' + JSON.stringify(exRecFieldValues));
			if (exRecFieldValues.custrecord_exrec_paymt_instr_hist.length > 0) {
				relatedPI = exRecFieldValues['custrecord_exrec_paymt_instr_hist.custrecord_pihs_paymt_instr'][0].value;
			}
			log.debug('holdPaymentInstruction', 'relatedPI: ' + relatedPI);
			if (relatedPI) {
				createPIHoldResult = alphaLib.createPIHold(relatedPI, caseId, paymtInstrHoldReason.PaymentReturned);
				voidActivity += createPIHoldResult.message;
				success = createPIHoldResult.success;
				holdId = createPIHoldResult.holdId;
			} else {
				success = true;
			}

			return {
				success: success,
				holdId: holdId,
				voidActivity: voidActivity
			};
		}

		function updateExchangeRecord(vtRecID, exRecId, voidReviewNotes) {
			var updatedExrecId = null;
			var errorMsg = null;
			var success = false;
			var voidActivity = '';
			var updatedReviewMessage = 'Voided Payment on ' + getCurrentDateAsString();

			if (voidReviewNotes) {
				updatedReviewMessage += ' - ' + voidReviewNotes;
			}
			updatedReviewMessage += '; ';

			try {
				updatedExrecId = record.submitFields({
					type: 'customrecord_acq_lot',
					id: exRecId,
					values: {
						custrecord_acq_loth_related_trans: '',
						custrecord_acq_loth_related_refund: '',
						custrecord_acq_loth_reviewcomplete: 'F',
						custrecord_acq_loth_zzz_zzz_acqstatus: vtListLib.exRecUpdate.acquiomStatus,
						custrecord_acq_loth_zzz_zzz_shrhldstat: vtListLib.exRecUpdate.shareholderStatus,
						custrecord_acq_loth_0_de1_notes: updatedReviewMessage,
						custrecord_acq_pay_approve_date: ''
					}
				});
			} catch (e) {
				log.error(e.name, e.message + ' // ' + e.stack);
				errorMsg = e.message;
			}
			if (updatedExrecId) {
				//Update the VT rec Void Activity
				voidActivity += ' Updated Exchange Record #' + updatedExrecId + ';<br>';
				success = true;
			} else
			// If there is no Cust refund voiding Jnl then something has gone awry with the void
			// Write a final message to the log and stop void processing
			{
				voidActivity += ' Failed to update Exchange record. Error: ' + errorMsg + ';<br>';
			}
			return {
				success: success,
				updatedExrecId: updatedExrecId,
				voidActivity: voidActivity
			};
		}

		function validateVoidPayment(vtFieldValues) {
			var funcName = scriptName + '-->validateVoidPayment';
			log.debug(funcName,'vtFieldValues: ' + JSON.stringify(vtFieldValues));
			var vtRecValid = true;
			var vtValidationErrors = '';

			// Set up variables for the field values you need to validate
			var bankFeeAmount = Number(vtFieldValues['custrecord_vt_bank_fee_amount']);
			var responsibleParty = vtFieldValues.custrecord_vt_responsible_party;
			var responsiblePartyID = null;
			if (responsibleParty.length > 0) {
				responsiblePartyID = Number(vtFieldValues.custrecord_vt_responsible_party[0].value);
			}
			var bankReturnAmount = Number(vtFieldValues.custrecord_vt_bank_return_amount);
			var returnReason = vtFieldValues.custrecord_vt_return_reason;
			var returnReasonId = null;
			if (returnReason.length > 0) {
				returnReasonId = Number(vtFieldValues.custrecord_vt_return_reason[0].value);
			}

			// Now perform validation
			// Check that user permissions are sufficient to complete the void
			var hasAccess = toolsLibClient.checkPermission(objPermissionList);
			log.debug(funcName, 'hasAccess: ' + hasAccess);
			vtRecValid = hasAccess;
			if (!hasAccess)  { vtValidationErrors = 'User does not have sufficient permission to complete this request'; }
			

			// If Bank Fee Amount is > $0.00, then Responsible Party is required
			if (bankFeeAmount > 0) {
				if (!responsiblePartyID) {
					vtRecValid = false;
					vtValidationErrors += 'If Bank Fee Amount is > $0.00, then Responsible Party is required;<br>';
				}
			} else
				// If Bank Fee Amount is negative - prohibit
				if (bankFeeAmount < 0) {
					vtRecValid = false;
					vtValidationErrors += 'Bank Fee Amount may not be negative;<br>';
				}
			// Returned Payment Amount is required and must be positive
			if (bankReturnAmount) {
				if (bankReturnAmount === 0 || bankReturnAmount < 0) {
					vtRecValid = false;
					vtValidationErrors += 'Bank Return Amount must be positive;<br>';
				}
			} else {
				vtRecValid = false;
				vtValidationErrors += 'Bank Return Amount is required;<br>';
			}
			// Return reason is mandatory
			if (!returnReasonId) {
				vtRecValid = false;
				vtValidationErrors += 'Return Reason is required;<br>';
			}
			
			if (vtFieldValues.custrecord_vt_fx_curr_contract.length > 0) {
				var rcdId = vtFieldValues.custrecord_vt_exchange_record[0].value;
				var objExchangeRecordFields = search.lookupFields({type:"customrecord_acq_lot" ,id:rcdId 
		            ,columns: ["custrecord_exrec_shrhldr_settle_curr"
		            	      ,"CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"
		                      ]});
				
				var settleCurrency = 0;
				var refundCurrency = 0;
				if (objExchangeRecordFields["custrecord_exrec_shrhldr_settle_curr"].length>0)        { settleCurrency = objExchangeRecordFields["custrecord_exrec_shrhldr_settle_curr"][0].value; }
				if (objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"].length>0) { refundCurrency = objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency"][0].value; }
				
				if ( settleCurrency != refundCurrency ) {
					if ( !(vtFieldValues.custrecord_vt_bank_ref_nbr >"") ) {
						vtRecValid = false;
						vtValidationErrors += 'Bank Reference Number is required;<br>';
					}
				}
			}

			// Set up an object to return any interesting info to the calling function
			var vtValidationResponse = ({
				vtRecValid: vtRecValid,
				vtValidationErrors: vtValidationErrors,
				bankFeeAmount: bankFeeAmount
			});
			
			return vtValidationResponse;
		}

		return {
			getExistingVTRec: getExistingVTRec,
			getRefundAmount: getRefundAmount,
			getSRSPaymtFeeAmount: getSRSPaymtFeeAmount,
			getSRSPaymtFeeLines: getSRSPaymtFeeLines,
			calcBankFeeAmount: calcBankFeeAmount,
			getAllCustomFields: getAllCustomFields,
			getCompletedStatusEditableFields: getCompletedStatusEditableFields,
			getCurrentDateTime: getCurrentDateTime,
			getCurrentDateAsString: getCurrentDateAsString
			,processVoidPayment: processVoidPayment
			,processVoidPaymentFCCPayment: processVoidPaymentFCCPayment
			,validateVoidPayment: validateVoidPayment
		};
	});