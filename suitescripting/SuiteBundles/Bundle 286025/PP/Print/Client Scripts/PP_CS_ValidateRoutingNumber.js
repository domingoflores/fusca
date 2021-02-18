/**
 * This module does client side validation on entity forms(Vendor,Customer and Employee)
 * PP_CS_ValidateRoutingNumber.js is a misnomer. 
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Feb 2013     Jason Foglia
 *
 */

// Custom fields that are mandatory if ACH is checked
var mandatoryFields = [
                       'custentity_pp_ach_account_number', 
                       //'custentity_pp_ach_deposit_withdrawal',
                       'custentity_pp_ach_routing_number',
                       'custentity_pp_ach_sec_code',
                       'custentity_pp_ach_transaction_code'
];

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */

function clientValidateField(type, name, linenum){
	if(name == "custentity_pp_ach_routing_number"){
		var val = nlapiGetFieldValue('custentity_pp_ach_routing_number');
		if(validRoutingNumber(val)){
			return true;
		}else{
			alert("Your routing number might be invalid.");
			return true;
		}
	}
	else if(name == 'custentity_pp_ach_payee_email'){
		var val = nlapiGetFieldValue('custentity_pp_ach_payee_email');
		if(val.length > 0 && !validEmailAddresses(val)){
			alert("One ore more email addresses are invalid");
			return false;
		}
		else{
			return true;
		}
	}
	else if(name == 'custentity_pp_ach_enabled'){
		var val = nlapiGetFieldValue(name);
		if(val == 'T'){
			decorateFieldsAsMandatory();
		}
		else{
			undecorateFieldsAsMandatory();
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
	if(value.match(/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/i)){
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

// Add astrix to field label
function decorateFieldsAsMandatory(){
	var l = mandatoryFields.length;
	for(var i = 0; i < l; i++){
		var fld = nlapiGetField(mandatoryFields[i]);
		var input = jQuery(fld.uifield);
		input.closest('tr').find('span.labelSpanEdit a').prepend('<img src="/images/chiles/pageTitle/required.png" title="Required Field" class="required_icon"/>');
	}
}

// Remove astrix from field label
function undecorateFieldsAsMandatory(){
	var l = mandatoryFields.length;
	for(var i = 0; i < l; i++){
		var fld = nlapiGetField(mandatoryFields[i]);
		var input = jQuery(fld.uifield);
		input.closest('tr').find('span.labelSpanEdit a img.required_icon').remove();
	}
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

/*
 * Page Init callback
 */
function pageInit(){
	if(getFieldAccess('custentity_pp_ach_enabled') == 'edit'){
		var achEnabled = nlapiGetFieldValue('custentity_pp_ach_enabled');

		if(achEnabled == 'T'){
			decorateFieldsAsMandatory();
		}
	}
}

/*
 * Save Record callback
 */
function saveRecord(type,name){
	if(getFieldAccess('custentity_pp_ach_enabled') == 'edit'){
		// make ACH fields mandatory when ACH enabled is checked
		var achEnabled = nlapiGetFieldValue('custentity_pp_ach_enabled');
		if(achEnabled == 'T'){
			
			var l = mandatoryFields.length;
			for(var i = 0; i < l; i++){
				var fld = nlapiGetField(mandatoryFields[i]);
				var label = fld.getLabel();
				// If it has an image, we only want the text
				label = jQuery('<div></div>').append(label).text();
				var val = nlapiGetFieldValue(mandatoryFields[i]);
				
				if(val == ''){
					alert(label + ' is a required field when ACH is enabled.');
					return false;
				}
			}
		}
	}
	return true;
}
