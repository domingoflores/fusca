/// <reference path="TaskAutomation_ServerSideLibrary.js" />
/// <reference path="MapObject.js" />
/**
 * @author durbano
 * 
 * STS - 12/28/2016 - Added DEBUG LOGS to each function
 * STS - 04/17/2018 - Added a way to dynamically generate a full URL for the report links in the email.  
 * 					  Lines 241 - 245.  Uses the nlapiResolveURL of the allocation portlet suitelet to 
 * 					  generate a URL that is then sliced and concatenated with search IDs.
 */

// lists of saved search alerts
var docket_search_alerts = [
	 ['calendarevent','customsearch3190','OPS - Acquiom Important Dates',3190]
	,['customer','customsearch3276','OPS - Acquiom Upcoming Scheduled Releases',3276]
	,['supportcase','customsearch4189','OPS - SRS Acquiom Pending Releases',4189]
	,['customrecord_acq_lot','customsearch3893','OPS - Invalid Contact Foundation Capital Exchange Records',3893]
	,['customrecord_document_management','customsearch17731','Payments Support - 6 months old - Records by Box - Physical Docs',17731]
	,['supportcase','customsearch4130','ACQUIOM ANALYSTS - Escrow or Customer Missing on Final Instructions Case',4130]
	,['transaction','customsearch3220','ACQUIOM ANALYSTS - 41xxxx Transactions no Deal Link populated',3220]
  	,['transaction','customsearch16995','ACQUIOM ANALYSTS - Incorrect Department - Acquiom Cash Accounts',16995]
    ,['transaction','customsearch16993','ACQUIOM ANALYSTS - Acquiom Cash Accounts OUT OF BALANCE',16993]
    ,['transaction','customsearch18404','ACQUIOM ANALYSTS - Inactive Acquiom GL Account with a balance',18404]
  	,['transaction','customsearch16994','ACQUIOM ANALYSTS - Transaction Missing Deal Link - Acquiom Cash Accounts',16994]
    ,['transaction','customsearch17769','ACQUIOM ANALYSTS - Acquiom Escrow Agent Transaction no Deal Escrow or Deal Link',17769]
    ,['transaction','customsearch17770','ACQUIOM ANALYSTS - Incorrect Department - Acquiom Escrow Agent',17770]
    ,['transaction','customsearch17772','ACQUIOM ANALYSTS - DAILY ALERT - Acquiom Escrow Agent out of balance',17772]
	,['transaction','customsearch3292','ACQUIOM ANALYSTS - Acquiom Vendor Payment Pending Bill Pay Approval',3292]
  	,['transaction','customsearch16199','ACQUIOM ANALYSTS - Credit Memo Open Status',16199]
	,['transaction','customsearch1897_2_2_2_8_10','ACQUIOM ANALYSTS - Acquiom Credit Memo not applied to a Customer Refund',4616]
	,['transaction','customsearch14610','ACQUIOM ANALYSTS - Duplicate Acquiom Refund Detected',14610]
	,['transaction','customsearch3222','ACQUIOM ANALYSTS - 41xxxx Account with no GL Reporting Group',3222]
	,['account','customsearch3936','ACQUIOM ANALYSTS - Acquiom Account Balance is Negative',3936]
	,['account','customsearch5869','ACQUIOM ANALYSTS - No Bank Name Acquiom Cash Accounts',5869]
	,['account','customsearch3937','ACQUIOM ANALYSTS - Acquiom Payment Account missing Account Number',3937]
	,['customrecord_acq_lot','customsearch3120','ACQUIOM ANALYSTS - Approved Exchange Records with no Credit Memo or Customer Refund Link',3120]
	,['customrecord_acq_lot','customsearch7113','ACQUIOM ANALYSTS - Unpaid Exchange Records over $1M 3 weeks old - No Review Notes',7113]
	,['customrecord_acq_lot','customsearch7135','ACQUIOM ANALYSTS - Exchange Record Routing Number ABA starts with 5',7135]
	,['customrecord_void_tracking','customsearch18516','ACQUIOM ANALYSTS - Returned Payment w/ Bank Fee Throwing DER OOB',18516]
	,['customrecord_acq_lot','customsearch4077','ACQUIOM ANALYSTS - Instructed to Pay Date Empty',4077]
    ,['customrecord_payment_import_record','customsearch17780','ACQUIOM ANALYSTS - DER Deal Does not Match GL Acct Deal',17780]
    ,['customrecord_payment_import_record','customsearch18694','ACQUIOM ANALYSTS - DER Missing Other Charges Note',18694]
  	,['customrecord_acq_lot','customsearch17781','ACQUIOM ANALYSTS - Active ER tied to inactive DER',17781]
    ,['customrecord_acq_lot','customsearch16673','ACQUIOM ANALYSTS - Inactive Contact on ER',16673]
    ,['customrecord_acq_lot','customsearch17950','ACQUIOM ANALYSTS -  REVIEW - No Clearinghouse Complete timestamp',17950]
  	,['customrecord_acq_lot','customsearch15134','ACQUIOM ANALYSTS - ER 5 5 no Payment Method - Breaks Payment Dashboard',15134]
	,['customrecord_acq_lot','customsearch5038','ACQUIOM ANALYSTS - Acquiom Certificate Tax Information Incomplete',5038]
	,['customrecord_acq_lot','customsearch4708','ACQUIOM ANALYSTS - State/Country Mismatch on Exchange Records',4708]
  	,['customrecord_acq_lot','customsearch17250','ACQUIOM ANALYSTS - Unpaid Records to Process',17250]
  	,['transaction','customsearch17504','ACQUIOM ANALYSTS - Missing Fed Ref',17504]
	,['customer','customsearch16745','ACQUIOM ANALYSTS - LWWL/Offline ERs Not Yet Solicited',16745]
	,['customrecord_acq_lot','customsearch17141','ACQUIOM ANALYSTS - ERs Failed to Re-Solicit',17141]
	,['customrecord_payment_import_record','customsearch17206','ACQUIOM ANALYSTS - DER Approved to Pay w/ Future Date',17206]
	,['customrecord_acq_lot','customsearch4417','ACQUIOM ANALYSTS - SRS or EM deal Payout Type Incorrect',4417]
	,['customrecord_acq_lot','customsearch4022','ACQUIOM ANALYSTS - No Payout Type populated on Exchange Record',4022]
	,['customrecord_acq_lot','customsearch3943','ACQUIOM ANALYSTS - Transaction Customer Does Not Match Exchange Record',3943]
	,['customrecord_acq_lot','customsearch3935','ACQUIOM ANALYSTS - Exchange Record Customer Category is not Shareholder',3935]
	,['customrecord_acq_lot','customsearch17631','ACQUIOM ANALYSTS - Exchange Records Pending Transfer',17631]
	,['customrecord_acq_lot_cert_entry','customsearch3106','ACQUIOM ANALYSTS - Inactive LOT Certificates Re-Activated by Boomi',3106]
	,['customrecord_acq_lot_cert_entry','customsearch7119','ACQUIOM ANALYSTS - ALERT - Shareholder or Deal Does Not Match LOT CERT vs ER',7119]
  	,['customrecord_acq_lot_cert_entry','customsearch10660','ACQUIOM ANALYSTS - ALERT - Inactive Certificates with $ amount',10660]
	,['supportcase','customsearch3086','CUSTOMER SUPPORT - Open Clearinghouse Lockout Cases',3086]
	,['customrecord_acq_lot','customsearch4712','CUSTOMER SUPPORT - ER in Lockout Status',4712]
  	,['customrecord_acq_lot','customsearch15072','CUSTOMER SUPPORT - Document Ready for Dual Entry no File Attached',15072]
	,['customrecord_acq_lot','customsearch4846','CUSTOMER SUPPORT - DE0 Exchange Record Email does not match Exchange Hash CH 2.0',4846]
	,['customrecord_acq_lot','customsearch3336','CUSTOMER SUPPORT - DE1 Exchange Record Email does not match Exchange Hash CH 1.0',3336]
	,['customrecord_acq_lot','customsearch7139','IMPORTS - LOT HASH 12 does not match Exchange Hash',7139]
	,['customrecord_acq_lot','customsearch7025','IMPORTS  ALERT Zip Code Length Invalid',7025]
	,['transaction','customsearch18536','IMPORTS Acquiom Escrow Only JE - Not Release',18536]
	,['contact','customsearchduplicaterswithportalhash__4','IMPORTS Duplicate Contacts by Email Address with Exchange Records',17308]
  	,['customrecord_acq_lot','customsearch9493','IMPORTS - ALERT - 01/01/1900 Instructed to Pay Date Detected',9493]
	,['customrecord_acq_lot','customsearch3441','IMPORTS No payment amount on Certificate',3441]
  	,['customer','customsearch14063','IMPORTS - Project Name in Customer Record Name (Deal Closed)',14063]];

// REMOVED:
//      ,['customer','customsearch_missing_account_reps','Primary and/or Secondary Account Representative missing']
//      ,['customer','customsearch_pendingreview','Deals Pending Review',631]
//      ,['customer','customsearch_esc_claim_period_mising','Escrow Claim Period Missing',504]
//	,['calendarevent','customsearch_miss_account_or_pct','Missing Account or Percent Release Information in Event',658]
//	,['customer','customsearch_missing_basket_fields','Basket Type selected, but Basket Amount empty',505]
//	,['customer','customsearch_missing_documents','Documents marked Not Received',513]
//	,['customer','customsearch_missing_expense_fund_locat','Expense Fund Location Not Selected',507]
//	,['customer','customsearch_wc_missing_fields','WC Notice Deadline and/or Response Period missing',502]
//	,['customer','customsearch_missing_important_events','No Important Events Recorded',510]
//	,['customer','customsearch_missing_selling_company','Missing Buying and/or Selling Company',537]


var operation_search_alerts = [
	 ['calendarevent','customsearch3173','OPS - SRS Important Dates',3173]
	,['customrecord16','customsearch3897','OPS - Invalid Foundation Deal Contact Detected',3897]
	,['contact','customsearch3321','OPS - FOUNDATION CAPITAL Contact Added',3321]
	,['transaction','customsearch9350','RELEASES Alert - Optitex Disbursements Above Threshold',9350]
	,['customrecord12','customsearch4002','OPS - Invalid Foundation Capital Major Shareholder Record Detected',4002]
  	,['customrecord13','customsearch1092','CUSTOMER SUPPORT - Online Registration Count',1092]
	,['contact','customsearchduplicaterswithportalhash','CUSTOMER SUPPORT - Duplicate Contacts with Portal Access',2524]
	,['customrecord_shareholder_data_access','customsearch1670','CUSTOMER SUPPORT - SDA Missing Shareholder and Investor Group',1670]
  	,['customrecord_shareholder_data_access','customsearch5820','CUSTOMER SUPPORT - Hard Bounce Contact Record with Active SDA-mark inactive and remove email from contact',5820]
  	,['supportcase','customsearch14490','CUSTOMER SUPPORT - Re-Opened IT Cases',14490]
    ,['customrecord_shareholder_data_access','customsearch5559','CUSTOMER SUPPORT - Deal Complete with Active Ignore Zero Balance SDAs',5559]
  	,['customrecord_prepared_email_job','customsearch14234','CUSTOMER SUPPORT - Audit Confirm Case Link Missing',14234]
	,['customer','customsearch3218','IMPORTS - File Conversion Decision Needed',3218]
  	,['customer','customsearch14917','IMPORTS - Shareholder Rep Deal - No Import Record',14917]
	,['customer','customsearch3216','IMPORTS - Confirm Import Completed',3216]
	,['customer','customsearch_customer_name_blank','IMPORTS - Customer Name is blank',665]
	,['calendarevent','customsearch_rel_evnt_miss_gl_account','IMPORTS - Release Event Missing GL Account',739]
	,['calendarevent','customsearch_rel_evnt_miss_gl_account_4','IMPORTS - Event Deal does not match GL Account Deal',5924]
	,['customrecordespr','customsearch_improper_pro_rata_format','IMPORTS - Improperly formatted Pro Rata data',661]
	,['customrecordespr','customsearch2224','IMPORTS - Pro Rata Customer Category is not Shareholder',2224]
  	,['customrecordespr','customsearch16179','Pro Rata Deal does not match GL Deal',16179]
	,['account','customsearch5516',' IMPORTS - FBAR Reporting Invalid - Managing Bank Branch Empty',5516]
	,['account','customsearch3395','IMPORTS - Expense Fund Location Discrepancy - Please Review',3395]
	,['customrecord_shareholder_data_access','customsearch18018','IMPORTS - SDA without Top Level Parent',18018]
	,['account','customsearch5868','IMPORTS - No Bank Name 10XXX Account',5868]
  	,['customer','customsearch17563','Import Record - Deal Contacts Missing',17563]
	,['transaction','customsearch3221','IMPORTS - 10xxx Account with no GL Reporting Group',3221]
	,['transaction','customsearch_escrow_account_type_missing','IMPORTS - GL Account Missing Escrow Account Type',1090]
  	,['transaction','customsearchxferwhpfe1_2','IMPORTS - Alert Invalid TRANSFER Detected',10618]
	,['transaction','customsearch4016','RECON - 10XXX vs 2305 out of Balance DETAIL',4016]
	,['transaction','customsearch7115','ALERT 001232 Acquiom 1.0 vs 2305 out of Balance',7115]
	,['transaction','customsearch3342','RECON - Escalation 161201 Transactions with no related Journal Entry',3342]
	,['calendarevent','customsearch4218','RELEASES - Upcoming Israeli Paying Agent Releases',4218]
	,['customrecord_document_management','customsearch3328','RELEASES - Call Back Dashboard Transactions to Book',3328]
	,['account','customsearch4039','RELEASES - Released Account has a Balance',4039]
	,['customrecord18','customsearchver_neg_deal_balances','RELEASES - Negative Deal Balance',490]
	,['transaction','customsearch_dormant_accounts','RELEASES - Dormant zero-balace Accounts',526]
	,['transaction','customsearch_dormant_accounts_2_2','RELEASES - Dormant Accounts - Active and Released or Unpresented',4023]
	,['transaction','customsearch_dormant_accounts_2','RELEASES - Dormant Accounts Earn Out Report',4017]
  	,['transaction','customsearch16257','RELEASES - Inactive Currencies - 3 Months or more - Clean Up',16257]
	,['transaction','customsearch4043','RELEASES - CSV Journal Entries 10XXX Accounts Need to be Verified',4043]
	,['transaction','customsearch4820','RELEASES -  Journal Entry Deal does not match Account Deal',4820]
	,['transaction','customsearch5974','RELEASES -  Line 1 of Journal Entry is not 10XXX Account - Re-book Lines',5974]
	,['transaction','customsearch4159','RELEASES - Account Inactive Journal not RELEASED',4159]
	,['transaction','customsearch3219','RELEASES - 10xxx Transactions no Escrow populated',3219]
	,['transaction','customsearch3941','RELEASES - Escrow Transaction Type Missing from Journal Entry 10XXX Account',3941]
	,['transaction','customsearch3407','RELEASES - Journal Entry Account Type Does Not Match GL Account Type',3407]
	,['customrecord18','customsearch_esc_tx_missing_acct_status','RELEASES - Escrow Transaction Records missing GL Account',741]
	,['customrecord18','customsearch2641','RELEASES - Escrow Transaction Status Does Not Match Journal Entry Status',2641]
	,['customrecord18','customsearch3406','RELEASES - Escrow Transaction Date Does Not Match Journal Entry Date',3406]
	,['customrecord18','customsearch5947','RELEASES - Alert - Escrow Transaction Customer is not Shareholder',5947]
	,['customrecord18','customsearch4467',' RELEASES - Multiple Currencies Detected - Escrow Transactions in GL account',4467]
	,['customrecord18','customsearch3397','RELEASES - Escrow Transaction Account Type Does Not Match Journal Entry Account Type',3397]];

var ra_search_alerts = [
	 ['customer','customsearch18841','No Products on Deal',18841]
	,['customer','customsearch18842','No Relationship Associate Assigned',18842]
	,['customer','customsearch18843','Closing Date entered this week',18843]
	,['customer','customsearch4127','Deal Closed no Tax Reporting Acquiom Ticket',4127]
	,['customer','customsearch16364','Acquiom Deal Closed - Unpaid Acquiom Invoice',16364]
	,['customer','customsearch18845','Acquiom Deal Closed - No Acquiom Invoice',18845]
	,['customer','customsearch18846','Project Name in Customer Record Name (Deal Closed)',18846]
	,['customrecord_payment_import_record','customsearch18867',' Data Room Requested - Not Populated on Deal Page',18867]
	,['customer','customsearch18847',' PHYSICAL DOCUMENTS REQUIRED FOR PAYMENT Empty',18847]
	,['calendarevent','customsearch18844','Upcoming Important Dates',18844]];


// REMOVED:
//	,['customer','customsearch_missing_deal_accounts','No Deal Accounts recorded',533]
//	,['customrecord18','customsearchver_neg_sh_balances','Negative Shareholder Balance',489]
//	,['customer','customsearch_missing_email','Deal email missing',532]
//	,['customer','customsearch_no_escrow_contacts','Escrow Contacts missing',509]
//	,['customer','customsearch_no_esc_tx_found','No Escrow Transactions found',512]
//	,['customer','customsearch_no_files_attached_to_cust','No Files attached to customer',511]
//	,['customer','customsearch_no_major_shareholders','No Major Shareholders defined',497]
//	,['customer','customsearch_no_sh_esc_con','No Shareholder Participating data found',498]
//	,['customer','customsearch_no_sh_pro_rata','No Shareholder Pro Rata data found',503]
//	,['opportunity','customsearch_ops_missing_tasks','Opportunity Missing Tasks',653]
//	,['opportunity','customsearch_opp_missing_title','Opportunity Missing Title',616]
//	,['transaction','customsearch_trans_ready_for_allocation','Transaction(s) ready for allocation',649]
//	,['supportcase','customsearch_case_missing_case_type','Missing Case Type',518]
//	,['transaction','customsearch_uncleared_transactions','Uncleared Transactions',761]
//	,['customer','customsearch759','Shareholder Bank/Wire Information Needs Approval',759]
//	,['customrecordespr','customsearch_shareholders_wo_unique_lot','Shareholders without unique lot',776]


	
function runScheduled(type)
 {
 	nlapiLogExecution('DEBUG', 'runScheduled FUNCTION', 'Entered the Function');
	runScheduledDocket(type);
	runScheduledOps(type);
	runScheduledRA(type);
 }
 
 function runScheduledDocket(type)
 {
 	nlapiLogExecution('DEBUG', 'runScheduledDocket FUNCTION', 'Entered the Function');
	// get the list of alerts
	/*var docreport = '<h1>Acquiom Alerts</h1>' + buildReports(docket_search_alerts);
	
	var report = docreport;
	
	// put together the report
	var messageSubject = 'Daily Alert Bundle - Acquiom';
	var messageBody = report;
	
	// get list of recipients
	var employeeResults = getRecipientEmployees();

	// email the report
	for (var i = employeeResults.length - 1; i >= 0; i--)
	{
		employee = employeeResults[i];
		
		var employeeId = employee.getValue('internalid',null,null);
		var entityId = employee.getValue('entityid',null,null);
		var email = employee.getValue('email',null,null);
		
		if(email == null || email.length == 0) continue;
		
		nlapiLogExecution("DEBUG", "SRSAlerts.runScheduled", "employeeId:" + employeeId);
		nlapiLogExecution("DEBUG", "SRSAlerts.runScheduled", "entityId:" + entityId);
		nlapiLogExecution("DEBUG", "SRSAlerts.runScheduled", "email:" + email);
		
		Messaging.SendMessage(Settings.TaskNotifications.From, employeeId, messageSubject, messageBody);
	}*/
	var docreport = '<h1>Acquiom Alerts</h1>' + buildReports(docket_search_alerts);
	var messageSubject = 'Daily Alert Bundle - Acquiom';
	runDetail(docreport,messageSubject);
 }
 
 function runScheduledOps(type)
 {
 	 nlapiLogExecution('DEBUG', 'runScheduledOps FUNCTION', 'Entered the Function');
 	 // get the list of alerts
	var opreport = '<br/><h1>Operation Alerts</h1>' + buildReports(operation_search_alerts);
	
	// put together the report
	var messageSubject = 'Daily Alert Bundle - Operations';
	
	runDetail(opreport,messageSubject);
 }

function runScheduledRA(type)
 {
 	 nlapiLogExecution('DEBUG', 'runScheduledRA FUNCTION', 'Entered the Function');
 	 // get the list of alerts
	var opreport = '<br/><h1>RA Alerts</h1>' + buildReports(ra_search_alerts);
	
	// put together the report
	var messageSubject = 'Daily Alert Bundle - RA';
	
	runDetail(opreport,messageSubject);
 }

 
function runDetail(report, subject)
{
	nlapiLogExecution('DEBUG', 'runDetail FUNCTION', 'Entered the Function');
	// put together the report
	var messageSubject = subject;
	var messageBody = report;
	
	// get list of recipients
	var employeeResults = getRecipientEmployees();

	// email the report
	for (var i = employeeResults.length - 1; i >= 0; i--)
	{
		employee = employeeResults[i];
		
		var employeeId = employee.getValue('internalid',null,null);
		var entityId = employee.getValue('entityid',null,null);
		var email = employee.getValue('email',null,null);
		
		if(email == null || email.length == 0) continue;
		
		nlapiLogExecution("DEBUG", "SRSAlerts.runScheduled", "employeeId:" + employeeId);
		nlapiLogExecution("DEBUG", "SRSAlerts.runScheduled", "entityId:" + entityId);
		nlapiLogExecution("DEBUG", "SRSAlerts.runScheduled", "email:" + email);
		
		Messaging.SendMessage(Settings.TaskNotifications.From, employeeId, messageSubject, messageBody);
	}
}
 
 function buildReports(searchAlerts)
 {
 	nlapiLogExecution('DEBUG', 'buildReports FUNCTION', 'Entered the Function');
 	var report = '';
	var emptyReport = '';
	for (var i = 0; i < searchAlerts.length; i++) // loop over docket based reports
	{
		var searchKeys = searchAlerts[i];
		
		var recordType = searchKeys[0];								
		var savedSearchId = searchKeys[1];
		var responseMsg = searchKeys[2];
		var searchId = searchKeys[3];
		
		//var htmlReportLink = '<a href="https://system.na2.netsuite.com/app/common/search/searchresults.nl?searchid=' + searchId + '">View Report</a>'
		var externalURL = nlapiResolveURL('SUITELET', 'customscript_allocation_action_handler', 'customdeploy_allocation_action_handler', true);
		    externalURL = externalURL.replace('forms', 'system');
		var domainURL = externalURL.slice(0, externalURL.search('app'));
		var middleURL = 'app/common/search/searchresults.nl?searchid=';
		var completeURL = domainURL + middleURL + searchId;
		completeURL = completeURL.replace("ext772390.", "");
		
		var htmlReportLink = '<a href="' + completeURL + '">View Report</a>'
		try
		{
			var searchResults = nlapiSearchRecord(recordType, savedSearchId);
			if(searchResults == null || searchResults.length == 0)
			{
				nlapiLogExecution("DEBUG", "SRSAlerts.buildReports", "savedSearchId skipped:" + savedSearchId);
				emptyReport = emptyReport + '<br/> No records found in report: ' + responseMsg + ' <b>' + savedSearchId + '</b> ' + htmlReportLink;
				continue;
			}
			
			report = report + htmlReportLink + '<br/>';
			report = report + '<table>' + formTitle(responseMsg) + formHeader(searchResults[0].getAllColumns());
			for (var j = 0; j < searchResults.length; j++)		// loop over search results
			{
				var result = searchResults[j];
				
				report = report + formLine(result);
			};
			report = report + '</table><br/>';			
		}
		catch(e)
		{
			report = report + '<b><br/>Problem with report ' + savedSearchId + '...error<br/>' + e + '</b><br/>' + htmlReportLink + '<br/>'; 
		}
	};
	return report + emptyReport;
}

function formTitle(title)
{
	nlapiLogExecution('DEBUG', 'formTitle FUNCTION', 'Entered the Function');
	return '<tr><th colspan="4" align="left">' + title + '</th></tr>';
}

function formHeader(columns)
{
	nlapiLogExecution('DEBUG', 'formHeader FUNCTION', 'Entered the Function');
	var header = '<tr>';
	for (var i = 0; i < columns.length; i++)
	{
		var column = columns[i];
		var label = column.getLabel();
		if(label == null)
		{
			label = column.getName();
		}
		
		header = header + '<th>' + label + '</th>';
	};
	header = header + '</tr>';
	
	return header;
}

function formLine(result)
{
	nlapiLogExecution('DEBUG', 'formLine FUNCTION', 'Entered the Function');
	var line = '<tr>';
	
	var columns = result.getAllColumns();
	for (var i = 0; i < columns.length; i++)
	{
		var column = columns[i];
		
		var name = column.getName();
		var join = column.getJoin();
		var summ = column.getSummary();
		
		var display = result.getText(name,join,summ);
		if(display == null)
		{
			display = result.getValue(column);
		}
		
		line = line + '<td>' + display + '</td>';
	};
	
	return line + '</tr>';
}

function getRecipientEmployees()
 {
 	nlapiLogExecution('DEBUG', 'getRecipientEmployees FUNCTION', 'Entered the Function');
	// get list of people with the employee field custentity_receive_op_alerts checked 'Y'
	var filters = new Array();
	var columns = new Array();

	filters[0] = new nlobjSearchFilter('custentity_receive_op_alerts', null, 'is',  'T');                       		// setup filters

	columns[0] = new nlobjSearchColumn('entityid');		// setup columns
	columns[1] = new nlobjSearchColumn('email');
	columns[2] = new nlobjSearchColumn('internalid');
	
	return nlapiSearchRecord('employee', null, filters, columns);                                      // set search results
 }