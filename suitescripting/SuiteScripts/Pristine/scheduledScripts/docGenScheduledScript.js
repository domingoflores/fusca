/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define(['N/record', 'N/search', 'N/runtime', 'N/email'],

	/**
	 * -----------------------------------------------------------
	 * dealEventDocGenScheduledScript.js
	 * ___________________________________________________________
	 * Module builds a scheduled script for Deal Event Document Configuration
	 * It generates the documents for a given Deal Event
	 *
	 * Version 1.0
	 * Author: Ken Crossman & Peter Gail
	 * Version 2.0 - Updated to cope with multiple Doc Generation Events per Deal Event
	 * Author: Ken Crossman
	 * ___________________________________________________________
	 */

	function(record, search, runtime, email) {
		'use strict';

		var thisSuiteletID = null;
		var userEmailAddress = null;
		var dealEvent = null;
		var docGenEvent = null;
		var EMAIL_SENDER = 77671; // PRODUCTION WATCH: ensure correct internal id
		//Parameters
		var DEAL_EVENT_PARAM = 'custscript_dg_deal_event';
		var DOC_GEN_EVENT_PARAM = 'custscript_dg_doc_gen_event';
		var LAUNCH_SUITELET_PARAM = 'custscript_dg_launch_script';
		var USER_EMAIL_PARAM = 'custscript_dg_user_email';

		function execute(context) {
			log.debug('execute', 'Entered');
			dealEvent = runtime.getCurrentScript().getParameter({
				name: DEAL_EVENT_PARAM
			});
			log.debug('execute', 'dealEvent: ' + dealEvent);
			docGenEvent = runtime.getCurrentScript().getParameter({
				name: DOC_GEN_EVENT_PARAM
			});
			log.debug('execute', 'docGenEvent: ' + docGenEvent);
			thisSuiteletID = runtime.getCurrentScript().getParameter({
				name: LAUNCH_SUITELET_PARAM
			});
			log.debug('execute', 'thisSuiteletID: ' + thisSuiteletID);
			userEmailAddress = runtime.getCurrentScript().getParameter({
				name: USER_EMAIL_PARAM
			});
			log.debug('execute', 'userEmailAddress: ' + userEmailAddress);
			if (dealEvent && docGenEvent && thisSuiteletID) {
				return generateDocs(dealEvent, docGenEvent);
			}
			return null;
		}

		function generateDocs(dealEvent, docGenEvent) {
			log.debug('generateDocs', 'dealEvent: ' + dealEvent);
			log.debug('generateDocs', 'docGenEvent: ' + docGenEvent);

			// Get all Document Selection rows for the Deal Event
			var sdsList = buildStoredDocSelections(dealEvent, docGenEvent);
			// log.debug('generateDocs', 'sdsList: ' + JSON.stringify(sdsList));

			// Get all exchange recs for deal event. So we can get the Shareholder - needed for the Document.
			var exRecs = getExRecs(dealEvent);

			// Get all Documents linked to all Exchange records for this Deal Event
			// We will use this list to ensure we do not allocate the same document to the same Exchange Record twice for a Deal Event
			var sdaList = buildStoredDocAllocations(dealEvent);

			var docSelection = '';
			var docTemplID = '';
			var certTypeID = '';
			var exRecGpID = '';
			var exRecShareholderID = '';
			var selexRecGpID = '';
			var exchRecID = '';
			var selcertTypeID = '';
			var seldocTemplID = null;

			// Create Document for each exchange rec by security type
			// Get all exchange recs by security type
			// This Certificate summary search returns all certificates for all Exchange Records
			// for the Deal Event. Results grouped by 1) Security Type and then 2) Exchange Record
			var exRecsBySecType = getExRecsBySecType(dealEvent);
			var docsToCreate = prepDocsBySecType(exRecsBySecType, sdsList);
			// log.debug('generateDocs - after sec types', 'docsToCreate: ' + JSON.stringify(docsToCreate));
			// log.debug('generateDocs - after sec types', 'docsToCreate Count: ' + JSON.stringify(docsToCreate.length));
			// Create Document for each exchange rec by group
			// Get all exchange recs by group
			var gpExRecs = getGpExRecs(dealEvent);
			docsToCreate = prepDocsByExRecGp(gpExRecs, sdsList, docsToCreate);
			// log.debug('generateDocs - after exrecgps', 'docsToCreate: ' + JSON.stringify(docsToCreate));
			// log.debug('generateDocs - after exrecgps', 'docsToCreate Count: ' + JSON.stringify(docsToCreate.length));
			// Now remove duplicates from the docs to create array because 
			// there may be an exchange record that has more than one of a 
			// combination of security types and exchange rec groups 
			// each of which has been assigned the same document
			docsToCreate = dedupe(docsToCreate);
			// log.debug('generateDocs - after dedupe', 'docsToCreate: ' + JSON.stringify(docsToCreate));
			// log.debug('generateDocs - after dedupe', 'docsToCreate Count: ' + JSON.stringify(docsToCreate.length));
			// log.debug('generateDocs - after dedupe', 'sdaList Count: ' + JSON.stringify(sdaList.length));
			// Now remove from the list any docs previously allocated to an Exchange Record to ensure no dups 
			// across the whole DER
			var dedupedDocsToCreate = removeDups(docsToCreate, sdaList);
			// log.debug('generateDocs - after removeDups', 'dedupedDocsToCreate: ' + JSON.stringify(dedupedDocsToCreate));
			// log.debug('generateDocs - after removeDups', 'dedupedDocsToCreate Count: ' + JSON.stringify(dedupedDocsToCreate.length));

			// Create the Documents for the de-duped list 
			createDocs(dealEvent, docGenEvent, dedupedDocsToCreate, sdsList, exRecs);
		}

		function prepDocsBySecType(exRecsBySecType, sdsList) {
			var docsToCreate = [];
			for (var i = 0; i < exRecsBySecType.length; i++) {
				exRecGpID = exRecsBySecType[i].getValue({
					name: 'custrecord_exch_rec_group', //Exchange Rec Gp
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot',
					summary: search.Summary.MAX,
				}) || null;
				exchRecID = exRecsBySecType[i].getValue({
					name: 'custrecord_acq_lotce_zzz_zzz_parentlot',
					summary: search.Summary.GROUP
				}) || null;
				exRecGpDocAllocExclusive = exRecsBySecType[i].getValue({
					name: 'custrecord_exrec_gp_doc_alloc_exclusive', //Exchange Record Group Document Allocation Exclusivity
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot', // Exchange Record link on Certificate
					summary: search.Summary.MAX
				}) || null;
				if (!exRecGpDocAllocExclusive) {
					// This is not a member of an exclusive exchange record group. 
					// Proceed to create docs by virtue of security type ownership.
					// Otherwise don't create the doc. Docs for groups are created in the next section.
					certTypeID = exRecsBySecType[i].getValue({
						name: 'custrecord_acq_lotce_3_src_certtype',
						summary: search.Summary.GROUP,
						sort: search.Sort.ASC
					});

					for (var j = 0; j < sdsList.length; j++) {
						// If the security type owned by this exchange rec is one of those selected 
						// then add it to the docs to create array						
						if (sdsList[j].certType === certTypeID) {
							docsToCreate.push({
								exrecID: exchRecID,
								docID: sdsList[j].docTempl
							});
						}
					}
				}
			}
			return docsToCreate;
		}

		function prepDocsByExRecGp(gpExRecs, sdsList, docsToCreate) {
			// log.debug('prepDocsByExRecGp','docsToCreate type: ' + typeof docsToCreate);
			// log.debug('prepDocsByExRecGp','docsToCreate length: ' + docsToCreate.length);
			// log.debug('prepDocsByExRecGp','docsToCreate: ' + JSON.stringify(docsToCreate));
			var docs2Create = docsToCreate;
			// Go thru each exchange rec by group
			for (var m = 0; m < gpExRecs.length; m++) {
				exRecGpID = gpExRecs[m].getValue({
					name: 'custrecord_exch_rec_group'
				});
				exchRecID = gpExRecs[m].getValue({
					name: 'internalid'
				});

				for (var n = 0; n < sdsList.length; n++) {
					if (sdsList[n].exRecGp !== '' && exRecGpID !== '' && sdsList[n].exRecGp === exRecGpID) { // If this exchange rec's group is one of those selected then create doc
						docs2Create.push({
							exrecID: exchRecID,
							docID: sdsList[n].docTempl
						});
					}
				}
			}
			return docs2Create;
		}

		function createDocs(dealEvent, docGenEvent, docsToCreate, sdsList, exRecs) {
			var docsCreatedCount = 0;
			try {
				// Go through the deduped list of docs to create a doc for each
				for (var y = 0; y < docsToCreate.length; y++) {
					exchRecID = docsToCreate[y].exrecID;
					docTemplID = docsToCreate[y].docID;

					for (var z = 0; z < sdsList.length; z++) {
						// Find the right selected document row to pass to the createdoc function
						if (docTemplID === sdsList[z].docTempl) {
							createDoc(dealEvent, docGenEvent, exchRecID, sdsList[z], exRecs);
							docsCreatedCount++;
							break;
						}
					}
				}
			} catch (e) {
				email.send({
					author: EMAIL_SENDER,
					recipients: userEmailAddress,
					subject: 'NetSuite Scheduled Script: ERROR',
					body: 'An error has occured when attempting to run scheduled script ' + runtime.getCurrentScript().id + '\nERROR:' + '\n' + JSON.stringify(e)
				});

				var error = {
					title: 'GENERATE DOCS ERROR:',
					message: e.message,
					func: 'generateDocs',
					extra: ' # Of Docs Created: ' + docsCreatedCount + ' of ' + docsToCreate.length
				};
				handleError(error);
			}
		}

		function createDoc(dealEvent, docGenEvent, exchRecID, sds, exRecs) {
			// log.debug('createDoc', 'Entered');
			// log.debug('createDoc', 'dealEvent: ' + dealEvent);
			// log.debug('createDoc', 'exchRecID: ' + exchRecID);
			// log.debug('createDoc', 'sdsList: ' + sdsList);
			// log.debug('createDoc', 'exRecs: ' + JSON.stringify(exRecs));

			if (!thisSuiteletID) {
				throw new Error('CREATE DOC ERROR: missing suitelet ID');
			}

			try {

				var docRec = record.create({
					type: 'customrecord_document_management'
				});

				docRec.setValue({
					fieldId: 'custrecord_document_mpr',
					value: dealEvent
				});
				docRec.setValue({
					fieldId: 'custrecord_doc_doc_gen_event',
					value: docGenEvent
				});
				docRec.setValue({
					fieldId: 'custrecord_acq_lot_exrec',
					value: exchRecID
				});

				//Find the shareholder
				var exRecShareholderID = getShareholder(exchRecID, exRecs);

				docRec.setValue({
					fieldId: 'custrecord_escrow_customer',
					value: exRecShareholderID
				});
				docRec.setValue({
					fieldId: 'custrecord_doc_template',
					value: docTemplID
				});
				docRec.setValue({
					fieldId: 'altname',
					value: sds.dtName
				});
				docRec.setValue({
					fieldId: 'custrecord_dm_status',
					value: 5 //Final
				});
				docRec.setValue({
					fieldId: 'custrecord_doc_type',
					value: sds.dtDocType
				});
				docRec.setValue({
					fieldId: 'custrecord_file',
					value: sds.dtIntFile
				});
				docRec.setValue({
					fieldId: 'custrecord_acq_lot_de_required',
					value: true
				});
				docRec.setValue({
					fieldId: 'custrecord_doc_created_by_script',
					value: thisSuiteletID // Document Selection Suitelet
				});
				var docID = docRec.save();
				log.debug('createDoc', 'docID: ' + docID);
			} catch (e) {
				log.error('ERROR IN CREATE DOC', e.message);
				var error = {
					title: 'CREATE DOC RECORD ERROR:',
					message: e.message,
					func: 'createDoc',
					extra: 'ExchangeRecID: ' + exchRecID + ' - SDS: ' + JSON.parse(sds)
				};
				handleError(error);
			}
		}

		function getShareholder(exchRecID, exRecs) {
			var exRecID = '';
			var exRecShareholderID = '';
			for (var r = 0; r < exRecs.length; r++) {
				exRecID = exRecs[r].getValue({
					name: 'internalid'
				});
				// Find the exchange record 
				if (exchRecID === exRecID) {
					exRecShareholderID = exRecs[r].getValue({
						name: 'custrecord_acq_loth_zzz_zzz_shareholder'
					});
					break;
				}
			}
			return exRecShareholderID;
		}

		function getGpExRecs(dealEvent) {
			var gpExRecSearch = search.create({
				type: 'customrecord_acq_lot',
				title: 'gpxchrecs',
				columns: [{
					name: 'internalid'
				}, {
					name: 'custrecord_exch_rec_group'
				}, {
					name: 'custrecord_acq_loth_zzz_zzz_shareholder'
				}],
				filters: [{
					name: 'custrecord_acq_lot_payment_import_record',
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'custrecord_exch_rec_group',
					operator: search.Operator.NONEOF,
					values: '@NONE@'
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});


			var searchResults = '';

			searchResults = gpExRecSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}

		function getExRecs(dealEvent) {
			var exRecSearch = search.create({
				type: 'customrecord_acq_lot',
				title: 'xchrecs',
				columns: [{
					name: 'internalid'
				}, {
					name: 'custrecord_exch_rec_group'
				}, {
					name: 'custrecord_acq_loth_zzz_zzz_shareholder'
				}],
				filters: [{
					name: 'custrecord_acq_lot_payment_import_record',
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});


			var searchResults = '';

			searchResults = exRecSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}

		function dedupe(arr) {
			return arr.reduce(function(p, c) {

				// create an identifying id from the object values
				var id = [c.exrecID, c.docID].join('|');

				// if the id is not found in the temp array
				// add the object to the output array
				// and add the key to the temp array
				if (p.temp.indexOf(id) === -1) {
					p.out.push(c);
					p.temp.push(id);
				}
				return p;

				// return the deduped array
			}, {
				temp: [],
				out: []
			}).out;
		}

		function removeDups(docs, sdaList) {
			var dtcExRecID = null;
			var dtcDocID = null;
			for (var i = 0; i < docs.length; i++) {
				dtcExRecID = docs[i].exrecID || null;
				dtcDocID = docs[i].docID || null;

				for (var j = 0; j < sdaList.length; j++) {
					// If a duplicate is found then remove this document/exchange record allocation 
					// from the array
					if (dtcExRecID === sdaList[j].exRec && dtcDocID === sdaList[j].docTempl) {
						docs.splice(i, 1);
						i--; // You just removed an array member - everything has shifted up by one position
						break;
					}
				}
			}
			return docs;
		}

		/**
		 * Constructs a list of Stored Doc Selection objects for the whole Deal Event
		 * @return {array}             approval step linked list
		 */
		function buildStoredDocSelections(dealEvent, docGenEvent) {
			var sdsRecords = null;

			sdsRecords = getDocSelection(dealEvent, docGenEvent);
			var sdsList = [];
			var sds = null;
			for (var i = 0; i < sdsRecords.length; i++) {
				sds = buildSDS(sdsRecords[i]);
				sdsList.push(sds);
			}
			return sdsList;
		}


		/**
		 * Construct an individual doc gen event object
		 * @param  {object} step raw NetSuite search result
		 * @return {object}      formatted approval step
		 */
		function buildSDS(sds) {
			return {
				id: sds.id,
				docGenEvent: sds.getValue('custrecord_ds_doc_gen_event') || null,
				docTempl: sds.getValue('custrecord_ds_doc_template') || null,
				certType: sds.getValue('custrecord_ds_cert_type') || null,
				exRecGp: sds.getValue('custrecord_ds_exrec_gp') || null,
				dtExtFile: sds.getValue({
					name: 'custrecord_dt_ext_file',
					join: 'custrecord_ds_doc_template'
				}) || null,
				dtName: sds.getValue({
					name: 'name',
					join: 'custrecord_ds_doc_template'
				}) || null,
				dtDocType: sds.getValue({
					name: 'custrecord_dt_doc_type',
					join: 'custrecord_ds_doc_template'
				}) || null,
				dtIntFile: sds.getValue({
					name: 'custrecord_dt_int_file',
					join: 'custrecord_ds_doc_template'
				}) || null,
			};
		}

		/**
		 * Constructs a list of Stored Doc Selection objects for the whole Deal Event
		 * @return {array}             approval step linked list
		 */
		function buildStoredDocAllocations(dealEvent) {
			var sdaRecords = null;

			sdaRecords = getStoredDocAllocations(dealEvent);
			var sdaList = [];
			var sda = null;
			for (var i = 0; i < sdaRecords.length; i++) {
				sda = buildSDA(sdaRecords[i]);
				sdaList.push(sda);
			}
			return sdaList;
		}

		/**
		 * Construct an individual doc gen event object
		 * @param  {object} step raw NetSuite search result
		 * @return {object}      formatted approval step
		 */
		function buildSDA(sda) {
			return {
				docTempl: sda.getValue('custrecord_doc_template') || null,
				exRec: sda.getValue('custrecord_acq_lot_exrec') || null,
			};
		}



		function getStoredDocAllocations(dealEvent) {
			var sdaSearch = search.create({
				type: 'customrecord_document_management', // Document record type
				title: 'Doc Allocations',
				columns: [{
					name: 'custrecord_acq_lot_exrec', // Linked Exchange Record
				}, {
					name: 'custrecord_doc_template' // Linked Template
				}],
				filters: [{
					name: 'custrecord_document_mpr',
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'isinactive',
					join: 'custrecord_acq_lot_exrec',
					operator: search.Operator.IS,
					values: 'F'
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});

			var searchResults = sdaSearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}

		function getDocSelection(dealEvent, docGenEvent) {
			var xjoinsearch = search.create({
				type: 'customrecord_document_selection',
				title: 'XjoinRows',
				columns: [{
					name: 'custrecord_ds_doc_gen_event',
				}, {
					name: 'internalid'
				}, {
					name: 'name',
					join: 'custrecord_ds_doc_template'
				}, {
					name: 'custrecord_ds_cert_type'
				}, {
					name: 'custrecord_ds_exrec_gp'
				}, {
					name: 'custrecord_ds_doc_template'
				}, {
					name: 'custrecord_dt_ext_file',
					join: 'custrecord_ds_doc_template'
				}, {
					name: 'custrecord_dt_doc_type',
					join: 'custrecord_ds_doc_template'
				}, {
					name: 'custrecord_dt_int_file',
					join: 'custrecord_ds_doc_template'
				}],
				filters: [{
					name: 'custrecord_ds_deal_event',
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'custrecord_ds_doc_gen_event',
					operator: search.Operator.IS,
					values: docGenEvent
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});

			var searchResults = xjoinsearch.run().getRange({
				start: 0,
				end: 1000
			});

			return searchResults;
		}
		/**
		 * This Certificate summary search returns all certificates for all Exchange Records
		 * for the Deal Event. Results grouped by 1) Security Type and then 2) Exchange Record
		 * The results of this search are used to determine which Exchange Records should have 
		 * Documents attached to them based on user selection in the Doument Selection suitelet.
		 * @param  {object} step Approval proccess step
		 * @return {boolean}      If user has permission
		 */
		function getExRecsBySecType(dealEvent) {
			var exchangeRecSearch = search.create({
				type: 'customrecord_acq_lot_cert_entry', //Certificate record type
				title: 'xchrecs',
				columns: [{
					name: 'custrecord_acq_lotce_3_src_certtype', // DE0-T1) Certificate Type on Certificate (Security types link)
					summary: search.Summary.GROUP,
					sort: search.Sort.ASC
				}, {
					name: 'custrecord_acq_lotce_zzz_zzz_parentlot', // Exchange Record link on Certificate
					summary: search.Summary.GROUP,
					sort: search.Sort.ASC
				}, {
					name: 'custrecord_exch_rec_group', //Exchange Rec Gp
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot', // Exchange Record link on Certificate
					summary: search.Summary.MAX,
				}, {
					name: 'custrecord_exrec_gp_doc_alloc_exclusive', //Exchange Record Group Document Allocation Exclusivity
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot', // Exchange Record link on Certificate
					summary: search.Summary.MAX,
				}, {
					name: 'custrecord_acq_loth_zzz_zzz_shareholder', //Exchange Rec Shareholder
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot', // Exchange Record link on Certificate
					summary: search.Summary.MAX,
				}],
				filters: [{
					name: 'custrecord_acq_lot_payment_import_record', // Deal Event link on Exchange Record
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot', // Exchange Record link on Certificate
					operator: search.Operator.IS,
					values: dealEvent
				}, {
					name: 'isinactive',
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot',
					operator: search.Operator.IS,
					values: 'F'
				}, {
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				}]
			});
			var searchResults = '';
			searchResults = exchangeRecSearch.run().getRange({
				start: 0,
				end: 1000
			});


			// var exchRecCount = searchResults.length;

			return searchResults;
		}

		/**
		 * Handles error logging and display
		 * @param  {object} e custom error object
		 * @return {Error}   new custom Error
		 */
		function handleError(e) {
			var error = e.title + '\n\t@dealEventDocGenScheduledScript.js->' + e.func + '\n\t\t' + e.message;
			if (e.extra) {
				error += '\n\t\t(Additional Info: ' + e.extra + ')';
			}
			log.error(e.title, e.message);
			throw new Error(error);
		}

		return {
			execute: execute
		};

	});