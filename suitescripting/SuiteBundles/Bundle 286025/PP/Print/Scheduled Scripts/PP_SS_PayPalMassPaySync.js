/**
 * This script does two things:
 * 	- If any of mass payment's transactions have status of Pending or Unclaimed, we pull each payments status down from PayPal
 * 		to see if it has been updated.
 *  - Update the cached transaction body fields on each transaction and calculate the paid total.
 * 
 * @author Max
 * 4/4/2014
 *
*/

$PPS.where = "paypalMassPaySync";
$PPS.debug = true;

function scheduled(type) {
	$PPS.log("*** Start ***");
	$PPS.log("type: " + type);
	
	var context = nlapiGetContext();
	
	// Get the massPay record id
	var massPayId = context.getSetting('SCRIPT', 'custscript_masspay_id');
	if ($PPS.IsEmpty(massPayId)) {
	    $PPS.log("MassPay id is empty");
	    return;
	}
	
	syncMassPaymentsPendingTransactions(massPayId);
	
	syncCachedTransactionBodyFields(massPayId);

    // Check to see if any mass payments marked for syncing. Get oldest record and reschedule for execution
    // We have to do this because NetSuite will only let us schedule the deployment if it is not scheduled.
    var filters = [
                   new nlobjSearchFilter('custrecord_pp_paypal_mp_needs_sync',null,'is','T')
                   ];
    var columns = [
                   new nlobjSearchColumn('internalid').setSort(false)
                 ];
    var searchResults = nlapiSearchRecord('customrecord_pp_paypal_mass_payments', null, filters, columns);
    if(searchResults){
    	$PPS.log('Another masspay was found. ReScheduling script with status list id ' + searchResults[0].getId());
    	 // query the customrecord_pp_print_status for Scheduled jobs, if we find one reschedule script
	    var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), 
            	{ "custscript_masspay_id": 		searchResults[0].getId()
            	  });
	    $PPS.log('Status of script '+ status);
    }
	    
    $PPS.log("*** End ***");
}

/**
 * Get Pending transaction details from PayPal and update the Mass Payment record.
 * If no transactions are Pending the mass payment status is set to completed.
 * If the transaction is still pending, we record the pending reason.
 * 
 * @param {string} massPayId - The mass payment record id
 */
function syncMassPaymentsPendingTransactions(massPayId){
	// Get the status from
	var massPayRec = nlapiLoadRecord('customrecord_pp_paypal_mass_payments',massPayId);
	
	if(massPayRec.getFieldValue('custrecord_pp_paypal_mp_status') == 'Pending'){
		// flag determines if any transactions in the mass payment are still pending
		var stillPending = false;
		var config = PPSLibPayPal.loadPayPalConfig(massPayRec.getFieldValue('custrecord_pp_paypal_mp_account'));
		var numItems = massPayRec.getLineItemCount('recmachcustrecord_pp_paypal_mptran_mass_payment');
		
		for(var line = 1; line <= numItems; line++){
			var tranStatus = massPayRec.getLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_tran_status', line);
			if(tranStatus == 'Pending' || tranStatus == 'Unclaimed'){
				try{
					// get transaction details from paypal
					var paramObj = PPSLibPayPal.getTransactionDetails(config,massPayRec.getLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_mp_txn_id', line));
					
					if(paramObj.PAYMENTSTATUS == 'Pending'){
						massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_pending_reas', line, paramObj.PENDINGREASON);
						stillPending = true;
					}
					else if(paramObj.PAYMENTSTATUS == 'Unclaimed'){
						nlapiLogExecution('DEBUG', 'PAYMENTSTATUS', 'Still unclaimed');
						stillPending = true;
					}
					else{
						massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_tran_status', line, paramObj.PAYMENTSTATUS);
						if(paramObj.REASONCODE){
							massPayRec.setLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment', 'custrecord_pp_paypal_mptran_reason_code', line, paramObj.REASONCODE);
						}
					}
				}
				catch(e){
					nlapiLogExecution('ERROR', e.name, e.toString());
					stillPending = true;
				}
			}
		}
		
		if(!stillPending){
			massPayRec.setFieldValue('custrecord_pp_paypal_mp_status', 'Complete');
		}
		
		nlapiSubmitRecord(massPayRec); 
	}
}

/**
 * This function updates each transaction's custom PayPal fields with the fields stored in the customrecord_pp_paypal_mp_transactions custom record for a mass payment
 * 
 * @param {string} massPayId - The mass payment record id
 */
function syncCachedTransactionBodyFields(massPayId){
	// Get customrecord_pp_paypal_mp_transactions fields
	var mpTranSearchResults = massPaymentsTransactionSearch(massPayId);
	var feeTotal = 0;
	var grossPaid = 0;
	
	// Update cached transaction body fields with customrecord_pp_paypal_mp_transactions fields
	for(var i = 0; i < mpTranSearchResults.length; i++){ 
	   var searchResult = mpTranSearchResults[i];
	   try{
		   var transRec = nlapiLoadRecord(searchResult.getValue('recordtype','custrecord_pp_paypal_mptran_transaction'),searchResult.getValue('custrecord_pp_paypal_mptran_transaction'));
		   var recChanged = false;
	   
		   if(searchResult.getValue('custbody_pp_is_printed') == 'F'){
			   transRec.setFieldValue('custbody_pp_is_printed','T');
			   recChanged = true;
		   } 
		   
		   if(transRec.getFieldValue('custbody_pp_paypal_tran_status') != searchResult.getValue('custrecord_pp_paypal_mptran_tran_status')){
			   transRec.setFieldValue('custbody_pp_paypal_tran_status',searchResult.getValue('custrecord_pp_paypal_mptran_tran_status'));
			   recChanged = true;
		   }
		   
		   if(transRec.getFieldValue('custbody_pp_paypal_txn_id') != searchResult.getValue('custrecord_pp_paypal_mptran_mp_txn_id')){
			   transRec.setFieldValue('custbody_pp_paypal_txn_id',searchResult.getValue('custrecord_pp_paypal_mptran_mp_txn_id'));
			   recChanged = true;
		   }
		   
		   if(transRec.getFieldValue('custbody_pp_paypal_reason_code') != searchResult.getValue('custrecord_pp_paypal_mptran_reason_code')){
			   transRec.setFieldValue('custbody_pp_paypal_reason_code',searchResult.getValue('custrecord_pp_paypal_mptran_reason_code'));
			   recChanged = true;
		   }
		   
		   if(transRec.getFieldValue('custbody_pp_paypal_mass_payment') != massPayId){
			   transRec.setFieldValue('custbody_pp_paypal_mass_payment',massPayId);
			   recChanged = true;
		   }
			   
		   if(recChanged){
			   nlapiSubmitRecord(transRec, true);
		   }
		   
		   //TODO: Find out what the fee is/ total gross amt when one of many payments is denied or failed
		   feeTotal += parseFloat(searchResult.getValue('custrecord_pp_paypal_mptran_fee'));
		   
		   if(searchResult.getValue('custrecord_pp_paypal_mptran_tran_status') == 'Completed'){
			   grossPaid += parseFloat(searchResult.getValue('custrecord_pp_paypal_mptran_gross_amt'));
		   }
	   }
	   catch(e){
		   nlapiLogExecution('ERROR', e.name, e.toString());
	   }
	}

	try{
		var massPayRec = nlapiLoadRecord('customrecord_pp_paypal_mass_payments',massPayId);
		massPayRec.setFieldValue('custrecord_pp_paypal_mp_needs_sync', 'F');
		massPayRec.setFieldValue('custrecord_pp_paypal_mp_fee',feeTotal.toFixed(2));
		massPayRec.setFieldValue('custrecord_pp_paypal_mp_total_paid',grossPaid.toFixed(2));
		
		if(massPayRec.getFieldValue('custrecord_pp_paypal_mp_status') == 'Complete' && !massPayRec.getFieldValue('custrecord_pp_paypal_mp_fee_transaction') && nlapiGetContext().getSetting('SCRIPT','custscript_pp_paypal_auto_fee') == 'T'){
			// Create expense check for paypal fee
			try{
				var paypalAccountRec = nlapiLoadRecord('account', massPayRec.getFieldValue('custrecord_pp_paypal_mp_account'));
				
				if(paypalAccountRec.getFieldValue('custrecord_pp_paypal_fee_expense_account')){
					var expenseCheck = new nlapiCreateRecord('check');
					
					expenseCheck.setFieldValue('account',massPayRec.getFieldValue('custrecord_pp_paypal_mp_account'));
					expenseCheck.setFieldValue('currency',paypalAccountRec.getFieldValue('currency'));
					expenseCheck.setFieldValue('amount',massPayRec.getFieldValue('custrecord_pp_paypal_mp_fee'));
					expenseCheck.setFieldValue('memo','PayPal Mass Payment Fee');
					expenseCheck.setFieldValue('tobeprinted','F');
					expenseCheck.setFieldValue('tranid',null);
					
					if(nlapiGetContext().getFeature('SUBSIDIARIES')){
						expenseCheck.setFieldValue('subsidiary',paypalAccountRec.getFieldValue('subsidiary'));
					}
					
					if(paypalAccountRec.getFieldValue('custrecord_pp_paypal_fee_payee') != null){
						expenseCheck.setFieldValue('entity',paypalAccountRec.getFieldValue('custrecord_pp_paypal_fee_payee'));
					}
					
					// set trandate to date that mass payment was created
					expenseCheck.setFieldValue('trandate',nlapiDateToString(nlapiStringToDate(massPayRec.getFieldValue('created'),'datetime'),'date'));
					expenseCheck.setFieldText('custbody_pp_payment_method','Do Not Process With AvidXchange');
					expenseCheck.setFieldText('custbody_pp_approval_status',null);
					
					expenseCheck.selectNewLineItem('expense');
					expenseCheck.setCurrentLineItemValue('expense','account',paypalAccountRec.getFieldValue('custrecord_pp_paypal_fee_expense_account'));
					expenseCheck.setCurrentLineItemValue('expense','amount',massPayRec.getFieldValue('custrecord_pp_paypal_mp_fee'));
					expenseCheck.commitLineItem('expense');
					
					var expenseCheckId = nlapiSubmitRecord(expenseCheck, { disabletriggers: true, enablesourcing: false, ignoremandatoryfields: true });
					
					massPayRec.setFieldValue('custrecord_pp_paypal_mp_fee_transaction',expenseCheckId);
				}
			}
			catch(e){
				nlapiLogExecution('ERROR', 'Error creating fee check for mass payment', e.toString());
			}
			
		}
		nlapiSubmitRecord(massPayRec);
	}
	catch(e){
		$PPS.log(e);
		return;
	}
}

/**
 * Get Mass Pay transaction line item details
 * 
 * @param massPayRecId
 * @returns {Array}
 */
function massPaymentsTransactionSearch(massPayRecId){
	var filters = [];
	var columns = [];
	
	columns.push(new nlobjSearchColumn('recordtype','custrecord_pp_paypal_mptran_transaction'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_transaction'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_tran_status'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_mp_txn_id'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_reason_code'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_fee'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_gross_amt'));
	columns.push(new nlobjSearchColumn('custrecord_pp_paypal_mptran_currency_cod'));

	filters.push(new nlobjSearchFilter('custrecord_pp_paypal_mptran_mass_payment',null,'is',massPayRecId));
	filters.push(new nlobjSearchFilter('mainline','custrecord_pp_paypal_mptran_transaction','is','T'));

	return nlapiSearchRecord('customrecord_pp_paypal_mp_transactions', null, filters, columns);
}