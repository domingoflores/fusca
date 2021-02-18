/** nbsABR_Help - script for Help button on ABR record types
*/
function nbsABR_Help() {
	
	var recType = nlapiGetRecordType();
	var strURL = 'abr_system_setup.html';
	
	if(recType == 'customrecord_nbsabr_accountsetup'){
		strURL = 'abr_account_setup.html';
	}
	if(recType == 'customrecord_nbsabr_formatdefinition'){
		strURL = 'abr_format_head.html';
	}
	if(recType == 'customrecord_nbsabr_formatdefinitionline'){
		strURL = 'abr_format_lines.html';
	}
	if(recType == 'customrecord_nbsabr_reconcilerules'){
		strURL = 'abr_rec_rules.html';
	}
	if(recType == 'customrecord_nbsabr_bankstatement'){
		strURL = 'abr_statements.html';
	}
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/'+strURL;
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}
