/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.1		  17 Apr 2014     smccurry			Made changes to Case "1" switch to remap fields due to an upgrade by Piracle of their bundle
 * 1.00       23 Jul 2013     marcscremin
 *
 *
 *
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function copyPaymentInfo() {
//starting with Customer Refund
	nlapiLogExecution("DEBUG", "copyPaymentInfo", "initiate copy payment info");
		
	//For debugger Testing
	//var recordID = 120044;
	//var custrefundRec = nlapiLoadRecord("customerrefund", recordID);
	
	//for Productioin
	var originatingTrans = nlapiGetNewRecord(); 
	var currentID = originatingTrans.getId();
	nlapiLogExecution("DEBUG", "copyPaymentInfo", "currentID: " + currentID);
	var custrefundRec = nlapiLoadRecord("customerrefund", currentID);
	
       //assuming there will only ever be 1 distribution authorization
	var createdFromType = custrefundRec.getLineItemValue('apply', "type", 1);
	nlapiLogExecution("DEBUG", "copyPaymentInfo", "created from type: " + createdFromType);

	var rmaRecID = custrefundRec.getLineItemValue('apply', "createdfrom", 1)
	nlapiLogExecution("DEBUG", "copyPaymentInfo", "RMA ID: " + rmaRecID);

if (rmaRecID != null)	//Acquiom refund but not from LOT
{
	
	var rmaRec = nlapiLoadRecord("returnauthorization", rmaRecID);
	var entityID = rmaRec.getFieldValue("entity")
	var lotPayMethod = rmaRec.getFieldValue("custbody_acq_lot_payment_method_3");  //ACH=1;Domestic Check=2; International Check=3; Domestic Wire=4; International Wire=5;
	nlapiLogExecution("DEBUG", "copyPaymentInfo", "LOT Pay method: " + lotPayMethod);
	
    switch (lotPayMethod) {
    
    case "1": //ach
	    nlapiLogExecution("DEBUG", "copyPaymentInfo.ACH", "Payment Method = " + lotPayMethod);
	    //Get LOT values
	    var newRoutingNum = rmaRec.getFieldValue("custbody_aqm_1_abaroutingnumber");
	    var newAccountNum = rmaRec.getFieldValue("custbody_aqm_1_bankaccountnumber");
	    var newAccountType = rmaRec.getFieldValue("custbody_aqm_1_accounttype");  //checking, savings, commercial checking, commercial savings
		//load entity record
		var entityRec = nlapiLoadRecord("customer", entityID);
		var name = entityRec.getFieldValue('nameorig');
		// Create a new Piracle ACH record and then attach to the customer record
		var ppRec = nlapiCreateRecord('customrecord_pp_ach_account');
		ppRec.setFieldValue('name', name);
		ppRec.setFieldValue('custrecord_pp_ach_entity', entityID);
		ppRec.setFieldValue('custrecord_pp_ach_account_number', newAccountNum);
		ppRec.setFieldValue('custrecord_pp_ach_routing_number', newRoutingNum);
		ppRec.setFieldValue('custrecord_pp_ach_is_primary', "T");

		ppRec.setFieldValue('custrecord_pp_ach_sec_code', 4);//CCD=1;CTX=2;IAT=3;PPD=4;EDI=5;
		ppRec.setFieldValue('custrecord_pp_ach_transaction_code', 7);//Checking=7;Savings=8;Checking Prenote=3;Savings Prenote=4;
		
		try {
			var ppRecId = nlapiSubmitRecord(ppRec);
		} catch (e) {
			var err = e;
			nlapiLogExecution('DEBUG', 'Submit Piracle ACH Record', ppRecId);
		}
		
				
		entityRec.setFieldValue("custentity_pp_ach_enabled", "T");
		entityRec.setFieldValue("custentity_pp_ach_account_number", newAccountNum);
		entityRec.setFieldValue("custentity_pp_ach_deposit_withdrawal",1);  //Deposit = 1; Withdrawal = 2;
		
		try {
			var entityId = nlapiSubmitRecord(entityRec, true);
		} catch (e) {
			var err = e;
			nlapiLogExecution('DEBUG', 'Submit Entity Record Failes', entityId);
		}
		
		//save
		
		break;	
	
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