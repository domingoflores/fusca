function beforeLoad(type, form) {
	if (!nlapiGetContext().getFeature('SUBSIDIARIES')) {
		var field = form.getField('custrecord_pp_subsid_list');
		field.setDisplayType('hidden');
	}
}

function addSubsidiaryBeforeSubmit(type) {
	try {
		if ((type == 'create' || type == 'edit' || type == 'xedit') && (nlapiGetContext().getFeature('SUBSIDIARIES'))) {
			var vendor = nlapiGetFieldValue('custrecord_ai_inv_vendor');
			if (vendor != null && vendor != '') {
				//look up vendor's associated subsidiaries
				var vendorFilters = [new nlobjSearchFilter('internalid', null, 'anyof', vendor)
									//[S24081] Fix AI Sync script issue with inactive subsidiaries
									,new nlobjSearchFilter('isinactive', 'msesubsidiary', 'is', 'F')];
				var vendorColumns = [new nlobjSearchColumn('internalid')
					, new nlobjSearchColumn('internalid', 'msesubsidiary', null)
					, new nlobjSearchColumn('name', 'msesubsidiary', null)
				];

				var vendorResults = nlapiSearchRecord('vendor', null, vendorFilters, vendorColumns);
				if (vendorResults != null) {
					var subsidArray = [];
					for (var a = 0; a < vendorResults.length; a++) {
						subsidArray.push(vendorResults[a].getValue('internalid', 'msesubsidiary', null));
						nlapiLogExecution('debug', 'adding to subsidArray', vendorResults[a].getValue('internalid', 'msesubsidiary', null));
					}
					
					nlapiSetFieldValue('custrecord_pp_subsid_list', subsidArray);
				}
			}
		}
	} catch(ex) {
		nlapiLogExecution('error', 'Error in addSubsidiaryBeforeSubmit', ex.message);
	}
}