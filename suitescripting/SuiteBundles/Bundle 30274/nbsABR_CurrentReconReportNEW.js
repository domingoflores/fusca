/** nbsABR_CurrentReconRprt - entry point for Current Reconciliation Report Scriptlet
*
* This function provides all the functionality for the Current Reconciliation Report window
* This suitelet can only be accessed via a link on the Reconcile Statement SL
* 
* @param {nlobjRequest} request - the request made to the suitelet
* @param {nlobjResponse} response - the response object to write the page to
* 
* @return {void}
*/

function nbsABR_CurrentReconRprt(request, response)
{
	var ctx = nlapiGetContext();
	// get JS object of resources
	var objResources = nbsTRANSL_getResources(ctx);
		
	if( request.getMethod() == 'GET' )
	{
		var accountId = request.getParameter('accId');
		var stStatementDate = request.getParameter('statementDate');// bank statement closing date
		var stAccBal = request.getParameter('accBal'); // at statement date
		var stStatementOpenDate = ''; // bank statement opening date
		var stOpenBal = request.getParameter('openBal'); // Netsuite opening balance
		var reconId = '';

		// retrieve last reconciled statement for this account
		// add 1 day to date to get statement opening date
		var SFs = [	new nlobjSearchFilter('custrecord_sh_reconaccount',null,'is',accountId,null)];
		var SRecs = nlapiSearchRecord('customrecord_nbsabr_statementhistory', 'customsearch_nbsabr_statehist_datedesc', SFs, null);
		if(SRecs === null)
		{
		//	throw nlapiCreateError('ABR_SETUP', 'ERROR! Advanced Bank Reconciliation cleardown record is missing or incomplete. Unable to determine opening balance.');
			throw nlapiCreateError('ABR_SETUP_', objResources[NBSABRSTR.ERR]+': '+objResources[NBSABRSTR.PLSNSRCLRDWNPRCSSCMPLT]+'...');
		}
		if(SRecs != null && SRecs.length >0)
		{
			reconId = SRecs[0].getId();
			var stTmpDate = SRecs[0].getValue('custrecord_sh_date');
			stStatementOpenDate = nbsAddDays(stTmpDate, 1);
		}
		//build up BFO-compliant XML using well-formed HTML
		var xml = getXML(reconId,accountId,stOpenBal,stAccBal,stStatementOpenDate,stStatementDate,objResources);
						
		// run the BFO library to convert the xml document to a PDF 
		var file = nlapiXMLToPDF( xml );
		// set content type, file name, and content-disposition (inline means display in browser)
		response.setContentType('PDF','CurrentReconciliation.pdf','inline');
		// write response to the client
		response.write(file.getValue());   
	}	
}

/**
 * Function to get BFO-compliant XML using HTML
 * 
 * @param (string) reconid internal id of Reconciliation Statement
 * @param (string) accountid internal id of reconcile account
 * @param (string) openBal account opening balance
 * @param (string) accBal account closing balance on statement date
 * @param (string) statementDate bank statement date
 * @param (object) resources JS object of strings in user preferred language
 * @returns {String} xml
 */
function getXML(reconid,accountid,openBal,accBal,openDate,statementDate,resources)
{
	var accountId = accountid;
	var stStatementOpenBal = openBal;
//	var stStatementOpenDate = openDate;
	var stStatementDate = statementDate;
	var objResources = resources;
	var companyName = nbsABR.CONFIG.companyname;
			
	// var stSetupDate; //exclude all GL transactions before this date
	var stToday = nlapiDateToString(new Date());
	var acctName;
	var acctNumber;
	var acctCurr;
//	var currSym;
	var subsidName = '';
	
	var objAccount = nbsABR_CreateAccountObject(accountId);
	var b_IsBaseCurr = objAccount.isBaseCurrency;
	
	// retrieve Reconcile Account record - no, use values from account object
	/*
	var recReconAcct =  nlapiLoadRecord('customrecord_nbsabr_accountsetup', accountId);
	stSetupDate = recReconAcct.getFieldValue('custrecord_accsetup_fromdate');
	acctName = recReconAcct.getFieldValue('custrecord_accsetup_accountname');
	acctNumber = recReconAcct.getFieldValue('custrecord_accsetup_accountnumber');
	acctCurr = recReconAcct.getFieldText('custrecord_nbsabr_accsetup_acctcurrency');
//	currSym = SRecs[0].getValue('custrecord_accsetup_currsymbol');
	if(nbsABR.CONFIG.b_SubsEnabled)
	{
		subsidName = recReconAcct.getFieldText('custrecord_accsetup_subsidiary');
	}
	*/
	acctName = objAccount.name;
	acctNumber = objAccount.number;
	acctCurr = objAccount.currencyname;
	if(nbsABR.CONFIG.b_SubsEnabled)
		subsidName = objAccount.subsidiaryname;
	
	//BANK
	var BK_StatemntOpenBal=0;
	var BK_PostRcptsCNT=0;
	var BK_PostRcptsSUM=0;
	var BK_PostPymntsCNT=0;
	var BK_PostPymntsSUM=0;
	var BK_StatemntCloseBal=0;
	var BK_ReconRcptsCNT=0;
	var BK_ReconRcptsSUM=0;
	var BK_ReconPymntsCNT=0;
	var BK_ReconPymntsSUM=0;
	//var BK_ReconBankBal=0;
	var BK_OutRcptsCNT=0;
	var BK_OutRcptsSUM=0;
	var BK_OutPymntsCNT=0;
	var BK_OutPymntsSUM=0;
	var BK_AdjustedBal = 0;
	var BK_TotalMatched = 0;
	var BK_TotalUnmatched = 0;
	
	//1. Statement Opening Balance = closing balance of last reconciliation
	BK_StatemntOpenBal = ncParseFloatNV(stStatementOpenBal,0);
	
	// 2. Total Bank Transactions
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'onorbefore',stStatementDate),
	            new nlobjSearchFilter('custrecord_bsl_reconciledstatement',null,'anyof','@NONE@' ,null)];
				// inactive is 'F'
	var BKrecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktotals',SFs,null);
	
	if(BKrecs != null)
	{			
		var result = BKrecs[0];
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++)
	    {
	        var label = columns[j].getLabel();
	   		var value = BKrecs[0].getValue(columns[j]);

			switch(label)
			{
				case 'CREDIT COUNT':
					BK_PostRcptsCNT = value;
					break;
				case 'DEBIT COUNT':
					BK_PostPymntsCNT = value;
					break;
				case 'CREDIT SUM':
					BK_PostRcptsSUM = value;
					break;
				case 'DEBIT SUM':
					BK_PostPymntsSUM = value;
					break;
				
				default:
					break;
			}
		}
	}
		
	// 3.	Statement Closing Balance
	BK_StatemntCloseBal = ((BK_StatemntOpenBal*100) + (BK_PostRcptsSUM*100) + (BK_PostPymntsSUM*100))/100;
	
	// 4. Matched Bank Transactions
	SFs.push(new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isnotempty', null,null));
	var BKrecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktotals',SFs,null);
	
	if(BKrecs != null)
	{			
		var result = BKrecs[0];
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++)
	    {
	        var label = columns[j].getLabel();
	   		var value = ncParseFloatNV(BKrecs[0].getValue(columns[j]),0);

			switch(label)
			{
				case 'CREDIT COUNT':
					BK_ReconRcptsCNT = value;
					break;
				case 'DEBIT COUNT':
					BK_ReconPymntsCNT = value;
					break;
				case 'CREDIT SUM':
					BK_ReconRcptsSUM = value;
					break;
				case 'DEBIT SUM':
					BK_ReconPymntsSUM = value;
					break;
				
				default:
					break;
			}
		}
	}
	BK_TotalMatched = ((BK_ReconRcptsSUM*100)+(BK_ReconPymntsSUM*100))/100;
	
	// 5. Reconciled Bank Balance
	//BK_ReconBankBal = ((BK_StatemntOpenBal*100) + (BK_ReconRcptsSUM*100) + (BK_ReconPymntsSUM*100))/100;
	
	// 6.	Bank Outstanding Transactions
	BK_OutRcptsCNT = ((BK_PostRcptsCNT*100) - (BK_ReconRcptsCNT*100))/100;
	BK_OutPymntsCNT = ((BK_PostPymntsCNT*100) - (BK_ReconPymntsCNT*100))/100;
	
	BK_OutRcptsSUM = ((BK_PostRcptsSUM*100) - (BK_ReconRcptsSUM*100))/100;
	BK_OutPymntsSUM = ((BK_PostPymntsSUM*100) - (BK_ReconPymntsSUM*100))/100;
	BK_TotalUnmatched = ((BK_OutRcptsSUM*100)+(BK_OutPymntsSUM*100))/100;
	
	// 7.	Adjusted Bank Balance (Outstanding) = Balance as of Statement Date - (+)Outstanding Receipts - (-)Outstanding Payments
	BK_AdjustedBal = ((BK_StatemntCloseBal*100) - (BK_OutRcptsSUM*100) - (BK_OutPymntsSUM*100))/100;
	nlapiLogExecution('debug','BK_AdjustedBal',BK_AdjustedBal);
		
	
	// 8. List of outstanding Bank transactions
	var BK_OutPymnts = [];
	
	// retrieve bank transactions less than zero - payments
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_amount',null,'lessthan','0',null),
	            new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'onorbefore',stStatementDate,null),
	            new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty', null,null),
	            ];
				// inactive is 'F'
				// reconciled statement is NONE
				// amount not empty
	// use saved search ordered by id in case have to implement search again!
	var SRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktrx_orderedbyid',SFs,null);
	
	for(var i=0; SRecs != null && i < SRecs.length; i+=1)
	{  		
		var BankPymnt = new Object();
		BankPymnt.date = SRecs[i].getValue('custrecord_bsl_date');
		BankPymnt.type = SRecs[i].getValue('custrecord_bsl_type');
		BankPymnt.ref = SRecs[i].getValue('custrecord_bsl_reference');
		BankPymnt.doc = SRecs[i].getValue('custrecord_bsl_checknumber');
		BankPymnt.amt = SRecs[i].getValue('custrecord_bsl_amount');
		
		BK_OutPymnts.push(BankPymnt);	
	}
	
	// retrieve bank transactions greater than zero - receipts
	var BK_OutRcpts = [];
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_amount',null,'greaterthan','0',null),
	            new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'onorbefore',stStatementDate),
	            new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty', null,null),];
	var SRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktrx_orderedbyid',SFs,null);
	
	for(var i=0; SRecs != null && i < SRecs.length; i+=1)
	{  		
		var BankRcpt = new Object();
		BankRcpt.date = SRecs[i].getValue('custrecord_bsl_date');
		BankRcpt.type = SRecs[i].getValue('custrecord_bsl_type');
		BankRcpt.ref = SRecs[i].getValue('custrecord_bsl_reference');
		BankRcpt.doc = SRecs[i].getValue('custrecord_bsl_checknumber');
		BankRcpt.amt = SRecs[i].getValue('custrecord_bsl_amount');
		
		BK_OutRcpts.push(BankRcpt);	
	}

	//NetSuite
//	var GL_CurrBal=0;
	var GL_AccOpenBal=0;
	//var GL_PostRcptsCNT=0;
	//var GL_PostRcptsSUM=0;
	//var GL_FXPostRcptsSUM=0;
	//var GL_PostPymntsCNT=0;
	//var GL_PostPymntsSUM=0;
	//var GL_FXPostPymntsSUM=0;
	var GL_AccCloseBal=0;
	var GL_ReconRcptsCNT=0;
	var GL_ReconRcptsSUM=0;
	var GL_ReconPymntsCNT=0;
	var GL_ReconPymntsSUM=0;
	//var GL_ReconAccBal=0;
	var GL_OutRcptsCNT=0;
	var GL_OutRcptsSUM=0;
	var GL_OutPymntsCNT=0;
	var GL_OutPymntsSUM=0;
	//var GL_AdjustedBal=0;
	var GL_TotalMatched = 0;
	var GL_TotalUnmatched = 0;
	
	//1. Account Opening Balance - could now be more than one NS account - NOT USED
	// GL_AccOpenBal = nbsABR_getAccountBalance(accountId, stStatementOpenDate, b_IsBaseCurr,true);
			
	// 3.	Account Closing Balance
	GL_AccCloseBal = nbsABR_getAccountBalance_RS(accountId, stStatementDate, b_IsBaseCurr,false);

	// 4.	Matched Reconciliation State records SUM
	var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	           // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
				// ABR Status is Matched
				// Inactive is false
	var GLRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearchnbsabr_reconstate_matchedsum',SFs,null);
	
	if(GLRecs != null)
	{			
		var result = GLRecs[0];
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++)
	    {
	        var label = columns[j].getLabel();
	   		var value = ncParseFloatNV(GLRecs[0].getValue(columns[j]),0);

			switch(label)
			{
				case 'RCPTS_CNT':
					GL_ReconRcptsCNT = value;
					break;
				case 'PYMNTS_CNT':
					GL_ReconPymntsCNT = value;
					break;
				case 'RCPTS':
					GL_ReconRcptsSUM = value;
					break;
				case 'PYMNTS':
					GL_ReconPymntsSUM = value;
					break;
				default:
					break;
			}
		}
	}
	//Total Matched
	GL_TotalMatched = ((GL_ReconRcptsSUM*100)+(GL_ReconPymntsSUM*100))/100;
	
	// 5.	Reconciled Account Balance NOT USED
	//GL_ReconAccBal = ((GL_AccOpenBal*100) + (GL_ReconRcptsSUM*100) + (GL_ReconPymntsSUM*100))/100;
	
	// 6.	Unmatched/Outstanding Reconciliation State recs
	var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	 			//new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
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
	   		var value = ncParseFloatNV(GLRecs[0].getValue(columns[j]),0);
	//   	 nlapiLogExecution('debug','value',value);
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
	//Total Unmatched
	GL_TotalUnmatched = ((GL_OutRcptsSUM*100)+(GL_OutPymntsSUM*100))/100;
	
	// calculated opening balance = closing - matched - unmatched
	GL_AccOpenBal = ((GL_AccCloseBal*100) - (GL_TotalMatched*100) - (GL_TotalUnmatched*100))/100;
	
	// 7.	Adjusted Account Balance (Outstanding) = Balance as of Statement Date - (+)Outstanding Receipts - (-)Outstanding Payments
	//GL_AdjustedBal = ((GL_AccCloseBal*100) - (GL_OutRcptsSUM*100) - (GL_OutPymntsSUM*100))/100;
	
	//7a.	Difference = Adjusted Account Balance (Outstanding) - Adjusted Bank Balance (Outstanding)
	// var flDifference = ((GL_AdjustedBal*100)-(BK_AdjustedBal*100))/100;
	//var flDifference = ((BK_AdjustedBal*100)-(GL_AdjustedBal*100))/100;	// now reversed to be Bank - Account (so consistent with all other difference calculations)
	
	// 8. List of outstanding/unmatched Reconciliation State records
	// Payments
	var SFs = [ new nlobjSearchFilter('formulanumeric', null, 'lessthan', '0'),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	           // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
	SFs[0].setFormula('{custrecord_nbsabr_rs_amount}');
	
	var pymntRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_outstndng',SFs,null);
	var GL_OutPymnts = [];
	for(var i=0; pymntRecs != null && i < pymntRecs.length; i+=1)
	{  		
		var GLPymnt = new Object();
		GLPymnt.date = pymntRecs[i].getValue('custrecord_nbsabr_rs_trndate');
		GLPymnt.type = pymntRecs[i].getText('custrecord_nbsabr_rs_trantype');
		// GLPymnt.name = pymntRecs[i].getText('custrecord_nbsabr_rs_entity');
		GLPymnt.name = pymntRecs[i].getValue('custrecord_nbsabr_rs_entityname');
		GLPymnt.tranid = pymntRecs[i].getValue('custrecord_nbsabr_rs_tranid');
		GLPymnt.amt = pymntRecs[i].getValue('custrecord_nbsabr_rs_amount');
				
		GL_OutPymnts.push(GLPymnt);	
	}
	// Receipts
	var SFs = [  new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0'),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	          //  new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
	SFs[0].setFormula('{custrecord_nbsabr_rs_amount}');

	var rcptRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_outstndng',SFs,null);
	var GL_OutRcpts = [];
	for(var i=0; rcptRecs != null && i < rcptRecs.length; i+=1)
	{  		
		var GLRcpt = new Object();
		GLRcpt.date = rcptRecs[i].getValue('custrecord_nbsabr_rs_trndate');
		GLRcpt.type = rcptRecs[i].getText('custrecord_nbsabr_rs_trantype');
		// GLRcpt.name = rcptRecs[i].getText('custrecord_nbsabr_rs_entity');
		GLRcpt.name = rcptRecs[i].getValue('custrecord_nbsabr_rs_entityname');
		GLRcpt.tranid = rcptRecs[i].getValue('custrecord_nbsabr_rs_tranid');
		GLRcpt.amt = rcptRecs[i].getValue('custrecord_nbsabr_rs_amount');
				
		GL_OutRcpts.push(GLRcpt);	
	}
	
	var GL_CurrMatchedBal = ((GL_AccOpenBal*100)+(GL_TotalMatched*100))/100;
	var GL_Total = GL_AccCloseBal;	//((GL_CurrMatchedBal*100)+(GL_TotalUnmatched*100))/100;
	var BK_CurrMatchedBal = ((BK_StatemntOpenBal*100)+(BK_TotalMatched*100))/100;
	var BK_StmntBal = ((BK_CurrMatchedBal*100)+(BK_TotalUnmatched*100))/100;
	
	// build report
	var SP = '&nbsp;';	// non-breaking space
//	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	xml += "<pdf>\n"+
			"<head>" +	
			"<style type='text/css'>" +
			"body {font-family:Helvetica, stsong; font-size:10}" +
			"table {font-family:Helvetica, stsong; font-size:10}" +
			"h1 {font-family:Helvetica, stsong; font-size:14}" +
			"h2 {font-family:Helvetica, stsong; font-size:12}" +
			"tr.bottomborder td,td.bottomborder {border-bottom-width: 1px;border-bottom-color: #808080;}"+
			".bold {font-weight:bold;}"+
	//		"td.right {text-align:right;}"+ // can't get this to work!!
	//		 p.date {text-align:right;}

			"footer {font-family:Helvetica, stsong; font-size:6 font-style:italic}" +
				"</style>" +
			"</head>" +
	//		"<body footer='myfooter' footer-height='20pt'>" +
			"<body size=\"A4-landscape\">"+
			nlapiEscapeXML(companyName)+"<br/>" +
			stToday+
		//	"<h1 align='center'>Current Reconciliation Report</h1>" +
		//	"<h2 align='center'>Statement Date - "+stStatementDate+"</h2>" +
			"<h1 align='center'>"+objResources[NBSABRSTR.CRRNTRCNCLTNRPRT]+"</h1>" +
			"<h2 align='center'>"+objResources[NBSABRSTR.STMTDT]+" - "+stStatementDate+"</h2>" +
			"<h2></h2>" +
				"" +
			// outer table - account details
			"<table width='100%' border='0' border-color='#003163'>" +
			"<tr><td>"+
				"<table width='100%' border='0' border-color='#003163'>";
	
	// Bank Account		xxxx				Account No		xxxx
	xml += nbsAddTableRow('',[objResources[NBSABRSTR.BNKACCNT],nlapiEscapeXML(acctName),SP,SP,objResources[NBSABRSTR.ACCNTNO],nlapiEscapeXML(acctNumber),SP,SP],
							['','','','','','','','']);
	if (nbsABR.CONFIG.b_SubsEnabled) {
		// Currency			xxxx				Subsidiary		xxxx
		xml += nbsAddTableRow('',[objResources[NBSABRSTR.CRRNCY],nlapiEscapeXML(acctCurr),SP,SP,objResources[NBSABRSTR.SUBSID],nlapiEscapeXML(subsidName),SP,SP],
								['','','','','','','','']);
	} else {
		// Currency			xxxx
		xml += nbsAddTableRow('',[objResources[NBSABRSTR.CRRNCY],nlapiEscapeXML(acctCurr),SP],['','',"colspan='6'"]);
	}
	
	xml += "</table>" + 
			"</td></tr>"+
			"<tr><td>"+
				//inner table
				"<table width='100%' border='1' border-color='#003163'>";
	
	// Opening Position
	xml += nbsAddTableRow("font-weight='bold'",[objResources[NBSABRSTR.OPNGPOSTN],SP],['',"colspan='7'"]);
	// NetSuite Balance		xxxx		Bank Statement Balance		xxxx
	xml += nbsAddTableRow("font-weight='bold'", [objResources[NBSABRSTR.NSBAL],SP,nbsFormatReportCurrency(GL_AccOpenBal),SP,
	                                             objResources[NBSABRSTR.BNKSTMTBLNC],SP,nbsFormatReportCurrency(BK_StatemntOpenBal),SP],
	                       ['','',"align='right'",'','','',"align='right'",'']);
	xml += nbsAddTableRow("class='bottomborder'",[SP],["colspan='8'"]);	// full-width line

	// Matched Items
	xml += nbsAddTableRow('', ['',objResources[NBSABRSTR.TTL],objResources[NBSABRSTR.BLN],SP,
	                           '',objResources[NBSABRSTR.TTL],objResources[NBSABRSTR.BLN],objResources[NBSABRSTR.DIFF]], 
	                       ['',"align='right'","align='right'",'','',"align='right'","align='right'","align='right'"]);
	// Matched Receipts
	xml += nbsAddTableRow('', [objResources[NBSABRSTR.MTCHDRCPTS]+" ("+GL_ReconRcptsCNT+")",nbsFormatReportCurrency(GL_ReconRcptsSUM),SP,SP,
	                           objResources[NBSABRSTR.MTCHDRCPTS]+" ("+BK_ReconRcptsCNT+")",nbsFormatReportCurrency(BK_ReconRcptsSUM),SP,SP],
	                       ['',"align='right'",'','','',"align='right'",'','']);
	// Matched Payments
	xml += nbsAddTableRow('', [objResources[NBSABRSTR.MTCHDPYMNTS]+" ("+GL_ReconPymntsCNT+")",nbsFormatReportCurrency(GL_ReconPymntsSUM),SP,SP,
	                           objResources[NBSABRSTR.MTCHDPYMNTS]+" ("+BK_ReconPymntsCNT+")",nbsFormatReportCurrency(BK_ReconPymntsSUM),SP,SP],
	                       ['',"class='bottomborder' align='right'",'','','',"class='bottomborder' align='right'",'','']);
	// Total Matched
	diff = ((BK_TotalMatched*100)-(GL_TotalMatched*100))/100;
	xml += nbsAddTableRow('', [objResources[NBSABRSTR.TTLMTCHD],nbsFormatReportCurrency(GL_TotalMatched),SP,SP,
	                           objResources[NBSABRSTR.TTLMTCHD],nbsFormatReportCurrency(BK_TotalMatched),SP,nbsFormatReportCurrency(diff)],
	                       ['',"class='bottomborder' align='right'",'','','',"class='bottomborder' align='right'",'',"align='right'"]);
	// Interim Matched Balance
	xml += nbsAddTableRow("font-weight='bold'", [objResources[NBSABRSTR.INTRMMTCHDBLNC],SP,nbsFormatReportCurrency(GL_CurrMatchedBal),SP,
	                                             objResources[NBSABRSTR.INTRMMTCHDBLNC],SP,nbsFormatReportCurrency(BK_CurrMatchedBal),SP],
	                       ['','',"align='right'",'','','',"align='right'",'']);
	xml += nbsAddTableRow("class='bottomborder'",[SP],["colspan='8'"]);	// full-width line

	// Outstanding Items
	xml += nbsAddTableRow('', ['',objResources[NBSABRSTR.TTL],SP,SP,
	                           '',objResources[NBSABRSTR.TTL],SP,SP], 
	                       ['',"align='right'","align='right'",'','',"align='right'","align='right'","align='right'"]);
	// Outstanding Receipts
	xml += nbsAddTableRow('', [objResources[NBSABRSTR.OTSTNDNGRCPTS]+" ("+GL_OutRcptsCNT+")",nbsFormatReportCurrency(GL_OutRcptsSUM),SP,SP,
	                           objResources[NBSABRSTR.OTSTNDNGRCPTS]+" ("+BK_OutRcptsCNT+")",nbsFormatReportCurrency(BK_OutRcptsSUM),SP,SP],
	                       ['',"align='right'",'','','',"align='right'",'','']);
	// Outstanding Payments
	xml += nbsAddTableRow('', [objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+GL_OutPymntsCNT+")",nbsFormatReportCurrency(GL_OutPymntsSUM),SP,SP,
	                           objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+BK_OutPymntsCNT+")",nbsFormatReportCurrency(BK_OutPymntsSUM),SP,SP],
	                       ['',"class='bottomborder' align='right'",'','','',"class='bottomborder' align='right'",'','']);
	// Total Outstanding
	// diff = ((BK_TotalUnmatched*100)-(GL_TotalUnmatched*100))/100;
	xml += nbsAddTableRow('', [objResources[NBSABRSTR.TTLOTSTNDNG],nbsFormatReportCurrency(GL_TotalUnmatched),SP,SP,
	                           objResources[NBSABRSTR.TTLOTSTNDNG],nbsFormatReportCurrency(BK_TotalUnmatched),SP,SP],
	                       ['',"class='bottomborder' align='right'",'','','',"class='bottomborder' align='right'",'',"align='right'"]);
	xml += nbsAddTableRow("class='bottomborder'",[SP],["colspan='8'"]);	// full-width line

	// Closing Position
	xml += nbsAddTableRow("font-weight='bold'",[objResources[NBSABRSTR.CLSNGPOSTN],SP],['',"colspan='7'"]);
	xml += nbsAddTableRow("font-weight='bold'", [objResources[NBSABRSTR.NSBAL],SP,nbsFormatReportCurrency(GL_Total),SP,
	                                             objResources[NBSABRSTR.BNKSTMTBLNC],SP,nbsFormatReportCurrency(BK_StmntBal),SP],
							['','',"align='right'",'','','',"align='right'",'']);

	// close inner and outer tables
	xml += "</table>"+ 
			"</td></tr>"+
			"</table>"+
			// page break	
			"<pbr>" +
			"</pbr>"+
			// page header
			nlapiEscapeXML(companyName)+"<br/>" +
			stToday;

	xml +="<h1 align='center'>"+objResources[NBSABRSTR.CRRNTRCNCLTNRPRT]+"</h1>" +//Current Reconciliation Report
			"<h2 align='center'>"+objResources[NBSABRSTR.STMTDT]+" "+stStatementDate+"</h2>" +//Statement Date
			"<h2></h2>" +
			"" ;
				
	// Outstanding NetSuite transactions
			//	xml +=		"<h1>Outstanding NetSuite Transactions</h1>" +
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
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
						"<td>"+objResources[NBSABRSTR.NM]+"</td>" +//Reference
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
	//	xml +=	"<h1>Outstanding Bank Transactions</h1>" +
		xml +=	"<h2>"+objResources[NBSABRSTR.OTSTNDNGBNKTRNS]+"</h2>" +
		
				"<table width='100%' border='1' border-color='#003163'>" +
					"<tr font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.RCPTS]+"</td>" +//Receipts
						"<td colspan=\'4\'>"+BK_OutRcpts.length+"</td>" +
					"</tr>" +
					
					"<tr class='bottomborder' font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.DT]+"</td>" +//Date
						"<td>"+objResources[NBSABRSTR.TYP]+"</td>" +//Type
						"<td>"+objResources[NBSABRSTR.REF]+"</td>" +//Reference
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
						"<td align='right'><b>"+nbsFormatReportCurrency(BK_OutRcptsSUM)+"</b></td>" +
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
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
						"<td align='right'><b>"+nlapiFormatCurrency(BK_OutPymntsSUM)+"</b></td>" +
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

/** @deprecated
 * Function to get BFO-compliant XML using HTML
 * 
 * @param (string) reconid internal id of Reconciliation Statement
 * @param (string) accountid internal id of reconcile account
 * @param (string) openBal account opening balance
 * @param (string) accBal account closing balance on statement date
 * @param (string) statementDate bank statement date
 * @param (object) resources JS object of strings in user preferred language
 * @returns {String} xml
 */
function getXML_old(reconid,accountid,openBal,accBal,openDate,statementDate,resources)
{
	var accountId = accountid;
	var stStatementOpenBal = openBal;
	var stStatementOpenDate = openDate;
	var stStatementDate = statementDate;
	var objResources = resources;
	var companyName = nbsABR.CONFIG.companyname;
			
	// var stSetupDate; //exclude all GL transactions before this date
	var stToday = nlapiDateToString(new Date());
	var acctName;
	var acctNumber;
	var acctCurr;
//	var currSym;
	var subsidName = '';
	
	var objAccount = nbsABR_CreateAccountObject(accountId);
	var b_IsBaseCurr = objAccount.isBaseCurrency;
	
	// retrieve Reconcile Account record - no, use values from account object
	/*
	var recReconAcct =  nlapiLoadRecord('customrecord_nbsabr_accountsetup', accountId);
	stSetupDate = recReconAcct.getFieldValue('custrecord_accsetup_fromdate');
	acctName = recReconAcct.getFieldValue('custrecord_accsetup_accountname');
	acctNumber = recReconAcct.getFieldValue('custrecord_accsetup_accountnumber');
	acctCurr = recReconAcct.getFieldText('custrecord_nbsabr_accsetup_acctcurrency');
//	currSym = SRecs[0].getValue('custrecord_accsetup_currsymbol');
	if(nbsABR.CONFIG.b_SubsEnabled)
	{
		subsidName = recReconAcct.getFieldText('custrecord_accsetup_subsidiary');
	}
	*/
	acctName = objAccount.name;
	acctNumber = objAccount.number;
	acctCurr = objAccount.currencyname;
	if(nbsABR.CONFIG.b_SubsEnabled)
		subsidName = objAccount.subsidiaryname;
	
	//BANK
	var BK_StatemntOpenBal=0;
	var BK_PostRcptsCNT=0;
	var BK_PostRcptsSUM=0;
	var BK_PostPymntsCNT=0;
	var BK_PostPymntsSUM=0;
	var BK_StatemntCloseBal=0;
	var BK_ReconRcptsCNT=0;
	var BK_ReconRcptsSUM=0;
	var BK_ReconPymntsCNT=0;
	var BK_ReconPymntsSUM=0;
	//var BK_ReconBankBal=0;
	var BK_OutRcptsCNT=0;
	var BK_OutRcptsSUM=0;
	var BK_OutPymntsCNT=0;
	var BK_OutPymntsSUM=0;
	var BK_AdjustedBal = 0;
	var BK_TotalMatched = 0;
	var BK_TotalUnmatched = 0;
	
	//1. Statement Opening Balance = closing balance of last reconciliation
	BK_StatemntOpenBal = ncParseFloatNV(stStatementOpenBal,0);
	
	// 2. Total Bank Transactions
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'onorbefore',stStatementDate),
	            new nlobjSearchFilter('custrecord_bsl_reconciledstatement',null,'anyof','@NONE@' ,null)];
				// inactive is 'F'
	var BKrecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktotals',SFs,null);
	
	if(BKrecs != null)
	{			
		var result = BKrecs[0];
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++)
	    {
	        var label = columns[j].getLabel();
	   		var value = BKrecs[0].getValue(columns[j]);

			switch(label)
			{
				case 'CREDIT COUNT':
					BK_PostRcptsCNT = value;
					break;
				case 'DEBIT COUNT':
					BK_PostPymntsCNT = value;
					break;
				case 'CREDIT SUM':
					BK_PostRcptsSUM = value;
					break;
				case 'DEBIT SUM':
					BK_PostPymntsSUM = value;
					break;
				
				default:
					break;
			}
		}
	}
		
	// 3.	Statement Closing Balance
	BK_StatemntCloseBal = ((BK_StatemntOpenBal*100) + (BK_PostRcptsSUM*100) + (BK_PostPymntsSUM*100))/100;
	
	// 4. Matched Bank Transactions
	SFs.push(new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isnotempty', null,null));
	var BKrecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktotals',SFs,null);
	
	if(BKrecs != null)
	{			
		var result = BKrecs[0];
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++)
	    {
	        var label = columns[j].getLabel();
	   		var value = ncParseFloatNV(BKrecs[0].getValue(columns[j]),0);

			switch(label)
			{
				case 'CREDIT COUNT':
					BK_ReconRcptsCNT = value;
					break;
				case 'DEBIT COUNT':
					BK_ReconPymntsCNT = value;
					break;
				case 'CREDIT SUM':
					BK_ReconRcptsSUM = value;
					break;
				case 'DEBIT SUM':
					BK_ReconPymntsSUM = value;
					break;
				
				default:
					break;
			}
		}
	}
	BK_TotalMatched = ((BK_ReconRcptsSUM*100)+(BK_ReconPymntsSUM*100))/100;
	
	// 5. Reconciled Bank Balance
	//BK_ReconBankBal = ((BK_StatemntOpenBal*100) + (BK_ReconRcptsSUM*100) + (BK_ReconPymntsSUM*100))/100;
	
	// 6.	Bank Outstanding Transactions
	BK_OutRcptsCNT = ((BK_PostRcptsCNT*100) - (BK_ReconRcptsCNT*100))/100;
	BK_OutPymntsCNT = ((BK_PostPymntsCNT*100) - (BK_ReconPymntsCNT*100))/100;
	
	BK_OutRcptsSUM = ((BK_PostRcptsSUM*100) - (BK_ReconRcptsSUM*100))/100;
	BK_OutPymntsSUM = ((BK_PostPymntsSUM*100) - (BK_ReconPymntsSUM*100))/100;
	BK_TotalUnmatched = ((BK_OutRcptsSUM*100)+(BK_OutPymntsSUM*100))/100;
	
	// 7.	Adjusted Bank Balance (Outstanding) = Balance as of Statement Date - (+)Outstanding Receipts - (-)Outstanding Payments
	BK_AdjustedBal = ((BK_StatemntCloseBal*100) - (BK_OutRcptsSUM*100) - (BK_OutPymntsSUM*100))/100;
	nlapiLogExecution('debug','BK_AdjustedBal',BK_AdjustedBal);
		
	
	// 8. List of outstanding Bank transactions
	var BK_OutPymnts = [];
	
	// retrieve bank transactions less than zero - payments
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_amount',null,'lessthan','0',null),
	            new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'onorbefore',stStatementDate,null),
	            new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty', null,null),
	            ];
				// inactive is 'F'
				// reconciled statement is NONE
				// amount not empty
	// use saved search ordered by id in case have to implement search again!
	var SRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktrx_orderedbyid',SFs,null);
	
	for(var i=0; SRecs != null && i < SRecs.length; i+=1)
	{  		
		var BankPymnt = new Object();
		BankPymnt.date = SRecs[i].getValue('custrecord_bsl_date');
		BankPymnt.type = SRecs[i].getValue('custrecord_bsl_type');
		BankPymnt.ref = SRecs[i].getValue('custrecord_bsl_reference');
		BankPymnt.doc = SRecs[i].getValue('custrecord_bsl_checknumber');
		BankPymnt.amt = SRecs[i].getValue('custrecord_bsl_amount');
		
		BK_OutPymnts.push(BankPymnt);	
	}
	
	// retrieve bank transactions greater than zero - receipts
	var BK_OutRcpts = [];
	var SFs = [ new nlobjSearchFilter('custrecord_bsl_amount',null,'greaterthan','0',null),
	            new nlobjSearchFilter('custrecord_bsl_reconaccount',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_bsl_date',null,'onorbefore',stStatementDate),
	            new nlobjSearchFilter('custrecord_bsl_matchnumber',null,'isempty', null,null),];
	var SRecs = nlapiSearchRecord('customrecord_nbsabr_bankstatementline','customsearch_nbsabr_banktrx_orderedbyid',SFs,null);
	
	for(var i=0; SRecs != null && i < SRecs.length; i+=1)
	{  		
		var BankRcpt = new Object();
		BankRcpt.date = SRecs[i].getValue('custrecord_bsl_date');
		BankRcpt.type = SRecs[i].getValue('custrecord_bsl_type');
		BankRcpt.ref = SRecs[i].getValue('custrecord_bsl_reference');
		BankRcpt.doc = SRecs[i].getValue('custrecord_bsl_checknumber');
		BankRcpt.amt = SRecs[i].getValue('custrecord_bsl_amount');
		
		BK_OutRcpts.push(BankRcpt);	
	}

	//NetSuite
//	var GL_CurrBal=0;
	//var GL_AccOpenBal=0;
	//var GL_PostRcptsCNT=0;
	//var GL_PostRcptsSUM=0;
	//var GL_FXPostRcptsSUM=0;
	//var GL_PostPymntsCNT=0;
	//var GL_PostPymntsSUM=0;
	//var GL_FXPostPymntsSUM=0;
	var GL_AccCloseBal=0;
	var GL_ReconRcptsCNT=0;
	var GL_ReconRcptsSUM=0;
	var GL_ReconPymntsCNT=0;
	var GL_ReconPymntsSUM=0;
	//var GL_ReconAccBal=0;
	var GL_OutRcptsCNT=0;
	var GL_OutRcptsSUM=0;
	var GL_OutPymntsCNT=0;
	var GL_OutPymntsSUM=0;
	//var GL_AdjustedBal=0;
	var GL_TotalMatched = 0;
	var GL_TotalUnmatched = 0;
	
	//1. Account Opening Balance - could now be more than one NS account - NOT USED
	// GL_AccOpenBal = nbsABR_getAccountBalance(accountId, stStatementOpenDate, b_IsBaseCurr,true);
			
	// 3.	Account Closing Balance
	GL_AccCloseBal = nbsABR_getAccountBalance_RS(accountId, stStatementDate, b_IsBaseCurr,false);

	// 4.	Matched Reconciliation State records SUM
	var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	           // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
				// ABR Status is Matched
				// Inactive is false
	var GLRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearchnbsabr_reconstate_matchedsum',SFs,null);
	
	if(GLRecs != null)
	{			
		var result = GLRecs[0];
	    var columns = result.getAllColumns();
	    for (var j = 0; j < columns.length; j++)
	    {
	        var label = columns[j].getLabel();
	   		var value = ncParseFloatNV(GLRecs[0].getValue(columns[j]),0);

			switch(label)
			{
				case 'RCPTS_CNT':
					GL_ReconRcptsCNT = value;
					break;
				case 'PYMNTS_CNT':
					GL_ReconPymntsCNT = value;
					break;
				case 'RCPTS':
					GL_ReconRcptsSUM = value;
					break;
				case 'PYMNTS':
					GL_ReconPymntsSUM = value;
					break;
				default:
					break;
			}
		}
	}
	//Total Matched
	GL_TotalMatched = ((GL_ReconRcptsSUM*100)+(GL_ReconPymntsSUM*100))/100;
	
	// 5.	Reconciled Account Balance NOT USED
	//GL_ReconAccBal = ((GL_AccOpenBal*100) + (GL_ReconRcptsSUM*100) + (GL_ReconPymntsSUM*100))/100;
	
	// 6.	Unmatched/Outstanding Reconciliation State recs
	var SFs = [ new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	 			//new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
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
	   		var value = ncParseFloatNV(GLRecs[0].getValue(columns[j]),0);
	//   	 nlapiLogExecution('debug','value',value);
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
	//Total Unmatched
	GL_TotalUnmatched = ((GL_OutRcptsSUM*100)+(GL_OutPymntsSUM*100))/100;
	
	// 7.	Adjusted Account Balance (Outstanding) = Balance as of Statement Date - (+)Outstanding Receipts - (-)Outstanding Payments
	//GL_AdjustedBal = ((GL_AccCloseBal*100) - (GL_OutRcptsSUM*100) - (GL_OutPymntsSUM*100))/100;
	
	//7a.	Difference = Adjusted Account Balance (Outstanding) - Adjusted Bank Balance (Outstanding)
	// var flDifference = ((GL_AdjustedBal*100)-(BK_AdjustedBal*100))/100;
	//var flDifference = ((BK_AdjustedBal*100)-(GL_AdjustedBal*100))/100;	// now reversed to be Bank - Account (so consistent with all other difference calculations)
	
	// 8. List of outstanding/unmatched Reconciliation State records
	// Payments
	var SFs = [ new nlobjSearchFilter('formulanumeric', null, 'lessthan', '0'),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	           // new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
	SFs[0].setFormula('{custrecord_nbsabr_rs_amount}');
	
	var pymntRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_outstndng',SFs,null);
	var GL_OutPymnts = [];
	for(var i=0; pymntRecs != null && i < pymntRecs.length; i+=1)
	{  		
		var GLPymnt = new Object();
		GLPymnt.date = pymntRecs[i].getValue('custrecord_nbsabr_rs_trndate');
		GLPymnt.type = pymntRecs[i].getText('custrecord_nbsabr_rs_trantype');
		// GLPymnt.name = pymntRecs[i].getText('custrecord_nbsabr_rs_entity');
		GLPymnt.name = pymntRecs[i].getValue('custrecord_nbsabr_rs_entityname');
		GLPymnt.tranid = pymntRecs[i].getValue('custrecord_nbsabr_rs_tranid');
		GLPymnt.amt = pymntRecs[i].getValue('custrecord_nbsabr_rs_amount');
				
		GL_OutPymnts.push(GLPymnt);	
	}
	// Receipts
	var SFs = [  new nlobjSearchFilter('formulanumeric', null, 'greaterthan', '0'),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_reconacc',null,'is',accountId ,null),
	            new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'onorbefore',stStatementDate)];
	          //  new nlobjSearchFilter('custrecord_nbsabr_rs_trndate',null,'within',stSetupDate ,stStatementDate)];
	SFs[0].setFormula('{custrecord_nbsabr_rs_amount}');

	var rcptRecs = nlapiSearchRecord('customrecord_nbsabr_reconciliationstate','customsearch_nbsabr_reconstate_outstndng',SFs,null);
	var GL_OutRcpts = [];
	for(var i=0; rcptRecs != null && i < rcptRecs.length; i+=1)
	{  		
		var GLRcpt = new Object();
		GLRcpt.date = rcptRecs[i].getValue('custrecord_nbsabr_rs_trndate');
		GLRcpt.type = rcptRecs[i].getText('custrecord_nbsabr_rs_trantype');
		// GLRcpt.name = rcptRecs[i].getText('custrecord_nbsabr_rs_entity');
		GLRcpt.name = rcptRecs[i].getValue('custrecord_nbsabr_rs_entityname');
		GLRcpt.tranid = rcptRecs[i].getValue('custrecord_nbsabr_rs_tranid');
		GLRcpt.amt = rcptRecs[i].getValue('custrecord_nbsabr_rs_amount');
				
		GL_OutRcpts.push(GLRcpt);	
	}
	
	// build report
//	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
	xml += "<pdf>\n"+
			"<head>" +	
			"<style type='text/css'>" +
			"body {font-family:Helvetica, stsong; font-size:10}" +
			"table {font-family:Helvetica, stsong; font-size:10}" +
			"h1 {font-family:Helvetica, stsong; font-size:14}" +
			"h2 {font-family:Helvetica, stsong; font-size:12}" +
			"tr.bottomborder td {border-bottom-width: 1px;border-bottom-color: #808080;}"+
			".bold {font-weight:bold;}"+
	//		"td.right {text-align:right;}"+ // can't get this to work!!
	//		 p.date {text-align:right;}

			"footer {font-family:Helvetica, stsong; font-size:6 font-style:italic}" +
				"</style>" +
			"</head>" +
	//		"<body footer='myfooter' footer-height='20pt'>" +
			"<body size=\"A4-landscape\">"+
			companyName+"<br/>" +
			stToday+
		//	"<h1 align='center'>Current Reconciliation Report</h1>" +
		//	"<h2 align='center'>Statement Date - "+stStatementDate+"</h2>" +
			"<h1 align='center'>"+objResources[NBSABRSTR.CRRNTRCNCLTNRPRT]+"</h1>" +
			"<h2 align='center'>"+objResources[NBSABRSTR.STMTDT]+" - "+stStatementDate+"</h2>" +
			"<h2></h2>" +
				"" +
			// outer table - account details
			"<table width='100%' border='0' border-color='#003163'>" +
			"<tr><td>"+
				"<table width='100%' border='0' border-color='#003163'>" +
			//		"<tr background-color='#003163' color='#FF9933' font-weight='bold'>" +
					"<tr>" +
						"<td>"+objResources[NBSABRSTR.BNKACCNT]+":</td>" +//Bank Account
						"<td font-weight='bold'>"+acctName+"</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.ACCNTNO]+":</td>" +//Account No.
						"<td>"+acctNumber+"</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +
					"</tr>" +
					"<tr>" +
						"<td>"+objResources[NBSABRSTR.CRRNCY]+":</td>" +//Currency
						"<td>"+acctCurr+"</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>";
			if(nbsABR.CONFIG.b_SubsEnabled){
				xml += 	"<td>"+objResources[NBSABRSTR.SUBSID]+":</td>" +//Subsidiary
						"<td>"+subsidName+"</td>";
			}
			else{
				xml += "<td>&nbsp;</td>" +
						"<td>&nbsp;</td>";
			}
				xml +=	"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>" +						
					"</tr>" +
				"</table>" + 
			"</td></tr>"+
			"<tr><td>"+
				//inner table
				"<table width='100%' border='1' border-color='#003163'>" +
			//		"<tr  background-color='#003163' color='#FF9933' font-weight='bold'>" +
					"<tr  class='bottomborder' font-weight='bold'>" +
						"<td>NetSuite</td>" +
						"<td align='right'>"+objResources[NBSABRSTR.TTL]+"</td>" +//Total
						"<td align='right'>"+objResources[NBSABRSTR.BLN]+"</td>" +//Balance
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.BNK]+"</td>" +//Bank
						"<td align='right'>"+objResources[NBSABRSTR.TTL]+"</td>" +//Total
						"<td align='right'>"+objResources[NBSABRSTR.BLN]+"</td>" +//Balance
						"<td align='right'>"+objResources[NBSABRSTR.DIFF]+"</td>" +//Difference
					"</tr>";

					xml +=	"<tr>"; //+
					var GL_Total = GL_AccCloseBal;	//((GL_CurrMatchedBal*100)+(GL_TotalUnmatched*100))/100;
					//var BK_StmntBal = ((BK_ReconBankBal*100)+(BK_TotalMatched*100)+(BK_TotalUnmatched*100))/100;
					var BK_StmntBal = ((BK_CurrMatchedBal*100)+(BK_TotalUnmatched*100))/100;
					flDifference = ((BK_StmntBal*100)-(GL_Total*100))/100;
					xml +=	"<td>Total as of "+stStatementDate+"</td>" +
							//"<td>"+objResources[NBSABRSTR.ADJACCNTBLN]+" ("+objResources[NBSABRSTR.OTSTNDNG]+")</td>" +
							"<td>&nbsp;</td>" +
						//	"<td align='right'>"+nbsFormatReportCurrency(((GL_OutRcptsSUM*100)+(GL_OutPymntsSUM*100))/100)+"</td>" +
							//GL_AdjustedBal
							//"<td align='right'>"+nbsFormatReportCurrency(((BK_ReconBankBal*100)+(GL_TotalMatched*100)+(GL_TotalUnmatched*100))/100)+"</td>"+	
							"<td align='right'>"+nbsFormatReportCurrency(GL_Total)+"</td>"+						
							"<td>&nbsp;</td>" +
							"<td>Bank Statement Balance as of "+stStatementDate+"</td>" +
							//"<td>"+objResources[NBSABRSTR.ADJBNKBLN]+" ("+objResources[NBSABRSTR.OTSTNDNG]+")</td>" +
							"<td>&nbsp;</td>" +
							"<td align='right'>"+nbsFormatReportCurrency(BK_StmntBal)+"</td>";	
					xml +=	"<td align='right'>"+nbsFormatReportCurrency(flDifference)+"</td>" +						
						"</tr>";

					xml += "<tr>" +
						"<td class='bold'>Reconciled</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>"+						
						"<td>&nbsp;</td>" +
						"<td class='bold'>Reconciled</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>"+
						"<td>&nbsp;</td>" +
					"</tr>" +
					
					"<tr>" +
						"<td>"+objResources[NBSABRSTR.MTCHDRCPTS]+" ("+GL_ReconRcptsCNT+")</td>" +//Matched Receipts
						"<td align='right'>"+nbsFormatReportCurrency(GL_ReconRcptsSUM)+"</td>" +
						"<td>&nbsp;</td>"+
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.MTCHDRCPTS]+" ("+BK_ReconRcptsCNT+")</td>" +//Matched Receipts
						"<td align='right'>"+nbsFormatReportCurrency(BK_ReconRcptsSUM)+"</td>" +
						"<td>&nbsp;</td>";						
						diff = ((BK_ReconRcptsSUM*100)-(GL_ReconRcptsSUM*100))/100;
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
					"</tr>" +
					
					"<tr>" +
						"<td>"+objResources[NBSABRSTR.MTCHDPYMNTS]+" ("+GL_ReconPymntsCNT+")</td>" +//Matched Payments
						"<td align='right'>"+nbsFormatReportCurrency(GL_ReconPymntsSUM)+"</td>" +
						"<td>&nbsp;</td>"+						
						"<td>&nbsp;</td>" +
						"<td>"+objResources[NBSABRSTR.MTCHDPYMNTS]+" ("+BK_ReconPymntsCNT+")</td>" +//Matched Payments
						"<td align='right'>"+nbsFormatReportCurrency(BK_ReconPymntsSUM)+"</td>" +
						"<td>&nbsp;</td>";						
						diff = ((BK_ReconPymntsSUM*100)-(GL_ReconPymntsSUM*100))/100;
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
					"</tr>" +
					
					"<tr>" +
						"<td>Total - Matched</td>" +
						//"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+GL_OutPymntsCNT+")</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(GL_TotalMatched)+"</td>" +
						"<td>&nbsp;</td>"+						
						"<td>&nbsp;</td>" +
						"<td>Total - Matched</td>" +
						//"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+BK_OutPymntsCNT+")</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_TotalMatched)+"</td>" +
						"<td>&nbsp;</td>";						
						diff = ((BK_TotalMatched*100)-(GL_TotalMatched*100))/100;
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
					"</tr>"+
					
					"<tr>" +
						"<td>Last Reconciled Statement Balance - "+nbsAddDays(stStatementOpenDate, -1)+"</td>" +
						"<td>&nbsp;</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_StatemntOpenBal)+"</td>"+						
						"<td>&nbsp;</td>" +
						"<td>Last Reconciled Statement Balance - "+nbsAddDays(stStatementOpenDate, -1)+"</td>" +
						"<td>&nbsp;</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_StatemntOpenBal)+"</td>"+
						"<td>&nbsp;</td>" +
					"</tr>" +

					"<tr>" +
						"<td>Current Matched Balance</td>"; //+
						//"<td>"+objResources[NBSABRSTR.ADJACCNTBLN]+" ("+objResources[NBSABRSTR.MTCHD]+")</td>" +
						var BK_CurrMatchedBal = ((BK_StatemntOpenBal*100)+(BK_TotalMatched*100))/100;
						var GL_CurrMatchedBal = ((BK_StatemntOpenBal*100)+(GL_TotalMatched*100))/100;
						diff = ((BK_CurrMatchedBal*100)-(GL_CurrMatchedBal*100))/100;
				xml +=	"<td>&nbsp;</td>" +
						//"<td align='right'>"+nbsFormatReportCurrency(((BK_ReconBankBal*100)+(GL_TotalMatched*100))/100)+"</td>"+
						"<td align='right'>"+nbsFormatReportCurrency(GL_CurrMatchedBal)+"</td>"+
						"<td>&nbsp;</td>" +
						"<td>Current Matched Balance</td>" +
						//"<td>"+objResources[NBSABRSTR.ADJBNKBLN]+" ("+objResources[NBSABRSTR.MTCHD]+")</td>" +
						"<td>&nbsp;</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_CurrMatchedBal)+"</td>";
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
					"</tr>" +
					
					"<tr class='bottomborder'><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>" +
					//"<tr><td>&nbsp;</td></tr>" +
					"<tr>" +
						"<td class='bold'>Unreconciled</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>"+						
						"<td>&nbsp;</td>" +
						"<td class='bold'>Unreconciled</td>" +
						"<td>&nbsp;</td>" +
						"<td>&nbsp;</td>"+
						"<td>&nbsp;</td>" +
					"</tr>" +
					
					"<tr>" +
						"<td>Unmatched Receipts ("+GL_OutRcptsCNT+")</td>" +
						//"<td>"+objResources[NBSABRSTR.OTSTNDNGRCPTS]+" ("+GL_OutRcptsCNT+")</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(GL_OutRcptsSUM)+"</td>" +
						"<td>&nbsp;</td>"+							
						"<td>&nbsp;</td>" +
						"<td>Unmatched Receipts ("+BK_OutRcptsCNT+")</td>" +
						//"<td>"+objResources[NBSABRSTR.OTSTNDNGRCPTS]+" ("+BK_OutRcptsCNT+")</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_OutRcptsSUM)+"</td>" +
						"<td>&nbsp;</td>";						
						diff = ((BK_OutRcptsSUM*100)-(GL_OutRcptsSUM*100))/100;
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
					"</tr>" +
					
					"<tr>" +
						"<td>Unmatched Payments ("+GL_OutPymntsCNT+")</td>" +
						//"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+GL_OutPymntsCNT+")</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(GL_OutPymntsSUM)+"</td>" +
						"<td>&nbsp;</td>"+						
						"<td>&nbsp;</td>" +
						"<td>Unmatched Payments ("+BK_OutPymntsCNT+")</td>" +
						//"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+BK_OutPymntsCNT+")</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_OutPymntsSUM)+"</td>" +
						"<td>&nbsp;</td>";						
						diff = ((BK_OutPymntsSUM*100)-(GL_OutPymntsSUM*100))/100;
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
					"</tr>"+
					
					"<tr>" +
					"<td>Total - Unmatched</td>" +
					//"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+GL_OutPymntsCNT+")</td>" +
					"<td align='right'>"+nbsFormatReportCurrency(GL_TotalUnmatched)+"</td>" +
					"<td>&nbsp;</td>"+						
					"<td>&nbsp;</td>" +
					"<td>Total - Unmatched</td>" +
					//"<td>"+objResources[NBSABRSTR.OTSTNDNGPYMNTS]+" ("+BK_OutPymntsCNT+")</td>" +
					"<td align='right'>"+nbsFormatReportCurrency(BK_TotalUnmatched)+"</td>" +
					"<td>&nbsp;</td>";						
				diff = ((BK_TotalUnmatched*100)-(GL_TotalUnmatched*100))/100;
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(diff)+"</td>" +						
				"</tr>"+
	
			"<tr class='bottomborder'><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>";
				xml +=	"<tr>"; //+
				var GL_Total = ((GL_CurrMatchedBal*100)+(GL_TotalUnmatched*100))/100;
				//var BK_StmntBal = ((BK_ReconBankBal*100)+(BK_TotalMatched*100)+(BK_TotalUnmatched*100))/100;
				var BK_StmntBal = ((BK_CurrMatchedBal*100)+(BK_TotalUnmatched*100))/100;
				flDifference = ((BK_StmntBal*100)-(GL_Total*100))/100;
				xml +=	"<td>Total as of "+stStatementDate+"</td>" +
						//"<td>"+objResources[NBSABRSTR.ADJACCNTBLN]+" ("+objResources[NBSABRSTR.OTSTNDNG]+")</td>" +
						"<td>&nbsp;</td>" +
					//	"<td align='right'>"+nbsFormatReportCurrency(((GL_OutRcptsSUM*100)+(GL_OutPymntsSUM*100))/100)+"</td>" +
						//GL_AdjustedBal
						//"<td align='right'>"+nbsFormatReportCurrency(((BK_ReconBankBal*100)+(GL_TotalMatched*100)+(GL_TotalUnmatched*100))/100)+"</td>"+	
						"<td align='right'>"+nbsFormatReportCurrency(GL_Total)+"</td>"+						
						"<td>&nbsp;</td>" +
						"<td>Bank Statement Balance as of "+stStatementDate+"</td>" +
						//"<td>"+objResources[NBSABRSTR.ADJBNKBLN]+" ("+objResources[NBSABRSTR.OTSTNDNG]+")</td>" +
						"<td>&nbsp;</td>" +
						"<td align='right'>"+nbsFormatReportCurrency(BK_StmntBal)+"</td>";	
				xml +=	"<td align='right'>"+nbsFormatReportCurrency(flDifference)+"</td>" +						
					"</tr>" +
				"</table>"+ 
			"</td></tr>"+
			"</table>"+
//		"</body>" +
//	"</pdf>";
		
//	return xml;
			
	// page break	
	"<pbr>" +
	"</pbr>"+
	companyName+"<br/>" +
	stToday;
		xml +="<h1 align='center'>"+objResources[NBSABRSTR.CRRNTRCNCLTNRPRT]+"</h1>" +//Current Reconciliation Report
			"<h2 align='center'>"+objResources[NBSABRSTR.STMTDT]+" "+stStatementDate+"</h2>" +//Statement Date
			"<h2></h2>" +
			"" ;
				
	// Outstanding NetSuite transactions
			//	xml +=		"<h1>Outstanding NetSuite Transactions</h1>" +
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
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
						"<td>"+objResources[NBSABRSTR.NM]+"</td>" +//Reference
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
	//	xml +=	"<h1>Outstanding Bank Transactions</h1>" +
		xml +=	"<h2>"+objResources[NBSABRSTR.OTSTNDNGBNKTRNS]+"</h2>" +
		
				"<table width='100%' border='1' border-color='#003163'>" +
					"<tr font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.RCPTS]+"</td>" +//Receipts
						"<td colspan=\'4\'>"+BK_OutRcpts.length+"</td>" +
					"</tr>" +
					
					"<tr class='bottomborder' font-weight='bold'>" +
						"<td>"+objResources[NBSABRSTR.DT]+"</td>" +//Date
						"<td>"+objResources[NBSABRSTR.TYP]+"</td>" +//Type
						"<td>"+objResources[NBSABRSTR.REF]+"</td>" +//Reference
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
						"<td align='right'><b>"+nbsFormatReportCurrency(BK_OutRcptsSUM)+"</b></td>" +
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
						"<td>"+objResources[NBSABRSTR.TRNNO]+"</td>" +//Tran No.
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
						"<td align='right'><b>"+nlapiFormatCurrency(BK_OutPymntsSUM)+"</b></td>" +
					"</tr>" +				
				"</table>";
			
		xml+="</body>" +
		"</pdf>";
	
	return xml;
}

/** nbsAddTableRow - function to create an html table row with attributes, from the array of cell values provided
 * 
 * @param {String} rowAttr - any attributes to apply to the table row element
 * @param {Array} cellValues - values to insert for table detail elements
 * @param {Array} cellAttrs - any attributes to apply to the table detail elements
 * @return {String} xml (html) for table row
 */
function nbsAddTableRow(rowAttr, cellValues, cellAttrs) {
	if ((rowAttr === null) || (cellValues === null) || (cellAttrs === null) || (cellValues.length != cellAttrs.length)) {
		nlapiLogExecution('audit','nbsAddTableRow called with invalid parameters','blank table row will be returned');
		return '<tr></tr>';	// empty table row, error
	}
	
	var rowXml = '<tr '+rowAttr+'>';
	
	var aValue = '';
	var anAttr = '';
	for (var i=0; i<cellValues.length; ++i) {
		aValue = cellValues[i];
		anAttr = cellAttrs[i];
		if (aValue === null)
			aValue = '';
		if (anAttr === null)
			anAttr = '';
		
		rowXml += '<td '+anAttr+'>'+aValue+'</td>';
	}
	
	rowXml += '</tr>';
	return rowXml;
}