function closingBalRprtFC(type,field)
{
	if(field == 'accountid'){
		nlapiSetFieldValue('nbs_action', 'Refresh');
		if (window.isinited && window.isvalid){
			setWindowChanged(window,false);
			main_form.submit();
		}
	}
}

function nbsABR_PrintClosingBalance() {
	var linkURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_closingbalreport','customdeploy_nbsabr_closingbalreport', null);
	var acctId = nlapiGetFieldValue('accountid');
	var stmtDt = nlapiGetFieldValue('stmntdate');
	window.open( linkURL + '&nbs_action=print&accountid=' + acctId + '&stmntdate=' + stmtDt, 'nbsABR_ClosingBalRpt', 'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}
/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_close_bal_rep.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}