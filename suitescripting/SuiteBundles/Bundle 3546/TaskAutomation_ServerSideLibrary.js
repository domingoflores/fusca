/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />

var Settings =
{
	ErrorNotification:
    {
	    From: "6367" //internal id of employee
		, To: "durbano@shareholderrep.com"

    },
	TaskNotifications:
    {
    	From: "6367" //internal id of employee.
		, Subject: "New Tasks Assigned"
    }
}

var Events =
{
    EventType:
	{
	    Create: "1"
		, Update: "2"
	},
    RecordType:
	{
	    Opportunity: "1"
		, Salesorder: "2"
		, Invoice: "3"
	}, //search custom actions for opportunity
    searchEvents: function(currentStatus, eventType, recordType)
    {
        /// <summary>Return event id</summary>
        /// <param name="currentStatus" type="string">Status of record(false) if record doesnt have status.</param>
        /// <param name="eventType" type="Events.EventType">Event type</param>
        /// <param name="recordType" type="Events.RecordType">Record type</param>
        var filters = new Array();
        filters.push(new nlobjSearchFilter("custrecord_action", null, "is", eventType));
        filters.push(new nlobjSearchFilter("custrecord_record_name", null, "is", recordType));

        var columns = new Array();
        columns.push(new nlobjSearchColumn("custrecord_record_status"));

        var results = nlapiSearchRecord("customrecord_event_configuration", null, filters, columns);

        if (currentStatus != false)
        {
            for (var x in results)
            {
                var eventStatus = results[x].getText("custrecord_record_status");
                if (eventStatus != null)
                {

                    var status = eventStatus.split(":");
                     nlapiLogExecution("DEBUG", "Events.searchEvents", "Status=" + status[0] + " currentStatus=" + currentStatus);
                    if (status[0] == currentStatus)
                    {
                        nlapiLogExecution("DEBUG", "Events.searchEvents", "Returning event id:" + results[x].getId());
                        return results[x].getId();
                    }
                }
            }
        }
        else
        {
            if (results != null)
            {
                nlapiLogExecution("DEBUG", "Events.searchEvents", "Returning event id:" + results[0].getId());
                return results[0].getId();
            }
        }
        return null;
    }
}

var Assignee =
{
    PickMode:
	{
	    Random: "RANDOM"
		, Roundrobin: "ROUNDROBIN" //NOT SUPPORTED
	},
    Pick: function(pickmode, searchid)
    {
        /// <summary>Picks assignee from saved search</summary>
        /// <param name="pickmode" type="Assignee.PickMode">Pick Mode</param>
        /// <param name="searchid" type="string"></param>

        if (pickmode == "RANDOM")
        {
            if (searchid != null && searchid != "")
            {
                var employeeList = getUserList(searchid);
                if (employeeList != null)
                {
                    var numberOfEmployees = employeeList.length;
                    var randomnumber = Math.floor(Math.random() * numberOfEmployees);
                    var randomEmployee = employeeList[randomnumber].getId();
                    return randomEmployee;
                }
                else
                {
                    nlapiLogExecution("ERROR", "Assignee.Pick", "Employee search doesnt return any results");
                }
            }
            return null;
        }
    }
}

//search assignee list based on search id
function getUserList(searchId)
{
    return nlapiSearchRecord("employee", searchId, null, null);
}

//function to generate tasks
function generateTasksByEvent(eventId, transId, entityId, taskFormId)
{
    
    var createdTasks = new Array();
    var parentTasks = searchParentTasksByEvent(eventId);                                        // get the list of tasks with no parent

    for (var t in parentTasks)
	{
        var taskConfigId = parentTasks[t].getId();                                              // 6367 == Dan Urbano, create tasks, and assign
        var taskInfo = createTask(taskConfigId, "6367", entityId, transId, null, taskFormId);   // taskConfigRecordID, assignee, oppEntity, oppTranid, parentTaskId, formId
        
        if (taskInfo != null) createdTasks.push(taskInfo);

        var childTasks = searchTasksByEventAndParent(eventId, taskConfigId);                    // eventId, parentId, get all children tasks
        for (var c in childTasks)                                                               // iterate through and generate tasks
        {
            var childTaskConfigId = childTasks[c].getId();
            var childTaskInfo = createTask(childTaskConfigId, "6367", entityId, transId, taskInfo.taskId, taskFormId)
            
            if (childTaskInfo != null) createdTasks.push(childTaskInfo);
        }
    }
}

//function to generate tasks
function generateTasks(recordActions, recordEntity, recordId, recordEntityName)
{
    generateTasks(recordActions, recordEntity, recordId, recordEntityName, null);
}

//function to generate tasks
function generateTasks(recordActions, recordEntity, recordId, recordEntityName, formId)
{
	var selectedAssignee = buildAssigneeArray(recordActions);
	var createdTasks = new Array();
    var tasksByConfigIdMap = new Object();

	for (var t in recordActions)
	{
		var currentAssigneeSearch = recordActions[t].getValue("custrecord_assignee_list_id");
		var assigneeForTask = null;
		for (var a in selectedAssignee)
		{
			if (currentAssigneeSearch == selectedAssignee[a].search)
			{
				assigneeForTask = selectedAssignee[a].id;
				break;
			}
		}

		if (assigneeForTask != null)
		{
			var taskInformation = createTask(recordActions[t].getId(), assigneeForTask, recordEntity, recordId, parentTaskId, formId);
			if (taskInformation != null)
			{
				createdTasks.push(taskInformation); //add information about created task into array
                tasksByConfigIdMap[taskInformation.taskConfigId] = taskInformation;
			}
		}
	}

	//send notifications to employees
	if (createdTasks.length > 0)
	{
		sendNotifications(createdTasks, recordEntityName);
	}
}


//return array of searches and assignees
function buildAssigneeArray(recordActions)
{
    //array with employees, one per search
    var selectedAssignee = new Array();

    //choose assignee
    for (var i in recordActions)
    {
        var currentAssigneeSearch = recordActions[i].getValue("custrecord_assignee_list_id");

        //add first assignee
        if (i == 0)
        {
            var assignee = new Object();
            assignee.id = Assignee.Pick(Assignee.PickMode.Random, currentAssigneeSearch);
            assignee.search = currentAssigneeSearch;
            selectedAssignee.push(assignee);
        }

        var needAssignee = true;

        //add only assignee with different searches
        if (selectedAssignee.length > 0)
        {
            for (var x in selectedAssignee)
            {
                if (selectedAssignee[x].search == currentAssigneeSearch)
                {
                    needAssignee = false;
                    break;
                }
            }

            if (needAssignee == true)
            {
                var assignee = new Object();
                assignee.id = Assignee.Pick(Assignee.PickMode.Random, currentAssigneeSearch);
                assignee.search = currentAssigneeSearch;
                selectedAssignee.push(assignee);
            }
        }
    }
    return selectedAssignee;
}

//function to create task
function createTask(taskConfigRecordID, assignee, oppEntity, oppTranid, parentTaskId)
{
    return createTask(taskConfigRecordID, assignee, oppEntity, oppTranid, parentTaskId, null);
}

//function to create task
function createTask(taskConfigRecordID, assignee, oppEntity, oppTranid, parentTaskId, formId)
{
    var taskConfigRecord = nlapiLoadRecord("customrecord_task_configuration", taskConfigRecordID);
    if (taskConfigRecord != null)
    {
        newTask = nlapiCreateRecord("task");
        newTask.setFieldValue("title", taskConfigRecord.getFieldValue("custrecord_title"));
        newTask.setFieldValue("assigned", assignee);
        //figure out start date
        var newStartDate = new Date();
        nlapiAddDays(newStartDate, taskConfigRecord.getFieldValue("custrecord_start_date_offset"));
        newTask.setFieldValue("startdate", nlapiDateToString(newStartDate));
        //figure out due date
        var newDueDate = new Date();
        nlapiAddDays(newDueDate, taskConfigRecord.getFieldValue("custrecord_due_date_offset"));
        newTask.setFieldValue("duedate", nlapiDateToString(newDueDate));
        //figure out priority
        newTask.setFieldValue("priority", taskConfigRecord.getFieldValue("custrecord_priority").toUpperCase());
        //figure out status
        newTask.setFieldValue("status", getStatus(taskConfigRecord.getFieldValue("custrecord_status")));
        // figure out category
        newTask.setFieldValue("custevent_task_category", taskConfigRecord.getFieldValue("custrecord_category"));
        newTask.setFieldValue("company", oppEntity);
        newTask.setFieldValue("transaction", oppTranid);
        newTask.setFieldValue("custevent30", taskConfigRecord.getFieldValue("custrecord_notes"));
        
        if(parentTaskId != null)
        {
            newTask.setFieldValue("custevent_parenttask", parentTaskId);
        }
        
        if(formId != null)
        {
            newTask.setFieldValue("customform", formId);
        }
          
        var id = nlapiSubmitRecord(newTask, true, true);
        nlapiLogExecution("DEBUG", "createTask", "New task with id " + id + " was created.");
        
        // TEMPORARY...
        var tmp = nlapiLoadRecord("task", id);
        var tmpFormId = tmp.getFieldValue("customform");
        nlapiLogExecution("DEBUG", "createTask", "form with " + id + " was created");
        // END TEMPORARY

        if (id != null)
        {
        	var taskInformation = new taskInfo();
        	taskInformation.taskId = id;
        	taskInformation.taskTitle = taskConfigRecord.getFieldValue("custrecord_title");
        	taskInformation.taskAssignee = assignee;
        	taskInformation.taskSendEmail = taskConfigRecord.getFieldValue("custrecord_send_email");
            taskInformation.taskConfigId = taskConfigRecord.getFieldValue("internalid");
            taskInformation.taskConfigParentId = taskConfigRecord.getFieldValue("custrecord_parenttask"); // the parent task's ID
        	return taskInformation;
        }
        return null;              
    }
    else
    {
    	nlapiLogExecution("ERROR", "createTask", "Unable to load task configuration record. taskConfigRecordId=" + taskConfigRecordID);
    	return null;
    }
}

function getStatus(status)
{
    status = status.toLowerCase();
    switch(status)
    {
        case "not started":
            return "NOTSTART";
            break;
        case "completed":
            return "COMPLETE";
            break;
        case "in progress":
            return "PROGRESS";
            break;
        default:
            return null;    
    }
}

//return list of actions
function searchTasksByEvent(eventId)
{
	var filters = new Array();
	filters.push(new nlobjSearchFilter("custrecord_event", null, "is", eventId));

	var columns = new Array();
	columns.push(new nlobjSearchColumn("custrecord_assignee_list_id"));

	return nlapiSearchRecord("customrecord_task_configuration", null, filters, columns);
}

//return list of actions
function searchParentTasksByEvent(eventId)
{
	var filters = new Array();
	filters.push(new nlobjSearchFilter("custrecord_event", null, "is", eventId));
	filters.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
    filters.push(new nlobjSearchFilter("custrecord_parenttask", null, "is", "@NONE@"));

	var columns = new Array();
    // taskConfigId
	columns.push(new nlobjSearchColumn("custrecord_title"));

	return nlapiSearchRecord("customrecord_task_configuration", null, filters, columns);
}

//return list of actions
function searchTasksByEventAndParent(eventId,parentId)
{
	var filters = new Array();
	filters.push(new nlobjSearchFilter("custrecord_event", null, "is", eventId));
    filters.push(new nlobjSearchFilter("custrecord_parenttask", null, "is", parentId));

	var columns = new Array();
    // taskConfigId
	columns.push(new nlobjSearchColumn("custrecord_title"));

	return nlapiSearchRecord("customrecord_task_configuration", null, filters, columns);
}

//object to store task information
function taskInfo()
{
	this.taskId = null;
	this.taskTitle = null;
	this.taskAssignee = null;
	this.taskSendEmail = null;
    this.taskConfigId = null;
    this.taskConfigParentId = null;
}

//object to store all tasks of same employee
function assigneeTasks()
{
	this.assigneeId = null;
	this.assigneeTasks = new Array();
}

//function to send email notifications about new tasks
function sendNotifications(createdTasks, recordEntityName)
{
	var employeeTasks = new Array();
	//loop through all created tasks
	for (var x in createdTasks)
	{
		var newEmployeeTask = new assigneeTasks();
		newEmployeeTask.assigneeId = createdTasks[x].taskAssignee;
		newEmployeeTask.assigneeTasks.push(createdTasks[x]);

		if (createdTasks[x].taskSendEmail == "T") //only include tasks which have "Send Email" set to true
		{
			if (employeeTasks.length == 0)
			{
				employeeTasks.push(newEmployeeTask);
			}
			else
			{
				//check if employee is already in the list
				var employeeFound = false;
				for (var y in employeeTasks)
				{
					if (newEmployeeTask.assigneeId == employeeTasks[y].assigneeId)
					{
						employeeTasks[y].assigneeTasks.push(createdTasks[x]);
						employeeFound = true;
						break;
					}
				}

				if (employeeFound == false)
				{
					employeeTasks.push(newEmployeeTask);
				}
			}
		}		
	}

	//sending alerts
	for (var z in employeeTasks)
	{
		var messageBody = "<p>The following task has been assigned to you.</p>"; 
		messageBody += "<table border=\"0\"><tr><td><b>Task id</b></td><td><b>Task title</b></td></tr>";
		
		for (var u in employeeTasks[z].assigneeTasks)
		{
			messageBody += ("<tr><td>"+employeeTasks[z].assigneeTasks[u].taskId + "</td><td>" + employeeTasks[z].assigneeTasks[u].taskTitle+"</td></tr>");
		}
		messageBody += ("</table>");
		
		var messageSubject = (Settings.TaskNotifications.Subject+": "+recordEntityName)

		Messaging.SendMessage(Settings.TaskNotifications.From, employeeTasks[z].assigneeId, messageSubject, messageBody);
	}
}

function addTaskSublistTab(tabName, txId, txRecordType)
{
    var taskSublist = form.addSubList('custpage_task_sublist','inlineeditor', 'Tasks', tabName);    // Create the Sublist of tasks, add it to the general tab, renamed to 'Main'
        
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
    filters[1] = new nlobjSearchFilter('internalid',txRecordType, 'is',  txId);
        
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
        var subCount = countOpenSubtasks(id,txId,txRecordType);
        if( subCount != null && subCount > 0) taskSublist.setLineItemValue('cust_open_sub_tasks', i+1, subCount);               // we only want to display anything if greater than 0.

        if(subCount == 0 && (result.getValue('status') == 'Not Started' || result.getValue('status') == 'In Progress'))            // *****
        {
            var completeUrl = "<a target=\"server_commands\" href=\"https://system.netsuite.com/app/crm/common/crm.nl?markcomplete=T&refresh=custpage_task_sublist&id=" + id;
            taskSublist.setLineItemValue('cust_mark', i+1, completeUrl + "\">Complete/NA</a>");
            //taskSublist.setLineItemValue('cust_na', i+1, completeUrl + "&notapplicable=na\">Not Applicable</a>");
        }
    }
}

function countOpenSubtasks(parentTaskId, txId, txRecordType)
{
    var subFilters = new Array();
    var cnt = 0;
    
    //subFilters[0] = new nlobjSearchFilter('custevent_parenttask', null, 'is',  parentTaskId);
    subFilters[cnt] = new nlobjSearchFilter('status', null, 'noneof',  'Complete');
    cnt = cnt + 1;
    
    if(parentTaskId != null)
    {
        subFilters[cnt] = new nlobjSearchFilter('custevent_parenttask', null, 'is',  parentTaskId);
        cnt = cnt + 1;
    }
    
    if(txId != null && txRecordType != null)
    {
        subFilters[cnt] = new nlobjSearchFilter('internalid', txRecordType, 'is',  txId);
    }
            
    var subColumns = new Array();
    subColumns[0] = new nlobjSearchColumn('internalid',null,null);
    var subResults = nlapiSearchRecord('activity', null, subFilters, subColumns);

    if(subResults == null) return 0;
    
    return (subResults.length - 1);
}

var Logger =
{
	LogType:
	{
		Debug: "DEBUG"
		, Error: "ERROR"
		, Audit: "AUDIT"
	},
	Write: function(type, title, details)
	{
		/// <summary>Writes a message to the execution log.</summary>
		/// <param name="type" type="Logger.LogType">Log Type</param>
		/// <param name="title" type="string"></param>
		/// <param name="details" type="string"></param>

		nlapiLogExecution(type, title, details);
	},
	FormatException: function(ex)
	{
		/// <summary>Returns the formatted error message.</summary>
		/// <param name="ex" type="Error">Error</param>

		var msg = "";

		if (ex instanceof nlobjError)
			msg += "Script Name: " + ex.getUserEvent() + "\nError Code: " + ex.getCode() + "\nError Details: " + ex.getDetails() + "\n\nStack Trace: " + ex.getStackTrace();
		else
			msg += ex.toString();

		return msg;
	}
}

var Messaging =
{
    SendMessage: function(from, to, subject, body)
    {
        /// <summary>Sends an email to specified recipient.</summary>
        /// <param name="from" type="string" mayBeNull="false">The Internal ID of an employee indicating the sender of the email.</param>
        /// <param name="to" type="string" mayBeNull="false">Recipients email address.</param>
        /// <param name="subject" type="string" mayBeNull="false">Email subject</param>
        /// <param name="body" type="string" mayBeNull="false">Email body</param>

        nlapiSendEmail(from, to, subject, body, null, null, null);
    },
    SendErrorNotification: function(scriptInfo, message)
    {
        /// <summary>Sends an error notification to specified recipient.</summary>
        /// <param name="scriptInfo" type="string" mayBeNull="false">Script and function name where error occured.</param>
        /// <param name="message" type="string" mayBeNull="false">Error message.</param>

        var subject = "Unexpected error occured in " + scriptInfo;
        nlapiSendEmail(Settings.ErrorNotification.From, Settings.ErrorNotification.To, subject, message, null, null, null);
    }
}

var Governance =
{
	StartTime: new Date(),
	ElapsedTime: function()
	{
		/// <summary>Gets the number of seconds elapsed since the script has started.</summary>
		/// <returns type="Number" mayBeNull="false">Number in seconds.</returns>

		var elapsedTime = ((new Date().getTime() - this.StartTime.getTime()) / 1000);
		Logger.Write(Logger.LogType.Debug, "Governance.ElapsedTime()", "Time elapsed since script start: " + elapsedTime);
		return elapsedTime;
	},
	RemainingUsage: function()
	{
		/// <summary>Gets the number of units remaining for script execution.</summary>
		/// <returns type="Number" mayBeNull="false">Number of units remaining.</returns>

		var unitRemaining = parseInt(nlapiGetContext().getRemainingUsage());
		Logger.Write(Logger.LogType.Debug, "Governance.RemainingUsage()", unitRemaining + " units remaining for this script execution.");
		return unitRemaining;
	}
}