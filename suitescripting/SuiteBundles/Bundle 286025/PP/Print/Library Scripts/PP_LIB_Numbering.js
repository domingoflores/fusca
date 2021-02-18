
/**
 * 
 * @param accountid
 * @returns int | null
 */
/*function getNextCheckNumber(accountid) {
	try{
		if(accountid != ""){
		    var columns = [],
				filters = [];
		
		    columns.push(new nlobjSearchColumn('tranid'));
		    columns[0].setSort(true);
		
		    filters.push(new nlobjSearchFilter('mainline', null, 'is', "T"));
		    filters.push(new nlobjSearchFilter('tobeprinted', null, 'is', "F"));
		    filters.push(new nlobjSearchFilter('account', null, 'is', accountid));
		    filters.push(new nlobjSearchFilter('formulanumeric', null, 'isNotEmpty')
		    	.setFormula('TO_NUMBER({number})')
		    );
		    
		    var results = nlapiSearchRecord('transaction', null, filters, columns);
		
		    if(results == null)
		    	return null;
		    
		    var tranid = parseInt(results[0].getValue('tranid'), 10) + 1;
		    if(checkNextCheckNumber(tranid, accountid)){
		    	return tranid;
		    }
		}
	}catch(e){
		
	}
	return null;
}*/

function getNextCheckNumber(accountid) {
	try{
		if(accountid != ""){
			var account = nlapiLoadRecord('account', accountid);
			var checkNumber = account.getFieldValue('curdocnum');
		    return checkNumber;
		}
	}catch(e){
		
	}
	return null;
}

/**
 * 
 * @param trans
 * @param accountid
 * @returns {Boolean}
 */
function checkNextCheckNumber(trans, accountid){
	try{
		if(trans != "" && accountid != ""){
		    var columns = [],
				filters = [];
		
		    filters.push(new nlobjSearchFilter('tranid', null, 'is', trans));
		    filters.push(new nlobjSearchFilter('mainline', null, 'is', "T"));
		    
		    var results = nlapiSearchRecord('transaction', null, filters, columns);	
		    if(results == null){
		    	return true;
		    }
		}
	}catch(e){}
    return false;
}

/**
 * 
 * @param t
 * @returns {String}
 */
function changeType(t) {
    switch (t) {
        case "p":
            return 'vendorpayment';
            break;
        case "r":
            return 'customerrefund';
            break;
        case "c":
        default:
            return 'check';
            break;
    }
}

function updatePayments(ids, accountid){
	try{
		var paymentRecords = nlapiLoadRecord('customrecord_pp_payment_parent', recId);
		
		if(paymentRecords != null){

			paymentRecords.selectNewLineItem('recmachcustbody_pp_parent_record');
			paymentRecords.setCurrentLineItemValue('recmachcustbody_pp_parent_record', 'number', 999);
			paymentRecords.commitLineItem('recmachcustrecord_mass_upd_parent');
		}
		response.write(JSON.stringify({'success':'true', 'error':''}));
	}catch(e){
		response.write(JSON.stringify({'success':'false', 'error':e.message}));
	}
}