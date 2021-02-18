/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
/**
 * -----------------------------------------------------------
 * odsSyncUE.js
 * ___________________________________________________________
 * This user event script is here to assist with validation of conditions and anything else 
 *
 * Version 1.0
 * Author: Ken Crossman
 * ___________________________________________________________
 */
define(	[	'N/runtime', 'N/search'
	 		,'/SuiteScripts/Pristine/libraries/odsSyncLibrary.js' 
	 		,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	 		,'/.bundle/132118/PRI_ShowMessageInUI'
		], 

	function(runtime, search
		  	,odsSyncLib
		  	,toolsLib
		  	,priMessage
			) {

	    // Global constants and variables	
	    var scriptName = "odsSyncRecTypeUE.js";

		function beforeSubmit(context) {
			'use strict';
			var funcName = scriptName + " beforeSubmit " + context.type + " "
				 + context.newRecord.type + " " + context.newRecord.getValue("id")
				 + " via " + JSON.stringify(runtime.executionContext);
		
		
			// log.debug(funcName, 'Starting-------------------------------------------------------------------');

			switch (context.type) {
				case context.UserEventType.CREATE:
				case context.UserEventType.COPY:
				case context.UserEventType.EDIT:
					var validationResult = validateSyncCondition(context);
					log.debug(funcName, 'Validation result: ' + JSON.stringify(validationResult));
					if (!validationResult.success) {
						// throw validationResult.message;
						priMessage.prepareMessage("Sync condition validation Failed", validationResult.message , priMessage.TYPE.ERROR);
						throw 'Please return to previous page to correct invalid sync condition.';
					}
					break;
				case context.UserEventType.XEDIT:
					var validationResult = validateSyncCondition(context);
					log.debug(funcName, 'Validation result: ' + JSON.stringify(validationResult));
					if (!validationResult.success) {
						throw 'Sync Condition failed validation - please correct. Changes are not saved unless validation passes.';
					}
				
					break;
				default:
					return;
			}	
		}

		function validateSyncCondition(context) {
			var funcName = scriptName + "-->validateSyncCondition";
			var filters = [];
            var columns = [];
            var ss,
            	success,
            	message,
                checkConditionSyntaxResult;

            var syncCondition = toolsLib.getFieldValue(context,'custrecord_osr_sync_condition');
			log.debug(funcName, 'sync condition: ' + syncCondition);
			var searchType = toolsLib.getFieldValue(context,'custrecord_osr_search_type');
		   	log.debug(funcName, 'sync searchType: ' + searchType);

		   	if (syncCondition) {
		   		checkConditionSyntaxResult = odsSyncLib.checkConditionSyntax(syncCondition);
		   		if (checkConditionSyntaxResult.success) {
		   			filters = odsSyncLib.addConditions(filters, syncCondition);
	                try {
		  				ss = search.create({type: searchType,
		                	filters: filters,
		                	columns: columns
		            	}).run().getRange(0,1);
		            	message = 'Search seems to be well formed using given sync conditions. ';
		            	if (ss.length > 0) {
		            		message += 'Found token row from record type ' + searchType + ' using sync condition';
		            	}
		            	log.debug(funcName, 'Condition check: ' + message);
		            	success = true;
	                } catch (e) {
						log.error(funcName, 'Search Error using provided sync condition. Error: '  + JSON.stringify(e) );  
						success = false;
						message = JSON.stringify(e);
					}
		   		} else {
		   			success = false;
		   			message = checkConditionSyntaxResult.message;
		   		}
              
            } else {
            	success = true;
            	message = 'No sync condition';
            }
            return {
            	success: success,
            	message: message
            }
		}



	return {
		beforeSubmit: beforeSubmit
	};
});