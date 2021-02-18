/**
 * Find all existing payments and set each payments payment method. The new payment method field
 * will replace the functionality custbody_pp_ach_is_ach and custbody_pp_no_process
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Apr 2014     maxm
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
	
	// Get all payments
	var paymentSearchResults = transactionSearch();
	var paymentMethodList = $PPS.nlapiGetList('customrecord_pp_payment_methods');
	var bogusIds = [];
	if(paymentSearchResults){
		for(var i = 0; i < paymentSearchResults.length; i++){
			var searchResult = paymentSearchResults[i];
			var paymentMethod = 'Check';
			
			if(searchResult.getValue('custbody_pp_ach_is_ach') == 'T'){
				paymentMethod = 'ACH';
			}
			else if(searchResult.getValue('custbody_pp_no_process') == 'T'){
				paymentMethod = 'Do Not Process With AvidXchange';
			}
			
			try{
				/*var rec = nlapiLoadRecord(searchResult.getRecordType(), searchResult.getId(),{disabletriggers: true});
				rec.setFieldValue('custbody_pp_payment_method', paymentMethodList.getKey(paymentMethod));
				nlapiSubmitRecord(rec,{ disabletriggers: true, enablesourcing: true });*/
				nlapiSubmitField(searchResult.getRecordType(), searchResult.getId(), 'custbody_pp_payment_method', paymentMethodList.getKey(paymentMethod));
			}
			catch(e){
				nlapiLogExecution('AUDIT', 'Update Error', 'Could not update transaction id ' + searchResult.getId());
				nlapiLogExecution('ERROR', 'Update Error', e);
				bogusIds.push(searchResult.getId());
			}
			checkGovernance();
		}
	}
	
	nlapiLogExecution('AUDIT', 'Number of Payments Not Updated', bogusIds.length);
	nlapiLogExecution('AUDIT', 'Update Complete', 'Update Complete');
}


/*
 * Find all Payments
 */
function transactionSearch(){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('mainline', null, 'is', "T"));
	filters.push(new nlobjSearchFilter('memorized', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']));
                
	if(accountingPeriodsEnabled){
		filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
	}
	
	var internalidColumn = new nlobjSearchColumn("internalid");
	internalidColumn.setSort();
	columns.push(internalidColumn);
	
	columns.push(new nlobjSearchColumn("custbody_pp_ach_is_ach"));
	columns.push(new nlobjSearchColumn("custbody_pp_no_process"));
	
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