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


define(['N/error', 'N/runtime', 'N/ui/dialog', './Shared/SRS_Constants', '/.bundle/132118/PRI_ClientLibrary'],
	function(error, runtime, dialog, srsConstants, priLibrary) {
		
		var scriptName = "SRS_CL_DealAction.";

		var REC;
		
		var inFieldControl = false;
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
        	REC = context.currentRecord;

			formFieldControl(context);

		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function fieldChanged(context) {
			
			if (context.fieldId == "custrecord_dc_rcv_aea_stmts" || context.fieldId == "custrecord_esc_con_roles") {
				/*
				if (!priLibrary.isSelectFieldItemSelected(REC, "custrecord_esc_con_roles", srsConstants.ESCROW_CONTACT_ROLES.ACQUIOM_ESCROW_AGENT_CLIENT)) {
					REC.setValue({fieldId: "custrecord_dc_rcv_aea_stmts", value: false, ignoreFieldChange: true});
				}
				*/
				if (!REC.getValue("custrecord_dc_rcv_aea_stmts")) {
					REC.setValue({fieldId: "custrecord_dc_deal_escrow_statements", value: "", ignoreFieldChange: true});
				}

				formFieldControl(context);
			}
			
			inFieldChanged = false; 
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		function saveRecord(context) {
        	REC = context.currentRecord;

        	//--------------------------------------------------
        	//ATP-382	Start	Alex Mincey	   5/9/2019
        	//--------------------------------------------------

        	//If Receive Paid/Unpaid Report checkbox is checked then a valid email must be set. 
        	//If not set this will cancel the record save and display a alert message
        	var receivePaidUnpaidReport = REC.getValue({
        		fieldId: "custrecord_receive_paid_unpaid_report"
        	});

        	var contactEmail = REC.getValue({
        		fieldId: "custrecord_dc_email"
        	});


        	if (receivePaidUnpaidReport == "T" || receivePaidUnpaidReport == true)
        	{
        		if (contactEmail)
        		{
        			return true;
        		}
        		else
        		{
					dialog.alert({
	        			'title': 'Invalid Email',
	        			'message': 'If Receive Paid/Unpaid Report is checked a valid email address MUST be set.'
	        		});

        			return false;
        		}
        	}
        	else
        	{
    			return true;
        	}

        	//--------------------------------------------------
        	//ATP-382	End    Alex Mincey	   5/9/2019
        	//--------------------------------------------------
        	        	
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function formFieldControl(context) {			
			//priLibrary.disableFormField(context,null, "custrecord_dc_rcv_aea_stmts", null, !priLibrary.isSelectFieldItemSelected(REC, "custrecord_esc_con_roles", srsConstants.ESCROW_CONTACT_ROLES.ACQUIOM_ESCROW_AGENT_CLIENT));
			priLibrary.disableFormField(context,null, "custrecord_dc_escrow_agt_auth_callback", null, !priLibrary.isSelectFieldItemSelected(REC, "custrecord_esc_con_roles", srsConstants.ESCROW_CONTACT_ROLES.ACQUIOM_ESCROW_AGENT_CLIENT));
			priLibrary.disableFormField(context,null, "custrecord_dc_deal_escrow_statements", null, !REC.getValue("custrecord_dc_rcv_aea_stmts"));
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

