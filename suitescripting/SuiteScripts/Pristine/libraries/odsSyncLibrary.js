/**
 * odsSyncLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities 
 * 
 *
 * Version    Date            Author           Remarks
 *	1.0		  2019-09-05	  Ken Crossman	   Meant to be a receptacle for useful scripting tools/functions/utilities in the ODS Sync area
 */
define(['N/search', 'N/runtime', 'N/https', 'N/url'
 		,'/.bundle/132118/PRI_AS_Engine'
 	 	,'/.bundle/132118/PRI_QM_Engine' 
 	 	,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
 		,'/SuiteScripts/Prolecto/Shared/SRS_Constants'],

	function(search, runtime, https, url
			,appSettings
			,qmEngine
			,toolsLib
			,srsConstants
			) {

        // Global constants and variables
        var scriptName = "odsSyncLibrary.js";
        const   ods_sync_requested = 1
                ods_sync_successful = 2;

        // --------------------------------------------------------------------------------------------------------------------------------
        function requestOdsSync(context) {
            var funcName = scriptName + "-->requestOdsSync";
     
            var recsToSync = [];
			recsToSync.push(context.newRecord.getValue("id"));

            var success = true;
            var scriptObj = runtime.getCurrentScript();
			// log.debug(funcName,'Script ID: ' + JSON.stringify(scriptObj));
			var result = {};
			var checkSyncConditionResult;
			var checkPermittedUETypesResult;

			var odsSyncRecordType = getODSSyncRecordType(context.newRecord.type);
  			log.debug(funcName,'odsSyncRecordType: ' + JSON.stringify(odsSyncRecordType));

  			if (odsSyncRecordType.length > 0) { // ODS Sync Record Type found
  				checkPermittedUETypesResult = checkPermittedUETypes(context,odsSyncRecordType);
  				if (checkPermittedUETypesResult.success) {
					checkSyncConditionResult = checkSyncCondition(context,odsSyncRecordType);
					if (checkSyncConditionResult.conditionMet) { // Only sync if no conditions or conditions met
						log.debug(funcName, 'No conditions or conditions met. Requesting sync...');
						try {
				            var QManagerParm = { "ODSSyncRecordTypeId": ''
				                                ,"recordIdList": recsToSync
				                                ,"startingIndex": 0
				                                ,"recType": context.newRecord.type
				                                ,"envType": runtime.envType
				                                ,"eventType": context.type
				                                ,"executionContext": runtime.executionContext
				                                ,"callingScript": runtime.getCurrentScript().id };
				              
				            var intQid = qmEngine.addQueueEntry( "ODSSyncRecord" ,QManagerParm ,null ,false ,'customscript_ods_sync_record_qm');
				            if (intQid) {
				            } else {
				                success = false;
				            }
				       
				            result.success = success;
				            result.intQid = intQid;
				            result.message = 'Sync request ' + intQid + ' successfully added to QManager Queue';
				        } catch(e) {
				        	log.error(funcName, 'ODS SYNC ERROR requesting sync of record. Error: '  + JSON.stringify(e) ); 
				        	result.success = false;
				        	result.message = e;
				        }
					} else {
						result.success = false;
						result.message = checkSyncConditionResult.message;
					}
  				} else {
  					result.success = false;
					result.message = checkPermittedUETypesResult.message;
  				}
			
			} else {
  				// did not find ODS Sync Record Type for the sync request being made.
  				result.success = false;
  				result.message = 'ODS Sync Record Type for record type ' + context.newRecord.type 
  						+ ' could not be found. No condition to check.';
  			} 
            return result;
        }

        // --------------------------------------------------------------------------------------------------------------------------------
  		function checkPermittedUETypes(context,odsSyncRecordType) {
			var funcName = scriptName + "-->checkPermittedUETypes";
			var success = false;
			var	message,
				arrayPos;
			var ueTypes = odsSyncRecordType[0].getText('custrecord_osr_ue_type');
  			var ueTypesArray = ueTypes.toLowerCase().split(",");
  			log.debug(funcName,'ueTypesArray: ' + JSON.stringify(ueTypesArray) + ' type: ' + typeof ueTypesArray);
  			// Find the current user event type among those permitted for this record type	
  			log.debug(funcName, 'this UE type: ' + context.type);
			arrayPos = ueTypesArray.indexOf(context.type);
		
			if (arrayPos > -1) {
				success = true;
				message = 'User Event ' + context.type + ' does trigger an ODS Sync for this record type'; 
			} else {
				success = false;
				message = 'User Event ' + context.type + ' does not trigger an ODS Sync for this record type'; 
			}

  			return { success: success
  					,message: message
  			};
  		}

  		// --------------------------------------------------------------------------------------------------------------------------------
  		
  		function checkSyncCondition(context,odsSyncRecordType) {
  			var funcName = scriptName + "-->checkSyncCondition";
  		
  			var syncCondition;
  			var prop;
  			var thisRecFieldValue;
  			var conditionField;
  			var conditionOperator;
  			var conditionValue;
  			var conditionMet = true;
  			var message = '';
  			var arrayPos;

			syncCondition = odsSyncRecordType[0].getValue('custrecord_osr_sync_condition');
			// log.debug(funcName,'syncCondition: ' + syncCondition);
			if (syncCondition) {
				
				syncCondition = JSON.parse(syncCondition);
				// log.debug(funcName,'syncCondition condition count: ' + syncCondition.length);
				log.debug(funcName,'syncCondition: ' + JSON.stringify(syncCondition));

				for each (result in syncCondition) {   // May be a compound condition
					
					conditionMet = false;
					conditionField 		= result['fieldName'];
            		conditionValue		= result['fieldValue'];
            		conditionOperator	= result['operator'];
            		thisRecFieldValue 	= toolsLib.getFieldValue(context,conditionField);
			
					// Now apply the sub-condition
					switch (conditionOperator.toLowerCase()) {
						case 'anyof':
							// Find the value of the field on this record in the array of condition values
							// log.debug(funcName,'conditionValue length: ' +  conditionValue.length);
							// log.debug(funcName,'conditionValue isarray: ' +  Array.isArray(conditionValue));	
							arrayPos = conditionValue.indexOf(Number(thisRecFieldValue));
							// log.debug(funcName, 'arrayPos: ' + arrayPos);
							if (arrayPos > -1) {
								conditionMet = true;
								// log.debug(funcName, 'This condition met');
							}
							break;
						case 'is':
							if (thisRecFieldValue == conditionValue) {
								conditionMet = true;
								// log.debug(funcName, 'This condition met');
							}
							break;
						default:
							return;
					}	
					// As soon as the first sub-condition is not met, exit immediately because
					// all sub-conditions must be met
					if (!conditionMet) { 
						message += 'Condition ' + JSON.stringify(result) + ' not met. Sync request rejected.';
						break; // Every condition has to be met
					} 
				} // for each (result in syncCondition) 	
			} else {
				message += 'No condition on ODS Sync Record Type to check.'
			} // if (syncCondition)
	  		
  			return { 	"conditionMet": conditionMet
  					,	"message": message 
  			};
  		}

        // --------------------------------------------------------------------------------------------------------------------------------
        
        function addConditions(filters, syncCondition) {
            var funcName = scriptName + "-->addConditions";
            syncCondition = JSON.parse(syncCondition);
            // log.debug(funcName,'syncCondition condition count: ' + syncCondition.length);
            log.debug(funcName,'syncCondition: ' + JSON.stringify(syncCondition));
            var conditionOperator;
            var conditionField;
            var conditionValue;
            var prop;

            for each (result in syncCondition) {   // May be a compound condition
                // log.debug(funcName,'syncCondition result: ' + JSON.stringify(result));
             	conditionField 		= result['fieldName'];
            	conditionValue		= result['fieldValue'];
            	conditionOperator	= result['operator'];
      
                filters.push(search.createFilter({
                    name: conditionField,
                    operator: conditionOperator,
                    values: conditionValue
                }));
                // log.debug(funcName,'filters: ' + JSON.stringify(filters));
            }
            return filters;  
        }     
		// --------------------------------------------------------------------------------------------------------------------------------

        function checkConditionSyntax(string) {
        	var funcName = scriptName + "-->checkConditionSyntax";
        	var conditionOperator;
            var conditionField;
            var conditionValue;
            var prop;
            var message = '';
            var success;

        	try {
        		var syncCondition = JSON.parse(string);
        		log.debug(funcName,'Can parse this string. Element count: ' + syncCondition.length);
        		log.debug(funcName,'syncCondition: ' + JSON.stringify(syncCondition));
        		// Check if condition is an array 
        		log.debug(funcName,'Is condition an array?: ' + Array.isArray(syncCondition));
        		if (Array.isArray(syncCondition)) {
	        		
	        		// Check arrays
	        		for each (result in syncCondition) {   // May be a compound condition
	                	// log.debug(funcName,'syncCondition result: ' + JSON.stringify(result));
	                	
	                	conditionField 		= result['fieldName'];
	                	conditionValue		= result['fieldValue'];
	                	conditionOperator	= result['operator'];
	            
		  				switch (conditionOperator.toLowerCase()) {
							case 'anyof':
								if (typeof conditionValue !== 'object') {
									// log.debug(funcName, 'Sync condition value ' + JSON.stringify(conditionValue) + ' is malformed.');
									message += 'Sync condition value ' + JSON.stringify(conditionValue) + ' is malformed.<br>';
									success = false;
								}
								break;
							case 'is': 
								if (typeof conditionValue !== 'string' && typeof conditionValue !== 'boolean') {
									// log.debug(funcName, 'Sync condition value ' + JSON.stringify(conditionValue) + ' is malformed.');
									message += 'Sync condition value ' + JSON.stringify(conditionValue) + ' is malformed.<br>';
									success = false;
								}
								break;
							default:
								return;
						}
					}
				} else {
					message = 'Sync Condition is not an array. Should be.';
				}
				if (message) {
					success = false;
				} else {
					success = true;
				}	
        		
        	} catch(e) {
				log.debug(funcName, 'Cannot parse this: ' +  string + ' Error: ' + JSON.stringify(e) ); 
				success = false;   
				message =  'Cannot parse this: ' +  string + ' Error: ' + JSON.stringify(e);
			}	
			return {
					success: success
					,message: message
			}
        
        }

		// --------------------------------------------------------------------------------------------------------------------------------
  		
  		function getODSSyncRecordType(recType) {
            var funcName = scriptName + "-->getODSSyncRecordType";

            var ss = search.create({type: 'customrecord_ods_sync_rectype',
                filters: [
                            ['isinactive', search.Operator.IS, false]
                            ,"AND",['custrecord_osr_search_type' ,search.Operator.IS , recType ]     
                        ]
                ,columns: [   "custrecord_osr_sync_condition"
                			, "custrecord_osr_ue_type"	
                ]
            }).run().getRange(0,1);
            return ss;
  		}

  		// --------------------------------------------------------------------------------------------------------------------------------

		function odsSyncOneRow(context ,objParms ,index, authKeys) {
			var funcName = scriptName + "-->odsSyncOneRow";
			log.debug(funcName, 'context.type: ' + JSON.stringify(objParms.eventType));
			log.debug(funcName, 'runtime.executionContext: ' + JSON.stringify(objParms.executionContext));
			var syncResponse = {};
			var result = {};
			result.success = false;
			syncResponse.code = '' ;
			result.message = '';
            var authKeyObj = searchArray('authKey_' + runtime.accountId, authKeys);
           
            if (authKeyObj) {
            	try {
	            	result.syncDatetime = new Date();
	            	// syncResponse = createRequest(authKeyObj, objParms.recType ,objParms.recordIdList[index]);
	            	syncResponse = createRequest(authKeyObj, objParms, index);
	            	if (syncResponse.code == 200) {
						result.success = true;
					}
				} catch(e) {
					log.error(funcName, 'ODS SYNC ERROR: ' +  JSON.stringify(e) );               
				}
            } else {
            	result.message = 'Auth Key with Name = authKey_' + runtime.accountId + ' not found';
            }

			result.syncResponse = syncResponse;
			return result;			
		}
  		// --------------------------------------------------------------------------------------------------------------------------------
		function createRequest(authKeyObj, objParms, index){
			var funcName = scriptName + "-->createRequest";
			var rowId = objParms.recordIdList[index];
			try {
				var headers = {'Authorization': authKeyObj.authKey};
				var url = authKeyObj.url;
				url += 'recordType=' + objParms.recType;
				url += '&internalid=' + rowId;
				url += '&event=' + objParms.eventType;
				url += '&context=' + objParms.executionContext; 
				log.debug(funcName,'url: ' + url);
			
				var response = https.get({'url': url,'headers': headers});
				log.debug(funcName,'response: ' + JSON.stringify(response));
			} catch(e) {
				log.error(funcName, 'ODS SYNC ERROR: ' +  JSON.stringify(e) );     
			}
			return response;
		}

  		// --------------------------------------------------------------------------------------------------------------------------------

        function getTablesToSync() {
            var funcName = scriptName + "-->getTablesToSync";

            var ss = search.create({type: 'customrecord_ods_sync_rectype',
                filters: [
                            ['isinactive', search.Operator.IS, false]
                            ,"AND",['custrecord_osr_sync_on_schedule' ,search.Operator.IS , true ]     
                        ]
                ,columns: ["custrecord_osr_rectype","custrecord_osr_txn_type","custrecord_osr_group", "custrecord_osr_last_sync_datetime"
                			, "custrecord_osr_rectype.scriptid", "custrecord_osr_sync_priority"
                			, "custrecord_osr_search_type"
                			, "custrecord_osr_sync_condition"
                			, "custrecord_osr_ue_type"
                ]
            }).run().getRange(0,1000);
            return ss;
        }
        // --------------------------------------------------------------------------------------------------------------------------------			
		// This function dedupes an array of simple elements       
        function removeDuplicatesFromArray(a) {
		    var seen = {};
		    var out = [];
		    var len = a.length;
		    var j = 0;
		    for(var i = 0; i < len; i++) {
		         var item = a[i];
		         if(seen[item] !== 1) {
		               seen[item] = 1;
		               out[j++] = item;
		         }
		    }
		    return out;
		}

        // --------------------------------------------------------------------------------------------------------------------------------			
        function searchArray(nameKey, myArray){
        	for each (result in myArray) {    
		        if (result.name === nameKey) {
		            return result;
		        }
		    }
		}
        // --------------------------------------------------------------------------------------------------------------------------------			
		return { getTablesToSync			: getTablesToSync
				,odsSyncOneRow 				: odsSyncOneRow
				,removeDuplicatesFromArray 	: removeDuplicatesFromArray
				,requestOdsSync 			: requestOdsSync
				,addConditions 				: addConditions
				,checkConditionSyntax			: checkConditionSyntax
		};
	});