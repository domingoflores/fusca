/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record' ,'N/search' ,'N/runtime' 
	   ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	   ,'/SuiteScripts/Pristine/libraries/searchLibrary.js'
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ],

	/**
	 * -----------------------------------------------------------
	 * VIPCheck.js
	 * ___________________________________________________________
	 * Module checks 4 email addresses associated with a Case
	 * against a list of VIP email addresses and domains
	 * stored in the VIP Listing custom record type.
	 * If a match is found the matched VIP row is linked to the Case
	 * by populating the VIP Table field on the Case.
	 * Conversely, if no match is found the VIP Table field is cleared. 
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * ATP-152 Ken 2018-05-04 Making VIP search return > 1000 rows
	 * ___________________________________________________________
	 */

	function(record, search ,runtime ,srsConstants ,searchLibrary ,appSettings) {

	var scriptFileName = "VIPCheck.js";

	
	/*========================================================================================================================================*/
    /*========================================================================================================================================*/
    function beforeLoad(context) {
    	
    	var scriptFunctionName = "beforeLoad";
    	var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
//    	log.debug(scriptFullName, "========================================================================");
//    	log.debug(scriptFullName, "========================================================================");
//    	log.debug(scriptFullName, "UserEventType: " + context.type);

    	// ATP-635
		if ( runtime.executionContext == 'USERINTERFACE' ) { 
			var objButtonFormList = JSON.parse( appSettings.readAppSetting("Case", "New Deal Action Resolution Button") );            		
	    	//log.debug(scriptFullName, "objButtonFormList: " + JSON.stringify(objButtonFormList) );
	    	
            if (context.type == context.UserEventType.VIEW) {
            	var rcdCase = record.load({type:"supportcase" ,id:context.newRecord.id});
            	var caseFormId = rcdCase.getValue("customform");
            
    	    	//log.debug(scriptFullName, "currentFormId: " + caseFormId );
                var addButton = false;
                for (i=0; i<objButtonFormList.length; i++) { if (objButtonFormList[i].formId == caseFormId) { addButton = true; } }
                if (addButton) {
                	var dealId = context.newRecord.getValue("custevent1");
        	    	var linkURL = "/app/common/custom/custrecordentry.nl?rectype=98&record.custrecord_deal2=" + dealId + "&record.custrecord_da_department=" + srsConstants.PROJECT_TASK_MGMT_DEPT.CLAIMS_60 + "&record.custrecord_claim_case=" + context.newRecord.id;
        	        var setWindow = "window.location = '" + linkURL + "','New Deal Action (Claim-PPA-Earnout)','';";
        			context.form.addButton({ id:'custpage_new_deal_action_ppa' ,label:'Create Deal Action' ,functionName:setWindow });
                }
            }
		}
		//End ATP-635
    	
    	
    	return;
    } // beforeLoad(context)
	
	
	//======================================================================================================================================
	//======================================================================================================================================
		function beforeSubmit(context) {
			'use strict';
			var eventType = context.type;
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'eventType: ' + eventType
			});
			//Check the Event Type - only Edit, Create, Copy
			var oldCaseRec = '';
			var newCaseRec = '';
			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
					newCaseRec = context.newRecord; // Get the Case record which has just been saved clientside.
					break;
				case context.UserEventType.XEDIT:
					newCaseRec = context.newRecord; // Get the Case record which has just been saved clientside.
					oldCaseRec = context.oldRecord; //For Xedit only updated fields are in new rec - all fields in oldrec 
					break;
				default:
					return;
			}
			if (eventType === 'xedit')
				log.debug({
					title: 'Function beforeSubmit:',
					details: 'newCaseRec: ' + JSON.stringify(newCaseRec)
				});

			//Get the email addresses you want to check
			// 4 of them in this order:
			//  1)email
			//  2)company.email
			//  3)contact.email
			//  4)inboundemail

			var caseNumber = newCaseRec.getValue('casenumber');
			if (eventType === 'xedit') {
				caseNumber = oldCaseRec.getValue('casenumber');
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'caseNumber: ' + caseNumber
			});

			//Save each email in an array
			var emailsToCheck = [];

			// 	1) email address

			var email = newCaseRec.getValue('email');
			if (eventType === 'xedit') {
				var newCaseRecJSON = JSON.stringify(newCaseRec);
				var z = newCaseRecJSON.search('"email":');
				if (z === -1) { //Email field has not been changed in xedit - get value from old rec
					email = oldCaseRec.getValue('email');
				} else {
					if (!email) {
						//User blanked out email using inline edit - but some script seems to replace the old email
						//so let us assume this cannot be done and that the change never occurred.
						//So let us use the old email
						email = oldCaseRec.getValue('email');
					}
				}
			}
			if (email)
				emailsToCheck.push({
					email: email
				});

			//  2)company.email
			var companyID = newCaseRec.getValue('company');
			if (eventType === 'xedit') {
				companyID = oldCaseRec.getValue('company');
			}
			// log.debug({
			// 	title: 'Function beforeSubmit:',
			// 	details: 'companyID: ' + companyID
			// });
			var companyEmail = '';
			if (companyID) {
				var companyList = getCompany(companyID);
				var companyCount = companyList.length;
				// log.debug({
				// 	title: 'Function beforeSubmit:',
				// 	details: 'companyCount: ' + companyCount
				// });
				if (companyCount > 0)
					companyEmail = companyList[0].getValue({
						name: 'email'
					});
			}
			if (companyEmail)
				emailsToCheck.push({
					email: companyEmail
				});

			//  3)contact.email
			var contactID = newCaseRec.getValue('contact');
			if (eventType === 'xedit') {
				contactID = oldCaseRec.getValue('contact');
			}
			// log.debug({
			// 	title: 'Function beforeSubmit:',
			// 	details: 'contactID: ' + contactID
			// });
			var contactEmail = '';
			if (contactID) {
				var contactList = getContact(contactID);
				var contactCount = contactList.length;
				// log.debug({
				// 	title: 'Function beforeSubmit:',
				// 	details: 'contactCount: ' + contactCount
				// });

				if (contactCount > 0)
					contactEmail = contactList[0].getValue({
						name: 'email'
					});
			}
			if (contactEmail)
				emailsToCheck.push({
					email: contactEmail
				});

			//  4)inboundemail			
			var inboundEmail = newCaseRec.getValue('inboundemail');
			if (eventType === 'xedit') {
				inboundEmail = oldCaseRec.getValue('inboundemail');
			}

			if (inboundEmail)
				emailsToCheck.push({
					email: inboundEmail
				});

			//Read the VIP Listing table
			var VIPList = getVIPList();
			var VIPCount = VIPList.length;

			//Loop through the VIP list 
			var VIPEmail = '';
			var VIPID = '';
			var match = false;
			var emailToCheck = '';
			var n = -1;
			var b = 0;
			//Loop through emails to check
			for (var y = 0; y < emailsToCheck.length; y++) {
				emailToCheck = emailsToCheck[y].email.toLowerCase();
				log.debug({
					title: 'Function beforeSubmit:',
					details: 'emailToCheck: ' + emailToCheck
				});
				for (b = 0; b < VIPCount; b++) {
					VIPEmail = VIPList[b].getValue({
						name: 'custrecord_vip_domain_ref'
					}).toLowerCase();
					n = emailToCheck.search(VIPEmail);

					if (n > -1) { //case appears to be associated with a VIP email
						match = true;
						break;
					}
				}
				if (match)
					break;
			}

			try {
				if (match) {
					VIPID = VIPList[b].getValue({
						name: 'internalid'
					});
					newCaseRec.setValue('custevent_vip', VIPID);
					log.debug({
						title: 'Function beforeSubmit:',
						details: 'match: ' + VIPID + '---' + VIPEmail
					});
				} else {
					newCaseRec.setValue('custevent_vip', '');
				}
			} catch (e) {
				log.error('ERROR UPDATING CASE', e.message);
				var error = {
					title: 'ERROR UPDATING CASE:',
					message: e.message,
					func: 'beforeSubmit',
					extra: 'VIPID: ' + VIPID
				};
				handleError(error);
			}

			function getVIPList() {
				var VIPSearch = search.create({
					type: 'customrecord_vip', //VIP List
					title: 'VIP List',
					columns: [{
						name: 'custrecord_vip_domain_ref' //This is the domain (or email address) of a VIP company or individual
					}, {
						name: 'internalid'
					}],
					filters: [{
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();
				// var searchResults = VIPSearch.getRange(0, 1000); //ATP-152 Ken 2018-05-04 Making VIP search return > 1000 rows
				var searchResults = searchLibrary.getSearchResultData(VIPSearch); //ATP-152 Ken 2018-05-04 Making VIP search return > 1000 rows
				return searchResults;
			}

			function getCompany(companyID) {
				var companySearch = search.create({
					type: 'entity', //Company
					title: 'Company List',
					columns: [{
						name: 'email'
					}],
					filters: [{
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}, {
						name: 'internalid',
						operator: search.Operator.IS,
						values: companyID
					}]
				}).run();
				var searchResults = companySearch.getRange(0, 100);

				return searchResults;
			}

			function getContact(contactID) {
				var contactSearch = search.create({
					type: 'entity', //Contact
					title: 'Contact List',
					columns: [{
						name: 'email'
					}],
					filters: [{
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}, {
						name: 'internalid',
						operator: search.Operator.IS,
						values: contactID
					}]
				}).run();
				var searchResults = contactSearch.getRange(0, 100);

				return searchResults;
			}
			/**
			 * Takes a Search.ResultSet object and grabs all the results
			 * by cycling through using getRange()
			 * @param  {Object} resultSet The results of a NetSuite saved search 
			 * (Search.ResultSet object)
			 */
			// function getSearchResultData(resultSet) {
			// 	var all = [],
			// 		results = [],
			// 		batchSize = 1000,
			// 		startIndex = 0,
			// 		endIndex = batchSize;

			// 	do {
			// 		results = resultSet.getRange({
			// 			start: startIndex,
			// 			end: endIndex
			// 		});
			// 		all = all.concat(results);
			// 		startIndex += batchSize;
			// 		endIndex += batchSize;
			// 	} while (results.length == batchSize);
			// 	return all;
			// }
		}

		return {
			    beforeLoad: beforeLoad
		     ,beforeSubmit: beforeSubmit
		};
	});