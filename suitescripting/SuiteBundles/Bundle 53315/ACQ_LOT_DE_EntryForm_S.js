/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Jun 2014     smccurry
 * 1.01		  16 Jul 2014 	  smccurry		   Moved to PRODUCTION and some bugs fixed.
 * 1.02		  19 Aug 2014 	  smccurry		   Moved the current version from Production to Development.
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var deStatus = {
'de1' : 'Dual Entry 1',
'de2' : 'Dual Entry 2',
'admin' : 'Admin',
'review' : 'Review'
};
var de1FieldMap = {
'a1_signature_present' : 'custrecord_acq_loth_2_de1_taxsigpresent',
'a1_holdername' : 'custrecord_acq_loth_1_de1_shrhldname',
'a2_addr1' : 'custrecord_acq_loth_1_de1_shrhldaddr1',
'a3_addr2' : 'custrecord_acq_loth_1_de1_shrhldaddr2',
'a5_city' : 'custrecord_acq_loth_1_de1_shrhldcity',
'a6_state' : 'custrecord_acq_loth_1_de1_shrhldstate',
'a7_postalcode' : 'custrecord_acq_loth_1_de1_shrhldpostalcd',
'a8_country' : 'custrecord_acq_loth_1_de1_shrhldcountry',
'a9_email' : 'custrecord_acq_loth_1_de1_shrhldemail',
'a10_telephone' : 'custrecord_acq_loth_1_de1_shrhldphone',
'w2_ssn_ein' : 'custrecord_acq_loth_2_de1_ssnein',
'w4_taxclass' : 'custrecord_acq_loth_2_de1_taxclass',
'w3_signature' : 'custrecord_acq_loth_2_de1_taxsigpresent',
'w4_backupwitholding' : 'custrecord_acq_loth_2_de1_bckupwholding',
'lpm1_paymethod' : 'custrecord_acq_loth_4_de1_lotpaymethod',
'e1_bank_namesonbank' : 'custrecord_acq_loth_5a_de1_nameonbnkacct',
'e2_bank_accountnumber' : 'custrecord_acq_loth_5a_de1_bankacctnum',
'e3_bank_abanumber' : 'custrecord_acq_loth_5a_de1_abaswiftnum',
'e5_bank_accounttype' : 'custrecord_acq_loth_5a_de1_bankaccttype',
'e4_bank_name' : 'custrecord_acq_loth_5a_de1_bankname',
'a6_bank_address' : 'custrecord_acq_loth_5a_de1_bankaddr',
'a7_city' : 'custrecord_acq_loth_5a_de1_bankcity',
'a8_bank_state' : 'custrecord_acq_loth_5a_de1_bankstate',
'a9_bank_phone' : 'custrecord_acq_loth_5a_de1_bankphone',
'e1_wire_namesonBank' : 'custrecord_acq_loth_5b_de1_nameonbnkacct',
'a10_additional_instruction' : 'custrecord_acq_loth_5b_de1_addlinstrct',
'a5_title' : 'custrecord_acq_loth_1_de1_shrhldtitle',
'e2_wire_account_number' : 'custrecord_acq_loth_5b_de1_bankacctnum',
'e3_wire_aba_number' : 'custrecord_acq_loth_5b_de1_abaswiftnum',
'e9_wire_postalcode' : 'custrecord_acq_loth_5b_de1_bankzip',
'e9_wire_bank_country' : 'custrecord_acq_loth_5b_de1_bankcountry',
'e10_wire_bank_contact' : 'custrecord_acq_loth_5b_de1_bankcontact',
'e11_wire_bank_phone' : 'custrecord_acq_loth_5b_de1_bankphone',
'e12_wire_forfurtheraccount' : 'custrecord_acq_loth_5b_de1_frthrcrdtacct',
'e13_wire_forfurthername' : 'custrecord_acq_loth_5b_de1_frthrcrdtname',
'e3_wire_sort' : 'custrecord_acq_loth_5b_de1_sortcode',
'c1_check_payableto' : 'custrecord_acq_loth_5c_de1_checkspayto',
'c2_check_mailto' : 'custrecord_acq_loth_5c_de1_checksmailto',
'c3_check_addr1' : 'custrecord_acq_loth_5c_de1_checksaddr1',
'c4_check_addr2' : 'custrecord_acq_loth_5c_de1_checksaddr2',
'c5_check_addr3' : 'custrecord_acq_loth_5c_de1_checksaddr3',
'c6_check_city' : 'custrecord_acq_loth_5c_de1_checkscity',
'c7_check_state' : 'custrecord_acq_loth_5c_de1_checksstate',
'c8_check_postalcode' : 'custrecord_acq_loth_5c_de1_checkszip',
'c9_check_country' : 'custrecord_acq_loth_5c_de1_checkscountry',
'm1_medallion' : 'custrecord_acq_loth_6_de1_medallion',
'm2_medallion_present' : 'custrecord_acq_loth_6_de1_medshrhldsig',
'm3_medallion_number' : 'custrecord_acq_loth_6_de1_medallionnum'
};
var de2FieldMap = {
'a1_signature_present' : 'custrecord_acq_loth_2_de2_taxsigpresent',
'a1_holdername' : 'custrecord_acq_loth_1_de2_shrhldname',
'a2_addr1' : 'custrecord_acq_loth_1_de2_shrhldaddr1',
'a3_addr2' : 'custrecord_acq_loth_1_de2_shrhldaddr2',
'a5_city' : 'custrecord_acq_loth_1_de2_shrhldcity',
'a6_state' : 'custrecord_acq_loth_1_de2_shrhldstate',
'a7_postalcode' : 'custrecord_acq_loth_1_de2_shrhldpostalcd',
'a8_country' : 'custrecord_acq_loth_1_de2_shrhldcountry',
'a9_email' : 'custrecord_acq_loth_1_de2_shrhldemail',
'a10_telephone' : 'custrecord_acq_loth_1_de2_shrhldphone',
'w2_ssn_ein' : 'custrecord_acq_loth_2_de2_ssnein',
'w4_taxclass' : 'custrecord_acq_loth_2_de2_taxc',
'w3_signature' : 'custrecord_acq_loth_2_de2_taxsigpresent',
'w4_backupwitholding' : 'custrecord_acq_loth_2_de2_bckupwholding',
'lpm1_paymethod' : 'custrecord_acq_loth_4_de2_lotpaymethod',
'e1_bank_namesonbank' : 'custrecord_acq_loth_5a_de2_nameonbnkacct',
'e2_bank_accountnumber' : 'custrecord_acq_loth_5a_de2_bankacctnum',
'e3_bank_abanumber' : 'custrecord_acq_loth_5a_de2_abaswiftnum',
'e5_bank_accounttype' : 'custrecord_acq_loth_5a_de2_bankaccttype',
'e4_bank_name' : 'custrecord_acq_loth_5a_de2_bankname',
'a6_bank_address' : 'custrecord_acq_loth_5a_de2_bankaddr',
'a7_city' : 'custrecord_acq_loth_5a_de2_bankcity',
'a8_bank_state' : 'custrecord_acq_loth_5a_de2_bankstate',
'a9_bank_phone' : 'custrecord_acq_loth_5a_de2_bankphone',
'e1_wire_namesonBank' : 'custrecord_acq_loth_5b_de2_nameonbnkacct',
'a10_additional_instruction' : 'custrecord_acq_loth_5b_de2_addlinstrct',
'a5_title' : 'custrecord_acq_loth_1_de2_shrhldtitle',
'e2_wire_account_number' : 'custrecord_acq_loth_5b_de2_bankacctnum',
'e3_wire_aba_number' : 'custrecord_acq_loth_5b_de2_abaswiftnum',
'e9_wire_postalcode' : 'custrecord_acq_loth_5b_de2_bankzip',
'e9_wire_bank_country' : 'custrecord_acq_loth_5b_de2_bankcountry',
'e10_wire_bank_contact' : 'custrecord_acq_loth_5b_de2_bankcontact',
'e11_wire_bank_phone' : 'custrecord_acq_loth_5b_de2_bankphone',
'e12_wire_forfurtheraccount' : 'custrecord_acq_loth_5b_de2_frthrcrdtacct',
'e13_wire_forfurthername' : 'custrecord_acq_loth_5b_de2_frthrcrdtname',
'e3_wire_sort' : 'custrecord_acq_loth_5b_de2_sortcode',
'c1_check_payableto' : 'custrecord_acq_loth_5c_de2_checkspayto',
'c2_check_mailto' : 'custrecord_acq_loth_5c_de2_checksmailto',
'c3_check_addr1' : 'custrecord_acq_loth_5c_de2_checksaddr1',
'c4_check_addr2' : 'custrecord_acq_loth_5c_de2_checksaddr2',
'c5_check_addr3' : 'custrecord_acq_loth_5c_de2_checksaddr3',
'c6_check_city' : 'custrecord_acq_loth_5c_de2_checkscity',
'c7_check_state' : 'custrecord_acq_loth_5c_de2_checksstate',
'c8_check_postalcode' : 'custrecord_acq_loth_5c_de2_checkszip',
'c9_check_country' : 'custrecord_acq_loth_5c_de2_checkscountry',
'm1_medallion' : 'custrecord_acq_loth_6_de2_medallion',
'm2_medallion_present' : 'custrecord_acq_loth_6_de2_medshrhldsig',
'm3_medallion_number' : 'custrecord_acq_loth_6_de2_medallionnum'
};

function createDualEntryPage(request, response) {
	var data = {};
	if (request.getMethod() == 'GET') {
		var mainPage = buildDualEntryMainForm(request, response);
		// var mainPage = buildMaintenancePage(request, response);
		response.writePage(mainPage);

	}
	else if (request.getMethod() == 'POST') {
		var dataIn = JSON.parse(request.getBody());
		var message = '';
		if (dataIn.calltype == 'fetchfielddata') {
			if (dataIn.detype == 'de1') {
				var exRec = nlapiLoadRecord('customrecord_acq_lot', dataIn.txnid);
				// data = fetchDE1FieldsfromExRec(dataIn);
				data = fetchDE1FieldsfromStatusRec(dataIn, exRec);
				data.certfields = fetchDE0CertFields(dataIn.txnid);
				data.calltype == 'fetchfielddata';
				data.callbacktype == 'returningDE1Fields';
				// data.viewmode == dataIn.viewmode;
				response.write(JSON.stringify(data));
			}
			else if (dataIn.detype == 'de2') {
				var exRec = nlapiLoadRecord('customrecord_acq_lot', dataIn.txnid);
				// data = fetchDE2FieldsfromExRec(dataIn);
				data = fetchDE2FieldsfromStatusRec(dataIn, exRec);
				data.certfields = fetchDE0CertFields(dataIn.txnid);
				data.calltype == 'fetchfielddata';
				data.callbacktype == 'returningDE2Fields';
				// data.viewmode == dataIn.viewmode;
				response.write(JSON.stringify(data));
			}
		}
		else if (dataIn.calltype == 'fetchReviewFieldData') {
			var exRec = nlapiLoadRecord('customrecord_acq_lot', dataIn.txnid);
			// data.status =
			data.src = fetchSRCFieldsfromExRec(dataIn, exRec);
			// data.de1 = fetchDE1FieldsfromExRec(dataIn,exRec);
			data.de1 = fetchDE1FieldsfromStatusRec(dataIn);
			// data.de1.certfields = fetchDE0CertFields(dataIn.txnid, data.certfields);
			// data.de2 = fetchDE2FieldsfromExRec(dataIn,exRec);
			data.de2 = fetchDE2FieldsfromStatusRec(dataIn);
			// data.de2.certfields = fetchDE0CertFields(dataIn.txnid, data.certfields);
			data.callbacktype = 'returningReviewFields';
			response.write(JSON.stringify(data));
		}

		if (dataIn.btntype == 'custSubmit' || dataIn.btntype == 'reviewSubmit') {
			if (dataIn.detype == 'de1') {
				// message = submitDE1Data(dataIn);
				message = submitDE1jsonToStatus(dataIn);
			}
			else if (dataIn.detype == 'de2') {
				// message = submitDE2Data(dataIn);
				message = submitDE2jsonToStatus(dataIn);
			}
			else if (dataIn.detype == 'review' && dataIn.calltype == 'postReviewFields') {
				// This is where the reviewer submits the final data to DE1.
				message = submitDE1Data(dataIn);
			}
			var msgs = message.returnMessages;
			var textMsgs = '';
			for (var eLoop = 0; eLoop < msgs.length; eLoop++) {
				textMsgs += msgs[eLoop].message;
			}
			response.write(textMsgs);
		}
	}
}

function buildDualEntryMainForm(request, response) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();

	if (request.getMethod() == 'GET') {
		var userID = nlapiGetContext().getUser();
		var curUser = '_' + userID;
		// Retrieve the the users allowed to access dual entry and create an object
		var dualEntryUsers = createDualEntryUsersObject();

		var exRecID = request.getParameter('txnid');
		var btnType = request.getParameter('btnType');
		var adminViewEdit = request.getParameter('usr');
		var userRole = request.getParameter('usr');
		// Check the user role, if an 'Dual Entry Admin', then retrieve the button type
		// so that we know what button the admin pressed 'DE1' or 'DE2'
		// var userRole = dualEntryUsers[curUser].role;

		/***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************
		 * LOAD EXCHANGE RECORD & STATUS RECORD
		 **********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
		var exRec = nlapiLoadRecord('customrecord_acq_lot', exRecID);// exRecID
		var statusRecSrch = searchDualEntryStatusRecord(exRecID);
		// if(statusResults != null && statusResults.length > 0) {
		// var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', statusResults[0].getId());
		// } else {
		// return;
		// }
		var statusRec = null;
		var statusRecID = null;
		// var entrycomplete = null;
		// var alterations = null;
		var de_notes = null;
		if (statusRecSrch != null && statusRecSrch.length > 0) {
			try {
				statusRecID = statusRecSrch[0].getId();
				statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', statusRecID);
			}
			catch (e) {
				var err = e;
				nlapiLogExecution('DEBUG', 'Line 337. Failed on exRecID: ' + exRecID, JSON.stringify(err));
			}

		}
		else {
			try {
				var statusRecID = createDefaultStatusRecord(exRecID);
				statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', statusRecID);
			}
			catch (e) {
				var err = e;
				msg.addMessage('Problem with the creating status record: createDefaultStatusRecord(exRecID) Script: ACQ_LOT_DE_DualEntry_R.js' + JSON.stringify(err));
				msg.setStatusError();
				nlapiLogExecution('DEBUG', 'Line 348. Failed on exRecID: ' + exRecID, JSON.stringify(err));
			}
		}
		/** ** LOAD THE FIELDS NEEDED FROM THE STATUS RECORD *** */
		var de1Status = statusRec.getFieldValue('custrecord_acq_lot_de_de1_status');
		var de2Status = statusRec.getFieldValue('custrecord_acq_lot_de_de2_status');
		var de1JSON = statusRec.getFieldValue('custrecord_acq_lot_de_de1_json');
		var de2JSON = statusRec.getFieldValue('custrecord_acq_lot_de_de2_json');
		/** PARSE JSON INTO OBJECT * */
		var de1Fields = JSON.parse(de1JSON);
		var de2Fields = JSON.parse(de2JSON);

		// Determine which user to set as the current user on the Exchange Record
		// If the user has clicked 'view' button then do not assign the user to the record
		// If the user has clicked 'edit' button then assign their name to the correct field

		/***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************
		 * IF IN EDIT MODE THEN ASSIGN THE CURRENT DE1 OR DE2 USER
		 **********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
		try {
			if (btnType == 'edit') {
				if (userRole == 'de1') {
					statusRec.setFieldValue('custrecord_acq_lot_de_de1_user', userID);
					if (de1Status == 1) {
						statusRec.setFieldValue('custrecord_acq_lot_de_de1_status', 2);
					}
				}
				else if (userRole == 'de2') {
					statusRec.setFieldValue('custrecord_acq_lot_de_de2_user', userID);
					if (de2Status == 1) {
						statusRec.setFieldValue('custrecord_acq_lot_de_de2_status', 2);
					}
				}
				else if (userRole == 'admin' && btnType == 'de1') {
					statusRec.setFieldValue('custrecord_acq_lot_de_de1_user', userID);
					if (de1Status == 1) {
						statusRec.setFieldValue('custrecord_acq_lot_de_de1_status', 2);
					}
				}
				else if (userRole == 'admin' && btnType == 'de2') {
					statusRec.setFieldValue('custrecord_acq_lot_de_de2_user', userID);
					if (de2Status == 1) {
						statusRec.setFieldValue('custrecord_acq_lot_de_de2_status', 2);
					}
				}
			}
			else if (btnType == 'review') {
				statusRec.setFieldValue('custrecord_acq_lot_de_current_reviewer', userID);
			}
			statusRecID = nlapiSubmitRecord(statusRec);
		}
		catch (e) {
			var err = e;
			msg.addMessage('Problem setting the user on the Status Record: ' + JSON.stringify(err));
			msg.setStatusError();
			nlapiLogExecution('ERROR', 'nlapiSubmitRecord() failed', JSON.stringify(err));
		}

		/***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************
		 * CREATE DUAL ENTRY FORM PAGE
		 **********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/

		var form = nlapiCreateForm('Dual Entry - ' + 'Exchange Record #' + exRecID, true); // Setup the generation form
		var group = form.addFieldGroup('header', 'Deal / Shareholder');

		var docID = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_rcvddocimage');

		var headerField = form.addField('custpage_header', 'inlinehtml', null, null, 'header').setLayoutType('startrow');
		if (userRole == 'de1' || userRole == 'de2') {
			var headerhtml = buildHeader(exRec, userRole, btnType);
			form.addTab('custpagetab1', 'Exchange Record');
		}
		if (userRole == 'de1' || userRole == 'de2') {
			form.addTab('custpagetab2', 'Certificates');
		}
		if (userRole == 'admin' && btnType == 'review') {
			var headerhtml = buildReviewHeader(exRec, userRole, btnType);
			form.addTab('custpagetab3', 'Review DE1 & DE2');
		}
		if (userRole == 'admin' && btnType == 'review') {
			form.addTab('custpagetab4', 'Review Certificates');
		}
		headerField.setDefaultValue(headerhtml);

		if (btnType != 'review') {
			var entryFields = form.addField('custpage_entryfields', 'inlinehtml', '', null, 'custpagetab1');
			var fieldshtml = buildEntryFields(exRec);
			entryFields.setDefaultValue(fieldshtml);
			form.addField('custpage_currentde', 'text', 'Current DE Field', null, 'custpagetab1').setDisplayType('hidden');
			form.addField('custpage_formfields', 'longtext', 'Form Fields', null, 'custpagetab1').setDisplayType('hidden');
			form.addField('custpage_exchangeid', 'integer', 'Exchange Record Id', null, 'custpagetab1').setDisplayType('hidden');
		}
		if (btnType != 'review') {
			var certFields = form.addField('custpage_certfields', 'inlinehtml', '', null, 'custpagetab2');
			var certFieldshtml = buildCertFields(exRec);
			certFields.setDefaultValue(certFieldshtml);
		}
		if (btnType == 'review' && userRole == 'admin') {
			var reviewErFields = form.addField('custpage_reviewfields', 'inlinehtml', '', null, 'custpagetab3');
			// var reviewErFieldshtml = buildReviewErFields(exRec);
			var reviewErFieldshtml = buildReviewErFieldsJSON(de1Fields, de2Fields, exRec);
			reviewErFields.setDefaultValue(reviewErFieldshtml);
		}
		if (btnType == 'review' && userRole == 'admin') {
			var reviewCertFields = form.addField('custpage_reviewcertfields', 'inlinehtml', '', null, 'custpagetab4');
			// var certFieldshtml = buildReviewCertFields(exRec);
			var reviewCertFieldshtml = buildReviewCertFields(exRec, de1Fields, de2Fields);
			reviewCertFields.setDefaultValue(reviewCertFieldshtml);
		}
		var scriptField = form.addField('custpage_script', 'inlinehtml', '');
		var exchangeTabCSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_CSS.css');
		var htmlscript = '<script src="//code.jquery.com/jquery-1.11.1.min.js"></script>';
		htmlscript += '<style>' + exchangeTabCSS.getValue() + '</style>';
		htmlscript += '<link rel="stylesheet" href="//code.jquery.com/ui/1.11.0/themes/smoothness/jquery-ui.css">';
		scriptField.setDefaultValue(htmlscript);

		var extScript = form.addField('custpage_extscript', 'inlinehtml', '');
		var extLink = '<script src="//ajax.googleapis.com/ajax/libs/ext-core/3.1.0/ext-core.js"></script>';
		extLink += ' <script src="//code.jquery.com/ui/1.11.0/jquery-ui.js"></script>';
		extScript.setDefaultValue(extLink);
		/***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************
		 * SET THE CLIENT SIDE SCRIPT TO LOAD ON THE FORM - MANY OF THE AJAX CALLS AND DOM UPDATES ARE IN THIS SCRIPT
		 **********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
		form.setScript('customscript_acq_lot_de_entryform_cs'); // ACQ_LOT_DE_EntryForm_CS.js

		var exRecIDField = form.addField('custpage_txnid', 'text', '').setDisplayType('hidden');
		exRecIDField.setDefaultValue(exRecID);

		var viewEditField = form.addField('custpage_viewmode', 'text', '').setDisplayType('hidden');
		viewEditField.setDefaultValue(btnType);

		var curUserField = form.addField('custpage_user', 'text', '').setDisplayType('hidden');
		curUserField.setDefaultValue(userRole);

		var btnTypeField = form.addField('custpage_btntype', 'text', '').setDisplayType('hidden');
		btnTypeField.setDefaultValue(btnType);

		var entryTypeField = form.addField('custpage_detype', 'text', '').setDisplayType('hidden');
		if (userRole != 'admin') {
			entryTypeField.setDefaultValue(userRole);
		}
		var statusRecIDfld = form.addField('custpage_statusrecid', 'text', '').setDisplayType('hidden');
		statusRecIDfld.setDefaultValue(statusRecID);
		return form;
	}
}

function fetchSRCFieldsfromExRec(dataIn, exRec) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var data = {};
	var erFields = {};
	var certFields = {};

	try {
		var exRecID = dataIn.txnid;
		// var exRec = nlapiLoadRecord('customrecord_acq_lot', exRecID, {recordmode: 'dynamic'});

		// erFields.a1_signature_present = exRec.getFieldValue('custrecord_acq_loth_2_src_taxsigpresent') || null;
		erFields.a1_holdername = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldname') || null;
		erFields.a2_addr1 = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldaddr1') || null;
		erFields.a3_addr2 = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldaddr2') || null;
		erFields.a5_city = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldcity') || null;
		erFields.a6_state = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldstate') || null;
		erFields.a7_postalcode = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldpostalcd') || null;
		erFields.a8_country = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldcountry') || null;
		erFields.a9_email = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldemail') || null;
		erFields.a10_telephone = exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldphone') || null;

		erFields.w2_ssn_ein = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_2_src_ssnein') || null;
		// erFields.w4_taxclass = exRec.getFieldValue('custrecord_acq_loth_2_src_taxc') || null;
		// erFields.w3_signature = exRec.getFieldValue('custrecord_acq_loth_2_src_taxsigpresent') || null;
		// erFields.w4_backupwitholding = exRec.getFieldValue('custrecord_acq_loth_2_src_bckupwholding') || null;
		// erFields.lpm1_paymethod = exRec.getFieldValue('custrecord_acq_loth_4_src_lotpaymethod') || null;

		erFields.e1_bank_namesonbank = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_nameonbnkacct') || null;
		erFields.e2_bank_accountnumber = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_bankacctnum') || null;
		erFields.e3_bank_abanumber = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_abaswiftnum') || null;
		// erFields.e5_bank_accounttype = exRec.getFieldValue('custrecord_acq_loth_5a_src_bankaccttype') || null;
		erFields.e4_bank_name = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_bankname') || null; //
		erFields.a6_bank_address = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_bankaddr') || null;
		erFields.a7_city = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_bankcity') || null;
		erFields.a8_bank_state = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_bankstate') || null;
		erFields.a9_bank_phone = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5a_src_bankphone') || null;

		erFields.e1_wire_namesonBank = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_nameonbnkacct') || null;
		erFields.a10_additional_instruction = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_addlinstrct') || null;
		erFields.a5_title = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_1_src_shrhldtitle') || null;
		erFields.e2_wire_account_number = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_bankacctnum') || null;
		erFields.e3_wire_aba_number = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_abaswiftnum') || null;
		erFields.e9_wire_postalcode = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_bankzip') || null;
		// erFields.e9_wire_bank_country = exRec.getFieldValue('custrecord_acq_loth_5b_src_bankcountry') || null;
		erFields.e10_wire_bank_contact = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_bankcontact') || null;
		erFields.e11_wire_bank_phone = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_bankphone') || null;
		erFields.e12_wire_forfurtheraccount = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_frthrcrdtacct') || null;
		erFields.e13_wire_forfurthername = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_frthrcrdtname') || null;
		erFields.e3_wire_sort = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5b_src_sortcode') || null;

		erFields.c1_check_payableto = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5c_src_checkspayto') || null;
		erFields.c2_check_mailto = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5c_src_checksmailto') || null;
		erFields.c3_check_addr1 = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5c_src_checksaddr1') || null;
		erFields.c4_check_addr2 = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5c_src_checksaddr2') || null;
		erFields.c5_check_addr3 = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5c_src_checksaddr3') || null;
		erFields.c6_check_city = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5c_src_checkscity') || null;
		// erFields.c7_check_state = exRec.getFieldValue('custrecord_acq_loth_5c_src_checksstate') || null;
		erFields.c8_check_postalcode = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_5c_src_checkszip') || null;
		// erFields.c9_check_country = exRec.getFieldValue('custrecord_acq_loth_5c_src_checkscountry') || null;
		//		
		// erFields.m1_medallion = exRec.getFieldValue('custrecord_acq_loth_6_src_medallion') || null;
		// erFields.m2_medallion_present = exRec.getFieldValue('custrecord_acq_loth_6_src_medshrhldsig') || null;
		erFields.m3_medallion_number = 'Not connected to ER';// exRec.getFieldValue('custrecord_acq_loth_6_src_medallionnum') || null;

		var certResults = searchRelatedCerts(exRecID);
		if (certResults != null && certResults.length > 0) {
			for (var cLoop = 0; cLoop < certResults.length; cLoop++) {
				var oneResult = certResults[cLoop];
				var id = oneResult.getId();

				var tempObj = {};
				tempObj.ST = oneResult.getValue('custrecord_acq_lotce_3_src_certtype') || null;
				tempObj.SN = oneResult.getValue('custrecord_acq_lotce_3_src_certnumber') || null;
				tempObj.SH = oneResult.getValue('custrecord_acq_lotce_3_src_numbershares') || null;
				tempObj.ST = oneResult.getValue('custrecord_acq_lotce_3_src_certtype') || null;
				// tempObj.MISSING = oneResult.getValue('custrecord_acq_lotce_3_src_lostcert') || null;
				tempObj.ID = id;
				if (tempObj.SN != null && tempObj.SN != '') {
					certFields['CERT_' + id] = tempObj;
				}
				else {
					// certFields['CERT_TMP' + id] = tempObj;
					nlapiLogExecution('DEBUG', 'CERT MISSING A CERT NUMBER', 'CERT ID: ' + oneResult.getId());
				}
				// else {
				// var cDate = new Date();
				// certField['CERT_TEMP' + cDate.getTime()] = tempObj;
				// }

				// certFields['ST_' + id] = oneResult.getValue('custrecord_acq_lotce_3_de1_certtype') || null;
				// certFields['SN_' + id] = oneResult.getValue('custrecord_acq_lotce_3_de1_certnumber') || null;
				// certFields['SH_' + id] = oneResult.getValue('custrecord_acq_lotce_3_de1_numbershares') || null;
				// certFields['cert_miss_' + id] = oneResult.getValue('custrecord_acq_lotce_3_de1_lostcert') || null;
				// certFields['id_' + id] = id || null;
			}
		}
		data.erFields = erFields;
		data.certfields = certFields;
		data.callbacktype = 'returningDE0Fields';
		return data;

	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem fetching the data from the Exchange Record. fetchDE1FieldsfromExRec(). Code DE_275');
		nlapiLogExecution('DEBUG', 'Problem fetching the data.', 'Problem fetching the data from the Exchange Record. fetchDE2FieldsfromExRec(). Code DE_375', '');
		data.msg = msg;
		return data;
	}
}

function fetchDE1FieldsfromExRec(dataIn, exRec) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var data = {};
	var erFields = {};
	try {
		var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', dataIn.statusrec);
		data.entrycomplete = statusRec.getFieldValue('custrecord_acq_lot_de_de1_status');
		data.alterations = statusRec.getFieldValue('custrecord_acq_lot_de_de1_alterations');
		data.de_notes = statusRec.getFieldValue('custrecord_acq_lot_de_de1_notes');
	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem fetching the data from the Exchange Status Record. fetchDE1FieldsfromExRec(). Code DE_291');
		nlapiLogExecution('DEBUG', 'Problem fetching the data.', 'Problem fetching the data from the Exchange Status Record. fetchD1FieldsfromExRec(). Code DE_291', '');
		data.msg = msg;
	}

	try {
		var exRecID = dataIn.txnid;
		// var exRec = nlapiLoadRecord('customrecord_acq_lot', exRecID, {recordmode: 'dynamic'});

		erFields.a1_signature_present = exRec.getFieldValue('custrecord_acq_loth_2_de1_taxsigpresent') || null;
		erFields.a1_holdername = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldname') || null;
		erFields.a2_addr1 = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1') || null;
		erFields.a3_addr2 = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2') || null;
		erFields.a5_city = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity') || null;
		erFields.a6_state = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldstate') || null;
		erFields.a7_postalcode = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd') || null;
		erFields.a8_country = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry') || null;
		erFields.a9_email = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldemail') || null;
		erFields.a10_telephone = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone') || null;

		erFields.w2_ssn_ein = exRec.getFieldValue('custrecord_acq_loth_2_de1_ssnein') || null;
		erFields.w1_irsname = exRec.getFieldValue('custrecord_acq_loth_2_de1_irsname') || null;
		erFields.w4_taxclass = exRec.getFieldValue('custrecord_acq_loth_2_de1_taxc') || null;
		erFields.w3_signature = exRec.getFieldValue('custrecord_acq_loth_2_de1_taxsigpresent') || null;
		erFields.w4_backupwitholding = exRec.getFieldValue('custrecord_acq_loth_2_de1_bckupwholding') || null;
		erFields.lpm1_paymethod = exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod') || null;

		erFields.e1_bank_namesonbank = exRec.getFieldValue('custrecord_acq_loth_5a_de1_nameonbnkacct') || null;
		erFields.e2_bank_accountnumber = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankacctnum') || null;
		erFields.e3_bank_abanumber = exRec.getFieldValue('custrecord_acq_loth_5a_de1_abaswiftnum') || null;
		erFields.e5_bank_accounttype = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankaccttype') || null;
		erFields.e4_bank_name = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankname') || null; //  
		erFields.a6_bank_address = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankaddr') || null;
		erFields.a7_city = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankcity') || null;
		erFields.a8_bank_state = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankstate') || null;
		erFields.a9_bank_phone = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankphone') || null;

		erFields.e1_wire_namesonBank = exRec.getFieldValue('custrecord_acq_loth_5b_de1_nameonbnkacct') || null;
		erFields.a10_additional_instruction = exRec.getFieldValue('custrecord_acq_loth_5b_de1_addlinstrct') || null;
		erFields.a5_title = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldtitle') || null;
		erFields.e2_wire_account_number = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankacctnum') || null;
		erFields.e3_wire_aba_number = exRec.getFieldValue('custrecord_acq_loth_5b_de1_abaswiftnum') || null;
		erFields.e9_wire_postalcode = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankzip') || null;
		erFields.e9_wire_bank_country = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcountry') || null;
		erFields.e10_wire_bank_contact = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcontact') || null;
		erFields.e11_wire_bank_phone = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankphone') || null;
		erFields.e12_wire_forfurtheraccount = exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtacct') || null;
		erFields.e13_wire_forfurthername = exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtname') || null;
		erFields.e3_wire_sort = exRec.getFieldValue('custrecord_acq_loth_5b_de1_sortcode') || null;

		erFields.c1_check_payableto = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkspayto') || null;
		erFields.c2_check_mailto = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksmailto') || null;
		erFields.c3_check_addr1 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr1') || null;
		erFields.c4_check_addr2 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr2') || null;
		erFields.c5_check_addr3 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr3') || null;
		erFields.c6_check_city = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscity') || null;
		erFields.c7_check_state = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksstate') || null;
		erFields.c8_check_postalcode = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkszip') || null;
		erFields.c9_check_country = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscountry') || null;

		erFields.m1_medallion = exRec.getFieldValue('custrecord_acq_loth_6_de1_medallion') || null;
		erFields.m2_medallion_present = exRec.getFieldValue('custrecord_acq_loth_6_de1_medshrhldsig') || null;
		erFields.m3_medallion_number = exRec.getFieldValue('custrecord_acq_loth_6_de1_medallionnum') || null;

		data.erFields = erFields;
		data.certfields = fetchDE1FieldsfromExRec(exRecID);
		data.callbacktype = 'returningDE1Fields';
		return data;

	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem fetching the data from the Exchange Record. fetchDE1FieldsfromExRec(). Code DE_275');
		nlapiLogExecution('DEBUG', 'Problem fetching the data.', 'Problem fetching the data from the Exchange Record. fetchDE2FieldsfromExRec(). Code DE_375', '');
		data.msg = msg;
		return data;
	}
}

function fetchDE1FieldsfromStatusRec(dataIn) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var statusRecObj = {};
	try {
		var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', dataIn.statusrec);
		var statusRecJSON = statusRec.getFieldValue('custrecord_acq_lot_de_de1_json');
		// PARSE JSON DATA FROM DE1 JSON FIELD ON STATUS RECORD
		if (statusRecJSON != null && statusRecJSON != '') {
			statusRecObj = JSON.parse(statusRecJSON);
		}
		else {
			msg.setStatusError();
			msg.addMessage('There is not any JSON data to parse. fetchDE1FieldsfromStatusRec(). Code DE_524');
			statusRecObj.msg = msg;
		}
		// UPDATE OBJECT WITH OTHER FIELDS FROM STATUS RECORD
		statusRecObj.entrycomplete = statusRec.getFieldValue('custrecord_acq_lot_de_de1_status');
		statusRecObj.alterations = statusRec.getFieldValue('custrecord_acq_lot_de_de1_alterations');
		statusRecObj.de_notes = statusRec.getFieldValue('custrecord_acq_lot_de_de1_notes');
		// Move this out of this function
		statusRecObj.callbacktype = 'returningDE1Fields';

		// var newCertOBJ = fetchDE0CertFields(dataIn.txnid, statusRecObj.certfields);
		// if(newCertOBJ != null && newCertOBJ != '') {
		// statusRecObj.certfields = newCertOBJ;
		// }

	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem fetching the JSON data from the Exchange Status Record. fetchDE1FieldsfromStatusRec(). Code DE_535');
		nlapiLogExecution('DEBUG', 'Problem fetching the JSON data.', 'Problem fetching the JSON data from the Exchange Status Record. fetchDE1FieldsfromStatusRec(). Code DE_535', '');
		nlapiLogExecution('DEBUG', 'Danger', e.toString());
		statusRecObj.msg = msg;
	}
	return statusRecObj;
}

function fetchDE2FieldsfromExRec(dataIn, exRec) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	try {
		var exRecID = dataIn.txnid;
		// var exRec = nlapiLoadRecord('customrecord_acq_lot', exRecID, {recordmode: 'dynamic'});

		var data = {};
		var erFields = {};
		var certFields = {};

		var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', dataIn.statusrec);
		data.entrycomplete = statusRec.getFieldValue('custrecord_acq_lot_de_de2_status');
		data.alterations = statusRec.getFieldValue('custrecord_acq_lot_de_de2_alterations');
		data.de_notes = statusRec.getFieldValue('custrecord_acq_lot_de_de2_notes');

		erFields.a1_signature_present = exRec.getFieldValue('custrecord_acq_loth_2_de2_taxsigpresent') || null;
		erFields.a1_holdername = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldname') || null;
		erFields.a2_addr1 = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldaddr1') || null;
		erFields.a3_addr2 = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldaddr2') || null;
		erFields.a5_city = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldcity') || null;
		erFields.a6_state = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldstate') || null;
		erFields.a7_postalcode = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldpostalcd') || null;
		erFields.a8_country = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldcountry') || null;
		erFields.a9_email = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldemail') || null;
		erFields.a10_telephone = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldphone') || null;

		erFields.w2_ssn_ein = exRec.getFieldValue('custrecord_acq_loth_2_de2_ssnein') || null;
		erFields.w4_taxclass = exRec.getFieldValue('custrecord_acq_loth_2_de2_taxclass') || null;
		erFields.w3_signature = exRec.getFieldValue('custrecord_acq_loth_2_de2_taxsigpresent') || null;
		erFields.w4_backupwitholding = exRec.getFieldValue('custrecord_acq_loth_2_de2_bckupwholding') || null;
		erFields.lpm1_paymethod = exRec.getFieldValue('custrecord_acq_loth_4_de2_lotpaymethod') || null;

		erFields.e1_bank_namesonbank = exRec.getFieldValue('custrecord_acq_loth_5a_de2_nameonbnkacct') || null;
		erFields.e2_bank_accountnumber = exRec.getFieldValue('custrecord_acq_loth_5a_de2_bankacctnum') || null;
		erFields.e3_bank_abanumber = exRec.getFieldValue('custrecord_acq_loth_5a_de2_abaswiftnum') || null;
		erFields.e5_bank_accounttype = exRec.getFieldValue('custrecord_acq_loth_5a_de2_bankaccttype') || null;
		erFields.e4_bank_name = exRec.getFieldValue('custrecord_acq_loth_5a_de2_bankname') || null; //  
		erFields.a6_bank_address = exRec.getFieldValue('custrecord_acq_loth_5a_de2_bankaddr') || null;
		erFields.a7_city = exRec.getFieldValue('custrecord_acq_loth_5a_de2_bankcity') || null;
		erFields.a8_bank_state = exRec.getFieldValue('custrecord_acq_loth_5a_de2_bankstate') || null;
		erFields.a9_bank_phone = exRec.getFieldValue('custrecord_acq_loth_5a_de2_bankphone') || null;

		erFields.e1_wire_namesonBank = exRec.getFieldValue('custrecord_acq_loth_5b_de2_nameonbnkacct') || null;
		erFields.a10_additional_instruction = exRec.getFieldValue('custrecord_acq_loth_5b_de2_addlinstrct') || null;
		erFields.a5_title = exRec.getFieldValue('custrecord_acq_loth_1_de2_shrhldtitle') || null;
		erFields.e2_wire_account_number = exRec.getFieldValue('custrecord_acq_loth_5b_de2_bankacctnum') || null;
		erFields.e3_wire_aba_number = exRec.getFieldValue('custrecord_acq_loth_5b_de2_abaswiftnum') || null;
		erFields.e9_wire_postalcode = exRec.getFieldValue('custrecord_acq_loth_5b_de2_bankzip') || null;
		erFields.e9_wire_bank_country = exRec.getFieldValue('custrecord_acq_loth_5b_de2_bankcountry') || null;
		erFields.e10_wire_bank_contact = exRec.getFieldValue('custrecord_acq_loth_5b_de2_bankcontact') || null;
		erFields.e11_wire_bank_phone = exRec.getFieldValue('custrecord_acq_loth_5b_de2_bankphone') || null;
		erFields.e12_wire_forfurtheraccount = exRec.getFieldValue('custrecord_acq_loth_5b_de2_frthrcrdtacct') || null;
		erFields.e13_wire_forfurthername = exRec.getFieldValue('custrecord_acq_loth_5b_de2_frthrcrdtname') || null;
		erFields.e3_wire_sort = exRec.getFieldValue('custrecord_acq_loth_5b_de2_sortcode') || null;

		erFields.c1_check_payableto = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checkspayto') || null;
		erFields.c2_check_mailto = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checksmailto') || null;
		erFields.c3_check_addr1 = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checksaddr1') || null;
		erFields.c4_check_addr2 = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checksaddr2') || null;
		erFields.c5_check_addr3 = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checksaddr3') || null;
		erFields.c6_check_city = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checkscity') || null;
		erFields.c7_check_state = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checksstate') || null;
		erFields.c8_check_postalcode = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checkszip') || null;
		erFields.c9_check_country = exRec.getFieldValue('custrecord_acq_loth_5c_de2_checkscountry') || null;

		erFields.m1_medallion = exRec.getFieldValue('custrecord_acq_loth_6_de2_medallion') || null;
		erFields.m2_medallion_present = exRec.getFieldValue('custrecord_acq_loth_6_de2_medshrhldsig') || null;
		erFields.m3_medallion_number = exRec.getFieldValue('custrecord_acq_loth_6_de2_medallionnum') || null;

		var certResults = searchRelatedCerts(exRecID);
		if (certResults != null && certResults.length > 0) {
			for (var cLoop = 0; cLoop < certResults.length; cLoop++) {
				var oneResult = certResults[cLoop];
				var id = oneResult.getId();

				var tempObj = {};
				tempObj.ST = oneResult.getValue('custrecord_acq_lotce_3_de2_certtype') || null;
				tempObj.SN = oneResult.getValue('custrecord_acq_lotce_3_de2_certnumber') || null;
				tempObj.SH = oneResult.getValue('custrecord_acq_lotce_3_de2_numbershares') || null;
				tempObj.ST = oneResult.getValue('custrecord_acq_lotce_3_de2_certtype') || null;
				tempObj.MISSING = oneResult.getValue('custrecord_acq_lotce_3_de2_lostcert') || null;
				tempObj.ID = id;
				certFields['CERT_' + id] = tempObj;
			}
		}
		data.erFields = erFields;
		data.certFields = certFields;
		data.callbacktype = 'returningDE2Fields';
		return data;

	}
	catch (e) {
		var err = e;
		// msg.setStatusError();
		// msg.addMessage('Problem fetching the data from the Exchange Record. fetchDE2FieldsfromExRec(). Code DE_360');
		// nlapiLogExecution('DEBUG', 'Problem fetching the data.', 'Problem fetching the data from the Exchange Record. fetchDE2FieldsfromExRec(). Code DE_360');
		// data.msg = msg;
		data.error = JSON.stringify(err);
		return data;
	}
}

function fetchDE2FieldsfromStatusRec(dataIn) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var statusRecObj = {};
	try {
		var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', dataIn.statusrec);
		var statusRecJSON = statusRec.getFieldValue('custrecord_acq_lot_de_de2_json');
		// PARSE JSON DATA FROM DE1 JSON FIELD ON STATUS RECORD
		if (statusRecJSON != null && statusRecJSON != '') {
			statusRecObj = JSON.parse(statusRecJSON);
		}
		else {
			msg.setStatusError();
			msg.addMessage('There is not any JSON data to parse. fetchDE2FieldsfromStatusRec(). Code DE_655');
			statusRecObj.msg = msg;
		}
		// UPDATE OBJECT WITH OTHER FIELDS FROM STATUS RECORD
		statusRecObj.entrycomplete = statusRec.getFieldValue('custrecord_acq_lot_de_de2_status');
		statusRecObj.alterations = statusRec.getFieldValue('custrecord_acq_lot_de_de2_alterations');
		statusRecObj.de_notes = statusRec.getFieldValue('custrecord_acq_lot_de_de2_notes');
		statusRecObj.callbacktype = 'returningDE2Fields';

		// var newCertOBJ = fetchDE0CertFields(dataIn.txnid, statusRecObj.certfields);
		// if(newCertOBJ != null && newCertOBJ != '') {
		// statusRecObj.certfields = newCertOBJ;
		// }

	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem fetching the JSON data from the Exchange Status Record. fetchDE1FieldsfromStatusRec(). Code DE_665');
		nlapiLogExecution('DEBUG', 'Problem fetching the JSON data.', 'Problem fetching the JSON data from the Exchange Status Record. fetchDE1FieldsfromStatusRec(). Code DE_665', '');
		statusRecObj.msg = msg;
	}
	return statusRecObj;
}

function fetchDE0CertFields(exRecID, userCertFields) {
	var certFields = {};
	var certResults = searchRelatedCerts(exRecID);
	if (certResults != null && certResults.length > 0) {
		for (var cLoop = 0; cLoop < certResults.length; cLoop++) {
			var oneResult = certResults[cLoop];
			var id = oneResult.getId();
			var tempObj = {};
			// for(usrCert in userCertFields) {
			// var usrCertData = userCertFields[usrCert];
			// if(usrCertData.ID == id) {
			tempObj.ST = oneResult.getValue('custrecord_acq_lotce_3_src_certtype') || null;
			tempObj.ST_display = oneResult.getText('custrecord_acq_lotce_3_src_certtype') || null;
			tempObj.SN = oneResult.getValue('custrecord_acq_lotce_3_src_certnumber') || null;
			tempObj.SH = oneResult.getValue('custrecord_acq_lotce_3_src_numbershares') || null;
			// tempObj.MISSING = oneResult.getValue('custrecord_acq_lotce_3_src_lostcert') || null;
			tempObj.ID = id;
			// tempObj.MATCH = usrCertData.MATCH;
			// tempObj.MISS = usrCertData.MISS;
			certFields['CERT_' + id] = tempObj;
			// }
			// }
		}
	}
	return certFields;
}

function submitDE1jsonToStatus(data) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var erFields = data.erfields;
	var certFields = data.certfields;
	var exRecID = data.txnid;
	var statusRecID = data.statusrec;
	nlapiLogExecution('ERROR', 'About to submit JSON to status record.', JSON.stringify(data));
	try {
		var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', data.statusrec);
		if (data.entrycomplete == true) {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_status', 3);
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_notes', data.de_notes);
		}
		else {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_status', 2);
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_notes', data.de_notes);
		}
		if (data.alterations == true) {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_alterations', 'T');
		}
		else {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_alterations', 'F');
		}
		// if(data.datetimestamp != null && data.datetimestamp != '') {
		// var de1Date = nlapiStringToDate(data.datetimestamp, 'datetime');
		// statusRec.setFieldValue('custrecord_acq_lot_de_de1_timedate', de1Date);
		// }
		// if(erFields.lpm1_paymethod != null && erFields.lpm1_paymethod != '') {
		// statusRec.setFieldValue('custrecord_acq_lot_de_de1_paymethod', data.lpm1_paymethod);
		// }
		var previousJSON = statusRec.getFieldValue('custrecord_acq_lot_de_de1_json');
		statusRec.setFieldValue('custrecord_acq_lot_de_de1_log', previousJSON);
		statusRec.setFieldValue('custrecord_acq_lot_de_de1_json', JSON.stringify(data));
		statusRec.setFieldValue('custrecord_acq_lot_de_de1_timedate', data.datetimestamp);
		
		var updateStatusRecID = nlapiSubmitRecord(statusRec);
		nlapiLogExecution('DEBUG', 'Success: Status record updated. ' + updateStatusRecID, '');
	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem submitting fields, the Exchange Status Record may not have been updated. Code DE_711. Status Record #' + statusRecID);
		var err = e;
		nlapiLogExecution('ERROR', 'Dual Entry Error Code DE_704', 'Problem submitting fields, the Exchange Status Record may not have been updated. Code DE_711.', JSON.stringify(err));
		return msg;
	}
	var message = "Exchange Status Record " + statusRecID + " has been updated.";
	msg.addMessage(message);
	return msg;
}

function submitDE2jsonToStatus(data) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var erFields = data.erfields;
	var certFields = data.certfields;
	var exRecID = data.txnid;
	var statusRecID = data.statusrec;

	try {
		var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', data.statusrec);
		if (data.entrycomplete == true) {
			statusRec.setFieldValue('custrecord_acq_lot_de_de2_status', 3);
			statusRec.setFieldValue('custrecord_acq_lot_de_de2_notes', data.de_notes);
		}
		else {
			statusRec.setFieldValue('custrecord_acq_lot_de_de2_status', 2);
			statusRec.setFieldValue('custrecord_acq_lot_de_de2_notes', data.de_notes);
		}
		if (data.alterations == true) {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_alterations', 'T');
		}
		else {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_alterations', 'F');
		}
		// if(data.datetimestamp != null && data.datetimestamp != '') {
		// statusRec.setFieldValue('custrecord_acq_lot_de_de2_timedate', data.datetimestamp);
		// }
		var previousJSON = statusRec.getFieldValue('custrecord_acq_lot_de_de2_json');
		statusRec.setFieldValue('custrecord_acq_lot_de_de2_log', previousJSON);
		statusRec.setFieldValue('custrecord_acq_lot_de_de2_json', JSON.stringify(data));
		statusRec.setFieldValue('custrecord_acq_lot_de_de2_timedate', data.datetimestamp);
		
		nlapiSubmitRecord(statusRec);
	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem submitting fields, the Exchange Status Record may not have been updated. Code DE_754. Status Record #' + statusRecID);
		var err = e;
		nlapiLogExecution('ERROR', 'Dual Entry Error Code DE_704', 'Problem submitting fields, the Exchange Status Record may not have been updated. Code DE_754.', JSON.stringify(err));
		return msg;
	}
	var message = "Exchange Status Record " + statusRecID + " has been updated.";
	msg.addMessage(message);
	return msg;
}

function submitDE1Data(data) {
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	var erFields = data.erfields;
	var certFields = data.certfields;
	var exRecID = data.txnid;
	var statusRecID = data.statusrec;
	nlapiLogExecution('DEBUG', 'About to submit Reviewer data to the DE1 fields on the Exchange Record.', JSON.stringify(data));

	try {
		var exRec = nlapiLoadRecord('customrecord_acq_lot', data.txnid, {
			recordmode : 'dynamic'
		});
		// TODO: FIX MAPPINGS HERE
		exRec.setFieldText('custrecord_acq_loth_7_de1_shrhldsig', erFields.a1_signature_present || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldname', erFields.a1_holdername || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1', erFields.a2_addr1 || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2', erFields.a3_addr2 || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldcity', erFields.a5_city || '');
		exRec.setFieldText('custrecord_acq_loth_1_de1_shrhldstate', erFields.a6_state || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd', erFields.a7_postalcode || '');
		exRec.setFieldText('custrecord_acq_loth_1_de1_shrhldcountry', erFields.a8_country || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldemail', erFields.a9_email || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldphone', erFields.a10_telephone || '');

		exRec.setFieldValue('custrecord_acq_loth_2_de1_ssnein', erFields.w2_ssn_ein || '');
		exRec.setFieldText('custrecord_acq_loth_2_de1_taxclass', erFields.w4_taxclass || '');
		exRec.setFieldText('custrecord_acq_loth_2_de1_taxsigpresent', erFields.w3_signature || '');
		exRec.setFieldText('custrecord_acq_loth_2_de1_bckupwholding', erFields.w4_backupwitholding || '');
		exRec.setFieldText('custrecord_acq_loth_4_de1_lotpaymethod', erFields.lpm1_paymethod || '');

		exRec.setFieldValue('custrecord_acq_loth_5a_de1_nameonbnkacct', erFields.e1_bank_namesonbank || '');
		exRec.setFieldValue('custrecord_acq_loth_5a_de1_bankacctnum', erFields.e2_bank_accountnumber || '');
		exRec.setFieldValue('custrecord_acq_loth_5a_de1_abaswiftnum', erFields.e3_bank_abanumber || '');
		exRec.setFieldText('custrecord_acq_loth_5a_de1_bankaccttype', erFields.e5_bank_accounttype || '');
		exRec.setFieldValue('custrecord_acq_loth_5a_de1_bankname', erFields.e4_bank_name || '');
		exRec.setFieldValue('custrecord_acq_loth_5a_de1_bankaddr', erFields.a6_bank_address || '');
		exRec.setFieldValue('custrecord_acq_loth_5a_de1_bankcity', erFields.a7_city || '');
		exRec.setFieldText('custrecord_acq_loth_5a_de1_bankstate', erFields.a8_bank_state || '');
		exRec.setFieldValue('custrecord_acq_loth_5a_de1_bankphone', erFields.a9_bank_phone || '');

		exRec.setFieldValue('custrecord_acq_loth_5b_de1_nameonbnkacct', erFields.e1_wire_namesonBank || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_addlinstrct', erFields.a10_additional_instruction || '');
		exRec.setFieldValue('custrecord_acq_loth_1_de1_shrhldtitle', erFields.a5_title || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_bankacctnum', erFields.e2_wire_account_number || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_abaswiftnum', erFields.e3_wire_aba_number || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_bankzip', erFields.e9_wire_postalcode || '');
		exRec.setFieldText('custrecord_acq_loth_5b_de1_bankcountry', erFields.e9_wire_bank_country || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_bankcontact', erFields.e10_wire_bank_contact || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_bankphone', erFields.e11_wire_bank_phone || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtacct', erFields.e12_wire_forfurtheraccount || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtname', erFields.e13_wire_forfurthername || '');
		exRec.setFieldValue('custrecord_acq_loth_5b_de1_sortcode', erFields.e3_wire_sort || '');

		exRec.setFieldValue('custrecord_acq_loth_5c_de1_checkspayto', erFields.c1_check_payableto || '');
		exRec.setFieldValue('custrecord_acq_loth_5c_de1_checksmailto', erFields.c2_check_mailto || '');
		exRec.setFieldValue('custrecord_acq_loth_5c_de1_checksaddr1', erFields.c3_check_addr1 || '');
		exRec.setFieldValue('custrecord_acq_loth_5c_de1_checksaddr2', erFields.c4_check_addr2 || '');
		exRec.setFieldValue('custrecord_acq_loth_5c_de1_checksaddr3', erFields.c5_check_addr3 || '');
		exRec.setFieldValue('custrecord_acq_loth_5c_de1_checkscity', erFields.c6_check_city || '');
		exRec.setFieldText('custrecord_acq_loth_5c_de1_checksstate', erFields.c7_check_state || '');
		exRec.setFieldValue('custrecord_acq_loth_5c_de1_checkszip', erFields.c8_check_postalcode || '');
		exRec.setFieldText('custrecord_acq_loth_5c_de1_checkscountry', erFields.c9_check_country || '');

		exRec.setFieldText('custrecord_acq_loth_6_de1_medallion', erFields.m1_medallion || '');
		exRec.setFieldText('custrecord_acq_loth_6_de1_medshrhldsig', erFields.m2_medallion_present || '');
		exRec.setFieldValue('custrecord_acq_loth_6_de1_medallionnum', erFields.m3_medallion_number || '');
		exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_acqstatus', '4');

		// New Fields as per NS-32
		exRec.setFieldValue('custrecord_acq_loth_2_de1_irsname', erFields.w1_irsname || '');
		exRec.setFieldText('custrecordacq_loth_2_de1_taxidmethod', erFields.w4_taxidmethod || '');
		exRec.setFieldValue('custrecord_acq_loth_2_de1_ssnein', erFields.w2_ssn_ein || '');
		exRec.setFieldText('custrecord_acq_loth_2_de1_taxsigpresent', erFields.w3_signature|| '');
		exRec.setFieldText('custrecord_acq_loth_2_de1_taxclass', erFields.w4_taxclass || '');
		exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_rcvdtimestmp', data.datetimestamp || '');
		exRec.setFieldValue('custrecord_acq_loth_zzz_zzz_de1timestmp', data.datetimestamp || '');
		exRec.setFieldText('custrecord_acq_loth_2_de1_bckupwholding', erFields.w4_backupwitholding || '');
		exRec.setFieldValue('custrecord_acq_loth_0_de1_notes', data.de_notes || '');
		

	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem setting fields on the Exchange Record was not updated. Code DE_831');
		nlapiLogExecution('ERROR', 'Dual Entry Error Code DE_565', 'Problem submitting fields, the Exchange Record was not updated. Code DE_831. Exchange Record: ' + exRec.id);
		nlapiLogExecution('ERROR', 'Full Error', e.toString());
	}
	try {
		var recID = nlapiSubmitRecord(exRec);
	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem submitting the Exchange Record. Code DE_839');
		nlapiLogExecution('ERROR', 'Dual Entry Error Code DE_839', 'Problem submitting fields, the Exchange Record was not updated. Code DE_839. Exchange Record: ' + exRec.id);
		return msg;
	}
	try {
		var statusRec = nlapiLoadRecord('customrecord_acq_lot_de_dualentry_status', data.statusrec);
		if (data.entrycomplete == true && data.alterations != '1') {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_status', 3);
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_notes', data.de_notes);
		}
		else if (data.alterations == '1') {
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_status', 2);
			statusRec.setFieldValue('custrecord_acq_lot_de_de1_notes', data.de_notes);
		}
		var previousJSON = statusRec.getFieldValue('custrecord_acq_lot_de_de1_json');
		statusRec.setFieldValue('custrecord_acq_lot_de_de1_log', previousJSON);
		statusRec.setFieldValue('custrecord_acq_lot_de_de1_json', JSON.stringify(data));

		statusRec.setFieldValue('custrecord_acq_lot_de_reviewcomplete', 'T');
		statusRec.setFieldValue('custrecord_acq_lot_de_last_reviewer', data.reviewerid);
		statusRec.setFieldValue('custrecord_acq_lot_de_current_reviewer', '');
		statusRec.setFieldValue('custrecord_acq_lot_de_review1_notes', data.de_notes);

		nlapiSubmitRecord(statusRec);
	}
	catch (e) {
		msg.setStatusError();
		msg.addMessage('Problem submitting fields, the Exchange Status Record was not updated. Code DE_861');
		nlapiLogExecution('ERROR', 'Dual Entry Error Code DE_570', 'Problem submitting fields, the Exchange Record was not updated. Code DE_861. Exchange Record: ' + recID);
		return msg;
	}
	var message = "Exchange Record " + exRecID + " has been updated.";
	msg.addMessage(message);

	if (certFields != null && certFields != '') {
		for (cert in certFields) {
			var tmp = cert.split('_');
			var rowid = tmp[1];
			var certificate = certFields[cert];

			if (certificate.ID != null && certificate.ID != '') {
				var certResults = searchCertificateRecs(exRecID, certificate.SN);
				if (certResults != null && certResults != '') {
					var certID = certResults[0];
					var certRec = nlapiLoadRecord('customrecord_acq_lot_cert_entry', certificate.ID);
					certRec.setFieldValue('custrecord_acq_lotce_3_de1_certnumber', certificate.SN || null);
					certRec.setFieldValue('custrecord_acq_lotce_3_de1_certtype', certificate.ST || null);
					certRec.setFieldValue('custrecord_acq_lotce_3_de1_numbershares', certificate.SH || null);
					certRec.setFieldValue('custrecord_acq_lotce_3_de1_lostcert', certificate.MISSING || null);
					certRec.setFieldValue('custrecord_acq_lotce_zzz_zzz_lotcestatus', 5);
					nlapiSubmitRecord(certRec);
				}
			}
			else {
				var certRec = nlapiCreateRecord('customrecord_acq_lot_cert_entry');
				certRec.setFieldValue('custrecord_acq_lotce_3_de1_certnumber', certificate.SN || null);
				certRec.setFieldValue('custrecord_acq_lotce_3_de1_certtype', certificate.ST || null);
				certRec.setFieldValue('custrecord_acq_lotce_3_de1_numbershares', certificate.SH || null);
				certRec.setFieldValue('custrecord_acq_lotce_3_de1_lostcert', certificate.MISSING || null);
				certRec.setFieldValue('custrecord_acq_lotce_zzz_zzz_lotcestatus', 5);
				var certRecID = nlapiSubmitRecord(certRec);
				msg.addMessage('WARNING!  A new certificate record was created with an internal id of ' + certRecID + '.\nPlease make sure this is correct.');
			}
		}
	}
	return msg;
}

function buildReviewHeader(exRec, userRole, btnType) {
	var headerHTML = '';
	var bootStrapCSS = '';
	try {
		ACQ_LOT_DE_Header_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_Header_CSS.css');
		ACQ_LOT_DE_Header_HTML = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DE_ReviewHeader.html');
	}
	catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	headerHTML += '<html lang="en">';
	headerHTML += '<head>';
	headerHTML += '<style>';
	headerHTML += ACQ_LOT_DE_Header_CSS.getValue();
	headerHTML += '.text { font-size:10pt };';
	headerHTML += '</style>';
	headerHTML += '</head>';
	headerHTML += '<body id="customHeader">';
	headerHTML += ACQ_LOT_DE_Header_HTML.getValue();
	var dealname = exRec.getFieldText('custrecord_acq_loth_zzz_zzz_deal');
	headerHTML = headerHTML.replace(/{deal}/, dealname);
	headerHTML = headerHTML.replace(/{role}/, deStatus[userRole]);
	headerHTML = headerHTML.replace(/{sholder}/, exRec.getFieldText('custrecord_acq_loth_zzz_zzz_shareholder'));
	// Create list to the LOT PDF Document
	var docList = '<ul class="list-unstyled" style="list-style-type: none;">';
	var docResults = searchRelatedDocuments(exRec.id);
	if (docResults != null && docResults.length > 0) {
		for (var p = 0; p < docResults.length; p++) {
			var oneDoc = docResults[p];
			var mediaID = oneDoc.getValue('custrecord_file');
			var dType = oneDoc.getValue('custrecord_doc_type');
			var deReq = oneDoc.getValue('custrecord_acq_lot_de_required');
			// Now use a new search of the native
			var nativeDoc = searchDocumentURL(mediaID);
			var nDoc = nativeDoc[0];
			var dURL = nDoc.getValue('url');
			var dName = nDoc.getValue('name');
			if (deReq == 'T') {
				docList += '<li><a href="' + dURL + '" target="_blank">' + dName + '</a></li>';
			}
		}
	}

	// var lotPDFid = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_rcvddocimage');
	// if(lotPDFid != null && lotPDFid != '') {
	// var doc2 = searchDocumentURL(lotPDFid);
	// var dURL2 = doc2[0].getValue('url');
	// var dName2 = doc2[0].getValue('name');
	// docList += '<li><a href="'+ dURL2 +'" target="_blank">'+ dName2 +'</a></li>';
	// }
	docList += '</ul>';
	headerHTML = headerHTML.replace(/{doc.link}/, docList);

	// Replace the button html with the appropriate button.
	var deUserBtnHTML = '<button id="custRefresh" type="button" class="btn btn-default btn-sm pull-right" style="right;0px;">   Refresh  </button>&nbsp;&nbsp;&nbsp;';
	deUserBtnHTML += '<button id="custSubmit" type="button" class="btn btn-default btn-sm pull-right" style="right;0px;">   Submit  </button>';

	var reviewBtnHTML = '';// '<button id="reviewRefresh" type="button" class="btn btn-default btn-sm pull-right" style="right;0px;"> Refresh </button>&nbsp;&nbsp;&nbsp;';
	reviewBtnHTML += '<button id="reviewSubmit1" type="button" class="btn btn-default btn-sm pull-right reviewSubmit" style="right;0px;"> Approve and Save </button>';

	if (btnType == 'review') {
		headerHTML = headerHTML.replace(/{submit.buttons}/, reviewBtnHTML);
	}
	else {
		headerHTML = headerHTML.replace(/{submit.buttons}/, deUserBtnHTML);
	}

	headerHTML += '</body>';
	headerHTML += '</html>';
	return headerHTML;
}

function buildHeader(exRec, userRole, btnType) {
	var headerHTML = '';
	var bootStrapCSS = '';
	try {
		ACQ_LOT_DE_Header_CSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_Header_CSS.css');
		ACQ_LOT_DE_Header_HTML = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DE_Header.html');
	}
	catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	headerHTML += '<html lang="en">';
	headerHTML += '<head>';
	headerHTML += '<style>';
	headerHTML += ACQ_LOT_DE_Header_CSS.getValue();
	headerHTML += '.text { font-size:10pt };';
	headerHTML += '</style>';
	headerHTML += '</head>';
	headerHTML += '<body id="customHeader">';
	headerHTML += ACQ_LOT_DE_Header_HTML.getValue();
	var dealname = exRec.getFieldText('custrecord_acq_loth_zzz_zzz_deal');
	headerHTML = headerHTML.replace(/{deal}/, dealname);
	headerHTML = headerHTML.replace(/{role}/, deStatus[userRole]);
	headerHTML = headerHTML.replace(/{sholder}/, exRec.getFieldText('custrecord_acq_loth_zzz_zzz_shareholder'));
	// Create list to the LOT PDF Document
	var docList = '<ul class="list-unstyled" style="list-style-type: none;">';
	var docResults = searchRelatedDocuments(exRec.id);
	if (docResults != null && docResults.length > 0) {
		for (var p = 0; p < docResults.length; p++) {
			var oneDoc = docResults[p];
			var mediaID = oneDoc.getValue('custrecord_file');
			var dType = oneDoc.getValue('custrecord_doc_type');
			var deReq = oneDoc.getValue('custrecord_acq_lot_de_required');
			// Now use a new search of the native
			var nativeDoc = searchDocumentURL(mediaID);
			var nDoc = nativeDoc[0];
			var dURL = nDoc.getValue('url');
			var dName = nDoc.getValue('name');
			if (deReq == 'T') {
				docList += '<li><a href="' + dURL + '" target="_blank">' + dName + '</a></li>';
			}
		}
	}
	var lotPDFid = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_rcvddocimage');
	if (lotPDFid != null && lotPDFid != '') {
		var doc2 = searchDocumentURL(lotPDFid);
		var dURL2 = doc2[0].getValue('url');
		var dName2 = doc2[0].getValue('name');
		docList += '<li><a href="' + dURL2 + '" target="_blank">' + dName2 + '</a></li>';
	}
	docList += '</ul>';
	headerHTML = headerHTML.replace(/{doc.link}/, docList);

	// Replace the button html with the appropriate button.
	var deUserBtnHTML = '<button id="custRefresh" type="button" class="btn btn-default btn-sm pull-right" style="right;0px;">   Refresh  </button>&nbsp;&nbsp;&nbsp;';
	deUserBtnHTML += '<button id="custSubmit" type="button" class="btn btn-default btn-sm pull-right" style="right;0px;">   Submit  </button>';

	var reviewBtnHTML = '<button id="reviewRefresh" type="button" class="btn btn-default btn-sm pull-right" style="right;0px;">   Refresh  </button>&nbsp;&nbsp;&nbsp;';
	reviewBtnHTML += '<button id="reviewSubmit" type="button" class="btn btn-default btn-sm pull-right" style="right;0px;">   Submit DE1 </button>';

	if (btnType == 'review') {
		headerHTML = headerHTML.replace(/{submit.buttons}/, reviewBtnHTML);
	}
	else {
		headerHTML = headerHTML.replace(/{submit.buttons}/, deUserBtnHTML);
	}

	headerHTML += '</body>';
	headerHTML += '</html>';
	return headerHTML;
}

function buildEntryFields(exRec) {
	var exchTabHTML = '';
	var bootStrapCSS = '';
	try {
		exchTabBody = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DE_ExchTabHTML.html');
		exchTabCSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_CertTab_CSS.css');
	}
	catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	exchTabHTML += '<html lang="en">';
	exchTabHTML += '<head>';
	exchTabHTML += '<style>';
	// exchTabHTML += bootStrapCSS.getValue();
	exchTabHTML += exchTabCSS.getValue();
	exchTabHTML += '.text { font-size:10pt } .checkboximage { srs=""';
	exchTabHTML += '</style>';
	exchTabHTML += '<meta charset="utf-8">';
	exchTabHTML += '<title>Letter of Transmittal - Payments</title>';
	exchTabHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
	exchTabHTML += '<meta name="description" content="">';
	exchTabHTML += '<meta name="author" content="smccurry">';
	exchTabHTML += '</head>';
	exchTabHTML += '<body>';
	exchTabHTML += exchTabBody.getValue();
	// Populate State select options in template with the correct list from NetSuite
	var statesListOBJ = buildStateListOBJ(exRec);
	var statesList = buildSelectOptionsHTML(statesListOBJ);
	exchTabHTML = exchTabHTML.replace(/{a6_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{a8_bank_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{c7_check_state}/, statesList);
	// Populate the Country select options in the html template with the correct list
	var countriesOBJ = buildCountriesListOBJ(exRec);
	var countriesList = buildSelectOptionsHTML(countriesOBJ);
	exchTabHTML = exchTabHTML.replace(/{a8_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{c9_check_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{e9_wire_bank_country}/, countriesList);
	// Populate the payMethod select options with the list from Exchange Record
	var payMethodOBJ = buildpayMethodListOBJ(exRec);
	var payMethodList = buildSelectOptionsHTML(payMethodOBJ);
	exchTabHTML = exchTabHTML.replace(/{payMethod.list}/, payMethodList);

	var taxIDMethodOBJ = buildtaxIDMethodListOBJ(exRec);
	var taxIDMethodList = buildSelectOptionsHTML(taxIDMethodOBJ);
	exchTabHTML = exchTabHTML.replace(/{w4taxidmethod}/, taxIDMethodList);

	var taxClassOBJ = buildtaxClassListOBJ(exRec);
	var taxClassList = buildSelectOptionsHTML(taxClassOBJ);
	exchTabHTML = exchTabHTML.replace(/{w4taxclass}/, taxClassList);
	// Populate the checking / savings type of account list
	var accountTypeOBJ = buildAccountTypeListOBJ(exRec);
	var accountTypeList = buildSelectOptionsHTML(accountTypeOBJ);
	exchTabHTML = exchTabHTML.replace(/{e5_bank_accounttype}/, accountTypeList);

	exchTabHTML += '</body>';
	exchTabHTML += '</html>';
	return exchTabHTML;
}

function buildCertFields(exRec) {
	var certTabHTML = '';
	var bootStrapCSS = '';
	try {
		certTabBody = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DE_CertTabHTML.html');
		exchTabCSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_TABLE_CSS.css');
	}
	catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	certTabHTML += '<html lang="en">';
	certTabHTML += '<head>';
	certTabHTML += '<style>';
	certTabHTML += exchTabCSS.getValue();
	certTabHTML += '.text { font-size:10pt } .checkboximage { srs=""';
	certTabHTML += '</style>';
	certTabHTML += '<meta charset="utf-8">';
	certTabHTML += '<title>Letter of Transmittal - Payments</title>';
	certTabHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
	certTabHTML += '<meta name="description" content="">';
	certTabHTML += '<meta name="author" content="smccurry">';
	certTabHTML += '</head>';
	certTabHTML += '<body>';
	certTabHTML += certTabBody.getValue();
	var certRows = '';
	var certTypesOBJ = buildCertTypesListOBJ();
	var certTypesList = buildSelectOptionsHTML(certTypesOBJ);
	certTabHTML = certTabHTML.replace(/{cert_rows}/, certTypesList);
	certTabHTML += '</body>';
	certTabHTML += '</html>';
	return certTabHTML;
}

function buildReviewCertFields(exRec) {
	var certTabHTML = '';
	var bootStrapCSS = '';
	try {
		certTabBody = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DE_ReviewCertTab.html');
		exchTabCSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_TABLE_CSS.css');
	}
	catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	certTabHTML += '<html lang="en">';
	certTabHTML += '<head>';
	certTabHTML += '<style>';
	certTabHTML += exchTabCSS.getValue();
	certTabHTML += '.text { font-size:10pt } .checkboximage { srs=""';
	certTabHTML += '</style>';
	certTabHTML += '<meta charset="utf-8">';
	certTabHTML += '<title>Letter of Transmittal - Payments</title>';
	certTabHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
	certTabHTML += '<meta name="description" content="">';
	certTabHTML += '<meta name="author" content="smccurry">';
	certTabHTML += '</head>';
	certTabHTML += '<body>';
	certTabHTML += certTabBody.getValue();
	var certRows = '';
	var certTypesOBJ = buildCertTypesListOBJ();
	var certTypesList = buildSelectOptionsHTML(certTypesOBJ);
	certTabHTML = certTabHTML.replace(/{cert_rows}/, certTypesList);
	certTabHTML += '</body>';
	certTabHTML += '</html>';
	return certTabHTML;
}

function buildCertRow(x) {
	certRowHTML = '<tr id="tr_' + (x + 1) + '" style="margin:20px;" class="certRow">';
	certRowHTML += '<td style="width: 30px;"> ' + (x + 1) + ' </td>';
	certRowHTML += '<td class="text-right fieldCol">';
	certRowHTML += '<select class="form-control dropdown certificate" id="ST_' + (x + 1) + '" disabled>';
	certRowHTML += '<option value=""></option>';
	// Load up a certificate record and get the Certificate Type (Security Type) field and create select options
	// var certTypesOBJ = buildCertTypesListOBJ();
	// var certTypesList = buildSelectOptionsHTML(certTypesOBJ);
	certRowHTML += certTypesList;
	certRowHTML += '</select>';
	certRowHTML += '</td>';
	certRowHTML += '<td class="text-right fieldCol"><input type="text" class="form-control certificate" id="SN_' + (x + 1) + '" placeholder="" style="width:90%;" disabled></td>';
	certRowHTML += '<td class="text-right fieldCol"><input type="text" class="form-control certificate" id="SH_' + (x + 1) + '" placeholder="" style="width:90%;" disabled></td>';
	certRowHTML += '<td class="text-right fieldCol" style="heigth:12px;width:30px;">';
	certRowHTML += '<select class="form-control dropdown" id="miss_' + (x + 1) + '" disabled>';
	certRowHTML += '<option></option>';
	certRowHTML += '<option value="1">Yes</option>';
	certRowHTML += '<option value="2">No</option>';
	certRowHTML += '</select>';
	certRowHTML += '</td>';
	certRowHTML += '<td id="id_' + (x + 1) + '" class="certRowID">';
	certRowHTML += '</td>';
	certRowHTML += '</tr>';
	return certRowHTML;
}

function buildReviewErFields(exRec) {
	var exchTabHTML = '';
	var bootStrapCSS = '';
	try {
		exchReviewBody = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DE_ReviewPage.html');
		// exchTabCSS= nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_ReviewPage_CSS.css');
		exchTabCSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/bootstrap.min.css');
	}
	catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	exchTabHTML += '<html lang="en">';
	exchTabHTML += '<head>';
	exchTabHTML += '<style>';
	// exchTabHTML += bootStrapCSS.getValue();
	exchTabHTML += exchTabCSS.getValue();
	exchTabHTML += '.text { font-size:10pt } .checkboximage { srs=""';
	exchTabHTML += '</style>';
	exchTabHTML += '<meta charset="utf-8">';
	exchTabHTML += '<title>Letter of Transmittal - Payments</title>';
	exchTabHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
	exchTabHTML += '<meta name="description" content="">';
	exchTabHTML += '<meta name="author" content="smccurry">';
	exchTabHTML += '</head>';
	exchTabHTML += '<body>';
	exchTabHTML += exchReviewBody.getValue();
	// Populate State select options in template with the correct list from NetSuite
	var statesListOBJ = buildStateListOBJ(exRec);
	var statesList = buildSelectOptionsHTML(statesListOBJ);
	exchTabHTML = exchTabHTML.replace(/{de1_a6_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de1_a8_bank_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de1_c7_check_state}/, statesList);
	// Populate State select options in template with the correct list from NetSuite
	// var statesListOBJ2 = buildStateListOBJ(exRec);
	// var statesList2 = buildSelectOptionsHTML(statesListOBJ2);
	exchTabHTML = exchTabHTML.replace(/{de2_a6_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de2_a8_bank_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de2_c7_check_state}/, statesList);
	// Populate the Country select options in the html template with the correct list
	var countriesOBJ = buildCountriesListOBJ(exRec);
	var countriesList = buildSelectOptionsHTML(countriesOBJ);
	exchTabHTML = exchTabHTML.replace(/{de1_a8_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de1_c9_check_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de1_e9_wire_bank_country}/, countriesList);
	// Populate the Country select options in the html template with the correct list
	// var countriesOBJ2 = buildCountriesListOBJ(exRec);
	// var countriesList2 = buildSelectOptionsHTML(countriesOBJ2);
	exchTabHTML = exchTabHTML.replace(/{de2_a8_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de2_c9_check_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de2_e9_wire_bank_country}/, countriesList);
	// Populate the payMethod select options with the list from Exchange Record
	var payMethodOBJ = buildpayMethodListOBJ(exRec);
	var payMethodList = buildSelectOptionsHTML(payMethodOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_payMethod.list}/, payMethodList);
	exchTabHTML = exchTabHTML.replace(/{de1_payMethod.list}/, payMethodList);
	exchTabHTML = exchTabHTML.replace(/{de2_payMethod.list}/, payMethodList);
	// Populate the Tax Class List
	var taxClassOBJ = buildtaxClassListOBJ(exRec);
	var taxClassList = buildSelectOptionsHTML(taxClassOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_w4taxclass}/, taxClassList);
	exchTabHTML = exchTabHTML.replace(/{de1_w4taxclass}/, taxClassList);
	exchTabHTML = exchTabHTML.replace(/{de2_w4taxclass}/, taxClassList);
	// Populate the Account Type list
	var accountTypeOBJ = buildAccountTypeListOBJ(exRec);
	var accountTypeList = buildSelectOptionsHTML(accountTypeOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_e5_bank_accounttype}/, accountTypeList);
	exchTabHTML = exchTabHTML.replace(/{de1_e5_bank_accounttype}/, accountTypeList);
	exchTabHTML = exchTabHTML.replace(/{de2_e5_bank_accounttype}/, accountTypeList);

	exchTabHTML += '</body>';
	exchTabHTML += '</html>';
	return exchTabHTML;
}

function buildReviewErFieldsJSON(de1Fields, de2Fields, exRec) {
	var exchTabHTML = '';
	var bootStrapCSS = '';
	try {
		exchReviewBody = nlapiLoadFile('SuiteBundles/Bundle 53315/html/ACQ_LOT_DE_ReviewPage2.html');
		// exchTabCSS= nlapiLoadFile('SuiteBundles/Bundle 53315/css/ACQ_LOT_DE_ReviewPage_CSS.css');
		exchTabCSS = nlapiLoadFile('SuiteBundles/Bundle 53315/css/bootstrap.min.css');
	}
	catch (e) {
		nlapiLogExecution('ERROR', 'Problems loading html or css file.', 'bootStrapcss, ACQ_LOT_DA_Docs_CSS, ACQ_LOT_DA_Status_CSS, ACQ_LOT_StatusPage_html');
	}
	exchTabHTML += '<html lang="en">';
	exchTabHTML += '<head>';
	exchTabHTML += '<style>';
	// exchTabHTML += bootStrapCSS.getValue();
	exchTabHTML += exchTabCSS.getValue();
	exchTabHTML += '.text { font-size:10pt } .checkboximage { srs=""';
	exchTabHTML += '</style>';
	exchTabHTML += '<meta charset="utf-8">';
	exchTabHTML += '<title>Letter of Transmittal - Payments</title>';
	exchTabHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
	exchTabHTML += '<meta name="description" content="">';
	exchTabHTML += '<meta name="author" content="smccurry">';
	exchTabHTML += '</head>';
	exchTabHTML += '<body>';
	exchTabHTML += exchReviewBody.getValue();
	// Populate State select options in template with the correct list from NetSuite
	var statesListOBJ = buildStateListOBJ(exRec);
	var statesList = buildSelectOptionsHTML(statesListOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_a6_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de0_e8_bank_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de0_c7_check_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de1_a6_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de1_a8_bank_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de1_c7_check_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de2_a6_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de2_a8_bank_state}/, statesList);
	exchTabHTML = exchTabHTML.replace(/{de2_c7_check_state}/, statesList);
	// Populate the Country select options in the html template with the correct list
	var countriesOBJ = buildCountriesListOBJ(exRec);
	var countriesList = buildSelectOptionsHTML(countriesOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_a8_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de0_c9_check_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de0_e9_wire_bank_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de1_a8_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de1_c9_check_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de1_e9_wire_bank_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de2_a8_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de2_c9_check_country}/, countriesList);
	exchTabHTML = exchTabHTML.replace(/{de2_e9_wire_bank_country}/, countriesList);

	// Populate the payMethod select options with the list from Exchange Record
	var payMethodOBJ = buildpayMethodListOBJ(exRec);
	var payMethodList = buildSelectOptionsHTML(payMethodOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_payMethod.list}/, payMethodList);
	exchTabHTML = exchTabHTML.replace(/{de1_payMethod.list}/, payMethodList);
	exchTabHTML = exchTabHTML.replace(/{de2_payMethod.list}/, payMethodList);

	var taxClassOBJ = buildtaxClassListOBJ(exRec);
	var taxClassList = buildSelectOptionsHTML(taxClassOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_w4taxclass}/, taxClassList);
	exchTabHTML = exchTabHTML.replace(/{de1_w4taxclass}/, taxClassList);
	exchTabHTML = exchTabHTML.replace(/{de2_w4taxclass}/, taxClassList);

	var taxIDMethodOBJ = buildtaxIDMethodListOBJ(exRec);
	var taxIDMethodList = buildSelectOptionsHTML(taxIDMethodOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_w4taxidmethod}/, taxIDMethodList);
	exchTabHTML = exchTabHTML.replace(/{de1_w4taxidmethod}/, taxIDMethodList);
	exchTabHTML = exchTabHTML.replace(/{de2_w4taxidmethod}/, taxIDMethodList);

	// Populate the Account Type list
	var accountTypeOBJ = buildAccountTypeListOBJ(exRec);
	var accountTypeList = buildSelectOptionsHTML(accountTypeOBJ);
	exchTabHTML = exchTabHTML.replace(/{de0_e5_bank_accounttype}/, accountTypeList);
	exchTabHTML = exchTabHTML.replace(/{de1_e5_bank_accounttype}/, accountTypeList);
	exchTabHTML = exchTabHTML.replace(/{de2_e5_bank_accounttype}/, accountTypeList);

	exchTabHTML += '<button id="reviewSubmit2" type="button" class="btn btn-default btn-sm pull-left reviewSubmit" style="right;0px;"> Approve and Save </button>';
	exchTabHTML += '</body>';
	exchTabHTML += '</html>';
	return exchTabHTML;
}

function buildStateListOBJ(exRec) {
	var statesExRec = exRec.getField('custrecord_acq_loth_1_src_shrhldstate');
	var states = statesExRec.getSelectOptions();

	var statesObj = {};
	for (sLoop in states) {
		var currentID = 'id_' + states[sLoop].id;
		var currentText = states[sLoop].text;
		statesObj[currentID] = currentText;
	}
	return statesObj;
}

function buildCountriesListOBJ(exRec) {
	var countriesNative = exRec.getField('custrecord_acq_loth_1_de1_shrhldcountry');
	var countries = countriesNative.getSelectOptions();
	var countryObj = {};
	for (sLoop in countries) {
		var currentID = 'id_' + countries[sLoop].id;
		var currentText = countries[sLoop].text;
		countryObj[currentID] = currentText;
	}
	return countryObj;
}

function buildpayMethodListOBJ(exRec) {
	var payMethodsField = exRec.getField('custrecord_acq_loth_4_de1_lotpaymethod');
	var payMethods = payMethodsField.getSelectOptions();

	var payMethodObj = {};
	for (sLoop in payMethods) {
		var currentID = 'id_' + payMethods[sLoop].id;
		var currentText = payMethods[sLoop].text;
		payMethodObj[currentID] = currentText;
	}
	return payMethodObj;
}

function buildtaxIDMethodListOBJ(exRec) {
	var taxIDMethodListField = exRec.getField('custrecordacq_loth_2_de1_taxidmethod');
	var taxMethods = taxIDMethodListField.getSelectOptions();

	var taxIDMethodObj = {};
	for (sLoop in taxMethods) {
		var currentID = 'id_' + taxMethods[sLoop].id;
		var currentText = taxMethods[sLoop].text;
		taxIDMethodObj[currentID] = currentText;
	}
	return taxIDMethodObj;
}

function buildtaxClassListOBJ(exRec) {
	var taxClassListField = exRec.getField('custrecord_acq_loth_2_de1_taxclass');
	var taxClasses = taxClassListField.getSelectOptions();

	var taxClassObj = {};
	for (sLoop in taxClasses) {
		var currentID = 'id_' + taxClasses[sLoop].id;
		var currentText = taxClasses[sLoop].text;
		taxClassObj[currentID] = currentText;
	}
	return taxClassObj;
}

function buildCertTypesListOBJ(exRecID) {
	// var results = searchAnyCert();// TODO: (smccurry) Make the 805 below not hard coded by creating a search.
	var cerRec = nlapiLoadRecord('customrecord_acq_lot_cert_entry', 8);
	var certTypesListField = cerRec.getField('custrecord_acq_lotce_3_src_certtype');
	var certTypes = certTypesListField.getSelectOptions();

	var certTypeObj = {};
	for (sLoop in certTypes) {
		var currentID = 'id_' + certTypes[sLoop].id;
		var currentText = certTypes[sLoop].text;
		certTypeObj[currentID] = currentText;
	}
	return certTypeObj;
}

function buildAccountTypeListOBJ(exRec) {
	var accountTypeListField = exRec.getField('custrecord_acq_loth_5a_de1_bankaccttype');
	var accountTypes = accountTypeListField.getSelectOptions();

	var accountTypeObj = {};
	for (sLoop in accountTypes) {
		var currentID = 'id_' + accountTypes[sLoop].id;
		var currentText = accountTypes[sLoop].text;
		accountTypeObj[currentID] = currentText;
	}
	return accountTypeObj;
}

function buildSelectOptionsHTML(obj) {
	var optionsHTML = '';
	for (sLoop in obj) {
		var tempArry = sLoop.split('_');
		var currentID = tempArry[1];
		var currentText = obj[sLoop];
		optionsHTML += '<option value=' + currentID + '>' + currentText + '</options>';
	}
	return optionsHTML;
}
