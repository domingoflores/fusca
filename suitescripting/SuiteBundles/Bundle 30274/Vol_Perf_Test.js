/** Suitelet and background script for volume performance tests
 * 
 */

/** entry point for suitelet (user interface) for tests
 * @param {nlobjRequest} request - server request
 * @param {nlobjResponse} response - response object
 */
function nbsABR_VolPerfTest_SL(request, response) {
	var form = nlapiCreateForm('Advanced Bank Reconciliation Performance Tests');
	var requestParams = null;
	
	if (request.getMethod() == 'POST') {
		requestParams = {};
		requestParams['custpage_nbsabr_reconacct'] = request.getParameter('custpage_nbsabr_reconacct');
		requestParams['file'] = request.getFile('file');
		requestParams['url'] = request.getURL();
		requestParams['custpage_jsid'] = request.getParameter('custpage_jsid');
		nbsABR_RunTest(requestParams);
	}

	nbsABR_RenderForm(form, requestParams);
	response.writePage(form);
}

/** method to build the suitelet form, adding fields and setting default values as required
 * 
 * @param {nlobjForm} form - NetSuite form object which becomes the page
 * @param {Object} requestParams - object containing current parameter values
 * @param {[String]} errors - array of error messages
 */
function nbsABR_RenderForm(form, requestParams, errors) {
    // attach client script
	form.setScript('customscript_nbsabr_reconsteps_c');

	// field to hold local session id, updated on every page refresh - required for calling background etc.
	var jsidField = form.addField('custpage_jsid', 'text', 'JSESSIONID:');
	jsidField.setDisplayType('hidden');
	
	form.addSubmitButton('Perform Tests');

	var fld_ReconAcct = form.addField('custpage_nbsabr_reconacct','select','Reconcile Account',null);
	fld_ReconAcct.setHelpText('Select the Reconcile Account to work with throughout this screen.');
	fld_ReconAcct.addSelectOption('', '', false);	// add blank option, so user has to change selection causing scripts to fire
	fld_ReconAcct.setDefaultValue('');

	var fld_file = form.addField('file','file','Statement File');
	fld_file.setHelpText('Click Browse... to select the file you have downloaded from your bank or lending institution.');
	
	/* now add values to select lists */
	// populate list of bank accounts from list of account setup records
	var filters = [new nlobjSearchFilter('isinactive',null,'is','F',null)];
	var cols = [new nlobjSearchColumn('custrecord_accsetup_accountname'),
	            new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
	cols[0].setSort();
	
	var bankAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
	// populate account options list
	for(var i =0; bankAccts != null && i < bankAccts.length; ++i)
	{
		var strAccName = bankAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
		var strAccNumber = bankAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
		if ((strAccName) || (strAccNumber))	// skip if both blank
			fld_ReconAcct.addSelectOption(bankAccts[i].getId(), strAccName+' '+strAccNumber, false);
	}
	
	if (requestParams !== null) {
		// set values
		fld_ReconAcct.setDefaultValue(requestParams['custpage_nbsabr_reconacct']);
		
		/* may replace with performance info? ...
		// add Process Instance information - processes from the current day, descending (most recent at top)
		var sf = [];
		sf[0] = new nlobjSearchFilter('custrecord_bgpfunctionname',null,'startswith', 'nbsABR',null);
		sf[1] = new nlobjSearchFilter('isinactive',null,'is','F');
		sf[2] = new nlobjSearchFilter('created',null,'on','today');
		var sc = new Array();
		sc[0] = new nlobjSearchColumn('custrecord_bgpprocstatus');
		sc[1] = new nlobjSearchColumn('custrecord_bgpstatedefn');
		sc[2] = new nlobjSearchColumn('custrecord_bgpprocstate');
		sc[3] = new nlobjSearchColumn('custrecord_bgpreccount');
		sc[4] = new nlobjSearchColumn('custrecord_bgpusername');
		sc[5] = new nlobjSearchColumn('custrecord_bgpprocmsg');
		sc[6] = new nlobjSearchColumn('custrecord_bgpprocessname');
		sc[7] = new nlobjSearchColumn('internalid');
		sc[7].setSort(true);// sort by internalid DESC

		var instRecs = nlapiSearchRecord('customrecord_ncbgp_procinstance',null,sf,sc);
		
		if ((instRecs !== null) && (instRecs.length > 0)) {
			var sublist_Procs = form.addSubList('custpage_processes','staticlist','Recent ABR Processes');
			sublist_Procs.addField('custrecord_bgpprocessname','text','Process');
			//sublist_Procs.addField('custrecord_bgpprocstatus','select','Status','customlist_ncbgp_processstatus').setDisplayType('inline');
			sublist_Procs.addField('custrecord_bgpprocstatus_display','text','Status');
			sublist_Procs.addField('custrecord_bgpreccount','integer','Records Processed');
			sublist_Procs.addField('custrecord_bgpprocmsg','text','Message Text');
			sublist_Procs.addField('custrecord_bgpusername','text','User');
			sublist_Procs.setLineItemValues(instRecs);
		}
		... */
	}
}

/** method to initiate the test
 * 
 * @param {Object} params - object containing 'custpage_nbsabr_reconacct' and 'file' properties
 */
function nbsABR_RunTest(params) {
	var objFile = params.file;
	var folderId = null;
    var f_foldername = new nlobjSearchFilter('name', null, 'startswith','ABR Import Files');
    var recFolder = nlapiSearchRecord('folder',null,[f_foldername],null);
    if(recFolder != null && recFolder.length >0){
    	folderId = recFolder[0].getId();
	}
	objFile.setFolder(folderId);
	var stFileName = objFile.getName();

	if( (objFile.getType() == 'MISCBINARY') || ((objFile.getType() == 'PLAINTEXT') && (stFileName.indexOf('.txt') == -1)))
	{
		objFile.setName(stFileName+'.txt');
	}   				
	// create file and upload it to the file cabinet
    var fileId = nlapiSubmitFile(objFile);		    		
	
    // determine accountId - search and get first account for the Reconcile Account
    var accountId = '';
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive',null, 'is','F'));
	filters.push(new nlobjSearchFilter('custrecord_nbsabr_ta_reconacc',null, 'anyof',[params['custpage_nbsabr_reconacct']]));
	var columns = new Array();
	columns.push(new nlobjSearchColumn('custrecord_nbsabr_ta_accountnumber'));
	columns.push(new nlobjSearchColumn('custrecord_nbsabr_ta_accountname'));
	columns[1].setSort();	// accountname
	var recs = nlapiSearchRecord('customrecord_nbsabr_targetaccount',null,filters,columns);
	if ((recs !== null) && (recs.length > 0))
		accountId = recs[0].getId();
    
	// create bank statement header record
	var recBankStatement = nlapiCreateRecord('customrecord_nbsabr_bankstatement');
	recBankStatement.setFieldValue('custrecord_bs_reconaccount',params['custpage_nbsabr_reconacct']);
	var bankStatementId = nlapiSubmitRecord(recBankStatement,false);
		    			
	// create a new instance, then set parameter to instance name and call script....
	var ctx = nlapiGetContext();
    var subsidiaryId = nlapiLookupField('customrecord_nbsabr_accountsetup',params['custpage_nbsabr_reconacct'],'custrecord_accsetup_subsidiary');

    var intCount = 0;

    var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
	instRec.setFieldValue('custrecord_bgpprocstatus', '5');	// Queued
	instRec.setFieldValue('custrecord_bgpactivitytype', '3');	// Planned
	instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_VolPerfTest_BG');
	instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Performance Test');
	// retrieve and set current user id
	instRec.setFieldValue('custrecord_bgpuserid', ctx.getUser());// user id, store as text - no permission issues!
	instRec.setFieldValue('custrecord_bgpusername', ctx.getName());// user name
	instRec.setFieldValue('custrecord_bgpscrptqnmbr', '1');// script queue number
	instRec.setFieldValue('custrecord_bgpsubsidiary', subsidiaryId);
	/* update process record */
	instRec.setFieldValue('custrecord_bgpreccount', '0');
	instRec.setFieldValue('custrecord_bgpprocmsg', '');
	instRec.setFieldValue('custrecord_bgpstatedefn',  'FileId;Account;Subsidiary;Count;BSId;LastImportDate;StatementDate');
	instRec.setFieldValue('custrecord_bgpprocstate', fileId+';'+accountId+';'+subsidiaryId+';'+intCount+';'+bankStatementId+';0/0/0000;0/0/0000');

	var instId = nlapiSubmitRecord(instRec,false);

	// invoke background processing
	var scriptParams = {};
	scriptParams[ncConst.BGP_FunctionNameParam] = 'nbsABR_VolPerfTest_BG';
	scriptParams['QNmbr'] = '1';

	var l_msgtext = nbsABR_InvokeBackgroundProcessing(params['url'], params['custpage_jsid'], scriptParams);
	nlapiLogExecution('debug','l_msgtext',l_msgtext);
}

/** entry point for background (scheduled) script to run tests
 * 
 */
function nbsABR_VolPerfTest_BG(procId) {
	var _failurePoint = '';
	var fNames = null;
	var fValues = null;

	try {
		/* retrieve script parameters --> process id */
		_failurePoint = 'Retrieve script parameters';

		var currentContext = nlapiGetContext();

		if (procId == null)
			return; // nothing to do - no process record to determine status or log events against

		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';

		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')
			return; // nothing to do

		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);
		var l_QNmbr = rProcessInfo.getFieldValue('custrecord_bgpscrptqnmbr');
		if (isStringEmpty(l_QNmbr))
			l_QNmbr = '1';

		/* retrieve file contents list for processing, and current status info */
		var tmpStr = rProcessInfo.getFieldValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split(';');
		tmpStr = rProcessInfo.getFieldValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split(';');
		var arrBankStatementLines = null;
		var fileId = null; // internal id of file in File Cabinet
		var objFile = null; // loaded file object
		var stContents = null;// file contents as string
		var accountId = null;// Reconcile Account
		var subsidiaryId = '1';
		var intCount = null;
		var bankStatementId = null;
		var stDateFormat = 'yymmdd';
		var stLastImportDate = null;
		var dtLastImportDate = null; // date of last imported bank trx
		var stStmntDate = null;
		var dtStmntDate = null;
		var bDateOK = false; // is date of bank trx on or after Last Date
		// var bAccIdentifier = false; 
		// 03 record must include an account number. If Currency Code is blank, default is USD
		var stCurrCode = null;
		
		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'FileId':
					fileId = pValues[pN];
					break;
				case 'Account':
					accountId = pValues[pN];
					break;
				case 'Subsidiary':
					subsidiaryId = pValues[pN];
					break;
				case 'Count':
					intCount = ncParseIntNV(pValues[pN], 0);
					break;
				case 'BSId':
					bankStatementId = pValues[pN];
					break;
				case 'LastImportDate':
					stLastImportDate = pValues[pN];
					break;
				case 'StatementDate':
					stStmntDate = pValues[pN];
					break;
				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('error', 'nbsBGP_ImportFileBGG', 'parameter values blank, aborting');

			fNames = new Array();
			fNames[0] = 'custrecord_bgpprocmsg';
			fNames[1] = 'custrecord_bgpprocstatus';
			fNames[2] = 'custrecord_bgpactivitytype';
			fValues = new Array();
			fValues[0] = 'parameter values blank, aborting';
			fValues[1] = '4'; // status 4 = failed
			fValues[2] = '3'; // activity type 3 = planned schedule

			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);

			return;
		}

		nlapiLogExecution('debug','load file',new Date());
		_failurePoint = 'load imported file';
		objFile = nlapiLoadFile(fileId);
	
		stContents = normalize(objFile.getValue());
		var importLines = stContents.split('\n');
		
		// clear old objects
		objFile = null;
		stContents = null;
		
		var targAcctFlds = nlapiLookupField('customrecord_nbsabr_targetaccount',accountId,['custrecord_nbsabr_ta_reconacc','custrecord_nbsabr_ta_accountname']);
		var reconAccId = targAcctFlds['custrecord_nbsabr_ta_reconacc'];
		var ledgerAccId = targAcctFlds['custrecord_nbsabr_ta_accountname'];
		nlapiLogExecution('debug','start file processing',new Date());
		// each line will consist of: Trn Date,Trn Number,Trn Reference,Trn Amount,Stmt Date,Stmt Cheque Number,Stmt Reference,Stmt Amount
		// first line is header with those column names
		// last line has file totals; skip top and bottom lines
		var lineValues = null;
		var lineObj = {
				TrnDate : null,
				TrnNumber : null,
				TrnReference : null,
				TrnAmount : null,
				StmtDate : null,
				StmtChqNum : null,
				StmtReference : null,
				StmtAmount : null
		};
		var priorDate = new Date(0);
		var minDate = null;
		var maxDate = null;
		var jrnTotal = 0.0;
		var jrnLine = 1;
		var jrnRec = null;
		var recBankStatementLine = null;
		var grandTotal = 0.0;
		var maxLine = importLines.length - 1;
		for (var i = 1; i < maxLine; ++i) {
			// process the line - parse values, push to journal, push to statement
			// on change of date, new journal ... need balancing entry on old journal
			// all to same statement
			
			lineValues = parseCSV(importLines[i]);
			lineObj.TrnDate = nbsABR_ImportedStringToDate('dd/mm/yyyy',lineValues[0]);
			lineObj.TrnNumber = lineValues[1];
			lineObj.TrnReference = lineValues[2];
			lineObj.TrnAmount = parseFloat(lineValues[3]);
			lineObj.StmtDate = nbsABR_ImportedStringToDate('dd/mm/yyyy',lineValues[4]);
			lineObj.StmtChqNum = lineValues[5];
			lineObj.StmtReference = lineValues[6];
			lineObj.StmtAmount = parseFloat(lineValues[7]);
			
			if (lineObj.TrnDate.valueOf() != priorDate.valueOf()) {
				if (jrnRec !== null) {
					// balance and commit old journal
					jrnTotal = Math.round(jrnTotal * 100.00) / 100.00;
					if (jrnTotal > 0)
						jrnRec.setLineItemValue('line', 'credit', jrnLine, jrnTotal);
					else
						jrnRec.setLineItemValue('line', 'debit', jrnLine, jrnTotal);
					jrnRec.setLineItemValue('line', 'account', jrnLine, ledgerAccId);
					jrnRec.setLineItemValue('line', 'memo', jrnLine, 'clearing entry');
					nlapiSubmitRecord(jrnRec);
				}
				
				// create new journal
				jrnRec = nlapiCreateRecord('journalentry');
				jrnTotal = 0.0;
				jrnLine = 1;
				// set journal headers
				jrnRec.setFieldValue('subsidiary', subsidiaryId);
				jrnRec.setFieldValue('trandate', nlapiDateToString(lineObj.TrnDate));
				
				priorDate = lineObj.TrnDate;
				if ((minDate === null) || (priorDate < minDate))
					minDate = priorDate;
				if ((maxDate === null) || (priorDate > maxDate))
					maxDate = priorDate;
			}
			
			// add journal line
			jrnTotal += lineObj.TrnAmount;
			grandTotal += lineObj.TrnAmount;
			if (lineObj.TrnAmount > 0)
				jrnRec.setLineItemValue('line', 'debit', jrnLine, lineObj.TrnAmount);
			else
				jrnRec.setLineItemValue('line', 'credit', jrnLine, lineObj.TrnAmount);
			jrnRec.setLineItemValue('line', 'account', jrnLine, ledgerAccId);
			jrnRec.setLineItemValue('line', 'memo', jrnLine, lineObj.TrnReference);
			jrnLine++;
			
			// create bank statement line record
			recBankStatementLine = nlapiCreateRecord('customrecord_nbsabr_bankstatementline');
			recBankStatementLine.setFieldValue('custrecord_bsl_bankstatementid', bankStatementId);
			recBankStatementLine.setFieldValue('custrecord_bsl_subsidiary', subsidiaryId);
			recBankStatementLine.setFieldValue('custrecord_bsl_reconaccount', reconAccId);
			
			if (lineObj.StmtAmount > 0) {
				recBankStatementLine.setFieldValue('custrecord_bsl_creditamt', lineObj.StmtAmount);
			}
			if (lineObj.StmtAmount < 0) {
				recBankStatementLine.setFieldValue('custrecord_bsl_debitamt', lineObj.StmtAmount);
			}
			recBankStatementLine.setFieldValue('custrecord_bsl_amount', lineObj.StmtAmount);
			recBankStatementLine.setFieldValue('custrecord_bsl_checknumber', lineObj.StmtChqNum);
			recBankStatementLine.setFieldValue('custrecord_bsl_reference', lineObj.StmtReference);
			recBankStatementLine.setFieldValue('custrecord_bsl_date', nlapiDateToString(lineObj.StmtDate));

			nlapiSubmitRecord(recBankStatementLine, false);

			nbsABR_CheckGovernance(procId, false);
		}
		nlapiSubmitField('customrecord_nbsabr_bankstatement',bankStatementId,'custrecord_bs_statementdate',nlapiDateToString(maxDate));
		nlapiLogExecution('debug','end file processing',new Date());
		
		// ********************************************************************************************************
		// now we need to Extract the new journals
		maxDate = new Date(maxDate.valueOf()+86400000); // 60 x 60 x 24 x 1000 = 1 day in milliseconds

		var stCutOffDate = nlapiDateToString(minDate);
		var stToDate = nlapiDateToString(maxDate);
		var lastProcessedId = 0;//internalid of last processed NetSuite transaction - used for rescheduling new transaction processing
		var lastRSId = 0;//internalid of recon state - used for rescheduling of integrity processing of existing recon state recs
		var arrExistRStateIds = [];//array to cache existing transaction internalids
		var objExistRStateIds = {};	// object to cache existing transaction internalids
		var arrRStates = [];//array to cache existing recon state objects
		var objNumOf = {"intNew":0,"intExisting":0,"intUpdated":0,"intExceptions":0};
		var k = 0;// index for current recon state record in list

		// create account object
		var objReconAcct = nbsABR_CreateAccountObject(reconAccId);
		var b_IsBaseCurr = objReconAcct.isBaseCurrency;
		var amountFldId = 'amount';
		if((nbsABR.CONFIG.b_multiCurr) && (!b_IsBaseCurr))
		{
			amountFldId = 'fxamount';
		}
		var arrAcctIds = objReconAcct.targetaccts;
		
		/* PJB, 20/08/2013, handle currencies better because of multi-sub currency handling in searches */
		var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency');
		var scLocalCurrAmtWithJoin = new nlobjSearchColumn('formulacurrency','custrecord_nbsabr_rs_internalid');
		if (nbsABR.CONFIG.b_multiCurr) {
			scLocalCurrencyAmount.setFormula('ROUND({fxamount}*{exchangerate},2)');
			scLocalCurrAmtWithJoin.setFormula('ROUND({custrecord_nbsabr_rs_internalid.fxamount}*{custrecord_nbsabr_rs_internalid.exchangerate},2)');
		} else {
			scLocalCurrencyAmount.setFormula('{amount}');
			scLocalCurrAmtWithJoin.setFormula('{custrecord_nbsabr_rs_internalid.amount}');
		}
		
		ncBGP_WriteToLog(procId, '', 'Searching for existing extracts', 'Message'); // 30
			
		nlapiLogExecution('debug','begin extract caching',new Date());
		_failurePoint = 'cache existing extracts';
		//search for existing reconciliation state records ordered by internalid ASC
							
		var searchRS = nlapiLoadSearch( 'customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_extract_transactions');
				
		searchRS.addFilter(new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null, 'anyof',[reconAccId]));
		searchRS.addFilter(new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null, 'after',stCutOffDate));
		searchRS.addFilter(new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null, 'onorbefore',stToDate));
		searchRS.addFilter(new nlobjSearchFilter('internalidnumber',null, 'greaterthan',lastRSId));

		//var srchFilters = searchRS.getFilters();
		// cache existing reconciliation state records in array
		var resultSet = null;
		var ferCount = 0;
		var srchIncomplete = true;
		var maxIterations = 1000;	// must not iterate over more than 4000
		do {
			resultSet = searchRS.runSearch(); //returns ALL
			
			resultSet.forEachResult(
					function(sr) {
						ferCount++;
						var recId = sr.getId();
						lastRSId = recId;
						// object to encapsulate existing extract
			 			var objRS = {
			 					rsid:recId,
			 					reconacct:reconAccId,
			 					rsamt:sr.getValue('custrecord_nbsabr_rs_amount'),
			 					rsdate:sr.getValue('custrecord_nbsabr_rs_trndate'),
			 					rsline:sr.getValue('custrecord_nbsabr_rs_linenumber'),
			 					status:sr.getValue('custrecord_nbsabr_rs_status'),
			 					nstran:sr.getValue('custrecord_nbsabr_rs_internalid'),//list
			 					nsid:sr.getValue('custrecord_nbsabr_rs_trn_internalid'),//text
			 					nsamt:sr.getValue(scLocalCurrAmtWithJoin),	// sr.getValue(amountFldId,'custrecord_nbsabr_rs_internalid'),
			 					nsdate:sr.getValue('trandate','custrecord_nbsabr_rs_internalid'),
			 					nsline:sr.getValue('linesequencenumber','custrecord_nbsabr_rs_internalid'),
			 					
			 			};		
						objExistRStateIds[objRS.nsid] = arrRStates.length;	// store index of next element, by id
			 			arrRStates.push(objRS);
						arrExistRStateIds.push(objRS.nsid);
						return (ferCount < maxIterations);	// return false to abort iteration if reached max
					} );

			srchIncomplete = (ferCount >= maxIterations);
			
			if (srchIncomplete) {
				var searchFilters = searchRS.getFilters();
				for (var j=0;searchFilters !==null && j < searchFilters.length; j+=1) {
				
					if (searchFilters[j].getName() == 'internalidnumber') {
						searchFilters[j] = new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastRSId);
					}
				}
				//set filters to search again
				searchRS.setFilters(searchFilters);
				// reset count too
				ferCount = 0;
			}
 			nbsABR_CheckGovernance(procId, true);	// force a yield here, to reset the script instruction count
 			
 			srchIncomplete = false;	// for testing purposes, only pull the first batch, so consistent baseline (once maxed out)
		} while (srchIncomplete); // (resultSet.getResults(0, 1).length != 0);
		
		//set number of pre-existing records
		objNumOf.intExisting = arrRStates.length;
		var l_RecordCount = 0;

		nlapiLogExecution('debug','begin integrity check',new Date());
		_failurePoint = 'begin integrity check';
		ncBGP_WriteToLog(procId, '', 'Running integrity check on extracts', 'Message'); // 30
		//iterate thru array and
		//	1. search for associated NS trn
		//	2. if found, run integrity check
		//	3. else, delete extract
		// currently this process iterates through the reconcile state objects and performs an individual transaction search for each one! 
		// performance wise not great especially as they could be multi-line journals.
		// batching the searches would make the code too complicated
		// however splitting the process into 2 steps; journals & transfers and all other transaction types would improve performance
		// as a joined search could be empolyed for all transaction types other than journals and transfers
		
		// pre-define filters and columns so not redefining every time through the loop!
		var sfTargetAccounts = new nlobjSearchFilter('account',null, 'anyof',arrAcctIds);
		var sfNotVoided = new nlobjSearchFilter('voided',null,'is', 'F',null);
		var srchCols = [new nlobjSearchColumn(amountFldId),
		               	new nlobjSearchColumn('trandate'),
		               	new nlobjSearchColumn('linesequencenumber'),
		               	new nlobjSearchColumn('memo'),
		            	new nlobjSearchColumn('tranid'),
		            	new nlobjSearchColumn('entity'),
		            	new nlobjSearchColumn('type')];
		if(nbsABR.CONFIG.b_SubsEnabled){
			srchCols.push(new nlobjSearchColumn('subsidiary'));
		}
		srchCols.push(scLocalCurrencyAmount);	// PJB, 20/08/2013, fix currency amount handling
		
		while( (k < arrRStates.length))
		{
			var nsTrnInternalid = arrRStates[k].nstran;
			var rsInternalid = arrRStates[k].rsid;
			var nsRecFound = false;
					
			if(!isStringEmpty(nsTrnInternalid)){
				// search for the original NS transaction
				// use search not load as search columns names are consistent across trn types
				var filters = [	new nlobjSearchFilter('internalid',null, 'is',nsTrnInternalid), sfTargetAccounts ];// need this filter to filter out other lines 
				if(nbsCONFIG.reversalvoiding == 'F'){
					filters.push(sfNotVoided);
				}
		 		var srTrns = nlapiSearchRecord('transaction',null,filters,srchCols);
		 		
		 		if((srTrns !== null) && (srTrns.length > 0)){
		 			
		 			//debugLog(show, 'running integrity check on NS trn', arrRStates[k].nstran+' : '+ arrRStates[k].rsline);
		 				 			
		 			//if journal, multiple lines may be returned	
					// can't filter by line number so iterate through results until find the right line
					var len = srTrns.length;
			 		for(var i=0; i<len;i+=1)
			 		{
			 			// var l_amt = srTrns[i].getValue(amountFldId);			// PJB, 20/08/2013, fix currency amount handling
			 			var l_amt = srTrns[i].getValue(scLocalCurrencyAmount);	// PJB, 20/08/2013, fix currency amount handling
			 			var l_date = srTrns[i].getValue('trandate');
			 			var l_line = srTrns[i].getValue('linesequencenumber');
			 			var l_type = srTrns[i].getRecordType();
			 							 
			 			if((l_type == 'journalentry') && (l_line !=  arrRStates[k].rsline)){
			 				continue;
			 			}
			 		
			 			nsRecFound = true;
			 			arrRStates[k].new_nsamt = l_amt;
			 			arrRStates[k].new_nsdate = l_date;
			 			arrRStates[k].new_nsline = l_line;
			 			arrRStates[k].trntype = l_type;			 			
		 			
			 			_failurePoint = 'integrity check on NS transaction id: '+nsTrnInternalid+', extract id: '+rsInternalid;	
			 			var recRS = nbsABR_RunIntegrityCheck(arrRStates[k],procId,objNumOf,rsInternalid);
			 			if(recRS !== null){
			 				nlapiSubmitRecord(recRS);
			 			}
			 		}
		 		}
			}
			if (!nsRecFound){
				//reference to NS tran is missing and must have been deleted, so delete this extract
	 			_failurePoint = 'delete extract for missing NetSuite transaction';	
	 			nlapiLogExecution('AUDIT', 'Deleting extract: ',rsInternalid);
	 			
				nlapiDeleteRecord('customrecord_nbsabr_reconciliationstate', rsInternalid);
				
				objNumOf.intUpdated +=1;
			}
	 		l_RecordCount +=1;
			k +=1;
	 		
			//update count on process instance
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);
			
			nbsABR_CheckGovernance(procId);	// , (k%100)==0);	// force yield every 100 rows	
		}
		
		_failurePoint = 'searching for new NetSuite transactions';	
		nlapiLogExecution('debug','begin new transaction search',new Date());
		ncBGP_WriteToLog(procId, '', 'Searching for new transactions', 'Message'); // 30
	
		var fils = [ new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastProcessedId, null),
		             new nlobjSearchFilter('account',null,'anyof', arrAcctIds,null),
		             new nlobjSearchFilter('trandate',null,'after', stCutOffDate),
		             new nlobjSearchFilter('trandate',null, 'onorbefore',stToDate),];
		if(nbsABR.CONFIG.reversalvoiding == 'F'){
			fils.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
		}
		var srTrns = null;
		do{
			srTrns = nlapiSearchRecord('transaction','customsearch_nbsabr_newtrns_ordbyid',fils,[scLocalCurrencyAmount]);	// PJB, 20/08/2013, fix currency amount handling
			
			for(var i =0; srTrns !== null && i < srTrns.length; i+=1)
			{
				var l_id = srTrns[i].getId();
				lastProcessedId = l_id;
				var l_type = srTrns[i].getRecordType();
				var l_abrTrnType = nbsToTranTypeListValue(l_type);
				
				// create reconciliation state if non exists
				// if(!inArray(l_id,arrExistRStateIds)){
				if ((objExistRStateIds[l_id] === undefined)) {
						 				
					var recRS = nlapiCreateRecord('customrecord_nbsabr_reconciliationstate');
					recRS.setFieldValue('custrecord_nbsabr_rs_internalid', l_id);
					recRS.setFieldValue('custrecord_nbsabr_rs_trn_internalid', l_id);
					if (l_abrTrnType.indexOf(':') < 0)
						recRS.setFieldValue('custrecord_nbsabr_rs_trantype', l_abrTrnType);
					recRS.setFieldValue('custrecord_nbsabr_rs_status', ABR_CL.STATUS.UNMATCHED);
					recRS.setFieldValue('custrecord_nbsabr_rs_recordtype', ABR_CL.RECTYPE.NSTRANS); //NetSuite Transaction
					recRS.setFieldValue('custrecord_nbsabr_rs_integritystatus', ABR_CL.INTEGRITY.NEW);//New
					recRS.setFieldValue('custrecord_nbsabr_rs_reconacc', reconAccId);
					if(amountFldId == 'fxamount'){
						recRS.setFieldValue('custrecord_nbsabr_rs_isfc', 'T');
					}
					recRS.setFieldValue('custrecord_nbsabr_rs_targetacc', srTrns[i].getValue('account'));
					// recRS.setFieldValue('custrecord_nbsabr_rs_amount', srTrns[i].getValue(amountFldId));			// PJB, 20/08/2013, fix currency amount handling
					recRS.setFieldValue('custrecord_nbsabr_rs_amount', srTrns[i].getValue(scLocalCurrencyAmount));	// PJB, 20/08/2013, fix currency amount handling
					recRS.setFieldValue('custrecord_nbsabr_rs_trndate', srTrns[i].getValue('trandate'));
					recRS.setFieldValue('custrecord_nbsabr_rs_linenumber', srTrns[i].getValue('linesequencenumber'));
					recRS.setFieldValue('custrecord_nbsabr_rs_memo', srTrns[i].getValue('memo'));
					recRS.setFieldValue('custrecord_nbsabr_rs_subsidiary', srTrns[i].getValue('subsidiary'));
					recRS.setFieldValue('custrecord_nbsabr_rs_tranid', srTrns[i].getValue('tranid'));
					// recRS.setFieldValue('custrecord_nbsabr_rs_entity', srTrns[i].getValue('entity'));
					recRS.setFieldValue('custrecord_nbsabr_rs_entityname', srTrns[i].getText('entity'));
					recRS.setFieldValue('custrecord_nbsabr_rs_processid', procId);
	 							
					try{
						_failurePoint = 'submitting Reconciliation Status record';
						nlapiSubmitRecord(recRS);
										
						objNumOf.intNew +=1;
						++l_RecordCount; // increment overall count of records
						
						nbsABR_CheckGovernance(procId);	
						
					}
					catch(GE){
						var msg = l_type + 'id= ' + l_id + ' - ';
						if (GE instanceof nlobjError)
							msg += GE.getCode() + '\n' + GE.getDetails();
						else
							msg += GE.toString();
	
						nlapiLogExecution('debug', 'Failure Point', _failurePoint);
						nlapiLogExecution('Error', 'Unhandled Exception', msg);
						
						throw msg;
					}
		 		}
			}
		
			// update count on process instance
			nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpreccount', l_RecordCount, false);
		
			fils[0] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastProcessedId, null);
		}while(srTrns !== null && lastProcessedId > 0)
		
		nlapiLogExecution('debug','end extract processing',new Date());
		_failurePoint = 'Updating records prior to completion';
		// really finished - update process instance record for completion
		
		fNames = [];
		fNames[0] = 'custrecord_bgpreccount';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fNames[3] = 'custrecord_bgpstatedefn';
		fNames[4] = 'custrecord_bgpprocstate';
		fValues = [];
		fValues[0] = l_RecordCount.toString();
		fValues[1] = '2'; // status 2 = completed
		fValues[2] = '3'; // activity type 3 = planned schedule
		fValues[3] = 'NumberOf';
		fValues[4] =  JSON.stringify(objNumOf);

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// update last extract date on reconcile account
		nlapiSubmitField('customrecord_nbsabr_accountsetup',reconAccId,'custrecord_accsetup_lastextractdate',stToDate);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Extract complete', 'Message'); // 30
		
		// ********************************************************************************************************
		// Now try to match extracted transactions to statement lines
		var intMatchNumber = null;
		var stMatchNumId = null;
		var bUseReconRules = true;
		var bMatchFound = false;
		var arrRules = [];
		var lastId = '0';

		// retrieve last match number for this account
		_failurePoint = 'retrieve last match number';
		var SF = [ new nlobjSearchFilter('isinactive', null, 'is', 'F', null), new nlobjSearchFilter('custrecord_nbsabr_lmn_reconacct', null, 'is', reconAccId, null) ];
		var SC = [ new nlobjSearchColumn('custrecord_lmn_matchnumber') ];
		var SR = nlapiSearchRecord('customrecord_nbsabr_lastmatchnumber', null, SF, SC);
		if (SR != null && SR.length > 0) // should only be one!!
		{
			intMatchNumber = parseInt(SR[0].getValue('custrecord_lmn_matchnumber'), 0);
			stMatchNumId = SR[0].getId();
		} else {
			// create match number record if none found.
			var recMatchNum = nlapiCreateRecord('customrecord_nbsabr_lastmatchnumber', null);
			recMatchNum.setFieldValue('custrecord_nbsabr_lmn_reconacct', reconAccId);

			stMatchNumId = nlapiSubmitRecord(recMatchNum, true, true);
			intMatchNumber = 1;
		}

		// retrieve bank statement lines with empty match numbers
		var bslSFs = [ new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastId, null),
				new nlobjSearchFilter('custrecord_bsl_reconaccount', null, 'is', reconAccId, null),
				new nlobjSearchFilter('custrecord_bsl_date', null, 'within', stCutOffDate, stToDate),
				new nlobjSearchFilter('custrecord_bsl_matchnumber', null, 'isempty', null, null) ];
		// Inactive is false
		// reconciled statement is None
		// loop through list of bank transactions and for each one try and a matching GL transaction
		_failurePoint = 'iterating through bank statement lines';
		var bsLines = null;
		var bAbort = false;
		nlapiLogExecution('debug','begin auto-match processing',new Date());
		do {
			// retrieve a set of search results (statement lines)
			bsLines = nlapiSearchRecord('customrecord_nbsabr_bankstatementline', 'customsearch_nbsabr_banktrx_orderedbyid', bslSFs, null);
			// for each statement line - find matching GL trxs
			for (var i = 0; (bsLines !== null) && (i < bsLines.length) && !bAbort; ++i) {
				bMatchFound = false;

				var bslId = bsLines[i].getId();
				lastId = bslId;

				var flAmount = ncParseFloatNV(bsLines[i].getValue('custrecord_bsl_amount'), 0);
				var stDate = bsLines[i].getValue('custrecord_bsl_date');
				var stDoc = bsLines[i].getValue('custrecord_bsl_checknumber');
				if(stDoc === null) stDoc = '';
				var stRef = bsLines[i].getValue('custrecord_bsl_reference');
				var stBSLType = bsLines[i].getValue('custrecord_bsl_type');
				var stGLId = null;
				var stGLType = '';
				var lineNum = null;

				var glSFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_amount', null, 'equalto', flAmount) ];
				glSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc', null, 'is', reconAccId));
				glSFs.push(new nlobjSearchFilter('custrecord_nbsabr_rs_trndate', null, 'onorbefore', stDate));

				var glTrxSR = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_reconstate_outstndng', glSFs, null);

				if (glTrxSR != null && glTrxSR.length > 0) {
					bMatchFound = true;
					// match found - grab earliest trx by trandate
					stGLId = glTrxSR[0].getId();
					//stGLType = glTrxSR[0].getRecordType();
					//stIsReversal = glTrxSR[0].getValue('isreversal');
					lineNum = ncParseIntNV(glTrxSR[0].getValue('custrecord_nbsabr_rs_linenumber'), 0);
				}

				if (bMatchFound) {
					intMatchNumber += 1;
					
					try{
						var fieldNames = ['custrecord_nbsabr_rs_matchnumber', 'custrecord_nbsabr_rs_status'];		
						var fieldValues = [intMatchNumber, nbsABR.CL.STATUS.MATCHED];		
						_failurePoint = 'updating match number on recon state';
						nlapiSubmitField('customrecord_nbsabr_reconciliationstate', stGLId, fieldNames, fieldValues, false);
					
						_failurePoint = 'updating match number on bank transaction';
						nlapiSubmitField('customrecord_nbsabr_bankstatementline', bslId, 'custrecord_bsl_matchnumber', intMatchNumber, false);
					}
					catch(e){
						throw(e);
					}
				}

				nbsABR_CheckGovernance(procId);	
			}
			
			// reset search filter so next pass we pick up where we left off, not from the start
			bslSFs[0] = new nlobjSearchFilter('internalidnumber', null, 'greaterthan', lastId, null);
		} while ((bsLines !== null) && (bsLines.length > 0) && !bAbort);
		nlapiLogExecution('debug','end auto-match processing',new Date());
		
	} catch (GE) {
		var msg = '';
		if (((GE instanceof nlobjError) || (typeof(GE) == 'object')) && (GE.getStackTrace !== undefined) && (typeof(GE.getStackTrace) == 'function'))
	    {
			msg = GE.getCode() + ' - ' + GE.getDetails();
			if (GE.getCode().indexOf('UNEXPECTED_ERROR') > -1)
				msg += '. Error Id:'+GE.getId();
			var ST = GE.getStackTrace();
			// nlobjError.getStackTrace() is documented as returning an array, but always seems to return a single string...
			if ((typeof(ST) !== 'undefined') && (ST !== null))
			{
				if (typeof(ST) == 'string')
					msg += '<BR>at '+ST;
				else	// in case we ever do get an array...
					for (var nST = 0; nST < ST.length; ++nST)
						if (ST[nST] !== undefined)
							msg += '<BR>at '+ST[nST];
			}
		}
	    else
	        msg = GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);
		nlapiLogExecution('debug', 'Failure Point', _failurePoint);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = 'Exception: ' + msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);
		// log activity
		ncBGP_WriteToLog(procId, '', 'Volume test failed:' + msg.substr(0,280), 'Error');
	}
}
