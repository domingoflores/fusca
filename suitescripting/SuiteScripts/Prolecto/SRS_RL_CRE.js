function doPost(data_in) {
    	"use strict";
    	var Scriptname = "doPost";
    	var reponseObject = {success:false ,msg:""};
    	var func = "doPost";
    	
    	nlapiLogExecution("DEBUG", "DATAIN", JSON.stringify(data_in));
    	try {
        	var recordId           = data_in.recordId;
        	var creprofileid       = data_in.creprofileid;
        	var inclusionsList     = data_in.inclusionsList;
        	var documentName       = data_in.documentName;
        	var updateControlTable = data_in.updateControlTable;

			if (creprofileid) {
				var creProfile = new CREProfile(creprofileid);
				if (inclusionsList) { creProfile.RawData.inclusionsList = inclusionsList.split(","); }
	        	if (documentName)   { creProfile.DocumentName = documentName; }
	        	
		        creProfile.Translate(recordId);
		        
		        if (updateControlTable) { creProfile.RawData.UpdateControlTable = true; } 
	        	
		        reponseObject.msg = creProfile.Execute();
		        reponseObject.success = true;
		        reponseObject.fileid = creProfile.fields.DocumentName.file.getId();
			}
    		
    		var reponseObjectString = JSON.stringify(reponseObject);
    	    
    		nlapiLogExecution("DEBUG", Scriptname, "reponseObject: " + reponseObjectString );
    	    
    		return reponseObject;
    	   
        } 
    	catch (e) {
    		nlapiLogExecution("ERROR", func + " Error", "Error: " + e.toString());
            return getErrorResponse("-1", e.toString());
        }
    }
    	    
    
    //==============================================================================================================================
    //==============================================================================================================================
    function getErrorResponse(code, message) {
    	var errorObject = {};
    	errorObject.error = {
            "status" : "",
            "message" : ""
    	};
    	errorObject.error.status = code;
    	errorObject.error.msg = message;
    	return errorObject;
    }