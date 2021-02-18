function calculateDifference(type, name)
{
	var count  = nlapiGetLineItemCount('linelist');
	var flTotalCR = 0;
	var flTotalDB = 0;
	var flDiff = 0;
	
	for (var i = 1; i <= count; i+=1) 
	{
		flTotalCR += ncParseFloatNV(nlapiGetLineItemValue('linelist', 'credit', i),0)*100;
		flTotalDB += ncParseFloatNV(nlapiGetLineItemValue('linelist', 'debit', i),0)*100;
	}
	flDiff = flTotalCR - flTotalDB;
	nlapiSetFieldValue('difference', flDiff/100);
}

//saveRecord
function submitJournal(type, field)
{
	var flDiff = ncParseFloatNV(nlapiGetFieldValue('difference'),0);
		
	if (flDiff != 0) 	
	{
		// "The amounts in a journal entry must balance.\n You have a difference of:"
		alert(objResources[NBSABRSTR.AMTSJRNMSTBAL]+'\n '+objResources[NBSABRSTR.DIFFOF]+Math.round(flDiff*100)/100);		
		return false;	
	}	
	return true;
}

function ncParseFloatNV(S,F)
{
	if( (S==null) || (S.length==0) )
		return F;
	return parseFloat(S);
}

var objResources = [];

function nbsABR_CreateGLTrx_PageInit() {
	var userId = nlapiGetUser();
	var xlateURL = '/app/site/hosting/restlet.nl?script=customscript_nbsabr_translate_rl&deploy=1&userId='+userId;
	var reqHdr = new Object();
	reqHdr['Content-Type'] = 'application/json';
	var resp = nlapiRequestURL(xlateURL, null, reqHdr, null, 'GET');
	objResources = JSON.parse(resp.getBody());
	
	// and also call existing function for page init
	calculateDifference();
}