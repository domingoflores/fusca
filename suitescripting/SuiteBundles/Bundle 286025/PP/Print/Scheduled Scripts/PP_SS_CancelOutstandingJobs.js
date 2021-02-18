/**
 * Find all old jobs that are not complete or failed and set their status to Fail.
 * A Job is considered old if it has been running yesterday or earlier
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Dec 2013     maxm
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	var filters = [];
	var columns = [];
	
	// find all where job status is not Fail or Complete
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Fail'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnot','Complete'));
	filters.push(new nlobjSearchFilter('custrecord_pp_ps_status',null,'isnotempty'));
	
	var date = new Date();
	var d = date.getDate();
    date.setDate(d-1);
	filters.push(new nlobjSearchFilter('created',null,'onorbefore',date));
	
	var searchResults = nlapiSearchRecord('customrecord_pp_print_status', null, filters, columns);
	if(searchResults){
		for(var i = 0; i < searchResults.length; i++){
			var rec = nlapiLoadRecord('customrecord_pp_print_status',searchResults[i].getId()); // 2 units
			rec.setFieldValue('custrecord_pp_ps_status', 'Fail');
			rec.setFieldValue('custrecord_pp_ps_statusmsg', 'Cancelled by scheduled script.');
			nlapiSubmitRecord(rec); // 4 units
		}
	}	
}
