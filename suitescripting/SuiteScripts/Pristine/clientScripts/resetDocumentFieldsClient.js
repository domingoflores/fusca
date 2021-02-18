/**
 *@NApiVersion 2.x
 *PseudoClient triggered by resetButtonUE.js does not require deployment.
 *Updating Document (Custom) & Exchange Record
 *brunno
 */

 define(['N/runtime', 'N/currentRecord', 'N/log', 'N/ui/dialog', 'N/ui/message', 'N/record', 'N/search'],
 	function(runtime, currentRecord, log, dialog, msg, record, search) {

	 	var timeout = 15000;
	 
 		function clearFields() {
 			
 			var message = '';
 			var success = true;
 			var exRecResult = '';
 			var currentDocument = currentRecord.get();
 			var docID = currentDocument.id;
 			console.log('expose all fields', 'currentDoc: ' + JSON.stringify(currentDocument));
// 			console.log('clearFields', 'docID: ' + docID);



 			
 			var docResult = clearDocumentCustomFields(docID);
 			if(docResult.success){
 				exRecResult = clearExchangeRecordFields(docID);
 				if(!exRecResult.success){
 					message += exRecResult.message;
 				}
 			}else{
 				message += docResult.message;
 			}


 			if(!exRecResult.success || !docResult.success){
 				showErrorMessage('Cannot clear fields', 'Please complete the operation manually.' + message);
 				setTimeout(function() {
 					location.reload(true);
 				}, timeout);
 			}else{
 				location.reload(true);

 			}		
 		}

 		function showErrorMessage(msgTitle, msgText) {
 			var myMsg = msg.create({
 				title: msgTitle,
 				message: msgText,
 				type: msg.Type.ERROR
 			});
 			myMsg.show({
 				duration: timeout
 			});
 		}


 		function clearDocumentCustomFields(docID){
 			var message = '';
 			var success = true;

 			try {
 				var id = record.submitFields({
 					type: 'customrecord_document_management',
 					id: docID,
 					values: {
 						'custrecord_doc_signed_status': '',
 						'custrecord_doc_signed_datetime': '',
 						'custrecord_doc_esign_link': '',
 						'custrecord_doc_backup_link': ''
 					}
 				});
 			} catch (e) {
 				console.log('Document (Custom)', 'e: ' + JSON.stringify(e));
 				success = false; 
 				message = 'Could not clear document fields and exchange record fields, error: ' + e;

 			}
 			return{
 				success: success,
 				message: message
 			};

 		}

 		function clearExchangeRecordFields(docID){

 			var exRecID = '';
 			var message = '';
 			var success = true; 
 			var fieldValues = search.lookupFields({
 				type: 'customrecord_document_management',
 				id: docID,
 				columns: ['custrecord_acq_lot_exrec']
 			});

 			exRecID = Number(fieldValues.custrecord_acq_lot_exrec[0].value);
 			console.log('ExRecID', 'ID: ' + exRecID);

 			try {
 				var exchangeRecord = record.submitFields({
 					type: 'customrecord_acq_lot',
 					id: exRecID,
 					values: {
 						'custrecord_acq_loth_zzz_zzz_rcvdtimestmp': '',
 						'custrecord_acq_loth_zzz_zzz_docs4sign': '',
 						'custrecord_acq_loth_zzz_zzz_esign_status': '',
 						'custrecord_ch_completed_datetime': '',
 						'custrecord_ch_status': ''
 					}
 				});
 			} catch (e) {
 				console.log('Exchange Record', 'e: ' + JSON.stringify(e));
 				success = false;
 				message = 'Document fields were cleared but it could not clear exchange record fields, error: ' + e;
 			}
 			return{
 				success: success,
 				message: message
 			};

 		}

 		return {
 			clearFields : clearFields

 		};

 	});