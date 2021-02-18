//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

/* =====  code related to the CUSTOMER record of type DEAL   */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/ui/serverWidget'
	, '/SuiteScripts/Prolecto/Shared/SRS_Constants'
	, '/SuiteScripts/Prolecto/Shared/SRS_Functions'
	, '/.bundle/132118/PRI_ServerLibrary'
	, '/.bundle/132118/PRI_ShowMessageInUI'
	, '/.bundle/132118/PRI_AS_Engine' // ATO-70
	, '/SuiteScripts/Pristine/libraries/Customer_Deal_Library.js'
	],

	function (record, search, runtime, error, format, ui, srsConstants, srsFunctions, priLibrary, priMessage, appSettings, cuDealLibrary) {

		var scriptName = "Customer_Deal_UE.js-->";
		var SRS_Deal_Form_copy_082213 = 120;
		//=======================================================================================================================================
		//=======================================================================================================================================
		function beforeLoad(context) {

			var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
			var contextType = context.type;
			log.debug("BEFORE LOAD WHATS THE CONTEXT TYPE????: ", contextType)
			var form = context.form;
			var REC = context.newRecord;
			log.debug(funcName, "form: " + REC.getValue("customform"));
			
			// ATP-1679 beforeload
			var nativeCurrenciesField = form.getField({
				id: 'custentity_acq_deal_fx_settle_currencies'
			})
			var funded_currency = form.getField({
				id: 'custentity_acq_deal_funded_currency'
			})
			if (runtime.executionContext == runtime.ContextType.CSV_IMPORT) {
			// MULTISELECT CURRENCY FIELD CAN NOT BE VALIDATED BECAUSE DATA IS MISSING FROM NEW RECORD OBJECT
			// CONFIRMED AFTER EXTENSIVE TESTING, AS OF NOW THE CODE BELOW DISABLES FIELD IF THE CONTEXT IS CSV IMPORT 
			// WHICH STILL RESULTS IN A SUCCESFUL IMPORT BUT THE FIELD IS NOT UPDATED -
				nativeCurrenciesField.updateDisplayType({
					displayType: ui.FieldDisplayType.DISABLED
				});
				
				funded_currency.updateDisplayType({
					displayType: ui.FieldDisplayType.DISABLED
				});
			}

			log.debug("field object for the native currency field: ", JSON.stringify(nativeCurrenciesField));

			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY) {
				nativeCurrenciesField.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});
				log.debug('log entry inside create?', JSON.stringify(nativeCurrenciesField));

				funded_currency.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});
				log.debug('log entry inside create?', JSON.stringify(funded_currency));
			}
			// 120 is the form used for deals SRS DEAL FORM (copy 082213) and the code below is only used for deals.
			if ((context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY)
				&& REC.getValue("customform") == SRS_Deal_Form_copy_082213 && runtime.executionContext != runtime.ContextType.CSV_IMPORT) {

				var paymentBankID = context.newRecord.getValue('custentity_acq_deal_fx_provider');
				log.debug('new payment bank ID: ', paymentBankID);

				var savedCurrencies = context.newRecord.getValue('custentity_acq_deal_fx_settle_currencies');
				log.debug('previously savedCurrencies from actual field: ', savedCurrencies);

				var saved_funded_currency = context.newRecord.getValue('custentity_acq_deal_funded_currency');
				log.debug('previously savedCurrencies from actual field: ', saved_funded_currency);

				var fxcheckbox = context.newRecord.getValue('custentity_acq_deal_fx_curr_cbox');
				log.debug('fxcurrencies allowed checkbox value: ', fxcheckbox);

				var form = context.form;

				var fx_settlement_currencies = form.addField({
					id: 'custpage_acq_deal_fx_settle_currencies',
					label: 'FX SETTLEMENT CURRENCIES',
					type: 'multiselect'
				});
				fx_settlement_currencies.isMandatory = true;
				fx_settlement_currencies.setHelpText({
					help: "Defines the subset of currencies Shareholders can use as FX Settlement currencies. NOTE: this list can include USD." });

				form.insertField({
					field: fx_settlement_currencies,
					nextfield: 'custentity_acq_deal_fx_settle_currencies'
				});

				var custom_funded_currency = form.addField({
					id: 'custpage_acq_deal_funded_currency',
					label: 'FUNDED CURRENCY',
					type: 'select'
				});
				custom_funded_currency.isMandatory = true;
				custom_funded_currency.setHelpText({
					help: "For deals where FX Settlement currencies are allowed, this field defines the Funded Currency for the Deal. The CH will use this field value as the default for the SH Settlement Currency." });

				form.insertField({
					field: custom_funded_currency,
					nextfield: 'custentity_acq_deal_funded_currency'
				});

			}
			
			if (context.type == context.UserEventType.EDIT && REC.getValue("customform") == SRS_Deal_Form_copy_082213 && runtime.executionContext != runtime.ContextType.CSV_IMPORT) {

				var paymentBankID = context.newRecord.getValue('custentity_acq_deal_fx_provider');
				log.debug('new payment bank ID: ', paymentBankID);

				var savedCurrencies = context.newRecord.getValue('custentity_acq_deal_fx_settle_currencies');
				log.debug('previously savedCurrencies from actual field: ', savedCurrencies);

				var saved_funded_currency = context.newRecord.getValue('custentity_acq_deal_funded_currency');
				log.debug('previously savedCurrencies from actual field: ', saved_funded_currency);

				var fxcheckbox = context.newRecord.getValue('custentity_acq_deal_fx_curr_cbox');
				log.debug('fxcurrencies allowed checkbox value: ', fxcheckbox);

				var form = context.form;

				var fx_settlement_currencies = form.addField({
					id: 'custpage_acq_deal_fx_settle_currencies',
					label: 'FX SETTLEMENT CURRENCIES',
					type: 'multiselect'
				});
				fx_settlement_currencies.isMandatory = true;
				fx_settlement_currencies.setHelpText({
					help: "Defines the subset of currencies Shareholders can use as FX Settlement currencies. NOTE: this list can include USD."
				});
				
				form.insertField({
					field: fx_settlement_currencies,
					nextfield: 'custentity_acq_deal_fx_settle_currencies'
				});

				if (Boolean(paymentBankID)) {

					var pb_currencies_result = cuDealLibrary.paymentBankCurrencies(paymentBankID);
					log.debug("currencyList from PaymentBankCurrencies() SEARCH: ", JSON.stringify(pb_currencies_result));

					for (var i = 0, len = pb_currencies_result.length; i < len; i++) {
						isSelected = false;
						for (var z = 0; z < savedCurrencies.length; z++) { 
							if (savedCurrencies[z] == pb_currencies_result[i].internalid)
								isSelected = true;
						}

						fx_settlement_currencies.addSelectOption({
							text: pb_currencies_result[i].name,
							value: pb_currencies_result[i].internalid,
							isSelected: isSelected
						});
					}
				}

				var custom_funded_currency = form.addField({
					id: 'custpage_acq_deal_funded_currency',
					label: 'FUNDED CURRENCY',
					type: 'select'
				});
				custom_funded_currency.isMandatory = true;
				custom_funded_currency.setHelpText({
					help: "For deals where FX Settlement currencies are allowed, this field defines the Funded Currency for the Deal. The CH will use this field value as the default for the SH Settlement Currency." });

				form.insertField({
					field: custom_funded_currency,
					nextfield: 'custentity_acq_deal_funded_currency'
				});

				context.newRecord.setValue("custpage_acq_deal_funded_currency" ,saved_funded_currency);

				if (Boolean(paymentBankID)) {

					var pb_currencies_result = cuDealLibrary.paymentBankCurrencies(paymentBankID);
					log.debug("currencyList from PaymentBankCurrencies() SEARCH: ", JSON.stringify(pb_currencies_result));
					custom_funded_currency.addSelectOption({
                        value: " ",
                        text: " "
                    });  
					for (var i = 0, len = pb_currencies_result.length; i < len; i++) {
						custom_funded_currency.addSelectOption({
							text: pb_currencies_result[i].name,
							value: pb_currencies_result[i].internalid,
						});
					}
				}

				var form = context.form;
				var custCurrenciesField = form.getField({
					id: 'custpage_acq_deal_fx_settle_currencies'
				})
				log.debug("field object for the custom currency field: ", JSON.stringify(custCurrenciesField));

			}
			// END ATP-1679 beforeload

			if (REC.getValue("category") != srsConstants.CUSTOMER_CATEGORY.DEAL) {
				return;
			}

			var objUser = runtime.getCurrentUser();
			var userRole = {
				opsManager: 'customrole1025',
				administrator: 'administrator'
			};
			var adminAccess = (objUser.roleId === userRole.administrator && runtime.envType == runtime.EnvType.SANDBOX);

			// ATO-81 (This logic makes the Deal Products field editable for administrators in the sandbox for ease of testing)
			if (context.type == context.UserEventType.EDIT) {
				if (runtime.executionContext == 'USERINTERFACE') {
					if (adminAccess) {
						var objField = context.form.getField({
							id: "custentity_customer_deal_products"
						});
						objField.updateDisplayType({
							displayType: ui.FieldDisplayType.NORMAL
						});
					}
				} // if ( runtime.executionContext == 'USERINTERFACE' )

			} // if (context.type == context.UserEventType.EDIT)
			// END ATO-81

		} // beforeLoad


		//=======================================================================================================================================
		function beforeSubmit(context) {

			var REC = context.newRecord;
			var oldREC = context.oldRecord;
			var DealID = context.newRecord.id;

			if (context.type == context.UserEventType.EDIT && REC.getValue("customform") == SRS_Deal_Form_copy_082213) { 
				var newRecSettlementCurrencies = REC.getValue('custentity_acq_deal_fx_settle_currencies');
				var oldRecSettlementCurrencies = oldREC.getValue('custentity_acq_deal_fx_settle_currencies');
				log.debug("beforeSubmit:dealID:", + DealID);
				log.debug("beforeSubmit:newrec:", "custentity_acq_deal_fx_settle_currencies = " + REC.getValue('custentity_acq_deal_fx_settle_currencies'));
				log.debug("beforeSubmit:oldrec:", "custentity_acq_deal_fx_settle_currencies = " + oldREC.getValue('custentity_acq_deal_fx_settle_currencies'));
				var searchResult = 0;
				var removedCurrencies = cuDealLibrary.haveCurrenciesBeenRemoved(newRecSettlementCurrencies, oldRecSettlementCurrencies);
				log.debug("beforeSubmit:arraydiff:removedCurrencies:", JSON.stringify(removedCurrencies));

				if (removedCurrencies) {
					var searchResult = cuDealLibrary.removedCurrenciesExRecCheck(DealID, removedCurrencies);
				}

				if (searchResult > 0) {
					throw "Unable to remove currency(s): There is at least one Exchange Record using one of these currency(s)"
				}
			}
			
			var fx_currencies_allowed = REC.getValue('custentity_acq_deal_fx_curr_cbox');
			var fx_level = REC.getValue('custentity_acq_deal_fx_level');
			var fx_provider = REC.getValue('custentity_acq_deal_fx_provider');
			var saved_funded_currency = REC.getValue('custentity_acq_deal_funded_currency');


			if (runtime.executionContext != runtime.ContextType.CSV_IMPORT && REC.getValue("customform") == SRS_Deal_Form_copy_082213) { 
				if (fx_currencies_allowed && !fx_level) {
					throw "FX Level is a mandatory field, please go back and provide a value."
				}
				if (fx_currencies_allowed && !fx_provider) {
					throw "FX Provider is a mandatory field, please go back and provide a value."
				}
				if (fx_currencies_allowed && !saved_funded_currency) {
					throw "Funded Currency is a mandatory field, please go back and provide a value."
				}
			}

			var currenciesbeingsaved = context.newRecord.getValue("custentity_acq_deal_fx_settle_currencies");
			log.debug("after submit values of actual currency field: ", currenciesbeingsaved);
			
			var donotimportfields = " FX SETTLEMENT CURRENCIES ALLOWED, FX LEVEL, FX PROVIDER, FX SETTLEMENT CURRENCIES."

			if (runtime.executionContext == runtime.ContextType.CSV_IMPORT && REC.getValue("customform") == SRS_Deal_Form_copy_082213
				&& context.type == context.UserEventType.CREATE) {
				if (context.newRecord.getValue("custentity_acq_deal_fx_curr_cbox")) {
					throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
				}
				if (context.newRecord.getValue("custentity_acq_deal_fx_curr_cbox")){
					throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
				}
				if (context.newRecord.getValue("custentity_acq_deal_fx_level")) {
					throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
				}
				if (context.newRecord.getValue("custentity_acq_deal_fx_provider")) {
					throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
				}
			}
			
			if (runtime.executionContext == runtime.ContextType.CSV_IMPORT && REC.getValue("customform") == SRS_Deal_Form_copy_082213
				&& (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT)) {

				if (context.oldRecord.getValue("custentity_acq_deal_fx_curr_cbox") !== context.newRecord.getValue("custentity_acq_deal_fx_curr_cbox")) {
					throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
				} 

				if (context.oldRecord.getValue("custentity_acq_deal_fx_level") !== context.newRecord.getValue("custentity_acq_deal_fx_level")) {
					throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
				}

				if (context.oldRecord.getValue("custentity_acq_deal_fx_provider") !== context.newRecord.getValue("custentity_acq_deal_fx_provider")) {
					throw "CSV Importing of the following fields is not permitted." + donotimportfields + " Please remove them from the import and retry.";
				}
			}
		}

		//=======================================================================================================================================
		function afterSubmit(context) {

			var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

			var REC = context.newRecord;

			//------------------------------------------------------------------------------------------------
			//------------------------------------------------------------------------------------------------
			// DEAL Processing, if not a deal record then exit this function now
			if (REC.getValue("category") != srsConstants.CUSTOMER_CATEGORY.DEAL) {
				return;
			}

			// ATO-81 (This code updates the Deal Products multi-select to match with the Checkboxes that are checked )
			var searchDealProductsResults;

			try {
				var arrColumns = new Array();
				var objColumns = {};
				objColumns.col_id = search.createColumn({
					name: 'internalid'
				});
				objColumns.col_name = search.createColumn({
					name: 'name'
				});
				objColumns.col_fieldId = search.createColumn({
					name: 'custrecord_dp_deal_checkbox_id'
				});
				objColumns.col_documentList = search.createColumn({
					name: 'custrecord_dp_default_documents'
				});
				arrColumns.push(objColumns.col_id);
				arrColumns.push(objColumns.col_name);
				arrColumns.push(objColumns.col_fieldId);
				arrColumns.push(objColumns.col_documentList);
				var arrFilters = [
					['isinactive', 'IS', false]
				];
				var searchDealProductsObj = search.create({
					'type': 'customrecord_deal_product',
					'filters': arrFilters,
					'columns': arrColumns
				});
				var searchDealProducts = searchDealProductsObj.run();
				searchDealProductsResults = searchDealProducts.getRange(0, 1000);
			} catch (e) {
				log.error(funcName, "searchDealProducts error: " + e);
			}

			try {
				var oldFieldValue = REC.getValue('custentity_customer_deal_products');
				var newFieldValue = [];

				for each(result in searchDealProductsResults) {
					var fieldId = result.getValue(objColumns.col_fieldId);
					var checkboxIsChecked = REC.getValue(fieldId);
					if (checkboxIsChecked) {
						var internalId = result.getValue(objColumns.col_id);
						newFieldValue.push(internalId.toString());
					}
				} // for each (result in searchDealProductsResults)

				var fieldIsChanged = false;
				if (newFieldValue.length == oldFieldValue.length) {
					newFieldValue.sort();
					oldFieldValue.sort();
					for (var ix = 0; ix < newFieldValue.length; ix++) {
						if (newFieldValue[ix] != oldFieldValue[ix]) {
							fieldIsChanged = true;
						}
					}
				} else {
					fieldIsChanged = true;
				}

				if (fieldIsChanged) {
					var updateRec = record.load({
						type: "customer",
						id: REC.id
					});
					updateRec.setValue({
						fieldId: 'custentity_customer_deal_products',
						value: newFieldValue
					});
					updateRec.save();
				} // if (fieldIsChanged)
			} catch (e) {
				log.error(funcName, "custentity_customer_deal_products update error: " + e);
			}
			// END ATO-81 

			// ATO-70
			log.debug(funcName, "afterSubmit ========================================================================");
			log.debug(funcName, "afterSubmit ========================================================================");
			try {
				defaultDocumentProcessing(context, searchDealProductsResults, objColumns);
			} catch (e) {
				log.error(funcName, "defaultDocumentProcessing error: " + e);
				log.error(funcName, "trace: " + e.stack);
			}
			// END ATO-70



		} // afterSubmit


		// ATO-70
		//=======================================================================================================================================
		//=======================================================================================================================================
		function defaultDocumentProcessing(context, searchDealProductsResults, objColumns) {
			var funcName = scriptName + "defaultDocumentProcessing " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

			var newREC = record.load({
				type: "customer",
				id: context.newRecord.id,
				isDynamic: false
			});
			var oldREC = context.oldRecord;


			// Note on how this works:
			//
			// It is important to understand that a given document may be associated with more than one product.
			// First this means we only want to add a document once even though it may apply to more that one selected product.
			// Secondly, just because the user removes a product, that does not mean the document should be deleted since it
			// is possible that the same document is associated with another product that is still selected.
			//
			// Also, the Default Document processing will not execute every time a record is updated. Since the presence
			// of a document is based on the selection of a product associated with that document, this processing will 
			// only occur when a product has been selected or de-selected.
			//
			// The approach taken therefore, is to create two lists of documents, one list generated from the old record 
			// and one generated from the new record. The logic will insure that a document appears in each list only once.
			//
			// Then these two lists of documents can be compared to see which documents need to be added and which ones need
			// to be deleted
			//
			// There is also a search of all documents for this record with their "Default Document link" assigned.
			// These search results are used to make sure a document that is already there is not added again, 
			// and to supply the internal id and other fields needed to evaluate a document that is slated for deletion.
			// A document can only be deleted when it is still in its initial status and still points to the 
			// placeholder file.





			//---------------------------------------------------------------------------------------------------------------
			// STEP 1: figure out if there have been any products changed, if not exit
			var workProductsList = [];
			var productCheckboxHasChanged = false;
			var documentList = [];

			for each(resultRow in searchDealProductsResults) {
				var fieldId = resultRow.getValue(objColumns.col_fieldId);
				documentList = [];
				var commaSeparatedString = resultRow.getValue(objColumns.col_documentList);
				if (commaSeparatedString > "") {
					documentList = commaSeparatedString.split(',');
				}

				var checkboxIsCheckedNew = newREC.getValue(fieldId);
				var checkboxIsCheckedOld = false; // on a create there will be no old record
				if (context.oldRecord) {
					checkboxIsCheckedOld = oldREC.getValue(fieldId);
				}
				var productAction = "";
				if (checkboxIsCheckedNew != checkboxIsCheckedOld) {
					productCheckboxHasChanged = true;
					if (checkboxIsCheckedNew) {
						productAction = "A";
					} else {
						productAction = "D";
					}
				}
				var objProductStatus = {
					dealProductId: resultRow.getValue(objColumns.col_id),
					fieldId: fieldId,
					checkedNew: checkboxIsCheckedNew,
					checkedOld: checkboxIsCheckedOld,
					productAction: productAction,
					documentList: documentList
				};
				workProductsList.push(objProductStatus);
			} // for each (resultRow in searchDealProductsResults)

			log.debug(funcName, "workProductsList: " + JSON.stringify(workProductsList));

			// If no Products have changed there is no need to do any document processing
			if (!productCheckboxHasChanged) {
				log.debug(funcName, "NO productCheckboxHasChanged");
				return;
			}




			//---------------------------------------------------------------------------------------------------------------
			//STEP 2: Check to see if the list of documents has changed
			// We look at each Deal Product record which has a list of default documents that apply to that product
			// Since more than one product may involve the same document we will make the list without duplicates
			// We will have 2 lists, one based on the new record and one based on the old record
			var newDocumentsList = [];
			var oldDocumentsList = [];
			var found;
			for each(objProductStatus in workProductsList) {
				if (objProductStatus.checkedNew) {
					for each(documentId in objProductStatus.documentList) {
						found = false;
						for each(entry in newDocumentsList) {
							if (entry == documentId) {
								found = true;
							}
						}
						if (!found) {
							newDocumentsList.push(documentId);
						}
					}
				} // if (objProductStatus.checkedNew)

				if (objProductStatus.checkedOld) {
					for each(documentId in objProductStatus.documentList) {
						found = false;
						for each(entry in oldDocumentsList) {
							if (entry == documentId) {
								found = true;
							}
						}
						if (!found) {
							oldDocumentsList.push(documentId);
						}
					}
				} // if (objProductStatus.checkedOld)

			} // for each (objProductStatus in workProductsList)

			newDocumentsList.sort();
			oldDocumentsList.sort();

			log.debug(funcName, "newDocumentsList: " + JSON.stringify(newDocumentsList));
			log.debug(funcName, "oldDocumentsList: " + JSON.stringify(oldDocumentsList));

			// if, even though they checked or unchecked a product, nothing has changed with regard to documents, exit
			if (arraysAreEqual(newDocumentsList, oldDocumentsList)) {
				log.debug(funcName, "nothing has changed with regard to documents");
				return;
			}




			//-----------------------------------------------------------------------------------------------------------------------
			//STEP 3: look up all document records that apply to this record and have a value in the Default Document link field
			try {
				var arrColumns = new Array();
				var col_id = search.createColumn({
					name: 'internalid'
				});
				var col_name = search.createColumn({
					name: 'altname'
				});
				var col_defaultDoc = search.createColumn({
					name: 'custrecord_doc_default_document_rcd'
				});
				var col_file = search.createColumn({
					name: 'custrecord_file'
				});
				var col_status = search.createColumn({
					name: 'custrecord_dm_status'
				});
				arrColumns.push(col_id);
				arrColumns.push(col_name);
				arrColumns.push(col_defaultDoc);
				arrColumns.push(col_file);
				arrColumns.push(col_status);
				var arrFilters = [
					['isinactive', 'IS', false], 'AND', ['custrecord_escrow_customer', 'ANYOF', context.newRecord.id]
				];
				var searchDocumentsObj = search.create({
					'type': 'customrecord_document_management',
					'filters': arrFilters,
					'columns': arrColumns
				});
				var searchDocuments = searchDocumentsObj.run();
				searchDocumentsResults = searchDocuments.getRange(0, 1000);
			} catch (e) {
				log.error(funcName, "searchDocuments error: " + e);
			}




			//---------------------------------------------------------------------------------------------------------------
			//STEP 4: Get all of the possible Default Document records for this record type
			try {
				var placeholderDotTextFileId = appSettings.readAppSetting("Documents", "Placeholder.txt File Id");
				var arrColumnsDF = new Array();
				var col_DF_id = search.createColumn({
					name: 'internalid'
				});
				var col_DF_name = search.createColumn({
					name: 'name'
				});
				var col_DF_defaultDocType = search.createColumn({
					name: 'custrecord_default_doc_type'
				});
				arrColumnsDF.push(col_DF_id);
				arrColumnsDF.push(col_DF_name);
				arrColumnsDF.push(col_DF_defaultDocType);
				var eventRecordName_Customer = 6;
				var arrFiltersDF = [
					['isinactive', 'IS', false], 'AND', ['custrecord_def_record_name', 'ANYOF', eventRecordName_Customer], 'AND', ['custrecord_def_record_field_id', 'IS', "category"], 'AND', ['custrecord_def_record_field_value', 'IS', srsConstants.CUSTOMER_CATEGORY.DEAL]
				];
				var searchDefaultDocumentsObj = search.create({
					'type': 'customrecord_default_doc_list',
					'filters': arrFiltersDF,
					'columns': arrColumnsDF
				});
				var searchDefaultDocuments = searchDefaultDocumentsObj.run();
				searchDefaultDocumentsResults = searchDefaultDocuments.getRange(0, 1000);
			} catch (e) {
				log.error(funcName, "searchDefaultDocuments error: " + e);
			}

			//---------------------------------------------------------------------------------------------------------------
			//STEP 5: Make a list of documents to be added
			var arrDocumentsToAdd = [];

			for each(newDoc in newDocumentsList) {
				var addThisDocument = true;
				for each(resultRow in searchDocumentsResults) {
					var defaultDocumentLink = resultRow.getValue(col_defaultDoc);
					if (newDoc == defaultDocumentLink) {
						addThisDocument = false;
					}
				} // for each (resultRow in searchDocumentsResults)

				if (addThisDocument) {
					arrDocumentsToAdd.push(newDoc);
				}

			} // for each (newDoc in newDocumentsList)

			log.debug(funcName, "arrDocumentsToAdd: " + JSON.stringify(arrDocumentsToAdd));




			//---------------------------------------------------------------------------------------------------------------
			//STEP 6: Let's create the new documents we've identified
			var placeholderDotTextFileId = appSettings.readAppSetting("Documents", "Placeholder.txt File Id");
			var documentStatus_NOT_RECIEVED = 1;
			var thisScript = runtime.getCurrentScript();
			for each(doc in arrDocumentsToAdd) {
				try {
					var defaultValues;
					var newDocument = record.create({
						type: "customrecord_document_management",
						isDynamic: false,
						defaultValues: defaultValues
					});

					var defaultDocumentFound = false;
					for each(defaultDocResult in searchDefaultDocumentsResults) {
						if (doc == defaultDocResult.getValue(col_DF_id)) {
							defaultDocumentFound = true;
							newDocument.setValue({
								fieldId: "custrecord_escrow_customer",
								value: context.newRecord.id
							});
							newDocument.setValue({
								fieldId: "altname",
								value: defaultDocResult.getValue(col_DF_name)
							});
							newDocument.setValue({
								fieldId: "custrecord_doc_type",
								value: defaultDocResult.getValue(col_DF_defaultDocType)
							});
							newDocument.setValue({
								fieldId: "custrecord_dm_status",
								value: documentStatus_NOT_RECIEVED
							});
							newDocument.setValue({
								fieldId: "custrecord_file",
								value: placeholderDotTextFileId
							});
							newDocument.setValue({
								fieldId: "custrecord_doc_default_document_rcd",
								value: defaultDocResult.getValue(col_DF_id)
							});
							newDocument.setText({
								fieldId: "custrecord_doc_created_by_script",
								value: thisScript.id
							});
							break;
						}
					} // for each (defaultDocResult in searchDefaultDocumentsResults)
					if (defaultDocumentFound) {
						newDocument.save();
					}

				} catch (eCreate) {
					log.error(funcName, "Document creation error: " + eCreate.message);
				}

			} // for each (doc in arrDocumentsToAdd)




			//---------------------------------------------------------------------------------------------------------------
			//STEP 7: Let's delete any documents that are still in their initial status and no longer apply
			//        based on the products that are currently selected	

			if (searchDocumentsResults.length == 0) {
				log.debug(funcName, "existing documents search returned zero documents, no deletes needed ");
				return;
			}

			var arrDocumentsToDelete = [];

			for each(oldDoc in oldDocumentsList) {
				var deleteThisDocument = true;
				for each(newDoc in newDocumentsList) {
					if (newDoc == oldDoc) {
						deleteThisDocument = false;
					}
				} // for each (newDoc in newDocumentsList)

				if (deleteThisDocument) {
					arrDocumentsToDelete.push(oldDoc);
				}
			} // for each (oldDoc in oldDocumentsList)

			log.debug(funcName, "arrDocumentsToDelete: " + JSON.stringify(arrDocumentsToDelete));


			for each(docToDelete in arrDocumentsToDelete) {
				var deleteId;
				for each(resultRow in searchDocumentsResults) {
					var defaultDocumentLink = resultRow.getValue(col_defaultDoc);
					if (docToDelete == defaultDocumentLink) {
						if (resultRow.getValue(col_status) == documentStatus_NOT_RECIEVED) {
							if (resultRow.getValue(col_file) == placeholderDotTextFileId) {
								deleteId = resultRow.getValue(col_id);
							}
						} // if (resultRow.getValue(col_status) == documentStatus_NOT_RECIEVED)
					} // if (docToDelete == defaultDocumentLink)
				} // for each (resultRow in searchDocumentsResults)

				if (deleteId) {
					var objDeletedDoc = record.delete({
						type: "customrecord_document_management",
						id: deleteId
					});
				}

			} // for each (docToDelete in arrDocumentsToDelete)


			log.debug(funcName, "PROCESSING COMPLETE ==============================================================");


			return;
			//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


		}
		// END ATO-70

		//=======================================================================================================================================
		//=======================================================================================================================================
		function arraysAreEqual(array1, array2) {
			if (array1.length != array2.length) {
				return false;
			}
			for (var ix = 0; ix < array1.length; ix++) {
				if (array1[ix] != array2[ix]) {
					return false;
				}
			}
			return true;
		}


		//=======================================================================================================================================
		//=======================================================================================================================================
		function documentAddProcessing(context, DealProductFields) {

			// does document already exist, if so do not add




			return;
		}


		//=======================================================================================================================================
		//=======================================================================================================================================
		function documentDeleteProcessing(context, DealProductFields) {
			return;
		}


		//=======================================================================================================================================
		//=======================================================================================================================================
		function recordExists(recType, filters) {
			return (search.create({
				type: recType,
				filters: filters
			}).run().getRange(0, 1).length > 0);
		}

		//=======================================================================================================================================
		//=======================================================================================================================================
		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		}
	});