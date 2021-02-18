/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime', 'N/ui/message', 'N/currentRecord'
       ,'/.bundle/132118/PRI_AS_Engine'
	   ],
	/**
	 * -----------------------------------------------------------
	 * importRecordClient.js
	 * ___________________________________________________________
	 * Sets Timestamp fields when certain fields are changed on the 
	 * Import record
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2018-02-08	
	 *
	 * Version 1.01
	 * Author: Scott Streule
	 * Date: 2018-07-26
	 * Notes:  Added a new field in fieldChanged function.  New field 
	 *         behaves the exact same way as the others in the function
	 *         new field is custrecord_imp_sda_imported .  Ticket ATP-274
	 * ___________________________________________________________
	 */
	function(runtime ,msg, currentRecord ,appSettings ) {

		var timeStamp = null;
		var currentUser = null;
		var triggerFieldValue = null;
		var rcd = null;
		var ingnorefieldChanged = false;

        
//        var checkedByFieldList = [ {fldYesNo:"custrecord_imp_completed"                ,fldDate:"custrecord_imp_completed_date"            ,fldUser:"custrecord_imp_completed_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_tab1_completed"           ,fldDate:"custrecord_imp_tab1_completed_date"       ,fldUser:"custrecord_imp_tab1_completed_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_tab1_approved"            ,fldDate:"custrecord_imp_tab1_approved_date"        ,fldUser:"custrecord_imp_tab1_approved_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_escrow_deposit_confirmed" ,fldDate:"custrecord_imp_escrow_deposit_conf_date"  ,fldUser:"custrecord_imp_escrow_dep_conf_checkby"}
//                                  ,{fldYesNo:"custrecord_imp_guidelines_complete"      ,fldDate:"custrecord_imp_guidelines_completed_date" ,fldUser:"custrecord_imp_guidelines_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_file_prepared"            ,fldDate:"custrecord_imp_file_prepared_date"        ,fldUser:"custrecord_imp_file_prepared_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_tab1_reviewed"            ,fldDate:"custrecord_imp_tab1_reviewed_date"        ,fldUser:"custrecord_imp_tab1_reviewed_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_mjr_sh_letters_created"   ,fldDate:"custrecord_imp_mjr_sh_ltr_created_date"   ,fldUser:"custrecord_imp_mjr_sh_ltr_created_check"}
//                                  ,{fldYesNo:"custrecord_imp_mjr_sh_letters_sent"      ,fldDate:"custrecord_imp_mjr_sh_letters_sent_date"  ,fldUser:"custrecord_imp_mjr_sh_ltr_sent_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_welcome_letter_sent"      ,fldDate:"custrecord_imp_welcome_letter_sent_date"  ,fldUser:"custrecord_imp_welcme_ltr_sent_checkedby"}
//                                  ,{fldYesNo:"custrecord_imp_dealcontacts_imported"    ,fldDate:"custrecord_imp_dealcontacts_imprtd_date"  ,fldUser:"custrecord_imp_dealcontacts_imprt_chckby"}
//                                  ,{fldYesNo:"custrecord_imp_compl_rev_completed"      ,fldDate:"custrecord_imp_compl_rev_completed_dt"    ,fldUser:"custrecord_imp_compl_rev_completed_by"}
//                                  ,{fldYesNo:"custrecord_imp_pay_susp_reason_added"    ,fldDate:"custrecord_imp_pay_susp_reason_added_dt"  ,fldUser:"custrecord_imp_pay_susp_reason_added_by"}
//                                  ,{fldYesNo:"custrecord_imp_new_ers_verified"         ,fldDate:"custrecord_imp_new_ers_verified_dt"       ,fldUser:"custrecord_imp_new_ers_verified_by"}
//                                  ,{fldYesNo:"custrecord_imp_note_added"               ,fldDate:"custrecord_imp_note_added_dt"             ,fldUser:"custrecord_imp_note_added_by"}
//                                  ,{fldYesNo:"custrecord_imp_sda_imported"             ,fldDate:"custrecord_imp_sda_imported_dt"           ,fldUser:"custrecord_imp_sda_imported_by"}];
		// Removed by Ken 20190291 1930
		// var checkedByFieldList = JSON.parse( appSettings.readAppSetting("Import", "CheckedByFieldList") );
		
		//=====================================================================================================
		//=====================================================================================================
		function getFieldValue(context, fieldID){
			var fieldValue = context.currentRecord.getValue({
				fieldId: fieldID
			});
			return fieldValue;
		}

		//=====================================================================================================
		//=====================================================================================================
		function pageInit( context ) {
			var checkedByFieldList = JSON.parse( appSettings.readAppSetting("Import", "CheckedByFieldList") ); // Inserted by Ken 20190291 1930
            //var UserId = runtime.getCurrentUser().id;

			
			rcd = context.currentRecord;

			ingnorefieldChanged = true;
			checkedByFieldList.forEach(resetCheckedbyAndDate); 
			ingnorefieldChanged = false;
            
		}
		
        //==============================================================================================
        // the purpose of this function is to detect checkedBy fields where the checked has been
        // set to "No", but the date and checked by user have not been cleared.
        // this function will clear the date and user fields if the YES/NO field is No
        //==============================================================================================
        function resetCheckedbyAndDate(objFields ,ix ,arr) {       	
            
            if ( rcd.getText(objFields.fldYesNo) == 'No' ) {

                if (rcd.getValue(objFields.fldUser) ) { 
                    rcd.setValue(objFields.fldUser ,null ,true);
                }
                if (rcd.getValue(objFields.fldDate) ) { 
                    rcd.setValue(objFields.fldDate ,null ,true);
                }

            } // if ( rcd.getText(objFields.fldYesNo) == 'No' )
            
        } // function resetCheckedbyAndDate


		//=====================================================================================================
		//=====================================================================================================
		function fieldChanged(context) {

			
			if (ingnorefieldChanged) { return; }
			var checkedByFieldList = JSON.parse( appSettings.readAppSetting("Import", "CheckedByFieldList") ); // Inserted by Ken 20190291 1930
			timeStamp = new Date();
			var rcd = context.currentRecord;

			var validateAlphaPiCheckedByFieldsON = ( appSettings.readAppSetting("Import", "validateAlphaPiCheckedByFields") == true );      
			if (validateAlphaPiCheckedByFieldsON) {
                validateAlphaPiCheckedByFields(context);
			}
          
			for (i = 0; i < checkedByFieldList.length; i++) {
				var objFieldSet = checkedByFieldList[i];
				if (objFieldSet.fldYesNo == context.fieldId) {
					triggerFieldChange(context, objFieldSet.fldUser, objFieldSet.fldDate);
					break;
				}
			}
          
		}
		
		
		//=====================================================================================================
		//=====================================================================================================
		function validateAlphaPiCheckedByFields(context) {
			
			switch (context.fieldId) {
            
			case 'custrecord_imp_completed':
				currentUser = runtime.getCurrentUser().id;
				
				var imp_completed = rcd.getText({ fieldId:'custrecord_imp_completed' });
				
				if (rcd.getValue("custrecord_imp_instruction_type") == 4 && (imp_completed == "Yes" || imp_completed == "N/A")) {
					var imp_tab1_completed = rcd.getText({ fieldId:'custrecord_imp_tab1_completed' });
					if (imp_tab1_completed == "Yes" || imp_tab1_completed == "N/A") { 
						var User_tab1_completed = rcd.getValue({ fieldId:'custrecord_imp_tab1_completed_checkedby' }) || null;
						if (User_tab1_completed) { 
							if (User_tab1_completed == currentUser) { 
								showErrorMessage('Checked By Error.', 'You have already marked Tab1 Completed, you may not also mark Import Completed.'); 
								rcd.setValue({ fieldId:'custrecord_imp_completed' ,value:2 ,ignoreFieldChange:true })
								break;
							}
						}
					}
					
					var imp_tab1_approved = rcd.getText({ fieldId:'custrecord_imp_tab1_approved' });
					if (imp_tab1_approved == "Yes" || imp_tab1_approved == "N/A") { 
						var User_tab1_approved = rcd.getValue({ fieldId:'custrecord_imp_tab1_approved_checkedby' }) || null;
						if (User_tab1_approved) { 
							if (User_tab1_approved == currentUser) { 
								showErrorMessage('Checked by Error.', 'You have already marked Tab1 Approved, you may not also mark Import Completed.'); 
								rcd.setValue({ fieldId:'custrecord_imp_completed' ,value:2 ,ignoreFieldChange:true })
								break; 
							}
						}
					}
				} // if (imp_completed == "Yes" || imp_completed == "N/A")
				
				break;
          
			case 'custrecord_imp_tab1_completed':
				currentUser = runtime.getCurrentUser().id;
				
				var imp_tab1_completed = rcd.getText({ fieldId:'custrecord_imp_tab1_completed' });
				
				if (rcd.getValue("custrecord_imp_instruction_type") == 4 && (imp_tab1_completed == "Yes" || imp_tab1_completed == "N/A")) {
					var imp_completed = rcd.getText({ fieldId:'custrecord_imp_completed' });
					if (imp_completed == "Yes" || imp_completed == "N/A") { 
						var User_imp_completed = rcd.getValue({ fieldId:'custrecord_imp_completed_checkedby' }) || null;
						if (User_imp_completed) { 
							if (User_imp_completed == currentUser) { 
								showErrorMessage('Checked By Error.', 'You have already marked Import Completed, you may not also mark Tab1 Completed.'); 
								rcd.setValue({ fieldId:'custrecord_imp_tab1_completed' ,value:2 ,ignoreFieldChange:true })
                                log.error("ATP-796 :", "currentUser " + currentUser);
								break;
							}
						}
					}
					
					var imp_tab1_approved = rcd.getText({ fieldId:'custrecord_imp_tab1_approved' });
					if (imp_tab1_approved == "Yes" || imp_tab1_approved == "N/A") { 
						var User_tab1_approved = rcd.getValue({ fieldId:'custrecord_imp_tab1_approved_checkedby' }) || null;
						if (User_tab1_approved) { 
							if (User_tab1_approved == currentUser) { 
								showErrorMessage('Checked by Error.', 'You have already marked Tab1 Approved, you may not also mark Tab1 Completed.'); 
								rcd.setValue({ fieldId:'custrecord_imp_tab1_completed' ,value:2 ,ignoreFieldChange:true })
								break; 
							}
						}
					}
				} // if (imp_tab1_completed == "Yes" || imp_tab1_completed == "N/A")
				
				break;
          
			case 'custrecord_imp_tab1_approved':
				currentUser = runtime.getCurrentUser().id;
				
				var imp_tab1_approved = rcd.getText({ fieldId:'custrecord_imp_tab1_approved' });
				
				if (rcd.getValue("custrecord_imp_instruction_type") == 4 && (imp_tab1_approved == "Yes" || imp_tab1_approved == "N/A")) {
					var imp_completed = rcd.getText({ fieldId:'custrecord_imp_completed' });
					if (imp_completed == "Yes" || imp_completed == "N/A") { 
						var User_imp_completed = rcd.getValue({ fieldId:'custrecord_imp_completed_checkedby' }) || null;
						if (User_imp_completed) { 
							if (User_imp_completed == currentUser) { 
								showErrorMessage('Checked By Error.', 'You have already marked Import Completed, you may not also mark Tab1 Approved.'); 
								rcd.setValue({ fieldId:'custrecord_imp_tab1_approved' ,value:2 ,ignoreFieldChange:true })
								break;
							}
						}
					}
					
					var imp_tab1_completed = rcd.getText({ fieldId:'custrecord_imp_tab1_completed' });
					if (imp_tab1_completed == "Yes" || imp_tab1_completed == "N/A") { 
						var User_tab1_completed = rcd.getValue({ fieldId:'custrecord_imp_tab1_completed_checkedby' }) || null;
						if (User_tab1_completed) { 
							if (User_tab1_completed == currentUser) { 
								showErrorMessage('Checked by Error.', 'You have already marked Tab1 Completed, you may not also mark Tab1 Approved.'); 
								rcd.setValue({ fieldId:'custrecord_imp_tab1_approved' ,value:2 ,ignoreFieldChange:true })
								break;
							}
						}
					}
				} // if (imp_tab1_completed == "Yes" || imp_tab1_completed == "N/A")

				break;
		    
			} // switch (context.fieldId)

		}

		
		//=====================================================================================================
		//=====================================================================================================
		function triggerFieldChange(context, completedBy, completedDateTime) {
			console.log(' triggerFieldChange context: ' + JSON.stringify(context));
			triggerFieldValue = parseInt(context.currentRecord.getValue({
				fieldId: context.fieldId
			})) || null;
			console.log(' triggerFieldChange triggerFieldValue: ' + JSON.stringify(triggerFieldValue));
			if (triggerFieldValue && triggerFieldValue !== 2) { // User selected anything except No or null
				setTimeStamp(context, completedBy, completedDateTime);
			} else {
				clearTimeStamp(context, completedBy, completedDateTime);
			}
		}

		//=====================================================================================================
		//=====================================================================================================
		function setTimeStamp(context, setByField, dateTimeField) {
			context.currentRecord.setValue({
				fieldId: dateTimeField,
				value: timeStamp
			});
			currentUser = runtime.getCurrentUser().id;
			context.currentRecord.setValue({
				fieldId: setByField,
				value: currentUser
			});
		}

		//=====================================================================================================
		//=====================================================================================================
		function clearTimeStamp(context, setByField, dateTimeField) {

			context.currentRecord.setValue({
				fieldId: dateTimeField,
				value: null
			});
			context.currentRecord.setValue({
				fieldId: setByField,
				value: null
			});
		}
		
		//=====================================================================================================
		//=====================================================================================================
		function showErrorMessage(msgTitle, msgText) {
			var myMsg = msg.create({
				title: msgTitle,
				message: msgText,
				type: msg.Type.ERROR
			});
			myMsg.show({ duration: 7500 });
            window.scrollTo(0, 0);
		}

		return {
			 pageInit: pageInit
			,fieldChanged: fieldChanged
			
		};
	});