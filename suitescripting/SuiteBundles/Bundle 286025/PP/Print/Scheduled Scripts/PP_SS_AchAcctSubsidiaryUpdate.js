/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Dec 2017     Jreid
 *
 */

var context = nlapiGetContext();
var myGovernanceThreshold = 200;

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	try {
		nlapiLogExecution('DEBUG', 'achAccountSubsidiaryUpdate', 'start');
		var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
		// if not oneworld, just return
		if (isOneWorld == false) {
	        nlapiLogExecution('DEBUG', 'achAccountSubsidiaryUpdate', 'Not OneWorld: Exiting');
			return;
		} else {
			nlapiLogExecution('AUDIT', 'ACH Account Subsidiary Update','OneWorld');
			// get all Avid Ach Account records that have no subsidiaries
			var achAccountSearchResults = achAccountSearch();
			nlapiLogExecution('AUDIT', 'Number of ACH Accounts Found', achAccountSearchResults.length);
			// if done, just return
			if (achAccountSearchResults == null) {
				nlapiLogExecution('AUDIT', 'No Avid ACH Account Records to update','exiting');
				return;
			}
			for (var a = 0; a < achAccountSearchResults.length; a++) {
				//should be able to just open and then save Avid ACH Account record, to tip off UE script beforeLoad script 
				var achRec = nlapiLoadRecord('customrecord_pp_ach_account', achAccountSearchResults[a].getValue('internalid'));
				nlapiSubmitRecord(achRec);
			}
		}
	} catch(ex) {
		nlapiLogExecution('ERROR', 'Error in achAccountSubsidiaryUpdate', ex.message);
	}
}

/*
 * Find all Avid ACH Account records
 */
function achAccountSearch(){
	var filters = [
	    // get records with no subsidiaries
	    new nlobjSearchFilter('custrecord_pp_ach_subsidiaries', null, 'anyof','@NONE@')
	    // get only records with an assigned entity
		, new nlobjSearchFilter('custrecord_pp_ach_entity', null, 'noneof', '@NONE@')
	    // be sure the record is active
		, new nlobjSearchFilter('isinactive', null, 'is', 'F')
	];
	// return the internal id of the record
	var columns = [];
	var internalidColumn = new nlobjSearchColumn("internalid");
	internalidColumn.setSort();
	columns.push(internalidColumn);
	// return a limited result set (to account for governance) of avid ach account records
	return getAllResults('customrecord_pp_ach_account',filters,columns);
}


/// The following functions are common amongst a number of update scheduled scripts; these should probably be moved to a library. 
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
