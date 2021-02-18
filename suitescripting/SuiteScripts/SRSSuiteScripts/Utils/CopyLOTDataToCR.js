/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Aug 2013     marcscremin
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function copyLOTDataToCR() {

	//starting with Customer Refund
	nlapiLogExecution("DEBUG", "copyLOTDataToCR", "initiate copy LOT data to Customer Refund");
	
     	var custrefundRec = nlapiGetNewRecord(); 
if (nlapiGetLineItemCount('apply') >0)
{
    nlapiLogExecution("DEBUG", "copyLOTDataToCR", "check apply fields start " );
  nlapiLogExecution("DEBUG", "copyLOTDataToCR", "due: " +  nlapiGetLineItemValue('apply', "due", 1));
 var rmaRecID = nlapiGetLineItemValue('apply', "createdfrom", 1)
var credmemoID = nlapiGetLineItemValue('apply', "doc", 1);
 nlapiLogExecution("DEBUG", "copyLOTDataToCR", "rmarecID " + rmaRecID );
 nlapiLogExecution("DEBUG", "copyLOTDataToCR", "CredMemID " + credmemoID );

if (rmaRecID != null)	//Acquiom refund but not from LOT
{

	nlapiLogExecution("DEBUG", "copyLOTDataToCR", "RMA Rec ID: " + rmaRecID);	
	var rmaRec = nlapiLoadRecord("returnauthorization", rmaRecID);
	var entityID = rmaRec.getFieldValue("entity")
	var lotPayMethod = rmaRec.getFieldValue("custbody_acq_lot_payment_method_3");  //ACH=1;Domestic Check=2; International Check=3; Domestic Wire=4; International Wire=5;
        var dealLink = rmaRec.getFieldValue("custbodyacq_deal_link");

	nlapiLogExecution("DEBUG", "copyLOTDataToCR", "LOT Pay method: " + lotPayMethod);
        nlapiLogExecution("DEBUG", "copyLOTDataToCR", "Deal Link: " + dealLink);
	
	/**
	 * paymentmethod - Accounting Lists
	 * 1=cash, 2=Check, 3=Discover, 4=Master Card, 5=VISA, 6=American Express, 7=Wire Transfer, 8=EFT, 9=ACH, 10=Undeposited Funds
	 * 
	 * LOT Payment Method - customlist_acq_lot_payment_method
	 * 1=ACH, 2=Domestic Check, 3=International Check, 4=Domestic Wire, 5=International Wire
	 */
	
  custrefundRec.setFieldValue('custbodyacq_deal_link',dealLink);

	switch (lotPayMethod) {
    
    case "1": //ach
    			nlapiLogExecution("DEBUG", "copyLOTDataToCR.ACH", "Payment Method = " + lotPayMethod);
			    //set Refund Method and LOT Payment Method
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',9);
			    break;	
	
    case "2":  //domestic check
	    	 	nlapiLogExecution("DEBUG", "copyLOTDataToCR.domesticCheck", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',2);
		    	 break;
		    
    case "3": //international check
    			nlapiLogExecution("DEBUG", "copyLOTDataToCR.internationalCheck", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',2);
		    	 break;
    
    case "4": //domestic wire
    			nlapiLogExecution("DEBUG", "copyLOTDataToCR.domesticWire", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',7);
		    	 break;
    
    case "5": //international wire
	    	 	nlapiLogExecution("DEBUG", "copyLOTDataToCR.internationalWire", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',7);
		    	 break;
 }   
    }
else if (rmaRecID == null && credmemoID != null )	
{

nlapiLogExecution("DEBUG", "copyLOTDataToCR", "Credit Memo ID: " + credmemoID);	
	var credmemRec = nlapiLoadRecord("creditmemo", credmemoID);
	var entityID = credmemRec.getFieldValue("entity")
	var lotPayMethod = credmemRec.getFieldValue("custbody_acq_lot_payment_method_3");  //ACH=1;Domestic Check=2; International Check=3; Domestic Wire=4; International Wire=5;
        var dealLink = credmemRec.getFieldValue("custbodyacq_deal_link");

	nlapiLogExecution("DEBUG", "copyLOTDataToCR", "LOT Pay method: " + lotPayMethod);
        nlapiLogExecution("DEBUG", "copyLOTDataToCR", "Deal Link: " + dealLink);
	
	/**
	 * paymentmethod - Accounting Lists
	 * 1=cash, 2=Check, 3=Discover, 4=Master Card, 5=VISA, 6=American Express, 7=Wire Transfer, 8=EFT, 9=ACH, 10=Undeposited Funds
	 * 
	 * LOT Payment Method - customlist_acq_lot_payment_method
	 * 1=ACH, 2=Domestic Check, 3=International Check, 4=Domestic Wire, 5=International Wire
	 */
	
  custrefundRec.setFieldValue('custbodyacq_deal_link',dealLink);
  custrefundRec.setFieldValue('class','51');
    custrefundRec.setFieldValue('department','20');

	switch (lotPayMethod) {
    
    case "1": //ach
    			nlapiLogExecution("DEBUG", "copyLOTDataToCR.ACH", "Payment Method = " + lotPayMethod);
			    //set Refund Method and LOT Payment Method
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',9);
			    break;	
	
    case "2":  //domestic check
	    	 	nlapiLogExecution("DEBUG", "copyLOTDataToCR.domesticCheck", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',2);
		    	 break;
		    
    case "3": //international check
    			nlapiLogExecution("DEBUG", "copyLOTDataToCR.internationalCheck", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',2);
		    	 break;
    
    case "4": //domestic wire
    			nlapiLogExecution("DEBUG", "copyLOTDataToCR.domesticWire", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',7);
		    	 break;
    
    case "5": //international wire
	    	 	nlapiLogExecution("DEBUG", "copyLOTDataToCR.internationalWire", "Payment Method = " + lotPayMethod);
			    custrefundRec.setFieldValue('custbody_acq_lot_payment_method_3',lotPayMethod);
			    custrefundRec.setFieldValue('paymentmethod',7);
		    	 break;
 }   
}

	}
}