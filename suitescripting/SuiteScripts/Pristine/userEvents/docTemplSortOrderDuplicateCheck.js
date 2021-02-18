/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'],

	/**
	 * -----------------------------------------------------------
	 * docTemplSortOrderDuplicateCheck.js
	 * ___________________________________________________________
	 * The Sort Order field on the Document Template record needs to be unique  
	 * within the group of Document Templates linked to a Deal.
	 * This script checks for and prevents duplicates from being created.
	 * 
	 * Version 1.0
	 * Author: Ken Crossman
	 * ___________________________________________________________
	 */

	function(record, search) {

		function beforeSubmit(context) {
			'use strict';

			var z = null;
			var thisRecordID = null;
			var uniqueFieldValue = null;
			var contextFieldID = null;
			var contextFieldName = null;
			var dupValueRecordID = null;
			var dupValueRecord = null;
			var dupValueRecordName = null;
			var errorMsg = null;

			// Get the event type
			var eventType = context.type;
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'eventType: ' + eventType
			});
			//Only process the following Event Types: Edit, Create, Copy, Xedit
			var oldRec = '';
			var newRec = '';
			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
					newRec = context.newRecord; // Get the record which has just been saved clientside.
					break;
				case context.UserEventType.XEDIT:
					newRec = context.newRecord; // Get the record which has just been saved clientside.
					oldRec = context.oldRecord; //For Xedit only updated fields are in new rec - all fields in oldrec 
					break;
				default:
					return;
			}
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'oldRec: ' + JSON.stringify(oldRec)
			});
			log.debug({
				title: 'Function beforeSubmit:',
				details: 'newRec: ' + JSON.stringify(newRec)
			});
			var newRecJSON = JSON.stringify(newRec);

			// Get this record id, unique field value and Context Record ID
			getRecFields();

			// Search for all records linked to the Context record
			if (contextFieldID) {
				// Search for all records linked to the Context Record directly
				searchLinkedRecs();
				
				// If there is a duplicate Key then throw an error
				if (dupValueRecordID) {
					errorMsg = 'Key "' + uniqueFieldValue + '" has already been used for Deal: ' + contextFieldName;
					errorMsg += ' (' + contextFieldID + ')';
					errorMsg += ' in Document Template: ' + dupValueRecordName;
					errorMsg += ' (' + dupValueRecordID + ')';
					throw errorMsg;
				}
			}

			function getRecFields() {
				// Get the record id
				thisRecordID = newRec.getValue('id');
				log.debug({
					title: 'getRecFields',
					details: 'thisRecordID: ' + thisRecordID
				});

				// Get the record Key field value
				uniqueFieldValue = newRec.getValue('custrecord_dt_sort_order');
				// If this is an Xedit then you need to check if this field was changed or not
				if (eventType === 'xedit') {
					z = newRecJSON.search('"custrecord_dt_sort_order":');
					if (z === -1) { //Field has not been changed in xedit - get value from old rec
						uniqueFieldValue = oldRec.getValue('custrecord_dt_sort_order');
					}
				}
				log.debug({
					title: 'getRecFields',
					details: 'uniqueFieldValue: ' + uniqueFieldValue
				});

				// Get the id of the record field which establishes the context of the duplicate check 
				contextFieldID = newRec.getValue('custrecord_dt_deal');
				log.debug({
					title: 'getRecFields',
					details: 'contextFieldID: ' + contextFieldID
				});
				if (eventType === 'create') {
					contextFieldName = newRec.getValue('custrecord_dt_deal_display');
				} else {
					contextFieldName = newRec.getText('custrecord_dt_deal');
				}
				
				log.debug({
					title: 'getRecFields',
					details: 'contextField Name: ' + contextFieldName
				});
				if (eventType === 'xedit') {
					z = newRecJSON.search('"custrecord_dt_deal":');
					if (z === -1) { //Field has not been changed in xedit - get value from old rec
						contextFieldID = oldRec.getValue('custrecord_dt_deal');
						contextFieldName = oldRec.getText('custrecord_dt_deal');
					}
				}
				log.debug({
					title: 'getRecFields',
					details: 'contextFieldID: ' + contextFieldID
				});
				log.debug({
					title: 'getRecFields',
					details: 'contextField Name: ' + contextFieldName
				});
			}

			function searchLinkedRecs() {
				linkedRecordList = getlinkedRecordList(contextFieldID, thisRecordID);
				// If there are any other recs linked to the same Context Record
				// then try to find one with a matching Key
				if (linkedRecordList.length > 0) {
					dupValueRecord = findDuplicate(thisRecordID, uniqueFieldValue, linkedRecordList);
					if (dupValueRecord) {
						dupValueRecordID = dupValueRecord.getValue({
							name: 'id' //  ID
						});
						dupValueRecordName = dupValueRecord.getValue({
							name: 'name' //  ID
						});
					}

				}
			}


			function findDuplicate(thisRecordID, uniqueFieldValue, linkedRecordList) {
				// Search list for a matching Key
				var duprecord = null;
				var listID = null;
				var listUniqueFieldValue = null;
				for (i = 0; i < linkedRecordList.length; i++) {
					listID = linkedRecordList[i].getValue({
						name: 'id' //  ID
					});
					listUniqueFieldValue = linkedRecordList[i].getValue({
						name: 'custrecord_dt_sort_order' // Unique field value 
					});
					// If a Key match is found and it is not the current record...
					// if (listUniqueFieldValue === uniqueFieldValue && listID !== thisRecordID) {
					if (parseInt(listUniqueFieldValue) === parseInt(uniqueFieldValue)) {
						log.debug({
							title: 'findDuplicate',
							details: 'duplicate value found: ' + listUniqueFieldValue
						});
						if (listID === thisRecordID) {} else {
							log.debug({
								title: 'findDuplicate',
								details: 'confirmed not this record: ' + listID
							});
							duprecord = linkedRecordList[i];
							break;
						}
					}
				}
				return duprecord;
			}


			function getlinkedRecordList(contextFieldID, thisRecordID) {
				var filters = [{
					name: 'custrecord_dt_deal',
					operator: search.Operator.IS,
					values: contextFieldID
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}];
				var linkedRecordSearch = search.create({
					type: 'customrecord_doc_template',
					title: 'Linked Record List',
					columns: [{
						name: 'id' // ID
					}, {
						name: 'name' // Name
					}, {
						name: 'custrecord_dt_sort_order' // Unique field
					}],
					filters: filters
				}).run();
				var searchResults = getSearchResultData(linkedRecordSearch);

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