//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(["N/record", "N/search", "N/runtime", "N/ui/serverWidget"
	,"/.bundle/132118/PRI_AS_Engine"
	, "/.bundle/132118/PRI_ServerLibrary"
	 ,"/SuiteScripts/Pristine/libraries/toolsLibraryClient.js"
	 ,"/SuiteScripts/Prolecto/Shared/SRS_Constants"
	],

	function(record, search, runtime, ui
			,appSettings
			,priLibrary
			,toolsClient
			,srsConstants
	) {

		"use strict";

		var scriptName = "SRS_UE_Account.";

		//identifies if user is allowed to edit audience / override audience 
		function userIsAuthorizedToEditAudience() 
		{	
			return toolsClient.checkPermission({appName: srsConstants.SRS_GENERAL_APP_NAME, settingName: "Update Account Audience Permission"}); 
		}
		//function used to render friendlier error message 
		function getAccountNames(parentAccounts)
		{
			var accountNames = [];
				
			var accountSearchObj = search.create({
				   type: "account",
				   filters:
				   [
				      ["internalid","anyof",parentAccounts]
				   ],
				   columns:
				   [
				      search.createColumn({
				         name: "name",
				         sort: search.Sort.ASC,
				         label: "Name"
				      })
				   ]
				});
				var searchResultCount = accountSearchObj.runPaged().count;
				//console.log("accountSearchObj result count" + searchResultCount);
				accountSearchObj.run().each(function(result){
				   // .run().each has a limit of 4,000 results
					accountNames.push(result.getValue("name"));
				   return true;
				});
			return accountNames;
		}
		
		
		function disableField(context, id)
		{
			if (id)
			{
				var field = context.form.getField({
					id: id
				});
				field.updateDisplayType({
					displayType: ui.FieldDisplayType.DISABLED
				});
			}
		}
		
		function enableField(context, id)
		{
			if (id)
			{
				var field = context.form.getField({
					id: id
				});
				field.updateDisplayType({
					displayType: ui.FieldDisplayType.NORMAL
				});
			}
		}
		
		function beforeLoad(context) 
		{

	    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.id + " via " + JSON.stringify(runtime.executionContext);
	    	//log.debug("testing");
	    	var REC = context.newRecord;
	    	var audience_field = null;
	    	if (runtime.executionContext == "USERINTERFACE")
	    	{
    			disableField(context, "custrecord_account_audience");
    			disableField(context, "custrecord_account_override_audience");
		    }
	    	if (context.type === context.UserEventType.EDIT) 
	    	{
	    		
//	    		If account is NOT a sub-account of 200000 or 300000, then set (on beforeload)
//	    		Override Audience to unchecked, field cannot be edited
//	    		Audience = blank, field cannot be edited
	    		
	    		if (userIsAuthorizedToEditAudience())
	    		{
	    			var parent = REC.getValue({
			            fieldId: "parent"
			        });
	    			var parentAccounts = JSON.parse(appSettings.readAppSetting("General Settings", "Escrow Type Audience Parent Accounts"));
				 	var parentAccountsArray = parentAccounts["accounts_"+runtime.accountId];
//				 	{
//				 		"accounts_772390_SB3": ["12999","19168"],
//				 		"accounts_772390_SB1": ["12999","17235"],
//				 		"accounts_772390": ["12999","24975"],
//				 		"useMapReduce":false
//				 	}
				 	if (runtime.executionContext == "USERINTERFACE")
			    	{
						if (toolsClient.isSubAccountOf(parent, parentAccountsArray)) 
	    		    	{
							var accountOverride = REC.getValue({
					            fieldId: "custrecord_account_override_audience"
					        });
							
							enableField(context, "custrecord_account_override_audience");
							
							if (accountOverride)
							{
								//Enable only if Account Override is checked
								enableField(context, "custrecord_account_audience");
							}
							
							
				    	}
					}
	    		}
			}
		} // beforeLoad
		
		function getXEditFieldValues(context, REC)
		{
			var xeditFields = {};
			log.audit("context.newRecord.getFields " , context.newRecord.getFields());
			log.audit("custrecord_escrow_account_type changed ", priLibrary.fieldChanged(context, "custrecord_escrow_account_type"))
			
			if ((priLibrary.fieldChanged(context, "parent")
            	|| priLibrary.fieldChanged(context, "custrecord_account_override_audience")		
            	|| priLibrary.fieldChanged(context, "custrecord_escrow_account_type")
            	|| toolsClient.multiSelecthasChanged(context, "custrecord_account_audience"))
            	&& (context.type == context.UserEventType.XEDIT)
              )
			{
        		var dbREC = null; 

        		if (context.newRecord.getFields().indexOf("parent")<0)
        		{
        			xeditFields.parent = context.oldRecord.getValue({
			            fieldId: "parent"
			        });
        		}
        		else 
        		{
        			xeditFields.parent = REC.getValue({
			            fieldId: "parent"
			        });
        		}
        		
        		if (context.newRecord.getFields().indexOf("custrecord_account_override_audience")<0)
        		{
        			xeditFields.custrecord_account_override_audience = context.oldRecord.getValue({
			            fieldId: "custrecord_account_override_audience"
			        });
        		}
        		else 
        		{
        			xeditFields.custrecord_account_override_audience = REC.getValue({
			            fieldId: "custrecord_account_override_audience"
			        });
        		}
        		if (context.newRecord.getFields().indexOf("custrecord_escrow_account_type")<0)
        		{
        			xeditFields.custrecord_escrow_account_type = context.oldRecord.getValue({
			            fieldId: "custrecord_escrow_account_type"
			        });
        		}
        		else 
        		{
        			xeditFields.custrecord_escrow_account_type = REC.getValue({
			            fieldId: "custrecord_escrow_account_type"
			        });
        		}
        		if (context.newRecord.getFields().indexOf("custrecord_account_audience")<0)
        		{
        			xeditFields.custrecord_account_audience = context.oldRecord.getValue({
			            fieldId: "custrecord_account_audience"
			        });
        		}
        		else 
        		{
        			xeditFields.custrecord_account_audience = REC.getValue({
			            fieldId: "custrecord_account_audience"
			        });
        		}
            }
			log.debug("xeditFields ", JSON.stringify(xeditFields));
			return xeditFields;
		}
		 function beforeSubmit(context) 
		 {
			 log.debug("test");
			 var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " +
	         context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
			 var parentAccounts = null;
			 var parentAccountsArray = [];
			 if (context.type == context.UserEventType.EDIT 
		 			|| context.type == context.UserEventType.CREATE 
		 			|| context.type == context.UserEventType.XEDIT) 
			 {    
	            var REC = context.newRecord;
	            var audience  = REC.getValue("custrecord_account_audience");
				var audienceOverride = REC.getValue("custrecord_account_override_audience");
				 
				 
	            log.debug("before Submit ", funcName);
	            
	            if (!userIsAuthorizedToEditAudience())
	    		{
	            	
            		if (priLibrary.fieldChanged(context, "custrecord_account_override_audience"))
            		{
            			throw "You are not authorized to set Override Audience"; 	
            		}
            		if (toolsClient.multiSelecthasChanged(context, "custrecord_account_audience")) 
            		{
            			throw "You are not authorized to set Audience"; 	
            		}
	            }
	            else 
	            {
	            	//only execute this part of code if you are one of the accounts 
	            	//that is allowed to update audience - meaning - do not allow "healing" of data for non 
	            	//allowed users
	            	var parent = REC.getValue({
			            fieldId: "parent"
			        });
		            
	            	
	            	parentAccounts = JSON.parse(appSettings.readAppSetting("General Settings", "Escrow Type Audience Parent Accounts"));
				 	parentAccountsArray = parentAccounts["accounts_"+runtime.accountId];
	//			 	{
	//			 		"accounts_772390_SB3": ["12999","19168"],
	//			 		"accounts_772390_SB1": ["12999","17235"],
	//			 		"accounts_772390": ["12999","24975"],
	//			 		"useMapReduce":false
	//			 	}
				 	
				 	var xeditFields = {};
	            	if (context.type == context.UserEventType.XEDIT)
	            	{
	            		xeditFields = getXEditFieldValues(context, REC);
	            		
	            		escrow_type=xeditFields.custrecord_escrow_account_type;
	            		audienceOverride=xeditFields.custrecord_account_override_audience;
	            		parent=xeditFields.parent;
	            	}
					
				 	if (priLibrary.fieldChanged(context, "parent") ||
				 		priLibrary.fieldChanged(context, "custrecord_account_override_audience") ||
				 		priLibrary.fieldChanged(context, "custrecord_escrow_account_type")||
				 		toolsClient.multiSelecthasChanged(context, "custrecord_account_audience"))
            		{
				 		log.audit("fileds changed ")
				 		log.debug("toolsClient.isSubAccountOf(parent, parentAccountsArray) " , toolsClient.isSubAccountOf(parent, parentAccountsArray));
			            
				 		//throw "parent " + parent + " parent array " + parentAccountsArray.toString();
				 		
				 		if (toolsClient.isSubAccountOf(parent, parentAccountsArray)) 
			            {
			            	var escrow_type = REC.getValue("custrecord_escrow_account_type");
			            	
			            	
			            	log.audit("account IS child of 200k 300k parent");
		//	            	If account is modified so that it changes parent from something that is neither 200000 nor 300000 to something that is 200000 or 300000 then:
		//	            	If there is an Escrow Type and the Override Audience is unchecked then populate the Audience from the Escrow Type Audience
			            	
			            	if (!audienceOverride)
			            	{	
			            		//if audience override was not selected, always clear values 
			            		REC.setValue({ fieldId:"custrecord_account_audience",value:null}); //clear all values
			            	}
			            	log.debug("escrow_type " + escrow_type)
			            	if (escrow_type && !audienceOverride)
		    				{
			            		//if escrow changed, and user did not override, update audience 
		    					var audienceArr = search.lookupFields({type:"customrecord_escrow_type" ,id:escrow_type
		    			            ,columns:["custrecord_et_audience"]});
		    					
		    					if (audienceArr && audienceArr.custrecord_et_audience)
		    					{
		    						var i = 0;
		    						var new_audience = [];
		    						for (i = 0; i<audienceArr.custrecord_et_audience.length; i+=1)
		    						{
		    							new_audience.push(audienceArr.custrecord_et_audience[i].value); 
		    						}
		    						REC.setValue({ fieldId:"custrecord_account_audience",value:new_audience});
		    					}
		    				}
			            	if (context.type == context.UserEventType.CREATE)
			            	{
		            			//if this is a create event, and override audience has not been set, 
			            		//initialize it to Buyer
			            		audience = REC.getValue({ fieldId:"custrecord_account_audience"});
			            		if (audience && audience.length ===0)
			            		{
			            			REC.setValue({ fieldId:"custrecord_account_audience",value:srsConstants["Account Audience"]["Buyer"]});
			            		}
			            	}
			            	
			            }
			            else 
			            {
			            	log.audit("beforeSubmit ", "validation when account is NOT subaccount ");
		//			    	If account is modified so that it changes parent from 200000 or 300000, to something that is neither 200000 nor 300000 then:
		//			    	if Audience Override checked or Audience is selected then display error and prevent save.
			            	parentAccounts = JSON.parse(appSettings.readAppSetting("General Settings", "Escrow Type Audience Parent Accounts"));
						 	parentAccountsArray = parentAccounts["accounts_"+runtime.accountId];
						 	
			            	audience  = REC.getValue("custrecord_account_audience");
			            	if (audience.length>0) 
			                {
			                	throw " <b>Audience</b> must not be selected when account '" + REC.getValue("acctname") +  "' is not sub-account of " + getAccountNames(parentAccountsArray);
			                }
			                
			                if (audienceOverride) 
			                {
			                	throw " <b>Audience Override</b> must not be selected when account '" + REC.getValue("acctname") +  "' is not sub-account " + getAccountNames(parentAccountsArray);
			                }
			            }
            		}
	            }
	        }
		 }
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

    		return {
    			beforeLoad: beforeLoad,
    			beforeSubmit: beforeSubmit
    		}
});

