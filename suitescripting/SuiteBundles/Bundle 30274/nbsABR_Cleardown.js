/**
 * Advanced Bank Reconciliation, Nolan Business Solutions
 *
 * Code for Cleardown suitelet
 *
 * One off setup process for each reconcile account that clears all previously reconciled transactions
 * User selects an account, start date (date of oldest unreconciled transaction) and end date (date
 * of last successful reconciliation). * If a Reconcile Account is associated with multiple target account, 
 * each target account is "cleared" separately.
 * 
 * Sublist of transactions within dates is displayed allowing user to select reconciled transactions.
 * Ending balance is calculated and used as bank statement Opening Balance on first reconciliation.
 *
 * On submit:
 * 	 	-ABR Reconciled Statement record is created.
 * 		-An instance of Reconciliation State is created for each transaction listed.
 * 		-Marked transactions will have ABR Status of "reconciled.
 * 		-Unmarked transactions will have ABR Status of "unmatched.
 * 		-Marked transactions id of reconciled statement above.
 * 		
 */

// get company info
nbsCONFIG.getCompanyInfo();
nbsCONFIG.getAccPref();

/** nbsABR_CleardownSL - entry point for Cleardown Scriptlet - renamed to Account Initialisation
*
* This function provides all the functionality for the Cleardown window
* 
* Marked transactions are previously reconciled so they are cleared and removed from the outstanding transactions list.
* Unmarked transactions are still outstanding (unreconciled) and they will remain available for future reconciliation.
* 
* A Reconciliation State record is created with a status of 'Unmatched' for each unmarked transaction.
* A Reconciliation Statement record is created with an adjusted NetSuite account balance for each batch of transactions processed.
* If multiple batches are required to clear transactions, the adjusted balance is accumulated from previous statements.
* Up to 1000 records may be processed at one time.
* Last Processed Id (internalid to NS trn) is recorded in a hidden field and written to the Reconciliation Stmnt record and
* is used to filter search for transactions.
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function nbsABR_CleardownSL(request, response)
{
	// validate pre-requisites (e.g. Translate bundle)
	try {
		// attempt to retrieve resources record
		nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId,null,null,null);
		
	} catch (X){
		var form = nlapiCreateForm('Account Initialisation');
		var errMsg = form.addField('custpage_errormessage', 'inlinehtml', 'Error');
		errMsg.setDefaultValue('<BR><b>Unable to retrieve translation details.<BR><BR>Please install bundle - Multi-Language (id: 21459)</b><BR><BR>Error:'+X.toString());
		response.writePage(form);
		return;
	}
	
	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);			
	//var form = nlapiCreateForm(objResources[NBSABRSTR.TRNCLRDWN]);
	var form = nlapiCreateForm(objResources[NBSABRSTR.ACCTINIT]);	// 'Account Initialisation'
	form.setScript('customscript_nbsabr_cleardown_c');
	
	var arrParams = new Array();

	if (request.getMethod() == 'GET'){
		nbsABR_RenderCleardownForm(form,'GET',arrParams,objResources);
		
		response.writePage(form);
	}
	else{ // returning from user submit/refresh
		var rqParams = request.getAllParameters();

		// get submitted values
		var action = rqParams['nbsaction'];
		var reconAccId = rqParams['reconaccount'];
		var targetAccId = rqParams['custpage_targetaccount'];
		var nsAccId = rqParams['nsaccount'];
		var stToDate = rqParams['todate'];
		var stFromDate = rqParams['fromdate'];
		var intLastProcId = rqParams['lastprocid'];
		
		if(reconAccId === '' || stToDate === '' || stFromDate === '' || targetAccId ==='')
		{
			nbsABR_RenderCleardownForm(form,'GET',arrParams,objResources);
			response.writePage(form);
			return;
		}
		if(action == 'Refresh'){
		//	arrParams['reconAccId'] = reconAccId;
		//	arrParams['targetAccId'] = targetAccId;
			//arrParams['fromdate'] = stFromDate;
			//arrParams['todate'] = stToDate;
			
			// search for existing reconciliations and if found, block further account initialisations
				var SF = [	new nlobjSearchFilter('isinactive',null, 'is','F'),
				            new nlobjSearchFilter('custrecord_sh_accntinit',null, 'is','F'),
				            new nlobjSearchFilter('custrecord_sh_reconaccount',null, 'is',reconAccId)];
		 		var SR = nlapiSearchRecord('customrecord_nbsabr_statementhistory',null,SF,null);
		 		if(SR !== null){
		 			
		 			var err_form = nlapiCreateForm(objResources[NBSABRSTR.ACCTINIT]);	// 'Account Initialisation'
		 			
		 			var err_field = err_form.addField('custpage_errormsg', 'inlinehtml', objResources[NBSABRSTR.ERR]);	// 'Error'
		 			err_field.setLayoutType('outsideabove','startrow');
		 			
		 			var err_msg = '<font style="font-size:small;"><BR>'
		 				+'<b>'+objResources[NBSABRSTR.WARNING]+'</b> '+objResources[NBSABRSTR.ACCTALRDYREC]+'<BR>'
		 				+objResources[NBSABRSTR.CANNOTINITUNTILDELTD]+'</font>';
		 			//	+'<b>Warning!</b> This account has already been reconciled.<BR>'
					//	+'You cannot process an account initialisation for this account until all existing reconciliations have been deleted.</font>';
		 			err_field.setDefaultValue(err_msg);
		 			response.writePage(err_form);
		 			return;
		 		}

			nbsABR_RenderCleardownForm(form,'Refresh',rqParams,objResources);
			response.writePage(form);
			return;
		}
		if (action == 'ExportCSV') {
			// create and stream/download csv file
			var subsidId = rqParams['subsidiary'];
			var csvFileObj = nbsABR_ExportCSV(reconAccId,nsAccId,stFromDate,stToDate,subsidId,objResources);
			
			response.setContentType('CSV','NBSABR_AccountInit.csv','inline');
			// write response to the client
			response.write(csvFileObj.getValue());

			/*
			// redisplay page
			nbsABR_RenderCleardownForm(form,'Refresh',rqParams,objResources);
			response.writePage(form);
			*/
			return;
		}
		if(action == 'Submit'){
						
			var subsidId = rqParams['subsidiary'];
			//var stEndingBalance = rqParams['endingbalance'];
			var strTotalUnreconciled = rqParams['totalunrecon'];
			var strAcctBalance = rqParams['accountbalance'];
		
			//now use id of nominal account
			var acctId = nlapiLookupField('customrecord_nbsabr_targetaccount',targetAccId,'custrecord_nbsabr_ta_accountname');
			
			// string to date, then re-encode to string using fixed format
			var dtToDate = nlapiStringToDate(stToDate);
			var stEncodedToDate = ncEncodeDate(dtToDate);

			// string to date, then re-encode to string using fixed format
			var dtFromDate = nlapiStringToDate(stFromDate);
			var stEncodedFromDate = ncEncodeDate(dtFromDate);

			var arrTrxIds = [];
			var arrTrxTypes = [];
			var arrStatus = [];
			var arrLines = [];
			var stTrxIds = '';
			var stTrxTypes = '';
			var stStatus = '';
			var stLines = '';
		
			for(var i=1, j =request.getLineItemCount('gl_list'); i<=j; i+=1)
			{
				// create extracts for unreconciled only
				if( request.getLineItemValue('gl_list','mark',i) != 'T' ){
					
					arrTrxIds.push(request.getLineItemValue('gl_list','internalid',i));
					arrTrxTypes.push(request.getLineItemValue('gl_list','type_hidden',i));
					var strStatusCode = nbsABR.CL.STATUS.UNMATCHED;//unmatched
					arrStatus.push(strStatusCode);
					arrLines.push(request.getLineItemValue('gl_list','line',i));
				}
				
				//create extracts for reconciled & unreconciled
				/*arrTrxIds.push(request.getLineItemValue('gl_list','internalid',i));
				arrTrxTypes.push(request.getLineItemValue('gl_list','type_hidden',i));
				arrLines.push(request.getLineItemValue('gl_list','line',i));
				var strStatusCode = nbsABR.CL.STATUS.UNMATCHED;//unmatched	
				
				if( request.getLineItemValue('gl_list','mark',i) == 'T' ){
					strStatusCode = nbsABR.CL.STATUS.RECONCILED;		
				}
				arrStatus.push(strStatusCode);*/
			}
			stTrxIds = arrTrxIds.join(':');
			stTrxTypes = arrTrxTypes.join(':');
			stStatus = arrStatus.join(':');
			stLines = arrLines.join(':');

			var recRA = nlapiLoadRecord('customrecord_nbsabr_accountsetup', reconAccId);// should never fail!
			
			// update Reconcile From date on Reconcile Account record with From Date (date of earliest unreconciled trn in NS)
			// could be multiple cleardowns because recon a/c maybe associated with multiple target accounts
			// update Reconcile From date if later
			
			/*var dtRcnFrmDate = nlapiStringToDate(recRA.getFieldValue('custrecord_accsetup_fromdate'));
			//set Reconcile From date
			if(isStringEmpty(dtRcnFrmDate)){
				dtRcnFrmDate = new Date();
			}
			if(dtFromDate < dtRcnFrmDate){
				recRA.setFieldValue('custrecord_accsetup_fromdate',stFromDate);
 			}*/
			
			// better to set ABR cut off date to ToDate, date of last reconciliation pre-ABR
			// prevents accidental extract of pre-ABR reconciled trns
			recRA.setFieldValue('custrecord_accsetup_fromdate',stToDate);
	
			//update last recon & last statement date....not sure which one we need to keep?
			recRA.setFieldValue('custrecord_accsetup_lastrecondate',stToDate);
			recRA.setFieldValue('custrecord_accsetup_laststmntdate',stToDate);	
			
			nlapiSubmitRecord(recRA);	
						
			// create bank statement history record - or update existing record!
			var objAccount = nbsABR_CreateAccountObject(reconAccId);
			var l_allAcctBal = nbsABR_getAccountBalance(objAccount.targetaccts,stToDate,objAccount.isBaseCurrency,false);
			var SHid = null;
			var recStatementHistory = null;
			var sfReconAcct = new nlobjSearchFilter('custrecord_sh_reconaccount',null,'anyOf',reconAccId,null);
			var sfAcctInit = new nlobjSearchFilter('custrecord_sh_accntinit',null,'is','T',null);
			var srStmtHist = nlapiSearchRecord('customrecord_nbsabr_statementhistory',null,[sfReconAcct,sfAcctInit],null);
			if ((srStmtHist !== null) && (srStmtHist.length > 0)) {
				SHid = srStmtHist[0].getId();
				recStatementHistory = nlapiLoadRecord('customrecord_nbsabr_statementhistory',SHid);
				
				var l_totalUnrec = ncParseFloatNV(recStatementHistory.getFieldValue('custrecord_sh_ns_unreconciled'),0.0);
				l_totalUnrec += ncParseFloatNV(strTotalUnreconciled,0.0);
				strTotalUnreconciled = l_totalUnrec.toString();
			} else {
				// balance values set by UE before submit
		 		recStatementHistory = nlapiCreateRecord('customrecord_nbsabr_statementhistory');
		 		recStatementHistory.setFieldValue('custrecord_sh_reconaccount', reconAccId);
		 		if(nbsABR.CONFIG.b_SubsEnabled){	
		 			recStatementHistory.setFieldValue('custrecord_sh_subsidiary', subsidId);
		 		}
		 		recStatementHistory.setFieldValue('custrecord_sh_date', stToDate);
		 		recStatementHistory.setFieldValue('custrecord_sh_startdate', stFromDate);
			}
			
	 		// NS fields
	 		recStatementHistory.setFieldValue('custrecord_sh_ns_unreconciled', strTotalUnreconciled);
	 		recStatementHistory.setFieldValue('custrecord_sh_ns_balance', l_allAcctBal);	// strAcctBalance);
	 		// BK fields
	 		recStatementHistory.setFieldValue('custrecord_sh_bk_unreconciled', '0');
	 		recStatementHistory.setFieldValue('custrecord_sh_accntinit', 'T');
	 		recStatementHistory.setFieldValue('custrecord_sh_lastprocid',intLastProcId);
	 			 		
	 		SHid = nlapiSubmitRecord(recStatementHistory,false);
	 		
	 		// also create a Reconciliation State record, type 'Opening Position', for the Acct Balance amount, status Reconciled, linked to the statement above
			var adjBal = ncParseFloatNV(strAcctBalance,0.0) - ncParseFloatNV(strTotalUnreconciled,0.0);
	 		var recReconState = nlapiCreateRecord('customrecord_nbsabr_reconciliationstate');
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_reconacc',reconAccId);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_targetacc',acctId);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_trndate',stToDate);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_amount', adjBal);	// strAcctBalance);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_linenumber','0');
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_memo','Account Initialisation');
	 		if(nbsABR.CONFIG.b_SubsEnabled) {
	 			recReconState.setFieldValue('custrecord_nbsabr_rs_subsidiary',subsidId);
	 		}
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_datereconciled',stToDate);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_status',ABR_CL.STATUS.RECONCILED);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_recordtype',ABR_CL.RECTYPE.OPENPOSTN);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_integritystatus',ABR_CL.INTEGRITY.NEW);
	 		recReconState.setFieldValue('custrecord_nbsabr_rs_reconstmnt',SHid);
	 		nlapiSubmitRecord(recReconState,false);
	 		
	 		// get script number - returns 1 if multiple script queues are not used.
    		var intQNum = getScriptQueueNumber();

			// create a new instance, then set parameter to instance name and call script....
			var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
			//instRec.setFieldValue('custrecord_bgpprocstatus', '5');		// Queued - in progress if direct call??
			instRec.setFieldValue('custrecord_bgpprocstatus', '1');	// In Progress
			instRec.setFieldValue('custrecord_bgpactivitytype', '1');	// Direct
			instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_CleardownBG');
			instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Cleardown');
			// retrieve and set current user id
			// instRec.setFieldValue('custrecord_bgpprocuser', ctx.getUser());//list/record
			instRec.setFieldValue('custrecord_bgpuserid', ctx.getUser());// user id, store as text to avoid permissions error
			instRec.setFieldValue('custrecord_bgpusername', ctx.getName());// user name
			instRec.setFieldValue('custrecord_bgpscrptqnmbr', intQNum);// script queue number
			if(nbsABR.CONFIG.b_SubsEnabled){	
				instRec.setFieldValue('custrecord_bgpsubsidiary', subsidId);
			}
			/* update process record */
			instRec.setFieldValue('custrecord_bgpreccount', '0');
			instRec.setFieldValue('custrecord_bgpprocmsg', '');
			instRec.setFieldValue('custrecord_bgpstatedefn',  'ReconAccountId,TargetAccountId,NSAccountId,FromDate,ToDate,TrxIds,TrxTypes,StatementHistoryId,LastTrxId,StatusCodes,TrxLines');
			instRec.setFieldValue('custrecord_bgpprocstate', reconAccId+','+acctId+','+nsAccId+','+stEncodedFromDate+','+stEncodedToDate+','+stTrxIds+','+stTrxTypes+','+SHid+',0,'+stStatus+','+stLines);

			var instId = nlapiSubmitRecord(instRec,false);
			// call BG function direct
			nbsABR_CleardownBG(instId, request.getURL(), request.getParameter('custpage_jsid'));

			// redirect to status page
			var slParams = [];
			slParams['processinstanceid'] = instId;
			slParams['title'] = objResources[NBSABRSTR.ACCTINITSTTS];	// 'Account Initialisation Status';
			slParams['process'] = 'account initialisation';
			slParams['accountid'] = reconAccId;
			nlapiSetRedirectURL('SUITELET', 'customscript_nbsabr_reconcilestatus','customdeploy_nbsabr_reconcilestatus', null, slParams);
		}
	}
}

/** ncEP_RenderCleardownForm - page builder for Account Initialisation SL
*
* This function builds the tabs, fields and buttons for the Cleardown window
*
*@param (form) form the current form
*@param	(string) recstate indicates whether action is GET, Refresh, Submit
*@param (array) parameters (field values) from the form
*@param (object) resources object of string translations
*
*/
function nbsABR_RenderCleardownForm(form,recstate,params,resources)
{
	var objResources = resources;
		
	// add field group to make fields line up
	form.addFieldGroup('formfields', 'Fields', null).setShowBorder(false);	
	
	// Reconcile Account  select field
	var fld_bankaccount = form.addField('reconaccount', 'select', objResources[NBSABRSTR.RECONACCT],null,'formfields');	// 'Reconcile Account'
	//var fld_bankaccount = form.addField('reconaccount', 'select',objResources[NBSABRSTR.BNKACCNT],null,'formfields');
	fld_bankaccount.setMandatory(true);
	// 'Select a reconcile account to initialise for ABR.<br>To add an account, navigate to ABR > Lists > Reconcile Accounts.'
	fld_bankaccount.setHelpText(objResources[NBSABRSTR.SELRECONACCTINIT]+'<br>'+objResources[NBSABRSTR.ADDACCTNAV]);

	// populate select list from active reconcile account records
	var filters = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
	var cols = [new nlobjSearchColumn('custrecord_accsetup_accountnumber'),
	            new nlobjSearchColumn('custrecord_accsetup_accountname')];
	cols[1].setSort();	// account name
	
	var bankAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
	// populate options list
	fld_bankaccount.addSelectOption('0', '');
	for(var i =0; bankAccts != null && i < bankAccts.length; ++i)
	{
		var strAccName = bankAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
		var strAccNumber = bankAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
		
		fld_bankaccount.addSelectOption(bankAccts[i].getId(), strAccName+' '+strAccNumber);
	}
	
	// Target Account select field - list is populated by client script
	// must use custpage_ prefix or client function InsertSelectOption gives error!
	var fld_targetaccount = form.addField('custpage_targetaccount', 'select',objResources[NBSABRSTR.NSACCT],null,'formfields');	// 'NetSuite Account'
	fld_targetaccount.setMandatory(true);
	// 'Select an account. If multiple accounts are associated'
	// ' with this reconcile account, repeat the initialisation process for each account.'
	fld_targetaccount.setHelpText(objResources[NBSABRSTR.SELACCTRPTINITPERACCT]);
	
	// From Date
	var fld_fromdate = form.addField('fromdate', 'date',objResources[NBSABRSTR.SELDTFIRSTUNREC],null,'formfields');	// objResources[NBSABRSTR.FRMDT]
	fld_fromdate.setMandatory(true);
	// Select the date of your earliest unreconciled transaction.
	// Transactions dated before this date will be ignored by ABR.
	fld_fromdate.setHelpText(objResources[NBSABRSTR.SELDTFIRSTUNREC]+'<br>'+objResources[NBSABRSTR.TRNBEFOREIGNORE]);

	// To Date (statement date)
	var fld_todate = form.addField('todate', 'date',objResources[NBSABRSTR.SELDTLASTREC],null,'formfields');	// objResources[NBSABRSTR.TDT]
	fld_todate.setMandatory(true);
	// Select the date of your last reconciliation.
	// Transactions dated on and before this date will be marked as previously reconciled.
	fld_todate.setHelpText(objResources[NBSABRSTR.SELDTLASTREC]+'<br>'+objResources[NBSABRSTR.TRNONBEFOREPREVREC]);
	
	// From Date hidden - client scripts can't read from disabled fields!
	var fld_fromdate_hidden = form.addField('fromdate_hidden', 'date','From_hidden',null,'formfields').setDisplayType('hidden');
	
	// To Date (hidden) - client scripts can't read from disabled fields!
	var fld_todate_hidden = form.addField('todate_hidden', 'date','To_hidden',null,'formfields').setDisplayType('hidden');
			
	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');

	if(recstate == 'GET')
	{
		// action
		form.addField('nbsaction','text','Action(hidden)',null,null).setDisplayType('hidden');
	}
	else //Refresh
	{
		var reconAccId = params['reconaccount'];
		var targetAccId = params['custpage_targetaccount'];	
			
		// set reconcile account
		fld_bankaccount.setDefaultValue(reconAccId);
		fld_bankaccount.setDisplayType('inline');
		
		//set target account
		var recTA = nlapiLoadRecord('customrecord_nbsabr_targetaccount',targetAccId);
		var strNum = recTA.getFieldValue('custrecord_nbsabr_ta_accountnumber');
		var strName = recTA.getFieldText('custrecord_nbsabr_ta_accountname');
		if(!isStringEmpty(strNum))
			strName = strNum+' '+strName;
		fld_targetaccount.addSelectOption(targetAccId,strName ,true);
		fld_targetaccount.setDisplayType('inline');
		
		var nsAccId = recTA.getFieldValue('custrecord_nbsabr_ta_accountname');
		// account object
		var objAccount = nbsABR_CreateAccountObject(reconAccId);
		var subsidiaryId = objAccount.subsidiary;
		var b_IsBaseCurr = objAccount.isBaseCurrency;
		
		// get dates from hidden fields as client scripts can't read from disabled fields
		var stFromDate = params['fromdate_hidden'];
		var stToDate = params['todate_hidden'];
		
		/*
		var amountFldId = 'amount';
		if((nbsABR.CONFIG.b_multiCurr) && (!b_IsBaseCurr))
		{
			amountFldId = 'fxamount';
		}
		*/

		/* PJB, 20/08/2013, handle currencies better because of multi-sub currency handling in searches */
		var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency');
		if (nbsABR.CONFIG.b_multiCurr)
			scLocalCurrencyAmount.setFormula('ROUND({fxamount}*{exchangerate},2)');
		else
			scLocalCurrencyAmount.setFormula('{amount}');

		/*
		// hidden field to track amount field name (to pass to client script)
		var fld_amountFieldName = form.addField('custpage_amt_fldname','text','Amount Field Name').setDisplayType('hidden');
		fld_amountFieldName.setDefaultValue(amountFldId);
		*/
		
		// hidden field to track NS Account Id
		var fld_nsaccount = form.addField('nsaccount','select','NetSuite Account','account').setDisplayType('hidden');
		fld_nsaccount.setDefaultValue(nsAccId);
		
		// hidden field to track Last Processed Id
		var fld_lastprocid = form.addField('lastprocid','integer','Last Processed Id',null).setDisplayType('hidden');
						
		if(nbsABR.CONFIG.b_SubsEnabled)
		{
			//Subsidiary
			var fld_subsidiary = form.addField('subsidiary','select',objResources[NBSABRSTR.SUBSID],'subsidiary','formfields').setDisplayType('inline');
			fld_subsidiary.setDefaultValue(subsidiaryId);
		}
		
		fld_fromdate.setDefaultValue(stFromDate);
		fld_todate.setDefaultValue(stToDate);
		//set hidden fields
		fld_fromdate_hidden.setDefaultValue(stFromDate);
		fld_todate_hidden.setDefaultValue(stToDate);

		// Account Balance
		var fld_accountbalance = form.addField('accountbalance', 'currency',objResources[NBSABRSTR.ACCNTBLN],null,'formfields').setDisplayType('disabled');
		fld_accountbalance.setDisplayType('normal');
		fld_accountbalance.setMandatory(true);// true

		// Total Unreconciled
		var fld_totalunrecon = form.addField('totalunrecon', 'currency',objResources[NBSABRSTR.TTLUNRCNCLD],null,'formfields');
		fld_totalunrecon.setDisplayType('disabled');

		// Adjusted Balance
		var fld_endingbalance = form.addField('endingbalance', 'currency',objResources[NBSABRSTR.ADJBLN],null,'formfields');
		fld_endingbalance.setDisplayType('normal');

		// submit button
	//	form.addButton('nbssubmit','Submit',"if (window.isinited && window.isvalid && save_record(true)){setWindowChanged(window, false);main_form.nbsaction.value='Submit';main_form.submit();}");
		form.addButton('nbssubmit',objResources[NBSABRSTR.SBMT],"if (window.isinited && window.isvalid && save_record(true)){setWindowChanged(window, false);main_form.nbsaction.value='Submit';main_form.submit();}");

		// add field with instruction text...
		var fld_Instruction = form.addField('custpage_instructions','inlinehtml','');
		fld_Instruction.setDisplayType('inline');
		// Mark transactions which have already been reconciled so they can be cleared and removed from the outstanding transactions list.
		// Unmark any transactions which are still outstanding (unreconciled) and they will remain available for future reconciliation.
		fld_Instruction.setDefaultValue('<font style="font-size:10pt;"><BR><BR>'+objResources[NBSABRSTR.MKTRNTOCLEAR]+'<BR>'
				+objResources[NBSABRSTR.UNMKTRNIFOS]+'</font>');
		fld_Instruction.setLayoutType('outsidebelow','startrow');

		// Action for POST
		form.addField('nbsaction','text','Action(hidden)',null,null).setDisplayType('hidden');

		// sublist of transactions		
		var gl_List = form.addSubList('gl_list','list',objResources[NBSABRSTR.TRNS]); // make type 'editor' if want to use field changed client script on sublist change  - inline to disabled
		gl_List.addField('trandate','date',objResources[NBSABRSTR.DT]).setDisplayType('inline');
		gl_List.addField('type','text',objResources[NBSABRSTR.TYP]).setDisplayType('inline');
		gl_List.addField('formulatext_1','url',objResources[NBSABRSTR.VW],true).setLinkText(objResources[NBSABRSTR.VW]);
		gl_List.addField('formulatext','text',objResources[NBSABRSTR.NM]).setDisplayType('inline');
		gl_List.addField('tranid','text',objResources[NBSABRSTR.TRNNO]).setDisplayType('inline');
		gl_List.addField('memo','text',objResources[NBSABRSTR.MM]).setDisplayType('inline');
		//gl_List.addField(amountFldId,'currency',objResources[NBSABRSTR.AMT]).setDisplayType('inline');
		gl_List.addField('formulacurrency','currency',objResources[NBSABRSTR.AMT]).setDisplayType('inline');
		gl_List.addField('mark','checkbox',objResources[NBSABRSTR.MK]);
		
		// hidden sublist fields
		gl_List.addField('type_hidden','text','Type').setDisplayType('hidden');
		gl_List.addField('internalid','text','ID').setDisplayType('hidden');
		gl_List.addField('linesequencenumber','integer','LineSN').setDisplayType('hidden');
		gl_List.addField('line','integer','Line').setDisplayType('hidden');
		gl_List.addField('isreversal','checkbox','Is Reversal').setDisplayType('hidden');

		// add Mark All / Unmark All buttons
		// gl_List.addMarkAllButtons();	--- cannot use standard NetSuite function as that DOESN'T trigger line updates, so totals are not recalculated
		gl_List.addButton('custbutton_nbsabr_markall',objResources[NBSABRSTR.MRKLL],'nbsABR_MarkAll(true)');
		gl_List.addButton('custbutton_nbsabr_unmarkall',objResources[NBSABRSTR.UMRKLL],'nbsABR_MarkAll(false)');
		gl_List.addButton('custbutton_nbsabr_exportcsv',objResources[NBSABRSTR.EXPORTCSV],'nbsABR_ExportCSV()');
		
		// populate fields
		//1. account balance	
		var flAccBal = nbsABR_getAccountBalance(nsAccId, stToDate, b_IsBaseCurr,false);
		fld_accountbalance.setDefaultValue(nlapiFormatCurrency(flAccBal));
		fld_endingbalance.setDefaultValue(nlapiFormatCurrency(flAccBal));
		
		// 2. Sublist of transactions
		var filters = [ new nlobjSearchFilter('account',null,'is', nsAccId,null),
		                new nlobjSearchFilter('trandate',null,'within', stFromDate,stToDate)];
		
		var columns = [new nlobjSearchColumn('trandate'),
		               new nlobjSearchColumn('tranid'),
		               new nlobjSearchColumn('memo'),
		               scLocalCurrencyAmount,	//new nlobjSearchColumn(amountFldId),
		               new nlobjSearchColumn('internalid'),
		               new nlobjSearchColumn('linesequencenumber'),
		               new nlobjSearchColumn('line'),
		               new nlobjSearchColumn('isreversal')];
		// sort by date and then by internalid
		columns[0].setSort();		
		columns[4].setSort();	
		
		// search for previous statement records - could be multiple if clearing 1000s of transactions
		// capture last processed id as opening balance transactions could all have the same date
		// so we can search for records with internlid > last processed id
		var lastProcessedId = null;
		var fils = [	new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',reconAccId,null),
		           	new nlobjSearchFilter('custrecord_sh_accntinit',null,'is','T',null)];
		var cols = [new nlobjSearchColumn('custrecord_sh_lastprocid')];
		var shSR = nlapiSearchRecord('customrecord_nbsabr_statementhistory', 'customsearch_nbsabr_statehist_datedesc',  fils, cols);
		if(shSR != null && shSR.length >0)
		{
			lastProcessedId = shSR[0].getValue('custrecord_sh_lastprocid');
			if(!isStringEmpty(lastProcessedId)){
				filters.push(new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastProcessedId,null));
			}
		}
		
		// if trns are NOT voided using reversal journals, don't list voided trns:
		if(nbsCONFIG.reversalvoiding == 'F')
		{
			filters.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
		}
		// View
		var templateURL = /*getBaseURL() +*/ nlapiResolveURL('RECORD','journalentry','-1');
		templateURL = templateURL.replace('journal','transaction');
		templateURL = templateURL.replace('-1','');
		var scURL = new nlobjSearchColumn('formulatext_1');
		scURL.setLabel(objResources[NBSABRSTR.VW]);	// 'View'
		scURL.setFormula("'"+templateURL+"'||{internalid}");
		columns.push(scURL);
		
		// Name
		var scNM = new nlobjSearchColumn('formulatext');
		scNM.setLabel(objResources[NBSABRSTR.NM]);	// 'Name'
		scNM.setFormula('{entity}');
		columns.push(scNM);
		// saved search returns journal entries and intercompany journal entries
		//var results = nlapiSearchRecord('transaction','customsearch_nbsabr_unrecon_gl_all',filters,scURL);
		//var transactions = nlapiSearchRecord('transaction',null,filters,columns);
		
		// use saved search to exclude "unapproved" journals
		var transactions = nlapiSearchRecord('transaction','customsearch_nbsabr_transactions',filters,columns);
	
		gl_List.setLineItemValues(transactions);	// set all rows
		
		var id = 0;
		var l = 0;
		if(transactions != null) l = transactions.length;
		for(var i = 0; i < l; i++)
		{
			id = transactions[i].getId();
			recType = transactions[i].getRecordType();
			gl_List.setLineItemValue('type_hidden',i+1, recType);
			gl_List.setLineItemValue('type',i+1, nbsToTransactionType(recType,objResources));
			gl_List.setLineItemValue('mark',i+1,'T');
		}
		gl_List.setLabel(objResources[NBSABRSTR.TRNS]+' '+l);	// 'Transactions'
		
		fld_lastprocid.setDefaultValue(id);
	}
}

/** nbsABR_ExportCSV - export all rows as CSV
 * 
 * @param {String} reconAccId
 * @param {String} nsAccId
 * @param {String} stFromDate
 * @param {String} stToDate
 * @param {String} subsidId
 * @param {Array} objResources
 */
function nbsABR_ExportCSV(reconAccId,nsAccId,stFromDate,stToDate,subsidId,objResources) {
	var srchResultSet = null;
	
	srchResultSet = initSearch(objResources,nsAccId,stFromDate,stToDate);
	var csvText = buildCSV(srchResultSet,reconAccId,nsAccId,subsidId,objResources);
	var csvFileObj = nlapiCreateFile('ABR_Opening_Transactions.csv','CSV',csvText);

	return csvFileObj;
}

/** initSearch - create and initialise search object using parameters from window
 * 
 * @param {Array} objResources
 * @param {String} nsAccId
 * @param {String} stFromDate
 * @param {String} stToDate
 * @return srchResultSet
 */
function initSearch(objResources,nsAccId,stFromDate,stToDate) {
	// var amountFldId = 'amount';
	var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency');
	if (nbsABR.CONFIG.b_multiCurr)
		scLocalCurrencyAmount.setFormula('ROUND({fxamount}*{exchangerate},2)');
	else
		scLocalCurrencyAmount.setFormula('{amount}');
	
	var filters = [ new nlobjSearchFilter('account',null,'is', nsAccId,null),
	                new nlobjSearchFilter('trandate',null,'within', stFromDate,stToDate)];
	var columns = [new nlobjSearchColumn('trandate'),
	               new nlobjSearchColumn('tranid'),
	               new nlobjSearchColumn('memo'),
	               scLocalCurrencyAmount, 	// new nlobjSearchColumn(amountFldId),
	               new nlobjSearchColumn('internalid'),
	               new nlobjSearchColumn('linesequencenumber'),
	               new nlobjSearchColumn('line'),
	               new nlobjSearchColumn('isreversal'),
	               new nlobjSearchColumn('entity')];
	// sort by date and then by internalid
	columns[0].setSort();		
	columns[4].setSort();	
	
	// if trns are NOT voided using reversal journals, don't list voided trns:
	/* skip for TEST
	if(nbsCONFIG.reversalvoiding == 'F')
	{
		filters.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
	}
	*/

	// Name
	var scNM = new nlobjSearchColumn('formulatext');
	scNM.setLabel(objResources[NBSABRSTR.NM]);	// 'Name'
	scNM.setFormula('{entity}');
	columns.push(scNM);

	var srchObject = nlapiCreateSearch('transaction',filters,columns);
	var srchResultSet = srchObject.runSearch();
	return srchResultSet;
}

/** buildCSV - build CSV from search results and return as a String
 * 
 * @param srchResultSet
 * @param {String} reconAccId
 * @param {String} nsAccId
 * @param {String} subsidiaryId
 * @param {Array} objResources - required for translation of Transaction Type text
 * @return {String}
 */
function buildCSV(srchResultSet,reconAccId,nsAccId,subsidiaryId,objResources) {
	var nsAccName = nlapiLookupField('account',nsAccId,'name');
	var subName = nlapiLookupField('subsidiary',subsidiaryId,'name');
	
	var csvText = 'Rec Account,Ledger Account,Subsidiary,Transaction Type,Transaction Id,Transaction Number,'
				+ 'Transaction Date,Entity,Memo,Amount,Internal Id,Line Sequence,Line\r\n';
	
	/** buildCSVLine - callback function to process each search result
	 * @param {nlobjSearchResult} srchResult
	 * @return {Boolean} whether to continue iterating
	 */
	var cbProcessResult = function buildCSVLine(srchResult) {
		var csvLine = '';
		
		csvLine += reconAccId + ','; // reconcile account
		csvLine += '"' + nsAccName + '",'; // ledger account
		csvLine += '"' + subName + '",'; // subsidiary
		csvLine += nbsToTransactionType(srchResult.getRecordType(),objResources) + ','; // transaction type
		csvLine += nbsToTransactionType(srchResult.getRecordType(),objResources) + ' #' + srchResult.getValue('tranid') + ','; // transaction "id"
		csvLine += srchResult.getValue('tranid') + ',';	// transaction number
		csvLine += srchResult.getValue('trandate') + ','; // transaction date
		csvLine += '"' + srchResult.getValue('formulatext') + '",'; // entity name
		csvLine += '"' + srchResult.getValue('memo') + '",'; // memo
		csvLine += srchResult.getValue('formulacurrency') + ','; // amount
		csvLine += srchResult.getValue('internalid') + ','; // internal id
		csvLine += srchResult.getValue('linesequencenumber') + ','; // line sequence
		csvLine += srchResult.getValue('line') + '\r\n'; // line

		/*
		ABR Status          custrecord_nbsabr_rs_status            1 (Unmatched)
		Record Type         custrecord_nbsabr_rs_recordtype        4 (Opening Position)
		Integrity Status    custrecord_nbsabr_rs_integritystatus   1 (New)
		*/
		
		csvText += csvLine;
		return true;
	};
	
	srchResultSet.forEachResult(cbProcessResult);
	
	return csvText;
}
