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


// Validation/Customization/Initiation on the Release Approval Process record

define(['N/error', 'N/runtime', 'N/record', 'N/search','/SuiteScripts/Pristine/libraries/toolsLibraryClient.js'],
	function(error, runtime, record, search, toolsLib) {
		
		var scriptName = "SRS_CL_Payment.";

		var REC;
		
		var dealEscrowProcess = false;

		var inCurrencyChange = false;

		const CURRENCY_IS_USD = "1"; 
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
        	REC = context.currentRecord;

        	var queryString = window.location.href.toLowerCase();
        	
        	
        	if (!REC.id) {
        		if (REC.getValue("custbodyacq_deal_link") && REC.getValue("custbody_deal_escrow")) {
        			
        			dealEscrowProcess = true; 
        			
        			// hide the DEPOSITS subtab, 
        			NS.jQuery("#deposittxt").hide();

        			
        			// NS.jQuery("#custpage_account_fs").hide();
        			// NS.jQuery("#inpt_custpage_account").hide();

        			
        			NS.jQuery("#undepfunds_fs_inp").hide();
        			NS.jQuery("#undepfunds_fs_lbl").hide();
        			NS.jQuery("#inpt_account").hide();
        			NS.jQuery("#inpt_account3").hide();
        			NS.jQuery("#undepfunds").hide();
        			NS.jQuery("#undepfunds_fs_lbl_uir_label").hide();
        			NS.jQuery("#account_fs_lbl_uir_label").hide();
        			
        			
        			NS.jQuery("#inpt_account3_arrow").hide();
        			NS.jQuery("#account_popup_new").hide();
        			
        			console.log("setting ar account parameter and filters");
        			
        			// this must be done client side, as NetSuite doesn't refilter the list if you do it server-side
        			if (toolsLib.getQueryParameter("aracct")) 
						context.currentRecord.setValue("aracct", toolsLib.getQueryParameter("aracct"));
        			
        			var escrowId = REC.getValue("custbody_deal_escrow"); 
        			var escrowName = search.lookupFields({type: "customrecord_deal_escrow", id: REC.getValue("custbody_deal_escrow"), columns: ["name"]}).name; 
        			
        			console.log("escrow=" + escrowId + "; name=" + escrowName); 

        			// change all the fields which have this prefix; NS adds numerical suffix which changes from time to tome
        			NS.jQuery('[id^="inpt_CUSTBODY_DEAL_ESCROW"]').val(escrowName).change();
        			NS.jQuery('[id^="hddn_CUSTBODY_DEAL_ESCROW"]').val(escrowId).change();

        			NS.jQuery("#CUSTBODY_DEAL_ESCROW").val(escrowId).change();
        		} 
        		
        		// ATP-1848: when a currency is passed in via URL, although the page defaults to that currency, the list of invoices shown on the bottom are still USD invoices
        		//				to get NS to refresh the list, trigger a field-change, which automatically causes it to refresh list to match the currency
    			if (toolsLib.getQueryParameter("currency") || toolsLib.getQueryParameter("record.currency"))
    				if (REC.getValue("currency") != CURRENCY_IS_USD)
    					NS.jQuery('[id^="hddn_currency"]').val(REC.getValue("currency")).change();

        	}
			
		}


		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function fieldChanged(context) {

			// ATP-1761: need to track when the currency field is changing, and then wait for the PostSourcing event, because that's
			//			how you know that NetSuite is finished with its work; then you can update the account
			if (context.fieldId == "currency") 
				inCurrencyChange = true; 

		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function postSourcing(context) {

			// ATP-1761: we are going to do this if the payment is linked to a Deal Event
			if (context.fieldId == "currency" && context.currentRecord.getValue("currency") && context.currentRecord.getValue("custbody_deal_event") && inCurrencyChange) {
				inCurrencyChange = false;
				var glAccountId = findDERAccountByCurrency(context.currentRecord.getValue("custbody_deal_event"), context.currentRecord.getValue("currency")); 
				if (glAccountId)
					context.currentRecord.setValue({fieldId: "account", value: glAccountId, ignoreFieldChange: true});
				else
					context.currentRecord.setValue({fieldId: "account", value: "", ignoreFieldChange: true});
//					alert("The CURRENCY you selected is invalid for this DER"); 					
			}
						
		}

		// ATP-1761: supporting function 
		function findDERAccountByCurrency(derId, currencyId) {
			try {
				var ss = search.create({
					type:		"customrecord_payment_tie_out",
					filters:	[
					        	 	["isinactive",search.Operator.IS,false]
					        	 	,"AND",["custrecord_pto_der_link",search.Operator.ANYOF,[derId]]
					        	 	,"AND",["custrecord_pto_currency",search.Operator.ANYOF,[currencyId]]
					        	 ],
					columns:	["custrecord_pto_gl_account"]
				}).run().getRange(0,1); 
				
				if (ss.length > 0)
					return ss[0].getValue("custrecord_pto_gl_account"); 
				
			} catch (e) {
				log.error("findDERAccountByCurrency", e); 
				console.log("Error looking up GL Account for this DER/Currency"); 
			}
			
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		function saveRecord(context) {

			if (dealEscrowProcess && REC.getValue("custbody_deal_escrow")) {
	        	// in case user changed filters, make sure selected rows are still right

				for (var i = 0; i < REC.getLineCount({sublistId: "apply"}); i++) {
					if (REC.getSublistValue({sublistId: "apply", fieldId: "apply", line: i})) {
						var invoiceId = REC.getSublistValue({sublistId: "apply", fieldId: "doc", line: i});
						
						var invoiceFields = search.lookupFields({type: record.Type.INVOICE, id: invoiceId, columns: ["custbody_deal_escrow"]}); 
						
						if (invoiceFields.custbody_deal_escrow && invoiceFields.custbody_deal_escrow.length > 0 && invoiceFields.custbody_deal_escrow[0].value == REC.getValue("custbody_deal_escrow"))
							; // that's OK
						else {
							alert("Invoice " + REC.getSublistValue({sublistId: "apply", fieldId: "refnum", line: i}) + " is not for this Deal Escrow and may not be selected."); 
							return false;
						}
							
					}
					
				}
			
				// ATP-1840: I commented out the next line in ATP-1761, but I should not have, so 1840 reverses this (and un-uncomments)
				// ATP-1761: commenting out next line; they might change the currency, and therefore the account that was passed in, so the validation below will control it
				REC.setValue("account", REC.getValue("custpage_account")); 								
				
			}
				
//			ATP-1761: we don't want to force to this account again, because the user may have changed currencies, and thus account; instead, we want to make sure that the account linees up with the currency
			if (context.currentRecord.getValue("custbody_deal_event")) {
				var glAccountId = findDERAccountByCurrency(context.currentRecord.getValue("custbody_deal_event"), context.currentRecord.getValue("currency")); 

				if (glAccountId) {
					if (context.currentRecord.getValue("account") != glAccountId) {
						alert("The ACCOUNT you selected is invalid for this Currency of the DER"); 
						return false;
					}
					
				} else {
					alert("The CURRENCY you selected is invalid for this DER"); 
					return false;					
				}
			}

        	return true;

		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	
		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			postSourcing: postSourcing,
			// sublistChanged: sublistChanged,
			// lineInit: lineInit,
			// validateField: validateField,
			// validateLine: validateLine,
			// validateInsert: validateInsert,
			// validateDelete: validateDelete,
			saveRecord: saveRecord
			};
});

