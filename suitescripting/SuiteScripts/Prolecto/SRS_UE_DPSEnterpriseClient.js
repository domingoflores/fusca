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

		var scriptName = "SRS_UE_DPSEnterpriseClient.";


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

				if (REC.getValue("custrecord_dpsec_enterprise_client") && !REC.getValue("custrecord_dpsec_deal_url")) {
					var clientFields = search.lookupFields({type: "customrecord_enterprise_client", id: REC.getValue("custrecord_dpsec_enterprise_client"), columns: ["custrecord_ec_deal_url_capture_method","custrecord_ec_general_deal_url"]});
					
					if (clientFields && clientFields.custrecord_ec_deal_url_capture_method && clientFields.custrecord_ec_deal_url_capture_method.length > 0) {
						if (clientFields.custrecord_ec_deal_url_capture_method[0].value == CAPTURE_METHOD.DERIVED) {
							var url = clientFields.custrecord_ec_general_deal_url;
							url = url.replace("{dealid}", REC.getValue("custrecord_dpsec_client_deal_id")); 
							
							REC.setValue("custrecord_dpsec_deal_url", url); 
						}
					}					
				}
			}
			

		} // beforeSubmit

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    		return {
    			beforeSubmit: beforeSubmit
    		}
});

