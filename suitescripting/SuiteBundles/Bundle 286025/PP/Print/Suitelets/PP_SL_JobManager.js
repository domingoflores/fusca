/**
 * Allow users to resolve jobs that did not complete or fail. 
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Dec 2013     maxm
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
var context = nlapiGetContext();
var spsEnabled = context.getSetting('SCRIPT', 'custscript_enable_sps') == 'T' ? true : false;

function suitelet(request, response){	
	
	if(request.getMethod() == 'POST'){
		var action = request.getParameter('custpage_action');
		var printStatusId = parseInt(request.getParameter('custpage_printstatusid'));
		
		if(Number.NaN == printStatusId){
			throw "custpage_printstatusid must be a integer value";
		}
		
		if(printStatusId){
			if(action == 'cancel'){
				// Fail job as user cancelled
				nlapiSubmitField('customrecord_pp_print_status', printStatusId, ['custrecord_pp_ps_status','custrecord_pp_ps_statusmsg'], ['Fail','Cancelled by user']);
			}
			else if(action == 'setprinted'){
				nlapiSubmitField('customrecord_pp_print_status', printStatusId, 'custrecord_pp_ps_status', 'Pending Set As Printed');
				nlapiScheduleScript("customscript_pp_ss_print_status_update", "customdeploy_pp_ss_print_status_update",{"custscript_jobid": printStatusId});
			}
			else{
				throw "Invalid action passed.";
			}
		}
		// Redirect after post so user can refresh page without reposting
		return nlapiSetRedirectURL('SUITELET', context.getScriptId(), context.getDeploymentId());
	}
	else{
		var searchResults = executeSearch();
		
		var form = nlapiCreateForm('Job Manager');
		form.addField('custpage_action', 'text').setDisplayType('hidden');
		form.addField('custpage_printstatusid', 'text').setDisplayType('hidden');
		
		var instructions = 'The job manager allows you to cancel or complete jobs that are stuck. If a job has been running for over an hour there is a good chance that it is never going to finish.';
		instructions += '<br/><br/>';
		instructions += '<ul><li>Pressing "Cancel" will mark the job as failed and release the payments in the job to be printed again.</li>';
		instructions += '<li>  Pressing "Mark Items As Printed" will set the Job to "Pending Set As Printed" and will schedule the payments in that job to be marked as "Printed".  You should only use the "Mark Items As Printed" link if you can identify the job in the Pending Downloads screen(AvidXchange -&gt; Payments -&gt; Self-Managed then click the Pending Downloads link), and the file is valid.</li></ul>';
		
		var instructionsField = form.addField('custpage_intructions','inlinehtml');
		instructionsField.setDefaultValue(instructions);
		instructionsField.setLayoutType('outsideabove');
		
		form.setScript('customscript_pp_cs_job_manager');
		
		var sublist = setupSublist(form);
		
		writeToSublist(sublist,searchResults)
		response.writePage(form);
	}
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
			
			sublist.setLineItemValue('jobid', i+1, searchResult.getValue('custrecord_pp_ps_jobid'));
			sublist.setLineItemValue('status', i+1, searchResult.getValue('custrecord_pp_ps_status'));
			
			if(spsEnabled){
				sublist.setLineItemValue('sps', i+1, searchResult.getValue('custrecord_pp_ss_sps') == 'T' ? '&#10003;' : '');
			}
			
			var links = [];
			var html = '';
			
			// show cancel if status is not pending set as printed
			if(!(searchResult.getValue('custrecord_pp_ps_status') == 'Pending Set As Printed')){
				links.push('<a href="javascript:submitAction(\''+ searchResult.getId() + '\',\'cancel\')">Cancel</a>');
			}
			
			if(searchResult.getValue('custrecord_pp_ps_status') == 'Processing' || searchResult.getValue('custrecord_pp_ps_status') == 'Pending Set As Printed'){
				links.push('<a href="javascript:submitAction(\''+ searchResult.getId() + '\',\'setprinted\')">Mark Items As Printed</a>');
			}
			
			html = links.join(' | ');
			sublist.setLineItemValue('actions', i+1, html);
			sublist.setLineItemValue('details', i+1, '<a href="#" onclick="showIds('+searchResult.getId()+')">View details</a>');
			sublist.setLineItemValue('created', i+1, searchResult.getValue('created'));
		}
	}
}

/**
 * Create and return the sublist
 * 
 * @param {nlobjForm} form
 * @return {nlobjSublist}
 */
function setupSublist(form){
	var sublist = form.addSubList('custpage_jobslist', 'staticlist', 'Jobs');
	
	sublist.addField('details', 'text', 'Job Details');
	sublist.addField('jobid', 'text', 'Job ID');
	sublist.addField('status', 'text', 'Status');
	if(spsEnabled){
		sublist.addField('sps', 'text', 'Is SPS');
	}
	sublist.addField('created', 'text', 'Created');
	sublist.addField('actions', 'text', 'Actions');
	sublist.addRefreshButton();
	
	return sublist;
}

/**
 * Find all Print Status records that might be hung up.
 * 
 * @return {nlobjSearchResult[]}
 */
function executeSearch(){
	var filters = [];
	var columns = [];
	
	// find all where job status is not Fail or Complete with set
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Fail'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Complete'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnotempty'));
	
	columns.push(new nlobjSearchColumn('custrecord_pp_ps_status'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ps_jobid'));
	columns.push(new nlobjSearchColumn('custrecord_pp_ss_sps'));
	var createdCol = new nlobjSearchColumn('created');
	createdCol.setSort(true);
	columns.push(createdCol);
	
	return nlapiSearchRecord('customrecord_pp_print_status', null, filters, columns);
}