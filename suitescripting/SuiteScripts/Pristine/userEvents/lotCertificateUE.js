	/**
	 *@NApiVersion 2.x
	 *@NScriptType UserEventScript
	 *
	 * Module Description
	 * Built to LOCK or UNLOCK certain fields on the Certificate records based on data from the related DER
	 * record.  The DER is associated with the Parent Exchange Record of the Certificate.
	 * 
	 * Version    Date            Author           Remarks
	 * -------    ------------    ---------------  --------------------------------------------------------------------------
	 * 
	 */

define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/ui/message' ,'N/url' ,'N/redirect'
			,'/.bundle/132118/PRI_ServerLibrary'
			,'/SuiteScripts/Prolecto/Shared/SRS_Functions'
			,'/SuiteScripts/Pristine/libraries/lotCertificateLibrary.js'
	       ,'/.bundle/132118/PRI_AS_Engine'
	       ,'/.bundle/132118/PRI_ShowMessageInUI'
		   ,'SuiteScripts/Pristine/libraries/toolsLibrary.js'
		   ],

		function(record ,search ,serverWidget ,runtime ,message ,url ,redirect 
				,priLibrary
				,srsFunctions
				,certLib 
				,appSettings 
				,priMessage 
				,tools  ) {	

		    var taxRptStatus         = certLib.constant.taxRptStatus;
			var exchangeRecordStatus = certLib.constant.exchangeRecordStatus;
			var taxRptMethod         = certLib.constant.taxRptMethod;
			var userRole             = certLib.constant.userRole;
			var certFields           = certLib.constant.certFields;
			var taxFields            = certLib.constant.taxFields;
			var form1042SFields      = certLib.constant.form1042SFields;
			var all1042sFields       = certLib.constant.all1042sFields;
			var taxRateFields        = certLib.constant.taxRateFields;
			var exCodeFields         = certLib.constant.exCodeFields;
			var exCodeDescrFields    = certLib.constant.exCodeDescrFields;
			var incCodeDescrFields   = certLib.constant.incCodeDescrFields;
			var fieldsToSkip		 = certLib.constant.fieldsToSkip;

			var executionContext     = runtime.executionContext;
			var userObj              = runtime.getCurrentUser();
			var userRoleId           = userObj.roleId;
			var arrTaxAnalystGroupMembers;
			var taxAnalystFuntionalityAccess = false;
			var exchangeRecordFields;
			var comma = "";
			
			//======================================================================================================================================
			//======================================================================================================================================
			function evaluateTaxAnalystFuntionalityAccess() {
				arrTaxAnalystGroupMembers = JSON.parse( appSettings.readAppSetting("Lot Certificate", "Tax Analyst group members") );
				taxAnalystFuntionalityAccess = (userRoleId === userRole.administrator && runtime.envType == "SANDBOX");
				if (arrTaxAnalystGroupMembers.indexOf(userObj.name) > -1) {taxAnalystFuntionalityAccess = true;}
			}


			//======================================================================================================================================
			//======================================================================================================================================
			function beforeLoad(context) {

				evaluateTaxAnalystFuntionalityAccess();
				
				context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/lotCertificateClient.js';
				log.debug("beforeload" ,"In!")
				// GET THE EXCHANGE RECORD ID
				var exRecID = Number(context.newRecord.getValue('custrecord_acq_lotce_zzz_zzz_parentlot'));
				exchangeRecordFields = certLib.getExchangeRecordFields(exRecID);

				// ATP-1011 AC # 4 ==================================
				//===================================================
				if (exchangeRecordFields.certFieldsAreLocked) {

					context.form.removeButton('makecopy');
					context.form.removeButton('delete');
				}
				// END ATP-1011 AC # 4 ==============================
				//===================================================

				log.debug("beforeload" ,"exchangeRecordFields: " + JSON.stringify(exchangeRecordFields))
				if ( context.type == 'copy' || context.type == 'create' ) { 
					if (exchangeRecordFields.derApprovedToPay) {
				    	if ( runtime.executionContext == runtime.ContextType.USER_INTERFACE ) { 
							priMessage.prepareMessage("SRS Custom Restriction: DER has 'Approved To Pay' checked, you may not create a new LOT Entry for this exchange record.", priMessage.TYPE.ERROR);
	                    	redirect.toRecord({ type:"customrecord_acq_lot" ,id:exRecID }); 
				    	}
				    	else { throw "SRS Custom Restriction: DER has 'Approved To Pay' checked, you may not create a new LOT Entry for this exchange record."; }
					}
				}
				if (context.type == 'create' && exRecID) {
					if ( !(context.newRecord.getValue('custrecord_acq_loth_zzz_zzz_deal') > "") ) { // Fill in Deal if empty
						if (exchangeRecordFields.deal > "") {
							context.newRecord.setValue('custrecord_lot_cert_deal' ,exchangeRecordFields.deal );
						}
					}
					if ( !(context.newRecord.getValue('custrecord_acq_loth_zzz_zzz_shareholder') > "") ) { // Fill in Shareholder if empty
						if (exchangeRecordFields.deal > "") {
							context.newRecord.setValue('custrecord_lot_cert_shareholder' ,exchangeRecordFields.shareholder );
						}
					}
				}

				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type === 'edit')) 
				{
					setFieldDisplayType(context, ['custrecord_cert_tax_form_detail_record'], 'INLINE');
				}
					

				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type === 'edit' || context.type === 'create')) {
					if (exRecID) {
						if (exchangeRecordFields.certFieldsAreLocked) {	//Protect the Certificate Information and Payment Details fields
							setFieldDisplayType(context, certFields, 'DISABLED');

							// ATP-1011 AC # 1 ==================================
							//===================================================
							setFieldDisplayType(context, ['isinactive'], 'DISABLED');
							// END ATP-1011 AC # 1 ==============================
							//===================================================
						}
						if (exchangeRecordFields.derApprovedToPay) { 
							var displayButton = (userObj.roleId === userRole.administrator && runtime.envType == runtime.EnvType.SANDBOX);
							if (taxAnalystFuntionalityAccess) { displayButton = true; }
							if (displayButton) {  
								context.form.addButton({ id:'custpage_modify_cert_amounts',
		                                              label:'Modify Certificate Amounts',
		                                       functionName:'buttonModifyCertificateAmounts()' });
							}
						} // if (exchangeRecordFields.derApprovedToPay)
					}
					
					setTaxFieldsDisplayType(context);
				} // if (context.type === 'edit' || context.type === 'create')
				
				if ( context.type == 'copy' || context.type == 'create' ) {
					context.newRecord.setValue('custrecord_acq_lotce_taxreporting_status' ,taxRptStatus.Pending);
					if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
						setFieldDisplayType(context, ['custrecord_acq_lotce_taxreporting_status'], 'DISABLED');

						// ATP-1011 AC # 1 ==================================
						//===================================================
						setFieldDisplayType(context, ['isinactive'], 'DISABLED');
						// END ATP-1011 AC # 1 ==============================
						//===================================================
					}
				}
				log.debug("beforeload" ,"done")

			} // beforeLoad


			//======================================================================================================================================
			//======================================================================================================================================
			function beforeSubmit(context) {
				log.debug({title: 'context', details:context});
				var fieldLabel;
				var message = '';
				var oldRec;
				var oldTaxReportingStatus = '';
				var fieldName = "";
				if (context.oldRecord) {

					oldRec = context.oldRecord;
					log.debug({title: 'oldRec', details: oldRec});
					oldTaxReportingStatus = oldRec.getValue('custrecord_acq_lotce_taxreporting_status');
					log.debug({title: 'oldTaxReportingStatus', details: oldTaxReportingStatus});
				}
				var newRec = context.newRecord;
				var allCertFields = newRec.getFields();
				var newTaxReportingStatus = newRec.getValue('custrecord_acq_lotce_taxreporting_status');
				var newField = '';
				var oldField = '';

				evaluateTaxAnalystFuntionalityAccess(); 
				var exRecID = Number(context.newRecord.getValue('custrecord_acq_lotce_zzz_zzz_parentlot'));
				if (!exRecID && context.type == 'xedit') { exRecID = Number(context.oldRecord.getValue('custrecord_acq_lotce_zzz_zzz_parentlot')); }
				exchangeRecordFields = certLib.getExchangeRecordFields(exRecID);
				
				switch (executionContext) {
					case 'CSVIMPORT':
						log.debug('beforeSubmit', 'CSV context.type: ' + context.type );
						if (   exchangeRecordFields.derApprovedToPay ) {
							if ( context.type == 'copy' || context.type == 'create' ) { throw "DER Approved To Pay is checked, you cannot create a new Lot Certificate for this exchange record." }
							if ( context.type == 'edit' ) { 
								if (oldRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot") !== newRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot")) {
									throw "DER Approved To Pay is checked, you cannot assign that exchange record to this Lot Certificate." 
								}
							}
						}
						if (exchangeRecordFields.certFieldsAreLocked) {
								log.debug('beforeSubmit', 'checking cert fields: '     );
								var fieldsThatCantBeChanged = "";
								comma = "";
								for (var i=0; i<certFields.length; i++) {
									var fieldName = certFields[i];
									if (context.type == 'edit') {
										if (oldRec.getValue(fieldName) !== newRec.getValue(fieldName)) 
										    {fieldsThatCantBeChanged = addFieldToList(fieldsThatCantBeChanged ,newRec ,fieldName); } 
									}
								} // for
								log.debug('beforeSubmit', 'fieldsThatCantBeChanged: ' + fieldsThatCantBeChanged    );
								if (fieldsThatCantBeChanged > "") {
									message +=  "The following fields may not be updated due to Exchange record status or DER Approved to Pay: " + fieldsThatCantBeChanged + ";   ";
								} // if (fieldsThatCantBeChanged > "")
							} // if (exchangeRecordFields.certFieldsAreLocked)
						
							if (!taxAnalystFuntionalityAccess) {
								if ( !(context.type == 'copy' || context.type == 'create') ) {
									if (oldRec.getValue("custrecord_acq_lotce_taxreporting_status") !== newRec.getValue("custrecord_acq_lotce_taxreporting_status")) {
										message += "Only members of the 'Tax Analyst Group' may change Tax Reporting Status;   ";
									}
								}
							}

							var taxRptStatusId = Number(context.newRecord.getValue('custrecord_acq_lotce_taxreporting_status'));							
							if (context.type == 'edit' && !( taxRptStatusId === taxRptStatus.Pending || taxRptStatusId === taxRptStatus.Empty ) ) {
								var fieldsThatCantBeChanged = "";
								comma = "";
								for (fieldName in taxFields) {
									if (oldRec.getValue(fieldName) !== newRec.getValue(fieldName)) 
									    {fieldsThatCantBeChanged = addFieldToList(fieldsThatCantBeChanged ,newRec ,fieldName); } 
								} // for
								for (fieldName in all1042sFields) {
									if (oldRec.getValue(fieldName) !== newRec.getValue(fieldName)) 
									    {fieldsThatCantBeChanged = addFieldToList(fieldsThatCantBeChanged ,newRec ,fieldName); } 
								} // for								
								if (fieldsThatCantBeChanged > "") {
									if (taxAnalystFuntionalityAccess) {
//	Commented out ATO-156				context.newRecord.setValue('custrecord_acq_lotce_taxreporting_status' ,taxRptStatus.Corrected);
										var noteText = "Lot Certificate corrected via import, fields changed are: " + fieldsThatCantBeChanged;
										addUserNote(newRec.id ,newRec.type ,"Corrected via Import" ,noteText ,7)
									}
									else {
										message +=  "Tax Reporting Status indicates these fields may only be changed by members of the Tax Analyst group: " + fieldsThatCantBeChanged + ";   ";
									}
								} // if (fieldsThatCantBeChanged > "")
							}
							
							
							
							if (newRec.getValue("custrecord_act_lotce_tax_report_method") != taxRptMethod.trm1042S) {
								var fieldsThatCantBeChanged = "";
								var error = false;
								for (fieldName in all1042sFields) {
									if (newRec.getValue(fieldName) > "") 
									    {fieldsThatCantBeChanged = addFieldToList(fieldsThatCantBeChanged ,newRec ,fieldName); } 
								} // for
								if (fieldsThatCantBeChanged > "") { message += 'Tax Reporting Method is not 1042S, you may not assign values to any of the 1042S fields;   '; }
							}
							if ( context.type == 'copy' || context.type == 'create' ) {
								var taxReportingStatus = context.newRecord.getValue('custrecord_acq_lotce_taxreporting_status');
								if (taxReportingStatus != taxRptStatus.Pending) { message += 'When creating or copying a LOT Cretificate record the Tax Reporting status must be "Pending".'; }
							}
							
							if (message) { throw message; }

							// cant change chapter if tax rpt meth isnt 13
							var newChapter = newRec.getValue('custrecord_cert_1042s_chapter');
							var newTaxRptMeth = newRec.getValue('custrecord_act_lotce_tax_report_method');
							//log.audit('CSV ATP-1591 cert id#'+oldRec.id , 'oldChapter='+oldChapter + 'newChapter='+newChapter + ' oldTaxRptMeth='+oldTaxRptMeth+ ' newTaxRptMeth='+newTaxRptMeth+ ' taxRptMethod.trm1042S='+taxRptMethod.trm1042S);
							if ( newChapter && (newTaxRptMeth != taxRptMethod.trm1042S) ) {
								throw "Tax Reporting Method must be 1042-S to edit the 1042-S Chapter for LOT cert";
							} 



							break;
				
				
				
					//---------------------------------------------------------------------------------------------------------------------
					case 'USERINTERFACE':
					case 'USEREVENT':
						
						switch (context.type) {
							case 'xedit':
								log.debug('beforeSubmit', 'xedit ' );
								fieldList = newRec.getFields();

								// ATP-1011 AC # 2 ==================================
								//===================================================
								if (oldTaxReportingStatus !== taxRptStatus.Pending || oldTaxReportingStatus !== taxRptStatus.Empty) {

									if (!Boolean(newTaxReportingStatus)) {

										// If the user is in the Tax Analyst Group
										if (taxAnalystFuntionalityAccess) {

											allCertFields.forEach(function (field) {

												// Here we'll ensure we're only looking at the custom fields for this record
												if (field.indexOf('custrecord') > -1) {

													// If any fields are meant to be skipped for checking if it has been changed, then only change ones not meant to be skipped
													if (fieldsToSkip.indexOf(field) === -1) {

														newField = newRec.getValue(field);
														oldField = oldRec.getValue(field);

														if (newField !== oldField) {

															newRec.setValue({
																fieldId: 'custrecord_acq_lotce_taxreporting_status',
																value: taxRptStatus.Pending
															})
														}
													}
												}
											})
										}
									} else if (!taxAnalystFuntionalityAccess) {

										allCertFields.forEach(function(field) {

											// Here we'll ensure we're only looking at the custom fields for this record
											if (field.indexOf('custrecord') > -1) {

												// If any fields are meant to be skipped for checking if it has been changed, then only change ones not meant to be skipped
												if (fieldsToSkip.indexOf(field) === -1) {

													newField = newRec.getValue(field);
													oldField = oldRec.getValue(field);

													if (newField !== oldField) {

														newRec.setValue({
															fieldId: 'custrecord_acq_lotce_taxreporting_status',
															value: taxRptStatus.Pending
														})
													}
												}
											}
										})
									}
								}

								// END ATP-1011 AC # 2 ==============================
								//===================================================


								if (exchangeRecordFields.derApprovedToPay) {
									if (fieldList.indexOf("custrecord_acq_lotce_zzz_zzz_parentlot") >= 0) {
										if (oldRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot") !== newRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot")) {
											throw "DER Approved To Pay is checked, you cannot assign that exchange record to this Lot Certificate."
										}
									}
								}
//								log.debug("fieldList.indexOf" ,fieldList.indexOf("custrecord_acq_lotce_zzz_zzz_parentlot"));
//								log.debug("fieldList" ,JSON.stringify(fieldList));
//								log.debug("oldRec" ,oldRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot"));
//								log.debug("newRec" ,newRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot"));

								// Because xedit does not go through beforeLoad we cannot protect the fields that were protected there and so
								// instead I check if any of those fields were changed and if so I reject the change 
								if (exchangeRecordFields.certFieldsAreLocked) {
									log.debug('beforeSubmit', 'inside if ' );
								 
									var fieldsThatCantBeChanged = "";
									comma = "";
									for (fieldName in certFields) {
										if (fieldList.indexOf(fieldName) >= 0) {
											if (oldRec.getValue(fieldName) !== newRec.getValue(fieldName)) 
											   {fieldsThatCantBeChanged = addFieldToList(fieldsThatCantBeChanged ,newRec ,fieldName); } 
										}
									} // for
									if (fieldsThatCantBeChanged > "") {
										message += "The following fields may not be updated due to Exchange record status or DER Approved to Pay: " + fieldsThatCantBeChanged + ". Changes rejected;   <br>";
									} // if (fieldsThatCantBeChanged > "")
									
									var taxReportingStatus;
									if (fieldList.indexOf('custrecord_acq_lotce_taxreporting_status') >= 0) {
										taxReportingStatus = newRec.getValue("custrecord_acq_lotce_taxreporting_status");
										if (!taxAnalystFuntionalityAccess) {
											if (oldRec.getValue("custrecord_acq_lotce_taxreporting_status") !== newRec.getValue("custrecord_acq_lotce_taxreporting_status")) {
												message += "Only members of the 'Tax Analyst Group' may change Tax Reporting Status;   <br>";
											}
										}
									} else { taxReportingStatus = oldRec.getValue("custrecord_acq_lotce_taxreporting_status"); }
								
									if (!taxAnalystFuntionalityAccess && !( taxReportingStatus === taxRptStatus.Pending || taxReportingStatus === taxRptStatus.Empty ) ) {
										if (didValuesChange(context, taxFields) || didValuesChange(context, form1042SFields) || didValuesChange(context, exCodeFields)) {
											message = "You do not have permission to change the Tax Fields when status is not empty or 'Pending'. Changes rejected;   <br>";
										}
									}
									
									var validateExemptCodeFieldsResult = certLib.validateExemptCodeFields('Server', context);
									if (!validateExemptCodeFieldsResult.success) {
										message += validateExemptCodeFieldsResult.message;
									}

								}


								// prevent changing chapter on xedit based on tax reporting method
								var oldChapter = oldRec.getValue('custrecord_cert_1042s_chapter');
								var newChapter = newRec.getValue('custrecord_cert_1042s_chapter');
								var oldTaxRptMeth = oldRec.getValue('custrecord_act_lotce_tax_report_method');
								var newTaxRptMeth = newRec.getValue('custrecord_act_lotce_tax_report_method');
								log.audit('xedit 1042-S LOT id#'+oldRec.id ,'oldTaxRptMeth='+oldTaxRptMeth+ ' newTaxRptMeth='+newTaxRptMeth +'  oldChapter='+oldChapter+' newChapter='+newChapter);
								// chapter changing and taxrptmeth != 13
								if ( (newChapter) && (oldTaxRptMeth != taxRptMethod.trm1042S) ){ //(newTaxRptMeth != taxRptMethod.trm1042S) && Boolean(newChapter) ) {
									throw "Tax Reporting Method must be 1042-S to edit the 1042-S Chapter for LOT cert id#" + oldRec.id ;
								}
								
								break;
								
							case 'edit':
								if (exchangeRecordFields.derApprovedToPay) {
									if (oldRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot") !== newRec.getValue("custrecord_acq_lotce_zzz_zzz_parentlot")) {
										throw "DER Approved To Pay is checked, you cannot assign that exchange record to this Lot Certificate." 
									}
								}

								// ATP-1011 AC # 2 ==================================
								//===================================================
								if (newTaxReportingStatus !== taxRptStatus.Pending || newTaxReportingStatus !== taxRptStatus.Empty) {

									// If the user is in the Tax Analyst Group
									if (taxAnalystFuntionalityAccess) {

										// Here we will check if the Tax Reporting Status was not changed and if ANY field on the record was changed
										// If a field was changed, we'll change the Tax Reporting Status to 'Pending'
										if (newTaxReportingStatus === oldTaxReportingStatus) {

											allCertFields.forEach(function(field) {

												// Here we'll ensure we're only looking at the custom fields for this record
												if (field.indexOf('custrecord') > -1) {

													// If any fields are meant to be skipped for checking if it has been changed, then only change ones not meant to be skipped
													if (fieldsToSkip.indexOf(field) === -1) {

														newField = newRec.getValue(field);
														oldField = oldRec.getValue(field);

														if (newField !== oldField) {

															newRec.setValue({
																fieldId: 'custrecord_acq_lotce_taxreporting_status',
																value: taxRptStatus.Pending
															})
														}
													}
												}
											})
										}
									} else if (!taxAnalystFuntionalityAccess) {

										allCertFields.forEach(function(field) {

											// Here we'll ensure we're only looking at the custom fields for this record
											if (field.indexOf('custrecord') > -1) {

												// If any fields are meant to be skipped for checking if it has been changed, then only change ones not meant to be skipped
												if (fieldsToSkip.indexOf(field) === -1) {

													newField = newRec.getValue(field);
													oldField = oldRec.getValue(field);

													if (newField !== oldField) {

														newRec.setValue({
															fieldId: 'custrecord_acq_lotce_taxreporting_status',
															value: taxRptStatus.Pending
														})
													}
												}
											}
										})
									}
								}
								// END ATP-1011 AC # 2 ==============================
								//===================================================

								var validateExemptCodeFieldsResult = certLib.validateExemptCodeFields('Server', context);
								if (!validateExemptCodeFieldsResult.success) {
									message += validateExemptCodeFieldsResult.message;
								}
								log.debug('beforeSubmit', 'validateExemptCodeFieldsResult: ' + JSON.stringify(validateExemptCodeFieldsResult));
						} // switch (context.type)
						if (message) { throw message; }
						break;
					default:
						break;
				}
				
				// NO MATTER WHAT, we want to make sure that on a newly created record Tax Reporting Status is PENDING
				if ( context.type == 'copy' || context.type == 'create' ) {
					context.newRecord.setValue('custrecord_acq_lotce_taxreporting_status' ,taxRptStatus.Pending);
				}
				if (context.type == 'create' && exRecID) { // If create and exchange record is there then fill in deal and shareholder
					if ( !(context.newRecord.getValue('custrecord_acq_loth_zzz_zzz_deal') > "") ) {
						if (exchangeRecordFields.deal > "") {
							context.newRecord.setValue('custrecord_lot_cert_deal' ,exchangeRecordFields.deal );
						}
					}
					if ( !(context.newRecord.getValue('custrecord_acq_loth_zzz_zzz_shareholder') > "") ) {
						if (exchangeRecordFields.deal > "") {
							context.newRecord.setValue('custrecord_lot_cert_shareholder' ,exchangeRecordFields.shareholder );
						}
					}
				}

				
				// ATP-1814
				// COMMENTED FOR PROD SUPPORT ATP-1830
//				if ( context.type != 'delete' ) {
//					var currencyValid = vaildateCurrency(context ,exRecID);				
//					if (!currencyValid) { 
//						throw "The currency on this Certificate, is NOT compatible with other Certificates for this Exchange Record";
//					}
//				}
				// ATP-1814 END
			}

			
			//======================================================================================================================================
			//======================================================================================================================================
			function vaildateCurrency(context ,exRecId){
				
				var thisRecInternalId     = context.newRecord.getValue("id");
				var thisRecCurrency       = context.newRecord.getValue("custrecord_acq_lotce_zzz_zzz_currencytyp");
				if (!thisRecCurrency) { return true; } // if this record has no currency assigned do not validate
				
				var objCurrency           = search.lookupFields({type:'currency' ,id:thisRecCurrency ,columns: ["symbol" ]});
				var thisRecCurrencySymbol = objCurrency.symbol.toString().trim();
				var isNumeric             = Number(thisRecCurrencySymbol);
				
				if (!isNaN(isNumeric)) { // Do NOT validate Shares, only real currencies, the symbol for shares is always a numeric value
					return true;			
				}
			    
		    	var filter0 = search.createFilter({ name:'isinactive'                               ,operator:"IS"      ,values:["F"]             });
		    	var filter1 = search.createFilter({ name:'custrecord_acq_lotce_zzz_zzz_parentlot'   ,operator:"ANYOF"   ,values:[exRecId]         });
		    	var filter2 = search.createFilter({ name:'custrecord_acq_lotce_zzz_zzz_currencytyp' ,operator:"NONEOF"  ,values:[thisRecCurrency] });
		    	// filter3 filters out any certificates that represent shares and not actual currency
		    	var filter3 = search.createFilter({ name:"formulatext" ,formula:"REGEXP_REPLACE({custrecord_acq_lotce_zzz_zzz_currencytyp.symbol}, '[0-9]', '' )" ,join: null ,operator:"isnotempty" });
		    	var arrFilters = [];
		    	arrFilters.push(filter0);
		    	arrFilters.push(filter1);
		    	arrFilters.push(filter2);
		    	arrFilters.push(filter3);
		    	if (thisRecInternalId) { // if not CREATE mode filter out this record that is being edited
		        	var filter4 = search.createFilter({ name:'internalid' ,operator:"NONEOF"  ,values:[thisRecInternalId]     });
		        	arrFilters.push(filter4);
		    	}
				
		        var col_currency     = search.createColumn({ name:"custrecord_acq_lotce_zzz_zzz_currencytyp" ,join:null });
		        var col_symbol       = search.createColumn({ name:"symbol"                                   ,join:"CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_CURRENCYTYP" });
		        var col_internalid   = search.createColumn({ name:"internalid"                               ,join:null });
		    	var arrColumns = [];
		    	arrColumns.push(col_internalid);
		    	arrColumns.push(col_symbol);
		    	arrColumns.push(col_currency);
				
				var lotCertSearchObj = search.create({ type:"customrecord_acq_lot_cert_entry"
					                               ,filters:arrFilters
					                               ,columns:arrColumns  });
				
				var lotCertSearch        = lotCertSearchObj.run();
				var lotCertSearchResults = lotCertSearch.getRange(0,1000);
				
				// This search will filter out all certificates that DO NOT CONFLICT with this one
				// So if any rows at all are returned that indicates the currency on this record is incompatible 
				// with certificates already on the exchange record
				
				if (lotCertSearchResults.length == 0) { return true; }
			    
				// Error Handling
				return false;
			}

			
			//======================================================================================================================================
			//======================================================================================================================================
			function addFieldToList(list ,objRecord ,fieldName) {
				var fieldLabel = objRecord.getField({ fieldId:fieldName }).label;
				updatedList = list + comma + fieldLabel; 
				comma = ", "; 
				return updatedList;
			}

			
			
			//======================================================================================================================================
			//======================================================================================================================================
			function setTaxFieldsDisplayType(context) {
				//GET THE VALUE OF THE TAX REPORTING STATUS
				var taxRptStatusId = Number(context.newRecord.getValue('custrecord_acq_lotce_taxreporting_status'));
				log.debug('setTaxFieldsDisplayType', 'taxRptStatusId: ' + taxRptStatusId);
				
				if (!taxAnalystFuntionalityAccess) { setFieldDisplayType(context, ["custrecord_acq_lotce_taxreporting_status"], 'DISABLED'); }

				var taxFieldsProtected = true;
				if (taxRptStatusId === taxRptStatus.Empty) { log.debug('setTaxFieldsDisplayType', 'its empty: ' + taxRptStatusId); }
				if (taxRptStatusId === taxRptStatus.Pending || taxRptStatusId === taxRptStatus.Empty) { taxFieldsProtected = false; }
				if (taxAnalystFuntionalityAccess) { taxFieldsProtected = false; }
				
				if (taxFieldsProtected) {
					setFieldDisplayType(context, taxFields, 'DISABLED');
					setFieldDisplayType(context, form1042SFields, 'DISABLED');
					setFieldDisplayType(context, exCodeDescrFields, 'DISABLED');
				}
				else {
					setFieldDisplayType(context, taxFields, 'NORMAL');
					var taxRptMethodId = Number(context.newRecord.getValue({ fieldId:'custrecord_act_lotce_tax_report_method' }));
					if (taxRptMethodId === taxRptMethod.trm1042S) { // 1042-S fields should be modifiable
						setFieldDisplayType(context, form1042SFields, 'NORMAL');
						setExemptCodeFieldsDisplayType(context, taxRateFields, exCodeDescrFields);
					} else { // 1042-S fields should be protected and cleared
						setFieldDisplayType(context, form1042SFields, 'DISABLED');
						setFieldDisplayType(context, exCodeDescrFields, 'DISABLED', 'OPTIONAL');
					}
				} // else

			}

			

			//======================================================================================================================================
			//======================================================================================================================================
			function didValuesChange(context, fields) {
				log.debug({title: 'Checking Values'});
				var changed = false;
				for (var i = 0; i < fields.length; i++) {
					if (context.oldRecord.getValue(fields[i]) !== context.newRecord.getValue(fields[i])) {
						changed = true;
						break;
					}
				}
				return changed;
			}

			//======================================================================================================================================
			//======================================================================================================================================
			function getAllCertificateFields() {

				return certFields.concat(taxFields, form1042SFields, taxFields, all1042sFields, taxRateFields, exCodeDescrFields, exCodeFields);
			}


			//======================================================================================================================================
			//======================================================================================================================================
			function setExemptCodeFieldsDisplayType(context, taxRateFields, exCodeFields, exCodeDescrFields) {
				var taxRate = 0;
				for (var i = 0; i < taxRateFields.length; i++) {
					taxRate = context.newRecord.getValue({ fieldId:taxRateFields[i]	});
					if (taxRate === 0) {
						setFieldDisplayType(context, [exCodeFields[i]], 'NORMAL', 'MANDATORY');
					} else {
						setFieldDisplayType(context, [exCodeFields[i]], 'DISABLED', 'OPTIONAL');
					}
				}
			}


			//======================================================================================================================================
			//======================================================================================================================================
			function setFieldDisplayType(context, fields, displayType, makeMandatory) {
				for (var i = 0; i < fields.length; i++) {
					var tempField = context.form.getField({
						id: fields[i]
					});
					if (tempField) {
						// Only do something if the argument has been supplied
						if (typeof displayType !== 'undefined') {
							tempField.updateDisplayType({
								displayType: displayType
							});
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
			

			
			
			//==================================================================================================
			//==================================================================================================
		    function addUserNote(rcdId ,rcdType ,noteTitle ,noteText ,noteType) {
		    	try {
		    		var rcdTypeId = getCustomRecordTypeInternalId(rcdType ,rcdId);
		    		noteText = noteText.substr(0, 4000); // ensure max width of note
		    		var userNote = record.create({ type:"note" });
		    		userNote.setValue({ fieldId:"title"       ,value:noteTitle   });
		    		userNote.setValue({ fieldId:"notetype"    ,value:noteType    });
		    		userNote.setValue({ fieldId:"record"      ,value:rcdId       });
		    		userNote.setValue({ fieldId:"recordtype"  ,value:rcdTypeId   });
		    		userNote.setValue({ fieldId:"note"        ,value:noteText    });
		    		var intUserNoteId = userNote.save();        	
		    	}
		    	catch(e) { log.error(scriptFullName, "Exception " + e.message  ); return false; }
		    	return true;
		    }

		    
		    
			//==================================================================================================
			//==================================================================================================
		    function getCustomRecordTypeInternalId(name ,rcdId) {
		    	//leverage NetSuite's URL generator to get the record type
		    	var recordURL = url.resolveRecord({ recordType:name ,recordId:rcdId ,isEditMode:false ,params:{} });
		    	return getURLParameterByName('rectype', recordURL)

		    	//url parser helper function
		    	function getURLParameterByName(name, url) {
		    		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		    	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		    	        results = regex.exec(url);
		    	    return results === null ? "" : results[1].replace(/\+/g, " ");
		    	};
		    };
		    
		    function afterSubmit(context) {
				
				//ATP-1132
				var REC = context.newRecord;
				var records = [];
				//monitor changes of relevant fields (EXCHANGE RECORD and PAYMENT AMOUNT, and if changed, 
				//submit old and new Exchange Records to be re-evaluated
				if (priLibrary.fieldChanged(context, "custrecord_acq_lotce_zzz_zzz_parentlot") 
				|| priLibrary.fieldChanged(context, "custrecord_acq_lotce_zzz_zzz_payment")		
				)
				{
					records = [];
					records = srsFunctions.addRecordsToArray(context.oldRecord, REC, "custrecord_acq_lotce_zzz_zzz_parentlot", records);
					log.audit("submitting lot certificate related exchange record to the RSM queue", records);
					if (records.length>0)
					{	
						srsFunctions.writeExchangeRecordsToRSMQueue([["internalid",search.Operator.ANYOF,records]]); 				
					}
				}
				
				
				//ATP-1132 end
		}

			return {
				beforeLoad: beforeLoad,
				beforeSubmit: beforeSubmit,
				afterSubmit: afterSubmit
			};

		});