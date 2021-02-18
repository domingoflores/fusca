//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
* @NModuleScope Public
*/


// client logic on INVOICE record 


define(['N/error', 'N/runtime', 'N/ui/dialog','N/ui/message','./Shared/SRS_Constants', '/.bundle/132118/PRI_ClientLibrary'],
	function(error, runtime, dialog, message, srsConstants, priLibrary) {
		
		var scriptName = "SRS_CL_Invoice.";

		var REC;
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
        	REC = context.currentRecord;

        	if (!REC.id) {
    			var itemId = getParameterByName("itemid"); 
    			var itemQty = getParameterByName("itemqty"); 
    			var itemDept = getParameterByName("itemdept"); 
    			
    			if (itemId && itemQty) {
    				REC.selectNewLine({sublistId: "item"});
    				
    				REC.setCurrentSublistValue({sublistId: "item", fieldId: "item", value: itemId, ignoreFieldChange:false, fireSlavingSync: true});
    				REC.setCurrentSublistValue({sublistId: "item", fieldId: "quantity", value: itemQty, ignoreFieldChange:false, fireSlavingSync: true});
    				REC.setCurrentSublistValue({sublistId: "item", fieldId: "department", value: itemDept, ignoreFieldChange:false, fireSlavingSync: true});

    				message.create({title:"Reminder", message: "Remember to set the AMOUNT on the line item, and select the correct CURRENCY before saving", type: message.Type.INFORMATION}).show();
    				
//    				don't commit, since we don't have a rate -- user will need to fill it in
//    				REC.commitLine({sublistId: "item"}); 									
    			}        		
        	}
		}


		function getParameterByName(name) {
			var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
			
			return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		return {
			pageInit: pageInit,
		};
});

