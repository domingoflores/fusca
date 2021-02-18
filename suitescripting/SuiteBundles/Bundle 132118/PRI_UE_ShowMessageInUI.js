//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * just calls the library function to show any pending message
 * 
 */

define(['N/record', 'N/log', 'N/runtime', '/.bundle/132118/PRI_ShowMessageInUI'],
				
	function(record, log, runtime, priMessage) {

		var scriptName = "pri_UE_ShowClientMessageInUI.";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeLoad(context) {

	    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    	

			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE &&  context.type == context.UserEventType.VIEW || context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) 
			{
				priMessage.showPreparedMessage(context);
				log.debug(funcName);
				log.debug(runtime.getCurrentSession().get({name: "pri_msgTitle"}));
			}

		}
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	return {
		beforeLoad: beforeLoad
	}
});

