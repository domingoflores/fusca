/**
 * Module Description
 * 
 * This creates a page that list all of the payments ready to be made
 * based on the 'LOT'S TO PAY TODAY' search and the 'CLEARINGHOUSE LOT'S READY TO PAY TODAY'
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Jul 2014     smccurry		   Installed on Production
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
		var form = nlapiCreateForm('Exchange Records: Distribution Approval List', true);  //Setup the generation form
		var dealField = form.addField('custpage_deal', 'select', 'Deal', 'customer');
//		var payMethod = form.addField('custpage_paymethod', 'select', 'Deal', 'customer');
		
	    var payMethod = form.addField('custpage_paymethod', 'select', 'Payment Method');
	    payMethod.addSelectOption('','All Types');
	    payMethod.addSelectOption('1','ACH');
	    payMethod.addSelectOption('2','Domestic Check');
	    payMethod.addSelectOption('3','International Check');
	    payMethod.addSelectOption('4','Domestic Wire');
	    payMethod.addSelectOption('5','International Wire');
	    
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
		var ACQ_LOT_DA_Bootstrap_JavaScript = nlapiLoadFile('SuiteBundles/Bundle 53315/js_libraries/bootstrap.min.js');
		htmlscript += '<script>' + ACQ_LOT_DA_Bootstrap_JavaScript.getValue() + '</script>';
		scriptField.setDefaultValue(htmlscript);
		form.setScript('customscript_acq_lot_da_approv_ajax_cs');
		return form;
	}
}


function buildpayMethodListOBJ(exRec) {
	var payMethodsField = exRec.getField('custrecord_acq_loth_4_de1_lotpaymethod');
	var payMethods = payMethodsField.getSelectOptions();
	
	var payMethodObj = {};
	for(sLoop in payMethods) {
		var currentID = 'id_' + payMethods[sLoop].id;
		var currentText = payMethods[sLoop].text;
		payMethodObj[currentID] = currentText;
	}
	return payMethodObj;
}

function buildSelectOptionsHTML(obj) {
	var optionsHTML = '';
	for(sLoop in obj) {
		var tempArry = sLoop.split('_');
		var currentID = tempArry[1];
		var currentText = obj[sLoop];
		optionsHTML += '<option value='+ currentID +'>' + currentText + '</options>';
	}
	return optionsHTML;
}
