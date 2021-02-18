/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

 define(['N/log','N/record', 'N/search'],
    function(log,record, search) {
    	function afterSubmit(context) {
    		try {
    			//check we can get info on the apply tab on a vendor credit
    			var curRec = context.newRecord;
    			var oldRec = context.oldRecord;
    			var contextType = context.type;

    			// log.debug({
    			// 	title: 'conext check',
    			// 	details: contextType
    			// });

    			var lineCount = curRec.getLineCount({
    				sublistId: 'apply'
    			});
    			if (oldRec == null) {
    				log.debug({
    					title: "oldRec is null",
    					details: 'substituting blank values'
    				});
    			}
    			if (lineCount == 0 || lineCount == null) {
    				return;
    			} else {
	    			for (var a = 0; a < lineCount; a++) {
	    				var apply = curRec.getSublistValue({
	    					sublistId: 'apply',
	    					fieldId: 'apply',
	    					line: a
	    				});
	    				if (oldRec == null) {
	    					var oldApply = false;
	    				} else {
	    					var oldApply = oldRec.getSublistValue({
	    						sublistId: 'apply',
	    						fieldId: 'apply',
	    						line: a
	    					});
	    				}
	    				if (apply == true) {
	    					var curAppId = curRec.getSublistValue({
	    						sublistId: 'apply',
	    						fieldId: 'internalid',
	    						line: a
	    					});
	    					

	    					if (apply == true && oldApply == false) {

	    						log.debug({
	    							title: 'apply = true, oldApply = false',
	    							details: curAppId
	    						});

	    						var amount = -1 * curRec.getSublistValue({
									sublistId: 'apply',
									fieldId: 'amount',
									line: a
								});

	    						//check if there's an existing check stub record with this bill on it.
	    						var existingId = existingCheckStubRecord(curRec, curAppId, amount);
	    						log.debug({
	    							title: 'existingId',
	    							details: existingId
	    						});
	    						if (existingId) {
	    							//update existing check stub record
	    							updateExisting(curRec, curAppId, amount, existingId);
	    						} else {
		    						//If not, create new check stub info record to track
	    							createCheckStubRecord(curRec, curAppId, amount);
	    						}

	    					} else if (apply == true && oldApply == true) {
	    						//check that amounts haven't changed
	    						var oldAmount = oldRec.getSublistValue({
	    							sublistId: 'apply',
	    							fieldId: 'amount',
	    							line: a
	    						});
	    						var curAmount = curRec.getSublistValue({
	    							sublistId: 'apply',
	    							fieldId: 'amount',
	    							line: a
	    						});

	    						// log.debug({
	    						// 	title: 'old/new amount',
	    						// 	details: oldAmount +', ' + curAmount
	    						// });

	    						if (oldAmount == curAmount) {
	    							//do nothing - amounts match
	    						} else {
	    							//see if there is an open, Avid Check Stub Info record that hasn't been printed
	    							
									//if an open one with the old amount exists and has not been printed, update the value
									//if amount has gone up and has been printed, create a new check stub info record
									//if amount has gone down and it has been printed, leave it.
									existingAmountMatch(curRec, curAppId, oldAmount, curAmount);
	    						}
	    					}
	    				} else if (apply == false && oldApply == true) {
	    					var curAppId = curRec.getSublistValue({
	    						sublistId: 'apply',
	    						fieldId: 'internalid',
	    						line: a
	    					});
							//need to remove from its associated check stub info record, unless it's been printed.
							log.debug({
								title: 'line unchecked',
								details: curAppId
							});
							var existingId = existingCheckStubRecord(curRec, curAppId, amount);
							if (existingId) {
								log.debug({
									title: 'existingId found',
									details: existingId
								});
								var existRec = record.load({
									type: 'customrecord_pp_check_stub_info',
									id: existingId
								});

								var associatedBP = existRec.getValue({
									fieldId: 'custrecord_pp_applied_to_bill_payment'
								});

								if (associatedBP != null && associatedBP != undefined && associatedBP != '') {

									var applyIds = existRec.getValue({
										fieldId: 'custrecord_pp_apply_ids'
									}).split(',');
									var amountList = existRec.getValue({
										fieldId: 'custrecord_pp_amount_list'
									}).split(',');
									var refNumList = existRec.getValue({
										fieldId: 'custrecord_pp_refnum_list'
									}).split(',');
									var discountList = existRec.getValue({
										fieldId: 'custrecord_pp_disc_list'
									}).split(',');

									//find index number for ID
									var indexNum = applyIds.indexOf(curRec.id);
									//remove values from that index for all the above arrays
									applyIds.splice(indexNum);
									amountList.splice(indexNum);
									refNumList.splice(indexNum);
									discountList.splice(indexNum);

									//set values on record
									existRec.setValue({
										fieldId: 'custrecord_pp_apply_ids',
										value: applyIds.toString()
									});
									existRec.setValue({
										fieldId: 'custrecord_pp_amount_list',
										value: amountList.toString()
									});
									existRec.setValue({
										fieldId: 'custrecord_pp_refnum_list',
										value: refNumList.toString()
									});
									existRec.setValue({
										fieldId: 'custrecord_pp_disc_list',
										value: discountList.toString()
									});

									//save record
									existRec.save();
									log.debug({
										title: 'removed value from check stub record',
										details: existingId
									});
								} else {
									//need to delete the check stub info record associated with this line.
									//If it had been applied to an active check stub info record that was associated with a bill, it would have returned something in the above search
									//it may be associated with a printed line, so we're only looking for a CSI record with no bill payment associated with it yet
									var removeFilters = [];
									removeFilters.push(search.createFilter({
										name: 'custrecord_pp_is_bill_credit',
										operator: search.Operator.IS,
										values: true
									}));
									removeFilters.push(search.createFilter({
										name: 'custrecord_pp_applied_to_bill_payment',
										operator: search.Operator.ISEMPTY
									}));
									removeFilters.push(search.createFilter({
										name: 'custrecord_pp_apply_ids',
										operator: search.Operator.CONTAINS,
										values: curRec.id
									}));
									removeFilters.push(search.createFilter({
										name: 'custrecord_pp_applied_to_bill',
										operator: search.Operator.ANYOF,
										values: curAppId
									}));
									removeFilters.push(search.createFilter({
										name: 'isinactive',
										operator: search.Operator.IS,
										values: false
									}));
									// //no need to worry about amount - there will only be one CSI record per bill credit/bill payment pair.
									var removeColumns = ['internalid'];


									var removeSearch = search.create({
										type: 'customrecord_pp_check_stub_info',
										title: 'remove search',
										filters: removeFilters,
										columns: removeColumns
									});

									var resultSet = removeSearch.run().getRange({
										start: 0,
										end: 100
									});

									if (resultSet == null) {
										//do nothing
									} else if (resultSet.length > 1) {
										log.error({
											title: "Found multiple Check Stub Info records associated with this bill credit/bill!"
										});
										//mark all inactive? Something else?
									} else {
										var removeId = resultSet[0].getValue({name: 'internalid'});
										record.delete({
											type: 'customrecord_pp_check_stub_info',
											id: removeId
										});
										log.debug({
											title: 'Check Stub Info record removed',
											details: removeId
										});
									}
								}
							}	
						}
					} 
				}   			
    		} catch(ex) {
    			log.error({
    				title: 'error in afterSubmit',
    				details: ex.message
    			});
    		}
    	}

    	function existingAmountMatch(curRec, applyId, oldAmount, newAmount) {
    		try{
    			log.debug({
    				title: 'starting existingAmountMatch',
    				details: 'start ' + curRec.id
    			});
    			var amountFilters = [];
    			amountFilters.push(search.createFilter({
    				name: 'custrecord_pp_apply_ids',
    				operator: search.Operator.CONTAINS,
    				values: curRec.id
    			}));
    			amountFilters.push(search.createFilter({
    				name: 'custrecord_pp_amount_list',
    				operator: search.Operator.CONTAINS,
    				values: (-1 * oldAmount)  //amount listed on check stub info rec will be negative, amount on BC will be positive
    			}));
    			amountFilters.push(search.createFilter({
    				name: 'custbody_pp_is_printed',
    				join: 'custrecord_pp_applied_to_bill_payment',
    				operator: search.Operator.IS,
    				values: false
    			}));
    			amountFilters.push(search.createFilter({
    				name: 'custrecord_pp_is_bill_credit',
    				operator: search.Operator.IS,
    				values: false
    			}));
    			var amountColumns = ['custrecord_pp_apply_ids','custrecord_pp_amount_list'];
    			amountColumns.push(search.createColumn({
    				name: 'internalid',
    				sort: search.Sort.ASC
    			}));

    			var amountSearch = search.create({
    				type: 'customrecord_pp_check_stub_info',
    				title: 'Amount Check',
    				filters: amountFilters,
    				columns: amountColumns
    			});
    			var recUpdated = false;

    			amountSearch.run().each(function(result) {
    				//make sure that right amount is applied to the right bill
    				var applyIds = result.getValue({
    					name: 'custrecord_pp_apply_ids'
    				}).split(',');
    				var amounts = result.getValue({
    					name: 'custrecord_pp_amount_list'
    				}).split(',');

    				if (applyIds == null) {
    					log.error({
    						title: "no apply ids found",
    						details: 'AvidCheck Stub Record: ' + result.getValue('internalid')
    					});
    					return;
    				}
    				for (var b = 0; b < applyIds.length; b++) {
    					if (recUpdated == false && applyIds[b] == curRec.id) {
    						//check if amount at same index matches
    						// log.debug({
    						// 	title: 'comparing amounts',
    						// 	details: amounts[b] + ', ' + -oldAmount
    						// });
    						if (amounts[b] == -oldAmount) {
    							var csId = result.getValue('internalid');
    							//update amount
    							amounts[b] = -newAmount;
    							var amountString = amounts.toString();
    							//update check stub record
    							record.submitFields({
    								type: 'customrecord_pp_check_stub_info',
    								id: csId,
    								values: {'custrecord_pp_amount_list': amountString}
    							});
    							log.debug({
    								title: 'updated amount',
    								details: 'updated amount ' + oldAmount + ' to ' + newAmount + ' on check stub info record ' + csId
    							});
    							recUpdated = true;
    						}
    					}
    				}
    				return true;
    			});

    			// log.debug({
    			// 	title: 'search did not find match. Checking old vs new amounts',
    			// 	details: oldAmount + ' ' + typeof oldAmount + ', ' + newAmount + ' ' + typeof newAmount
    			// });
    			if (recUpdated == false) { //have not found match yet.
    				//check if amount is larger than old amount - these are negative numbers, remember
    				if (Math.abs(oldAmount) < Math.abs(newAmount)) {
    					log.debug({
    						title: 'Updating amount',
    						details: Math.abs(newAmount) - Math.abs(oldAmount)
    					});
    					//if so, create a new check stub info record with the associated information for the differing amount
    					var difference = -1 * (Math.abs(newAmount) - Math.abs(oldAmount));
    					createCheckStubRecord(curRec, applyId, difference);
    				} 
    				//if not, do nothing, per Matt's suggestion on 7/29/2019
    			}

    		}catch(ex) {
    			log.error({
    				title: 'Error in existingAmountMatch',
    				details: ex.message
    			});
    		}
    	}
    	function existingCheckStubRecord(curRec, applyId, amount) {
    		try{
    			//find any existing check stub info records that touch this same bill
    			var existingBillFilters = [];
    			existingBillFilters.push(search.createFilter({
    				name: 'custrecord_pp_apply_ids',
    				operator: search.Operator.CONTAINS,
    				values: curRec.id
    			}));
    			existingBillFilters.push(search.createFilter({
    				name: 'custrecord_pp_applied_to_bill',
    				operator: search.Operator.ANYOF,
    				values: applyId
    			}));
    			existingBillFilters.push(search.createFilter({ //checking that the bill payment has not been printed
    				name: 'custbody_pp_is_printed',
    				join: 'custrecord_pp_applied_to_bill_payment',
    				operator: search.Operator.IS,
    				values: false
    			}));
    			var existingBillSearch = search.create({
    				type: 'customrecord_pp_check_stub_info',
    				title: 'Existing Check Stub Record Search',
    				filters: existingBillFilters,
    				columns: ['internalid', 'custrecord_pp_applied_to_bill_payment']
    			});

    			//this will give the internal IDs of the *unprinted* check stub info records that touch this same bill.
    			var existingIds = [];
    			existingBillSearch.run().each(function(result) {
    				existingIds.push(result.getValue({
    					name: 'internalid' //changed from bp id
    				}));
    				return true;
    			});

    			log.debug({
    				title: 'existingIds',
    				details: existingIds.toString()
    			});

    			if (existingIds != null) {
    				return existingIds[0]; //just the first one, as we only need to update one
    			} else {
    				//if there are none, return false so we'll move on to creating a new one
    				return false;
    			}

    		}catch(ex) {
    			log.error({
    				title: 'Error in existingCheckStubRecord',
    				details: ex.message
    			});
    		}
    	}

    	function updateExisting(curRec, curAppId, amount, existingId){
    		try{
    			var csiRec = record.load({
    				type: 'customrecord_pp_check_stub_info',
    				id: existingId
    			});
    			var applyIds = csiRec.getValue({
    				fieldId: 'custrecord_pp_apply_ids'
    			});
    			var amountList = csiRec.getValue({
    				fieldId: 'custrecord_pp_amount_list'
    			});
    			var refNumList = csiRec.getValue({
    				fieldId: 'custrecord_pp_refnum_list'
    			});
    			var discountList = csiRec.getValue({
    				fieldId: 'custrecord_pp_disc_list'
    			});

    			//update values 
    			applyIds += ',' + curRec.id;
    			amountList += ',' + amount;
    			//refNumList += ',' + curRec.getValue({fieldId: 'tranid'});
    			refNumList += ',PREVIOUSLYAPPLIED';
    			discountList += ',';

    			//and reapply
    			csiRec.setValue({
    				fieldId: 'custrecord_pp_apply_ids',
    				value: applyIds
    			});
    			csiRec.setValue({
    				fieldId: 'custrecord_pp_amount_list',
    				value: amountList
    			});
    			csiRec.setValue({
    				fieldId: 'custrecord_pp_refnum_list',
    				value: refNumList
    			});
    			csiRec.setValue({
    				fieldId: 'custrecord_pp_disc_list',
    				value: discountList
    			});

    			//save Record
    			csiRec.save();

    		}catch(ex) {
    			log.error({
    				title: 'error in updateExisting',
    				details: ex.message
    			});
    		}
    	}
    	// function checkInfoRec(vcId) {
    	// 	var vcFilters = [];
    	// 	vcFilters.push(search.createFilter({
    	// 		name: 'custrecord_pp_is_bill_credit',
    	// 		operator: search.Operator.IS,
    	// 		values: true
    	// 	}));
    	// 	vcFilters.push(search.createFilter({
    	// 		name: 'custrecord_pp_apply_ids',
    	// 		operator: search.Operator.CONTAINS,
    	// 		values: vcId
    	// 	}));
    	// 	vcFilters.push(search.createFilter({
    	// 		name: 'custrecord_pp_applied_to_bill_payment',
    	// 		operator: search.Operator.ISEMPTY
    	// 	}));
    	// 	var vcColumns = ['internalid', 'custrecord_pp_apply_ids', 'custrecord_pp_amount_list', 'custrecord_pp_applied_to_bill'];
    	// 	var vcSearch = search.create({
    	// 		type: 'customrecord_pp_check_stub_info',
    	// 		filters: vcFilters,
    	// 		columns: vcColumns,
    	// 		title: 'Check Check Info Record'
    	// 	});
    		
    	// 	var vcResultSet = vcSearch.run();
    	// 	if (vcResultSet == null) {
    	// 		//check for one w/ existing bill payment, figure out how to handle that. If none,
    	// 		//create new check info record
    	// 		//***HANDLE IF CREATING BILL CREDIT AND *NOT* creating a new bill payment - add to existing payment that hasn't been printed
    	// 	} else if (vcResultSet.length > 1) {
    	// 		//figure out how to handle multiples
    	// 	} else {
    	// 		//update existing record
    	// 	}


    	// }

    	function createCheckStubRecord(curRec, curAppId, amount) {
    		try{
    			var csRec = record.create({
					type: 'customrecord_pp_check_stub_info'
				});
				csRec.setValue({
					fieldId: 'custrecord_pp_is_bill_credit',
					value: true
				});
				csRec.setValue({
					fieldId: 'custrecord_pp_applied_to_bill',
					value: curAppId
				});
				csRec.setValue({
					fieldId: 'custrecord_pp_apply_ids',
					value: curRec.id.toString()
				});
				csRec.setValue({
					fieldId: 'custrecord_pp_amount_list',
					value: amount
				});
				csRec.setValue({
					fieldId: 'custrecord_pp_refnum_list',
					value: 'PREVIOUSLYAPPLIED'
				});

				csRec.save();

    		} catch(ex){
    			log.error({
    				title: 'error in createCheckStubRecord',
    				details: ex.message
    			});
    		}
    	}
    	return{
    		afterSubmit: afterSubmit
    	};
    }
    );