/// <reference path="SRSEvent_ServerSideLibrary.js" />
/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/**
 * @author durbano
 */
function loadPortlet(portlet, column)
{	// likely this is only called once
	portlet.setTitle('SRS Only Important Dates - No Acquiom');

	var portletUrl = nlapiResolveURL('SUITELET','customscript_event_action_handler_nodep','customdeploy_event_action_handler_nodep','FALSE');
	var defaultPage = 'list';
	var iFrameContent = '<td id="SRSEventPortletTD" height="460px" ><iframe frameborder="0" name="SRSEventPortlet" width="100%" height="800px" src="' + portletUrl + '&page=' + defaultPage + '"></iframe></td>';
	
	portlet.setHtml(iFrameContent);
}

function handleRequest(portletRequest,portletResponse)
{
	nlapiLogExecution("DEBUG", "SRSEventPortlet.handleRequest", "START");
	
	// process request
	var page = portletRequest.getParameter('page');
	if(page == null)
	{
		portletResponse.write('Request parameter page is null');
		return;
	}
	nlapiLogExecution("DEBUG", "SRSEventPortlet.handleRequest", "page = " + page);
	
	var content = null;
	if(page == 'list')
	{
		content = renderEventList(portletRequest);
	}
	else if(page == 'edit')
	{
		content = renderEventEdit(portletRequest);
	}
	else if(page == 'markcomplete')
	{
		markcomplete(portletRequest);
		content = renderEventList(portletRequest);
	}
	else if(page == 'updateevent')
	{
		updateEvent(portletRequest);
		content = renderEventList(portletRequest);
	}
	else
	{
		portletResponse.write('Request parameter page is ' + page + '. No renderer mapped.');
		return;
	}
	
	nlapiLogExecution("DEBUG", "SRSEventPortlet.handleRequest", "END");
	// process response
	portletResponse.writePage(content);
}

// request handlers

function renderEventList(portletRequest)
{
	nlapiLogExecution("DEBUG", "SRSEventPortlet.renderEventList", " Rendering list");
	var handler = nlapiResolveURL('SUITELET','customscript_event_action_handler_nodep','customdeploy_event_action_handler_nodep','FALSE');
	var editUrl 	= handler + '&page=edit';
	var completeUrl = handler + '&page=markcomplete';
	nlapiLogExecution("DEBUG", "SRSEventPortlet.renderEventList", " Consider the URL retrieved");
	var eventList = getListOfUpcomingEventsNoDepts();
	nlapiLogExecution('DEBUG', "List of variables", "Edit URL: " + editUrl + ": Complete URL: " + completeUrl);
	nlapiLogExecution('DEBUG', "Event List DUMP", JSON.stringify(eventList) );
	return createEventList(eventList,editUrl,completeUrl);
}

function renderEventEdit(portletRequest)
{
	nlapiLogExecution("DEBUG", "SRSEventPortlet.renderEventEdit", " Rendering event edit");
	
	return createEventForm(portletRequest);
}

function updateEvent(portletRequest)
{
	nlapiLogExecution("DEBUG", "SRSEventPortlet.updateEvent", "Updating the event record");
	
	var eventId = portletRequest.getParameter('eventid');
	var event 	= nlapiLoadRecord('calendarevent',eventId);
	
	var title			= portletRequest.getParameter('title');
	var startdate		= portletRequest.getParameter('startdate');
	var comments		= portletRequest.getParameter('comments');		// custevent30
	var markcomplete	= portletRequest.getParameter('cust_markcomplete');
	
	nlapiLogExecution("DEBUG", "SRSEventPortlet.updateEvent", "Markcomplete checkbox is " + markcomplete);
	
	event.setFieldValue('title',title);
	event.setFieldValue('startdate',startdate);
	event.setFieldValue('custevent30',comments);
	
	if(markcomplete == 'T')
	{
		event.setFieldValue('status','COMPLETE');
	}
	nlapiSubmitRecord(event);
}

function markcomplete(portletRequest)
{
	nlapiLogExecution("DEBUG", "SRSEventPortlet.updateEvent", "Updating the event record");
	
	var eventId = portletRequest.getParameter('eventid');
	
	var event 	= nlapiLoadRecord('calendarevent',eventId);
	event.setFieldValue('status','COMPLETE');
	nlapiSubmitRecord(event);
}

// response handlers
/*function listEventsDisplay(portlet)
{
	nlapiLogExecution("DEBUG", "SRSEventPortlet.listEventsDisplay", " List events display");
	
	var context = nlapiGetContext();
	
	//porletResponse.sendRedirect('SUITELET','customscript_srs_important_events','customdeploy_srs_important_events','FALSE');
	//var eventDetailUrl = nlapiResolveURL('SUITELET','customscript_event_action_handler','customdeploy_event_action_handler','FALSE');
	var eventDetailUrl = nlapiResolveURL('SUITELET','customscript_srs_important_events','customdeploy_srs_important_events','FALSE');
	
	var eventList = getListOfUpcomingEvents();
	
	writeListOfUpcomingEvents(portlet,eventList,eventDetailUrl);
}
*/