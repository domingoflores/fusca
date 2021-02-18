/*
*Summit IT Services LLC Copyright Notice
*
* Copyright © 2014 Summit IT Services LLC. All rights reserved. 
* This material may not be resold or redistributed without prior written 
* permission from Summit IT Services LLC. If you have any questions about
* these terms, please contact Summit IT Services LLC at +1 (970) 422-5022,
* or send email to admin@summitit.com.
*/

/***
 * RECORDS for the INIT customer importer
 * customer
 * contact
 * customrecord_acq_exchange_hash
 * customrecord_acq_lot
 * customrecord_acq_lot_cert_entry
 *  
 */

/* ENUMS */
CSV_BATCH_STATUS={PENDING:1,PROCESSING:2,COMPLETE:3,SYSTEM_ERROR:4,CANCELLED:5,VALIDATION_ERROR:6,VALID:7,IMPORTED:8,EXPLODED:9,AWAITINGPROCESSING:10};
CSV_DATATYPE={TEXT:1,STATIC:2,LIST:3,RECORD:4};
CSV_FIELD_LOCATION={MAIN:1,ADDRESSBOOK:2};

GENERICREPLY = function(obj) { this.returnStatus = GENERICREPLY.RETURNSTATUS.WARNING; this.returnMessages = new Array(); this.returnPayload = null; for ( var prop in obj) { this[prop] = obj[prop]; } };
GENERICREPLY.prototype.isSuccess = function() { return this.returnStatus == GENERICREPLY.RETURNSTATUS.SUCCESS; };
GENERICREPLY.prototype.isWarning = function() { return this.returnStatus == GENERICREPLY.RETURNSTATUS.WARNING; };
GENERICREPLY.prototype.isError = function() { return this.returnStatus == GENERICREPLY.RETURNSTATUS.ERROR; };
GENERICREPLY.prototype.setStatusSuccess = function() { this.returnStatus = GENERICREPLY.RETURNSTATUS.SUCCESS; };
GENERICREPLY.prototype.setStatusWarning = function() { this.returnStatus = GENERICREPLY.RETURNSTATUS.WARNING; };
GENERICREPLY.prototype.setStatusError = function() { this.returnStatus = GENERICREPLY.RETURNSTATUS.ERROR; };
GENERICREPLY.prototype.getMessages = function() { return this.returnMessages; };
GENERICREPLY.prototype.addMessage = function(code, message) { this.returnMessages.push({ 'code' : code, 'message' : message }); };
GENERICREPLY.prototype.setReturnPayload = function(payload) { this.returnPayload = payload; };
GENERICREPLY.prototype.getReturnPayload = function() { return this.returnPayload; };
GENERICREPLY.RETURNSTATUS = { SUCCESS : "Success", ERROR : "Error", WARNING : "Warning" };

SIT_MAP_API={
	isEmpty:function(_string){return(_string==null||_string=='');}
};
SITOBJ_CUSTOM_LIST=function(internalid,listName,alphaOrder){
	this.listName=listName;
	this.internalid=internalid;
	this.alphaOrder=alphaOrder;
	this.list=[];
	this.count=function() {
		return this.list.length;
	};
	this.isValidName=function(itemName) {
		var item = this.getItemByName(itemName);
//		nlapiLogExecution('DEBUG','SITOBJ_CUSTOM_LIST|isValidName|'+itemName,JSON.stringify(item));
		return (item!=null && item.name==itemName);
	};
	this.getItemByName=function(itemName) {
		for(var item in this.list) {
//			nlapiLogExecution('DEBUG','SITOBJ_CUSTOM_LIST|getItemByInternalid|'+JSON.stringify(this.list[item]),itemName);
			if(itemName==this.list[item].name) {
				return this.list[item];
			}
		}
		return null;
	};
	this.getItemByInternalid=function(internalid) {
		for(var item in this.list) {
//			nlapiLogExecution('DEBUG','SITOBJ_CUSTOM_LIST|getItemByInternalid|'+JSON.stringify(this.list[item]),internalid);
			if(internalid==this.list[item].internalid) {
				return this.list[item];
			}
		}
		return null;
	};
	this.getItemNames=function(internalid) {
		var n=[];
		for(var item in this.list) {
			n.push(this.list[item].name);
		}
		return n;
	};
	this.addListValue=function(internalid,name) {
		this.list.push(new SITOBJ_CUSTOM_LIST_VALUE(internalid,name));
	};
};
SITOBJ_CUSTOM_LIST_VALUE=function(internalid,name){
	this.internalid=internalid;
	this.name=name;
};

JOB_PROFILE_LIST=function(){
	this.JOB_PREFIX='job_';
	this.STEP_PREFIX='step_';
	this.jobs={};
};
JOB_PROFILE_LIST.prototype.addJob=function(jobId) {
	nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.addJob|START',new Date().getTime());
	if(!this.jobs.hasOwnProperty(this.JOB_PREFIX+jobId)) {
		this.jobs[this.JOB_PREFIX+jobId] = new JOB_PROFILE(jobId);
	}
	nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.addJob|END',new Date().getTime());
};
JOB_PROFILE_LIST.prototype.getJob=function(jobId) {
	for(var job in this.jobs) {
		if(this.jobs.hasOwnProperty(job) && job.replace(this.JOB_PREFIX,'')==jobId) {
			return this.jobs[job];
		}
	}
	return null;
};
JOB_PROFILE_LIST.prototype.processData=function(jobId,batchLineData) {
	var startTime = new Date().getTime();
	nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.processData|START|'+batchLineData.getId(),startTime);
	nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.processData|BEFORE|'+batchLineData.getId(),nlapiGetContext().getRemainingUsage());
	var processed = this.getJob(jobId).processJobLineData(batchLineData);
	var endTime = new Date().getTime();
	nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.processData|END|'+batchLineData.getId(),endTime);
	nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.processData|Total|'+batchLineData.getId(),endTime-startTime);
	nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.processData|AFTER|'+batchLineData.getId(),nlapiGetContext().getRemainingUsage());
	return processed;
};
JOB_PROFILE_LIST.prototype.dependencyCheck=function(jobId,batchRec) {
	if(jobId==null||jobId=='') { throw nlapiCreateError('MISSING JOB Id', 'Unable to to run Dependcy Check for Job Process InternalId '+jobId, false);}
	if(batchRec==null||batchRec=='') { throw nlapiCreateError('MISSING BATCH RECORD', 'Unable to to run Dependcy Check for Job Process InternalId '+jobId, false);}
	var fe = [["custrecord_si_import_job_prit_process", "anyof", [jobId]],"AND",["custrecord_si_import_job_prit_mappro.custrecord_si_import_job_map_dependfield", "isnotempty",null]];
	var cols = [new nlobjSearchColumn('custrecord_si_import_job_map_rectype','custrecord_si_import_job_prit_mappro'),new nlobjSearchColumn('custrecord_si_import_job_map_recordfield','custrecord_si_import_job_prit_mappro'),new nlobjSearchColumn('custrecord_si_import_job_map_dependfield', 'custrecord_si_import_job_prit_mappro')];
//	custrecord_si_import_job_map_rectype,CUSTRECORD_SI_IMPORT_JOB_PRIT_MAPPRO
	var dependencySteps = nlapiSearchRecord('customrecord_si_import_job_process_item', null,fe,cols);
	var depend = {KEY:'key_',list:{}};
	for(var dsLoop=0;dependencySteps != null && dsLoop<dependencySteps.length;dsLoop++) {
		var recType = dependencySteps[dsLoop].getValue(new nlobjSearchColumn('custrecord_si_import_job_map_rectype','custrecord_si_import_job_prit_mappro'));
		var recField = dependencySteps[dsLoop].getValue(new nlobjSearchColumn('custrecord_si_import_job_map_recordfield','custrecord_si_import_job_prit_mappro'));
		var dependencyFields = dependencySteps[dsLoop].getValue(new nlobjSearchColumn('custrecord_si_import_job_map_dependfield','custrecord_si_import_job_prit_mappro'));
		var groups = dependencyFields.split(',');
		var feLoop=[['custrecord_si_csv_ibl_batch','anyof',[batchRec.getId()]]];
		var colLoop=[];
		for(var gName in groups) {
			colLoop.push(new nlobjSearchColumn(groups[gName], null, 'group'));
		}
		var parentCol = new nlobjSearchColumn('internalid', null, 'min');
		colLoop.push(parentCol);
		var childrenCol = new nlobjSearchColumn('formulatext', null, 'max');
		childrenCol.setFormula('NS_CONCAT({internalid})');
		colLoop.push(childrenCol);
		var subResults=nlapiSearchRecord('customrecord_si_csv_import_batch_line',null,feLoop,colLoop);
		for(var rlLoop=0;subResults != null && rlLoop<subResults.length;rlLoop++) {
			var result = subResults[rlLoop];
			var parentId = result.getValue(parentCol);
			var childrenIds = result.getValue(childrenCol);
			var childrenArray = childrenIds.split(',');
			for(var ca in childrenArray) {
				var childId = childrenArray[ca];
				if(childId==parentId) {continue;}
				if(!depend.list.hasOwnProperty(depend.KEY+childId)) {
					depend.list[depend.KEY+childId]={};
				}
				if(!depend.list[depend.KEY+childId].hasOwnProperty(recField)) {
					depend.list[depend.KEY+childId][recField]=parentId;
				}
			}
		}
	}
	var lineCount = batchRec.getLineItemCount('recmachcustrecord_si_csv_ibl_batch');
	for(var lLoop = 1; lineCount!=null && lLoop<=lineCount; lLoop++) {
		batchRec.setLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_dependencies', lLoop, ''); /* clears all previous dependencies */
	}
	for(var item in depend.list) {
		var itemId = item.replace(depend.KEY,'');
		var lineIndex = batchRec.findLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'id', itemId);
		nlapiLogExecution('DEBUG','JOB_PROFILE_LIST.dependencyCheck','itemId : ' + itemId);
		nlapiLogExecution('DEBUG','JOB_PROFILE_LIST.dependencyCheck','depend.list[item]: ' + JSON.stringify(depend.list[item]));
		nlapiLogExecution('DEBUG','JOB_PROFILE_LIST.dependencyCheck','lineIndex: ' + lineIndex);
		batchRec.setLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_dependencies', lineIndex, JSON.stringify(depend.list[item]));
	}
	return nlapiSubmitRecord(batchRec, true, true);
};

JOB_PROFILE=function(jobId){
	this.internalid=jobId;
	this.JOB_PREFIX='job_';
	this.STEP_PREFIX='step_';
	this.steps={};
	this.results={};
	this.currentStepId=null;
	
	var jobprofile = nlapiLoadRecord('customrecord_si_import_job_process',jobId);
	var lineCount = jobprofile.getLineItemCount('recmachcustrecord_si_import_job_prit_process');
	for(var lLoop=1;lineCount != null && lLoop<=lineCount;lLoop++) {
		var mapProfileId = jobprofile.getLineItemValue('recmachcustrecord_si_import_job_prit_process', 'custrecord_si_import_job_prit_mappro', lLoop);
		var mapLineId = jobprofile.getLineItemValue('recmachcustrecord_si_import_job_prit_process', 'id', lLoop);
		this.steps[this.STEP_PREFIX+mapLineId]=new JOB_STEP(mapProfileId,lLoop);
	}
};
JOB_PROFILE.prototype.findStep=function(stepId) {
	for(var step in this.steps) {
		if(this.steps.hasOwnProperty(step) && step.replace(this.STEP_PREFIX,'')==stepId) {
			return this.steps[step];
		}
	}
	return null;
};
JOB_PROFILE.prototype.findNextStep=function() {
	var foundCurrentStep=false;
	var stepOrder = this.stepOrder();
	for(var stepId in stepOrder) {
		if(this.steps.hasOwnProperty(this.STEP_PREFIX+stepId) && stepId==this.currentStepId) {
			foundCurrentStep=true;
		} else if(foundCurrentStep) {
			return stepOrder[stepId];
		}
	}
	return null;
};
JOB_PROFILE.prototype.stepOrder=function() {
	var order = [];
	for(var s in this.steps) {
		if(this.steps.hasOwnProperty(s)) {
			var step = this.steps[s];
			var stepId = step.stepid.replace(this.STEP_PREFIX,'');
			if(!isNaN(stepId)) {
				order[step.order] = s.replace(this.STEP_PREFIX,'');
			} else {
				nlapiLogExecution('ERROR', 'stepOrder', 'Unable to determine stepid from '+s);
				return null;
			}
		}
	}
	return order;
};

JOB_PROFILE.prototype.processJobLineData=function(batchLineData) {
	var storedStep = batchLineData.getFieldValue('custrecord_si_csv_ibl_current_step');
	var stepOrder = this.stepOrder();
	var currentStep = null;
	if(storedStep!=null && storedStep!='') {
		/* start from the storedStep if one exists */
		this.currentStepId=storedStep;
	}
	var stepStatus = CSV_BATCH_STATUS.PROCESSING;
	for(var step in stepOrder) {
		var stepId = stepOrder[step];
		if(this.currentStepId==null || this.currentStepId=='') {
			/* if this.currentStepId is null/empty, for the first step to be processed  */
			this.currentStepId=stepId;
		}
		if(this.currentStepId==stepId) {
			currentStep = this.findStep(this.currentStepId);
			if(currentStep!=null) {
				batchLineData.setFieldValue('custrecord_si_csv_ibl_current_step', this.currentStepId);
				var startTime = new Date().getTime();
				nlapiLogExecution('DEBUG', 'JOB_PROFILE.prototype.processJobLineData|START|'+batchLineData.getId(),startTime);
				nlapiLogExecution('DEBUG', 'JOB_PROFILE.prototype.processJobLineData|BEFORE|'+batchLineData.getId(),nlapiGetContext().getRemainingUsage());
				this.results[this.currentStepId] = currentStep.parseBatchLineData(batchLineData);
				var endTime = new Date().getTime();
				nlapiLogExecution('DEBUG', 'JOB_PROFILE.prototype.processJobLineData|END|'+batchLineData.getId(),endTime);
				nlapiLogExecution('DEBUG', 'JOB_PROFILE.prototype.processJobLineData|Total|'+batchLineData.getId(),endTime-startTime);
				nlapiLogExecution('DEBUG', 'JOB_PROFILE_LIST.prototype.processData|AFTER|'+batchLineData.getId(),nlapiGetContext().getRemainingUsage());
				
				if(!this.results[this.currentStepId].hasOwnProperty('internalid')) {
					stepStatus=CSV_BATCH_STATUS.VALIDATION_ERROR;
					break;
				} else {
					batchLineData.setFieldValue(currentStep.field, this.results[this.currentStepId].internalid);
				}
				this.currentStepId = this.findNextStep();
			}
		}
	}
	if(stepStatus==CSV_BATCH_STATUS.PROCESSING) {
		stepStatus=CSV_BATCH_STATUS.COMPLETE;
	}
	batchLineData.setFieldValue('custrecord_si_csv_ibl_validate_onsave', 'F');
	batchLineData.setFieldValue('custrecord_si_csv_ibl_status', stepStatus);
	//TODO: SRS 5/11/2015 this.results has previous lines data if there is an error before it stomps over top of the existing data.
	// this needs to be gracefully fixed.  If the data was pre-existing and belongs to the current line than keep it, otherwise it needs to be cleared.
	batchLineData.setFieldValue('custrecord_si_csv_ibl_results', JSON.stringify(this.results));
	nlapiSubmitRecord(batchLineData, true, true);
};

JOB_STEP=function(stepid,order){
	this.stepid=stepid;
	this.order=order;
	this.map=siapiGenerateMapProfile(stepid);;
	this.field=this.map.field;
	this.recordtype=this.map.recordtype.internalid;
	this.internalid=null;
	this.results=[];
};
JOB_STEP.prototype.parseBatchLineData=function(batchLineData) {
	var dataObj = {};
	var dependencies = null;
	try {
		dependencies = JSON.parse(batchLineData.getFieldValue('custrecord_si_csv_ibl_dependencies'));
	} catch(e) {
		nlapiLogExecution('DEBUG','parseBatchLineData',e);
	}
	if(batchLineData.getFieldValue(this.field) != null && batchLineData.getFieldValue(this.field) != '') {
		/* Skip Step and use user selected value */
		nlapiLogExecution('ERROR', 'parseBatchLineData|Skip Step and use user selected value', '{"lineid":"'+batchLineData.getId()+'","fieldname":"'+this.field+'","fieldvalue":"'+batchLineData.getFieldValue(this.field)+'"}');
		validation = {recordtype:this.recordtype,internalid:batchLineData.getFieldValue(this.field)};
	} else if(dependencies != null && dependencies.hasOwnProperty(this.field)) {
		/* Skip Step and dependency field value */
		/* if value is not present on the dependency field, then throw an error that a required dependency is not completed yet. */
		var dependId = nlapiLookupField('customrecord_si_csv_import_batch_line', dependencies[this.field], this.field);
		if(dependId == null || dependId == '') {
			validation=[{field:'dependency_not_met',message:'Dependency on field '+this.field+' was not met by line id '+dependencies[this.field]}];
		} else {
			this.internalid = dependId;
			validation = {recordtype:this.recordtype,internalid:this.internalid};
		}
	} else {
		for(var ln in this.map.lines) {
			var curHeader = this.map.lines[ln];
			var headerName = curHeader.headerName;
			var outputField = curHeader.mappedField;
			var lineFields = batchLineData.getFieldValue(headerName);
			if(headerName=='static') {
				lineFields=curHeader.staticData;
			}
			if(lineFields!=null) {
				lineFields.replace(/^"/,'').replace(/"$/,'');
			}
			if(lineFields!=null && lineFields!='' && lineFields.trim()!='') {
				if(curHeader.hasOwnProperty('listRecord') && curHeader.listRecord != null) {
					curHeader.listRecord.dataValue=lineFields;
				}
				var data = {value:lineFields,validate:curHeader.validate,dataType:curHeader.dataType,listRecord:curHeader.listRecord,fieldLocation:curHeader.fieldLocation};
				if(!dataObj.hasOwnProperty(curHeader.fieldLocation)) { dataObj[curHeader.fieldLocation]={}; }
				dataObj[curHeader.fieldLocation][outputField]=data;
			}
		}
		var rec = nlapiCreateRecord(this.recordtype);
		for(var prop in dataObj) {
			if(prop==CSV_FIELD_LOCATION.MAIN) {
				for(var vn in dataObj[prop]) {
					var propObj = dataObj[prop][vn];
					if(propObj.dataType == null){continue;}
					if(propObj.dataType.internalid==CSV_DATATYPE.RECORD || propObj.dataType.internalid==CSV_DATATYPE.LIST) {
						nlapiLogExecution('DEBUG', vn, propObj.listRecord);
						var lookupValue = siapiLookupListRecord(propObj.listRecord);
						nlapiLogExecution('DEBUG', vn, lookupValue);
						if(lookupValue!=null) {
							rec.setFieldValue(vn, lookupValue);
						}
					} else {
						rec.setFieldValue(vn, propObj.value);
					}
				}
			} else if(prop==CSV_FIELD_LOCATION.ADDRESSBOOK) {
				rec.selectNewLineItem('addressbook');
				var subRec = rec.createCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
				for(var vn in dataObj[prop]) {
					var propObj = dataObj[prop][vn];
					if(propObj.dataType == null){continue;}
					if(propObj.dataType.internalid==CSV_DATATYPE.RECORD || propObj.dataType.internalid==CSV_DATATYPE.LIST) {
						nlapiLogExecution('DEBUG', vn, propObj.listRecord);
						var lookupValue = siapiLookupListRecord(propObj.listRecord);
						nlapiLogExecution('DEBUG', vn, lookupValue);
						if(lookupValue!=null) {
							rec.setFieldValue(vn, lookupValue);
							subRec.setFieldValue(vn, lookupValue);
						}
					} else {
						nlapiLogExecution('DEBUG', vn, propObj.value);
						rec.setFieldValue(vn, propObj.value);
						subRec.setFieldValue(vn, propObj.value);
					}
				}
				subRec.commit();
			    rec.commitLineItem('addressbook');
			} else {
				nlapiLogExecution('DEBUG', prop, JSON.stringify(dataObj[prop]));
			}
		}
		try {
			this.internalid = nlapiSubmitRecord(rec, true, true);
			validation = {recordtype:this.recordtype,internalid:this.internalid};
		} catch(e) {
			var err = e;
			nlapiLogExecution('ERROR', 'parseBatchLineData|batchLineData', JSON.stringify(batchLineData));
			nlapiLogExecution('ERROR', 'parseBatchLineData|rec', JSON.stringify(rec));
			nlapiLogExecution('ERROR', 'parseBatchLineData|err', err);
			validation=[{field:'netsuite_record',message:JSON.stringify(e)}];
		}
	}
	return validation;
};

VALIDATION_ERROR=function(obj){this.message=null;this.type=null;this.field=null;for(var prop in obj){this[prop]=obj[prop];}};
VALIDATION_ERROR.prototype.AddError=function(fieldId,msg) {
	this.field=fieldId;
	this.message=msg;
	return this;
};

function isEmpty(_value) { return (_value==undefined||_value==null||_value==''||(typeof _value == 'string'&&_value.trim()==''));}

/*******************************************************************************
 * Creates a File in the Folder and fileText specified
 * @param {String} folderId
 * @param {String} fileName
 * @param {String} fileText
 * @returns - InternalId of the newly created file.
 */
function siapiCreateFileBackup(folderId, file, fileName, fileText, fileType) {
	try {
		if(fileName != null && fileName != '' && fileText != null && fileText != '' && fileType != null && fileType != '') {
			file = nlapiCreateFile(fileName, fileType, fileText);
		}
		file.setName(new Date().getTime()+'_'+file.getName()+'.txt');
		file.setFolder(folderId);
		file.setEncoding('UTF-8');
		return nlapiSubmitFile(file);
	} catch (e) { nlapiLogExecution('ERROR', 'siapiCreateFileBackup', e); }
	return null;
}

function siapiCoreMakeDailyFolder() {
	var parentFolderId=-15; /* if problem occurs with folder, fall back to the Native SuiteScript -15 folder */
	try {
		parentFolderId = nlapiGetContext().getSetting('SCRIPT', 'custscript_sit_s_csv_import_folder');
	} catch(e) {
		parentFolderId=-15; /* if problem occurs with folder, fall back to the Native SuiteScript -15 folder */
	}
	if(parentFolderId==null || parentFolderId=='') {
		parentFolderId=-15; /* if problem occurs with folder, fall back to the Native SuiteScript -15 folder */
	}
	var today = nlapiDateToString(new Date());
	try {
		/* 2 points to create folder */
		var folder = nlapiCreateRecord('folder');
		folder.setFieldValue('parent', parentFolderId);
		folder.setFieldValue('name', today);
		/* 4 points to submit folder */
		return nlapiSubmitRecord(folder);
	} catch (e) {
		var filters = new Array();
		filters .push(new nlobjSearchFilter('parent', null, 'is', parentFolderId));
		filters.push(new nlobjSearchFilter('name', null, 'is', today));
		/* 10 points to search for folder */
		var results = nlapiSearchRecord('folder', null, filters);
		return (results != null) ? results[0].getId() : null;
	}
};

function siapiRescheduleIfNeeded(script, paramObj) {
	try {
		var filterArr = [new nlobjSearchFilter('scriptid', 'script', 'is', script[0].scriptId), new nlobjSearchFilter('status', null, 'anyof' , ['PENDING'])];
		var colArr = [new nlobjSearchColumn('name', 'script'), new nlobjSearchColumn('internalid', 'scriptdeployment')];
		var searchResults =  nlapiSearchRecord('scheduledscriptinstance', null, filterArr, colArr);
		if(searchResults != null && searchResults.length > 0) {
			return;
		} else {
			for(var sLoop=0; script!= null && sLoop<script.length;sLoop++) {
				var status = nlapiScheduleScript(script[sLoop].scriptId, script[sLoop].deployId, paramObj);
				nlapiLogExecution('DEBUG', 'siapiRescheduleIfNeeded', status+' Script ' + script[sLoop].scriptId + ' with deployement '+ script[sLoop].deployId);
				if(status == 'QUEUED') { return; }
			}
		}
	} catch(e) { var err = e; nlapiLogExecution('ERROR', 'err', err); }
}

function siapiCheckBatchReset(resetUsageAmount, params) {
//	nlapiLogExecution('DEBUG', 'siapiCheckBatchReset', 'START|'+new Date().getTime());
	var context = nlapiGetContext();
	var remaining = context.getRemainingUsage();
	if(remaining < resetUsageAmount) {
		var state = nlapiYieldScript();
		if(state.status == 'FAILURE') {
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} else if(state.status == 'RESUME') {
			nlapiLogExecution("DEBUG", state.status+" script because of " + state.reason+".  Size = "+ state.size);
		} else {
			nlapiLogExecution("DEBUG", state.status+" script because of " + state.reason+".  Size = "+ state.size);
		}
		nlapiLogExecution('DEBUG', 'siapiCheckBatchReset', 'END|'+new Date().getTime());
		return true;
	}
//	nlapiLogExecution('DEBUG', 'siapiCheckBatchReset', 'END|'+new Date().getTime());
	return false;
};

function siapiFetchImportBatches() {
	nlapiLogExecution('DEBUG', 'siapiFetchImportBatches', 'START|'+new Date().getTime());
	/* 10 points to search batch records needing processing */
	try {
		var filters = [
		               new nlobjSearchFilter('isinactive', null, 'is', 'F'),
		               new nlobjSearchFilter('custrecord_si_csv_import_batch_status', null, 'anyof', [CSV_BATCH_STATUS.IMPORTED]),
		               new nlobjSearchFilter('custrecord_si_csv_import_batch_file', null, 'isnotempty', null)
		               ];
		var columns = [
		               new nlobjSearchColumn('custrecord_si_csv_import_batch_status').setSort(true),
		               new nlobjSearchColumn('custrecord_si_csv_import_batch_map'),
		               new nlobjSearchColumn('custrecord_si_csv_import_batch_import')
		               ];
		nlapiLogExecution('DEBUG', 'siapiFetchImportBatches', 'END|'+new Date().getTime());
		return nlapiSearchRecord('customrecord_si_csv_import_batch', null, filters, columns);
	} catch (err) {
		nlapiLogExecution('ERROR', 'siapiFetchImportBatches', 'ERROR|'+new Date().getTime());
		nlapiLogExecution('ERROR', 'siapiFetchImportBatches', err);
		return null;
	}
}

function siapiFetchValidJobLineRecords(_batchId) {
	nlapiLogExecution('DEBUG','siapiFetchValidJobLineRecords',new Date().getTime());
	var fe = [['custrecord_si_csv_ibl_status','anyof',CSV_BATCH_STATUS.VALID],'AND',['isinactive','is','F']];
	var col = [
			   new nlobjSearchColumn('custrecord_si_csv_ibl_batch').setSort(),
	           new nlobjSearchColumn('internalid').setSort(),
	           new nlobjSearchColumn('custrecord_si_csv_import_batch_map','custrecord_si_csv_ibl_batch')
	           ];
	if(_batchId != null && _batchId != '' && !isNaN(_batchId)) {
		fe.push('AND',['custrecord_si_csv_ibl_batch','anyof',[].concat(_batchId)]);
	} else {
//		fe.push('AND',['custrecord_si_csv_ibl_batch','noneof','@NONE@']);
//		fe.push('AND',['custrecord_si_csv_ibl_batch.custrecord_si_csv_import_batch_status','anyof',CSV_BATCH_STATUS.AWAITINGPROCESSING]);
		throw nlapiCreateError('MISSING JOB Id','Unable to to process Job without Job Id',false);
	}
	nlapiLogExecution('DEBUG','siapiFetchValidJobLineRecords|fe',JSON.stringify(fe));
	var results = nlapiSearchRecord('customrecord_si_csv_import_batch_line',null,fe,col);
	nlapiLogExecution('DEBUG','siapiFetchValidJobLineRecords',new Date().getTime());
	return results;
}

function siapiParseCSVHeaders(_data) { return {data:_data.split(','),findIndex:function (_name) { for(var d in this.data) { if(this.data[d]==_name) {return d;} } return null; }};}

function siapiGenerateMapProfile(_profileId) {
	try {
		nlapiLogExecution('DEBUG', 'siapiGenerateMapProfile|'+_profileId, 'START|'+new Date().getTime());
		var mapProfile = nlapiLoadRecord('customrecord_si_csv_import_batch_map', _profileId);
		var map = {
			recordtype:{internalid:mapProfile.getFieldValue('custrecord_si_import_job_map_rectype')},
			field:mapProfile.getFieldValue('custrecord_si_import_job_map_recordfield'),
			dependencies:mapProfile.getFieldValue('custrecord_si_import_job_map_dependfield'),
			lines:[]
		};
		var lineCount = mapProfile.getLineItemCount('recmachcustrecord_si_csv_ibml_map');
		nlapiLogExecution('DEBUG', 'siapiGenerateMapProfile', 'lineCount|'+lineCount);
		for(var lLoop=1;lineCount!= null && lLoop <= lineCount;lLoop++) {
			var lineId = mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'id', lLoop);
			var headerName = mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_iff', lLoop);
			var mappedField = mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_nsf', lLoop);
			var valFunction = mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_validations', lLoop);
			var staticData = mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_static_data', lLoop);
			var fieldLocation = mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_field_location', lLoop);
			var dataType = {internalid:mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_data_type', lLoop),name:mapProfile.getLineItemText('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_data_type', lLoop)};
			var listRecord = null;
			try {
				listRecord = JSON.parse(mapProfile.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_data_list_record', lLoop));
			} catch(e) {
				nlapiLogExecution('ERROR', 'siapiGenerateMapProfile|parseListRecord', e);
			}
			var validate = function () { return true; };
			if(valFunction != null && valFunction != '') {
				var valfun = valFunction.replace(new RegExp(String.fromCharCode(5),'gm'),'').replace(/[\r\n]/g,'');
				validate = eval(valfun); 
			}
			map.lines.push({lineId:lineId,headerName:headerName,mappedField:mappedField,validate:validate,staticData:staticData,dataType:dataType,listRecord:listRecord,fieldLocation:fieldLocation});
		}
		nlapiLogExecution('DEBUG', 'siapiGenerateMapProfile', 'END|'+new Date().getTime());
		return map;
	} catch(e) {
		nlapiLogExecution('ERROR', 'siapiGenerateMapProfile|ERROR', valfun);
		nlapiLogExecution('ERROR', 'siapiGenerateMapProfile', 'ERROR|'+new Date().getTime());
		nlapiLogExecution('ERROR', 'siapiGenerateMapProfile', e);
		return null;
	}
}

function siapiValidateJobLineRecord(mapProfileId,rec) {
	var validation = null;
	var dataObj = {};
	var mapHeaders = siapiGenerateMapProfile(mapProfileId); //TODO:(12/10/2014-SRS) need to lookup the import map id
	for(var ln in mapHeaders.lines) {
		var curHeader = mapHeaders.lines[ln];
		var outputField = curHeader.mappedField;
		var lineFields = rec.getFieldValue(curHeader.mappedField);
		if(lineFields!=null && lineFields!='') {
			lineFields = lineFields.replace(/^"/,'').replace(/"$/,'');
		}
		dataObj[outputField] = {value:lineFields,validate:curHeader.validate};
	}
	dataObj['custrecord_si_csv_ibl_customer_rec'] = {value:rec.getFieldValue('custrecord_si_csv_ibl_customer_rec'),validate:true};
	dataObj['custrecord_si_csv_ibl_contact_rec'] = {value:rec.getFieldValue('custrecord_si_csv_ibl_contact_rec'),validate:true};
	dataObj['custrecord_si_csv_ibl_exchange_hash'] = {value:rec.getFieldValue('custrecord_si_csv_ibl_exchange_hash'),validate:true};
	dataObj['custrecord_si_csv_ibl_exchange_rec'] = {value:rec.getFieldValue('custrecord_si_csv_ibl_exchange_rec'),validate:true};
	dataObj['custrecord_si_csv_ibl_lot_cert_rec'] = {value:rec.getFieldValue('custrecord_si_csv_ibl_lot_cert_rec'),validate:true};
	
	nlapiLogExecution('DEBUG','dataObj',JSON.stringify(dataObj));
	for(var vn in dataObj) {
		var header = dataObj[vn];
		if(typeof header.validate == 'function') {
			var validationResults = header.validate(vn,dataObj);
			if(validationResults != true) {
				nlapiLogExecution('DEBUG','validationResults',vn+'|'+JSON.stringify(validationResults));
			}
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

function siapiLoadCustomList(listId) {
	try {
		var results = nlapiSearchRecord(listId, null, null, [new nlobjSearchColumn('name'),new nlobjSearchColumn('internalId')]);
		var customList = new SITOBJ_CUSTOM_LIST(listId,'LOT Certificate Line Status',false);
		for(var rLoop = 0;results != null && rLoop < results.length;rLoop++) {
			customList.addListValue(results[rLoop].getValue('internalId'),results[rLoop].getValue('name'));
		}
		return customList;
	} catch(e) {
		nlapiLogExecution('ERROR', 'siapiLoadCustomList|ERROR', e);
		return null;
	}
}

function siapiLookupListRecord(listRecord) {
	try {
		var results = nlapiSearchRecord(listRecord.id, null, [listRecord.lookupField,'is',listRecord.dataValue], [new nlobjSearchColumn(listRecord.returnField)]);
		if(results!=null && results.length==1) {
			return results[0].getValue(listRecord.returnField);
		} else if(results!=null && results.length > 1) {
			nlapiLogExecution('ERROR', 'siapiLookupListRecord|Multiple Matches', JSON.stringify(listRecord));
			return null;
		} else {
			nlapiLogExecution('ERROR', 'siapiLookupListRecord|No Matches', JSON.stringify(listRecord));
			return null;
		}
	} catch(e) {
		nlapiLogExecution('ERROR', 'siapiLookupListRecord|ERROR', e);
		return null;
	}
}

function siapiCSVDependencyCheck(batchId) {
	var batchRec = nlapiLoadRecord('customrecord_si_csv_import_batch', batchId);
	var jobProfileId = batchRec.getFieldValue('custrecord_si_csv_import_batch_map');
	var jobProfiles = new JOB_PROFILE_LIST();
	try {
		nlapiLogExecution('DEBUG','siapiCSVDependencyCheck',batchId);
		jobProfiles.dependencyCheck(jobProfileId,batchRec);
	}catch(e) {
		nlapiLogExecution('ERROR', 'siapiCSVDependencyCheck', e);
	}
}

function setRecoveryPoint() {
	var state = nlapiSetRecoveryPoint(); //100 point governance
	nlapiLogExecution("ERROR","state",JSON.stringify(state));
	if(state.status == 'SUCCESS') return;  //we successfully create a new recovery point
	if(state.status == 'RESUME') { //a recovery point was previously set, we are resuming due to some unforeseen error
		nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		handleScriptRecovery();
	} else if(state.status == 'FAILURE') {  //we failed to create a new recovery point
		nlapiLogExecution("ERROR","Failed to create recovery point. Reason = "+state.reason + " / Size = "+ state.size);
		handleRecoveryFailure(state);
	}
}
 
function checkGovernance(myGovernanceThreshold) {
	var context = nlapiGetContext();
	if(context.getRemainingUsage() < myGovernanceThreshold) {
		var state = nlapiYieldScript();
		if(state.status == 'FAILURE') {
			nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			throw "Failed to yield script";
		} else if(state.status == 'RESUME') {
			nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		}
		// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	}
}
 
function handleRecoverFailure(failure) {
	if(failure.reason == 'SS_MAJOR_RELEASE') { throw "Major Update of NetSuite in progress, shutting down all processes"; }
	if(failure.reason == 'SS_CANCELLED') { throw "Script Cancelled due to UI interaction"; }
	if(failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT') { cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
	if(failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE') { throw "Could not set recovery point because of a reference to a non-recoverable object: "+ failure.information; } 
}
 
function cleanUpMemory(){
	nlapiLogExecution("AUDIT", "cleanUpMemory","cleanUpMemory");
	//...set references to null, dump values seen in maps, etc
}

function checkScheduledGovernance(_governanceThreshold){
	 var context = nlapiGetContext();
	 if( context.getRemainingUsage() <= _governanceThreshold ) {
		  nlapiLogExecution('ERROR', 'checkScheduledGovernance', 'Should YIELD NOW!, Governance below: ' + _governanceThreshold);
		  var state = nlapiYieldScript();
		  if( state.status == 'FAILURE') {
			  nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
			  throw "Failed to yield script";
		  } 
		  else if ( state.status == 'RESUME' )  {
			  nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		  }
	 }
	 return false;
}

function generateSelectDropDown(ddId,ddType,ddDefaultField,ddInsertPoint,mandatory) {
	try {
		var ddField = form.addField(ddId,'select','');
		if(mandatory==true) {
			ddField.setMandatory(mandatory);
		}
		var nameCol = new nlobjSearchColumn('name');
		var results = nlapiSearchRecord(ddType,null,[['isinactive','is','F']],[nameCol]);
		ddField.addSelectOption('','');
		for(var rL=0;results != null && rL<results.length;rL++) {
			ddField.addSelectOption(results[rL].getValue(nameCol),results[rL].getValue(nameCol));
		}
		ddField.setDefaultValue(nlapiGetFieldValue(ddDefaultField));
		form.insertField(ddField,ddInsertPoint);
		nlapiGetField(ddDefaultField).setDisplayType('disabled');
	} catch(e) {
		
	}
}

function sitScheduleScript(scriptId,params) {
	var startTime = new Date().getTime();
	nlapiLogExecution('AUDIT','sitScheduleBatch|START',startTime);
	nlapiLogExecution('DEBUG','sitScheduleBatch|scriptId,params',scriptId+'|'+JSON.stringify(params));
	var status = null;
	var prevDeploy = null;
	do {
		if(prevDeploy != null) {
			prevDeploy = [].concat(prevDeploy);
		}
		var scriptDeploy = sitFindNextAvailableScheduledScript(scriptId,prevDeploy);
		nlapiLogExecution('AUDIT','sitScheduleBatch|scriptDeploy',scriptDeploy);
		if(scriptDeploy == null) {
			scriptDeploy = sitGenerateScriptDeployment(scriptId,params);
		}
		status = nlapiScheduleScript(scriptId,scriptDeploy,params);
	}
	while(status != 'QUEUED');
		
	var endTime = new Date().getTime();
	nlapiLogExecution('AUDIT','sitScheduleBatch|END',endTime);
	nlapiLogExecution('AUDIT','sitScheduleBatch|TOTAL',endTime-startTime);
}

function sitFindScheduledScriptsRunning(scriptId) {
	var fe = [['script.scriptid','is',scriptId],'AND',['status','anyof',['PENDING','PROCESSING','RETRY']]];
	var sc = [new nlobjSearchColumn('name', 'script','group'), new nlobjSearchColumn('internalid', 'scriptdeployment','group').setSort()];
	var results =  nlapiSearchRecord('scheduledscriptinstance', null, fe, sc);
	var running = [];
	for(var rl=0; results != null && rl<results.length;rl++) {
		running.push(results[rl].getValue(new nlobjSearchColumn('internalid','scriptdeployment','group')));
	}
	return running;
}

function sitFindScriptInternalId(scriptId) {
	var fe = [["scriptid","is",scriptId]];
	var results = nlapiSearchRecord('script',null,fe);
	if(results != null && results.length>0) {
		return results[0].getId(); 
	} else {
		return null;
	}
}

function sitFindRecordInternalId(recordId) {
	var fe = [["scriptid","is",recordId]];
	var results = nlapiSearchRecord('customrecordtype',null,fe);
	if(results != null && results.length>0) {
		return results[0].getId(); 
	} else {
		return null;
	}
}

function sitFindNextAvailableScheduledScript(scriptId) {
	var fe = [["script.scriptid","is",scriptId],"AND",["status", "anyof", "NOTSCHEDULED"],"AND",["isdeployed","is","T"]];
	var currentlyRunning = sitFindScheduledScriptsRunning(scriptId);
	if(currentlyRunning != null && currentlyRunning.length> 0) {
		fe.push('AND',['internalid','noneof',[].concat(currentlyRunning)]);
	}
	var deployCol = new nlobjSearchColumn('scriptid',null,'min');
	var results =  nlapiSearchRecord('scriptdeployment',null,fe,deployCol);
	if(results != null && results.length>0) {
		var deployId = results[0].getValue(deployCol);
		if(deployId != null && deployId != '') {
			nlapiLogExecution('DEBUG','sitGenerateScriptDeployment|deployId|'+deployId,deployId);
			return deployId;
		} else {
			return null; 
		}
	} else {
		return null;
	}
}

function sitGenerateScriptDeployment(scriptId,params) {
	if(isNaN(scriptId)) {
		scriptId = sitFindScriptInternalId(scriptId);
	}
	nlapiLogExecution('AUDIT','sitGenerateScriptDeployment|scriptId',scriptId);
	if(scriptId == null) { return null; }
	var deployRec = nlapiCreateRecord('scriptdeployment', {'script':scriptId});
	deployRec.setFieldValue('scripttype',scriptId);
	deployRec.setFieldValue('startdate',nlapiDateToString(new Date()));
	//TODO: (8/26/2015-SRS) - Allow support for storing script params on deployment.
	return nlapiSubmitRecord(deployRec);
}