/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/format' ,'N/runtime' ,'N/currentRecord' ,'N/ui/message'
        ],

	function(format ,runtime ,currentRecord ,msg
	        ) {

		var scriptName = "TaxFormBatchDetail_CL.js";
		
		//=====================================================================================================
		//=====================================================================================================
		function saveRecord(context) {

			var rcd = context.currentRecord;
			
			var glAccount = rcd.getValue("custpage_glaccount");
			var currency = rcd.getValue("custpage_currency");
        	var txfm_detail_version_corrected = 3;
        	var txfm_detail_version  = rcd.getValue({ fieldId: 'custrecord_txfm_detail_version' });
        	if (txfm_detail_version == txfm_detail_version_corrected) {
        		if ( !rcd.getValue({ fieldId: 'custrecord_txfm_detail_correction_type' }) ) { 
    				showErrorMessage("Correction Type is required", "Correction Type is required when 'Tax Form Type' is 'Corrected'");
    				return false;
        		}
        	} 

			return true;
		}
		
		//=====================================================================================================
		//=====================================================================================================
		function showErrorMessage(msgTitle, msgText) {
			var myMsg = msg.create({ title:msgTitle ,message: msgText ,type: msg.Type.ERROR });
			myMsg.show({ duration:9900 });
            window.scrollTo(0, 0);
		}

		
		
		return {
			             saveRecord: saveRecord
		};
	});