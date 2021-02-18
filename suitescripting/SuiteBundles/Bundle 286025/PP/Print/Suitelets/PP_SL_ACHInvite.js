/**
 * Create and send ACH invite emails to vendors, customers and employees
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Jan 2014     maxm
 *
 */

var emailTemplateSuiteletUrl;
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	var context = nlapiGetContext();
	if(request.getMethod() == 'GET'){
		var entityType = request.getParameter('entitytype');
		if(!entityType){
			// display the entity type list
			var baseUrl = nlapiResolveURL('SUITELET', context.getScriptId(), context.getDeploymentId());
			
			var list = nlapiCreateList('AvidXchange ACH Invite', false);
			
			list.addColumn('entitytype', 'text', 'Entity Type');
			
			list.addRow({'entitytype': '<a href="'+baseUrl + '&entitytype=customer'+'">Customers</a>'});
			list.addRow({'entitytype': '<a href="'+baseUrl + '&entitytype=employee'+'">Employees</a>'});
			list.addRow({'entitytype': '<a href="'+baseUrl + '&entitytype=vendor'+'">Vendors</a>'});
			
			list.addPageLink('breadcrumb', 'Invite List', nlapiResolveURL('SUITELET', 'customscript_pp_sl_ach_invite_list', 'customdeploy_pp_sl_ach_invite_list'));
			
			response.writePage(list);
		}
		else{
			// display ach invite form
			var form = nlapiCreateForm('AvidXchange ACH Invites', false);
			form.addPageLink('breadcrumb', 'Invite List', nlapiResolveURL('SUITELET', 'customscript_pp_sl_ach_invite_list', 'customdeploy_pp_sl_ach_invite_list'));
			
			var entitySelect;
			
			switch(entityType){
				case 'customer':
					entitySelect = form.addField('custpage_customers','multiselect','Customers','customer');
					break;
				case 'employee':
					entitySelect = form.addField('custpage_employees','multiselect','Employees','employee');
					break;
				case 'vendor':
					entitySelect = form.addField('custpage_vendors','multiselect','Vendors','vendor');
					break;
				default:
					throw nlapiCreateError('INVALID_ENTITY_TYPE', 'An invalid entity type was selected', true);
					break;
			}
			entitySelect.setMandatory(true);
			
			var templateSelect = form.addField('custpage_email_template','select','Email Template','emailtemplate');
			templateSelect.setMandatory(true);
			templateSelect.setDefaultValue(context.getSetting('SCRIPT','custscript_pp_ach_inv_email_template'));
			
			var secCodeSelect = form.addField('custpage_sec_code','select','SEC Code','customlist_pp_ach_sec_code');
			secCodeSelect.setMandatory(true);
			
			var depWithSelect = form.addField('custpage_deposit_withdrawal','select','Deposit or Withdrawal','customlist_pp_ach_deposit_withdrawal');
			depWithSelect.setMandatory(true);
			depWithSelect.setDefaultValue('1');
			if(context.getSetting('SCRIPT','custscript_pp_enable_wach') != 'T'){
				depWithSelect.setDisplayType('hidden');
			}
			
			var entityTypeField = form.addField('entitytype','text','Entity Type');
			entityTypeField.setDefaultValue(entityType);
			entityTypeField.setDisplayType('hidden');
			
			form.addSubmitButton('Submit');
			response.writePage(form);
		}	
		
	}
	else{
		//POST - Create and send off ACH invites
		var form = nlapiCreateForm('AvidXchange ACH Invites', false);
		var entityType = request.getParameter('entitytype');
		
		var sendFromEmployeeId = context.getSetting('SCRIPT','custscript_pp_ach_inv_employee_send_from');
		if(!sendFromEmployeeId){
			throw nlapiCreateError('NO_SEND_FROM_EMPLOYEE_SET', 'No send from employee set for ACH invite email. Please go to AvidXchange -> Setup -> Preferences and choose an employee to send emails from.', true);
		}
		else if(!sendFromEmployeeOkay(sendFromEmployeeId)){
			throw nlapiCreateError('SEND_FROM_EMPLOYEE_EMAIL_IS_BLANK', 'The employee setup to send ACH invites from has a blank email address.', true);
		}

		var entityIds = [];

		switch(entityType){
		case 'customer':
			entityIds = request.getParameterValues('custpage_customers') || [];
			break;
		case 'employee':
			entityIds = request.getParameterValues('custpage_employees') || [];
			break;
		case 'vendor':
			entityIds = request.getParameterValues('custpage_vendors') || [];
			break;
		default:
			throw nlapiCreateError('INVALID_ENTITY_TYPE', 'An invalid entity type was selected', true);
			break;
		}
		
		if(entityIds.length == 0){
			throw nlapiCreateError('NO_ENTITIES_SELECTED', 'No entities were selected', true);
		}
		
		var emailTemplateId = request.getParameter('custpage_email_template');
		if(!emailTemplateId){
			throw nlapiCreateError('NO_EMAIL_TEMPLATE_SELECTED', 'No email template was selected', true);
		}
		
		// Save the ach inv template user preference
		var userPrefs = nlapiLoadConfiguration('userpreferences');
		userPrefs.setFieldValue('custscript_pp_ach_inv_email_template', emailTemplateId);
		nlapiSubmitConfiguration(userPrefs);
		
		var baseUrl = nlapiResolveURL('SUITELET','customscript_pp_ach_invite_redeem','customdeploy_pp_ach_invite_redeem',true);
		var entitySearchResults = entitySearch(entityIds);
		var existingInvitesMap = findExistingInvites(entityIds);
		var entitiesWithoutEmail = [];
		var numInvitesSent = 0;
		var emailTemplateRec = nlapiLoadRecord('emailtemplate', emailTemplateId);
		var templateVersion = emailTemplateRec.getFieldValue('templateversion');
		var subject = emailTemplateRec.getFieldValue('subject');
		
		for(var i = 0; i < entitySearchResults.length; i++){ // 26 units per loop
			nlapiLogExecution('AUDIT', 'Usage before: ',context.getRemainingUsage());
			try{
				var entitySearchResult = entitySearchResults[i];
				var entityId = entitySearchResult.getId();
				
				// can't send invite if entity does not have an email set
				if(entitySearchResult.getValue('email') == ''){
					entitiesWithoutEmail.push(entitySearchResult);
					continue;
				}
				
				var token;
				// ach invite already exists, resend invite with existing token
				if(entityId in existingInvitesMap){
					token = existingInvitesMap[entityId].getValue('custrecord_pp_ach_inv_token');
					updateACHInviteRecord(existingInvitesMap[entityId].getId(), request.getParameter('custpage_sec_code'), 30, request.getParameter('custpage_deposit_withdrawal'));
				}
				else{
					// create ACH invite token record
					token = createACHInviteRecord(entityId,request.getParameter('custpage_sec_code'),30,request.getParameter('custpage_deposit_withdrawal'));
				}
				
				var emailBody = '';
				var linkUrl = baseUrl + '&token=' + encodeURIComponent(token); 
				// CRMSDK templates have been deprecated and scheduled to be removed in 2015
				if(templateVersion == 'CRMSDK'){
					var extraFields = {nllink : linkUrl, nltoken : token};
					var mailMerge = nlapiMergeRecord(emailTemplateId,entityType,entityId, null, null, extraFields); // 10 units
					emailBody = mailMerge.getValue();
				}
				else{
					var emailMerger = nlapiCreateEmailMerger(emailTemplateId);
					emailMerger.setEntity(entityType,entityId);
					var mergeResult = emailMerger.merge(); // 20 units
					emailBody = mergeResult.getBody();

					emailBody = emailBody.replace(/<NLLINK>/i,linkUrl);
					emailBody = emailBody.replace(/<NLTOKEN>/i,token);
					// < and > get HTML encoded when using the template editor
					emailBody = emailBody.replace(/&lt;NLLINK&gt;/i,linkUrl);
					emailBody = emailBody.replace(/&lt;NLTOKEN&gt;/i,token);
					
					subject =  mergeResult.getSubject()
				}
				// generate and send off email
				nlapiSendEmail(sendFromEmployeeId, entitySearchResult.getValue('email'),subject, emailBody); // 10 units
				
				numInvitesSent++;
			}
			catch(e){
				nlapiLogExecution('ERROR', 'error', e);
			}
			nlapiLogExecution('AUDIT', 'Usage after: ',context.getRemainingUsage());
		}

		// Display result to user
		var output = numInvitesSent + ' out of ' + entitySearchResults.length + ' ACH invites were sent';
		if(entitiesWithoutEmail.length > 0){
			output += '<br/><br/>The following '+entityType+'s do not have an email set and did not get sent emails:<br/>';
			for(var i = 0; i < entitiesWithoutEmail.length; i++){
				var entitySearchResult = entitiesWithoutEmail[i];
				output += '<br/>' + entitySearchResult.getValue('entityid');
			}
		}
		form.addField('custpage_output', 'inlineHTML', 'Result').setDefaultValue(output);
		
		form.addPageLink('breadcrumb', 'Invite List', nlapiResolveURL('SUITELET', 'customscript_pp_sl_ach_invite_list', 'customdeploy_pp_sl_ach_invite_list'));
		
		response.writePage(form);
	}	
}


/**
 * Find all open existing ACH invites for a given set of entities
 * 
 * @param {Array} entityInternalIds
 * @returns {Object} Hash of entityInternalIds to customrecord_pp_ach_invites searchResults
 */
function findExistingInvites(entityInternalIds){
	var returnObj = {};
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_inv_entity', null, 'anyof', entityInternalIds));
	var expiredFilter = new nlobjSearchFilter('formulanumeric',null,'equalto','0');
	expiredFilter.setFormula("CASE WHEN {custrecord_pp_ach_inv_expires} < {now} THEN 1 ELSE 0 END");
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_inv_is_redeemed',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_inv_is_cancelled',null,'is','F'));
	
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_entity'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_token'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_sec_code'));
	
	var searchResults = nlapiSearchRecord('customrecord_pp_ach_invites', null, filters, columns) || [];
	for(var i = 0; i < searchResults.length; i++){
		var searchResult = searchResults[i];
		
		returnObj[searchResult.getValue('custrecord_pp_ach_inv_entity')] = searchResult;
	}
	return returnObj;
}

function entitySearch(ids){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
	
	columns.push(new nlobjSearchColumn('email', null));
	columns.push(new nlobjSearchColumn('type', null));
	columns.push(new nlobjSearchColumn('entityid', null));
	
	return nlapiSearchRecord('entity',null,filters,columns);
}

/**
 * Creates a new ACHInvite record and returns the unique token for it.
 * 
 * @param {string} entityId
 * @param {Number} secCode
 * @param {Number} daysUntillExpired - *optional, defaults to 30
 * @returns {string} token
 */
function createACHInviteRecord(entityId, secCode, daysUntilExpired, depositOrWithdrawal){
	var token = genGuid();
	var expDate = new Date();
	if(typeof daysUntilExpired == 'undefined'){
		daysUntilExpired = 30;
	}
	expDate.setDate(expDate.getDate() + daysUntilExpired);
	
	var rec = nlapiCreateRecord('customrecord_pp_ach_invites');
	rec.setFieldValue('custrecord_pp_ach_inv_entity', entityId);
	rec.setFieldValue('custrecord_pp_ach_inv_token', token);
	rec.setFieldValue('custrecord_pp_ach_inv_sec_code', secCode);
	rec.setFieldValue('custrecord_pp_ach_inv_expires',nlapiDateToString(expDate, 'datetimetz'));
	rec.setFieldValue('custrecord_pp_ach_inv_deposit_withdrawal', depositOrWithdrawal);
	nlapiSubmitRecord(rec);
	return token;
}

/**
 * Update existing ACHInvite record
 * 
 * @param {string} entityId
 * @param {Number} secCode
 * @param {Number} daysUntillExpired - *optional, defaults to 30
 * @returns {Number} achInviteId
 */
function updateACHInviteRecord(achInviteId, secCode, daysUntilExpired,depositOrWithdrawal){
	var expDate = new Date();
	if(typeof daysUntilExpired == 'undefined'){
		daysUntilExpired = 30;
	}
	expDate.setDate(expDate.getDate() + daysUntilExpired);
	
	var rec = nlapiLoadRecord('customrecord_pp_ach_invites', achInviteId);
	rec.setFieldValue('custrecord_pp_ach_inv_sec_code', secCode);
	rec.setFieldValue('custrecord_pp_ach_inv_expires',nlapiDateToString(expDate, 'datetimetz'));
	rec.setFieldValue('custrecord_pp_ach_inv_deposit_withdrawal', depositOrWithdrawal);
	return nlapiSubmitRecord(rec);
}


/**
 * Generate unique token
 * 
 * @returns {string}
 */
function genGuid(){
	return 'xxxxxxxxxxxxxxyxx66yxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
}


/**
 * Check if employee record that ach invites are sent from is setup(email is set)
 * 
 * @param id  - internal id of employee
 * @returns {Boolean}
 */
function sendFromEmployeeOkay(id){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', id));
	filters.push(new nlobjSearchFilter('email', null, 'isnotempty'));
	
	if(nlapiSearchRecord('entity',null,filters,columns)){
		return true;
	}
	else{
		return false;
	}
}
