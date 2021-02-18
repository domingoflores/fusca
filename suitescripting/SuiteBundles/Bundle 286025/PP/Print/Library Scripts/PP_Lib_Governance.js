/**
 * Module Description: This library contains functions used in managing governance for scheduled scripts.
 * 
 * Version    Date            Author           Remarks
 * 1.00       12 Apr 2018     Jreid
 *
 */

var myGovernanceThreshold = 200;

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
