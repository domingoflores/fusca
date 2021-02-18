/*
*Summit IT Services LLC Copyright Notice
*
* Copyright © 2014 Summit IT Services LLC. All rights reserved. 
* This material may not be resold or redistributed without prior written 
* permission from Summit IT Services LLC. If you have any questions about
* these terms, please contact Summit IT Services LLC at +1 (970) 422-5022,
* or send email to admin@summitit.com.
*/

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function sit_csv_import_ui(request, response){
	if(request.getMethod()=='GET') {
		return processGetRequest(request, response);
	} else {
		return processPOSTRequest(request, response);
	}
}

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function processGetRequest(request, response) {
	var form = nlapiCreateForm('Custom CSV Import');
	var batchRec = nlapiCreateRecord('customrecord_si_csv_import_batch');
	var importMapSelect = batchRec.getField('custrecord_si_csv_import_batch_import');
	var importMapSelectOpts = importMapSelect.getSelectOptions();
	var import_map = form.addField('import_map', 'select', 'Import Map');
	for(var opt in importMapSelectOpts) {
		var _option = importMapSelectOpts[opt];
		import_map.addSelectOption(_option.getId(), _option.getText());
	}
	import_map.setLayoutType('outsidebelow');
	
	var sit_deal = form.addField('sit_deal', 'select', 'Deal', 'customer');
	sit_deal.setDisplayType('inline');
	sit_deal.setDefaultValue(request.getParameter('sit_deal'));
	var processField = form.addField('sit_process', 'select', 'Job Process', 'customrecord_si_import_job_process');
	processField.setMandatory(true);
	var sit_file = form.addField('sit_file', 'file', 'Upload CSV File');
	sit_file.setLayoutType('outsidebelow');
	form.addSubmitButton('Upload');
	return response.writePage(form);
}

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function processPOSTRequest(request, response) {
	var form = nlapiCreateForm('Custom CSV Import');
	var sit_file = request.getFile('sit_file');
	var fileId = siapiCreateFileBackup(siapiCoreMakeDailyFolder(), sit_file, null, null, 'PLAINTEXT');
	
	var batchFile = nlapiCreateRecord('customrecord_si_csv_import_batch');
	batchFile.setFieldValue('custrecord_si_csv_import_batch_deal', request.getParameter('sit_deal'));
	batchFile.setFieldValue('custrecord_si_csv_import_batch_status', CSV_BATCH_STATUS.IMPORTED);
	batchFile.setFieldValue('custrecord_si_csv_import_batch_file', fileId);
	batchFile.setFieldValue('custrecord_si_csv_import_batch_map', request.getParameter('sit_process'));
	batchFile.setFieldValue('custrecord_si_csv_import_batch_import', request.getParameter('import_map'));
	batchFile.setFieldValue('custrecord_si_csv_import_batch_user', nlapiGetContext().getUser());
	var batchId = nlapiSubmitRecord(batchFile, true, true);
	
	var scripts = [{ scriptId : 'customscript_sit_sched_csv_batch_explode', deployId : 'customdeploy_sit_sched_csv_batch_explod1' },{ scriptId : 'customscript_sit_sched_csv_batch_explode', deployId : 'customdeploysit_sched_csv_batch_explode2' }];
	siapiRescheduleIfNeeded(scripts);
	var htmlfield = form.addField('htmlfield', 'inlinehtml', '');
	var htmlString = '';
	htmlString += '<div>Your file has been submitted for import.</div>';
	var queueLink = nlapiResolveURL('RECORD', 'customrecord_si_csv_import_batch', batchId, 'VIEW');
	htmlString += '<div><a href="'+queueLink+'">Import Job Batch Record</a></div>';
	htmlfield.setDefaultValue(htmlString);
	return response.writePage(form);
}

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function sitsProcessJob(request, response) {
	var sit_recordtype = request.getParameter('sit_recordtype');
	var sit_recordid = request.getParameter('sit_recordid');
	nlapiLogExecution('ERROR', 'sitsProcessJob|sit_recordid',sit_recordid);
	nlapiLogExecution('DEBUG', 'sitsProcessJob','scheduling');
	sitScheduleScript('customscript_sit_sched_job_process',{custscript_sit_process_job_job_rec:sit_recordid});
	nlapiLogExecution('DEBUG', 'sitsProcessJob','scheduled');
	nlapiSubmitField(sit_recordtype, sit_recordid, 'custrecord_si_csv_import_batch_status', 10);
	response.sendRedirect('RECORD', sit_recordtype, sit_recordid, 'VIEW');
}

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function sitsExportJobLines(request, response) {
	var NEWLINE_CODE = '\r\n';
	var sit_recordid = request.getParameter('sit_recordid');
	var sit_allrecords = request.getParameter('sit_allrecords');
	var rec = nlapiLoadRecord('customrecord_si_csv_import_batch', sit_recordid);
	var mapProfileId = rec.getFieldValue('custrecord_si_csv_import_batch_import');
	var mapHeaders = siapiGenerateMapProfile(mapProfileId);
	var exportTxt = '';
	exportTxt += '"Job Line Id"';
	exportTxt += ',"Status"';
	exportTxt += ',"Vaildation Errors"';
	var mhCount=0;
	for(var ln in mapHeaders.lines) {
		var curHeader = mapHeaders.lines[ln];
		exportTxt += ',"'+curHeader.headerName+'"';
		mhCount++;
	}
	if(sit_allrecords == 'T') {
		exportTxt += ',"Shareholder Display"';
		exportTxt += ',"Shareholder Record"';
		exportTxt += ',"Contact Display"';
		exportTxt += ',"Contact Record"';
		exportTxt += ',"Exchange Hash Display"';
		exportTxt += ',"Exchange Hash Record"';
		exportTxt += ',"Exchange Display"';
		exportTxt += ',"Exchange Record"';
		exportTxt += ',"LOT Cert Display"';
		exportTxt += ',"LOT Certificate Record"';
	}
	exportTxt+=NEWLINE_CODE;
	var jlCount = rec.getLineItemCount('recmachcustrecord_si_csv_ibl_batch');
	for(var jlLoop=1;jlCount!= null && jlLoop<=jlCount;jlLoop++) {
		var status = rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_status', jlLoop);
		var status_display = rec.getLineItemText('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_status', jlLoop);
		nlapiLogExecution('DEBUG', 'sitsExportErrors|status',status);
		nlapiLogExecution('DEBUG', 'sitsExportErrors|sit_allrecords',sit_allrecords);
		if(sit_allrecords != 'T' && status!=CSV_BATCH_STATUS.VALIDATION_ERROR) { continue; }
		if(jlLoop>1){exportTxt+=NEWLINE_CODE;}
		nlapiLogExecution('DEBUG', 'sitsExportErrors|jlLoop',rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'id', jlLoop));
		exportTxt += rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'id', jlLoop);
		exportTxt += ',"'+status_display+'"';
		var valiResults = generateCSVValidationMessages(rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_results', jlLoop));
		if(valiResults==null) {
			valiResults='';
		}
		exportTxt += ','+valiResults+'';
		for(var ln in mapHeaders.lines) {
			var curHeader = mapHeaders.lines[ln];
			var fieldValue = rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', curHeader.mappedField, jlLoop);
			if(fieldValue==null) {fieldValue='';}
			exportTxt += ',"'+fieldValue+'"';
		}
		if(sit_allrecords == 'T') {
			exportTxt += ',"'+blankIfNull(rec.getLineItemText('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_customer_rec', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_customer_rec', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemText('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_contact_rec', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_contact_rec', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemText('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_exchange_hash', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_exchange_hash', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemText('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_exchange_rec', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_exchange_rec', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemText('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_lot_cert_rec', jlLoop)) + '"';
			exportTxt += ',"'+blankIfNull(rec.getLineItemValue('recmachcustrecord_si_csv_ibl_batch', 'custrecord_si_csv_ibl_lot_cert_rec', jlLoop)) + '"';
		}
	}
	var file = nlapiCreateFile(new Date().getTime()+'_export.csv', 'CSV', exportTxt);
	response.setContentType('CSV', new Date().getTime()+'_export.csv', 'attachment');
	response.write(file.getValue());
}

function blankIfNull(_val) {if(_val==null) {return '';} else {return _val;}}

function generateCSVValidationMessages(validationMessage) {
	var msgTxt = '';
	try {
		var valObj = JSON.parse(validationMessage);
		if(valObj.hasOwnProperty('CSV_IMPORT')) {
			var vLoop=0;
			for(var prop in valObj.CSV_IMPORT) {
				if(valObj.CSV_IMPORT.hasOwnProperty(prop)) {
					try {
						if(vLoop>0){msgTxt+='\r\n';}
						msgTxt+=valObj.CSV_IMPORT[prop].message;
					} catch(e) {
						var err = e;
						return validationMessage;
						nlapiLogExecution('ERROR', 'generateCSVValidationMessages', e);
					}
					vLoop++;
				}
			}
		}
	} catch(e) {
		var err = e;
		return validationMessage;
		nlapiLogExecution('ERROR', 'generateCSVValidationMessages', e); 
	}
	return '"'+msgTxt+'"';
}

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function sitsValidateJobLine(request, response) {
	var sit_recordtype = request.getParameter('sit_recordtype');
	var sit_recordid = request.getParameter('sit_recordid');
	var rec = nlapiLoadRecord('customrecord_si_csv_import_batch_line', sit_recordid);
	var mapProfileId = nlapiLookupField('customrecord_si_csv_import_batch', rec.getFieldValue('custrecord_si_csv_ibl_batch'), 'custrecord_si_csv_import_batch_import');
	var results = {};
	var recId = null;
	var existingResults = rec.getFieldValue('custrecord_si_csv_ibl_results');
	try {
		if(existingResults!=null && existingResults!='') {
			results = JSON.parse(rec.getFieldValue('custrecord_si_csv_ibl_results'));
		}
		var resultsVal = siapiValidateJobLineRecord(mapProfileId,rec);
		if(resultsVal != null) {
			results['CSV_IMPORT']=resultsVal;
			rec.setFieldValue('custrecord_si_csv_ibl_status', CSV_BATCH_STATUS.VALIDATION_ERROR);
			rec.setFieldValue('custrecord_si_csv_ibl_results',JSON.stringify(results));
		} else {
			delete results['CSV_IMPORT'];
			rec.setFieldValue('custrecord_si_csv_ibl_results',JSON.stringify(results));
			rec.setFieldValue('custrecord_si_csv_ibl_status', CSV_BATCH_STATUS.VALID);
		}
		recId = nlapiSubmitRecord(rec, true, true);
		response.sendRedirect('RECORD', sit_recordtype, sit_recordid, 'VIEW');
	} catch(e) {
		nlapiLogExecution('ERROR', 'sitsValidateJobLine|parse existing results', e);
	}
	return recId;
}