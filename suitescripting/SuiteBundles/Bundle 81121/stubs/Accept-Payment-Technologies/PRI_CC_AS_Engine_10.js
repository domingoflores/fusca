//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * 1.0 equivalent of the Read App Settings function, part of the Prolecto Application Settings engine
 * 
 */
var scriptName = "PRI_AS_Engine_10.";
		
var APP_SETTINGS_RECORD = "customrecord_pri_app_setting";
var APP_NAME_LIST = "customrecord_pri_app_list";
		
var FIELD_TYPES = {
	TEXT: 1,
	INTEGER: 2,
	NUMBER: 3,
	BOOLEAN: 4,
	JSON: 5,
	DATE: 6
}
		
function readAppSetting(applicationId, settingName, defaultValue) {
	// reads a setting using either the application's internal ID or it's name

	var filters = [];
	var columns = [];

	filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	filters.push(new nlobjSearchFilter('name',null,'is',[settingName]));

	if (applicationId %1 === 0)
		// we have an integer, so look for that internal id
		filters.push(new nlobjSearchFilter('internalid','custrecord_pri_as_app','anyof',[applicationId]));
	else
		filters.push(new nlobjSearchFilter('name','custrecord_pri_as_app','is',[applicationId]));

	columns.push(new nlobjSearchColumn('custrecord_pri_as_value'));
	columns.push(new nlobjSearchColumn('custrecord_pri_as_type'));

	var searchResults = nlapiSearchRecord(APP_SETTINGS_RECORD,null, filters, columns);

	if(!isEmpty(searchResults))
	{
		if (searchResults[0].getValue("custrecord_pri_as_type") == FIELD_TYPES.BOOLEAN) {
			return (searchResults[0].getValue("custrecord_pri_as_value") == "T")						
		} else if (searchResults[0].getValue("custrecord_pri_as_type") == FIELD_TYPES.DATE) { 
			return new Date(searchResults[0].getValue("custrecord_pri_as_value"))
		} else if (searchResults[0].getValue("custrecord_pri_as_type") == FIELD_TYPES.INTEGER) { 
			return parseInt(searchResults[0].getValue("custrecord_pri_as_value"))
		} else if (searchResults[0].getValue("custrecord_pri_as_type") == FIELD_TYPES.NUMBER) { 
			return parseFloat(searchResults[0].getValue("custrecord_pri_as_value"))
		} else
			return searchResults[0].getValue("custrecord_pri_as_value");		
	} else
		return defaultValue;
}
function isEmpty(val) {
	return (val == undefined || val == null || val == '');	
}