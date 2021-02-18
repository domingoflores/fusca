function RestletGet(data)
{
	nlapiLogExecution("DEBUG","RestletGet", " start");
	
	
	var fileLink = 'https://system.na1.netsuite.com/core/media/downloadfolder.nl?id=-15';

	var headers = {'Authorization': 'NLAuth nlauth_account=TSTDRV1030358,nlauth_email=marko@prolecto.com,nlauth_signature=5yB0JKm8,nlauth_role=3'}
	
	 var response1 = nlapiRequestURL(fileLink, null, headers);
	 
	 // Change the content type according to the file
	 //response1.setContentType('ZIP', 'file.zip');
	 
	 var body = response1.getBody();
	 nlapiLogExecution("DEBUG","body ", " body ready ");
	 nlapiLogExecution("DEBUG","body ", body);
	
	return {};
}