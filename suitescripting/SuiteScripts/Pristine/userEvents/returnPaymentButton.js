/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * returnPaymentButton.js
 * ___________________________________________________________
 * 
 * 
 * Version 1.0  Ken Crossman
 * Add button to launch Returned Payment Process
 *
 * 2019-12 Updated as part of ticket ATP-1350 by Ken C 
 * ___________________________________________________________
 */

define(['N/ui/serverWidget', 'N/search', 'N/runtime'
		,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
		],
	function(serverWidget, search, runtime
			,toolsLib
		) {

		var objPermissionList = {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"};

		function beforeLoad(context) {
			log.debug('beforeLoad');
			switch (context.type) {
				case context.UserEventType.VIEW:
					// Check user role
					var hasAccess = toolsLib.checkPermission(objPermissionList);
					log.debug('beforeLoad', 'hasAccess: ' + hasAccess);
					// Is there a credit memo related to the exchange record? 
					// Only show the button if that is so
					var creditMemoID = parseInt(context.newRecord.getValue('custrecord_acq_loth_related_trans')) || null;
					var exRecID = parseInt(context.newRecord.getValue('id')) || null;
					if (creditMemoID && hasAccess) {
						// log.debug('beforeLoad', 'creditMemoID: ' + JSON.stringify(creditMemoID));
						context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/voidTrackingClient.js';
						context.form.addButton({
							id: 'custpage_process_returned_payment_button',
							label: 'Process Returned Payment',
							functionName: 'processReturnedPayment()'
						});
					}
					break;
				default:
					return;
			}
		}

		return {
			beforeLoad: beforeLoad
		};
	}
);