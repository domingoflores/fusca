/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.03       23 Jun 2014     smccurry
 * 1.04		  03 Sept 2014	  smccurry         'txntype = returnauthorization is not working yet in this version but customrecord_acq_lot is working.
 * 1.05		  10 Sept 2014	  smccurry			Fixed 2014.2 issues and added a 'Delete' button.  returnauthorization is still not working for this version.
 * 1.05		  12 Sept 2014    smccurry			Moved the current version to Production.
 * 1.06       09 May  2018    Ken Crossman      ATP-103 As Operations, I want the delete credit memo/refund button on the Exchange Record, to be updated to first check 
 *												if the accounting period on the transactions you are trying to delete is closed and, if it's closed, then stop and do 
 *												not allow the user to delete. (Script currently in file ACQ_LOT_DA_ApprovalStatusPage_S.js in SuiteBundles>Bundle 53315)
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function createSingleApprovalPage(request, response) {

	if (request.getMethod() == 'GET') {
		var initialForm = buildPaymentsCustomUI(request, response);
		response.writePage(initialForm);

	} else if (request.getMethod() == 'POST') {

	}
}

function buildPaymentsCustomUI(request, response) {
	var form = nlapiCreateForm('&nbsp;&nbsp;&nbsp;&nbsp;Delete Same Day Payments', true),
		txnid = request.getParameter('txnid'), //Exchange Record ID
		txntype = request.getParameter('txntype'),
		tranID = request.getParameter('tran_id'),
		dtype = '',
		feeOverride = 1,
		grossAmount = 0;

	var custRefundPeriodClosed = null; //ATP-103
	var creditMemoPeriodClosed = null; //ATP-103
	var periodClosedMsg = 'Only Payments Created today may be deleted';

	nlapiLogExecution('DEBUG', 'buildPaymentsCustomUI', 'txnid(Exchange record ID): ' + txnid);
	if (txntype == 'returnauthorization') {
		dtype = 'Return Authorization';
	}
	if (txntype == 'customrecord_acq_lot') {
		dtype = 'Exchange Record';
	}

	// HIDDEN FIELDS - Store some data in hidden fields on the Assign New Hash preview page so that it can be retrieved and updated by ajax request response.
	var field_1 = form.addField('custpage_txnid', 'text', '').setDisplayType('hidden'); //Exchange Record ID
	var field_2 = form.addField('custpage_txntype', 'text', '').setDisplayType('hidden');
	var field_3 = form.addField('custpage_tranid', 'text', '').setDisplayType('hidden');
	var field_4 = form.addField('custpage_dtype', 'text', '').setDisplayType('hidden');
//	var field_piracle = form.addField('custpage_piracle', 'text', '').setDisplayType('hidden');
	var field_cmemo = form.addField('custpage_cmemo', 'text', '').setDisplayType('hidden');
	var field_crefund = form.addField('custpage_crefund', 'text', '').setDisplayType('hidden');
	field_1.setDefaultValue(txnid); //Exchange Record ID
	field_2.setDefaultValue(txntype);
	field_3.setDefaultValue(tranID);
	field_4.setDefaultValue(dtype);

	var htmlSection = form.addField('custpage_htmlsection', 'inlinehtml', '');
	htmlSection.setLayoutType('startrow');
	var html = '';
	try {
		var bootStrapcss = nlapiLoadFile('SuiteBundles/Bundle 53315/css/bootstrap.min.css'); //1836551); // this id will change on production;
		var ACQ_LOT_DA_Docs_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DA_Status_CSS.css'); //1836552);// this id will change on production;
		var ACQ_LOT_DA_Status_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DA_Status_CSS.css'); //1836350);// this id will change on production;
		var ACQ_LOT_StatusPage_html = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DA_StatusPage.html'); //1836451);
		var ACQ_LOT_ApprovalPage_CS_JS = nlapiLoadFile('SuiteBundles/Bundle 53315/ACQ_LOT_DA_ApprovalPage_CS.js');
		var html = ACQ_LOT_StatusPage_html.getValue();
	} catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	var cMemoID;
	var dateCreated;
	var cMemoTranID;
	var custRefID;
	var custRefTranID;
	var certId; //customrecord_acq_lot_cert_entry
	var exResults = searchExchangeRecordforPayment(txnid);
	if (exResults != null && exResults != '') {
		var oneResult = exResults[0];
		var dealName = oneResult.getText('custrecord_acq_loth_zzz_zzz_deal');
		var dealID = oneResult.getValue('custrecord_acq_loth_zzz_zzz_deal');
		var sholderName = oneResult.getText('custrecord_acq_loth_zzz_zzz_shareholder');
		var sholderID = oneResult.getValue('custrecord_acq_loth_zzz_zzz_shareholder');
		var payMethod = oneResult.getText('custrecord_acq_loth_4_de1_lotpaymethod');

		var newAccountNum = oneResult.getValue('custrecord_acq_loth_5a_de1_bankacctnum');
		var newRoutingNum = oneResult.getValue('custrecord_acq_loth_5a_de1_abaswiftnum');
		var newAccountType = oneResult.getValue('custrecord_acq_loth_5a_de1_bankaccttype');
		var payMethodID = oneResult.getValue('custrecord_acq_loth_4_de1_lotpaymethod');
		var payMethodName = oneResult.getText('custrecord_acq_loth_4_de1_lotpaymethod') || null;
		var cleanedPayMethodName = cleanPayMethodName(payMethodName) || null;
		cMemoID = oneResult.getValue('custrecord_acq_loth_related_trans'); // Related Credit Memo ID
		custRefID = oneResult.getValue('custrecord_acq_loth_related_refund'); // Related Customer Refund ID - there is no need to re-declare the custRefID variable
		dateCreated = oneResult.getValue('datecreated' ,'custrecord_acq_loth_related_trans'); // Related Credit Memo ID
		nlapiLogExecution('DEBUG', 'ATP-1981', 'dateCreated(typeof): ' + typeof dateCreated );
		nlapiLogExecution('DEBUG', 'ATP-1981', 'dateCreated(stringify): ' + JSON.stringify(dateCreated) );
		nlapiLogExecution('DEBUG', 'ATP-1981', 'dateCreated: ' + dateCreated );
	}


	var certificates = nlapiSearchRecord('customrecord_acq_lot_cert_entry', null, getCertificateFilters(txnid), getCertificateColumns());

	if (certificates && certificates.length > 0) {
		grossAmount = getCertificateGross(certificates);
	}

	// IF PAYMETHOD IS ACH THEN SEARCH FOR EXISTING PIRACLE PAY RECORDS TO SHOW
//	var piracle = searchPiracleACHrecords(sholderID, newAccountNum, newRoutingNum, newAccountType);
//
//	if (piracle != null && piracle != '') {
//		var piracleLink = '<a href="' + nlapiResolveURL('RECORD', 'customrecord_pp_ach_account', piracle.id, 'VIEW') + '">Piracle ' + piracle.id + '</a>';
//	}
	// SEARCH FOR EXISTING CREDIT MEMOS TO SHOW IN CASE PAYMENT HAS ALREADY BEEN MADE
	var cMemoLink = '';
	var exrec = exResults && exResults[0] ? exResults[0] : null; // this line is unnecessary given that oneResult has already got this value
	//var cResults = searchCreditMemoforPayment(txnid); //TODO:Remove this line of code

	var relatedCreditMemoId = exrec ? exrec.getValue('custrecord_acq_loth_related_trans') : '', // Related Credit Memo ID - this line is unnecessary given that cMemoID has already got this value
		relatedRefundId = exrec ? exrec.getValue('custrecord_acq_loth_related_refund') : ''; // Related Customer Refund ID - this line is unnecessary given that custRefID has already got this value
	var cResult = getCreditMemoById(relatedCreditMemoId && relatedCreditMemoId != ' ' ? relatedCreditMemoId : ''); // Function getCreditMemoById is in the ACQ_LOT_DA_Library.js - returns the Credit Memo record object
	// nlapiLogExecution('DEBUG', 'buildPaymentsCustomUI', 'related Credit Memo: ' + JSON.stringify(cResult));

	//if(cResults != null && cResults.length > 0 && cResults != '') {
	if (cResult && cResult != '' && cResult != ' ') {
		/*cMemoID = cResults[0].getId();
		cMemoTranID = cResults[0].getValue('tranid');*/

		cMemoID = cResult.getId();
		cMemoTranID = cResult.getFieldValue('tranid');

		var record = null;

		try {
			//record = nlapiLoadRecord('creditmemo', cMemoID, null);
			record = cResult;
		} catch (e) {
			record = null;
		}

		if (record) {

			var lineItemCount = record.getLineItemCount('item'),
				lineItemAmount = 0;

			for (var i = 0; i < lineItemCount; i++) {
				lineItemAmount = record.getLineItemValue('item', 'amount', i + 1);
				if (lineItemAmount <= 0) {
					feeOverride = lineItemAmount;
					break;
				}
			}
		}

		if (cMemoID != null && cMemoTranID != null && cMemoID != '' && cMemoTranID != '') {
			cMemoLink = '<a href="' + nlapiResolveURL('RECORD', 'creditmemo', cMemoID, 'VIEW') + '">Credit Memo ' + cMemoTranID + '</a>';
		} else {
			cMemoLink = '';
		}
		// ATP-103 Get Credit Memo period and check if it is closed
		var creditMemoPeriod = cResult.getFieldValue('postingperiod');
		nlapiLogExecution('DEBUG', 'buildPaymentsCustomUI', 'related Credit Memo Posting Period: ' + JSON.stringify(creditMemoPeriod));
		// Check if Accounting Period for Credit Memo is open or closed
		creditMemoPeriodClosed = isTxnPeriodClosed(creditMemoPeriod);
		nlapiLogExecution('DEBUG', 'buildPaymentsCustomUI', 'creditMemoPeriodClosed: ' + JSON.stringify(creditMemoPeriodClosed));

	}
	// SEARCH FOR EXISTING CUSTOMER REFUNDS MADE FROM THE CREDIT MEMO ABOVE IN CASE PAYMENT HAS ALREADY BEEN MADE
	var custRefundLink = '';
	/*if(cMemoID != null && cMemoID != '') {
		var refResults = searchCustomerRefundforPayment(cMemoID);
		if(refResults != null && refResults.length > 0 && refResults != '') {
			custRefID = refResults[0].getId();
			custRefTranID = refResults[0].getValue('tranid');
			if(custRefID != null && custRefTranID != null && custRefID != '' && custRefTranID != '') {
				custRefundLink = '<a href="'+nlapiResolveURL('RECORD', 'customerrefund', custRefID, 'VIEW')+'">Refund '+ custRefTranID +'</a>';
			} else {
				custRefundLink = '';
			}
		}
	}*/

//	if (relatedRefundId && relatedRefundId != ' ') {
//		var refResult = getCustomerRefundById(relatedRefundId);
//		if (refResult && refResult != ' ') {
//			custRefID = refResult.getId(); //ATP-103 variable already defined above
//			var custRefTranID = refResult.getFieldValue('tranid');
//
//			if (custRefID != null && custRefTranID != null && custRefID != '' && custRefTranID != '') {
//				custRefundLink = '<a href="' + nlapiResolveURL('RECORD', 'customerrefund', custRefID, 'VIEW') + '">Refund ' + custRefTranID + '</a>';
//			} else {
//				custRefundLink = '';
//			}
//			// ATP-103 Get Customer Refund period and check if it is closed
//			var custRefundPeriod = cResult.getFieldValue('postingperiod');
//			nlapiLogExecution('DEBUG', 'buildPaymentsCustomUI', 'related Customer Refund Posting Period: ' + JSON.stringify(custRefundPeriod));
//			// Check if Accounting Period for Customer Refund is open or closed
//			custRefundPeriodClosed = isTxnPeriodClosed(custRefundPeriod);
//			nlapiLogExecution('DEBUG', 'buildPaymentsCustomUI', 'custRefundPeriodClosed: ' + JSON.stringify(custRefundPeriodClosed));
//		}
//	}

	// VERIFY ABA ROUNTING NUMBER FOR ACH PAYMENTS  TODO: (smccurry 09/10/14) This needs separation from wire aba using the function determineABAorSWIFT(lotFields.wirebankabaRouting);
//	var achVerifiedHTML = '';
//	if (cMemoID != '' && cMemoID != null && newRoutingNum != null && newRoutingNum != '') {
//		var abaVerifiedResults = searchACHBankName(newRoutingNum);
//		var refResults = searchCustomerRefundforPayment(cMemoID);
//		if (abaVerifiedResults != null && abaVerifiedResults.length > 0) {
//			var achFedResult = abaVerifiedResults[0].getId();
//			if (achFedResult != null && achFedResult != '') {
//				achVerifiedHTML = '<span style="color:green;">VERIFIED!<span>';
//			}
//		} else {
//			achVerifiedHTML = '<span style="color:red;">NOT VERIFIED!<span>';
//		}
//	}
	var tranIDURL;
	if (dtype == 'Exchange Record') {
		tranIDURL = '<a href="' + nlapiResolveURL('RECORD', 'customrecord_acq_lot', tranID, 'VIEW') + '">' + tranID + '</a>';
	} else {
		tranIDURL = tranID;
	}
	html = html.replace(/{lot.id}/, tranIDURL);
	html = html.replace(/{lot.type}/, dtype);
	html = html.replace(/{lot.deal}/, dealName);
	html = html.replace(/{lot.sholder}/, sholderName);
	html = html.replace(/{lot.paymethod}/, payMethod);
	html = html.replace(/{lot.gross}/g, grossAmount);


//	if (achFedResult) {
//		html = html.replace(/{lot.abaverified}/, achVerifiedHTML);
//	} else {
//		html = html.replace(/{lot.abaverified}/, '');
//	}
	html = html.replace(/{lot.abaverified}/, '');

//	if (piracle != null && (payMethod == 'ACH' || payMethod == 'AES ACH')) {
//		html = html.replace(/{lot.piracle}/, piracleLink);
//		field_piracle.setDefaultValue(piracle.id);
//	} else {
//		html = html.replace(/{lot.piracle}/, '');
//	}

	//var feeAmt = lookupPaymentFee(dealID, payMethodID);
	var feeAmt = lookupPaymentFee(dealID, cleanedPayMethodName);
	if (feeAmt != null && feeAmt != '') {
		html = html.replace(/{lot.feeamt}/g, feeOverride <= 0 ? parseFloat(Math.abs(feeOverride)).toFixed(2) : feeAmt);
	} else {
		html = html.replace(/{lot.feeamt}/, 'Not Set');
	}
	if (cMemoID != null && cMemoID != '') {
		html = html.replace(/{lot.cmemo}/, cMemoLink);
		field_cmemo.setDefaultValue(cMemoID);
		//    	var refundBtn = '<button id="startapproval" class="btn btn-xs btn-success approveBtn" type="button"> Refund </button>';
		//    	html = html.replace(/{approvalBtn}/, refundBtn);
	} else {
		html = html.replace(/{lot.cmemo}/, '');
	}
	if (custRefID != null && custRefID != '') {
		html = html.replace(/{lot.refund}/, custRefundLink);
		field_crefund.setDefaultValue(custRefID);
		//    	var updateBtn = '<button id="startapproval" class="btn btn-xs btn-success approveBtn" type="button"> Update ExRec </button>';
		//    	html = html.replace(/{approvalBtn}/, updateBtn);
	} else {
		html = html.replace(/{lot.refund}/, '');
	}
//	var approveBtn = '<button id="startapproval" type="button" class="btn btn-xs btn-warning approveBtn"> Approve </button>';
//	var deleteBtn = '<button id="deleteRefund" type="button" class="btn btn-xs btn-warning approveBtn"> Delete </button>';
//
//	if (cMemoID != null && cMemoID != '' && custRefID != null && custRefID != '') {
//
//		// ATP-103 If either the Credit Memo or the Customer Refund is in a closed accounting period then replace Delete button with message 
//		if (creditMemoPeriodClosed || custRefundPeriodClosed) {
//			html = html.replace(/{approvalBtn}/, periodClosedMsg);
//		} else {
//			html = html.replace(/{approvalBtn}/, deleteBtn);
//		}
//
//	} else if (cMemoID == null || cMemoID == '' && custRefID == null || custRefID == '') {
//		html = html.replace(/{approvalBtn}/, approveBtn);
//	} else {
//		html = html.replace(/{approvalBtn}/, '');
//	}

	nlapiLogExecution('DEBUG', 'ATP-1981', 'custRefundPeriodClosed: ' + JSON.stringify(custRefundPeriodClosed));

	var deleteBtn = ''; // No CMemo . . . No Button
	if (cMemoID != null && cMemoID != '' && custRefID != null && custRefID != '') {
		var dtNow = new Date();
		var arrayToday = dtNow.toISOString().split("T");
		var todayMS = Date.parse(arrayToday[0]+"T00:00:00.000Z");
		var dateCreatedMS = Date.parse(dateCreated);
		if (dateCreatedMS < todayMS) { deleteBtn = periodClosedMsg; }
		else { deleteBtn = '<button id="deleteRefund" type="button" class="btn btn-xs btn-warning approveBtn"> Delete </button>'; }
	}
	html = html.replace(/{approvalBtn}/, deleteBtn);
	
	html += '<html lang="en">';
	html += '<head>';
	html += '<style>';
	html += bootStrapcss.getValue();
	html += ACQ_LOT_DA_Docs_CSS.getValue();
	html += ACQ_LOT_DA_Status_CSS.getValue();
	html += '.text { font-size:10pt }';
	html += '</style>';
	html += '<script>';
	html += ACQ_LOT_ApprovalPage_CS_JS.getValue();
	html += '</script>';
	html += '</html>';
	htmlSection.setDefaultValue(html);
	form.setScript('customscript_acq_lot_da_approv_ajax_cs');
	return form;
}

function searchExchangeRecordforPayment(exRecID) {
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('internalid', null, 'is', exRecID));
		//		if(dealID != null && dealID != '') {
		//			filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_deal',null, 'is', dealID));
		//		}
		var columns = [];
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_4_de1_lotpaymethod'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_5a_de1_bankacctnum'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_5a_de1_abaswiftnum'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_5a_de1_bankaccttype'));
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_related_trans')); // Related Credit Memo ID
		columns.push(new nlobjSearchColumn('custrecord_acq_loth_related_refund')); // Related Customer Refund ID
		columns.push(new nlobjSearchColumn('datecreated' ,'custrecord_acq_loth_related_trans')); // Related Credit Memo ID

		return nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
	} catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchExchangeRecords() FAILED', JSON.stringify(err));
	}
	return null;
}

function searchCreditMemoforPayment(exRecID) {
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('custbody_acq_lot_createdfrom_exchrec', null, 'is', exRecID));
		var columns = [];
		columns.push(new nlobjSearchColumn('tranid'));

		return nlapiSearchRecord('creditmemo', null, filters, columns);
	} catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchCreditMemoforPayment() FAILED', JSON.stringify(err));
	}
	return null;
}

function searchCustomerRefundforPayment(cMemoID) {
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('payingtransaction', null, 'is', cMemoID));
		var columns = [];
		columns.push(new nlobjSearchColumn('tranid'));
		columns.push(new nlobjSearchColumn('payingtransaction'));

		return nlapiSearchRecord('customerrefund', null, filters, columns);
	} catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchCustomerRefundforPayment() FAILED', JSON.stringify(err));
	}
	return null;
}

function searchFees(dealID) {
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('internalid', null, 'is', dealID));
		var columns = [];
		columns.push(new nlobjSearchColumn('custentity_acq_deal_lotach'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_domesticcheck'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_domesticwire'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_internationalchec'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_internationalwire'));
		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_wirefeeswaived'));
		//Added in AES fee columns for page load
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_ach'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_domestic_wire'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_intl_wire'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_domestic_chck'));
//		columns.push(new nlobjSearchColumn('custentity_qx_acq_deal_aes_intl_check'));

		return nlapiSearchRecord('customer', null, filters, columns);
	} catch (e) {
		var err = e;
		nlapiLogExecution('ERROR', 'searchExchangeRecords() FAILED', JSON.stringify(err));
	}
	return null;
}

//function lookupPaymentFee(dealID, payMethodID) {
function lookupPaymentFee(dealID, payMethodName) {

	var dealResults = searchFees(dealID);
	if (dealResults != null && dealResults != '') {
		var oneDeal = dealResults[0];

		var fee = 0.00;
		//		if(lineItemTotal >= oneDeal.getValue('custentity_qx_acq_deal_wirefeeswaived')) {
		//			return parseFloat(fee);
		//		}
		/*switch (payMethodID) {
			case "1":
				fee = oneDeal.getValue('custentity_acq_deal_lotach') || null;
				break;
			case "2":
				fee = oneDeal.getValue('custentity_qx_acq_deal_domesticcheck') || null;
				break;
			case "3":  
				fee = oneDeal.getValue('custentity_qx_acq_deal_internationalchec') || null;
				break;
			case "4":
				fee = oneDeal.getValue('custentity_qx_acq_deal_domesticwire') || null;
				break;
			case "5":
				fee = oneDeal.getValue('custentity_qx_acq_deal_internationalwire') || null;
				break;
			case "7":
				fee = oneDeal.getValue('') || null;
		}*/

		switch (payMethodName) {
			case "ach":
				fee = oneDeal.getValue('custentity_acq_deal_lotach') || null;
				break;
			case "domestic_check":
				fee = oneDeal.getValue('custentity_qx_acq_deal_domesticcheck') || null;
				break;
			case "international_check":
				fee = oneDeal.getValue('custentity_qx_acq_deal_internationalchec') || null;
				break;
			case "domestic_wire":
				fee = oneDeal.getValue('custentity_qx_acq_deal_domesticwire') || null;
				break;
			case "international_wire":
				fee = oneDeal.getValue('custentity_qx_acq_deal_internationalwire') || null;
				break;
//			case "aes_ach":
//				fee = oneDeal.getValue('custentity_qx_acq_deal_aes_ach') || null;
//				break;
//			case "aes_domestic_check":
//				fee = oneDeal.getValue('custentity_qx_acq_deal_aes_domestic_chck') || null;
//				break;
//			case "aes_international_check":
//				fee = oneDeal.getValue('custentity_qx_acq_deal_aes_intl_check') || null;
//				break;
//			case "aes_domestic_wire":
//				fee = oneDeal.getValue('custentity_qx_acq_deal_aes_domestic_wire') || null;
//				break;
//			case "aes_international_wire":
//				fee = oneDeal.getValue('custentity_qx_acq_deal_aes_intl_wire') || null;
//				break;
		}

		if (fee == '.00') {
			fee = '0.00';
		}

		return fee;
	}
}

function getCertificateFilters(exRecID) {
	var filters = [];

	filters.push(new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot', null, 'is', exRecID));

	return filters;
}

function getCertificateColumns() {
	var columns = [];

	columns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment'));

	return columns;
}

function getCertificateGross(certs) {
	var total = 0,
		currentGross = 0;

	for (var i = 0; i < certs.length; i++) {
		currentGross = parseFloat(certs[i].getValue('custrecord_acq_lotce_zzz_zzz_payment'));

		if (!isNaN(currentGross)) {
			total += currentGross;
		}
	}

	return total.toFixed(2);
}