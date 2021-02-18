/**
 * Module Description
 * 
 * Version   Date           Author			Remarks
 	2.10.0.2 2017.04.28		John Reid		S15089: Set showName based on custscript_show_name preference
 * 1.00      29 Jul 2013     maxm
 *
 * A status is considered to be approved if it has a previous approver and no next approver,
 * or it belongs to an approval process with auto approve checked.
 */

var PPSLibApprovals = {

	/**
	 * Are approval enabled?
	 */
	enabled : nlapiGetContext().getSetting('SCRIPT', 'custscript_enable_approvals') == 'T' ? true : false, 
			
	/**
	 * << S15089 >> Show the entity (customer/vendor/employee) name in the Approval sublist?
	 */
	showName : nlapiGetContext().getSetting('SCRIPT', 'custscript_show_name') == 'T' ? true : false, 
					
	firstSubFilterExpression : [['custrecord_pp_previous_approver_grp','anyof','@NONE@'],'and',['custrecord_pp_next_approver_grp','noneof','@NONE@']],
	
	lastSubFilterExpression : [['custrecord_pp_previous_approver_grp','noneof','@NONE@'],'and',['custrecord_pp_next_approver_grp','anyof','@NONE@']],
	
	/**
	 * Find the default approval status for a payment.
	 * 
	 * If approvals are enabled, then a pending status or auto approve status is returned. If approvals are disabled
	 * then an approved or auto approve status is returned. 
	 * 
	 * 
	 * Returns null if no status is found.
	 * 
	 * @param {Number} amount - The payment amount
	 * @param {String} accountId - The id of the account the payment belongs to.
	 * 
	 * @returns {nlapiSearchResult}
	 */
	findDefaultApprovalStatus : function(amount,accountId){
		var subFilterExpression;
		
		if(this.enabled){
			subFilterExpression = this.firstSubFilterExpression;
		}
		else{
			subFilterExpression = this.lastSubFilterExpression;
		}
		
		var filterExpression = 
			[
			 	[
				 	 subFilterExpression,
				 	 'or',
				 	 [['custrecord_pp_approval_process.custrecord_pp_auto_approve','is', 'T']]
				 ],
			 	'and',
			 	['custrecord_pp_approval_process.custrecord_pp_lower_limit','lessthanorequalto', amount],
			 	'and',
			 	['custrecord_pp_approval_process.custrecord_pp_upper_limit','greaterthanorequalto', amount],
			 	'and',
			 	[
			 	 	['custrecord_pp_approval_process.custrecord_pp_ap_all_accounts','is','T'],
			 	 	'or',
			 	 	['custrecord_pp_approval_process.custrecord_pp_accounts','anyof',[accountId]],
			 	],
			 	'and',
			 	['isinactive','is','F'],
			 	'and',
			 	['custrecord_pp_approval_process.isinactive','is','F']
			];
			
		var search = nlapiSearchRecord('customrecord_pp_pmt_approval_status', null, filterExpression, [
 	   	    new nlobjSearchColumn('name',null), 
 	   	    new nlobjSearchColumn('custrecord_pp_previous_approver_grp'),
 	   	    new nlobjSearchColumn('custrecord_pp_next_approver_grp'),
 	   	    new nlobjSearchColumn('custrecord_pp_approval_process'),
 	   	    new nlobjSearchColumn('custrecord_pp_auto_approve','custrecord_pp_approval_process')
 	   	]);
		
 	   	if(search && search.length > 0){
 	   		return search[0];
 	   	}
	 	return null;
	},
	
	/**
	 * Find list of all last and auto approved statuses ids.
	 * 
	 * 
	 * @returns {Array}
	 */
	findAllApprovedStatusIds : function(){
		
		var filterExpression = 
			 	[
				 	 this.lastSubFilterExpression,
				 	 'or',
				 	 [['custrecord_pp_approval_process.custrecord_pp_auto_approve','is', 'T']]
				 ];

			
		var searchResults = nlapiSearchRecord(CAC_APPROVAL_STATUS_RECORD_ID, null, filterExpression, [
 	   	    new nlobjSearchColumn('name',null)
 	   	]);
		
		var ids = [];
		if(searchResults){
			for(var i = 0; i < searchResults.length; i++){
				ids.push(searchResults[i].getId());
			}
		}
	 	return ids;
	},
	
	/**
	 * Find a roles next approver status Ids.
	 * 
	 * @returns {Array}
	 */
	findNextApproverStatusIdsByRole : function(roleId){
		
		var filters = [];
		filters.push(new nlobjSearchFilter(CAC_NEXT_APPROVER_FIELD_ID, null, 'is', roleId));
		
		var searchResults = nlapiSearchRecord(CAC_APPROVAL_STATUS_RECORD_ID, null, filters, null);
		
		var ids = [];
		if(searchResults){
			for(var i = 0; i < searchResults.length; i++){
				ids.push(searchResults[i].getId());
			}
		}
	 	return ids;
	},
	
	/**
	 * Find all piracle approval groups a user belongs to
	 * 
	 * @param {String} userId
	 * @returns {Array} - approval group ids
	 */
	findUsersApprovalGroupIds : function(userId){
		var groupIds = [];
		var columns = [];
		var filters = [];
		
		filters.push(new nlobjSearchFilter('custrecord_pp_ag_users',null,'anyof',[userId]));
		
		var searchResults = nlapiSearchRecord('customrecord_pp_approval_groups', null, filters, columns);
		if(searchResults){
			for(var i = 0; i < searchResults.length; i++){
				groupIds.push(searchResults[i].getId());
			}
		}
		return groupIds;
	},
	
	/**
	 * Find all of a users next approval statuses
	 * 
	 * @param {String} userId
	 * @returns {Array} - approval status ids
	 */
	findUsersNextApproverStatusIds : function(userId){
		var ids = [];
		var groupIds = this.findUsersApprovalGroupIds(userId);
		if(groupIds.length > 0){
			var filters = [];
			filters.push(new nlobjSearchFilter(CAC_NEXT_APPROVER_FIELD_ID, null, 'anyof', groupIds));
			
			var searchResults = nlapiSearchRecord(CAC_APPROVAL_STATUS_RECORD_ID, null, filters, null);
			if(searchResults){
				for(var i = 0; i < searchResults.length; i++){
					ids.push(searchResults[i].getId());
				}
			}
		}
		return ids;
		
	},
	
	/**
	 * Get the id of the rejected status
	 * 
	 * @returns {string}
	 */
	getRejectedStatusId : function(){
		var filters = [];
		filters.push(new nlobjSearchFilter(CAC_NEXT_APPROVER_FIELD_ID, null, 'anyof', '@NONE@'));
		filters.push(new nlobjSearchFilter(CAC_PREV_APPROVER_FIELD_ID, null, 'anyof', '@NONE@'));
		filters.push(new nlobjSearchFilter('custrecord_pp_auto_approve', 'custrecord_pp_approval_process', 'is', 'F'));
		
		var searchResults = nlapiSearchRecord(CAC_APPROVAL_STATUS_RECORD_ID, null, filters, null);
		if(searchResults && searchResults.length > 0){
 	   		return searchResults[0].getId();
 	   	}
		return null;
	},
	
	/**
	 * Check if a payment is approved
	 * 
	 * @returns {boolean}
	 */
	paymentIsApproved: function(tranId){
		var filters = [];
		
		filters.push(new nlobjSearchFilter('internalid',null,'is',tranId));
		filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
		filters.push(new nlobjSearchFilter(CAC_IS_APPROVED_ID,null,'is','T'));
		
		var searchResults = nlapiSearchRecord('transaction', null, filters, null);
		if(searchResults && searchResults.length > 0){
 	   		return true;
 	   	}
		return false;
	},
	
	/**
	 * Check if a given status equate to approved.
	 * 
	 * @returns {boolean}
	 */
	isApprovedStatus : function(statusId){
		var filterExpression = 
			[
			 	[this.lastSubFilterExpression,
				'or',
				[['custrecord_pp_approval_process.custrecord_pp_auto_approve','is', 'T']]
				 ],
			 	'and',
			 	['internalid','is', statusId]
			];
		var searchResults = nlapiSearchRecord(CAC_APPROVAL_STATUS_RECORD_ID, null, filterExpression, null);
		if(searchResults && searchResults.length > 0){
 	   		return true;
 	   	}
		return false;
	},
	
	/**
	 * Delete all Avid Approver Stack records for a given transaction.
	 * 
	 * @param transactionId
	 */
	clearApproverStack : function(transactionId){
		var filters = [];
		
		filters.push(new nlobjSearchFilter('custrecord_pp_as_transaction',null,'is',transactionId));
		
		var searchResults = nlapiSearchRecord('customrecord_pp_approver_stack', null, filters, null);
		if(searchResults){
			for(var i = 0; i < searchResults.length; i++){
				nlapiDeleteRecord('customrecord_pp_approver_stack', searchResults[i].getId());
			}
		}
	},
	
	/**
	 * FUNCTIONS BELOW HERE ARE NOT USED.
	 *  
	 */
	
	
	/**
	 * Find the approved status for a payment.
	 * 
	 * A status is considered to be approved if it has a previous approver and no next approver,
	 * or it belongs to a approval process with auto approve checked.
	 * 
	 * Returns null if no status is found.
	 * 
	 * @param {Number} amount - The payment amount
	 * @param {String} accountId - The id of the account the payment belongs to.
	 * 
	 * @returns {nlapiSearchResult}
	 */
	findApprovedStatus : function(amount,accountId){

		var filterExpression = 
		[
		 	[
			 	 [['custrecord_pp_previous_approver_grp','noneof','@NONE@'],'and',['custrecord_pp_next_approver_grp','anyof','@NONE@']],
			 	 'or',
			 	 [['custrecord_pp_approval_process.custrecord_pp_auto_approve','is', 'T']]
			 ],
		 	'and',
		 	['custrecord_pp_approval_process.custrecord_pp_lower_limit','lessthanorequalto', amount],
		 	'and',
		 	['custrecord_pp_approval_process.custrecord_pp_upper_limit','greaterthanorequalto', amount],
		 	'and',
		 	['custrecord_pp_approval_process.custrecord_pp_accounts','anyof',[accountId]]
		];
		
		var search = nlapiSearchRecord('customrecord_pp_pmt_approval_status', null, filterExpression, [
 	   	    new nlobjSearchColumn('name',null), 
 	   	    new nlobjSearchColumn('custrecord_pp_previous_approver_grp'),
 	   	    new nlobjSearchColumn('custrecord_pp_next_approver_grp')
 	   	]);
 	   	if(search && search.length > 0){
 	   		return search[0];
 	   	}
 	   	return null;
	},
	getApprovedStatusId : function(amount,accountId){
		var status = this.findApprovedStatus(amount,accountId);
		if(status){
			return status.getId();
		}
		return null;
	},
	// returns a search result of the initial pending approval status
	findPendingApprovalStatus : function(amount,accountId){
		var filterExpression = 
			[
			 	[
				 	 [['custrecord_pp_previous_approver_grp','anyof','@NONE@'],'and',['custrecord_pp_next_approver_grp','noneof','@NONE@']],
				 	 'or',
				 	 [['custrecord_pp_approval_process.custrecord_pp_auto_approve','is', 'T']]
				 ],
			 	'and',
			 	['custrecord_pp_approval_process.custrecord_pp_lower_limit','lessthanorequalto', amount],
			 	'and',
			 	['custrecord_pp_approval_process.custrecord_pp_upper_limit','greaterthanorequalto', amount],
			 	'and',
			 	['custrecord_pp_approval_process.custrecord_pp_accounts','anyof',[accountId]]
			];
		
		var search = nlapiSearchRecord('customrecord_pp_pmt_approval_status', null, filterExpression, [
	   	    new nlobjSearchColumn('name',null), 
	   	    new nlobjSearchColumn('custrecord_pp_previous_approver_grp'),
	   	    new nlobjSearchColumn('custrecord_pp_next_approver_grp')
	   	]);
	   	if(search && search.length > 0){
	   		return search[0];
	   	}
	   	return null;
	},
	getPendingApprovalStatusId : function(amount,accountId){
		var status = this.findPendingApprovalStatus(amount,accountId);
		if(status){
			return status.getId();
		}
		return null;
	}
	
}