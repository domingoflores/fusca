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
 * Prolecto Utilities Bundle
 * 		generic script to cause a SUITELET to refresh when certain fields change values
 * 
 */

define(['N/error'],
	function(error) {
	
		var scriptName = "PRI_CL_SuiteletRefresh.";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function fieldChanged(context) {

			var funcName = scriptName + ".fieldChanged " + context.mode + " " + context.sublistId + " " + context.fieldId;

			// there should be a hidden field that lists the fields that should cause a refresh
			
			var fieldList = context.currentRecord.getValue("custpage_refresh_field_list");
			if (fieldList && fieldList.length > 0) {
				var fieldNames = fieldList.split(",");
				
				if (fieldNames.indexOf(context.fieldId) >= 0) {
					context.currentRecord.setValue("custpage_refresh_action","REFRESH");

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
			fieldChanged: fieldChanged
		};
});

