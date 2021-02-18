
/** nbsABR_PrepareReconciliationSL - entry point for Prepare Reconciliation Scriptlet
*
* This function provides all the functionality for the Prepare Reconciliation window - renamed to Extract Transactions
* User selects a Reconcile Account and the associated GL accounts are listed and selected by default.
* Cut Off date defaults to last statement date and all transactions dated on and before this date are ignored by ABR extract process. 
* To date defaults to last statement date plus one day. All transactions dated after this date are ignored by ABR extract process. 
* User may select a new dates if required.
* 
* 
* @author C.Shaw
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function nbsABR_PrepareReconciliationSL(request, response)
{
	var form = nlapiCreateForm('Extract Transactions');
	
	// validate Multi-Language bundle is installed
	try {
		// attempt to retrieve resources record
		/*var _resSR = */ nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
		
	} catch (X)
	{
		var errMsg = form.addField('custpage_errormessage', 'inlinehtml', 'Error');
		errMsg.setDefaultValue('<BR><b>Unable to retrieve translation details.<BR><BR>'+
				'Please ensure the pre-requiste bundle is installed - Multi-Language (id: 21459)</b><BR><BR>'
					+'Error text:'+X.toString());
		response.writePage(form);
		return;
	}

	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
	form.setTitle(objResources[NBSABRSTR.XTRCTTRNS]);	// 'Extract Transactions'
	
    var reconAcctId = null;
    var stTrgtAccIds = '';
    var subsidiaryId = '';
    var stCutOffDate = '';
    var stToDate = '';
    //var stError ='';
    var show = true;

    // attach client script
	form.setScript('customscript_nbsabr_prepare_c');

	if ( request.getMethod() == 'GET' ){
		
	//b_redirect = true; //redirect from check data SL
	reconAcctId = request.getParameter('custparam_reconacctid');
	if(reconAcctId == null)
		nlapiLogExecution('debug','reconAcctId',reconAcctId);
		nbsABR_RenderPrepareReconForm(form,null,objResources,reconAcctId);
	}
	else //POST
	{
		nlapiLogExecution('debug','POST','');
		stTrgtAccIds = request.getParameterValues('custpage_trgtacct').join(':');
		nlapiLogExecution('debug','stTrgtAccIds',stTrgtAccIds);
		
		reconAcctId = request.getParameter('custpage_account');
		nlapiLogExecution('debug','reconAcctId',reconAcctId);
		subsidiaryId = nlapiLookupField('customrecord_nbsabr_accountsetup', reconAcctId, 'custrecord_accsetup_subsidiary');
		
		//encode cutoff date
		stCutOffDate = request.getParameter('cutoffdate');
		// string to date, then re-encode to string using fixed format
		var dtCutoffDate = nlapiStringToDate(stCutOffDate);
		var stEncodedCutOffDate = ncEncodeDate(dtCutoffDate);
		nlapiLogExecution('debug','stEncodedCutOffDate',stEncodedCutOffDate);
		
		//encode to date
		stToDate = request.getParameter('todate');
		// string to date, then re-encode to string using fixed format
		var dtToDate = nlapiStringToDate(stToDate);
		var stEncodedToDate = ncEncodeDate(dtToDate);
		
		/* don't think need this here as searching after cut off date
		//if date falls on a Friday and end of the month is at the weekend, use last day of month as date
		var daysToEndOfMonth = dtCutoffDate.monthDays() -  dtCutoffDate.getDate();
		var dayOfWeek = dtCutoffDate.getDay(); //5 = Friday
	
		if((dayOfWeek == 5) && (daysToEndOfMonth > 0) && (daysToEndOfMonth < 3)){
			dtCutoffDate = nlapiAddDays(dtCutoffDate,daysToEndOfMonth);
			nlapiLogExecution('debug','dtCutoffDate',dtCutoffDate);
		}*/
		
		
		// get script number - return one if multiple script queues are not used. implemented??
		var intQNum = getScriptQueueNumber();
		debugLog(show, 'intQNum', intQNum);
  
			// create a new instance, then set parameter to instance name and call script....
		var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
		instRec.setFieldValue('custrecord_bgpprocstatus', '1');	// In Progress
		instRec.setFieldValue('custrecord_bgpactivitytype', '1');	// Direct
		instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_ExtractTransactionsBG');
		instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Extract');
		//instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_PrepareReconciliationBG');
		//instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Prepare Reconciliation');
		// retrieve and set current user id
		instRec.setFieldValue('custrecord_bgpuserid', ctx.getUser());// user id, store as text - no permission issues!
		instRec.setFieldValue('custrecord_bgpusername', ctx.getName());// user name
		instRec.setFieldValue('custrecord_bgpscrptqnmbr', intQNum);// script queue number
		instRec.setFieldValue('custrecord_bgpsubsidiary', subsidiaryId);// for permissions
		/* update process record */
		instRec.setFieldValue('custrecord_bgpreccount', '0');
		instRec.setFieldValue('custrecord_bgpprocmsg', '');
		instRec.setFieldValue('custrecord_bgpstatedefn',  'TrgtAccts|ReconAcct|CutOffDate|ToDate');
		instRec.setFieldValue('custrecord_bgpprocstate', stTrgtAccIds+'|'+reconAcctId+'|'+stEncodedCutOffDate+'|'+stEncodedToDate);

		/*var instId =*/ nlapiSubmitRecord(instRec,false);
		// call BG function direct
		//nbsABR_PrepareReconciliationBG(instId);
		//nbsABR_ExtractTransactionsBG(instId);

		// invoke background processing
		var scriptParams = [];
		// scriptParams['functionName'] = 'nbsABR_ExtractTransactionsBG';
		// scriptParams['queueNumber'] = intQNum;
		scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_ExtractTransactionsBG';
		scriptParams['QNmbr'] = intQNum;

		/* only administrators can run scheduled scripts.
			wrap schedule script function in suitelet so call to nlapiScheduleScript can be made by non-administrator */
		// l_msgtext = nlapiScheduleScript(ncConst.BGP_StartupScriptId,ncConst.BGP_StartupDeployId,scriptParams);
		
		/* re-written again, now using a RESTlet to avoid suitelets deployed without login ...
		var BGPscriptURL = nlapiResolveURL('SUITELET','customscript_nbsabr_bgp_starter','customdeploy_nbsabr_bgp_starter',true);

		var BGPscriptResp = nlapiRequestURL( BGPscriptURL, null, scriptParams );	// params now passed as custom headers
		l_msgtext = BGPscriptResp.getBody();
		// ---
		if( l_msgtext == null )
			l_msgtext = 'Script or deployment invalid (inst:1)';
		else
			l_msgtext = 'Instance One: '+l_msgtext;

		nlapiLogExecution('debug','l_msgtext',l_msgtext);
		... */
		var l_msgtext = nbsABR_InvokeBackgroundProcessing(request.getURL(), request.getParameter('custpage_jsid'), scriptParams);
		nlapiLogExecution('debug','l_msgtext',l_msgtext);
	
		// redirect to Prepare Reconciliation Status page
		nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_preparereconstat','customdeploy_nbsabr_preparerecon', null, null);
		
		return;
	}
}

/** page builder for Extract suitelet
*
* This function builds the tabs, fields and buttons for the Extract window
* Cut Off Date and To Date are populated by client scripts
*
*@param (form) the current form
*@param	(string) action indicates whether action is GET, Refresh, Submit
*@param (string) internal id of subsidiary
*@param (string) internal id of reconcile account
*@param (object) resources object containing string translations
*/
function nbsABR_RenderPrepareReconForm(form, errorMsg,resources,reconacctid)
{
	var objResources = resources;
	var reconAcctId = '';
	var b_redirect = false;
	if(reconacctid !== null){
		b_redirect = true;
		reconAcctId = reconacctid;
	}
	//var stLastStmntDate = '';
						
	// Reconcile Account (list populated by client script)
	var fld_account = form.addField('custpage_account', 'select',objResources[NBSABRSTR.SLCTACCNT]);//Select Account
	
	fld_account.setLayoutType('normal','none');
	fld_account.setMandatory(true);
	// 'Select the reconcile account you are extracting for reconciliation.'
	fld_account.setHelpText(objResources[NBSABRSTR.SLCTRECONACCTXTRCT]);
	
	// populate list of bank accounts from list of account setup records
	var filters = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
	var cols = [new nlobjSearchColumn('custrecord_accsetup_accountname'),
	            new nlobjSearchColumn('custrecord_accsetup_accountnumber'),
	            new nlobjSearchColumn('custrecord_accsetup_laststmntdate')];
	cols[0].setSort();	// accountname
	cols[1].setSort();
	var accts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
	
	// populate account options list
	for(var i =0; accts != null && i < accts.length; ++i)
	{
		var strAccName = accts[i].getValue('custrecord_accsetup_accountname');//mandatory
		var strAccNumber = accts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
		var id = accts[i].getId();	
		fld_account.addSelectOption(id, strAccName+' - '+strAccNumber);
		if(i===0 && !b_redirect){
			reconAcctId = id;
		}
	//	if(b_redirect && (reconAcctId == id)){
		//	stLastStmntDate = accts[i].getValue('custrecord_accsetup_laststmntdate');
		//}
	}
	fld_account.setDefaultValue(reconAcctId);
		
	//Account list - populated by client script) 
	var fld_trgacct = form.addField('custpage_trgtacct', 'multiselect',objResources[NBSABRSTR.NSACCTS]);	// 'NetSuite Account(s)'
	fld_trgacct.setLayoutType('normal','none');
	fld_trgacct.setMandatory(true);
	fld_trgacct.setDisplaySize(300, 2);
	// 'Select the accounts associated with this reconcile account to extract transactions from.'
	fld_trgacct.setHelpText(objResources[NBSABRSTR.SLCTNSACCTXTRCT]);
	
	//populate list of target accounts given parent reconcile account
	var filters = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
	               	new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null, 'anyof',reconAcctId)];
	var columns = [	new nlobjSearchColumn('custrecord_nbsabr_ta_accountnumber'),
	               	new nlobjSearchColumn('custrecord_nbsabr_ta_accountname')];
	var recs = nlapiSearchRecord('customrecord_nbsabr_targetaccount',null,filters,columns);
		
		for(var i =0; recs != null && i < recs.length; ++i)
		{
			var strAccName = recs[i].getValue('custrecord_nbsabr_ta_accountnumber');
			var strAccNumber = recs[i].getText('custrecord_nbsabr_ta_accountname');
			var acctId =  recs[i].getValue('custrecord_nbsabr_ta_accountname');
	
			fld_trgacct.addSelectOption(acctId, strAccName+' '+strAccNumber,true);
		} 		
		
	// Cut Off Date		 
	var fld_cutoffdate = form.addField('cutoffdate', 'date',objResources[NBSABRSTR.CUTOFFDT],null,null);	// 'Cut Off Date'
	fld_cutoffdate.setLayoutType('normal','none');
	fld_cutoffdate.setMandatory(true);
	// 'NetSuite inserts last reconciliation date. You can type or pick another date. All transactions dated on and before this date are ignored by the extract process.'
	fld_cutoffdate.setHelpText(objResources[NBSABRSTR.HLPCUTOFFDT]);
//	fld_cutoffdate.setDefaultValue(stLastStmntDate);
	
	// To Date		 
	var fld_todate = form.addField('todate', 'date',objResources[NBSABRSTR.TDT],null,null);	// 'To Date'
	fld_todate.setLayoutType('normal','none');
	fld_todate.setMandatory(true);
	// 'NetSuite inserts the date one month from last statement date. You can type or pick another date. All transactions dated after this date are ignored by ABR.'
	fld_todate.setHelpText(objResources[NBSABRSTR.HLPTODT]);
	//if(!isStringEmpty(stLastStmntDate)){
		//var dtTmp = nlapiAddMonths(nlapiStringToDate(stLastStmntDate), 1);
	//	var dtTmp = nlapiAddDays(nlapiStringToDate(stLastStmntDate), 1);
		//fld_todate.setDefaultValue(nlapiDateToString(dtTmp));
	//}
	
	// error
	/*var fld_error = form.addField('error', 'inlinehtml', '');
	fld_error.setLayoutType('outsidebelow','none');
	fld_error.setDefaultValue(errorMsg);*/

	form.addSubmitButton(objResources[NBSABRSTR.SBMT]);	// 'Submit'
		
	// hidden fields
	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');

	response.writePage(form);
}

