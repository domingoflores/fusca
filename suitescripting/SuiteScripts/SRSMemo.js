/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : SRSMemo.js 
* @ AUTHOR        : Daniel A. Urbano
* @ DATE          : 2009/11/17
*
* Copyright (c) 2009 Shareholder Representative Services LLC
*
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function onInit()
{
    // Actions:
}   // end onInit

function onBeforeSubmit(type)
{
    // Actions:
    // 1. If a follow-up date is supplied, mark the memo as completed
    var fx = 'onBeforeSubmit';

	try
    {
		if((type == 'create') || (type == 'edit'))
		{
			var currentRecord = nlapiGetNewRecord();
            // check to see if this is an 'SRS Memo Deal' or 'SRS Memo Tx'
            var formId = currentRecord.getFieldValue('customform');
            if((formId == '29' || formId == '30') && currentRecord.getFieldValue('custevent_followupdate'))
            {   // 'SRS Memo Deal' form.
                // follow-up date is supplied, mark completed
                currentRecord.setFieldValue('status','COMPLETE');
            }
        }
	} //try 
    catch ( e )
    {
        if ( e instanceof nlobjError )
            nlapiLogExecution( 'ERROR', fx + ' 900', e.getCode() + '\n' + e.getDetails());
        else
            nlapiLogExecution( 'ERROR', fx + ' 950', e.toString());
    } //catch

}   // end onBeforeSubmit

function onAfterSubmit(type)
{   // Actions:
    // 1. If a follow-up date is supplied, create a new task using the subject and date to create the new task
	var fx = 'onAfterSubmit';
	try
    {
		if(type == 'create')
		{
			var currentRecord = nlapiGetNewRecord();
            
            var formId = currentRecord.getFieldValue('customform');
        
            var taskFormId = null;
            if(formId == '29')      // check to see if this is an 'SRS Memo Deal' AND followUpDate is set
            {
                taskFormId = '28';   // matching form identifier for the 'SRS Memo Deal'
            }
            else if(formId == '30')
            {
                taskFormId = '31';   // matching form identifier for the 'SRS Memo Tx'
            }
            
            if(currentRecord.getFieldValue('custevent_followupdate'))
            {
                var company = currentRecord.getFieldValue('company');
                var assignedDesignee = currentRecord.getFieldValue('assigned');
                var supportCase = currentRecord.getFieldValue('supportcase');
                var transaction = currentRecord.getFieldValue('transaction');
                var followUpDate = currentRecord.getFieldValue('custevent_followupdate');
                
                var title = currentRecord.getFieldValue('title');                                   // special handling of the title
                if(currentRecord.getFieldValue('custevent_followupsubject'))
                {
                    title = currentRecord.getFieldValue('custevent_followupsubject');
                }
                
                var memo = currentRecord.getFieldValue('message');                                  // special handling of the memo/note
                if(currentRecord.getFieldValue('custevent_followupmemo'))
                {
                    var followUpMemo = currentRecord.getFieldValue('custevent_followupmemo');
                    memo = followUpMemo + '\n\nPrevious Memo: ' + memo;                             // concatenate the 'follow-up memo' with the memo entered
                }
                
                createTask(title, assignedDesignee, followUpDate, followUpDate, company, supportCase, memo, transaction, taskFormId);
            }
		} // if type
	} //try 
    catch ( e )
    {
        if ( e instanceof nlobjError )
            nlapiLogExecution( 'ERROR', fx + ' 900', e.getCode() + '\n' + e.getDetails());
        else
            nlapiLogExecution( 'ERROR', fx + ' 950', e.toString());
    } //catch
} // end onAfterSubmit

// common functions
function createTask(title, assignee, startDate, dueDate, company, supportCase, message, transaction, formId)
{
    // get new instance of task
    newTask = nlapiCreateRecord("task");
    
    // set up the fields of task
    newTask.setFieldValue("title", title);
    newTask.setFieldValue("message", message);
    newTask.setFieldValue("assigned", assignee);
    newTask.setFieldValue("startdate", startDate);
    newTask.setFieldValue("duedate", dueDate);
    newTask.setFieldValue("priority", "MEDIUM");
    newTask.setFieldValue("status", "NOTSTART");
    newTask.setFieldValue("company", company);
    newTask.setFieldValue("supportcase", supportCase);

    if(transaction != null)
    {
        newTask.setFieldValue("transaction", transaction);
    }
    
    if(formId != null)
    {
        newTask.setFieldValue("customform", formId);
    }
    
    // create/submit the actual task
    var id = nlapiSubmitRecord(newTask, true, true);
    
}
