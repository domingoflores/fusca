//=========================================================================================================================
// SUITELET
//=========================================================================================================================
function ExecuteRequest(request, response) {
	"use strict";
	var Scriptname = "CRE_Send_Email_SL.js";
    nlapiLogExecution("DEBUG", Scriptname, "started");
    var reponseObject = {success:false ,msg:""};
	var outputFilename ="";
	
	try {
	    var profileId = request.getParameter('profile');
	    var recordId  = request.getParameter('record');
		nlapiLogExecution("DEBUG", Scriptname, "profileId: " + profileId + ",    recordId: " + recordId );
	    
	    var creProfile = new CREProfile(profileId);
	    creProfile.Translate(recordId);
      
	    var introData = request.getParameter('introData');
	    if (introData) {
		    var translatedValue    = creProfile.fields.BodyMessageIntroduction.translatedValue;
		    var translatedValueNew = translatedValue.replace("[0]" ,introData);
		    creProfile.fields.BodyMessageIntroduction.translatedValue = translatedValueNew;
	    }
      
	    var recipient = request.getParameter('recipient');
	    if (recipient) { creProfile.fields.Recipient.translatedValue = recipient; }
	    
	    var creResponse = creProfile.Execute(false);
	    
	    reponseObject.msg = creResponse;
		var responseArray = creResponse.split(" ");
		
		for (var i=0; i<responseArray.length; i++) {
			nlapiLogExecution("DEBUG", Scriptname, "creResponse[" + i + "] = " + JSON.stringify(responseArray[i]) );		
			if (responseArray[i] == "Success.") {
				reponseObject.success  = true;  
			}
		}

	}
	catch(e) {
		nlapiLogExecution("ERROR", Scriptname, "Error when calling CRE Suitlet to send email: " + e.message );
		reponseObject.msg = e.message;
	}
	 
    var reponseObjectString = JSON.stringify(reponseObject);
    
	nlapiLogExecution("DEBUG", Scriptname, "reponseObject: " + reponseObjectString );
    
    response.write(reponseObjectString);
	return;
	
}