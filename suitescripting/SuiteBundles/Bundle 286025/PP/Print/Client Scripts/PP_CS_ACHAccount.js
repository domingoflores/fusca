/**
 * Client script for customrecord_pp_ach_account custom record. 
 * This module does client side validation on ACH Account fields
 * 
 * Version    Date            Author           Remarks
 * 2.14       22 Jun 2018     johnr            [S23663] Handle entity change in OneWorld accounts & validate subsidiary selection
 * 1.00       22 Feb 2013     Max Menlove
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord customrecord_pp_ach_account
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */

var PP_ROUTING_NUM_FIELD_ID = 'custrecord_pp_ach_routing_number';
var PP_ACH_EMAIL_FIELD_ID = 'custrecord_pp_ach_payee_email';
//[S23663] Handle entity change in OneWorld accounts
var PP_ACH_SUBSIDIARIES = 'custrecord_pp_ach_subsidiaries';
var PP_ACH_ENTITY = 'custrecord_pp_ach_entity';

var alertMessage = ''; 

function clientValidateField(type, name, linenum){
	if(name == PP_ROUTING_NUM_FIELD_ID){
		var val = nlapiGetFieldValue(PP_ROUTING_NUM_FIELD_ID);
		if(validRoutingNumber(val)){
			return true;
		}else{
			alert("Your routing number might be invalid.");
			return true;
		}
	}
	else if(name == PP_ACH_EMAIL_FIELD_ID){
		var val = nlapiGetFieldValue(PP_ACH_EMAIL_FIELD_ID);
		if(val.length > 0 && !validEmailAddresses(val)){
			//S6059: Change alert message to indicate the email *may* be invalid + return true so the alert can be closed & the user can fix or not
			alert("One or more email addresses might be invalid");
			return true;	
		}
		else{
			return true;
		}
	}
    return true;
}

function validEmailAddresses(value){
	var val = value.replace(/;/g,",");
	var emailsArr = val.split(',');
	for(var i = 0; i < emailsArr.length; i++){
		if(!validEmailAddress(emailsArr[i])){
			return false;
		}
	}
	return true;
}

function validEmailAddress(value){
	var value = jQuery.trim(value);
	//S6059: Allow & in the email address
	if(value.match(/^[&_a-z0-9-]+(\.[&_a-z0-9-]+)*@[&a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/i)){
		return true;
	}
	return false;
}

function validRoutingNumber(value){
	if(value.match(/-/)){
		return true;
	}
    if(!value.match(/^[0-9]{9}$/)){
        return false;
    }
    var cd = value.substr(8,1);
    var coeff = [3,7,1,3,7,1,3,7,1];

    var checksum = 0;
    for(var i =0; i < 9; i++){
        checksum += coeff[i] * parseInt(value.charAt(i));
    }

    if(checksum % 10 != 0){
        return false;
    }
    return true;
}

/* 
 * Get access level of field
 * returns a string (view,edit,none)
 */
function getFieldAccess(fieldName){
	var f = nlapiGetField(fieldName);
	
	if(f.readonly){
		return 'view';
	}
	else if(f.hidden){
		return 'none';
	}
	else{
		return 'edit';
	}
}

//[S23663] Handle entity change in OneWorld accounts & validate subsidiary selection
function validSubsidiaries(){
	nlapiLogExecution('DEBUG', 'validSubsidiaries');
	var val = nlapiGetFieldValues(PP_ACH_SUBSIDIARIES);
	if(val && val.length > 0){
		nlapiLogExecution('DEBUG', 'validSubsidiaries', val.length+' subsidiaries selected');
		// if there are selected subsidiaries, verify they are valid for the entity 
		var entityId = nlapiGetFieldValue('custrecord_pp_ach_entity');
		if(entityId){
			// if an entity is selected, verify the selected subsidiaries are valid for this entity 
			nlapiLogExecution('DEBUG', 'validSubsidiaries','entityId = '+entityId);
			// Try to hit clienthelper to get list of subsidiaries for the entity
			var subsidiaryIds = [];
			try{
				subsidiaryIds = getEntitySubsidiaryIds(entityId);
				if(subsidiaryIds && subsidiaryIds.length > 0){
					nlapiLogExecution('DEBUG', 'validSubsidiaries', subsidiaryIds.length+' subsidiaries valid for entity');
					// compare the selected subsidiaries to the list of subsidiaries valid for the entity 
					var found = false;
					for(var i = 0; i < val.length; ++i){
						nlapiLogExecution('DEBUG', 'validSubsidiaries','checking selected val = '+val[i]);
						for(var j = 0; j < subsidiaryIds.length; ++j){
							nlapiLogExecution('DEBUG', 'validSubsidiaries','against entity subsidiaryId = '+subsidiaryIds[j].id);
							if(val[i] == subsidiaryIds[j].id){
								nlapiLogExecution('DEBUG', 'validSubsidiaries', 'subsidiaryId='+val[i]+' is valid for entityId='+entityId);
								found = true;	// flag when we find a match, and stop looking
								break;
							}
						}
						if(!found){
							nlapiLogExecution('DEBUG', 'validSubsidiaries', 'subsidiaryId='+val[i]+' is not valid for entityId='+entityId);
							return false;	// if we didn't find a match, we can return false without checking any more 
						}
						found = false;	// reset the flag for the next selected subsidiary
					}
				}
			}
			catch(e){
				//Couldn't get subsidiaryIds
				$PPS.logException(e, 'ERROR');
			}
		}else{
			alertMessage = 'Please select an entity before selecting a subsidiary. Subsidiaries available for selection are based on the entity.';
			nlapiLogExecution('DEBUG', 'validSubsidiaries', alertMessage);
			nlapiSetFieldValues('custrecord_pp_ach_subsidiaries', null, false);
			return false;
		}
	}
	nlapiLogExecution('DEBUG', 'validSubsidiaries','end');
	return true;	// if we get here, we must be OK
}


//[S23663] Handle entity change in OneWorld accounts & validate subsidiary selection
function fieldChanged(type, name, linenum){
	nlapiLogExecution('DEBUG', 'fieldChanged','start, type = '+type+', name = ' + name	);
	if(name == 'custrecord_pp_ach_entity'){
		var subsidiariesEnabled = nlapiGetContext().getFeature('SUBSIDIARIES');
		if (subsidiariesEnabled) {
			entityChanged();
		}
	}
	else if(name == PP_ACH_SUBSIDIARIES){
		//[S23663] validate subsidiary selection for entity
		nlapiLogExecution('DEBUG', 'fieldChanged','PP_ACH_SUBSIDIARIES changed');
		if(!validSubsidiaries()){
			if(alertMessage != ''){
				alert(alertMessage);
				alertMessage = ''; //clear it for the next time
			}else{
				alert("One or more subsidiaries selected are not valid for this entity");
			}
			return false;
		}
	}
	nlapiLogExecution('DEBUG', 'fieldChanged','end');
}

//[S23663] Handle entity change in OneWorld accounts & validate subsidiary selection
function entityChanged() {
	nlapiLogExecution('DEBUG', 'entityChanged');
	var entityId = nlapiGetFieldValue('custrecord_pp_ach_entity');
	if(entityId){
		// Try to hit clienthelper to get list of subsidiaries for the entity
		try{
			var entitySubsidiaries = getEntitySubsidiaryIds(entityId);
			if(entitySubsidiaries && entitySubsidiaries.length > 0){
				nlapiLogExecution('DEBUG', 'entityChanged', entitySubsidiaries.length+' subsidiaries valid for entity');
				// entitySubsidiaries contains IDs and names, we just want IDs
				var subsidiaryIds = [];
				for(var i = 0; i < entitySubsidiaries.length; i++){
					var subId = entitySubsidiaries[i].id;
					if(subId || subId === 0){
						nlapiLogExecution('DEBUG', 'getEntitySubsidiaryIds','subId = '+subId);
						subsidiaryIds.push(subId);
					}
				}
				nlapiSetFieldValues('custrecord_pp_ach_subsidiaries', subsidiaryIds, false);
			}
		}
		catch(e){
			//Couldn't get subsidiaryIds
			nlapiLogExecution('ERROR','entityChanged',e);
		}
	}else{
		// if no entityId, we need to clear the subsidiaries list
		nlapiSetFieldValues('custrecord_pp_ach_subsidiaries', null, false);
	}
	nlapiLogExecution('DEBUG', 'entityChanged','end');
}

//[S23663] Handle entity change in OneWorld accounts & validate subsidiary selection
//Get An entities ACH accounts from the server using the public client helper
function getEntitySubsidiaryIds(entityId){
	nlapiLogExecution('DEBUG', 'getEntitySubsidiaryIds','entityId = '+entityId);
	var clientHelperUrl = nlapiResolveURL('SUITELET','customscript_pp_sl_clienthelper','customdeploy_pp_sl_clienthelper_pub');
	 
	var jsdata = null;
	jQuery.ajax(clientHelperUrl + '&action=getEntitySubsidiaryIds',{
	    	type: 'POST',
	    	contentType: 'application/json; charset=utf-8',
	    	dataType: 'json',
	    	processData: false,
	    	data: JSON.stringify({'entityId': entityId}),
	    	async: false,
	    	success: function(data){
	    		jsdata = data;
	    	}
	    });
	
	return jsdata;
}

//[S23663] validate any subsidiary selection
function saveRecord() {
	if(!validSubsidiaries()){
		if(alertMessage != ''){
			alert(alertMessage);
			alertMessage = ''; //clear it for the next time
		}else{
			alert("One or more subsidiaries selected are not valid for this entity");
		}
		return false;
	}
	return true;
}