/**
 * This suitelet listens for PayPal Mass Payment IPNs(Instant Payment Notifications) sent from PayPal. When a
 * successful IPN is the mass payment record on NetSuite is updated. This Suitelet is available without login.
 * 
 * 
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Mar 2014     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){	
	var body = request.getBody();
	nlapiLogExecution('DEBUG', 'request body', body);
	
	var paramsObj = PPSLibPayPal.extractNameValuePairs(body);
	nlapiLogExecution('DEBUG', 'request extracted', JSON.stringify(paramsObj));
	
	var rec = nlapiCreateRecord('customrecord_pp_paypal_ipn_log');
	rec.setFieldValue('custrecord_pp_paypal_ipn_body', JSON.stringify(paramsObj));
	if(paramsObj.txn_type){
		rec.setFieldValue('custrecord_pp_paypal_ipn_txn_type', paramsObj.txn_type);
	}
	nlapiSubmitRecord(rec);
	
	// only handle masspay IPNs
	if(!paramsObj.txn_type || paramsObj.txn_type != 'masspay'){
		// TODO: return a success response anyways so paypal stops sending us the IPN
		return;
	}
	
	var fromSandbox = (typeof paramsObj.test_ipn != 'undefined' && paramsObj.test_ipn == 1);
	// verify message
	if(verifyIPN(body,fromSandbox) && findAllPaypalSenderEmails().indexOf(paramsObj.payer_id) >= 0){
		nlapiLogExecution('DEBUG', 'IPN Verification','VERIFIED');
		
		// get items in usable format
		var itemArr = [];
		var i = 1;
		var fieldBases = ['masspay_txn_id','unique_id','status','receiver_email','mc_gross','mc_fee','mc_currency','reason_code'];
		while(true){
			if(fieldBases[0] + '_' + i in paramsObj){
				var obj = {};
				for(var j = 0; j < fieldBases.length; j++){
					obj[fieldBases[j]] = paramsObj[fieldBases[j] + '_' + i];
				}
				itemArr.push(obj);
			}
			else{
				break;
			}
			i++;
		}
		
		nlapiLogExecution('DEBUG','usable format',JSON.stringify(itemArr));
		
		if(itemArr.length == 0){
			nlapiLogExecution('ERROR', 'No items found in post body', 'Could not find any items in IPN sent from PayPal');
			return;
		}
		
		// get the mass payment id from the first item
		var idsObj = parseUniqueId(itemArr[0].unique_id);
		
		var massPayRec = nlapiLoadRecord('customrecord_pp_paypal_mass_payments', idsObj.massPaymentId);
		
		var numSublistItems = massPayRec.getLineItemCount('recmachcustrecord_pp_paypal_mptran_mass_payment');
		var itemsPending = false;
		var grossTotal = 0;
		// Update customrecord_pp_paypal_mp_transactions records using sublist of the massPay record
		for(var i = 0; i < itemArr.length; i++){
			var item = itemArr[i];
			var uniqueIdObj = parseUniqueId(item.unique_id);
			
			for(var j = 1; j <= numSublistItems; j++){
				var mpTranId = massPayRec.getLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_transaction', j);
				if(mpTranId == uniqueIdObj.tranId){
					var mpTranStatus = massPayRec.getLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_tran_status', j);
					// the order of IPNs is not guaranteed. Make sure status is not already a final status
					// the status does not change
					//if(!mpTranStatus || mpTranStatus == 'Pending'){
						massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_tran_status', j, item.status);
						// reason code field only exists when transaction status is Failed
						if(item.status == 'Failed'){
							massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_reason_code', j, item.reason_code);
						}
						else if(item.status == 'Pending' || item.status == 'Unclaimed'){
							itemsPending = true;
						}
					//}
					
					massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_mp_txn_id', j, item.masspay_txn_id);
					massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_fee', j, item.mc_fee);
					massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_gross_amt', j, item.mc_gross);
					massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_currency_cod', j, item.mc_currency);
					
					grossTotal += parseFloat(item.mc_gross);
					
					break;
				}
			}
		}
		
		massPayRec.setFieldValue('custrecord_pp_paypal_mp_total',grossTotal.toFixed(2));
		
		// the order of IPNs is not guaranteed. Make sure status is not already finished
		// existing status will be blank or null when this is the first IPN received
		if(!massPayRec.getFieldValue('custrecord_pp_paypal_mp_status') || massPayRec.getFieldValue('custrecord_pp_paypal_mp_status') == 'Running'){
			massPayRec.setFieldValue('custrecord_pp_paypal_mp_payment_status',paramsObj.payment_status);
			if(paramsObj.payment_status == 'Completed' || itemsPending){
				if(itemsPending){
					massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Pending');
				}
				else{
					massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Complete');
				}
				// only sync when mass payment IPN payment_status is Completed
				massPayRec.setFieldValue('custrecord_pp_paypal_mp_needs_sync', 'T');
			}
			else if(paramsObj.payment_status == 'Denied'){
				massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Failed');
			}
		}
		
		// If needs sync is T, saving the record will trigger a User Event script that in turn calls a scheduled script to sync data from PayPal and cached fields
		nlapiSubmitRecord(massPayRec);
		
	}
	else{
		nlapiLogExecution('DEBUG', 'IPN Verification','FAILED');
	}
	
}


function parseUniqueId(uniqueId){
	var unqiueIdArr = uniqueId.split('_');
	var obj = {
			massPaymentId : unqiueIdArr[0].substr(2),
			tranId : unqiueIdArr[1].substr(1),
			recordType :  $PPS.Transaction.convertToType(unqiueIdArr[1].substr(0,1))
	};
	return obj;
}

/**
 * Send the POST body back to PayPal to see if PayPal did indeed send us this exact IPN request.
 *  
 * @param {String} body - the raw post body sent from netsuite
 * @returns {Boolean}
 */
function verifyIPN(body,sandbox){
	
	var apiUrl = PPSLibPayPal.getProductionVerifyIPNUrl();
	if(sandbox){
		apiUrl = PPSLibPayPal.getSandboxVerifyIPNUrl();
	}
	
	try{
		var resp = nlapiRequestURL(apiUrl, 'cmd=_notify-validate&' + body, null, 'POST');
		
		if(resp.getCode() == '200'){
			var respBody = resp.getBody();
			if(respBody && respBody == 'VERIFIED'){
				return true;
			}
			else{
				nlapiLogExecution('ERROR', 'IPN Verification Failure', respBody);
			}
		}
		else{
			nlapiLogExecution('ERROR', 'IPN Verification Failure', 'response code ' + resp.getCode());
		}
	}
	catch(e){
		nlapiLogExecution('ERROR', e.name,e.message);
	}

	return false;
}

function findMassPaymentTransactionRecordId(mpId,tranId){
	var filters = [];
	
	filters.push(new nlobjSearchFilter('custrecord_pp_paypal_mptran_mass_payment',null,'is',mpId));
	filters.push(new nlobjSearchFilter('custrecord_pp_paypal_mptran_transaction',null,'is',tranId));
	
	var searchResults = nlapiSearchRecord('customrecord_pp_paypal_mp_transactions',null,filters);
	if(searchResults){
		return searchResults[0].getId();
	}
	return null;
}

/**
 * Find all paypal payer emails on paypal enabled accounts
 * 
 * @returns {Array}
 */
function findAllPaypalSenderEmails(){
	var emails = [];
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('custrecord_pp_is_paypal_account',null,'is','T'));
	filters.push(new nlobjSearchFilter('custrecord_pp_paypal_payer_id',null,'isnotempty'));
	
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_payer_id'));
	var searchResults = nlapiSearchRecord('account',null,filters,columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			emails.push(searchResults[i].getValue('custrecord_pp_paypal_payer_id'));
		}
	}
	return emails;
}
