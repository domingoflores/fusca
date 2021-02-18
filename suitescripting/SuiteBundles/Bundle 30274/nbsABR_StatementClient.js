
function nbsABR_DeleteStatement()
{
	var recId = nlapiGetRecordId();
	window.location = nlapiResolveURL('SUITELET','customscript_nbsabr_deletestatement','customdeploy_nbsabr_deletestatement',null,false)+'&recId='+recId;	
}
