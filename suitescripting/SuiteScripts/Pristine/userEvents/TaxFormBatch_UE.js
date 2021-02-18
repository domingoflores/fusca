/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/error' ,'N/file' ,'N/record' ,'N/runtime' ,'N/search' 
	   ,'SuiteScripts/Pristine/libraries/TaxForm_Library.js'
	],

    function(error ,file ,record ,runtime ,search 
    		,tfLibrary
    ) {

        var scriptFileName = "TaxFormBatch_UE.js";

        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeLoad(context) {
            var scriptFunctionName = "beforeLoad";
            var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
            log.debug(scriptFullName, "UserEventType: " + context.type);
            
            if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.VIEW) {
            	var batchStatus                   = context.newRecord.getValue("custrecord_txfm_batch_status");
         	    var obj_TFB_Status_Fields         = search.lookupFields({type:"customrecord_txfm_batch_statuses" ,id:batchStatus   
                                                                     ,columns:["custrecord_batch_level_buttons" ]});

            	var objBatchLevelButtons = JSON.parse(obj_TFB_Status_Fields["custrecord_batch_level_buttons"]);
            	
            	var showButtonCancelBatch         = shouldButtonShow("cancelbatch" ,objBatchLevelButtons ,context);
            	var showButtonResetStatus         = shouldButtonShow("resetstatus" ,objBatchLevelButtons ,context);
            	            	            	
            	if (showButtonCancelBatch) {
            		context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/TaxFormBatch_CL.js';
            		context.form.addButton({ id:'custpage_button_cancel_batch' ,label:'Cancel Batch' ,functionName:'processCancelBatch()' }); 
            	}
            	if (showButtonResetStatus) {
            		context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/TaxFormBatch_CL.js';
            		context.form.addButton({ id:'custpage_button_reset_status' ,label:'Reset Batch Status' ,functionName:'processResetStatus()' }); 
            	}
    			var objUser    = runtime.getCurrentUser();
            	if (runtime.accountId != '772390' && objUser.role == 3) { // FOR TESTING PURPOSES ONLY IN SANDBOXES
            		context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/TaxFormBatch_CL.js';
            		context.form.addButton({ id:'custpage_button_processingfailed' ,label:'Set Status ProcessingFailed' ,functionName:'setStatusProcessingFailed()' }); 
            	}
            }
            
        } // beforeLoad(context)



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function shouldButtonShow(buttonid ,objBatchLevelButtons ,context){
        	
        	var showThisButton = false;
        	if (objBatchLevelButtons[buttonid]) {
        		var objSettings = objBatchLevelButtons[buttonid];
        		if (objSettings["available"]) {
        			if (objSettings["previousStatus"]) {
                		var objPreviousBatchStatus = tfLibrary.GetLastBatchStatus(context.newRecord.id);
                		for (ix in objSettings["previousStatus"]) {
                			if (objPreviousBatchStatus["value"] = objSettings["previousStatus"][ix]) {
                				showThisButton = true;
                				break;
                			}
                		}
        			}
        			else { showThisButton = true; }
        		}            		
        	}
        	return showThisButton;
        }


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return { 
                 beforeLoad: beforeLoad
        };

    });