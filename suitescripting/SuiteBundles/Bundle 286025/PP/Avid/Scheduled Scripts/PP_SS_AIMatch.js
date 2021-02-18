/**
 * Match imported AvidInvoice records to existing vendors and purchase orders
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 Nov 2015     MMenlove
 *
 */

var myGovernanceThreshold = 200;

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {

	var srs;
	var excludedInvoiceIds = [];
	var invRec;
	var sr;
	var context = nlapiGetContext();
	var disablePO = context.getSetting('SCRIPT', 'custscript_pp_disable_po_match');
	while(srs = invoicesToMatchSearch(excludedInvoiceIds)){
		for(var i = 0; i < srs.length; i++){
			sr = srs[i];
			try{
				invRec = null;
				// use dynamic recordmode so setFieldValue throws an error when trying to set invalid vendor 
				// NOTE: if this was done at the batch level, we could update many invoices with less governance, but the solution will be less straight forward
				//		Search for batches with unmatched invoices. IE invoice search group by batch
				//	 CONS: No user event will be triggered. Single invoice error could cause entire batch to not save.
				invRec = nlapiLoadRecord('customrecord_ai_imported_invoices',sr.getId(),{recordmode: 'dynamic'}); 
				if(sr.getValue('custrecord_ai_inv_po_number') && disablePO == 'F'){
					var poSrs = findPurchaseOrderByPONumber(sr.getValue('custrecord_ai_inv_po_number'));
					if(poSrs){
						if(sr.getValue('custrecord_ai_inv_vendor_id') == poSrs[0].getValue('entity') ){
							//successful match po and vendor
							invRec.setFieldValue('custrecord_ai_inv_purchase_order', poSrs[0].getId());
							invRec.setFieldValue('custrecord_ai_inv_vendor', sr.getValue('custrecord_ai_inv_vendor_id'));
							invRec.setFieldValue('custrecord_ai_inv_is_matched','T');
						}
						else{
							//po_vendor_mismatch
							invRec.setFieldValue('custrecord_ai_inv_is_matched','F');
							invRec.setFieldValue('custrecord_ai_inv_error_code','PO_VENDOR_MISMATCH');
							invRec.setFieldValue('custrecord_ai_inv_is_error','T');
						}
					}
					else{
						// no matching po found
						invRec.setFieldValue('custrecord_ai_inv_is_matched','F');
						invRec.setFieldValue('custrecord_ai_inv_error_code','PO_NOT_FOUND');
						invRec.setFieldValue('custrecord_ai_inv_is_error','T');
					}
					
				}
				else{
					//no po, try and set vendor
					try{
						//successful match vendor only
						invRec.setFieldValue('custrecord_ai_inv_vendor',sr.getValue('custrecord_ai_inv_vendor_id'));
						invRec.setFieldValue('custrecord_ai_inv_is_matched','T');
					}
					catch(e){
						if(e.code == 'INVALID_KEY_OR_REF'){
							invRec.setFieldValue('custrecord_ai_inv_is_matched','F');
							invRec.setFieldValue('custrecord_ai_inv_error_code','VENDOR_NOT_FOUND');
							invRec.setFieldValue('custrecord_ai_inv_is_error','T');
						}
						else{
							throw e;
						}
					}	
				}
				nlapiSubmitRecord(invRec);
			}
			catch(e){
				nlapiLogExecution('ERROR','There was an error matching an invoice',e.toString());
				if(invRec){
					try{
						invRec.setFieldValue('custrecord_ai_inv_is_matched','F');
						invRec.setFieldValue('custrecord_ai_inv_error_code','UNEXPECTED_MATCH_ERROR');
						invRec.setFieldValue('custrecord_ai_inv_is_error','T');
						nlapiSubmitRecord(invRec);
					}
					catch(e2){
						nlapiLogExecution('ERROR','There was an error saving the unexpected match error',e2.toString());
						excludedInvoiceIds.push(sr.getId());
					}
				}
				else {
					nlapiLogExecution('ERROR','There was an error saving the unexpected match error',e.toString());
					excludedInvoiceIds.push(sr.getId());
				}
			}
			
			if((i + 1) % 5 == 0){
				checkGovernance();
			}
		}
	}
}


function invoicesToMatchSearch(excludedInvoiceIds){
	
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_is_matched',null,'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_ai_inv_is_error',null,'is','F'));
	
	if(excludedInvoiceIds && excludedInvoiceIds.length > 0){
		filters.push(new nlobjSearchFilter('internalid',null,'noneof',excludedInvoiceIds));
	}
	
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_po_number'));
	columns.push(new nlobjSearchColumn('custrecord_ai_inv_vendor_id'));
	
	//return nlapiCreateSearch('customrecord_ai_imported_invoices',filters,columns);
	var results = nlapiSearchRecord('customrecord_ai_imported_invoices',null,filters,columns);
	return results;
}

function findPurchaseOrderByPONumber(poNumber){
	
	var filters = [];
	var columns = [];
	
	//filters.push(new nlobjSearchFilter('type',null,'is','purchaseorder'));
	filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
	filters.push(new nlobjSearchFilter('tranid',null,'is',poNumber));
	//TODO? status eq pending or something?
	
	columns.push(new nlobjSearchColumn('entity'));
	columns.push(new nlobjSearchColumn('statusref'));
	
	return nlapiSearchRecord('purchaseorder',null,filters,columns);	
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
