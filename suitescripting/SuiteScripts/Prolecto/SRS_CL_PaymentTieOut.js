
/**
	 *@NApiVersion 2.x
	 *@NScriptType ClientScript
 */

	define(['N/runtime', 'N/ui/message', 'N/ui/dialog' ,'N/currentRecord' ,'N/record' ,'N/https' ,'N/url', "N/search"],

		function(runtime, message, dialog,currentRecord, record, https, url, search) {
			
			//======================================================================================================================
			//======================================================================================================================

			function fieldChanged(context) {
				
				if (context.fieldId == "custrecord_pto_other_charges") {
					if (context.currentRecord.getValue("custrecord_pto_other_charges")) {
						context.currentRecord.setValue("custrecord_pto_other_charges_user", runtime.getCurrentUser().id);
						context.currentRecord.setValue("custrecord_pto_other_charges_date", new Date());						
					} else {
						context.currentRecord.setValue("custrecord_pto_other_charges_user", "");
						context.currentRecord.setValue("custrecord_pto_other_charges_date", "");												
					}
					
				}
				
				if (context.fieldId == "custrecord_pto_other_charges_approved") {
					if (context.currentRecord.getValue("custrecord_pto_other_charges_approved")) {
						console.log("  - setting"); 
						context.currentRecord.setValue("custrecord_pto_other_mgr_approval", runtime.getCurrentUser().id);
						context.currentRecord.setValue("custrecord_pto_other_chg_approval_date", new Date());
					} else {
						context.currentRecord.setValue("custrecord_pto_other_mgr_approval", "");
						context.currentRecord.setValue("custrecord_pto_other_chg_approval_date", "");					
					}
					
				} 

			}
									
			//======================================================================================================================
			//======================================================================================================================

			return {
				fieldChanged: fieldChanged
			};
		});