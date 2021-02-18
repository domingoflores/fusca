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
// beforeSubmit:  The entry point for managing the project task changes.
//
function beforeSubmit(opType) {
	var opType = opType.toString();
	nlapiLogExecution('DEBUG','SRSProjectTask.beforeSubmit','Type: '+opType+'; Record Type: '+nlapiGetRecordType().toLowerCase()+'; Record ID: '+nlapiGetRecordId());
	if(nlapiGetRecordId() != -1 && nlapiGetRecordType().toLowerCase() == 'projecttask') {
		switch (opType) {
			case 'create':
				nlapiLogExecution('DEBUG','SRSProjectTask.beforeSubmit','Trying to create now!!!');
				break;
			case 'edit':
				nlapiLogExecution('DEBUG','SRSProjectTask.beforeSubmit','Trying to edit now!!!');
				break;
			case 'xedit':
				nlapiLogExecution('DEBUG','SRSProjectTask.beforeSubmit','Trying to xedit now!!!');
				var targetTask = nlapiLoadRecord('projecttask',nlapiGetRecordId());
				nlapiLogExecution('DEBUG', 'SRSProjectTask.completeTask', 'Completing project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' including booking time.');
				
				bookTimeOnTaskComplete(targetTask); 
				
				//change task status
				nlapiLogExecution('DEBUG', 'SRSProjectTask.completeTask', 'Do I need to change status to COMPLETE? Current status is: '+targetTask.getFieldValue('status'));
				if(targetTask.getFieldValue('status') != 'COMPLETE') {
					targetTask.setFieldValue('status','COMPLETE');
					nlapiSubmitRecord(targetTask);
				}
				
				nlapiLogExecution('DEBUG', 'SRSProjectTask.completeTask', 'Project task: ' +targetTask.getId()+'/'+ targetTask.getFieldValue('title') + ' completed with time bookings.');
				
				closeFlaggedPredecessors(targetTask);
				
				//Finally move active flags.
				progressActiveFlags(targetTask.getId());
				break;
			case 'delete':
				nlapiLogExecution('DEBUG','SRSProjectTask.beforeSubmit','Running delete routine...');
				break;
			default:
				nlapiLogExecution('DEBUG','SRSProjectTask.beforeSubmit','Something is wrong because I have defaulted.  Type: '+opType);
		}
	} else {
		nlapiLogExecution('DEBUG','SRSProjectTask.beforeSubmit','Bypassed everything...');
	}
}

// 
// afterSubmit:  The entry point for managing the deal team member changes.
//
function afterSubmit(opType) {
	var opType = opType.toString();
	nlapiLogExecution('DEBUG','SRSProjectTask.afterSubmit','Type: '+opType+'; Record Type: '+nlapiGetRecordType()+'; Record ID: '+nlapiGetRecordId());
	
}




