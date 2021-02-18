/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Feb 2013     Jason Foglia
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	try{
		// Create the No Offsets printer offset
		var rec = nlapiCreateRecord("customrecord_pp_printer_offsets");
		rec.setFieldValue('custrecord_pp_printer_name', 'No Offsets');
		nlapiSubmitRecord(rec);
	}
	catch(e){
		nlapiLogExecution('ERROR', e.name, e.message);
	}
	

	
	try{
		// Gather all admin user ids
		var adminIds = getAdminUserIds();
		
		// Create default payment approval group
		var approvalGroupRec = nlapiCreateRecord("customrecord_pp_approval_groups");
		approvalGroupRec.setFieldValue('name','Default Approval Group');
		if(adminIds.length > 0){
			approvalGroupRec.setFieldValues('custrecord_pp_ag_users',adminIds);
		}
		var defaultApprovalGroupId = nlapiSubmitRecord(approvalGroupRec);
		
		// Create default payment approval process
		var approvalProcessRec = nlapiCreateRecord("customrecord_pp_approval_process");

		approvalProcessRec.setFieldValue('name','Default Approval Process');
		approvalProcessRec.setFieldValue('custrecord_pp_lower_limit',0);
		approvalProcessRec.setFieldValue('custrecord_pp_upper_limit',100000000000000);
		approvalProcessRec.setFieldValue('custrecord_pp_auto_approve','F');
		approvalProcessRec.setFieldValue('custrecord_pp_ap_all_accounts','T');

		var subRecordName = 'recmachcustrecord_pp_approval_process';
		approvalProcessRec.selectNewLineItem(subRecordName);
		approvalProcessRec.setCurrentLineItemValue(subRecordName ,'name','Pending Approval');
		approvalProcessRec.setCurrentLineItemValue(subRecordName ,'custrecord_pp_next_approver_grp',defaultApprovalGroupId);
		approvalProcessRec.commitLineItem(subRecordName);

		approvalProcessRec.selectNewLineItem(subRecordName);
		approvalProcessRec.setCurrentLineItemValue(subRecordName ,'name','Approved');
		approvalProcessRec.setCurrentLineItemValue(subRecordName ,'custrecord_pp_previous_approver_grp',defaultApprovalGroupId);
		approvalProcessRec.commitLineItem(subRecordName);

		nlapiSubmitRecord(approvalProcessRec, true);

		// Create rejected status
		var rejectedRec = nlapiCreateRecord("customrecord_pp_pmt_approval_status");
		rejectedRec.setFieldValue('name', 'Rejected');
		nlapiSubmitRecord(rejectedRec);
		
		// There should only be one approved status at this point
		var filterExpression = PPSLibApprovals.lastSubFilterExpression;
		var searchResults = nlapiSearchRecord("customrecord_pp_pmt_approval_status",null,filterExpression,null);
		var approvedRecId = searchResults[0].getId();
		
		// Set all existing payments approval status to approved
		var status = nlapiScheduleScript("customscript_pp_ss_resetdefaultpaymentas", "customdeploy_pp_ss_resetdefaultpaymentas",
				{ "custscript_paymentids": 		null, 
		      	  "custscript_changeapproval": 	'@NONE@',
		      	  'custscript_set_approver': 	approvedRecId
		      	  }
		);
		if(status != "QUEUED")
		{
			nlapiLogExecution('error', 'INSTALLATION_ERROR', "nlapiScheduleScript customscript_pp_ss_resetdefaultpaymentas failed with: " + status);
		}
	}
	catch(e){
		nlapiLogExecution('ERROR', e.name, e.message);
	}
	
	try{
		createDefaultACHInviteTemplate();
	}
	catch(e){
		nlapiLogExecution('ERROR', 'Bundle install error', e.message);
	}
	
	// set default company preferences
	try{
		var prefs = nlapiLoadConfiguration('companypreferences');
		prefs.setFieldValue('custscript_pp_paypal_note','{memo}');
		nlapiSubmitConfiguration(prefs);
	}
	catch(e){
		nlapiLogExecution('ERROR', 'Bundle install error setting default company preferences', e.message);
	}
	
	// Set custbody_pp_is_printed to true for all payments that have been printed by native NetSuite.  
	status = nlapiScheduleScript("customscript_pp_ss_default_is_printed", "customdeploy_pp_ss_default_is_printed",{"custscript_paymentids2": null });
	if(status != "QUEUED")
	{
		nlapiLogExecution('error', 'INSTALLATION_ERROR', "nlapiScheduleScript customscript_pp_ss_default_is_printed failed with: " + status);
	}
	
	status = nlapiScheduleScript("customscript_pp_ss_bill_credit_update", "customdeploy_pp_ss_bill_credit_update");
	if(status != "QUEUED")
	{
		throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript customscript_pp_ss_bill_credit_update failed with: " + status);
	}
	
}


function getAdminUserIds(){
	var columns = [];
	var filters = [];
	var adminIds = [];
	
	filters.push(new nlobjSearchFilter('giveaccess',null,'is','T'));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	filters.push(new nlobjSearchFilter('role',null,'anyof',[3]));
	var searchResults = nlapiSearchRecord('employee', null, filters, columns);
	if(searchResults){
		for(var j = 0; j < searchResults.length; j++){
			adminIds.push(searchResults[j].getId());
		}
	}
	return adminIds;
}


/**
 * Create default ACH Invite template
 */
function createDefaultACHInviteTemplate(){
	
	var sampleInviteContent = "Hello <#--FM:BEGIN--><#if (entity.firstName)?has_content>${entity.firstName}<#else>${entity.companyName}</#if><#--FM:END-->,<br/><br/>\n\n";
	sampleInviteContent += "Piracle would like to invite you to participate in our electronic payment program. By choosing to receive your payments electronically, payments will automatically be posted to your bank account and an electronic remittance will be sent to you for your records. Please follow the included link to the secure webpage to register.<br/><br/>\n\n";
	sampleInviteContent += "<a href=\"<NLLINK>\">Click here</a> to register for or decline electronic payments.  <em>This link will expire in 30 days.</em><br/><br/>\n\n";
	sampleInviteContent += "If you have any questions about this program please contact our electronic payment representative, John Doe at jdoe@wolfeelectronics.com or call: 800.123.wolfe.<br/><br/>\n";
	
	var emailTmplRec = nlapiCreateRecord('emailtemplate');
	emailTmplRec.setFieldValue('name', 'Sample ACH Invite Email Template');
	emailTmplRec.setFieldValue('subject','Request For Electronic Bill Payment Information');
	emailTmplRec.setFieldValue('description','This is a sample email template for ACH invites. You can copy or customize this email template.');
	emailTmplRec.setFieldValue('content',sampleInviteContent);
	emailTmplRec.setFieldValue('addcompanyaddress','F');
	emailTmplRec.setFieldValue('addunsubscribelink','F');
	nlapiSubmitRecord(emailTmplRec, true, false);
}