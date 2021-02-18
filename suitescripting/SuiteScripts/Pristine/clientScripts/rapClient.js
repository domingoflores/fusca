/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@brunno
 */

define(['N/record', 'N/format', 'N/runtime', 'N/error'],

	function(record, format, runtime, error) {

		var currentDateTime = null;
		var currentUser = null;
		var checkboxFields = [];
		var tsFields = [];
		var userFields = [];

		function pageInit(context) {
			console.log('pageInit');
			var checkboxes = ['custrecord_security_holders_checkbox', 'custrecord_buyer_checkbox', 'custrecord_broker_checkbox', 'custrecord_other_checkbox'];
			var fields = ['custrecord_security_holders_amount', 'custrecord_buyer_amount', 'custrecord_broker_amount', 'custrecord_other_amount'];
			setFieldDisplayType(context, checkboxes, fields);

		}

		function fieldChanged(context) {
			console.log('fieldChanged', 'context: ' + JSON.stringify(context));

			// SECURITY HOLDERS CHECKBOX AND AMOUNT
			var checkboxes = [];
			var fields = [];
			if (context.fieldId === 'custrecord_security_holders_checkbox') {
				checkboxes = ['custrecord_security_holders_checkbox'];
				fields = ['custrecord_security_holders_amount'];
				setFieldDisplayType(context, checkboxes, fields);
			}

			// BUYERS HOLDERS CHECKBOX AND AMOUNT

			if (context.fieldId === 'custrecord_buyer_checkbox') {
				checkboxes = ['custrecord_buyer_checkbox'];
				fields = ['custrecord_buyer_amount'];
				setFieldDisplayType(context, checkboxes, fields);

			}

			// BROKERS CHECKBOX AND AMOUNT

			if (context.fieldId === 'custrecord_broker_checkbox') {
				checkboxes = ['custrecord_broker_checkbox'];
				fields = ['custrecord_broker_amount'];
				setFieldDisplayType(context, checkboxes, fields);
			}

			// OTHER CHECKBOX AND AMOUNT

			if (context.fieldId === 'custrecord_other_checkbox') {
				checkboxes = ['custrecord_other_checkbox'];
				fields = ['custrecord_other_amount'];
				setFieldDisplayType(context, checkboxes, fields);
			}

			// READ DEAL TICKET CHECKBOX - SETS USER AND TIMESTAMP

			if (context.fieldId === 'custrecord_read_deal_ticket') {
				checkboxFields = ['custrecord_read_deal_ticket'];
				tsFields = ['custrecord_read_deal_ticket_ts'];
				userFields = ['custrecord_read_deal_ticket_by'];

				setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields);
			}

			// READ DOCKET CHECKBOX - SETS USER AND TIMESTAMP

			if (context.fieldId === 'custrecord_read_docket') {
				checkboxFields = ['custrecord_read_docket'];
				tsFields = ['custrecord_read_docket_ts'];
				userFields = ['custrecord_read_docket_by'];

				setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields);
			}
		}

		function saveRecord(context) {
			console.log('saveRecord');
			// var currentRecord = context.currentRecord;
			// if (!currentRecord.getValue({
			// 		fieldId: 'entity'
			// 	}) || currentRecord.getLineCount({
			// 		sublistId: 'item'
			// 	}) < 1)
			// 	throw error.create({
			// 		name: 'MISSING_REQ_ARG',
			// 		message: 'Please enter all the necessary fields on the salesorder before sa
			// 		ving '
			// 	});
			// return true;

			// This code was intendeed to catch an amount unfilled when checkbox checked
			// var checkboxes = ['custrecord_security_holders_checkbox', 'custrecord_buyer_checkbox', 'custrecord_broker_checkbox', 'custrecord_other_checkbox'];
			// var fields = ['custrecord_security_holders_amount', 'custrecord_buyer_amount', 'custrecord_broker_amount', 'custrecord_other_amount'];
			// var checkResult = checkLogicalMandatoryFields(context, checkboxes, fields);
			// if (!checkResult.success) {
			// 	throw error.create({
			// 		name: 'Blank mandatory fields',
			// 		message: checkResult.message
			// 	});
			// }
			return true;
		}

		function setTimeStampAndCurrentUser(context, checkboxFields, tsFields, userFields) {
			for (var i = 0; i < checkboxFields.length; i++) {
				var fieldValue = context.currentRecord.getValue({
					fieldId: checkboxFields[i]
				});

				if (fieldValue) {
					currentDateTime = getCurrentDateTime();
					currentUser = runtime.getCurrentUser().id;
				} else {
					currentDateTime = '';
					currentUser = '';
				}
				context.currentRecord.setValue({
					fieldId: tsFields[i],
					value: currentDateTime,
					ignoreFieldChange: true

				});
				context.currentRecord.setValue({
					fieldId: userFields[i],
					value: currentUser,
					ignoreFieldChange: true

				});
			}
		}

		function getCurrentDateTime() {
			// grabs the current Javascript Date/Time and parses it into a format NetSuite accepts
			var now = new Date();
			return format.parse({
				value: now,
				type: format.Type.DATETIMETZ
			});
		}

		function setFieldDisplayType(context, checkboxes, fields) {
			for (var i = 0; i < fields.length; i++) {
				var objField = context.currentRecord.getField({
					fieldId: fields[i]
				});
				console.log('setFieldDisplayType', 'objField: ' + JSON.stringify(objField));
				var checkbox = context.currentRecord.getValue({
					fieldId: checkboxes[i]
				});
				console.log('setFieldDisplayType', 'checkbox: ' + JSON.stringify(checkbox));
				if (checkbox) {
					objField.isDisabled = false;
					objField.isMandatory = true;
				} else {
					objField.isDisabled = true;
					objField.isMandatory = false;
					context.currentRecord.setValue({
						fieldId: fields[i],
						value: '',
						ignoreFieldChange: true
					});
				}
			}
		}

		function checkLogicalMandatoryFields(context, checkboxes, fields) {
			var checkbox = null;
			var amountField = null;
			var success = true;
			var message = '';

			for (var i = 0; i < fields.length; i++) {
				checkbox = context.currentRecord.getValue({
					fieldId: checkboxes[i]
				});
				console.log('setFieldDisplayType', 'checkbox: ' + JSON.stringify(checkbox));
				amountField = context.currentRecord.getValue({
					fieldId: fields[i]
				});
				console.log('setFieldDisplayType', 'checkbox: ' + JSON.stringify(checkbox));
				var objField = context.currentRecord.getField({
					fieldId: fields[i]
				});
				console.log('setFieldDisplayType', 'objField: ' + JSON.stringify(objField));
				if (checkbox) {
					if (!amountField || amountField === '' || amountField === 0) {
						success = false;
						message += objField.label + ' is mandatory;<br>'; 
					}
				}

			}
			return {
				success: success,
				message: message
			};
		}
		return {
			fieldChanged: fieldChanged,
			pageInit: pageInit,
			saveRecord: saveRecord
		};
	});