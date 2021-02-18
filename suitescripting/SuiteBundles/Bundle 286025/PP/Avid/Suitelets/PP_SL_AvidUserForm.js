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
		// submit form
		var rec = loadUserCredentialRecordByEmployeeId(employeeId);
		if(!rec){
			rec = nlapiCreateRecord('customrecord_pp_av_user_credentials');
		}
		
		rec.setFieldValue('custrecord_pp_av_employee',employeeId);
		rec.setFieldValue('custrecord_pp_av_password_guid',request.getParameter('custpage_pp_av_password'));
		rec.setFieldValue('custrecord_pp_av_username',request.getParameter('custpage_pp_av_username'));
		
		
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
	var rec = null;
	if(employeeId){
		rec = loadUserCredentialRecordByEmployeeId(employeeId);
	}
	var form = nlapiCreateForm('Avid User Credentials');
	
	$PPS.writeFlashMessagesToForm(form);
	
	form.addFieldGroup('custgrp_settings', 'Settings').setSingleColumn(true);
	
	var employeeField = form.addField('custpage_pp_av_employee', 'select', 'Employee','employee','custgrp_settings');
	employeeField.setDisplayType('inline');
	employeeField.setDefaultValue(employeeId);
	employeeField.setMandatory(true);
	
	var usernameField = form.addField('custpage_pp_av_username', 'text', 'Username',null,'custgrp_settings');
	var passwordGUID = null;
	if(rec){
		usernameField.setDefaultValue(rec.getFieldValue('custrecord_pp_av_username'));
		passwordGUID = rec.getFieldValue('custrecord_pp_av_password_guid');
	}
	//var domains = ['httpbin.org','piracle.com'];
	//var domains = ['httpbin.org'];
	var domain = PPSLibAvidSuite.getAPIDomain();
	var script = 'customscript_pp_sl_apn_processor';
	// domains and script are required
	// multiple domains do not seem to work
	// multiple scripts do not work
	//form.addCredentialField('custpage_pp_av_password', 'Password', domains, 'customscript_pp_sl_process_apn_payments', null, false,'custgrp_settings');
	
	form.addCredentialField('custpage_pp_av_password', 'Password', domain, script, passwordGUID, false,'custgrp_settings');
	form.addSubmitButton('Submit');
	return form;
	
}


function loadUserCredentialRecordByEmployeeId(employeeId){
	var filters = [new nlobjSearchFilter('custrecord_pp_av_employee', null, 'anyof', employeeId)];
	var searchResults = nlapiSearchRecord('customrecord_pp_av_user_credentials',null,filters,null);
	if(searchResults){
		return nlapiLoadRecord('customrecord_pp_av_user_credentials', searchResults[0].getId());
	}
	return null;
}
