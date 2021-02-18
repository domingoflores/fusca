/**
 * This scheduled script is meant to be a one time patch that is run on update for bundle versions prior to 1.5.1
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Dec 2013     maxm
 *
 */


$PPS.debug = true;
$PPS.where = 'PP_SS_UpdateIsApproved';
var context = nlapiGetContext();
var accountingPeriodsEnabled = context.getFeature('ACCOUNTINGPERIODS');
/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {

	var approvedStatusIds = PPSLibApprovals.findAllApprovedStatusIds();
	
	var searchResults;
	// This while loop should only ever run once due to governance, but governance units could possibly change in the future.
	while(searchResults = search(approvedStatusIds)){
		for(var i = 0; i < searchResults.length; i++){
			var searchResult = searchResults[i];
			try{
				nlapiSubmitField(searchResult.getRecordType(), searchResult.getId(),CAC_IS_APPROVED_ID,'T');
			}
			catch(e){
				$PPS.log(e);
				//TODO: keep track of payments that error on update to prevent infinite loop
			}
			var remainingUnits = context.getRemainingUsage();

			$PPS.log(remainingUnits);
            // Check remaining units and re-schedule script if needed.
            if (remainingUnits <= 100) {
                $PPS.log("Rescheduled");
                nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());// 20 units
                return;
            }
		}
	}
	//if this is running, then the update is coming from before v1.5. Therefore, we need to also run pp_ss_multiachupdate, which has to be run on anything before 1.7
	nlapiLogExecution('AUDIT', 'MultiACH update', 'Scheduling script');
	var status = nlapiScheduleScript("customscript_pp_ss_multiach_update", "customdeploy_pp_ss_multiach_update");
	if(status != "QUEUED")
	{
		throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
	}
}


function search(approvedStatusIds){
	// find all payments with approved status with approved flag not set
	var filters = [
	              new nlobjSearchFilter(CAC_APPROVAL_STATUS_FIELD_ID,null,'is',approvedStatusIds),
	              new nlobjSearchFilter(CAC_IS_APPROVED_ID,null,'is','F'),
	              new nlobjSearchFilter('mainline', null, 'is', "T"),
	              new nlobjSearchFilter('voided', null, 'is', 'F'),
	              new nlobjSearchFilter('memorized', null, 'is', 'F'),
	              new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check'])
	          ];
	var columns = [new nlobjSearchColumn('type')];
	
	if(accountingPeriodsEnabled){
    	filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
    }
	
	return nlapiSearchRecord('transaction', null, filters, columns);
}
