/*
 * 2005-2009 Celigo, Inc. All Rights Reserved.
 * 
 * Version:		1.0.0
 * Type:		User Event
 *
 * Purpose: Document Management 1 -
 * 			Create a Document record for each Default Document result matching the current event and status of the transaction.
 *
 * Revisions:
 *		08/24/2009 - Initial version
 */
var SRS = {};
SRS.Transaction= (function(){
	function TransactionManager(){
		this.SearchDefaultDocs = function(txnRec){
			var txnType = nlapiGetRecordType();
			if(txnType === 'salesorder'){
				txnType = 'Sales Order';
			}else if (txnType === 'estimate'){
				txnType = 'Proposal';
			}
			var eventStatus = txnRec.getFieldValue('status');
			if ((txnType === 'opportunity')||(txnType === 'Proposal')){
				eventStatus = txnRec.getFieldValue('entitystatus');
			}
			var actionType = type.toLowerCase();
			if(actionType === 'edit'){
				actionType = 'update';
			}
			nlapiLogExecution('DEBUG', 'Txn Type='+txnType+' Event Status='+eventStatus+' Action Type='+actionType);
			
			/* Type Check - to implement if the client requests*/
			var updateFlag = 0;
			if(actionType === 'update'){
				var oldRec = nlapiGetOldRecord();
				if (oldRec) {
					if ((txnType === 'opportunity') || (txnType === 'Proposal')) {
						var oldStatus = oldRec.getFieldValue('entitystatus');
					}
					else {
						var oldStatus = oldRec.getFieldValue('status');
					}
					if (oldStatus !== eventStatus ) {
						updateFlag = 1;
					}else{
						nlapiLogExecution('DEBUG', "Old Status = "+oldStatus+", New Status = "+eventStatus+". No Document records created.");
						return;
					}
				}
			}
			
			var filterTxnType = [];
			filterTxnType.push(new nlobjSearchFilter('name', null, 'is', txnType, null));
			var searchTxnId = nlapiSearchRecord('customlist_record_name', null, filterTxnType, null);
			if(searchTxnId){
				nlapiLogExecution('DEBUG', "Search Txn Ids = "+searchTxnId.length);
				var txnId = searchTxnId[0].getId()
			}
			var filterStatus = [];
			filterStatus.push(new nlobjSearchFilter('name', null, 'contains', eventStatus, null));
			var searchStatusId = nlapiSearchRecord('customlist_event_status', null, filterStatus, null);
			if(searchStatusId){
				nlapiLogExecution('DEBUG', "Search Status Ids = "+searchStatusId.length);
				var statusId = searchStatusId[0].getId()
			}
			var filterAction = [];
			filterAction.push(new nlobjSearchFilter('name', null, 'is', actionType, null));
			var searchActionId = nlapiSearchRecord('customlist_event_action_values', null, filterAction, null);
			if(searchActionId){
				nlapiLogExecution('DEBUG', "Search Action Ids = "+searchActionId.length);
				var actionId = searchActionId[0].getId()
			}
			nlapiLogExecution('DEBUG', "Txn Id = "+txnId+" Status = "+statusId+" Action = "+actionId);
			if(txnId && actionId){
				if ((actionType === 'create')|| ((actionType === 'update') && (updateFlag === 1))) {
					var filterDefDoc = [];
					filterDefDoc.push(new nlobjSearchFilter('custrecord_def_record_name', null, 'is', txnId, null));
					filterDefDoc.push(new nlobjSearchFilter('custrecord_def_action', null, 'is', actionId, null));
					if(actionType === 'create'){
						filterDefDoc.push(new nlobjSearchFilter('custrecord_def_status', null, 'is', '18', null));
					}else if((actionType === 'update') && (updateFlag === 1)){
						if (statusId) {
							filterDefDoc.push(new nlobjSearchFilter('custrecord_def_status', null, 'is', statusId, null));
						}else {
							nlapiLogExecution('DEBUG', "No Default Document records found for this transaction.");
							return;
						}
					}
					var searchDefDocs = nlapiSearchRecord('customrecord_default_doc_list', null, filterDefDoc, null);
					//nlapiLogExecution('DEBUG', "searchDefDocs = "+searchDefDocs);
					if((!searchDefDocs)&&(actionType === 'create')){
						var filterDefDoc2 = [];
						filterDefDoc2.push(new nlobjSearchFilter('custrecord_def_record_name', null, 'is', txnId, null));
						filterDefDoc2.push(new nlobjSearchFilter('custrecord_def_action', null, 'is', actionId, null));
						filterDefDoc2.push(new nlobjSearchFilter('custrecord_def_status', null, 'is', '@NONE@', null));
						searchDefDocs = nlapiSearchRecord('customrecord_default_doc_list', null, filterDefDoc2, null);
						if(!searchDefDocs && statusId){
							var filterDefDoc3 = [];
							filterDefDoc3.push(new nlobjSearchFilter('custrecord_def_record_name', null, 'is', txnId, null));
							filterDefDoc3.push(new nlobjSearchFilter('custrecord_def_action', null, 'is', actionId, null));
							filterDefDoc3.push(new nlobjSearchFilter('custrecord_def_status', null, 'is', statusId, null));
							searchDefDocs = nlapiSearchRecord('customrecord_default_doc_list', null, filterDefDoc3, null);
						}
					}
					if (searchDefDocs) {
						nlapiLogExecution('DEBUG', 'Search Default Doc Records = ' + searchDefDocs.length);
						for (var i = 0; i < searchDefDocs.length; i++) {
							var defDocRec = nlapiLoadRecord('customrecord_default_doc_list', searchDefDocs[i].getId());
							var newDocRec = nlapiCreateRecord('customrecord_document_management');
							newDocRec.setFieldValue('custrecord_escrow_customer', txnRec.getFieldValue('entity'));
							newDocRec.setFieldValue('custrecord_dm_status', '1');
							newDocRec.setFieldValue('custrecord_doc_type', defDocRec.getFieldValue('custrecord_default_doc_type'));
							newDocRec.setFieldValue('altname', defDocRec.getFieldValue('name'));
							newDocRec.setFieldValue('custrecord_file', '5691869');
							if (txnType === 'Sales Order')  //if it is a sales order copy the opportunity so that docs show for customer and opportunity tracker 3106
							{
							newDocRec.setFieldValue('custrecord_opportunity', txnRec.getFieldValue('opportunity'));
							}
							var newDocId = nlapiSubmitRecord(newDocRec, true, true);
							nlapiLogExecution('DEBUG', "newDocId = " + newDocId);
						}
					}
					else {
						nlapiLogExecution('DEBUG', "No Default Document records found for this transaction.");
					}
				}
			}
		};
	}
	return{
		afterSubmit:function(type){
			try{
				if((type.toLowerCase()==='create')||(type.toLowerCase()==='edit')){
					nlapiLogExecution('DEBUG', "Type = "+type);
					var txnRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
					if (nlapiLookupField('customer', txnRec.getFieldValue('entity'), 'category') === '1') {
						var defDoc = new TransactionManager();
						defDoc.SearchDefaultDocs(txnRec);
					}
				}
			}catch(e){
				nlapiLogExecution('ERROR', "Error: "+e);
				Util.handleError(e, 'Celigo_TransactionManager_DocumentManagement_SS.js', ['lakshika@celigo.com']);
			}
		}
	}
})();