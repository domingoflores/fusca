//-----------------------------------------------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/*
 * 
 * This script implements the Prolecto Application Settings engine
 * 		it is used to conveniently read/write application settings (instead of Script Parameters).  This has the following advantages over Script Parameters
 * 			* can be read and written via script
 * 			* keep a change history
 * 			* a bit easier to organize, if you start needing a lot of them
 * 			* are conveniently grouped by the application which needs them
 * 
 * see accompanying sample file for usage examples
 * 
 */



define(['N/record','N/search','N/runtime'],
		
	function(record, search, runtime) {

		"use strict";

		var scriptName = "PRI_AS_Engine.";
		
		var APP_SETTINGS_RECORD = "customrecord_pri_app_setting";
		var APP_NAME_LIST = "customrecord_pri_app_list";
		
		var FIELD_TYPES = {
				TEXT: 1,
				INTEGER: 2,
				NUMBER: 3,
				BOOLEAN: 4,
				JSON: 5,
				DATE: 6,
				DATEANDTIME: 7
		}

		var ENVIRONMENT_MATCH_LEVEL = {
				NO_MATCH:			0,
				GENERIC_MATCH:		1,
				ENVIRONMENT_MATCH:	2,
				ACCOUNT_MATCH:		3
		}
		// ================================================================================================================================

		function readAppSetting(applicationId, settingName, defaultValue) {
			// reads a setting using either the application's internal ID or it's name
			
			var filters = [];
			
			filters.push(search.createFilter({name: "isinactive", operator: search.Operator.IS, values: false}));
			
			if (settingName %1 === 0)
				// we have an integer, so look for that internal id
				filters.push(search.createFilter({name: "internalid", operator: search.Operator.ANYOF, values: [settingName]}))			
			else
				filters.push(search.createFilter({name: "name", operator: search.Operator.IS, values: [settingName]}));

			
			if (applicationId %1 === 0)
				// we have an integer, so look for that internal id
				filters.push(search.createFilter({name: "internalid", join: "custrecord_pri_as_app", operator: search.Operator.ANYOF, values: [applicationId]}))
			else
				filters.push(search.createFilter({name: "name", join: "custrecord_pri_as_app", operator: search.Operator.IS, values: [applicationId]}));
			
			var sr = search.create({
				type: APP_SETTINGS_RECORD,
				filters: filters,
				columns: ["custrecord_pri_as_value","custrecord_pri_as_type","custrecord_pri_as_environment"]				
			}).run().getRange(0,9);
			
			
			if (sr.length > 0) {
				// runtime.envType; 
				// runtime.accountId; 
				
				var settingIndex = findSetting(sr,runtime.accountId);
				if (settingIndex < 0)
					settingIndex = findSetting(sr,runtime.envType);
				if (settingIndex < 0)
					settingIndex = findSetting(sr,"");
								
				if (settingIndex >= 0) {
					if (sr[settingIndex].getValue("custrecord_pri_as_type") == FIELD_TYPES.BOOLEAN) {
						return (sr[settingIndex].getValue("custrecord_pri_as_value") == "T")						
					} else if (sr[settingIndex].getValue("custrecord_pri_as_type") == FIELD_TYPES.DATE) { 
						return new Date(sr[settingIndex].getValue("custrecord_pri_as_value"))
					} else if (sr[settingIndex].getValue("custrecord_pri_as_type") == FIELD_TYPES.DATEANDTIME) { 
						return new Date(sr[settingIndex].getValue("custrecord_pri_as_value"))
					} else if (sr[settingIndex].getValue("custrecord_pri_as_type") == FIELD_TYPES.INTEGER) { 
						return parseInt(sr[settingIndex].getValue("custrecord_pri_as_value"))
					} else if (sr[settingIndex].getValue("custrecord_pri_as_type") == FIELD_TYPES.NUMBER) { 
						return parseFloat(sr[settingIndex].getValue("custrecord_pri_as_value"))
					} else
						return sr[settingIndex].getValue("custrecord_pri_as_value");							
				}
			}
						
			return defaultValue;
		} 
		
		// ================================================================================================================================

		function findSetting(appSearch, envToMatch) {
			for (var i = 0; i < appSearch.length; i++) {
				if (appSearch[i].getValue("custrecord_pri_as_environment") && envToMatch) {
					var envList = appSearch[i].getValue("custrecord_pri_as_environment").toUpperCase().split(",");
					if (envList.indexOf(envToMatch.toUpperCase()) >= 0) {
						return i;
					}
				}
				if (!appSearch[i].getValue("custrecord_pri_as_environment") && envToMatch == "") {
					return i;
				} 
			}
			
			return -1; 
		}
		
		// ================================================================================================================================


		function writeAppSetting(applicationId, settingName, newValue, fieldType, settingDescription) {
			var funcName = scriptName + ".writeAppSetting " + applicationId + " | " + settingName + " | " + newValue + " | " + fieldType;
			// writes a setting back to the app setting table; if this is a new setting, then fieldType can be provided; if it is not provided, defaults to 'text'
			
			// first, find the setting in question
			
			var settingId;
			var filters = [];
			
			filters.push(search.createFilter({name: "isinactive", operator: search.Operator.IS, values: false}));
			filters.push(search.createFilter({name: "name", operator: search.Operator.IS, values: [settingName]}));
			
			if (applicationId %1 === 0)
				// we have an integer, so look for that internal id
				filters.push(search.createFilter({name: "internalid", join: "custrecord_pri_as_app", operator: search.Operator.ANYOF, values: [applicationId]}))
			else
				filters.push(search.createFilter({name: "name", join: "custrecord_pri_as_app", operator: search.Operator.IS, values: [applicationId]}));
			
			var sr = search.create({
				type: APP_SETTINGS_RECORD,
				filters: filters,
				columns: ["custrecord_pri_as_value"]				
			}).run().getRange(0,1);
			
			
			if (sr.length > 0) 
				settingId = sr[0].id;

			var REC;
			
			if (settingId) {
				// setting exists; update the value
				REC = record.load({type: APP_SETTINGS_RECORD, id: settingId});
				fieldType = REC.getValue("custrecord_pri_as_type");
			} else {
				REC = record.create({type: APP_SETTINGS_RECORD});
				REC.setValue("name", settingName);
				
				if (applicationId %1 === 0)
					REC.setValue("custrecord_pri_as_app", applicationId);
				else
					REC.setValue("custrecord_pri_as_app", getApplicationId(applicationId));
					
				if (fieldType)
					REC.setValue("custrecord_pri_as_type", fieldType);
			}
			
			if (validateAppSettingValue(newValue, fieldType)) {			
				if (newValue !== "" && newValue !== null) 
					newValue = formatValueBeforeSaving(newValue, fieldType);

				REC.setValue("custrecord_pri_as_value", newValue);
				if (settingDescription)
					REC.setValue("custrecord_pri_as_desc", settingDescription);
					
				return REC.save();				
			} else
				throw "Invalid value " + newValue + " specified for field " + settingName + " of application " + applicationId;

		} 
		
		// ================================================================================================================================

		function getApplicationId(applicationName) {
			var sr = search.create({
				type: APP_NAME_LIST,
				filters: [["name",search.Operator.IS,applicationName]]			
			}).run().getRange(0,1);
			if (sr.length > 0)
				return sr[0].id;			
		}
		
		// ================================================================================================================================

		function formatValueBeforeSaving(fieldValue, fieldType) {
			var funcName = scriptName + "formatValueBeforeSaving " + fieldValue + " | " + fieldType;
						
			if (fieldValue === "" || fieldValue === null)
				return "";
						
			if (fieldType == FIELD_TYPES.BOOLEAN) {				
				if (fieldValue === true || fieldValue.toUpperCase() === "T" || fieldValue.toUpperCase() === "TRUE")
					fieldValue = "T";
				else
					fieldValue = "F";
			}

			if (fieldType == FIELD_TYPES.DATE) {
				if (fieldValue) {
					if (!(fieldValue instanceof Date))
						fieldValue = new Date(fieldValue);
					
					fieldValue = fieldValue.toLocaleDateString("en-US");
				}
			}

			if (fieldType == FIELD_TYPES.DATEANDTIME)
				if (fieldValue) {
					if (!(fieldValue instanceof Date))
						fieldValue = new Date(fieldValue);
					
					fieldValue = fieldValue.toUTCString();
				}
				

			if (fieldType == FIELD_TYPES.INTEGER) {
				if (fieldValue) {
					// fieldValue = Math.trunc(fieldValue);
					fieldValue = (fieldValue|0).toString();	// because NetSuite JS doesn't support Math.trunc()   !!!!!!!					
				}
				
			} 


			return fieldValue;			
		}
		
		// ================================================================================================================================


		function validateAppSettingValue(fieldValue, fieldType) {
			
			var funcName = scriptName + "validateAppSettingValue " + fieldValue + " | " + fieldType;
	
			if (fieldValue === "" || fieldValue === null)
				return true;
			
			
			if (fieldType == FIELD_TYPES.INTEGER) 
				return (fieldValue %1 === 0);
			
			if (fieldType == FIELD_TYPES.BOOLEAN)
				return (fieldValue === true || fieldValue === false || fieldValue.toUpperCase() === "T" || fieldValue.toUpperCase() === "TRUE" || fieldValue.toUpperCase() === "F" || fieldValue.toUpperCase() === "FALSE");
			
			if (fieldType == FIELD_TYPES.DATE) {
				var ts = Date.parse(fieldValue);
				return (isNaN(ts) == false)
			}

			if (fieldType == FIELD_TYPES.DATEANDTIME) {
				var ts = Date.parse(fieldValue);
				return (isNaN(ts) == false)
			}

			if (fieldType == FIELD_TYPES.JSON) {
				try {
					var j = JSON.parse(fieldValue);
					return true;
				} catch (e1) {
					return false;
				}				
			}			
			
			return true;
		}
		
		// ================================================================================================================================

		function isDuplicate(appId, fieldName, environment, fieldId) {
						
        	var filters = [
   			          	["isinactive",search.Operator.IS,false]
   			          	,"AND",["name",search.Operator.IS,fieldName]
   			          	,"AND",["custrecord_pri_as_app",search.Operator.ANYOF,appId]
   			          ];
	       	
	       	if (fieldId) {
	       		filters.push("AND");
	       		filters.push(["internalid",search.Operator.NONEOF,fieldId]);
	       	} 
	       		
	   		var sr = search.create({
	   			type: 		APP_SETTINGS_RECORD,
	   			filters: 	filters,
	   			columns: 	["custrecord_pri_as_environment"]
	   		}).run().getRange(0,99);

	   		for (var i = 0; i < sr.length; i++) {
	   			log.debug("isDuplicate",sr[i]); 
	   			if (!sr[i].getValue("custrecord_pri_as_environment") && !environment)
	   				return sr[i].id; 
	   			
	   			// if they both have values, see if any of them overlap
	   			if (sr[i].getValue("custrecord_pri_as_environment") && environment) {
	   				var envList1 = sr[i].getValue("custrecord_pri_as_environment").toUpperCase().split(",");
	   				var envList2 = environment.toUpperCase().split(",");
	   				
	   				for (var x = 0; x < envList1.length; x++)
	   					for (var y = 0; y < envList2.length; y++)
	   						if (envList1[x] == envList2[y])
	   							return sr[i].id; 
	   			}
	   		}
		}
		
		// ================================================================================================================================
    	/* ======================================================================================================================================== */
  
	    function createApplication(appName) {
	    	var funcName = scriptName + "createApplication " + appName; 

	    	var ss = search.create({
	    		type:		"customrecord_pri_app_list",
	    		filters:	[
	    		        	 	["isinactive",search.Operator.IS,false]
	    		        	 	,"AND",["name",search.Operator.IS,appName]
	    		        	 ]
	    	}).run().getRange(0,1); 
	    	
	    	if (ss.length > 0)
	    		return ss[0].id;
	    	else {
	    		log.audit(funcName, "Creating Application '" + appName + "'");
	    		var REC = record.create({type: "customrecord_pri_app_list"}); 
	    		REC.setValue("name", appName); 
	    		return REC.save();
	    	}    	
	    }
	    
	/*
	    var ENVIRONMENT_MATCH_LEVEL = {
				NO_MATCH:			0,
				GENERIC_MATCH:		1,
				ENVIRONMENT_MATCH:	2,
				ACCOUNT_MATCH:		3
		*/
				
	    function environmentMatchLevel(environment) {
	    	if (!environment)
	    		return ENVIRONMENT_MATCH_LEVEL.GENERIC_MATCH;
	    						
			var envList = environment.toUpperCase().split(",");
	
			if (envList.indexOf(runtime.accountId.toUpperCase()) >= 0) 
	    		return ENVIRONMENT_MATCH_LEVEL.ACCOUNT_MATCH;
				
			if (envList.indexOf(runtime.envType.toUpperCase()) >= 0) 
	    		return ENVIRONMENT_MATCH_LEVEL.ENVIRONMENT_MATCH;
						
			return ENVIRONMENT_MATCH_LEVEL.NO_MATCH;

	    }
		
		/* ======================================================================================================================================== */

        function createAppSettingsObject(appId) {
        	return new AppSettings(appId);
        }

        function AppSettings(appId) {
        	var funcName = scriptName + "AppSettings " + appId;

			try {
				if (appId %1 === 0) 
		        	this.appId = appId;
				else
					this.appId = getApplicationId(appId);


			var settings = [];
			
       		
	   		var sr = search.create({
	   			type: APP_SETTINGS_RECORD,
	   			filters: [
	   			          	["isinactive",search.Operator.IS,false]
	   			          	,"AND",["custrecord_pri_as_app",search.Operator.ANYOF,this.appId]	   			          
	   			          ],
	   			columns: ["name","custrecord_pri_as_value","custrecord_pri_as_environment"] 
	   		}).run().getRange(0,1000);

	   		for (var i = 0; i < sr.length; i++) {
	   			
	   			// only take this value if it is the "most specific" to this account
	   			var matchLevel = environmentMatchLevel(sr[i].getValue("custrecord_pri_as_environment"));
	   			var takeEntry = (matchLevel > 0);  

	   			// if we find any entry which matches better, then we skip this one
				for (var j = 0; j < sr.length; j++) 
					if (i != j && sr[i].getValue("name") == sr[j].getValue("name")) {
						if (environmentMatchLevel(sr[j].getValue("custrecord_pri_as_environment")) > matchLevel) {
							takeEntry = false;
							break; 
						}		
					} 
				
	   			if (takeEntry) 
		   			settings[sr[i].getValue("name")] = sr[i].getValue("custrecord_pri_as_value"); 	   				   			
	   		}

			
			this.settings = settings;
	        	
			return this;
			
			} catch (e) {
				log.error(funcName, e);
			}
        	
        }
        
    	/* ======================================================================================================================================== */

        AppSettings.prototype.readSetting = function (fieldName, defaultValue) {
        	var funcName = scriptName + "AppSettings.readSetting " + fieldName + " | " + defaultValue;
        	
        	try {
        	
        		if (fieldName in this.settings)
        			return this.settings[fieldName];
        		else
        			return defaultValue;

			} catch (e) {
        		log.error(funcName, e);
        	}
        }

    	/* ======================================================================================================================================== */

        AppSettings.prototype.writeSetting = function (fieldName, newValue, fieldType) {
        	var funcName = scriptName + "AppSettings.writeSetting " + fieldName + " | " + newValue + " | " + fieldType;
        	
        	try {        	
    			writeAppSetting(this.appId, fieldName, newValue, fieldType)
    			this.settings[fieldName] = newValue;

        	} catch (e) {
        		log.error(funcName, e);
        	}
        }
		

    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */
    	/* ======================================================================================================================================== */

		return {
			
			readAppSetting: 			readAppSetting,
			writeAppSetting: 			writeAppSetting,
			
			validateAppSettingValue: 	validateAppSettingValue,
			formatValueBeforeSaving: 	formatValueBeforeSaving,
	
			isDuplicate: 				isDuplicate,
	
			createApplication:			createApplication,			// creates an application with a specified name, and returns the ID, or returns the ID of the application if it already exists			
			createAppSettingsObject: 	createAppSettingsObject,
			
			FIELD_TYPES: 				FIELD_TYPES
		}

	}	

);