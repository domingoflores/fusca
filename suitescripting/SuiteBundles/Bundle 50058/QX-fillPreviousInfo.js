/**
 * Module Description
 * Action looks up previous Exchange Records and fills in
 * any available data.
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 May 2014     Pete
 *
 */

/**
 * @returns {Void} Any or no return value
 */
function WAfillPreviousInfo() {

	// Get Fields
	var shareholder = nlapiGetFieldValue('custrecord_acq_loth_zzz_zzz_shareholder');
	var erEmail = nlapiGetFieldValue('custrecord_acq_loth_1_src_shrhldemail');
	var erSSN = nlapiGetFieldValue('custrecord_acq_loth_2_de1_ssnein');
	var newRec = nlapiGetNewRecord();
	var returnNote = '';
	
	if (erEmail && erEmail != '' && shareholder && shareholder != ''){
	
		var fillFields = getFields();
		
		// Run search for matching Exchange Records
		var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_shareholder', null, 'is', shareholder));
		filters.push(new nlobjSearchFilter('custrecord_acq_loth_1_src_shrhldemail', null, 'is', erEmail));
		filters.push(new nlobjSearchFilter('internalid', null, 'noneof', nlapiGetRecordId()));
		if (erSSN != null && erSSN != '') filters.push(new nlobjSearchFilter('custrecord_acq_loth_2_de1_ssnein', null, 'is', erSSN));
		
		var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_acq_pay_approve_date').setSort(true));
		for (var i = 0; i < fillFields.length; i++) {
			for (var j = 0; j < fillFields[i].length; j++) {
				columns.push(new nlobjSearchColumn(fillFields[i][j]));
			}
		}
		
		try {
			var searchRes = nlapiSearchRecord('customrecord_acq_lot', null, filters, columns);
		} catch (e) {
			returnNote += 'Search Failed - Hisorical fields not filled in\n';
			nlapiLogExecution('ERROR', returnNote, e);
		}
		
		// Fill in Fields
		if (searchRes && searchRes.length != 0){
			for (var k = 0; k < fillFields.length; k++){
				reviewAndUpdate(newRec, searchRes, fillFields[k]);
			}
			returnNote += 'Successfully Updated\n';
			
		} else {
			returnNote += 'No records found to use as reference\n';
		}
	} else {
		returnNote = 'Search Failed - Missing Email or Shareholder\n';
		nlapiLogExecution('ERROR', returnNote, 'Shareholder: ' + shareholder + ' Email: ' + erEmail);
	}
	
	// Return any notes to workflow for logging
	return returnNote;
}

function reviewAndUpdate(newRec, searchRes, flds){
	
	// Check to see if any fields in this form have values
	var hasValues = false;
	for (var i = 0; i < flds.length; i++){
		if (nlapiGetFieldValue(flds[i]) != null && nlapiGetFieldValue(flds[i]) != '') {
			hasValues = true;
			break;
		}
	}
	
	// If all are empty, fill historical
	if (!hasValues){
		
		// Determine Which line to use
		var recToUse = null;
		for (var l = 0; l < searchRes.length; l++){
			for (var k = 0; k < flds.length; k++){
				if (searchRes[l].getValue(flds[k]) != null && searchRes[l].getValue(flds[k]) != ''){
					recToUse = l;
					break;
				}
			}
			if (recToUse != null) break;
		}
		
		// Fill all fields in form
		if (recToUse != null){
			for (var j = 0; j < flds.length; j++){
				newRec.setFieldValue(flds[j], searchRes[recToUse].getValue(flds[j]));
				nlapiLogExecution('DEBUG', flds[j] + ' set to ' + searchRes[recToUse].getValue(flds[j]));
			}
		}
	}
}

//Get fields to process
function getFields(){
	
	// Sets of fields are processed together and are filled as a "set" from previous records
	var fillFields = new Array();
	
	// Form 1 Fields - Individual Fields
	fillFields.push(['custrecord_acq_loth_1_de1_shrhldname']);
	fillFields.push(['custrecord_acq_loth_1_de1_shrhldauth']);
	fillFields.push(['custrecord_acq_loth_1_de1_shrhldphone']);
	fillFields.push(['custrecord_acq_loth_1_de1_shrhldtitle']);
	
	// Form 1 Fields - Address Block
	fillFields.push([	                 
	    'custrecord_acq_loth_1_de1_shrhldaddr1',
	    'custrecord_acq_loth_1_de1_shrhldaddr2',
	    'custrecord_acq_loth_1_de1_shrhldcity',
	    'custrecord_acq_loth_1_de1_shrhldstate',
	    'custrecord_acq_loth_1_de1_shrhldpostalcd',
	    'custrecord_acq_loth_1_de1_shrhldcountry']);
	
	// Form 2 Fields
	fillFields.push([
 	    'custrecord_acq_loth_2_de1_irsname',
 	    'custrecord_acq_loth_2_de1_ssnein',//
 	    'custrecord_acq_loth_2_de1_taxclass',
 	    'custrecord_acq_loth_2_de1_bckupwholding',
 	    'custrecordacq_loth_2_de1_taxidmethod']);
	
	// Form 4 Fields
	fillFields.push([
  	    'custrecord_acq_loth_4_de1_lotpaymethod']);
	
	// Form 5A Fields
	fillFields.push([
	    'custrecord_acq_loth_5a_de1_nameonbnkacct',
  	    'custrecord_acq_loth_5a_de1_bankaccttype',
  	    'custrecord_acq_loth_5a_de1_abaswiftnum',//
  	    'custrecord_acq_loth_5a_de1_bankacctnum',//
  	    'custrecord_acq_loth_5a_de1_bankname']);
	
	// Form 5B Fields
	fillFields.push([
	    'custrecord_acq_loth_5b_de1_nameonbnkacct',
  	    'custrecord_acq_loth_5b_de1_bankacctnum',//
  	    'custrecord_acq_loth_5b_de1_abaswiftnum',//
  	    'custrecord_acq_loth_5b_de1_sortcode',
  	    'custrecord_acq_loth_5b_de1_bankname',
  	    'custrecord_acq_loth_5b_de1_bankcontact',
  	    'custrecord_acq_loth_5b_de1_bankphone',
  	    'custrecord_acq_loth_5b_de1_frthrcrdtacct',
  	    'custrecord_acq_loth_5b_de1_frthrcrdtname',
  	    'custrecord_acq_loth_5b_de1_bankcountry']);
	
	// Form 5C Fields
	fillFields.push([
	    'custrecord_acq_loth_5c_de1_checkspayto',
  	    'custrecord_acq_loth_5c_de1_checksmailto',
  	    'custrecord_acq_loth_5c_de1_checksaddr1',
  	    'custrecord_acq_loth_5c_de1_checksaddr2',
  	    'custrecord_acq_loth_5c_de1_checkscity',
  	    'custrecord_acq_loth_5c_de1_checksstate',
  	    'custrecord_acq_loth_5c_de1_checkszip',
  	    'custrecord_acq_loth_5c_de1_checkscountry']);
	
	return fillFields;
	
}

