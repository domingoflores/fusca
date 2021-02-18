/**
 * Module Description
 * This Script is used to create a UNIQUE name for the Deal Escrow record.  The Name will be
 * a concatenation of the Deal - Escrow Type - Internal ID of the Deal Escrow Record.
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Nov 2016     Ken			   Tis the Season...
 *
 */

function generateName(type){
	// Lets set some variables.  YEAH!!!
	// Log Type for nlapiLogExecution
	var logType = 'DEBUG';
	
	// LOG
	nlapiLogExecution(logType, 'What type is this?', 'type is ' + type);

	if(type != 'delete'){

		var recID = nlapiGetRecordId();
		var dealEscrowRec = nlapiLoadRecord('customrecord_deal_escrow', recID);

		var deal = dealEscrowRec.getFieldText('custrecord_de_deal');
		var escrowType = dealEscrowRec.getFieldText('custrecord_de_escrow_type');
		var dealEscrowRecID = dealEscrowRec.getId();
		//var dealEscrowRecID = nlapiGetRecordId();

		// LOG
		nlapiLogExecution(logType, 'FIRST LOG', 'Deal Record ID is ' + dealEscrowRecID);

		dealEscrowRec.setFieldValue('name', deal + '-' + escrowType + '-' + dealEscrowRecID);

		nlapiSubmitRecord(dealEscrowRec);		

	}
	
}

function defaultNameField(){

	nlapiSetFieldValue('name', 'Automatically Generated - PLEASE IGNORE');
}