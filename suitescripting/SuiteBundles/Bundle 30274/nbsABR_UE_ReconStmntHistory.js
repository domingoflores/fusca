/** nbsABR_beforeSubmitRS - function to capture Reconcile Statement History create events for Account Initialisation
 * 
 * @param opType {string} submit operation type, e.g. create, edit
 * @return {void}
 */
function nbsABR_ReconStmnt_beforeSubmit(opType)
{
	var newRec = nlapiGetNewRecord();
	var isAcctInit = newRec.getFieldValue('custrecord_sh_accntinit');
	
	/* only execute where the operation is a 'create' and the new type is an 'customrecord_nbsabr_statementhistory' */
	if ((opType == 'create') && (isAcctInit == 'T')){
		// call function to handle creation of statement history
		nbsABR_CalculateOpeningBalance(newRec);
	}
}

/** nbsABR_CalculateOpeningBalance - function to calculate opening balance for account initialisation statements
 * 
 * @param shRec {object} Statement History record to source from
 * @return {void}
 */
function nbsABR_CalculateOpeningBalance(shRec)
{
	//search for existing reconcile statements associated with account initialisation for this account
	// & retrieve last processed id
	var reconAccId = shRec.getFieldValue('custrecord_sh_reconaccount');
	var flBalance = shRec.getFieldValue('custrecord_sh_ns_balance');

	var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
	               	new nlobjSearchFilter('custrecord_sh_accntinit',null, 'is','T'),
	               	new nlobjSearchFilter('custrecord_sh_reconaccount',null, 'anyof',reconAccId)];
	
	//var columns = [	new nlobjSearchColumn('custrecord_sh_ns_unreconciled',null,'sum')];
	var columns = [	new nlobjSearchColumn('custrecord_sh_ns_unreconciled'),
	               	new nlobjSearchColumn('custrecord_sh_date'),
	               	new nlobjSearchColumn('internalid')];
	columns[1].setSort(true);	// date
	columns[2].setSort(true);	// internalid
	               	
	var srSHs = nlapiSearchRecord('customrecord_nbsabr_statementhistory',null,filters,columns);
	var flSumUnrecon = 0;
	var flThisTotalUnrecon = ncParseFloatNV(shRec.getFieldValue('custrecord_sh_ns_unreconciled'),0);

	if(srSHs && srSHs.length >0){
		//flSumUnrecon = ncParseFloatNV(srSHs[0].getValue('custrecord_sh_ns_unreconciled',null,'sum'),0);	
		flSumUnrecon = ncParseFloatNV(srSHs[0].getValue('custrecord_sh_ns_unreconciled'),0);	
		nlapiLogExecution('debug','flBalance sum',flSumUnrecon);
	}
	var flTotal = nbsArithmetic('+', flSumUnrecon, flThisTotalUnrecon);

	shRec.setFieldValue('custrecord_sh_ns_unreconciled',flTotal);
	var adjBalance = nbsArithmetic('-', flBalance, flTotal);
	shRec.setFieldValue('custrecord_sh_ns_adjbalance',adjBalance);
	shRec.setFieldValue('custrecord_sh_bk_adjbalance',adjBalance);
	shRec.setFieldValue('custrecord_sh_bk_balance',adjBalance);
	shRec.setFieldValue('custrecord_sh_endingbalance',adjBalance);
}

/** nbsABR_ReconStmnt_afterSubmit - function to update Reconcile Account with statement ending values
 * 
 * @param opType {string} submit operation type, e.g. create, edit
 * @return {void}
 */
function nbsABR_ReconStmnt_afterSubmit(opType)
{
	if (opType == 'create'){
		var newRec = nlapiGetNewRecord();
		var reconAccId = newRec.getFieldValue('custrecord_sh_reconaccount');
		var flEndingBal = newRec.getFieldValue('custrecord_sh_endingbalance');
		var strStmntDate = newRec.getFieldValue('custrecord_sh_date');
		var strRcnDate = newRec.getFieldValue('custrecord_sh_date');

		var fldNames = ['custrecord_accsetup_laststmntbalance','custrecord_accsetup_laststmntdate','custrecord_accsetup_lastrecondate'];
		var fldValues = [flEndingBal,strStmntDate,strRcnDate];
		nlapiSubmitField('customrecord_nbsabr_accountsetup',reconAccId,fldNames,fldValues);	
	}
	
	if (opType == 'delete'){
					
		var reconAccId = nlapiGetOldRecord().getFieldValue('custrecord_sh_reconaccount');
		
		var SF = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
		            new nlobjSearchFilter('custrecord_sh_reconaccount',null, 'anyof',[reconAccId])];
		var srSHs = nlapiSearchRecord('customrecord_nbsabr_statementhistory','customsearch_nbsabr_statehist_datedesc',SF,null);  
		var flEndingBal = '';
		var strStmntDate = '';

		if(srSHs !== null){
			flEndingBal = srSHs[0].getValue('custrecord_sh_endingbalance');
			strStmntDate = srSHs[0].getValue('custrecord_sh_date');		
		}

		var fldNames = ['custrecord_accsetup_laststmntbalance','custrecord_accsetup_laststmntdate','custrecord_accsetup_lastrecondate'];
		var fldValues = [flEndingBal,strStmntDate,strStmntDate];
		nlapiSubmitField('customrecord_nbsabr_accountsetup',reconAccId,fldNames,fldValues);
	}
}
