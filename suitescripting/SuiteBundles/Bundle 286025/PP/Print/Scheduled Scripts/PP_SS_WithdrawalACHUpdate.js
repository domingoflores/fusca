/**
 * Set all existing ACH account's depsoit/withdrawal settings to Deposit.
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Oct 2014     maxm
 *
 */
var myGovernanceThreshold = 200;
/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {

	var search = nlapiCreateSearch('customrecord_pp_ach_account');
	
	var filters = [];
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_deposit_withdrawal',null,'anyof','@NONE@'));
	
	search.setFilters(filters);
	
	var resultSet = search.runSearch();
	var startIndex = 0;
	var endIndex = 1000;
	
	while(true){
		var searchResults = resultSet.getResults(startIndex, endIndex);
		for(var i = 0; i < searchResults.length; i++){
			// save withdrawal/deposit field
			try{
				var rec = nlapiLoadRecord('customrecord_pp_ach_account',searchResults[i].getId());
				rec.setFieldValue('custrecord_pp_ach_deposit_withdrawal',1);
				nlapiSubmitRecord(rec,{disabletriggers: true});
			}
			catch(e){
				nlapiLogExecution('ERROR', 'Error setting deposit withdrawal field', e.message);
			}
			checkGovernance();
		}
		
		if(searchResults.length < 1000){
			break;
		}
	}
	//check if OneWorld, trigger next needed bundle update script
	try {
			var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
			if (isOneWorld == true) {
				nlapiLogExecution('DEBUG', 'Avid ACH Account Subsidiaries update','this is OneWorld');
				var status = nlapiScheduleScript("customscript_pp_ss_achacctsubsidiary_upd", "customdeploy_pp_ss_achacctsubsidiary_upd");
				if(status != "QUEUED")	{
					throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
				}
			} else{
				nlapiLogExecution('DEBUG', 'Avid ACH Account Subsidiaries update','not run because this is not OneWorld');
			}
		} catch(ex) {
			nlapiLogExecution('error', 'Error in Avid ACH Account Subsidiaries update', ex.message);
		}
	
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