/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/**
 * @author durbano
 */
function pageInit(type, form, request)
{
	
}

function onSaveRecord()
{
	var currentStatus = nlapiGetFieldValue('custbody_esc_tx_status');
	if(currentStatus == null || currentStatus == '') return true;
	
	var escrow = nlapiGetFieldValue('custbody2');
	if(escrow == null || escrow == '')
	{
		nlapiSetFieldValue('custbody_esc_tx_status','');
		return true;
	}
	
	//alert('currentStatus = ' + currentStatus);
	
	if(currentStatus == 'NEW' || currentStatus == 'UPDATED')
	{
		// initiate the allocation program here...
		var transid = nlapiGetFieldValue('internalid');
		var cnt = nlapiGetLineItemCount('line');
		for(var i = 1; i < (cnt + 1); i++)
		{
			// get the transaction data
			var accountId = nlapiGetLineItemValue('line','account',i); // account internal id
			var accountName = nlapiGetLineItemText('line', 'account', i);  // skip any line item where the account is anything other than 10***
			var drAmount = nlapiGetLineItemValue('line', 'debit', i);  // skip any line item where the amount is 0.00
			var crAmount = nlapiGetLineItemValue('line', 'credit', i); // skip any line item where the amount is 0.00
			if(crAmount != null) crAmount = crAmount * -1;
	
			// validate account information is ok for processing
			if(!validateAccount(accountName,crAmount,drAmount))	continue;
			
			//alert('Processing: ' + accountId + '/' + accountName + '/' + drAmount + '/' + crAmount);
			/*var params = new Array();
			params['custscript_transaction_id'] = transid;
			params['custscript_transaction_type'] = 'journalentry';
			params['custscript_allocation_action'] = 'allocate';
			params['custscript_transaction_line'] = cnt + 1;
			nlapiScheduleScript('customscript_alloc_scheduler_handler','customdeploy_alloc_scheduler_handler',params);*/
		}
	}

	return true;
}

function onFieldChange(type, name)
{
	var currentStatus = nlapiGetFieldValue('custbody_esc_tx_status');
	if(currentStatus == null || currentStatus == 'NEW' || currentStatus == 'UPDATED') return;
	
	if(type == 'line')
	{
		nlapiSetFieldValue('custbody_esc_tx_status', 'UPDATED', false);
		return;
	}

	if(name == 'trandate' || name == 'custbody1' || name == 'custbody2' || name == 'custbody3' || name == 'custbody4')
	{	// transaction date, escrow transaction, escrow, escrow account type, escrow statement memo
		nlapiSetFieldValue('custbody_esc_tx_status', 'MINOR_UPDATE', false);
		return;
	}
}
