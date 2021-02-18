/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/redirect", "N/runtime",'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	,'/.bundle/132118/PRI_ShowMessageInUI'
	],

function(redirect, runtime, tools, priMessage) {
	
	 var scriptFileName = "PRIAppSetting_UE.js";
     var scriptFullName = scriptFileName;
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
     function beforeLoad(context) {
     	var scriptFunctionName = "beforeLoad";
     	scriptFullName = scriptFileName + "--->" + scriptFunctionName;
     	log.debug("runtime.executionContext1", runtime.executionContext);
     	if (runtime.executionContext == runtime.ContextType.USER_INTERFACE)
     	{
     		if (context.type == context.UserEventType.VIEW)
     		{
     			priMessage.showPreparedMessage(context);
     		}
     		log.debug("context.type", context.type);
	     	if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) 
	     	{
	     		
	     		var objPermissionList = [{"appName":"General Settings" ,"settingName":"PRI App Setting/List Access Permission"} ];
	     		var hasAccess = tools.checkPermission(objPermissionList);
	     		log.debug("hasAccess", hasAccess);
	     		if (!hasAccess) 
	     		{ 	
	     			
	     			priMessage.prepareMessage("PERMISSION DENIED", "You do not have permissions to access the PRI App Setting. Please contact your NetSuite administration if this is an error.", priMessage.TYPE.ERROR);
	     			var parameters = {};
	     			redirect.toRecord({ type:"customrecord_pri_app_setting" ,id:context.newRecord.id ,parameters:parameters }); 
	     		}
	     	}
     	}
     	else if (runtime.executionContext == runtime.ContextType.CSV_IMPORT)
     	{
     		throw ("You do not have permissions to access the PRI App Setting. Please contact your NetSuite administration if this is an error.");
 		}
     }
     
     function beforeSubmit(context) {
    	 if (context.type == context.UserEventType.XEDIT) 
	     	{
    		 var objPermissionList = [{"appName":"General Settings" ,"settingName":"PRI App Setting/List Access Permission"} ];
	     		var hasAccess = tools.checkPermission(objPermissionList);
	     		log.debug("hasAccess", hasAccess);
	     		if (!hasAccess) 
	     		{
	     			throw ("You do not have permissions to access the PRI App Setting. Please contact your NetSuite administration if this is an error.");
	     		}
	     	}
    	 
     }

   return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
       };
    
});
