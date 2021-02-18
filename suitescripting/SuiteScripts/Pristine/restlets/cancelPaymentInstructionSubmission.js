/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(['N/record', 'N/error', 'N/search', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js',
		'/SuiteScripts/Pristine/libraries/searchLibrary.js', 'SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
	],
	function(record, error, search, piListLib, searchLibrary, exRecAlpha) {
		var recordType = piListLib.recordType;
		var fieldId = piListLib.fieldId;
		var payInstrHoldSts = piListLib.piEnum.payInstrHoldSts;


		// Get a standard NetSuite record
		function _get(context) {
			log.debug('_get', 'context' + JSON.stringify(context));
			doValidation([context.custscript_pi_submission_id], [fieldId.piSub], 'GET');

			return JSON.stringify(record.load({
				type: recordType.piSub,
				id: context.custscript_pi_submission_id
			}));
		}

		// Upsert a NetSuite record from request param
		function _put(context) {
			log.debug('_put', 'context: ' + JSON.stringify(context));
			var success = true;
			var message = '';
			doValidation([context.custscript_pi_submission_id], [fieldId.piSub], 'PUT');

			var pisRec = record.load({
				type: recordType.piSub,
				id: context.custscript_pi_submission_id
			});
			log.debug('_put', 'pisRec: ' + JSON.stringify(pisRec));
			for (var fldName in context)
				if (context.hasOwnProperty(fldName))
					if (fldName !== fieldId.piSub)
						pisRec.setValue(fldName, context[fldName]);
			pisRec.save();
			// Now that the PI Submission has been cancelled, decide if PIS was created to update an existing PI
			var changingExistingPI = pisRec.getValue({
				fieldId: fieldId.piSubChangeExisting
			});
			log.debug('_put', 'changingExistingPI: ' + changingExistingPI);
			// the PI on Hold field contains the ID of the PI on hold
			var piOnHoldID = pisRec.getValue({
				fieldId: fieldId.piSubUpdatingPI
			});
			log.debug('_put', 'piOnHoldID: ' + piOnHoldID);
			// Get shareholder
			var shareholder = pisRec.getValue(fieldId.piSubShareholder);
			var deal = pisRec.getValue(fieldId.piSubDeal);
			var exRec = pisRec.getValue(fieldId.piSubExRec);
			// if PIS was created to update an existing PI then cancel the hold
			if (changingExistingPI && piOnHoldID) {
				cancelPIHold(context.custscript_pi_submission_id, piOnHoldID);
			}
			return JSON.stringify(pisRec);
		}

		function doValidation(args, argNames, methodName) {
			for (var i = 0; i < args.length; i++)
				if (!args[i] && args[i] !== 0)
					throw error.create({
						name: 'MISSING_REQ_ARG',
						message: 'Missing a required argument: [' + argNames[i] + '] for method: ' + methodName
					});
		}

		function cancelPIHold(pisID, piOnHoldID) {
			try {
				var holdSearch = search.create({
					type: recordType.piHold,
					title: 'Holds',
					columns: [{
						name: 'internalid'
					}],
					filters: [{
						name: fieldId.piHoldSub,
						operator: search.Operator.IS,
						values: pisID
					}, {
						name: fieldId.piHoldPI,
						operator: search.Operator.IS,
						values: piOnHoldID
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				});

				holdSearch.run().each(function(result) {
					var piHoldID = result.getValue({
						name: 'internalid'
					});

					var updatedPIHoldID = record.submitFields({
						type: recordType.piHold,
						id: piHoldID,
						values: {
							custrecord_pihd_hold_status: payInstrHoldSts.Canceled
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields: true
						}
					});

					return true;
				});
			} catch (e) {

				var error = {
					title: 'Cancel Hold RECORD ERROR:',
					message: e.message,
					func: 'cancelPIHold',
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
			log.debug('handleError', 'e: ' + JSON.stringify(e));
			var error = e.title + '\n\t@cancelPISubmission->' + e.func + '\n\t\t' + e.message;
			if (e.extra) {
				error += '\n\t\t(Additional Info: ' + e.extra + ')';
			}

			log.error(e.title, e.message);
			throw new Error(error);
		}

		return {
			get: _get,
			put: _put
		};
	});