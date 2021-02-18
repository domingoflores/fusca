// -----------------------------------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
// ------------------------------------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @author Carl
 * @Note: Prolecto Edit List Data on Forms Class Library
 * 
 * 
 * @History 20180117/Carl, Enhanced getValue(objColTmp) to support get value for
 *          multiple formula and summary columns. Upgrade attention: 'EDIT
 *          FIELDS STRUCTURE' must define: "targetrecord" and "targetrecordid".
 *          <br>
 *          20180618/Carl Embed mode added iframe mode support(works for
 *          check-box), need new option parameter for: strIframeScriptId,
 *          strIframeDeployId, strParentFld(get this field value on current
 *          record then used as parent to filter/criteria back-end saved
 *          search).<br>
 *          20180723/Carl Added support to send custom parameters to custom
 *          back-end SuiteLet, so it can receive data from any 'parent' record.<br>
 * 
 */
define(
		[ 'N/error', 'N/ui/serverWidget', 'N/format', 'N/record', 'N/url', 'N/runtime', 'N/search' ],
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
		function(error, ui, format, record, url, runtime, search) {

			/**
			 * Get Search Res Column Value by column, enhanced summary <br>
			 * 20180117/Carl, Enhanced getValue(objColTmp) to support get value
			 * for multiple formula and summary columns.
			 * 
			 * @param {object}
			 *            objOneSrchRes objControlSrchRes[idx] search result
			 * @param {object}
			 *            objColTmp column object
			 * @param {object}
			 *            objEditFldDef Edit Field Definition
			 */
			function getSearchResColValue(objOneSrchRes, objColTmp, objEditFldDef) {

				if (!objColTmp)
					return '';

				if (objEditFldDef) {

					// var strOrgValue = objOneSrchRes.getValue({
					// name : objColTmp.name,
					// join : objColTmp.join,
					// summary : objColTmp.summary
					// });
					var strOrgValue = objOneSrchRes.getValue(objColTmp);
					log.debug('getSearchResColValue - grouping testing', 'objColTmp: '
							+ JSON.stringify(objColTmp) + ', strOrgValue: ' + strOrgValue);

					switch (objEditFldDef.datatype.type) {
					case 'date':
						return strOrgValue ? strOrgValue : '';
						// format.format({
						// value : new Date(),
						// type : format.Type.DATE
						// });
						break;

					case 'select':
						if (strOrgValue && strOrgValue == '- None -')
							strOrgValue = '';
						return strOrgValue ? strOrgValue : '';
						break;

					case 'textarea':
						return strOrgValue ? strOrgValue : '';
						break;

					case 'checkbox': // 20180508/Carl Test in Ring SBX
						return strOrgValue ? 'T' : 'F';
						break;
					}// String(strOrgValue).replace(/</g,
					// '&lt;').replace(/>/g, '&gt;')
				}

				// var strTmpText = objOneSrchRes.getText({
				// name : objColTmp.name,
				// join : objColTmp.join,
				// summary : objColTmp.summary
				// });
				var strTmpText = objOneSrchRes.getText(objColTmp);

				if (strTmpText && strTmpText == '- None -')
					strTmpText = '';

				if (strTmpText)
					return strTmpText.substring(0, 300);

				// consider join columns
				// var strOrgValue = objOneSrchRes.getValue({
				// name : objColTmp.name,
				// join : objColTmp.join,
				// summary : objColTmp.summary
				// });
				var strOrgValue = objOneSrchRes.getValue(objColTmp);

				var strTmpValue = strTmpText ? strTmpText : (strOrgValue ? strOrgValue : ' ');

				if (strTmpValue && strTmpValue == '- None -')
					strTmpValue = '';

				return strTmpValue.toString().substring(0, 300);
			}

			/**
			 * Set Criteria to Parameter's general saved search <br>
			 * Note: Use/link the last filter under 'Criteria' tab.
			 * 
			 * @param {object}
			 *            objControlSrch
			 * @param {integer}
			 *            intRecId
			 * @returns {object}
			 */
			function setControlSrchCriteria(objControlSrch, intRecId) {

				if (!objControlSrch || !intRecId)
					return objControlSrch;

				if (objControlSrch.filters && objControlSrch.filters.length > 0) {

					var objLastsFilter = objControlSrch.filters[objControlSrch.filters.length - 1];
					var objRecFilter = search.createFilter({
						name : objLastsFilter.name,
						operator : search.Operator.ANYOF,
						values : [ intRecId ]
					});
					objControlSrch.filters.push(objRecFilter);
				}
				return objControlSrch;
			}

			/**
			 * Edit List Data <br>
			 * 
			 * @param {array}
			 *            arrEditFldDef Structure: [{ <br>
			 *            fieldname: <br>
			 *            datatype: <br>
			 *            validatefunc: <br>
			 *            callbacksl: <br>
			 *            targetrecord: <br>
			 *            setfieldid: <br>
			 *            },{},]
			 * 
			 * @param {object}
			 *            options Feature optional configurations <br>
			 *            strParentTab: Attach Edit List Data to parent tab,
			 *            'item'. <br>
			 *            strTabLabel: Default Tab name, default value Edit List
			 *            <br>
			 */
			function EDITLISTDATA(scriptContext, intSearchId, strEditFldDef, options) {

				var objSourceRec = scriptContext.newRecord;
				if (objSourceRec) {
					this.intRecId = objSourceRec.id;
					this.strRecType = objSourceRec.type;
					this.objSourceRec = objSourceRec;

					this.intParentId = this.intRecId;
				}
				var objForm = scriptContext.form;
				this.objForm = objForm;

				this.intSearchId = intSearchId;

				this.arrEditFldDef = (strEditFldDef && typeof (strEditFldDef) == 'string') ? JSON
						.parse(strEditFldDef) : strEditFldDef;

				this.options = options;
				this.strParentTab = (options && typeof (options.strParentTab) != 'undefined') ? options.strParentTab
						: "";
				this.strTabLabel = (options && typeof (options.strTabLabel) != 'undefined') ? options.strTabLabel
						: "Edit List";
				this.strTabId = (options && typeof (options.strTabId) != 'undefined') ? options.strTabId
						: "custpage_pri_tab_editlist";

				// [Optional]
				this.strEditSublistId = (options && typeof (options.strEditSublistId) != 'undefined') ? options.strEditSublistId
						: "custpage_pri_eld";
				this.arrTabButtons = (options && typeof (options.arrTabButtons) != 'undefined') ? options.arrTabButtons
						: [];

				// Override for back-end SuiteLet URL
				this.strBackendSl_sId = (options && typeof (options.strBackendSl_sId) != 'undefined') ? options.strBackendSl_sId
						: 'customscript_pri_sl_editlistdata';
				this.strBackendSl_dId = (options && typeof (options.strBackendSl_dId) != 'undefined') ? options.strBackendSl_dId
						: 'customdeploy_pri_sl_editlistdata';

				// Validate Function Sample #1:
				// alert(linenum +""+ fldname + strFldVal)
				// Sample #2:
				// if(fldname.indexOf('_custrecord_pri_co_date_ship_required_')>0)
				// {
				// setTimeout(\"jQuery('#custpage_579_custrecord_pri_co_date_manufacture_est_3\"+linenum+\"').val('12/2/2019').change();\",
				// 2*1000); alert(linenum + \" YES\"+ fldname + strFldVal); }
				this.objValidateFunc = (options && typeof (options.objValidateFunc) != 'undefined') ? options.objValidateFunc
						: '';

				// Function Suffix
				this.strDyncSufix = this.strEditSublistId ? this.strEditSublistId : '';

				// Override for parent id in options
				this.intParentId = (options && typeof (options.intParentId) != 'undefined') ? options.intParentId
						: (this.intRecId ? this.intRecId : '');

				// UE Embed mode added 'iframe mode' support
				this.strIframeUrl = (options && typeof (options.strIframeUrl) != 'undefined') ? options.strIframeUrl
						: '';

				// Asynch Post, default is T means jQuery post data.
				this.strAsynchPost = (options && typeof (options.strAsynchPost) != 'undefined') ? options.strAsynchPost
						: 'T';

				// this.scriptContext = (options && typeof
				// (options.scriptContext) != 'undefined') ?
				// options.scriptContext
				// : "";
				this.strIsList = 'F';

			}

			/**
			 * Matching Edit Field Definition
			 * 
			 * @param {integer}
			 *            intColIdx column index
			 * @param {object}
			 *            objCol column object
			 * 
			 * @param {object|null}
			 */
			EDITLISTDATA.prototype.getEditFldDefinition = function(intColIdx, objCol) {

				var arrEditFldDef = this.arrEditFldDef;
				var intFldIdx;

				if (!arrEditFldDef)
					return null;

				// Matching Edit Field Definition
				for (var fldIdx = 0; fldIdx < arrEditFldDef.length; fldIdx++) {

					var objEditFldDef = arrEditFldDef[fldIdx];

					if (objEditFldDef.fieldname != intColIdx
							&& objEditFldDef.fieldname != objCol.name)
						continue;

					intFldIdx = fldIdx;
					break;
				}
				return arrEditFldDef[intFldIdx];
			};

			/**
			 * Add list and hander to post data to suitelet
			 */
			EDITLISTDATA.prototype.addList = function() {

				var form = this.objForm;
				var param_intSearchId = this.intSearchId;
				var arrEditFldDef = this.arrEditFldDef;
				var objEditListData = this;
				var objCurTab;

				if (!form || !param_intSearchId)
					return form;

				// [1] Tab & Sublist 1
				if (this.strParentTab) { // Specify Parent, defined as SubTab

					// objCurTab = form.getSubTab({
					// id : this.strTabId
					// });
					// if (!objCurTab)
					objCurTab = form.addSubtab({
						id : this.strTabId,// 'custpage_pri_tab_editlist',
						label : this.strTabLabel,
						tab : this.strParentTab
					});

				} else {// Define as Tab

					objCurTab = form.getTab({
						id : this.strTabId
					});
					if (!objCurTab)
						objCurTab = form.addTab({
							id : this.strTabId,// 'custpage_pri_tab_editlist',
							label : this.strTabLabel,
						});
				}

				// [50] Embed iframe mode support
				if (this.strIframeUrl) {

					log.debug('EDITLISTDATA.addList', 'MODE, this.strIframeUrl:'
							+ this.strIframeUrl);
					var objEmbeddedIframeFld = form.addField({
						id : 'custpage_pri_embedded_iframe' + '_' + this.strEditSublistId,
						label : ' ', // Embed mode added iframe support
						type : ui.FieldType.INLINEHTML,
						container : this.strTabId
					});

					objEmbeddedIframeFld.defaultValue = '<iframe id= "custpage_pri_suiteletiframe'
							+ this.strEditSublistId
							+ '" name="custpage_pri_suiteletiframe'
							+ this.strEditSublistId
							+ '" '
							+ 'src="'
							+ this.strIframeUrl
							+ '&custparam_t='
							+ new Date().getTime()
							+ '&ifrmcntnr=T"    '
							+ 'width="100%" height="600" margin-top="-100px" frameborder="0" longdesc="Flexible Inline Edit(Embed iframe mode)"></iframe>';

					return form;
				}

				var objEditList = form.addSublist({
					id : this.strEditSublistId,// 'custpage_pri_eld',
					label : this.strTabLabel,
					tab : this.strTabId,
					type : this.strIsList == 'T' ? ui.SublistType.LIST : ui.SublistType.STATICLIST
				});

				objEditList.addField({
					id : 'custpage_hide_internalid',
					label : 'InternalID',
					type : ui.FieldType.TEXT
				}).updateDisplayType({
					displayType : 'hidden'
				});
				objEditList.addField({
					id : 'custpage_hide_recordtype',
					label : 'RecordType',
					type : ui.FieldType.TEXT
				}).updateDisplayType({
					displayType : 'hidden'
				});

				// [2] add search to list
				var objControlSrch = search.load({
					id : param_intSearchId
				});

				// 20190627/CZ Optimize to only load minimum 5 pages
				// [3] Create sublist columns
				// var objOneSrchRes;
				// var objResultSets = objControlSrch.runPaged({
				// pageSize : 5
				// });
				// for (var i = 0; i < objResultSets.pageRanges.length; i++) {
				// var objMyCurPage = objResultSets.fetch(i);
				//					
				// for ( var idx in objMyCurPage.data) {
				// objOneSrchRes = objMyCurPage.data[idx];
				//						
				// if (objOneSrchRes)
				// break;
				// }
				//					
				// if (objOneSrchRes)
				// break;
				// }
				//				
				// for (var i = 0; objOneSrchRes && i <
				// objOneSrchRes.columns.length; i++) {
				//					
				// var objCol = objOneSrchRes.columns[i];

				// var objResultSets = objControlSrch.run();
				// // [3] Create sublist columns
				// var arrResultSets = objResultSets.getRange(0, 1);
				// if (arrResultSets && arrResultSets.length > 0) {
				// for (var i = 0; i < arrResultSets[0].columns.length; i++) {
				//
				// var objCol = arrResultSets[0].columns[i];

				// }
				// }

				// [4] Set Value to sublist
				var intListLnIdx = 0;
				var intTtlQty = 0;
				var arrTtlOrd = [];
				var bolSublistCols = false;

				// Use last filter as the connection point to record
				objControlSrch = setControlSrchCriteria(objControlSrch, this.intParentId);

				var objPagedData = objControlSrch.runPaged({
					pageSize : 1000
				});
				objPagedData.pageRanges
						.forEach(function(pageRange) {

							var objMyCurPage = objPagedData.fetch({
								index : pageRange.index
							});
							for ( var idx in objMyCurPage.data) {
								var objOneSrchRes = objMyCurPage.data[idx];

								if (objOneSrchRes && bolSublistCols == false) {

									// [3] Create sublist columns
									objEditList = createSublistColumns(objEditList,
											objEditListData, param_intSearchId, objOneSrchRes);
									bolSublistCols = true;
								}

								// Set internal id and record type
								if (objOneSrchRes.id)
									objEditList.setSublistValue({
										id : 'custpage_hide_internalid',
										line : intListLnIdx,
										value : objOneSrchRes.id
									});
								if (objOneSrchRes.recordType)
									objEditList.setSublistValue({
										id : 'custpage_hide_recordtype',
										line : intListLnIdx,
										value : objOneSrchRes.recordType
									});

								for (var colIdx = 0; colIdx < objOneSrchRes.columns.length; colIdx++) {

									var objColTmp = objOneSrchRes.columns[colIdx];

									var objEditFldDef = objEditListData.getEditFldDefinition(
											colIdx, objColTmp);

									// getText and get Value
									var strTmpValue = getSearchResColValue(objOneSrchRes,
											objColTmp, objEditFldDef);

									if (strTmpValue)
										objEditList.setSublistValue({
											id : 'custpage_' + param_intSearchId + '_'
													+ objColTmp.name + '_' + colIdx,
											line : intListLnIdx,
											value : strTmpValue
										});

									// summary data 1
									if (objColTmp.name == 'quantity' && strTmpValue)
										intTtlQty += (parseFloat(strTmpValue) ? parseFloat(strTmpValue)
												: 0);
								}

								// summary order array 2
								// if (arrTtlOrd.indexOf(objOneSrchRes.id) ==
								// -1)
								// arrTtlOrd.push(objOneSrchRes.id);

								intListLnIdx++;
							}// proceed each lines
						});

				var strEditBackendFldId = 'custpage_pri_editdef' + '_' + this.strEditSublistId;
				var objEditFldDef = form.addField({
					id : strEditBackendFldId, // 'custpage_pri_editdeffield',
					label : 'Edit Field Definition',
					type : ui.FieldType.TEXTAREA,
					container : this.strTabId
				// 'custpage_pri_tab_editlist'
				});
				objEditFldDef.defaultValue = JSON.stringify(arrEditFldDef);
				objEditFldDef.updateDisplayType({
					displayType : ui.FieldDisplayType.HIDDEN
				});

				var objEmbeddedFld = form.addField({
					id : 'custpage_pri_embedded' + '_' + this.strEditSublistId,
					label : 'Backend Suitelet and Hook',
					type : ui.FieldType.INLINEHTML,
					container : this.strTabId
				// 'custpage_pri_tab_editlist'
				});

				var strBackendSlUrl = url.resolveScript({
					scriptId : this.strBackendSl_sId,// 'customscript_pri_sl_editlistdata',
					deploymentId : this.strBackendSl_dId,// 'customdeploy_pri_sl_editlistdata'
				});

				if (this.strAsynchPost == 'T') {
					// Default to Asynch jQuery Post
					objEmbeddedFld.defaultValue = '<iframe id= "custpage_pri_suiteletinput'
							+ this.strEditSublistId
							+ '" name="custpage_pri_suiteletinput'
							+ this.strEditSublistId
							+ '" '
							+ 'src="'
							+ strBackendSlUrl
							+ '&custparam_t='
							+ new Date().getTime()
							+ '"'
							+ 'height="0" aria-hidden="true" style="display:none;" title="empty" '
							+ 'onload="onFldChangeHandler'
							+ this.strDyncSufix
							+ '();"></iframe> '
							+ '<script type="text/javascript"> '
							+ ''
							+ 'function onFldChangeHandler'
							+ this.strDyncSufix
							+ '() {'
							+ 'console.log("onFldChangeHandler*** Hooked");'
							+ 'window["'
							+ this.strEditSublistId
							+ 'SyncRow"] = function(linenum,copybase,markall,fldname,bucket){ console.log("Edited > ***SyncRow, onload"+linenum+copybase+markall+fldname+bucket);'
							+ 'var intFormRecId = nlapiGetRecordId() ? nlapiGetRecordId() : (new RegExp( "[\\?&]custparam_parentid=([^&#]*)" ).exec(location.href)? new RegExp( "[\\?&]custparam_parentid=([^&#]*)" ).exec(location.href)[1] : nlapiGetRecordId());'
							+ 'var strEncodedUrl = encodeURIComponent(location.href);'
							+ 'var intSearchId = "'
							+ param_intSearchId
							+ '";'
							+ 'var strEditFldDef = nlapiGetFieldValue("'
							+ strEditBackendFldId
							+ '");'
							+ 'var strFldVal = window.NS.jQuery("[name="+fldname+linenum+"]").val();'
							+ 'if(window.NS.jQuery("[name="+fldname+linenum+"]").prop("type") == "checkbox")'
							+ '  strFldVal = window.NS.jQuery("[name="+fldname+linenum+"]").prop("checked") ? "T": "F";'
							+ '  var objPostParam = {intformrecid: intFormRecId, intsearchid: intSearchId, streditflddef: strEditFldDef, linenum: linenum, fldname: fldname, fldvalue: strFldVal, '
							+ '  					 	strencodedurl: strEncodedUrl};'
							+ '  var arrBackendFlds = window.NS.jQuery("input[id][name^=\'custpage_custparam_\']");'
							+ '  for(var i=0;i<arrBackendFlds.length; i++) objPostParam[arrBackendFlds[i].id] = arrBackendFlds[i].defaultValue;'
							+ 'var jqxhr = window.NS.jQuery.post( "'
							+ strBackendSlUrl
							// + '", {intformrecid: intFormRecId, intsearchid:
							// intSearchId, streditflddef: strEditFldDef,
							// linenum: linenum, fldname: fldname, fldvalue:
							// strFldVal })'
							+ '", objPostParam)'
							+ '.done(function(data) {'
							+ ' console.log("Post success(linenum: "+linenum + ", fldname: " + fldname+ ", fldvalue: " + strFldVal+"), return eval:" + data); '
							+ ' if (data === true){} else eval(data);'
							+ '})'
							+ '.fail(function() {'
							+ ' alert("Data post/submit error, Please refresh current page then try again.");'
							+ '})'
							+ '.always(function() {'
							+ '  '// alert( "finished" );
							+ '});'
							+ ''
							// + '('
							+ this.objValidateFunc
							// + ')()'
							+ '};'
							+ ''
							// + 'window["'
							// + this.strEditSublistId
							// + 'RecalcMachine"] = function(){};'
							+ ''
							+ 'window.workflow_validatefield = function(){ return true; };'
							+ 'console.log("'
							+ this.strEditSublistId
							+ 'SyncRow overwritten");'
							+ '};'
							+ ''// [1] End of onFldChangeHandler***
							+ ''
							+ 'function isOverwriteSyncRow() {'
							+ " if (window['"
							+ this.strEditSublistId
							+ "SyncRow'].toString().substring(0,97) == 'function (linenum,copybase,markall,fldname,bucket){ console.log(\"Edited > ***SyncRow') return true;"
							+ ' return false;'
							+ '};'
							+ '' // [2] End of isOverwriteSyncRow(detect)
							+ ''
							+ '(function () {'
							+ "require(['N/ui/message'], function(message) {"
							+ "jQuery('#"
							+ this.strEditSublistId
							+ "').ready(function() { if(!isOverwriteSyncRow()) onFldChangeHandler"
							+ this.strDyncSufix
							+ "();});"
							+ ''// [3.1] End of dom ready check
							+ "setTimeout(function(){ if(!onFldChangeHandler"
							+ this.strDyncSufix
							+ " || !isOverwriteSyncRow) alert('Load Inline Edit Functions Error, Please refresh current page then try again.');"
							+ " if (!isOverwriteSyncRow()){ onFldChangeHandler"
							+ this.strDyncSufix
							+ "(); } "
							+ " console.log('setTimeout detection completed successfully!');}, 4000);"
							+ ''// [3.2] End of setTimeout function
							+ "});" + '}())' + '</script>';

				} else {
					// Sync post, nlapiRequestURL
					objEmbeddedFld.defaultValue = '<iframe id= "custpage_pri_suiteletinput'
							+ this.strEditSublistId
							+ '" name="custpage_pri_suiteletinput'
							+ this.strEditSublistId
							+ '" '
							+ 'src="'
							+ strBackendSlUrl
							+ '&custparam_t='
							+ new Date().getTime()
							+ '"'
							+ 'height="0" aria-hidden="true" style="display:none;" title="empty" '
							+ 'onload="onFldChangeHandler'
							+ this.strDyncSufix
							+ '();"></iframe> '
							+ '<script type="text/javascript"> '
							+ ''
							+ 'function onFldChangeHandler'
							+ this.strDyncSufix
							+ '() {'
							+ 'console.log("onFldChangeHandler*** Hooked");'
							+ 'window["'
							+ this.strEditSublistId
							+ 'SyncRow"] = function(linenum,copybase,markall,fldname,bucket){ console.log("Edited > ***SyncRow, onload"+linenum+copybase+markall+fldname+bucket);'
							+ 'var intFormRecId = nlapiGetRecordId() ? nlapiGetRecordId() : (new RegExp( "[\\?&]custparam_parentid=([^&#]*)" ).exec(location.href)? new RegExp( "[\\?&]custparam_parentid=([^&#]*)" ).exec(location.href)[1] : nlapiGetRecordId());'
							+ 'var strEncodedUrl = encodeURIComponent(location.href);'
							+ 'var intSearchId = "'
							+ param_intSearchId
							+ '";'
							+ 'var strEditFldDef = nlapiGetFieldValue("'
							+ strEditBackendFldId
							+ '");'
							+ 'var strFldVal = window.NS.jQuery("[name="+fldname+linenum+"]").val();'
							+ 'if(window.NS.jQuery("[name="+fldname+linenum+"]").prop("type") == "checkbox")'
							+ '  strFldVal = window.NS.jQuery("[name="+fldname+linenum+"]").prop("checked") ? "T": "F";'
							+ '  strFldVal = window.NS.jQuery("[name="+fldname+linenum+"]").prop("checked") ? "T": "F";'
							+ '  var objPostParam = {intformrecid: intFormRecId, intsearchid: intSearchId, streditflddef: strEditFldDef, linenum: linenum, fldname: fldname, fldvalue: strFldVal, '
							+ '  					 	strencodedurl: strEncodedUrl};'
							+ '  var arrBackendFlds = window.NS.jQuery("input[id][name^=\'custpage_custparam_\']");'
							+ '  for(var i=0;i<arrBackendFlds.length; i++) objPostParam[arrBackendFlds[i].id] = arrBackendFlds[i].defaultValue;'
							+ '  try{ var response = nlapiRequestURL("'
							+ strBackendSlUrl
							// + '", {intformrecid: intFormRecId, intsearchid:
							// intSearchId, streditflddef: strEditFldDef,
							// linenum: linenum, fldname: fldname, fldvalue:
							// strFldVal });'
							+ '", objPostParam);'
							+ '  }catch(ex){'
							+ '  alert("Data post/submit error, Please refresh current page then try again.");}'
							+ ''
							+ ' var data = response ? response.getBody() : "";'
							+ ' console.log("Post success(linenum: "+linenum + ", fldname: " + fldname+ ", fldvalue: " + strFldVal+"), return eval:" + data); '
							+ ' '
							+ ' if (data === true){} else eval(data);'
							+ '};'
							+ ''
							// + 'window["'
							// + this.strEditSublistId
							// + 'RecalcMachine"] = function(){};'
							+ ''
							+ 'window.workflow_validatefield = function(){ return true; };'
							+ 'console.log("'
							+ this.strEditSublistId
							+ 'SyncRow overwritten");'
							+ '};'
							+ ''// [1] End of onFldChangeHandler***
							+ ''
							+ 'function isOverwriteSyncRow() {'
							+ " if (window['"
							+ this.strEditSublistId
							+ "SyncRow'].toString().substring(0,97) == 'function (linenum,copybase,markall,fldname,bucket){ console.log(\"Edited > ***SyncRow') return true;"
							+ ' return false;'
							+ '};'
							+ '' // [2] End of isOverwriteSyncRow(detect)
							+ ''
							+ '(function () {'
							+ "require(['N/ui/message'], function(message) {"
							+ "jQuery('#"
							+ this.strEditSublistId
							+ "').ready(function() { if(!isOverwriteSyncRow()) onFldChangeHandler"
							+ this.strDyncSufix
							+ "();});"
							+ ''// [3.1] End of dom ready check
							+ "setTimeout(function(){ if(!onFldChangeHandler"
							+ this.strDyncSufix
							+ " || !isOverwriteSyncRow) alert('Load Inline Edit Functions Error, Please refresh current page then try again.');"
							+ " if (!isOverwriteSyncRow()){ onFldChangeHandler"
							+ this.strDyncSufix
							+ "(); } "
							+ " console.log('setTimeout detection completed successfully!');}, 4000);"
							+ ''// [3.2] End of setTimeout function
							+ "});" + '}())' + '</script>';
				}

				// Add Custom Buttons if applicable
				objEditList = this.addTabBtns(objEditList);

				return form;
			};

			/**
			 * Add Tab Button
			 * 
			 * @param {object}
			 *            objEditList Edit List Object
			 */
			EDITLISTDATA.prototype.addTabBtns = function(objEditList) {

				if (!objEditList)
					return objEditList;

				var arrTabButtons = this.arrTabButtons;
				for (var btnIdx = 0; btnIdx < arrTabButtons.length; btnIdx++) {

					objEditList.addButton({
						id : arrTabButtons[btnIdx].id,
						label : arrTabButtons[btnIdx].label,
						functionName : arrTabButtons[btnIdx].functionName,
					});
				}

				return objEditList;
			};

			/**
			 * create sublist column/fields
			 */
			function createSublistColumns(objEditList, objEditListData, param_intSearchId,
					objOneSrchRes) {

				for (var i = 0; objOneSrchRes && i < objOneSrchRes.columns.length; i++) {

					var objCol = objOneSrchRes.columns[i];
					// [3.1] Define Backend Target Record Id Column
					if (objCol.label && objCol.label.indexOf("TARGETRECORDID_") == 0) {

						var objTmpFld = objEditList.addField({
							id : 'custpage_' + objCol.name + '_' + i,
							label : " ",
							type : ui.FieldType.TEXT
						}).updateDisplayType({
							displayType : ui.FieldDisplayType.HIDDEN
						});
						continue;
					}

					// [3.2] Matching Edit Field Definition
					var objEditFldDef = objEditListData.getEditFldDefinition(i, objCol);
					if (objEditFldDef) {

						// 20180603 added + param_intSearchId + '_'
						var objTmpFld = objEditList.addField({
							id : 'custpage_' + param_intSearchId + '_' + objCol.name + '_' + i,
							label : objCol.label,
							type : objEditFldDef.datatype.type,
							source : objEditFldDef.datatype.source
						});
						objTmpFld.updateDisplayType({
							displayType : ui.FieldDisplayType.ENTRY
						});
					} else {
						// Supported formula and join, workaround: NS
						// not support objCol.type
						var objTmpFld = objEditList.addField({
							id : 'custpage_' + param_intSearchId + '_' + objCol.name + '_' + i,
							label : objCol.label,
							type : ui.FieldType.TEXT
						});
					}
				}

				return objEditList;
			}

			return {
				setControlSrchCriteria : setControlSrchCriteria,

				EDITLISTDATA : EDITLISTDATA
			};

		});
