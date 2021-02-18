/**
 * Module Description
 * This script calls the script that updates the Acquiom Status based on the individual Statuses that are set by the 
 *
 * Version    Date             Author           Remarks
 * 1.00       20 August 2014   sstreule         "Everything is Awesome"
 * 1.01		  03 February 2015 sstreule		    Adding logic to check for the skip status calculation checkbox
 * 1.02		  21 July 2015     sstreule		    Adding logic to check if an exchange hash actually exists
 * 1.03		  17 August 2015   sstreule		    Added a check to make sure that the type is not delete or cancel.  
 * 												No use to call scripts on a deleted record or a cancelled save
 * 
 *
 */

//Need to update to exclude this from running on record deletion
//Pass in type and run only if != delete

function callLibraryScript(type){
	var logLevel = 'DEBUG';
	//LOG LINE
	nlapiLogExecution(logLevel, 'Call Library Script', 'Made it into the callLibraryScript function');
	//Check to see if the record is being edited or deleted / canceled
	if(type != 'delete' && type != 'cancel'){
		var recordType = 'ExchangeRecord';
		var exchangeRecordID = nlapiGetRecordId();
		//LOG LINE
		nlapiLogExecution(logLevel, 'nlapiGetRecordId() returns ', exchangeRecordID);
		var exchangeRecord = nlapiLoadRecord('customrecord_acq_lot', exchangeRecordID);
		var skipAcquiomStatus = exchangeRecord.getFieldValue('custrecord_acq_loth_skip_acqstatus');
		var exchangeHash = exchangeRecord.getFieldValue('custrecord_acq_loth_zzz_zzz_exchangehash');

		//Added this if statement to allow Admins and Operations Manager to cancel the automatic calculation of the Acquiom Status
		//The field custrecord_acq_loth_skip_acqstatus is setup to only be seen and edited by Admin and Operations Manager roles
		if((exchangeHash != '' && exchangeHash != null) && skipAcquiomStatus == 'F'){
			//LOG LINE
			nlapiLogExecution(logLevel, 'IF Result', (exchangeHash != '' || exchangeHash != null) ? 'True':'False');
			//LOG LINE
			nlapiLogExecution(logLevel, 'Exchange Hash', JSON.stringify(exchangeHash));
			setStatus(type, 'ExchangeRecord', exchangeRecord, exchangeRecordID);
		}else{
			//Do Nothing...  Well, you can do something, just don't change the Acquiom Status
		}
	}else{
		//The Record is not being saved.
		//LOG LINE
		nlapiLogExecution(logLevel, 'Call Library Script', 'The statuses were not updated because the action type is ' + type);
	}
}
