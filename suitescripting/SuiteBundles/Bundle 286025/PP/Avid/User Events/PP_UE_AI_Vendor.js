//S16677 - Serin Hale - 7/28/2017
//Updates any open AI Imported Invoice records when the vendor record is updated to include new subsidiaries. 
//This is part of what allows the invoice list to be limited by subsidiary.

function vendorAfterSubmit(type) {
	try {
		var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
		if (isOneWorld == false) {
			return;
		}
		var vendorId = nlapiGetRecordId();
		var oldRec = nlapiGetOldRecord();
		var newRec = nlapiGetNewRecord();
		var oldSubsidList = [];
		var newSubsidList = [];
		var oldCount = oldRec.getLineItemCount('submachine');

		for (var b = 1; b <= oldCount; b++) {
			oldSubsidList.push(oldRec.getLineItemValue('submachine', 'subsidiary', b));
		}

		var newCount = newRec.getLineItemCount('submachine');
		for (var c = 1; c <= newCount; c++) {
			newSubsidList.push(newRec.getLineItemValue('submachine', 'subsidiary', c));
		}
		oldSubsidList = oldSubsidList.sort(); //doesn't matter how it sorts, just as long as it does the same for both
		newSubsidList = newSubsidList.sort();

		if (oldSubsidList.toString() == newSubsidList.toString()) {
			//same - no update needed
		} else {
			nlapiLogExecution('debug', 'subsid list changed', newSubsidList.toString());
			var aiFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')
				, new nlobjSearchFilter('custrecord_ai_inv_vendor', null, 'anyof', vendorId)
				, new nlobjSearchFilter('custrecord_ai_inv_bill', null, 'anyof', '@NONE@')
			];
			var aiColumns = [new nlobjSearchColumn('internalid')];

			var aiResults = nlapiSearchRecord('customrecord_ai_imported_invoices', null, aiFilters, aiColumns);

			for (var a = 0; a < aiResults.length; a++) {
				nlapiSubmitField('customrecord_ai_imported_invoices', aiResults[a].getValue('internalid'), 'custrecord_pp_subsid_list', newSubsidList);
				nlapiLogExecution('debug', 'updating ai imported invoice ' + aiResults[a].getValue('internalid'), newSubsidList.toString());
			}
		}

	}catch (ex) {
		nlapiLogExecution('error', 'Error in vendorAfterSubmit', ex.message);
	}
}