/* *************************************************
 * Advanced Bank Reconciliation, 2012 Nolan Business Solutions Plc
 *
 * Translating scripts
 *
 * Version History
 * 		06/03/2012	C.Shaw		Initial version created
 */

/** 
 * As is not possible to query user preferences to determine user language selection,
 * a setup record is required to record user language preference.
 * If a user�s language is not set, use English.
 * 
 * This function retrieves the preferred language of the logged in user from the NBS Translator Preferences record
 *
 * @param (string) entityId internalid of logged in user.
 * 
 * @return (string) languageId
 * 
 */
function nbsTRANSL_getUserLanguage(entityId)
{
	var userId = entityId;
	var filters = [ new nlobjSearchFilter('isinactive',null,'is','F',null),
	                new nlobjSearchFilter(nbsTRANSL_RT_Preferences.FN_User,null,'is',userId,null)];
	var columns = [ new nlobjSearchColumn(nbsTRANSL_RT_Preferences.FN_Language)];
	var results = null;
	var stErrMsg = '';
	var languageId = nbsTRANSL_CL_UserLanguage.ENGLISH_INT; // English (International)
	
	results = nlapiSearchRecord(nbsTRANSL_RT_Preferences.ScriptId, null, filters, columns);
	
	if( (results === null) || (results.length === 0) )	// no record found
	{
		// do nothing and use English strings
	}
	else	// one or more found
	{
		if(results.length == 1)
		{
			languageId = results[0].getValue(nbsTRANSL_RT_Preferences.FN_Language);
		}
		else // multiple records found, flag error
		{
			stErrMsg = 'Multiple records have been found. Please delete or mark inactive all but one user preference record.';		
			nlapiLogExecution('error','nbsXL_getUserLanguage',stErrMsg);
		}
	}
	return languageId;
}

/** 
 * This function retrieves the resource object of string translations for a product and language
 *
 * @param (string) productId NBS product identification number.
 * @param (string) languageId.
 * 
 * @return (object) JS object containing string translations
 * 
 */
function nbsTRANSL_getResourceObject(productId,languageId)
{
	var _prodId = productId;
	var _langId = languageId;
	var results = null;
//	var stErrMsg = '';
//	var id;
//	var rec;
	var jsonObj;
//	var jsonStr;
	var stResources = '';
	var objResources = null;
	
	var filters = [ new nlobjSearchFilter('isinactive',null,'is','F',null),
	                new nlobjSearchFilter(nbsTRANSL_RT_Resources.FN_ProductId,null,'is',_prodId,null),
	                new nlobjSearchFilter(nbsTRANSL_RT_Resources.FN_Language,null,'is',_langId,null)];
	
	var cols = [ new nlobjSearchColumn(nbsTRANSL_RT_Resources.FN_Resources)];
	
	results = nlapiSearchRecord(nbsTRANSL_RT_Resources.ScriptId, null, filters, cols);
	
	if( (results === null) || (results.length === 0) )	// no record found - shouldn't happen!
	{
	//	stErrMsg = 'NBS Translator resources record missing!';
	//	nlapiLogExecution('error','nbsXL_getResourceObject',stErrMsg);
	}
	else	// should only be one!
	{
		stResources = results[0].getValue(nbsTRANSL_RT_Resources.FN_Resources);
	//	nlapiLogExecution('debug','stResources',stResources);
	//	jsonObj = 'var tempObj = ' + rec.getFieldValue(nbsTRANSL_RT_Resources.FN_Resources) + '; objResources = tempObj;';
		jsonObj = 'objResources = ' + stResources;
			
		eval(jsonObj);  // objResources = JSON.parse(jsonObj);
	}
	
	return objResources;
}

/** 
 * This function retrieves string translations for a user
 *
 * @param (object) context object.
 * 
 * @return (object) JS object containing string translations
 * 
 */
function nbsTRANSL_getResources(objContext)
{
	var ctx = objContext;
	var userId = ctx.getUser();
	//var languageId = nbsTRANSL_getUserLanguage(userId);
	//var objResoures = nbsTRANSL_getResourceObject(nbsABR.CONFIG.productId,languageId);
	var objResoures = nbsTRANSL_getResourcesForUser(userId);
	
	return objResoures;
}

/** 
 * This function retrieves string translations for a user
 *
 * @param {String} userId - internal id of user.
 * 
 * @return (object) JS object containing string translations
 * 
 */
function nbsTRANSL_getResourcesForUser(userId)
{
	var languageId = nbsTRANSL_getUserLanguage(userId);
	var objResoures = nbsTRANSL_getResourceObject(nbsABR.CONFIG.productId,languageId);
	
	return objResoures;
}

/** This function will be exposed as the GET operation of a RESTlet to retrieve string translations for a user
 * 
 * @param requestData
 * @return JS object containing string translations
 */
function nbsTRANSL_getRscByUser_GET(requestData)
{
	if ((requestData === undefined) || (requestData === null) || (requestData['userId'] === undefined)) {
		nlapiLogExecution('error','NBS ABR Translation RESTlet','Invalid Request');
		return null;
	}
	
    var userId = requestData.userId;
    if ((userId === null) || (userId == '')) {
		nlapiLogExecution('error','NBS ABR Translation RESTlet','Invalid Parameter');
		return null;
    }
    
    return nbsTRANSL_getResourcesForUser(userId);
}

