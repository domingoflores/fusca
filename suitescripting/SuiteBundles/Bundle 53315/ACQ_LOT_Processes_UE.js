 /* Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.03       23 Jun 2014     smccurry		   Initial release on production.
 * Creates the new version of the 'Approve and Create DA' button on the Exchange Record and the RMA
 * 1.04		  02 Oct 2014     smccurry		
 * Added the 'Clearinghouse Data' tab to the Exchange Record
 * 1.05		  10 Oct 2014	  smccurry
 * Deleted unused lines, add lines to support button being added for 'returnauthorization' thread of the code.
 * 1.06			9 Aug 2017		athomas
 * NS-1086: Added permissions check to see 'Delete Memo/Refund' button.
 *
 * The corresponding Restlet does not have the code finished to support return authorization.  It may not need
 * to be finished if all of the RMAs are successfully moved to Exchange Records.
 * 
 * This script should be combined with the ACQ_LOT_Processes_UE.js and other Ex Rec related user events scripts
 * when time allows for clean up of code.
 * 
 */

//Call all functions that need to be performed Before the Record is Submitted

function getPaymentDashboardURLAction(lotid){
	var lotTransURL = nlapiResolveURL('SUITELET', 'customscript_acq_lot_da_approv_list_s', 'customdeploy_acq_lot_da_approv_list_s', false);
	lotTransURL += ('&lotid='+ lotid);
	
	var takeOverWindow = "window.location='"+lotTransURL+"'";
	
	return takeOverWindow;
};

function userEventBeforeLoadLOT(type, form, request) {
	var context = nlapiGetContext();

	//<ATP-1063>
	if(context.getExecutionContext() == 'userinterface') {
		var rec = nlapiGetNewRecord();
		rec.getField('custrecord_acq_loth_zzz_zzz_w9esigndoc').setDisplayType('hidden');
		rec.getField('custrecord_acq_loth_zzz_zzz_esigndoc').setDisplayType('hidden');
	}
	//</ATP-1063>

	if(type == 'view' && context.getExecutionContext() == 'userinterface') {
				
		try {
 		
		var filter = new nlobjSearchFilter('internalid', null, 'is', 90210 );
		nlapiLogExecution('debug', 'filter', JSON.stringify(filter) );
		
         
        } 
      catch(eee) {}

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
		nlapiLogExecution('ERROR', 'Suitelet URL', lotTransURL);
		
		// IF TYPE IS EXCHANGE RECORD
		if(recType == 'customrecord_acq_lot') {
			var urlAction = getPaymentDashboardURLAction(recID);
			var exRec = nlapiGetNewRecord();
			//var sHolderRec = nlapiLoadRecord('customer', exRec.getFieldValue('custrecord_acq_loth_zzz_zzz_shareholder')); //custrecord_acq_loth_zzz_zzz_isamtfinal
			if(nlapiGetFieldValue('custrecord_acq_loth_reviewcomplete') == 'T' && checkPermissions()) {
				form.addButton('custpage_create', 'View on Payment Dashboard', urlAction);
			}
		// Add a hidden field to hold the CREDIT MEMO status value. maybe this should be visible.
			var recid_fld = form.addField('custpage_recid', 'text', '').setDisplayType('hidden');
			recid_fld.setDefaultValue(recID);
			var rectype_fld = form.addField('custpage_rectype', 'text', '').setDisplayType('hidden');
			rectype_fld.setDefaultValue(recType);
			var tranid_fld = form.addField('custpage_tranid', 'text', '').setDisplayType('hidden');
			tranid_fld.setDefaultValue(exRec.getFieldValue('id'));
		}
		
		
		// IF TYPE IS RETURN AUTHORIZATION RECORD, ADD 'APPROVE AND CREATE REFUND PAGE' BUTTON
//		if(recType == 'returnauthorization') {
//			if(nlapiGetFieldValue('custbody_acq_lot_reviewed') == 'T' && checkPermissions()) {
//				form.addButton('custpage_create_refund', 'Delete Memo/Refund', takeOverWindow);
//			}
//		}
		if(checkPermissions()) {
			var dateCreated;
			var objExchangeRecordFields = nlapiLookupField('customrecord_acq_lot' ,recID , ["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.datecreated"]);
			dateCreated = objExchangeRecordFields["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.datecreated"];
			if (dateCreated) {
				var dtNow = new Date();
				var arrayToday = dtNow.toISOString().split("T");
				var todayMS = Date.parse(arrayToday[0]+"T00:00:00.000Z");
				var dateCreatedMS = Date.parse(dateCreated);
				if (dateCreatedMS >= todayMS) { form.addButton('custpage_create_refund', 'Delete Memo/Refund', takeOverWindow); }
			}
		}
		
		
		
		// ADD 'CLEARINGHOUSE DATA' TAB TO EXCHANGE RECORD AND THE 'GET DATA' BUTTON.
		form.addTab('custpage_testtab', 'Clearinghouse Data');
		var getDataBtn = form.addField('custpage_sync_btn', 'inlinehtml', 'GET DATA FROM CH', null, 'custpage_testtab');
		var btnHTML = '<br><button id="custpage_sync_btn" type="button" onClick="apiCallClearinghouse();return false;"> Get Data From Clearinghouse </button><br>';
		getDataBtn.setDefaultValue(btnHTML);
		var statusFld = form.addField('custpage_sync_response', 'inlinehtml', 'Status', null, 'custpage_testtab');
		statusFld.setLayoutType('outsidebelow');
		statusFld.setDefaultValue('<div id="sync_response"></div>');
	}
}

function checkPermissions() {
	var userRole = nlapiGetRole(); // 1025 for SRS Operations Manager, 3 for administrator
	var userDept = nlapiGetDepartment(); // 35 for Operations & Technology : Client Operations : Acquiom Operations
	if(userRole == 1025 || userRole == 3 || userDept == 35) {
		return true;
	}
	return false;
}

// THESE SEARCHES ARE NO LONGER NEEDED.

//function searchTransactions(ExRecID) {
//	var filters = new Array();
//	filters[0] = new nlobjSearchFilter('custbody_acq_lot_createdfrom_exchrec', null, 'anyof', ExRecID);
//	var columns = new Array();
//	columns[0] = new nlobjSearchColumn('custbody_acq_lot_createdfrom_exchrec');
//	columns[1] = new nlobjSearchColumn('tranid');
//	var results =  nlapiSearchRecord('creditmemo', null, filters, columns);
//	var oneResult = null;
//	if(results != null && results != '') {
//		oneResult = results[0];
//	}
//	if(oneResult != null && oneResult != '') {
////		return oneResult.getValue('tranid');
//		return oneResult.getValue('tranid');
//	} else {
//		return null;
//	}
//}
//
//function searchTransactionsReturnID(ExRecID) {
//	var filters = new Array();
//	filters[0] = new nlobjSearchFilter('custbody_acq_lot_createdfrom_exchrec', null, 'anyof', ExRecID);
//	var columns = new Array();
//	columns[0] = new nlobjSearchColumn('custbody_acq_lot_createdfrom_exchrec');
//	columns[1] = new nlobjSearchColumn('tranid');
//	var results =  nlapiSearchRecord('creditmemo', null, filters, columns);
//	var oneResult = null;
//	if(results != null && results != '') {
//		oneResult = results[0];
//	}
//	if(oneResult != null && oneResult != '') {
////		return oneResult.getValue('tranid');
//		return oneResult.getId();
//	} else {
//		return null;
//	}
//}





