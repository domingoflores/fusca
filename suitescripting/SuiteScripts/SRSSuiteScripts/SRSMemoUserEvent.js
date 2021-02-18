/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @ FILENAME      : SRSMemoUserEvent.js
 * @ AUTHOR        : Steven C. Buttgereit
 * @ DATE          : 2012/02/08
 *
 * Copyright (c) 2012 Shareholder Representative Services LLC
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//
// beforeLoad:  User event script to run prior to the Memo record loading.
//

function beforeLoad(type, form, request) {
	nlapiLogExecution('DEBUG','SRSMemoUserEvent.parseParameters','Starting parse parameters...');
	
	if(type == 'create') {
		nlapiLogExecution('DEBUG','SRSMemoUserEvent.parseParameters','Setting parameters for the new record');
		parseParameters(nlapiGetNewRecord(),request);
	}
	
	nlapiLogExecution('DEBUG','SRSMemoUserEvent.parseParameters','End of memo beforeLoad script.');
}


//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////


//
// parseParameters:  A helper function that parses request object parameters into a NetSuite object.  
//					 this assumes that all parameters being with 'obj_'.
//
function parseParameters(object,request) {
	nlapiLogExecution('DEBUG','SRSMemoUserEvent.parseParameters','Starting parse parameters...');
	
	
	if(object == null || object == undefined || request == null || request == undefined || request.getAllParameters() == null) {
		nlapiLogExecution('ERROR','SRSMemoUserEvent.parseParameters','Something isn\'t right in the start-up parameters.');
		return null;
	}
	
	var params = request.getAllParameters();
	
	for ( param in params) {
		nlapiLogExecution('DEBUG','SRSMemoUserEvent.parseParameters','Evaluating parameter: '+param+' obj code: "'+param.substring(0,4)+'"');
		if(param.substring(0,4) == 'obj_') {
			nlapiLogExecution('DEBUG','SRSMemoUserEvent.parseParameters','Setting '+param.substring(4)+' to value: '+params[param]+'.');
			if(params[param] == undefined || params[param] == null || params[param] == '') {
				object.setFieldValue(param.substring(4),null)
			} else {
				object.setFieldValue(param.substring(4),params[param]);
			}
		} else {
			nlapiLogExecution('DEBUG','SRSMemoUserEvent.parseParameters','Parameter '+param.substring(4)+' with value: '+params[param]+' is not an object target.');
		}
	}
	
	return object;
}