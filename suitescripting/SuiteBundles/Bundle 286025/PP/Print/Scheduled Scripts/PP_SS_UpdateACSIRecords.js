function updateCSI() {
	try{
		var context = nlapiGetContext();
		var filters = [
			new nlobjSearchFilter('custbody_pp_check_stub_info', null, 'noneof', '@NONE@'),
			//new nlobjSearchFilter('custbody_pp_is_printed', null, 'is', 'F'),
			new nlobjSearchFilter('mainline', null, 'is', 'T'),
			//new nlobjSearchFilter('type', null, 'anyof', 'vendorpayment'),
			new nlobjSearchFilter('custrecord_pp_applied_to_bill_payment', 'custbody_pp_check_stub_info', 'anyof', '@NONE@')
		];
		var columns = [
			new nlobjSearchColumn('internalid'), 
			new nlobjSearchColumn('custbody_pp_check_stub_info')
		];
		var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
		nlapiLogExecution('debug', 'searchResults', searchResults);
		if (searchResults != null) {
			for (var a = 0; a < searchResults.length; a++) {
				nlapiLogExecution('debug', 'updating', searchResults[a].getValue('custbody_pp_check_stub_info'));
				nlapiSubmitField('customrecord_pp_check_stub_info', searchResults[a].getValue('custbody_pp_check_stub_info'), 'custrecord_pp_applied_to_bill_payment', searchResults[a].getValue('internalid'));
				if (context.getRemainingUsage() <= 100) {
					//reschedule script
					nlapiScheduleScript('customscript_pp_ss_update_acsi_recs','customdeploy_pp_ss_update_acsi_recs');
				}
			}
		}

	} catch(ex) {
		nlapiLogExecution('error', 'Error in updateCSI', ex.message);
	}
}