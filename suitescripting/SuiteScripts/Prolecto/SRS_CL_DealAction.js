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


// client logic on Deal Action Record 


define(['N/error', 'N/runtime', './Shared/SRS_Constants', '/.bundle/132118/PRI_ClientLibrary'],
	function(error, runtime, srsConstants, priLibrary) {
		
		var scriptName = "SRS_CL_DealAction.";

		var REC;
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
        	REC = context.currentRecord;

			formFieldControl(context);

			// NS.jQuery(".uir-record-type" ).text("Escrow Agent Action");
			
			if (!REC.id && REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT)
				REC.setValue("custrecord_da_department", srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT); 						
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function fieldChanged(context) {
			
			if (context.fieldId == "custrecord_action_date" && context.currentRecord.getValue("custrecord_action_date") && !context.currentRecord.getValue("custrecord_response_due_date")) {
				var dt = context.currentRecord.getValue("custrecord_action_date"); 
				context.currentRecord.setValue("custrecord_response_due_date", dt.addDays(30));
			}
			
			if (context.fieldId == "custrecordcustrecord_da_first_entry_comp")
				if (REC.getValue("custrecordcustrecord_da_first_entry_comp")) {
					REC.setValue("custrecord_da_1st_entry_completed_by", runtime.getCurrentUser().id); 
					REC.setValue("custrecord_da_1st_entry_completed_date", new Date()); 				
				} else {
					REC.setValue("custrecord_da_1st_entry_completed_by", ""); 
					REC.setValue("custrecord_da_1st_entry_completed_date", ""); 									
				}
			
			if (context.fieldId == "custrecordcustrecord_da_second_review")
				if (REC.getValue("custrecordcustrecord_da_second_review")) {
					REC.setValue("custrecord_da_2nd_review_completed_by", runtime.getCurrentUser().id); 
					REC.setValue("custrecord_da_2nd_review_completed_date", new Date()); 				
				} else {
					REC.setValue("custrecord_da_2nd_review_completed_by", ""); 
					REC.setValue("custrecord_da_2nd_review_completed_date", ""); 									
				}
			

			formFieldControl(context);
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		function saveRecord(context) {
        	REC = context.currentRecord;
        	
/*
        	if (priLibrary.isSelectFieldItemSelected(REC,"custrecord_dp_source",srsConstants.DPS_SOURCE.ENTERPRISE_CLIENT)) {
        		if (REC.getLineCount({sublistId: "recmachcustrecord_dpsec_dps"}) == 0) {
        			alert("When the DEAL POINT SOURCE includes 'Enterprise Client,' you must add at least one Enterprise Client record."); 
        			return false;
        		}
        	} else { 
        		if (REC.getLineCount({sublistId: "recmachcustrecord_dpsec_dps"}) > 0) {
        			alert("You may not link Enterprise Clients to this record uless the DEAL POINT SOURCE includes 'Enterprise Client'"); 
        			return false;
        		}
        	}

  */      	
        	
    		return true;
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function formFieldControl(context) {			

			// 1st checkbox is protected if 2nd checkbox is set
			priLibrary.disableFormField(context,null, "custrecordcustrecord_da_first_entry_comp", null, REC.getValue("custrecordcustrecord_da_second_review"));

			// 2nd checkbox is protected if 1st checkbox is empty
			priLibrary.disableFormField(context,null, "custrecordcustrecord_da_second_review", null, !REC.getValue("custrecordcustrecord_da_first_entry_comp"));

			// 2nd checkbox is also protected if THIS user completed the 1st review
			if (REC.getValue("custrecord_da_1st_entry_completed_by") == runtime.getCurrentUser().id) {
				console.log("disabling 2nd checkbox becauser user is same");
				priLibrary.disableFormField(context,null, "custrecordcustrecord_da_second_review", null, true);								
			}
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	
		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
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

