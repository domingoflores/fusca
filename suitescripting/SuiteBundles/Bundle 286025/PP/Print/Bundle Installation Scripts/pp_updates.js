/**
 * Store all your bundle update functions here and call from PP_BI_Defaulting.js
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Sep 2013     maxm
 *
 */

/**
 * Converts the old approval process to the new version.
 */
function updateApprovalProcess(){
	// Create default payment approval process
	var approvalProcessRec = nlapiCreateRecord("customrecord_pp_approval_process");

	approvalProcessRec.setFieldValue('name','Default Approval Process');
	approvalProcessRec.setFieldValue('custrecord_pp_lower_limit',0);
	approvalProcessRec.setFieldValue('custrecord_pp_upper_limit',100000000000000);
	approvalProcessRec.setFieldValue('custrecord_pp_auto_approve','F');
	approvalProcessRec.setFieldValue('custrecord_pp_ap_all_accounts','T');
	
	var approvalProcessId = nlapiSubmitRecord(approvalProcessRec, true);
	
	// search for all statuses that are not rejected and set their approval process to the new process
	var filterExpression = [['custrecord_pp_previous_approver_grp','noneof','@NONE@'],'or',['custrecord_pp_next_approver_grp','noneof','@NONE@']];
	var columns = [];
	
	var searchResults = nlapiSearchRecord('customrecord_pp_pmt_approval_status', null, filterExpression, null);
	
	var numResuts = searchResults.length;
	for(var i = 0; i < numResuts; i++){
		nlapiSubmitField('customrecord_pp_pmt_approval_status',searchResults[i].getId(),'custrecord_pp_approval_process',approvalProcessId);
	}
}

/**
 * Creates approval groups set as
 */
function updateApprovalProcess2(){
		
	var myObjs = {};
	
	// find all roles used in approval processes
	var columns = [];
	
	columns.push(new nlobjSearchColumn('custrecord_pp_previous_approver',null));
	columns.push(new nlobjSearchColumn('custrecord_pp_next_approver',null));
	
	var statusSearchResults = nlapiSearchRecord('customrecord_pp_pmt_approval_status', null, null, columns);
	if(!statusSearchResults){
		return;
	}
	for(var i = 0; i < statusSearchResults.length; i++){
		var sr = statusSearchResults[i];
		var prevApprId = sr.getValue('custrecord_pp_previous_approver',null);
		if(prevApprId != '' && !(prevApprId in myObjs)){
			myObjs[prevApprId] = {
					roleName : sr.getText('custrecord_pp_previous_approver',null),
					userIds : [],
					groupId : null
			};
		}
		
		var nextApprId = sr.getValue('custrecord_pp_next_approver',null);
		if(nextApprId != '' && !(nextApprId in myObjs)){
			myObjs[nextApprId] = {
					roleName : sr.getText('custrecord_pp_next_approver',null),
					userIds : [],
					groupId : null
			};
		}
	}
	
	// find and set users that belong to each role
	rolesUser(myObjs);
	
	// create a group for each role and map each group to its role
	var roleIds = Object.keys(myObjs);
	for(var i = 0; i < roleIds.length; i++){
		var myObj = myObjs[roleIds[i]];
		
		var rec = nlapiCreateRecord('customrecord_pp_approval_groups');
		rec.setFieldValue('name',myObj.roleName + ' Group');
		rec.setFieldValues('custrecord_pp_ag_users', myObj.userIds);
		var recId = nlapiSubmitRecord(rec);
		myObj.groupId = recId;
	}
	
	// set groups for corresponding roles on approval statuses records
	for(var i = 0; i < statusSearchResults.length; i++){
		var sr = statusSearchResults[i];
		
		var prevApprId = sr.getValue('custrecord_pp_previous_approver',null);
		if(prevApprId != ''){
			var myObj = myObjs[prevApprId];
			nlapiSubmitField('customrecord_pp_pmt_approval_status', sr.getId(), 'custrecord_pp_previous_approver_grp', myObj.groupId, false);
		}
		
		var nextApprId = sr.getValue('custrecord_pp_next_approver',null);
		if(nextApprId != ''){
			var myObj = myObjs[nextApprId];
			nlapiSubmitField('customrecord_pp_pmt_approval_status', sr.getId(), 'custrecord_pp_next_approver_grp', myObj.groupId, false);
		}
	}
}

// Get userIds for every role and set them on the myObjs obj
function rolesUser(myObjs){
	
	var roleIds = Object.keys(myObjs);
	
	for(var i = 0; i < roleIds.length; i++){
		var roleId = roleIds[i];
		var columns = [];
		var filters = [];
		var userIds = [];
		
		// only gather users
		filters.push(new nlobjSearchFilter('giveaccess',null,'is','T'));
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		filters.push(new nlobjSearchFilter('role',null,'anyof',[roleId]));
		var searchResults = nlapiSearchRecord('employee', null, filters, columns);
		if(searchResults){
			for(var j = 0; j < searchResults.length; j++){
				userIds.push(searchResults[j].getId());
			}
		}
		myObjs[roleId]['userIds'] = userIds;
	}
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
