//-----------------------------------------------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

/*
 * 
 * suitelet for testing code
 *  
 */


define(['N/ui/serverWidget', 'N/record', 'N/runtime', 'N/search', 'N/format', 'N/url', 'N/http', 'N/https', 'N/sftp', 'N/file', 'N/util', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_ServerLibrary'],  
	function(ui, record, runtime, search, format, url, http, https, sftp, file, util, srsConstants, srsFunctions, appSettings, priLibrary) {

	"use strict"; 
	
		var scriptName = "SRS_SL_Test.";

		var _context;
		
		var LAST_FILE_APP_SETTING = "Last Imported Expense Report File";


		function onRequest(context) {
							
			var funcName = scriptName + ".onRequest ";
		
			_context = context;

			try {

              createPasswordGuid(context); 
			//	generateShareholderLetters(1163); 

			} catch (e) {
				writeToScreen("******* ERROR ******");
				writeToScreen("******* ERROR ******");
				writeToScreen("******* ERROR ******");
				writeToScreen(JSON.stringify(e));
			}
			

			
		}
		
		// ================================================================================================================================

		function generateShareholderLetters(rapId) {

			var funcName = scriptName + "generateShareholderLetters"; 
			
			var RAP = record.load({type: "customrecord_escrow_payment_approvals", id: rapId}); 
			

			var ss = search.create({
				type: 		"customrecord18",
				filters:	[
				        	 	["isinactive","is","F"]
				        	 	,"AND",["custrecord_journal_id","anyof",RAP.getValue("custrecord_release_journals")]
				        	 	,"AND",["custrecord67.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord67.category",search.Operator.ANYOF,[2]]
				        	 ],
				columns:	["CUSTRECORD67.internalid","custrecord_journal_id"]
			}).run().getRange(0,1000);  
						
			writeToScreen("returned " + ss.length + " rows");
			

			log.debug(funcName, "Retrieved " + ss.length + " ESCROW rows");

			var custList = []; 
			var custEscrows = []; 
			
			for (var i = 0; i < ss.length; i++) {
				var result = ss[i];
				
				var custId = result.getValue({name: "internalid", join: "custrecord67"}); 
				var escrowId = result.id; 
				
				if (custList.indexOf(custId) < 0) {
					// log.debug(funcName, "   - coulnd't find cust " + custId);
										
					custList.push(custId);
					var escrowList = [];
					escrowList.push(escrowId); 
					custEscrows[custId] = escrowList; 
				} else {
					var escrowList = custEscrows[custId]; 						
					// log.debug(funcName, "       list=" + JSON.stringify(escrowList)); 
					
					escrowList.push(escrowId); 
					custEscrows[custId] = escrowList; 
				}				
			}
				
			var requiredLetters = []; 
						
			writeToScreen("CUSTOMERS: " + JSON.stringify(custList)); 
			
//			first, find all customers using the Shareholder Data Access record
			loadCustomerShareholderDataAccessRecords(requiredLetters, custEscrows, custList, RAP); 

			writeToScreen("Found " + requiredLetters.length + " Shareholder Letter Records based on SDA ."); 

			for (var i = 0; i < requiredLetters.length; i++)
				writeToScreen(JSON.stringify(requiredLetters[i])); 
			
			writeToScreen("====================");
			
			
//			next, find customers whose parent is of category "Investor Group"
			
			
			writeToScreen("Looking for parent investor groups tied to any of these customers: " + JSON.stringify(custList)); 
			
			var investorGroupSearch = priLibrary.searchAllRecords(search.create({
				type:		record.Type.CUSTOMER,
				filters:	[
				        	 ["isinactive",search.Operator.IS,false]
				        	 ,"AND",["internalid",search.Operator.ANYOF,custList]
				        	 ,"AND",["parentcustomer.category",search.Operator.ANYOF,[srsConstants.CUSTOMER_CATEGORY.INVESTOR_GROUP]]
				        	 ],
				columns:	["parentcustomer.internalid"]
			}));  
						
			var investorGroupList = []; 
			
			for (var i = 0; i < investorGroupSearch.length; i++)
				investorGroupList.push({custId: investorGroupSearch[i].id, groupId: investorGroupSearch[i].getValue({name: "internalid", join: "parentcustomer"})});

			// writeToScreen("INVESTOR GROUP: " + JSON.stringify(investorGroupList)); 
			
			// we also need to know which 
			

//			and for those customers, find the appropriate SDA records
			loadInvestorGroupShareholderDataAccessRecords(requiredLetters, custEscrows, investorGroupList, RAP); 

						
			writeToScreen("We now have " + requiredLetters.length + " after adding Investor Group records via SDA ."); 
			
			for (var i = 0; i < requiredLetters.length; i++) {
				var custId = requiredLetters[i].custId;
				requiredLetters[i].custName = search.lookupFields({type: record.Type.CUSTOMER, id: custId, columns: ["entityid"]}).entityid; 
				writeToScreen(JSON.stringify(requiredLetters[i])); 
			}
			

		}
		
		// ================================================================================================================================


		function loadCustomerShareholderDataAccessRecords(requiredLetters, custEscrows, custList, RAP) {

			var sdaSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecord_shareholder_data_access",
				filters:	[
				        	 	["custrecord_shareholder",search.Operator.ANYOF,custList]
				        	 	,"AND",["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.email",search.Operator.ISNOTEMPTY,null]
				        	 	,"AND",["custrecord_escrow",search.Operator.ANYOF,[RAP.getValue("custrecord_escrow_payment_deal")]]
				        	 ],
				columns:	["custrecord_user","custrecord_shareholder"]
			})); 

			writeToScreen("loadCustomerShareholderDataAccessRecords: searching SDA records yielded " + sdaSearch.length + " rows");

			for (var i = 0; i < sdaSearch.length; i++) {
				var result = sdaSearch[i];

				if (result.getValue("custrecord_shareholder")) {
					var shareholderList =  result.getValue("custrecord_shareholder").split(",");
					for (var j = 0; j < shareholderList.length; j++) {
						var custId = shareholderList[j];

						// multiple customers are listed ... only take the one that is part of our "customer list"
						
						if (custList.indexOf(custId) >= 0) {
							
							writeToScreen("RESULT=" + JSON.stringify(result)); 
							
							var obj = {};
							
							obj.contactId = result.getValue("custrecord_user"); 
							obj.contactName = result.getText("custrecord_user"); 
							obj.custId = shareholderList[j];  
							obj.escrowIds = custEscrows[obj.custId]; 
							obj.journalIds = RAP.getValue("custrecord_release_journals"); 
							
							if (!customerContactExists(obj, requiredLetters))
								requiredLetters.push(obj); 																	
						}						
					}						
				}
				
			}
		}
		
		
		// ================================================================================================================================

		function loadInvestorGroupShareholderDataAccessRecords(requiredLetters, custEscrows, investorGroupList, RAP) {
			
			// extract all unique investor groups
			var groupList = [];
			for (var i = 0; i < investorGroupList.length; i++)
				if (groupList.indexOf(investorGroupList[i].groupId) < 0)
					groupList.push(investorGroupList[i].groupId); 

			writeToScreen("INVESTOR GROUPS: " + JSON.stringify(groupList)); 
			

			var sdaSearch = priLibrary.searchAllRecords(search.create({
				type:		"customrecord_shareholder_data_access",
				filters:	[
				        	 	["custrecord_investor_group",search.Operator.ANYOF,groupList]
				        	 	,"AND",["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_user.email",search.Operator.ISNOTEMPTY,null]
				        	 	,"AND",["custrecord_escrow",search.Operator.ANYOF,[RAP.getValue("custrecord_escrow_payment_deal")]]
				        	 ],
				columns:	["custrecord_user","custrecord_shareholder","custrecord_investor_group"]
			})); 

			writeToScreen("searching SDA records yielded " + sdaSearch.length + " rows");

			if (sdaSearch.length == 0)
				return; 
			
			
			for (var i = 0; i < sdaSearch.length; i++) {
				var result = sdaSearch[i];

				writeToScreen(JSON.stringify(result)); 
				
				if (result.getValue("custrecord_shareholder")) {
					
//					writeToScreen("Group " + result.getValue("custrecord_investor_group") + " had these shareholders: " + result.getValue("custrecord_shareholder"));
					
					// only take the shareholders listed in this group
					var shareholderList =  result.getValue("custrecord_shareholder").split(",");
					for (var j = 0; j < shareholderList.length; j++) {
						var obj = {};
						
						obj.contactId = result.getValue("custrecord_user"); 
						obj.contactName = result.getText("custrecord_user"); 
						obj.custId = shareholderList[j];  
						obj.escrowIds = custEscrows[obj.custId]; 
						obj.journalIds = RAP.getValue("custrecord_release_journals"); 
						
						if (!customerContactExists(obj, requiredLetters))
							requiredLetters.push(obj); 											
					}						
					
				} else {
					
//					writeToScreen("Group " + result.getValue("custrecord_investor_group") + " had NO shareholders: " + result.id);

					// take all shareholders who are part of this group
					for (var j = 0; j < investorGroupList.length; j++) {
						
						if (result.getValue("custrecord_investor_group") == investorGroupList[j].groupId) {
//							writeToScreen("   - joining it to customer " + investorGroupList[j].custId + "  contact " + result.getValue("custrecord_user")); 
							var obj = {};
							
							obj.contactId = result.getValue("custrecord_user"); 
							obj.contactName = result.getText("custrecord_user"); 
							obj.custId = investorGroupList[j].custId;  
							obj.escrowIds = custEscrows[obj.custId]; 
							obj.journalIds = RAP.getValue("custrecord_release_journals"); 
							
							if (!customerContactExists(obj, requiredLetters))
								requiredLetters.push(obj); 																		
						}
						
					}						
					
				}
				
			}
		}
		
		
		// ================================================================================================================================
		
		function customerContactExists(obj, requiredLetters) {
			for (var i = 0; i < requiredLetters.length; i++) 
				if (requiredLetters[i].contactId == obj.contactId && requiredLetters[i].custId == obj.cistId)
					return true;
		}
		

		
		
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================

		
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================

		
		function cleanUpLathamImports() {
			
			// clean up documents linked to 
			
			writeToScreen(util.nanoTime() / 1000000000 + " at start"); 
			
			var ss = search.create({
				type:			"customrecord_document_management",
				filters:		[
				        		 	["custrecord_escrow_customer.entityid",search.Operator.STARTSWITH,"Deal Points LW"]
				        		 	,"AND",["custrecord_escrow_customer.custentity_enterprisedps",search.Operator.IS,true]
				        		 ]
			}).run().each(function (result) {
				deleteIt(result); 				
				return true;
			}); 
			
			
			
			writeToScreen(util.nanoTime() / 1000000000 + " after deleting documents"); 
			

			var ss = search.create({
				type:	"customrecord_dps_enterprise_client"
			}).run().each(function (result) {
				deleteIt(result); 				
				return true;
			})

			writeToScreen(util.nanoTime() / 1000000000 + " after deleting enterprise clients"); 
			
			// clear out this on all customers 
			var ss = search.create({
				type:			"customer",
				filters:		[
				        		 	["entityid",search.Operator.STARTSWITH,"Deal Points LW"]
				        		 	,"AND",["custentity_enterprisedps",search.Operator.IS,true]
				        		 ]
			}).run().each(function (result) {
				record.submitFields({type: record.Type.CUSTOMER, id: result.id, values: {custentity_eo_dealpoints: ""}}); 
				writeToScreen("Cleared out field custentity_eo_dealpoints on " + JSON.stringify(result)); 
				return true;
			}); 
			
			writeToScreen(util.nanoTime() / 1000000000 + " after clearing out customers pointers"); 

			
			var ss = search.create({
				type:			"customrecord_deal_points_study",
				filters:		[
				        		 	["custrecord_deal.entityid",search.Operator.STARTSWITH,"Deal Points LW"]
				        		 	,"AND",["custrecord_deal.custentity_enterprisedps",search.Operator.IS,true]
				        		 ]
			}).run().each(function (result) {
				deleteIt(result); 				
				return true;
			}); 
			
			writeToScreen(util.nanoTime() / 1000000000 + " after deleting DPS"); 

						
			var ss = search.create({
				type:			"customer",
				filters:		[
				        		 	["entityid",search.Operator.STARTSWITH,"Deal Points LW"]
				        		 	,"AND",["custentity_enterprisedps",search.Operator.IS,true]
				        		 ]
			}).run().each(function (result) {
				deleteIt(result); 				
				return true;
			}); 
			
			
			writeToScreen(util.nanoTime() / 1000000000 + " after deleting customers"); 


			// delete backfilled Opposing Counsel list
			var ss = search.create({
				type:			"customrecord_dps_opposing_counsel"
			}).run().each(function (result) {
				deleteIt(result); 				
				return true;
			}); 
			

			
			
			var folderId = 10409710;
			var targetFolderId = 10422714; 
			
			var fileSearch = search.create({
				type: 			"file",
				filters: 		[
				         		 	["folder",search.Operator.IS,[folderId]]
				         		 ],
				columns: 		["name","folder"]
			}).run().each(function (result) {

				if (result.getValue("folder") == folderId && result.getValue("name").indexOf("[") >= 0) {					
					var F = file.load(result.id);
					
					F.folder = targetFolderId; 
					F.save();
					
					writeToScreen("File " + result.getValue("name") + " moved to folder " + targetFolderId); 					
				}
				
				return true; 
			})
			
			writeToScreen(util.nanoTime() / 1000000000 + " after moving files"); 

			
			
		}

		function deleteIt(result) {
			record.delete({type: result.recordType, id: result.id});
			writeToScreen("Deleted record " + JSON.stringify(result)); 			
		}
		
		
		// returns the integer 
		function getCustomRecordTypeInternalId(custRecType) {
			
			// url.match(/.*?[?&]rectype=([^&]*)/);
			
			var recURL = url.resolveRecord({recordType: custRecType, recordId:1}); 
			
			writeToScreen(recURL); 
			
			var queryparams=recURL.split('?')[1];
			
			writeToScreen("q=" + JSON.stringify(queryparams)); 
			
			
			var params=queryparams.split('&');

			writeToScreen("p=" + JSON.stringify(params)); 

			var pair="",data=[];

			var entityValue="";

			params.forEach(function(d){
				pair=d.split('=');
				data.push({key:pair[0],value:pair[1]});
				
				writeToScreen("d=" + JSON.stringify(data)); 
				for(var i=0;i<data.length;i++) {
					
					writeToScreen("data[i]=" + JSON.stringify(data[i])); 
					
					if(data[i].key=="rectype") {
						
						writeToScreen("*** FOUND IT ***"); 
						entityValue=data[i].value; 
					}
				}				
			});
			
			return entityValue; 
		}
		


		
		function retrieveExpenseReports() {
			
			var funcName = scriptName + "execute";
			            
        	log.debug(funcName, "Starting");

        	
        	var lastFileStamp = appSettings.readAppSetting(srsConstants.CHROME_RIVER_APP_NAME, LAST_FILE_APP_SETTING);
        	var lastDate = new Date().addDays(-3);  
        	var lastSeqNbr = 0; 

        	var todayStr = new Date().format("yyyy-mm-dd"); 

        	writeToScreen("default date=" + lastDate + "; seq=" + lastSeqNbr); 
        	
        	if (lastFileStamp) {
        		if (!/^\d\d\d\d\-\d\d\-\d\d\-\d\d?/.test(lastFileStamp)) 
        			throw "App Setting " + LAST_FILE_APP_SETTING + " was not in the correct format.  Expected ####-##-##-## but found " + lastFileStamp;
        		lastDate = new Date(lastFileStamp.substring(0,4), Number(lastFileStamp.substring(5,7))-1, Number(lastFileStamp.substring(8,10))-1);  
        		lastSeqNbr = lastFileStamp.substring(11); 
        	} 
        		
        	writeToScreen("retrieved date=" + lastDate + "; seq=" + lastSeqNbr); 
        		
        	while (lastDate.format("yyyy-mm-dd") < todayStr) {
        		
        		processFilesForDay(lastDate, lastSeqNbr); 
        		
        		lastDate.addDays(1); 
        		lastSeqNbr = 0;
        		
        	}

        	writeToScreen(" caught up *** "); 
        	
        	// we have now processed all the files for "previous" days; finally, do "today"
    		processFilesForDay(lastDate, lastSeqNbr); 

		}

		
		// ================================================================================================================================

		function processFilesForDay(lastDate, lastSeqNbr) {
    		
    		lastSeqNbr++; 	        		
    		var f = retrieveFile(lastDate, lastSeqNbr);
    		
    		while (f) {
    			storeFile(f); 
    			appSettings.writeAppSetting(srsConstants.CHROME_RIVER_APP_NAME, LAST_FILE_APP_SETTING, lastDate.format("yyyy-mm-dd") + "-" + lastSeqNbr);
    			lastSeqNbr++
    			f = retrieveFile(lastDate, lastSeqNbr);
    		}
		}
		
		
		function retrieveFile(fileDate, fileSeqNbr) {
			
			writeToScreen("Retrieving file for " + fileDate + " : " + fileSeqNbr);
			
			if (fileSeqNbr < 3) {
				writeToScreen("    - success"); 
				return true; 					
			}

			writeToScreen("    - not found"); 

		}

		function storeFile(f) {
			
		}
		
		// ================================================================================================================================

		function testFTP() {

			var connection = sftp.createConnection({
				username: "SRSAcquiom",
				passwordGuid: "bdbf6b14cbe74eecb7f115e85d55ff8c",
				url: "ftp.eu1.chromeriver.com",
				port: 22,
				hostKey: "AAAAB3NzaC1yc2EAAAADAQABAAABAQDP4HCSjRQvRdWLuawr0UciilhOgMjrJG8FTP2rxCLhGYqdVQvUAjhkLsSi80js5A+sCKUmZpL7wRAjdtgDtynGM/PYfXyY+6bEzPwx4aB0z56qE0wjHZBbprfCRYmPk+BSc/oD/mC4gEtQz0MBIle2j7m2zOf1eLMH0YCgjOT2S0pWh3DY3JHvlR+idTl5mDP7DmGFZ0ennCPHFdG218R0ydaxEEAmZJi+hdf8/bNvECKbkR/w686nnAoLpBPzEnr5fOCa4CltgGSEChqgF1AC33tiLbAKt2HzkCXziwDjTvYxdJxMNUlT8mX0Y6zFzIoxBhBDYM4J7CVoU0543GMB",
				hostKeyType: "rsa"
			}); 
			
			writeToScreen("connection established");

			writeToScreen(JSON.stringify(connection)); 
			
			var downloadedFile = connection.download({
				directory: '/files/export',
				filename: "ChromeRiverExport_USD.YIQR-2018-09-26-165643.csv"
				});

			downloadedFile.folder = 575015; 
			downloadedFile.save(); 
			
			writeToScreen("file downloaded"); 
		}
		
		
		// ================================================================================================================================

		function createPasswordGuid(context) {
			if (context.request.method === 'GET') {
				var form = ui.createForm({
					title: 'Password Form'
				});
				form.addCredentialField({
					id: 'password',
					label: 'Password',
					restrictToDomains: ['ftp.eu1.chromeriver.com'],
					restrictToCurrentUser: false,
					restrictToScriptIds: 'customscript_srs_sc_chr_rvr_data_exch'
				});
				form.addSubmitButton();
				context.response.writePage({
					pageObject: form
				});
			} else {
				// Request to an existing suitelet with credentials
				var passwordGuid = context.request.parameters.password;
				
				writeToScreen("GUID=" + passwordGuid); 
				
			}

		}
		
		function writeToScreen(msg) {
			_context.response.write(msg + "<br>");				
		}

		// ================================================================================================================================
			

			return {
				onRequest : onRequest
			};
});

