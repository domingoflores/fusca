/**
 * PP_Lib_AvidSuite_2.js
 * @NApiVersion 2.x
 */

define(['N/search', 'N/record', 'N/runtime'],
function(search, record, runtime) {

	function getFieldMapping(afnData, mapType, lineType) {
		try{
			var fieldFilters = [];
			fieldFilters.push(search.createFilter({
				name: 'isinactive',
				operator: search.Operator.IS,
				values: false
			}));
			log.debug({
				title: 'getFieldMapping mapType',
				details: mapType
			});

			if (mapType == 'lineToLine') {
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_ns_header',
					operator: search.Operator.IS,
					values: false
				}));
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_ai_header',
					operator: search.Operator.IS,
					values: false
				}));
			} else if (mapType == 'headerToLine'){
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_ns_header',
					operator: search.Operator.IS,
					values: false
				}));
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_ai_header',
					operator: search.Operator.IS,
					values: true
				}));
			} else if(mapType == 'headerToHeader') {
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_ns_header',
					operator: search.Operator.IS,
					values: true
				}));
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_ai_header',
					operator: search.Operator.IS,
					values: true
				}));
			} else {
				log.error({
					title: 'Error in mapType',
					details: 'Did not recognize mapType: ' + mapType
				});
			}

			// log.debug({
			// 	title: 'getFieldMapping: lineType',
			// 	details: lineType
			// });
			
			if (lineType == 'expense') { //expense
				log.debug({
					title: 'adding expense filter',
					details: ''
				});
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_expense',
					operator: search.Operator.IS,
					values: true
				}));
			} else if (lineType == 'item') { //item
				fieldFilters.push(search.createFilter({
					name: 'custrecord_pp_fm_item',
					operator: search.Operator.IS,
					values: true
				}));
				log.debug({
					title: 'adding item filter',
					details: ''
				});
			}

			var fieldColumns = [
				'custrecord_pp_fm_ns_internal_id',
				'custrecord_pp_ns_field_type',
				'custrecord_pp_avid_invoice_field',
				'custrecord_pp_fm_ns_field_name'
			];

			var mappingSearch = search.create({
				type: 'customrecord_pp_field_mapping',
				filters: fieldFilters,
				columns: fieldColumns,
				title: 'FieldMapping search'
			});
			
			//put results into an array, so we can use the AvidInvoice Field as a key, when going through the JSON data sent
			var mappingArray = [];

			mappingSearch.run().each(function(result) {
				var AIFieldName = result.getValue({
					name: 'custrecord_pp_avid_invoice_field'
				});
				log.debug({
					title: 'AIFieldName',
					details: AIFieldName + ', nsFieldName = ' + result.getValue({
						name: 'custrecord_pp_fm_ns_field_name'
					})
				});

				var map = new fieldMapping(AIFieldName, result.getValue({
					name: 'custrecord_pp_fm_ns_internal_id'
				}), result.getValue({
					name: 'custrecord_pp_fm_ns_field_name'
				}), result.getText({
					name: 'custrecord_pp_ns_field_type'
				}));
				if (AIFieldName.indexOf('.') != -1 && afnData != null) {
					map["aiValue"] = getDotData(afnData, AIFieldName);
				} else {
					map["aiValue"] = afnData[AIFieldName];
				}
				mappingArray.push(map);
				log.debug({
					title: 'mapping array info',
					details: map["aiValue"] + 'afnData[AIFieldName] = ' + afnData[AIFieldName]
				});
				return true;
			});
			log.debug({
				title: 'mapping array type: ' + mapType,
				details: 'length: ' + mappingArray.length
			});
			return mappingArray;
			
		} catch(ex) {
			log.error({
				title: 'Error in getFieldMapping',
				details: ex.message
			});
		}
	}

	function fieldMapping(aiField, nsFieldId, nsLabel, nsFieldType) {
		this.aiField = aiField;
		this.nsFieldId = nsFieldId;
		this.nsLabel = nsLabel;
		this.nsFieldType = nsFieldType;
		this.aiValue = ''
	}

	function selectListObj(nsFieldId, selectText, selectId) {
		this.nsFieldId = nsFieldId;
		this.selectText = selectText;
		this.selectId = selectId;
	}

	function getDescriptionMapping() {
		//find mapping record for AI Description field
		var fil= [];
		fil.push(search.createFilter({
			name: 'isinactive',
			operator: search.Operator.IS,
			values: false
		}));
		fil.push(search.createFilter({
			name: 'custrecord_pp_avid_invoice_field',
			operator: search.Operator.IS,
			values: 'Description'
		}));

		var col = [
			'internalid',
			'custrecord_pp_fm_ns_internal_id'
		];

		var resSearch = search.create({
			type: 'customrecord_pp_field_mapping',
			filters: fil,
			columns: col,
			title: 'descSearch'
		});

		var res = resSearch.run().getRange({
			start: 0,
			end: 1
		});
		// log.debug({
		// 	title: 'res check',
		// 	details: res
		// });

		if (res != null && res.length != 0) {
			var descriptionNSField = res[0].getValue({
				name: 'custrecord_pp_fm_ns_internal_id'
			});
			return descriptionNSField;
		} else {
			return null;
		}
	}

	function setCheckBoxField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType, line) {
		//translates Yes, No, True, or False (with any capitalization) to T/F that can be read by NS
		if (typeof fieldValue == "boolean") {
			if (fieldValue == true) {
				fieldValue = 'T';
			} else if (fieldValue == false) {
				fieldValue = 'F';
			}
		} else if (typeof fieldValue == "string") {
			fieldValue = fieldValue.toLowerCase();
			
			if (fieldValue == 'true' || fieldValue== 'yes' || fieldValue == 't') {
				fieldValue = 'T';
			}
			if (fieldValue == 'false' || fieldValue == 'no' || fieldValue == 'f') {
				fieldValue = 'F';
			}		
		}
		
		try {
			if (isHeader) {
				curRec.setValue({
					fieldId: nsFieldId,
					value: fieldValue
				});
			} else {
				curRec.setSublistValue({
					sublistId: lineType,
					fieldId: nsFieldId,
					value: fieldValue,
					line: line
				});
			}
		} catch (ex) {
			errorMessage += "There was an error adding info to field " + nsFieldId + ex.message;
			log.error({
				title: 'There was an error adding info to field ' + nsFieldId,
				details: ex.message
			});
		}
		return errorMessage;
	}

	function setListField (fieldValue, nsFieldId, AIFieldName, errorMessage, line, optionListArray, curRec, isHeader, descValue, lineType, curForm) {
		// log.debug({
		// 	title: 'start setListField',
		// 	details: nsFieldId
		// });

		if (optionListArray == null) {
			optionListArray = [];
		}

		if (isHeader) {
			// log.audit({
			// 	title: 'entity check',
			// 	details: curRec.getValue({fieldId: 'entity'})
			// });

			//need to pull the field from the form, not the record, if it's in the UE script
			if (runtime.executionContext == runtime.ContextType.SCHEDULED) {
				var nsFieldObj = curRec.getField({
					fieldId: nsFieldId
				});
			} else {
				//get the field object from the form
				var nsFieldObj = curForm.getField({
					id: nsFieldId
				});
			}

		} else {
			//if descValue is numbers only, it's an internal ID - just set it. Otherwise, continue on. This only works for line items, not for header fields in AI
			log.debug({
				title: 'line descValue',
				details: descValue + ', typeOf: ' + typeof descValue
			});

			//if this is coming from the UE script, we need to pull the field object from the form, not the record
			//the record is not in dynamic mode, and we won'tbe able to get the select options
			//if (nlapiGetContext().getExecutionContext() == 'scheduled') {
			if (runtime.executionContext == runtime.ContextType.SCHEDULED) {
				var nsFieldObj = curRec.getSublistField({
					sublistId: lineType,
					fieldId: nsFieldId,
					line: line
				});
			} else {
				//get the field object from the form
				var sublistObj = curForm.getSublist({
					id: lineType
				});
				var nsFieldObj = sublistObj.getField({
					id: nsFieldId
				});
			}
			//nsFieldObj = null;
			if (descValue != undefined && descValue != null && (typeof descValue == 'number' || descValue.match(/^\d+$/) != null)) {
				try {
					log.debug({
						title: 'entering descValue directly',
						details: 'start on line ' + line
					});

					curRec.setSublistValue({
						sublistId: lineType,
						fieldId: nsFieldId,
						value: descValue,
						line: line
					});
					log.debug({
						title: 'sublist check',
						details: curRec.getSublistValue({
							sublistId: lineType,
							fieldId: nsFieldId,
							line: line
						})
					});
					//we can't pull the text from a field on a beforeLoad function - see https://tstdrv1069938.app.netsuite.com/app/help/helpcenter.nl?fid=section_4273167233.html#bridgehead_4447640394
					//This guidance also affects user event scripts that instantiate records by using the newRecord or oldRecord object provided by the script context. These records always use deferredDynamic mode. For that reason, this error appears in both of the following situations:
					//When a user event script executes on a record that is being newly created, and the script attempts to use getSublistText() without first using setSublistText() for the same field.
					
					//get select options
					//find select options for value we've set
					//continue from there.
					var curText = getTextFromSelect(nsFieldId, nsFieldObj, descValue);
					// var curText = curRec.getSublistText({
					// 	sublistId: lineType,
					// 	fieldId: nsFieldId,
					// 	line: line
					// });
					log.debug({
						title: 'curText',
						details: curText
					});

					// // ///TAXCODE SUBSIDIARY ISSUE TEST
					 if (nsFieldId == 'taxcode') {
					// 	var curText = '';
					 	errorMessage = handleTaxCode(fieldValue, descValue, errorMessage, line, curRec, lineType);
					 }
					if ((curText == '' || curText == undefined || curText == null) && nsFieldId != 'taxcode') {
						//throw error
						//UNLESS it's taxcode, which will return nothing until after the line has been committed, because NetSuite
						//reset field to blank
						curRec.setSublistValue({
							sublistId: lineType,
							fieldId: nsFieldId,
							value: null,
							line: line
						});
						log.error({
							title: 'Error directly setting descValue for ' + nsFieldId,
							details: descValue + ', ' + fieldValue + '. '
						});
						errorMessage += 'Could not set record field exactly for NetSuite field ' + nsFieldId + '. Internal ID ' + descValue + ' for ' + fieldValue + ' not found. ';
					} else if ((curText == '' || curText == undefined || curText == null) && nsFieldId == 'taxcode') {
						//tax code won't show as having a value until after the line is saved anyway
						//field is required where it is used, so an incorrect field will already cause an error
						log.debug({
							title: 'tax code - ' + nsFieldId,
							details: 'continuing, set as ' + descValue
						});

					}
					return errorMessage;
	//					}
				}catch (ex) {
					log.error({
						title: 'Error directly setting descValue for ' + nsFieldId,
						details: descValue + ', ' + fieldValue + '. '
					})
					errorMessage += 'Could not set record field exactly for NetSuite field ' + nsFieldId;
				}
			}

			// //if this is coming from the UE script, we need to pull the field object from the form, not the record
			// //the record is not in dynamic mode, and we won'tbe able to get the select options
			// //if (nlapiGetContext().getExecutionContext() == 'scheduled') {
			// if (runtime.executionContext == runtime.ContextType.SCHEDULED) {
			// 	var nsFieldObj = curRec.getSublistField({
			// 		sublistId: lineType,
			// 		fieldId: nsFieldId,
			// 		line: line
			// 	});
			// } else {
			// 	//get the field object from the form
			// 	var sublistObj = curForm.getSublist({
			// 		id: lineType
			// 	});
			// 	var nsFieldObj = sublistObj.getField({
			// 		id: nsFieldId
			// 	});
			// }
		}

		if (nsFieldObj == null) {
			errorMessage += 'Could not find field ' + nsFieldId;
			log.error({
				title: 'error in setListField',
				details: 'Could not find field object ' + nsFieldId
			});
			return errorMessage;
		}
		
		try {
			var selectOption = [];
			selectOption = nsFieldObj.getSelectOptions(); //need this, otherwise it limits itself to the list fetched in the first line, for some unknown NS quirk reason
			log.debug({
				title: 'selectOption List',
				details: selectOption.length + ' for line ' + line + '. Is from header? ' + isHeader
			});
		} catch (ex) {
			log.error({
				title: 'error in select option for line ' + line,
				details: ex.message
			});
		}

		//Messy workaround for a bug in NS - otherwise later lines will not allow us to get the full range of select option
		if (optionListArray[nsFieldId] == null || optionListArray[nsFieldId] == undefined) {
			for (var q = 0; q<selectOption.length; q++) {
				var currentSOText = selectOption[q].text;
				currentSOText = currentSOText.replace(/^(&nbsp;)+/gi,'');

				optionListArray[currentSOText] = new selectListObj(nsFieldId, currentSOText, selectOption[q].value);
			}
		} else {
			log.debug({
				title: 'already made a list for field', 
				details:nsFieldId
			});
		}


		if (optionListArray[fieldValue] != null && optionListArray != undefined) {
			selectFieldValue = optionListArray[fieldValue].selectId;

			try {
				if (isHeader) {
					curRec.setValue({
						fieldId: nsFieldId,
						value: selectFieldValue
					});
				} else {
					curRec.setSublistValue({
						sublistId: lineType,
						fieldId: nsFieldId,
						line: line,
						value: selectFieldValue
					});
				}
			} catch(ex) {
				log.error({
					title: 'Error setting field ' + nsFieldId,
					details: ex.message
				});
				errorMessage += "There was an error adding info to field " + nsFieldId + ex.message;
			}
			//if that doesn't work, try internal id?

		} else {
			try {
				//try setting it directly with the field value, which might be the internal ID of the value
				log.debug({
					title: 'Trying field value directly',
					details: 'Could not find matching value for ' + fieldValue + '. Trying to enter it directly.'
				});

				if (typeof fieldValue == 'number' || fieldValue.match(/^\d+$/) != null) { //only if value is entirely numbers is this possible
					// log.debug({
					// 	title: 'is digits only'
					// });
					fieldValue = parseInt(fieldValue);
					if (isHeader) {
						log.debug({
							title: 'FieldValue is int for ns field ' + nsFieldId,
							details: fieldValue + typeof fieldValue
						});

						curRec.setValue({
							fieldId: nsFieldId,
							value: fieldValue
						});

					} else {
						curRect.setSublistValue({
							sublistId: lineType,
							fieldId: nsFieldId,
							line: line,
							value: fieldValue
						});
					}
				} else {
					log.debug({
						title: 'Value not integers',
						details: 'stopping'
					});
					//throw field error
					log.error({
						title: 'Error in select options',
						details: 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue
					});
					errorMessage += 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue + '\n';
				}
			} catch (ex) {
				//throw field error
				log.error({
					title: 'Error in Select Options',
					details: 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue
				});
				errorMessage += 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue + '\n';
			}
		}
		return errorMessage;
	}


	function handleTaxCode(fieldValue, descValue, errorMessage, line, curRec, lineType) {
		try {

			log.debug({
				title: 'start handleTaxCode'
			});
			//GET AMOUNT
			var aiAmount = curRec.getSublistValue({
				sublistId: lineType,
				fieldId: 'amount',
				line: line
			});
			var isOneWorld = runtime.isFeatureInEffect({
				feature: 'SUBSIDIARIES'
			});
	//Formula:		newAmount + newAmount*taxRate = AIAmount

			//look up tax code info
			var tcFieldList = ['rate', 'country'];
			if (isOneWorld) {
				tcFieldList.push('subsidiary');
			}
			var taxCodeFields = search.lookupFields({
				type: search.Type.SALES_TAX_ITEM,
				id: descValue,
				columns: tcFieldList
			});
			//not sure subsidiary is an allowed lookup here
			//only need to check country if it's a oneworld account, as otherwise it's US
			if (isOneWorld) {
				if (taxCodeFields != null) {
					var country = taxCodeFields.country[0].value;
				} else {
					var country = null;
				}
				log.debug({
					title: 'country',
					details: country
				});

				var subsidiary = curRec.getValue({
					fieldId: 'subsidiary'
				}); //pulls 2 letter country code
				if (subsidiary != null) {
					var subsidC = search.lookupFields({
						type: search.Type.SUBSIDIARY,
						id: subsidiary,
						columns: 'country'
					});
					var subsidCountry = subsidC.country[0].value;
				} else {
					var subsidCountry = null;
				}
				log.debug({
					title: 'subsidiary: ' + subsidiary,
					details: 'subsidCountry: ' + subsidCountry
				});

				if (country == subsidCountry && country != null && country != '') {

					var rate = taxCodeFields['rate'];

					rate = rate.slice(0, -1);
					rate = parseFloat(rate);
					rate = rate/100;
					var multiple = rate + 1;
					
					//GET AMOUNT
					var aiAmount = curRec.getSublistValue({
						sublistId: lineType,
						fieldId: 'amount',
						line: line
					});
					var subTotal = (aiAmount / multiple).toFixed(2);
					var difference = aiAmount - subTotal;
					
					// log.debug({
					// 	title: 'subTotal',
					// 	details: subTotal
					// });
					curRec.setSublistValue({
						sublistId: lineType,
						fieldId: 'amount',
						value: subTotal,
						line: line
					});
					
				} else {
					log.error({
						title: 'Tax Code Mismatch',
						details: 'The selected tax code,' + descValue + ', is not available for this vendor in this subsidiary.'
					});
					curRec.setSublistValue({
						sublistId: lineType,
						fieldId: 'grossamt',
						line: line,
						value: aiAmount
					});
					errorMessage += " The selected tax code is not valid for the vendor/subsidiary on line " + line + ". The amount listed on this line INCLUDES tax, and may need to be adjusted." + '\n';
				}
			}


		} catch(ex) {
			log.error({
				title: 'error in handleTaxCode',
				details: ex.message
			});
			errorMessage += "There was an error in handling the tax code. " + ex.message + '\n';
		}

		return errorMessage;
	}

	function setDateField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType, line) {
		try {
			// log.debug({
			// 	title: 'setDateField start',
			// 	details: 'nsFieldId: ' + nsFieldId + ', line: ' + line
			// });
			if (fieldValue != null) {
				var date = formatDate(fieldValue);
				if (isHeader) {
					curRec.setValue({
						fieldId: nsFieldId,
						value: date
					});
				} else {
					curRec.setSublistValue({
						sublistId: lineType,
						fieldId: nsFieldId,
						line: line,
						value: date
					});
				}
			}
			// log.debug({
			// 	title: 'setDateField end'
			// });
		} catch(ex) {
			errorMessage += "There was an error adding info to field " + nsFieldId + ': ' + ex.message + '\n';
		}

		return errorMessage;
	}

	function setOtherField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType, line) {
		log.debug({
			title: 'setOtherField',
			details: nsFieldId
		});
		try {
				if (fieldValue != null) {
					fieldValue = fieldValue.toString();
				} else {
					fieldValue = '';
				}
				if (isHeader) {
					curRec.setValue({
						fieldId: nsFieldId,
						value: fieldValue
					});
				} else {
					curRec.setSublistValue({
						sublistId: lineType,
						fieldId: nsFieldId,
						line: line,
						value: fieldValue
					});
				}
		} catch(ex) {
			var lineNum = c + 1;
			errorMessage += 'There was an error adding info to field ' + nsFieldId + ': ' + ex.message + '\n';
		}

		return errorMessage;
	}

	function setCurrencyField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType, line) {
		
		try {
			if (isHeader) {
				curRec.setValue({
					fieldId: nsFieldId,
					value: fieldValue.toFixed(2)
				});
			} else {
				curRec.setSublistValue({
					sublistId: lineType,
					fieldId: nsFieldId,
					value: fieldValue.toFixed(2),
					line: line
				});
			}
		} catch(ex) {
			errorMessage += 'There was an error adding info to field ' + nsFieldId + ': ' + ex.message + '\n';
		}
		return errorMessage;
	}

	function getDotData(data, aiFieldName) {
		try{
			// log.debug({
			// 	title: 'getDotData aiFieldName start',
			// 	details: aiFieldName
			// });

			var topLevelName = aiFieldName.substring(0, aiFieldName.indexOf('.'));
			var remainingName = aiFieldName.substring((aiFieldName.indexOf('.') + 1));
			// log.debug({
			// 	title: 'top level/remaining name',
			// 	details: topLevelName + ' / ' + remainingName
			// });

			var remainingData = data[topLevelName];

			if (remainingName.indexOf('.') != -1) {
				log.debug({
					title: 'getDotData - rerun',
					details: 'remainingData: ' + remainingData + ' remainingName: ' + remainingName
				});
				return getDotData(remainingData, remainingName);
			} else {

				return remainingData[remainingName];
			}
		} catch(ex) {
			log.error({
				title: 'error in getDotData',
				details: ex.message
			});
		}
	}

	function addToLineFields(mapArray, errorMessage, curRec, lineNum, optionListArray, lineType) {
		//var curErrorMessage = errorMessage;
		var nullValue = runtime.getCurrentScript().getParameter({
			name: 'custscript_pp_null_value'
		});
		log.debug({
			title: 'addToLineFields lineType check',
			details: lineType + ', lineNum: ' + lineNum + ', mapArray.length: ' + mapArray.length
		});

		for (var d = 0; d < mapArray.length; d++) {
			var fieldType = mapArray[d].nsFieldType;
			var nsFieldId = mapArray[d].nsFieldId;
			var AIFieldName = mapArray[d].aiField;
			var fieldValue = mapArray[d].aiValue;

			log.debug({
				title: 'datacheck',
				details: "nsFieldId: " + nsFieldId + ', nullValue: ' + nullValue + ', fieldType: ' + fieldType
			});

			if (nullValue == fieldValue) {
				fieldValue = null;
				log.debug({
					title: 'AI Field ' + AIFieldName + ' is set to null value ' + nullValue + '. Setting value to null.'
				});
			}

			if (fieldValue != null) {
				switch (fieldType) {
					case 'List/Record':
						errorMessage = setListField(fieldValue, nsFieldId, AIFieldName, errorMessage, lineNum, optionListArray, curRec, false, null, lineType);
						break;
					case 'Check Box':
						errorMessage = setCheckBoxField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType, lineNum);
						break;
					case 'Date':
						errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType, lineNum);
						break;
					case 'Date/Time':
						errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType, lineNum);
						break;
					case 'Currency':
						errorMessage = setCurrencyField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType, lineNum);
						break;
					default:
						errorMessage = setOtherField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType, lineNum);
				}
			}
		}

		return errorMessage;
	}

	function formatDate(jsonDate) {
		var t = jsonDate.indexOf('T');
		var date = jsonDate.substring(0,t);
		var dateParts = date.split('-');
		date = dateParts[1]+'/'+dateParts[2]+'/'+dateParts[0];
		var day = parseInt(dateParts[2], 10);
		var month = parseInt(dateParts[1], 10);
		month -= 1;
		var year = parseInt(dateParts[0]);
		//dateParts[1] = parseInt(dateParts[1]);
		var dateObj = new Date(year, month, day);
		return dateObj;
	}

	function getTextFromSelect(nsFieldId, nsFieldObj, descValue) {
		try{
			// log.debug({
			// 	title: 'start getTextFromSelect',
			// 	detail: nsFieldId
			// });
			curText = '';
			//get select options
			var select = nsFieldObj.getSelectOptions();
			// log.debug({
			// 	title: 'select',
			// 	details: select.length + ', descValue: ' + descValue
			// });
			//check if we have a value that matches the ID
			for(var q = 0; q < select.length; q++) {
				if (select[q].value == descValue) {
					log.debug({
						title: 'Found curText!',
						details: select[q].text
					});
					curText = select[q].text;
				} else {
				}
			}
			//return that value, or null
			return curText;
		} catch(ex) {
			log.error({
				title: 'error in getTextfromSelect',
				details: ex.message
			});
		}
	}

	return {
		getFieldMapping: getFieldMapping,
		fieldMapping: fieldMapping,
		selectListObj: selectListObj,
		getDescriptionMapping: getDescriptionMapping,
		setCheckBoxField: setCheckBoxField,
		setListField: setListField,
		handleTaxCode: handleTaxCode,
		setDateField: setDateField,
		setOtherField: setOtherField,
		setCurrencyField: setCurrencyField,
		getDotData: getDotData,
		addToLineFields: addToLineFields,
		formatDate: formatDate,
		getTextFromSelect: getTextFromSelect
	}
});