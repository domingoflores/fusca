/**
 * Store Vendor Bills with Vendor Credits in a custom record. 
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Feb 2014     maxm
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord vendorpayment
 * @appliedtorecord vendorcredit
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
	try{
		nlapiLogExecution('DEBUG', 'Start', 'Begin');
		var recordType = nlapiGetRecordType();
		
		switch(recordType){
		case 'vendorpayment':
			vendorPaymentAfterSubmit(type);
			break;
		case 'vendorcredit':
			vendorCreditAfterSubmit(type);
			break;
		}
		
		nlapiLogExecution('DEBUG', 'End', 'End');
	}
	catch(e){
		nlapiLogExecution('ERROR',e.name,e.message);
	}
}



function vendorCreditAfterSubmit(type){
	var recordId = nlapiGetRecordId();
	if(!recordId){
		return;
	}
	if(type == 'edit'){
		//check to see if bill was unapplied from bill credit
		var applyableItems = extractAppylableItems();
		
		var keys = Object.keys(applyableItems);
		
		// bill being removed from record
		var billsToRemove = [];
		
		var vendpymtVendcredsSrs = vendpymtVendcredSearch([new nlobjSearchFilter('custrecord_pp_offset_bill_credit',null,'anyof',[recordId])]);
		
		//collect ids of bills applied to form
		for(var i = 0; i < keys.length; i++){
			var formAppliedItemInternalId = keys[i];
			var formAppliedItem = applyableItems[formAppliedItemInternalId];
			
			if(formAppliedItem.type == 'vendorbill'){
				if(!formAppliedItem.applied && billInResults(formAppliedItemInternalId,vendpymtVendcredsSrs)){
					billsToRemove.push(formAppliedItem.internalId);
				}
			}
		}
		
		// remove all customrecord_pp_vendpymt_vendcreds for bills being unapplied from payment
		if(billsToRemove.length > 0){
			for(var i = 0; i < billsToRemove.length; i++){
				var billId = billsToRemove[i];
				for(var j = 0; j < vendpymtVendcredsSrs.length; j++){
					if(vendpymtVendcredsSrs[j].getValue('custrecord_pp_offset_bill') == billId){
						try{
							nlapiDeleteRecord('customrecord_pp_vendpymt_vendcreds', vendpymtVendcredsSrs[j].getId());
						}
						catch(e){
							nlapiLogExecution('ERROR', 'Error Deleting customrecord_pp_vendpymt_vendcreds Record', e);
						}
					}
				}
			}
		}
	}
}

function vendorPaymentAfterSubmit(type){
	var recordId = nlapiGetRecordId();
	if(!recordId){
		return;
	}
	//var recordType = 'vendorpayment';
	//var recordId = '1703';
	
	if(type == 'create' || type == 'edit' || type == 'paybills'){
		//load record that was created
		//var rec = nlapiLoadRecord(recordType, recordId);
		
		var applyableItems = extractAppylableItems();
		/*var applyableItems = {
				1701 : {internalId : 1701, type: 'vendorbill', lineNum: 1},
				1702 : {internalId : 1702, type: 'vendorcredit', lineNum: 2},
				1700 : {internalId : 1700, type: 'vendorbill', lineNum: 3}
		};*/
		var keys = Object.keys(applyableItems);
		
		// bills being added to record
		var billsToAdd = [];
		// bill being removed from record
		var billsToRemove = [];
		
		var vendpymtVendcredsSrs = vendpymtVendcredSearch([new nlobjSearchFilter('custrecord_pp_offset_payment',null,'anyof',[recordId])]);
		
		//collect ids of bills applied to form
		for(var i = 0; i < keys.length; i++){
			var formAppliedItemInternalId = keys[i];
			var formAppliedItem = applyableItems[formAppliedItemInternalId];
			
			if(formAppliedItem.type == 'vendorbill' || formAppliedItem.type == 'journalentry'){ //add in ability to track bills paid by JEs as well
				if(formAppliedItem.applied && !billInResults(formAppliedItemInternalId,vendpymtVendcredsSrs)){
					billsToAdd.push(formAppliedItem.internalId);
				}
				else if(!formAppliedItem.applied && billInResults(formAppliedItemInternalId,vendpymtVendcredsSrs)){
					billsToRemove.push(formAppliedItem.internalId);
				}
			} 
		}

		// create customrecord_pp_vendpymt_vendcreds for bills being applied to payment with vendor credits applied
		if(billsToAdd.length > 0){
			//find all vendor credits and journals applied to bills
			var filters = [];
			var columns = [];
			
			filters.push(new nlobjSearchFilter('internalid',null,'anyof',billsToAdd));
			//want to allow JEs as well
			filters.push(new nlobjSearchFilter('type','applyingtransaction','anyof',['VendCred', 'Journal']));
			// Have seen duplicate VendCred applied of applyinglinktype Purchase Return with null amount applied
			filters.push(new nlobjSearchFilter('applyinglinktype',null,'is','Payment'));

			columns.push(new nlobjSearchColumn('internalid',null,'group'));
			columns.push(new nlobjSearchColumn('type','applyingtransaction','group'));
			columns.push(new nlobjSearchColumn('internalid','applyingtransaction','group'));
			
			var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
			
			if(searchResults){
				nlapiLogExecution('DEBUG', 'Results Found', searchResults.length);
				nlapiLogExecution('DEBUG', 'Results', JSON.stringify(searchResults));
				nlapiLogExecution('debug', 'recordId', recordId);
				
				// use parent record as workaround for governance limitations
				var parentRec = nlapiCreateRecord('customrecord_pp_vendpymt_vendcreds_paren');
				for(var i = 0; i < searchResults.length; i++){
					var searchResult = searchResults[i];
					parentRec.selectNewLineItem('recmachcustrecord_pp_offset_parent');
					if (recordId == 0 || recordId == null || recordId == undefined) {
						nlapiLogExecution('debug', 'No payment', 'no payment record to record');
						//parentRec.setCurrentLineItemValue('recmachcustrecord_pp_offset_parent','custrecord_pp_offset_payment',searchResult.getValue('internalid', 'applyingtransaction', 'group'));
					} else {
						parentRec.selectNewLineItem('recmachcustrecord_pp_offset_parent');
						parentRec.setCurrentLineItemValue('recmachcustrecord_pp_offset_parent','custrecord_pp_offset_payment',recordId);
						parentRec.setCurrentLineItemValue('recmachcustrecord_pp_offset_parent','custrecord_pp_offset_bill',searchResult.getValue('internalid',null,'group'));
						parentRec.setCurrentLineItemValue('recmachcustrecord_pp_offset_parent','custrecord_pp_offset_bill_credit',searchResult.getValue('internalid','applyingtransaction','group'));
						parentRec.commitLineItem('recmachcustrecord_pp_offset_parent');

					}
				}
				
				var parentRecId = nlapiSubmitRecord(parentRec);
				nlapiDeleteRecord('customrecord_pp_vendpymt_vendcreds_paren',parentRecId);
			}
		}
		
		// remove all customrecord_pp_vendpymt_vendcreds for bills being unapplied from payment
		if(billsToRemove.length > 0){
			for(var i = 0; i < billsToRemove.length; i++){
				var billId = billsToRemove[i];
				for(var j = 0; j < vendpymtVendcredsSrs.length; j++){
					if(vendpymtVendcredsSrs[j].getValue('custrecord_pp_offset_bill') == billId){
						try{
							nlapiDeleteRecord('customrecord_pp_vendpymt_vendcreds', vendpymtVendcredsSrs[j].getId());
						}
						catch(e){
							nlapiLogExecution('ERROR', 'Error Deleting customrecord_pp_vendpymt_vendcreds Record', e);
						}
					}
				}
			}
		}
	}
}

/**
 * Extract apply sublist from the form and find each items record type
 * 
 * @returns {Object} Hash of applied transaction ids to type,lineNum,internalId and applied
 */
function extractAppylableItems(){
	var extractedItems = {};
	var numLineItems = nlapiGetLineItemCount('apply');
	
	var appliedTranIds = [];
	for(var i = 1; i <= numLineItems; i++){
		appliedTranIds.push(nlapiGetLineItemValue('apply', 'doc', i));
		var obj = {
				type: null,
				lineNum: i,
				internalId: nlapiGetLineItemValue('apply', 'doc', i),
				applied: (nlapiGetLineItemValue('apply', 'apply', i) == 'T' ? true : false)
		};
		extractedItems[nlapiGetLineItemValue('apply', 'doc', i)] = obj;
	}
	
	if(appliedTranIds.length > 0){
		var filters = [];
		var columns = [];
		
		filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
		filters.push(new nlobjSearchFilter('internalid',null,'anyof',appliedTranIds));
		
		// use grouped internalid and type columns instead of getId and getRecordType because the mainline filter does not work for journals.
		columns.push(new nlobjSearchColumn('internalid',null,'group'));
		columns.push(new nlobjSearchColumn('type',null,'group'));
		
		var search = nlapiCreateSearch('transaction', filters, columns);
		var resultSet = search.runSearch();
		var start = 0; //incluse start index
		var end = 1000; //exlusive end index
		
		while(true){
			var searchResults = resultSet.getResults(start,end);
			
			for(var i = 0; i < searchResults.length; i++){
				extractedItems[searchResults[i].getValue('internalid',null,'group')].type = typeToRecordType(searchResults[i].getValue('type',null,'group'));
			}
			if(searchResults.length < 1000){
				break;
			}
			start += 1000;
			end += 1000;
		}
	
	}
	
	return extractedItems;	
}


function typeToRecordType(type){
	switch(type){
	case 'VendBill':
		return 'vendorbill';
		break;
	case 'VendCred':
		return 'vendorcredit';
		break;
	case 'Journal':
		return 'journal';
		break;
	default:
		return null;
	}
}

/**
 * Find all customrecord_pp_vendpymt_vendcreds for a vendor payment or vendor credit
 * @param {Array} filters - An array of nlobjSearchFilters
 * @returns {Array}
 */
function vendpymtVendcredSearch(filters){
	var columns = [];
	
	columns.push(new nlobjSearchColumn('custrecord_pp_offset_payment'));
	columns.push(new nlobjSearchColumn('custrecord_pp_offset_bill'));
	columns.push(new nlobjSearchColumn('custrecord_pp_offset_bill_credit'));
	
	return nlapiSearchRecord('customrecord_pp_vendpymt_vendcreds', null, filters, columns);
}


/**
 * Check to see if a bill exists in a given set of customrecord_pp_vendpymt_vendcreds search results
 * @param {Number} billId
 * @param {Array} vendpymtVendcredsSrs
 * @returns {Boolean}
 */
function billInResults(billId,vendpymtVendcredsSrs){
	if(vendpymtVendcredsSrs){
		for(var i = 0; i < vendpymtVendcredsSrs.length; i++){
			if(vendpymtVendcredsSrs[i].getValue('custrecord_pp_offset_bill') == billId){
				return true;
			}
		}
	}
	return false;
}

//userEventAfterSubmit('create');