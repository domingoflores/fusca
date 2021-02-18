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


// Validation/Customization/Initiation on the Deal Point Study record

define(['N/error', 'N/runtime', './Shared/SRS_Constants', '/.bundle/132118/PRI_ClientLibrary'],
	function(error, runtime, srsConstants, priLibrary) {
		
		var scriptName = "SRS_CL_DealPointStudy.";

		var REC;
		
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
        	REC = context.currentRecord;

		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function saveRecord(context) {
        	REC = context.currentRecord;
        	

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

        	
        	
        	/*
        	// if the only SOURCE is ENTERPRISE CLIENT, then we don't require the DEAL field
        	if (REC.getValue("custrecord_dp_source").length == 1 && priLibrary.isSelectFieldItemSelected(REC,"custrecord_dp_source",srsConstants.DPS_SOURCE.ENTERPRISE_CLIENT))
        		; // do nothing
        	else
        		if (!REC.getValue("custrecord_deal")) {
        			alert("When the DEAL POINT SOURCE includes anything OTHER THAN 'Enterprise Client,' then you must specify the DEAL."); 
        			return false;
        			
        		}
			*/
        	
        	
        	
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

