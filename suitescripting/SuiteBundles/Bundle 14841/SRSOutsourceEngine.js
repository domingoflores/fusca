/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
var ROLES = 
{
	SRS_Legal_Docket_Enterer: 1038
}

function assignDocketTeam()
{
	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "deal id:" + nlapiGetRecordId());
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('role', null, 'is', ROLES.SRS_Legal_Docket_Enterer));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
	var employees = nlapiSearchRecord('employee',null,filters,columns);
	
	if(employees == null || employees.length == 0) throw 'SRSOutsourceEngine.assignDocketTema - No employees found with role SRS_Legal_Docket_Enterer';
	
	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "number of employees found for role:" + employees.length);
	// get the list of docket employees
	var docketEmployees = new Array();
	for(var i = 0; i < employees.length; i++)
	{
		var employee = employees[i];
		docketEmployees.push(employee.getId());
	}
	
	var dealRcd = nlapiLoadRecord('customer',nlapiGetRecordId())
	
	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "number of current salesteam members :" + dealRcd.getLineItemCount('salesteam'));
	// loop through salesteam and make sure anyone is list of employees already is a member (for whatever reason, I do not know)
	for (var i = 1; i <= dealRcd.getLineItemCount('salesteam'); i++)
	{
		var currentTeamMember = dealRcd.getLineItemValue('salesteam','employee',i);
		for(var j = 0; j < docketEmployees.length; j++)
		{
			var docketEmployee = docketEmployees[j];
			if(docketEmployee == currentTeamMember)
			{
				docketEmployees.splice(j,1);
				break;
			}
		}
	}

	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "number of employees to add to salesteam :" + docketEmployees.length);
	
	// check if docketemployees is blank. If so, exit right here...
	if(docketEmployees.length == 0) return;
	var salesTeamCount = dealRcd.getLineItemCount('salesteam');
	
	// add the remaining docketEmployees to the salesteam
	for(var i = 0; i < docketEmployees.length; i++)
	{
		var docketEmployee = docketEmployees[i];
		salesTeamCount += 1;
		
		dealRcd.setLineItemValue('salesteam','employee',salesTeamCount,docketEmployee);
		dealRcd.setLineItemValue('salesteam','salesrole',salesTeamCount,'4');
		dealRcd.setLineItemValue('salesteam','isprimary',salesTeamCount,'F');
		dealRcd.setLineItemValue('salesteam','contribution',salesTeamCount,0);
	}
	
	nlapiSubmitRecord(dealRcd);
	
	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "fin ");
}

function removeDocketTeam()
{
	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "deal id:" + nlapiGetRecordId());
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('role', null, 'is', ROLES.SRS_Legal_Docket_Enterer));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
	var employees = nlapiSearchRecord('employee',null,filters,columns);
	
	if(employees == null || employees.length == 0) return;	// nothing more to do in this context

	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "number of employees found for role:" + employees.length);
	// get the list of docket employees
	var docketEmployees = new Array();
	for(var i = 0; i < employees.length; i++)
	{
		var employee = employees[i];
		docketEmployees.push(employee.getId());
	}
	
	var dealRcd = nlapiLoadRecord('customer',nlapiGetRecordId())
	
	nlapiLogExecution("DEBUG", "SRSOutsourceEngine.assignDocketTeam", "number of current salesteam members :" + dealRcd.getLineItemCount('salesteam'));
	// loop through employees and anyone in list of salesteam members
	for(var j = 0; j < docketEmployees.length; j++)
	{
		var docketEmployee = docketEmployees[j];
		for (var i = 1; i <= dealRcd.getLineItemCount('salesteam'); i++)
		{
			var currentTeamMember = dealRcd.getLineItemValue('salesteam', 'employee', i);
			if(docketEmployee != currentTeamMember) continue;
			
			dealRcd.removeLineItem('salesteam',i);
			break;
		}
	}
	nlapiSubmitRecord(dealRcd);
}
