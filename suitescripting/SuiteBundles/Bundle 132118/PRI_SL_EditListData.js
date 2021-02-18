// -----------------------------------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
// ------------------------------------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @author Carl
 * @Note: Prolecto Edit List Data on Forms Suitelet to receipt submit data,
 *        NOTE: the sequence/sort of the search result is very important,
 *        otherwise will set wrong record.
 * 
 * 
 * @History 20180117/Carl, Enhanced getValue(objColTmp) to support get value for
 *          multiple formula and summary columns. Upgrade attention: 'EDIT
 *          FIELDS STRUCTURE' must define: "targetrecord" and "targetrecordid".<br>
 *          20180424/Carl, Enhanced Line submit feature, parameter must define:
 *          "setsublistid", saved search column contains: 'lineuniquekey' or
 *          'line'.<br>
 *          20180518/Carl, Note: <br>
 *          1. Parameter(SUBMIT FIELD OPTIONS) is on Company Preference; <br>
 *          2. When use Summary(group, min/max) in saved search, remember to
 *          define "SUMMARY LABEL" for "targetrecordid": "TARGETRECORDID_ID".
 */
define(
		[ 'N/error', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/url',
				'./PRI_EditListData_Lib.js' ],
		/**
		 * @param {error}
		 *            error
		 * @param {format}
		 *            format
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 * @param {url}
		 *            url
		 */
		function(error, format, record, runtime, search, url, listDataLib) {

			/**
			 * Definition of the Suitelet script trigger point.
			 * 
			 * @param {Object}
			 *            context
			 * @param {ServerRequest}
			 *            context.request - Encapsulation of the incoming
			 *            request
			 * @param {ServerResponse}
			 *            context.response - Encapsulation of the Suitelet
			 *            response
			 * @Since 2015.2
			 */
			function onRequest(context) {

				var funcName = 'PRI_SL_EditListData.';

				if (context.request.method === 'POST') {

					var strOptionsParam = runtime.getCurrentScript()
							.getParameter({
								name : "custscript_pri_sl_editlistdata_options"
							});
					var objOptions = strOptionsParam ? JSON
							.parse(strOptionsParam) : {};

					// [1] Accept Parameters
					var linenum = context.request.parameters.linenum;
					var fldname = context.request.parameters.fldname;
					var fldvalue = context.request.parameters.fldvalue;
					var intFormRecId = context.request.parameters.intformrecid;
					var param_intSearchId = context.request.parameters.intsearchid;
					var strEditFldDef = context.request.parameters.streditflddef;
					var intTargetRecordId = context.request.parameters.targetrecordid;
					var arrEditFldDef = '';
					var objEditFldDef = '';
					if (strEditFldDef)
						arrEditFldDef = JSON.parse(strEditFldDef);

					log.debug(funcName, 'intFormRecId: ' + intFormRecId
							+ ', intSearchId: ' + param_intSearchId
							+ ', linenum: ' + linenum + ', fldname: ' + fldname
							+ ', fldvalue: ' + fldvalue + ', objOptions: '
							+ JSON.stringify(objOptions) + ', strEditFldDef: '
							+ strEditFldDef);

					try {
						var arrFldNameCompt = fldname.split('_');
						var intColIdxInFldName = fldname.lastIndexOf('_');
						var intColIdx = arrFldNameCompt[arrFldNameCompt.length - 1];
						var intColName = fldname.substring(fldname.indexOf('_'
								+ param_intSearchId + '_')
								+ param_intSearchId.length + 2,
								intColIdxInFldName);

						for (var idx = 0; idx < arrEditFldDef.length; idx++) {
							if (arrEditFldDef[idx].fieldname == intColIdx
									|| arrEditFldDef[idx].fieldname == intColName) {
								objEditFldDef = arrEditFldDef[idx];
							}
						}

						// [2] Validate get the Edit Field Structure
						if (!objEditFldDef) {
							context.response
									.write({
										output : 'alert("Encountered error between edit fields structure and saved search(can\'t find structure). Please update setup then edit again.");'
									});
							return true;
						}

						if (!param_intSearchId) {
							context.response
									.write({
										output : 'alert("Encountered error between edit fields structure and saved search(can\'t get Saved Search Id). Please update setup then edit again.");'
									});
							return true;
						}

						// Validate Edit Field Structure
						if (!objEditFldDef.targetrecord
								|| !objEditFldDef.setfieldid) {
							context.response
									.write({
										output : 'alert("Edit Fields Structure Definition Error(Can\'t get mandatory properties: targetrecord and setfieldid).  Please update parameter then edit again.");'
									});
							return true;
						}

						// [2.2] Ignore Set Field Feature
						if (objEditFldDef.setfieldid == 'IGNORESETFIELD') {
							context.response.write({
								output : 'true'
							});
							return true;
						}

						var strIdColLbl = '';
						if (objEditFldDef.targetrecordid)
							strIdColLbl = objEditFldDef.targetrecordid;

						// [3] Run Saved Search to get intTargetRecordId
						// NOTE: the sequence/sort of the search result is
						// very important, otherwise will set wrong record.
						var arrSearchRes = [];
						var objControlSrch = search.load({
							id : param_intSearchId
						});

						// Use last filter as the connection point to record
						objControlSrch = listDataLib.setControlSrchCriteria(
								objControlSrch, intFormRecId);

						var objPagedData = objControlSrch.runPaged({
							pageSize : 1000
						});
						objPagedData.pageRanges.forEach(function(pageRange) {

							var objMyCurPage = objPagedData.fetch({
								index : pageRange.index
							});
							for ( var idx in objMyCurPage.data) {
								var objOneSrchRes = objMyCurPage.data[idx];

								// if (!objOneSrchRes.id)
								// continue;
								arrSearchRes.push(objOneSrchRes);
							}
						});

						// [4.1] Default target record id is the search recordid
						intTargetRecordId = arrSearchRes[linenum - 1] ? arrSearchRes[linenum - 1].id
								: '';

						// [4.2] Overwrite target record id by defined
						// column(label) value
						var intTargetRecordIdColIdx = '';
						for (var i = 0; strIdColLbl && arrSearchRes
								&& i < arrSearchRes[0].columns.length; i++) {

							var objCol = arrSearchRes[0].columns[i];
							if (objCol.label && objCol.label == strIdColLbl) {

								intTargetRecordIdColIdx = i;
								break;
							}
						}
						if (intTargetRecordIdColIdx != '')
							intTargetRecordId = arrSearchRes[linenum - 1]
									.getValue(arrSearchRes[linenum - 1].columns[intTargetRecordIdColIdx]);

						if (!intTargetRecordId) {
							context.response
									.write({
										output : 'alert("Encountered error between edit fields structure and saved search(can\'t get Target Record Id). Please update setup then edit again.");'
									});
							return true;
						}

						// [4.3] Prepare for sublist data. Priority column:
						// lineuniquekey, line
						var strSublistId = objEditFldDef.setsublistid;
						var intLnUniqueKey = arrSearchRes[linenum - 1] ? arrSearchRes[linenum - 1]
								.getValue('lineuniquekey')
								: '';
						var intLnId = arrSearchRes[linenum - 1] ? arrSearchRes[linenum - 1]
								.getValue('line')
								: '';
						var intSublistLineIdx = '';

						// [5] Set/Submit data
						// var objSetValues = {};
						// objSetValues[objEditFldDef.setfieldid] = fldvalue;

						// record.submitFields({
						// type : objEditFldDef.targetrecord,
						// // targetrecord, get it in editFieldDefinition
						// id : intTargetRecordId,
						// // put to saved search column(hide, syntax
						// // to hide it); put the link in
						// // editFieldDefinition
						// values : objSetValues,
						// options : objOptions
						// });
						var objRec = record.load({
							type : objEditFldDef.targetrecord,
							id : intTargetRecordId
						});

						if (objEditFldDef.datatype
								&& objEditFldDef.datatype.type && fldvalue) {
							switch (objEditFldDef.datatype.type) {
							case 'date':
								fldvalue = format.parse({
									value : fldvalue,
									type : format.Type.DATE
								});
								break;

							case 'checkbox':
								fldvalue = (fldvalue == 'T') ? true : false;
								break;
							}
						}

						// [5.1] Find Line Index
						if (intLnUniqueKey && strSublistId) {

							var intTmpLnIdx = objRec.findSublistLineWithValue({
								sublistId : strSublistId,
								fieldId : 'lineuniquekey',
								value : intLnUniqueKey
							});
							if (intTmpLnIdx != -1)
								intSublistLineIdx = intTmpLnIdx;
						}

						if (intLnId && strSublistId
								&& intSublistLineIdx.length == 0) {

							var intTmpLnIdx = objRec.findSublistLineWithValue({
								sublistId : strSublistId,
								fieldId : 'line',
								value : intLnId
							});
							if (intTmpLnIdx != -1)
								intSublistLineIdx = intTmpLnIdx;
						}

						// [5.2-1] Set Body Data
						if (!strSublistId || intSublistLineIdx.length == 0) {

							// Validation for submit body field
							if (!objRec.getField(objEditFldDef.setfieldid)) {
								context.response
										.write({
											output : 'alert("Validation failed. Not exist body field \''
													+ objEditFldDef.setfieldid
													+ '\' in target record. Please update setup parameter then try again.");'
										});
								return true;
							}

							objRec.setValue(objEditFldDef.setfieldid, fldvalue);
							log.debug(funcName + 'SubmitData-1',
									'[Body Mode] setfieldid: '
											+ objEditFldDef.setfieldid
											+ ', fldvalue: ' + fldvalue);
						} else {

							// [5.2-2] Set Line Data
							objRec.setSublistValue({
								sublistId : strSublistId,
								fieldId : objEditFldDef.setfieldid,
								line : intSublistLineIdx,
								value : fldvalue
							});
							log.debug(funcName + 'SubmitData-2',
									'[Line Mode] strSublistId: ' + strSublistId
											+ 'setfieldid: '
											+ objEditFldDef.setfieldid
											+ ', intSublistLineIdx: '
											+ intSublistLineIdx
											+ ', fldvalue: ' + fldvalue);
						}

						objRec.save(objOptions);

					} catch (ex) {
						var strErrMsg = 'Failed to submit data(pending refresh page). \\r['
								+ ex.name
								+ '] '
								+ (ex.message ? ex.message : JSON.stringify(ex));
						context.response.write({
							output : 'alert("' + strErrMsg.replace(/"/g, '“')
									+ '");'
						});
						return true;
					}

					context.response.write({
						output : 'true'// alert("Successfully Submitted");
					});
					return true;
				}
			}

			return {
				onRequest : onRequest
			};

		});
