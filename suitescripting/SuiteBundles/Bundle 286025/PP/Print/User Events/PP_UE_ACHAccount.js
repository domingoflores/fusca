/**
 * User event script for Avid ACH Account custom record
 * 
 * Version    Date            Author      Remarks
 * 2.18.0     11-jun-2019     johnr       [S6059, Bug 52385] Handle error when atempting to update an administrator employee record.
 * 2.14       28-jun-2018     johnr       [S23663] Support ACH Invites that have ACH Account Records Created without an Entity - Part B
 * 											- remove zombie code from previous work
 * 2.14       26-jun-2018     johnr       [S23730] Allow creation of ACH Acount records without an entity for ACH Invites and CSV imports: make sure the ACH Enabled flag gets set
 * 2.14       11-jun-2018     johnr       [S22287] Allow creation of ACH Acount records without an entity for ACH Invites and CSV imports
 * 2.13.1     07-May-2018     johnr       [S22903] ACH Account record's subsidiary field wasn't being updated properly during bundle installation. 
 *                                          This was caused by faulty logic in a local copy of getEntitiesPrimaryACHAccount(). That call was replaced 
 *                                          by a call to $PPS.ACH.getEntitiesPrimaryACHAccount() in PPS_Lib_v1. 
 *                                      *** This fix also requires that the deployment for this script is changed to execute as administrator so that 
 *                                          a primary ACH account that is assigned to a subsidiary the user/role can't access can be detected. 
 * 2.12.0   	08 Feb 2018   johnr          [S20886]: Disable editing the entity on an ACH account record
 * 2.11.1   	13 Dec 2017   johnr          S19112 Entity ACH Account Subsidiary: assign the ACH Account to a subsidiary
 * 																+ Modified userEventBeforeLoad to select all of the entity's subsidiaries upon edit when no subsidiaries are selected for the record
 * 2.11.1   	08 Dec 2017   johnr          S19112 Entity ACH Account Subsidiaries: assign subsidiaries to the ACH Account record   
 *                                                             + Avid ACH Account record changes:
 *                                                             		1.  Add Subsidiaries field to Avid ACH Account record
 *                                                             			- LABEL: Subsidiaries
 *                                                             			- ID: custrecord_pp_ach_subsidiaries
 *                                                             			- DESCRIPTION: Subsidiary restrictions
 *                                                             			- TYPE: Multiple Select
 *                                                             			- LIST/RECORD: Subsidiary
 *                                                             			- STORE VALUE: check
 *                                                             			- SHOW IN LIST: unchecked
 *                                                             			- APPLY ROLE RESTRICTIONS: unchecked [if checked, records without an assigned subsidiary do not show for restricted user/roles]
 *                                                             			- HELP: Select subsidiaries for this Avid ACH Account. This restricts the use of the Avid ACH Account to the selected subsidiaries.
 *                                                             			- DISPLAY TYPE: Normal
 *                                                             			- DEFAULT ACCESS LEVEL: Edit
 *                                                             			- DEFAULT LEVEL FOR SEARCH/REPORTING: Edit
 *                                                             			Click "Apply to Forms"
 *                                                             			Click "Save"
 *                                                             		2. Add Subsidiaries to custom forms: Avid ACH Account Wire Form & Avid ACH Account Form
 *                                                             			- Add Classification Field Group at bottom (last) of field groups
 *                                                             			- Set Subsidiaries as 
 *                                                             				SHOW: checked
 *                                                             				MANDATORY: unchecked
 *                                                             				DISPLAY TYPE: Normal
 *                                                             				LABEL: Subsidiaries
 *                                                             				FIELD GROUP: Classification
 *                                                             		3. Modified Avid UE ACH Account script record (PP_UE_ACHAcount.js)
 *                                                             			Added userEventBeforeSubmit to script record as Before Submit function
 * 1.00       09 Jan 2014     maxm
 * 
 */

//[S19112] If OneWorld, assign the ACH Account to a subsidiary and allow a primary per subsidiary  
var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_pp_ach_account
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	nlapiLogExecution('DEBUG', 'userEventBeforeLoad','(type='+type+', form='+form+', request='+request+')');
	//[S19112] For OneWorld ach accounts, add subsidiaries assignment
	var canSeePrimary = true;
	if( isOneWorld ){
		if( (type == 'create') || (type == 'edit') ){
			// [S22287] Allow creation of ACH Acount records without an entity; 
			try{
		      	// Add the entity's subsidiaries to the subsidiaries copy field 
				var entityId = nlapiGetFieldValue('custrecord_pp_ach_entity');
				if(entityId != null){
					//[S20886]: Disable editing the entity on an ACH account record
					$PPS.setDisplayType(form.getField('custrecord_pp_ach_entity'),'disabled');
					// Get an array of the entity's subsidiaries, filtered by subsidiaries available to the user/role
					nlapiLogExecution('DEBUG', 'userEventBeforeLoad','Get an array of the entity\'s subsidiaries, filtered by subsidiaries available to the user/role');
					var entitySubsidiaries = $PPS.Server.getEntitySubsidiaries(entityId);
					if(entitySubsidiaries){
						// if there is another ach account record that is set as primary but is not visible to this user/role, don't allow the current record to be set as primary
						nlapiLogExecution('DEBUG', 'userEventBeforeLoad','found entity subsidiaries');
						var isPrimary = nlapiGetFieldValue('custrecord_pp_ach_is_primary');
						if(isPrimary == 'F'){
							nlapiLogExecution('DEBUG', 'userEventBeforeLoad','this ACH is not primary, check the visibility of the primary');
							// check the visibility of the primary
							var depositWithdrawal = nlapiGetFieldText('custrecord_pp_ach_deposit_withdrawal');
							// getEntitiesPrimaryACHAccount returns a single Avid ACH Account record id
							var otherPrimaryId = $PPS.ACH.getEntitiesPrimaryACHAccount(entityId,depositWithdrawal);
							if(otherPrimaryId){ 
								nlapiLogExecution('DEBUG', 'userEventBeforeLoad','other primary ACH id='+otherPrimaryId);
								var found = false;
								try{
									// get the subsidiaries assigned to the primary ach account record
									var recordType = nlapiGetRecordType();
									//nlapiLogExecution('DEBUG', 'userEventBeforeLoad','recordType='+recordType);
									var orec = nlapiLoadRecord(recordType, otherPrimaryId);
									var primAchAcctSubs = orec.getFieldValues('custrecord_pp_ach_subsidiaries');
									// check them against the entity's subsidiaries available to this user/role
									for(var j=0; j < primAchAcctSubs.length; ++j){
										for(var k=0;k<entitySubsidiaries.length; k++){
											//nlapiLogExecution('DEBUG', 'userEventBeforeLoad','primAchAcctSubs['+j+']='+primAchAcctSubs[j]+', entitySubsidiaries['+k+'].id='+entitySubsidiaries[k].id);
											if(entitySubsidiaries[k].id==primAchAcctSubs[j]){
												// indicate that the same subsidiary is shared between the primary ach account and the user/role 
												nlapiLogExecution('DEBUG', 'userEventBeforeLoad','primAchAcctSubs['+j+']='+primAchAcctSubs[j]+', entitySubsidiaries['+k+'].id='+entitySubsidiaries[k].id+' match');
												found = true;
											}
										}
									}
								} catch(ex) {
									nlapiLogExecution('error', 'userEventBeforeLoad', 'Cannot access primary ACH Account record: '+ex.message);
								}
								// If we can't see the entity's ACH Account record marked as primary because we don't have access to its subsidiaries, disable the primary checkbox.
								if(!found){
									nlapiLogExecution('DEBUG', 'userEventBeforeLoad','Primary ACH inaccessible, disable Primary checkbox');
									$PPS.setDisplayType(form.getField('custrecord_pp_ach_is_primary'),'disabled');
									canSeePrimary = false; 
								}
							}
						}
						// Select the entities valid subsidiaries on create, or edit when no subsidiaries are selected
						// 1. Get the previously selected subsidiaries, this will be null on 'create' && on bundle install 
					  	var valAchSubsidiaries = nlapiGetFieldValues('custrecord_pp_ach_subsidiaries');
						// 2. if none, go ahead and select all valid subsidiaries for the entity
						if(!valAchSubsidiaries || valAchSubsidiaries.length == 0){
							// Create an array to store selected subsidiaries 
							var selValues = new Array();
							// go through the list of the entity's subsidiaries and add them to the copy field
							for(var i = 0; i < entitySubsidiaries.length; i++){
								var entitySubsidiary = entitySubsidiaries[i];
								selValues.push(entitySubsidiary.id);
							}
							if(selValues){
					  			// if creating or editing, select the previously selected subsidiaries
								nlapiLogExecution('DEBUG', 'userEventBeforeLoad', ' Select subsidiaries = ['+selValues+']');
								nlapiSetFieldValues('custrecord_pp_ach_subsidiaries', selValues);
					  		}
						}
					}//if(entitySubsidiaries)
				}//if(entityId)
			} catch(ex) {
				nlapiLogExecution('error', 'Error in userEventBeforeLoad', ex.message);
			}
		}
	}else{
		//[S19112] Hide the subsidiaries field in nonOW accounts
		$PPS.setDisplayType(form.getField('custrecord_pp_ach_subsidiaries'),'hidden');
	}
		
	if(type == 'create'){
		//[S23730] Make sure the ACH Enabled flag gets set when creating through invite or import
		var enableACHField = form.addField('custpage_enable_ach', 'checkbox', 'Enable ACH On Entity', null);
		form.insertField(enableACHField, 'name');
		enableACHField.setHelpText('Enable ACH for the corresponding entity');
		enableACHField.setDefaultValue('T');
		var entityText = nlapiGetFieldText('custrecord_pp_ach_entity');
		if(entityText){
			nlapiSetFieldValue('name',entityText);
			
			// Add Enable ACH On Entity Checkbox if ach disabled on entity
			var entityId = nlapiGetFieldValue('custrecord_pp_ach_entity');
			var filters = [];
			var columns = [];
			
			filters.push(new nlobjSearchFilter('internalid',null,'anyof',[entityId]));
			columns.push(new nlobjSearchColumn('custentity_pp_ach_enabled'));
			var searchResults = nlapiSearchRecord('entity', null, filters, columns);
			if(searchResults && searchResults[0].getValue('custentity_pp_ach_enabled') == 'T'){
				//[23730] If ACH Enable flag is already set, don't allow it to be changed here 
				enableACHField.setDisplayType('hidden');
			}
			
			// If this is the first ACH account record, set it as primary
			if(canSeePrimary && findEntitiesNumActiveACHAccounts(entityId) == 0){
				var primaryField = form.getField('custrecord_pp_ach_is_primary');
				primaryField.setDefaultValue('T');
			}
			
		}
	}
	else if(type == 'edit'){
		// Do not allow user to change the deposit/withdrawal setting
		$PPS.setDisplayType(nlapiGetField('custrecord_pp_ach_deposit_withdrawal'),'disabled');
	}
	nlapiLogExecution('DEBUG', 'userEventBeforeLoad','end');
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_pp_ach_account
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
	// [S19112] added userEventBeforeSubmit to store the selected subsidiaries
	nlapiLogExecution('DEBUG', 'userEventBeforeSubmit', 'start, type = '+type);
	/**/
	if(isOneWorld){
		if (type == 'create' || type == 'edit' || type == 'xedit') {
			try {
				// Verify the selected subsidiaries are valid for the entity
				var entityId = nlapiGetFieldValue('custrecord_pp_ach_entity');
				if(entityId != null){
					// Get an array of the entity's subsidiaries, filtered by subsidiaries available to the user/role
					nlapiLogExecution('DEBUG', 'userEventBeforeSubmit','Get an array of the entity\'s subsidiaries, filtered by subsidiaries available to the user/role');
					var entitySubsidiaries = $PPS.Server.getEntitySubsidiaries(entityId);
					if(entitySubsidiaries){
					  	var valAchSubsidiaries = nlapiGetFieldValues('custrecord_pp_ach_subsidiaries');
					  	if(valAchSubsidiaries){
							// go through the list of the selected subsidiaries and verify they are valid for the entity
							var selValues = new Array();
							var resetSelection = false;
							for(var j=0; j < valAchSubsidiaries.length; j++){
								var found = false;
								for(var i = 0; i < entitySubsidiaries.length; i++){
									var entitySubsidiary = entitySubsidiaries[i];
									if(valAchSubsidiaries[j] == entitySubsidiary.id){
										selValues.push(valAchSubsidiaries[j]);
										found = true;
										break;
									}
								}
								if(!found){
									nlapiLogExecution('DEBUG', 'userEventBeforeSubmit','Subsidiary '+valAchSubsidiaries[j]+' not valid for entity');
									resetSelection = true;
								}
							}
							if(resetSelection){
								nlapiLogExecution('DEBUG', 'userEventBeforeSubmit', 'Invalid subsidiaries selected for the entity have been deselected');
								nlapiSetFieldValues('custrecord_pp_ach_subsidiaries', selValues);
							}
					  	}else{
							nlapiLogExecution('DEBUG', 'userEventBeforeSubmit','No subsidiaries selected');
							if(type == 'create'){
								nlapiLogExecution('DEBUG', 'userEventBeforeSubmit','select all valid subsidiaries for the entity, count='+entitySubsidiaries.length);
								// go through the list of the selected subsidiaries and verify they are valid for the entity
								var selValues = new Array();
								for(var i = 0; i < entitySubsidiaries.length; i++){
									var entitySubsidiary = entitySubsidiaries[i];
									selValues.push(entitySubsidiary.id);
									nlapiLogExecution('DEBUG', 'userEventBeforeSubmit','add subsidiaryId='+entitySubsidiary.id);
								}
								nlapiSetFieldValues('custrecord_pp_ach_subsidiaries', selValues);
							}
					  	}
					}
				}
			} catch(ex) {
				nlapiLogExecution('error', 'Error in userEventBeforeSubmit', ex.message);
			}
		}
    }
    /**/
	nlapiLogExecution('DEBUG', 'userEventBeforeSubmit', 'end');
}
  

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_pp_ach_account
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
  
	nlapiLogExecution('DEBUG', 'userEventAfterSubmit', 'type='+type);
	if(type == 'create' || type == 'edit'){
		var action = 'START';
		try{
			// if is primary account is set, find all ACH accounts for this entity with primary set and unset them 
			var id = nlapiGetRecordId();
			var recordType = nlapiGetRecordType();
			var entityId = nlapiGetFieldValue('custrecord_pp_ach_entity');
			var entityName = nlapiGetFieldText('custrecord_pp_ach_entity');
			var isPrimary = nlapiGetFieldValue('custrecord_pp_ach_is_primary');
			nlapiLogExecution('DEBUG', 'userEventAfterSubmit', 'record id='+id+', record type='+recordType);
			var depositWithdrawal = nlapiGetFieldText('custrecord_pp_ach_deposit_withdrawal');
			
			if(isPrimary == 'T'){
				var otherPrimaryIds = findEntitiesOtherPrimaryACHAccounts(entityId,id,depositWithdrawal);
				if(otherPrimaryIds){
					nlapiLogExecution('DEBUG', 'userEventAfterSubmit', 'otherPrimaryIds.length='+otherPrimaryIds.length);
				}
				for(var i = 0; i < otherPrimaryIds.length; i++){
					var orec = nlapiLoadRecord(recordType, otherPrimaryIds[i]);
					orec.setFieldValue('custrecord_pp_ach_is_primary','F');
					nlapiSubmitRecord(orec, false, true);
				}
			}
			
			var recType = getEntityType(entityId);
			nlapiLogExecution('DEBUG', 'userEventAfterSubmit', 'recType='+recType);
			// Enable ACH on entity
			if(type == 'create' && nlapiGetFieldValue('custpage_enable_ach') == 'T'){
				nlapiLogExecution('DEBUG', 'Entity ACH Enabled Set To', 'T');
				action = 'ENABLE_ACH';
				nlapiSubmitField(recType,entityId,'custentity_pp_ach_enabled', 'T');
			}
			// If ACH account is set to not active or being deleted, check to see if entity has any active ACH accounts, disable ACH if doesn't
			else if(nlapiGetFieldValue('isinactive') == 'T' || type == 'delete'){
				if(findEntitiesNumActiveACHAccounts(entityId) == 0){
					if(nlapiLookupField(recType,entityId,'custentity_pp_ach_enabled') == 'T'){
						nlapiLogExecution('DEBUG', 'Entity ACH Enabled Set To', 'F');
						action = 'DISABLE_ACH';
						nlapiSubmitField(recType,entityId,'custentity_pp_ach_enabled', 'F');
					}
				}
			}
			
			var numWACHAccounts = findEntitiesNumActiveACHAccounts(entityId,'Withdrawal');
			if(numWACHAccounts != nlapiLookupField(recType,entityId,'custentity_pp_num_wach_accounts')){
				nlapiLogExecution('DEBUG', 'custentity_pp_num_wach_accounts To', numWACHAccounts);
				action = 'SET_WITHDRAWAL_ACH_NUM';
				nlapiSubmitField(recType,entityId,'custentity_pp_num_wach_accounts',numWACHAccounts);
			}
		} catch(ex) {
			if ( ex instanceof nlobjError ){
				var errTitle = ex.getCode();
				var errMsg = ex.getDetails();
				if(ex.getCode()=='INSUFFICIENT_PERMISSION'){
					errMsg = errMsg + ' \n' + 'We were unable to update the '+recType+' record for '+entityId+' - '+entityName+' to enable/disable the ACH Enabled checkbox. ';
					errMsg = errMsg + ' \n' + 'Please select Cancel on the  ACH Account record (it is already saved). ';
					errMsg = errMsg + ' \n' + 'Then, please, edit the '+recType+' record for '+entityId+' - '+entityName+', go to the AvidXchange subtab, and';
					if(action == 'ENABLE_ACH'){
						errMsg = errMsg + ' check the ACH Enabled box.';
					}else if(action == 'DISABLE_ACH'){
						errMsg = errMsg + ' uncheck the ACH Enabled box.';
					}else{
						//Not sure that any extra statement is needed here, so, nothing for now.
					}
					errMsg = errMsg + ' \n' + 'Then click Save.';
				}
			}else{
				var errTitle = 'Unexpected Error';
				var errMsg = ex.toString();
			}
			throw nlapiCreateError( errTitle, errMsg );
		}
	}
}


/**
 * Find number of active ACH acounts for entity
 * 
 * @param entityId - The entityId of the current record
 * @param depositOrWithdrawal - option param to filter by Deposit or Withdrawal
 * @returns {Int} - num records found
 */
function findEntitiesNumActiveACHAccounts(entityId,depositOrWithdrawal){
	
	var recordType = nlapiGetRecordType();
	var filters = [];
	
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_entity',null,'is',entityId));
	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	
	if(depositOrWithdrawal){
		filters.push(new nlobjSearchFilter('custrecord_pp_ach_deposit_withdrawal',null,'is',$PPS.nlapiGetList('customlist_pp_ach_deposit_withdrawal').getKey(depositOrWithdrawal)));
	}
	
	var searchResults = nlapiSearchRecord(recordType, null, filters, null);
	if(searchResults){
		return searchResults.length;
	}
	return 0;
}

function getEntityType(entityId){
	nlapiLogExecution('DEBUG', 'getEntityType','entityId='+entityId);
	var filters = [];

	filters.push(new nlobjSearchFilter('internalid',null,'anyof',[entityId]));
	var searchResults = nlapiSearchRecord('entity', null, filters, null);
	if(searchResults){
	nlapiLogExecution('DEBUG', 'getEntityType','return searchResults[0].recordType='+searchResults[0].recordType);
		return searchResults[0].recordType;
	}
	nlapiLogExecution('DEBUG', 'getEntityType','return null');
	return null;
}

/**
 * Find other ACH accounts set as primary
 * 
 * @param entityId - The entityId of the current record
 * @param achAccountId - The current record that was saved
 * @param depositOrWithdrawal - Deposit or Withdrawal
 * @returns {Array} - an array of recordIds
 */
function findEntitiesOtherPrimaryACHAccounts(entityId,achAccountId,depositOrWithdrawal){
	nlapiLogExecution('DEBUG', 'findEntitiesOtherPrimaryACHAccounts','params=('+entityId+','+achAccountId+','+depositOrWithdrawal+')');
	var recIds = [];
	var recordType = nlapiGetRecordType();
	var filters = [];
	//[S19112] new records do not have an Id until saved
	if(achAccountId!=null){
		filters.push(new nlobjSearchFilter('internalid',null,'noneof',[achAccountId]));
	}
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_entity',null,'is',entityId));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_is_primary',null,'is','T'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ach_deposit_withdrawal',null,'is',$PPS.nlapiGetList('customlist_pp_ach_deposit_withdrawal').getKey(depositOrWithdrawal)));

	
	var searchResults = nlapiSearchRecord(recordType, null, filters, null);
	if(searchResults){
	nlapiLogExecution('DEBUG', 'findEntitiesOtherPrimaryACHAccounts','searchResults.length='+searchResults.length);
		for(var i = 0; i < searchResults.length; i++){
			recIds.push(searchResults[i].getId());
		}
	}
	nlapiLogExecution('DEBUG', 'findEntitiesOtherPrimaryACHAccounts','Done');
	return recIds;
}

