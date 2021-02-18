/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/runtime', 'N/ui/message', 'N/currentRecord', 'N/search', 'N/ui/dialog'
       ,'/SuiteScripts/Pristine/libraries/documentLibraryClient.js'
       ,'/.bundle/132118/PRI_AS_Engine'
	   ],
	/**
	 * -----------------------------------------------------------
	 * documentRecordClient.js
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
	function(runtime ,msg, currentRecord ,search, dialog
			,docLibClient
			,appSettings
			 ) {

		const FIELDS = {
			DOCUMENT: {
				DOC_TYPE: {
					ID: 'custrecord_doc_type',
					// VALUES: ['555'] // Supposed to be Tax Form. There is no id = 555. Tax Form = 654. 
					VALUES: ['654'] // Supposed to be Tax Form. There is no id = 555. Tax Form = 654.
				},
				TAX_FORM_TYPE: 'custrecord_doc_tax_form_type',
				EXC_REC: 'custrecord_acq_lot_exrec',
				ECHOSIGN_JSON: 'custrecord_echosign_json'
			},
			EXCHANGE_RECORD: {
				ID: 'customrecord_acq_lot',
				TAX_FORM_COLLECTED: 'custrecord_exrec_tax_form_collected'
			},
			ADDITIONAL_SIGNER_TAGS: 'Additional Signer Tags'
		};

		var finalResult = false;
		var finalResultSet = false;
		var timeStamp = null;
		var currentUser = null;
		var triggerFieldValue = null;
		var rcd = null;
		// var ingnorefieldChanged = false;
		var scriptName = 'documentRecordClient.js';
        
        var checkedByFieldList = [ {fldYesNo:"custrecord_claim_dept_app"     ,fldDate:"custrecord_claim_dept_app_date"     ,fldUser:"custrecord_claim_dept_app_emp"}
                                 ];
		//=====================================================================================================
		function pageInit( context ) {
			var funcName = scriptName + '==>' + 'pageInit';
			console.log(funcName,'Entered');
            
			rcd = context.currentRecord;
			checkedByFieldList.forEach(resetCheckedbyAndDate); 

			//<ATP-1104>
			var custrecord_doc_esign_link = context.currentRecord.getField({
				fieldId: "custrecord_doc_esign_link"
			});

			var custrecord_doc_backup_link = context.currentRecord.getField({
				fieldId: "custrecord_doc_backup_link"
			});

			custrecord_doc_esign_link.isDisabled = true;
			custrecord_doc_backup_link.isDisabled = true;
			//</ATP-1104>
			
		}
		
        //==============================================================================================
        // the purpose of this function is to detect checkedBy fields where the checked has been
        // set to "No", but the date and checked by user have not been cleared.
        // this function will clear the date and user fields if the YES/NO field is No
        //==============================================================================================
        function resetCheckedbyAndDate(objFields ,ix ,arr) {       	
            
            if ( rcd.getText(objFields.fldYesNo) == 'No' ) {

                if (rcd.getValue(objFields.fldUser) ) { rcd.setValue({fieldId: objFields.fldUser ,value: null ,ignoreFieldChange: true}); }
                if (rcd.getValue(objFields.fldDate) ) { rcd.setValue({fieldId: objFields.fldDate ,value: null ,ignoreFieldChange: true}); }

            } // if ( rcd.getText(objFields.fldYesNo) == 'No' )
            
        } // function resetCheckedbyAndDate


		//=====================================================================================================
		//=====================================================================================================
		function fieldChanged(context) {
			var funcName = scriptName + '==>' + 'fieldChanged';
			console.log(funcName,'context.fieldId: ' + context.fieldId);
			// if (ingnorefieldChanged) { return; }
			
			timeStamp = new Date();
			var rcd = context.currentRecord;
          	var docType,
          		exRecId,
          		taxFormType,
          		taxFormCollected;

			for (i = 0; i < checkedByFieldList.length; i++) {
				var objFieldSet = checkedByFieldList[i];
				if (objFieldSet.fldYesNo == context.fieldId) {
					triggerFieldChange(context, objFieldSet.fldUser, objFieldSet.fldDate);
					break;
				}
			}

			// ATP-1099 ===========================================================================
			//=====================================================================================
			/*
			 * If the Doc Type field is Tax Form and the Tax Form Type is blank then we need to source
			 * in the value of the Tax Form Collected field on the Linked Exchange Record (if one is linked)
			 */
			if (context.fieldId === FIELDS.DOCUMENT.DOC_TYPE.ID) {
				docType = rcd.getValue(FIELDS.DOCUMENT.DOC_TYPE.ID);
				exRecId = rcd.getValue({fieldId: FIELDS.DOCUMENT.EXC_REC});
				taxFormType = rcd.getValue({fieldId: FIELDS.DOCUMENT.TAX_FORM_TYPE});

				if (FIELDS.DOCUMENT.DOC_TYPE.VALUES.indexOf(docType) > -1) {
					console.log(funcName, 'Doc Type chosen = Tax Form');
					if (Boolean(exRecId) && !Boolean(taxFormType)) {
						taxFormCollected = docLibClient.getExRecTaxForm(exRecId);
						rcd.setValue({fieldId: FIELDS.DOCUMENT.TAX_FORM_TYPE, value: taxFormCollected});
					}
				}
			}

			/*
			 * If the Linked Exchange Record field is set or updated and the Doc Type field is set to Tax Form and Tax Form Type is blank, then we need to source
			 * in the value of the Tax Form Collected field on the Linked Exchange Record
			 */
			if (context.fieldId === FIELDS.DOCUMENT.EXC_REC) {
				docType = rcd.getValue(FIELDS.DOCUMENT.DOC_TYPE.ID);
				if (FIELDS.DOCUMENT.DOC_TYPE.VALUES.indexOf(docType) > -1) {
					exRecId = rcd.getValue({fieldId: FIELDS.DOCUMENT.EXC_REC});
					taxFormType = rcd.getValue({fieldId: FIELDS.DOCUMENT.TAX_FORM_TYPE});
					if (Boolean(exRecId) && !Boolean(taxFormType)) {
						taxFormCollected = docLibClient.getExRecTaxForm(exRecId);
						rcd.setValue({fieldId: FIELDS.DOCUMENT.TAX_FORM_TYPE, value: taxFormCollected});
					}
				}
			}
			// ATP-1461 Validate JSON field a bit
			if (context.fieldId === FIELDS.DOCUMENT.ECHOSIGN_JSON) {
				var JSONObj = context.currentRecord.getValue("custrecord_echosign_json").toString().toLowerCase();
				var isJSONValidResult = docLibClient.isJSONValid(JSONObj);
				if (!isJSONValidResult.success) {
					dialog.alert({
						title: 'Invalid EchoSign JSON value',
						message: isJSONValidResult.message
					}).then().catch();
				
				}
			}
		}


		function saveRecord(context) {
			var funcName = scriptName + '==>' + 'saveRecord';
			console.log(funcName,'Entered');
			rcd = context.currentRecord;
			var JSONObj = context.currentRecord.getValue("custrecord_echosign_json").toString().toLowerCase();

			var isJSONValidResult = docLibClient.isJSONValid(JSONObj);
			if (!isJSONValidResult.success) {
				dialog.alert({
					title: 'Invalid EchoSign JSON value',
					message: isJSONValidResult.message
				}).then().catch();
				return false;
			}


			/*
			 * If the Tax Form Type value on the Document Record does not match the Tax Form Collected value on the Linked Exchange Record
			 * we will display a Confirm Box for the user to either accept/save the changes or go back and update.
			 */
			if (!finalResultSet) { /* If the user has not previously provided an answer in the Confirm Box */

				var exRecId = rcd.getValue({fieldId: FIELDS.DOCUMENT.EXC_REC});
				var docType = rcd.getValue(FIELDS.DOCUMENT.DOC_TYPE.ID);
				if (Boolean(exRecId && FIELDS.DOCUMENT.DOC_TYPE.VALUES.indexOf(docType) > -1)) {

					var taxFormCollected = docLibClient.getExRecTaxForm(exRecId);
					var taxType = rcd.getValue({fieldId: FIELDS.DOCUMENT.TAX_FORM_TYPE});

					if (Boolean(taxType)) {

						if (taxFormCollected !== taxType) {

							var message = {
								title: 'Tax Form Does Not Match',
								message: 'The Tax Form selected on the Document Record does not match the Tax Form Collected selected on the Linked Exchange Record.'
							};

							dialog.confirm(message).then(success).catch(failure);
						} else {

							return true;
						}
					}
					else {
						return true;
					}
				} else {
					return true;
				}
			} else {

				// Set the finalResultSet back to false in case user selected 'Cancel' in the Confirm Box
				finalResultSet = false;

				// Will give control back to the user or continue without saving the record
				return finalResult;
			}


			// Helper function called when user makes selection on dialog box
			function success(result) {

				// Pass the result to the global finalResult variable
				finalResult = result;

				// Set flag indicating user has made their choice
				finalResultSet = true;

				// Simulate user clicking submit button, this will call the save action again
				getNLMultiButtonByName('multibutton_submitter').onMainButtonClick(this);
			}

			function failure(reason) {

				return false;
			}

		}

		// END ATP-1099 =======================================================================

		//=====================================================================================================
		function triggerFieldChange(context, completedBy, completedDateTime) {
			console.log(' triggerFieldChange context: ' + JSON.stringify(context));
			triggerFieldValue = context.currentRecord.getValue({ fieldId: context.fieldId }) || null;
			console.log(' triggerFieldChange triggerFieldValue: ' + JSON.stringify(triggerFieldValue));
			if (triggerFieldValue && triggerFieldValue == true) { // User selected anything except No or null
				setTimeStamp(context, completedBy, completedDateTime);
			} else {
				clearTimeStamp(context, completedBy, completedDateTime);
			}
		}

		//=====================================================================================================
		//=====================================================================================================
		function setTimeStamp(context, setByField, dateTimeField) {
			currentUser = runtime.getCurrentUser().id;
			context.currentRecord.setValue({ fieldId:dateTimeField ,value:timeStamp    });
			context.currentRecord.setValue({ fieldId:setByField    ,value:currentUser  });
		}

		//=====================================================================================================
		//=====================================================================================================
		function clearTimeStamp(context, setByField, dateTimeField) {

			context.currentRecord.setValue({ fieldId:dateTimeField ,value:null });
			context.currentRecord.setValue({ fieldId:setByField    ,value:null });
		}

		//=====================================================================================================		
		return {
			 pageInit: pageInit
			,fieldChanged: fieldChanged
			,saveRecord: saveRecord
			
		};
	});