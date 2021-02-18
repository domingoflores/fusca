/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSProjectsLibrary.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2011/07/13
 *
 * Copyright (c) 2011 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
 
//
// teamMemberHasRole: This utility function checks to see if an existing deal team member has a role already assigned.
//
function teamMemberHasRole(teamMember,targetRoleId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.teamMemberHasRole','Starting teamMemberHasRole...');
	var returnVal = false;
	
	if(teamMember != null && teamMember.getFieldValues('custrecord_deal_team_role') != null && teamMember.getFieldValues('custrecord_deal_team_role').length > 0) {
		var tmRoles = teamMember.getFieldValues('custrecord_deal_team_role');
		for(var i = 0; i < tmRoles.length; i++) {
			if(tmRoles[i] == targetRoleId) {
				nlapiLogExecution('DEBUG','SRSProjectsLibrary.teamMemberHasRole','Role:'+targetRoleId+' found for team member: '+teamMember.getFieldValue('custrecord_deal_team_employee'));
				returnVal = true;
				break;
			}
		}
	}
	return returnVal;
}

//
// removeTeamMemberRole: Will remove a role from an existing deal team member record and return the record back to the caller.
//						 Note that this function does not save the record!
//
function removeTeamMemberRole(teamMember,targetRoleId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.removeTeamMemberRole','Starting removeTeamMemberRole...');
	if(teamMember != null && teamMember.getFieldValues('custrecord_deal_team_role') != null && teamMember.getFieldValues('custrecord_deal_team_role').length > 0) {
		var tmRoles = teamMember.getFieldValues('custrecord_deal_team_role');
		var newRoles = new Array();
		for(var i = 0; i < tmRoles.length; i++) {
			if(tmRoles[i] != targetRoleId) {
				newRoles.push(tmRoles[i]);
			} else {
				nlapiLogExecution('DEBUG','SRSProjectsLibrary.removeTeamMemberRole','Removing role:'+targetRoleId+' is removed from team member: '+teamMember.getFieldValue('custrecord_deal_team_employee'));
			}
		}
		teamMember.setFieldValues('custrecord_deal_team_role',newRoles);
	}
	return teamMember;
}

//
// addTeamMemberRole: Will add a role to an existing deal team member record and return the record back to the caller.
//						 Note that this function does not save the record!
//
function addTeamMemberRole(teamMember,targetRoleId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.addTeamMemberRole','Starting addTeamMemberRole...');
	if(teamMember != null && teamMember.getFieldValues('custrecord_deal_team_role') != null && teamMember.getFieldValues('custrecord_deal_team_role').length > 0) {
		var tmRoles = teamMember.getFieldValues('custrecord_deal_team_role');
		var newRoles = new Array(); //NetSuite has a bug related to using push() with the tmRoles array, so we have to create a new one... Yay! NetSuite case: 1285122
		var isAssigned = false
		for(var i = 0; i < tmRoles.length; i++) {
			newRoles.push(tmRoles[i]);
			 if(tmRoles[i] == targetRoleId) {
			 	isAssigned = true;
				nlapiLogExecution('DEBUG','SRSProjectsLibrary.addTeamMemberRole','Role:'+targetRoleId+' is already assigned to team member: '+teamMember.getFieldValue('custrecord_deal_team_employee'));
				break;
			 }
		}
		
		if(!isAssigned) {
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.addTeamMemberRole','Assigning role:'+targetRoleId+'  to team member: '+teamMember.getFieldValue('custrecord_deal_team_employee'));
			newRoles.push(targetRoleId);
			teamMember.setFieldValues('custrecord_deal_team_role',newRoles);
		}
	}
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.addTeamMemberRole','Returning updated team member.');
	return teamMember;
}

//
// teamMemberExists:  See if a team member already exists.  If so, return the extant team member.  If not then null.
//
function teamMemberExists(teamMember) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.teamMemberExists','Starting teamMemberExists...');
	if(teamMember != null) {
		var targetFilters = new Array();
		var targetColumns = new Array();
		var targetResults = null; 
		
		targetFilters[0] = new nlobjSearchFilter('custrecord_deal_team_employee',null,'is',teamMember.getFieldValue('custrecord_deal_team_employee'));
		targetFilters[1] = new nlobjSearchFilter('custrecord_deal_team_deal',null,'is',teamMember.getFieldValue('custrecord_deal_team_deal'));
		targetColumns[0] = new nlobjSearchColumn('internalid',null,null);
		targetResults = nlapiSearchRecord('customrecord_deal_project_team',null,targetFilters,targetColumns);
	}
	
	if(targetResults != null && targetResults.length > 0) {
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.teamMemberExists','Found at least one team member instance, returning true.');
		return nlapiLoadRecord('customrecord_deal_project_team', targetResults[0].getValue('internalid'));
	} else {
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.teamMemberExists','No pre-existing team member found, returning false.');
		return null;	
	}
}

//
// saveDealTeamMembers:  This function saves an array of team members as a complete team.  There is
//						 assumption that the team roles are pre-cleansed prior to running this
//						 function.
//
function saveDealTeamMembers(dealTeam) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.saveDealTeamMembers','Starting saveDealTeamMembers...');
	var problemSaving = false;
	for(var dtm1 = 0; dtm1 < dealTeam.length; dtm1++) {
				var saveTargetTm = dealTeam[dtm1];  //Not Defined Here!!! This will Blow Up!!!
				if(saveTargetTm != null && saveTargetTm.getFieldValues('custrecord_deal_team_role') != null && saveTargetTm.getFieldValues('custrecord_deal_team_role').length > 0) {
					//There are still roles so just save the team member.
					try {
						nlapiLogExecution('DEBUG','SRSProjectsLibrary.saveDealTeamMembers','Saving updated team member: '+saveTargetTm.getFieldValue('custrecord_deal_team_employee'));
						nlapiSubmitRecord(saveTargetTm);
				    } catch(err) {
							if(err instanceof nlobjError) {
								nlapiLogExecution('ERROR','SRSProjectsLibrary.saveDealTeamMembers','Problem saving updated team member. '+err.getCode()+'\n'+err.getDetails());
								problemSaving = true;
							} else {
								nlapiLogExecution('ERROR','SRSProjectsLibrary.saveDealTeamMembers','Problem saving updated team member. '+err.message);
								problemSaving = true;
							}
				    }
				} else {
					//There are no more remaining roles for the employee, so delete the deal team member record.
					try {
						nlapiLogExecution('DEBUG','SRSProjectsLibrary.saveDealTeamMembers','Deleting updated team member (for no roles): '+saveTargetTm.getFieldValue('custrecord_deal_team_employee')+'/'+saveTargetTm.getId());
						nlapiDeleteRecord('customrecord_deal_project_team',saveTargetTm.getId());
				    } catch(err) {
							if(err instanceof nlobjError) {
								nlapiLogExecution('ERROR','SRSProjectsLibrary.saveDealTeamMembers','Problem deleting updated team member. '+saveTargetTm.getId()+' '+err.getCode()+'\n'+err.getDetails());
								problemSaving = true;
							} else {
								nlapiLogExecution('ERROR','SRSProjectsLibrary.saveDealTeamMembers','Problem deleting updated team member. '+saveTargetTm.getId()+' '+''+err.message);
								problemSaving = true;
							}
				    }
				}
			}
	return problemSaving;
}

//
// getDealTeamMembers:  This functions takes a Deal ID and retrieves the list of deal team members
//                      as NetSuite search result objects.  If there are
//						no members, this returns null.  If there is no project for the deal it
//                      errors.
//
function getDealTeamMembers(dealId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.getDealTeamMembers','Starting getDealTeamMembers...');
		if(dealId != null) {
			var targetFilters = new Array();
			var targetColumns = new Array();
			var targetResults = null;
		
			targetFilters[0] = new nlobjSearchFilter('custrecord_deal_team_deal',null,'is',dealId);
			targetColumns[0] = new nlobjSearchColumn('custrecord_deal_team_employee',null,null);
			targetColumns[1] = new nlobjSearchColumn('custrecord_deal_team_role',null,null);
			targetResults = nlapiSearchRecord('customrecord_deal_project_team',null,targetFilters,targetColumns);
		}
		return targetResults;
}

//
// getDealTeamMemberRecords:  This functions takes the output of the getDealTeamMembers function and
//							  and returns nlobjRecord instances.
//
function getDealTeamMemberRecords(searchResults) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.getDealTeamMemberRecords','Starting getDealTeamMemberRecords...');
	var dealTeam = new Array();
	if(searchResults != null) {
			for(var sr1 = 0; sr1 < searchResults.length; sr1++) {
				dealTeam.push(nlapiLoadRecord('customrecord_deal_project_team',searchResults[sr1].getId()));
			}
	}
	return dealTeam;
}

//
// addTeamMember:  Takes a deal team and an uncommitted deal project team member record and
// 				   adds them to a deal team.  This process ensures roles are not duped.
//				   This process saves the deal team.
//
function addTeamMember(teamMember) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.addTeamMember','Starting addTeamMember...');
	
	if(teamMember != null) {
		//first does the team member exist.  If so, reconcile roles only.
		var extantTeamMember = teamMemberExists(teamMember);  //populated if the team member already exsits.
		
		var tmRoles = teamMember.getFieldValues('custrecord_deal_team_role');  
		
		if(extantTeamMember != null) {
		 	nlapiLogExecution('DEBUG','SRSProjectsLibrary.addTeamMember','Team Member Exists: What do they look like? tmRoles type: '+typeof(tmRoles)+' string rep: '+tmRoles.toString()+' tmRoles length:'+tmRoles.length);
		 	extantTeamMember = mergeTeamMemberRoles(extantTeamMember,tmRoles)
			//extantTeamMember.setFieldValues('custrecord_deal_team_role',tmRoles.unique(tmRoles.concat(extantTeamMember.getFieldValues('custrecord_deal_team_role')))); //This doesn't work due to NetSuite Array handing bugs.
			teamMember = extantTeamMember;
		}
		
		teamMember = nlapiLoadRecord('customrecord_deal_project_team',nlapiSubmitRecord(teamMember));
		//Now reconcile roles
		reconcileRoleAssignments(teamMember);
		reconcileTaskAssignments(teamMember);
		reconcileWorkflowAssignments(getTeamMemberProjectId(teamMember));
	}
	return null;
}

//
// deleteTeamMember:  Takes a deal team and removes the team member from the team, as well as
//					  unassigns any tasks assigned to it's roles.
//
function deleteTeamMember(teamMember,includeDelete) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.deleteTeamMember','Starting deleteTeamMember...');
	if(typeof(includeDelete) == 'undefined') {
		includeDelete = false;
	}
	var tmRoles = null;
	if(teamMember != null) {
		//first get references to the deal and the employee in question.
		 tmRoles = teamMember.getFieldValues('custrecord_deal_team_role');
		
		//next remove the roles of the team member:
		if(tmRoles != null && tmRoles.length > 0) {
			for(var dtm2 = 0; dtm2 < tmRoles.length; dtm2++) {
				teamMember = removeTeamMemberRole(teamMember, tmRoles[dtm2]);
			}
		}
		
		
		//then reconcile tasks for the team member.  this should remove all non-completed tasks from the employee.
		reconcileTaskAssignments(teamMember);
		
		//finally delete the team member record, so long as the calling function isn't doing it.
		if(includeDelete) {
			nlapiDeleteRecord('customrecord_deal_project_team',teamMember.getId());
		}
	}
	
	return null;
}

//
// reconcileTaskAssignments:  Ensures that, for a given team member and their existing roles, that
//							  the task list for the deal reflects their current assignments.  This
//							  function only operates on non-closed tasks.
//
//
function reconcileTaskAssignments(teamMember) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','Starting reconcileTaskAssignments...');
	if(teamMember != null) {
		var projectId = getTeamMemberProjectId(teamMember);
		if(projectId == null) {
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','No Project ID: Exit right away... no project means no tasks.');
			return null;  //exit right away if this is the case... no project means no tasks.
		}
		//NetSuite is lame enough that I can't do 'or' in criteria so I have two passes over the tasks.
		
		if(teamMember.getFieldValues('custrecord_deal_team_role') != null && teamMember.getFieldValues('custrecord_deal_team_role').length > 0) { //if there are no assigned roles... skip the first pass.
			
			//First pass is get the tasks that are associated with roles of the user.
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','First Pass Task Reconciliation: Role Reconciliation');
			var targetTask1Filters = new Array();
			var targetTask1Columns = new Array();
			var targetTasks1 = null;
			
			targetTask1Filters[0] = new nlobjSearchFilter('internalid','job','is',projectId);
			targetTask1Filters[1] = new nlobjSearchFilter('status',null,'noneof','COMPLETE');
			targetTask1Filters[2] = new nlobjSearchFilter('custevent_proj_task_deal_team_role',null,'anyof',teamMember.getFieldValues('custrecord_deal_team_role'));
			targetTask1Columns[0] = new nlobjSearchColumn('internalid');
			targetTask1Columns[1] = new nlobjSearchColumn('custevent_proj_task_deal_team_role');
			targetTasks1 = nlapiSearchRecord('projecttask',null,targetTask1Filters,targetTask1Columns);
			
			//Now make sure that the user is assigned to the correct tasks.
			if(targetTasks1 != null && targetTasks1.length > 0) {
				for(var tr1 = 0; tr1 < targetTasks1.length; tr1++) {
				nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.reconcileTaskAssignments', 'Checking remaining usage, first loop: ' + nlapiGetContext().getRemainingUsage());
					var isCurrTaskDirty = false;
					var currTask = nlapiLoadRecord('projecttask',targetTasks1[tr1].getId());
					if(currTask.getLineItemCount('assignee') > 0) {
						var tmPresent = false;
						//remove current holders of the task.
						for(var ct1 = 1; ct1  <= currTask.getLineItemCount('assignee'); ct1++) {
							nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','First Pass Task Reconciliation: Task Assignee Loop');
							if(currTask.getLineItemValue('assignee','resource',ct1) != teamMember.getFieldValue('custrecord_deal_team_employee')) {
								//nlapiSubmitRecord(removeTeamMemberRole(nlapiLoadRecord('customrecord_deal_project_team',currTask.getLineItemValue('assignee','resource',ct1)),currTask.getFieldValue('custevent_proj_task_deal_team_role')));
								currTask.removeLineItem('assignee',ct1);
								isCurrTaskDirty = true;
							} else {
								tmPresent = true;
							}
						}
						
						if(!tmPresent) {
							currTask.selectNewLineItem('assignee');
							currTask.setCurrentLineItemValue('assignee','resource',teamMember.getFieldValue('custrecord_deal_team_employee'));
							currTask.setCurrentLineItemValue('assignee', 'estimatedwork', currTask.getFieldValue('custevent_proj_task_target_time_est'));
							currTask.setCurrentLineItemValue('assignee', 'units', currTask.getFieldValue('custevent_proj_task_target_utilization'));
							currTask.setCurrentLineItemValue('assignee', 'unitcost', '0.00');
							currTask.commitLineItem('assignee');
							isCurrTaskDirty = true;
						}
					} else {
						currTask.selectNewLineItem('assignee');
						currTask.setCurrentLineItemValue('assignee','resource',teamMember.getFieldValue('custrecord_deal_team_employee'));
						currTask.setCurrentLineItemValue('assignee', 'estimatedwork', currTask.getFieldValue('custevent_proj_task_target_time_est'));
						currTask.setCurrentLineItemValue('assignee', 'units', currTask.getFieldValue('custevent_proj_task_target_utilization'));
						currTask.setCurrentLineItemValue('assignee', 'unitcost', '0.00');
						currTask.commitLineItem('assignee');
						isCurrTaskDirty = true;
					}
					
					if(isCurrTaskDirty) {
						try {
								nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','First Pass Task Reconciliation: Save Task Record');
								nlapiSubmitRecord(currTask);
							} catch(err) {
								if(err instanceof nlobjError) {
									nlapiLogExecution('ERROR','SRSProjectsLibrary.reconcileTaskAssignments','Couldn\'t save assignee task ID: '+currTask.getId()+', assignee id: '+teamMember.getFieldValue('custrecord_deal_team_employee')+' '+err.getCode()+'\n'+err.getDetails());
								} else {
									nlapiLogExecution('ERROR','SRSProjectsLibrary.reconcileTaskAssignments','Couldn\'t save reassigned task ID: '+currTask.getId()+', assignee id: '+teamMember.getFieldValue('custrecord_deal_team_employee')+' '+err.message);
								}
							}
					}
					
				}
			}
				
		}
			
		
		//Next pass we check to be sure that there are no tasks which are assigned to our team member
		//for which they don't properly possess the corresponding role.
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','Second Pass Task Reconciliation: Remove Old Assignments');
		var targetTask2Filters = new Array();
		var targetTask2Columns = new Array();
		var targetTasks2 = null;
		
		targetTask2Filters[0] = new nlobjSearchFilter('internalid','job','is',projectId);
		targetTask2Filters[1] = new nlobjSearchFilter('status',null,'noneof','COMPLETE');
		targetTask2Filters[2] = new nlobjSearchFilter('assignee',null,'anyof',teamMember.getFieldValue('custrecord_deal_team_employee'));
		if(teamMember.getFieldValues('custrecord_deal_team_role') != null && teamMember.getFieldValues('custrecord_deal_team_role').length > 0) { //turns out NetSuite doesn't like empty arrays in this search filter.  Only add if there are roles.
			targetTask2Filters[3] = new nlobjSearchFilter('custevent_proj_task_deal_team_role',null,'noneof',teamMember.getFieldValues('custrecord_deal_team_role'));
		}
		
		targetTask2Columns[0] = new nlobjSearchColumn('internalid');
		targetTask2Columns[1] = new nlobjSearchColumn('custevent_proj_task_deal_team_role');
		targetTasks2 = nlapiSearchRecord('projecttask',null,targetTask2Filters,targetTask2Columns);
		
		if(targetTasks2 != null && targetTasks2.length > 0) {//Skip second pass loop if there's no point in running it.
			//finally loop through these and remove the team member since they don't have these roles.
			for(var tr2 = 0; tr2 < targetTasks2.length; tr2++) {
				nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.reconcileTaskAssignments', 'Checking remaining usage, second loop: ' + nlapiGetContext().getRemainingUsage());
				var isCurrTaskDirty = false;
				var currTask = nlapiLoadRecord('projecttask',targetTasks2[tr2].getId());
				if(currTask.getLineItemCount('assignee') > 0) {
					var tmPresent = false;
					//remove team member from the task.
					for(var ct2 = 1; ct2  <= currTask.getLineItemCount('assignee'); ct2++) {
						nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','Second Pass Task Reconciliation: Task Assignee Loop');
						if(currTask.getLineItemValue('assignee','resource',ct2) == teamMember.getFieldValue('custrecord_deal_team_employee')) {
							currTask.removeLineItem('assignee',ct2);
							isCurrTaskDirty = true;
						}
					}
				}
				
				if(isCurrTaskDirty) {
					try {
							nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileTaskAssignments','Second Pass Task Reconciliation: Save Task Record');
							nlapiSubmitRecord(currTask);
						} catch(err) {
							if(err instanceof nlobjError) {
								nlapiLogExecution('ERROR','SRSProjectsLibrary.reconcileTaskAssignments','Couldn\'t save assignee task ID: '+currTask.getId()+', assignee id: '+teamMember.getFieldValue('custrecord_deal_team_employee')+' '+err.getCode()+'\n'+err.getDetails());
							} else {
								nlapiLogExecution('ERROR','SRSProjectsLibrary.reconcileTaskAssignments','Couldn\'t save reassigned task ID: '+currTask.getId()+', assignee id: '+teamMember.getFieldValue('custrecord_deal_team_employee')+' '+err.message);
							}
						}
				}
			}
		}
	}
	
	return null;
}

//
// reconcileRoleAssignments:  Ensures that for a given team member no other team member possesses
//							  their assigned roles.
//
function reconcileRoleAssignments(teamMember) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileRoleAssignments','Starting reconcileRoleAssignments...');
	
	if(teamMember != null && teamMember.getFieldValues('custrecord_deal_team_role') != null && teamMember.getFieldValues('custrecord_deal_team_role').length > 0) {
		var tmRoles = teamMember.getFieldValues('custrecord_deal_team_role');
		var dealTeam = getDealTeamMemberRecords(getDealTeamMembers(teamMember.getFieldValue('custrecord_deal_team_deal')));
		var cleansedDealTeam = new Array();
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileRoleAssignments','Deal Team Cleansing to begin.');
		for(var cdt1 = 0; cdt1 < dealTeam.length; cdt1++) {
			if(dealTeam[cdt1].getFieldValue('custrecord_deal_team_employee') != teamMember.getFieldValue('custrecord_deal_team_employee')) {
				cleansedDealTeam.push(dealTeam[cdt1]);
			}
		}
		
		if(cleansedDealTeam != null && cleansedDealTeam.length > 0) {
			for(var tmr1 = 0; tmr1 < tmRoles.length; tmr1++) {
				nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.reconcileRoleAssignments', 'Checking remaining usage: ' + nlapiGetContext().getRemainingUsage());
				var testMember = currentRoleAssignedTo(cleansedDealTeam,tmRoles[tmr1]);
				if(testMember != null && teamMember.getFieldValue('custrecord_deal_team_employee') !=  testMember.getFieldValue('custrecord_deal_team_employee')) {
					nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileRoleAssignments','For role: '+tmRoles[tmr1]+'; team member: '+testMember.getFieldValue('custrecord_deal_team_employee')+'; destined for: '+teamMember.getFieldValue('custrecord_deal_team_employee'));
					testMember = removeTeamMemberRole(testMember,tmRoles[tmr1]);
					nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileRoleAssignments','Role: '+tmRoles[tmr1]+' removed from member: '+testMember.getFieldValue('custrecord_deal_team_employee'));
					if(testMember.getFieldValues('custrecord_deal_team_role') != null && testMember.getFieldValues('custrecord_deal_team_role').length > 0 ) {
						nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileRoleAssignments','Saving: '+testMember.getFieldValue('custrecord_deal_team_employee'));
						nlapiSubmitRecord(testMember);
					} else {
						nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileRoleAssignments','Deleting: '+testMember.getFieldValue('custrecord_deal_team_employee'));
						deleteTeamMember(testMember, true);
					}
				}
			}
		}
	}
	return null;
}

//
//reconcileWorkflowAssignments:  Ensures that tasks that should 
//							  their assigned roles.
//
function reconcileWorkflowAssignments(projectId) {
	if(projectId == null || projectId == undefined || projectId < 1) {
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileWorkflowAssignments','There is no project identified, so no tasks to reconcile.');
		return null;
	}
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.reconcileWorkflowAssignments','Starting reconcileWorkflowAssignments...');
	var targetTaskColumns = new Array();
	var targetTaskFilters = new Array();
	var targetTaskResults = null;
	
	targetTaskFilters[0] = new nlobjSearchFilter('internalid','job','anyOf',projectId);
	targetTaskFilters[1] = new nlobjSearchFilter('assignee',null,'noneOf','@NONE@');
	targetTaskFilters[2] = new nlobjSearchFilter('internalid','workflow','anyOf','@NONE@');
	
	targetTaskColumns[0] = new nlobjSearchColumn('internalid',null,'group').setSort();
	
	targetTaskResults = nlapiSearchRecord('projecttask',null,targetTaskFilters,targetTaskColumns);
	
	if(targetTaskResults != null) {
		for(var iw1 = 0;iw1 < targetTaskResults.length; iw1++) {
			nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.reconcileWorkflowAssignments', 'Checking remaining usage, start workflows: ' + nlapiGetContext().getRemainingUsage());
			nlapiInitiateWorkflow('projecttask', targetTaskResults[iw1].getValue('internalid',null,'group'), 'customworkflow_proj_task_management');
		}
	}
}

//
// currentRoleAssignedTo:  Checks a deal team for a role assignment and if the role is assigned
//						   returns the team member that currently has the role.  If no team
//						   member is found then null is returned.
//
//
function currentRoleAssignedTo(dealTeam,roleId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.currentRoleAssignedTo','Starting currentRoleAssignedTo...');
	
	//Loop through the deal team members and check for the existence of the role.
	for(var dtm1 = 0; dtm1 < dealTeam.length; dtm1++) {
		if(teamMemberHasRole(dealTeam[dtm1],roleId)) {
			//We found one so lets return that.
			return dealTeam[dtm1];
		}
	}
	
	//If we made it this far, then there is no role assignment for this team member.  Return null.
	return null;
}

//
//getRoleAssignmentByRoleId:  For a given deal customer id and role internal id, find the team member
//						      that corresponds and return it, or return null if none found.
//
function getRoleAssignmentByRoleId(dealId,roleId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.getRoleAssignmentByRoleId','Starting getRoleAssignmentByRoleId...');
	
	if(dealId == null || dealId == undefined || roleId == null || roleId == undefined) {
		nlapiLogExecution('ERROR','SRSProjectsLibrary.getRoleAssignmentByRoleId','Parameters are bad... dealId: '+dealId+', roleId: '+roleId);
		return null;
	}
	
	//setup a simple search to find the record of interest.
	var filters = new Array();
	var columns = new Array();
	var results = null;
	
	filters[0] = new nlobjSearchFilter('custrecord_deal_team_deal',null,'anyOf',dealId);
	filters[1] = new nlobjSearchFilter('custrecord_deal_team_role',null,'anyOf',roleId);
	
	columns[0] = new nlobjSearchColumn('internalid');
	columns[1] = new nlobjSearchColumn('custrecord_deal_team_employee');
	
	results = nlapiSearchRecord('customrecord_deal_project_team',null,filters,columns);
	
	if(results != null) {
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.getRoleAssignmentByRoleId','Found record for employee: '+results[0].getText('custrecord_deal_team_employee'));
		return nlapiLoadRecord('customrecord_deal_project_team',results[0].getId());
	} else {
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.getRoleAssignmentByRoleId','Returning null, no matching Deal Team record found.');
		return null;
	}
}

//
// getProjectTaskRecords:  Takes a project task search result set and returns an array of the
//						   records represented in the search.  Otherwise returns null.
//
function getProjectTaskRecords(searchResults) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.getProjectTaskRecords','Starting getProjectTaskRecords...');
	var returnTasks = null;
	if(searchResults != null && searchResults.length > 0 && searchResults[0].getRecordType() == 'projecttask') {
		returnTasks = new Array();  //we passed the requirements, lets process.
		for(var sr1 = 0; sr1 < searchResults.length; sr1++) {
			returnTasks.push(nlapiLoadRecord('projecttask',searchResults[sr1].getId()));
		}
	}
	
	return returnTasks;
}

//
// mergeTeamMemberRoles:  Takes a team member and merges an array of roles into that team member's
//						  existing roles.  
//
function mergeTeamMemberRoles(teamMember,tmRoles) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.mergeTeamMemberRoles','Starting mergeTeamMemberRoles...');
	if(teamMember != null && tmRoles != null && tmRoles.length > 0) {
		for(var wa1 = 0; wa1 < tmRoles.length; wa1++) {
			teamMember = addTeamMemberRole(teamMember,tmRoles[wa1]);
		}
	}
	
	return teamMember;
}

//
// getTeamMemberProjectId:  Takes a team member and finds the corresponding project Internal ID.
//						    If there is no project to which the team member can belong, then 
//							add return null.
//
function getTeamMemberProjectId(teamMember) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.getTeamMemberProjectId','Starting getTeamMemberProjectId...');
	var projectId = null;
	if(teamMember != null) {
		var targetProject = nlapiLoadRecord('customer',teamMember.getFieldValue('custrecord_deal_team_deal'));
		projectId = targetProject.getFieldValue('custentity_deal_deal_project');
	}
	return projectId;
}

//
// createProjectFromTemplate:  Takes a template project record and makes a copy in a new,
//						       non-template record based on the other parameters.  Returns  
//							   the saved, new project record or null on failure.
//
function createProjectFromTemplate(templateProject, startDate, dealId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.createProjectFromTemplate','Starting createProjectFromTemplate...');
	if(templateProject != null && startDate != null && dealId != null) {
		var returnProject = nlapiCreateRecord('job');
		var dealRecord = nlapiLoadRecord('customer',dealId);
		returnProject.setFieldValue('startdate', startDate); //Set the new project's start date to be the same as the opportunity date.
        returnProject.setFieldValue('parent', dealId); //Set the deal for the project.
        returnProject.setFieldValue('companyname', '[dtsk] '+dealRecord.getFieldValue('companyname')); //Set the name of the project to be the same as the deal.
        returnProject.setFieldValue('custentity_proj_is_template', 'F'); //The new project is not a template project so set this to false.
        returnProject.setFieldValue('custentity_proj_template_type', null); //The new project is not a template so unset the template type.
        returnProject.setFieldValue('custentity_proj_task_copy_status', 'New Project Being Created... Don\'t Edit!'); //The new project is the target of being copied so make sure the status says this.
        returnProject.setFieldValue('customform',templateProject.getFieldValue('customform'));
        returnProject.setFieldValue('limittimetoassignees',templateProject.getFieldValue('limittimetoassignees'));
        returnProject.setFieldValue('isutilizedtime',templateProject.getFieldValue('isutilizedtime'));
        returnProject.setFieldValue('allowtime',templateProject.getFieldValue('allowtime'));
        returnProject.setFieldValue('allowallresourcesfortasks',templateProject.getFieldValue('allowallresourcesfortasks'));
        returnProject.setFieldValue('isproductivetime',templateProject.getFieldValue('isproductivetime'));
        returnProject.setFieldValue('allowexpenses',templateProject.getFieldValue('allowexpenses'));
        returnProject.setFieldValue('materializetime',templateProject.getFieldValue('materializetime'));
        returnProject.setFieldValue('includecrmtasksintotals',templateProject.getFieldValue('includecrmtasksintotals'));
        
        returnProject = nlapiLoadRecord('job',nlapiSubmitRecord(returnProject));
        nlapiLogExecution('DEBUG','SRSProjectsLibrary.createProjectFromTemplate','New Project: '+returnProject.getId()+' created, returning.');
        return returnProject;
	} else {
		nlapiLogExecution('ERROR','SRSProjectsLibrary.createProjectFromTemplate','Bad Parameters, returning null.');
		return null; // the parameters were wrong, so return null
	}
}


//
// createProjectTaskFromTemplate:  Takes a projecttask search result set and returns a newly created
//								   task based on the input.
//
function createProjectTaskFromTemplate(projectId,searchResult,placeHolderResourceId,caseId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.createProjectTaskFromTemplate','Starting createProjectTaskFromTemplate...');
	if(searchResult != null) {
		var returnTask = nlapiCreateRecord('projecttask');
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.createProjectTaskFromTemplate','Task values... projectId: '+projectId+' taskTitle: '+searchResult.getValue('title')+' Source Task Internal ID: '+searchResult.getId());
		returnTask.setFieldValue('company',projectId);
		var tempTitle = searchResult.getValue('title').split(':');
		returnTask.setFieldValue('title',tempTitle[tempTitle.length-1]); // Need to do this since I may get parent task titles in the search result.
		returnTask.setFieldValue('custevent_proj_task_deal_team_role',searchResult.getValue('custevent_proj_task_deal_team_role'));
		returnTask.setFieldValue('custevent_proj_task_duration',searchResult.getValue('custevent_proj_task_duration'));
		returnTask.setFieldValue('custevent_proj_task_est_hours_input',searchResult.getValue('custevent_proj_task_est_hours_input'));
		returnTask.setFieldValue('custevent_proj_task_dont_report',searchResult.getValue('custevent_proj_task_dont_report'));
		returnTask.setFieldValue('custevent_proj_task_successor_close',searchResult.getValue('custevent_proj_task_successor_close'));
		returnTask.setFieldValue('custevent_proj_task_is_active',searchResult.getValue('custevent_proj_task_is_active'));
		returnTask.setFieldValue('custevent_proj_task_managing_dept',searchResult.getValue('custevent_proj_task_managing_dept'));
		returnTask.setFieldValues('custevent_proj_task_docket_entry',searchResult.getValue('custevent_proj_task_docket_entry').split(','));
		returnTask.setFieldValues('custevent_proj_task_entity_status',searchResult.getValue('custevent_proj_task_entity_status').split(','));
		returnTask.setFieldValue('status','NOTSTART');
		
		if(searchResult.getValue('custevent_proj_task_dont_report') == 'T') {  //We need to set the assignee here since it will never be set at any other time if it's a placeholder task.
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.createProjectTaskFromTemplate','Task: '+searchResult.getId()+' is a placeholder task, setting placeholder resource.');
			returnTask.selectNewLineItem('assignee');
			returnTask.setCurrentLineItemValue('assignee','resource',placeHolderResourceId);
			returnTask.setCurrentLineItemValue('assignee', 'estimatedwork', searchResult.getValue('custevent_proj_task_target_time_est'));
			returnTask.setCurrentLineItemValue('assignee', 'units', searchResult.getValue('custevent_proj_task_target_utilization'));
			returnTask.setCurrentLineItemValue('assignee', 'unitcost', '0.00');
			returnTask.commitLineItem('assignee');
		}
		
		if(searchResult.getValue('custevent_proj_task_deal_team_role') != null && searchResult.getValue('custevent_proj_task_deal_team_role') != '' && caseId != null && caseId != undefined) {
			returnTask.setFieldValue('custevent_proj_task_related_case',caseId);  //If there is a Case record identified and the task is assignable, also assign the Case record.
		}
		
		returnTask = nlapiLoadRecord('projecttask',nlapiSubmitRecord(returnTask));
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.createProjectTaskFromTemplate','New Project Task: '+returnTask.getId()+' created, returning.');
		return returnTask;
	} else {
		nlapiLogExecution('ERROR','SRSProjectsLibrary.createProjectTaskFromTemplate','Bad Parameters, returning null.');
		return null; // the parameters were wrong, so return null
	}
}

//
// fullyReconcileProject:  Takes a deal id, project id and reconciles roles and tasks for the entire deal team.  If the 
//						   desired a final T/F param can also apply the standard task workflows.
//
function fullyReconcileProject(dealId,projectId,runInitWorkflow) {
	if(runInitWorkflow == undefined) {
		runInitWorkflow = false; //don't initialize workflow unless told to.
	}
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.fullyReconcileProject','Starting fullyReconcileProject...');
	var dealTeamRecords = getDealTeamMemberRecords(getDealTeamMembers(dealId));
	if(dealTeamRecords != null && dealTeamRecords.length > 0) {
		for(var fr1 = 0; fr1 < dealTeamRecords.length; fr1++) {
			nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.fullyReconcileProject', 'Checking remaining usage, reconcile deal team roles and tasks: ' + nlapiGetContext().getRemainingUsage());
			var currTm = dealTeamRecords[fr1];
			if(teamMemberExists(currTm) != null) {
				nlapiLogExecution('DEBUG','SRSProjectsLibrary.fullyReconcileProject','Reconciling team member: '+currTm.getFieldValue('name'));
				reconcileRoleAssignments(currTm);
				reconcileTaskAssignments(currTm);
			} else {
				nlapiLogExecution('DEBUG','SRSProjectsLibrary.fullyReconcileProject','Team member: '+currTm.getFieldValue('name')+' appears to no longer exist, skipping.');
			}
		}
		
		if(runInitWorkflow) {
			reconcileWorkflowAssignments(projectId);
		}
	}
}

//
// progressActiveFlags:   
//
//
function progressActiveFlags(projectTaskId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.progressActiveFlags','Starting progressActiveFlags...');
	
	var candidateTasks = new Array();  //This will hold arrays of dependencies for the task identified by the 'index'ed task #. This helps us be sure that mutli-dependency tasks are really open.
	
	//look up successors
	var successorFilters = new Array();
	var successorColumns = new Array();
	var successorResult = null;

	successorFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',projectTaskId);
	successorFilters[1] = new nlobjSearchFilter('internalid','successor','noneof','@NONE@');
	successorColumns[0] = new nlobjSearchColumn('internalid','successor');

	successorResult = nlapiSearchRecord('projecttask',null,successorFilters,successorColumns);
	
	if(successorResult != null) {
		//Create a date that represents 'now'.
		var d = new Date();
		var m = (d.getMonth())+1;
		var dd = d.getDate();
		var y = d.getFullYear();
		var now = m+'/'+dd+'/'+y;
		
		//if successors found, first see if they have child tasks.
		for (var sr1 = 0; sr1 < successorResult.length; sr1++) {
			candidateTasks.push(successorResult[sr1].getValue('internalid','successor'));
		}
		
		var successorChildren = getTaskChildren(candidateTasks);
		
		if(successorChildren != null) {
			//We found children of the successor tasks, so add them to the candidate list.
			for (var sr2 = 0; sr2 < successorChildren.length; sr2++) {
				candidateTasks.push(successorChildren[sr2]);
			}
		}
		
		//Now check to see if any of them should have the flag advanced.  If so, start them 'now'.
		for(var ct1 = 0; ct1 < candidateTasks.length; ct1++) {
			var testTask = candidateTasks[ct1];
			if(arePredecessorsCompleted(testTask)) {
				var currTask = nlapiLoadRecord('projecttask',testTask);
				if(currTask.getFieldValue('status') != 'COMPLETE' && currTask.getFieldValue('custevent_proj_task_is_active') != 'T' && currTask.getFieldValue('custevent_proj_task_important_date') != 'T') {
					nlapiLogExecution('DEBUG','SRSProjectsLibrary.progressActiveFlags','I am activating the task: '+testTask);
					currTask.setFieldValue('custevent_proj_task_is_active','T');
					currTask.setFieldValue('constrainttype','FIXEDSTART');
					currTask.setFieldValue('startdate',now);
					nlapiSubmitRecord(currTask);
				} else {
					nlapiLogExecution('DEBUG','SRSProjectsLibrary.progressActiveFlags','I was requested to activate task: '+testTask+', but am not as it\'s completed, already active or an important date. ('+currTask.getFieldValue('status')+'/'+currTask.getFieldValue('custevent_proj_task_is_active')+')');
				}
			} 
		}
	} 
	
	//With any successors taken care of, remove the active flag from the closed task.
	var completingTask = nlapiLoadRecord('projecttask',projectTaskId);
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.progressActiveFlags','Completing: '+completingTask.getId()+' as it is legitimately closed.');
	completingTask.setFieldValue('custevent_proj_task_is_active','F');
	nlapiSubmitRecord(completingTask);
}

//
// getTaskChildren:   
//
//
function getTaskChildren(projectTaskId) { //expect an Array here.
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.getTaskChildren','Starting getTaskChildren...');
	
	//setup final return variable
	var finalReturnResults = new Array();
	
	//look up child tasks
	var childTaskFilters = new Array();	
	var childTaskColumns = new Array();
	var childTaskResult = null;

	childTaskFilters[0] = new nlobjSearchFilter('parent',null,'anyof',projectTaskId);
	childTaskColumns[0] = new nlobjSearchColumn('internalid');
	

	childTaskResult = nlapiSearchRecord('projecttask',null,childTaskFilters,childTaskColumns);
	
	if(childTaskResult == null) {
		return null;
	} else {
		for (var ct2 = 0; ct2 < childTaskResult.length; ct2++) {
			finalReturnResults.push(childTaskResult[ct2].getId());
		}
	}
	
	//Compile search query for grandchild tasks.  Recursive call that bottoms out when there are no children found.
	var grandChildSearchId = new Array();
	
	for (var ct1 = 0; ct1 < childTaskResult.length; ct1++) {
		grandChildSearchId.push(childTaskResult[ct1].getId());
	}
	
	var grandChildTasks = getTaskChildren(grandChildSearchId);
	if(grandChildTasks != null) {
		for(var ct3 = 0;ct3 < grandChildTasks.length; ct3++) {
			finalReturnResults.push(grandChildTasks[ct3]);
		}
	}
	
	return finalReturnResults;
}



//
// arePredecessorsCompleted:   
//
//
function arePredecessorsCompleted(projectTaskId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.arePredecessorsCompleted','Starting arePredecessorsCompleted...');
	//First find any predecessors and get them into a concise list
	var predecessors = new Array();
	
	var predTaskFilters = new Array();	
	var predTaskColumns = new Array();
	var predTaskResult = null;

	predTaskFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',projectTaskId);
	predTaskFilters[1] = new nlobjSearchFilter('predecessors',null,'isnotempty',null);
	predTaskColumns[0] = new nlobjSearchColumn('internalid');
	predTaskColumns[1] = new nlobjSearchColumn('predecessor');
	
	predTaskResult = nlapiSearchRecord('projecttask',null,predTaskFilters,predTaskColumns);
	
	if(predTaskResult != null) { //if we found predecessors aggregate them into a single list and check their status, otherwise return false.
		for(var pc1 = 0;pc1 < predTaskResult.length;pc1++) {
			predecessors.push(predTaskResult[pc1].getValue('predecessor'));
		}
		//now see if any of the predecessors are still open.
		var compTaskFilters = new Array();	
		var compTaskColumns = new Array();
		var compTaskResult = null;

		compTaskFilters[0] = new nlobjSearchFilter('internalid',null,'anyof',predecessors);
		compTaskFilters[1] = new nlobjSearchFilter('status',null,'noneof','COMPLETE');
		compTaskColumns[0] = new nlobjSearchColumn('internalid');
		//compTaskColumns[1] = new nlobjSearchColumn('');
		
		compTaskResult = nlapiSearchRecord('projecttask',null,compTaskFilters,compTaskColumns);
		
		//If we have results, then there are open predecessors, otherwise they're all closed.
		if(compTaskResult != null) {
			//we have non-closed tasks so return false
			return false;
		} else {
			//all predecessor tasks are completed, return true.
			return true;
		}
	} else {
		//No predecessors found at all so return true.  A bit counter intuitive, but since false usually means waiting for predecessor, that's not the case without any.
		return true;
	}
}

//
//deleteProject:   this is a utility function designed to easily delete a project and any dependent records.
//
//
function deleteProject(projectId, transId) {
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.deleteProject','Starting deleteProject...');
	
	//first remove any existing time records
	var timeFilters = new Array();
	var timeColumns = new Array();
	var timeResults = null;
	
	timeFilters[0] = new nlobjSearchFilter('customer',null,'anyOf',projectId);
	timeColumns[0] = new nlobjSearchColumn('internalid');
	
	timeResults = nlapiSearchRecord('timebill',null,timeFilters,timeColumns);
	
	if(timeResults != null) {
		for(var t1 = 0;t1 < timeResults.length; t1++ ) {
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.deleteProject','Deleting Time Record: '+timeResults[t1].getId());
			nlapiDeleteRecord('timebill',timeResults[t1].getId());
		}
	}
	
	//next remove any associated opportunities.  Assumes opportunity stage: so associated sales order or invoice.
	if(transId != undefined && transId != null) {
		nlapiLogExecution('DEBUG','SRSProjectsLibrary.deleteProject','Dissociating opportunity: '+transId+' from project: '+projectId);
		var targetOpp = nlapiLoadRecord('opportunity',transId);
		targetOpp.setFieldValue('job',null);
		//targetOpp.setFieldValue('class',1); //be sure to remove for prod.
		nlapiSubmitRecord(targetOpp);
	}
	
	
	//remove all parent tasks (which should also remove the children)
	
	var ptFilters = new Array();
	var ptColumns = new Array();
	var ptResults = null;
	
	ptFilters[0] = new nlobjSearchFilter('company',null,'anyOf',projectId);
	ptFilters[1] = new nlobjSearchFilter('parent',null,'anyOf','@NONE@');
	ptColumns[0] = new nlobjSearchColumn('internalid');
	
	ptResults = nlapiSearchRecord('projecttask',null,ptFilters,ptColumns);
	
	if(ptResults != null) {
		for(var pt1 = 0;pt1 < ptResults.length; pt1++ ) {
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.deleteProject','Deleting Project Task Record: '+ptResults[pt1].getId());
			nlapiDeleteRecord('projecttask',ptResults[pt1].getId());
		}
	}
	
	//finally delete the project itself.
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.deleteProject','Deleting Project Record: '+projectId);
	try { 
			nlapiDeleteRecord('job',projectId); 
		} catch(err) {
			if(err instanceof nlobjError) {
				nlapiLogExecution('ERROR','SRSProjectsLibrary.deleteProject','Problem deleting project... '+err.getCode()+'\n'+err.getDetails()+' May have a Sales Order or Invoice.');
			} else {
				nlapiLogExecution('ERROR','SRSProjectsLibrary.deleteProject','Problem saving updated team member. '+err.message+' May have a Sales Order or Invoice.');
			}
		}
	
	
}

//
//getProjectPhase:   Assuming that the top level parent task represents 'phase', this routine retrieves it.
//
//
function getTaskInfo(projectTitle,taskPart) {
	
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.getTaskInfo','Starting getTaskInfo...');
	var taskTitleSegments = null;
	
	if(taskPart == undefined || taskPart == null) {
		taskPart = 'phase';
	}
	
	if(projectTitle == null) {
		return null;
	} else {
		taskTitleSegments = projectTitle.split(' : ');
	}
	
	switch (taskPart.toLowerCase()) {
		case 'phase':
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.getTaskInfo','Extracting Phase.');
			return taskTitleSegments[0];
		case 'title':
			nlapiLogExecution('DEBUG','SRSProjectsLibrary.getTaskInfo','Extracting Title.');
			return taskTitleSegments[taskTitleSegments.length-1];
		default: 
			nlapiLogExecution('ERROR','SRSProjectsLibrary.getTaskInfo','Invalid value for taskPart: '+taskPart.toLowerCase());
			return null;
	}
}

//
//bookTimeOnTaskComplete: sets a time on a task to fully completed.  Used to facilitate
//				 just setting a status without having to book time related to the
//				 task.  Presumes that estimated time is fully used (no time variance) and 
//				 that the assigned resources are the ones that did the work.
//
function bookTimeOnTaskComplete(targetTask){
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.bookTimeOnTaskComplete', 'Completing project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' including booking time.');
	
	//create time entries
	for(var i = 1; i <= targetTask.getLineItemCount('assignee');i++) {
		var targetTimeEntry = nlapiCreateRecord('timebill');
		targetTimeEntry.setFieldValue('casetaskevent',targetTask.getId());
		targetTimeEntry.setFieldValue('customer',targetTask.getFieldValue('company'));
		targetTimeEntry.setFieldValue('employee',targetTask.getLineItemValue('assignee','resource',i));
		targetTimeEntry.setFieldValue('trandate',nlapiDateToString(new Date(),'date'));
		targetTimeEntry.setFieldValue('hours',targetTask.getLineItemValue('assignee','estimatedwork',i));
		targetTimeEntry.setFieldValue('memo','Automatically Created Entry From Project Task Workflow.');
		targetTimeEntry.setFieldValue('supervisorapproval','T');
		targetTimeEntry.setFieldValue('isbillable','F');
		//targetTimeEntry.setFieldValue('class',1);  //TODO: commented out for production since classes are not yet implemented there.
     targetTimeEntryId = nlapiSubmitRecord(targetTimeEntry);
	}
	
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.bookTimeOnTaskComplete', 'Project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' completed with time bookings.');
}

//
//closeFlaggedPredecessors: sets a time on a task to fully completed.  Used to facilitate
//				 just setting a status without having to book time related to the
//				 task.  Presumes that estimated time is fully used (no time variance) and 
//				 that the assigned resources are the ones that did the work.
//
function closeFlaggedPredecessors(projectTask) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.closeFlaggedPredecessors', 'Starting closeFlaggedPredecessors...');
	//Check for predecessors flagged to close on this task's closing.
	var predTasksFilters = new Array();
	var predTasksColumns = new Array();
	var predTasksResult = null;
	
	predTasksFilters[0] = new nlobjSearchFilter('internalid',null,'is',projectTask.getId());
	predTasksFilters[1] = new nlobjSearchFilter('custevent_proj_task_successor_close','predecessor','is','T');
	predTasksFilters[2] = new nlobjSearchFilter('status','predecessor','noneof','COMPLETE');
	
	predTasksColumns[0] = new nlobjSearchColumn('internalid','predecessor',null);
	
	predTasksResult = nlapiSearchRecord('projecttask',null,predTasksFilters,predTasksColumns);
	if(predTasksResult != null && predTasksResult.length > 0) {
		nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.completeTask', 'Project task: ' +projectTask.getId()+'/'+ projectTask.getFieldValue('title') + ' has predecessors '+predTasksResult.length+' marked to close.');
		for(var t = 0; t < predTasksResult.length; t++) {
			var predTask = nlapiLoadRecord('projecttask',predTasksResult[t].getValue('internalid','predecessor',null));
			predTask.setFieldValue('status','COMPLETE');
			predTask.setFieldValue('message','This task is completed because its successor task has been completed and this task was marked close on successor\'s close.');
			nlapiSubmitRecord(predTask);
			nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.closeFlaggedPredecessors', 'Predecessor Project task: ' +predTask.getId()+'/'+ predTask.getFieldValue('title') + ' successfully closed.');
		}
	}
}

//
//getPhaseByName: Retrieves a deal project phase task id by the title of the task.
//
function getPhaseByName(projectId, phaseName) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.getPhaseByName', 'Starting getPhaseByName... looking in project: '+projectId+' for Phase: '+phaseName+'.');
	
	var filters = new Array();
	var columns = new Array();
	var result = null;
	
	filters[0] = new nlobjSearchFilter('company',null,'anyOf',projectId);
	filters[1] = new nlobjSearchFilter('title',null,'is',phaseName);
	
	columns[0] = new nlobjSearchColumn('internalid');
	
	result = nlapiSearchRecord('projecttask',null,filters,columns);
	
	if(result != null && result.length == 1) {
		return result[0].getId();
	} else if (result != null && result.length != 1) {
		nlapiLogExecution('ERROR', 'SRSProjectsLibrary.getPhaseByName', 'Found '+result.length+' tasks for phase name: '+phaseName);
		return null;
	} else {
		nlapiLogExecution('ERROR', 'SRSProjectsLibrary.getPhaseByName', 'Didn\'t find a phase by '+phaseName);
		return null;
	}
}


//
//resolveActiveFlags: This resolves a possible NetSuite bug related to all scripts not being fired.
//					  This is intended to be a scheduled script run regularly.
//
function resolveActiveFlags() {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.resolveActiveFlags', 'Starting resolveActiveFlags...');
	var continueRun = true;
	
	while(continueRun) {
		var filters = new Array();
		var columns = new Array();
		var result = null;
	    
		filters[0] = new nlobjSearchFilter('status',null,'anyOf','COMPLETE');
		filters[1] = new nlobjSearchFilter('custevent_proj_task_is_active',null,'is','T');

		columns[0] = new nlobjSearchColumn('internalid');
		nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.resolveActiveFlags', 'Reaching resolveActiveFlags...');
		result = nlapiSearchRecord('projecttask',null,filters,columns);
		nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.resolveActiveFlags', 'Reaching b resolveActiveFlags...');
		if(result != null) {
		   for(var nw1 = 0; nw1 < result.length; nw1++) {
			   nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.resolveActiveFlags', 'Cleaning up task: '+result[nw1].getId()+'.');
		       progressActiveFlags(result[nw1].getId());
		   }
		} else {
			continueRun = false;
		}
	}
	
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.resolveActiveFlags', 'Ending resolveActiveFlags...');
}

//
//completeTaskById: sets a time on a task to fully completed.  Used to facilitate
//				 just setting a status without having to book time related to the
//				 task.  Presumes that estimated time is fully used (no time variance) and 
//				 that the assigned resources are the ones that did the work.
//
function completeTaskById(targetTaskId) {
	//Get passed parameters
	
	//Get instance of the task
	var targetTask = nlapiLoadRecord('projecttask',targetTaskId);
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.completeTaskById', 'Completing project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' including booking time.');
	
	bookTimeOnTaskComplete(targetTask); 
	
	//change task status
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.completeTaskById', 'Do I need to change status to COMPLETE? Current status is: '+targetTask.getFieldValue('status'));
	if(targetTask.getFieldValue('status') != 'COMPLETE') {
		targetTask.setFieldValue('status','COMPLETE');
		nlapiSubmitRecord(targetTask);
	}
	
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.completeTaskById', 'Project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' completed with time bookings.');
	
	closeFlaggedPredecessors(targetTask);
	
	//Finally move active flags.
	progressActiveFlags(targetTask.getId());
}

//
//cancelProjectTasks: allows all remaining, non-completed tasks to be canceled, such as would need
//				      to be done when we lose a deal.
//
function cancelProjectTasks(projectId) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.cancelProjectTasks', 'Starting cancelProjectTasks for project: '+projectId);

	var filters = new Array();
	var columns = new Array();
	var result = null;
	
	filters[0] = new nlobjSearchFilter('status',null,'noneOf','COMPLETE');
	filters[1] = new nlobjSearchFilter('company',null,'anyOf',projectId);
	//filters[2] = new nlobjSearchFilter('custevent_proj_task_deal_team_role',null,'noneOf','@NONE@',null,1,0,true,false);
	//filters[3] = new nlobjSearchFilter('custevent_proj_task_dont_report',null,'is','T',null,0,1,true,false);
	
	columns[0] = new nlobjSearchColumn('internalid');
	
	result = nlapiSearchRecord('projecttask',null,filters,columns);
	
	//if there are resuls, loop through them and cancel any time for any assignees and 'COMPLETE' the task.
	if(result != null) {
		for(var i = 0; i < result.length; i++) {
			var currTask = nlapiLoadRecord('projecttask',result[i].getId());
			
			for(var ct1 = 1; ct1 <= currTask.getLineItemCount('assignee');ct1++) {
				
				
				try {
					currTask.selectLineItem('assignee',ct1);
					currTask.setCurrentLineItemValue('assignee','estimatedwork',0.00);
					currTask.commitLineItem('assignee');
					
					nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.cancelProjectTasks', 'Successfully cancelled task assignee line for task: '+ currTask.getId() + ' and employee: '+currTask.getLineItemValue('assignee','resource',ct1)+'.');
		        } 
		        catch (err) {
		            nlapiLogExecution('ERROR', 'SRSProjectsLibrary.cancelProjectTasks', 'Problem cancelling time for target task: ' +currTask.getId()+' employee: '+currTask.getLineItemValue('assignee','resource',ct1)+' with error '+ err.description);
		        }
			}
			
			//change task status
			currTask.setFieldValue('status','COMPLETE');
			currTask.setFieldValue('custevent_proj_task_is_active','F');
			currTask.setFieldValue('custevent_proj_task_cancel_mark','T');
			currTask.setFieldValue('message','This task has been cancelled since the deal was lost or otherwise cancelled.');
			nlapiSubmitRecord(currTask);
		
			nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.cancelProjectTasks', 'Project task: ' +currTask.getId()+'/'+ currTask.getFieldValue('title') + ' successfully cancelled.');
			
			
			
			
			
			//Cancel any time for any assignees
			
		}
	}
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.cancelProjectTasks', 'Ending cancelProjectTasks for project.');
}

//
//copyRecurringTaskFromParent: Copy the fields from the parent, with the exception of the date field.
//
//
function copyRecurringTaskFromParent(parentTask,taskTitle,taskDate) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.copyRecurringTaskFromParent', 'Starting copyRecurringTaskFromParent for parentTask: '+parentTask.getFieldValue('title')+', project: '+parentTask.getFieldText('company'));
	var returnTask = nlapiCreateRecord('projecttask');
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.copyRecurringTaskFromParent','Task values... projectId: '+parentTask.getFieldValue('company')+' taskTitle: '+taskTitle+' taskDate: '+taskDate);
	returnTask.setFieldValue('company',projectId);
	returnTask.setFieldValue('parent',parentTask.getId());
	returnTask.setFieldValue('title',taskTitle);
	returnTask.setFieldValue('status','NOTSTART');
	returnTask.setFieldValue('constrainttype','FIXEDSTART');
	returnTask.setFieldValue('startdate',nlapiDateToString(taskDate));
	returnTask.setFieldValue('message',parentTask.getFieldValue('message'));
	returnTask.setFieldValue('customform',parentTask.getFieldValue('customform'));
	returnTask.setFieldValue('custevent_proj_task_important_date','T');
	//	returnTask.setFieldValue('custevent_proj_task_deal_team_role',searchResult.getValue('custevent_proj_task_deal_team_role'));
	//	returnTask.setFieldValue('custevent_proj_task_duration',searchResult.getValue('custevent_proj_task_duration'));
	//	returnTask.setFieldValue('custevent_proj_task_est_hours_input',searchResult.getValue('custevent_proj_task_est_hours_input'));
	//	returnTask.setFieldValue('custevent_proj_task_dont_report',searchResult.getValue('custevent_proj_task_dont_report'));
	//	returnTask.setFieldValue('custevent_proj_task_successor_close',searchResult.getValue('custevent_proj_task_successor_close'));
	//	returnTask.setFieldValue('custevent_proj_task_is_active',searchResult.getValue('custevent_proj_task_is_active'));
	//	returnTask.setFieldValue('custevent_proj_task_managing_dept',searchResult.getValue('custevent_proj_task_managing_dept'));
	return returnTask;
}

//
//setRecurrentTasks: Sets up recurring tasks based on given parent task.  The parent is also the template.
//
//
function setRecurrentTasks(parentTask,recurrenceType,endByDate) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.getRecurrentTasks', 'Starting getRecurrentTasks for parentTask: '+parentTask.getFieldValue('title')+', project: '+parentTask.getFieldText('company'));
	
	var today = new Date();
	
	//first determine what the recurrence type is and then go from there.
	switch(recurrenceType) {
	case 'annual_start':
		//use the date from the current task as the starting point.  So long as it's not in the past.
		var parentStartDate = nlapiStringToDate(parentTask.getFieldValue('startdate'));
		parentStartDate.setDate(1);
		parentStartDate.setMonth(0);
		
		if(today < parentStartDate) {
			var tempPTitle = parentTask.getFieldValue('title').split(':');
			tempPTitle = tempPTitle[tempPTitle.length-1]+'; '+nlapiDateToString(parentStartDate);
			var parentStartTask = copyRecurringTaskFromParent(parentTask,tempPTitle,parentStartDate);
			nlapiSubmitRecord(parentStartTask);
		}
		
		
		break;
	case 'annual':
		break;
	case 'annual_end':
		break;
	case 'quarter_start':
		break;
	case 'quarter':
		break;
	case 'quarter_end':
		break;
	case 'month_start':
		break;
	case 'month':
		break;
	case 'month_end':
		break;
	case 'week':
		break;
	default:
		nlapiLogExecution('ERROR', 'SRSProjectsLibrary.getRecurrentTasks', 'Failed to find an appropriate way to handle recurrence type: '+recurrenceType);
	}
}

//
//simpleCopyTask: Makes a simple copy of a project task.
//
//
function simpleCopyTask(sourceTaskId,destProjectId,destParentTaskId,saveCopiedTask) {
	if(typeof saveCopiedTask == undefined || saveCopiedTask == null) {
		saveCopiedTask = false;
	}
	
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.simpleCopyTask', 'Starting simpleCopyTask from sourceTask: '+sourceTaskId+' to destProjectId: '+destProjectId+' and destParentTaskId: '+destParentTaskId);
	var returnTask = nlapiCreateRecord('projecttask');
	var sourceTask = nlapiLoadRecord('projecttask',sourceTaskId);
	if(typeof destParentTaskId == undefined) {
		destParentTaskId == null;
	}
	if(typeof destProjectId == undefined || destProjectId == null) {
		destProjectId == sourceTask.getFieldValue('destProjectId');
	}
	
	nlapiLogExecution('DEBUG','SRSProjectsLibrary.simpleCopyTask','Source record title: '+sourceTask.getFieldValue('title')+' / internal id: '+sourceTask.getId());
	returnTask.setFieldValue('company',destProjectId);
	returnTask.setFieldValue('parent',destParentTaskId);
	returnTask.setFieldValue('title',sourceTask.getFieldValue('title'));
	returnTask.setFieldValue('status','NOTSTART'); //copied tasks should be not started.
	returnTask.setFieldValue('constrainttype',sourceTask.getFieldValue('constrainttype'));
	returnTask.setFieldValue('custevent_proj_task_deal_team_role',sourceTask.getFieldValue('custevent_proj_task_deal_team_role'));
	returnTask.setFieldValue('custevent_proj_task_managing_dept',sourceTask.getFieldValue('custevent_proj_task_managing_dept'));
	returnTask.setFieldValue('startdate',sourceTask.getFieldValue('startdate'));
	returnTask.setFieldValue('message',sourceTask.getFieldValue('message'));
	returnTask.setFieldValue('customform',sourceTask.getFieldValue('customform'));
	returnTask.setFieldValue('custevent_proj_task_important_date',sourceTask.getFieldValue('custevent_proj_task_important_date'));
	returnTask.setFieldValue('custevent_proj_task_class',sourceTask.getFieldValue('custevent_proj_task_class'));
	returnTask.setFieldValue('custevent_proj_task_cancel_mark',sourceTask.getFieldValue('custevent_proj_task_cancel_mark'));
	returnTask.setFieldValue('custevent_proj_task_docket_entry',sourceTask.getFieldValue('custevent_proj_task_docket_entry'));
	returnTask.setFieldValue('custevent_proj_task_entity_status',sourceTask.getFieldValue('custevent_proj_task_entity_status'));
	returnTask.setFieldValue('custevent_proj_task_est_hours_input',sourceTask.getFieldValue('custevent_proj_task_est_hours_input'));
	returnTask.setFieldValue('custevent_proj_task_successor_close',sourceTask.getFieldValue('custevent_proj_task_successor_close'));
	returnTask.setFieldValue('custevent_proj_task_duration',sourceTask.getFieldValue('custevent_proj_task_duration'));
	returnTask.setFieldValue('custevent_proj_task_dont_report',sourceTask.getFieldValue('custevent_proj_task_dont_report'));
	if(saveCopiedTask) {
		returnTask = nlapiLoadRecord('projecttask',nlapiSubmitRecord(returnTask));
		var dealTeamMember = getRoleAssignmentByRoleId(getDealIdFromProject(destProjectId),sourceTask.getFieldValue('custevent_proj_task_deal_team_role'));
		if(dealTeamMember != null) {
			reconcileRoleAssignments(dealTeamMember);//note that if !saveCopiedTask, caller must set workflows itself.
			reconcileTaskAssignments(dealTeamMember);
			reconcileWorkflowAssignments(destProjectId);
		}
	}
	
	return returnTask;
}

//
//getDealIdFromProject: Get a deal customer Internal ID from a given project number internal ID.
//						Return null if none found.				      
//
function getDealIdFromProject(projectId) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.getDealIdFromProject', 'Starting getDealIdFromProject with projectId: '+projectId+'.');
	if(projectId != null && projectId != undefined) {
		var targProject = nlapiLoadRecord('job',projectId);
		nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.getDealIdFromProject', 'Returning deal id: '+targProject.getFieldValue('parent')+'.');
		return targProject.getFieldValue('parent');
	}
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.getDealIdFromProject', 'Returning nothing.  Bad Parameter.');
	return null;
	
}


//
//convertImportantDates:  A function that takes a list of old style important dates and converts them to the new style project task driven dates.
//						  puts the internalid of the new dates into the externalid of the old event record.
//
function convertImportantDate(oldDateSearch,targProjId,targParentTask,managingDeptId) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.convertImportantDate', 'Starting convertImportantDate with targProjId: '+targProjId+', Parent Task: '+targParentTask+' for Date: '+oldDateSearch.getId()+' and usage left: '+nlapiGetContext().getRemainingUsage());
	var oldDateRec = nlapiLoadRecord('calendarevent',oldDateSearch.getId());
	var newProjectTask = nlapiCreateRecord('projecttask');
	newProjectTask.setFieldValue('customform','40'); //Important Date Form
	newProjectTask.setFieldValue('constrainttype','FIXEDSTART');
	newProjectTask.setFieldValue('company',targProjId);
	newProjectTask.setFieldValue('parent',getPhaseByName(targProjId,targParentTask));
	newProjectTask.setFieldValue('title',oldDateRec.getFieldValue('title'));
	newProjectTask.setFieldValue('startdate',oldDateRec.getFieldValue('startdate'));
	newProjectTask.setFieldValue('message',oldDateRec.getFieldValue('custevent30'));
	newProjectTask.setFieldValue('custevent_proj_task_managing_dept',managingDeptId);
	newProjectTask.setFieldValue('custevent_proj_task_important_date','T');
	
	var newTaskId = nlapiSubmitRecord(newProjectTask);
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.convertImportantDate', 'New date task saved as ID: '+newTaskId);
	oldDateRec.setFieldValue('externalid','PROJ_TASK_'+newTaskId);
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.convertImportantDate', 'Saving old date '+oldDateRec.getId()+' with external id of: '+newTaskId);
	nlapiSubmitRecord(oldDateRec);
}

//
//convertDealImportantDates: a function to get the important dates for a given deal (or array of deals) and convert them to the new style.
//
function convertDealImportantDates(dealId,dateParentTask,managingDeptId) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.convertDealImportantDates', 'Starting convertDealImportantDates with dealId: '+dealId+'. (Arrays are OK)');
	var fOldDates = new Array();
	var cOldDates = new Array();
	var rOldDates = null;

	fOldDates[0] = new nlobjSearchFilter('attendee',null,'anyOf',dealId);
	fOldDates[1] = new nlobjSearchFilter('status',null,'anyOf','CONFIRMED');
	fOldDates[2] = new nlobjSearchFilter('externalid',null,'anyOf','@NONE@');

	cOldDates[0] = new nlobjSearchColumn('internalid');
	cOldDates[1] = new nlobjSearchColumn('title');
	cOldDates[2] = new nlobjSearchColumn('company');
	cOldDates[3] = new nlobjSearchColumn('startdate');
	cOldDates[4] = new nlobjSearchColumn('custevent30');

	rOldDates = nlapiSearchRecord('calendarevent',null,fOldDates,cOldDates);
	
	//Now that we have results for the dates, get the project IDs for the deals in question.
	var fDealProj = new Array();
	var cDealProj = new Array();
	var rDealProj = null;

	fDealProj[0] = new nlobjSearchFilter('internalid',null,'anyOf',dealId);

	cDealProj[0] = new nlobjSearchColumn('internalid');
	cDealProj[1] = new nlobjSearchColumn('custentity_deal_deal_project');
	
	rDealProj = nlapiSearchRecord('customer',null,fDealProj,cDealProj);
	
	var dealProjMap = new Object();
	
	if(rDealProj != null) {
		for(var dpm = 0; dpm < rDealProj.length;dpm++) {
			dealProjMap[rDealProj[dpm].getId()] = rDealProj[dpm].getValue('custentity_deal_deal_project');
		}
	}
	
	if(rOldDates != null) {
		for(var rod = 0; rod < rOldDates.length;rod++) {
			var currDate = rOldDates[rod];
			nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.convertDealImportantDates', 'Remaining Usage at: '+nlapiGetContext().getRemainingUsage());
			if(nlapiGetContext().getRemainingUsage() < 50) {
				nlapiLogExecution('ERROR', 'SRSProjectsLibrary.convertDealImportantDates', 'Aborting as script usage is now below 50.');
				return null;
			}
			if(dealProjMap[currDate.getValue('company')] != null || dealProjMap[currDate.getValue('company')] != undefined) {
				nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.convertDealImportantDates', 'Trying date: '+currDate.getId());
				convertImportantDate(currDate,dealProjMap[currDate.getValue('company')],dateParentTask,managingDeptId);
			} else {
				nlapiLogExecution('ERROR', 'SRSProjectsLibrary.convertDealImportantDates', 'Date: '+currDate.getId()+' for deal '+currDate.getValue('company')+' had no mapped project.  Date not created.');
			}
		}
	}
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.convertDealImportantDates', 'Ending convertDealImportantDates.');
}

//
//setProjectName: Renames a deal project to a provided name.  Takes a project id and a new name.  Minimum new name length of three characters.
//
function setProjectName(projectId,newProjectName) {
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.setProjectName', 'Starting setProjectName...');
	if(projectId != null && projectId != undefined && newProjectName != null && newProjectName != undefined && newProjectName.length > 3) {
		var targetProject = nlapiLoadRecord('job',projectId);
		if(targetProject != null) {
			nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.setProjectName', 'Found project'+projectId+', changing name to: '+newProjectName);
			targetProject.setFieldValue('companyname',newProjectName);
			nlapiSubmitRecord(targetProject);
			nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.setProjectName', 'Name changed.');
		} else {
			nlapiLogExecution('ERROR', 'SRSProjectsLibrary.setProjectName', 'No project: '+projectId+' found.');
		}
		
	} else {
		nlapiLogExecution('ERROR', 'SRSProjectsLibrary.setProjectName', 'Invalid parameters: projectId='+projectId+', newProjectName='+newProjectName);
	}
	nlapiLogExecution('DEBUG', 'SRSProjectsLibrary.setProjectName', 'Ending setProjectName.');
	return null;
}