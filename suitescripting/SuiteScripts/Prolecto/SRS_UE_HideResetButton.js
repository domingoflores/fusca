//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(['N/record', 'N/search', 'N/runtime'],

	function(record, search, runtime) {

		"use strict";

		var scriptName = "SRS_UE_HideResetButton.";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeLoad(context) {

	    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + JSON.stringify(runtime.executionContext);

			try {
				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
	    			var button = context.form.getButton("resetter");
					if (button) {
    					button.isDisabled = true;
    					button.isHidden = true;
					}									
				}
			} catch (e) {
	    		; 
			}

		} // beforeLoad

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    		return {
    			beforeLoad: beforeLoad
    		}
});

