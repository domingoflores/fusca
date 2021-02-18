//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Accepts a script parameters which is a Job Id.  Creates the Monthly Statement Email records for that job
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/plugin','N/task','./Shared/SRS_Constants','./Shared/SRS_Functions','/.bundle/132118/PRI_ServerLibrary'],
		
	function(runtime,record,error,search,plugin,task,srsConstants,srsFunctions,priLibrary) {

	var scriptName = "SRS_MR_GenerateMonthlyStatementRecords.";

	const JOB_STATUS = {
			  NEW: 1,
			  IN_PROCESS: 2,
			  CANCELED: 3,
			  COMPLETED: 4,
			  ERROR: 5,
			  READY_FOR_CONFIRMATION: 6,
			  APPROVED: 7,
			  REJECTED: 8,
			  REVIEW_COMPLETE: 9,
			  PAUSED: 10
			}

    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Process is starting");

		var jobId = runtime.getCurrentScript().getParameter({'name':"custscript_mr_prepared_email_job_id"});
		
		// log.debug(funcName, "parms=" + scriptParms); 

		if (!jobId) 
			throw "No Job ID passed in as parameter";

		
		var ss = search.create({
			type: 		"customrecord_shareholder_data_access",
			filters:	[
			        	 ["isinactive","is","F"] 
			        	 ,"AND",["custrecord_user.email","isnotempty",""] 
			        	 ,"AND",["custrecord_receive_no_statements","is","F"]
//			        	 ,"AND",["internalidnumber",search.Operator.EQUALTO,[4008]]
			        	 ],
			columns:	["custrecord_user","custrecord_escrow","custrecord_shareholder","custrecord_investor_group",search.createColumn({name: "formulatext_99", formula: "'" + jobId + "'"})]
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
    		
    		// var jobId = runtime.getCurrentScript().getParameter({'name':"custscript_mr_prepared_email_job_id"});

	    	var jobId = obj.values.formulatext_99;

        	funcName += jobId + " " + obj.id; 
        	
    		log.debug(funcName, context); 
    		
        	var JOB = record.load({type: "customrecord_prepared_email_job", id: jobId}); 

        	createPreparedEmailRecord(obj, JOB);
        	        	
	    	context.write("jobId", jobId);
	    	
        	
    	} catch (e) {
    		log.error(funcName, e); 
    	}
		
	}

	// ================================================================================================================================

    function createPreparedEmailRecord(report,JOB)
    {
    	const funcName = "createPreparedEmailRecord " + report.id;
    	
    	// check the field custrecord_major_shareholders_only. If set to 'T', then make sure the shareholder is a major shareholder for any deal
    	var sendToMajorShareholdersOnly = JOB.getValue('custrecord_major_shareholders_only');	
    	if(sendToMajorShareholdersOnly)
    	{
    		// check to see if any of the shareholders are a major shareholder for any deal
    		var hasMSAccess = majorShareholderAccess(report);
    		if(!hasMSAccess) return;
    		// else, person has access to at least one major shareholder
    	}
    	
    	var REC = record.create({type: "customrecord_prepared_emails"}); 
    	// status should be already set to 'NEW', or whatever the default status is.
    	
    	// set the user, template/body of the email and subject
    	
    	if (!report.values.custrecord_user || !report.values.custrecord_user.value)
    	// var user = report.values.custrecord_user.value;
    	// if(user == null)
    	{
    		throw 'No User found for Shareholder Report Access Record id: ' + report.id;
    	}

    	var user = report.values.custrecord_user.value;

    	REC.setValue('custrecord_prepared_email_recipient',user);
    	REC.setValue('custrecord_prepared_email_body','EMAIL BODY PENDING');
    	REC.setValue('custrecord_prepared_email_subject',JOB.getValue('name'));
    	REC.setValue('custrecord_rpt_access_record',report.id);

    	// associate to parent prepared email job
    	REC.setValue('custrecord_prepared_email_job',JOB.id);

    	// set the applicable deals
    	// @todo - need to figure out what deals should be set in the case that this field is empty
    	
    	if (report.values.custrecord_escrow)
    		if (report.values.custrecord_escrow.value)
    			var deals = report.values.custrecord_escrow.value;
    		else
    			var deals = report.values.custrecord_escrow;
    		
    	//nlapiLogExecution("AUDIT", "EmailGeneratorUtil_MonthlyStatement.createPreparedEmailRecord", "deals = " + deals);
    	
    	if (!deals) {
    		// need to compensate for bug: since custrecord_escrow is a multi-select field, if any of the selected values has a comma in it, NetSuite just throws the entire value away
    		var SDA = record.load({type: "customrecord_shareholder_data_access", id: report.id}); 
    		deals = SDA.getValue("custrecord_escrow"); 
    	}
    	
    	
    	log.debug(funcName, "deals=" + deals); 
    	
    	if(deals != null && deals.length > 0)
    	{
    		// record.setValues('custrecord_deals',deals.split(','));
    		REC.setValue('custrecord_deals',deals);
    	}
    	
    	try
    	{
    		REC.save(); 
    	}
    	catch(error)
    	{
    		//if(error.indexOf('Code: INVALID_KEY_OR_REF') == 0) return;
    		//throw error + ': Error in EmailGeneratorUtil.createPreparedEmailRecord()';
    	}
    }
    
    
    function majorShareholderAccess(shareholderDataAccessRecord) {
    	const funcName = "majorShareholderAccess " + shareholderDataAccessRecord.id; 
    	
    	// check to see if any of the shareholders are a major shareholder for any deal
    	
    	// 1. get the list of shareholders and the investor group, if any
    	
    	if (!shareholderDataAccessRecord.values.custrecord_shareholder || !shareholderDataAccessRecord.values.custrecord_shareholder.value || !shareholderDataAccessRecord.values.custrecord_investor_group || !shareholderDataAccessRecord.values.custrecord_investor_group.value)
    		return false;
    	
    	
    	var shareholders = shareholderDataAccessRecord.values.custrecord_shareholder.value;
    	var investorGroup = shareholderDataAccessRecord.values.custrecord_investor_group.value;
    	
    	// if((shareholders == null || shareholders.length == 0) && (investorGroup == null || investorGroup.length == 0)) return false;
    	
    	log.debug("EmailGeneratorUtil.majorShareholderAccess", 'shareholders = ' + shareholders);
    	log.debug("EmailGeneratorUtil.majorShareholderAccess", 'investorGroup = ' + investorGroup);

    	if(shareholders != null && shareholders.length > 0)
    		shareholders = toArray(shareholders.split(','));
    	else if(investorGroup != null && investorGroup.length > 0)
    	{	// get the children of the investor group
    		log.debug("EmailGeneratorUtil.majorShareholderAccess", 'Getting child funds of investor group');
    		shareholders = getChildFunds([investorGroup],false);		
    	}
    	
    	// 2. see if any major shareholder is a major shareholder
    	var majorShareholders = getMajorShareholders(shareholders,investorGroup);
    	
    	// 3. if one is found, return true
    	if(majorShareholders != null && majorShareholders.length > 0) return true;

    	// 4. else return false
    	return false;
    }

    
    function getChildFunds(parents,objectified)
    {
    	if(parents == null || parents.length == 0) return new Array();

    	
    	var results = search.create({
    		type:		record.Type.CUSTOMER,
    		filters:	[
    		        	 	["toplevelparent.internalid",search.Operator.ANYOF,parents]
    		        	 	,"AND",["category",search.Operator.ANYOF,["2"]]
    		        	 ],
    		columns: 	[
    		         	 	search.createColumn({name: "companyname", summary: search.Summary.GROUP}),
    		         	 	search.createColumn({name: "internalid", summary: search.Summary.GROUP})
    		         	 	]
    	}).run().getRange(0,1000); 

    	if (results.length == 0)
    		throw 'PROBLEM_FINDING_CHILD_FUNDS';
    	
    	var shareholders = new Array();
    	for(var i = 0; i < results.length; i++)
    	{
    		var shareholder = results[i];
    		if(objectified)
    		{
    			shareholders.push({'internalid':shareholder.getValue({name: "internalid", summary: search.Summary.GROUP})
    				,'name':shareholder.getValue({name: "name", summary: search.Summary.GROUP})});
    		}
    		else
    		{
    			shareholders.push(shareholder.getValue({name: "internalid", summary: search.Summary.GROUP}));
    		}
    	}
    	
    	return shareholders;
    }

    
    function getMajorShareholderDeals(shareholders,deals)
    {
    	if(shareholders == null || shareholders.length == 0) return null;
    	if(deals == null || deals.length == 0) return null;
    	

    	var searchResults = search.create({
    		type:		"customrecord12",
    		filters:	[
    		        	 	["custrecord16",search.Operator.ANYOF,shareholders]
    		        	 	,"AND",["custrecord15",search.Operator.ANYOF,deals]
    		        	 ],
    		columns: 	[search.createColumn({name: "custrecord15", summary: search.Summary.GROUP})]
    	}).run().getRange(0,1000); 


    	if(searchResults == null || searchResults.length == 0)	return new Array();
    	
    	var majorDeals = new Array();
    	for(var i = 0; i < searchResults.length; i++)
    	{
    		var result = searchResults[i];
    		majorDeals.push(result.getValue({name: 'custrecord15', summary: search.Summary.GROUP}));
    	}
    	return majorDeals;
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
    		
    		log.debug(funcName, "key=" + key + "; value=" + value); 
    		
    		if (!jobId) {
    			jobId = value;  
    			return false;
    		}    		
    		return true;	    		
    	});
    	
    	log.debug(funcName, "Updating status and counts for job " + jobId); 

    	record.submitFields({type: "customrecord_prepared_email_job", id: jobId, values: {custrecord_prepared_email_job_status: JOB_STATUS.NEW} }); 

    	srsFunctions.updatePreparedJobStatusCounters(jobId); 
    	
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
