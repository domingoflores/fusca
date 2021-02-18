/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Apr 2014     smccurry			Based off of CopyPaymentData.js
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function copyPaymentInfo(rmaRecID) {

//	var originatingTrans = nlapiGetNewRecord(); 
//	var currentID = originatingTrans.getId();
//	nlapiLogExecution("DEBUG", "copyPaymentInfo", "currentID: " + currentID);
//	var custrefundRec = nlapiLoadRecord("customerrefund", currentID);
//	
//       //assuming there will only ever be 1 distribution authorization
//	var createdFromType = custrefundRec.getLineItemValue('apply', "type", 1);
//	nlapiLogExecution("DEBUG", "copyPaymentInfo", "created from type: " + createdFromType);
//
//	var rmaRecID = custrefundRec.getLineItemValue('apply', "createdfrom", 1)
//	nlapiLogExecution("DEBUG", "copyPaymentInfo", "RMA ID: " + rmaRecID);

	if (rmaRecID != null)	//Acquiom refund but not from LOT
	{
		
		var rmaRec = nlapiLoadRecord("returnauthorization", rmaRecID);
		var entityID = rmaRec.getFieldValue("entity");
		var lotPayMethod = rmaRec.getFieldValue("custbody_acq_lot_payment_method_3");  //ACH=1;Domestic Check=2; International Check=3; Domestic Wire=4; International Wire=5;
		nlapiLogExecution("DEBUG", "copyPaymentInfo", "LOT Pay method: " + lotPayMethod);
		
	    switch (lotPayMethod) {
	    
	    case "1": //ach
	    	var ppRecId;
		    nlapiLogExecution("DEBUG", "copyPaymentInfo.ACH", "Payment Method = " + lotPayMethod);
		    //Get LOT values
		    var newRoutingNum = rmaRec.getFieldValue("custbody_aqm_1_abaroutingnumber");
		    var newAccountNum = rmaRec.getFieldValue("custbody_aqm_1_bankaccountnumber");
//		    var newAccountType = rmaRec.getFieldValue("custbody_aqm_1_accounttype");  //checking, savings, commercial checking, commercial savings
			//load entity record
			var entityRec = nlapiLoadRecord("customer", entityID);
			// Search to see if this ACH record already exists
			var result = searchPiracleACHrecords(entityID, newAccountNum, newRoutingNum);
			// If ACH record exist, load it and set ACH_is_primary to True.
			if(result != null && result != '') {
				var ppRec = nlapiLoadRecord('customrecord_pp_ach_account', result);
				ppRec.setFieldValue('custrecord_pp_ach_is_primary', "T");
				try {
					var ppRecId = nlapiSubmitRecord(ppRec);
				} catch (e) {
					var err = e;
					nlapiLogExecution('DEBUG', 'Error on submit Piracle ACH Record', 'error');
				}
				// to make sure they are up-to-date set the entity fields on the Piracle tab on the customer record
				entityRec.setFieldValue("custentity_pp_ach_enabled", "T");
				entityRec.setFieldValue("custentity_pp_ach_account_number", ppRec.getFieldValue('custrecord_pp_ach_account_number'));
				entityRec.setFieldValue("custentity_pp_ach_account_number", ppRec.getFieldValue('custrecord_pp_ach_routing_number'));
				entityRec.setFieldValue("custentity_pp_ach_deposit_withdrawal",1);  //Deposit = 1; Withdrawal = 2;
				// submit the customer record with the changes
				try {
					var entityId = nlapiSubmitRecord(entityRec);
				} catch (e) {
					var err = e;
					nlapiLogExecution('DEBUG', 'Submit Entity Record Failed', entityId);
				}
			} else {
				// Create a new Piracle ACH record and then attach to the customer record
				var ppRec = nlapiCreateRecord('customrecord_pp_ach_account');
				ppRec.setFieldValue('name', entityRec.getFieldValue('name') || entityRec.getFieldValue('nameorig'));
				ppRec.setFieldValue('custrecord_pp_ach_entity', entityID);
				ppRec.setFieldValue('custrecord_pp_ach_account_number', newAccountNum);
				ppRec.setFieldValue('custrecord_pp_ach_routing_number', newRoutingNum);
				ppRec.setFieldValue('custrecord_pp_ach_is_primary', "T");
				ppRec.setFieldValue('custrecord_pp_ach_sec_code', 4);//CCD=1;CTX=2;IAT=3;PPD=4;EDI=5;
				ppRec.setFieldValue('custrecord_pp_ach_transaction_code', 7);//Checking=7;Savings=8;Checking Prenote=3;Savings Prenote=4;
				try {
					ppRecId = nlapiSubmitRecord(ppRec);
				} catch (e) {
					//var err = e;
					nlapiLogExecution('DEBUG', 'Submit Piracle ACH Record', 'error');
				}
				entityRec.setFieldValue("custentity_pp_ach_enabled", "T");
				entityRec.setFieldValue("custentity_pp_ach_account_number", newAccountNum);
				entityRec.setFieldValue("custentity_pp_ach_deposit_withdrawal",1);  //Deposit = 1; Withdrawal = 2;
				
				try {
					var entityId = nlapiSubmitRecord(entityRec);
				} catch (e) {
					//var err = e;
					nlapiLogExecution('DEBUG', 'Submit Entity Record Failed', entityId);
				}
			}
			// return the id of the newly created ACH record, or the existing ACH record that was updated
			return ppRecId;	
		
	    case "2":  //domestic check
			    	 nlapiLogExecution("DEBUG", "copyPaymentInfo.domesticCheck", "Payment Method = " + lotPayMethod);
			    	 //load entity record
					 var entityRec = nlapiLoadRecord("customer", entityID);
			    	 /*
			    	  * custbody_acq_boxe_name = Make Check Payable To
			    	  * custbody_acq_boxe_address1
			    	  * custbody_acq_boxe_address2
			    	  * custbody_acq_boxe_city
			    	  * custbody_acq_boxe_state
			    	  * custbody_acq_boxe_postal
			    	  *  
			    	  */
			    	 
			    	 //Get LOT values 
			    	 //Do nothing unless LOT fields in Box E are filled in - check info should have been added at import
			    	 var newMakePayableTo = rmaRec.getFieldValue("custbody_acq_boxe_name");
			    	 
			    	// if newMakePayableTo <> null | newMakePayableTo <> ''
			    	 var newMailTo = rmaRec.getFieldValue("custbodycustbody_acq_boxb_mailto");
			    	 var newAddress1 = rmaRec.getFieldValue("custbody_acq_boxe_address1");
			    	 var newAddress2 = rmaRec.getFieldValue("custbody_acq_boxe_address2");
			    	 var newCity = rmaRec.getFieldValue("custbody_acq_boxe_city");
			    	 var newState = rmaRec.getFieldValue("custbody_acq_boxe_state");
			    	 var newZip = rmaRec.getFieldValue("custbody_acq_boxe_postal");
			    	 var newCountry= rmaRec.getFieldValue("custbody_country");
			    	 
			    	 //add new address and set as new default billing address
			    	 entityRec.selectNewLineItem('addressbook');
	
					 entityRec.setCurrentLineItemValue('addressbook','addressee', newMailTo);
					 entityRec.setCurrentLineItemValue('addressbook','defaultbilling', 'T' );
					 entityRec.setCurrentLineItemValue('addressbook','addr1',newAddress1);
					 entityRec.setCurrentLineItemValue('addressbook','addr2',newAddress2);
					 entityRec.setCurrentLineItemValue('addressbook','city',newCity);
					 entityRec.setCurrentLineItemValue('addressbook','displaystate',newState);
					 entityRec.setCurrentLineItemValue('addressbook','zip',newZip);
					 //entityRec.setCurrentLineItemValue('addressbook','country',newCountry);
					 
					 entityRec.commitLineItem('addressbook');
					 	
					 entityRec.setFieldValue("printoncheckas", newMakePayableTo)
					 
					//save
					 nlapiSubmitRecord(entityRec);
					
			    	 break;
			    
	    case "3": //international check
			    	 nlapiLogExecution("DEBUG", "copyPaymentInfo.internationalCheck", "Payment Method = " + lotPayMethod);
			 		    	 //load entity record
					 var entityRec = nlapiLoadRecord("customer", entityID);
			    	 
							 
			    	 /*
			    	  * custbody_acq_boxe_name = Make Check Payable To
			    	  * custbody_acq_boxe_address1
			    	  * custbody_acq_boxe_address2
			    	  * custbody_acq_boxe_city
			    	  * custbody_acq_boxe_state
			    	  * custbody_acq_boxe_postal
			    	  *  
			    	  */
			    	 
			    	 //Get LOT values 
			    	 //Do nothing unless LOT fields in Box E are filled in - check info should have been added at import
			    	 var newMakePayableTo = rmaRec.getFieldValue("custbody_acq_boxe_name");
			    	 
			    	// if newMakePayableTo <> null | newMakePayableTo <> ''
			    	 var newMailTo = rmaRec.getFieldValue("custbodycustbody_acq_boxb_mailto");
			    	 var newAddress1 = rmaRec.getFieldValue("custbody_acq_boxe_address1");
			    	 var newAddress2 = rmaRec.getFieldValue("custbody_acq_boxe_address2");
			    	 var newCity = rmaRec.getFieldValue("custbody_acq_boxe_city");
			    	 var newState = rmaRec.getFieldValue("custbody_acq_boxe_state");
			    	 var newZip = rmaRec.getFieldValue("custbody_acq_boxe_postal");
			    	 var newCountry= rmaRec.getFieldValue("custbody_country");
			    	 
			    	 //add new address and set as new default billing address
			    	 entityRec.selectNewLineItem('addressbook');
	
					 entityRec.setCurrentLineItemValue('addressbook','addressee', newMailTo);
					 entityRec.setCurrentLineItemValue('addressbook','defaultbilling', 'T' );
					 entityRec.setCurrentLineItemValue('addressbook','addr1',newAddress1);
					 entityRec.setCurrentLineItemValue('addressbook','addr2',newAddress2);
					 entityRec.setCurrentLineItemValue('addressbook','city',newCity);
					 entityRec.setCurrentLineItemValue('addressbook','displaystate',newState);
					 entityRec.setCurrentLineItemValue('addressbook','zip',newZip);
					 //entityRec.setCurrentLineItemValue('addressbook','country',newCountry);
					 
					 entityRec.commitLineItem('addressbook');
					 	
					 entityRec.setFieldValue("printoncheckas", newMakePayableTo)
					 
					//save
					 nlapiSubmitRecord(entityRec);
					
			    	 break;
	    
	    case "4": //domestic wire
			    	 nlapiLogExecution("DEBUG", "copyPaymentInfo.domesticWire", "Payment Method = " + lotPayMethod);
			/**  	will need this once Piracle is processing wires	    //Get LOT values
			    var newRoutingNum = rmaRec.getFieldValue("custbody_aqm_1_abaroutingnumber");
			    var newAccountNum = rmaRec.getFieldValue("custbody_aqm_1_bankaccountnumber");
			    var newAccountType = rmaRec.getFieldValue("custbody_aqm_1_accounttype");  //checking, savings, commercial checking, commercial savings
			    
				//load entity record
				var entityRec = nlapiLoadRecord("customer", entityID);
				
				//set field values for ACH
				entityRec.setFieldValue("custentity_pp_ach_routing_number", newRoutingNum);
				entityRec.setFieldValue("custentity_pp_ach_account_number", newAccountNum);
				entityRec.setFieldValue("custentity_pp_ach_transaction_code",7);  //Checking=7;Savings=8;Checking Prenote=3;Savings Prenote=4;
				entityRec.setFieldValue("custentity_pp_ach_deposit_withdrawal",1);  //Deposit = 1; Withdrawal = 2;
				entityRec.setFieldValue("custentity_pp_ach_sec_code",4); //CCD=1;CTX=2;IAT=3;PPD=4;EDI=5;
				//entityRec.setFieldValue("custentity_pp_ach_enabled", "T"); NOT NEEDED FOR WIRES
				entityRec.setField
				
				nlapiSubmitRecord(entityRec);
				//save
			**/
				break;
	    
	    case "5": //international wire
			    	 nlapiLogExecution("DEBUG", "copyPaymentInfo.internationalWire", "Payment Method = " + lotPayMethod);
			 /**	 will need this once Piracle is processing wires	  		    //Get LOT values 
			    var newRoutingNum = rmaRec.getFieldValue("custbody_aqm_1_abaroutingnumber");
			    var newAccountNum = rmaRec.getFieldValue("custbody_aqm_1_bankaccountnumber");
			    var newAccountType = rmaRec.getFieldValue("custbody_aqm_1_accounttype");  //checking, savings, commercial checking, commercial savings
			    
				//load entity record
				var entityRec = nlapiLoadRecord("customer", entityID);
				
				//set field values for ACH
				entityRec.setFieldValue("custentity_pp_ach_routing_number", newRoutingNum);
				entityRec.setFieldValue("custentity_pp_ach_account_number", newAccountNum);
				entityRec.setFieldValue("custentity_pp_ach_transaction_code",7);  //Checking=7;Savings=8;Checking Prenote=3;Savings Prenote=4;
				entityRec.setFieldValue("custentity_pp_ach_deposit_withdrawal",1);  //Deposit = 1; Withdrawal = 2;
				entityRec.setFieldValue("custentity_pp_ach_sec_code",4); //CCD=1;CTX=2;IAT=3;PPD=4;EDI=5;
				//entityRec.setFieldValue("custentity_pp_ach_enabled", "T"); NOT NEEDED FOR WIRES
				entityRec.setField
				
				nlapiSubmitRecord(entityRec);
				//save
			**/
				break;
	    
	    
	    }
	   }

	
}

function searchPiracleACHrecords(entityID, newAccountNum, newRoutingNum) {
	var recExist = null;
	// return opportunity sales rep, customer custom field, and customer ID
	var columns = new Array();
	columns[0] = new nlobjSearchColumn('custrecord_pp_ach_entity');
	columns[1] = new nlobjSearchColumn('custrecord_pp_ach_account_number');
	columns[2] = new nlobjSearchColumn('custrecord_pp_ach_routing_number');
	
	// execute the search, passing all filters and return columns
	var searchresults = nlapiSearchRecord('customrecord_pp_ach_account', null, null, columns );
	
	// loop through the results
	for(var i = 0; searchresults != null && i < searchresults.length; i++) {
		// get result values
		var searchresult = searchresults[i];
		if(searchresult.getValue('custrecord_pp_ach_account_number') == newAccountNum && searchresult.getValue('custrecord_pp_ach_routing_number') == newRoutingNum) {
			if(searchresult.getValue('custrecord_pp_ach_entity') == entityID) {
				recExist = true;
				return searchresult.getId();
			}
		}
	}
	return recExist;
}


//function transformLOTintoCreditMemo(type) {
//	var transferFields = new Array();
//	transferFields.test = 123456789;
//	
//	var record = nlapiTransformRecord('returnauthorization', nlapiGetRecordId(), 'creditmemo', transferFields);
//	nlapiLogExecution('DEBUG', 'record', record);
//	var id = nlapiSubmitRecord(record, false);
//	nlapiLogExecution('DEBUG', 'id', record);
//}



 
