/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 May 2014     smccurry
 * 1.01		  06 Oct 2014	  smccurry		Added apiCallClearinghouse and deleted other unused functions.
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */

//GET DATA BUTTON ON THE 'CLEARINGHOUSE DATA' TAB ON THE EXCHANGE RECORD
function apiCallClearinghouse() {
	document.getElementById('sync_response').innerHTML = '<br><p class="inputreadonly">&nbsp;&nbsp;Connecting to Clearinghouse...</p>';
	var results = searchExchangeRecord(nlapiGetRecordId());
	if(results != null && results.length > 0) {
		var hashID = results[0].getValue('custrecord_acq_loth_zzz_zzz_exchangehash');
		var hashTxt = results[0].getText('custrecord_acq_loth_zzz_zzz_exchangehash');
		var shEmail = results[0].getValue('custrecord_acq_loth_1_de1_shrhldemail');
		var url = 'https://clearinghouse.srsacquiom.com/send/request/lot/'+ nlapiGetRecordId() +'/'+ hashID +'/'+ hashTxt +'/' + shEmail;
		console.log(url);
		var response = nlapiRequestURL(url);
		var responseData = response.body;
//		console.log(responseData);
		if(responseData != null && responseData != '') {
			var responseObj = JSON.parse(responseData);
			if(responseObj.status == false) {
				document.getElementById('sync_response').innerHTML = '<br><p class="inputreadonly">&nbsp;&nbsp;ERROR: ' + responseObj.message + '.<br>&nbsp;&nbsp;Please contact SRS NetSuite support.</p>';
			} else if (responseObj.status == true) {
				var messageHTML = '<br><p class="inputreadonly">&nbsp;&nbsp;Boomi has been triggered to begin syncing data.  Please wait at least 5 minutes and then refresh this page.</p><br>';
				var steps = responseObj.data.lot_steps;
				console.log(JSON.stringify(steps));
				for(var s = 0; s < steps.length; s++) {
					console.log(steps[s].step_name);
					if(steps[s].step_status == false) {
						messageHTML += '<p class="inputreadonly">&nbsp;&nbsp;' + steps[s].step_name + ':  Not started.</p>';
					} else if(steps[s].step_status == true) {
						messageHTML += '<p class="inputreadonly">&nbsp;&nbsp;' + steps[s].step_name + ':  Started.</p>';
					}
				}
				document.getElementById('sync_response').innerHTML = messageHTML;
			}
		} else {
			document.getElementById('sync_response').innerHTML = '<br><p class="inputreadonly">&nbsp;&nbsp;Problem connecting to Clearinghouse.</p>';
		}
	}
}

function searchExchangeRecord(exRecID) {
	var filters = new Array();
	filters.push(new nlobjSearchFilter('internalid', null, 'is', exRecID));
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_exchangehash'));
	columns.push(new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldemail'));
	return nlapiSearchRecord('customrecord_acq_lot', null, filters, columns );
}