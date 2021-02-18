//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */

define(
		[ 'N/error', 'N/file', 'N/format', 'N/record', 'N/task', 'N/redirect',
				'N/runtime', 'N/search' ],
		/**
		 * @param {error}
		 *            error
		 * @param {file}
		 *            file
		 * @param {format}
		 *            format
		 * @param {record}
		 *            record
		 * @param {redirect}
		 *            redirect
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(error, file, format, record, task, redirect, runtime, search,
				creRPProcess) {

			/**
			 * Convert load record type name to Record Type drop down field
			 * value, include: standard NS record type and custom record type
			 * 
			 * @param {String}
			 *            strLoadRecType record type which usable for load
			 * @param {Integer}
			 *            intRecId record internal id
			 * 
			 * @returns {String} strRecName Record Id/Name used for Record Type
			 *          drop down field
			 */
			function convertRecordTypeFldValToId(strLoadRecType, intRecId) {

				if (strLoadRecType.indexOf('customrecord_') == 0) {
					var objRecLoad = record.load({
						type : strLoadRecType,
						id : intRecId
					});
					return objRecLoad.getValue('rectype');
				}

				var objStandardTypeIdMap = {
					// Transaction map, List from:
					// https://system.na1.netsuite.com/app/setup/naming.nl?whence=
					'assemblybuild' : -30,
					'assemblyunbuild' : -30,
					'vendorbill' : -30,
					'vendorcredit' : -30,
					'vendorpayment' : -30,
					'binworksheet' : -30,
					'bintransfer' : -30,
					'cashrefund' : -30,
					'cashsale' : -30,
					'check' : -30,
					'creditmemo' : -30,
					'customerdeposit' : -30,
					'customerrefund' : -30,
					'deposit' : -30,
					'depositapplication' : -30,
					'estimate' : -30,
					'expensereport' : -30,
					'inventoryadjustment' : -30,
					'inventorytransfer' : -30,
					'invoice' : -30,
					'itemfulfillment' : -30,
					'itemreceipt' : -30,
					'journalentry' : -30,
					'opportunity' : -30,
					'customerpayment' : -30,
					'purchaseorder' : -30,
					'returnauthorization' : -30,
					'salesorder' : -30,
					'transferorder' : -30,
					'vendorreturnauthorization' : -30,
					'workorder' : -30,
					// New founded&map to transaction
					'creditcardcharge' : -30,
					'paycheck' : -30,
					'paycheckjournal' : -30,
					'transfer' : -30,
					'commission' : -30,

					// Other record map
					"account" : -122,
					"accountingperiod" : -105,
					"bin" : -242,
					"call" : -22,
					"campaign" : -24,
					"case" : -23,
					"class" : -101,
					"competitor" : -108,
					"contact" : -6,
					"customer" : -2,
					"customercategory" : -109,
					"department" : -102,
					"emailtemplate" : -120,
					"employee" : -4,
					"employeetype" : -111,
					"entitystatus" : -104,
					"event" : -20,
					"issue" : -26,
					"item" : -10,
					"itemtype" : -106,
					"job" : -7,
					"location" : -103,
					"module" : -116,
					"opportunity" : -31,
					"partner" : -5,
					"product" : -115,
					"productbuild" : -114,
					"productversion" : -113,
					"project" : -7,
					"role" : -118,
					"savedsearch" : -119,
					"subsidiary" : -117,
					"task" : -21,
					"transaction" : -30,
					"transaction type" : -100,
					"vendor" : -3,
					"vendorcategory" : -110,
					// New founded ids
					"charge" : -290
				};

				return objStandardTypeIdMap[strLoadRecType];
			}

			/**
			 * Store selected value to file
			 * 
			 * <li>History
			 * <li>Date Author Comment
			 * <li>2016/12/11 Carl Store log files to Processing folder, create
			 * it if not-existed
			 * 
			 * @param {Object}
			 *            objCreRequestInput
			 * @returns {Integer}
			 */
			function storeCreRequestInputFile(objCreRequestInput) {

				// Get folder ready
				var intProcessingFolderId = '';
				var strProcessingFolderName = 'Processing';
				var objSearchResults = search
						.create(
								{
									type : record.Type.FOLDER,
									filters : [
											[ 'name', 'IS',
													strProcessingFolderName ],
											'and',
											[
													'parent',
													'ANYOF',
													[ objCreRequestInput.creRootFlder ] ] ],
									columns : [ 'internalid' ]
								}).run().getRange(0, 10);
				if (!objSearchResults || objSearchResults.length < 1) {

					var objFolder = record.create({
						type : record.Type.FOLDER
					});
					objFolder.setValue('name', strProcessingFolderName);
					objFolder.setValue('parent',
							objCreRequestInput.creRootFlder);
					intProcessingFolderId = objFolder.save();
				} else
					intProcessingFolderId = objSearchResults[0]
							.getValue('internalid');

				var strToday = format.parse({
					'value' : new Date(),
					'type' : format.Type.DATETIME,
					'timezone' : 'America/Los_Angeles'
				});// ASIA_HONG_KONG: 'Asia/Hong_Kong'
				var hh = strToday.getHours() < 10 ? "0" + strToday.getHours()
						: strToday.getHours();
				var min = strToday.getMinutes() < 10 ? "0"
						+ strToday.getMinutes() : strToday.getMinutes();
				var ss = strToday.getSeconds() < 10 ? "0"
						+ strToday.getSeconds() : strToday.getSeconds();
				var mss = strToday.getMilliseconds();
				var strDateFormat = strToday.toISOString().slice(0, 10)
						.replace(/-/g, "").concat(hh).concat(min);
				var strFileReqInput = JSON.stringify(objCreRequestInput);
				var objFileReqInput = file.create({
					name : 'SelectedRec_' + runtime.getCurrentUser().name + '_'
							+ strDateFormat + '.txt',
					fileType : file.Type.PLAINTEXT,
					contents : strFileReqInput
				});
				objFileReqInput.folder = Boolean(intProcessingFolderId) ? intProcessingFolderId
						: objCreRequestInput.creRootFlder;
				var intFileId = objFileReqInput.save();

				log.debug('creSuiteletInput Store file', 'Created intFileId: '
						+ intFileId);
				return intFileId;
			}

			/**
			 * Post map/reduce task: Save to record type
			 * 
			 * @param {Integer}
			 *            intFileId
			 * @returns {Integer} Task id
			 */
			function postCreateTaskByFile(intFileId) {

				var objScriptTask = task.create({
					taskType : task.TaskType.MAP_REDUCE
				});
				objScriptTask.scriptId = 'customscript_pri_cre_input_map_reduce';
				objScriptTask.deploymentId = 'customdeploy_pri_cre_input_map_reduce';
				objScriptTask.params = {
					custscript_pri_cre_input_map_proceedfile : intFileId
				};
				var intScriptTaskId = objScriptTask.submit();
				return intScriptTaskId;

			}

			// ----------------3. Automated: No UI ("MarkAll")-----------------
			/**
			 * Automated Mode
			 * 
			 * @returns {String} strScriptTaskId Posted schedule task id
			 */
			function creInputAutomated(param_intSearchId, param_formFilterFld,
					param_creProfile, param_creOptionGrp, param_creRootFlder,
					param_parentRecId) {

				// [0] Get Parameters, or default it as script parameter
				if (!param_intSearchId)
					param_intSearchId = 461;
				if (!param_formFilterFld)
					param_formFilterFld = 'entity';
				if (!param_creProfile)
					param_creProfile = 63;
				if (!param_creOptionGrp)
					param_creOptionGrp = 1;
				if (!param_creRootFlder)
					param_creRootFlder = 6185;
				// var param_parentRecId = '';

				var objCreRequestInput = {};
				objCreRequestInput.intSearchId = param_intSearchId;
				objCreRequestInput.formFilterFld = param_formFilterFld;
				objCreRequestInput.creProfile = param_creProfile;
				objCreRequestInput.creOptionGrp = param_creOptionGrp;
				objCreRequestInput.creRootFlder = param_creRootFlder;
				objCreRequestInput.detail = new Array();

				// [1] Load search
				var objControlSrch = search.load({
					id : param_intSearchId
				});

				// Apply filtering: filter field and parent record id
				if (param_formFilterFld && param_parentRecId) {

					// objControlSrch.add
					var objParentFilter = search.createFilter({
						name : param_formFilterFld,
						operator : search.Operator.ANYOF,
						values : [ param_parentRecId ]
					});
					objControlSrch.filters.push(objParentFilter);
				}

				// [2] Load search results, Mark All, .getRange(0, 1000);
				var objConvertRecType = {};
				var intProceedCnt = 0;
				objControlSrch.run().each(
						function(objResultSet) {

							var objSelectedRecInfo = {};
							var strLoadRecType = objResultSet.recordType;
							var intRecId = objResultSet.id;
							objSelectedRecInfo.strLoadRecType = strLoadRecType;
							objSelectedRecInfo.strRecId = objResultSet.id;

							// Convert loadable record type to record type text
							var strRecType = objConvertRecType[strLoadRecType];
							if (!strRecType) {
								strRecType = convertRecordTypeFldValToId(
										strLoadRecType, intRecId);
								objConvertRecType[strLoadRecType] = strRecType;
							}
							objSelectedRecInfo.strRecType = strRecType;

							objCreRequestInput.detail.push(objSelectedRecInfo);

							intProceedCnt++;
							if (intProceedCnt > 3999)
								return false;
							else
								return true;
						});

				// [3] Store selected value to file
				var intFileId = storeCreRequestInputFile(objCreRequestInput);

				// [4] post schedule/task: Save to record type
				var strScriptTaskId = postCreateTaskByFile(intFileId);

				return strScriptTaskId;
			}

			/**
			 * Get specific column as recordType and recordId
			 * 
			 * @param {object}
			 *            objOneSrchRes Search Result
			 * 
			 * @returns {object}
			 */
			function getRecordTypeAndIdFromSearch(objOneSrchRes) {

				if (!objOneSrchRes)
					return {};

				var strRecType = objOneSrchRes.recordType;
				var intRecId = objOneSrchRes.id;

				for (var colIdx = 0; colIdx < objOneSrchRes.columns.length; colIdx++) {

					var objColTmp = objOneSrchRes.columns[colIdx];

					var strTmpText = objOneSrchRes.getText({
						name : objColTmp.name,
						join : objColTmp.join
					});
					// consider join columns
					var strOrgValue = objOneSrchRes.getValue({
						name : objColTmp.name,
						join : objColTmp.join
					});

					switch (objColTmp.label) {
					case 'RecordType':

						strRecType = strTmpText ? strTmpText
								: (strOrgValue ? strOrgValue : ' ');
						break;
					case 'RecordId':
						intRecId = strTmpText ? strTmpText
								: (strOrgValue ? strOrgValue : ' ');
						break;
					}
				}

				return {
					strRecType : strRecType,
					intRecId : intRecId
				};
			}
			/**
			 * Create CRE Request Input Header and Detail records
			 * 
			 * @param {object}
			 *            objCreRequestInput object drive the header and detail
			 *            core data
			 * 
			 * @returns {integer} CRE Request Input Header ID
			 */
			function createHeaderAndDetailRec(objCreRequestInput) {

				if (!objCreRequestInput)
					return false;

				// [1] Create PRI CRE Request Input Header
				var objReqHeaderRec = record.create({
					type : 'customrecord_pri_cre_request_header'
				});
				objReqHeaderRec.setValue('custrecord_pri_cre_request_profile',
						objCreRequestInput.creProfile);
				objReqHeaderRec.setValue('custrecord_pri_cre_request_option',
						objCreRequestInput.creOptionGrp);
				objReqHeaderRec.setValue('custrecord_pri_cre_request_folder',
						objCreRequestInput.creRootFlder);
				for ( var strFldId in objCreRequestInput) {
					if (strFldId && strFldId.indexOf('custrecord_') == 0) {
						var objFld = objReqHeaderRec.getField(strFldId);
						switch (objFld.type) {
						case 'checkbox':
							if (objCreRequestInput[strFldId] == 'T')
								objReqHeaderRec.setValue(strFldId, true);
							else
								objReqHeaderRec.setValue(strFldId, false);

							break;
						case 'date':
							objReqHeaderRec.setValue(strFldId, format.format({
								value : objCreRequestInput[strFldId],
								type : format.Type.DATE
							}));

							break;
						case 'datetimetz':
							objReqHeaderRec.setValue(strFldId, format.format({
								value : objCreRequestInput[strFldId],
								type : format.Type.DATETIMETZ
							}));

							break;
						default:
							objReqHeaderRec.setValue(strFldId,
									objCreRequestInput[strFldId]);
							break;
						}
					}
				}

				var intReqHeaderId = objReqHeaderRec.save();
				log.debug('createHeaderAndDetailRec',
						'Created intReqHeaderId: ' + intReqHeaderId);

				// [2] Create header record number's sub-folder
				var strReqNumFolderName = parseInt(intReqHeaderId).toFixed(0);
				strReqNumFolderName = strReqNumFolderName.length < 16 ? (Array(
						16).join('0') + strReqNumFolderName).slice(-16)
						: strReqNumFolderName;

				var objFolder = record.create({
					type : record.Type.FOLDER
				});
				objFolder.setValue('name', strReqNumFolderName);
				objFolder.setValue('parent', objCreRequestInput.creRootFlder);
				var intOutputFolderId = objFolder.save();

				var objReqHeaderRec = record.load({
					type : 'customrecord_pri_cre_request_header',
					id : intReqHeaderId
				});
				objReqHeaderRec.setValue('custrecord_pri_cre_request_folder',
						intOutputFolderId);
				objReqHeaderRec.setValue(
						'custrecord_pri_cre_request_folder_link',
						'/app/common/media/mediaitemfolders.nl?folder='
								+ intOutputFolderId);
				objReqHeaderRec.setValue(
						'custrecord_pri_cre_request_header_zlink',
						'/core/media/downloadfolder.nl?id=' + intOutputFolderId
								+ '&_xt=&_xd=T&e=T');
				var intReqHeaderId = objReqHeaderRec.save();
				log.debug('createHeaderAndDetailRec',
						'Updated intReqHeaderId: ' + intReqHeaderId);

				// [3] Create PRI CRE Request Input Detail
				var arrDetailLineObj = objCreRequestInput.detail;

				// Ignore duplicated record creation
				var arrCreatedDetailRecList = [];
				var arrDetailLineObjUnique = [];
				for (var i = 0; arrDetailLineObj && i < arrDetailLineObj.length; i++) {
					var objTmp = arrDetailLineObj[i];
					objTmp.intReqHeaderId = intReqHeaderId;

					if (arrCreatedDetailRecList.indexOf(objTmp.strLoadRecType
							+ '_' + objTmp.strRecId) != -1)
						continue;
					else {

						arrCreatedDetailRecList.push(objTmp.strLoadRecType
								+ '_' + objTmp.strRecId);
						arrDetailLineObjUnique[arrDetailLineObjUnique.length] = objTmp;
					}
				}

				for (var detailIdx = 0; arrDetailLineObjUnique
						&& detailIdx < arrDetailLineObjUnique.length; detailIdx++) {

					var objDetailLineObj = arrDetailLineObjUnique[detailIdx];
					var objReqDetailRec = record.create({
						type : 'customrecord_pri_cre_request_detail',
					});

					// Get intReqHeaderId
					objReqDetailRec.setValue(
							'custrecord_pri_cre_request_header',
							objDetailLineObj.intReqHeaderId);
					objReqDetailRec.setText(
							'custrecord_pri_cre_request_recordsubtype',
							objDetailLineObj.strLoadRecType);
					objReqDetailRec.setValue('custrecord_pri_cre_request_id',
							objDetailLineObj.strRecId);

					var intReqDetailRecId = objReqDetailRec.save();
				}

				return intReqHeaderId;
			}
			/**
			 * CRE Proceed Search
			 * 
			 * @param {integer}
			 *            param_intSearchId NetSuite Saved Search Internal Id,
			 *            [Note Advance Feature]: please setup search column
			 *            label for 'RecordType' and 'RecordId', if search is
			 *            driven by joined record.
			 * @param {integer}
			 *            param_creProfile CRE PROFILE
			 * @param {integer}
			 *            param_creOptionGrp TARGET CRE OPTION GROUP
			 * @param {integer}
			 *            param_creRootFlder ROOT FOLDER
			 * @param {object}[Optional]
			 *            objOptions contains: 1. arr_objFilters {array} search
			 *            filter array which will apply to param_intSearchId.<br>
			 *            2. bolCreateInputFile {boolean} true to generate a
			 *            back-end file base on searched data and parameters.<br>
			 *            3. objHookSc {object} scriptId and deploymentId.<br>
			 *            4. objReqInputFlds {object} Field&values set to CRE
			 *            Request Input Header.<br>
			 * 
			 * @returns {boolean|object} detail: RecordType and RecordId. I.e
			 *          {header: 1, detail: [{strRecType: 'invoice', strRecId:
			 *          1}, {strRecType: 'invoice', strRecId: 2}]}
			 */
			function creProceedSearch(param_intSearchId, param_creProfile,
					param_creOptionGrp, param_creRootFlder, objOptions) {

				if (!param_intSearchId || !param_creProfile
						|| !param_creOptionGrp || !param_creRootFlder)
					return false;

				var objCreRequestInput = {};
				objCreRequestInput.intSearchId = param_intSearchId;
				objCreRequestInput.creProfile = param_creProfile;
				objCreRequestInput.creOptionGrp = param_creOptionGrp;
				objCreRequestInput.creRootFlder = param_creRootFlder;
				// Add other fields for Request Header Record
				if (objOptions && objOptions.objReqInputFlds) {
					for ( var objName in objOptions.objReqInputFlds)
						objCreRequestInput[objName] = objOptions.objReqInputFlds[objName];
				}
				objCreRequestInput.detail = new Array();

				// [1] Load saved search
				var objControlSrch = search.load({
					id : param_intSearchId
				});

				if (objOptions && objOptions.arr_objFilters) {

					arr_objFilters = objOptions.arr_objFilters;
					for (var i = 0; i < arr_objFilters.length; i++)
						objControlSrch.filters.push(arr_objFilters[i]);
				}

				// [2] Get search results value
				var objConvertRecType = {};
				var arrTtlOrd = [];
				var objPagedData = objControlSrch.runPaged({
					pageSize : 1000
				});
				objPagedData.pageRanges
						.forEach(function(pageRange) {

							var objMyCurPage = objPagedData.fetch({
								index : pageRange.index
							});

							// API: Result.recordType, Result.id,
							// Result.columns
							for ( var idx in objMyCurPage.data) {
								var objOneSrchRes = objMyCurPage.data[idx];

								if (!objOneSrchRes.id)
									continue;

								var objSelectedRecInfo = {};
								// 6/8/2017 Carl, enhance for selected record
								var objRecTypeId = getRecordTypeAndIdFromSearch(objOneSrchRes);
								var strLoadRecType = objRecTypeId.strRecType;
								var intRecId = objRecTypeId.intRecId;
								objSelectedRecInfo.strLoadRecType = strLoadRecType;
								objSelectedRecInfo.strRecId = intRecId;

								// Convert loadable record type to record type
								// text
								var strRecType = objConvertRecType[strLoadRecType];
								if (!strRecType) {
									strRecType = convertRecordTypeFldValToId(
											strLoadRecType, intRecId);
									objConvertRecType[strLoadRecType] = strRecType;
								}
								objSelectedRecInfo.strRecType = strRecType;

								objCreRequestInput.detail
										.push(objSelectedRecInfo);

								// summary order array 2
								if (arrTtlOrd.indexOf(objOneSrchRes.id) == -1)
									arrTtlOrd.push(objOneSrchRes.id);
							}// proceed each lines
						});

				if (!objCreRequestInput.detail
						|| objCreRequestInput.detail.length < 1) {
					return false;
				}

				// [3] Store selected value to file
				if (objOptions.bolCreateInputFile == true)
					var intFileId = storeCreRequestInputFile(objCreRequestInput);

				// [4] Save to record type
				var intHeaderRecId = createHeaderAndDetailRec(objCreRequestInput);
				objCreRequestInput.header = intHeaderRecId;

				// [5] Set status to open
				record.submitFields({
					type : 'customrecord_pri_cre_request_header',
					id : intHeaderRecId,
					values : {
						custrecord_pri_cre_request_header_status : 1
					}
				});

				// [6] Proceed CRE. Proceed line button integration,
				// automatically execution of CRE request header and lines
				// Ignore creRPProcess.ProcessRequestHeaders(intHeaderRecId);
				if (objOptions.objHookSc && objOptions.objHookSc.scriptId) {

					var objScriptTask = task.create({
						taskType : task.TaskType.SCHEDULED_SCRIPT
					});
					objScriptTask.scriptId = objOptions.objHookSc.scriptId;
					objScriptTask.deploymentId = objOptions.objHookSc.deploymentId;
					try {
						var intScriptTaskId = objScriptTask.submit();
					} catch (ex) {
						log.error('creProceedSearch', 'ex:'
								+ JSON.stringify(ex));
					}
				}

				return objCreRequestInput;
			}

			return {

				convertRecordTypeFldValToId : convertRecordTypeFldValToId,
				storeCreRequestInputFile : storeCreRequestInputFile,
				postCreateTaskByFile : postCreateTaskByFile,
				creInputAutomated : creInputAutomated,

				getRecordTypeAndIdFromSearch : getRecordTypeAndIdFromSearch,
				createHeaderAndDetailRec : createHeaderAndDetailRec,
				creProceedSearch : creProceedSearch
			};

		});
