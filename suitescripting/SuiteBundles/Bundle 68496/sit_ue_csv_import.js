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
 * @appliedtorecord customrecord_si_csv_import_batch
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function sitblImportJob(type, form, request){ //TODO: (12/14/2014-SRS) need to rename method and update the Script in NetSuite
	nlapiLogExecution('DEBUG', 'sitblImportJobAddExportBtn', type);
	var exportErrorURL = nlapiResolveURL('SUITELET', 'customscript_sit_s_export_errors', 'customdeploy_sit_s_export_errors');
	if('view'==type) {
		var containsErrors = linesContainErrors();
		var rec = nlapiGetNewRecord();
		var status = rec.getFieldValue('custrecord_si_csv_import_batch_status');
		if(status == '9' && allLinesValid()) {
			var processJobURL = nlapiResolveURL('SUITELET', 'customscript_sit_s_process_job', 'customdeploy_sit_s_process_job');
			processJobURL+='&sit_recordid='+nlapiGetRecordId()+'&sit_recordtype='+nlapiGetRecordType();
			form.addButton('custpage_export_errors', 'Process Job', "window.location='"+processJobURL+"';");
//		} else if(status != '3' && !allLinesValid()) {
//			var validateURL = nlapiResolveURL('SUITELET', 'customscript_sit_s_export_errors', 'customdeploy_sit_s_export_errors');
//			validateURL+='&sit_recordid='+nlapiGetRecordId()+'&sit_recordtype='+nlapiGetRecordType();
			//TODO: (12/14/2014-SRS) Need to implement the Validate Lines suitelet and standardize the validation process.
//			form.addButton('custpage_export_errors', 'Validate', "window.open('"+validateURL+"')");
//			form.addButton('custpage_export_errors', 'Validate Lines', "alert('Not implemented yet.');");
		} else if(status == '2') {
			var notyfiMsg = form.addField('custpage_notify_msg','inlinehtml','');
			notyfiMsg.setLayoutType('outsideabove');
			notyfiMsg.setDefaultValue('<div id="div__alert"><div width="100%" class="uir-alert-box information session_confirmation_alert" style=""><div class="icon info"><img alt="" src="/images/icons/messagebox/icon_msgbox_info.png"></div><div class="content"><div class="title">Exploding Lines</div><div class="descr">Import Job is currently processing</div></div></div></div>');
		} else if(status == '10') {
			var summarySection='<table><thead><th style="font-weight:900;">Status</th><th style="font-weight:900;">Count</th></thead><tbody>';
			var sc = [];
			sc.push(countCol = new nlobjSearchColumn('internalid',null,'count'));
			sc.push(statusCol = new nlobjSearchColumn('custrecord_si_csv_ibl_status',null,'group'));
			var fe = [['custrecord_si_csv_ibl_batch','anyof',nlapiGetRecordId()]];
			var results = nlapiSearchRecord('customrecord_si_csv_import_batch_line',null,fe,sc);
			var totalRecords = 0;
			var totalCompleted = 0;
			var percentCompleted = '0%';
			for(var rs=0;results!=null && rs<results.length;rs++) {
				if(results[rs].getText(statusCol)=='Complete') {
					totalCompleted=results[rs].getValue(countCol);
				}
				totalRecords=totalRecords+parseFloat(results[rs].getValue(countCol));
				summarySection+='<tr><td>'+results[rs].getText(statusCol)+'</td><td>'+results[rs].getValue(countCol)+'</td></tr>';
			}
			if(totalRecords!=0 && totalCompleted!=0) {
				percentCompleted = parseFloat((totalCompleted/totalRecords)*100).toFixed(2) + '%';
			}
			summarySection+='<tr><td colspan="2" style="text-align:center;">';
			summarySection+='<table border="0" cellspacing="0" cellpadding="0" style="margin-right:6px;cursor:hand;" class="uir-button" id="tbl_refresh"> <tbody><tr class="pgBntG pgBntB" id="tr_refresh"> <td id="tdleftcap_refresh"><img border="0" width="3" height="50%" class="bntLT" src="/images/nav/ns_x.gif"> <img border="0" width="3" height="50%" class="bntLB" src="/images/nav/ns_x.gif"> </td> <td valign="top" nowrap="" height="20" class="bntBgB" id="tdbody_refresh"> <input type="button" onmouseover="if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(true, false, this);" onmouseout="if(this.getAttribute(\'_mousedown\')==\'T\') setButtonDown(false, false, this);" onmouseup="this.setAttribute(\'_mousedown\',\'F\'); setButtonDown(false, false, this);" onmousedown="this.setAttribute(\'_mousedown\',\'T\'); setButtonDown(true, false, this);" onclick="window.location.reload(true); return false;" name="refresh" id="refresh" value="Refresh" class="rndbuttoninpt bntBgT" style="" _mousedown="F"></td> <td id="tdrightcap_refresh"> <img border="0" width="3" height="50%" class="bntRT" src="/images/nav/ns_x.gif"> <img border="0" width="3" height="50%" class="bntRB" src="/images/nav/ns_x.gif">';
			summarySection+='</<td></tr>';
			summarySection+='</tbody></table>';
			var notyfiMsg = form.addField('custpage_notify_msg','inlinehtml','');
			notyfiMsg.setLayoutType('outsideabove');
			notyfiMsg.setDefaultValue('<div id="div__alert"><div width="100%" class="uir-alert-box information session_confirmation_alert" style=""><div class="icon info"><img alt="" src="/images/icons/messagebox/icon_msgbox_info.png"></div><div class="content"><div class="title">Processing Lines: '+percentCompleted+' completed</div><div class="descr">Import Job is currently processing.</div>'+summarySection+'</div></div></div>');
		} else if(containsErrors) {
			form.addButton('custpage_export_errors', 'Export Errors', "window.open('"+exportErrorURL+'&sit_recordid='+nlapiGetRecordId()+'&sit_recordtype='+nlapiGetRecordType()+"')");
		}
		form.addButton('custpage_export_results', 'Export All', "window.open('"+exportErrorURL+'&sit_recordid='+nlapiGetRecordId()+'&sit_recordtype='+nlapiGetRecordType()+'&sit_allrecords=T'+"')");
	}
}

/**
 * @appliedtorecord customrecord_si_csv_import_batch
 * @param {String} type Operation types: create, edit, delete, xedit,approve, cancel, reject (SO, ER, Time Bill, PO & RMA only), pack, ship (IF only), dropship, specialorder, orderitems (PO only), paybills (vendor payments)
 * @returns {Void}
 */
function sitasImportJob(type){
	if(type=='create'||type=='edit') {
		try {
			var rec = nlapiGetNewRecord();
			var batchId = rec.getId();
			siapiCSVDependencyCheck(batchId);
		} catch(e) {
			nlapiLogExecution('ERROR', 'sitasImportJob|'+type, e);
		}
	}
}

function linesContainErrors() {
	var results = nlapiSearchRecord('customrecord_si_csv_import_batch_line', null, [['custrecord_si_csv_ibl_batch.internalid','anyof',nlapiGetRecordId()],'AND',['custrecord_si_csv_ibl_status','anyof',[CSV_BATCH_STATUS.SYSTEM_ERROR, CSV_BATCH_STATUS.VALIDATION_ERROR]]]);
	return (results!=null && results.length>0); 
}

function allLinesValid() {
	var results = nlapiSearchRecord('customrecord_si_csv_import_batch_line', null, [['custrecord_si_csv_ibl_batch.internalid','anyof',nlapiGetRecordId()]],[new nlobjSearchColumn('custrecord_si_csv_ibl_status', null, 'group')]);
	for(var rLoop=0;results!=null && rLoop<results.length; rLoop++) {
		if(results[rLoop].getValue('custrecord_si_csv_ibl_status', null, 'group')==CSV_BATCH_STATUS.COMPLETE) {
			continue;
		}
		if(results[rLoop].getValue('custrecord_si_csv_ibl_status', null, 'group')!=CSV_BATCH_STATUS.VALID) {
			return false;
		}
	}
	return true;
}

/**
 * @appliedtorecord customrecord_si_csv_import_batch
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function sitblDealAddImportFileBtn(type, form, request){
	nlapiLogExecution('DEBUG', 'sitblDealAddImportFileBtn', type);
	nlapiLogExecution('DEBUG', 'sitblDealAddImportFileBtn | category', nlapiGetFieldValue('category'));
	if('view'==type) {
		if(nlapiGetFieldValue('category')==1) { /* Only show button on "DEAL" customer records */
			var url = nlapiResolveURL('SUITELET', 'customscript_sit_s_csv_import_ui_new', 'customdeploy_sit_s_csv_import_ui_new');
			url+='&sit_deal='+nlapiGetRecordId();
		}
		//<ATP-1081>
		if (nlapiGetFieldValue('category') != 1){
			form.addButton('custpage_export_errors', 'Import File', "window.open('"+url+"');");
		}
		//</ATP-1081>
	}
}

/***
 * RECORD: customrecord_si_csv_import_batch_line User Events
 */

/**
 * @appliedtorecord customrecord_si_csv_import_batch_line
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function sitblImportJobLine(type, form, request){
	nlapiLogExecution('DEBUG', 'sitblJobLineAddValBtn', type);
	var custpage_html_field = form.addField('custpage_html_field', 'inlinehtml', 'css');
	var htmlText = '';
	custpage_html_field.setLayoutType('outsideabove');
	htmlText+= '\n<style>\n'+
		'span.uir-label .smallgraytext.sit_validation_error {\n' +
		'color: red !important;\n' +
		'font-weight: 900 !important;\n' +
		'}\n' +
		'span.uir-label .smallgraytext.sit_validation_error, span.uir-label .smallgraytextnolink.sit_validation_error, span.uir-label .smallgraytextbold.sit_validation_error, span.uir-label .smalltextnolink.sit_validation_error, span.uir-label .smalltextul.sit_validation_error {\n' +
		'color: red !important;\n' +
		'font-weight: 900 !important;\n' +
		'}\n' +
		'div.uir-field-wrapper span.uir-field:not(.uir-user-styled) input.sit_validation_error {\n' +
		'border: 2px solid red !important;\n' +
		'color: red !important;\n' +
		'}\n' +
		'</style>';
	if('view'==type) {
		var processJobURL = nlapiResolveURL('SUITELET', 'customscript_sit_s_validate_job_line', 'customdeploy_sit_s_validate_job_line');
		processJobURL+='&sit_recordid='+nlapiGetRecordId()+'&sit_recordtype='+nlapiGetRecordType();
		form.addButton('custpage_validate_btn', 'Validate', "window.location='"+processJobURL+"';");
	} else if('edit'==type) {
		try {
			generateSelectDropDown('custpage_lotdelivery_dd','customlist_acq_loth_lot_sent','custrecord_si_csv_ibl_lot_delivery','custrecord_si_csv_ibl_certificate_status');
			generateSelectDropDown('custpage_certstatus_dd','customlist_acq_lotce_line_status','custrecord_si_csv_ibl_certificate_status','custrecord_si_csv_ibl_security_type');
			generateSelectDropDown('custpage_securitytype_dd','customlist_security_types','custrecord_si_csv_ibl_security_type','custrecord_si_csv_ibl_certificate_number');
			generateSelectDropDown('custpage_currency_dd','currency','custrecord_si_csv_ibl_currency_type','custrecord_si_csv_ibl_date_acquired');
			
			generateSelectDropDown('custpage_state_dd','customrecord_states','custrecord_si_csv_ibl_state','custrecord_si_csv_ibl_postal_code',true);
			generateSelectDropDown('custpage_country_dd','customrecord_country_list','custrecord_si_csv_ibl_country','custrecord_si_csv_ibl_comport_contact');
		} catch(e) {
			
		}
	}
	custpage_html_field.setDefaultValue(htmlText);
}

/**
 * @appliedtorecord customrecord_si_csv_import_batch_line
 * @param {String} type Operation types: create, edit, delete, xedit, approve, reject, cancel (SO, ER, Time Bill, PO & RMA only), pack, ship (IF), markcomplete (Call, Task), reassign (Case), editforecast (Opp, Estimate)
 * @returns {Void}
 */
function sitbsImportJobLine(type){
	nlapiLogExecution('DEBUG', 'sitbsImportJobLine|start', new Date().getTime());
	var rec = nlapiGetNewRecord();
	if(rec.getFieldValue('custrecord_si_csv_ibl_validate_onsave')=='T') {
		try {
			var mapProfileId = nlapiLookupField('customrecord_si_csv_import_batch', rec.getFieldValue('custrecord_si_csv_ibl_batch'), 'custrecord_si_csv_import_batch_import');
			var results = {};
			var existingResults = rec.getFieldValue('custrecord_si_csv_ibl_results');
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
		} catch(e) {
			nlapiLogExecution('ERROR', 'sitsValidateJobLine|parse existing results', e);
		}
	}
}

/**
 * @appliedtorecord customrecord_si_csv_import_batch_line
 * @param {String} type Operation types: create, edit, delete, xedit,approve, cancel, reject (SO, ER, Time Bill, PO & RMA only), pack, ship (IF only), dropship, specialorder, orderitems (PO only), paybills (vendor payments)
 * @returns {Void}
 */
function sitasImportJobLine(type){
	if(type=='create'||type=='edit') {
		var rec = nlapiGetNewRecord();
		var oldRec = nlapiGetOldRecord();
		var batchId = rec.getFieldValue('custrecord_si_csv_ibl_batch');
		try {
			if(type=='edit' && rec.getFieldValue('custrecord_si_csv_ibl_contact_email') != oldRec.getFieldValue('custrecord_si_csv_ibl_contact_email')) {
				var fe = [];
				fe.push(['custrecord_si_csv_ibl_batch','anyof',[].concat(rec.getFieldValue('custrecord_si_csv_ibl_batch'))]);
				fe.push('AND',['internalid','noneof',[].concat(rec.getId())]);
				fe.push('AND',['custrecord_si_csv_ibl_ownership_title_1','is',rec.getFieldValue('custrecord_si_csv_ibl_ownership_title_1')]);
				var results = nlapiSearchRecord('customrecord_si_csv_import_batch_line',null,fe);
				nlapiLogExecution('ERROR', 'sitasImportJobLine|fe',JSON.stringify(fe));
				nlapiLogExecution('ERROR', 'sitasImportJobLine|results',JSON.stringify(results));
				var mapProfileId = nlapiLookupField('customrecord_si_csv_import_batch', batchId, 'custrecord_si_csv_import_batch_import');
				for(var rl=0;results!= null && rl<results.length;rl++) {
					var valResults = {};
					var updateRec = nlapiLoadRecord('customrecord_si_csv_import_batch_line',results[rl].getId());
					updateRec.setFieldValue('custrecord_si_csv_ibl_contact_email',rec.getFieldValue('custrecord_si_csv_ibl_contact_email'));
					var existingResults = updateRec.getFieldValue('custrecord_si_csv_ibl_results');
					if(existingResults!=null && existingResults!='') {
						valResults = JSON.parse(updateRec.getFieldValue('custrecord_si_csv_ibl_results'));
					}
					var resultsVal = siapiValidateJobLineRecord(mapProfileId,updateRec);
					if(resultsVal != null) {
						valResults['CSV_IMPORT']=resultsVal;
						updateRec.setFieldValue('custrecord_si_csv_ibl_status', CSV_BATCH_STATUS.VALIDATION_ERROR);
						updateRec.setFieldValue('custrecord_si_csv_ibl_results',JSON.stringify(valResults));
					} else {
						delete valResults['CSV_IMPORT'];
						updateRec.setFieldValue('custrecord_si_csv_ibl_results',JSON.stringify(valResults));
						updateRec.setFieldValue('custrecord_si_csv_ibl_status', CSV_BATCH_STATUS.VALID);
					}
					nlapiSubmitRecord(updateRec,true,true);
				}
			}
			
		} catch(e) {
			nlapiLogExecution('ERROR', 'sitasImportJobLine|updating email', e);
		}
		try {
			if(nlapiGetContext().getExecutionContext()=='userinterface') {
				siapiCSVDependencyCheck(batchId);
			}
		} catch(e) {
			nlapiLogExecution('ERROR', 'sitasImportJobLine|'+type, e);
		}
	}
}



/***
 * RECORD: customrecord_si_csv_import_batch_map User Events
 */

/**
 * @appliedtorecord customrecord_si_csv_import_batch_map
 * @param {String} type Operation types: create, edit, delete, xedit, approve, reject, cancel (SO, ER, Time Bill, PO & RMA only), pack, ship (IF), markcomplete (Call, Task), reassign (Case), editforecast (Opp, Estimate)
 * @returns {Void}
 */
function sitbsImportJobMap(type){
	nlapiLogExecution('DEBUG', 'sitbsImportJobLine', type);
	try {
		if('edit'==type) {
			var rec = nlapiGetNewRecord();
			var lineCount = rec.getLineItemCount('recmachcustrecord_si_csv_ibml_map');
			for(var lLoop=1;lineCount!=null && lLoop<=lineCount;lLoop++) {
				var validationText = rec.getLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_validations', lLoop);
				if(validationText!=null && validationText!='') {
					validationText = validationText.replace(new RegExp(String.fromCharCode(5),'gm'),'\r');
					rec.setLineItemValue('recmachcustrecord_si_csv_ibml_map', 'custrecord_si_csv_ibml_validations', lLoop, validationText);
				}
			}
		}
	} catch(e) {
		nlapiLogExecution('ERROR', 'sitbsImportJobLine', e);
	}
}