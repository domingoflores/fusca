/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="TaskAutomation_ServerSideLibrary.js" />
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSTasks.js 
* @ AUTHOR        : Daniel A. Urbano
* @ DATE          : 2010/01/06
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function validateField(type,name)
{
    if (name == 'status')
    {
        // determine if the user set the task to "Completed"
        var status = nlapiGetFieldValue('status');
        if(status != 'COMPLETE') return true;                           // short circuit if not marked Complete
        
        // if marked complete, get the count of open sub tasks
        var cnt = countOpenSubtasks(nlapiGetRecordId(), null, null);
        
        // if more than one, issue an alert and do not proceed
        if(cnt == null || cnt == 0) return true;
        
        alert("Cannot complete unless all child tasks are marked complete.");
        
        return false;
    }
    return true;
}

function runScheduled(type)
{

}

function onBeforeLoad(type, form)
{
    var currentContext = nlapiGetContext();
    //var currentUserID = currentContext.getUser();
    //if(currentUserID != "6367") return;
	
    if (currentContext.getExecutionContext() == 'userinterface' && type == 'view')
	{
		var tabName = 'time';
		var txId = nlapiGetRecordId();
		
		var searchResults = null;
	    var filters = new Array();
	    var columns = new Array();
	    
	    filters[0] = new nlobjSearchFilter('custevent_parenttask', null, 'is',  txId);                       		// setup filters
	    
	    columns[0] = new nlobjSearchColumn('internalid');                                                           // setup columns
	    columns[1] = new nlobjSearchColumn('title');
	    columns[2] = new nlobjSearchColumn('status');
	    columns[3] = new nlobjSearchColumn('memo');
		columns[4] = new nlobjSearchColumn('custevent_display_order');												// used to perform sorting below
		
	    searchResults = nlapiSearchRecord('activity', null, filters, columns);                                      // set search results
	    if(searchResults == null) return;
		searchResults.sort(sortOrder);

		// add the sub tab
		var taskSublist = form.addSubList('custpage_task_sublist','inlineeditor', 'Subtasks', tabName);
		taskSublist.addField('cust_view', 'url', 'View', null).setLinkText('View');
	    taskSublist.addField('internalid', 'text', 'ID', null);
	    taskSublist.addField('title', 'text', 'Task', null);
	    taskSublist.addField('status', 'text', 'Status', null);
	    taskSublist.addField('cust_mark', 'text', 'Mark', null);                                                    // *****
	    //taskSublist.addField('cust_na', 'text', 'N/A', null);                                                     // *****
	    taskSublist.addField('cust_note', 'text', 'Notes', null);
	    taskSublist.setLineItemValues(searchResults);                                                               // fetch results
		
	    for(var i=0 ; searchResults != null && i < searchResults.length; i++)                                       // setup view url
	    {
	        var result = searchResults[i];
	        var id = result.getId();
	        var viewUrl = nlapiResolveURL ('RECORD', result.getRecordType(), id, false);    // display the view link
	        //var viewUrl = "https://system.netsuite.com" + nlapiResolveURL ('RECORD', result.getRecordType(), id, false);    // display the view link
	        taskSublist.setLineItemValue('cust_view', i+1, viewUrl);
	            
	        var memo = result.getValue('memo');                                             // display the memo, if any
	        if( memo != null && memo.length > 90) memo = memo.substring(0,90) + "...";
	        taskSublist.setLineItemValue('cust_note', i+1, memo);

	        if(result.getValue('status') == 'Not Started' || result.getValue('status') == 'In Progress')            // *****
	        {
	            //var completeUrl = "<a target=\"server_commands\" href=\"https://system.netsuite.com/app/crm/common/crm.nl?markcomplete=T&refresh=custpage_task_sublist&id=" + id;
				var completeUrl = "<a target=\"_self\" href=\"https://system.na2.netsuite.com/app/crm/calendar/task.nl?markcomplete=T&id=" + id;
	            taskSublist.setLineItemValue('cust_mark', i+1, completeUrl + "\">Complete/NA</a>");
	            //taskSublist.setLineItemValue('cust_na', i+1, completeUrl + "&notapplicable=na\">Not Applicable</a>");
	        }
	    }
	}	
}

function onBeforeSubmit(type, form)
{

}

function onAfterSubmit(type)
{

}




















