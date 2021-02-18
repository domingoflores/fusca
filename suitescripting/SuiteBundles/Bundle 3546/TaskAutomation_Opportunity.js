/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="TaskAutomation_ServerSideLibrary.js" />
/**
* Company			Explore Consulting
* Copyright			2008 Explore Consulting, LLC
* Type				NetSuite Server-Side SuiteScript
* Version			1.0.0.0
* Description		Handler for Task Automation on opportunity records.
**/

function runScheduled(type)
{
    // get the list of opportunities with 'Auto Generate Tasks' set to true
    var context = nlapiGetContext();
    var searchresults = nlapiSearchRecord('opportunity', 'customscript_orders_to_update');
    if ( searchresults == null )
        return;
    
    // loop through the list of opportunities
    for ( var i = 0; i < searchresults.length; i++ )
    {
        var oppId = searchresults[i].getId();
        
        // for each opportunity, run the handleRecord function
        handleRecord(oppId,"create");
    
        // Set Auto Generate Tasks field to false
        // update opportunity
        nlapiSubmitField('opportunity', oppId, 'custbody_auto_generate_tasks', 'F');
    }
}

function onAfterSubmit(type)
{
    if (type != "delete")
    {
        /*var recordId = nlapiGetRecordId();
        if (recordId != null && type != null)
        {  
            handleRecord(recordId, type);
        } */
    }
}

function handleRecord(recordId, actionType)
{
    try
    {
        var record = nlapiLoadRecord("opportunity", recordId);
        if (record != null)
        {
            var autoGenerateTasks = record.getFieldValue("custbody_auto_generate_tasks");
            var currentStatus = record.getFieldValue("entitystatus");
            var recordEntity = record.getFieldValue("entity");
            var recordEntityName = record.getFieldText("entity");

            if (autoGenerateTasks == "T")
            {
                Logger.Write(Logger.LogType.Debug, "handleRecord", "Auto Generate Tasks is set true on recordId:" + recordId);

                var eventId = null;
                
                if (type == "create")
                {
                    //search new actions for this record
                    eventId = Events.searchEvents(currentStatus, Events.EventType.Create, Events.RecordType.Opportunity);
                }

                if (type == "edit")
                {
                    eventId = Events.searchEvents(currentStatus, Events.EventType.Update, Events.RecordType.Opportunity);
                }

                if (eventId != null)
                {
                    var recordActions = searchTasksByEvent(eventId);
                    if (recordActions != null)
                    {
                        //generate tasks
                        generateTasks(recordActions, recordEntity, recordId, recordEntityName, "31");

                        // formIds
                        // 31 == SRS Task Tx
                        // 16 == SRS Task Form
                        // 28 == SRS Task Deal
                    }
                    else
                    {
                        Logger.Write(Logger.LogType.Debug, "handleRecord", "There is no actions for opportunity in task configuration list.");
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
            throw ("Unable to load opportunity record.");
        }
    }
    catch (e)
    {
        var msg = Logger.FormatException(e);
        Logger.Write(Logger.LogType.Error, "onAfterSubmit", msg);
        Messaging.SendErrorNotification("TaskAutomation_Opportunity.js:handleRecord", msg);
    }
}