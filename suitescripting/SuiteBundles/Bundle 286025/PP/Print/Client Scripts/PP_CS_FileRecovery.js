var filterHelper = new NSFormFilterClientHelper();

function clientPageInit(type){
	if(typeof filtersToRegister != 'undefined'){
		filterHelper.registerFilters(filtersToRegister);
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum){
	filterHelper.onFieldChange(type, name, linenum);
}
