/* ----------------------------------------------------------------------------------------------------------------------------------------------------
 * ACQ_LOT_DA_ProcessPayment_Library.js
 * ____________________________________________________________________________________________________________________________________________________
 * Most(all?) of the code in this library is used by the Payments Dashboard including
 * Scheduled script ACQ LOT DA QM ApprovePayment (customscript_acq_lot_da_qm_aprv_pmt)
 *
 * Version 	ATP-559 Ken Crossman Fixing bug I caused on 2018 Oct 30 to Credit Memo Payment Reference Number
 *			ATP-723 Ken Crossman This story includes all changes tagged as: 
 *          						ATP-453 Code to use Payment Instruction if linked to the ExRec and to update Ex Rec after with PI values
 *          						ATP-456 Ensuring that Exchange Records with Pay Type = Payroll are treated as if they 
 *                               			they are not linked to a PI (whether that is true or not)
 *									ATO-24/ATO-179 - AES prefix on Payment Method was not being retained. Fixed this.
 *   		
 * ______________________________________________________________________________________________________________________________________________________
 */

//TODO: Port to independent library or remove entirely
ERROR_MESSAGES = function(obj) { 
	this.returnMessages = new Array(); 
//	this.returnRecId = null;
};
ERROR_MESSAGES.prototype.getMessages = function() { 
	return this.returnMessages; 
};
ERROR_MESSAGES.prototype.addMessage = function(message) { 
	this.returnMessages.push({ 'message' : message }); 
};
ERROR_MESSAGES.prototype.isSuccess = function() { 
	return this.returnStatus == ERROR_MESSAGES.RETURNSTATUS.SUCCESS; 
};
ERROR_MESSAGES.prototype.isError = function() { 
	return this.returnStatus == ERROR_MESSAGES.RETURNSTATUS.ERROR; 
};
ERROR_MESSAGES.prototype.setStatusSuccess = function() { 
	this.returnStatus = ERROR_MESSAGES.RETURNSTATUS.SUCCESS; 
};
ERROR_MESSAGES.prototype.setStatusError = function() {
	this.returnStatus = ERROR_MESSAGES.RETURNSTATUS.ERROR; 
};
ERROR_MESSAGES.prototype.setReturnRecID = function(recID) { 
	this.returnRecID = recID; 
};
ERROR_MESSAGES.prototype.getReturnRecID = function() {
	return this.returnRecID; 
};
ERROR_MESSAGES.RETURNSTATUS = { SUCCESS : "Success", ERROR : "Error"};


/*
 * 
 * Enumerations for representing state information for approvals.
 * 
 */
var PROCESSTYPE = {SINGLE: 'SINGLE', GROUP: 'GROUP', MASS: 'MASS'},
	PROCESSSATUS = {NOTSUPPLIED: 'NOTSUPPLIED', QUEUED: 'QUEUED', PROCESSING: 'PROCESSING', SUCCESS: 'SUCCESS', FAILED: 'FAILED', DUPLICATE: 'DUPLICATE', REAPPROVE: 'REAPPROVE'};
// This line is very fine line
// Constants 
var constant = {
	piMedStatus: {NotRequired: 13, Accepted: 16, Waived: 17, Rejected: 18 },
	erMedStatus: {NoMedallionNeeded: 5, MedallionApproved: 4, CustomerElectsNoMedallion: 7,MedallionRejected: 6 },
	piType: {Default: 9, AcquiomDeal: 10, SRSDeal: 12, ExRec: 11 },
	piPayMethod: {ach: 1, domCheck: 2, intCheck: 3, domWire: 4, intWire: 5},
	erPayMethod: {ach: 1, domCheck: 2, intCheck: 3, domWire: 4, intWire: 5, payroll: 6, aes_ach: 7, aes_domCheck: 8, aes_intCheck: 9, aes_domWire: 10
		         ,aes_intWire:11 ,intWire_Brokerage:12 ,intWire_Bank:13 ,domWire_Brokerage:14 ,domWire_Bank:15 
		         ,shareDistribution:16 ,documentCollectionOnly:17 ,noCashPayment:18 }
    };

//var performPaymentInstructionProcessing;
var zeroDollarCreditMemoAndNoCreditRefund;
var rcdPaymentProcess; // ATO-112
var profileRec;
var gExchangeRecordId;
var gPaymentMethodText;
var gDoNotOverrideReferenceText = false;
var dealEventRecord;
var certSearchResults;
var certsTotal = 0;
var objPaymentCurrency;

//=================================================================================================================================================
//=================================================================================================================================================
var arrTimestamps = [];
var currentTimestamp;
var previousTimestamp;
var startingTimestamp;
var timestampDatetime;

//=================================================================================================================================================
//=================================================================================================================================================
function takeTimestamp(note ,startStop) {

	var includeDatetimeString = false;
	if (!startStop) { startStop = ""; }
	if (startStop.toUpperCase() == "START" || timestampDatetime == null) {
		timestampDatetime = new Date();
		currentTimestamp  = timestampDatetime.getTime();
		startingTimestamp = timestampDatetime.getTime();
		includeDatetimeString = true;
	}
	else if (startStop.toUpperCase() == "STOP") { includeDatetimeString = true; }

	var objTimestamp            = {};
	timestampDatetime           = new Date();
	previousTimestamp           = currentTimestamp;
	currentTimestamp            = timestampDatetime.getTime();
	objTimestamp.Elapsed        = parseInt( ( currentTimestamp - startingTimestamp ) / 1000);
	objTimestamp.diff           = currentTimestamp - previousTimestamp;
	objTimestamp.diffSecs       = parseFloat(objTimestamp.diff / 1000).toFixed(1);
	objTimestamp.note           = note;
	objTimestamp.cur            = currentTimestamp;
	objTimestamp.pre            = previousTimestamp;
	if (includeDatetimeString) { objTimestamp.datetimeString = timestampDatetime.toString(); }
	arrTimestamps.push(objTimestamp);

	if (startStop.toUpperCase() == "STOP") { logTimestampArray(objTimestamp.Elapsed); }
}

//=================================================================================================================================================
//=================================================================================================================================================
function logTimestampArray(elapsed) {
	var i = 0;
	
//	for each (objTimestamp in arrTimestamps) {
//		i++;
//		nlapiLogExecution('AUDIT' ,'Timestamp ' + i ,JSON.stringify(objTimestamp) );
//	
//	} // for each (result in searchHolidaysResults)
	var title = "Timestamp Array:  ExcrecId:" 
	      + gExchangeRecordId 
	      + ",   PayMethod:" + gPaymentMethodText
	      + ",   Elapsed Secs: " + elapsed;
	nlapiLogExecution('AUDIT' ,title ,JSON.stringify(arrTimestamps) );
}


/*
 * 
 * Functions for processing an approval.
 * 
 */


function processPaymentApproval(recordPaymentProcess){
	var output = {};
	try {		output = processPaymentApprovalInsideTry(recordPaymentProcess)   	}
	catch(e) {
		var msg = new ERROR_MESSAGES();
		msg.setStatusError();
		msg.addMessage("Javascript Exception: " + e.message.replace(/"/g,"'"));
		output.error = 'error';
		output.msg = msg.getMessages();
		nlapiLogExecution('ERROR', "Exception in processPaymentApproval:", JSON.stringify(e)); 
	}
	
	return output;
}



function processPaymentApprovalInsideTry(recordPaymentProcess){  // ATO-112 (changed arguments to single argument of Payment Process record)
	
	takeTimestamp("Start processPaymentApproval" ,"Start");	
	// ATO-112
	rcdPaymentProcess = recordPaymentProcess;
	var _data = rcdPaymentProcess.getFieldValue('custrecord_process_data');
	var data = JSON.parse(_data);    			
	var exrecid = data.id;
	gExchangeRecordId = exrecid;
	var fee = data.fee || 'false';
	var process_effective_date = rcdPaymentProcess.getFieldValue('custrecord_process_effective_date');
	// END ATO-112
 
	profileRec = nlapiLoadRecord('customrecord_acq_lot_profile', 1);
	var exchangeRecord = getExchangeRecord(exrecid),
		msg = new ERROR_MESSAGES(),
//		piraclePayment = null,   ATP-1981
		output = {};
		
	certSearchResults = getCertificates(exrecid, msg); 
	
	// ATP-453 We need to know if Payment Type is Payroll	
	var exRecPaymentMethod = exchangeRecord['custrecord_acq_loth_4_de1_lotpaymethod'];
	gPaymentMethodText = exchangeRecord['custrecord_acq_loth_4_de1_lotpaymethod_text'];
	if ( exchangeRecord['custrecord_payout_no_override_ref_txt'] == "T" ) { gDoNotOverrideReferenceText = true; } // ATP-1365
//	var isPayroll = (exRecPaymentMethod == constant.erPayMethod.payroll);
//	
//	performPaymentInstructionProcessing = true;
//	if (   exRecPaymentMethod == constant.erPayMethod.payroll
//		|| exRecPaymentMethod == constant.erPayMethod.shareDistribution
//		|| exRecPaymentMethod == constant.erPayMethod.documentCollectionOnly
//		|| exRecPaymentMethod == constant.erPayMethod.noCashPayment             ) 
//	    { performPaymentInstructionProcessing = false; }
//	var PaymentInstructionProcessingObsolete = getAppSetting("Payment Instruction" ,"Apply PI To Exchange When Tagged");
//	if (PaymentInstructionProcessingObsolete == "T") { 
//		performPaymentInstructionProcessing = false; 
//		nlapiLogExecution('AUDIT', 'Apply PI To Exchange When Tagged', 'Payment Instruction processing is disabled via appSetting');	
//	}
	
	zeroDollarCreditMemoAndNoCreditRefund = false;
	if (   exRecPaymentMethod == constant.erPayMethod.payroll
		|| exRecPaymentMethod == constant.erPayMethod.shareDistribution
		|| exRecPaymentMethod == constant.erPayMethod.documentCollectionOnly
		|| exRecPaymentMethod == constant.erPayMethod.noCashPayment             ) 
	    { zeroDollarCreditMemoAndNoCreditRefund = true; }

//	// ATP-453: Make Payments Dashboard aware of Alpha PI
//	// If the Exchange Record is linked to a PI 
//	// and this is not a Payroll payment then overlay the values from the PI on the exchangeRecord object (without updating the database)
//	var paymtInstrId = exchangeRecord['custrecord_exrec_payment_instruction'];
//	var mapPItoERResult = {};
//	if (paymtInstrId && performPaymentInstructionProcessing) { //ATP-456
//		// If we are unable to read and then overlay then this is a serious enough issue to warrant rejecting this payment
//		mapPItoERResult = mapPIValuesIntoERFields(exrecid, exRecPaymentMethod, paymtInstrId);
//
//		if (mapPItoERResult.success) {
//			exchangeRecord = overlayERwithPI(exchangeRecord, mapPItoERResult.exRecFields, mapPItoERResult.exRecValues);
//		} else {
//			msg.setStatusError();
//			msg.addMessage(mapPItoERResult.message);
//			output.error = 'error';
//			output.msg = msg.getMessages();
//			return output;
//		}
//	}

	// If the Exchange Record has a Suspense Reason then return an error and exit this function
	if (exchangeRecord['custrecord_suspense_reason'] != '') {
		msg.setStatusError();
		msg.addMessage('This Exchange Record is suspended. Reason given: ' + exchangeRecord['custrecord_suspense_reason'].replace(/,/g,', '));
		output.error = 'error';
		output.msg = msg.getMessages();
		return output;
	}
	
	takeTimestamp("Before getDER"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	dealEventRecord = getDER(exchangeRecord['custrecord_acq_lot_payment_import_record']);
	var deal = getDeal(exchangeRecord['custrecord_acq_loth_zzz_zzz_deal']);
	var profile = getProfile('1');

	//Update and Process Payment records associated to this Exchange Record to 'REAPPROVE' if they are in 'FAILED' state.
	updateProcessPaymentsToReapprove(exrecid);

	//initialize our lotFields object so we have all fields for our operations and have a friendlier map to access
	var lotFields = getLOTFields(exchangeRecord, deal, profile, msg, dealEventRecord);
	takeTimestamp("aft getLOTFields"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	if(msg.isError()){
		output.error = 'error';
		msg.setStatusError();
		output.msg = msg.getMessages();
		nlapiLogExecution('ERROR', 'ERROR ATTEMPTING TO GENERATE LOTFIELDS FOR EXREC ' + exrecid, JSON.stringify(output.msg));
		return output;
	}

	// ATP-1790

	// 1 - Validate Shareholder currencies    objPaymentCurrency
	var currencyFound = false;
	try {
		var filters = [];
		filters.push(new nlobjSearchFilter('internalid' ,null                       ,'anyof' ,lotFields.shareholder ));
		filters.push(new nlobjSearchFilter('currency'   ,'customercurrencybalance'  ,'anyof' ,objPaymentCurrency.id ));
		var columns = [];
		columns.push( new nlobjSearchColumn('internalid') );
		columns.push( new nlobjSearchColumn('currency' ,'customercurrencybalance' ) );
		var shareholdersCurrencies = nlapiSearchRecord('customer' ,null ,filters ,columns);
		} 
	catch(e) { 
		nlapiLogExecution('ERROR', 'search shareholder currencies FAILED', JSON.stringify(e)); 
		msg.setStatusError();
		msg.addMessage("Exception when searching Shareholder currencies: " + e.message);
		output.error = 'error';
		output.msg = msg.getMessages();
		return output;
	}
	nlapiLogExecution('DEBUG', 'ATP-1790', JSON.stringify(shareholdersCurrencies)); 
	if ( !( shareholdersCurrencies && shareholdersCurrencies.length > 0 ) ) {
		msg.setStatusError();
		msg.addMessage("Shareholder is missing currency '{0}'".replace("{0}",objPaymentCurrency.name));
		output.error = 'error';
		output.msg = msg.getMessages();
		return output;
	}

	// 2 - Validate "GL Account for Tie Out" currencies
	var currencyFound = false;
	var arrayGlAccountIds = [];
	var glAccounts = dealEventRecord["glAccounts"];
	var derPayoutType_DataCollectionOnly = 13;
	
	fromTry:
	try {
		if ( certsTotal != 0 && dealEventRecord["payoutType"] == derPayoutType_DataCollectionOnly ) {
			msg.setStatusError();
			msg.addMessage("DER indicates Transaction is for data collection only but the certificate payment amount is greater than $0.00");
			output.error = 'error';
			output.msg = msg.getMessages();
			return output;
		}

		if (glAccounts.length == 0 && !dealEventRecord["glAccount"] ) {
			// if we are here it means that there is no GL Account assigned.
			// There is a special case where if all certs total zero and DER payout Type is "Data Collection Only"
			// then no GL Account is required for this exchange record
			
			if ( certsTotal == 0 && dealEventRecord["payoutType"] == derPayoutType_DataCollectionOnly ) { break fromTry; }
			
			// if we are here then it is an error that there is no GL Account assigned 
			msg.setStatusError();
			msg.addMessage("This Exchange record is missing a GL Account on the DER record");
			output.error = 'error';
			output.msg = msg.getMessages();
			return output;
		}
		
		if (glAccounts.length > 0) {
			for (ix in glAccounts) {
				var objGlAccount = glAccounts[ix];
				if (objGlAccount["currency"] == objPaymentCurrency.id) { currencyFound = true; break; }
			}
		}
		else { 
			var accountRec      = nlapiLoadRecord('account', dealEventRecord["glAccount"] );
			var accountCurrency = accountRec.getFieldValue("currency");
			if (accountCurrency == objPaymentCurrency.id) { currencyFound = true; }
		}
		if (!currencyFound) {
			msg.setStatusError();
			msg.addMessage("DER does NOT have a GL Account with currency '{0}'".replace("{0}",objPaymentCurrency.name));
			output.error = 'error';
			output.msg = msg.getMessages();
			return output;
		}
	} 
	catch(e) { 
		nlapiLogExecution('ERROR', "search DER currencies FAILED", JSON.stringify(e)); 
		msg.setStatusError();
		msg.addMessage("Exception when searching DER currencies: " + e.message);
		output.error = 'error';
		output.msg = msg.getMessages();
		return output;
	}

	// ATP-1790 END
	
	fee = (fee == '' ? 'false' : fee);
	
	//Assign our nlapiObjects to null for garbage collection and memory footprint
	exchangeRecord = null;
	deal = null;
	profile = null;

//  ATP-1981 commented out
//	//Handle ACH case and create/retrieve the piracle record
//	if(lotFields.cleanedPayMethodName == 'ach' || lotFields.cleanedPayMethodName == 'aes_ach'){
//		//takeTimestamp("bef getPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
////		piraclePayment = getPiraclePayment(lotFields) || createPiraclePayment(lotFields, msg);
//		piraclePayment = null;
//		var stringPiraclePayment = rcdPaymentProcess.getFieldValue('custrecord_process_piracle_object');
//		if (stringPiraclePayment > "") { 
//			try { piraclePayment = JSON.parse(stringPiraclePayment); }
//			catch(ePiracleParse) { 
//				nlapiLogExecution('ERROR', 'Piracle Object from PaymentProcess rcd parse failed ' + exrecid, ePiracleParse.message);
//                piraclePayment = {id:null ,error:true ,errorMessage:ePiracleParse.message};
//			}
//		}
//		if(!piraclePayment || (piraclePayment && piraclePayment.error) || (piraclePayment && !piraclePayment.id)){
//			if(!piraclePayment) { piraclePayment = {id:null ,error:true ,errorMessage:"piracle payment object is null, check paymentProcess record"} } // prevent null reference exception
//			nlapiLogExecution('ERROR', 'ERROR PROCESSING PIRACLE PAYMENT FOR EXREC ' + exrecid, piraclePayment.errorMessage);
//			
//			if(piraclePayment.id){
//				deleteEntity('customrecord_pp_ach_account', piraclePayment.id);
//			}
//			
//			output.error = 'error';
//			output.msg = piraclePayment.errorMessage;
//			
//			return output;
//		}
//		
//		lotFields.piracle = piraclePayment;
//		//takeTimestamp("aft getPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//	}

	//Create Credit Memo as all payment types have a Credit Memo.
	takeTimestamp("Before createCreditMemo"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	var creditMemoObject = createCreditMemo(lotFields, fee, msg ,zeroDollarCreditMemoAndNoCreditRefund);
	takeTimestamp("return from createCreditMemo"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	var creditMemo = ( creditMemoObject.cMemo || creditMemoObject.error ),
		totalAmount = ( creditMemoObject.totalAmount || false );
	
	if(msg.isError() || !creditMemo || (creditMemo && creditMemo.error)){
		
		nlapiLogExecution('ERROR', 'ERROR PROCESSING CREDIT MEMO FOR EXREC ' + exrecid, JSON.stringify(msg));
		
		if(creditMemo && creditMemo.id){
			deleteEntity('creditmemo', creditMemo.id);
		}
		
		output.error = 'error';
		output.duplicate = creditMemo.duplicate;
		output.msg = msg.getMessages();
		
		return output;
	}

	var refund = null;
	
	//Create refund only if not an excluded payment method as all other pay types require refund
	if(!zeroDollarCreditMemoAndNoCreditRefund && totalAmount > 0 ){
		takeTimestamp("Before createCustomerRefund"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
		refund = createCustomerRefund(lotFields, msg);
		takeTimestamp("return from createCustomerRefund"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
		// nlapiLogExecution('DEBUG', 'processPaymentApproval', 'refund: ' + JSON.stringify(refund));
		if(msg.isError() || !refund || (refund && refund.error)){
			
			nlapiLogExecution('ERROR', 'ERROR PROCESSING CUSTOMER REFUND FOR EXREC ' + exrecid, JSON.stringify(msg));
			
			if(creditMemo && creditMemo.id){
				deleteEntity('creditmemo', creditMemo.id);
			}
			
			output.error = 'error';
			output.msg = msg.getMessages();
			
			return output;
		}
	}
	// ATP-453 This try catch section was replaced by the section below
	// try{
	// 	//Set the related fields for Credit Memo and Customer Refund
	// 	setExchangeRecordRelatedFields(lotFields.exchangeRecordID, creditMemo.id, refund ? refund.id : 0, isPayroll);
	// 	//Set the payment reference number on the Credit Memo
	// 	// ATP-559 The Credit Memo Payment Reference Number should only be set when a Customer Refund has been created
	// 	// If there is no Refund.tranid (the Checknumber field from the Customer Refund) then there is no refund 
	// 	if (!isPayroll && refund.tranid) {
	// 		setPaymentReferenceNumber(refund.tranid, lotFields.cMemo.id, lotFields.cleanedPayMethodName);
	// 	}
	// 	// setPaymentReferenceNumber(refund ? refund.tranid : 0, lotFields.cMemo.id, lotFields.cleanedPayMethodName);
	// }
	// catch(e){
	// 	//TODO: Handle errors for setting related fields.
	// 	nlapiLogExecution('ERROR', 'UNABLE TO SET RELATED FIELDS ON EXCHANGE RECORD: ' + lotFields.exchangeRecordID, 
	// 		e.message + ': ' + e.stack);
	// }

	// ATP-453 Start of Section.........................................................................................................................
	//Set the payment reference number on the Credit Memo if a Refund has been created
	// ATP-559 The Credit Memo Payment Reference Number should only be set when a Customer Refund has been created
	// If there is no Refund.tranid (the Checknumber field from the Customer Refund) then there is no refund 
	if (!zeroDollarCreditMemoAndNoCreditRefund && refund && refund.tranid) { //ATP-456
		takeTimestamp("Before setPaymentReferenceNumber"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
		var setCMPayRefResult = setPaymentReferenceNumber(refund.tranid, lotFields.cMemo.id, lotFields.cleanedPayMethodName);
		takeTimestamp("return from setPaymentReferenceNumber"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
		if (!setCMPayRefResult.success) {
			nlapiLogExecution('ERROR', 'UNABLE TO SET PAYMENT REFERENCE ON CREDIT MEMO', lotFields.cMemo.id);
			msg.setStatusError();
			msg.addMessage(setCMPayRefResult.message);
			output.error = 'error';
			output.msg = msg.getMessages();
			return output;
		}
	}

	// Update Exchange Record
	var updateERResult = {};
	var fieldsToUpdate = [];
	var valuesToUpdate = [];
	var addTxnFieldsResult = {};
//	if (performPaymentInstructionProcessing && paymtInstrId) { //ATP-456
//		fieldsToUpdate = mapPItoERResult.exRecFields;
//		valuesToUpdate = mapPItoERResult.exRecValues;
//	}
	//Add the transaction field for Customer Refund and Credit Memo to the array of fields to update
	addTxnFieldsResult = addTxnFields(creditMemo.id, refund ? refund.id : 0, zeroDollarCreditMemoAndNoCreditRefund, creditMemoObject.trandate, fieldsToUpdate, valuesToUpdate);
	// Now update the ER
	takeTimestamp("bef updateER"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	updateERResult = updateER(exrecid, addTxnFieldsResult.fields, addTxnFieldsResult.values);
	takeTimestamp("aft updateER"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	if (!updateERResult.success) {
		msg.setStatusError();
		msg.addMessage(updateERResult.message);
		output.error = 'error';
		output.msg = msg.getMessages();
		return output;
	}
	//ATP-453 End of Section..............................................................................................................................
	
	output.success = 'success';
	output.creditMemo = creditMemo.id;
	output.refund = ( refund ) ? refund.id : 0;
	
//  ATP-1981 commented out
//	if(piraclePayment){
//		output.piracle = piraclePayment.id;
//	}

	takeTimestamp("end processPaymentApproval" ,'stop');
	return output;
}

function reprocessPaymentApproval(recordPaymentProcess){  // ATO-112 (changed arguments to single argument of Payment Process record)
	
	// ATO-112
	rcdPaymentProcess = recordPaymentProcess;
	var _data = rcdPaymentProcess.getFieldValue('custrecord_process_data');
	var data = JSON.parse(_data);    			
	var exrecid = data.id;
	var fee = data.fee || 'false';
	// END ATO-112
	
	var exRecPaymentMethod = nlapiLookupField('customrecord_acq_lot', exrecid, 'custrecord_acq_loth_4_de1_lotpaymethod');
	// var isPayroll = (exRecPaymentMethod == 6); // 6. Payroll
	// var paymentInstructionData = null; // ATP-453 This variable is never referenced

	// ATP-115: Make Payments Dashboard aware of Alpha PI
	// if(!isPayroll) {
	//     var myPaymentInstruction = lookupPaymentInstruction(exrecid);
	//     if(myPaymentInstruction.error) {
	//     	return myPaymentInstruction;
	//     }
	//     if(myPaymentInstruction) {
	//         updateExRecWithPaymtInstrInfo(exrecid, myPaymentInstruction, exRecPaymentMethod);
	//     }
	// }

	var exchangeRecord = getExchangeRecord(exrecid),
		profile = getProfile('1'),
		msg = new ERROR_MESSAGES(),
		output = {},
		refund = null,
		lotFields = null;

	if(exchangeRecord['custrecord_suspense_reason'] != '') {
		msg.setStatusError();
		msg.addMessage('This Exchange Record is suspended. Reason given: ' + exchangeRecord['custrecord_suspense_reason'].replace(/,/g,', '));
		output.error = 'error';
		output.msg = msg.getMessages();
			
		return output;
	}

	var dealEventRecord = getDER(exchangeRecord['custrecord_acq_lot_payment_import_record']);
	var deal = getDeal(exchangeRecord['custrecord_acq_loth_zzz_zzz_deal']);
	
	//Update and Process Payment records associated to this Exchange Record to 'REAPPROVE' if they are in 'FAILED' state.
	updateProcessPaymentsToReapprove(exrecid);

	//initialize our lotFields object so we have all fields for our operations and have a friendlier map to access
	lotFields = getLOTFields(exchangeRecord, deal, profile, msg, dealEventRecord);
	
	if(msg.isError()){
		output.error = 'error';
		
		msg.setStatusError();
		output.msg = msg.getMessages();
		nlapiLogExecution('ERROR', 'ERROR ATTEMPTING TO GENERATE LOTFIELDS FOR EXREC ' + exrecid, JSON.stringify(output.msg));
		
		return output;
	}

	//Assign our nlapiObjects to null for garbage collection and memory footprint
	exchangeRecord = null;
	deal = null;
	profile = null;
	
	//Create refund only if we are not an excluded payment method as all other pay types require refund
	if (!zeroDollarCreditMemoAndNoCreditRefund) {
		lotFields.cMemo = { id: lotFields.relatedCreditMemo || 0 };
		refund = createCustomerRefund(lotFields, msg);
		
		if(msg.isError() || !refund || (refund && refund.error)){
			
			nlapiLogExecution('ERROR', 'ERROR REPROCESSING LOT REFUND FOR EXREC ' + exrecid, JSON.stringify(msg));

			if(creditMemo && creditMemo.id){		
				deleteEntity('creditmemo', creditMemo.id);		
			}

			output.error = 'error';
			output.msg = msg.getMessages();
			
			return output;
		}
	}
	
	try{
		//Set the related fields for Credit Memo and Customer Refund
		setExchangeRecordRelatedFields(lotFields.exchangeRecordID, 0, refund ? refund.id : 0, zeroDollarCreditMemoAndNoCreditRefund, null);// ATO-112
		//Set the payment reference number on the Credit Memo
		setPaymentReferenceNumber(refund ? refund.tranid : 0, lotFields.cMemo.id, lotFields.cleanedPayMethodName);
	}
	catch(e){
		//TODO: Handle errors for setting related fields.
		nlapiLogExecution('ERROR', 'UNABLE TO SET RELATED FIELDS ON EXCHANGE RECORD', lotFields.exchangeRecordID);
	}

	output.success = 'success';
	output.refund = refund.id;
	
	return output;
}

function processPaymentApprovals(exrecids){
	//TODO: Call processPaymentApproval to process the first approval, then reschedule this script to via n lapi
}

/*
 * 
 * Methods for retrieving items and related data
 * 
 */

/*
 * Governance: 10pts
 */
//ATP-1981 commented out
//function getPiraclePayment(lotFields) {
//	takeTimestamp("start getPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//	var piracle = null,
//		filters = [],
//		columns = [],
//		searchresults = [],
//		searchresult = {},
//		resultAcctType = null,
//		shareholder = lotFields.shareholder,
//		newAccountNum = lotFields.bankAccount,
//		newRoutingNum = lotFields.bankabaRouting,
//		newAccountType = lotFields.bankAcctType;
//
//	// Filter based on the shareholder
//	filters[0] = new nlobjSearchFilter('custrecord_pp_ach_entity', null, 'is', shareholder);
//	
//	// return opportunity sales rep, customer custom field, and customer ID
//	columns[0] = new nlobjSearchColumn('custrecord_pp_ach_entity');
//	columns[1] = new nlobjSearchColumn('custrecord_pp_ach_account_number');
//	columns[2] = new nlobjSearchColumn('custrecord_pp_ach_routing_number');
//	columns[3] = new nlobjSearchColumn('custrecord_pp_ach_transaction_code');
//	
//	// execute the search, passing all filters and return columns
//	searchresults = nlapiSearchRecord('customrecord_pp_ach_account', null, filters, columns );//10pts
//	
//	// loop through the results
//	for(var i = 0; searchresults != null && i < searchresults.length; i++) {
//		
//		// get result values
//		searchresult = searchresults[i];
//		
//		if(searchresult.getValue('custrecord_pp_ach_account_number') == newAccountNum && searchresult.getValue('custrecord_pp_ach_routing_number') == newRoutingNum ) {
//			resultAcctType = searchresult.getValue('custrecord_pp_ach_transaction_code');
//			
//			if(((newAccountType == 1 || newAccountType == 3) && resultAcctType == 7) || ((newAccountType == 2 || newAccountType == 4) && resultAcctType == 8)) {
//				piracle = {};
//				piracle.id = searchresult.getId();
//				piracle.accountType = searchresult.getValue('custrecord_pp_ach_transaction_code');
//				piracle.accountNumb = searchresult.getValue('custrecord_pp_ach_account_number');
//				piracle.routingNUmb = searchresult.getValue('custrecord_pp_ach_routing_number');
//				
//				searchresults = null;
//				searchresult = null;
//				
//				takeTimestamp("end 1 getPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//				return piracle;
//			}
//		}
//	}
//	searchresults = null;
//	
//	takeTimestamp("end 2 getPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//	return piracle;
//}

/*
 * Governance: ???pts
 */
function getCreditMemo(cMemoID){

	var filters = [];
    filters.push(new nlobjSearchFilter('internalid', null, 'is', cMemoID));
    filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));

    var desiredFields = ['custbody_aqm_1_abaroutingnumber', // ABA Routing Number
                        'custbody_aqm_1_bankaccountnumber', // Bank Account Number
                        'custbody_aqm_1_accounttype', // Account Type - returning as 1?
                        'custbody_aqm_1_namesonbankaccount', // Name(s) on Bank Account
                        'custbody_aqm_1_bankname', // Bank Name
                        'custbody_aqm_1_bankaddress', // Bank Address
                        'custbody_aqm_1_bankaddresscity', // Bank Address City
                        'custbody_aqm_1_bankaddressstate', // Bank Address State
                        'custbody_aqm_1_bankaddresszip', // Bank Address Zip
                        'custbody_aqm_1_nameofbankcontactperson', // Name of Bank Contact Person
                        'custbody_aqm_1_phonenumberofbankcontac', // Phone Number of Bank Contact Person
                        'custbody_aqm_1_forfurthercreditaccount', // For Further Credit Account Number
                        'custbody_aqm_1_2forfurthercreditaccoun', // For Further Credit Account Name
                        'custbody_aqm_1_swiftiban', // Swift/IBAN
                        // all of the above are under the Payment Information tab
                        'entity', // Entity - returns as ID
                        'class', // returns as ID
                        'custbodyacq_deal_link', // returns as ID
                        'department',   // Department - returns as ID
                        'currency',  
                        // 
                        'custbody_aqm_1_payeeaddress1', // Payee Address 1
                        'custbody_aqm_1_payeecity', // Payee City
                        'custbody_aqm_1_payeestate', // Payee State - returns as ID
                        'custbody_aqm_1_payeezip']; // Payee Zip
                        // these are under the Payment Information tab

    try {
	    var searchResults = performSearchWithSingleResult(desiredFields, 'transaction', filters);
	    return storeSingleSearchResult(searchResults);
    }

   catch(e) {
    nlapiLogExecution('ERROR', e, e.getDetails());
   }
}

function getCertificates(exrecid, msg){
	// 	SEARCH LOT FOR ATTACHED CERTIFICATES. !!!
	//var certSearchResults = new Array();
	var certSearchFilters = new Array();
	var certSearchColumns = new Array();
	var certs = null;
	
	//	DO THE SEARCH FOR ASSOCIATED CERTIFICATE RECORDS HERE
	certSearchFilters[0] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot',null,'is',exrecid);
	certSearchFilters[1] = new nlobjSearchFilter('isinactive',null,'is','F');			
	
	certSearchColumns[0] = new nlobjSearchColumn('internalid',null,null);
	certSearchColumns[1] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certnumber',null);
	certSearchColumns[2] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certtype',null);
	certSearchColumns[3] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certdesc',null);
	certSearchColumns[4] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null);
	certSearchColumns[5] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment',null);
	certSearchColumns[6] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_lotcestatus',null);
	certSearchColumns[7] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_currencytyp',null);
	certSearchColumns[8] = new nlobjSearchColumn('symbol' ,'custrecord_acq_lotce_zzz_zzz_currencytyp');
	
	try{
		certs = nlapiSearchRecord('customrecord_acq_lot_cert_entry',null,certSearchFilters,certSearchColumns);
		certs = certs && certs.length > 0 ? certs : null;
	}
	catch(err){
		msg.addMessage('Unable to retrieve Certificates with Exchange Record id: ' + exrecid);
	}
	
	if (certs) {
		// Get paymentCurrency, this will be the cash currency, so we skip non-cash currencies and take first cash currency
		for (ix in certs) {
			if (!objPaymentCurrency) {
        		var fieldValueSymbol   = certs[ix].getValue('symbol' ,'custrecord_acq_lotce_zzz_zzz_currencytyp');
        		var symbol = fieldValueSymbol.toString().trim();
        		if (isNaN(Number(symbol))) { // isNaN: Non-Numeric symbol means it is a cash currency, save it
        			nlapiLogExecution('DEBUG', 'ATP-1790 ' ,"found cash currency "  );
        			objPaymentCurrency = {};
        			objPaymentCurrency.id   = certs[ix].getValue('custrecord_acq_lotce_zzz_zzz_currencytyp');
        			objPaymentCurrency.name = certs[ix].getText('custrecord_acq_lotce_zzz_zzz_currencytyp');
        		}
			}
			certsTotal = certsTotal + Number(certs[ix].getValue('custrecord_acq_lotce_zzz_zzz_payment'));
		}
	}
	
	nlapiLogExecution('DEBUG', 'ATP-1790 ' ,"objPaymentCurrency: " + JSON.stringify(objPaymentCurrency) );

	return certs;
}

/*
 * Governance: ???pts
 */
function getCustomerRefund(){
	
	return {};
}

function getProfile(profileID) {
	var filters = new nlobjSearchFilter('internalid', null, 'is', profileID);
	var desiredFields = ['custrecord_acq_lot_cmemo_share_line_item',
						'custrecord_acq_lot_cmemo_entity'
	];
	var searchResults = performSearchWithSingleResult(desiredFields, 'customrecord_acq_lot_profile', filters);
	return storeSingleSearchResult(searchResults);
}

function getDER(derID) { // ATP-1874
	
	var col_acqApprovedToPay = new nlobjSearchColumn('custrecord_pay_import_acq_approved_pay');
	var col_opsApprovedToPay = new nlobjSearchColumn('custrecord_pay_import_approved_pay');
	var col_payoutType       = new nlobjSearchColumn('custrecord_pay_import_release_type');
	var col_glAccount        = new nlobjSearchColumn('custrecord_pay_import_glaccount');
	var col_glAccountsName   = new nlobjSearchColumn('name'       ,'CUSTRECORD_PAY_IMPORT_GLACCOUNTS');
	var col_glAccountsId     = new nlobjSearchColumn('internalid' ,'CUSTRECORD_PAY_IMPORT_GLACCOUNTS');
	var arrColumns = [col_acqApprovedToPay ,col_opsApprovedToPay ,col_payoutType ,col_glAccount ,col_glAccountsName ,col_glAccountsId ];
	
	var arrFilters = [ new nlobjSearchFilter('internalid', null, 'anyof', [derID] ) ];
	
	var searchResults = nlapiSearchRecord('customrecord_payment_import_record',null, arrFilters, arrColumns);
	
	var objReturn = [];
	objReturn[col_acqApprovedToPay.getName()]   = searchResults[0].getValue(col_acqApprovedToPay);
	objReturn[col_opsApprovedToPay.getName()]   = searchResults[0].getValue(col_opsApprovedToPay);
	objReturn["payoutType"]                     = searchResults[0].getValue(col_payoutType);
	objReturn[col_glAccount.getName()]          = searchResults[0].getValue(col_glAccount);
	objReturn["glAccount"]                      = searchResults[0].getValue(col_glAccount);
	
	var glAccounts = [];
	
	for (ix in searchResults) {
		var id = searchResults[ix].getValue(col_glAccountsId);
		
		if (id) {			
			var glAccount = {};
			glAccount["name"]         = searchResults[ix].getValue(col_glAccountsName);
			glAccount["internalid"]   = id;
			var accountRec            = nlapiLoadRecord('account', id);		
			glAccount["currency"]     = accountRec.getFieldValue("currency");
			glAccounts.push(glAccount);
		}		
	}
	
	objReturn["glAccounts"] = glAccounts;
	
	return objReturn;

//	var derColumns = ['custrecord_pay_import_approved_pay',
//						'custrecord_pay_import_acq_approved_pay',
//						'custrecord_pay_import_glaccounts'
//						'custrecord_pay_import_glaccount'];
//	return nlapiLookupField('customrecord_payment_import_record', derID, derColumns);
	
}

/*
 * Governance: 10pts
 */
function getDeal(dealid){
	var filters = [];
	filters.push(new nlobjSearchFilter('internalid', null, 'is', dealid));

    var desiredFields = ['custentity_acq_deal_lotach', // ACH Fee
                        'custentity_qx_acq_deal_domesticcheck', // Domestic Check Fee
                        'custentity_qx_acq_deal_internationalchec', // Domestic Wire Fee
                        'custentity_qx_acq_deal_domesticwire', // Domestic Wire Fee
                        'custentity_qx_acq_deal_internationalwire', // International Wire Fee
//                        'custentity_qx_acq_deal_aes_ach', // AES ACH Fee
//                        'custentity_qx_acq_deal_aes_domestic_chck', // AES Domestic Check Fee
//                        'custentity_qx_acq_deal_aes_intl_check', // AES International Check
//                        'custentity_qx_acq_deal_aes_domestic_wire', // AES Domestic Wire Fee
//                        'custentity_qx_acq_deal_aes_intl_wire', // AES International Wire Fee
                        'custentity_qx_acq_deal_wirefeeswaived', // Wire Fees Waived if Greater Than
                        'custentity_acq_finaldealapproval',	// Counsel Appoved to Pay - Compliance
                        'custentity_acq_payment_account'	// ACQUIOM PAYMENT ACCOUNT
    ];
                        // NOTE: these are all found under the Acquiom Ticket tab on Customer form

    var searchResults = performSearchWithSingleResult(desiredFields, 'customer', filters);
    return storeSingleSearchResult(searchResults);
}

function performSearchWithSingleResult(desiredFields, recordType, filters) {
	// TODO: this could be genericized to return a range of results
	try {
		var columns = [];
	    for(var i = 0; i < desiredFields.length; i++) {
	        
	    	// ATP-1298
	        if (typeof desiredFields[i] === 'object') { 
	        	columns.push(new nlobjSearchColumn(desiredFields[i].name ,desiredFields[i].join ,desiredFields[i].summary));
	        }
	        else { columns.push(new nlobjSearchColumn(desiredFields[i])); }
	        // end ATP-1298
	    }
	    var search = nlapiCreateSearch(recordType, filters, columns);	// nlobjSearch
	    var searchResultsSet = search.runSearch();	// nlobjSearchResultSet
	    var searchResults = searchResultsSet.getResults(0,1000); // array of nlobjSearchResult 
	    return searchResults;
	} catch(e) {
		nlapiLogExecution('ERROR', e, e.getDetails());
	}
}

function storeSingleSearchResult(searchResults) {
	var resultColumns = searchResults[0].getAllColumns();
    var result = {};
    for(var i = 0; i < resultColumns.length; i++) {
        result[resultColumns[i].getName()] = searchResults[0].getValue(resultColumns[i]);
    }
    return result;
}

/*
 * Returns the summation of Certificates, i.e. Payment Gross
 */
function getCertificateGross(certs){
	var total = 0,
		currentGross = 0;
	
	for(var i=0; i<certs.length; i++){
		currentGross = parseFloat(certs[i].getValue('custrecord_acq_lotce_zzz_zzz_payment'));
		
		if(!isNaN(currentGross)){
			total += currentGross;
		}
	}
	
	return total.toFixed(2);
}

/*
 * Governance: ???pts
 */
function getLOTFields(exchangeRecord, deal, profile, msg, dealEventRecord){
	var lotFields = {};
	var	isVendorPay = false;
	
	lotFields.createdFromExRec = exchangeRecord['internalid'];
	lotFields.exchangeRecordID = exchangeRecord['internalid'];
	lotFields.payoutType = exchangeRecord['custrecord_acq_lot_payout_type'];
	lotFields.customForm = 138;
	lotFields.status = 1;
	lotFields.shareholder = exchangeRecord['custrecord_acq_loth_zzz_zzz_shareholder'];
	lotFields.aclass = 51;	// "Client Accounts - Acquiom"
	lotFields.dept = 20; // "Client Accounts - Acquiom"
	lotFields.profileCMemoLineItem = profile['custrecord_acq_lot_cmemo_share_line_item'];
	lotFields.profileCMemoEntity = profile['custrecord_acq_lot_cmemo_entity'];

	lotFields.waiveFees = exchangeRecord['custrecord_exrec_waive_fees']; // ATP-1123
	if (exchangeRecord['custrecord_payout_waive_fees'] == 'T') { lotFields.payoutTypeWaiveFees = true; } else { lotFields.payoutTypeWaiveFees = false; } // ATP-1298
	if (exchangeRecord['custrecord_acq_lot_pri_pmt_waive_fees'] == 'T') { lotFields.priorityPaymentTypeWaiveFees = true; } else { lotFields.priorityPaymentTypeWaiveFees = false; } // ATP-1543

nlapiLogExecution("AUDIT", "getLOTFields-E", JSON.stringify(exchangeRecord));
nlapiLogExecution("AUDIT", "getLOTFields-L", JSON.stringify(lotFields));


	// Pulled from the DEAL customer ticket, if any of these fees are not set, then throw an error message.


//	isVendorPay = parseInt(lotFields.payoutType) == 20;
//	
//	if(deal['custentity_acq_deal_lotach'] != null) {
//		lotFields.feeACH = isVendorPay ? 0.00 : deal['custentity_acq_deal_lotach'] || null;
//	} else {
//		msg.addMessage('\'ACH Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_domesticcheck'] != null) {
//		lotFields.feeCheckDom = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_domesticcheck'] || null;
//	} else {
//		msg.addMessage('\'Domestic Check Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_internationalchec'] != null) {
//		lotFields.feeCheckInt = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_internationalchec'] || null;
//	} else {
//		msg.addMessage('\'Domestic Wire Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_domesticwire'] != null) { 
//		lotFields.feeWireDom = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_domesticwire'] || null;
//	} else {
//		msg.addMessage('\'International Check Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_internationalwire'] != null) {
//		lotFields.feeWireInt = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_internationalwire'] || null;
//	} else {
//		msg.addMessage('\'International Wire Fee\' the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_aes_ach'] != null) {
//		lotFields.feeAESACH = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_aes_ach'] || null;
//	} else {
//		msg.addMessage('\'AES ACH Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_aes_domestic_chck'] != null) {
//		lotFields.feeAESDomCheck = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_aes_domestic_chck'] || null;
//	} else {
//		msg.addMessage('\'AES Domestic Check Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_aes_intl_check'] != null) {
//		lotFields.feeAESIntlCheck = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_aes_intl_check'] || null;
//	} else {
//		msg.addMessage('\'AES International Check Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_aes_domestic_wire'] != null) {
//		lotFields.feeAESDomWire = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_aes_domestic_wire'] || null;
//	} else {
//		msg.addMessage('\'ACH Domestic Wire Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_aes_intl_wire'] != null) {
//		lotFields.feeAESIntlWire = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_aes_intl_wire'] || null;
//	} else {
//		msg.addMessage('\'AES International Wire Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');
//	}
//	if(deal['custentity_qx_acq_deal_wirefeeswaived'] != null) {
//		lotFields.feeWaivedAmt = isVendorPay ? 0.00 : deal['custentity_qx_acq_deal_wirefeeswaived'] || null;
//	} else {
//		msg.addMessage('\'Wire Fees Waived if Greater Than\' under LOT FEES Group on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');
//	}


	if (deal['custentity_acq_deal_lotach']               != null)	{ lotFields.feeACH 			= deal['custentity_acq_deal_lotach'];	} 
	else { msg.addMessage('\'ACH Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');	}
	
	if (deal['custentity_qx_acq_deal_domesticcheck']     != null)	{ lotFields.feeCheckDom 	= deal['custentity_qx_acq_deal_domesticcheck'];	} 
	else { msg.addMessage('\'Domestic Check Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');	}
	
	if (deal['custentity_qx_acq_deal_internationalchec'] != null)	{ lotFields.feeCheckInt 	= deal['custentity_qx_acq_deal_internationalchec'];	} 
	else { msg.addMessage('\'Domestic Wire Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');	}
	
	if (deal['custentity_qx_acq_deal_domesticwire']      != null)	{ lotFields.feeWireDom 		= deal['custentity_qx_acq_deal_domesticwire'];	} 
	else { msg.addMessage('\'International Check Fee\' on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');	}
	
	if (deal['custentity_qx_acq_deal_internationalwire'] != null)	{ lotFields.feeWireInt 		= deal['custentity_qx_acq_deal_internationalwire'];	} 
	else { msg.addMessage('\'International Wire Fee\' the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');	}
	
//	if (deal['custentity_qx_acq_deal_aes_ach']           != null)	{ lotFields.feeAESACH 		= deal['custentity_qx_acq_deal_aes_ach'];	} 
//	else { msg.addMessage('\'AES ACH Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');	}
//	
//	if (deal['custentity_qx_acq_deal_aes_domestic_chck'] != null)	{ lotFields.feeAESDomCheck 	= deal['custentity_qx_acq_deal_aes_domestic_chck'];	} 
//	else { msg.addMessage('\'AES Domestic Check Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');	}
//	
//	if (deal['custentity_qx_acq_deal_aes_intl_check']    != null)	{ lotFields.feeAESIntlCheck	= deal['custentity_qx_acq_deal_aes_intl_check'];	} 
//	else { msg.addMessage('\'AES International Check Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');	}
//	
//	if (deal['custentity_qx_acq_deal_aes_domestic_wire'] != null)	{ lotFields.feeAESDomWire 	= deal['custentity_qx_acq_deal_aes_domestic_wire'];	} 
//	else { msg.addMessage('\'ACH Domestic Wire Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');	}
//	
//	if (deal['custentity_qx_acq_deal_aes_intl_wire']     != null)	{ lotFields.feeAESIntlWire 	= deal['custentity_qx_acq_deal_aes_intl_wire'];	} 
//	else { msg.addMessage('\'AES International Wire Fee\' on the the DEAL > ACQUIOM TICKET tab needs to be set.  Cannot be empty, but can be 0.00');	}
//	
//	if (deal['custentity_qx_acq_deal_wirefeeswaived']    != null)	{ lotFields.feeWaivedAmt 	= deal['custentity_qx_acq_deal_wirefeeswaived'];	} 
//	else { msg.addMessage('\'Wire Fees Waived if Greater Than\' under LOT FEES Group on the the DEAL > ACQUIOM TICKET tab need to be set.  Cannot be empty, but can be 0.00');	}
	
	
	lotFields.finalFunding = (dealEventRecord['custrecord_pay_import_approved_pay'] == 'T') &&
							(dealEventRecord['custrecord_pay_import_acq_approved_pay'] == 'T') &&
							(deal['custentity_acq_finaldealapproval'] == 'T');
	lotFields.recType = 'customrecord_acq_lot';
	lotFields.relatedCreditMemo = exchangeRecord['custrecord_acq_loth_related_trans'];
	lotFields.relatedCustomerRefund = exchangeRecord['custrecord_acq_loth_related_refund'];
	// ATP-427
	var paymentAccount = deal['custentity_acq_payment_account'];
	if (dealEventRecord['custrecord_pay_import_glaccount']) { paymentAccount = dealEventRecord['custrecord_pay_import_glaccount']; }
	
	lotFields.paymentAccount = paymentAccount;
	// end ATP-427
	if(lotFields.paymentAccount == 11940 || lotFields.paymentAccount == 3023) {
		lotFields.aclass = 38; // "Client Accounts - SRS" 
		lotFields.dept = 18;	// "Client Accounts - SRS"
	}

	// DEAL & SHAREHOLDER
	lotFields.lotStatus = exchangeRecord['custrecord_acq_loth_zzz_zzz_acqstatus'] || null;
	lotFields.deal = exchangeRecord['custrecord_acq_loth_zzz_zzz_deal'] || null;//TODO: Update this to use deal.getId();
	lotFields.shareholderHash = exchangeRecord['custrecord_acq_loth_zzz_zzz_shrhldhash'] || null;

	// DE1 FIELDS FROM EXCHANGE RECORD
	lotFields.de1Name = exchangeRecord['custrecord_acq_loth_1_de1_shrhldname'] || null;
	lotFields.de1Addr1 = exchangeRecord['custrecord_acq_loth_1_de1_shrhldaddr1'] || null;
	lotFields.de1Addr2 = exchangeRecord['custrecord_acq_loth_1_de1_shrhldaddr2'] || null;
	lotFields.de1City = exchangeRecord['custrecord_acq_loth_1_de1_shrhldcity'] || null;
	lotFields.de1State = exchangeRecord['custrecord_acq_loth_1_de1_shrhldstate_text'] || null;
	lotFields.de1Zip = exchangeRecord['custrecord_acq_loth_1_de1_shrhldpostalcd'] || null;
	lotFields.de1Country = exchangeRecord['custrecord_acq_loth_1_de1_shrhldcountry'] || null;
	lotFields.de1CountryText = exchangeRecord['custrecord_acq_loth_1_de1_shrhldcountry_text'] || null;
	lotFields.de1Alterations = exchangeRecord['custrecord_acq_loth_0_de1_alterations'] || null;
	lotFields.de1ReviewNotes = exchangeRecord['custrecord_acq_loth_0_de1_notes'] || null;
	lotFields.de2Alterations = exchangeRecord['custrecord_acq_loth_0_de2_alterations'] || null;
	lotFields.de2ReviewNotes = exchangeRecord['custrecord_acq_loth_0_de2_notes'] || null;

	// LOT PAYMENT METHOD
	lotFields.payMethod = exchangeRecord['custrecord_acq_loth_4_de1_lotpaymethod'] || null;
	lotFields.payMethodName = exchangeRecord['custrecord_acq_loth_4_de1_lotpaymethod_text'] || null;
	lotFields.cleanedPayMethodName = getCleanPayMethodName(lotFields.payMethodName) || null;

	// ACH BANK INFO FROM EXCHANGE RECORD
	lotFields.bankabaRouting = exchangeRecord["custrecord_acq_loth_5a_de1_abaswiftnum"] || null;
	lotFields.bankAccount = exchangeRecord["custrecord_acq_loth_5a_de1_bankacctnum"] || null;
	lotFields.bankabaVerified = false;
	lotFields.bankabaName = '';
	lotFields.bankAcctType = exchangeRecord['custrecord_acq_loth_5a_de1_bankaccttype'] || null;
	lotFields.bankNamesOn = exchangeRecord['custrecord_acq_loth_5a_de1_nameonbnkacct'] || null;
	lotFields.bankName = exchangeRecord['custrecord_acq_loth_5a_de1_bankname'] || null;
	lotFields.bankAddr1 = exchangeRecord['custrecord_acq_loth_5a_de1_bankaddr'] || null;
	lotFields.bankCity = exchangeRecord['custrecord_acq_loth_5a_de1_bankcity'] || null;
	lotFields.bankState = exchangeRecord['custrecord_acq_loth_5a_de1_bankstate'] || null;
	lotFields.bankZip = exchangeRecord['custrecord_acq_loth_5a_de1_bankzip'] || null;
	lotFields.bankContactName = exchangeRecord['custrecord_acq_loth_5a_de1_bankcontact'] || null;
	lotFields.bankContactPhone = exchangeRecord['custrecord_acq_loth_5a_de1_bankphone'] || null;

	// WIRE BANK INFO
	lotFields.wirebankNamesOn = exchangeRecord['custrecord_acq_loth_5b_de1_nameonbnkacct'] || null;
	lotFields.wirebankAccount = exchangeRecord['custrecord_acq_loth_5b_de1_bankacctnum'] || null;
	lotFields.wirebankabaRouting = exchangeRecord['custrecord_acq_loth_5b_de1_abaswiftnum']  || null;
	lotFields.wirebankName = exchangeRecord['custrecord_acq_loth_5b_de1_bankname'] || null;
	lotFields.wirebankAddr1 = exchangeRecord['custrecord_acq_loth_5b_de1_bankaddr'] || null;
	lotFields.wirebankCity = exchangeRecord['custrecord_acq_loth_5b_de1_bankcity'] || null;
	lotFields.wirebankState = exchangeRecord['custrecord_acq_loth_5b_de1_bankstate'] || null;
	lotFields.wirebankZip = exchangeRecord['custrecord_acq_loth_5b_de1_bankzip'] || null;
	lotFields.wirebankContactName = exchangeRecord['custrecord_acq_loth_5b_de1_bankcontact'] || null;
	lotFields.wirebankContactPhone = exchangeRecord['custrecord_acq_loth_5b_de1_bankphone'] || null;
	lotFields.wirebankFurtherAcct = exchangeRecord['custrecord_acq_loth_5b_de1_frthrcrdtacct'] || null;
	lotFields.wirebankFurtherName = exchangeRecord['custrecord_acq_loth_5b_de1_frthrcrdtname'] || null;

	// PAYEE ADDRESS FROM EXCHANGE RECORD
	lotFields.payAddr1 = exchangeRecord['custrecord_acq_loth_1_de1_shrhldaddr1'] || null;
	lotFields.payAddr2 = exchangeRecord['custrecord_acq_loth_1_de1_shrhldaddr2'] || null; 
	lotFields.payCity = exchangeRecord['custrecord_acq_loth_1_de1_shrhldcity'] || null;
	lotFields.payState = exchangeRecord['custrecord_acq_loth_1_de1_shrhldstate'] || null;
	lotFields.payZip = exchangeRecord['custrecord_acq_loth_1_de1_shrhldpostalcd'] || null;
	lotFields.payPhone = exchangeRecord['custrecord_acq_loth_1_de1_shrhldphone'] || null;
	lotFields.payCountry = exchangeRecord['custrecord_acq_loth_1_de1_shrhldcountry'] || null;

	// CHECK MAIL ADDRESS FROM EXCHANGE RECORD
	lotFields.checkAddr1 = exchangeRecord['custrecord_acq_loth_5c_de1_checksaddr1'] || null;
	lotFields.checkAddr2 = exchangeRecord['custrecord_acq_loth_5c_de1_checksaddr2'] || null;
	lotFields.checkCity = exchangeRecord['custrecord_acq_loth_5c_de1_checkscity'] || null; 
	lotFields.checkState = exchangeRecord['custrecord_acq_loth_5c_de1_checksstate'] || null;

	lotFields.checkZip = exchangeRecord['custrecord_acq_loth_5c_de1_checkszip'] || null;
	//lotFields.checkZip = exchangeRecord.getFieldText('custrecord_acq_loth_5c_de1_checkszip') || null;
	lotFields.checkCountry = exchangeRecord['custrecord_acq_loth_5c_de1_checkscountry'] || null;
	lotFields.checkCountryText = exchangeRecord['custrecord_acq_loth_5c_de1_checkscountry_text'] || null;
	lotFields.checkPayTo = exchangeRecord['custrecord_acq_loth_5c_de1_checkspayto'] || null;
	lotFields.checkMailTo = exchangeRecord['custrecord_acq_loth_5c_de1_checksmailto'] || null;

	if(msg.getMessages() && msg.getMessages().length){
		msg.setStatusError();
	}
	
	if(!lotFields.finalFunding) {
		// ATP-168
		var approvalMessage = '';
		if(dealEventRecord['custrecord_pay_import_approved_pay'] != 'T' || dealEventRecord['custrecord_pay_import_acq_approved_pay'] != 'T') {
			approvalMessage += 'DER missing Operations and/or Acquiom Approved to Pay.</br>'
		}
		if(deal['custentity_acq_finaldealapproval'] != 'T') {
			approvalMessage += 'Deal missing Counsel Approved to Pay.</br>'
		}
		msg.setStatusError();
		msg.addMessage(approvalMessage);
	}
	
	//ACH check for bank verification
	if(lotFields.cleanedPayMethodName == 'ach' || lotFields.cleanedPayMethodName == 'aes_ach') {
		
		var results = getACHBankName(lotFields.bankabaRouting);
		
		if(results == null || results == '') {
			msg.setStatusError();
			msg.addMessage('Could not verify ACH Routing number from SRS database.');
		} else {
			lotFields.bankabaVerified = true;
		}
	}

	//Validate Domestic Wire ABA number. If invalid then fail and set error message to display on UI 
	if(lotFields.cleanedPayMethodName == 'domestic_wire' 
		|| lotFields.cleanedPayMethodName == 'aes_domestic_wire'
		|| lotFields.cleanedPayMethodName == 'domestic_wire_to_bank'
		|| lotFields.cleanedPayMethodName == 'domestic_wire_to_brokerage') {
		
		//Check that tests if there is a value and it is exactly nine digits
		var isAbaNumber = validateABAorSWIFT(lotFields.wirebankabaRouting);
		
		if( isAbaNumber.valid ) {
			var results = getWireBankName(lotFields.wirebankabaRouting);
			if(!results || results.length == 0) {
				msg.setStatusError();
				msg.addMessage('Could not verify Wire Routing number from SRS database.');
			} else {
				lotFields.wirebankabaVerified = true;
			}
		} else {
			lotFields.wirebankabaVerified = false;
			msg.setStatusError();
			msg.addMessage( isAbaNumber.message );
			//msg.addMessage('ABA/SWIFT is not in a valid format or is missing.');
		}
	} 

	return lotFields;
}

/*
 * Governance: 10pts
 */
function getExchangeRecord(exrecid) {
	var filters = [];
	filters.push(new nlobjSearchFilter('internalid', null, 'is', exrecid));

	var desiredFieldsTextAndValue = [ 'custrecord_acq_loth_5c_de1_checkscountry' // NEED BOTH VALUE AND TEXT
									 ,'custrecord_acq_loth_1_de1_shrhldcountry'  // NEED BOTH VALUE AND TEXT
									 ,'custrecord_acq_loth_4_de1_lotpaymethod'   // NEED BOTH VALUE AND TEXT                      
									 ,'custrecord_acq_loth_1_de1_shrhldstate'    // NEED BOTH VALUE AND TEXT
									 ,'custrecord_acq_loth_zzz_zzz_shareholder'  // NEED BOTH VALUE AND TEXT
									];	
	
	var desiredFieldsText = [ 'custrecord_acq_loth_5a_de1_bankstate'    // NEED TEXT
							 ,'custrecord_acq_loth_5b_de1_bankstate'    // NEED TEXT
							 ,'custrecord_acq_loth_5c_de1_checksstate'  // NEED TEXT
							 ,'custrecord_suspense_reason'              // NEED TEXT
		                    ];
		
	var desiredFieldsValue = [ 'custrecord_exrec_waive_fees',
		'custrecord_exrec_waive_fees',
		'internalid',
		'custrecord_acq_lot_payout_type',
		'custrecord_acq_loth_related_trans',
		'custrecord_acq_loth_related_refund',

		// Deal & Shareholder
		'custrecord_acq_loth_zzz_zzz_acqstatus',
		'custrecord_acq_loth_zzz_zzz_deal',
		'custrecord_acq_loth_zzz_zzz_shrhldhash',

		// DE1 fields
		'custrecord_acq_loth_1_de1_shrhldname',
		'custrecord_acq_loth_1_de1_shrhldaddr1',
		'custrecord_acq_loth_1_de1_shrhldaddr2',
		'custrecord_acq_loth_1_de1_shrhldcity',
		'custrecord_acq_loth_1_de1_shrhldpostalcd',
		//'custrecord_acq_loth_1_de1_shrhldcountry',
		'custrecord_acq_loth_0_de1_alterations',
		'custrecord_acq_loth_0_de1_notes',
		'custrecord_acq_loth_0_de2_alterations',
		'custrecord_acq_loth_0_de2_notes',

		// LOT payment method
		//'custrecord_acq_loth_4_de1_lotpaymethod',

		// ACH info
		'custrecord_acq_loth_5a_de1_abaswiftnum',
		'custrecord_acq_loth_5a_de1_bankacctnum',
		'custrecord_acq_loth_5a_de1_bankaccttype',
		'custrecord_acq_loth_5a_de1_nameonbnkacct',
		'custrecord_acq_loth_5a_de1_bankname',
		'custrecord_acq_loth_5a_de1_bankaddr',
		'custrecord_acq_loth_5a_de1_bankcity',
		'custrecord_acq_loth_5a_de1_bankzip',
		'custrecord_acq_loth_5a_de1_bankcontact',
		'custrecord_acq_loth_5a_de1_bankphone',

		// Wire bank info
		'custrecord_acq_loth_5b_de1_nameonbnkacct',
		'custrecord_acq_loth_5b_de1_bankacctnum',
		'custrecord_acq_loth_5b_de1_abaswiftnum',
		'custrecord_acq_loth_5b_de1_bankname',
		'custrecord_acq_loth_5b_de1_bankaddr',
		'custrecord_acq_loth_5b_de1_bankcity',
		'custrecord_acq_loth_5b_de1_bankzip',
		'custrecord_acq_loth_5b_de1_bankcontact',
		'custrecord_acq_loth_5b_de1_bankphone',
		'custrecord_acq_loth_5b_de1_frthrcrdtacct',
		'custrecord_acq_loth_5b_de1_frthrcrdtname',

		// Payee address
		'custrecord_acq_loth_1_de1_shrhldphone',

		// Check Mail address
		'custrecord_acq_loth_5c_de1_checksaddr1',
		'custrecord_acq_loth_5c_de1_checksaddr2',
		'custrecord_acq_loth_5c_de1_checkscity',
		'custrecord_acq_loth_5c_de1_checkszip',
		//'custrecord_acq_loth_5c_de1_checkscountry',
		'custrecord_acq_loth_5c_de1_checkspayto',
		'custrecord_acq_loth_5c_de1_checksmailto',

		// ATP-168 Payments Dashboard looks at DER
		'custrecord_acq_lot_payment_import_record'
//		// ATP-453 Use PI info if linked 
//		'custrecord_exrec_payment_instruction',
//		'custrecord_exrec_paymt_instr_hist'
	];
	
	var desiredFieldsValueJoinSummary = [ {'name':'custrecord_payout_waive_fees'          ,'join':'custrecord_acq_lot_payout_type' ,'summary':null } // ATP-1298
										 ,{'name':'custrecord_payout_no_override_ref_txt' ,'join':'custrecord_acq_lot_payout_type' ,'summary':null } // ATP-1365
										 ,{'name':'custrecord_acq_lot_pri_pmt_waive_fees' ,'join':'custrecord_acq_lot_priority_payment' ,'summary':null } // ATP-1543
										];


	try {

		var desiredFields = desiredFieldsTextAndValue.concat(desiredFieldsText ,desiredFieldsValue ,desiredFieldsValueJoinSummary); // ATP-1298
		var searchResults = performSearchWithSingleResult(desiredFields, 'customrecord_acq_lot', filters);
		var resultColumns = searchResults[0].getAllColumns();

		var exchangeRecord = {};
		
		for (var i = 0; i < desiredFieldsTextAndValue.length; i++) { // get VALUE and TEXT
			exchangeRecord[desiredFieldsTextAndValue[i]]           = searchResults[0].getValue(desiredFieldsTextAndValue[i]);
			exchangeRecord[desiredFieldsTextAndValue[i] + '_text'] = searchResults[0].getText(desiredFieldsTextAndValue[i]);
		}
		for (var i = 0; i < desiredFieldsText.length; i++) { // get TEXT
			exchangeRecord[desiredFieldsText[i]] = searchResults[0].getText(desiredFieldsText[i]);
		}
		for (var i = 0; i < desiredFieldsValue.length; i++) { // get VALUE for the rest
			exchangeRecord[desiredFieldsValue[i]] = searchResults[0].getValue(desiredFieldsValue[i]);
		}

		// ATP-1298
		for (var i = 0; i < desiredFieldsValueJoinSummary.length; i++) { // get VALUE for the complcated ones
			exchangeRecord[desiredFieldsValueJoinSummary[i].name] = searchResults[0].getValue(desiredFieldsValueJoinSummary[i].name  
					                                                                         ,desiredFieldsValueJoinSummary[i].join
					                                                                         ,desiredFieldsValueJoinSummary[i].summary);
		}
		// end ATP-1298
				
		return exchangeRecord;
	} catch (e) {
		nlapiLogExecution('ERROR', e, e.getDetails());
	}
}

/*
 * Governance: 10pts
 */
//Returns nlobjSearhResult; use getField/getValue
function getProcessPaymentRecord(batchNumber){
	try{
		var processPayment = getQueuedProcessPayment(batchNumber);
		
		if(processPayment && processPayment.length){
			return processPayment[0];
		}
		
		return null;
	}
	catch(err){
		nlapiLogExecution('Error', 'error retrieving process payment object', err);
		return null;
	}
}



/*
 * 
 * Create functions for creating payment approval objects; e.g. PiraclePayment, CreditMemo, CustomerRefund
 * 
 */

/*
 * Governance: 60pts
 */
//ATP-1981 commented out
//function createPiraclePayment(lotFields, msg) {
//	takeTimestamp("start createPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//	var ppayObj = {};
//	nlapiLogExecution('AUDIT', 'createPiraclePayment', 'createPiraclePayment');
//	try {
//		var sHolderRec = nlapiLoadRecord('customer', lotFields.shareholder), //10pts TODO: Can this be turned into a search?
//			ppRec = nlapiCreateRecord('customrecord_pp_ach_account'); //10pts
//
//		ppRec.setFieldValue('name', sHolderRec.getFieldValue('name') || sHolderRec.getFieldValue('nameorig'));
//		ppRec.setFieldValue('custrecord_pp_ach_entity', lotFields.shareholder);
//		ppRec.setFieldValue('custrecord_pp_ach_account_number', lotFields.bankAccount);
//		ppRec.setFieldValue('custrecord_pp_ach_routing_number', lotFields.bankabaRouting);
//		ppRec.setFieldValue('custrecord_pp_ach_deposit_withdrawal', 1); // Ken and Alex 2018-10-15
//
//		var bankType = lotFields.bankAcctType;
//
//		if (bankType == 1 || bankType == 3) { // 1: Checking  3: Commercial Checking
//			ppRec.setFieldValue('custrecord_pp_ach_transaction_code', 7);
//		} else if (bankType == 2 || bankType == 4) { // 2: Savings  4: Commercial Savings
//			ppRec.setFieldValue('custrecord_pp_ach_transaction_code', 8);
//		}
//
//		ppRec.setFieldValue('custrecord_pp_ach_is_primary', "T");
//		ppRec.setFieldValue('custrecord_pp_ach_sec_code', 4); //CCD=1;CTX=2;IAT=3;PPD=4;EDI=5;
//
//		try {
//			takeTimestamp("createPiraclePayment bef submitrec"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//			ppayObj.id = nlapiSubmitRecord(ppRec); //20pts
//			takeTimestamp("createPiraclePayment aft submitrec"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//		} catch (e) {
//			nlapiLogExecution('ERROR', 'createPiraclePayment CREATE exception', e.message);
//			var err = e;
//			msg.setStatusError();
//			msg.addMessage('Problem submitting the Piracle ACH record. ' + e.message);
//
//			ppayObj.id = null;
//			ppayObj.error = true;
//
//			nlapiLogExecution('ERROR', 'Submit Piracle ACH Record Error', err);
//
//			takeTimestamp("end 1 createPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//			return ppayObj;
//		}
//
//		//sHolderRec.setFieldValue("custentity_pp_ach_enabled", "T");
//		//sHolderRec.setFieldValue("custentity_pp_ach_account_number", lotFields.bankAccount);
//		//sHolderRec.setFieldValue("custentity_pp_ach_deposit_withdrawal", 1);  //Deposit = 1; Withdrawal = 2;
//
//		try {
//			//ppayObj.sholder = nlapiSubmitRecord(sHolderRec);//20pts
//			//nlapiSubmitRecord(sHolderRec);
//
//			var fields = new Array();
//			var values = new Array();
//			fields.push('custentity_pp_ach_enabled');
//			values.push("T");
//			fields.push('custentity_pp_ach_account_number');
//			values.push(lotFields.bankAccount);
//			fields.push('custentity_pp_ach_deposit_withdrawal');
//			values.push(1); //Deposit = 1; Withdrawal = 2;
//			takeTimestamp("createPiraclePayment bef shldr SF"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//			nlapiSubmitField('customer', lotFields.shareholder, fields, values);
//			takeTimestamp("createPiraclePayment aft shldr SF"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//
//			ppayObj.sholder = lotFields.shareholder;
//
//		} catch (e) {
//			nlapiLogExecution('ERROR', 'createPiraclePayment ATTACH exception', e.message);
//			var err = e;
//			msg.setStatusError();
//			msg.addMessage('Problem attaching the Piracle ACH record to the Shareholder. ' + e.message); // !!!!
//
//			ppayObj.error = true;
//
//			nlapiLogExecution('ERROR', 'SUBMIT PIRACLE ACH RECORD FAILED FOR EXREC ' + lotFields.exchangeRecordID, err);
//		}
//
//		takeTimestamp("end 2 createPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//		return ppayObj;
//	} catch (e) {
//		nlapiLogExecution('ERROR', 'createPiraclePayment OTHER exception', e.message);
//		msg.addMessage('Unable to create Piracle ACH record.');
//		msg.setStatusError();
//
//		ppayObj.error = true;
//
//		//TeejNits Error Handling Code
//		var vDebug = "";
//
//		for (var prop in err) {
//
//			vDebug += "property: " + prop + " value: [" + err[prop] + "]\n";
//
//		}
//
//		vDebug += "toString(): " + " value: [" + err.toString() + "]";
//
//		nlapiLogExecution('ERROR', 'CREATE PIRACLE RECORD FOR EXREC ' + lotFields.exchangeRecordID, vDebug);
//	}
//
//	takeTimestamp("end 3 createPiraclePayment"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//	return ppayObj;
//}
/*
 * Governance: ???pts
 */
function createCreditMemo(lotFields, _fee, msg ,zeroDollarCreditMemoAndNoCreditRefund){
	//var profileRec = nlapiLoadRecord('customrecord_acq_lot_profile', 1);
	msg.setStatusSuccess();
	
	if (lotFields.exchangeRecordID != null) {
		var creditMemoExists = lotFields.relatedCreditMemo && lotFields.relatedCreditMemo != ' ';
			duplicate = false;
		
		if(creditMemoExists) {
			msg.addMessage('Credit Memo #' + lotFields.relatedCreditMemo + ' already exists.');
			
			duplicate = true;
		}
		
		if(msg.returnMessages.length > 0) {
	    	msg.setStatusError();
	    	
	    	return {error: true, duplicate: duplicate};
	    };
  
	    // IF THERE ARE NO CREDIT MEMOS FOUND THEN CREATE A NEW CREDIT MEMO.
		takeTimestamp("bef nlapiCreateRecord creditmemo" );
		var cMemo = nlapiCreateRecord('creditmemo', {recordmode: 'dynamic'});
		takeTimestamp("aft nlapiCreateRecord creditmemo" );
		
		//Set the form template to use
		cMemo.setFieldValue('customform', lotFields.customForm); //133
		cMemo.setFieldValue('entity', lotFields.shareholder);
		cMemo.setFieldValue('status', lotFields.status); // 1
		cMemo.setFieldValue('class', lotFields.aclass); //46
		
		// cMemo.setFieldValue('autoapply' ,'F'); // ATO-7

		//Get the AR Account from the Entity (Class) and use that in the credit memo
		//The next section added by Ken Crossman 2016-09-20
		takeTimestamp("bef classrec nlapiLoadRecord" );
        var classrec = nlapiLoadRecord('classification', cMemo.getFieldValue('class'));
		takeTimestamp("aft classrec nlapiLoadRecord" );
        var araccount = classrec.getFieldValue('custrecord_ar_account');

        if( !araccount ){
        	msg.addMessage('Entity (Class) ' + lotFields.aclass + ' has no AR Account');
        	msg.setStatusError();
			
			return {error: true};
        };

        cMemo.setFieldValue('account', araccount);
    
		// DEAL TRACKING GROUP
		cMemo.setFieldValue('custbodyacq_deal_link', lotFields.deal);
		cMemo.setFieldValue('custbody_acq_shash', lotFields.shareholderHash);
		cMemo.setFieldValue('custbody_acq_lot_createdfrom_exchrec', lotFields.exchangeRecordID);
		cMemo.setFieldValue('department', lotFields.dept);
		cMemo.setFieldValue('custbody_acq_finalfunding', lotFields.finalFunding ? 'T' : 'F');
		
		// If there are any errors at this point, do not continue and return the error messages.
		if(msg.returnMessages.length > 0) {
			msg.setStatusError();
			
			return {error: true};
		};
		
		/* Grab the native NetSuite 'States' list (NOT 'State List') and create an array so that it can be reference by name and not number.
		*  This is needed because there are two different list for states and internal ids do not match
		*/

		// TODO: Make this work.
		var statesJSON = profileRec.getFieldValue('custrecord_acq_lot_state_list_map');
		var statesReference = JSON.parse(statesJSON);	
			takeTimestamp("bef stateListrec nlapiLoadRecord" );
		var stateListrec = nlapiLoadRecord('customrecord_states', 1);
			takeTimestamp("aft stateListrec nlapiLoadRecord" );
		var statesNative = stateListrec.getField('custrecord_state_netsuite'),
			states = statesNative.getSelectOptions(),
			stateRef = [];
		for(var state in states) {
			var currentID = states[state].id;
			var currentText = states[state].text;
			stateRef[currentText] = currentID;
		}

		// ATP-1874
//    	cMemo.setCurrentLineItemValue('item', 'department', lotFields.dept);
//    	cMemo.setCurrentLineItemValue('item', 'class', lotFields.aclass);

    	var dept   = lotFields.dept;
		var entity = lotFields.aclass;
		var objPayoutType = nlapiLookupField('customrecord_payment_type', dealEventRecord["payoutType"], ['custrecord_payout_payment_dept' ,'custrecord_payout_payment_entity']);
		if (objPayoutType["custrecord_payout_payment_dept"])   { dept   = objPayoutType["custrecord_payout_payment_dept"]    }
		if (objPayoutType["custrecord_payout_payment_entity"]) { entity = objPayoutType["custrecord_payout_payment_entity"]  }
		cMemo.setFieldValue('department' ,dept);
		cMemo.setFieldValue('class'      ,entity);
		// end ATP-1874
		/* Create line items on the Credit Memo for certificates and fees.  Keep track of total balance with lineItemTotal
		*  because if the credit memo is negative it will not submit.  If fees are greater than the payout, return an error.
		*/
		var lineItemTotal = 0.00;
		//var certSearchResults = getCertificates(lotFields.exchangeRecordID, msg); ATP-1790 This line moved
		var certCurrency;
		var cmemoCurrency;

		//Loop to sum all certificates amount that will act as our Payment Gross that we will test against our fee.
		for (var sLoop = 0; certSearchResults != null && sLoop < certSearchResults.length; sLoop++){
			takeTimestamp("certSearch loop " + sLoop + " of " + certSearchResults.length);
        	var certItemRow = certSearchResults[sLoop],
        		certDescription = certItemRow.getValue('custrecord_acq_lotce_3_de1_certdesc'),
        		certPayAmount = certItemRow.getValue('custrecord_acq_lotce_zzz_zzz_payment');
        	
        	// THIS REQUIRES CERTIFICATES TO HAVE AN AMOUNT, OR THROWS AN ERROR AND BAILS OUT.  AMOUNT CAN BE 0.00 BUT NOT EMPTY OR NULL
        	if(certPayAmount == null || certPayAmount == '') {
        		
        		nlapiLogExecution('ERROR', 'ERROR certPayAmount WAS INVALID', certPayAmount);
        		
				msg.addMessage('Unable to commit line item on the Credit Memo because the certPayAmount is null or empty on the Certificate record with ID ' + certSearchResults[sLoop].getId());
				msg.setStatusError();
				
				return {error: true};
        	}

        	if(certPayAmount != null || certPayAmount != '') {
        		var symbol = certItemRow.getValue('symbol', 'custrecord_acq_lotce_zzz_zzz_currencytyp');
        		if (isNaN(Number(symbol))) { // Ignore Stock Certs,  only currencies with alpha symbols are cash currencies, stocks have numeric symbols
            		lineItemTotal += parseFloat(certPayAmount);
        		}
        		else { certPayAmount = 0; } // Stock Shares cert, credit memo will have zero amount
        	} //Redundant check

        	
        	var certNumber = certItemRow.getValue('custrecord_acq_lotce_3_de1_certnumber');
        	certCurrency = certItemRow.getValue('custrecord_acq_lotce_zzz_zzz_currencytyp');
        	
        	if (!cmemoCurrency) { // make sure we get a cash currency for Credit Memo mainline currency
        		var fieldValueSymbol   = certItemRow.getValue('symbol' ,'custrecord_acq_lotce_zzz_zzz_currencytyp');
        		var symbol = fieldValueSymbol.toString().trim();
        		if (isNaN(Number(symbol))) { // isNaN: Non-Numeric symbol means it is a cash currency, save it
        			cmemoCurrency = certCurrency;
        		}
        	}
        	
        	cMemo.selectNewLineItem('item');
        	cMemo.setCurrentLineItemValue('item', 'item', lotFields.profileCMemoLineItem); //261
        	cMemo.setCurrentLineItemValue('item', 'quantity', 1 );
        	cMemo.setCurrentLineItemValue('item', 'description', certDescription );
        	cMemo.setCurrentLineItemValue('item', 'custcol_acq_certnum', certNumber );
        	cMemo.setCurrentLineItemValue('item', 'currency', certCurrency );
        	// ATO-34
        	if (zeroDollarCreditMemoAndNoCreditRefund) {
            	cMemo.setCurrentLineItemValue('item', 'amount', 0);
            	cMemo.setCurrentLineItemValue('item', 'rate', 0);
        	}
        	else {
            	cMemo.setCurrentLineItemValue('item', 'amount', certPayAmount);
            	cMemo.setCurrentLineItemValue('item', 'rate', certPayAmount);
        	}
        	// end ATO-34
        	//cMemo.setCurrentLineItemValue('item', 'class', lotFields.profileCMemoEntity); //51
        	cMemo.setCurrentLineItemValue('item' ,'department' ,dept);
        	cMemo.setCurrentLineItemValue('item' ,'class'      ,entity);
        	cMemo.commitLineItem('item');
		}
		takeTimestamp("certSearch loop ended"); // certCurrency
		
		if (cmemoCurrency) { cMemo.setFieldValue('currency', cmemoCurrency); }

		// Add Line Item Processing Fees pulled from the Deal record
		var fee = 0.00,
			negativeBalance = false,
			testNegBal = function(lineItemTotal, fee) { if((lineItemTotal + fee) < 0) { return true; } else { return false; } },
			isOverride = _fee != 'false',
			feeOverride = isOverride ? parseFloat(_fee) : 0,
			tempFeeType = null;
	
		//Set fee based on 
		switch (lotFields.cleanedPayMethodName) {
		    case "ach": //Add ACH Fee
		    	tempFeeType = lotFields.feeACH;
				break;
		    case "aes_ach": //Add ACH Fee
		   		tempFeeType = lotFields.feeAESACH;
				break;
		    case "domestic_check": // Add Domestic Checkf
		    	tempFeeType = lotFields.feeCheckDom;
				break;
		    case "aes_domestic_check": // Add Domestic Check
		    	tempFeeType = lotFields.feeAESDomCheck;
				break;
		    case "international_check":
		    	tempFeeType = lotFields.feeCheckInt;
				break;
		    case "aes_international_check":
		    	tempFeeType = lotFields.feeAESIntlCheck;
				break;
		    case "domestic_wire_to_brokerage":
		    case "domestic_wire_to_bank":
		    case "domestic_wire":
		   		tempFeeType = lotFields.feeWireDom;
				break;
		    case "aes_domestic_wire":
		    	tempFeeType = lotFields.feeAESDomWire;			    	
				break;
		    case "international_wire_to_brokerage":
		    case "international_wire_to_bank":
		    case "international_wire":
		   		tempFeeType = lotFields.feeWireInt;
				break;
		    case "aes_international_wire":
		    	tempFeeType = lotFields.feeAESIntlWire;
				break;
		}
		
		// ATO-147
		if (lineItemTotal > 0 && lotFields.waiveFees < 1) { // ATP-1123 (added waiveFees test)
//			// ATO-37 There will be no fee for Escheated, SentToBuyer, DebtRepayment
//			fee = 0;
//			var payoutType_Escheated     = 22;
//			var payoutType_SentToBuyer   = 23;
//			var payoutType_DebtRepayment = 24;
//			if ( lotFields.payoutType == payoutType_Escheated || lotFields.payoutType == payoutType_SentToBuyer || lotFields.payoutType == payoutType_DebtRepayment) 
//			   { tempFeeType = null; }
//			// end ATO-37
			if ( lotFields.payoutTypeWaiveFees || lotFields.priorityPaymentTypeWaiveFees) { tempFeeType = null; } // ATP-1298		// ATP-1543 added check for lotFields.priorityPaymentTypeWaiveFees 
			if(tempFeeType) {
				fee = -Math.abs(isOverride ? feeOverride : tempFeeType);
				if(testNegBal(lineItemTotal, fee) == false) {
					fee = processAddLineItemFee(lotFields.cleanedPayMethodName, fee, cMemo);
				}
			}
		}
		else { fee = 0; }
		// end ATO-147
		
		// ATP-1808
		var lineCount = cMemo.getLineItemCount('apply');
		for(var i=1; i<=lineCount; i++){
			cMemo.selectLineItem('apply', i);			
			var applyLine   = cMemo.getCurrentLineItemValue('apply', 'line');
			var applyID     = cMemo.getCurrentLineItemValue('apply', 'doc');
			var applyChk    = cMemo.getCurrentLineItemValue('apply', 'apply');
			var applyDue    = cMemo.getCurrentLineItemValue('apply', 'due');
			var applyTotal  = cMemo.getCurrentLineItemValue('apply', 'total');
			var applyAmount = cMemo.getCurrentLineItemValue('apply', 'amount');
			nlapiLogExecution('DEBUG','ATP-1808 Apply'
					, "Line:"             + applyLine
                    + ",    applyID:"     + applyID
                    + ",    applyChk:"    + applyChk
                    + ",    applyDue:"    + applyDue
                    + ",    applyTotal:"  + applyTotal
                    + ",    applyAmount:" + applyAmount
					);
			cMemo.setCurrentLineItemValue('apply', 'apply', 'T');
			cMemo.setCurrentLineItemValue('apply', 'amount', applyDue);
			cMemo.commitLineItem('apply');
		}
		// ATP-1808 END

		//TODO: Double check with Sue/Glenn/Barry about this check. Seems it should apply to all.
		//if((lineItemTotal + fee) < 0 && (lotFields.cleanedPayMethodName == 'domestic_wire' || lotFields.cleanedPayMethodName == 'international_wire')) {
		var totalAmount = lineItemTotal + fee;
		if( totalAmount < 0 && lotFields.cleanedPayMethodName  != 'payroll') {
			msg.addMessage('Unable to process this transaction because it would create a negative balance.</p><p>The total certificate proceeds are $' + lineItemTotal + '.<p>The bank transaction fees are $' + fee + '.');
			msg.setStatusError();
			
			return {error: true};//TODO: Return appropriate object representing Credit Memo
		}
		
		if(msg.returnMessages.length > 0) {
			msg.setStatusError();

			return {error: true};//TODO: Return appropriate object representing Credit Memo
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
				//DE1 Information
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', lotFields.payAddr1 || null);
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', lotFields.payAddr2 || null);
				cMemo.setFieldValue('custbody_aqm_1_payeecity', lotFields.payCity || null);
				cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.payState] || null);
				//cMemo.setFieldValue('custbody_aqm_1_payeestate', lotFields.payState || null);
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
		    case "domestic_wire_to_brokerage":
		    case "domestic_wire_to_bank":
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
		    case "international_wire_to_brokerage":
		    case "international_wire_to_bank":
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
				cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[lotFields.de1City] || null);
				cMemo.setFieldValue('custbody_aqm_1_payeezip', lotFields.payZip || null);
				cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', lotFields.payPhone || null);
				cMemo.setFieldValue('custbody_aqm_1_payeecountry', lotFields.payCountry || null);
		    	break;
	    }

	    try {
	    	takeTimestamp("createCreditMemo bef nlapiSubmitRecord");
	    	var autoApply = cMemo.getFieldValue('autoapply');
	    	nlapiLogExecution('AUDIT','ATP-1808' ,"Credit Memo autoApply:"  + autoApply );
	    	var cMemoID = nlapiSubmitRecord(cMemo);	
	    	takeTimestamp("createCreditMemo aft nlapiSubmitRecord");
	    	
			// ATO-112
	    	// If the user has chosen to create transactions for the next business day then update the trandate here			
			var process_effective_date = rcdPaymentProcess.getFieldValue('custrecord_process_effective_date');
			if (process_effective_date) {
				nlapiLogExecution('AUDIT' ,'Updating Credit Memo trandate to ' ,process_effective_date );
				try {  nlapiSubmitField('creditmemo' ,cMemoID ,'trandate' ,process_effective_date);  } 
				catch(etd2) { nlapiLogExecution('ERROR' ,'Updating Credit Memo trandate exception: ' ,etd2.message ); }
			}
			// END ATO-112
	    	
	    	var cmemo = {};
	    	cmemo.id = cMemoID;
	    	// ATO-112
	    	cmemoData       = nlapiLookupField('creditmemo', cMemoID, ['tranid' ,'trandate']);
	    	cmemo.tranid    = cmemoData.tranid;
	    	cmemo.trandate  = cmemoData.trandate;  
			cMemo.setFieldValue('trandate' ,cmemoData.trandate);
	    	lotFields.cMemo = cmemo;
	    	return { cMemo:cMemo ,totalAmount:totalAmount ,trandate:cmemo.trandate };
			// END ATO-112

	    } catch (e) {
	    	msg.setStatusError();
			msg.addMessage(e);
	    	nlapiLogExecution('ERROR','FAIL', JSON.stringify( e ) );
	    	return {error: 'error', id: cMemoID};//TODO: Return appropriate object representing Credit Memo
	    }
	}
}

/*
 * Governance: ???pts
 */
function createCustomerRefund(lotFields, msg){
	
	var custRefund = {};
	
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
		var cMemoID = lotFields.cMemo.id,
			custID = lotFields.shareholder,
			dealID = lotFields.deal,
			acctID = null,
			payMethod = lotFields.payMethod,
			payeeName = '';
		
		if(dealID != null && dealID != '') {
			acctID = lotFields.paymentAccount;
		}

		if( payMethod == 12 || payMethod == 13 ) {

			// 12 - International Wire to Brokerage
			// 13 - International Wire to Bank
			payMethod = 5; // International Wire

		} else if( payMethod == 14 || payMethod == 15 ) {
			// 14 - Domestic Wire to Brokerage
			// 15 - Domestic Wire to Bank
			payMethod = 4; // Domestic Wire
		}
		if( payMethod == 6 ) {
			// If paymethod is Payroll, there is nothing to see here	
			return {skipped: true}; //TODO: Update this to appropriate object
		}
		
		// Load Credit Memo so we can get fiels off them.
		takeTimestamp("createCustomerRefund bef getCreditMemo");
		var cMemo = getCreditMemo(cMemoID); // TODO: can we just use the existing creditMemoObject to get these fields isntead of searching again?
		takeTimestamp("createCustomerRefund bef nlapiCreateRecord");
		var cRefund = nlapiCreateRecord('customerrefund', {recordmode: 'dynamic', customform: 140}); 
		takeTimestamp("createCustomerRefund aft nlapiCreateRecord");
		
		// Set required fields on the customer refund
		cRefund.setFieldValue('customer',custID);
		cRefund.setFieldValue('currency',cMemo['currency']);

		// ATP-427 alex
		for (ix in dealEventRecord["glAccounts"]) {
			if (cMemo['currency'] == dealEventRecord["glAccounts"][ix].currency) { acctID = dealEventRecord["glAccounts"][ix].internalid; }
		}
		// end ATP-427

		cRefund.setFieldValue('account',acctID);
//		// ATP-427 alex (This LOGIC has been moved to function getLOTFields   )
//		nlapiLogExecution('DEBUG','Alex/427', 'glAccounts: ' + JSON.stringify( dealEventRecord["glAccounts"] ) );
//		for (ix in dealEventRecord["glAccounts"]) {
//			if (cMemo['currency'] == dealEventRecord["glAccounts"][ix].currency) { 
//				nlapiLogExecution('DEBUG','Alex/427', 'setting Account: ' + JSON.stringify( dealEventRecord["glAccounts"][ix] ) );
//				cRefund.setFieldValue('account',dealEventRecord["glAccounts"][ix].internalid);  
//			}
//		}
//		// end ATP-427
		cRefund.setFieldValue('custbody_acq_lot_createdfrom_exchrec', lotFields.createdFromExRec);
		
		/**********************************************************************
		 * THERE ARE TWO DIFFERENT PAYMENT METHOD LIST THAT NEED TO BE SET
		 * ONE HAS THE FIELD ID OF paymentmethod (under Setup > Accounting >
		 * Accounting List) AND IS THE NATIVE NETSUITE FIELD AND THE OTHER IS
		 * custbody_acq_lot_payment_method_3
		 **********************************************************************/
		
		var leadingZeroFlag = false;
		try {
			if(payMethod != null && payMethod != '') {
				// ATP-1981 commenting out AVID references
				// NOTE: field 'custpage_no_update_ach' is a pseudo field that is used to prevent some Avid processing from occurring
				//       since we will not un-install the Avid bundle immediately we will leave that field here 
				//       once that bundle has been un-installed we can remove those lines
				cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
				cRefund.setFieldValue('custbody_pp_payment_method', 4); // 4. Do Not Process with Piracle Pay
				if(payMethod == 1) { // 1 is ACH
					cRefund.setFieldValue('paymentmethod', 9); // 9 is ACH
//					ATP-1981					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//					ATP-1981					cRefund.setFieldValue('custbody_pp_payment_method', 2); // 2. ACH
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
//					ATP-1981					var piracle = lotFields.piracle;
//					ATP-1981					cRefund.setFieldValue('custbody_pp_ach_account', piracle.id);
				} else if (payMethod == 2 || payMethod == 3) { // 2 and 3 are Domestic Check and Intl Check so set as 2 Check
//					ATP-1981					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
					cRefund.setFieldValue('paymentmethod', 2);
//					ATP-1981					cRefund.setFieldValue('custbody_pp_payment_method', 1); // 1. Check
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
					leadingZeroFlag = true;
				} else if (payMethod == 4 || payMethod == 5) { // 4 and 5 are Domestic Wire and Intl Wire so set as 7 Wire
					cRefund.setFieldValue('paymentmethod', 7);
//					ATP-1981					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//					ATP-1981					cRefund.setFieldValue('custbody_pp_payment_method', 4); // 4. Do Not Process with Piracle Pay
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
				} else if(payMethod == 7 ){ //AES ACH
					cRefund.setFieldValue('paymentmethod', 12);
//					ATP-1981					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//					ATP-1981					cRefund.setFieldValue('custbody_pp_payment_method', 2); // 4. Process as ACH
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
//					ATP-1981					var piracle = lotFields.piracle;
//					ATP-1981					cRefund.setFieldValue('custbody_pp_ach_account', piracle.id);
				} else if(payMethod == 8 || payMethod == 9){ //AES Check
//					ATP-1981					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
					cRefund.setFieldValue('paymentmethod', 11);
//					ATP-1981					cRefund.setFieldValue('custbody_pp_payment_method', 1); // 4. Do Not Process with Piracle Pay
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
					leadingZeroFlag = true;
				} else if(payMethod == 10 || payMethod == 11){ //AES Wire
					cRefund.setFieldValue('paymentmethod', 13);
//					ATP-1981					cRefund.setFieldValue('custpage_no_update_ach','T'); // This prevents the Piracle scripts from over riding the custbody_pp_payment_method setting
//					ATP-1981					cRefund.setFieldValue('custbody_pp_payment_method', 4); // 4. Do Not Process with Piracle Pay
					cRefund.setFieldValue('custbody_acq_lot_payment_method_3', payMethod); // Sets the 'LOT PAYMENT METHOD' on the 'PAYMENT INFORMATION' tab
				}
			} else {
				msg.addMessage('Payment Method is null and cannot be set on the Customer Refund');
			}
		} catch (e) {
			msg.addMessage('Problem setting the NetSuite field \'paymentmethod\'');
			msg.addMessage(e.getCode() + ': ' + e.getDetails() + '; ' + e.getStackTrace());
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
			
			return {error: 'error'};//TODO: Update this to appropriate object
		};
		
		// COPY THE REST OF THE BANKING INFORMATION FROM THE CREDIT MEMO TO THE CUSTOMER REFUND
		cRefund.setFieldValue('custbody_aqm_1_abaroutingnumber', cMemo['custbody_aqm_1_abaroutingnumber']);
		cRefund.setFieldValue('custbody_aqm_1_bankaccountnumber', cMemo['custbody_aqm_1_bankaccountnumber']);
		cRefund.setFieldValue('custbody_aqm_1_accounttype', cMemo['custbody_aqm_1_accounttype']);
		cRefund.setFieldValue('custbody_aqm_1_namesonbankaccount', cMemo['custbody_aqm_1_namesonbankaccount']);
		cRefund.setFieldValue('custbody_aqm_1_bankname', cMemo['custbody_aqm_1_bankname']);
		cRefund.setFieldValue('custbody_aqm_1_bankaddress', cMemo['custbody_aqm_1_bankaddress']);
		cRefund.setFieldValue('custbody_aqm_1_bankaddresscity', cMemo['custbody_aqm_1_bankaddresscity']);
		cRefund.setFieldValue('custbody_aqm_1_bankaddressstate', cMemo['custbody_aqm_1_bankaddressstate']);
		cRefund.setFieldValue('custbody_aqm_1_bankaddresszip', cMemo['custbody_aqm_1_bankaddresszip']);
		cRefund.setFieldValue('custbody_aqm_1_nameofbankcontactperson', cMemo['custbody_aqm_1_nameofbankcontactperson']);
		cRefund.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', cMemo['custbody_aqm_1_phonenumberofbankcontac']);

		cRefund.setFieldValue('custbody_aqm_1_forfurthercreditaccount', cMemo['custbody_aqm_1_forfurthercreditaccount']);
		cRefund.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', cMemo['custbody_aqm_1_2forfurthercreditaccoun']);
		cRefund.setFieldValue('custbody_aqm_1_swiftiban', cMemo['custbody_aqm_1_swiftiban']);
		cRefund.setFieldValue('entity', cMemo['entity']);
		cRefund.setFieldValue('class', cMemo['class']);
		cRefund.setFieldValue('custbodyacq_deal_link', cMemo['custbodyacq_deal_link']);
		cRefund.setFieldValue('department', cMemo['department']);
		
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
		cRefund.setFieldValue('custbody_aqm_1_payeeaddress1', cMemo['custbody_aqm_1_payeeaddress1']);
		cRefund.setFieldValue('custbody_aqm_1_payeecity', cMemo['custbody_aqm_1_payeecity']);
		cRefund.setFieldValue('custbody_aqm_1_payeestate', cMemo['custbody_aqm_1_payeestate']);
		cRefund.setFieldValue('custbody_aqm_1_payeezip', cMemo['custbody_aqm_1_payeezip']);
		
		setRefundAddress(cRefund, lotFields);
		
		var lineCount = cRefund.getLineItemCount('apply');

		for(var i=1; i<=lineCount; i++){
			cRefund.selectLineItem('apply', i);
			
			var applyID = cRefund.getCurrentLineItemValue('apply', 'doc'),
				amountRemaining = cRefund.getCurrentLineItemValue('apply', 'due');
			
			if ( applyID == cMemoID ) {
				cRefund.setCurrentLineItemValue('apply', 'apply', 'T');
				cRefund.setCurrentLineItemValue('apply', 'amount', amountRemaining);
				cRefund.commitLineItem('apply');
			}
		}
		
		if(msg.returnMessages.length > 0) {
			msg.setStatusError();
			
			return {error: 'error'};//TODO: Update this to appropriate object
		};
		
		// Following code commented out by Ken 2018-10-30 and replaced by try-catch modified by Alex See ATP-442
		// try {
	
		// 	custRefund.id = nlapiSubmitRecord(cRefund, true, true);
	
		// 	// unique check number is created from the last three digits of the GL Account Number and the 
		// 	// internal ID of the Customer Refund we just created.
		// 	var accountNumber = nlapiLookupField('account', acctID, 'number');
	
		// 	accountNumber = accountNumber.substring(accountNumber.length-3, accountNumber.length);
		
		// 	if(leadingZeroFlag) {
		// 		// due to AvidXchange bug, cannot process checks with leading zeroes in the checknumber
		// 		accountNumber = parseInt(accountNumber, 10).toString();
		// 	}
			
		// 	var checkNumber = accountNumber + custRefund.id;
		// 	nlapiSubmitField('customerrefund', custRefund.id, 'tranid', checkNumber);
		// 	custRefund.tranid = checkNumber;

		// } catch (e) {
		// 	var err = e;
		// 	nlapiLogExecution('ERROR', 'FAILED TO SUBMIT CUSTOMER REFUND RECORD FOR EXREC ' + lotFields.exchangeRecordID, JSON.stringify(e));
			
		// 	return {error: 'error'};
			
		// }
		try {
			// unique check nbr created from last 3 digits of the GL Account Nbr and internal ID of the Credit Memo we just created.
			var accountNumber = "";
			var accountNumberFull = nlapiLookupField('account', acctID, 'number');
			var accountNumber3 = accountNumberFull.substring(accountNumberFull.length-3, accountNumberFull.length);
			if(leadingZeroFlag) {
				// due to AvidXchange bug, cannot process checks with leading zeroes in the checknumber
				accountNumber = parseInt(accountNumber3, 10).toString();
			} else { accountNumber = accountNumber3; }
			
			var checkNumber = accountNumber + cMemoID.toString();
			
			try {
				nlapiLogExecution('DEBUG','ACQ_LOT_DA_ProcessPayment_Library.js', 'cMemoID:' + cMemoID 
                        + ",    accountNumberFull:" + accountNumberFull 
                        + ",   accountNumber3:" + accountNumber3 
                        + ",   accountNumber:" + accountNumber 
                        + ",   checkNumber:" + checkNumber + "." );
			} 
			catch(e99) {}
			
			cRefund.setFieldValue('tranid', checkNumber);
			
			takeTimestamp("createCustomerRefund bef nlapiSubmitRecord");
			custRefund.id = nlapiSubmitRecord(cRefund, true, true);
			takeTimestamp("createCustomerRefund aft nlapiSubmitRecord");
			
			try { nlapiSubmitField('customerrefund' ,custRefund.id ,['custbody_pp_payment_method'] ,[4]); } catch(eIgnore) {} // ATP-1981 - Make sure AVID Exchange payment method is AVID DO NOT PROCESS
			
			// It was commenting out this next line which led to the Credit Memo Payment Reference Number being set to "ACHID: undefined" 
			// and which led to ticket ATP-559
			custRefund.tranid = checkNumber; // Replaced by Ken 2018-12-05 9:01pm 
	    	
			// ATO-112
	    	// If the user has chosen to create transactions for the next business day then update the trandate here			
			var process_effective_date = rcdPaymentProcess.getFieldValue('custrecord_process_effective_date');
			if (process_effective_date) {
				nlapiLogExecution('AUDIT' ,'Updating Cust Refund trandate to ' ,process_effective_date );
				try {  nlapiSubmitField('customerrefund' ,custRefund.id ,'trandate' ,process_effective_date);  } 
				catch(etd2) { nlapiLogExecution('ERROR' ,'Updating Cust Refund trandate exception: ' ,etd2.message ); }
			}
			// END ATO-112

			// nlapiLogExecution('DEBUG','ACQ_LOT_DA_ProcessPayment_Library.js', 'custRefund.id:' + custRefund.id );
					
		} catch (e) {
			var err = e;
			nlapiLogExecution('ERROR', 'FAILED TO SUBMIT CUSTOMER REFUND RECORD FOR EXREC ' + lotFields.exchangeRecordID, JSON.stringify(e));
			
			return {error: 'error'};
			
		}
	
		return custRefund;
	} catch (e) {
		var err = e;
		msg.addMessage('Problem setting the fields on the Customer Refund for exrec ' + lotFields.exchangeRecordID, JSON.stringify(e));
		msg.setStatusError();
		
		return {error: 'error', id: custRefund.id };
	}
}

/*
*
* Delete funtions for deleting Piracle Payment, Credit Memo, and Customer Refund
*
*/
function deleteEntity(type, entityid){
	nlapiDeleteRecord(type, entityid);
}

//Create and Add the Line Item Fees for the Payment Method
function processAddLineItemFee(itemName, amount, cMemo){
	var itemID = processGetLineItemID(itemName);
	
	cMemo.selectNewLineItem('item');
	cMemo.setCurrentLineItemValue('item', 'item', itemID);
	cMemo.setCurrentLineItemValue('item', 'quantity', 1 );
	cMemo.setCurrentLineItemValue('item', 'amount', amount);
	cMemo.setCurrentLineItemValue('item', 'department', cMemo.getFieldValue('department'));
	cMemo.setCurrentLineItemValue('item', 'class', cMemo.getFieldValue('class'));
	var fee = cMemo.getCurrentLineItemValue('item', 'amount');
	cMemo.commitLineItem('item');
	return parseFloat(fee);
}

function processGetLineItemID(itemName){
	var filterItemName = itemName + '_fee',
		filters = [],
		columns = [],
		results = null;
	
	filters.push(new nlobjSearchFilter('custitem_reference_id', null, 'is', filterItemName));
	columns.push(new nlobjSearchColumn('custitem_reference_id'));
	
	results = nlapiSearchRecord('item', null, filters, columns) || [];
	
	return results && results.length ? results[0].getId() : 0;
}

function updateProcessPaymentStatus(record, status){
	nlapiSubmitField(record.getRecordType(), record.getId(), 'custrecord_process_status', status, false);
}

function setProcessPaymentError(record, error){
	nlapiSubmitField(record.getRecordType(), record.getId(), 'custrecord_process_error', error, false);
}

function setExchangeRecordRelatedFields(exrecid, memoid, refundid, zeroDollarCreditMemoAndNoCreditRefund, memoTrandate) {  // ATO-112

	var fields = new Array(),
		values = new Array(),
		updatedfields = null;
	
	if(memoid){
		fields.push('custrecord_acq_loth_related_trans');
		values.push(memoid);
		fields.push('custrecord_exrec_payment_eff_date'); // ATO-112
		values.push(memoTrandate);                        // ATO-112
	}

	if(!zeroDollarCreditMemoAndNoCreditRefund && refundid > 0){
		fields.push('custrecord_acq_loth_related_refund');
		values.push(refundid);
	}

	fields.push('custrecord_acq_pay_approve_date');
	values.push(getDateTime());
	// Per Mitch, do not need to wipe on Delete.
	try {
		var updatedfields = nlapiSubmitField('customrecord_acq_lot', exrecid, fields, values);
	}
	catch(e) {
		nlapiLogExecution('ERROR', e.name, e.id + ': ' + e.message);
	}
}

function getDateTime() {
	var myDate = new Date();
	var currentDate = myDate.getMonth()+1 + '/' + myDate.getDate() + '/' + myDate.getFullYear();
	var hours = myDate.getHours()+1;
	var timeOfDay = 'am';
	if(hours > 12) {
		hours -= 12;
		timeOfDay = 'pm';
	}
	currentDate += ' ' + hours + ':' + myDate.getMinutes() + ':' + myDate.getSeconds() + ' ' + timeOfDay;
	return currentDate;
}

function getACHBankName(bankabaRouting) {
	if(bankabaRouting != null && bankabaRouting != '') {
		bankabaRouting = bankabaRouting.toString();
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord162', null, 'is', bankabaRouting);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord162');
		columns[1] = new nlobjSearchColumn('custrecord168');
		columns[2] = new nlobjSearchColumn('custrecord171');
		try{
			return nlapiSearchRecord('customrecord416', null, filters, columns);
		} catch(e) {
			var err = e;
			nlapiLogExecution('Error', 'getACHBankName()', e);
			return
		}
	} 
	return;
}

function getWireBankName(bankabaRouting) {
	if(bankabaRouting != null && bankabaRouting != '') {
		bankabaRouting = bankabaRouting.toString();
		var filters = new Array();
		filters[0] = new nlobjSearchFilter('custrecord153', null, 'is', bankabaRouting);
		var columns = new Array();
		columns[0] = new nlobjSearchColumn('custrecord153');
		columns[1] = new nlobjSearchColumn('custrecord155');
		columns[2] = new nlobjSearchColumn('custrecord156');
		try {
			return nlapiSearchRecord('customrecord415', null, filters, columns);
		} catch(e) {
			var err = e;
			nlapiLogExecution('Error','Error in getWireBankName()', e);
			return;
		}
	}
	return;
}

function validateABAorSWIFT(abaSwiftNum) {
	
	var check = {};
		check.valid = false;
		check.message = '';

	// This function test to see if the number is 9 digits.
	if(!abaSwiftNum || abaSwiftNum == ' '){
		check.message = 'ABA / Swift Number is empty.';
	} else {
		
		if( (abaSwiftNum + '').length != 9 ) {
			check.valid = false;
			check.message = 'ABA / Swift Number is not 9 characters long.';
		} else {
			abaSwiftNum = ( (abaSwiftNum + '').length == 8 ) ? '0' + abaSwiftNum : abaSwiftNum;
			//var pattern = /[0-9]{9}/g;
			//check.valid = pattern.test(abaSwiftNum);
			check.valid = !isNaN( abaSwiftNum );
			check.message = ( !check.valid ) ? 'ABA / Swift Number is not a numeric number.' : '';
		}
	}
	
	return check;
}

function getCleanPayMethodName(paymethod){
	if(!paymethod){ return null; }
	
	var cleanPaymethodName = paymethod.trim().replace(/[^a-z0-9A-Z\s]/g, '').replace(/\s/g, '_').toLowerCase();
	
	switch( cleanPaymethodName ) {
		case 'domestic_wire_to_bank':
		case 'domestic_wire_to_brokerage':
			cleanPaymethodName = 'domestic_wire';
			break;
		case 'international_wire_to_bank':
		case 'international_wire_to_brokerage':
			cleanPaymethodName = 'international_wire';
			break;
	}
	
	return cleanPaymethodName;
}

function setPaymentReferenceNumber(refundID, memoID, payMethod) {
	var success = true; //ATP-453
	var message = ''; //ATP-453
	var paymentReferenceNumber;
	// ATP-559 This next if statement makes no sense. There is only sense in updating the Credit Memo Payment Reference Number
	// if a Customer Refund has been created. I propose removing the if statement.
	// if(payMethod != 'payroll' || refundID != 0) { // payroll should be left blank

	switch (payMethod) {
		case "ach": //Add ACH Fee
		case "aes_ach": //Add ACH Fee
			paymentReferenceNumber = 'ACH ID: ' + refundID;
			break;
		case "domestic_check":
		case "aes_domestic_check":
		case "international_check":
		case "aes_international_check":
			paymentReferenceNumber = 'Check Issued';
			break;
		case "domestic_wire_to_brokerage":
		case "domestic_wire_to_bank":
		case "domestic_wire":
		case "aes_domestic_wire":
		case "international_wire_to_brokerage":
		case "international_wire_to_bank":
		case "international_wire":
		case "aes_international_wire":
			paymentReferenceNumber = 'Wire Initiated';
			break;
	}
	try {
		nlapiSubmitField('creditmemo', memoID, 'custbody_payment_ref_number', paymentReferenceNumber);
	} catch (e) {
		nlapiLogExecution('ERROR', e.name, e.id + ' ' + e.message);
		success = false; //ATP-453
		message = 'FAILED TO UPDATE CREDIT MEMO ' + memoID + ' with Payment Reference ' + paymentReferenceNumber; //ATP-453
	} 
	// }
	//ATP-453
	return {
		success: success,
		message: message
	}
}

function getQueuedProcessPayment(batchNumber){
	var desiredFields = ['custrecord_process_status',
						'custrecord_process_data',
						'custrecord_process_type',
						'custrecord_process_batch_number',
						'custrecord_processpayment_exrecid'
	];
	
	var filters = [];
	filters.push(new nlobjSearchFilter('custrecord_process_status', null, 'is', PROCESSSATUS.QUEUED));
	filters.push(new nlobjSearchFilter('custrecord_process_batch_number', null, 'equalto', batchNumber));

	try{
		var searchResults = performSearchWithSingleResult(desiredFields, 'customrecord_paymentprocess', filters);
	}
	catch(err){
		nlapiLogExecution('ERROR', 'ERROR RETRIEVING QUEUED PROCESS PAYMENT RECORD', err);
	}
	
	return searchResults;
}

function getQueueSearchFilters(batchNumber){
	var filters = [];
	
	filters.push(new nlobjSearchFilter('custrecord_process_status', null, 'is', PROCESSSATUS.QUEUED));
	filters.push(new nlobjSearchFilter('custrecord_process_batch_number', null, 'is', batchNumber));
	return _filters;	
}

function getQueueSearchColumns(){
	
	var columns = [];
	
	//Exchange Record fields
	columns.push(new nlobjSearchColumn('custrecord_process_status'));
	columns.push(new nlobjSearchColumn('custrecord_process_data'));
	columns.push(new nlobjSearchColumn('custrecord_process_type'));
	
	return columns;
}

function updateProcessPaymentsToReapprove(exrecid){
	
	if(!exrecid){
		return;
	}
	
	var searchObject 	= {},
		searchResultSet = {},
		searchResults = null,
		result = null;
	
	try{
		searchObject = nlapiCreateSearch('customrecord_paymentprocess', getReapproveFilters(exrecid), getReapproveColumns());
		searchResultSet = searchObject.runSearch();
		searchResults = searchResultSet.getResults(0, 1000);
	}
	catch(err){
		nlapiLogExecution('ERROR', 'ERROR RETRIEVING ERROR PROCESSPAYMENT RECORDS FOR REAPPROVE', err);
	}
	
	if(searchResults && searchResults.length){
		takeTimestamp("bef updateProcessPaymentsToReapprove"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
		for(var i=0; i<searchResults.length; i++){
			result = searchResults[i];
			
			try{
				nlapiSubmitField(result.getRecordType(), result.getId(), 'custrecord_process_status', PROCESSSATUS.REAPPROVE);
			}
			catch(err){
				nlapiLogExecution('ERROR', 'ERROR ATTEMPTING TO UPDATE STATUES FIELD TO REAPPROVE FOR ERROR PROCESSPAYMENT', err);
			}
		}
		takeTimestamp("aft updateProcessPaymentsToReapprove"); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	}
}

function getReapproveFilters(exrecid){
	var _filters = [];
	
	_filters.push(new nlobjSearchFilter('custrecord_processpayment_exrecid', null, 'equalto', exrecid));
	_filters.push(new nlobjSearchFilter('custrecord_process_status', null, 'is', PROCESSSATUS.FAILED));
	
	return _filters;
}

function getReapproveColumns(){
	
	var columns = [];
	
	//Exchange Record fields
	columns.push(new nlobjSearchColumn('custrecord_process_status'));
	
	return columns;
}
// ATP-453 	All Code added to make payment with PI info and to
// 			update Exchange Record with PI info starts here.............................................................................................................


//function convertPaymentMethodToAES(paymentMethod) {
//	//nlapiLogExecution('DEBUG', 'convertPaymentMethodToAES', 'paymentMethod: ' + paymentMethod);
//	if(paymentMethod) {
//		switch(Number(paymentMethod)) {
//			case constant.erPayMethod.ach: 		return constant.erPayMethod.aes_ach;
//			case constant.erPayMethod.domCheck: return constant.erPayMethod.aes_domCheck;
//			case constant.erPayMethod.intCheck: return constant.erPayMethod.aes_intCheck;
//			case constant.erPayMethod.domWire: 	return constant.erPayMethod.aes_domWire;
//			case constant.erPayMethod.intWire: 	return constant.erPayMethod.aes_intWire;
//		}
//	}
//}
//
//// converts Payment Instruction Medallion Status to compatible Exchange Record status value
//function convertMedallionStatus(medallionStatus) {
//	if (medallionStatus) {
//		switch (Number(medallionStatus)) {
//			case constant.piMedStatus.NotRequired: return constant.erMedStatus.NoMedallionNeeded;
//			case constant.piMedStatus.Accepted:    return constant.erMedStatus.MedallionApproved;
//			case constant.piMedStatus.Waived:      return constant.erMedStatus.CustomerElectsNoMedallion;
//			case constant.piMedStatus.Rejected:    return constant.erMedStatus.MedallionRejected;
//		}
//	}
//}
///**
// * Summary.
// * Create exRecMap object in which each property is an Exchange Record field id with a value of blank.
// * Includes all Ex Rec fields which should be blanked out before overlaying PI information
// * 
// * @return {object}  Contains a property for each Ex Rec field id which should be blanked out before overlaying PI information	
// */
//function getExRecFieldMap() {
//	var objFieldMap = {
//		custrecord_acq_loth_4_de1_lotpaymethod: '',
//		custrecord_acq_loth_4_de1_lotpaymethod_text: '',
//		custrecord_acq_loth_5a_de1_nameonbnkacct: '',
//		custrecord_acq_loth_5a_de1_bankacctnum: '',
//		custrecord_acq_loth_5a_de1_abaswiftnum: '',
//		custrecord_acq_loth_5a_de1_achverify: '',
//		custrecord_acq_loth_5a_de1_bankaccttype: '',
//		custrecord_acq_loth_5a_de1_bankname: '',
//		custrecord_acq_loth_5a_de1_bankaddr: '',
//		custrecord_acq_loth_5a_de1_bankcity: '',
//		custrecord_acq_loth_5a_de1_bankstate: '',
//		custrecord_acq_loth_5a_de1_bankzip: '',
//		custrecord_acq_loth_5a_de1_bankcontact: '',
//		custrecord_acq_loth_5a_de1_bankphone: '',
//		custrecord_acq_loth_5b_de1_nameonbnkacct: '',
//		custrecord_acq_loth_5b_de1_bankacctnum: '',
//		custrecord_acq_loth_5b_de1_wireverify: '',
//		custrecord_acq_loth_5b_de1_abaswiftnum: '',
//		custrecord_acq_loth_5b_de1_sortcode: '',
//		custrecord_acq_loth_5b_de1_bankname: '',
//		custrecord_acq_loth_5b_de1_bankaddr: '',
//		custrecord_acq_loth_5b_de1_bankcity: '',
//		custrecord_acq_loth_5b_de1_bankstate: '',
//		custrecord_acq_loth_5b_de1_bankzip: '',
//		custrecord_acq_loth_5b_de1_bankcountry: '',
//		custrecord_acq_loth_5b_de1_bankcontact: '',
//		custrecord_acq_loth_5b_de1_bankphone: '',
//		custrecord_acq_loth_5b_de1_frthrcrdtacct: '',
//		custrecord_acq_loth_5b_de1_frthrcrdtname: '',
//		//custrecord_acq_loth_5b_de1_addlinstrct: '', ATP-1365
//		custrecord_acq_loth_5c_de1_checkspayto: '',
//		custrecord_acq_loth_5c_de1_checksmailto: '',
//		custrecord_acq_loth_5c_de1_checksaddr1: '',
//		custrecord_acq_loth_5c_de1_checksaddr2: '',
//		custrecord_acq_loth_5c_de1_checksaddr3: '',
//		custrecord_acq_loth_5c_de1_checkscity: '',
//		custrecord_acq_loth_5c_de1_checkcomment: '',
//		custrecord_acq_loth_5c_de1_checksstate: '',
//		custrecord_acq_loth_5c_de1_checkszip: '',
//		custrecord_acq_loth_5c_de1_checkscountry: '',
//		custrecord_acq_loth_6_de1_medallion: '',
//		custrecord_acq_loth_6_de1_medshrhldsig: '',
//		custrecord_acq_loth_6_de1_medallionnum: '',
//		custrecord_acq_loth_zzz_zzz_medallnimage: '',
//		custrecord_acq_loth_zzz_zzz_medalliontim: '',
//		custrecord_acq_loth_zzz_zzz_medallioncas: '',
//		custrecord_acq_loth_zzz_zzz_pay_info: '',
//		custrecord_acq_loth_zzz_zzz_mdlin_status: '',
//		custrecord_payment_info_image: '',
//		custrecord_medallion_guarantee_image: ''
//	};
//	if (!gDoNotOverrideReferenceText) { // ATP-1365
//		objFieldMap["custrecord_acq_loth_5b_de1_addlinstrct"] = '';
//	} // end ATP-165
//	return objFieldMap;
//}
//
//
///**
// * Summary.
// * Converts a search result to an object with properties = the field ids and values = to the values returned for each field
// *
// * @param {string}   searchResult    	The result of a search to find and return values from the PI linked to the ER
// * 
// * @return {object}  result    			Contains a property for each PI field id with a value of the PI field just retrieved	
// */
//function storeSearchResult(searchResult) {
//    var resultColumns = searchResult.getAllColumns();
//    var result = {};
//    for(var i = 0; i < resultColumns.length; i++) {
//        result[resultColumns[i].getName()] = searchResult.getValue(resultColumns[i]);
//    }
//    return result;
//}
//
//// ATP-115 Make Payments Dashboard aware of Alpha PI - field mappings
//function getAlphaRecordColumns() {
//	return [
//		'custrecord_pi_paymethod',
//		'custrecord_pi_med_status',
//		'custrecord_pi_med_required',
//		'custrecord_pi_med_number',
//		'custrecord_pi_med_sigpresent',
//		'custrecord_pi_med_received_ts',
//		'custrecord_pi_med_image',
//		'custrecord_pi_med_case',
//		'custrecord_pi_ep_abarouting',
//		'custrecord_pi_ep_achaccttype',
//		'custrecord_pi_ep_bankname',
//		'custrecord_pi_ep_nameonbnkacct',
//		'custrecord_pi_ep_bankacctnum',
//		'custrecord_pi_ep_bankaddr',
//		'custrecord_pi_ep_bankcity',
//		'custrecord_pi_ep_bankstate',
//		'custrecord_pi_ep_bankpostal',
//		'custrecord_pi_ep_bankcontact',
//		'custrecord_pi_ep_bankphone',
//		'custrecord_pi_chk_payto',
//		'custrecord_pi_chk_mailto',
//		'custrecord_pi_chk_addr1',
//		'custrecord_pi_chk_addr2',
//		'custrecord_pi_chk_addr3',
//		'custrecord_pi_chk_city',
//		'custrecord_pi_chk_comment',
//		'custrecord_pi_chk_state',
//		'custrecord_pi_chk_zip',
//		'custrecord_pi_chk_country',
//		'custrecord_pi_ep_abarouting',
//		'custrecord_pi_ep_ffcname',
//		'custrecord_pi_ep_ffcacctnum',
//		'custrecord_pi_ep_addlinst',
//		'custrecord_pi_ep_bankname',
//		'custrecord_pi_ep_nameonbnkacct',
//		'custrecord_pi_ep_bankacctnum',
//		'custrecord_pi_ep_bankaddr',
//		'custrecord_pi_ep_bankcity',
//		'custrecord_pi_ep_bankstate',
//		'custrecord_pi_ep_bankpostal',
//		'custrecord_pi_ep_bankcountryname',
//		'custrecord_pi_ep_bankcontact',
//		'custrecord_pi_ep_bankphone',
//		'custrecord_pi_ep_imb_abarouting',
//		'custrecord_pi_ep_imb_bankname',
//		'custrecord_pi_ep_imb_nameonbnkacct',
//		'custrecord_pi_ep_imb_bankacctnum',
//		'custrecord_pi_ep_ffcname',
//		'custrecord_pi_ep_ffcacctnum',
//		'custrecord_pi_ep_swiftbic',
//		'custrecord_pi_ep_iban',
//		'custrecord_pi_ep_bankacctnum',
//		'custrecord_pi_ep_iban_sortcode',
//		'custrecord_pi_ep_addlinst',
//		'custrecord_pi_ep_bankname',
//		'custrecord_pi_ep_nameonbnkacct',
//		'custrecord_pi_ep_bankaddr',
//		'custrecord_pi_ep_bankcity',
//		'custrecord_pi_ep_bankstate',
//		'custrecord_pi_ep_bankpostal',
//		'custrecord_pi_ep_bankcountryname',
//		'custrecord_pi_ep_bankcontact',
//		'custrecord_pi_ep_bankphone',
//		'custrecord_pi_ep_imb_swiftbic'
//	];
//}
///**
// * Summary.
// * Create fieldMap object in which each property is a PI field id with a value of the Exchange Record field id to which it should be mapped
// * Only includes fields pertaining to a particular Payment Method and always the Medallion fields
// *
// * @param {string}   paymentMethod    	The id of the Payment Method 
// * 
// * @return {object}  fieldMap    		Contains a property for each PI field id with a value of the ER field to be mapped to it	
// */
//function createPiToExRecFieldMap(paymentMethod){
//	var fieldMap = {
//	    custrecord_pi_paymethod: 'custrecord_acq_loth_4_de1_lotpaymethod',
//	    custrecord_pi_med_status: 'custrecord_acq_loth_zzz_zzz_mdlin_status',
//	    custrecord_pi_med_required: 'custrecord_acq_loth_6_de1_medallion',
//	    custrecord_pi_med_number: 'custrecord_acq_loth_6_de1_medallionnum',
//	    custrecord_pi_med_sigpresent: 'custrecord_acq_loth_6_de1_medshrhldsig',
//	    custrecord_pi_med_received_ts: 'custrecord_acq_loth_zzz_zzz_medalliontim',
//	    custrecord_pi_med_image: 'custrecord_acq_loth_zzz_zzz_medallnimage',
//	    custrecord_pi_med_case: 'custrecord_acq_loth_zzz_zzz_medallioncas'
//	};
//
//	switch(Number(paymentMethod)) {
//	    case constant.piPayMethod.ach:
//	        fieldMap['custrecord_pi_ep_abarouting'] = 'custrecord_acq_loth_5a_de1_abaswiftnum';
//	        fieldMap['custrecord_pi_ep_achaccttype'] = 'custrecord_acq_loth_5a_de1_bankaccttype';
//	        fieldMap['custrecord_pi_ep_bankname'] = 'custrecord_acq_loth_5a_de1_bankname';
//	        fieldMap['custrecord_pi_ep_nameonbnkacct'] = 'custrecord_acq_loth_5a_de1_nameonbnkacct';
//	        fieldMap['custrecord_pi_ep_bankacctnum'] = 'custrecord_acq_loth_5a_de1_bankacctnum';
//	        fieldMap['custrecord_pi_ep_bankaddr'] = 'custrecord_acq_loth_5a_de1_bankaddr';
//	        fieldMap['custrecord_pi_ep_bankcity'] = 'custrecord_acq_loth_5a_de1_bankcity';
//	        fieldMap['custrecord_pi_ep_bankstate'] = 'custrecord_acq_loth_5a_de1_bankstate';
//	        fieldMap['custrecord_pi_ep_bankpostal'] = 'custrecord_acq_loth_5a_de1_bankzip';
//	        fieldMap['custrecord_pi_ep_bankcontact'] = 'custrecord_acq_loth_5a_de1_bankcontact';
//	        fieldMap['custrecord_pi_ep_bankphone'] = 'custrecord_acq_loth_5a_de1_bankphone';
//	        break;
//	    case constant.piPayMethod.domCheck:
//	    case constant.piPayMethod.intCheck:
//	        fieldMap['custrecord_pi_chk_payto'] = 'custrecord_acq_loth_5c_de1_checkspayto';
//	        fieldMap['custrecord_pi_chk_mailto'] = 'custrecord_acq_loth_5c_de1_checksmailto';
//	        fieldMap['custrecord_pi_chk_addr1'] = 'custrecord_acq_loth_5c_de1_checksaddr1';
//	        fieldMap['custrecord_pi_chk_addr2'] = 'custrecord_acq_loth_5c_de1_checksaddr2';
//	        fieldMap['custrecord_pi_chk_addr3'] = 'custrecord_acq_loth_5c_de1_checksaddr3';
//	        fieldMap['custrecord_pi_chk_city'] = 'custrecord_acq_loth_5c_de1_checkscity';
//	        fieldMap['custrecord_pi_chk_comment'] = 'custrecord_acq_loth_5c_de1_checkcomment';
//	        fieldMap['custrecord_pi_chk_state'] = 'custrecord_acq_loth_5c_de1_checksstate';
//	        fieldMap['custrecord_pi_chk_zip'] = 'custrecord_acq_loth_5c_de1_checkszip';
//	        fieldMap['custrecord_pi_chk_country'] = 'custrecord_acq_loth_5c_de1_checkscountry';
//	        break;            
//	    case constant.piPayMethod.domWire:
//	        fieldMap['custrecord_pi_ep_abarouting'] = 'custrecord_acq_loth_5b_de1_abaswiftnum';
//	        fieldMap['custrecord_pi_ep_ffcname'] = 'custrecord_acq_loth_5b_de1_frthrcrdtname';
//	        fieldMap['custrecord_pi_ep_ffcacctnum'] = 'custrecord_acq_loth_5b_de1_frthrcrdtacct';
//	        if (!gDoNotOverrideReferenceText) { // ATP-1365
//	            fieldMap['custrecord_pi_ep_addlinst'] = 'custrecord_acq_loth_5b_de1_addlinstrct';
//	        } // end ATP-1365
//	        fieldMap['custrecord_pi_ep_bankname'] = 'custrecord_acq_loth_5b_de1_bankname';
//	        fieldMap['custrecord_pi_ep_nameonbnkacct'] = 'custrecord_acq_loth_5b_de1_nameonbnkacct';
//	        fieldMap['custrecord_pi_ep_bankacctnum'] = 'custrecord_acq_loth_5b_de1_bankacctnum';
//	        fieldMap['custrecord_pi_ep_bankaddr'] = 'custrecord_acq_loth_5b_de1_bankaddr';
//	        fieldMap['custrecord_pi_ep_bankcity'] = 'custrecord_acq_loth_5b_de1_bankcity';
//	        fieldMap['custrecord_pi_ep_bankstate'] = 'custrecord_acq_loth_5b_de1_bankstate';
//	        fieldMap['custrecord_pi_ep_bankpostal'] = 'custrecord_acq_loth_5b_de1_bankzip';
//	        fieldMap['custrecord_pi_ep_bankcountryname'] = 'custrecord_acq_loth_5b_de1_bankcountry';
//	        fieldMap['custrecord_pi_ep_bankcontact'] = 'custrecord_acq_loth_5b_de1_bankcontact';
//	        fieldMap['custrecord_pi_ep_bankphone'] = 'custrecord_acq_loth_5b_de1_bankphone';
//	        fieldMap['custrecord_pi_ep_imb_abarouting'] = 'custrecord_exch_de1_imb_abarouting';
//	        fieldMap['custrecord_pi_ep_imb_swiftbic'] = 'custrecord_exch_de1_imb_swiftbic';
//	        fieldMap['custrecord_pi_ep_imb_bankname'] = 'custrecord_exch_de1_imb_bankname';
//	        fieldMap['custrecord_pi_ep_imb_nameonbnkacct'] = 'custrecord_exch_de1_imb_nameonbnkacct';
//	        fieldMap['custrecord_pi_ep_imb_bankacctnum'] = 'custrecord_exch_de1_imb_bankacctnum';
//	        break;
//	    case constant.piPayMethod.intWire:
//	        fieldMap['custrecord_pi_ep_ffcname'] = 'custrecord_acq_loth_5b_de1_frthrcrdtname';
//	        fieldMap['custrecord_pi_ep_ffcacctnum'] = 'custrecord_acq_loth_5b_de1_frthrcrdtacct';
//	        fieldMap['custrecord_pi_ep_swiftbic'] = 'custrecord_acq_loth_5b_de1_abaswiftnum';
//	        // fieldMap['custrecord_pi_ep_iban'] = 'custrecord_acq_loth_5b_de1_bankacctnum';
//	        // fieldMap['custrecord_pi_ep_bankacctnum'] = 'custrecord_acq_loth_5b_de1_bankacctnum';
//	        fieldMap['custrecord_pi_ep_iban_sortcode'] = 'custrecord_acq_loth_5b_de1_sortcode';
//	        if (!gDoNotOverrideReferenceText) { // ATP-1365
//	            fieldMap['custrecord_pi_ep_addlinst'] = 'custrecord_acq_loth_5b_de1_addlinstrct';
//	        } // end ATP-1365
//	        fieldMap['custrecord_pi_ep_bankname'] = 'custrecord_acq_loth_5b_de1_bankname';
//	        fieldMap['custrecord_pi_ep_nameonbnkacct'] = 'custrecord_acq_loth_5b_de1_nameonbnkacct';
//	        fieldMap['custrecord_pi_ep_bankaddr'] = 'custrecord_acq_loth_5b_de1_bankaddr';
//	        fieldMap['custrecord_pi_ep_bankcity'] = 'custrecord_acq_loth_5b_de1_bankcity';
//	        fieldMap['custrecord_pi_ep_bankstate'] = 'custrecord_acq_loth_5b_de1_bankstate';
//	        fieldMap['custrecord_pi_ep_bankpostal'] = 'custrecord_acq_loth_5b_de1_bankzip';
//	        fieldMap['custrecord_pi_ep_bankcountryname'] = 'custrecord_acq_loth_5b_de1_bankcountry';
//	        fieldMap['custrecord_pi_ep_bankcontact'] = 'custrecord_acq_loth_5b_de1_bankcontact';
//	        fieldMap['custrecord_pi_ep_bankphone'] = 'custrecord_acq_loth_5b_de1_bankphone';
//	        fieldMap['custrecord_pi_ep_imb_abarouting'] = 'custrecord_exch_de1_imb_abarouting';
//	        fieldMap['custrecord_pi_ep_imb_swiftbic'] = 'custrecord_exch_de1_imb_swiftbic';
//	        fieldMap['custrecord_pi_ep_imb_bankname'] = 'custrecord_exch_de1_imb_bankname';
//	        fieldMap['custrecord_pi_ep_imb_nameonbnkacct'] = 'custrecord_exch_de1_imb_nameonbnkacct'; // if IBAN is not blank
//	        fieldMap['custrecord_pi_ep_imb_bankacctnum'] = 'custrecord_exch_de1_imb_bankacctnum'; // else populate with Bank Account Number
//	        break;
//	}
//	return fieldMap;
//}
// ATP-453 Add the Credit Memo and Refund Ids to the Ex Rec fields to be updated
function addTxnFields(memoid, refundid, zeroDollarCreditMemoAndNoCreditRefund, memoTrandate, fields, values) {
	var updatedfields = null;

	if (memoid) {
		fields.push('custrecord_acq_loth_related_trans');
		values.push(memoid);
	}

	if (!zeroDollarCreditMemoAndNoCreditRefund && refundid > 0) {
		fields.push('custrecord_acq_loth_related_refund');
		values.push(refundid);
	}

	if (memoTrandate) {
		fields.push('custrecord_exrec_payment_eff_date'); // ATO-112
		values.push(memoTrandate);                        // ATO-112
	}

	fields.push('custrecord_acq_pay_approve_date');
	values.push(getDateTime());

	return {
		fields: fields,
		values: values
	}
}

// ATP-453 Update the Ex Rec using the fields and values passed 
function updateER(exrecid, exRecFields, exRecValues) {
	var thisFunction = 'updateER';
//	try {
//		nlapiLogExecution('DEBUG', thisFunction, 'exrecid: ' + JSON.stringify(exrecid));
//		nlapiLogExecution('DEBUG', thisFunction, 'exRecFields: ' + JSON.stringify(exRecFields));
//		nlapiLogExecution('DEBUG', thisFunction, 'exRecValues: ' + JSON.stringify(exRecValues));
//	} catch (e0) {} 

	var success = null;
	var message = '';
	try {
		nlapiSubmitField('customrecord_acq_lot', exrecid, exRecFields, exRecValues);
		success = true;
		message = 'Updated exchange record ' + exrecid + ' with PI information';
	} catch (e) {
		nlapiLogExecution('ERROR', thisFunction, JSON.stringify(e));
		success = false;
		message = 'Failed to update exchange record ' + exrecid + '. ' + e;
	}

	return {
		success: success,
		message: message
	}
}

//function overlayERwithPI(exchangeRecord, exRecFields, exRecValues) {
//	for (var i = 0; i < exRecFields.length; i++) {
//		exchangeRecord[exRecFields[i]] = exRecValues[i];
//	}
//	return exchangeRecord;
//}
//
///**
// * Summary.
// * Checks that Payment Method is not Payroll and that there is a linked PI
// * If so, finds the PI and returns two arrays:
// * 1) exRecFields array in which each property is an Exchange Record field id which is to be updated
// * 2) exRecValues array containing a value for each Exchange Record field id which is to be updated
// *
// * @param {string}   exrecid    		The id of the Exchange Record being paid
// * @param {string}   paymtInstrId		The id of the linked PI (if any)
// * @param {string}   exRecPaymentMethod	The id of the Exchange Record Payment Method before any PI update
// * 
// * @return {object}  success    		Indicates function has succeeded
// *					 message 			Contains any error message or success message
// *					 exRecFields      	Contains an array of Ex Rec field Ids
// * 					 exRecValues		Contains an array of Ex Rec field values to be applied 
// */
//function mapPIValuesIntoERFields(exrecid, exRecPaymentMethod, paymtInstrId) {
//	var result = {};
//	if (performPaymentInstructionProcessing && paymtInstrId) {
//		// Finds the PI linked to the Ex Rec and returns it as an object with properties = the field ids and values = to the values returned for each field
//		var myPaymentInstruction = getPaymtInstr(paymtInstrId);
//		// nlapiLogExecution('DEBUG', 'mapPIValuesIntoERFields', 'myPaymentInstruction: ' + JSON.stringify(myPaymentInstruction));
//		if (myPaymentInstruction) {
//			// Use the PI object from which to extract field values and then:
//			// return exRecFields array in which each property is an Exchange Record field id which is to be updated
//			// return exRecValues array containing a value for each Exchange Record field id which is to be updated
//			result = prepExRecFields(exrecid, myPaymentInstruction, exRecPaymentMethod);
//		}
//	}
//	return result;
//}
//
///**
// * Summary.
// * Finds the PI linked to the Ex Rec and returns it as an object with properties = the field ids and values = to the values returned for each field
// *
// * @param {string}   paymtInstrId    	The id of the PI linked to the ER
// * 
// * @return {object}  	    			Contains a property for each PI field id with a value of the PI field just retrieved	
// */
//function getPaymtInstr(paymtInstrId) {
//	var thisFunction = 'getPaymtInstr';
//	//nlapiLogExecution('DEBUG', thisFunction, 'paymtInstrId: ' + paymtInstrId);
//	var filters = [
//		['internalid', 'is', paymtInstrId], 'and', ['isinactive', 'is', 'F']
//	];
//	var columns = new Array();
//	columns.push(new nlobjSearchColumn('custrecord_pi_shareholder', null, null));
//	columns.push(new nlobjSearchColumn('custrecord_pi_exchange', null, null));
//	columns.push(new nlobjSearchColumn('custrecord_pi_deal', null, null));
//	columns.push(new nlobjSearchColumn('custrecord_pi_paymt_instr_type', null, null));
//	columns.push(new nlobjSearchColumn('internalid', null, null));
//	columns.push(new nlobjSearchColumn('custrecord_pi_onhold', null, null));
//
//	var addlColumns = getAlphaRecordColumns();
//	for (var i = 0; i < addlColumns.length; i++) {
//		columns.push(new nlobjSearchColumn(addlColumns[i], null, null));
//	}
//
//	var searchResults = nlapiSearchRecord('customrecord_paymt_instr', null, filters, columns);
//
//	// Converts a search result to an object with properties = the field ids and values = to the values returned for each field
//	return storeSearchResult(searchResults[0]);
//}
///**
// * Summary.
// * Creates exRecFields array in which each property is an Exchange Record field id which is to be updated
// * Creates exRecValues array containing a value for each Exchange Record field id which is to be updated
// *
// * @param {string}   exrecid    		The id of the Exchange Record being paid
// * @param {object}   paymentInstruction	The PI linked to the Ex Rec as an object with properties = the field ids and 
// *										values = to the values returned for each field
// * @param {string}   exRecPaymentMethod	The id of the Exchange Record Payment Method before any PI update
// * 
// * @return {object}  success    		Indicates function has succeeded
// *					 message 			Contains any error message or success message
// *					 exRecFields      	Contains an array of Ex Rec field Ids
// * 					 exRecValues		Contains an array of Ex Rec field values to be applied 
// */
//function prepExRecFields(exrecid, paymentInstruction, exRecPaymentMethod) {
//	var thisFunction = 'prepExRecFields';
////	nlapiLogExecution('DEBUG', thisFunction, 'exrecid: ' + JSON.stringify(exrecid));
////	nlapiLogExecution('DEBUG', thisFunction, 'paymentInstruction: ' + JSON.stringify(paymentInstruction));
////	nlapiLogExecution('DEBUG', thisFunction, 'exRecPaymentMethod: ' + JSON.stringify(exRecPaymentMethod));
//	var success = true;
//	var message = '';
//
//	var PIPaymentMethod = paymentInstruction['custrecord_pi_paymethod'];
//	// Create fieldMap object in which each property is a PI field id with a value of the Exchange Record field id to which it should be mapped
//	// Only includes fields pertaining to a particular Payment Method and always the Medallion fields
//	var piToExRecFieldMap = createPiToExRecFieldMap(PIPaymentMethod);
//	//nlapiLogExecution('DEBUG', thisFunction, 'fieldMap: ' + JSON.stringify(piToExRecFieldMap));
//
//	// Create exRecObj object in which each property is an Exchange Record field id with a value of blank.
//	// Includes all Ex Rec fields which should be blanked out before overlaying PI information
//	var exRecObj = getExRecFieldMap();
//
//	// For every ER field which may have a new value from a linked PI (based on Pay Method)
//	// assign the value from the PI object 
//	for (prop in piToExRecFieldMap) {
//		exRecObj[piToExRecFieldMap[prop]] = paymentInstruction[prop];
//	}
//
//	// link this exRec to the Paymt Instr History used for this information
//	var piID = paymentInstruction['internalid'];
//	var historySearchResults = getPIHistRecId(piID);
//	if (historySearchResults.length > 0) {
//		exRecObj['custrecord_exrec_paymt_instr_hist'] = historySearchResults[0].getValue('internalid');
//	}
//
//	// ATO-24/ATO-179 - Changed the if statement below to not do strict comparison
//	// Payment Method on ExRec was AES xxx - have to maintain that AES flag
////	nlapiLogExecution('DEBUG', thisFunction, 'exRecPaymentMethod: ' + JSON.stringify(exRecPaymentMethod));
////	nlapiLogExecution('DEBUG', thisFunction, 'constant.erPayMethod: ' + JSON.stringify(constant.erPayMethod));
//	if (exRecPaymentMethod == constant.erPayMethod.aes_ach || exRecPaymentMethod == constant.erPayMethod.aes_domCheck ||
//		exRecPaymentMethod == constant.erPayMethod.aes_intCheck || exRecPaymentMethod == constant.erPayMethod.aes_domWire ||
//		exRecPaymentMethod == constant.erPayMethod.aes_intWire) {
////		nlapiLogExecution('DEBUG', thisFunction, 'exRecPaymentMethod IS = to a Constant Paymethod - Conversion happening');
//		exRecObj['custrecord_acq_loth_4_de1_lotpaymethod'] = convertPaymentMethodToAES(PIPaymentMethod);
//	} else {
////		nlapiLogExecution('DEBUG', thisFunction, 'exRecPaymentMethod is NOT = to any Constant Paymethod - No conversion happening');
//	}
//
//	// Medallion Statuses draw from different lists - convert to ExRec-compatible value
//	exRecObj['custrecord_acq_loth_zzz_zzz_mdlin_status'] = convertMedallionStatus(exRecObj['custrecord_acq_loth_zzz_zzz_mdlin_status']);
//
//	// for International Wire only, IF IBAN is not blank, then populate field with IBAN, else populate with Bank Account Number.
//	if (PIPaymentMethod == constant.piPayMethod.intWire) {
//		if (paymentInstruction['custrecord_pi_ep_iban']) {
//			exRecObj['custrecord_acq_loth_5b_de1_bankacctnum'] = paymentInstruction['custrecord_pi_ep_iban'];
//		} else {
//			exRecObj['custrecord_acq_loth_5b_de1_bankacctnum'] = paymentInstruction['custrecord_pi_ep_bankacctnum'];
//		}
//	}
//
//	// Populate necessary text fields
//	exRecObj['custrecord_acq_loth_4_de1_lotpaymethod_text'] = getERPayMethodText(exRecObj['custrecord_acq_loth_4_de1_lotpaymethod']);
//	
//	// Set up what we're going to push to the Exchange Record in two arrays:
//	// exRecFields  Contains an array of Ex Rec field Ids
//	// exRecValues	Contains an array of Ex Rec field values to be applied  
//	var exRecFields = Object.keys(exRecObj);
////	nlapiLogExecution('DEBUG', thisFunction, 'exRecFields: ' + JSON.stringify(exRecFields));
//	var exRecValues = [];
//	for (prop in exRecObj) {
//		exRecValues.push(exRecObj[prop]);
//	}
////	nlapiLogExecution('DEBUG', thisFunction, 'exRecValues: ' + JSON.stringify(exRecValues));
//
//	return {
//		success: success,
//		message: message,
//		exRecFields: exRecFields,
//		exRecValues: exRecValues
//	}
//}
//
//function getERPayMethodText(payMethodId) {
//	var erPayMethod = {
//		1: 'ACH',
//		2: 'Domestic Check',
//		3: 'International Check',
//		4: 'Domestic Wire',
//		5: 'International Wire',
//		6: 'Payroll',
//		7: 'AES ACH',
//		8: 'AES DOMESTIC CHECK',
//		9: 'AES INTERNATIONAL CHECK',
//		10: 'AES DOMESTIC WIRE',
//		11: 'AES INTERNATIONAL WIRE',
//		12: 'International Wire to Brokerage',
//		13: 'International Wire to Bank',
//		14: 'Domestic Wire to Brokerage',
//		15: 'Domestic Wire to Bank'
//	};
//	if (payMethodId) {
//		return erPayMethod[payMethodId];
//	} else {
//		return '';
//	}
//}
//
//function getPIHistRecId(piID) {
//	var thisFunction = 'getPIHistRecId';
////	nlapiLogExecution('DEBUG', thisFunction, 'piID: ' + JSON.stringify(piID));
//	var historySearchResults = [];
//	var filters = [
//		['custrecord_pihs_paymt_instr', 'is', piID]
//	];
//	var columns = [
//		new nlobjSearchColumn('internalid', null, null)
//	];
//	columns[0].setSort(true); // sort in descending order
//	historySearchResults = nlapiSearchRecord('customrecord_paymt_instr_hist', null, filters, columns);
////	nlapiLogExecution('DEBUG', thisFunction, 'historySearchResults: ' + JSON.stringify(historySearchResults));
//	return historySearchResults;
//}
//
////========================================================================================================
////======================================================================================================== 
//function getAppSetting(listName ,settingName) {
//	var filters = [];
//	var columns = [];
//	filters.push( new nlobjSearchFilter('name', null,'is',settingName) );
//	filters.push( new nlobjSearchFilter('formulatext', null,'is',listName).setFormula('{custrecord_pri_as_app}') );
//	columns.push( new nlobjSearchColumn('custrecord_pri_as_value') );
//	var searchresults = nlapiSearchRecord('customrecord_pri_app_setting', null, filters, columns );
//	var value = searchresults[0].getValue('custrecord_pri_as_value');
//	
//	return value;
//}