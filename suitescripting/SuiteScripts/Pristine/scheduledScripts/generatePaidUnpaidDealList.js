	/**
	 *@NApiVersion 2.x
	 *@NScriptType ScheduledScript
	 */

	define(["N/record", "N/search", "N/runtime", "N/email", "N/format"
		, "/SuiteScripts/Pristine/libraries/searchLibrary.js"
		, "/.bundle/132118/PRI_QM_Engine"
		,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
		],

		/**
		 * -----------------------------------------------------------
		 * generatePaidUnpaidDealList.js
		 * ___________________________________________________________
		 * This script selects Deals for which Paid Unpaid Reporting
		 * is required. It writes this list of Deal Ids to a custom table.
		 * This table is then read by ODS to produce Paid Unpaid reports. 
		 *
		 * Version 1.0 PUP-79
		 * Author: Ken Crossman
		 * ___________________________________________________________
		 */

		function(record, search, runtime, email, format, searchLibrary, qmEngine, srsConstants) {
			"use strict";
			
			var scriptName = "generatePaidUnpaidDealList.";
			
			
			function execute(context) {
				var funcName = scriptName + "execute";
				var _todaysCMList = null;
				var _thisMonthsCMList = null;
				var todayIsMonthEnd = false;
				
				
				// log.debug("This Script", thisScript);
				// log.debug("Current Script", JSON.stringify(runtime.getCurrentScript()));
				// log.debug("Current Session", JSON.stringify(runtime.getCurrentSession()));
				// log.debug("Current User", JSON.stringify(runtime.getCurrentUser()));
				var runDate = runtime.getCurrentScript().getParameter({
					name: "custscript_run_date"
				});
				// If runDate is null then we assume the user wants today's date. This was introduced because there is a bug associated with the use of dynamic date 
				// parameters. When deploying, a dynamic date parameter changes to a literal date. So, the scheduled deployment for this script will have a parameter
				// date = null and this script will then ensure a dynamic "current date" is used. Sad but true.
				if (!runDate) {
					log.debug("execute", "Run date passed = null");
					runDate = new Date();
				}

				log.debug("execute", "runDate: " + JSON.stringify(runDate));
				
				var holidayList = getHolidays(runDate.getFullYear());
				var pupFPList = [];
				//Is today last business day of the month?
				if (isTodayMonthEnd(holidayList, runDate)) {
					todayIsMonthEnd = true;
					pupFPList.push(srsConstants.PUP_FREQUENCY["Always"]);		//1
					pupFPList.push(srsConstants.PUP_FREQUENCY["Transactional"]);	//3
					pupFPList.push(srsConstants.PUP_FREQUENCY["Month End"]);		//4
					pupFPList.push(srsConstants.PUP_FREQUENCY["Transactional and Month End"]); //5
					
				} else {
					pupFPList.push(srsConstants.PUP_FREQUENCY["Always"]);		//1
					pupFPList.push(srsConstants.PUP_FREQUENCY["Transactional"]);	//3
					pupFPList.push(srsConstants.PUP_FREQUENCY["Transactional and Month End"]); //5
				}

				log.debug("execute", "todayIsMonthEnd: " + todayIsMonthEnd + " pupFPList: " + pupFPList);

				// Get all Deals: 
				var dealList = getDeals(pupFPList);
				var dealCount = dealList.length;
				log.debug("execute", "Deal Count: " + dealCount);
				// Now the Transactional Deals 
				// Get all Credit Memos created for Deals today
				var todaysCMList = getTodaysCMDeals(runDate);
				
				_todaysCMList = JSON.parse(JSON.stringify(todaysCMList));
				// _todaysCMList : [{"values":{"GROUP(custbodyacq_deal_link)":[{"value":"166119","text":"LeanKit Planview"}],"COUNT(internalid)":"1"}}]
				
				log.audit("todaysCMList ", JSON.stringify(_todaysCMList));
				
				// Get all Credit Memos created for Deals this month if it is month end
				// if (todayIsMonthEnd) {
				var thisMonthsCMList = getThisMonthsCMDeals(runDate);
				_thisMonthsCMList = JSON.parse(JSON.stringify(thisMonthsCMList));
				
				log.audit("thisMonthsCMList ", JSON.stringify(_thisMonthsCMList));
				// }

				// Delete the target table
				deletePUPDeals(runDate);
				
				//Now add the selected Deals to the target table
				var i = 0;
				var relationAssociateInactive = null;
				var relationManagerInactive = null;
				
				var _dealList = JSON.parse(JSON.stringify(dealList));
				var _dealID = "";
				var _dealPUPFP = "";
				var _relationAssociate = "";
				var _relationManager = "";
				var _paidERCount = 0 ;
				var _unpaidERCount = 0;
				var dealCMCountToday = 0;
				var dealCMCountThisMonth = 0;
				var dealID = ""; 
				var dealPUPFP = "";
				var relationAssociate = "";
				var relationManager = "";
				var unpaidERCount = 0;
				var paidERCount = 0;
				var pupRptRequired = "";
				var dealContactEmails = [];
				var contactEmails = false;
				var options = {};
				
				var qm_json = {};
				qm_json.currentindex = 0;
				qm_json.dealList = _dealList;
				qm_json.thisMonthsCMList = _thisMonthsCMList;
				qm_json.todaysCMList = _todaysCMList;
				qm_json.runDate = runDate;
				qm_json.todayIsMonthEnd = todayIsMonthEnd;
					
				log.debug(funcName, "SCRIPT=" + srsConstants.SCRIPT_NAMES.PAID_UNPAID); 
        		
        		qmEngine.addQueueEntry(srsConstants.QUEUE_NAMES.PAID_UNPAID, qm_json, null, true, srsConstants.SCRIPT_NAMES.PAID_UNPAID);

			}

			
			/**
			 * Handles error logging and display
			 * @param  {object} e custom error object
			 * @return {Error}   new custom Error
			 */
			function handleError(e) {
				var error = e.title + "\n\t@generatePaidUnpaidDealList.js->" + e.func + "\n\t\t" + e.message;
				if (e.extra) {
					error += "\n\t\t(Additional Info: " + e.extra + ")";
				}
				log.error(e.title, e.message);
				throw new Error(error);
			}
			
			function isDateAHoliday(holidayList, monthEnd) {
				log.debug("isDateAHoliday", "monthEnd: " + monthEnd);
				var i = 0;
				var holiday = "";
				for (i = 0; i < holidayList.length; i+=1) {
					holiday = holidayList[i].getValue({
						name: "custrecord_date_observed"
					});
					//log.debug("isDateAHoliday", "holiday: " + holiday);
					if (monthEnd === holiday) {
						return true;
					}
				}
				return false;
			}
			
			function isDateAWeekend(monthEndObj) {
				var monthEndWeekDay = monthEndObj.getDay(); //Sunday is 0, Monday is 1, and so on
				if (monthEndWeekDay === 0 || monthEndWeekDay === 6) {
					return true;
				} else {
					return false;
				}

			}

			function isTodayMonthEnd(holidayList, runDate) {
				//Get Bank Holidays for this year 
				
				var runDateFormatted = format.format({
					value: runDate,
					type: format.Type.DATE
				});
				
				var holidayCount = holidayList.length;
				log.debug("isTodayMonthEnd", "holidayCount: " + holidayCount);

				//Start at Calendar Month End and work back to find last business day
				var monthEndObj = new Date();
				monthEndObj.setFullYear(runDate.getFullYear());
				monthEndObj.setMonth(runDate.getMonth() + 1, 0);
				var monthEnd = format.format({
					value: monthEndObj,
					type: format.Type.DATE
				});
				log.debug("isTodayMonthEnd", "monthEnd: " + monthEnd);

				while (isDateAWeekend(monthEndObj) || isDateAHoliday(holidayList, monthEnd)) {
					monthEndObj.setDate(monthEndObj.getDate() - 1);
					monthEnd = format.format({
						value: monthEndObj,
						type: format.Type.DATE
					});
					log.debug("isTodayMonthEnd", "monthEnd: " + monthEnd);
				}

				if (runDateFormatted === monthEnd) {
					return true;
				} else {
					return false;
				}

			}

			
			

			function getHolidays(year) {
				var holidaySearch = search.create({
					type: "customrecord_bank_holiday",
					title: "Holidays",
					columns: [{
						name: "custrecord_date_observed"
					}],

					filters: [{
						name: "formulatext",
						formula: "to_char({custrecord_date_observed},'YYYY')",
						operator: search.Operator.IS,
						values: year
					}, {
						name: "isinactive",
						operator: search.Operator.IS,
						values: "F"
					}]
				}).run();

				var searchResults = searchLibrary.getSearchResultData(holidaySearch);					
				return searchResults;
				
			}

			function getDeals(pupFPList) {
				var dealSearch = search.create({
					type: "customer",
					title: "Deals",
					columns: [{
						name: "internalid",
						summary: search.Summary.GROUP
					}, {
						name: "internalid",
						join: "custentity_pup_freq_profile",
						summary: search.Summary.MAX
					}, {
						name: "formulanumeric1",
						summary: search.Summary.SUM,
						// formula: "case when {custrecord_acq_loth_zzz_zzz_deal.custrecord_acq_loth_zzz_zzz_acqstatus.id} = 5 AND {custrecord_acq_loth_zzz_zzz_deal.isinactive} = 'F' then 1 else 0 end",
						formula: "case when {custrecord_acq_loth_zzz_zzz_deal.custrecord_acq_loth_zzz_zzz_acqstatus.id} = 5 AND {custrecord_acq_loth_zzz_zzz_deal.isinactive} = 'F' and {custrecord_acq_loth_zzz_zzz_deal.custrecord_acq_loth_related_trans} <> ' ' then 1 else 0 end",
						label: "Paid ER Count"
					}, {
						name: "formulanumeric2",
						summary: search.Summary.SUM,
						// formula: "case when {custrecord_acq_loth_zzz_zzz_deal.custrecord_acq_loth_zzz_zzz_acqstatus.id} != 5 AND {custrecord_acq_loth_zzz_zzz_deal.isinactive} = 'F' then 1 else 0 end",
						formula: "case when {custrecord_acq_loth_zzz_zzz_deal.isinactive} = 'F' and ({custrecord_acq_loth_zzz_zzz_deal.custrecord_acq_loth_zzz_zzz_acqstatus.id} != 5 or {custrecord_acq_loth_zzz_zzz_deal.custrecord_acq_loth_related_trans} = ' ') then 1 else 0 end",
						label: "UnPaid ER Count"
					}, {
						name: "custentityacqdea_relationship_associate",
						summary: search.Summary.GROUP,
						label: "Relationship Associate"
					}, {
						name: "custentitycustentity_acq_deal_relationma",
						summary: search.Summary.GROUP,
						label: "Relationship Manager"
					}
					,{
				         name: "isinactive",
				         join: "CUSTENTITYACQDEA_RELATIONSHIP_ASSOCIATE",
				         summary: "GROUP",
				         label: "Associate Inactive"
				      },
				      {
				         name: "isinactive",
				         join: "CUSTENTITYCUSTENTITY_ACQ_DEAL_RELATIONMA",
				         summary: "GROUP",
				         label: "Manager Inactive"
				      }
					],

					filters: [{
						name: "category",
						operator: search.Operator.IS,
						values: "1" //Deal
					}, {
						name: "custentitycustomer_oppo_acceptype_aqmpmt",
						operator: search.Operator.IS,
						values: "T" //Only Acquiom Payments Admin Deals
					}, {
						name: "isinactive",
						operator: search.Operator.IS,
						values: "F"
					}, {
						name: "stage",
						operator: search.Operator.IS,
						values: "CUSTOMER"
					}, {
						name: "custentity_pup_freq_profile",
						operator: search.Operator.ANYOF,
						values: pupFPList
					}
					,{
						name: "isinactive",
						join: "custentity_pup_freq_profile",
						operator: search.Operator.IS,
						values: "F"
					}
					]
				}).run();

				var searchResults = searchLibrary.getSearchResultData(dealSearch);
				return searchResults;
			}

			function getTodaysCMDeals(runDate) {

				var runDateFormatted = format.format({
					value: runDate,
					type: format.Type.DATE
				});
				
				var cmSearch = search.create({
					type: "creditmemo",
					title: "TodaysCreditMemoDeals",
					columns: [{
						name: "custbodyacq_deal_link",
						summary: search.Summary.GROUP
					}, {
						name: "internalid",
						summary: search.Summary.COUNT
					}],

					filters: [{
						name: "trandate",
						operator: search.Operator.ON,
						values: runDateFormatted
					}, {
						name: "custbodyacq_deal_link",
						operator: search.Operator.ISNOTEMPTY
					}, {
						name: "voided",
						operator: search.Operator.IS,
						values: "F"
					}, {
						name: "mainline",
						operator: search.Operator.IS,
						values: "T"
					}, {
						name: "department",
						operator: search.Operator.ANYOF,
						values: srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM	
					}]
				}).run();

				var searchResults = searchLibrary.getSearchResultData(cmSearch);
				return searchResults;
			}

			function getThisMonthsCMDeals(rundate) 
			{
				
				var y = rundate.getFullYear();
				var m = rundate.getMonth();
				
				var firstDay = new Date(y, m, 1);
				var lastDay = new Date(y, m + 1, 0);

				var firstDayFormatted = format.format({
					value: firstDay,
					type: format.Type.DATE
				});
				
				var lastDayFormatted = format.format({
					value: lastDay,
					type: format.Type.DATE
				});
				
				var msg = "rundate: " + rundate + "\n";
				msg += "First Day: " + firstDayFormatted + "\n";
				msg += "Dast Day: " + lastDayFormatted + "\n";
				
				log.audit("rundate, first day, last day", msg);
				//rundate: Thu Apr 30 2020 00:00:00 GMT-0700 (PDT) First Day: 4/1/2020 Dast Day: 4/30/2020
				//rundate: Tue Mar 03 2020 00:00:00 GMT-0800 (PST) First Day: 3/1/2020 Dast Day: 3/31/2020
				//rundate: Wed Feb 12 2020 00:00:00 GMT-0800 (PST) First Day: 2/1/2020 Dast Day: 2/29/2020
				//rundate: Wed Jan 08 2020 00:00:00 GMT-0800 (PST) First Day: 1/1/2020 Dast Day: 1/31/2020
				
				var cmMonthSearch = search.create({
					type: "creditmemo",
					title: "ThisMonthsCMDeals",
					columns: [{
						name: "custbodyacq_deal_link",
						summary: search.Summary.GROUP
					}, {
						name: "internalid",
						summary: search.Summary.COUNT
					}],

					filters: [
					          
					{
						name: "trandate",
						operator: search.Operator.WITHIN,
						values: [firstDayFormatted,lastDayFormatted]
					}
					, {
						name: "custbodyacq_deal_link",
						operator: search.Operator.ISNOTEMPTY
					}, {
						name: "voided",
						operator: search.Operator.IS,
						values: "F"
					}, {
						name: "mainline",
						operator: search.Operator.IS,
						values: "T"
					}, {
						name: "department",
						operator: search.Operator.ANYOF,
						values: srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM
					}]
				}).run();

				var searchResults = searchLibrary.getSearchResultData(cmMonthSearch);
				return searchResults;
			}
			
			function deletePUPDeals(runDate) {
				try {
					
					var runDateFormatted = format.format({
						value: runDate,
						type: format.Type.DATE
					});

					var pupDealSearch = search.create({
						type: "customrecord_pup_deal",
						title: "PUPDeals",
						columns: [{
							name: "internalid"
						}],
						filters: [{
							name: "custrecord_pupd_date",
							operator: search.Operator.ON,
							values: runDateFormatted
						}]
					});

					pupDealSearch.run().each(function(result) {
						var PUPDealID = result.getValue({
							name: "internalid"
						});
						record.delete({
							type: "customrecord_pup_deal",
							id: PUPDealID
						});

						return true;
					});
				} catch (e) {
					log.error(scriptName + " deletePUPDeals", e);
					
					email.send({
						author: srsConstants.PUP_EMAIL_SENDER,
						recipients: srsConstants.PUP_EMAIL_RECIPIENT,
						subject: "NetSuite Scheduled Script: ERROR",
						body: "An error has occurred when attempting to run scheduled script " + runtime.getCurrentScript().id
					});
					var error = {
						title: "DELETE PUP Deal RECORD ERROR:",
						message: e.message,
						func: "deletePUPDeals",
						extra: null
					};
					handleError(error);
					
				}
			}
			return {
				execute: execute
			};

		});