//-----------------------------------------------------------------------------------------------------------
// Copyright 2018 and Beyond, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

/*
 * 
 * Prolecto Utilities Bundle: Common Library of Extensions, Types, Constants and Functions available to SERVER scripts
 * 
 */
	
define(['N/record','N/search','N/runtime','N/ui/serverWidget','N/ui/message','N/redirect','N/format','N/email', 'N/https', 'N/url', 'N/xml', './PRI_CommonLibrary'],

		
	function(record, search, runtime, serverWidget, message, redirect, format, email, https, url, xml, priLibrary) {

		var scriptName = "PRI_ServerLibrary.";

		"use strict";

	
		
		// ================================================================================================================================
		// = MISC FUNCTIONS ===============================================================================================================
		// ================================================================================================================================

		// --------------------------------------------------------------------------------------------------------------------------------

		function getDataCenterURLs() {

			var funcName = "getDataCenterURLs";

			var dataCenterURLs = {};
			
			if (runtime.envType == runtime.EnvType.SANDBOX) {
				dataCenterURLs.restDomain = "https://rest.sandbox.netsuite.com";
				dataCenterURLs.webservicesDomain = "https://rest.sandbox.netsuite.com";
				dataCenterURLs.systemDomain = "https://system.sandbox.netsuite.com";
				return dataCenterURLs;					
			}
			
			var xmlRequest = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
				'<soapenv:Body> <getDataCenterUrls xmlns="urn:messages_2016_1.platform.webservices.netsuite.com"> <account>' +
				runtime.accountId + 
				'</account> </getDataCenterUrls> </soapenv:Body> </soapenv:Envelope>';
				
			var headers = [];
			headers['User-Agent-x'] = 'SuiteScript-Call';
			headers['Content-Type']= 'application/soap+xml';
			headers['SOAPAction'] = "getDataCenterUrls";

			var url = "https://webservices.netsuite.com/services/NetSuitePort_2016_1";
		    
		    var resp = null;
		    
			try {
				resp = https.request({method: https.Method.POST, url: url, headers: headers, body: xmlRequest});
			} catch(e) {
				log.error(funcName,"Failed to call URL to retrieve data center URLs; trying one more time : " + e.toString());
				resp = https.request({method: https.Method.POST, url: url, headers: headers, body: xmlRequest});
			}
		       	
			if (resp.code != "200") {
		    	log.error(funcName, "Unknown Error returned from WebService.  Details below.");
		    	log.error(funcName, "resp.code=" + resp.code);
		    	log.error(funcName, "resp.body=" + resp.body);
		    	log.error(funcName, "resp.headers=" + JSON.stringify(resp.headers));
				
	            error.create({
	                "name" : "Data Center URLs Not Retrieved",
	                "message" : "Unable to retrieve data center URLs: " + resp.code + " : " + resp.body 
	            });
			}
			
			var xmlDoc = xml.Parser.fromString(resp.body);	

			var statusNode = xml.XPath.select({node: xmlDoc, xpath: "//platformCore:status/attribute::isSuccess"});
			if (statusNode && statusNode.length && statusNode[0].value == "true") {
				dataCenterURLs.restDomain = xml.XPath.select({node: xmlDoc, xpath: "//platformCore:restDomain"})[0].textContent;
				dataCenterURLs.webservicesDomain = xml.XPath.select({node: xmlDoc, xpath: "//platformCore:webservicesDomain"})[0].textContent;
				dataCenterURLs.systemDomain = xml.XPath.select({node: xmlDoc, xpath: "//platformCore:systemDomain"})[0].textContent;
				return dataCenterURLs;		
			} else {
	            error.create({
	                "name" : "Data Center URLs Not Retrieved",
	                "message" : "Unable to retrieve data center URLs: " + resp.body 
	            });
			}
			
		}
		
		// ================================================================================================================================
		// ================================================================================================================================

		/* parms: {
				recType: 		if 2nd parameter is not provided (REC), then you must provide a record type and record id 
				recId:
				noteTitle: "?", 
				noteText: "?", 
				noteType: "?"
			}
			
			two methods of calling this:   	addUserNote({recType: "salesorder", recId: 999, noteTitle: "My Notes", noteText: "My First Note"});
											addUserNote({noteTitle: "My Notes", noteText: "My First Note"}, REC);							// with this call, will know the record type/id from REC 
			
		*/
		function addUserNote(parms, REC) {
			
			if (REC)
				parms.recType = REC.type;
			if (REC)
				parms.recId = REC.id; 
			
			var funcName = scriptName + "addUserNote " + JSON.stringify(parms);

			const DEFAULT_NOTE_TYPE = 7;
			
			log.debug(funcName, "*** STARTING ***"); 
			
			var N = record.create({type: record.Type.NOTE, isDynamic: true});

			if (priLibrary.isItem(parms.recType, parms.recId))
				N.setValue("item", parms.recId);				
			else if (priLibrary.isEntity(parms.recType, parms.recId))
				N.setValue("entity", parms.recId);
			else if (parms.recType.substring(0, 12) == "customrecord") {
				N.setValue("recordtype", getCustomRecordTypeInternalId(parms.recTpe));
				N.setValue("record", parms.recId);
			} else if (priLibrary.isTransaction(parms.recType, parms.recId)) 
				N.setValue("transaction", parms.recId);
			else {
				log.error(funcName, "Unhandled record type.  Can't attach note.")
				return;
			}

			if (parms.noteText)
				N.setValue("note", parms.noteText.substring(0,4000));
			else
				N.setValue("note",parms.noteTitle);
	   
			N.setValue("title", parms.noteTitle || "");
			N.setValue("notetype", parms.noteType || DEFAULT_NOTE_TYPE);

			var id = N.save();

			log.debug(funcName, "Note " + id + " created."); 
		}

		
		// ================================================================================================================================
		
		
		// returns the integer 
		function getCustomRecordTypeInternalId(custRecType) {
			
			var idMatch = (/\brectype=(\d+)/).exec(url.resolveRecord({recordType: custRecType}));
			return idMatch ? idMatch[1] : null;
			
		/*
			// url.match(/.*?[?&]rectype=([^&]*)/);
			
			var recURL = url.resolveRecord({recordType: custRecType, recordId:1}); 
			
			log.debug("get",recURL); 
			
			var queryparams=recURL.split('?')[1];
			var params=queryparams.split('&');
			var pair="",data=[];
			var entityValue="";
			
			params.forEach(function(d){
				pair=d.split('=');
				data.push({key:pair[0],value:pair[1]});
				for(var i=0;i<data.length;i++) {
					if(data[i].key=="rectype") {
						entityValue=data[i].value; 
					}
				}				
			}); 
			return entityValue;
		*/ 
		}
		
		// ================================================================================================================================

		
		function getUserPermissionOnRecordType(recType) {
			var funcName = scriptName + "getUserPermissionOnRecordType " + recType;
			
			if(!recType)
				return 0;

			var permissionCode;
			
			if (recType.startsWith("customrecord")) {
				var recId = getCustomRecordTypeInternalId(recType);
				if (recId) 
					permissionCode = "LIST_CUSTRECORDENTRY" + recId;
			} else {
				var recInfo = priLibrary.getRecordTypeInfo(recType); 
				
				if (recInfo)
					permissionCode = recInfo.permissionCode; 
			}
			
			if (!permissionCode)
				throw "Couldn't find permission id for record type '" + recType + "'";

			var permissionLevel = runtime.getCurrentUser().getPermission(permissionCode);
			
			log.debug(funcName, "Permission Level is " + permissionLevel);

			return permissionLevel;
		}
		
		// ================================================================================================================================
		// = MAP/REDUCE SCRIPTS CAN USE THESE FUNCTIONS TO STORE/RETRIEVE DATA FROM GETINPUT TO SUMMARIZE STEPS ===========================
		// ================================================================================================================================

		
		function writeToScriptDeploymentCache(data) {
			var id = runtime.getCurrentScript().deploymentId; 
			
			var ss = search.create({
				type:		"customrecord_pri_mr_script_deploy_cache",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["name",search.Operator.IS,id]
				        	 ]				
			}).run().getRange(0,1); 
			
			if (ss.length == 0) {
				var REC = record.create({type: "customrecord_pri_mr_script_deploy_cache"}); 
				REC.setValue("name", id)
			} else
				var REC = record.load({type: "customrecord_pri_mr_script_deploy_cache", id: ss[0].id}); 
			
			REC.setValue("custrecord_pri_mr_sdc_data", data); 
			
			REC.save(); 			
		}
		
		function readFromScriptDeploymentCache() {
			var id = runtime.getCurrentScript().deploymentId; 
			
			var ss = search.create({
				type:		"customrecord_pri_mr_script_deploy_cache",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["name",search.Operator.IS,id]
				        	 ]				
			}).run().getRange(0,1); 
			
			if (ss.length == 0) 
				return "";
			else {
				var REC = record.load({type: "customrecord_pri_mr_script_deploy_cache", id: ss[0].id}); 
				return REC.getValue("custrecord_pri_mr_sdc_data"); 
			}			
		}		
		
		// ================================================================================================================================
		// = FUNCTIONS RELATED TO HIDING FIELDS, etc. =====================================================================================
		// ================================================================================================================================

        function disableFormFields(fieldList, form) {              
            if (!(fieldList instanceof Array))
                  fieldList = [fieldList];
            
            for (f in fieldList) {
                  var fld = form.getField(fieldList[f]);
                  if (fld)
                        fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            }
      }
	
		// ================================================================================================================================

        function hideFormFields(fieldList, form) {              
              if (!(fieldList instanceof Array))
                    fieldList = [fieldList];
              
              for (f in fieldList) {
                    var fld = form.getField(fieldList[f]);
                    if (fld)
                          fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
              }
        }

		// ================================================================================================================================

		function hideSublist(form, sublistName) {
		      var sublist = form.getSublist({id: sublistName});

		      if (sublist)
		    	  sublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
		}
		


		// ================================================================================================================================

        function hideButtons(buttonList, form) {              
            if (!(buttonList instanceof Array))
            	buttonList = [buttonList];
            
            for (f in buttonList) {
                  var btn = form.getButton(buttonList[f]);
                  if (btn) {
  					btn.isDisabled = true;
					btn.isHidden = true;    					                	  
                  }
            }
        }

		// ================================================================================================================================

        function obscureFormFields(REC, form, fieldList, digitsToShow, fieldPrefix) {              
        	if (!(fieldList instanceof Array))
        		fieldList = [fieldList];
            
        	// we can't change the field value, so create another field and hide the "obscured" field
        	
        	digitsToShow = digitsToShow || 4;
            fieldPrefix = fieldPrefix || "****";
            
            for (f in fieldList) {
            	var fieldName = fieldList[f];
            	var fieldValue = REC.getValue(fieldName);            	
            	if (fieldValue && fieldValue.length > digitsToShow) {            		
    				var oldF = form.getField(fieldName);
    				var newFieldName = (fieldName.replace("custentity","custpage").replace("custbody","custpage").replace("custrecord","custpage"));
    				
                    var f = form.addField({id: newFieldName, label: oldF.label, type: serverWidget.FieldType.TEXT});
                    
                   	f.defaultValue = fieldPrefix + REC.getValue(fieldName).substr(REC.getValue(fieldName).length  - digitsToShow);	

                   	form.insertField({field: f, nextfield: fieldName});
                   	
    				hideFormFields(fieldName, form);    				
            	}
            }
        }
	

		// ================================================================================================================================
	    
        // useful on VIEW mode forms; 
        function executeOnFormLoad(form, scr) {
        	 var onLoad = form.addField({
                 id:'custpage_on_load_' + priLibrary.generateRandomString(4),
                 label:'not shown',
                 type: serverWidget.FieldType.INLINEHTML
             });
    		 
             onLoad.defaultValue = "<script>jQuery(function() {" + scr + "});</script>";    		
        }
        
		// ================================================================================================================================
	    
        // call it in beforeLoad.  if user is not allowed to edit, will redirect back to same record in VIEW mode with error message
		function preventEdit(context, canEdit, errorMsg) {				
			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.DELETE)) 
				if (!canEdit) 					
					redirect.toRecord({type: context.newRecord.type, id: context.newRecord.id, parameters: {rejectEdit: true}}); 

			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.VIEW) 
				if (context.request.parameters.rejectEdit) 
		        	context.form.addPageInitMessage({type: message.Type.ERROR, title: "Edit Not Allowed", message: errorMsg}); 
		}
		
		// ================================================================================================================================
        

		// when any of the fields listed in the fieldList (comma-separated) change values, the form automatically submits itself
		function addFormRefreshFields(form, fieldList) {            
    	    // for automatic page refreshes
     		var fld = form.addField({
     			id: "custpage_refresh_action",
     			label: "?",
     			type: serverWidget.FieldType.TEXT,
     		});
     		fld.updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});

     		var fld = form.addField({
     			id: "custpage_refresh_field_list",
     			label: "?",
     			type: serverWidget.FieldType.TEXT,
     		});
     		fld.updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
     		fld.defaultValue = fieldList
     		
     		form.clientScriptModulePath = "/.bundle/132118/PRI_CL_SuiteletRefresh.js";
		}

		// ================================================================================================================================

        function fieldChanged(context,fieldName) {
        	
        	var OLD = context.oldRecord; 
        	var NEW = context.newRecord; 
			var oldValue, newValue;
        	

			// on create, field changed if it has a value
			if (context.type == context.UserEventType.CREATE)
				return (NEW.getValue(fieldName)); 

			
			if (context.type == context.UserEventType.XEDIT) {
				// if field is not in the list, then it didn't change
    			var fieldList = context.newRecord.getFields();
    			if (fieldList.indexOf(fieldName) < 0)
    				return false;
			}
			
			var FLD = context.newRecord.getField(fieldName);
			
			if (FLD.type == format.Type.DATE || FLD.type == format.Type.DATETIME || FLD.type == format.Type.DATETIMETZ) {
				oldValue = OLD.getValue(fieldName) ? OLD.getValue(fieldName).getTime() : -1;
				newValue = NEW.getValue(fieldName) ? NEW.getValue(fieldName).getTime() : -1;
			} else {
				oldValue = OLD.getValue(fieldName);
				newValue = NEW.getValue(fieldName);
			}
			
			return (oldValue != newValue);
        }
        


        function fieldChangedFromValue(context,fieldName,fromValue) {
        	if (fieldChanged(context,fieldName)) {
        		if (context.type == context.UserEventType.EDIT && context.oldRecord.getValue(fieldName) == fromValue)
        			return true; 

        		if (context.type == context.UserEventType.XEDIT) {
        			var fieldList = context.newRecord.getFields();
        			if (fieldList.indexOf(fieldName) >= 0)
        				if (context.oldRecord.getValue(fieldName) == fromValue)
        					return true; 
        		}
        	}
        }
        

        function fieldChangedToValue(context,fieldName,toValue) {
        	return (fieldChanged(context,fieldName) && context.newRecord.getValue(fieldName) == toValue);          		
        }

        
		// ================================================================================================================================

        function userEventIsCreate(context) {
        	return (context.type == context.UserEventType.CREATE); 
        }

        function userEventIsEdit(context) {
        	return (context.type == context.UserEventType.EDIT);         	
        }

        function userEventIsInlineEdit(context) {
        	return (context.type == context.UserEventType.XEDIT);         	
        }

        function userEventIsEditOrCreate(context) {
        	return (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT);         	
        }


		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================
	    
		return {

		//	--- *** DEFINED IN THIS SCRIPT *** -------------------------------------------------------------------------------- 
			
		//	FORM-RELATED FUNCTIONS
			
			disableFormFields:				disableFormFields,						// disables fields (used during beforeLoad)
			hideFormFields:					hideFormFields,							// hides fields (used during beforeLoad)
			obscureFormFields:				obscureFormFields,						// turns a field (eg social security #) into something like '####9999'
			hideButtons:					hideButtons,
			hideSublist:					hideSublist,							// hides an entire sublist (not a tab -- but a sublist)
	
			executeOnFormLoad:				executeOnFormLoad,						// used in beforeLoad when in VIEW mode, to execute script client-side as soon as the form loads

			getDataCenterURLs : 			priLibrary.getDataCenterURLs,

			getUserPermissionOnRecordType:	getUserPermissionOnRecordType,			// tells you the permission level that current user has on a specific record
			getCustomRecordTypeInternalId:	getCustomRecordTypeInternalId,
			
			writeToScriptDeploymentCache:	writeToScriptDeploymentCache,
			readFromScriptDeploymentCache:	readFromScriptDeploymentCache,
			
			preventEdit:					preventEdit,							// if user is not permitted to edit, redirects back to same record with error message 
			
			fieldChanged:					fieldChanged,							// checks whether a field's value changed (used on beforeSubmit or afterSubmit)
			fieldChangedFromValue:			fieldChangedFromValue,					// checks whether a field's value changed FROM a specific previous value 
			fieldChangedToValue:			fieldChangedToValue,					// checks whether a field's value changed TO a specific new value

			addFormRefreshFields:			addFormRefreshFields,					// allows a suitelet to refresh (submit) itself when any of a list of fields changes values (typeically selection criteria)

			// USER-EVENT SCRIPT HELPERS 
			userEventIsCreate:				userEventIsCreate,						// are we in a CREATE context
			userEventIsEdit:				userEventIsEdit,						// are we in a EDIT context
			userEventIsInlineEdit:			userEventIsInlineEdit,					// are we in a INLINE EDIT / XEDIT context
			userEventIsEditOrCreate:		userEventIsEditOrCreate,				// are we in a CREATE or EDIT context
									

		//	--- *** IMPORTED FROM COMMON LIBRARY *** -------------------------------------------------------------------------- 
			
			// 	CONSTANTS
			FORM_DELIMITERS:				priLibrary.FORM_DELIMITERS,
			ITEM_TYPE_MAP: 					priLibrary.ITEM_TYPE_MAP,
			RECORD_TYPE_INFO:				priLibrary.RECORD_TYPE_INFO,
			
			
			// RECORD/ITEM/TRANSACTION FUNCTIONS			
			getRecordTypeInfo:				priLibrary.getRecordTypeInfo,
			nativeRecordType:				priLibrary.nativeRecordType,				
			transactionType:				priLibrary.transactionType,
			isTransaction:					priLibrary.isTransaction,
			getItemType:					priLibrary.getItemType,
			loadItem:						priLibrary.loadItem,
			isSelectFieldItemSelected:		priLibrary.isSelectFieldItemSelected,
			isItem:							priLibrary.isItem,									// is the record type a type of "item"
			isEntity:						priLibrary.isEntity,									// is the record type a type of "item"
			
			addUserNote:					addUserNote,
			
			// SEARCH-RELATED FUNCTIONS
			searchAllRecords:				priLibrary.searchAllRecords,
			valueExists:					priLibrary.valueExists,
			getSearchResultValueByLabel:	priLibrary.getSearchResultValueByLabel,
			getSearchResultTextByLabel:		priLibrary.getSearchResultTextByLabel,
			
			
			//	DATA CHECK FUNCTIONS			
			isUndef: 						priLibrary.isUndef,
			isNull: 						priLibrary.isNull,
			isEmpty: 						priLibrary.isEmpty,
			isNotNull: 						priLibrary.isNotNull,
			isNotEmpty: 					priLibrary.isNotEmpty,
			isObject:						priLibrary.isObject, 
			isArray:						priLibrary.isArray, 

			// STRING FUNCTIONS
			fixEmailRecipientList:			priLibrary.fixEmailRecipientList,					// takes string of values delimited by either comma or semi-colon, and removes "empties" (eg:   a,b,,,c,d, ==> a,b,c,d) -- useful for cleaning up email lists  				
			isEmailAddressValid:			priLibrary.isEmailAddressValid,			
			findInvalidEmailAddress:		priLibrary.findInvalidEmailAddress,

			generateGUID : 					priLibrary.generateGUID,
			generateRandomString : 			priLibrary.generateRandomString,
			formatCSValue:					priLibrary.formatCSValue,
			currentDateTimeStr:				priLibrary.currentDateTimeStr,

	
			// TIMER FUNCTIONS
			startTimer:						priLibrary.startTimer,
			elapsedTimeInNanoSeconds:		priLibrary.elapsedTimeInNanoSeconds,
			elapsedTimeInMilliSeconds:		priLibrary.elapsedTimeInMilliSeconds,
			elapsedTimeInSeconds:			priLibrary.elapsedTimeInSeconds,
			
			// MISC FUNCTIONS
			extractMapReduceErrorMessages:	priLibrary.extractMapReduceErrorMessages,
			logDebugAll:					priLibrary.logDebugAll,
			getAccountingPeriod: 			priLibrary.getAccountingPeriod,
			accountingPeriodIsOpen:			priLibrary.accountingPeriodIsOpen,
			accountingPeriodIsClosed:		priLibrary.accountingPeriodIsClosed
			
		}

	}	

);