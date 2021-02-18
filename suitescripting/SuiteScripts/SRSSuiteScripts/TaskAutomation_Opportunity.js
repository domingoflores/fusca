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
    // get the list of opportunities where 'Auto Generate Tasks' set to true
    var context = nlapiGetContext();

    var searchresults = nlapiSearchRecord("opportunity", "customsearch_opps_awaiting_tasks");
    if ( searchresults == null ) return;
    
    // loop through the list of opportunities
    for ( var i = 0; i < searchresults.length; i++ )
    {
        var oppId = searchresults[i].getId();
        
        nlapiLogExecution("DEBUG", "TaskAutomation_Opportunity.runScheduled", "Opportunity id:" + oppId);
        
        // for each opportunity, run the handleRecord function
        handleRecord(oppId,"create");
    
        // Set Auto Generate Tasks field to false and update opportunity
        nlapiSubmitField("opportunity", oppId, "custbody_auto_generate_tasks", "F");
    }
}

function onBeforeLoad(type, form)
{
    var context = nlapiGetContext();
    
    if( context.getExecutionContext() == 'userinterface' && type == 'view')
    {   // other types of sublists are editor, inlineeditor, list, and staticlist.
		//var currentUserID = context.getUser();
	    //if(currentUserID != "6367") return;
        addTaskSublistTab('general',nlapiGetRecordId(),'opportunity');
    }

	if( context.getExecutionContext() == 'userinterface' && type == 'create')
	{
		// add default $1.00 item
		nlapiSelectNewLineItem('item');
		nlapiSetCurrentLineItemValue('item','item', '4', true, true);
		nlapiSetCurrentLineItemValue('item','description','SRS Engagement Fee', true, true);
		nlapiSetCurrentLineItemValue('item','amount','1.00', true, true);
		nlapiCommitLineItem('item');
	}
}

function onBeforeSubmit(type)
{
    if (type == "create")
    {
        var currentRecord = nlapiGetNewRecord();                                            // get the current record
        currentRecord.setFieldValue('custbody_auto_generate_tasks','T');                    // set 'Auto Generate Tasks' to Yes
    }
}

function onAfterSubmit(type)
{
    if (type != "delete")
    {
        /*
        var recordId = nlapiGetRecordId();
        if (recordId != null && type != null)
        {  
            handleRecord(recordId, type);
        }
        */
    }
}

function handleRecord(oppId, actionType)
{
    var record = nlapiLoadRecord("opportunity", oppId);

    if (record == null)                                                                     // make sure the the record/opportunity exists...
    {   var msg = Logger.FormatException(e);
        Logger.Write(Logger.LogType.Error, "handleRecord", msg);
        Messaging.SendErrorNotification("TaskAutomation_Opportunity.js:handleRecord", msg);
    }

    var autoGenerateTasks = record.getFieldValue("custbody_auto_generate_tasks");           // make sure we should generate tasks
    if (autoGenerateTasks != "T") return;

    var currentStatus = record.getFieldValue("entitystatus");                               // the status of the opportunity

    var eventId = null;                                                                     // Search new actions for this record and return the eventId if one is found
    if (actionType == "create")
    {
        eventId = Events.searchEvents(currentStatus, Events.EventType.Create, Events.RecordType.Opportunity);
    }
    else if (actionType == "edit")
    {
        eventId = Events.searchEvents(currentStatus, Events.EventType.Update, Events.RecordType.Opportunity);
    }

    if (eventId == null) return;
        
    var entityId = record.getFieldValue("entity");                                          // based on the event, generate the list of tasks and associate them with this opportunity
    //var entityName = record.getFieldText("entity");

    generateTasksByEvent(eventId, oppId, entityId, "31","29799");                           // eventId, transId, entityId, taskFormId, userId
    // formIds
    // 31 == SRS Task Tx
    // 16 == SRS Task Form
    // 28 == SRS Task Deal
}


























