/**
 * Module Description
 * Allows an email to be sent with a dynamically selected template and attachment
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Dec 2014     Pete
 * 1.01       27 Nov 2016     Scott            Updated the nlapisendemail to have a replyto address
 *
 */

function sendCustomEmail() {
	
	var recType = nlapiGetRecordType();
	var recId = nlapiGetRecordId();
	
	// Collect Parameters from Workflow
	var ctx = nlapiGetContext();
	var custSender = ctx.getSetting('SCRIPT', 'custscript_qx_emailwfa_sender');
	var custRecipient = ctx.getSetting('SCRIPT', 'custscript_qx_emailwfa_recipient');
	var custTemplate = ctx.getSetting('SCRIPT', 'custscript_qx_emailwfa_template');
	var custAttId = ctx.getSetting('SCRIPT', 'custscript_qx_emailwfa_attachment');
	
	nlapiLogExecution('DEBUG', 'custSender: ' + custSender + '\ncustRecipient: ' + custRecipient + '\ncustTemplate: ' + custTemplate + '\ncustAttId: ' + custAttId);
	
	// Load Attachment File
	var custAttFile;
	if (custAttId) custAttFile = nlapiLoadFile(custAttId);

	// Attach Email to Exchange Record
	var attachToER = new Object();
	attachToER['recordtype'] = recType;
	attachToER['record'] = recId;
	
	// CC & BCC Not Used Today
	var custCC = null;
	var custBCC = null;
	
	try {
		// Merge Template
		var emailTemp = nlapiLoadRecord('emailtemplate', custTemplate);
		var exchangeRecord = nlapiLoadRecord(recType, recId);	

		var renderer = nlapiCreateTemplateRenderer();
		renderer.addRecord('customrecord', exchangeRecord);
		
		renderer.setTemplate(emailTemp.getFieldValue('subject'));
		var renderedSubj = renderer.renderToString();

		renderer.setTemplate(emailTemp.getFieldValue('content'));
		var renderedBody = renderer.renderToString();
		
		// Send Email
      	nlapiSendEmail(custSender, custRecipient, renderedSubj, renderedBody, custCC, custBCC, attachToER, custAttFile, true, false, 'support@srsacquiom.com');  //Added by STS on 9/27
		//nlapiSendEmail(custSender, custRecipient, renderedSubj, renderedBody, custCC, custBCC, attachToER, custAttFile, true);
		
		nlapiLogExecution('DEBUG', 'Successfully sent email for ER: ' + recId);
	} catch (e) {
		var errResponse = '';
		if (e instanceof nlobjError) errResponse += '\n' + e.getCode() + ": " + e.getDetails();
		else errResponse += '\n' + e.toString();
		var errorMessage = 'Failed to merge and send email for ER: ' + recId;
		nlapiLogExecution('ERROR', errorMessage, errResponse);
		nlapiSendEmail(28154, 'analysts@srsacquiom.com', 'Failed to merge and send email', errorMessage);
	}
	
}



