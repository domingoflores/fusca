/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define(['N/record' ,'N/runtime' ,'N/url' ],
 
function(record ,runtime ,url ) {
 
	var scriptName = "addUserNote_SL.js";

	function onRequest(context) {

		var scriptFullName = scriptName + "--->onRequest";
		log.audit(scriptFullName, "started " );
		
		log.debug(scriptFullName, JSON.stringify(context.request.body) );
//		log.debug(scriptFullName, JSON.stringify(context.request) );
//		context.request.Cookie = {};
//		context.request.cookie = {};
//		log.debug(scriptFullName, JSON.stringify(context) );
//		
//
//		var objBody = JSON.parse(context.request.body);
//		log.debug(scriptFullName, "objBody.rcdId:" + objBody.rcdId );
//		log.debug(scriptFullName, "objBody.rcdType:" + objBody.rcdType );
//		log.debug(scriptFullName, "objBody.noteTitle:" + objBody.noteTitle );
//		log.debug(scriptFullName, "objBody.noteText:" + objBody.noteText );
//		log.debug(scriptFullName, "objBody.noteType:" + objBody.noteType );
//		
//		
//		context.response.write('OK');
//		
//		return;
		
		var objBody = JSON.parse(context.request.body);
		
		var rcdId     = objBody.rcdId;
		var rcdType   = objBody.rcdType;
		var noteTitle = objBody.noteTitle;
		var noteText  = objBody.noteText;
		var noteType  = objBody.noteType;
		if (!noteType) { noteType = 7; }
		
        var noteAdded = addUserNote(rcdId ,rcdType ,noteTitle ,noteText ,noteType);
        log.debug(scriptFullName, "noteAdded:" + noteAdded );
		if (!noteAdded) { context.response.write('FAILED'); }
		else            { context.response.write('OK');     }
			
        
		
	} //function onRequest

	
	
	//==================================================================================================
	//==================================================================================================
    function addUserNote(rcdId ,rcdType ,noteTitle ,noteText ,noteType) {
    	try {
    		var rcdTypeId = getCustomRecordTypeInternalId(rcdType ,rcdId);
    		noteText = noteText.substr(0, 4000); // ensure max width of note
    		var userNote = record.create({ type:"note" });
    		userNote.setValue({ fieldId:"title"       ,value:noteTitle   });
    		userNote.setValue({ fieldId:"notetype"    ,value:noteType    });
    		userNote.setValue({ fieldId:"record"      ,value:rcdId       });
    		userNote.setValue({ fieldId:"recordtype"  ,value:rcdTypeId   });
    		userNote.setValue({ fieldId:"note"        ,value:noteText    });
    		var intUserNoteId = userNote.save();        	
    	}
    	catch(e) { log.error(scriptFullName, "Exception " + e.message  ); return false; }
    	return true;
    }

    
    
	//==================================================================================================
	//==================================================================================================
    function getCustomRecordTypeInternalId(name ,rcdId) {
    	//leverage NetSuite's URL generator to get the record type
    	var recordURL = url.resolveRecord({ recordType:name ,recordId:rcdId ,isEditMode:false ,params:{} });
    	return getURLParameterByName('rectype', recordURL)

    	//url parser helper function
    	function getURLParameterByName(name, url) {
    		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    	        results = regex.exec(url);
    	    return results === null ? "" : results[1].replace(/\+/g, " ");
    	};
    };
	
	


return { onRequest: onRequest };
});