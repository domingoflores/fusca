/**
 * This Suitelet creates the Payment Approval Application Form for the 
 * Create-a-Check module.
 */

/* CHANGELOG
 * Date				Author				Remarks
 	2017.04.28	John Reid		 	S15089: Show the entity name in new displayname column on the Approvals sublist
 * 2012-10-15	Eric Grubaugh	Added code to disable "Return for Review" button
 * 								when at the initial approval state.
 */

/**
 * {string} The internal ID of the Approval Status in which this user is allowed to approve.
 */
var context = nlapiGetContext();
var nextApproverStatusIds = PPSLibApprovals.findUsersNextApproverStatusIds(context.getUser());
var approvedStatusIds = PPSLibApprovals.findAllApprovedStatusIds();
var rejectedStatusId = PPSLibApprovals.getRejectedStatusId();

var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');
var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
var amountField = 'amount';
if(multiCurrencyEnabled){
	amountField = 'fxamount';
}

var paymentMethodList = $PPS.nlapiGetList('customrecord_pp_payment_methods');

/**
 * Wrapper Class for NetSuite Plugins to provide backward compatibility
 */
function ApprovalPluginWrapper(){
	
	var plugin;
	
	if(typeof PPApprovalPlugInType != 'undefined'){
		plugin = new PPApprovalPlugInType();
	}
	
	this.__noSuchMethod__ = function(name, params) {
		if(typeof plugin != 'undefined'){
			if(typeof plugin[name] != 'undefined'){
				return plugin[name].apply(plugin,params);
			}
		}
		else{
			// No Plugin found
		}
	};	
}

var approvalPlugin = new ApprovalPluginWrapper();


/**
 * Executes when the Suitelet is accessed. The Suitelet performs a search for all Check, Customer
 * Refund, and Vendor Payment Records that have not yet been marked as Approved or Rejected. The
 * user can then select line items to approve or reject; the user's request is then sent to the
 * CAC Processor Suitelet (<i>CAC_SL_ApproveReject.js</i>). After receiving the
 * result from the Processor Suitelet, this page is reloaded to refresh the sublist.
 *
 * @param request {nlobjRequest} - Request object
 * @param response {nlobjResponse} - Response object
 * 
 * @return {void} Any output is written via Response object
 */
/* TODO add governance info to comment */
function suitelet(request, response) {
	var formTitle = 'Payment Approval Application Form',
		emptyResultsText = 'You have no payments to approve.',
		noAccessText = 'Your current role is unable to approve any payments.',
		approvalForm = {},
		searches = [],
		resultsSubList = {},
		results = [],
		show = true,
		where = 'CAC Approval Form';

	/* Create form with standard NS navigation and its SubList */
	approvalForm = nlapiCreateForm(formTitle, false);
	var enable_approvals = PPSLibApprovals.enabled;
	if(!enable_approvals){
		approvalForm.addField('custpage_approvals_disabled', 'label', 'Approvals are not enabled!');
		response.writePage(approvalForm);
		return;
	}
	
	afnLog(show, where, 'nextApproverStatusIds  ' + nextApproverStatusIds);
	/* Attach client script to this form */
	approvalForm.setScript(CAC_APPROVAL_CLIENT_SCRIPT_ID);
	
	/* Ensure the user has sufficient privileges to approve payments */
	if (nextApproverStatusIds.length > 0) {
		/* Add filter controls to the form */
		setupUiFilters(approvalForm,request);
		
		/* Extra form setup from plugins */
		approvalPlugin.formSetupHook(approvalForm,request);
		
		/* Set up all searches */
		searches = createSearches(request);
		
		/* Perform searches */
		results = executeSearches(searches);
		
		/* If there are results, create and fill the sublist */
		if (results.length > 0) {
			resultsSubList = setupUiSublist(approvalForm);
			writeResults(results, resultsSubList);
			/* Otherwise, notify user that no results matched their criteria */
		} else {
			approvalForm.addFieldGroup('custpage_noresults_group', 'No Results');
			approvalForm.addField('custpage_noresults_label', 'label', emptyResultsText, null,
				'custpage_noresults_group').setLayoutType('outside','startcol');
		}
	/* Insufficient privileges for approvals */
	} else {
		approvalForm.addFieldGroup('custpage_noaccess_group', 'Insufficient Privileges');
		approvalForm.addField('custpage_noaccess_label', 'label', noAccessText, null,
				'custpage_noaccess_group');
	}
	
	/* Write form to the response */
	response.writePage(approvalForm);
}

/**
 * Adds all UI components to the provided nlobjForm UI component.
 * 
 * @param form {nlobjForm} - Main Form UI component
 * 
 * @return {void}
 */
function setupUiFilters(form,request) {
	var typeSelect = {},
		customerSelect = {},
		vendorSelect = {},
		returnBtn = {};
//		methodSelect = {},

	form.addSubmitButton('Search');

	form.addButton('custpage_reset_btn', 'Reset', 'resetbtn_click()');
	form.addButton('custpage_approve_btn', 'Approve Selected', 'approvebtn_click()');
	/* TODO Need to disable this button if the user is unable to kick back */
	//form.addButton('custpage_reject_btn', 'Reject Selected', 'rejectbtn_click()');
	
	form.addField('custpage_reason_text', 'text', 'Rejection Reason')
		.setDisplayType('hidden');
	
	form.addFieldGroup('custpage_filter_group', 'Search Criteria');
	
	/* Transaction Type selection list */
	typeSelect = form.addField('custpage_type_select', 'select', 'Transaction Type', null,
			'custpage_filter_group');
	typeSelect.addSelectOption('','');
	typeSelect.addSelectOption('checks', 'Checks');
	typeSelect.addSelectOption('refunds', 'Customer Refunds');
	typeSelect.addSelectOption('payments', 'Vendor Payments');
	if (request.getParameter('custpage_type_select')) {
		typeSelect.setDefaultValue(request.getParameter('custpage_type_select'));
	}
	
	/* Payment Method selection list */
/*	
	methodSelect = form.addField('custpage_method_select', 'select', 'Payment Method', null,
			'custpage_filter_group');
	methodSelect.addSelectOption('','');
	if (request.getParameter('custpage_method_select')) {
		methodSelect.setDefaultValue(request.getParameter('custpage_method_select'));
	}
*/
	
	/* Customer selection list */
	customerSelect = form.addField('custpage_customer_select', 'select', 'Customer','customer',
			'custpage_filter_group');
	if (request.getParameter('custpage_customer_select')) {
		customerSelect.setDefaultValue(request.getParameter('custpage_customer_select'));
	}
	
	/* Vendor selection list */
	vendorSelect = form.addField('custpage_vendor_select', 'select', 'Vendor', 'vendor',
			'custpage_filter_group');
	if (request.getParameter('custpage_vendor_select')) {
		vendorSelect.setDefaultValue(request.getParameter('custpage_vendor_select'));
	}
	
	var accountSelect = form.addField('custpage_account_select','select','Account',null,'custpage_filter_group');
	addOptionsToAccountSelect(accountSelect);
	if (request.getParameter('custpage_account_select')) {
		accountSelect.setDefaultValue(request.getParameter('custpage_account_select'));
	}
	
	form.addFieldGroup('custpage_total_group', 'Totals').setShowBorder(false);
	var tamf = form.addField('custpage_total_amount','currency','Amount',null,'custpage_total_group');
	tamf.setDisplayType('disabled');
	tamf.setDefaultValue(0);
	
	var tasf = form.addField('custpage_total_selected','text','Items Selected',null,'custpage_total_group');
	tasf.setDisplayType('disabled');
	tasf.setDefaultValue('0');
	//form.addField('custpage_totals','inlinehtml',null,null).setDefaultValue('Total $<span id="totalAmount">0.00</span> Number Checked <span id="totalSelected">0</span>');
}

function addOptionsToAccountSelect(accountSelect) {
    accountSelect.addSelectOption('', '');

    var columns = [],
	filters = [];
	
    columns.push(new nlobjSearchColumn('name'));
	
    filters.push(new nlobjSearchFilter('type', null, 'is', 'Bank'));
    filters.push(new nlobjSearchFilter('custrecord_pp_account_exclude',null,'is','F'));
	
    var search = nlapiCreateSearch('account',filters,columns);
	var resultSet = search.runSearch();
	var i = 0;
	resultSet.forEachResult(function(searchResult){
		//accountSelect.addSelectOption(searchResult.getId(), searchResult.getValue('name'), bAccount == searchResult.getId());
		accountSelect.addSelectOption(searchResult.getId(), searchResult.getValue('name'), false);
		i++;
		return i < 4000; // return true to keep iterating
	});
}

/**
 * Creates the SubList UI component that will hold search results.
 * 
 * @param form {nlobjForm} - The Form to which the SubList will be added.
 * 
 * @return {nlobjSubList} A reference to the SubList UI component.
 */
function setupUiSublist(form) {
	var sublist = {},
		listTitle = 'Payments Awaiting Approval';
	
	sublist = form.addSubList(CAC_FORM_SUBLIST_ID, 'list', listTitle);
	
	sublist.addMarkAllButtons();
	
	sublist.addField('status','checkbox','Approve');
	// << S15089 >> Add a field for the displayname in the sublist
	if(PPSLibApprovals.showName){
		sublist.addField('entityname', 'text', 'ID');
		sublist.addField('displayname', 'text', 'Name');
    } else {
		sublist.addField('entityname', 'text', 'Customer/Vendor Name');
    }
	//sublist.addField('subsidiary', 'text', 'Company'); /// TODO : NEED TO CHECK TO SEE IF NEEDS TO BE HERE
	sublist.addField('amount', 'currency', 'Amount');
	sublist.addField('tranid', 'text', 'Check #');
	sublist.addField('account', 'text', 'Account');
	sublist.addField('isach', 'text', 'Payment Method');
	sublist.addField('recordtype', 'text', 'Type');
	sublist.addField('trandate', 'date', 'Date');
	sublist.addField('memo', 'textarea', 'Memo');
	sublist.addField('comment', 'textarea', 'Comment');
	sublist.addField('reason', 'textarea', 'Reason For Return');
	sublist.addField('internalid', 'text', 'Internal ID')
		.setDisplayType('hidden');
	sublist.addField('reject','text','Reject|Return');
	sublist.addField('custpage_isach_check', 'checkbox', 'Is ACH?')
		.setDisplayType('hidden');
	
	approvalPlugin.sublistSetupHook(sublist);
	
	return sublist;
}

/**
 * Write search results to provided SubList component.
 * 
 * @param {nlobjSearchResult[]} results - The search results to write to the SubList.
 * @param {nlobjSubList} sublist - The SubList component to which results are being written.
 * @private 
 */
function writeResults(results, sublist) {
	var resultIndex = results.length - 1,
    	entity_ids = [],							// S15089 add a list of unique entity ids
		ppVendors = {},						// S15089 add a list of Vendors
		//lineIndex = 1,
		entityHTML = '',
		paymentHTML = '',
		show = true,
		where = 'writeResults';
	
	var itemsToAdd = [];
	if (results && sublist) {
		// >> S15089 >> collect entity ids since we cannot get everything that we want from the search
		if(PPSLibApprovals.showName){
			for (var a = 0; a < results.length; a++) {
				var result = results[a];
				var entity_id = result.getValue('entity');
          		//afnLog(show, where, 'Collecting entityId <<' + entityId + '>>');
				// need to only add unique entityids
				if(entity_ids.indexOf(entity_id) == -1){
           			//afnLog(show, where, 'Adding <<' + entityId + '>> to entityIds');
					entity_ids.push(entity_id);
				}
			}
			// get displaynames for each unique entityid
			var allEntityResults = entitySearch(entity_ids);
			// convert vendors to pps format
			ppVendors = ppVendorfy(allEntityResults);
        }
		// << S15089 <<
		for (; resultIndex >= 0; resultIndex--) {
			
			var __i = {};
			var searchResult = results[resultIndex];
			//afnLog(show, where, 'Writing ' + results[resultIndex].getId() + ' to sublist.');
			/* Set Payment Type field to be a link to the Payment record */
			paymentHTML = "<a href='" + CAC_getPaymentUrl(searchResult) + "'>"+searchResult.getText('custbody_pp_payment_method')+"</a>";
			__i.isach = paymentHTML;

			// >> S15089 >>
          	var entityname = searchResult.getText('entity');
			if(PPSLibApprovals.showName){
				var eid = searchResult.getValue('entity');
				var ppVendor = undefined;
				for(a = 0; a < ppVendors.length; a++){
					if(ppVendors[a].id == eid){
           				//afnLog(show, where, 'Found eid <<' + eid + '>> in ppVendors');
						ppVendor = ppVendors[a];
						break;
					}
				}
				if(typeof ppVendor == 'undefined'){
           			afnLog(show, where, 'Customer, Vendor, or Employee record not found for entityId <<' + eid + '>>');
					__i.displayname = searchResult.getText('entity');
				}
				else{
              		entityname = ppVendor['entityid'];
					__i.displayname = ppVendor['displayName'];
				}
            }
			/* Set Entity Name field to be a link to the Entity record */
			entityHTML = '<a href="#" onclick="redirectToEntity(' + searchResult.getValue('entity') + ' )" />' + entityname + "</a>";
			__i.entityname = entityHTML;
			// << S15089 <<
			__i.tranid = searchResult.getValue('tranid');
			__i.account = searchResult.getText('account');
			__i.memo = searchResult.getValue('memo');
			__i.amount = Math.abs(searchResult.getValue(amountField)).toFixed(2);
			__i.recordtype = searchResult.getValue(searchResult.getValue('recordtype'));
			__i.trandate = searchResult.getValue('trandate');
			__i.comment = searchResult.getValue(CAC_COMMENT_FIELD_ID);
			__i.reason = searchResult.getValue(CAC_REJECTION_REASON_FIELD_ID);
			__i.internalid = searchResult.getId();
			
			var rid = searchResult.getId();
			var prevApprover = searchResult.getValue(CAC_PREV_APPROVER_FIELD_ID,CAC_APPROVAL_STATUS_FIELD_ID);
			var returnRejectHTML = '<a href="#" onclick="rejectbtn_click('+ rid +')">Reject</a>';
			if(prevApprover){
				returnRejectHTML += ' | <a href="#" onclick="kickbtn_click('+ rid +')">Return</a>'
			}
			__i.reject = returnRejectHTML;
			
			approvalPlugin.addSublistRowHook(__i,searchResult);
			itemsToAdd.push(__i);
		}
		
		// setLineItenValues is much faster than adding items one at a time
		sublist.setLineItemValues(itemsToAdd);
	} 
}

/**
 * Determines which search objects to create and execute to retrieve payment data.
 * 
 * @param {nlobjRequest} request - The HTTP request object from which search parameters are retrieved.
 * @returns {cacSearch[]} An array of search objects. See the create*Search functions for object
 * 		structure.
 */
function createSearches(request) {
	var searches = [];
	
	if (!request.getParameter('custpage_type_select')) {
		searches = [createPaymentSearch(request),
		            createCheckSearch(request),
		            createRefundSearch(request)];
		
	} else {
		switch (request.getParameter('custpage_type_select')) {
        case 'checks':
	        searches = [createCheckSearch(request)];
	        break;
        case 'payments':
        	searches = [createPaymentSearch(request)];
        	break;
        case 'refunds':
        	searches = [createRefundSearch(request)];
        	break;
        default:
        	/* Empty default case means an empty array is returned */
	        break;
        }
	}
	
	return searches;
}

/**
 * Defines search criteria and executes query on Vendor Payment records.
 * 
 * @param {nlobjRequest} request - The HTTP request object received by the Suitelet.
 * @returns {cacSearch} A Search object defining columns and filters ready to
 * 		be executed against Vendor Payment records. The object has the structure:
<pre><code>
{
	recordType : {string},
	filters : {nlobjSearchFilter[]},
	columns : {nlobjSearchColumn[]}
}
</code></pre>
 * @private
 */
function createPaymentSearch(request) {
	var columns = [],
		filters = [],
		vendor = {};
	
	addCommonFilters(filters);
	
	vendor = request.getParameter('custpage_vendor_select');
	if (vendor) {
		filters.push(new nlobjSearchFilter('entity', null, 'anyof', vendor));
	}
	
	var account = request.getParameter('custpage_account_select');
	if (account) {
		filters.push(new nlobjSearchFilter('account', null, 'anyof', account));
	}
	
	// filter out payments that this user has already approved
	var noneOfIds = approvedByUserButNotApproved('vendorpayment');
	if(noneOfIds.length > 0){
		filters.push(new nlobjSearchFilter('internalid', null, 'noneof', noneOfIds));
	}
	
	addCommonColumns(columns);
	
	return {
		'recordType' : 'vendorpayment',
		'filters' : filters,
		'columns' : columns
	};
}

/**
 * Defines search criteria and executes query on Check records.
 * 
 * @param {nlobjRequest} request - The HTTP request object received by the Suitelet.
 * @returns {cacSearch} A Search object defining columns and filters ready to
 * 		be executed against Check records. The object has the structure:
<pre><code>
{
	recordType : {string},
	filters : {nlobjSearchFilter[]},
	columns : {nlobjSearchColumn[]}
}
</code></pre>
 * @private
 */
function createCheckSearch(request) {
	var columns = [],
		filters = [],
		customer = {},
		vendor = {};
	
	addCommonFilters(filters);
	/* TODO What to do when both customer and vendor are specified? Currently customer will
	 * take precedence.
	 */
	customer = request.getParameter('custpage_customer_select');
	vendor = request.getParameter('custpage_vendor_select');
	if (customer) {
		filters.push(new nlobjSearchFilter('entity', null, 'anyof', customer));
	} else if (vendor) {
		filters.push(new nlobjSearchFilter('entity', null, 'anyof', vendor));
	}
	filters.push(new nlobjSearchFilter('status', null, 'noneof', ['Voided']));
	
	var account = request.getParameter('custpage_account_select');
	if (account) {
		filters.push(new nlobjSearchFilter('account', null, 'anyof', account));
	}
	
	// filter out payments that this user has already approved
	var noneOfIds = approvedByUserButNotApproved('check');
	if(noneOfIds.length > 0){
		filters.push(new nlobjSearchFilter('internalid', null, 'noneof', noneOfIds));
	}
	
	/* Set up columns to retrieve while searching */
	addCommonColumns(columns);
	
	return {
		'recordType' : 'check',
		'filters' : filters,
		'columns' : columns
	}; 
}

/**
 * Defines search criteria and executes query on Customer Refund records.
 * 
 * @param {nlobjRequest} request - The HTTP request object received by the Suitelet.
 * @returns {cacSearch} A Search object defining columns and filters ready to
 * 		be executed against Customer Refund records. The object has the structure:
<pre><code>
{
	recordType : {string},
	filters : {nlobjSearchFilter[]},
	columns : {nlobjSearchColumn[]}
}
</code></pre>
 * @private
 */
function createRefundSearch(request) {
	var columns = [],
		filters = [],
		customer = {};
	
	/* Set up filter conditions */
	addCommonFilters(filters);
	filters.push(new nlobjSearchFilter('status', null, 'noneof', ['Voided']));

	/* Get text from Customer select field, if any */
	customer = request.getParameter('custpage_customer_select');
	if (customer) {
		filters.push(new nlobjSearchFilter('entity', null, 'anyof', customer));
	}
	
	var account = request.getParameter('custpage_account_select');
	if (account) {
		filters.push(new nlobjSearchFilter('account', null, 'anyof', account));
	}

	// filter out payments that this user has already approved
	var noneOfIds = approvedByUserButNotApproved('customerrefund');
	if(noneOfIds.length > 0){
		filters.push(new nlobjSearchFilter('internalid', null, 'noneof', noneOfIds));
	}
	
	/* Set up columns to retrieve while searching */
	addCommonColumns(columns);
	
	return {
		'recordType' : 'customerrefund',
		'filters' : filters,
		'columns' : columns
	};
}

/**
 * Encapsulates addition of common nlobjSearchColumn objects for searches.
 * 
 * @param {nlobjSearchColumn[]} columns - The array to add columns to.
 * @private
 */
function addCommonColumns(columns) {
	columns.push(new nlobjSearchColumn('entity'));
	columns.push(new nlobjSearchColumn('trandate'));
	columns.push(new nlobjSearchColumn('tranid'));
	columns.push(new nlobjSearchColumn('account'));
	columns.push(new nlobjSearchColumn('recordtype'));
	columns.push(new nlobjSearchColumn(amountField));
	columns.push(new nlobjSearchColumn('memo'));
	//columns.push(new nlobjSearchColumn('subsidiary')); // TODO
	columns.push(new nlobjSearchColumn('custbody_pp_payment_method'));
	columns.push(new nlobjSearchColumn(CAC_APPROVAL_STATUS_FIELD_ID));
	columns.push(new nlobjSearchColumn(CAC_PREV_APPROVER_FIELD_ID,CAC_APPROVAL_STATUS_FIELD_ID));
	columns.push(new nlobjSearchColumn(CAC_COMMENT_FIELD_ID));
	columns.push(new nlobjSearchColumn(CAC_REJECTION_REASON_FIELD_ID));
	
	approvalPlugin.searchColumnsHook(columns);
}

/**
 * Encapsulates addition of common nlobjSearchFilter objects for searches.<br>
 * 
 * @param {nlobjSearchFilter[]} filters - The array to add filters to.
 * @private
 */
function addCommonFilters(filters) {
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	filters.push(new nlobjSearchFilter(CAC_APPROVAL_STATUS_FIELD_ID, null, 'anyof', nextApproverStatusIds));
	filters.push(new nlobjSearchFilter(CAC_IS_APPROVED_ID, null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custbody_pp_payment_method', null, 'noneof',[paymentMethodList.getKey('Do Not Process With AvidXchange')] ));
	filters.push(new nlobjSearchFilter('voided', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('memorized', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_pp_account_exclude', 'account', 'is', 'F'));
	if(accountingPeriodsEnabled){
    	filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
    }
	
	approvalPlugin.searchFiltersHook(filters);
	
	/* Only grab latest 12 months of data if in DEV mode to avoid long page load times. Upon initial
	 * deployment of the CAC bundle, there will potentially be hundreds of thousands of unapproved
	 * records.
	 */
	if (CAC_DEV_MODE) {
		filters.push(new nlobjSearchFilter('trandate', null, 'within', 'thisrollingyear'));
	}
}

/**
 * Find all transactionIds that have been approved by the current user but have not approved
 * 
 * @param tranType
 */
function approvedByUserButNotApproved(tranType){

	var ids = [];
	var filters = [];
	var columns = [];
	
	var approvedAndRejectedStatusIds = approvedStatusIds.slice(0);
	approvedAndRejectedStatusIds.push(rejectedStatusId);
	
	var type = $PPS.Transaction.convertToSearchType(tranType);
	
	filters.push(new nlobjSearchFilter('custrecord_pp_as_user', null, 'anyof', '@CURRENT@'));
	filters.push(new nlobjSearchFilter(CAC_APPROVAL_STATUS_FIELD_ID, 'custrecord_pp_as_transaction', 'noneof', approvedStatusIds));
	filters.push(new nlobjSearchFilter('type', 'custrecord_pp_as_transaction', 'is', type));
	
	columns.push(new nlobjSearchColumn('custrecord_pp_as_transaction'));
	
	var searchResults = nlapiSearchRecord('customrecord_pp_approver_stack', null, filters, columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			ids.push(searchResults[i].getValue('custrecord_pp_as_transaction'));
		}
	}
	return ids;
}

/**
 * Executes NetSuite searches based on the provided search objects.
 * 
 * @param {cacSearch[]} searches - An array of searches to perform. See the create*Search functions
 * 		for object structure.
 * @returns {nlobjSearchResult[]} The list of Search Result objects obtained from the searches or
 * 		an empty array if no results are obtained.
 */
function executeSearches(searches) {
	var results = [],
		tmpResults = [],
		search = {},
		searchIndex = searches.length - 1,
		show = true,
		where = 'executeSearch';

	/* Execute all searches, concatenating all results into a single array */
	for (; searchIndex >= 0; searchIndex--) {
		search = searches[searchIndex];
		afnLog(show, where, 'Searching Record type: ' + search['recordType']);
		
		tmpResults = nlapiSearchRecord(search['recordType'], null, search['filters'],
				search['columns']);
		
		/* If result set is empty, nlapiSearchRecord returns null, so convert to
		 * empty array.
		 */
		if (!tmpResults) {
			tmpResults = [];
		}
		
		/* Append new results to existing */
		results = results.concat(tmpResults);
	}
	
	if (results) {
		afnLog(show, where, 'Result count: ' + results.length);
	} else {
		afnLog (show, where, 'No results matched criteria.');
		/* Return empty array when no results, instead of null returned from
		 * nlapiSearchRecord()
		 */
		results = [];
	}
	
	return results;
}


/**
 * S15089 Added entitySearch to find the vendor records for the given entity ids
 *
 * @param {array} entityIds An array of entity internal ids
 * @returns {array} an array of searchResults
 */
function entitySearch(entityIds){
	var entityIdsByType = {
			vendors: [],
			customers: [],
			employees: []
	};
  	var where = 'entitySearch',
		show = true;
    //afnLog(show, where, 'Searching for [' + entityIds.length + '] entityIds');
	// search unknown entities for there type and put into entityIds objects
	if(entityIds.length > 0){
		var entitySearchColumns = [new nlobjSearchColumn('type', null)]; 
		var entitySearchFilters = [new nlobjSearchFilter('internalid',null, 'anyof', entityIds)];
		var entities = nlapiSearchRecord('entity',null,entitySearchFilters,entitySearchColumns);
		var numEntities = entities.length;
    	//afnLog(show, where, 'Found [' + entities.length + '] entities');
		for(var i = 0; i < numEntities; i++){
			var entity = entities[i];
			var entityId = entity.id;
    		//afnLog(show, where, 'Entity('+i+') Record Type = [' + entity.recordType + ']');
			switch(entity.recordType){
				case 'vendor':
					entityIdsByType.vendors.push(entityId);
					break;
				case 'customer':
					entityIdsByType.customers.push(entityId);
					break;
				case 'employee':
					entityIdsByType.employees.push(entityId);
					break;
				default:
					entityIdsByType.vendors.push(entityId);
					entityIdsByType.customers.push(entityId);
					break;
			}
		}
	}
	// search on each entity type(vendors,customers,employees)
	var allEntityResults = new Array();
	if(entityIdsByType.customers.length > 0){
		allEntityResults = allEntityResults.concat(customerSearch(entityIdsByType.customers) || []);
	}
	if(entityIdsByType.vendors.length > 0){
		allEntityResults = allEntityResults.concat(vendorSearch(entityIdsByType.vendors) || []);
	}
	if(entityIdsByType.employees.length > 0){
		allEntityResults = allEntityResults.concat(employeeSearch(entityIdsByType.employees) || []);
	}
	return allEntityResults;
}

/**
 * S15089 Added ppVendorfy to load the display name for the vendor records into an array
 *
 * Creates AvidXchange(PPS) Vendor data objects. 
 * 
 * @param {array} searchResults An array of searchResults
 * @returns {object} an object of vendors by entity internalId
 */
function ppVendorfy(searchResults){
	var vendorArr = [],
		where = 'ppVendorfy',
		show = true;
    //afnLog(show, where, 'Vendorfying [' + searchResults.length + '] entities');
	for(var i = 0; i < searchResults.length; i++){
		var vendObj = {};
		var searchResult = searchResults[i];
		var isperson = searchResult.getValue('isperson');
		vendObj['id'] = searchResult.getId();
        //afnLog(show, where, 'Vendorfying id=['+searchResult.getId() + '] entityid=[' + searchResult.getValue('entityid') + ']');
		if(isperson && isperson == 'F'){
			vendObj['displayName'] = searchResult.getValue('companyname');
		}
		else{
			var nameArr = [];
			var firstname = searchResult.getValue('firstname');
			var middlename = searchResult.getValue('middlename');
			var lastname = searchResult.getValue('lastname');
			if(firstname){
				nameArr.push(firstname);
			}
			if(middlename){
				nameArr.push(middlename);
			}
			if(lastname){
				nameArr.push(lastname);
			}
			vendObj['displayName'] = nameArr.join(" ");
		}
		// if the displayName is still blank, use the entityid
		if(vendObj['displayName'] == ''){
			vendObj['displayName'] = searchResult.getValue('entityid');
		}
		vendObj['entityid'] = searchResult.getValue('entityid');
        afnLog(show, where, 'VendObj('+i+') = entityid['+vendObj['entityid']+'] = displayname[' + vendObj['displayName'] + ']');
		vendorArr.push(vendObj);
	}
	return vendorArr;
}


/**
 * S15089 Added customerSearch to find the customer records for the given entity ids
 * @param {array} ids
 * @returns {array} an array of searchResults
 */
function customerSearch(ids){
	var columns = [];
	var filters = [];
	
	pushSharedColumns(columns);
	
	columns.push(new nlobjSearchColumn('isperson', null));
	columns.push(new nlobjSearchColumn('companyname', null));
	columns.push(new nlobjSearchColumn('accountnumber', null));
	columns.push(new nlobjSearchColumn('custentity_pp_printoncheckas', null));
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
	
	//dataCallbackPlugin.beforeEntitySearch('customer',columns,filters);
	
	return nlapiSearchRecord('customer',null,filters,columns);
}

/**
 * S15089 Added vendorSearch to find the vendor records for the given entity ids
 * @param {array} ids
 * @returns {array} an array of searchResults
*/
function vendorSearch(ids){
	var columns = [];
	var filters = [];
	
	pushSharedColumns(columns);
	
	columns.push(new nlobjSearchColumn('isperson', null));
	columns.push(new nlobjSearchColumn('companyname', null));
	columns.push(new nlobjSearchColumn('printoncheckas', null));
	columns.push(new nlobjSearchColumn('accountnumber', null));
	
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
	
	//dataCallbackPlugin.beforeEntitySearch('vendor',columns,filters);
	
	return nlapiSearchRecord('vendor',null,filters,columns);
}


/**
 * S15089 Added employeeSearch to find the employee records for the given entity ids
 * @param {array} ids
 * @returns {array} an array of searchResults
*/
function employeeSearch(ids){
	var columns = [];
	var filters = [];
	
	pushSharedColumns(columns);
	
	filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
	
	//dataCallbackPlugin.beforeEntitySearch('employee',columns,filters);
	
	return nlapiSearchRecord('employee',null,filters,columns);
}

/**
 * S15089 Added pushSharedColumns to add columns common to all entitiy types
 * @param {array} columns
*/
function pushSharedColumns(columns){
	columns.push(new nlobjSearchColumn('firstname', null));
	columns.push(new nlobjSearchColumn('middlename', null));
	columns.push(new nlobjSearchColumn('lastname', null));
	columns.push(new nlobjSearchColumn('entityid', null));
}

