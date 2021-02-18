/*
*Summit IT Services LLC Copyright Notice
*
* Copyright © 2014 Summit IT Services LLC. All rights reserved. 
* This material may not be resold or redistributed without prior written 
* permission from Summit IT Services LLC. If you have any questions about
* these terms,please contact Summit IT Services LLC at +1 (970) 422-5022,
* or send email to admin@summitit.com.
*/

/**
 * @param {String} type Context Types: scheduled,ondemand,userinterface,aborted,skipped
 * @returns {Void}
 */
function sit_sched_batch_explode(type) {
	nlapiLogExecution('DEBUG','sit_sched_batch_explode','START');
	nlapiLogExecution('DEBUG','sit_sched_batch_explode|START',nlapiGetContext().getRemainingUsage());
	var resetLimit = 200;
	var batches = siapiFetchImportBatches();
	var mappingProfiles = {};
	try {
		for(var rLoop=0; batches!=null && rLoop<batches.length;rLoop++) {
			if(siapiCheckBatchReset(resetLimit)) {
				nlapiLogExecution('DEBUG','sit_sched_batch_explode|script reset',new Date().getTime()+'|'+nlapiGetContext().getRemainingUsage());
			}
			var mapProfileId = batches[rLoop].getValue('custrecord_si_csv_import_batch_import');
			if(!mappingProfiles.hasOwnProperty('map_'+mapProfileId)) {
				mappingProfiles['map_'+mapProfileId]=siapiGenerateMapProfile(mapProfileId);
			}
			/* 2 points to submit field on batch to update the status to processing */
			nlapiSubmitField('customrecord_si_csv_import_batch',batches[rLoop].getId(),'custrecord_si_csv_import_batch_status',CSV_BATCH_STATUS.PROCESSING);
			nlapiLogExecution('DEBUG','sit_sched_batch_explode','batch status updated');
			/* 2 points to load batch record */
			var batch = nlapiLoadRecord('customrecord_si_csv_import_batch',batches[rLoop].getId());
			nlapiLogExecution('DEBUG','sit_sched_batch_explode','batch loaded');
			var file = nlapiLoadFile(batch.getFieldValue('custrecord_si_csv_import_batch_file'));
			nlapiLogExecution('DEBUG','sit_sched_batch_explode','file loaded');
			var data = file.getValue();
			var lineSplit = new RegExp('.+','gm'); // TODO: allow users to specify line split in import map profile
			var fieldSplit = new RegExp(',(?=(?:[^"]|"[^"]*")*$)','gm'); // TODO: allow users to specify field split in import map profile
			var fileLines = data.match(lineSplit);
			if(fileLines != null && fileLines.length > 0) {
				var fileHeaders = siapiParseCSVHeaders(fileLines[0]);
				nlapiLogExecution('DEBUG','fileLines.length|1',fileLines.length);
				var mapHeaders = mappingProfiles['map_'+mapProfileId];
				if(mapHeaders == null) {
					nlapiLogExecution('ERROR','Missing mapHeaders');
					continue;
				}
				for(var oLoop=1;fileLines!=null && oLoop<fileLines.length;oLoop++) {
					checkScheduledGovernance(200);
					nlapiLogExecution('DEBUG','sit_sched_batch_explode|1',nlapiGetContext().getRemainingUsage());
					var lineData = fileLines[oLoop];
					nlapiLogExecution('DEBUG','lineData',lineData);
					var lineSplit = lineData.split(fieldSplit);
					validationObj = [];
					batch.selectNewLineItem('recmachcustrecord_si_csv_ibl_batch');
					for(var ln in mapHeaders.lines) {
						var curHeader = mapHeaders.lines[ln];
						var headerName = curHeader.headerName;
						var outputField = curHeader.mappedField;
						var fieldIndex = fileHeaders.findIndex(headerName);
						if(fieldIndex != null && fieldIndex >=0) {
							var lineFields = lineSplit[fieldIndex].replace(/^"/,'').replace(/"$/,'');
							batch.setCurrentLineItemValue('recmachcustrecord_si_csv_ibl_batch',outputField,lineFields);
						}
					}
					nlapiLogExecution('DEBUG','sit_sched_batch_explode|2',nlapiGetContext().getRemainingUsage());
					var validationObj = validateLineData(mapHeaders,fileHeaders,lineSplit);
					if(validationObj != null) {
						var validations = {};
						validations['CSV_IMPORT']=validationObj;
						batch.setCurrentLineItemValue('recmachcustrecord_si_csv_ibl_batch','custrecord_si_csv_ibl_results',JSON.stringify(validations));
						batch.setCurrentLineItemValue('recmachcustrecord_si_csv_ibl_batch','custrecord_si_csv_ibl_status',CSV_BATCH_STATUS.VALIDATION_ERROR);
					} else {
						batch.setCurrentLineItemValue('recmachcustrecord_si_csv_ibl_batch','custrecord_si_csv_ibl_status',CSV_BATCH_STATUS.VALID);
					}
					batch.setCurrentLineItemValue('recmachcustrecord_si_csv_ibl_batch','custrecord_si_csv_ibl_blob',fileLines[oLoop]);
					batch.commitLineItem('recmachcustrecord_si_csv_ibl_batch');
					nlapiLogExecution('DEBUG','sit_sched_batch_explode|3',nlapiGetContext().getRemainingUsage());
				}
			}
			if(batch.getFieldValue('custrecord_si_csv_import_batch_status')==CSV_BATCH_STATUS.PROCESSING) {
				batch.setFieldValue('custrecord_si_csv_import_batch_status',CSV_BATCH_STATUS.EXPLODED);
			}
			nlapiLogExecution('DEBUG','sit_sched_batch_explode|2',nlapiGetContext().getRemainingUsage());
			var batchId = nlapiSubmitRecord(batch,true,true);
			nlapiLogExecution('AUDIT','CSV Import Batch Exploded','Batch InternalId '+batchId);
		}
	} catch(e) {
		nlapiLogExecution('ERROR','sit_sched_batch_explode',e);
	}
	nlapiLogExecution('DEBUG','sit_sched_batch_explode|END',nlapiGetContext().getRemainingUsage());
}

/**
 * @param {String} type Context Types: scheduled,ondemand,userinterface,aborted,skipped
 * @returns {Void}
 */
function sit_sched_batch_process_job(type) {
	nlapiLogExecution('DEBUG','sit_sched_batch_process_job','START');
	var resetLimit = 200;
	var batchId = nlapiGetContext().getSetting('SCRIPT','custscript_sit_process_job_job_rec');
	nlapiLogExecution('DEBUG','sit_sched_batch_process_job|batchId',batchId);
	if(batchId == null) {
		throw nlapiCreateError('MISSING JOB Id','Unable to to process Job without Job Id',false);
	}
	var jobLines = siapiFetchValidJobLineRecords(batchId);
	nlapiLogExecution('DEBUG','sit_sched_batch_process_job|jobLines',JSON.stringify(jobLines));
	if(jobLines != null) {
		nlapiLogExecution('DEBUG','siapiFetchValidJobLineRecords|length',jobLines.length);
	}
	var jobProfiles = new JOB_PROFILE_LIST();
	try {
		for(var rLoop=0; jobLines!=null && rLoop<jobLines.length;rLoop++) {
			nlapiLogExecution('DEBUG','sit_sched_batch_process_job|ROW',rLoop);
			nlapiLogExecution('DEBUG','sit_sched_batch_process_job|ts',new Date().getTime());
			if(siapiCheckBatchReset(resetLimit)) {
				nlapiLogExecution('DEBUG','sit_sched_batch_process_job|script reset',new Date().getTime()+'|'+nlapiGetContext().getRemainingUsage());
			}
			var batchLine = nlapiLoadRecord('customrecord_si_csv_import_batch_line',jobLines[rLoop].getId());
			if(batchId != null && batchId != batchLine.getFieldValue('custrecord_si_csv_ibl_batch')) {
				nlapiLogExecution('DEBUG','sit_sched_batch_process_job|batchId',batchId);
				nlapiSubmitField('customrecord_si_csv_import_batch',batchId,'custrecord_si_csv_import_batch_status',3); /* mark COMPLETE once it is complete  */
			}
			batchId = batchLine.getFieldValue('custrecord_si_csv_ibl_batch');
			try {
				var jobProfileId = jobLines[rLoop].getValue('custrecord_si_csv_import_batch_map','custrecord_si_csv_ibl_batch');
				jobProfiles.addJob(jobProfileId);
				nlapiLogExecution('DEBUG','sit_sched_batch_process_job|jobProfiles.processData|ts start',new Date().getTime());
				jobProfiles.processData(jobProfileId,batchLine);
				nlapiLogExecution('DEBUG','sit_sched_batch_process_job|jobProfiles.processData|ts end',new Date().getTime());
			} catch(e) {
				nlapiSubmitField('customrecord_si_csv_import_batch',batchId,'custrecord_si_csv_import_batch_status',4); /* mark ERROR if it fall into the catch */
				nlapiSendEmail(-5,nlapiGetContext().getUser(),'Import Job Line Error','<a href="'+batchURL+'">Import Job has Error(s)</a><br/><br/>Import Job Line Error:<br/><br/>'+JSON.stringify(batchLine)+'<br/><br/>'+e);
			}
		}
		nlapiLogExecution('DEBUG','sit_sched_batch_process_job|batchId',batchId);
		nlapiSubmitField('customrecord_si_csv_import_batch',batchId,'custrecord_si_csv_import_batch_status',3); /* mark COMPLETE once it is complete  */
	} catch(e) {
		try {
			nlapiLogExecution('ERROR','sit_sched_batch_process_job',e);
			nlapiSubmitField('customrecord_si_csv_import_batch',batchId,'custrecord_si_csv_import_batch_status',4); /* mark ERROR if it fall into the catch */
		} catch(e) {
			nlapiLogExecution('ERROR','sit_sched_batch_process_job|submitfield',e);
			nlapiSendEmail(-5,nlapiGetContext().getUser(),'Import Job Complete','<a href="'+batchURL+'">Import Job is Failed</a>');
		}
	}
	var batchURL = nlapiResolveURL('RECORD','customrecord_si_csv_import_batch',batchId,'VIEW');
	nlapiSendEmail(-5,nlapiGetContext().getUser(),'Import Job Complete','<a href="'+batchURL+'">Import Job is complete</a>');
}

function validateLineData(mapHeaders,fileHeaders,lineSplit) {
	var validation = null;
	var dataObj = {};
	for(var ln in mapHeaders.lines) {
		var curHeader = mapHeaders.lines[ln];
		var headerName = curHeader.headerName;
		var outputField = curHeader.mappedField;
		var fieldIndex = fileHeaders.findIndex(headerName);
		if(fieldIndex != null && fieldIndex >=0) {
			var lineFields = lineSplit[fieldIndex].replace(/^"/,'').replace(/"$/,'');
			dataObj[outputField] = {value:lineFields,validate:curHeader.validate};
		}
	}
	for(var vn in dataObj) {
		var header = dataObj[vn];
		if(typeof header.validate == 'function') {
			var validationResults = header.validate(vn,dataObj);
			if(validationResults != null && validationResults.hasOwnProperty('valid') && !validationResults.valid) {
				if(validation==null) { validation=[];}
				for(var vr in validationResults.messages) {
					validation.push(validationResults.messages[vr]);
				}
			} else if(validationResults != null && validationResults.hasOwnProperty('valid') && validationResults.valid) {
				/* if validation is Valid do nothing */
			} else if(validationResults != null && validationResults!=true) {
				if(validation==null) { validation=[];}
				validation.push(validationResults);
			}
		}
	}
	return validation;
}