/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Apr 2014     smccurry
 * 1.01		  10 Oct 2014	  smccurry			Added in searchCreditMemoforPayment() before processing payment.
 * This searches for an existing Credit Memo created from the Exchange Record before creating a Credit Memo.
 * If a Credit Memo is found it will return that link displayed in an error message.  This will prevent the user
 * from creating two CM from the same Exchange Record.  Previously to this correction, if the user had opened
 * two tabs with the same exchange record before paying, both would have the 'Create DA' button which could allow
 * double payment.  Now a search for existing Credit Memos is done before the 'Create DA' button is added and before
 * the payment is made.
 * 
 * This is still a problem in the RMA payment pathway because it uses a workflow to create the payment.  That workflow would
 * need to be modified to prevent this from happening in an RMA.
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function createPPRecAndCreditMemo(request, response){
	nlapiLogExecution('DEBUG', 'REQUEST METHOD', request.getMethod());
	if(request.getMethod() == 'GET') {
		var txnid = request.getParameter('rec_id');
		var txntype = request.getParameter('rec_type');
		
		// CHECK TO MAKE SURE THERE IS NOT A CREDIT MEMO ALREADY CREATED.
		var cMemoResults = searchCreditMemoforPayment(txnid, txntype);
		if(cMemoResults != null && cMemoResults.length > 0) {
			var form = nlapiCreateForm('ERROR', false);
			var errorFld = form.addField('custpage_error', 'inlinehtml', 'ERROR');
			var errorHTML = '<p>A Credit Memo already exist for this record.<br>';
			for(var r = 0; r < cMemoResults.length; r++) {
				errorHTML += 'Credit Memo <a href="'+nlapiResolveURL('RECORD', 'creditmemo', cMemoResults[r].getId(), 'VIEW')+'">'+ cMemoResults[r].getValue('tranid') +'</a>'; 
			}
			errorHTML += '</p>';
			errorFld.setDefaultValue(errorHTML);
			response.writePage(form);
			
		} else {
			var results = copyPayInfoCreateCM(txnid);
			if(results.isSuccess()) {
				logMessage = "Credit memo created succesfully.";
				response.sendRedirect('RECORD', 'creditmemo', results.getReturnRecID(), 'view');
			} else {
				logMessage = "There was a problem creating a Credit Memo.";
				var msgs = results.getMessages();
				var html = '';
				for(var mLoop = 0; mLoop < msgs.length; mLoop++) {
					html += '<p class="textboldnolink">' + msgs[mLoop].message + '<p>';
				}
				var form = nlapiCreateForm('Error Message');
				var field1 = form.addField('custpage_html', 'inlinehtml', "", null);
				field1.setDefaultValue(html);
				response.writePage(form); 
			}
		}
		

	}
}

//ATP-1981 commented out
//
//function createPiraclePaymentList(request, response) {
//     var list = nlapiCreateList('Piracle Payment Records', false);
//     list.setStyle(request.getParameter('style'));
//     
//     var column = list.addColumn('custrecord_pp_ach_entity', 'text', 'Number', 'left');
//     column.setURL(nlapiResolveURL('RECORD','customrecord_pp_ach_account'));
//     column.addParamToURL('id','id', true);
// 
//     list.addColumn('custrecord_pp_ach_entity_display', 'text', 'Entity', 'left');
//     list.addColumn('custrecord_pp_ach_account_number', 'text', 'ACH Account Number', 'right');
//     list.addColumn('custrecord_pp_ach_routing_number', 'text', 'ACH Routing Number', 'right');
//     list.addColumn('custrecord_pp_ach_is_primary', 'text', 'Default Account', 'right');
//     list.addColumn('custrecord_pp_ach_sec_code_display', 'text', 'SEC Code', 'right');
//     list.addColumn('custrecord_pp_ach_transaction_code_display', 'text', 'Code', 'right');
//     list.addColumn('created', 'date', 'Date Created', 'right');
//     
//     var returncols = new Array();
//     returncols[0] = new nlobjSearchColumn('custrecord_pp_ach_entity');
//     returncols[1] = new nlobjSearchColumn('custrecord_pp_ach_account_number');
//     returncols[2] = new nlobjSearchColumn('custrecord_pp_ach_routing_number');
//     returncols[3] = new nlobjSearchColumn('custrecord_pp_ach_is_primary');
//     returncols[4] = new nlobjSearchColumn('custrecord_pp_ach_sec_code');
//     returncols[5] = new nlobjSearchColumn('custrecord_pp_ach_transaction_code');
//     returncols[6] = new nlobjSearchColumn('created');
// 
//     var results = nlapiSearchRecord('customrecord_pp_ach_account', null, null, returncols);
//     list.addRows(results);
//     response.writePage(list);
//}


function searchCreditMemoforPayment(txnid, txntype) {
	try {
		var filters = [];
		if(txntype == 'customrecord_acq_lot') {
			filters.push(new nlobjSearchFilter('custbody_acq_lot_createdfrom_exchrec',null,'is',txnid));
		} else if (txntype == 'returnauthorization') {
			filters.push(new nlobjSearchFilter('createdfrom',null,'is',txnid));
		}

		filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
		var columns = [];
		columns.push(new nlobjSearchColumn('tranid'));
		
		return nlapiSearchRecord('creditmemo', null, filters, columns);
	} catch(e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchCreditMemoforPayment() FAILED', JSON.stringify(err));
	}
	return null;
}
