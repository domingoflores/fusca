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
 * Prolecto Utilities Bundle: Common Library of Extensions, Types, Constants and Functions available to CLIENT scripts
 * 
 */
	
define(['N/record','N/search','N/runtime','N/format','N/email', 'N/https', 'N/url', 'N/xml', './PRI_CommonLibrary'],

		
	function(record, search, runtime, format, email, https, url, xml, priLibrary) {

		var scriptName = "PRI_ClientLibrary.";

		"use strict";

	
		
		// ================================================================================================================================
		// = FORM FUNCTIONS ===============================================================================================================
		// ================================================================================================================================

		function disableFormField(context,formId,fieldId,lineNbr,isDisabled){
			try {
				
				var fld;
				
				if (formId) {
					fld = getFormElement(document.forms[formId+"_form"],getFieldName(fieldId));
					if (fld == null)
						fld = getFormElement( document.forms[formId+'_form'], getFieldName(fieldId)+lineNbr);
				}
				else
					fld = getFormElement(document.forms["main_form"],getFieldName(fieldId));
				
				if (isSelect(fld)){
					disableSelect(fld,isDisabled);				
				} else {
				    disableField(fld,isDisabled);
				}

			} catch (e) {
				console.log("nsDisableField " + fieldId + " *ERROR* " + e);
				;
			}
			
		}

		
		function showHideFormFields(context, fieldList, showField) {
			
			var fld;
			
			if (!priLibrary.isArray(fieldList)) 
				fieldList = [fieldList]; 
			
			for (var i = 0; i < fieldList.length; i++) {
				fld = context.currentRecord.getField(fieldList[i]);
				if (fld)
					fld.isDisplay = showField;						
			}				

		}
		
        
		// ================================================================================================================================
	    
		function getQueryParameter(parmName) {
        	var queryString = window.location.href;
			
			var parms = queryString.split("&");
			for (var i = 0; i < parms.length; i++) {
				if (parms[i].toLowerCase().startsWith(parmName.toLowerCase()+"=")) {
					return parms[i].substring(parmName.length + 1);
				}
			}
		}


		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================
	    
		return {

		//	--- *** DEFINED IN THIS SCRIPT *** -------------------------------------------------------------------------------- 
			
		//	FORM-RELATED FUNCTIONS
			
			disableFormField:				disableFormField,
			showHideFormFields:				showHideFormFields,			
			getQueryParameter:				getQueryParameter,
			
		//	--- *** IMPORTED FROM COMMON LIBRARY *** -------------------------------------------------------------------------- 
			
		// 	CONSTANTS
			FORM_DELIMITERS:				priLibrary.FORM_DELIMITERS,
			ITEM_TYPE_MAP: 					priLibrary.ITEM_TYPE_MAP,
			RECORD_TYPE_INFO:				priLibrary.RECORD_TYPE_INFO,			
			
			// RECORD/ITEM/TRANSACTION FUNCTIONS			
			getRecordTypeInfo:				priLibrary.getRecordTypeInfo,
			transactionType:				priLibrary.transactionType,
			isTransaction:					priLibrary.isTransaction,
			getItemType:					priLibrary.getItemType,
			loadItem:						priLibrary.loadItem,
			isSelectFieldItemSelected:		priLibrary.isSelectFieldItemSelected,
			
			
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
			currentDateTimeStr:				priLibrary.currentDateTimeStr,

			
			// TIMER FUNCTIONS
			startTimer:						priLibrary.startTimer,
			elapsedTimeInNanoSeconds:		priLibrary.elapsedTimeInNanoSeconds,
			elapsedTimeInMilliSeconds:		priLibrary.elapsedTimeInMilliSeconds,
			elapsedTimeInSeconds:			priLibrary.elapsedTimeInSeconds,

			
			// MISC FUNCTIONS
			logDebugAll:					priLibrary.logDebugAll, 
			getAccountingPeriod: 			priLibrary.getAccountingPeriod,
			accountingPeriodIsOpen:			priLibrary.accountingPeriodIsOpen,
			accountingPeriodIsClosed:		priLibrary.accountingPeriodIsClosed
			
		}

	}	

);