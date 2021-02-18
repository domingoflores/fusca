/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Feb 2013     jasonfoglia
 *
 */
$PPS.debug = true;
$PPS.where = 'PP_SL_Test';
function suiteletSaved(){
	var filters = [];
	filters.push(new nlobjSearchFilter('internalid',null, 'anyof', ['1283','1211','1237']));
	var searchResults = nlapiSearchRecord('transaction', 'customsearch72', filters, null);
	
	var bob = 1;
	
}

function getLotsOfTransactionIds(){
	var columns = [];
	var filterExpression = [['mainline', 'is', 'T'],
	                        'and',[
	                        ['recordtype','is','check'],
	                        'or',
	                        ['recordtype','is','vendorpayment'],
	                        'or',
	                        ['recordtype','is','customerrefund']]
	                        
	                        ];
	
	columns.push(new nlobjSearchColumn('mainline', null));
	var results = nlapiSearchRecord('transaction',null,filterExpression,columns);
	
	var numResults = results.length;
	var ids = [];
	for(var i = 0; i < numResults; i++){
		ids.push(results[i].id);
	}
	return ids;
	
}

function testSS(){
	var tranIdsObj = {'1382':'p', '1380':'c', '1320':'r'};
	
	var job = {
            //jobid: jobid,
            achcount: 0,
            itemcount: 0,
            jobstatus: "",
            fileurl: "",
            overflowcount: 0,
            itemsprinted: 0,
            itemsprocessed: 0,
            voidcount: 0,
            internal_ids: tranIdsObj
        };
	
	var rec = nlapiCreateRecord('customrecord_pp_print_status');
    // need to populate this now because the method is doing common work between create and update
    rec.setFieldValue("custrecord_pp_ps_created_date", nlapiDateToString(new Date()));
	
	function setData(_rec, job) {
	    _rec.setFieldValue("custrecord_pp_ps_status_date", nlapiDateToString(new Date(), 'datetimetz'));
	    _rec.setFieldValue("custrecord_pp_ps_status", job.jobstatus.toString());
	    _rec.setFieldValue("custrecord_pp_ps_itemcount", job.itemcount);
	    _rec.setFieldValue("custrecord_pp_ps_fileurl", job.fileurl.toString());
	    _rec.setFieldValue("custrecord_pp_ps_internal_ids", JSON.stringify(job.internal_ids));
	    _rec.setFieldValue("custrecord_pp_ps_internal_ids_processing", JSON.stringify(job.internal_ids));
	    return nlapiSubmitRecord(_rec);
	}
	
	var printStatusJobId = setData(rec,job);
	
	//Fire off scheduled script to set checks as printed
    var status = nlapiScheduleScript("customscript_pp_ss_buildandsendpayment", "customdeploy_pp_ss_buildandsendpayment",
			{ "custscript_pp_print_status_list_id": 		printStatusJobId
	      	  }
	);
	
}

function deleteAllVendPymtVendcredRecs(){
	var recs = nlapiSearchRecord('customrecord_pp_vendpymt_vendcreds');

	for(var i  = 0; i < recs.length; i++){
		nlapiDeleteRecord('customrecord_pp_vendpymt_vendcreds', recs[i].getId());
	}
}


function deleteAllMassPayRecs(){
	var recs = nlapiSearchRecord('customrecord_pp_paypal_mp_transactions');

	for(var i  = 0; i < recs.length; i++){
		nlapiDeleteRecord('customrecord_pp_paypal_mp_transactions', recs[i].getId());
	}
	
	var recs = nlapiSearchRecord('customrecord_pp_paypal_mass_payments');

	for(var i  = 0; i < recs.length; i++){
		nlapiDeleteRecord('customrecord_pp_paypal_mass_payments', recs[i].getId());
	}
}

function deleteApprovalStatus(id){
	var filters = [
		              new nlobjSearchFilter('memorized', null, 'is', 'F'),
		              new nlobjSearchFilter('type', null, 'anyof', ['VendPymt', 'CustRfnd', 'Check']),
		              new nlobjSearchFilter('custbody_pp_approval_status', null, 'is', id)
		          ];        

	var searchResults = nlapiSearchRecord('transaction',null,filters,null);
	
	
	if(searchResults){
		var numResults = searchResults.length;
		for(var i = 0; i < numResults; i++){
			nlapiSubmitField(searchResults[i].getRecordType(),searchResults[i].getId(),'custbody_pp_approval_status',null);
		}
	}
	
	nlapiDeleteRecord('customrecord_pp_pmt_approval_status', id)
}

function suitelet(request, response){
	var context = nlapiGetContext();
	
	var form = nlapiCreateForm('Payment Builder Test', false);
	    
	var ids = request.getParameter('custpage_tranids');
	var tranidsField = form.addField('custpage_tranids', 'text', 'Transaction Ids');
	tranidsField.setDefaultValue(ids);
	tranidsField.setHelpText("A comma separated list of transaction internal ids", false);
	
    if(request.getMethod() == 'POST'){    	
    	if(ids){
    		ids = ids.split(',');

    		var filters = [
    			new nlobjSearchFilter('internalid', null,'anyof',ids),
    			new nlobjSearchFilter('mainline', null,'is','T') 
    		             ];
    		var columns = [
    		    new nlobjSearchColumn('type')
    		               ];
    		var results = nlapiSearchRecord('transaction', null, filters, columns);
    		var tranIdsObj = {};
    		for(var i in results){
    			tranIdsObj[results[i].getId()] = $PPS.Transaction.convertToShortType(results[i].getValue('type'));
    		}
    		$PPS.log(tranIdsObj);

        	var ppsPaymentBuilder = new PPSPaymentBuilder();
        	var ppsObj = ppsPaymentBuilder.getData(tranIdsObj);
        	
        	var jsonDataField = form.addField('custpage_jsondata', 'textarea', 'JSON Data');
        	jsonDataField.setDefaultValue(JSON.stringify(ppsObj));
        
    	}
    	
    	//response.write(JSON.stringify(ppsObj));
    	
    }
    
    
	form.addSubmitButton('Submit');
    
    response.writePage(form);

	$PPS.log("*** End ***");
	//var transactionIds = getLotsOfTransactionIds();
	//var transactionIds = ['1270','1283','1211','1237','1244','1303'];
	//var transactionIds = ['1379','1315','1380','1306'];
	//var transactionIds = ['1382'];
	
	//var tranIdsObj = {'1382':'p', '1380':'c', '1320':'r', '1237' : 'p'};
	//var tranIdsObj = {'995':'c'};
	//var tranIdsObj = {'1244':'p'};
	
	
	//var ppsPaymentBuilder = new PPSPaymentBuilder();
	//var ppsObj = ppsPaymentBuilder.getData(tranIdsObj);
	
	//response.write("pow");
	//var url = $PPS.nlapiOutboundSSO();
	//response.write(url);
    //var resp = $PPS.NSRestReq(url, '{}', $PPS.httpVerbs.get);
	//response.write(resp.httpBody);
	
	
	
	
}




/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suiteletOld(request, response){
	
	
	//var parent = nlapiCreateRecord('customrecord_pp_payment_parent');
	
	
	var parentId = '10';
	var parent = nlapiLoadRecord('customrecord_pp_payment_parent', parentId);
	//var f = parent.getAllFields();
	//response.write(f.join(','));
	//afnLog('here',true,nlapiGetLineItemCount('recmachcustbody_pp_parent_record'));
	
	
	response.write(parent.getLineItemCount('recmachcustrecord_pp_payment_parent') + '<br/>');
	/*response.write(parent.getLineItemCount('recmachcustbody_pp_parent_record'));
	response.write(parent.getLineItemCount('custbody_pp_parent_record'));*/
	parent.selectNewLineItem('recmachcustrecord_pp_payment_parent');
	
	/*parent.setCurrentLineItemValue('rechmachcustrecord_pp_payment_parent', 'id', '1237');*/
	parent.setCurrentLineItemValue('recmachcustrecord_pp_payment_parent', 'custrecord_pp_transaction', '1237');
	parent.commitLineItem('recmachcustrecord_pp_payment_parent');
	
	nlapiSubmitRecord(parent);
	
	//var paymentRecords = nlapiLoadRecord('customrecord_pp_payment_parent', 1);
	
	/*if(paymentRecords != null){
	 response.write( JSON.stringify({
		 "paymentRecords":paymentRecords, 
		 "lineItem":paymentRecords.getLineItemCount('recmachcustbody_pp_parent_record') | ""
		 }
	 , null, "\t"));//paymentRecords.getLineItemCount('recmachcustbody_pp_parent_record') );
	}*/
}


/*
var paymentRecords = nlapiLoadRecord('customrecord_parent_record', 1);

if(paymentRecords != null){
	var count = paymentRecords.getLineItemCount('recmachcustbody_child_record');
	/// count = 0
	var count = paymentRecords.getLineItemCount('custbody_child_record');
	/// count = 0
}
var count = nlapiGetLineItemCount('recmachcustbody_pp_parent_record')
/// count = -1
var count = nlapiGetLineItemCount('custbody_child_record')
/// count = -1
*/



function PPSPaymentBuilderOld(){
	
	var dataCallbackPlugin = new PPDataHookPlugInType();
	/**
	 * Builds the data object 
	 * 
	 * @param {array} transactionIds An array of transactionIds
	 * @returns {object} returns an javascript object that can be passed to PPS
	 */
	this.getData = function(transactionIds){
		
		var search = createTransactionSearch(transactionIds);
		var resultSet = search.runSearch();	
		
		var checkToEntityMap = {};
		var entityIds = [];
		
		// extract transaction data
		var checks = {};
		resultSet.forEachResult(function(searchResult){
			var mainline = searchResult.getValue('mainline');
			var check = checks[searchResult.id];
			
			// set defaults
			if(typeof check == 'undefined'){
				check = {
						stublines : []
				};
			}
			
			// Main transaction
			if(mainline == '*'){
				check['checkNumber'] = searchResult.getValue('tranid');
				check['amount'] = Math.abs(searchResult.getValue('total')).toFixed(2);
				check['date'] = searchResult.getValue('trandate');
				check['address'] = searchResult.getValue('billaddress');
				check['memo'] = searchResult.getValue('memo');
				check['accountNumber'] = searchResult.getValue('number','account');
				check['accountBalance'] = searchResult.getValue('balance','account');
				
				dataCallbackPlugin.paymentConversion(searchResult,check);
				
				var entityId = searchResult.getValue('entity');
				// collect entity ids since we cannot get everything what we want from the search
				entityIds.push(entityId);
				// map transactionId to entityId so we can hook them back up later
				checkToEntityMap[searchResult.id] = entityId;
			}
			else{
				var lineItem = {};
				
				// applylist item, item or expense 
				if(searchResult.recordType == 'check'){
					lineItem['amount'] = Math.abs(searchResult.getValue('amount')).toFixed(2);
					lineItem['description'] = searchResult.getValue('memo');
					check['stublineType'] = 'apexpense';
					//lineItem['accountName'] = searchResult.getText('account');
				}
				else if(searchResult.recordType == 'vendorpayment'){
					lineItem['total'] = Math.abs(searchResult.getValue('amount', 'appliedToTransaction')).toFixed(2);
					lineItem['amount'] = Math.abs(searchResult.getValue('appliedtolinkamount')).toFixed(2);
					lineItem['discountamount'] = searchResult.getValue('discountamount', 'appliedToTransaction');
					//lineItem['discountdate'] = searchResult.getValue('discountdate', 'appliedToTransaction');
					
					var due = new Number(searchResult.getValue('amountremaining', 'appliedToTransaction')) + new Number(lineItem['amount']);
					lineItem['due'] = due.toFixed(2);
					lineItem['applyTranDate'] = searchResult.getValue('trandate', 'appliedToTransaction');
					lineItem['memo'] = searchResult.getValue('memomain', 'appliedToTransaction');
					lineItem['refNum'] = searchResult.getValue('tranid', 'appliedToTransaction');
					check['stublineType'] = 'apbill';
				}
				else if(searchResult.recordType == 'customerrefund'){
					lineItem['total'] = Math.abs(searchResult.getValue('amount', 'applyingTransaction')).toFixed(2);
					lineItem['amount'] = Math.abs(searchResult.getValue('applyinglinkamount')).toFixed(2);
					var due = new Number(searchResult.getValue('amountremaining', 'applyingTransaction')) + new Number(lineItem['amount']);
					lineItem['due'] = due.toFixed(2);
					lineItem['applyTranDate'] = searchResult.getValue('trandate', 'applyingTransaction');
					lineItem['memo'] = searchResult.getValue('memomain', 'applyingTransaction');
					lineItem['refNum'] = searchResult.getValue('tranid', 'applyingTransaction');
					check['stublineType'] = 'apbill';
				}
				
				dataCallbackPlugin.lineItemConversion(searchResult,lineItem);
				check['stublines'].push(lineItem);
			}
			checks[searchResult.id] = check; 
			return true;
		});
		
		// get all entities
		var allEntityResults = entitySearch(entityIds);
		
		// convert vendors to pps format
		var ppVendors = ppVendorfy(allEntityResults);
		
		// insert ppVendor and displayName into checks and inject each check into paymentsArr 
		var paymentsArr = [];
		for(var k in checks){
			var vk = checkToEntityMap[k];
			
			var ppVendor;
			for(var i in ppVendors){
				if(ppVendors[i].id == vk){
					ppVendor = ppVendors[i];
					break;
				}
			}
			if(typeof ppVendor == 'undefined'){
				response.write('No vendor for transaction id ' + k + ' and entity id ' + vk);
			}
			else{
				checks[k]['payee'] = ppVendor['displayName'];
				checks[k]['vendorId'] = ppVendor['id'];
				
				// if first line of address is the payee name, strip it out so the payee name does not get duplicated on the check face
				var address = checks[k]['address'];
				var addrArr = address.split(/\r{0,1}\n/);
				if(addrArr[0]  == paymnt.payee){
					addrArr.shift();
				}
				checks[k]['address'] = addrArr.join("\r\n");
				//checks[k]['vendor'] = ppVendor;
			}
			paymentsArr.push(checks[k]);
		}
		
		
		// sort by checkNumber
		paymentsArr.sort(function(a,b){
			return a.checkNumber - b.checkNumber;
		});
		//response.write("Checks produced: " + paymentsArr.length + "<br/>");
		//response.write(JSON.stringify(paymentsArr));	
		//response.write(JSON.stringify(checks));
		//var bob = 1;
		return {payments: paymentsArr, vendors: ppVendors};
	}
	
	/**
	 * Creates PiraclePay Vendor data objects. 
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
			var isperson = searchResult.getValue('isperson');

			vendObj['id'] = searchResult.getId();
			if(printoncheckas){
				//response.write("Use printoncheckas " + printoncheckas + '<br/>');
				vendObj['displayName'] = printoncheckas;
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
			
			vendObj['vendorAccountNumber'] = searchResult.getValue('accountnumber');
			// ach 
			vendObj['payeeEmail'] = searchResult.getValue('custentity_pp_ach_payee_email');
			vendObj['routingNumber'] = searchResult.getValue('custentity_pp_ach_routing_number');
			vendObj['achAccountNumber'] = searchResult.getValue('custentity_pp_ach_account_number');
			vendObj['achEnabled'] = (searchResult.getValue('custentity_pp_ach_enabled') == 'T');
			vendObj['secCode'] = searchResult.getText('custentity_pp_ach_sec_code');
			//vendObj['depositWithdrawal'] = searchResult.getText('custentity_pp_ach_deposit_withdrawal');
			vendObj['transactionCode'] = searchResult.getText('custentity_pp_ach_transaction_code');
			// extended ach
			vendObj['glAccountNumber'] = searchResult.getValue('custentity_pp_gl_account_number');
			vendObj['comment'] = searchResult.getValue('custentity_pp_comment');
			vendObj['customeLine1'] = searchResult.getValue('custentity_pp_custom_line_1');
			vendObj['customeLine2'] = searchResult.getValue('custentity_pp_custom_line_2');
			vendObj['customeLine3'] = searchResult.getValue('custentity_pp_custom_line_3');
			vendObj['isoDestinationCurrencyCode'] = searchResult.getValue('custentity_pp_iso_dest_curr_code');
			vendObj['isoDestinationCountryCode'] = searchResult.getValue('custentity_pp_iso_dest_ctry_code');
			vendObj['receivingDFIName'] = searchResult.getValue('custentity_pp_receiving_dfi_name');
			vendObj['receivingDFIIdQualifier'] = searchResult.getText('custentity_pp_receiving_dfi_id_qualifier');
			vendObj['receivingDFIIdNumber'] = searchResult.getValue('custentity_pp_receiving_dfi_id_number');
			vendObj['receivingDFIBranchCountryCode'] = searchResult.getValue('custentity_pp_receiving_dfi_br_ctry_code');
			vendObj['iatTransactionTypeCode'] = searchResult.getText('custentity_pp_trans_type_code');
			
			
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
		columns.push(new nlobjSearchColumn('amount', null));
		columns.push(new nlobjSearchColumn('total', null));
		columns.push(new nlobjSearchColumn('trandate', null));
		columns.push(new nlobjSearchColumn('memo', null));
		columns.push(new nlobjSearchColumn('memomain', null));
		columns.push(new nlobjSearchColumn('billaddress', null));
		
		columns.push(new nlobjSearchColumn('balance','account'));
		columns.push(new nlobjSearchColumn('number','account'));
		
		
		//applied transactions
		columns.push(new nlobjSearchColumn('memomain', 'appliedToTransaction')); //memo 
		columns.push(new nlobjSearchColumn('trandate', 'appliedToTransaction')); //applyTranDate
		columns.push(new nlobjSearchColumn('tranid', 'appliedToTransaction')); //refNum
		columns.push(new nlobjSearchColumn('amount', 'appliedToTransaction')); //amount
		columns.push(new nlobjSearchColumn('amountremaining', 'appliedToTransaction'));
		columns.push(new nlobjSearchColumn('type', 'appliedToTransaction'));
		columns.push(new nlobjSearchColumn('discountamount', 'appliedToTransaction'));
		//columns.push(new nlobjSearchColumn('discountdate', 'appliedToTransaction'));
		
		//applying transactions
		columns.push(new nlobjSearchColumn('memomain', 'applyingTransaction')); //memo 
		columns.push(new nlobjSearchColumn('trandate', 'applyingTransaction')); //applyTranDate
		columns.push(new nlobjSearchColumn('tranid', 'applyingTransaction')); //refNum
		columns.push(new nlobjSearchColumn('amount', 'applyingTransaction')); //amount
		columns.push(new nlobjSearchColumn('amountremaining', 'applyingTransaction'));
		//columns.push(new nlobjSearchColumn('type', 'applyingTransaction'));
		
		columns.push(new nlobjSearchColumn('appliedtolinkamount', null));
		columns.push(new nlobjSearchColumn('appliedtolinktype', null));
		columns.push(new nlobjSearchColumn('applyinglinkamount', null));
		columns.push(new nlobjSearchColumn('applyinglinktype', null));
		
		filters.push(new nlobjSearchFilter('internalid', null, 'anyof', transactionIds));
		
		dataCallbackPlugin.beforeTransactionSearch(columns,filters);
		return nlapiCreateSearch('transaction', filters, columns); 
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
				}
			}
		}
		
		// search on each entity type(vendors,customers,employees)
		var allEntityResults = new Array();
		
		if(entityIdsByType.customers.length > 0){
			allEntityResults = allEntityResults.concat(customerSearch(entityIdsByType.customers));
		}
		if(entityIdsByType.vendors.length > 0){
			allEntityResults = allEntityResults.concat(vendorSearch(entityIdsByType.vendors));
		}
		if(entityIdsByType.employees.length > 0){
			allEntityResults = allEntityResults.concat(employeeSearch(entityIdsByType.employees));
		}
		return allEntityResults;
	}

	function pushSharedColumns(columns){
		columns.push(new nlobjSearchColumn('firstname', null));
		columns.push(new nlobjSearchColumn('middlename', null));
		columns.push(new nlobjSearchColumn('lastname', null));
		columns.push(new nlobjSearchColumn('entityid', null));
		//columns.push(new nlobjSearchColumn('printoncheckas', null));
		columns.push(new nlobjSearchColumn('custentity_pp_ach_payee_email', null));
		columns.push(new nlobjSearchColumn('custentity_pp_ach_routing_number', null));
		columns.push(new nlobjSearchColumn('custentity_pp_ach_account_number', null));
		columns.push(new nlobjSearchColumn('custentity_pp_ach_enabled', null));
		columns.push(new nlobjSearchColumn('custentity_pp_ach_sec_code', null));
		//columns.push(new nlobjSearchColumn('custentity_pp_ach_deposit_withdrawal', null));
		columns.push(new nlobjSearchColumn('custentity_pp_ach_transaction_code', null));
		
		columns.push(new nlobjSearchColumn('custentity_pp_gl_account_number', null));
		columns.push(new nlobjSearchColumn('custentity_pp_comment', null));
		columns.push(new nlobjSearchColumn('custentity_pp_custom_line_1', null));
		columns.push(new nlobjSearchColumn('custentity_pp_custom_line_2', null));
		columns.push(new nlobjSearchColumn('custentity_pp_custom_line_3', null));
		columns.push(new nlobjSearchColumn('custentity_pp_iso_dest_curr_code', null));
		columns.push(new nlobjSearchColumn('custentity_pp_iso_dest_ctry_code', null));
		columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_name', null));
		columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_id_qualifier', null));
		columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_id_number', null));
		columns.push(new nlobjSearchColumn('custentity_pp_receiving_dfi_br_ctry_code', null));
		columns.push(new nlobjSearchColumn('custentity_pp_trans_type_code', null));
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
}