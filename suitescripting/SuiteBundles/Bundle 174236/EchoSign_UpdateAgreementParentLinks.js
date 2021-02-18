/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright [first year code created] Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

/**
 * requirements:
 * 1 - errors need to be log to custom record with the id of the customer that failed
 * 2 - only process customers that had no errors or resolved errors
 * 3 - reschedule immediately if script runs out of point, should only reschedule if 
 * more than one customer is processed successfully (otherwise, there is something wrong
 * with the code) 
 */
var EchoSignFixBrokenLinks = (function(myContext) { 

	var
	
	testMode = false,
	scriptName = 'Fix Broken Links',
	
	findAndFix = function(type, customerId, customerName, newType) {
		if (newType !== 'lead' && newType !== 'prospect' && newType !== 'customer') {
			throw nlapiCreateError('DATA_ERROR', 'new type ' + newType + ' is not supported');
		}
		
		var ars = nlapiSearchRecord('customrecord_echosign_agreement', null, 
				[new nlobjSearchFilter('custrecord_echosign_parent_type', null, 'is', type),
				new nlobjSearchFilter('custrecord_echosign_parent_record', null, 'is', customerId)],
				[new nlobjSearchColumn('name')]);
		
		nlapiLogExecution('debug', 'search agreement - count', ars ? ars.length : 0);
		
		for (var j = 0; ars && j < ars.length; j++) {
			
			var agreementId = ars[j].getId(),
			agreementName = ars[j].getValue('name') || '<< No name - Internal ID is ' + agreementId + ' >>';
			
			nlapiLogExecution('debug', 'fixing agreement ' + agreementId, 'from ' + type + ' customerId ' + customerId + ' to ' + newType);
			
			try {
				nlapiSubmitField('customrecord_echosign_agreement', agreementId, 'custrecord_echosign_parent_type', newType);
			} catch(e) {
				if (e.getCode && e.getCode() === 'SSS_USAGE_LIMIT_EXCEEDED') {
					throw e;
				} else {
					handleError(e, customerId, 'Failed to fix the link between customer ' + customerName + 
							' and agreement ' + agreementName);
				}
			}
		}
	},
	
	handleError = function(e, customerId, errorMessagePrefix) {
		var code = e.getCode ? e.getCode() : e.name, 
		message = e.getDetails ? e.getDetails : e.message,
		errorMessage = errorMessagePrefix + ' : ' + code + ' | ' + message;
		
		nlapiLogExecution('ERROR', 'ERROR', errorMessage);
		
		EchoSign.Util.logError(scriptName, errorMessage, {
			id: customerId
		});
	},
	
	getUnresolvedCustomerIds = function() {
		var data = EchoSign.Util.searchError(scriptName);
		return _.compact(_.map(data, function(d) {
			return d.id;
		}));
	},
	
	getDateFirstAgreementWasCreated = function() {
		var columns = [new nlobjSearchColumn('created')];
		columns[0].setSort();
		var rs = nlapiSearchRecord('customrecord_echosign_agreement', null, null, columns);
		var date = undefined;
		if (rs && rs.length > 0) {
			date = nlapiStringToDate(rs[0].getValue(columns[0]));
		} else {
			date = new Date();
		}
		nlapiLogExecution('debug', 'getDateFirstAgreementWasCreated', date.toString());
		return date;
	};
	
	return {
		setTestMode: function() {
			testMode = true;
		},
		
		scheduled: function(type) {
			
			if (nlapiGetContext().getScriptId() === 'customscript_celigo_echosign_fix_links' &&
				nlapiGetContext().getDeploymentId() !== 'customdeploy_manual') {
					nlapiLogExecution('debug', 'scheduled deployment', 'called manual deployment');
					nlapiScheduleScript('customscript_celigo_echosign_fix_links', 'customdeploy_manual');
					return;
			}
			
			var successCount = 0;
			
			try {
				// search script error records for unresolved customers so that we don't process them again
				var unresolvedCustomerIds = getUnresolvedCustomerIds();
				nlapiLogExecution('debug', 'unresolvedCustomerIds', JSON.stringify(unresolvedCustomerIds));
				
				// search for all customer, is-processed is false
				var filters = [new nlobjSearchFilter('custentity_echosign_fix_link_is_processe', null, 'is', 'F')];
				filters.push(new nlobjSearchFilter('lastmodifieddate', null, 'onorafter', nlapiDateToString(getDateFirstAgreementWasCreated())));
				if (unresolvedCustomerIds.length > 0)
					filters.push(new nlobjSearchFilter('internalid', null, 'noneof', unresolvedCustomerIds));
				if (testMode)
					filters.push(new nlobjSearchFilter('internalid', null, 'is', '373'));
				var columns = [new nlobjSearchColumn('internalid'), 
				               new nlobjSearchColumn('stage'), 
				               new nlobjSearchColumn('entityid')];
				// sort by higher id first so that it handles new records first
				columns[0].setSort(true);
				var rs = nlapiSearchRecord('customer', null, filters, columns);
				
				nlapiLogExecution('debug', 'search customer - count', rs ? rs.length : 0);
				
				// for each customer, search for correspond agreements, modify the agreements
				for (var i = 0; rs && i < rs.length; i++) {
					
					var customerId = rs[i].getId(),
					customerStage = rs[i].getValue('stage').toLowerCase(),
					customerName = rs[i].getValue('entityid') || '<< No name - Internal ID is ' + customerId + ' >>';
					
					try {
						nlapiLogExecution('debug', 'fixing customer ' + i, customerId);
						
						if (customerStage !== 'lead') {
							findAndFix('lead', customerId, customerName, customerStage);
						}
						if (customerStage !== 'prospect') {
							findAndFix('prospect', customerId, customerName, customerStage);
						}
						if (customerStage !== 'customer') {
							findAndFix('customer', customerId, customerName, customerStage);
						}
						
						try {
							nlapiSubmitField('customer', customerId, 'custentity_echosign_fix_link_is_processe', 'T');
						} catch(e) {
							if (e.getCode && e.getCode() === 'SSS_USAGE_LIMIT_EXCEEDED') {
								throw e;
							} else {
								var processed = nlapiLookupField('customer', customerId, 'custentity_echosign_fix_link_is_processe');
								if (processed === 'F') {
									handleError(e, customerId, 'Links between customer ' + customerName + ' and agreements have been fixed ' + 
											'but script failed to mark the customer record as processed');
								}
							}
						}
						
						successCount++;
					} catch(e) {
						if (e.getCode && e.getCode() === 'SSS_USAGE_LIMIT_EXCEEDED') {
							throw e;
						} else {
							handleError(e, customerId, 'There was error fixing links between customer ' + customerName + ' and agreements');
						}
					}
				}
			} catch (e) {
				if (e.getCode && e.getCode() === 'SSS_USAGE_LIMIT_EXCEEDED') {
					nlapiLogExecution('debug', 'script runs out of NetSuite limit');
					if (successCount > 0) {
						nlapiLogExecution('debug', 'successCount > 0, rescheduled');
						try {
							nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
						} catch(e2) {
							nlapiLogExecution('debug', 'cannot reschedule, will resume in 1 hour | ' + (e2.name || e2.getCode()) + ' | ' + (e2.message || e2.getDetails()));
						}
					} else {
						nlapiLogExecution('debug', 'successCount = 0, something is wrong, not rescheduled');
					}
				} else {
					throw e;
				}
			}
		}
	};
	
})();