/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
// SSTREULE - Updated the nlapiSendEmail call to include a ReplyTo field - 11/1/16
var Status = 
{
	NEW: 1,
	IN_PROCESS: 2,
	CANCELED: 3,
	COMPLETED: 4,
	ERROR: 5,
	READY_FOR_CONFIRMATION: 6,
	APPROVED: 7,
	REJECTED: 8,
	REVIEW_COMPLETE: 9,
	PAUSED: 10
}

var Template = 
{
	// PORTAL_NEW_LOGIN:18901
	//,PORTAL_LOGIN:18900
		 PORTAL_NEW_LOGIN:665349
	    ,PORTAL_LOGIN:665349
        ,NEW_PORTAL_URL:664738
        ,DEMOLINK_URL:664739
      ,NEW_PORTAL_WEBLINK:807904
};

var Settings =
{
	Notifications:
    {
    	 From: 268072  //21345  is support internal id of support employee.
		,Bcc: null //internal id of operations employee.
		//,Bcc: "28154" //internal id of operations employee.
		//,Bcc: "durbano@shareholderrep.com"
		//,Bcc: "sbuttgereit@shareholderrep.com"
    },
	Testing:
	{
		//To: "sbuttgereit@shareholderrep.com"
		To: "durbano@shareholderrep.com"
		//To: "abruno@shareholderrep.com"
	}
}

/**
 * @author durbano
 */
function getPendingEmails(request)
{
	var results = nlapiSearchRecord('customrecord_prepared_email_job','customsearch_active_prepared_email_jobs');			// escrow transactions

	return results;	
}

function displayPendingEmails(results)
{
	if(results == null || results.length == 0) return 'No pending results found.';
	
	var recordLink = nlapiResolveURL('TASKLINK','EDIT_CUST_') + '&rectype=120&id=';
	var portletUrl = nlapiResolveURL('SUITELET','customscript_email_generator','customdeploy_email_generator','FALSE'); // + '&page=review&job=';
	
	var list = nlapiCreateList('Pending Emails',true);
	
	list.addColumn('action','text','Action','LEFT');
	list.addColumn('deal','text','Deal','LEFT');
	list.addColumn('name','text','Name','LEFT');
	list.addColumn('email_type','text','Type','LEFT');
	//list.addColumn('email_template','text','Template','LEFT');
	list.addColumn('email_job_status','text','Status','LEFT');
	//list.addColumn('manage_email','text','Manage','LEFT');

	for (var i = 0; results != null && i < results.length; i++) // setup view url
	{
		var result = results[i];
		
		var hash = new Array();
		
		var reviewEmailCntStr = result.getValue('custrecord_prepared_job_to_review_emails');
		if(reviewEmailCntStr == null)	reviewEmailCntStr = '0';
		var reviewEmailCnt = parseInt(reviewEmailCntStr);

		hash.deal = result.getText('custrecord_prepared_email_deal_name');
		hash.email_job_status = result.getText('custrecord_prepared_email_job_status');
		hash.email_job_status_id = result.getValue('custrecord_prepared_email_job_status');
		hash.number_job_to_review_emails = result.getValue('custrecord_prepared_job_to_review_emails');
		
		//if(reviewEmailCnt > 0)
		if(hash.email_job_status == 'READY FOR CONFIRMATION' || reviewEmailCnt > 0)
			hash.action = '<a href="' + portletUrl  + '&page=review&job=' + result.getId() + '" target="_top">Review</a>';	
		else
			hash.action = '<a href="' + recordLink + result.getId() + '" target="_top">View</a>';

		hash.name = '<a href="' + recordLink + result.getId() + '" target="_top">' + result.getValue('name') + '</a>';
		hash.email_type = result.getText('custrecord_prepared_email_type');
		//hash.email_template = result.getText('custrecord_prepared_email_template');
		hash.manage_email = '<a href="' + portletUrl  + '&page=manage&job=' + result.getId() + '">Manage</a>';
		
		list.addRow(hash);
	}
	return list;
}

function renderTop(request)
{
	
}

// @TODO figure out how to combine this and the following functions together - doEmailJobStatusCounter
function emailJobStatusCounter()
{
	var jobId = nlapiGetRecordId();

	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', jobId));
	var jobCounts = nlapiSearchRecord('customrecord_prepared_emails','customsearch_prepared_email_counts', filters, null);
	
	if(jobCounts == null || jobCounts.length == 0) return;	// do nothing
	if(jobCounts.length > 1) throw 'EmailGeneratorUtil.emailJobStatusCounter found more records than expected - ' + jobCounts.length;
	var jobCount = jobCounts[0];
	
	var cols = jobCount.getAllColumns();
	if(cols == null || cols.length == 0) throw 'EmailGeneratorUtil.emailJobStatusCounter did not find column data in result set';
	
	var total = 0;
	for(var i = 0; i < cols.length; i++)
	{
		var col = cols[i];
		
		var val = parseInt(jobCount.getValue(col));
		switch(col.getLabel())
		{	// @TODO figure out a better way to determine which columns apply to which value
			case 'Count Rejected':
				nlapiSetFieldValue('custrecord_prepared_job_rejected_emails',val);
			case 'Count Approved':
				nlapiSetFieldValue('custrecord_prepared_job_approved_emails',val);
			case 'Count Errored':
				nlapiSetFieldValue('custrecord_prepared_job_errored_emails',val);
			case 'Count Completed':
				nlapiSetFieldValue('custrecord_prepared_job_completed_emails',val);
			case 'Count Other':
				nlapiSetFieldValue('custrecord_prepared_job_to_review_emails',val);
			case 'Count Total':
				nlapiSetFieldValue('custrecord_prepared_job_total_emails',val);
			default:					// ignore all other columns
				val = 0;
		};
	}
}

function massPreparedEmailUpdate()
{
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.massPreparedEmailUpdate", "Started");
	var jobId = nlapiGetRecordId();
	var context = nlapiGetContext();
	var updateType = context.getSetting('SCRIPT','custscript_update_type');	// should be one of APPROVED or REJECTED

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "jobId: " + jobId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "updateType: " + updateType);
	
	/*
	var params = new Array();
	params['custscript_email_job_id'] = jobId;
	params['custscript_last_prepared_email_id'] = '-1';
	params['custscript_update_type'] = updateType;
	params['custscript_new_prepared_email_job_status'] = updateType;
	nlapiScheduleScript('customscript_emailgen_mass_status_change','customdeploy_emailgen_mass_status_change',params);
	*/
	
	var url = nlapiResolveURL('SUITELET', "customscript_srs_sl_utilities", "customdeploy_srs_sl_utilities",true) + '&action=preparedEmailHandleMassStatusChange' + '&jobId=' + jobId + '&statusCode=' + updateType;		
	var objResp = nlapiRequestURL(url, null, null);

}

function massPreparedEmailUpdateScheduled()
{
	var context = nlapiGetContext();
	var parentRecordId = context.getSetting('SCRIPT','custscript_prepared_email_job_id');	// get identifier of the base Prepared Email Job
	var lastInternalId  = context.getSetting('SCRIPT','custscript_last_internal__id');

	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.populateTemplatesScheduled", "Working on Prepared Email Job " + parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.populateTemplatesScheduled", "lastInternalId =  " + lastInternalId);
}

/**
 * This might appear to be the same as above, and it can probably be written better, but
 * the context in which the function is called is different.
 * @param {Object} jobId
 */
function doEmailJobStatusCounter(jobId)
{
	var job = nlapiLoadRecord('customrecord_prepared_email_job',jobId);
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', jobId));
	var jobCounts = nlapiSearchRecord('customrecord_prepared_emails','customsearch_prepared_email_counts', filters, null);
	
	if(jobCounts == null || jobCounts.length == 0) return;	// do nothing
	if(jobCounts.length > 1) throw 'EmailGeneratorUtil.emailJobStatusCounter found more records than expected - ' + jobCounts.length;
	var jobCount = jobCounts[0];
	
	var cols = jobCount.getAllColumns();
	if(cols == null || cols.length == 0) throw 'EmailGeneratorUtil.emailJobStatusCounter did not find column data in result set';
	
	var total = 0;
	for(var i = 0; i < cols.length; i++)
	{
		var col = cols[i];
		
		var val = parseInt(jobCount.getValue(col));
		switch(col.getLabel())
		{	// @TODO figure out a better way to determine which columns apply to which value
			case 'Count Rejected':
				job.setFieldValue('custrecord_prepared_job_rejected_emails',val);
			case 'Count Approved':
				job.setFieldValue('custrecord_prepared_job_approved_emails',val);
			case 'Count Errored':
				job.setFieldValue('custrecord_prepared_job_errored_emails',val);
			case 'Count Completed':
				job.setFieldValue('custrecord_prepared_job_completed_emails',val);
			case 'Count Other':
				job.setFieldValue('custrecord_prepared_job_to_review_emails',val);
			case 'Count Total':
				job.setFieldValue('custrecord_prepared_job_total_emails',val);
			default:					// ignore all other columns
				val = 0;
		};
	}
	nlapiSubmitRecord(job,false,false);
}

/*
 * GENERIC WORKFLOW ACTIONS TO SUPPORT EMAIL GENERATOR 
 */
function populateTemplates()
{
	var parentRecordId = nlapiGetRecordId();
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId);
	parent.setFieldValue('custrecord_prepared_email_job_status',Status.PAUSED);
	nlapiSubmitRecord(parent,false,false);		// save record

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.populateTemplates", "Working on Prepared Email Job " + parentRecordId);

	var params = new Array();
	params['custscript_prepared_email_job_id'] = parentRecordId;
	nlapiScheduleScript('customscript_set_reset_templates_sched','customdeploy_set_reset_templates_sched',params);
	// fin
}

function populateTemplatesScheduled()
{
	var context = nlapiGetContext();
	var parentRecordId = context.getSetting('SCRIPT','custscript_prepared_email_job_id');	// get identifier of the base Prepared Email Job
	var lastInternalId  = context.getSetting('SCRIPT','custscript_last_internal__id');

	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.populateTemplatesScheduled", "Working on Prepared Email Job " + parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.populateTemplatesScheduled", "lastInternalId =  " + lastInternalId);

	var template = nlapiLoadFile(parent.getFieldValue('custrecord_prepared_email_template'));
	if(template == null)	throw 'Template is null';
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.populateTemplatesScheduled", "template loaded");

	// change the status
	parent.setFieldValue('custrecord_prepared_email_job_status',Status.IN_PROCESS);
	
	// get the list of the prepared emails associated to the job
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', parentRecordId));
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', Status.COMPLETED));	// ignore any 'COMPLETED' (sent) emails
                filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	if(lastInternalId != null)
	{
		filters.push(new nlobjSearchFilter('internalidnumber',null,'greaterthan',parseInt(lastInternalId)));
	}

	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
		columns[0].setSort();	// sort by internalid
		
	var emails = nlapiSearchRecord('customrecord_prepared_emails',null, filters, columns);
	if(emails == null || emails.length == 0) throw 'No emails found for job';
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.populateTemplatesScheduled", "number of emails found = " + emails.length);
	
	// for each record, set the template
	var newJobInitiated = false;
	for(var i = 0; i < emails.length; i++)
	{
		var email = emails[i];
		var emailRecord = nlapiLoadRecord('customrecord_prepared_emails',	email.getId());
			emailRecord.setFieldValue('custrecord_prepared_email_body',		template.getValue());
			emailRecord.setFieldValue('custrecord_prepared_email_status',	Status.NEW);
		
		// save record
		nlapiSubmitRecord(emailRecord,false,false);
		
		//if(i > 5 && i < (emails.length -1 ))	// DEVELOPMENT
		if(i > 100 && i < (emails.length -1 ))	// PRODUCTION
		{
			var lastInternalId = emailRecord.getId();
			
			// call the scheduled script again using the internal id
			var params = new Array();
			params['custscript_prepared_email_job_id'] = parentRecordId;
			params['custscript_last_internal__id'] = lastInternalId;
			nlapiScheduleScript('customscript_set_reset_templates_sched','customdeploy_set_reset_templates_sched',params);
			
			newJobInitiated = true;
			
			break;
		}
	}

	if (newJobInitiated == false)
	{
		var params = new Array();
		params['custscript_prepared_email_job'] = parentRecordId;
		nlapiScheduleScript('customscript_email_gen_parse_and_replace','customdeploy_email_gen_parse_and_replace',params);
	}
}

function sendPreparedEmails()
{
	var parentRecordId = nlapiGetRecordId();	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	parent.setFieldValue('custrecord_prepared_email_job_status',Status.PAUSED);
	nlapiSubmitRecord(parent,false,false);		// save record

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.createNewStatementRecords", "Working on Prepared Email Job " + parentRecordId);
	
	var params = new Array();
	params['custscript_prepared_email_jobid'] = parentRecordId;
	nlapiScheduleScript('customscript_send_prepared_emails_sched','customdeploy_send_prepared_emails_sched',params);
	// fin	
}

function getEscrowStatementNews(dealIds)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord88', null, 'anyOf', dealIds));
                filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
		columns.push(new nlobjSearchColumn('custrecord90'));			// major shareholder news
		columns.push(new nlobjSearchColumn('custrecordcom_sh_news'));	// common shareholder news
		columns.push(new nlobjSearchColumn('custrecord89'));			// ESN news date
		columns[0].setSort(true);										// sort by internalid, descending
	
	var results = nlapiSearchRecord('customrecord28', null, filters, columns);
	if(results == null || results.length == 0) return null;

	var news = new Array();
	for(var i = 0; i < results.length; i++)
	{
		var result = results[i];
		
		var esn = {
			 internalId: result.getValue('internalid')
			,majorNews:  result.getValue('custrecord90')
			,commonNews: result.getValue('custrecordcom_sh_news')
			,date: 		 result.getValue('custrecord89')
		};
		
		news.push(esn);
	}
	return news;
}

function getAssociatedFiles(recordId,internalId)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'is', internalId));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('name', 'file'));
		columns.push(new nlobjSearchColumn('internalid', 'file'));

	var results = nlapiSearchRecord(recordId, null, filters, columns);
	if(results == null || results.length == 0) return null;

	var files = new Array();
	for(var i = 0; i < results.length; i++)
	{
		var result = results[i];
        var checkResult = result.getValue('internalid','file'); //checking to see if there is actually an attachment after 2012.1 update
        nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getAssociatedFiles", "checkresult length " + checkResult.length);
        if (checkResult != "")
        {
			var file = nlapiLoadFile(result.getValue('internalid','file'));
			files.push(file);
		}
	}
	return files;
}

function sendPreparedEmailsScheduled()
{
	// get identifier of the base Prepared Email Job
	var context 		= nlapiGetContext();
	var jobid  			= context.getSetting('SCRIPT','custscript_prepared_email_jobid');
	var lastInternalId  = context.getSetting('SCRIPT','custscript_last_internalid');

	// get the list of jobs that are approved
	var emails = getAllEmails(jobid,[Status.APPROVED]);
	if(emails == null || emails.length == 0) throw 'No emails found to send.';

	var job = nlapiLoadRecord('customrecord_prepared_email_job',jobid);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.sendPreparedEmailsScheduled", "Working on Prepared Email Job " + jobid);
	var subject = job.getFieldValue('name');	// displayed as the subject field when creating
	
	// iterate and send each one through NS
	var newJobInitiated = false;
	for(var i = 0; i < emails.length; i++)
	{
		var email = emails[i];
		var user = email.getValue('custrecord_prepared_email_recipient');
		var body = email.getValue('custrecord_prepared_email_body');
		var subj = email.getValue('custrecord_prepared_email_subject');
		var emailAddress = email.getValue('email','custrecord_prepared_email_recipient');
		
		if(emailAddress == null || emailAddress.length == 0) continue;
		
		var files = getAssociatedFiles('customrecord_prepared_emails',email.getId());

		//nlapiSendEmail(Settings.Notifications.From,Settings.Testing.To,subj,body,null,Settings.Notifications.Bcc);	// testing mode
		nlapiLogExecution("AUDIT", "EmailGeneratorUtil.sendPreparedEmailsScheduled", "user = " + user);
		//nlapiSendEmail(Settings.Notifications.From,user,subj,body,null,Settings.Notifications.Bcc,null,files);
		nlapiSendEmail(Settings.Notifications.From,user,subj,body,null,Settings.Notifications.Bcc,null,files,null,null,"support@srsacquiom.com");
		
		// change the status of the sent email to COMPLETED - 
		var emlRcd = nlapiLoadRecord('customrecord_prepared_emails',email.getId());
		emlRcd.setFieldValue('custrecord_prepared_email_status',Status.COMPLETED);
		try
		{
			nlapiSubmitRecord(emlRcd,false,false);
		}
		catch(e)
		{
			//continue;
		}
		
		if(i > 100 && i < (emails.length - 1))		// PRODUCTION
		{
			nlapiLogExecution("AUDIT", "EmailGeneratorUtil.sendPreparedEmailsScheduled", "Schedule for execution");
			lastInternalId = email.getValue('internalid');
			
			// call the scheduled script again using the internal id
			var params = new Array();
			params['custscript_prepared_email_jobid'] = jobid;
			params['custscript_last_internalid'] = lastInternalId;
			nlapiScheduleScript('customscript_send_prepared_emails_sched','customdeploy_send_prepared_emails_sched',params);
			
			newJobInitiated = true;	// @TODO can simply return from here...
			
			break;
		}
	}
	
	if(newJobInitiated)	return;	// do not process anything further
	
	// figure out if any emails were not sent before changing the job's status to COMPLETE
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', jobid));
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', [Status.COMPLETED]));	// ignore any 'COMPLETED' (sent) emails
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid',null,'sum'));
	var emails = nlapiSearchRecord('customrecord_prepared_emails',null, filters, columns);
	if(emails == null || emails.length == 0)
	{
		job.setFieldValue('custrecord_prepared_email_job_status',Status.COMPLETED);		// change the status of the email job
		nlapiSubmitRecord(job,false,false);												// update the email job
	}
	// fin	
}

function createPreparedEmailRecord(report,parent)
{
	// check the field custrecord_major_shareholders_only. If set to 'T', then make sure the shareholder is a major shareholder for any deal
	var sendToMajorShareholdersOnly = parent.getFieldValue('custrecord_major_shareholders_only');	
	if(sendToMajorShareholdersOnly == 'T')
	{
		// check to see if any of the shareholders are a major shareholder for any deal
		var hasMSAccess = majorShareholderAccess(report);
		if(!hasMSAccess) return;
		// else, person has access to at least one major shareholder
	}
	
	var record = nlapiCreateRecord('customrecord_prepared_emails');
	// status should be already set to 'NEW', or whatever the default status is.
	
	// set the user, template/body of the email and subject
	var user = report.getValue('custrecord_user');
	if(user == null)
	{
		throw 'No User found for Shareholder Report Access Record id: ' + report.getValue('internalid');
	}
	
	record.setFieldValue('custrecord_prepared_email_recipient',user);
	record.setFieldValue('custrecord_prepared_email_body','EMAIL BODY PENDING');
	record.setFieldValue('custrecord_prepared_email_subject',parent.getFieldValue('name'));
	record.setFieldValue('custrecord_rpt_access_record',report.getId());

	// associate to parent prepared email job
	record.setFieldValue('custrecord_prepared_email_job',parent.getId());

	// set the applicable deals
	// @todo - need to figure out what deals should be set in the case that this field is empty
	var deals = report.getValue('custrecord_escrow');
	//nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.createPreparedEmailRecord", "deals = " + deals);
	if(deals != null && deals.length > 0)
	{
		record.setFieldValues('custrecord_deals',deals.split(','));
	}
	
	try
	{
		nlapiSubmitRecord(record,false,false);
	}
	catch(error)
	{
		//if(error.indexOf('Code: INVALID_KEY_OR_REF') == 0) return;
		//throw error + ': Error in EmailGeneratorUtil.createPreparedEmailRecord()';
	}
}

function createPreparedEmailRecordFromContactObject(conObj,parent)
{
	// check the field custrecord_major_shareholders_only. If set to 'T', then make sure the shareholder is a major shareholder for any deal
	/*var sendToMajorShareholdersOnly = parent.getFieldValue('custrecord_major_shareholders_only');	
	if(sendToMajorShareholdersOnly == 'T')
	{
		// check to see if any of the shareholders are a major shareholder for any deal
		var hasMSAccess = majorShareholderAccess(report);
		if(!hasMSAccess) return;
		// else, person has access to at least one major shareholder
	}*/
	
	var record = nlapiCreateRecord('customrecord_prepared_emails');
	// status should be already set to 'NEW', or whatever the default status is.
	
	// set the user, template/body of the email and subject	
	record.setFieldValue('custrecord_prepared_email_recipient',conObj.userId);
	record.setFieldValue('custrecord_prepared_email_body','EMAIL BODY PENDING');
	record.setFieldValue('custrecord_prepared_email_subject',parent.getFieldValue('name'));
	record.setFieldValue('custrecord_rpt_access_record',conObj.reportAccessRecordId);

	// associate to parent prepared email job
	record.setFieldValue('custrecord_prepared_email_job',parent.getId());

	// set the applicable deals
	// @todo - need to figure out what deals should be set in the case that this field is empty
	var deals = conObj.dealIds;
	//nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.createPreparedEmailRecord", "deals = " + deals);
	if(deals != null && deals.length > 0)
	{
		if(typeof(deals) == 'string')
			record.setFieldValues('custrecord_deals',deals.split(','));
		else
			record.setFieldValues('custrecord_deals',deals);
	}
	
	try
	{
		nlapiSubmitRecord(record,false,false);
	}
	catch(error)
	{
		nlapiLogExecution("AUDIT", "EmailGeneratorUtil.createPreparedEmailRecord ", "error = " + error);
		nlapiLogExecution("AUDIT", "EmailGeneratorUtil.createPreparedEmailRecord ", "conObj.userId = " + conObj.userId);
		nlapiLogExecution("AUDIT", "EmailGeneratorUtil.createPreparedEmailRecord ", "conObj.reportAccessRecordId = " + conObj.reportAccessRecordId);
		//if(error.indexOf('Code: INVALID_KEY_OR_REF') == 0) return;
		//throw error + ': Error in EmailGeneratorUtil.createPreparedEmailRecord()';
	}
}

/**
 * Local Help
 */
function getFirstEmail(jobid)
{
	var emails = getAllEmails(jobid,[Status.READY_FOR_CONFIRMATION]);
	for(var i = 0; i < emails.length; i++)
	{
		var email = emails[i];
		return email.getId();
	}
	return null;
}

function getNextEmail(jobid,emailId)
{
	var emails = getAllEmails(jobid,[Status.READY_FOR_CONFIRMATION]);
	for(var i = 0; i < emails.length; i++)
	{
		var email = emails[i];
		var currEmailId = email.getId();
		if(currEmailId != emailId) 	continue;					// find the matching email

		if((i+1) < emails.length)	return emails[i+1].getId();	// a next one exists

		return emails[0].getId();								// return the first one if we've gotten this far
	}
	return null;
}

function getPreviousEmail(jobid,emailId)
{
	var emails = getAllEmails(jobid,[Status.READY_FOR_CONFIRMATION]);
	for(var i = 0; i < emails.length; i++)
	{
		var email = emails[i];
		var currEmailId = email.getId();
		if(currEmailId != emailId) 	continue;					// find the matching email

		if(i == 0) return emails[emails.length - 1].getId();	// at beginning, return last of loop

		return emails[i-1].getId();								// return the actual previous one
	}
	return null;
}

function getAllEmails(jobid,status,lastInternalId)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', jobid));
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'anyof', status));
		filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
		
		if(lastInternalId != null)
		{
			filters.push(new nlobjSearchFilter('internalidnumber',null,'greaterthan',parseInt(lastInternalId)));
		}
		
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
		columns.push(new nlobjSearchColumn('custrecord_prepared_email_body'));
		columns.push(new nlobjSearchColumn('custrecord_prepared_email_subject'));
		columns.push(new nlobjSearchColumn('custrecord_prepared_email_recipient'));
		columns.push(new nlobjSearchColumn('email','custrecord_prepared_email_recipient'));
		columns[0].setSort();									// sort by internalid
	var emails = nlapiSearchRecord('customrecord_prepared_emails',null, filters, columns);

	if(emails == null || emails.length == 0) return new Array();

	return emails;
}

function getTopLevelParentsByContact(contact)
{
    var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', 'contact', 'is', contact.internalid));
	filters.push(new nlobjSearchFilter('category', null, 'anyof', ['7','2']));

    var columns = [new nlobjSearchColumn('parent',null,'group')];	

    var parentResults = nlapiSearchRecord('customer',null, filters, columns);
	if(!parentResults || parentResults == null || parentResults.length == 0)
		return new Array();

	var parents = new Array();
	for(var i = 0; i < parentResults.length; i++)
	{
		var parentId = parentResults[i].getValue('parent',null,'group');
		parents.push(parentId);
	}
	
	return parents;	
}

function getChildFunds(parents,objectified)
{
	if(parents == null || parents.length == 0) return new Array();

	// for the list of parents, get all child shareholders
	var filters = [new nlobjSearchFilter('internalid', 'toplevelparent', 'anyof', parents)];
		filters.push(new nlobjSearchFilter('category', null, 'anyof', ['2']));
	
	var columns = [new nlobjSearchColumn('companyname',null,'group')];
		columns.push(new nlobjSearchColumn('internalid',null,'group'));
	
	var results = nlapiSearchRecord('customer',null, filters, columns);
	if(results == null) throw 'PROBLEM_FINDING_CHILD_FUNDS';
	
	var shareholders = new Array();
	for(var i = 0; i < results.length; i++)
	{
		var shareholder = results[i];
		if(objectified)
		{
			shareholders.push(
				{'internalid':shareholder.getValue('internalid',null,'group')
				,'name':shareholder.getValue('companyname',null,'group')});
		}
		else
		{
			shareholders.push(shareholder.getValue('internalid',null,'group'));
		}
	}
	
	return shareholders;
}

function getAllDeals(shareholders,deals)
{
	if(shareholders == null || shareholders.length == 0) return null;
	if(deals == null || deals.length == 0) return null;

	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecordshareholder', null, 'anyof', shareholders));
		filters.push(new nlobjSearchFilter('custrecordescrow', null, 'anyof', deals));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecordescrow',null,'group'));
	var searchResults = nlapiSearchRecord('customrecordespr', null, filters, columns);

	if(searchResults == null || searchResults.length == 0)	return new Array();
	
	var deals = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		deals.push(result.getValue('custrecordescrow',null,'group'));
	}
	return deals;
}

function getMajorShareholderDeals(shareholders,deals)
{
	if(shareholders == null || shareholders.length == 0) return null;
	if(deals == null || deals.length == 0) return null;
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord16', null, 'anyof', shareholders));
		filters.push(new nlobjSearchFilter('custrecord15', null, 'anyof', deals));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord15',null,'group'));
	var searchResults = nlapiSearchRecord('customrecord12', null, filters, columns);
	
	if(searchResults == null || searchResults.length == 0)	return new Array();
	
	var majorDeals = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		majorDeals.push(result.getValue('custrecord15',null,'group'));
	}
	return majorDeals;
}

function getIsMajorShareholder(parents,dealId)
{
	if(parents == null || parents.length == 0) 	return false;
	if(dealId == null || dealId.length == 0) return false;
	
	var shareholders = getChildFunds(parents,false);
	for(var i = 0; i < parents.length; i++)
		shareholders.push(parents[i]);

	// 2. see if any shareholder is a major shareholder
	var majorShareholders = getMajorShareholderDeals(shareholders,[dealId]);
	
	// 3. if one is found, return true
	if(majorShareholders != null && majorShareholders.length > 0) return true;

	return false;
}

function getContact(contactId)
{
	if(contactId == null) throw 'Empty contactId passed in';
	
    var filters = [new nlobjSearchFilter('internalid', null, 'is', contactId)];
    var columns = new Array();
		columns.push(new nlobjSearchColumn('entityid'));
		columns.push(new nlobjSearchColumn('internalid'));
		columns.push(new nlobjSearchColumn('giveaccess'));
		columns.push(new nlobjSearchColumn('custentity_initial_password'));
		columns.push(new nlobjSearchColumn('email'));
		columns.push(new nlobjSearchColumn('firstname'));
		columns.push(new nlobjSearchColumn('lastname'));
		
		columns.push(new nlobjSearchColumn('address1'));
		columns.push(new nlobjSearchColumn('address2'));
		columns.push(new nlobjSearchColumn('address3'));
		columns.push(new nlobjSearchColumn('city'));
		columns.push(new nlobjSearchColumn('state'));
		columns.push(new nlobjSearchColumn('zipcode'));
		columns.push(new nlobjSearchColumn('fax'));
		columns.push(new nlobjSearchColumn('company'));
                columns.push(new nlobjSearchColumn('custentity_portal_hash'));
    var searchResults = nlapiSearchRecord('contact',null, filters, columns);

	if(searchResults == null || searchResults.length == 0) throw 'NO_CONTACT_FOUND';
	
	var result = searchResults[0];
	
	var contact = {
		'internalid':result.getValue('internalid'),
		'name':result.getValue('entityid'),
		'email':result.getValue('email'),
//		'hasaccess':result.getValue('giveaccess')
		'initialpassword':result.getValue('custentity_initial_password'),
		'haschangedpwd':'N',
		'firstname':result.getValue('firstname'),
		'lastname':result.getValue('lastname'),
		'address1':result.getValue('address1'),
		'address2':result.getValue('address2'),
		'address3':result.getValue('address3'),
		'city':result.getValue('city'),
		'state':result.getValue('state'),
		'zipcode':result.getValue('zipcode'),
		'fax':result.getValue('fax'),
		'company':result.getText('company'),
		'companyId':result.getValue('company'),
		'portalhash':result.getValue('custentity_portal_hash')
	};
	
	/*if(contact.hasaccess == 'F') return contact;
	
	// determine if the user, with access, has logged in
	filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_user_changed_pwd_email', null, 'is', contact.email));
	
	columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_user_changed_pwd_email'));
	
	searchResults = nlapiSearchRecord('customrecord_users_changed_password',null, filters, columns);
	if(searchResults != null && searchResults.length > 0)
	{
		contact.haschangedpwd = 'Y';
		contact.initialpassword = 'unknown';
	}
	
	//nlapiLogExecution('DEBUG','EmailGeneratorUtil.getContact', 'Email = ' + contact.email);
	*/
	return contact;
}

function getShareholdersWithContactFromMajorShareholders(contactId,dealId)
{
	if(contactId == null) throw 'Empty contactId passed in';
	if(dealId == null) throw 'Empty dealId passed in';
	
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getShareholdersWithContactFromMajorShareholders", "contactId = " + contactId);
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getShareholdersWithContactFromMajorShareholders", "dealId = " + dealId);
	
	var filters = new Array(); 
		filters.push(new nlobjSearchFilter('custrecord_ms_contact', null, 'is', contactId));
		filters.push(new nlobjSearchFilter('custrecord15', null, 'anyof', [dealId]));
	
    var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord16',null,'group'));		// shareholder

    var searchResults = nlapiSearchRecord('customrecord12',null, filters, columns);

	if(searchResults == null || searchResults.length == 0) throw 'NO_SHAREHOLDERS_FOUND';

	var shareholderIds = new Array();
	for( var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		var shareholderId = result.getValue('custrecord16',null,'group');
		
		shareholderIds.push(shareholderId);
	}
	
	return shareholderIds;
}

function getTopLevelParents(shareholderIds)
{
	if(shareholderIds == null) throw 'Empty shareholderIds passed in';
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', shareholderIds));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('parent',null,'group'));
	
	var searchResults = nlapiSearchRecord('customer',null, filters, columns);
	
	if(searchResults == null || searchResults.length == 0) throw 'NO_TOP_LEVEL_PARENTS_FOUND';
	
	var parentIds = new Array();
	for( var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		var parentId = result.getValue('parent',null,'group');
		
		parentIds.push(parentId);
	}
	
	return parentIds;
}

function getLastDetailTransactions(dealList,shareholderList,numberOfFinalTransactions)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord66', null, 'anyof', dealList));
		filters.push(new nlobjSearchFilter('custrecord67', null, 'anyof', shareholderList));

	var searchResults = nlapiSearchRecord('customrecord18', 'customsearch420', filters, null);
	
	if (searchResults == null || searchResults.length == 0)	return new Array();
	if(numberOfFinalTransactions == null || numberOfFinalTransactions == 0) numberOfFinalTransactions = searchResults.length;

	var data = new Array();
	for(var i = 0; i < searchResults.length && i < numberOfFinalTransactions; i++)
	{
		var result = searchResults[i];
		
		var datum = {
			 'account':result.getText('custrecord_glaccount',null,'group')
			,'account_id':result.getValue('custrecord_glaccount',null,'group')
			,'deal':result.getText('custrecord66',null,'group')
			,'shareholder':result.getValue('companyname','custrecord67','group')
			,'shareholder_id':result.getText('internalid','custrecord67','group')
			,'denomination':result.getText('custrecord85',null,'group')
			,'amount':parseFloat(result.getValue('custrecord70',null,'sum'))
			,'date': result.getValue('custrecord65',null,'group')
			,'type': result.getValue('custrecord69',null,'group')
		};
		
		data.push(datum);
	}
	return data;
}

function getEscrowBalances(isUsd, dealList, shareholderList, asOfDate)
{ // customsearch474
	if(dealList == null || dealList.length == 0 || shareholderList == null || shareholderList == null) throw 'NO_ESCROW_BALANCES_FOUND';

	nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'dealList is ' + dealList);
	nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'shareholderList is ' + shareholderList);
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord66', null, 'anyof', dealList));  //Deal - List of Customers
		filters.push(new nlobjSearchFilter('custrecord67', null, 'anyof', shareholderList));  //Shareholder - List of Customers
		filters.push(new nlobjSearchFilter('custrecord65', null, 'onorbefore', asOfDate)); //Date - Date Field
		//filters.push(new nlobjSearchFilter('custrecord_et_status', null, 'anyof', [4]));	// only RELEASED transactions
	
	if (isUsd) 
		filters.push(new nlobjSearchFilter('custrecord85', null, 'anyof', [1]));		//Denomination 1 = USD
	else 
		filters.push(new nlobjSearchFilter('custrecord85', null, 'noneof', [1]));

	if(dealList == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'dealList is null');
	if(shareholderList == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'shareholderList is null');
	if(asOfDate == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'asOfDate is null');
	
	var searchResults = nlapiSearchRecord('customrecord18', 'customsearch474', filters, null);  //Escrow Transaction Record
	
	if (searchResults == null || searchResults.length == 0)
	{
		return new Array();
	}

	var currDate = new Date(asOfDate);
	var compDate = new Date(asOfDate);
		compDate.setMonth(currDate.getMonth() - 1);		// 1 == monthly statements / 3 == quarterly statements

	var data = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		var balance = Math.round(parseFloat(result.getValue('custrecord70',null,'sum')) * 100) / 100;
		var lastTxDate = new Date(result.getValue('custrecord65',null,'max'));
		if(balance == 0 && lastTxDate < compDate)	// skip if the last tx was more than 30 days ago and the balance is zero.
			continue;
		
		var datum = {
			 'account':result.getText('custrecord_glaccount',null,'group')
			,'account_id':result.getValue('custrecord_glaccount',null,'group')
			,'deal':result.getText('custrecord66',null,'group')
			,'shareholder':result.getValue('companyname','custrecord67','group')
			,'shareholder_id':result.getText('internalid','custrecord67','group')
			,'denomination':result.getText('custrecord85',null,'group')
			,'balance':parseFloat(result.getValue('custrecord70',null,'sum'))
			,'deposits':parseFloat(result.getValue('formulanumeric',null,'sum'))
			,'holdbacks':parseFloat(result.getValue('custrecord75',null,'sum'))
			,'investmentearnings':parseFloat(result.getValue('custrecord76',null,'sum'))
			,'claimspaid':parseFloat(result.getValue('custrecord77',null,'sum'))
			,'expenses':parseFloat(result.getValue('custrecord78',null,'sum'))
			,'disbursements':parseFloat(result.getValue('custrecord103',null,'sum'))
			,'lastTxDate': lastTxDate
		};
		
		data.push(datum);
	}
	return data;
}

function getCurrentDealBalances(dealList, shareholderList)
{ // customsearch474
	if(dealList == null || dealList.length == 0 || shareholderList == null || shareholderList.length == 0) return new Array();

	nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'dealList is ' + dealList);
	nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'shareholderList is ' + shareholderList);
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord66', null, 'anyOf', dealList));
		filters.push(new nlobjSearchFilter('custrecord67', null, 'anyOf', shareholderList));
		
	var searchResults = nlapiSearchRecord('customrecord18', 'customsearch_virtual_binder_deal_balance', filters, null);
	
	if (searchResults == null || searchResults.length == 0)	return new Array();
	nlapiLogExecution('DEBUG','EmailGeneratorUtil.getCurrentDealBalances', 'searchResults.length = ' + searchResults.length);

	var data = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		
		var datum = {
			 'account':result.getText('custrecord_glaccount',null,'group')
			,'account_id':result.getValue('custrecord_glaccount',null,'group')
			,'deal':result.getText('custrecord66',null,'group')
			,'shareholder':result.getValue('companyname','custrecord67','group')
			,'shareholder_id':result.getText('internalid','custrecord67','group')
			,'denomination':result.getText('custrecord85',null,'group')
			,'balance':parseFloat(result.getValue('custrecord70',null,'sum'))
			,'deposits':parseFloat(result.getValue('formulanumeric',null,'sum'))
			,'holdbacks':parseFloat(result.getValue('custrecord75',null,'sum'))
			,'investmentearnings':parseFloat(result.getValue('custrecord76',null,'sum'))
			,'claimspaid':parseFloat(result.getValue('custrecord77',null,'sum'))
			,'expenses':parseFloat(result.getValue('custrecord78',null,'sum'))
			,'disbursements':parseFloat(result.getValue('custrecord103',null,'sum'))
			,'lastTxDate': new Date(result.getValue('custrecord65',null,'max'))
		};
		
		data.push(datum);
	}
	return data;
}

function getReportAccessRecordContacts(topLevelParent,dealIds)
{
	if(topLevelParent == null) throw 'NO_TOP_LEVEL_PARENT_FOUND';
	if(dealIds == null) throw 'NO_DEAL_FOUND';
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_escrow', null, 'anyof', dealIds));
		filters.push(new nlobjSearchFilter('custrecord_toplevelparent', null, 'anyof', topLevelParent));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_user',null,'group'));		// contacts
		columns.push(new nlobjSearchColumn('email','custrecord_user','group'));		// contacts
	
	var searchResults = nlapiSearchRecord('customrecord_shareholder_data_access', null, filters, columns);
	
	if(searchResults == null || searchResults.length ==0) return new Array();
	
	var contacts = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		
		var contact = {
			 'contactid':result.getValue('custrecord_user',null,'group')
			,'name':result.getText('custrecord_user',null,'group')
			,'email':result.getValue('email','custrecord_user','group')
		};
		contacts.push(contact);
	}
	
	return contacts;
}

Array.prototype.unique =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
  };

function getSDADeals(contactId,dealIds)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_escrow', null, 'anyof', dealIds));
		filters.push(new nlobjSearchFilter('custrecord_user', null, 'is', contactId));
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalId'));		// sda internal id
	var searchResults = nlapiSearchRecord('customrecord_shareholder_data_access', null, filters, columns);

	if(searchResults == null || searchResults.length == 0) return new Array();

	var deals = new Array();
	var lastSdaId = null;
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		var lastSdaId = result.getValue('internalid');		
		var sda = nlapiLoadRecord('customrecord_shareholder_data_access',lastSdaId);
		var dealIds = sda.getFieldValues('custrecord_escrow');
		
		if(dealIds == null || dealIds.length == 0) continue;
		
		for(var j = 0; j < dealIds.length; j++)
		{
			deals.push(dealIds[j]);
		}
	}
	
	deals = deals.unique();
	
	return {
		deals: deals,
		sdaId: lastSdaId
	};
}

function getMajShareholderContacts(customers,dealId)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	if(customers != null && customers.length > 0)
		filters.push(new nlobjSearchFilter('custrecord16',null,'anyof',customers));
		filters.push(new nlobjSearchFilter('custrecord15',null,'is',dealId));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_ms_contact',null,'group'));			// contact
		columns.push(new nlobjSearchColumn('firstname','custrecord_ms_contact','group'));			// contact
		columns.push(new nlobjSearchColumn('email','custrecord_ms_contact','group'));		// contacts
		columns.push(new nlobjSearchColumn('phone','custrecord_ms_contact','group'));		// contacts
		columns[1].setSort();	// sort by name
	
	var rpts = nlapiSearchRecord('customrecord12',null,filters,columns);

	if(rpts == null || rpts.length == 0)
		throw 'No Reports Found to Generate';

	var contacts = new Array();
	for(var i = 0; i < rpts.length; i++)
	{
		var result = rpts[i];

		var contact = {
			 'contactid':result.getValue('custrecord_ms_contact',null,'group')
			,'name':result.getText('custrecord_ms_contact',null,'group')
			,'email':result.getValue('email','custrecord_ms_contact','group')
			,'phone':result.getValue('phone','custrecord_ms_contact','group')
		};
		contacts.push(contact);
	}
	return contacts;
}

function getAllMajShareholderContacts(dealIds,lastContactId)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('custrecord15',null,'anyOf',dealIds));
	if(lastContactId != null)
		filters.push(new nlobjSearchFilter('internalidnumber','custrecord_ms_contact','greaterthan',parseInt(lastContactId)));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid','custrecord_ms_contact','group'));	// contact
		columns.push(new nlobjSearchColumn('custrecord_ms_contact',null,'group'));	// contact
		columns.push(new nlobjSearchColumn('email','custrecord_ms_contact','group'));		// contacts
		columns.push(new nlobjSearchColumn('firstname','custrecord_ms_contact','group'));		// contacts
		columns.push(new nlobjSearchColumn('lastname','custrecord_ms_contact','group'));		// contacts
		columns.push(new nlobjSearchColumn('parent','custrecord16','group'));		// investor group?
		columns[0].setSort();	// sort by internalid
	
	var rpts = nlapiSearchRecord('customrecord12',null,filters,columns);

	if((rpts == null || rpts.length == 0) && lastContactId == null)	return new Array();

	var contacts = new Array();
	for(var i = 0; i < rpts.length; i++)
	{
		var result = rpts[i];

		var contact = {
			 'userId': 		result.getValue('custrecord_ms_contact',null,'group')
			,'internalid':	result.getValue('custrecord_ms_contact',null,'group')
			,'name':		result.getText('custrecord_ms_contact',null,'group')
			,'firstname':	result.getValue('firstname','custrecord_ms_contact','group')
			,'lastname':	result.getValue('lastname','custrecord_ms_contact','group')
			,'email':		result.getValue('email','custrecord_ms_contact','group')
			,'parentId':	result.getValue('parent','custrecord16','group')
			,'dealIds':		null
			,'reportAccessRecordId':null
		};

		contacts.push(contact);
	}
	return contacts;
}

function getAllMajShareholderContactIds(dealIds,lastContactId)
{
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.getAllMajShareholderContacts", "dealIds = " + dealIds);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil.getAllMajShareholderContacts", "lastContactId = " + lastContactId);
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('custrecord15',null,'anyOf',dealIds));
	if(lastContactId != null)
		filters.push(new nlobjSearchFilter('internalidnumber','custrecord_ms_contact','greaterthan',parseInt(lastContactId)));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid','custrecord_ms_contact','group'));	// contact
		columns[0].setSort();	// sort by internalid
	
	var rpts = nlapiSearchRecord('customrecord12',null,filters,columns);

	if((rpts == null || rpts.length == 0) && lastContactId == null)
		throw 'No Reports Found to Generate';

	var contacts = new Array();
	for(var i = 0; i < rpts.length; i++)
	{
		var result = rpts[i];

		contacts.push(result.getValue('internalid','custrecord_ms_contact','group'));
	}
	return contacts;
}

function getDealsByContact(contact,dealIds)
{
	if(contact == null || dealIds == null || dealIds.length == 0) throw 'Contact or DealIds cannot be null';
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('custrecord15',null,'anyof',dealIds));		// a large list of deals, we want the subset for this contact
		filters.push(new nlobjSearchFilter('custrecord_ms_contact',null,'is',contact));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord15',null,'group'));	// deal
		columns[0].setSort();	// sort by internalid
	
	var rpts = nlapiSearchRecord('customrecord12',null,filters,columns);

	if(rpts == null || rpts.length == 0)
		throw 'No Reports Found to Generate';
	
	var deals = new Array();
	for(var i = 0; i < rpts.length; i++)
	{
		var result = rpts[i];
		deals.push(result.getValue('custrecord15',null,'group'));
	}
	return deals;
}

function getProRataData(deal_ids,transactions)
{
	if(transactions == null || transactions.length == 0) return transactions;

	// for each escrow transaction record, get the shareholder id, deal id, and gl account id to get the pro rata data
	var returnTransactions = new Array();
	var precision = 10000000000000000;	// 16 decimal places
	for(var i = 0; i < transactions.length; i++)
	{
		var datum = transactions[i];
		
		nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getProRataData", "datum.account_id = " + datum.account_id);
		
		// call search with the deal_id, shareholder_id and account_id
		var filters = new Array();
			filters.push(new nlobjSearchFilter('custrecordescrow', null, 'anyof', deal_ids));
			filters.push(new nlobjSearchFilter('custrecordshareholder', null, 'anyof', [datum.shareholder_id]));
			filters.push(new nlobjSearchFilter('custrecordescrow_account', null, 'anyof', [datum.account_id]));
		
		var searchResults = nlapiSearchRecord('customrecordespr', 'customsearch_portlt_shareholder_pro_rata', filters, null);
		
		if(searchResults == null) throw 'NO_PRO_RATA_FOUND';
		
		var pro_rata = 0.0;
		for(var j = 0; j < searchResults.length; j++)		// should only find a single one, but just in case...
		{
			var result = searchResults[j];

			var proRataStr = result.getValue('custrecordpro_rata_deci',null,'sum');
			var proRata = parseFloat(proRataStr);
			pro_rata += Math.round(proRata * precision);
		}
		
		datum.pro_rata = pro_rata / precision;				// append to the datum
		
		nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getProRataData", "datum.pro_rata = " + datum.pro_rata);
		
		returnTransactions.push(datum);
	}
	
	return returnTransactions;
}

function getClosingData(dealList, shareholderList)
{ // customsearch474
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_participating_escrow', null, 'anyof', dealList));
		filters.push(new nlobjSearchFilter('custrecord_participating_shareholder', null, 'anyof', shareholderList));
	
	if(dealList == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil.getClosingData', 'dealList is null');
	if(shareholderList == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil.getClosingData', 'shareholderList is null');
	
	var searchResults = nlapiSearchRecord('customrecord2', 'customsearch_shareholder_payout_at_close', filters, null);
	
	if (searchResults == null || searchResults.length == 0)	return new Array();

	var data = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		
		var datum = {
			 'deal':result.getText('custrecord_participating_escrow',null,'group')
			,'deal_id':result.getValue('custrecord_participating_escrow',null,'group')
			// ATP-1336: use the Shareholder's Company Name, instead of just the Shareholder's Name
			// ,'shareholder':result.getText('custrecord_participating_shareholder',null,'group')
			,'shareholder':result.getValue('companyname','custrecord_participating_shareholder','group')
			,'shareholder_id':result.getValue('custrecord_participating_shareholder',null,'group')
			,'cash_paid_at_close':parseFloat(result.getValue('custrecord64',null,'sum'))
			,'shares_paid_at_close':parseFloat(result.getValue('custrecord86',null,'sum'))
		};
		
		data.push(datum);
	}
	return data;
}

function majorShareholderAccess(shareholderDataAccessRecord)	
{	// check to see if any of the shareholders are a major shareholder for any deal
	
	// 1. get the list of shareholders and the investor group, if any
	var shareholders = shareholderDataAccessRecord.getValue('custrecord_shareholder');
	var investorGroup = shareholderDataAccessRecord.getValue('custrecord_investor_group');
	
	if((shareholders == null || shareholders.length == 0) && (investorGroup == null || investorGroup.length == 0)) return false;
	
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.majorShareholderAccess", 'shareholders = ' + shareholders);
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.majorShareholderAccess", 'investorGroup = ' + investorGroup);
	
	if(shareholders != null && shareholders.length > 0)
		shareholders = toArray(shareholders.split(','));
	else if(investorGroup != null && investorGroup.length > 0)
	{	// get the children of the investor group
		nlapiLogExecution("DEBUG", "EmailGeneratorUtil.majorShareholderAccess", 'Getting child funds of investor group');
		shareholders = getChildFunds([investorGroup],false);		
	}
	
	// 2. see if any major shareholder is a major shareholder
	var majorShareholders = getMajorShareholders(shareholders,investorGroup);
	
	// 3. if one is found, return true
	if(majorShareholders != null && majorShareholders.length > 0) return true;

	// 4. else return false
	return false;
}

function getMajorShareholdersByDeal(dealId)
{
	if(dealId == null) throw 'Empty dealId passed in';
	
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getShareholdersWithContactFromMajorShareholders", "dealId = " + dealId);
	
	var filters = new Array(); 
		filters.push(new nlobjSearchFilter('custrecord15', null, 'anyof', [dealId]));
	
    var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord16',null,'group'));			// shareholder
		columns.push(new nlobjSearchColumn('parent','custrecord16','group'));		// top level parent

    var searchResults = nlapiSearchRecord('customrecord12',null, filters, columns);

	if(searchResults == null || searchResults.length == 0) throw 'NO_SHAREHOLDERS_FOUND';

	var shareholderIds = new Array();
	for( var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		var shareholderId = result.getValue('custrecord16',null,'group');
		var parentId = result.getValue('parent','custrecord16','group');
		
		shareholderIds.push(shareholderId);
		shareholderIds.push(parentId);
	}
	
	return shareholderIds;
}

function getMajorShareholders(allShareholders,investorGroup)
{
	if(typeof(allShareholders) == 'string')
	{
		var tmp = allShareholders;
		allShareholders = new Array();
		allShareholders.push(tmp);
	}
	if(allShareholders == null)
	{
		allShareholders = new Array();
	}
	if(investorGroup != null)
	{
		allShareholders.push(investorGroup);
	}
	
	if(allShareholders.length == 0) return null;
	
	// query the major shareholders table and return the deals that belong to any of the accessible shareholders or investor group
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord16', null, 'anyof', allShareholders));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord16',null,'group'));
	var searchResults = nlapiSearchRecord('customrecord12', null, filters, columns);
	
	if(searchResults == null || searchResults.length == 0)	return null;
	
	var mjrShs = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		mjrShs.push(result.getValue('custrecord16',null,'group'));
	}
	return mjrShs;
}

function getDemoLinkURL(contact)
{
//MGS
	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

	var file;
	var template;
	
	if(contact.haschangedpwd == 'Y' || (contact.initialpassword == null || contact.initialpassword.length == 0))
		{
		file = nlapiLoadFile(Template.DEMOLINK_URL);		// load up Template.
		template = file.getValue();
		var currentUserDemoURL = 'https://www.srscomport.com/verify/' + contact.portalhash
		template = template.replace(/@DEMOLINK_URL@/gi, currentUserDemoURL);
		}
	else
		{
		file = nlapiLoadFile(Template.DEMOLINK_URL);	// load up Template.
		template = file.getValue();
		var newUserDemoURL = 'https://www.srscomport.com/verify/' + contact.portalhash
		template = template.replace(/@DEMOLINK_URL@/gi, newUserDemoURL);
		}

	if(file == null) return 'contact.haschangedpwd = ' + contact.haschangedpwd + '. Attempted to load file, but was not found';


	return template;


}
	

function getNewPortalURL(contact)
{
//MGS
//new
	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

	var file;
	var template;
	
	if(contact.haschangedpwd == 'Y' || (contact.initialpassword == null || contact.initialpassword.length == 0))
		{
		file = nlapiLoadFile(Template.NEW_PORTAL_URL);		// load up Template.
		template = file.getValue();
		var currentUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
		template = template.replace(/@URL_HASH@/gi, currentUserHash);
		}
	else
		{
		file = nlapiLoadFile(Template.NEW_PORTAL_URL);	// load up Template.
		template = file.getValue();
		var newUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
		template = template.replace(/@URL_HASH@/gi, newUserHash);
		}

	if(file == null) return 'contact.haschangedpwd = ' + contact.haschangedpwd + '. Attempted to load file, but was not found';


	return template;

}

function getNewPortalWeblink(contact)
{
//MGS
//new
	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

	var file;
	var template;

	file = nlapiLoadFile(Template.NEW_PORTAL_WEBLINK);		// load up Template.
	template = file.getValue();
	var currentUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
	template = template.replace(/@WEBLINK_HASH@/gi, currentUserHash);


	if(file == null) return 'Attempted to load file, but was not found';


	return template;

}

//Added this function to solve MPL-7 is JIRA
//Added by Scott Streule
//This functions searches to determine if a shareholder is a Major Shareholder.  
//Then based on that result, finds the most recent ESN of the SRS Corporate record and writes it into the monthly statement template.
function getAdComText(contact)
{
//MGS
//new STS
	//if(contact.hasaccess == 'F') return 'Has No Access';	
	
	//Get the contact record Internal ID to be used in a search to determine if this is a Major Shareholder or not
	var contactId = contact.internalid;
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.js", "The contactId is " + contactId);
	//Search for any Major Shareholder records for this contact record Internal ID
	//need to find Major Shareholder record where contactId equals custrecord_ms_contact (Major Shareholder record field)
	var filters = new Array(); 
		filters.push(new nlobjSearchFilter('custrecord_ms_contact', null, 'is', contactId));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_ms_contact'));
	var searchResults = nlapiSearchRecord('customrecord12',null, filters, columns);
	
	if(searchResults != '' && searchResults != null){
		//Search for the most recent ESN News record attached to the SRS Corporate record in NetSuite ---- See MPL-7 for more details
		//search goes in here...
		//ESN is customrecord28
		var filters = new Array(); 
			filters.push(new nlobjSearchFilter('custrecord88', null, 'is', '591324'));  //Production
			//filters.push(new nlobjSearchFilter('custrecord88', null, 'is', '417068'));  //Staging
	
		var columns = new Array();
			//Major Shareholder News field
			columns.push(new nlobjSearchColumn('custrecord90', null, null));
			//News Date field
			columns.push(new nlobjSearchColumn('custrecord89', null, null));
			//Set the sort to be true so it is ascending
			columns[1].setSort(true /* bsortdescending */);

		var searchResults = nlapiSearchRecord('customrecord28',null, filters, columns);

		var mostRecentMjrNews = searchResults[0].getValue('custrecord90');
		
		var displayMessage = '<br><br><b>' + mostRecentMjrNews + '</b><br><br>';
			
		return displayMessage;
		
	}else{
	
		return '';
	
	}

}


function getPortalParagraph(contact)
{
	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

	var file;
	if(contact.haschangedpwd == 'Y' || (contact.initialpassword == null || contact.initialpassword.length == 0))
		file = nlapiLoadFile(Template.PORTAL_LOGIN);		// load up Template.
	else
		file = nlapiLoadFile(Template.PORTAL_NEW_LOGIN);	// load up Template.

	if(file == null) return 'contact.haschangedpwd = ' + contact.haschangedpwd + '. Attempted to load file, but was not found';

	var template = file.getValue();
	
	template = template.replace(/@EMAIL_ADDRESS@/gi, contact.email);
	//template = template.replace(/@USER_INITIAL_PASSWORD@/gi, contact.initialpassword);	// this will only be found if applicable
	var newUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
		template = template.replace(/@URL_HASH@/gi, newUserHash);
	return template;
}

function getContacts(parentId,objectify)
{
	if(parentId == null || parentId.lenth == 0) return null;
	
    var filters = [new nlobjSearchFilter('company', null, 'is', parentId)];
    var columns = new Array();
	columns[0] = new nlobjSearchColumn('entityid');
	columns[1] = new nlobjSearchColumn('internalid');
	columns[2] = new nlobjSearchColumn('giveaccess');
	columns[3] = new nlobjSearchColumn('email');
	columns[4] = new nlobjSearchColumn('firstname');
	columns[5] = new nlobjSearchColumn('lastname');
    var searchResults = nlapiSearchRecord('contact',null, filters, columns);

	if(searchResults == null || searchResults.length == 0) throw 'NO_CONTACTS_FOUND';

	var contacts = new Array();
	for(var i = 0; i < searchResults.length; i++)
	{
		var result = searchResults[i];
		
		if(objectify == true)
		{
			var contact = {
				 'internalid':result.getValue('internalid')
				,'name':result.getValue('entityid')
				,'firstname':result.getValue('firstname')
				,'lastname':result.getValue('lastname')
				,'email':result.getValue('email')
			};
			contacts.push(result.getValue('internalid'));
		}
		else
		{
			contacts.push(result.getValue('internalid'));
		}
	}
	return contacts;
}

function createMajorShareholderEmails(dealId,parent,createPreparedEmail)
{
	var filters = new Array();
		filters[0] = new nlobjSearchFilter('isinactive',null,'is','F');
		filters.push(new nlobjSearchFilter('custrecord15',null,'is',dealId))
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord15',null,'group'));			// escrow/deal
		columns.push(new nlobjSearchColumn('parent','custrecord16','group'));		// top level parent
		columns.push(new nlobjSearchColumn('custrecord_ms_contact',null,'group'));	// contact
	
	var rpts = nlapiSearchRecord('customrecord12',null,filters,columns);

	if(rpts == null || rpts.length == 0)
		throw 'No Reports Found to Generate';

	var objs = formContactObjectsFromMajorShareholder(rpts,'group');

	if(createPreparedEmail != null && createPreparedEmail == false) return objs;

	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		createPreparedEmailRecordFromContactObject(obj, parent);
	}	
}

function formContactObjectsFromMajorShareholder(rcds,summaryGroup)
{
	var objs = new Array();
	for (var i = 0; i < rcds.length; i++)
	{
		var rcd = rcds[i];
		
		var user = rcd.getValue('custrecord_ms_contact',null,summaryGroup);
		var deal = rcd.getValue('custrecord15',null,summaryGroup);				// deal
		var topLevelParent = rcd.getValue('custrecord16',null,summaryGroup);		// topLevelParent
		
		if(user == null)	throw 'No User found for Major Shareholder record';
		if(deal == null)	throw 'No Deal found for Major Shareholder record';
		
		var contact = {
			 'userId': user
			,'dealIds':deal
			,'parentId':topLevelParent
			,'reportAccessRecordId':null
		};
		objs.push(contact);
	}
	return objs;
}

function getDealPointStudyRecords(dealId)
{
	var filters = new Array();
		filters[0] = new nlobjSearchFilter('isinactive',null,'is','F');
		filters.push(new nlobjSearchFilter('custrecord_deal',null,'is',dealId))
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid',null,null));	// deal point study record id
		columns[0].setSort();	// sort by internalid		
	
	var rpts = nlapiSearchRecord('customrecord_deal_points_study',null,filters,columns);

	if(rpts == null || rpts.length == 0)
		throw 'No Deal Point Study Records Found for deal ' + dealId;

	var dpsRecords = new Array();
	for (var i = 0; i < rpts.length; i++)
	{
		var rpt = rpts[i];
		dpsRecords.push(rpt.getValue('internalid',null,null));
	}	
	return dpsRecords;
}

function filterUniqueDates(theDates)
{
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.filterUniqueDates", "theDates is " + JSON.stringify(theDates));
	if(theDates == null) return new Array();
	
	var lastDate = null;
	var returnDates = new Array();
	for(var i = 0; i < theDates.length; i++)
	{
		var theDate = theDates[i];
		//if(theDate.date == lastDate)	continue;  //Removed by Scott Streule
		
		returnDates.push(theDate);
		lastDate = theDate.date;
	}
	return returnDates;
}

function getDealContacts(dealIds,roles,lastInternalId,summaryGroup,worksForBuyer,isMainContact)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord59',null,'anyOf',dealIds));
		filters.push(new nlobjSearchFilter('custrecord_esc_con_roles',null,'anyOf',roles));

 	if(lastInternalId != null)	filters.push(new nlobjSearchFilter('internalidnumber','custrecord60','greaterthan',parseInt(lastInternalId)));
	if(worksForBuyer != null)	filters.push(new nlobjSearchFilter('custrecord84',null,'is',worksForBuyer));
	if(isMainContact != null)	filters.push(new nlobjSearchFilter('custrecord_ea_main_contact',null,'is',isMainContact));

	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalId','custrecord60',summaryGroup));				// contact internal id
	
	if(summaryGroup == null)
	{
		columns.push(new nlobjSearchColumn('entityid','custrecord60',null));		// contact
		columns.push(new nlobjSearchColumn('phone','custrecord60',null));			// contact
		columns.push(new nlobjSearchColumn('email','custrecord60',null));			// contact
		columns.push(new nlobjSearchColumn('custrecord_esc_con_roles',null,null));		// title
		columns.push(new nlobjSearchColumn('custrecord_deal_contact_firm',null,null));	// the original deal contact firm
		columns[1].setSort();	// sort by name
	}
	else
		columns[0].setSort();	// sort by internal id

	var rpts = nlapiSearchRecord('customrecord16',null,filters,columns);
	if(rpts == null || rpts.length == 0)	return new Array();
	
	var dealContacts = new Array();
	for(var i = 0; i < rpts.length; i++)
	{
		var rpt = rpts[i];
		
		var contact = {
			 contactId: rpt.getValue('internalId','custrecord60',summaryGroup)
			,userId:	rpt.getValue('internalId','custrecord60',summaryGroup)
			,internalid:rpt.getValue('internalId','custrecord60',summaryGroup)
			,dealIds:				null
			,reportAccessRecordId:	null
			,searchedRoles: roles
		};
		
		if(summaryGroup == null)
		{
			contact.name  = rpt.getValue('entityid','custrecord60')
			contact.email = rpt.getValue('email','custrecord60')
			contact.phone = rpt.getValue('phone','custrecord60')
			contact.roles = rpt.getValue('custrecord_esc_con_roles');
			contact.original_deal_firm = rpt.getText('custrecord_deal_contact_firm');
		}
		
		dealContacts.push(contact);
	}
	return dealContacts;
}

function getContactDeals(contactId,dealIds,roles,parentCompany,worksForBuyer)
{
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord59',null,'anyOf',dealIds));
		filters.push(new nlobjSearchFilter('custrecord_esc_con_roles',null,'anyOf',roles));

	if(contactId != null)		filters.push(new nlobjSearchFilter('custrecord60',null,'is',contactId));
	if(parentCompany != null)	filters.push(new nlobjSearchFilter('company','custrecord60','is',parentCompany));
	if(worksForBuyer != null)	filters.push(new nlobjSearchFilter('custrecord84',null,'is',worksForBuyer));

	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord59',null,'group'));				// deal id

	var rpts = nlapiSearchRecord('customrecord16',null,filters,columns);
	if(rpts == null || rpts.length == 0)	return new Array();
	
	var deals = new Array();
	for (var i = 0; i < rpts.length; i++)
	{
		var rpt = rpts[i];

		deals.push(rpt.getValue('custrecord59',null,'group'));		
	}	
	return deals;
}

//MGS  used to add or subtract months
function addMonths(date, months) {
  date.setMonth(date.getMonth() + months);
  return date;
}


function getEventDates(dealIds,eventTypes,statuses, accountIDs)
{
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getEventDates", "dealIds is " + dealIds);
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getEventDates", "glAccountNames is " + accountIDs);
	if(statuses == null)	statuses = ['CONFIRMED'];
	var twoMonthsAgo = addMonths(new Date(), -3);
	var filters = new Array();
		filters.push(new nlobjSearchFilter('status',null,'anyof',statuses));
		filters.push(new nlobjSearchFilter('custevent27',null,'anyof',eventTypes));			// Earnout Deadline, Escrow Release, etc.
        filters.push(new nlobjSearchFilter('startdate',null,'onorafter',twoMonthsAgo));
	if(accountIDs != '' && accountIDs != null){
		filters.push(new nlobjSearchFilter('custevent_gl_account',null,'anyof',accountIDs));
	}

	//if(typeof(glAccountNames) == 'string'){
      //  filters.push(new nlobjSearchFilter('custevent_gl_account',null,'is',glAccountNames));
	//}else{
	//	filters.push(new nlobjSearchFilter('custevent_gl_account',null,'anyOf',glAccountNames));
	//}

	if(typeof(dealIds) == 'string'){
		filters.push(new nlobjSearchFilter('attendee',null,'is',dealIds));
	}else{
		filters.push(new nlobjSearchFilter('attendee',null,'anyOf',dealIds));
	}
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('startdate',null,null));	// startdate, i.e. the event date
		columns.push(new nlobjSearchColumn('title',null,null));		// title
		columns.push(new nlobjSearchColumn('internalid',null,null));
		columns.push(new nlobjSearchColumn('custevent29',null,null));			// release percentage
		columns.push(new nlobjSearchColumn('custevent_gl_account',null,null));	// GL Account Name
		columns.push(new nlobjSearchColumn('custevent27',null,null));			// Escrow Activity
		columns.push(new nlobjSearchColumn('attendee',null,null));				// attendee
		columns.push(new nlobjSearchColumn('status',null,null));				// attendee
		columns[0].setSort();	// sort by startdate
	
	var rpts = nlapiSearchRecord('calendarevent',null,filters,columns);

	if(rpts == null || rpts.length == 0)	return new Array();
	
	var theDates = new Array();
	for(var i = 0; i < rpts.length; i++)
	{
		var event = rpts[i];
		
		var eventObject = {
			internalid: 	event.getValue('internalid'),
			date:			event.getValue('startdate'),
			title:			event.getValue('title'),
			release_pct:	event.getValue('custevent29'),
			account_name:	event.getText('custevent_gl_account'),
			activity:		event.getText('custevent27'),
			attendee:		event.getText('attendee'),
			status:			event.getValue('status'),
		};
		
		theDates.push(eventObject);
	}
	
	return theDates;
}

function getSelectValueNames(selectedListIds,listInternalId,escapeNames)
{
	if(selectedListIds == null || selectedListIds.length == 0) return '';
	if(escapeNames == null) escapeNames = true;	// default to true
	if(typeof(selectedListIds) == 'string')
	{
		selectedListIds = [selectedListIds];
	}
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('internalid',null,'anyOf',selectedListIds));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid',null,null));
		columns.push(new nlobjSearchColumn('name',null,null));		// name of the field
		columns[1].setSort();	// sort by name

	var listSearch = nlapiSearchRecord(listInternalId,null,filters,columns);
	
	if(listSearch == null || listSearch.length == 0)	return '';
	
	var listNames = new Array();
	for(var i = 0; i < listSearch.length; i++)
	{
		var listItem = listSearch[i];
		var listName = listItem.getValue('name');
		if(escapeNames) listName = nlapiEscapeXML(listName);
		listNames.push(listName);
	}
	
	return listNames;
}

// my little helper functions

function createNewStatementLine(dataLine,openSpan,closeSpan)
{
	if(openSpan == null || openSpan.length == 0 || closeSpan == null || closeSpan.length == 0)
	{
		openSpan = '';
		closeSpan = '';
	}
	
	var html = '';
	html += '<td align="right">' + openSpan + formatCurrency(sumAndRound(dataLine.deposits,dataLine.holdbacks)) + closeSpan + '</td>';	// deposits + holdbacks
	html += '<td align="right">' + openSpan + formatCurrency(dataLine.investmentearnings) + closeSpan + '</td>';		// investment earnings
	html += '<td align="right">' + openSpan + formatCurrency(dataLine.claimspaid) + closeSpan + '</td>';				// claims paid
	html += '<td align="right">' + openSpan + formatCurrency(dataLine.expenses) + closeSpan + '</td>';				// expenses
	html += '<td align="right">' + openSpan + formatCurrency(dataLine.disbursements) + closeSpan + '</td>';			// disbursements 
	html += '<td align="right">' + openSpan + formatCurrency(dataLine.balance) + closeSpan + '</td>';			// balance

	return html;		
}

function newBalanceObject()
{
	var total = {
		 'balance': 0.0
		,'deposits':0.0
		,'holdbacks':0.0
		,'depositsholdbacks':0.0
		,'investmentearnings':0.0
		,'claimspaid':0.0
		,'expenses':0.0
		,'disbursements':0.0
	};
	return total;	
}

function updateBalances(total,datum)
{
	total.balance 			 = sumAndRound(total.balance,			 datum.balance);
	total.deposits 			 = sumAndRound(total.deposits,			 datum.deposits);
	total.holdbacks 		 = sumAndRound(total.holdbacks,			 datum.holdbacks);
	total.depositsholdbacks  = sumAndRound(total.depositsholdbacks,  datum.deposits + datum.holdbacks);
	total.investmentearnings = sumAndRound(total.investmentearnings, datum.investmentearnings);
	total.claimspaid 		 = sumAndRound(total.claimspaid,		 datum.claimspaid);
	total.expenses 			 = sumAndRound(total.expenses,			 datum.expenses);
	total.disbursements 	 = sumAndRound(total.disbursements,		 datum.disbursements);

	return total;	
}

function sumAndRound(amt1,amt2)
{
	return Math.round((amt1 + amt2) * 100) / 100;
}

function toPercentString(numerator,denominator,digits)
{
	var answer = numerator / denominator * 100;
	if(digits == null) digits = 2;
	var num = Math.pow(10, digits);
	
	return Math.round(answer * num) / num + '%';
}

function formatCurrency(num,currencySymbol,defaultValue,skipIfNull,skipCents)
{
	if(num == null || num.length == 0)
	{
		if(skipIfNull == true)
		{
			return '';
		}
		num = defaultValue;
	}
	if(num == null) return 'Null';

	num = num.toString().replace(/\$|\,/g,'');
	if(isNaN(num))	num = "0";
	if(currencySymbol == null) currencySymbol = '';

	sign = (num == (num = Math.abs(num)));
	num = Math.floor(num*100+0.50000000001);
	
	cents = num%100;
	num = Math.floor(num/100).toString();
	if(cents<10)	cents = "0" + cents;

	for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++)
	{
		num = num.substring(0,num.length-(4*i+3))	
				+ ','
				+ num.substring(num.length-(4*i+3));
	}

	if(skipCents == null || skipCents == false)
		return ((sign)?'':'-') + currencySymbol + num + '.' + cents;
		
	return ((sign)?'':'-') + currencySymbol + num;
}

function formatProRataToPercent(num)
{
	if(num == null) return 'Null';
	if(isNaN(num))	num = "0";
	
		num = (parseFloat(num) * 100).toString();		// convert to percentage
	var len = num.length;
	if(len > 8) len = 8;								// for example, 29.123456789
	
	num = num.substring(0,len);							// will become 29.12345
	
	return num + '%';
}

function toArray(list)
{	// I do not understand why writing this is necessary, but I do not always get arrays out of NS
	var array = new Array();
	if(list == null) return array;
	
	if(typeof(list) == 'string')
	{
		array.push(list);
		return array;
	}
	
	for(var i = 0; i < list.length; i++)
	{
		array.push(parseInt(list[i]));
	}
	return array;
}

function numToHex(theNumber)
{
	return theNumber.toString(16);
}

function hexToNum(hexNumber)
{
	return parseInt(hexNumber,16);
}

function sameArray(one,two)
{
  if(one == null && two == null) return true;
  if(one == null && two != null) return false;
  if(one != null && two == null) return false;
  if(one.length == 0 && two.length == 0) return true;
  
  for(var i = 0; i < one.length; i++) // loop through array and verify that each element exists in the second array
  {
    var check = one[i];
    var found = false;
    for(var j = 0; j < two.length; j++)
    {
      var against = two[j];
      if(check != against) continue;
      
      found = true;
      break;
    }
    if(found == true) continue;
    return false;
  }
  return true;
}