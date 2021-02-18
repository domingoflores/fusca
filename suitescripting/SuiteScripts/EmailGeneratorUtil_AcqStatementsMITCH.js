/**
 * Module Description
 * Functionality used to add capabilities to send Acquiom Year End Statements
 * using the existing custom email tool by SRS
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Jan 2014     Pete
 *
 */

/**
 * @returns {Void} Any or no return value
 */


/* Staging */
var CERTPROCITEM = '261';

function WAnewAcqYearEndStatment() {

	var jobId = nlapiGetRecordId();
	
	// Schedule Script
	var schStatus = nlapiScheduleScript('customscript_qx_sch_createnewacquiommess', null, {custscript_qx_acqstatements_jobid: jobId}); // +20 

	if (schStatus == 'QUEUED'){
		nlapiLogExecution('DEBUG', 'Script Scheduled', 'Script has been scheduled for execution');

		// Pause Email Job if Scheduled
		try{
			nlapiSubmitField('customrecord_prepared_email_job', jobId, 'custrecord_prepared_email_job_status', Status.PAUSED);
			nlapiLogExecution('DEBUG', 'Successfully Paused Job');
		} catch(e) {
			nlapiLogExecution('ERROR', 'Unable to Pause Email Job', 'ERROR: ' + e);
		}
		
	} else if (schStatus == 'INQUEUE' || schStatus == 'INPROGRESS' ||schStatus == 'SCHEDULED'){
		nlapiLogExecution('ERROR', 'Script NOT Scheduled', 'Scheduled Status: ' + schStatus);
	} else {
		nlapiLogExecution('ERROR', 'Script NOT Scheduled', 'Scheduled Status: ' + schStatus);
	}
}



function SCHnewAcqYearEndStatment(){

	nlapiLogExecution('DEBUG', '---------------- Begin Scheduled Processs ------------------');
	
	// Constants
	var unitsReqToFinish = 10;
	
	// Get Information
	var ctx = nlapiGetContext();
	var jobId = ctx.getSetting('SCRIPT', 'custscript_qx_acqstatements_jobid');
	var lastIntId = ctx.getSetting('SCRIPT', 'custscript_qx_acqstatements_lastintid');
	var lastContId = ctx.getSetting('SCRIPT', 'custscript_qx_acqstatements_lastcontid');
	
	var emailJob = nlapiLoadRecord('customrecord_prepared_email_job', jobId); // +2
	var asOfDate = nlapiStringToDate(emailJob.getFieldValue('custrecord_month_stmt_as_of_date'));
	
	var stmtStartDate = '1/1/' + asOfDate.getFullYear();
	var stmtEndDate = '12/31/' + asOfDate.getFullYear();
	
	var deals = emailJob.getFieldValues('custrecord_prepared_email_deal_name');

	// Run Search
	var recFilters = new Array();
	recFilters.push(new nlobjSearchFilter('trandate', 'transaction', 'within', stmtStartDate, stmtEndDate));
	recFilters.push(new nlobjSearchFilter('custbodyacq_deal_link', 'transaction', 'anyof', deals));
	if (lastIntId) recFilters.push(new nlobjSearchFilter('internalidnumber', 'transaction', 'greaterthanorequalto', parseInt(lastIntId)));
	
	var recColumns = new Array();
	recColumns.push(new nlobjSearchColumn('internalid', 'transaction').setSort());
	recColumns.push(new nlobjSearchColumn('custbodyacq_deal_link', 'transaction'));
	recColumns.push(new nlobjSearchColumn('internalid', 'contact').setSort());
	
	var recsToEmail = nlapiSearchRecord('customer', 'customsearch_qx_acqemailstatements', recFilters, recColumns); // +10
	
	// For each Recipient, Create an Email Record
	if (recsToEmail && recsToEmail.length != 0){
		
		var foundLastCont = false;
		for (var i = 0; i < recsToEmail.length; i++){
			thisRec = recsToEmail[i];
			contactId = thisRec.getValue('internalid', 'contact');
			transId = thisRec.getValue('internalid', 'transaction');
			
			// Skip any contacts that have before the "Last Contact"
			if(transId == lastIntId && !foundLastCont){
				if (contactId == lastContId) foundLastCont = true;
				else continue;
			}
			
			// Check if enough units remain, if not reschedule
			var unitsRem = ctx.getRemainingUsage();
			if (unitsRem < unitsReqToFinish || i > 998){ // Search Results stop at 1000, reschedule if we are getting close
				var reschParams = {custscript_qx_acqstatements_jobid: jobId, 
						custscript_qx_acqstatements_lastintid: transId,
						custscript_qx_acqstatements_lastcontid: contactId};
				var schStatus = nlapiScheduleScript('customscript_qx_sch_createnewacquiommess', null, reschParams);
				
	            if ( schStatus == 'QUEUED' ) nlapiLogExecution('AUDIT', 'Not enough units to complete next transaction - rescheduling');
	            else nlapiLogExecution('ERROR', 'Failed to reschedule script - Script will continue at next scheduled execution time', 
	            		'Scheduling returned status: ' + schStatus);
	            return;
			}
			
			
			// Create Prepared Email Record
			nlapiLogExecution('DEBUG', 'Creating Prepared Email Record for ' + contactId);
			
			var record = nlapiCreateRecord('customrecord_prepared_emails'); // +2
			record.setFieldValue('custrecord_prepared_email_recipient', contactId);
			record.setFieldValue('custrecord_prepared_email_body','EMAIL BODY PENDING');
			record.setFieldValue('custrecord_prepared_email_subject', emailJob.getFieldValue('name'));
			
			// Link Transaction for later merge
			record.setFieldValue('custrecord_qx_referencetransaction', thisRec.getValue('internalid', 'transaction'));
			
			// Associate to parent prepared email job
			record.setFieldValue('custrecord_prepared_email_job', jobId);
			
			// Add Deal
			record.setFieldValues('custrecord_deals',[thisRec.getValue('custbodyacq_deal_link', 'transaction')]);
			
			// Submit Record
			try {
				var newRecId = nlapiSubmitRecord(record,false,false); // +4
				nlapiLogExecution('DEBUG', 'Successfully Created Prepared Email Record ' + newRecId + ' for ' + contactId);
			} catch(e) {
				nlapiLogExecution('ERROR', 'Could not create Prepared email Record for ' + contactId, 'ERROR: ' + e);
			}
			

			// Set the % Complete
			ctx.setPercentComplete(Math.round((i/recsToEmail.length) * 100));
			
		}
			
	} else {
		nlapiLogExecution('ERROR', 'No Letters found to email');
	}
	
	
	// Un-pause the Email Job
	try{
		nlapiSubmitField('customrecord_prepared_email_job', jobId, 'custrecord_prepared_email_job_status', Status.READY_FOR_CONFIRMATION); // +2
		nlapiLogExecution('DEBUG', 'Successfully Marked Job "Ready for Confirmation"');
	} catch(e) {
		nlapiLogExecution('ERROR', 'Unable  Marked Job "Ready for Confirmation"', 'ERROR: ' + e);
	}
	

	nlapiLogExecution('DEBUG', '---------------- Scheduled Process Complete ------------------');
	
	
	
}

function WAcreateStatements(){
	
	var jobId = nlapiGetRecordId();
	
	// Schedule Script
	var schStatus = nlapiScheduleScript('customscript_qx_sch_acqtemplateparser', null, {custscript_qx_acq_tp_jobid: jobId}); // +20 

	if (schStatus == 'QUEUED'){
		nlapiLogExecution('DEBUG', 'Script Scheduled', 'Merging Templates and preparing email records.');

		/* Doesn't appear this is needed - included from reference scripts
		// Pause Email Job if Scheduled
		try{
			nlapiSubmitField('customrecord_prepared_email_job', jobId, 'custrecord_prepared_email_job_status', Status.PAUSED);
			nlapiLogExecution('DEBUG', 'Successfully Paused Job in order to prepare email records');
		} catch(e) {
			nlapiLogExecution('ERROR', 'Unable to Pause Email Job', 'ERROR: ' + e);
		}*/
		
	} else if (schStatus == 'INQUEUE' || schStatus == 'INPROGRESS' ||schStatus == 'SCHEDULED'){
		nlapiLogExecution('ERROR', 'Script NOT Scheduled', 'Scheduled Status: ' + schStatus);
	} else {
		nlapiLogExecution('ERROR', 'Script NOT Scheduled', 'Scheduled Status: ' + schStatus);
	}
	
}


function SCHcreateStatements(){
	
	nlapiLogExecution('DEBUG', '---------------- Begin Create Statement Scheduled Processs ------------------');
	
	// Constants
	var unitsToFinish = 70; // Units required to process next email
	
	// Get Information
	var ctx = nlapiGetContext();
	var jobId = ctx.getSetting('SCRIPT', 'custscript_qx_acq_tp_jobid');
	var jobRec = nlapiLoadRecord('customrecord_prepared_email_job', jobId);
	var lastIntId = ctx.getSetting('SCRIPT', 'custscript_qx_acq_tp_lastintid');
	

	// Get Templates
	var emailTemplate = nlapiLoadFile(jobRec.getFieldValue('custrecord_prepared_email_template')); // +10
	var pdfTemplate = nlapiLoadFile(ctx.getSetting('SCRIPT', 'custscript_qx_acq_tp_pdftemplate')); // +10
	

	nlapiLogExecution('DEBUG', 'Preparing emails for Job ' + jobId);
	
	var prepFilters = new Array();
	prepFilters.push(new nlobjSearchFilter('custrecord_prepared_email_job', null, 'is', jobId));
	prepFilters.push(new nlobjSearchFilter('custrecord_prepared_email_status', null, 'noneof', Status.COMPLETED));
	if (lastIntId) prepFilters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(lastIntId)));
	
	var prepColumns = new Array();
	prepColumns.push(new nlobjSearchColumn('internalid').setSort());
	
	var prepEmails = nlapiSearchRecord('customrecord_prepared_emails', null, prepFilters, prepColumns); // +10
	
	if (!prepEmails || prepEmails.length == 0){
		nlapiLogExecution('ERROR', 'No Emails found to parse');
		return;
	}
	
	for (var i = 0; i < prepEmails.length; i++){
		
		// Check if enough units remain, if not reschedule
		var unitsRem = ctx.getRemainingUsage();
		if (unitsRem < unitsToFinish || i > 998){ // Search Results stop at 1000, reschedule if we are getting close
			var reschParams = {custscript_qx_acq_tp_jobid: jobId, custscript_qx_acq_tp_lastintid: prepEmails[i-1].getId()};
			var schStatus = nlapiScheduleScript('customscript_qx_sch_acqtemplateparser', null, reschParams);
			
            if ( schStatus == 'QUEUED' ) nlapiLogExecution('AUDIT', 'Not enough units to complete next transaction - rescheduling');
            else nlapiLogExecution('ERROR', 'Failed to reschedule script - Script will continue at next scheduled execution time', 
            		'Scheduling returned status: ' + schStatus);
            return;
		}
		
		// Process Email Records
		var prepEmailRec = nlapiLoadRecord('customrecord_prepared_emails', prepEmails[i].getId()); // +2
		
		// Get Transaction Details
		var transDetails = getTransFields(prepEmailRec.getFieldValue('custrecord_qx_referencetransaction'));
		
		// Create Email Text
		var hasError = createEmailText(prepEmailRec, jobRec, emailTemplate, transDetails);
		
		// Create PDF
		createPDF(prepEmailRec, jobRec, pdfTemplate, hasError, transDetails);		

		// Set the % Complete
		ctx.setPercentComplete(Math.round((i/prepEmails.length) * 100));
		
	}
	
	// Mark the Email Job "Ready for Confirmation"
	try{
		nlapiSubmitField('customrecord_prepared_email_job', jobId, 'custrecord_prepared_email_job_status', Status.READY_FOR_CONFIRMATION); // +2
		nlapiLogExecution('DEBUG', 'Successfully Marked Job "Ready for Confirmation"');
	} catch(e) {
		nlapiLogExecution('ERROR', 'Unable  Marked Job "Ready for Confirmation"', 'ERROR: ' + e);
	}
	
	nlapiLogExecution('DEBUG', '---------------- End Create Statement Scheduled Processs ------------------');
	
}

function createEmailText(prepEmailRec, jobRec, emailTemplate, transDetails){

	// Submit Template
	var submFlds = new Array();
	var submVals = new Array();
	
	if(emailTemplate == null) {
		nlapiLogExecution('ERROR', 'Could not find template', 'ERROR: ' + e);
		return;
	}

	// Swap Text
	var emailText = emailTemplate.getValue();
	emailText = replaceText(prepEmailRec, jobRec, emailText, transDetails);
	
	submFlds.push('custrecord_prepared_email_body');
	submVals.push(emailText);
	
	// Check if there is an email Address
	var emailAddress = nlapiLookupField('contact' , prepEmailRec.getFieldValue('custrecord_prepared_email_recipient'), 'email');
	var hasError;
	if (!emailAddress || emailAddress == ''){
		submFlds.push('custrecord_prepared_email_err_msg');
		submVals.push('NO_EMAIL_ADDRESS');
		
		submFlds.push('custrecord_prepared_email_status');
		submVals.push(Status.ERROR);
		
		hasError = true;
		
	} else {
		submFlds.push('custrecord_prepared_email_status');
		submVals.push(Status.READY_FOR_CONFIRMATION);
		
		hasError = false;
	}

	// Submit Changes
	try{
		nlapiSubmitField('customrecord_prepared_emails', prepEmailRec.getId(), submFlds, submVals); // +2
		nlapiLogExecution('DEBUG', 'Successfully Updated Prepared Email: ' + prepEmailRec.getId());
	} catch(e) {
		nlapiLogExecution('ERROR', 'Update Prepared Email: ' + prepEmailRec.getId(), 'ERROR: ' + e);
		hasError = true;
	}
	
	return hasError;
}

function createPDF(prepEmailRec, jobRec, pdfTemplate, hasError, transDetails){
	
	var ctx = nlapiGetContext();
	var emailedFolder = ctx.getSetting('SCRIPT', 'custscript_qx_emailedfolderid');
	var notEmailedFolder = ctx.getSetting('SCRIPT', 'custscript_qx_notemailedfolderid');
	
	if(pdfTemplate == null) {
		nlapiLogExecution('ERROR', 'Could not find template', 'ERROR: ' + e);
		return;
	}
	
	// Swap Text
	var pdfText = pdfTemplate.getValue();
	pdfText = replaceText(prepEmailRec, jobRec, pdfText, transDetails);
	
	// Create PDF
	try {
		var newPDF = nlapiXMLToPDF(pdfText); // +10
		
		var stmtYr = nlapiStringToDate(jobRec.getFieldValue('custrecord_month_stmt_as_of_date')).getFullYear();
		var dealName = prepEmailRec.getFieldText('custrecord_deals');
		var recipName = prepEmailRec.getFieldText('custrecord_prepared_email_recipient');
		var fileName = stmtYr + '_' + dealName + '_' + recipName;
		fileName = fileName.substring(0, 195) + '.pdf'; // Character Limit of 200
		
		newPDF.setName(fileName);
		
		if (!hasError) newPDF.setFolder(emailedFolder);
		else newPDF.setFolder(notEmailedFolder);
		
		var newPDFid = nlapiSubmitFile(newPDF); // +20

		nlapiLogExecution('DEBUG', 'Successfully Created PDF with ID: ' + newPDFid);
		
		// Attach PDF
		try {
			nlapiAttachRecord('file', newPDFid, 'contact', prepEmailRec.getFieldValue('custrecord_prepared_email_recipient')); // +10
			nlapiAttachRecord('file', newPDFid, 'customer', prepEmailRec.getFieldValue('custrecord_qx_referencecustomer')); // +10
			nlapiAttachRecord('file', newPDFid, 'customrecord_prepared_email_job', jobRec.getId()); // +10
			nlapiLogExecution('DEBUG', 'Successfully Attached PDF to records');
		} catch (e) {
			nlapiLogExecution('ERROR', 'Failed to attach PDF ' + newPDFid + ' to corresponding records.', 'ERROR: ' + e);
		}
		
	} catch (e) {
		nlapiLogExecution('ERROR', 'Failed to create PDF for: ' + prepEmailRec.getId(), 'ERROR: ' + e);
	}
}


function getTransFields(transIntId) {
	
	// Get Credit Memo components for merge
	var textFilters = new Array();
	textFilters.push(new nlobjSearchFilter('internalid', null, 'anyof', transIntId));
	textFilters.push(new nlobjSearchFilter('reversaldate', 'appliedtotransaction', 'isempty'));
	textFilters.push(new nlobjSearchFilter('item', null, 'anyof', ['@NONE@', CERTPROCITEM]));
	
	var textColumns = new Array();
	textColumns.push(new nlobjSearchColumn('mainline'));
	textColumns.push(new nlobjSearchColumn('trandate'));
	textColumns.push(new nlobjSearchColumn('custentity29', 'custbodyacq_deal_link'));
	textColumns.push(new nlobjSearchColumn('trandate', 'appliedtotransaction'));
	
	// Created from fields
	textColumns.push(new nlobjSearchColumn('custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldname', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldaddr1', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldaddr2', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldcity', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldstate', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldpostalcd', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldcountry', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_2_de1_ssnein', 'custbody_acq_lot_createdfrom_exchrec'));
	
	// Created From fields
	textColumns.push(new nlobjSearchColumn('custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldname', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldaddr1', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldaddr2', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldcity', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldstate', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldpostalcd', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldcountry', 'custbody_acq_lot_createdfrom_exchrec'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_loth_2_de1_ssnein', 'custbody_acq_lot_createdfrom_exchrec'));

	textColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_src_certnumber'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_acqdate'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_3_de1_numbershares'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_costbasis'));
	textColumns.push(new nlobjSearchColumn('custrecord_acq_lotce_zzz_zzz_payment'));
	
	return nlapiSearchRecord('transaction', null, textFilters, textColumns); // +10
	
}


function replaceText(prepEmailRec, jobRec, text, textRes){

	// Replace Components From Search
	if (textRes && textRes.length != 0){
		
		// Prepare fields
		var headerLine = textRes[0];
		var createdFromField = (headerLine.getValue('createdfrom') != '') ? 'createdfrom' : 'custbody_acq_lot_createdfrom_exchrec';
		
		// @date_of_sale@ 
		var dateOfSale = headerLine.getValue('trandate', 'appliedtotransaction') || '';
		for (var i = 1; i < textRes.length; i++)
			if (textRes[i].getValue('mainline') == '*') dateOfSale += ', ' + textRes[i].getValue('trandate', 'appliedtotransaction');
		text = text.replace(/@date_of_sale@/gi, dateOfSale);
		
		// @buyer@
		var dealBuyer = headerLine.getValue('custentity29', 'custbodyacq_deal_link') || '';
		text = text.replace(/@buyer@/gi, dealBuyer);

		// @recipient_id@
		var recipId = '';
		var fullRecipId = headerLine.getValue('custrecord_acq_loth_2_de1_ssnein', createdFromField);
                   if (fullRecipId && fullRecipId != '' && fullRecipId.slice(-4) == "8BEN") 
		    recipId = 'Not Provided'
		    else if (fullRecipId && fullRecipId != '') recipId = '*******' + fullRecipId.slice(-4);
		//if (fullRecipId && fullRecipId != '') recipId = '*******' + fullRecipId.slice(-4);
		text = text.replace(/@recipient_id@/gi, recipId);
		
		// @recipient_address@
		var recAddr = '';
		if (headerLine.getValue('custrecord_acq_loth_1_de1_shrhldname', createdFromField) != '') 
			recAddr += headerLine.getValue('custrecord_acq_loth_1_de1_shrhldname', createdFromField) + '<br />';
		if (headerLine.getValue('custrecord_acq_loth_1_de1_shrhldaddr1', createdFromField) != '') 
			recAddr += headerLine.getValue('custrecord_acq_loth_1_de1_shrhldaddr1', createdFromField) + '<br />';
		if (headerLine.getValue('custrecord_acq_loth_1_de1_shrhldaddr2', createdFromField) != '') 
			recAddr += headerLine.getValue('custrecord_acq_loth_1_de1_shrhldaddr2', createdFromField) + '<br />';
		if (headerLine.getValue('custrecord_acq_loth_1_de1_shrhldcity', createdFromField) != '') 
			recAddr += headerLine.getValue('custrecord_acq_loth_1_de1_shrhldcity', createdFromField) + ', ';
		if (headerLine.getText('custrecord_acq_loth_1_de1_shrhldstate', createdFromField) != '') 
			recAddr += headerLine.getText('custrecord_acq_loth_1_de1_shrhldstate', createdFromField) + ' ';
		if (headerLine.getValue('custrecord_acq_loth_1_de1_shrhldpostalcd', createdFromField) != '') 
			recAddr += headerLine.getValue('custrecord_acq_loth_1_de1_shrhldpostalcd', createdFromField) + '<br />';
		if (headerLine.getText('custrecord_acq_loth_1_de1_shrhldcountry', createdFromField) != '') 
			recAddr += headerLine.getText('custrecord_acq_loth_1_de1_shrhldcountry', createdFromField) + '<br />';
		text = text.replace(/@recipient_address@/gi, recAddr);
		
		//@statement_table@
		var tableData = '';
		var missingText = 'Unknown';
		for (var j = 1; j < textRes.length; j++){
			if (textRes[j].getValue('mainline') != '*') {
				tableData += '<tr>';
				tableData += '<td width="20">&nbsp;</td>';
				tableData += '<td>';
				if (textRes[j].getValue('custrecord_acq_lotce_3_src_certnumber') && textRes[j].getValue('custrecord_acq_lotce_3_src_certnumber') != '')
					tableData += textRes[j].getValue('custrecord_acq_lotce_3_src_certnumber');
				else 
					tableData += missingText;
				tableData += '</td>';
				
				tableData += '<td>';
				if (textRes[j].getValue('custrecord_acq_lotce_zzz_zzz_acqdate') && textRes[j].getValue('custrecord_acq_lotce_zzz_zzz_acqdate') != '')
					tableData += textRes[j].getValue('custrecord_acq_lotce_zzz_zzz_acqdate');
				else
					tableData += missingText;
				tableData += '</td>';
				
				tableData += '<td>' + addCommas(textRes[j].getValue('custrecord_acq_lotce_3_de1_numbershares').replace('-', '')) + '</td>';
				
				tableData += '<td>';
				if (textRes[j].getValue('custrecord_acq_lotce_zzz_zzz_costbasis') && textRes[j].getValue('custrecord_acq_lotce_zzz_zzz_costbasis') != '')
					tableData += '$' + addCommas(textRes[j].getValue('custrecord_acq_lotce_zzz_zzz_costbasis'));
				else
					tableData += missingText;
				tableData += '</td>';
				
				tableData += '<td>$' + addCommas(textRes[j].getValue('amount').replace('-', '')) + '</td>';
				
				tableData += '</tr>';
			}
		}
		text = text.replace(/@statement_table@/gi, tableData);
	}
	
	
	// Replace Other Components

	// @statement_year@
	var stmtYr = nlapiStringToDate(jobRec.getFieldValue('custrecord_month_stmt_as_of_date')).getFullYear();
	text = text.replace(/@statement_year@/gi, stmtYr);
	
	// @deal_name@
	var dealName = prepEmailRec.getFieldText('custrecord_deals');
	text = text.replace(/@deal_name@/gi, dealName);
	
	
	// Return Merged Text
	return text;
	
}

function addCommas(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}
