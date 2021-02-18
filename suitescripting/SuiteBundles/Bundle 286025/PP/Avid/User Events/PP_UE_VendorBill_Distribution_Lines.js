/**
 * Hook AvidInvoice functionality into NetSuite's vendor bill & credit records: add distribution lines from invoice as expense items
 * 
 * Version    Date            Author           Remarks
 * 2.11       01 Jun 2017     jreid            S15719 Create Bill Credit from Negative Amount Invoice
 * 2.10.3	  01 Aug 2017 	  shale				S16558 - consolidating scripts, updating error handling
 */

var optionListArray = [];
function beforeLoad(type, form, request) {
	try {
		//get script parameter
		var context = nlapiGetContext();
		var aiParam = context.getSetting('SCRIPT', 'custscript_pp_enable_dist_line_map');
		var headerToExpenseLineParam = context.getSetting('SCRIPT', 'custscript_pp_enable_header_to_line_map');
//		nlapiLogExecution('debug', 'headerToExpenseLineParam', headerToExpenseLineParam);
//		nlapiLogExecution('debug', 'aiParam', aiParam);
		if (aiParam == 'T' && request != undefined) { 
			var aiId = request.getParameter('ai_id');
			nlapiLogExecution('debug', 'aiId', aiId);
			var transform = request.getParameter('transform');
			nlapiLogExecution('debug', 'transform', transform);
			var lineTypeParam = context.getSetting('SCRIPT', 'custscript_pp_dist_line_map_select');
			if (lineTypeParam == 1) {
				var lineType = 'expense';
			} else if (lineTypeParam == 2) {
				var lineType = 'item';
			}
			else {
				errorMessage += "You must select a Distribution line mapping type.";
				lineType = '';
			}
			nlapiLogExecution('debug', 'lineTypeParam: ' + lineTypeParam, 'lineType: ' + lineType);

			var compid = request.getParameter('compid'); //only really comes up with testdrive accounts, but sometimes that rolls the ai_id parameter up into them, so this is a workaround
			if ((aiId =='' || aiId == null) && (compid != '' && compid != null)) {
				//get aiId from compid
				aiId = compid.substr(compid.lastIndexOf('=') + 1);
//				nlapiLogExecution('debug', 'new aiId', aiId);
			}

			if (aiId != null && aiId != '' && (transform == '' || transform == null) && lineType != '') { //as long as there is an ai_id parameter, but it is not coming from a PO
				//look up rawdata field from associated AI Imported Invoice record
				var rawData = nlapiLookupField('customrecord_ai_imported_invoices', aiId, 'custrecord_ai_inv_raw_data');
				//nlapiLogExecution('debug', 'rawData', rawData);
//				nlapiLogExecution('debug', 'rawData length', rawData.length);

				//parse json
				var afnData = JSON.parse(rawData);
				var afnId = afnData.Id;
//				nlapiLogExecution('debug', 'afnId', afnId);

				//get associated field mapping
				var lineMappingArray = getFieldMapping(afnData, 'lineToLine', lineType); //array of objects w field mapping info	

				if (headerToExpenseLineParam == 'T') {
					var headerToLineMap = getFieldMapping(afnData, 'headerToLine', lineType);
				}		


				var distLines = [];
				distLines = afnData.Distributions;
				//for each distribution line
				//get field mapping for description specifically, as it's outside the  regular array we're going through.
				var nsDescriptionField = getDescriptionMapping();
				nlapiLogExecution('audit', 'nsDescriptionField', nsDescriptionField);
				var curRec = nlapiGetNewRecord();
				var errorMessage = curRec.getFieldValue('custbody_pp_afn_error');
				if (errorMessage == null || errorMessage == undefined) {
					errorMessage = '';
				}

				//add hidden field in case of tax code mapping
				var tcValueField = form.addField('custpage_tcvalue_field', 'textarea', 'TaxCodeList');
				tcValueField.setDisplayType('hidden');
				var tcValueString = '';
				var tcDescField = form.addField('custpage_tcdesc_field', 'textarea', 'TaxCodeList');
				tcDescField.setDisplayType('hidden');
				var tcDescString = '';

//				nlapiLogExecution('debug', 'errorStart', errorMessage);

				for (b = 0; b < distLines.length; b++) {

					//maybe figure out way to go through first line and determine while enterprise codes need to be looked at?
					curRec.selectNewLineItem(lineType); //create new expense or item line
					var line = b+1;
					var distFields = [];
					distFields = afnData.Distributions[b].EnterpriseCodes;
					nlapiLogExecution('debug', 'distFields.length', distFields.length);

					//setting amount earlier, as we'll need it for tax code process.

					//set amount, which is also in a different part of the JSON
					//nlapiSetCurrentLineItemValue('expense', 'amount', afnData.Distributions[b].Amount); //get from amount field in distribution line - not in enterprise code section of json
					//S15719: Deploy to vendorcredits for negative total invoices; set amount to a positive value
//					nlapiLogExecution('debug', 'RecordType', nlapiGetRecordType());
					
					if(nlapiGetRecordType()=='vendorcredit'){
						curRec.setCurrentLineItemValue(lineType, 'amount', -(afnData.Distributions[b].Amount));
					} else {
						curRec.setCurrentLineItemValue(lineType, 'amount', afnData.Distributions[b].Amount);
					}
					nlapiLogExecution('debug', 'amount', curRec.getCurrentLineItemValue(lineType, 'amount'));


					for (c = 0; c < lineMappingArray.length; c++) {
						for (d = 0; d < distFields.length; d++) {

							if (lineMappingArray[c].aiField == distFields[d].EnterpriseCodeGroups[0].CodeGroupName) {
								var nsFieldId = lineMappingArray[c].nsFieldId;
			
								//get field type - if it's a list (but not the accounting field), treat differently
								var fieldType = lineMappingArray[c].nsFieldType;
								var AIFieldName = lineMappingArray[c].aiField;
								//nlapiLogExecution('debug', 'fieldType', fieldType);

								//account and other record fields will be pulling from the Description in AI, rather than the printed value, as that is where we'll store the account internalID
								nlapiLogExecution('debug', 'nsFieldId', nsFieldId);
								var fieldValue = distFields[d].EnterpriseCodeValue;
								var descValue = distFields[d].EnterpriseCodeValueDescription;

								var nullValue = context.getSetting('SCRIPT', 'custscript_pp_null_value');
								if (fieldValue == nullValue) {
									fieldValue = null;
									nlapiLogExecution('debug', 'AI Field ' + AIFieldName + ' is set to null value ' + nullValue + '. Setting value to null.');
								}

								if (fieldValue != null) {
									nlapiLogExecution('debug', 'before switch linetype check', lineType);
									switch (fieldType) { //limited types currently available in line to line options in AvidInvoice
										case 'List/Record':
											errorMessage = setListField(fieldValue, nsFieldId, AIFieldName, errorMessage, line, optionListArray, curRec, false, descValue, lineType);
											break;
										case 'Check Box':
											errorMessage = setCheckBoxField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
											break;
										default:
											errorMessage = setOtherField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
									}
								} else {
									nlapiLogExecution('debug', 'No Field Value for ' + AIFieldName, 'Could not map to NS Field ' + nsFieldId);
								}
								if (nsFieldId == 'taxcode') {
									nlapiLogExecution('debug', 'updating tax code fields', fieldValue + '/' + descValue);
									//update temp tax code field
									tcValueString += fieldValue;
									tcValueString += ',';
									tcDescString += descValue;
									tcDescString += ',';
									curRec.setFieldValue('custpage_tcvalue_field', tcValueString);
									curRec.setFieldValue('custpage_tcdesc_field', tcDescString);
									nlapiLogExecution('audit', 'custpage_tcdesc_field', tcDescString);
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
								curRec.setCurrentLineItemValue(lineType, nsDescriptionField, afnData.Distributions[b].Description);
							}
						} catch (ex) {
							errorMessage += "There was an error adding info to field " + nsDescriptionField + ": " + ex.message + '\n';
						}
					}

					if (headerToExpenseLineParam == 'T' && headerToLineMap != null) {
						errorMessage = addToLineFields(headerToLineMap, errorMessage, curRec, lineNum, optionListArray, lineType);
					} else if (headerToLineMap == null && headerToExpenseLineParam == 'T') {
						nlapiLogExecution('error', 'Cannot find headerToExpenseLineMap values', 'HeaderToExpenseLineMap array is empty');
					}

					//save line
					try {
						curRec.commitLineItem(lineType); 
					} catch(ex) {
						var lineNum = c + 1;
						errorMessage += 'There was an error adding line ' + lineNum + ': ' + ex.message + '\n';
			
					}
				}

				if (errorMessage != '') {
					nlapiSetFieldValue('custbody_pp_afn_error', errorMessage);
					nlapiLogExecution('debug', 'final error', errorMessage);
				}


			} else if (lineType == '') {
				if (errorMessage != '') {
					nlapiSetFieldValue('custbody_pp_afn_error', errorMessage);
					nlapiLogExecution('debug', 'final error', errorMessage);
				}
			}
		}
	} catch(ex) {
		nlapiLogExecution('ERROR', 'ERROR', ex.message);
	}
}
