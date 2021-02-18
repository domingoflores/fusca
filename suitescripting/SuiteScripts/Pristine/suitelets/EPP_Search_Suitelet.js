/**
 * Module Description
 * Built to be used as a User Interface to allow users to create an EPP file to be used by SunTrust's EPP
 * platform to pay shareholders.  This Suitelet presents a User Interface for a payments anaylyst to create
 * a CSV based off of a saved search in the system, but this suitelet allows the user to select filters to be used 
 * in creating a SPECIFIC EPP file.
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Apr 2017     Scott Streule	   First Draft
 * 1.10       17 Jul 2018     Scott Streule	   Added logic to determine the Pay File Type and based on that, added if statements 
 * 											   for the searches to be run and for the specific filenames to be used ATP-265
 *
 */

// SEE MAINTENANCE GUIDE AT BOTTOM FOR HELP

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', "N/ui/message", 'N/runtime', 'N/search', 'N/file', 'N/format', 'N/record', 'N/redirect', 'N/error', 'N/url', 'N/task'
	   ,'/SuiteScripts/Pristine/libraries/removeDiacritics'
   	   ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
   	   ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
   	   ,'/.bundle/132118/PRI_AS_Engine'
   	   , "/SuiteScripts/Prolecto/Shared/SRS_Constants"
   	   ,'/SuiteScripts/Pristine/libraries/oAuth/TBA.js'
	   ], 
function(serverWidget, message, runtime, search, file, format, record, redirect, error, url, task
		,removeDiacritics ,tools
		, srsConstants
		, appSettings
		, srsConstants
		, TBA
) {
	   
	var scriptName = "EPP_Search_Suitelet.js";
	
	function onRequest(context) {
		   
		var funcName = scriptName + "--->onRequest";
		
		var objPermissionList = {"appName":"PaymentsProcessing" ,"settingName":"accessPermission"};
		var hasAccess = tools.checkPermission(objPermissionList);
		if (!hasAccess) { 	throw 'PERMISSION_DENIED: You do not have permissions to access Payment File Creation. Please contact your NetSuite administration if you believe this is in error.'; }		
		
	// IMPORTANT COLUMNS <- must be a better way to do this, but here we are.
		
		var html = "";
		
		var payFileCreationRecord = record.load({
		 	type: 'customrecord_payment_file',
		 	id: context.request.parameters.custscript_payfilecreation||context.request.parameters.myrecordidfield
		 });
		
		var form = serverWidget.createForm({ title: 'File Creation Record: ' + payFileCreationRecord.getValue("name") });
		
		form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/PaymentFileCreation_SL_CL.js';
		
		
	// CREATE FIELD GROUPS
		var filterActionsGroup     = form.addFieldGroup({ id:'filteractionsgroup'     ,label:'Filtering Actions'		});
		var completionActionsGroup = form.addFieldGroup({ id:'completionactionsgroup' ,label: 'Completion Actions'		});
		var filterGroup            = form.addFieldGroup({ id:'filtergroupid'          ,label: 'Filters'		            });
		var countGroup             = form.addFieldGroup({ id:'countgroupid'           ,label: 'Count'		            });
		var amountGroup            = form.addFieldGroup({ id:'amountgroupid'          ,label: 'Amount'		            });
		var otherGroup            = form.addFieldGroup({ id:'othergroupid'          ,label: 'Other'		            });
		
		
		
	// END FIELD GROUPS

      
			var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
			log.audit("RemainingUsage" ,"if (context.request.method === 'GET') " + RemainingUsage);
			
      
	// CREATE SUBMIT ACTION RADIO BUTTONS
		// These fields control what the Submit button does, until such time as we understand how to use regular buttons
		// and clients scripts to perform these actions.
		var filtersRadioButton = form.addField({
			id: 'actiononsubmit',
			source: 'filtersradio',
			type: serverWidget.FieldType.RADIO,
			label: 'Apply Filters',
			container: 'filteractionsgroup'		}).updateLayoutType({ layoutType:serverWidget.FieldLayoutType.MIDROW });
		var excludeRadioButton = form.addField({
			id: 'actiononsubmit',
			source: 'excluderadio',
			type: serverWidget.FieldType.RADIO,
			label: 'Undo Exclusions',
			container: 'filteractionsgroup'		}).updateLayoutType({ layoutType:serverWidget.FieldLayoutType.MIDROW });
		var resetRadioButton = form.addField({
			id: 'actiononsubmit',
			source: 'resetradio',
			type: serverWidget.FieldType.RADIO,
			label: 'Reset Search',
			container: 'filteractionsgroup'		}).updateLayoutType({ layoutType: serverWidget.FieldLayoutType.MIDROW });
		var generateFileRadioButton = form.addField({
			id: 'actiononsubmit',
			source: 'genradio',
			type: serverWidget.FieldType.RADIO,
			label: 'Generate File',
			container: 'completionactionsgroup'	}).updateLayoutType({ layoutType: serverWidget.FieldLayoutType.MIDROW });
		var cancelRadioButton = form.addField({
			id: 'actiononsubmit',
			source: 'cancelradio',
			type: serverWidget.FieldType.RADIO,
			label: 'Cancel',
			container: 'completionactionsgroup'	}).updateLayoutType({ layoutType: serverWidget.FieldLayoutType.MIDROW });
		filtersRadioButton.defaultValue = 'filtersradio';
	// END SUBMIT ACTION RADIO BUTTONS

	// CREATE FILTERS
		// Creating multiselect fields that the user will use to add filters to the data.
		// populateFilter() populates the filter ONLY with the values that appear in the search
		var selectFieldDeal = form.addField({ // filter based on Deal Link
			id: 'deal',
			type: serverWidget.FieldType.MULTISELECT,
			label: 'Deal',
			container: 'filtergroupid'
		});

		var selectFieldPayMethod = form.addField({ // filter based on Payment Method
			id: 'transactiontype',
			type: serverWidget.FieldType.MULTISELECT,
			label: 'Transaction Type',
			container: 'filtergroupid'
		});

		filterGroup.isSingleColumn = true;
	// END FILTERS

	//CREATE HIDDEN FIELDS TO STORE PAYMENT FILE CREATION RECORD ID & PAYMENT FILE TYPE		
	//This will be used in the POST to write all summary information and to redirect back to the correct payment file creation record		
		var recordIDField = form.addField({		
				id: 'myrecordidfield',		
				type: serverWidget.FieldType.TEXT,		
				label: 'Payment File Creation ID'		
		});		
		recordIDField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN	});
		
	//This will be used in the POST to determine which search to use to create the CSV and JSON files to be used in the EPP process (ATP-265)
		var payTypeField = form.addField({		
				id: 'mypaytypefield',		
				type: serverWidget.FieldType.TEXT,		
				label: 'Payment File Type'		
		});		
		payTypeField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
	// END CREATE PMT FILE CREATION RECORD FIELD

	// CREATE SUBLISTS
		var sublist = form.addSublist({ // sublist holds the filtered data and is displayed on the suitelet
			id: 'sublist',
			type: serverWidget.SublistType.LIST,
			label: 'Transaction Selection'
		});
		sublist.addMarkAllButtons();

		var unfilteredCopy = form.addSublist({ // unfilteredCopy holds the unfiltered search results
			id: 'unfilteredcopy',
			type: serverWidget.SublistType.LIST,
			label: 'Unfiltered Copy'			
		});
		unfilteredCopy.displayType = serverWidget.SublistDisplayType.HIDDEN;

		var headerList = form.addSublist({ // headerList holds the column headers used by the search
			id: 'headerlist',
			type: serverWidget.SublistType.LIST,
			label: 'Unfiltered Copy'
		});
		headerList.displayType = serverWidget.SublistDisplayType.HIDDEN;
		headerList.addField({
			id: 'headercolumn',
			type: serverWidget.FieldType.TEXT,
			label: 'Header Column'
		});

		var exclusionList = form.addSublist({	// exclusionList holds all the exclusions the user has checked in the suitelet
			id: 'exclusions',
			type: serverWidget.SublistType.LIST,
			label: 'Exclusions'
		});
		var excludeListID = exclusionList.addField({
			id: 'column0',
			type: serverWidget.FieldType.TEXT,
			label: 'Internal ID'
		});
		exclusionList.displayType = serverWidget.SublistDisplayType.HIDDEN;
	// END CREATE SUBLISTS

	// CREATE SUMMARY INFORMATION
		// These fields show summary information about the contents of the sublist.
		var countField = form.addField({ // will hold the count of records
			id: 'count',
			type: serverWidget.FieldType.INTEGER,
			label: 'Total',
			container: 'countgroupid'
		});
		countField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var amountField = form.addField({ // will hold the total amount of all the Payment Amount fields
			id: 'amount',
			type: serverWidget.FieldType.TEXT,
			label: 'Total Payments',
			container: 'amountgroupid'
		});
		
		
		amountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var achCountField = form.addField({ // will hold the count of records
			id: 'achcount',
			type: serverWidget.FieldType.INTEGER,
			label: 'ACH',
			container: 'countgroupid'
		});
		achCountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var achAmountField = form.addField({ // will hold the total amount of all the Payment Amount fields
			id: 'achamount',
			type: serverWidget.FieldType.TEXT,
			label: 'ACH Payments',
			container: 'amountgroupid'
		});
		achAmountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var swtCountField = form.addField({ // will hold the count of records
			id: 'swtcount',
			type: serverWidget.FieldType.INTEGER,
			label: 'SWT',
			container: 'countgroupid'
		});
		swtCountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var swtAmountField = form.addField({ // will hold the total amount of all the Payment Amount fields
			id: 'swtamount',
			type: serverWidget.FieldType.TEXT,
			label: 'SWT Payments',
			container: 'amountgroupid'
		});
		swtAmountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var fedCountField = form.addField({ // will hold the count of records
			id: 'fedcount',
			type: serverWidget.FieldType.INTEGER,
			label: 'FED',
			container: 'countgroupid'
		});
		fedCountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var fedAmountField = form.addField({ // will hold the total amount of all the Payment Amount fields
			id: 'fedamount',
			type: serverWidget.FieldType.TEXT,
			label: 'FED Payments',
			container: 'amountgroupid'
		});
		fedAmountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var chkCountField = form.addField({ // will hold the count of records with pmt type CHK
			id: 'chkcount',
			type: serverWidget.FieldType.INTEGER,
			label: 'CHK',
			container: 'countgroupid'
		});
		chkCountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var chkAmountField = form.addField({ // will hold the amount of payments with pmt type CHK
			id: 'chkamount',
			type: serverWidget.FieldType.TEXT,
			label: 'CHK Payments',
			container: 'amountgroupid'
		});
		chkAmountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });

		var dealCountField = form.addField({ // will hold the number of unique deals
			id: 'dealcount',
			type: serverWidget.FieldType.INTEGER,
			label: 'Unique Deals',
			container: 'countgroupid'
		});
		dealCountField.updateDisplayType({ displayType:serverWidget.FieldDisplayType.INLINE });
		
		var glaccountfield = form.addField(
				{
					id: "glaccount", 
					type: serverWidget.FieldType.SELECT, 
					source : "account", 
					label: "GL Account",
					container: 'othergroupid'
				}
				).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
		
		var currencyfield = form.addField(
				{
					id: "currency", 
					type: serverWidget.FieldType.SELECT, 
					source : "currency", 
					label: "Settlement Currency",
					container: 'othergroupid'
				}
				).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}); 

		
		countGroup.isSingleColumn = true;
		amountGroup.isSingleColumn = true;
		otherGroup.isSingleColumn = true;
	// END SUMMARY INFORMATION
		
		
		

		var submitButton = form.addSubmitButton({
		 	label: 'Submit'
		});

		// store the payment record ID
		recordIDField.defaultValue = context.request.parameters.custscript_payfilecreation;
		// store the payment file type in the hidden field on the form (ATP-265)
		payTypeField.defaultValue = context.request.parameters.custscript_payFileType;
		// store the payment type (ATP-265)
		var payType = context.request.parameters.custscript_payFileType;
		// Initialize variables for search ID's (ATP-265)
		var suiteletSearchID = '';
		var eppSearchID = '';
		
		
		try
		{
					
			// GET AND POST REQUESTS
			if (context.request.method === 'GET') {
	      
				
				var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
				log.audit("RemainingUsage" ,"if (context.request.method === 'GET') " + RemainingUsage)
				
				
				var objPayFileTypeFields = getPayFileTypeFields(payType);
				log.audit("objPayFileTypeFields ", JSON.stringify(objPayFileTypeFields));
	
			// GET SEARCH RESULTS
			// check the payment file type to determine which suitelet search to use (ATP-265)
	//			if (payType == 1){
	//				suiteletSearchID = 'customsearch_k2i_epp_suitelet';
	//			} else if (payType == 3){
	//				suiteletSearchID = 'customsearch_srs_epp_suitelet';
	//			} else if (payType == 4){
	//				suiteletSearchID = 'customsearch_k2i_epp_suitelet_citizens';
	//			}
				
				suiteletSearchID = objPayFileTypeFields.custrecord_pft_suitelet_pmts_search_id; // ATP-1312
				
				
				// don't want to look at *this* file's JSON file, in case user wants to edit.
				// so get the ID...
				
				
				var glAccount = payFileCreationRecord.getValue({
					fieldId: 'custrecord_pay_file_account'
				});
				
				var creProfile = payFileCreationRecord.getValue({
					fieldId: 'custrecord_pay_file_cre_profile'
				});
				
				var fileformat = payFileCreationRecord.getValue({
					fieldId: 'custrecord_pay_file_file_format'
				}); 
				
				var currency = payFileCreationRecord.getValue({
					fieldId: 'custrecord_pay_file_currency'
				});
				
	
			//throw ("objPayFileTypeFields " + JSON.stringify(objPayFileTypeFields));
			//"CUSTRECORD_PFT_FILE_FORMAT.custrecord_pff_cre_profile_required": true
			if (objPayFileTypeFields["CUSTRECORD_PFT_FILE_FORMAT.custrecord_pff_cre_profile_required"])             
			{ 
					if (!creProfile) 
					{
						throw error.create({ name:'CRE Profile Required'
				            ,message: 'CRE Profile has not been defined. Please specifiy CRE Profile under "Payment File Creation"-->"Payment File Type"-->"CRE Profile"'
				            ,notifyOff: true });
					}
	            }
				
			if (objPayFileTypeFields.custrecord_pft_currency_selection_req)
	 			{
					if (!currency) 
					{
						throw error.create({ name:'Currency Required'
				            ,message: "Currency is required for Payment File Type '" + payFileCreationRecord.getText("custrecord_pay_file_type") + "'"
				            ,notifyOff: true });

					}
	            }
				
			var mySearch = search.load({ id: suiteletSearchID }); // returns search.Search
			
			
			if (parseInt(fileformat,10) === parseInt(srsConstants["Payment File Type"]["Check"],10))
			{
//				"CUSTRECORD_PFT_PAYMENT_BANK.custrecord_pb_vendor_bank_name": [
//		           {
//		             "value": "21146",
//		             "text": "SunTrust Bank" 
//		           }
//		         ],
				
				if (
						objPayFileTypeFields 
						&& objPayFileTypeFields["CUSTRECORD_PFT_PAYMENT_BANK.custrecord_pb_vendor_bank_name"]
						&& objPayFileTypeFields["CUSTRECORD_PFT_PAYMENT_BANK.custrecord_pb_vendor_bank_name"][0]
				)
				{
					var filter = search.createFilter(
							{ name: 'custrecord_gl_account_bank_name',
							  join: 'account',
							  operator: 'ANYOF',
							  values: objPayFileTypeFields["CUSTRECORD_PFT_PAYMENT_BANK.custrecord_pb_vendor_bank_name"][0].value
							 });
					mySearch.filters.push(filter);
					//log.audit("mySearch", JSON.stringify(mySearch));
				}
				else 
				{
					throw error.create({ name:'Bank Name Required'
				            ,message: "Bank Name (Vendor) not specified on Payment File Type '" + payFileCreationRecord.getText("custrecord_pay_file_type") + "'"
				            ,notifyOff: true });
				
				
				}
			}
			
			if (
					objPayFileTypeFields 
					&& objPayFileTypeFields["custrecord_pft_department"]
					&& objPayFileTypeFields["custrecord_pft_department"][0]
					&& objPayFileTypeFields["custrecord_pft_department"][0].value
			)
			{
				
				var filter = search.createFilter(
						{ name: 'department',
						  operator: 'ANYOF',
						  values: objPayFileTypeFields["custrecord_pft_department"][0].value
						 });
				mySearch.filters.push(filter);
				//log.audit("mySearch", JSON.stringify(mySearch));
			}
			else 
			{
				throw error.create({ name:'Department not Specified'
			            ,message: "Department is required for Payment File Type '" + getAnchor("customrecord_pay_file_type", payFileCreationRecord.getValue("custrecord_pay_file_type"), payFileCreationRecord.getText("custrecord_pay_file_type")) + "'"
			            ,notifyOff: true });
			
			
			}

			if (
					objPayFileTypeFields 
					&& objPayFileTypeFields["custrecord_pft_entity"]
					&& objPayFileTypeFields["custrecord_pft_entity"][0]
					&& objPayFileTypeFields["custrecord_pft_entity"][0].value
			)
			{
				var filter = search.createFilter(
						{ name: 'class',
						  operator: 'ANYOF',
						  values: objPayFileTypeFields["custrecord_pft_entity"][0].value
						 });
				mySearch.filters.push(filter);
				//log.audit("mySearch", JSON.stringify(mySearch));
			}
			else 
			{
				throw error.create({ name:'Entity not Specified'
			            ,message: "Entity is required for Payment File Type '" + getAnchor("customrecord_pay_file_type", payFileCreationRecord.getValue("custrecord_pay_file_type"), payFileCreationRecord.getText("custrecord_pay_file_type")) + "'"
			            ,notifyOff: true });
			
			
			}
			
				if (glAccount)
				{
					var inclusionsList = [];
					inclusionsList.push(glAccount);
					
					var filter = search.createFilter({ name: 'accountmain',
	                    operator: 'ANYOF',
	                      values: inclusionsList });
						mySearch.filters.push(filter);
						glaccountfield.defaultValue = glAccount;	
				}
				else 
				{
					glaccountfield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
				}
				
				
				if (currency)
				{
					var currencyList = [];
					currencyList.push(currency);
					var filter = search.createFilter({ name: 'custrecord_exrec_shrhldr_settle_curr',
						join: 'custbody_acq_lot_createdfrom_exchrec',
	                    operator: 'ANYOF',
	                      values: currencyList });
						mySearch.filters.push(filter);
					currencyfield.defaultValue = currency;
				}
				else 
				{
					currencyfield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
				}
					
				var searchResults = mySearch.run(); //returns search.ResultSet object
	      
				var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
				log.audit("RemainingUsage" ,"after search " + RemainingUsage)
				
				var columnArray = getColumnsOnly(mySearch);
				
				var searchNbrColumns = columnArray.length;
				columnArray.unshift('Exclude', "Cust Refund"); // adding Exclude column, Customer Refund Link column
				var resultsArray = getDataOnly(searchResults ,searchNbrColumns);
				for(var i = 0; i < resultsArray.length; i++) {
					resultsArray[i].unshift('F', ""); // adding 'F' in the exclude column of each record, 
													  // adding "" in the Link column of each record 
				}
				// END GET SEARCH RESULTS
	
				// GET SEARCH RESULTS OF PREVIOUS FILES AND EXCLUDE THEM (Eliminating "Schrodinger's Refunds")
				// Although the saved search customsearch4010 filters out any Customer Refunds that have a link to a Payment
				// File on them, because of the amount of time it takes to run the scheduled script that adds these links, 
				// we could not rely on the system having completed that process before a user tries to create another file.
				// 
				// To allow users to create multiple files, whenever a file is saved from the Suitelet, it also saves a JSON
				// file with a list of the internal IDs of the Customer Refunds on that Payment File. These lines of code
				// grab those JSON files from any incomplete Payment Files and filter out any Customer Refunds the search
				// may have missed.
				var myJSONSearch = search.load({
					id: 'customsearch_pmtfilecreation_jsonfile'
				}); // returns search.Search
	
				var JSONsearchResults = myJSONSearch.run(); //returns search.ResultSet object
	      
				var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
				log.audit("RemainingUsage" ,"after search 2 " + RemainingUsage)
				
				var resultsArrayJSON = getJSONDataOnly(JSONsearchResults);
	
				
	      
				var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
				log.audit("RemainingUsage" ,"after load " + RemainingUsage)
				
				var thisJSONFileID = payFileCreationRecord.getValue({
					fieldId: 'custrecord_json_cust_refund_file'
				});
				
				
				
				
				log.audit("RemainingUsage" ,"custrecord_json_cust_refund_file (thisJSONFileID) " + thisJSONFileID);
				// and make sure its contents are not added to the list of records to exclude
				var alreadyOnFileList = getJSONFileContents(resultsArrayJSON, thisJSONFileID);
	      
				var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
				log.audit("RemainingUsage" ,"after get contents " + RemainingUsage)
				
	
				var finalResultsArray = []; // this will be our final array, search results - Customer Refunds already on file
				for(var i = 0; i < resultsArray.length; i++) {
					var excludeFlag = false;
					for(var j = 0; j < alreadyOnFileList.length; j++) {
						if(resultsArray[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX] == alreadyOnFileList[j]) {
							excludeFlag = true;
							break;
						}
					}
					if(!excludeFlag) {
						finalResultsArray.push(resultsArray[i]);
					}
				}
				// END GET SEARCH RESULTS OF PREVIOUS FILES AND EXCLUDE THEM
	
				// add headers to sublists - first the exclusion column at index 0...
				var field = sublist.addField({
					id: 'column0',
					type: serverWidget.FieldType.CHECKBOX,
					label: 'Exclude'
				});
				field = unfilteredCopy.addField({
					id: 'column0',
					type: serverWidget.FieldType.CHECKBOX,
					label: 'Exclude'
				});
				
				field = sublist.addField({
					id: 'column1',
					type: serverWidget.FieldType.TEXT,
					label: 'Cust Refund'
				});
				field = unfilteredCopy.addField({
					id: 'column1',
					type: serverWidget.FieldType.TEXT,
					label: 'Cust Refund'
				});
				
				headerList.setSublistValue({
					id: 'headercolumn',
					line: 0,
					value: 'Exclude'
				});
				headerList.setSublistValue({
					id: 'headercolumn',
					line: 1,
					value: 'Cust Refund'
				});
				
				// ...then the search columns, starting from index srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX 
				// (because we just added Exclude and Cust Refund at index 0,1)
				for (var i = srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX; i < columnArray.length; i++) 
				{
					
					field = sublist.addField({
						id: 'column' + i,
						type: serverWidget.FieldType.TEXT,
						label: columnArray[i]
					});
					if (i === srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX)
					{
						field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
						
					}
					
					field = unfilteredCopy.addField({
						id: 'column' + i,
						type: serverWidget.FieldType.TEXT,
						label: columnArray[i]
					});
					
					if (i === srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX)
					{
						field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
					}
					
					headerList.setSublistValue({
						id: 'headercolumn',
						line: i,
						value: columnArray[i]
					});
				}
	
				// BEGIN POPULATE FILTERS & set default as Unfiltered
				populateFilter(srsConstants.CUST_REFUND_SUBLIST_COLUMNS.DEAL_LINK_INDEX, selectFieldDeal, finalResultsArray);
				populateFilter(srsConstants.CUST_REFUND_SUBLIST_COLUMNS.TRANSACTION_TYPE_INDEX, selectFieldPayMethod, finalResultsArray);
				selectFieldDeal.defaultValue = checkForFilter('');
				selectFieldPayMethod.defaultValue = checkForFilter('');	
				// END POPULATE FILTERS
	
				// BEGIN POPULATE SUMMARIES
				populateSummary(countField, amountField, '', finalResultsArray);			
				populateSummary(achCountField, achAmountField, 'ACH', finalResultsArray);			
				//populateSummary(wirCountField, wirAmountField, 'WIR', finalResultsArray);  //divided into FED and SWT			
				populateSummary(swtCountField, swtAmountField, 'SWT', finalResultsArray);
				populateSummary(fedCountField, fedAmountField, 'FED', finalResultsArray);			
				populateSummary(chkCountField, chkAmountField, 'CHECK', finalResultsArray);
				dealCountField.defaultValue = selectFieldDeal.getSelectOptions().length-1;
				// END POPULATE SUMMARIES
	
				populateSublist(finalResultsArray, sublist, columnArray);
				populateSublist(finalResultsArray, unfilteredCopy, columnArray);
	          	
			//====================================================================================================================
			//====================================================================================================================
			// B E G I N      P O S T
			//====================================================================================================================
			//====================================================================================================================
			} else { // context.request.method === 'POST'
	
				
				log.debug("context.request.method === 'POST'" ,"context.request.method === 'POST'");
				
				var paymentbankid = 0;
				// parse the sublist data and storing it in an array
				var sublistLines = context.request.parameters.sublistdata.split(/\u0002/); 
				// sublistLines is array of data with wacky (possibly invisible) delimiter
				var sublistData = [];
				for(var i = 0; i < sublistLines.length; i++) {
					sublistData.push(sublistLines[i].split(/\u0001/));
					// sublistData is now array of arrays containing the data lines
				}
	
				// BEGIN RE-STORING PARAMETER INFO WE WILL NEED - headerList, unfilteredCopy, and exclusions
	
				// grab and store the payment record ID
				var paymentRecordID = context.request.parameters.myrecordidfield;
				recordIDField.defaultValue = paymentRecordID;
				
				// grab and store the payment file type (ATP-265)
				var payFileType = context.request.parameters.mypaytypefield;
				payTypeField.defaultValue = payFileType;
				
				
				var currency = context.request.parameters.currency;
				if (currency)
				{
					currencyfield.defaultValue = currency;
				}
				else 
				{
					currencyfield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
				}
				
				var glaccount = context.request.parameters.glaccount;
				if (glaccount)
				{
					glaccountfield.defaultValue = glaccount;
				}
				else 
				{
					glaccountfield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
				}
				
				var objPayFileTypeFields = getPayFileTypeFields(payFileType);
	
				// grab and store the headers list and unfiltered copy of data
				var headersParam = [];
				var headersLines = context.request.parameters.headerlistdata.split(/\u0002/);
				for(var i = 0; i < headersLines.length; i++) {
					headersParam.push(headersLines[i].split(/\u0001/));
				}
				var unfilteredCopyParam = [];
				var unfilteredCopyLines = context.request.parameters.unfilteredcopydata.split(/\u0002/);
				for(var i = 0; i < unfilteredCopyLines.length; i++) {
					unfilteredCopyParam.push(unfilteredCopyLines[i].split(/\u0001/));
				}
	
				// add headers to our lists
				unfilteredCopy.addField({
					id: 'column0',
					type: serverWidget.FieldType.CHECKBOX,
					label: 'Exclude'
				});
				sublist.addField({
					id: 'column0',
					type: serverWidget.FieldType.CHECKBOX,
					label: 'Exclude'
				});		
				
				// add headers to our lists
				unfilteredCopy.addField({
					id: 'column1',
					type: serverWidget.FieldType.TEXT,
					label: 'Cust Refund'
				});
				sublist.addField({
					id: 'column1',
					type: serverWidget.FieldType.TEXT,
					label: 'Cust Refund'
				});	
			
				var field = null;
				
				for(var i = srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX; i < headersParam.length; i++) {
					field = unfilteredCopy.addField({
						id: 'column' + i,
						type: serverWidget.FieldType.TEXT,
						label: 'column' + i
					});
					if (i === srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX)
					{
						field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
					}
					field = sublist.addField({
						id: 'column' + i,
						type: serverWidget.FieldType.TEXT,
						label: headersParam[i]
					});
					if (i === srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX)
					{
						field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
					}
				}
	
				// add data to our lists
				for(var i = 0; i < unfilteredCopyParam.length; i++) {
					for(var j = 0; j < unfilteredCopyParam[i].length; j++) 
					{
						if (unfilteredCopyParam[i][j])
						{
							unfilteredCopy.setSublistValue({
								id : 'column' + j,
								line: i,
								value: unfilteredCopyParam[i][j]
							});
						}
					}
				}
				
				for(var i = 0; i < headersParam.length; i++) {
					headerList.setSublistValue({
						id : 'headercolumn',
						line: i,
						value: headersParam[i]
					});
				}
	
				// re-store the exclusions we already have
				var exclusionsLines = context.request.parameters.exclusionsdata.split(/\u0002/);
				var exclusionsData = [];
				for(var i = 0; i < exclusionsLines.length; i++) {
					exclusionsData.push(exclusionsLines[i].split(/\u0001/));
				}
				// END RESTORING PARAMETERS
	
				// UPDATE EXCLUSIONS
				for(var i = 0; i < sublistData.length; i++) {
					if(sublistData[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX] == 'T') {
						exclusionsData.push(sublistData[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX]);
					}
				}
				// END UPDATE EXCLUSIONS
	
				
				// PARSE, UPDATE, POPULATE FILTERS
				var filterArray = []; // filterArray is an array of objects and has the following structure:
										// [ { columnIndex: (column index to look at), filterValue: (array of filter values for that column index) }, ... ]
										// set each filter's default value to indicate what was chosen
				var delimiter = /\u0005/;
				var dealFilterValue = context.request.parameters.deal.split(delimiter); // get Deal Link filter values as array
				
				filterArray.push({ // [0]
					columnIndex: srsConstants.CUST_REFUND_SUBLIST_COLUMNS.DEAL_LINK_INDEX, 
					filterValue: dealFilterValue
				});
				var pmtMethodFilterValue = context.request.parameters.transactiontype.split(delimiter);	// get Payment Method filter values	as array			
				filterArray.push({ // [1]
					columnIndex: srsConstants.CUST_REFUND_SUBLIST_COLUMNS.TRANSACTION_TYPE_INDEX, 
					filterValue: pmtMethodFilterValue
				});	
	
				selectFieldPayMethod.defaultValue = checkForFilter(context.request.parameters.transactiontype);	
				selectFieldDeal.defaultValue = checkForFilter(context.request.parameters.deal);
				// END PARSE, UPDATE, POPULATE FILTERS
	
				// BEGIN PERFORMING ACTION SELECTED
				var actionSelected = context.request.parameters.actiononsubmit;
				log.debug("actionSelected" ,actionSelected);
				switch(actionSelected) {
					case 'genradio':
						// TODO: turn this into a method, or reorder cases so this only appears once				
	
						var filteredResults = unfilteredCopyParam.slice(0);
						for(var i = 0; i < filterArray.length; i++) {
						 	filteredResults = filterResults(filterArray[i], filteredResults);
						}
	
						// UPDATE EXCLUSIONS
						for(var i = 0; i < filteredResults.length; i++) {
							if(filteredResults[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX] == 'T') {
								exclusionsData.push(filteredResults[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX]);
							}
						}
						// END UPDATE EXCLUSIONS	
	
						for(var i = 0; i < filteredResults.length; i++) {
							for(var j = 0; j < exclusionsData.length; j++) {
								if(filteredResults[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX] == exclusionsData[j]) {
									filteredResults.splice(i, 1);
								}
							}
						}
						
						eppSearchID = objPayFileTypeFields.custrecord_pft_file_gen_search_id;  // ATP-1312
						
						var mySearch = search.load({ id: eppSearchID }); // returns search.Search
	
						var inclusionsList = [];
						for(var i = 0; i < filteredResults.length; i++) 
						{			
							inclusionsList.push(filteredResults[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX]);
						}
						
						log.debug(funcName ,"inclusionsList: " + JSON.stringify(inclusionsList) );
	
						var inclusionsFilter = search.createFilter({ name:'internalid' ,operator:'ANYOF' ,values:inclusionsList });
						var mainlineFilter   = search.createFilter({ name:'mainline'   ,operator:'IS'    ,values:"T" });
						var searchFilters    = [];
						searchFilters.push(inclusionsFilter);
						searchFilters.push(mainlineFilter);
						
						mySearch.filters = searchFilters;
	
						if (objPayFileTypeFields.name == "Citizens EDI") {
							var colPaymentFileRecordId = search.createColumn({ name:'formulanumeric' ,formula:paymentRecordID ,label:"Batch Id"  });
							mySearch.columns.splice(3, 0, colPaymentFileRecordId);
						}
						
						var mySearchResultSet = mySearch.run();
						
						var columnHeaders = getColumnsOnly(mySearchResultSet);
						
	//					log.debug(funcName ,"columnHeaders.length: " + columnHeaders.length);
	//					log.debug(funcName ,"mySearchResultSet: " + JSON.stringify(mySearchResultSet) );
	//					log.debug(funcName , "columnHeaders: " +JSON.stringify(columnHeaders)  );
						var myResults = getDataOnly(mySearchResultSet ,columnHeaders.length);
						
						
						log.debug("File Generation" ,"inclusionsList.length: " + inclusionsList.length + ",   myResults.length: " + myResults.length);
						if (inclusionsList.length != myResults.length) 
						{
							throw error.create({ name:'File Generation search Error'
					            ,message: "ERROR! The list of records selected indcates that " + inclusionsList.length + " records were selected." 
							    + " However the File Generation search has returned a different number of records: " + myResults.length
					            ,notifyOff: true });
						}
	
						var payFileCreationRecordID = recordIDField.defaultValue;
						//LOAD THE PAYMENT FILE CREATION RECORD
						var payFileCreationRecord = record.load({ type:'customrecord_payment_file' ,id:payFileCreationRecordID });
						
						var fileformat = payFileCreationRecord.getValue({ fieldId: 'custrecord_pay_file_file_format' }); 
						
						var objCREResponse = null;
						
						
						var fileString = '',
							jsonString = '';
	
						var totalAmount = 0,
							totalCount = myResults.length,
							achAmount = 0,
							achCount = 0,
							swtAmount = 0,
							swtCount = 0,
							fedAmount = 0,
							fedCount = 0,
							chkAmount = 0,
							chkCount = 0,
							uniqueDealList = [];
	
	//					objPayFileTypeFields
	//					{
	//						  "name": "Capital One Nacha",
	//						  "custrecord_pft_output_file_prefix": "Cap1Nacha_",
	//						  "custrecord_pft_output_file_extension": ".txt",
	//						  "custrecord_pft_output_file_folder": "Capital One NACHA Wire Files",
	//						  "custrecord_pft_suitelet_pmts_search_id": "20623",
	//						  "custrecord_pft_file_gen_search_id": "20622",
	//						  "custrecord_pft_idx_deal": "0",
	//						  "custrecord_pft_idx_payment_type": "0",
	//						  "custrecord_pft_idx_amount": "0",
	//						  "custrecord_pft_idx_output_start": "0",
	//						  "custrecord_pft_no_header_row": false,
	//						  "custrecord_pft_idx_internal_id": "0"
	//						}
						
						
						
						//  ATP-1243 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
						if (objPayFileTypeFields.custrecord_pft_no_header_row == false) 
						{
							
							// add column headers to file string
							for (var i = objPayFileTypeFields.custrecord_pft_idx_output_start; i < columnHeaders.length; i++) { // start at i = 3 because don't include Deal or ID fields on file
								fileString += addDelimiter(surroundInQuotes(columnHeaders[i]), i, columnHeaders.length-1);
							}
							
						}
						// END ATP-1243 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	
						var objFileTranSeqList = []; // ATP-1415
						// add our results data to file string and calculate summary totals
						for(var i = 0; i < myResults.length; i++) 
						{
							objFileTranSeqList.push(myResults[i][objPayFileTypeFields.custrecord_pft_idx_internal_id]); // ATP-1415
							
							var deal = myResults[i][objPayFileTypeFields.custrecord_pft_idx_deal];
							//log.debug(funcName ,"myResults[i]: " + JSON.stringify(myResults[i]) );
							if(uniqueDealList.indexOf(deal) == -1) {
								uniqueDealList.push(deal);
							}
							
							
							var amount = parseFloat(myResults[i][objPayFileTypeFields.custrecord_pft_idx_amount]);
							totalAmount += amount;
							if (isNaN(amount))
							{
								throw error.create({ name:'File Generation Search Index Error '
						               ,message: "The File Generation search is returning an unacceptable value in the Amount column ["+objPayFileTypeFields.custrecord_pft_idx_amount+"]="+myResults[i][objPayFileTypeFields.custrecord_pft_idx_amount]+". Amount must be currency. <Br><Br> The array of values is '" + JSON.stringify(myResults[i]) + "'" 
						               ,notifyOff: true });
							}
							
							switch(myResults[i][objPayFileTypeFields.custrecord_pft_idx_payment_type]) {
								case 'ACH':
									achAmount += amount;
									achCount++;
									break;
								case 'SWT':
									swtAmount += amount;
									swtCount++;
									break;
								case 'FED':
									fedAmount += amount;
									fedCount++;
									break;
								case 'CHECK':
									chkAmount += amount;
									chkCount++;
									break;
								default:
									throw error.create({ name:'File Generation search Error'
						            ,message: "The File Generation search is returning an unacceptable value in the Payment Method column ["+objPayFileTypeFields.custrecord_pft_idx_payment_type+"]="+myResults[i][objPayFileTypeFields.custrecord_pft_idx_payment_type]+". It must be 'ACH', 'CHECK', 'FED', or 'SWT'. The array of values is '" + JSON.stringify(myResults[i]) + "'"
						            ,notifyOff: true });
							}
	
							//log.debug("myResults[i]" ,JSON.stringify(myResults[i]));
							jsonString += myResults[i][0] + ',';
							for(var j = objPayFileTypeFields.custrecord_pft_idx_output_start; j < columnHeaders.length; j++) 
							{ // start at j = 3 because don't include Deal or ID fields on file
								fileString += addDelimiter(surroundInQuotes(myResults[i][j]), j, columnHeaders.length-1);
							}
						}
						// log.debug("jsonString" ,jsonString);
						jsonString = jsonString.substring(0, jsonString.length - 1);
						// log.debug('achAmount', achAmount);
						// log.debug('achCount', achCount);
						// log.debug('swtAmount', swtAmount);
						// log.debug('swtCount', swtCount);
						// log.debug('fedAmount', fedAmount);
						// log.debug('fedCount', fedCount);
						// log.debug('chkAmount', chkAmount);
						// log.debug('chkCount', chkCount);
	
						
						//GET THE PAYMENT FILE CREATION RECORD NAME
						var recordName = payFileCreationRecord.getValue({ fieldId: 'name' });
						var record5DigitFileId = payFileCreationRecord.getValue({ fieldId:'custrecord_pay_file_5_digit_file_id' });
						var record5DigitFileIdFormatted = record5DigitFileId.slice(0,3) + '-' + record5DigitFileId.slice(3,5);
						// initialize the fileName variable  (ATP-265)
						var fileName = '';
						// check the payment file type to determine which file naming convention to use (ATP-265)
	//					if (payFileType == 1){
	//						fileName = 'AcquiomFinancialLLC_' + record5DigitFileIdFormatted; //Set the fileName to be passed into the createFile function	
	//					} else if (payFileType == 3){
	//						fileName = 'SRSLLC_' + record5DigitFileIdFormatted; //Set the fileName to be passed into the createFile function	
	//					} else if (payFileType == 4){
	//						fileName = 'CITIZENS_' + record5DigitFileIdFormatted; //Set the fileName to be passed into the createFile function	
	//					}
						
						fileName = objPayFileTypeFields.custrecord_pft_output_file_prefix + record5DigitFileIdFormatted;
						
						
						
						//CREATE THE CSV FILE AND RETURN THE FILE ID TO BE SET AS THE VALUE ON THE PAYMENT FILE CREATION RECORD
						fileString = removeDiacritics.removeSpecialCharacters(fileString);
						
						log.debug(funcName ,"bef FolderSearch     " + fileName );
						
						
					   	var arrColumns     = new Array();
					   	var col_name       = search.createColumn({ name:'name'  });
					   	var col_internalid = search.createColumn({ name:'internalid'  });
					   	arrColumns.push(col_name);
					   	arrColumns.push(col_internalid);
					   	var arrFilters     = new Array();
						var fltr1          = search.createFilter({ name:'name' ,operator:search.Operator.IS  ,values:objPayFileTypeFields.custrecord_pft_output_file_folder  });
						arrFilters.push(fltr1);
					   	var folderId;
						var objFolderSearch = search.create({    'type':'folder' ,'filters':arrFilters ,'columns':arrColumns 	       });
						var folderSearch = objFolderSearch.run();
					    var folderSearchResults = folderSearch.getRange(0,1); 
					   	if (folderSearchResults.length < 1) 
					   	{ 
					   		log.error(funcName, 'The SFTP output folder could not be found in the file cabinet: "' + objPayFileTypeFields.custrecord_pft_output_file_folder + '"'); 
					   		throw error.create({ name:'OUTPUT FOLDER NOT FOUND'
					               ,message: 'The SFTP output folder "'+ objPayFileTypeFields.custrecord_pft_output_file_folder +'" could not be found in the file cabinet.' 
					               ,notifyOff: true });
					   	}
					   	else { folderId = folderSearchResults[0].getValue("internalid"); }
						
					   	var deliveryStatus_readyapproval = 2;
					   	
						// Create the File
					   	var fileID = "";
					   	if (
					   			(payFileCreationRecord.getValue({ fieldId: 'custrecord_pay_file_cre_profile' }))
					   			&& (parseInt(fileformat,10) === parseInt(srsConstants["Payment File Type"]["Check"],10))
					   		 )
						{
					   		//for CHECK CRE Payemnts, devliery approval will be set after 
					   		//pay file is created 
					   		deliveryStatus_readyapproval = 1;
						}
//					   	else 
//					   	{
					   		//Only print file if this is NOT CRE check PDF, as it uses different process 
					   	fileID = createFile(fileString ,fileName ,objPayFileTypeFields.custrecord_pft_output_file_extension ,folderId);
//						}
						
						log.debug("JSON String" ,jsonString);
						log.debug("fileID" ,fileID);
						
						var arrayOfCustRefundIds = JSON.parse("[" + jsonString + "]");
						
						var jsonFileID = createJSONFile(jsonString ,fileName ,folderId);
						log.debug("jsonFileID" ,jsonFileID);
						
						
						log.debug("totalAmount" ,totalAmount);
						log.debug("totalCount" ,totalCount);
						log.debug("uniqueDealList.length" ,uniqueDealList.length);
						log.debug("achAmount" ,achAmount);
						log.debug("achCount" ,achCount);
						log.debug("swtAmount" ,swtAmount);
						log.debug("swtCount" ,swtCount);
						log.debug("fedAmount" ,fedAmount);
						log.debug("fedCount" ,fedCount);
						log.debug("chkAmount" ,chkAmount);
						log.debug("chkCount" ,chkCount);
						log.debug("fedCount" ,fedCount);
						
						//SET THE SUMMARY FIELDS ON THE PAYMENT FILE CREATION RECORD
						var summaryFields = {
							'custrecord_pay_file_total_amount': formatCurrency(totalAmount)
							, 'custrecord_pay_file_count_of_payments': formatInt(totalCount)
							, 'custrecord_pay_file_count_of_deals': formatInt(uniqueDealList.length)
							, 'custrecord_pay_file_total_ach': formatCurrency(achAmount)
							, 'custrecord_pay_file_count_of_ach': formatInt(achCount)
							, 'custrecord_pay_file_total_swt': formatCurrency(swtAmount)
							, 'custrecord_pay_file_count_of_swt': formatInt(swtCount)
							, 'custrecord_pay_file_total_fed': formatCurrency(fedAmount)
							, 'custrecord_pay_file_count_of_fed': formatInt(fedCount)
							, 'custrecord_pay_file_total_check': formatCurrency(chkAmount)
							, 'custrecord_pay_file_count_of_check': formatInt(chkCount)
							, 'custrecord_pay_file_total_fed': formatCurrency(fedAmount)
							, 'custrecord_pay_file_count_of_fed': formatInt(fedCount)
							, 'custrecord_pay_file_linktofile': fileID
							, 'custrecord_json_cust_refund_file': jsonFileID
							, 'custrecord_pay_file_suitelet_csv_file': fileID // ATP-1639
							, 'custrecord_pay_file_deliv_status': deliveryStatus_readyapproval // ATP-1639
							, 'custrecord_pay_file_cust_refund_list': JSON.stringify(arrayOfCustRefundIds) // ATP-1639
						};
	
						for(prop in summaryFields) {
							payFileCreationRecord.setValue({
							    fieldId: prop,
							    value: summaryFields[prop],
							    ignoreFieldChange: true
							});
						}
						
						// ATP-1415
						payFileCreationRecord.setValue({ fieldId:"custrecord_pay_file_tran_sequence_list" ,value:JSON.stringify(objFileTranSeqList) ,ignoreFieldChange:true });
	
						//SAVE THE PAYMENT FILE CREATION RECORD WITH THE SUMMARY VALUES
						payFileCreationRecordID = payFileCreationRecord.save({ enableSourcing:false ,ignoreMandatoryFields:false });
	
						
						// ATP-1639     ============================================================================================================
						var deliveryMethod_asynchronous_FTP  = 4;
						var deliveryMethod = payFileCreationRecord.getValue({ fieldId:'custrecord_pay_file_deliv_method' });
						var fileformat     = payFileCreationRecord.getValue({ fieldId:'custrecord_pay_file_file_format' }); 
						var fileFormatName = getFileFormatName(fileformat);
						if ( payFileCreationRecord.getValue({ fieldId: 'custrecord_pay_file_cre_profile' }) ) 
						{
							var creProfileid      = payFileCreationRecord.getValue({ fieldId: 'custrecord_pay_file_cre_profile' });
							var creFilenameSuffix = payFileCreationRecord.getValue({ fieldId: 'custrecord_pay_file_cre_filename_suffix' });
							var filenameSuffix    = objPayFileTypeFields.custrecord_pft_output_file_extension;
							if (creFilenameSuffix > "") { filenameSuffix = creFilenameSuffix; }
							var documentName      = objPayFileTypeFields.custrecord_pft_output_file_prefix + record5DigitFileIdFormatted + filenameSuffix;
							
							if (parseInt(fileformat,10) === parseInt(srsConstants["Payment File Type"]["Check"],10))
							{
								var request_options = {};
								var settings = JSON.parse(appSettings.readAppSetting("Payment File Creation", "PDF Check Batch Settings"))
								
								var objSignature = JSON.parse(appSettings.readAppSetting("Payment File Creation", "PDF Check Signature Bank Map"))
								var paymentbank = payFileCreationRecord.getValue("custrecord_pay_file_payment_bank");
								if (
										objSignature[runtime.accountId]
										&& objSignature[runtime.accountId][paymentbank]
										&& objSignature[runtime.accountId][paymentbank]["Signature File"]		
								)
								{
									request_options.signatureFileID = objSignature[runtime.accountId][paymentbank]["Signature File"];
								}
								else 
								{
									throw error.create({ name:'Payment File Generate Error'
							               ,message: "Signature File Internal ID not found in app setting: \"Payment File Creation\"-->\"PDF Check Signature Bank Map\" for payment bank " + payFileCreationRecord.getText("custrecord_pay_file_payment_bank")  
							               ,notifyOff: true });
									
								}
								request_options.BatchCREID = settings["PDFCheckBatchCREID_"+runtime.accountId];
								request_options.CREID = payFileCreationRecord.getValue({ fieldId: 'custrecord_pay_file_cre_profile' });
								request_options.BatchPFCmapID = settings["PDFCheckBatchRecordTypeMapID_"+runtime.accountId];
								request_options.BatchOptionsID = settings["PDFCheckBatchOptionsID_"+runtime.accountId];
								request_options.MoveOutputToFolderID = folderId;
								request_options.headerStatus = srsConstants["CRE Request Status"]["Open"];
								request_options.detailStatus = srsConstants["CRE Request Status"]["Open"];
								request_options.inclusionsList = inclusionsList;
								request_options.PFCID = payFileCreationRecordID;
								request_options.FileName = fileName;
								
								// They may have run this file earlier, if so, the previous copy is sitting in the destination folder
								// We want to get rid of it so we can move the newly created file there
								var oldCREfileId = payFileCreationRecord.getValue("custrecord_pay_file_cre_generated_file");
								if (oldCREfileId) {
									file.delete(oldCREfileId);
								}
								
								// Since the filename is the same, this CRE generated file is intended to replace the .csv output from above
								// We have to delete file from above which is being replaced by this CRE file
								var filenameFromAbove = fileName + objPayFileTypeFields.custrecord_pft_output_file_extension;
								if (documentName == filenameFromAbove) { 
									file.delete(fileID);
								}
								
								
								var rih = createRequestInputHeaderMR(request_options);
								
								
								
								var objValues = {};
								objValues["custrecord_pay_file_request_header"] = rih;
								
								record.submitFields({ type:"customrecord_payment_file" 
									,id:payFileCreationRecordID 
									,values:objValues
									,enableSourcing:false 
									,ignoreMandatoryFields:true });
								
								
							}
							else 
							{
								
								var request_options = { };
								request_options["creprofileid"]       = creProfileid;
								request_options["recordId"]           = payFileCreationRecordID;
								request_options["inclusionsList"]     = inclusionsList.toString();
								request_options["documentName"]       = documentName;
								request_options["updateControlTable"] = true; // Specific to NACHA
		
								try {
									var tba_options = {};
									tba_options.access_token = JSON.parse(appSettings.readAppSetting("General Settings", "oAuth TBA Access Token"))
									tba_options.restlet_scriptid = srsConstants.GENERAL_RESTLET_10_SCRIPTID;
									tba_options.restlet_deployid = srsConstants.GENERAL_RESTLET_10_DEPLOYID;
									
									log.audit("Before RestLet" ,"#Trxns:" + arrayOfCustRefundIds.length );
								    var start = new Date();
									objCREResponse = TBA.Call(request_options, tba_options);
								    var end = new Date();						    
								    var seconds = Math.round( (end - start) / 1000 );					    
									log.audit("After RestLet" ,"#Seconds:" + seconds );
									
									if (typeof objCREResponse === "string") { objCREResponse = JSON.parse(objCREResponse); }
									
									if (!objCREResponse.success) 
									{
										log.error(funcName ,"CRE file generation failed: " + objCREResponse.msg);
										throw error.create({ name:'Payment File Generate Error'
								               ,message: "CRE returned error when generating file: " + JSON.stringify(objCREResponse) 
								               ,notifyOff: true });
										
									}
		
									// They may have run this file earlier, if so, the previous copy is sitting in the destination folder
									// We want to get rid of it so we can move the newly created file there
									var oldCREfileId = payFileCreationRecord.getValue("custrecord_pay_file_cre_generated_file");
									if (oldCREfileId) {
										file.delete(oldCREfileId);
									}
									
									// Since the filename is the same, this CRE generated file is intended to replace the .csv output from above
									// We have to delete file from above which is being replaced by this CRE file
									var filenameFromAbove = fileName + objPayFileTypeFields.custrecord_pft_output_file_extension;
									if (documentName == filenameFromAbove) { 
										file.delete(fileID);
									}
									
									// Move CRE file to correct folder
									var creFile    = file.load({id:objCREResponse.fileid});
									creFile.folder = folderId;
									creFile.save();
									
									// Update PFC record now that CRE has run +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
									var objValues = {};
									objValues["custrecord_pay_file_cre_generated_file"] = objCREResponse.fileid;
		
									if (objPayFileTypeFields.custrecord_pft_cre_is_payment_file) {
										objValues["custrecord_pay_file_linktofile"] = objCREResponse.fileid; // Make this empty, Another process will create payment file, return it to Netsuite, and set this
									}
		
									switch(deliveryMethod.toString()) { 
									  case deliveryMethod_asynchronous_FTP.toString():
									    // For Asynchronous FTP the payment file will ultimately be separate process and copied back to the File Cabinet.
										// This means Payment File reference field will need to be empty pending the Asynchronous processing
										// Later the Payment File reference field will be updated after the Payments file has been added to the file cabinet
										// now lets get the file pointers squared away
										objValues["custrecord_pay_file_async_xmit_file"]   = objCREResponse.fileid; // The CRE File is the one that will be snt Asynchronously 
									    break;
									  default:
									    var zzz = 0;
									} // switch(deliveryMethod)
									
									switch(fileFormatName) {
									  case "ISO20022":
									    // For ISO20022 the payment file will ultimately be .xml file created in Boomi and copied back to the File Cabinet.
										// This means Payment File reference field will need to be empty pending Boomi processing
										// Later Boomi will update the Payment File reference field after it has been copied to the file cabinet
										// now lets get the file pointers squared away
										objValues["custrecord_pay_file_linktofile"]        = null;                  // Make this empty, Boomi process will return payment file to Netsuite and set this
									    break;
									  default:
									    var zzz = 0;
									}
									
									//update Payment File Creation Record
							        record.submitFields({ type:"customrecord_payment_file" ,id:payFileCreationRecordID ,values:objValues ,enableSourcing:false ,ignoreMandatoryFields:true });
		
									
								}
								catch(e) {
									log.error(funcName ,"Exception when using CRE to generate payments file. " + e)
									throw error.create({ name:'CRE Generate Error'
							               ,message: "Error encountered when using CRE to generate payments file."
							               ,notifyOff: true });
							    }
							}
							
						} 
						// ATP-1639 end ============================================================================================================
						
						
						//clearRefunds();
						//readCSVContents(fileID);
	
						//log.debug({title: 'sublistData LENGTH is ', details: sublistData[1]});
						//updateRefunds(sublistData, payFileCreationRecordID);
					//REDIRECT TO THE PAYMENT FILE CREATION RECORD (cascade through 'cancelradio' case)
					case 'cancelradio':
						var payFileCreationRecordID = recordIDField.defaultValue;
						redirect.toRecord({
							id: payFileCreationRecordID,
							type: 'customrecord_payment_file'
						});
						break;
					// The next three cases will "cascade" through each other (no breaks until the bottom).
					// The "top" of this waterfall depends on the action selected by the user.
					case 'resetradio':
						selectFieldDeal.defaultValue = checkForFilter('');
						selectFieldPayMethod.defaultValue = checkForFilter('');	
						filterArray = [];
					case 'excluderadio':
						exclusionsData = [];
					case 'filtersradio':
						// re-store exclusions
						for(var i = 0; i < exclusionsData.length; i++) {
							exclusionList.setSublistValue({
								id: 'column0',
								line: i,
								value: exclusionsData[i]
							});
						}
	
						var filteredResults = unfilteredCopyParam.slice(0);
						for(var i = 0; i < filterArray.length; i++) {
						 	filteredResults = filterResults(filterArray[i], filteredResults);
						}
						for(var i = 0; i < filteredResults.length; i++) {
							for(var j = 0; j < exclusionsData.length; j++) {
								if(filteredResults[i] && (filteredResults[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX] == exclusionsData[j])) {
									filteredResults.splice(i, 1);
								}
							}
						}
	
						// BEGIN POPULATE SUMMARIES
						populateSummary(countField, amountField, '', filteredResults);
						populateSummary(achCountField, achAmountField, 'ACH', filteredResults);
						//populateSummary(wirCountField, wirAmountField, 'WIR', filteredResults);
						populateSummary(swtCountField, swtAmountField, 'SWT', filteredResults);
						populateSummary(fedCountField, fedAmountField, 'FED', filteredResults);
						populateSummary(chkCountField, chkAmountField, 'CHK', filteredResults);
						dealCountField.defaultValue = getFieldValues(filteredResults, srsConstants.CUST_REFUND_SUBLIST_COLUMNS.DEAL_LINK_INDEX).length;
						// END POPULATE SUMMARIES
	
						populateFilter(srsConstants.CUST_REFUND_SUBLIST_COLUMNS.DEAL_LINK_INDEX, selectFieldDeal, unfilteredCopyParam);
						populateFilter(srsConstants.CUST_REFUND_SUBLIST_COLUMNS.TRANSACTION_TYPE_INDEX, selectFieldPayMethod, unfilteredCopyParam);
	
						populateSublist(filteredResults, sublist, headersParam);
						break;
				}
				// END PERFORMING ACTION SELECTED
			}
			// END GET AND POST REQUESTS	
		}
		catch (e)
		{
			selectFieldDeal.defaultValue = checkForFilter('');
			selectFieldPayMethod.defaultValue = checkForFilter('');	
			filterArray = [];
			
			if (exclusionsData)
			{
				for(var i = 0; i < exclusionsData.length; i++) {
					exclusionList.setSublistValue({
						id: 'column0',
						line: i,
						value: exclusionsData[i]
					});
				}
			
				var filteredResults = unfilteredCopyParam.slice(0);
				for(var i = 0; i < filterArray.length; i++) {
				 	filteredResults = filterResults(filterArray[i], filteredResults);
				}
				for(var i = 0; i < filteredResults.length; i++) {
					for(var j = 0; j < exclusionsData.length; j++) {
						if(filteredResults[i] && (filteredResults[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX] == exclusionsData[j])) {
							filteredResults.splice(i, 1);
						}
					}
				}
	
				// BEGIN POPULATE SUMMARIES
				populateSummary(countField, amountField, '', filteredResults);
				populateSummary(achCountField, achAmountField, 'ACH', filteredResults);
				//populateSummary(wirCountField, wirAmountField, 'WIR', filteredResults);
				populateSummary(swtCountField, swtAmountField, 'SWT', filteredResults);
				populateSummary(fedCountField, fedAmountField, 'FED', filteredResults);
				populateSummary(chkCountField, chkAmountField, 'CHK', filteredResults);
				dealCountField.defaultValue = getFieldValues(filteredResults, srsConstants.CUST_REFUND_SUBLIST_COLUMNS.DEAL_LINK_INDEX).length;
				// END POPULATE SUMMARIES
	
				populateFilter(srsConstants.CUST_REFUND_SUBLIST_COLUMNS.DEAL_LINK_INDEX, selectFieldDeal, unfilteredCopyParam);
				populateFilter(srsConstants.CUST_REFUND_SUBLIST_COLUMNS.TRANSACTION_TYPE_INDEX, selectFieldPayMethod, unfilteredCopyParam);
	
				populateSublist(filteredResults, sublist, headersParam);
			}
			var messageObj = message.create({title: e.name, type: message.Type.ERROR, message: e.message, duration: 0}); 
			form.addPageInitMessage({message: messageObj});

		}
		
		context.response.writePage(form);

		
		//==============================================================================================================================
		//==============================================================================================================================
		function getJSONFileContents(resultsArrayJSON, thisJSONFileID) {
			var alreadyOnFileList = [];
      
			var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
			log.audit("RemainingUsage" ,"resultsArrayJSON.length " + resultsArrayJSON.length);
			
			for(var i = 0; i < resultsArrayJSON.length; i++) {
				if(thisJSONFileID != resultsArrayJSON[i][0]) {
					var myFile = new file.load({
						id: resultsArrayJSON[i][0]
					});

					var fileContents = myFile.getContents().split(',');
					for(var j = 0; j < fileContents.length; j++) {
						alreadyOnFileList.push(fileContents[j]);
					}
				}
			}
			return alreadyOnFileList;
		}
		
		function createRequestInputHeaderMR(request_options)
		{
			
			if (request_options 
					&& request_options.inclusionsList
					&& request_options.inclusionsList.length<=0)
			{
				throw error.create({ name:'PDF Check Batch Error'
		            ,message: "No data requested to be processed." 
		            ,notifyOff: true });
			}
			
			var completionInfo = {};
			//completionInfo.FileName = request_options.FileName;
			completionInfo.PFCID = request_options.PFCID;
			completionInfo.RecordsToProcess = request_options.inclusionsList.length;
			
			//completionInfo.OutputFolder = request_options.BatchfolderID;
			
			var requestHeader = record.create({type: "customrecord_pri_cre_request_header", isDynamic: true});
			
			//frequestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_status",value:request_options.headerStatus});
			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_profile",value:request_options.BatchCREID});
			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_option",value:request_options.BatchOptionsID});
			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_param1",value:JSON.stringify(completionInfo)});
			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_param2",value:request_options.FileName});
			
			
			requestHeader.setValue({fieldId:"custrecord_pri_cre_request_header_doc_ac",value:srsConstants["CRE Request Detail Document Completion Action"]["Delete Detail Output Document"]});
			request_options.completionAction = srsConstants["CRE Request Detail Document Completion Action"]["Delete Detail Output Document"];
			var requestHeaderid = requestHeader.save();	
			
			var newFolderName = parseInt(requestHeaderid).toFixed(0);
			var namelength = 8;
			newFolderName = newFolderName.length < namelength ? (Array(namelength).join('0') + newFolderName).slice(namelength*(-1)) : newFolderName;

			newFolderName = request_options.PFCID + "_" + newFolderName;
			
			var objFolder = record.create({type : record.Type.FOLDER}
			);
			objFolder.setValue('name', newFolderName);
			objFolder.setValue('parent', request_options.MoveOutputToFolderID);
			request_options.BatchfolderID = objFolder.save();
			
			var requestHeader = record.load({type: "customrecord_pri_cre_request_header", id:requestHeaderid,  isDynamic: true});
			requestHeader.setValue('custrecord_pri_cre_request_folder_link','/app/common/media/mediaitemfolders.nl?folder='+ request_options.BatchfolderID);
			requestHeader.setValue('custrecord_pri_cre_request_header_zlink', '/core/media/downloadfolder.nl?id=' + request_options.BatchfolderID + '&_xt=&_xd=T&e=T');
			var requestHeaderid = requestHeader.save();	
			
			request_options.requestHeaderid = requestHeaderid;
			
			var objRequest = { request_options: request_options};
			var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
			mapReduceTask.scriptId     = "customscript_utility_functions_mr";
			mapReduceTask.params       = { "custscript_mr_uf_json_object"       : JSON.stringify(objRequest)
										  ,"custscript_mr_uf_function"          : "processPDFChecksRequest"
										  ,"custscript_mr_uf_callingscript"     : scriptName
										  ,"custscript_mr_uf_record_type"       : "customerrefund"
					                     };
			log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
			var mapReduceTaskId = mapReduceTask.submit();
			
			return requestHeaderid;
		}
		
		function populateSummary(summaryCountField, summaryAmountField, value, sourceArray) 
		{
			summaryCountField.defaultValue = getCount(sourceArray, srsConstants.CUST_REFUND_SUBLIST_COLUMNS.TRANSACTION_TYPE_INDEX, value);
			summaryAmountField.defaultValue = '$' + format.format({
				value: sumIfColumn(sourceArray, srsConstants.CUST_REFUND_SUBLIST_COLUMNS.PAYMENT_TOTAL_INDEX, srsConstants.CUST_REFUND_SUBLIST_COLUMNS.TRANSACTION_TYPE_INDEX, value),
				type: format.Type.CURRENCY	
			});
		}

		function checkForFilter(filterValues) {
			if(filterValues	!= '') {
				return filterValues;
			}
			return 'Unfiltered';
		}

		function filterResults(filterObject, arrayToBeFiltered) {
		// goes through a given array looking for values specified in filter object - iterates multiple times to allow for multiselect filter
			var tempArray = [];
			var colIndex = filterObject.columnIndex;
			var fileString = '';
			for(var k = 0; k < arrayToBeFiltered.length; k++) {	// test each line of data
				var tempResult = arrayToBeFiltered[k][colIndex];
				if(tempResult == '') {
					tempResult = '(blank)';
				}
				for(var i = 0; i < filterObject.filterValue.length; i++) { // look for each filter value within that line of data
					if(filterObject.filterValue[i] == '' 
					|| filterObject.filterValue[i] == 'Unfiltered' 
					|| filterObject.filterValue[i] == tempResult) {//arrayToBeFiltered[k][colIndex]) {
						tempArray.push(arrayToBeFiltered[k]);
					}
				}
			}
			return tempArray;
		}
		function getAnchor(recordtype, internalid, text) {
	     	var link = url.resolveRecord({
				    recordType: recordtype,
				    recordId: internalid,
				    isEditMode: false
				});
	     	link = "<a href=\""+link+"\" target=\"_blank\">"+(text||internalid)+"</a>";
	     	return link;
		}
		function isInteger(n) { return !isNaN(parseInt(n,10)) && !isNaN(n - 0) }
		function populateSublist(filteredResults, sublistToPopulate, columnsList) {
			for(var i = 0; i < filteredResults.length; i++) { // filteredResults is an array of strings which is used to populate sublist
				for(var j = 0; j < columnsList.length; j++) { // need to use columnArray to make sure everything falls in the right place
					var tempResult = replaceBlankWithSpace(filteredResults[i][j]); // sublist does not accept blanks, replace with space (' ')
					
					if (j===srsConstants.CUST_REFUND_SUBLIST_COLUMNS.LINK_INDEX)
					{
						var internalid = replaceBlankWithSpace(filteredResults[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.INTERNAL_ID_INDEX])
						if (isInteger(parseInt(internalid, 10)))
						{
							tempResult = getAnchor("customerrefund", internalid)
//							log.audit("tempResult", tempResult);
						}
					}
					
					sublistToPopulate.setSublistValue({
						id: 'column' + j,
						line: i,
						value: tempResult
					});
				}
			}
			return true;
		}

		function getCount(array, index, value) {
			var count = 0;
			if(value == '') {
				for(var i = 0; i < array.length; i++) {
					if(array[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX] != 'T') {
						count++;
					}
				}
			}
			else {
				for(var i = 0; i < array.length; i++) {
					if(array[i][index] == value && array[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX] != 'T') {
						count++;
					}
				}
			}
			return count;
		}

		function surroundInQuotes(myString) {
		// returns a string surrounded in quotation marks (myString -> "myString")
			return '\"' + myString + '\"';
		}

		function replaceBlankWithSpace(myString) {
		// replaces a blank string ('') with a space (' ')
			if(myString == '') {
				return ' ';
			}
			return myString;
		}

		function addDelimiter(myString, index, numColumns) {
		// adds the appropriate delimiter to a string for use in creating CSV files
			if (index == numColumns) { // we're at the end of the line! Add a newline character
				return myString + '\r\n'; // carriage return (\r) and line feed (\n)
			}
			return myString + ','; // we are not at the end of a line, add a comma
		}

		function getFieldValues(sourceArray, index) { // index is integer
		// finds all UNIQUE values in the given field and stores them in an array
			var fieldArray = [];
			for(var i = 0; i < sourceArray.length; i++) {
				fieldArray.push(sourceArray[i][index]);
			}
			fieldArray = fieldArray.filter(function( item, index, inputArray) {
				return inputArray.indexOf(item) == index;
			});
			return fieldArray;
		}

		function populateFilter(fieldIndex, filterField, dataArray) { // fieldIndex is integer, filterField is a serverWidget.Field object
		// populates the given filter with UNIQUE values 
			filterArray = getFieldValues(dataArray, fieldIndex).sort();
			// add default unfiltered option
			filterField.addSelectOption({
				value: 'Unfiltered',
				text: 'Unfiltered'
			});

			for (var i = 0; i < filterArray.length; i++) {
				//var tempResult = replaceBlankWithSpace(filterArray[i]);
				var tempResult = filterArray[i];
				if(tempResult == '') {
					tempResult = '(blank)';
				}
				filterField.addSelectOption({
					value: tempResult,
					text: tempResult
				});
			}
			return true;
		}

		function findFieldIndex(fieldName) { // fieldName is string, the Custom Label from the search
			// finds the index of a given field
			for (var i = 0; i < columnArray.length; i++) {
				if (columnArray[i] == fieldName) {
					return i;
				}
			}
		}

		function sumIfColumn(dataArray, sumColumn, valueColumn, value) {
			// method used by summaries to find sum of the values in a particular column
			// ignoring excluded Customer Refunds
			var sum = 0;
			if(value == '') {
				for(var i = 0; i < dataArray.length; i++) 
				{
					if(dataArray[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX] != 'T') {
						sum += parseFloat(dataArray[i][sumColumn]);
					}
				}
			}
			else {
				for(var i = 0; i < dataArray.length; i++) {
					if(dataArray[i][valueColumn] == value && dataArray[i][srsConstants.CUST_REFUND_SUBLIST_COLUMNS.EXCLUDE_FLAG_INDEX] != 'T') {
						sum += parseFloat(dataArray[i][sumColumn]);
					}
				}
			}
			return sum;
		}
		
		function addHTML(name, value)
		{
			var retvalue = "";
				retvalue = retvalue + "<table>";
				retvalue = retvalue + "<tr>";
				retvalue = retvalue + "<td><B>"+name+"</b> </td>";
				retvalue = retvalue + "</tr>";
				retvalue = retvalue + "<tr>";
				retvalue = retvalue + "<td>";
				retvalue = retvalue + value;
				
				retvalue = retvalue + "</td>";
				retvalue = retvalue + "</tr>";
				retvalue = retvalue + "</table>";
			return retvalue;
		}

	}
	
	
	//==============================================================================================================================
	//==============================================================================================================================
	function getFileFormatName(fileFormatNumeric) { 
    
		var arry = Object.keys(srsConstants["Payment File Type"]);
		for (var ix=0; ix<arry.length; ix++) {
			if (srsConstants["Payment File Type" ][arry[ix]] == fileFormatNumeric) { return arry[ix]; }		
		}
		throw error.create({ name:'File Format Not Defined'
            ,message: "File Format Type " +fileFormatNumeric+" missing from srsConstants: " + JSON.stringify(srsConstants["Payment File Type"]) 
            ,notifyOff: true });
		
	}

	
    //===================================================================================================================================	
    //===================================================================================================================================	
	function createFile(resultsString, fileName ,fileExtension ,DestinationFolder) {
		var myFile = file.create({
			name: fileName + fileExtension,
			fileType: file.Type.CSV,
			contents: resultsString,
			folder: DestinationFolder
		});
		return myFile.save();
	}

	
    //===================================================================================================================================	
    //===================================================================================================================================	
	function createJSONFile(sublistData, fileName ,folderId){

		
		var myJSONFile = file.create({
			name: fileName + '_JSON',
			fileType: file.Type.JSON,
			contents: sublistData, //Gotta change this shit to get the CR IDs only
			folder: folderId
		});
		
		var jsonFileID = myJSONFile.save();

		return jsonFileID
	}

	
    //===================================================================================================================================	
    //===================================================================================================================================	
	function getColumnsOnly(mySearch) { // accepts search.Search
		// gets the names of each column and stores them in an array as strings
		// should probably get rolled into getResults method - don't need two different arrays for headers and data
		var idArray = [];
		for (var i = 0; i < mySearch.columns.length; i++) {
			idArray.push(mySearch.columns[i].label);
		}
		return idArray;
	}

	
    //===================================================================================================================================	
    //===================================================================================================================================	
	function getDataOnly(searchResults ,nbrColumns) { // accepts search.ResultSet object		
		// gets the search results and stores the pieces in an array as strings
		// then stores the array in another array
		// returns array of arrays containing data pieces for each result
		var dataArray = [];
		var tempResult = [];
		var batch; // will store arrays returned from the getRange() call
		var batchSize = 1000; // ask for batches of 1000 (maximum for getRange)
		
		// get the data from each column for each record returned by the search
		var startIndex = 0,
			endIndex = batchSize;
		do {
			batch = searchResults.getRange(startIndex, endIndex);
			startIndex = endIndex;
			endIndex += batchSize;

			for (var i = 0; i < batch.length; i++) { // cycles over records in current batch array
				//log.debug("getDataOnly" , "columns.length: " + batch[i].columns.length  );
				
				var columnList = "";
				for (var jj=0; jj<batch[i].columns.length; jj++) { columnList = columnList + "," + batch[i].columns[jj].label }
				
				//log.debug("getDataOnly" , "columnList: " + JSON.stringify(columnList)  );
				
				for (var j = 0; j < nbrColumns; j++) { // cycles through each column
					//log.debug("getDataOnly" , "columnNbr: " + j  );
					var tempString = getDataItem(batch[i], j);
					tempResult.push(tempString);
				}
				dataArray.push(tempResult);
				tempResult = [];
			}
		} while (batch.length == endIndex - startIndex); // NEED TO TEST numRecords % 1000 = 0

		return dataArray;
	}

    //===================================================================================================================================	
    //===================================================================================================================================	
	function getDataItem(result, columnNum) { // accepts search.Result, integer
		// when using getValue(), some search results are returned as IDs - getText() grabs the text behind the IDs
		// but returns null when the result is not an ID. Then getValue() is called on the result instead.
		
		if (result.columns[columnNum])
		{
			var tempString = result.getText({ name: result.columns[columnNum] });
			if (tempString == null) { return result.getValue({ name: result.columns[columnNum] }); };
			return tempString;
		}
		else
		{
			throw error.create({ name:'Saved Search Column Error'
	            ,message: "Column " + columnNum + " is expected but does not exist in search results. One reason for this error is that the formula is empty."
	            ,notifyOff: true });
			
		
		}
	}

	
    //===================================================================================================================================	
    //===================================================================================================================================	
	function getJSONDataOnly(searchResults) { // accepts search.ResultSet object		
		// gets the search results and stores the pieces in an array as strings
		// then stores the array in another array
		// returns array of arrays containing data pieces for each result
		var dataArray = [];
		var tempResult = [];
		var batch; // will store arrays returned from the getRange() call
		var batchSize = 1000; // ask for batches of 1000 (maximum for getRange)

		// get the data from each column for each record returned by the search
		var startIndex = 0,
			endIndex = batchSize;
		do {
			batch = searchResults.getRange(startIndex, endIndex);
			startIndex = endIndex;
			endIndex += batchSize;

			for (var i = 0; i < batch.length; i++) { // cycles over records in current batch array
				for (var j = 0; j < searchResults.columns.length; j++) { // cycles through each column
					var tempString = batch[i].getValue({ name: batch[i].columns[j] });
					tempResult.push(tempString);
				}
				dataArray.push(tempResult);
				tempResult = [];
			}
		} while (batch.length == endIndex - startIndex); // NEED TO TEST numRecords % 1000 = 0

		return dataArray;
	}
	
    //===================================================================================================================================	
    //===================================================================================================================================	
	function getPayFileTypeFields(payFileType) {

		return search.lookupFields({type:'customrecord_pay_file_type'                   ,id:payFileType 
                                ,columns: ["name"
                                	      ,"custrecord_pft_output_file_prefix" 
                                	      ,"custrecord_pft_output_file_extension"
                                	      ,"custrecord_pft_output_file_folder"
//                                        ,"custrecord_pft_payments_lookup_search"
//            	                          ,"custrecord_pft_file_generation_search"
            	                          ,"custrecord_pft_suitelet_pmts_search_id"
            	                          ,"custrecord_pft_file_gen_search_id"
            	                          ,"custrecord_pft_idx_deal"
            	                          ,"custrecord_pft_idx_payment_type"
            	                          ,"custrecord_pft_idx_amount"
            	                          ,"custrecord_pft_idx_output_start"
            	                          ,"custrecord_pft_no_header_row" // ATP-1243
            	                          ,"custrecord_pft_idx_internal_id" // ATP-1415
            	                          ,"custrecord_pft_cre_is_payment_file" //ATP-1639
            	                          ,"custrecord_pft_currency_selection_req"
            	                          ,"CUSTRECORD_PFT_PAYMENT_BANK.custrecord_pb_vendor_bank_name"
            	                          ,"CUSTRECORD_PFT_FILE_FORMAT.custrecord_pff_cre_profile_required"
            	                          ,"custrecord_pft_department"
            	                          ,"custrecord_pft_entity"
            	                          ]});

	}
	
	return {
		onRequest: onRequest
	};

    //===================================================================================================================================	
    //===================================================================================================================================	
	function formatInt(numToFormat) {
		return format.format({
			value: numToFormat,
			type: format.Type.INTEGER
		});
	}

    //===================================================================================================================================	
    //===================================================================================================================================	
	function formatCurrency(amountToFormat) {
		return '$' + format.format({
			value: amountToFormat,
			type: format.Type.CURRENCY
		})
	}
		
	
});

/* MAINTENANCE GUIDE

 *** Adding Filters ***
 *	1. Add the appropriate column index under the IMPORTANT COLUMNS section.
		var MY_FILTER_INDEX = 24;

 	NOTE: An easy way to find the index of the column you want is to use the findFieldIndex() method, which takes a string in the 
 	form of the "Custom Label" of the column and returns the index of that field. You can log.debug this (make sure your debug line 
 	is UNDERNEATH the GET SEARCH RESULTS section) and then erase it later.
 		log.debug(findFieldIndex('My Filter Column'));
 
 *	2. Add the field for the filter under the CREATE FILTERS section and populate it with unique values from the search.
 		var filterField = form.addField({
			id: 'myfilterfield',
			type: serverWidget.FieldType.MULTISELECT,
			label: 'My Filter Field'
		});
		populateFilter(MY_FILTER_INDEX, filterField, dataArray);   // MY_FILTER_INDEX is whatever the value found in step 1
																	// filterField is the name of the variable that you stored the field in
																	// dataArray is the data you want to pull the unique filter values from
 
 *	3. Under the PARSE FILTERS section, 
		var myFilterValue = context.request.parameters.myfilterfield.split(delimiter);	// get field's values as array			
		filterArray.push({
			columnIndex: MY_FILTER_INDEX,
			filterValue: myFilterValue
		});	

	NOTE: The delimiter used by NetSuite for this purpose is /\u0005/. It is already stored in the delimiter value in that section.
 
 *	4. The code should now work with that filter.
 
 
 *** Adding Summary Fields ***
 *	1. Add a new field under the CREATE SUMMARY INFORMATION section of the code.
 		var summaryField = form.addField({
			id: 'summaryfield',
			type: serverWidget.FieldType.INTEGER,
			label: 'A Summary Field'
		});
		summaryField.updateDisplayType({
			displayType: serverWidget.FieldDisplayType.INLINE
		});
 
 *	2. The populateSummary method is too narrow, so it is unlikely it will work for any summaries beyond 
 *   the ones on the Suitelet.

 		populateSummary(summaryCountField, summaryAmountField, value, sourceArray);
 			// summaryCountField is the field on the form where you are storing the count of the value given
 			// summaryAmountField is the field on the form where you are storing the sum of the value given
 			// value is the value you are looking for
 			// sourceArray is the data you want to use to generate the counts and sums
 */