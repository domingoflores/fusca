/**
 * Associate bill credits to vendor payments for existing bill credits.
 * This script is run on bundle install and also bundle update for older bundle versions.
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Feb 2014     maxm
 *
 */
var context = nlapiGetContext();
var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');
var myGovernanceThreshold = 200;
/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	
	// find all all vendor credits, load each record and create customrecord_pp_vendpymt_vendcreds for each bill applied with pymt
	var vendorCreditSrs = vendorCreditSearch();
	
	if(vendorCreditSrs){
		for(var i = 0; i < vendorCreditSrs.length; i++){
			checkGovernance();
			var vendorCreditRec = nlapiLoadRecord('vendorcredit', vendorCreditSrs[i].getId());
			
			var numLineItems = vendorCreditRec.getLineItemCount('apply');
			for(var j = 0; j < numLineItems; j++){
				var paymentId = vendorCreditRec.getLineItemValue('apply', 'pymt', j+1);
				if(vendorCreditRec.getLineItemValue('apply','apply',j+1) == 'T' && paymentId){
					var billId = vendorCreditRec.getLineItemValue('apply','doc',j+1);
					var rec = nlapiCreateRecord('customrecord_pp_vendpymt_vendcreds');
					
					rec.setFieldValue('custrecord_pp_offset_payment',paymentId);
					rec.setFieldValue('custrecord_pp_offset_bill', billId);
					rec.setFieldValue('custrecord_pp_offset_bill_credit', vendorCreditRec.getId());
					
					// User events cannot be triggered by other user event scripts
					try{
						nlapiSubmitRecord(rec, true);
					}
					catch(e){
						nlapiLogExecution('ERROR', 'Error Saving customrecord_pp_vendpymt_vendcreds Record', e);
					}
				}
			}
		}
	}
}

/*
 * Find all vendor credits in the system
 */
function vendorCreditSearch(){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('mainline', null, 'is', "T"));
	filters.push(new nlobjSearchFilter('type', null, 'anyof', ['VendCred']));
                
	if(accountingPeriodsEnabled){
		filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
	}
	
	var internalidColumn = new nlobjSearchColumn("internalid");
	internalidColumn.setSort();
	columns.push(internalidColumn);
	
	return getAllResults('transaction',filters,columns);
}

/*
 * Get around 1000 max results per search.
 */
function getAllResults(recordType,filters,columns){
	var returnObj =[],
	resultLength = 1000,
	maxID =0,
	loop=0,
	filters = (!filters) ? [] : filters,
	filterLength = filters.length,
	resultObj = [];

	while (resultLength >= 1000){
		loop++;
	
		resultObj = nlapiSearchRecord(recordType,null,filters,columns) || [];
		for (var i = 0; i < resultObj.length; i++){
			if(resultObj[i]){
				maxID = resultObj[i].getId();
				returnObj.push( resultObj[i] );
			}
		}
		filters[filterLength] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', parseInt(maxID));
		resultLength = (resultObj) ? resultObj.length :0;
	}
	return returnObj;
}

function setRecoveryPoint(){
	var state = nlapiSetRecoveryPoint(); //100 point governance
	if( state.status == 'SUCCESS' ) return;  //we successfully create a new recovery point
	if( state.status == 'RESUME' ) //a recovery point was previously set, we are resuming due to some unforeseen error
	{
		nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		handleScriptRecovery();
	}
	else if ( state.status == 'FAILURE' )  //we failed to create a new recovery point
	{
		nlapiLogExecution("ERROR","Failed to create recovery point. Reason = "+state.reason + " / Size = "+ state.size);
		handleRecoveryFailure(state);
	}
}
 
function checkGovernance()
{
	var context = nlapiGetContext();
	if( context.getRemainingUsage() < myGovernanceThreshold )
	{
		var state = nlapiYieldScript();
		if(state.status == 'FAILURE'){
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} 
		else if ( state.status == 'RESUME' )
		{
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
		// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	}
}
 
function handleRecoverFailure(failure)
{
	if( failure.reason == 'SS_MAJOR_RELEASE' ) throw "Major Update of NetSuite in progress, shutting down all processes";
	if( failure.reason == 'SS_CANCELLED' ) throw "Script Cancelled due to UI interaction";
	if( failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT' ) { throw "Script Exceeded Memory";} //cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
	if( failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE' ) throw "Could not set recovery point because of a reference to a non-recoverable object: "+ failure.information; 
}
