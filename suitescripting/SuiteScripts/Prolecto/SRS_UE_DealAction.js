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

define(['N/record', 'N/search', 'N/runtime', 'N/url', 'N/error', 'N/ui/serverWidget' ,'N/redirect'
       ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	   ,'./Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ShowMessageInUI', '/.bundle/132118/PRI_ServerLibrary'
	   ],
				
	function(record, search, runtime, url, error, serverWidget ,redirect ,tools ,srsConstants, srsFunctions, priMessage, priLibrary) {

		var scriptName = "SRS_UE_DealAction.";
		
		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function beforeLoad(context) {
          

	    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    	
	    	var REC = context.newRecord; 
	    	log.debug(funcName ,"dept: " + REC.getValue("custrecord_da_department"));
	    	log.debug(funcName ,"form: " + REC.getValue("customform"));
	    	
			if (!REC.id && REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT){
				REC.setValue("custrecord_da_department", srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT); 
			} else {
				REC.setValue("custrecord_da_department", srsConstants.PROJECT_TASK_MGMT_DEPT.CLAIMS_60);
			}

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
	    	
	    	
	    	

	    	// we need to interrogate the customform field, but it is only available when a record is loaded in EDIT mode
			if (context.type == context.UserEventType.VIEW) 
				REC = record.load({type: REC.type, id: REC.id}); 

            var f = context.form.addField({id: "custpage_form_name", label: "Custom Form", type: serverWidget.FieldType.TEXT});
            if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT)
            	f.defaultValue = "Escrow Agent Action";
            else
            	f.defaultValue = "SRS Deal Action";
           	context.form.insertField({field: f, nextfield: "custrecord_deal2"});
           	priLibrary.disableFormFields("custpage_form_name", context.form); 


			if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT) {
				context.form.getField("custrecord_da_deal_escrow").isMandatory = true;
//				priLibrary.preventEdit(context, userIsAuthorizedToEdit(), "Only BUSINESS DEVELOPMENT users are authorized to edit this record."); 

				if (context.type == context.UserEventType.VIEW) {
					var documentURL = url.resolveRecord({
		                recordType:			"customrecord_document_management",
		                params:{
		                		"record.custrecord_doc_deal_action":	REC.id,
		                		"record.custrecord_escrow_customer":	REC.getValue("custrecord_deal2"),
		                		"record.custrecord_doc_deal_escrow":	REC.getValue("custrecord_da_deal_escrow")
		                		}
					});
		
					var scr = "window.location.href='" + documentURL + "'; console.log";
		
					context.form.addButton({
						id : "custpage_escrow_btn",
						label : "Add Document",
						functionName: scr
					});    				                    	    														
				} 
			}
	    	log.debug(funcName ,"dept: " + REC.getValue("custrecord_da_department"));

          
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
		
		function beforeSubmit(context) {
	    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    	var REC = context.newRecord; 
	    	
	    	var userHasEditAccess = tools.dealActionDealActionResolutionUserHasEditAccess(context ,runtime.getCurrentUser() ,runtime.envType);	    	
	    	if (!userHasEditAccess) { throw "SRS Custom Restriction: You are not authorized to {0} this record.".replace("{0}",context.type); } 

			if (context.type == context.UserEventType.XEDIT)
				throw "Intline Edit of Deal Action records is not permitted.";

			if (runtime.executionContext == runtime.ContextType.CSV_IMPORT)
				throw "CSV Importing of Deal Action records is not permitted.";

			
//			if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT) {
//				if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT)
//					if (!userIsAuthorizedToEdit())
//						throw "SRS Custom Restriction: You are not authorized to edit this record.";
//			}
	    				
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function afterSubmit(context) {

	    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
	    
	    	var REC = context.newRecord;
	    	var oldREC = context.oldRecord;

	    	var resolutionCreated = false;
	    	var importantDateCreated = false;
	    	log.debug(funcName ,"after submit");
			if (context.type == context.UserEventType.CREATE) {
				if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT) {
					try {
						if (!REC.getValue("custrecord_deal_action_resolution")) {
							var EAA = record.create({type: "customrecord_deal_action_resolution"}); 
							
							EAA.setValue("customform", srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT_RESOLUTION);
							EAA.setValue("custrecord_resolution_type", srsConstants.RESOLUTION_TYPE.PENDING);
							EAA.setValue("custrecord_dar_department", srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT);
							EAA.setValue("custrecord_dar_escrow", REC.getValue("custrecord_da_deal_escrow"));
							if (REC.getValue("custrecord_response_due_date"))
								EAA.setValue("custrecord_resolution_date", REC.getValue("custrecord_response_due_date")); 
							EAA.setValue("custrecord_resolution_deal", REC.getValue("custrecord_deal2"));
							EAA.setValue("custrecord_resolution_case",REC.getValue("custrecord_claim_case")); 
							
							EAA.setValue("custrecord_dar_deal_action", REC.id); 
							var id = EAA.save(); 
							
							record.submitFields({type: REC.type, id: REC.id, values: {custrecord_deal_action_resolution: id}}); 
							
							resolutionCreated = true; 
						}

						var EVENT = record.create({type: record.Type.CALENDAR_EVENT}); 
						
						EVENT.setValue("title", "Claim Response Deadline"); 
						EVENT.setValue("custevent_srs_date_managing_dept", srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT); 
						EVENT.setValue("company", REC.getValue("custrecord_deal2")); 
						EVENT.setValue("organizer", runtime.getCurrentUser().id); 
						EVENT.setValue("custevent_imp_date_assigned_to", runtime.getCurrentUser().id); 
						EVENT.setValue("status", "CONFIRMED"); 
					//	EVENT.setValue("custevent31", false); see ATP-899
						EVENT.setValue("startdate", REC.getValue("custrecord_response_due_date")); 
						
						EVENT.setValue( {fieldId:"custevent_deal_action", value:REC.id} ); 
						EVENT.setValue( {fieldId:"custevent_deal_escrow", value:REC.getValue("custrecord_da_deal_escrow")} );					

						var idEvent = EVENT.save();
						importantDateCreated = true;
						
						record.submitFields({type:REC.type ,id:REC.id ,values:{custrecord_da_important_dt_event:idEvent} } ); 

						if (resolutionCreated)
							priMessage.prepareMessage("Resolution and Important Date Created","Deal Action Resolution and Important Date records were automatically created.", priMessage.TYPE.CONFIRMATION);
						else
							priMessage.prepareMessage("Important Date Created","Important Date record was automatically created.", priMessage.TYPE.CONFIRMATION);					
						
					}
					catch(e) {
						log.error(funcName ,"Exception occurred while creating Deal Action Resoltion and Important Date record;   "
						          + "resolutionCreated=" + resolutionCreated + ",   importantDateCreated=" + importantDateCreated 
						          + ",    Exception:" + e.message );
					}

					
				}

			} 
			
			
			//ATP-640
	    	log.debug(funcName ,"********b4 srs deal action - context.type="+context.type );
			if ( context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) {
		    	log.debug(funcName ,"create/edit"+ ", cf="+REC.getValue("customform")+ ", SRS_DEAL_ACTION="+srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION );
				if ( REC.getValue("customform") == srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION ) {
		        	var deal_action_resolution = context.newRecord.getValue({fieldId:"custrecord_deal_action_resolution"});
			    	log.debug(funcName ,"aft custom form, deal_action_resolution="+deal_action_resolution );
		        	if (!deal_action_resolution){
		        		try {
		        	    	log.debug(funcName ,"try");
		        		    var daDeal    = context.newRecord.getValue({fieldId:"custrecord_deal2"});
		        		    var daCase    = context.newRecord.getValue({fieldId:"custrecord_claim_case"});
		        		    var daResDate = context.newRecord.getValue({fieldId:"custrecord_response_due_date"});
		        		    
		        			var darRecord = record.create({ type:'customrecord_deal_action_resolution' });
		        			
		        			darRecord.setValue({ fieldId:"customform"                 ,value:srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION_RESOLUTION });
		        			darRecord.setValue({ fieldId:"custrecord_resolution_type" ,value:srsConstants.RESOLUTION_TYPE.PENDING });
		        			darRecord.setValue({ fieldId:"custrecord_dar_department"  ,value:srsConstants.PROJECT_TASK_MGMT_DEPT.CLAIMS_60 });
		        			darRecord.setValue({ fieldId:"custrecord_resolution_date" ,value:daResDate });
		        			darRecord.setValue({ fieldId:"custrecord_resolution_case" ,value:daCase });
		        			darRecord.setValue({ fieldId:"custrecord_resolution_deal" ,value:daDeal });
		        			darRecord.setValue({ fieldId:"custrecord_dar_deal_action" ,value:context.newRecord.id });
		        			//darRecord.setValue({ fieldId:"custrecordresolutionpendingstatus" ,value:4 });
		        			
		        			var darId = darRecord.save();
		        			
		        	    	var objFieldsAndValues = { custrecord_deal_action_resolution:darId };        	    	
		        			record.submitFields({ type:'customrecord_deal_action' ,id:context.newRecord.id ,values:objFieldsAndValues });
		        			
							if ( runtime.executionContext == 'USERINTERFACE' ) {
								priMessage.prepareMessage("Related Record Created","Deal Action Resolution record has been created.", priMessage.TYPE.CONFIRMATION);					
							}
		        		} // try
		        		catch(e) { 
		        			log.error("Error creating Deal Action Resolution record",e.message); 
		        			if ( runtime.executionContext == 'USERINTERFACE' ) { 
								priMessage.prepareMessage("Related Record Create Failed","There was an error and the Deal Action Resolution record was not created.", priMessage.TYPE.ERROR);					
		        			}
		        		} // catch
		        	} // if (!deal_action_resolution)
				} // if ( REC.getValue("customform") == srsConstants.CUSTOM_FORMS.SRS_DEAL_ACTION )
			}
			//ATP-640 End
			
			//ATP-624
			if ( context.type == context.UserEventType.EDIT ) {
				if (REC.getValue("custrecord_da_deal_escrow") != oldREC.getValue("custrecord_da_deal_escrow")) {
					if (REC.getValue("custrecord_da_important_dt_event")) {
						try {
							record.submitFields({type:record.Type.CALENDAR_EVENT ,id:REC.getValue("custrecord_da_important_dt_event") ,values:{custevent_deal_escrow:REC.getValue("custrecord_da_deal_escrow")} } ); 
						} 
						catch(e) {
							log.error(funcName ,"Error updating Deal Escrow on Important Date record: " + e.message);
						}
					}
				}
			}
			//ATP-624 End
			
			
		} // afterSubmit

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function userIsAuthorizedToEdit() {
			return (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || srsFunctions.userIsAdmin());
		}

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		return {
			beforeLoad:		beforeLoad,
			beforeSubmit:	beforeSubmit,
			afterSubmit: 	afterSubmit
		}
});

