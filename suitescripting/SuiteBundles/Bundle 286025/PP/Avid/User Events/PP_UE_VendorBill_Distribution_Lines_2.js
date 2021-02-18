/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */

 define(['N/log', 'N/search', 'N/record', 'N/runtime', 'N/ui/serverWidget', '../Library Scripts/PP_LIB_AvidSuite_2'],
 	function(log, search, record, runtime, ui, lib) {
 		var optionListArray = [];
 		function beforeLoad(context) {
 			try {
 				//get script parameter
 				var user = runtime.getCurrentUser();
 				var aiParam = user.getPreference({
 					name: 'custscript_pp_enable_dist_line_map'
 				});
 				var headerToExpenseLineParam = user.getPreference({
 					name: 'custscript_pp_enable_header_to_line_map'
 				});
 				var errorMessage = '';

 				if (aiParam == 'T' && context.request != undefined) {
 					var aiId = context.request.parameters['ai_id'];
 					
 					log.debug({
 						title: 'ai_id',
 						details: aiId
 					});

 					var transform = context.request.parameters['transform'];
 					var lineTypeParam = user.getPreference({
 						name: 'custscript_pp_dist_line_map_select'
 					});
 					if (lineTypeParam == 1) {
 						var lineType = 'expense';
 					} else if (lineTypeParam == 2) {
 						var lineType = 'item';
 					} else {
 						errorMessage += "You must select a Distribution line mapping type. ";
 						var lineType = '';
 					}

 					// log.debug({
 					// 	title: 'lineTypeParam: ' + lineTypeParam,
 					// 	details: 'lineType: ' + lineType
 					// });

 					var compid = context.request.parameters['compid']; //only really comes up with testdrive accounts, but sometimes that rolls the ai_id parameter up into them, so this is a workaround
 					if ((aiId == '' || aiId == null) && (compid != '' && compid != null)) {
 						//get aiId from compid
 						aiId = compid.subst(compid.lastIndexOf('=') + 1);
 					}
 					
 					if (aiId != null && aiId != '' && (transform == '' || transform == null) && lineType != '') { //as long as there is an ai_id parameter, but it is not coming from a PO
						//look up rawdata field from associated AI Imported Invoice record
						var rawDataResult = search.lookupFields({
							type: 'customrecord_ai_imported_invoices', 
							id: aiId,
							columns: ['custrecord_ai_inv_raw_data']
						});
						var rawData = rawDataResult['custrecord_ai_inv_raw_data'];

						//parse json
						var afnData = JSON.parse(rawData);
						var afnId = afnData.Id;
						
						log.debug({
							title: 'afnId',
							details: afnId
						});
						var form = context.form;

						//get associated field mapping
						var lineMappingArray = lib.getFieldMapping(afnData, 'lineToLine', lineType); //array of objects w field mapping info	

						if (headerToExpenseLineParam == 'T') {
							var headerToLineMap = lib.getFieldMapping(afnData, 'headerToLine', lineType);
						}

						var distLines = [];
						distLines = afnData.Distributions;
						//for each distribution line
						//get field mapping for description specifically, as it's outside the  regular array we're going through.
						var nsDescriptionField = lib.getDescriptionMapping();
						var curRec = context.newRecord; ///this is in standard mode. This may cause problems later in the setListField function

						errorMessage = curRec.getValue({
							fieldId: 'custbody_pp_afn_error'
						});
						if (errorMessage == null || errorMessage == undefined) {
							errorMessage = '';
						}	

						//add hidden field in case of tax code mapping
						var tcValueField = form.addField({
							id: 'custpage_tcvalue_field',
							type: ui.FieldType.TEXTAREA,
							label: 'TaxCodeList'
						});
						tcValueField.updateDisplayType({
							displayType: ui.FieldDisplayType.HIDDEN
						});
						var tcValueString = '';
						var tcDescField = form.addField({
							id: 'custpage_tcdesc_field',
							type: ui.FieldType.TEXTAREA,
							label: 'TaxCodeList'
						});
						tcDescField.updateDisplayType({
							displayType: ui.FieldDisplayType.HIDDEN
						});
						var tcDescString = '';

						for (b = 0; b < distLines.length; b++) {

							//maybe figure out way to go through first line and determine while enterprise codes need to be looked at?
							//can't use 'selectNewLine' and 'currentSublist' calls, because this record is loaded in standard mode

							//var line = b+1;
							var line = b; //lines start at 0 in SuiteScript 2.0
							var distFields = [];
							distFields = afnData.Distributions[b].EnterpriseCodes;
							// log.debug({
							// 	title: 'distFields.length',
							// 	details: distFields.length
							// });

							//setting amount earlier, as we'll need it for tax code process.

							//set amount, which is also in a different part of the JSON
							//nlapiSetCurrentLineItemValue('expense', 'amount', afnData.Distributions[b].Amount); //get from amount field in distribution line - not in enterprise code section of json
							//S15719: Deploy to vendorcredits for negative total invoices; set amount to a positive value
							
							if(curRec.type == 'vendorcredit') {
								curRec.setSublistValue({
									sublistId: lineType,
									fieldId: 'amount',
									value: -(afnData.Distributions[b].Amount),
									line: line
								});
							} else {
								curRec.setSublistValue({
									sublistId: lineType,
									fieldId: 'amount',
									value: afnData.Distributions[b].Amount,
									line: line
								});
							}
							// log.debug({
							// 	title: 'amount',
							// 	details: curRec.getSublistValue({
							// 		sublistId: lineType,
							// 		fieldId: 'amount',
							// 		line: line
							// 	})
							// });

							for (c = 0; c < lineMappingArray.length; c++) {
								for (d = 0; d < distFields.length; d++) {

									if (lineMappingArray[c].aiField == distFields[d].EnterpriseCodeGroups[0].CodeGroupName) {
										var nsFieldId = lineMappingArray[c].nsFieldId;
					
										//get field type - if it's a list (but not the accounting field), treat differently
										var fieldType = lineMappingArray[c].nsFieldType;
										var AIFieldName = lineMappingArray[c].aiField;
										//nlapiLogExecution('debug', 'fieldType', fieldType);

										//account and other record fields will be pulling from the Description in AI, rather than the printed value, as that is where we'll store the account internalID
										log.debug({
											title: 'nsFieldId',
											details: nsFieldId
										});
										var fieldValue = distFields[d].EnterpriseCodeValue;
										var descValue = distFields[d].EnterpriseCodeValueDescription;

										//var nullValue = context.getSetting('SCRIPT', 'custscript_pp_null_value');
										var nullValue = user.getPreference({
						 					name: 'custscript_pp_enable_dist_line_map'
						 				});
										if (fieldValue == nullValue) {
											fieldValue = null;
											log.debug({
												title: 'AI Field ' + AIFieldName + ' is set to null value ' + nullValue,
												details: 'Setting to null'
											});
										}

										if (fieldValue != null) {
											// log.debug({
											// 	title: 'before switch linetype check',
											// 	details: lineType
											// });
											switch (fieldType) { //limited types currently available in line to line options in AvidInvoice
												case 'List/Record':
													errorMessage = lib.setListField(fieldValue, nsFieldId, AIFieldName, errorMessage, line, optionListArray, curRec, false, descValue, lineType, form);
													break;
												case 'Check Box':
													errorMessage = lib.setCheckBoxField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType, line);
													break;
												default:
													errorMessage = lib.setOtherField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType, line);
											}
											
										} else {
											log.debug({
												title: 'No field value for ' + AIFieldName,
												details: 'Could not map to NS Field ' + nsFieldId
											});
										}
										if (nsFieldId == 'taxcode') {
											//nlapiLogExecution('debug', 'updating tax code fields', fieldValue + '/' + descValue);
											log.debug({
												title: 'updating tax code fields',
												details: fieldValue + '/' + descValue
											});
											//update temp tax code field
											tcValueString += fieldValue;
											tcValueString += ',';
											tcDescString += descValue;
											tcDescString += ',';
											curRec.setValue({
												fieldId: 'custpage_tcvalue_field',
												value: tcValueString
											});
											curRec.setValue({
												fieldId: 'custpage_tcdesc_field',
												value: tcDescString
											});
											log.audit({
												title: 'custpage_tcdesc_field',
												details: tcDescString
											});
										}
									}

								}
							}

							//handle Description mapping - this is on a different level of the JSON, and needs to be handled separately
							if (nsDescriptionField != null) {
								try {
									if (afnData.Distributions[b].Description == nullValue) {
										continue;
									} else {
										curRec.setSublistValue({
											sublistId: lineType,
											fieldId: nsDescriptionField,
											value: afnData.Distributions[b].Description,
											line: line
										});
									}
								} catch (ex) {
									errorMessage += "There was an error adding info to field " + nsDescriptionField + ": " + ex.message + '\n';
								}
							}

							if (headerToExpenseLineParam == 'T' && headerToLineMap != null) {
								log.debug({
									title: 'headerToLineCheck',
									details: 'line: ' + line
								});
								errorMessage = lib.addToLineFields(headerToLineMap, errorMessage, curRec, line, optionListArray, lineType);
								// log.debug({
								// 	title: 'error check headerToExpenseLineParam',
								// 	details: errorMessage
								// });
							} else if (headerToLineMap == null && headerToExpenseLineParam == 'T') {
								log.error({
									title: 'Cannot find headerToExpenseLineMap values',
									details: 'HeaderToExpenseLineMap array is empty'
								});
							}
							

							//save line
							// try {
							// 	//record is in standard mode, so we don't need to commit the line - using the setSublistValue is enough
							// 	// curRec.commitLine({
							// 	// 	sublistId: lineType
							// 	// });
							// } catch(ex) {
							// 	var lineNum = c + 1;
							// 	errorMessage += 'There was an error adding line ' + lineNum + ': ' + ex.message + '\n';
					
							// }
						}
						//add error message into form
						if (errorMessage != '') {
							curRec.setValue({
								fieldId: 'custbody_pp_afn_error',
								value: errorMessage
							});
							log.error({
								title: 'final error',
								details: errorMessage
							});
						}
					} else if (lineType == '') {
						if (errorMessage != '') {
							curRec.setValue({
								fieldId: 'custbody_pp_afn_error',
								value: errorMessage
							});
							log.error({
								title: 'final error',
								details: errorMessage
							});
						}
					}
 				}

 			} catch(ex) {
 				log.error({
 					title: 'Error in beforeLoad',
 					details: ex.message
 				});
 			}
 		}

 		return {
 			beforeLoad: beforeLoad
 		};
 	}
 );
