/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSMemo.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2012/02/08
 *
 * Copyright (c) 2012 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
 
//
// getLastMemoWorkflow: Provides a workflow action frontend for the SRSMemo.getLastMemo function.
//
function getLastMemoWorkflow() {
	nlapiLogExecution('DEBUG','SRSMemo.getLastMemoWokflow','Starting getLastMemoWorkflow...');
	
	//get running values from the runtime session.
	context = nlapiGetContext();
	var entityId = context.getSetting('SCRIPT','custscript_lastmemo_eid');
	var entityType = context.getSetting('SCRIPT','custscript_lastmemo_etype'); //Valid types are: contact, deal, firm, and transaction
	
	//If there's no entity id... something's wrong: just return null.
	if(entityId == null || entityId == undefined) {
		return null;
	}
	
	//assuming we made it this far, construct the return value.
	var memoRec = getLastMemo(entityId,entityType,1);
	
	if(memoRec != null) {
		return memoRec[0].getFieldValue('startdate')+' -- '+memoRec[0].getFieldText('assigned');
	} else {
		return null;
	}
}