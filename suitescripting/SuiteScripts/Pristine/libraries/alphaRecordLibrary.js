/**
 * alphaRecordLibrary.js
 * @NApiVersion 2.x
 * @NModuleScopt public
 */
/**
 * 
 * Story      Date            Author           	Remarks
 * ATP-125	  4/25/2018       Ken Crossman     	Payment History record should be created for each PI create and then after each PI update
 * ATP-242    08/09/2018      Ken Crossman     	Improving PI Update when toggling On-Hold checkbox
 * ATP-840	  4/15/2019		  Paul Shea			Added function to clear all Paymt Instr Holds and clear 'On Hold' checkbox from PI record when PI Submission record is submitted with 'Inactivate PI'
 * ATP-986	  6/18/2019		  Robert Bender		Added function markShareholderDupes(SHid) for dupe handling of specific ShareHolder rather than relying on scheduled script 
 */
define(['N/search', 'N/format', 'N/runtime', 'N/record', 'N/log', 'N/url', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js', '/SuiteScripts/Pristine/libraries/paymtInstrListLibrary.js','/SuiteScripts/Pristine/libraries/searchLibrary', '/.bundle/132118/PRI_AS_Engine'],

	function(search, format, runtime, record, log, url, paymtInstrListLibrary, piListLib, searchLibrary, appSettings) {
		var prefixMap = {
			customrecord_paymt_instr: 'custrecord_pi',
			customrecord_paymt_instr_hist: 'custrecord_pihs',
			customrecord_paymt_instr_submission: 'custrecord_pisb',
		};

		var payInstrHoldSts = paymtInstrListLibrary.piEnum.payInstrHoldSts;
		var paymtInstrHoldSrc = paymtInstrListLibrary.piEnum.paymtInstrHoldSrc;
		var paymtInstrHoldReason = paymtInstrListLibrary.piEnum.paymtInstrHoldReason;


		var editableReviewEditFields = ['custrecord_pisb_rvw_last_comment'];
		var editableMedallionFields = ['custrecord_pisb_med_status', 'custrecord_pisb_med_number', 'custrecord_pisb_med_sigpresent',
			'custrecord_pisb_med_received_ts', 'custrecord_pisb_med_image', 'custrecord_pisb_med_case', 'custrecord_pisb_med_comment'
		];
		var editableTrackingFields = ['custrecord_pisb_payagnt_confirm', 'custrecord_pisb_payagnt_case', 'custrecord_pisb_buyer_confirm',
			'custrecord_pisb_buyer_case', 'custrecord_pisb_escrow_confirm', 'custrecord_pisb_escrow_case', 'custrecord_pisb_srs_trk_comment'
		];

		function getEditableReviewEditFields() {
			return editableReviewEditFields;
		}

		function getEditableMedallionFields() {
			return editableMedallionFields;
		}

		function getEditableTrackingFields() {
			return editableTrackingFields;
		}

		function getAllCustomFields(recordFields) {
			var customFields = [];
			for (var i = 0; i < recordFields.length; i++) {
				if (recordFields[i].substr(0, 10) === 'custrecord') {
					customFields.push(recordFields[i]);
				}
			}
			return customFields;
		}

		function getMedallionFields(recordFields) {
			var medFields = [];
			for (var i = 0; i < recordFields.length; i++) {
				if (recordFields[i].substr(0, 19) === 'custrecord_pisb_med') {
					medFields.push(recordFields[i]);
				}
			}
			return medFields;
		}

		function getTrackingFields(recordFields) {
			var trackingFields = [];
			for (var i = 0; i < recordFields.length; i++) {
				if (recordFields[i].substr(0, 23) === 'custrecord_pisb_payagnt' ||
					recordFields[i].substr(0, 21) === 'custrecord_pisb_buyer' ||
					recordFields[i].substr(0, 22) === 'custrecord_pisb_escrow' ||
					recordFields[i].substr(0, 23) === 'custrecord_pisb_srs_trk') {
					trackingFields.push(recordFields[i]);
				}
			}
			return trackingFields;
		}

		function createPaymtHistRecord(piRec, piId) {
			var paymtInstr = JSON.parse(JSON.stringify(piRec));
			var thisRecord = piId,
				thisRecordType = paymtInstr.type,
				fields = paymtInstr.fields;

			var history = {}; // object to store Paymt Instr History field key and old value

			var formattedNow = getCurrentDateTime(),
				thisUser = runtime.getCurrentUser().id;
			//__________________________________________________________________________________________

			// create history object and find changes in the data
			for (var prop in fields) {
				if (isNotSystemField(prop)) {
					history[prop] = fields[prop];
				}
			}

			// set up mandatory fields for Paymt Instr History record
			history.custrecord_pi_paymt_instr = thisRecord; // Payment Instruction that we just changed
			history.custrecord_pi_hist_ts = formattedNow; // Time/Date of the change

			// create and set the record fields
			var newPaymtHist = record.create({
				type: 'customrecord_paymt_instr_hist'
			});
			for (prop in history) {
				var setValue = cleanData(history[prop]);
				var setField = findRelatedField(prop, 'customrecord_paymt_instr', 'customrecord_paymt_instr_hist');
				newPaymtHist.setValue({
					fieldId: setField,
					value: setValue
				});
			}
			newPaymtHist = newPaymtHist.save(); // newly created record locked by Lock Paymt Instr History workflow
			log.audit('Created new pmt history record ID #' + newPaymtHist);
			return newPaymtHist;
		}

		function findRelatedField(fieldId, thisRecordType, newRecordType) {
			return fieldId.replace(prefixMap[thisRecordType], prefixMap[newRecordType]);
		}

		function isNotSystemField(fieldId) {
			return fieldId.match(/^custrecord_pi/g);
		}

		function getCurrentDateTime() {
			// grabs the current Javascript Date/Time and parses it into a format NetSuite accepts
			var now = new Date();
			return format.parse({
				value: now,
				type: format.Type.DATETIMETZ
			});
		}

		function cleanData(prop) {
			// helper function to convert data into formats NetSuite accepts
			// TODO : make this a library
			if (prop != '') {
				if (Date.parse(prop).toString() !== 'NaN') { // it is a date
					if (prop.length > 10) { // format is longer than mm/dd/yyyy, so it is DATETIME
						return (format.parse({
							value: prop,
							type: format.Type.DATETIME
						}));
					} else {
						return (format.parse({
							value: prop,
							type: format.Type.DATE
						}));
					}
				}
				if (prop == 'F') {
					return false;
				}
				if (prop == 'T') {
					return true;
				}
			}
			return prop;
		}
		// ATP-242
		function manageHoldStatus(holdPI) {
			var togglePIOnHoldResult = null;
			var success = false;
			var message = '';
			
			if (holdPI) {
				// Count open holds for all holds linked to this PI
				var openHoldCount = getOpenHolds(holdPI);
				log.debug('manageHoldStatus', 'openHoldCount: ' + openHoldCount);
				// get current On Hold status for this PI
				var piOnHold = search.lookupFields({
					type: 'customrecord_paymt_instr',
					id: holdPI,
					columns: 'custrecord_pi_onhold'
				}).custrecord_pi_onhold;
				log.debug('manageHoldStatus', 'piOnHold: ' + piOnHold);
				// If there is at least 1 open hold and the PI is on hold - then do nothing
				// If there are no open holds and the PI is not on hold - then do nothing
				if ((piOnHold && openHoldCount > 0) || (!piOnHold && openHoldCount === 0)) {} else
				// Otherwise - change the PI record On Hold value  
				{
					var newPIOnHold = false;
					if (openHoldCount > 0) {
						newPIOnHold = true;
					}
					togglePIOnHoldResult = togglePIOnHold(holdPI, newPIOnHold);
					success = togglePIOnHoldResult.success;
					message = togglePIOnHoldResult.message;
				}
			}

			return {
				success: success,
				message: message
			};
		}

		function togglePIOnHold(holdPI, newPIOnHold) {
			var updatedPIID = null;
			var success = false;
			var message = '';
			try {
				updatedPIID = record.submitFields({
					type: 'customrecord_paymt_instr',
					id: holdPI,
					values: {
						custrecord_pi_onhold: newPIOnHold,
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true
					}
				});

				if (updatedPIID) {
					success = true;
					message += 'Updated On-Hold checkbox of PI ' + updatedPIID + ';<br>';
				}

			} catch (e) {
				message += ' Failed to update On-Hold checkbox of PI ' + holdPI + '.  Error: ' + e.message + ';<br>';
			}
			return {
				success: success,
				updatedPIID: updatedPIID,
				message: message
			};

		}

		// I include the current Hold in the search because any updates to the current record will show up in a search 
		// because this is afterSubmit
		function getOpenHolds(holdPI) {
			var openHoldCount = 0;
			if (holdPI) {
				var holdSearch = search.create({
					type: 'customrecord_paymt_instr_hold',
					title: 'Holds',
					columns: [{
						name: 'internalid'
					}],
					filters: [{
						name: 'custrecord_pihd_hold_status',
						operator: search.Operator.IS,
						values: payInstrHoldSts.Open
					}, {
						name: 'custrecord_pihd_paymt_instr',
						operator: search.Operator.IS,
						values: holdPI
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}]
				});
				var searchResults = holdSearch.run().getRange({
					start: 0,
					end: 1000
				});
				if (searchResults) {
					openHoldCount = searchResults.length;
				}
			}

			return openHoldCount;
		}

		function createPIHold(relatedPI, caseId, holdReason) {
			log.debug('createPIHold');
			var success = false;
			var holdId = null;
			var message = '';

			var holdRecord = record.create({ // 0.5 seconds
				type: 'customrecord_paymt_instr_hold'
			});

			var holdRecordFields = {
				custrecord_pihd_paymt_instr: relatedPI,
				custrecord_pihd_hold_src: paymtInstrHoldSrc.Script,
				custrecord_pihd_hold_reason: holdReason,
				custrecord_pihd_hold_status: payInstrHoldSts.Open
			};
			if (caseId) {
				holdRecordFields.custrecord_pihd_onhold_case = caseId;
			}
			for (prop in holdRecordFields) {
				holdRecord.setValue({
					fieldId: prop,
					value: holdRecordFields[prop]
				});
			}

			try {
				holdId = holdRecord.save(); // 1 second
				log.debug('createPIHold', 'holdId: ' + holdId);
				manageHoldStatus(relatedPI); // 0.3 seconds
				if (holdId) {
					success = true;
					message += 'Created Hold ' + holdId + ' for Payment Instruction ' + relatedPI + ';<br>';
				}

			} catch (e) {
				message += ' Failed to create Hold for Payment Instruction ' + relatedPI + '.  Error: ' + e.message + ';<br>';
			}
			return {
				success: success,
				holdId: holdId,
				message: message
			};
		}


		/**
		 * This function will search for all Payment Instruction Hold records associated with a given Payment Instruction record
		 * and set the status of each Payment Instruction Hold to 'Cleared'. Will also update the given Payment Instruction record's
		 * On Hold status to False if necessary.
		 *
		 * Associated with ATP-840
		 *
		 * @param {string} paymtInstr - Internal ID of the Payment Instruction record
		 * @param {Boolean} [inactivatePI] - True if we're inactivating the Payment Instruction record. Optional parameter
		 */
		function clearHoldsByPI(paymtInstr, inactivatePI) {

			var filters = [];
			// Looking for holds that have the same Payment Instr ID as this Payment Instr...
			var paymtInstrIdFilter = search.createFilter({
				name: 'custrecord_pihd_paymt_instr',
				operator: search.Operator.IS,
				values: paymtInstr
			});
			filters.push(paymtInstrIdFilter);

			var statusFilter = search.createFilter({
				name: 'custrecord_pihd_hold_status',
				operator: search.Operator.IS,
				values: payInstrHoldSts.Open
			});
			filters.push(statusFilter);

			search.create({
				type: 'customrecord_paymt_instr_hold',
				filters: filters
			}).run().each(function(result) {

				try {

					// Update the status of this particular Payment Instruction Hold
					record.submitFields({
						type: 'customrecord_paymt_instr_hold',
						id: result.id,
						values: {
							custrecord_pihd_hold_status: payInstrHoldSts.Cleared
						}
					});

				} catch (e) {

					log.error('ERROR CLEARING HOLD', e.name + ': ' + e.message + ' /// ' + e.stack);
				}

				return true;
			});

			// If we need to release the On Hold checkbox, do so...
			if (inactivatePI) {

				try {

					record.submitFields({
						type: 'customrecord_paymt_instr',
						id: paymtInstr,
						values: {
							custrecord_pi_onhold: false,
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields: true
						}
					});

				} catch (e) {

					log.error({title: 'ERROR CLEARING ON HOLD CHECKBOX FROM PI RECORD', details: e.name + ': ' + e.message + ' /// ' + e.stack});
				}

			}

		}





		// returns PIDupes
		function returnPIsToBeProcessed(SHid){
			// *******************************************************************************
			// *        This returns what PI ids that will be set for alert msg              *
			// *******************************************************************************
			log.audit('GOVERNANCE, - returnPIsToBeProcessed START -', runtime.getCurrentScript().getRemainingUsage() );

			// ********************************* PARAMETERS *********************************
			var createHoldRecords = true; // Turn on/off creating the hold records for testing purposes
			var cancelPISBs = true;
			var emailList = JSON.parse(appSettings.readAppSetting("General Settings", "Duplicate PI and PISB email list") );
			var savedSearchIdJSON = JSON.parse(appSettings.readAppSetting("General Settings", "PI and PISB Duplicates Saved Searches") );
			var emailFrom = emailList.emailFrom //268072; //FROM: SRS Acquiom statements@srsacquiom.com
			var domainURL = url.resolveDomain({ 
				hostType: url.HostType.APPLICATION
			});
			var PaymentInstructionURL = "";
			var emailDupePIs = "";
			var subSts = piListLib.piEnum.subSts;
			var payInstrHoldSts = piListLib.piEnum.payInstrHoldSts;
			var paymtSuspenseReason = piListLib.piEnum.paymtSuspenseReason;
			var paymtInstrHoldReason = piListLib.piEnum.paymtInstrHoldReason;
			var paymtInstrHoldSrc = piListLib.piEnum.paymtInstrHoldSrc;
			var piType = piListLib.piEnum.piType;
			// ********************************* /PARAMETERS ********************************
			
	
			var PIsavedSearch = search.create({
				type: "customrecord_paymt_instr",
				filters:
				[
				   ["custrecord_pi_shareholder","anyof",SHid], 
				   "AND", 
				   ["isinactive","is","F"], 
				   "AND", 
				   ["custrecord_pi_paymt_instr_type","noneof", piType.ExchangeRecord ], 
				   "AND", 
				   ["count(id)","greaterthan","1"]
				],
				columns:
				[
				   search.createColumn({
					  name: "custrecord_pi_shareholder",
					  summary: "GROUP",
					  sort: search.Sort.ASC
				   }),
				   search.createColumn({
					  name: "custrecord_pi_paymt_instr_type",
					  summary: "GROUP"
				   }),
				   search.createColumn({
					  name: "custrecord_pi_deal",
					  summary: "GROUP"
				   }),
				   search.createColumn({
					  name: "custrecord_pi_exchange",
					  summary: "COUNT"
				   }),
				   search.createColumn({
					  name: "id",
					  summary: "COUNT"
				   }),
				   search.createColumn({
					  name: "formulatext",
					  summary: "MIN",
					  formula: "REPLACE(NS_CONCAT(TO_CHAR({internalid})), ',', ',')"
				   }),
				   search.createColumn({
					  name: "formulatext",
					  summary: "MIN",
					  formula: "REPLACE(NS_CONCAT(TO_CHAR({custrecord_pi_paymethod})), ',', ',')"
				   }),
				   search.createColumn({
					  name: "formulatext",
					  summary: "MIN",
					  formula: "REPLACE(NS_CONCAT(TO_CHAR({custrecord_pi_paymt_instr_type})), ',', ',')"
				   }),
				   search.createColumn({
					  name: "formulatext",
					  summary: "MIN",
					  formula: "REPLACE(NS_CONCAT(TO_CHAR(NVL({custrecord_pi_deal}, 'NA'))), ',', ',')"
				   }),
				   search.createColumn({
					  name: "formulatext",
					  summary: "MIN",
					  formula: "REPLACE(NS_CONCAT(TO_CHAR({custrecord_pi_exchange})), ',', ',')"
				   })
				]
			 });
			 var searchResultCount = PIsavedSearch.runPaged().count;
			 log.debug("customrecord_paymt_instrSearchObj result count",searchResultCount);
			 PIsavedSearch.run().each(function(result){
				// .run().each has a limit of 4,000 results
				return true;
			 });

			// PI 6. 
			// RUN SEARCH : PI
			var searchResults = PIsavedSearch.run();
			searchResults = searchLibrary.getSearchResultData(searchResults)
			log.debug({
				title: 'loadAndRunSearch-PI',
				details: 'searchResults.length='+searchResults.length
			});
			var searchResultsLength = searchResults.length;

			// Create JSON array of saved search data
			var PIdupes = [];
			for (var i=0; i<searchResultsLength; i++){
				var PI_send_email = [];
				// this part is so stupid, you cannot get values of multiple formula fields so I must manipulate the JSON data
				var searchResultsJSON = searchResults[i].toJSON();
				var searchResultsJSONstring = JSON.stringify(searchResultsJSON);
				var searchResultsJSONparse = JSON.parse( searchResultsJSONstring.replace("MIN(formulatext)","internal_ids").replace("MIN(formulatext)_1", "payment_methods").replace("MIN(formulatext)_2", "payment_type").replace("MIN(formulatext)_3", "deal").replace("MIN(formulatext)_4", "exchange_record") ); //.replace("MIN(formulatext)_2", "PI_type").replace("MIN(formulatext)_3", "PI_deal")
				var internal_ids = searchResultsJSONparse.values.internal_ids;
				var payment_methods = searchResultsJSONparse.values.payment_methods;
				var payment_type = searchResultsJSONparse.values.payment_type;
				var exchange_record = searchResultsJSONparse.values.exchange_record;
				var deal = searchResultsJSONparse.values.deal;

				if (Boolean(internal_ids)){ internal_ids = internal_ids.split(","); }
				if (Boolean(payment_methods)){ payment_methods = payment_methods.split(","); }
				if (Boolean(payment_type)){ payment_type = payment_type.split(","); }
				if (Boolean(exchange_record)){ exchange_record = exchange_record.split(","); }
				if (Boolean(deal)){ deal = deal.split(","); }
				var custrecord_pi_paymt_instr_type = searchResults[i].getValue({"name": "custrecord_pi_paymt_instr_type", "summary": search.Summary.GROUP});
				
				if (custrecord_pi_paymt_instr_type == piType.ExchangeRecord ){  //@TODO payment type eNum  11=ExchangeRecord -- map the dupes for ExRecs
					var counts = {}
					// code below is to count the times we see the ame exRec link to see if its a dupe, the array looks like this = {exRec Internal ID, Number of times we see it}
					exchange_record.forEach(function(ex) { counts[ex] = (counts[ex] || 0)+1; });    // ex: {"644694" : 2}
					var counts = Object.keys(counts).map(function(key) {                            // 0: Array(2)
						return [Number(key), counts[key]];                                          //      0: 644694
					});                                                                             //      1: 2
					var ExRecOrDealDupe = [];
					for (var z = 0; z < exchange_record.length; z++) {
						var match = false;
						for (var j = 0; j < counts.length; j++) {
							if (exchange_record[z] == counts[j][0] && counts[j][1] > 1 ) {
								match = true;
								break;
							}
						}
						if (!match) {
							ExRecOrDealDupe.push(false);
							PI_send_email.push(false);
						} else 
						{ 
							ExRecOrDealDupe.push(true);
							PI_send_email.push(true);
						}
					}
				} else if (custrecord_pi_paymt_instr_type == piType.AcquiomDeal ){  // @TODO eNum map dupes for AcquiomDeals = 10
					// count the Deals like we counted the ExRecs
					var counts = {}
					deal.forEach(function(ex) { counts[ex] = (counts[ex] || 0)+1; });   // ex: {"644694" : 2}
					var counts = Object.keys(counts).map(function(key) {                // 0: Array(2)
						return [key, counts[key]];                                      //      0: DealABC
					});                                                                 //      1: 2
					var ExRecOrDealDupe = [];
					for (var z = 0; z < deal.length; z++) {
						var match = false;
						for (var j = 0; j < counts.length; j++) {
							if (deal[z] == counts[j][0] && counts[j][1] > 1 ) {
								match = true;
								break;
							}
						}
						if (!match) {
							ExRecOrDealDupe.push(false);
							PI_send_email.push(false);
						} else 
						{ 
							ExRecOrDealDupe.push(true);
							PI_send_email.push(true);
						}
					}
				} else {
					var ExRecOrDealDupe = [];
					PI_send_email.push(true);
				}

				// all the PIs we will process will be stored in this array
				PIdupes.push({
					'custrecord_pi_shareholder'     :   searchResults[i].getValue({"name": "custrecord_pi_shareholder", "summary": search.Summary.GROUP}),
					'custrecord_pi_paymt_instr_type':   custrecord_pi_paymt_instr_type,
					'custrecord_pi_deal'            :   searchResults[i].getValue({"name": "custrecord_pi_deal", "summary": search.Summary.GROUP}),
					'id_count'                      :   searchResults[i].getValue({"name": "id", "summary": search.Summary.COUNT}),
					'internal_ids'                  :   internal_ids,
					'payment_method'                :   payment_methods,
					'payment_type'                  :   payment_type,
					'exchange_record'               :   exchange_record,
					'deal'                          :   deal,
					'ExRecOrDealDupe'               :   ExRecOrDealDupe,
					'PI_send_email'                 :   PI_send_email,
					'ON_DUPE_HOLD'                  :   [],
					'CREATED_DUPE_HOLD'             :   [],
					'custrecord_pi_shareholderTEXT'     :   searchResults[i].getText({"name": "custrecord_pi_shareholder", "summary": search.Summary.GROUP}),
					'custrecord_pi_paymt_instr_typeTEXT':   searchResults[i].getText({"name": "custrecord_pi_paymt_instr_type", "summary": search.Summary.GROUP}),
					'custrecord_pi_dealTEXT'            :   searchResults[i].getText({"name": "custrecord_pi_deal", "summary": search.Summary.GROUP}),
				});                
			}
			log.audit('PI 6. FINISHED **********', '******************');
			log.audit('PI 6. PIdupes len='+PIdupes.length , JSON.stringify( PIdupes ) );
			log.audit('PI 6. FINISHED **********', '******************');



			// PI 7. - Add 'ON_DUPE_HOLD' to array (true/false) if the PI's hold rec contains Dupe Reason
			// concatinate array of all the PIs form the search
			var allPIinternalIDs = [];
			for (var i=0; i<PIdupes.length; i++){
				allPIinternalIDs.push(PIdupes[i].internal_ids)
			}
			// flatten array
			var allPIinternalIDs = [].concat.apply([], allPIinternalIDs);
			var holdPIID = [];

			// find Open Dupe Holds and add their hold status
			if ( allPIinternalIDs.length > 0){
				var customrecord_paymt_instr_holdSearchObj = search.create({
					type: "customrecord_paymt_instr_hold",
					filters:
					[
					["custrecord_pihd_paymt_instr","anyof", allPIinternalIDs], 
					"AND", 
					["custrecord_pihd_hold_reason","anyof",paymtInstrHoldReason.Duplicate],     // @TODO eNUm 7 = paymtInstrHoldReason.Duplicate
					"AND", 
					["custrecord_pihd_hold_status","anyof",payInstrHoldSts.Open]      // @TODO eNum 1 = payInstrHoldSts.Open
					],
					columns:
					[
					search.createColumn({
						name: "custrecord_pihd_paymt_instr",
						summary: "GROUP"
					})
					]
				});
				var searchResultCount = customrecord_paymt_instr_holdSearchObj.runPaged().count;
				log.debug("customrecord_paymt_instr_holdSearchObj result count",searchResultCount);
				customrecord_paymt_instr_holdSearchObj.run().each(function(result){
					// loop thru and add to matching PI
					holdPIID.push( result.getValue({"name": "custrecord_pihd_paymt_instr", "summary": search.Summary.GROUP}) );
					return true;
				});
			}


			// PI 7A. Update the ON_DUPE_HOLD from the above search
			for (var i=0; i<PIdupes.length; i++){                       // i = PIdupes array
				for (var x=0; x<PIdupes[i].internal_ids.length; x++){   // x = internal IDs
					for (var y=0; y<holdPIID.length; y++){              // y = array of ids with dupe holds
						if ( PIdupes[i].internal_ids[x] == holdPIID[y] ){
							PIdupes[i].ON_DUPE_HOLD[x] = holdPIID[y];
						}
					}
				}
			}


			var processedPIs = [];
			for (var i=0; i<PIdupes.length; i++){
				for (var x=0; x<PIdupes[i].internal_ids.length; x++){
					processedPIs.push(PIdupes[i].internal_ids[x]);
				}
			}

			// PI 7B. clean up our array by removing any of those already on dupe hold
			// now remove all the PIdupes that Are All ON_DUPE_HOLD = true
			for (var i=0; i<PIdupes.length; i++){
				var totalDupeHoldCount = 0;

				// count where all the ON_DUPE_HOLD = an internal id
				for (var x=0; x<PIdupes[i].internal_ids.length; x++){
					if ( Boolean(PIdupes[i].ON_DUPE_HOLD[x]) ){
						totalDupeHoldCount++
					}
				}

				// if all the internal ids ON_DUPE_HOLDs then its OK to delete from array
				log.audit('PI 7B. end ****** i='+i+' totalDupeHoldCount='+totalDupeHoldCount, 'PIdupes[i].ON_DUPE_HOLD.length == totalDupeHoldCount -> '+(PIdupes[i].ON_DUPE_HOLD.length == totalDupeHoldCount) + '   ----PIdupes[i].internal_ids.length='+PIdupes[i].internal_ids.length + ' PIdupes[i].ON_DUPE_HOLD.length='+PIdupes[i].ON_DUPE_HOLD.length );
				if (PIdupes[i].ON_DUPE_HOLD.length == totalDupeHoldCount && PIdupes[i].ON_DUPE_HOLD.length == PIdupes[i].internal_ids.length ){
					PIdupes.splice(i,1);
					i-- // we modified the array with splice, so accounting for that
				}

			}

			log.audit('PI 7. FINISHED **********', '******************');
			log.audit('PI 7. PIdupes len='+PIdupes.length , JSON.stringify( PIdupes ) );
			log.audit('PI 7. FINISHED **********', '******************');

			var returnThis = [PIdupes, processedPIs];
			//log.debug('returnThis 1', JSON.stringify(returnThis) );
			log.debug('returnThis', returnThis );
			return returnThis;
		}
		//</ATP-986> **************************************************************************************





		return {
			getCurrentDateTime: getCurrentDateTime,
			cleanData: cleanData,
			clearHoldsByPI: clearHoldsByPI,
			findRelatedField: findRelatedField,
			isNotSystemField: isNotSystemField,
			createPaymtHistRecord: createPaymtHistRecord,
			manageHoldStatus: manageHoldStatus,
			createPIHold: createPIHold,
			getEditableReviewEditFields: getEditableReviewEditFields,
			getAllCustomFields: getAllCustomFields,
			getMedallionFields: getMedallionFields,
			getTrackingFields: getTrackingFields,
			getEditableMedallionFields: getEditableMedallionFields,
			getEditableTrackingFields: getEditableTrackingFields,
			returnPIsToBeProcessed	:	returnPIsToBeProcessed
		};
	});