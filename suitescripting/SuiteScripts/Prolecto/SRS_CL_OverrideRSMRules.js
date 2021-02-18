//-----------------------------------------------------------------------------------------------------------
// Copyright 2020 All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

/*
 *
 * Client-side helper script to SRS_CL_OverrideRSMRules suitelet
 * 
 */

define(['N/error','N/format'],
	function(error,format) {
	
		var scriptName = "SRS_CL_OverrideRSMRules.";

		const SUBLIST_ID = "custpage_list"; 

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		var REC; 
		
		function pageInit(context) {
			
			console.log("starting..."); 
			
			REC = context.currentRecord; 			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function fieldChanged(context) {
			
			console.log("fieldChanged: " + JSON.stringify(context));
			
			var lineNbr = context.line; 

			
			var fieldList = context.currentRecord.getValue("custpage_refresh_field_list");
			if (fieldList && fieldList.length > 0) {
				var fieldNames = fieldList.split(",");
				
				if (fieldNames.indexOf(context.fieldId) >= 0) {
					context.currentRecord.setValue("custpage_refresh_action","REFRESH");

					if (window.onbeforeunload) {
						window.onbeforeunload = function() { null; };
					}

					try {
						var button = document.forms['main_form'].elements['submitter'];
						button.click();							
					} catch (e) {
						document.forms[0].submit();
					}						
				}
			}				

			
			if (context.fieldId == "override") {
				// if 'override' was just set, then clear the 'createcase' column
				if (REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "override", line: lineNbr})) {
					REC.selectLine({sublistId: SUBLIST_ID, line: lineNbr});
					REC.setCurrentSublistValue({sublistId: SUBLIST_ID, fieldId: "createcase", value: false, ignoreFieldChange: true}); 
					REC.commitLine({sublistId: SUBLIST_ID});																	
				}
				
			}

			if (context.fieldId == "createcase") {
				// if 'createcase' was just set, then clear the 'override' column
				if (REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "createcase", line: lineNbr})) {
					if (REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "case", line: lineNbr})) {
						// if we already have a case, then undo this change
						alert("A Deficiency Case already exists for this Exchange Record/Rule.  You may not create another one.");
						REC.selectLine({sublistId: SUBLIST_ID, line: lineNbr});
						REC.setCurrentSublistValue({sublistId: SUBLIST_ID, fieldId: "createcase", value: false, ignoreFieldChange: true}); 
						REC.commitLine({sublistId: SUBLIST_ID});																							
					} else {
						// otherwise clear the other flag
						REC.selectLine({sublistId: SUBLIST_ID, line: lineNbr});
						REC.setCurrentSublistValue({sublistId: SUBLIST_ID, fieldId: "override", value: false, ignoreFieldChange: true}); 
						REC.commitLine({sublistId: SUBLIST_ID});																	
					}
				}				
			}
		}
		
		
		function validateField(context) {

			console.log("validateField: " + JSON.stringify(context));

			// don't let user select "createcase" if a case already exists
			if (context.fieldId == "createcase") {
				var lineNbr = context.line; 
				
				console.log("CASE on line " + lineNbr + " = " + REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "case", line: lineNbr}));
				
				if (REC.getSublistValue({sublistId: SUBLIST_ID, fieldId: "case", line: lineNbr})) {
					return false;					
				}
			} else
				console.log("field changed was NOT case...");
				
			return true; 
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		return {
			pageInit: 			pageInit,
			fieldChanged:		fieldChanged,
//			validateField:		validateField
		};
});

