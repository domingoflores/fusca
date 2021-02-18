/**************************************************************************

Automatically sets the default values on new escrow events

Date Created: 7.6.13 (PRW)
Last Modified: 

***************************************************************************/



function BLSetEventDefaults(type, form, request){
	if(request == null){
		nlapiLogExecution('DEBUG', 'request parameter', 'This event was not created from the link on the non-used Escrow Information (QX) record');
		return false;
	}
	// Get parameter
	var escrowInfoId = request.getParameter('qx_referencescrowinformation');
        //LOG 
        nlapiLogExecution('DEBUG', 'STS TEST for type', type);
        nlapiLogExecution('DEBUG', 'STS TEST for form', form);
        nlapiLogExecution('DEBUG', 'STS TEST for request', request);
	nlapiLogExecution('DEBUG', 'Escrow Info Record: ' + escrowInfoId);

	// Load Record if parameter is not empty
	if (escrowInfoId == null || escrowInfoId == '') return;
	var escrowInfoRec = nlapiLoadRecord('customrecord_qx_escrowinformation', escrowInfoId);
	
	// Set Default Values
	nlapiSetFieldValue('company', escrowInfoRec.getFieldValue('custrecord_qx_esc_customer'));	
	nlapiSetFieldValue('custevent_gl_account', escrowInfoRec.getFieldValue('custrecord_qx_esc_glaccount'));
	nlapiSetFieldValue('custevent28', escrowInfoRec.getFieldValue('custrecord_qx_esc_type'));
	nlapiSetFieldValue('custevent29', escrowInfoRec.getFieldValue('custrecord_qx_esc_percentreleased'));
	nlapiSetFieldValue('startdate', escrowInfoRec.getFieldValue('custrecord_qx_esc_releasedate'));
	nlapiSetFieldValue('custevent30', escrowInfoRec.getFieldValue('custrecord_qx_esc_comments'));

}

