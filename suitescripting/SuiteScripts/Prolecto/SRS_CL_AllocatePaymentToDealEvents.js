//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

/*
 *
 * Client-side helper script to SRS_SL_AllocatePaymentToDealEvents script, which allows user to allocate payments to Deal Events
 * 
 */

define(['N/error','N/format'],
	function(error,format) {
	
		var scriptName = "SRS_CL_AllocatePaymentToDealEvents.";

		const SUBLIST_ID = "custpage_list"; 

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		var REC; 
		
		function pageInit(context) {		
			REC = context.currentRecord; 			

			toggleFields(true);
			
			if (REC.getValue("custpage_message"))
				alert(REC.getValue("custpage_message")); 

		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function toggleFields(isDisabled) {

			// once we enable edit, we can't disable any more
			if (!isDisabled)
				NS.jQuery('#custpage_enable_edit').attr('disabled', true);
			
			for (var lineNbr = 0; lineNbr < REC.getLineCount({sublistId: SUBLIST_ID}); lineNbr++) {
				var f = REC.getSublistField({sublistId: SUBLIST_ID, fieldId: "selected", line: lineNbr});
				if (f)
					f.isDisabled = isDisabled; 

				var f = REC.getSublistField({sublistId: SUBLIST_ID, fieldId: "amount", line: lineNbr});
				if (f)
					f.isDisabled = isDisabled; 
			}
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		function enableEdit() {			
			toggleFields(false);
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		function fieldChanged(context) {

			// if there is only a single line, never let the user uncheck it
			if (context.fieldId == "selected") {
				var lineNbr = context.line; 
				if (!REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "selected", line: lineNbr}))
					if (REC.getLineCount({sublistId: SUBLIST_ID}) == 1)
						REC.setCurrentSublistValue({sublistId: SUBLIST_ID, fieldId: "selected", value: true, ignoreFieldChange: true}); 
			} 
				
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function saveRecord(context) {

			var totalAmount = REC.getValue("custpage_total_amount"); 

			var totalAllocated = 0; 
			
			for (var lineNbr = 0; lineNbr < REC.getLineCount({sublistId: SUBLIST_ID}); lineNbr++) {				
				if (REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "selected", line: lineNbr})) {
					if (!REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "amount", line: lineNbr})) {
						alert("You must enter the AMOUNT ALLOCATED for any allocations.");
						return false;
					}								
					if (Number(REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "amount", line: lineNbr})) < 0.01) {
						alert("The AMOUNT ALLOCATED must be greater than 0.");
						return false;
					}								
//					if (Number(REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "amount", line: lineNbr})) > Number(REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "total", line: lineNbr}))) {
//						alert("The AMOUNT ALLOCATED may not exceed the DER TOTAL.");
//						return false;
//					}
					totalAllocated += Number(REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "amount", line: lineNbr})); 
				}
			}
			
			totalAmount = totalAmount.toFixed(2); 
			totalAllocated = totalAllocated.toFixed(2);
			
			if (totalAllocated != totalAmount) {
				alert("The TOTAL ALLOCATED (" + format.format({value: totalAllocated, type: format.Type.CURRENCY2}) + ") must equal the TOTAL PAYMENT AMOUNT (" + format.format({value: totalAmount, type: format.Type.CURRENCY2}) + ")"); 
				return false;
			}
			
			return true; 
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		return {
			pageInit: 			pageInit,
			fieldChanged:		fieldChanged,
			saveRecord:			saveRecord,
			
			enableEdit:			enableEdit,

		};
});

