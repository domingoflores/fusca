/**
 * Client script for the PP APN Payment Batch custom record. Adds a callback for the sync button.
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Aug 2015     mmenlove
 *
 */


function triggerAPNSync(){
	if(confirm('Are you sure you want to trigger a manual sync? Manual syncs happen via scheduled scripts and can take a while. You will know when the sync is finished when the sync checkbox is no longer checked.')){
		try{
			var rec = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());
			rec.setFieldValue('custrecord_pp_apn_pb_sync', 'T');
			nlapiSubmitRecord(rec);
			location.reload();
		}
		catch(e){
			alert(e.description);
		}
	}
}
