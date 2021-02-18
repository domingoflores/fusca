/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jul 2014     smccurry
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function suitelet(request, response){
	if(request.getMethod() == 'GET') {
		
		var mainPage = buildDealDataReadyStartPage(request, response);
        response.writePage(mainPage);
        
	} else if(request.getMethod() == 'POST') {
		
		var dataIn = JSON.parse(request.getBody());
		if(dataIn.calltype != null && dataIn.calltype == 'buildtable') {
			var dealID = dataIn.deal;
			var tableHTML = buildListTable(dealID);
//			nlapiSetFieldValue('custpage_status_list', tableHTML, false);
			response.write(tableHTML);
		}
	}
}

function buildDealDataReadyStartPage(request, response) {
	if(request.getMethod() == 'GET') {
		var curUser = nlapiGetContext().getUser();
		var form = nlapiCreateForm('Exchange Records: Data Ready Status', true);  //Setup the generation form
		var dealField = form.addField('custpage_deal', 'select', 'Deal', 'customer');
		var buttonField = form.addField('custpage_button', 'inlinehtml', '', null);
		var buttonhtml = '<button id="createtable" type="button" class="btn btn-sm btn-default commentsButton">Submit</button>';
		buttonField.setDefaultValue(buttonhtml);
		var recList = form.addField('custpage_status_list', 'inlinehtml', '');
		var listHTML = '&nbsp;';
		recList.setDefaultValue(listHTML);
		recList.setLayoutType('outsidebelow');
		var scriptField = form.addField('custpage_script', 'inlinehtml', '', null, 'list_group');
		var htmlscript = '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js">';
		htmlscript += '</script>';
		scriptField.setDefaultValue(htmlscript);
		form.setScript('customscript_acq_lot_search_data_stat_cs');
		return form;
	}
}

//function searchExRecords(dealID) {
//	var filters = [];
//	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal',null,'is',dealID));
//	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_acqstatus', null, 'anyof', '1'));
//	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_lotdelivery', null, 'anyof', '5'));
//	var columns = [];
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal'));
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'));
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_contact'));
////	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shrhldstat'));
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_acqstatus'));
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_identcode'));
//	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_lotdelivery'));
////	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_acqstatus'));
//	return nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
//}

//function checkDataStatusOnClearingHouse(hashid) {	
//	var url = 'https://clearinghouse.srsacquiom.com/data/ready/' + hashid;
//	var dataReadyResponse = nlapiRequestURL(url);	
//	var dataReady = JSON.parse(dataReadyResponse.getBody()); 
//	return dataReady.status;
//}
