/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 2.11.1		20 Dec 2017	johnr			[S19112] Call the ACH Account Subsidiary Update script to add subsidiaries to the ACH Account records
 * 1.00       20 Feb 2013     Jason Foglia
 *
 */

/**
 * @param {Number} toversion
 * @returns {Void}
 */
function afterInstall(toversion) {
	var status = nlapiScheduleScript("customscript_pp_ss_afterbundleinstall", "customdeploy_pp_ss_afterbundleinstall");
	if(status != "QUEUED")
	{
		throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
	}
}

function afterUpdate(fromversion,toversion){
	var fromv = new PPVersion(fromversion);
	var tov = new PPVersion(toversion);
	nlapiLogExecution('debug', 'fromv/tov', fromv.major + '/' + tov.major);
	if(fromversion == "1.2.1.6" || fromversion == "1.2.1.4"){
		updateApprovalProcess();
	}
	//wherever these next three scripts kick off from (if they do), they'll then trigger the following ones, which would also be necessary given the version numbers involved.
	//for [S20503] - SSs can now run simultaneously, and these all affect similar records. Chaining them so they don't risk erroring each other out by editing the same record at the same time.
	if(fromv.major == "1" && fromv.minor < 5){
		try{
			updateApprovalProcess2();
		}
		catch(e){
			nlapiLogExecution('ERROR', 'Bundle update error on updateApprovalProcess2', e.message);
		}
		
		
		// Fire off scheduled script
		var status = nlapiScheduleScript("customscript_pp_ss_update_is_approved", "customdeploy_pp_ss_update_is_approved");
		/*if(status != "QUEUED")
		{
			throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
		}*/
    }
	
	else if(fromv.major == "1" && fromv.minor < 7){
		nlapiLogExecution('AUDIT', 'MultiACH update', 'Scheduling script');
		var status = nlapiScheduleScript("customscript_pp_ss_multiach_update", "customdeploy_pp_ss_multiach_update");
		if(status != "QUEUED")
		{
			throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
		}
	}

	else if(fromv.major == "1" && fromv.minor < 9){
		var status = nlapiScheduleScript("customscript_pp_ss_payment_method_update", "customdeploy_pp_ss_payment_method_update");
		
		// set default custscript_pp_paypal_note company preference
		try{
			var prefs = nlapiLoadConfiguration('companypreferences');
			prefs.setFieldValue('custscript_pp_paypal_note','{memo}');
			nlapiSubmitConfiguration(prefs);
		}
		catch(e){
			nlapiLogExecution('ERROR', 'Bundle update error setting default company preferences', e.message);
		}
	}

	//done with chained SSs
	
	if(fromv.major == "1" && fromv.minor < 6){
		var status = nlapiScheduleScript("customscript_pp_ss_cancel_old_jobs", "customdeploy_pp_ss_cancel_old_jobs");
	}
	

	if(fromv.major == "1" && fromv.minor < 8){
		var status = nlapiScheduleScript("customscript_pp_ss_bill_credit_update", "customdeploy_pp_ss_bill_credit_update");
		if(status != "QUEUED")
		{
			throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
		}
		
		try{
			createDefaultACHInviteTemplate();
		}
		catch(e){
			nlapiLogExecution('ERROR', 'Bundle update error', e.message);
		}
		
	}

	
	if(fromv.major == "1" && fromv.minor < 10){
		var status = nlapiScheduleScript("customscript_pp_ss_withdrawal_ach_update", "customdeploy_pp_ss_withdrawal_ach_update");
		if(status != "QUEUED")
		{
			throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
		}
	}

	// [S19112] Call the ACH Account Subsidiary Update script to add subsidiaries to the ACH Account records
	nlapiLogExecution('debug', 's19112', 'begin');

	try {
		var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
		if (isOneWorld == true) {
			nlapiLogExecution('DEBUG', 'Avid ACH Account Subsidiaries update','this is OneWorld');
			var status = nlapiScheduleScript("customscript_pp_ss_achacctsubsidiary_upd", "customdeploy_pp_ss_achacctsubsidiary_upd");
			if(status != "QUEUED")	{
				throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
			}
		} else{
			nlapiLogExecution('DEBUG', 'Avid ACH Account Subsidiaries update','not run because this is not OneWorld');
		}
	} catch(ex) {
		nlapiLogExecution('error', 'Error in Avid ACH Account Subsidiaries update', ex.message);
	}

	//for S16847 - updates Avid AI Imported Invoice records to handle subsidiary list updates if needed.
	try {
		nlapiLogExecution('debug', 'S16847','begin');
		var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
		
		if (isOneWorld == false) {
		} else {
				nlapiLogExecution('debug', 'check 1');
			var filters = [new nlobjSearchFilter('custrecord_pp_subsid_list', null, 'anyof','@NONE@')
				, new nlobjSearchFilter('custrecord_ai_inv_bill', null, 'anyof', '@NONE@')
				, new nlobjSearchFilter('custrecord_ai_inv_vendor', null, 'noneof', '@NONE@')
				, new nlobjSearchFilter('isinactive', null, 'is', 'F')
			];
			var columns = [
				new nlobjSearchColumn('internalid')
			];
			nlapiLogExecution('debug', 'check 2');
			var results = nlapiSearchRecord('customrecord_ai_imported_invoices', null, filters, columns);
			if (results == null) {
				nlapiLogExecution('debug', 'No AI Imported Invoice Records to update','exiting');
			} else {
				nlapiLogExecution('debug', 'results count', results.length);
				for (var a = 0; a < results.length; a++) {
					//var vendor = results[a].getValue('custrecord_ai_inv_vendor', null, 'group');
					//should be able to just open and then save AI Imported Invoice record, to tip off UE script 
					var aiRec = nlapiLoadRecord('customrecord_ai_imported_invoices', results[a].getValue('internalid'));
					nlapiSubmitRecord(aiRec);
				}
			}
		}
	} catch(ex) {
		nlapiLogExecution('error', 'Error in subsidiaryAIUpdate', ex.message);
	}

	//for S18321 - updates existing Avidinvoice Field Mapping records to be for expense lines if nothing else is specified.
	try {
		nlapiLogExecution('debug', 's19321','begin');
		var mapFilters = [new nlobjSearchFilter('custrecord_pp_fm_ns_header', null, 'is', 'F') //if it's mapping to a line field in NS but has not been designated as item or expense, default to expense
			, new nlobjSearchFilter('custrecord_pp_fm_item', null, 'is', 'F')
			, new nlobjSearchFilter('custrecord_pp_fm_expense', null, 'is', 'F')
		];
		var mapColumns = [new nlobjSearchColumn('internalid')];
		var mapResults = nlapiSearchRecord('customrecord_pp_field_mapping', null, mapFilters, mapColumns);
		if (mapResults != null) {
			for (var b = 0; b < mapResults.length; b++) {
				//set to be an expense field
				nlapiSubmitField('customrecord_pp_field_mapping', mapResults[b].getValue('internalid'), 'custrecord_pp_fm_expense', 'T');
			}
		}

		//for S18321 - if the preference to decide between expense and item lines is not set, default to expense
		var context = nlapiGetContext();
		var linePref = context.getSetting('SCRIPT', 'custscript_pp_dist_line_map_select');
		if (linePref != 1 && linePref != 2) {
			//Preference is not set. reset such that the preference defaults to Expense (1)
			try {
				context.setSetting('SCRIPT', 'custscript_pp_dist_line_map_select', 1);
			} catch(ex) {
				nlapiLogExecution('error', 'Error setting custscript_pp_dist_line_map_select', ex.message);
			}

		}


	} catch(ex) {
		nlapiLogExecution('error', 'Error in fieldMapping update', ex.message);
	}

	// [S21817] Call the Avid SS Credentials Update script 
	try {
		var status = nlapiScheduleScript("customscript_pp_ss_avidcredentialsupdate", "customdeploy_pp_ss_avidcredentialsupdate");
		if(status != "QUEUED")	{
			throw new nlobjError('INSTALLATION_ERROR', "nlapiScheduleScript failed with: " + status);
		}
	} catch(ex) {
		nlapiLogExecution('error', 'Error executing customscript_pp_ss_avidcredentialsupdate: ', ex.message);
	}

	try {
		//this only needs to stay in for the 2.18 update. After everyone is on this, it can be removed.
		if(fromv.major == "2" && fromv.minor < 19){
			nlapiScheduleScript('customscript_pp_ss_update_acsi_recs','customdeploy_pp_ss_update_acsi_recs');
		}
	}catch(ex) {
		nlapiLogExecution('error', 'Error in updating Avid Check Stub Info records', ex.message);
	}
}


function PPVersion(version){
	var versionArr = version.split('.');
	
	this.major = parseInt(versionArr[0]);
	this.minor = parseInt(versionArr[1]);
	this.release = parseInt(versionArr[2]);
}

function PPVersionValue(ppversion){
	try{
		var majorValue = StrToInt(ppversion.major) * 1000000;
		var minorValue = StrToInt(ppversion.minor) * 1000;
		var releaseValue = StrToInt(ppversion.release);
		this.value = majorValue + minorValue + releaseValue;
	}catch(ex){
		nlapiLogExecution('ERROR', 'Error in PPVersionValue', ex.message);
		this.value = 99000000;
	}
}

function StrToInt(str) {
	try {
		var intValue = parseInt(str);
		return intValue;
	} catch(ex) {
		nlapiLogExecution('error', 'Error in StrToInt', ex.message);
	}
}