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


// Validation/Customization/Initiation on the Release Approval Process record.

define(['N/error', 'N/runtime'],
	function(error, runtime) {
		
		var scriptName = "SRS_CL_ReleaseApprovalProcess.";

		var REC;
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function pageInit(context) {
        	REC = context.currentRecord;

        	if (REC.id)
        		enableDisableFields(context); 
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function fieldChanged(context) {
			if (context.fieldId == "custrecord_custom_shtext_appr") {
				if (REC.getValue("custrecord_custom_shtext_appr")) {
					REC.setValue("custrecord_shtext_approved_by",runtime.getCurrentUser().id); 
					REC.setValue("custrecord_sh_lettertext_approved_time",new Date()); 					
				} else
					REC.setValue("custrecord_sh_letter_cust_text","");
				enableDisableFields(context); 
			}
			
			if (context.fieldId == "custrecord_exp_letter_text_approved") {
				if (REC.getValue("custrecord_exp_letter_text_approved")) {
					REC.setValue("custrecord_exptext_approved_by",runtime.getCurrentUser().id); 
					REC.setValue("custrecord_exp_letter_text_approved_time",new Date()); 					
				} else
					REC.setValue("custrecord_exp_letter_cust_text","");
				enableDisableFields(context); 
			}
			
		}
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function enableDisableFields(context) {
			if (REC.getValue("custrecord_custom_shtext_appr"))
				nsDisableField(context,null,"custrecord_sh_letter_cust_text",null,true);
			else
				nsDisableField(context,null,"custrecord_sh_letter_cust_text",null,false);
				
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		

		function nsDisableField(context,formId,fieldId,lineNbr,isDisabled){
			try {
				
				var fld;
				
				if (formId) {
					fld = getFormElement(document.forms[formId+"_form"],getFieldName(fieldId));
					if (fld == null)
						fld = getFormElement( document.forms[formId+'_form'], getFieldName(fieldId)+lineNbr);
				}
				else
					fld = getFormElement(document.forms["main_form"],getFieldName(fieldId));
				
				if (isSelect(fld)){
					disableSelect(fld,isDisabled);				
				} else {
				    disableField(fld,isDisabled);
				}

			} catch (e) {
				console.log("nsDisableField " + fieldId + " *ERROR* " + e);
				;
			}
			
		}
	
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
			// saveRecord: saveRecord
			};
});

