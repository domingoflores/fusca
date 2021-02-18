//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// Authors: Carl Zeng, Marty Zigman
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(
		[ 'N/error', 'N/record', 'N/runtime', 'N/search',
				'./PRI_CustomRecord_LIB' ],
		/**
		 * @param {error}
		 *            error
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(error, record, runtime, search, UTIL_INC) {

			/**
			 * Recalc name field value in client script
			 * 
			 * @param {object}
			 *            scriptContext
			 * @param {object}
			 *            clsIncrementer
			 * @param {string}
			 *            strChangedFldId
			 */
			function pri_CustomRecord_RecalcName(scriptContext, clsIncrementer,
					strChangedFldId) {

				var currentRecord = scriptContext.currentRecord;
				var strNamePatternOffer = clsIncrementer.strNamePattern;
				var strDelimiter = clsIncrementer.strDelimiter;
				var strIncrement = clsIncrementer.strIncrement;
				var strFieldId = clsIncrementer.strFieldId;

				var arrFldIds = strNamePatternOffer.match(/{\w+}/g);
				if (arrFldIds
						&& (!strChangedFldId || arrFldIds.indexOf('{'
								+ strChangedFldId + '}') != -1)) {

					var strNamePatternOffer = clsIncrementer.parsePattern();

					var strFoundPreviousRec = false;

					// [1] Promise callback when exist previous record
					var pri_Recalc_PromiseCallback = function(
							objCustRecSearchRes) {

						strFoundPreviousRec = true;
						log.debug({
							title : "Completed: " + objCustRecSearchRes,
							details : 'strFoundPreviousRec: '
									+ strFoundPreviousRec
									+ 'stringify.objCustRecSearchRes: '
									+ JSON.stringify(objCustRecSearchRes)
						});

						var strRecentRecName = objCustRecSearchRes.getValue({
							name : strFieldId
						});
						if (strRecentRecName) {
							strIncrement = strRecentRecName;

							log.debug('RecalcName', 'Searched name: '
									+ strIncrement);
							if (strIncrement) {
								var arrIncrement = strIncrement
										.split(strDelimiter);
								strIncrement = arrIncrement[arrIncrement.length - 1];
							}

							log.debug('RecalcName',
									'Searched strIncrement after pickup [1]: '
											+ strIncrement);
							strIncrement = clsIncrementer
									.getIncrementId(strIncrement);
						}
						strNamePatternOffer += strIncrement;

						currentRecord.setValue({
							fieldId : strFieldId,
							value : strNamePatternOffer,
							ignoreFieldChange : true
						});
					};

					// [1] Promise callback then after above callback
					var pri_Recalc_PromiseCallback_Then = function(response) {
						log
								.debug({
									title : "pri_Recalc_PromiseCallback_Then, Completed, response: "
											+ response,
									details : 'strFoundPreviousRec: '
											+ strFoundPreviousRec
											+ ', strNamePatternOffer: '
											+ strNamePatternOffer
								});

						if (strFoundPreviousRec == false) {
							strNamePatternOffer += clsIncrementer.strIncrement;
							currentRecord.setValue({
								fieldId : strFieldId,
								value : strNamePatternOffer,
								ignoreFieldChange : true
							});
						}
					};

					// Search latest record type list, get previous record name.
					clsIncrementer.getPreviousRecName_promise(
							strNamePatternOffer, pri_Recalc_PromiseCallback,
							pri_Recalc_PromiseCallback_Then);
				}
			}

			/**
			 * Function to be executed after page is initialized.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.mode - The mode in which the record is
			 *            being accessed (create, copy, or edit)
			 * 
			 * @since 2015.2
			 */
			function pageInit(scriptContext) {

				var objScript = runtime.getCurrentScript();
				var strNamePatternOffer = objScript.getParameter({
					name : 'custscript_pri_custrec_namepattern_offer'
				});
				var strDelimiter = objScript.getParameter({
					name : 'custscript_pri_custrec_delimiter_offer'
				});
				var strIncrement = objScript.getParameter({
					name : 'custscript_pri_custrec_increment_offer'
				});
				var strFieldId = objScript.getParameter({
					name : 'custscript_pri_custrec_updatefld_offer'
				});
				var clsIncrementer = new UTIL_INC.INCREMENTER({
					scriptContext : scriptContext,
					strNamePattern : strNamePatternOffer,
					strDelimiter : strDelimiter,
					strIncrement : strIncrement,
					strFieldId : strFieldId
				});
				window.clsIncrementer = clsIncrementer;

				switch (scriptContext.mode) {
				case 'create':
				case 'copy':

					pri_CustomRecord_RecalcName(scriptContext, clsIncrementer);
					break;
				}
				return true;
			}

			/**
			 * Function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @since 2015.2
			 */
			function fieldChanged(scriptContext) {

				if (window.clsIncrementer)
					pri_CustomRecord_RecalcName(scriptContext,
							window.clsIncrementer, scriptContext.fieldId);

				// switch (scriptContext.fieldId) {
				// case '':
				// break;
				//
				// }
				return true;
			}

			/**
			 * Function to be executed when field is slaved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * 
			 * @since 2015.2
			 */
			function postSourcing(scriptContext) {

			}

			/**
			 * Function to be executed after sublist is inserted, removed, or
			 * edited.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function sublistChanged(scriptContext) {

			}

			/**
			 * Function to be executed after line is selected.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function lineInit(scriptContext) {

			}

			/**
			 * Validation function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @returns {boolean} Return true if field is valid
			 * 
			 * @since 2015.2
			 */
			function validateField(scriptContext) {

			}

			/**
			 * Validation function to be executed when sublist line is
			 * committed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateLine(scriptContext) {

			}

			/**
			 * Validation function to be executed when sublist line is inserted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateInsert(scriptContext) {

			}

			/**
			 * Validation function to be executed when record is deleted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateDelete(scriptContext) {

			}

			/**
			 * Validation function to be executed when record is saved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @returns {boolean} Return true if record is valid
			 * 
			 * @since 2015.2
			 */
			function saveRecord(scriptContext) {

			}

			return {
				pageInit : pageInit,
				fieldChanged : fieldChanged,
			// postSourcing : postSourcing,
			// sublistChanged : sublistChanged,
			// lineInit : lineInit,
			// validateField : validateField,
			// validateLine : validateLine,
			// validateInsert : validateInsert,
			// validateDelete : validateDelete,
			// saveRecord : saveRecord
			};

		});
