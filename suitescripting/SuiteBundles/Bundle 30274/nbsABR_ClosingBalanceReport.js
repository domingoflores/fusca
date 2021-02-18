// get company info
nbsCONFIG.getCompanyInfo();
nbsCONFIG.getAccPref();
/** nbsABR_ClosingBalRprt - entry point for Closing Reconciliation Report Scriptlet
*
* This function provides all the functionality for the Closing Reconciliation Report window
* 
* The Current Reconciliation report displays a list of the unreconciled items for a reconcile account for a statement date. 
* It lists all unmatched transactions for the time period of the statement.
*  
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/
function nbsABR_ClosingBalRprt(request, response)
{
	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
	
	//Closing Balance Report
	var form = nlapiCreateForm(objResources[NBSABRSTR.CLSNGBLNRPRT],false);
	form.setScript('customscript_nbsabr_closingbalreport_c');
	var Params = new Array();
	
	var recState = request.getParameter('nbs_action');
	var accountId = request.getParameter('accountid');

	if( (request.getMethod() == 'GET') && ((recState === null) || (recState != 'print')))
	{
		nbsABR_RenderClosingBalRprt(form,'New',Params,objResources);
		response.writePage(form);
	}
	else
	{
		if(recState == 'Refresh')
		{
			Params['accountid'] = accountId;
			nbsABR_RenderClosingBalRprt(form,'Refresh',Params,objResources);
			response.writePage(form);
		}
		else // Print button
		{	
			//select stmnt date field referenced by recon stmnt internalid
			var reconId = request.getParameter('stmntdate');
	
			//build up BFO-compliant XML using HTML
			var xml = getXML(reconId,accountId,objResources);
							
			// run the BFO library to convert the xml document to a PDF 
			var file = nlapiXMLToPDF( xml );
			
			// set content type, file name, and content-disposition (inline means display in browser)
			response.setContentType('PDF','ClosingBalance.pdf','inline');
			
			// write response to the client
			response.write(file.getValue());   
		}		
	}	
}

/** nbsABR_nbsABR_RenderClosingBalRprt - page builder for Closing Balance Report SL
*
*@param (form) the current form
*@param	(string) recState indicates whether action is GET, Refresh, Submit
*@param (array) params (field values) from the form
*@param (object) resources object containing string translations
*
*/
function nbsABR_RenderClosingBalRprt(form, recState,params,resources)
{		
	var objResources = resources;
	var defaultAccId = '';
	
	/* form fields*/
	// Reconcile Account
	//var fld_account = form.addField('accountid', 'select',objResources[NBSABRSTR.BNKACCNT],null,null);	
	var fld_account = form.addField('accountid', 'select','Reconcile Account',null,null);	
	fld_account.setMandatory(true);
	
	//Statement Date
	var fld_stmntdate = form.addField('stmntdate', 'select',objResources[NBSABRSTR.STMTDT],null,null);
	fld_stmntdate.setMandatory(true);
	
	// Branding
	var fld_Branding = form.addField('moduletitle','inlinehtml','',null,null);
	fld_Branding.setDefaultValue('<BR><BR><font color="navy"><B>'+objResources[NBSABRSTR.ABR]+'</B>, '+objResources[NBSABRSTR.BYNBS]+'</font>');
	form.addField('nbs_action', 'text', 'action',null,null).setDisplayType('hidden');	
	
	// retrieve list of account setup records to populate list of reconcile accounts
	var filters = [	new nlobjSearchFilter('isinactive',null,'is','F',null)];
	var cols = [new nlobjSearchColumn('custrecord_accsetup_accountname'),
	            new nlobjSearchColumn('custrecord_accsetup_accountnumber')];
	cols[0].setSort();	// accountname
	
	var bankAccts = nlapiSearchRecord('customrecord_nbsabr_accountsetup', null, filters, cols);
	
	// populate account options list
	for(var i =0; bankAccts != null && i < bankAccts.length; ++i)
	{
		var strAccName = bankAccts[i].getValue('custrecord_accsetup_accountname');//mandatory
		var strAccNumber = bankAccts[i].getValue('custrecord_accsetup_accountnumber');//mandatory
		fld_account.addSelectOption(bankAccts[i].getId(), strAccName+' '+strAccNumber, false);
	}

	if(bankAccts == null)
	{
		//no reconcile accounts created -> alert user
		var fld_error = form.addField('error','inlinehtml','',null,null);
		// 'ABR setup process is incomplete!'
		// 'Navigate to ABR >> Setup >> Reconcile Accounts and create a new record for each account to be reconciled.'
		fld_error.setDefaultValue('<BR><BR><font style="font-size:10pt; color:navy;">'+objResources[NBSABRSTR.SETUPINCOMPLETE]+'<BR>'+
				objResources[NBSABRSTR.NAVABRSETUPRECONACCT]+'</font>');
		fld_error.setLayoutType('outsidebelow','startrow');
		return;
	}
	if(bankAccts != null && recState == 'New')
	{
		defaultAccId = bankAccts[0].getId();
	}
	
	if(recState == 'Refresh')
	{
		defaultAccId = params['accountid'];
		fld_account.setDefaultValue(defaultAccId);
	}
	
	// search and populate list of statement dates
	var filters = [	new nlobjSearchFilter('isinactive',null,'is','F',null),
	               	new nlobjSearchFilter('custrecord_sh_accntinit',null,'is','F',null),
	               	new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',defaultAccId,null)];
	var columns = [new nlobjSearchColumn('custrecord_sh_date')];
	var results = nlapiSearchRecord('customrecord_nbsabr_statementhistory', 'customsearch_nbsabr_statehist_datedesc', filters, columns);
	
	for(var i =0; results != null && i < results.length; ++i)
	{
		fld_stmntdate.addSelectOption(results[i].getId(), results[i].getValue('custrecord_sh_date'), false);	
	}		

	//Print button
	form.addButton('custpage_printbutton','Print','nbsABR_PrintClosingBalance();');
	
}
/**
 * Function to get BFO-compliant XML using HTML
 * 
 * @param (string)reconid internal id of Reconciliation Statement
 * @param (string)accountid internal id of bank account
 * @param (object)resources JS object of strings in user preferred language
 * @returns {string} xml
 */
function getXML(reconid,accountid,resources)
{
	var objResources = resources;
	var accountId = accountid;
	var objAccount = nbsABR_CreateAccountObject(accountId);
	var b_IsBaseCurr = objAccount.isBaseCurrency;	
	// var arrAccts = objAccount.targetaccts;
	var stStatementDate = '';
	var stCreated = '';
	var BK_StatemntCloseBal = 0;
	var bCurrentRecon = true; // is current reconciliation (false if historical)
	
	// get recon statement record
	var filters = [	new nlobjSearchFilter('internalid',null,'is',reconid,null)];
	var columns = [	new nlobjSearchColumn('custrecord_sh_date'),
	               	new nlobjSearchColumn('custrecord_sh_endingbalance'),
	               	new nlobjSearchColumn('created')];
	var stmntRec = nlapiSearchRecord('customrecord_nbsabr_statementhistory', null, filters, columns);
	if(stmntRec != null && stmntRec.length >0)
	{
		stStatementDate = stmntRec[0].getValue('custrecord_sh_date');
		BK_StatemntCloseBal = stmntRec[0].getValue('custrecord_sh_endingbalance');
		stCreated = stmntRec[0].getValue('created');
	}

	// search for current recon statement i.e. the one with highest internal id
	var filters = [new nlobjSearchFilter('isinactive',null,'is','F',null),
	               new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',accountId,null)];
	var columns = [new nlobjSearchColumn('internalid').setSort(true)]; // DESC 
	var results = nlapiSearchRecord('customrecord_nbsabr_statementhistory', null, filters, columns);
	var currRecId = ''; // current reconciliation
	if(results != null && results.length >0)
	{
		currRecId = ncParseIntNV(results[0].getId(),0);
	}
	if(currRecId > ncParseIntNV(reconid,0))
	{
		bCurrentRecon = false;
	}
	
	// var stAccBal = nbsABR_getAccountBalance(arrAccts, stStatementDate,b_IsBaseCurr,false);
	var stAccBal = nbsABR_getAccountBalance_RS(accountId, stStatementDate,b_IsBaseCurr,false);
	var flAccBalAsOf = ncParseFloatNV(stAccBal,0);
						
	var stSetupDate; //exclude all GL transactions before this date
	var stToday = nlapiDateToString(new Date());
	var acctName;
	var acctNumber;
	var acctCurr;
//	var currSym;
	var subsidName = '';
	
	// retrieve account setup record 
	var recReconAcct = nlapiLoadRecord('customrecord_nbsabr_accountsetup',accountId);
	stSetupDate = recReconAcct.getFieldValue('custrecord_accsetup_fromdate');
	acctName = recReconAcct.getFieldValue('custrecord_accsetup_accountname');
	acctNumber = recReconAcct.getFieldValue('custrecord_accsetup_accountnumber');
	acctCurr = recReconAcct.getFieldText('custrecord_nbsabr_accsetup_acctcurrency');
	
	if(nbsABR.CONFIG.b_SubsEnabled)
	{
		subsidName = recReconAcct.getFieldText('custrecord_accsetup_subsidiary');
	}
	
	/*OUTSTANDING BANK TRANSACTIONS ********************************************************/
	
	var BK_OutRcptsCNT=0;
	var BK_OutRcptsSUM=0;
	var BK_OutPymntsCNT=0;
	var BK_OutPymntsSUM=0;
	var BK_AdjCloseBal=0;				
	var BK_OutPymnts = []; // array to store list of bank paymnt objects
	
	// PAYMENTS (amount less than zero)
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_amount',null,'lessthan','0',null),
	            new nlobjSearchFilter('custrecord_bsl_amount',null,'isnotempty',null,null),
	            new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'within',stSetupDate ,stStatementDate),
	            new nlobjSearchFilter('isinactive',null,'is', 'F',null)];
	if(bCurrentRecon)
	{
		SFs.push(new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty', null,null));
		SFs.push(new nlobjSearchFilter('custrecord_bsl_reconciledstatement',null,'anyof', '@NONE@',null));
	}
	else// Historical
	{
		// if trx date is on or before statement date and trx recon id is greater than report recon id
		// then this trx must have been outstanding at time of report reconciliation date
		SFs.push(new nlobjSearchFilter('created',null,'onorbefore',stCreated,null));
	//	SFs.push(new nlobjSearchFilter('formulanumeric', null, 'greaterthan', reconid));
	//	SFs[SFs.length-1].setFormula('TO_NUMBER({custrecord_bsl_reconciledstatement})');
		SFs.push(new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0'));
		var stFormula = 'CASE WHEN TO_NUMBER({custrecord_bsl_reconciledstatement})>'+reconid+' OR NVL2({custrecord_bsl_reconciledstatement},1,0)=0 THEN 1 ELSE 0 END';
		SFs[SFs.length-1].setFormula(stFormula);
	}
	
	var SCs = [new nlobjSearchColumn('internalid'),
	           new nlobjSearchColumn('custrecord_bsl_date'),
	           new nlobjSearchColumn('custrecord_bsl_type'),
	           new nlobjSearchColumn('custrecord_bsl_reference'),
	           new nlobjSearchColumn('custrecord_bsl_checknumber'),
	           new nlobjSearchColumn('custrecord_bsl_amount')];
	SCs[0].setSort(true);	// internalid
				
	// use saved search ordered by id in case we have to search again!
	var SRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,SFs,SCs);

	for(var i=0; SRecs != null && i < SRecs.length; i+=1)
	{  		
		var BankPymnt = new Object();
		BankPymnt.date = SRecs[i].getValue('custrecord_bsl_date');
		BankPymnt.type = SRecs[i].getValue('custrecord_bsl_type');
		BankPymnt.ref = SRecs[i].getValue('custrecord_bsl_reference');
		BankPymnt.doc = SRecs[i].getValue('custrecord_bsl_checknumber');
		BankPymnt.amt = SRecs[i].getValue('custrecord_bsl_amount');
		BK_OutPymnts.push(BankPymnt);	
		
		BK_OutPymntsSUM += ncParseFloatNV(BankPymnt.amt,0)*100;
		
	}
	BK_OutPymntsCNT = BK_OutPymnts.length;
	
	// RECEIPTS (amount greater than zero)
	var BK_OutRcpts = [];
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_amount',null,'greaterthan','0',null),
	            new nlobjSearchFilter('custrecord_bsl_amount',null,'isnotempty',null,null),
	            new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'within',stSetupDate ,stStatementDate),
	           // new nlobjSearchFilter('custrecord_bsl_date',null,'within','8/10/2012' ,'8/12/2012'),
	            new nlobjSearchFilter('isinactive',null,'is', 'F',null)];
	if(bCurrentRecon)
	{
		SFs.push(new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty', null,null));
		SFs.push(new nlobjSearchFilter('custrecord_bsl_reconciledstatement',null,'anyof', '@NONE@',null));
	}
	else
	{
		// if trx date is on or before statement date and trx recon id is greater than report recon id
		// then this trx must have been outstanding at time of report reconciliation date
		SFs.push(new nlobjSearchFilter('created',null,'onorbefore',stCreated,null));
		SFs.push(new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0'));
		var stFormula = 'CASE WHEN TO_NUMBER({custrecord_bsl_reconciledstatement})>'+reconid+' OR NVL2({custrecord_bsl_reconciledstatement},1,0)=0 THEN 1 ELSE 0 END';
		SFs[SFs.length-1].setFormula(stFormula);
	}
	nlapiLogExecution('debug','stSetupDate',stSetupDate);
	nlapiLogExecution('debug','stStatementDate',stStatementDate);
	
	// use saved search ordered by id in case we have to search again!
	var SRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline',null,SFs,SCs);
	for(var i=0; SRecs !== null && i < SRecs.length; i+=1)
	{  		
		var BankRcpt = new Object();
		BankRcpt.date = SRecs[i].getValue('custrecord_bsl_date');
		BankRcpt.type = SRecs[i].getValue('custrecord_bsl_type');
		BankRcpt.ref = SRecs[i].getValue('custrecord_bsl_reference');
		BankRcpt.doc = SRecs[i].getValue('custrecord_bsl_checknumber');
		BankRcpt.amt = SRecs[i].getValue('custrecord_bsl_amount');
		BK_OutRcpts.push(BankRcpt);	
		BK_OutRcptsSUM += ncParseFloatNV(BankRcpt.amt,0)*100;
	}
	BK_OutRcptsCNT = BK_OutRcpts.length;
	
	BK_AdjCloseBal = (BK_StatemntCloseBal*100) + BK_OutPymntsSUM + BK_OutRcptsSUM;

	/* NETSUITE TRANSACTIONS - OUTSTANDING *******************************************************/
	var GL_OutRcpts = null;
	var GL_OutRcptsCNT=0;
	var GL_OutRcptsSUM=0;
	var GL_OutPymnts = null;
	var GL_OutPymntsCNT=0;
	var GL_OutPymntsSUM=0;
	//var GL_FXOutRcptsSUM=0;
	//var GL_FXOutPymntsSUM=0;
	var GL_AdjBal=0;
	
	/* Last reconciliation (current not historical) *******************************/

	if(bCurrentRecon)
	{
		nlapiLogExecution('debug','bCurrentRecon',bCurrentRecon);
		var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate ,null)];
		           // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
					// ABR Status is Unmatched
					//inactive is false
	
		var GLRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_unmatchedsum',SFs,null);
		if(GLRecs != null)
		{			
			var result = GLRecs[0];
		    var columns = result.getAllColumns();
		    for (var j = 0; j < columns.length; j++)
		    {
		        var label = columns[j].getLabel();
		   		var value = GLRecs[0].getValue(columns[j]);
	
				switch(label)
				{
					case 'RCPTS_CNT':
						GL_OutRcptsCNT = value;
						if(isStringEmpty(GL_OutRcptsCNT))
							GL_OutRcptsCNT ='0';
						break;
					case 'PYMNTS_CNT':
						GL_OutPymntsCNT = value;
						if(isStringEmpty(GL_OutPymntsCNT))
							GL_OutPymntsCNT ='0';
						break;
					case 'RCPTS':
						GL_OutRcptsSUM = value;
						break;
					case 'PYMNTS':
						GL_OutPymntsSUM = value;
						break;
					default:
						break;
				}
			}
		}
	
		// Adjusted Account Balance As Of statement date
		GL_AdjBal = (flAccBalAsOf*100)-(GL_OutPymntsSUM*100)-(GL_OutRcptsSUM*100);
		
		// List of outstanding NetSuite transactions
		// PAYMENTS
		var SFs = [ new nlobjSearchFilter('formulanumeric', null, 'lessthan', '0'),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate ,null)];
		           // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
					SFs[0].setFormula('{custrecord_nbsabr_rs_amount}');
		
		var SRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_outstndng',SFs,null);
//		var GL_OutPymnts = [];
		GL_OutPymnts = new Array();
		for(var i=0; SRecs != null && i < SRecs.length; i+=1){  		
			var GLPymnt = new Object();
			GLPymnt.date = SRecs[i].getValue('custrecord_nbsabr_rs_trndate');
			GLPymnt.type = SRecs[i].getText('custrecord_nbsabr_rs_trantype');
			// GLPymnt.name = SRecs[i].getText('custrecord_nbsabr_rs_entity');
			GLPymnt.name = SRecs[i].getValue('custrecord_nbsabr_rs_entityname');
			GLPymnt.tranid = SRecs[i].getValue('custrecord_nbsabr_rs_tranid');
			GLPymnt.amt = SRecs[i].getValue('custrecord_nbsabr_rs_amount');
			
			GL_OutPymnts.push(GLPymnt);	
		}
	
		// RECEIPTS
		var SFs = [ new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0'),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate ,null)];
		         //   new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
		SFs[0].setFormula('{custrecord_nbsabr_rs_amount}');
		
		var SRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_outstndng',SFs,null);
		GL_OutRcpts = [];
		for(var i=0; SRecs != null && i < SRecs.length; i+=1){  		
			var GLRcpt = new Object();
			GLRcpt.date = SRecs[i].getValue('custrecord_nbsabr_rs_trndate');
			GLRcpt.type = SRecs[i].getText('custrecord_nbsabr_rs_trantype');
			// GLRcpt.name = SRecs[i].getText('custrecord_nbsabr_rs_entity');
			GLRcpt.name = SRecs[i].getValue('custrecord_nbsabr_rs_entityname');
			GLRcpt.tranid = SRecs[i].getValue('custrecord_nbsabr_rs_tranid');
			GLRcpt.amt = SRecs[i].getValue('custrecord_nbsabr_rs_amount');
			
			GL_OutRcpts.push(GLRcpt);	
		}

	}
	else/* Historical ****************************************************/
	{		
		/* Reconciliation State totals (payments & receipts) *************************/
		var SCs = [ new nlobjSearchColumn('custrecord_nbsabr_rs_trndate'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_trantype'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_entityname'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_tranid'),
		            new nlobjSearchColumn('custrecord_nbsabr_rs_amount')];
		
		var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate ,null),
		           //new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate),
		            new nlobjSearchFilter('created',null,'onorbefore',stCreated,null),			
					new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0')];
					//var stFormula = 'CASE WHEN TO_NUMBER({custbody_nbsabr_reconciledstatement})>'+reconid+' OR NVL2({custbody_nbsabr_reconciledstatement},1,0)=0 THEN 1 ELSE 0 END';
					//var stFormula = 'CASE WHEN TO_NUMBER({custrecord_nbsabr_rs_reconstmnt})>'+reconid+' THEN 1 ELSE 0 END';
					var stFormula = 'CASE WHEN TO_NUMBER({custrecord_nbsabr_rs_reconstmnt})>'+reconid+' OR NVL2({custrecord_nbsabr_rs_reconstmnt},1,0)=0 THEN 1 ELSE 0 END';
					SFs[3].setFormula(stFormula);
				
		var GLRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_allsum',SFs,null);
		if(GLRecs != null)
		{			
			var result = GLRecs[0];
		    var columns = result.getAllColumns();
		    for (var j = 0; j < columns.length; j++)
		    {
		        var label = columns[j].getLabel();
		   		var value = GLRecs[0].getValue(columns[j]);
	
				switch(label)
				{
					case 'RCPTS_CNT':
						GL_OutRcptsCNT += ncParseIntNV(value,0);
						break;
					case 'PYMNTS_CNT':
						GL_OutPymntsCNT += ncParseIntNV(value,0);
						break;
					case 'RCPTS':
						GL_OutRcptsSUM = ((GL_OutRcptsSUM*100) + (value*100))/100;
						break;
					case 'PYMNTS':
						GL_OutPymntsSUM = ((GL_OutPymntsSUM*100) + (value*100))/100;
						break;
					default:
						break;
				}
			}
		}
	
		// Adjusted Account Balance As Of statement date
		GL_AdjBal = (flAccBalAsOf*100)-(GL_OutPymntsSUM*100)-(GL_OutRcptsSUM*100);
				
		// List of O/S PAYMENTS (Other)
		var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_amount', null, 'lessthan', '0'),//.setFormula('custrecord_nbsabr_rs_amount'),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
		            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate ,null),
		           // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate),
		            new nlobjSearchFilter('created',null,'onorbefore',stCreated,null),				
					new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0')];
					//var stFormula = 'CASE WHEN TO_NUMBER({custrecord_nbsabr_rs_reconstmnt})>'+reconid+' THEN 1 ELSE 0 END';
					var stFormula = 'CASE WHEN TO_NUMBER({custrecord_nbsabr_rs_reconstmnt})>'+reconid+' OR NVL2({custrecord_nbsabr_rs_reconstmnt},1,0)=0 THEN 1 ELSE 0 END';
					SFs[4].setFormula(stFormula);
					
		var SRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_unrecon',SFs,SCs);
		GL_OutPymnts = [];
		for(var i=0; SRecs != null && i < SRecs.length; i+=1)
		{  		
			var GLPymnt = new Object();
			GLPymnt.date = SRecs[i].getValue('custrecord_nbsabr_rs_trndate');
			GLPymnt.type = SRecs[i].getText('custrecord_nbsabr_rs_trantype');
			// GLPymnt.name = SRecs[i].getText('custrecord_nbsabr_rs_entity');
			GLPymnt.name = SRecs[i].getValue('custrecord_nbsabr_rs_entityname');
			GLPymnt.tranid = SRecs[i].getValue('custrecord_nbsabr_rs_tranid');
			GLPymnt.amt = SRecs[i].getValue('custrecord_nbsabr_rs_amount');
		
			GL_OutPymnts.push(GLPymnt);	
		}
		// O/S RECEIPTS
		SFs[0] = new nlobjSearchFilter('custrecord_nbsabr_rs_amount', null, 'greaterthan', '0');

		var SRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_unrecon',SFs,SCs);
		GL_OutRcpts = [];
		for(var i=0; SRecs != null && i < SRecs.length; i+=1)
		{  		
			var GLRcpt = new Object();
			GLRcpt.date = SRecs[i].getValue('custrecord_nbsabr_rs_trndate');
			GLRcpt.type = SRecs[i].getText('custrecord_nbsabr_rs_trantype');
			// GLRcpt.name = SRecs[i].getText('custrecord_nbsabr_rs_entity');
			GLRcpt.name = SRecs[i].getValue('custrecord_nbsabr_rs_entityname');
			GLRcpt.tranid = SRecs[i].getValue('custrecord_nbsabr_rs_tranid');
			GLRcpt.amt = SRecs[i].getValue('custrecord_nbsabr_rs_amount');
						
			GL_OutRcpts.push(GLRcpt);	
		}
	}

	/* Build report ***************************************************************/
//	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	xml += "<pdf>\n"+
			"<head>" +
			"<meta name='title' value='Closing Balance Report'/>"+
		//	"<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'/>"+
			"<style type='text/css'>" +
			"body {font-family:Helvetica, stsong; font-size:10}" +
			"table {font-family:Helvetica, stsong; font-size:10}" +
			"h1 {font-family:Helvetica, stsong; font-size:14}" +
			"h2 {font-family:Helvetica, stsong; font-size:12}" +
			"tr.bottomborder td {border-bottom-width: 1px;border-bottom-color: #808080;}"+
	//		"td.right {text-align:right;}"+ // can't get this to work!!
	//		 p.date {text-align:right;}
		
			"footer {font-family:Helvetica; font-size:6 font-style:italic}" +
				"</style>" +
			"</head>" +
	//		"<body footer='myfooter' footer-height='20pt'>" +
			"<body size=\"A4-landscape\">"+
			nlapiEscapeXML(nbsABR.CONFIG.companyname)+"<br/>" +
			stToday+
			//Closing Balance Report
			"<h1 align='center'>"+objResources[NBSABRSTR.CLSNGBLNRPRT]+"</h1>" +
			//Statement Date
			"<h2 align='center'>"+objResources[NBSABRSTR.STMTDT]+" - "+stStatementDate+"</h2>" +
			"<h2></h2>" +
			//	"" +
			// outer table
			"<table width='100%' border='0' border-color='#003163'>" +
			"<tr><td>"+
				// bank account details
				"<table width='100%' border='0' border-color='#003163'>" +
					"<tr>" +
						"<td>"+objResources[NBSABRSTR.BNKACCNT]+"</td>" +//Bank Account
						"<td font-weight='bold'>"+nlapiEscapeXML(acctName)+"</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.ACCNTNO]+"</td>" +//Account No
						"<td>"+acctNumber+"</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
					"</tr>" +
					"<tr>" +
						"<td>"+objResources[NBSABRSTR.CRRNCY]+"</td>" +//Currency
						"<td>"+acctCurr+"</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>";
			if(nbsABR.CONFIG.b_SubsEnabled)
			{	
				xml += 	"<td>"+objResources[NBSABRSTR.SUBSID]+"</td>" +//Subsidiary
						"<td>"+nlapiEscapeXML(subsidName)+"</td>";
			}
			else
			{
				xml += 	"<td>&nbsp;</td>" +
					 	"<td>&nbsp;</td>";
			}
				xml +=	"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +						
					"</tr>" +
				"</table>" + 	
			"</td></tr>"+			
			"<tr><td>"+
				//
				"<table width='100%' border='1' border-color='#003163'>" +
			//		"<tr  background-color='#003163' color='#FF9933' font-weight='bold'>" +
					"<tr  class='bottomborder' font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.NS]+"</td>" +
						"<td align='right'>"+objResources[NBSABRSTR.TTL]+"</td>" +//Total
						"<td align='right'>"+objResources[NBSABRSTR.BLN]+"</td>" +//Balance
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.BNK]+"</td>" +//Bank
						"<td align='right'>"+objResources[NBSABRSTR.TTL]+"</td>" +//Total
						"<td align='right'>"+objResources[NBSABRSTR.BLN]+"</td>" +//Balance
						"<td align='right'>"+objResources[NBSABRSTR.DIFF]+"</td>" +//Difference
					"</tr>" +					
					"<tr><td>&nbsp;</td></tr>" +
										
					"<tr font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.RECONCLDBLNC]+" - "+stStatementDate+"</td>" +
						//"<td>"+objResources[NBSABRSTR.ACCNTBLN]+" (as of "+stStatementDate+")</td>" +//Account Balance as of
						"<td>&nbsp;</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(GL_AdjBal/100)+"</td>"+		// was: BK_StatemntCloseBal
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.RECONCLDBLNC]+" - "+stStatementDate+"</td>" +
						//"<td>"+objResources[NBSABRSTR.CLSNGBLNSF]+" (as of "+stStatementDate+")</td>" +//Closing Balance as of
						"<td>&nbsp;</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_StatemntCloseBal)+"</td>";
				diff = ((BK_StatemntCloseBal*100)-(GL_AdjBal))/100;
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +
				//		"<td>&nbsp;</td>" +
					"</tr>" +				
										
					"<tr class='bottomborder'><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>" +
					"<tr><td>&nbsp;</td></tr>" +
					
					"<tr>" +
					//	"<td>Outstanding Receipts ("+GL_OutRcptsCNT+")</td>" +
						"<td>"+objResources[NBSABRSTR.OTSTNDNGRCPTS]+" ("+GL_OutRcptsCNT+")</td>" +//Outstanding Receipts
						"<td align='right'>"+nbsFormatReportCurrency(GL_OutRcptsSUM)+"</td>" +
						"<td>&nbsp;</td>"+							
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.OTSTNDNGRCPTS]+" ("+BK_OutRcptsCNT+")</td>" +//Outstanding Receipts
						"<td align='right'>"+nbsFormatReportCurrency(BK_OutRcptsSUM/100)+"</td>" +
						"<td>&nbsp;</td>";						
				// diff = ((BK_OutRcptsSUM)-(GL_OutRcptsSUM*100))/100;
				// xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +
				xml += "<td align='right'>&nbsp;</td>" +
					"</tr>" +
																				
					"<tr>" +
						"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+GL_OutPymntsCNT+")</td>" +//Outstanding Payments
						"<td align='right'>"+nbsFormatReportCurrency(GL_OutPymntsSUM)+"</td>" +
						"<td>&nbsp;</td>"+						
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+BK_OutPymntsCNT+")</td>" +//Outstanding Payments
						"<td align='right'>"+nbsFormatReportCurrency(BK_OutPymntsSUM/100)+"</td>" +
						"<td>&nbsp;</td>";						
				// diff = ((BK_OutPymntsSUM)-(GL_OutPymntsSUM*100))/100;
				// xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
				xml += "<td align='right'>&nbsp;</td>" +
					"</tr>";
				var GL_OutstandTotal = (GL_OutRcptsSUM*100)+(GL_OutPymntsSUM*100);
				var BK_OutstandTotal = (BK_OutRcptsSUM)+(BK_OutPymntsSUM);
				// diff = ((GL_OutstandTotal)-(BK_OutstandTotal))/100;
				diff = ((BK_OutstandTotal)-(GL_OutstandTotal))/100;
				xml +=	"<tr>" +
						"<td>"+objResources[NBSABRSTR.TTLOTSTNDNG]+"</td>" +//Total Outstanding
						"<td align='right'>"+nbsFormatReportCurrency(((GL_OutRcptsSUM*100)+(GL_OutPymntsSUM*100))/100)+"</td>" +
						"<td>&nbsp;</td>"+						
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.TTLOTSTNDNG]+"</td>" +//Total Outstanding
						"<td align='right'>"+nbsFormatReportCurrency(((BK_OutRcptsSUM)+(BK_OutPymntsSUM))/100)+"</td>" +
						"<td>&nbsp;</td>";					
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
					"</tr>" +
					"<tr class='bottomborder'><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>" +
					"<tr><td>&nbsp;</td></tr>" +
			// Adjusted
					"<tr font-weight='bold'>" +
					"<td>"+objResources[NBSABRSTR.ACCNTBLN]+" - "+stStatementDate+"</td>" +
					//"<td>"+objResources[NBSABRSTR.ADJACCNTBLNSF]+" (as of "+stStatementDate+")</td>" +
					"<td>&nbsp;</td>" +
					"<td align='right'>"+nbsFormatReportCurrency(flAccBalAsOf)+"</td>"+	//calculated account balance?? new search required to pick up all target accounts				
					"<td>&nbsp;</td>" +
					"<td>"+objResources[NBSABRSTR.BNKSTMTBLNC]+" - "+stStatementDate+"</td>" +
					//"<td>"+objResources[NBSABRSTR.ADJBNKBLN]+" (as of "+stStatementDate+")</td>" + //SF = as of
					"<td>&nbsp;</td>" +
					"<td align='right'>"+nbsFormatReportCurrency(BK_AdjCloseBal/100)+"</td>";
					diff = ((BK_AdjCloseBal)-(flAccBalAsOf*100))/100;
			xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +
					"</tr>" +
				"</table>"+ 
			"</td></tr>"+
			"</table>"+
				
	"<pbr>" +// page break	
	"</pbr>"+
	nlapiEscapeXML(nbsABR.CONFIG.companyname)+"<br/>" +
	stToday;
		//Closing Balance Report
	xml +="<h1 align='center'>"+objResources[NBSABRSTR.CLSNGBLNRPRT]+"</h1>" +
		//Statement Date
		"<h2 align='center'>"+objResources[NBSABRSTR.STMTDT]+" "+stStatementDate+"</h2>" +
		"<h2></h2>" +
		"" ;
				
	// Outstanding NetSuite transactions

		xml +=	"<h2>"+objResources[NBSABRSTR.OTSTNDNGNSTRNS]+"</h2>" +
				"<table width='100%' border='1' border-color='#003163'>" +
					"<tr font-weight='bold'>" +
	// Outstanding NetSuite Receipts
						"<td>"+objResources[NBSABRSTR.RCPTS]+"</td>" +//Receipts
						"<td colspan=\'4\'>"+GL_OutRcpts.length+"</td>" +
					"</tr>" +
					"<tr class='bottomborder' font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.DT]+"</td>" +//Date
						"<td>"+objResources[NBSABRSTR.TYP]+"</td>" +//Type
						"<td>"+objResources[NBSABRSTR.NM]+"</td>" +//Name
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran. No.
						"<td align='right'>"+objResources[NBSABRSTR.AMT]+"</td>" +//Amount
					"</tr>";		
	
	for(var i=0; GL_OutRcpts != null && i < GL_OutRcpts.length; i+=1)
	{  
		xml +=	"<tr>" +
						"<td>"+GL_OutRcpts[i].date+"</td>" +
						"<td>"+nbsTrxTypeIdToText(GL_OutRcpts[i].type)+"</td>" +
						"<td>"+nlapiEscapeXML(GL_OutRcpts[i].name)+"</td>" +
						"<td>"+nlapiEscapeXML(GL_OutRcpts[i].tranid)+"</td>" +
						"<td align='right'>"+GL_OutRcpts[i].amt+"</td>" +
					"</tr>" ;
	}
		xml +=		"<tr>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.TTL]+":</td>" +//Total
						"<td align='right'><b>"+nbsFormatReportCurrency(GL_OutRcptsSUM)+"</b></td>" +
					"</tr>" +					
				"<tr><td>&nbsp;</td></tr>" +
					"<tr font-weight='bold'>";
		
		// Outstanding NetSuite Payments
		xml +=			"<td>"+objResources[NBSABRSTR.PYMNTS]+"</td>" +//Payments
						"<td colspan=\'4\'>"+GL_OutPymnts.length+"</td>" +
					"</tr>" +
					"<tr class='bottomborder' font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.DT]+"</td>" +//Date
						"<td>"+objResources[NBSABRSTR.TYP]+"</td>" +//Type
						"<td>"+objResources[NBSABRSTR.NM]+"</td>" +//Name
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran. No.
						"<td align='right'>"+objResources[NBSABRSTR.AMT]+"</td>" +//Amount
					"</tr>";	
		for(var i=0; GL_OutPymnts != null && i < GL_OutPymnts.length; i+=1)
		{  
			xml +=	"<tr>" +
						"<td>"+GL_OutPymnts[i].date+"</td>" +
						"<td>"+nbsTrxTypeIdToText(GL_OutPymnts[i].type)+"</td>" +
						"<td>"+nlapiEscapeXML(GL_OutPymnts[i].name)+"</td>" +
						"<td>"+nlapiEscapeXML(GL_OutPymnts[i].tranid)+"</td>" +
						"<td align='right'>"+GL_OutPymnts[i].amt+"</td>" +
					"</tr>" ;
		}
		xml+=		"<tr>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.TTL]+":</td>" +//Total
						"<td align='right'><b>"+nbsFormatReportCurrency(GL_OutPymntsSUM)+"</b></td>" +
					"</tr>" +			
				"</table>";

		// Outstanding Bank Transactions
		xml +=	"<h2>"+objResources[NBSABRSTR.OTSTNDNGBNKTRNS]+"</h2>" +
				"<table width='100%' border='1' border-color='#003163'>" +
					"<tr font-weight='bold'>" +
					// Receipts
						"<td>"+objResources[NBSABRSTR.RCPTS]+"</td>" +//Receipts
						"<td colspan=\'4\'>"+BK_OutRcpts.length+"</td>" +
					"</tr>" +
					"<tr class='bottomborder' font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.DT]+"</td>" +//Date
						"<td>"+objResources[NBSABRSTR.TYP]+"</td>" +//Type
						"<td>"+objResources[NBSABRSTR.REF]+"</td>" +//Reference
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran.No.
						"<td align='right'>"+objResources[NBSABRSTR.AMT]+"</td>" +//Amount
					"</tr>";
	
	for(var i=0; BK_OutRcpts != null && i < BK_OutRcpts.length; i+=1)
	{
		xml +=	"<tr>" +
						"<td>"+ BK_OutRcpts[i].date+"</td>" +
						"<td>"+BK_OutRcpts[i].type+"</td>" +
						"<td>"+nlapiEscapeXML(BK_OutRcpts[i].ref)+"</td>" +
						"<td>"+nlapiEscapeXML(BK_OutRcpts[i].doc)+"</td>" +
						"<td align='right'>"+BK_OutRcpts[i].amt+"</td>" +
					"</tr>" ;
	}
		xml +=		"<tr>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.TTL]+":</td>" +//Total
						"<td align='right'><b>"+nbsFormatReportCurrency(BK_OutRcptsSUM/100)+"</b></td>" +
					"</tr>" +
					"<tr><td>&nbsp;</td></tr>" ;
		
					// Payments
		xml +=		"<tr font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.PYMNTS]+"</td>" +//Payments
						"<td colspan=\'4\'>"+BK_OutPymnts.length+"</td>" +
					"</tr>" +
					"<tr class='bottomborder' font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.DT]+"</td>" +//Date
						"<td>"+objResources[NBSABRSTR.TYP]+"</td>" +//Type
						"<td>"+objResources[NBSABRSTR.REF]+"</td>" +//Reference
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran.No.
						"<td align='right'>"+objResources[NBSABRSTR.AMT]+"</td>" +//Amount
					"</tr>";

		for(var i=0; BK_OutPymnts != null && i < BK_OutPymnts.length; i+=1)
		{  	
			xml +=	"<tr>" +
						"<td>"+BK_OutPymnts[i].date+"</td>" +
						"<td>"+BK_OutPymnts[i].type+"</td>" +
						"<td>"+nlapiEscapeXML(BK_OutPymnts[i].ref)+"</td>" +
						"<td>"+nlapiEscapeXML(BK_OutPymnts[i].doc)+"</td>" +
						"<td align='right'>"+BK_OutPymnts[i].amt+"</td>" +
					"</tr>" ;
		}
					
	xml +=			"<tr>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.TTL]+":</td>" +//Total
						"<td align='right'><b>"+nlapiFormatCurrency(BK_OutPymntsSUM/100)+"</b></td>" +
					"</tr>" +				
				"</table>";
			
		xml+="</body>" +
		"</pdf>";
	
	return xml;
}


function nbsFormatReportCurrency(flValue) 
{
    var flNumber = ncParseFloatNV(flValue,0);
    var sign = '';  
 
    if(!(flNumber == (flNumber = Math.abs(flNumber))))
    {
    	sign = '-';    	
    }
    
    flNumber = Math.floor(flNumber * 100 + 0.50000000001);
    
    var intDecimal = flNumber % 100;
    flNumber = Math.floor(flNumber / 100).toString();
    
    if (intDecimal < 10)
    {
        intDecimal = '0' + intDecimal;    
    }
    
    for (var i = 0; i < Math.floor((flNumber.length - (1 + i)) / 3); i++)
    {
        flNumber = flNumber.substring(0, flNumber.length - (4 * i + 3)) + ',' 
            + flNumber.substring(flNumber.length - (4 * i + 3));        
    }
    return sign + flNumber + '.' + intDecimal;
}
