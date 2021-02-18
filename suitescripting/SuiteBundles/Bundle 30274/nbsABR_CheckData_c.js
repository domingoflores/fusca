
function nbsABR_CheckData_FldChngd(type,field)
{
	if(field == 'custpage_reconacct' && nlapiGetFieldValue('custpage_reconacct') !=='')
	{
		var acctId = nlapiGetFieldValue('custpage_reconacct');
		var SFs = [	new nlobjSearchFilter('isinactive',null,'is','F',null),
		           	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null,'anyof',acctId,null)];
		if(nlapiSearchRecord('customrecord_nbsabr_targetaccount', null, SFs, null) === null){
			alert('This Reconcile Account does not have any associated NetSuite accounts and cannot be selected.');
			nlapiSetFieldValue('custpage_reconacct','');
		}
	}
}