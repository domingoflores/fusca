//-----------------------------------------------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType ClientScript
*/

/*
 *
 * Client script for the Suitelet which lets user create an Escrow Agent Statement batch
 * 
 */

define(['N/error','N/ui/dialog'],
	function(error,dialog) {
	
		var scriptName = "SRS_CL_CreateEscrowAgentStatementBatch.";

		const SUBLIST_ID = "custpage_list"; 
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		var REC; 
		var refreshCriteria = false; 
		
		function pageInit(context) {		
			REC = context.currentRecord; 
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function saveRecord(context) {
			
			if (refreshCriteria)
				return true; 
			
			/*
			var button1 = {label: 'Yes',value: 1};
			var button2 = {label: 'No',value: 2};
			
			var options = {
					title: 'Confirm',
					message: 'Are you sure you want to generate statements?',
					buttons: [button1, button2]
			};
			
			var okToSave = false;
			
			dialog.create(options).then(function (result){
				if (result == 1)
					okToSave = true; 								 
			}).catch(function (result) {
				alert("failure: " + result); 
			});			
			
			alert("ok to save?" + okToSave); 
			*/
			
			if (confirm("Are you sure you want to generate statements?"))
				return true; 
			
			// return okToSave; 
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function fieldChanged(context) {

			var funcName = scriptName + ".fieldChanged " + context.mode + " " + context.sublistId + " " + context.fieldId;

			// there should be a hidden field that lists the fields that should cause a refresh
			
			var fieldList = context.currentRecord.getValue("custpage_refresh_field_list");
			if (fieldList && fieldList.length > 0) {
				var fieldNames = fieldList.split(",");
				
				if (fieldNames.indexOf(context.fieldId) >= 0) {
					context.currentRecord.setValue("custpage_refresh_action","REFRESH");

					refreshCriteria = true; 
					
					try {
						var button = document.forms['main_form'].elements['submitter'];
						button.click();							
					} catch (e) {
						document.forms[0].submit();
					}						
				}
			}				
			
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		return {
			pageInit: 			pageInit,
			fieldChanged:		fieldChanged,
			saveRecord:			saveRecord
		};
});

