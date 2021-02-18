/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Apr 2014     smccurry
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	nlapiLogExecution('DEBUG', 'type', type);
	if(type == 'view' || type == 'edit') {
		var recID = nlapiGetRecordId();
		var recType = nlapiGetRecordType();
		var rmaRec = nlapiLoadRecord(recType, recID);

		var lotTransURL = nlapiResolveURL('SUITELET', 'customscript_srs_lot_transform_s', 'customdeploy_srs_lot_transform_s', false);
		lotTransURL += '&rec_id='+ recID;
//		lotTransURL += '&rec_type='+ recType;
		var takeOverWindow = "window.location='"+lotTransURL+"'";
		nlapiLogExecution('DEBUG', 'Suitelet URL', lotTransURL);
//		add another button for to create a list of Piracle records - currently turned off
		var achListURL = nlapiResolveURL('SUITELET', 'customscript_srs_lot_transform_list_s', 'customdeploy_srs_lot_transform_list_s', false);
		var listWindow = "window.location='"+achListURL+"'";
		if(rmaRec.getFieldValue('custbody_acq_lot_payment_method_2') == 1 && rmaRec.getFieldValue('custbody_acq_lot_payment_method_3') == 1) {
			form.addButton('custpage_create', 'Create Piracle ACH', takeOverWindow);
			form.addButton('custpage_create_list', 'List all Piracle ACH', listWindow);
		}
	}
}
