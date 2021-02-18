//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Accepts a script parameters which is a Job Id.  Sets up the Prepared Email records by loading the template file into them
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/format','N/task','./Shared/SRS_Constants','./Shared/SRS_Functions','/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,file,format,task,srsConstants,srsFunctions,priLibrary) {

	"use strict"

	var scriptName = "SRS_MR_SetupMonthlyStatementRecords.";

	const TEMPLATE = 
	{
		// PORTAL_NEW_LOGIN:18901
		//,PORTAL_LOGIN:18900
			 PORTAL_NEW_LOGIN:665349
		    ,PORTAL_LOGIN:665349
	        ,NEW_PORTAL_URL:664738
	        ,DEMOLINK_URL:664739
	      ,NEW_PORTAL_WEBLINK:807904
	};

    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Process is starting");

		var jobId = runtime.getCurrentScript().getParameter({'name':"custscript_mr_prepared_email_job_id_b"});
		
		// log.debug(funcName, "parms=" + scriptParms); 

		if (!jobId) 
			throw "No Job ID passed in as parameter";

		log.debug(funcName, "Processing job " + jobId); 
		
    	var JOB = record.load({type: "customrecord_prepared_email_job", id: jobId}); 

		// var T = file.load({id: JOB.getValue("custrecord_prepared_email_template")}); 
		
		JOB.setValue("custrecord_prepared_email_job_status", srsConstants.PREPARED_EMAIL_JOB_STATUS.IN_PROCESS); 
		JOB.save(); 
		
		var ss = search.create({
			type:		"customrecord_prepared_emails",
			filters:	[
			        	 	["custrecord_prepared_email_job",search.Operator.IS,jobId]
			        	 	,"AND",["custrecord_prepared_email_status",search.Operator.NONEOF,[srsConstants.PREPARED_EMAIL_JOB_STATUS.COMPLETED]]
			        	 	,"AND",["isinactive",search.Operator.IS,false]
//			        	 	,"AND",["internalidnumber",search.Operator.EQUALTO,[4030583]]
			        	 ],
			columns:	["custrecord_prepared_email_job","custrecord_prepared_email_job.custrecord_prepared_email_template","custrecord_prepared_email_job.custrecord_month_stmt_as_of_date",
			        	 search.createColumn({name: "internalid", sort: search.Sort.ASC}),
			        	 search.createColumn({name: "formulatext_99", formula: "'" + jobId + "'"})]
		}); 
		
		return ss; 		
	}
	
	
	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map ";

    	try {
    		
        	var obj = JSON.parse(context.value);
    		
	    	var jobId = obj.values.formulatext_99;
        	var emailId = obj.id; 

        	funcName += emailId; 
        	
    		log.debug(funcName, context); 
    		
        	var EMAIL = record.load({type: "customrecord_prepared_emails", id: emailId});
        	
        	var fileId = obj.values["custrecord_prepared_email_template.custrecord_prepared_email_job"].value; 
        	
//        	log.debug(funcName, "Loading file " + fileId); 
        	
    		var T = file.load({id: fileId}); 

    		EMAIL.setValue("custrecord_prepared_email_body", T.getContents()); 
    		EMAIL.setValue("custrecord_prepared_email_status", srsConstants.PREPARED_EMAIL_JOB_STATUS.NEW);
    		
    		// var JOB = record.load({type: "customrecord_prepared_email_job"})
    		

    		try {
        		doParseAndReplace(EMAIL, obj.values["custrecord_month_stmt_as_of_date.custrecord_prepared_email_job"]); 
    		} catch (eParse) {    			
    			if (eParse == 'NO_ESCROW_BALANCES_FOUND')
    				EMAIL.setValue('custrecord_prepared_email_err_msg', 'NO_ESCROW_BALANCES_FOUND');
    			else if (eParse == 'PARENT_FIELD_NOT_POPULATED')
    				EMAIL.setValue('custrecord_prepared_email_err_msg', 'PARENT_FIELD_NOT_POPULATED');
    			else if (eParse == 'ERROR_WITH_NON_USD_DENOMINATIONS')
    				EMAIL.setValue('custrecord_prepared_email_err_msg', 'ERROR_WITH_NON_USD_DENOMINATIONS');
    			else if (eParse == 'PROBLEM_FINDING_CHILD_FUNDS')
    				EMAIL.setValue('custrecord_prepared_email_err_msg', 'PROBLEM_FINDING_CHILD_FUNDS');
    			else if (eParse == 'DOES_NOT_RECEIVE_STATEMENTS')
    				EMAIL.setValue('custrecord_prepared_email_err_msg', 'DOES_NOT_RECEIVE_STATEMENTS');
    			else
    				throw eParse;
    			EMAIL.setValue('custrecord_prepared_email_status', srsConstants.PREPARED_EMAIL_JOB_STATUS.ERROR);    			
    		}

    		EMAIL.save(); 

	    	context.write(jobId, emailId);	    	
        	
    	} catch (e) {
				log.error(funcName, e);
				log.error('map process', JSON.stringify(e) ) 
    	}
		
	}

    
	// ================================================================================================================================
    
    
    function doParseAndReplace(EMAIL, asOfDate) {
    	const funcName = scriptName + "doParseAndReplace " + EMAIL.id; 
    	
    	EMAIL.setValue('custrecord_prepared_email_status', srsConstants.PREPARED_EMAIL_JOB_STATUS.IN_PROCESS);

    	  var rpt = EMAIL.getValue('custrecord_prepared_email_body'); // the blank template
    	  var sdaId = EMAIL.getValue('custrecord_rpt_access_record'); // the shareholder data access record
    	  var SDA = record.load({type: 'customrecord_shareholder_data_access', id: sdaId});
    	  //var stingSDA = JSON.stringify(sda);  //STS ADDED TEMPORARY
    	  //nlapiLogExecution("DEBUG", "SDA", "SDA RECORD = " + stingSDA);  //STS ADDED TEMPORARY
    	  
    	  var contact = getContact(EMAIL.getValue('custrecord_prepared_email_recipient')); // 0) Get the contact record associated with the shareholder access record
    	  var errMsg = '';

    	  // verify that this record wants to receive emailed statements
    	  var doNotReceiveStmts = SDA.getValue('custrecord_receive_no_statements');
    	  if (doNotReceiveStmts)
    	    throw 'DOES_NOT_RECEIVE_STATEMENTS';

    	  // @FIRM_NAME@

    	  var firmName = getFirmName(SDA);
    	  rpt = rpt.replace(/@FIRM_NAME@/gi, firmName);

    	  // @STATEMENT_AS_OF_DATE@
    	  // var asOfDate = JOB.getValue('custrecord_month_stmt_as_of_date');
    	  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.doParseAndReplace", "asOfDate = " + asOfDate);
    	  rpt = rpt.replace(/@STATEMENT_AS_OF_DATE@/gi, asOfDate);

    	  //MGS
    	  // @SRS_NEW_PORTAL_URL@
    	  var urlText = getNewPortalURL(contact);
    	  rpt = rpt.replace(/@SRS_NEW_PORTAL_URL@/gi, urlText);

    	  //MGS
    	  // @WEBLINK_HASH@
    	  var linkText = getNewPortalWeblink(contact);
    	  rpt = rpt.replace(/@WEBLINK_HASH@/gi, linkText);

    	  //MGS
    	  //@SRS_DEMOLINK_URL@
    	  var demoLinkText = getDemoLinkURL(contact);
   
    	  rpt = rpt.replace(/@SRS_DEMOLINK_URL@/gi, demoLinkText);

    	  //MGS
    	  //@CONTACT_NAME@
    	  rpt = rpt.replace(/@CONTACT_NAME@/gi, contact.firstname);

    	  //MGS
    	  //@ADVISORY_COMMITTEE@
   
    	  var adComText = getAdComText(contact);

    	  rpt = rpt.replace(/@ADVISORY_COMMITTEE_TEXT@/gi, adComText);

    	  // @SRS_PORTAL_PARAGRAPH@
   
    	  var portalText = getPortalParagraph(contact);
    	  rpt = rpt.replace(/@SRS_PORTAL_PARAGRAPH@/gi, portalText);

    	  // @USD_ESCROW_BALANCES@
    	  var parentId = SDA.getValue('custrecord_toplevelparent'); // this will come back with either the investor group for the shareholders, or a single shareholder
    	  //var deals = toArray(SDA.getValues('custrecord_escrow'));
    	  var deals = toArray(EMAIL.getValue('custrecord_deals'));

    		  
    	  var shareholders = toArray(SDA.getValue('custrecord_shareholder'));
    	  
    	  
    	  if (shareholders == null || shareholders.length == 0) {
    	    if (parentId == null) throw 'PARENT_FIELD_NOT_POPULATED';
    	    shareholders = getChildFunds([parentId], false);
    	  }

    	  var usdData = getEscrowBalances(true, deals, shareholders, asOfDate);
    	  var usdDisp = getEscrowBalanceDisplay(usdData);
    	  //usdDisp = '<table cellpadding="2" cellspacing="1" border="1" bgcolor="red">' + usdDisp;
    	  rpt = rpt.replace(/@USD_ESCROW_BALANCES@/gi, usdDisp);

    	  // @NON_USD_ESCROW_BALANCES@
    	  var nonUsdData = getEscrowBalances(false, deals, shareholders, asOfDate);
    	  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "nonUsdData is " + JSON.stringify(nonUsdData));
    	  //Need to gather ALL the glAccount_Ids before the nonUsdData is converted because after the conversion, the glAccount_Ids no longer exist in the nonUsdData Array
    	  //This is becuase we need the glAccount_Ids to ensure that we are grabbing on ly the events / Important Dates that are associated with the prorata for each shareholder
    	  //based on the accounts they have prorata in
    	  var allData = usdData.concat(nonUsdData);
    	  var accountIDs = [];
    	  for(var i = 0; i < allData.length; i++){
    	    //Build a list of Account IDs
    	    accountIDs.push(allData[i].account_id);  
    	  }

    	  var nonUsdDisp = getEscrowBalanceDisplay(nonUsdData);
    	  //nonUsdDisp = '<table cellpadding="2" cellspacing="1" border="0">' + nonUsdDisp;
    	  rpt = rpt.replace(/@NON_USD_ESCROW_BALANCES@/gi, nonUsdDisp);

    	  var assetOnlyShareholders = SDA.getValue('custrecord_ignore_zero_bal_for_deals');
    	  if ((usdData == null || usdData.length == 0) && (nonUsdData == null || nonUsdData.length == 0)) { // no data found to display
    		  if (assetOnlyShareholders.length == 0)
    	      throw 'NO_ESCROW_BALANCES_FOUND';
    	    else
    	      errMsg = 'ASSET_ONLY_DEAL_DETECTED-NO_ESCROW_BALANCES';
    	  }

    	  // @USD_AND_NON_USD_TOTAL@
    	  // convert nonUsdData to USD
    	  nonUsdData = convertToUSD(nonUsdData, asOfDate);
    	  var totalLine = getEscrowBalanceTotalDisplay(usdData, nonUsdData); //+ '</table>'; //add closing table to make things work for share escrows
    	  totalLine = '<table cellpadding="2" cellspacing="1" border="0">' + totalLine;
    	  rpt = rpt.replace(/@USD_AND_NON_USD_TOTAL@/gi, totalLine);

    	  // get list of major shareholders and the deals they belong to
    	  var majorShrs = getMajorShareholders(shareholders, parentId);
    	  var majorShrDeals = getMajorShareholderDeals(majorShrs, deals);

    	  
    	  // @DEAL_STATUS_REPORTS@

    	  var news = getEscrowStatementNews(deals, asOfDate);
    	  log.debug(funcName, 'news: ' + JSON.stringify(news));
    	  
    	  var newsDisp = displayEscrowStatementNews(news, majorShrDeals, asOfDate);
    	  rpt = rpt.replace(/@DEAL_STATUS_REPORTS@/gi, newsDisp);

    	  // @CASH_FLOW_TABLE@
    	  
    	  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "allData is " + JSON.stringify(allData));
    	  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "accountIDs is " + JSON.stringify(accountIDs)); 
    	  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "deals is " + JSON.stringify(deals)); 
    	  //var releaseDates = filterUniqueDates(getEventDates(deals, [2, 3], ['CONFIRMED', 'COMPLETE'], accountIDs));
    	  var releaseDates = getEventDates(deals, [2, 3], ['CONFIRMED', 'COMPLETE'], accountIDs);
    	  //var releaseDates = getEventDates(deals, [2, 3], ['CONFIRMED', 'COMPLETE']);
    	  var releaseHtml = displayReleaseDateTable(releaseDates);
    	  rpt = rpt.replace(/@CASH_FLOW_TABLE@/gi, releaseHtml);

    	  EMAIL.setValue('custrecord_prepared_email_body', rpt);
    	  EMAIL.setValue('custrecord_prepared_email_status', srsConstants.PREPARED_EMAIL_JOB_STATUS.READY_FOR_CONFIRMATION);
    	  EMAIL.setValue('custrecord_prepared_email_err_msg', errMsg);
    		
    }

    
	// ================================================================================================================================
    
    function displayReleaseDateTable(releaseEvents) {
    	  if (releaseEvents == null || releaseEvents.length == 0) return '';

    	  var html = '<br/><table width="100%"><tr><th colspan="3" align="left"><b>Upcoming Events</b></th></tr><tr><th width="80" align="left">Date</th><th width="300" align="left">Account</th><th width="100" align="left">Percentage of Initial Deposit/Holdback</th></tr>';
    	  for (var i = 0; i < releaseEvents.length; i++) {
    	    var release = releaseEvents[i];
    	    html += '<tr><td>' + release.date + '</td><td>' + release.account_name + '</td><td>' + release.release_pct + '</td></tr>';
    	  }
    	  html += '</table>';

    	  return html;
    	}
    
    function displayEscrowStatementNews(allNews, majorDeals, asOfDate) {
    	  if (allNews == null || allNews.length == 0) return '';

				var html = '<br/><table width="100%"><tr><th colspan="3" align="left"><b>Escrow Statement News</b></th></tr><tr><th width="50" align="left">Date</th><th width="180" align="left">Deal</th><th width="555" align="left">News</th></tr>';
				
				for (var i = 0; i < allNews.length; i++) {
					var news = allNews[i];

					// only add the title at the beginning of the loop

					html += '<tr><td valign="top">' + news.news_date + '</td>';
					html += '<td valign="top">' + news.deal + '</td>';
					if (majorDeals != null && majorDeals.indexOf(news.deal_id) >= 0) {
						html += '<td width="555" valign="top" class="major">' + news.major_news + '</td></tr>';
					} else {
						html += '<td width="555" valign="top">' + news.common_news + '</td></tr>';
					}
					

				}

				html += '</table>';

				// remove header if no data
				if (html == '<br/><table width="100%"><tr><th colspan="3" align="left"><b>Escrow Statement News</b></th></tr><tr><th width="50" align="left">Date</th><th width="180" align="left">Deal</th><th width="555" align="left">News</th></tr></table>'){
					html = '';
				}


/*    	  
			 internalId: result.getValue('internalid')
 			,majorNews:  result.getValue('custrecord90')
 			,commonNews: result.getValue('custrecordcom_sh_news')
 			,date: 		 result.getValue('custrecord89')
*/
				log.debug('HTML', html);	
    	  return html;
    	}

    
    function getEventDates(dealIds,eventTypes,statuses, accountIDs)
    {
//    	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getEventDates", "dealIds is " + dealIds);
//    	nlapiLogExecution("DEBUG", "EmailGeneratorUtil.getEventDates", "glAccountNames is " + accountIDs);
    	if(statuses == null)	statuses = ['CONFIRMED'];
    	var twoMonthsAgo = addMonths(new Date(), -3);
    	
    	var searchFilters = [
        	 ["status",search.Operator.ANYOF,statuses]
        	 ,"AND",["custevent27",search.Operator.ANYOF,eventTypes]
        	 ,"AND",["startdate",search.Operator.ONORAFTER,twoMonthsAgo.format("mm/dd/yyyy")]
        	 ];
    	
    	
    	if(accountIDs != '' && accountIDs != null) {
    		searchFilters.push("AND");
    		searchFilters.push(["custevent_gl_account",search.Operator.ANYOF,accountIDs])
    	}

		searchFilters.push("AND");

    	if(typeof(dealIds) == 'string') {
    		searchFilters.push(["attendee",search.Operator.IS,dealIds])
    	}else{
    		searchFilters.push(["attendee",search.Operator.ANYOF,dealIds])
    	}
    	
		var rpts = search.create({
			type:		"calendarevent",
			filters:	searchFilters,	
			columns:	[search.createColumn({name: "startdate", sort: search.Sort.ASC}),"title","internalid","custevent29","custevent_gl_account","custevent27","attendee","status"]
		}).run().getRange(0,1000);
		
    	if(rpts == null || rpts.length == 0)	return new Array();
    	
    	var theDates = new Array();
    	for(var i = 0; i < rpts.length; i++)
    	{
    		var event = rpts[i];
    		
    		var eventObject = {
    			internalid: 	event.getValue('internalid'),
    			date:			event.getValue('startdate'),
    			title:			event.getValue('title'),
    			release_pct:	event.getValue('custevent29'),
    			account_name:	event.getText('custevent_gl_account'),
    			activity:		event.getText('custevent27'),
    			attendee:		event.getText('attendee'),
    			status:			event.getValue('status'),
    		};
    		
    		theDates.push(eventObject);
    	}
    	
    	return theDates;
    }
    
    
    
    function getEscrowStatementNews(deals, onOrAfter) {
    	  if (deals == null || deals.length == 0 || deals == '') {
    		  log.debug("getEscrowStatementNews","No Deals Found - Exiting"); 
    		  return '';
    	  }

    	  
    	  
  		var ss = search.create({
			type:		"customrecord28",
			filters:	[
			        	 ["custrecord88",search.Operator.ANYOF,deals]
			        	 ,"AND",["custrecord_esn_final_news_date",search.Operator.ONORAFTER,format.format({type: format.Type.DATE, value: onOrAfter})]
			        	 ,"AND",["custrecordesnapproval",search.Operator.ANYOF,["4"]] //4 = Published
			        	 ,"AND",["isinactive",search.Operator.IS,false]
			        	 ],
			columns:	["custrecordesnapproval", "custrecord_esn_final_news_date", "custrecord89","custrecord90","custrecordcom_sh_news","custrecord88",search.createColumn({name: "internalid", sort: search.Sort.DESC})]
		}).run().getRange(0,1000);

  		if (ss.length == 0) return new Array();

    	  var allNews = new Array();
    	  for (var i = 0; i < ss.length; i++) {
    	    var result = ss[i];

    	    var news = {
    	      'deal': result.getText('custrecord88'),
    	      'deal_id': result.getValue('custrecord88'),
    	      'major_news': result.getValue('custrecord90'),
    	      'common_news': result.getValue('custrecordcom_sh_news'),
						'news_date': result.getValue('custrecord89'),
						'final_news_date' : result.getValue('custrecord_esn_final_news_date'),
						'approval' : result.getValue('custrecordesnapproval')
    	    };

    	    allNews.push(news);
    	  }
    	  return allNews;
    	}
    
    

    
    function getChildFunds(parents,objectified)
    {
    	if(parents == null || parents.length == 0) return new Array();

    	
    	var results = search.create({
    		type:		"customer",
    		filters:	[
    		        	 ["toplevelparent.internalid",search.Operator.ANYOF,parents]
    		        	 ,"AND",["category",search.Operator.ANYOF,["2"]]
    		        	 ],
    		columns:	[search.createColumn({name: "companyname", summary: "group"}),search.createColumn({name: "internalid", summary: "group"})]
    	}).run().getRange(0,1000);
    	
    	if (results.length == 0)
    		throw 'PROBLEM_FINDING_CHILD_FUNDS';

    	
    	var shareholders = new Array();
    	for(var i = 0; i < results.length; i++)
    	{
    		var shareholder = results[i];
    		if(objectified)
    		{
    			shareholders.push(
    				{'internalid':shareholder.getValue({name: 'internalid', summary:'group'})
    				,'name':shareholder.getValue({name: 'companyname', summary:'group'})});
    		}
    		else
    		{
    			shareholders.push(shareholder.getValue({name: 'internalid', summary:'group'}));
    		}
    	}
    	
    	return shareholders;
    }
    
    
    
    function getMajorShareholderDeals(shareholders,deals)
    {
    	if(shareholders == null || shareholders.length == 0) return null;
    	if(deals == null || deals.length == 0) return null;

    	
    	var ss = search.create({
    		type:		"customrecord12",
    		filters:	[
    		        	 ["custrecord16",search.Operator.ANYOF,shareholders]
    		        	 ,"AND",["custrecord15",search.Operator.ANYOF,deals]
    		        	 ],
    		columns:	[search.createColumn({name: "custrecord15", summary: "group"})]
    	}).run().getRange(0,1000);
    	
    	
    	if(ss.length == 0)	return new Array();
    	
    	var majorDeals = new Array();
    	for(var i = 0; i < ss.length; i++)
    	{
    		majorDeals.push(ss[i].getValue({name: 'custrecord15', summary:'group'}));
    	}
    	return majorDeals;
    }

    
    function getMajorShareholders(allShareholders,investorGroup)
    {
    	if(typeof(allShareholders) == 'string')
    	{
    		var tmp = allShareholders;
    		allShareholders = new Array();
    		allShareholders.push(tmp);
    	}
    	if(allShareholders == null)
    	{
    		allShareholders = new Array();
    	}
    	if(investorGroup != null)
    	{
    		allShareholders.push(investorGroup);
    	}
    	
    	if(allShareholders.length == 0) return null;
    	
    	var ss = search.create({
    		type:		"customrecord12",
    		filters:	["custrecord16",search.Operator.ANYOF,allShareholders],
    		columns:	[search.createColumn({name: "custrecord16", summary: "group"})]
    	}).run().getRange(0,1000);
    	
    	// query the major shareholders table and return the deals that belong to any of the accessible shareholders or investor group

    	if (ss.length == 0)
    		return null; 
    	
    	var mjrShs = new Array();
    	for(var i = 0; i < ss.length; i++)
    	{
    		mjrShs.push(ss[i].getValue({name: 'custrecord16', summary:'group'}));
    	}
    	return mjrShs;
    }

    
    function getEscrowBalanceTotalDisplay(usdData, nonUsdData) {
    	  if (usdData == null || nonUsdData == null || usdData.length == 0 || nonUsdData.length == 0) return '';

    	  var balances = newBalanceObject();

    	  for (var i = 0; i < usdData.length; i++) {
    	    var usdDatum = usdData[i];
    	    balances = updateBalances(balances, usdDatum);
    	  }

    	  for (var i = 0; i < nonUsdData.length; i++) {
    	    var nonUsdDatum = nonUsdData[i];
    	    balances = updateBalances(balances, nonUsdDatum);
    	  }
    	  //updated display to add table to begin the share escrow display.  Without the table in the line below
    	  //there would be a break in the table structure and an error would appear
    	  var html = '<table cellpadding="2" cellspacing="1" border="0">'; //'';
    	  html += '<tr><th colspan="2" align="left"> &nbsp; Total All Denominations (USD)</th>';
    	  html += createNewStatementLine(balances);

    	  return html;
    	}


    
    function convertToUSD(nonUsdData, asOfDate) {
    	  if (nonUsdData == null || nonUsdData.length == 0) return Array();

    	  var convertedNonUsdData = new Array();
    	  for (var i = 0; i < nonUsdData.length; i++) {
    	    var datum = nonUsdData[i];

    	    //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.convertToUSD", "denomination is " + datum.denomination);

    	    // get the conversion --> denomination = currency
    	    
    	    
    	    var ss = search.create({
    	    	type:		"customrecord_stock_tickers",
    	    	filters:	[
    	    	        	 	["custrecordquote_date",search.Operator.ONORBEFORE,asOfDate]
    	    	        	 	,"AND",["name",search.Operator.IS,datum.denomination]    	    	        	 
    	    	        	 ],
    	    	columns:	[search.createColumn({name: "custrecordquote_date",sort: search.Sort.DESC})]
    	    }).run().getRange(0,1); 
    	    
    	    if (ss.length == 0)
    	    	throw 'ERROR_WITH_NON_USD_DENOMINATIONS';
    	    //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.convertToUSD", "results.length is " + results.length);

    	    var usdConversion = parseFloat(ss[0].getValue('custrecord_srs_usd_quote'));
    	    //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement.convertToUSD", "usdConversion is " + usdConversion);
    	    var convertedDatum = applyConversion(datum, usdConversion); // apply the conversion

    	    convertedNonUsdData.push(convertedDatum); // update the record
    	  }
    	  //nlapiLogExecution("DEBUG", "EmailGeneratorUtil_MonthlyStatement", "convertedNonUsdData is " + JSON.stringify(convertedNonUsdData));
    	  return convertedNonUsdData;
    	}

    
    
    function getEscrowBalanceDisplay(data) {
    	  if (data == null || data.length == 0) return '';

    	  var balances = newBalanceObject();
    	  var runningBalance = newBalanceObject();

    	  var denominationHtml = '<tr><th style="padding: 1em;  font-weight: normal; background-color: white;  color: black;" align="left" colspan="8" >Denomination: ';
    	  //var html = '<tr><th align="center">Account</th>' + '<th align="left">Shareholder</th>' + '<th>Initial<br/>Deposits/<br/>Holdbacks</th>' + '<th>Investment<br/>Earnings</th>' + '<th>Claims<br/>Paid</th>' + '<th>Expenses</th>' + '<th>Disbursements</th>' + '<th>Current<br/>Balance</th></tr>';
    	  var html = '';
    	  var lastDeal = null;
    	  var lastDenom = null;
    	  
    	  for (var i = 0; i < data.length; i++) {
    	    var datum = data[i];

    	    if (lastDeal != null && datum.deal != lastDeal) { // construct the display
    	      // account
    	      html += '<tr style="font-weight:bold;" bgcolor="#e3fffb"><th style="border-top:1px solid #000000; padding-top: 1em; padding-bottom: 1em;" colspan="2" align="left"><b> &nbsp; Subtotal: ' + lastDeal + '</b></th>'; 
    	      html += createNewStatementLine(runningBalance, 'subTotal') + '</tr><tr><th colspan="8">&nbsp;</th></tr>';
    	      runningBalance = newBalanceObject(); // reset
    	    }
    	    
    	    if (lastDenom == null || lastDenom != datum.denomination) html += denominationHtml + datum.denomination + '</th></tr>'; // denomination
    	    
    	    lastDenom = datum.denomination;

    	    if (lastDeal == null || datum.deal != lastDeal) {
    	      html += '<tr><th colspan="8" align="left" style="font-weight: bold; border-top: 5px solid #ffc600; border-bottom: none; padding-top: .5em;  padding-bottom:  .4em; padding-top: 1em">Deal: ' + datum.deal +'</th></tr>';
    	      html += '<tr style="color: #aaa; border-top: none !important;"><th style=" font-weight: normal" align="left">Account</th>' + '<th align="left">Shareholder</th>' + '<th align="right">Initial<br/>Deposit/<br/>Holdback</th>' + '<th align="right">Investment<br/>Earnings</th>' + '<th align="right">Claims<br/>Paid</th>' + '<th align="right">Expenses</th>' + '<th align="right">Disbursements</th>' + '<th align="right">Current<br/>Balance</th></tr>';
    	    }

    	    lastDeal = datum.deal;

    	 

    	    // construct the display
    	    html += '<tr style="line-height: 2;"><td>' + datum.account + '</td>'; // account
    	    html += '<td>' + datum.shareholder + '</td>'; // shareholder
    	    html += createNewStatementLine(datum) + '</tr>'; // all amounts

    	    balances = updateBalances(balances, datum); // update the balances
    	    runningBalance = updateBalances(runningBalance, datum); // update the running balance
    	  }
    	  // add the final subtotal
    	  html += '<tr style="font-weight:bold;" bgcolor="#e3fffb"><th style="border-top:1px solid #000000; padding-top: 1em; padding-bottom: 1em;" colspan="2" align="left"><b> &nbsp; Subtotal: ' + lastDeal + '</b></th>'; // account
    	  html += createNewStatementLine(runningBalance, 'subTotal') + '</tr>';

    	  html += '<tr style="font-weight:bold" valign="bottom"><th style="padding-top: 1.5em;border-top:1px; border-bottom: 4px double #009681;" colspan="2" align="left"><b> &nbsp; Total:</b></th>';
    	  html += createNewStatementLine(balances, 'total');
    	  html += '</tr>';

    	  return html;
    	}
    
    function updateBalances(total, datum) {
    	  total.balance = sumAndRound(total.balance, datum.balance);
    	  total.deposits = sumAndRound(total.deposits, datum.deposits);
    	  total.holdbacks = sumAndRound(total.holdbacks, datum.holdbacks);
    	  total.depositsholdbacks = sumAndRound(total.depositsholdbacks, datum.deposits + datum.holdbacks);
    	  total.investmentearnings = sumAndRound(total.investmentearnings, datum.investmentearnings);
    	  total.claimspaid = sumAndRound(total.claimspaid, datum.claimspaid);
    	  total.expenses = sumAndRound(total.expenses, datum.expenses);
    	  total.disbursements = sumAndRound(total.disbursements, datum.disbursements);

    	  return total;
    	}

    
    function applyConversion(oldDatum, usdConversion) {
    	  var newDatum = newBalanceObject();

    	  newDatum.balance = convert(oldDatum.balance, usdConversion);
    	  newDatum.deposits = convert(oldDatum.deposits, usdConversion);
    	  newDatum.holdbacks = convert(oldDatum.holdbacks, usdConversion);
    	  newDatum.depositsholdbacks = convert(oldDatum.depositsholdbacks, usdConversion);
    	  newDatum.investmentearnings = convert(oldDatum.investmentearnings, usdConversion);
    	  newDatum.claimspaid = convert(oldDatum.claimspaid, usdConversion);
    	  newDatum.expenses = convert(oldDatum.expenses, usdConversion);
    	  newDatum.disbursements = convert(oldDatum.disbursements, usdConversion);

    	  return newDatum;
    	}
    
    function createNewStatementLine(dataLine, isSummary) {
    	  if(isSummary == 'subTotal'){
    	    var tdFormat = '<td style="border-top:1px solid #000000" align="right">';
    	  }else if(isSummary == 'total'){
    	    var tdFormat = '<td style="border-top:1px solid #000000; border-bottom: 4px double #009681;" align="right">';
    	  }else{
    	    var tdFormat = '<td align="right">'   
    	  }
    	  
    	  var html = '';
    	  html += tdFormat + formatCurrency(sumAndRound(dataLine.deposits, dataLine.holdbacks)) + '</td>'; // deposits + holdbacks
    	  html += tdFormat + formatCurrency(dataLine.investmentearnings) + '</td>'; // investment earnings
    	  html += tdFormat + formatCurrency(dataLine.claimspaid) + '</td>'; // claims paid
    	  html += tdFormat + formatCurrency(dataLine.expenses) + '</td>'; // expenses
    	  html += tdFormat + formatCurrency(dataLine.disbursements) + '</td>'; // disbursements
    	  html += tdFormat + formatCurrency(dataLine.balance) + '</td>'; // balance

    	  return html;
    	}

    
    function newBalanceObject() {
    	  var total = {
    	    'balance': 0.0,
    	    'deposits': 0.0,
    	    'holdbacks': 0.0,
    	    'depositsholdbacks': 0.0,
    	    'investmentearnings': 0.0,
    	    'claimspaid': 0.0,
    	    'expenses': 0.0,
    	    'disbursements': 0.0
    	  };
    	  return total;
    	}

    

    function convert(theNum, usdConversion) {
      return Math.round(parseFloat(theNum) * usdConversion * 100.0) / 100;
    }

    
    function addMonths(date, months) {
    	  date.setMonth(date.getMonth() + months);
    	  return date;
    }

    
    function sumAndRound(amt1,amt2)
    {
    	return Math.round((amt1 + amt2) * 100) / 100;
    }

    function formatCurrency(num,currencySymbol,defaultValue,skipIfNull,skipCents)
    {
    	if(num == null || num.length == 0)
    	{
    		if(skipIfNull == true)
    		{
    			return '';
    		}
    		num = defaultValue;
    	}
    	if(num == null) return 'Null';

    	num = num.toString().replace(/\$|\,/g,'');
    	if(isNaN(num))	num = "0";
    	if(currencySymbol == null) currencySymbol = '';

    	sign = (num == (num = Math.abs(num)));
    	num = Math.floor(num*100+0.50000000001);
    	
    	cents = num%100;
    	num = Math.floor(num/100).toString();
    	if(cents<10)	cents = "0" + cents;

    	for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++)
    	{
    		num = num.substring(0,num.length-(4*i+3))	
    				+ ','
    				+ num.substring(num.length-(4*i+3));
    	}

    	if(skipCents == null || skipCents == false)
    		return ((sign)?'':'-') + currencySymbol + num + '.' + cents;
    		
    	return ((sign)?'':'-') + currencySymbol + num;
    }

    
    function getEscrowBalances(isUsd, dealList, shareholderList, asOfDate)
    { // customsearch474
    	if(dealList == null || dealList.length == 0 || shareholderList == null || shareholderList == null) throw 'NO_ESCROW_BALANCES_FOUND';

//    	nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'dealList is ' + dealList);
//    	nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'shareholderList is ' + shareholderList);
    	
//
//    	if(dealList == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'dealList is null');
//    	if(shareholderList == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'shareholderList is null');
//    	if(asOfDate == null) nlapiLogExecution('DEBUG','EmailGeneratorUtil_MonthlyStatement.getEscrowBalances', 'asOfDate is null');
//
    	
    	var ss = search.load({id: "customsearch474"}); 
    	ss.filters.push(search.createFilter({name: "custrecord66", operator: search.Operator.ANYOF, values: dealList}));
    	ss.filters.push(search.createFilter({name: "custrecord67", operator: search.Operator.ANYOF, values: shareholderList}));
    	ss.filters.push(search.createFilter({name: "custrecord65", operator: search.Operator.ONORBEFORE, values: asOfDate}));

    	
    	if (isUsd) 
        	ss.filters.push(search.createFilter({name: "custrecord85", operator: search.Operator.ANYOF, values: [1]}));
    	else 
        	ss.filters.push(search.createFilter({name: "custrecord85", operator: search.Operator.NONEOF, values: [1]}));
    	    	
    	var searchResults = ss.run().getRange(0,1000); 
    	
    	if (searchResults.length == 0)
    		return [];
    	
    	
    	
    	var currDate = new Date(asOfDate);
    	var compDate = new Date(asOfDate);
    		compDate.setMonth(currDate.getMonth() - 1);		// 1 == monthly statements / 3 == quarterly statements

    	var data = new Array();
    	for(var i = 0; i < searchResults.length; i++)
    	{
    		var result = searchResults[i];
    		// var balance = Math.round(parseFloat(result.getValue('custrecord70',null,'sum')) * 100) / 100;
    		var balance = Math.round(parseFloat(result.getValue({name: 'custrecord70', summary: 'sum'})) * 100) / 100;
    		var lastTxDate = new Date(result.getValue({name: 'custrecord65', summary:'max'}));
    		
    		if(balance == 0 && lastTxDate < compDate)	// skip if the last tx was more than 30 days ago and the balance is zero.
    			continue;
    		
    		var datum = {
       			 'account':result.getText({name:'custrecord_glaccount', summary:'group'}) 
    			,'account_id':result.getValue({name:'custrecord_glaccount',summary:'group'})
    			,'deal':result.getText({name:'custrecord66',summary: 'group'})
    			,'shareholder':result.getValue({name:'companyname',join: 'custrecord67', summary:'group'})
    			,'shareholder_id':result.getText({name:'internalid', join: 'custrecord67', summary:'group'})
    			,'denomination':result.getText({name:'custrecord85', summary: 'group'})
    			,'balance':parseFloat(result.getValue({name:'custrecord70', summary:'sum'}))
    			,'deposits':parseFloat(result.getValue({name:'formulanumeric', summary:'sum'}))
    			,'holdbacks':parseFloat(result.getValue({name:'custrecord75', summary:'sum'}))
    			,'investmentearnings':parseFloat(result.getValue({name:'custrecord76', summary:'sum'}))
    			,'claimspaid':parseFloat(result.getValue({name:'custrecord77', summary:'sum'}))
    			,'expenses':parseFloat(result.getValue({name:'custrecord78',summary: 'sum'}))
    			,'disbursements':parseFloat(result.getValue({name:'custrecord103', summary:'sum'}))
    			,'lastTxDate': lastTxDate
    		};
    		
    		data.push(datum);
    	}
    	return data;
    }

    
    function getAdComText(contact)
    {
    //MGS
    //new STS
    	//if(contact.hasaccess == 'F') return 'Has No Access';	
    	
    	//Get the contact record Internal ID to be used in a search to determine if this is a Major Shareholder or not
    	var contactId = contact.internalid;
    	// nlapiLogExecution("DEBUG", "EmailGeneratorUtil.js", "The contactId is " + contactId);
    	//Search for any Major Shareholder records for this contact record Internal ID
    	//need to find Major Shareholder record where contactId equals custrecord_ms_contact (Major Shareholder record field)
    	var ss = search.create({
    		type:		"customrecord12",
    		filters:	["custrecord_ms_contact",search.Operator.IS,contactId],
    		columns:	["custrecord_ms_contact"]
    	}).run().getRange(0,1); 
    	
    	if (ss.length > 0) {
        	var ss = search.create({
        		type:		"customrecord28",
        		filters:	["custrecord88",search.Operator.IS,"591324"],	// SRS Rep Corp Rec
        		columns:	["custrecord_esn_vip_message", "custrecord90",search.createColumn({name: "custrecord89", sort: search.Sort.DESC})]
        	}).run().getRange(0,1);
        	
				//var mostRecentMjrNews = ss[0].getValue('custrecord90');
				var mostRecentMjrNews = ss[0].getValue('custrecord_esn_vip_message');
    		
    		var displayMessage = '<br><br><b>' + mostRecentMjrNews + '</b><br><br>';
    			
    		return displayMessage;

    	}else{    	
    		return '';    	
    	}

    }

    
    function getPortalParagraph(contact)
    {
    	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

    	if(contact.haschangedpwd == 'Y' || (contact.initialpassword == null || contact.initialpassword.length == 0))
    		var F = file.load({id: TEMPLATE.PORTAL_LOGIN}); 
    	else
    		var F = file.load({id: TEMPLATE.PORTAL_NEW_LOGIN}); 

    	if(F == null) return 'contact.haschangedpwd = ' + contact.haschangedpwd + '. Attempted to load file, but was not found';

    	var template = F.getContents();
    	
    	template = template.replace(/@EMAIL_ADDRESS@/gi, contact.email);
    	//template = template.replace(/@USER_INITIAL_PASSWORD@/gi, contact.initialpassword);	// this will only be found if applicable
    	var newUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
    		template = template.replace(/@URL_HASH@/gi, newUserHash);
    	return template;
    }

    
    function getDemoLinkURL(contact)
    {
    //MGS
    	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

    	var template;
    	
    	if(contact.haschangedpwd == 'Y' || (contact.initialpassword == null || contact.initialpassword.length == 0))
    		{
    		var F = file.load({id: TEMPLATE.DEMOLINK_URL}); 
        	template = F.getContents();
    		var currentUserDemoURL = 'https://www.srscomport.com/verify/' + contact.portalhash
    		template = template.replace(/@DEMOLINK_URL@/gi, currentUserDemoURL);
    		}
    	else
    		{
    		var F = file.load({id: TEMPLATE.DEMOLINK_URL}); 
        	template = F.getContents();
    		var newUserDemoURL = 'https://www.srscomport.com/verify/' + contact.portalhash
    		template = template.replace(/@DEMOLINK_URL@/gi, newUserDemoURL);
    		}

    	if(F == null) return 'contact.haschangedpwd = ' + contact.haschangedpwd + '. Attempted to load file, but was not found';


    	return template;

    }

    function getNewPortalWeblink(contact)
    {
    //MGS
    //new
    	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

    	var template;

		var F = file.load({id: TEMPLATE.NEW_PORTAL_WEBLINK}); 
    	template = F.getContents();
    	var currentUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
    	template = template.replace(/@WEBLINK_HASH@/gi, currentUserHash);

    	if(F == null) return 'Attempted to load file, but was not found';

    	return template;
    }


    function getNewPortalURL(contact)
    {
    //MGS
    //new
    	if( /*contact.hasaccess == 'F' ||*/ contact.portalhash == '') return '';		// 1) Query to determine if this person has access to the portal from the contact record

    	var template;
    	
    	if(contact.haschangedpwd == 'Y' || (contact.initialpassword == null || contact.initialpassword.length == 0))
    		{
    		var F = file.load({id: TEMPLATE.NEW_PORTAL_URL}); 
    		template = F.getContents();
    		var currentUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
    		template = template.replace(/@URL_HASH@/gi, currentUserHash);
    		}
    	else
    		{
    		var F = file.load({id: TEMPLATE.NEW_PORTAL_URL}); 
    		template = F.getContents();
    		var newUserHash = 'https://www.srscomport.com/verify/' + contact.portalhash
    		template = template.replace(/@URL_HASH@/gi, newUserHash);
    		}

    	if(F == null) return 'contact.haschangedpwd = ' + contact.haschangedpwd + '. Attempted to load file, but was not found';

    	return template;

    }

    function getFirmName(sda) {
    	// new version for ATO-94
    	  // 0) Find the firm name
    	  //   A) Get the Investor Group name if present. If none...
    	  //   B) Get the first shareholder, and get the parent of that entity. If no parent...
    	  //   C) Use the first shareholder.
    	  // 1) Replace @FIRM_NAME@

    		// 2019.04.22: ATO-94: instead of using the customer name, look up the company name
    	  // var name = sda.getText('custrecord_investor_group');
    	  // if (name != null && name.length > 0) return name;
    	  
    	  if (sda.getValue('custrecord_investor_group'))
    		  return search.lookupFields({type: record.Type.CUSTOMER, id: sda.getValue("custrecord_investor_group"), columns: ["companyname"]}).companyname; 
    	  
    	  
    		// 2019.04.22: ATO-94: instead of using the customer name, look up the company name
    	  var shareholders = sda.getText('custrecord_shareholder');
    	  if (shareholders != null && shareholders.length > 0) {
    		  return search.lookupFields({type: record.Type.CUSTOMER, id: sda.getValue("custrecord_shareholder")[0], columns: ["companyname"]}).companyname;
    		  
    	    // return shareholders[0];
    	  }

    	  return 'no name found';
    	}

/*    
    function getFirmName(sda) {
    	// old version, replaced for ATO-94
  	  // 0) Find the firm name
  	  //   A) Get the Investor Group name if present. If none...
  	  //   B) Get the first shareholder, and get the parent of that entity. If no parent...
  	  //   C) Use the first shareholder.
  	  // 1) Replace @FIRM_NAME@

  	  var name = sda.getText('custrecord_investor_group');
  	  if (name != null && name.length > 0) return name;

  	  var shareholders = sda.getText('custrecord_shareholder');
  	  if (shareholders != null && shareholders.length > 0) {
  	    return shareholders[0];
  	  }

  	  return 'no name found';
  	}
*/
    
    function getContact(contactId)
    {
    	if(contactId == null) throw 'Empty contactId passed in';
    	
    	var ss = search.create({
    		type:		record.Type.CONTACT,
    		filters:	["internalid",search.Operator.IS,contactId],
    		columns:	["entityid","internalid","giveaccess","custentity_initial_password","email","firstname","lastname","address1","address2","address3","city","state","zipcode","fax","company","custentity_portal_hash"]
    	}).run().getRange(0,1); 
    	
	    if (ss.length == 0)
	    	if(searchResults == null || searchResults.length == 0) throw 'NO_CONTACT_FOUND';
    	
    	var result = ss[0];
    	
    	var contact = {
    		'internalid':result.getValue('internalid'),
    		'name':result.getValue('entityid'),
    		'email':result.getValue('email'),
//    		'hasaccess':result.getValue('giveaccess')
    		'initialpassword':result.getValue('custentity_initial_password'),
    		'haschangedpwd':'N',
    		'firstname':result.getValue('firstname'),
    		'lastname':result.getValue('lastname'),
    		'address1':result.getValue('address1'),
    		'address2':result.getValue('address2'),
    		'address3':result.getValue('address3'),
    		'city':result.getValue('city'),
    		'state':result.getValue('state'),
    		'zipcode':result.getValue('zipcode'),
    		'fax':result.getValue('fax'),
    		'company':result.getText('company'),
    		'companyId':result.getValue('company'),
    		'portalhash':result.getValue('custentity_portal_hash')
    	};
    	
    	return contact;
    }

    
    function toArray(list)
    {	// I do not understand why writing this is necessary, but I do not always get arrays out of NS
    	var array = new Array();
    	if(list == null) return array;
    	
    	if(typeof(list) == 'string')
    	{
    		array.push(list);
    		return array;
    	}
    	
    	for(var i = 0; i < list.length; i++)
    	{
    		array.push(parseInt(list[i]));
    	}
    	return array;
    }

    
	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	log.debug(funcName, summary); 
    	
    	var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));
    	
    	
    	var jobId; 
    	
    	summary.output.iterator().each(function(key, value) {
    		
    		// log.debug(funcName, "key=" + key + "; value=" + value); 
    		
    		if (!jobId) {
    			jobId = key;  
    			return false;
    		}    		
    		return true;	    		
    	});

    	if (jobId) {
    		record.submitFields({type: "customrecord_prepared_email_job", id: jobId, values: {custrecord_prepared_email_job_status: srsConstants.PREPARED_EMAIL_JOB_STATUS.READY_FOR_CONFIRMATION}});     		
        	srsFunctions.updatePreparedJobStatusCounters(jobId); 
    	}
    	
    	log.debug(funcName, "Exiting");    	
    }


	// ================================================================================================================================
	// ================================================================================================================================


    return {
        getInputData: getInputData,
        map: map,
//        reduce: reduce,
        summarize: summarize
    };

}
);
