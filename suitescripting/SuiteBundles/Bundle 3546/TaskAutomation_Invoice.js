/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="TaskAutomation_ServerSideLibrary.js" />
/**
* Company			Explore Consulting
* Copyright			2008 Explore Consulting, LLC
* Type				NetSuite Server-Side SuiteScript
* Version			1.0.0.0
* Description		Handler for Task Automation on invoice records.
**/

function runScheduled(type)
{
    // get the list of opportunities where 'Auto Generate Tasks' set to true
    var context = nlapiGetContext();
    var searchresults = nlapiSearchRecord("transaction", "customsearch_invoices_waiting_tasks");
    if ( searchresults == null ) return;
    
    // loop through the list of opportunities
    for ( var i = 0; i < searchresults.length; i++ )
    {
        var invId = searchresults[i].getId();
        
        nlapiLogExecution("DEBUG", "TaskAutomation_Invoice.v2.runScheduled", "Invoice/transaction id:" + invId);
        
        // for each opportunity, run the handleRecord function
        handleRecord(invId,"create");
    
        // Set Auto Generate Tasks field to false and update opportunity
        nlapiSubmitField("invoice", invId, "custbody_auto_generate_tasks", "F");
    }
}

function onBeforeSubmit(type)
{
    if (type != "create")
    {
        
    }
}

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
    var record = nlapiLoadRecord("invoice", recordId);

    if (record == null)                                                                     // make sure the the record/opportunity exists...
    {   var msg = Logger.FormatException(e);
        Logger.Write(Logger.LogType.Error, "handleRecord", msg);
        Messaging.SendErrorNotification("TaskAutomation_Opportunity.js:handleRecord", msg);
    }

    var autoGenerateTasks = record.getFieldValue("custbody_auto_generate_tasks");           // make sure we should generate tasks
    if (autoGenerateTasks != "T") return;

    var eventId = null;                                                                     // Search new actions for this record and return the eventId if one is found
    if (actionType == "create")
    {
        eventId = Events.searchEvents(false, Events.EventType.Create, Events.RecordType.Invoice);
    }
    else if (actionType == "edit")
    {
        eventId = Events.searchEvents(false, Events.EventType.Update, Events.RecordType.Invoice);
    }

    if (eventId == null) return;
        
    var entityId = record.getFieldValue("entity");                                          // based on the event, generate the list of tasks and associate them with this opportunity

    generateTasksByEvent(eventId, recordId, entityId, "31");                                   // eventId, transId, entityId, taskFormId
    // formIds
    // 31 == SRS Task Tx
    // 16 == SRS Task Form
    // 28 == SRS Task Deal

    // Set Auto Generate Tasks field to false and update opportunity
    nlapiSubmitField("invoice", recordId, "custbody_auto_generate_tasks", "F");
}



