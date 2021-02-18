/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime', 'N/search', 'N/ui/dialog'],
	/**
	 * -----------------------------------------------------------
	 * employeeRecordClient.js
	 * ___________________________________________________________
	 * Employee Record client script
	 *
	 * Version 1.0
	 * Author: Brunno Putnam
	 * Date: 2020-02-20	
	 * ___________________________________________________________
	 */

	function (runtime, search, dialog) {

		var REC;

		function pageInit(context) {

			REC = context.currentRecord;
			console.log('Runtime ContextType: ', JSON.stringify(runtime.executionContext));
		}

		function fieldChanged(context) {

			REC = context.currentRecord;

			if (context.fieldId == "department") {

				var department_id = REC.getValue("department");

				var is_support_rep_checked = search.lookupFields({
					type: "department",
					id: department_id,
					columns: ['custrecord_is_support_rep_req']
				}).custrecord_is_support_rep_req;

				if (Boolean(is_support_rep_checked)) {
					REC.setValue({
						fieldId: 'issupportrep',
						value: is_support_rep_checked,
						ignoreFieldChange: true
					});
					dialog.alert({
						title: 'Support Rep Functionality Included',
						message: 'If you would like to overwrite the default, uncheck the Support Rep checkbox under Human Resources Subtab'
					}).then().catch();
				} else {
					REC.setValue({
						fieldId: 'issupportrep',
						value: false,
						ignoreFieldChange: true
					});
					dialog.alert({
						title: 'Support Rep Functionality is Not Included',
						message: 'If you would like to overwrite the default, check the Support Rep checkbox under Human Resources Subtab'
					}).then().catch();
				}
			}
		}

		//======================================================================================================================

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
		};

	});