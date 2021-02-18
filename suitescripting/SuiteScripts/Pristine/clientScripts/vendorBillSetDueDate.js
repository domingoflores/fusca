/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/ui/dialog', 'N/search', 'N/format'],
	/**
	 * -----------------------------------------------------------
	 * vendorBillSetDueDate.js
	 * ___________________________________________________________
	 * Sets the Due Date on a Vendor Bill based on custom Invoice Date entered 
	 * as opposed to the native Date field which defaults to today.  
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2018-02-05	
	 * ___________________________________________________________
	 */
	function(msg, dialog, search, format) {
		var tranDate = null;
		var dueDate = new Date();
		var invoiceDate = null;
		var daysuntilnetdue = 0;
		var terms = null;

		function pageInit(context) {
			// console.log('pageInit context: ' + JSON.stringify(context));
			setDueDate(context);
		}

		function fieldChanged(context) {
			// console.log(' fieldChanged context: ' + JSON.stringify(context));
			// If either the Terms or the Invoice Date or the Date is changed then set the Due Date correctly
			if (context.fieldId === 'terms' || context.fieldId === 'custbody_vendor_bill_invoice_date' || context.fieldId === 'trandate') {
				setDueDate(context);
			}
		}

		function saveRecord(context) {
			// console.log(' saveRecord context: ' + JSON.stringify(context));
			setDueDate(context);
			return true;
		}

		function setDueDate(context) {
			// console.log(' setDueDate context: ' + JSON.stringify(context));
			// Get the Terms
			terms = parseInt(context.currentRecord.getValue({
				fieldId: 'terms'
			})) || null;
			// console.log('setDueDate terms: ' + terms);

			// Get terms days until net due 
			if (terms) {
				var searchResult = search.lookupFields({
					type: search.Type.TERM,
					id: terms,
					columns: ['daysuntilnetdue']
				});
				daysuntilnetdue = parseInt(searchResult.daysuntilnetdue) || 0;		
			} else {
				daysuntilnetdue = 0;	
			}
			// console.log('setDueDate daysuntilnetdue: ' + daysuntilnetdue);

			// Get the custom Invoice Date
			invoiceDate = context.currentRecord.getValue({
				fieldId: 'custbody_vendor_bill_invoice_date'
			}) || null;
			// console.log('setDueDate invoiceDate: ' + invoiceDate);

			if (invoiceDate) {
				dueDate = invoiceDate;
				dueDate.setDate(dueDate.getDate() + daysuntilnetdue);
			} else {
				// Use the transaction date
				tranDate = context.currentRecord.getValue({
					fieldId: 'trandate'
				}) || null;
			
				if (tranDate) {
					dueDate = tranDate;
					dueDate.setDate(dueDate.getDate() + daysuntilnetdue);
					// console.log('setDueDate dueDate: ' + dueDate);
				}
			}
			context.currentRecord.setValue({
				fieldId: 'duedate',
				value: dueDate
			});
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			saveRecord: saveRecord
		};
	});