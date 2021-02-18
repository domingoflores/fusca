/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jun 2014     smccurry
 *
 *
 * Description: This script looks up the bank name from the Fed ACH and Fed Wire records and
 * returns the name of the bank and the state that it is in.  This autopopulates a field.
 * Triggers on field change.
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum) {
	if (name == 'custbody_aqm_1_abaroutingnumber') {	
//		var fieldALength = String(nlapiGetFieldValue('custbody_acq_ach_bank_name')).length;
		var payMethod;
		var abanumber;
		var routingNumb;
		try {
			payMethod = nlapiGetFieldValue('custbody_acq_lot_payment_method_3');
			abanumber = nlapiGetFieldValue('custbody_aqm_1_abaroutingnumber');
			routingNumb = abanumber.toString();
		} catch(e) {
			return;
		}
//		011400495
		if(payMethod == 1) {
			try {
				var achbank = searchACHBankName(routingNumb);
				nlapiSetFieldValue('custbody_acq_ach_bank_name', achbank);
				return true;
			} catch(e) {
				console.log("Unable to set field 'custbody_acq_ach_bank_name' with wirebank: " + achbank);
			}
		} else if(payMethod == 4 || payMethod == 5) {
			try {
				var wirebank = searchWireBankName(routingNumb);
				nlapiSetFieldValue('custbody_acq_ach_bank_name', wirebank);
				return true;
			} catch(e) {
				console.log("Unable to set field 'custbody_acq_ach_bank_name' with wirebank: " + wirebank);
			}
		}
		if (routingNumb == null) {	
			return false;
		}
	}
}

function searchACHBankName(routingNumb) {

	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord162', null, 'is', routingNumb);
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord162');
	columns[1] = new nlobjSearchColumn('custrecord168');
	columns[2] = new nlobjSearchColumn('custrecord171');
	try{
		var results = nlapiSearchRecord('customrecord416', null, filters, columns);
	} catch(e) {
		return 'No bank name found.';
	}
	if(results.length == 1) {
		oneResult = results[0];
		if(oneResult != null && oneResult != '') {
			var bankName = oneResult.getValue('custrecord168');
			var bankState = oneResult.getValue('custrecord171');
			return bankName + ' - ' + bankState;
		} else {
			return 'No bank name found.';
		}
	} else {
		return 'Error: search returned more than one result.';
	}
	if(results == null || results == '') {
		return 'No bank name found.';
	}
}

function searchWireBankName(routingNumb) {
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord153', null, 'is', routingNumb);
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord153');
	columns[1] = new nlobjSearchColumn('custrecord155');
	columns[2] = new nlobjSearchColumn('custrecord156');
	try {
		var results = nlapiSearchRecord('customrecord415', null, filters, columns);
	} catch(e) {
		return 'No bank name found.';
	}
	if(results.length == 1) {
		oneResult = results[0];
		if(oneResult != null && oneResult != '') {
			var bankName = oneResult.getValue('custrecord168');
			var bankState = oneResult.getValue('custrecord171');
			return bankName + ' - ' + bankState;
		} else {
			return 'No bank name found.';
		}
	} else {
		return 'Error: search returned more than one result.';
	}
	if(results == null || results == '') {
		return 'No bank name found.';
	}
}
