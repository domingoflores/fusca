/**
 * Search for all APN batches with custrecord_pp_apn_batch_to_be_marked = T, loop through and ,mark all payments in the AvidPay Batch as processed(printed) and
 * also assign the custbody_pp_apn_payment_batch to the APN Payment Batch
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Apr 2015     maxm
 *
 */

var myGovernanceThreshold = 200;

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	var context = nlapiGetContext();
	var searchResults = markedBatchSearch();
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			try{
				setBatchesPaymentsAsPrinted(searchResults[i].getId());
			}
			catch(e){
				nlapiLogExecution('ERROR','BAD SEED',e.toString());
			}
			
		}
		
		searchResults = markedBatchSearch();
		// some batches missed the train, lets reschedule this scheduled script
		if(searchResults){
			var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());
			nlapiLogExecution('AUDIT','nlapiScheduleScript status', status);
		}
	}
		
}

function markedBatchSearch(){
	//var apnBatchStatusList = $PPS.nlapiGetList('customlist_pp_apn_pb_status');
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('custrecord_pp_apn_batch_to_be_marked',null,'is','T'));
	
	var createdCol = new nlobjSearchColumn('created');
	createdCol.setSort(false);
	columns.push(createdCol);
		
	return nlapiSearchRecord('customrecord_pp_apn_payment_batch', null, filters, columns);
}

function setBatchesPaymentsAsPrinted(batchId){
	var batchRecord = nlapiLoadRecord('customrecord_pp_apn_payment_batch',batchId);
	// have to reload the record
	batchRecord = nlapiLoadRecord('customrecord_pp_apn_payment_batch',batchId)
	
	try{
		var paymentIds = JSON.parse(batchRecord.getFieldValue('custrecord_pp_apn_pb_payments'));
		
		var internalIds = Object.keys(paymentIds);
		var id;
		for(var i = 0; i < internalIds.length; i++){
			id = internalIds[i];
			if(paymentIds.hasOwnProperty(id)){
				try{
					nlapiSubmitField($PPS.Transaction.convertToType(paymentIds[id]), id, ['custbody_pp_is_printed','custbody_pp_apn_payment_batch'], ['T',batchId]);
				}
				catch(e){
					nlapiLogExecution('ERROR','Error setting transaction as printed',e.toString());
				}
			}
			// check goverance every 5 submits
			if((i % 5) == 0){
				checkGovernance();
			}
		}
		
		batchRecord.setFieldValue('custrecord_pp_apn_batch_to_be_marked', 'F');
		nlapiSubmitRecord(batchRecord);
	}
	catch(e){
		batchRecord.setFieldValue('custrecord_pp_apn_pb_error_message','Error marking batch id '+batchId+' payments as printed. Error: ' + e.toString());
		batchRecord.setFieldText('custrecord_pp_apn_batch_to_be_marked', 'F');
		nlapiSubmitRecord(batchRecord);
		nlapiLogExecution('ERROR',e.name,e.message);
		return false;
	}
	return true;
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