//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Uses the Prolecto Record Import/Export Manager to process CSV imports of Expense Reports from Chrome River
 * 
 */


/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType plugintypeimpl
 */


define(['N/runtime','N/log','N/record','N/search','N/format','./Shared/SRS_Functions','/.bundle/132118/PRI_ServerLibrary'],
	function(runtime,log,record,search,format,srsFunctions,priLibrary) {
	
		var scriptName = "SRS_PL_ImportExpenseReports.";

		var STATUS_PENDING = 1;
		var STATUS_FAILED = 4;
		var STATUS_PROCESSED = 2;
		var STATUS_SKIPPED = 3;
		
		function createRecord(importData, externalId, context) {
			
			var funcName = scriptName + "createRecord ";
			
			var obj = JSON.parse(context.values[0]);

			importData = JSON.parse(importData);

			funcName = funcName + importData[0].refnumber;

			try {
				
				log.debug(funcName, "Processing [" + importData[0].matternumber + "]");
				
				if (importData[0].matternumber == "PERSONAL MATTER") {
					return {status: STATUS_SKIPPED, recordId: expId, message: "All Expense Lines were 'PERSONAL MATTERs'"};												
				}


				var employeeId = importData[0].expenseowner; 
				if (employeeId == 5)			// special treatment for Mark Vogel, who is "-5" -- but we send it to CR as "5"
					employeeId = -5; 
				
				
				var headerDeptId, entityId, dealId;   
				
				var categoryList = loadExpenseCategories(); 
				
				var currencyId = findCurrency(importData[0].invoicecurrency); 
				
				// in ChromeRiver, all of the expense line descriptions begin with the employee name
				// so we will look it up, and remove it from the front of the line, if we can
				var employeeName = search.lookupFields({type: record.Type.EMPLOYEE, id: employeeId, columns: ["entityid"]}).entityid; 
				
				if (importData[0].matternumber.indexOf("-") > 0) {
					var matterNbr = importData[0].matternumber; 
					var entityId = matterNbr.substring(0,matterNbr.indexOf("-"));
					var headerDeptId = matterNbr.substring(matterNbr.indexOf("-")+1);
				} else {
					// get the department and entity from the employee
					var empFields = search.lookupFields({type: record.Type.EMPLOYEE, id: employeeId, columns: ["department","class"]}); 
					headerDeptId = empFields.department[0].value;
					entityId = empFields.class[0].value;
				} 
				
				var REC = record.create({type: record.Type.EXPENSE_REPORT}); 

				// REC.setValue("trandate", new Date(importData[0].transactiondate)); 
				// REC.setValue("trandate", new Date());
				REC.setValue("entity", employeeId);
				REC.setValue("memo", importData[0].reportname); 
				REC.setValue("complete", true);
				REC.setValue("supervisorapproval", true);
				REC.setValue("accountingapproval", true);
				REC.setValue("department", headerDeptId); 
				REC.setValue("class", entityId); 
				REC.setValue("custbody_srs_cr_ref_nbr",importData[0].refnumber)
				REC.setValue("externalid", externalId); 
				
				if (importData[0].apaccount) {
					REC.setValue("account", findAPAccount(importData[0].apaccount));
				}
				
				var lastExpenseDate = new Date("1/1/2001");
				
				var expLine = 0; 
				var deptId, dealId; 
				for (var i = 0; i < importData.length; i++) {
					dealId = "";
					if (importData[i].matternumber != "PERSONAL MATTER") {
						
						var expenseDate = new Date(importData[i].transactiondate);
						
						if (expenseDate > lastExpenseDate)
							lastExpenseDate = expenseDate; 
						
						REC.setSublistValue({sublistId: "expense", fieldId: "expensedate", value: expenseDate, line: expLine});
						// REC.setSublistValue({sublistId: "expense", fieldId: "expensedate", value: new Date(importData[i].txndate), line: expLine});
						
						var catId = findCategory(categoryList, importData[i].expensetypename); 
						
						if (!catId) 
							throw "Unexpected Expense Category '" + importData[i].expensetypename + "'"; 
						
						REC.setSublistValue({sublistId: "expense", fieldId: "category", value: catId, line: expLine});					
						REC.setSublistValue({sublistId: "expense", fieldId: "currency", value: currencyId, line: expLine});
						REC.setSublistValue({sublistId: "expense", fieldId: "amount", value: parseFloat(importData[i].expenseamount), line: expLine});
						
						var expenseDescription = importData[i].expensedescription;
						if (expenseDescription.indexOf(employeeName) <= 1)
							expenseDescription = expenseDescription.replace(employeeName, ""); 
						REC.setSublistValue({sublistId: "expense", fieldId: "memo", value: expenseDescription, line: expLine});
						
						if (importData[i].matternumber.indexOf("-") > 0) {
							var matterNbr = importData[i].matternumber; 
							var deptId =  matterNbr.substring(matterNbr.indexOf("-")+1);
						} else {
							deptId = headerDeptId;
							dealId = importData[i].matternumber; 
						} 

						REC.setSublistValue({sublistId: "expense", fieldId: "department", value: deptId, line: expLine});
						if (dealId) {
							REC.setSublistValue({sublistId: "expense", fieldId: "customer", value: dealId, line: expLine});
							REC.setSublistValue({sublistId: "expense", fieldId: "isbillable", value: true, line: expLine});						
						}
						
						expLine++; 
					} else
						log.debug(funcName, "  PERSONAL MATTER -- skipping");  						
				}

				
				// ATP-1258: always assign expense report to earliest open period

				// if the period on which the most recent expense happened is still open, set that as the accounting period; otherwise, use "today"
//				if (priLibrary.accountingPeriodIsOpen(priLibrary.getAccountingPeriod(lastExpenseDate)))
//					REC.setValue("trandate", lastExpenseDate);
//				else
//					REC.setValue("trandate", new Date());
					
				REC.setValue("trandate", getEarliestOpenPeriodDate()); 
				
				if (expLine > 0) {
					var expId = REC.save(); 
					log.audit(funcName, "Expense Report Created.  ID=" + expId); 
					return {status: STATUS_PROCESSED, recordId: expId, message: ""};				
				} else {
					return {status: STATUS_SKIPPED, recordId: expId, message: "All Expense Lines were 'PERSONAL MATTERs'"};								
				}

				
			} catch (e) {
				log.error(funcName, e);
				throw e;  
			}
			
			
		}
				
    	/* ======================================================================================================================================== */

		// gets the LAST day of the EARLIEST open period
		function getEarliestOpenPeriodDate() {

	    	var ss = search.create({
	    		type: 		"accountingperiod",
	    		filters: 	[
	    		         	 ["closed",search.Operator.IS,false]
	    		         	 ,"AND",["isadjust",search.Operator.IS,false]
	    		         	 ,"AND",["isquarter",search.Operator.IS,false]
	    		         	 ,"AND",["isyear",search.Operator.IS,false]
	    		         	 ],
	    		columns:	[search.createColumn({name: "startdate", sort: search.Sort.ASC}),"enddate"]	    	
	    	}).run().getRange(0,1);

	    	log.debug("getEarliestOpenPeriodDate",ss); 
	    	
	    	return new Date(ss[0].getValue("enddate"));
			
		}

    	/* ======================================================================================================================================== */

		function findAPAccount(acctNbr) {
			var ss = search.create({
				type: 		record.Type.ACCOUNT,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["number",search.Operator.IS,acctNbr]
				        	 ]
			}).run().getRange(0,1);
			
			if (ss.length > 0)
				return ss[0].id; 	
		}

    	/* ======================================================================================================================================== */

		function findCurrency(currencyCode) {
			var ss = search.create({
				type:		record.Type.CURRENCY,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["symbol",search.Operator.IS,currencyCode]
				        	 ]
			}).run().getRange(0,1); 
			
			if (ss.length > 0)
				return ss[0].id; 
			
		}

    	/* ======================================================================================================================================== */


		function loadExpenseCategories() {
			var categoryList = [];

			var ss = search.create({
				type:		record.Type.EXPENSE_CATEGORY,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_srs_cr_expense_type",search.Operator.ISNOTEMPTY,null]
				        	 ],
			
				columns:	["custrecord_srs_cr_expense_type"]
			}).run().each(function (result) {
				
//				log.debug("loadExpenseCategories","Setting entry " + result.id + " to " + result.getValue("custrecord_srs_cr_expense_type")); 
				
				categoryList[result.id] = result.getValue("custrecord_srs_cr_expense_type");
				
				return true; 
			}); 
			
			return categoryList; 
		}
		
		function findCategory(categoryList, categoryName) {
			
			var funcName = scriptName + "findCategory " + categoryName; 
			
			// log.debug(funcName, "Looking in list of " + categoryList.length); 
			
			categoryName = categoryName.trim().toUpperCase(); 
			
			var catId; 
			
			categoryList.forEach(function (entry, ndx) {
				
//				log.debug(funcName, "   Entry " + ndx + " = " + JSON.stringify(entry)); 
				
				var theList = entry.replace(/\r/g,"").split('\n');
				
//				log.debug(funcName, "   Entry " + ndx + " = " + JSON.stringify(theList)); 

				for (var i = 0; i < theList.length; i++)
					if (theList[i] && theList[i].trim().toUpperCase() == categoryName) {
						// log.debug(funcName, "*** Mapped to category code " + ndx);
						catId = ndx;
						break; 
					}
				
			}); 
			 
			// log.debug(funcName, "Mapped to " + catId); 
			
			return catId; 
		}

    	/* ======================================================================================================================================== */
		
    return {
        createRecord:	createRecord
    }
});