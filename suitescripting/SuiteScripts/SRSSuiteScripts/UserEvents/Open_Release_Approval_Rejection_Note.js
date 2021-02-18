/**
 * Module Description
 * Built to be used with the Release Approval Record 
 * This Script will popup a Notes record window and associate the Note Record   
 * with the Rejected Release Approval Record.
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Oct 2016     Scott			   Hackie McHackerstien
 *
 */


function openRejectionNote(){

	var recType = nlapiGetRecordType();
	var recId = nlapiGetRecordId();
	var goToURL = '/app/crm/common/note.nl?l=T&refresh=usernotes&perm=LIST_CUSTRECORDENTRY&recordtype=658&record=6&_ts='+(new Date).getTime();
	var urlParams = {
		refresh:'usernote',
		perm: 'LIST_CUSTRECORDENTRY',
		recordtype: 658,
		record: recId,
		'_ts': (new Date).getTime(),
		type: 14,
		redirect: true
	};

	//nlOpenWindow('/app/crm/common/note.nl?l=T&refresh=usernotes&perm=LIST_CUSTRECORDENTRY&recordtype=658&record=6&_ts='+(new Date).getTime(), 'newnote','width=640,height=640,resizable=yes,scrollbars=yes');
	//nlOpenWindow('/app/crm/common/note.nl?l=T&refresh=usernotes&perm=LIST_CUSTRECORDENTRY&recordtype=658&record='+ recId +'&_ts='+(new Date).getTime(), 'newnote','width=640,height=640,resizable=yes,scrollbars=yes');
	//window.open('/app/crm/common/note.nl?l=T&refresh=usernotes&perm=LIST_CUSTRECORDENTRY&recordtype=658&record='+ recId +'&_ts='+(new Date).getTime(), 'newnote','width=640,height=640,resizable=yes,scrollbars=yes');
	nlapiSetRedirectURL('RECORD', 'note', null, true, urlParams);

	//Do I have to Submit the Release Record and then redirect to a non edit version of the Release Record I just submited


	nlapiLogExecution('DEBUG', 'Testing this out', 'DID IT WORK');

return true;

}

function redirectNote(type){
	var record = nlapiGetNewRecord();
	nlapiLogExecution('DEBUG', 'redirectNote function', JSON.stringify(record));
}