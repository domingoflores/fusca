/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */

  define(['N/log', 'N/record','N/search'],
 	function(log, record, search) {
 		function beforeSubmit(context) {
 			log.debug({
 				title: 'context.type',
 				details: context.type
 			});
 			if (context.type == 'create') {
 				createCSI(context);
	 		} else if(context.type == 'edit' || context.type == 'xedit') {
	 			//we need to update any changes to the selected bills and associated amounts and reflect them on the avid check stub info record
	 			//get current lists from avid check stub info record
	 			var newRec = context.newRecord;
	 			var oldRec = context.oldRecord;
	 			var oldCheckStubId = oldRec.getValue({fieldId: 'custbody_pp_check_stub_info'});
	 			var checkStubId = newRec.getValue({fieldId: 'custbody_pp_check_stub_info'});
	 			// log.debug({
	 			// 	title: 'checkStubId',
	 			// 	details: 'New: ' + checkStubId + ', Old: ' + oldCheckStubId
	 			// });
	 			//if checkStubId, continue. If not, create new one
	 			if ((checkStubId == '' ) && (oldCheckStubId == '')) {
	 				createCSI(context);
	 			} else if (checkStubId == '' && oldCheckStubId != '' && context.type == 'xedit') {
	 				//this may be the Avid approval script, which will wipe out information because it thinks there is nothing on the apply subtab
	 				//the odds of someone trying to remove an existing checkstub ID and edit the lines and still wanting this working is very low
	 				//best to leave things as they are
	 				log.debug({
	 					title: 'Skipping',
	 					details: 'oldCheckStubID: ' + oldCheckStubId + ', newCheckStubId is blank. context type is xedit - canceling changes to check stub info record to avoid erasing existing data.'
	 				});
	 				return;
	 			} else {
	 				if (checkStubId == '') {
	 					checkStubId = oldCheckStubId;
	 					log.debug({
	 						title: 'switching check stub',
	 						details: 'using oldCheckStubId: ' + oldCheckStubId
	 					});
	 				}
	 				log.debug({
	 					title: 'checkStub final',
	 					details: checkStubId
	 				});
		 			var csRec = record.load({
		 				type: 'customrecord_pp_check_stub_info',
		 				id: checkStubId
		 			});

		 			var applyIds = csRec.getValue({fieldId: 'custrecord_pp_apply_ids'}).split(',');
		 			var amountList = csRec.getValue({fieldId: 'custrecord_pp_amount_list'}).split(',');
		 			var refNumList = csRec.getValue({fieldId: 'custrecord_pp_refnum_list'}).split(',');
		 			var discList = csRec.getValue({fieldId: 'custrecord_pp_disc_list'}).split(',');
		 			var newIdList = [];
		 			var oldIdList = [];
		 			//run through, update or add lines
		 			var newLineCount = newRec.getLineCount({sublistId: 'apply'});
		 			for (var b = 0; b < newLineCount; b++) {
		 				var apply = newRec.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: b});
		 				if (apply == true) {
		 					var id = newRec.getSublistValue({sublistId: 'apply', fieldId: 'internalid', line: b});
							var amount = newRec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: b});
							var refNum = newRec.getSublistValue({sublistId: 'apply', fieldId: 'refnum', line: b});
							var discVal = newRec.getSublistValue({sublistId: 'apply', fieldId: 'disc', line: b});
							newIdList.push(id);

							//check if id is in list
							var idIndex = applyIds.indexOf(id);
							if(idIndex == -1) {
								//push values
								applyIds.push(id);
								amountList.push(amount);
								refNumList.push(refNum);
								discList.push(discVal);
							} else {
								//replace the other values at the same index in their arrays
								amountList[idIndex] = amount;
								refNumList[idIndex] = refNum;
								discList[idIndex] = discVal;
							}
		 				}
		 			}

		 			//run through new and old rec and compare - any lines to remove?
		 			var oldLineCount = oldRec.getLineCount({sublistId: 'apply'});
		 			for (var c = 0; c < oldLineCount; c++) {
		 				var apply = oldRec.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: c});
		 				if (apply == true) {
		 					var oldId = oldRec.getSublistValue({sublistId: 'apply', fieldId: 'internalid', line: c});
		 					oldIdList.push(oldId);
		 				}
		 			}
		 			// log.debug({
		 			// 	title: 'oldIdList',
		 			// 	details: oldIdList.toString()
		 			// });
		 			//we know we've already added any new lines from our new record into our applyIds list. 
		 			//here we want to remove any removed lines. First step is to compare our newIdList and oldIdList
		 			for (var d = 0; d < newIdList.length; d++) {
		 				var tempId = newIdList[d];
		 				var tempIndex = oldIdList.indexOf(tempId);
		 				if (tempIndex != -1) {
		 					//if it is in the old list, remove it. This way the only remaining values will be ones to delete
		 					oldIdList.splice(tempIndex, 1); //removes value without leaving a hole in the array.
		 				}
		 			}
		 			// log.debug({
		 			// 	title: 'oldList update',
		 			// 	details: oldIdList.toString()
		 			// });
		 			//now we have an array that is either empty or has values to remove.
		 			if(oldIdList != null && oldIdList.length > 0) {
		 				for (var e = 0; e < oldIdList.length; e++) {
		 					var removeId = oldIdList[e];
		 					var removeIndex = applyIds.indexOf(removeId);
		 					log.debug({
		 						title: 'removing id: ' + removeId,
		 						details: 'at index ' + removeIndex
		 					});
		 					applyIds.splice(removeIndex, 1);
		 					amountList.splice(removeIndex, 1);
		 					refNumList.splice(removeIndex, 1);
		 					discList.splice(removeIndex, 1);
		 				}
		 			}
		 			//resave values in CSI record.
		 			csRec.setValue({fieldId:  'custrecord_pp_apply_ids', value: applyIds.toString()});
		 			csRec.setValue({fieldId: 'custrecord_pp_amount_list', value: amountList.toString()});
		 			csRec.setValue({fieldId: 'custrecord_pp_refnum_list', value: refNumList.toString()});
		 			csRec.setValue({fieldId: 'custrecord_pp_disc_list', value: discList.toString()});
		 			var checkStubId = csRec.save();
					log.debug({title: 'checkStubId', details: checkStubId});
	 			}
	 		}
	 	}

	 	function createCSI(context) {
	 		try {
		 		var vpRec = context.newRecord;
				var lineCount = vpRec.getLineCount({sublistId: 'apply'});
				var applyList = [];
				var amountList = [];
				var refNumList = [];
				var discList = [];
				log.debug({title: 'lineCount', details: lineCount});
				for (var a = 0; a <= lineCount; a++) {
					var apply = vpRec.getSublistValue({sublistId: 'apply', fieldId: 'apply', line: a});
					//log.debug({title: 'apply', details: apply});
					if (apply == 'T' || apply == true) {
						var id = vpRec.getSublistValue({sublistId: 'apply', fieldId: 'internalid', line: a});
						var amount = vpRec.getSublistValue({sublistId: 'apply', fieldId: 'amount', line: a});
						var refNum = vpRec.getSublistValue({sublistId: 'apply', fieldId: 'refnum', line: a});
						var discVal = vpRec.getSublistValue({sublistId: 'apply', fieldId: 'disc', line: a}); //this is discount taken, not discount available
						
						applyList.push(id);
						amountList.push(amount);
						discList.push(discVal);
						//something in case refNum is blank, as on billss
						if (refNum == '' || refNum == undefined || refNum == null) {
							refNum = 'null';
						}
						refNumList.push(refNum);
						log.debug({title: 'id/amount', details: id +'/' + amount});
					}
				}	

				//grab any Avid Check Stub Infor records that were created from a directly applied Vendor Credit.
				var vcFilters = [];
				vcFilters.push(search.createFilter({
					name: 'custrecord_pp_is_bill_credit',
					operator: search.Operator.IS,
					values: true	//check that this works for checkbox
				}));
				vcFilters.push(search.createFilter({
					name: 'custrecord_pp_applied_to_bill_payment',
					operator: search.Operator.ANYOF,
					values: '@NONE@'
				}));
				vcFilters.push(search.createFilter({
					name: 'custrecord_pp_applied_to_bill',
					operator: search.Operator.ANYOF,
					values: applyList
				}));

				var vcColumns = [];
				vcColumns.push(search.createColumn({
					name: 'internalid'
				}));
				vcColumns.push(search.createColumn({
					name: 'custrecord_pp_amount_list'
				}));
				vcColumns.push(search.createColumn({
					name: 'custrecord_pp_apply_ids'
				}));
				vcColumns.push(search.createColumn({
					name: 'custrecord_pp_refnum_list'
				}));

				var vcSearch = search.create({
					type: 'customrecord_pp_check_stub_info',
					filters: vcFilters,
					columns: vcColumns
				});

				var vcList = [];

				vcSearch.run().each(function(result) {
					var amt = result.getValue('custrecord_pp_amount_list');
					var id = result.getValue('custrecord_pp_apply_ids');
					applyList.push(id);
					amountList.push(amt);
					refNumList.push(result.getValue('custrecord_pp_refnum_list'));
					log.debug({
						title: 'bc refNum',
						details: result.getValue('custrecord_pp_refnum_list')
					});
					discList.push('');

					var vcId = result.getValue('internalid');
					log.debug({
						title: 'vcId',
						details: vcId
					});
					vcList.push(vcId);
				});

				//mark off credit memo, as it's now being applied in a check.
				//we don't have the bill payment ID yet. Store ID in hidden field for use in afterSubmit update
				vpRec.setValue({
					fieldId: 'custbody_pp_check_stub_temp',
					value: vcList.toString()
				});

				//create new check stub record
				var checkStubRec = record.create({
					type:'customrecord_pp_check_stub_info'
				});
			
				checkStubRec.setValue({fieldId: 'custrecord_pp_apply_ids', value: applyList.toString()});
				checkStubRec.setValue({fieldId: 'custrecord_pp_amount_list', value: amountList.toString()});
				checkStubRec.setValue({fieldId: 'custrecord_pp_refnum_list', value: refNumList.toString()});
				checkStubRec.setValue({fieldId: 'custrecord_pp_disc_list', value: discList.toString()});
				//checkStubRec.setFieldValue('custrecord_pp_doc_list', docList.toString());
				var checkStubId = checkStubRec.save();
				log.debug({title: 'checkStubId', details: checkStubId});

				//keeping the ID on the payment record, so we can look it up later when printing the payment
				vpRec.setValue({fieldId: 'custbody_pp_check_stub_info', value: checkStubId});
			} catch(ex) {
				log.error({
					title: 'Error in createCSI', 
					details: ex.message
				});
			}
	 	}

	 	function afterSubmit(context) {
	 		try{
	 			var rec = context.newRecord;
	 			var recId = rec.id;
	 			var vcIds = rec.getValue({
	 				fieldId: 'custbody_pp_check_stub_temp'
	 			});
	 			if (vcIds != null && vcIds != undefined && vcIds != '') {
	 				vcIds = vcIds.split(',');
	 			}

	 			if (vcIds != null) {
	 				for (var a = 0; a < vcIds.length; a++) {
	 					// log.debug({
	 					// 	title: 'vcIds - a: ' + a,
	 					// 	details: vcIds[a]
	 					// });
	 					record.submitFields({
	 						type: 'customrecord_pp_check_stub_info',
	 						id: vcIds[a],
	 						values: {'custrecord_pp_applied_to_bill_payment' : recId}
	 					});
	 				}
	 			}
	 			//now that we have the bill payment Id, apply it to the associated Avid Check Stub Info record as well, for easy backtracking
	 			var csiId = rec.getValue({
	 				fieldId: 'custbody_pp_check_stub_info'
	 			});
	 			
	 			// log.debug({
	 			// 	title: 'csiId',
	 			// 	details: csiId
	 			// });
	 			if (csiId != '' && csiId != undefined && csiId != null) {
		 			record.submitFields({
		 				type: 'customrecord_pp_check_stub_info',
	 					id: csiId,
	 					values: {'custrecord_pp_applied_to_bill_payment' : recId}
	 				});
	 			}
	 		}catch(ex) {
	 			log.error({
	 				title: 'Error in afterSubmit',
	 				details: ex.message
	 			});
	 		}
	 	}

 		return {
 			beforeSubmit: beforeSubmit,
 			afterSubmit: afterSubmit
 		}
 	});