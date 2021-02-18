//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

var CC_CONSTS = JSON.parse(readAppSetting('PRI Accept CC Payment','System Constants'));

//------------------------------------------------------------------------------------------------------------------------------------
//Function:			executeCREProfileSuitelet
//Script Type:		Suitelet
//Description:		Execute CRE via Suitelet
//Example URL: 		https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=134&deploy=1&profileid=13&id=7256
//Date:				20150819, MO
//------------------------------------------------------------------------------------------------------------------------------------
function executeCREProfileSuitelet(request, response)
{
	"use strict";
	var logTitle='executeCREProfileSuitelet';
	var profileid = request.getParameter('profileid')
	, id = request.getParameter('id')
	, doNotSend = (request.getParameter('doNotSend') == 'T')
	, msg = ""
	, documentExternal = (request.getParameter('documentExternal') == 'T')
	, k = request.getParameter('k')
	, utilityMode = request.getParameter('utilityMode')
	
	if ( String(request.getMethod()) === 'GET' )
	{
		//This suitelet runs in 3 modes.  
		//1.For sending the Successful payment confirmation from the success page
		//2.For triggering the CRE bundle when a security key is in the url
		//3.Standard mode: trigger CRE without any security key
		
		//*******MODE 1**********//
		nlapiLogExecution('error',logTitle,'utilityMode: '+utilityMode);
		if(utilityMode=='SEND_EMAIL_CONFIRM'){
			var jsonOutput={};
			try{
				var email = request.getParameter('email')
				, httprequestid = request.getParameter('httprequestid')
				, businessid = request.getParameter('businessid')
				, k = request.getParameter('k')
				, msg = "";
				
				if(isEmpty(email) || isEmpty(httprequestid) || isEmpty(businessid) || isEmpty(k)) throw 'Missing parameter.';

				var securityKeyObj = new securityKey();
				var result = securityKeyObj.validateKey({key:k,refValue:businessid});
				if(!result) throw 'Invalid key.';

				var creHTTPRequest = new CREHTTPRequest(httprequestid);
				var creProfile = new CREProfile(CC_CONSTS.CRE_PROF_IDS.CRE5_EMAILC);
				creProfile.RawData.inputEmailAddress=email;
				creProfile.Translate(httprequestid);
				creProfile.Execute();

				jsonOutput.result='success';				
			}
			catch(e){
				var stErrMsg = '';
				if (e.getDetails != undefined) stErrMsg = 'Script Error: '+e.getCode() + ', ' + e.getDetails()+', '+e.getStackTrace();    
				else stErrMsg = 'Script Error: '+e.toString();     
				nlapiLogExecution('error',logTitle,'Error Sending Email.  Details: '+stErrMsg);
				jsonOutput.result='failure';
			}
			nlapiLogExecution('error',logTitle,'jsonOutput: '+JSON.stringify(jsonOutput));
			response.write(JSON.stringify(jsonOutput));
			return;
		}
		//*******MODE 2**********//
		nlapiLogExecution('error',logTitle,'k, !isEmpty(k): '+k+', '+!isEmpty(k));
		if(!isEmpty(k)){
			try{
				var encryptedKey = decodeURIComponent(k);
				//var aesKey = nlapiGetContext().getSetting('SCRIPT', 'custscript_pri_cc_aes_key');
				//nlapiLogExecution('error',logTitle,'aesKey: '+aesKey);
				//var key = nlapiDecrypt(encryptedKey, "aes", aesKey);
				var key = nlapiDecrypt(encryptedKey, "aes");
				var keyObj = JSON.parse(key);
				
				profileid = keyObj.profileid;
				id = keyObj.id;
				eid = keyObj.eid;
				
				//now check that eid corresponds to id
				var dataBaseEid = nlapiLookupField('entity',id,'entityid');
				if(dataBaseEid != eid){
					nlapiLogExecution('error',logTitle,'Invalid URL Key, may indicate URL tampering.  Exiting script.');
					return;
				}
			}
			catch(e){
				var stErrMsg = '';
				if (e.getDetails != undefined) stErrMsg = 'Script Error: '+e.getCode() + ', ' + e.getDetails()+', '+e.getStackTrace();    
				else stErrMsg = 'Script Error: '+e.toString();     
				nlapiLogExecution('error',logTitle,'Invalid URL Key.  Details: '+stErrMsg+'. Exiting script');
				return;
			}
		}
		else{ //*******MODE 3**********//
			if (!profileid)
	        {
				msg = "CRE Profile ID parameter 'profileid' is required.<br>";
	          	response.writePage( '');
	        }
			if (!id)
	        {
				msg = msg + "Record ID parameter 'id' is required.<br>";
	        }
	        if (msg)
	        {
	        	response.write(msg);
	        	return;
	        }
		}
        //For modes 2 and 3 only, execute the CRE here.  Mode 1 has custom execute code.
        var creProfile = new CREProfile(profileid);
        creProfile.Translate(id);
        creProfile.Execute(doNotSend);
               
        var foldername = cre_getFolderName(TEMPLATE_FOLDER_ID);
        
    	if (creProfile.fields.DocumentName.translatedValue)
    	{
    		try
           	{
	            var f = nlapiLoadFile(foldername +'/' + creProfile.fields.DocumentName.translatedValue);
	            if(documentExternal && f){//allow anonymous access
	            	f.setIsOnline(true);
		            nlapiSubmitFile(f);
		        } 
	            else return;
	            
	            var url = f.getURL();
	            var html = '<html><body><br><br><a href="'+url+'">' + (creProfile.fields.DocumentName.translatedValue||'') + '</A>' + "<hr><br>";
	            if (creProfile.fields.DocumentName.translatedValue.toLowerCase().endsWith('pdf'))
        	    {
	       	  		html = html + '<object data="'+url+'" type="application/pdf" width="75%" height="900">alt : <a href="'+url+'">'+creProfile.fields.DocumentName.translatedValue+'</a></object></body></html>';
        	    }
	            else
	            {
	            	html = html + '<object data="'+url+'" width="75%" height="900">alt : <a href="'+url+'">'+creProfile.fields.DocumentName.translatedValue+'</a></object></body></html>';
	            }
	       	  	response.write(html);
           	}
	       	catch(e) 
	   		{
	       		var str = "Document Name not defined correctly " + creProfile.fields.DocumentName.Value + '-->' + creProfile.fields.DocumentName.translatedValue;
	   			nlapiLogExecution("ERROR", 'could not create document', str);
	           	//	syntax template does not exist. Return this one.
	           	response.write(str);
	   		}
    	}
    	else
    	{
    		response.write ("Profile "+profileid+" executed successfully.");
    	}    
	}
}
function isEmpty(val) {
	return (val == undefined || val == null || val == 'null' || val == '');	
}