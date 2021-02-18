/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/runtime'],
	
	/**
	 * -----------------------------------------------------------
	 * SpreadsheetSubmissionClient.js
	 * ___________________________________________________________
	 * Spreadsheet Submission Record client script
	 *
	 * Version 1.0
	 * Author: Brunno Putnam
	 * Date: 2020-03-04	
	 * ___________________________________________________________
	 */

	function (runtime) {

		var REC;

		var disable_not_mandatory_all = ['custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_type_pa', 'custrecord_ss_submit_report',
			'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc', 'custrecord_ss_submit_exp_doc',
			'custrecord_ss_submit_add_doc', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor', 'custrecord_ss_submit_total', 'custrecord_ss_submit_payout'
		]

		var fields_to_clear = ['name', 'custrecord_ss_submit_deal', 'custrecord_ss_submit_ra', 'custrecord_ss_submit_rm',
			'custrecord_ss_submit_new_doc', 'custrecord_ss_submit_doc_id', 'custrecord_ss_submit_tab', 'custrecord_ss_submit_special',
			'custrecord_ss_submit_submitted', 'custrecord_ss_submit_subtime', 'custrecord_ss_submit_analyst', 'custrecord_ss_submit_sol_eta',
			'custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_type_pa', 'custrecord_ss_submit_report',
			'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth', 'custrecord_ss_submit_foreign',
			'custrecord_ss_submit_exp_doc', 'custrecord_ss_submit_add_doc', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor',
			'custrecord_ss_submit_total', 'custrecord_ss_submit_payout','custrecord_ss_submit_currenc'
		]

		var fields_to_disable = ['custrecord_ss_submit_clo_eta','custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_type_pa',
			'custrecord_ss_submit_report', 'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc',
			'custrecord_ss_submit_exp_doc', 'custrecord_ss_submit_add_doc', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor', 'custrecord_ss_submit_total', 'custrecord_ss_submit_payout'
		]

		var enable_fields_prelim = ['custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_certs', 'custrecord_ss_submit_certs',
			'custrecord_ss_submit_auth', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_exp_doc', 'custrecord_ss_submit_aes'
		];

		var mandatory_prelim = ['custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth',
			'custrecord_ss_submit_foreign', 'custrecord_ss_submit_exp_doc', 'custrecord_ss_submit_aes'
		];

		var enable_non_mandatory_updated_prelim = ['custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth',
			'custrecord_ss_submit_foreign', 'custrecord_ss_submit_exp_doc', 'custrecord_ss_submit_aes'
		];

		var mandatory_prelim_final = ['custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_type_pa',
			'custrecord_ss_submit_report', 'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor'
		];

		var enable_prelim_final = ['custrecord_ss_submit_total', 'custrecord_ss_submit_sol_eta', 'custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_so', 'custrecord_ss_submit_type_pa',
			'custrecord_ss_submit_report', 'custrecord_ss_submit_certs', 'custrecord_ss_submit_auth', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc', 'custrecord_ss_submit_exp_doc',
			'custrecord_ss_submit_add_doc', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor'
		];


		var enable_final = ['custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_pa', 'custrecord_ss_submit_report', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc',
			'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor', 'custrecord_ss_submit_total'
		]

		var mandatory_final = ['custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_pa', 'custrecord_ss_submit_report', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_vendor',
			'custrecord_ss_submit_aes']

		var enable_updated_final = ['custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_type_pa', 'custrecord_ss_submit_report', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc',
			'custrecord_ss_submit_aes', 'custrecord_ss_submit_vendor', 'custrecord_ss_submit_total'
		]

		var enable_subsequent = ['custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_total',
			'custrecord_ss_submit_payout'
		]

		var mandatory_subsequent = ['custrecord_ss_submit_clo_eta', 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_aes', 'custrecord_ss_submit_payout']

		var enable_vschedule = ['custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc', 'custrecord_ss_submit_total']


		function pageInit(context) {

			REC = context.currentRecord;
			var submittedtoAnalyst = REC.getValue("custrecord_ss_submit_submitted");
			if (submittedtoAnalyst == 1) { //DropDown selection = YES
				enableFields(context, ['custrecord_ss_submit_analyst']);
			}

			console.log('Runtime ContextType: ', JSON.stringify(runtime.executionContext));

			var spreadsheetTypeNumber = Number(REC.getValue("custrecord_ss_submit_type"));

			spreadsheetType(context, spreadsheetTypeNumber);
			conditionalMandatory(context, 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc');
			conditionalMandatory(context, 'custrecord_ss_submit_exp_doc', 'custrecord_ss_submit_add_doc');
		}

		function fieldChanged(context) {


			if (context.fieldId == "custrecord_ss_submit_foreign") {
				conditionalMandatory(context, 'custrecord_ss_submit_foreign', 'custrecord_ss_submit_currenc');
			}

			if (context.fieldId == "custrecord_ss_submit_exp_doc") {
				conditionalMandatory(context, 'custrecord_ss_submit_exp_doc', 'custrecord_ss_submit_add_doc');
			}


			if (context.fieldId == "custrecord_ss_submit_submitted") {
				var submittedtoAnalyst = REC.getValue("custrecord_ss_submit_submitted");
				console.log("submittedtoAnalyst value: ", submittedtoAnalyst);

				if (submittedtoAnalyst == 1) { //DropDown selection = YES
					REC.setValue("custrecord_ss_submit_subtime", new Date())
					enableFields(context, ['custrecord_ss_submit_analyst']);
				} else {
					clearFields(context, ['custrecord_ss_submit_analyst']);
					disableFields(context, ['custrecord_ss_submit_analyst']);
					REC.setValue("custrecord_ss_submit_subtime", '');
				}
					
			}

			if (context.fieldId == "custrecord_ss_submit_type") {

				var spreadsheetTypeNumber = Number(REC.getValue("custrecord_ss_submit_type"));

				console.log("spreadsheet type: ", spreadsheetTypeNumber);

				switch (spreadsheetTypeNumber) {
					case 1: // Custom Prefill
					case 2: // Miscellaneous
						console.log("inside the prefill or misc");
						clearFields(context, fields_to_clear);
						notMandatory(context, fields_to_disable);
						disableFields(context, fields_to_disable);
						REC.setValue("custrecord_ss_submit_submitted", 2);
						// The line above 2 = NO this line is there to address the defaulting to NO on a field change
						break;

					case 3: // Prelim
						console.log('case 3 spreadsheet Prelim');
						clearFields(context, fields_to_clear);
						notMandatory(context, disable_not_mandatory_all);
						disableFields(context, disable_not_mandatory_all);
						enableFields(context, enable_fields_prelim);
						yesMandatory(context, mandatory_prelim);
						REC.setValue("custrecord_ss_submit_submitted", 2);
						break;

					case 5: // Updated Prelim
						console.log('case 5 spreadsheet Updated Prelim');
						clearFields(context, fields_to_clear);
						notMandatory(context, disable_not_mandatory_all);
						disableFields(context, disable_not_mandatory_all);
						enableFields(context, enable_non_mandatory_updated_prelim);
						REC.setValue("custrecord_ss_submit_submitted", 2);
						break;

					case 8: //Prelim and Final
						console.log('case 8 spreadsheet Prelim and Final');
						clearFields(context, fields_to_clear);
						notMandatory(context, disable_not_mandatory_all);
						disableFields(context, disable_not_mandatory_all);
						enableFields(context, enable_prelim_final);
						yesMandatory(context, mandatory_prelim_final);
						REC.setValue("custrecord_ss_submit_submitted", 2);
						break;

					case 9: //Final
						console.log('case 9 spreadsheet Final');
						clearFields(context, fields_to_clear);
						notMandatory(context, disable_not_mandatory_all);
						disableFields(context, disable_not_mandatory_all);
						enableFields(context, enable_final);
						yesMandatory(context, mandatory_final);
						REC.setValue("custrecord_ss_submit_submitted", 2);
						break;

					case 6: // Updated Final 
						console.log('case 6 spreadsheet Updated Final');
						clearFields(context, fields_to_clear);
						notMandatory(context, disable_not_mandatory_all);
						disableFields(context, disable_not_mandatory_all);
						enableFields(context, enable_updated_final)
						REC.setValue("custrecord_ss_submit_submitted", 2);
						break;

					case 4: // Subsequent
						console.log('case 4 spreadsheet Subsequent');
						clearFields(context, fields_to_clear);
						notMandatory(context, disable_not_mandatory_all);
						disableFields(context, disable_not_mandatory_all);
						enableFields(context, enable_subsequent);
						yesMandatory(context, mandatory_subsequent);
						REC.setValue("custrecord_ss_submit_submitted", 2);
						break;

					case 7: // Vesting Schedule
						console.log('case 4 spreadsheet Vesting Schedule');
						clearFields(context, fields_to_clear);
						notMandatory(context, disable_not_mandatory_all);
						disableFields(context, disable_not_mandatory_all);
						enableFields(context, enable_vschedule);
						yesMandatory(context, ['custrecord_ss_submit_foreign']);
						REC.setValue("custrecord_ss_submit_submitted", 2);
						break;

					default:
						// code block
				}
			}
		}

		//=====================================================HELPER==FUNCTIONS========================================================
		var fieldObject;

		function conditionalMandatory(context, trigger_field, conditional_field) {
			console.log("entered conditional mandatory function");

			fieldObject = context.currentRecord.getField({
				fieldId: conditional_field
			});
			console.log('fieldObject: ', fieldObject);
			console.log('result: ', context.currentRecord.getValue(trigger_field));
			if (context.currentRecord.getValue(trigger_field) == '1') { //DropDown selection = YES
				console.log('result: ', context.currentRecord.getValue(trigger_field));
				//context.currentRecord.setValue(conditional_field, '');
				fieldObject.isDisabled = false;
				fieldObject.isMandatory = true;
				
			} else {
				context.currentRecord.setValue(conditional_field, '');
				fieldObject.isDisabled = true;
				fieldObject.isMandatory = false;

			}

		}

		function clearFields(context, array) {

			for (var i = 0; i < array.length; i++) {
				context.currentRecord.setValue(array[i], '')
			};
		}

		function notMandatory(context, array) {

			for (var i = 0; i < array.length; i++) {
				fieldObject = context.currentRecord.getField({
					fieldId: array[i]
				});
				fieldObject.isMandatory = false;
			}
		}

		function yesMandatory(context, array) {

			for (var i = 0; i < array.length; i++) {
				fieldObject = context.currentRecord.getField({
					fieldId: array[i]
				});
				fieldObject.isMandatory = true;
			}

		}

		function enableFields(context, array) {
			for (var i = 0; i < array.length; i++) {
				fieldObject = context.currentRecord.getField({
					fieldId: array[i]
				});
				fieldObject.isDisabled = false;
			}
		}

		function disableFields(context, array) {
			for (var i = 0; i < array.length; i++) {
				fieldObject = context.currentRecord.getField({
					fieldId: array[i]
				});
				fieldObject.isDisabled = true;
			}
		}

		function spreadsheetType(context, spreadsheetTypeNumber) {

			switch (spreadsheetTypeNumber) {
				case 1: // Custom Prefill
				case 2: // Miscellaneous
					console.log("inside the prefill or misc");
					notMandatory(context, fields_to_disable);
					disableFields(context, fields_to_disable);
					break;

				case 3: // Prelim
					console.log('case 3 spreadsheet Prelim');
					notMandatory(context, disable_not_mandatory_all);
					disableFields(context, disable_not_mandatory_all);
					enableFields(context, enable_fields_prelim);
					yesMandatory(context, mandatory_prelim);
					break;

				case 5: // Updated Prelim
					console.log('case 5 spreadsheet Updated Prelim');
					notMandatory(context, disable_not_mandatory_all);
					disableFields(context, disable_not_mandatory_all);
					enableFields(context, enable_non_mandatory_updated_prelim);
					break;

				case 8: //Prelim and Final
					console.log('case 8 spreadsheet Prelim and Final');
					notMandatory(context, disable_not_mandatory_all);
					disableFields(context, disable_not_mandatory_all);
					enableFields(context, enable_prelim_final);
					yesMandatory(context, mandatory_prelim_final);
					break;

				case 9: //Final
					console.log('case 9 spreadsheet Final');
					notMandatory(context, disable_not_mandatory_all);
					disableFields(context, disable_not_mandatory_all);
					enableFields(context, enable_final);
					yesMandatory(context, mandatory_final);
					break;

				case 6: // Updated Final 
					console.log('case 6 spreadsheet Updated Final');
					notMandatory(context, disable_not_mandatory_all);
					disableFields(context, disable_not_mandatory_all);
					enableFields(context, enable_updated_final)
					break;

				case 4: // Subsequent
					console.log('case 4 spreadsheet Subsequent');
					notMandatory(context, disable_not_mandatory_all);
					disableFields(context, disable_not_mandatory_all);
					enableFields(context, enable_subsequent);
					yesMandatory(context, mandatory_subsequent);
					break;

				case 7: // Vesting Schedule
					console.log('case 4 spreadsheet Vesting Schedule');
					notMandatory(context, disable_not_mandatory_all);
					disableFields(context, disable_not_mandatory_all);
					enableFields(context, enable_vschedule);
					yesMandatory(context, ['custrecord_ss_submit_foreign']);
					break;

				default:
					// code block
			}
		}

		//======================================================================================================================

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
		};

	});