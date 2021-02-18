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

		var scriptName = "SRS_UE_EnterpriseClient.";


		const CAPTURE_METHOD = {
				NONE:		1,
				PROVIDED:	2,
				DERIVED:	3
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeSubmit(context) {

	    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + JSON.stringify(runtime.executionContext);

			var REC = context.newRecord;
			
			if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.CREATE) {
				
				if (REC.getValue("custrecord_ec_deal_url_capture_method") == CAPTURE_METHOD.DERIVED)
					if (!REC.getValue("custrecord_ec_general_deal_url"))
						throw "When the CAPTURE METHOD is 'Derived' you must provide the GENERAL DEAL URL";
				
			}
			

		} // beforeSubmit

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    		return {
    			beforeSubmit: beforeSubmit
    		}
});

