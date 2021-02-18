
function deleteRecon_PageInit() {
	if (document.cookie.toString() != '') {
		var JSESSIONID = document.cookie.match(/JSESSIONID=[^;]+/);
		//var sessionId = 'NS_VER=2013.1.0; ' + JSESSIONID + ';';
		var sessionId = 'NS_VER='+nlapiGetContext().getVersion()+'.0; ' + JSESSIONID + ';';

		nlapiSetFieldValue('custpage_jsid', sessionId);
	}
}

function deleteReconciliation_FC(type,field)
{
	if(field == 'bankaccount')
	{
		window.nlapiSetFieldValue('main_action','Refresh');
		if (window.isinited && window.isvalid)
		{
				setWindowChanged(window,false);
				main_form.submit();
		}
	}
}
/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_delete_rec.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}