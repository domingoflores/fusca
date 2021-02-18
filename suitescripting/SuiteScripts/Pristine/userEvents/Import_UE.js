/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/email', 'N/error', 'N/search', 'N/file', 'N/record', 'N/runtime', 'N/transaction', 'N/ui/serverWidget' ,'N/redirect' 
	,'/.bundle/132118/PRI_AS_Engine'
	,'/.bundle/132118/PRI_ServerLibrary',
	'/SuiteScripts/Prolecto/Shared/SRS_Functions'
	],
    /**
     * @param {email} email
     * @param {error} error
     * @param {file} file
     * @param {record} record
     * @param {runtime} runtime
     * @param {transaction} transaction
     */

    function(email, error, search, file, record, runtime, transaction, ui ,redirect ,appSettings 
    		,priLibrary, srsFunctions		
    ) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptcontext
         * @param {Record} scriptcontext.newRecord - New record
         * @param {string} scriptcontext.type - Trigger type
         * @param {Form} scriptcontext.form - Current form
         * @Since 2015.2
         */

        var scriptFileName = "Import_UE.js";
        var UserEventType;
        var rcdNew;
        var rcdOld;
        var userId;
        var objDate;

        var old_imp_tab1_completed = 0;
        var old_imp_completed = 0;
        var old_imp_tab1_approved = 0;

//                var checkedByFieldList = [{
//            fldYesNo: "custrecord_imp_completed",
//            fldDate: "custrecord_imp_completed_date",
//            fldUser: "custrecord_imp_completed_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_tab1_completed",
//            fldDate: "custrecord_imp_tab1_completed_date",
//            fldUser: "custrecord_imp_tab1_completed_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_tab1_approved",
//            fldDate: "custrecord_imp_tab1_approved_date",
//            fldUser: "custrecord_imp_tab1_approved_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_escrow_deposit_confirmed",
//            fldDate: "custrecord_imp_escrow_deposit_conf_date",
//            fldUser: "custrecord_imp_escrow_dep_conf_checkby"
//        }, {
//            fldYesNo: "custrecord_imp_guidelines_complete",
//            fldDate: "custrecord_imp_guidelines_completed_date",
//            fldUser: "custrecord_imp_guidelines_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_file_prepared",
//            fldDate: "custrecord_imp_file_prepared_date",
//            fldUser: "custrecord_imp_file_prepared_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_tab1_reviewed",
//            fldDate: "custrecord_imp_tab1_reviewed_date",
//            fldUser: "custrecord_imp_tab1_reviewed_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_mjr_sh_letters_created",
//            fldDate: "custrecord_imp_mjr_sh_ltr_created_date",
//            fldUser: "custrecord_imp_mjr_sh_ltr_created_check"
//        }, {
//            fldYesNo: "custrecord_imp_mjr_sh_letters_sent",
//            fldDate: "custrecord_imp_mjr_sh_letters_sent_date",
//            fldUser: "custrecord_imp_mjr_sh_ltr_sent_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_welcome_letter_sent",
//            fldDate: "custrecord_imp_welcome_letter_sent_date",
//            fldUser: "custrecord_imp_welcme_ltr_sent_checkedby"
//        }, {
//            fldYesNo: "custrecord_imp_dealcontacts_imported",
//            fldDate: "custrecord_imp_dealcontacts_imprtd_date",
//            fldUser: "custrecord_imp_dealcontacts_imprt_chckby"
//        }, {
//            fldYesNo: "custrecord_imp_compl_rev_completed",
//            fldDate: "custrecord_imp_compl_rev_completed_dt",
//            fldUser: "custrecord_imp_compl_rev_completed_by"
//        }, {
//            fldYesNo: "custrecord_imp_pay_susp_reason_added",
//            fldDate: "custrecord_imp_pay_susp_reason_added_dt",
//            fldUser: "custrecord_imp_pay_susp_reason_added_by"
//        }, {
//            fldYesNo: "custrecord_imp_new_ers_verified",
//            fldDate: "custrecord_imp_new_ers_verified_dt",
//            fldUser: "custrecord_imp_new_ers_verified_by"
//        }, {
//            fldYesNo: "custrecord_imp_note_added",
//            fldDate: "custrecord_imp_note_added_dt",
//            fldUser: "custrecord_imp_note_added_by"
//        }, {
//            fldYesNo: "custrecord_imp_sda_imported",
//            fldDate: "custrecord_imp_sda_imported_dt",
//            fldUser: "custrecord_imp_sda_imported_by"
//        }];
        // The following line commented out by Ken and moved to beforeSubmit where it is used.
        // This was causing the following error trying to save the script in Prod:
        // "Fail to evaluate script.All SuiteScript API Modules are unavailable while executing your define callback" 
		// var checkedByFieldList = JSON.parse( appSettings.readAppSetting("Import", "CheckedByFieldList") ); 

        var formByInstructionTypeSB = [ { "instructionType":"Shareholder Rep Import"           ,"formId":"235" }
                                     ,{ "instructionType":"Acquiom Import"                   ,"formId":"247"}
                                     ,{ "instructionType":"Transfer Import"                  ,"formId":"278"}
                                     ,{ "instructionType":"Alpha Payment Instruction Import" ,"formId":"322"} ];

        var formByInstructionTypeProd = [ { "instructionType":"Shareholder Rep Import"           ,"formId":"235" }
                                     ,{ "instructionType":"Acquiom Import"                   ,"formId":"247"}
                                     ,{ "instructionType":"Transfer Import"                  ,"formId":"278"}
                                     ,{ "instructionType":"Alpha Payment Instruction Import" ,"formId":"290"} ]; //Form created by Ken in Prod

        var formByInstructionType;
            


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeLoad(context) {
                	
        	var scriptFunctionName = "beforeLoad";
        	var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
            //    	log.debug(scriptFullName, "========================================================================");
            //    	log.debug(scriptFullName, "========================================================================");
            //    	log.debug(scriptFullName, "UserEventType: " + context.type);
        	
//        	if (runtime.envType == "SANDBOX") { formByInstructionType = formByInstructionTypeSB; } 
//        	else {  formByInstructionType = formByInstructionTypeProd;  }
        	formByInstructionType = JSON.parse( appSettings.readAppSetting("Import", "FormByInstructionType") );
        	
        	if (runtime.executionContext.toLowerCase() == 'userinterface') {
        		var fieldScriptId = context.form.getField({ id:"scriptid" });
        		if (fieldScriptId) { fieldScriptId.updateDisplayType({ displayType:ui.FieldDisplayType.HIDDEN }); }        		
        	}
        	
        	if (context.type != context.UserEventType.CREATE) { 
                var instructionType = context.newRecord.getValue("custrecord_imp_instruction_type");
                log.debug(scriptFullName, "context.newRecord.getValue('customform'):" + context.newRecord.getValue("customform"));
                log.debug(scriptFullName, "instructionType:" + instructionType);
        		if (instructionType > "") { 
                    var ix = instructionType - 1; // Instruction Type List starts at 1, not zero based like an array
                    log.debug(scriptFullName, "context.newRecord.getValue('customform'):" + context.newRecord.getValue("customform") + ",     instructionType: " + instructionType +  "ix: " + ix);
                    var desiredFormId;
                    if (instructionType < 1) { desiredFormId = "235"; }
                    else { desiredFormId = formByInstructionType[ix].formId; }
                    //var desiredFormId = formByInstructionType[ix].formId;
                    var currentFormId;
                    if (context.type == context.UserEventType.VIEW) {
                    	currentFormId = context.request.parameters.cf;
                    	if (!currentFormId) { currentFormId = "" } 
                    } else { var currentFormId = context.newRecord.getValue("customform"); }
                    		
                    log.debug(scriptFullName, "desiredFormId: " + desiredFormId +  "currentFormId: " + currentFormId);
                    
                    //If the form does not match the Instruction Type the redirect top the correct form
                    if (currentFormId != desiredFormId) {
                    	var parameters = {'cf':desiredFormId };
                    	if (context.type == context.UserEventType.EDIT) { parameters.e = "T" }
                    	redirect.toRecord({ type:"customrecord_import_record" ,id:context.newRecord.id ,parameters:parameters }); 
                    }
        		}
        	}
            		
        	if (context.type == context.UserEventType.EDIT) {
        		var fieldForm = context.form.getField("customform");
        		if (fieldForm) { 
        			fieldForm.updateDisplayType({ displayType:ui.FieldDisplayType.INLINE });
        		}
        		var field = context.form.getField("custrecord_imp_instruction_type");
        		if (field) { 
        			field.updateDisplayType({ displayType:ui.FieldDisplayType.INLINE });
        		}
        	}
        	
        	if (context.type == context.UserEventType.CREATE) { 
        		var field = context.form.getField("custrecord_imp_instruction_type");
        		if (field) { 
        			field.updateDisplayType({ displayType:ui.FieldDisplayType.HIDDEN });
        		}
        	}

            return;

        } // beforeLoad(context)



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeSubmit(context) {
            var scriptFunctionName = "beforeSubmit";
            var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
            //    	log.debug(scriptFullName, "========================================================================");
            //    	log.debug(scriptFullName, "========================================================================");
            log.debug(scriptFullName, "UserEventType: " + context.type);
            log.debug(scriptFullName, "context.oldRecord: " + JSON.stringify(context.oldRecord));
            // Following line inserted by Ken 20190219 1921 because it was causing an error when deploying to Prod
            var checkedByFieldList = JSON.parse( appSettings.readAppSetting("Import", "CheckedByFieldList") ); 
            var importError;
            rcdNew = context.newRecord;
            rcdOld = context.oldRecord;
            UserEventType = context.type;
            
        	userId = runtime.getCurrentUser().id;
            objDate = new Date();
        	        	
//        	if (runtime.envType == "SANDBOX") { formByInstructionType = formByInstructionTypeSB; } 
//        	else {  formByInstructionType = formByInstructionTypeProd;  }
        	formByInstructionType = JSON.parse( appSettings.readAppSetting("Import", "FormByInstructionType") );

        	if (context.type == context.UserEventType.CREATE) { 
        		var formId = context.newRecord.getValue("customform");
        		log.debug(scriptFullName, "formId: " + formId);
        		for (i=0; i<formByInstructionType.length; i++) { if (formByInstructionType[i].formId == formId) { break; } }
        		var instructionType = formByInstructionType[i].instructionType;
        		i++; // Instruction Type List starts at 1, not zero based like an array
//        		log.debug(scriptFullName, "i: " + i + ",    instructionType: " + instructionType);
				context.newRecord.setValue("custrecord_imp_instruction_type" ,i);
        	}
        	else if (context.type == context.UserEventType.EDIT) {
        		var instructionType = context.newRecord.getValue("custrecord_imp_instruction_type");
        		if (instructionType <= "") {
        			var formId = context.newRecord.getValue("customform");
            		log.debug(scriptFullName, "    formId: " + formId);
        			if (formId) {
                		for (i=0; i<formByInstructionType.length; i++) { if (formByInstructionType[i].formId == formId) { break; } }
                		var instructionType = formByInstructionType[i].instructionType;
                		i++; // Instruction Type List starts at 1, not zero like array
        				context.newRecord.setValue("custrecord_imp_instruction_type" ,i);
        			}
        		}
        	}

            log.debug(scriptFullName, "rcdOld: " + JSON.stringify(rcdOld));
            checkedByFieldList.forEach(resetCheckedbyAndDate);
        	            
            if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.CREATE) {
                if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT) {
                    rcdOld = context.oldRecord;
//                    log.debug(scriptFullName, "rcdOld: " + JSON.stringify(rcdOld));
                    old_imp_tab1_completed = rcdOld.getValue("custrecord_imp_tab1_completed");
                    old_imp_completed = rcdOld.getValue("custrecord_imp_completed");
                    old_imp_tab1_approved = rcdOld.getValue("custrecord_imp_tab1_approved");
                }
                

                if (rcdNew.getValue("custrecord_imp_instruction_type") == 4) { //4 = Alpha Payment Instruction Import
        			var validateAlphaPiCheckedByFieldsON = ( appSettings.readAppSetting("Import", "validateAlphaPiCheckedByFields") == true );      
        			if (validateAlphaPiCheckedByFieldsON) {
                        validateAlphaPiCheckedByFields(rcdNew);
        			}
                }

            } // if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.CREATE)

            
            
            return;


        } // beforeSubmit(context)

        //============================================================================================================
        //============================================================================================================
        function validateAlphaPiCheckedByFields(rcdNew) {

            var scriptFunctionName = "validateAlphaPiCheckedByFields";
            var scriptFullName = scriptFileName + "--->" + scriptFunctionName;

            // YES = 1
            // N/A = 3
            
            // TAB1 COMPLETED
            if (rcdNew.getValue("custrecord_imp_tab1_completed") == '1' || rcdNew.getValue("custrecord_imp_tab1_completed") == '3') {
                if (rcdNew.getValue("custrecord_imp_tab1_completed") != old_imp_tab1_completed) {
                    if (rcdNew.getValue("custrecord_imp_completed") == '1' || rcdNew.getValue("custrecord_imp_completed") == '3') {
                        if (rcdNew.getValue("custrecord_imp_tab1_completed_checkedby") == rcdNew.getValue("custrecord_imp_completed_checkedby")) {
                            importError = error.create({
                                name: 'IMPORT_TAB1_COMPL_CHKBY',
                                message: 'You may not designate TAB1 COMPLETED since you are already responsible for IMPORT COMPLETED. ',
                                notifyOff: true
                            });
                            throw importError.name + ': ' + importError.message;
                        }
                    }

                    if (rcdNew.getValue("custrecord_imp_tab1_approved") == '1' || rcdNew.getValue("custrecord_imp_tab1_approved") == '3') {
                        if (rcdNew.getValue("custrecord_imp_tab1_completed_checkedby") == rcdNew.getValue("custrecord_imp_tab1_approved_checkedby")) {
                            importError = error.create({
                                name: 'IMPORT_TAB1_COMPL_CHKBY',
                                message: 'You may not designate TAB1 COMPLETED since you are already responsible for TAB1 APPROVED. ',
                                notifyOff: true
                            });
                            throw importError.name + ': ' + importError.message;
                        }
                    }
                }
            }


            // IMPORT COMPLETED
            if (rcdNew.getValue("custrecord_imp_completed") == '1' || rcdNew.getValue("custrecord_imp_completed") == '3') {
                if (rcdNew.getValue("custrecord_imp_completed") != old_imp_completed) {

                    if (rcdNew.getValue("custrecord_imp_tab1_completed") == '1' || rcdNew.getValue("custrecord_imp_tab1_completed") == '3') {
                        if (rcdNew.getValue("custrecord_imp_completed_checkedby") == rcdNew.getValue("custrecord_imp_tab1_completed_checkedby")) {
                            importError = error.create({
                                name: 'IMPORT_COMPL_CHKBY',
                                message: 'You may not designate IMPORT COMPLETED since you are already responsible for TAB1 COMPLETED. ',
                                notifyOff: true
                            });
                            throw importError.name + ': ' + importError.message;
                        }
                    }

                    if (rcdNew.getValue("custrecord_imp_tab1_approved") == '1' || rcdNew.getValue("custrecord_imp_tab1_approved") == '3') {
                        if (rcdNew.getValue("custrecord_imp_completed_checkedby") == rcdNew.getValue("custrecord_imp_tab1_approved_checkedby")) {
                            importError = error.create({
                                name: 'IMPORT_COMPL_CHKBY',
                                message: 'You may not designate IMPORT COMPLETED since you are already responsible for TAB1 APPROVED. ',
                                notifyOff: true
                            });
                            throw importError.name + ': ' + importError.message;
                        }
                    }

                }
            }


            // TAB1 APPROVED
            if (rcdNew.getValue("custrecord_imp_tab1_approved") == '1' || rcdNew.getValue("custrecord_imp_tab1_approved") == '3') {
                if (rcdNew.getValue("custrecord_imp_tab1_approved") != old_imp_tab1_approved) {

                    if (rcdNew.getValue("custrecord_imp_tab1_completed") == '1' || rcdNew.getValue("custrecord_imp_tab1_completed") == '3') {
                        if (rcdNew.getValue("custrecord_imp_tab1_approved_checkedby") == rcdNew.getValue("custrecord_imp_tab1_completed_checkedby")) {
                            importError = error.create({
                                name: 'IMPORT_TAB1_APPRV_CHKBY',
                                message: 'You may not designate TAB1 APPROVED since you are already responsible for TAB1 COMPLETED. ',
                                notifyOff: true
                            });
                            throw importError.name + ': ' + importError.message;
                        }
                    }

                    if (rcdNew.getValue("custrecord_imp_completed") == '1' || rcdNew.getValue("custrecord_imp_completed") == '3') {
                        if (rcdNew.getValue("custrecord_imp_tab1_approved_checkedby") == rcdNew.getValue("custrecord_imp_completed_checkedby")) {
                            importError = error.create({
                                name: 'IMPORT_TAB1_APPRV_CHKBY',
                                message: 'You may not designate TAB1 APPROVED since you are already responsible for IMPORT COMPLETED. ',
                                notifyOff: true
                            });
                            throw importError.name + ': ' + importError.message;
                        }
                    }

                }
            }



        }

        //==============================================================================================
        // the purpose of this function is to detect checkedBy fields where the checked has been
        // set to "No", but the date and checked by user have not been cleared.
        // this function will clear the date and user fields if the YES/NO field is No
        //==============================================================================================
        function resetCheckedbyAndDate(objFields, ix, arr) {
            var scriptFunctionName = "resetCheckedbyAndDate";
            var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
            
            // If (xedit and not in list of fields - return)
            if (UserEventType == "xedit") {
            	var fieldList = rcdNew.getFields();
				if (fieldList.indexOf(objFields.fldYesNo) < 0) { return; }
            }

            if (rcdNew.getValue(objFields.fldYesNo) != 1) {
                log.debug('ATP-796 resetCheckedbyAndDate Y/N='+objFields.fldYesNo , 'obj='+ JSON.stringify(objFields) );
                rcdNew.setValue(objFields.fldUser, null);
                rcdNew.setValue(objFields.fldDate, null);
            }
            else{
				var updateUser = false;
            	if (UserEventType == "create") { updateUser = true; }
            	else if (rcdNew.getValue(objFields.fldYesNo) != rcdOld.getValue(objFields.fldYesNo)) { updateUser = true; }
            	// We don't want to assign current user if record was already yes but with no user assigned
            	// but in an import if they set the field to yes we need to assign the current user and datetime
            	// or if for some reason the client script doesn't get the user field assigned we'll catch it here
            	if (updateUser && rcdNew.getValue(objFields.fldUser) == "") {
                    log.debug('ATP-796 updateUser='+updateUser , 'fldUser='+objFields.fldUser+', obj='+ JSON.stringify(objFields) );
            		rcdNew.setValue(objFields.fldUser ,userId); 
            		rcdNew.setValue(objFields.fldDate ,objDate);
            	}
            }



        } // function resetCheckedbyAndDate

        function afterSubmit(context) {
			
			//ATP-1132
			var REC = context.newRecord;
			var records = [];
			//monitor changes of relevant fields (TRANSFEROR and TAB 1 APPROVED, and if changed, 
			//submit old and new transferor's Exchange Records to be re-evaluated
			if (priLibrary.fieldChanged(context, "custrecord_imp_transferor") || 
					priLibrary.fieldChanged(context, "custrecord_imp_tab1_approved")		
			)
			{
				//import record only has shareholder, so that's the only field that canbe added to update exchange records
				records = [];
				records = srsFunctions.addRecordsToArray(context.oldRecord, REC, "custrecord_imp_transferor", records);
			
				var oldTransferor = context.oldRecord && context.oldRecord.getValue({fieldId: "custrecord_imp_transferor"});
				var newTransferor = REC.getValue({fieldId: "custrecord_imp_transferor"});
				var fields = null;
				if (oldTransferor)
				{
					fields = search.lookupFields({type: "customer", 
					id: oldTransferor, 
					columns: ["parent"]}); 
					//[{"value":"928206","text":"# 422174011 Stratevest (Carolyn C. Wieczoreck)"}]
					//console.log(" fields.parent " +  JSON.stringify(fields.parent)); 
					if (fields && fields.parent && fields.parent[0] && fields.parent[0].value !== oldTransferor)
					{
						//if parent is different internal id than shareholder, then indeed, shareholder is sub customer
						records.push(fields.parent[0].value);
					}
				}
				
				if (newTransferor)
				{
					fields = search.lookupFields({type: "customer", 
						id: newTransferor, 
						columns: ["parent"]}); 
					if (fields && fields.parent && fields.parent[0] && fields.parent[0].value !== newTransferor)
					{
						//if parent is different internal id than shareholder, then indeed, shareholder is sub customer
						records.push(fields.parent[0].value);
					}
				}
				if (records.length>0)
				{
					var children = srsFunctions.getChildShareholders(records);
					for (i = 0; i < children.length; i+=1) 
					{
						records.push(children[i]);
					}
				}
				
			}
			
			log.debug("records", JSON.stringify(records));
			if (records.length>0)
			{
				srsFunctions.writeExchangeRecordsToRSMQueue([["custrecord_acq_loth_zzz_zzz_shareholder",search.Operator.ANYOF,records]]);
			}
			
			//ATP-1132 end
        }



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
            ,afterSubmit: afterSubmit
        };

    });