/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/**
 * -----------------------------------------------------------
 * odsSyncUE.js
 * ___________________________________________________________
 * This user event script makes a call to ODS when certain Netsuite record types
 * are created, copied, edited, xedited
 *
 * Version 1.0
 * Author: Ken Crossman
 * ___________________________________________________________
 */
define(	['N/runtime'
	 	,'/SuiteScripts/Pristine/libraries/odsSyncLibrary.js' 
		], 

	function(runtime
		  	,odsSyncLib
			) {

	    // Global constants and variables
	    var scriptName = "odsSyncUE.js";

		function afterSubmit(context) {
			var funcName = scriptName + " afterSubmit " + context.type + " "
				 + context.newRecord.type + " " + context.newRecord.getValue("id")
				 + " via " + JSON.stringify(runtime.executionContext);
			'use strict';
			// log.debug(funcName, 'Starting-------------------------------------------------------------------');

			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
				case context.UserEventType.XEDIT:
				case context.UserEventType.DELETE: 
				try {
					var syncRequestResult = odsSyncLib.requestOdsSync(context);
          			log.debug(funcName, 'Sync Request Result: ' + JSON.stringify(syncRequestResult));
          			if (syncRequestResult.success) {
          				log.debug(funcName, 'Sync Request queued: ' + JSON.stringify(syncRequestResult.message));
          			} else {	
          				log.debug(funcName, 'Sync Request denied: ' + JSON.stringify(syncRequestResult.message));
          			}  
				} catch (e) {
					log.error(funcName, 'ODS SYNC ERROR requesting sync of record. Error: '  + JSON.stringify(e) );  
				}

					break;
				default:
					return;
			}		
		}

	return {
		afterSubmit: afterSubmit
	};
});