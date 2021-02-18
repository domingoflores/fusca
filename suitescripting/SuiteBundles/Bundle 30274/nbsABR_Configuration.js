/* *************************************************
 * Advanced Bank Reconciliation, � 2012 Nolan Business Solutions Plc
 *
 * Configuration Suitelet
 *
 * Version History
 * 		02/02/2012	C.Shaw		Initial version created
 */

/** nbsABR_ConfigurationSL - entry point for Configuration Scriptlet
 *
 * This function provides all the functionality for the ABR Configuration window
 */
function nbsABR_ConfigurationSL(request, response)
{
	if (request.getMethod() == 'GET')
	{
		// validate pre-requisites (e.g. Translate bundle)
		try {
			// attempt to retrieve resources record
			nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
			
		} catch (X){
			var form = nlapiCreateForm('ABR Configuration');
			var errMsg = form.addField('custpage_errormessage', 'inlinehtml', 'Error');
			errMsg.setDefaultValue('<BR><b>Unable to retrieve translation details.<BR><BR>Please install bundle - Multi-Language (id: 21459)</b><BR><BR>Error:'+X.toString());
			response.writePage(form);
			return;
		}

		var ctx = nlapiGetContext();
		var objResources = nbsTRANSL_getResources(ctx);		// get JS object of resources

		var form = nlapiCreateForm(objResources[NBSABRSTR.ABRCONFIG]);	// 'ABR Configuration'

		// search if an instance of custom record already exists
		var setupState;
		var sfNotInactive = new nlobjSearchFilter('isinactive',null,'is','F',null);
		var results = null;
		var id = null;
		var rec = null;
		try {
			results = nlapiSearchRecord('customrecord_nbsabr_config', null, sfNotInactive, null);
		} catch (e) {
	        if ( e instanceof nlobjError )
	            nlapiLogExecution('Error','ABR Configuration Suitelet', e.getCode() + '\n' + e.getDetails());
	        else
	            nlapiLogExecution('Error','ABR Configuration Suitelet',  e.toString());
		}

		if( (results === null) || (results.length == 0) )	// no record found
		{
			// set state to create new record
			setupState = 'New';
		}
		else	// one or more found
		{
			if(results.length == 1)
			{
				// set state to edit existing record
				setupState = 'Edit';
				id = results[0].getId();
				rec = nlapiLoadRecord('customrecord_nbsabr_config', id);	// assumes this will not fail...
			}
			else // multiple records found, flag error
			{
				setupState = 'Error';

				var multiInstanceErrorField = form.addField('custpage_multi_instance_error', 'inlinehtml', 'Error: ');
				multiInstanceErrorField.setDisplayType('inline');
				// Multiple configurations have been found. Please delete or mark inactive all but one configuration.
				multiInstanceErrorField.setDefaultValue('<b>'+objResources[NBSABRSTR.MULTICONFIGERR]+'</b>');
			}
		}

		if (setupState != 'Error')
		{
			nbsABR_RenderConfigForm(form,setupState,id,rec,objResources);
		}

		response.writePage(form);
	}
	else	// returning from user submit
	{
		var ctx = nlapiGetContext();
		var objResources = nbsTRANSL_getResources(ctx);		// get JS object of resources

		//save the changes
		var rec = null;
		var id = request.getParameter('custpage_hidden_field');
		if( id != null ) {
			rec = nlapiLoadRecord('customrecord_nbsabr_config',id);
		} else {
			rec = nlapiCreateRecord('customrecord_nbsabr_config');
		}
				
		rec.setFieldValue('custrecord_abr_config_mltplscrptqs', request.getParameter('usemultiplescriptqueues'));
		rec.setFieldValue('custrecord_abr_config_strtscrptqnmbr', request.getParameter('startqueuenumber'));
		rec.setFieldValue('custrecord_abr_config_endscrptqnmbr', request.getParameter('endqueuenumber'));
		rec.setFieldValue('custrecord_abr_config_allowpartstmntrec', request.getParameter('allowpartrecon'));
		rec.setFieldValue('custrecord_abr_config_allowforcedunmatch', request.getParameter('allowforcedunmatch'));
		rec.setFieldValue('custrecord_abr_config_maxnumstmnts', request.getParameter('maxnumstmnts'));
		//rec.setFieldValue('custrecord_abr_config_password', encodedPwd);

/*		var folderName = request.getParameter('foldername');
		if ((folderName !== null) && (folderName != ''))
		{
			var sfFolderName = new nlobjSearchFilter('name','','is',folderName,'');
			var sfNotInactive = new nlobjSearchFilter('isinactive','','is','F','');
			var srFolders = nlapiSearchRecord('folder','',[sfFolderName,sfNotInactive],null);
			if ((srFolders !== null) && (srFolders.length > 0))
			{
				rec.setFieldValue('custrecord_abr_config_folder',srFolders[0].getId());
			}
		}*/
		
		/*
		var id = request.getParameter('custpage_hidden_field');
		if( id != null )
		{
			rec.setFieldValue('id', id);
		}
		*/
		try {
			id = nlapiSubmitRecord(rec);
		} catch (e) {
			nlapiLogExecution('error','Unable to commit ABR Setup record',errText(e));

			var form = nlapiCreateForm(objResources[NBSABRSTR.ABRCONFIG]);	// 'ABR Configuration'
			nbsABR_RenderConfigForm(form,'Edit',id,rec,objResources);

			var confirmSave = form.addField('confirmsave', 'inlinehtml', 'Confirmation: ');
			confirmSave.setDisplayType('inline');
			confirmSave.setDefaultValue('<b>'+objResources[NBSABRSTR.COMMITFAIL]+'</b><br>&nbsp;');	// 'Unable to commit changes! Check script log for errors.'
			confirmSave.setLayoutType('outsideabove','startrow');

			response.writePage(form);
			return;
		}
		
		var form = nlapiCreateForm(objResources[NBSABRSTR.ABRCONFIG]);	// 'ABR Configuration'

		nbsABR_RenderConfigForm(form,'Edit',id,rec,objResources);

		var confirmSave = form.addField('confirmsave', 'inlinehtml', 'Confirmation: ');
		confirmSave.setDisplayType('inline');
		confirmSave.setDefaultValue('<b>'+objResources[NBSABRSTR.COMMITSUCCESS]+'</b><br>&nbsp;');	// 'Changes submitted successfully.'
		confirmSave.setLayoutType('outsideabove','startrow');

		response.writePage(form);
	}
}

/* nbsABR_RenderConfigForm - page builder for Configuration Suitelet
 *
 * This function builds the tabs, fields and buttons for the Configuration window
 *
 * Parameters:
 * 		form		- the current form
 * 		setupState	- indicates whether creating a 'New' record or doing an 'Edit'
 * 		id			- the existing record id (if exists)
 * 		rec			- the existing record object (if exists)
 */
function nbsABR_RenderConfigForm(form,setupState,id,rec,objResources)
{
	//attach client sript
	form.setScript('customscript_nbsabr_config_c');
	// Settings field group
	form.addFieldGroup('custgroup_settings','Settings');
	//form.addFieldGroup('custgroup_credentials','Credentials');
	
	// General Settings	
	// 'Use Multiple Script Queues' - 'If the feature Multiple Script Queues is enabled in your account, check this box to use in conjunction with ABR.'
	var fld_multiplescriptqueues = form.addField('usemultiplescriptqueues', 'checkbox', objResources[NBSABRSTR.LBLMULTIQUEUE], '', 'custgroup_settings');
	fld_multiplescriptqueues.setHelpText(objResources[NBSABRSTR.HLPMULTIQUEUE]);
	
	// 'Start Queue Number' - 'If Multiple Script Queues is checked, enter the first queue number that may be used for ABR.'
	var fld_startqueuenumber = form.addField('startqueuenumber', 'integer', objResources[NBSABRSTR.LBLSTARTQUEUE], '', 'custgroup_settings');
	fld_startqueuenumber.setHelpText(objResources[NBSABRSTR.HLPSTARTQUEUE]);
	
	// 'End Queue Number' - 'If Multiple Script Queues is checked, select the last queue number that may be used for ABR.'
	var fld_endqueuenumber = form.addField('endqueuenumber', 'integer', objResources[NBSABRSTR.LBLENDQUEUE], '', 'custgroup_settings');
	fld_endqueuenumber.setHelpText(objResources[NBSABRSTR.HLPENDQUEUE]);
	
	// 'Allow Partial Statement Allocation' - 'Check this box to reconcile a bank statement with outstanding bank transactions.'
	var fld_allowpartrecon = form.addField('allowpartrecon', 'checkbox', objResources[NBSABRSTR.LBLALLOWPARTIAL], '', 'custgroup_settings');
	fld_allowpartrecon.setHelpText(objResources[NBSABRSTR.HLPALLOWPARTIAL]);
	
	// 'Allow Forced Unmatching' - 'Check this box to allow the unmatching of imbalanced selections ("Forced" unmatching)'
	var fld_allowforcedunmatch = form.addField('allowforcedunmatch', 'checkbox', objResources[NBSABRSTR.ALLOWFORCDUNMTCH], '', 'custgroup_settings');
	fld_allowforcedunmatch.setHelpText(objResources[NBSABRSTR.HLPALLOWFORCDUNMTCH]);
	
	// 'Number of Rows in Period Statement List' - 'Enter the maximum number of reconcile statements to list on Period Reconciliation Report. The highest number you can enter is 400.'
	var fld_maxnumstmnts = form.addField('maxnumstmnts', 'integer', objResources[NBSABRSTR.LBLNUMRPTROWS], '', 'custgroup_settings');
	fld_maxnumstmnts.setHelpText(objResources[NBSABRSTR.HLPNUMRPTROWS]);

//	var fld_folderid = form.addField('folderid', 'integer', 'Bank Statements Folder', '', 'custgroup_settings');
//	fld_folderid.setDisplayType('hidden');
	
//	var fld_foldernameame = form.addField('foldername', 'text', 'Consignment Labels Folder Name', '', 'custgroup_settings');
//	fld_foldernameame.setMandatory(true);
//	fld_foldernameame.setHelpText('Name of the document folder (media folder) to be used for storing bank statements.');
	
	// Credentials etc.
	/*var fld_username = form.addField('username', 'email', 'Username', '', 'custgroup_credentials');
	fld_username.setMandatory(true);
	fld_username.setHelpText('NetSuite username (email address). User must have the Admistrator role');
	
	var fld_password = form.addField('password', 'password', 'Password', '', 'custgroup_credentials');
	fld_password.setMandatory(true);
	fld_password.setHelpText('NetSuite password.');*/

	// Branding
	var fld_Branding = form.addField('custpage_moduletitle','inlinehtml','');
	fld_Branding.setDisplayType('inline');
	// <B>Advanced Bank Reconciliation</B> by Nolan Business Solutions Plc
	fld_Branding.setDefaultValue('<font color="navy"><BR><BR><B>'+objResources[NBSABRSTR.ABR]+'</B> '+objResources[NBSABRSTR.BYNBS]+'</font>');
	fld_Branding.setLayoutType('outsidebelow','startrow');
	
	if (setupState == 'Edit')
	{
		// retrieve folder name....
	//	var folderName = nlapiLookupField('folder',rec.getFieldValue('custrecord_abr_config_folder'),'name');
	//	fld_labelsFolderName.setDefaultValue(folderName);
		
		//var decodedPwd = ncDecode(rec.getFieldValue('custrecord_abr_config_password'));
		//fld_username.setDefaultValue(rec.getFieldValue('custrecord_abr_config_username'));
		//fld_password.setDefaultValue(decodedPwd);
		
		fld_multiplescriptqueues.setDefaultValue(rec.getFieldValue('custrecord_abr_config_mltplscrptqs'));
		fld_startqueuenumber.setDefaultValue(rec.getFieldValue('custrecord_abr_config_strtscrptqnmbr'));
		fld_endqueuenumber.setDefaultValue(rec.getFieldValue('custrecord_abr_config_endscrptqnmbr'));
		fld_allowpartrecon.setDefaultValue(rec.getFieldValue('custrecord_abr_config_allowpartstmntrec'));
		fld_allowforcedunmatch.setDefaultValue(rec.getFieldValue('custrecord_abr_config_allowforcedunmatch'));
		fld_maxnumstmnts.setDefaultValue(rec.getFieldValue('custrecord_abr_config_maxnumstmnts'));

		// adding a hidden field to hold the record's ID value
		// this will be used for POST calls
		var hiddenIDField = form.addField('custpage_hidden_field', 'text', 'hidden');
		hiddenIDField.setDisplayType('hidden');
		hiddenIDField.setDefaultValue(id);
		
		form.addSubmitButton(objResources[NBSABRSTR.SAVE]);	// 'Save' 
	}
	else
	{
		fld_maxnumstmnts.setDefaultValue('50');
		form.addSubmitButton(objResources[NBSABRSTR.SBMT]);	// 'Submit'
	}
}
