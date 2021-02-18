var EntityStatus =
{
	CUSTOMER_CLOSED_WON: 13,
	CUSTOMER_COMPLETE: 19
};

var EntityCategory = 
{
	DEAL: 1,
	INVESTOR_GROUP:7,
	SHAREHOLDER:2
};

var VirtualBinderTemplates = 
{
	SANDBOX:
	{
		 COVER:36459
		,TOC:36462
		,BASE_FOLDER:15062
		,INTERIOR:36563
		,GLOSSARY:36972
		,ABOUT_SRS:37175
		,KEY_CONTACTS:37176
	},
	PRODUCTION:
	{
		 COVER:131158
		,TOC:131159
		,BASE_FOLDER:108764
		,INTERIOR:132745
		,GLOSSARY:138455
		,ABOUT_SRS:138877
		,KEY_CONTACTS:138878
	}
};

var ROLES = {
	 MAJOR_SHAREHOLDER: [18,29]
	,SELLER_COUNSEL: [15,19,26]
}

function createNewVirtualBinderRecords()
{
	var parentRecordId = nlapiGetRecordId();	// get identifier of the base Prepared Email Job
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.createNewVirtualBinderRecords", "Working on Prepared Email Job " + parentRecordId);
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	parent.setFieldValue('custrecord_prepared_email_job_status'   ,Status.PAUSED);
	nlapiSubmitRecord(parent,false,false);		// save record

	var params = new Array();
	params['custscript_vb_prepared_email_job_id'] = parentRecordId;
	params['custscript_vb_last_internal_id'] = -1;
	params['custscript_vb_last_group_type'] = 'NONE';
	nlapiScheduleScript('customscript_create_virtualbindr_records','customdeploy_create_virtualbindr_records',params);
	// fin
}

function createNewVirtualBinderRecordsScheduled()
{
	var context = nlapiGetContext();
	var parentRecordId  = context.getSetting('SCRIPT','custscript_vb_prepared_email_job_id');
	var lastInternalId  = context.getSetting('SCRIPT','custscript_vb_last_internal_id');
	var lastGroupType   = context.getSetting('SCRIPT','custscript_vb_last_group_type');

	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.createNewVirtualBinderRecordsScheduled", "Working on Prepared Email Job " + parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.createNewVirtualBinderRecordsScheduled", "lastInternalId =  " + lastInternalId);

	if(lastGroupType == null || lastGroupType == 'NONE') lastGroupType = 'MAJOR_SHAREHOLDERS';

	// Base on lastGroupType, we need to come up with a list of contact recipients
	// 1. Get the list of deals in the record, or, if non given, get all deals
	var dealIds = parent.getFieldValues('custrecord_prepared_email_deal_name');
	if(dealIds == null || dealIds.length == 0)	dealIds = getAllDealIds();
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.createNewVirtualBinderRecordsScheduled", "dealIds.length = " + dealIds.length);

	// @TODO - Deal with list of shareholders and/or recipients specified
	//var shrhlds = parent.getFieldValues('custrecord_prepared_email_shareholders');
	//var rcipnts = parent.getFieldValues('custrecord_prepared_email_recipients');

	// 2. For each deal, call createMajorShareholderEmails, using last_internal_id as the last dealId
	var allMajShrContacts = getDealContacts(dealIds,ROLES.MAJOR_SHAREHOLDER,lastInternalId,'group');	// major shareholder role = 18
	var allLegalContacts = getDealContacts(dealIds,ROLES.SELLER_COUNSEL,lastInternalId,'group','F');	// outside counsel, major shareholder counsel
	
	var allContacts = allMajShrContacts;
	for(var i = 0; i < allLegalContacts.length; i++)	allContacts.push(allLegalContacts[i]);		// put them together
	
	// sort them
	allContacts = allContacts.sort(contactIdSort);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.createNewVirtualBinderRecordsScheduled", "allContacts.length = " + allContacts.length);
	
	var newJobInitiated = createNewVirtualBinderRecordsScheduledHelper(allContacts,dealIds,parent,lastGroupType);
	
	if(newJobInitiated == true) return;

	parent.setFieldValue('custrecord_prepared_email_job_status',Status.NEW);
	nlapiSubmitRecord(parent,false,false);		// save record
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.createNewVirtualBinderRecordsScheduled", "Prepared Email Records Created");
	
	doEmailJobStatusCounter(parentRecordId);
	// fin
}

function createNewVirtualBinderRecordsScheduledHelper(contacts,dealIds,parent,lastGroupType)
{
	if(contacts == null || contacts.length == 0) return false;
	
	for(var i = 0; i < contacts.length; i++)
	{
		var contact = contacts[i];
		var contactRecord = nlapiLoadRecord('contact',contact.contactId);
		
		try
		{
			var primaryParent = contactRecord.getFieldValue('company');
			if(primaryParent == null) continue;
			
			if(sameArray(contact.searchedRoles,ROLES.MAJOR_SHAREHOLDER))
			{
				// if shareholder, do the following...
				var childFunds  = getChildFunds([primaryParent],false);
				if(childFunds == null || childFunds.length == 0) continue;
				
				childFunds.push(primaryParent);
				
				var deals = getAllDeals(childFunds,dealIds);
				if(deals == null && deals.length == 0) continue;
				contact.dealIds = deals;
			}
			else
			{	// else law firm, do the following
				var lawDeals = getContactDeals(null,dealIds,ROLES.SELLER_COUNSEL,primaryParent,'F');
				if(lawDeals == null || lawDeals.length == 0) continue;
				contact.dealIds = lawDeals;
			}
			
			// 4. Then create the prepared email record
			createPreparedEmailRecordFromContactObject(contact,parent); // parent refers to the parent email record			
		}
		catch(e)
		{
			nlapiLogExecution("ERROR", "EmailGeneratorUtil_VirtualBinder.createNewVirtualBinderRecordsScheduled", e);
		}

		if(i > 100 && (i + 1) < contacts.length)	// PRODUCTION
		{
			var lastInternalId = contact.contactId;
			
			// call the scheduled script again using the internal id
			var params = new Array();
			params['custscript_vb_prepared_email_job_id'] = parent.getId();
			params['custscript_vb_last_internal_id'] = lastInternalId;
			params['custscript_vb_last_group_type'] = lastGroupType;
			nlapiScheduleScript('customscript_create_virtualbindr_records','customdeploy_create_virtualbindr_records',params);
			
			return true;
		}
	}
	
	return false;
}


function parseAndReplace()
{
	var parentRecordId = nlapiGetRecordId();
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.parseAndReplace", "Working on Prepared Email Job " + parentRecordId);
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)
	parent.setFieldValue('custrecord_prepared_email_job_status',Status.PAUSED);
	nlapiSubmitRecord(parent,false,false);		// save record

	//parseAndReplaceScheduled(parentRecordId,'-1');		// @TODO REMOVE ME
	
	var params = new Array();
	params['custscript_vb_schd_prepared_email_job_id'] = parentRecordId;
	params['custscript_vb_schd_last_internal_id'] = '-1';
	nlapiScheduleScript('customscript_vb_sched_template_processor','customdeploy_vb_sched_template_processor',params);
	// fin
}

function parseAndReplaceScheduled() // parentRecordId,lastInternalId)
{
	//if(!parentRecordId || parentRecordId == null || parentRecordId.length == 0)
	//{
		var context = nlapiGetContext();
		var parentRecordId = context.getSetting('SCRIPT', 'custscript_vb_schd_prepared_email_job_id');
		var lastInternalId = context.getSetting('SCRIPT', 'custscript_vb_schd_last_internal_id');
	//} 

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.parseAndReplaceScheduled", "Working on Prepared Email Job " + parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.parseAndReplaceScheduled", "lastInternalId = " + lastInternalId);
	var parentJob = nlapiLoadRecord('customrecord_prepared_email_job', parentRecordId);
	
	// get the list of the prepared emails associated to the job
	var filters = new Array();
	filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', parentRecordId));
	filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', Status.COMPLETED));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	if (lastInternalId != null) {
		filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(lastInternalId)));
	}
	
	var newLastInternalId = doParseReplaceLoop(filters,parentJob,parentRecordId);
	if(newLastInternalId == null) return;

	// call the scheduled script again using the internal id
	var params = new Array();
	params['custscript_vb_schd_prepared_email_job_id'] = parentRecordId;
	params['custscript_vb_schd_last_internal_id'] = newLastInternalId;
	nlapiScheduleScript('customscript_vb_sched_template_processor','customdeploy_vb_sched_template_processor',params);
}

function doParseReplaceLoop(filters,parentJob,parentRecordId)
{
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
		columns[0].setSort();	// sort by internalid
	
	var emails = nlapiSearchRecord('customrecord_prepared_emails',null, filters, columns);
	if(emails == null) return null;
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.parseAndReplaceScheduled", "number of emails found = " + emails.length);
	if(emails == null || emails.length == 0) emails = new Array();
	
	// for each record, execute the parse and replacement
	for(var i = 0; i < emails.length; i++)
	{
		var email = emails[i];
		var emailRecord = nlapiLoadRecord('customrecord_prepared_emails',email.getId());
		if(emailRecord.getFieldValue('isinactive') == 'T') continue;
		try
		{
			//dsalkjd = lksdjassa;
			// perform the necessary parsing, replacement, etc.
			doParseAndReplace(emailRecord,parentJob);
		}
		catch (e)
		{
			nlapiLogExecution("ERROR", "EmailGeneratorUtil_VirtualBinder.parseAndReplaceScheduled", "last internal id before restart = " + email.getId());
			if(e.length > 300)	e = e.substring(0,299);	// character limit of 
			
			emailRecord.setFieldValue('custrecord_prepared_email_status',Status.ERROR);
			emailRecord.setFieldValue('custrecord_prepared_email_err_msg',e);
			nlapiSubmitRecord(emailRecord,false,false);		// save record
	                return email.getId();		// return last internal id
		}
		
		//if(i > 3 && i < emails.length)		// DEVELOPMENT
		if(i > 2 && (i + 1) < emails.length)		// PRODUCTION
		{
			nlapiLogExecution("DEBUG", "EmailGeneratorUtil_VirtualBinder.parseAndReplaceScheduled", "last internal id before restart = " + email.getId());
			return email.getId();		// return last internal id
		}
	}

	parentJob.setFieldValue('custrecord_prepared_email_job_status', Status.READY_FOR_CONFIRMATION);
	nlapiSubmitRecord(parentJob, false, false); // save record
	
	doEmailJobStatusCounter(parentRecordId);
	
	return null;
}

function doParseAndReplace(emailRecord,parentRecord)
{
	var templates = nlapiGetContext().getEnvironment() == 'SANDBOX' ? VirtualBinderTemplates.SANDBOX : VirtualBinderTemplates.PRODUCTION;

	emailRecord.setFieldValue('custrecord_prepared_email_status',Status.IN_PROCESS);

	var contact = getContact(emailRecord.getFieldValue('custrecord_prepared_email_recipient'));	// 0) Get the contact record associated with the shareholder access record
	var errMsg = '';
	
	var pages = new Array();
	pages.push(getPage(emailRecord,templates.COVER,'Cover',-100));
	pages.push(getTOC(emailRecord,templates));
	pages.push(getPage(emailRecord,templates.KEY_CONTACTS,'Key SRS Contacts','Key SRS Contacts'));

	var template = nlapiLoadFile(templates.INTERIOR); 			// the blank template
	if(template == null)	throw 'Interior template is null';
	var blankInteriorTemplate = template.getValue();

	pages.push(getMasterUpcomingDates(emailRecord,blankInteriorTemplate));	// mast upcoming dates
	
	// get all deals
	var deals = emailRecord.getFieldValues('custrecord_deals');
	if(deals == null)
	{
		throw 'DEALS MISSING';
	}
	
	var activeDealOutput = new Array();
	var closedDealOutput = new Array();
	for (var i = 0; i < deals.length; i++)
	{
		var dealId = deals[i];
		var deal = nlapiLoadRecord('customer', dealId);
		
		var page = getMainReport(deal,emailRecord,blankInteriorTemplate,contact);
		if(!page.dpsRecordReviewed)
			errMsg += 'Deal ' + page.deal + ' has not been reviewed. ';

		var dealStatus = deal.getFieldValue('entitystatus');
		var escrStatus = deal.getFieldText('custentity_escrow_holdback_status');
		if(dealStatus == EntityStatus.CUSTOMER_COMPLETE || (escrStatus !== null && (escrStatus == 'Complete' || escrStatus == 'Not Applicable')))
		{
			page.activeDeal = false;
			closedDealOutput.push(page);
		}
		else
		{
			page.activeDeal = true;
			activeDealOutput.push(page);
		}
	}	

	// sort the deals
	activeDealOutput = activeDealOutput.sort(dealNameSort);
	closedDealOutput = closedDealOutput.sort(dealNameSort);
	
	// add deal output to list of pages
	for (var i = 0; i < activeDealOutput.length; i++)	pages.push(activeDealOutput[i]);
	for (var i = 0; i < closedDealOutput.length; i++)	pages.push(closedDealOutput[i]);

	pages.push(getPage(emailRecord,templates.GLOSSARY,'Glossary','Glossary',2));
	pages.push(getPage(emailRecord,templates.ABOUT_SRS,'About SRS','About SRS'));
	
	// get meta list
	//var password = 'mypassword';	// @TODO need to generate this randomly
	//var metaList = getMetaData([new MetaData('password',password)]);
	var metaList = getMetaData();
	
	//var htmlRpt = htmlize(pages,contact);
	var template = nlapiLoadFile(parentRecord.getFieldValue('custrecord_prepared_email_template')); 			// the blank template
	if(template == null)	throw 'Template is null';

	var htmlRpt = template.getValue();
		htmlRpt = htmlRpt.replace(/@CONTACT_NAME@/gi, contact.name).replace(/@REPORT_DATE@/gi, getDateTodayString("/"));  // @CONTACT_NAME@, @REPORT_DATE@
	var pdfRpt = pdfize(pages,contact,metaList);

	//emailRecord.setFieldValue('custrecord_prepared_email_body',htmlRpt);
	emailRecord.setFieldValue('custrecord_prepared_email_body',pdfRpt);
	
	if(errMsg.length > 0)
		emailRecord.setFieldValue('custrecord_prepared_email_status',Status.ERROR);
	else
		emailRecord.setFieldValue('custrecord_prepared_email_status',Status.READY_FOR_CONFIRMATION);

	emailRecord.setFieldValue('custrecord_prepared_email_err_msg',errMsg);
	nlapiSubmitRecord(emailRecord,false,false);
	
	var pdfFile = nlapiXMLToPDF(pdfRpt);
		pdfFile.setFolder(templates.BASE_FOLDER);
		pdfFile.setName(contact.company + "-" + contact.name + ".pdf");
	
	var pdfId = nlapiSubmitFile(pdfFile);
	nlapiAttachRecord("file", pdfId, "customrecord_prepared_email_job", parentRecord.getId());
	nlapiAttachRecord("file", pdfId, "customrecord_prepared_emails", 	emailRecord.getId());
	nlapiAttachRecord("file", pdfId, "customer", contact.companyId);
}

function getAllDealIds()
{
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_VirtualBinder.getAllDealIds", "getting list of all deal ids");
	var filters = new Array();
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('entitystatus',null,'anyOf',[EntityStatus.CUSTOMER_CLOSED_WON,EntityStatus.CUSTOMER_COMPLETE]));
		filters.push(new nlobjSearchFilter('category',null,'is',EntityCategory.DEAL));
	
	var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid',null,'group'));	// shareholder id
		columns[0].setSort();	// sort by internalid

	var rcds = nlapiSearchRecord('customer',null,filters,columns);
	if(rcds == null || rcds.length == 0)	throw 'No deals found.';	

	var dealIds = new Array();
	for(var i = 0; i < rcds.length; i++)
	{
		var rcd = rcds[i];
		
		var dealId = rcd.getValue('internalid',null,'group');
		
		dealIds.push(dealId);
	}
	return dealIds;
}

function getPage(emailRecord,template,name,identifier,pageNums)
{
	var template = nlapiLoadFile(template); 			// the blank template
	if(template == null)	throw 'Template is null';
	var rpt = template.getValue();
	
	var rtnObj = new PagesObject();
		rtnObj.reportText = rpt;
		rtnObj.counter	  =	new Counter();
		rtnObj.deal = name;
		rtnObj.dealId = identifier;
		
	if(pageNums != null)	rtnObj.counter.pageCount = pageNums;

	return rtnObj;
}

function getTOC(emailRecord,templates)
{
	var template = nlapiLoadFile(templates.TOC); 			// the blank template
	if(template == null)	throw 'Cover template is null';
	
	var deals = emailRecord.getFieldValues('custrecord_deals');
	if(deals == null || deals.length == 0) return '';

	var activeDealOutput = new Array();
	var closedDealOutput = new Array();
	for (var i = 0; i < deals.length; i++)
	{
		var dealId = deals[i];
		var deal = nlapiLoadRecord('customer', dealId);
		
		var obj = new PagesObject();
		obj.dealId = dealId;
		obj.deal   = deal.getFieldValue('companyname');

		var dealStatus = deal.getFieldValue('entitystatus');
		var escrStatus = deal.getFieldText('custentity_escrow_holdback_status');
		if(dealStatus == EntityStatus.CUSTOMER_COMPLETE || (escrStatus !== null && (escrStatus == 'Complete' || escrStatus == 'Not Applicable')))
		{
			obj.activeDeal = false;
			closedDealOutput.push(obj);
		}
		else
		{
			obj.activeDeal = true;
			activeDealOutput.push(obj);
		}
	}	

	// sort the deals
	activeDealOutput = activeDealOutput.sort(dealNameSort);
	closedDealOutput = closedDealOutput.sort(dealNameSort);
	
	var darkBgColor = ' class="dark">';
	var liteBgColor = ' class="light">';
	
	var replaceText = '';

	// Master upcoming dates list
	replaceText += '<tr' + darkBgColor;
	replaceText += '<td><p class="deal"><a href="#Key SRS Contacts" class="toc">Key SRS Contacts</a></p></td><td align="right"><p class="pg"><a href="#Key SRS Contacts" class="toc">@DEAL_Key SRS Contacts@</a>&nbsp; &nbsp;</p></td></tr>\n';

	replaceText += '<tr' + liteBgColor;
	replaceText += '<td><p class="deal"><a href="#All Upcoming Important Dates" class="toc">All Upcoming Important Dates</a></p></td><td align="right"><p class="pg"><a href="#All Upcoming Important Dates" class="toc">@DEAL_All Upcoming Important Dates@</a>&nbsp; &nbsp;</p></td></tr>\n';
	
	if(activeDealOutput.length > 0)
	{
		replaceText += '<tr' + darkBgColor;
		replaceText += '<td><p class="deal">Pending Escrow Deals</p></td></tr>\n';
	}

	for(var i = 0; i < activeDealOutput.length; i++)
	{
		var output = activeDealOutput[i];
		var deal = nlapiLoadRecord('customer',output.dealId);
		var dealName = deal.getFieldValue('companyname');
		var dealId   = deal.getId();//deal.getFieldValue('entityid');
		
		replaceText += '<tr';
		replaceText += (i % 2 == 0) ? liteBgColor : darkBgColor;
		
		replaceText += '<td><p class="deal">&nbsp; &nbsp; &nbsp; <a href="#' + dealId + '" class="toc">' + nlapiEscapeXML(dealName) + '</a></p></td>';
		replaceText += '<td align="right"><p class="pg"><a href="#' + dealId + '" class="toc">@DEAL_' + dealId + '@</a>&nbsp; &nbsp;</p></td></tr>\n';
	}

	if(closedDealOutput.length > 0)
	{
		replaceText += '<tr';
		replaceText += (activeDealOutput.length % 2 == 0) ? liteBgColor : darkBgColor;
		replaceText += '<td><p class="deal">Closed Escrow Deals</p></td></tr>\n';
	}
	for(var i = 0; i < closedDealOutput.length; i++)
	{
		var output = closedDealOutput[i];
		var deal = nlapiLoadRecord('customer',output.dealId);
		var dealName = deal.getFieldValue('companyname');
		var dealId   = deal.getId(); //deal.getFieldValue('entityid');
		
		replaceText += '<tr';
		replaceText += ((activeDealOutput.length + i) % 2 == 0) ? darkBgColor : liteBgColor;
		replaceText += '<td><p class="deal">&nbsp; &nbsp; &nbsp; <a href="#' + dealId + '" class="toc">' + nlapiEscapeXML(dealName) + '</a></p></td>';
		replaceText += '<td align="right"><p class="pg"><a href="#' + dealId + '" class="toc">@DEAL_' + dealId + '@</a>&nbsp; &nbsp;</p></td></tr>\n';
	}
	
	// GLOSSARY
	var glossRowCount = deals.length;
	if(activeDealOutput.length > 0)
		glossRowCount += 1;
	if(closedDealOutput.length > 0)
		glossRowCount += 1;
	
	replaceText += '<tr';
	replaceText += (glossRowCount % 2 == 0) ? darkBgColor : liteBgColor;
	replaceText += '<td><p class="deal"><a href="#Glossary" class="toc">Glossary</a></p></td><td align="right"><p class="pg"><a href="#Glossary" class="toc">@DEAL_Glossary@</a>&nbsp; &nbsp;</p></td></tr>\n';

	replaceText += '<tr';
	replaceText += (glossRowCount % 2 == 0) ? liteBgColor : darkBgColor;
	replaceText += '<td><p class="deal"><a href="#About SRS" class="toc">About SRS</a></p></td><td align="right"><p class="pg"><a href="#About SRS" class="toc">@DEAL_About SRS@</a>&nbsp; &nbsp;</p></td></tr>\n';
	
	var rpt = template.getValue();	// the underlying template
		rpt = rpt.replace(/@DEAL_TOC_LIST@/gi, replaceText);  // @DEAL_TOC_LIST@

	var rtnObj = new PagesObject();
		rtnObj.reportText = rpt;
		rtnObj.counter	  =	new Counter();
		rtnObj.deal = 'Table of Contents';
		rtnObj.dealId = 'Table of Contents';

	return rtnObj;
}

function getMetaData(metaList)
{
	if(metaList == null) metaList = new Array();
	
	// add to metaList here...
	metaList.push(new MetaData('show-bookmarks','true'));
	metaList.push(new MetaData('access-level','print-highres extract-all change-all'));
	// title
	// author
	// subject
	
	return metaList;
}

function PagesObject()
{
	this.reportText = null;
	this.counter	= null;
	this.deal		= null;
	this.dealId		= null;
	this.dpsRecordReviewed = false;
	this.activeDeal = 'unknown';
}

function Counter()
{
	this.pageCount = 1;		// first page of a sub-report is always the first page
	this.rowCount  = 0;
	this.lineCount = 0;
}

function MetaData(name,value)
{
	this.name = name;
	this.value = value;
}

function getMasterUpcomingDates(emailRecord,rptTemplate)
{
	var deals = emailRecord.getFieldValues('custrecord_deals');
	if(deals == null || deals.length == 0) return '';

	var darkBgColor = ' class="dark">';
	var liteBgColor = ' class="light">';

	var allImportantDates = getEventDates(deals,[2,3,4,5,13]);

	var replaceText = '';
	var counter = new Counter();
	
	var lastDateString = null;
	if(allImportantDates.length == 0)	replaceText += getMainReportRow('No upcoming important dates found','',counter,'','true');
	for (var i = 0; i < allImportantDates.length; i++)
	{
		var importantDate = allImportantDates[i];
		
		if(lastDateString == importantDate.attendee + importantDate.title + importantDate.date) continue;
		lastDateString = importantDate.attendee + importantDate.title + importantDate.date
		
		//replaceText += getMainReportRow(importantDate.attendee + '</p></td><td><p>' + importantDate.title,importantDate.date,counter);
		replaceText += getMainReportRowWide(importantDate.date + ': ' + nlapiEscapeXML(importantDate.attendee),[nlapiEscapeXML(importantDate.title)],counter);
	}			

	var reportHeader  = '<tr><td colspan="2" align="right"><p>Updated: @REPORT_DATE@</p></td></tr>\n';
		reportHeader += '<tr><td colspan="2"><p class="header" id="All Upcoming Important Dates">All Upcoming Important Dates</p></td></tr>\n';
		reportHeader +=	'<tr><td colspan="2"><p class="deal">Date: Deal</p></td></tr>\n';

	rptTemplate = rptTemplate.replace(/@REPORT_HEADER@/gi,reportHeader);
	rptTemplate = rptTemplate.replace(/@REPORT_HEADER_SHORT@/gi,reportHeader);
	rptTemplate = rptTemplate.replace(/@DEAL_CONTENT@/gi, replaceText);  // @DEAL_CONTENT@
	rptTemplate = rptTemplate.replace(/@REPORT_HEADER@/gi,reportHeader);
	rptTemplate = rptTemplate.replace(/@REPORT_HEADER_SHORT@/gi,reportHeader);

	var rtnObj = new PagesObject();
		rtnObj.reportText = rptTemplate;
		rtnObj.counter	  =	counter;
		rtnObj.deal		  = 'All Upcoming Important Dates';
		rtnObj.dealId	  = 'All Upcoming Important Dates';

	return rtnObj;
}

function getMainReport(dealRecord,emailRecord,rptTemplate,contact)
{
	var dpsRecords = getDealPointStudyRecords(dealRecord.getId());
	var dpsRecord = nlapiLoadRecord('customrecord_deal_points_study',dpsRecords[dpsRecords.length - 1]);	// get the last one
	
	var counter = new Counter();
	var replaceText = '';

	// get the list of major shareholders
	var majContacts = getDealContacts([dealRecord.getId()],[18,29],null,null,null,'T');	// major shareholder,  advisory committee
	//var majContacts = getAllMajShareholderContacts([dealRecord.getId()],null);
	if(majContacts.length == 0) majContacts = getDealContacts([dealRecord.getId()],[24,28]);	// main shareholder contact, current shareholder rep
	replaceText += getContactRow('Significant Shareholder Committee',majContacts,counter,null,true);

	var sellerCounselContacts = getDealContacts([dealRecord.getId()],[15,19,26],null,null,'F');	// outside counsel, major shareholder counsel
	replaceText += getContactRow('Sell-side Counsel',sellerCounselContacts,counter,null,true);

	replaceText += getMainReportRow('Buyer'			,nlapiEscapeXML(dealRecord.getFieldValue('custentity29')),counter);
	replaceText += getMainReportRow('Seller'		,nlapiEscapeXML(dealRecord.getFieldValue('custentity_selling_company')),counter);
	replaceText += getMainReportRow('Closing Date'	,dealRecord.getFieldValue('custentity8'),counter);

	var wcAdjustNoticeDeadline = dealRecord.getFieldValue('custentity31');
	replaceText += getMainReportRow('Adjustment Notice Deadline',wcAdjustNoticeDeadline,counter,null,true);

	var ordinalNames = ['Initial','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth'];

	var releaseDates = filterUniqueDates(getEventDates([dealRecord.getId()],[2,3],['CONFIRMED','COMPLETE']));
	var releaseHtmlArray  = new Array();
	for(var i = 0; i < releaseDates.length; i++)
	{
		var releaseDate = releaseDates[i];
		if(releaseDate.status == 'COMPLETE') continue;		// we want to include COMPLETE release dates in order to get the right ordinal name
		
		var releaseHtml = '';
		if(releaseDates.length > 1) releaseHtml += ordinalNames[i] + ' ';
		releaseHtml += 'Release: ' + releaseDate.date;
		releaseHtmlArray.push(releaseHtml);
	}
	replaceText += getMainReportRow('Escrow/Holdback Release Dates',releaseHtmlArray,counter,null,true);

	var hasEarnout = dpsRecord.getFieldText('custrecord_fin_earn_included');
	if(hasEarnout != null && hasEarnout == 'Yes')
	{
		var earnoutDates = filterUniqueDates(getEventDates(dealRecord.getId(),[5],['CONFIRMED','COMPLETED']));
		var earnoutHtmlArray  = new Array();
		for(var i = 0; i < earnoutDates.length; i++)
		{
			var earnoutDate = earnoutDates[i];
			var earnoutHtml = earnoutDate.date + ' - ' + earnoutDate.title;
			earnoutHtmlArray.push(earnoutHtml);
		}
		
		var earnoutPeriod = dpsRecord.getFieldValue('custrecord_fin_earnout_period');
		if(earnoutPeriod == null || earnoutPeriod.length == 0)		earnoutPeriod = 'Indeterminate';
		else														earnoutPeriod += ' months';

		replaceText += getMainReportRow('Earnout Dates'	 				,earnoutHtmlArray,counter,null,true);
		replaceText += getMainReportRow('Maximum Earnout Consideration'	,formatCurrency(dealRecord.getFieldValue('custentity_maximum_earn_out'),'$',null,true,true),counter,'Indeterminable',false);
		replaceText += getMainReportRow('Earnout Metric'				,getSelectValueNames(dpsRecord.getFieldValues('custrecord_fin_earn_metric_used'),'customlist_earnout_metrics'),counter);
		replaceText += getMainReportRow('Earnout Period'				,earnoutPeriod,counter,'Indeterminate');
		replaceText += getMainReportRow('Earnout Payments Offset for Indemnification' ,dpsRecord.getFieldText('custrecord_fin_earn_offset_indem_ag_earn'),counter,null,true);
		replaceText += getMainReportRow('Earnout Summary'				,dpsRecord.getFieldValue('custentity_earnout_summary'),counter,null,true);
	}
	
	// esn
	/*var esns = getEscrowStatementNews(dealRecord.getId());
	if(esns != null && esns.length > 0)
	{
		var isMajorShareholder = getIsMajorShareholder([contact.companyId],dealRecord.getId());
		
		var esn = esns[0];	// only get the first one
		var news = 'Date: ' + esn.date + ' - ';
		if(isMajorShareholder  && isMajorShareholder == true)
			news += esn.majorNews;
		else
			news += esn.commonNews;
		
		replaceText += getMainReportRowWide('Latest News',[nlapiEscapeXML(news)],counter);
	}*/

	replaceText += getMainReportRow('Paying Agent',nlapiEscapeXML(dealRecord.getFieldText('custentity_paying_agent')),counter,null,true);
	replaceText += getMainReportRow('Escrow Agent',nlapiEscapeXML(dealRecord.getFieldText('custentity_escrow_agent')),counter,null,true);
	replaceText += getMainReportRow('Transaction Structure'	,dpsRecord.getFieldText('custrecord_etc_transaction_structure'),counter);
	replaceText += getMainReportRow('Consideration Type'	,dpsRecord.getFieldText('custrecord_etc_deal_consideration_type'),counter);
	
	var dealSize = dpsRecord.getFieldValue('custrecord_fin_tx_value_less_earnouts');
	var indmSize = dpsRecord.getFieldValue('custrecord_indm_esc_dollar_amt_esc_holdb');
	var indmPct  = toPercentString(parseInt(indmSize),parseInt(dealSize),2);
	if(indmPct == 'NaN%') indmPct = 0.0;				// testing for NaN
	replaceText += getMainReportRow('Deal Size'						,formatCurrency(dealSize,'$','',false,true),counter);
	replaceText += getMainReportRow('Escrow/Holdback Size and %'	,formatCurrency(indmSize,'$','',false,true) + ' (' + indmPct + ')' ,counter);

	var specialSize = dpsRecord.getFieldValue('custrecord_etc_special_escrow_amount');
	replaceText += getMainReportRow('Total Amount of Special Escrows'	,formatCurrency(specialSize,'$',null,true,true),counter,null,true);
	
	var specialEscrowAppliesToArray = getSelectValueNames(dpsRecord.getFieldValues('custrecord_etc_special_escrow_applies_to'),'customlist_legal_terms'); // ,105);
	replaceText += getMainReportRow('Special Escrow Applies to',specialEscrowAppliesToArray,counter,null,true);
	
	var expenseSize = dpsRecord.getFieldValue('custrecord_etc_expense_escrow_szie');
	replaceText += getMainReportRow('Expense Fund'						,formatCurrency(expenseSize,'$','0',false,true),counter);

	replaceText += getMainReportRow('Management Carveout',dpsRecord.getFieldText('custrecord_etc_management_carveout'),counter,null,true);
	/*var managementCarveoutSize = dpsRecord.getFieldValue('custrecord_etc_management_carveout_size');
	if(managementCarveoutSize !== null && managementCarveoutSize.length > 0)
	{
		var managementCarveoutPct = toPercentString(parseInt(managementCarveoutSize),parseInt(dealSize));
		if(managementCarveoutPct == 'NaN%') managementCarveoutPct = 0.0;
		replaceText += getMainReportRow('Management Carveout',managementCarveoutPct,counter);
	}*/
	
	replaceText += getMainReportRow('Treatment of Options' 			,dpsRecord.getFieldText('custrecord_etc_treatment_of_options'),counter,null,true);
	replaceText += getMainReportRow('Options Contribute to Escrow'	,dpsRecord.getFieldText('custrecord_etc_opts_contribute_to_escrow'),counter,null,true);
	
	var repWarrantSurvival = dpsRecord.getFieldValue('custrecord_indm_rw_survival_per_months');
	if(repWarrantSurvival == null || repWarrantSurvival.length == 0)		repWarrantSurvival = 'Indeterminate';
	else																	repWarrantSurvival += ' months';
	replaceText += getMainReportRow('Rep &amp; Warranty Survival',repWarrantSurvival,counter,null,true);

	var survivalCarveoutsArray = getSelectValueNames(dpsRecord.getFieldValues('custrecord_indm_survival_carveout_detail'),'customlist_carveout_types'); // ,105);
	replaceText += getMainReportRow('Survival Carveouts',survivalCarveoutsArray,counter,'None');

	var ppaAdjustment = dealRecord.getFieldText('custentity_wc_adj_applicable_nature');
	if(ppaAdjustment != null)	ppaAdjustment = ppaAdjustment.replace(/WC Adjust\./gi,'PPA');
	replaceText += getMainReportRow('Post-Closing PPA',ppaAdjustment,counter);
	
	var basketAmount = dpsRecord.getFieldValue('custrecord_indm_basket_amount');
	if(basketAmount != null && basketAmount.length > 0)
	{
		var basketAmountPct = toPercentString(parseInt(basketAmount),parseInt(dealSize),5);
		if(basketAmountPct == 'NaN%')	basketAmountPct = 0;		// testing for NaN
		
		replaceText += getMainReportRow('Basket Amount: $ and %',formatCurrency(basketAmount,'$',null,true,true) + '(' + basketAmountPct + ')',counter);
		replaceText += getMainReportRow('Basket Type',dpsRecord.getFieldText('custrecord_indm_basket_type'),counter);
		
		var basketCarveoutDetails = getSelectValueNames(dpsRecord.getFieldValues('custrecord_indm_basket_carveout_details'),'customlist_carveout_types'); // ,105);
		replaceText += getMainReportRow('Basket Carveouts',basketCarveoutDetails,counter,'None');
	}

	var standAloneIndemnities = getSelectValueNames(dpsRecord.getFieldValues('custrecord_indm_stand_alone_indemnities'),'customlist_legal_terms'); // ,95);
	replaceText += getMainReportRow('Stand-alone Indemnities',standAloneIndemnities,counter,'None');
	
	var multIndemnitorLiabilities = getSelectValueNames(dpsRecord.getFieldValues('custrecord_indm_mult_indmnitor_liability'),'customlist_mult_indemnitor_types');
	replaceText += getMainReportRow('Liability', multIndemnitorLiabilities,counter,'None');
	var liabilityCapAmount = dpsRecord.getFieldValue('custrecord_indm_caps_cap_amount');
	if(liabilityCapAmount == null)
	{
		var liabilityCap = dpsRecord.getFieldText('custrecord_indm_liability_cap');
		replaceText += getMainReportRow('Liability Cap',liabilityCap,counter,null,true);
	}
	else
		replaceText += getMainReportRow('Liability Cap',formatCurrency(liabilityCapAmount,'$',null,false,true),counter,null,true);

	var capCarveoutDetails = getSelectValueNames(dpsRecord.getFieldValues('custrecord_indm_cap_carveout_none'),'customlist_carveout_types'); // ,105);
	replaceText += getMainReportRow('Cap Carveouts',capCarveoutDetails,counter,'None');

	replaceText += getMainReportRow('Indemnification As Remedy',dpsRecord.getFieldText('custrecord_indm_sole_excl_remedy_type'),counter,'UNKNOWN');
	var exclusiveRemedyCarveouts = getSelectValueNames(dpsRecord.getFieldValues('custrecord_indm_remedy_carveouts'),'customlist_exclu_remedy_carveout_types'); // ,113);
	replaceText += getMainReportRow('Exclusive Remedy Carveouts',exclusiveRemedyCarveouts,counter,'None');

	replaceText += getMainReportRow('Damages offset by Tax Benefits',dpsRecord.getFieldText('custrecord_indm_setoffs_for_tax_benefits'),counter);
	replaceText += getMainReportRow('Damages offset by Insurance Proceeds',dpsRecord.getFieldText('custrecord_indm_setoffs_for_insur_procee'),counter);
	
	replaceText += getMainReportRow('Rep &amp; Warranty Insurance',dpsRecord.getFieldText('custentity_rep_warranty_insurance'),counter,null,true);
	
	var dealStatus = dealRecord.getFieldValue('entitystatus');
	var escrStatus = dealRecord.getFieldText('custentity_escrow_holdback_status');
	/*if(dealStatus == EntityStatus.CUSTOMER_COMPLETE || (escrStatus !== null && (escrStatus == 'Complete' || escrStatus == 'Not Applicable')))
	{
		var shareholders = getChildFunds([contact.companyId],false);
		var dealBalanceHtml = getDealBalancesRow([dealRecord.getId()],shareholders,counter);
		if(dealBalanceHtml != null && dealBalanceHtml.length > 0)
			replaceText += getNewLine(counter,true) + dealBalanceHtml;
	}*/
	
	var reportHeader = '<tr><td colspan="2" align="right"><p>Updated: @REPORT_DATE@</p></td></tr>\n';

	rptTemplate = rptTemplate.replace(/@DEAL_CONTENT@/gi, replaceText);  // @DEAL_CONTENT@
	rptTemplate = rptTemplate.replace(/@REPORT_HEADER@/gi,reportHeader + '<tr><td colspan="2"><p class="header"><a id="@DEAL_ID@">@DEAL_NAME@</a><br/>Summary of Terms and Important Post-Closing Dates</p></td></tr>');
	rptTemplate = rptTemplate.replace(/@REPORT_HEADER_SHORT@/gi,reportHeader + '<tr><td colspan="2"><p class="header"><a name="@DEAL_ID@">@DEAL_NAME@</a></p></td></tr>');
	rptTemplate = rptTemplate.replace(/@DEAL_NAME@/gi, 	  nlapiEscapeXML(dealRecord.getFieldValue('companyname')));  // @DEAL_NAME@
	rptTemplate = rptTemplate.replace(/@DEAL_ID@/gi, 	  dealRecord.getId());  // @DEAL_ID@
	
	var rtnObj = new PagesObject();
		rtnObj.reportText = rptTemplate;
		rtnObj.counter	  =	counter;
		rtnObj.deal		  = dealRecord.getFieldValue('companyname');
		rtnObj.dealId	  = dealRecord.getId(); 	//dealRecord.getFieldValue('entityid');
		rtnObj.dpsRecordReviewed = (dpsRecord.getFieldValue('custrecord_second_review_complete') == 'T');

	return rtnObj;	
}

function getDealBalancesRow(deals,shareholders,counter)
{
	var html = '<tr><td colspan="2"><table class="deal_balances">';
	var balances = getCurrentDealBalances(deals,shareholders);
	if(balances == null || balances.length == 0) return '';
	
	counter.rowCount += 1;
	counter.lineCount += 1;
	
	var header = '<tr><td><span class="deal_balances"><b>Shareholder</b></span></td><td><span class="deal_balances"><b>Deposits</b></span></td><td><span class="deal_balances"><b>Earnings</b></span></td><td><span class="deal_balances"><b>Claims Paid</b></span></td><td><span class="deal_balances"><b>Expenses</b></span></td><td><span class="deal_balances"><b>Disbursements</b></span></td><td><span class="deal_balances"><b>Balance</b></span></td></tr>';
	//html += header;
	
	var lastAccount = null;
	var lastShareholder = null;
	var subBalances = null;
	var totalBalances = newBalanceObject();
	var lastDenomination = null;
	var denominationChanged = false;
	
	for(var i = 0; i < balances.length; i++)
	{
		var balance = balances[i];
		if(lastDenomination == null) 					lastDenomination = balance.denomination;	// detect the first denomination
		if(lastDenomination != balance.denomination)	denominationChanged = true;
		
		if(lastAccount != balance.account)
		{
			if(subBalances != null)
				html += '<tr><td align="right"><span class="deal_balances"><b>Subtotal</b></span></td>' + createNewStatementLine(subBalances,'<span class="deal_balances"><b>','</b></span>') + '</tr>';
			
			lastAccount = balance.account;
			html += '<tr><td colspan="7"><span class="deal_balances"><b>' + balance.account + ' (' + balance.denomination + ')</b></span></td></tr>';
			html += header;
			counter.lineCount += 1;
			subBalances = newBalanceObject();
		}
		/*if(lastShareholder != balance.shareholder)
		{
			lastShareholder = balance.shareholder;
			html += '<tr><td colspan="6">' + balance.shareholder + '</td></tr>';
			counter.lineCount += 1;
		}*/
		
		html += '<tr><td><span class="deal_balances">' + balance.shareholder + '</span></td>' + createNewStatementLine(balance,'<span class="deal_balances"><b>','</b></span>') + '</tr>';
		counter.lineCount += 1;
		
		subBalances = updateBalances(subBalances,balance);
		totalBalances = updateBalances(totalBalances,balance);
	}
	if(subBalances != null)
		html += '<tr><td align="right"><span class="deal_balances"><b>Subtotal</b></span></td>' + createNewStatementLine(subBalances,'<span class="deal_balances"><b>','</b></span>') + '</tr>';
	if(denominationChanged == false)
		html += '<tr><td align="right"><span class="deal_balances"><b>Total</b></span></td>' + createNewStatementLine(totalBalances,'<span class="deal_balances"><b>','</b></span>') + '</tr>';

	html += '</table></td></tr>';
	
	return html;
}

function getNewLine(counter,forceNewLine,rowCount,lineCount)
{
	if(rowCount == null) rowCount = 0;
	if(lineCount == null) lineCount = 0;
	
	var html = '';

	if(counter.lineCount >= 45 || forceNewLine == true)			// @TODO - Figure out what the proper number of lines is
	{
		counter.rowCount   = rowCount;		// reset these
		counter.lineCount  = lineCount;
		counter.pageCount += 1;
		html += '\n</table>\n';
		html += '</div>\n';
		html += '@REPORT_FOOTER@\n';
		html += '</div>\n';
		html += '@PAGE_BREAK@\n';
		html += '@OPEN_REPORT_DIV@\n';
		html += '@OPEN_REPORT_TABLE@\n';
		html += '@REPORT_HEADER_SHORT@';
	}
	
	return html;
}

function getMainReportRowWide(rowTitle, rowValue, counter, defaultValue, skipIfNull)
{
	var darkBgColor = ' class="dark">';
	var liteBgColor = ' class="light">';

	if(rowValue == null || rowValue.length == 0)
	{
		if(skipIfNull == true)	return '';
		rowValue = defaultValue;
	}
	if(rowValue == null)
	{
		counter.lineCount += 1;
		return '<tr><td colspan="2"><p>' + rowTitle + ' - MISSING VALUE</p></td></tr>';
	}

	var startingLineCount = counter.lineCount;	// we need to preserve these in case this row is added to a new page
	
	counter.rowCount += 1;
	counter.lineCount += 1;
	//var rowOpen = '<tr ' + ((counter.rowCount % 2 == 0) ? liteBgColor : darkBgColor);
	var rowOpen = '@ROW_OPEN@';
	var replaceText = rowOpen + '<td valign="top" colspan="2"><p class="deal">' + rowTitle + '</p></td></tr>';

	replaceText += rowOpen + '<td valign="top" colspan="2"><p>';
	var newColumnOpen  = '&nbsp; &nbsp; ';
	for(var i = 0; i < rowValue.length; i++)
	{
		counter.lineCount += 1;
		var newText = rowValue[i];
		if(newText.length > 100) counter.lineCount = counter.lineCount + (newText.length / 100) - 1;
		replaceText +=  newColumnOpen + newText;
		if(i < rowValue.length) replaceText += '<br/>';
	}
	replaceText += '</p></td></tr>\n';

	var newLine = getNewLine(counter,null,1,counter.lineCount - startingLineCount);
	var rowOpenHtml = '<tr ' + ((counter.rowCount % 2 == 0) ? liteBgColor : darkBgColor);
	replaceText = replaceText.replace(/@ROW_OPEN@/gi, rowOpenHtml);

	replaceText = newLine + replaceText;
	
	return replaceText;
}

function getMainReportRow(rowTitle,rowValue,counter,defaultValue,skipIfNull)
{
	var darkBgColor = ' class="dark">';
	var liteBgColor = ' class="light">';

	if(rowValue == null || rowValue.length == 0)
	{
		if(skipIfNull == true)	return '';
		rowValue = defaultValue;
	}
	if(rowValue == null)
	{
		counter.lineCount += 1;
		return '<tr><td colspan="2"><p>' + rowTitle + ' - MISSING VALUE</p></td></tr>';
	}
	
	var startingLineCount = counter.lineCount;	// we need to preserve these in case this row is added to a new page
	counter.rowCount += 1;
	
	var replaceText = '@ROW_BGCOLOR@';
	//replaceText += (counter.rowCount % 2 == 0) ? liteBgColor : darkBgColor;
	replaceText += '<td valign="top"><p class="deal">' + rowTitle + '</p></td>';
		
	if(typeof(rowValue) == 'string')
	{
		counter.lineCount += 1;
		replaceText += '<td><p>' + rowValue + '</p></td>';
	}
	else
	{
		replaceText += '<td><p>';
		for(var i = 0; i < rowValue.length; i++)
		{
			counter.lineCount += 1;
			
			replaceText +=  rowValue[i];
			if(i < rowValue.length) replaceText += '<br/>';
		}
		replaceText +=  '</p></td>';
	}
	replaceText += '</tr>\n';

	var newLine = getNewLine(counter,null,1,counter.lineCount - startingLineCount);
	var rowOpenHtml = '<tr ' + ((counter.rowCount % 2 == 0) ? liteBgColor : darkBgColor);
	replaceText = replaceText.replace(/@ROW_BGCOLOR@/gi, rowOpenHtml);

	replaceText = newLine + replaceText;
	
	return replaceText;
}

function getContactRow(fieldName,contacts,counter,defaultValue,skipIfNull)
{
	var htmlArray = new Array();
	var lastContact = null;
	for(var i = 0; i < contacts.length; i++)
	{
		var contact = contacts[i];
		
		if(lastContact == (contact.name + contact.phone)) continue;
		lastContact = contact.name + contact.phone;

		var contactName = contact.name;
		while(contactName.indexOf(':') != -1)
			contactName = contactName.substring(contactName.indexOf(':') + 1);
		
		var contactHtml  = nlapiEscapeXML(contactName);
		
		if(contact.original_deal_firm != null && contact.original_deal_firm > 0 && contact.original_deal_firm != '- None -')
			contactHtml += ', ' + nlapiEscapeXML(contact.original_deal_firm);

		/*if(contact.phone != null && contact.phone.length > 0 && contact.phone != '- None -')
			contactHtml += ', ' + contact.phone;
		
		if(contact.email != null && contact.email.length > 0 && contact.email != '- None -')
		{
			contactHtml += ', <a href="mailto:';
			contactHtml += contact.email + '">' + contact.email + '</a>';
		}
		if((contactName + contact.email + contact.phone).length > 75)	counter.lineCount += 1;
		*/
		//if(i < contacts.length) contactHtml += ';';
		
		htmlArray.push(contactHtml);
	}
	return getMainReportRowWide(fieldName,htmlArray,counter,defaultValue,skipIfNull);
}

function getDateTodayString(delimiter)
{
	var today = new Date();
	return formDateString(today,delimiter);
}

function formDateString(theDate,delimiter)
{
	return (theDate.getMonth() + 1) + delimiter + theDate.getDate() + delimiter + theDate.getFullYear();
}

function replaceAllStandard(returnHtml,pages,contact)
{
	var counter = new Counter();
		counter.pageCount = -1;		// cover page should be page zero

	var bookmarkList = '<bookmarklist>';
	for (var i = 0; i < pages.length; i++)
	{
		var pageObject = pages[i];

		// deal with TOC if any
		if(pageObject.dealId != null)
		{
			var re = new RegExp('@DEAL_' + nlapiEscapeXML(pageObject.dealId) + '@', "gi");
			returnHtml = returnHtml.replace(re, counter.pageCount);
		}
		if(counter.pageCount > -1)		// skip cover and toc
			bookmarkList += '<bookmark name="' + nlapiEscapeXML(pageObject.deal) + '" href="#' + pageObject.dealId + '"/>\n'

		// increment up the counter last
		counter.pageCount += pageObject.counter.pageCount;
	}
	bookmarkList += '</bookmarklist>';
	
	returnHtml = returnHtml.replace(/@BOOKMARK_LIST@/gi,bookmarkList);

	returnHtml = returnHtml.replace(/@OPEN_REPORT_DIV@/gi, '<div class="report"><div class="content">');
	returnHtml = returnHtml.replace(/@OPEN_REPORT_TABLE@/gi, '<table class="report">');
	returnHtml = returnHtml.replace(/@CLOSE_TABLE@/gi, '</table>');
	returnHtml = returnHtml.replace(/@CLOSE_DIV@/gi, '</div>');
	returnHtml = returnHtml.replace(/@TOC_FOOTER@/gi, '<div class="footer"><p class="footer"><a href="http://www.shareholderrep.com" class="footer">www.shareholderrep.com</a> &nbsp;|&nbsp; <a href="mailto:support@shareholderrep.com" class="footer">support@shareholderrep.com</a> &nbsp;|&nbsp; 415.367.9400 &nbsp;<br/><span class="footer_left">&copy; 2012 Shareholder Representative Services LLC</span></p></div>');
	returnHtml = returnHtml.replace(/@PAGE_FOOTER@/gi, '<div class="footer"><p class="footer"><a href="http://www.shareholderrep.com" class="footer">www.shareholderrep.com</a> &nbsp;|&nbsp; <a href="mailto:support@shareholderrep.com" class="footer">support@shareholderrep.com</a> &nbsp;|&nbsp; 415.367.9400 &nbsp;<br/><span class="footer_left">&copy; 2012 Shareholder Representative Services LLC</span><span class="footer_right_wide">@PAGE_NUMBER@</span></p></div>');
	returnHtml = returnHtml.replace(/@REPORT_FOOTER@/gi, '<div class="footer"><p class="footer"><a href="http://www.shareholderrep.com" class="footer">www.shareholderrep.com</a> &nbsp;|&nbsp; <a href="mailto:support@shareholderrep.com" class="footer">support@shareholderrep.com</a> &nbsp;|&nbsp; 415.367.9400 &nbsp;<br/><span class="footer_left">&copy; 2012 Shareholder Representative Services LLC &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; CONFIDENTIAL</span><span class="footer_right">@PAGE_NUMBER@</span></p></div>');

	returnHtml = returnHtml.replace(/@REPORT_DATE@/gi, getDateTodayString("/"));  // @REPORT_DATE@
	
	returnHtml = returnHtml.replace(/@VCFIRM_NAME@/gi, nlapiEscapeXML(contact.company));  // @VCFIRM_NAME@
	//returnHtml = returnHtml.replace(/@RECIPIENT_NAME@/gi, contact.name);  // @RECIPIENT_NAME@
        returnHtml = returnHtml.replace(/@RECIPIENT_NAME@/gi, '');  // set blank recipient @RECIPIENT_NAME@
	returnHtml = returnHtml.replace(/@META_LIST@/gi, '');  // This should be blank for the HTML. pdfize will replace this as appropriate
	
	return returnHtml;
}

function htmlize(pages,contact)
{
	var returnHtml = '';
	for(var i = 0; i < pages.length; i++)
	{
		var pageObject = pages[i];
		returnHtml += pageObject.reportText;
		if(i == 0) returnHtml = returnHtml.replace(/@TEMPLATE_HEADER@/gi, "<html>");						// first page only
		if(i == (pages.length -1)) returnHtml = returnHtml.replace(/@TEMPLATE_FOOTER@/gi, "</body></html>");// last page only
		
		// otherwise
		returnHtml = returnHtml.replace(/@TEMPLATE_HEADER@/gi, '');
		returnHtml = returnHtml.replace(/@TEMPLATE_FOOTER@/gi, '');
	}
	
	returnHtml = returnHtml.replace(/@PAGE_BREAK@/gi, '<div class="page-break"></div>');
	returnHtml = replaceAllStandard(returnHtml,pages,contact);

	return returnHtml;	
}

function pdfize(pages,contact,metaList)
{
	var returnPdf  = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n';
	//	returnPdf += '<pdfset>';	// @TODO REMOVE COMMENT OUT?

	for (var i = 0; i < pages.length; i++)
	{
		var pageObject = pages[i];
		returnPdf += pageObject.reportText;

		if(i == 0) 					returnPdf = returnPdf.replace(/@TEMPLATE_HEADER@/gi, "<pdf>");		   // first page only
		if(i == (pages.length -1)) 	returnPdf = returnPdf.replace(/@TEMPLATE_FOOTER@/gi, "</body></pdf>"); // last page only

		returnPdf = returnPdf.replace(/@TEMPLATE_HEADER@/gi, "");		// remove
		returnPdf = returnPdf.replace(/@TEMPLATE_FOOTER@/gi, "");		// remove
	}
	
	if(metaList != null && metaList.length > 0)
	{
		var metaListXML = '';
		for(var i = 0; i < metaList.length; i++)
		{
			var meta = metaList[i];
			metaListXML += '<meta name="'+ meta.name +'" value="'+ meta.value +'"/>\n';
		}
		returnPdf = returnPdf.replace(/@META_LIST@/gi, metaListXML);
	}

	returnPdf = returnPdf.replace(/@PAGE_BREAK@/gi, '<pbr size="Letter"/>');		// remove
	returnPdf = replaceAllStandard(returnPdf,pages,contact);
	returnPdf = returnPdf.replace(/@PAGE_NUMBER@/gi, 'Page <pagenumber/>');			// this is dependent on the above being called first

	//returnPdf += "\n</pdfset>";

	return returnPdf;
}

function dealNameSort(a,b)
{
	var A = a.deal.toLowerCase();
	var B = b.deal.toLowerCase();
	
	if(A < B) return -1;
	if(A > B) return 1;
	return 0;
}

function contactIdSort(a,b)
{
	var A = parseInt(a.contactId);
	var B = parseInt(b.contactId);
	
	if(A < B) return -1;
	if(A > B) return 1;
	return 0;
}