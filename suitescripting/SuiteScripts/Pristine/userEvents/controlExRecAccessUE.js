/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * controlExRecAccessUE.js
 * ___________________________________________________________
 * Purpose of this script is to ensure that only users with the 
 * correct credentials can update a Paid Exchange Record
 *
 * Version 	1.0  Ken Crossman
 *   		1.1  Ken Crossman ATP-438 2018-10-03 Fix bug	
 *   		1.2  Ken Crossman ATP-439 2018-10-04 Add Acquiom Status 5e, 5f	
 *          1.3  Ken Crossman ATP-343 2018-11-26 Added argument to toolsLib.checkUserPermissions
 *          						             Permitted depts and roles need to be ids
 *         	1.4  Paul Shea 	  ATP-870 2019-04-04 Modify Edit Permissions To User App Settings
 *         	                                     Rather Than Roles/Departments
 * _____________________________________________________________________________________________________
 */

define(['N/runtime', 'N/ui/message', '/.bundle/132118/PRI_AS_Engine'],
	function(runtime, msg, appSettings) {

		function beforeLoad(context) {

			const allowedRoles = [
				'1072', // Restlet Administrator
				'1050', // Custom Admin
				'3' // Native Admin
			];

			var permittedEmployees = JSON.parse(appSettings.readAppSetting('Custom Record Access', 'Locked Exchange Record Permissions List'));
log.debug({title: 'permittedEmployees', details: permittedEmployees});

			var eventType = context.type;
			log.debug('beforeLoad', 'eventType: ' + JSON.stringify(eventType));

			var env = runtime.envType;
			log.debug('beforeLoad', 'env: ' + JSON.stringify(env));

			if (eventType != 'create') {
				var acqStatusText = context.newRecord.getText({
					fieldId: 'custrecord_acq_loth_zzz_zzz_acqstatus'
				});
				log.debug('beforeLoad', 'acqStatusText: ' + JSON.stringify(acqStatusText));
				var creditMemo = context.newRecord.getValue({
					fieldId: 'custrecord_acq_loth_related_trans'
				});
				log.debug('beforeLoad', 'creditMemo: ' + JSON.stringify(creditMemo));
				var deal = context.newRecord.getText({
					fieldId: 'custrecord_acq_loth_zzz_zzz_deal'
				});
				log.debug('beforeLoad', 'deal: ' + JSON.stringify(deal));

				var userObj = runtime.getCurrentUser();
				var userRoleId = JSON.stringify(userObj.role);
				var allowedToEdit = false;

				log.debug('beforeLoad', 'userRoleId: ' + JSON.stringify(userRoleId));

				// If the event is anything other than View and the Exchange Record has been paid then check role and department
				if (eventType != 'view' && creditMemo !== '' &&
					(acqStatusText === '5. Approved for Payment' ||
						acqStatusText === '5e. Queued for Payment Processing' ||
						acqStatusText === '5f. Payment Processing'
					)) {

					for (var i = 0; i < permittedEmployees.length; i++) {

						if (JSON.stringify(userObj.id) === permittedEmployees[i].internalId || allowedRoles.indexOf(userRoleId) > -1) {

							allowedToEdit = true;
						}
					}

					if (!allowedToEdit) {
						throw 'You are not allowed to edit this record';
					}
				}
			}
		}

		return {
			beforeLoad: beforeLoad
		};
	}
);