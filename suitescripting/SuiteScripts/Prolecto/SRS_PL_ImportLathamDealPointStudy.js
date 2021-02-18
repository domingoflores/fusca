//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Uses the Prolecto Record Import/Export Manager (RIEM) to import Latham Deal Point Study records from a CSV file
 * 
 */


/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType plugintypeimpl
 */


define(['N/runtime','N/log','N/record','N/search','N/format','N/file','N/email','./Shared/SRS_Constants','./Shared/SRS_Functions', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_ServerLibrary'],
	function(runtime,log,record,search,format,file,email,srsConstants,srsFunctions,appSettings,priLibrary) {
	
		var scriptName = "SRS_PL_ImportLathamDealPointStudy.";

		var STATUS_PENDING = 1;
		var STATUS_FAILED = 4;
		var STATUS_PROCESSED = 2;
		var STATUS_SKIPPED = 3;

		var APP_NAME = "LUNA";
		
		var DOCUMENT_STATUS_DRAFT = 3; 
		
		var INDUSTRY_TRANSLATION; 
		var CLIENT_ROLE_TRANSLATION; 
		
		var clientShortCode = "?";

		var PROBLEM_EMAIL_RECIPIENT; 
		var EMAIL_SENDER; 

		const CAPTURE_METHOD = {
				NONE:		1,
				PROVIDED:	2,
				DERIVED:	3
		}
		function createRecord(importData, externalId, context) {
			
			var funcName = scriptName + "createRecord ";
			
			var obj = JSON.parse(context.values[0]);

			importData = JSON.parse(importData);

			// since there is always just one row, get rid of array referencing
			
			importData = importData[0]; 
			
			// log.debug(funcName, context); 
			
			var contextObj = JSON.parse(context.values[0]);
			
			clientShortCode = contextObj.values["custrecord_pri_riem_job_file.custrecord_pri_riem_impstg_job"].text.substring(0,2); 

			
			// a few fields need to be re-mapped, in case the client is anyone other than Latham/Watkins			
			if (clientShortCode == "ML") {
				importData.lwdealid = importData.mlbdealid;
				importData.lathamrole = importData.mlbrole;
			}
						
			
			funcName = funcName + importData.lwdealid;

			const REQUIRED_FIELDS = ["lwdealid","ofdocuments","srsacquiomidentifier","closingdate","auctionprocess","majorityinterestdeal","structure","lathamrole","opposingcounsel","targetindustry","buyerindustry"]
			
			try {
			
				// PERFORM SOME VALIDATION SO THAT WE CATCH SOME PROBLEMS BEFORE WE EVEN START
				
				var missingFields = []; 
				for (var i = 0; i < REQUIRED_FIELDS.length; i++) {
					var reqField = REQUIRED_FIELDS[i];
					if (!importData.hasOwnProperty(reqField))
						missingFields.push(reqField); 
				}
				if (missingFields.length > 0)
					throw "The following columns were not found in the import file: " + JSON.stringify(missingFields);  
				
				
				var clientId = findEnterpriseClientId(clientShortCode);  
				
				if (!clientId)
					throw "Unable to determine client ID from filename: " + contextObj.values["custrecord_pri_riem_job_file.custrecord_pri_riem_impstg_job"].text; 
				
				
				log.debug(funcName, "Selecting Enterprise Client " + clientId + " based on code " + clientShortCode); 
				
				// ATP-2056 >>>
				var clientFields = search.lookupFields({type: "customrecord_enterprise_client", id: clientId, columns: ["custrecord_ec_deal_url_capture_method","custrecord_ec_general_deal_url"]});

				if (clientFields.custrecord_ec_deal_url_capture_method && clientFields.custrecord_ec_deal_url_capture_method.length > 0 && clientFields.custrecord_ec_deal_url_capture_method[0].value == CAPTURE_METHOD.PROVIDED)
					if (!importData.dealurl)
						throw "This client requires that the Deal URL be provided in column 'Matter URL' but this column was not provided or was empty";
				// ATP-2056 <<<

				
				INDUSTRY_TRANSLATION = JSON.parse(appSettings.readAppSetting(APP_NAME, clientShortCode+"-Industry Mapping")); 
				CLIENT_ROLE_TRANSLATION = JSON.parse(appSettings.readAppSetting(APP_NAME, clientShortCode+"-Client Role Mapping")); 
				PROBLEM_EMAIL_RECIPIENT = appSettings.readAppSetting(APP_NAME, clientShortCode+"-Import Error Notification")
				EMAIL_SENDER = appSettings.readAppSetting(APP_NAME, "Import Error Notification Sender"); 
				
				if (!PROBLEM_EMAIL_RECIPIENT)
					throw "App Setting '" + clientShortCode+"-Import Error Notification" + "' not defined.";

				log.debug(funcName, CLIENT_ROLE_TRANSLATION); 
				

				var importedFields = {}; 
								
				log.debug(funcName, "Processing Deal ID " + importData.lwdealid);

				
				// check whether there are as many attachments as we expect
				// the last parameter to this function tells it to only count, but not actually attach
				var fileCount = attachFiles(appSettings.readAppSetting(APP_NAME, clientShortCode+"-File Name Pattern"), appSettings.readAppSetting(APP_NAME, clientShortCode+"-Import File Folder"), appSettings.readAppSetting(APP_NAME, clientShortCode+"-Import File Archive Folder"), importData.lwdealid, custId, true); 

				// sometimes it has things like "N/A"
				if (isNaN(importData.ofdocuments))
					importData.ofdocuments = "";
				
				if (importData.ofdocuments && (fileCount != Number(importData.ofdocuments))) {
					sendProblemEmail("Deal " + importData.lwdealid + " Import Error: # of Files Incorrect","Import expected " + importData.ofdocuments + " files, but " + fileCount + " were found.");
					throw "File count mismatch.  Found " + fileCount + " files but expected " + Number(importData.ofdocuments) + ".  Email sent to " + PROBLEM_EMAIL_RECIPIENT; 
				}
				
				// this will throw an error if it can't be found
				findOffices(importData.lwdealid, importData.offices); 

				
				var clientRoleList = getClientRoleList(importData.lathamrole, CLIENT_ROLE_TRANSLATION, importData.lwdealid); 				
				log.debug(funcName, "clientRoleList: " + JSON.stringify(clientRoleList)); 
				

				
				var existingDeal = false;
				// check whether the "engaged" flag is set.  this column name is long, and possibly unpredictable, so look for a column name which has the words "acquiom" and "engaged"
				var objKeys = Object.keys(importData);
				for (var i = 0; i < objKeys.length; i++) {
					var key = objKeys[i];           
					if (key && key.toLowerCase().indexOf("srs") >= 0 && key.toLowerCase().indexOf("acquiom") >= 0 && key.toLowerCase().indexOf("engaged") >= 0)
						existingDeal = (importData[key] == "Yes");  						
				} 
				
				var custId; 
				
				log.debug(funcName, "Existing Deal? " + existingDeal); 
				
				if (existingDeal)
					if (!importData.srsacquiomidentifier) {
						sendProblemEmail("Deal " + importData.lwdealid + " has the 'engaged' flag set to yes, but there column 'SRS Acquiom Identifier' is blank.","Deal " + importData.lwdealid + " has the 'engaged' flag set to yes, but there column 'SRS Acquiom Identifier' is blank.");
						throw "'SRS Acquiom Identifier' is blank when a value was expected.  Email sent to " + PROBLEM_EMAIL_RECIPIENT; 						
					} else {
						var dealIdMatch = (/DID(\d+)/).exec(importData.srsacquiomidentifier);
						custId = dealIdMatch ? dealIdMatch[1] : null;
						
						if (!custId) {
							sendProblemEmail("Deal " + importData.lwdealid + " did not have valid DID.","Deal " + importData.lwdealid + " had the following value in the 'SRS Acquiom Identifier' field: " + importData.srsacquiomidentifier);
							throw "Invalid 'SRS Acquiom Identifier' found.  Email sent to " + PROBLEM_EMAIL_RECIPIENT;
						}
						
						log.debug(funcName, "Existing DPS record Deal ID is " + custId); 
						
						var ss = search.create({
							type:		"customrecord_deal_points_study",
							filters:	[
							        	 	["isinactive",search.Operator.IS,false]
							        	 	,"AND",["custrecord_deal",search.Operator.ANYOF,[custId]]
							        	 ],							
						}).run().getRange(0,1);
						
						if (ss.length == 0) {
							sendProblemEmail("Deal " + importData.lwdealid + " DID# was invalid.","Deal " + importData.lwdealid + " referenced DID # " + custId + " but no DPS record found with that Deal ID");
							
							return {status: STATUS_SKIPPED, message: "Invalid 'SRS Acquiom Identifier' references a non-existing Deal ID.  Email sent to " + PROBLEM_EMAIL_RECIPIENT};
						} else {
							dpsId = ss[0].id; 
							log.debug(funcName, "Existing DPS ID is " + dpsId); 							
						}
					}
				
				
				// var custId = 1051395;
				
				if (!custId) {
					var customerName = "Deal Points " + clientShortCode + " " + importData.lwdealid; 					
					custId = customerExists(customerName); 					
				}
				
				//if (customerExists(customerName))
				//	throw "This Customer Already Exists: " + customerName; 
				
				if (!custId) {
					var CUST = record.create({type: record.Type.CUSTOMER}); 
					
					CUST.setValue("custentity_enterprisedps", true); 
					CUST.setValue("customform", appSettings.readAppSetting(APP_NAME, "Enterprise Customer Form"));  
					CUST.setValue("category", appSettings.readAppSetting(APP_NAME, "Enterprise Customer Category ID"));  
					CUST.setValue("companyname", customerName);

					if (importData.closingdate) 
						CUST.setValue("custentity8", new Date(importData.closingdate));
					
					custId = CUST.save();
					log.debug(funcName, "Customer " + custId + " created.");				
				} else {
					
					var fieldsToUpdate = {custentity_enterprisedps: true};
					
					if (importData.closingdate)
						fieldsToUpdate.custentity8 = format.format({value: new Date(importData.closingdate), type: format.Type.DATE}); 
					
					record.submitFields({type: record.Type.CUSTOMER, id: custId, values: fieldsToUpdate}); 
					log.debug(funcName, "Using existing customer " + custId); 
					
				}
				
				if (existingDeal) {
					var REC = record.load({type: "customrecord_deal_points_study", id: dpsId}); 
					log.debug(funcName, "Record matched to DPS " + dpsId + " / Deal " + custId); 
				} else
					var REC = record.create({type: "customrecord_deal_points_study"});

				var importedFields = {}; 
				
				REC.setValue("custrecord_deal", custId); 

				if (!existingDeal)
					REC.setValue("externalid", externalId); 


				REC.setText("custrecord_etc_auction_process", importData.auctionprocess);
				if (importData.auctionprocess)
					importedFields.custrecord_etc_auction_process = true; 				
				
				REC.setText("custrecord_etc_majority_interest_deal", importData.majorityinterestdeal); 
				if (importData.majorityinterestdeal)
					importedFields.custrecord_etc_majority_interest_deal = true; 				

				// 2018.12.11 - this field has been moved to the DPS Enterprise Client record
				// REC.setValue("custrecord_en_lw_opposing_counsel", backfillOpposingCounsel(importData.opposingcounsel)); 
				// if (importData.opposingcounsel)
				//	importedFields.custrecord_en_lw_opposing_counsel = true;
				
				REC.setValue("custrecord_etc_transaction_structures", getStructureList(importData.structure)); 
				if (importData.structure)
					importedFields.custrecord_etc_transaction_structures = true;
				
				if (existingDeal) {
					var dpSource = REC.getValue("custrecord_dp_source");
					
					if (dpSource.length == 0) 
						REC.setValue("custrecord_dp_source", srsConstants.DPS_SOURCE.ENTERPRISE_CLIENT);
					else {
						var tmp = [];
						for (var i = 0; i < dpSource.length; i++)
							tmp.push(dpSource[i]); 
						tmp.push(srsConstants.DPS_SOURCE.ENTERPRISE_CLIENT); 
						REC.setValue("custrecord_dp_source", tmp);						
					}
				} else
					REC.setValue("custrecord_dp_source", srsConstants.DPS_SOURCE.ENTERPRISE_CLIENT); 
				
				// 2018.12.11 - this field has been moved to the DPS Enterprise Client record
				// REC.setText("custrecord_en_lw_client_role", getLWClientRoleList(importData.lathamrole)); 
				// importedFields.custrecord_en_lw_client_role = true;
				
				// for (var i = 0; i < clientRoleList.length; i++) {
					lineNbr = 0; 
					
					// log.debug(funcName, "Setting row " + i + " to role '" + clientRoleList[i] + "'"); 
					REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_enterprise_client", line: lineNbr, value: clientId});
										
//					this field will probably go away; for now, set it to the first value
					REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_role", line: lineNbr, value: clientRoleList[0]});
					
					for (var i = 0; i < clientRoleList.length; i++) {
						log.debug(funcName, "role=" + clientRoleList[i]); 
						var roleName = getClientRoleName(clientRoleList[i]).toLowerCase(); 
						if (roleName.indexOf("acquirer") >= 0)
							REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_buyer", line: lineNbr, value: true});
						else
							REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_seller", line: lineNbr, value: true});						
						
					}
					
					REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_client_deal_id", line: lineNbr, value: importData.lwdealid});
					if (importData.sponsorid != "N/A")
						REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_sponsor_id", line: lineNbr, value: importData.sponsorid});					
					REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_opposing_counsel", line: lineNbr, value: backfillOpposingCounsel(importData.opposingcounsel, clientShortCode, clientId)});					 
					REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_client_role", line: lineNbr, value: backfillClientRole(importData.lathamrole)});


					
					// ATP-2056 >>>
					if (clientFields.custrecord_ec_deal_url_capture_method && clientFields.custrecord_ec_deal_url_capture_method.length > 0 && clientFields.custrecord_ec_deal_url_capture_method[0].value == CAPTURE_METHOD.PROVIDED)
						if (importData.dealurl)
							REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_deal_url", line: lineNbr, value: importData.dealurl});

					
					if (clientFields.custrecord_ec_deal_url_capture_method && clientFields.custrecord_ec_deal_url_capture_method.length > 0 && clientFields.custrecord_ec_deal_url_capture_method[0].value == CAPTURE_METHOD.DERIVED)
						if (clientFields.custrecord_ec_general_deal_url)
							REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_deal_url", line: lineNbr, value: clientFields.custrecord_ec_general_deal_url.replace("{dealid}",importData.lwdealid)});
					
					

					// if we have an office, deal with that
					if (importData.offices) 
						REC.setSublistValue({sublistId: "recmachcustrecord_dpsec_dps", fieldId: "custrecord_dpsec_office_location", line: lineNbr, value: findOffices(importData.lwdealid, importData.offices)});
					// ATP-2056 <<<

					
				// }
				
				if (importData.targetindustry) {
					var industryMapping = getIndustryMapping(importData.targetindustry);
					
					log.debug(funcName, "Targtet Industry Mapping: " + JSON.stringify(industryMapping)); 
					
					if (industryMapping) {
						// REC.setText("custrecord_etc_seller_industry", industryMapping.industry);
						// REC.setText("custrecord_etc_seller_sub_industry", industryMapping.subindustry);						
						REC.setValue("custrecord_etc_seller_industry", getIndustryId(industryMapping.industry));
						REC.setValue("custrecord_etc_seller_sub_industry", getIndustryId(industryMapping.subindustry));
					}
					
					log.debug(funcName, "Target Industry now: " + REC.getValue("custrecord_etc_seller_industry") + "|" + REC.getValue("custrecord_etc_seller_sub_industry"))
				} 

				if (importData.buyerindustry) {
					var industryMapping = getIndustryMapping(importData.buyerindustry);
					
					log.debug(funcName, "Buyer Industry Mapping: " + JSON.stringify(industryMapping)); 

					if (industryMapping) {
						// REC.setText("custrecord_etc_buyer_industry", industryMapping.industry); 
						// REC.setText("custrecord_etc_buyer_sub_industry", industryMapping.subindustry);		
						REC.setValue("custrecord_etc_buyer_industry", getIndustryId(industryMapping.industry));
						REC.setValue("custrecord_etc_buyer_sub_industry", getIndustryId(industryMapping.subindustry));						
					}
					
					log.debug(funcName, "Buyer Industry now: " + REC.getValue("custrecord_etc_buyer_industry") + "|" + REC.getValue("custrecord_etc_buyer_sub_industry"))

				} 
				
				
//				if (importData.sponsorid) {
//					REC.setValue("custrecord_en_lw_sponsor_id", importData.sponsorid); 
//					importedFields.custrecord_en_lw_sponsor_id = true;
//				}
				
				
				REC.setValue("custrecord_dp_imported_fields", JSON.stringify(importedFields)); 
				
				// this migth be just for client code ML
				if (importData.debtfinancing) 
					REC.setText("custrecord_dps_debt_financing", importData.debtfinancing);
				if (importData.crossborder) 
					REC.setText("custrecord_dps_cross_border", importData.crossborder);					
				
				
				var dpsId = REC.save(); 
				log.audit(funcName, "Deal Point Study created or updated.  ID=" + dpsId);

				if (importData.targetindustry) {
					var N = record.create({type: record.Type.NOTE}); 
					N.setValue("note", "LW Target Industry Classification was '" + importData.targetindustry + "'"); 
					N.setValue("title", "LW Target Industry Classification"); 
					N.setValue("recordtype",  priLibrary.getCustomRecordTypeInternalId("customrecord_deal_points_study")); 
					N.setValue("record", dpsId); 
					N.save(); 
					log.debug(funcName, "Target Industry User Note Created");
				}

				if (importData.buyerindustry) {
					var N = record.create({type: record.Type.NOTE}); 
					N.setValue("note", "LW Buyer Industry Classification was '" + importData.buyerindustry + "'"); 
					N.setValue("title", "LW Buyer Industry Classification"); 
					N.setValue("recordtype",  priLibrary.getCustomRecordTypeInternalId("customrecord_deal_points_study")); 
					N.setValue("record", dpsId); 
					N.save(); 
					log.debug(funcName, "Buyer Industry User Note Created");
				}
				
				log.debug(funcName, "About to attach files..."); 
				
				attachFiles(appSettings.readAppSetting(APP_NAME, clientShortCode+"-File Name Pattern"), appSettings.readAppSetting(APP_NAME, clientShortCode+"-Import File Folder"), appSettings.readAppSetting(APP_NAME, clientShortCode+"-Import File Archive Folder"), importData.lwdealid, custId); 
				

				return {status: STATUS_PROCESSED, recordId: dpsId, message: ""};
				
				
			} catch (e) {
				log.error(funcName, e);
				if (e.message)
					throw e.message; 
				else
					throw JSON.stringify(e); 
			}
			
			
		}
				
    	/* ======================================================================================================================================== */

		function sendProblemEmail(emailSubject, emailBody) {
			email.send({		        				
                'author'    : EMAIL_SENDER, 
                'recipients': PROBLEM_EMAIL_RECIPIENT,  
                'subject'   : emailSubject,  
                'body'      : emailBody
                });
		}
		
		
		function customerExists(customerName) {
			var ss = search.create({
				type:			"customer",
				filters:		[
				        		 	["entityid",search.Operator.IS,customerName]
				        		 ]
			}).run().getRange(0,1); 
			
			if (ss.length > 0)
				return ss[0].id; 
		}
		
		
		
		
		function attachFiles(fileNamePattern, sourceFolderId, targetFolderId, dealId, custId, countOnly) {
			
			var funcName = scriptName + "attachFiles " + dealId; 
			
			var fileSearch = search.create({
				type: 			"file",
				filters: 		[
				         		 	["folder",search.Operator.IS,[sourceFolderId]]
				         		 ],
				columns: 		["name","folder"]
			}); 
			
			var fileSearch = priLibrary.searchAllRecords(fileSearch); 
			
			// log.debug(funcName, "  - found " + fileSearch.length + " file(s)");
			
			fileNamePattern = fileNamePattern.replace("{dealid}",dealId);
			
			var docTypePattern = appSettings.readAppSetting(APP_NAME, clientShortCode+"-File Name Document Type Pattern"); 
			var docTypeMap = JSON.parse(appSettings.readAppSetting(APP_NAME, clientShortCode+"-Document Type Map")); 
			
			var rx = new RegExp(fileNamePattern); 
			
			// log.debug(funcName, "Looking for files with this pattern: " + fileNamePattern); 

			var fileCount = 0; 
			
			for (var i = 0; i < fileSearch.length; i++) {
				
				var fileInfo = fileSearch[i]; 
			
				// log.debug(funcName, "Looking at file " + JSON.stringify(fileInfo)); 
				
				var fileName = fileInfo.getValue("name"); 
				
				if (rx.test(fileName)) {
					log.debug(funcName, "Selecting file " + fileName); 
					
				
					if (!countOnly)
						createDocument(custId, fileInfo.id, fileInfo.getValue("name"), docTypePattern, docTypeMap, targetFolderId, dealId);
					
					fileCount++;
				} 
				
			} 
				
			return fileCount;
			
		}

    	/* ======================================================================================================================================== */

		// creates a custom "Document" record; attaches it to the Customer, and moves it to the target folder
		
		function createDocument(custId, fileId, fileName, docTypePattern, docTypeMap, targetFolderId, dealId) {
		
			var funcName = scriptName + "createDocument " + dealId + " | " + fileName; 
			
			var DOC = record.create({type: "customrecord_document_management"}); 
			
			var rx = new RegExp(docTypePattern);
			if (!rx.test(fileName))
				throw "Unable to determine file type from file name: " + fileName + " using pattern " + docTypePattern; 

			var docType = fileName.match(rx);
			
			log.debug(funcName, "Map=" + docType[1]);
			
			DOC.setValue("altname", fileName); 
			
			docType = docType[1]; 
			if (docTypeMap[docType])
				DOC.setText("custrecord_doc_type", docTypeMap[docType]); 
			else
				DOC.setText("custrecord_doc_type", docTypeMap["*"]); 
							
			DOC.setValue("custrecord_escrow_customer", custId); 
			DOC.setValue("custrecord_file", fileId); 
			DOC.setValue("custrecord_dm_status", DOCUMENT_STATUS_DRAFT); 			
			
			var docId = DOC.save();
			
			log.debug(funcName, "Document Record " + docId + " created and linked to customer " + custId); 
			
			var F = file.load(fileId);
			
			if (F.folder != targetFolderId) {
				F.folder = targetFolderId; 
				F.save(); 
				log.debug(funcName, "File " + fileName + " moved to folder " + targetFolderId); 
			} 

		}
		

    	/* ======================================================================================================================================== */

		function getIndustryId(industryName) {
			if (industryName) {
				var ss = search.create({
					type:		"customrecord_industries",
					filters:	[
					        	 	["isinactive",search.Operator.IS,false]
					        	 	,"AND",["name",search.Operator.IS,industryName]
					        	 ]			
				}).run().getRange(0,1);
				
				if (ss.length > 0)
					return ss[0].id;				
			}
		}

    	/* ======================================================================================================================================== */


		function getIndustryMapping(industryName) {

			if (industryName) 
				if (INDUSTRY_TRANSLATION[industryName.toLowerCase()])
					return INDUSTRY_TRANSLATION[industryName.toLowerCase()];
//				else 
//					return {industry: null, subIndustry: null}; 			
		}

		
    	/* ======================================================================================================================================== */
		
		function findEnterpriseClientId(shortCode) {
			// the filename is supposed to start with a 2-character prefix that matches the 'short code' of the Enterprise Client
			
			// log.debug("findEnterpriseClient","Looking for code " + shortCode); 
			
			var ss = search.create({
				type: 		"customrecord_enterprise_client",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_ec_short_code",search.Operator.IS,shortCode]
				        	 ],
			}).run().getRange(0,1); 
			
			if (ss.length > 0)
				return ss[0].id; 
		}
				
    	/* ======================================================================================================================================== */
		
		function getClientRoleList(roleData, clientRoleMapping, dealId) {
			
			var funcName = scriptName + "getClientRoleList " + dealId; 
			
			log.debug(funcName, roleData);
			
			var roleSearch = search.create({
				type:		"customlist_dps_ent_client_role",
				columns: 	["name"]
			}).run().getRange(0,1000); 
			
			
			if (roleData) {
				var roleList = roleData.split(/[;]/); 
				var roleArray = [];
				for (var i = 0; i < roleList.length; i++) {
					
					if (roleList[i]) {
						var roleName = clientRoleMapping[roleList[i].trim()]; 
				
						log.debug(funcName, "Role " + roleList[i].trim() + " maps to " + roleName);
						log.debug(funcName, "role=" + roleList[i]); 
						
						if (!roleName)
							throw "Unexpected Value in 'Role' field (based on Mapping Setting): " + roleList[i] + "|" + roleList[i].toLowerCase() + "|"; 
						else {
							var roleFound = false; 
							for (j = 0; j < roleSearch.length; j++)
								if (roleSearch[j].getValue("name") == roleName) {
									roleFound = true; 
									if (roleArray.indexOf(roleSearch[j].id) < 0)
										roleArray.push(roleSearch[j].id);									
								}
							
							if (!roleFound)
								throw "'Role' role " + roleList[i] + " mapped to " + roleName + " -- but value not found in DPS Enterprise Client Role list.";  
								
						}
					}
				}
				
				return roleArray; 
			} else
				return "";				
		}
		
		

		function getLWClientRoleList(roleData) {
			
			var funcName = scriptName + "getLWClientRoleList"; 
			
			log.debug(funcName, roleData);
			
			if (roleData) {
				var roleList = roleData.split(/[;]/); 
				var roleArray = [];
				for (var i = 0; i < roleList.length; i++) {					
					if (roleList[i]) 
						roleArray.push(roleList[i].trim()); 
				}
		
				log.debug(funcName, roleArray); 
				
				return roleArray; 
			}				
		}
		
    	/* ======================================================================================================================================== */

		function getStructureList(structureData) {
			var funcName = scriptName + "getStructureList"; 
			
			log.debug(funcName, structureData);
			
			if (structureData) {
				
				var ss = search.create({
					type:		"customlist_merger_asset_stock_purchase",
					columns: 	["name"]
				}).run().getRange(0,1000); 
								
				
				var structureList = structureData.toLowerCase().split(/[;]/); 
				var structureArray = [];
				for (var i = 0; i < structureList.length; i++) {
					
					var structureName = structureList[i].trim();
					
					if (structureName) {
						if (structureName == "apa" || structureName == "asset purchase")
							structureName = "Asset";
						
						if (structureName == "spa" || structureName == "stock")
							structureName = "Stock Purchase";
						

						for (var j = 0; j < ss.length; j++)
							if (ss[j].getValue("name").toLowerCase() == structureName) {
								var id = ss[j].id;
								if (structureArray.indexOf(id) < 0)
									structureArray.push(id);
								break; 
							}

						/*
						var id = 0;
						if (structureList[i].trim() == "apa" || structureList[i].trim() == "asset purchase" || structureList[i].trim() == "asset")
							id = 2;
						if (structureList[i].trim() == "spa" || structureList[i].trim() == "stock purchase" || structureList[i].trim() == "stock")
							id = 3;					
						if (structureList[i].trim() == "merger")
							id = 1;
						
						if (id == 0) 
							throw "Unexpected Value in 'Structure' field: " + structureList[i];  
						else 
							if (structureArray.indexOf(id) < 0)
								structureArray.push(id);
						*/
					}
				}
				
				return structureArray; 
			} else
				return "";				
		}
		
    	/* ======================================================================================================================================== */
		
		function findOffices(dealId, officeNames) {

			var funcName = scriptName + "findOffices " + dealId;
			
			var officeList = [];
			var returnedList = [];
			
			log.debug(funcName, "Looking for Offices: " + officeNames); 
			
			if (!officeNames)
				return [];
			
			var ss = search.create({
				type:		"customrecord_dps_office_location",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 ],
				columns:	["name"]			
			}).run().each(function (result) {
				officeList.push({id: result.id, name: result.getValue("name")}); 
				return true;
			});
			
			var newList = officeNames.split(/[;]+/);
			
			for (var i = 0; i < newList.length; i++) {
				if (newList[i]) {					
					
					var officeName = newList[i].trim();   
					
					var idx = -1
					
					for (var j = 0; j < officeList.length; j++) 
						if (officeList[j].name == officeName) {
							idx = j;
							break; 
						}
					
					if (idx >= 0)
						returnedList.push(officeList[idx].id); 
					else 
						throw "Office '" + officeName + "' not does not exist.";
				}
			}

			log.debug(funcName, "Office List: " + JSON.stringify(returnedList));
			return returnedList; 
		}
			
			
			/*
			
			var ss = search.create({
				type:		"customrecord_dps_office_location",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["name",search.Operator.IS,officeName]
				        	 ]
			}).run().getRange(0,1);
			
			if (ss.length > 0)
				return [ss[0].id];
			else
				throw "Unable to find office with name '" + officeName + "'";
				*/
			
		

    	/* ======================================================================================================================================== */

		function backfillClientRole(newRoleList) {
			
			var funcName = scriptName + "backfillClientRole";
			
			log.debug(funcName, newRoleList); 
			
			var roleList = [];
			
			var ss = search.create({
				type:		"customlist_dps_client_role",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 ],
				columns:	["name"]
			}).run().each(function (result) {
				roleList.push({id: result.id, name: result.getValue("name")}); 
				return true;
			});
			
			var newList = newRoleList.split(/[;]+/);
			
			log.debug(funcName, newList); 
			
			var returnedList = [];
			
			for (var i = 0; i < newList.length; i++) {
				if (newList[i]) {					
					
					var roleName = newList[i].trim();   
					
					var idx = -1
					
					for (var j = 0; j < roleList.length; j++) 
						if (roleList[j].name == roleName) {
							idx = j;
							break; 
						}
					
					if (idx >= 0)
						returnedList.push(roleList[idx].id); 
					else {
						log.debug(funcName, "Creating Client Role " + roleName); 
						var L = record.create({type: "customlist_dps_client_role"});
						L.setValue("name", roleName); 
						returnedList.push(L.save());
					}
				}
			}

			log.debug(funcName, "New List: " + JSON.stringify(returnedList));
			return returnedList; 

			
		}
		
		
		function getClientRoleName(clientId) {
			// var clientRoleName = search.lookupFields({type: "customlist_dps_client_role", id: clientId, columns: ["name"]}).name;
			var clientRoleName = search.lookupFields({type: "customlist_dps_ent_client_role", id: clientId, columns: ["name"]}).name;
			
			
			log.debug("getClientRoleName","clientId=" + clientId + "; name=" + clientRoleName);
			return clientRoleName;
		}
		

		function backfillOpposingCounsel(newCounselList, clientPrefix, clientId) {
			if (clientPrefix == "LW") 
				return backfillOpposingCounselNumeric(newCounselList, clientPrefix, clientId);
			else
				return backfillOpposingCounselName(newCounselList, clientPrefix, clientId);
		}
		
		
		function backfillOpposingCounselName(newCounselList, clientPrefix, clientId) {			
			// in this function, the opposing counsel field is a single name 
			var funcName = scriptName + "backfillOpposingCounselName";
			
			log.debug(funcName, newCounselList); 
			
			var counselList = [];
			var returnedList = [];
			
			
			var ss = search.create({
				type:		"customrecord_dps_opposing_counsel",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["name",search.Operator.IS,newCounselList]
				        	 	,"AND",["custrecord_oc_enterprise",search.Operator.ANYOF,clientId]
				        	 ]
			}).run().getRange(0,1);
			
			if (ss.length > 0)
				returnedList.push(ss[0].id);
			else {
				// need to add it, then return it;
				var L = record.create({type: "customrecord_dps_opposing_counsel"});
				L.setValue("name", newCounselList); 
				L.setValue("custrecord_oc_enterprise", clientId);
				returnedList.push(L.save());				
			}
			
			return returnedList; 
		}
		
		
		function backfillOpposingCounselNumeric(newCounselList, clientPrefix, clientId) {
			// in this function, the opposing counsel field is a list of numbers 
			
			var funcName = scriptName + "backfillOpposingCounselNumeric";
			
			log.debug(funcName, newCounselList); 
			
			var counselList = [];
			
			var ss = search.create({
				type:		"customrecord_dps_opposing_counsel",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_oc_enterprise",search.Operator.ANYOF,[clientId]]
				        	 ],
				columns:	["name"]
			}).run().each(function (result) {
				// counselList.push(result.getValue("name")); 		
				counselList.push({id: result.id, name: result.getValue("name")}); 
				return true;
			});
			
			// log.debug(funcName, "Found " + counselList.length + " existing counselors: " + JSON.stringify(counselList));
			
			var newList = newCounselList.split(/[\D]+/);
			
			var returnedList = [];
			
			for (var i = 0; i < newList.length; i++) {
				if (newList[i] && !isNaN(newList[i])) {
					
					var counselId = newList[i];
					var counselIdWithPrefix = clientPrefix ? clientPrefix + "_" + newList[i] : newList[i]; 
					
					// log.debug(funcName, "Looking for counselor [" + newList[i] + "]");
					var idx = -1;
					
					for (var j = 0; j < counselList.length; j++) 
						if (counselList[j].name == counselId || counselList[j].name == counselIdWithPrefix) {
							idx = j;
							break; 
						}
					
					if (idx >= 0)
						returnedList.push(counselList[idx].id); 
					else {
						log.debug(funcName, "Creating Opposing Counsel " + counselId); 
						var L = record.create({type: "customrecord_dps_opposing_counsel"});
						L.setValue("name", counselId); 
						L.setValue("custrecord_oc_enterprise", clientId);
						returnedList.push(L.save());
					}
				}
			}

			// log.debug(funcName, "New List: " + JSON.stringify(returnedList));
			return returnedList; 
		}

    	/* ======================================================================================================================================== */

		
    return {
        createRecord:	createRecord
    }
});