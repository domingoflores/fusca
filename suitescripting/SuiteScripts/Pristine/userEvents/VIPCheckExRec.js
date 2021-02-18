/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', '/SuiteScripts/Pristine/libraries/searchLibrary.js'],

	/**
	 * -----------------------------------------------------------
	 * VIPCheckExRec.js
	 * ___________________________________________________________
	 * Module checks email addresses associated with an Exchange Record
	 * against a list of VIP email addresses and domains
	 * stored in the VIP Listing custom record type.
	 * If a match is found the matched VIP row is linked to the Exchange Record
	 * by populating the VIP Table field on the Exchange Record.
	 * Conversely, if no match is found the VIP Table field is cleared. 
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * ATP-152 Ken 2018-05-04 Making VIP search return > 1000 rows
	 * ___________________________________________________________
	 */

	function(record, search, searchLibrary) {

		function beforeSubmit(context) {
			'use strict';

			var newExRecJSON = null;
			var z = -1;
			var VIPEmail = null;
			var VIPID = '';

			var eventType = context.type;
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'eventType: ' + eventType
			});

			//Check the Event Type - only Edit, Create, Copy
			var oldExRec = '';
			var newExRec = '';
			var exRecID = '';
			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
					newExRec = context.newRecord; // Get the Exchange Record record which has just been saved clientside.
					exRecID = newExRec.getValue('id');
					break;
				case context.UserEventType.XEDIT:
					newExRec = context.newRecord; // Get the Exchange Record record which has just been saved clientside.
					oldExRec = context.oldRecord; //For Xedit only updated fields are in new rec - all fields in oldrec 
					exRecID = oldExRec.getValue('id');
					newExRecJSON = JSON.stringify(newExRec);
					log.debug({
						title: 'Function beforeSubmit:',
						details: 'newExRec: ' + newExRecJSON
					});
					break;
				default:
					return;
			}

			//Read the VIP Listing table
			var VIPList = getVIPList();
			var VIPCount = VIPList.length;

			//Get the email addresses you want to check
			//in this order:
			//  1)DE1Email
			//  2)DE0Email
			//  3)contact.email
			//  4)customer.email
			//  5)Tax Form Signature email
			//  6)LOT Signature Email  

			log.debug({
				title: 'Function beforeSubmit:',
				details: 'exRecID: ' + exRecID
			});

			// 	1) DE1 email address

			var DE1Email = newExRec.getValue('custrecord_acq_loth_1_de1_shrhldemail');
			if (eventType === 'xedit') {
				z = newExRecJSON.search('"custrecord_acq_loth_1_de1_shrhldemail":');
				if (z === -1) { //Email field has not been changed in xedit - get value from old rec
					DE1Email = oldExRec.getValue('custrecord_acq_loth_1_de1_shrhldemail');
				}
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'DE1Email: ' + JSON.stringify(DE1Email)
			});
			if (DE1Email) {
				VIPID = getVIPID(DE1Email, VIPList);
				if (VIPID) {
					log.debug({
						title: 'DE1Email VIP found:',
						details: 'VIPID: ' + VIPID
					});
					updateExRec(VIPID);
					return;
				} else {
					log.debug({
						title: 'DE1Email VIP NOT found:',
						details: 'VIPID: ' + VIPID
					});
				}
			}

			// 	2) DE0 email address

			var DE0Email = newExRec.getValue('custrecord_acq_loth_1_src_shrhldemail');
			if (eventType === 'xedit') {
				z = -1;
				z = newExRecJSON.search('"custrecord_acq_loth_1_src_shrhldemail":');
				if (z === -1) { //Email field has not been changed in xedit - get value from old rec
					DE0Email = oldExRec.getValue('custrecord_acq_loth_1_src_shrhldemail');
				}
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'DE0Email: ' + JSON.stringify(DE0Email)
			});
			if (DE0Email) {
				VIPID = getVIPID(DE0Email, VIPList);
				if (VIPID) {
					log.debug({
						title: 'DE0Email VIP found:',
						details: 'VIPID: ' + VIPID
					});
					updateExRec(VIPID);
					return;
				} else {
					log.debug({
						title: 'DE0Email VIP NOT found:',
						details: 'VIPID: ' + VIPID
					});
				}
			}
			//  3)contact.email
			var contactID = newExRec.getValue('custrecord_acq_loth_zzz_zzz_contact');
			if (eventType === 'xedit') {
				z = -1;
				z = newExRecJSON.search('"custrecord_acq_loth_zzz_zzz_contact":');
				if (z === -1) { //Contact field has not been changed in xedit - get value from old rec
					contactID = oldExRec.getValue('custrecord_acq_loth_zzz_zzz_contact');
				}
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'contactID: ' + contactID
			});
			var contactEmail = '';
			if (contactID) {
				var contactList = getContact(contactID);
				var contactCount = contactList.length;

				if (contactCount > 0)
					contactEmail = contactList[0].getValue({
						name: 'email'
					});
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'contactEmail: ' + JSON.stringify(contactEmail)
			});
			if (contactEmail) {
				VIPID = getVIPID(contactEmail, VIPList);
				if (VIPID) {
					log.debug({
						title: 'contactEmail VIP found:',
						details: 'VIPID: ' + VIPID
					});
					updateExRec(VIPID);
					return;
				} else {
					log.debug({
						title: 'contactEmail VIP NOT found:',
						details: 'VIPID: ' + VIPID
					});
				}
			}
			//  4)Shareholder.email
			var shareholderID = newExRec.getValue('custrecord_acq_loth_zzz_zzz_shareholder');
			if (eventType === 'xedit') {
				z = -1;
				z = newExRecJSON.search('"custrecord_acq_loth_zzz_zzz_shareholder":');
				if (z === -1) { //Shareholder field has not been changed in xedit - get value from old rec
					shareholderID = oldExRec.getValue('custrecord_acq_loth_zzz_zzz_shareholder');
				}
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'shareholderID: ' + shareholderID
			});
			var shareholderEmail = '';
			if (shareholderID) {
				var shareholderList = getShareholder(shareholderID);
				log.debug({
					title: 'Function beforeSubmit:',
					details: 'shareholderList: ' + JSON.stringify(shareholderList)
				});
				var shareholderCount = shareholderList.length;

				if (shareholderCount > 0)
					shareholderEmail = shareholderList[0].getValue({
						name: 'email'
					});
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'shareholderEmail: ' + JSON.stringify(shareholderEmail)
			});
			if (shareholderEmail) {
				VIPID = getVIPID(shareholderEmail, VIPList);
				if (VIPID) {
					log.debug({
						title: 'shareholderEmail VIP found:',
						details: 'VIPID: ' + VIPID
					});
					updateExRec(VIPID);
					return;
				} else {
					log.debug({
						title: 'shareholderEmail VIP NOT found:',
						details: 'VIPID: ' + VIPID
					});
				}
			}
			//  5)Tax Form Signature email
			var taxFormSigEmail = newExRec.getValue('custrecord_acq_lot_taxform_sig_email');

			if (eventType === 'xedit') {
				z = -1;
				z = newExRecJSON.search('"custrecord_acq_lot_taxform_sig_email":');
				if (z === -1) { //Email field has not been changed in xedit - get value from old rec
					taxFormSigEmail = oldExRec.getValue('custrecord_acq_lot_taxform_sig_email');
				}
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'taxFormSigEmail: ' + taxFormSigEmail
			});

			if (taxFormSigEmail) {
				VIPID = getVIPID(taxFormSigEmail, VIPList);
				if (VIPID) {
					log.debug({
						title: 'taxFormSigEmail VIP found:',
						details: 'VIPID: ' + VIPID
					});
					updateExRec(VIPID);
					return;
				} else {
					log.debug({
						title: 'taxFormSigEmail VIP NOT found:',
						details: 'VIPID: ' + VIPID
					});
				}
			}
			//  6)LOT Signature email
			var LOTSigEmail = newExRec.getValue('custrecord_acq_lot_sig_email');
			if (eventType === 'xedit') {
				z = -1;
				z = newExRecJSON.search('"custrecord_acq_lot_sig_email":');
				if (z === -1) { //Email field has not been changed in xedit - get value from old rec
					LOTSigEmail = oldExRec.getValue('custrecord_acq_lot_sig_email');
				}
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'LOTSigEmail: ' + LOTSigEmail
			});

			if (LOTSigEmail) {
				VIPID = getVIPID(LOTSigEmail, VIPList);
				if (VIPID) {
					log.debug({
						title: 'LOTSigEmail VIP found:',
						details: 'VIPID: ' + VIPID
					});
				} else {
					log.debug({
						title: 'LOTSigEmail VIP NOT found:',
						details: 'VIPID: ' + VIPID
					});
				}
			}
			updateExRec(VIPID);

			function getVIPID(emailToCheck, VIPList) {
				emailToCheck = emailToCheck.toLowerCase(); 
				var VIPCount = VIPList.length;

				//Loop through the VIP list 
				var VIPEmail = '';
				var VIPID = '';
				var match = false;
				var n = -1;
				var b = 0;

				for (b = 0; b < VIPCount; b++) {

					VIPEmail = VIPList[b].getValue({
						name: 'custrecord_vip_domain_ref'
					}).toLowerCase();

					n = emailToCheck.search(VIPEmail);

					if (n > -1) { //Exhange Record appears to be associated with a VIP email
						match = true;
						break;
					}
				}
				if (match) {
					VIPID = VIPList[b].getValue({
						name: 'internalid'
					});
					return VIPID;
				} else
					return null;
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

			function getShareholder(shareholderID) {
				var shareholderSearch = search.create({
					type: 'customer', //Customer table - Shareholder 
					title: 'Shareholder List',
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
						values: shareholderID
					}]
				}).run();
				var searchResults = shareholderSearch.getRange(0, 100);

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

			function updateExRec(VIPID) {
				log.debug('updateExRec', 'VIPID: ' + VIPID);
				try {
					newExRec.setValue('custrecord_exrec_vip', VIPID);
				} catch (e) {
					log.error('ERROR UPDATING Exhange Record', e.message);
					var error = {
						title: 'ERROR UPDATING Exhange Record:',
						message: e.message,
						func: 'beforeSubmit',
						extra: 'VIPID: ' + VIPID
					};
					handleError(error);
				}
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
			beforeSubmit: beforeSubmit
		};
	});