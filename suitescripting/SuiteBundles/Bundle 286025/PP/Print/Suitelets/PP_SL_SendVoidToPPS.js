/**
 * Work around for nlapiOutboundSSO not working in user event script unless triggered from a form submit.
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 May 2014     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	response.setContentType('JAVASCRIPT');
	
	var tranid = request.getParameter('tranid');
	var recordType = getTranRecordType(tranid);
	
	if(tranid){
		try{
			nlapiVoidTransaction(recordType,tranid);
		}
		catch(e){
			if(e.name != 'PPS_VOID_ERR'){
				throw e;
			}
		}
		
		// oauth_token generated from user event script when transaction is voided is always expired for some reason
		// Because of this, we have to resend a void API to PPS from the suitelet
		$PPS.Transaction.sendVoidToExernalServer(tranid);
		response.write('1');
	}
	else{
		response.write('0');
	}
	
}


function getTranRecordType(tranId){
	var filters = [];
	
	filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
	filters.push(new nlobjSearchFilter('internalid',null,'anyof',[tranId]));
	
	var srs = nlapiSearchRecord('transaction', null, filters, null);
	
	if(srs){
		return srs[0].getRecordType();
	}
	return null;
}