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
 * code related to the RELEASE APPROVAL PROCESS custom record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_AS_Engine'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, appSettings) {
	
			var scriptName = "SRS_UE_ReleaseApprovalProcess.";

			var DEPARTMENT_DATA_MANAGEMENT_RELEASE = 34;
			
			var DEPARTMENT_MERGER_ADMIN_CTR_COMPLIANCE = 7;
			
			var ROLE_SRS_OPERATIONS_ANALYST = 1032; 
			var ROLE_SRS_OPERATIONS_MANAGER = 1025; 
			
			var ROLE_IS_ADMIN = 3;
			var ROLE_IS_RESTLET_ADMIN = 1072;
			
			var RAP_STATUS_COMPLETED = 6; 

			const STATUS_IS_APPROVED = "3";
			const STATUS_IS_ESIGNED = "7";
			const STATUS_IS_COMPLETED = "6"; 

			const ACCOUNT_11000 = "189";

			const VENDOR_IS_SRS_CLIENT_FUNDS = "24677";

			//const PAY_FROM_ACCOUNT_001231 = "3023"; 
			const PAY_FROM_ACCOUNT_001263 = "17309"; 

					
					
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	// once we establish a relationship, don't allow user to change the key information

				var REC = context.newRecord;

    			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.VIEW) {

    				drawShareholderLetterButtons(context, REC); 
    				
    				drawExpirationLetterButtons(context, REC); 
    				
    				
//					ATO-216: show button under some circumstances, so user can create a Client Fund Release Tracking record
    				
    				// var approvedUsers = appSettings.readAppSetting(srsConstants.SRS_GENERAL_APP_NAME, "Client Fund Release Permission");
    				
    				// if (checkPermission(approvedUsers)) {
    				if (checkPermission({appName: srsConstants.SRS_GENERAL_APP_NAME, settingName: "Client Fund Release Permission"})) {
    					
    					if (REC.getValue("custrecord_release_journals").length > 0 && (REC.getValue("custrecord_escrow_payment_status") == STATUS_IS_APPROVED || REC.getValue("custrecord_escrow_payment_status") == STATUS_IS_ESIGNED || REC.getValue("custrecord_escrow_payment_status") == STATUS_IS_COMPLETED)) {
    						// custrecord_release_journals

            				var ss = search.create({
            					type:		record.Type.JOURNAL_ENTRY,
            					filters:	[
            					        	 	["internalid",search.Operator.ANYOF,REC.getValue("custrecord_release_journals")]
            					        	 	,"AND",["account",search.Operator.NONEOF,[ACCOUNT_11000]]
            					        	 	,"AND",["account.custrecord_gl_account_bank_name",search.Operator.ANYOF,[VENDOR_IS_SRS_CLIENT_FUNDS]]
            					        	 ]
            				}).run().getRange(0,1); 

            				if (ss.length > 0) {
            					var custFields = search.lookupFields({type: record.Type.CUSTOMER, id: REC.getValue("custrecord_escrow_payment_deal"), columns: []})
                				var recordURL = url.resolveRecord({
                                    recordType:			"customrecord_client_release_tracking",
                                    params:{
                                    		"record.custrecord_crf_trk_rap_link":		REC.id,
                                    		"record.custrecord_crf_trk_date":			new Date().format("mm/dd/yyyy"),
											"record.custrecord_crf_trk_pay_from_acc": 	PAY_FROM_ACCOUNT_001263,
                                    		"record.custrecord_crf_trk_deal":			REC.getValue("custrecord_escrow_payment_deal"),
                                    		}
                				});

                                var scr = "window.location.href='" + recordURL + "'; console.log";

//            					scr = "alert('hello'); console.log"
            					
                				context.form.addButton({
                					id : "custpage_fund_rel_trk",
                					label : "Create Client Fund Release Tracking",
                					functionName: scr
                				});    				                    	

            				}

    					}
    					
    				} // if the right role or department

    				
    				
    				
    			}

    			if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type == context.UserEventType.CREATE|| context.type == context.UserEventType.EDIT)) {
    				if (REC.getValue("custrecord_rap_shr_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.SUBLIST_GENERATION_IN_PROGRESS || REC.getValue("custrecord_rap_shr_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.SENDING_SHAREHOLDER_LETTERS)
    					srsFunctions.disableFormFields("custrecord_rap_shr_letter_proc_status", context.form);

    				if (runtime.getCurrentUser().department != DEPARTMENT_MERGER_ADMIN_CTR_COMPLIANCE && runtime.getCurrentUser().role != ROLE_IS_ADMIN && runtime.getCurrentUser().role != ROLE_IS_RESTLET_ADMIN)
    					srsFunctions.disableFormFields("custrecord_custom_shtext_appr", context.form);

    			}

				

			}


    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
			
			function drawShareholderLetterButtons(context, REC) {
				var seeButtons = false;
				
				if ((runtime.getCurrentUser().department == DEPARTMENT_DATA_MANAGEMENT_RELEASE) &&
						(runtime.getCurrentUser().role == ROLE_SRS_OPERATIONS_ANALYST || runtime.getCurrentUser().role == ROLE_SRS_OPERATIONS_MANAGER))
					seeButtons = true;
				
				if (runtime.getCurrentUser().role == 3 || runtime.getCurrentUser().role == 1050 || runtime.getCurrentUser().role == 1072)
					seeButtons = true;
				
				if (REC.getValue("custrecord_escrow_payment_status") != RAP_STATUS_COMPLETED)
					seeButtons = false; 
				
				if (!REC.getValue("custrecord_custom_shtext_appr"))
					seeButtons = false; 
				
				if (seeButtons) {
					
    				if (REC.getValue("custrecord_rap_shr_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.SHAREHOLDER_LETTERS_SENT) {
                        var utilURL = url.resolveScript({
                               scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                               deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                               returnExternalUrl: 	false,
                               params:{"action": "resetShareholderLetters", "rapId": REC.id}});

                        
                        var scr = "if (confirm(\"A batch of Shareholder Letters have already been sent.  Click 'Ok' if you are ready to generate a new list of letters.\")) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_reset_sl_recs",
                            label : "Reset Shareholder Letter Process",
                            functionName: scr
                        });    				                    	
    				}
					
					
    				if (!REC.getValue("custrecord_rap_shr_letter_proc_status") || REC.getValue("custrecord_rap_shr_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.READY_TO_GEN_SUBLIST) {
                        var utilURL = url.resolveScript({
                               scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                               deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                               returnExternalUrl: 	false,
                               params:{"action": "generateShareholderLetterRecords", "rapId": REC.id}});

                        
                        var scr = "if (confirm('Are you sure you want to Generate Shareholder Letter records?')) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_gen_sl_recs",
                            label : "Shareholder Letters",
                            functionName: scr
                        });    				                    	
    				}

    				
    				if (REC.getValue("custrecord_rap_shr_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.SUBLIST_GENERATED) {
                        var utilURL = url.resolveScript({
                               scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                               deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                               returnExternalUrl: 	false,
                               params:{"action": "sendShareholderLetters", "rapId": REC.id}});

                        
                        var scr = "if (confirm('Are you sure you want to Send Shareholder Letters?')) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_send_letters",
                            label : "Send Shareholder Letters",
                            functionName: scr
                        });    		
                        

                        
                        
                        var utilURL = url.resolveScript({
                            scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                            deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                            returnExternalUrl: 	false,
                            params:{"action": "cancelShareholderLetters", "rapId": REC.id}});

                        var scr = "if (confirm('Are you sure you want to CANCEL the process of Sending Shareholder Letters?')) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_xcl_sh_letters",
                            label : "Cancel Shareholder Letters",
                            functionName: scr
                        });    		
                        
    				}

    				
    			}

			}
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
			
			function drawExpirationLetterButtons(context, REC) {
				
				const SRS_OFFICE_SUPPORT_PARALEGAL = 1041; 
				const MERGER_ADMIN_CTR_COMPLIANCE = 7; 
				
				var seeButtons = false;
				
				if ((runtime.getCurrentUser().department == MERGER_ADMIN_CTR_COMPLIANCE) && (runtime.getCurrentUser().role == SRS_OFFICE_SUPPORT_PARALEGAL))
					seeButtons = true;
				
				if ((runtime.getCurrentUser().department == DEPARTMENT_DATA_MANAGEMENT_RELEASE) &&
						(runtime.getCurrentUser().role == ROLE_SRS_OPERATIONS_ANALYST || runtime.getCurrentUser().role == ROLE_SRS_OPERATIONS_MANAGER))
					seeButtons = true;
				
				if (runtime.getCurrentUser().role == 3 || runtime.getCurrentUser().role == 1050 || runtime.getCurrentUser().role == 1072)
					seeButtons = true;
				
				if (REC.getValue("custrecord_escrow_payment_status") == RAP_STATUS_COMPLETED)
					seeButtons = false; 
				
				if (!REC.getValue("custrecord_exp_letter_text_approved"))
					seeButtons = false; 
				
				if (REC.getValue("custrecord_rap_gl_accounts").length == 0)
					seeButtons = false; 
				
				if (seeButtons) {
					
    				if (REC.getValue("custrecord_exp_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.SHAREHOLDER_LETTERS_SENT) {
                        var utilURL = url.resolveScript({
                               scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                               deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                               returnExternalUrl: 	false,
                               params:{"action": "resetExpirationLetters", "rapId": REC.id}});

                        
                        var scr = "if (confirm(\"A batch of Expiration Letters have already been sent.  Click 'Ok' if you are ready to generate a new list of letters.\")) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_reset_exp_ltr_recs",
                            label : "Reset Expiration Letter Process",
                            functionName: scr
                        });    				                    	
    				}
					
					
    				if (!REC.getValue("custrecord_exp_letter_proc_status") || REC.getValue("custrecord_exp_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.READY_TO_GEN_SUBLIST) {
                        var utilURL = url.resolveScript({
                               scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                               deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                               returnExternalUrl: 	false,
                               params:{"action": "generateExpirationLetterRecords", "rapId": REC.id}});

                        
                        var scr = "if (confirm('Are you sure you want to Generate Expiration Letter records?')) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_gen_expltr_recs",
                            label : "Expiration Letters",
                            functionName: scr
                        });    				                    	
    				}

    				
    				if (REC.getValue("custrecord_exp_letter_proc_status") == srsConstants.SHAREHOLDER_LETTER_STATUS.SUBLIST_GENERATED) {
                        var utilURL = url.resolveScript({
                               scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                               deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                               returnExternalUrl: 	false,
                               params:{"action": "sendExpirationLetters", "rapId": REC.id}});

                        
                        var scr = "if (confirm('Are you sure you want to Send Expiration Letters?')) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_send_exp_letters",
                            label : "Send Expiration Letters",
                            functionName: scr
                        });    		
                        

                        
                        
                        var utilURL = url.resolveScript({
                            scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                            deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                            returnExternalUrl: 	false,
                            params:{"action": "cancelExpirationLetters", "rapId": REC.id}});

                        var scr = "if (confirm('Are you sure you want to CANCEL the process of Sending Expiration Letters?')) window.location.href='" + utilURL + "'; console.log";
                        
                        context.form.addButton({
                            id : "custpage_xcl_exp_letters",
                            label : "Cancel Expiration Letters",
                            functionName: scr
                        });    		
                        
    				}

    				
    			}

			}
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


			// checks the current user against a "standard" permission object to determine whether they match
			//		the standard object is either a single object, or an array of objects
			//		each element can contain any combination of userId, userRole, and userDept
			
			function checkPermission(permissionObj) {
				if (!permissionObj)
					return false; 
				
				if (typeof permissionObj == "string") {
					try {
						permissionObj = JSON.parse(permissionObj);						
					} catch (e) {						
						return false;
					} 					
				} 
				
				
				// instead of passing in a permission object, user can also pass in an app setting reference; in that case, this function will read the app setting and do the rest of the work
				if (permissionObj.hasOwnProperty("appName") && permissionObj.hasOwnProperty("settingName")) {
					// they didn't pass in a permission object; they passed in a reference to an App Setting
					var s = appSettings.readAppSetting(permissionObj.appName, permissionObj.settingName); 
					if (s)
						permissionObj = JSON.parse(s); 
				}
				
					
				if (!(permissionObj instanceof Array))
					permissionObj = [permissionObj];
				
				// if any row of the permission list passes, then user is permitted
				for (var i = 0; i < permissionObj.length; i++) {
					var p = permissionObj[i];
					
					var ok = true; 
					
					if (p.hasOwnProperty("userId"))
						if (p.userId != runtime.getCurrentUser().id)
							ok = false;
					
					if (p.hasOwnProperty("userRole"))
						if (p.userRole != runtime.getCurrentUser().role)
							ok = false;
							
					if (p.hasOwnProperty("userDept"))
						if (p.userDept != runtime.getCurrentUser().department)
							ok = false;
					
					if (ok)
						return true; 					
				}
						
				return false; 
			}


    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


			function beforeSubmit(context) {

		    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
				var REC = context.newRecord;

				var approvalChecked = false; 
				
   				if (REC.getValue("custrecord_custom_shtext_appr")) {
					if (context.type == context.UserEventType.CREATE)
						approvalChecked = true; 
					if (context.type == context.UserEventType.EDIT && !context.oldRecord.getValue("custrecord_custom_shtext_appr"))
						approvalChecked = true; 
					if (context.type == context.UserEventType.XEDIT && !context.oldRecord.getValue("custrecord_custom_shtext_appr"))
						approvalChecked = true; 
   					
					if (approvalChecked) {
						REC.setValue("custrecord_shtext_approved_by",runtime.getCurrentUser().id); 
						REC.setValue("custrecord_sh_lettertext_approved_time",new Date()); 
					}    				
    			}
			}
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		return {
			beforeLoad: 	beforeLoad,
			beforeSubmit:	beforeSubmit
		}
});

