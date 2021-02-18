/**
 * @author durbano
 */
function createNewGeneralMessageEmails()
{
	var parentRecordId = nlapiGetRecordId();	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_ValidationEmails.createNewValidationEmails", "Working on Prepared Email Job " + parentRecordId);
		
	/*
	 * 1. Get dealId
	 * 2. Inspect for whether we should focus on major shareholders only, and if so, filter for them
	 * 3. For each unique Investor Group/Shareholder, create one Prepared Email for each contact
	 */
	var dealId = parent.getFieldValue('custrecord_prepared_email_deal_name');
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "dealId = " + dealId);

	var majShrOnly = parent.getFieldValue('custrecord_major_shareholders_only');
		majShrOnly == (majShrOnly == 'T' ? true : false);	

nlapiLogExecution("DEBUG", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "Major SH Only = " + majShrOnly);

	try
	{
		createMajorShareholderEmails(dealId,parent);
	}
	catch(error)
	{
		nlapiLogExecution("ERROR", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "ERROR: " + error);
	}
	
	if(majShrOnly && majShrOnly == true)	return;

	// call scheduled script
	var parentRecordId = nlapiGetRecordId();	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	parent.setFieldValue('custrecord_prepared_email_job_status',Status.PAUSED);
	nlapiSubmitRecord(parent,false,false);		// save record

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "Working on Prepared Email Job " + parentRecordId);
	
	var params = new Array();
	params['custscript_gen_msg_prepared_email_job'] = parentRecordId;
	nlapiScheduleScript('customscript_create_new_general_message','customdeploy_create_new_general_message',params);
	// fin
}

function createNewGeneralMessageEmailsScheduled()
{
	var context = nlapiGetContext();
	var parentRecordId  = context.getSetting('SCRIPT','custscript_gen_msg_prepared_email_job');
	var lastInternalId  = context.getSetting('SCRIPT','custscript_gen_msg_last_internal_id');
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmailsScheduled", "Working on Prepared Email Job " + parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmailsScheduled", "lastInternalId =  " + lastInternalId);

	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	var dealId = parent.getFieldValue('custrecord_prepared_email_deal_name');
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "dealId = " + dealId);
	
	// 1. Get the list of major shareholders. This list should have been created before this scheduled scripts was called
	var majs = null;
	try
	{
		majs = getMajorShareholdersByDeal(dealId);		// because sometimes no major shareholders are assigned to a deal	
	}
	catch(error)
	{
		nlapiLogExecution("ERROR", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "ERROR: " + error);
	}
	
	// 2. Starting with the Participating Shareholder Data record, get a unique list of shareholders, excluding the list of major shareholders
	var filters = new Array();
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('custrecord_participating_escrow',null,'is',dealId));
	if(majs && majs != null && majs.length > 0)
		filters.push(new nlobjSearchFilter('custrecord_participating_shareholder',null,'noneof',majs));
	if(lastInternalId != null)
		filters.push(new nlobjSearchFilter('internalidnumber','custrecord_participating_shareholder','greaterthan',parseInt(lastInternalId)));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid','custrecord_participating_shareholder','group'));	// shareholder id
		columns[0].setSort();	// sort by internalid

	var rcds = nlapiSearchRecord('customrecord2',null,filters,columns);

	if((rcds == null || rcds.length == 0) && lastInternalId == null)	throw 'No Reports Found to Generate';
	if(rcds == null || rcds.length == 0)	return runComplete(parentRecordId); 		// done, nothing more to do

	var allContactIds = new Array();
	var restart = false;				// related to restarting the scheduled script
	var params = new Array();
	for(var i = 0; i < rcds.length; i++)
	{
		var rcd = rcds[i];
		
		var shareholderId = rcd.getValue('internalid','custrecord_participating_shareholder','group');

		//if(i > 30 && i < rcds.length)		// Testing
		if(i > 100 && i < rcds.length)	// PRODUCTION
		{
			// A. Maximally loop through 100?
			params['custscript_gen_msg_prepared_email_job'] = parentRecordId;
			params['custscript_gen_msg_last_internal_id'] = shareholderId;
			restart = true;
			break;
		}

		nlapiLogExecution("DEBUG", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "shareholderId = " + shareholderId);
		var shareholder = nlapiLoadRecord('customer',shareholderId);
		
		// 3. For each shareholder, get all contacts
		var contactIds = null;
		try
		{
			contactIds = getContacts(shareholderId,false); 
		}
		catch(error)
		{
			continue;	// NO_CONTACTS_FOUND
		}
		
		if(contactIds == null)
		{
			nlapiLogExecution("DEBUG", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmailsScheduled", "No contacts found for shareholderId = " + shareholderId);
			continue;
		}
		nlapiLogExecution("DEBUG", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "contactIds = " + contactIds);
		
		/*// 4. Check to see if ant contact already has access to the portal.
		var subFilter = new Array();
			subFilter.push(new nlobjSearchFilter('custrecord_user',null,'anyof',contactIds));
		var subColumn = new Array();
			subColumn.push(new nlobjSearchColumn('internalid',null,null));

		var sdaRcds = nlapiSearchRecord('customrecord_shareholder_data_access',null,subFilter,subColumn);

		//		A. If yes, continue to next shareholder
		if(sdaRcds && sdaRcds.length > 0)
		{
			nlapiLogExecution("AUDIT", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmailsScheduled", "Contact already has access shareholderId = " + shareholderId);
		 	continue;
		}
		*/

		//		B. If no access, create a preparedEmailRecord for all contacts
		for(var j = 0; j < contactIds.length; j++)
		{
			var contactId = contactIds[j];
			allContactIds.push(contactId);
		}
	}
	
	// now remove all duplicates from the list of contacts
	allContactIds = allContactIds.sort();
	allContactIds = allContactIds.filter(function(v,i,o){return v!==o[i-1];});
	for(var i = 0; i < allContactIds.length; i++)
	{
		var allContactId = allContactIds[i];
		createPreparedEmailRecordLocal(allContactId,parent);
	}
	
	if(restart)
	{
		nlapiScheduleScript('customscript_create_new_general_message','customdeploy_create_new_general_message',params);
		return;
	}

	runComplete(parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_GeneralMessage.createNewGeneralMessageEmails", "Prepared Email Records Created");
}

function runComplete(parentRecordId)
{
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId);
	parent.setFieldValue('custrecord_prepared_email_job_status', Status.READY_FOR_CONFIRMATION);
	nlapiSubmitRecord(parent, false, false); // save record
}

/**
 * @todo - Move the following function to EmailGeneratorUtil. 
 * @param {Object} contactId
 * @param {Object} parent
 */
function createPreparedEmailRecordLocal(contactId,parent)
{
	nlapiLogExecution("DEBUG", "EmailGeneratorUtil_GeneralMessage.createPreparedEmailRecordLocal", "Creating prepared email record for " + contactId);
	var record = nlapiCreateRecord('customrecord_prepared_emails');
	// status should be already set to 'NEW', or whatever the default status is.
	
	record.setFieldValue('custrecord_prepared_email_recipient',contactId);
	record.setFieldValue('custrecord_prepared_email_body','EMAIL BODY PENDING');
	record.setFieldValue('custrecord_prepared_email_subject',parent.getFieldValue('name'));

	// associate to parent prepared email job
	record.setFieldValue('custrecord_prepared_email_job',parent.getId());

	// set the applicable deals
	// @todo - need to figure out what deals should be set in the case that this field is empty
	var dealId = parent.getFieldValue('custrecord_prepared_email_deal_name');
	if(dealId != null)
	{
		record.setFieldValues('custrecord_deals',[dealId]);
	}
	
	try
	{
		nlapiSubmitRecord(record,false,false);
	}
	catch(error)
	{
		nlapiLogExecution("ERROR", "EmailGeneratorUtil_GeneralMessage.createPreparedEmailRecordLocal", "error = " + error);
		//if(error.indexOf('Code: INVALID_KEY_OR_REF') == 0) return;
		//throw error + ': Error in EmailGeneratorUtil.createPreparedEmailRecord()';
	}
}

function parseAndReplace()
{
	var parentRecordId = nlapiGetRecordId();
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	parent.setFieldValue('custrecord_prepared_email_job_status',Status.PAUSED);
	nlapiSubmitRecord(parent,false,false);		// save record
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_GeneralMessage.parseAndReplace", "Working on Prepared Email Job " + parentRecordId);

	var params = new Array();
	params['custscript_prep_email_job_id_4'] = parentRecordId;
	nlapiScheduleScript('customscript_general_messages_parse_sch','customdeploy_general_messages_parse_sch',params);
	// fin
}

function parseAndReplaceScheduled()
{
	var context = nlapiGetContext();
	var parentRecordId = context.getSetting('SCRIPT', 'custscript_prep_email_job_id_4');
	var lastInternalId = context.getSetting('SCRIPT', 'custscript_last_internal_id4');
	
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
		
		if (i > 220 && i < emails.length) // PRODUCTION
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
		params['custscript_prep_email_job_id_4'] = parentRecordId;
		params['custscript_last_internal_id4'] = newLastInternalId;
		nlapiScheduleScript('customscript_general_messages_parse_sch','customdeploy_general_messages_parse_sch',params);
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

	// deal specific
	var dealId = parentRecord.getFieldValue('custrecord_prepared_email_deal_name');
	var deal = nlapiLoadRecord('customer',dealId);

	rpt = rpt.replace(/@SELLING_LEGAL_NAME@/gi, deal.getFieldValue('custentity_selling_company'));		// @SELLING_LEGAL_NAME@
	rpt = rpt.replace(/@SELLING_SHORT_NAME@/gi, deal.getFieldValue('custentity_selling_company'));		// @SELLING_SHORT_NAME@
	rpt = rpt.replace(/@BUYER_LEGAL_NAME@/gi, deal.getFieldValue('custentity29'));						// @BUYER_LEGAL_NAME@
	rpt = rpt.replace(/@BUYER_SHORT_NAME@/gi, deal.getFieldValue('custentity40'));						// @BUYER_SHORT_NAME@
	rpt = rpt.replace(/@SELLER_EMAIL@/gi, deal.getFieldValue('email'));									// @SELLER_EMAIL@

	// get the additional deal information
	var dealAdd = getFurtherDealDetails(dealId);
	
	// @ESCROW_OR_HOLDBACK@ -- Meaning, is this an escrow or a holdback as termed in the merger agreement
	dealAdd.escrow_or_holdback = 'escrow';
	if(dealAdd.has_holdback == 'Y')	dealAdd.escrow_or_holdback = 'holdback';
	rpt = rpt.replace(/@ESCROW_OR_HOLDBACK@/gi, dealAdd.escrow_or_holdback);							// @ESCROW_OR_HOLDBACK@
	
	// @ESCROW_BANK_OR@
	dealAdd.escrow_bank_or = 'escrow bank or';
	if(dealAdd.has_holdback == 'Y')	dealAdd.escrow_bank_or = '';
	rpt = rpt.replace(/@ESCROW_BANK_OR@/gi, dealAdd.escrow_bank_or);									// @ESCROW_BANK_OR@
	
	// shareholder specific
	var contact = getContact(emailRecord.getFieldValue('custrecord_prepared_email_recipient'));
		contact.shareholder_code = numToHex(parseInt(dealId));	// deal_code
		
	
	if(contact.has_access) emailRecord.setFieldValue('custrecord_prepared_email_err_msg','CONTACT_HAS_PORTAL_ACCESS');
	if(contact.companyId != null && contact.companyId > 0) contact.shareholder_code += '-' + numToHex(parseInt(contact.companyId));

	rpt = rpt.replace(/@SHAREHOLDER_REGISTRATION_CODE@/gi, contact.shareholder_code);					// @SHAREHOLDER_REGISTRATION_CODE@

	emailRecord.setFieldValue('custrecord_prepared_email_body',rpt);
	emailRecord.setFieldValue('custrecord_prepared_email_status',Status.READY_FOR_CONFIRMATION);
	nlapiSubmitRecord(emailRecord,false,false);
	// fin
}

function getFurtherDealDetails(dealId)
{
	var deal = {
		 'dealId': dealId
		,'has_holdback': 'UNKNOWN'
	};
	
	// figure out if the deal has a holdback or escrow
	// 1. Get the list of pro rata records, grouped by GL Account, and Account Type
	// 2. Loop through results and read in the account type. If one is a "holdback", then deal.is_holdback = 'T'
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecordescrow', null, 'is', dealId));
	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecordescrow_account',null,'group'));
		columns.push(new nlobjSearchColumn('custrecord_escrow_account_type','custrecordescrow_account','group'));
	var sprRcds = nlapiSearchRecord('customrecordespr',null, filters, columns);	// shareholder pro rata record

	if(sprRcds != null && sprRcds.length > 0)
	{	// setup defaults
		deal.has_holdback = 'N';
		
		for(var i = 0; i < sprRcds.length; i++)
		{
			var sprRcd = sprRcds[i];
			var escrowAccountType = sprRcd.getValue('custrecord_escrow_account_type','custrecordescrow_account','group');
			if(escrowAccountType == '3')	deal.has_holdback = 'Y';	// Holdback
			
			//nlapiLogExecution("DEBUG", "EmailGeneratorUtil_GeneralMessage.getFurtherDealDetails", "escrowAccountType = " + escrowAccountType);
		}
	}
	
	return deal;
}

