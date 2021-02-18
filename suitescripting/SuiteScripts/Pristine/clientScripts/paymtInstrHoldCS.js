/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/log', 'N/ui/dialog', 'N/ui/message', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js', 'N/search'],
	/**
	 * -----------------------------------------------------------
	 * paymtInstrHoldCS.js
	 * ___________________________________________________________
	 * Payment Instruction Hold client script
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2017-12-12	
	 * ___________________________________________________________
	 */
	function(currentRecord, log, dialog, msg, paymtInstrListLibrary, search) {
		var currentStatus = null;

		var payInstrHoldSts = paymtInstrListLibrary.piEnum.payInstrHoldSts;
		var paymtInstrHoldReason = paymtInstrListLibrary.piEnum.paymtInstrHoldReason;
		var paymtInstrHoldSrc = paymtInstrListLibrary.piEnum.paymtInstrHoldSrc;



		function pageInit(context) {
			console.log('pageInit', 'context: ' + JSON.stringify(context));
			console.log('INIT-start- custrecord_pihd_hold_reason='+custrecord_pihd_hold_reason+' * custpage_pihd_hold_reason='+custpage_pihd_hold_reason);
			


			// If Status =  Cleared then hide the Off Hold Comment, 
			// Case and Document fields (they start off as Normal on the form)
			currentStatus = parseInt(context.currentRecord.getValue({
				fieldId: 'custrecord_pihd_hold_status'
			})) || null;

			if (currentStatus !== payInstrHoldSts.Cleared) {
				// Hide fields 
				context.currentRecord.getField({
					fieldId: 'custrecord_pihd_offhold_case'
				}).isDisplay = false;
				context.currentRecord.getField({
					fieldId: 'custrecord_pihd_offhold_doc'
				}).isDisplay = false;
				context.currentRecord.getField({
					fieldId: 'custrecord_pihd_offhold_comment'
				}).isDisplay = false;
				// context.currentRecord.getField({
				// 	fieldId: 'custrecord_pihd_sched_rls_dt'
				// }).isDisplay = false;
				context.currentRecord.getField({
					fieldId: 'custrecord_pihd_offhold_by'
				}).isDisplay = false;
				context.currentRecord.getField({
					fieldId: 'custrecord_pihd_offhold_ts'
				}).isDisplay = false;
			}

			
			//<ATP-843>
			var custpage_pihd_hold_reason = context.currentRecord.getValue ({
				fieldId: 'custpage_pihd_hold_reason'
			})
			var custrecord_pihd_hold_reason = context.currentRecord.getValue ({
				fieldId: 'custrecord_pihd_hold_reason'
			})
			
			context.currentRecord.setValue({
				fieldId: 'custpage_pihd_hold_reason',
				value: custrecord_pihd_hold_reason
			});


			var custrecord_pihd_hold_reasonObj = context.currentRecord.getField({
				fieldId: 'custrecord_pihd_hold_reason'
			})
			
			if ( custrecord_pihd_hold_reasonObj.isDisabled == false ){
				custrecord_pihd_hold_reasonObj.isDisplay = false;
			}

			if ( context.mode == 'create' ){
				custrecord_pihd_hold_reasonObj.isDisplay = false;
			}
			//</ATP-843>

			console.log('INIT-end- custrecord_pihd_hold_reason='+custrecord_pihd_hold_reason+' * custpage_pihd_hold_reason='+custpage_pihd_hold_reason);
			
		} // end init




		function fieldChanged(context) {
			console.log('fieldChanged','context: ' + JSON.stringify(context));



			// If the status field has changed then depending on its new value, the display type 
			// of some fields will be protected and some unprotected
			if (context.fieldId == 'custrecord_pihd_hold_status') {
				// Get the value
				currentStatus = parseInt(context.currentRecord.getValue({
					fieldId: 'custrecord_pihd_hold_status'
				})) || null;
				console.log('fieldChanged currentStatus: ' + currentStatus);
				//<ATP-843>
				if ((currentStatus === payInstrHoldSts.Cleared || currentStatus === payInstrHoldSts.Canceled) ){
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
					listArray = [];
					customrecord_pihd_hold_reasonSearchObj.run().each(function(result){
						// .run().each has a limit of 4,000 results
						//i++;
						listArray.push({  		id : result.getValue('internalid'),
											  name : result.getValue('name'),
										scriptOnly : result.getValue('custrecord_script_only_hold_reason')
										});
						return true;
					});

					var custrecord_pihd_hold_reason = context.currentRecord.getValue ({
						fieldId: 'custrecord_pihd_hold_reason'
					});
					var isScriptOnlyReason = false;
					var openStatusValue = 1;
					for (var i=0; i<listArray.length; i++){
						if (listArray[i].name == 'Open' ){ openStatusValue = listArray[i].id; }
						if (listArray[i].scriptOnly == true && listArray[i].id == custrecord_pihd_hold_reason ){
							isScriptOnlyReason = true;
						}
					}

					//if script only is checked then
					if (isScriptOnlyReason == true){
						context.currentRecord.setValue({
							fieldId: 'custrecord_pihd_hold_status',
							value: openStatusValue
						});						
					}

				}
				//</ATP-843>


				// If changed to Released then unprotect the Off Hold Comment, Case and Document 
				// fields to enable data entry 
				if (currentStatus === payInstrHoldSts.Cleared) { // Released
					// Show fields 
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_case'
					}).isDisplay = true;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_doc'
					}).isDisplay = true;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_comment'
					}).isDisplay = true;
					// context.currentRecord.getField({
					// 	fieldId: 'custrecord_pihd_sched_rls_dt'
					// }).isDisplay = true;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_by'
					}).isDisplay = true;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_ts'
					}).isDisplay = true;
				} else {
					// Hide fields 
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_case'
					}).isDisplay = false;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_doc'
					}).isDisplay = false;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_comment'
					}).isDisplay = false;
					// context.currentRecord.getField({
					// 	fieldId: 'custrecord_pihd_sched_rls_dt'
					// }).isDisplay = false;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_by'
					}).isDisplay = false;
					context.currentRecord.getField({
						fieldId: 'custrecord_pihd_offhold_ts'
					}).isDisplay = false;
				}
			}

			if (context.fieldId == 'custrecord_pihd_hold_reason') {
				validateHoldReasonChoice(context);
			}


			//<ATP-843>
			if (context.fieldId == 'custpage_pihd_hold_reason' ) {
				var custpage_pihd_hold_reason = context.currentRecord.getValue ({
					fieldId: 'custpage_pihd_hold_reason'
				})
				var custrecord_pihd_hold_reason = context.currentRecord.getValue ({
					fieldId: 'custrecord_pihd_hold_reason'
				})
				var custrecord_pihd_hold_reasonObj = context.currentRecord.getField({
					fieldId: 'custrecord_pihd_hold_reason'
				})

				if ( custrecord_pihd_hold_reasonObj.isDisabled == false){
					context.currentRecord.setValue({
						fieldId: 'custrecord_pihd_hold_reason',
						value: custpage_pihd_hold_reason
					});
					custrecord_pihd_hold_reasonObj.isDisplay == false
				} else {
					var custpage_pihd_hold_reasonObj = context.currentRecord.getField({
						fieldId: 'custpage_pihd_hold_reason'
					});
					custpage_pihd_hold_reasonObj.isDisplay = false;
				}

			}
			//</ATP-843>

			console.log('FC-end- custrecord_pihd_hold_reason='+custrecord_pihd_hold_reason+' * custpage_pihd_hold_reason='+custpage_pihd_hold_reason);
			
		}

		function saveRecord(context) {
			console.log('saveRecord','context: ' + JSON.stringify(context));
			var holdReason = parseInt(context.currentRecord.getValue({
				fieldId: 'custrecord_pihd_hold_reason'
			})) || null;
			console.log('fieldChanged holdReason: ' + holdReason);
			var holdSource = parseInt(context.currentRecord.getValue({
				fieldId: 'custrecord_pihd_hold_src'
			})) || null;
			console.log('fieldChanged holdSource: ' + holdSource);
			if (holdReason === paymtInstrHoldReason.PendingSubmission && holdSource === paymtInstrHoldSrc.StaffEntry) {
				var errMsg = 'Hold Reason "Pending Submission" is reserved for script-created holds';
				showErrorMessage(errMsg);
				return false;

			}
			return true;
		}

		function showErrorMessage(msgText) {
			var myMsg = msg.create({
				title: "Cannot Save Record",
				message: msgText,
				type: msg.Type.ERROR
			});
			myMsg.show({
				duration: 7500
			});
		}

		function validateHoldReasonChoice(context) {
			holdReason = parseInt(context.currentRecord.getValue({
				fieldId: 'custrecord_pihd_hold_reason'
			})) || null;
			console.log('fieldChanged holdReason: ' + holdReason);

			if (holdReason === paymtInstrHoldReason.PendingSubmission) {
				//Warn user and reject choice
				// context.currentRecord.setValue({
				// 		fieldId: 'custrecord_pihd_hold_reason',
				// 		value: null
				// 	});
				var options = {
					title: 'Please select any other Hold Reason.',
					message: '"Pending Submission" is reserved for script-created holds.'
				};
				dialog.alert(options).then(function(result) {
						console.log("Completed: " + result);
						if (result) {
							console.log('warnUser OK ');
						} else {
							console.log('warnUser CANCEL');
							// The user choice is CANCEL and therefore
							// ideally I want to undo the user's choice but I don't know how yet
						}
					})
					.catch(function(reason) {
						console.log("Failed: " + reason);
						//do something on failure
					});
			}

		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			saveRecord: saveRecord
		};
	});