//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(
		[ 'N/runtime', 'N/url', 'N/ui/dialog' ],

		function(runtime, url, dialog) {

			function btn_refresh_Click() {

				// Void popup message
				if (window.onbeforeunload) {
					window.onbeforeunload = function() {
						null;
					};
				}

				var strHref = window.location.href;
				var reg = new RegExp('[?&]' + 'selectedtab' + '=([^&#]*)', 'i');
				var strCurParam = reg.exec(strHref);
				if (!strCurParam)
					location.href = location.href
							+ '&selectedtab=custpage_sl_tab_view';
				else
					location.href = location.href;
			}

			/**
			 * Auto-refresh current page until task terminated(completed/failed)
			 * Updated: Carl/20170609, Marty mentioned on refresh behavior
			 * 
			 * @returns
			 */
			function cre_input_auto_refresh(scriptContext) {

				var currentRecord = scriptContext.currentRecord;
				var strTaskStatus = currentRecord
						.getValue('custpage_taskstatustxt');

				if (!strTaskStatus)
					return true;

				if (strTaskStatus != 'COMPLETE' && strTaskStatus != 'FAILED') {

					var intRefreshSecond = 10;
					var objOptions = {
						title : 'Background task in-progress...',
						message : 'Submitted task status: <b>'
								+ strTaskStatus
								+ '</b>, <br>This page will be automatically reloaded in few seconds. <br>Click OK to reload it now.'
					};
					function btn_success(result) {
						location.href = location.href;
						// console.log('Success with value '+result);
					}
					function btn_failure(reason) {
					}

					// Alert to notify user status.
					try {// .catch(btn_failure);
						dialog.alert(objOptions).then(btn_success);
					} catch (ex) {
					}

					window.setTimeout(function() {
						location.href = location.href;
					}, intRefreshSecond * 1000);
				}
			}

			function voidPopupMessage() {

				if (window.onbeforeunload) {
					window.onbeforeunload = function() {
						null;
					};
				}
			}

			function getParameterByName(name) {
				var match = RegExp('[?&]' + name + '=([^&]*)').exec(
						window.location.search);
				return match
						&& decodeURIComponent(match[1].replace(/\+/g, ' '));
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

				// Auto-refresh current page until task terminated
				cre_input_auto_refresh(scriptContext);
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

				if (scriptContext.fieldId == 'custpage_searchid') {
					// Voice popup message
					voidPopupMessage();

					var intSrchId = scriptContext.currentRecord
							.getValue('custpage_searchid');
					location = url.resolveScript({
						scriptId : 'customscript_pri_cre_input_suitelet',
						deploymentId : 'customdeploy_pri_cre_input_suitelet',
						params : {
							custparam_searchid : intSrchId
						}
					});

					return true;
				}

				fieldChanged_dynamicFilter(scriptContext);
				return true;
			}

			/**
			 * Used fieldChanged for dynamic filter
			 */
			function fieldChanged_dynamicFilter(scriptContext) {

				var strFormFilterFlds = scriptContext.currentRecord
						.getValue('custpage_filters_data');
				var arrFormFilterFlds = strFormFilterFlds ? JSON
						.parse(strFormFilterFlds) : null;
				var strCurFldId = scriptContext.fieldId;

				// Loop to get all filters build for parameter
				var strParams = '';
				var bolUpdatedFilter = false;
				for (var fldIdx = 0; arrFormFilterFlds
						&& fldIdx < arrFormFilterFlds.length; fldIdx++) {

					var objFormFilterFlds_tmp = arrFormFilterFlds[fldIdx];
					if (!objFormFilterFlds_tmp
							|| objFormFilterFlds_tmp.formid == strCurFldId)
						bolUpdatedFilter = true;

					var strFldId_tmp = objFormFilterFlds_tmp.formid;
					var strFldVal_tmp = scriptContext.currentRecord.getValue({
						fieldId : strFldId_tmp
					});

					if (strFldVal_tmp && strFldVal_tmp.toString().length > 0
							&& strFldVal_tmp != ' ') {

						// Convert date value to simple date text
						if (scriptContext.currentRecord.getField(strFldId_tmp).type == 'date') {

							strFldVal_tmp = scriptContext.currentRecord
									.getText({
										fieldId : strFldId_tmp
									});
						} else if (objFormFilterFlds_tmp.formula
								&& objFormFilterFlds_tmp.formula.toString()
										.indexOf('|') != -1) {
							// Auto convert delimiter to '|'
							strFldVal_tmp = '|'
									+ strFldVal_tmp.toString().split('\n')
											.join('|') + '|';
						}

						strParams += '&' + strFldId_tmp + '=' + strFldVal_tmp;
					}
				}

				console.log(arrFormFilterFlds + '. fldId: '
						+ scriptContext.fieldId + '. strParams: ' + strParams);

				if (arrFormFilterFlds && bolUpdatedFilter) {

					voidPopupMessage();

					// 20170828/CZ, support for embed mode,
					var strEmbedModeParms = '';
					if (location.href.indexOf('custparam_hidenavbar=T') != -1)
						strEmbedModeParms += '&custparam_hidenavbar=T&ifrmcntnr=T';

					if (location.href.indexOf('&custparam_parentrecid=') != -1)
						strEmbedModeParms += '&custparam_parentrecid='
								+ getParameterByName('custparam_parentrecid');

					// 20170831/CZ, supported different parameter setup
					console.log('fromButton', scriptContext.currentRecord
							.getValue('custpage_frombutton'));
					var strSetupParams = (scriptContext.currentRecord
							.getValue('custpage_searchid') ? ('&custparam_searchid=' + scriptContext.currentRecord
							.getValue('custpage_searchid'))
							: '')
							+ (scriptContext.currentRecord
									.getValue('custpage_formfilter') ? ('&custparam_formfilter=' + scriptContext.currentRecord
									.getValue('custpage_formfilter'))
									: '')
							+ (scriptContext.currentRecord
									.getValue('custpage_creprofile') ? ('&custparam_creprofile=' + scriptContext.currentRecord
									.getValue('custpage_creprofile'))
									: '')
							+ (scriptContext.currentRecord
									.getValue('custpage_creoptiongrp') ? ('&custparam_creoptiongrp=' + scriptContext.currentRecord
									.getValue('custpage_creoptiongrp'))
									: '')
							+ (scriptContext.currentRecord
									.getValue('custpage_rootfolder') ? ('&custparam_rootfolder=' + scriptContext.currentRecord
									.getValue('custpage_rootfolder'))
									: '')
							+ (scriptContext.currentRecord
									.getValue('custpage_frombutton') ? ('&custparam_frombutton=' + scriptContext.currentRecord
									.getValue('custpage_frombutton'))
									: '')// Added by MM 2017-09-11
							+ (scriptContext.currentRecord
									.getValue('custpage_title') ? ('&custparam_title=' + scriptContext.currentRecord
									.getValue('custpage_title'))
									: '')// Added by MM 2017-09-11
							+ (scriptContext.currentRecord
									.getValue('custpage_filters_data') ? ('&custparam_filter_flds=' + scriptContext.currentRecord
									.getValue('custpage_filters_data'))
									: '') // Added by MM 2018-02-13 (allows defining the available filters in the UE script parameter)
							+ (scriptContext.currentRecord
									.getValue('custpage_multiple_cre') ? ('&custparam_mult_cre_json=' + scriptContext.currentRecord
									.getValue('custpage_multiple_cre'))
									: '');// Added by MM 2018-02-13 (allows building dropdown options for selecting CRE profile)


					console.log('strSetupParams', strSetupParams);

					location.href = scriptContext.currentRecord
							.getValue('custpage_urlforrestart')
							+ strParams + strEmbedModeParms + strSetupParams;
				}

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

				var currentRecord = scriptContext.currentRecord;
				var bolSelectedLn = false;
				var intLnCount = currentRecord.getLineCount({
					sublistId : 'custpage_sl_selectrecord'
				});
				for (var i = 0; i < intLnCount; i++) {
					var strTempSelect = currentRecord.getSublistValue({
						sublistId : 'custpage_sl_selectrecord',
						fieldId : 'custpage_select',
						line : i
					});
					if (strTempSelect == true) {
						bolSelectedLn = true;
						break;
					}
				}

				if (!bolSelectedLn) {
					alert('Please select at least one record to submit.');
					return false;
				}

				return true;
			}

			return {
				btn_refresh_Click : btn_refresh_Click,
				cre_input_auto_refresh : cre_input_auto_refresh,

				pageInit : pageInit,
				fieldChanged : fieldChanged,
				// postSourcing : postSourcing,
				// sublistChanged : sublistChanged,
				// lineInit : lineInit,
				// validateField : validateField,
				// validateLine : validateLine,
				// validateInsert : validateInsert,
				// validateDelete : validateDelete,
				saveRecord : saveRecord
			};

		});