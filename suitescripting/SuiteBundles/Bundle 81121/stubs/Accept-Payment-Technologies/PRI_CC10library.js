//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------
/**
     * Class: securityKey
     * Description: Creates unique Security Key with expiration and stores in a custom record.  
     * 			    Includes function for validating key.
     * Usage Example: 
     * Create Key: var securityKeyObj = new securityKey();
     *             var key = securityKeyObj.createKey({recType:'customer',recId:'2056',refFieldId:'internalid'});
     * Validate Key: var securityKeyObj = new securityKey();
     *               securityKeyObj.validateKey({key:'5b19fafe-e588-465e-9466-daede4ee3c11',refValue:'2056',expirationDelayMinutes:'30'}); //returns boolean
     */
function securityKey(inObj){
	var logTitle='securityKey';

	//input variables

	//calculated values
	this.key;

	//processing functions
	this.createKey=createKey;
	this.validateKey=validateKey;
}
//------------------------------------------------------------------------------------------------------------------------------------
//Function:			createKey
//Description:		creates unique encrypted key stored on custom record.
//Date:				20180711
//------------------------------------------------------------------------------------------------------------------------------------
function createKey(inObj){
	var logTitle='createKey';
	if(isEmpty(inObj.recType)) throw 'Missing parameter recType.  Unable to create security key.';
	if(isEmpty(inObj.recId)) throw 'Missing parameter recId.  Unable to create security key.';
	if(isEmpty(inObj.refFieldId)) throw 'Missing parameter refFieldId.  Unable to create security key.';
	
	//Obtain refValue.  This is a reference value on a record associated to the Key.  It is required in validation and makes validation more robust.
	var lookupValue = nlapiLookupField(inObj.recType,inObj.recId,inObj.refFieldId);
	if(isEmpty(lookupValue)) throw 'Empty lookup value.';
	
	this.key = generateKey(lookupValue);
	nlapiLogExecution('debug',logTitle,'Created key: '+this.key);
	var objRecord = nlapiCreateRecord('customrecord_pri_cc_security_key');
	objRecord.setFieldValue('custrecord_pri_cc_security_key',this.key);
	objRecord.setFieldValue('custrecord_pri_cc_security_reference',lookupValue);
	var recordId = nlapiSubmitRecord(objRecord,false,true);
	
	nlapiLogExecution('debug',logTitle,'Successfully stored security key.  Custom Record ID: '+recordId);
	nlapiLogExecution('audit',logTitle,'Successfully created key: '+this.key+', Storage custom Record ID: '+recordId);
	return this.key;
}

//------------------------------------------------------------------------------------------------------------------------------------
//Function:			generateEncryptedKey
//Description:		generates unique encrypted key.
//Date:				20180711
//------------------------------------------------------------------------------------------------------------------------------------
function generateKey(refValue){
	var logTitle='generateKey';
	var uniqueKey=false;
	var i=0;
	while(!uniqueKey){
		i++;
		if(i>10) throw 'The system is having difficulty creating a unique security key.';
		var key = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
		    return v.toString(16);
		});
		var filters = [];
		var columns = [];
		filters.push(new nlobjSearchFilter('custrecord_pri_cc_security_key', null,'is',key));
		filters.push(new nlobjSearchFilter('custrecord_pri_cc_security_reference', null,'is',refValue));
		columns.push(new nlobjSearchColumn('internalid'));
		var searchResults = nlapiSearchRecord('customrecord_pri_cc_security_key',null, filters, columns);
		
		if(isEmpty(searchResults)) {
			nlapiLogExecution('debug',logTitle,'Successfully created unique key.')
			uniqueKey=true;
		}
		else nlapiLogExecution('debug',logTitle,'Found duplicate Key, RefValue pair.  Generating another key.  Try number: '+i);
	}
	return key;
}

function validateKey(inObj){
	var logTitle='validateKey';
	nlapiLogExecution('debug',logTitle,'inObj: '+JSON.stringify(inObj));
	if(isEmpty(inObj.key)) throw 'Missing parameter key.  Unable to validate security key.';
	if(isEmpty(inObj.refValue)) throw 'Missing parameter refValue.  Unable to validate security key.';
	
	var filters = [];
	var columns = [];
	filters.push(new nlobjSearchFilter('custrecord_pri_cc_security_key', null,'is',inObj.key));
	filters.push(new nlobjSearchFilter('custrecord_pri_cc_security_reference', null,'is',inObj.refValue));
	columns.push(new nlobjSearchColumn('internalid'));
	//Next line is commented out because we've seen it's more reliable to use 'created'
	//myColumns.push(search.createColumn({name: 'custrecord_pri_cc_created'}));
	columns.push(new nlobjSearchColumn('created'));
	columns.push(new nlobjSearchColumn('custrecord_pri_cc_security_reference'));
	
	var searchResult = nlapiSearchRecord('customrecord_pri_cc_security_key',null, filters, columns);

	if(!isEmpty(searchResult) && searchResult.length>0){
		nlapiLogExecution('audit',logTitle,'searchResult.length: '+searchResult.length);
		if(searchResult.length > 1) {
			nlapiLogExecution('audit',logTitle,'There are duplicate keys for Key / RefValue pair.');
			return false;
		}
		else if(searchResult.length == 1){
			if(!isEmpty(inObj.expirationDelayMinutes)){
				nlapiLogExecution('debug',logTitle,'Key was found.  Checking if expired.');
				var keyRecId = searchResult[0].getId();
				var keyRecRefValue = searchResult[0].getValue('custrecord_pri_cc_security_reference');
				//Next line is commented out because we've seen it's more reliable to use 'created'
				//var dateCreatedString = searchResult[0].getValue('custrecord_pri_cc_created');
				var dateCreatedString = searchResult[0].getValue('created');
				nlapiLogExecution('debug',logTitle,'keyRecId, keyRecRefValue, dateCreatedString: '+keyRecId+', '+keyRecRefValue+', '+dateCreatedString);
				
				var dateCreatedObj = nlapiStringToDate(dateCreatedString);
				var dateExpiresObj = nlapiStringToDate(dateCreatedString);
				
				dateExpiresObj.setMinutes(dateExpiresObj.getMinutes() + parseInt(inObj.expirationDelayMinutes));
				var dateNowObj = new Date();
				nlapiLogExecution('debug',logTitle,'dateCreatedObj: '+dateCreatedObj);
				nlapiLogExecution('debug',logTitle,'dateExpiresObj: '+dateExpiresObj);
				nlapiLogExecution('debug',logTitle,'dateNowObj: '+dateNowObj);
				if (dateExpiresObj > dateNowObj){
					nlapiLogExecution('audit',logTitle,'Key is not expired and is valid');
					return true;
				}
				else {
					nlapiLogExecution('audit',logTitle,'Key expired');
					return false;
				}
			}
			else{
				nlapiLogExecution('audit',logTitle,'Found unique key.');
				return true;
			}
		}
		else{
			nlapiLogExecution('audit',logTitle,'Unexpected search result.');
			return false;
		}
	}
	else nlapiLogExecution('audit',logTitle,'Key not found');
	return false;
}
function isEmpty(val) {
	return (val == undefined || val == null || val == '');	
}