/** nbsABR_Help - script for Help button
*/
function nbsABR_Help() {
	var linkURL = 'http://docs.nolanbusinesssolutions.com/abr/abr_config.html';
	window.open( linkURL,"abrhelp",'width=1200px,height=900px,resizable=yes,scrollbars=yes');
}

function nbsABR_Cnfg_ValidateField(type, field){
	if((nlapiGetFieldValue('usemultiplescriptqueues') =='T') && ((field == 'startqueuenumber') || (field == 'endqueuenumber'))){
		var intStrt = parseInt(nlapiGetFieldValue('startqueuenumber'),10);
		var intEnd = parseInt(nlapiGetFieldValue('endqueuenumber'),10);
		
		if (intStrt < 0 || intStrt >5 || intEnd < 0 || intEnd >5)
		{	
			alert(objResources[NBSABRSTR.CFGQUEUE1TO5]);	// "You must enter a value within 1 to 5."
			return false;
		}
		if (intStrt > intEnd)
		{	
			alert(objResources[NBSABRSTR.CFGSTARTQGTENDQ]);	// "Start queue number cannot be greater than end queue number!."
			return false;
		}
	}
	if(field == 'maxnumstmnts'){
		var intMaxStmnt = parseInt(nlapiGetFieldValue('maxnumstmnts'),10);
				
		if (intMaxStmnt < 0 || intMaxStmnt > 400)
		{	
			alert(objResources[NBSABRSTR.CFGNUMROWS]);	// "You must enter a value within 1 to 400."
			return false;
		}
	}
	return true;	
}

var objResources = [];

function nbsABR_Cnfg_PageInit() {
	var userId = nlapiGetUser();
	var xlateURL = '/app/site/hosting/restlet.nl?script=customscript_nbsabr_translate_rl&deploy=1&userId='+userId;
	var reqHdr = new Object();
	reqHdr['Content-Type'] = 'application/json';
	var resp = nlapiRequestURL(xlateURL, null, reqHdr, null, 'GET');
	objResources = JSON.parse(resp.getBody());
}