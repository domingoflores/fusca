/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/runtime", 
        "/SuiteScripts/Pristine/libraries/toolsLibrary.js"
    	   ],

function(runtime, tools) {
   
	var scriptName = "SRS_UE_RequestInputDetail2.0.";
	   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) 
    {
    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
    	log.debug("funcName", funcName);
    	
    	var objPermissionList = {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"};
		var hasAccess = tools.checkPermission(objPermissionList);
		if (!hasAccess) { 	throw 'PERMISSION_DENIED: You do not have permissions to access CRE Request Input Detail. Please contact your NetSuite administration if you believe this is in error.'; }		
		
    }

    
    return {
        beforeLoad: beforeLoad
//        ,beforeSubmit: beforeSubmit,
//        afterSubmit: afterSubmit
    };
    
});
