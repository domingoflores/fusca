/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Apr 2014     smccurry
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	if(request.getMethod() == 'GET' || request.getMethod() == 'POST') {
		var rmaRecId = request.getParameter('rec_id');
		var recType = request.getParameter('rec_type');
		var ppRecId = copyPaymentInfo(rmaRecId);
		var message;
		if(ppRecId != null && ppRecId != '') {
			message = "ACH record created successfully!";
		} else {
			message = "There was a problem creating your ACH record.";
		}
		var ppRecLink = nlapiResolveURL('RECORD', 'customrecord_pp_ach_account', ppRecId, 'VIEW');
		
		var form = nlapiCreateForm('Results');
		var htmlField = form.addField('htmlfield', 'inlinehtml', '');
		var htmlText = '<html><head></head>';
		htmlText += '<h2>' + message + '</h2><br>';
		htmlText += '<span><a href="'+ppRecLink+'">Piracle ACH Record: '+ppRecId+'</a></span><br>';
		htmlField.setDefaultValue(htmlText);
		form.addButton('back_button', 'Back to LOT', "window.location = '"+nlapiResolveURL('RECORD', 'returnauthorization', rmaRecId, 'VIEW')+"'");
	    response.writePage(form);
	}
}

function createPiraclePaymentList(request, response) {
     var list = nlapiCreateList('Piracle Payment Records', false);
     list.setStyle(request.getParameter('style'));
     
     var column = list.addColumn('custrecord_pp_ach_entity', 'text', 'Number', 'left');
     column.setURL(nlapiResolveURL('RECORD','customrecord_pp_ach_account'));
     column.addParamToURL('id','id', true);
 
     list.addColumn('custrecord_pp_ach_entity_display', 'text', 'Entity', 'left');
     list.addColumn('custrecord_pp_ach_account_number', 'text', 'ACH Account Number', 'right');
     list.addColumn('custrecord_pp_ach_routing_number', 'text', 'ACH Routing Number', 'right');
     list.addColumn('custrecord_pp_ach_is_primary', 'text', 'Default Account', 'right');
     list.addColumn('custrecord_pp_ach_sec_code_display', 'text', 'SEC Code', 'right');
     list.addColumn('custrecord_pp_ach_transaction_code_display', 'text', 'Code', 'right');
     list.addColumn('created', 'date', 'Date Created', 'right');
     
     var returncols = new Array();
     returncols[0] = new nlobjSearchColumn('custrecord_pp_ach_entity');
     returncols[1] = new nlobjSearchColumn('custrecord_pp_ach_account_number');
     returncols[2] = new nlobjSearchColumn('custrecord_pp_ach_routing_number');
     returncols[3] = new nlobjSearchColumn('custrecord_pp_ach_is_primary');
     returncols[4] = new nlobjSearchColumn('custrecord_pp_ach_sec_code');
     returncols[5] = new nlobjSearchColumn('custrecord_pp_ach_transaction_code');
     returncols[6] = new nlobjSearchColumn('created');
 
     var results = nlapiSearchRecord('customrecord_pp_ach_account', null, null, returncols);
     list.addRows(results);
     response.writePage(list);
}
