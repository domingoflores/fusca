/** nbsABR_HideFlds_BfrLd - function to hide subsidiary field in single company accounts
 * 
 * @param type (string) read operation type, e.g. view, edit
 * @param form (object) nlobjForm representing the current form
 * @return {void}
 */
function nbsABR_HideFlds_BfrLd(type, form)
{
	if (type == 'view' || type == 'edit') {
		var recType = nlapiGetRecordType();
		
		nlapiLogExecution('debug','recType',recType);
		
		var ctx = nlapiGetContext();
		var b_SubsEnabled = ctx.getFeature('SUBSIDIARIES');
		if(!b_SubsEnabled){
			if(recType == 'customrecord_nbsabr_bankstatement'){
				form.getField('custrecord_bs_subsidiary').setDisplayType('hidden');
			}
			if(recType == 'customrecord_nbsabr_accountsetup'){
				form.getField('custrecord_accsetup_subsidiary').setDisplayType('hidden');
			}
		}
	}
}

/** nbsABR_AddHelpBtn_BfrLd - function to add Help button when viewing or editing ABR record types
 * 
 * @param type (string) read operation type, e.g. view, edit
 * @param form (object) nlobjForm representing the current form
 * @return {void}
 */
function nbsABR_AddHelpBtn_BfrLd(type, form)
{
	if ((type == 'view' || type == 'edit' || type == 'create') && (form !== undefined && form !== null)) {	
		form.setScript('customscript_nbsabr_helpbtn_c');
		form.addButton('custpage_helpbutton','Help','nbsABR_Help();');
	}
}

/** nbsABR_NetSuiteAcct_afterSubmit - function to set subsidiary and currency on parent reconcile account record,
 * if these features are enabled.
 * 
 * @param opType {string} submit operation type, e.g. create, edit
 * @return {void}
 */
function nbsABR_NetSuiteAcct_afterSubmit(opType)
{
	if (opType == 'create' || opType == 'edit'){
		
		var acctId =  nlapiGetNewRecord().getFieldValue('custrecord_nbsabr_ta_accountname');
		var rcnAccId =  nlapiGetNewRecord().getFieldValue('custrecord_nbsabr_ta_reconacc');
		var currId = '1';
		var subsidId = '1';
		var ctx = nlapiGetContext();
		var b_SubsEnabled = ctx.getFeature('SUBSIDIARIES');
		var b_MultiCurr = ctx.getFeature('MULTICURRENCY');
		
		var recAcct = nlapiLoadRecord('account',acctId);
		if(b_SubsEnabled){
			subsidId = recAcct.getFieldValue('subsidiary');
			if (subsidId === null)
				subsidId = '';
		}
		if(b_MultiCurr){
			currId = recAcct.getFieldValue('currency');
			if (currId === null)
				currId = '';
		}
		
		var fldNames = ['custrecord_accsetup_subsidiary','custrecord_nbsabr_accsetup_acctcurrency'];
		var fldValues = [subsidId.toString(),currId.toString()];
		try{
			nlapiSubmitField('customrecord_nbsabr_accountsetup',rcnAccId,fldNames,fldValues);	
		}
		catch(e){
			nlapiLogExecution('ERROR', e.getCode(), e.description);
		}
	}
	
	if (opType == 'delete'){
		//search for NetSuite accounts attached to this reconcile account
		var rcnAccId =  nlapiGetOldRecord().getFieldValue('custrecord_nbsabr_ta_reconacc');
		var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
		               	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null, 'anyof',rcnAccId)];
				               	
		var srSHs = nlapiSearchRecord('customrecord_nbsabr_targetaccount',null,filters,null);
		if(srSHs === null){// update values to ''
			var fldNames = ['custrecord_accsetup_subsidiary','custrecord_nbsabr_accsetup_acctcurrency'];
			var fldValues = ['',''];
			try{
				nlapiSubmitField('customrecord_nbsabr_accountsetup',rcnAccId,fldNames,fldValues);
			}
			catch(e){
				nlapiLogExecution('ERROR', e.getCode(), e.description);
			}
		}
	}
}