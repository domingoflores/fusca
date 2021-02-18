/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * Paymt Instr Hold User Event customscript_paymt_instr_hold_ue paymt_instr_hold_ue.js
 * ___________________________________________________________
 * Description here
 *
 * Version 1.0  Alana Thomas
 *   			Ken Crossman - Added afterSubmit section to correct the PI On Hold when necessary
 *              PPE-305 Ken - Protect PI field when editing
 *              ATP-242 Ken - Push PI changes to Exchange Records
 * ___________________________________________________________
 */

define(['N/runtime', 'N/format', 'N/search', 'N/ui/serverWidget', '/SuiteScripts/Pristine/libraries/alphaRecordLibrary.js',
		'/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js', 'SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
	],
	function(runtime, format, search, serverWidget, alphaRecord, piListLib, exRecAlpha) {
		var recordType = piListLib.recordType;
		var fieldId = piListLib.fieldId;
		var paymtInstrHoldSrc = piListLib.piEnum.paymtInstrHoldSrc;
		var paymtInstrHoldReason = piListLib.piEnum.paymtInstrHoldReason;
		var payInstrHoldSts = piListLib.piEnum.payInstrHoldSts;

		function beforeLoad(context) {
			var executionContext = runtime.executionContext;
			log.debug('beforeLoad', 'executionContext=' + executionContext);
			var theForm = context.form;
			var eventType = context.type;
			log.debug('beforeLoad', 'eventType: ' + eventType);
			var newRec = context.newRecord;
			var holdSource = parseInt(newRec.getValue(fieldId.piHoldSrc)) || null;
			log.debug('beforeLoad', 'holdSource: ' + holdSource);
			var fieldsToInline = [];
			// PPE 302/305  - Disable a few fields in edit mode
			if (eventType === 'edit') { // User is editing a hold 
				fieldsToInline = [fieldId.piHoldPI]; // PI ID PPE-305
				if (holdSource === paymtInstrHoldSrc.Submission) { // Source = 'Submission' 
					fieldsToInline.push(fieldId.piHoldReason);
				}
				// log.debug('PPE-305', 'fieldsToInline: ' + JSON.stringify(fieldsToInline));
				inlineFields(context, fieldsToInline);
			}
			if (executionContext == 'USERINTERFACE') {
				if (eventType === 'create') {
					newRec.setValue({
						fieldId: fieldId.piHoldSrc,
						value: paymtInstrHoldSrc.StaffEntry
					});
				}

				//<ATP-843>
				// 1. get list contents
				// 2. hide the field of the dropdown
				// 3. create a new field
				// 4. populate con appropriate list gather from #1
				// 5. on field change update hidden field selection to my new field's selection
				//var theForm = context.form;
				if (eventType === 'edit' || eventType == 'create') {
					var REC = context.newRecord; 
					var listArray = [];
					//						["custrecord_script_only_hold_reason","is","F"]
					var customrecord_pihd_hold_reasonSearchObj = search.create({
						type: "customrecord_pihd_hold_reason",
						filters:
						[],
						columns:
						[
						search.createColumn({name: "internalid", label: "Internal ID"}),
						search.createColumn({
							name: "name",
							sort: search.Sort.ASC,
							label: "Name"
						}),
						search.createColumn({name: "custrecord_script_only_hold_reason", label: "custrecord_script_only_hold_reason"})
						]
					});
					var searchResultCount = customrecord_pihd_hold_reasonSearchObj.runPaged().count;
					log.debug("customrecord_pihd_hold_reasonSearchObj result count",searchResultCount);

					customrecord_pihd_hold_reasonSearchObj.run().each(function(result){
						// .run().each has a limit of 4,000 results
						//i++;
						listArray.push({  		id : result.getValue('internalid'),
											  name : result.getValue('name'),
										scriptOnly : result.getValue('custrecord_script_only_hold_reason')
										});
						return true;
					});

					log.debug('listArray', JSON.stringify(listArray) );
					
					var newHoldReason = theForm.addField({
						id: 'custpage_pihd_hold_reason',
						type: serverWidget.FieldType.SELECT,
						label: 'HOLD REASON'
					});

					theForm.insertField({
						field : newHoldReason,
						nextfield : 'custrecord_pihd_hold_reason'
					})

					//populate dropdown with ONLY "script only" unchecked
					for (var i=0; i<listArray.length; i++){
						if (listArray[i].scriptOnly != true ){
							newHoldReason.addSelectOption({
								value : listArray[i].id,
								text : listArray[i].name
							});							
						}
					}

					// if edit && UI && its set as a script only field THEN disable/inline
					var realHoldReason = theForm.getField({
						id: 'custrecord_pihd_hold_reason'
					});
					var realHoldReasonValue = REC.getValue({
						fieldId: 'custrecord_pihd_hold_reason'
					});

					for (var i=0; i<listArray.length; i++){
						if (listArray[i].scriptOnly == true && realHoldReasonValue == listArray[i].id  ){

							realHoldReason.updateDisplayType({
								displayType : serverWidget.FieldDisplayType.DISABLED
							})
						}
					}			
					//</ATP-843>
				}


			}
		}


		function beforeSubmit(context) {
			var executionContext = runtime.executionContext,
				contextType = context.type,
				newRecord = context.newRecord,
				oldRecord = context.oldRecord;


			var holdReason = newRecord.getValue(fieldId.piHoldReason);

			log.debug('beforeSubmit', 'executionContext=' + executionContext);

			if (executionContext == 'CSVIMPORT') {
				log.error('import', 'contextType=' + contextType);
				if (contextType == 'create') {
					newRecord.setValue({ // set Off Hold User to current user
						fieldId: fieldId.piHoldSrc,
						value: paymtInstrHoldSrc.Import
					});
				} else if (contextType == 'edit') {
					resetChangedValue(fieldId.piHoldPI);
					resetChangedValue(fieldId.piHoldSrc);
				}
				blankOutField(fieldId.piHoldSub);
				// this can NEVER be Pending Submission.  Blanking this out should cause import to fail.
				if (holdReason === paymtInstrHoldReason.PendingSubmission) {
					// 'Pending Submission' is a system-used status used when there is an active
					// Submission record, so users should not need it
					blankOutField(fieldId.piHoldReason);
				}
			} else if (executionContext == 'USERINTERFACE') { // a user is manually creating this Hold
				if (contextType == 'create') {
					// users cannot link a Submission when they create a Hold - this field is only for use by script
					// TODO: Do we just want to inline Submission? 
					var submission = newRecord.getValue(fieldId.piHoldSub);
					if (submission) {
						blankOutField(fieldId.piHoldSub);
					}
				} else if (contextType == 'edit') {
					// user cannot change the parent Payment Instruction or related Submission once created
					resetChangedValue(fieldId.piHoldPI);
					resetChangedValue(fieldId.piHoldSub); // TODO: taken care of by inlining submission
				}
			} else if (executionContext == 'SCRIPT') {

			}

			// logic valid for all Execution Contexts (IMPORT, USERINTERFACE, or SCRIPT)
			// TODO: Will this work with RESTLET? Ask Steve
			// if this Hold is Open, the Off Hold fields are inaccessible
			var newHoldStatus = newRecord.getValue(fieldId.piHoldStatus);
			// a Hold cannot be created in anything other than Open status
			if (contextType == 'create') {
				if (newHoldStatus != payInstrHoldSts.Open) {
					newRecord.setValue({
						fieldId: fieldId.piHoldStatus,
						value: payInstrHoldSts.Open
					});
					newHoldStatus = payInstrHoldSts.Open;
				}
			} else if (contextType == 'edit') {
				if (newHoldStatus == payInstrHoldSts.Canceled || newHoldStatus == payInstrHoldSts.Cleared) {
					// only need to check new status because record is locked when cancelled/cleared
					// the Hold has been changed to Cancelled or Cleared
					newRecord.setValue({ // set Off Hold User to current user
						fieldId: fieldId.piHoldOffBy,
						value: runtime.getCurrentUser().id
					});

					newRecord.setValue({ // set Off Hold Timestamp to current date/time
						fieldId: fieldId.piHoldOffTs,
						value: getCurrentDateTime()
					});
				}
			}

			// BobP - moved tbis below so that if hold status is changed in code block above we pay attention here
			if (newHoldStatus == payInstrHoldSts.Open) { // 'Open' status in Paymt Instr Hold Status
				blankOutOffHoldFields();
			}

			function getCurrentDateTime() {
				// grabs the current Javascript Date/Time and parses it into a format NetSuite accepts
				var now = new Date();
				return format.parse({
					value: now,
					type: format.Type.DATETIMETZ
				});
			}

			function blankOutOffHoldFields() {
				var offHoldFields = [ // Timestamp and By fields are inline-locked so don't need to check those
					fieldId.piHoldOffComment, fieldId.piHoldOffCase, fieldId.piHoldOffDoc
				];
				for (var i = 0; i < offHoldFields.length; i++) {
					blankOutField(offHoldFields[i]);
				}
			}

			function resetChangedValue(fieldId) {
				var oldValue = oldRecord.getValue(fieldId);
				if (oldValue != newRecord.getValue(fieldId)) {
					newRecord.setValue({
						fieldId: fieldId,
						value: oldValue
					});
				}
			}

			function blankOutField(fieldId) {
				newRecord.setValue({
					fieldId: fieldId,
					value: ''
				});
			}
		}

		function afterSubmit(context) {
			// Get the event type
			var eventType = context.type;
			log.debug('afterSubmit:', 'eventType: ' + eventType);
			//Only process the following Event Types: Edit, Create, Copy, Xedit
			var oldRec = '';
			var newRec = '';
			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
					newRec = context.newRecord; // Get the record which has just been saved clientside.
					break;
				case context.UserEventType.XEDIT:
					newRec = context.newRecord; // Get the record which has just been saved clientside.
					oldRec = context.oldRecord; //For Xedit only updated fields are in new rec - all fields in oldrec 
					break;
				default:
					return;
			}

			holdID = newRec.getValue('id');
			var holdPI = exRecAlpha.getFieldValue(context, fieldId.piHoldPI);
			log.debug('afterSubmit', 'holdPI: ' + JSON.stringify(holdPI));
			var manageHoldStatusResult = alphaRecord.manageHoldStatus(holdPI);
			if (!manageHoldStatusResult.success) {
				throw manageHoldStatusResult.message;
			}

			// ATP-242 Get Shareholder, Deal and Exchange rec Ids from PI
			var getPIValuesResult = getPIValues(holdPI);

			// ATP-242 If PI is active and has had its hold status changed then update associated exchange records
			if (!getPIValuesResult.isinactive && manageHoldStatusResult.success) {
				// ATO-221
				
				exRecAlpha.updateRelatedExRecsViaMapReduce(getPIValuesResult.shareholder ,getPIValuesResult.deal ,getPIValuesResult.exRec ,"paymtInstrHoldUE.js" );
				
				//var updateRelatedExRecsResult = exRecAlpha.updateRelatedExRecs(getPIValuesResult.shareholder, getPIValuesResult.deal, getPIValuesResult.exRec);
				//if (!updateRelatedExRecsResult.success) {
				//	throw updateRelatedExRecsResult.message;
				//}
				// ATO-221 end
			}
		}

		function getPIValues(holdPI) {
			var shareholder = '';
			var deal = '';
			var exRec = '';
			var piFieldValues = search.lookupFields({
				type: recordType.pi,
				id: holdPI,
				columns: [fieldId.piShareholder, 'isinactive', fieldId.piDeal, fieldId.piExRec]
			});
			log.debug('getPIValues', 'piFieldValues: ' + JSON.stringify(piFieldValues));

			if (piFieldValues[fieldId.piShareholder][0]) {
				shareholder = piFieldValues[fieldId.piShareholder][0].value;
			}
			if (piFieldValues[fieldId.piDeal][0]) {
				deal = piFieldValues[fieldId.piDeal][0].value;
			}
			if (piFieldValues[fieldId.piExRec][0]) {
				exRec = piFieldValues[fieldId.piExRec][0].value;
			}
			return {
				shareholder: shareholder,
				deal: deal,
				exRec: exRec,
				isinactive: piFieldValues.isinactive
			};
		}

		function inlineFields(context, fieldArray) {
			var theForm = context.form;
			for (var i = 0; i < fieldArray.length; i++) {
				theForm.getField({
					id: fieldArray[i]
				}).updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
			}
		}

		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	}
);
