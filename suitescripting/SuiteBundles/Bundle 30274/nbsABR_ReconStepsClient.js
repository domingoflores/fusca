/** Client script for Reconcile Steps suitelet, to capture client session id
 * 
 * Copyright 2013, Nolan Business Solutions Plc
 * 
 * @author Peter Boniface
 * @created 25/11/2013
**/

/** PageInit client event method, to capture client session id
 */
function nbsABR_ReconStepsPageInit() {
	if (document.cookie.toString() != '') {
		var JSESSIONID = document.cookie.match(/JSESSIONID=[^;]+/);
		var sessionId = 'NS_VER='+nlapiGetContext().getVersion()+'.0; ' + JSESSIONID + ';';
		
		nlapiSetFieldValue('custpage_jsid', sessionId);
	}
}

/** FieldChange client event method, to handle any field change related processing
 * 
 * @param {String} sublist - name of sublist if the field is a sublist field
 * @param {String} field - name of the field whose value has been changed
 */
function nbsABR_ReconStepsFieldChange(sublist,field) {
	if(field == 'custpage_nbsabr_reconacct'){
		nlapiRemoveSelectOption('custpage_trgtacct', null);
		//populate list of target accounts given parent reconcile account
		var reconAcctId = nlapiGetFieldValue('custpage_nbsabr_reconacct');
		if ((reconAcctId !== null) && (reconAcctId != '')) {
			var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
			               	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null, 'anyof',[reconAcctId])];
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
	 	 	var tmpDate = nlapiAddDays(nlapiStringToDate(stCutOffDate), 1);
	 	 	nlapiSetFieldValue('todate',nlapiDateToString(tmpDate));
		} else {
 			nlapiSetFieldValue('cutoffdate','');
 			nlapiSetFieldValue('todate','');
		}
	}

	if(field == 'custpage_format'){
		var formatId = nlapiGetFieldValue('custpage_format');
		var reconAcctId = nlapiGetFieldValue('custpage_nbsabr_reconacct');
		var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
		               	new nlobjSearchFilter('custrecord_accsetup_format',null, 'anyof',[formatId])];
		var columns = [	new nlobjSearchColumn('custrecord_accsetup_accountname'),
		               	new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
		columns[0].setSort();	// accountname
 		var recs = nlapiSearchRecord('customrecord_nbsabr_accountsetup',null,filters,columns);
 		nlapiRemoveSelectOption('custpage_account', null);
 		nlapiInsertSelectOption('custpage_account', 'multi', '***MULTIPLE***', true);
 		for(var i =0; recs != null && i < recs.length; ++i)
 		{
 			var strAccName = recs[i].getValue('custrecord_accsetup_accountname');
 			var strAccNumber = recs[i].getValue('custrecord_accsetup_accountnumber');
 			var targaccId = recs[i].getId();
 			nlapiInsertSelectOption('custpage_account', targaccId, strAccName+' '+strAccNumber, (targaccId == reconAcctId));
 		} 		
	}
}

/** retrieve the last statement date for the given reconcile account id
 * 
 * @param {String} stReconAcctId - reconcile account id
 * @returns {String} statement date, in NetSuite date-format string
 */
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
