/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
/// <reference path="..\Utils\EmailGeneratorUtil.js" />
/// <reference path="..\Utils\EmailGeneratorUtil_MonthlyStatement.js" />
/// <reference path="..\Utils\EmailGeneratorUtil_Password.js" />
/**
 * @author durbano
 */
function loadPortlet(portlet, column)
{
    nlapiLogExecution("DEBUG", "EmailGenerator.loadPortlet", "START");
    
    // likely this is only called once
    portlet.setTitle('Email Generator');

    var portletUrl = nlapiResolveURL('SUITELET','customscript_email_generator','customdeploy_email_generator','FALSE');

    var wrapperPage = 'wrapper';
    var wrapperUrl = portletUrl + '&page=' + wrapperPage + '&frame=pendingList';
    
    var content = '<td><iframe name="SRSEmailGeneratorWrapper" src="' + wrapperUrl + '" frameborder="0" width="100%" height="300" scrolling="no"></iframe>';
    portlet.setHtml(content);
    nlapiLogExecution("DEBUG", "EmailGenerator.loadPortlet", "END");
}

function handleRequest(request, response)
{
    nlapiLogExecution("DEBUG", "EmailGenerator.handleRequest", "START");

    // process request
    var page = request.getParameter('page');
    if(page == null)
    {
        response.write('Request parameter page is null');
        return;
    }
    nlapiLogExecution("DEBUG", "EmailGenerator.handleRequest", "page = " + page);

    if(page == 'wrapper')
    {
        writeWrapper(request,response);
        return;        
    }
    
    var content = null;
    if(page == 'pendingList')
    {    // get the list of pending/in-progress emails
        content = renderPendingList(request);
    }
    else if(page == 'createNew')
    {
        content = renderCreateNew(request);
    }
    else if(page == 'review')
    {
        content = renderReview(request);
        response.write(content);
        return;
    }
    else if(page == 'manage')
    {
        var action = request.getParameter('manageaction');
        if(action != null && action.length > 0)    handleManageAction(request);
        
        content = renderManage(request);
        response.write(content);
        return;
    }
    else
    {
        response.write('Page ' + page + ' not found.');
        return;
    }

    response.writePage(content);
    nlapiLogExecution("DEBUG", "EmailGenerator.handleRequest", "END");
}

function writeWrapper(request,response)
{
    var portletUrl = nlapiResolveURL('SUITELET','customscript_email_generator','customdeploy_email_generator','FALSE');
    var newRecord = nlapiResolveURL('TASKLINK','EDIT_CUST_') + '&rectype=120&cf=43';
    
    var frame = request.getParameter('frame');
    var createNewPage = 'createNew';
    
    var defaultUrl = portletUrl + '&page=' + frame;
    var createNewUrl = newRecord;
    
    var headerContent  = '<font size="1"> &nbsp; <a href="' + createNewUrl + '" target="_top">Create</a> &nbsp; '
        //headerContent +=  '| &nbsp; <a href="' + portletUrl + '&page=wrapper&frame=pendingList">Email List</a></font>';
    var iFrameContent = '<iframe frameborder="0" name="SRSEmailGeneratorBody" width="100%" height="300" src="' + defaultUrl + '" scrolling="auto"></iframe>';

    response.write(headerContent);
    response.write(iFrameContent);    
}

function renderPendingList(request)
{
    var list = getPendingEmails(request);
    return displayPendingEmails(list);
}

function renderCreateNew(request)
{
    return 'Render Create New';
}

function renderReview(request)
{
    var job = request.getParameter('job');
    if(job == null || job.length == 0) return 'job parameter missing';
    
    nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "Working on Prepared Email Job " + job);

    var eml = request.getParameter('email');                                // get the email if one is provided    
    
    if(eml == null || eml.length == 0)                                        // if no email is provided, get the first email using the job id
    {
        eml = getFirstEmail(job);
        if(eml == null || eml.length == 0)
        {
            nlapiLogExecution("DEBUG", "EmailGeneratorUtil.renderReview", "Setting Job to 'REVIEW_COMPLETE' (1) : Status.REVIEW_COMPLETE = " + Status.REVIEW_COMPLETE);
            newJobStatus(job,Status.REVIEW_COMPLETE);
            doEmailJobStatusCounter(job);
            return 'No more records available for review';
        }
    }
    var emlRcd = nlapiLoadRecord('customrecord_prepared_emails',eml);        // load the email record
    
    var act = request.getParameter('new_status');
    if(act != null)
    {
        if(act == 'APPROVED')        emlRcd.setFieldValue('custrecord_prepared_email_status',Status.APPROVED);
        else if(act == 'REJECTED')    emlRcd.setFieldValue('custrecord_prepared_email_status',Status.REJECTED);
        else return 'Unknown action supplied: ' + act;
        nlapiSubmitRecord(emlRcd,false,false);
        
        eml = request.getParameter('nextEmail');
        if(eml == null || eml.length == 0)    eml = getFirstEmail(job);                // get the next record
        if(eml == null)
        {
            nlapiLogExecution("DEBUG", "EmailGeneratorUtil.renderReview", "Setting Job to 'REVIEW_COMPLETE' (2) : Status.REVIEW_COMPLETE = " + Status.REVIEW_COMPLETE);
            newJobStatus(job,Status.REVIEW_COMPLETE);
            doEmailJobStatusCounter(job);
            return 'No more records available for review';
        }
         
        emlRcd = nlapiLoadRecord('customrecord_prepared_emails',eml);    // load the email record
    }
    var nextEmail = getNextEmail(job,eml);
    
    // get the email identifiers for the previous and next email of the active one (ordered by internal id)
    var portletUrl = nlapiResolveURL('SUITELET','customscript_email_generator','customdeploy_email_generator','FALSE') + '&page=review&job=';
    var previousEmailUrl = portletUrl + job + '&email=' + getPreviousEmail(job,eml); 
    var nextEmailUrl = portletUrl + job + '&email=' + nextEmail;
    var approveUrl = portletUrl + job + '&email=' + eml + '&new_status=APPROVED&nextEmail=' + nextEmail;
    var rejectUrl = portletUrl + job + '&email=' + eml + '&new_status=REJECTED&nextEmail=' + nextEmail;
    var nsHomeUrl = '/app/center/card.nl';
    
    // create the navigation text that will display at the top
    var nav = '<div><a href="'+ approveUrl +'">Approve</a> |'
                +' <a href="'+ rejectUrl +'">Reject</a> |'
                +' <a href="'+ previousEmailUrl +'">Previous</a> |'
                +' <a href="'+ nextEmailUrl +'">Next</a> |'
                +' <a href="'+ nsHomeUrl +'">Back to NS</a> |'
                +' CURRENT EMAIL ID: '+eml+'</div>'
    
    // replace the placeholder in the template with the navigation text
    var txt = emlRcd.getFieldValue('custrecord_prepared_email_body');
        txt = txt.replace(/\<!\-\-NAVIGATION\-\->/gi, nav);
    
    // return the completed html
    return txt;
}

function renderManage(request)
{
    var job = request.getParameter('job');
    if(job == null || job.length == 0) return 'job parameter missing';
    nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "Working on Prepared Email Job " + job);

    var jobRcd = nlapiLoadRecord('customrecord_prepared_email_job',job);
    
    var html  = '';
        html += '<table><tr><th colspan="2">Email Job Details</th></tr>';
    
    // display the following
    html += '<tr><th align="right">Name:</th><td>' + jobRcd.getFieldValue('name') + '</td></tr>';                                            // name
    html += '<tr><th align="right">Type:</th><td>' + jobRcd.getFieldText('custrecord_prepared_email_type') + '</td></tr>';                    // type
    html += '<tr><th align="right">Status:</th><td>' + jobRcd.getFieldText('custrecord_prepared_email_job_status') + '</td></tr>';    // Status
    
    // deal (if applicable)
    var dealName = jobRcd.getFieldText('custrecord_prepared_email_deal_name') == '' ? '(not applicable)' : jobRcd.getFieldText('custrecord_prepared_email_deal_name');
    html += '<tr><th align="right">Deal:</th><td>' + dealName + '</td></tr>';
    
    // status counts
    
    var portletUrl = nlapiResolveURL('SUITELET','customscript_email_generator','customdeploy_email_generator','FALSE') + '&page=manage&job=' + job;
    
    // actions:
    html += '<tr><th align="left">Actions</th></tr>';
    
    var jobStatus = jobRcd.getFieldValue('custrecord_prepared_email_job_status');
    if(jobStatus == 9)        // review complete
        html += '<tr><td align="left"><a href="' + portletUrl  + '&manageaction=complete">Mark Complete</a></td></tr>';    //     3. Complete
    else
    {
        html += '<tr><td align="left"><a href="' + portletUrl  + '&manageaction=acceptall">Accept All</a></td></tr>';    //    1. Accept All
        html += '<tr><td align="left"><a href="' + portletUrl  + '&manageaction=rejectall">Reject All</a></td></tr>';    //    2. Reject All (if in a status that allows for that)
    }
    
    html += '</table>';
    return html;
}

function newJobStatus(job,status)
{
    var jobRcd = nlapiLoadRecord('customrecord_prepared_email_job',job);        // set the job to a new state
    jobRcd.setFieldValue('custrecord_prepared_email_job_status',status);
    nlapiSubmitRecord(jobRcd,false,false);
}

function handleManageAction(request)
{
    var job = request.getParameter('job');
    if(job == null || job.length == 0) return 'job parameter missing';
    nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "Working on Prepared Email Job " + job);

    var manageAction = request.getParameter('manageaction');
    if(manageAction == null || manageAction.length == 0) return 'manage action parameter missing';
    nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "Changing Prepared Email Status: " + manageAction);

    // 1. Change the status of the job to 'PAUSED'
    //newJobStatus(job, Status.PAUSED);
    
    // 2. Schedule job to 'ACCEPT' or 'REJECT' all
    var params = new Array();
    params['custscript_email_job_id'] = job;
    params['custscript_last_prepared_email_id'] = '-1';
    params['custscript_new_prepared_email_job_status'] = manageAction == 'acceptall' ? Status.APPROVED : Status.REJECTED;
    nlapiScheduleScript('customscript_emailgen_mass_status_change','customdeploy_emailgen_mass_status_change',params);
}

function handleMassStatusChange()
{
    var context = nlapiGetContext();
    var job                    = context.getSetting('SCRIPT','custscript_email_job_id');
    var lastEmailId            = context.getSetting('SCRIPT','custscript_last_prepared_email_id');
    var newEmailJobStatus    = context.getSetting('SCRIPT','custscript_new_prepared_email_job_status');
    
    nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "job: " + job);
    nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "lastEmailId: " + lastEmailId);
    nlapiLogExecution("AUDIT", "EmailGeneratorUtil.renderReview", "newEmailJobStatus: " + newEmailJobStatus);

    var filters = new Array();
    filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', job));
    filters.push(new nlobjSearchFilter('internalidnumber',null,'greaterthan',parseInt(lastEmailId)));
    filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', Status.COMPLETED));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
    if(parseInt(newEmailJobStatus) == Status.APPROVED)
        filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'anyof', [Status.READY_FOR_CONFIRMATION]));
    else
        filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'anyof', [Status.NEW,Status.READY_FOR_CONFIRMATION]));
    
    var columns = new Array();
    columns.push(new nlobjSearchColumn('internalid'));
    columns[0].setSort();    // sort by internalid
    
    var emails = nlapiSearchRecord('customrecord_prepared_emails',null, filters, columns);

    if(emails == null || emails.length == 0)
    {
        newJobStatus(job, Status.REVIEW_COMPLETE);
        return;
    }
        
    nlapiLogExecution("DEBUG", "EmailGeneratorUtil.parseAndReplaceScheduled", "number of emails found = " + emails.length);
    
    for(var i = 0; i < emails.length; i++)
    {
        var email = emails[i];
        var emailRecord = nlapiLoadRecord('customrecord_prepared_emails',email.getId());
        emailRecord.setFieldValue('custrecord_prepared_email_status',newEmailJobStatus);
        nlapiSubmitRecord(emailRecord,false,false);
        
        if(i < 100) continue;

        var params = new Array();
        params['custscript_email_job_id'] = job;
        params['custscript_last_prepared_email_id'] = email.getId();
        params['custscript_new_prepared_email_job_status'] = newEmailJobStatus;
        nlapiScheduleScript('customscript_emailgen_mass_status_change','customdeploy_emailgen_mass_status_change',params);
        
        return;
    }
    
    newJobStatus(job, Status.REVIEW_COMPLETE);
}

