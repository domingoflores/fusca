/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * Push PI Submission Updates customscript_push_pi_sub_updates pushPISubUpdates.js
 * ___________________________________________________________
 * 
 * This user event script calls the updateRelatedExRecs function 
 * to find every Exchange Record that falls within the scope of the 
 * PI Type and links each to the highest ranked PI or PI Submission.
 *
 * The function is only called when: 
 * 1) a new PI Submission is created or
 * 2) a PI Submission has just been cancelled or promoted 
 * 3) the Exchange Record or Deal part of the PI Type has changed (in this case the Exchange Records falling
 *    within the scope of the PI Type before it was changed (oldRecord) and after it was changed (newRecord) are synchronised)
 *
 * Version 1.0  Alana Thomas
 * ___________________________________________________________
 */

define(['N/search', 'N/record', 'N/runtime', 'SuiteScripts/Pristine/libraries/searchLibrary', 'SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary',
		'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
	],
	function(search, record, runtime, searchLibrary, exRecAlpha, piListLib) {
		var piTypeConstant = piListLib.piEnum.piType;
		var piSubmStatusConstant = piListLib.piEnum.subSts;
		var paymtSuspReason = piListLib.piEnum.paymtSuspenseReason;
		var recordType = piListLib.recordType;
		var fieldId = piListLib.fieldId;

		function afterSubmit(context) {
			var executionContext = runtime.executionContext;
			log.debug('afterSubmit', 'executionContext: ' + executionContext);
			log.debug('afterSubmit', 'contextType: ' + context.type);

			var shouldWeSyncResult = shouldWeSyncWithER(context);
			log.debug('afterSubmit', 'shouldWeSyncResult: ' + JSON.stringify(shouldWeSyncResult));

			var subId = context.newRecord.id;
			var subStatus = Number(exRecAlpha.getFieldValue(context, fieldId.piSubStatus));
			var updatingPaymtInstr = exRecAlpha.getFieldValue(context, fieldId.piSubUpdatingPI);
			var shareholder = exRecAlpha.getFieldValue(context, fieldId.piSubShareholder);
			var inactivate = exRecAlpha.getFieldValue(context, fieldId.piSubInactivatePI);
			log.debug('afterSubmit', 'inactivate: ' + JSON.stringify(inactivate));

			//var success = true;
			//var message = '';
			var exRecId = exRecAlpha.getFieldValue(context, fieldId.piSubExRec);
			var dealId = exRecAlpha.getFieldValue(context, fieldId.piSubDeal);
			var piType = exRecAlpha.getFieldValue(context, fieldId.piSubPIType);

			if (shouldWeSyncResult.sync) {
				// ATO-112

				exRecAlpha.updateRelatedExRecsViaMapReduce(shareholder ,shouldWeSyncResult.newDealId ,shouldWeSyncResult.newExRecId ,"pushPISubUpdates.js" );
				
				if (context.type !== 'create') {
					if (shouldWeSyncResult.newExRecId !== shouldWeSyncResult.oldExRecId || shouldWeSyncResult.newDealId !== shouldWeSyncResult.oldDealId) {
						exRecAlpha.updateRelatedExRecsViaMapReduce(shareholder ,shouldWeSyncResult.oldDealId ,shouldWeSyncResult.oldExRecId ,"pushPISubUpdates.js" );
					}
				}
				
				// If we decide to sync then the Exchange Records falling within the scope of the PI Type after it was changed (newRecord) are synchronised
				//var updateRelatedExRecsResult = exRecAlpha.updateRelatedExRecs(shareholder, shouldWeSyncResult.newDealId, shouldWeSyncResult.newExRecId);
				//success = updateRelatedExRecsResult.success;
				//message = updateRelatedExRecsResult.message;
				//// If the PI was edited and the Deal or Exchange Record links were changed then the 
				//// Exchange Records falling within the scope of the PI Type before it was changed (oldRecord) are synchronised
				//if (success && context.type !== 'create' && (shouldWeSyncResult.newExRecId !== shouldWeSyncResult.oldExRecId || shouldWeSyncResult.newDealId !== shouldWeSyncResult.oldDealId)) {
				//	updateRelatedExRecsResult = exRecAlpha.updateRelatedExRecs(shareholder, shouldWeSyncResult.oldDealId, shouldWeSyncResult.oldExRecId);
				//	success = updateRelatedExRecsResult.success;
				//	message = updateRelatedExRecsResult.message;
				//}
				// ATO-112 end
			}
			//if (!success) {
			//	throw message;
			//}
		}
		/**
		 * This function decides whether a change to a PI Submission is of such a nature
		 * that it should invoke a push sync with all related Exchange Records 
		 * These conditions result in a sync decision:
		 * 1) If a new PI Sub has been created
		 * 2) If the PI Sub is either being promoted or cancelled
		 * 3) If there has been a change of either Deal or Exchange rec
		 *
		 * @param {object}      Context
		 * @return {object} 	Contains a sync/no sync decision. Contains old and new values of Status, Deal, Exchange Record and Inactivate PI
		 */
		function shouldWeSyncWithER(context) {
			var sync = false;
			var newExRecId = null;
			var oldExRecId = null;
			var newDealId = null;
			var oldDealId = null;
			var newStatus = null;
			var oldStatus = null;
			var newInactivatePI = null;
			var oldInactivatePI = null;

			newExRecId = context.newRecord.getValue(fieldId.piSubExRec);
			newDealId = context.newRecord.getValue(fieldId.piSubDeal);
			newStatus = Number(context.newRecord.getValue(fieldId.piSubStatus));
			newInactivatePI = context.newRecord.getValue(fieldId.piSubInactivatePI);

			if (context.type === 'create') {
				sync = true;
			} else {
				oldExRecId = context.oldRecord.getValue(fieldId.piSubExRec);
				oldStatus = Number(context.oldRecord.getValue(fieldId.piSubStatus));
				oldDealId = context.oldRecord.getValue(fieldId.piSubDeal);
				oldInactivatePI = context.oldRecord.getValue(fieldId.piSubInactivatePI);

				if (newStatus === piSubmStatusConstant.Promoting || newStatus === piSubmStatusConstant.Canceled) {
					sync = true;
				} else {
					if (newExRecId !== oldExRecId || newDealId !== oldDealId) {
						sync = true;
					}
				}
			}

			return {
				sync: sync,
				oldExRecId: oldExRecId,
				newExRecId: newExRecId,
				oldDealId: oldDealId,
				newDealId: newDealId,
				oldStatus: oldStatus,
				newStatus: newStatus
			};
		}

		return {
			afterSubmit: afterSubmit
		};
	}

);