function beforeLoad(type, form, request) {
	try {
		if (type != 'create' && request.getMethod() == 'GET') {
			var recId = nlapiGetRecordId();
			var ccUrl = nlapiResolveURL('SUITELET', 'customscript_pp_sl_get_cleared_check_img', 'customdeploy_pp_sl_get_cleared_check_img');
			ccUrl += '&pid=' + recId;
			nlapiLogExecution('debug', 'ccUrl', ccUrl);
			var nativeField = form.getField('custbody_pp_apn_cleared_check_img');
			nativeField.setDisplayType('inline');
			nativeField.setLinkText('Click here to view Cleared Check Images');
			nativeField.setDefaultValue(ccUrl);

		}
	} catch(ex) {
		nlapiLogExecution('error', 'error in beforeLoad', ex.message);
	}
}

