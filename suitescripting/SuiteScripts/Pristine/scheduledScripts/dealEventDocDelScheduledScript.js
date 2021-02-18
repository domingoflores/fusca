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
	 * ___________________________________________________________
	 */

	function(record, search, runtime, email) {
		'use strict';

		var thisSuiteletID = null;
		var userEmailAddress = null;
		var dealEvent = null;
		var EMAIL_SENDER = 77671; // PRODUCTION WATCH: ensure correct internal id

		function execute(context) {

			dealEvent = runtime.getCurrentScript().getParameter({name: 'custscript_de_doc_del_dealevent'});
			thisSuiteletID = runtime.getCurrentScript().getParameter({name: 'custscript_de_doc_del_suitelet_id'});
			userEmailAddress = runtime.getCurrentScript().getParameter({name: 'custscript_de_doc_del_user_email'});

			if (dealEvent && thisSuiteletID) {
				return deleteDocs(dealEvent);
			}
			return null;
		}

		function deleteDocs(dealEvent) {
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
			} catch(e) {
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