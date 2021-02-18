/**
 * Processes requests for payment approval or rejection.
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Sep 2012     Eric Grubaugh
 *
 */

/**
 * Processes requests for payment approval or rejection. The request object is expected to contain
 * two parameters for processing:
 * <ol>
 * <li>
 * 	paymentIds : {string} A comma-separated string containing the internal IDs of the records to
 *  be processed. If the client passes a normal Javascript string Array as the parameter value, it
 *  will come across in the correct format.
 * </li>
 * <li>action : {string} A string describing the action to be taken. Possible values are:
 * <ul>
 * 	<li>APPROVE - approve the provided records.</li>
 * 	<li>REJECT - reject the provided records.</li>
 * 	<li>KICKBACK - send the provided records down one approval level.</li>
 * </ul>
 * </ol>
 * 
 * Governance: 20 + (22 x number payment approved)
 * 
 * @param {nlobjRequest} request - Request object
 * @param {nlobjResponse} response - Response object
 * @returns {Void} Any output is written via response object
 */
var context = nlapiGetContext();

// TODO Add governance information to comment
function suitelet(request, response) {
	var paymentIds = request.getParameter('paymentIds'); 
	if(paymentIds){
		paymentIds = paymentIds.split(',');
	}

	var requestType = request.getParameter('action'),
		reason = request.getParameter('reason'),
		search = {},
		results = [],
		show = true,
		where = 'CAC Approval Processing';

	afnLog(show, where, 'Executing Approval processing...');
	
	// Ensure correct request parameters exist
	if (paymentIds && requestType) {
		afnLog(show, where, 'IDs and Request Type parameters found.');
		
		// Create and execute transaction search
		search = createSearch(paymentIds);
		
		afnLog(show, where, 'Searching...');
		
		results = nlapiSearchRecord(search['recordType'], null,
				search['filters'], search['columns']);
		
		// nlapiSearchRecord could set results to null if no results match
		if (results) {
			updateStatus(requestType, results, response, reason);
		} else {
			afnLog(show, where, 'No results to update.');
		}
	} else {
		afnLog(show, where, "'paymentIds' or 'action' not found in request parameters.");
		response.setHeader(CAC_STATUS_RESPONSE_HEADER, 'ERROR');
		response.setHeader(CAC_ERROR_MESSAGE_RESPONSE_HEADER,
				"'paymentIds' or 'action' not found in request parameters.");
	}
}

/**
 * Defines search criteria and executes query on transaction records.
 * 
 * @param {nlobjRequest} ids - An array of internal IDs for records to approve or reject.
 * @returns {cacSearch} A Search object defining columns and filters ready to
 * 		be executed against transaction records. The object has the structure:
<pre><code>
{
	recordType : {string},
	filters : {nlobjSearchFilter[]},
	columns : {nlobjSearchColumn[]}
}
</code></pre>
 * @private
 */
function createSearch(ids) {
	var columns = [],
		filters = [];

	// Set up filter conditions
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));

	// Set up result columns
	columns.push(new nlobjSearchColumn('tranid'));
	columns.push(new nlobjSearchColumn('recordtype'));
	columns.push(new nlobjSearchColumn('entity'));
	columns.push(new nlobjSearchColumn('total'));
	columns.push(new nlobjSearchColumn(CAC_COMMENT_FIELD_ID));
	columns.push(new nlobjSearchColumn(CAC_APPROVAL_STATUS_FIELD_ID));
	columns.push(new nlobjSearchColumn(CAC_PREV_APPROVER_FIELD_ID,CAC_APPROVAL_STATUS_FIELD_ID));
	columns.push(new nlobjSearchColumn(CAC_NEXT_APPROVER_FIELD_ID,CAC_APPROVAL_STATUS_FIELD_ID));
	columns.push(new nlobjSearchColumn('custrecord_pp_approval_process',CAC_APPROVAL_STATUS_FIELD_ID));
	columns.push(new nlobjSearchColumn('custbody_pp_override_sig_a'));
	columns.push(new nlobjSearchColumn('custbody_pp_override_sig_b'));
	
	
	
	return {
		'recordType' : 'transaction',
		'filters' : filters,
		'columns' : columns
	};
}

/**
 * Updates the status of the provided Payment
 * 
 * @param requestType {string} - A string describing the action to be taken. Possible values are:
 * <ul>
 * <li>APPROVE - approve the provided records.</li>
 * <li>REJECT - reject the provided records.</li>
 * <li>KICKBACK - send the provided records down one approval level.</li>
 * </ul>
 * @param payments {nlobjSearchResult[]} - The search results on which the approval status is being
 * 		updated
 * @param response {nlobjResponse} - The HTTP response object where output is handled
 * @param reason {string} [optional] - The reason for payment rejection, if this is a rejection
 * 		request.
 * 
 * @return {void}
 */
function updateStatus(requestType, payments, response, reason) {
	var show = true,
	where = 'updateStatus';
	//afnLog(show, where, context.getRemainingUsage() + ' units governance before statusMap');
	// map transactionId to the data necessary to update status (statusId and recordType)
	var statusMap = getStatusMap(requestType, payments);
	var userId = nlapiGetUser();
	
	var approvedStatusIds = PPSLibApprovals.findAllApprovedStatusIds();
	//afnLog(show, where, context.getRemainingUsage() + ' units governance after statusMap');
	
	//afnLog(show, where, JSON.stringify(statusMap));
	
	for(var id in statusMap){
		if(context.getRemainingUsage() < 20){
			break;
		}
		// Update record status
		var fields = [CAC_APPROVAL_STATUS_FIELD_ID,'custbody_pp_override_sig_a','custbody_pp_override_sig_b'];
		var fieldValues = [statusMap[id].statusId,statusMap[id].siga,statusMap[id].sigb];
		 
		if (reason) {
			fields.push(CAC_REJECTION_REASON_FIELD_ID);
			fieldValues.push(reason);
		}
		
		// set is_approved flag if status is an approved status
		if(requestType == 'APPROVE' && approvedStatusIds.indexOf(statusMap[id].statusId) > -1){
			fields.push(CAC_IS_APPROVED_ID);
			fieldValues.push('T');
		}
		
		nlapiSubmitField(statusMap[id].recordType, id,fields,fieldValues);
		
		// if approval, push user to approver stack
		if(requestType == 'APPROVE'){
			var rec = nlapiCreateRecord('customrecord_pp_approver_stack');
			rec.setFieldValue('custrecord_pp_as_transaction', id);
			rec.setFieldValue('custrecord_pp_as_user', userId);
			nlapiSubmitRecord(rec);
		}
		else if(requestType == 'KICKBACK'){
			// pop user from approval stack
			var filters = [];
			var columns = [];
			
			filters.push(new nlobjSearchFilter('custrecord_pp_as_transaction',null,'anyof',[id]));
			
			columns.push(new nlobjSearchColumn('created',null).setSort(true));
			
			var searchResults = nlapiSearchRecord('customrecord_pp_approver_stack',null,filters,columns);
			if(searchResults){
				nlapiDeleteRecord('customrecord_pp_approver_stack', searchResults[0].getId());
			}
		}
		else if(requestType == 'REJECT'){
			// clear the approval stack to make manual update to not rejceted easier
			PPSLibApprovals.clearApproverStack(id);
		}
		
		// write action to approval log
		var rec = nlapiCreateRecord('customrecord_pp_approval_log');
		rec.setFieldValue('custrecord_pp_al_transaction', id);
		rec.setFieldValue('custrecord_pp_al_user', userId);
		rec.setFieldValue('custrecord_pp_al_action', requestType.toLowerCase());
		rec.setFieldValue('custrecord_pp_al_status',statusMap[id].statusId);
		nlapiSubmitRecord(rec);
	}
	//afnLog(show, where, context.getRemainingUsage() + ' units governance used on ' + payments.length + ' payments');
	response.setHeader(CAC_STATUS_RESPONSE_HEADER, 'SUCCESS');
}

/**
 * Finds the status each payment should be set to.
 * Returns an object that maps the paymentId to the next approval status and payment recordType.
 * { 1: {statusId: 3, recordType: 'vendorpayment'} }
 * 
 * 
 * @param requestType
 * @param payments
 * @returns object
 */
function getStatusMap(requestType, payments){
	var statusMap = {},
	resultCount = payments.length,
	show = true,
	where = 'getStatusMap';
	
	if(requestType == 'APPROVE'){
		var userId = nlapiGetUser();
		var userSig = nlapiLookupField('employee', userId, 'custentity_pp_user_signature', true);
		
		// find all next statuses for user
		var filters = [
	       new nlobjSearchFilter(CAC_PREV_APPROVER_FIELD_ID,null,'anyof',PPSLibApprovals.findUsersApprovalGroupIds(userId)),
	       new nlobjSearchFilter('isinactive',null,'is','F')
	    ];
		
		var columns = [
           new nlobjSearchColumn('custrecord_pp_approval_process'),
           new nlobjSearchColumn(CAC_PREV_APPROVER_FIELD_ID)
		];
		
		var approvalStatusResults = nlapiSearchRecord(CAC_APPROVAL_STATUS_RECORD_ID,null,filters,columns);
		
		// find next status for payment and set signatures
		var asrCount = approvalStatusResults.length;
		for(var i = 0; i < resultCount; i++){
			var payment = payments[i];
			var approvalProcessId = payment.getValue('custrecord_pp_approval_process',CAC_APPROVAL_STATUS_FIELD_ID);
			var nextApprovalGroupId = payment.getValue(CAC_NEXT_APPROVER_FIELD_ID,CAC_APPROVAL_STATUS_FIELD_ID);
			for(var j = 0; j < asrCount; j++){
				if(approvalProcessId == approvalStatusResults[j].getValue('custrecord_pp_approval_process') && nextApprovalGroupId == approvalStatusResults[j].getValue(CAC_PREV_APPROVER_FIELD_ID)){
					var siga = payment.getValue('custbody_pp_override_sig_a');
					var sigb = payment.getValue('custbody_pp_override_sig_b');
					
					if(userSig != ''){
						sigb = siga;
						siga = userSig;
					}
					
					statusMap[payment.getId()] = {
							statusId : approvalStatusResults[j].getId(), 
							recordType: payment.getValue('recordtype'),
							siga : siga,
							sigb : sigb
					};
					break;
				}
			}
		}
	}
	else if(requestType == 'KICKBACK'){
		var arrayUnique = function(a) {
		    return a.reduce(function(p, c) {
		        if (p.indexOf(c) < 0) p.push(c);
		        return p;
		    }, []);
		};
		// collect all prev approval groups
		var prevGroups = [];
		for(var i = 0; i < resultCount; i++){
			prevGroups.push(payments[i].getValue(CAC_PREV_APPROVER_FIELD_ID,CAC_APPROVAL_STATUS_FIELD_ID));
		}
		prevGroups = arrayUnique(prevGroups);
		
		// find all previous statuses
		var filters = [
           new nlobjSearchFilter(CAC_NEXT_APPROVER_FIELD_ID, null,'anyOf',prevGroups),
           new nlobjSearchFilter('isinactive',null,'is','F')
        ];
		var columns = [
		               new nlobjSearchColumn('custrecord_pp_approval_process'),
		               new nlobjSearchColumn(CAC_NEXT_APPROVER_FIELD_ID)
		];
		var approvalStatusResults = nlapiSearchRecord(CAC_APPROVAL_STATUS_RECORD_ID,null,filters,columns);
		var asrCount = approvalStatusResults.length;
		for(var i = 0; i < resultCount; i++){
			var payment = payments[i];
			var approvalProcessId = payment.getValue('custrecord_pp_approval_process',CAC_APPROVAL_STATUS_FIELD_ID);
			
			for(var j = 0; j < asrCount; j++){	
				if(approvalProcessId == approvalStatusResults[j].getValue('custrecord_pp_approval_process') && payment.getValue(CAC_PREV_APPROVER_FIELD_ID,CAC_APPROVAL_STATUS_FIELD_ID) == approvalStatusResults[j].getValue(CAC_NEXT_APPROVER_FIELD_ID)){
					var siga = payment.getValue('custbody_pp_override_sig_a');
					var sigb = payment.getValue('custbody_pp_override_sig_b');
					
					siga = sigb;
					sigb = '';
					
					statusMap[payment.getId()] = {
							statusId : approvalStatusResults[j].getId(), 
							recordType: payment.getValue('recordtype'),
							siga : siga,
							sigb : sigb
					};
					break;
				}
			}
		}	
	}
	else if(requestType == 'REJECT'){
		//find rejected status and create statusMap
		var rejectedStatusId = PPSLibApprovals.getRejectedStatusId();
		for(var i = 0; i < resultCount; i++){
			var payment = payments[i];
			var siga = payment.getValue('custbody_pp_override_sig_a');
			var sigb = payment.getValue('custbody_pp_override_sig_b');
			statusMap[payment.getId()] = {
					statusId : rejectedStatusId, 
					recordType: payment.getValue('recordtype'),
					siga : siga,
					sigb : sigb
			};
		}
	}
	return statusMap;
}
