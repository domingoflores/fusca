function nbsABR_RcnRules_OnSave()
{
	var useTrxType = nlapiGetFieldValue('custrecord_rr_gltransactions');
		
	if (useTrxType == 'T'){
		var BP = nlapiGetFieldValue('custrecord_rr_billpayment');
		var CS = nlapiGetFieldValue('custrecord_rr_cashsale');
		var CH = nlapiGetFieldValue('custrecord_rr_check');
		var CD = nlapiGetFieldValue('custrecord_rr_customerdeposit');
		var DP = nlapiGetFieldValue('custrecord_rr_deposit');
		var JE = nlapiGetFieldValue('custrecord_rr_journalentry');
		var PY = nlapiGetFieldValue('custrecord_rr_payment');
		var TR = nlapiGetFieldValue('custrecord_rr_transfer');
		
		if(BP=='F'&&CS=='F'&&CH=='F'&&CD=='F'&&DP=='F'&&JE=='F'&&PY=='F'&&TR=='F'){
			alert("To match using trnasaction type, select one or more transaction types.");		
			return false;	
		}
	}
	/*if(nlapiGetFieldValue('custrecord_rr_docnumber') == 'T'){
		var intFrm = nlapiGetFieldValue('custrecord_rr_documentfrom');
		var intTo = nlapiGetFieldValue('custrecord_rr_documentto');
		if(intFrm=='' || intTo==''){
			alert("To match using a document/check number, From and To fields cannot be empty!");		
			return false;	
		}
	}
		if(nlapiGetFieldValue('custrecord_rr_reference') == 'T'){
			var intFrm = nlapiGetFieldValue('custrecord_rr_referencefrom');
			var intTo = nlapiGetFieldValue('custrecord_rr_referenceto');
			var intNSFrm = nlapiGetFieldValue('custrecord_rr_nsreferencefrom');
			var intNSTo = nlapiGetFieldValue('custrecord_rr_nsreferenceto');
			if(intFrm=='' || intTo=='' || intNSFrm=='' || intNSTo==''){
				alert("To match using a reference, From and To fields cannot be empty!");		
				return false;	
			}
		}*/
	return true;	
}
/** nbsABR_RcnRules_VldtFld - validate field
*/
function nbsABR_RcnRules_VldtFld(type, field){
	
	if((nlapiGetFieldValue('custrecord_rr_docnumber') == 'T') && ((field == 'custrecord_rr_documentfrom') || (field == 'custrecord_rr_documentto'))){
		var intFrm = parseInt(nlapiGetFieldValue('custrecord_rr_documentfrom'),10);
		var intTo = parseInt(nlapiGetFieldValue('custrecord_rr_documentto'),10);
				
		if ((field == 'custrecord_rr_documentto') && (intFrm > intTo)){	
			alert("Start number cannot be greater than end number!");
			return false;
		}
	}
	if((nlapiGetFieldValue('custrecord_rr_reference') == 'T') && (field == 'custrecord_rr_referenceto')){
		var intFrm = parseInt(nlapiGetFieldValue('custrecord_rr_referencefrom'),10);
		var intTo = parseInt(nlapiGetFieldValue('custrecord_rr_referenceto'),10);
		
		if ((field == 'custrecord_rr_referenceto') && (intFrm > intTo)){	
			alert("From value cannot be greater than the to value!");
			return false;
		}
	}
	if((nlapiGetFieldValue('custrecord_rr_reference') == 'T') && (field == 'custrecord_rr_nsreferenceto')){
		var intNSFrm = parseInt(nlapiGetFieldValue('custrecord_rr_nsreferencefrom'),10);
		var intNSTo = parseInt(nlapiGetFieldValue('custrecord_rr_nsreferenceto'),10);
	
		if ((field == 'custrecord_rr_nsreferenceto') && (intNSFrm > intNSTo)){	
			alert("From value cannot be greater than the to value!");
			return false;
		}
	}
	return true;
}
/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_rec_rules.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}