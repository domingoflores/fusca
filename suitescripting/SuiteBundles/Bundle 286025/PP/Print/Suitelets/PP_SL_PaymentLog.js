/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// Add 'N/redirect' per https://netsuite.custhelp.com/app/answers/detail/a_id/63272
define(['N/ui/serverWidget','N/log','N/search','N/format','N/redirect','N/url','N/record'],
function(ui,log,search,format,redirect,url,record) {

	var K_FORM_TITLE = 'Avid Payment Log';

	var K_STARTDATE_FLD = 'custpage_startdate';
	var K_STARTDATE_HINT = "Enter a start date for the Payment Log.";

	var K_ENDDATE_FLD = 'custpage_enddate';
	var K_ENDDATE_HINT = "Enter an end date for the Payment Log.";

	var K_SELECT_ACCOUNT_FLD = 'custpage_select_account';
	var K_SELECT_ACCOUNT_HINT = "Select the Account to filter on. This selection contains all Accounts currently not marked 'EXCLUDE ACCOUNT FROM AVIDXCHANGE'";

	var K_SELECT_PAYEE_FLD = 'custpage_select_payee';
	var K_SELECT_PAYEE_HINT = "Select the Payee to filter on. This selection contains all vendors, customers, and employees currently not marked 'EXCLUDE FROM AVID PAYMENTS'";

	var K_RESULTS_SUBLIST = 'custpage_results_sublist';

	var doDetailLog = false;
	var doDetailLog_1 = false;
	var useSavedSearch = true;

	var PAGE_SIZE = 50;

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		log.debug({ title: 'onRequest', details: 'Start of ' + context.request.method });

		// Create a form for the search
		// set hideNavBar to false per https://netsuite.custhelp.com/app/answers/detail/a_id/63272
		var form = ui.createForm({ title: K_FORM_TITLE, hideNavBar: false });

		// Submit Button
		log.debug({ title: 'addFilterGroup', details: 'Add submit button' });
		form.addSubmitButton({
			label: 'Search'
		});
		// Add the filters to the form
		addFilterGroup(form, context.request);

		// Add the results sublist 
		var sublist = addResultsSublist(form,context.request);

		// Do the paged search based on https://netsuite.custhelp.com/app/answers/detail/a_id/63272
		log.debug({ title: 'onRequest', details: 'Start of https://netsuite.custhelp.com/app/answers/detail/a_id/63272' });
		// Run search and determine page count
		var retrieveSearch = runSearch(form, context.request, PAGE_SIZE);

		log.debug({ title: 'onRequest', details: 'retrieveSearch.count=' + retrieveSearch.count + '; retrieveSearch.pageRanges.length=' + retrieveSearch.pageRanges.length });
		var pageId = addNavigation(context.request, retrieveSearch, form);

		if (retrieveSearch.count > 0) {
			// Get subset of data to be shown on page
			var pageResults = retrieveSearch.fetch({ index: pageId });
			// Set data returned to columns
			log.debug({ title: 'onRequest', details: 'add results to the sublist' });
			var sublist_row = 0;
			pageResults.data.forEach(function(result) {
				var internalId = result.id;
				var account = result.getText({ name: 'account' });
				var tranId = result.getValue({ name: 'tranid' });
				var tranDate = result.getValue({ name: 'trandate' });
				var payee = result.getText({ name: 'entity' });
				var amount = result.getValue({ name: 'amount' });
				var type = result.getText({ name: 'type' });
				var payment_method = result.getText({ name: 'custbody_pp_payment_method' });
				var apn_pay_method = result.getText({ name: 'custbody_pp_apn_payment_method_lr' });
				log.debug({ title: 'APN Payment Method', details: 'POST: ' + apn_pay_method });
				if (doDetailLog) {
					// log all results
					var detailStr = 'sublist_row=' + sublist_row + ':';
					detailStr = detailStr
						+ ' account='+ account
						+ ' tranid='+ tranId
						+ ' trandate='+ tranDate
						+ ' payee='+ payee
						+ ' amount='+ amount
						+ ' type='+ type
						+ ' custbody_pp_payment_method='+ payment_method
						+ ' apn_payment_method='+ apn_pay_method;
					log.debug({ title: 'onRequest', details: detailStr });
				}
				sublist.setSublistValue({ id: 'subfld_account', line: sublist_row, value: account });
				sublist.setSublistValue({ id: 'subfld_date', line: sublist_row, value: tranDate });
				try {
					var recordType;
					if (type == 'Check') {
						recordType = 'check';
					} else if (type == 'Bill Payment') {
						recordType = 'vendorpayment';
					} else {
						recordType = 'customerrefund';
					}
					var scheme = 'https://';
					var host = url.resolveDomain({
						hostType: url.HostType.APPLICATION
					});
					var relativePath = url.resolveRecord({
						recordType: recordType,
						recordId: internalId,
						isEditMode: false
					});
					var output = scheme + host + relativePath;
					var tranIdHTML = "<a href='" + output + "'>" + tranId + "</a>";
					if (doDetailLog) {
						log.debug({ title: 'onRequest', details: 'tranid=' + tranId + ' tranidHTML=' + tranIdHTML });
					}
					sublist.setSublistValue({ id: 'subfld_docnum', line: sublist_row, value: tranIdHTML });
				} catch (ex) {
					log.debug({ title: 'onRequest', details: ex.message });
				}
				sublist.setSublistValue({ id: 'subfld_name', line: sublist_row, value: payee });
				if (useSavedSearch) {
					sublist.setSublistValue({ id: 'subfld_amount', line: sublist_row, value: amount });
				} else {
					sublist.setSublistValue({ id: 'subfld_amount', line: sublist_row, value: -(amount) });
				}
				sublist.setSublistValue({ id: 'subfld_trantype', line: sublist_row, value: type });
				sublist.setSublistValue({ id: 'subfld_pmtmethod', line: sublist_row, value: payment_method });
				log.debug({ title: 'setSubListValue: subfld_apnpaymenthod', details: apn_pay_method ? apn_pay_method : 'null' });
				if (apn_pay_method) {
					sublist.setSublistValue({ id: 'subfld_apnpaymethod', line: sublist_row, value: apn_pay_method });
				}
				++sublist_row;
			});
			// Attach client script to this form; this will need to be changed to find the suitelet so as not to hard-code the path
			var csId = getFileId('PP_CS_PaymentLog.js');
			if (csId) {
				log.debug({ title: 'onRequest', details: 'set clientScriptFileId=' + csId });
				form.clientScriptFileId = csId;
			} else {
				log.debug({ title: 'onRequest', details: 'set clientScriptModulePath' });
				if (deployBundleFolderExists()) {
					log.debug({ title: 'onRequest', details: 'Deploy Bundle Folder Exists, use path /SuiteBundles/Bundle 202124' });
					form.clientScriptModulePath = '/SuiteBundles/Bundle 202124/PP/Print/Client Scripts/PP_CS_PaymentLog.js';
				} else {
					log.debug({ title: 'onRequest', details: "Deploy Bundle Folder Doesn't Exists, use path /SuiteBundles/Bundle 202121" });
					form.clientScriptModulePath = '/SuiteBundles/Bundle 202121/PP/Print/Client Scripts/PP_CS_PaymentLog.js';
				}
			}
		}
		// Show the form
		log.debug({ title: 'onRequest', details: 'writePage' });
		context.response.writePage(form);
		log.debug({ title: 'onRequest', details: 'End of ' + context.request.method });
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * *  
	 * Add results sublist to the form
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	function addResultsSublist(form, request) {
		log.debug({ title: 'addResultsSublist', details: '' });
		var sublist_results = null;
		try {
			form.addSubtab({
				id: 'custpage_subtabid',
				label: 'AvidXchange Payment Log'
			});
			sublist_results = form.addSublist({
				id: K_RESULTS_SUBLIST,
				label: 'AvidXchange Payment Log',
				tab: 'custpage_subtabid',
				type: ui.SublistType.LIST
			});

			sublist_results.addField({ id: 'subfld_account', label: 'Account', type: ui.FieldType.TEXT });
			sublist_results.addField({ id: 'subfld_date', label: 'Date', type: ui.FieldType.DATE });
			sublist_results.addField({ id: 'subfld_docnum', label: 'Payment #', type: ui.FieldType.TEXT });
			sublist_results.addField({ id: 'subfld_name', label: 'Payee', type: ui.FieldType.TEXT });
			sublist_results.addField({ id: 'subfld_amount', label: 'Amount', type: ui.FieldType.CURRENCY });
			sublist_results.addField({ id: 'subfld_trantype', label: 'Type', type: ui.FieldType.TEXT });
			sublist_results.addField({ id: 'subfld_pmtmethod', label: 'Payment Method', type: ui.FieldType.TEXT });
			sublist_results.addField({ id: 'subfld_apnpaymethod', label: 'AvidPay Payment Method', type: ui.FieldType.TEXT });
		} catch (ex) {
			log.error({ title: 'Error in addResultsSublist', details: ex.message });
		}
		return sublist_results;
	};

	// https://netsuite.custhelp.com/app/answers/detail/a_id/63272
	function runSearch(form, request, pmtPerPage) {
		/*
		 * Load the search
		 */
		log.debug({ title: 'runSearch', details: 'Get the search' });
		try {
			var tranSearch = getTranSearch();
		} catch (ex) {
			log.debug({ title: 'runSearch', details: 'Saved search not found, exit' });
			if (useSavedSearch) { return null; }
		}
		/*
		 *  Set filters based on user selections
		 */
		setFilters(form, request, tranSearch);
		if (!useSavedSearch) {
			log.debug({ title: 'runSearch', details: 'Save the search for the Export' });
			tranSearch.save();
		}
		/*
		 * Log the columns and filters: set/unset doDetailLog on whether to do a detailed log
		 */
		if (doDetailLog) {
			logSearchFilters(tranSearch);
			logSearchColumns(tranSearch);
		}
		//
		log.debug({ title: 'runSearch', details: 'Run the search' });
		// Run paged version of search with pmtPerPage results per page
		log.debug({ title: 'runSearch', details: 'runPaged({pageSize:' + pmtPerPage + '})' });
		return tranSearch.runPaged({ pageSize: pmtPerPage });
	}

	/*
	 *  Load the saved search 
	 */
	function getTranSearch() {
		log.debug({ title: 'getTranSearch', details: 'Load the saved search' });
		if (useSavedSearch) {
			var tranSearch = search.load({ id: 'customsearch_pp_avid_transaction' });
		} else {
			log.debug({ title: 'getTranSearch', details: 'delete the saved search' });
			var tranSearch = search.load({ id: 'customsearch_pp_tmp_avid_tran' });
			if (tranSearch) {
				search.delete({ id: 'customsearch_pp_tmp_avid_tran' });
			}
			// initialize the type & payment method 
			//var trantypes = ['check','custrfnd','vendpymt'];
			//var pmtmethods = ['1','2','3','5'];
			// create a tmp search for the export
			log.debug({ title: 'getTranSearch', details: 'recreate the saved search' });
			var tranSearch = search.create({
				title: 'Avid Payment Log',
				type: search.Type.TRANSACTION,
				id: 'customsearch_pp_tmp_avid_tran',
				filters: [
					{ name: 'mainline', operator: 'is', values: true },
					{ name: 'custbody_pp_is_printed', operator: 'is', values: true } //,
					//{name: 'type',                       operator: 'anyof', values: trantypes},
					//{name: 'custbody_pp_payment_method', operator: 'anyof', values: pmtmethods}//,
				],
				columns: [
					{ name: 'trandate' }, //Date
					{ name: 'account', sort: search.Sort.ASC }, //Account
					{ name: 'tranid', sort: search.Sort.ASC }, //Document Number
					{ name: 'type' }, //Type
					{ name: 'amount' }, //Amount
					{ name: 'entity' }, //Payee
					{ name: 'custbody_pp_payment_method' }, //Payment Method (Possible Values [ACH, AvidPay Network, Check, PayPal, Do Not Process With AvidXchange])
					{ name: 'custbody_pp_apn_payment_method_lr' } //APN Payment Method (Possible Values[AvidPay Check, Check, e-Payment, Unknown, VCC ])
				]
			});
		}
		return tranSearch;
	}

	/*
	 *  Set the filters for the Get & Post
	 */
	function setFilters(form, request, tranSearch) {
		log.debug({ title: 'setFilters', details: 'update the filters' });
		/* 
		 * Get the user's selections
		 */
		// Set Date Range
		if (request.parameters.custpage_startdate || request.parameters.custpage_enddate) {
			setUserDateRange(form, request, tranSearch);
		}
		// Select Account
		if (request.parameters.custpage_select_account) {
			setAccountFilter(request, tranSearch);
		}
		// Select Payee
		if (request.parameters.custpage_select_payee) {
			setPayeeFilter(request, tranSearch);
		}
	}

	function addNavigation(request, retrieveSearch, form) {
		// get the number of page ranges in the results
		var pageCount = retrieveSearch.pageRanges.length;
		// Set pageId to correct value if out of index
		var pageId = parseInt(request.parameters.page);
		if (!pageId || pageId == '' || pageId < 0 || pageCount == 0)
			pageId = 0;
		else if (pageId >= pageCount)
			pageId = pageCount - 1;
		log.debug({ title: 'addNavigation', details: 'pageId=' + pageId + ' pageCount=' + pageCount });
		// Add drop-down and options to navigate to specific page
		var pageRange = form.addField({
			id: 'custpage_pagerange',
			label: 'Page Range',
			container: 'custpage_subtabid',
			type: ui.FieldType.TEXT
		}).updateDisplayType({
			displayType: ui.FieldDisplayType.INLINE
		});
		// Add navigation for more than 1 page
		if (retrieveSearch.pageRanges.length > 1) {
			// Add buttons to simulate Next & Previous
			var sublist = form.getSublist(K_RESULTS_SUBLIST);
			// Get parameters
			var scriptId = request.parameters.script;
			var deploymentId = request.parameters.deploy;
			log.debug({ title: 'addNavigation', details: 'pageId=' + pageId + ' scriptId=' + scriptId + ' deploymentId=' + deploymentId });
			if (pageId > 0) {
				log.debug({ title: 'addNavigation', details: 'add Previous button' });
				sublist.addButton({
					id: 'custpage_previous',
					label: 'Previous',
					functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ')'
				});
			}
			if (pageId < pageCount - 1) {
				log.debug({ title: 'addNavigation', details: 'add Next button' });
				sublist.addButton({
					id: 'custpage_next',
					label: 'Next',
					functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')'
				});
			}
			log.debug({ title: 'addNavigation', details: 'add multipage range' });
			for (var i = 0; i < pageCount; i++) {
				var toCount = i * PAGE_SIZE + PAGE_SIZE;
				if (toCount > retrieveSearch.count) {
					toCount = retrieveSearch.count;
				}
				if (pageId === i) {
					pageRange.defaultValue = (i * PAGE_SIZE + 1) + ' to ' + toCount + ' of ' + retrieveSearch.count;
				}
			}
		} else if (retrieveSearch.count > 0) {
			// Add single page range
			log.debug({ title: 'addNavigation', details: 'add single page range' });
			pageRange.defaultValue = '1 to ' + retrieveSearch.count + ' of ' + retrieveSearch.count;
		} else {
			// Add single page range
			log.debug({ title: 'addNavigation', details: 'add no results' });
			pageRange.defaultValue = 'No Results';
		}
		return pageId;
	}

	/*
	 * Add a filter group and the date, account, trans type, and payment method filters to the form
	 */
	function addFilterGroup(form, request) {
		log.debug({ title: 'addFilterGroup', details: 'Start' });
		try {
			// Group the filters
			var fieldGroup_filters = form.addFieldGroup({
				id: 'fieldgroup_filters_id',
				label: 'Filters'
			});
			fieldGroup_filters.isCollapsible = true;
			addAccountFilter(form, request);
			addPayeeFilter(form, request);
			addDateRangeFilter(form, request);

			log.debug({ title: 'addFilterGroup', details: 'End' });
		} catch (ex) {
			log.error({ title: 'Error in addFilterGroup', details: ex.message });
		}
	};

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * *  
	 * Account selection filter
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	function addAccountFilter(form, request) {
		log.debug({ title: 'addAccountSelection', details: '' });
		// Account filter
		var field_account = form.addField({
			id: K_SELECT_ACCOUNT_FLD,
			label: 'Account',
			type: ui.FieldType.SELECT,
			container: 'fieldgroup_filters_id'
		}).updateBreakType({
			breakType: ui.FieldBreakType.STARTCOL
		});
		addAccountSelectOptions(field_account, request);
		field_account.setHelpText({
			help: K_SELECT_ACCOUNT_HINT
		});
	}

	function addAccountSelectOptions(accountField, request) {
		log.debug({ title: 'addAccountSelectOptions', details: 'request.parameters.custpage_select_account=' + request.parameters.custpage_select_account });
		try {
			// Create a search for Avid Enabled Accounts
			var accountSearch = search.create({
				type: search.Type.ACCOUNT,
				filters: [
					{ name: 'type', operator: 'is', values: 'Bank' },
					{ name: 'custrecord_pp_account_exclude', operator: 'is', values: false }
				],
				columns: [
					{ name: 'internalid' },
					{ name: 'name' }
				]
			});
			// start with a blank one
			accountField.addSelectOption({ value: '', text: '' });
			// Run search and add results to the accountField
			accountSearch.run().each(function(result) {
				var isSelect = false;
				if (request.parameters.custpage_select_account) {
					if (request.parameters.custpage_select_account == result.getValue({ name: 'internalid' })) {
						isSelect = true;
					}
				}
				accountField.addSelectOption({
					value: result.getValue({ name: 'internalid' }),
					text: result.getValue({ name: 'name' }),
					isSelected: isSelect
				});
				return true;
			});
		} catch (ex) {
			log.error({ title: 'Error in addAccountSelectOptions', details: ex.message });
		}
		log.debug({ title: 'addAccountSelectOptions', details: 'End' });
		return accountField;
	};

	function setAccountFilter(request, tranSearch) {
		log.debug({ title: 'setAccountFilter', details: 'custpage_select_account=' + request.parameters.custpage_select_account });
		// add selected accounts as a filter
		var account = request.parameters.custpage_select_account;
		var accountFilter = search.createFilter({ name: 'account', operator: 'is', values: account });
		tranSearch.filters.push(accountFilter);
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * *  
	 * Payee selection filter
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	function addPayeeFilter(form, request) {
		log.debug({ title: 'addPayeeSelection', details: '' });
		// Payee filter
		var field_payee = form.addField({
			id: K_SELECT_PAYEE_FLD,
			label: 'Payee',
			type: ui.FieldType.SELECT,
			container: 'fieldgroup_filters_id'
		}).setHelpText({
			help: K_SELECT_PAYEE_HINT
		});
		addPayeeSelectOptions(field_payee, request);
	}

	function addPayeeSelectOptions(payeeField, request) {
		log.debug({ title: 'addPayeeSelectOptions', details: 'Start' });
		try {
			// start with a blank one
			payeeField.addSelectOption({ value: '', text: '' });
			addAvidEnabledVendors(payeeField, request);
			addAvidEnabledCustomers(payeeField, request);
			addAvidEnabledEmployees(payeeField, request);
		} catch (ex) {
			log.error({ title: 'Error in addPayeeSelectOptions', details: ex.message });
		}
		log.debug({ title: 'addPayeeSelectOptions', details: 'End' });
		return payeeField;
	};

	/*
	 * Avid Vendors
	 */
	function addAvidEnabledVendors(payeeField, request) {
		log.debug({ title: 'addAvidEnabledVendors', details: '' });
		// Vendors
		var vendorSearch = search.create({
			type: search.Type.VENDOR,
			filters: [
				{ name: 'custentity_pp_exclude_from_pp', operator: 'is', values: false }
			],
			columns: [
				{ name: 'internalid' },
				{ name: 'entityid' }
			]
		});
		// Run search and add results to the payeeField
		vendorSearch.run().each(function(result) {
			if (doDetailLog) {
				log.debug({ title: 'addPayeeSelectOptions', details: result });
			}
			var isSelect = false;
			if (request.parameters.custpage_select_payee) {
				if (request.parameters.custpage_select_payee == result.getValue({ name: 'internalid' })) {
					isSelect = true;
				}
			}
			payeeField.addSelectOption({
				value: result.getValue({ name: 'internalid' }),
				text: result.getValue({ name: 'entityid' }),
				isSelected: isSelect
			});
			return true;
		});
	}

	/*
	 * Avid Customers
	 */
	function addAvidEnabledCustomers(payeeField, request) {
		log.debug({ title: 'addAvidEnabledCustomers', details: '' });
		// Customers
		var customerSearch = search.load({ id: 'customsearch_pp_avidcustomer' });
		if (doDetailLog_1) {
			log.debug({ title: 'addPayeeSelectOptions', details: "There are " + customerSearch.filters.length + " customer filters in the search:" });
			customerSearch.filters.forEach(function(filt) { // log each filter
				log.debug({ title: 'addPayeeSelectOptions', details: filt });
			});
		}
		// Run search and add results to the payeeField
		customerSearch.run().each(function(result) {
			if (doDetailLog) {
				log.debug({ title: 'addPayeeSelectOptions', details: result });
			}
			var isSelect = false;
			if (request.parameters.custpage_select_payee) {
				if (request.parameters.custpage_select_payee == result.getValue({ name: 'internalid' })) {
					isSelect = true;
				}
			}
			payeeField.addSelectOption({
				value: result.getValue({ name: 'internalid' }),
				text: result.getValue({ name: 'entityid' }),
				isSelected: isSelect
			});
			return true;
		});
	}

	/*
	 * Employees
	 */
	function addAvidEnabledEmployees(payeeField, request) {
		log.debug({ title: 'addAvidEnabledEmployees', details: '' });
		var employeeSearch = search.create({
			type: search.Type.EMPLOYEE,
			filters: [
				{ name: 'custentity_pp_exclude_from_pp', operator: 'is', values: false }
			],
			columns: [
				{ name: 'internalid' },
				{ name: 'entityid' }
			]
		});
		// Run search and add results to the payeeField
		employeeSearch.run().each(function(result) {
			if (doDetailLog) {
				log.debug({ title: 'addPayeeSelectOptions', details: result });
			}
			var isSelect = false;
			if (request.parameters.custpage_select_payee) {
				if (request.parameters.custpage_select_payee == result.getValue({ name: 'internalid' })) {
					isSelect = true;
				}
			}
			payeeField.addSelectOption({
				value: result.getValue({ name: 'internalid' }),
				text: result.getValue({ name: 'entityid' }),
				isSelected: isSelect
			});
			return true;
		});
	}

	// Set the Payee filter on the user selected payee
	function setPayeeFilter(request, tranSearch) {
		log.debug({ title: 'setPayeeFilter', details: 'custpage_select_payee=' + request.parameters.custpage_select_payee });
		// add selected payee as a filter
		var payee = request.parameters.custpage_select_payee;
		var payeeFilter = search.createFilter({ name: 'entity', operator: 'is', values: payee });
		tranSearch.filters.push(payeeFilter);
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * *  
	 * Date Range (Start & End) filter
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	function addDateRangeFilter(form, request) {
		// Date Range filter
		var field_startdate = form.addField({
			id: K_STARTDATE_FLD,
			type: ui.FieldType.DATE,
			label: 'Start Date',
			container: 'fieldgroup_filters_id'
		}).updateBreakType({
			breakType: ui.FieldBreakType.STARTCOL
		}).setHelpText({
			help: K_STARTDATE_HINT
		});
		if (request.parameters.custpage_startdate) {
			field_startdate.defaultValue = request.parameters.custpage_startdate;
		}
		var field_enddate = form.addField({
			id: K_ENDDATE_FLD,
			type: ui.FieldType.DATE,
			label: 'End Date',
			container: 'fieldgroup_filters_id'
		}).setHelpText({
			help: K_ENDDATE_HINT
		});
		if (request.parameters.custpage_enddate) {
			field_enddate.defaultValue = request.parameters.custpage_enddate;
		}
	}

	// Set the date range to the user entered dates
	function setUserDateRange(form, request, tranSearch) {
		var dateRangeFilter;
		log.debug({ title: 'setUserDateRange', details: 'selected startdate=' + request.parameters.custpage_startdate + ' enddate=' + request.parameters.custpage_enddate });
		if (request.parameters.custpage_startdate) {
			var startDate = request.parameters.custpage_startdate;
			var sDate = format.format({ value: startDate, type: format.Type.DATE });
			if (request.parameters.custpage_enddate) {
				// 'within'
				var endDate = request.parameters.custpage_enddate;
				var eDate = format.format({ value: endDate, type: format.Type.DATE });
				log.debug({ title: 'setUserDateRange', details: 'trandate within sDate=' + sDate + ' eDate=' + eDate });
				dateRangeFilter = search.createFilter({
					name: 'trandate',
					operator: 'within',
					values: [sDate, eDate]
				});
			} else {
				// 'on or after'
				log.debug({ title: 'setUserDateRange', details: 'trandate onorafter sDate=' + sDate });
				dateRangeFilter = search.createFilter({
					name: 'trandate',
					operator: 'onorafter',
					values: [sDate]
				});
			}
		} else {
			// 'on or before'
			var endDate = request.parameters.custpage_enddate;
			var eDate = format.format({ value: endDate, type: format.Type.DATE });
			log.debug({ title: 'setUserDateRange', details: 'trandate onorbefore eDate=' + eDate });
			dateRangeFilter = search.createFilter({
				name: 'trandate',
				operator: 'onorbefore',
				values: [eDate]
			});
		}
		log.debug({ title: 'setUserDateRange', details: 'dateRangeFilter = ' + dateRangeFilter });
		tranSearch.filters.push(dateRangeFilter);
	}

	/*
	 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	 * The following functions are used to locate the client script  
	 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	 */
	function getFileId(filename) {
		var csFilter = search.createFilter({
			name: 'name',
			operator: search.Operator.STARTSWITH,
			values: filename //name of your Client Script file
		});
		var csSearch = search.create({
			type: 'file', //this is NOT using the Type filter, as if you try to put FILE there it will fail, but it works. Because NetSuite
			columns: ['internalid'],
			filters: csFilter,
			title: 'File Helper Search'
		});

		var csId;
		csSearch.run().each(function(result) { //gives you the internal ID of the file
			csId = result.getValue({
				name: 'internalid'
			});
			return true;
		});
		return csId;
	}

	/*
	 * If no file id is found, look for the bundle id in the file cabinet
	 */
	function deployBundleFolderExists() {
		var folderSearch = search.create({
			type: search.Type.FOLDER,
			filters: [
				{ name: 'name', operator: 'contains', values: '202124' }
			],
			columns: [
				{ name: 'internalid' },
				{ name: 'name' }
			]
		});
		//*/
		var found = false;
		folderSearch.run().each(function(result) {
			found = true;
			return true;
		});
		log.debug({ title: 'deployBundleFolderExists', details: 'found=' + found });
		return found;
	}


	/*
	 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	 * The following functions are detail logging when doDetailLog = true 
	 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	 */
	function logSearchFilters(tranSearch) {
		try {
			log.debug({ title: 'updateResultsSublist', details: 'Search filters:' });
			log.debug({ title: 'updateResultsSublist', details: "There are " + tranSearch.filters.length + " filters in the search:" });
			tranSearch.filters.forEach(function(filt) { // log each filter
				log.debug({ title: 'updateResultsSublist', details: filt });
			});
			/*
			 * Search filters:
			 * {"name":"custbody_pp_is_printed","operator":"is","values":["T"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"mainline","operator":"is","values":["T"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"custbody_pp_payment_method","operator":"anyof","values":["2","5","1","3"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"type","operator":"anyof","values":["VendPymt","Check","CustRfnd"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"field","join":"systemnotes","operator":"anyof","values":["CUSTBODY_PP_IS_PRINTED"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"date","join":"systemnotes","operator":"onorafter","values":["10/13/2017 12:00 am"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"trandate","operator":"onorafter","values":["2/9/2019"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"trandate","operator":"onorbefore","values":["3/11/2019"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"trandate","operator":"onorafter","values":["2/10/2019"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"trandate","operator":"onorafter","values":["2/10/2019"],"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 * {"name":"trandate","operator":"onorafter","values":["2/10/2019"],"formula":null,"summarytype":null,"isor":false,"isnot":false,"leftparens":0,"rightparens":0}
			 */

		} catch (ex) {
			log.error({ title: 'Error in addResultsSublist', details: ex.message });
		}
	}

	function logSearchColumns(tranSearch) {
		try {
			log.debug({ title: 'updateResultsSublist', details: 'Log the columns' });
			log.debug({ title: 'updateResultsSublist', details: "There are " + tranSearch.columns.length + " columns in the result:" });
			tranSearch.columns.forEach(function(col) { // log each column
				log.debug({ title: 'updateResultsSublist', details: col });
			});
			/*
			 * There are 8 columns in the result:
			 * {"name":"trandate","label":"Date","type":"date","sortdir":"NONE"}
			 * {"name":"account","label":"Account","type":"select","sortdir":"ASC"}
			 * {"name":"tranid","label":"Document Number","type":"text","sortdir":"ASC"}
			 * {"name":"type","label":"Type","type":"select","sortdir":"NONE"}
			 * {"name":"amount","label":"Amount","type":"currency","function":"absoluteValue","sortdir":"NONE"}
			 * {"name":"entity","label":"Name","type":"select","sortdir":"NONE"}
			 * {"name":"custbody_pp_payment_method","label":"Avid Payment Method","type":"select","sortdir":"NONE"}
			 * {"name":"date","join":"systemNotes","label":"Printed Date","type":"datetime","sortdir":"NONE"}
			 */
		} catch (ex) {
			log.error({ title: 'Error in addResultsSublist', details: ex.message });
		}
	}

	return {
		onRequest: onRequest
	};
});
