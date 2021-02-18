/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * create_PI_submission_button_UE.js
 * ___________________________________________________________
 * Adds a button to the Customer (category: Shareholder) record
 * that allows users to 
 * 
 * Version 1.0  Alana Thomas
 * ___________________________________________________________
 */

define(['N/runtime', '/SuiteScripts/Pristine/libraries/redirectButtonLibrary.js'],
	function(runtime, redirectButtonLibrary) {

		function beforeLoad(context) {
			if(runtime.executionContext == 'USERINTERFACE' && context.type == 'view') {
				var newRecord = context.newRecord,
				category = newRecord.getValue({
					fieldId: 'category'
				});
				if(category == 2) {	// 2. Shareholder
					var recordId = newRecord.id;
					// var linkURL = '/app/common/custom/custrecordentry.nl?rectype=906' +  // Had to be done for Prod deploy - Ken 3/31/2018 9:02
						var linkURL = '/app/common/custom/custrecordentry.nl?rectype=874' +
						'&record.custrecord_pisb_shareholder=' + recordId;
					redirectButtonLibrary.addRedirectButton({
						context: context,
						linkURL: linkURL, 
						label: 'Create PI Submission'
					});
				}
			}
		}

		return {
			beforeLoad: beforeLoad
		};
	}
);