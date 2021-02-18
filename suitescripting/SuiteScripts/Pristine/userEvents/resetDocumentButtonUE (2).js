/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope Public
 * -----------------------------------------------------------
 * Reset Document (Custom) Fields Button (Reset Document)
 * ___________________________________________________________
 * Author: Brunno 
 * Add button to Document (Custom) 
 * to clear specific fields on the record and related exRec fields
 * the button should only appear when related exRec is not inactive
 * or it is not set to the following status: 5, 5e, 5f
 * ___________________________________________________________
 */


 define(['N/ui/serverWidget', 'N/search', 'N/runtime'],
 	function(serverWidget, search, runtime) {
 		function beforeLoad(context) {
 			var thisRecID = context.newRecord.getValue('id');
 			var executionContext = runtime.executionContext;
// 			log.debug('beforeLoad', 'Execution Context is: ' + executionContext + ' | Context Type is: ' + context.type);
// 			log.debug('beforeLoad', 'Document (Custom) ID: ' + thisRecID);


 			switch (context.type) {
 				case context.UserEventType.VIEW:

// 				var fieldValues = search.lookupFields({
// 					type: 'customrecord_document_management',
// 					id: thisRecID,
// 					columns: ['custrecord_acq_lot_exrec']
// 				});
// does not need to be used if the value is within the record that it is deployed against.  use newRecord instead of lookupfields.
 				
 	 			var exRecID = context.newRecord.getValue('custrecord_acq_lot_exrec');
 	 			if(!exRecID)
 	 				return;
 	 			
// 				var exRecID = Number(fieldValues.custrecord_acq_lot_exrec[0].value);
 				log.debug('ExRecID', 'Exchange Record ID: ' + exRecID);

 				fieldValues = search.lookupFields({
 					type: 'customrecord_acq_lot',
 					id: exRecID,
 					columns: ['custrecord_acq_loth_zzz_zzz_acqstatus', 'isinactive']
 				});

 				var exRecStatus = (fieldValues.custrecord_acq_loth_zzz_zzz_acqstatus[0].text);
 				var exRecInactiveStatus = (fieldValues.isinactive);
// 				log.debug('ExRecInactive', 'ER Inactive STATUS: '+ exRecInactiveStatus);
// 				log.debug('exRecStatus', 'ERstatus: ' + JSON.stringify(exRecStatus));
// 				log.debug('text from eR status: ', 'status text ' + exRecStatus); 				

 				if(exRecStatus != "5f. Payment Processing" 
 					&& exRecStatus != "5e. Queued for Payment Processing" 
 						&& exRecStatus != "5. Approved for Payment"
 							&& !exRecInactiveStatus){
 				
 				context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/resetDocumentFieldsClient.js';
 				
 				context.form.addButton({
 					id: 'custpage_reset_fields_button',
 					label: 'Reset Document',
 					functionName: 'clearFields()'
 				});

 			}

 			break;
 			default:
 			return;
 		}
 	}

 	return {
 		beforeLoad: beforeLoad
 	};
 }
 );


