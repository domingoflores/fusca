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
	var searchPhases = null
	
	filters[0] = new nlobjSearchFilter('company',null,'anyOf',67552);
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
				phaseTotals[prefix+'ACT:TXT'] = '<strong>Active Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</strong><br />';
				phaseTotals[prefix+'LT:TXT'] = '<strong>Late Tasks :: '+dealNames[deals[tr2]]+' :: '+phases[tr3]+'</strong><br />';
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
					newRow[compressedPhase] = newRow[compressedPhase]+'&nbsp;&nbsp;/&nbsp;&nbsp;<span onMouseOver="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'block\';var offset = 0;if(event.pageX > 610){offset=600};x.style.left=(event.pageX-offset)+\'px\';x.style.top=(event.pageY-40)+\'px\';" onMouseOut="var x = document.getElementById(\''+comPre+'LT:TXT\');x.style.display=\'none\'" style="color: #A00000;"><strong>'+phaseTotals[prefix+'LT:CNT']+'</strong><div id="'+comPre+'LT:TXT" style="'+toolTipCss+'" align="left"> '+phaseTotals[prefix+'LT:TXT']+' </div></span>';
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
		} else {
			returnArray[testCol.getName()] = testCol;
		}
		
	}
	
	return returnArray;
	
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