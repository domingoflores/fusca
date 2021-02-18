/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="TaskAutomation_ServerSideLibrary.js" />
/**
* Company			Explore Consulting
* Copyright			2008 Explore Consulting, LLC
* Type				NetSuite Server-Side SuiteScript
* Version			1.0.0.0
* Description		Handler for Task Automation on Sales Order records.
**/


function onAfterSubmit(type)
{
    if (type != "delete")
    {
        var recordId = nlapiGetRecordId();
        if (recordId != null && type != null)
        {
            handleRecord(recordId, type);
        }
    }
}


function handleRecord(recordId, actionType)
{
    try
    {
        var record = nlapiLoadRecord("salesorder", recordId);
        if (record != null)
        {
            var autoGenerateTasks = record.getFieldValue("custbody_auto_generate_tasks");
            var recordEntity = record.getFieldValue("entity");
            var recordEntityName = record.getFieldText("entity");

            if (autoGenerateTasks == "T")
            {
                Logger.Write(Logger.LogType.Debug, "handleRecord", "Auto Generate Tasks is set true on recordId:" + recordId);

                var eventId = null;

                if (type == "create")
                {
                    //search new actions for this record
                    eventId = Events.searchEvents(false, Events.EventType.Create, Events.RecordType.Salesorder);
                }

                if (type == "edit")
                {
                    eventId = Events.searchEvents(false, Events.EventType.Update, Events.RecordType.Salesorder);
                }

                if (eventId != null)
                {
                    var recordActions = searchTasksByEvent(eventId);
                    if (recordActions != null)
                    {
                        //generate tasks
                        generateTasks(recordActions, recordEntity, recordId, recordEntityName);
                    }
                    else
                    {
                        Logger.Write(Logger.LogType.Debug, "handleRecord", "There is no actions for sales order in task configuration list.");
                    }
                }
                else
                {
                    Logger.Write(Logger.LogType.Debug, "handleRecord", "No matching events.");

                }
            }
        }
        else
        {
            throw ("Unable to load sales order record.");
        }
    }
    catch (e)
    {
        var msg = Logger.FormatException(e);
        Logger.Write(Logger.LogType.Error, "onAfterSubmit", msg);
        Messaging.SendErrorNotification("TaskAutomation_SalesOrder.js:handleRecord", msg);
    }
}