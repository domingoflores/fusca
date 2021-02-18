/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/ui/dialog', 'N/search'],
	/**
	 * -----------------------------------------------------------
	 * dsSuiteletClient.js
	 * ___________________________________________________________
	 * Document Selection Suitelet client script 
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2017-11-18	
	 * ___________________________________________________________
	 */
	function(msg, dialog, search) {

		var dealEvent = null;
		var selectedDGEID = null;
		var selectedDGEName = null;
		var dsSublist = null;
		var currentDGEID = null;
		var docSelectionSuiteletID = 1047;
		var userChoice = null;

		function pageInit(context) {
			// console.log('pageInit context: ' + JSON.stringify(context));
		}

		function saveRecord(context) {
			var errMsg = null;
			console.log(' saveRecord context: ' + JSON.stringify(context));
			var dealEvent = context.currentRecord.getValue({
				fieldId: 'custpage_dealevent'
			}) || null;
			console.log('saveRecord dealEvent: ' + JSON.stringify(dealEvent));
			var selectedDGEID = context.currentRecord.getValue({
				fieldId: 'custpage_selected_dge_id'
			}) || null;
			console.log('saveRecord selectedDGEID: ' + JSON.stringify(selectedDGEID));
			var selectedDGEName = context.currentRecord.getText({
				fieldId: 'custpage_selected_dge_id'
			}) || null;
			console.log('saveRecord selectedDGEName: ' + JSON.stringify(selectedDGEName));
			var selectedAction = JSON.parse(context.currentRecord.getValue({
				fieldId: 'custpage_selected_action'
			})) || null;
			console.log('saveRecord selectedAction.selectedActionID: ' + JSON.stringify(selectedAction.selectedActionID));
			console.log('saveRecord selectedAction.selectedStepID: ' + JSON.stringify(selectedAction.selectedStepID));

			// If document deletion has been requested then check and count how many documents from this DGE have already 
			// been interacted with (Document Signed Status is not null) by an end user.
			if (selectedAction.selectedStepID === '1' && selectedAction.selectedActionID === '7') {
				var signedDoc = JSON.parse(docAlreadySigned(dealEvent, selectedDGEID)) || null;
				console.log('saveRecord signedDoc: ' + JSON.stringify(signedDoc));
				// If there is at least one signed document then prevent the document deletion 
				if (signedDoc && signedDoc.count > 0) {
					// warnUserOfSignedDocs(context, signedDoc); // I could not work out how to use this properly
					
					errMsg = 'Cannot delete documents for this Document Generation event ';
					if (signedDoc.count === 1) {
						errMsg += ' because document ' + signedDoc.ID + ' has already been signed. ';
						errMsg += 'Signed status: ' + signedDoc.signedStatus;
					} else {
						errMsg += ' because ' + signedDoc.count + ' documents have already been signed. ';
						errMsg += 'e.g. Document: ' + signedDoc.ID + ' with Signed Status: ' + signedDoc.signedStatus;
					}
					context.currentRecord.setValue({
						fieldId: 'custpage_scheduled_script_status',
						value: errMsg
					});

					showErrorMessage(errMsg);
					return false;
				}
			}
			return true;
		}

		function fieldChanged(context) {
			console.log(' fieldChanged context: ' + JSON.stringify(context));
			var rec = context.currentRecord;
			// console.log('fieldChanged rec: ' + JSON.stringify(rec));
			dealEvent = context.currentRecord.getValue({
				fieldId: 'custpage_dealevent'
			});
			// console.log('fieldChanged dealEvent: ' + JSON.stringify(dealEvent));
			selectedDGEID = context.currentRecord.getValue({
				fieldId: 'custpage_selected_dge_id'
			});
			console.log('fieldChanged selectedDGEID: ' + JSON.stringify(selectedDGEID));
			selectedDGEName = context.currentRecord.getText({
				fieldId: 'custpage_selected_dge_id'
			});
			console.log('fieldChanged selectedDGEName: ' + JSON.stringify(selectedDGEName));
			// User changing DGE
			// The concern with this is that the select options on offer in the Action field
			// are based on the DGE defaulted (in a GET situation) or last selected by the user 
			// (in a POST situation) and are probably not appropriate for this new DGE.
			// Ideally I'd like to force a submit at this point so that the Action field select 
			// options can regain their integrity. However, until I can learn to do that, I will
			// remove all select options except for the blank(view) option. This way at least
			// I am not displaying options that are inappropriate.
			// NOTE TO KEN: 
			// If the user chooses the last submitted DGE (i.e. the one the screen is set up for) 
			// then you should replace the select options appropriate for that DGE.
			if (context.fieldId == 'custpage_selected_dge_id') {
				// Get the current DGE ID
				currentDGEID = parseInt(context.currentRecord.getValue({
					fieldId: 'custpage_current_dge_id'
				})) || null;
				console.log('fieldChanged currentDGEID: ' + currentDGEID);
				changeActionFieldSelectOptions(context);
			}
			// If a sublist field has changed then we must check whether a document is being 
			// allocated to the same group of shareholders and warn the user if so.
			// Also check that the cell selection has been made using the selected DGE only
			// just to impress upon the user that I am offering DGE selections that are
			// inappropriate but given that this is a sublist field, the selections are made at 
			// the column (doc template) level and apply across all rows (shareholder groups). If
			// I remove a select option from one of these sublist fields then it is removed from all rows.
			// That is not what we want.
			// I could accept all new selections and assume that the user really intended to pick the 
			// current DGE but that seems too dangerous to me. So I will insist on the user selecting the 
			// current DGE in their cell selection. 
			if (context.sublistId === 'doc_sel_sublist') {
				dsSublist = context.currentRecord.getSublist({
					sublistId: 'doc_sel_sublist'
				});
				console.log('fieldChanged dsSublist: ' + JSON.stringify(dsSublist));

				// Try getting a sublist column just for kicks
				// This fails with 'TypeError dsSublist.getColumn is not a function'
				// var objColumn = dsSublist.getColumn({
				// 	fieldId: 'custpage_sectype'
				// });
				// console.log('fieldChanged objColumn: ' + JSON.stringify(objColumn));

				if (dsSublist.isChanged) {
					handleSublistFieldChanges(context);
				}
			}
		}

		function changeActionFieldSelectOptions(context) {
			// Get action field 
			var selectedActionField = context.currentRecord.getField({
				fieldId: 'custpage_selected_action'
			});
			// Get all select options 
			var selectedActionFieldOptions = selectedActionField.getSelectOptions({
				filter: '',
				operator: 'startswith'
			});
			console.log('changeActionFieldSelectOptions: ' + JSON.stringify(selectedActionFieldOptions));
			// Remove all select options
			selectedActionField.removeSelectOption({
				value: null
			});
			// Now insert just the View option
			var selectOptionToAdd = JSON.stringify({
				selectedStepID: '1',
				selectedActionID: '9'
			});
			selectedActionField.insertSelectOption({
				value: selectOptionToAdd,
				text: 'View'
			});
			// If the user has come back round to selecting the current DGE then it would be nice to put the 
			// original options back
			if (selectedDGEID === currentDGEID) {
				console.log('changeActionFieldSelectOptions: ' + 'Put options back at this point');
			}
		}

		function handleSublistFieldChanges(context) {
			var sdsList = null;
			var dsSublistField = null;
			dsSublistField = context.currentRecord.getSublistField({
				sublistId: dsSublist.id,
				fieldId: context.fieldId,
				line: context.line
			}) || null;
			console.log('fieldChanged dsSublistField: ' + JSON.stringify(dsSublistField));
			// Now get its value
			var dsSublistFieldValue = JSON.parse(context.currentRecord.getSublistValue({
				sublistId: dsSublist.id,
				fieldId: context.fieldId,
				line: context.line
			})) || null;
			console.log('fieldChanged dsSublistFieldValue: ' + JSON.stringify(dsSublistFieldValue));

			// Try to get cert type column
			var secTypeID = context.currentRecord.getSublistValue({
				sublistId: dsSublist.id,
				fieldId: 'custpage_sectypeid',
				line: context.line
			}) || null;
			// console.log('fieldChanged secTypeID: ' + JSON.stringify(secTypeID));
			// Try to get ex rec gp column
			var exRecGpID = context.currentRecord.getSublistValue({
				sublistId: dsSublist.id,
				fieldId: 'custpage_exrecgpid',
				line: context.line
			}) || null;
			// console.log('fieldChanged exRecGpID: ' + JSON.stringify(exRecGpID));
			// Get the DGE select options in each cellfield
			var dsSublistFieldOptions = dsSublistField.getSelectOptions({
				filter: '',
				operator: 'startswith'
			});
			console.log('fieldChanged dsSublistFieldOptions: ' + JSON.stringify(dsSublistFieldOptions));

			var firstOptionObj = JSON.parse(dsSublistFieldOptions[0].value);

			if (dealEvent) {
				sdsList = buildStoredDocSelections(dealEvent);
			}
			// console.log('fieldChanged sdsList: ' + JSON.stringify(sdsList));

			var docTemplID = firstOptionObj.docTemplID || null;
			console.log('fieldChanged docTemplID: ' + docTemplID);

			// Check to ensure that the selection is made with the selected DGE. If so, 
			// Show a dialog and allow the user to continue if they wish
			var otherDGE = JSON.parse(isDocSelectedForOtherDGE(selectedDGEID, sdsList, secTypeID, exRecGpID, docTemplID));
			if (dsSublistFieldValue.dgeID !== '-3' && selectedDGEID !== dsSublistFieldValue.dgeID) {
				if (otherDGE && otherDGE.dgeID === dsSublistFieldValue.dgeID) {} else {
					warnUserOfInvalidDGEChoice(context, selectedDGEName);
				}
			}
			// Check to ensure that the selection has not already been made. If so, 
			// Show a dialog and allow the user to continue if they wish
			if (otherDGE && otherDGE.dgeID !== dsSublistFieldValue.dgeID && otherDGE.dgeID !== null) {
				warnUserOfDuplicateChoice(otherDGE, dsSublist, context);
			}
		}

		function warnUserOfSignedDocs(context, signedDoc) {

			var options = {
				title: 'Are you sure?',
				message: signedDoc.count + ' documents have already been signed. Press CANCEL to return or OK to delete nonetheless.'
			};
			dialog.confirm(options).then(function(result) {
					console.log("Completed: " + result);
					if (result) {
						console.log('warnUserOfSignedDocs OK ');
						userChoice = 'OK';
						console.log('warnUserOfSignedDocs userChoice: ' + userChoice);
					} else {
						console.log('warnUserOfSignedDocs CANCEL');
						userChoice = 'CANCEL';
						console.log('warnUserOfSignedDocs userChoice: ' + userChoice);
					}
				})
				.catch(function(reason) {
					console.log("Failed: " + reason);
					//do something on failure
				});
		}

		function warnUserOfInvalidDGEChoice(context, selectedDGEName) {
			var dgeName = selectedDGEName.substring(0, selectedDGEName.search(" "));
			var options = {
				title: 'Please use the selected Document Generation Event',
				message: 'Current Document Generation Event is ' + dgeName + '. Please use it when making selections'
			};
			dialog.alert(options).then(function(result) {
					console.log("Completed: " + result);
					if (result) {
						console.log('warnUserOfInvalidDGEChoice OK ');
					} else {
						console.log('warnUserOfInvalidDGEChoice CANCEL');
						// The user choice is CANCEL and therefore
						// ideally I want to undo the user's choice but I don't know how yet
					}
				})
				.catch(function(reason) {
					console.log("Failed: " + reason);
					//do something on failure
				});
		}

		function warnUserOfDuplicateChoice(otherDGE, dsSublist, context) {
			var options = {
				title: 'Are you sure?',
				message: 'This selection has already been made in Document Generation Event ' + otherDGE.dgeName + '.'
			};
			dialog.alert(options).then(function(result) {
					console.log("Completed: " + result);
					if (result) {
						console.log('warnUserOfDuplicateChoice OK dsSublist: ' + JSON.stringify(dsSublist));
					} else {
						console.log('warnUserOfDuplicateChoice CANCEL dsSublist: ' + JSON.stringify(dsSublist));
						// The user choice is CANCEL and therefore
						// ideally I want to undo the user's choice but I don't know how yet
					}
				})
				.catch(function(reason) {
					console.log("Failed: " + reason);
					//do something on failure
				});
		}

		function isDocSelectedForOtherDGE(docGenEvent, sdsList, certTypeID, exRecGpID, docTemplID) {
			var dge = null;
			for (var i = 0; i < sdsList.length; i++) {
				if (sdsList[i].certType === certTypeID && sdsList[i].exRecGp === exRecGpID && sdsList[i].docTempl === docTemplID) {
					if (sdsList[i].docGenEvent !== docGenEvent) {
						dge = JSON.stringify({
							dgeID: sdsList[i].docGenEvent,
							dgeName: sdsList[i].dgeName
						});
						break;
					}
				}
			}
			return dge;
		}
		/**
		 * Constructs a list of Stored Doc Selection objects for the whole Deal Event
		 * @return {array}             approval step linked list
		 */
		function buildStoredDocSelections(dealEvent) {
			var sdsRecords = null;

			sdsRecords = getStoredDocSelectionMatrix(dealEvent);
			// console.log('buildStoredDocSelections', 'sdsRecords: ' + JSON.stringify(sdsRecords));
			var sdsList = [];
			var sds = null;
			for (var i = 0; i < sdsRecords.length; i++) {
				sds = buildSDS(sdsRecords[i]);
				sdsList.push(sds);
			}

			return sdsList;
		}

		function getStoredDocSelectionMatrix(dealEvent) {
			var filters = [{
				name: 'custrecord_ds_deal_event',
				operator: search.Operator.IS,
				values: dealEvent
			}, {
				name: 'isinactive',
				operator: search.Operator.IS,
				values: 'F'
			}];

			var xjoinsearch = search.create({
				type: 'customrecord_document_selection',
				title: 'XjoinRows',
				columns: [{
					name: 'internalid',
					sort: search.Sort.DESC
				}, {
					name: 'name',
					join: 'custrecord_ds_doc_template'
				}, {
					name: 'custrecord_ds_cert_type'
				}, {
					name: 'custrecord_ds_deal_event'
				}, {
					name: 'custrecord_ds_doc_gen_event'
				}, {
					name: 'custrecord_ds_exrec_gp'
				}, {
					name: 'custrecord_ds_doc_template'
				}, {
					name: 'custrecord_dt_ext_file',
					join: 'custrecord_ds_doc_template'
				}, {
					name: 'name',
					join: 'custrecord_ds_doc_gen_event'
				}],
				filters: filters
			});

			var searchResults = xjoinsearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}

		/**
		 * Construct an individual doc gen event object
		 * @param  {object} step raw NetSuite search result
		 * @return {object}      formatted approval step
		 */
		function buildSDS(sds) {
			return {
				id: sds.id,
				dealEvent: sds.getValue('custrecord_ds_deal_event') || null,
				docGenEvent: sds.getValue('custrecord_ds_doc_gen_event') || null,
				dgeName: sds.getValue({
					name: 'name',
					join: 'custrecord_ds_doc_gen_event'
				}) || null,
				docTempl: sds.getValue('custrecord_ds_doc_template') || null,
				certType: sds.getValue('custrecord_ds_cert_type') || null,
				exRecGp: sds.getValue('custrecord_ds_exrec_gp') || null,
				dtExtFile: sds.getValue({
					name: 'custrecord_dt_ext_file',
					join: 'custrecord_ds_doc_template'
				}) || null,
			};
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

		function docAlreadySigned(dealEvent, docGenEvent) {
			var signedDocList = findSignedDoc(dealEvent, docGenEvent);
			console.log('docAlreadySigned', 'signedDocList: ' + JSON.stringify(signedDocList[0]));

			var signedDoc = null;
			if (signedDocList.length > 0) {
				console.log('docAlreadySigned', 'signedDocList Count: ' + JSON.stringify(signedDocList.length));
				var signedDocID = signedDocList[0].getValue({
					name: 'internalid',
				}) || null;
				var signedDocSignedStatus = signedDocList[0].getText({
					name: 'custrecord_doc_signed_status',
				}) || null;
				var signedDocDGEID = signedDocList[0].getText({
					name: 'custrecord_doc_doc_gen_event',
				}) || null;
				var signedDocEsign = signedDocList[0].getText({
					name: 'custrecord_doc_backup_link',
				}) || null;
				var signedDocEsignJSON = signedDocList[0].getText({
					name: 'custrecord_echosign_json',
				}) || null;
				signedDoc = JSON.stringify({
					dgeID: signedDocDGEID,
					count: signedDocList.length,
					ID: signedDocID,
					signedStatus: signedDocSignedStatus,
					esign: signedDocEsign,
					esignJSON: signedDocEsignJSON
				});
			}
			return signedDoc;
		}

		function findSignedDoc(dealEvent, docGenEvent) {
			var signedDocSearch = search.create({
				type: 'customrecord_document_management',
				title: 'signed docs',
				columns: [{
					name: 'internalid'
				}, {
					name: 'custrecord_doc_doc_gen_event'
				}, {
					name: 'custrecord_doc_signed_status'
				}, {
					name: 'custrecord_doc_backup_link'
				}, {
					name: 'custrecord_echosign_json'
				}],
				filters: [{
					name: 'custrecord_document_mpr',
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'custrecord_doc_doc_gen_event',
					operator: search.Operator.IS,
					values: docGenEvent
				}, {
					name: 'custrecord_doc_signed_status',
					operator: search.Operator.NONEOF,
					values: '@NONE@'
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}, {
					name: 'custrecord_doc_created_by_script',
					operator: search.Operator.IS,
					values: docSelectionSuiteletID // Document Selection Suitelet
				}]

			});


			var searchResults = '';

			searchResults = signedDocSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}

		return {
			saveRecord: saveRecord,
			fieldChanged: fieldChanged,
			pageInit: pageInit
		};
	});