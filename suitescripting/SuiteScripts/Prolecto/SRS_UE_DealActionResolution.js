//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the Deal Action 
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/ui/message', 'N/redirect' ,'N/ui/serverWidget'
       ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	   ,'./Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary'
	   ,'/.bundle/132118/PRI_ShowMessageInUI'
	   ],
				
	function(record, search, runtime, error, message, redirect, serverWidget ,tools ,srsConstants, srsFunctions, priLibrary ,priMessage) {

		var scriptName = "SRS_UE_DealAction.";
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeLoad(context) {		

	    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		
	    	var REC = context.newRecord; 
			
			if (!REC.id && REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT_RESOLUTION)
				REC.setValue("custrecord_dar_department", srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT); 						
	    	
	    	var userHasEditAccess = tools.dealActionDealActionResolutionUserHasEditAccess(context ,runtime.getCurrentUser() ,runtime.envType);	    	
	    	if (!userHasEditAccess) {
		    	if (context.type == context.UserEventType.VIEW && runtime.executionContext == 'USERINTERFACE' ) {
	    			var btn = context.form.getButton("edit");
					btn.isDisabled = true;
					btn.isHidden = true;  //Hide the edit button                 	  
		    	}		    	
		    	else {
			    	if ( runtime.executionContext == 'USERINTERFACE' && context.type == context.UserEventType.EDIT ) { 
						priMessage.prepareMessage("SRS Custom Restriction","You are not authorized to {0} this record.".replace("{0}",context.type), priMessage.TYPE.ERROR);
                    	redirect.toRecord({ type:context.newRecord.type ,id:context.newRecord.id }); 
			    	}
			    	else { throw "SRS Custom Restriction: You are not authorized to {0} this record.".replace("{0}",context.type); }
		    	}	    		
	    	} // if (!userHasAccess)		    	

			if (context.type == context.UserEventType.VIEW) 
				REC = record.load({type: REC.type, id: REC.id}); 

//			if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT_RESOLUTION) 
//					priLibrary.preventEdit(context, userIsAuthorizedToEdit(), "Only BUSINESS DEVELOPMENT users are authorized to edit this record."); 

			
            var f = context.form.addField({id: "custpage_form_name", label: "Custom Form", type: serverWidget.FieldType.TEXT});
            if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT_RESOLUTION)
            	f.defaultValue = "Escrow Agent Action Resolution";
            else
            	f.defaultValue = "SRS Deal Action Resolution";
           	context.form.insertField({field: f, nextfield: "custrecord_resolution_deal"});
           	priLibrary.disableFormFields("custpage_form_name", context.form); 
			
			
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeSubmit(context) {
	    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    	
	    	var userHasEditAccess = tools.dealActionDealActionResolutionUserHasEditAccess(context ,runtime.getCurrentUser() ,runtime.envType);	    	
	    	if (!userHasEditAccess) { throw "SRS Custom Restriction: You are not authorized to {0} this record.".replace("{0}",context.type); } 

//			if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT)
//				if (!userIsAuthorizedToEdit())
//					throw "SRS Custom Restriction: You are not authorized to edit this record."; 
			
			var newREC = context.newRecord;
			var oldREC = context.oldRecord;
			
			// ATP-633 / ATP-749
			if ( context.type == context.UserEventType.EDIT && runtime.executionContext != 'USERINTERFACE'  ) {
				if ( newREC.getValue("custrecord_resolution_date").toString() != oldREC.getValue("custrecord_resolution_date").toString() ) {
					newREC.setValue({ fieldId:"custrecord_dar_resolution_date_changed" ,value:true })
				}
				if ( newREC.getValue("customform") == srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION_RESOLUTION ) {
					if (!newREC.getValue("custrecord_dar_resolution_date_changed")) {
						if (   newREC.getValue("custrecord_resolution_amount") != oldREC.getValue("custrecord_resolution_amount") 
							|| newREC.getValue("custrecord_resolution_type")   != oldREC.getValue("custrecord_resolution_type")    ) {
								newREC.setValue({ fieldId:"custrecord_resolution_date" ,value: new Date() });
								newREC.setValue({ fieldId:"custrecord_dar_resolution_date_changed" ,value:true })
							}
					}
				}
			}
			else 
			if ( context.type == context.UserEventType.XEDIT ) { 
				var thisRecord = record.load({type:newREC.type ,id:newREC.id});
				fieldList = context.newRecord.getFields();
				if (fieldList.indexOf("custrecord_resolution_date") >= 0 ) {
					if ( thisRecord.getValue("custrecord_resolution_date").toString() != newREC.getValue("custrecord_resolution_date").toString() ) {
						newREC.setValue({ fieldId:"custrecord_dar_resolution_date_changed" ,value:true })
					}
				}
				if ( thisRecord.getValue("customform") == srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION_RESOLUTION ) {
					var updateResolutionDate = false;
					
					if (fieldList.indexOf("custrecord_resolution_amount") >= 0) { 
		        		if (newREC.getValue("custrecord_resolution_amount") != oldREC.getValue("custrecord_resolution_amount") ) { updateResolutionDate = true; }
					}
					if (fieldList.indexOf("custrecord_resolution_type") >= 0) { 
		        		if (newREC.getValue("custrecord_resolution_type") != oldREC.getValue("custrecord_resolution_type") ) { updateResolutionDate = true; }
					}	
					if ( updateResolutionDate ) {
						if (!newREC.getValue("custrecord_dar_resolution_date_changed")) {
							newREC.setValue({ fieldId:"custrecord_resolution_date" ,value: new Date() });
							newREC.setValue({ fieldId:"custrecord_dar_resolution_date_changed" ,value:true })
						}
					}
				}
			}
			// End ATP-633 / ATP-749
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

//		function userIsAuthorizedToEdit() {
//			return (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || srsFunctions.userIsAdmin());
//		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		return {
			beforeLoad:		beforeLoad,
			beforeSubmit:	beforeSubmit,
		}
});

