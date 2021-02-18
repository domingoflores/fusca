//------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */

/*
 *
 * Process results that may otherwise time out 
 * 
 */

define(["N/search", "N/record", "N/runtime", "N/task", "N/email", "N/format"
	, "/SuiteScripts/Prolecto/Shared/SRS_Constants"
	, "/SuiteScripts/Prolecto/Shared/SRS_Functions"
	, "/.bundle/132118/PRI_QM_Engine"
	, "/.bundle/132118/PRI_ServerLibrary"],
    function(search, record, runtime, task, email, format
    		, srsConstants
    		, srsFunctions
    		, qmEngine
    		, priLibrary) {

		"use strict";

		var scriptName = "generatePaidUnpaidListQueue.";

    	var MIN_USAGE_THRESHOLD = 500;    	
    	
		function execute(context) {
        
			var funcName = scriptName + "execute";
			            
        	var allDone = false;
        	
        	log.debug(funcName, "Starting");
        	
        	var obj = null;
        	var lists = null;
        	var processCompleted = false;
        	var currentindex = 0;
        	var dealList = null;
			var dealCount = null;
			var runDate = null;
			
			var jobID = "";
			var scriptTask = null;
			var scriptTaskId = "";
			var pupRptRequired = false;
			var dealCMCountToday = 0;
			var dealCMCountThisMonth = 0;
			var paidERCount = 0;
			var unpaidERCount = 0;
			var dealID = "";
			var i = 0;
			var dealPUPFP = "";
			var relationAssociate = "";
			var relationAssociateInactive = true;
			var relationManagerInactive = true;
			var relationManager = "";
			var thisMonthsCMList = [];
			var todaysCMList = [];
			var dealContactEmails = "";
			var contactEmails = false; 
			var todayIsMonthEnd = false;
			var options  = {};
			
        	do {
            	obj = qmEngine.getNextQueueEntry(srsConstants.QUEUE_NAMES.PAID_UNPAID);
            	
				if (obj !== null && typeof obj === "object") {
					
					try {
						
						lists = JSON.parse(obj.parms); 
//						log.audit("lists ", JSON.stringify(lists));
						
						processCompleted = false;
						
						currentindex = lists.currentindex;
						log.debug("currentindex ", currentindex);
						
						dealList = lists.dealList;
						log.debug("_dealList ", JSON.stringify(dealList));
						thisMonthsCMList = lists.thisMonthsCMList;
						todaysCMList = lists.todaysCMList;
						dealCount = dealList.length;
						runDate = lists.runDate;
						todayIsMonthEnd = lists.todayIsMonthEnd;
						
						jobID = "";
						
						if (currentindex === 0)
						{
							log.audit("runDate " , runDate);
							log.audit("typeof runDate ", typeof runDate);
							runDate = new Date(runDate);
							log.audit("typeof runDate ", typeof runDate);
							
							jobID = createJob(runDate);
							lists.jobID = jobID;
						}
						else 
						{
							jobID = lists.jobID;
						}
						
						for (i = currentindex; i < dealCount; i+=1) 
						{
							pupRptRequired = true;
							dealCMCountToday = 0;
							dealCMCountThisMonth = 0;
							paidERCount = 0;
							unpaidERCount = 0;
							
							dealID = (dealList[i].values["GROUP(internalid)"] && dealList[i].values["GROUP(internalid)"][0] && dealList[i].values["GROUP(internalid)"][0]["value"]);
							
							dealPUPFP = dealList[i].values["MAX(custentity_pup_freq_profile.internalid)"];
							
							relationAssociate = (dealList[i].values["GROUP(custentityacqdea_relationship_associate)"] && dealList[i].values["GROUP(custentityacqdea_relationship_associate)"][0] && dealList[i].values["GROUP(custentityacqdea_relationship_associate)"][0]["value"]) || "";
							
							relationAssociateInactive = dealList[i].values["GROUP(CUSTENTITYACQDEA_RELATIONSHIP_ASSOCIATE.isinactive)"];
							relationManagerInactive = dealList[i].values["GROUP(CUSTENTITYCUSTENTITY_ACQ_DEAL_RELATIONMA.isinactive)"];
							
							relationManager = (dealList[i].values["GROUP(custentitycustentity_acq_deal_relationma)"] && dealList[i].values["GROUP(custentitycustentity_acq_deal_relationma)"][0] && dealList[i].values["GROUP(custentitycustentity_acq_deal_relationma)"][0]["value"]) || "";
								
							paidERCount = dealList[i].values["SUM(formulanumeric1)"];
							unpaidERCount = dealList[i].values["SUM(formulanumeric2)"];
							
							dealCMCountToday = parseInt(getDealCMCountToday(todaysCMList, dealID),10);
							dealCMCountThisMonth = parseInt(getDealCMCountThisMonth(thisMonthsCMList, dealID),10);

							dealContactEmails = getDealContactEmails(dealID);

							contactEmails = false;

							if (dealContactEmails.length > 0)
							{
								dealContactEmails = dealContactEmails.join(";");
								contactEmails = true;
							}

							if (relationManager && relationManagerInactive)
							{
								relationManager = "";
							}

							if (relationAssociate && relationAssociateInactive)
							{
								relationAssociate = "";
							}


							// Determine selection based on PUP Frequency Profile ID
							switch (parseInt(dealPUPFP,10)) {
								case 1: // Always
									if (parseInt(paidERCount,10) === 0) { //"Always" Deals must have at least 1 paid Ex Rec
										pupRptRequired = false;
										break;
									}
									// If there are no unpaid exchange records then check if there is a credit memo 
									// for today
									if (parseInt(unpaidERCount,10) === 0) {
										pupRptRequired = false; //"Always" Deals must have at least 1 unpaid Ex Rec
										if (parseInt(dealCMCountToday,10) > 0) { //and 1 of them was for this Deal ...
											pupRptRequired = true; // then include Deal in Paid Unpaid report
										}
									}
									break;
								case 3: // Transactional
									if (parseInt(dealCMCountToday,10) === 0) { //and 1 of them was for this Deal ...
										pupRptRequired = false; // then include Deal in Paid Unpaid report
									}
									break;
								case 4: // Month End
									if (parseInt(paidERCount,10) === 0 || parseInt(unpaidERCount,10) === 0) { //Both counts should be > zero
										if (parseInt(dealCMCountThisMonth,10) === 0) { //No Credit Memos for this Deal - No Selection
											pupRptRequired = false;
										}
									}
									break;

								case 5: // Transactional or Month End 
									//Do the transactional check. As soon as the Deal qualifies we're done
									if (parseInt(dealCMCountToday,10) > 0) { //and 1 of them was for this Deal ...
										break; // then include Deal in Paid Unpaid report
									}
									// Do the 1st part of the month end check
									if (todayIsMonthEnd) {
										if (parseInt(paidERCount,10) === 0 || parseInt(unpaidERCount,10) === 0) 
										{ //Both counts should be > zero
											pupRptRequired = false;
										}
									} 
									else 
									{
										pupRptRequired = false;
									}
									break;
								default:
									pupRptRequired = false;
							}
							if (pupRptRequired) 
							{
								options = {};
								options.dealID = dealID;
								options.dealPUPFP = dealPUPFP;
								options.paidERCount = paidERCount;
								options.unpaidERCount = unpaidERCount;
								options.dealCMCountToday = dealCMCountToday;
								options.dealCMCountThisMonth = dealCMCountThisMonth;
								options.jobID = jobID;
								options.relationAssociate = relationAssociate;
								options. relationManager = relationManager;
								options.dealContactEmails = dealContactEmails;
								options.contactEmails = contactEmails;
								
								createPUPDeal(options);
							}

							if (i === (dealCount-1))
							{
								processCompleted = true; 
							}
							if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) 
							{
			                		processCompleted = false;
			                }
							
							
							if (processCompleted) 
							{
				        		qmEngine.markQueueEntryComplete(obj.id, "Completed successfully.");	                    	
							}
							else
							{
								lists.currentindex = (i+1);
								qmEngine.markQueueEntryIncomplete(obj.id, JSON.stringify(lists), "Rescheduling due to governance");			                		
							}
							if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE_THRESHOLD) {
								log.debug(funcName, "Usage consumed.  Rescheduling");
								scriptTask = task.create({"taskType": task.TaskType.SCHEDULED_SCRIPT});
					            scriptTask.scriptId = srsConstants.SCRIPT_NAMES.PAID_UNPAID;
					            scriptTaskId = scriptTask.submit();
	
								return;
							}
							
						}
						
						log.audit("remaining usage ", runtime.getCurrentScript().getRemainingUsage());
						completeJob(jobID);
						
						email.send({
							author: srsConstants.PUP_EMAIL_SENDER,
							recipients: srsConstants.PUP_EMAIL_RECIPIENT,
							subject: "PUP Deal Selection Job has completed",
							body: "Scheduled Script, " + runtime.getCurrentScript().id + ", has completed successfully"
						});
										

					} catch (e) {
						// couldn't complete it, so update the status and let it try again
						log.error(funcName, e);
						qmEngine.abandonQueueEntry(obj.id, null, "ERROR: " + e.message);
					}
										
					
				} 
				else	// we didn't get anything back from the queue
				{
					return;
				}           		
	    	} while (true);

            	
        	log.debug(funcName, "*** EXITING ***");
        	
        }
	
		function createJob(date) {

			var runDateParsed = format.parse({
				value: date,
				type: format.Type.DATE
			});
			log.debug("execute", "runDateParsed: " + runDateParsed);

			
			try {
				var jobRec = record.create({
					type: "customrecord_pup_deal_sel_job"
				});
				
				jobRec.setValue({
					fieldId: "custrecord_pupds_job_date",
					value: runDateParsed
				});
				jobRec.setValue({
					fieldId: "custrecord_pupds_job_status",
					value: srsConstants.PUP_DEAL_JOB_STATUS["Started"] //1
				});
				log.debug("jobRec", JSON.stringify(jobRec));
				var jobIDa = jobRec.save();
				return jobIDa;
			} 
			catch (e) 
			{
				log.error(scriptName + " createJob", e);
				email.send({
					author: srsConstants.PUP_EMAIL_SENDER,
					recipients: srsConstants.PUP_EMAIL_RECIPIENT,
					subject: "NetSuite Scheduled Script: ERROR",
					body: "An error has occurred when attempting to run scheduled script " + runtime.getCurrentScript().id
					+ "<br/><br/>" + JSON.stringify(e)
				});
				var error = {
					title: "CREATE JOB RECORD ERROR:",
					message: e.message,
					func: "createJob",
					extra: ""
				};
				handleError(error);
			}
		}

		function completeJob(jobID) { //CODECHECK Try record.submit fields

			try {
				var jobRec = record.load({
					type: "customrecord_pup_deal_sel_job",
					id: jobID
				});

				jobRec.setValue({
					fieldId: "custrecord_pupds_job_status",
					value: srsConstants.PUP_DEAL_JOB_STATUS["Complete"] 
				});
				log.debug("jobRec", JSON.stringify(jobRec));
				jobRec.save();

			} catch (e) {
				log.error(scriptName + " completeJob", e);
				email.send
				({
					author: srsConstants.PUP_EMAIL_SENDER,
					recipients: srsConstants.PUP_EMAIL_RECIPIENT,
					subject: "NetSuite Scheduled Script: ERROR",
					body: "An error has occurred when attempting to run scheduled script " + runtime.getCurrentScript().id
					+ "<br/><br/>" + JSON.stringify(e)
				});
				var error = {
					title: "COMPLETE JOB RECORD ERROR:",
					message: e.message,
					func: "completeJob",
					extra: ""
				};
				handleError(error);
			}
		}
		function getDealCMCountToday(todaysCMList, dealID) {
			var i = 0;
			var cmDealID = "";
			var cmCount = 0;
			var todaysCMCount = todaysCMList.length;
			//log.debug("execute", "Deals with CMs today: " + todaysCMCount);
			
			for (i = 0; i < todaysCMCount; i+=1) 
			{
				cmDealID = (todaysCMList[i].values["GROUP(custbodyacq_deal_link)"] && todaysCMList[i].values["GROUP(custbodyacq_deal_link)"][0] && todaysCMList[i].values["GROUP(custbodyacq_deal_link)"][0]["value"]) || "";
				
				cmCount = todaysCMList[i].values["COUNT(internalid)"];
				
				if (dealID === cmDealID) {
					return cmCount;
				}
			}
			return 0;
		}

		function getDealCMCountThisMonth(thisMonthsCMList, dealID) {
			var i = 0;
			var cmDealID = "";
			var cmCount = 0;
			
			//thisMonthsCMList: [{"values":{"GROUP(custbodyacq_deal_link)":[{"value":"","text":"- None -"}],"COUNT(internalid)":"1"}}]
			var thisMonthsCMCount = thisMonthsCMList.length;
			
			for (i = 0; i < thisMonthsCMCount; i+=1) 
			{
				cmDealID = (thisMonthsCMList[i].values["GROUP(custbodyacq_deal_link)"] && thisMonthsCMList[i].values["GROUP(custbodyacq_deal_link)"][0] && thisMonthsCMList[i].values["GROUP(custbodyacq_deal_link)"][0]["value"])||"";
				
				cmCount = thisMonthsCMList[i].values["COUNT(internalid)"];
				
				if (parseInt(dealID,10) === parseInt(cmDealID,10)) {
					return cmCount;
				}
			}
			return 0;
		}
		function handleError(e) {
			var error = e.title + "\n\t@generatePaiUnpaidListQueue.js->" + e.func + "\n\t\t" + e.message;
			if (e.extra) {
				error += "\n\t\t(Additional Info: " + e.extra + ")";
			}
			log.error(e.title, e.message);
			throw new Error(error);
		}
		function getDealContactEmails(dealID)
		{
			var _email = "";
			var emailArray = [];

			var searchDealContacts = search.create({
				type: "customrecord16",
				filters:
				[
					["custrecord59", search.Operator.ANYOF, dealID], 
					"AND", 
					["custrecord_receive_paid_unpaid_report", search.Operator.IS, "T"],
					"AND", 
  					["isinactive", search.Operator.IS, "F"]
				],
				columns:
				[
					"custrecord_dc_email"
				]
			});

			var dealContactResults = searchDealContacts.run().getRange({
                start: 0,
                end: 1000
        	});
			var i = 0;
        	for (i = 0; dealContactResults && i < dealContactResults.length; i+=1)
        	{
        		_email = dealContactResults[i].getValue({
        			name: "custrecord_dc_email"
        		});
        		if (_email)
        		{
        			emailArray.push(_email);
        		}
        	}

        	return emailArray;
				
		}
		function createPUPDeal(options) {

			try {
				var PUPDealRec = record.create({
					type: "customrecord_pup_deal"
				});

				PUPDealRec.setValue({
					fieldId: "custrecord_pupd_deal",
					value: options.dealID
				});
				PUPDealRec.setValue({
					fieldId: "custrecord_pupd_freq_prof",
					value: options.dealPUPFP
				});
				PUPDealRec.setValue({
					fieldId: "custrecord_pupd_paid_er_count",
					value: options.paidERCount
				});
				PUPDealRec.setValue({
					fieldId: "custrecord_pupd_unpaid_er_count",
					value: options.unpaidERCount
				});
				PUPDealRec.setValue({
					fieldId: "custrecord_pupd_cm_count_today",
					value: options.dealCMCountToday
				});
				PUPDealRec.setValue({
					fieldId: "custrecord_pupd_cm_count_thismonth",
					value: options.dealCMCountThisMonth
				});
				PUPDealRec.setValue({
					fieldId: "custrecord_pupd_job",
					value: options.jobID
				});

				if (options.relationAssociate)
				{
					PUPDealRec.setValue({
						fieldId: "custrecord_pupd_relationship_associate",
						value: options.relationAssociate
					});
				}

				if (options.relationManager)
				{
					PUPDealRec.setValue({
						fieldId: "custrecord_pupd_relationship_manager",
						value: options.relationManager
					});
				}

				if (options.dealContactEmails && options.contactEmails)
				{
					PUPDealRec.setValue({
						fieldId: "custrecord_pupd_deal_contacts_email_list",
						value: options.dealContactEmails
					});
				}
				log.debug("PUPDealRec", JSON.stringify(PUPDealRec));
				var PUPDealID = PUPDealRec.save({ignoreMandatoryFields:true});
				log.debug("PUPDealID", PUPDealID);

			} catch (e) {
				log.error(scriptName + " createPUPDeal critical error: ", e);
				email.send({
					author: srsConstants.PUP_EMAIL_SENDER,
					recipients: srsConstants.PUP_EMAIL_RECIPIENT,
					subject: "NetSuite Scheduled Script: ERROR",
					body: "An error has occurred when attempting to run scheduled script " + runtime.getCurrentScript().id + "<br/><br/>" + JSON.stringify(e)
				});
				
				
				var error = {
					title: "CREATE PUP Deal RECORD ERROR:",
					message: e.message,
					func: "createPUPDeal",
					extra: "DealID: " + options.dealID
				};
				handleError(error);
			}
		}
		// ================================================================================================================================


        return {
            execute: execute
        };
    }
);