/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'],

	/**
	 * -----------------------------------------------------------
	 * calcPendingDistributionsByDeal.js
	 * ___________________________________________________________
	 * Module runs before load when user views, edits, creates or copies
	 * a Deal Event record. It runs a search to find the total of 
	 * the Payment Amounts for all certificates belonging to the 
	 * Pending Distributions shareholder of the Deal.
	 * This total is displayed in the Pending Distributions field of 
	 * the Deal Event.
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * ___________________________________________________________
	 */

	function(record, search) {

		function beforeLoad(context) {
			log.debug({
				title: 'Function beforeLoad:',
				details: 'Start'
			});
			var UEType = context.type;
			log.debug({
				title: 'Context Type:',
				details: 'UEType: ' + UEType
			});
			//Check the Event Type - only Edit, Create, Copy, VIEW
			switch (context.type) {
				case context.UserEventType.VIEW:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
					break;
				default:
					return;
			}
			// First read the Deal Event record which has just been saved clientside 
			var dealEventRecord = context.newRecord;
			var dealID = dealEventRecord.getValue('custrecord_pay_import_deal');
			log.debug({
				title: 'dealID:',
				details: 'dealID: ' + dealID
			});
			var pendingDistributionTotal = 0;
			var pendingDistributionRows = getPendingDistributionTotal(dealID);
			if (pendingDistributionRows.length > 0) {
				pendingDistributionTotal = pendingDistributionRows[0].getValue({
					name: 'custrecord_acq_lotce_zzz_zzz_payment',
					join: 'custrecord_acq_lotce_zzz_zzz_parentlot',
					summary: search.Summary.SUM
				});
			}
			dealEventRecord.setValue('custrecord_de_pending_distr', pendingDistributionTotal);

			function getPendingDistributionTotal(dealID) {
				var PDSearch = search.create({
					type: 'customrecord_acq_lot', //Exchange Record
					title: 'Pend Distr Total',
					columns: [{
						name: 'custrecord_acq_loth_zzz_zzz_deal', //Group by Deal
						summary: search.Summary.GROUP
					}, {
						name: 'custrecord_acq_lotce_zzz_zzz_payment', //Cert Payment Amount
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot', //LOT Cert
						summary: search.Summary.SUM
					}],
					filters: [{
						name: 'custrecord_acq_loth_zzz_zzz_deal',
						operator: search.Operator.IS,
						values: dealID //Deal ID
					}, {
						name: 'custrecord_acq_loth_zzz_zzz_shareholder',
						operator: search.Operator.IS,
						values: 726756 //Pending Distributions Shareholder ID
					}, {
						name: 'isinactive',
						operator: search.Operator.IS,
						values: 'F'
					}, {
						name: 'isinactive',
						join: 'custrecord_acq_lotce_zzz_zzz_parentlot', //LOT Cert 
						operator: search.Operator.IS,
						values: 'F'
					}]
				}).run();
				var searchResults = PDSearch.getRange(0, 100);

				return searchResults;
			}

		}

		return {
			beforeLoad: beforeLoad
		};
	});