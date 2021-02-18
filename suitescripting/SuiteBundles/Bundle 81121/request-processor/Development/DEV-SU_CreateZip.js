function createziptest(request, response)
{
	"use strict";
	var folderid = request.getParameter('folderid')
	, msg = "";
	
	if ( String(request.getMethod()) === 'GET' )
	{
//		if (!folderid)
//        {
//			msg = "Folder ID parameter 'folderid' is required.<br>";
//        }
//		if (msg)
//        {
//        	response.write(msg);
//        	return;
//        }
		
		var profileid = 12;
		var id = 804;
		  	var creProfile = new CREProfile(profileid);
	        creProfile.Translate(id);
	        
	        response.write ("creProfile " + creProfile.fields.Recipient.value);
	        //creProfile.Execute();
	        
	        creProfile = new CREProfile(profileid);
	        creProfile.fields.Recipient.value = "marko.obradovic@prolecto.com";
	        creProfile.Translate(id);
	        
	        response.write ("creProfile " + creProfile.fields.Recipient.value);
	        
	        //creProfile.Execute();
	        
	        
		
		
		response.write ("test");
		return;
		
		
		var fileid = 34182;
		var folderid = 9087;
		
		var file = nlapiLoadFile(fileid);
		var contents64Encoded = file.getValue();
		
		
		var zipfile = nlapiCreateFile('zipfile.zip', 'ZIP',contents64Encoded);
		zipfile.setFolder(folderid);
		var createdfileid = nlapiSubmitFile(zipfile);
		
		response.write ("File Created " + createdfileid);
		
		return; 
		
		
		
		
		var fileLink = 'https://system.na1.netsuite.com/core/media/downloadfolder.nl?id=-15';

		var headers = {'Authorization': 'NLAuth nlauth_account=TSTDRV1030358,nlauth_email=marko@prolecto.com,nlauth_signature=5yB0JKm8,nlauth_role=3'}
		
		 var response1 = nlapiRequestURL(fileLink, null, headers);
		 
		 // Change the content type according to the file
		 //response1.setContentType('ZIP', 'file.zip');
		 
		 var body = response1.getBody();
		 nlapiLogExecution("DEBUG","body ", " body ready ");
		 nlapiLogExecution("DEBUG","body ", body);
		 var file = nlapiCreateFile('zip.zip', 'ZIP', body);
		 var folderid = 5338	;
		 file.setFolder(folderid);
		 file.setIsOnline(true);
		 var fileid = nlapiSubmitFile(file);
	     url = nlapiLoadFile(fileid).getURL();
	     
	     throw url;
		
//		var zip = new JSZip();
//		zip.file("Hello.txt", "Hello World\n");
//		var img = zip.folder("images");
//		img.file("smile.gif", imgData, {base64: true});
//		zip.generateAsync({type:"blob"})
//		.then(function(content) {
//		    // see FileSaver.js
//			nlapiLogExecution("DEBUG","content ", content);
//					 var file = nlapiCreateFile('zip.zip', 'ZIP', content);
//					 var folderid = 5338;
//					 file.setFolder(folderid);
//					 file.setIsOnline(true);
//					 var fileid = nlapiSubmitFile(file);
//				     url = nlapiLoadFile(fileid).getURL();
//				     nlapiLogExecution("DEBUG","url ", url);
//		});
        
            
	}
  		
}