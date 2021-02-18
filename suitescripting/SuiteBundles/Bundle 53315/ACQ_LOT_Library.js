/**
 * Module Description
 * 
 * @ FILENAME      : AcquiomLOT.js
 * @ AUTHOR        : Scott Streule, Stephen McCurry
 * @ DATE          : 2014/04/21
 * @ UPDATED DATE  : 2014/04/21
 * @ UPDATED BY    : Stephen McCurry : added error handling ERROR_MESSAGES on 05/05/14
 * Notes: This is a library containing functions that are used by multiple scripts.
 */
ERROR_MESSAGES = function(obj) { 
	this.returnMessages = new Array(); 
	this.returnRecId = null;
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


function copyPayInfoCreateCM(exchRecID) {
	// Setup new error message object for error handling 
	var msg = new ERROR_MESSAGES();
	msg.setStatusSuccess();
	
	nlapiLogExecution("DEBUG", "START of copyPayInfoCreateCM(exchRecID)", "Exchange Record ID: " + exchRecID);
	if (exchRecID != null) {
		var exRec = nlapiLoadRecord("customrecord_acq_lot", exchRecID);
		var profileRec = nlapiLoadRecord('customrecord_acq_lot_profile', 1);
		var statusLOT = exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_acqstatus');
		if(statusLOT != 5) {
			msg.addMessage('\"Acquiom Status\" is not set to Final Approved.');
			msg.setStatusError();
		}
		var sHolderID = exRec.getFieldValue("custrecord_acq_loth_zzz_zzz_shareholder"); // TODO: (smccurry 04/21/14) double check with this is correct. Should it be shareholder?
		
//		var sHolderHASH = exRec.getFieldValue("custrecord_acq_loth_zzz_zzz_shrhldhash");
		var lotPayMethod = exRec.getFieldValue("custrecord_acq_loth_4_de1_lotpaymethod");  //ACH=1;Domestic Check=2; International Check=3; Domestic Wire=4; International Wire=5;
		if(lotPayMethod == null) {
			msg.addMessage('\"LOT Pay Method\" is not selected.');
		}
		// Check to make sure there are certificates attached to this exchange record.
		if(exRec.getLineItemCount('item') == 0) {
			msg.addMessage('There are no certificates attached to this Exchange Record.  It cannot be processed.');
		}
		// If any errors by this point go ahead and return.
		if(msg.returnMessages.length > 0) {
	    	msg.setStatusError();
			return msg;
	    };
	    // Create the credit memo here, and fill in fields starting with the custbody fields
		nlapiLogExecution("DEBUG", "copyPaymentInfo", "LOT Pay method: " + lotPayMethod);
		var cMemo = nlapiCreateRecord('creditmemo', {recordmode: 'dynamic'});
		//Set the form template to use
		cMemo.setFieldValue('customform', 138); //133
		cMemo.setFieldValue('entity', exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_shareholder'));
		cMemo.setFieldValue('status', 1);// 1
		cMemo.setFieldValue('class', 51); //46
		// PAYMENT SUB TAB
		cMemo.setFieldValue('custbody_acq_lot_payment_method', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
		// DEAL TRACKING GROUP
		cMemo.setFieldValue('custbodyacq_deal_link', exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_deal'));
		cMemo.setFieldValue('custbody_acq_shash', exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_shrhldhash'));
		cMemo.setFieldValue('custbody_acq_lot_createdfrom_exchrec', exchRecID);
		cMemo.setFieldValue('department', 20); // 20 TODO: Fix this hard code value in the profile to source the correct list: profileRec.getFieldValue('custrecord_acq_lot_cmemo_department')
		
//		if(exRec.getFieldValue('') == 'F') { TODO: (smccurry 05/05/14) Need to find field for the final funding checkbox and finish these lines of code.  Not currently on the Exchange Record.
//			msg.addMessage('Could not determine final funding');
//		}
//		cMemo.setFieldValue('status', 'F');
//		cMemo.setFieldValue('entity', sHolderID);
		
		// SEARCH LOT FOR ATTACHED CERTIFICATES.
		// IS THIS SEARCH EVEN NEEDED, CAN'T WE JUST LOOP THRU THE EXCHANGE RECORD AND CHECK.
		var certSearchResults = new Array();
		var certSearchFilters = new Array();
		var certSearchColumns = new Array();
		//DO THE SEARCH FOR ASSOCIATED CERTIFICATE RECORDS HERE
		certSearchFilters[0] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot',null,'is',exchRecID);
		certSearchFilters[1] = new nlobjSearchFilter('isinactive',null,'is','F');	
//		certSearchFilters[2] = new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_lotcestatus', null, 'is', 5);
		
		certSearchColumns[0] = new nlobjSearchColumn('internalid',null,null);
		certSearchColumns[1] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certnumber',null);
		certSearchColumns[2] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certtype',null);
		certSearchColumns[3] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_certdesc',null);
		certSearchColumns[4] = new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares',null);
		certSearchColumns[5] = new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment',null);
		
		certSearchResults = nlapiSearchRecord('customrecord_acq_lot_cert_entry',null,certSearchFilters,certSearchColumns);
		if(certSearchResults == null) {
			msg.addMessage('No certificates are found attached to this exchange record.');
		}
		// If there are any errors at this point, do not continue and return the error messages.
		if(msg.returnMessages.length > 0) {
			msg.setStatusError();
			return msg;
		};
		
		/* Grab the native NetSuite 'States' list (NOT 'State List') and create an array so that it can be reference by name and not number.
		*  This is needed because there are two different list for states and internal ids do not match
		*/
		// TODO: (smccurry 05/06/14) Change this out to reference a JSON list stored in a profile field.
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
//		profile.setFieldText('custrecord_acq_lot_state_list_mapping', stateKeyValues.toString());
//		nlapiSubmitRecord(profile);
		
		//AFTER SEARCH IS COMPLETE CHECK FOR RESULTS AND STATUS OF 5 - IF NO RESULTS THEN THERE ARE NO MEMOS TO CREATE 
		// TODO: (smccurry 05/06/14) This number may change if we change the list items
		if((statusLOT == 5)&&(certSearchResults != null)){ //
			var ppRecId;
			nlapiLogExecution("DEBUG", "copyPaymentInfo.ACH", "Payment Method = " + lotPayMethod);
			//Get LOT values
			var newRoutingNum = exRec.getFieldValue("custrecord_acq_loth_5a_de1_abaswiftnum");
			var newAccountNum = exRec.getFieldValue("custrecord_acq_loth_5a_de1_bankacctnum");
			
		    switch (lotPayMethod) {
		    
		    case "1": //ach
		    	// Only loading the shareholder record here for case 1 because not needed elsewhere yet.
// ATP-1981 Commented out
//		    	var sHolderRec = nlapiLoadRecord('customer', sHolderID);
//				// Search to see if this ACH record already exists
//				var result = searchPiracleACHrecords(sHolderID, newAccountNum, newRoutingNum);
//				// If ACH record exist, load it and set ACH_is_primary to True.
//				if(result != null && result != '') {
//					var ppRec = nlapiLoadRecord('customrecord_pp_ach_account', result);
//					ppRec.setFieldValue('custrecord_pp_ach_is_primary', "T");
//					try {
//						var ppRecId = nlapiSubmitRecord(ppRec);
//					} catch (e) {
//						var err = e;
//						msg.setStatusError();
//						msg.addMessage(e);
//						nlapiLogExecution('DEBUG', 'Error on submit Piracle ACH Record', err);
//					}
//					// to make sure they are up-to-date set the entity fields on the Piracle tab on the customer record
//					sHolderRec.setFieldValue("custentity_pp_ach_enabled", "T");
//					sHolderRec.setFieldValue("custentity_pp_ach_account_number", ppRec.getFieldValue('custrecord_pp_ach_account_number'));
//					sHolderRec.setFieldValue("custentity_pp_ach_account_number", ppRec.getFieldValue('custrecord_pp_ach_routing_number'));
//					sHolderRec.setFieldValue("custentity_pp_ach_deposit_withdrawal",1);  //Deposit = 1; Withdrawal = 2;
//					// submit the customer record with the changes
//					try {
//						var sHolderID = nlapiSubmitRecord(sHolderRec);
//					} catch (e) {
//						var err = e;
//						msg.setStatusError();
//						msg.addMessage(e);
//						nlapiLogExecution('DEBUG', 'Submit Entity Record Failed', JSON.stringify(err));
//					}
//				} else {
//					// Create a new Piracle ACH record and then attach to the customer record
//					var ppRec = nlapiCreateRecord('customrecord_pp_ach_account');
//					ppRec.setFieldValue('name', sHolderRec.getFieldValue('name') || sHolderRec.getFieldValue('nameorig'));
//					ppRec.setFieldValue('custrecord_pp_ach_entity', sHolderID);
//					ppRec.setFieldValue('custrecord_pp_ach_account_number', newAccountNum);
//					ppRec.setFieldValue('custrecord_pp_ach_routing_number', newRoutingNum);
//					ppRec.setFieldValue('custrecord_pp_ach_is_primary', "T");
//					ppRec.setFieldValue('custrecord_pp_ach_sec_code', 4);//CCD=1;CTX=2;IAT=3;PPD=4;EDI=5;
//					ppRec.setFieldValue('custrecord_pp_ach_transaction_code', 7);//Checking=7;Savings=8;Checking Prenote=3;Savings Prenote=4;
//					try {
//						ppRecId = nlapiSubmitRecord(ppRec);
//					} catch (e) {
//						var err = e;
//						msg.setStatusError();
//						msg.addMessage(e);
//						nlapiLogExecution('DEBUG', 'Submit Piracle ACH Record', err);
//					}
//					sHolderRec.setFieldValue("custentity_pp_ach_enabled", "T");
//					sHolderRec.setFieldValue("custentity_pp_ach_account_number", newAccountNum);
//					sHolderRec.setFieldValue("custentity_pp_ach_deposit_withdrawal",1);  //Deposit = 1; Withdrawal = 2;
//					try {
//						nlapiSubmitRecord(sHolderRec);
//					} catch (e) {
//						var err = e;
//						msg.setStatusError();
//						msg.addMessage(e);
//						nlapiLogExecution('DEBUG', 'Submit Piracle ACH Record FAILED', err);
//					}
//				}
				// PAYMENT SUB TAB
				//ACH-WIRE INFORMATION GROUP
				cMemo.setFieldValue('custbody_aqm_1_abaroutingnumber', newRoutingNum);
				cMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', newAccountNum);
				cMemo.setFieldValue('custbody_aqm_1_accounttype', exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankaccttype'));
				cMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', exRec.getFieldValue('custrecord_acq_loth_5a_de1_nameonbnkacct'));
				cMemo.setFieldValue('custbody_aqm_1_bankname', exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankname'));
				cMemo.setFieldValue('custbody_aqm_1_bankaddress', exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankaddr'));
				cMemo.setFieldValue('custbody_aqm_1_bankaddresscity', exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankcity'));
				var stateText = exRec.getFieldText('custrecord_acq_loth_5a_de1_bankstate');
				cMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[stateText] || null);
				cMemo.setFieldValue('custbody_aqm_1_bankaddresszip', exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankzip'));
				cMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankcontact'));
				cMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', exRec.getFieldValue('custrecord_acq_loth_5a_de1_bankphone'));
				cMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtacct'));
				cMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtname'));
				cMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
				
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1'));
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2')); 
				cMemo.setFieldValue('custbody_aqm_1_payeecity', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity'));
				var stateText = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldstate');
				cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[stateText] || null);
				cMemo.setFieldValue('custbody_aqm_1_payeezip', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd'));
				cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
				cMemo.setFieldValue('custbody_aqm_1_payeecountry', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry') || null);

				break;	
		    case "2":  //domestic check
				//CHECK INFORMATION & PAYEE GROUP
		    	var _5c_de1_checksaddr1 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr1');
		    	var _5c_de1_checksaddr2 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr2');
		    	var _5c_de1_checkscity = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscity'); 
		    	var _5c_de1_checksstate = exRec.getFieldText('custrecord_acq_loth_5c_de1_checksstate');
		    	var _5c_de1_checkszip = exRec.getFieldText('custrecord_acq_loth_5c_de1_checkszip');
		    	var _5c_de1_checkscountry = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscountry');
		    	// Check a few fields to make sure this is a complete enough address to use, if not then use DE1 (Form 1) fields for the address on check
		    	if(_5c_de1_checksaddr1 != null && _5c_de1_checkscity != null && _5c_de1_checksstate != null && _5c_de1_checkszip != null) {
		    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', _5c_de1_checksaddr1);
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', _5c_de1_checksaddr2);
					cMemo.setFieldValue('custbody_aqm_1_payeecity', _5c_de1_checkscity);
					var stateText;
					var _5c_de1_checksstate = exRec.getFieldText('custrecord_acq_loth_5c_de1_checksstate');
					if(_5c_de1_checksstate != null && _5c_de1_checksstate != '') {
						stateText = _5c_de1_checksstate;
					} 
					cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[stateText] || null);
					cMemo.setFieldValue('custbody_aqm_1_payeezip', _5c_de1_checkszip);
					cMemo.setFieldValue('custbody_aqm_1_payeecountry', _5c_de1_checkscountry);
		    	} else {
		    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1'));
		    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2'));
		    		cMemo.setFieldValue('custbody_aqm_1_payeecity', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity'));
		    		var stateText = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldstate');
					cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[stateText] || null);
		    		cMemo.setFieldValue('custbody_aqm_1_payeezip', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd'));
		    		cMemo.setFieldValue('custbody_aqm_1_payeecountry', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry'));
		    	}
		    	// These two fields should be the same for regardless of the above address choice
		    	cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
		    	cMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
				break;
				    
		    case "3": //international check
				//CHECK INFORMATION & PAYEE GROUP
		    	var _5c_de1_checksaddr1 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr1');
		    	var _5c_de1_checksaddr2 = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checksaddr2');
		    	var _5c_de1_checkscity = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscity'); 
		    	var _5c_de1_checksstate = exRec.getFieldText('custrecord_acq_loth_5c_de1_checksstate');
		    	var _5c_de1_checkszip = exRec.getFieldText('custrecord_acq_loth_5c_de1_checkszip');
		    	var _5c_de1_checkscountry = exRec.getFieldValue('custrecord_acq_loth_5c_de1_checkscountry');
		    	// Check a few fields to make sure this is a complete enough address to use, if not then use DE1 (Form 1) fields for the address on check
		    	if(_5c_de1_checksaddr1 != null && _5c_de1_checkscity != null && _5c_de1_checksstate != null && _5c_de1_checkszip != null) {
		    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', _5c_de1_checksaddr1);
					cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', _5c_de1_checksaddr2);
					cMemo.setFieldValue('custbody_aqm_1_payeecity', _5c_de1_checkscity);
					var stateText;
					var _5c_de1_checksstate = exRec.getFieldText('custrecord_acq_loth_5c_de1_checksstate');
					if(_5c_de1_checksstate != null && _5c_de1_checksstate != '') {
						stateText = _5c_de1_checksstate;
					} 
					cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[stateText] || null);
					cMemo.setFieldValue('custbody_aqm_1_payeezip', _5c_de1_checkszip);
					cMemo.setFieldValue('custbody_aqm_1_payeecountry', _5c_de1_checkscountry);
		    	} else {
		    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1'));
		    		cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2'));
		    		cMemo.setFieldValue('custbody_aqm_1_payeecity', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity'));
		    		var stateText = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldstate');
					cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[stateText] || null);
		    		cMemo.setFieldValue('custbody_aqm_1_payeezip', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd'));
		    		cMemo.setFieldValue('custbody_aqm_1_payeecountry', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry'));
		    	}
		    	// These two fields should be the same for regardless of the above address choice
		    	cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
		    	cMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
				break;
		    
		    case "4": //domestic wire
		    	cMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', exRec.getFieldValue('custrecord_acq_loth_5b_de1_nameonbnkacct'));
		    	cMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankacctnum')); 
				cMemo.setFieldValue('custbody_aqm_1_abaroutingnumber', exRec.getFieldValue('custrecord_acq_loth_5b_de1_abaswiftnum')); 
				cMemo.setFieldValue('custbody_aqm_1_bankname', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankname'));
				cMemo.setFieldValue('custbody_aqm_1_bankaddress', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankaddr'));
				cMemo.setFieldValue('custbody_aqm_1_bankaddresscity', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcity'));
				var stateText = exRec.getFieldText('custrecord_acq_loth_5b_de1_bankstate');
				cMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[stateText] || null);
				cMemo.setFieldValue('custbody_aqm_1_bankaddresszip', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankzip'));
				cMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcontact'));
				cMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankphone'));
				cMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtacct'));
				cMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtname'));
				cMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
				// Payee Group
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1'));
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2')); 
				cMemo.setFieldValue('custbody_aqm_1_payeecity', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity'));
				var stateText = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldstate');
				cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[stateText] || null);
				cMemo.setFieldValue('custbody_aqm_1_payeezip', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd'));
				cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
				cMemo.setFieldValue('custbody_aqm_1_payeecountry', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry')); //
		    	break;
		    
		    case "5": //international wire
		    	cMemo.setFieldValue('custbody_aqm_1_namesonbankaccount', exRec.getFieldValue('custrecord_acq_loth_5b_de1_nameonbnkacct'));
		    	cMemo.setFieldValue('custbody_aqm_1_bankaccountnumber', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankacctnum'));
				cMemo.setFieldValue('custbody_aqm_1_abaroutingnumber', exRec.getFieldValue('custrecord_acq_loth_5b_de1_abaswiftnum'));
				cMemo.setFieldValue('custbody_aqm_1_bankname', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankname'));
				cMemo.setFieldValue('custbody_aqm_1_bankaddress', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankaddr'));
				cMemo.setFieldValue('custbody_aqm_1_bankaddresscity', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcity'));
				var stateText = exRec.getFieldText('custrecord_acq_loth_5b_de1_bankstate');
				cMemo.setFieldValue('custbody_aqm_1_bankaddressstate', stateRef[stateText] || null);
				cMemo.setFieldValue('custbody_aqm_1_bankaddresszip', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankzip'));
				cMemo.setFieldValue('custbody_aqm_1_nameofbankcontactperson', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankcontact'));
				cMemo.setFieldValue('custbody_aqm_1_phonenumberofbankcontac', exRec.getFieldValue('custrecord_acq_loth_5b_de1_bankphone'));
				cMemo.setFieldValue('custbody_aqm_1_forfurthercreditaccount', exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtacct'));
				cMemo.setFieldValue('custbody_aqm_1_2forfurthercreditaccoun', exRec.getFieldValue('custrecord_acq_loth_5b_de1_frthrcrdtname'));
				cMemo.setFieldValue('custbody_acq_lot_payment_method_3', exRec.getFieldValue('custrecord_acq_loth_4_de1_lotpaymethod'));
				
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress1', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr1'));
				cMemo.setFieldValue('custbody_aqm_1_payeeaddress2', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldaddr2')); 
				cMemo.setFieldValue('custbody_aqm_1_payeecity', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcity'));
				var stateText = exRec.getFieldText('custrecord_acq_loth_1_de1_shrhldstate');
				cMemo.setFieldValue('custbody_aqm_1_payeestate', stateRef[stateText] || null);
				cMemo.setFieldValue('custbody_aqm_1_payeezip', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldpostalcd'));
				cMemo.setFieldValue('custbody_aqm_1_payeephonenumber', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldphone'));
				cMemo.setFieldValue('custbody_aqm_1_payeecountry', exRec.getFieldValue('custrecord_acq_loth_1_de1_shrhldcountry')); //
		    	break;
		    }
			/* Create line items on the Credit Memo for certificates and fees.  Keep track of total balance with lineItemTotal
			*  because if the credit memo is negative it will not submit.  If fees are greater than the payout, return an error.
			*/
			var lineItemTotal = 0.00;
			for (var sLoop = 0; certSearchResults != null && sLoop < certSearchResults.length; sLoop++){
	        	var certItemRow = certSearchResults[sLoop];
//	        	var certNumShares = certItemRow.getValue('custrecord_acq_lotce_3_de1_numbershares');
	        	var certDescription = certItemRow.getValue('custrecord_acq_lotce_3_de1_certdesc');
	        	var certPayAmount = certItemRow.getValue('custrecord_acq_lotce_zzz_zzz_payment');
//	        	certPayAmount = certPayAmount.toFixed(2); 
//	        	if(certPayAmount == null || certPayAmount == '') {
////	        		certPayAmount = parseFloat(certPayAmount);
//	        		msg.addMessage('Problem with the Certificate Pay Amount on Certificate #' + certItemRow.getId() + ', Pay Amount is: ' + certPayAmount);
//					msg.setStatusError();
//					return msg;
//	        	}
	        	if(certPayAmount == '.00' || certPayAmount == null || certPayAmount == '') {
	        		certPayAmount = 0.00;
	        	}
	        	
	        	if(certPayAmount != null || certPayAmount != '') {
	        		lineItemTotal += Number(certPayAmount);
	        	}
	        	var certNumber = certItemRow.getValue('custrecord_acq_lotce_3_de1_certnumber');
			
	        	cMemo.selectNewLineItem('item');
	        	cMemo.setCurrentLineItemValue('item', 'item', profileRec.getFieldValue('custrecord_acq_lot_cmemo_share_line_item')); //261
	        	cMemo.setCurrentLineItemValue('item', 'quantity', 1 );
	        	cMemo.setCurrentLineItemValue('item', 'description', certDescription );
	        	cMemo.setCurrentLineItemValue('item', 'custcol_acq_certnum', certNumber );
	        	cMemo.setCurrentLineItemValue('item', 'amount', certPayAmount);
	        	cMemo.setCurrentLineItemValue('item', 'class', profileRec.getFieldValue('custrecord_acq_lot_cmemo_entity')); //51
	        	cMemo.commitLineItem('item');
			}
			var negativeBalance = false;
			if((lineItemTotal + fee) < 0) {
				negativeBalance = true;
			}
//			if((lineItemTotal + fee) < 0 && lotPayMethod == 4 || lotPayMethod == 5) {
//				msg.addMessage('Unable to process this transaction because it would create a negative balance.</p><p>The total certificate proceeds are $' + lineItemTotal + '.<p>The bank transaction fees are $' + fee + '.');
//				msg.setStatusError();
//				return msg;
//			}
			// Add Line Item Processing Fees pulled from the profile record
			var fee = 0.00;
//			if(lotPayMethod == 1) { //Add the ACH Fee
//				fee = addLineItemFee(profileRec.getFieldValue('custrecord_acq_lot_cmemo_ach_fees'), cMemo);
//			}
//			if(lotPayMethod == 2 && negativeBalance == false) { //Add the Domestic Check Fee
//				fee = addLineItemFee(profileRec.getFieldValue('custrecord_acq_lot_cmemo_dcheck_fees'), cMemo);
//			}
//			if(lotPayMethod == 2 && negativeBalance == true) { //Add the Domestic Check Fee
//				fee = addLineItemFee(295, cMemo);
//			}
//			if(lotPayMethod == 3 && negativeBalance == false) { //Add the International Check Fee
//				fee = addLineItemFee(profileRec.getFieldValue('custrecord_acq_lot_cmemo_intcheck_fees'), cMemo);
//			}
//			if(lotPayMethod == 3 && negativeBalance == true) { //Add the International Check Fee
//				fee = addLineItemFee(295, cMemo);
//			}
//			if(lotPayMethod == 4) { //Add the Domestic Wire Fee
//				fee = addLineItemFee(profileRec.getFieldValue('custrecord_acq_lot_cmemo_dwire_fees'), cMemo);
//			}
//			if(lotPayMethod == 5) { //Add the International Wire Fee
//				fee = addLineItemFee(profileRec.getFieldValue('custrecord_acq_lot_cmemo_intwire_fees'), cMemo);
//			}
			if(msg.returnMessages.length > 0) {
				msg.setStatusError();
				return msg;
			};
		    try {
		    	var cMemoID = nlapiSubmitRecord(cMemo);
		    	if(cMemoID != null && cMemoID != '') {
		    		exRec.setFieldValue('custrecord_acq_loth_related_trans', cMemoID);
		    		nlapiSubmitRecord(exRec);
		    	}
		    	msg.setStatusSuccess();
		    	msg.setReturnRecID(cMemoID);
		    	return msg;
		    } catch (e) {
		    	var err = e;
		    	msg.setStatusError();
				msg.addMessage(e);
				return msg;
		    	nlapiLogExecution('DEBUG', 'Credit Memo Submit FAILED', JSON.stringify(err));
		    }
		};
	}
	return msg;
}

//Create and Add the Line Item Fees for the Payment Method
function addLineItemFee(itemID, cMemo){
	cMemo.selectNewLineItem('item');
	cMemo.setCurrentLineItemValue('item', 'item', itemID);
	cMemo.setCurrentLineItemValue('item', 'quantity', 1 );
	var fee = cMemo.getCurrentLineItemValue('item', 'rate');
	cMemo.commitLineItem('item');
	return parseFloat(fee);
}

//function searchPiracleACHrecords(sHolderID, newAccountNum, newRoutingNum) {
//	var recExist = false;
//	// return opportunity sales rep, customer custom field, and customer ID
//	var columns = new Array();
//	columns[0] = new nlobjSearchColumn('custrecord_pp_ach_entity');
//	columns[1] = new nlobjSearchColumn('custrecord_pp_ach_account_number');
//	columns[2] = new nlobjSearchColumn('custrecord_pp_ach_routing_number');
//	
//	// execute the search, passing all filters and return columns
//	var searchresults = nlapiSearchRecord('customrecord_pp_ach_account', null, null, columns );
//	
//	// loop through the results
//	for(var i = 0; searchresults != null && i < searchresults.length; i++) {
//		// get result values
//		var searchresult = searchresults[i];
//		if(searchresult.getValue('custrecord_pp_ach_account_number') == newAccountNum && searchresult.getValue('custrecord_pp_ach_routing_number') == newRoutingNum) {
//			if(searchresult.getValue('custrecord_pp_ach_entity') == sHolderID) {
//				recExist = true;
//				return searchresult.getId();
//			}
//		}
//	}
//	return recExist;
//}

function determineHashExist(hashNumber) {
	var hashExist = false;
	var filters = new Array();
	filters[0] = new nlobjSearchFilter('custrecord_acq_hash_deal_link', null, 'anyof', '@NONE@');
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('name');
	var searchresults = nlapiSearchRecord('customrecord_acq_exchange_hash', null, filters, columns );
	for ( var i = 0; searchresults != null && i < searchresults.length; i++ ) {
            var searchresult = searchresults[i];
            var hashNumberSearch = searchresult.getValue('name');
            if(hashNumberSearch.trim() == hashNumber.trim()) {
            	hashExist = true;
            	break;
			}
	}
	return hashExist;
}

function createEmailbody(templateID, recType, recId) {
	var body = nlapiMergeRecord(275, recType, recId).getValue(); //290 is the tempalate in PRODUCTION
	return body;
}

