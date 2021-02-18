/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'],

	/**
	 * -----------------------------------------------------------
	 * chDocPrefillDuplicateCheck.js
	 * ___________________________________________________________
	 * Module checks that a Key about to be used has not already been
	 * used within the context of a single Exchange Record connected 
	 * directly or indirectly to the Clearinghouse Document Prefill
	 * record being inspected.
	 * If the same Key is found, a system exception is thrown and the record 
	 * save is prevented.
	 * Also checks to ensure that a Prefill record is only linked to either 
	 * an Exchange Record or a Certificate but not both. 
	 * If linked to both, a system exception is thrown and the record 
	 * save is prevented.
	 * 
	 * Version 1.0
	 * Author: Ken Crossman
	 * ___________________________________________________________
	 */

	function(record, search) {

		function beforeSubmit(context) {
			'use strict';

			var z = null;
			var prefillID = null;
			var prefillKey = null;
			var prefillExRecID = null;
			var prefillCertID = null;
			var dupKeyPrefillID = null;
			var errorMsg = null;

			// Get the event type
			var eventType = context.type;
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'eventType: ' + eventType
			});
			//Only process the following Event Types: Edit, Create, Copy, Xedit
			var oldPrefillRec = '';
			var newPrefillRec = '';
			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
					newPrefillRec = context.newRecord; // Get the prefill record which has just been saved clientside.
					break;
				case context.UserEventType.XEDIT:
					newPrefillRec = context.newRecord; // Get the prefill record which has just been saved clientside.
					oldPrefillRec = context.oldRecord; //For Xedit only updated fields are in new rec - all fields in oldrec 
					break;
				default:
					return;
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'newPrefillRec: ' + JSON.stringify(newPrefillRec)
			});
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'oldPrefillRec: ' + JSON.stringify(oldPrefillRec)
			});
			var newPrefillRecJSON = JSON.stringify(newPrefillRec);

			// Get Prefill record id, Key and Exchange Record ID
			getPrefillFields();

			// If there is more than one of Exchange Record link and a Certificate link and a Document link then throw an error
			if ((prefillExRecID && prefillCertID) || (prefillExRecID && prefillDocID) || (prefillCertID && prefillDocID)) {
				errorMsg = 'Prefill record: ' + prefillID;
				errorMsg += ' cannot be linked to more than one of Exchange Record, Certificate or Document';
				throw errorMsg;
			}
			if (prefillCertID) { // Then we assume there cannot also be a direct exchange record link
				// Get the parent ex rec id
				prefillExRecID = getCertExRecParent(prefillCertID);
			}
			// Search for all prefill records linked to the Exchange Rec
			if (prefillExRecID) {
				// Search for all prefill records linked to the Exchange Rec directly
				searchDirectLinks();
				if (dupKeyPrefillID) { // If you find a matching Key then you're done
				} else {
					// Search for all prefill records linked to the Exchange Rec indirectly
					searchIndirectLinks();
				}
				// If there is a duplicate Key then throw an error
				if (dupKeyPrefillID) {
					errorMsg = 'Key "' + prefillKey + '" has already been used for Exchange Record: ' + prefillExRecID;
					errorMsg += ' in Prefill record: ' + dupKeyPrefillID;
					throw errorMsg;
				}
			}

			function getPrefillFields() {
				// Get the Clearinghouse Document Prefill record id
				prefillID = newPrefillRec.getValue('id');

				// Get the Clearinghouse Document Prefill record Key field value
				prefillKey = newPrefillRec.getValue('custrecord_cdp_key');
				// If this is an Xedit then you need to check if this field was changed or not
				if (eventType === 'xedit') {
					z = newPrefillRecJSON.search('"custrecord_cdp_key":');
					if (z === -1) { //Field has not been changed in xedit - get value from old rec
						prefillKey = oldPrefillRec.getValue('custrecord_cdp_key');
					}
				}
				
				// Get the Clearinghouse Document Prefill record Document ID
				prefillDocID = newPrefillRec.getValue('custrecord_cdp_document');
				if (eventType === 'xedit') {
					z = newPrefillRecJSON.search('"custrecord_cdp_document":');
					if (z === -1) { //Field has not been changed in xedit - get value from old rec
						prefillDocID = oldPrefillRec.getValue('custrecord_cdp_document');
					}
				}
				
				// Get the Clearinghouse Document Prefill record Exchange Record ID
				prefillExRecID = newPrefillRec.getValue('custrecord_cdp_exrec');
				if (eventType === 'xedit') {
					z = newPrefillRecJSON.search('"custrecord_cdp_exrec":');
					if (z === -1) { //Field has not been changed in xedit - get value from old rec
						prefillExRecID = oldPrefillRec.getValue('custrecord_cdp_exrec');
					}
				}
				

				// Get the Clearinghouse Document Prefill record Certificate ID
				prefillCertID = newPrefillRec.getValue('custrecord_cdp_cert');
				if (eventType === 'xedit') {
					z = newPrefillRecJSON.search('"custrecord_cdp_cert":');
					if (z === -1) { //Field has not been changed in xedit - get value from old rec
						prefillCertID = oldPrefillRec.getValue('custrecord_cdp_cert');
					}
				}
			}

			function searchDirectLinks() {
				directPrefillList = getdirectPrefillList(prefillExRecID, prefillID);
		
				// If there are any other Prefill recs linked to the same Exchange Record
				// then try to find one with a matching Key
				if (directPrefillList.length > 0) {
					dupKeyPrefillID = findDuplicate(prefillID, prefillKey, directPrefillList);
				}
			}

			function searchIndirectLinks() {
				indirectPrefillList = getIndirectPrefillList(prefillExRecID);
	
				// If there are any other Prefill recs linked to the same Exchange Record
				// indirectly then try to find one with a matching Key
				if (indirectPrefillList) {
					dupKeyPrefillID = findDuplicate(prefillID, prefillKey, indirectPrefillList);
				}

			
			}

			function findDuplicate(prefillID, prefillKey, prefillList) {
			
				// Search list for a matching Key
				var dupPrefillID = null;
				var listID = null;
				var listKey = null;
				for (i = 0; i < prefillList.length; i++) {
					listKey = prefillList[i].getValue({
						name: 'custrecord_cdp_key' // Key
					});
					listID = prefillList[i].getValue({
						name: 'id' // prefill ID
					});
					// If a Key match is found and it is not the current prefill rec...
					if (listKey === prefillKey && listID !== prefillID) {
						dupPrefillID = listID;
						break;
					}
				}
				return dupPrefillID;
			}

			function getCertExRecParent(prefillCertID) {
				var exRecID = null;
				var certSearch = search.create({
					type: 'customrecord_acq_lot_cert_entry', //Certificate
					title: 'Cert List',
					columns: [{
						name: 'custrecord_acq_lotce_zzz_zzz_parentlot' // Parent Ex Rec ID
					}],
					filters: [{
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}, {
						name: 'internalid',
						operator: search.Operator.IS,
						values: prefillCertID
					}]
				}).run();
				var searchResults = getSearchResultData(certSearch);
				if (searchResults)
					exRecID = searchResults[0].getValue({
						name: 'custrecord_acq_lotce_zzz_zzz_parentlot' // Parent Ex Rec ID
					});
				return exRecID;
			}

			function getdirectPrefillList(exRecID, prefillID) {
				var filters = [{
					name: 'custrecord_cdp_exrec',
					operator: search.Operator.IS,
					values: exRecID
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}];
				// Add the prefill filter if there is one
				// I cannot get this filter to have an effect when it is added
				// so I will just have to exclude the current record id downstream
				// if (prefillID) {
				// 	filters.push({
				// 		name: 'id', // It fails if I use "internalid" here
				// 		operator: search.Operator.NONEOF,
				// 		values: prefillID
				// 	});
				// }
				
				var prefillSearch = search.create({
					type: 'customrecord_ch_doc_prefill', //prefill Prefill
					title: 'Prefill List',
					columns: [{
						name: 'id' // ID
					}, {
						name: 'custrecord_cdp_key' // Key
					}],
					filters: filters
				}).run();
				
				searchResults = getSearchResultData(prefillSearch);
				return searchResults;
			}

			function getIndirectPrefillList(exRecID) {
				var indirectPrefillList = null;
				// Get all Cert recs belonging to Ex Rec 
				var certList = getExRecCerts(exRecID);
				if (certList.length > 0) {
					// Get all Prefills directly linked to any of those Certs
					indirectPrefillList = getPrefillByCertID(certList);
				}
				return indirectPrefillList;
			}

			function getPrefillByCertID(certList) {
				//Create CertID array
				var certIDList = [];
				certIDList = getCertIDList(certList);
				
				var prefillSearch = search.create({
					type: 'customrecord_ch_doc_prefill', //prefill Prefill
					title: 'Prefill List',
					columns: [{
						name: 'id' // ID
					}, {
						name: 'custrecord_cdp_key' // Key
					}],
					filters: [{
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}, {
						name: 'custrecord_cdp_cert',
						operator: search.Operator.ANYOF,
						values: certIDList
					}]
				}).run();
				var searchResults = getSearchResultData(prefillSearch);

				return searchResults;
			}

			function getCertIDList(certList) {
				var certIDList = [];
				var certID = null;
				for (i = 0; i < certList.length; i++) {
					certID = certList[i].getValue({
						name: 'internalid' // Cert ID
					});
					if (certID) {
						certIDList.push(certID);
					}
				}
				return certIDList;
			}

			function getExRecCerts(exRecID) {
				var certSearch = search.create({
					type: 'customrecord_acq_lot_cert_entry', //Certificate
					title: 'Cert List',
					columns: [{
						name: 'internalid' // Cert ID
					}],
					filters: [{
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}, {
						name: 'custrecord_acq_lotce_zzz_zzz_parentlot',
						operator: search.Operator.IS,
						values: exRecID
					}]
				}).run();
				var searchResults = getSearchResultData(certSearch);
				return searchResults;
			}
			/**
			 * Takes a Search.ResultSet object and grabs all the results
			 * by cycling through using getRange()
			 * @param  {Object} resultSet The results of a NetSuite saved search 
			 * (Search.ResultSet object)
			 */
			function getSearchResultData(resultSet) {
				var all = [],
					results = [],
					batchSize = 1000,
					startIndex = 0,
					endIndex = batchSize;

				do {
					results = resultSet.getRange({
						start: startIndex,
						end: endIndex
					});
					all = all.concat(results);
					startIndex += batchSize;
					endIndex += batchSize;
				} while (results.length == batchSize);
				return all;
			}
			/**
			 * Handles error logging and display
			 * @param  {object} e custom error object
			 * @return {Error}   new custom Error
			 */
			function handleError(e) {
				var error = e.title + '\n\t@generatePaidUnpaidDealList.js->' + e.func + '\n\t\t' + e.message;
				if (e.extra) {
					error += '\n\t\t(Additional Info: ' + e.extra + ')';
				}
				log.error(e.title, e.message);
				throw new Error(error);
			}
		}

		return {
			beforeSubmit: beforeSubmit
		};
	});