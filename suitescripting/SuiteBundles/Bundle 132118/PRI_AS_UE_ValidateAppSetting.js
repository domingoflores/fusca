//-----------------------------------------------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * General defaulting and validation on the Prolecto Utilities Bundle, App Setting record 
 * 
 */

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
*/

define(['N/record', 'N/runtime', 'N/search', 'N/url', './PRI_AS_Engine', './PRI_ServerLibrary'],
				
	function(record, runtime, search, url, appSetting, priLibrary) {

		var scriptName = "PRI_AS_UE_ValidateAppSettings.";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeSubmit(context) {

	    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    	
        	if (context.type != "create" && context.type != "edit" && context.type != "xedit")  
        		return;
        	
        	var appId, fieldName, fieldType, fieldValue;
        	var REC = context.newRecord;
        	
        	if (context.type == "xedit") {
        		var fields = search.lookupFields({type: REC.type, id: REC.id, columns: ["internalid","name","custrecord_pri_as_app","custrecord_pri_as_type","custrecord_pri_as_value","custrecord_pri_as_environment"]});
        		
        		appId = (REC.getValue("custrecord_pri_as_app")) ? REC.getValue("custrecord_pri_as_app") : fields.custrecord_pri_as_app[0].value;
        		fieldName = (REC.getValue("name")) ? REC.getValue("name") : fields.name;
        		fieldType = (REC.getValue("custrecord_pri_as_type")) ? REC.getValue("custrecord_pri_as_type") : fields.custrecord_pri_as_type[0].value;
        		fieldValue = (REC.getValue("custrecord_pri_as_value")) ? REC.getValue("custrecord_pri_as_value") : fields.custrecord_pri_as_value; 
        		environment = (REC.getValue("custrecord_pri_as_environment")) ? REC.getValue("custrecord_pri_as_environment") : fields.custrecord_pri_as_environment; 
        	} else {
        		appId = REC.getValue("custrecord_pri_as_app");
        		fieldName = REC.getValue("name");
        		fieldType = REC.getValue("custrecord_pri_as_type");
        		fieldValue = REC.getValue("custrecord_pri_as_value");
        		environment = REC.getValue("custrecord_pri_as_environment");  
        	}
        			
        	log.debug(funcName, "performing validation: app=" + appId + "; name=" + fieldName + "; type=" + fieldType + "; value=" + fieldValue);
        	
    		if (!appSetting.validateAppSettingValue(fieldValue, fieldType))
    			throw "The value specified is invalid for the type specified.";
    			        	
        	// if the record is inactive, we don't care if there are duplicates
        	if (REC.getValue("isinactive")) 
        		return true;
        	
        	var dupeId = appSetting.isDuplicate(appId, fieldName, environment, REC.id)
        	if (dupeId)
    			throw "You may not have multiple Active App Settings with the same Name, for the same Application.  This record would be a duplicate with App Setting ID " + dupeId; 

        	REC.setValue("custrecord_pri_as_value", appSetting.formatValueBeforeSaving(fieldValue, fieldType));

        	if (REC.getValue("custrecord_pri_as_environment)"))
        		REC.setValue("custrecord_pri_as_environment", REC.getValue("custrecord_pri_as_environment").toUpperCase()); 
        	
		}
			
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function afterSubmit(context) {

	    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    	
        	if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT)
        		if (priLibrary.fieldChanged(context, "custrecord_pri_as_value"))
        			logValueChange(context, context.oldRecord.getValue("custrecord_pri_as_value")); 

		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function logValueChange(context, oldValue) {

			var recType = priLibrary.getCustomRecordTypeInternalId(context.newRecord.type)
			 
			if (oldValue.length <= 4000) 
				createNote(context, recType, "Field 'Value' was changed.  This was the old value.", oldValue); 
			else {
				var partNbr = 1; 
				while (oldValue.length > 0) {
					createNote(context, recType, "Field 'Value' was changed.  This was the old value (" + partNbr++ + ")", oldValue.substring(0,4000));
					oldValue = oldValue.substring(4000); 
				}				
			}
		}			
			
		
		function createNote(context, recType, noteTitle, noteText) {			
			const NOTE_TYPE = 7;
			 
			var N = record.create({type: record.Type.NOTE, isDynamic: true});

			noteText = noteText || "*blank*";		// if note text is blank, it causes an error 
          
			N.setValue("recordtype", recType);
			N.setValue("record",context.newRecord.id);
			N.setValue("note", noteText);				
			N.setValue("title", noteTitle);
			N.setValue("notetype", NOTE_TYPE);
			
			var id = N.save();
		}
		
		
		function getCustomRecordTypeId(recName){
			var idMatch = (/\brectype=(\d+)/).exec(url.resolveRecord({recordType: recName}));
			return idMatch ? idMatch[1] : null;
		}
		
		
		
		return {

			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
			
		}
});

