/**
 * @author durbano
 */
function createAuditConfirmations()
{
	var parentRecordId = nlapiGetRecordId();	// get identifier of the base Prepared Email Job
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId)

	// get the list of
	var dealIds = parent.getFieldValues('custrecord_prepared_email_deal_name');
	var shrhlds = parent.getFieldValues('custrecord_prepared_email_shareholders');
	var rcipnts = parent.getFieldValues('custrecord_prepared_email_recipients');
	
	if(dealIds == null || dealIds.length == 0) throw 'No Deals Selected';
	if(shrhlds == null || shrhlds.length == 0) throw 'No Shareholders Selected';
	if(rcipnts == null || rcipnts.length == 0) throw 'No Deals Selected';

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_AuditConfirmation.createAuditConfirmations", "Working on Prepared Email Job " + parentRecordId);
	
	// loop through each recipient and create a preparedEmailRecord
	for(var i = 0; i < rcipnts.length; i++)
	{
		var record = nlapiCreateRecord('customrecord_prepared_emails');

		record.setFieldValue('custrecord_prepared_email_recipient',rcipnts[i]);
		record.setFieldValue('custrecord_prepared_email_body','EMAIL BODY PENDING');
		record.setFieldValue('custrecord_prepared_email_subject',parent.getFieldValue('name'));
		record.setFieldValue('custrecord_prepared_email_job',parent.getId());
		record.setFieldValues('custrecord_deals',dealIds);
		
		nlapiSubmitRecord(record,false,false);
	}
}


function parseAndReplace()
{
	var parentRecordId = nlapiGetRecordId();
	var parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId);
	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_AuditConfirmation.parseAndReplace", "Working on Prepared Email Job " + parentRecordId);

	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', parentRecordId));
		filters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', Status.COMPLETED));

	var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_prepared_email_body'));

	var emails = nlapiSearchRecord('customrecord_prepared_emails',null, filters, columns);
	if(emails == null || emails.length == 0) throw 'No emails found for job';
	
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
	}

	nlapiLogExecution("AUDIT", "EmailGeneratorUtil_AuditConfirmation.parseAndReplace", "Updating status of email job.");

	parent = nlapiLoadRecord('customrecord_prepared_email_job',parentRecordId);
	parent.setFieldValue('custrecord_prepared_email_job_status', Status.READY_FOR_CONFIRMATION);
	nlapiSubmitRecord(parent, false, false); // save record
}

function doParseAndReplace(emailRecord, parentRecord)
{
	emailRecord.setFieldValue('custrecord_prepared_email_status', Status.IN_PROCESS);
	
	var template = nlapiLoadFile(parentRecord.getFieldValue('custrecord_prepared_email_template')); 			// the blank template
	if(template == null)	throw 'Template is null';
	
	var rpt = template.getValue();
	
	// replace the following
	var today = new Date();
	
	// @LETTER_DATE@
	var letterDate = (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
	rpt = rpt.replace(/@LETTER_DATE@/gi, letterDate);
	rpt = rpt.replace(/@VIA_USPS_FAX@/gi, 'VIA USPS AND FACSIMILE');
	
	// -- auditor specific
	var contact = getContact(emailRecord.getFieldValue('custrecord_prepared_email_recipient'));
	rpt = rpt.replace(/@CONTACT_NAME@/gi, contact.name);
	rpt = rpt.replace(/@FIRM_NAME@/gi, nlapiEscapeXML(contact.company));
	
	if(contact.fax.length > 0)	rpt = rpt.replace(/@CONTACT_FAX@/gi, contact.fax);
	else						rpt = rpt.replace(/@CONTACT_FAX@/gi, '');
	
	var address = contact.address1;
	if(contact.address2.length > 0)	address += ', ' + contact.address2;
	if(contact.address3.length > 0)	address += '<br/>' + contact.address3;
	rpt = rpt.replace(/@CONTACT_ADDRESS@/gi, nlapiEscapeXML(address));
	
	var cityStateZip = contact.city + ', ' + contact.state + ' ' + contact.zipcode;
	rpt = rpt.replace(/@CONTACT_CITY_STATE_ZIP@/gi, nlapiEscapeXML(cityStateZip));
	
	// -- VC Firm specific -- Grab the first shareholder list, and get it's parent
	var shareholders = parentRecord.getFieldValues('custrecord_prepared_email_shareholders');
	if(shareholders == null || shareholders.length == 0) throw 'NO_SHAREHOLDERS_FOUND';
	
	var vcFirm = nlapiLoadRecord('customer',shareholders[0]);	// just load the first shareholder
	var vcFirmName = vcFirm.getFieldValue('companyname');
	var vcFirmId = shareholders[0];

	var topLevelParents = getTopLevelParents(shareholders);
	if(topLevelParents != null && topLevelParents.length > 0)
	{
		vcFirm = nlapiLoadRecord('customer',topLevelParents[0]);	// just load the first shareholder
		vcFirmName = vcFirm.getFieldValue('companyname');
		vcFirmId = vcFirm.getId();
	}
	rpt = rpt.replace(/@VC_FIRM_NAME@/gi, nlapiEscapeXML(vcFirmName));
	
	var asOfDate = parentRecord.getFieldValue('custrecord_month_stmt_as_of_date');
	rpt = rpt.replace(/@STATEMENT_AS_OF_DATE@/gi, asOfDate);
	
	// -- GET THE USD AND NON-USD Balances
	var deals = parentRecord.getFieldValues('custrecord_prepared_email_deal_name');
	var usdData = getEscrowBalances(true,deals,shareholders,asOfDate);	
	var usdDisp = getEscrowBalanceDisplay(usdData,true);
	var hasUsdBalances = usdDisp != null && usdDisp.length > 0;

	var nonUsdData = getEscrowBalances(false,deals,shareholders,asOfDate);
	var nonUsdDisp = getEscrowBalanceDisplay(nonUsdData, (hasUsdBalances == false));

	var auditDisplay = '<table cellpadding="2" cellmargin="1" border="0">' + usdDisp + nonUsdDisp + '</table><br/><br/>' 
	
	rpt = rpt.replace(/@DEAL_BALANCES@/gi, auditDisplay);
	
	// HTML-based template
	var htmlrpt = rpt.replace(/@TEMPLATE_HEADER@/gi, "<html>");
		htmlrpt = htmlrpt.replace(/@TEMPLATE_FOOTER@/gi, "</html>");
	
	emailRecord.setFieldValue('custrecord_prepared_email_body',htmlrpt);
	emailRecord.setFieldValue('custrecord_prepared_email_status',Status.READY_FOR_CONFIRMATION);
	nlapiSubmitRecord(emailRecord,false,false);

	// PDF-based template
	rpt = rpt.replace(/@TEMPLATE_HEADER@/gi, '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n<pdf>');
	rpt = rpt.replace(/@TEMPLATE_FOOTER@/gi, '</pdf>');
	
	var pdfFile = nlapiXMLToPDF(rpt);
		pdfFile.setFolder(957);
		pdfFile.setName(parentRecord.getId() + "-" + vcFirmName + "-" + contact.company + "-" + contact.name + ".pdf");
	
	var pdfId = nlapiSubmitFile(pdfFile);
	nlapiAttachRecord("file", pdfId, "customrecord_prepared_email_job", parentRecord.getId());
	nlapiAttachRecord("file", pdfId, "customer", vcFirmId);
	// fin
}

function getEscrowBalanceDisplay(data,displayHeader)
{
	if(data == null || data.length == 0) return '';
	
	var balances = newBalanceObject();
	var runningBalance = newBalanceObject();

	var denominationHtml = '<tr><th align="left" colspan="8">Denomination: ';
	var html = '';
	if(displayHeader == true)
		html = '<tr><th align="left">Deal</th>'			 + '<th align="left">Shareholder</th>'	+	'<th>Deposits/<br/>Holdbacks</th>'
					+ '<th>Investment<br/>Earnings</th>' + '<th>Claims<br/>Paid</th>'	+	'<th>Expenses</th>'
					+ '<th>Disbursements</th>'
					+ '<th>Balance</th></tr>';
					
	var lastDeal = null;
	var lastDenom = null;
	for(var i = 0; i < data.length; i++)
	{
		var datum = data[i];
		
		if(lastDeal != null && datum.deal != lastDeal)
		{	// construct the display
			html += '<tr background-color="#B9D3EE"><th colspan="2" align="left"> &nbsp; Subtotal: ' + nlapiEscapeXML(lastDeal) + '</th>';						// account
			html += createNewStatementLine(runningBalance) + '</tr>';
			runningBalance = newBalanceObject();						// reset
		}
		lastDeal = datum.deal;

		if(lastDenom == null || lastDenom != datum.denomination)	html += denominationHtml + datum.denomination + '</th></tr>';			// denomination
		lastDenom = datum.denomination;
		
		// construct the display
		html += '<tr background-color="#CCCCCC"><td>' + nlapiEscapeXML(datum.account) + '</td>';		// account
		html += '<td>' + nlapiEscapeXML(datum.shareholder) + '</td>';						// shareholder
		html += createNewStatementLine(datum) + '</tr>';					// all amounts
		
		balances = updateBalances(balances,datum);				// update the balances
		runningBalance = updateBalances(runningBalance,datum);	// update the running balance
	}
	// add the final subtotal
	html += '<tr background-color="#B9D3EE"><th colspan="2" align="left"> &nbsp; Subtotal: ' + nlapiEscapeXML(lastDeal) + '</th>';						// account
	html += createNewStatementLine(runningBalance) + '</tr>';
	
	html += '<tr><th colspan="2" align="left"> &nbsp; Total:</th>';
	html += createNewStatementLine(balances);
	html += '</tr>';

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

function createNewStatementLine(dataLine)
{
	var html = '';
	html += '<td align="right">' + formatCurrency(sumAndRound(dataLine.deposits,dataLine.holdbacks)) + '</td>';	// deposits + holdbacks
	html += '<td align="right">' + formatCurrency(dataLine.investmentearnings) + '</td>';		// investment earnings
	html += '<td align="right">' + formatCurrency(dataLine.claimspaid) + '</td>';				// claims paid
	html += '<td align="right">' + formatCurrency(dataLine.expenses) + '</td>';				// expenses
	html += '<td align="right">' + formatCurrency(dataLine.disbursements) + '</td>';			// disbursements 
	html += '<td align="right">' + formatCurrency(dataLine.balance) + '</td>';			// balance

	return html;		
}

