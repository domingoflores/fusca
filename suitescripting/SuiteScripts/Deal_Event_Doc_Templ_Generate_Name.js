/**
 * Module Description
 * This User Event Script is used to create a unique name for the Deal Escrow record.  The Name will be
 * a concatenation of the Deal Event - Document Template - Internal ID of the Deal Event Document Template Record.
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Mar 2017     Ken			   Tis the Season...
 *
 */

function generateName(type){
	// Log Type for nlapiLogExecution
	var logType = 'DEBUG';

	if(type != 'delete'){

		var recID = nlapiGetRecordId();
		var deDocTemplRec = nlapiLoadRecord('customrecord_deal_event_doc_template', recID); 

		var dealEvent = deDocTemplRec.getFieldText('custrecord_dedt_deal_event');
		var docTempl = deDocTemplRec.getFieldText('custrecord_dedt_doc_template');
		var deDocTemplID = deDocTemplRec.getId();

		deDocTemplRec.setFieldValue('name', dealEvent + '-' + docTempl + '-' + deDocTemplID);

		nlapiSubmitRecord(deDocTemplRec);		

	}
	
}

function defaultNameField(){

	nlapiSetFieldValue('name', 'Automatically Generated - PLEASE IGNORE');
}