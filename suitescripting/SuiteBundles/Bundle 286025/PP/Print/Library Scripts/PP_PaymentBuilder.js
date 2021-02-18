/**
 * This module contains the PPSPaymentBuilder class. The PPSPaymentBuilder collects all check information
 * for a print job.
 * 
 * Dependencies PPS_Lib_v1.js
 * Suitelet that uses PPSPaymentBuilder should have a PPDataHookPlugInType plugin set
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Aug 2013     maxm
 * 2.11.0.20  01/29/2018      sdonald			S19454 - User Preference Date Conversions
 * 2.13		  22 Jun 2018	  shale 		   Added Journal Entries to check stub lines, like bill credits
 * 2.16						  shale 			S25790 - changing how stublines work to no longer miss JEs applied to other Jes 
 												(and other things we cannot see without access to the credits applied sublist)
 */

function PPSPaymentBuilder(){
	
	var dataCallbackPlugin;
	if(typeof PPDataHookPlugInType != 'undefined'){
		dataCallbackPlugin = new PPDataHookPlugInType();
	}
	else{
		dataCallbackPlugin = new PluginStub();
	}
	 
	var context = nlapiGetContext();

	var subsidiariesEnabled = context.getFeature('SUBSIDIARIES');
	var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
	var amountField = 'amount';
	var appliedToLinkAmountField = 'appliedtolinkamount';
	var applyingLinkAmountField = 'applyinglinkamount';
	if(multiCurrencyEnabled){
		amountField = 'fxamount';
		appliedToLinkAmountField = 'appliedtoforeignamount';
		applyingLinkAmountField = 'applyingforeignamount';
	}
	var creditsAfterBillsPreference = context.getSetting('SCRIPT', 'custscript_pp_credits_after_bills') == 'T' ? true : false;
	
	var appliedTransactionIds = [];
	
	this.getData = function(transactionIds, isNewVersion){
		//transaction IDs here are bill payment IDs coming from the print check screen
		if (isNewVersion == '' || isNewVersion == null || isNewVersion == undefined) {
			isNewVersion = false;
		}
		nlapiLogExecution('debug', 'isNewVersion', isNewVersion);
		var ppPayments = [];
		var entityIds = [];
		//var appliedTransactionIds = [];
		var checkToEntityMap = {};
		
		var keys = Object.keys(transactionIds);
		var tranSearch = createTransactionSearch(keys);
		var tranResultSet = tranSearch.runSearch();
		
		var tranIdsByType = {
				'vendorpayment' : [],
				'check' : [],
				'customerrefund' : [],
				'customerpayment' : [],
				'checkstub' : []
		};
		var uCount = 0;
		var context = nlapiGetContext();
		tranResultSet.forEachResult(function(searchResult){
			var ppPayment = {stublines : []};
			var recType = searchResult.getRecordType();
			
			ppPayment.id = searchResult.getId();
			ppPayment.recordType = recType;
			ppPayment.checkNumber = searchResult.getValue('tranid');
			ppPayment.amount = Math.abs(searchResult.getValue(amountField)).toFixed(2);
			ppPayment.date = $PPS.formatNetSuiteDate(searchResult.getValue('trandate'));
			ppPayment.address = searchResult.getValue('billaddress');
			ppPayment.memo = searchResult.getValue('memo');
			ppPayment.accountId = searchResult.getValue('account');
			ppPayment.isAch = searchResult.getText('custbody_pp_payment_method') == 'ACH' || searchResult.getRecordType() == 'customerpayment' ? true : false;	
			ppPayment.signature1 = searchResult.getValue('custbody_pp_override_sig_a');
			ppPayment.signature2 = searchResult.getValue('custbody_pp_override_sig_b');
			ppPayment.checkStubInfo = searchResult.getValue('custbody_pp_check_stub_info');
			
			if(subsidiariesEnabled){
				ppPayment.subsidiaryId = searchResult.getValue('subsidiary');
			}
			
			if(ppPayment.isAch){
				var achAccount = {};
				achAccount['payeeEmail'] = searchResult.getValue('custrecord_pp_ach_payee_email', 'custbody_pp_ach_account');
				achAccount['routingNumber'] = searchResult.getValue('custrecord_pp_ach_routing_number', 'custbody_pp_ach_account');
				achAccount['achAccountNumber'] = searchResult.getValue('custrecord_pp_ach_account_number', 'custbody_pp_ach_account');
				achAccount['secCode'] = searchResult.getText('custrecord_pp_ach_sec_code', 'custbody_pp_ach_account');
				achAccount['depositWithdrawal'] = searchResult.getText('custrecord_pp_ach_deposit_withdrawal', 'custbody_pp_ach_account');
				if(!isValidDepositWithdrawalForRecordType(recType,achAccount['depositWithdrawal'])){
					throw(nlapiCreateError('PP_INVALID_DEPOSIT_WITHDRAWAL',achAccount['depositWithdrawal'] + ' ACH accounts are not valid for transactions of type ' +  recType + '. internalid: ' + ppPayment.id + ' tranid: ' + ppPayment.checkNumber));
				}

				achAccount['transactionCode'] = searchResult.getText('custrecord_pp_ach_transaction_code', 'custbody_pp_ach_account');
				// extended ach
				achAccount['glAccountNumber'] = searchResult.getValue('custrecord_pp_gl_account_number', 'custbody_pp_ach_account');
				achAccount['comment'] = searchResult.getValue('custrecord_pp_comment', 'custbody_pp_ach_account');
				achAccount['customLine1'] = searchResult.getValue('custrecord_pp_custom_line_1', 'custbody_pp_ach_account');
				achAccount['customLine2'] = searchResult.getValue('custrecord_pp_custom_line_2', 'custbody_pp_ach_account');
				achAccount['customLine3'] = searchResult.getValue('custrecord_pp_custom_line_3', 'custbody_pp_ach_account');
				achAccount['isoDestinationCurrencyCode'] = searchResult.getValue('custrecord_pp_iso_dest_curr_code', 'custbody_pp_ach_account');
				achAccount['isoDestinationCountryCode'] = searchResult.getValue('custrecord_pp_iso_dest_ctry_code', 'custbody_pp_ach_account');
				achAccount['receivingDFIName'] = searchResult.getValue('custrecord_pp_receiving_dfi_name', 'custbody_pp_ach_account');
				achAccount['receivingDFIIdQualifier'] = searchResult.getText('custrecord_pp_receiving_dfi_id_qualifier', 'custbody_pp_ach_account');
				achAccount['receivingDFIIdNumber'] = searchResult.getValue('custrecord_pp_receiving_dfi_id_number', 'custbody_pp_ach_account');
				achAccount['receivingDFIBranchCountryCode'] = searchResult.getValue('custrecord_pp_receiving_dfi_br_ctry_code', 'custbody_pp_ach_account');
				achAccount['iatTransactionTypeCode'] = searchResult.getText('custrecord_pp_trans_type_code', 'custbody_pp_ach_account');
				achAccount['receivingDFICity'] = searchResult.getValue('custrecord_pp_receiving_dfi_city', 'custbody_pp_ach_account');
				achAccount['receivingDFIPhone'] = searchResult.getValue('custrecord_pp_receiving_dfi_phone', 'custbody_pp_ach_account');
				achAccount['receivingDFIAddress'] = searchResult.getValue('custrecord_pp_receiving_dfi_address', 'custbody_pp_ach_account');
				
				ppPayment['achAccount'] = achAccount;
			}
			
			dataCallbackPlugin.paymentConversion(searchResult,ppPayment);
			//nlapiLogExecution('debug', 'ppPayment.id/amount', ppPayment.id + '/' + ppPayment.amount);
			ppPayments.push(ppPayment);
			
			var entityId = searchResult.getValue('entity');
			// collect entity ids since we cannot get everything what we want from the search
			entityIds.push(entityId);
			// map transactionId to entityId so we can hook them back up later
			checkToEntityMap[searchResult.getId()] = entityId;

			if (isNewVersion && (ppPayment.checkStubInfo != '' && ppPayment.checkStubInfo != undefined && ppPayment.checkStubInfo != null)) {
				tranIdsByType['checkstub'].push(ppPayment.id);	
				//nlapiLogExecution('debug', 'checkStub payment!', ppPayment.id);	
			} else {
				tranIdsByType[recType].push(ppPayment.id); //this will cover vendorpayments without a check stub info record and checks & other records
			}
			
			if(recType == 'vendorpayment' || recType == 'customerrefund'){
				ppPayment.stublineType = 'apbill';
			}
			else if(recType == 'check'){
				ppPayment.stublineType = 'apexpense';
			}
			return true;
		});
	
		//build new stublines
		//we should already have every transaction, so we should be able to just build stublines the same way for all.
		nlapiLogExecution('debug', 'ppPayments.length', ppPayments.length);
		nlapiLogExecution('debug', 'starting stubline checks', 'begin. Usage: ' + context.getRemainingUsage());

		var stublines = [];


		if(tranIdsByType.checkstub.length > 0){
			var i,j,temparray,chunk = 50;
			for (i=0,j=tranIdsByType.checkstub.length; i<j; i+=chunk) {
			    temparray = tranIdsByType.checkstub.slice(i,i+chunk);
			    nlapiLogExecution('debug', 'checkStub temparray', temparray.toString());
			 	nlapiLogExecution('debug', 'checkStub useage check', context.getRemainingUsage());
			    //stublines = stublines.concat(getVendorPaymentStublines(temparray));
			    stublines = stublines.concat(getCheckInfoStublines(temparray));
			}
		}

		//only the vendor payments will have the link to the checkstub info record, so that is the only one that needs to be rewritten here
		if(tranIdsByType.vendorpayment.length > 0){
			var i,j,temparray,chunk = 50;
			for (i=0,j=tranIdsByType.vendorpayment.length; i<j; i+=chunk) {
			    temparray = tranIdsByType.vendorpayment.slice(i,i+chunk);
			    nlapiLogExecution('debug', 'vendorpayment temparray', temparray.toString());
			    stublines = stublines.concat(getVendorPaymentStublines(temparray));
			    //stublines = stublines.concat(getVendorPaymentStublinesNew(temparray));
			}
		}
		nlapiLogExecution('debug', 'getData', 'done with getVandorPaymentStublines: ' + stublines.length);
		
		if(tranIdsByType.customerrefund.length > 0){
			var i,j,temparray,chunk = 50;
			for (i=0,j=tranIdsByType.customerrefund.length; i<j; i+=chunk) {
			    temparray = tranIdsByType.customerrefund.slice(i,i+chunk);
			    stublines = stublines.concat(getCustomerRefundStublines(temparray));
			}
		}
		nlapiLogExecution('debug', 'getData', 'done with getCustomerRefundStublines: ' + stublines.length);
		
		if(tranIdsByType.check.length){
			var i,j,temparray,chunk = 50;
			for (i=0,j=tranIdsByType.check.length; i<j; i+=chunk) {
			    temparray = tranIdsByType.check.slice(i,i+chunk);
			    stublines = stublines.concat(getCheckStublines(temparray));
			}
		}
		nlapiLogExecution('debug', 'done with stubline creation', 'done. Length: ' + stublines.length);
		
		// loop through stublines and inject them back into payments
		//nlapiLogExecution('debug', 'stublines.length', stublines.length);
		//nlapiLogExecution('debug', 'ppPayments.length', ppPayments.length);
		for(var i = 0; i < stublines.length; i++){
			var sl = stublines[i];
			for(var j = 0; j < ppPayments.length; j++){
				var ppp = ppPayments[j];
				if(ppp.id == sl.paymentId){
					ppp.stublines.push(sl);
					continue;
				}
			}
		}
		nlapiLogExecution('debug', 'done with stubline insertion', 'done');
		
		// get all entities
		var allEntityResults = entitySearch(entityIds);
		
		// convert vendors to pps format
		var ppVendors = ppVendorfy(allEntityResults);
		// get applied transaction extras
		
		//needed for all, to get customized information from plugins.
		appliedTransactionIds = array_unique(appliedTransactionIds);
		var appliedExtras = appliedTransactionExtras(appliedTransactionIds);
		
		// insert ppVendor and displayName into checks and inject each check into paymentsArr
		for(var i in ppPayments){
			var paymnt = ppPayments[i];
			var vk = checkToEntityMap[paymnt.id];
			
			var ppVendor = undefined;
			for(var ii in ppVendors){
				if(ppVendors[ii].id == vk){
					ppVendor = ppVendors[ii];
					break;
				}
			}
			if(typeof ppVendor == 'undefined'){
				$PPS.log('No vendor for transaction id ' + paymnt.id + ' and entity id ' + vk);
			}
			else{
				paymnt['payee'] = ppVendor['displayName'];
				paymnt['vendorId'] = ppVendor['id'];
				paymnt['vendor'] = ppVendor;
				
				// if first line of address is the payee name, strip it out so the payee name does not get duplicated on the check face
				var address = paymnt['address'];
				if(address){
					var addrArr = address.split(/\r{0,1}\n/);
					if(addrArr[0].toLowerCase()  == paymnt.payee.toLowerCase()){
						addrArr.shift();
					}
					paymnt['address'] = addrArr.join("\r\n");
				}
			}
			
			// if stublineType is apbill aka applied transactions inject extras
			if(paymnt.stublineType == 'apbill'){
				for(var ii = 0; ii < paymnt.stublines.length; ii++){
					var stubline = paymnt.stublines[ii];
					var extras = appliedExtras[stubline.doc];
					
					for(var k in extras){
						stubline[k] = extras[k];
					}
					paymnt.stublines[ii] = stubline;
				}
			}
			ppPayments[i] = paymnt;
		}
		
		dataCallbackPlugin.afterConversions(ppPayments,ppVendors);
		
		// sort by checkNumber
		ppPayments.sort(function(a,b){
			return a.checkNumber - b.checkNumber;
		});

		return {payments: ppPayments};
	};
	
	
	/**
	 * Retrieve and build applied items for customer payments
	 * 
	 * Uses 10-20 Governance units
	 * 
	 * @param {array} ids An array of transaction ids that are customer payments
	 * @returns {array} object An array of stubline objects
	 */
	function getCustomerRefundStublines(paymentIds){
		
		var stublines = [];
		var deferAmountDueIds = [];
		var columns = [];
		var filters = [];
		
		filters.push(new nlobjSearchFilter('type',null,'is','CustRfnd'));
		filters.push(new nlobjSearchFilter('mainline',null,'is','F'));
		filters.push(new nlobjSearchFilter('accounttype','applyingtransaction','is','AcctRec'));
		filters.push(new nlobjSearchFilter('internalid',null,'anyof',paymentIds));
		
		var amountPaid = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 1 then nvl({'+applyingLinkAmountField+'},0) else 0 end');
		columns.push(amountPaid);
		
		var discountAmt = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 2 then nvl({'+applyingLinkAmountField+'},0) else 0 end');
		columns.push(discountAmt);
		
		// have to sum with formula instead of group because group by applyingtransaction.amountremaining triggers error in OneWorld
		var amountRemainingCol = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 1 then nvl({applyingtransaction.amountremaining},0) else 0 end');
		columns.push(amountRemainingCol);
		
		// have to sum with formula instead of group because group by applyingtransaction.amount triggers error in OneWorld when multicurrency is not enabled
		var amountCol = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 1 then nvl({applyingtransaction.'+amountField+'},0) else 0 end');
		columns.push(amountCol);
		
		columns.push(new nlobjSearchColumn('internalid',null,'group'));
		columns.push(new nlobjSearchColumn('internalid','applyingtransaction','group'));
		columns.push(new nlobjSearchColumn('accounttype','applyingtransaction','group'));
		columns.push(new nlobjSearchColumn('tranid','applyingtransaction','group'));
		columns.push(new nlobjSearchColumn('memo','applyingtransaction','group'));
		columns.push(new nlobjSearchColumn('type','applyingtransaction','group'));
		columns.push(new nlobjSearchColumn('trandate','applyingtransaction','group'));
		columns.push(new nlobjSearchColumn('exchangerate','applyingtransaction','group'));

		var searchResults = nlapiSearchRecord('transaction', null, filters, columns);

		for(var i = 0; i < searchResults.length; i++){
			var ppStubline = {};
			var searchResult = searchResults[i];
			
			ppStubline.amount = searchResult.getValue(amountPaid);
			ppStubline.originalAmount = Math.abs(searchResult.getValue(amountCol)).toFixed(2);
			ppStubline.discountAmount = searchResult.getValue(discountAmt);
			ppStubline.internaltype = searchResult.getValue('type','applyingtransaction','group');
			ppStubline.type = searchResult.getText('type','applyingtransaction','group');
			ppStubline.refnum = searchResult.getValue('tranid','applyingtransaction','group');
			ppStubline.memo = searchResult.getValue('memo','applyingtransaction','group');
			ppStubline.date = $PPS.formatNetSuiteDate(searchResult.getValue('trandate','applyingtransaction','group'));
			ppStubline.doc = searchResult.getValue('internalid','applyingtransaction','group');
			
			if(ppStubline.memo == '- None -'){
				ppStubline.memo = '';
			}
			if(ppStubline.refnum == '- None -'){
				ppStubline.refnum = '';
			}
			ppStubline.paymentId = searchResult.getValue('internalid',null,'group');
			
			var amountRemaining = searchResult.getValue(amountRemainingCol);
			var exchangeRate = searchResult.getValue('exchangerate','applyingtransaction','group');
			$PPS.log(exchangeRate);
			if(exchangeRate == '1.00'){
				amountRemaining = parseFloat(amountRemaining);
				ppStubline.amountDue = amountRemaining  + parseFloat(ppStubline.amount) + parseFloat(ppStubline.discountAmount);
				ppStubline.amountDue = ppStubline.amountDue.toFixed(2);
			}
			else{
				// need to calculate amountRemaining since fxamountremaining is not cached and 
				// trying to convert the amountremaing to foreign currency can result in floating point errors off by one cent
				// amountRemaining = parseFloat(amountRemaining) / parseFloat(exchangeRate); 
				deferAmountDueIds.push(ppStubline.doc);
			}
			
			appliedTransactionIds.push(ppStubline.doc);
			stublines.push(ppStubline);
		}
		
		// Any appied items using a foreign currency will need to have their amount due calculated 
		if(deferAmountDueIds.length > 0){
			var srs = getFxamountPaidCR(deferAmountDueIds);
			if(srs){
				for(var i = 0; i < srs.length; i++){
					var sr = srs[i];
					var id = sr.getValue('internalid','applyingtransaction','group');
					
					for(var j = 0; j < stublines.length; j++){
						var stubline = stublines[j];
						if(id == stubline.doc){
							var amountPaidfx = parseFloat(sr.getValue(applyingLinkAmountField,null,'sum'));
							var amountRemaining = parseFloat(stubline.originalAmount) - amountPaidfx;
							stubline.amountDue = amountRemaining  + parseFloat(stubline.amount) + parseFloat(stubline.discountAmount);
							stubline.amountDue = stubline.amountDue.toFixed(2);
							continue;
						}
					}
				}
			}
		}
		
		return stublines;
	}
	

	function getCheckInfoStublines(paymentIds) {
		try {
			nlapiLogExecution('debug', 'starting getCheckInfoStublines', paymentIds.toString());
			var stublines = [];
			//get all check stub info ids, associate iwth payments
			var ciFilters = [new nlobjSearchFilter('internalid', null, 'anyof', paymentIds)
				, new nlobjSearchFilter('mainline', null, 'is', 'T')
			];
			var ciColumns = [new nlobjSearchColumn('internalid')
				, new nlobjSearchColumn('custbody_pp_check_stub_info')
				, new nlobjSearchColumn('custrecord_pp_apply_ids', 'custbody_pp_check_stub_info')
				, new nlobjSearchColumn('custrecord_pp_amount_list', 'custbody_pp_check_stub_info')
				, new nlobjSearchColumn('custrecord_pp_disc_list', 'custbody_pp_check_stub_info')
				, new nlobjSearchColumn('custrecord_pp_refnum_list', 'custbody_pp_check_stub_info')
			];
			var ciResults = nlapiSearchRecord('transaction', null, ciFilters, ciColumns);
			nlapiLogExecution('debug', 'ciResults.length', ciResults.length);

			for (var d = 0; d < ciResults.length; d++) {
				var ciResult = ciResults[d];
				var checkStubId = ciResult.getValue('custbody_pp_check_stub_info');
				var paymentId = ciResult.getValue('internalid');

				//get credit info lists
				//var fields = nlapiLookupField('customrecord_pp_check_stub_info', checkStubId, ['custrecord_pp_apply_ids', 'custrecord_pp_amount_list']);
				//var applyIds = fields['custrecord_pp_apply_ids'].split(',');
				var applyIds = ciResult.getValue('custrecord_pp_apply_ids', 'custbody_pp_check_stub_info').split(',');
				//var amountList = fields['custrecord_pp_amount_list'].split(',');
				var amountList = ciResult.getValue('custrecord_pp_amount_list', 'custbody_pp_check_stub_info').split(',');
				var discList = ciResult.getValue('custrecord_pp_disc_list', 'custbody_pp_check_stub_info').split(',');
				var refNumList = ciResult.getValue('custrecord_pp_refnum_list', 'custbody_pp_check_stub_info').split(','); //to pull BC notes when needed
				//nlapiLogExecution('debug', 'applyIds check', applyIds.toString());

				//create stublines, using lists from check info records for amounts
				stublines = stublines.concat(createCIStublines(checkStubId, paymentId, applyIds, amountList, discList, refNumList));
			}
			return stublines;
		} catch(ex) {
			nlapiLogExecution('error', 'Error in getVendorPaymentsSublinesNew', ex.message);
		}
	}

	function createCIStublines(checkStubId, paymentId, applyIds, amountList, discList, refNumList){
		try{
			// find applyIds for bill credits where there are Bill Credits that were independently applied. 
			// Their RefNum will be PREVIOUSLYAPPLIED
			var prevApplied = [];
			if (refNumList && refNumList.length > 0) {
				for (var r = 0; r < refNumList.length; r++) {
					if (refNumList[r] == 'PREVIOUSLYAPPLIED') {
						prevApplied.push(applyIds[r]);
						nlapiLogExecution('debug', 'previously applied bc found', applyIds[r]);
					}
				}
			}

			var stublines = [];
			
			var csFilters = [ new nlobjSearchFilter('internalid', null, 'anyof', applyIds)
				, new nlobjSearchFilter('mainline', null, 'is', 'T') //FIX?
			];
			var csColumns = [ new nlobjSearchColumn('type', null, 'group')
				, new nlobjSearchColumn('tranid', null, 'group')
				, new nlobjSearchColumn('trandate', null, 'group')
				, new nlobjSearchColumn('memo', null, 'group')
				, new nlobjSearchColumn('internalid', null, 'group')
				, new nlobjSearchColumn('total', null, 'sum')
			];
			
			if (multiCurrencyEnabled) {
				csColumns.push(new nlobjSearchColumn('fxamount', null, 'sum'));
				csColumns.push(new nlobjSearchColumn('fxamountremaining', null, 'sum'));
			} else {
				csColumns.push(new nlobjSearchColumn('total', null, 'sum'));
				csColumns.push(new nlobjSearchColumn('amountremaining', null, 'sum'));
			}

			var csResults = nlapiSearchRecord('transaction', null, csFilters, csColumns);
			nlapiLogExecution('debug', 'createCIStublines check', nlapiGetContext().getRemainingUsage());
			var resultsArray = [];
			for (var f = 0; f < csResults.length; f++) {
				var searchResult = csResults[f];
				if (searchResult != null && searchResult != undefined) {
					var resultId = searchResult.getValue('internalid', null, 'group');
					var resultInfo = {};
					resultInfo.id = searchResult.getValue('internalid', null, 'group');
					resultInfo.internaltype = searchResult.getValue('type', null, 'group');
					resultInfo.type = searchResult.getText('type', null, 'group');
					if (prevApplied.indexOf(resultId) != -1) {
						resultInfo.tranid = 'Prev. Applied ' + searchResult.getValue('tranid', null, 'group');
					} else {
					 	resultInfo.tranid = searchResult.getValue('tranid', null, 'group');
					}
					resultInfo.memo = searchResult.getValue('memo', null, 'group');
					resultInfo.trandate = searchResult.getValue('trandate', null, 'group');
					if (multiCurrencyEnabled) {
						resultInfo.total = searchResult.getValue('fxamount', null, 'sum');
						resultInfo.amountRemaining = searchResult.getValue('fxamountremaining', null, 'sum');

					} else {
						resultInfo.total = searchResult.getValue('total', null, 'sum');
						resultInfo.amountRemaining = searchResult.getValue('amountremaining', null, 'sum');
					}
					resultsArray[resultId] = resultInfo;
				}
			}
				
			for (var g = 0; g < applyIds.length; g++) {
				var ppStubline = {};
				var applyId = applyIds[g];
				var searchResult = resultsArray[applyId];

				ppStubline.amount = amountList[g];
				ppStubline.doc = applyId;
				ppStubline.internaltype = searchResult.internaltype;
				ppStubline.type = searchResult.type;
				ppStubline.refnum = searchResult.tranid;
				ppStubline.memo = searchResult.memo;
				ppStubline.date = $PPS.formatNetSuiteDate(searchResult.trandate);
				ppStubline.paymentId  = paymentId;
				ppStubline.discountAmount = discList[g];
				if (ppStubline.internaltype == 'VendBill') {
					ppStubline.originalAmount = Math.abs(searchResult.total).toFixed(2);
					var tempAmountRemaining = parseFloat(searchResult.amountRemaining);
					ppStubline.amountDue = tempAmountRemaining  + parseFloat(ppStubline.amount) + parseFloat(ppStubline.discountAmount);
					ppStubline.amountDue = ppStubline.amountDue.toFixed(2);
				}

				if(ppStubline.memo == '- None -'){
					ppStubline.memo = '';
				}
				if(ppStubline.refnum == '- None -'){
					ppStubline.refnum = '';
				}
				//nlapiLogExecution('debug', 'checkInfoStubline.doc/amount', ppStubline.doc + '/' + ppStubline.amount);
				stublines.push(ppStubline);
				appliedTransactionIds.push(ppStubline.doc);
			}
			return stublines;
		}catch(ex) {
			nlapiLogExecution('error', 'Error in createCIStublines', ex.message);
		}
	}


	function getVendorPaymentStublines(paymentIds){
		
		var stublines = [];
		var billIds = [];
		var deferAmountDueIds = [];
		var columns = [];
		var filters = [];
		
		filters.push(new nlobjSearchFilter('type',null,'is','VendPymt'));
		filters.push(new nlobjSearchFilter('mainline',null,'is','F'));
		filters.push(new nlobjSearchFilter('accounttype','appliedToTransaction','is','AcctPay'));
		filters.push(new nlobjSearchFilter('internalid',null,'anyof',paymentIds));

		var amountPaid = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 1 then nvl({'+appliedToLinkAmountField+'},0) else 0 end');
		columns.push(amountPaid);
		
		var discountAmt = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 2 then nvl({'+appliedToLinkAmountField+'},0) else 0 end');
		columns.push(discountAmt);
		
		// have to sum with formula instead of group because group by appliedToTransaction.amountremaining triggers error in OneWorld
		var amountRemainingCol = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 1 then nvl({appliedToTransaction.amountremaining},0) else 0 end');
		columns.push(amountRemainingCol);
		
		// have to sum with formula instead of group because group by appliedToTransaction.amount triggers error in OneWorld when multicurrency is not enabled
		var amountCol = new nlobjSearchColumn('formulacurrency',null,'sum').setFormula('case when {line} = 1 then nvl({appliedToTransaction.'+amountField+'},0) else 0 end');
		columns.push(amountCol);
		
		columns.push(new nlobjSearchColumn('internalid',null,'group'));
		columns.push(new nlobjSearchColumn('internalid','appliedToTransaction','group'));
		columns.push(new nlobjSearchColumn('accounttype','appliedToTransaction','group'));
		columns.push(new nlobjSearchColumn('tranid','appliedToTransaction','group'));
		columns.push(new nlobjSearchColumn('memo','appliedToTransaction','group'));
		columns.push(new nlobjSearchColumn('type','appliedToTransaction','group'));
		columns.push(new nlobjSearchColumn('trandate','appliedToTransaction','group'));
		columns.push(new nlobjSearchColumn('exchangerate','appliedToTransaction','group'));
		
		var search = nlapiCreateSearch('transaction', filters, columns);
		var resultSet = search.runSearch();

		var start = 0; //incluse start index
		var end = 1000; //exlusive end index
		
		while(true){
			var searchResults = resultSet.getResults(start,end);
			
			for(var i = 0; i < searchResults.length; i++){
				var ppStubline = {};
				var searchResult = searchResults[i];
				
				ppStubline.amount = searchResult.getValue(amountPaid);
				ppStubline.originalAmount = Math.abs(searchResult.getValue(amountCol)).toFixed(2);
				ppStubline.discountAmount = searchResult.getValue(discountAmt);
				ppStubline.internaltype = searchResult.getValue('type','appliedToTransaction','group');
				ppStubline.type = searchResult.getText('type','appliedToTransaction','group');
				ppStubline.refnum = searchResult.getValue('tranid','appliedToTransaction','group');
				ppStubline.memo = searchResult.getValue('memo','appliedToTransaction','group');
				ppStubline.date = $PPS.formatNetSuiteDate(searchResult.getValue('trandate','appliedToTransaction','group'));
				ppStubline.doc = searchResult.getValue('internalid','appliedToTransaction','group');
				
				if(ppStubline.memo == '- None -'){
					ppStubline.memo = '';
				}
				if(ppStubline.refnum == '- None -'){
					ppStubline.refnum = '';
				}
				ppStubline.paymentId = searchResult.getValue('internalid',null,'group');
				
				var amountRemaining = searchResult.getValue(amountRemainingCol);
				var exchangeRate = searchResult.getValue('exchangerate','appliedToTransaction','group');
				if(exchangeRate == '1.00'){
					amountRemaining = parseFloat(amountRemaining);
					ppStubline.amountDue = amountRemaining  + parseFloat(ppStubline.amount) + parseFloat(ppStubline.discountAmount);
					ppStubline.amountDue = ppStubline.amountDue.toFixed(2);
				}
				else{
					// need to calculate amountRemaining since fxamountremaining is not cached and 
					// trying to convert the amountremaing to foreign currency can result in floating point errors off by one cent
					// amountRemaining = parseFloat(amountRemaining) / parseFloat(exchangeRate); 
					deferAmountDueIds.push(ppStubline.doc);
				}
				
				// store bill ids so we can get bill credits later
				if(ppStubline.internaltype == 'VendBill'){
					billIds.push(ppStubline.doc);
				}
				
				appliedTransactionIds.push(ppStubline.doc);
				stublines.push(ppStubline);
			}
			
			if(searchResults.length < 1000){
				break;
			}
			start += 1000;
			end += 1000;
		}
	
		
		// Find all missing bills - A bill will become missing if a bill credit was applied to it that covered the total amount due
		// The amount paid should be the amount of the credit that was applied to the bill
		
		// Find all customrecord_pp_vendpymt_vendcreds for the payments 
		var filters = [];
		var columns = [];
		
		filters.push(new nlobjSearchFilter('custrecord_pp_offset_payment',null,'anyof',paymentIds));
		
		columns.push(new nlobjSearchColumn('custrecord_pp_offset_payment'));
		columns.push(new nlobjSearchColumn('custrecord_pp_offset_bill'));
		columns.push(new nlobjSearchColumn('custrecord_pp_offset_bill_credit'));
		
		var billCredits = [];
		var missingBillsSrs = [];
		var search2 = nlapiCreateSearch('customrecord_pp_vendpymt_vendcreds', filters, columns);
		var resultSet2 = search2.runSearch();

		start = 0; //incluse start index
		end = 1000; //exlusive end index
		
		while(true){
			var vendpymtVendcredsSrs = resultSet2.getResults(start,end);
			// Identify missing bills by comparing stublines to vendpymtVendcredsSrs
			
			if(vendpymtVendcredsSrs){
				for(var i = 0; i < vendpymtVendcredsSrs.length; i++){
					var sr = vendpymtVendcredsSrs[i];
					var found = false;
					for(var j = 0; j < stublines.length; j++){
						var stubline = stublines[j]; //stublines is a list of vendor payments at this point
						if(stubline.paymentId == sr.getValue('custrecord_pp_offset_payment') && stubline.doc == sr.getValue('custrecord_pp_offset_bill')){
							found = true;
							break;
						}
					}
					
					if(!found){
						missingBillsSrs.push(sr);
					}
				}
			}
			
			// Get all bill credits associated to payments
			billCredits = billCredits.concat(getVendorBillsCredits(vendpymtVendcredsSrs));

			
			if(vendpymtVendcredsSrs.length < 1000){
				break;
			}
			start += 1000;
			end += 1000;
		}
		
		if(missingBillsSrs.length > 0){
			// map billId to paymentId and array of creditIds
			var billsCredits = {};
			for(var i = 0; i < missingBillsSrs.length; i++){
				var mb = missingBillsSrs[i];
				var billId = mb.getValue('custrecord_pp_offset_bill');
				var creditId = mb.getValue('custrecord_pp_offset_bill_credit');
				
				if(!(billId in billsCredits)){
					billsCredits[billId] = {
							paymentId : mb.getValue('custrecord_pp_offset_payment'),
							creditIds : []
					};
				}
				(billsCredits[billId].creditIds).push(creditId);
				// add missing bills to appliedTransactionIds list
				appliedTransactionIds.push(billId);
			}
			
			// a small private function run in chunks below
			function getMissingBills(_bIds){
				var filters = [];
				var columns = [];
				
				filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
				filters.push(new nlobjSearchFilter('internalid',null,'anyof',_bIds));
				
				columns.push(new nlobjSearchColumn('total',null));
				columns.push(new nlobjSearchColumn('tranid',null));
				columns.push(new nlobjSearchColumn('discountamount',null));
				columns.push(new nlobjSearchColumn('type',null));
				columns.push(new nlobjSearchColumn('memo',null));
				columns.push(new nlobjSearchColumn('trandate',null));
				
				var srs = nlapiSearchRecord('transaction', null, filters, columns);
				
				if(srs){
					for(var i = 0; i < srs.length; i++){
						var ppStubline = {};
						var sr = srs[i];
						var billId = sr.getId();
						//var creditIds = billsCredits[billId].creditIds;
						var paymentId = billsCredits[billId].paymentId;
						
						ppStubline.amount = 0;
						ppStubline.originalAmount = Math.abs(sr.getValue('total')).toFixed(2);
						// bills with discounts applied actually get applied to payments
						ppStubline.discountAmount = '0.00';
						ppStubline.amount = "0.00";
						ppStubline.amountDue = "0.00";
						ppStubline.internaltype = sr.getValue('type');
						ppStubline.type = sr.getText('type');
						ppStubline.refnum = sr.getValue('tranid');
						ppStubline.memo = sr.getValue('memo');
						ppStubline.date = $PPS.formatNetSuiteDate(sr.getValue('trandate'));
						ppStubline.doc = sr.getId();
						ppStubline.paymentId  = paymentId;
						
						stublines.push(ppStubline);
						billIds.push(sr.getId());
					}
				}
			}
			
			var bIds = Object.keys(billsCredits);
			
			if(bIds.length > 0){
				var ii,jj,temparray,chunk = 1000;
				for (ii=0,jj=bIds.length; ii<jj; ii+=chunk) {
				    temparray = bIds.slice(ii,ii+chunk);
				    getMissingBills(temparray);
				}
			}
		}
		
	
		// Any appied items using a foreign currency will need to have their amount due calculated 
		if(deferAmountDueIds.length > 0){
			var srs = getFxamountPaid(deferAmountDueIds);
			if(srs){
				for(var i = 0; i < srs.length; i++){
					var sr = srs[i];
					var id = sr.getValue('internalid','appliedToTransaction','group');
					
					for(var j = 0; j < stublines.length; j++){
						var stubline = stublines[j];
						if(id == stubline.doc){
							var amountPaidfx = parseFloat(sr.getValue(appliedToLinkAmountField,null,'sum'));
							var amountRemaining = parseFloat(stubline.originalAmount) - amountPaidfx;
							stubline.amountDue = amountRemaining  + parseFloat(stubline.amount) + parseFloat(stubline.discountAmount);
							stubline.amountDue = stubline.amountDue.toFixed(2);
							continue;
						}
					}
				}
			}
		}
		
		
		//try to make this billcredits and JEs?
		for(var i = 0; i < billCredits.length; i++){
			appliedTransactionIds.push(billCredits[i].doc);
		}
		
		// Sync up bill credits with bills via paymentId and order bill credits after bills they were applied to
		var orderedStublines = [];
		for(var j = 0; j < stublines.length; j++){
			var stubline = stublines[j];
			orderedStublines.push(stubline);
			for(var i = 0; i < billCredits.length; i++){
				var billCredit = billCredits[i];
				if(billCredit.billId == stubline.doc && billCredit.paymentId == stubline.paymentId){ //bill, I think?
					// add bill credit amount to amountDue and amount
					stubline.amountDue = (parseFloat(stubline.amountDue) - parseFloat(billCredit.amount)).toFixed(2);
					stubline.amount = (parseFloat(stubline.amount) - parseFloat(billCredit.amount)).toFixed(2);
					orderedStublines.push(billCredit);
				}
			}
		}
		
		if(creditsAfterBillsPreference){
			return orderedStublines;
		}
		else{
			// group the bill credits back together since the same bill credit can be applied across multiple bills
			var billCreditsGrouped = groupBillCredits(billCredits);
			return stublines.concat(billCreditsGrouped);
		}		
	}
	
	/**
	 * Retrieve and build stublines for checks. 
	 * 
	 * Uses 10 Governance units
	 * 
	 * @param {array} ids An array of transaction ids that are checks
	 * @returns {array} object An array of stubline objects
	 */
	function getCheckStublines(paymentIds){
		var stublines = [];
		var columns = [];
		var filters = [];
		
		filters.push(new nlobjSearchFilter('type',null,'is','Check'));
		filters.push(new nlobjSearchFilter('mainline',null,'is','F'));
		filters.push(new nlobjSearchFilter('internalid',null,'anyof',paymentIds));
		
		columns.push(new nlobjSearchColumn('internalid',null));
		columns.push(new nlobjSearchColumn(amountField,null));
		columns.push(new nlobjSearchColumn('item',null));
		columns.push(new nlobjSearchColumn('type','item'));
		columns.push(new nlobjSearchColumn('memo',null));
		columns.push(new nlobjSearchColumn('account',null));
		columns.push(new nlobjSearchColumn('accounttype',null));

		var searchResults = nlapiSearchRecord('transaction', null, filters, columns);
		
		for(var i = 0; i < searchResults.length; i++){
			var ppStubline = {};
			var searchResult = searchResults[i];
			
			ppStubline.paymentId = searchResult.getValue('internalid');
			
			// use item to determine if it is an item or expense
			var item = searchResult.getText('item');
			if(item != ''){
				ppStubline.description = item;
				var itemType = searchResult.getValue('type','item');
				if(itemType == 'Subtotal' || itemType == 'Description'){
					continue;
				}
				else if(itemType == 'Discount'){
					ppStubline.amount = (-1 * Math.abs(searchResult.getValue(amountField))).toFixed(2);
				}
				else{
					ppStubline.amount = Math.abs(searchResult.getValue(amountField)).toFixed(2);
				}
			}
			else{
				ppStubline.description = searchResult.getValue('memo');
				ppStubline.amount = Math.abs(searchResult.getValue(amountField)).toFixed(2);
			}
			
			stublines.push(ppStubline);
		}
		return stublines;
	}
	
	/**
	 * Find all vendor credits applied to bills
	 * 
	 * @param {array} ids An array of searchResults of record type customrecord_pp_vendpymt_vendcreds
	 * @returns {array} object An array of stubline objects
	 */
	function getVendorBillsCredits(vendpymtVendcredsSrs){
		var billIds = [];
		var vendorCreditIds = [];
		var stublines = [];
		
		if(!vendpymtVendcredsSrs){
			return stublines;
		}

		for(var i = 0; i < vendpymtVendcredsSrs.length; i++){
			billIds.push(vendpymtVendcredsSrs[i].getValue('custrecord_pp_offset_bill'));
			vendorCreditIds.push(vendpymtVendcredsSrs[i].getValue('custrecord_pp_offset_bill_credit')); //includes JEs and vend credits
		}
		
		if(billIds.length == 0){
			return stublines;
		}
		
		// The same vendor credits can belong to multiple bills. Searching from the bill 
		// and joining to credits gives us which bill the credit belongs to
		// and how much of the credit was applied to the bill.
		// Also, the same vendor credit cannot be applied to the same vendor bill twice in NetSuite.
		var filters = [];
		var columns = [];

		filters.push(new nlobjSearchFilter('internalid',null,'anyof',billIds));
		filters.push(new nlobjSearchFilter('type','applyingtransaction','anyof',['VendCred', 'Journal']));
		filters.push(new nlobjSearchFilter('internalid','applyingtransaction','anyof',vendorCreditIds));
		// Have seen duplicate VendCred applied of applyinglinktype Purchase Return with null amount applied
		filters.push(new nlobjSearchFilter('applyinglinktype',null,'is','Payment')); //this works with applied JEs as well

		columns.push(new nlobjSearchColumn('internalid','applyingtransaction'));
		columns.push(new nlobjSearchColumn('type','applyingtransaction'));
		columns.push(new nlobjSearchColumn('tranid','applyingtransaction'));
		columns.push(new nlobjSearchColumn('trandate','applyingtransaction'));
		columns.push(new nlobjSearchColumn('memo','applyingtransaction'));
		columns.push(new nlobjSearchColumn(applyingLinkAmountField));

		var vendCredResults = nlapiSearchRecord('transaction',null,filters,columns);
		if(vendCredResults){
			for(var i = 0; i < vendCredResults.length; i++){
				var vendCredResult = vendCredResults[i];
				var ppStubline = {};
				ppStubline.billId = vendCredResult.getId();
				ppStubline.amount = -1 * parseFloat(vendCredResult.getValue(applyingLinkAmountField));
				ppStubline.amount = ppStubline.amount.toFixed(2);
				ppStubline.internaltype = vendCredResult.getValue('type','applyingtransaction');
				ppStubline.type = vendCredResult.getText('type','applyingtransaction');
				ppStubline.refnum = vendCredResult.getValue('tranid','applyingtransaction');
				ppStubline.memo = vendCredResult.getValue('memo','applyingtransaction');
				ppStubline.date = $PPS.formatNetSuiteDate(vendCredResult.getValue('trandate','applyingtransaction'));
				ppStubline.doc = vendCredResult.getValue('internalid','applyingtransaction');
				
				//figure out which payment the credit is associated to
				for(var j = 0; j < vendpymtVendcredsSrs.length; j++){
					var sr = vendpymtVendcredsSrs[j];
					if(sr.getValue('custrecord_pp_offset_bill') == ppStubline.billId && sr.getValue('custrecord_pp_offset_bill_credit') == ppStubline.doc){
						ppStubline.paymentId = sr.getValue('custrecord_pp_offset_payment');
						break;
					}
				}
				stublines.push(ppStubline);
			}
		}
		return stublines;
	}


	/**
	 * Calculate the foreign currency total amount paid on bills.
	 * 
	 * @param {array} ids An array of transaction ids
	 * @returns {array} nlobSearchResult
	 */
	function getFxamountPaid(ids){
		var filters = [];
		var columns = [];

		filters.push(new nlobjSearchFilter('internalid','appliedToTransaction','anyof',ids));

		columns.push(new nlobjSearchColumn('internalid','appliedToTransaction','group'));
		columns.push(new nlobjSearchColumn(appliedToLinkAmountField,null,'sum'));
		
		return nlapiSearchRecord('transaction',null,filters,columns);
	}
	
	/**
	 * Calculate the foreign currency total amount paid on transactions applied to customer refunds.
	 * 
	 * @param {array} ids An array of transaction ids
	 * @returns {array} nlobSearchResult
	 */
	function getFxamountPaidCR(ids){
		var filters = [];
		var columns = [];

		filters.push(new nlobjSearchFilter('internalid','applyingtransaction','anyof',ids));

		columns.push(new nlobjSearchColumn('internalid','applyingtransaction','group'));
		columns.push(new nlobjSearchColumn(applyingLinkAmountField,null,'sum'));
		
		return nlapiSearchRecord('transaction',null,filters,columns);
	}
	
	/**
	 * Creates AvidXchange(PPS) Vendor data objects. 
	 * 
	 * @param {array} searchResults An array of searchResults
	 * @returns {object} an object of vendors by entity internalId
	 */
	function ppVendorfy(searchResults){
		var vendorArr = [];
		for(var i = 0; i < searchResults.length; i++){
			var vendObj = {};
			var searchResult = searchResults[i];
			var printoncheckas = searchResult.getValue('printoncheckas');
			var ppPrintoncheckas = searchResult.getValue('custentity_pp_printoncheckas');
			var isperson = searchResult.getValue('isperson');

			vendObj['id'] = searchResult.getId();
			if(printoncheckas){
				//response.write("Use printoncheckas " + printoncheckas + '<br/>');
				vendObj['displayName'] = printoncheckas;
			}
			else if(ppPrintoncheckas){
				vendObj['displayName'] = ppPrintoncheckas;
			}
			else if(isperson && isperson == 'F'){
				//response.write("Use company name " + searchResult.getValue('companyname') + searchResult.id + '<br/>');
				//response.write("Company " + isperson + '<br/>');
				vendObj['displayName'] = searchResult.getValue('companyname');
			}
			else{
				//response.write("Use person name " + searchResult.id + '<br/>');
				
				var nameArr = [];
				var firstname = searchResult.getValue('firstname');
				var middlename = searchResult.getValue('middlename');
				var lastname = searchResult.getValue('lastname');
				
				//response.write("name = " + firstname + middlename + lastname + '<br/>');
				
				if(firstname){
					nameArr.push(firstname);
				}
				if(middlename){
					nameArr.push(middlename);
				}
				if(lastname){
					nameArr.push(lastname);
				}
				vendObj['displayName'] = nameArr.join(" ");
			}
			
			// if the displayName is still blank, use the entityid
			if(vendObj['displayName'] == ''){
				vendObj['displayName'] = searchResult.getValue('entityid');
			}
			
			vendObj['entityId'] = searchResult.getValue('entityid');
			vendObj['accountNumber'] = searchResult.getValue('accountnumber');
			
			dataCallbackPlugin.vendorConversion(searchResult,vendObj);
			
			vendorArr.push(vendObj);
		}
		return vendorArr;
	}
	
	/**
	 * @param {array} transactionIds An array of transaction internal ids
	 * @returns {nlapiSearchObject}
	 */
	function createTransactionSearch(transactionIds){
		// build the transaction search
		var columns = [];
		var filters = [];
		
		columns.push(new nlobjSearchColumn('mainline', null));
		columns.push(new nlobjSearchColumn('entity', null));
		columns.push(new nlobjSearchColumn('tranid', null));
		columns.push(new nlobjSearchColumn('account', null));
		columns.push(new nlobjSearchColumn(amountField, null));
		columns.push(new nlobjSearchColumn('total', null));
		columns.push(new nlobjSearchColumn('trandate', null));
		columns.push(new nlobjSearchColumn('memo', null));
		columns.push(new nlobjSearchColumn('memomain', null));
		columns.push(new nlobjSearchColumn('billaddress', null));
		columns.push(new nlobjSearchColumn('custbody_pp_payment_method',null));
		columns.push(new nlobjSearchColumn('custbody_pp_override_sig_a',null));
		columns.push(new nlobjSearchColumn('custbody_pp_override_sig_b',null));
		columns.push(new nlobjSearchColumn('custbody_pp_check_stub_info', null));
		
		if(subsidiariesEnabled){
			columns.push(new nlobjSearchColumn('subsidiary', null));
		}
		
		//columns.push(new nlobjSearchColumn('balance','account'));
		//columns.push(new nlobjSearchColumn('number','account'));
		
		// ACH fields
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_payee_email', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_routing_number', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_account_number', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_sec_code', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_transaction_code', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_ach_deposit_withdrawal', 'custbody_pp_ach_account'));
		
		columns.push(new nlobjSearchColumn('custrecord_pp_gl_account_number', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_comment', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_custom_line_1', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_custom_line_2', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_custom_line_3', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_iso_dest_curr_code', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_iso_dest_ctry_code', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_receiving_dfi_name', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_receiving_dfi_id_qualifier', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_receiving_dfi_id_number', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_receiving_dfi_br_ctry_code', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_trans_type_code', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_receiving_dfi_city', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_receiving_dfi_phone', 'custbody_pp_ach_account'));
		columns.push(new nlobjSearchColumn('custrecord_pp_receiving_dfi_address', 'custbody_pp_ach_account'));
		
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', transactionIds));
		filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
		
		dataCallbackPlugin.beforeTransactionSearch(columns,filters);
		return nlapiCreateSearch('transaction', filters, columns); 
	}
	
	function appliedTransactionExtras(ids){
		var columns = [];
		var results = {};
		
		if(typeof ids == 'undefined' || ids.length == 0){
			return results;
		}
		
		dataCallbackPlugin.beforeAppliedExtrasSearch(columns,filters);
		
		// only run search if plugin set a column in beforeAppliedExtrasSearch
		if(columns.length > 0){
			
			var i,j,temparray,filters,chunk = 1000;
			for (i=0,j=ids.length; i<j; i+=chunk) {
				nlapiLogExecution('DEBUG', 'chunk', i + ' - ' + i + chunk);
			    temparray = ids.slice(i,i+chunk);
			    filters = [];
				filters.push(new nlobjSearchFilter('internalid', null, 'anyof', temparray));
				filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
			    
			    var search = nlapiCreateSearch('transaction', filters, columns);
				var resultSet = search.runSearch();
				if(resultSet){
					resultSet.forEachResult(function(searchResult){
						var obj = {};
						dataCallbackPlugin.appliedExtrasConversion(searchResult,obj);
						results[searchResult.getId()] = obj;
						return true;
					}); 
				}
			}
	
		}
		return results;
	}
	
	/**
	 * @param {array} entityIds An array of entity internal ids
	 * @returns {array} an array of searchResults
	 */
	function entitySearch(entityIds){
		
		var entityIdsByType = {
				vendors: [],
				customers: [],
				employees: []
		};
		
		// search unknown entities for there type and put into entityIds objects
		if(entityIds.length > 0){
			var entitySearchColumns = [new nlobjSearchColumn('type', null)]; 
			var entitySearchFilters = [new nlobjSearchFilter('internalid',null, 'anyof', entityIds)];
			var entities = nlapiSearchRecord('entity',null,entitySearchFilters,entitySearchColumns);
			
			var numEntities = entities.length;
			for(var i = 0; i < numEntities; i++){
				var entity = entities[i];
				var entityId = entity.id;
				switch(entity.recordType){
					case 'vendor':
						entityIdsByType.vendors.push(entityId);
						break;
					case 'customer':
						entityIdsByType.customers.push(entityId);
						break;
					case 'employee':
						entityIdsByType.employees.push(entityId);
						break;
					default:
						entityIdsByType.vendors.push(entityId);
						entityIdsByType.customers.push(entityId);
						break;
				}
			}
		}
		
		// search on each entity type(vendors,customers,employees)
		var allEntityResults = new Array();
		
		if(entityIdsByType.customers.length > 0){
			allEntityResults = allEntityResults.concat(customerSearch(entityIdsByType.customers) || []);
		}
		if(entityIdsByType.vendors.length > 0){
			allEntityResults = allEntityResults.concat(vendorSearch(entityIdsByType.vendors) || []);
		}
		if(entityIdsByType.employees.length > 0){
			allEntityResults = allEntityResults.concat(employeeSearch(entityIdsByType.employees) || []);
		}
		return allEntityResults;
	}

	function pushSharedColumns(columns){
		columns.push(new nlobjSearchColumn('firstname', null));
		columns.push(new nlobjSearchColumn('middlename', null));
		columns.push(new nlobjSearchColumn('lastname', null));
		columns.push(new nlobjSearchColumn('entityid', null));
	}
	
	/**
	 * @param {array} ids
	 * @returns {array} an array of searchResults
	 */
	function customerSearch(ids){
		var columns = [];
		var filters = [];
		
		pushSharedColumns(columns);
		
		columns.push(new nlobjSearchColumn('isperson', null));
		columns.push(new nlobjSearchColumn('companyname', null));
		columns.push(new nlobjSearchColumn('accountnumber', null));
		columns.push(new nlobjSearchColumn('custentity_pp_printoncheckas', null));
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
		
		dataCallbackPlugin.beforeEntitySearch('customer',columns,filters);
		
		return nlapiSearchRecord('customer',null,filters,columns);
	}

	/**
	 * @param {array} ids
	 * @returns {array} an array of searchResults
	 */
	function vendorSearch(ids){
		var columns = [];
		var filters = [];
		
		pushSharedColumns(columns);
		
		columns.push(new nlobjSearchColumn('isperson', null));
		columns.push(new nlobjSearchColumn('companyname', null));
		columns.push(new nlobjSearchColumn('printoncheckas', null));
		columns.push(new nlobjSearchColumn('accountnumber', null));
		
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
		
		dataCallbackPlugin.beforeEntitySearch('vendor',columns,filters);
		
		return nlapiSearchRecord('vendor',null,filters,columns);
	}
	

	/**
	 * @param {array} ids
	 * @returns {array} an array of searchResults
	 */
	function employeeSearch(ids){
		var columns = [];
		var filters = [];
		
		pushSharedColumns(columns);
		
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', ids));
		
		dataCallbackPlugin.beforeEntitySearch('employee',columns,filters);
		
		return nlapiSearchRecord('employee',null,filters,columns);
	}
	
	
	/**
	 * @param {string} recType - The record type of the record
	 * @param {string} depositOrWithdrawal - If the ACH account is 'Deposit' or 'Withdrawal'
	 * @returns {bool}
	 */
	function isValidDepositWithdrawalForRecordType(recType,depositOrWithdrawal){
		if(depositOrWithdrawal == 'Withdrawal' && recType != 'customerpayment'){
			return false;
		}
		else if(depositOrWithdrawal == 'Deposit' && recType == 'customerpayment'){
			return false;
		}
		return true;
	}
	
	/**
	 * Group bill credits back together by payment
	 * 
	 * @param billCredits {Array}
	 * @returns {Array}
	 */
	function groupBillCredits(billCredits){
		var billCreditsGrouped = [];
		var bc = null;
		
		for(var i = 0; i < billCredits.length; i++){
			bc = billCredits[i];
			var bcg = null;
			var f = false;
			for(var j = 0; j < billCreditsGrouped.length; j++){
				bcg = billCreditsGrouped[j];
				if(bcg.doc == bc.doc && bcg.paymentId == bc.paymentId){
					bcg.amount = (parseFloat(bcg.amount) + parseFloat(bc.amount)).toFixed(2);
					f = true;
					break;
				}
			}
			if(!f){
				billCreditsGrouped.push(bc);
			}
		}
		return billCreditsGrouped;
	}
	
}

/*
 * In case plugin is set to testing.
 */
function PluginStub(){
	this.beforeTransactionSearch = function(columns,filters){};
	this.paymentConversion = function(searchResult,paymentObj){};
	this.beforeEntitySearch = function(searchType,columns,filters){};
	this.vendorConversion = function(searchResult,vendorObj){};
	this.beforeAppliedExtrasSearch = function(columns,filters){};
	this.appliedExtrasConversion = function(searchResult,transExtraObj){};
	this.afterConversions = function(payments, vendors){};
}