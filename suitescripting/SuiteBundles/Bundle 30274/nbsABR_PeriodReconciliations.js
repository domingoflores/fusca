/** nbsABR_PeriodReconciliationsSL - entry point for Period Reconciliations SL 
 * 
 * User is prompted to select a reconcile account.
 * Window refreshes and lists all reconciliation statements (excl. account initialisations)
 * Each line includes a link to the associated closing balance report and audit report.
 *  
 * @param request {nlobjRequest}
 * @param response {nlobjResponse}
 */

function nbsABR_PeriodReconciliationsSL(request, response)
{
	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
	
	// create form and attach client script
	var form = nlapiCreateForm(objResources[NBSABRSTR.PRDRECONS]);	// 'Period Reconciliations'
	form.setScript('customscript_nbsabr_preparerecons_c');
	
	if (request.getMethod() == 'GET')
	{
		nbsABR_RenderPeriodReconciliationsForm(form,'GET',null,objResources);
		response.writePage(form);
	}
	else	// returning from user submit/refresh
	{
		if(request.getParameter('main_action') == 'Refresh')
		{
			var Params = [];
			Params['reconAccountId'] = request.getParameter('reconaccount');
			nbsABR_RenderPeriodReconciliationsForm(form,'POST',Params,objResources);
			response.writePage(form);
		}
		else // 
		{
			
		}
	}
}

/** nbsABR_RenderPeriodReconciliationsForm - page builder for Period Reconciliations
*
* This function builds the tabs, fields and buttons for the Period Reconciliations window
*
*@param (form) the current form
*@param	(string) indicates whether action is GET, Refresh, Submit
*@param (array) parameters (field values) from the form
*@param (object) object containing string translations
*/
function nbsABR_RenderPeriodReconciliationsForm(form,requesttype,parameters,resources)
{
	var reconAccountId;
//	var mainAction;
	var objResources = resources;

	form.addField('main_action','text','Action(hidden)',null,null).setDisplayType('hidden');
	
	// select Reconcile Account
	//var fld_reconaccount = form.addField('reconaccount', 'select',objResources[NBSABRSTR.BNKACCNT],null,null);
	var fld_reconaccount = form.addField('reconaccount', 'select',objResources[NBSABRSTR.ACCNT]);	// 'Account'
	// Select an account to view period reconciliations.<BR>
	// 'Clicking the Audit link will initiate the generation of a reconciliation audit report that checks NetSuite transaction amount'
	// ' against reconciled extract amount. The PDF generated report only lists discrepancies.'
	fld_reconaccount.setHelpText(objResources[NBSABRSTR.SLCTACCTVWPRREC] + '<BR>' + objResources[NBSABRSTR.AUDITLNKPDFRPT]);

	//search & populate list of reconcile accounts
	var sf = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
	var sc = [ new nlobjSearchColumn('custrecord_accsetup_accountname'),
	          new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
	sc[0].setSort();	// accountname
		
	var reconAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, sf, sc);
	// populate account options list
	fld_reconaccount.addSelectOption('', '');
	for(var i =0; reconAccts != null && i < reconAccts.length; ++i)
	{
		var strAccName = reconAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
		var strAccNumber = reconAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
		fld_reconaccount.addSelectOption(reconAccts[i].getId(), strAccName+' - '+strAccNumber);
	}
	
	var fld_Branding = form.addField('moduletitle','inlinehtml','');
	//Advanced Bank Reconciliation, by Nolan Business Solutions Plc
	fld_Branding.setDefaultValue('<BR><BR><font color="navy"><B>'+objResources[NBSABRSTR.ABR]+'</B>, '+objResources[NBSABRSTR.BYNBS]+'</font>');
	fld_Branding.setLayoutType('outsidebelow','startrow');
		
	if(requesttype == 'POST')
	{	
		reconAccountId = parameters['reconAccountId'];
		fld_reconaccount.setDefaultValue (reconAccountId);
			
		var subL_Recons = form.addSubList('reconlist','list',objResources[NBSABRSTR.RECONS]);	// 'Reconciliations'
		subL_Recons.addField('internalid','integer',objResources[NBSABRSTR.ID]);	// 'ID'
		subL_Recons.addField('custrecord_sh_date','date',objResources[NBSABRSTR.STMTDT]);	// 'Statement Date'
		subL_Recons.addField('custrecord_sh_ns_actualbalance','currency',objResources[NBSABRSTR.NSBAL]);	// 'NetSuite Balance'
		subL_Recons.addField('custrecord_sh_ns_balance','currency',objResources[NBSABRSTR.NSABRBAL]);	// 'NSABR Balance'
		subL_Recons.addField('custrecord_sh_difference','currency',objResources[NBSABRSTR.DIFF]);	// 'Difference'
		subL_Recons.addField('custrecord_sh_ns_unreconciled','currency',objResources[NBSABRSTR.UNRECON]);	// 'Unreconciled'
		subL_Recons.addField('custrecord_sh_ns_adjbalance','currency',objResources[NBSABRSTR.ADJBLN]);	// 'Adjusted Balance'
		subL_Recons.addField('custrecord_sh_bk_balance','currency',objResources[NBSABRSTR.STMTBLN]);	// 'Statement Balance'
		subL_Recons.addField('custrecord_sh_bk_unreconciled','currency',objResources[NBSABRSTR.UNRECON]);	// 'Unreconciled'
		subL_Recons.addField('custrecord_sh_bk_adjbalance','currency',objResources[NBSABRSTR.ADJBLN]);	// 'Adjusted Balance'
		subL_Recons.addField('custrecord_sh_report','url',objResources[NBSABRSTR.CLSNGBAL],true).setLinkText(objResources[NBSABRSTR.RPT]);	// 'Closing Balance', link: 'Report'
		subL_Recons.addField('custrecord_sh_audit','url',objResources[NBSABRSTR.AUDIT],true).setLinkText(objResources[NBSABRSTR.AUDIT]);	// 'Audit'	
		
		var SFs = [	new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',reconAccountId,null),
		           	new nlobjSearchFilter('isinactive',null,'is','F'),
		           	new nlobjSearchFilter('custrecord_sh_accntinit',null,'is','F')];
		var SCs = [	new nlobjSearchColumn('custrecord_sh_date'),
		           	new nlobjSearchColumn('internalid'),
		           	new nlobjSearchColumn('custrecord_sh_startdate'),
		           	new nlobjSearchColumn('custrecord_sh_ns_balance'),
		        	new nlobjSearchColumn('custrecord_sh_ns_adjbalance'),
		           	new nlobjSearchColumn('custrecord_sh_ns_unreconciled'),
		           	new nlobjSearchColumn('custrecord_sh_bk_balance'),
		           	new nlobjSearchColumn('custrecord_sh_bk_adjbalance'),
		           	new nlobjSearchColumn('custrecord_sh_bk_unreconciled'),
		           	new nlobjSearchColumn('internalid')];
		SCs[0].setSort(true);	// sh_date
		SCs[1].setSort(true);	// internalid
		
		//'<div style="color:#FF0000">'||TO_CHAR((DECODE({custrecord_sh_ns_unreconciled},0,NULL,{custrecord_sh_ns_unreconciled})),'99,999.99')||'</div>'
		
		//accept 1000 record limit - hopefully I'll be dead before anyone does a 1000 bank recs!
		var SRecs = nlapiSearchRecord('customrecord_nbsabr_statementhistory', null,  SFs, SCs);//10u
		subL_Recons.setLineItemValues(SRecs);	
		
		//get recon account obj so we can get nominal accounts and if base currency 
		var objReconAcct = nbsABR_CreateAccountObject(reconAccountId);//17u
		var arrAccts = objReconAcct.targetaccts;//array of nominal accounts
		var b_IsBaseCurr = objReconAcct.isBaseCurrency;
		
		// url to Closing Balance Report
		var rprtURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_closingbalreport','customdeploy_nbsabr_closingbalreport', null);
		
		//get report preference
		var intMaxNumOfStmnts = 50;
		var cnfgSF = new nlobjSearchFilter('isinactive', null, 'is', 'F', null);
		var cnfgSC = [ new nlobjSearchColumn('custrecord_abr_config_maxnumstmnts')];
		var cnfgSR = nlapiSearchRecord('customrecord_nbsabr_config', null, cnfgSF, cnfgSC);
		if (cnfgSR !== null && cnfgSR.length > 0) {
			intMaxNumOfStmnts = ncParseIntNV(cnfgSR[0].getValue('custrecord_abr_config_maxnumstmnts'),50);
		}
		
		// add sublist data
		for(var i=0; SRecs != null && i< Math.min(SRecs.length,intMaxNumOfStmnts);i+=1)
		{
			var strStmntDate = SRecs[i].getValue('custrecord_sh_date');
			var flNS_balance = ncParseFloatNV(SRecs[i].getValue('custrecord_sh_ns_balance'),0);
			
			// calculate actual balance as of statement date			 
			 var flActualBal = nbsABR_getAccountBalance(arrAccts,strStmntDate,b_IsBaseCurr,false);//10u	 
			 subL_Recons.setLineItemValue('custrecord_sh_ns_actualbalance',i+1,flActualBal);
			 
			 // calculate difference
			 var flDiff = nbsArithmetic('-', flNS_balance, flActualBal);
			 subL_Recons.setLineItemValue('custrecord_sh_difference',i+1,flDiff);
			 
			 // set link to closing balance report
			 var stmntid = SRecs[i].getId();
			 var strParams = '&nbs_action=print&accountid=' + reconAccountId + '&stmntdate=' + stmntid;
			 subL_Recons.setLineItemValue('custrecord_sh_report',i+1,rprtURL+strParams);
			 
			 // set link to audit report suitelet
			// var strStartDate = SRecs[i].getValue('custrecord_sh_startdate');
			// var auditURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_reconaudit','customdeploy_nbsabr_reconaudit', null);
			// var strAuditParams = '&FromDate='+strStartDate +'&ToDate='+strStmntDate+'&ReconAcctId='+reconAccountId+'&Accts='+strAccts;
			// subL_Recons.setLineItemValue('custrecord_sh_audit',i+1,auditURL+strAuditParams);
			 
			 //set link to report status SL
			 var tmpDate = SRecs[i].getValue('custrecord_sh_startdate');
			 if(tmpDate == ''){// cleardown?
				 tmpDate = nlapiDateToString(new Date());
			 }
			 var strStartDate = ncEncodeDate(nlapiStringToDate(tmpDate));
			 var strEndDate = ncEncodeDate(nlapiStringToDate(strStmntDate));
			 var strStmntId = SRecs[i].getValue('internalid');
			 
			 var statusURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_reportstatus_sl','customdeploy_nbsabr_reportstatus', null);
			 var strStatusParams = '&FromDate='+strStartDate +'&ToDate='+strEndDate+'&ReconAcctId='+reconAccountId+'&StmntId='+strStmntId;
			 subL_Recons.setLineItemValue('custrecord_sh_audit',i+1,statusURL+strStatusParams);
		}
	}
}
/** nbsABR_ReportStatusSL - entry point for Audit Report Status SL 
 *  
 *   Calls scheduled script to generate the report.
 *   Only administrators can run scheduled scripts so wrap schedule script function in suitelet wrapper 
 *   to permit non-administrator users to call nlapiScheduleScript.
 *   
 * @param request (nlobjRequest)
 * @param response (nlobjResponse)
 */
function nbsABR_ReportStatusSL(request, response)
{
	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
	var form = nlapiCreateForm(objResources[NBSABRSTR.ADTRPTSTTS],true);	// 'Audit Report Status'
	var procInstId = '';
	
	if (request.getMethod() == 'GET')
	{
		var ctx = nlapiGetContext();
		var userId = ctx.getUser();
		var rqParams = request.getAllParameters();
		var reconAcctId = rqParams['ReconAcctId'];
		
		var subsidiaryId = '';
		if(nbsABR.CONFIG.b_SubsEnabled){
			subsidiaryId = nlapiLookupField('customrecord_nbsabr_accountsetup',reconAcctId,'custrecord_accsetup_subsidiary');
		}
		
		// create a new process instance, then set parameter to instance name and call script....
		var instRec = nlapiCreateRecord(ncConst.BGP_ProcessInstance);
		instRec.setFieldValue('custrecord_bgpprocstatus', '5');		// Queued
		instRec.setFieldValue('custrecord_bgpactivitytype', '1');	// Direct
		instRec.setFieldValue('custrecord_bgpfunctionname', 'nbsABR_GetReportData');
		instRec.setFieldValue('custrecord_bgpprocessname', 'ABR Audit Report');
		instRec.setFieldValue('custrecord_bgpuserid', userId);
		instRec.setFieldValue('custrecord_bgpusername', ctx.getName());
		instRec.setFieldValue('custrecord_bgpscrptqnmbr', '1');// script queue number
		instRec.setFieldValue('custrecord_bgpsubsidiary', subsidiaryId);
		instRec.setFieldValue('custrecord_bgpreccount', '0');
		instRec.setFieldValue('custrecord_bgpprocmsg', '');
		instRec.setFieldValue('custrecord_bgpstatedefn',  'ReconAcctId,StmntId,FromDate,ToDate');
		instRec.setFieldValue('custrecord_bgpprocstate',  rqParams['ReconAcctId']+','+rqParams['StmntId']+','+ rqParams['FromDate']+','+rqParams['ToDate']);
						
		procInstId = nlapiSubmitRecord(instRec,false);
		
		var scParams = [];
		scParams['custscript_nbsabr_reconacctid'] = rqParams['ReconAcctId'];
		scParams['custscript_nbsabr_reconstmntid'] = rqParams['StmntId'];
		scParams['custscript_nbsabr_fromdate'] = rqParams['FromDate'];
		scParams['custscript_nbsabr_todate'] = rqParams['ToDate'];
		scParams['custscript_nbsabr_userid'] = userId;
		scParams['custscript_nbsabr_procid'] = procInstId;
		
		// call scheduled script - this suitelet is already deployed with "Execute As Role: Administrator", so we can schedule directly...
		var l_msgtext = nlapiScheduleScript('customscript_nbsabr_buildauditrpt','customdeploy_nbsabr_buildauditrpt',scParams);
		/*
		var BGPscriptURL = nlapiResolveURL('SUITELET', 'customscript_nbsabr_bgp_starter', 'customdeploy_nbsabr_bgp_starter', true);
		var BGPscriptResp = nlapiRequestURL(BGPscriptURL, null, scParams); // params now passed as custom headers
		l_msgtext = BGPscriptResp.getBody();
		*/
		if (l_msgtext === null)
			l_msgtext = 'Script or deployment invalid (inst:1)';
		else
			l_msgtext = 'Instance One: ' + l_msgtext;
	
		nlapiLogExecution('debug', 'l_msgtext', l_msgtext);
		
		nbsABR_RenderReportStatusForm(form,'New',procInstId,objResources);
		response.writePage(form);
	}
	else	// returning from user submit
	{
		var strAction = request.getParameter('hidden_action');
		procInstId = request.getParameter('processinstanceid');
		
		if( strAction == 'OK' ){
			// click OK to redirect to Home page
			var stJS = "window.location='/app/center/card.nl?sc=-29'";
			var stHTML = '<html><body><script type="text/javascript">' + stJS + '</script></body></html>';
			response.write(stHTML);
		}
		if( strAction == 'Refresh' ){
			
			procInstId = request.getParameter('processinstanceid');
						
			nbsABR_RenderReportStatusForm(form,'Edit',procInstId,objResources);
			response.writePage(form);
		}
	}
}

/** nbsABR_RenderReportStatusForm - page builder for Audit Report Status SL
 *
 * This function builds the tabs, fields and buttons for the System Status window
 *
 * @param (nlobjform) the current form
 * @param (string) setupState indicates whether creating a 'New' record or doing an 'Edit'
 *
 */
function nbsABR_RenderReportStatusForm(form,setupState,instanceId,objResources)
{	
	var fld_text = form.addField('custpage_text','inlinehtml','');
	
	// adding a hidden field for POST calls
	var hiddenAction = form.addField('hidden_action', 'text', 'hidden');
	hiddenAction.setDisplayType('hidden');
	hiddenAction.setDefaultValue('');
	
	// adding a hidden field to hold the record's ID value
	// this will be used for POST calls
	var fld_instid = form.addField('processinstanceid', 'text', 'hidden',null,null);
	fld_instid.setDisplayType('hidden');
	fld_instid.setDefaultValue(instanceId);
	
	var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance,instanceId);
	var procStatus = rProcessInfo.getFieldValue('custrecord_bgpprocstatus');
	var l_RecordCount = rProcessInfo.getFieldValue('custrecord_bgpreccount');
	var procMsg = rProcessInfo.getFieldValue('custrecord_bgpprocmsg');
	var strStatusMsg = '';
	//var strUpdateMsg = '';
	
	//set process status
	switch( procStatus.toString() )
	{
		case '1':	// in progress
			/*
			strStatusMsg += '<font style="font-size:x-small; color:navy"><BR><b>Processing Report....</b>'+l_RecordCount+' record(s) have been processed.'
				+'<BR><BR>This report may take some time to process. To monitor progress, please click the Refresh button.'
				+'<BR>A recocnciliation audit checks NetSuite transaction amount against reconciled extract amount for differences.'
				+'The PDF generated report only lists discrepancies.<br>'
				+'You will be notified by email when your audit is complete.</font>';
			*/
			strStatusMsg += '<font style="font-size:x-small; color:navy"><BR><b>'+objResources[NBSABRSTR.PRCSSRPT]+'</b> '
						 + objResources[NBSABRSTR.NUMRECSPROC].replace('<#reccount>',l_RecordCount.toString())
						 + '<BR><BR>'+objResources[NBSABRSTR.RPTTIMERFRSH]+'<BR>'+objResources[NBSABRSTR.RECONADTDESC]
						 + '<BR>'+objResources[NBSABRSTR.PDFRPTDIFF]+'<BR>'+objResources[NBSABRSTR.NTFYBYEMAIL]+'</font>';
				
			// 'Refresh'
			form.addButton('refresh',objResources[NBSABRSTR.RFRSH],"if (window.isinited && window.isvalid && save_record(true)){main_form.hidden_action.value='Refresh';main_form.submit();}");
			break;
		case '2':	// complete
			// Your report is <b>complete</b> and will be attached to the notification email.
			strStatusMsg += '<font style="font-size:x-small; color:navy"><BR>'+objResources[NBSABRSTR.RPTCMPLTEMAIL]+'</font>';
			break;
		case '3':
			strStatusMsg = objResources[NBSABRSTR.CMPLTERR];	// 'Completed with errors';
			break;
		case '4'://failed
			strStatusMsg = '<font style="font-size:x-small; color:navy"><BR><b>'+objResources[NBSABRSTR.FLD]+' : </b>'+procMsg+'</font>';	// Failed
			var fld_processRecLink = form.addField('processlink','inlinehtml','',null,null);
			var recLinkURL = nlapiResolveURL('RECORD', 'customrecord_ncbgp_procinstance', instanceId);
			// 'Click <#linkstart>here<#linkend> to view process logs' - NBSABRSTR.LNKPROCLOG
			var linkTxt = objResources[NBSABRSTR.LNKPROCLOG].replace('<#linkstart>','<B><A HREF="'+recLinkURL+'">').replace('<#linkend>', '</A></B>');
			fld_processRecLink.setDefaultValue('<BR>' + linkTxt +'<BR>');
			break;
		case '5':	// queued
			// strStatusMsg = '<font style="font-size:x-small; color:navy"><BR><B>Report pending....</B><BR><BR>This report may take some time to process. To monitor progress, please click the Refresh button.</font>';
			strStatusMsg = '<font style="font-size:x-small; color:navy"><BR><B>'+objResources[NBSABRSTR.PNDNG]+'....</B><BR><BR>'
						 + objResources[NBSABRSTR.RPTTIMERFRSH]+'</font>';
			form.addButton('refresh',objResources[NBSABRSTR.RFRSH],"if (window.isinited && window.isvalid && save_record(true)){main_form.hidden_action.value='Refresh';main_form.submit();}");	// 'Refresh'
			break;
		case '6':	// complete: no data available
			// <B>Completed: No Data Available</B><BR><BR>No discrepancies have been found between NetSuite transactions and the related extracted records for the reconciliation period selected.
			strStatusMsg = '<font style="font-size:x-small; color:navy"><BR><B>'+objResources[NBSABRSTR.CMPLTNODATA]+'</B><BR><BR>'
						 + objResources[NBSABRSTR.NODISCREPFOUND]+'</font>';
			break;
		default:
			strStatusMsg = objResources[NBSABRSTR.NRCRDFND];	// 'No record found';
	}
		
	fld_text.setDefaultValue(strStatusMsg);
		
	form.addButton('ok','OK',"if (window.isinited && window.isvalid && save_record(true)){main_form.hidden_action.value='OK';main_form.submit();}");
}

/** nbsABR_PeriodReconciliationAuditSL - entry point for Period Reconciliation Audit Report Scriptlet NOT IN USE
*
* This function provides all the functionality for the Load Search Result window
* Suitelet used to load search object and redirect to search results
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
/*function nbsABR_PeriodReconciliationAuditSL(request, response)
{
	var ctx = nlapiGetContext();
	// get JS object of resources
	//var objResources = nbsTRANSL_getResources(ctx);
	
	var form = nlapiCreateForm('Reconciliation Audit');
	//var grp_main = form.addFieldGroup('main', 'Main', null);
	//grp_main.setShowBorder(false);
	
	var strFromDate = request.getParameter('FromDate');
	var strToDate = request.getParameter('ToDate');
	var strReconAcctId = request.getParameter('ReconAcctId');
	var strAccts = request.getParameter('Accts');
	var arrAccts = strAccts.split(':');
		
	//Reconcile Account
	var fld_reconacct = form.addField('reconacct', 'text','Account',null,null);
	fld_reconacct.setDisplayType('inline');
	fld_reconacct.setDefaultValue(nbsABR_LookupAccountName(strReconAcctId));
	//fld_reconacct.setLayoutType('normal', 'none');
	
	// From Date
	var fld_stmntdate = form.addField('stmntdate', 'date','Statement Date',null,null);
	fld_stmntdate.setDisplayType('inline');
	fld_stmntdate.setDefaultValue(strToDate);
	//fld_stmntdate.setLayoutType('normal','startcol');
	
	var fld_table = form.addField('audit_table','inlinehtml',null,null,null);
	var strHTML = nbsABR_GetReconAuditTable();
	fld_table.setDefaultValue(strHTML); 
	fld_table.setLayoutType('outsidebelow', 'startrow');
	
	//Branding
	var fld_Branding = form.addField('moduletitle','inlinehtml',null,null,null);
	fld_Branding.setDisplayType('inline');
	fld_Branding.setDefaultValue('<font color="navy"><BR><B>Advanced Bank Reconciliation</B>, by Nolan Business Solutions</font>');
	//fld_Branding.setLayoutType('outsidebelow', 'none');
	
	// Tabs
	//form.addTab('custpage_actualstab', 'Actuals');
	//form.addTab('custpage_extractstab', 'Extracts');
	
	//form.addFieldGroup('netsuite', 'NetSuite').setSingleColumn(true);	
	//form.addFieldGroup('nsabr', 'NSABR').setSingleColumn(true);
					
	response.writePage(form);
}*/
/**
 * nbsABR_GetReportData - entry function for ABR Build Audit Report scheduled script
 * 
 * Calls nbsABR_GetXML to get xml to build pdf.
 * User notified by email when report is complete and report is returned attached to the email.
 * 
 * @param (string) strReconAcctId internal id of reconcile account
 * @param (string) strStmntId internal id of reconciliation statement
 * @param (string) strFromDate date of statement opening date
 * @param (string) strToDate date of statement closing date
 * @returns (void)
 */
function nbsABR_GetReportData(strReconAcctId,strStmntId,strFromDate,strToDate)
{
	var procId = null;
	
	try{
		var ctx = nlapiGetContext();
		var userId = ctx.getSetting('SCRIPT', 'custscript_nbsabr_userid');
		var objResources = nbsTRANSL_getResourcesForUser(userId);
		
		var l_reconAcctId = ctx.getSetting('SCRIPT', 'custscript_nbsabr_reconacctid');
		var l_stmntId = ctx.getSetting('SCRIPT', 'custscript_nbsabr_reconstmntid');
		
		var tmpStartDate = ctx.getSetting('SCRIPT', 'custscript_nbsabr_fromdate');
		var l_stmntStartDate = nlapiDateToString(ncDecodeDate(tmpStartDate));
		
		var tmpEndDate = ctx.getSetting('SCRIPT', 'custscript_nbsabr_todate');
		var l_stmntEndDate = nlapiDateToString(ncDecodeDate(tmpEndDate));
			
		procId = ctx.getSetting('SCRIPT', 'custscript_nbsabr_procid');
		
		//update process status to "in progress"
		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpprocstatus', '1', false);//in progress
		
		// run the BFO library to convert the xml document to a PDF 
		var strXML = nbsABR_GetXML(l_reconAcctId,l_stmntId,l_stmntStartDate,l_stmntEndDate,procId,objResources);	
		nlapiLogExecution('debug','strXML ',strXML);
		var strMsg = objResources[NBSABRSTR.PLSFNDRPTATTCH];	// 'Please find your report attached.';
		var strStatus = '2';
		if(strXML == ''){
			/*
			strMsg = 'No Data Available: No audit discrepancies were found for the reconciliation selected.\n'+
						'Click the Help button on Period Reconciliations page to read more about this report.';
			*/
			strMsg = objResources[NBSABRSTR.NODATANODISCREP]+'\n\n'+objResources[NBSABRSTR.CLKHLPMOREINFO];
			strStatus = '6';//completed no data available
			nlapiSendEmail(userId, userId, 'Audit Report', strMsg, null, null, null, null);
		}
		else{
			var objFile = nlapiXMLToPDF(strXML);
			objFile.setName('Audit Report '+l_stmntId);
			nlapiSendEmail(userId, userId, 'Audit Report', strMsg, null, null, null, objFile);
		}	
		// update status on process instance
		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, 'custrecord_bgpprocstatus', strStatus, false);//complete
	}catch(GE){
		var msg = '';
		if (GE instanceof nlobjError)
			msg = GE.getCode() + '\n' + GE.getDetails();
		else
			msg = GE.toString();

		nlapiLogExecution('Error', 'Unhandled Exception', msg);

		// failed - update process control record for error
		fNames = [];
		fNames[0] = 'custrecord_bgpprocmsg';
		fNames[1] = 'custrecord_bgpprocstatus';
		fNames[2] = 'custrecord_bgpactivitytype';
		fValues = [];
		fValues[0] = msg;
		fValues[1] = '4'; // status 4 = failed
		fValues[2] = '3'; // activity type 3 = planned schedule

		nlapiSubmitField(ncConst.BGP_ProcessInstance, procId, fNames, fValues, false);	
	}
}

/**
 * Function to get BFO-compliant XML using HTML
 * 
 * @param {String} strReconAcctId internal id of reconcile account
 * @param {String} strStmntId internal id of reconciliation statement
 * @param {String} strFromDate date of statement opening date
 * @param {String} strToDate date of statement closing date
 * @param {String} strProcId internalid of process instance
 * @param {Array} objResources - array of strings for translation
 * @returns String xml
 */
function nbsABR_GetXML(strReconAcctId,strStmntId,strFromDate,strToDate, strProcId, objResources)
{
	nlapiLogExecution('DEBUG', 'nbsABR_GetXML', 'ReconAcctId: '+strReconAcctId+'from: '+strFromDate+' to: '+strToDate);
	var _failurePoint = '';
	try{
		var strToday = nlapiDateToString(new Date());
		var strCompanyName = nbsABR.CONFIG.companyname;
		var procId = strProcId;
		
		if (procId == null)
			return ''; // nothing to do - no process record to determine status or log events against
	
		/* retrieve process record --> process parameters */
		_failurePoint = 'Retrieve process record';
	
		var rProcessInfo = nlapiLoadRecord(ncConst.BGP_ProcessInstance, procId);
		if (rProcessInfo.getFieldValue('custrecord_bgpprocstatus') != '1')// In progress
			return ''; // nothing to do
	
		var l_RecordCount = ncParseIntNV(rProcessInfo.getFieldValue('custrecord_bgpreccount'), 0);
					
		var l_stmntId = strStmntId;
		var l_reconAcctId  = strReconAcctId;
		var l_stmntStartDate = strFromDate;
		var l_stmntEndDate = strToDate;
		var arrRSIds = [];//array to cache RS internalids
		var flNSTotal = 0;
		var flRSTotal = 0;
		var flTotalDiff = 0;
		
		_failurePoint = 'get account object';	
		// create account object
		var objReconAcct = nbsABR_CreateAccountObject(l_reconAcctId);
		var b_IsBaseCurr = objReconAcct.isBaseCurrency;
		var amountFldId = 'amount';
		if((nbsABR.CONFIG.b_multiCurr) && (!b_IsBaseCurr))
		{
			amountFldId = 'fxamount';
		}
		nlapiLogExecution('debug','Period Recon amountFldId',amountFldId);
		arrAcctIds = objReconAcct.targetaccts;
		
		_failurePoint = 'get NetSuite transactions';
		var arrReturnsNS =  nbsABR_GetNSTransactionsForPeriod(arrAcctIds,l_stmntStartDate,l_stmntEndDate,amountFldId,arrRSIds,l_RecordCount,procId);
		//var arrNSTrns = nbsABR_GetNSTransactionsForPeriod(arrAcctIds,l_stmntStartDate,l_stmntEndDate,amountFldId,arrRSIds,l_RecordCount);
		var arrNSTrns = arrReturnsNS[0];
		l_RecordCount = arrReturnsNS[1];
				
		//var arrReconStates = nbsABR_GetReconStatesForThisReconciliation(l_reconAcctId,l_stmntId,arrAcctIds,arrRSIds,amountFldId);
		_failurePoint = 'get extracts';	
		var tmpNSTrns = nbsABR_GetReconStatesForThisReconciliation(l_reconAcctId,l_stmntId,arrAcctIds,arrRSIds,amountFldId,l_RecordCount,procId);
			
		// concat
		arrNSTrns = arrNSTrns.concat(tmpNSTrns);
		//use tmp array to cache only those audit objects that are reconciled && have discrepancies
		var arrTmp = [];
		var l = arrNSTrns.length;
		for(var j=0; j < l; j+=1){
			if( (arrNSTrns[j].rs_status == nbsABR.CL.STATUS.RECONCILED) && (arrNSTrns[j].difference != 0)){
				
				nlapiLogExecution('debug','status : diff ',arrNSTrns[j].rs_status +' : '+arrNSTrns[j].difference);
				
				arrTmp.push(arrNSTrns[j]);
			}
		}
		
		// sort by date desc
		arrNSTrns = arrTmp.sort(nbsSortArrayOfObjectsByDate);
			
		var nsLength = arrNSTrns.length;
		if(nsLength == 0){
			return '';
		}
		_failurePoint = 'building xml';	
		var arrXML = [];// array to store xml strings
		arrXML.push('<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n'+
				'<pdf>'+
				'<head>');
				
		var css = '<style type="text/css">' +
		
					'body {font-family:Tahoma,Geneva,sans-serif,STSong; font-size:small}'+
					'table {font-family:Tahoma,Geneva,sans-serif,STSong; font-size:small}' +
					'h1 {font-family:Tahoma,Geneva,sans-serif,STSong; font-size:medium}' +
					'h2 {font-family:Tahoma,Geneva,sans-serif,TSong; font-size:small}' +
					'h3 {font-family:Tahoma,Geneva,sans-serif,TSong; font-size:x-small}' +
					'tr.bottomborder td {border-bottom-width: 1px; border-bottom-color: gray}'+
					
					'#outer {font-family: Tahoma,Geneva,sans-serif,STSong; font-size:small; border: 1px solid gray; border-spacing:0;}'+
					'#outer th  { background:#eee; padding:3px; border-left:1px solid gray; border-top:0; font-weight:bold; color:navy;}'+
					'#outer td  { padding:0;}'+
					
					'#nstable {font-family: Tahoma,Geneva,sans-serif,STSong; font-size:small; border-spacing:0;}'+
					'#nstable th  { padding:3px; border-left:1px solid gray; border-top:1px solid gray; text-align:left;}'+
					'#nstable td  { padding:3px; border-left:1px solid gray; border-top:1px solid gray; }'+
					'#nstable td:first-child {border-left:none;}'+
					
					'#nsabrtable {font-family: Tahoma,Geneva,sans-serif,STSong; font-size:small; border-spacing:0;}'+
					'#nsabrtable th  { padding:3px; border-left:1px solid gray; border-top:1px solid gray; text-align:left; }'+
					'#nsabrtable td   { padding:3px; border-left:1px solid gray; border-top:1px solid gray; }'+
					
					'.bold {font-weight:bold;}'+
					'.red {color:red;}'+
					
					//'.R {text-align:right}'+ ...never seems to work!!				
					'</style>';
		arrXML.push(css);
		
		arrXML.push('</head>' +	
				'<body size=\"A4\">'+
				'<h3>'+nlapiEscapeXML(strCompanyName)+'</h3>'+
				'<h3>'+strToday+'</h3>'+
				'<h1 align="center">'+objResources[NBSABRSTR.RECONADTRPT]+'</h1>' +	// Reconciliation Audit Report
				'<h2 align="center">'+objResources[NBSABRSTR.STMTDT]+' - '+l_stmntEndDate+'</h2>' +	// Statement Date
				'<h2></h2>');
		
				arrXML.push('<table style="width:600px; table-layout:fixed;" id="outer">'//678
							//+'<col width="300"><col width="300">'
						
								+'<thead>'
									+'<tr>'
										+'<th  align="center">'+objResources[NBSABRSTR.NETSUITEALLCAPS]+'</th>'	// NETSUITE
										+'<th  align="center">'+objResources[NBSABRSTR.NSABRALLCAPS]+'</th>'	// NSABR
									+'</tr>'
								+'</thead>'
								+'<tbody>'
									+'<tr>'
										+'<td>');
				
								arrXML.push('<table width="100%" id="nstable">'
												+'<thead>'
													+'<tr>'
														+'<th>'+objResources[NBSABRSTR.DT]+'</th>'	// Date
														+'<th>'+objResources[NBSABRSTR.TYP]+'</th>'	// Type
														+'<th>'+objResources[NBSABRSTR.TRNNO]+'</th>'	// Tran. No.
														+'<th>'+objResources[NBSABRSTR.AMT]+'</th>'	// Amount
													+'</tr>'
												+'</thead>'
												
												+'<tbody>');
								for(var i=0; i<nsLength;i+=1){
									// only list discrepancies && if reconciled
									if((arrNSTrns[i].rs_status != nbsABR.CL.STATUS.RECONCILED)){
										continue;
									}
									var l_amt = arrNSTrns[i].amount;
									flNSTotal += l_amt*100;
									
									arrXML.push('<tr>'
													+'<td align="right">'+arrNSTrns[i].date+'</td>'
													+'<td>'+arrNSTrns[i].type+'</td>'
													+'<td>'+nlapiEscapeXML(arrNSTrns[i].tranid)+'</td>'
													+'<td align="right">'+nbsFormatReportCurrency(arrNSTrns[i].amount)+'</td>'
												+'</tr>');
								}
								arrXML.push('<tr><td colspan="3" align="right">'+objResources[NBSABRSTR.TTL]+'</td><td align="right">'	// Total
										+nbsFormatReportCurrency(flNSTotal/100)+'</td></tr>');
							
									arrXML.push('</tbody>'
											+'</table>');
							arrXML.push('</td>'
										+'<td>');
							
								arrXML.push('<table width="100%" id="nsabrtable">'
										+'<thead>'
											+'<tr>'
												+'<th>'+objResources[NBSABRSTR.DT]+'</th>'	// Date
											//	+'<th>Type</th>'
												+'<th>'+objResources[NBSABRSTR.REF]+'</th>'	// Reference
												+'<th>'+objResources[NBSABRSTR.AMT]+'</th>'	// Amount
												+'<th>+/-</th>'
											+'</tr>'
										+'</thead>'
										+'<tbody>');
								for(var i=0; i<nsLength;i+=1){
									// only list discrepancies && if reconciled
									//if(arrNSTrns[i].rs_status != nbsABR.CL.STATUS.RECONCILED){
									if((arrNSTrns[i].rs_status != nbsABR.CL.STATUS.RECONCILED)){
										continue;
									}
									var l_amt = arrNSTrns[i].rs_amt;
									flRSTotal = l_amt*100;
									
									arrXML.push('<tr>'
													+'<td align="right">'+arrNSTrns[i].rs_date+'</td>'
													//+'<td>'+arrNSTrns[i].rs_type+'</td>'
													+'<td>'+nlapiEscapeXML(arrNSTrns[i].rs_tranid)+'</td>'
													+'<td align="right">'+nbsFormatReportCurrency(arrNSTrns[i].rs_amt)+'</td>');
									var diff = arrNSTrns[i].difference;
									flTotalDiff += diff*100;
									
									if(diff == ''){
										arrXML.push('<td>&nbsp;</td>');
									}
									else{
										arrXML.push('<td align="right" class="red">'+nbsFormatReportCurrency(arrNSTrns[i].difference)+'</td>');
									}
									arrXML.push('</tr>');
								}	
								arrXML.push('<tr><td colspan="2" align="right">'+objResources[NBSABRSTR.TTL]+'</td><td align="right">'	// Total
										+nbsFormatReportCurrency(flRSTotal/100)+'</td><td align="right">'
										+nbsFormatReportCurrency(flTotalDiff/100)+'</td></tr>');
									arrXML.push('</tbody>'
									+'</table>');
								
							arrXML.push('</td>'
									+'</tr>'
									+'</tbody>'
								+'</table>');
		   
		arrXML.push('</body></pdf>');				
								
		return arrXML.join('');
	}catch(GE){
		nlapiLogExecution('DEBUG', 'Failure point',_failurePoint);
		throw GE;
	}
}
/**
 * nbsABR_GetReconStatesForThisReconciliation - function to get all reconcliation state records associated with a reconcile statement.
 * 
 * @param (string) strReconAcctId internal id of reconcile account
 * @param (string) strStmntId internal id of reconciliation statement
 * @param (array) arrAccts target/GL accounts
 * @param (array) arrRSIds reconciliation state/extract ids
 * @param (string) strAmtFldId amount or fxamount
 * @param (string) strRecordCount record count
 * @param (string) strProcId internalid of process instance
 * @returns (array) l_arrNSTrns array of Audit objects
 */
function nbsABR_GetReconStatesForThisReconciliation(strReconAcctId,strStmntId,arrAccts,arrRSIds,strAmtFldId,strRecordCount,strProcId) {
	
	nlapiLogExecution('DEBUG', 'nbsABR_GetReconStateSearchResults', 'ReconAcctId: '+strReconAcctId+' StmntId :'+strStmntId);	
	
	var l_reconAcctId  = strReconAcctId;
	var l_stmntId = strStmntId;
	var l_arrNSTrns = [];
	var l_RecordCount = strRecordCount;
	
	var sfRS = [new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null, 'anyof',[l_reconAcctId]),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_reconstmnt',null, 'anyof',[l_stmntId]),
	          // new nlobjSearchFilter('custrecord_nbsabr_rs_recordtype',null, 'noneof',[nbsABR.CL.STATUS.OPENPOSTN]),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_recordtype',null, 'noneof',['4']),
	            new nlobjSearchFilter('isinactive',null, 'is','F')];

	var scRS = [new nlobjSearchColumn('custrecord_nbsabr_rs_trndate'),
	            new nlobjSearchColumn('custrecord_nbsabr_rs_trantype'),
				new nlobjSearchColumn('custrecord_nbsabr_rs_tranid'),
				new nlobjSearchColumn('custrecord_nbsabr_rs_amount'),
				new nlobjSearchColumn('custrecord_nbsabr_rs_internalid'),
				new nlobjSearchColumn('custrecord_nbsabr_rs_memo'),
				new nlobjSearchColumn('custrecord_nbsabr_rs_status'),
				new nlobjSearchColumn('custrecord_nbsabr_rs_linenumber')];
	
	var searchRS = nlapiCreateSearch( 'customrecord_nbsabr_reconciliationstate', sfRS, scRS );
	
	var resultset = searchRS.runSearch();
	var searchid = 0;

	do {
	    var resultslice = resultset.getResults( searchid, searchid+1000 );
	    if (resultslice === null)
	    	break; // quit if null, indicates none left
	    
	    for (var rs in resultslice) {
	    	
	    	var id = resultslice[rs].getId();
	    	if(inArray(id, arrRSIds)){// rs already found in NS transaction search so don't repeat here
	    		continue;
	    	}
	    	
	    	var objNS = new nbsABR_Audit();
 			objNS.rs_internalid = resultslice[rs].getId();
 			objNS.rs_nsid = resultslice[rs].getValue('custrecord_nbsabr_rs_internalid');
 			objNS.rs_date = resultslice[rs].getValue('custrecord_nbsabr_rs_trndate');
 			objNS.rs_type = resultslice[rs].getText('custrecord_nbsabr_rs_trantype');
 			objNS.rs_tranid = resultslice[rs].getValue('custrecord_nbsabr_rs_tranid');
 			objNS.rs_memo = resultslice[rs].getValue('custrecord_nbsabr_rs_memo');
 			objNS.rs_amt = parseFloat(resultslice[rs].getValue('custrecord_nbsabr_rs_amount'));
 			objNS.rs_status = resultslice[rs].getValue('custrecord_nbsabr_rs_status');
 			objNS.rs_line = resultslice[rs].getValue('custrecord_nbsabr_rs_linenumber');
	      
 			l_arrNSTrns.push(objNS);
 						
	        searchid+=1;
	    }
	} while (resultslice.length >= 1000);
	
	//for each transaction, search for associated NetSuite transaction
	var len = l_arrNSTrns.length;
	nlapiLogExecution('DEBUG', 'Number of extracts returned', len);	
		
	/* PJB, 20/08/2013, handle currencies better because of multi-sub currency handling in searches */
	var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency');
	if (nbsABR.CONFIG.b_multiCurr)
		scLocalCurrencyAmount.setFormula('ROUND({fxamount}*{exchangerate},2)');
	else
		scLocalCurrencyAmount.setFormula('{amount}');
	
	for(var i=0; i<len; i+=1)
	{	
		var nsTrnId = l_arrNSTrns[i].rs_nsid;
		//no NS tranaction!! Transaction deleted??
		if(isStringEmpty(nsTrnId)){
			l_arrNSTrns[i].internalid = '-1';
	 		l_arrNSTrns[i].date = '***';
	 		l_arrNSTrns[i].tranid = 'No record found';
	 		l_arrNSTrns[i].type = '***';
	 		l_arrNSTrns[i].amount = 0;
	 		//calculate difference
	 		l_arrNSTrns[i].subtract();
		}
		else{
			var sf = [new nlobjSearchFilter('internalid',null, 'anyof',l_arrNSTrns[i].rs_nsid),
			          new nlobjSearchFilter('account',null, 'anyof',arrAccts)];
			
			var sc = [new nlobjSearchColumn('trandate'),
			          new nlobjSearchColumn('tranid'),
			          new nlobjSearchColumn('type'),
			          new nlobjSearchColumn('linesequencenumber'),
			          new nlobjSearchColumn('memo'),
			          scLocalCurrencyAmount];	// new nlobjSearchColumn(strAmtFldId)];
			sc[0].setSort();	// trandate
			
		//	var srTrns = nlapiSearchRecord('transaction',null,sf,sc);
			// use saved search to set Consolidation Exchange Rate to "None"
			var srTrns = nlapiSearchRecord('transaction','customsearch_nbsabr_transactionaudit',sf,sc);
	 		
	 		if(srTrns !== null){ 	
	 		
		 		// could return multiple lines if journal but can't filter by line number
				// so iterate through results until find the right line
				var l = srTrns.length;
		 		for(var j=0; j<l; j+=1)
		 		{
		 			var intLine = srTrns[j].getValue('linesequencenumber');
		 			var trnType = srTrns[j].getRecordType();	
		 			var rsLine = l_arrNSTrns[i].rs_line;
		 
		 			if((trnType == 'journalentry') && (intLine != rsLine)){
		 				nlapiLogExecution('DEBUG', 'continue', intLine+' - '+rsLine);	
		 				continue;
		 			}
		 		
			 		l_arrNSTrns[i].internalid = srTrns[j].getId();
			 		l_arrNSTrns[i].date = srTrns[j].getValue('trandate');
			 		l_arrNSTrns[i].tranid = srTrns[j].getValue('tranid');
			 		l_arrNSTrns[i].type = nbsToTransactionType(srTrns[j].getText('type'));
			 		l_arrNSTrns[i].memo = srTrns[j].getValue('memo');
			 		l_arrNSTrns[i].amount = parseFloat(srTrns[j].getValue(scLocalCurrencyAmount));
			 		l_arrNSTrns[i].line = srTrns[j].getValue('linesequencenumber');
			 		//calculate difference
			 		l_arrNSTrns[i].subtract();
		 		}
	 		}
		}
 		l_RecordCount +=1;
		// update record count on process instance
		nlapiSubmitField(ncConst.BGP_ProcessInstance, strProcId, 'custrecord_bgpreccount', l_RecordCount, false);
 		
 		nbs_CheckGovernance();	
	}
	return l_arrNSTrns;
}

/**
 * nbsABR_GetNSTransactionsForPeriod - function to get all NetSuite transactions dated within a reconcile period.
 * 
 * @param (array) arrAccts target/GL accounts
 * @param (string) strFromDate reconciliation statement start date
 * @param (string) strToDate reconciliation statement end date
 * @param (string) strAmtFldId amount or fxamount
 * @param (array) arrRSIds reconciliation state/extract ids
 * @param (string) strRecordCount record count
 * @param (string) strProcId internalid of process instance
 * @returns (array) l_arrNSTrns array of Audit objects and l_RecordCount
 */

function nbsABR_GetNSTransactionsForPeriod(arrAccts,strFromDate,strToDate,strAmtFldId,arrRSIds,strRecordCount,strProcId) {

	nlapiLogExecution('DEBUG', 'nbsABR_GetNSTransactions', 'From: '+strFromDate+' To: '+strToDate);	

	var l_RecordCount = strRecordCount;
	var arrNSTrns = [];
		
	/* PJB, 20/08/2013, handle currencies better because of multi-sub currency handling in searches */
	var scLocalCurrencyAmount = new nlobjSearchColumn('formulacurrency');
	if (nbsABR.CONFIG.b_multiCurr)
		scLocalCurrencyAmount.setFormula('ROUND({fxamount}*{exchangerate},2)');
	else
		scLocalCurrencyAmount.setFormula('{amount}');
	
	/*
	var sf = [new nlobjSearchFilter('account',null, 'anyof',arrAccts),
	            new nlobjSearchFilter('trandate',null, 'within',strFromDate,strToDate)];
	if(nbsABR.CONFIG.reversalvoiding == 'F'){
		sf.push(new nlobjSearchFilter('voided',null,'is', 'F',null));
	}

	var sc = [new nlobjSearchColumn('trandate'),
	          new nlobjSearchColumn('type'),
	          new nlobjSearchColumn('tranid'),
	          new nlobjSearchColumn('memo'),
	          scLocalCurrencyAmount, // new nlobjSearchColumn(strAmtFldId),
	          new nlobjSearchColumn('linesequencenumber')];
	sc[0].setSort();	// trandate
	*/
	
	//var searchNS = nlapiCreateSearch( 'transaction', sf, sc);
	//load saved search with Consolidation Exchange Rate set to "None"
	var searchNS = nlapiLoadSearch( 'transaction', 'customsearch_nbsabr_transactionaudit');
	searchNS.addFilter(new nlobjSearchFilter('account',null, 'anyof',arrAccts));
	searchNS.addFilter(new nlobjSearchFilter('trandate',null, 'within',strFromDate,strToDate));
	if(nbsABR.CONFIG.reversalvoiding == 'F'){
		searchNS.addFilter(new nlobjSearchFilter('voided',null,'is', 'F',null));
	}
	//nlapiLogExecution('DEBUG', 'column', strAmtFldId);	
	//searchNS.addColumn(new nlobjSearchColumn(strAmtFldId));
	searchNS.addColumn(scLocalCurrencyAmount);
		
	var resultset = searchNS.runSearch();
	var searchid = 0;
	do {
	    var resultslice = resultset.getResults( searchid, searchid+1000 );
	    if (resultslice === null)
	    	break; // quit if null, indicates none left
	    
	    for(var rs in resultslice) {
	    	// object to encapsulate NetSuite transaction
 			var objNS = new nbsABR_Audit();
 			objNS.internalid = resultslice[rs].getId();
 			objNS.date = resultslice[rs].getValue('trandate');
 			objNS.tranid = resultslice[rs].getValue('tranid');
 			objNS.type = nbsToTransactionType(resultslice[rs].getText('type'));
 			objNS.memo = resultslice[rs].getValue('memo');
 			objNS.amount = parseFloat(resultslice[rs].getValue(scLocalCurrencyAmount));
 			//objNS.amount = Math.abs(resultslice[rs].getValue(strAmtFldId));
 			objNS.line = resultslice[rs].getValue('linesequencenumber');
 		
 			arrNSTrns.push(objNS);	    		    	
	        searchid+=1;
	    }
	} while (resultslice.length >= 1000);
	
	//for each transaction, search for associated extract/recon state
	var len = arrNSTrns.length;
	nlapiLogExecution("DEBUG", "Number of NS transactions returned: ",len);

	for(var i=0; i<len; i+=1){
	
		var sfRS = [new nlobjSearchFilter('custrecord_nbsabr_rs_internalid',null, 'anyof',arrNSTrns[i].internalid),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_linenumber',null, 'equalto',arrNSTrns[i].line),		         
		            new nlobjSearchFilter('isinactive',null, 'is','F')];
		
		var scRS = [new nlobjSearchColumn('custrecord_nbsabr_rs_trndate'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_trantype'),
					new nlobjSearchColumn('custrecord_nbsabr_rs_tranid'),
					new nlobjSearchColumn('custrecord_nbsabr_rs_amount'),
					new nlobjSearchColumn('custrecord_nbsabr_rs_memo'),
					new nlobjSearchColumn('custrecord_nbsabr_rs_status'),
					new nlobjSearchColumn('custrecord_nbsabr_rs_internalid')];
		
		var srRS = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate',null,sfRS,scRS);
		if(srRS === null){
			 nlapiLogExecution("DEBUG", "no extract found for: ",arrNSTrns[i].internalid+'-'+arrNSTrns[i].type);
			//arrNSTrns[i].rs_internalid = '-';
			//arrNSTrns[i].rs_date = '-';
			//arrNSTrns[i].rs_type = '-';
			//arrNSTrns[i].rs_tranid = '-';
			//arrNSTrns[i].rs_memo = '-';
			//arrNSTrns[i].rs_amt = 0;
		}
		else if(srRS.length == 1){
							
			arrNSTrns[i].rs_internalid = srRS[0].getId();
			arrRSIds.push(srRS[0].getId());
			
			arrNSTrns[i].rs_date = srRS[0].getValue('custrecord_nbsabr_rs_trndate');
			arrNSTrns[i].rs_type = srRS[0].getText('custrecord_nbsabr_rs_trantype');
			arrNSTrns[i].rs_tranid = srRS[0].getValue('custrecord_nbsabr_rs_tranid');
			arrNSTrns[i].rs_memo = srRS[0].getValue('custrecord_nbsabr_rs_memo');
			arrNSTrns[i].rs_amt = parseFloat(srRS[0].getValue('custrecord_nbsabr_rs_amount'));	
			//arrNSTrns[i].rs_amt = Math.abs(srRS[0].getValue('custrecord_nbsabr_rs_amount'));	
			arrNSTrns[i].rs_status = srRS[0].getValue('custrecord_nbsabr_rs_status');	
			
			nlapiLogExecution("DEBUG", "ns id:rs id: ns amt : rs amt ",arrNSTrns[i].internalid+':'+arrNSTrns[i].rs_internalid+':'+arrNSTrns[i].amount+':'+arrNSTrns[i].rs_amt);
		}
		else{//more than one!!
			nlapiLogExecution("ERROR", "Multiple extracts found for: ",arrNSTrns[i].internalid+'-'+arrNSTrns[i].type);
			arrNSTrns[i].rs_internalid = 'error';
			arrNSTrns[i].rs_date = 'Error:';
			arrNSTrns[i].rs_type = 'multiple';
			arrNSTrns[i].rs_tranid = 'records';
			arrNSTrns[i].rs_memo = 'found';
			arrNSTrns[i].rs_amt = 0;
		}
		arrNSTrns[i].subtract();
				
		l_RecordCount +=1;
		// update record count on process instance
		nlapiSubmitField(ncConst.BGP_ProcessInstance, strProcId, 'custrecord_bgpreccount', l_RecordCount, false);
		
		 nbs_CheckGovernance();	
	}
	return [arrNSTrns,l_RecordCount];
}
/** 
 * nbs_CheckGovernance - utlity function to save the state of a scheduled script at a certain point before governance is reached.
 * 
 * Calls nlapiYieldScript() to set a recovery point and place the script back into the scheduled script queue. 
 * Once the script moves to the front of the queue for processing, it begins its execution from the specified recovery point.
 *
 * @return (void) 
 * 
 */
function nbs_CheckGovernance()
{
	 var context = nlapiGetContext();
	// nlapiLogExecution("debug",'RemainingUsage', context.getRemainingUsage());
	 if( context.getRemainingUsage() < 100)
	 {
		  var state = nlapiYieldScript();
		  if( state.status == 'FAILURE')
		  {
		      nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
		      throw "Failed to yield script";
		  } 
		  else if ( state.status == 'RESUME' )
		  {
			 //ncBGP_WriteToLog(ProcessId,'','Resuming script...','Message');
			 nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
		  }
	  // state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
	 }
}

//audit object constructor
function nbsABR_Audit()
{
	this.internalid  = '';
	this.date = '';
	this.tranid = '';
	this.type = '';
	this.memo = '';
	this.amount = 0;
	this.line = '';
	this.rs_nsid = '';
	this.rs_date = '';
	this.rs_type = '';
	this.rs_tranid = '';
	this.rs_memo = '';
	this.rs_amt = 0;
	this.rs_line = '';
	this.rs_status = '';
	this.difference = null;
	this.subtract = function(){
		var flDiff =  Math.round(((Math.abs(this.amount) - Math.abs(this.rs_amt))) * 100)/100;
		if(flDiff == 0){
			this.difference = '';
		}
		else{
			this.difference =  Math.round(((Math.abs(this.amount) - Math.abs(this.rs_amt))) * 100)/100;
		}
	};
}
/** 
 * nbsSortArrayOfObjectsByDate - comparison function for array.sort(fn) to sort an array of objects that contain a date string
 *
 * @param (object) a - first object
 * @param (object) b - second object
 * @return (object) earliest dated object
 * 
 */
function nbsSortArrayOfObjectsByDate(a,b){
	 var dateA = nlapiStringToDate(a.date);
	 var dateB = nlapiStringToDate(b.date);
	 return dateA-dateB;//sort by date ascending
}


