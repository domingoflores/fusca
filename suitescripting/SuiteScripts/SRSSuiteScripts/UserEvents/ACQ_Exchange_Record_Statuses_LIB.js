/**
 * Module Description
 * This script updates the Acquiom Status based on the individual Statuses that are set by the 
 *
 * Version    Date            Author           Remarks
 * 1.00       20 August 2014  sstreule         "Everything is Awesome"
 * 1.01		  29 January 2015 sstreule		   Adding logic for the new Dual Entry Status field
 * 1.02       24 April 2015   sstreule         Added logic to populate the Status Image fields on the Exchange Record
 * 1.03       18 June 2015    sstreule         Added variable for W9 Special Cases as well as logic to handle the new entry in the Tax Info Status List
 * 1.04       10 August 2015  sstreule         Added ultraLock() function to handle the lockout statuses on common Exchange Records
 * 1.05       11 Sept   2015  sstreule         Updated ultraLock() function to handle the UNLOCK and and RESET calls from the ACQ_LOT_ExchangeRec_Ajax_CS script.
 * 
 *
 */


function setStatus(type, recordType, exchangeRecord, exchangeRecordID){
	//exchangeRecordID = nlapiGetRecordId();
	//var exRec = nlapiGetNewRecord();
	//var exchangeRecord = nlapiLoadRecord('customrecord_acq_lot', exchangeRecordID);
	//Search for the Exchange Record Fields
	//var exSearchResults = exchangeRecordSearch(exchangeRecordID);
	//var exSearchResults = searchResults[0];
	//var dealName = 413460
	var bacaTest = JSON.stringify(exchangeRecord);
	nlapiLogExecution('DEBUG', 'ExchangeRecord ', 'ExchangeRecord Value is '+ bacaTest + '');
	var dealName = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_deal'); //Use this field to get the ID of the Deal record to find out if the "Deal Approved to Send LOT's" check mark is clicked
	nlapiLogExecution('DEBUG', 'Deal ', 'Deal Field Value is '+ dealName + '');
	var dealLOTSent = nlapiLookupField('customer', dealName, 'custentity_acq_deal_lot_send_lots'); //This field tells us if the LOTs have been approved to be sent
	
	var testOrReleased = 'TEST';
	//Added this if to be able to set the status field that is being updated.  This is to be used during testing or bugfixing
	if(testOrReleased == 'TEST'){
		var acqStatus = 'custrecord_test_acq_status_test'; //Used for testing purposes to set a Temporary Test Status that does not drive any searches or portlets
	}else{
		var acqStatus = 'custrecord_acq_loth_zzz_zzz_acqstatus'; //This is the "Real Deal" aka.  the actual field that needs to be updated once testing is completed
	}

	var loginStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_login_status');
	var lockoutStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas');
	var holdingsStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_vrfy_hldngs');
	var contactStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_cntct_info');
	var taxStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_tax_doc_stas');
	var payInfoStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_pay_info');
	var medallionStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_mdlin_status');
	var eSignStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_esign_status');
	var addDocStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_add_doc_stat');
	var dualEntryStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_de_status');
	var isAmtFinal = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_isamtfinal');
	var reviewComplete = exchangeRecord.getFieldValue('custrecord_acq_loth_reviewcomplete');
	var creditMemo = exchangeRecord.getFieldValue('custrecord_acq_loth_related_trans');
	var customerRefund = exchangeRecord.getFieldValue('custrecord_acq_loth_related_refund');
	
	//All the Image Code is used to have better UI display in the results of Saved Searches
	//Image Files are located in the File Cabinet in Images --> Acquiom LOT Status Images
	var blank = '3534078'; 
	var greenApproved = '3534088'; 
	var greenChangesApproved = '3534093'; 
	var greenCompleted = '3534107'; 
	var greenMedallionApproved = '3534090';
	var greenNA = '3534108'; 
	var greenNO = '3534081'; 
	var greenNoMedallionNeeded = '3534089'; 
	var greenOfflineApproved = '3534092'; 
	var greenOfflineReceived = '3534096'; 
	var greenOfflineTaxFormsApproved = '3534091'; 
	var greenReset = '3534094'; 
	var greenTakenOffline = '3534095'; 
	var greenYes = '3534110'; 
	var orangeInProcess = '3534084'; 
	var orangeNewForm3Received = '3534087'; 
	var orangeNO = '3534082'; 
	var orangeNotStarted = '3534083'; 
	var orangeOfflineReceived = '3534086'; 
	var orangeReceived = '3534085'; 
	var redChanges = '3534103'; 
	var redChangesRejected = '3534100'; 
	var redCustElectNoMedallion = '3534111'; 
	var redMedallionRejected = '3534098'; 
	var redOffline = '3534106'; 
	var redOfflineRejected = '3534099'; 
	var redOfflineTaxFormRejected = '3534102'; 
	var redOfflineW8 = '3534105'; 
	var redOfflineW9 = '3534104'; 
	var redOfflineW9SpecialCases = '3755655';
	var redPayDetsRejected = '3534101'; 
	var redRejected = '3534097'; 
	var redYes = '3534109';
	var acgYellowRecordCreated = '3644654';
	var acqYellowLOTSent = '3644755';
	var acqOrangeReadyForReview = '3644756';
	var acqRedLOTFollowUp = '3644757';
	var acqGreenApproved = '3644758';
	var acqPaid = '3644759';
	var acqStatusValue = ''; //Placeholder to switch and set the Acquiom Status Image
	
	//Set all the Image Fields
	//Login Status Images
	if(loginStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_login_image', greenYes); //Green Yes Image
	}else if(loginStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_login_image', redChanges); //Red Changes Image
	}else if(loginStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_login_image', orangeNewForm3Received); //Orange New Form 3 Recieved Image
	}else if(loginStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_login_image', greenChangesApproved); //Green Changes Approved Image
	}else{
		exchangeRecord.setFieldValue('custrecord_login_image', blank); //Leave it Blank
	}
	//Lockout Status Images
	if((lockoutStatus == '') || (lockoutStatus == null)){
		exchangeRecord.setFieldValue('custrecord_lockout_image', greenNO); //Green No Image - Blank is "Happy Path"
	}else if(lockoutStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_lockout_image', redYes); //Red Yes Image
		
		//Call the function to set all other Exchange Records with this hash to be locked as well
		//But first, let's get some crucial info to run our search.  Set these variables for use as filters
		var exchangeHash = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash');
		var exchangeContact = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_contact');
		var exchangeDeal = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_deal');
		//lockoutStatus
		ultraLock(exchangeRecordID, exchangeHash, exchangeContact, exchangeDeal, lockoutStatus, redYes, '');
		
	}else if(lockoutStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_lockout_image', greenReset); //Green Reset Image
	}else if(lockoutStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_lockout_image', greenTakenOffline); //Green Taken Offline Image
	}else{
		exchangeRecord.setFieldValue('custrecord_lockout_image', blank); //Leave it Blank
	}
	//Verify Holdings Images
	if(holdingsStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_verify_holdings_image', greenYes); //Green Yes Image
	}else if(holdingsStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_verify_holdings_image', redChanges); //Red Changes Image
	}else if(holdingsStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_verify_holdings_image', orangeNewForm3Received); //Orange New Form 3 Received Image
	}else if(holdingsStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_verify_holdings_image', greenChangesApproved); //Green Changes Approved Image
	}else if(holdingsStatus == '5'){
		exchangeRecord.setFieldValue('custrecord_verify_holdings_image', redChangesRejected); //Red Changes Rejected
	}else{
		exchangeRecord.setFieldValue('custrecord_verify_holdings_image', blank); //Leave it Blank
	}
	//Contact Info Images
	if(contactStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_contact_info_image', greenYes); //Green Yes Image
	}else if(contactStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_contact_info_image', redChanges); //Red Changes Image
	}else if(contactStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_contact_info_image', orangeNewForm3Received); //Orange New Form 3 Received Image
	}else if(contactStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_contact_info_image', greenChangesApproved); //Green Changes Approved Image
	}else if(contactStatus == '5'){
		exchangeRecord.setFieldValue('custrecord_contact_info_image', redChangesRejected); //Red Changes Rejected
	}else{
		exchangeRecord.setFieldValue('custrecord_contact_info_image', blank); //Leave it Blank
	}
	//Tax Info Images
	if(taxStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_tax_info_image', greenYes); //Green Yes Image
	}else if(taxStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_tax_info_image', redOfflineW8); //Red Offline W8
	}else if(taxStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_tax_info_image', redOfflineW9); //Red Offline W9
	}else if(taxStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_tax_info_image', orangeOfflineReceived); //Orange Offline Received
	}else if(taxStatus == '5'){
		exchangeRecord.setFieldValue('custrecord_tax_info_image', greenOfflineTaxFormsApproved); //Green Offline Tax Forms Approved
	}else if(taxStatus == '6'){
		exchangeRecord.setFieldValue('custrecord_tax_info_image', redOfflineTaxFormRejected); //Red Offline Tax Form Rejected
	}else if(taxStatus == '7'){
		exchangeRecord.setFieldValue('custrecord_tax_info_image', redOfflineW9SpecialCases); //Red Offline W9 Special Cases
	}else{
		exchangeRecord.setFieldValue('custrecord_tax_info_image', blank); //Leave it Blank
	}
	//Payment Info Images
	if(payInfoStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_payment_info_image', greenYes); //Green Yes Image
	}else if(payInfoStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_payment_info_image', redOffline); //Red Offline Image
	}else if(payInfoStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_payment_info_image', orangeOfflineReceived); //Orange Offline Received Image
	}else if(payInfoStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_payment_info_image', greenOfflineApproved); //Green Offline Approved Image
	}else if(payInfoStatus == '5'){
		exchangeRecord.setFieldValue('custrecord_payment_info_image', redPayDetsRejected); //Red Payment Details Rejected
	}else{
		exchangeRecord.setFieldValue('custrecord_payment_info_image', blank); //Leave it Blank
	}
	//Medallion Guarantee Images
	if(medallionStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_medallion_guarantee_image', redOffline); //Red Offline Image
	}else if(medallionStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_medallion_guarantee_image', orangeOfflineReceived); //Orange Offline Recieved Image
	}else if(medallionStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_medallion_guarantee_image', greenMedallionApproved); //Green Medallion Approved Image
	}else if(medallionStatus == '5'){
		exchangeRecord.setFieldValue('custrecord_medallion_guarantee_image', greenNoMedallionNeeded); //Green No Medallion Needed Image
	}else if(medallionStatus == '6'){
		exchangeRecord.setFieldValue('custrecord_medallion_guarantee_image', redMedallionRejected); //Red Medaillion Rejected Image
	}else if(medallionStatus == '7'){
		exchangeRecord.setFieldValue('custrecord_medallion_guarantee_image', redCustElectNoMedallion); //Red Customer Elects No Medallion
	}else{
		exchangeRecord.setFieldValue('custrecord_medallion_guarantee_image', blank); //Leave it Blank
	}
	//Esigned Images
	if(eSignStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_esigned_image', greenYes); //Green Yes Image
	}else if(eSignStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_esigned_image', redChanges); //Red Changes Image
	}else if(eSignStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_esigned_image', orangeNewForm3Received); //Orange New Form 3 Received Image
	}else if(eSignStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_esigned_image', greenChangesApproved); //Green Changes Approved Image
	}else if(eSignStatus == '5'){
		exchangeRecord.setFieldValue('custrecord_esigned_image', redChangesRejected); //Red Changes Rejected
	}else{
		exchangeRecord.setFieldValue('custrecord_esigned_image', blank); //Leave it Blank
	}
	//Additional Doc Required Images custrecord_add_doc_required_image
	if(addDocStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_add_doc_required_image', greenYes); //Green No Image
	}else if(addDocStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_add_doc_required_image', redYes); //Red Yes Image
	}else if(addDocStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_add_doc_required_image', orangeOfflineReceived); //Orange Offline Received Image
	}else if(addDocStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_add_doc_required_image', greenOfflineApproved); //Green Offline Approved Image
	}else if(addDocStatus == '5'){
		exchangeRecord.setFieldValue('custrecord_add_doc_required_image', redRejected); //Red Rejected Image
	}else{
		exchangeRecord.setFieldValue('custrecord_add_doc_required_image', blank); //Leave it Blank
	}
	//Dual Entry Images custrecord_dual_entry_image
	if(dualEntryStatus == '1'){
		exchangeRecord.setFieldValue('custrecord_dual_entry_image', greenNA); //Green N/A Image
	}else if(dualEntryStatus == '2'){
		exchangeRecord.setFieldValue('custrecord_dual_entry_image', orangeInProcess); //Orange In Process Image
	}else if(dualEntryStatus == '3'){
		exchangeRecord.setFieldValue('custrecord_dual_entry_image', orangeNotStarted); //Orange Not Started Image
	}else if(dualEntryStatus == '4'){
		exchangeRecord.setFieldValue('custrecord_dual_entry_image', greenCompleted); //Green Completed Image
	}else{
		exchangeRecord.setFieldValue('custrecord_dual_entry_image', blank); //Leave it Blank
	}
	
	//Check for Approved Acquiom Status
	if(((loginStatus == '1') || (loginStatus == '3'))
		&&(lockoutStatus != '1')
		&&((holdingsStatus == '1') || (holdingsStatus == '4'))
		&&((contactStatus == '1') || (contactStatus == '4'))
		&&((taxStatus == '1') || (taxStatus == '5'))
		&&((payInfoStatus == '1') || (payInfoStatus == '4'))
		&&((medallionStatus == null) || (medallionStatus == '') || (medallionStatus == '1') || (medallionStatus == '4') || (medallionStatus == '5'))
		&&((eSignStatus == '1') || (eSignStatus == '4'))
		&&((addDocStatus == null) || (addDocStatus == '') || (addDocStatus == '1') || (addDocStatus == '4'))
		&&((dualEntryStatus == '1') || (dualEntryStatus == '4'))
		&&(isAmtFinal == 'T')
		&&(reviewComplete == 'T')){
			
		//nlapiLogExecution('DEBUG', 'Acq Status', 'Current Acq Status is '+ acqStatus + '');
		//Set the Acquiom Status to be approved
		exchangeRecord.setFieldValue(acqStatus, '5'); //Approved for Payment
		acqStatusValue = '5';
		//var acqStatus2 = nlapiGetFieldValue('custrecord_acq_loth_zzz_zzz_acqstatus');
		//nlapiLogExecution('DEBUG', 'Acq Status', 'Set the Acq Status to be '+ acqStatus2 + '');
	}
	//Check for Exchange Record Created
	else if((loginStatus == '' || loginStatus == null) 
			&& (lockoutStatus == '' || lockoutStatus == null) 
			&& (holdingsStatus == '' || holdingsStatus == null) 
			&& (contactStatus == '' || contactStatus == null)
			&& (taxStatus == '' || taxStatus == null)
			&& (payInfoStatus == '' || payInfoStatus == null)
			&& (medallionStatus == '' || medallionStatus == null)
			&& (eSignStatus == '' || eSignStatus == null)
			&& (addDocStatus == '' || addDocStatus == null)){
		//Set the Acquiom Status to be approved
		exchangeRecord.setFieldValue(acqStatus, '1'); //Exchange Record Created
		acqStatusValue = '1';
	}
	//Check for Paid Acquiom Status
	else if(
		((creditMemo != '') && (creditMemo != null)) 
		&& 
		((customerRefund != '') && (customerRefund != null))
	){
		exchangeRecord.setFieldValue(acqStatus, '8' ); //Paid (Refund Issued)
		acqStatusValue = '8';
	}
	//Check for Ready for Data Entry (Dual Entry)
	//Need to update this to take into account the Dual Entry Status
	//Also need to look at the Login Status being set to Offline
	else if(eSignStatus == '3'){
		exchangeRecord.setFieldValue(acqStatus, '3' ); //Ready for Data Entry
		acqStatusValue = '3';
	}
	//Check for Ready For Approval Acquiom Status
	else if(
		((holdingsStatus == '3') || (contactStatus == '3') || (taxStatus == '4') || (payInfoStatus == '3') || (medallionStatus == '3') || (eSignStatus == '3') || (addDocStatus == '3') || (isAmtFinal == 'T') || (reviewComplete == 'F')) 
		&&
		((loginStatus != '2') && (lockoutStatus != '1') && (holdingsStatus != '2') && (holdingsStatus != '5') && (contactStatus != '2') && (contactStatus != '5') && (taxStatus != '2') && (taxStatus != '3') && (taxStatus != '6') && (payInfoStatus != '2') && (payInfoStatus != '5') && (medallionStatus != '2') && (medallionStatus != '6') && (medallionStatus != '7') && (eSignStatus != '2') && (eSignStatus != '5') && (addDocStatus != '2') && (addDocStatus != '5'))
		//DO WE NEED TO CHECK TO MAKE SURE THAT FIELDS ARE NOT SET TO BLANK / DEFAULT?
	){
		exchangeRecord.setFieldValue(acqStatus, '4' ); //Ready for Review
		acqStatusValue = '4';
	}
	//Check for LOT Requires Follow Up Acquiom Status
	else if(
		((loginStatus == '2') || (lockoutStatus == '1') || (holdingsStatus == '2') || (holdingsStatus == '5') || (contactStatus == '2') || (contactStatus == '5') || (taxStatus == '2') || (taxStatus == '3') || (taxStatus == '6') || (payInfoStatus == '2') || (payInfoStatus == '5') || (medallionStatus == '2') || (medallionStatus == '6') || (medallionStatus == '7') || (eSignStatus == '2') || (eSignStatus == '5') || (addDocStatus == '2') || (addDocStatus == '5'))
	){
		exchangeRecord.setFieldValue(acqStatus, '14' ); //LOT Requires Follow Up
		acqStatusValue = '14';
	}
	//Check for LOTs Sent Acquiom Status
	else if(dealLOTSent == 'T'){
		exchangeRecord.setFieldValue(acqStatus, '2' ); //LOT Sent
		acqStatusValue = '2';
	}
	
	//Set the Acquiom Status Image Field
	if(acqStatusValue == '1'){
		exchangeRecord.setFieldValue('custrecord_acquiom_status_image', acgYellowRecordCreated); //Exchange Record Created
	}else if(acqStatusValue == '2'){
		exchangeRecord.setFieldValue('custrecord_acquiom_status_image', acqYellowLOTSent); //LOT Sent
	}else if(acqStatusValue == '4'){
		exchangeRecord.setFieldValue('custrecord_acquiom_status_image', acqOrangeReadyForReview); //Ready for Review
	}else if(acqStatusValue == '14'){
		exchangeRecord.setFieldValue('custrecord_acquiom_status_image', acqRedLOTFollowUp); //LOT Requires Follow Up
	}else if(acqStatusValue == '5'){
		exchangeRecord.setFieldValue('custrecord_acquiom_status_image', acqGreenApproved); //Approved for Payment
	}else if(acqStatusValue == '8'){
		exchangeRecord.setFieldValue('custrecord_acquiom_status_image', acqPaid); //Paid
	}else{
		exchangeRecord.setFieldValue('custrecord_acquiom_status_image', blank); //Blank
	}
	
	//Submit the Exchange Record
	try{
		nlapiSubmitRecord(exchangeRecord, false, true);
	}catch(error){
		 if (error.getCode) { //if nlobjError
		        nlapiLogExecution('DEBUG', 'TJ ERROR', 'error.getCode is ' + error.getCode() + ': error.getDetails is  ' + error.getDetails() + ': error.getStackTrace is ' + error.getStackTrace());
		        
		        //TJ wants this code in here as an example to be used at a later date
		        //if (typeof stackTrace === 'object' && stackTrace) {
		          //  email += '<li>Stack Trace Length: ' + stackTrace.length + '</li>';          
		            //for (var i = 0; stackTrace && i < stackTrace.length; i++) {
		              //  stackString += stackTrace[i] + '\n';
		           // }
		       // }
		       // else {
		         //   stackString += stackTrace;
		       // }
		 }else{
			 nlapiLogExecution('DEBUG', 'TJ ERROR', 'error.name is ' + error.name + ': error.message is ' + error.message + ': error.lineNumber is ' + error.lineNumber);
		 }
	}
	
}

function exchangeRecordSearch(exchangeRecordID){
	//search for the record based off of the record id
	// Define search filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter( 'internalid', null, 'is', exchangeRecordID ));
	
	//Define results Columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_login_status' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_lockout_stas' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_vrfy_hldngs' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_cntct_info' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_tax_doc_stas' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_pay_info' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_mdlin_status' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_esign_status' ));
	//Add ALL the case fields in here
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_login_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_lockout_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_vhold_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_cntct_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_tax_doc_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_pay_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_mdlin_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_esign_case' ));
	//Add the Two checkboxes
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_reviewcomplete' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_isamtfinal' ));
	//Add the Credit Memo and Refund fields
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_related_trans' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_related_refund' ));
	
	// Execute the search. You must specify the internal ID of the record type.
	//var exSearchResults = nlapiSearchRecord( 'customrecord_acq_lot', null, filters, columns );
	//return exSearchResults;
	return nlapiSearchRecord( 'customrecord_acq_lot', null, filters, columns );
}


//This function is actually pretty cool, simple, but cool.  It is mostly cool because I created it, and I'm cool.
//This function will be called when Lockeout Status is set to locked out (when a user is locked out of Clearing House)
//First Search for exchange records that have the same hash and do not have a lockout status of locked out
//Then Set all of the other exchange records for this hash and contact and deal to have a lockout status of locked out as well
function ultraLock(exchangeRecordID, exchangeHash, exchangeContact, exchangeDeal, lockoutStatus, statusImage, context){
	//If the Reset Hash button has been clicked, this function will be called from the handleResetHashResponse() function in the ACQ_LOT_ExchangeRec_Ajax_CS script 
	//Since this is a RESET, we need to change all statuses fields back to blank to RESET the Exchange Record
	//First we are going to Load the Exchange Record
	//Then we will set the required variables that should have been passed into the script when it was called 
	//Last we will set all the status fields for the exchange record to be blank (resetting the record)
	if(context == 'RESET'){
		var exRecReset = nlapiLoadRecord('customrecord_acq_lot', exchangeRecordID);
		var exchangeHash = exRecReset.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash'); 
		var exchangeContact = exRecReset.getFieldValue('custrecord_acq_loth_zzz_zzz_contact');
		var exchangeDeal = exRecReset.getFieldValue('custrecord_acq_loth_zzz_zzz_deal');
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_login_status', '');  //Login Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas', '');  //Lockout Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_vrfy_hldngs', '');   //Verify Holdings Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_cntct_info', '');    //Contact Info Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_tax_doc_stas', '');  //Tax Document Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_pay_info', '');      //Payment Info Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_mdlin_status', '');  //Medallian Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_esign_status', '');  //E-Sign Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_add_doc_stat', '');  //Additional Doc Status
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_de_status', '');     //Dual Entry Status ??????????????
		exRecReset.setFieldValue('custrecord_acq_loth_zzz_zzz_rcvdtimestmp', '');  //LOT Received Timestamp
		
		//Submit the record here
		nlapiSubmitRecord(exRecReset, false, true);
	}else if(context == 'UNLOCK'){
		//alert('Game Day #2');
		//alert(exchangeRecordID);
		exchangeRecordID.setFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas', '2');
		exchangeRecordID.setFieldValue('custrecord_lockout_image', '3534094');
		exchangeRecordID.setFieldValue('custrecord_acq_loth_zzz_zzz_rcvdtimestmp', '');
		
		nlapiSubmitRecord(exchangeRecordID, false, true);
	}
	
	
	nlapiLogExecution('DEBUG', 'ultraLock function ', 'Preparing the ultraLock search');
	//Define Search Filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter( 'internalid', null, 'noneof', exchangeRecordID ));
	filters.push(new nlobjSearchFilter( 'custrecord_acq_loth_zzz_zzz_exchangehash', null, 'is', exchangeHash ));
	filters.push(new nlobjSearchFilter( 'custrecord_acq_loth_zzz_zzz_contact', null, 'is', exchangeContact ));
	filters.push(new nlobjSearchFilter( 'custrecord_acq_loth_zzz_zzz_deal', null, 'is', exchangeDeal ));
	filters.push(new nlobjSearchFilter( 'isinactive', null, 'is', 'F' ));
	
	//Define Results Columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn( 'internalid' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_lockout_stas' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_exchangehash' ));
	
	nlapiLogExecution('DEBUG', 'ultraLock function ', 'Starting the Search');
	var associatedExchangeRecords = nlapiSearchRecord('customrecord_acq_lot', null, filters, columns );
	nlapiLogExecution('DEBUG', 'ultraLock function ', 'Search is complete');
	nlapiLogExecution('DEBUG', 'ultraLock function ', 'Starting the for Loop');
	for (var eLoop = 0; associatedExchangeRecords != null && eLoop < associatedExchangeRecords.length; eLoop++ ) {
		var associatedExchangeRecord = associatedExchangeRecords[eLoop];
		var associatedExchangeRecordID = associatedExchangeRecord.getId();
		nlapiLogExecution('DEBUG', 'ultraLock function ', 'Submitting the field');
		
		var currentAssociateExchangeRecord = nlapiLoadRecord('customrecord_acq_lot', associatedExchangeRecordID);
		
		if(context == ''){
			currentAssociateExchangeRecord.setFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas', '1');
			currentAssociateExchangeRecord.setFieldValue('custrecord_lockout_image', statusImage); //Red Yes Image
		}else if(context == 'UNLOCK' || context == 'RESET'){
			currentAssociateExchangeRecord.setFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas', '2');
			currentAssociateExchangeRecord.setFieldValue('custrecord_lockout_image', statusImage); //Green Reset Image
		}
		nlapiSubmitRecord(currentAssociateExchangeRecord, false, true);
		
		//nlapiSubmitField('customrecord_acq_lot', associatedExchangeRecordID, 'custrecord_acq_loth_zzz_zzz_lockout_stas', '1')
	}
}


//Do this function after submit of the Exchange Record
function closeCases(){
	exchangeRecordID = nlapiGetRecordId();
	
	//search for the record based off of the record id
	// Define search filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter( 'internalid', null, 'is', exchangeRecordID ));
	
	//Define results Columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_login_status' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_lockout_stas' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_vrfy_hldngs' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_cntct_info' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_tax_doc_stas' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_pay_info' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_mdlin_status' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_esign_status' ));
	//Add ALL the case fields in here
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_login_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_lockout_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_vhold_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_cntct_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_tax_doc_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_pay_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_mdlin_case' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_esign_case' ));
	//Add the Two checkboxes
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_reviewcomplete' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_zzz_zzz_isamtfinal' ));
	//Add the Credit Memo and Refund fields
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_related_trans' ));
	columns.push(new nlobjSearchColumn( 'custrecord_acq_loth_related_refund' ));
	
	// Execute the search. You must specify the internal ID of the record type.
	var exSearchResults = nlapiSearchRecord( 'customrecord_acq_lot', null, filters, columns );
	//return nlapiSearchRecord( 'supportcase', null, filters, columns );
	//return all status fields and all case fields
	//compare - if there is a value in the case field, check to see the value in the status field - close cases based on this
}