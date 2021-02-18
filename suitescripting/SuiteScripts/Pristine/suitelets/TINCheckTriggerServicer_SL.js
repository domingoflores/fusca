/**
*@NApiVersion 2.x
*@NScriptType Suitelet
*/
define(['N/record' ,'N/runtime' ,'N/search' ,'N/task' ],
 
function(record ,runtime ,search ,task) {
 
	var scriptName = "TINCheckTriggerServicer_SL.js";

	function onRequest(context) {

		var scriptFullName = scriptName + "--->onRequest";
		log.audit(scriptFullName, "started " );
        var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});        
        scriptTask.scriptId = "customscript_tinchk_q_servicer";        
        try { var scriptTaskId = scriptTask.submit(); } catch(e) {log.error(scriptFullName, "TIN Check Queue Servicer submit failed " );}
			
        context.response.write('OK');
		
	} //function onRequest



return { onRequest: onRequest };
});