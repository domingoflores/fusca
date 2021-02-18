/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.03       23 Jun 2014     smccurry		   Initial release on production.
 * Creates the new version of the 'Approve and Create DA' button on the Exchange Record and the RMA
 * 1.04		  10 Oct 2014	  smccurry
 * Deleted unused lines, add lines to support button being added for 'returnauthorization' thread of the code.
 * The corresponding Restlet does not have the code finished to support return authorization.  It may not need
 * to be finished if all of the RMAs are successfully moved to Exchange Records.
 * 
 * This script should be combined with the ACQ_LOT_Processes_UE.js and other Ex Rec related user events scripts
 * when time allows for clean up of code.
 * 
 */

//Call all functions that need to be performed Before the Record is Submitted

function userEventBeforeLoadLOT(type, form, request) {
	var context = nlapiGetContext();
	if(type == 'view' && context.getExecutionContext() == 'userinterface') {
		
		var rec = nlapiGetNewRecord();
		var recID = nlapiGetRecordId();
		var recType = nlapiGetRecordType();
		var tranID = null;
		if(recType == 'returnauthorization') {
			tranID = rec.getFieldValue('tranid');
		} 
		if(recType == 'customrecord_acq_lot') { 
			tranID = recID;
		}
		form.setScript('customscript_acq_lot_da_ajax_cs');
		// Create URL for 'Create DA Button'
		var lotTransURL = nlapiResolveURL('SUITELET', 'customscript_acq_lot_da_approv_status_s', 'customdeploy_acq_lot_da_approv_status_s', false);
		lotTransURL += '&txnid='+ recID;
		lotTransURL += '&txntype='+ recType;
		lotTransURL += '&tran_id='+ tranID;
		var takeOverWindow = "window.location='"+lotTransURL+"'";
//		nlapiLogExecution('DEBUG', 'Suitelet URL', lotTransURL);
		
		// IF TYPE IS EXCHANGE RECORD
		if(recType == 'customrecord_acq_lot') {
//			var exRec = nlapiGetNewRecord();
//			var sHolderRec = nlapiLoadRecord('customer', exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_shareholder')); //custrecord_acq_loth_zzz_zzz_isamtfinal
//			if(nlapiGetFieldValue('custrecord_acq_loth_reviewcomplete') == 'T') {
//				form.addButton('custpage_create', 'Approve & Create Refund Page', takeOverWindow);
//			}
		// Add a hidden field to hold the CREDIT MEMO status value. maybe this should be visible.
			var recid_fld = form.addField('custpage_recid', 'text', '').setDisplayType('hidden');
			recid_fld.setDefaultValue(recID);
			var rectype_fld = form.addField('custpage_rectype', 'text', '').setDisplayType('hidden');
			rectype_fld.setDefaultValue(recType);
			var tranid_fld = form.addField('custpage_tranid', 'text', '').setDisplayType('hidden');
			tranid_fld.setDefaultValue(exRec.getFieldValue('id'));
		}
		// IF TYPE IS RETURN AUTHORIZATION RECORD
//		if(recType == 'returnauthorization') {
//			if(nlapiGetFieldValue('custbody_acq_lot_reviewed') == 'T') {
//				form.addButton('custpage_create_refund', 'Delete Memo/Refund', takeOverWindow);
//			}
//		}
		
		var dateCreated;
		objExchangeRecordFields = search.lookupFields({type:"customrecord_acq_lot" ,id:recID   
            ,columns: ["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.datecreated" 
                      ]});
		dateCreated = objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.datecreated"];
		if (dateCreated) {
			var dtNow = new Date();
			var arrayToday = dtNow.toISOString().split("T");
			var todayMS = Date.parse(arrayToday[0]+"T00:00:00.000Z");
			var dateCreatedMS = Date.parse(dateCreated);
			if (dateCreatedMS >= todayMS) { form.addButton('custpage_create_refund', 'Delete Memo/Refund', takeOverWindow); }
		}
		
	}
}


