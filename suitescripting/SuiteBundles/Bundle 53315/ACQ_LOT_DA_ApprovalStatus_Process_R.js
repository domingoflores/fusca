/**
 * Module Description
 * Handles the Ajax Request from the Distribution Approval Page
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Jul 2014     smccurry		   Install on Production
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function postRESTlet(dataIn) {
	var responseData = {};
	
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	
	if(dataIn.calltype != null && dataIn.calltype == 'buildtable') {
		var dealID = dataIn.deal;
		var payMethod = dataIn.paymethod;
		var listHTML = buildLOTList(dealID, payMethod);
		responseData.calltype = 'buildtable';
		responseData.callbacktype = 'buildtable';  // would like to switch over to using callbacktype instead of reassigning the calltype.  This would be used by the response handler in the client script to determine how to parse the data.
		responseData.html = listHTML;
		return JSON.stringify(responseData);
	} else if(dataIn.calltype != null && dataIn.calltype == 'callMCPapi') {
		var btnID = dataIn.btnID;
		var idArr = btnID.split('_');
		var hashID = idArr[2];
		var recID = idArr[1];
		hashID = hashID.trim();
		var dataReadyObj = checkDataStatusOnClearingHouse(hashID);
		responseData.calltype = 'callMCPapi';
		responseData.btnID = btnID;
		responseData.hashID = hashID;
		responseData.recID = recID;
		responseData.datareadystatus = dataReadyObj;
		return JSON.stringify(responseData);
	}
	return {};
}

function buildLOTList(dealID, payMethod) {
	var listHTML = '';
	try {
    	var ACQ_LOT_DA_Docs_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DA_Docs_CSS.css');
//    	var ACQ_LOT_DA_Approve_Status_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DA_Approve_Status_CSS.css');
    } catch (e) {
    	// TODO: ADD ERROR MESSAGE HERE
    	nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss');
    }
    listHTML += '<head>';
    listHTML += '<style>';
    listHTML += ACQ_LOT_DA_Docs_CSS.getValue();
//    listHTML += ACQ_LOT_DA_Approve_Status_CSS.getValue();
    listHTML += '.text { font-size:10pt }';
    listHTML += '</style>';
    listHTML += '<meta charset="utf-8">';
    listHTML += '<title>Exchange Records to Pay Today</title>';
    listHTML += '<meta name="author" content="smccurry">';
    listHTML += '</head>';
    listHTML += '<body>';
//    listHTML += '<h1>Testing</h1>';
    listHTML += '<br>';
    listHTML += '<div id="lotlist" class="container">';
    
    // TABLE START
    listHTML += '<table class="table table-hover" style="border-collapse:collapse;">';
	//THEAD
    listHTML += '<thead>';
    listHTML += '<tr style="font-size:10px;font-weight:600;">';
    listHTML += '<th>#</th>';
    listHTML += '<th>ID</th>';
    listHTML += '<th>DEAL</th>';
    listHTML += '<th>SHAREHOLDER / CONTACT</th>';
    listHTML += '<th style="text-align:right;">AMOUNT</th>';
    listHTML += '<th>PAY TYPE</th>';
    listHTML += '<th>CREDIT MEMO #</th>';
    listHTML += '<th>REFUND #</th>';
    listHTML += '<th>STATUS</th>';
    listHTML += '<th>PAPER</th>';
    listHTML += '<th>E-SIGN</th>';
//    listHTML += '<th>VIEW</th>';
    listHTML += '</tr>';
    listHTML += '</thead>';
    
    var results = searchLOTsToPayToday(dealID, payMethod);
    if(results != null && results != '') {
    	for(var x = 0; x < results.length; x++) {
    		var oneResult = results[x];
    		listHTML += buildListRow(oneResult, x);
    	}
    } else {
    	return '<h3>There are no records that match the criteria.  Exchange Records must have an \'Acquiom Status\' of \'1. Exchange Record Created\'  and a LOT Delivery Method of \'Web\' to show up in this search.</h3>';
    }
    listHTML += '</table>';
    listHTML += '</div>';
    
    // Populate State select options in template with the correct list from NetSuite
    listHTML += '</body>';
//  <!-- DataTables CSS -->
//    listHTML += '<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.0/css/jquery.dataTables.css">';
//	<!-- jQuery -->
    listHTML += '<script type="text/javascript" charset="utf8" src="https://code.jquery.com/jquery-1.10.2.min.js"></script>';
//	<!-- DataTables -->
//    listHTML += '<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.0/js/jquery.dataTables.js"></script>';
//	<!-- jQuery UI -->
    listHTML += '<script src="https://code.jquery.com/ui/1.11.0/jquery-ui.js"></script>';
//	<!-- jQuery Stylesheet -->
    listHTML += '<link rel="stylesheet" href="https://code.jquery.com/ui/1.11.0/themes/smoothness/jquery-ui.css">';
//  <!-- DataTables jQuery -->
//    listHTML += '<script src="https://cdn.datatables.net/1.10.0/js/jquery.dataTables.js"></script>';
    
    listHTML += '<link href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" rel="stylesheet">';
//    listHTML += '<script>' + ACQ_LOT_DA_Bootstrap_JavaScript.getValue() + '</script>';
//    listHTML += '</html>';
    return listHTML;
}

function buildListRow(row, x) {
	var rowID = row.getId();
	var rowHTML = '';
	var tRefund = row.getValue("custrecord_acq_loth_related_refund");
	var cMemo = row.getText("custrecord_acq_loth_related_trans");
//	cMemo = cMemo.replace(/\s+/, '');
	
	// START ROW
	rowHTML += '<tr id="exrec_'+ rowID +'" data-toggle="collapse" data-target="#demo1" class="accordion-toggle';
	if(cMemo != null && cMemo != '' && cMemo != ' ') {
		rowHTML += ' warning';
	} else if (tRefund != null && tRefund != '' && cMemo != null && cMemo != '') {
		rowHTML += ' success';
	} else {
		rowHTML += ' active';
	}
	rowHTML += '" style="font-size:10px;">';
	// ROW ID
	rowHTML += '<td>' + (x + 1) + '</td>';
	// EXCHANGE RECORD ID COLUMN
	var exRecURL = nlapiResolveURL("RECORD", "customrecord_acq_lot", rowID, "VIEW");
	rowHTML += '<td><a href="' + exRecURL + '" target="_blank">' + rowID + '</a>';
	rowHTML += '</td>';
	// DEAL COLUMN
	var dealText = row.getText('custrecord_acq_loth_zzz_zzz_deal');
	if(dealText != null && dealText.length > 30) {
		dealText = dealText.slice(0,30);
	}
	rowHTML += '<td>'+ dealText +'</td>';
	
	// SHAREHOLDER / CONTACT COLUMN
	var sholderText = row.getText('custrecord_acq_loth_zzz_zzz_shareholder');
	if(sholderText != null && sholderText.length > 30) {
		sholderText = sholderText.slice(0,25);
	}
	var contactText = row.getText('custrecord_acq_loth_zzz_zzz_contact');
	contactText = contactText.replace(/.*:\s/, '');
	rowHTML += '<td>';
//	rowHTML += '<tr>';
	rowHTML += ''+ sholderText +' /<br>';
	rowHTML += ''+ contactText;
//	rowHTML += '</tr>';
	rowHTML += '</td>';
	
	//AMOUNT
	rowHTML += '<td style="text-align:right;">$';
	var total = addTotalofCerts(rowID);
	total = total.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
	rowHTML += total;
	rowHTML += '</td>';
	//PAY TYPE
	rowHTML += '<td>' + row.getText("custrecord_acq_loth_4_de1_lotpaymethod") + '</td>';
	//CREDIT MEMO #
	rowHTML += '<td>';
	// cMemo loaded at top.
	if(cMemo == null || cMemo == '') {
		var cMemoResults = searchRelatedCreditMemos(rowID);
		if(cMemoResults != null && cMemoResults != '') {
			for(var sLoop = 0; sLoop < cMemoResults.length; sLoop++) {
				oneResult = cMemoResults[sLoop];
				rowHTML += '<a href="'+nlapiResolveURL('RECORD', 'creditmemo', oneResult.getId(), 'VIEW')+'">'+ oneResult.getValue('tranid') + '</a>';
			}
		}
	} else {
		rowHTML += '<a href="'+nlapiResolveURL('RECORD', 'creditmemo', row.getValue("custrecord_acq_loth_related_trans"), 'VIEW')+'">'+ cMemo + '</a>';
	}
	rowHTML += '</td>';
	//REFUND #
	// tRefund is loaded at top.
	rowHTML += '<td>';
	if(tRefund != null && tRefund != '') {
		rowHTML += tRefund;
	}
	rowHTML += '</td>';
	//STATUS
	rowHTML += '<td>' + row.getText("custrecord_acq_loth_zzz_zzz_acqstatus") + '</td>';
	//PAPER DOC 1
//	var lotPDFid = exRec.getValue('custrecord_acq_loth_zzz_zzz_rcvddocimage');
//	var pdfFile = nlapiLoadFile(lotPDFid);
	rowHTML += '<td>';
//	var pdfURL = pdfFile.getURL();
//	if(pdfURL != null && pdfURL != '') {
//		rowHTML += '<a href="'+ pdfURL +'" target="_blank"><span class="glyphicon glyphicon-file"></span></a>';
//	}
	rowHTML += '</td>';
	
//	var esignDoc = row.getValue('custrecord_acq_loth_zzz_zzz_esigndoc');
	
//	var pattern = /.pdf/g; 
//	var validURL = pattern.test(docURL);
//	if(validURL != null && validURL == true) { // alternate
//	if(esignDoc != null && esignDoc != '') {
//		rowHTML += '<a href="https://system.netsuite.com'+ esignDoc +' target="_blank"><span class="glyphicon glyphicon-file"></span></a>';
//	}
	
	//eSIGN DOC 
	var esignDoc2 = row.getValue('custrecord_acq_loth_zzz_esigndoclink');
	rowHTML += '<td>';
//	var pattern = /.pdf/g; 
//	var validURL = pattern.test(esignDoc);
//	if(validURL != null && validURL == true) { // alternate
	if(esignDoc2 != null && esignDoc2 != '') {
		rowHTML += '<a href="'+ esignDoc2 +'" target="_blank"><span class="glyphicon glyphicon-file"></span></a>';
	}
	rowHTML += '</td>';
	
	//VIEW DETAILS BUTTON TODO: (smccurry) Future feature.
//	rowHTML += '<td><button type="button" class="btn btn-primary btn-xs" data-toggle="collapse" data-target="#'+ rowID +'" style="font-size:10px;">Details</button></td>';
	
	// END ROW
	rowHTML += '</tr>';
	
	// TODO: (smccurry) BUILD THIS DETAILS AREA OUT.
	// DETAILS ROW (HIDDEN ON LOAD)
	rowHTML += '<tr>';
	rowHTML += '<td colspan="10">';
	rowHTML += '<div id="'+ rowID +'" class="collapse" style="border-bottom: 2px solid #ddd;">';
	rowHTML += 'Future feature could put more detail here.';
//	var ACQ_LOT_DA_Details_HTML = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DA_Details.html');
//	rowHTML += ACQ_LOT_DA_Details_HTML.getValue(); 
	rowHTML += '</div>';
	rowHTML += '</td>';
	rowHTML += '</tr>';
	
	return rowHTML;
}

function searchLOTsToPayToday(dealID, payMethod) {
	var filters = [];
	// Currently Deal is required on the client side so this should not be blank.
	if(dealID != null && dealID != '') {
		filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal',null,'is',dealID));
	}
	// Filter on the payment type if selected on the initial screen.  Not required.
	if(payMethod != null && payMethod != '') {
		filters.push(new nlobjSearchFilter('custrecord_acq_loth_4_de1_lotpaymethod',null,'is',payMethod));
	}
//	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_acqstatus', null, 'anyof', '1'));
//	filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_lotdelivery', null, 'anyof', '5'));
	var columns = [];
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_contact'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_acqstatus'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_lotdelivery'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_4_de1_lotpaymethod'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_related_trans'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_related_refund'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_esigndoc')); // This is a hyperlink field
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_esigndoclink')); // Returns a Free form text field
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_rcvddocimage'));
	return nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
}

function searchRelatedCerts(exRecID) {
// 	SEARCH LOT FOR ATTACHED CERTIFICATES.
// 	IS THIS SEARCH EVEN NEEDED, CAN'T WE JUST LOOP THRU THE EXCHANGE RECORD AND CHECK.
	var certSearchResults = new Array();
	var certSearchFilters = new Array();
	var certSearchColumns = new Array();
//	DO THE SEARCH FOR ASSOCIATED CERTIFICATE RECORDS HERE
	certSearchFilters[0] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot',null,'is',exRecID);
	certSearchFilters[1] = new nlobjSearchFilter('isinactive',null,'is','F');	
	// have commented this out and added to the columns so that I can separate out the error messages to show.
//	certSearchFilters[2] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_lotcestatus', null, 'is', 5);
	
	certSearchColumns[0] = new nlobjSearchColumn('internalid',null,null);
	certSearchColumns[1] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certnumber',null);
	certSearchColumns[2] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certtype',null);
	certSearchColumns[3] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certdesc',null);
	certSearchColumns[4] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null);
	certSearchColumns[5] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment',null);
	certSearchColumns[6] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_lotcestatus',null);
	
	return nlapiSearchRecord('customrecord_acq_lot_cert_entry',null,certSearchFilters,certSearchColumns);
}

function addTotalofCerts(exRecID) {
	var certTotals = 0;
	certTotals = parseFloat(certTotals);
	var results = searchRelatedCerts(exRecID);
	if(results != null && results != '') {
		for(var r = 0; r < results.length; r++) {
			var oneResult = results[r];
			var payAmt = oneResult.getValue('custrecord_acq_lotce_zzz_zzz_payment');
			if(payAmt != null && payAmt != '') {
				certTotals += parseFloat(payAmt);
			}
		}
	}
	var total = certTotals.toFixed(2);
	return total;
}

function searchRelatedCreditMemos(exRecID) {
	var filters = [];
	if(dealID != null && dealID != '') {
		filters.push(new nlobjSearchFilter('custbody_acq_lot_createdfrom_exchrec',null,'is',exRecID));
	}
	var columns = [];
	columns.push(new nlobjSearchColumn('custbody_acq_lot_createdfrom_exchrec'));
	columns.push(new nlobjSearchColumn('tranid'));
	columns.push(new nlobjSearchColumn('createdfrom'));
	return nlapiSearchRecord('creditmemo', null, filters, columns);
}

