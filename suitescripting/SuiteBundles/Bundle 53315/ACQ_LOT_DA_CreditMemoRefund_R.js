/**
 * Module Description
 * 
 * Version    Date            Author           	Remarks
 * 1.03       23 Jun 2014     smccurry		   	Initial release on production.
 * 1.04		  03 Sept 2014	  smccurry		   	Fixed multiple issues updated almost all of the code.
 * 1.05		  10 Sept 2014	  smccurry			Fixed 2014.2 issues and added a 'Delete' button.  returnauthorization is still not working for this version.
 * 1.05		  12 Sept 2014	  smccurry			Moved current version to Production.
 * 1.06		  09 Oct 2014	  smccurry  		Made changes to handle the new 1.9.1 update to the Piracle bundle
 * 
 * This creates an credit memo when the 'Approve and Create Refund' buttons is pressed
 * on a LOT (rma) or a LOT(Exchange Record).  It also creates a Piracle ACH file if payment
 * method is ACH.  As part of this process there is some validation done to
 * make sure the criteria are met to allow payment.  Also any bank or wire
 * routing numbers will be validated to make sure they are in the FEDAch Routing Codes
 * custom record or the Fedwire Routing Codes.  These two records help validate
 * routing numbers but they are only as accurate as they are kept up to date in NetSuite.
 * 
 * 
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
var msg = new ERROR_MESSAGES();

function processCreditMemoRefund(dataIn) {
	
	var responseObj = {};
	var resonseObj = dataIn;
	msg.setStatusSuccess();
	responseObj.msg = msg;
	
	if(dataIn.calltype == 'loadExRecData') {
		try {
			nlapiLogExecution('DEBUG', 'dataIn.calltype', dataIn.calltype);
//			responseObj = fetchLOTRecordData(dataIn);
			responseObj.test = 'testing return data';
			responseObj.calltype = 'exRecLoaded';
			return responseObj;
		} catch (e) {
			var err = e;
			nlapiLogExecution('DEBUG', 'error', JSON.stringify(err));
			msg.addMessage('Problem initiating function fetchLOTRecordData() in the Restlet processCreditMemoRefund()');
			msg.setStatusError();
			responseObj.msg = msg;
			
			return responseObj;
		}
	} else if(dataIn.calltype == 'startapproval') {
		try {
			nlapiLogExecution('DEBUG', 'dataIn.calltype', dataIn.calltype);
			responseObj = fetchLOTRecordData(dataIn);
//			responseObj.callbacktype = 'piraclecomplete';
//			responseObj.msg = msg;
			return responseObj;
		} catch (e) {
			var err = e;
			nlapiLogExecution('DEBUG', 'error', JSON.stringify(err));
			msg.addMessage('Problem initiating function fetchLOTRecordData() in the Restlet processCreditMemoRefund()');
			msg.setStatusError();
//			responseObj.msg = msg;
			return responseObj;
		}
	} else if(dataIn.calltype == 'createcreditmemo' && dataIn.txntype == 'customrecord_acq_lot') {
		// If this format works, then use it for the above.
		try {
			responseObj = copyPayInfoCreateCM(dataIn);
			if(responseObj.msg.returnMessages.length > 0) {
		    	responseObj.callbacktype = 'creditmemoerror';
		    	return responseObj;
		    } else {
		    	responseObj.msg = msg;
		    	responseObj.callbacktype = 'creditmemocomplete';
		    }
			return responseObj;
		} catch (e) {
			msg.addMessage('Problem with function copyPayInfoCreateCM() in the Restlet ACQ_LOT_DA_CreditMemoRefund_R.js');
			msg.setStatusError();
			responseObj.msg = msg;
			
			nlapiLogExecution('DEBUG', 'error', e.toString());
			
			return responseObj;
		}
	} else if(dataIn.calltype == 'createcreditmemo' && dataIn.txntype == 'returnauthorization') {
		try {
			responseObj.cmemo = transformRMAintoCM(dataIn);
			responseObj.callbacktype = 'creditmemocomplete';
			responseObj.msg = msg;
			return responseObj;
		} catch (e) {
			msg.addMessage('Problem with function transformRMAintoCM() in the Restlet ACQ_LOT_DA_CreditMemoRefund_R.js');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	} else if(dataIn.calltype == 'createrefund' && dataIn.txntype == 'customrecord_acq_lot') {
		try {
//			responseObj = transformCmemoToRefund(dataIn);
//			dataIn.
			responseObj = applyRefund(dataIn);
			responseObj.callbacktype = 'refundcomplete';
			responseObj.msg = msg;
			return responseObj;
		} catch (e) {
			msg.addMessage('Problem with function applyRefund() in the Restlet ACQ_LOT_DA_CreditMemoRefund_R.js');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	} else if(dataIn.calltype == 'updateexchangerec' && dataIn.txntype == 'customrecord_acq_lot') {
		try {
			var paymentComplete = updateExchangeRecRelatedFields(dataIn);
			responseObj.paymentComplete = paymentComplete;
			if(paymentComplete == true) {
				responseObj.callbacktype = 'paymentcomplete';
			} else {
				responseObj.callbacktype = 'exrecupdatefailed';
			}
			return responseObj;
		} catch (e) {
			msg.addMessage('Problem updating the exchange record with the credit memo and refund ids.  updateExchangeRecRelatedFields()');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	} else if(dataIn.calltype == 'deleteRefund' && dataIn.txntype == 'customrecord_acq_lot') {
		try {
			responseObj = unapplyDeleteCreditMemoAndRefund(dataIn);
			return responseObj;
		} catch (e) {
			msg.addMessage('Problem deleting the Customer Refund and the Credit Memo');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
	} else {
		msg.addMessage('The restlet had problems determining what to do with the dataIn.  Its possible the dataIn.calltype or dataIn.txntype were not set.');
		msg.setStatusError();
		responseObj.msg = msg;
		return responseObj;
	}
	return responseObj;
}

function fetchLOTRecordData(dataIn) {
	
	var responseObj = {};
	// Setup new error message object for error handling 
//	msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	responseObj.msg = msg;
	
	var recID = dataIn.txnid;
	var recType = dataIn.txntype;
	
	// Load the profile record which is used for setting the defaults, works with both the RMA LOT and the EX REC LOT
	var profileRec = nlapiLoadRecord('customrecord_acq_lot_profile', 1);
	
	var exRecID = null;
	var rmaRecID = null;
	var exRec = null;
	var rmaRec = null;
	var dealCustRec = null;
	var sHolderCustRec = null;
	if(recType == 'customrecord_acq_lot') {
		exRecID = recID;
		exRec = nlapiLoadRecord("customrecord_acq_lot", recID);
		dealCustRec = nlapiLoadRecord('customer', exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_deal'));
//		sHolderCustRec = nlapiLoadRecord('customer', exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_shareholder'));
	} else if(recType == 'returnauthorization') {
		rmaRecID = recID;
		rmaRec = nlapiLoadRecord("returnauthorization", recID);
		dealCustRec = nlapiLoadRecord('customer', rmaRec.getFieldValue('custbodyacq_deal_link'));
//		sHolderCustRec = nlapiLoadRecord('customer', rmaRec.getFieldValue('entity'));
	}
	/***************************************************************************************************
	 * CREATE OBJECT TO HOLD ALL OF THE FIELDS BEING PULLED OFF OF THE LOT AND SENT TO THE CREDIT MEMO;
	 * SET FIELDS COMMON TO BOTH RMA AND EXCH REC
	 * IF THERE IS ALREADY A 'lotFields' PASSED BY 'dataIn' use it.
	 ***************************************************************************************************/
	var lotFields = {};
	if(dataIn.lotFields) {
		lotFields = dataIn.lotFields;
		nlapiLogExecution('DEBUG', 'lotFields', lotFields.shareholder);
	}
	lotFields.createdFromExRec = exRecID;
	lotFields.createdFromRMA = rmaRecID;
	lotFields.customForm = 138;
	lotFields.status = 1;
	lotFields.shareholder = null;
	if(recType == 'customrecord_acq_lot') {
		lotFields.shareholder = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_shareholder');
	} else if(recType == 'returnauthorization') {
		lotFields.shareholder = rmaRec.getFieldValue('entity');
	}
	lotFields.aclass = 51;
	lotFields.dept = 20;// Put this in the profile
	// Pulled from the DEAL customer ticket, if any of these fees are not set, then throw an error message.
	if(dealCustRec.getFieldValue('custentity_acq_deal_lotach') != null) {
		lotFields.feeACH = dealCustRec.getFieldValue('custentity_acq_deal_lotach') || null;
	} else {
		msg.addMessage('\'ACH Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
	}
	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_domesticcheck') != null) {
		lotFields.feeCheckDom = dealCustRec.getFieldValue('custentity_qx_acq_deal_domesticcheck') || null;
	} else {
		msg.addMessage('\'Domestic Check Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
	}
	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_internationalchec') != null) {
		lotFields.feeCheckInt = dealCustRec.getFieldValue('custentity_qx_acq_deal_internationalchec') || null;
	} else {
		msg.addMessage('\'Domestic Wire Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
	}
	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_domesticwire') != null) { 
		lotFields.feeWireDom = dealCustRec.getFieldValue('custentity_qx_acq_deal_domesticwire') || null;
	} else {
		msg.addMessage('\'International Check Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
	}
	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_internationalwire') != null) {
		lotFields.feeWireInt = dealCustRec.getFieldValue('custentity_qx_acq_deal_internationalwire') || null;
	} else {
		msg.addMessage('\'International Wire Fee\' the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
	}
	
//	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_ach') != null) {
//		lotFields.feeAESACH = dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_ach') || null;
//	} else {
//		msg.addMessage('\'AES ACH Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_domestic_chck') != null) {
//		lotFields.feeAESDomCheck = dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_domestic_chck') || null;
//	} else {
//		msg.addMessage('\'AES Domestic Check Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_intl_check') != null) {
//		lotFields.feeAESIntlCheck = dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_intl_check') || null;
//	} else {
//		msg.addMessage('\'AES International Check Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_domestic_wire') != null) {
//		lotFields.feeAESDomWire = dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_domestic_wire') || null;
//	} else {
//		msg.addMessage('\'ACH Domestic Wire Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_intl_wire') != null) {
//		lotFields.feeAESIntlWire = dealCustRec.getFieldValue('custentity_qx_acq_deal_aes_intl_wire') || null;
//	} else {
//		msg.addMessage('\'AES International Wire Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
	
	if(dealCustRec.getFieldValue('custentity_qx_acq_deal_wirefeeswaived') != null) {
		lotFields.feeWaivedAmt = dealCustRec.getFieldValue('custentity_qx_acq_deal_wirefeeswaived') || null;
	} else {
		msg.addMessage('\'Wire Fees Waived if Greater Than\' under LOT FEES Group on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
	}
	if(msg.returnMessages.length > 0) {
    	msg.setStatusError();
    	lotFields.msg = msg; // Delete
    	responseObj.msg = msg;
    	responseObj.callbacktype = 'error';
    	return responseObj;
    };
	// Final funding / Payment approved
	lotFields.finalFunding = dealCustRec.getFieldValue('custentity_acq_finaldealapproval');
	
	if(recType == 'customrecord_acq_lot') {
		try{
			lotFields.recType = 'customrecord_acq_lot';
			lotFields.relatedTrans = exRec.getFieldValue('custrecord_acq_loth_related_trans') || null;
			// DEAL & SHAREHOLDER
			lotFields.lotStatus = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_acqstatus') || null;
			lotFields.deal = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_deal') || null;
			lotFields.shareholderHash = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_shrhldhash') || null;
			// DE1 FIELDS FROM EXCHANGE RECORD
			lotFields.de1Addr1 = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1') || null;
			lotFields.de1Addr2 = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2') || null;
			lotFields.de1City = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity') || null;
			lotFields.de1State = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldstate') || null;
			lotFields.de1Zip = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd') || null;
			lotFields.de1Country = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry') || null;
			lotFields.de1CountryText = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldcountry') || null;
			lotFields.de1Alterations = exRec.getFieldValue('custrecord_acq_loth_0_de1_alterations') || null;
			lotFields.de1ReviewNotes = exRec.getFieldValue('custrecord_acq_loth_0_de1_notes') || null;
			lotFields.de2Alterations = exRec.getFieldValue('custrecord_acq_loth_0_de2_alterations') || null;
			lotFields.de2ReviewNotes = exRec.getFieldValue('custrecord_acq_loth_0_de2_notes') || null;
			// LOT PAYMENT METHOD
			lotFields.payMethod = exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod') || null;
			lotFields.payMethodName = exRec.getFieldText('custrecord_acq_loth_4_de1_lotpaymethod') || null;
			lotFields.cleanedPayMethodName = cleanPayMethodName(lotFields.payMethodName) || null;
			// ACH BANK INFO FROM EXCHANGE RECORD
			lotFields.bankabaRouting = exRec.getFieldValue("custrecord_acq_loth_5a_de1_abaswiftnum") || null;
			lotFields.bankAccount = exRec.getFieldValue("custrecord_acq_loth_5a_de1_bankacctnum") || null;
			lotFields.bankabaVerified = false;
			lotFields.bankabaName = '';
			lotFields.bankAcctType = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankaccttype') || null;
			lotFields.bankNamesOn = exRec.getFieldValue('custrecord_acq_loth_5a_de1_nameonbnkacct') || null;
			lotFields.bankName = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankname') || null;
			lotFields.bankAddr1 = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankaddr') || null;
			lotFields.bankCity = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankcity') || null;
			lotFields.bankState = exRec.getFieldText('custrecord_acq_loth_5a_de1_bankstate') || null;
			lotFields.bankZip = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankzip') || null;
			lotFields.bankContactName = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankcontact') || null;
			lotFields.bankContactPhone = exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankphone') || null;
			// WIRE BANK INFO
			lotFields.wirebankNamesOn = exRec.getFieldValue('custrecord_acq_loth_5b_de1_nameonbnkacct') || null;
			lotFields.wirebankAccount = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankacctnum') || null;
			lotFields.wirebankabaRouting = exRec.getFieldValue('custrecord_acq_loth_5b_de1_abaswiftnum') || null;
			lotFields.wirebankName = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankname') || null;
			lotFields.wirebankAddr1 = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankaddr') || null;
			lotFields.wirebankCity = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcity') || null;
			lotFields.wirebankState = exRec.getFieldText('custrecord_acq_loth_5b_de1_bankstate') || null;
			lotFields.wirebankZip = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankzip') || null;
			lotFields.wirebankContactName = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcontact') || null;
			lotFields.wirebankContactPhone = exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankphone') || null;
			lotFields.wirebankFurtherAcct = exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtacct') || null;
			lotFields.wirebankFurtherName = exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtname') || null;
			// PAYEE ADDRESS FROM EXCHANGE RECORD
			lotFields.payAddr1 = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1') || null;
			lotFields.payAddr2 = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2') || null; 
			lotFields.payCity = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity') || null;
			lotFields.payState = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldstate') || null;
			lotFields.payZip = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd') || null;
			lotFields.payPhone = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone') || null;
			lotFields.payCountry = exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry') || null;
			// CHECK MAIL ADDRESS FROM EXCHANGE RECORD
			lotFields.checkAddr1 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr1') || null;
			lotFields.checkAddr2 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr2') || null;
			lotFields.checkCity = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscity') || null; 
			lotFields.checkState = exRec.getFieldText('custrecord_acq_loth_5c_de1_checksstate') || null;
			lotFields.checkZip = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkszip') || null;
			lotFields.checkCountry = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscountry') || null;
			lotFields.checkCountryText = exRec.getFieldText('custrecord_acq_loth_5c_de1_checkscountry') || null;
			lotFields.checkPayTo = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkspayto') || null;
			lotFields.checkMailTo = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksmailto') || null;
			
			responseObj.lotFields = lotFields;
		} catch (e) {
			var err = e;
			nlapiLogExecution('DEBUG', 'lotFields', JSON.stringify(err));
			msg.addMessage('Problem setting the fields on lotFields object.');
			msg.setStatusError();
			responseObj.msg = msg;
			responseObj.lotFields = lotFields;
			responseObj.callbacktype = 'error';
			return responseObj;
		}
	}
	if(recType == 'returnauthorization') {
		nlapiLogExecution('DEBUG', 'in returnauthorization', JSON.stringify(lotFields));
		lotFields.recType = 'returnauthorization';
		// DEAL & SHAREHOLDER
//		lotFields.lotStatus = rmaRec.getFieldValue('') || null;
		lotFields.deal = rmaRec.getFieldValue('custbodyacq_deal_link') || null;
//		lotFields.shareholderHash = rmaRec.getFieldValue('') || null;
		lotFields.de1Alterations = rmaRec.getFieldValue('custbody_acq_1_legaltextnoexceptions');
		lotFields.de2Alterations = rmaRec.getFieldValue('custbody_acq_2_legaltextnoexceptions');
		
		// BOX A is mapped to de1 so that I can use the same object
		lotFields.de1Addr1 = rmaRec.getFieldValue('custbody_acq_boxa_name') || null;
		lotFields.de1Addr1 = rmaRec.getFieldValue('custbody_acq_boxa_address1') || null;
		lotFields.de1Addr2 = rmaRec.getFieldValue('custbody_acq_boxa_address2') || null;
		lotFields.de1Addr1City = rmaRec.getFieldValue('custbody_acq_boxa_city') || null;
		lotFields.de1State = rmaRec.getFieldText('custbody_acq_boxa_state') || null;
		lotFields.de1Zip = rmaRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd') || null;
		lotFields.de1Country = rmaRec.getFieldValue('custbody_acq_boxa_country') || null;
		lotFields.de1Email = rmaRec.getFieldValue('custbody_acq_boxa_email') || null;
		lotFields.de1Phone = rmaRec.getFieldValue('custbody_acq_boxa_telephone') || null;
		// AQM_1
		lotFields.payMethod = rmaRec.getFieldValue('custbody_acq_lot_payment_method_3') || null;
		lotFields.bankabaRouting = rmaRec.getFieldValue("custbody_aqm_1_abaroutingnumber") || null;
		lotFields.bankAccount = rmaRec.getFieldValue("custbody_aqm_1_bankaccountnumber") || null;
		lotFields.bankabaVerified = false;
		lotFields.bankabaName = ''; // Filled in by search later.
		lotFields.bankAcctType = rmaRec.getFieldValue('custbody_aqm_1_accounttype') || null;
		lotFields.bankNamesOn = rmaRec.getFieldValue('custbody_aqm_1_namesonbankaccount') || null;
		lotFields.bankName = rmaRec.getFieldValue('custbody_aqm_1_bankname') || null;
		lotFields.bankAddr1 = rmaRec.getFieldValue('custbody_aqm_1_bankaddress') || null;
		lotFields.bankCity = rmaRec.getFieldValue('custbody_aqm_1_bankaddresscity') || null;
		lotFields.bankState = rmaRec.getFieldText('custbody_aqm_1_bankaddressstate') || null;
		lotFields.bankZip = rmaRec.getFieldValue('custbody_aqm_1_bankaddresszip') || null;
		lotFields.bankContactName = rmaRec.getFieldValue('custbody_aqm_1_nameofbankcontactperson') || null;
		lotFields.bankContactPhone = rmaRec.getFieldValue('custbody_aqm_1_phonenumberofbankcontac') || null;
		lotFields.bankFurtherAcct = rmaRec.getFieldValue('custbody_aqm_1_forfurthercreditaccount') || null;
//		lotFields.bankFurtherName = rmaRec.getFieldValue('custbody_aqm_1_2forfurthercreditaccoun') || null;
//		
		// PAYEE ADDRESS FROM RETURN AUTHORIZATION
		lotFields.payName = rmaRec.getFieldValue('custbody_acq_boxe_name') || null;
		lotFields.payAddr1 = rmaRec.getFieldValue('custbody_acq_boxe_address1') || null;
		lotFields.payAddr2 = rmaRec.getFieldValue('custbody_acq_boxe_address2') || null; 
		lotFields.payCity = rmaRec.getFieldValue('custbody_acq_boxe_city') || null;
		lotFields.payState = rmaRec.getFieldText('custbody_acq_boxe_state') || null;
		lotFields.payZip = rmaRec.getFieldValue('custbody_acq_boxe_postal') || null;
//		lotFields.payPhone = rmaRec.getFieldValue('') || null;
//		lotFields.payCountry = rmaRec.getFieldValue('') || null;
//		// BOX 5A
		
//		// CHECK MAIL ADDRESS FROM EXCHANGE RECORD
//		lotFields.checkAddr1 = rmaRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr1') || null;
//		lotFields.checkAddr2 = rmaRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr2') || null;
//		lotFields.checkCity = rmaRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscity') || null; 
//		lotFields.checkState = rmaRec.getFieldText('custrecord_acq_loth_5c_de1_checksstate') || null;
//		lotFields.checkZip = rmaRec.getFieldText('custrecord_acq_loth_5c_de1_checkszip') || null;
//		lotFields.checkCountry = rmaRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscountry') || null;
	}
//	responseObj.msg = msg;
//	responseObj.lotFields = lotFields;

	/*****************************************************************************************************
	 * REQUIREMENTS THAT MUST BE MET FOR A CREDIT MEMO TO BE CREATED IN THIS SECTION
	 * IF THE REQUIREMENT IS NOT MET, RETURN AN ERROR MESSAGE THAT HELPS DETERMINE WHAT SHOULD BE DONE
	 * 
	 *****************************************************************************************************/
	if(lotFields.payMethod == null) {
		msg.addMessage('\"LOT Pay Method\" is not selected.');
	}
	if(recType == 'customrecord_acq_lot') {
		if(lotFields.lotStatus != 5) {
			msg.addMessage('\"Acquiom Status\" is not set to \'5. Approved for Payment\'.');
		}
		var certSearchResults = searchRelatedCerts(exRecID);
		if(certSearchResults == null) {
			msg.addMessage('No certificates are found attached to this exchange record.');
		}
		if(certSearchResults != null) {
			for(var cLoop = 0; cLoop < certSearchResults.length; cLoop++) {
				oneResult = certSearchResults[cLoop];
				var certLineStatus = oneResult.getValue('custrecord_acq_lotce_zzz_zzz_lotcestatus');
				if(certLineStatus != 5 && certLineStatus != 7) {
					msg.addMessage('A Certificate attached does not have the correct \"LOT Certificate Line Status\".  Must be either \'Buyer Agreement\' or \'No Certificate Needed\'.');
				}
			}
		}
	}
	// Check to make sure there are certificates attached to this exchange record.  This only works on RMA.
	if(recType == 'returnauthorization') {
		if(rmaRec.getLineItemCount('item') == 0) {
			msg.addMessage('There are no certificates attached to this Return Authorization.  It cannot be processed.');
		}
	}
	if(lotFields.finalFunding == 'F') {
		msg.addMessage('\"Deal Approved for Payments\" is not checked on the Deal - Acquiom Ticket tab.');
	}
	if(msg.returnMessages.length > 0) {
    	msg.setStatusError();
//    	lotFields.msg = msg; // Delete
    	responseObj.lotFields = lotFields;
    	responseObj.msg = msg;
    	responseObj.callbacktype = 'error';
    	return responseObj;
    };
	if(lotFields.cleanedPayMethodName == 'ach' || lotFields.cleanedPayMethodName == 'aes_ach') {
		var results = searchACHBankName(lotFields.bankabaRouting);
		if(results == null || results == '') {
			msg.addMessage('Could not verify ACH Routing number from SRS database.');
		} else {
//			lotFields.bankabaName = results[0].getField('custrecord168'); // custrecord168 is the Bank Name
			lotFields.bankabaVerified = true;
		}
	}
	if(lotFields.cleanedPayMethodName == 'domestic_wire' 
		|| lotFields.cleanedPayMethodName == 'international_wire'
		|| lotFields.cleanedPayMethodName == 'aes_domestic_wire' 
		|| lotFields.cleanedPayMethodName == 'aes_international_wire') {
		var isAbaNumber = determineABAorSWIFT(lotFields.wirebankabaRouting);
		if(isAbaNumber) {
			var results = searchWireBankName(lotFields.wirebankabaRouting);
			if(results == null || results == '') {
				msg.addMessage('Could not verify Wire Routing number from SRS database.');
			} else {
				lotFields.wirebankabaVerified = true;
			}
		} else {
			lotFields.wirebankabaVerified = false;
		}
	}
	// Legal Text Review, Alterations, Review Notes
	if(lotFields.de1Alterations == '1') {
		msg.addMessage('DE1 Alterations is set to YES. (custrecord_acq_loth_0_de1_alterations)');
	}
	if(lotFields.de2Alterations == '1') {
		msg.addMessage('DE2 Alterations is set to YES. (custrecord_acq_loth_0_de1_alterations)');
	}
	if(msg.returnMessages.length > 0) {
    	msg.setStatusError();
//    	lotFields.msg = msg; // Delete
    	responseObj.lotFields = lotFields;
    	responseObj.msg = msg;
    	responseObj.callbacktype = 'error';
    	return responseObj;
    };
    responseObj.lotFields = lotFields;
    var piracle = {};
// ATP-1981 Commented out
//	//  If Lot Pay Method = ACH (1) then search for a Piracle Pay Record
//	if(lotFields.cleanedPayMethodName == 'ach' || lotFields.cleanedPayMethodName == 'aes_ach') {
//			try {
//				piracle = searchPiracleACHrecords(lotFields.shareholder, lotFields.bankAccount, lotFields.bankabaRouting, lotFields.bankAcctType);
//			} catch(e) {
//				msg.addMessage('Search Piracle ACH record failed.');
//			    msg.setStatusError();
//			    responseObj.lotFields = lotFields;
//			    responseObj.msg = msg;
//			    responseObj.callbacktype = 'error';
//			    return responseObj;
//			}
//		if(piracle == null) {
//			try {
//				piracle = createPiraclePayACHRecord(lotFields);
//			} catch (e) {
//				msg.addMessage('Unable to create Piracle ACH record.');
//			    msg.setStatusError();
//			    
//			    responseObj.lotFields = lotFields;
//			    responseObj.msg = msg;
//			    responseObj.callbacktype = 'error';
//			    return responseObj;
//			}
//		}
//	} 
	responseObj.piracle = piracle;
	responseObj.lotFields = lotFields;
	responseObj.msg = msg;
	responseObj.txnid = recID;
	responseObj.txntype = recType;
	responseObj.feeOverride = dataIn.feeOverride;
	responseObj.callbacktype = 'piraclecomplete';
	return responseObj;
}

function copyPayInfoCreateCM(dataIn) {
	var responseObj = dataIn;
	// Setup new error message object for error handling 
//	msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	responseObj.msg = msg;
	var profileRec = nlapiLoadRecord('customrecord_acq_lot_profile', 1);
	var exRecID = dataIn.txnid;
	var lotFields = dataIn.lotFields;
	
	if (exRecID != null) {
		// TODO: (smccurry 06/14/14) Do the routing number verification here.  Change the message.
//		if(lotFields.payMethod == 1) {
//			var results = searchACHBankName(lotFields.bankabaRouting);
//			msg.addMessage('There may be a problem with bank routing number.');
//		}
		// If any errors by this point go ahead and return.
		
	    // Create the credit memo here, and fill in fields starting with the custbody fields
		//var cMemoExist = searchCreditMemosFromExRec(exRecID); //TODO: Remove
		//var cMemoExist = lotFields.relatedTrans ? getCreditMemoById(lotFields.relatedTrans) : null;
		var cMemoExist = lotFields.relatedTrans && lotFields.relatedTrans != ' ' ? lotFields.relatedTrans : null;
		
		//TODO: Remove code below
		/*if(cMemoExist != null && cMemoExist.length > 0) {
			for(var cmLoop = 0; cmLoop < cMemoExist.length; cmLoop++) {
				msg.addMessage('Credit Memo #' + cMemoExist[cmLoop].getValue('tranid') + ' already exists.');
			}
		}*/
		
		if(cMemoExist){
			msg.addMessage('Credit Memo #' + lotFields.relatedTrans + ' already exists');
		}
		
		if(msg.returnMessages.length > 0) {
	    	msg.setStatusError();
	    	responseObj.lotFields = lotFields;
	    	responseObj.msg = msg;
			return responseObj;
	    };
	    
	    // IF THERE ARE NO CREDIT MEMOS FOUND THEN CREATE A NEW CREDIT MEMO.
		var cMemo = nlapiCreateRecord('creditmemo', {recordmode: 'dynamic'}); //, {recordmode: 'dynamic', customform: 138}

		//Set the form template to use
		cMemo.setFieldValue('customform', lotFields.customForm); //133
		cMemo.setFieldValue('entity', lotFields.shareholder);
		cMemo.setFieldValue('status', lotFields.status); // 1
		cMemo.setFieldValue('class', lotFields.aclass); //46
		// PAYMENT SUB TAB
//		cMemo.setFieldValue('custbody_acq_lot_payment_method', lotFields.payMethod);
//		cMemo.setFieldValue('custbody_acq_lot_payment_method_2', lotFields.payMethod);
//		cMemo.setFieldValue('custbody_acq_lot_payment_method_3', lotFields.payMethod);
		// DEAL TRACKING GROUP
		cMemo.setFieldValue('custbodyacq_deal_link', lotFields.deal);
		cMemo.setFieldValue('custbody_acq_shash', lotFields.shareholderHash);
		cMemo.setFieldValue('custbody_acq_lot_createdfrom_exchrec', exRecID);
		cMemo.setFieldValue('department', lotFields.dept);
		cMemo.setFieldValue('custbody_acq_finalfunding', lotFields.finalFunding);
		
//		if(exRec.getFieldValue('') == 'F') { TODO: (smccurry 05/05/14) Need to find field for the final funding checkbox and finish these lines of code.  Not currently on the Exchange Record.
//			msg.addMessage('Could not determine final funding');
//		}
//		cMemo.setFieldValue('status', 'F');
//		cMemo.setFieldValue('entity', lotFields.shareholder);
		// If there are any errors at this point, do not continue and return the error messages.
		if(msg.returnMessages.length > 0) {
			msg.setStatusError();
			responseObj.lotFields = lotFields;
			responseObj.msg = msg;
			return responseObj;
		};
		/* Grab the native NetSuite 'States' list (NOT 'State List') and create an array so that it can be reference by name and not number.
		*  This is needed because there are two different list for states and internal ids do not match
		*/
		var statesJSON = profileRec.getFieldValue('custrecord_acq_lot_state_list_map');
		var statesReference = JSON.parse(statesJSON);
		var stateListrec = nlapiLoadRecord('customrecord_states', 1);
		var statesNative = stateListrec.getField('custrecord_state_netsuite');
		var states = statesNative.getSelectOptions();
		var stateRef = [];
//		var stateKeyValues = [];// temp to get an array of the values so this list can be saved to a field
		for(sLoop in states) {
			var currentID = states[sLoop].id;
			var currentText = states[sLoop].text;
			stateRef[currentText] = currentID;
//			stateKeyValues.push(currentText + '_' + currentID);
		}
//		Used for pushing to these values to the profile
//		profile.setFieldText('custrecord_acq_lot_state_list_mapping', stateKeyValues.toString());
//		nlapiSubmitRecord(profile);
		
			/* Create line items on the Credit Memo for certificates and fees.  Keep track of total balance with lineItemTotal
			*  because if the credit memo is negative it will not submit.  If fees are greater than the payout, return an error.
			*/
			var lineItemTotal = 0.00;
			lineItemTotal = parseFloat(lineItemTotal);
			var certSearchResults = searchRelatedCerts(exRecID);
			for (var sLoop = 0; certSearchResults != null && sLoop < certSearchResults.length; sLoop++){
	        	var certItemRow = certSearchResults[sLoop];
//	        	var certNumShares = certItemRow.getValue('custrecord_acq_lotce_3_de1_numbershares');
	        	var certDescription = certItemRow.getValue('custrecord_acq_lotce_3_de1_certdesc');
	        	var certPayAmount = certItemRow.getValue('custrecord_acq_lotce_zzz_zzz_payment');
	        	
	        	// THIS REQUIRES CERTIFICATES TO HAVE AN AMOUNT, OR THROWS AN ERROR AND BAILS OUT.  AMOUNT CAN BE 0.00 BUT NOT EMPTY OR NULL
	        	if(certPayAmount == null || certPayAmount == '') {
					msg.addMessage('Unable to commit line item on the Credit Memo because the certPayAmount is null or empty on the Certificate record with ID ' + certSearchResults[sLoop].getId());
					msg.setStatusError();
					responseObj.lotFields = lotFields;
					responseObj.msg = msg;
					return responseObj;
	        	}

	        	// THIS REQUIRES CERTIFICATES TO HAVE A DESCRIPTION, OR THROWS AN ERROR AND BAILS OUT. PROBABLY OK TO LEAVE DESCRIPTION BLANK
//	        	if(certDescription == null || certDescription == '') {
//					msg.addMessage('Unable to commit line item on the Credit Memo because the certDescription is null or empty on the Certificate record with ID ' + certSearchResults[sLoop].getId());
//					msg.setStatusError();
//					responseObj.lotFields = lotFields;
//					responseObj.msg = msg;
//					return responseObj;
//	        	}
	        	if(certPayAmount != null || certPayAmount != '') {
	        		lineItemTotal += parseFloat(certPayAmount);
	        	}
	        	var certNumber = certItemRow.getValue('custrecord_acq_lotce_3_de1_certnumber');
	        	cMemo.selectNewLineItem('item');
	        	cMemo.setCurrentLineItemValue('item', 'item', profileRec.getFieldValue('custrecord_acq_lot_cmemo_share_line_item')); //261
	        	cMemo.setCurrentLineItemValue('item', 'quantity', 1 );
	        	cMemo.setCurrentLineItemValue('item', 'description', certDescription );
	        	cMemo.setCurrentLineItemValue('item', 'custcol_acq_certnum', certNumber );
	        	cMemo.setCurrentLineItemValue('item', 'amount', certPayAmount);
	        	cMemo.setCurrentLineItemValue('item', 'rate', certPayAmount);
	        	cMemo.setCurrentLineItemValue('item', 'class', profileRec.getFieldValue('custrecord_acq_lot_cmemo_entity')); //51
	        	cMemo.commitLineItem('item');
			}
			
			// Add Line Item Processing Fees pulled from the Deal record
			var fee = 0.00;
			var negativeBalance = false;
			var testNegBal = function(lineItemTotal, fee) { if((lineItemTotal + fee) < 0) { return true; } else { return false; } };
			var isOverride = dataIn.feeOverride != 'false';
			var feeOverride = isOverride ? parseFloat(dataIn.feeOverride) : 0;
			
			//TODO: Clean up switch statement
			switch (lotFields.cleanedPayMethodName) {
			    case "ach": //Add ACH Fee
					fee = -Math.abs(isOverride ? feeOverride : lotFields.feeACH);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "aes_ach": //Add ACH Fee
					fee = -Math.abs(isOverride ? feeOverride : lotFields.feeAESACH);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "domestic_check": // Add Domestic Check
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeCheckDom);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "aes_domestic_check": // Add Domestic Check
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeAESDomCheck);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "international_check":
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeCheckInt);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "aes_international_check":
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeAESIntlCheck);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "domestic_wire":
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeWireDom);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "aes_domestic_wire":
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeAESDomWire);			    	
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "international_wire":
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeWireInt);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			    case "aes_international_wire":
			    	fee = -Math.abs(isOverride ? feeOverride : lotFields.feeAESIntlWire);
					if(testNegBal(lineItemTotal, fee) == false) {
						fee = addLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
					}
					break;
			}
			
//			if((lineItemTotal + fee) < 0) {
//				negativeBalance = true;
//			}
			if((lineItemTotal + fee) < 0 && (lotFields.cleanedPayMethodName == 'domestic_wire' || lotFields.cleanedPayMethodName == 'international_wire')) {
				msg.addMessage('Unable to process this transaction because it would create a negative balance.</p><p>The total certificate proceeds are $' + lineItemTotal + '.<p>The bank transaction fees are $' + fee + '.');
				msg.setStatusError();
				responseObj.lotFields = lotFields;
				responseObj.msg = msg;
				return responseObj;
			}
			
			if(msg.returnMessages.length > 0) {
				msg.setStatusError();
				responseObj.lotFields = lotFields;
				responseObj.msg = msg;
				return responseObj;
			};
			
			/****************************************************************************************************
			 * POPULATE THE 'PAYMENT INFORMATION' TAB ON THE CREDIT MEMO
			 ****************************************************************************************************/
			
			// SET THE PAYMENT INFORMATION TAB
		    switch (lotFields.cleanedPayMethodName) {
		    
		    	case "aes_ach":
			    case "ach": //ACH
					// PAYMENT SUB TAB
					// ACH-WIRE INFORMATION GROUP
					cMemo.setFieldValue('custbody_aqm_1_abaroutingnumber', lotFields.bankabaRouting || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', lotFields.bankAccount || null);
					cMemo.setFieldValue('custbody_aqm_1_accounttype', lotFields.bankAcctType || null);
					cMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', lotFields.bankNamesOn || null);
					cMemo.setFieldValue('custbody_aqm_1_bankname', lotFields.bankName || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddress', lotFields.bankAddr1 || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddresscity', lotFields.bankCity || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[lotFields.bankState] || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddresszip', lotFields.bankZip || null);
					cMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', lotFields.bankContactName || null);
					cMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', lotFields.bankContactPhone || null);
					cMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', lotFields.bankFurtherAcct || null);
					cMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', lotFields.bankFurtherName || null);
					cMemo.setFieldValue('custbody_acq_lot_payment_method_3', 1);
					//
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.payAddr1 || null);
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.payAddr2 || null);
					cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.payCity || null);
					cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.payState] || null);
					cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.payZip || null);
					cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', lotFields.payPhone || null);
					cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.payCountry || null);
					break;	
			    
			    case "aes_domestic_check":
			    case "domestic_check":  //Domestic Check
			    	// Check a few fields to make sure this is a complete enough address to use, if not then use DE1 (Form 1) fields for the address on check
			    	if(lotFields.checkAddr1 != null && lotFields.checkAddr2 != null && lotFields.checkState != null && lotFields.checkZip != null) {
			    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.checkAddr1 || null);
						cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.checkAddr2 || null);
						cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.checkCity || null);
						cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.checkState] || null);
						cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.checkZip || null);
						cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.checkCountry || null);
						cMemo.setFieldValue('custbody_acq_lot_payment_method_3', 2);
			    	} else {
			    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.de1Addr1 || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.de1Addr2 || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.de1City || null);
						cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.checkState] || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.de1Zip || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.de1Country || null);
			    		cMemo.setFieldValue('custbody_acq_lot_payment_method_3', 2);
			    	}
	//		    	// These two fields should be the same for regardless of the above address choice
	//		    	cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
	//		    	cMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
					break;
			    case "aes_international_check":	    
			    case "international_check": //International Check
			    	// Check a few fields to make sure this is a complete enough address to use, if not then use DE1 (Form 1) fields for the address on check
			    	if(lotFields.checkAddr1 != null && lotFields.checkAddr2 != null && lotFields.checkState != null && lotFields.checkZip != null) {
			    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.checkAddr1 || null);
						cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.checkAddr2 || null);
						cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.checkCity || null);
						cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.checkState] || null);
						cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.checkZip || null);
						cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.checkCountry || null);
						cMemo.setFieldValue('custbody_acq_lot_payment_method_3', 3);
			    	} else {
			    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.de1Addr1 || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.de1Addr2 || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.de1City || null);
						cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.checkState] || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.de1Zip || null);
			    		cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.de1Country || null);
			    		cMemo.setFieldValue('custbody_acq_lot_payment_method_3', 3);
			    	}
	//		    	// These two fields should be the same for regardless of the above address choice
	//		    	cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
	//		    	cMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
					break;
			    case "aes_domestic_wire":
			    case "domestic_wire": //Domestic Wire
			    	cMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', lotFields.wirebankNamesOn || null);
			    	cMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', lotFields.wirebankAccount || null);
					cMemo.setFieldValue('custbody_aqm_1_swiftiban', lotFields.wirebankabaRouting || null);
					cMemo.setFieldValue('custbody_aqm_1_bankname', lotFields.wirebankName || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddress', lotFields.wirebankAddr1 || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddresscity', lotFields.wirebankCity || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[lotFields.wirebankState] || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddresszip', lotFields.wirebankZip || null);
					cMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', lotFields.wirebankContactName || null);
					cMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', lotFields.wirebankContactPhone || null);
					cMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', lotFields.wirebankFurtherAcct || null);
					cMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', lotFields.wirebankFurtherName || null);
					cMemo.setFieldValue('custbody_acq_lot_payment_method_3', 4);
					//Payee Group
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.payAddr1 || null);
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.payAddr2 || null);
					cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.payCity || null);
					cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.payState] || null);
					cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.payZip || null);
					cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', lotFields.payPhone || null);
					cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.payCountry || null);
			    	break;
			    case "aes_international_wire":	
			    case "international_wire": //International Wire
			    	cMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', lotFields.wirebankNamesOn || null);
			    	cMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', lotFields.wirebankAccount || null);
					cMemo.setFieldValue('custbody_aqm_1_swiftiban', lotFields.wirebankabaRouting || null);
					cMemo.setFieldValue('custbody_aqm_1_bankname', lotFields.wirebankName || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddress', lotFields.wirebankAddr1 || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddresscity', lotFields.wirebankCity || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[lotFields.wirebankState] || null);
					cMemo.setFieldValue('custbody_aqm_1_bankaddresszip', lotFields.wirebankZip || null);
					cMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', lotFields.wirebankContactName || null);
					cMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', lotFields.wirebankContactPhone || null);
					cMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', lotFields.wirebankFurtherAcct || null);
					cMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', lotFields.wirebankFurtherName || null);
					cMemo.setFieldValue('custbody_acq_lot_payment_method_3', 5);
					//Payee Group
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.payAddr1 || null);
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.payAddr2 || null);
					cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.payCity || null);
					cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.payState] || null);
					cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.payZip || null);
					cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', lotFields.payPhone || null);
					cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.payCountry || null);
			    	break;
		    }
			
		    try {
		    	var cMemoID = nlapiSubmitRecord(cMemo);
		    	var cmemo = {};
		    	cmemo.id = cMemoID;
		    	cmemo.tranid = nlapiLookupField('creditmemo', cMemoID, 'tranid');
		    	responseObj.cmemo = cmemo;
		    	responseObj.lotFields = lotFields;
		    	var okContinue = updateExchangeRecRelatedFields(responseObj);
		    	if(okContinue) {
		    		return responseObj;
		    	} else {
		    		msg.addMessage('Problem updating the Exchange Record with the Credit Memo link in the field "custrecord_acq_loth_related_trans".');
					msg.setStatusError();
					responseObj.msg = msg;
					return responseObj;
		    	}
		    } catch (e) {
		    	var err = e;
		    	msg.setStatusError();
				msg.addMessage(e);
				responseObj.msg = msg;
				responseObj.lotFields = lotFields;
				responseObj.feeOverride = dataIn.feeOverride;
				responseObj.callbacktype = 'error';
				return responseObj;
		    	nlapiLogExecution('DEBUG', 'Credit Memo Submit FAILED', JSON.stringify(err));
		    }
	}
	return responseObj;
}

/*function cleanPayMethodName(paymethod){
	if(!paymethod){ return null; }
	
	return paymethod.trim().replace(/[^a-z0-9A-Z\s]/g, '').replace(/\s/g, '_').toLowerCase();
}*/

function updateExchangeRecRelatedFields(dataIn) {
	var responseObj = {};
	// Setup new error message object for error handling 
	msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	responseObj.msg = msg;
	
	var exRecID = dataIn.txnid;
	var cmemo = dataIn.cmemo;
	var custRefund = dataIn.custRefund;
	var skipCustRefund = dataIn.skip;
	
	var fields = new Array();
	var values = new Array();
	
	if(cmemo != null && cmemo != '') {
		fields.push('custrecord_acq_loth_related_trans');
		values.push(cmemo.id);
	}
	if( !skipCustRefund && custRefund != null && custRefund != '') {
		fields.push('custrecord_acq_loth_related_refund');
		values.push(custRefund.id);
	}
	if(fields.length > 0 && values.length > 0) {
		var updatefields = nlapiSubmitField('customrecord_acq_lot', dataIn.txnid, fields, values);
		if(updatefields != null && updatefields != '') {
			return true;
		}
	} else {
		return false;
	}
}

function transformRMAintoCM(dataIn) {
	var responseObj = {};
	// Setup new error message object for error handling 
	msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	responseObj.msg = msg;
	var lotFields = dataIn.lotFields;
	var profileRec = nlapiLoadRecord('customrecord_acq_lot_profile', 1);
	try {
//		nlapiTriggerWorkflow('returnauthorization', dataIn.txnid, 'customworkflow_acq_cmc_2');
		var cmemoFields = new Array();
		cmemoFields.recordmode = 'dynamic';
		cmemoFields.customform = lotFields.customForm;
		// Setting these fields may cause nlapiTransformRecord to fail.
//		cmemoFields.status = lotFields.status;
//		cmemoFields.department = lotFields.dept;
//		cmemoFields.custbody_acq_finalfunding = 'T';
////		cmemoFields.class = lotFields.aclass;
//		cmemoFields.entity = lotFields.shareholder;
//		cmemoFields.custbodyacq_deal_link = lotFields.deal;
//		cmemoFields.custbody_acq_lot_payment_method = lotFields.payMethod;
		
		var cmemo = nlapiTransformRecord('returnauthorization', dataIn.txnid, 'creditmemo', cmemoFields);
//		cmemo.setFieldValue('custbody_acq_finalfunding', lotFields.finalFunding);
		try {
			var cMemoID = nlapiSubmitRecord(cmemo, null, true);
			responseObj.cMemoID = cMemoID;
		} catch (e) {
			var err = e;
			nlapiLogExecution('ERROR', 'Failed to nlapiSubmitRecord and nlapiTranformRecord from RMA to Credit Memo. Code DA_897');
    		msg.addMessage('Failed to nlapiSubmitRecord and nlapiTranformRecord from RMA to Credit Memo. Code DA_897.');
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		}
		// TRY RELOAD THE CREDIT MEMO THAT WAS CREATED AND TRY TO SET THE FIELD VALUES
		try {

			var newCreditMemo = nlapiLoadRecord('creditmemo', responseObj.cMemoID);
			var tranID = newCreditMemo.getFieldValue('tranid');
			responseObj.tranID = tranID;
			newCreditMemo.setFieldValue('custbody_acq_finalfunding', 'T');
			
			/* Create line items on the Credit Memo for certificates and fees.  Keep track of total balance with lineItemTotal
			*  because if the credit memo is negative it will not submit.  If fees are greater than the payout, return an error.
			*/
			var lineItemTotal = 0.00;
			var lineItemCount = newCreditMemo.getLineItemCount('item');
			for (var sLoop = 1; lineItemCount != null && sLoop <= lineItemCount; sLoop++){
				newCreditMemo.selectLineItem('item', sLoop);
	        	lineItemTotal += newCreditMemo.getCurrentLineItemValue('item', 'amount');
			}
			var fee = determineBankFee(lotFields, lineItemTotal);
			
			var negativeBalance = false;
			if((lineItemTotal + fee) < 0) {
				negativeBalance = true;
			}
			if((lineItemTotal + fee) < 0 && lotFields.cleanedPayMethodName == 'domestic_wire' || lotFields.cleanedPayMethodName == 'international_wire') {
				msg.addMessage('Credit Memo <a href="'+nlapiResolveURL('RECORD', 'creditmemo', cMemoID, 'VIEW')+'">'+ tranID +'</a> needs to be fixed.</p><p>The total certificate proceeds are $' + lineItemTotal + '.<p>The bank transaction fees are $' + fee + '.');
				msg.setStatusError();
				responseObj.msg = msg;
				return responseObj;
			}
			// Add Line Item Processing Fees pulled from the Deal record
			if(lotFields.cleanedPayMethodName == 'ach') { //Add the ACH Fee
				fee = addLineItemFee(178, fee, newCreditMemo);
			}
			if(lotFields.cleanedPayMethodName == 'domestic_check' && negativeBalance == false) { //Add the Domestic Check Fee
				fee = addLineItemFee(179, fee, newCreditMemo);
			}
			if(lotFields.cleanedPayMethodName == 'international_check' && negativeBalance == false) { //Add the International Check Fee
				fee = addLineItemFee(182, fee, newCreditMemo);
			}
			if(lotFields.cleanedPayMethodName == 'domestic_wire') { //Add the Domestic Wire Fee
				fee = addLineItemFee(180, fee, newCreditMemo);
			}
			if(lotFields.cleanedPayMethodName == 'international_wire') { //Add the International Wire Fee
				fee = addLineItemFee(183, fee, newCreditMemo);
			}
			if(msg.returnMessages.length > 0) {
				msg.setStatusError();
				responseObj.msg = msg;
				return responseObj;
			};
			
			/****************************************************************************************************
			 * POPULATE THE 'PAYMENT INFORMATION' TAB ON THE CREDIT MEMO
			 ****************************************************************************************************/
			// BUILD THE STATE LIST FIRST
			
			var stateListrec = nlapiLoadRecord('customrecord_states', 1);
			var statesNative = stateListrec.getField('custrecord_state_netsuite');
			var states = statesNative.getSelectOptions();
			var stateRef = [];

			for(sLoop in states) {
				var currentID = states[sLoop].id;
				var currentText = states[sLoop].text;
				stateRef[currentText] = currentID;
//				stateKeyValues.push(currentText + '_' + currentID);
			}
			
			
		    switch (lotFields.payMethod) {
		    
		    case "1": //ACH
				// PAYMENT SUB TAB
				// ACH-WIRE INFORMATION GROUP
				newCreditMemo.setFieldValue('custbody_aqm_1_abaroutingnumber', lotFields.bankabaRouting || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', lotFields.bankAccount || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_accounttype', lotFields.bankAcctType || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', lotFields.bankNamesOn || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_bankname', lotFields.bankName || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddress', lotFields.bankAddr1 || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddresscity', lotFields.bankCity || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddressstate', statesReference[lotFields.bankState] || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddresszip', lotFields.bankZip || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', lotFields.bankContactName || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', lotFields.bankContactPhone || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', lotFields.bankFurtherAcct || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', lotFields.bankFurtherName || null);
				newCreditMemo.setFieldValue('custbody_acq_lot_payment_method_3', lotFields.lotPayMethod || null);
				//
				newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.payAddr1 || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.payAddr2 || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.payCity || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeestate', statesReference[lotFields.payState] || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.payZip || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_payeephonenumber', lotFields.payPhone || null);
				newCreditMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.payCountry || null);
				break;	

		    case "2":  //Domestic Check
		    	// Check a few fields to make sure this is a complete enough address to use, if not then use DE1 (Form 1) fields for the address on check
		    	if(lotFields.checkAddr1 != null && lotFields.checkAddr2 != null && lotFields.checkState != null && lotFields.checkZip != null) {
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.checkAddr1 || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.checkAddr2 || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.checkCity || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeestate', statesReference[lotFields.checkState] || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.checkZip || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.checkCountry || null);
		    	} else {
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.de1Addr1 || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.de1Addr2 || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.de1City || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeestate', statesReference[lotFields.checkState] || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.de1Zip || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.de1Country || null);
		    	}
//		    	// These two fields should be the same for regardless of the above address choice
//		    	newCreditMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
//		    	newCreditMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
				break;
				    
		    case "3": //International Check
		    	// Check a few fields to make sure this is a complete enough address to use, if not then use DE1 (Form 1) fields for the address on check
		    	if(lotFields.checkAddr1 != null && lotFields.checkAddr2 != null && lotFields.checkState != null && lotFields.checkZip != null) {
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.checkAddr1 || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.checkAddr2 || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.checkCity || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeestate', statesReference[lotFields.checkState] || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.checkZip || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.checkCountry || null);
		    	} else {
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.de1Addr1 || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.de1Addr2 || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.de1City || null);
//					newCreditMemo.setFieldValue('custbody_aqm_1_payeestate', statesReference[lotFields.checkState] || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.de1Zip || null);
//		    		newCreditMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.de1Country || null);
		    	}
//		    	// These two fields should be the same for regardless of the above address choice
//		    	newCreditMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
//		    	newCreditMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
				break;
		    
		    case "4": //Domestic Wire
//		    	newCreditMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', lotFields.bankNamesOn || null);
//		    	newCreditMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', lotFields.bankAccount || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_abaroutingnumber', lotFields.bankabaRouting || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankname', lotFields.bankName || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddress', lotFields.bankAddr1 || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddresscity', lotFields.bankCity || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[lotFields.bankState] || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddresszip', lotFields.bankZip || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', lotFields.bankContactName || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', lotFields.bankContactPhone || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', lotFields.bankFurtherAcct || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', lotFields.bankFurtherName || null);
//				newCreditMemo.setFieldValue('custbody_acq_lot_payment_method_3', lotFields.bankLotPayMethod || null);
				// Payee Group
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.payAddr1 || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.payAddr2 || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.payCity || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeestate', statesReference[lotFields.payState] || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.payZip || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeephonenumber', lotFields.payPhone || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.payCountry || null);
		    	break;
		    
		    case "5": //International Wire
//		    	newCreditMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', lotFields.bankNamesOn || null);
//		    	newCreditMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', lotFields.bankAccount || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_abaroutingnumber', lotFields.bankabaRouting || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankname', lotFields.bankName || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddress', lotFields.bankAddr1 || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddresscity', lotFields.bankCity || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[lotFields.bankState] || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_bankaddresszip', lotFields.bankZip || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', lotFields.bankContactName || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', lotFields.bankContactPhone || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', lotFields.bankFurtherAcct || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', lotFields.bankFurtherName || null);
//				newCreditMemo.setFieldValue('custbody_acq_lot_payment_method_3', lotFields.bankLotPayMethod || null);
				// Payee Group
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.payAddr1 || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.payAddr2 || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.payCity || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeestate', statesReference[lotFields.payState] || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.payZip || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeephonenumber', lotFields.payPhone || null);
//				newCreditMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.payCountry || null);
		    	break;
		    }
		} catch (e) {
			var cMemoDeletedID = nlapiDeleteRecord('creditmemo', responseObj.cMemoID);
			var err = e;
			nlapiLogExecution('ERROR', 'Failed to submit fields on Credit Memo #' + responseObj.cMemoID + '. It was deleted.', JSON.stringify(err));
	    	msg.setStatusError();
			msg.addMessage('Failed to submit fields on Credit Memo #' + responseObj.cMemoID + '. It was deleted. ' + JSON.stringify(err));
			responseObj.msg = msg;
			return responseObj;
		}

		var newID = nlapiSubmitRecord(newCreditMemo);
		responseObj.cMemoID = newID;
		responseObj.calltype = 'creditmemocomplete';
		return responseObj;
	} catch (e) {
		var err = e;
		nlapiDeleteRecord('creditmemo', cMemoID);
		nlapiLogExecution('DEBUG', 'nlapiSubmitRecord(newCreditMemo)', JSON.stringify(err));
    	msg.setStatusError();
		msg.addMessage(JSON.stringify(err));
		responseObj.msg = msg;
		return responseObj;
	}
	
	return responseObj;
}


function determineBankFee(lotFields, lineItemTotal) {
	var fee = 0.00;
	if(lineItemTotal >= lotFields.feeWaivedAmt) {
		return fee;
	}
	switch (lotFields.payMethod) {
		case "1":
			fee = lotFields.feeACH;
			break;
		case "2":
			fee = lotFields.feeCheckDom;
			break;
		case "3":
			fee = lotFields.feeCheckInt;
			break;
		case "4":
			fee = lotFields.feeWireDom;
			break;
		case "5":
			fee = lotFields.feeWireInt;
			break;
	}
	fee = parseFloat(-Math.abs(fee));
	return fee;
}

function applyRefund(dataIn) {
	//var responseObj = {};
	var responseObj = dataIn;
	var payeeName = '';
	var lotFields = dataIn.lotFields;
	msg.setStatusSuccess();
	responseObj.msg = msg;
	responseObj.skip = false; // Flag to tell the Ajax caller whether or not we've skipped the refund based on Payment Type
	
	function setRefundAddress(cRefund, lotFields){
		
		var isCheck = lotFields.cleanedPayMethodName.indexOf('_check') > -1;
		
		var payeeName = lotFields.de1Name || '',
			payeeAddr1 = lotFields.de1Addr1 || '',
			payeeAddr2 = lotFields.de1Addr2 || '',
			payeeCity = lotFields.de1City || '',
			payeeState = lotFields.de1State || '',
			payeeZip = lotFields.de1Zip || '',
			payeeCountry = lotFields.de1CountryText || '';
		
		var checkMailTo = lotFields.checkMailTo || '',
			checkAddr1 = lotFields.checkAddr1 || '',
			checkAddr2 = lotFields.checkAddr2 || '',
			checkCity = lotFields.checkCity || '', 
			checkState = lotFields.checkState || '',
			checkZip = lotFields.checkZip || '',
			checkCountry = lotFields.checkCountryText || '';
		
		var linebreaks = [],
			inlines = [],
			_linebreaks = '',
			_inlines = '',
			_address = '';
		
		if(isCheck && checkAddr1 && checkCity && checkState && checkZip){
			if(checkMailTo){ linebreaks.push(checkMailTo); }
			if(checkAddr1){ linebreaks.push(checkAddr1); }
			if(checkAddr2){ linebreaks.push(checkAddr2); }
			
			if(checkCity){ inlines.push(checkCity); }
			if(checkState){ inlines.push(checkState); }
			
			_linebreaks = linebreaks.length > 0 ? linebreaks.join('\n') : '';
			_inlines = inlines.length > 0 ? inlines.join(', ') : '';
			
			_address = (_linebreaks ? _linebreaks + '\n' : '') + (_inlines ? _inlines + ' ' + checkZip + '\n' : '') + checkCountry;
			
			cRefund.setFieldValue('address', _address);
		}
		else{
			if(payeeName){ linebreaks.push(payeeName); }
			if(payeeAddr1){ linebreaks.push(payeeAddr1); }
			if(payeeAddr2){ linebreaks.push(payeeAddr2); }
			
			if(payeeCity){ inlines.push(payeeCity); }
			if(payeeState){ inlines.push(payeeState); }
			
			_linebreaks = linebreaks.length > 0 ? linebreaks.join('\n') : '';
			_inlines = inlines.length > 0 ? inlines.join(', ') : '';
			
			_address = (_linebreaks ? _linebreaks + '\n' : '') + (_inlines ? _inlines + ' ' + payeeZip + '\n' : '') + payeeCountry;
			
			cRefund.setFieldValue('address', _address);
		}
	}
	
	try {
		var lotFields = dataIn.lotFields;
		var cMemoID = dataIn.cmemo.id;
		var custID = lotFields.shareholder;
		var dealID = lotFields.deal;
		var acctID;
		if(dealID != null && dealID != '') {
			acctID = nlapiLookupField('customer', dealID, 'custentity_acq_payment_account');
		}
		var payMethod = lotFields.payMethod;
		
		// If paymethod is Payroll, there is nothing to see here
		if( payMethod == 6 ) {
			responseObj.skip = true;
			return responseObj;
		}
		// Load Credit Memo so we can get fiels off them.  TODO: (smccurry) This could be turned into a search for faster processing
		var cMemo = nlapiLoadRecord('creditmemo', cMemoID);
		
		
		var cRefund = nlapiCreateRecord('customerrefund', {recordmode: 'dynamic', customform: 140}); //{recordmode: 'dynamic'} 
//		nlapiCreateRecord(recType, initObj)
		// Set required fields on the customer refund
		cRefund.setFieldValue('customer',custID);
		cRefund.setFieldValue('account',acctID);
		cRefund.setFieldValue('custbody_acq_lot_createdfrom_exchrec', lotFields.createdFromExRec);
		
		/**********************************************************************
		 * THERE ARE TWO DIFFERENT PAYMENT METHOD LIST THAT NEED TO BE SET
		 * ONE HAS THE FIELD ID OF paymentmethod (under Setup > Accounting >
		 * Accounting List) AND IS THE NATIVE NETSUITE FIELD AND THE OTHER IS
		 * custbody_acq_lot_payment_method_3
		 **********************************************************************/
		// ATP-1981 commenting out AVID references
		// NOTE: field 'custpage_no_update_ach' is a pseudo field that is used to prevent some Avid processing from occurring
		//       since we will not un-install the Avid bundle immediately we will leave that field here 
		//       once that bundle has been un-installed we can remove those lines
		try {
			if(payMethod != null && payMethod != '') {
				nlapiLogExecution('DEBUG', 'payMethod', payMethod);
//				cRefund.setFieldValue('paymentmethod', nsPayMethods[nsPayMethodText]); // SET FIELD ON THE REFUND METHOD TAB
				if(payMethod == 1) { // 1 is ACH
					cRefund.setFieldValue('paymentmethod', 9); // 9 is ACH
					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//	ATP-1981				cRefund.setFieldValue('custbody_pp_payment_method', 2); // 2. ACH
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
					var piracle = dataIn.piracle;
//	ATP-1981				cRefund.setFieldValue('custbody_pp_ach_account', piracle.id);
				} else if (payMethod == 2 || payMethod == 3) { // 2 and 3 are Domestic Check and Intl Check so set as 2 Check
					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
					cRefund.setFieldValue('paymentmethod', 2);
//	ATP-1981				cRefund.setFieldValue('custbody_pp_payment_method', 1); // 1. Check
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
				} else if (payMethod == 4 || payMethod == 5) { // 4 and 5 are Domestic Wire and Intl Wire so set as 7 Wire
					cRefund.setFieldValue('paymentmethod', 7);
					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//	ATP-1981				cRefund.setFieldValue('custbody_pp_payment_method', 4); // 4. Do Not Process with Piracle Pay
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
				} else if(payMethod == 7 ){ //AES ACH
					cRefund.setFieldValue('paymentmethod', 12);
					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//	ATP-1981				cRefund.setFieldValue('custbody_pp_payment_method', 2); // 4. Process as ACH
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
					var piracle = dataIn.piracle;
//	ATP-1981				cRefund.setFieldValue('custbody_pp_ach_account', piracle.id);
				} else if(payMethod == 8 || payMethod == 9){ //AES Check
					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
					cRefund.setFieldValue('paymentmethod', 11);
//	ATP-1981				cRefund.setFieldValue('custbody_pp_payment_method', 1); // 4. Do Not Process with Piracle Pay
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
				} else if(payMethod == 10 || payMethod == 11){ //AES Wire
					cRefund.setFieldValue('paymentmethod', 13);
					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//	ATP-1981				cRefund.setFieldValue('custbody_pp_payment_method', 4); // 4. Do Not Process with Piracle Pay
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
				}
			} else {
				msg.addMessage('Payment Method is null and cannot be set on the Customer Refund');
			}
		} catch (e) {
			msg.addMessage('Problem setting the NetSuite field \'paymentmethod\'');
			try {
				// SETTING THE PAYMENT METHOD IN THE LINES ABOVE IS VERY IMPORTANT, IF THIS FAILS THEN DELETE THE CREDIT MEMO AND DO NOT 'SUBMIT' THE CUSTOMER REFUND
				nlapiDeleteRecord('creditmemo', cMemoID);
				msg.addMessage('Deleting the Customer Refund and Credit Memo with ID of ' + cMemoID);
			} catch (e) {
				msg.addMessage('Attempted to delete Credit Memo with ID ' + cMemoID + '.  This record may not have been deleted.  Please delete before trying to refund this Exchange Record again.');
			}
		}
		// IF THERE ARE ERRORS UP TO THIS POINT THEN STOP AND RETURN MESSAGES.
		if(msg.returnMessages.length > 0) {
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		};
		
		// SET THE 'LOT PAYMENT METHOD' ON THE 'PAYMENT INFORMATION TAB' ON THE PIRACLE
//		cRefund.setFieldValue('custbody_acq_lot_payment_method_3',payMethod);
		// COPY THE REST OF THE BANKING INFORMATION FROM THE CREDIT MEMO TO THE CUSTOMER REFUND
		cRefund.setFieldValue('custbody_aqm_1_abaroutingnumber', cMemo.getFieldValue('custbody_aqm_1_abaroutingnumber'));
		cRefund.setFieldValue('custbody_aqm_1_bankaccountnumber', cMemo.getFieldValue('custbody_aqm_1_bankaccountnumber'));
		cRefund.setFieldValue('custbody_aqm_1_accounttype', cMemo.getFieldValue('custbody_aqm_1_accounttype'));
		cRefund.setFieldValue('custbody_aqm_1_namesonbankaccount', cMemo.getFieldValue('custbody_aqm_1_namesonbankaccount'));
		cRefund.setFieldValue('custbody_aqm_1_bankname', cMemo.getFieldValue('custbody_aqm_1_bankname'));
		cRefund.setFieldValue('custbody_aqm_1_bankaddress', cMemo.getFieldValue('custbody_aqm_1_bankaddress'));
		cRefund.setFieldValue('custbody_aqm_1_bankaddresscity', cMemo.getFieldValue('custbody_aqm_1_bankaddresscity'));
		cRefund.setFieldValue('custbody_aqm_1_bankaddressstate', cMemo.getFieldValue('custbody_aqm_1_bankaddressstate'));
		cRefund.setFieldValue('custbody_aqm_1_bankaddresszip', cMemo.getFieldValue('custbody_aqm_1_bankaddresszip'));
		cRefund.setFieldValue('custbody_aqm_1_nameofbankcontactperson', cMemo.getFieldValue('custbody_aqm_1_nameofbankcontactperson'));
		cRefund.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', cMemo.getFieldValue('custbody_aqm_1_phonenumberofbankcontac'));
		cRefund.setFieldValue('custbody_aqm_1_forfurthercreditaccount', cMemo.getFieldValue('custbody_aqm_1_forfurthercreditaccount'));
		cRefund.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', cMemo.getFieldValue('custbody_aqm_1_2forfurthercreditaccoun'));
		cRefund.setFieldValue('custbody_aqm_1_swiftiban', cMemo.getFieldValue('custbody_aqm_1_swiftiban'));
		cRefund.setFieldValue('entity', cMemo.getFieldValue('entity'));
		cRefund.setFieldValue('class', cMemo.getFieldValue('class'));
		cRefund.setFieldValue('custbodyacq_deal_link', cMemo.getFieldValue('custbodyacq_deal_link'));
		cRefund.setFieldValue('department', cMemo.getFieldValue('department'));
		
		if(lotFields.cleanedPayMethodName.indexOf('_wire') > -1){
			payeeName = lotFields.wirebankNamesOn;
		}
		else if(lotFields.cleanedPayMethodName.indexOf('_check') > -1){
			payeeName = lotFields.checkPayTo;
		}
		else{
			payeeName = lotFields.bankNamesOn;
		}
		
		cRefund.setFieldValue('custbody_aqm_1_namesonbankaccount', payeeName || '');
		cRefund.setFieldValue('custbody_aqm_1_payeeaddress1', cMemo.getFieldValue('custbody_aqm_1_payeeaddress1'));
		cRefund.setFieldValue('custbody_aqm_1_payeecity', cMemo.getFieldValue('custbody_aqm_1_payeecity'));
		cRefund.setFieldValue('custbody_aqm_1_payeestate', cMemo.getFieldValue('custbody_aqm_1_payeestate'));
		cRefund.setFieldValue('custbody_aqm_1_payeezip', cMemo.getFieldValue('custbody_aqm_1_payeezip'));
		
		setRefundAddress(cRefund, lotFields);
		
		var lineCount = cRefund.getLineItemCount('apply');
		nlapiLogExecution('DEBUG','lines',lineCount);
		for(var i=1; i<= lineCount;i++){
			cRefund.selectLineItem('apply', i);
			var applyID = cRefund.getCurrentLineItemValue('apply', 'doc');
			var amountRemaining = cRefund.getCurrentLineItemValue('apply', 'due');
			nlapiLogExecution('DEBUG','applyID : amountRemaining : applyIdToApply',applyID + ' : ' + amountRemaining + ' : ' +cMemoID);
			if ( applyID == cMemoID ) {
				cRefund.setCurrentLineItemValue('apply', 'apply', 'T');
				cRefund.setCurrentLineItemValue('apply', 'amount', amountRemaining);
				cRefund.commitLineItem('apply');
			}
		}
		
		if(msg.returnMessages.length > 0) {
			msg.setStatusError();
			responseObj.msg = msg;
			return responseObj;
		};
		
		var custRefund = {};
		try {
			custRefund.id = nlapiSubmitRecord(cRefund, true, true);
		} catch (e) {
			var err = e;
			nlapiLogExecution('ERROR', 'Code DA_1136 nlapiSubmitRecord on Customer Refund FAILED', 'ACQ_LOT_DA_CreditMemoRefund_R.js failed near line 1136 ' + JSON.stringify(err));
			
		}
		custRefund.tranid = nlapiLookupField('customerrefund', custRefund.id, 'tranid');
		responseObj.custRefund = custRefund;
		return responseObj;
	} catch (e) {
		var err = e;
		nlapiLogExecution('DEBUG', 'Problem creating Customer Refund', 'DE_1142 applyRefund() function in script ACQ_LOT_DA_CreditMemoRefund_r.js. ' + JSON.stringify(err));
		msg.addMessage('Problem setting the fields on the Customer Refund.');
		msg.setStatusError();
		responseObj.msg = msg;
		return responseObj;
	}
	
}

function unapplyDeleteCreditMemoAndRefund(dataIn) {
	var responseObj = {};
	var resonseObj = dataIn;
	msg.setStatusSuccess();
	responseObj.msg = msg;
	
	try {
		var deletedRecords = {};
		var cmemoInID = dataIn.cmemoid;
		var crefundInID = dataIn.crefundid;
		var cmemo = nlapiLoadRecord('creditmemo', cmemoInID);
		
		var cRefundIDs = [];
		var lineCount = cmemo.getLineItemCount('apply');
		for(var i=1; i<= lineCount;i++){
			cmemo.selectLineItem('apply', i);
			cmemo.setCurrentLineItemValue('apply', 'apply', 'F');
			cRefundIDs.push(cmemo.getCurrentLineItemValue('apply', 'internalid'));
			cmemo.commitLineItem('apply');
		}
		var cmemoID = nlapiSubmitRecord(cmemo);
		// After the Credit Memo is unapplied and saved, the Customer Refund can be deleted.
		var uniqueRefundID = cRefundIDs.filter(function(elem, pos) {
			    return cRefundIDs.indexOf(elem) == pos;
		});
		deletedRecords.crefunds = {};
		var tempObj = {};
		for(var r = 0; r < uniqueRefundID.length; r++) {
			var key = '_' + uniqueRefundID[r];
			tempObj[key] = nlapiDeleteRecord('customerrefund', uniqueRefundID[r]);
		}
		deletedRecords.crefunds = tempObj;
		deletedRecords.cmemo = nlapiDeleteRecord('creditmemo', cmemoID);
		responseObj.deletedRecords = deletedRecords;
		responseObj.callbacktype = 'deleted';
		return responseObj;
	} catch (e) {
		var err = e;
		nlapiLogExecution('DEBUG', 'Problem deleting the Credit Memo and Customer Refund.', JSON.stringify(err));
		msg.addMessage('Problem deleting the Credit Memo and Customer Refund.');
		msg.setStatusError();
		responseObj.msg = msg;
		return responseObj;
	}
	
}
