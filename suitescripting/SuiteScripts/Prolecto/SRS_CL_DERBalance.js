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
 * Client script for the similarly named Suitelet 
 * 
 */

define(['N/error','N/ui/dialog','N/currentRecord','N/format'],
	function(error,dialog,currentRecord,format) {
	
		var scriptName = "SRS_CL_DERBalance.";

		const SUBLIST_ID = "custpage_list"; 
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		var REC; 
		
		function pageInit(context) {		
			REC = context.currentRecord; 
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function downloadCSV() {

			const PARM_NAMES = ["custpage_unpaid_amount","custpage_other_amount","custpage_pay_date_min","custpage_pay_date_max","custpage_ops_approved_to_pay","custpage_der_status","custpage_show_zero_balance","custpage_deal_name"]; 
			
			var REC = currentRecord.get();
			
			URL = REC.getValue("custpage_url"); // jQuery("#custpage_url").val();
			
			for (var i = 0; i < PARM_NAMES.length; i++) {
				var fieldName = PARM_NAMES[i]; 
				
				s = getFieldValue(REC,fieldName);
				
				URL += "&" + fieldName + "=" + s;
			}

			window.open(URL+"&custpage_download=T","_blank");			
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function getFieldValue(REC, fieldName) {

			var fld = REC.getField(fieldName); 
			
			if (!fld)
				return "";


			if (fld.type == format.Type.CHECKBOX)
				if (REC.getValue(fieldName))
					return "T";
				else
					return "F";
									
			if (fld.type == format.Type.DATE || fld.type == format.Type.DATETIME || fld.type == format.Type.DATETIMETZ) {
				var s = REC.getValue(fieldName); 
				if (s)
					return format.format({type: format.Type.DATE, value: s}); 
			}
			
			var s = REC.getValue(fieldName);

			return s;
							
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		return {
			downloadCSV:		downloadCSV,
			pageInit: 			pageInit,
		};
});