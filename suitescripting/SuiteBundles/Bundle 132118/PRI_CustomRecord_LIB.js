//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// Authors: Carl Zeng, Marty Zigman
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @description Pattern supports(in below sequence): <br>
 *              Type #1: record field id. {tranid} <br>
 *              Type #2: javascript eval. {#new Date()#}[support: Type#1]<br>
 *              Type #3: delimiter. {%DELIMITER%} <br>
 *              Sample: <br>
 *              {#new Date().getFullYear().toString().substr(2)#}<br>
 *              {#("{tranid}").substring(0, 2)#}<br>
 *              {#(new Date().getMonth()+1).toString().length < 10 ? "0"+(new
 *              Date().getMonth()+1) : (new Date().getMonth()+1)#}
 * 
 */
define(
		[ 'N/error', 'N/record', 'N/runtime', 'N/search' ],
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
		function(error, record, runtime, search) {

			// --------------------- Incrementer Class -------------------
			function INCREMENTER(options) {

				var objScript = runtime.getCurrentScript();
				this.strContextType = runtime.executionContext;

				// NOTE: 1. This's a switch on/off for AUTO-NAME feature or
				// AUTO-INCREMENT for name field feature.
				// 2. When 'Auto Name' feature enabled(AUTO NAME PATTERN
				// defined), name field will be force to be inline-text, not
				// allow manually put value to name field.
				this.strNamePattern = objScript.getParameter({
					name : 'custscript_pri_custrec_namepattern'
				});

				// NOTE: 'AUTO DELIMITER' parameter is a MUST when using AUTO
				// INCREMENT only feature, otherwise script can't decide to add
				// increment or don't add-in again.
				this.strDelimiter = objScript.getParameter({
					name : 'custscript_pri_custrec_delimiter'
				});

				this.strIncrement = objScript.getParameter({
					name : 'custscript_pri_custrec_increment'
				});

				// Target Update Field Id
				this.strFieldId = objScript.getParameter({
					name : 'custscript_pri_custrec_updatefld'
				});

				if (options) {
					this.scriptContext = options.scriptContext;

					// Supported both user event and client script
					this.currentRecord = Boolean(this.scriptContext) ? (this.scriptContext.newRecord ? this.scriptContext.newRecord
							: this.scriptContext.currentRecord)
							: '';

					// Supported override global properties in CLASS
					this.strNamePattern = (typeof (options.strNamePattern) != 'undefined') ? options.strNamePattern
							: this.strNamePattern;
					this.strDelimiter = (typeof (options.strDelimiter) != 'undefined') ? options.strDelimiter
							: this.strDelimiter;
					this.strIncrement = (typeof (options.strIncrement) != 'undefined') ? options.strIncrement
							: this.strIncrement;
					this.strFieldId = (typeof (options.strFieldId) != 'undefined') ? options.strFieldId
							: this.strFieldId;
				}

				if (!this.strDelimiter)
					this.strDelimiter = '';

				if (!this.strFieldId)
					this.strFieldId = 'name';

				this.strInitName = 'To Be Generated';
				log.debug('INCREMENTER class instance', 'currentRecord: '
						+ this.currentRecord + '. options > strNamePattern: '
						+ options.strNamePattern + ', strDelimiter: '
						+ options.strDelimiter + ', strIncrement: '
						+ options.strIncrement + '. this > strNamePattern: '
						+ this.strNamePattern + ', strDelimiter: '
						+ this.strDelimiter + ', strIncrement: '
						+ this.strIncrement);

				return true;
			}

			/**
			 * Get next incremented number. Rule: string, Next ASCII value;
			 * number, Next number value
			 * 
			 * @param {String}
			 *            strIncrement Increment Value, can be string and number
			 * @returns {String}|{Number}
			 */
			INCREMENTER.prototype.getIncrementId = function(strIncrement) {

				if (!strIncrement || strIncrement == '' || strIncrement == null)
					return;

				// Remove the space at the beginning of increment
				strIncrement = strIncrement.trim();

				if (strIncrement.length < 1)
					return;

				log.debug('getIncrementId', 'strIncrement: ' + strIncrement
						+ 'this.strIncrement: ' + this.strIncrement);
				var strIncrementLen = strIncrement.length;

				if (this.strIncrement
						&& strIncrement.length < this.strIncrement.length)
					strIncrementLen = this.strIncrement.length;

				if (typeof (Number(strIncrement)) == 'number'
						&& Number(strIncrement).toString() != 'NaN') {
					var intIncrementTmp = Number(strIncrement);
					intIncrementTmp++;

					if (intIncrementTmp.toString().length < strIncrementLen) {

						intIncrementTmp = (Array(strIncrementLen).join(0) + intIncrementTmp)
								.slice(-strIncrementLen);
					}

					log.debug('getIncrementId, number', 'strIncrement: '
							+ strIncrement + ', strIncrementLen: '
							+ strIncrementLen + ', return: ' + intIncrementTmp);
					return intIncrementTmp;
				}

				switch (typeof (strIncrement)) {
				case 'string':
					if (strIncrement.length > 1) {
						var arrChars = strIncrement.split('');
						var strLastChar = String
								.fromCharCode(arrChars[arrChars.length - 1]
										.charCodeAt(0) + 1);
						arrChars.pop();
						arrChars.push(strLastChar);
						strIncrement = arrChars.join('');
						log.debug('getIncrementId', 'arrChars: ' + arrChars
								+ ' strIncrement: ' + strIncrement);
					} else
						strIncrement = String.fromCharCode(strIncrement
								.charCodeAt(0) + 1);
					break;
				case 'number':
					strIncrement++;
					break;
				}

				log.debug('getIncrementId, string', 'type: '
						+ typeof (strIncrement) + ' return: ' + strIncrement);
				return strIncrement;
			};

			/**
			 * Enable Name Field for editing.
			 * 
			 * @param {boolean}
			 *            bolEnable true for open name field editing.
			 * @returns {void}
			 */
			INCREMENTER.prototype.enableNameFld = function(bolEnable) {
				var scriptContext = this.scriptContext;

				if (scriptContext.form.getField(this.strFieldId)) {
					if (bolEnable == true)
						scriptContext.form.getField(this.strFieldId)
								.updateDisplayType({
									displayType : 'normal'// ui.FieldDisplayType.NORMAL
								});
					else
						scriptContext.form.getField(this.strFieldId)
								.updateDisplayType({
									displayType : 'inline'// ui.FieldDisplayType.INLINE
								});
				}
			};

			/**
			 * Parse Pattern data to detail real data
			 * 
			 * @returns {string}
			 */
			INCREMENTER.prototype.parsePattern = function() {

				var strParsedInitName = this.strNamePattern;
				var currentRecord = this.currentRecord;
				var bolErrorInParse = false;

				// Only overwrite in Server Side
				if (currentRecord.id)
					// && this.strContextType !=
					// runtime.ContextType.USER_INTERFACE
					currentRecord = record.load({
						type : currentRecord.type,
						id : currentRecord.id,
						isDynamic : true
					});

				if (!strParsedInitName)
					return '';

				// Replace name field id to value
				var arrFldIds = strParsedInitName.match(/{\w+}/g);
				for (var i = 0; arrFldIds && i < arrFldIds.length; i++) {
					var strFldIdPattern = arrFldIds[i];
					var strFldId = strFldIdPattern.substring(1,
							strFldIdPattern.length - 1);

					var strFldVal;
					try {
						strFldVal = currentRecord.getText(strFldId);
					} catch (ex) {
						log.audit('INCREMENTER.prototype.parsePattern ERROR',
								'Failed to getText for strFldVal? ex: '
										+ JSON.stringify(ex));
					}
					if (!strFldVal)
						strFldVal = currentRecord.getValue(strFldId);

					strParsedInitName = strParsedInitName.replace(
							strFldIdPattern, strFldVal);

					if (strFldVal.length < 1)
						bolErrorInParse = true;
				}

				// 20180927/CZ Replace eval statement if applicable
				var arrEvals = strParsedInitName.match(/{#[^#}]+#}/g);
				for (var i = 0; arrEvals && i < arrEvals.length; i++) {
					var strEvalPattern = arrEvals[i];
					var strEvalStr = strEvalPattern ? strEvalPattern.substring(
							2, strEvalPattern.length - 2) : '';
					if (!strEvalStr)
						continue;

					// revert NS's encode
					var rv_encode = function(inp) {
						return inp.replace(/&amp;/g, '&').replace(/&lt;/g, '<')
								.replace(/&gt;/g, '>').replace(/&quot;/g, '"')
								.replace(/&apos;/g, "'");
					}
					strEvalStr = rv_encode(strEvalStr);

					var strEvalVal = '';
					try {
						strEvalVal = eval(strEvalStr);
					} catch (ex) {
						log.audit('INCREMENTER.prototype.parsePattern ERROR',
								'Failed to eval strEvalVal:' + strEvalStr
										+ ', ex: ' + JSON.stringify(ex));
					}

					strParsedInitName = strParsedInitName.replace(
							strEvalPattern, strEvalVal);
				}

				strParsedInitName = strParsedInitName.replace(/{%DELIMITER%}/g,
						this.strDelimiter);

				strParsedInitName = strParsedInitName
						.replace(/{%SPACE%}/g, ' ');

				log.debug('parsePattern', 'strParsedInitName: '
						+ this.strNamePattern + ' parsedResult: '
						+ strParsedInitName);

				if (bolErrorInParse == true)
					return '';
				else
					return strParsedInitName;
			};

			/**
			 * Search latest record type list, get recent record's name.
			 * 
			 * First part of the name, filter 'startswith' X
			 * 
			 * @param {string}
			 *            strParsedNamePattern current name value
			 * @returns {string}
			 */
			INCREMENTER.prototype.getRecentRecName = function(
					strParsedNamePattern) {

				var strRecentRecName = '';
				var currentRecord = this.currentRecord;
				var arrFilters = [];

				if (strParsedNamePattern) {
					if (arrFilters.length > 0)
						arrFilters.push('and');
					arrFilters.push([ this.strFieldId, 'startswith',
							strParsedNamePattern ]);
				}

				if (currentRecord.id) {
					if (arrFilters.length > 0)
						arrFilters.push('and');
					arrFilters.push([ 'internalid', 'noneof',
							[ currentRecord.id ] ]);
				}

				var objCustRecSearch = search.create({
					type : currentRecord.type,
					filters : arrFilters,
					columns : [ search.createColumn({
						name : 'internalid',
						sort : search.Sort.DESC
					}), search.createColumn({
						name : this.strFieldId
					}) ]
				}).run().getRange({
					start : 0,
					end : 1
				});
				if (objCustRecSearch && objCustRecSearch.length > 0)
					strRecentRecName = objCustRecSearch[0].getValue({
						name : this.strFieldId
					});

				return strRecentRecName;
			};

			/**
			 * Search to get previous record's name, base on previous id
			 * 
			 * First part of the name, filter 'startswith' X
			 * 
			 * @param {string}
			 *            strParsedNamePattern current name value
			 * @returns {string}
			 */
			INCREMENTER.prototype.getPreviousRecName = function(
					strParsedNamePattern) {

				var strRecentRecName = '';
				var currentRecord = this.currentRecord;
				var arrFilters = [];

				if (strParsedNamePattern) {
					if (arrFilters.length > 0)
						arrFilters.push('and');
					arrFilters.push([ this.strFieldId, 'startswith',
							strParsedNamePattern ]);
				}

				if (currentRecord.id) {
					if (arrFilters.length > 0)
						arrFilters.push('and');
					arrFilters.push([ 'internalidnumber', 'lessthan',
							currentRecord.id ]);
				}

				var objCustRecSearch = search.create({
					type : currentRecord.type,
					filters : arrFilters,
					columns : [ search.createColumn({
						name : 'internalid',
						sort : search.Sort.DESC
					}), search.createColumn({
						name : this.strFieldId
					}) ]
				}).run().getRange({
					start : 0,
					end : 1
				});
				if (objCustRecSearch && objCustRecSearch.length > 0)
					strRecentRecName = objCustRecSearch[0].getValue({
						name : this.strFieldId
					});

				return strRecentRecName;
			};

			/**
			 * Search to get previous record's name, base on previous id. Used
			 * in CLIENT side script, promise mode.
			 * 
			 * First part of the name, filter 'startswith' X
			 * 
			 * @param {string}
			 *            strParsedNamePattern current name value
			 * @param {object}
			 *            funPromiseCallback call back function
			 * @param {object}
			 *            pri_Recalc_PromiseCallback_Then then function execute
			 *            after call back function
			 * @returns {void}
			 */
			INCREMENTER.prototype.getPreviousRecName_promise = function(
					strParsedNamePattern, funPromiseCallback,
					pri_Recalc_PromiseCallback_Then) {

				var currentRecord = this.currentRecord;
				var arrFilters = [];

				if (strParsedNamePattern) {
					if (arrFilters.length > 0)
						arrFilters.push('and');
					arrFilters.push([ this.strFieldId, 'startswith',
							strParsedNamePattern ]);
				}

				if (currentRecord.id) {
					if (arrFilters.length > 0)
						arrFilters.push('and');
					arrFilters.push([ 'internalidnumber', 'lessthan',
							currentRecord.id ]);
				}

				var objCustRecSearch = search.create({
					type : currentRecord.type,
					filters : arrFilters,
					columns : [ search.createColumn({
						name : 'internalid',
						sort : search.Sort.DESC
					}), search.createColumn({
						name : this.strFieldId
					}) ]
				}).run().each.promise(funPromiseCallback).then(
						pri_Recalc_PromiseCallback_Then)// .catch(function(reason)
				// { log.debug("Failed:
				// " +
				// reason)});
			};

			/**
			 * Detected duplication, update name
			 * 
			 * @param {string}
			 *            strName Original name value pending detect
			 * @returns {string}
			 */
			INCREMENTER.prototype.detectDuplication = function(strName) {

				var strUpdatedName = strName;
				var currentRecord = this.currentRecord;
				var intCurRecId = currentRecord.id;

				log.debug('detectDuplication', 'detect strName: ' + strName);
				var arrFilters = [ [ this.strFieldId, 'is', strName ] ];
				if (intCurRecId) {
					arrFilters.push('and');
					arrFilters
							.push([ 'internalid', 'noneof', [ intCurRecId ] ]);
				}
				var objCustRecSearch = search.create({
					type : currentRecord.type,
					filters : arrFilters,
					columns : [ search.createColumn({
						name : 'internalid',
						sort : search.Sort.DESC
					}), search.createColumn({
						name : this.strFieldId
					}) ]
				}).run().getRange({
					start : 0,
					end : 1
				});
				if (objCustRecSearch && objCustRecSearch.length > 0) {

					var strParsedNamePattern = strName.substring(0, strName
							.lastIndexOf(this.strDelimiter));
					log.debug('detectDuplication', 'strParsedNamePattern: '
							+ strParsedNamePattern);
					// Edit to update duplicated name
					var strRecentRecName = this
							.getRecentRecName(strParsedNamePattern);

					strIncrement = strRecentRecName;
					log.debug('detectDuplication', 'searched previous name: '
							+ strIncrement);

					if (strIncrement) {
						var arrIncrement = strIncrement
								.split(this.strDelimiter);
						strIncrement = arrIncrement[arrIncrement.length - 1];
					}

					if (strIncrement)
						strIncrement = this.getIncrementId(strIncrement);
					else
						strIncrement = this.strIncrement;

					// Best guessing of record name without suffix
					var strParsedName = strParsedNamePattern
							+ this.strDelimiter;
					if (this.strNamePattern)
						strParsedName = this.parsePattern();

					strUpdatedName = strParsedName + strIncrement;
				}

				return strUpdatedName;
			};

			/**
			 * Submit Name Field Value
			 * 
			 * @param {string}
			 *            strName Set Field Value
			 * @returns {void}
			 */
			INCREMENTER.prototype.submitNameFldVal = function(strName) {

				var currentRecord = this.currentRecord;
				var intCurRecId = currentRecord.id;

				log.debug('submitNameFldVal', 'strName: ' + strName);
				objSetValues = {};
				objSetValues[this.strFieldId] = strName;

				record.submitFields({
					type : currentRecord.type,
					id : intCurRecId,
					values : objSetValues
				});
			};

			// ---------------- Class function for User Event -----------------
			/**
			 * Before load functions
			 */
			INCREMENTER.prototype.beforeLoad_Create = function() {

				try {

					if (this.strNamePattern) {

						this.enableNameFld(false);
						// 20180927/CZ when pattern has setfieldid itself
						// referenced, ignore set default/init value.
						if (this.strNamePattern.indexOf('{' + this.strFieldId
								+ '}') == -1)
							this.currentRecord.setValue(this.strFieldId,
									this.strInitName);
					} else
						this.enableNameFld(true);
				} catch (ex) {
					log.audit('beforeLoad_Create ERROR', JSON.stringify(ex));
				}
			};
			INCREMENTER.prototype.beforeLoad_Edit = function() {

				try {
					if (this.strNamePattern)
						this.enableNameFld(false);
					else
						this.enableNameFld(true);
				} catch (ex) {
					log.audit('beforeLoad_Edit ERROR', JSON.stringify(ex));
				}
			};

			/**
			 * Before submit functions
			 */
			INCREMENTER.prototype.beforeSubmit_CreateEdit = function(strName) {

				log.debug('beforeSubmit_CreateEdit', 'strName: ' + strName
						+ ', this.strNamePattern: ' + this.strNamePattern
						+ ', trying detectDuplication...');

				if (this.strNamePattern)
					return true;

				// Check uniqueness, or throw error
				var strDetectedName = this.detectDuplication(strName);
				if (strName != strDetectedName) {
					throw error
							.create({
								name : 'NAME_DUPLICATED',
								message : 'Error: duplicated current name('
										+ strName
										+ ') with existing record. Please update name value and submit again.',
								notifyOff : true
							});
				}

			};

			/**
			 * After submit functions
			 */
			INCREMENTER.prototype.afterSubmit_CreateEdit = function(strName) {

				try {
					// Parse name pattern first, AUTO-name feature
					if (this.strNamePattern) {
						var strParsedName = this.parsePattern();

						// NS take care when parse field encounter error/null
						if (strParsedName.length < 1)
							return true;

						// 20180927/CZ to support no increment case
						var strIncrement = ((!this.strIncrement && typeof (this.strIncrement) != 'number')
								|| this.strIncrement == null
								|| this.strIncrement == '' || this.strIncrement.length < 1) ? ''
								: this.strIncrement;
						// [1] Search latest record type list, get recent name.
						var strRecentRecName = this
								.getPreviousRecName(strParsedName);
						if (strRecentRecName && strIncrement != '') {
							strIncrement = strRecentRecName;

							log.debug('afterSubmit', 'searched name: '
									+ strIncrement);
							if (strIncrement) {
								var arrIncrement = strIncrement
										.split(this.strDelimiter);
								strIncrement = arrIncrement[arrIncrement.length - 1];
							}

							log.debug('afterSubmit',
									'searched strIncrement after pickup [1]: '
											+ strIncrement);
							strIncrement = this.getIncrementId(strIncrement);
						}

						strName = strParsedName + strIncrement;
						this.submitNameFldVal(strName);
					}

					// CLOSED, Auto increment feature ONLY,
					// if (this.strIncrement && !this.strNamePattern) {
					//
					// var intIdxDelmiter =
					// strName.lastIndexOf(this.strDelimiter);
					// if (intIdxDelmiter == -1) {
					//
					// // Get previous record's increment-part or initial
					// var strPrevousIncrement = this.strIncrement;
					// var strRecentRecName = this.getPreviousRecName();
					// if (strRecentRecName) {
					// var arrIncrement = strRecentRecName
					// .split(this.strDelimiter);
					// strPrevousIncrement = arrIncrement[arrIncrement.length -
					// 1];
					// }
					//
					// strName = strName + this.strDelimiter
					// + this.getIncrementId(strPrevousIncrement);
					//
					// this.submitNameFldVal(strName);
					// }
					// }
					log.debug('afterSubmit', 'type: ' + this.currentRecord.type
							+ ' intCurRecId: ' + this.currentRecord.id);
				} catch (ex) {
					log.audit('afterSubmit_CreateEdit ERROR', JSON
							.stringify(ex));
				}
			};

			return {
				// Class
				INCREMENTER : INCREMENTER
			};

		});