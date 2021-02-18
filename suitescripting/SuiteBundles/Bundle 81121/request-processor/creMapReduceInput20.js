//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * 
 * Map/Reduce Script Task Functions
 * 
 * <li>History
 * <li>Date Author Comment
 * <li>2016/12/10 Carl Update to sync CRE Request Input Detail field id
 * <li>2016/12/12 Carl Create related folder as header record number
 * 
 */
define(
		[ 'N/file', 'N/format', 'N/error', 'N/record', 'N/runtime', 'N/search',
				'N/task' ],
		/**
		 * @param {file}
		 *            file
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 * @param {task}
		 *            task
		 */
		function(file, format, error, record, runtime, search, task) {

			function handleErrorIfAny(summary) {

				var inputSummary = summary.inputSummary;
				var mapSummary = summary.mapSummary;

				if (inputSummary.error) {
					var e = error.create({
						name : 'Input_Stage_Failed',
						message : inputSummary.error
					});
					log.error('Stage: Input failed', e);
				}

				if (mapSummary.error) {
					var e = error.create({
						name : 'Map_Stage_Failed',
						message : mapSummary.error
					});
					log.error('Stage:  Map failed', e);
				}

				log.error('handleErrorIfAny', 'inputSummary: ' + inputSummary
						+ '.mapSummary: ' + mapSummary);
			}

			/**
			 * Create each request detail record
			 * 
			 * @param {Object}
			 *            objDetailLineObj Detail line object
			 */
			function executePerRec(objDetailLineObj) {

				log.debug('executePerRec begin', 'objDetailLineObj: '
						+ JSON.stringify(objDetailLineObj));

				var objReqDetailRec = record.create({
					type : 'customrecord_pri_cre_request_detail',
				});

				// Get intReqHeaderId
				objReqDetailRec.setValue('custrecord_pri_cre_request_header',
						objDetailLineObj.intReqHeaderId);
				objReqDetailRec.setText(
						'custrecord_pri_cre_request_recordsubtype',
						objDetailLineObj.strLoadRecType);
				objReqDetailRec.setValue('custrecord_pri_cre_request_id',
						objDetailLineObj.strRecId);

				var intReqDetailRecId = objReqDetailRec.save();
				log.debug('executePerRec end, track record type converted',
						'strRecId: ' + objDetailLineObj.strRecId
								+ '. strLoadRecType: '
								+ objDetailLineObj.strLoadRecType
								+ ' -> strRecType: '
								+ objDetailLineObj.strRecType
								+ '. intReqDetailRecId:' + intReqDetailRecId);

				return intReqDetailRecId;
			}
			/**
			 * Marks the beginning of the Map/Reduce process and generates input
			 * data.
			 * 
			 * @typedef {Object} ObjectRef
			 * @property {number} id - Internal ID of the record instance
			 * @property {string} type - Record type id
			 * 
			 * @return {Array|Object|Search|RecordRef} inputSummary
			 * @since 2015.1
			 */
			function getInputData() {

				var objCurScript = runtime.getCurrentScript();
				var intFileId = objCurScript.getParameter({
					name : 'custscript_pri_cre_input_map_proceedfile'
				});

				log.debug('creMapReduceInput Parameter', 'intFileId: '
						+ intFileId);

				if (!intFileId)
					return true;

				var objProceedFile = file.load({
					id : intFileId
				});

				var strFileContents = objProceedFile.getContents();
				var objFileContents = JSON.parse(strFileContents);
				var objCreRequestInput = objFileContents;

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
				log.debug('getInputData', 'Created intReqHeaderId: '
						+ intReqHeaderId);

				// [1] Create header record number's sub-folder
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
				log.debug('getInputData', 'Updated intReqHeaderId: '
						+ intReqHeaderId);

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

				log.debug('getInputData', 'arrDetailLineObjUnique type:'
						+ typeof (arrDetailLineObjUnique)
						+ '.arrDetailLineObjUnique:' + arrDetailLineObjUnique);

				return arrDetailLineObjUnique;
			}

			/**
			 * Executes when the map entry point is triggered and applies to
			 * each key/value pair.
			 * 
			 * @param {MapSummary}
			 *            context - Data collection containing the key/value
			 *            pairs to process through the map stage
			 * @since 2015.1
			 */
			function map(context) {

				log.debug('map begin >', 'Key: ' + context.key + '. Value: '
						+ context.value + '. of total length: '
						+ context.value.length);
				var objDetailLineObj = JSON.parse(context.value);

				// Executed 1 line only
				var intReqDetailRecId = executePerRec(objDetailLineObj);

				log.debug('> map end', 'context.key: ' + context.key
						+ '.context.value: ' + context.value
						+ '.objDetailLineObj:' + objDetailLineObj
						+ '.intReqDetailRecId:' + intReqDetailRecId);

				context.write(objDetailLineObj.intReqHeaderId, context.value);
			}

			/**
			 * Executes when the reduce entry point is triggered and applies to
			 * each group.
			 * 
			 * @param {ReduceSummary}
			 *            context - Data collection containing the groups to
			 *            process through the reduce stage
			 * @since 2015.1
			 */
			function reduce(context) {

				log.debug('REDUCE begin - end', 'context.key: ' + context.key
						+ '.context.value: ' + context.value);
				if (context.key) {

					// [1] Set status to open
					record.submitFields({
						type : 'customrecord_pri_cre_request_header',
						id : context.key,
						values : {
							custrecord_pri_cre_request_header_status : 1
						}
					});

					// [2] Proceed line button integration, 20170608/Carl,
					// automatically execution of CRE request header and lines
					var objProceedTask = task.create({
						taskType : task.TaskType.SCHEDULED_SCRIPT
					});
					objProceedTask.scriptId = 'customscript_pri_cre_process_headers';
					objProceedTask.params = {
						'custscript_pri_rp_process_header_id' : context.key
					};
					var intProceedTaskId = objProceedTask.submit();
				}
				// context.write(context.key, context.value);
			}

			/**
			 * Executes when the summarize entry point is triggered and applies
			 * to the result set.
			 * 
			 * @param {Summary}
			 *            summary - Holds statistics regarding the execution of
			 *            a map/reduce script
			 * @since 2015.1
			 */
			function summarize(summary) {

				handleErrorIfAny(summary);

				var type = summary.toString();
				log.audit(type + ' Usage Consumed', summary.usage);
				log.audit(type + ' Number of Queues', summary.concurrency);
				log.audit(type + ' Number of Yields', summary.yields);
				var contents = '';
				summary.output.iterator().each(function(key, value) {
					contents += (key + ' ' + value + '\n');
					return true;
				});

				log.audit('type: ' + type, 'contents:' + contents);
			}
			return {
				getInputData : getInputData,
				map : map,
				reduce : reduce,
				summarize : summarize
			};

		});
