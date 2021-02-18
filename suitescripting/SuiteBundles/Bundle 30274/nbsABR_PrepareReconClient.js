/** nbsABR_PrepareReconFC - field changed event on Prepare Reconciliation SL
*
*@param (type) the sublist internal ID
*@param	(field) the field internal ID
*/
function nbsABR_PrepareReconFC(type,field)
{
	if(field == 'custpage_account'){
		nlapiRemoveSelectOption('custpage_trgtacct', null);
		//populate list of target accounts given parent reconcile account
		var reconAcctId = nlapiGetFieldValue('custpage_account');
		var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
		               	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null, 'anyof',reconAcctId)];
		var columns = [	new nlobjSearchColumn('custrecord_nbsabr_ta_accountnumber'),
		               	new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
		columns[1].setSort();	// accountname
 		var recs = nlapiSearchRecord('customrecord_nbsabr_targetaccount',null,filters,columns);
 		if(recs == null){
 			nlapiSetFieldValue('cutoffdate','');
 			nlapiSetFieldValue('todate','');
 			return;
 		}	
 		var len = recs.length;
 		for(var i =0; i < len; ++i)
 		{
 			var strAccName = recs[i].getValue('custrecord_nbsabr_ta_accountnumber');
 			var strAccNumber = recs[i].getText('custrecord_nbsabr_ta_accountname');
 			nlapiInsertSelectOption('custpage_trgtacct', recs[i].getValue('custrecord_nbsabr_ta_accountname'), strAccNumber+' '+strAccName,true);
 		} 	 		
 		var stCutOffDate = nbsABR_GetLastStatementDate(reconAcctId);
 		if(stCutOffDate == ''){
 			nlapiSetFieldValue('cutoffdate','');
 			nlapiSetFieldValue('todate','');
 			return;
 		}
 		nlapiSetFieldValue('cutoffdate',stCutOffDate);
 	 	//var tmpDate = nlapiAddMonths(nlapiStringToDate(stCutOffDate), 1);
 	 	var tmpDate = nlapiAddDays(nlapiStringToDate(stCutOffDate), 1);
 	 	nlapiSetFieldValue('todate',nlapiDateToString(tmpDate));
	}
}
/** nbsABR_PrepareReconPI - page init event on Prepare Reconciliation SL
 * */
function nbsABR_PrepareReconPI()
{
	if (document.cookie.toString() != '') {
		var JSESSIONID = document.cookie.match(/JSESSIONID=[^;]+/);
		//var sessionId = 'NS_VER=2013.1.0; ' + JSESSIONID + ';';
		var sessionId = 'NS_VER='+nlapiGetContext().getVersion()+'.0; ' + JSESSIONID + ';';
		
		nlapiSetFieldValue('custpage_jsid', sessionId);
	}

	var reconAcctId = nlapiGetFieldValue('custpage_account');
	var stCutOffDate = nbsABR_GetLastStatementDate(reconAcctId);
	if(stCutOffDate == '') {
		nlapiSetFieldValue('cutoffdate','');
		nlapiSetFieldValue('todate','');
		return;
	}
	nlapiSetFieldValue('cutoffdate',stCutOffDate);
 	var tmpDate = nlapiAddDays(nlapiStringToDate(stCutOffDate), 1);
 	nlapiSetFieldValue('todate',nlapiDateToString(tmpDate));
}

/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_extract.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}

function nbsABR_GetLastStatementDate(stReconAcctId)
{
	var strStmntDate = '';
	var SF = new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',stReconAcctId,null);
	var SR = nlapiSearchRecord('customrecord_nbsabr_statementhistory','customsearch_nbsabr_statehist_datedesc',SF,null);
	if((SR && SR.length > 0)){
		strStmntDate = SR[0].getValue('custrecord_sh_date');
	}
	return strStmntDate;
}