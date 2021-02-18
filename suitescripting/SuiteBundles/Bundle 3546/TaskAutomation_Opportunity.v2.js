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
        
        nlapiLogExecution("DEBUG", "TaskAutomation_Opportunity.v2.runScheduled", "Opportunity id:" + oppId);
        
        // for each opportunity, run the handleRecord function
        handleRecord(oppId,"create");
    
        // Set Auto Generate Tasks field to false and update opportunity
        nlapiSubmitField("opportunity", oppId, "custbody_auto_generate_tasks", "F");
    }
}

function onBeforeLoad(type, form)
{
    var currentContext = nlapiGetContext();
    //var currentUserID = currentContext.getUser();
    //if(currentUserID != "6367") return;
    
    if( currentContext.getExecutionContext() == 'userinterface' && type == 'view')
    {   // other types of sublists are editor, inlineeditor, list, and staticlist.
        addTaskSublistTab('general',nlapiGetRecordId(),'opportunity');
        /*var taskSublist = form.addSubList('custpage_task_sublist','inlineeditor', 'Tasks', 'general');    // Create the Sublist of tasks, add it to the general tab, renamed to 'Main'
        
        taskSublist.addField('cust_view', 'url', 'View', null).setLinkText('View');
        taskSublist.addField('internalid', 'text', 'ID', null);
        taskSublist.addField('title', 'text', 'Task', null);
        taskSublist.addField('status', 'text', 'Status', null);
        taskSublist.addField('cust_mark', 'text', 'Mark', null);                                                    // *****
        //taskSublist.addField('cust_na', 'text', 'N/A', null);                                                       // *****
        taskSublist.addField('cust_note', 'text', 'Note', null);
        taskSublist.addField('cust_open_sub_tasks', 'text', 'Open Sub Tasks', null);
        
        var searchResults = null;
        var filters = new Array();
        var columns = new Array();
        
        filters[0] = new nlobjSearchFilter('custevent_parenttask', null, 'is',  '@NONE@');                          // setup filters
        filters[1] = new nlobjSearchFilter('internalid', 'opportunity', 'is',  nlapiGetRecordId());
        
        columns[0] = new nlobjSearchColumn('internalid');                                                           // setup columns
        columns[1] = new nlobjSearchColumn('title');
        columns[2] = new nlobjSearchColumn('status');
        columns[3] = new nlobjSearchColumn('memo');
        
        searchResults = nlapiSearchRecord('activity', null, filters, columns);                                      // set search results
        taskSublist.setLineItemValues(searchResults);                                                               // fetch results
                
        for(var i=0 ; searchResults != null && i < searchResults.length; i++)                                       // setup view url
        {
            var result = searchResults[i];
            var id = result.getId(); 
            var viewUrl = "https://system.netsuite.com" + nlapiResolveURL ('RECORD', result.getRecordType(), id, false);    // display the view link
            taskSublist.setLineItemValue('cust_view', i+1, viewUrl);
            
            var memo = result.getValue('memo');                                             // display the memo, if any
            if( memo != null && memo.length > 90) memo = memo.substring(0,90) + "...";
            taskSublist.setLineItemValue('cust_note', i+1, memo);
            
            // get count of sub tasks
            var subCount = countOpenSubtasks(id,nlapiGetRecordId(),'opportunity');
            if( subCount != null && subCount > 0) taskSublist.setLineItemValue('cust_open_sub_tasks', i+1, subCount);               // we only want to display anything if greater than 0.

            if(subCount == 0 && (result.getValue('status') == 'Not Started' || result.getValue('status') == 'In Progress'))            // *****
            {
                var completeUrl = "<a target=\"server_commands\" href=\"https://system.netsuite.com/app/crm/common/crm.nl?markcomplete=T&refresh=custpage_task_sublist&id=" + id;
                taskSublist.setLineItemValue('cust_mark', i+1, completeUrl + "\">Complete/NA</a>");
                //taskSublist.setLineItemValue('cust_na', i+1, completeUrl + "&notapplicable=na\">Not Applicable</a>");
            }
        }*/
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

    generateTasksByEvent(eventId, oppId, entityId, "31");                                   // eventId, transId, entityId, taskFormId
    // formIds
    // 31 == SRS Task Tx
    // 16 == SRS Task Form
    // 28 == SRS Task Deal
}



























