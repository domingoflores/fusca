	/**
	 *@NApiVersion 2.x
	 *@NScriptType ClientScript
	 */

	define(['N/runtime', 'N/ui/message', 'N/ui/dialog' ,'N/currentRecord' ,'N/record' ,'N/url' ,'N/https'  
		   ,'/SuiteScripts/Pristine/libraries/lotCertificateLibrary.js'
	       ,'/.bundle/132118/PRI_AS_Engine'
		   ],

		function(runtime, message, dialog ,currentRecord ,record ,url ,https ,certLib ,appSettings) {
		    var mode;
			var objUser = runtime.getCurrentUser();
			var userRoleId = objUser.roleId;
			var userRole = certLib.constant.userRole;
			var taxRateCh3 = null;
			var taxRateCh4 = null;
			var taxFields = certLib.constant.taxFields;
			var form1042SFields = certLib.constant.form1042SFields;
			var taxRateFields = certLib.constant.taxRateFields;
			var exCodeFields = certLib.constant.exCodeFields;
			var exCodeDescrFields = certLib.constant.exCodeDescrFields;
			var form1042sCodeFields = certLib.constant.form1042sCodeFields;
			var incCodeDescrFields = certLib.constant.incCodeDescrFields;
			var taxRptMethod = certLib.constant.taxRptMethod;
			var taxRptStatus = certLib.constant.taxRptStatus;
			var taxYearFiled = certLib.constant.taxYearFiled;
			var initTaxRptStatus = null;
			var taxAnalystFuntionalityAccess = false;

			
			var exchangeRecordFields;
			
			//======================================================================================================================================
			//======================================================================================================================================
			function evaluateTaxAnalystFuntionalityAccess() {
				arrTaxAnalystGroupMembers = JSON.parse( appSettings.readAppSetting("Lot Certificate", "Tax Analyst group members") );
				taxAnalystFuntionalityAccess = (userRoleId === userRole.administrator && runtime.envType == "SANDBOX");
				if (arrTaxAnalystGroupMembers.indexOf(objUser.name) > -1) {taxAnalystFuntionalityAccess = true;}
			}

			
			//======================================================================================================================
			//======================================================================================================================
			function pageInit(context) {
				initTaxRptStatus = context.currentRecord.getValue({ fieldId: 'custrecord_acq_lotce_taxreporting_status' });
//				console.log('pageInit', 'initTaxRptStatus: ' + initTaxRptStatus);
				console.log("started " );
				
				//alert("context:" + JSON.stringify(context)); 
				mode = context.mode;
				evaluateTaxAnalystFuntionalityAccess();
				
				if ( mode == 'create' || mode == 'copy' ) { 
					context.currentRecord.setValue("custrecord_acq_lotce_taxreporting_status" ,taxRptStatus.Pending )
				}

				var exRecID = Number(context.currentRecord.getValue('custrecord_acq_lotce_zzz_zzz_parentlot'));
				exchangeRecordFields = certLib.getExchangeRecordFields(exRecID);
				
				var taxRate = 0;
				for (var i = 0; i < taxRateFields.length; i++) {
					taxRate = context.currentRecord.getValue({ fieldId:taxRateFields[i]	});
					if (taxRate !== 0) {
						clearFields(context, [exCodeDescrFields[i]]);
						clearFields(context, [exCodeFields[i]]);
					}
				}

				
				var taxRptMethodId = Number(context.currentRecord.getValue({ fieldId:'custrecord_act_lotce_tax_report_method' }));
				
				if (taxRptMethodId !== taxRptMethod.trm1042S) { // 1042-S fields should be cleared
					clearFields(context, form1042SFields);
					clearFields(context, incCodeDescrFields);
					clearFields(context, exCodeFields);
					clearFields(context, exCodeDescrFields);
					clearFields(context, form1042sCodeFields);
				}
				
				if ( mode == 'create' || mode == 'copy' || mode == 'edit') {
					console.log("taxYearFiled - started");
					// if admin or NetSuite Tax Group
					if (taxAnalystFuntionalityAccess){
						setFieldDisplayType(context, taxYearFiled, 'NORMAL');
						console.log("taxYearFiled - NORMAL");
					} else {
						setFieldDisplayType(context, taxYearFiled, 'DISABLED');
						console.log("taxYearFiled - DISABLED");
					}
				}

			}
			
			
			//=======================================================================================================================
			//=======================================================================================================================
			function validateField(context) {
		        
	            switch (context.fieldId) {
	            //----------------------------------------------------------------------------------------------------------------
	            case 'custrecord_acq_lotce_zzz_zzz_parentlot':
					var exRecID = Number(context.currentRecord.getValue('custrecord_acq_lotce_zzz_zzz_parentlot'));
					var localExchangeRecordFields = certLib.getExchangeRecordFields(exRecID);
					if (localExchangeRecordFields.derApprovedToPay) {
						alert("That exchange record has 'Approved To Pay' checked, you may not assign that exchange record to this LOT Certificate Entry");
						return false;
					}
					return true;
	            	break;
	            } // switch (context.fieldId)
	            
	    		return true;          
			}

			
			
			//======================================================================================================================
			//======================================================================================================================
			function fieldChanged(context) {
				
				
				switch (context.fieldId) {
				//------------------------------------------------------------------------------------------------------------
				case 'custrecord_acq_lotce_taxreporting_status': 
					taxRptStatusFieldChange(context);
					break;
					//------------------------------------------------------------------------------------------------------------
				case 'custrecord_act_lotce_tax_report_method': 
					taxRptMethodFieldChange(context);
					break;
					//------------------------------------------------------------------------------------------------------------
				case 'custrecord_cert_1042s_tax_rate_ch3': 
					setExemptCodeFieldsDisplayType(context, ['custrecord_cert_1042s_tax_rate_ch3'], ['custrecord_cert_1042s_ex_code_ch3'], ['custrecord_cert_1042s_ec_ch3_descr']);
					break;
					//------------------------------------------------------------------------------------------------------------
				case 'custrecord_cert_1042s_tax_rate_ch4': 
					setExemptCodeFieldsDisplayType(context, ['custrecord_cert_1042s_tax_rate_ch4'], ['custrecord_cert_1042s_ex_code_ch4'], ['custrecord_cert_1042s_ec_ch4_descr']);
					break;
					//------------------------------------------------------------------------------------------------------------
				case 'custrecord_acq_lotce_zzz_zzz_parentlot': 
					var exRecID = Number(context.currentRecord.getValue('custrecord_acq_lotce_zzz_zzz_parentlot'));
					exchangeRecordFields = certLib.getExchangeRecordFields(exRecID);
					break;
					//------------------------------------------------------------------------------------------------------------
//				case '': 
//					break;
//					//------------------------------------------------------------------------------------------------------------
//				case '': 
//					break;
//					//------------------------------------------------------------------------------------------------------------
//				case '': 
//					break;
				} // switch (context.fieldId)

			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function saveRecord(context) {
				var validateExemptCodeFieldsResult = certLib.validateExemptCodeFields('Client', context, taxRateFields, exCodeFields);
				if (!validateExemptCodeFieldsResult.success) {
					showErrorMessage(validateExemptCodeFieldsResult.message);
					return false;
				}
				
				if (mode == 'edit') { 
					var oldRecord = record.load({ type:context.currentRecord.type, id:context.currentRecord.id });
					if (oldRecord.getValue("custrecord_acq_lotce_taxreporting_status") == taxRptStatus.Filed) {
						var promptText = "You have changed Tax Reporting fields and the Tax Reporting Status is 'FILED', you must provide an explanation for this change.";
						var noteTitle  = "Tax Reporting change explanation";
						var promptForTaxReportingChangeExplanation = false;
						if (didValuesChange(context.currentRecord ,oldRecord , taxFields))       { promptForTaxReportingChangeExplanation = true; }
						if (didValuesChange(context.currentRecord ,oldRecord , form1042SFields)) { promptForTaxReportingChangeExplanation = true; }
						
						if (!promptForTaxReportingChangeExplanation) {
							if (didValuesChange(context.currentRecord ,oldRecord , ["custrecord_acq_lotce_taxreporting_status"])) {
								promptForTaxReportingChangeExplanation = true; 
								var promptText = "You have changed the Tax Reporting Status from 'FILED' to '{0}', you must provide an explanation for this change.".replace("{0}" ,context.currentRecord.getText("custrecord_acq_lotce_taxreporting_status"));
								var noteTitle  = "Tax Reporting Status changed from 'FILED' to '{0}'".replace("{0}" ,context.currentRecord.getText("custrecord_acq_lotce_taxreporting_status"));
							}
						}

						if (promptForTaxReportingChangeExplanation) {
							var explanation = prompt(promptText);
							if (!explanation) { explanation = ""; }
							explanation = explanation.trim();
							if (!(explanation > "")) { alert("You did not enter an explanation, one is required to save the record!"); return false; }

				    		var noteAdded = addUserNote(context.currentRecord.id ,"customrecord_acq_lot_cert_entry" ,noteTitle ,explanation);
				    		if (!noteAdded) { alert("note add failed"); return false; }
						} // if (promptForTaxReportingChangeExplanation)
							
					} // if (oldRecord.getValue("custrecord_acq_lotce_taxreporting_status") == taxReportingStatus_FILED)
				}
				
				
				return true;
			}
			


			//======================================================================================================================================
			//======================================================================================================================================
			function didValuesChange(currentRecord ,oldRecord ,fieldNames) {
				var changed = false;
				for (var i=0; i<fieldNames.length; i++) {
					if (oldRecord.getValue(fieldNames[i]) !== currentRecord.getValue(fieldNames[i])) { changed = true; break; }
				}
				return changed;
			}

			
			
			//==================================================================================================
			//==================================================================================================
		    function addUserNote(rcdId ,rcdType ,noteTitle ,noteText) {
		    	try {
		    		var objHeader     = {};
		    		var objBody       = {};
		    		objBody.rcdId     = rcdId;
		    		objBody.rcdType   = rcdType;
		    		objBody.noteTitle = noteTitle;
		    		objBody.noteText  = noteText;
		    		objBody.noteType  = 7;
		    		var body          = JSON.stringify(objBody);
		    		var suitletURL    = url.resolveScript({ scriptId:'customscript_addusernote_sl' ,deploymentId:'customdeploy_addusernote_sl' ,returnExternalUrl:false});
		    		var response      = https.post({ url:suitletURL ,headers:objHeader ,body:body });				
		    		if (response.body != "OK") { console.log(response.body);  return false; }
		    	}
		    	catch(e) { console.log(e.message); return false; }
		    	return true;
		    }
			
			
			
			//======================================================================================================================
			//======================================================================================================================
			function taxRptStatusFieldChange(context) {
				var taxRptStatusId = Number(context.currentRecord.getValue('custrecord_acq_lotce_taxreporting_status'));
				console.log('fieldChanged', 'taxRptStatusId: ' + taxRptStatusId);
				var taxRptMethodId = Number(context.currentRecord.getValue({ fieldId:'custrecord_act_lotce_tax_report_method' }));
				console.log('fieldChanged', 'taxRptMethodId: ' + taxRptMethodId);


				if (taxRptStatusId === taxRptStatus.Filed || taxRptStatusId === taxRptStatus.Reviewed) {
					if (taxAnalystFuntionalityAccess) { // SRS Ops Manager and Administrator
						// Protect Tax Reporting fields if Filed or Reviewed
						// ATP-1011 AC # 5 ==================================
						//===================================================

						//setFieldDisplayType(context, taxFields, 'DISABLED');

						// END ATP-1011 AC # 5 ==============================
						//===================================================
						setFieldDisplayType(context, form1042SFields, 'DISABLED');
						setFieldDisplayType(context, exCodeFields, 'DISABLED');
					} else {
						// Wrong role - reset choice to initial value and display popup
						console.log('fieldChanged', 'initTaxRptStatus: ' + initTaxRptStatus);
						context.currentRecord.setValue({
							fieldId: 'custrecord_acq_lotce_taxreporting_status',
							value: initTaxRptStatus,
							ignoreFieldChange: true
						});
						dialog.alert({
							title: 'Invalid Tax Reporting Status selection',
							message: 'You do not have permission to change the Tax Reporting Status to Filed or Reviewed. Click OK to continue.'
						}).then().catch();
					}
				} else {
					// Enable Tax Reporting fields 
					setFieldDisplayType(context, taxFields, 'NORMAL');
					if (taxRptMethodId === taxRptMethod.trm1042S) {
						// 1042-S fields should be modifiable
						setFieldDisplayType(context, form1042SFields, 'NORMAL');
						setExemptCodeFieldsDisplayType(context, taxRateFields, exCodeFields, exCodeDescrFields);
					} else {
						// 1042-S fields should be protected
						setFieldDisplayType(context, form1042SFields, 'DISABLED');
					}
				}
			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function taxRptMethodFieldChange(context) {
				taxRptMethodId = Number(context.currentRecord.getValue({
					fieldId: 'custrecord_act_lotce_tax_report_method'
				}));
				console.log('fieldChanged', 'taxRptMethodId: ' + taxRptMethodId);

				if (taxRptMethodId === taxRptMethod.trm1042S) {
					// 1042-S fields should be modifiable
					setFieldDisplayType(context, form1042SFields, 'NORMAL');
					setExemptCodeFieldsDisplayType(context, taxRateFields, exCodeFields, exCodeDescrFields);
				} else {
					// 1042-S fields should be cleared and protected
					clearFields(context, form1042SFields);
					clearFields(context, incCodeDescrFields);
					clearFields(context, exCodeFields);
					clearFields(context, exCodeDescrFields);
					clearFields(context, form1042sCodeFields);
					setFieldDisplayType(context, form1042SFields, 'DISABLED');
					setFieldDisplayType(context, exCodeDescrFields, 'DISABLED', 'OPTIONAL');
				}
			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function setExemptCodeFieldsDisplayType(context, taxRateFields, exCodeFields, exCodeDescrFields) {
				var taxRate = 0;
				for (var i = 0; i < taxRateFields.length; i++) {
					taxRate = context.currentRecord.getValue({ fieldId:taxRateFields[i] });
					if ( !(taxRate > "") ) { taxRate = 0; }
					if (taxRate === 0) {
						setFieldDisplayType(context, [exCodeDescrFields[i]], 'NORMAL', 'MANDATORY');
					} else {
						clearFields(context, [exCodeDescrFields[i]]);
						clearFields(context, [exCodeFields[i]]);
						setFieldDisplayType(context, [exCodeDescrFields[i]], 'DISABLED', 'OPTIONAL');
					}
				}
			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function setFieldDisplayType(context, fields, displayType, makeMandatory) {
				// console.log('setFieldDisplayType', 'displayType: ' + displayType);
				// console.log('setFieldDisplayType', 'makeMandatory: ' + makeMandatory);
				for (var i = 0; i < fields.length; i++) {
					var tempField = context.currentRecord.getField({ fieldId:fields[i] });
					if (tempField) {
						// Only do something if the argument has been supplied
						if (typeof displayType !== 'undefined') {
							displayType = displayType.toUpperCase();
							switch (displayType) {
								case 'DISABLED':
									tempField.isDisabled = true;
									break;
								case 'NORMAL':
									tempField.isDisabled = false;
									break;
								default:
									break;
							}
						}
						// Only do something if the argument has been supplied
						if (typeof makeMandatory !== 'undefined') {
							makeMandatory = makeMandatory.toUpperCase();
							switch (makeMandatory) {
								case 'MANDATORY':
									tempField.isMandatory = true;
									break;
								case 'OPTIONAL':
									tempField.isMandatory = false;
									break;
								default:
									break;
							}
						}
					}

				}
			}
			
			//=====================================================================================================================
			//======================================================================================================================
			function buttonModifyCertificateAmounts() { 
				var rcd = currentRecord.get();
				var objField1 = rcd.getField({ fieldId:'custrecord_acq_lotce_zzz_zzz_taxwithheld' });
				objField1.isDisabled = false;
				var objField2 = rcd.getField({ fieldId:'custrecord_acq_lotce_zzz_zzz_payment' });
				objField2.isDisabled = false;
			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function clearFields(context, fields) {
				for (var i = 0; i < fields.length; i++) {
					//Now set the field value on the form
					context.currentRecord.setValue({ fieldId:fields[i] ,value:'' ,ignoreFieldChange: true });
				}
			}
			
			
			//======================================================================================================================
			//======================================================================================================================
			function showErrorMessage(msgTitle, msgText) {
				var myMsg = message.create({ title:msgTitle ,message:msgText ,type:message.Type.WARNING });
				myMsg.show({ duration:12900 });
				window.scrollTo(0, 0);
			}

			return {
				pageInit: pageInit,
				fieldChanged: fieldChanged,
				saveRecord: saveRecord,
				buttonModifyCertificateAmounts: buttonModifyCertificateAmounts
			};

		});