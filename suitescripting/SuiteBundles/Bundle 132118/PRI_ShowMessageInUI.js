//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NModuleScope Public
*/


/*
 * 	This is a library script which can be used to inject "Banner Messages" into the UI on any record
 * 
 * 	Most commonly, you can use this in a beforeSubmit or afterSubmit event to format a message which will be displayed to the user on the subsequent beforeLoad
 *		It can also be used to format a message on-the-fly in the beforeLoad, so that the user will see it immediately (in VIEW/EDIT/CREATE modes) 
 * 
 * 	This library is designed to work in TWO modes
 * 		MODE 1 is where the script/event which prepares the message is a different script/event than the one which needs to show the message.
 * 				Ane example of this is where the afterSubmit needs to prepare the message, but the subsequent display of the record (beforeLoad) needs to show the message
 * 				Another example is where a suitelet does some work, and will then navigate the user to a specific record, and when the user lands on that record, you want to display a message
 * 
 * 				In this mode, you use the prepareMessage() function to prepare the message (in the afterSubmit or Suitelet, in our example)
 * 					then you just make sure that script PRD: Show User Message (UE) is deployed against the record type on which the message is to be shown
 * 						alternatively, you can just include this library in an existing User Event script on that target record, and then call the showPreparedMessage(context) function.  If there is no message, no problem
 * 
 * 				NOTE: when you use prepareMessage, along with the usual parameters for controlling the message information, there are two additional parameters which let you control when this message will be shown
 *					by specifying a specific record type, you ensure that the message will only be shown when the user is viewing/editing a record of that type
 *						by further specifying an specific record ID, you ensure that the user will see this message only when they look at that exact record
 *						NOTE this this will only last during the user's current "login" ... once they log out, this information will be lost
 * 
 * 
 *   	MODE 2 is where you the event is the same -- in other words, during beforeLoad, you know you want to show a message
 *   			In this mode, use the showMessage() function to inject a message immediately; this works in VIEW, CREATE or EDIT 
 * 
 */

define(['N/record','N/error','N/runtime','N/ui/serverWidget'],

	function(record, error, runtime, serverWidget) {

		"use strict";

	    var scriptName = "pri_ShowMessageInUI.";
	
	    var TYPE = {
	    		CONFIRMATION: 0,
	    		INFORMATION: 1,
	    		WARNING: 2,
	    		ERROR: 3	    		
	    }
	    
	    function prepareMessage(msgTitle, msgText, msgType, msgDuration, recordType, recordId) {
	    	
	    	var INFORMATION = 1;
	    	
	    	// only the first two parameters are required; 
	    	//		msgType:		if omitted, "Information" is assumed
	    	//		msgDuration:	if omitted, the message has no expiration time
	    	//		recordType:		if specified, the message will only be shown when the user views a record of this type
	    	//		recordId:		along with recordType, if specified, the message will only be shown if the user views this specific record

	    	clearStoredMessage();
	    	
			runtime.getCurrentSession().set({name: "pri_msgTitle", value: msgTitle});
			runtime.getCurrentSession().set({name: "pri_msgText", value: msgText});
			
			runtime.getCurrentSession().set({name: "pri_msgType", value: msgType || TYPE.INFORMATION});
			
			runtime.getCurrentSession().set({name: "pri_msgDuration", value: msgDuration || 0});

			if (recordType) {
				runtime.getCurrentSession().set({name: "pri_msgRecordType", value: recordType});
				if (recordId)
					runtime.getCurrentSession().set({name: "pri_msgRecordId", value: recordId});
			}
	          
	    }
	

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	    function showPreparedMessage(context) {

	    	var REC = context.newRecord;
	    	
	    	var msgTitle = runtime.getCurrentSession().get({name: "pri_msgTitle"});
	    	var msgText = runtime.getCurrentSession().get({name: "pri_msgText"});
	    	var msgType = runtime.getCurrentSession().get({name: "pri_msgType"});

	    	// if we don't really have a message, then there's nothing to do;
	    	if (!msgTitle || !msgText) 
	    		return;
	    	
	    	var msgDuration = runtime.getCurrentSession().get({name: "pri_msgDuration"});
	    	var msgRecordType = runtime.getCurrentSession().get({name: "pri_msgRecordType"});
	    	var msgRecordId = runtime.getCurrentSession().get({name: "pri_msgRecordId"});
	    	
	    	if (msgRecordType) {
	    		if (msgRecordType != REC.type)
	    			return;
	    		if (msgRecordId && (msgRecordId != REC.id))
	    			return;	    		
	    	} 
	    	
	    	
   		 	context.form.addPageInitMessage({type: msgType, title: msgTitle, message: msgText, duration: msgDuration || 0}); 
/*          
   		 var scr = "message.create({title: '{msgTitle}', message: '{msgText}', type: {msgType}}).show({msgDuration})";
   		 scr = scr.replace("{msgTitle}",msgTitle.replace(/'/g,"''"));
   		 scr = scr.replace("{msgText}",msgText.replace(/'/g,"''"));
   		 scr = scr.replace("{msgType}",msgType);
   		 scr = scr.replace("{msgDuration}",msgDuration);
   		 

   		 var msgFld = context.form.addField({
             id:'custpage_pri_prepared_msg',
             label:'not shown',
             type: serverWidget.FieldType.INLINEHTML
         });
		 
         msgFld.defaultValue = "<script>jQuery(function($){require(['N/ui/message'], function(message){" + scr + ";})})</script>"
*/
         clearStoredMessage();
	    	
	    }

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	    function showMessage(context, msgTitle, msgText, msgType, msgDuration) {

   		 	context.form.addPageInitMessage({type: msgType, title: msgTitle, message: msgText, duration: msgDuration || 0}); 
/*
	   		 var scr = "message.create({title: '{msgTitle}', message: '{msgText}', type: {msgType}}).show({msgDuration})";
	   		 
	   		 scr = scr.replace("{msgTitle}",msgTitle.replace(/'/g,"''"));
	   		 scr = scr.replace("{msgText}",msgText.replace(/'/g,"''"));
	   		 scr = scr.replace("{msgType}",msgType || TYPE.INFORMATION);
	   		 scr = scr.replace("{msgDuration}",msgDuration || 0);
	   		 		   		
	   		 var msgFld = context.form.addField({
	             id:'custpage_pri_msg_' + Math.floor(Math.random()*10000) + 10000,
	             label:'not shown',
	             type: serverWidget.FieldType.INLINEHTML
	         });
			 
	         msgFld.defaultValue = "<script>jQuery(function($){require(['N/ui/message'], function(message){" + scr + ";})})</script>"
*/	    	
	    }

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


	    function clearStoredMessage() {
			runtime.getCurrentSession().set({name: "pri_msgTitle", value: null});
			runtime.getCurrentSession().set({name: "pri_msgText", value: null});
			runtime.getCurrentSession().set({name: "pri_msgType", value: null});
			runtime.getCurrentSession().set({name: "pri_msgDuration", value: null});
			runtime.getCurrentSession().set({name: "pri_msgRecordType", value: null});
			runtime.getCurrentSession().set({name: "pri_msgRecordId", value: null});	    	
	    }


		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		
	    return {	    	
	    	TYPE: 					TYPE,
	    	prepareMessage:			prepareMessage,
	    	showPreparedMessage:	showPreparedMessage, 
	    	showMessage:			showMessage 
	    };
	});
