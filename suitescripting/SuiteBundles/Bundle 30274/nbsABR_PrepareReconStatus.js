
/** nbsABR_PrepareReconStatusSL - entry point for Prepare Reconciliation Status Scriptlet
*
* This function provides all the functionality for the Prepare Reconciliation Status window
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function nbsABR_PrepareReconStatusSL(request, response)
{
	var form = nlapiCreateForm('Process Status');
	
	//variables not needed now but might be useful if want to extend for other processes
	//var ProcInstId = request.getParameter('processinstanceid');
	//var stTitle = request.getParameter('title');
	//var stProcess = request.getParameter('process');
	//var stAccId = request.getParameter('accountid');
	
	var ProcInstId = '';
	var stTitle = '';
	var stProcess = '';
	var stAccId = '';

	if(stTitle === null && stTitle === '')
		stTitle = 'Process Status';
	if(stProcess == null && stProcess == '')
		stProcess = 'process';
	if(stAccId == null)
		stAccId = '';

	nbsABR_RenderPrepareReconStatusForm(form,'Edit',ProcInstId,stTitle, stProcess,stAccId);
	response.writePage(form);
}

/** nbsABR_RenderReconcileStatusForm - page builder for Process Status SL
*
*@param (form) the current form
*@param	(string) setupState indicates whether action is GET, Refresh, Submit
*@param (string) instanceId internalid of process instance
*@param (string) title of the process being run
*@param (string) process name of the process being run
*@param (string) accountId internalid of Reconcile Account
*
*@return(void)
*/
function nbsABR_RenderPrepareReconStatusForm(form,setupState,instanceId, title,process,accountId)
{
	form.setTitle('Process Status');
	form.setScript('customscript_nbsabr_preparereconstat_c');
	
	//var procList = form.addSubList('proc_list','list',objResources[NBSABRSTR.BNKSTMTTRNS]); //Bank Statement Transactions
	var procList = form.addSubList('proc_list','list','Process'); //
	// fields
	//procList.addField('custrecord_reconacct','text',objResources[NBSABRSTR.ACCT]).setDisplayType('inline');//Reconcile Account
	//procList.addField('custrecord_status','select',objResources[NBSABRSTR.DT],'customlist_ncbgp_processstatus').setDisplayType('inline');//Status
	//procList.addField('custrecord_processid','select',objResources[NBSABRSTR.DT],'customrecord_ncbgp_procinstance').setDisplayType('inline');//Process Id
	//procList.addField('custrecord_new','integer',objResources[NBSABRSTR.TYP]).setDisplayType('inline');//New Transactions
	//procList.addField('custrecord_updated','integer',objResources[NBSABRSTR.VW],true).setDisplayType('inline');//Updated Transactions
	//procList.addField('custrecord_percentcomplete','integer',objResources[NBSABRSTR.REF]).setDisplayType('inline');//Percent Complete
	//procList.addField('custrecord_results','url',objResources[NBSABRSTR.TRNNO]).setLinkText(objResources[NBSABRSTR.VW]);//Search Results?
	
	procList.addField('custrecord_process','text','Process').setDisplayType('inline');//Process name
	procList.addField('custrecord_view','url','View',true).setLinkText('View');//Process Id
	procList.addField('custrecord_processid','select','Process Id','customrecord_ncbgp_procinstance').setDisplayType('inline');//Process Id
	procList.addField('custrecord_reconacctname','text','Account').setDisplayType('inline');//Reconcile Account Name
	procList.addField('custrecord_reconacct','select','Account','customrecord_nbsabr_accountsetup').setDisplayType('hidden');//Reconcile Account
	procList.addField('custrecord_status','select','Status','customlist_ncbgp_processstatus').setDisplayType('inline');//Status
	procList.addField('custrecord_new','integer','New').setDisplayType('inline');//New Transactions
	procList.addField('custrecord_existing','integer','Existing').setDisplayType('inline');//Updated Transactions
	procList.addField('custrecord_updated','integer','Updated').setDisplayType('inline');//Updated Transactions
	procList.addField('custrecord_exceptions','integer','Exceptions').setDisplayType('inline');//Updated Transactions
	procList.addField('custrecord_recordcount','integer','Processed').setDisplayType('inline');//Record count
	procList.addField("custrecord_resultslink", 'url', 'Results',true).setLinkText('Results');	
	
	//Branding
	var fld_Branding = form.addField('moduletitle','inlinehtml');
	fld_Branding.setDisplayType('inline');
	fld_Branding.setDefaultValue('<font color="navy"><BR><B>Advanced Bank Reconciliation</B>, by Nolan Business Solutions</font>');
			
	form.addSubmitButton('Refresh');
	form.addButton('help','Help','nbsABR_Help()');
	
	var sf = [];
	sf[0] = new nlobjSearchFilter('custrecord_bgpfunctionname',null,'startswith', 'nbsABR_ExtractTransactionsBG',null);
	sf[1] = new nlobjSearchFilter('isinactive',null,'is','F');
	sf[2] = new nlobjSearchFilter('created',null,'on', 'today',null); // in progress
	
	var sc = new Array();
	sc[0] = new nlobjSearchColumn('custrecord_bgpprocstatus');
	sc[1] = new nlobjSearchColumn('custrecord_bgpstatedefn');
	sc[2] = new nlobjSearchColumn('custrecord_bgpprocstate');
	sc[3] = new nlobjSearchColumn('custrecord_bgpreccount');
	sc[4] = new nlobjSearchColumn('custrecord_bgpusername');
	sc[5] = new nlobjSearchColumn('custrecord_bgpprocmsg');
	sc[6] = new nlobjSearchColumn('custrecord_bgpprocessname');
	sc[7] = new nlobjSearchColumn('internalid').setSort(true);// sort by internalid DESC 

	var instRecs = nlapiSearchRecord('customrecord_ncbgp_procinstance',null,sf,sc);
//	var dtDate = null;
	for(var i = 0;instRecs !== null &&  i < instRecs.length; i+=1)
	{ 
		var procId = instRecs[i].getId();	
		var rProcessInfo = instRecs[i];
		var procStatus = rProcessInfo.getValue('custrecord_bgpprocstatus');
		//procStatusText = rProcessInfo.getText('custrecord_bgpprocstatus');
		var l_RecordCount = rProcessInfo.getValue('custrecord_bgpreccount');
		var intExisting = '';
		var intNew = '';
		var intUpdated = '';
		var intExceptions = '';
		var objNumOf = {};//var objNumOf = {"intNew":0,"intExisting":0,"intUpdated":0,"intExceptions":0};
		var procFnName = rProcessInfo.getValue('custrecord_bgpprocessname');
		var processName = '';
		var reconAccId = '';
		var strAcctName = '';
		var stEncodedCutOffDate = '';
//		var stCutOffDate = '';
		var stEncodedToDate = '';
		var stToDate = '';
		
		switch(procFnName)
		{
			case 'ABR Reconciliation':
				processName = 'Reconcile';
				break;
			case 'ABR Import Bank File':
				processName = 'Import Statement';
				break;
			case 'ABR DeleteReconciliation':
				processName = 'Delete Reconciliation';
				break;
			case 'ABR Proposal':
				processName = 'Automatch';
				break;
			case 'ABR Extract':
				processName = 'Extract Transactions';
				break;	
			default:
				processName = '';
		}
		/* retrieve list for processing, and current status info */
		var tmpStr = rProcessInfo.getValue('custrecord_bgpstatedefn');
		if (tmpStr == null)
			tmpStr = "";
		var pNames = tmpStr.split('|');
		tmpStr = rProcessInfo.getValue('custrecord_bgpprocstate');
		if (tmpStr == null)
			tmpStr = "";
		var pValues = tmpStr.split('|');
		
		if (pNames.length == pValues.length) {
			for ( var pN = 0; pN < pNames.length; ++pN) {
				switch (pNames[pN]) {
				case 'ReconAcct':
					reconAccId = pValues[pN];
					var fldNames = ['custrecord_accsetup_accountnumber','custrecord_accsetup_accountname'];
					var fldValues = nlapiLookupField('customrecord_nbsabr_accountsetup',reconAccId,fldNames);
					if (fldValues === null) {
						strAcctName = '(Account Deleted or not found)';
					} else {
						if((fldValues['custrecord_accsetup_accountnumber']===null) || (fldValues['custrecord_accsetup_accountnumber']=='')){
							strAcctName = fldValues['custrecord_accsetup_accountname'];
						}
						else{
							strAcctName = fldValues['custrecord_accsetup_accountnumber']+' '+fldValues['custrecord_accsetup_accountname'];
						}
					}
					break;
				/*
				case 'CutOffDate':
					stEncodedCutOffDate = pValues[pN];
					var dtDate = ncDecodeDate(stEncodedCutOffDate);
					stCutOffDate = nlapiDateToString(dtDate);
					break;
				*/
				case 'ToDate':
					stEncodedToDate = pValues[pN];
					var dtToDate = ncDecodeDate(stEncodedToDate);
					stToDate = nlapiDateToString(dtToDate);
					nlapiLogExecution('debug', ' nbsABR_LoadSearchResultstToDate ', stToDate);
					break;
				case 'TrgtAccts':
					var stTmp = pValues[pN];
					if (!isStringEmpty(stTmp))
						arrTrgtAcctIds = stTmp.split(':');
					break;
				case 'LastProcessedId':
					lastProcessedId = parseInt(pValues[pN], 10);
					break;
				
				case 'NumberOf':
					var stTmp = pValues[pN];
					objNumOf = JSON.parse(stTmp);//convert JSON string into JavaScript object
					
					intNew = objNumOf.intNew;
					intExisting = objNumOf.intExisting;
					intUpdated = objNumOf.intUpdated;
					intExceptions = objNumOf.intExceptions;
					break;
				
				default:
					// do nothing
				}
			}
		} else {
			// all gone wrong - gracefully abort (and log values?)
			nlapiLogExecution('ERROR', 'nbsABR_RenderPrepareReconStatusForm ', 'parameter values blank, aborting');
			// write error to page?
		}
				
		procList.setLineItemValue('custrecord_process',i+1,processName);
		procList.setLineItemValue('custrecord_reconacctname',i+1,strAcctName);
		procList.setLineItemValue('custrecord_reconacct',i+1,reconAccId);
		procList.setLineItemValue('custrecord_status',i+1,procStatus);
		procList.setLineItemValue('custrecord_processid',i+1,procId);
		var procURL = /*getBaseURL() +*/ nlapiResolveURL('RECORD','customrecord_ncbgp_procinstance',procId);
		procList.setLineItemValue('custrecord_view',i+1,procURL);	
		procList.setLineItemValue('custrecord_new',i+1,intNew.toString());
		procList.setLineItemValue('custrecord_existing',i+1,intExisting.toString());
		procList.setLineItemValue('custrecord_updated',i+1,intUpdated.toString());
		procList.setLineItemValue('custrecord_exceptions',i+1,intExceptions.toString());
		procList.setLineItemValue('custrecord_recordcount',i+1,l_RecordCount);

		var stParams = '&nsAcctIds='+arrTrgtAcctIds.join(':')+'&CutOffDate='+stEncodedCutOffDate+'&ToDate='+stEncodedToDate;
		//var srURL = getBaseURL() + nlapiResolveURL('SUITELET', 'customscript_nbsabr_loadsrchrslts','customdeploy_nbsabr_loadsrchrslts', null)+'&procId='+procId;
		var srURL = /*getBaseURL() +*/ nlapiResolveURL('SUITELET', 'customscript_nbsabr_loadsrchrslts','customdeploy_nbsabr_loadsrchrslts', null)+stParams;
		procList.setLineItemValue('custrecord_resultslink',i+1,srURL);	
						
	}//for		
}
/** nbsABR_LoadSearchResult - entry point for Load Search Result Scriptlet
*
* This function provides all the functionality for the Load Search Result window
* Suitelet used to load search object and redirect to search results
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function nbsABR_LoadSearchResult(request, response)
{
	//process instance id used to limit results to new only
	var arrTrgtAcctIds = request.getParameter('nsAcctIds').split(':');
/*	
	var stEncodedCutOffDate = request.getParameter('CutOffDate');
	var dtDate = ncDecodeDate(stEncodedCutOffDate);
	var stCutOffDate = nlapiDateToString(dtDate);
*/	
	var stEncodedToDate = request.getParameter('ToDate');
	var dtToDate = ncDecodeDate(stEncodedToDate);
	var stToDate = nlapiDateToString(dtToDate);
	nlapiLogExecution('debug', ' nbsABR_LoadSearchResultstToDate ', stToDate);

	//var rsSearch = nlapiLoadSearch('customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_preparedtrns');
	//var fils = [new nlobjSearchFilter( 'custrecord_nbsabr_rs_processid',null, 'anyof', procId, null )];
	
	var rsSearch = nlapiLoadSearch('customrecord_nbsabr_reconciliationstate', 'customsearch_nbsabr_rs_auditlist');
	//var fils = [new nlobjSearchFilter( 'account','custrecord_nbsabr_rs_internalid', 'anyof', arrTrgtAcctIds, null),
	           // new nlobjSearchFilter( 'custrecord_nbsabr_rs_trndate',null, 'after', stCutOffDate, null),
	          //  new nlobjSearchFilter( 'custrecord_nbsabr_rs_status',null, 'noneof', nbsABR.CL.STATUS.RECONCILED, null),
	          //  new nlobjSearchFilter( 'custrecord_nbsabr_rs_trndate',null, 'onorbefore', stToDate, null)];
	// Override filters from previous search
	rsSearch.addFilter(new nlobjSearchFilter( 'account','custrecord_nbsabr_rs_internalid', 'anyof', arrTrgtAcctIds, null));
	rsSearch.addFilter( new nlobjSearchFilter( 'custrecord_nbsabr_rs_trndate',null, 'onorbefore', stToDate, null));
	//rsSearch.setFilters(fils);
	var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency','custrecord_nbsabr_rs_internalid');
	if (nbsABR.CONFIG.b_multiCurr) {
		scLocalCurrencyAmount.setFormula('ROUND({custrecord_nbsabr_rs_internalid.fxamount}*{custrecord_nbsabr_rs_internalid.exchangerate},2)');
		scLocalCurrencyAmount.setLabel('Amount (Local Currency)');
	} else {
		scLocalCurrencyAmount.setFormula('{custrecord_nbsabr_rs_internalid.amount}');
		scLocalCurrencyAmount.setLabel('Amount');
	}
	rsSearch.addColumn(scLocalCurrencyAmount);
	rsSearch.setRedirectURLToSearchResults();  
}


