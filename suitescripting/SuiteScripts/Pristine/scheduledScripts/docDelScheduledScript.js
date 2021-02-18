/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define(['N/record', 'N/search', 'N/runtime', 'N/email'],

	/**
	 * -----------------------------------------------------------
	 * dealEventDocDelScheduledScript.js
	 * ___________________________________________________________
	 * Module builds a scheduled script for Deal Event Document Configuration
	 * It deletes the documents for a given Deal Event
	 *
	 * Version 1.0
	 * Author: Ken Crossman & Peter Gail
	 * Version 2.0 - Updated to cope with multiple Doc Generation Events per Deal Event
	 * Author: Ken Crossman
	 * ___________________________________________________________
	 */

	function(record, search, runtime, email) {
		'use strict';

		var thisSuiteletID = null;
		var userEmailAddress = null;
		var dealEvent = null;
		var docGenEvent = null;
		var EMAIL_SENDER = 77671; // PRODUCTION WATCH: ensure correct internal id
		//Parameters
		var DEAL_EVENT_PARAM = 'custscript_dd_deal_event';
		var DOC_GEN_EVENT_PARAM = 'custscript_dd_doc_gen_event';
		var LAUNCH_SUITELET_PARAM = 'custscript_dd_launch_script';
		var USER_EMAIL_PARAM = 'custscript_dd_user_email';

		function execute(context) {
			log.debug('execute', 'Entered');
			dealEvent = runtime.getCurrentScript().getParameter({
				name: DEAL_EVENT_PARAM
			});
			docGenEvent = runtime.getCurrentScript().getParameter({
				name: DOC_GEN_EVENT_PARAM
			});
			thisSuiteletID = runtime.getCurrentScript().getParameter({
				name: LAUNCH_SUITELET_PARAM
			});
			userEmailAddress = runtime.getCurrentScript().getParameter({
				name: USER_EMAIL_PARAM
			});

			if (dealEvent && docGenEvent && thisSuiteletID) {
				detachDocsFromPrefill(dealEvent, docGenEvent);
				return deleteDocs(dealEvent, docGenEvent);
			}
			return null;
		}

		function detachDocsFromPrefill(dealEvent, selectedDGEID) {
			var prefillRecords = findPrefillsLinked2Docs(dealEvent, selectedDGEID);
			log.debug('detachDocsFromPrefill', 'prefillRecords: ' + JSON.stringify(prefillRecords));

			var updatedRecID = null;

			try {
				for (var i = 0; i < prefillRecords.length; i++) {

					updatedRecID = record.submitFields({
						type: 'customrecord_ch_doc_prefill',
						id: prefillRecords[i].id,
						values: {
							custrecord_cdp_document: null
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields: true
						}
					});

				}
			} catch (e) {
				var error = {
					title: 'UPDATE CH Prefill RECORD ERROR:',
					message: e.message,
					func: 'linkDGE2DocSelections',
					extra: null
				};
				handleError(error);
			}
		}

		function findPrefillsLinked2Docs(dealEvent, docGenEvent) {
			var prefillDocSearch = search.create({
				type: 'customrecord_ch_doc_prefill',
				title: 'Prefill Linked docs',
				columns: [{
					name: 'internalid',
					join: 'custrecord_cdp_document',
				}, {
					name: 'custrecord_doc_doc_gen_event',
					join: 'custrecord_cdp_document'
				}],
				filters: [{
					name: 'custrecord_document_mpr',
					join: 'custrecord_cdp_document',
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'custrecord_doc_doc_gen_event',
					join: 'custrecord_cdp_document',
					operator: search.Operator.IS,
					values: docGenEvent
				}, {
					name: 'custrecord_cdp_document',
					operator: search.Operator.NONEOF,
					values: '@NONE@'
				}, {
					name: 'custrecord_doc_created_by_script',
					join: 'custrecord_cdp_document',
					operator: search.Operator.IS,
					values: thisSuiteletID // Document Selection Suitelet
				}]
			});


			var searchResults = '';

			searchResults = prefillDocSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}

		function deleteDocs(dealEvent, docGenEvent) {
			log.debug('deleteDocs', 'Entered');
			log.debug('deleteDocs', 'dealEvent: ' + dealEvent);
			log.debug('deleteDocs', 'docGenEvent: ' + docGenEvent);
			try {

				var docSearch = search.create({
					type: 'customrecord_document_management',
					title: 'docs',
					columns: [{
						name: 'internalid'
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
						name: 'custrecord_doc_created_by_script',
						operator: search.Operator.IS,
						values: thisSuiteletID // Document Selection Suitelet
					}]

				});

				docSearch.run().each(function(result) {
					var docID = result.getValue({
						name: 'internalid'
					});
					record.delete({
						type: 'customrecord_document_management',
						id: docID
					});

					return true;
				});
			} catch (e) {
				email.send({
					author: EMAIL_SENDER,
					recipients: userEmailAddress,
					subject: 'NetSuite Scheduled Script: ERROR',
					body: 'An error has occured when attempting to run scheduled script ' + runtime.getCurrentScript().id + '\nERROR:' + '\n' + JSON.stringify(e)
				});

				var error = {
					title: 'DELETE DOC RECORD ERROR:',
					message: e.message,
					func: 'deleteDocs',
					extra: null
				};
				handleError(error);
			}
		}

		/**
		 * Handles error logging and display
		 * @param  {object} e custom error object
		 * @return {Error}   new custom Error
		 */
		function handleError(e) {
			var error = e.title + '\n\t@dealEventDocDelScheduledScript.js->' + e.func + '\n\t\t' + e.message;
			if (e.extra) {
				error += '\n\t\t(Additional Info: ' + e.extra + ')';
			}
			log.error(e.title, e.message);
			throw new Error(error);
		}

		return {
			execute: execute
		};
	});