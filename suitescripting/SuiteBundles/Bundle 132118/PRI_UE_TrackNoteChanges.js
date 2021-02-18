//-----------------------------------------------------------------------------------------------------------
// Copyright 2016-17, All rights reserved, Prolecto Resources, Inc.
//
// Authors: Carl Zeng, Boban Dragojolovic, Marty Zigman
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------


/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(['N/record', 'N/runtime', 'N/url'],
		function(record, runtime, url) {
    		function afterSubmit(context) {
		        if ((context.type !== context.UserEventType.CREATE) && (context.type !== context.UserEventType.EDIT) && (context.type !== context.UserEventType.XEDIT))
		            return;
		
		    	var funcName = "trackNoteChanges " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id");
		        log.debug(funcName, "Starting");
		        
		    	try {
		    		
		    		var fieldNames = runtime.getCurrentScript().getParameter({name: "custscript_pri_log_fld_chg_names"}).split(",");
		    		var noteType = runtime.getCurrentScript().getParameter({name: "custscript_pri_log_fld_chg_note_type"});
		    		
//		    		if (context.type === context.UserEventType.CREATE) 
//		    			for (var i = 0; i < fieldNames.length; i++) {
//		    				var fieldName = fieldNames[i];
//		    				var fld = context.newRecord.getField(fieldName);
//		    				
//		    			// we are only going to log CHANGES
//		    			//	if (fld.getValue(fieldName)) {
//		    			//		logChange(context, {
//		    			//			noteTitle: fld.label + " (" + fieldName + ")", 
//		    			//			noteText: "Value set to: " + fld.getValue(fieldName),
//		    			//			noteType: noteType
//		    			//		});
//		    			//	}
//		    			}
//		    		else // EDIT mode 
	    			for (var i = 0; i < fieldNames.length; i++) {
	    				var fieldName = fieldNames[i];
	    				var fld = context.newRecord.getField(fieldName);
	    				var oldValue = context.oldRecord.getValue(fieldName);
	    				var newValue = context.newRecord.getValue(fieldName);
	    				
	    				if ((newValue !== null) && (oldValue != newValue))
	    					logChange(context, {
	    						noteTitle: fld.label + " (" + fieldName + ") was updated.  Old value was", 
	    						noteText: (oldValue ? oldValue : "'blank'"),
	    						noteType: noteType
	    					});
	    					
	    			}		    		
		    	} catch (e) {
	        		log.error(funcName, (e instanceof nlobjError) ? (e.getCode() + " : " + e.getDetails() + " : " + e.getStackTrace().join(":") + " : " + e.getUserEvent()) : (e.name + " : " + e.message));			    		
		    	}
    		} // beforeSubmit
    		
    		function logChange(context, details) {
    			
    			log.debug("logChange", "Starting");
    			var N = record.create({
    				type: record.Type.NOTE,
    				isDynamic: true
    			});
    			
    			
    			if ((context.newRecord.type == record.Type.CUSTOMER) || (context.newRecord.type == record.Type.LEAD) || (context.newRecord.type == record.Type.PROSPECT) || (context.newRecord.type == record.Type.CONTACT)) {
    				N.setValue("entity", context.newRecord.id);
    			} else 
    				if (context.newRecord.type.substring(0,12) == "customrecord") {
    					N.setValue("recordtype", getCustomRecordTypeId(context.newRecord.type));
    					N.setValue("record",context.newRecord.id);
    				} else {
    					N.setValue("transaction", context.newRecord.id);
    				}    			
    			
    			N.setValue("note", details.noteText);
    			N.setValue("title", details.noteTitle);
    			N.setValue("notetype", details.noteType);
    			
    			log.debug("logChange", "about to save note");
    			
    			var id = N.save();

    			log.debug("logChange", "note id=" + id);

    		}
    		
    		
    		function getCustomRecordTypeId(recName){
    			var idMatch = (/\brectype=(\d+)/).exec(url.resolveRecord({recordType: recName}));
    			return idMatch ? idMatch[1] : null;
    		}
    		
    		
    		return {
    			afterSubmit: afterSubmit
    		};
});
