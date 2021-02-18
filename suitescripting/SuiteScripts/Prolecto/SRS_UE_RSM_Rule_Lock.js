/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/log","N/record","N/search", "N/runtime", "N/ui/serverWidget"
    , "/.bundle/132118/PRI_AS_Engine","/.bundle/132118/PRI_ServerLibrary", './Shared/SRS_Constants'],
    function(log,record,search,runtime, serverWidget, appSetting, priLibrary, srsConstants) {
        var scriptName = "SRS_UE_RSM_Rule_Lock.";
        function userIsAuthorizedToEdit(allowInternalIDlist) 
        {
            if (runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR)
            {
               	return true;
            }
          	if (!Array.isArray(allowInternalIDlist))
            {
               log.error("JSON Object does not have allowEditInternalIDList array defined");
               return false;
            }
            return (allowInternalIDlist.indexOf(runtime.getCurrentUser().id)>= 0);
        }
        
        
        function beforeSubmit(context) {
            var funcName = scriptName + "beforeSubmit";
            log.debug("starting: ", funcName);
            var i = 0;
            var f = null;
            //test record situation where we will perform lock
             //hard code the roles that will not get locked down
            var jsonSetting = appSetting.readAppSetting("RSM", "Allow Edit List");
            if (jsonSetting)
            {
                jsonSetting = JSON.parse(jsonSetting);
            }
            else
            {
                throw "App Setting RSM: Allow Edit List not found";
            }
            if (!userIsAuthorizedToEdit(jsonSetting.allowEditInternalIDList))
            {
                log.debug(runtime.getCurrentUser().id + " is not permitted to edit this record ", "");
                throw "User " + runtime.getCurrentUser().id + " is not allowed to edit this record.";
            }
        }
        function beforeLoad(context) {
            var funcName = scriptName + "beforeLoad";
            log.debug("starting ", funcName);
            var i = 0;
            var f = null;
            //test record situation where we will perform lock
             //hard code the roles that will not get locked down
            var jsonSetting = appSetting.readAppSetting("RSM", "Allow Edit List");
            if (jsonSetting)
            {
                jsonSetting = JSON.parse(jsonSetting);
            }
            else
            {
                throw "Unexpected error: App Setting RSM: Allow Edit List not found";
            }
            if (!userIsAuthorizedToEdit(jsonSetting.allowEditInternalIDList))
            {
                log.debug(runtime.getCurrentUser().id + " is not permitted to edit this record ", "");
                priLibrary.preventEdit(context, false, "You are not permitted to edit this record.");
                return;
            }
        }
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        }
    }
);