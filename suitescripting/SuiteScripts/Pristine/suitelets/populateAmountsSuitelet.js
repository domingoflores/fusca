/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

 /* Suitelet called by subsequentPaymentsButton.js. Displays a list of Release Approvals (selectable by radio buttons)
  * and a Submit button. Whichever Release Approval the user selects will be used as a basis to pull amounts from.
  * Calls subsequentPaymentsPopAmtsMapReduce.js
  */

define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/file', 'N/url', 'N/record', '/SuiteScripts/Pristine/libraries/searchResultsLibrary.js', '/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'], 
function(serverWidget, search, task, file, url, record, searchResultsLibrary, subsequentPaymentsLibrary) {
	function onRequest(context) {
		// GET AND POST REQUESTS
		if (context.request.method === 'GET') {
			var validReleaseApprovals = subsequentPaymentsLibrary.findValidReleaseApprovals(context.request.parameters.custscript_pop_amts_deal),
				// this ^^^ search is run twice in case the user has not refreshed their screen in some time
				currentDER = context.request.parameters.custscript_pop_amts_der;

			// display data
			var form = serverWidget.createForm({
				title: 'Populate LOT Certificate Amounts'
			});

			var releaseApprovalList = form.addFieldGroup({
				id: 'releaseapprovallist',
				label: 'Select a related Release Approval Process record to use:'
			});

			var radioButtonList = [];
			for(var i = 0; i < validReleaseApprovals.length; i++) {
				var releaseApprovalId = validReleaseApprovals[i].internalid;
				radioButtonList.push(form.addField({
					id: 'releaseapprovalradio',
					source: releaseApprovalId,
					type: serverWidget.FieldType.RADIO,
					label: releaseApprovalId + ' - ' + validReleaseApprovals[i].name,
					container: 'releaseapprovallist'
				}));
			}
			radioButtonList[0].defaultValue = validReleaseApprovals[0].internalid; // this should be the first in the list

			// Hidden fields for data we need behind-the-scenes
			var exRecFileId = form.addField({
				id: 'exrecfileid',
				label: 'ExRec File ID',
				type: serverWidget.FieldType.INTEGER
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			exRecFileId.defaultValue = context.request.parameters.custscript_pop_amts_exrecs;
			var thisDer = form.addField({
				id: 'thisderfield',
				label: 'This DER',
				type: serverWidget.FieldType.INTEGER
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			thisDer.defaultValue = currentDER;

			var submitButton = form.addSubmitButton({
		 		label: 'Submit'
			});

			context.response.writePage(form);

		} else { // context.request.method === 'POST'

			var selectedReleaseApproval = context.request.parameters.releaseapprovalradio,
				exRecFileId = context.request.parameters.exrecfileid,
				thisDer = context.request.parameters.thisderfield;

			// mark this DER with the selected Release Approval record so it can't be reused
			updateReleaseApprovalValue(selectedReleaseApproval);
            
            // find the journal entries on this Release Approval Record
			var journalEntryLookup = search.lookupFields({
				type: 'customrecord_escrow_payment_approvals',	// Release Approval Record
				id: selectedReleaseApproval,
				columns: 'custrecord_release_journals'
			});
			var journalEntries = [];
			for(var i = 0; i < journalEntryLookup.custrecord_release_journals.length; i++) {
				journalEntries.push(journalEntryLookup.custrecord_release_journals[i].value);
			}

			// search for all Escrow Transactions related to those Journal Entries
			var escrowTxSearch = createEscrowTxSearch(journalEntries);
				// sample data
				// [{"values":{"SUM(custrecord70)":"-2001513.49","GROUP(custrecord_escrow_tx_created_from_cert)":[{"value":"","text":"- None -"}]}}, ...]

			// find the ExRecs attached to this DER and their attached Certs
			var attachedExRecs = file.load({
				id: exRecFileId
			}).getContents().split(',');
			file.delete({
				id: exRecFileId
			});
			
			var attachedCerts = findAttachedCerts(attachedExRecs);
				// sample data
				// [{"recordType":"customrecord_acq_lot_cert_entry","id":"261268",
				// "values":{"custrecord_created_from_cert_id":[],
				// "custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_acq_lot_priority_payment":[{"value":"4","text":"AES"}]}}, ...]

			// compare the attached Cert's parents to the Certs specified on the Escrow Transactions - match up the amounts to the New Cert ID
			var amountMap = [];
			for(var i = 0; i < attachedCerts.length; i++) {
				for(var j = 0; j < escrowTxSearch.length; j++) {
					if(attachedCerts[i].getValue('custrecord_created_from_cert_id') != '' 
						&& attachedCerts[i].getValue('custrecord_created_from_cert_id') == escrowTxSearch[j].getValue({
							name: 'custrecord_escrow_tx_created_from_cert',
							summary: 'GROUP'
						}))
					{
						amountMap.push({
							newCert: attachedCerts[i].id,
							amount: (escrowTxSearch[j].getValue({
								name: 'custrecord70',
								summary: 'SUM'
							})) * -1,					// needs to be inverse
							priorityPaymentType: attachedCerts[i].getValue({
			                    name: 'custrecord_acq_lot_priority_payment',
			                    join: 'custrecord_acq_lotce_zzz_zzz_parentlot'
			                })	// PPE-165
						});
						break;
					}
				}
			}

			var derURL = url.resolveRecord({
                recordType: 'customrecord_payment_import_record',
                recordId: thisDer
            });

			var form = serverWidget.createForm({
				title: 'Populate LOT Certificate Amounts'
			});

			var formLabel,
				formMessage,
				returnMessage = '<a href=' + derURL + '>Click here to return to the DER.</a>';
			// PPE-129 - Handle if Created From Cert values are not populated
			if(amountMap.length == 0) {
				formLabel = 'There has been a problem.';
				formMessage = 'Amount data was not found. Please check if Created From Cert values ' + 
				'were populated during the import process. If this is not the issue, ' + 
				'please inform your NetSuite administrators.\n\n';

				// blank out our Release Approval Selection
				updateReleaseApprovalValue('');
			} else {
				formLabel = 'Thank you!';
				formMessage = 'The Certificate Amount Population process has started. ' + 
				'You will receive an email when it is complete.\n\n';
		
				var amountMapFile = file.create({
					name: 'amountMap' + exRecFileId,
					fileType: file.Type.JSON,
					contents: JSON.stringify(amountMap),
					folder: 6622558
				});
				var amountMapFileId = amountMapFile.save();

				// create subsequentPaymentsPopAmtsMapReduce.js task
				var mapReduceTask = task.create({
					taskType: 'MAP_REDUCE',
					scriptId: 'customscript_subsequent_pmts_pop_amts_mr',
					deploymentId: 'customdeploy_subsequent_pmts_pop_amts_mr',
					params: {
						custscript_amt_map_file: amountMapFileId
					}
				});
				var myTask = mapReduceTask.submit();
			}

			var seeYa = form.addField({
				id: 'seeya',
				label: formLabel,
				type: serverWidget.FieldType.INLINEHTML
			});
			seeYa.defaultValue = formMessage + returnMessage;

			context.response.writePage(form);
		}
		// END GET AND POST REQUESTS

		function createEscrowTxSearch(entries) {
			var summarySearch = createSummaryEscrowTxSearch(entries);
			var indivSearch = createIndivEscrowTxSearch(entries);

			// columns
			var columns = [];
			columns.push(search.createColumn({
				name: 'custrecord_escrow_tx_created_from_cert',
				summary: 'GROUP'
			}));
			columns.push(search.createColumn({
				name: 'custrecord70',
				summary: 'SUM'
			}));

			// filters
			var filters = [];
			filters.push(search.createFilter({
				name: 'custrecord_journal_id',
				operator: 'anyof',
				values: entries
			}));
			filters.push(search.createFilter({
				name: 'isinactive',
				operator: 'is',
				values: 'F'
			}));	

			var mySearch = search.create({
				type: 'customrecord18',
				filters: filters,
				columns: columns
			}).run();

			return searchResultsLibrary.getSearchResultData(mySearch);
		}

		function updateReleaseApprovalValue(submitValue) {
			record.submitFields({
                type: 'customrecord_payment_import_record',
                id: thisDer,
                values: {
                    custrecord_release_approval_record: submitValue
                }
        	});
		}

		function createIndivEscrowTxSearch(entries) {
			// columns
			var columns = [];
			columns.push(search.createColumn({
				name: 'custrecord_escrow_tx_created_from_cert'
			}));
			columns.push(search.createColumn({
				name: 'custrecord70'
			}));			
		}

		function createSummaryEscrowTxSearch(entries) {
			// columns
			var columns = [];
			columns.push(search.createColumn({
				name: 'custrecord_escrow_tx_created_from_cert',
				summary: 'GROUP'
			}));
			columns.push(search.createColumn({
				name: 'custrecord70',
				summary: 'SUM'
			}));

			// filters
			var filters = [];
			filters.push(search.createFilter({
				name: 'custrecord_journal_id',
				operator: 'anyof',
				values: entries
			}));
			filters.push(search.createFilter({
				name: 'isinactive',
				operator: 'is',
				values: 'F'
			}));	

			return search.create({
				type: 'customrecord18',
				filters: filters,
				columns: columns
			}).run();
		}

		function createReleaseApprovalSearch(deal) {
			// columns
			var columns = [];
			columns.push(search.createColumn({
				name: 'internalid', 
				sort: search.Sort.DESC
			}));
			columns.push('name');
			
			return subsequentPaymentsLibrary.findReleaseApprovalsByDeal(deal, [], columns).run();
		}

		function findAttachedCerts(exRecList) {
			var certSearch = search.create({
                type: 'customrecord_acq_lot_cert_entry',
                columns: ['custrecord_created_from_cert_id'
                    , 'custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_acq_lot_priority_payment'],
                filters: [
                    ['custrecord_acq_lotce_zzz_zzz_parentlot', 'anyof', exRecList]
                ]
            }).run();
			return searchResultsLibrary.getSearchResultData(certSearch);
		}
	}

	return {
		onRequest: onRequest
	};	
});