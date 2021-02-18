/**
 * @author durbano
 */
function getListOfRecentlyClosedDealsWithTasks()
{
	// perform the search
	var searchResults = nlapiSearchRecord('customer','customsearch635');
	searchResults.sort(dealSortOrder);
	return searchResults;
}

function getListOfRecentlyClosedDealsWithMyTasks()
{
	// perform the search
	var searchResults = nlapiSearchRecord('customer','customsearch678');
	searchResults.sort(dealSortOrder);
	return searchResults;	
}

function getAllTasks()
{
	var searchResults = nlapiSearchRecord('customer','customsearch681');
	return searchResults;	
}

function getMyTasks()
{
	var searchResults = nlapiSearchRecord('customer','customsearch679');
	return searchResults;
}

function renderList(searchResults, page)
{
	var list = nlapiCreateList('Recently Closed Deals with Tasks List',true);
	
	var portletUrl = nlapiResolveURL('SUITELET','customscript_task_event_handler','customdeploy_task_event_handler','FALSE');
	
	var dealCol = list.addColumn('name','text','Deal','LEFT');
	dealCol.setURL(portletUrl);
	dealCol.addParamToURL('entityid','entityid', true);
	dealCol.addParamToURL('page',page, false);
	
	list.addColumn('salesorder','date','Sales Order Date','LEFT');
	list.addColumn('closingdate','date','Closing Date','LEFT');
	//list.addColumn('primaryrep','text','Primary Rep','LEFT');
	//list.addColumn('secondaryrep','text','Secondary Rep','LEFT');
	list.addColumn('taskcount','text','Open Tasks','RIGHT');
	
	for (var i = 0; searchResults != null && i < searchResults.length; i++) // setup view url
	{
		var result = searchResults[i];

        var hash 			= new Array();
        hash.entityid		= result.getValue('internalid',null,'group');
		hash.name 			= result.getValue('entityid',null,'group');
		hash.salesorder 	= result.getValue('dateclosed',null,'group');
		hash.closingdate	= result.getValue('custentity8',null,'group');
		hash.primaryrep		= result.getText('custentity42',null,'group');
		hash.secondaryrep	= result.getText('custentity43',null,'group');
		hash.taskcount		= result.getValue('internalid','task','count');
		
		list.addRow(hash);
	}
	
	return list;
}

function renderTaskList(searchResults,selectedentityid,page)
{
	var list = nlapiCreateList('My Tasks',true);
	
	var portletUrl = nlapiResolveURL('SUITELET','customscript_task_event_handler','customdeploy_task_event_handler','FALSE');
	
	list.addColumn('name','text','Deal','LEFT');
	list.addColumn('parent','text','Parent Task','LEFT');
	list.addColumn('title','text','Title','LEFT');
	list.addColumn('status','text','Status','LEFT');
	var mark = list.addColumn('markcomplete','text','Mark Complete','LEFT');
	mark.setURL(portletUrl);
	mark.addParamToURL('page','complete', false);
	mark.addParamToURL('frame',page, false);
	mark.addParamToURL('taskid','taskid', true);
	if(selectedentityid != null) mark.addParamToURL('entityid',selectedentityid, false);
	
	for (var i = 0; searchResults != null && i < searchResults.length; i++) // setup view url
	{
		var result = searchResults[i];
		
		var entityid 	= result.getId();
		if(selectedentityid != null && entityid != selectedentityid) continue;	// skip the rest
		
		var hash 			= new Array();
		hash.name			= result.getValue('entityid');
		hash.title			= result.getValue('title','task');
		hash.status			= result.getText('status','task');
		hash.markcomplete 	= 'Complete';
		hash.taskid			= result.getValue('internalid','task');

		var parentTask = result.getText('custevent_parenttask','task');
		if(parentTask.length > 20) parentTask = parentTask.substring(0,20) + '...';
		hash.parent	= parentTask;
		
		list.addRow(hash);
	}	
	
	return list;
}

function dealSortOrder(a, b) 
{
	var x = a.getValue('entityid',null,'group');
	var y = b.getValue('entityid',null,'group');
	
    if (x < y) 
    { 
        return -1; 
    } 
    else if (x > y) 
    { 
        return 1; 
    } 
    else 
    { 
        return 0; 
    } 
}  
