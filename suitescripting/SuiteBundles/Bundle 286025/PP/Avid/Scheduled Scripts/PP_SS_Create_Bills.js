/**
 * Hook AvidInvoice functionality into NetSuite's vendor bill record
 * 
 * Version    Date            Author           Remarks
 * 2.10.1     06 Jun 2017     jreid            S16002 Create Bill Credit from Negative Amount Invoice
 * 2.10.1     07 Jun 2017     jreid            S15832 Include Vendor Account Number Override logic
 * 2.10.1     07 Jun 2017     jreid            S15833 Get the billing address id from the imported invoice, if specified.
 *			  17 Jul 2017	  shale				Add header to line mapping
 * 2.10.2     17 Jul 2017     sdonald		   	S15486 - Map AvidInvoice Header Fields to NetSuite Bill Header Fields
 * 2.10.3	  01 Aug 2017 	  shale				S16558 - consolidating scripts, updating error handling
 * 2.11.0     21 Nov 2017     shale				S18321 - Post Invoice Distribution Detail fields to the NS Bill Line Items
 * 2.16.0	  14 Nov 2018	  shale				S26864 - Adding option to not post to accounting periods that are locked but not closed
 */

var optionListArray = [];
function createBills() {
	try {
		var context = nlapiGetContext();
		var param = context.getSetting('SCRIPT', 'custscript_ia_id_list');
		var startAt = parseInt(context.getSetting('SCRIPT', 'custscript_restart_on'));
		if (startAt == ''|| startAt == NaN) {
			startAt = 0;
		}
		//nlapiLogExecution('debug', 'param', param);
        
       // Added 4/25/2017 to check for empty invoice list
      	if (param == null || param == '') {
        // nlapiLogExecution('DEBUG', 'Number of invoice items', 'Empty');
          return;
        } else {
          var aiList = param.split(',');
          var aiLength = aiList.length;
       //   nlapiLogExecution('DEBUG', 'Number of invoice items', aiLength);
        }
        var headerToLineParam = context.getSetting('SCRIPT', 'custscript_pp_enable_header_to_line_map');
        //nlapiLogExecution('audit', 'headerToLineParam', headerToLineParam);
      	
      	var lineTypeParam = context.getSetting('SCRIPT', 'custscript_pp_dist_line_map_select');
		if (lineTypeParam == 1) {
			var lineType = 'expense';
		} else if (lineTypeParam == 2) {
			var lineType = 'item';
		}
		
		var postLocked = context.getSetting('SCRIPT', 'custscript_pp_locked_periods');

		var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
		//get associated field mapping
		var lineMappingArray = getScheduledFieldMapping('lineToLine', lineType); //array of objects w field mapping info
		//nlapiLogExecution('debug', 'lineMappingArray', lineMappingArray);

		if (context.getSetting('SCRIPT', 'custscript_pp_enable_hdr_fld_map') == 'T') {
			var headerFieldMap = getScheduledFieldMapping('headerToHeader');
		}
		

		for (var a = startAt; a < aiLength; a++) {
			var status = checkRemainingUsage(context, a, param);
			if (status == 'QUEUED') {
				return; //script is going to rerun - stop running here.
			}
			var aiRec = nlapiLoadRecord('customrecord_ai_imported_invoices', aiList[a]);
			//check fi aiRec has been errored out (can happen and then  be rescheduled in rare instances)
			if (aiRec.getFieldValue('custrecord_ai_inv_bill_process_error') == 'T') {
				nlapiLogExecution('audit', 'Skipping AI Imported Invoice record ' + aiList[a], 'It has been marked as having an error');
				continue;
			}
			//check whether has a PO or not.
			var po = aiRec.getFieldValue('custrecord_ai_inv_purchase_order');
			var errorMessage = '';


			if (po != '' && po != null) {
				//transform record from PO
				//nlapiLogExecution('debug', 'PO', 'PO: ' + po);
				var rawData = aiRec.getFieldValue('custrecord_ai_inv_raw_data');
				var afnData = JSON.parse(rawData);
				try {
					var billRec = nlapiTransformRecord('purchaseorder', po, 'vendorbill'); //do we need to do more mapping here?		
				} catch (ex) {
					nlapiLogExecution('error', 'Error transforming record for PO ' + po, ex.message);
					errorAI(aiRec);
					continue;
				}

				//S15833 Get the billing address from the imported invoice, if specified.
				var invAddrId = getBillingAddress(aiRec);
				if(invAddrId){
					nlapiLogExecution('audit', 'custrecord_ai_inv_vnd_addr_id', invAddrId);
					billRec.setFieldValue('billaddresslist',invAddrId);
				}
				billRec.setFieldValue('memo', getMemo(aiRec)); //S15832 Get the memo based on the account number override logic
				billRec.setFieldValue('tranid', afnData.Number);
				
				// S15486 - Map AvidInvoice Header Fields to NetSuite Bill Header Fields
				if (context.getSetting('SCRIPT', 'custscript_pp_enable_hdr_fld_map') == 'T') {
					applyCustomHeaders(billRec, afnData, headerFieldMap, errorMessage);
				}
				
				try {
					var billId = nlapiSubmitRecord(billRec, true);
					nlapiLogExecution('debug', 'bill created from PO', billId);
				} catch (ex) {
					nlapiLogExecution('Error', 'Error creating Bill from PO', 'Could not create bill from PO: ' + po + ' and Imported Invoice: ' + aiList[a]);
					errorAI(aiRec);
				}

				//check if this is the only bill for that line. (if PO is fully billed & only one bill)
				var poStatus = nlapiLookupField('purchaseorder', po, 'status');
				//nlapiLogExecution('debug', 'po status', poStatus);
				if (poStatus == 'fullyBilled') {
					var poResults = nlapiSearchRecord('vendorbill', null, [new nlobjSearchFilter('createdfrom', null, 'anyof', po), new nlobjSearchFilter('mainline', null, 'is', 'T')], [new nlobjSearchColumn('internalid')]);
					//nlapiLogExecution('debug', 'poResults', poResults);
					if (poResults != null && poResults.length == 1) {
						aiRec.setFieldValue('custrecord_ai_inv_bill', billId);
						nlapiSubmitRecord(aiRec);
					}
				}
			} else {

				//create bill from Imported Invoice information
				var rawData = aiRec.getFieldValue('custrecord_ai_inv_raw_data');
				var afnData = JSON.parse(rawData);
				var prevBill = aiRec.getFieldValue('custrecord_ai_inv_bill');
				if (prevBill != '' && prevBill != null) { //don't want to create duplicate bills
					continue;
				}

				if (headerToLineParam == 'T') {
					var headerToLineMap = getScheduledFieldMapping('headerToLine', lineType);
				}	

				//S16002: Add vendor credits for negative total invoices
				var aiAmount = aiRec.getFieldValue('custrecord_ai_inv_amount');
				nlapiLogExecution('debug', 'custrecord_ai_inv_amount', aiAmount);
				var billRec = null;
              	if(aiAmount < 0 ){
					billRec = nlapiCreateRecord('vendorcredit');
                }else{
                	billRec = nlapiCreateRecord('vendorbill');
                }

				var distLines = [];
				distLines = afnData.Distributions;
				//for each distribution line
				//get field mapping for description specifically, as it's outside the  regular array we're going through.
				var nsDescriptionField = getDescriptionMapping();
				nlapiLogExecution('audit', 'nsDescriptionField', nsDescriptionField);

				//header fields
				billRec.setFieldValue('tranid', afnData.Number);
				var vendor = aiRec.getFieldValue('custrecord_ai_inv_vendor');
				billRec.setFieldValue('entity', vendor);
				//S16002: Bill Credits must be set to a positive value
              	if(aiAmount < 0){
					billRec.setFieldValue('usertotal', -(aiRec.getFieldValue('custrecord_ai_inv_amount')));
                } else {
					//billRec.setFieldValue('usertotal', aiRec.getFieldValue('custrecord_ai_inv_amount'));
                }
				//S16002: Bill Credits do not have a duedate field
              	if(aiAmount >= 0){
					billRec.setFieldValue('duedate', formatDate(afnData.InvoiceDueDate)); //check this ports without further modification - NOPE ADJUST DATE INFO
                }
				billRec.setFieldValue('trandate', formatDate(afnData.InvoiceDate));
				var invDate = formatDate(afnData.InvoiceDate);
				//S15833 Get the billing address from the imported invoice, if specified.
				var invAddrId = getBillingAddress(aiRec);
				if(invAddrId){
					nlapiLogExecution('audit', 'custrecord_ai_inv_vnd_addr_id', invAddrId);
					billRec.setFieldValue('billaddresslist',invAddrId);
				}
				billRec.setFieldValue('memo', getMemo(aiRec)); //S15832 Get the memo based on the account number override logic
				billRec.setFieldValue('approvalstatus', 2); //1 - Pending Approval, 2 - Approved, 3 - Rejected

				//if this is a One World account, it needs to specifically set the subsidiary - setting the vendor is not sufficient. 
				//Without having the subsidiary set, the option fields will all show blank for things like department.

				if (isOneWorld) {
					var subsidiary = nlapiLookupField('vendor', vendor, 'subsidiary');
					billRec.setFieldValue('subsidiary', subsidiary);
					nlapiLogExecution('debug', 'set subsidary', subsidiary);
				}

				// S15486 - Map AvidInvoice Header Fields to NetSuite Bill Header Fields
				if (context.getSetting('SCRIPT', 'custscript_pp_enable_hdr_fld_map') == 'T') {
					applyCustomHeaders(billRec, afnData, headerFieldMap, errorMessage);
				}

				//S26864 - Inconsistent behavior with locked accounting periods
				if (postLocked == 'F') {
					//adjust accounting period is needed.
					//find period for transaction
					var perFilter = [new nlobjSearchFilter('startdate', null, 'onorbefore', invDate)
						, new nlobjSearchFilter('enddate', null, 'onorafter', invDate)
						, new nlobjSearchFilter('isquarter', null, 'is', 'F')
						, new nlobjSearchFilter('isyear', null, 'is', 'F')
						, new nlobjSearchFilter('isadjust', null, 'is', 'F')
						, new nlobjSearchFilter('isinactive', null, 'is', 'F')
					];
					var perColumn = [new nlobjSearchColumn('internalid')
						, new nlobjSearchColumn('aplocked')
						, new nlobjSearchColumn('closed')
						, new nlobjSearchColumn('periodname')
					];
					var perResults = nlapiSearchRecord('accountingperiod', null, perFilter, perColumn);
					//check if current period is open
					//should only be one answer here
					var perId = perResults[0].getValue('internalid');
					//if yes, nothing needs to be done
					//if no, find next open period
					if (perResults[0].getValue('aplocked') == 'T') {
						//set to that next open period
						var newPeriod = getCurrentPeriod();
						billRec.setFieldValue('postingperiod', newPeriod);
					}
				}
				//line fields
				//basically cribbing the code from PP_UE_VendorBill_Distribution_Lines.js, though there *are* differences that keep these functions from being in the library atm
				try {
					for (b = 0; b < distLines.length; b++) {
						//maybe figure out way to go through first line and determine while enterprise codes need to be looked at?
						billRec.selectNewLineItem(lineType); //create new expense or item line
						var line = b+1;
						var distFields = [];
						distFields = afnData.Distributions[b].EnterpriseCodes;
						nlapiLogExecution('debug', 'distFields.length', distFields.length);

						//set amount, which is also in a different part of the JSON
						//S16002: For Bill Credits distribution amounts, the sign must be flipped
						//S20949 Need to move up setting the amount to before the tax code.
						if(aiAmount < 0){
							billRec.setCurrentLineItemValue(lineType, 'amount', -(afnData.Distributions[b].Amount)); //get from amount field in distribution line - not in enterprise code section of json
						} else {
							billRec.setCurrentLineItemValue(lineType, 'amount', afnData.Distributions[b].Amount); //get from amount field in distribution line - not in enterprise code section of json
						}

						for (c = 0; lineMappingArray != null && c < lineMappingArray.length; c++) {
							for (d = 0; d < distFields.length; d++) {

								if (lineMappingArray[c].aiField == distFields[d].EnterpriseCodeGroups[0].CodeGroupName) {
									var AIFieldName = lineMappingArray[c].aiField;
									nlapiLogExecution('debug', 'lineMappingArray['+AIFieldName+']', lineMappingArray[c].nsFieldId);
									var nsFieldId = lineMappingArray[c].nsFieldId;
				
									//get field type - if it's a list (but not the accounting field), treat differently
									var fieldType = lineMappingArray[c].nsFieldType;

									//account and other record fields will be pulling from the Description in AI, rather than the printed value, as that is where we'll store the account internalID
									nlapiLogExecution('debug', 'nsFieldId', nsFieldId);
									var fieldValue = distFields[d].EnterpriseCodeValue;
									var descValue = distFields[d].EnterpriseCodeValueDescription;

									var nullValue = context.getSetting('SCRIPT', 'custscript_pp_null_value');

									if (fieldValue == nullValue) {
										fieldValue = null;
										nlapiLogExecution('debug', 'AI Field ' + AIFieldName + ' is set to null value ' + nullValue + '. Setting value to null.');
										continue; //we don't need to go on and map this one, as it's blank
									}

									// //account will be pulling from the Description in AI, rather than the printed value, as that is where we'll store the account internalID
									// if (nsFieldId == 'account') {
									// 	var fieldValue = distFields[d].EnterpriseCodeValueDescription;
									// } else {
									// 	var fieldValue = distFields[d].EnterpriseCodeValue;
									// }
									nlapiLogExecution('debug', 'line to line field value', nsFieldId + ': ' + fieldValue);

									switch (fieldType) {
										case 'List/Record':
											errorMessage = setListField(fieldValue, nsFieldId, AIFieldName, errorMessage, line, optionListArray, billRec, false, descValue, lineType);
											break;
										case 'Check Box':
											errorMessage = setCheckBoxField(fieldValue, nsFieldId, errorMessage, billRec, false, lineType);
											break;
										default:
											errorMessage = setOtherField(fieldValue, nsFieldId, errorMessage, billRec, false, lineType);
									}
								}
							}
						}

						//handle Description mapping - this is on a different level of the JSON, and needs to be handled separately
						if (nsDescriptionField != null) {
							try {
								billRec.setCurrentLineItemValue(lineType, nsDescriptionField, afnData.Distributions[b].Description);
							} catch (ex) {
								errorMessage += "There was an error adding info to field " + nsDescriptionField + ": " + ex.message + '\n';
								errorAI(aiRec);
							}
						}

						//save line

						if (headerToLineParam == 'T' && headerToLineMap != null) {
							var line = c+1;
							errorMessage = addHeaderToLineFields(headerToLineMap, afnData, errorMessage, billRec, line, optionListArray, lineType);
						} else if (headerToLineMap == null && headerToLineParam == 'T') {
							nlapiLogExecution('error', 'Cannot find headerToLineMap values', 'HeaderToLineMap array is empty');
						}
						try {
							billRec.commitLineItem(lineType);
						} catch(ex) {
							var lineNum = c + 1;
							errorMessage += 'There was an error adding line ' + lineNum + ': ' + ex.message + '\n';
							errorAI(aiRec);
						}
					}
				} catch (ex) {
					nlapiLogExecution('error', 'error setting lines', 'In Imported Invoice ' + aiList[a] + '. NS says: ' + ex.message + ' errorMessage: ' + errorMessage);
					errorAI(aiRec);
				}

				if (errorMessage != '') {
					nlapiSetFieldValue('custbody_pp_afn_error', errorMessage);
					nlapiLogExecution('error', 'FINAL ERROR MESSAGE', errorMessage);
					try {
						errorAI(aiRec);
					} catch (ex) {
						nlapiLogExecution('error', 'AI record already updated');
					}
				} else {

				//save record - be sure to source fields (for things like posting period, terms, currency, exchange rate, etc)
					try {
						var billId = nlapiSubmitRecord(billRec);
						nlapiLogExecution('debug', 'bill Created (no PO)', 'Bill ' + billId + ' created from Imported Invoice ' + aiList[a]);
						//add bill to Imported Invoice Record
						aiRec.setFieldValue('custrecord_ai_inv_bill', billId);
						nlapiSubmitRecord(aiRec);

					} catch (ex) {
						nlapiLogExecution('error', 'error', 'error saving bill off of Imported Invoice ' + aiList[a] + ' NS says: ' + ex.message);
						errorAI(aiRec);
					}
				}
			}
		}

	} catch (ex) {
		nlapiLogExecution('error', 'error', ex.message);
		errorAI(aiRec);
	}
}

function checkRemainingUsage(context, aiIdNum, param) {
	var usage = context.getRemainingUsage();
	var status = '';
	if (usage <= 200) {
			var params = {
				custscript_ia_id_list: param,
				custscript_restart_on: aiIdNum,
			}
		status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), params);
		if (status == 'QUEUED') {
			nlapiLogExecution('audit', 'rescheduling script');
		}
	}
	return status;
}

function getScheduledFieldMapping(mapType, lineType) {
	try {
		var fieldFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')];
		//nlapiLogExecution('debug', 'getFieldMapping mapType', mapType);

		if (mapType == 'lineToLine') {
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ns_header', null, 'is', 'F'));
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ai_header', null, 'is', 'F'));
		} else if (mapType == 'headerToLine'){
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ns_header', null, 'is', 'F'));
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ai_header', null, 'is', 'T'));
		} else if(mapType == 'headerToHeader') {
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ns_header', null, 'is', 'T'));
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ai_header', null, 'is', 'T'));
		} else {
			nlapiLogExecution('error', 'error in mapType', 'Did not recognize mapType: ' + mapType);
		}

		if (lineType == 'expense') { //expense
			nlapiLogExecution('debug', 'adding expense filter', '');
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_expense', null, 'is', 'T'));
		} else if (lineType == 'item') { //item
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_item', null, 'is', 'T'));
			nlapiLogExecution('debug', 'adding item filter', '');
		}

		var fieldColumns = [new nlobjSearchColumn('custrecord_pp_fm_ns_internal_id')
			, new nlobjSearchColumn('custrecord_pp_ns_field_type')
			, new nlobjSearchColumn('custrecord_pp_avid_invoice_field')
			, new nlobjSearchColumn('custrecord_pp_fm_ns_field_name')
		];
		var mappingResults = nlapiSearchRecord('customrecord_pp_field_mapping', null, fieldFilters, fieldColumns);
		
		//put results into an array, so we can use the AvidInvoice Field as a key, when going through the JSON data sent
		var mappingArray = [];
		if (mappingResults == null) {
			//error out, as there is no field mapping available.
			nlapiCreateError('NO_FIELD_MAPPING', 'There are no field mapping records for this account. Please set up field mapping.', true); //last param - does not send email to admin
		} else {
			var mappingLength = mappingResults.length;
			nlapiLogExecution('debug', 'mappingLength', mappingLength);
			for (var a = 0; a < mappingLength; a++) {
				//nlapiLogExecution('debug', 'AvidInvoice field name ' + a, mappingResults[a].getValue('custrecord_pp_avid_invoice_field'));
				var AIFieldName = mappingResults[a].getValue('custrecord_pp_avid_invoice_field');

				//mappingArray[AIFieldName] = new fieldMapping(AIFieldName, mappingResults[a].getValue('custrecord_pp_fm_ns_internal_id'), mappingResults[a].getValue('custrecord_pp_fm_ns_field_name'), mappingResults[a].getText('custrecord_pp_ns_field_type'));
				mappingArray.push(new fieldMapping(AIFieldName, mappingResults[a].getValue('custrecord_pp_fm_ns_internal_id'), mappingResults[a].getValue('custrecord_pp_fm_ns_field_name'), mappingResults[a].getText('custrecord_pp_ns_field_type')));
				//nlapiLogExecution('debug', 'mappingArray setting test ' + AIFieldName, mappingArray[AIFieldName].nsFieldId);
			}
		return mappingArray;
		}

	} catch (ex) {
		nlapiLogExecution('ERROR', 'ERROR in getScheduledFieldMapping function', ex.message);
	}
}


function errorAI(aiRec) {
	aiRec.setFieldValue('custrecord_ai_inv_bill_process_error', 'T');
	nlapiSubmitRecord(aiRec);
}

function getMemo(aiRec){
	//S15832: Include the vendor account num override logic
	// This logic was copied from PP_UE_AI_VendorBills.js, but is slightly different.
	var memoOverride = '';
	var context = nlapiGetContext();
	var useAIMemoEnabled = (context.getSetting('SCRIPT', 'custscript_pp_ai_use_memo') == 'T' ? true : false);
	var vendorFields = nlapiLookupField('vendor',aiRec.getFieldValue('custrecord_ai_inv_vendor'),['custentity_pp_ai_acct_num_override','accountnumber']);
	var accountNumOverrideEnabled = (vendorFields.custentity_pp_ai_acct_num_override == 'T' ? true : false);
	nlapiLogExecution('debug', 'useAIMemoEnabled', useAIMemoEnabled);
	nlapiLogExecution('debug', 'accountNumOverrideEnabled', accountNumOverrideEnabled);
	// Only calculate and override the memo if one of the two overrides are enabled
	if(useAIMemoEnabled || accountNumOverrideEnabled){
		// First calculate the account number
		var accountNo = null;
		var afnData = JSON.parse(aiRec.getFieldValue('custrecord_ai_inv_raw_data'));
		if(accountNumOverrideEnabled && typeof afnData.BuyerVendorAccount != 'undefined' && afnData.BuyerVendorAccount.AccountNo){
			var aiAccountNo  = afnData.BuyerVendorAccount.AccountNo;
			if(typeof aiAccountNo == 'number'){
				aiAccountNo = aiAccountNo.toFixed();
			}
			// write the account number to a hidden field and use it to set the memo via client script since we can't force it via the user event script
			if(aiAccountNo.toLowerCase() != 'none'){
				accountNo = aiAccountNo;
			}
			nlapiLogExecution('debug', 'afnData.BuyerVendorAccount.AccountNo', accountNo);
		}
		// fallback to vendor account number if we still have no accountNo
		if(!accountNo && vendorFields.accountnumber){
			accountNo = vendorFields.accountnumber;
			nlapiLogExecution('debug', 'vendorFields.accountnumber', accountNo);
		}
		// Second calculate the base memo
		var memo = '';
		if(useAIMemoEnabled && afnData.Memo){
			memo = afnData.Memo;
			nlapiLogExecution('debug', 'afnData.Memo', memo);
		}
		// fallback to purchase order memo if we still have no memo
		var po = aiRec.getFieldValue('custrecord_ai_inv_purchase_order');
		if(!memo && po){
			memo = nlapiLookupField('purchaseorder',po,'memo');
			nlapiLogExecution('debug', 'purchaseorder:'+po, memo);
		}
		// Finally calculate the memo override
		if(accountNo && memo){
			memoOverride = accountNo + ' - ' + memo;
		}
		else if(accountNo){
			memoOverride = accountNo;
		}
		else if(memo){
			memoOverride = memo;
		}
		//if(memoOverride){
		//	billRec.setFieldValue('memo', memoOverride);
		//}
	}
	nlapiLogExecution('debug', 'memoOverride', memoOverride);
	return memoOverride;
}

function getBillingAddress(aiRec){
	//S15833 Get the billing address from the imported invoice, if specified.
	// This was copied from PP_UE_AI_VendorBills.js and modified.
	var invAddressId = aiRec.getFieldValue('custrecord_ai_inv_vnd_addr_id');
	if(invAddressId){
		// check if vendor actually has address
		function isValidVendorAddressId(vendorId,vendorAddressId){
			var filters = [];
			var columns = [];

			filters.push(new nlobjSearchFilter('internalid', null, 'is', vendorId));
			columns.push(new nlobjSearchColumn('addressinternalid'));

			var vendorAddressSearchResults = nlapiSearchRecord('vendor',null,filters,columns);
			if(vendorAddressSearchResults.length > 0){
				// should only be one
				for(var i = 0; i < vendorAddressSearchResults.length; i++){
					if(vendorAddressSearchResults[i].getValue('addressinternalid') == invAddressId){
						return true;
					}
				}
			}
			return false;
		}

		// return vendor address id to be used to set the addresslist
		if(isValidVendorAddressId(aiRec.getFieldValue('custrecord_ai_inv_vendor'),invAddressId)){
			return invAddressId;
		}
		else{
			nlapiLogExecution('ERROR','Invalid custrecord_ai_inv_vnd_addr_id',invAddressId + ' is not a valid address id for vendor with id ' + aiRec.getFieldValue('custrecord_ai_inv_vendor'));
		}
	}
}



function addHeaderToLineFields(headerMapArray, afnData, errorMessage, curRec, lineNum, optionListArray, lineType) {
	//var curErrorMessage = errorMessage;
	var nullValue = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_null_value');
	for (var d = 0; d < headerMapArray.length; d++) {
		var fieldType = headerMapArray[d].nsFieldType;
		var nsFieldId = headerMapArray[d].nsFieldId;
		var AIFieldName = headerMapArray[d].aiField;
		if (AIFieldName.indexOf('.') != -1) {
			var fieldValue = getDotData(afnData, AIFieldName);
		} else {
			fieldValue = afnData[AIFieldName];
		}

		if (fieldValue == nullValue) {
			fieldValue = null;
			nlapiLogExecution('debug', 'AI Field ' + AIFieldName + ' is set to null value ' + nullValue + '. Setting value to null.');
			continue; //skip the rest of handling this, as we don't need to map it to the lines in this instance.
		}
		nlapiLogExecution('debug', 'headerToLineFields', nsFieldId + ': ' + fieldValue);
		switch (fieldType) {
			case 'List/Record':
				errorMessage = setListField(fieldValue, nsFieldId, AIFieldName, errorMessage, lineNum, optionListArray, curRec, false, null, lineType);
				break;
			case 'Check Box':
				errorMessage = setCheckBoxField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
				break;
			case 'Date':
				errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
				break;
			case 'Date/Time':
				errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
				break;
			default:
				errorMessage = setOtherField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
				break;
		}
	}
	return errorMessage;
}

function getHeaderValue(aiFieldName) {
	var value = afnData.aiFieldName;
	return value;
}

// -------------------------------- ADDED BELOW THIS FOR S15486 -----------------

function applyCustomHeaders(rec, data, headerFieldMap, errorMessage) { //FIX - we don't need to get the header map every time

	if (headerFieldMap) {
		// Loop through each header field and map to the bill header field
		nlapiLogExecution('DEBUG', 'Number of header fields', headerFieldMap.length);
		var nullValue = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_null_value');
		for (var i = 0; i < headerFieldMap.length; i++) {
			//nlapiLogExecution('DEBUG', 'field id', i);

			var avidInvoiceField = headerFieldMap[i]['aiField'];
			var fieldType = headerFieldMap[i]['nsFieldType'];
			var nsFieldId = headerFieldMap[i]['nsFieldId'];
	
			//nlapiLogExecution('DEBUG', 'AIField', avidInvoiceField);
			
			//Updated to match the new requirements for S15486
			if (avidInvoiceField.indexOf('.') != -1) {
				var fieldValue = getDotData(data, avidInvoiceField);
				if (fieldValue != nullValue) {
					errorMessage = applyHeaderFieldMapping(rec, fieldType, nsFieldId, fieldValue, errorMessage, avidInvoiceField);
					nlapiLogExecution('DEBUG', avidInvoiceField, fieldValue);
				}
			} else {
				var fieldValue = data[avidInvoiceField];
				if (fieldValue != nullValue) {
					errorMessage = applyHeaderFieldMapping(rec, fieldType, nsFieldId, fieldValue, errorMessage, avidInvoiceField);
					nlapiLogExecution('DEBUG', avidInvoiceField, fieldValue);
				}
			}
		}
	} else {
		nlapiLogExecution('DEBUG', 'Empty Field', 'No Header Field Mapping');
	}
	return errorMessage;
}


function applyHeaderFieldMapping(rec, fieldType, nsFieldId, fieldValue, errorMessage, aiFieldName) {
	//nlapiLogExecution('debug', 'applyHeaderFieldMapping fieldValue', nsFieldId + ': ' + fieldValue);

	switch (fieldType) {
	case 'List/Record':
		errorMessage = setListField(fieldValue, nsFieldId, aiFieldName, errorMessage, null, null, rec, true);//AI Field Name is only used in error messaging - change?
		break;
	case 'Check Box':
		errorMessage = setCheckBoxField(fieldValue, nsFieldId, errorMessage, rec, true);
		break;
	case 'Date':
		errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, rec, true);
		break;
	case 'Date/Time':
		errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, rec, true);
		break;
	case 'Currency':
		errorMessage = setCurrencyField(fieldValue, nsFieldId, errorMessage, rec, true);
		break;
	default:
		errorMessage = setOtherField(fieldValue, nsFieldId, errorMessage, rec, true);
	}
	return errorMessage;
}

function getCurrentPeriod() {
	try{
		var filters = [new nlobjSearchFilter('isquarter', null, 'is', 'F')
			, new nlobjSearchFilter('isyear', null, 'is', 'F')
			, new nlobjSearchFilter('isinactive', null, 'is', 'F')
			, new nlobjSearchFilter('isadjust', null, 'is', 'F')
			, new nlobjSearchFilter('startdate', null, 'onorbefore', 'today')
			, new nlobjSearchFilter('enddate', null, 'onorafter', 'today')
		];
		var columns = [new nlobjSearchColumn('periodname')
			, new nlobjSearchColumn('internalid').setSort()
		];
		var searchResults = nlapiSearchRecord('accountingperiod', null, filters, columns);
		return searchResults[0].getValue('internalid');
	} catch(ex) {
		nlapiLogExecution('debug', 'error in getCurrentPeriod', ex.message);
	}
}

function comparePeriods(perId, openPeriods, start) {
	try {
		if (parseInt(perId) < parseInt(openPeriods[start])) {
			return openPeriods[start];
		} else {
			start++;
			comparePeriods(perId, openPeriods, start);
		}
	}catch(ex) {
		nlapiLogExecution('error', 'Error in comparePeriods', ex.message);
	}
}