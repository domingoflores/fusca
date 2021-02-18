/**
 * toolsLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities 
 *
 *
 * Version    Date            Author           Remarks
 *	1.0		  				  Ken Crossman	   Meant to be a receptacle for useful scripting tools/functions/utilities 
 *  2.0       2018-11-26      Ken Crossman     ATP-343 Fix overspecific message and add employeeFunction parameter
 *  3.0       2019-01-23      Ken Crossman     ATP-550 Add function preventEdit
 *  4.0		  6/04/2019		  Robert Bender	   ATP-856 Added didValuesChange() function to see if field changed on xEdit too
 *  5.0       2019-12		  Ken C            ATP-1350 Moved checkPermission function to client library
 */

define(['N/search', 'N/runtime', 'N/redirect', 'N/ui/message' ,'N/https' ,'N/url' ,'N/record'
	   ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	   ,'/.bundle/132118/PRI_AS_Engine'
	   ,'/SuiteScripts/Pristine/libraries/toolsLibraryClient.js'
	   ],

	function (search ,runtime ,redirect ,message ,https ,url ,record 
			 ,srsContants 
			 ,appSettings
			 ,toolsLibClient
			 ) {
		var scriptName = "toolsLibrary.js";


		//======================================================================================================================================
		//======================================================================================================================================
		function setFieldDisplayType(context, fields, displayType, makeMandatory) {
			for (ix in fields) {
				var tempField = context.form.getField({ id:fields[ix] });
				if (tempField) {
					// Only do something if the argument has been supplied
					if (typeof displayType !== 'undefined') { tempField.updateDisplayType({ displayType: displayType }); }
					// Only do something if the argument has been supplied
					if (typeof makeMandatory !== 'undefined') {
						makeMandatory = makeMandatory.toUpperCase();
						switch (makeMandatory) {
							case 'MANDATORY':
								tempField.isMandatory = true;
								break;
							case 'OPTIONAL':
								tempField.isMandatory = false;
								break;
							default:
								break;
						}
					}
				}
			}
		}
		
		
		//=================================================================================================================================================
		//=================================================================================================================================================
		function lookupABA(ach_wire, routingNbr) {
			return toolsLibClient.lookupABA(ach_wire, routingNbr);
		}
		
		function isSubAccountOf(account, parentAccountsArray) {
			return toolsLibClient.isSubAccountOf(account, parentAccountsArray);
		}
		function multiSelecthasChanged(context, fieldid) {
			return toolsLibClient.multiSelecthasChanged(context, fieldid);
		}
		
		
		//=================================================================================================================================================
    	// checks the current user against a "standard" permission object to determine whether they match
    	//          the standard object is either a single object, or an array of objects
    	//          each element can contain any combination of userId, userRole, userDept, and environment
	    //          example: [{"userDept":"35" ,"userRole":"1025"} ,{"userDept":"35" ,"userRole":"1032"} ,{"userRole":"3" ,"environment":"SANDBOX" }]
	    //     
	    //          alternatively a single object can be passed that contains a reference to an appSetting where the list of 
	    //          permission objects will be stored example: {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"}
		//=================================================================================================================================================    
		function checkPermission(permissionObj) {
			var funcName = scriptName + '-->checkPermission';
			var hasAccess = toolsLibClient.checkPermission(permissionObj);
			//log.debug(funcName, 'hasAccess: ' + hasAccess);
			return hasAccess;
		}

		
		//==================================================================================================
		//==================================================================================================
	    function addUserNote(rcdId ,rcdType ,noteTitle ,noteText ,noteType ,callingScript) {
        	try {
        		if (!callingScript) { callingScript = "toolsLibrary.js"; }
        		               else { callingScript = callingScript + "===>toolsLibrary.js"; }
	    		if (!noteType) { noteType = 7; }
        		var rcdTypeId = getCustomRecordTypeInternalId(rcdType ,rcdId);
        		noteText = noteText.substr(0, 4000); // ensure max width of note
        		var userNote = record.create({ type:"note" });
        		userNote.setValue({ fieldId:"title"       ,value:noteTitle   });
        		userNote.setValue({ fieldId:"notetype"    ,value:noteType    });
        		userNote.setValue({ fieldId:"record"      ,value:rcdId       });
        		userNote.setValue({ fieldId:"recordtype"  ,value:rcdTypeId   });
        		userNote.setValue({ fieldId:"note"        ,value:noteText    });
        		var intUserNoteId = userNote.save();        	
        	}
        	catch(e) { log.error(callingScript, "Exception " + e.message  ); return false; }
        	return true;
	    }

	    
		//==================================================================================================
		//==================================================================================================
	    function getCustomRecordTypeInternalId(name ,rcdId) {
	    	//leverage NetSuite's URL generator to get the record type
	    	var recordURL = url.resolveRecord({ recordType:name ,recordId:rcdId ,isEditMode:false ,params:{} });
	    	return getURLParameterByName('rectype', recordURL)

	    	//url parser helper function
	    	function getURLParameterByName(name, url) {
	    		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	    	        results = regex.exec(url);
	    	    return results === null ? "" : results[1].replace(/\+/g, " ");
	    	};
	    };


		//=================================================================================================================================================
		//=================================================================================================================================================
		var arrTimestamps = [];
		var currentTimestamp;
		var previousTimestamp;
		var startingTimestamp;
		var timestampDatetime;

		//=================================================================================================================================================
		//=================================================================================================================================================
		function takeTimestamp(note, argStartStop) {
			var startStop;
			if (!argStartStop) {
				startStop = ""
			} else {
				startStop = argStartStop;
			}

			if (startStop.toUpperCase() == "START" || timestampDatetime == null) {
				timestampDatetime = new Date();
				currentTimestamp = timestampDatetime.getTime();
				startingTimestamp = timestampDatetime.getTime();
			}

			var objTimestamp = {};
			timestampDatetime = new Date();
			previousTimestamp = currentTimestamp;
			currentTimestamp = timestampDatetime.getTime();
			objTimestamp.ElapsedSecs = parseInt((currentTimestamp - startingTimestamp) / 1000);
			objTimestamp.diff = currentTimestamp - previousTimestamp;
			objTimestamp.diffSecs = parseInt(objTimestamp.diff / 1000);
			objTimestamp.note = note;
			objTimestamp.curr = currentTimestamp;
			objTimestamp.prev = previousTimestamp;
			objTimestamp.datetimeString = timestampDatetime.toString();
			arrTimestamps.push(objTimestamp);

			if (startStop.toUpperCase() == "STOP") {
				logTimestampArray();
			}
		}

		//=================================================================================================================================================
		//=================================================================================================================================================
		function logTimestampArray() {
			var i = 0;
			log.audit('Timestamp Array', JSON.stringify(arrTimestamps));

			for each(objTimestamp in arrTimestamps) {
				i++;
				log.audit('Timestamp ' + i, JSON.stringify(objTimestamp));

			} // for each (result in searchHolidaysResults)
		}
		function makeMandatory(context, field, value)
        {
        	if (!field)
        	{
        		return;
        	}
        	var ofield = context.form.getField({id:field});
        	if (ofield)
        	{
        		ofield.isMandatory = value;
        	}

        }
		//=================================================================================================================================================
		//=================================================================================================================================================
		function dealActionDealActionResolutionUserHasEditAccess(context, objUser, environment) {
			var userHasAccess = false;
			//log.debug("dealActionDealActionResolutionUserHasEditAccess", JSON.stringify(objUser));
			if (environment == "SANDBOX" && objUser.role == srsContants.USER_ROLE.ADMINISTRATOR) {
				return true;
			}
			if (environment == "SANDBOX" && objUser.role == srsContants.USER_ROLE.CUSTOM_ADMINISTRATOR) {
				return true;
			}

			//First Check restrictions based on Department and Role

			//Deal Action/Action Resolution Edit Access   
			var departmentAndRoleEditAccessList = JSON.parse(appSettings.readAppSetting("Acquiom Escrow Agent", "Deal Action/Action Resolution Edit Access"));


			var objDepartmentAccess;
			var departmentName;
			var rcd = context.newRecord;
			//log.debug("dealActionDealActionResolutionUserHasEditAccess", "rcd.getValue('custrecord_da_department'): " + rcd.getValue("custrecord_da_department"));

			var departmentId;
			if (rcd.type == "customrecord_deal_action") {
				departmentId = rcd.getValue("custrecord_da_department");
			} else if (rcd.type == "customrecord_deal_action_resolution") {
				departmentId = rcd.getValue("custrecord_dar_department");
			} else return false;
			departmentName = getCustomListEntryText("customlist_proj_task_mng_dept", departmentId, "name") + "";

			//	    	if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY) {
			//	    		var departmentId;
			//	    	         if (rcd.type == "customrecord_deal_action")             { departmentId = rcd.getValue("custrecord_da_department");  }
			//	 	    	else if (rcd.type == "customrecord_deal_action_resolution")  { departmentId = rcd.getValue("custrecord_dar_department"); }
			//	 	    	else return false;
			//	 	    	log.debug("dealActionDealActionResolutionUserHasEditAccess" ,JSON.stringify(departmentId) );
			//	    	    departmentName = getCustomListEntryText("customlist_proj_task_mng_dept" ,departmentId ,"name") + ""; 
			//	    	    log.debug("dealActionDealActionResolutionUserHasEditAccess" ,JSON.stringify(departmentName) );	    		
			//	    	}
			//	    	else {
			//	    	         if (rcd.type == "customrecord_deal_action")             { departmentName = rcd.getText("custrecord_da_department");  }
			//	 	    	else if (rcd.type == "customrecord_deal_action_resolution")  { departmentName = rcd.getText("custrecord_dar_department"); }
			//	 	    	else return false;
			//	    	}




			objDepartmentAccess = departmentAndRoleEditAccessList[0];
			for (var i = 1; i < departmentAndRoleEditAccessList.length; i++) {
				var objAccess = departmentAndRoleEditAccessList[i];
				if (objAccess.departmentName == departmentName) {
					objDepartmentAccess = departmentAndRoleEditAccessList[i];
				}
			}

			//log.debug("dealActionDealActionResolutionUserHasEditAccess", "context.type: " + context.type);
			//log.debug("dealActionDealActionResolutionUserHasEditAccess", JSON.stringify(objDepartmentAccess));

			for (var j = 0; j < objDepartmentAccess.roleIdList.length; j++) {
				if (objUser.role == objDepartmentAccess.roleIdList[j]) {
					userHasAccess = true;
				}
			}

			//log.debug("dealActionDealActionResolutionUserHasEditAccess", "userHasAccess: " + userHasAccess);

			if (userHasAccess && objDepartmentAccess.departmentName == "default") {
				if (context.type != context.UserEventType.EDIT && context.type != context.UserEventType.VIEW) {
					var userEditOnlyAccessList = JSON.parse(appSettings.readAppSetting("Acquiom Escrow Agent", "Deal Action/Action Resolution Edit Only Access"));
					for (var k = 0; k < userEditOnlyAccessList.length; k++) {
						//log.debug("dealActionDealActionResolutionUserHasEditAccess", "objUser.name: " + objUser.name + "   " + JSON.stringify(userEditOnlyAccessList));
						if (objUser.name == userEditOnlyAccessList[k]) {
							userHasAccess = false;
						}
					}
				}
			}

			//log.debug("dealActionDealActionResolutionUserHasEditAccess", "userHasAccess: " + userHasAccess);



			return userHasAccess;

		}

		//=================================================================================================================================================
		//=================================================================================================================================================
		function getCustomListEntryText(listId, entryInternalId, fieldName) {

			try {
				if (!(entryInternalId > "")) {
					return null;
				}
				var arrColumns = new Array();
				var col_name = search.createColumn({
					name: fieldName
				});
				arrColumns.push(col_name);
				var arrFilters = [
					['isinactive', 'IS', false], 'AND', ['internalid', 'IS', entryInternalId]
				];
				var objSearch = search.create({
					'type': listId,
					'filters': arrFilters,
					'columns': arrColumns
				});
				var runSearch = objSearch.run();
				var SearchResults = runSearch.getRange(0, 1);
				if (SearchResults && SearchResults.length > 0) {
					return SearchResults[0].getValue(col_name);
				} else return null;
			} catch (e) {
				return null;
			}

		}

		//=================================================================================================================================================
		//=================================================================================================================================================
		function getEnvironment() {
			if (runtime.accountId == "772390_SB3") {
				return "DEV";
			} else if (runtime.accountId == "772390_SB1") {
				return "STG";
			} else if (runtime.accountId == "772390") {
				return "PRD";
			} else {
				return "OTH";
			}
		}

		//=================================================================================================================================================
		//=================================================================================================================================================
		function isEnvironment(env) {
			if (env == "DEV" && runtime.accountId == "772390_SB3") {
				return true;
			} else if (env == "STG" && runtime.accountId == "772390_SB1") {
				return true;
			} else if (env == "PRD" && runtime.accountId == "772390") {
				return true;
			} else {
				return false;
			}
		}

		function checkUserPermissions(permittedRoles, permittedDepts, employeeFunction, operator) {
			//log.debug('toolsLibrary => checkUserPermissions', 'permittedRoles: ' + JSON.stringify(permittedRoles));
			//log.debug('toolsLibrary => checkUserPermissions', 'permittedDepts: ' + JSON.stringify(permittedDepts));
			//log.debug('toolsLibrary => checkUserPermissions', 'employeeFunction: ' + JSON.stringify(employeeFunction));
			//log.debug('toolsLibrary => checkUserPermissions', 'operator: ' + JSON.stringify(operator));
			var success = false;
			var message = '';
			var user = runtime.getCurrentUser();
			//log.debug('toolsLibary => checkUserPermissions', 'user: ' + JSON.stringify(user));
			var userDeptName = '';
			var supervisorId = '';
			var i;
			// If Operator not provided or is invalid then AND is assumed. All checks must have passed if Operator = AND
			if (operator === undefined || (operator.toUpperCase() !== 'AND' && operator.toUpperCase() !== 'OR')) {
				operator = 'AND';
			}

			// Loop through the permitted roles to ensure user role is valid
			var permittedRoleSuccess = false;
			// If Permitted Roles argument not supplied then if the operator = AND treat this as a success else not 
			if (permittedRoles === undefined || permittedRoles.length === 0) {
				if (operator === 'AND') {
					permittedRoleSuccess = true;
				}
			} else {
				for (i = 0; i < permittedRoles.length; i++) {

					//log.debug("toolsLibary =>", " user.roleId: " + user.roleId + ",   permittedRoles[i]: " + permittedRoles[i]);
					if (user.roleId === permittedRoles[i]) {
						//log.debug('toolsLibary => permitted ');
						permittedRoleSuccess = true;
						message += 'User role valid;<br>';
						break;
					}
				}
				if (!permittedRoleSuccess) {
					//log.debug('toolsLibary => no access ');
					message += 'Your role does not have permission for this action;<br>';
				}
			}

			// Loop through the permitted departments to ensure user department is valid
			var permittedDeptSuccess = false;
			// If Permitted Departments argument not supplied then if the operator = AND then treat this as a success else not 
			if (permittedDepts === undefined || permittedDepts.length === 0) {
				if (operator === 'AND') {
					permittedDeptSuccess = true;
				}
			} else {
				for (i = 0; i < permittedDepts.length; i++) {
					if (user.department === Number(permittedDepts[i])) {
						permittedDeptSuccess = true;
						message += 'User department valid;<br>';
						break;
					}
				}
				if (!permittedDeptSuccess) {
					message += 'Your department does not have permission for this action;<br>';
				}
			}

			// If the Employee Function is provided then the user must be linked to that Function
			var employeeFunctionSuccess = false;
			var employeeFunctionResult;
			// If the Employee Function argument not supplied then if the operator = AND then treat this as a success else not 
			if (employeeFunction === undefined || employeeFunction === '') {
				if (operator === 'AND') {
					employeeFunctionSuccess = true;
				}
			} else {
				// Check if user has Employee Function
				employeeFunctionResult = getEmployeeFunction(user.id, employeeFunction);
				employeeFunctionSuccess = employeeFunctionResult.success;
				//log.debug('toolsLibrary => checkUserPermissions', 'employeeFunctionResult: ' + JSON.stringify(employeeFunctionResult));
				if (employeeFunctionResult.success) {
					message += 'User has the Employee Function ' + employeeFunction + ' ;<br>';
				} else {
					message += 'You do not have the Employee Function ' + employeeFunction + ' required for this action;<br>';
				}
			}

			// When operator = AND then unsupplied arguments are set to true
			if (operator === 'AND') {
				if (permittedRoleSuccess && permittedDeptSuccess && employeeFunctionSuccess) {
					success = true;
				}
			} else {
				// One check must have passed if Operator = OR
				if (permittedRoleSuccess || permittedDeptSuccess || employeeFunctionSuccess) {
					success = true;
				}
			}

			return {
				success: success,
				message: message
			};
		}
		/**
		 * This function uses the provided user id and Function table row id to find an Employee Funtion row.
		 * If found this function returns true otherwise false.
		 * 
		 * @param  {string} user id of the logged on user (Mandatory)
		 * @param  {string} internal id of Function table row (Mandatory)
		 * @return {boolean} true if user is linked to the Function - otherwise false
		 *          	
		 */
		function getEmployeeFunction(userId, employeeFunction) {
			//log.debug('toolsLibary => getEmployeeFunction', 'userId: ' + JSON.stringify(userId));
			//log.debug('toolsLibary => getEmployeeFunction', 'employeeFunction: ' + JSON.stringify(employeeFunction));
			var success;
			var message;
			var searchResults;
			if ((userId === undefined || userId === '') ||
				(employeeFunction === undefined || employeeFunction === '')) {
				success = false;
				message = 'Mandatory arguments not provided';
			} else {
				var filters = [];
				filters.push({
					name: 'custrecord_ef_employee',
					operator: search.Operator.ANYOF,
					values: userId
				});
				filters.push({
					name: 'custrecord_ef_function',
					operator: search.Operator.ANYOF,
					values: employeeFunction
				});
				filters.push({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: 'F'
				});
				var efSearch = search.create({
					type: 'customrecord_employee_function',
					title: 'EmpFuncSearch',
					columns: ['internalid', 'custrecord_ef_function'],
					filters: filters
				}).run();
				searchResults = efSearch.getRange(0, 1); //I expect max 1 row to return
				if (searchResults.length > 0) {
					//log.debug('toolsLibary => getEmployeeFunction', 'searchResults: ' + JSON.stringify(searchResults));
					// We found the right Employee Function linked to this user
					success = true;
					message = 'Employee Function found';
				} else {
					success = false;
					message = 'Employee Function not found';
				}
			}

			return {
				success: success,
				message: message,
				employeeFunction: searchResults
			};
		}
		// ================================================================================================================================

		// call it in beforeLoad.  if user is not allowed to edit, will redirect back to same record in VIEW mode with error message
		function preventEdit(context, canEdit, errorMsg) {
			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.EDIT)
				if (!canEdit)
					redirect.toRecord({
						type: context.newRecord.type,
						id: context.newRecord.id,
						parameters: {
							rejectEdit: true
						}
					});

			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.VIEW)
				if (context.request.parameters.rejectEdit)
					context.form.addPageInitMessage({
						type: message.Type.ERROR,
						title: "Edit Not Allowed",
						message: errorMsg
					});
		}

		// ================================================================================================================================

		function getQueryParameter(parmName) {
			var queryString = window.location.href;

			var parms = queryString.split("&");
			for (var i = 0; i < parms.length; i++) {
				if (parms[i].toLowerCase().startsWith(parmName.toLowerCase() + "=")) {
					return parms[i].substring(parmName.length + 1);
				}
			}
		}

		//=================================================================================================================================

		function getFieldValue(context, fieldId) {
			var newRecFields = context.newRecord.getFields();
			var fieldValue = null;
			fieldValue = context.newRecord.getValue(fieldId);
			var fieldPos = null;
			if (context.type === 'xedit') {
				fieldPos = newRecFields.indexOf(fieldId);
				if (fieldPos === -1) {
					fieldValue = context.oldRecord.getValue(fieldId);
				}
			}
			return fieldValue;
		}


		// ================================================================================================================================

		//<ATP-856>
		// checks for xEdit & old/new rec for if any of fields in the array passed in changed
		function didValuesChange(context, fields) {
			// If this is a create then we want to sync irrespective
			if (context.type === 'create') {
				return true;
			}
			var newRecFields = context.newRecord.getFields();
			for (var i = 0; i < fields.length; i++) {
				var fieldPos = null;
				if (context.type == 'xedit') {
					fieldPos = newRecFields.indexOf(fields[i]);
					if (fieldPos != -1) {
						if (context.oldRecord.getValue(fields[i]) != context.newRecord.getValue(fields[i])) { return true; } // ATP-1621
					}
				} else {
					if (context.oldRecord.getValue(fields[i]) != context.newRecord.getValue(fields[i])) {
						return true;
					}
				}
			} // i++
			return false;
		}
		// ================================================================================================================================
		function areArraysEqual(array1, array2) {
        	var funcName = scriptName + "==>areArraysEqual";
			
			return toolsLibClient.areArraysEqual(array1, array2);

        }
        // ================================================================================================================================
        function isJSONValid(JSONObj) {
			var funcName = scriptName + "==>isJSONValid";
			return toolsLibClient.isJSONValid(JSONObj);   	
        }

		return {

			dealActionDealActionResolutionUserHasEditAccess: dealActionDealActionResolutionUserHasEditAccess,
			areArraysEqual : areArraysEqual,
			isJSONValid: isJSONValid,
			getEnvironment: getEnvironment,
			isEnvironment: isEnvironment,
			makeMandatory : makeMandatory,
			checkUserPermissions: checkUserPermissions,
			preventEdit: preventEdit,
			getQueryParameter: getQueryParameter,
			getFieldValue: getFieldValue,
			didValuesChange: didValuesChange,
			takeTimestamp: takeTimestamp
			,checkPermission:checkPermission
			,addUserNote: addUserNote
			,lookupABA: lookupABA
			,isSubAccountOf: isSubAccountOf
			,multiSelecthasChanged: multiSelecthasChanged
			,setFieldDisplayType: setFieldDisplayType

		};
	});