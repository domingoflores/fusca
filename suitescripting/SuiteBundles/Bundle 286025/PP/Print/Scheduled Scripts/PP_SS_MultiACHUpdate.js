/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Jan 2014     maxm
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
	
	var entityToACHAccountMap = {};
	var entityRecordTypes = ['customer','vendor','employee'];
	
	// get all ACH entities and create a ACH Account record for each one
	for(var i = 0; i < entityRecordTypes.length; i++){
		var entitySearchResults = achEntitySearch(entityRecordTypes[i]);
		for(var j = 0; j < entitySearchResults.length; j++){
			var searchResult = entitySearchResults[j];
			var entityId = searchResult.getId();
			// entity can be more than one record type. Only create one achAccount per entity
			if(!(entityId in entityToACHAccountMap)){
				try{
					var achAccountId = createACHAccount(searchResult);
					entityToACHAccountMap[searchResult.getId()] = achAccountId;
				}
				catch(e){
					nlapiLogExecution('ERROR', 'Error creating ACH Account', e);
				}
			}
		}
	}
	
	// set ACH Account on ACH transactions 
	var bogusIds = [];
	var paymentSearchResults = achTransactionSearch();
	nlapiLogExecution('AUDIT', 'Number of ACH Payments Found', paymentSearchResults.length);
	for(var i = 0; i < paymentSearchResults.length; i++){
		var searchResult = paymentSearchResults[i];
		var entityId = searchResult.getValue('entity');
		if((entityId in entityToACHAccountMap)){
			try{
				nlapiSubmitField(searchResult.getRecordType(), searchResult.getId(), 'custbody_pp_ach_account', entityToACHAccountMap[entityId]);
			}
			catch(e){
				nlapiLogExecution('AUDIT', 'Update Error', 'Could not update transaction id ' + searchResult.getId());
				nlapiLogExecution('ERROR', 'Update Error', e);
				bogusIds.push(searchResult.getId());
			}
		}
		else{
			bogusIds.push(searchResult.getId());
		}
		checkGovernance();
	}
	nlapiLogExecution('AUDIT', 'Number of ACH Payments Not Updated', bogusIds.length);
	nlapiLogExecution('AUDIT', 'Update Complete', 'Update Complete');
	var tina = 2;	

	//if this is running, the account is updating from before v1.7. Therefore, we need to run pp_ss_updateisapprovedflag, which fires on 1.8 or below.
	var status = nlapiScheduleScript("customscript_pp_ss_payment_method_update", "customdeploy_pp_ss_payment_method_update");
		
		// set default custscript_pp_paypal_note company preference
		try{
			var prefs = nlapiLoadConfiguration('companypreferences');
			prefs.setFieldValue('custscript_pp_paypal_note','{memo}');
			nlapiSubmitConfiguration(prefs);
		}
		catch(e){
			nlapiLogExecution('ERROR', 'Bundle update error setting default company preferences', e.message);
		}
}

/**
 * Creates a new ach account from the entity ACH information
 * 
 * @param entitySR
 * @returns {Number} - internalId of new ACHAccount record
 */
function createACHAccount(entitySR){
	var rec = nlapiCreateRecord('customrecord_pp_ach_account');
	
	rec.setFieldValue('custrecord_pp_ach_entity', entitySR.getId());
	rec.setFieldValue('name', entitySR.getValue('entityid'));
	rec.setFieldValue('custrecord_pp_ach_is_primary','T');
	
	rec.setFieldValue('custrecord_pp_ach_payee_email',entitySR.getValue('custentity_pp_ach_payee_email'));
	rec.setFieldValue('custrecord_pp_ach_routing_number',entitySR.getValue('custentity_pp_ach_routing_number'));
	rec.setFieldValue('custrecord_pp_ach_account_number',entitySR.getValue('custentity_pp_ach_account_number'));
	rec.setFieldValue('custrecord_pp_ach_sec_code',entitySR.getValue('custentity_pp_ach_sec_code'));
	rec.setFieldValue('custrecord_pp_ach_transaction_code',entitySR.getValue('custentity_pp_ach_transaction_code'));
	
	rec.setFieldValue('custrecord_pp_gl_account_number',entitySR.getValue('custentity_pp_gl_account_number'));
	rec.setFieldValue('custrecord_pp_comment',entitySR.getValue('custentity_pp_comment'));
	rec.setFieldValue('custrecord_pp_custom_line_1',entitySR.getValue('custentity_pp_custom_line_1'));
	rec.setFieldValue('custrecord_pp_custom_line_2',entitySR.getValue('custentity_pp_custom_line_2'));
	rec.setFieldValue('custrecord_pp_custom_line_3',entitySR.getValue('custentity_pp_custom_line_3'));
	rec.setFieldValue('custrecord_pp_iso_dest_curr_code',entitySR.getValue('custentity_pp_iso_dest_curr_code'));
	rec.setFieldValue('custrecord_pp_iso_dest_ctry_code',entitySR.getValue('custentity_pp_iso_dest_ctry_code'));
	rec.setFieldValue('custrecord_pp_receiving_dfi_name',entitySR.getValue('custentity_pp_receiving_dfi_name'));
	rec.setFieldValue('custrecord_pp_receiving_dfi_id_qualifier',entitySR.getValue('custentity_pp_receiving_dfi_id_qualifier'));
	rec.setFieldValue('custrecord_pp_receiving_dfi_id_number',entitySR.getValue('custentity_pp_receiving_dfi_id_number'));
	rec.setFieldValue('custrecord_pp_receiving_dfi_br_ctry_code',entitySR.getValue('custentity_pp_receiving_dfi_br_ctry_code'));
	rec.setFieldValue('custrecord_pp_trans_type_code',entitySR.getValue('custentity_pp_trans_type_code'));
	
	// save and return the new record id
	return nlapiSubmitRecord(rec,true,true);
}

/*
 * Find all records where PP ACH Account number is not blank.
 */
function achEntitySearch(recordType){
	
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('custentity_pp_ach_account_number',null,'isnotempty'));
	
	var internalidColumn = new nlobjSearchColumn("internalid");
	internalidColumn.setSort();
	columns.push(internalidColumn);
	
	columns.push(new nlobjSearchColumn('entityid', null));
	columns.push(new nlobjSearchColumn('custentity_pp_ach_payee_email', null));
	columns.push(new nlobjSearchColumn('custentity_pp_ach_routing_number', null));
	columns.push(new nlobjSearchColumn('custentity_pp_ach_account_number', null));
	columns.push(new nlobjSearchColumn('custentity_pp_ach_enabled', null));
	columns.push(new nlobjSearchColumn('custentity_pp_ach_sec_code', null));
	//columns.push(new nlobjSearchColumn('custentity_pp_ach_deposit_withdrawal', null));
	columns.push(new nlobjSearchColumn('custentity_pp_ach_transaction_code', null));
	
	columns.push(new nlobjSearchColumn('custentity_pp_gl_account_number', null));
	columns.push(new nlobjSearchColumn('custentity_pp_comment', null));
	columns.push(new nlobjSearchColumn('custentity_pp_custom_line_1', null));
	columns.push(new nlobjSearchColumn('custentity_pp_custom_line_2', null));
	columns.push(new nlobjSearchColumn('custentity_pp_custom_line_3', null));
	columns.push(new nlobjSearchColumn('custentity_pp_iso_dest_curr_code', null));
	columns.push(new nlobjSearchColumn('custentity_pp_iso_dest_ctry_code', null));
	columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_name', null));
	columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_id_qualifier', null));
	columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_id_number', null));
	columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_br_ctry_code', null));
	columns.push(new nlobjSearchColumn('custentity_pp_trans_type_code', null));
	
	return getAllResults(recordType,filters,columns);
}

/*
 * Find all ACH transactions
 */
function achTransactionSearch(){
	var filters = [];
	var columns = [];
	
	filters.push(new nlobjSearchFilter('mainline', null, 'is', "T"));
	filters.push(new nlobjSearchFilter('custbody_pp_ach_is_ach', null, 'is', "T"));
	//filters.push(new nlobjSearchFilter('voided', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('memorized', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']));
                
	if(accountingPeriodsEnabled){
		filters.push(new nlobjSearchFilter('closed', 'accountingperiod', 'is', 'F'));
	}
	
	var internalidColumn = new nlobjSearchColumn("internalid");
	internalidColumn.setSort();
	columns.push(internalidColumn);
	
	columns.push(new nlobjSearchColumn("entity"));
	
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
