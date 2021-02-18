/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['N/search', 'N/https', 'N/http', 'N/runtime', '/SuiteScripts/Pristine/libraries/odsConnector'], function(search, https, http, runtime) {

	/**
	 * -----------------------------------------------------------
	 * odsSyncRecord.js
	 * ___________________________________________________________
	 * This user event script makes a call to ODS when certain Netsuite record types
	 * are created, copied, edited, xedited
	 *
	 * Version 1.0
	 * Author: ?
	 * ___________________________________________________________
	 */

	function afterSubmit(context) {
		'use strict';
		var eventType = context.type;
		var envType = runtime.envType;
		var acctId = runtime.accountId;
		var executionContext = runtime.executionContext;

		log.debug({
			title: 'Function afterSubmit:',
			details: 'eventType: ' + eventType + ' envType: ' + envType + ' acctId: ' + acctId
		});

		switch (eventType) {
			case context.UserEventType.CREATE:
			case context.UserEventType.COPY:
			case context.UserEventType.EDIT:
			case context.UserEventType.XEDIT:
			case context.UserEventType.DELETE: 
				break;
			default:
				return;
		}		

		
		var authKeyList = getAuthKeys();

		if (envType === 'PRODUCTION') {
			try{
				createRequestProd(authKeyList, eventType, executionContext, context);	
			}catch (e){
				log.error({
					title: 'ERROR ON CALL OF ods.modules.netSuiteSync',
					details: e.message
				});
			}	
		} else {
			if(acctId == '772390_SB3') { // development sandbox
	 			try{
					createRequestDev(authKeyList, eventType, executionContext, context);
				}catch (e){
					log.error({
						title: 'ERROR ON CALL OF ods.modules.netSuiteSync',
						details: e.message
					});
				}
			} else if(acctId == '772390_SB1') { // staging sandbox
	 			try{
					createRequestStage(authKeyList, eventType, executionContext, context);
				}catch (e){
					log.error({
						title: 'ERROR ON CALL OF ods.modules.netSuiteSync',
						details: e.message
					});
				}
			}
		}

		// Removed the call below because there is no apparent reason why it is there
		// ods.modules.netSuiteSync();
		log.debug('Context', context.newRecord.type + ' ' + context.newRecord.id);
	}

	function createRequestProd(authKeyList, eventType, executionContext, context){
		//var authKey = authKeyList[0].getValue({
		//	name: 'custrecord_ods_auth_token_prod'
		//});

        var authKey = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImNyZWF0ZWQiOiIwLjMxMDYxMjAwIDE1MzM1OTQxMzgiLCJyYW5kIjoiSUNRdmpaU3dJN3N2NkxmIn0=.45c1e32f309413938b80b193eef4569de1ba0fe2a05212b9f240513a34f3c70a";
		var options = {
			recordType: context.newRecord.type,
			internalid: context.newRecord.id,
			event: eventType,
			context: executionContext
		};

		var syncRequest = new OdsSyncReq(https,options);
		syncRequest.setAuth(authKey);
		syncRequest.setOdsEnv(syncRequest.envList.prod);
		syncRequest.setHeaders();
		syncRequest.setOptions(options);
		syncRequest.sendRequest();	
	}

	function createRequestDev(authKeyList, eventType, executionContext, context){
		// var authKey = authKeyList[0].getValue({
		// 	name: 'custrecord_ods_auth_token_dev'
		// });

        var authKey = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImNyZWF0ZWQiOiIwLjExNDU4ODAwIDE1MzMxNjU5OTUiLCJyYW5kIjoiT1J1azBhanFsdEhjbU1YIn0=.68f95fc7d17b252033b8091e33a0ba12d198eb76284c47ddbb46cd4cdfd120b4";
        var options = {
			recordType: context.newRecord.type,
			internalid: context.newRecord.id,
			event: eventType,
			context: executionContext
		};

		var syncRequest = new OdsSyncReq(https,options);
		syncRequest.setAuth(authKey);
		syncRequest.setOdsEnv(syncRequest.envList.dev);
		syncRequest.setHeaders();
		syncRequest.setOptions(options);
		syncRequest.sendRequest();	
	}

	function createRequestStage(authKeyList, eventType, executionContext, context){
		//var authKey = authKeyList[0].getValue({
		//		name: 'custrecord_ods_auth_token_staging'
		//	});

      var authKey = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsImNyZWF0ZWQiOiIwLjA4NTU2NDAwIDE1NTMxOTI2MjYiLCJyYW5kIjoicVNwM1ZXTU51MFVCeVI1In0=.df14fe78962edb7a4774e967fb22a3929cc6187b7a8ba50d13adb22276d56cf8";
      var options = {
			recordType: context.newRecord.type,
			internalid: context.newRecord.id,
			event: eventType,
			context: executionContext
		};

		var syncRequest = new OdsSyncReq(https,options);
		syncRequest.setAuth(authKey);
		syncRequest.setOdsEnv(syncRequest.envList.stage);
		syncRequest.setHeaders();
		syncRequest.setOptions(options);
		syncRequest.sendRequest();	
	}

	function getAuthKeys() {
		//Sandbox and Prod auth keys stored in Netsuite custom record type ODS
		// keys are hard-coded in script above now
		var authKeySearch = search.create({
			type: 'customrecord_ods', //ODS
			title: 'Auth Key List',
			columns: [{
				name: 'custrecord_ods_auth_token_staging'
			}, {
				name: 'custrecord_ods_auth_token_prod'
			}, {
				name: 'custrecord_ods_auth_token_dev' 
			}],
			filters: [{
				name: 'isinactive',
				operator: search.Operator.IS,
				values: 'F'
			}]
		}).run();

		var searchResults = authKeySearch.getRange(0, 100);

		log.debug({
			title: "XXX authkey searchresult XXX",
			details: JSON.stringify(searchResults)
		});

		return searchResults;
	}

	return {
		afterSubmit: afterSubmit
	};
});