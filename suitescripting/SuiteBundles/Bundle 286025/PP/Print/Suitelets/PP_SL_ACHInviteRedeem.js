/**
 * This Suitelet displays a form for redeeming ACH invites, redeems and cancels ACH invites when posted to.
 * 
 * This Suitelet is available without login. A valid ACH invite token must be passed as a url parameter in order to 
 * view the form.
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Feb 2014     maxm
 *
 */


var validTransactionCodes = ['Checking','Savings'];

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	
		var token = request.getParameter('token');
		var form = nlapiCreateForm('ACH Entry Form', false);
		
		if(!token || !token.match(/^[0-9A-F]+$/i)){
			throw nlapiCreateError('ACH_INVITE_TOKEN_NOT_FOUND', 'This url could not be found.', true);
		}
		
		var achInviteSr = findACHInviteRecordByToken(token);
		if(!achInviteSr){
			throw nlapiCreateError('ACH_INVITE_TOKEN_NOT_FOUND', 'This url could not be found.', true);
		}
		else if(achInviteSr.getValue('formulanumeric') == 1){
			throw nlapiCreateError('ACH_INVITE_TOKEN_EXPIRED', 'This url has expired.', true);
		}
		else if(achInviteSr.getValue('custrecord_pp_ach_inv_is_redeemed') == 'T'){
			throw nlapiCreateError('ACH_INVITE_TOKEN_ALREADY_REDEAMED', 'This token has already been redeemed.', true);
		}
		else if(achInviteSr.getValue('custrecord_pp_ach_inv_is_cancelled') == 'T'){
			throw nlapiCreateError('ACH_INVITE_CANCELLED', 'This invite has been cancelled.', true);
		}
		
	    if(request.getMethod() == 'POST'){
	    	// cancel invite if user declines
	    	var cancel = request.getParameter('custpage_cancel');
	    	if(cancel){
	    		nlapiSubmitField('customrecord_pp_ach_invites', achInviteSr.getId(), ['custrecord_pp_ach_inv_is_cancelled','custrecord_pp_ach_inv_cancel_message'], ['T','Declined by user']);
	    		renderThankyouPage('Thank you. Your invite was cancelled.');
	    		return;
	    	}
	    	
	    	//TODO: validate and sanitize every field possible
	    	var entityFields = getEntityFields(achInviteSr.getValue('custrecord_pp_ach_inv_entity'));
	    	
	    	//create record
	    	var rec = nlapiCreateRecord('customrecord_pp_ach_account',{recordmode: 'dynamic'});
	    	
	    	//set fields
	    	rec.setFieldValue('name',achInviteSr.getText('custrecord_pp_ach_inv_entity'));
	    	rec.setFieldValue('custrecord_pp_ach_entity',achInviteSr.getValue('custrecord_pp_ach_inv_entity'));
	    	rec.setFieldValue('custrecord_pp_ach_account_number',request.getParameter('custrecord_pp_ach_account_number'));
	    	rec.setFieldValue('custrecord_pp_ach_routing_number',request.getParameter('custrecord_pp_ach_routing_number'));
	    	rec.setFieldValue('custrecord_pp_ach_sec_code',achInviteSr.getValue('custrecord_pp_ach_inv_sec_code'));
	    	rec.setFieldValue('custrecord_pp_ach_deposit_withdrawal',achInviteSr.getValue('custrecord_pp_ach_inv_deposit_withdrawal') || 1);
	    	rec.setFieldValue('custrecord_pp_ach_is_primary', 'T');
	    	
	    	if(validTransactionCodes.indexOf(request.getParameter('custrecord_pp_ach_transaction_code')) == -1){
	    		throw nlapiCreateError('ACH_INVITE_INVALID_TRANSACTION_CODE', 'Invalid transaction code passed. Must be Checking or Savings', true);
	    	}
	    	
	    	var transactionCode = request.getParameter('custrecord_pp_ach_transaction_code');
	    	if(nlapiGetContext().getSetting('SCRIPT','custscript_pp_ach_inv_prenote') == 'T'){
	    		transactionCode = transactionCode + ' Prenote';
	    	}
	    	rec.setFieldText('custrecord_pp_ach_transaction_code',transactionCode);
	    	rec.setFieldValue('custrecord_pp_ach_payee_email',request.getParameter('custrecord_pp_ach_payee_email'));
	    	
	    	try{
	    		// save new record
	    		nlapiSubmitRecord(rec, true, false);
	    		//redeem ach invite
		    	redeemACHInvite(achInviteSr.getId());
		    	//enable ach for entity
		    	var entityRec = nlapiLoadRecord(entityFields.recordType , entityFields.getId());
				entityRec.setFieldValue('custentity_pp_ach_enabled', 'T');
				nlapiSubmitRecord(entityRec, false, false);
	    	}
	    	catch(e){
	    		//form.addField('custpage_error','label',e);
	    		response.write(e);
	    	}
	    	
	    	renderThankyouPage('Thank you. Your ACH information has been successfully recorded.');
	    }
	    else{
	    	// show form
	    	var context = nlapiGetContext();
	    	var entityFields = getEntityFields(achInviteSr.getValue('custrecord_pp_ach_inv_entity'));
	    	var source = getTemplate('ach_invite_tmp.html');
	    	
	    	var htmlUserMessage = context.getSetting('SCRIPT','custscript_pp_ach_inv_redeem_form_msg') || '';
	    	htmlUserMessage = htmlUserMessage.replace(/&gt;/g, '>');
	    	htmlUserMessage = htmlUserMessage.replace(/&lt;/g, '<');
	    	
	    	var template = Handlebars.compile(source);
	    	var templateContext = {
	    			token: token, 
	    			email: entityFields.getValue('email'),
	    			userMessage: htmlUserMessage
	    	};
	    
	    	var logoUrl = getLogoUrl();
	    	if(logoUrl){
	    		templateContext.logoUrl = logoUrl;
	    	}
	    	var html = template(templateContext);
	    	
	    	response.write(html);
	    }
}

/**
 * Get logo url from company preferences.
 * Returns null if not found.
 *
 * @returns {string} url
 */
function getLogoUrl(){
	var context = nlapiGetContext();
	
	var logoValue = context.getSetting('SCRIPT','custscript_pp_ach_inv_logo') || '';
	var logoUrl = null;
	if(logoValue){
		if(!isNaN(parseInt(logoValue))){
			var logoFile = nlapiLoadFile(logoValue);
	    	logoUrl = logoFile.getURL();
		}
		else{
			logoUrl = logoValue;
		}
	}
	return logoUrl;
}

/**
 * Renders a thankyou page with the given message
 * 
 * @param message
 */
function renderThankyouPage(message){
	var source = getTemplate('ach_invite_thankyou_tmp.html');
	var template = Handlebars.compile(source);
	var templateContext = {message: message};
	
	var logoUrl = getLogoUrl();
	if(logoUrl){
		templateContext.logoUrl = logoUrl;
	}
	
	var html = template(templateContext);
	
	response.write(html);
}

/**
 * Get email and type of entity that is redeeming the ACH invite
 * 
 * @param entityInternalId
 * @returns {nlobjSearchResult}
 */
function getEntityFields(entityInternalId){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('internalid',null,'anyof',[entityInternalId]));
	
	columns.push(new nlobjSearchColumn('email'));
	columns.push(new nlobjSearchColumn('type'));
	
	var searchResults = nlapiSearchRecord('entity', null, filters, columns);
	if(searchResults){
		return searchResults[0];
	}
	return null;
}

/**
 * Find and return template file content by filename
 * 
 * @param filename
 * @returns
 */
function getTemplate(filename){
	var filters = [];
	
	filters.push(new nlobjSearchFilter('name',null,'is',filename));
	var sr = nlapiSearchRecord('file',null,filters,null);
	if(sr){
		var f = nlapiLoadFile(sr[0].getId());
		return f.getValue();
	}
	return null;
}

/**
 * Finds ACH invite record by token. 
 * An expired flag is returned in the formulanumeric column
 * 
 * @param {string} token
 * @returns {nlobjSearchResult} 
 */
function findACHInviteRecordByToken(token){
		var filters = [];
		var columns = [];
		
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_is_redeemed'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_entity'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_sec_code'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_is_cancelled'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_deposit_withdrawal'));
		
		var expiredColumn = new nlobjSearchColumn('formulanumeric',null);
		expiredColumn.setFormula("CASE WHEN {custrecord_pp_ach_inv_expires} < {now} THEN 1 ELSE 0 END");
		columns.push(expiredColumn);
		
		filters.push(new nlobjSearchFilter('custrecord_pp_ach_inv_token',null,'is',token));
	    
		var sr = nlapiSearchRecord('customrecord_pp_ach_invites', null, filters, columns);
		if(!sr){
			return null;
		}
		else{
			return sr[0];
		}
}

function redeemACHInvite(recId){
	nlapiSubmitField('customrecord_pp_ach_invites', recId, ['custrecord_pp_ach_inv_is_redeemed','custrecord_pp_ach_inv_redeemed_on'], ['T',nlapiDateToString(new Date(), 'datetimetz')], false);
}
