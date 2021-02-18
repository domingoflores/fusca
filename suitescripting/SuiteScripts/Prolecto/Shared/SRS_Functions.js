//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/*
* 
 * shared functions for the Prolecto SRS Scripts
* 
 */
	
define(['N/record','N/error','N/search','N/format','N/ui/serverWidget', 'N/url', 'N/runtime', 'N/http', 'N/https', 'N/task', './SRS_Constants', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_QM_Engine', '/.bundle/132118/PRI_ServerLibrary'],

		
	function(record, error, search, format, serverWidget, url, runtime, http, https, task, srsConstants, appSettings, qmEngine, priLibrary) {

	"use strict";

    var scriptName = "SRS_Functions.";

    
    String.prototype.startsWith = String.prototype.startsWith || function(searchString) {
          return this.substr(0, searchString.length) === searchString;
    };

    String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
          return this.slice(-suffix.length) == suffix;
    };

    String.prototype.replaceAll = String.prototype.replaceAll || function(replaceWhat, replaceWith) {
          return this.replace(new RegExp(replaceWhat, 'g'), replaceWith);
    }

    String.prototype.padLeft = String.prototype.padLeft || function(len, c){
        var s = this, c= c || '0';
        while(s.length < len) s = c+ s;
        return s;
    }
    
    
    Date.prototype.addDays = Date.prototype.addDays || function( days ) {
	   	return this.setDate( this.getDate() + days ) && this;
	};

	Date.prototype.addMonths = Date.prototype.addMonths || function(nbrOfMonths) {
		var m, d = (date = new Date(+this)).getDate()

		date.setMonth(date.getMonth() +nbrOfMonths, 1)
		m = date.getMonth()
		date.setDate(d)
		if (date.getMonth() !== m) date.setDate(0);

		return date;	  
	}
	
	Date.prototype.diffDays = Date.prototype.diffDays || function(b) {
		
		var MS_PER_DAY = 86400000;
		
		var utc1 = Date.UTC(this.getFullYear(), this.getMonth(), this.getDate());
		var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

		return Math.floor((utc2 - utc1) / MS_PER_DAY);		
	} 
		

	Date.prototype.format = Date.prototype.format || function (formatString) {
		var element = "";
		var i = 0;
		var result = "";

		do {
			if ( (element.length > 0) && (formatString.charAt(i).toLowerCase() != element.substring(element.length-1).toLowerCase()) ) {
				result += formatDateTimeElement(this, element);
				element = "";
			}
			element += formatString.charAt(i++);
		} while (i <= formatString.length);

		if (element.length > 0)
			result += formatDateTimeElement(d, element);

		return result;
	}


	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    function disableFormFields(fieldList, form) {              
        if (!(fieldList instanceof Array))
              fieldList = [fieldList];
        
        for (f in fieldList) {
              var fld = form.getField(fieldList[f]);
              if (fld)
                    fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
        }
  }

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    function hideFormFields(fieldList, form) {              
          if (!(fieldList instanceof Array))
                fieldList = [fieldList];
          
          for (f in fieldList) {
                var fld = form.getField(fieldList[f]);
                if (fld)
                      fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
          }
    }

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    function hideButtons(buttonList, form) {              
        if (!(buttonList instanceof Array))
        	buttonList = [buttonList];
        
        for (f in buttonList) {
              var btn = form.getButton(buttonList[f]);
              if (btn) {
				btn.isDisabled = true;
				btn.isHidden = true;    					                	  
              }
        }
  }

    
	
	function formatDateTimeElement(dt, formatString) {
		
		var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
		var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

		switch (formatString.toLowerCase()) {

			case "m" : 		return dt.getMonth()+1;
							break;
		
			case "mm" :		return dt.getMonth() < 9 ? "0" + (dt.getMonth() + 1).toString() : dt.getMonth()+1;
							break;
		
			case "mmm" :	return (formatString == "MMM") ? monthNames[dt.getMonth()].substring(0,3).toUpperCase() : monthNames[dt.getMonth()].substring(0,3);
							break;              
		
			case "mmmm" : 	return (formatString == "MMMM") ?  monthNames[dt.getMonth()].toUpperCase() : monthNames[dt.getMonth()];
							break;
		
			case "d" :		return dt.getDate();
							break;
		
			case "dd" : 	return (dt.getDate() < 10) ? "0" + (dt.getDate()).toString() : dt.getDate();
							break;
		
			case "ddd" : 	return (formatString == "DDD") ? dayNames[dt.getDay()].substring(0,3).toUpperCase() : dayNames[dt.getDay()].substring(0,3);
							break;              
		
			case "dddd" : 	return (formatString == "DDDD") ? dayNames[dt.getDay()].toUpperCase() : dayNames[dt.getDay()];
							break;
		
			case "yy" : 	return dt.getFullYear() % 100;
							break;
		
			case "yyyy" : 	return dt.getFullYear();
							break;
		
							
			case "h" :		return dt.getHours();
							break;
							
			case "hh" : 	return (dt.getHours() < 10) ? "0" + (dt.getHours()).toString() : dt.getHours();
							break;
		
			case "n" :		return dt.getMinutes();
							break;
		
			case "nn" : 	return (dt.getMinutes() < 10) ? "0" + (dt.getMinutes()).toString() : dt.getMinutes();
							break;
		
			case "s" :		return dt.getSeconds();
							break;
		
			case "ss" :		return (dt.getSeconds() < 10) ?  "0" + (dt.getSeconds()).toString() : dt.getSeconds();
							break;
		
			default: 
				return formatString;
		}

	}

    
	function customerEmailSent(custId, emailAddress) {
		
		var ss = search.create({
			type:		record.Type.MESSAGE,
			 filters:	[
			         	 	["entity.internalid",search.Operator.ANYOF,custId] 
			         	 	,"AND",["recipientemail","startswith",emailAddress]
			         	 ]
		}).run().getRange(0,1); 
		
		return (ss.length > 0); 			
	}
	
	
	function userIsAdmin() {
		var userRole = runtime.getCurrentUser().role;  
			
		return (userRole == srsConstants.USER_ROLE.ADMINISTRATOR || userRole == srsConstants.USER_ROLE.RESTLET_ADMINISTRATOR || userRole == srsConstants.USER_ROLE.CUSTOM_ADMINISTRATOR)				
	}
	
	
	function userCanApproveKYC() {
		if (userIsAdmin())
			return true;
		
		var approvedUsers = appSettings.readAppSetting(srsConstants.SRS_GENERAL_APP_NAME, "KYC Approvers");
		
		var empList = approvedUsers.split(",");
		
		var id = runtime.getCurrentUser().id.toString();

		return (empList.indexOf(id) >= 0); 
	}
	//ported validation logic into functions so that we can validate
	//from both UE as well as in suitelet after button is clicked in client side. 
	function validateDER_Promote5BERs(REC)
	{
		var isValid = false;
		 if (
				 	//We will allow promote 5B ERs if there are no deficiences and RSM is running
				 //or even if there are defficiences, but none of them are approved to pay deficiencies 
					(REC.getValue("custrecord_pay_import_deficiencies") 
							&& 
							REC.getValue("custrecord_pay_import_deficiencies").length === 0
							&&
							REC.getValue("custrecord_der_acq_rsm_run_status")	
							)
							|| 
							(REC.getValue("custrecord_pay_import_deficiencies") 
							&& 
							REC.getValue("custrecord_pay_import_deficiencies").length > 0
							&&
							(REC.getValue("custrecord_pay_import_deficiencies").indexOf(String(srsConstants["DER Deficiencies"]["Acquiom Approved to Pay"]))===-1)
							&& 
							(REC.getValue("custrecord_pay_import_deficiencies").indexOf(String(srsConstants["DER Deficiencies"]["Counsel Approved to Pay"]))===-1)
							&&
							(REC.getValue("custrecord_pay_import_deficiencies").indexOf(String(srsConstants["DER Deficiencies"]["Ops Approved to Pay"]))===-1)
							&&
							REC.getValue("custrecord_der_acq_rsm_run_status")
							)
					)
					 {
					 	isValid = true;
					 }
		 return isValid;
	}
	
	
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
	//given an array of parent customer internal ids, return all their children
	function getChildShareholders (arrayOfParents)
	{
			var customerSearchObj = search.create({
			   type: "customer",
			   filters:
			   [
				   ["parent","anyof",arrayOfParents]
			   ],
			   columns:
			   [
			      // search.createColumn({name: "entityid", label: "Name"}),
			   ]
			});
			var results = [];
			 customerSearchObj.run().each(function(result){
			  results.push(result.id);
			   return true;
			});
			 return results;
	}
	
	
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


	function getChromeRiverAPIKey() {
		return appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "API Key"); 
	} 

	function getChromeRiverCustomerCode() {
		return appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "Customer Code"); 
	} 
	

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	function postToChromeRiver(postURL, data, dataType) {

		var funcName = scriptName + "postToChromeRiver " + dataType; 
		
    	log.debug(funcName, postURL);
    	log.debug(funcName, data);

    	log.debug(funcName, "Payload Length=" + JSON.stringify(data).length); 
    	
    	var postHeaders = {"x-api-key": getChromeRiverAPIKey(), "customer-code": getChromeRiverCustomerCode(),  "Content-Type": "application/json", "Accept": "application/json" };
    	
    	log.debug(funcName, postHeaders);

    	var errorMsg = "";
    	
    	while (data.length > 0) {
    		var tempList = data.splice(0, srsConstants.MAX_ENTRIES_TO_SEND); 
    		
    		postResponse = postIt(postURL, postHeaders, tempList); 
    		
    		if (postResponse.code != '200') {
    			errorMsg += JSON.stringify(postResponse);
            	log.error(funcName, postResponse);        			
    		}        		
    	}
    		

        if (errorMsg == ""){
        	appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "Last Successful " + dataType + " Post", new Date(), appSettings.FIELD_TYPES.DATEANDTIME);
        	log.debug(funcName, "Send of all '" + dataType + "' data completed successfully."); 
            return true;                
        }
        else {
        	appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "Last Failed " + dataType + " Post", new Date(), appSettings.FIELD_TYPES.DATEANDTIME); 
        	// var errorMsg = JSON.stringify(r);
        	errorMsg = (errorMsg.length > 4000) ? errorMsg.substring(0,4000) : errorMsg; 
        	appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "Last Failed " + dataType + " Post Error", errorMsg, appSettings.FIELD_TYPES.TEXT);
        	return false;
        	// log.error(funcName, r);            	
        	// var errorResponse = r.code + ": " + r.body;
        }

	} 
	
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	function postIt(postURL, postHeaders, postData) {
		
		log.debug("postId", "Sending " + postData.length + " entries to " + postURL + ".   Usage Remaining " + runtime.getCurrentScript().getRemainingUsage()); 
		
    	if (postURL.toLowerCase().indexOf("https:") >= 0) {
        	var r = https.post({
                'url': postURL,
                'headers': postHeaders, 
                'body':JSON.stringify(postData)
        		
        	});        		
    	} 
    	else {
        	var r = http.post({
                'url': postURL,
                'headers': postHeaders, 
                'body':JSON.stringify(postData)
        	});        		
    	}

    	return r;
	}
	
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */		
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */		
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	function executeRSMMapReduceScript(searchDef) {
		var funcName = scriptName + "executeRSMMapReduceScript"; 
		try {
			var scriptTask = task.create({
				taskType: 	task.TaskType.MAP_REDUCE,
				scriptId: 	"customscript_pri_rsm_mr_evaluate",
				params:		{custscript_pri_rsm_mr_search_obj: searchDef
				}				
			});
			
            var scriptTaskId = scriptTask.submit();

            log.debug(funcName, "Map/Reduce Script Submitted: " + scriptTaskId + " for search " + JSON.stringify(searchDef)); 	            

            return true; 
		} catch (e) {
			return false;
		}
	}
	
	function writeExchangeRecordsToRSMQueue(exchangeFilter) {
		
		var funcName = scriptName + "writeExchangeRecordsToRSMQueue";
		
		
		//  skip exchange records which are inactive, or already paid
		exchangeFilter.push("AND");
		exchangeFilter.push(["isinactive",search.Operator.IS,false]); 
		exchangeFilter.push("AND");
		exchangeFilter.push(["custrecord_acq_loth_related_trans",search.Operator.IS,["@NONE@"]]); 
		exchangeFilter.push("AND");
		exchangeFilter.push(["custrecord_ch_completed_datetime","isnotempty",""]); 
		exchangeFilter.push("AND");
		exchangeFilter.push(["custrecord_acq_loth_zzz_zzz_acqstatus","noneof", srsConstants["Acquiom LOT Status"]["5f. Payment Processing"]]); 
		 
		log.debug(funcName, exchangeFilter); 
					
		var searchObj = {type: "customrecord_acq_lot", filters: exchangeFilter, columns: ["internalid"]}; 
		
		//we are now executing search prior to scheduling map reduce or adding them to the queue
		//to ensure that results exists 
		var ss = search.create(searchObj).run().getRange(0,1);
		if (ss.length>0)
		{
			log.debug("Sending " + ss.length + " for processing ");
			if (!executeRSMMapReduceScript(searchObj)) 
			{
				// the task couldn't execute (presumably because all deployments are already executing), so drop it into the queue
				
				qmEngine.addQueueEntry({queueName: srsConstants.QUEUE_NAMES.RSM_MAP_REDUCE, params: JSON.stringify(searchObj), preventDuplicates: true, scheduledScriptId: "customscript_srs_sc_submit_rsm_mapreduce"}); 					
				log.debug(funcName, "Wrote Queue ER Entry to process " + JSON.stringify(searchObj));
			}
		}
		else 
		{
			log.debug("ER: No Search Results found for query ", JSON.stringify(exchangeFilter));
		}

	}
	function writeDocumentCustomsToRSMQueue(doccustomFilter) {
		
		var funcName = scriptName + "writeDocumentCustomsToRSMQueue";
		
		
		//  skip Docuemnt Custom which are inactive
		log.debug(funcName, doccustomFilter); 
					
		var searchObj = {type: "customrecord_document_management", filters: doccustomFilter, columns: ["internalid"]}; 
		var ss = search.create(searchObj).run().getRange(0,1);
		//we are now executing search prior to scheduling map reduce or adding them to the queue
		//to ensure that results exists 
		if (ss.length>0)
		{
			log.debug("Sending " + ss.length + " for processing ");
			if (!executeRSMMapReduceScript(searchObj)) {
				// the task couldn't execute (presumably because all deployments are already executing), so drop it into the queue
				qmEngine.addQueueEntry({queueName: srsConstants.QUEUE_NAMES.RSM_MAP_REDUCE, params: JSON.stringify(searchObj), preventDuplicates: true, scheduledScriptId: "customscript_srs_sc_submit_rsm_mapreduce"}); 					
				
				log.debug(funcName, "Wrote Queue DOC CUST Entry to process " + JSON.stringify(searchObj)); 
			}
		}
		else 
		{
			log.debug("Document (Custom): No Search Results found for query ", JSON.stringify(doccustomFilter));
		}

	}
	
	
	
	
	
function writeDERRecordsToRSMQueue(derFilter) {
		
		var funcName = scriptName + "writeDERRecordsToRSMQueue";
		
		
		//  skip DER records which are inactive
		derFilter.push("AND");
		derFilter.push(["isinactive",search.Operator.IS,false]); 
		
		log.debug(funcName, derFilter); 
					
		var searchObj = {type: "customrecord_payment_import_record", filters: derFilter, columns: ["internalid"]}; 
		
		//we are now executing search prior to scheduling map reduce or adding them to the queue
		//to ensure that results exists 
		var ss = search.create(searchObj).run().getRange(0,1);
		if (ss.length>0)
		{
			log.debug("Sending " + ss.length + " for processing ");
			if (!executeRSMMapReduceScript(searchObj)) 
			{
				// the task couldn't execute (presumably because all deployments are already executing), so drop it into the queue
				qmEngine.addQueueEntry({queueName: srsConstants.QUEUE_NAMES.RSM_MAP_REDUCE, params: JSON.stringify(searchObj), preventDuplicates: true, scheduledScriptId: "customscript_srs_sc_submit_rsm_mapreduce"}); 					
				
				log.debug(funcName, "Wrote Queue DER Entry to process " + JSON.stringify(searchObj)); 
			}
		}
		else 
		{
			log.debug("DER: No Search Results found for query ", JSON.stringify(derFilter));
		}

	}

//given oldrecord, and newrecord, and fieldid, push into array values uniquely
//intended to work with internal record ids
function addRecordsToArray(oldRecord,newRecord,field,arr) 
{
	
	var funcName = scriptName + "addRecordsToArray";
		if (!field)
		{
			return arr;
		}
		var id = newRecord.getValue({fieldId: field});
		if (id)
		{
			if (arr.indexOf(id) === -1)
			{
				arr.push(id);
			}
		}
		if (oldRecord)
		{
			id = oldRecord.getValue({fieldId: field});
			if (id)
			{
				if (arr.indexOf(id) === -1)
				{
					arr.push(id);
				}
			}
		}
		return arr;
}

	
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    function updatePreparedJobStatusCounters(jobId) {
    	const funcName = scriptName + "updatePreparedJobStatusCounters " + jobId;
    	
    	log.debug(funcName, "Starting");

    	var JOB = record.load({type: "customrecord_prepared_email_job", id: jobId}); 
    	

    	var ss = search.create({
    		type:		"customrecord_prepared_emails",
    		filters:	[
    		        	 	["custrecord_prepared_email_job",search.Operator.IS,jobId]    		        	 	
    		        	 ],
    		columns:	[
    		        	 	search.createColumn({name: "custrecord_prepared_email_status", summary: search.Summary.GROUP}),
 	    		         	search.createColumn({name: "internalid", summary: search.Summary.COUNT})
    		        	 ]    		
    	}).run().getRange(0,1000);
    	
    	var totalCount = 0;
    	
    	for (var i = 0; i < ss.length; i++) {
    		var result = ss[i];
    		
    		var statusCount = parseInt(result.getValue({name: "internalid", summary: search.Summary.COUNT})); 
    		
    		if (result.getValue({name: "custrecord_prepared_email_status", summary: search.Summary.GROUP}) == srsConstants.PREPARED_EMAIL_JOB_STATUS.REJECTED)
    			JOB.setValue('custrecord_prepared_job_rejected_emails',statusCount);
    		else if (result.getValue({name: "custrecord_prepared_email_status", summary: search.Summary.GROUP}) == srsConstants.PREPARED_EMAIL_JOB_STATUS.APPROVED)
    			JOB.setValue('custrecord_prepared_job_approved_emails',statusCount);
    		else if (result.getValue({name: "custrecord_prepared_email_status", summary: search.Summary.GROUP}) == srsConstants.PREPARED_EMAIL_JOB_STATUS.ERROR)
    			JOB.setValue('custrecord_prepared_job_errored_emails',statusCount);
    		else if (result.getValue({name: "custrecord_prepared_email_status", summary: search.Summary.GROUP}) == srsConstants.PREPARED_EMAIL_JOB_STATUS.COMPLETED)
    			JOB.setValue('custrecord_prepared_job_completed_emails',statusCount);
    		else 
    			JOB.setValue('custrecord_prepared_job_to_review_emails',statusCount);
    		
    		totalCount += statusCount;
    		
    	}
    	
		JOB.setValue('custrecord_prepared_job_total_emails',totalCount);
		
		JOB.save(); 

    }

 	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	function getRecordInternalIDNumber(recid) {
	    	
        var recordurl = url.resolveRecord({
            "recordType" : recid
        });
        var retValue = recordurl.split("=")[1];
		if (retValue && retValue.indexOf("&")>0)
		{
			retValue = retValue.split("&")[0];
		}
		
		//log.debug("Record internal id " + recid + " is " + retValue);
		return retValue;
	}

	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

	function getAnchor(recordtype, internalid) {
     	var link = url.resolveRecord({
			    recordType: recordtype,
			    recordId: internalid,
			    isEditMode: false
			});
     	link = "<a href=\""+link+"\" target=\"_blank\">"+internalid+"</a>";
     	return link;
	}
		
	/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    return {

    	disableFormFields:				disableFormFields,
    	hideFormFields:					hideFormFields,
    	hideButtons:					hideButtons,
    	
    	customerEmailSent:				customerEmailSent,
    	userIsAdmin:					userIsAdmin,
    	userCanApproveKYC:				userCanApproveKYC,
    	validateDER_Promote5BERs : validateDER_Promote5BERs,
    	getChildShareholders : getChildShareholders,
    	getChromeRiverAPIKey:			getChromeRiverAPIKey,
    	getChromeRiverCustomerCode:		getChromeRiverCustomerCode,
    	
    	postToChromeRiver:				postToChromeRiver,
    	
    	writeExchangeRecordsToRSMQueue:	writeExchangeRecordsToRSMQueue,
    	writeDERRecordsToRSMQueue : writeDERRecordsToRSMQueue,
    	writeDocumentCustomsToRSMQueue : writeDocumentCustomsToRSMQueue,
    	executeRSMMapReduceScript:		executeRSMMapReduceScript,
    	addRecordsToArray : addRecordsToArray,
    	updatePreparedJobStatusCounters:	updatePreparedJobStatusCounters,
    	getRecordInternalIDNumber: getRecordInternalIDNumber,
    	getAnchor : getAnchor
    	
    };
});
