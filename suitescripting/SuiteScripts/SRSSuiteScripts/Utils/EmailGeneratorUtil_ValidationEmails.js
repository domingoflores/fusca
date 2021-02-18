/**
 * @author durbano
 */
function createNewValidationEmails()
{
	var parentRecordId = nlapiGetRecordId();	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_ValidationEmails.createNewValidationEmails", "Working on Prepared Email Job " + parentRecordId);
		
	/*
	 * 1. Get dealId
	 * 2. For dealId, get list of major shareholders
	 * 3. For each unique Investor Group/Shareholder, create one Prepared Email for each contact
	 */
	var dealId = parent.getFieldValue('custrecord_prepared_email_deal_name');
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_ValidationEmails.createNewValidationEmails", "dealId = " + dealId);
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('custrecord15',null,'is',dealId));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord15',null,'group'));			// escrow/deal
		columns.push(new nlobjSearchColumn('parent','custrecord16','group'));		// top level parent
		columns.push(new nlobjSearchColumn('custrecord_ms_contact',null,'group'));	// contact
	
	var rpts = nlapiSearchRecord('customrecord12',null,filters,columns);

	if(rpts == null || rpts.length == 0)
		throw 'No Reports Found to Generate';

	for (var i = 0; i < rpts.length; i++)
	{
		var rpt = rpts[i];
		createPreparedEmailRecord(rpt, parent);
	}	

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_ScheduledScripts.createNewValidationEmails", "Prepared Email Records Created");
}

function parseAndReplace()
{
	var parentRecordId = nlapiGetRecordId();
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	parent.setFieldValue('custrecord_prepared_email_job_status',Status.PAUSED);
	nlapiSubmitRecord(parent,false,false);		// save record
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_ValidationEmails.parseAndReplace", "Working on Prepared Email Job " + parentRecordId);

	var params = new Array();
	params['custscript_prep_email_job_id_3'] = parentRecordId;
	nlapiScheduleScript('customscript_ms_deal_valid_temp_parse_sc','customdeploy_ms_deal_valid_temp_parse_sc',params);
	// fin
}

function parseAndReplaceScheduled()
{
	var context = nlapiGetContext();
	var parentRecordId = context.getSetting('SCRIPT', 'custscript_prep_email_job_id_3');
	var lastInternalId = context.getSetting('SCRIPT', 'custscript_last_internal_id3');
	
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_ValidationEmails.parseAndReplace", "Working on Prepared Email Job " + parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.parseAndReplaceScheduled", "lastInternalId = " + lastInternalId);

	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', parentRecordId));
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', Status.COMPLETED));
	if (lastInternalId != null) {
		filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(lastInternalId)));
	}

	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_prepared_email_body'));

	var emails = nlapiSearchRecord('customrecord_prepared_emails',null, filters, columns);
	if(emails == null || emails.length == 0) throw 'No emails found for job';
	var newLastInternalId = null;

	for (var i = 0; i < emails.length; i++)
	{
		try 
		{
			var email = emails[i];
			var emailRecord = nlapiLoadRecord('customrecord_prepared_emails', email.getId());
			
			doParseAndReplace(emailRecord, parent);
		} 
		catch (e) 
		{
			if (e == 'NO_ESCROW_BALANCES_FOUND') { 
				emailRecord.setFieldValue('custrecord_prepared_email_status', Status.ERROR);
				emailRecord.setFieldValue('custrecord_prepared_email_err_msg', 'NO_ESCROW_BALANCES_FOUND');
				nlapiSubmitRecord(emailRecord, false, false); // save record
				continue;
			}
			throw e;
		}
		
		if (i > 3 && i < (emails.length-1)) // PRODUCTION
		{
			newLastInternalId = emailRecord.getId(); // return last internal id
			break;
		}		
	}

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_ValidationEmails.parseAndReplace", "Updating status of email job.");

	// call the scheduled script again using the internal id
	if(newLastInternalId != null)
	{
		var params = new Array();
		params['custscript_prep_email_job_id_3'] = parentRecordId;
		params['custscript_last_internal_id3'] = newLastInternalId;
		nlapiScheduleScript('customscript_ms_deal_valid_temp_parse_sc','customdeploy_ms_deal_valid_temp_parse_sc',params);
		return;
	}

	parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId);
	parent.setFieldValue('custrecord_prepared_email_job_status', Status.READY_FOR_CONFIRMATION);
	nlapiSubmitRecord(parent, false, false); // save record
	// fin
}

function doParseAndReplace(emailRecord, parentRecord)
{
	emailRecord.setFieldValue('custrecord_prepared_email_status', Status.IN_PROCESS);
	
	var template = nlapiLoadFile(parentRecord.getFieldValue('custrecord_prepared_email_template')); 			// the blank template
	if(template == null)	throw 'Template is null';
	
	var rpt = template.getValue();
	var dealId = parentRecord.getFieldValue('custrecord_prepared_email_deal_name');
	var deal = nlapiLoadRecord('customer',dealId);
	var contact = getContact(emailRecord.getFieldValue('custrecord_prepared_email_recipient')); 	// 0) Get the contact record associated with the shareholder access record
	var asOfDate = parentRecord.getFieldValue('custrecord_month_stmt_as_of_date');
	
	rpt = rpt.replace(/@CONTACT_NAME@/gi, contact.name);										// @CONTACT_NAME@
	rpt = rpt.replace(/@SELLER_NAME@/gi, deal.getFieldValue('custentity_selling_company'));		// @SELLER_NAME@
	rpt = rpt.replace(/@BUYER_NAME@/gi, deal.getFieldValue('custentity29'));					// @BUYER_NAME@
	rpt = rpt.replace(/@DEAL_EMAIL_ADDRESS@/gi, deal.getFieldValue('email'));					// @DEAL_EMAIL_ADDRESS@
	rpt = rpt.replace(/@MERGER_NAME@/gi, deal.getFieldText('custentity_agreement_name'));		// @MERGER_NAME@
	rpt = rpt.replace(/@SRS_MERGER_ROLE@/gi, deal.getFieldText('custentity37'));				// @SRS_MERGER_ROLE@
	
	var shareholderIds = getShareholdersWithContactFromMajorShareholders(contact.internalid, dealId);	// this might seem redundant...and it might be, but we need to make sure to get all shareholders, whether they were marked as a major shareholder or not.
	var parents = getTopLevelParents(shareholderIds);
	var shareholders = toArray(getChildFunds(parents,false));
	
	var topLevelParent =  nlapiLoadRecord('customer',parents[0]);
	rpt = rpt.replace(/@INVESTOR_GROUP_NAME@/gi, topLevelParent.getFieldValue('companyname'));	// @INVESTOR_GROUP_NAME@
	
	// @AUTHORIZED_REPRESENTATIVES@
	var majShContacts = getMajShareholderContacts(parents.concat(shareholders),[dealId]);
	var majShConDispl = displayContacts(majShContacts);
	if(majShConDispl != null && majShConDispl.length > 0)
		rpt = rpt.replace(/@AUTHORIZED_REPRESENTATIVES@/gi, majShConDispl);
	else
		rpt = rpt.replace(/@AUTHORIZED_REPRESENTATIVES@/gi, 'NO AUTHORIZED REPRESENTATIVES');	
	
	// @AUTHORIZED_RECIPIENTS@
	var otherContacts = getReportAccessRecordContacts(parents,[dealId]);
	var contactDispla = displayContacts(otherContacts);
	if(contactDispla != null && contactDispla.length > 0)
		rpt = rpt.replace(/@AUTHORIZED_RECIPIENTS@/gi, contactDispla);
	else
		rpt = rpt.replace(/@AUTHORIZED_RECIPIENTS@/gi, 'NO AUTHORIZED RECIPIENTS');
	
	// @ESCROW_BALANCES@
	var usdData = getEscrowBalances(true,[dealId],shareholders,asOfDate);
	var nonUsdData = getEscrowBalances(false,[dealId],shareholders,asOfDate);
	
	usdData = getProRataData([dealId],usdData);
	nonUsdData = getProRataData([dealId],nonUsdData);
	
	if((usdData == null || usdData.length == 0) && (nonUsdData == null || nonUsdData.length == 0))
		throw 'NO_ESCROW_BALANCES_FOUND';
	
	var escBalDisp  = displayData(usdData);
		escBalDisp += displayData(nonUsdData);
		escBalDisp  = '<table cellpadding="2" cellspacing="1" border="0">' + escBalDisp + '</table>';	
	rpt = rpt.replace(/@ESCROW_BALANCES@/gi, escBalDisp);

	var closingData = getClosingData([dealId],shareholders);
	var closingDataDisp = '<br/><br/>' + displayClosingData(closingData);
	rpt = rpt.replace(/@CLOSING_DATA@/gi, closingDataDisp);			// @CLOSING_DATA@

	// SRS_PORTAL_PARAGRAPH
	var portalText = getPortalParagraph(contact);
	rpt = rpt.replace(/@SRS_PORTAL_PARAGRAPH@/gi, portalText);

	emailRecord.setFieldValue('custrecord_prepared_email_body',rpt);
	emailRecord.setFieldValue('custrecord_prepared_email_status',Status.READY_FOR_CONFIRMATION);
	nlapiSubmitRecord(emailRecord,false,false);
	// fin
}

/**
 * 
 */
function createPreparedEmailRecord(report,parent)
{
	var record = nlapiCreateRecord('customrecord_prepared_emails');
	// status should be already set to 'NEW', or whatever the default status is.
	
	// set the user, template/body of the email and subject
	var user = report.getValue('custrecord_ms_contact',null,'group');
	if(user == null)
	{
		throw 'No User found for Major Shareholder record';
	}
	
	var deal = report.getValue('custrecord15',null,'group');		// deal
	if(deal == null)
	{
		throw 'No deal defined for Prepared Email Record';
	}
	
 	record.setFieldValue('custrecord_prepared_email_recipient',user);
	record.setFieldValue('custrecord_prepared_email_body','EMAIL BODY PENDING');
	record.setFieldValue('custrecord_prepared_email_subject',parent.getFieldValue('name'));
	record.setFieldValues('custrecord_deals',[deal]);

	// associate to parent prepared email job
	record.setFieldValue('custrecord_prepared_email_job',parent.getId());

	nlapiSubmitRecord(record,false,false);
}

function displayData(data)
{
	if(data == null || data.length == 0) return '';
	
	var html = '<tr><th align="left">Account</th><th>Shareholder</th><th>Denomination</th><th>Initial Deposit</th><th>Pro Rata</th></tr>';
	
	for(var i = 0; i < data.length; i++)
	{
		var datum = data[i];
		
		html += '<tr bgcolor="#CCCCCC"><td style="font-family: arial,helvetica,sans-serif; font-size: 12px;">' + datum.account + '</td>';		// account
		html += '<td style="font-family: arial,helvetica,sans-serif; font-size: 12px;">' + datum.shareholder + '</td>';						// shareholder
		html += '<td style="font-family: arial,helvetica,sans-serif; font-size: 12px;">' + datum.denomination + '</td>';						// denomination
		html += '<td align="right" style="font-family: arial,helvetica,sans-serif; font-size: 12px;">' + formatCurrency(sumAndRound(datum.deposits,datum.holdbacks)) + '</td>';		// initial escrow
		html += '<td style="font-family: arial,helvetica,sans-serif; font-size: 12px;">' + formatProRataToPercent(datum.pro_rata) + '</td></tr>';						// pro rata
	}
	
	return html;
}

function displayClosingData(data)
{
	if(data == null || data.length == 0) return '';
	
	// @TODO - only display the "payout at closing" columns, if the sum is more than 0.
	var html  = '<table cellpadding="2" cellspacing="1" border="0">';
		html += '<tr><th align="left" style="font-family: arial,helvetica,sans-serif; font-size: 12px;">Shareholder</th><th style="font-family: arial,helvetica,sans-serif; font-size: 12px;">Cash Paid at Closing</th><th style="font-family: arial,helvetica,sans-serif; font-size: 12px;">Shares Paid at Closing</th></tr>';
	
	for(var i = 0; i < data.length; i++)
	{
		var datum = data[i];
		
		html += '<tr bgcolor="#CCCCCC"><td>' + datum.shareholder + '</td>';			// shareholder
		html += '<td align="right">' + formatCurrency(datum.cash_paid_at_close) + '</td>';			// cash paid at closing
		html += '<td align="right">' + formatCurrency(datum.shares_paid_at_close) + '</td></tr>';	// shares paid at closing
	}
	
	return html + '</table>';	
}

function displayContacts(contacts)
{
	if(contacts == null || contacts.length == 0) return '';
	
	var html  = '<ul>';
	for(var i = 0; i < contacts.length; i++)
	{
		var contact = contacts[i];
		
		html += '<li>' + contact.name + ' (' + contact.email + ')</li>';
	}
	
	html += '</ul>'
	
	return html;
}
