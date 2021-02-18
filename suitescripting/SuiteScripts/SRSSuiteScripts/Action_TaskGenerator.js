/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="TaskAutomation_ServerSideLibrary.js" />
/**
 * @author durbano
 */

function handleAction()
{
	nlapiLogExecution("DEBUG", "Action_TaskGenerator.handleAction", "Starting TaskGenerator Action ");
	var caseId = nlapiGetRecordId();
	nlapiLogExecution("DEBUG", "Action_TaskGenerator.handleAction", "Starting TaskGenerator Action caseId = " + caseId);
}
 
function handleRecord(caseId, actionType)
{
    var record = nlapiLoadRecord("case", caseId);

    if (record == null)                                                                     // make sure the the record/opportunity exists...
    {   var msg = Logger.FormatException(e);
        Logger.Write(Logger.LogType.Error, "handleRecord", msg);
        Messaging.SendErrorNotification("TaskAutomation_Case.js:handleRecord", msg);
    }

    var autoGenerateTasks = record.getFieldValue("custbody_auto_generate_tasks");           // make sure we should generate tasks
    if (autoGenerateTasks != "T") return;

    var currentStatus = record.getFieldValue("status");                               // the status of the opportunity

    var eventId = null;                                                                     // Search new actions for this record and return the eventId if one is found
    if (actionType == "create")
    {
        eventId = Events.searchEvents(currentStatus, Events.EventType.Create, Events.RecordType.Case);
    }
    else if (actionType == "edit")
    {
        eventId = Events.searchEvents(currentStatus, Events.EventType.Update, Events.RecordType.Case);
    }

    if (eventId == null) return;
        
    var entityId = record.getFieldValue("company");                                          // based on the event, generate the list of tasks and associate them with this case

    generateTasksByEvent(eventId, caseId, entityId, "27","29799");                           // eventId, transId, entityId, taskFormId, userId
}