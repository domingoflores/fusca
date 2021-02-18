/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSProjectDashboards.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2011/08/23
 *
 * Copyright (c) 2011 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function execSummaryDashboard(portlet, column) {
	nlapiLogExecution('DEBUG','SRSProjectDashboards.execSummaryDashboard','Starting execSummaryDashboard...');
	
	var phaseTotals = new Object();

	var result = null;
	
	result = nlapiSearchRecord('projecttask','customsearch_proj_task_dashboard_summary',null,null);
	
	//get phases
	var filters = new Array();
	var columns = new Array();
	var searchPhases = null;
	
	filters[0] = new nlobjSearchFilter('company',null,'anyOf',67552); //this is the internal id of the SRS Standard Deal Template
	filters[1] = new nlobjSearchFilter('parent',null,'anyOf','@NONE@');
	
	columns[0] = new nlobjSearchColumn('id', null, 'group').setSort();
	columns[1] = new nlobjSearchColumn('title',null,'group');
	
	searchPhases = nlapiSearchRecord('projecttask',null,filters,columns);
	
	
	
	//Now loop through the results.
	if(result != null) {
		nlapiLogExecution('DEBUG','SRSProjectDashboards.execSummaryDashboard','Got tasks... parsing them.');
		var resultColumns = getColumnsByName(result);
		var deals = new Array();
		var dealNames = new Object();
		var phases = new Array();
		
		for(var ph1 = 0; ph1 < searchPhases.length; ph1++) {
			phases.push(getTaskInfo(searchPhases[ph1].getValue('title',null,'group'),'phase'));
		}
		
		//get unique deals and phases
		for(var tr1 = 0;tr1 < result.length;tr1++) {
			
			var currResult = result[tr1];
			//var currPhase = getTaskInfo(currResult.getValue(resultColumns['task_name']),'phase');
			var currDeal = currResult.getValue(resultColumns['deal']);
			
			if(!isElementPresent(deals,currDeal)) {
				deals.push(currDeal);
				dealNames[currDeal] = currResult.getText(resultColumns['deal']);
			}
			
			/*if(!isElementPresent(phases,currPhase)) {
				phases.push(currPhase);
			}*/
		}
		//setup result buckets.
		for(var tr2 = 0; tr2 < deals.length; tr2++) {
			for(var tr3 = 0; tr3 < phases.length; tr3++) {
				var prefix = deals[tr2]+':'+phases[tr3]+':';
				phaseTotals[prefix+'ACT:TXT'] = '<span style="font-weight: bold;">Active Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</span><br />';
				phaseTotals[prefix+'LT:TXT'] = '<span style="font-weight: bold;">Late Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</span><br />';
				phaseTotals[prefix+'ACT:CNT'] = 0;
				phaseTotals[prefix+'LT:CNT'] = 0;
			}
		}
		
		//Now really loop through the results and compile the totals
		for(var tr4 = 0; tr4 < result.length; tr4++) {
			var currResult = result[tr4];
			var currTextLine = currResult.getValue(resultColumns['task_id'])+': '+getTaskInfo(currResult.getValue(resultColumns['task_name']),'title')+', '+currResult.getText(resultColumns['resource'])+', Due: '+currResult.getValue(resultColumns['due_date'])+'<br />';
			var prefix = currResult.getValue(resultColumns['deal'])+':'+getTaskInfo(currResult.getValue(resultColumns['task_name']),'phase')+':';
			
			if(currResult.getValue(resultColumns['is_late']) == 1) {
				//If the task is late, add it to the late bucket for the phase.
				phaseTotals[prefix+'LT:TXT'] = phaseTotals[prefix+'LT:TXT']+currTextLine;
				phaseTotals[prefix+'LT:CNT'] = phaseTotals[prefix+'LT:CNT']+1;
			} else {
				//If not add it to the active bucket for the phase.
				phaseTotals[prefix+'ACT:TXT'] = phaseTotals[prefix+'ACT:TXT']+currTextLine;
				phaseTotals[prefix+'ACT:CNT'] = phaseTotals[prefix+'ACT:CNT']+1;
			}
		}
		
		
		
		//Finally display results.
		portlet.setTitle('Active Deal Tasks');
		
		portlet.addColumn('deal','text','Deal','CENTER');
		//add columns for each phase
		for(var tr5 = 0; tr5 < phases.length; tr5++) {
			var compressedPhase = phases[tr5].replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
			nlapiLogExecution('DEBUG','SRSProjectDashboards.execSummaryDashboard','Trying to build portlet column:'+compressedPhase);
			portlet.addColumn(compressedPhase,'text',phases[tr5],'CENTER');
		}
		
		//set up display elements.
		var toolTipCss = "color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
		
		//Loop through the deals and add data appropriately.
		for(var dl1 = 0; dl1 < deals.length; dl1++) {
			var newRow = new Object();
			newRow['deal'] = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',deals[dl1],'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+dealNames[deals[dl1]]+'</a>';
			for(var dl2 = 0; dl2 < phases.length; dl2++) {
				var prefix = deals[dl1]+':'+phases[dl2]+':';
				var comPre = 'pre'+prefix.replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
				var compressedPhase = phases[dl2].replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
				if(phaseTotals[prefix+'ACT:CNT'] > 0) {
					newRow[compressedPhase] = '<span onMouseOver="var x = document.getElementById(\''+comPre+'ACT:TXT\');x.style.display=\'block\';var offset = 0;if(event.pageX > 610){offset=600};x.style.left=(event.pageX-offset)+\'px\';x.style.top=(event.pageY-40)+\'px\';" onMouseOut="var x = document.getElementById(\''+comPre+'ACT:TXT\');x.style.display=\'none\'">'+phaseTotals[prefix+'ACT:CNT']+'<div id="'+comPre+'ACT:TXT" style="'+toolTipCss+'" align="left">'+phaseTotals[prefix+'ACT:TXT']+'</div></span>';
				} else {
					newRow[compressedPhase] = '-';
				}
				if(phaseTotals[prefix+'LT:CNT'] > 0) {
					newRow[compressedPhase] = newRow[compressedPhase]+'&nbsp;&nbsp;/&nbsp;&nbsp;<span onMouseOver="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'block\';var offset = 0;if(event.pageX > 610){offset=600};x.style.left=(event.pageX-offset)+\'px\';x.style.top=(event.pageY-40)+\'px\';" onMouseOut="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'none\'" style="color: #A00000;"><span style="font-weight: bold;">'+phaseTotals[prefix+'LT:CNT']+'</span><div id="'+comPre+'LT:TXT" style="'+toolTipCss+'" align="left"> '+phaseTotals[prefix+'LT:TXT']+' </div></span>';
				} else {
					newRow[compressedPhase] = newRow[compressedPhase]+'&nbsp;&nbsp;/&nbsp;&nbsp;-';
				}
					
			}
			portlet.addRow(newRow);
		}
	} else {
		nlapiLogExecution('ERROR','SRSProjectDashboards.execSummaryDashboard','No tasks found... returning message to that effect.');
		var errorMsg = new Object();
		errorMsg['sysmsg'] = 'Comport found no currently active tasks for any deal.';
		portlet.setTitle('Active Deal Tasks :: No Tasks Found');
		portlet.addColumn('sysmsg','text','Comport System Message','CENTER');
		portlet.addRow(errorMsg);
		return null;
	}
	
}

//
// getColumnsByName:  This routine gets all of the columns in a search and creates a javascript pseudo-associate array based on the column's name.
//					  Really this belongs in a generic utility library, but I don't have one now so that's a TODO
//

function getColumnsByName(searchResult) {
	
	nlapiLogExecution('DEBUG','SRSProjectDashboards.getColumnsByName','Starting getColumnsByName...');
	
	if(searchResult == null || searchResult == undefined) {
		return null;
	}
	
	var returnArray = new Object();
	
	var sampleResult = searchResult[0];
	var columns = sampleResult.getAllColumns();
	
	for(var cbn = 0; cbn < columns.length; cbn++) {
		var testCol = columns[cbn];
		
		if(testCol.getLabel() != null && testCol.getLabel() != undefined && testCol.getLabel() != '') {
			returnArray[testCol.getLabel()] = testCol;
			nlapiLogExecution('DEBUG','SRSProjectDashboards.getColumnsByName','Setting column by label: '+testCol.getLabel());
		} else {
			returnArray[testCol.getName()] = testCol;
			nlapiLogExecution('DEBUG','SRSProjectDashboards.getColumnsByName','Setting column by name: '+testCol.getName());
		}
	}
	
	return returnArray;
	
}

function opsAssignmentDashboard(portlet, column) { //TODO: Find a better way than hard coding this crap.  Today there is no good way to find roles by reporting responsibility.
	nlapiLogExecution('DEBUG','SRSProjectDashboards.opsAssignmentDashboard','Starting opsAssignmentDashboard...');
	
	//Set the roles for the dashboard
	var opsRoles = new Array('9','10','11','18');
	
	//Next get the tasks with these roles that are unassigned.
	var filters = new Array();
	var columns = new Array();
	var result = null;
	
	filters[0] = new nlobjSearchFilter('custevent_proj_task_deal_team_role', null, 'anyOf',opsRoles);
	filters[1] = new nlobjSearchFilter('status',null,'noneOf','COMPLETE');
	filters[2] = new nlobjSearchFilter('custentity_proj_is_template','job','is','F');
	filters[3] = new nlobjSearchFilter('assignee',null,'anyOf','@NONE@',null,1,0,true,false);
    filters[4] = new nlobjSearchFilter('custevent_proj_task_is_active',null,'is','T',null,0,1,false,false);
	columns[0] = new nlobjSearchColumn('internalid');
	columns[3] = new nlobjSearchColumn('id');
	columns[2] = new nlobjSearchColumn('internalid','job');
	columns[1] = new nlobjSearchColumn('customer','job');
	
	columns[3].setSort();
	columns[1].setSort();
	
	result = nlapiSearchRecord('projecttask',null,filters,columns);
	
	if(result != null) {
		//Finally display results.
		portlet.setTitle('Operations Task Assignment');
		
		portlet.addColumn('deal','text','Deal','CENTER');
		portlet.addColumn('tasktitle','text','Task Name','LEFT');
		portlet.addColumn('assignee','text','Current Assignee','CENTER');
		portlet.addColumn('dealrole','text','Task Role','CENTER');
		portlet.addColumn('status','text','Status','CENTER');
		portlet.addColumn('currstart','text','Projected Start','CENTER');
		portlet.addColumn('currend','text','Projected End','CENTER');
		
		for(var oa1 = 0; oa1 < result.length; oa1++) {
			var newRow = new Object();
			var currResult = nlapiLoadRecord('projecttask',result[oa1].getId());
			newRow['deal'] = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',result[oa1].getValue('customer','job'),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+result[oa1].getText('customer','job')+'</a>';
			newRow['tasktitle'] = '<a href="#" title="Click here to view the project task." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','projecttask',currResult.getId(),'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+getTaskInfo(currResult.getFieldValue('title'),'title')+'</a>';
			var assignees = '';
			for(var oa2 = 1; oa2 <= currResult.getLineItemCount('assignee'); oa2++) {
				assignees = assignees+currResult.getLineItemText('assignee','resource',oa2);
				if(oa2 < currResult.getLineItemCount('assignee')) {
					assignees = assignees+', ';
				}
			}
			
			newRow['assignee'] = assignees;
			newRow['dealrole'] = '<a href="#" title="Click here to assign deal team member." onclick="Popup=window.open(\''+nlapiResolveURL('TASKLINK','EDIT_CUST_119',null,'EDIT')+'&l=T&record.custrecord_deal_team_deal='+result[oa1].getValue('customer','job')+'&record.custrecord_deal_team_role='+currResult.getFieldValue('custevent_proj_task_deal_team_role')+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+currResult.getFieldText('custevent_proj_task_deal_team_role')+'</a>';
			newRow['status'] = currResult.getFieldText('status');
			newRow['currstart'] = currResult.getFieldValue('startdate');
			newRow['currend'] = currResult.getFieldValue('enddate');
			portlet.addRow(newRow);
		}
		
	} else {		
		nlapiLogExecution('ERROR','SRSProjectDashboards.opsAssignmentDashboard','No tasks found... returning message to that effect.');
		var errorMsg = new Object();
		errorMsg['sysmsg'] = 'Comport found no currently active tasks for any deal.';
		portlet.setTitle('Operations Task Assignment :: No Tasks Found');
		portlet.addColumn('sysmsg','text','Comport System Message','CENTER');
		portlet.addRow(errorMsg);
		return null;
	}
}

//
//isElementPresent:  This just tests to see if an element exists in an array already.
//					  Really this belongs in a generic utility library, but I don't have one now so that's a TODO
//
function isElementPresent(arr, obj) {
	nlapiLogExecution('DEBUG','SRSProjectDashboards.isElementPresent','Starting isElementPresent...');
    for(var ep1 = 0; ep1 < arr.length; ep1++) {
        if (arr[ep1] == obj) {
        	return true;
        }
    }
     return false;
}

function cleanseHTML(targetString) {
	return targetString.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\'/g, '&#39;');
}


//
//generalManagerDashboard: 
//
function generalManagerDashboard(portlet, column) {
	nlapiLogExecution('DEBUG','SRSProjectDashboards.generalManagerDashboard','Starting generalManagerDashboard...');
	
	var targetRoles = nlapiGetContext().getSetting('SCRIPT', 'custscript_proj_mgr_roles');
	var dashboardTitle = nlapiGetContext().getSetting('SCRIPT', 'custscript_proj_mgr_title');
	var targetPhases = targetRoles.split(',');
	var phases = new Array();
	
	if(dashboardTitle == null) {
		dashboardTitle = 'Manager\'s Team Task Dashboard';
	}
	
	var phaseTotals = new Object();

	var result = null;
	
	result = nlapiSearchRecord('projecttask','customsearch_proj_task_dashboard_summary',null,null);

	
	//Now loop through the results.
	if(result != null) {
		nlapiLogExecution('DEBUG','SRSProjectDashboards.generalManagerDashboard','Got tasks... parsing them.');
		var resultColumns = getColumnsByName(result);
		var deals = new Array();
		var dealNames = new Object();
		
		//Get current roles
		var roleFilters = new Array();
		var roleColumns = new Array();
		var roleResult = null;
		
		roleFilters[0] = new nlobjSearchFilter('custevent_proj_task_deal_team_role',null,'anyOf',targetPhases);
		
		roleColumns[0] = new nlobjSearchColumn('custevent_proj_task_deal_team_role',null,'group');
		roleResult = nlapiSearchRecord('projecttask',null,roleFilters,roleColumns);
		
		for(var gm1 = 0; roleResult != null && gm1 < roleResult.length; gm1++) {
			phases.push(roleResult[gm1].getText('custevent_proj_task_deal_team_role',null,'group'));
		}
		
		//get unique deals and phases
		for(var tr1 = 0;tr1 < result.length;tr1++) {
			
			var currResult = result[tr1];
			var currPhase = currResult.getValue(resultColumns['role']);
			var currDeal = currResult.getValue(resultColumns['deal']);
			
			if(!isElementPresent(deals,currDeal)) {
				deals.push(currDeal);
				dealNames[currDeal] = currResult.getText(resultColumns['deal']);
			}
			
//			if(!isElementPresent(phases,currPhase)) {
//				phases.push(currPhase);
//			}
		}
		//setup result buckets.
		for(var tr2 = 0; tr2 < deals.length; tr2++) {
			for(var tr3 = 0; tr3 < phases.length; tr3++) {
				var prefix = deals[tr2]+':'+phases[tr3]+':';
				phaseTotals[prefix+'ACT:TXT'] = '<span style="font-weight: bold;">Active Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</span><br />';
				phaseTotals[prefix+'LT:TXT'] = '<span style="font-weight: bold;">Late Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</span><br />';
				phaseTotals[prefix+'ACT:CNT'] = 0;
				phaseTotals[prefix+'LT:CNT'] = 0;
			}
		}
		
		//Now really loop through the results and compile the totals
		for(var tr4 = 0; tr4 < result.length; tr4++) {
			var currResult = result[tr4];
			var currTextLine = currResult.getValue(resultColumns['task_id'])+': '+getTaskInfo(currResult.getValue(resultColumns['task_name']),'title')+', '+currResult.getText(resultColumns['resource'])+', Due: '+currResult.getValue(resultColumns['due_date'])+'<br />';
			var prefix = currResult.getValue(resultColumns['deal'])+':'+currResult.getText(resultColumns['role'])+':';
			
			if(currResult.getValue(resultColumns['is_late']) == 1) {
				//If the task is late, add it to the late bucket for the phase.
				phaseTotals[prefix+'LT:TXT'] = phaseTotals[prefix+'LT:TXT']+currTextLine;
				phaseTotals[prefix+'LT:CNT'] = phaseTotals[prefix+'LT:CNT']+1;
			} else {
				//If not add it to the active bucket for the phase.
				phaseTotals[prefix+'ACT:TXT'] = phaseTotals[prefix+'ACT:TXT']+currTextLine;
				phaseTotals[prefix+'ACT:CNT'] = phaseTotals[prefix+'ACT:CNT']+1;
			}
		}
		
		
		
		//Finally display results.
		portlet.setTitle(dashboardTitle);
		
		portlet.addColumn('deal','text','Deal','CENTER');
		//add columns for each phase
		for(var tr5 = 0; tr5 < phases.length; tr5++) {
			var compressedPhase = phases[tr5].replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
			nlapiLogExecution('DEBUG','SRSProjectDashboards.generalManagerDashboard','Trying to build portlet column:'+compressedPhase);
			portlet.addColumn(compressedPhase,'text',phases[tr5],'CENTER');
		}
		
		//set up display elements.
		var toolTipCss = "color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
		
		//Loop through the deals and add data appropriately.
		for(var dl1 = 0; dl1 < deals.length; dl1++) {
			var newRow = new Object();
			newRow['deal'] = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',deals[dl1],'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+dealNames[deals[dl1]]+'</a>';
			for(var dl2 = 0; dl2 < phases.length; dl2++) {
				var prefix = deals[dl1]+':'+phases[dl2]+':';
				var comPre = 'pre'+prefix.replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
				var compressedPhase = phases[dl2].replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
				nlapiLogExecution('DEBUG','SRSProjectDashboards.generalManagerDashboard','Attemping active column:'+prefix+'ACT:CNT');
				if(phaseTotals[prefix+'ACT:CNT'] > 0) {
					newRow[compressedPhase] = '<span onMouseOver="var x = document.getElementById(\''+comPre+'ACT:TXT\');x.style.display=\'block\';var offset = 0;if(event.pageX > 610){offset=600};x.style.left=(event.pageX-offset)+\'px\';x.style.top=(event.pageY-40)+\'px\';" onMouseOut="var x = document.getElementById(\''+comPre+'ACT:TXT\');x.style.display=\'none\'">'+phaseTotals[prefix+'ACT:CNT']+'<div id="'+comPre+'ACT:TXT" style="'+toolTipCss+'" align="left">'+phaseTotals[prefix+'ACT:TXT']+'</div></span>';
				} else {
					newRow[compressedPhase] = '-';
				}
				if(phaseTotals[prefix+'LT:CNT'] > 0) {
					newRow[compressedPhase] = newRow[compressedPhase]+'&nbsp;&nbsp;/&nbsp;&nbsp;<span onMouseOver="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'block\';var offset = 0;if(event.pageX > 610){offset=600};x.style.left=(event.pageX-offset)+\'px\';x.style.top=(event.pageY-40)+\'px\';" onMouseOut="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'none\'" style="color: #A00000;"><span style="font-weight: bold;">'+phaseTotals[prefix+'LT:CNT']+'</span><div id="'+comPre+'LT:TXT" style="'+toolTipCss+'" align="left"> '+phaseTotals[prefix+'LT:TXT']+' </div></span>';
				} else {
					newRow[compressedPhase] = newRow[compressedPhase]+'&nbsp;&nbsp;/&nbsp;&nbsp;-';
				}
			}
			portlet.addRow(newRow);
		}
	} else {
		nlapiLogExecution('ERROR','SRSProjectDashboards.generalManagerDashboard','No tasks found... returning message to that effect.');
		var errorMsg = new Object();
		errorMsg['sysmsg'] = 'Comport found no currently active tasks for any deal.';
		portlet.setTitle(dashboardTitle+' :: No Tasks Found');
		portlet.addColumn('sysmsg','text','Comport System Message','CENTER');
		portlet.addRow(errorMsg);
		return null;
	}
}

//
//managingDeptDashboard: 
//
function managingDeptDashboard(portlet, column) {
	nlapiLogExecution('DEBUG','SRSProjectDashboards.managingDeptDashboard','Starting managingDeptDashboard...');
	
	//var targetRoles = nlapiGetContext().getSetting('SCRIPT', 'custscript_proj_mgr_roles');
	var dashboardTitle = 'Active Deal Tasks';
	//var targetPhases = targetRoles.split(',');
	var phases = new Array();
	
	if(dashboardTitle == null) {
		dashboardTitle = 'Manager\'s Team Task Dashboard';
	}
	
	var phaseTotals = new Object();

	var result = null;
	
	result = nlapiSearchRecord('projecttask','customsearch_proj_task_dashboard_summary',null,null);

	
	//Now loop through the results.
	if(result != null) {
		nlapiLogExecution('DEBUG','SRSProjectDashboards.managingDeptDashboard','Got tasks... parsing them.');
		var resultColumns = getColumnsByName(result);
		var deals = new Array();
		var dealNames = new Object();
		
		//Get current roles
		var roleFilters = new Array();
		var roleColumns = new Array();
		var roleResult = null;
		
		roleFilters[0] = new nlobjSearchFilter('custevent_proj_task_managing_dept',null,'noneOf','@NONE@');
		roleFilters[1] = new nlobjSearchFilter('custentity_proj_is_template','job','is','F');
		roleFilters[2] = new nlobjSearchFilter('custevent_proj_task_is_active',null,'is','T');
		
		roleColumns[0] = new nlobjSearchColumn('custevent_proj_task_managing_dept',null,'group');
		roleResult = nlapiSearchRecord('projecttask',null,roleFilters,roleColumns);
		
		for(var gm1 = 0; roleResult != null && gm1 < roleResult.length; gm1++) {
			phases.push(roleResult[gm1].getText('custevent_proj_task_managing_dept',null,'group'));
		}
		
		//get unique deals and phases
		for(var tr1 = 0;tr1 < result.length;tr1++) {
			
			var currResult = result[tr1];
			var currPhase = currResult.getValue(resultColumns['mng_dept']);
			var currDeal = currResult.getValue(resultColumns['deal']);
			
			if(!isElementPresent(deals,currDeal)) {
				deals.push(currDeal);
				dealNames[currDeal] = currResult.getText(resultColumns['deal']);
			}
			
//			if(!isElementPresent(phases,currPhase)) {
//				phases.push(currPhase);
//			}
		}
		//setup result buckets.
		for(var tr2 = 0; tr2 < deals.length; tr2++) {
			for(var tr3 = 0; tr3 < phases.length; tr3++) {
				var prefix = deals[tr2]+':'+phases[tr3]+':';
				phaseTotals[prefix+'ACT:TXT'] = '<span style="font-weight: bold;">Active Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</span><br />';
				phaseTotals[prefix+'LT:TXT'] = '<span style="font-weight: bold;">Late Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</span><br />';
				phaseTotals[prefix+'ACT:CNT'] = 0;
				phaseTotals[prefix+'LT:CNT'] = 0;
			}
		}
		
		//Now really loop through the results and compile the totals
		for(var tr4 = 0; tr4 < result.length; tr4++) {
			var currResult = result[tr4];
			var currTextLine = currResult.getValue(resultColumns['task_id'])+': '+getTaskInfo(currResult.getValue(resultColumns['task_name']),'title')+', '+currResult.getText(resultColumns['resource'])+', Due: '+currResult.getValue(resultColumns['due_date'])+'<br />';
			var prefix = currResult.getValue(resultColumns['deal'])+':'+currResult.getText('custevent_proj_task_managing_dept')+':';
			nlapiLogExecution('DEBUG','SRSProjectDashboards.managingDeptDashboard','Managing Dept Text:'+currResult.getText(resultColumns['mng_dept'])+', Value: '+currResult.getValue(resultColumns['mng_dept']));
			if(currResult.getValue(resultColumns['is_late']) == 1) {
				//If the task is late, add it to the late bucket for the phase.
				phaseTotals[prefix+'LT:TXT'] = phaseTotals[prefix+'LT:TXT']+currTextLine;
				phaseTotals[prefix+'LT:CNT'] = phaseTotals[prefix+'LT:CNT']+1;
				nlapiLogExecution('DEBUG','SRSProjectDashboards.managingDeptDashboard','Constructed column:'+prefix+'LT:CNT');
			} else {
				//If not add it to the active bucket for the phase.
				phaseTotals[prefix+'ACT:TXT'] = phaseTotals[prefix+'ACT:TXT']+currTextLine;
				phaseTotals[prefix+'ACT:CNT'] = phaseTotals[prefix+'ACT:CNT']+1;
				nlapiLogExecution('DEBUG','SRSProjectDashboards.managingDeptDashboard','Trying to build portlet column:'+prefix+'ACT:CNT');
			}
		}
		
		
		
		//Finally display results.
		portlet.setTitle(dashboardTitle);
		
		portlet.addColumn('deal','text','Deal','CENTER');
		//add columns for each phase
		for(var tr5 = 0; tr5 < phases.length; tr5++) {
			var compressedPhase = phases[tr5].replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
			nlapiLogExecution('DEBUG','SRSProjectDashboards.managingDeptDashboard','Trying to build portlet column:'+compressedPhase);
			portlet.addColumn(compressedPhase,'text',phases[tr5],'CENTER');
		}
		
		//set up display elements.
		var toolTipCss = "color: #000000;background-color:#ffffc5;display: none;left:10px;padding:10px;position:absolute;top:10px;width:600px;text-decoration:none;z-index:100;";
		
		//Loop through the deals and add data appropriately.
		for(var dl1 = 0; dl1 < deals.length; dl1++) {
			var newRow = new Object();
			newRow['deal'] = '<a href="#" title="Click here to view the deal customer." onclick="Popup=window.open(\''+nlapiResolveURL('RECORD','customer',deals[dl1],'VIEW')+'&l=T'+'\',\'Popup\',\'toolbar=no, location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes, width=1200,height=600,left=50,top=50\'); return false;">'+dealNames[deals[dl1]]+'</a>';
			for(var dl2 = 0; dl2 < phases.length; dl2++) {
				var prefix = deals[dl1]+':'+phases[dl2]+':';
				var comPre = 'pre'+prefix.replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
				var compressedPhase = phases[dl2].replace(/\W*/g,'').toLowerCase().replace(/\s*/g,'');
				nlapiLogExecution('DEBUG','SRSProjectDashboards.managingDeptDashboard','Attemping active column:'+comPre);
				if(phaseTotals[prefix+'ACT:CNT'] > 0) {
					newRow[compressedPhase] = '<span onMouseOver="var x = document.getElementById(\''+comPre+'ACT:TXT\');x.style.display=\'block\';var offset = 0;if(event.pageX > 610){offset=600};x.style.left=(event.pageX-offset)+\'px\';x.style.top=(event.pageY-40)+\'px\';" onMouseOut="var x = document.getElementById(\''+comPre+'ACT:TXT\');x.style.display=\'none\'">'+phaseTotals[prefix+'ACT:CNT']+'<div id="'+comPre+'ACT:TXT" style="'+toolTipCss+'" align="left">'+phaseTotals[prefix+'ACT:TXT']+'</div></span>';
				} else {
					newRow[compressedPhase] = '-';
				}
				if(phaseTotals[prefix+'LT:CNT'] > 0) {
					newRow[compressedPhase] = newRow[compressedPhase]+'&nbsp;&nbsp;/&nbsp;&nbsp;<span onMouseOver="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'block\';var offset = 0;if(event.pageX > 610){offset=600};x.style.left=(event.pageX-offset)+\'px\';x.style.top=(event.pageY-40)+\'px\';" onMouseOut="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'none\'" style="color: #A00000;"><span style="font-weight: bold;">'+phaseTotals[prefix+'LT:CNT']+'</span><div id="'+comPre+'LT:TXT" style="'+toolTipCss+'" align="left"> '+phaseTotals[prefix+'LT:TXT']+' </div></span>';
				} else {
					newRow[compressedPhase] = newRow[compressedPhase]+'&nbsp;&nbsp;/&nbsp;&nbsp;-';
				}
			}
			portlet.addRow(newRow);
		}
	} else {
		nlapiLogExecution('ERROR','SRSProjectDashboards.managingDeptDashboard','No tasks found... returning message to that effect.');
		var errorMsg = new Object();
		errorMsg['sysmsg'] = 'Comport found no currently active tasks for any deal.';
		portlet.setTitle(dashboardTitle+' :: No Tasks Found');
		portlet.addColumn('sysmsg','text','Comport System Message','CENTER');
		portlet.addRow(errorMsg);
		return null;
	}
}