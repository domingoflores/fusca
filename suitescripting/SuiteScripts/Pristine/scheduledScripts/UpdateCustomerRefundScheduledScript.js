/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define(['N/record', 'N/search', 'N/runtime', 'N/email', 'N/file'],

	/**
	 * -----------------------------------------------------------
	 * UpdateCustomerRefundScheduledScript.js
	 * ___________________________________________________________
	 * Module builds a scheduled script to update Customer Refunds that
	 * are included in a Payment File from a Payment File Creation record
	 *
	 * Version 1.0
	 * Author: Scott Streule & Alana Thomas
	 * ___________________________________________________________
	 */

	function(record, search, runtime, email, file) {
		'use strict';

		var payFileCreationRecordID = null;

		function execute(context) {
			var scriptObj = runtime.getCurrentScript();
			
			log.error("OBSOLETE SCRIPT" ,"This script has been replaced by PaymentFileApprovedUpdateCustRefunds.js");
			throw "OBSOLETE SCRIPT - This script has been replaced by PaymentFileApprovedUpdateCustRefunds.js";
			return;
			
			payFileCreationRecordID = runtime.getCurrentScript().getParameter({
				name: 'custscript_pay_file_creation_id'
			});

			//Load the Payment File Creation Record
			var payFileCreationRecord = record.load({
					type: 'customrecord_payment_file',
					id: payFileCreationRecordID
				});
			//Get the JSON File from the Payment File Record
			var jsonFile = payFileCreationRecord.getValue({
					fieldId: 'custrecord_json_cust_refund_file'
				});
			//Load the JSON File Object
			var jsonFileObject = file.load({
					id: jsonFile
				});
			//Get The Contents of the JSON file
			var jsonFileContents = jsonFileObject.getContents();
			//Split the Contents of the JSON File to get each individual Customer Refund ID
			var custRefundIDs = jsonFileContents.split(',');
			//Initialize a variable for the Customer Refund Record to be used in the For loop
			var customerRefundRecord = null;
			//Loop through all the Customer Refunds and Update the fields
			for(var i = 0; i < custRefundIDs.length; i++){
				//log.debug({title: 'Customer Refund IDs', details: custRefundIDs[i]});
				customerRefundRecord = record.load({
				 	type: record.Type.CUSTOMER_REFUND,
				 	id: custRefundIDs[i]
				 });
				//Update custbody10 (SUBMITTED TO PAYMENT SYSTEM) value
				customerRefundRecord.setValue({
				    fieldId: 'custbody10',
				    value: true,
				    ignoreFieldChange: true
				});
				//Update custbody_pp_payment_method to relect that this record will not be paid using Avid Exchange
				customerRefundRecord.setValue({
				    fieldId: 'custbody_pp_payment_method',
				    value: 4,
				    ignoreFieldChange: true
				});
				//Update custbody_pay_file_record value
				customerRefundRecord.setValue({
				    fieldId: 'custbody_pay_file_record',
				    value: payFileCreationRecordID,
				    ignoreFieldChange: true
				});
				//Save the Customer Refund Record
				refundID = customerRefundRecord.save({
				    enableSourcing: false,
				    ignoreMandatoryFields: false
				});
				log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
			}
			//Set the Status of the Payment File Creation Record to Complete
			payFileCreationRecord.setValue({
				fieldId: 'custrecord_pay_file_status',
			    value: 4,
			    ignoreFieldChange: true
			});
			payFileCreationRecordID = payFileCreationRecord.save({
				enableSourcing: false,
				ignoreMandatoryFields: false
			});



			//log.debug({title: 'JSON File Contents', details: jsonFileObject});
			//log.debug({title: 'JSON.parse', details: contents});
			//log.debug({title: 'JSON.getContents', details: contents2});

			
			return null;
		}

		return {
			execute: execute
		};

	});