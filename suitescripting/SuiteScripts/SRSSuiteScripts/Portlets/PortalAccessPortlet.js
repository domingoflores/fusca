/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/**
 * @author durbano
 */
function loadPortlet(portlet, column)
{
	nlapiLogExecution("AUDIT", "PortalAccessPortlet.loadPortlet", "START");
	
	// likely this is only called once
	portlet.setTitle('Customer Portal Access');

	var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');

	var wrapperPage = 'wrapper';
	var wrapperUrl = portletUrl + '&page=' + wrapperPage + '&frame=search';
	
	var content = '<td><iframe name="SRSCustomerPortalAccessWrapper" src="' + wrapperUrl + '" frameborder="0" width="100%" height="300" scrolling="no"></iframe>';
	portlet.setHtml(content);
	nlapiLogExecution("AUDIT", "PortalAccessPortlet.loadPortlet", "END");
}

function handleRequest(request, response)
{
	nlapiLogExecution("AUDIT", "PortalAccessPortlet.handleRequest", "START");
	
	// process request
	var page = request.getParameter('page');
	if(page == null)
	{
		response.write('Request parameter page is null');
		return;
	}
	nlapiLogExecution("DEBUG", "PortalAccessPortlet.handleRequest", "page = " + page);

	if(page == 'wrapper')
	{
		writeWrapper(request,response);
		return;		
	}
	
	var content = null;
	if(page == 'search')
	{	// get the list of recently closed deals (3 months) with open tasks
		content = renderSearch(request);
	}
	else if(page == 'searchResults')
	{	// get the list of tasks assigned to me
		renderSearchResults(request,response);
		return; // underlying function performs the rendering
	}
	else if(page == 'contactInfo')
	{	// filter down the default list to show only those deals with tasks assigned to me
		content = renderContactInfo(request);
	}
	else if(page == 'duplicate')
	{
		content = renderDuplicate(request);
	}
	else if(page == 'errors')
	{
		content = renderErrors(request);
	}
	else
	{
		response.write('Page ' + page + ' not found.');
		return;
	}

	//response.writePage(content);
	response.write(content);
	nlapiLogExecution("AUDIT", "PortalAccessPortlet.handleRequest", "END");	
}

function writeWrapper(request,response)
{
	var portletUrl = nlapiResolveURL('SUITELET','customscript_srs_portal_access_suitelet','customdeploy_srs_portal_access_suitelet','FALSE');
	
	var frame = request.getParameter('frame');
	var searchPage = 'search';
	var errorsPage = 'errors';
	var duplicateContactsPage = 'duplicate';

	var defaultUrl = portletUrl + '&page=' + frame;
	var searchUrl = portletUrl + '&page=wrapper&frame=' + searchPage;
	var errorsUrl = portletUrl + '&page=' + errorsPage;
	var duplicateUrl = portletUrl + '&page=wrapper&frame=' + duplicateContactsPage;
	
	var headerContent = '<font size="1"> &nbsp; <a href="' + searchUrl + '">Search</a> &nbsp; | &nbsp; '
						+ '<a href="' + errorsUrl + '">Errors</a>  &nbsp; | &nbsp; '
						+ '<a href="' + duplicateUrl + '">Duplicates</a> </font>';
	var iFrameContent = '<iframe frameborder="0" name="SRSCustomerPortalAccessBody" width="100%" height="300" src="' + defaultUrl + '" scrolling="auto"></iframe>';

	response.write(headerContent);
	response.write(iFrameContent);	
}

