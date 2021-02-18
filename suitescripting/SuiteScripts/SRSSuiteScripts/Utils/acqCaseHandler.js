/**
* Module Description
* This script assigns Exchange Records to Cases when the case is created, but only if the case 
* is associated with the Acquiom case queue (ID = 24). This script also updates each status on
* the associated exchange record based on the type of case that is created.
*
* Version  Date             Author      Remarks
* 1.00     20 August 2014   sstreule    "Everything is Awesome"
* 
* 1.01	   10 March 2015	sstreule	Everything is not Awesome anymore.  Added a check to 
* see if the Associated Exchange Record field is already populated.  If it is already populated 
* than there is no need to try and find out which Exchange Record this case is associted with.
* 
* 
*
*
*
*/

function acqCaseHandler(type){
	//Band aid for the Development Environment not being insync with the Production Environment
	//This is only used and updated when Prod and Dev fall out of sync because of Cowboy Admins 
	//running around all crazy doing whatever they feel like and pretending that developing systems 
	//and software can be handled the same way things were handled in the old days of the Wild West.  
	var currEnvironment = (nlapiGetContext().getEnvironment() + nlapiGetContext().getCompany());
	if(currEnvironment == "SANDBOX772390"){
		//List of Development Sandbox Categories
		var loginCat = "181";  //Case Category -- Clearinghouse Login (181)
		var lockoutCat = "180";  //Case Category -- Clearinghouse Lockout (180)
		var awaitingCertsCat = "171";  //Case Category -- Awaiting Certificates (171)
		var certsDeletedCat = "178";  //Case Category -- Certificates Deleted (178)
		var verifiedCertsCat = "296";  //Case Category -- Verified Certificates (296)
		var awaitingMedallionCat = "173";  //Case Category -- Awaiting Medallion (173)
		var awaitingSignedW9Cat = "176";  //Case Category -- Awaiting Signed W9 (176)
		var w9SignedCat = "287";  //Case category -- W9 Signed (287)
		var awaitingW8Cat = "177";  //Case Category -- Awaiting W8 (177)
		var verifiedContactInfoCat = "297";  //Case Category -- Verified Contact Info (297)
		var verifiedPaymentInfoCat = "298";  //Case Category -- Verified Payment Info (298)
		var awaitingSignedLOTCat = "175";  //Case Category -- Awaiting Signed LOT (175)
		var LOTCat = "112";  //Case Category -- LOT (112)
		var custElectNoMedallionCat = "283";  //Case Category -- Customer Elects - No Medallion (283)
	}else{
		//List of Production Categories
		var loginCat = "181";  //Case Category -- Clearinghouse Login (181)
		var lockoutCat = "180";  //Case Category -- Clearinghouse Lockout (180)
		var awaitingCertsCat = "171";  //Case Category -- Awaiting Certificates (171)
		var certsDeletedCat = "178";  //Case Category -- Certificates Deleted (178)
		var verifiedCertsCat = "296";  //Case Category -- Verified Certificates (296)
		var awaitingMedallionCat = "173";  //Case Category -- Awaiting Medallion (173)
		var awaitingSignedW9Cat = "176";  //Case Category -- Awaiting Signed W9 (176)
		var w9SignedCat = "287";  //Case category -- W9 Signed (287)
		var awaitingW8Cat = "177";  //Case Category -- Awaiting W8 (177)
		var verifiedContactInfoCat = "297";  //Case Category -- Verified Contact Info (297)
		var verifiedPaymentInfoCat = "298";  //Case Category -- Verified Payment Info (298)
		var awaitingSignedLOTCat = "175";  //Case Category -- Awaiting Signed LOT (175)
		var LOTCat = "112";  //Case Category -- LOT (112)
		var custElectNoMedallionCat = "283";  //Case Category -- Customer Elects - No Medallion (283)
	}
	
	var logLevel = 'ERROR';
	//var dataObj = {}; NEED TO USE OBJECT FOR PASSING ALL THIS DATA BETWEEN FUNCTIONS
	var newCase = nlapiGetNewRecord();
	var newCaseID = nlapiGetRecordId();
	var newCaseQueue = newCase.getFieldValue('custevent_case_queue');
	var exchangeRecordID = newCase.getFieldValue('custevent_qx_acq_associatedexchangereco');
	var recordType = 'Case';
	
	//Check to see if this is an Acquiom Case and the case is being created. 24 is the ID of the Acquiom Case Queue.  
	if ((type == 'create') && (newCaseQueue == '24')){
				
		//Set Variables for the New Case fields
		var newCase = nlapiLoadRecord('supportcase', newCaseID);	
		var newCaseDateString = newCase.getFieldValue('startdate');
		var newCaseTime = newCase.getFieldValue('starttime');
		var newCaseDateTimeString = (newCaseDateString+' '+newCaseTime);
		var newCaseDate = nlapiStringToDate(newCaseDateTimeString);
		var newCaseCompany = newCase.getFieldValue('company');
		var newCaseEscrow = newCase.getFieldValue('custevent1');
		var newCaseNumber = newCase.getFieldValue('casenumber');
		var newCaseCategory = newCase.getFieldValue('custevent_case_category');
		
		//Also check to see if the Associated Exchange Record field is populated.
		if((exchangeRecordID == '') || (exchangeRecordID == null)){
		
			nlapiLogExecution(logLevel, 'Associated Exchange Record', 'Error: The Associated Exchange Record field was sent over blank from ClearingHouse.  The Case ID is '+ newCaseID);
			// Define search filters
			var filters = new Array();
			filters[0] = new nlobjSearchFilter( 'custrecord_acq_loth_zzz_zzz_shareholder', null, 'is', newCaseCompany );
			filters[1] = new nlobjSearchFilter( 'custrecord_acq_loth_zzz_zzz_deal', null, 'is', newCaseEscrow );
		
			// Execute the search. You must specify the internal ID of the record type.
			var searchresults = nlapiSearchRecord( 'customrecord_acq_lot', null, filters );
		
			if(searchresults.length > 1){
				//LOG LINE
				nlapiLogExecution(logLevel, 'Search Results', 'Error: The Exchange Record with ID of'+ exchangeRecordID +' Search found more than 1 result'+ newCaseID);
			}else if(searchresults.length < 1){
				//LOG LINE
				nlapiLogExecution(logLevel, 'Search Results', 'Error: The Exchange Record Search did not find any Exchange Records');
			}else{
				//LOG LINE
				nlapiLogExecution(logLevel, 'Search Results', 'Success: The Exchange Record Search found '+ searchresults.length +' Exchange Records. newCase = '+ newCase);
				//Get the Exchange Record ID
				var exchangeRecordID = searchresults[0].getId();
				//LOG LINE
				nlapiLogExecution(logLevel, 'Search Results', 'Success: The Exchange Record id is '+ exchangeRecordID);
				// Load the Exchange Record based off of the exchangeRecordID
				var exchangeRecord = nlapiLoadRecord('customrecord_acq_lot', exchangeRecordID);
				//Set Case link to the Exchange Record
				newCase.setFieldValue('custevent_qx_acq_associatedexchangereco', exchangeRecordID);
				//LOG LINE
				nlapiLogExecution(logLevel, 'Set Field Value', 'Success: The Exchange Record is now associated to the case in the Associated Exchange Record field');
			}
		}else{
			var exchangeRecord = nlapiLoadRecord('customrecord_acq_lot', exchangeRecordID);
		}
		
		//LOG LINE
		nlapiLogExecution(logLevel, 'Exchange Record Variable', 'var exchangeRecord = ' + exchangeRecord);
		
		// Set Variables for the Exchange Record Status Fields
		var currXchangeRecCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_lot_case'); //LOT Case field
		var currXchangeRecLoginStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_login_status'); //Login Status
		var currXchangeRecLockOutStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_lockout_stas'); //Locked Out of CH
		var currXchangeRecVerifyHoldings = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_vrfy_hldngs'); //Verify Holdings
		var currXchangeRecContactInfo = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_cntct_info'); //Contact Info
		var currXchangeRecTaxDocStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_tax_doc_stas'); //Tax Document Status
		var currXchangeRecPayInfoStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_pay_info'); //Payment Information
		var currXchangeRecMedallionStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_mdlin_status'); //Medallion Guarantee
		var currXchangeRecEsignStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_esign_status'); //ESign Status
		// Set Variables for the Exchange Record Case fields
		//var currXchangeRecLoginCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_login_case'); //Login Case
		//var currXchangeRecLockOutCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_lockout_case'); //Locked Out of CH Case
		//var currXchangeRecVerifyHoldingsCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_vhold_case'); //Verify Holdings Case
		//var currXchangeRecContactInfoCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_cntct_case'); //Contact Info Case
		//var currXchangeRecTaxDocCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_tax_doc_case'); //Tax Document Case
		//var currXchangeRecPayInfoCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_pay_case'); //Payment Information Case
		//var currXchangeRecMedallionCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_mdlin_case'); //Medallion Guarantee Case
		//var currXchangeRecEsignCase = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_esign_case'); //ESign Case
		

		
		//Case Category -- Clearinghouse Login (181)
		if(newCaseCategory == loginCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecLoginStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_login_status';
			var statusFieldValue = '1'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_login_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);	
		}
		//
		// Need to add in logic to revert this status if it is changed to Reset or Taken offline if a Logon case is created after the incident date of these cases and these cases are not set to closed (i think)
		//
		//Case category -- Clearinghouse Lockout (180)
		else if(newCaseCategory == lockoutCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecLockOutStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_lockout_stas';
			var statusFieldValue = '1'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_lockout_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);				
		
		}
		//Case category -- Awaiting Certificates (171)
		else if(newCaseCategory == awaitingCertsCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
					
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecVerifyHoldings;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_vrfy_hldngs';
			var statusFieldValue = '2'; //Changes
			var caseField = 'custrecord_acq_loth_zzz_zzz_vhold_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Certificates Deleted (178)
		else if(newCaseCategory == certsDeletedCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
					
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecVerifyHoldings;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_vrfy_hldngs';
			var statusFieldValue = '2'; //Changes
			var caseField = 'custrecord_acq_loth_zzz_zzz_vhold_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Verified Certificates (280)
		else if(newCaseCategory == verifiedCertsCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
					
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecVerifyHoldings;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_vrfy_hldngs';
			var statusFieldValue = '1'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_vhold_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case Category -- Awaiting Medallion (173)
		else if(newCaseCategory == awaitingMedallionCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
				
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecMedallionStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_mdlin_status';
			var statusFieldValue = '2'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_mdlin_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Awaiting Signed W9 (176)
		else if(newCaseCategory == awaitingSignedW9Cat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecTaxDocStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_tax_doc_stas';
			var statusFieldValue = '3'; //Offline W9
			var caseField = 'custrecord_acq_loth_zzz_zzz_tax_doc_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- W9 Signed (287)
		else if(newCaseCategory == w9SignedCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecTaxDocStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_tax_doc_stas';
			var statusFieldValue = '1'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_tax_doc_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Awaiting W8 (177)
		else if(newCaseCategory == awaitingW8Cat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
					
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecTaxDocStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_tax_doc_stas';
			var statusFieldValue = '2'; //Offline W8
			var caseField = 'custrecord_acq_loth_zzz_zzz_tax_doc_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Verified Contact Info (281)
		else if(newCaseCategory == verifiedContactInfoCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			 	
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecContactInfo;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_cntct_info';
			var statusFieldValue = '1'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_cntct_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Verified Payment Info (282)
		else if(newCaseCategory == verifiedPaymentInfoCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecPayInfoStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_pay_info';
			var statusFieldValue = '1'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_pay_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Awaiting Signed LOT (175)
		else if(newCaseCategory == awaitingSignedLOTCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			 
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecEsignStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_esign_status';
			var statusFieldValue = '2'; //Offline
			var caseField = 'custrecord_acq_loth_zzz_zzz_esign_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- LOT (112)
		else if(newCaseCategory == LOTCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			 
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecEsignStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_esign_status';
			var statusFieldValue = '1'; //Yes
			var caseField = 'custrecord_acq_loth_zzz_zzz_esign_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}
		//Case category -- Customer Elects - No Medallion (283)
		else if(newCaseCategory == custElectNoMedallionCat){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The Case has a case category of '+newCaseCategory);
			 
			//Set vars for the fields to be edited on the Exchange Record
			var statusField = currXchangeRecMedallionStatus;
			var statusFieldID = 'custrecord_acq_loth_zzz_zzz_mdlin_status';
			var statusFieldValue = '7'; //Customer Elects - No Medallion
			var caseField = 'custrecord_acq_loth_zzz_zzz_mdlin_case';
			//Call the function to update the fields
			setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase);
		}else{
			//Just because its always nice to have a last resort
			//So Guess what? This is the last resort if a case is sent over with a case category other than the categories in the above if statements
			//then that case is not categorized as an Acquiom case
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' does not have an if statement associated with it.');
		}
		
	//Submit the New Case so the exchange record association is populated	
	nlapiSubmitRecord(newCase, false, true);
	
	}else{
		//Wrong Type of action or Case Queue
	}
}


	
function setXchangeRecordFields(statusField, statusFieldID, statusFieldValue, caseField, newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecord, exchangeRecordID, currXchangeRecCase){
	
	var logLevel = 'ERROR';
	
	//Check to see if the medallion status is Yes. If so, set the Payment Info status to be Offline
	if((statusFieldID == 'custrecord_acq_loth_zzz_zzz_mdlin_status')&&(statusFieldValue == '2')){
		exchangeRecord.setFieldValue('custrecord_acq_loth_zzz_zzz_pay_info', '2');
	}else{
		//Do Nothing, absolutely Nothing. Stop, do less... No do even less... Well don't do nothing... exit and continue
	}
	
	if((statusField == '')||(statusField == null)){
		//LOG LINE
		nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The LOT Case field on Exchange Record is empty. The Value is '+ currXchangeRecCase +' . newCaseID = '+ newCaseID);
		//Set the appropriate caseField on the Exchange Record with the Case Number
		exchangeRecord.setFieldValue(caseField, newCaseID);
		//Set the Status Field
		exchangeRecord.setFieldValue(statusFieldID, statusFieldValue);
		//Submit the Exchange Record and say goodbye
		//nlapiSubmitRecord(exchangeRecord, false, true);
		setStatus(type, 'Case', exchangeRecord, exchangeRecordID);
		//LOG LINE
		nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: Submitting the Exchange Record now and exiting the Script');
	}else if((statusField != '')||(statusField != null)){
		//LOG LINE
		nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The LOT Case field on Exchange Record is NOT empty');
		//Perform search for other Clearinghouse cases
		var mostRecentCase = findAndDupCases(newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecordID);
		//Set the appropriate Case Field
		exchangeRecord.setFieldValue(caseField, mostRecentCase.id);
		//Set the Status Field
		exchangeRecord.setFieldValue(statusFieldID, statusFieldValue);
		//Submit the Exchange Record and say goodbye
		//nlapiSubmitRecord(exchangeRecord, false, true);
		//Hmmmmmmmm...
		setStatus(type, 'Case', exchangeRecord, exchangeRecordID);
	}
}


function caseSearch(newCaseQueue, newCaseCategory, exchangeRecordID, columns){
	// Define search filters
	var filters = new Array();
	filters[0] = new nlobjSearchFilter( 'custevent_case_queue', null, 'is', newCaseQueue );
	filters[1] = new nlobjSearchFilter( 'custevent_case_category', null, 'is', newCaseCategory );
	filters[2] = new nlobjSearchFilter( 'custevent_qx_acq_associatedexchangereco', null, 'is', exchangeRecordID );
	filters[3] = new nlobjSearchFilter( 'status', null, 'noneof', '7' );
	//Need to add a filter to not search for the new case we are adding... it shouldn't be in there because it isn't created yet
	
	//Define results Columns
	var columns = new Array();
	columns[0] = new nlobjSearchColumn( 'custevent_qx_acq_associatedexchangereco' );
	columns[1] = new nlobjSearchColumn( 'status' );
	columns[2] = new nlobjSearchColumn( 'startdate' );
	columns[3] = new nlobjSearchColumn( 'casenumber' );
	
	// Execute the search. You must specify the internal ID of the record type.
	//var existingCaseSearchResults = nlapiSearchRecord( 'supportcase', null, filters );
	return nlapiSearchRecord( 'supportcase', null, filters, columns );
	
	//if(existingCaseSearchResults.length > 0){
		//Run a FOR LOOP to run through all of the results and find the result with the most recent incident date... set all the other cases statuses to duplicate and return the case number from the most recent case
			
	//}else if(existingCaseSearchResults.length < 1){
		//There are no Cases
	//}
}




function findAndDupCases(newCase, newCaseID, newCaseCategory, newCaseDate, exchangeRecordID){
	//NEED to Pass logLevel variable from other functions
	var logLevel = "ERROR";
	var columns = new Array();
	var existingCaseResults = caseSearch('24', newCaseCategory, exchangeRecordID, columns);
	var mostRecentCase = {};
	mostRecentCase.id = newCaseID;//set this to the new case id
	mostRecentCase.date = nlapiStringToDate(newCaseDate);//set this to the new case startdate and change from string to date
	mostRecentCase.row = 0;//set this to the first row which will always start at 0
	
	if(existingCaseResults != null && existingCaseResults != ''){
		//LOG LINE
		nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: There are existingCaseResults from the caseSearch function');
		
		for(var x = 0; x < existingCaseResults.length; x++){
			//LOG LINE
			nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: We are in the for loop for case '+ x);
			var existingCase = existingCaseResults[x];
			var existingCaseID = existingCaseResults[x].getId();
			var existingCaseDateString = existingCase.getValue('startdate');
			var existingCaseDate = nlapiStringToDate(existingCaseDateString);
			
			if(existingCaseDate > mostRecentCase.date){
				//LOG LINE
				nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: The existingCaseDate of ('+ existingCaseDate +') is less than the mostRecentCase.date ('+ mostRecentCase.date +')');
				//set the status of the older case to Duplicate and submit the field using nlapisubmitField()
				if(mostRecentCase.id == newCaseID){
					newCase.setFieldValue('status', '7');
				}else{
					nlapiSubmitField('supportcase', mostRecentCase.id, 'status', '7');
				}
				mostRecentCase.date = existingCaseDate;
				mostRecentCase.id = existingCase.getId();
				mostRecentCase.row = x;
			}else{
				//LOG LINE
				nlapiLogExecution(logLevel, 'Category '+newCaseCategory+' If Statement', 'Success: Time to change the status of the existing case to be Duplicate (7)');
				//set the status of the older case to Duplicate and submit the field using nlapisubmitField()
				nlapiSubmitField('supportcase', existingCaseID, 'status', '7');
			}
		}
		//var caseRow = existingCaseResults[mostRecentCase.row];
		//modify search from below to return caseNumber
		//compare the casenumber to the field for the case on the exchange record
		//if they are equal then we are done, if they are not then load the most recent caseNumber
		//exchangeRecord.setFieldValue('custrecord_acq_loth_zzz_zzz_lot_case', mostRecentCase.id); //THIS CANNOT ALWAYS BE SET TO newCaseID if newCaseID is not garunteed to be the most recent caseId
		//nlapiLogExecution(logLevel, 'Category 181 If Statement', 'Success: Setting the LOT CASE field o the Exchange Record to be '+ currXchangeRecCase);
		
		//Set the Login Status field to Yes
		//exchangeRecord.setFieldValue('custrecord_acq_loth_zzz_zzz_login_status', '1');
		//Submit the Exchange Record and say goodbye
		//nlapiSubmitRecord(exchangeRecord);
	}
	//set the value of the associated case field on the exchange record right here
	//nlapiSubmitField('customrecord_acq_lot', exchangeRecordID, caseField, mostRecentCase.id);
	//exchangeRecord.setFieldValue(caseField, mostRecentCase.id);
	return mostRecentCase;
	//nlapiSubmitRecord(exchangeRecord);
}