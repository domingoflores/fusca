
/* special page init function for pre-load of page to retrieve current session id */
function nbsABR_PreLoadPageInit() {
	if (document.cookie.toString() != '') {
		var JSESSIONID = document.cookie.match(/JSESSIONID=[^;]+/);
		//var sessionId = 'NS_VER=2013.1.0; ' + JSESSIONID + ';';
		var sessionId = 'NS_VER='+nlapiGetContext().getVersion()+'.0; ' + JSESSIONID + ';';
		
		nlapiSetFieldValue('custpage_jsid', sessionId);
		main_form.submit();
	}
}

function importFileFC(type,field)
{
	if(field == 'custpage_format'){
		var formatId = nlapiGetFieldValue('custpage_format');
		var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
		               	new nlobjSearchFilter('custrecord_accsetup_format',null, 'anyof',formatId)];
		var columns = [	new nlobjSearchColumn('custrecord_accsetup_accountname'),
		               	new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
		columns[1].setSort();	// accountnumber
 		var recs = nlapiSearchRecord('customrecord_nbsabr_accountsetup',null,filters,columns);
 		nlapiRemoveSelectOption('custpage_account', null);
 		nlapiInsertSelectOption('custpage_account', 'multi', '***MULTIPLE***',true);
 		for(var i =0; recs != null && i < recs.length; ++i)
 		{
 			var strAccName = recs[i].getValue('custrecord_accsetup_accountname');
 			var strAccNumber = recs[i].getValue('custrecord_accsetup_accountnumber');
 			nlapiInsertSelectOption('custpage_account', recs[i].getId(), strAccNumber+' '+strAccName);
 		} 		
	}
}
/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_import.html';
	window.open( linkURL,"ABR Help",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}
// not needed for new version
function importOnClick()
{
	/*nlapiSetFieldValue('main_action', 'Import');
	if (window.isinited && window.isvalid && save_record(true))
	{
		setWindowChanged(window, false);
		main_form.submit();
	}*/
}
/*
function nbsRefresh()
{
	if (window.isinited && window.isvalid && save_record(true))
	{
		setWindowChanged(window, false);
		main_form.submit();
	}

}*/