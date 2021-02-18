/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *
 * -----------------------------------------------------------
 * Push PI Updates customscript_push_pi_updates pushPIUpdates.js
 * ___________________________________________________________
 * 
 * This user event script calls the updateRelatedExRecs function 
 * to find every Exchange Record that falls within the scope of the 
 * PI Type and link each to the highest ranked PI or PI Submission.
 *
 * The function is only called when: 1) a new PI is created or
 * 2) when the PI is updated by another script via submitfields 
 *
 * ___________________________________________________________
 */

define(['N/runtime', 'SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'],
	function(runtime, exRecAlpha, piListLib) {
		var recordType = piListLib.recordType;
		var fieldId = piListLib.fieldId;

		function afterSubmit(context) {
			var executionContext = runtime.executionContext;
			log.debug('afterSubmit', 'executionContext: ' + executionContext);
			log.debug('afterSubmit', 'contextType: ' + context.type);

			//var success = null;
			//var message = null;
			var shareholder = exRecAlpha.getFieldValue(context, fieldId.piShareholder);
			var deal = exRecAlpha.getFieldValue(context, fieldId.piDeal);
			var exRec = exRecAlpha.getFieldValue(context, fieldId.piExRec);
			log.debug('afterSubmit', 'shareholder: ' + JSON.stringify(shareholder));

			if (context.type === 'xedit' || context.type === 'create') {
				// ATO-221
				
				exRecAlpha.updateRelatedExRecsViaMapReduce(shareholder ,deal ,exRec ,"pushPIUpdates.js" );
				
				//var updateRelatedExRecsResult = exRecAlpha.updateRelatedExRecs(shareholder, deal, exRec);
				//log.debug('afterSubmit', 'updateRelatedExRecsResult: ' + JSON.stringify(updateRelatedExRecsResult));
				//success = updateRelatedExRecsResult.success;
				//message = updateRelatedExRecsResult.message;
				//if (!success) {
				//	throw message;
				//}
				// ATO-221 end
			}
		}

		return {
			afterSubmit: afterSubmit
		};
	}
);