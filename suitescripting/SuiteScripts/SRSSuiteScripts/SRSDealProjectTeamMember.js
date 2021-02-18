/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSDealProjectTeamMember.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2011/07/13
 *
 * Copyright (c) 2011 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/*****************
 **  Public Entry Points
 *****************/
// 
// beforeSubmit:  The entry point for managing the deal team member changes.
//
function beforeSubmit(opType) {
	var opType = opType.toString();
	nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.beforeSubmit','Type: '+opType+'; Record Type: '+nlapiGetRecordType()+'; Record ID: '+nlapiGetRecordId());
	if(nlapiGetRecordId() != -1 && nlapiGetRecordType() == 'customrecord_deal_project_team') {
		switch (opType) {
			case 'create':
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.beforeSubmit','Trying to create now!!!');
				var targetMember = teamMemberExists(nlapiGetNewRecord());
				if(targetMember != null) {
					targetMember = mergeTeamMemberRoles(targetMember,nlapiGetNewRecord().getFieldValues('custrecord_deal_team_role'));
					nlapiSubmitRecord(targetMember);
					reconcileRoleAssignments(targetMember);
					reconcileTaskAssignments(targetMember);
					reconcileWorkflowAssignments(getTeamMemberProjectId(targetMember));
					throw nlapiCreateError('SRS_DUPLICATE_TEAM_MEMBER','The employee you are adding to the deal team is already a team member.  That team member record has been updated with the information from this request.',true);
				}
				break;
			case 'edit':
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.beforeSubmit','Trying to edit now!!!');
				break;
			case 'delete':
				//var testStuff = nlapiLoadRecord('customrecord_deal_project_team',nlapiGetRecordId());
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.beforeSubmit','Running delete routine...');
				try {
					deleteTeamMember(nlapiLoadRecord('customrecord_deal_project_team',nlapiGetRecordId()),false);
					nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.beforeSubmit','Delete routine complete.');
				} catch(err) {
					if(err instanceof nlobjError) {
						nlapiLogExecution('ERROR','SRSDealProjectTeamMember.beforeSubmit','Problem executing dealTeamMember script. '+err.getCode()+'\n'+err.getDetails());
					} else {
						nlapiLogExecution('ERROR','SRSDealProjectTeamMember.beforeSubmit','Problem executing dealTeamMember script. '+err.message);
					}
				}
				
				break;
			default:
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.beforeSubmit','Something is wrong because I have defaulted.  Type: '+opType);
		}
	} else {
		nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.beforeSubmit','Bypassed everything...');
	}
}

// 
// afterSubmit:  The entry point for managing the deal team member changes.
//
function afterSubmit(opType) {
	var opType = opType.toString();
	nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Type: '+opType+'; Record Type: '+nlapiGetRecordType()+'; Record ID: '+nlapiGetRecordId());
	if(nlapiGetRecordId() != -1 && nlapiGetRecordType() == 'customrecord_deal_project_team') {
		switch(opType) {
			case 'create':
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Running add team member routine...');
				addTeamMember(nlapiLoadRecord('customrecord_deal_project_team',nlapiGetRecordId()));
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Finished with add team member routine.');
				break;
			case 'edit':
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Running edit user routines...');
				var editUser = nlapiLoadRecord('customrecord_deal_project_team',nlapiGetRecordId());
				reconcileRoleAssignments(editUser);
				reconcileTaskAssignments(editUser);
				reconcileWorkflowAssignments(getTeamMemberProjectId(editUser));
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Finished running edit user routines.');
				break;
			case 'delete':
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Trying to delete now!!!');
				break;
			default:
				nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Something is wrong because I have defaulted.');
		}
	} else {
		nlapiLogExecution('DEBUG','SRSDealProjectTeamMember.afterSubmit','Bypassed everything...');
	}
}




