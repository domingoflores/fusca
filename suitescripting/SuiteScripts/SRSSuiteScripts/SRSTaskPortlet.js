/// <reference path="SRSTask_ServerSideLibrary.js" />
/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/**
 * @author durbano
 */
function loadPortlet(portlet, column)
{	// likely this is only called once
	portlet.setTitle('Recently Closed Deals');

	var portletUrl = nlapiResolveURL('SUITELET','customscript_task_event_handler','customdeploy_task_event_handler','FALSE');

	var wrapperPage = 'wrapper';
	var wrapperUrl = portletUrl + '&page=' + wrapperPage + '&frame=list';
	
	var content = '<td><iframe name="SRSRecentlyClosedDealsWrapper" src="' + wrapperUrl + '" frameborder="0" width="100%" height="300" scrolling="no"></iframe>';
	portlet.setHtml(content);	
}

function handleRequest(request, response)
{
	nlapiLogExecution("DEBUG", "SRSTaskPortlet.handleRequest", "START");
	
	// process request
	var page = request.getParameter('page');
	if(page == null)
	{
		response.write('Request parameter page is null');
		return;
	}
	nlapiLogExecution("DEBUG", "SRSTaskPortlet.handleRequest", "page = " + page);

	if(page == 'wrapper')
	{
		writeWrapper(request,response);
		return;		
	}
	
	var content = null;
	if(page == 'list')
	{	// get the list of recently closed deals (3 months) with open tasks
		content = renderDefaultList(request);
	}
	else if(page == 'mytasks')
	{	// get the list of tasks assigned to me
		content = renderMyTaskList(request);
	}
	else if(page == 'mydealtasks')
	{	// filter down the default list to show only those deals with tasks assigned to me
		content = renderDealTaskList(request);
	}
	else if(page == 'alltasks')
	{
		content = renderAllTaskList(request);
	}
	else if(page == 'complete')
	{
		content = renderMarkTaskComplete(request);
	}
	else
	{
		response.write('Page ' + page + ' not found.');
		return;
	}

	response.writePage(content);
	nlapiLogExecution("DEBUG", "SRSTaskPortlet.handleRequest", "END");	
}

function writeWrapper(request,response)
{
	var portletUrl = nlapiResolveURL('SUITELET','customscript_task_event_handler','customdeploy_task_event_handler','FALSE');
	
	var listPage = 'list';
	var mydealPage = 'mydealtasks';
	var myTasksPage = 'mytasks';
	var frame = request.getParameter('frame');

	var defaultUrl = portletUrl + '&page=' + frame;
	var listUrl = portletUrl + '&page=wrapper&frame=' + listPage;
	var myDealTaskUrl = portletUrl + '&page=wrapper&frame=' + mydealPage;
	var myTasksUrl = portletUrl + '&page=wrapper&frame=' + myTasksPage;
	
	var headerContent = '<font size="1"> &nbsp; <a href="' + listUrl + '">All Tasks Deal Report</a> &nbsp; | <a href="' + myDealTaskUrl + '">My Tasks Deal Report</a> | &nbsp; <a href="' + myTasksUrl + '">My Tasks</a></font>';
	var iFrameContent = '<iframe frameborder="0" name="SRSRecentlyClosedDealsBody" width="100%" height="300" src="' + defaultUrl + '" scrolling="auto"></iframe>';

	response.write(headerContent);
	response.write(iFrameContent);	
}

/*function preferredloadPortlet(portlet, column)
{
	portlet.setTitle('Recently Closed Deals');

	var portletUrl = nlapiResolveURL('SUITELET','customscript_task_event_handler','customdeploy_task_event_handler','FALSE');
	var defaultPage = 'list';
	var mydealPage = 'mydealtasks';
	var myTasksPage = 'mytasks';

	var defaultUrl = portletUrl + '&page=' + defaultPage;
	var myDealTaskUrl = portletUrl + '&page=' + mydealPage;
	var myTasksUrl = portletUrl + '&page=' + myTasksPage;
	
	var headerLinkContent = '<font size="1"> &nbsp; <a href="' + defaultUrl + '" target="SRSTaskPortletFrame" >All Tasks Deal Report</a> &nbsp; | <a href="' + myDealTaskUrl + '" target="SRSTaskPortletFrame">My Tasks Deal Report</a> | &nbsp; <a href="' + myTasksUrl + '" target="SRSTaskPortletFrame">My Tasks</a></font>';

	var iFrameContent = '<iframe frameborder="0" name="SRSTaskPortletFrame" width="100%" height="300" src="' + defaultUrl + '"></iframe>';
	
	var content = '<td id="SRSTaskPortletTD" height="360px" valign="top"><table height="100%"><tr><td>' + headerLinkContent + '</td></tr><tr><td>' + iFrameContent + '</td></tr></table></td>';

	portlet.setHtml(content);
}

function preferredhandleRequest(portletRequest, portletResponse)
{
	nlapiLogExecution("DEBUG", "SRSTaskPortlet.handleRequest", "START");
	
	// process request
	var page = portletRequest.getParameter('page');
	if(page == null)
	{
		portletResponse.write('Request parameter page is null');
		return;
	}
	nlapiLogExecution("DEBUG", "SRSTaskPortlet.handleRequest", "page = " + page);
	
	var content = null;
	if(page == 'list')
	{	// get the list of recently closed deals (3 months) with open tasks
		//content = renderDefaultList(portletRequest);
		portletResponse.write('TESTING! page = ' + page);
	}
	else if(page == 'mytasks')
	{	// get the list of tasks assigned to me
		//content = renderMyTaskList(portletRequest);
		portletResponse.write('TESTING! page = ' + page);
	}
	else if(page == 'mydealtasks')
	{	// filter down the default list to show only those deals with tasks assigned to me
		//content = renderDealTaskList(portletRequest);
		portletResponse.write('TESTING! page = ' + page);
	}
	
	//portletResponse.writePage(content);
	nlapiLogExecution("DEBUG", "SRSTaskPortlet.handleRequest", "END");
}*/

function renderDealTaskList(portletRequest)
{
	var results = getListOfRecentlyClosedDealsWithMyTasks();
	
	var content = renderList(results,'mytasks');
	
	return content;	
}

function renderDefaultList(portletRequest)
{
	var results = getListOfRecentlyClosedDealsWithTasks();
	
	var content = renderList(results,'alltasks');
	
	return content;
}

function renderMyTaskList(request)
{
	var results = getMyTasks();
	var entityid = request.getParameter('entityid');
	var content = renderTaskList(results,entityid,'mytasks');
	
	return content;
}

function renderAllTaskList(request)
{
	var results = getAllTasks();
	var entityid = request.getParameter('entityid');
	var content = renderTaskList(results,entityid,'alltasks');
	
	return content;	
}

function renderMarkTaskComplete(request)
{
	// mark the task complete
	var taskid = request.getParameter('taskid');
	nlapiLogExecution("DEBUG", "SRSTaskPortlet.renderMarkTaskComplete", "taskid:" + taskid);
	nlapiSubmitField("task", taskid, "status", "COMPLETE");
	
	// call appropriate content based on frame
	var frame = request.getParameter('frame');
	if(frame == 'alltasks')
	{
		return renderAllTaskList(request);
	}
	else if(frame == 'mytasks')
	{
		return renderMyTaskList(request);
	}
}
