/// <reference path="References\Explore\SuiteScript\SuiteScriptAPI.js" />
var Status = {
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

/*var Template =
{
	 PORTAL_NEW_LOGIN:18901
	,PORTAL_LOGIN:18900
};*/

/**
 * @author durbano
 */
/*
 * LIST OF WORKFLOW ACTION FUNCTIONS
 */
function createNewStatementRecords() {
  var parentRecordId = nlapiGetRecordId(); // get identifier of the base Prepared Email Job
  var parent = nlapiLoadRecord('customrecord_prepared_email_job', parentRecordId)
  parent.setFieldValue('custrecord_prepared_email_job_status', Status.PAUSED);
  nlapiSubmitRecord(parent, false, false); // save record

  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.createNewStatementRecords", "Working on Prepared Email Job " + parentRecordId);

/* 2019.01.19 BD - instead of calling scheduled script, call the utilities suitelet which will schedule a Map/Reduce script 
  var params = new Array();
  params['custscriptprepared_email_job'] = parentRecordId;
  nlapiScheduleScript('customscript_create_new_stmt_records', 'customdeploy_create_new_stmt_records', params);
 */


	var url = nlapiResolveURL('SUITELET', "customscript_srs_sl_utilities", "customdeploy_srs_sl_utilities",true) + '&action=scheduleMonthlyStatementRecordGenerationScript' + '&jobId=' + parentRecordId;		
	var objResp = nlapiRequestURL(url, null, null);


  // fin
}

function createNewStatementRecordsScheduled() {
  var context = nlapiGetContext();
  var parentRecordId = context.getSetting('SCRIPT', 'custscriptprepared_email_job');
  var lastInternalId = context.getSetting('SCRIPT', 'custscript_last_internal_id');

  // get identifier of the base Prepared Email Job
  var parent = nlapiLoadRecord('customrecord_prepared_email_job', parentRecordId)
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatements.createNewStatementRecordsScheduled", "Working on Prepared Email Job " + parentRecordId);
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatements.createNewStatementRecordsScheduled", "lastInternalId =  " + lastInternalId);

  // get list of shareholder report records for the list of active deals
  var filters = new Array();
  filters[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
  if (lastInternalId != null) {
    filters[1] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(lastInternalId));
  }

  var rpts = nlapiSearchRecord('customrecord_shareholder_data_access', 'customsearch227', filters, null);
  if ((rpts == null || rpts.length == 0) && lastInternalId == null)
    throw 'No Reports Found to Generate';
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatements.createNewStatementRecordsScheduled", "Found shareholder data access records");

  // create Prepared Email records for each unique record
  var newJobInitiated = false;
  for (var i = 0; i < rpts.length; i++) {
    var rpt = rpts[i];
    createPreparedEmailRecord(rpt, parent);

    //if(i > 20 && lastInternalId != null) break; // DEVELOPMENT @TODO REMOVE
    //if(i > 2 && i < (rpts.length - 1))	// DEVELOPMENT
    if (i > 100 && i < rpts.length) // PRODUCTION
    {
      var lastInternalId = rpt.getValue('internalid');

      // call the scheduled script again using the internal id
      var params = new Array();
      params['custscriptprepared_email_job'] = parentRecordId;
      params['custscript_last_internal_id'] = lastInternalId;
      nlapiScheduleScript('customscript_create_new_stmt_records', 'customdeploy_create_new_stmt_records', params);

      newJobInitiated = true;

      break;
    }
  }

  if (newJobInitiated == false) {
    parent.setFieldValue('custrecord_prepared_email_job_status', Status.NEW);
    nlapiSubmitRecord(parent, false, false); // save record
    //nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatements.createNewStatementRecordsScheduled", "Prepared Email Records Created");

    doEmailJobStatusCounter(parentRecordId);
  }
  // fin
}

function parseAndReplace() {
  var parentRecordId = nlapiGetRecordId();
  var parent = nlapiLoadRecord('customrecord_prepared_email_job', parentRecordId)
  parent.setFieldValue('custrecord_prepared_email_job_status', Status.PAUSED);
  nlapiSubmitRecord(parent, false, false); // save record
  //nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.parseAndReplace", "Working on Prepared Email Job " + parentRecordId);


  /* 2019.01.19 BD - instead of calling scheduled script, call the utilities suitelet which will schedule a Map/Reduce script 
  var params = new Array();
  params['custscript_prepared_email_job_id'] = parentRecordId;
  //nlapiScheduleScript('customscript_email_gen_parse_and_replace','customdeploy_email_gen_parse_and_replace',params);
  nlapiScheduleScript('customscript_set_reset_templates_sched', 'customdeploy_set_reset_templates_sched', params);
  */
    
  	var url = nlapiResolveURL('SUITELET', "customscript_srs_sl_utilities", "customdeploy_srs_sl_utilities",true) + '&action=scheduleMonthlyStatementRecordSetupScript' + '&jobId=' + parentRecordId;		
	var objResp = nlapiRequestURL(url, null, null);

  // fin
}

function parseAndReplaceScheduled() {
  var context = nlapiGetContext();
  var parentRecordId = context.getSetting('SCRIPT', 'custscript_prepared_email_job');
  var lastInternalId = context.getSetting('SCRIPT', 'custscript_last_internal___id');

  var parentJob = nlapiLoadRecord('customrecord_prepared_email_job', parentRecordId);
  //nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.parseAndReplaceScheduled", "Working on Prepared Email Job " + parentRecordId);
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.parseAndReplaceScheduled", "lastInternalId = " + lastInternalId);

  // get the list of the prepared emails associated to the job
  var filters = new Array();
  filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', parentRecordId));
  filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', Status.COMPLETED));
  filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
  if (lastInternalId != null) {
    filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(lastInternalId)));
  }

  var newLastInternalId = doParseReplaceLoop(filters, parentJob, parentRecordId);
  if (newLastInternalId == null) return;

  // call the scheduled script again using the internal id
  var params = new Array();
  params['custscript_prepared_email_job'] = parentRecordId;
  params['custscript_last_internal___id'] = newLastInternalId;
  nlapiScheduleScript('customscript_email_gen_parse_and_replace', 'customdeploy_email_gen_parse_and_replace', params);
}

function parseAndReplaceErroredScheduled() {
  var context = nlapiGetContext();
  var parentRecordId = context.getSetting('SCRIPT', 'custscript_prep_eml_jobid');
  var lastInternalId = context.getSetting('SCRIPT', 'custscript_last_internal____id');

  var parentJob = nlapiLoadRecord('customrecord_prepared_email_job', parentRecordId);
  //nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.parseAndReplaceScheduled", "Working on Prepared Email Job " + parentRecordId);
  //nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.parseAndReplaceScheduled", "lastInternalId = " + lastInternalId);

  // get the list of the prepared emails associated to the job
  var filters = new Array();
  filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', parentRecordId));
  filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'anyof', [Status.ERROR])); // ,Status.NEW,Status.READY_FOR_CONFIRMATION
  if (lastInternalId != null) {
    filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(lastInternalId)));
  }

  var newLastInternalId = doParseReplaceLoop(filters, parentJob, parentRecordId);
  if (newLastInternalId == null) return;

  // call the scheduled script again using the internal id
  var params = new Array();
  params['custscript_prep_eml_jobid'] = parentRecordId;
  params['custscript_last_internal____id'] = newLastInternalId;
  nlapiScheduleScript('customscript_email_gen_parse_rpl_errored', 'customdeploy_email_gen_parse_rpl_errored', params);
}

function doParseReplaceLoop(filters, parentJob, parentRecordId) {
  var columns = new Array();
  columns.push(new nlobjSearchColumn('internalid'));
  columns[0].setSort(); // sort by internalid
  columns.push(new nlobjSearchColumn('custrecord_prepared_email_body'));

  var emails = nlapiSearchRecord('customrecord_prepared_emails', null, filters, columns);
  if (emails == null) return null;
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.parseAndReplaceScheduled", "number of emails found = " + emails.length);
  if (emails == null || emails.length == 0) throw 'No emails found for job';

  //MGS
  var emailType = parentJob.getFieldValue('custrecord_prepared_email_type');
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplaceLoop", "Parent Job EmailType" + emailType);


  // for each record, execute the parse and replacement
  for (var i = 0; i < emails.length; i++) {
    var email = emails[i];
    var emailRecord = nlapiLoadRecord('customrecord_prepared_emails', email.getId());
    try {
      // perform the necessary parsing, replacement, etc.
      //doParseAndReplace(emailRecord,parentJob);

      switch (emailType) {

        case "1": //statements
          doParseAndReplace(emailRecord, parentJob);
          break;

        case "6": //non-statements
          doParseAndReplace(emailRecord, parentJob);
          //doParseAndReplace_non_statement(emailRecord,parentJob);
          break;
      }
    } catch (e) {
      if (e == 'NO_ESCROW_BALANCES_FOUND')
        emailRecord.setFieldValue('custrecord_prepared_email_err_msg', 'NO_ESCROW_BALANCES_FOUND');
      else if (e == 'PARENT_FIELD_NOT_POPULATED')
        emailRecord.setFieldValue('custrecord_prepared_email_err_msg', 'PARENT_FIELD_NOT_POPULATED');
      else if (e == 'ERROR_WITH_NON_USD_DENOMINATIONS')
        emailRecord.setFieldValue('custrecord_prepared_email_err_msg', 'ERROR_WITH_NON_USD_DENOMINATIONS');
      else if (e == 'PROBLEM_FINDING_CHILD_FUNDS')
        emailRecord.setFieldValue('custrecord_prepared_email_err_msg', 'PROBLEM_FINDING_CHILD_FUNDS');
      else if (e == 'DOES_NOT_RECEIVE_STATEMENTS')
        emailRecord.setFieldValue('custrecord_prepared_email_err_msg', 'DOES_NOT_RECEIVE_STATEMENTS');
      else
        throw e;
      emailRecord.setFieldValue('custrecord_prepared_email_status', Status.ERROR);
      nlapiSubmitRecord(emailRecord, false, false); // save record
    }

    //if(i > 3 && i < (emails.length -1 ))	// DEVELOPMENT
    if (i > 90 && i < emails.length) // PRODUCTION
    {
      return emailRecord.getId(); // return last internal id
    }
  }

  parentJob.setFieldValue('custrecord_prepared_email_job_status', Status.READY_FOR_CONFIRMATION);
  nlapiSubmitRecord(parentJob, false, false); // save record

  doEmailJobStatusCounter(parentRecordId);

  return null;
}
/*
 * END LIST OF WORKFLOW ACTION FUNCTIONS
 */

/*
 * LIST OF COMMON FUNCTIONS
 */
function doParseAndReplace(emailRecord, parentRecord) {
  emailRecord.setFieldValue('custrecord_prepared_email_status', Status.IN_PROCESS);

  var rpt = emailRecord.getFieldValue('custrecord_prepared_email_body'); // the blank template
  var sdaId = emailRecord.getFieldValue('custrecord_rpt_access_record'); // the shareholder data access record
  var sda = nlapiLoadRecord('customrecord_shareholder_data_access', sdaId);
  //var stingSDA = JSON.stringify(sda);  //STS ADDED TEMPORARY
  //nlapiLogExecution("DEBUG", "SDA", "SDA RECORD = " + stingSDA);  //STS ADDED TEMPORARY
  var contact = getContact(emailRecord.getFieldValue('custrecord_prepared_email_recipient')); // 0) Get the contact record associated with the shareholder access record
  var errMsg = '';

  // verify that this record wants to receive emailed statements
  var doNotReceiveStmts = sda.getFieldText('custrecord_receive_no_statements');
  if (doNotReceiveStmts && doNotReceiveStmts != null && doNotReceiveStmts == 'Y')
    throw 'DOES_NOT_RECEIVE_STATEMENTS';

  // @FIRM_NAME@
  var firmName = getFirmName(sda);
  rpt = rpt.replace(/@FIRM_NAME@/gi, firmName);

  // @STATEMENT_AS_OF_DATE@
  var asOfDate = parentRecord.getFieldValue('custrecord_month_stmt_as_of_date');
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplace", "asOfDate = " + asOfDate);
  rpt = rpt.replace(/@STATEMENT_AS_OF_DATE@/gi, asOfDate);

  //MGS
  // @SRS_NEW_PORTAL_URL@
  var urlText = getNewPortalURL(contact);
  rpt = rpt.replace(/@SRS_NEW_PORTAL_URL@/gi, urlText);

  //MGS
  // @WEBLINK_HASH@
  var linkText = getNewPortalWeblink(contact);
  rpt = rpt.replace(/@WEBLINK_HASH@/gi, linkText);

  //MGS
  //@SRS_DEMOLINK_URL@
  var demoLinkText = getDemoLinkURL(contact);
  rpt = rpt.replace(/@SRS_DEMOLINK_URL@/gi, demoLinkText);

  //MGS
  //@CONTACT_NAME@
  rpt = rpt.replace(/@CONTACT_NAME@/gi, contact.firstname);

  //MGS
  //@ADVISORY_COMMITTEE@
  var adComText = getAdComText(contact);
  var contactId = contact.internalid;
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.js", "The contactId is " + contactId);
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.js", "The adComText is " + adComText);
  rpt = rpt.replace(/@ADVISORY_COMMITTEE_TEXT@/gi, adComText);

  // @SRS_PORTAL_PARAGRAPH@
  var portalText = getPortalParagraph(contact);
  rpt = rpt.replace(/@SRS_PORTAL_PARAGRAPH@/gi, portalText);

  // @USD_ESCROW_BALANCES@
  var parent = sda.getFieldValue('custrecord_toplevelparent'); // this will come back with either the investor group for the shareholders, or a single shareholder
  //var deals = toArray(sda.getFieldValues('custrecord_escrow'));
  var deals = toArray(emailRecord.getFieldValues('custrecord_deals'));

  var shareholders = toArray(sda.getFieldValues('custrecord_shareholder'));
  if (shareholders == null || shareholders.length == 0) {
    if (parent == null) throw 'PARENT_FIELD_NOT_POPULATED';
    shareholders = getChildFunds([parent], false);
  }

  var usdData = getEscrowBalances(true, deals, shareholders, asOfDate);
  var usdDisp = getEscrowBalanceDisplay(usdData);
  //usdDisp = '<table cellpadding="2" cellspacing="1" border="1" bgcolor="red">' + usdDisp;
  rpt = rpt.replace(/@USD_ESCROW_BALANCES@/gi, usdDisp);

  // @NON_USD_ESCROW_BALANCES@
  var nonUsdData = getEscrowBalances(false, deals, shareholders, asOfDate);
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "nonUsdData is " + JSON.stringify(nonUsdData));
  //Need to gather ALL the glAccount_Ids before the nonUsdData is converted because after the conversion, the glAccount_Ids no longer exist in the nonUsdData Array
  //This is becuase we need the glAccount_Ids to ensure that we are grabbing on ly the events / Important Dates that are associated with the prorata for each shareholder
  //based on the accounts they have prorata in
  var allData = usdData.concat(nonUsdData);
  var accountIDs = [];
  for(var i = 0; i < allData.length; i++){
    //Build a list of Account IDs
    accountIDs.push(allData[i].account_id);  
  }

  var nonUsdDisp = getEscrowBalanceDisplay(nonUsdData);
  //nonUsdDisp = '<table cellpadding="2" cellspacing="1" border="0">' + nonUsdDisp;
  rpt = rpt.replace(/@NON_USD_ESCROW_BALANCES@/gi, nonUsdDisp);

  var assetOnlyShareholders = sda.getFieldValues('custrecord_ignore_zero_bal_for_deals');
  if ((usdData == null || usdData.length == 0) && (nonUsdData == null || nonUsdData.length == 0)) { // no data found to display
    if (assetOnlyShareholders == null)
      throw 'NO_ESCROW_BALANCES_FOUND';
    else
      errMsg = 'ASSET_ONLY_DEAL_DETECTED-NO_ESCROW_BALANCES';
  }

  // @USD_AND_NON_USD_TOTAL@
  // convert nonUsdData to USD
  nonUsdData = convertToUSD(nonUsdData, asOfDate);
  var totalLine = getEscrowBalanceTotalDisplay(usdData, nonUsdData); //+ '</table>'; //add closing table to make things work for share escrows
  totalLine = '<table cellpadding="2" cellspacing="1" border="0">' + totalLine;
  rpt = rpt.replace(/@USD_AND_NON_USD_TOTAL@/gi, totalLine);

  // get list of major shareholders and the deals they belong to
  var majorShrs = getMajorShareholders(shareholders, parent);
  var majorShrDeals = getMajorShareholderDeals(majorShrs, deals);

  // @DEAL_STATUS_REPORTS@
  var onOrAfter = new Date(asOfDate);
  var theMonth = onOrAfter.getMonth();
  var theYear = onOrAfter.getFullYear();
  //if (theMonth == 11) {
    //theMonth = -1; // deal with rollover from December to January
    //theYear = theYear + 1;
  //}
    if (theMonth == 0) {
      theMonth = 11; // deal with rollover from December to January
      theYear = theYear - 1;
    }
  onOrAfter.setDate(1); // set to some, near end of month date setting to 15th of month
  onOrAfter.setMonth(theMonth - 1); // increment one month
  onOrAfter.setFullYear(theYear); // reset year

  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplace", "onOrAfter = " + onOrAfter);
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplace", "email id = " + emailRecord.getFieldText('internalid'));

  //var news = getEscrowStatementNews(majorShrDeals,onOrAfter);
  var news = getEscrowStatementNews(deals, onOrAfter);
  var newsDisp = displayEscrowStatementNews(news, majorShrDeals);
  rpt = rpt.replace(/@DEAL_STATUS_REPORTS@/gi, newsDisp);

  // @CASH_FLOW_TABLE@
  
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "allData is " + JSON.stringify(allData));
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "accountIDs is " + JSON.stringify(accountIDs)); 
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "deals is " + JSON.stringify(deals)); 
  //var releaseDates = filterUniqueDates(getEventDates(deals, [2, 3], ['CONFIRMED', 'COMPLETE'], accountIDs));
  var releaseDates = getEventDates(deals, [2, 3], ['CONFIRMED', 'COMPLETE'], accountIDs);
  //var releaseDates = getEventDates(deals, [2, 3], ['CONFIRMED', 'COMPLETE']);
  var releaseHtml = displayReleaseDateTable(releaseDates);
  rpt = rpt.replace(/@CASH_FLOW_TABLE@/gi, releaseHtml);

  emailRecord.setFieldValue('custrecord_prepared_email_body', rpt);
  emailRecord.setFieldValue('custrecord_prepared_email_status', Status.READY_FOR_CONFIRMATION);
  emailRecord.setFieldValue('custrecord_prepared_email_err_msg', errMsg);
  nlapiSubmitRecord(emailRecord, false, false);
}


function doParseAndReplace_non_statement(emailRecord, parentRecord) {
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplace_non_statement", "Begin");
  emailRecord.setFieldValue('custrecord_prepared_email_status', Status.IN_PROCESS);

  var rpt = emailRecord.getFieldValue('custrecord_prepared_email_body'); // the blank template
  var sdaId = emailRecord.getFieldValue('custrecord_rpt_access_record'); // the shareholder data access record
  var sda = nlapiLoadRecord('customrecord_shareholder_data_access', sdaId);
  var contact = getContact(emailRecord.getFieldValue('custrecord_prepared_email_recipient')); // 0) Get the contact record associated with the shareholder access record
  var errMsg = '';

  // verify that this record wants to receive emailed statements
  var doNotReceiveStmts = sda.getFieldText('custrecord_receive_no_statements');
  if (doNotReceiveStmts && doNotReceiveStmts != null && doNotReceiveStmts == 'Y')
    throw 'DOES_NOT_RECEIVE_STATEMENTS';

  // @FIRM_NAME@
  var firmName = getFirmName(sda);
  rpt = rpt.replace(/@FIRM_NAME@/gi, firmName);

  // @STATEMENT_AS_OF_DATE@
  var asOfDate = parentRecord.getFieldValue('custrecord_month_stmt_as_of_date');
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplace_non_statement", "asOfDate = " + asOfDate);
  rpt = rpt.replace(/@STATEMENT_AS_OF_DATE@/gi, asOfDate);

  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplace_non_statement", "Contact = " + contact);

  //MGS
  // @SRS_NEW_PORTAL_URL@
  var urlText = getNewPortalURL(contact);
  rpt = rpt.replace(/@SRS_NEW_PORTAL_URL@/gi, urlText);

  //MGS
  // @WEBLINK_HASH@
  var linkText = getNewPortalWeblink(contact);
  rpt = rpt.replace(/@WEBLINK_HASH@/gi, linkText);

  //MGS
  //@SRS_DEMOLINK_URL@
  var demoLinkText = getDemoLinkURL(contact);
  rpt = rpt.replace(/@SRS_DEMOLINK_URL@/gi, demoLinkText);

  //MGS
  //@CONTACT_NAME@
  rpt = rpt.replace(/@CONTACT_NAME@/gi, contact.firstname);

  //MGS
  //@ADVISORY_COMMITTEE@
  var adComText = getAdComText(contact);
  rpt = rpt.replace(/@ADVISORY_COMMITTEE_TEXT@/gi, adComText);

  // @SRS_PORTAL_PARAGRAPH@
  var portalText = getPortalParagraph(contact);
  rpt = rpt.replace(/@SRS_PORTAL_PARAGRAPH@/gi, portalText);

  emailRecord.setFieldValue('custrecord_prepared_email_body', rpt);
  emailRecord.setFieldValue('custrecord_prepared_email_status', Status.READY_FOR_CONFIRMATION);
  emailRecord.setFieldValue('custrecord_prepared_email_err_msg', errMsg);
  nlapiSubmitRecord(emailRecord, false, false);
}


function getFirmName(sda) {
  // 0) Find the firm name
  //   A) Get the Investor Group name if present. If none...
  //   B) Get the first shareholder, and get the parent of that entity. If no parent...
  //   C) Use the first shareholder.
  // 1) Replace @FIRM_NAME@

  var name = sda.getFieldText('custrecord_investor_group');
  if (name != null && name.length > 0) return name;

  var shareholders = sda.getFieldTexts('custrecord_shareholder');
  if (shareholders != null && shareholders.length > 0) {
    return shareholders[0];
  }

  return 'no name found';
}

/*function getPortalParagraph(contact)
{
	if(contact.hasaccess == 'F') return '';		// 1) Query to determine if this person has access to the portal from the contact record

	var file;
	if(contact.haschangedpwd == 'Y' || (contact.initialpassword == null || contact.initialpassword.length == 0))
		file = nlapiLoadFile(Template.PORTAL_LOGIN);		// load up Template.
	else
		file = nlapiLoadFile(Template.PORTAL_NEW_LOGIN);	// load up Template.

	if(file == null) return 'contact.haschangedpwd = ' + contact.haschangedpwd + '. Attempted to load file, but was not found';

	var template = file.getValue();

	template = template.replace(/@EMAIL_ADDRESS@/gi, contact.email);
	template = template.replace(/@USER_INITIAL_PASSWORD@/gi, contact.initialpassword);	// this will only be found if applicable

	return template;
}*/

function getEscrowBalanceTotalDisplay(usdData, nonUsdData) {
  if (usdData == null || nonUsdData == null || usdData.length == 0 || nonUsdData.length == 0) return '';

  var balances = newBalanceObject();

  for (var i = 0; i < usdData.length; i++) {
    var usdDatum = usdData[i];
    balances = updateBalances(balances, usdDatum);
  }

  for (var i = 0; i < nonUsdData.length; i++) {
    var nonUsdDatum = nonUsdData[i];
    balances = updateBalances(balances, nonUsdDatum);
  }
  //updated display to add table to begin the share escrow display.  Without the table in the line below
  //there would be a break in the table structure and an error would appear
  var html = '<table cellpadding="2" cellspacing="1" border="0">'; //'';
  html += '<tr><th colspan="2" align="left"> &nbsp; Total All Denominations (USD)</th>';
  html += createNewStatementLine(balances);

  return html;
}

function getEscrowBalanceDisplay(data) {
  if (data == null || data.length == 0) return '';

  var balances = newBalanceObject();
  var runningBalance = newBalanceObject();

  var denominationHtml = '<tr><th style="padding: 1em;  font-weight: normal; background-color: white;  color: black;" align="left" colspan="8" >Denomination: ';
  //var html = '<tr><th align="center">Account</th>' + '<th align="left">Shareholder</th>' + '<th>Initial<br/>Deposits/<br/>Holdbacks</th>' + '<th>Investment<br/>Earnings</th>' + '<th>Claims<br/>Paid</th>' + '<th>Expenses</th>' + '<th>Disbursements</th>' + '<th>Current<br/>Balance</th></tr>';
  var html = '';
  var lastDeal = null;
  var lastDenom = null;
  
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];

    if (lastDeal != null && datum.deal != lastDeal) { // construct the display
      // account
      html += '<tr style="font-weight:bold;" bgcolor="#e3fffb"><th style="border-top:1px solid #000000; padding-top: 1em; padding-bottom: 1em;" colspan="2" align="left"><b> &nbsp; Subtotal: ' + lastDeal + '</b></th>'; 
      html += createNewStatementLine(runningBalance, 'subTotal') + '</tr><tr><th colspan="8">&nbsp;</th></tr>';
      runningBalance = newBalanceObject(); // reset
    }
    
    var currentDeal = datum.deal;
    
    if (lastDenom == null || lastDenom != datum.denomination) html += denominationHtml + datum.denomination + '</th></tr>'; // denomination
    
    lastDenom = datum.denomination;

    if (lastDeal == null || datum.deal != lastDeal) {
      html += '<tr><th colspan="8" align="left" style="font-weight: bold; border-top: 5px solid #ffc600; border-bottom: none; padding-top: .5em;  padding-bottom:  .4em; padding-top: 1em">Deal: ' + datum.deal +'</th></tr>';
      html += '<tr style="color: #aaa; border-top: none !important;"><th style=" font-weight: normal" align="left">Account</th>' + '<th align="left">Shareholder</th>' + '<th align="right">Initial<br/>Deposit/<br/>Holdback</th>' + '<th align="right">Investment<br/>Earnings</th>' + '<th align="right">Claims<br/>Paid</th>' + '<th align="right">Expenses</th>' + '<th align="right">Disbursements</th>' + '<th align="right">Current<br/>Balance</th></tr>';
    }

    lastDeal = datum.deal;

 

    // construct the display
    html += '<tr style="line-height: 2;"><td>' + datum.account + '</td>'; // account
    html += '<td>' + datum.shareholder + '</td>'; // shareholder
    html += createNewStatementLine(datum) + '</tr>'; // all amounts

    balances = updateBalances(balances, datum); // update the balances
    runningBalance = updateBalances(runningBalance, datum); // update the running balance
  }
  // add the final subtotal
  html += '<tr style="font-weight:bold;" bgcolor="#e3fffb"><th style="border-top:1px solid #000000; padding-top: 1em; padding-bottom: 1em;" colspan="2" align="left"><b> &nbsp; Subtotal: ' + lastDeal + '</b></th>'; // account
  html += createNewStatementLine(runningBalance, 'subTotal') + '</tr>';

  html += '<tr style="font-weight:bold" valign="bottom"><th style="padding-top: 1.5em;border-top:1px; border-bottom: 4px double #009681;" colspan="2" align="left"><b> &nbsp; Total:</b></th>';
  html += createNewStatementLine(balances, 'total');
  html += '</tr>';

  return html;
}

function createNewStatementLine(dataLine, isSummary) {
  if(isSummary == 'subTotal'){
    var tdFormat = '<td style="border-top:1px solid #000000" align="right">';
  }else if(isSummary == 'total'){
    var tdFormat = '<td style="border-top:1px solid #000000; border-bottom: 4px double #009681;" align="right">';
  }else{
    var tdFormat = '<td align="right">'   
  }
  
  var html = '';
  html += tdFormat + formatCurrency(sumAndRound(dataLine.deposits, dataLine.holdbacks)) + '</td>'; // deposits + holdbacks
  html += tdFormat + formatCurrency(dataLine.investmentearnings) + '</td>'; // investment earnings
  html += tdFormat + formatCurrency(dataLine.claimspaid) + '</td>'; // claims paid
  html += tdFormat + formatCurrency(dataLine.expenses) + '</td>'; // expenses
  html += tdFormat + formatCurrency(dataLine.disbursements) + '</td>'; // disbursements
  html += tdFormat + formatCurrency(dataLine.balance) + '</td>'; // balance

  return html;
}

function newBalanceObject() {
  var total = {
    'balance': 0.0,
    'deposits': 0.0,
    'holdbacks': 0.0,
    'depositsholdbacks': 0.0,
    'investmentearnings': 0.0,
    'claimspaid': 0.0,
    'expenses': 0.0,
    'disbursements': 0.0
  };
  return total;
}

function updateBalances(total, datum) {
  total.balance = sumAndRound(total.balance, datum.balance);
  total.deposits = sumAndRound(total.deposits, datum.deposits);
  total.holdbacks = sumAndRound(total.holdbacks, datum.holdbacks);
  total.depositsholdbacks = sumAndRound(total.depositsholdbacks, datum.deposits + datum.holdbacks);
  total.investmentearnings = sumAndRound(total.investmentearnings, datum.investmentearnings);
  total.claimspaid = sumAndRound(total.claimspaid, datum.claimspaid);
  total.expenses = sumAndRound(total.expenses, datum.expenses);
  total.disbursements = sumAndRound(total.disbursements, datum.disbursements);

  return total;
}

function applyConversion(oldDatum, usdConversion) {
  var newDatum = newBalanceObject();

  newDatum.balance = convert(oldDatum.balance, usdConversion);
  newDatum.deposits = convert(oldDatum.deposits, usdConversion);
  newDatum.holdbacks = convert(oldDatum.holdbacks, usdConversion);
  newDatum.depositsholdbacks = convert(oldDatum.depositsholdbacks, usdConversion);
  newDatum.investmentearnings = convert(oldDatum.investmentearnings, usdConversion);
  newDatum.claimspaid = convert(oldDatum.claimspaid, usdConversion);
  newDatum.expenses = convert(oldDatum.expenses, usdConversion);
  newDatum.disbursements = convert(oldDatum.disbursements, usdConversion);

  return newDatum;
}

function convert(theNum, usdConversion) {
  return Math.round(parseFloat(theNum) * usdConversion * 100.0) / 100;
}

function convertToUSD(nonUsdData, asOfDate) {
  if (nonUsdData == null || nonUsdData.length == 0) return Array();

  var filters = new Array();
  filters.push(new nlobjSearchFilter('custrecordquote_date', null, 'onorbefore', asOfDate));
  filters.push(new nlobjSearchFilter('name', null, 'is', 'set me'));
  var columns = new Array();
  columns.push(new nlobjSearchColumn('custrecordquote_date', null, null));
  columns[0].setSort(true); // sort by date in descending order
  columns.push(new nlobjSearchColumn('custrecord_srs_usd_quote', null, null));

  var convertedNonUsdData = new Array();
  for (var i = 0; i < nonUsdData.length; i++) {
    var datum = nonUsdData[i];

    //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.convertToUSD", "denomination is " + datum.denomination);

    // get the conversion --> denomination = currency
    filters[1] = new nlobjSearchFilter('name', null, 'is', datum.denomination); // this is a string based field
    var results = nlapiSearchRecord('customrecord_stock_tickers', null, filters, columns);

    if (results == null || results.length == 0) throw 'ERROR_WITH_NON_USD_DENOMINATIONS';
    //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.convertToUSD", "results.length is " + results.length);

    var result = results[0]; // we only want the most recent
    var usdConversion = parseFloat(result.getValue('custrecord_srs_usd_quote'));
    //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.convertToUSD", "usdConversion is " + usdConversion);
    var convertedDatum = applyConversion(datum, usdConversion); // apply the conversion

    convertedNonUsdData.push(convertedDatum); // update the record
  }
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "convertedNonUsdData is " + JSON.stringify(convertedNonUsdData));
  return convertedNonUsdData;
}

function getMajorShareholderDeals(shareholders, deals) {
  if (shareholders == null || shareholders.length == 0) return null;
  if (deals == null || deals.length == 0) return null;

  var filters = new Array();
  filters.push(new nlobjSearchFilter('custrecord16', null, 'anyof', shareholders));
  filters.push(new nlobjSearchFilter('custrecord15', null, 'anyof', deals));
  var columns = new Array();
  columns.push(new nlobjSearchColumn('custrecord15', null, 'group'));
  var searchResults = nlapiSearchRecord('customrecord12', null, filters, columns);

  if (searchResults == null || searchResults.length == 0) return new Array();

  var majorDeals = new Array();
  for (var i = 0; i < searchResults.length; i++) {
    var result = searchResults[i];
    majorDeals.push(result.getValue('custrecord15', null, 'group'));
  }
  return majorDeals;
}

function getEscrowStatementNews(deals, onOrAfter) {
  if (deals == null || deals.length == 0 || deals == '') return '';
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.getEscrowStatementNews", "major shareholder access deals is " + deals);
  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.getEscrowStatementNews", "major shareholder access deals.length is " + deals.length);

  for (var i = 0; i < deals.length; i++) {
    //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.getEscrowStatementNews", "next major shareholder access deal is " + deals[i]);
  }

  var filters = new Array();
  filters.push(new nlobjSearchFilter('custrecord88', null, 'anyof', deals));
  filters.push(new nlobjSearchFilter('custrecord89', null, 'onorafter', onOrAfter));
  filters.push(new nlobjSearchFilter('custrecordesnapproval', null, 'anyof', '4')); //only Published
  filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
  var columns = new Array();
  columns.push(new nlobjSearchColumn('custrecord88', null, null)); // deal
  columns[0].setSort(); // sort by deal name
  columns.push(new nlobjSearchColumn('custrecord90', null, null)); // major_news
  columns.push(new nlobjSearchColumn('custrecordcom_sh_news', null, null)); // custrecordcom_sh_news
  columns.push(new nlobjSearchColumn('custrecord89', null, null)); // news date
  var searchResults = nlapiSearchRecord('customrecord28', null, filters, columns);

  if (searchResults == null || searchResults.length == 0) return new Array();

  var allNews = new Array();
  for (var i = 0; i < searchResults.length; i++) {
    var result = searchResults[i];

    var news = {
      'deal': result.getText('custrecord88', null, null),
      'deal_id': result.getValue('custrecord88'),
      'major_news': result.getValue('custrecord90', null, null),
      'common_news': result.getValue('custrecordcom_sh_news', null, null),
      'news_date': result.getValue('custrecord89', null, null)
    };

    allNews.push(news);
  }
  return allNews;
}

function displayEscrowStatementNews(allNews, majorDeals) {
  if (allNews == null || allNews.length == 0) return '';

  var html = '<br/><table width="100%"><tr><th colspan="3" align="left"><b>Escrow Statement News</b></th></tr><tr><th width="50" align="left">Date</th><th width="180" align="left">Deal</th><th width="555" align="left">News</th></tr>';
  for (var i = 0; i < allNews.length; i++) {
    var news = allNews[i];

    html += '<tr><td valign="top">' + news.news_date + '</td>';
    html += '<td valign="top">' + news.deal + '</td>';
    if (majorDeals != null && majorDeals.indexOf(news.deal_id) >= 0) {
      html += '<td width="555" valign="top" class="major">' + news.major_news + '</td></tr>';
    } else {
      html += '<td width="555" valign="top">' + news.common_news + '</td></tr>';
    }
  }
  html += '</table>';

  return html;
}

function displayReleaseDateTable(releaseEvents) {
  if (releaseEvents == null || releaseEvents.length == 0) return '';

  var html = '<br/><table width="100%"><tr><th colspan="3" align="left"><b>Upcoming Events</b></th></tr><tr><th width="80" align="left">Date</th><th width="300" align="left">Account</th><th width="100" align="left">Percentage of Initial Deposit/Holdback</th></tr>';
  for (var i = 0; i < releaseEvents.length; i++) {
    var release = releaseEvents[i];
    html += '<tr><td>' + release.date + '</td><td>' + release.account_name + '</td><td>' + release.release_pct + '</td></tr>';
  }
  html += '</table>';

  return html;
}
