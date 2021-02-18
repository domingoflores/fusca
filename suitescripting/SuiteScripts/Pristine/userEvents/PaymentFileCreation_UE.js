/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/email', 'N/error', 'N/search', 'N/file', 'N/record', 'N/runtime', 'N/task' ,'N/ui/serverWidget' ,'N/url'
       ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
       ,'/.bundle/132118/PRI_AS_Engine'
	   ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	   ,'SuiteScripts/Pristine/libraries/PaymentFileCreation_Library.js'
	],

    function(email, error, search, file, record, runtime, task ,ui ,url 
    		,srsConstants ,appSettings ,tools, pftLibrary 
    		) {

        var scriptFileName = "PaymentFileCreation_UE.js";
        var scriptFullName = scriptFileName;

        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeLoad(context) {
                	
        	var scriptFunctionName = "beforeLoad";
        	scriptFullName = scriptFileName + "--->" + scriptFunctionName;
        	
			var rcd = context.newRecord;
			var custom_account_field = null;
			var custom_currency_field = null;
			var form = context.form;

			var nativeFinalApproverField = form.getField({
				id: 'custrecord_pay_file_final_approver'
			});
			
			var nativeCurrencyField = form.getField({
				id: 'custrecord_pay_file_currency'
			});
			
			var nativeGLAccountField = form.getField({
				id: 'custrecord_pay_file_account'
			});
			
			
			
			
			if ( runtime.executionContext == 'USERINTERFACE' && context.type == context.UserEventType.EDIT ) {
				var fileReference     = rcd.getValue("custrecord_pay_file_linktofile");
				var creFileReference  = rcd.getValue("custrecord_pay_file_cre_generated_file");
				if (fileReference || creFileReference) {
					fileHasBeenGeneratedProtectFields(context);
				}
			}
			
			if (context.type == context.UserEventType.VIEW)
			{
				var deliveryStatus = context.newRecord.getValue("custrecord_pay_file_deliv_status");
				switch (parseInt(deliveryStatus,10)) 
				{
					case parseInt(srsConstants["Payment File Delivery Status"]["File Not Yet Created"],10):
					case parseInt(srsConstants["Payment File Delivery Status"]["Waiting for Approval"],10):
						context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/PaymentFileCreation_CL_custom.js';
						break;
				}
			}

			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY) {
				nativeFinalApproverField.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});
				log.debug('create edit and copy: native field object', JSON.stringify(nativeFinalApproverField));

				if ( runtime.executionContext == 'USERINTERFACE' ) 
				{ 
					nativeCurrencyField.updateDisplayType({
						displayType: ui.FieldDisplayType.HIDDEN
					});
					
					nativeGLAccountField.updateDisplayType({
						displayType: ui.FieldDisplayType.HIDDEN
					});
				}
			}

			if (context.type == context.UserEventType.EDIT) {

				var final_approver_temp = form.addField({
					id: 'custpage_pay_file_final_approver',
					label: 'FINAL APPROVER',
					type: 'select'
				});
				final_approver_temp.isMandatory = true;

				form.insertField({
					field: final_approver_temp,
					nextfield: 'custrecord_pay_file_final_approver'
				});

				var PFT_ID = rcd.getValue({
					fieldId: "custrecord_pay_file_type"
				});

				log.debug("PFT ID? ", PFT_ID);

				if (PFT_ID) {
					var isFinraReq = pftLibrary.isFinraReq(PFT_ID);
				}

				var finalApproverNativeField = rcd.getValue({
					fieldId: "custrecord_pay_file_final_approver"
				});

				log.debug("final approver on saved on native field: ", finalApproverNativeField);

				log.debug("does this bank require finra req cb? ", isFinraReq);
				if (isFinraReq == true) {
					var finraApprovers = pftLibrary.finraApproverList();
				}
				log.debug("finraApprovers list from search in library: ", JSON.stringify(finraApprovers));

				if (finraApprovers) {
					for (var i = 0, len = finraApprovers.length; i < len; i++) {
						isSelected = false;
						if (finalApproverNativeField == finraApprovers[i].internalid) { 
							isSelected = true;
						}
						final_approver_temp.addSelectOption({
							text: finraApprovers[i].name,
							value: finraApprovers[i].internalid,
							isSelected: isSelected
						});
					}
				}

				if (isFinraReq != true) {
					var finalApprovers = pftLibrary.finalApproverList();
				}
				log.debug("finalApprovers list from search in library: ", JSON.stringify(finalApprovers));

				if (finalApprovers) {
					for (var i = 0, len = finalApprovers.length; i < len; i++) {
						isSelected = false;
						if (finalApproverNativeField == finalApprovers[i].internalid) {
							isSelected = true;
						}
						final_approver_temp.addSelectOption({
							text: finalApprovers[i].name,
							value: finalApprovers[i].internalid,
							isSelected: isSelected
						});
					}
				}
			}

			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY) {
				
				var final_approver_temp = form.addField({
					id: 'custpage_pay_file_final_approver',
					label: 'FINAL APPROVER',
					type: 'select'
				});
				final_approver_temp.isMandatory = true;

				form.insertField({
					field: final_approver_temp,
					nextfield: 'custrecord_pay_file_final_approver'
				});

			}
        		
        	if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT
        			|| context.type == context.UserEventType.VIEW		
        	) 
			{
    			if ( runtime.executionContext == 'USERINTERFACE' ) { 
    	        	var field_pay_file_status = context.form.getField({ id:'custrecord_pay_file_status' });
    	        	field_pay_file_status.updateDisplayType({ displayType:ui.FieldDisplayType.INLINE });
    			}
			}

        	if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT
        			|| context.type == context.UserEventType.COPY
        	) 
			{
	        	
				//********************** setup gl account field start ****************************
	        	var savedGLAccountValue = rcd.getValue("custrecord_pay_file_account");
	        	var fieldmetadata = {
	                    id: 	"custpage_glaccount",
	                    type: 	ui.FieldType.SELECT,
	                    label: 	"GL Account"
	                };
	        	custom_account_field = context.form.addField(fieldmetadata);
	    		custom_account_field.setHelpText({ help:"GL Account for this payment type." });
	    		context.form.insertField({ field:custom_account_field ,nextfield:'custrecord_pay_file_payments_date' });
	    		if (savedGLAccountValue)
	    		{
	    			custom_account_field.defaultValue = savedGLAccountValue;
	    		}
	    		//********************** setup gl account field end ****************************
	    		
	    		//********************** setup currency field start ****************************
	    		var savedCurrencyValue = rcd.getValue("custrecord_pay_file_currency");
	        	fieldmetadata = {
	                    id: 	"custpage_currency",
	                    type: 	ui.FieldType.SELECT,
	                    label: 	"Settlement Currency"
	                };
	        	custom_currency_field = context.form.addField(fieldmetadata);
	        	custom_currency_field.setHelpText({ help:"Settlement Currencies for this payment type." });
	    		context.form.insertField({ field:custom_currency_field ,nextfield:'custrecord_pay_file_payments_date' });
	    		if (savedCurrencyValue)
	    		{
	    			custom_currency_field.defaultValue = savedCurrencyValue;
	    		}
	    		//********************** setup currency field end ****************************
	    		
	    		
        	}
    		if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) 
        	{
        		
        		var objPermissionList = [{"appName":"PaymentsProcessing" ,"settingName":"accessPermission"} ];
        		var hasAccess = tools.checkPermission(objPermissionList);
        		
        		if (!hasAccess) { 	throw 'PERMISSION_DENIED: You do not have permissions to access the Payment File Creation record. Please contact your NetSuite administration if you believe this is in error.'; }		

        		var recordStatus = context.newRecord.getValue("custrecord_pay_file_status");
            	if (recordStatus <= "") {
                	var userObj = runtime.getCurrentUser();
                	var userHasAccess = false;
                	if (userObj.role == srsConstants.USER_ROLE.ADMINISTRATOR && runtime.envType == "SANDBOX") { userHasAccess = true; }
                	if (userObj.department == srsConstants.DEPT.ACQUIOM_OPERATIONS) {
                    	if (   userObj.role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER 
                        	|| userObj.role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST) {
                		    userHasAccess = true;
                        }
                	}
                	log.debug("recordStatus: " + recordStatus );
                	if (userHasAccess) {
                		var field = context.form.getField("custrecord_pay_file_chg_pymts_date_chk");
                		if (field) {log.debug("set to normal " ); field.updateDisplayType({ displayType:ui.FieldDisplayType.NORMAL }); }
                	} // if (userHasAccess)
            	} // if (recordStatus <= "")
            	hideFields(context);

        	} // if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT)
        	
        	
        	if (context.type == context.UserEventType.VIEW) {
        		// ATP-1312
        		rcd = context.newRecord;
				var objFieldManualReason  = context.form.getField({ id:"custrecord_pay_file_manual_reason" });
				var objFieldManualExplain = context.form.getField({ id:"custrecord_pay_file_man_deliv_explain" });
        		
				var deliverMethod_Manual = 2;
				var deliveryMethod = rcd.getValue("custrecord_pay_file_deliv_method");
				if (deliveryMethod == deliverMethod_Manual) {
					var deliverMethod_Manual_other = 3;
					var deliveryMethodManualReason = rcd.getValue("custrecord_pay_file_manual_reason");
					if (deliveryMethodManualReason != deliverMethod_Manual_other) { objFieldManualExplain.updateDisplayType({ displayType:ui.FieldDisplayType.HIDDEN }); }
				}
				else {
					objFieldManualReason.updateDisplayType({  displayType:ui.FieldDisplayType.HIDDEN });
					objFieldManualExplain.updateDisplayType({ displayType:ui.FieldDisplayType.HIDDEN });
				}
				// end ATP-1312
        		
				var fldFilename = context.form.addField({ id: 'custpage_filename' ,type:ui.FieldType.TEXT ,label:'Payment File' });
				fldFilename.updateBreakType({ breakType:ui.FieldBreakType.STARTCOL });
				fldFilename.defaultValue = context.newRecord.getText("custrecord_pay_file_linktofile");
				fldFilename.updateDisplayType({ displayType:ui.FieldDisplayType.INLINE });
				context.form.insertField({ field:fldFilename ,nextfield:'custrecord_pay_file_deliv_status' });
        		
        		var deliveryStatus_readydownload = 5;
        		var deliveryStatus_downloaded    = 6;
        		var deliveryStatus = context.newRecord.getValue("custrecord_pay_file_deliv_status");
        		if (deliveryStatus == deliveryStatus_readydownload) {
                    var suiteletURL = url.resolveScript({ scriptId:'customscript_gen_utilities_sl'
                                                     ,deploymentId:'customdeploy_gen_utilities_sl'
                                                ,returnExternalUrl:false
                                                           ,params:{"recordId":context.newRecord.id 
                                                        	         ,"action":"DownloadPaymentFile" 
                                                                 	 ,"userid":runtime.getCurrentUser().id 
                                                        	       }
                    								   });
                    var scr = "document.getElementById('custpage_download').style.display='none';"
                	    + "document.getElementById('secondarycustpage_download').style.display='none';"
                	    + "document.getElementById('custrecord_pay_file_deliv_status').previousElementSibling.innerHTML='download requested';"
                	    + "window.location.href='" + suiteletURL + "'; console.log";            
                    if (context.newRecord.getValue("custrecord_pay_file_linktofile"))
                    {
                    	context.form.addButton({ id:"custpage_download" ,label:"Download File" ,functionName:scr });    					    				
                    }
                }

                if (deliveryStatus == deliveryStatus_downloaded) {
                    var suiteletURL = url.resolveScript({ scriptId:'customscript_gen_utilities_sl'
                                                     ,deploymentId:'customdeploy_gen_utilities_sl'
                                                ,returnExternalUrl:false
                                                           ,params:{"recordId":context.newRecord.id 
                                                        	         ,"action":"PaymentFileDeliveryComplete" 
                                                             	     ,"userid":runtime.getCurrentUser().id 
                                                                   }
                                                       });
                    var scr = "document.getElementById('custpage_markcomplete').style.display='none';"
                    	    + "document.getElementById('secondarycustpage_markcomplete').style.display='none';"
                    	    + "window.location.href='" + suiteletURL + "'; console.log";   
                   context.form.addButton({ id:"custpage_markcomplete" ,label:"Set Delivery Complete" ,functionName:scr });
                   
                }
                
                hideFields(context);
        	} // if (context.type == context.UserEventType.VIEW)
        	
        	
            return;

        } // beforeLoad(context)

        
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function fileHasBeenGeneratedProtectFields(context) {
        	var fieldList = [ "custrecord_pay_file_payment_bank"
        		             ,"custrecord_pay_file_deliv_method"
        		             ,"custrecord_pay_file_type"
        		             ,"custpage_glaccount"
        		             ,"custpage_currency"
        		];
        	setFieldDisplayType(context ,fieldList ,'DISABLED' );
        }
        
        
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


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function hideFields(context) {
        	
			if ( runtime.executionContext == 'USERINTERFACE' ) { 
	        	var fieldList = [];
	        	var newRec = context.newRecord;
				var userRole = {administrator: 'administrator'};
				if (runtime.getCurrentUser().roleId != userRole.administrator) {
					fieldList.push("custrecord_pay_file_linktofile");
					fieldList.push("custrecord_pay_file_async_xmit_file");
					fieldList.push("custrecord_pay_file_cre_generated_file");
					fieldList.push("custrecord_pay_file_cre_filename_suffix");
					if (newRec.getValue("custrecord_pay_file_linktofile") == newRec.getValue("custrecord_pay_file_suitelet_csv_file")) {
						fieldList.push("custrecord_pay_file_suitelet_csv_file");
					}
				}
				
				for (ix in fieldList) {
					var objField = context.form.getField({ id:fieldList[ix] });
					objField.updateDisplayType({ displayType:ui.FieldDisplayType.HIDDEN });
				}
			} // if ( runtime.executionContext == 'USERINTERFACE' )
			
        }


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeSubmit(context) {
            var funcName = scriptFileName + "--->beforeSubmit";
            var oldRec = context.oldRecord;
            var newRec = context.newRecord;
            var rcd = context.newRecord;
    		var deliveryStatus = context.newRecord.getValue("custrecord_pay_file_deliv_status");
    		var status         = context.newRecord.getValue("custrecord_pay_file_status");
    		
    		if (context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.EDIT) {
                if (fieldHasChanged(context ,"custrecord_pay_file_status")) {
            		var status_cancelled            = 5;
            		var deliveryStatus_cancelled    = 7;
                	if (status == status_cancelled) {
                		newRec.setValue("custrecord_pay_file_deliv_status"   ,deliveryStatus_cancelled);
                		newRec.setValue("custrecord_pay_file_deliv_datetime" ,new Date());
                		newRec.setValue("custrecord_pay_file_deliv_user"     ,runtime.getCurrentUser().id);                		
                	}
                }
                
                if (fieldHasChanged(context ,"custrecord_pay_file_deliv_status")) {
            		var deliveryStatus_complete      = 3;
            		var deliveryStatus_downloaded    = 6;
            		if (deliveryStatus == deliveryStatus_complete){ 
                        var currUser = runtime.getCurrentUser().id;
                        if (runtime.executionContext == 'WEBSERVICES') {
                            var BoomiIntegrationParms = JSON.parse( appSettings.readAppSetting("Payment File Creation", "Boomi Integration") );
                            currUser = BoomiIntegrationParms[0].EmployeeId;
                        }
            			newRec.setValue("custrecord_pay_file_deliv_user"     ,currUser);
            			newRec.setValue("custrecord_pay_file_deliv_datetime" ,new Date() );
            		}
                }
                
    			if (!oldRec.getValue("custrecord_pay_file_deliv_status")){ // Only update status if it has never been set before
                    if (!oldRec.getValue("custrecord_pay_file_linktofile") && newRec.getValue("custrecord_pay_file_linktofile")) {
                		var deliveryStatus_readyapproval = 2;
                		newRec.setValue("custrecord_pay_file_deliv_status" ,deliveryStatus_readyapproval);
                    }
    			}
                
    		}
            
            
            log.debug(funcName ,"context.UserEventType: " + context.UserEventType);
    		// ATP-1312
            if (   context.type == context.UserEventType.XEDIT 
            	|| context.type == context.UserEventType.EDIT 
            	|| context.type == context.UserEventType.CREATE) {
            	var editManualDeliveryFields = false;
            	if (   fieldHasChanged(context ,"custrecord_pay_file_deliv_method")
            		|| fieldHasChanged(context ,"custrecord_pay_file_manual_reason")
            		|| fieldHasChanged(context ,"custrecord_pay_file_man_deliv_explain")) { editManualDeliveryFields = true; }
            	
                log.debug(funcName ,"editManualDeliveryFields: " + editManualDeliveryFields);
            	if (editManualDeliveryFields) {
            		
    				var deliverMethod_Manual = 2;
    				var deliveryMethod = rcd.getValue("custrecord_pay_file_deliv_method");
    				
    				if (deliveryMethod == deliverMethod_Manual) {
    					var deliverMethod_Manual_other = 3;
    					var deliveryMethodManualReason = rcd.getValue("custrecord_pay_file_manual_reason");
    					if (deliveryMethodManualReason < 1) { throw "Delivery Method is 'Manual', MANUAL DELIVERY REASON is required." }
    					if (deliveryMethodManualReason == deliverMethod_Manual_other) { 
    						if (rcd.getValue("custrecord_pay_file_man_deliv_explain") <= "") { throw "Manual Delivery Reason is 'Other', MANUAL DELIVERY EXPLANATION is required." } 
    					}
    					else { 
    						if (rcd.getValue("custrecord_pay_file_man_deliv_explain") > "") { throw "Manual Delivery Reason is NOT 'Other', MANUAL DELIVERY EXPLANATION must be empty." }
    					}
    				}
    				else {
    					if (rcd.getValue("custrecord_pay_file_manual_reason") >= 1 )    { throw "Delivery Method is NOT 'Manual', MANUAL DELIVERY REASON must be empty." }
						if (rcd.getValue("custrecord_pay_file_man_deliv_explain") > "") { throw "Delivery Method is NOT 'Manual', MANUAL DELIVERY EXPLANATION must be empty." } 
    				}
            	}
            	// end ATP-1312
            	
            	if (fieldHasChanged(context ,"custrecord_pay_file_currency")
        		|| fieldHasChanged(context ,"custrecord_pay_file_account")		
        		)
        		{
        			var pay_file_type = newRec.getValue("custrecord_pay_file_type");
                	var savedGlAccountValue = newRec.getValue("custrecord_pay_file_account");
	        		var savedCurrencyValue = rcd.getValue("custrecord_pay_file_currency");
	        		var results = null;
	        		if (pay_file_type)
	        		{
		        		//lookup currency selection required field on Payment Bank 
		        		results = search.lookupFields({type:"customrecord_pay_file_type" ,id:pay_file_type
		    	            ,columns:["custrecord_pft_currency_selection_req", "custrecord_pft_account_options"]});
		    			
		        		if (results)
		        		{
		        			if (results.custrecord_pft_currency_selection_req)
		        			{
			        			if (!parseInt(savedCurrencyValue,10))
			        			{
			        				throw "Currency is required for Payment File Type '" + newRec.getText("custrecord_pay_file_type") + "'";
			        			}
		        			}
		        			if (results 
	        	        		&& results.custrecord_pft_account_options 
	        	        		&& results.custrecord_pft_account_options[0] 
	        	        		&& parseInt(results.custrecord_pft_account_options[0].value,10) === parseInt(srsConstants["PFT Account Options"]["GL Account Selection Required"],10))
		        			{
			        			if (!savedGlAccountValue)
			        			{
			        				throw "GL Account is required for Payment File Type '" + newRec.getText("custrecord_pay_file_type") + "'";
			        			}
		        			}
		        		}
	        		}
        		}
            
            }
			return;


        } // beforeSubmit(context)
        


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function afterSubmit(context) {
            var scriptFunctionName = "afterSubmit";
            scriptFullName = scriptFileName + "--->" + scriptFunctionName;

            
            return;

            
        } // afterSubmit(context)


        
        
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function fieldHasChanged(context ,fieldName) {
        	if (context.type == context.UserEventType.CREATE) {
        		if (context.newRecord.getValue(fieldName) > "" ) { 
        			return true; 
        		}
        	} 
        	else 
        	if (context.type == context.UserEventType.XEDIT) {
				fieldPos = context.newRecord.getFields().indexOf(fieldName);
				if (fieldPos != -1) {
					return true;
				}
        	}
        	else
            if (context.oldRecord.getValue(fieldName) != context.newRecord.getValue(fieldName) ) {
            	return true;            
        	}
        	return false;
        }
        
        


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return {
             beforeLoad: beforeLoad
            ,beforeSubmit: beforeSubmit
//            ,afterSubmit: afterSubmit
        };

    });