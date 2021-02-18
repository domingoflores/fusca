/**
 * toolsLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities 
 * 
 *
 * Version    Date            Author           Remarks
 *	1.0		  				  Ken Crossman	   Meant to be a receptacle for useful scripting tools/functions/utilities in the Certificate area
 */
define(['N/search', 'N/runtime'],

	function(search, runtime) {
		var constant = {
			taxRptStatus: {                Empty: 0  //Tax Reporting Status
				           ,NotSrsResponsibility: 1
				           			  ,Generated: 2
				        				   ,Sent: 3
				        				  ,Filed: 4
				        			  ,Corrected: 5
					        			,Pending: 6
					         ,TaxFormNotRequired: 7
				        			    ,Omitted: 8
					        		   ,Reviewed: 9
					       			  ,Escheated: 10
			     			  ,FiledPriorTaxYear: 11
			              }, 
			taxRptMethod: {             trm1042S: 13  //1042-S
				          },
			exchangeRecordStatus: { approvedForPayment:5
				              ,paymentProcessingQueued:15
				                    ,paymentProcessing:16
				                  },
			userRole: {               opsManager:'customrole1025'
	                              ,administrator:'administrator'
			                ,customAdministrator:'customrole1150'
	                       ,restletAdministrator:'customrole_restlet_administrator'
				      },
			certFields: [
				 'custrecord_acq_lotce_zzz_zzz_parentlot'
				,'custrecord_lot_cert_deal'
				,'custrecord_lot_cert_shareholder'
				,'custrecord_acq_lotce_aes_earnings_code'
				,'custrecord_acq_lotce_zzz_zzz_grossamount'
				,'custrecord_acq_lotce_zzz_zzz_payment'
				,'custrecord_acq_lotce_zzz_zzz_currencytyp'
				,'custrecord_acq_lotce_zzz_zzz_taxwithheld' 
			           ],
			taxFields: [
				 'custrecord_act_lotce_tax_report_amount'
				,'custrecord_act_lotce_tax_report_method'
				,'custrecord_lotce_tax_rpt_box_nbr'
				,'custrecord_acq_lotce_taxreporting_party'
				,'custrecord_acq_tax_delivery'
				,'custrecord_inc_detailed_tax_report'
				,'custrecord_acq_lotce_covered_security'
				,'custrecord_source_of_income'
				,'custrecord_lotce_type_of_proceeds'
			           ],
			form1042SFields: [
				 'custrecord_cert_1042s_ic_descr'
				,'custrecord_cert_1042s_tax_rate_ch3'
				,'custrecord_cert_1042s_tax_rate_ch4'
				,'custrecord_cert_1042s_chapter'
			                 ],
			incCodeDescrFields: ['custrecord_cert_1042s_ic_descr'],
			taxRateFields: [
				 'custrecord_cert_1042s_tax_rate_ch3'
				,'custrecord_cert_1042s_tax_rate_ch4'
			               ],
			exCodeFields: [
				 'custrecord_cert_1042s_ex_code_ch3'
				,'custrecord_cert_1042s_ex_code_ch4'
			              ],
			exCodeDescrFields: [
				 'custrecord_cert_1042s_ec_ch3_descr'
				,'custrecord_cert_1042s_ec_ch4_descr'
			              ]
		   ,form1042sCodeFields: ['custrecord_cert_1042s_income_code' ]
	       ,all1042sFields: ['custrecord_cert_1042s_ic_descr'
	    	   			    ,'custrecord_cert_1042s_tax_rate_ch3'
	    	   			    ,'custrecord_cert_1042s_tax_rate_ch4'
	    	   			    ,'custrecord_cert_1042s_ex_code_ch3'
	    	   			    ,'custrecord_cert_1042s_ex_code_ch4'
	    	   			    ,'custrecord_cert_1042s_ec_ch3_descr'
	    	   			    ,'custrecord_cert_1042s_ec_ch4_descr'
	                        ]
				,taxYearFiled: ['custrecord_lot_cert_taxfiled_year']
				,fieldsToSkip: []
		};

		//======================================================================================================================================
		//======================================================================================================================================
		function getExchangeRecordFields(exRecID) {
			var exchangeRecordFields = {	       acquiomStatus:null
                                            ,priorityPaymentType:-1
                                               ,derApprovedToPay:null
                                                           ,deal:null
                                                    ,shareholder:null
                                            ,certFieldsAreLocked:false
                                        };
			if (exRecID) {
				var erFieldValues = search.lookupFields({ type:'customrecord_acq_lot',
					                                        id:exRecID,
					                                   columns:['custrecord_acq_lot_payment_import_record.custrecord_pay_import_approved_pay'
						                                       ,'custrecord_acq_lot_priority_payment'
						                                       ,'custrecord_acq_loth_zzz_zzz_acqstatus'
						                                       ,'custrecord_acq_loth_zzz_zzz_deal'
						                                       ,'custrecord_acq_loth_zzz_zzz_shareholder'
						                                       ]
				                                        });
				log.debug('getExchangeRecordFields', 'erFieldValues: ' + JSON.stringify(erFieldValues));
				exchangeRecordFields.derApprovedToPay  = erFieldValues['custrecord_acq_lot_payment_import_record.custrecord_pay_import_approved_pay'];
				exchangeRecordFields.acquiomStatus     = erFieldValues.custrecord_acq_loth_zzz_zzz_acqstatus[0].value;
				exchangeRecordFields.deal              = erFieldValues.custrecord_acq_loth_zzz_zzz_deal[0].value;
				exchangeRecordFields.shareholder       = erFieldValues.custrecord_acq_loth_zzz_zzz_shareholder[0].value;
				if (erFieldValues.custrecord_acq_lot_priority_payment[0]) { exchangeRecordFields.priorityPaymentType = erFieldValues.custrecord_acq_lot_priority_payment[0].value; }
			
				if (   exchangeRecordFields.acquiomStatus == constant.exchangeRecordStatus.approvedForPayment
					|| exchangeRecordFields.acquiomStatus == constant.exchangeRecordStatus.paymentProcessingQueued
					|| exchangeRecordFields.acquiomStatus == constant.exchangeRecordStatus.paymentProcessing
					|| exchangeRecordFields.derApprovedToPay
				   ) { exchangeRecordFields.certFieldsAreLocked = true; }

			}
			return exchangeRecordFields;
		}

		
		//======================================================================================================================================
		//======================================================================================================================================
		function validateExemptCodeFields(clientServer, context) {
			var fieldLabel = '';
			var success = true;
			var message = '';
			var taxRate = null;
			var exemptCode = null;
			var recordObj = null;
			if (clientServer === 'Client') { recordObj = context.currentRecord; } 
			else    					   { recordObj = context.newRecord;	    }

			for (var i = 0; i < constant.taxRateFields.length; i++) {
				taxRate = getFieldValue(clientServer, context, constant.taxRateFields[i]).toString();
				if ( taxRate > "" ) { 
					exemptCode      = getFieldValue(clientServer, context, constant.exCodeFields[i]);
					exemptCodeDescr = getFieldValue(clientServer, context, constant.exCodeDescrFields[i]);
					if (taxRate == 0 && !(exemptCode > '' && exemptCodeDescr > '') ) {
						fieldLabel = recordObj.getField({ fieldId:constant.taxRateFields[i] }).label;
						message += 'Tax Rate field ' + fieldLabel + ' = zero therefore an Exemption Code is required;<br>';
						success = false;
					}
					if (taxRate != 0 && (exemptCode > '' || exemptCodeDescr > '') ) {
						fieldLabel = recordObj.getField({ fieldId:constant.taxRateFields[i] }).label;
						message += 'Tax Rate field ' + fieldLabel + ' is non-zero therefore Exemption Code must be empty;<br>';
						success = false;
					}
				}
			}

			return {
				success: success,
				message: message
			};
		}

		
		//======================================================================================================================================
		//======================================================================================================================================
		function getFieldValue(clientServer, context, fieldId) {
			var fieldValue = null;
			var newRecFields = null;
			var fieldPos = null;

			if (clientServer === 'Client') {
				fieldValue = context.currentRecord.getValue(fieldId);
			} else {
				newRecFields = context.newRecord.getFields();
				fieldValue = context.newRecord.getValue(fieldId);
				if (context.type === 'xedit') {
					fieldPos = newRecFields.indexOf(fieldId);
					if (fieldPos === -1) {
						fieldValue = context.oldRecord.getValue(fieldId);
					}
				}
			}

			return fieldValue;
		}

		
		//======================================================================================================================================
		//======================================================================================================================================
		return {
			                 constant:  constant
			,validateExemptCodeFields:  validateExemptCodeFields
			           ,getFieldValue:  getFieldValue
			 ,getExchangeRecordFields:  getExchangeRecordFields
		};
	});