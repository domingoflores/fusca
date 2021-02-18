/**
 * Form add/editing Avid Suite user credentials
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Mar 2015     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	var context = nlapiGetContext();
	var form = null;
	var isAdmin = nlapiGetRole() === 3;
	var employeeId = nlapiGetUser();
	
	if(request.getMethod() == 'GET'){
		form = loadForm(employeeId);
		response.writePage(form);
	}
	else{
		var crypto = new PPCrypto();
		// submit form
		var rec = PPSLibAvidSuite.loadUserCredentialRecordByEmployeeId(employeeId);
		if(!rec){
			rec = nlapiCreateRecord('customrecord_pp_av_credentials');
		}
		
		rec.setFieldValue('custrecord_pp_avc_employee',employeeId);
		rec.setFieldValue('custrecord_pp_avc_password',crypto.encrypt(request.getParameter('custpage_pp_avc_password')));
		rec.setFieldValue('custrecord_pp_avc_username',request.getParameter('custpage_pp_avc_username'));
		
		
		try{
			nlapiSubmitRecord(rec);
		}
		catch(e){
			nlapiLogExecution('ERROR','Error saving record',e.toString());
			form = loadForm(employeeId);
			$PPS.addMessageToForm(form,'error','Error saving record');
			response.writePage(form);
			return;
		}
	
		$PPS.Session.setFlash('success','User credentials were successfully saved.');
		
		response.sendRedirect('suitelet', context.getScriptId(), context.getDeploymentId());
	}
}


function loadForm(employeeId){
	var crypto = new PPCrypto();
	var rec = null;
	if(employeeId){
		rec = PPSLibAvidSuite.loadUserCredentialRecordByEmployeeId(employeeId);
	}
	var form = nlapiCreateForm('Avid User Credentials');
	
	$PPS.writeFlashMessagesToForm(form);
	
	form.addFieldGroup('custgrp_settings', 'Settings').setSingleColumn(true);
	
	var employeeField = form.addField('custpage_pp_avc_employee', 'select', 'Employee','employee','custgrp_settings');
	employeeField.setDisplayType('inline');
	employeeField.setDefaultValue(employeeId);
	employeeField.setMandatory(true);
	
	var usernameField = form.addField('custpage_pp_avc_username', 'text', 'Username',null,'custgrp_settings');
	var passwordGUID = null;
	if(rec){
		usernameField.setDefaultValue(rec.getFieldValue('custrecord_pp_avc_username'));
		passwordGUID = crypto.decrypt(rec.getFieldValue('custrecord_pp_avc_password'));
	}
	
	var passwordField = form.addField('custpage_pp_avc_password', 'Password', 'Password',null,'custgrp_settings');
	passwordField.setDefaultValue(passwordGUID);
	
	form.addSubmitButton('Submit');
	return form;
	
}