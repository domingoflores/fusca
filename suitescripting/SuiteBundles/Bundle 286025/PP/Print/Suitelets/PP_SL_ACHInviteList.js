/**
 * Display a list of ACH Invites. The invites can be cancelled.
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Feb 2014     maxm
 *
 */

function suitelet(request, response){
	
	if(request.getMethod() == 'POST'){
		var context = nlapiGetContext();
		var action = request.getParameter('custpage_action');
		var achInviteId = parseInt(request.getParameter('custpage_ach_invite_id'));
		
		if(Number.NaN == achInviteId){
			throw "custpage_ach_invite_id must be a integer value";
		}
		
		if(achInviteId){
			if(action == 'cancel'){
				// Expire job, delete job or add cancelled flag?
				nlapiSubmitField('customrecord_pp_ach_invites', achInviteId, ['custrecord_pp_ach_inv_is_cancelled','custrecord_pp_ach_inv_cancel_message'], ['T','Cancelled by sender']);
			}
			else{
				throw "Invalid action passed.";
			}
		}
		// Redirect after post so user can refresh page without reposting
		return nlapiSetRedirectURL('SUITELET', context.getScriptId(), context.getDeploymentId());
	}
	else{
		var form = nlapiCreateForm('ACH Invites');
		form.addPageLink('breadcrumb', 'New Invite', nlapiResolveURL('SUITELET', 'customscript_pp_sl_ach_invite', 'customdeploy_pp_sl_ach_invite'))
		
		
		form.addField('custpage_action', 'text').setDisplayType('hidden');
		form.addField('custpage_ach_invite_id', 'text').setDisplayType('hidden');
		
		addOpenSublist(form)
		addClosedSublist(form);
		
		form.setScript('customscript_pp_cs_ach_invite_list');
		
		response.writePage(form);
	}
}

/**
 * Add open sublist
 * 
 * @param {nlobjForm} form
 */
function addOpenSublist(form){
	var sublist = setupSublist(form,'Open Invites','open');
	var filters = [];
	var expiredFilter = new nlobjSearchFilter('formulanumeric',null,'equalto','0');
	expiredFilter.setFormula("CASE WHEN {custrecord_pp_ach_inv_expires} < {now} THEN 1 ELSE 0 END");
	filters.push(expiredFilter);
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_inv_is_redeemed',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_inv_is_cancelled',null,'is','F'));
		
	var searchResults = executeSearch(filters);
	writeToSublist(sublist,searchResults);
}

/**
 * Add closed sublist
 * 
 * @param {nlobjForm} form
 */
function addClosedSublist(form){
	var sublist = setupSublist(form,'Closed Invites','closed');
	var filterExp = [['formulanumeric:CASE WHEN {custrecord_pp_ach_inv_expires} < {now} THEN 1 ELSE 0 END','equalto','1'],
	                 'or',
	                 ['custrecord_pp_ach_inv_is_redeemed','is','T'],
	                 'or',
	                 ['custrecord_pp_ach_inv_is_cancelled','is','T']
	                 ];
		
	var searchResults = executeSearch(filterExp);
	writeToSublist(sublist,searchResults);
}


/**
 * Loops through each searchResult and writes rows to sublist
 * 
 * @param {nlobjSublist} sublist
 * @param {nlobjSearchResult[]} searchResults
 */
function writeToSublist(sublist,searchResults){
	var context = nlapiGetContext();
	var url = nlapiResolveURL('SUITELET', context.getScriptId(), context.getDeploymentId());
	
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var searchResult = searchResults[i];
			
			var inviteStatus = '';
			
			if(searchResult.getValue('custrecord_pp_ach_inv_is_redeemed') == 'T'){
				inviteStatus = 'Redeemed';
			}
			else if(searchResult.getValue('custrecord_pp_ach_inv_is_cancelled') == 'T'){
				inviteStatus = searchResult.getValue('custrecord_pp_ach_inv_cancel_message');
			}
			else if(searchResult.getValue('formulanumeric') == "1"){
				inviteStatus = 'Expired';
			}
			else{
				inviteStatus = 'Open';
			}
			
			
			sublist.setLineItemValue('entity', i+1, searchResult.getText('custrecord_pp_ach_inv_entity'));
			sublist.setLineItemValue('status', i+1, inviteStatus);
			sublist.setLineItemValue('created', i+1, searchResult.getValue('created'));
			sublist.setLineItemValue('expires_on', i+1, searchResult.getValue('custrecord_pp_ach_inv_expires'));
			sublist.setLineItemValue('is_redeemed', i+1, searchResult.getValue('custrecord_pp_ach_inv_is_redeemed'));
			sublist.setLineItemValue('redeemed_on', i+1, searchResult.getValue('custrecord_pp_ach_inv_redeemed_on'));
			sublist.setLineItemValue('is_cancelled', i+1, searchResult.getValue('custrecord_pp_ach_inv_is_cancelled'));
			
			
			var links = [];
			var html = '';
			
			// show cancel if open
			if(inviteStatus == 'Open'){
				links.push('<a href="javascript:submitAction(\''+ searchResult.getId() + '\',\'cancel\')">Cancel</a>');
			}

			html = links.join(' | ');
			sublist.setLineItemValue('actions', i+1, html);
		}
	}
}

/**
 * Create and return the sublist
 * 
 * @param {nlobjForm} form
 * @return {nlobjSublist}
 */
function setupSublist(form,title,postfix){
	var sublist = form.addSubList('custpage_ach_invite_list_' + postfix, 'list', title);
	
	//sublist.addField('details', 'text', 'Job Details');
	sublist.addField('entity', 'text', 'Entity');
	sublist.addField('status', 'text', 'Status');
	sublist.addField('created', 'text', 'Created');
	sublist.addField('expires_on', 'text', 'Expires On');
	sublist.addField('is_redeemed', 'text', 'Is Redeemed');
	sublist.addField('redeemed_on', 'text', 'Redeemed On');
	sublist.addField('is_cancelled', 'text', 'Is Cancelled');
	
	sublist.addField('actions', 'text', 'Actions');
	//sublist.addRefreshButton();
	
	return sublist;
}

/**
 * Find all Print Status records that might be hung up.
 * 
 * @return {nlobjSearchResult[]}
 */
function executeSearch(filters){
	var columns = [];
	
	// find all where job status is not Fail or Complete with set
	//filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Fail'));
	
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_entity'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_expires'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_is_redeemed'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_redeemed_on'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_is_cancelled'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ach_inv_cancel_message'));
	
	var expiredColumn = new nlobjSearchColumn('formulanumeric',null);
	expiredColumn.setFormula("CASE WHEN {custrecord_pp_ach_inv_expires} < {now} THEN 1 ELSE 0 END");
	columns.push(expiredColumn);
	
	var createdCol = new nlobjSearchColumn('created');
	createdCol.setSort(true);
	columns.push(createdCol);
	
	return nlapiSearchRecord('customrecord_pp_ach_invites', null, filters, columns);
}