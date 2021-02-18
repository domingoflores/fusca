/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * Pull PI Updates customscript_pull_pi_updates pullPIUpdates.js
 * ___________________________________________________________
 * 
 * This user event script calls the updateExRecWithAlphaPI function 
 * to link the Exchange Record to the highest ranked PI or PI Submission.
 *
 * The function is only called when: 
 * 1) the Exchange Record is active and unpaid (no credit memo link)
 * 2) when this script has not been invoked by the cancel PI Submission restlet (because Ex Rec updates have already been done)
 *
 * Version 1.0  Alana Thomas
 *         2018-12-12 ATP-456 Ken Crossman Ensure no sync occurs if Paymethod = Payroll and that it does occur when changing from Payroll to anything else
 * 		   7/2/2019	  ATP-856 Robert Bender - added didValuesChange function
 * ____________________________________________________________________________________________________________________________________________________________
 */

define(['N/runtime', 'N/search', 'N/error'
	   ,'SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
	   ,'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js'
	   ,'SuiteScripts/Pristine/libraries/toolsLibrary.js'
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ],
	function(runtime, search, error
			,exRecAlpha
			,piListLib 
			,tools
			,appSettings
			) {
		var recordType = piListLib.recordType;
		var exRecPayMethod = piListLib.exRecPayMethod; //ATP-456
		var scriptName = 'pullPIUpdates.js';
		var refreshRequired;

		function beforeSubmit(context) {
			// ATP-456 If Pay Method has just changed to Payroll then blank out PI link fields and Suspense Reasons
			var funcName = scriptName + '==>' + 'beforeSubmit' + 
				context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

			// Check Paymethod
			var payMethod = Number(exRecAlpha.getFieldValue(context, 'custrecord_acq_loth_4_de1_lotpaymethod'));
	
			// If Pay Method has just changed to Payroll then blank out PI link fields and Suspense Reasons
			if (context.type !== context.UserEventType.CREATE) {
				if (tools.didValuesChange(context, ['custrecord_acq_loth_4_de1_lotpaymethod']) && payMethod === exRecPayMethod.payroll) {
					log.debug(funcName, 'Pay Method changed to Payroll');
					var piFields = ['custrecord_exrec_payment_instruction', 'custrecord_exrec_paymt_instr_sub', 'custrecord_exrec_paymt_instr_hist'];
					for (i = 0; i < piFields.length; i++) {
						context.newRecord.setValue({
							fieldId: piFields[i],
							value: '',
							ignoreFieldChange: true
						});
					}
					// Remove PI Related Suspense Reasons
					var suspenseReasons = exRecAlpha.getFieldValue(context, 'custrecord_suspense_reason');
					log.debug(funcName, 'suspenseReasons: ' + JSON.stringify(suspenseReasons));
					var finalSuspenseReasons = exRecAlpha.cleanAlphaPISuspenseReasons(suspenseReasons);
					context.newRecord.setValue({
						fieldId: 'custrecord_suspense_reason',
						value: finalSuspenseReasons,
						ignoreFieldChange: true
					});
				}
			}
			
            
            // ATP-1366 - Alpha PI Promotion
            // If we plan to sync the Ex Rec with the PI system then we need to add a suspense reason

	        if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT
	        	|| context.type == context.UserEventType.CREATE ) {
 
	        	// If the Exchange Record needs to be refreshed from the PI then let's add a suspense reason so that should the asynchronous 
	        	// update of the Ex Rec fields be delayed then the user will know it cannot be paid
	        	// The dummy field custrecord_triggerExRecRefreshFromPI is created and set during the final submitfields of the QM Scheduled
				// script when tagging is complete. The following if statement checks if this flag is true and if so, it is assumed that 
				// the tagging process is complete and whether it changed the value of the PI link on the Ex rec or not, the refresh of the 
				// ex rec must happen
				
	        	if ( tools.didValuesChange(context, ["custrecord_exrec_payment_instruction"]) ||
	        		 exRecAlpha.getFieldValue(context, 'custrecord_triggerExRecRefreshFromPI')) {
	        		refreshRequired = true;
        			// Last check to ensure that no refresh occurs if PI link is blank before change and blank after change
     				if (context.type == context.UserEventType.CREATE && !context.newRecord.getValue("custrecord_exrec_payment_instruction")) { refreshRequired = false; }
	        		if (context.type !== context.UserEventType.CREATE && !context.oldRecord.getValue("custrecord_exrec_payment_instruction") && !context.newRecord.getValue("custrecord_exrec_payment_instruction")) { refreshRequired = false; }
	        		if (refreshRequired) {
            			var paymtSuspenseReason = exRecAlpha.piListLib.piEnum.paymtSuspenseReason;
            			exRecAlpha.addSuspenseReasonsToRecord(context.newRecord ,[ paymtSuspenseReason.PmtInstrApplyRemoveIncomplete ] );  
            		}
            	}

            }
			// }
            // end ATP-1366
			
		}

		function afterSubmit(context) {
			var funcName = scriptName + '==>' + 'afterSubmit ' +
	    		context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
			
			var shareholder = exRecAlpha.getFieldValue(context, 'custrecord_acq_loth_zzz_zzz_shareholder');
			var dealId = exRecAlpha.getFieldValue(context, 'custrecord_acq_loth_zzz_zzz_deal');
			var exRecId = context.newRecord.id;
			var syncExRecResult = syncExRec(context); 
			log.debug(funcName,JSON.stringify(syncExRecResult));
			// The sync is asynchronous and therefore any code following should be aware....
			if (syncExRecResult.syncRequired) { exRecAlpha.updateExRecViaQueueManager(shareholder ,dealId ,exRecId ,scriptName ); }
			// The dummy field custrecord_triggerExRecRefreshFromPI is created and set during the final submitfields of the QM Scheduled
			// script when tagging is complete. The following if statement checks if this flag is true and if so, it is assumed that 
			// the tagging process is complete and whether it changed the value of the PI link on the Ex rec or not, the refresh of the 
			// ex rec must happen
 
        	if ( tools.didValuesChange(context, ["custrecord_exrec_payment_instruction"]) ||
 				 exRecAlpha.getFieldValue(context, 'custrecord_triggerExRecRefreshFromPI')) {
        		refreshRequired = true;
        		// Last check to ensure that no refresh occurs if PI link is blank before change and blank after change
     			if (context.type == context.UserEventType.CREATE && !context.newRecord.getValue("custrecord_exrec_payment_instruction")) { refreshRequired = false; }
	        	if (context.type !== context.UserEventType.CREATE && !context.oldRecord.getValue("custrecord_exrec_payment_instruction") && !context.newRecord.getValue("custrecord_exrec_payment_instruction")) { refreshRequired = false; }
	        	if (refreshRequired) {
					log.debug(funcName, 'Requesting refresh of Exchange Record from linked PI');
					exRecAlpha.applyPiModificationToExRecViaQueueManager(context.newRecord.id ,scriptName );
				}	
			}


		}
		// This function simply checks if it thinks a sync is required and returns a true or false and a message
		function syncExRec (context) {
			var funcName = scriptName + '==>' + 'syncExRec';
			var executionContext = runtime.executionContext;
			var syncRequired = false;
			var message = '';

			var exRecId = context.newRecord.id;
			var isinactive = exRecAlpha.getFieldValue(context, 'isinactive');
			var creditMemo = exRecAlpha.getFieldValue(context, 'custrecord_acq_loth_related_trans');
			var payMethod = exRecAlpha.getFieldValue(context, 'custrecord_acq_loth_4_de1_lotpaymethod');
			
			var oldPayMethod = '';
			if (context.type !== context.UserEventType.CREATE) {
				oldPayMethod = Number(context.oldRecord.getValue('custrecord_acq_loth_4_de1_lotpaymethod'));
			}
		
			// No point in doing any of this if the Ex Rec is inactive or paid or Pay Method = Payroll
			if (isinactive || creditMemo || Number(payMethod) === Number(exRecPayMethod.payroll)) {
				message =  'Not syncing because Ex Rec is either inactive, paid or has Pay Method = Payroll';
			} else {
				// Also check to see if any changes were made to warrant a re-sync 
				// 1) Has Shareholder or Deal changed? This requires re-sync
				// 2) Has inactive or paid status changed? This requires a re-sync
				// 3) Is this a create?
				// 4) Has Pay Method changed from Payroll to something else?
				if (   tools.didValuesChange(context, ['isinactive','custrecord_acq_loth_zzz_zzz_shareholder', 'custrecord_acq_loth_zzz_zzz_deal', 'custrecord_acq_loth_related_trans' ]) 
					|| ( oldPayMethod == exRecPayMethod.payroll && tools.didValuesChange(context, 'custrecord_acq_loth_4_de1_lotpaymethod') 
					|| 	context.type == context.UserEventType.CREATE )) {

					message = 'Syncing with Alpha PI... ';
					syncRequired = true;
					
				} else {
					message = 'Not syncing because conditions were not met ';
				}
			}			
			return {'syncRequired': syncRequired, 'message': message};
		}

		return {
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	}
);