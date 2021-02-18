/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/url', 'N/search', 'N/runtime', 'N/file', '/SuiteScripts/Pristine/libraries/redirectButtonLibrary.js', '/SuiteScripts/Pristine/libraries/searchResultsLibrary.js', '/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'],

	/**
	 * -----------------------------------------------------------
	 * subsequentPaymentsButton.js
	 * ___________________________________________________________
	 * Does or does not display buttons related to the Subsequent Payments Process
	 * depending on criteria specified below.
	 * Calls one of two different Suitelets: subsequentPaymentsSuitelet.js or
	 * populateAmountsSuitelet.js 
	 *
	 * Version 1.0
	 * Author: Alana Thomas
	 *
	 * ATO-126 - Hotfix to fix error we think was caused by Netsuite 2019.1
	 * ___________________________________________________________
	 */

	function(url, search, runtime, file, redirectButtonLibrary, searchResultsLibrary, subsequentPaymentsLibrary) {

		function beforeLoad (context) {
			if(runtime.executionContext == 'USERINTERFACE' && context.type == 'view') {

				if(checkValidUser(runtime.getCurrentUser().id) // the user has the Subsequent Payments permission	
				&& checkScriptAvailability(['1235','1233','1237'])) { // the map/reduce scripts are available
					var attachedExRecs = findAttachedExRecs(context.request.parameters.id);
					var thisDeal = lookupAField('customrecord_payment_import_record', context.request.parameters.id, 'custrecord_pay_import_deal');
					var thisDer = context.request.parameters.id;
					if(attachedExRecs.length == 0) { 	// this DER has no ExRecs currently					
						var thisPayoutType = lookupAField('customrecord_payment_import_record', context.request.parameters.id, 'custrecord_pay_import_release_type');
						var thisPayDate = search.lookupFields({
							type: 'customrecord_payment_import_record',
							id: context.request.parameters.id,
							columns: 'custrecord_pay_import_pay_date'
						}).custrecord_pay_import_pay_date;

						var linkURL = url.resolveScript({
							scriptId: 'customscript_subsequent_pmts_suitelet',
							deploymentId: 'customdeploy_subsequent_pmts_suitelet',
							params: {
								custscript_deal: thisDeal,
								custscript_this_der: thisDer,
								custscript_der_payout_type: thisPayoutType,
								custscript_der_pay_date: thisPayDate
							}
						});

						redirectButtonLibrary.addRedirectButton({
							context: context,
							linkURL: linkURL, 
							label: 'Create Subsequent Pmts'
						});
					} else { // there are ExRecs attached to this DER - see if they need amounts
						var isSRS = search.lookupFields({
							type: 'customer',
							id: thisDeal,
							columns: 'custentitycustomer_oppo_acceptype_regsrs'
						}).custentitycustomer_oppo_acceptype_regsrs;
						var releaseRecords = subsequentPaymentsLibrary.findValidReleaseApprovals(thisDeal);
						if(isSRS // only show if SRS
						&& checkAmounts(attachedExRecs) == 0	// and if there are no amounts attached
						&& releaseRecords.length > 0) { // and if there are release records that meet the necessary criteria

							// create and store file with attachedExRecs
							attachedExRecsStr = JSON.stringify(attachedExRecs);
							attachedExRecsStr = attachedExRecsStr.slice(1,attachedExRecsStr.length-1);
							attachedExRecsStr = attachedExRecsStr.replace(/\"/g, "");
							var exRecFile = file.create({
								name: 'attachedExRecs' + context.request.parameters.id,
								fileType: file.Type.JSON,
								contents: attachedExRecsStr,
								folder: 6622558
							});
							var exRecFileId = exRecFile.save();

							var linkURL = url.resolveScript({
								scriptId: 'customscript_subsequent_pmts_pop_amts_s',
								deploymentId: 'customdeploy_subsequent_pmts_pop_amts_s',
								params: {
									custscript_pop_amts_deal: thisDeal,
									custscript_pop_amts_exrecs: exRecFileId,
									custscript_pop_amts_der: thisDer
								}
							});

							redirectButtonLibrary.addRedirectButton({
								context: context,
								linkURL: linkURL, 
								label: 'Populate Cert Amounts'
							});
						}
					}
				}
			}
		}

		// Helper Functions
		function lookupAField(type, id, field) {
			// shorthand function for search.lookupFields
			// handles if there is no value in the field
			var myField = search.lookupFields({
				type: type,
				id: id,
				columns: field
			});
			return (myField[field].length == 0 ? '' : myField[field][0].value);
		}

		function checkAmounts(attachedExRecs) {
			// Queries the amounts attached to the certificates attached to the exrecs
			var certSearch = findAttachedCerts(attachedExRecs);
			return certSearch[0].getValue({
				name: 'custrecord_acq_lotce_zzz_zzz_payment',
				summary: search.Summary.SUM
			});
		}

		function findAttachedCerts(exRecList) {
			// Searches for all Certificates attached to all the ExRecs attached to this DER
			var columns = [];
			columns.push(search.createColumn({
				name: 'custrecord_acq_lotce_zzz_zzz_payment',
				summary: search.Summary.SUM
			}));
			//return subsequentPaymentsLibrary.findCertsByExRec(exRecList, columns);
			var certSearch = search.create({
				type: 'customrecord_acq_lot_cert_entry',
				columns: columns,
				filters: [
					['custrecord_acq_lotce_zzz_zzz_parentlot', 'anyof', exRecList]
				]
			}).run();
			return searchResultsLibrary.getSearchResultData(certSearch);
		}

		function checkScriptAvailability(scriptsToSearch) {
			var filters = [];
			filters.push(search.createFilter({
				name: 'percentcomplete',
				operator: search.Operator.LESSTHAN,
				values: '100'
			}));
			filters.push(search.createFilter({
				name: 'script',
				join: 'scriptdeployment',
				operator: search.Operator.ANYOF,
				values: scriptsToSearch
			}));	
			var scriptSearch = search.create({
				type: 'scheduledscriptinstance',
				columns: 'datecreated',
				filters: filters
			}).run();
			return checkForAny(scriptSearch);
		}

		function checkForAny(searchResultSet) {
			// Shorthand function for finding if there is anything that meets the criteria
			// when you don't care how many
			var results = searchResultSet.getRange({
				start: 0,
				end: 1
			});
			if(results.length == 0) {
				return true;
			}		
			return false;
		}

		function checkValidUser(currentUser) {
			// only users with the Subsequent Payment Creation permission can see the buttons
			var empSearch = search.create({
				type: 'employee',
				columns: ['internalid'],
				filters: [
					['custentity_subsequent_payments', 'is', 'T']
				]
			}).run();

			var searchResults = searchResultsLibrary.getSearchResultData(empSearch);
			for(var i = 0; i < searchResults.length; i++) {
				var testId = searchResults[i].id;
				if(currentUser.toString() === testId.toString()) {
					return true;
				}
			}
			return false;
		}

		function findAttachedExRecs(thisDer) {	
			// finds all ExRecs attached to the current DER and returns a list of their internal IDs
			var exRecSearch = search.create({
				type: 'customrecord_acq_lot',
				columns: ['internalid'],
				filters: [
					['custrecord_acq_lot_payment_import_record', 'is', thisDer]
				]
			}).run();

			var exRecSearchResults = searchResultsLibrary.getSearchResultData(exRecSearch);
			var exRecList = [];
			for(var i = 0; i < exRecSearchResults.length; i++) {
				exRecList.push(exRecSearchResults[i].getValue('internalid'));
			}

			return exRecList;
		}

		return {
			beforeLoad: beforeLoad
		};
	});