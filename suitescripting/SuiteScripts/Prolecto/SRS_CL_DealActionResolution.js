//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
* @NModuleScope Public
*/


// client code for Deal Action Resolution Record 


define(['N/error', 'N/runtime', './Shared/SRS_Constants', '/.bundle/132118/PRI_ClientLibrary'],
	function(error, runtime, srsConstants, priLibrary) {
		
		var scriptName = "SRS_CL_DealActionResolution.";

		var REC;
		
		var formReady = false;
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
        	REC = context.currentRecord;

			formFieldControl(context);

			formReady = true;
			
//			NS.jQuery(".uir-record-type" ).text("Escrow Agent Action Resolution");
					
			if (!REC.id && REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT_RESOLUTION)
				REC.setValue("custrecord_dar_department", srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT); 						

		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function validateField(context) {
//			console.log("validateField: " + JSON.stringify(context));
			
			return formReady; 
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		function fieldChanged(context) {
//			console.log("fieldChanged: " + JSON.stringify(context));

			if (context.fieldId == "custrecorddrfirstactioncomplete")
				if (REC.getValue("custrecorddrfirstactioncomplete")) {
					REC.setValue("custrecord_dar_1st_entry_completed_by", runtime.getCurrentUser().id); 
					REC.setValue("custrecord_dar_1st_entry_completed_date", new Date()); 				
				} else {
					REC.setValue("custrecord_dar_1st_entry_completed_by", ""); 
					REC.setValue("custrecord_dar_1st_entry_completed_date", ""); 									
				}
			
			if (context.fieldId == "custrecorddrsecondreviewcomplete")
				if (REC.getValue("custrecorddrsecondreviewcomplete")) {
					REC.setValue("custrecord_dar_2nd_review_completed_by", runtime.getCurrentUser().id); 
					REC.setValue("custrecord_dar_2nd_review_completed_date", new Date()); 				
				} else {
					REC.setValue("custrecord_dar_2nd_review_completed_by", ""); 
					REC.setValue("custrecord_dar_2nd_review_completed_date", ""); 									
				}
			
			// ATP-633 / ATP-749
			if (   context.fieldId == "custrecord_resolution_date" ) {
				if ( REC.getValue("customform") == srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION_RESOLUTION ) {
					REC.setValue({ fieldId:"custrecord_dar_resolution_date_changed" ,value:true });
				}
			} 
			if (   context.fieldId == "custrecord_resolution_amount"
				|| context.fieldId == "custrecord_resolution_type"   ) {
				if ( REC.getValue("customform") == srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION_RESOLUTION ) {
					if (!REC.getValue("custrecord_dar_resolution_date_changed")) {
						REC.setValue({ fieldId:"custrecord_resolution_date" ,value: new Date() });
					}
				}
			} // End ATP-633 / ATP-749
			

			formFieldControl(context);
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		function saveRecord(context) {
        	REC = context.currentRecord;
        	        	
    		return true;
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function formFieldControl(context) {			

			// 1st checkbox is protected if 2nd checkbox is set
			priLibrary.disableFormField(context,null, "custrecorddrfirstactioncomplete", null, REC.getValue("custrecorddrsecondreviewcomplete"));

			// 2nd checkbox is protected if 1st checkbox is empty
			priLibrary.disableFormField(context,null, "custrecorddrsecondreviewcomplete", null, !REC.getValue("custrecorddrfirstactioncomplete"));

			// 2nd checkbox is also protected if THIS user completed the 1st review
			if (REC.getValue("custrecord_dar_1st_entry_completed_by") == runtime.getCurrentUser().id) {
				console.log("disabling 2nd checkbox becauser user is same");
				priLibrary.disableFormField(context,null, "custrecorddrsecondreviewcomplete", null, true);								
			}
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	
		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			// postSourcing: postSourcing,
			// sublistChanged: sublistChanged,
			// lineInit: lineInit,
			validateField: validateField,
			// validateLine: validateLine,
			// validateInsert: validateInsert,
			// validateDelete: validateDelete,
			saveRecord: saveRecord
			};
});

