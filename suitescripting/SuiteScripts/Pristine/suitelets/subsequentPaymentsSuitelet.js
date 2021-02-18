/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */

 /* Suitelet called by subsequentPaymentsButton.js. Displays a list of DERs (selectable by radio buttons)
  * and a Submit button. Whichever DER the user selects will be used as a basis to clone ExRecs and Certs from.
  * Calls subsequentPaymentsMapReduce.js
  */

define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/url', '/SuiteScripts/Pristine/libraries/searchResultsLibrary.js', '/SuiteScripts/Pristine/libraries/subsequentPaymentsLibrary.js'], 
function(serverWidget, search, task, url, searchResultsLibrary, subsequentPaymentsLibrary) {
	function onRequest(context) {

		// GET AND POST REQUESTS
		if (context.request.method === 'GET') {

			var currentDER = context.request.parameters.custscript_this_der;
			var derPayoutType = context.request.parameters.custscript_der_payout_type;
			var derPayDate = context.request.parameters.custscript_der_pay_date;

			// find DERs eligible for the process
			var filters = [];
			filters.push(search.createFilter({
				name: 'internalid',
				operator: 'noneof',
				values: currentDER
			}));

			var columns = [];
			columns.push(search.createColumn({
				name: 'internalid',
				sort: search.Sort.DESC
			}));
			columns.push('name');
			var derSearch = subsequentPaymentsLibrary.findDERsByDeal(context.request.parameters.custscript_deal,
				filters, columns).run();
			var all = searchResultsLibrary.getSearchResultData(derSearch);

			// display data
			var form = serverWidget.createForm({
				title: 'Subsequent Payments Creation'
			});
			// DERs are listed as radio buttons
			var derList = form.addFieldGroup({
				id: 'derlist',
				label: 'Select a related DER to copy:'
			});
			var allColumns = derSearch.columns,
				radioButtonList = [];
			for(var i = 0; i < all.length; i++) {
				var derId = all[i].getValue(allColumns[0].name);
				radioButtonList.push(form.addField({
					id: 'derradio',
					source: derId,
					type: serverWidget.FieldType.RADIO,
					label: derId + ' - ' + all[i].getValue(allColumns[1].name),
					container: 'derlist'
				}));
			}
			radioButtonList[0].defaultValue = all[0].getValue(allColumns[0].name); // this should be the first in the list

			// Hidden fields for data we need behind-the-scenes
			var thisDer = form.addField({
				id: 'thisderfield',
				label: 'This DER',
				type: serverWidget.FieldType.INTEGER
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			thisDer.defaultValue = currentDER;
			var thisDerPayoutType = form.addField({
				id: 'thisderpayouttypefield',
				label: 'This DER Payout Type',
				type: serverWidget.FieldType.INTEGER
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			thisDerPayoutType.defaultValue = derPayoutType;
			var thisDerPayDate = form.addField({
				id: 'thisderpaydatefield',
				label: 'This DER Pay Date',
				type: serverWidget.FieldType.DATETIMETZ
			}).updateDisplayType({
				displayType : serverWidget.FieldDisplayType.HIDDEN
			});
			thisDerPayDate.defaultValue = derPayDate;

			var submitButton = form.addSubmitButton({
		 		label: 'Submit'
			});

			context.response.writePage(form);

		} else { // context.request.method === 'POST'

			// call subsequentPaymentsMapReduce.js
			var mapReduceTask = task.create({
				taskType: 'MAP_REDUCE',
				scriptId: 'customscript_subsequent_pmts_exrecs',
				deploymentId: 'customdeploy_subsequent_pmts_exrecs',
				params: {
					custscript_der_id: context.request.parameters.derradio,
					custscript_this_der_mapreduce: context.request.parameters.thisderfield,
					custscript_this_der_payouttype: context.request.parameters.thisderpayouttypefield,
					custscript_der_pay_date: context.request.parameters.thisderpaydatefield
				}
			});
			var myTask = mapReduceTask.submit();

			var thisDer = context.request.parameters.thisderfield;
            var derURL = url.resolveRecord({
                recordType: 'customrecord_payment_import_record',
                recordId: thisDer
            });

			var form = serverWidget.createForm({
				title: 'Subsequent Payments Creation'
			});
			var seeYa = form.addField({
				id: 'seeya',
				label: 'Thank you!',
				type: serverWidget.FieldType.INLINEHTML
			});
			seeYa.defaultValue = 'The Subsequent Payments Creation process has started. ' + 
				'You will receive an email when it is complete.\n\n' + 
				'<a href=' + derURL + '>Click here to return to the DER.</a>';

			context.response.writePage(form);
		}
		// END GET AND POST REQUESTS
	}

	return {
		onRequest: onRequest
	};	
});