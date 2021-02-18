//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
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
 * Exports the Master to Chrome River  
 * 
 */


define(['N/search', 'N/record', 'N/runtime', 'N/task', 'N/sftp', 'N/format', 'N/file', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_ServerLibrary'],
    function(search, record, runtime, task, sftp, format, file, srsConstants, srsFunctions, appSettings, priLibrary) {

		"use strict";

	    String.prototype.padLeft = String.prototype.padLeft || function(len, c){
	        var s = this, c= c || '0';
	        while(s.length < len) s = c+ s;
	        return s;
	    }
	    

		var scriptName = "SRS_SC_ChromeRiverMasterDataExport.";

    	var MIN_USAGE_THRESHOLD = 100;

    	var MAX_PERSON_RECORDS = 9999;
    	var MAX_ENTITY_RECORDS = 9999;
    	var MAX_ALLOCATION_RECORDS = 99999;
    	
		var LAST_FILE_APP_SETTING = "Last Imported Expense Report File";

		function execute(context) {
        
			var funcName = scriptName + "execute";
			            
        	log.debug(funcName, "Starting");

        	sendEntityInformation();		// all *used* CLASS/DEPARMENT combination (if used by any employee)	
        			
        	sendAllocationInformation();	// DEALS and ENTITY/DEPARTMENT combos
        	
        	sendPersonInformation(); 	// EMPLOYEES

    		sendPaidExpenseReports(); 

        	retrieveExpenseFile(); 
        	
        	log.debug(funcName, "Done");
        }

		
		
		// ================================================================================================================================		
		// = Sends Information about PAID Expense Reports =================================================================================
		// ================================================================================================================================
		
		function sendPaidExpenseReports() {

			var funcName = scriptName + "sendPaidExpenseReports";

        	log.debug(funcName, "Starting");

        	
        	
        	var prevDate = appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "Last Paid Expense File Sent");
        	
			var prevDateStr = new Date(prevDate).format("m/d/yyyy hh:nn"); 
			
			log.debug(funcName, "Looking for all Expense Reports which have been fully paid since " + prevDateStr); 
			

			var prevId = "", exportS = "", exportCount = 0; 
			
			// ["systemnotes.date","onorafter","10/01/2018 12:00 am"]
			
			var currentDate;
			
			var lineNbr = 0; 
			var expSearch = search.create({
				   type: 		record.Type.EXPENSE_REPORT, 
				   filters:		[
				           		 	["mainline",search.Operator.IS,true]
				           		 	,"AND",["status",search.Operator.ANYOF,search.Operator.IS,priLibrary.RECORD_TYPE_INFO[record.Type.EXPENSE_REPORT].PAID_IN_FULL.searchStatusCode]
				           		 	,"AND",["custbody_srs_cr_ref_nbr",search.Operator.ISNOTEMPTY,null]
				           		 	,"AND",["systemnotes.field",search.Operator.ANYOF,"TRANDOC.KSTATUS"]
				           		 	,"AND",["systemnotes.newvalue",search.Operator.IS,priLibrary.RECORD_TYPE_INFO[record.Type.EXPENSE_REPORT].PAID_IN_FULL.statusText]
				           		 	,"AND",["systemnotes.date",search.Operator.AFTER,prevDateStr]
				           		 ],				   
				   columns:		["custbody_srs_cr_ref_nbr","amount",search.createColumn({name: "internalid", sort: search.Sort.ASC}),search.createColumn({name: "date", join: "systemNotes", sort: search.Sort.DESC})]
			}).run().each(function (result) {
				
				if (!currentDate)
					currentDate = new Date(); 
				
				// log.debug(funcName, result); 
				
				if (result.id != prevId) {
					lineNbr++; 
					exportS += lineNbr.toString(); 
					exportS += "|";  					  
					exportS += (priLibrary.formatCSValue(result.getValue("custbody_srs_cr_ref_nbr"))); 
					exportS += "|";  
					exportS += (priLibrary.formatCSValue(result.getValue("amount"))); 
					exportS += "|-1|USD|";  

					
					exportS += (priLibrary.formatCSValue(new Date(result.getValue({name: "date", join: "systemNotes"})).format("mm/dd/yyyy"))); 
					exportS += "|MM/dd/yyyy|||||";  
					// exportS += "|MM/dd/yyyy";
					
					exportS += "\r\n";					
					
					prevId = result.id;
					exportCount++; 
					
					return true; 
				}
			}); 

			log.debug(funcName, "Found " + exportCount + " expense report(s) to send.");
			
			if (exportCount == 0) {
				log.debug(funcName, "No new PAID Expense Reports ready to send.");
				return; 
			}
			
			// add column headings to data
			// exportS = "VoucherInvoice|Amount|AmountDecimals|CurrencyCode|PaidDate|PaidDateMask\r\nDUPE|VoucherInvoice\r\n" + exportS;  
			exportS = "LineNumber|VoucherInvoice|Amount|AmountDecimals|CurrencyCode|PaidDate|PaidDateMask|CheckNumber|BankID|LastCreateDateCustomerRecord|IsAuthorized|PaymentType\r\nDUPE|VoucherInvoice|\r\n" + exportS;
			
			var paidExpenseFileFolderId = appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "Paid Expense File Folder ID"); 
			if (!paidExpenseFileFolderId)
				throw "Paid Expense Information available to send, but App Setting 'Paid Expense File Folder ID' has not been configured.  Please configure this setting.";

			var remoteFolderName = appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "FTP Paid Expense File Directory"); 
			if (!paidExpenseFileFolderId)
				throw "Paid Expense Information available to send, but App Setting 'FTP Paid Expense File Directory' has not been configured.  Please configure this setting.";

			var fileName = "PaidExpense-prod-" + srsFunctions.getChromeRiverCustomerCode() + "-" + currentDate.format("yyyy-mm-dd-hhnn"); //  + ".txt";
			var csvFileName = fileName + ".txt";
			var ackFileName = fileName + ".ack";
			
			log.debug(funcName, "Attempting to create file '" + csvFileName + "' in folder " + paidExpenseFileFolderId);
			
			var f = file.create({
					name: csvFileName,  
					fileType: file.Type.PLAINTEXT,
					contents: exportS,
					encoding: file.Encoding.ISO_8859_1,
					folder: paidExpenseFileFolderId
			}); 
			
			var fileId = f.save(); 
			
			// return; 
			
			var ftpConn = connectToFTPServer(); 
			
			log.debug(funcName, "Attempting to upload file '" + csvFileName + "' (" + fileId + ") to remote directory " + remoteFolderName); 
			
			ftpConn.upload({
				file:		f,
				filename: 	csvFileName,
				directory:	remoteFolderName
			});
			
			ftpConn.upload({
				file:		f,
				filename: 	ackFileName, 
				directory:	remoteFolderName
			});
			
			log.audit(funcName, "File '" + csvFileName + "' which contained information about " + exportCount + " paid Expense Report(s) has been uploaded to Chrome River folder " + remoteFolderName); 
			
			appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "Last Paid Expense File Sent", currentDate);
			
		}
		
		
		// ================================================================================================================================
		// = retrieves the Chrome River Expens file from their FTP server =================================================================
		// ================================================================================================================================
		
		function retrieveExpenseFile() {
			
			var funcName = scriptName + "retrieveExpenseFile";
			
        	var funcName = scriptName + "retrieveExpenseFile";
        	
        	var crSettings = appSettings.createAppSettingsObject(srsConstants.CHROME_RIVER_APP_NAME);
        	
        	var lastFileStamp = crSettings.settings[LAST_FILE_APP_SETTING];
        	
        	log.debug(funcName, "Last File Stamp App Settings=" + lastFileStamp); 
        	
        	var lastDate = new Date().addDays(-3);  
        	var lastSeqNbr = 0; 

        	var todayStr = new Date().format("yyyy-mm-dd"); 

        	var ftpConn = connectToFTPServer(); 
        	if (!ftpConn) 
        		return; 
        	
        	if (lastFileStamp) {
        		if (!/^\d\d\d\d\-\d\d\-\d\d\-[\d\?][\d\?]/.test(lastFileStamp)) 
        			throw "App Setting " + LAST_FILE_APP_SETTING + " was not in the correct format.  Expected ####-##-##-## but found " + lastFileStamp;
        		
        		lastDate = new Date(lastFileStamp.substring(0,4), Number(lastFileStamp.substring(5,7))-1, Number(lastFileStamp.substring(8,10)));  
        		lastSeqNbr = lastFileStamp.substring(11); 
        	} 

        	var filesImported = 0;
        	
        	// if (lastDate.format("yyyy-mm-dd") <= todayStr) {
        	
        	while (lastDate.format("yyyy-mm-dd") <= todayStr && (runtime.getCurrentScript().getRemainingUsage() > 1000)) {            		
        		filesImported += processFilesForDay(ftpConn, crSettings, lastDate, lastSeqNbr); 
        		
        		lastDate.addDays(1); 
            	lastSeqNbr = -1;
        	}

            	// appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, LAST_FILE_APP_SETTING, lastDate.format("yyyy-mm-dd") + "-??");
            	
        //	}

    		
    		
			log.debug(funcName, "All Available Expense File(s) Retrieved."); 

        	if (filesImported) {
				var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT, scriptId: "customscript_pri_riem_sc_file_importer"});
				scriptTask.submit();
				log.debug(funcName, "RIEM Importer scheduled.");
        	}

		}


		function connectToFTPServer() {

			var mySettings = appSettings.createAppSettingsObject(srsConstants.CHROME_RIVER_APP_NAME); 
			
			var connection = sftp.createConnection({
				username: mySettings.settings["FTP userName"],
				passwordGuid: mySettings.settings["FTP passwordGuid"],
				url: mySettings.settings["FTP URL"],
				port: 22,
				hostKey: mySettings.settings["FTP hostKey"],
				hostKeyType: mySettings.settings["FTP hostKeyType"]
			}); 
			

			return connection; 
		}

		function processFilesForDay(ftpConn, crSettings, lastDate, lastSeqNbr) {
    		
			var funcName = scriptName + "processFilesForDay " + lastDate + " " + lastSeqNbr;
			
			log.debug(funcName, "Starting");
			
			var startHour = (lastSeqNbr == "??") ? 0 : parseInt(lastSeqNbr)+1; 
			
			var importedCount = 0; 

			log.debug(funcName, "Starting at sequence # " + startHour); 


			for (var hourNbr = startHour; hourNbr < 24; hourNbr++) {
	    		var f = retrieveFile(ftpConn, crSettings, lastDate, hourNbr);
				
	    		// log.debug(funcName, "Attempted to retrieve file for hour " + hourNbr + ";  usage remaining=" + runtime.getCurrentScript().getRemainingUsage());
	    		
	    		if (f) {
	    			storeFile(f, crSettings); 
	    			appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, LAST_FILE_APP_SETTING, lastDate.format("yyyy-mm-dd") + "-" + hourNbr.toString().padLeft(2));  
	    			importedCount++; 
	    		}	    	
	    		
	    		
	    		if (runtime.getCurrentScript().getRemainingUsage() < 500)
	    			return importedCount; 
			}
			
			
			// if the day we looked for was more than 3 days ago, then just update the app setting, so that we don't look that far back again
			
			log.debug(funcName, "lastDate=" + lastDate + " and was " + Math.abs(lastDate.diffDays(new Date())) + " days ago.");
			
			if (Math.abs(lastDate.diffDays(new Date())) >= 3) {
				// log.debug(funcName, "bumping up LAST FILE setting to 3 days ago"); 
    			appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, LAST_FILE_APP_SETTING, lastDate.format("yyyy-mm-dd") + "-23");
			}
				
			
			return importedCount; 
		}

/*		
		function processFilesForDay(ftpConn, crSettings, lastDate, lastSeqNbr) {
    		
			var funcName = scriptName + "processFilesForDay " + lastDate + " " + lastSeqNbr;
			
			log.debug(funcName, "Starting");
			
    		lastSeqNbr++; 	        		
    		var f = retrieveFile(ftpConn, crSettings, lastDate, lastSeqNbr);
    		
    		while (f) {
    			storeFile(f, crSettings); 
    			appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, LAST_FILE_APP_SETTING, lastDate.format("yyyy-mm-dd") + "-" + lastSeqNbr);
    			lastSeqNbr++
    			f = retrieveFile(ftpConn, crSettings, lastDate, lastSeqNbr);
    		}
		}
*/		

		
		function retrieveFile(ftpConn, crSettings, fileDate, fileSeqNbr) {

			var funcName = scriptName + "retrieveFile " + " " + fileDate + " " + fileSeqNbr; 
			
			var fileName = "ChromeRiverExport_USD." + srsFunctions.getChromeRiverCustomerCode() + "-" + fileDate.format("yyyy-mm-dd") + "-" + fileSeqNbr.toString().padLeft(2) + ".csv"; 
			
			log.debug(funcName, "Attempting to retrieve file " + fileName + " from " + crSettings.settings["FTP Expense Report Directory"] + " -- usage remaining=" + runtime.getCurrentScript().getRemainingUsage());
			
			try {
				var downloadedFile = ftpConn.download({
					directory: crSettings.settings["FTP Expense Report Directory"],
					filename: fileName
					});

				return downloadedFile; 
				
			} catch (e) {
				if (e.name == "FTP_FILE_DOES_NOT_EXIST")
					log.debug(funcName, "File '" + fileName + "' not found.");
				else
					log.error(funcName, e);
			}
						
		}

		function storeFile(f, crSettings) {
			var funcName = scriptName + "storeFile ";
			
			log.audit(funcName, "Storing file " + f.name + " into directory " + crSettings.settings["Expense File Directory"]); 
			
			f.folder = crSettings.settings["Expense File Directory"]; 
			f.save();
			
		}
		

		// ================================================================================================================================
		// = sends the PERSON master data (EMPLOYEES) =====================================================================================
		// ================================================================================================================================
		
		function sendPersonInformation() {
			
			// all employees, active and inactive
			
			var funcName = scriptName + "sendEmployeeInformation ";

        	var persons = [];
        	
        	var persons = loadEmployeeData(); 
        	        
        	
        	for (var i = 0; i < persons.length; i++) {
				persons[i].udas[0].value = persons[i].expenseLimit;     					
        		if (persons[i].expenseApprover) {
        			var obj = getExpenseApproverInfo(persons, persons[i].expenseApprover);
        			if (obj) {
    					persons[i].udas[1].value = obj.approvalLimit;    					
            			var obj = getExpenseApproverInfo(persons, obj.expenseApprover);    					
            			if (obj) 
        					persons[i].udas[2].value = obj.approvalLimit;        					
        			}
        		}
        	}
        	
        	for (var i = 0; i < persons.length; i++) {
        		delete persons[i].expenseApprover; 
        		delete persons[i].approvalLimit; 
        		delete persons[i].expenseLimit;  
        		var obj = persons[i];  
//    			if (obj.personUniqueId == 709117 || obj.personUniqueId == 686371)
//    				log.debug(funcName, JSON.stringify(obj));  
        	}
			
    			
        	log.debug(funcName, persons.length + " PEOPLE loaded."); 

        	if (persons.length == 0) {
        		log.error(funcName, "No PERSONS to report.");
        		return;
        	}
        	        	
        	
        	var postURL = appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "PEOPLE Post URL"); 

        	srsFunctions.postToChromeRiver(postURL, persons, "PEOPLE");         	

		}
		
		
		function getExpenseApproverInfo(persons, personId) {
			for (var j = 0; j < persons.length; j++)
				if (Math.abs(personId) == persons[j].personUniqueId) {
					return {expenseApprover: persons[j].expenseApprover, approvalLimit: persons[j].approvalLimit}; 
				}			
		}
		

		function loadEmployeeData() {
			var funcName = scriptName + "loadEmployeeData"; 
			
			var employeeData = []; 
			
        	var employeeSearch = search.create({
     		   type: 		record.Type.EMPLOYEE,
     		   filters:		[
     		           		 	["email",search.Operator.ISNOTEMPTY,null]
     		           		 	,"AND",["lastname",search.Operator.ISNOTEMPTY,null]
     		           		 	,"AND",["firstname",search.Operator.ISNOTEMPTY,null]
     		           		 	,"AND",["class",search.Operator.NONEOF,["@NONE@"]]
     		           		 	,"AND",["department",search.Operator.NONEOF,["@NONE@"]]        		           		 	
     		           		 ],        		   
     		   columns:		["firstname","lastname","isinactive","email","class","department","classnohierarchy","departmentnohierarchy","expenselimit","approvallimit","approver","custentity_cr_super_delegate"]        	
        	}).run().each(function (result) {
 			
        		var obj = {username: result.getValue("email"), 
        			firstName: result.getValue("firstname"), 
        			lastName: result.getValue("lastname"), 
        			personUniqueId: Math.abs(result.id), 
        			primaryEmailAddress: result.getValue("email"),
 					primaryCurrency: "USD",
 					defaultMosaic: "Primary",
 					copyingItems: false,

 					// udas: [{name: "UDF1", value: Number(result.getValue("expenselimit")) || "0.00"}, {name: "UDF2", value: Number(result.getValue("approvallimit")) || "0.00"}, {name: "UDF3", value: "0.00"}],
 					udas: [{name: "UDF1", value: 0.00}, {name: "UDF2", value: 0.00}, {name: "UDF3", value: 0.00}],
 					expenseLimit: Number(result.getValue("expenselimit")) || 0.00, 
 					approvalLimit: Number(result.getValue("approvallimit")) || 0.00, 
 					expenseApprover: Math.abs(result.getValue("approver")),
 					reportsToPersonUniqueId: Math.abs(result.getValue("approver")), 					
 					// UDF3: result.getValue("custentity_exp_appr_approval_limit"),
 					personEntities: []};

        		
    			if (result.getValue("custentity_cr_super_delegate")) {
    				obj.superDelegate = true;
    				obj.adminAccess = true;
    			}

    			
    			if (obj.primaryEmailAddress) 
    				obj.primaryEmailAddress = obj.primaryEmailAddress.replace("@shareholderrep.com","@srsacquiom.com"); 

    			
    			if (obj.primaryEmailAddress && obj.primaryEmailAddress.toLowerCase().endsWith("@srsacquiom.com"))
    				obj.alternateEmailAddresses = [obj.primaryEmailAddress.substring(0,obj.primaryEmailAddress.toLowerCase().indexOf("@srsacquiom.com")) + "@shareholderrep.com"]; 
    			
    			if (obj.primaryEmailAddress && obj.primaryEmailAddress.toLowerCase().endsWith("@shareholderrep.com"))
    				obj.alternateEmailAddresses = [obj.primaryEmailAddress.substring(0,obj.primaryEmailAddress.toLowerCase().indexOf("@shareholderrep.com")) + "@srsacquiom.com"]; 
    			    			
    			if (result.getValue("isinactive"))
    				obj.status = "DELETED"; 
    			else
    				obj.status = "ACTIVE";
    			
    			var entityObj = {roleName: "Part Of", entityTypeCode: "OFFDEPT", entityCode: result.getValue("class") + "-" + result.getValue("department")}
    			
    			obj.personEntities.push(entityObj);

    			
    			if (obj.username) 
    				obj.username = obj.username.replace("@shareholderrep.com","@srsacquiom.com"); 
    			        		
    			log.audit(funcName, obj);
    			
//    			const SEND_LIST = ["1056432","1169815","1172428","1172530","878271","1127339","1030855","1208704","481452","1098575","1142915","1144324","1169007","1121377","1234052"]; 
//    			const SEND_LIST = [1056432,1169815,1172428,1172530,878271,1127339,1030855,1208704,481452,1098575,1142915,1144324,1169007,1121377,1234052];    			
//    			const SEND_LIST = [1056432]; 
//    			
//    			if (SEND_LIST.indexOf(obj.personUniqueId) >= 0)
    			
    			employeeData.push(obj);
    			
        			
        		return true;
 			
        	});
        	
        	return employeeData; 
        	
		}
		

		// ================================================================================================================================
		// = sends the ALLOCATION master data (two lists: all "deals" and all possible permutations of entity/department  =================
		// ================================================================================================================================
		
		function sendAllocationInformation() {
			
			// this is a combination of two lists:
			//		all "deals"
			//		all possible permutations of entity/department 
			
			var funcName = scriptName + "sendAllocationInformation ";

        	var allocations = [];
        	
        /* DEALS are no longer being sent as part of the Allocation feed; they are now part of the ENTITY feed
         * 
        	var customerSearch = search.create({
        		   type: 		record.Type.CUSTOMER, 
        		   filters:		[
        		           		 	["isinactive",search.Operator.IS,false] 
        		           		 	,"AND",["category",search.Operator.ANYOF,[srsConstants.CUSTOMER_CATEGORY.DEAL]]
        		           		 	,"AND",["depositbalance",search.Operator.GREATERTHAN,0.00]
        		           		 ],
        		   columns:		["entityid"]
        	}).run().each(function (result) {
    			// log.debug(funcName, JSON.stringify(result)); 
    			
    			var obj = {allocationName: result.getValue("entityid"), allocationNumber: result.id, clientName: result.getValue("entityid"), clientNumber: result.id, locale: srsConstants.DEFAULT_LOCALE, currency: "USD"};
    			
    			// obj.entityNames = [{locale: srsConstants.DEFAULT_LOCALE, name: result.getValue({name: "classnohierarchy", summary: "group"}) + " - " + result.getValue({name: "departmentnohierarchy", summary: "group"})}];
    			
    			
    			if (allocations.length < MAX_ALLOCATION_RECORDS)
    				allocations.push(obj);
    			    			
    			return true; 
    			
        	}); 
        	

        	log.debug(funcName, allocations.length + " DEALs loaded.");
        	
        */
        	// now find every permutation of ENTITY (class) and DEPARTMENT
        	//	but take into consideration 
        	
        	
        	var classes = [];
        	var classSearch = search.create({
     		   type: 		record.Type.CLASSIFICATION, 
     		   filters:		[
     		           		 	["isinactive",search.Operator.IS,false] 
     		           		 	,"AND",["custrecord_srs_use_for_chrome_river",search.Operator.IS,true]
     		           		 ],
     		   columns:		["name"]
     		}).run().each(function (result) {
     			// log.debug(funcName, JSON.stringify(result)); 
     			
     			var obj = {id: result.id, name: result.getValue("name")};
     			
     			classes.push(obj);
     			
     			return true; 
     			
     		}); 
        	
        	log.debug(funcName, classes.length + " ENTITIEs loaded.");


        	var departments = [];
        	var departmentSearch = search.create({
     		   type: 		record.Type.DEPARTMENT, 
     		   filters:		[
     		           		 	["isinactive",search.Operator.IS,false] 
     		           		 ],
     		   columns:		["name"]
     		}).run().each(function (result) {
     			// log.debug(funcName, JSON.stringify(result)); 
     			
     			var obj = {id: result.id, name: result.getValue("name")};
     			
     			departments.push(obj);
     			
     			return true; 
     			
     		}); 

        	log.debug(funcName, departments.length + " DEPARTMENTs loaded.");

        	
        	if (classes.length == 0) 
        		log.error(funcName, "NO Entities selected.  Can't send ENTITY/DEPARTMENT Allocations.");
        	
        	if (departments.length == 0) 
        		log.error(funcName, "NO Departments selected.  Can't send ENTITY/DEPARTMENT Allocations.");
        	
        	
        	for (var cx = 0; cx < classes.length; cx++) 
        		for (var dx = 0; dx < departments.length; dx++) {
        			var obj = {allocationName: classes[cx].name + " - " + departments[dx].name, allocationNumber: classes[cx].id + "-" + departments[dx].id, clientName: classes[cx].name, clientNumber: classes[cx].id, locale: srsConstants.DEFAULT_LOCALE, currency: "USD"};
        			
        			if (obj.clientName.length > 130)
        				obj.clientName = obj.clientName.substring(0,130);
        			
        			if (allocations.length < MAX_ALLOCATION_RECORDS)
        				allocations.push(obj);
        		}
        	
        	
        	
        	if (allocations.length == 0) {
        		log.error(funcName, "No ALLOCATIONS to report.  Exiting.");
        		return;
        	}
        	

        	log.debug(funcName, "Sending " + allocations.length + " ALLOCATIONs.");

        	var postURL = appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "ALLOCATION Post URL"); 

        	srsFunctions.postToChromeRiver(postURL, allocations, "ALLOCATION"); 
        	

		}
	

		// ================================================================================================================================
		// = sends ENTITY master data - which is a combination of all DEALs and all DEPARTMENT/CLASS combinations in use ==================
		// ================================================================================================================================
		
		function sendEntityInformation() {
			
			var funcName = scriptName + "sendEntityInformation ";

        	var entities = [];
        	        	
        	var customerSearch = search.create({
        		   type: 		record.Type.CUSTOMER, 
        		   filters:		[
        		           		 	["isinactive",search.Operator.IS,false] 
        		           		 	,"AND",["category",search.Operator.ANYOF,[srsConstants.CUSTOMER_CATEGORY.DEAL]]
        		           		 	,"AND",["depositbalance",search.Operator.GREATERTHAN,0.00]
        		           		 ],
        		   columns:		["entityid"]
        	}).run().each(function (result) {
        		
    			var obj = {status: "ACT", entityCode: result.id, entityTypeCode: "DEAL"};
    			obj.entityNames = [{locale: srsConstants.DEFAULT_LOCALE, name: result.getValue("entityid")}];

    			entities.push(obj); 
    			
    			return true; 
        	}); 
        	
        	log.debug(funcName, entities.length + " DEALs loaded.");

        	
        	var employeeSearch = search.create({
        		   type: 		record.Type.EMPLOYEE, 
        		   filters:		[
        		           		 	["class",search.Operator.NONEOF,"@NONE@"] 
        		           		 	,"AND",["department",search.Operator.NONEOF,"@NONE@"]
        		           		 ],
        		   columns:		[
        		           		 search.createColumn({name: "class",summary: "GROUP",label: "Entity"}),
        		           		 search.createColumn({name: "department",summary: "GROUP",label: "Department"}),
        		           		 search.createColumn({name: "classnohierarchy",summary: "GROUP",label: "Entity"}),
        		           		 search.createColumn({name: "departmentnohierarchy",summary: "GROUP",label: "Department"}),
        		           		 search.createColumn({name: "internalid",summary: "COUNT",label: "Internal ID"})
        		           		 ]
        		}).run().each(function (result) {
        			// log.debug(funcName, JSON.stringify(result)); 
        			
        			var obj = {status: "ACT", entityCode: result.getValue({name: "class", summary: "group"}) + "-" + result.getValue({name: "department", summary: "group"}), entityTypeCode: "OFFDEPT"};
        			
        			obj.entityNames = [{locale: srsConstants.DEFAULT_LOCALE, name: result.getValue({name: "classnohierarchy", summary: "group"}) + " - " + result.getValue({name: "departmentnohierarchy", summary: "group"})}];
        			
        			entities.push(obj);
        			
        			if (entities.length > MAX_ENTITY_RECORDS)
        				return;
        			
        			return true; 
        			
        		}
        	); 
        	
        	if (entities.length == 0) {
        		log.error(funcName, "No entitites to report.");
        		return;
        	}
        	
        	log.debug(funcName, "Sending " + entities.length + " ENTITIEs.");
        	
        	
        	var postURL = appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, "ENTITY Post URL"); 

        	srsFunctions.postToChromeRiver(postURL, entities, "ENTITY"); 
        	

		}
	
		// ================================================================================================================================
		
        return {
            execute: execute
        };
    }
);