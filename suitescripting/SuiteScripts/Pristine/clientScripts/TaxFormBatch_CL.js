/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime' ,'N/currentRecord' ,'N/log' ,'N/ui/dialog' ,'N/ui/message' ,'N/record' ,'N/search' ,'N/url' ,'N/https'
	   ,'SuiteScripts/Pristine/libraries/TaxForm_Library.js'
	],

	function(runtime ,currentRecord ,log ,dialog ,msg ,record ,search ,url ,https
    		,tfLibrary
		) {

		var scriptName = "TaxFormBatch_CL.js";

		
		function pageInit(context) {
			var funcName = scriptName + '-->pageInit';
			console.log(funcName);

		}
		

		//=======================================================================================================================================
		// This function is only for testing purposes in the sandboxes
		//=======================================================================================================================================
		function setStatusProcessingFailed() {
			if (runtime.accountId != '772390') {
	          	var currentRec = currentRecord.get();
	    		var objValues = {};
	    		objValues["custrecord_txfm_batch_status"]          = "10";     
	    		record.submitFields({ type:"customrecord_tax_form_batch" ,id:currentRec.id ,values:objValues });
	    		objValues["custrecord_txfm_batch_status"]          = "9";     
	    		record.submitFields({ type:"customrecord_tax_form_batch" ,id:currentRec.id ,values:objValues });
	          	location.reload();
			}
        }
		

		//=======================================================================================================================================
		// This function is invoked when the "Reset Batch Sttaus" button is pressed
		//=======================================================================================================================================
		function processResetStatus() {
			var funcName = "processResetStatus";
			var currentRec = currentRecord.get();
    		var objPreviousBatchStatus = tfLibrary.GetLastBatchStatus(currentRec.id);
			
    		try {
    		    tfLibrary.taxFormBatchUpdateStatistics(currentRec.id); 
    		    
    		    var objValues = {};
    		    objValues["custrecord_txfm_batch_status"]          = objPreviousBatchStatus["value"];		    
    		    record.submitFields({ type:"customrecord_tax_form_batch" ,id:currentRec.id ,values:objValues });
    		    
    		    location.reload();
    		}
    		catch(e) {
    			log.debug(funcName ,"Exception: " + JSON.stringify(e));
				completedMsg = msg.create({ title:"Request Failed" ,message:"Your 'Reset Batch Status' request has failed with the error: " + e.message ,type:msg.Type.ERROR });
				completedMsg.show();
    		}
		}
		

		//=======================================================================================================================================
		// This function is invoked when the "Cancel Batch" button is pressed
		//=======================================================================================================================================
		var submitttedMsg;
		function processCancelBatch() {
			var funcName = "processCancelBatch";
			var response = window.prompt("Please enter 'yes' and press enter to CONFIRM that you intend cancel this batch","").trim().toLowerCase();

			if (response == "yes") {
				try {document.getElementById("tr_custpage_button_cancel_batch").style.display = "none";}catch(e){}
				var currentRec = currentRecord.get();

				try {
					var objRequest = { TaxFormBatchId:currentRec.id ,user:runtime.getCurrentUser().id };
					
		    		var objParms = {};
		    		objParms["action"]        = "mapReduceUtilityFunctionsStart";
		    		objParms["objRequest"]    = JSON.stringify(objRequest);
		    		objParms["functionName"]  = "cancel_TaxFormBatch_atp2063";
		    		objParms["scriptName"]    = scriptName;
		    		objParms["recordType"]    = "customrecord_tax_form_batch_detail";
		    					
		    		var suitletURL         = url.resolveScript({ scriptId:'customscript_utility_sl' ,deploymentId:'customdeploy_utility_sl' ,params:objParms ,returnExternalUrl:false});

		    		var objHeader          = {};
		    		var body               = JSON.stringify({});
		    		var response           = https.post({ url:suitletURL ,headers:objHeader ,body:body });				

		    		var body = response.body;
		    		var objResponse = JSON.parse(response.body);
				
					submitttedMsg = msg.create({ title:"Request Submitted" ,message:"Your request has been submitted for background processing, please wait." ,type:msg.Type.INFORMATION });
					submitttedMsg.show();
					
		        	intervalTaskChecker = setInterval(taskChecker, 6000);

					var i = 0;
		        	function taskChecker() {
			    		var objParms = {};
			    		objParms["action"]     = "mapReduceTaskStatus";
			    		objParms["taskID"]     = objResponse.mapReduceTaskId;
			    		var suitletURL         = url.resolveScript({ scriptId:'customscript_utility_sl' ,deploymentId:'customdeploy_utility_sl' ,params:objParms ,returnExternalUrl:false});

			    		var objHeader          = {};
			    		var body               = JSON.stringify({});
			    		var response           = https.post({ url:suitletURL ,headers:objHeader ,body:body });	
			    		i = i + 1;
			    		if (response.body == "COMPLETE" || response.body == "FAILED" ) { 
			    			clearInterval(intervalTaskChecker);
							submitttedMsg.hide(0);
							completedMsg = msg.create({ title:"Request Submitted" ,message:"Your Cancel Batch request has finished processing with status: " + response.body ,type:msg.Type.CONFIRMATION });
							completedMsg.show();
			    		} 
			    	}
				}
				catch(e) {
					var funcName = scriptName + "-->processCancelBatch";
					log.error(funcName ,"An exception occurred when a user attempted to cancel a Tax Form Batch: " + JSON.stringify(e) );
					console.log("An exception occurred when a user attempted to cancel a Tax Form Batch: " + JSON.stringify(e) );
					alert("An error has occurred in the attempt to submit your request, please try again. If the problem persists contact support.");
					return;
				}
				
				var taxFormBatchStatus_CancelInProgress = 11;
			    var objValues = {};
			    objValues["custrecord_txfm_batch_status"]        = taxFormBatchStatus_CancelInProgress; 
			    record.submitFields({ type:"customrecord_tax_form_batch" ,id:currentRec.id ,values:objValues });
			}		


		}

		return {
			           pageInit: pageInit
			,processCancelBatch: processCancelBatch
			,processResetStatus: processResetStatus
			,setStatusProcessingFailed: setStatusProcessingFailed
		};
	});