//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
* @NModuleScope Public
*/


// prevent users from creating new Expense Reports 


define(['N/error', 'N/runtime','N/ui/message'],
	function(error, runtime, message) {
		
		var scriptName = "SRS_CL_ExpenseReport.";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
			
			if (!context.currentRecord.id) {
				message.create({
					title: "Can't Create Expense Report",
					message: "Expense reporting in NetSuite has been disabled. Please go to <a href='app.eu1.chromeriver.com'>app.eu1.chromeriver.com</a> to enter your expense report.",
					type: message.Type.ERROR
					}).show();				
			}
			
       	}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function saveRecord(context) {
			if (!context.currentRecord.id) {
				alert("Expense reporting in NetSuite has been disabled. Please go to app.eu1.chromeriver.com to enter your expense report.");
				return false;
			}
        	
    		return true;
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
	
		return {
			pageInit: pageInit,
			// fieldChanged: fieldChanged,
			// postSourcing: postSourcing,
			// sublistChanged: sublistChanged,
			// lineInit: lineInit,
			// validateField: validateField,
			// validateLine: validateLine,
			// validateInsert: validateInsert,
			// validateDelete: validateDelete,
			saveRecord: saveRecord
			};
});

