/**
 * Library for AvidSuite
 * 
 * @requires PP_LIB_Cypto.js
 * 
 * Version    Date            Author         Remarks
 * 1.00       10 Apr 2015     maxm
 * 2.10.3	  01 Aug 2017 	   shale			   S16558 - consolidating scripts, updating error handling
 * 2.11.0.20  29 Jan 2018     sdonald			S19454 - User Preference Date Conversions
 * 2.12.0.1	  22 Feb 2018     shale				S20904 - Checking for Tax Code Suitability
 * 2.19.0.0   16 Jul 2019     dwhetten       S54250 - Added getPaymentHistoryUrl function
 */


var PPSLibAvidSuite = {
   getAPIVersion: function() {
      return 'v1';
   },
   getAPIDomain: function() {
      var context = nlapiGetContext();
      var apnCfgEnc = context.getSetting('SCRIPT', 'custscript_pp_apn_cfg');
      var crypto = new PPCrypto();
      try {
         return JSON.parse(crypto.decrypt(apnCfgEnc)).domain;
      }
      catch (e) {
         nlapiLogExecution('ERROR', e.toString());
         throw nlapiCreateError('PP_APN_CFG_LOAD_ERROR', 'Unable to load to the Avid Suite configuration.');
      }
   },
   getAPIGatewayKey: function() {
      var context = nlapiGetContext();
      var apnCfgEnc = context.getSetting('SCRIPT', 'custscript_pp_apn_cfg');
      var crypto = new PPCrypto();
      try {
         return JSON.parse(crypto.decrypt(apnCfgEnc)).gatewayAPIKey;
      }
      catch (e) {
         nlapiLogExecution('ERROR', e.toString());
         throw nlapiCreateError('PP_APN_CFG_LOAD_ERROR', 'Unable to load to the Avid Suite configuration.');
      }

   },
   getBaseUrl: function() {
      return 'https://' + this.getAPIDomain();
   },
   getAuthorizationUrl: function() {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/authorizations';
   },
   getPaymentBatchUrl: function() {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/payments/batches';
   },
   getPaymentBatchStatusUrl: function() {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/payments/batches';
   },
   getPaymentBatchPaymentsUrl: function() {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/payments';
   },
   getClosedInvoiceBatchUrl: function(accountingSystemId) {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/invoices/batches/closed/acctgSysId/' + encodeURI(accountingSystemId);
   },
   getInvoiceBatchUrl: function() {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/invoices/batches';
   },
   getAccountingSystemsUrl: function() {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/accountingSystems';
   },
   getBatchExportHistoriesUrl: function() {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/invoices/batches/exportHistories';
   },
   getCheckImageUrl: function(paymentId) {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/payments/' + paymentId + '/getclearedcheckimage';
   },
   getPaymentHistoryUrl: function(paymentId) {
      return 'https://' + this.getAPIDomain() + '/' + this.getAPIVersion() + '/payments/' + paymentId + '/paymenthistory';
   }

};


/**
 * Returns APN access object on success. Throws PP_APN_AUTH_ERROR error on failure. 
 */
/*PPSLibAvidSuite.authorize = function(avidApiGatewayAuthorizeUrl,avidApiGatewayKey,username,password_credential){
	
	var headers = {
			Authorization: "Bearer " + avidApiGatewayKey,
			Accept: "application/json"
	};
	
	var postData = {
			grant_type: "password",
			username: username,
			password: "{" + password_credential + "}"
	};
	
	var resp = nlapiRequestURLWithCredentials([password_credential], avidApiGatewayAuthorizeUrl, postData, headers,'POST');
	
	switch(resp.getCode()){
	case 200:
		var resultObj = JSON.parse(resp.getBody());
		return resultObj;
		break;
	case 400:
		var resultObj = JSON.parse(resp.getBody());
		throw nlapiCreateError('PP_APN_AUTH_ERROR','Unable to authorize. Reason: ' + resultObj.error_description);
		break;
	default:
		nlapiLogExecution('ERROR',resp.getCode(),resp.getBody());
		throw nlapiCreateError('PP_APN_AUTH_ERROR','Response Code: ' + resp.getCode());
		break;
	}
	
};*/

PPSLibAvidSuite.authorize = function(avidApiGatewayAuthorizeUrl,avidApiGatewayKey,username,password){
	
	var headers = {
			Authorization: "Bearer " + avidApiGatewayKey,
			Accept: "application/json"
	};
	
	var postData = {
			grant_type: "password",
			username: username,
			password: password
	};
	
	var resp = nlapiRequestURL(avidApiGatewayAuthorizeUrl, postData, headers,'POST');
	
	switch(resp.getCode()){
	case 200:
		var resultObj = JSON.parse(resp.getBody());
		return resultObj;
		break;
	case 400:
		var resultObj = JSON.parse(resp.getBody());
		throw nlapiCreateError('PP_APN_AUTH_ERROR','Unable to authorize. Reason: ' + resultObj.error_description);
		break;
	case 503:
		// DO NOT LOG RESPONSE BODY FOR 503, IT CAN CONTAINS USERNAME AND PASSWORD IN PLAIN TEXT
		throw nlapiCreateError('PP_APN_AUTH_ERROR','Response Code: ' + resp.getCode());
		break;
	default:
		nlapiLogExecution('ERROR',resp.getCode(),resp.getBody());
		throw nlapiCreateError('PP_APN_AUTH_ERROR','Response Code: ' + resp.getCode());
		break;
	}
	
};


PPSLibAvidSuite.renderAPNBatchPaymentsXML = function(apnDataObj,source){
	//generate xml using handlebar templates
	Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
	    lvalue = parseFloat(lvalue);
	    rvalue = parseFloat(rvalue);
	        
	    return {
	        "+": lvalue + rvalue,
	        "-": lvalue - rvalue,
	        "*": lvalue * rvalue,
	        "/": lvalue / rvalue,
	        "%": lvalue % rvalue
	    }[operator];
	});
	
	Handlebars.registerHelper("toISO8601Date", function(value){
		function pad(number) {
			var r = String(number);
	     	if ( r.length === 1 ) {
	     		r = '0' + r;
	     	}
	     	return r;
	    }
		//var myDate = nlapiStringToDate(value);
		//return myDate.getFullYear() + '-' + pad(myDate.getUTCMonth()+1) + '-' + pad(myDate.getDate());
		// Changes for correct date conversions
		var parsedDate = value.split('/');
		var day_p1 = parsedDate[1];
		var month_p1 = parsedDate[0];
		var year_p1 = parsedDate[2];
		return year_p1 + '-' + pad(month_p1) + '-' + pad(day_p1);
	});
	
	var template = Handlebars.compile(source);
	var xml = template(apnDataObj);
	return xml;
};


/*PPSLibAvidSuite.loadUserCredentialRecordByEmployeeId = function(employeeId){
	var filters = [new nlobjSearchFilter('custrecord_pp_av_employee', null, 'anyof', employeeId)];
	var searchResults = nlapiSearchRecord('customrecord_pp_av_user_credentials',null,filters,null);
	if(searchResults){
		return nlapiLoadRecord('customrecord_pp_av_user_credentials', searchResults[0].getId());
	}
	return null;
};*/
PPSLibAvidSuite.loadUserCredentialRecordByEmployeeId = function(employeeId){
	var filters = [new nlobjSearchFilter('custrecord_pp_avc_employee', null, 'anyof', employeeId)];
	var searchResults = nlapiSearchRecord('customrecord_pp_av_credentials',null,filters,null);
	if(searchResults){
		return nlapiLoadRecord('customrecord_pp_av_credentials', searchResults[0].getId());
	}
	return null;
};

/**
 * Loads and returns an object containing the decrypted AvidSuite user credentials.
 * Returns null if user credentials not found
 */
PPSLibAvidSuite.getUserCredentials = function(employeeId){
	var rec = this.loadUserCredentialRecordByEmployeeId(employeeId);
	if(rec){
		var crypto = new PPCrypto();
		return {
			username: rec.getFieldValue('custrecord_pp_avc_username'), 
			password: crypto.decrypt(rec.getFieldValue('custrecord_pp_avc_password')),
			employeeId: rec.getFieldValue('custrecord_pp_avc_employee')
		};
	}
	else{
		return null;
	}
	
};


/**
 * Validate and build the APN Batch object from the ppsObj. If there are validation
 * errors the validationErrors property of the returned object will be an array of length > 0
 *  
 * @param {Object} ppsObj
 * @returns {Object} 
 */
PPSLibAvidSuite.buildAPNBatchPaymentsObj = function(ppsObj,batchPrefix){
	function subsidiarySearch(){
		var filters = [];
		var columns = [];
		
		filters.push(new nlobjSearchFilter('iselimination',null,'is','F'));
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		
		columns.push(new nlobjSearchColumn('address','address'));
		columns.push(new nlobjSearchColumn('name'));
		columns.push(new nlobjSearchColumn('legalname'));
		
		return nlapiSearchRecord('subsidiary',null,filters,columns);
	}
	
	// transform ppsObj into APN structure
	var payers = {};
	var payment = null;
	var total = 0;
	var totalValid = 0;
	var subsidiarySrs = null;
	var validationErrors = [];
	var invalidPaymentIds = [];
	var wasValidationError;
	var invalidPayerIds = []; //keep track of invalidPayerIds to prevent duplicate validation error messages
	var subsidiariesEnabled = nlapiGetContext().getFeature('SUBSIDIARIES');
	var useSubLegalName = false;
	
	if(subsidiariesEnabled){
		useSubLegalName = nlapiGetContext().getSetting('SCRIPT','custscript_pp_legal_name_as_payer');
		subsidiarySrs = subsidiarySearch();
	}
	
	for(var i = 0; i < ppsObj.payments.length; i++){
		wasValidationError = false;
		payment = ppsObj.payments[i];
		
		if(payment.recordType == 'check'){
			// checks stubline structure is not even close to what APN expects. For now use check fields with singe stubline instead.
			payment.stublines = [{
				date : payment.date,
				refnum : payment.checkNumber,
				amount : payment.amount,
				discountAmount : '0.00',
				grossAmount :  payment.amount,
				memo : payment.memo
			}];
		}
		else{
			var stubTotal = 0;
			for(var j = 0; j < payment.stublines.length; j++){
				//TODO: verify stubline structure
				var stubline = payment.stublines[j];
				// some stublines such as bill credits do not have a discountAmount
				if(!stubline.hasOwnProperty('discountAmount')){
					stubline.discountAmount = '0.00';
				}
				stubline.grossAmount = (+stubline.discountAmount + +stubline.amount).toFixed(2);
				
				if(!stubline.refnum){
					validationErrors.push(payment.recordType + ' #' + payment.checkNumber + ': The reference number for ' + stubline.type + ':' + stubline.doc + ' is missing.');
					wasValidationError = true;
				}
				stubTotal += +stubline.amount;
			}
			if(stubTotal.toFixed(2) != payment.amount){
				validationErrors.push(payment.recordType + ' #' + payment.checkNumber + ': The line item total does not equal the payment amount.');
				wasValidationError = true;
			}
		}
		
		var payer = null;
		var cId = null; // subsidiaryId or 0 if not one world
		if(subsidiariesEnabled){
			cId = payment.subsidiaryId;
			if(!payers.hasOwnProperty(cId)){
				// create payer information from subsidiary details
				//var subsidiaryRec = nlapiLoadRecord('subsidiary',cId);
				var subsidiarySr = null;
				for(var j = 0; j < subsidiarySrs.length; j++){
					if(subsidiarySrs[j].getId() == cId){
						subsidiarySr = subsidiarySrs[j];
					}
				}
				
				if(!subsidiarySr){
					throw nlapiCreateError('PP_APN_SUBSIDIARY_NOT_FOUND','The subsidiary with id ' + cId + ' was not found in the search.');
				}
				payer = {
						accounts : {}
				};
				if(useSubLegalName == 'T'){
					payer.name = subsidiarySr.getValue('legalname');
				}
				else{
					payer.name = subsidiarySr.getValue('name');
				}
				payer.address = $PPS.parseMultilineAddress(subsidiarySr.getValue('address','address'));
				
				if(!payer.address){
					if(invalidPayerIds.indexOf(cId) == -1){
						validationErrors.push('Subsidiary '+ payer.name + ' has an invalid address');
						invalidPayerIds.push(cId);
					}
					wasValidationError = true;
				}
			}
			else{
				payer = payers[cId];
			}
		}
		else if(typeof payers[0] == 'undefined'){
			cId = 0;
			//load from company informaiotn
			var companyInformation = nlapiLoadConfiguration('companyinformation');
			payer = {
					accounts : {}
			};
			payer.name = companyInformation.getFieldValue('legalname');
			payer.address = $PPS.parseMultilineAddress(companyInformation.getFieldValue('mainaddress_text'));
			
			if(!payer.address){
				if(invalidPayerIds.indexOf(cId) == -1){
					validationErrors.push('The company address is invalid');
					invalidPayerIds.push(cId);
				}
				wasValidationError = true;
			}
			
		}
		else{
			cId = 0;
			payer = payers[cId];
		}
		
		var acct = null;
		// load or create the account
		if(!payer.accounts.hasOwnProperty(payment.accountId)){
			acct = {
					id : payment.accountId,
					payees : []
			};
		}
		else{
			acct = payer.accounts[payment.accountId];
		}
		
		// create the payee, don't group on payees because address can be customized at the payment level
		var payee = {
				id : payment.vendorId,
				payments : [],
				name : payment.payee,
				address: $PPS.parseMultilineAddress(payment.address)
		};
		if(!payee.address){
			validationErrors.push(payment.recordType + ' #' + payment.checkNumber + ': The address is invalid.');
			wasValidationError = true;
		}
		
		if(!wasValidationError){
			// dont assign anything back if the payment didn't pass validation
			payers[cId] = payer;
			payer.accounts[payment.accountId] = acct;
			total += +payment.amount;
			totalValid++;
			payment.externalId = batchPrefix + '-' + payment.id;
			payee.payments.push(payment);
			acct.payees.push(payee);
		}
		else{
			invalidPaymentIds.push(payment.id);
		}
	
	}
	
	var apnDataObj = {
			payers : payers,
			batchId : null,
			totalAmount: total.toFixed(2),
			totalPayments: ppsObj.payments.length,
			totalPaymentsValid: totalValid,
			validationErrors: validationErrors,
			invalidPaymentIds : invalidPaymentIds
	};
	
	return apnDataObj;
};


/**
 * Authorize user, build XML payload, create payment batch record and send payment batch request to APN.
 * 
 * NOTE: This function could be executed from a suitelet or scheduled script if the loadUserCredentialRecordByEmployeeId function
 * was rewritten to be script dependent.
 * 
 * @param {object} paymentIds - Hash of payment transaction internal ids mapped to an abbreviation of their record type
 * 
 * @returns {object} - Returns an object containing information about the result of the function
 * 				{
 * 					status : "success" | "error",
 * 					errorMessage : "", // pretty details of error message
 * 					exception : {name :"",message: ""}, // details of error broken apart
 * 					validationErrors : [], // an array of validation errors
 * 					batchRecId : "", // internal id of the batch record
 *   				batchNumber : "", // batchPrefix + batchRecId
 *   				totalPaymentsValid : 2, // integer
 *   				totalPayments : 1, 
 *  				totalAmount : "200.21"
 * 				}
 * 
 */
PPSLibAvidSuite.doAPNPaymentBatch = function(paymentIds){
	var devMode = false;
	var context = nlapiGetContext();
	var batchRec;
    var batchRecId;
    var resultObj = {
    		status: null
    };
    var batchPrefix = context.getPreference('custscript_pp_apn_batch_prefix').trim();
    
    function getBatchDateTimeStamp(){
    	function pad(num, size) {
    	    var s = num+"";
    	    while (s.length < size) s = "0" + s;
    	    return s;
    	};

    	var d = new Date();

    	var dateStr = pad(d.getMonth()+1,2) + '/' + pad(d.getDate(),2) + '/' + d.getFullYear();
    	var timeStr = pad(d.getHours(),2) + '.' + pad(d.getMinutes(),2) + '.' + pad(d.getSeconds(),2) + ' ' + d.getMilliseconds();
    	return dateStr + ' ' + timeStr;
    };
        
    try{
    	var ppsPaymentBuilder = new PPSPaymentBuilder();
		var ppsObj = ppsPaymentBuilder.getData(paymentIds);
		var apnDataObj = PPSLibAvidSuite.buildAPNBatchPaymentsObj(ppsObj,batchPrefix);
		
		if(apnDataObj.validationErrors.length > 0){
			resultObj.validationErrors = apnDataObj.validationErrors;
			
			if(apnDataObj.totalPaymentsValid == 0){
				throw nlapiCreateError('PP_APN_NO_VALID_PAYMENTS','No payments passed validation. Please correct the errors and try again.');
			}
		}
		
		// remove invalid payments from paymentIds object
		for(var i = 0; i < apnDataObj.invalidPaymentIds.length; i++){
			delete paymentIds[apnDataObj.invalidPaymentIds[i]];
		}
		
		
		function isDuplicateBatch(hash){
			var filters = [];
			
			filters.push(new nlobjSearchFilter('custrecord_pp_apn_batch_hash', null, 'is', hash));
			filters.push(new nlobjSearchFilter('custrecord_pp_apn_pb_status', null, 'noneof', $PPS.nlapiGetList('customlist_pp_apn_pb_status').getKey('Fail')));
			filters.push(new nlobjSearchFilter('created', null, 'on', 'today'));
			
			var srs = nlapiSearchRecord('customrecord_pp_apn_payment_batch',null,filters);
			if(srs){
				return true;
			}
			return false;
		};
		
		// run the duplicate check
		var serializedPaymentIds = JSON.stringify(paymentIds);
		var hash = nlapiEncrypt(serializedPaymentIds, 'sha1');
		if(isDuplicateBatch(hash)){
			throw nlapiCreateError('PP_APN_DUPLICATE_BATCH','This batch was recently sent to the AvidPay Network.');
		}
		
		// create a batch record
		batchRec = nlapiCreateRecord('customrecord_pp_apn_payment_batch');
		batchRec.setFieldValue('custrecord_pp_apn_batch_hash', hash);
		batchRec.setFieldText('custrecord_pp_apn_pb_status','Pending');
		batchRec.setFieldValue('custrecord_pp_apn_pb_payments', serializedPaymentIds);
		batchRecId = nlapiSubmitRecord(batchRec);
		var batchNumber = batchPrefix + "-" + batchRecId + ' ' + getBatchDateTimeStamp();
		
		// reload batch record 
		batchRec = nlapiLoadRecord('customrecord_pp_apn_payment_batch',batchRecId);
		// set the batch number on the record. The batchRec should always get saved later.
		batchRec.setFieldValue('custrecord_pp_apn_batch_number', batchNumber);
		
		apnDataObj.batchId = batchNumber;
		
		// render the xml to string
		var source = $PPS.getTemplate('apn_payment_batch_hb_tmpl.xml');
		var xml = PPSLibAvidSuite.renderAPNBatchPaymentsXML(apnDataObj,source);
		
		// validate that the XML document conforms to the XSD schema
		try{
			//load an XSD document from the file cabinet
			var xsdDocument = nlapiStringToXML($PPS.getTemplate('PaymentBatch.xsd'));
			nlapiValidateXML(nlapiStringToXML(xml), xsdDocument);
		}
		catch(e){
			throw nlapiCreateError('PP_APN_XSD_VALIDATION_FAILED',e.toString());
		}

		
		// Load the APN user credentials of current user
		var apnCredentials = PPSLibAvidSuite.getUserCredentials(context.getUser());
		if(!apnCredentials){
			throw nlapiCreateError('PP_APN_NO_USER_CREDENTIALS','You have not setup your avid suite user credentials yet.');
		}
		
		// Configure and authorize the service
		var serviceConfig = apnCredentials;
		var service = new PPSLibAvidSuite.Service(serviceConfig);
		service.authorize();
		nlapiLogExecution('DEBUG','Authorized','true');
		
		if(devMode){
			resultObj.apnDataObj = apnDataObj;
			resultObj.xml = xml;
		}
		
		// custom response handler to handle the crazy results of APN Batch submission
		var respHandler = function(resp){
			try{
				var result = {
						resp : resp,
						success: null,
						errorMessage: null
						
				};

		    	switch(resp.getCode()){
		    	case 200:
		    		var resultObj = JSON.parse(resp.getBody());
		    		var results = [].concat(resultObj.Results); // make Results always an array since it can be an object or an array
		    		
		    		if(results[0].Successful == "false" || results[0].Successful === false){
		    			result.success = false;
		    			var errs = [].concat(results[0].Errors); // make Errors an array since it can be an object or an array
		    			result.errorMessage = "Error from APN server: " + errs[0].Message;
		    		}
		    		else{
		    			result.success = true;
		    		}
		    		break;
		    	case 400:
		    		var resultObj = JSON.parse(resp.getBody());
		    		result.success = false;
		    		result.errorMessage = 'Unable to authorize. Reason: ' + resultObj.error_description;
		    		break;
		    	case 401:
		    		var resultObj = JSON.parse(resp.getBody());
		    		result.success = false;
		    		result.errorMessage = resultObj.exception.reason + ": " + resultObj.exception.detail;
		    		break;
		    	default:
		    		nlapiLogExecution('ERROR',resp.getCode(),resp.getBody());
		    		result.success = false;
		    		result.errorMessage = 'Response Code: ' + resp.getCode();
		    		break;
		    	}
			}
			catch(e){
				result.success = false;
				result.errorMessage = e.toString();
			}
			return result;
		};
		
		var sendPaymentsResult = service.sendRequest(PPSLibAvidSuite.getPaymentBatchUrl(),xml,{"Content-Type": "text/xml; charset=UTF-8"},'POST',respHandler);
		
		nlapiLogExecution('DEBUG','Send Payments Response Body',sendPaymentsResult.resp.getBody());
		if(devMode){
			resultObj.apiPaymentResponse = sendPaymentsResult.resp.getBody();
		}
		
		if(sendPaymentsResult.success){
			resultObj.status = "success";
			batchRec.setFieldText('custrecord_pp_apn_pb_status','Submitted');
			batchRec.setFieldValue('custrecord_pp_apn_batch_to_be_marked','T');
    		nlapiSubmitRecord(batchRec);
    		
    		resultObj.batchRecId = batchRecId;
    		resultObj.batchNumber = batchNumber;
    		resultObj.totalPaymentsValid = apnDataObj.totalPaymentsValid;
    		resultObj.totalPayments = apnDataObj.totalPayments;
    		resultObj.totalAmount = apnDataObj.totalAmount;
    		
    		// Call scheduled script to mark items as processed
    		var status = nlapiScheduleScript('customscript_pp_ss_apn_batch_update', 'customdeploy_pp_ss_apn_batch_update');
    		nlapiLogExecution('DEBUG','nlapiScheduleScript status for customdeploy_pp_ss_apn_batch_update',status);
		}
		else{
			throw nlapiCreateError('PP_APN_PAYMENT_REQUEST_ERROR',sendPaymentsResult.errorMessage);
		}

    } catch (e) {
    	if(batchRec){
    		batchRec.setFieldText('custrecord_pp_apn_pb_status','Fail');
    		batchRec.setFieldValue('custrecord_pp_apn_pb_error_message',e.toString());
    		nlapiSubmitRecord(batchRec);
    	}
    	nlapiLogExecution('ERROR',e.name,e.message);
    	resultObj.status = 'error';
    	resultObj.errorMessage = "Error: "+ e.name + '<br/>' + e.message;
    	resultObj.exception = {name: e.name, message: e.message};
    }
    return resultObj;
};


PPSLibAvidSuite.voidPayment = function(paymentInternalId,recordType){
	var context = nlapiGetContext();
	var rec = nlapiLoadRecord(recordType,paymentInternalId);
	
	// Make sure payment has been assigned to a batch
	var batchRecId = rec.getFieldValue('custbody_pp_apn_payment_batch');
	if(!batchRecId){
		throw nlapiCreateError('PP_APN_VOIDED_PAYMENT_WO_BATCH','You voided an AvidPay Network payment that has not been assigned a batch yet.');
	}
	
	// Extract the batch prefix used from the batchNumber
	var batchRec = nlapiLoadRecord('customrecord_pp_apn_payment_batch',batchRecId);
	var batchNumber = batchRec.getFieldValue('custrecord_pp_apn_batch_number');
	var batchRegex = new RegExp(batchRecId + "$");
	var batchPrefix = batchNumber.split(" ")[0].replace(batchRegex,'').replace(/-$/,'');
	
	var resourceUrl = PPSLibAvidSuite.getPaymentBatchPaymentsUrl();
	resourceUrl += '?externalPaymentIds=' + encodeURIComponent(batchPrefix + '-' + paymentInternalId); 
	
	// Load the APN user credentials of current user
	var apnCredentials = PPSLibAvidSuite.getUserCredentials(context.getUser());
	if(!apnCredentials){
		throw nlapiCreateError('PP_APN_NO_USER_CREDENTIALS','You have not setup your avid suite user credentials yet.');
	}
	
	// Configure and authorize the service
	var serviceConfig = apnCredentials;
	var service = new PPSLibAvidSuite.Service(serviceConfig);
	service.authorize();
	
	var respJSON = service.sendRequest(resourceUrl,null,null,'DELETE');
	
	var result = respJSON.Results[0];
	var item = result.Item;
	if(result.Successful){
		if(rec.getFieldValue('custbody_pp_apn_payment_status') != item.Status.Description){
			rec.setFieldValue('custbody_pp_apn_payment_status', item.Status.Description);
			nlapiSubmitRecord(rec);
		}
	}
	else{
		throw nlapiCreateError('PP_APN_VOID_ERR',result.Errors[0].Message);
	}
};


/**
 * AvidSuite service class
 * 
 * @param cfg {object}
 * @returns {PPSLibAvidSuite.Service}
 */
PPSLibAvidSuite.Service = function(cfg){
	
	var config = {
			authorizationUrl : PPSLibAvidSuite.getAuthorizationUrl(),
			gatewayKey: PPSLibAvidSuite.getAPIGatewayKey(),
			username: null,
			password: null
	};
	
	var authorizationToken;
	var authorizationObject;
	
	this.config = $PPS.extend(config,cfg);
	
	// Public Methods
	this.authorize = function(){
		var apnAuthObject = PPSLibAvidSuite.authorize(config.authorizationUrl,config.gatewayKey,config.username,config.password);
		authorizationObject = apnAuthObject;
		authorizationToken = apnAuthObject.access_token;
	};
	
	// Make this public so that the default can be overidden
	this.defaultResponseHandler = function(resp){
		switch(resp.getCode()){
    	case 200:
    		var resultObj = JSON.parse(resp.getBody());
    		return resultObj; // this should be a pager object
    		break;
    	default:
    		nlapiLogExecution('ERROR',resp.getCode(),resp.getBody());
    		throw nlapiCreateError('PP_APN_GET_ERROR',resp.getBody());
    		break;
    	}
	};
	
	this.sendRequest = function(url,postData,headersObj,httpMethod,responseHandler){
		if(!url){
			throw nlapiCreateError('PP_AVID_SUITE_REQUEST_ERROR','The URL is required in order to use the sendRequest method');
		}
		
		if(!httpMethod){
			httpMethod = 'GET';
		}
		
		var headers = {
				Authorization: "Bearer " + this.config.gatewayKey,
				AvidAuthorization: "Bearer " + authorizationToken,
				Accept: "application/json"
		};
		
		headers = $PPS.extend(headers,headersObj);
		
		var resp = nlapiRequestURL(url, postData, headers, httpMethod);
		
		if(responseHandler && typeof responseHandler == 'function'){
			return responseHandler.call(this,resp);
		}
		else{
			return this.defaultResponseHandler(resp);
		}
	};
	
	// Private Methods
	
};

/**
 * AvidSuite pager class
 * 
 * @param resourceUrl {string}
 * @param service {PPSLibAvidSuite.Service}
 * 
 * @returns {PPSLibAvidSuite.ResourcePager}
 */
PPSLibAvidSuite.ResourcePager = function(options,service){
	
	var pageNumber,pageCount,pageItems,totalItems;
	var links = [];
	var pageSize = 500;
	var me = this;
	
	if(typeof options == 'string'){
		this.resourceUrl = options;
		this.baseUrl = extractBaseUrl(this.resourceUrl);
	}
	else if(typeof options == 'object'){
		if(options.resourceUrl){
			this.resourceUrl = options;
			if(options.baseUrl){
				this.baseUrl = options.baseUrl;
			}
			else{
				this.baseUrl = extractBaseUrl(this.resourceUrl);
			}
		}
		else if(options.baseUrl && options.href){
			this.baseUrl = options.baseUrl;
			this.resourceUrl = options.baseUrl + options.href;
		}
		else{
			throw "Invalid options passed to PPSLibAvidSuite.ResourcePager";
		}
	}
	else{
		throw "Invalid first parameter passed to PPSLibAvidSuite.ResourcePager";
	}
	
	this.service = service;
	
	this.first = function(){
		/*pageNumber = 1;
		pageCount = 0;
		pageItems = 0;
		totalItems = 0;*/
		var firstLink = findLink(links,'first');
		var url;
		if(firstLink){
			url = this.baseUrl + firstLink.Href;
		}
		else{
			url = buildUrl(this.pageNumber);
		}
		var respObj = get(url);
		return respObj.Items;
	};
	
	this.next = function(){
		if(!pageNumber){
			return this.first();
		}
		else if(pageNumber + 1 > pageCount){
			return false;
		}
		else{
			var nextLink = findLink(links,'next');
			var url;
			if(nextLink){
				url = this.baseUrl + nextLink.Href;
			}
			else{
				url = buildUrl(pageNumber + 1);
			}
			return get(url).Items;
		}
	};
	
	this.all = function(){
		var items = [];
		items = items.concat(this.first());
		
		
		var moreItems = false;
		while(moreItems = this.next()){
			items = items.concat(moreItems);
		}
		return items;
	};
	
	
	this.setPageSize = function(size){
		pageSize = size;
	};
	
	function buildUrl(pageNumber){
		//TODO: build this smarter
		var url = me.resourceUrl;
		if(pageNumber){
			url += '&pageNumber=' + encodeURIComponent(pageNumber);
		}
		return url;
	}
	
	function get(url){
		var resultObj = me.service.sendRequest(url,null,'GET');
		
		if(resultObj.Paging){
			pageSize = resultObj.Paging.PageSize;
			pageNumber = resultObj.Paging.PageNumber;
			pageCount = (typeof resultObj.Paging.PageCount != 'undefined'? resultObj.Paging.PageCount : resultObj.Paging.Pages) || "0";
			pageItems = resultObj.Paging.PageItems;
			totalItems = resultObj.Paging.TotalItems;
			
			if(typeof resultObj.Paging.Links != 'undefined'){
				links = resultObj.Paging.Links;
			}
		}
		else{
			// resource doesn't support paging yet..
			pageSize = 1000;
			pageNumber = 1;
			pageCount = 1;
			pageItems = resultObj.Items.length || 0;
			totalItems = resultObj.Items.length || 0;
		}
		
		//links
		//query guid
		return resultObj;
	}
	
	function findLink(links,rel){
		for(var i = 0; i < links.length; i++){
			if(links[i].Rel == rel){
				return links[i];
			}
		}
	}
	
	function extractBaseUrl(url){
		var pathArray = url.split('/');
		var protocol = pathArray[0];
		var host = pathArray[2];
		return protocol + '//' + host;
	}
	
};



function getFieldMapping(afnData, mapType, lineType) {
	try {
		var fieldFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')];
		nlapiLogExecution('debug', 'getFieldMapping mapType', mapType);

		if (mapType == 'lineToLine') {
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ns_header', null, 'is', 'F'));
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ai_header', null, 'is', 'F'));
		} else if (mapType == 'headerToLine'){
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ns_header', null, 'is', 'F'));
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ai_header', null, 'is', 'T'));
		} else if(mapType == 'headerToHeader') {
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ns_header', null, 'is', 'T'));
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_ai_header', null, 'is', 'T'));
		} else {
			nlapiLogExecution('error', 'error in mapType', 'Did not recognize mapType: ' + mapType);
		}

		nlapiLogExecution('debug', 'getFieldMapping: lineType', lineType);
		if (lineType == 'expense') { //expense
			nlapiLogExecution('debug', 'adding expense filter', '');
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_expense', null, 'is', 'T'));
		} else if (lineType == 'item') { //item
			fieldFilters.push(new nlobjSearchFilter('custrecord_pp_fm_item', null, 'is', 'T'));
			nlapiLogExecution('debug', 'adding item filter', '');
		}

		var fieldColumns = [new nlobjSearchColumn('custrecord_pp_fm_ns_internal_id')
			, new nlobjSearchColumn('custrecord_pp_ns_field_type')
			, new nlobjSearchColumn('custrecord_pp_avid_invoice_field')
			, new nlobjSearchColumn('custrecord_pp_fm_ns_field_name')
		];
		var mappingResults = nlapiSearchRecord('customrecord_pp_field_mapping', null, fieldFilters, fieldColumns);
		
		//put results into an array, so we can use the AvidInvoice Field as a key, when going through the JSON data sent
		var mappingArray = [];
		if (mappingResults == null) {
			//error out, as there is no field mapping available.
			nlapiCreateError('NO_FIELD_MAPPING', 'There are no field mapping records for this account. Please set up field mapping.', true); //last param - does not send email to admin
		} else {
			var mappingLength = mappingResults.length;
			//nlapiLogExecution('debug', 'mappingLength', mappingLength);
			for (var a = 0; a < mappingLength; a++) {
				//nlapiLogExecution('debug', 'AvidInvoice field name ' + a, mappingResults[a].getValue('custrecord_pp_avid_invoice_field'));
				var AIFieldName = mappingResults[a].getValue('custrecord_pp_avid_invoice_field');
				nlapiLogExecution('debug', 'AIFieldName', AIFieldName);

				//mappingArray[AIFieldName] = new fieldMapping(AIFieldName, mappingResults[a].getValue('custrecord_pp_fm_ns_internal_id'), mappingResults[a].getValue('custrecord_pp_fm_ns_field_name'), mappingResults[a].getText('custrecord_pp_ns_field_type'));
				var map = new fieldMapping(AIFieldName, mappingResults[a].getValue('custrecord_pp_fm_ns_internal_id'), mappingResults[a].getValue('custrecord_pp_fm_ns_field_name'), mappingResults[a].getText('custrecord_pp_ns_field_type'));
				//nlapiLogExecution('debug', 'mappingArray setting test ' + AIFieldName, mappingArray[AIFieldName].nsFieldId);
				if (AIFieldName.indexOf('.') != -1 && afnData != null) {
					map["aiValue"] = getDotData(afnData, AIFieldName);
				} else {
					map["aiValue"] = afnData[AIFieldName];
				}
				mappingArray.push(map);
			}
		return mappingArray;
		}

	} catch (ex) {
		nlapiLogExecution('ERROR', 'ERROR in getFieldMapping function', ex.message);
	}
}

function fieldMapping(aiField, nsFieldId, nsLabel, nsFieldType) {
	this.aiField = aiField;
	this.nsFieldId = nsFieldId;
	this.nsLabel = nsLabel;
	this.nsFieldType = nsFieldType;
	this.aiValue = ''
}

function selectListObj(nsFieldId, selectText, selectId) {
	this.nsFieldId = nsFieldId;
	this.selectText = selectText;
	this.selectId = selectId;
}

function getDescriptionMapping() {
	//find mapping record for AI Description field
	var fil = [new nlobjSearchFilter('isinactive', null, 'is', 'F')
			, new nlobjSearchFilter('custrecord_pp_avid_invoice_field', null, 'is', 'Description')
		];
	var col = [new nlobjSearchColumn('internalid')
			, new nlobjSearchColumn('custrecord_pp_fm_ns_internal_id')
		];

	var res = nlapiSearchRecord('customrecord_pp_field_mapping', null, fil, col);
	if (res != null) {
		var descriptionNSField = res[0].getValue('custrecord_pp_fm_ns_internal_id');
		return descriptionNSField;
	} else {
		return null;
	}
}

function setCheckBoxField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType) {
	//nlapiLogExecution('debug', 'start setCheckboxField', nsFieldId);
	//translates Yes, No, True, or False (with any capitalization) to T/F that can be read by NS
	if (typeof fieldValue == "boolean") {
		if (fieldValue == true) {
			fieldValue = 'T';
		} else if (fieldValue == false) {
			fieldValue = 'F';
		}
	} else if (typeof fieldValue == "string") {
		fieldValue = fieldValue.toLowerCase();
		//nlapiLogExecution('audit', 'checkbox', fieldValue);
		if (fieldValue == 'true' || fieldValue== 'yes' || fieldValue == 't') {
			fieldValue = 'T';
		}
		if (fieldValue == 'false' || fieldValue == 'no' || fieldValue == 'f') {
			fieldValue = 'F';
		}		
	}
	//nlapiLogExecution('audit', 'final checkbox value', fieldValue);
	try {
		if (isHeader) {
			curRec.setFieldValue(nsFieldId, fieldValue);
		} else {
			curRec.setCurrentLineItemValue(lineType, nsFieldId, fieldValue);
		}
	} catch (ex) {
		errorMessage += "There was an error adding info to field " + nsFieldId + ex.message;
		nlapiLogExecution('error','There was an error adding info to field ' + nsFieldId, ex.message);
	}
	//nlapiLogExecution('audit', 'setCheckboxFieldError', errorMessage);
	return errorMessage;
}

function setListField (fieldValue, nsFieldId, AIFieldName, errorMessage, line, optionListArray, curRec, isHeader, descValue, lineType) {
	nlapiLogExecution('debug', 'start setListField', nsFieldId);
	nlapiLogExecution('debug', 'lineType check at start of setListField', lineType);
	if (optionListArray == null) {
		optionListArray = [];
	}

	if (isHeader) {
		nlapiLogExecution('audit', 'entity check', nlapiGetFieldValue('entity'));
		if (nlapiGetContext().getExecutionContext() == 'scheduled') {
			var nsFieldObj = curRec.getField(nsFieldId);
		} else {
			var nsFieldObj = nlapiGetField(nsFieldId);
		}
	} else {
		//if descValue is numbers only, it's an internal ID - just set it. Otherwise, continue on. This only works for line items, not for header fields in AI
		nlapiLogExecution('debug', 'line descValue', descValue + ', typeOf: ' + typeof descValue);
		//nsFieldObj = null;
		if (descValue != undefined && descValue != null && (typeof descValue == 'number' || descValue.match(/^\d+$/) != null)) {
			try {
				nlapiLogExecution('debug', 'entering descValue directly', 'start');
//					if (isHeader) {
//						curRec.setFieldValue(nsFieldId, descValue);
//						return errorMessage;
//					} else {
					curRec.setCurrentLineItemValue(lineType, nsFieldId, descValue);
					var curText = curRec.getCurrentLineItemText(lineType, nsFieldId);
					nlapiLogExecution('debug', 'curText', curText);
					// // ///TAXCODE SUBSIDIARY ISSUE TEST
					 if (nsFieldId == 'taxcode') {
					// 	var curText = '';
					 	errorMessage = handleTaxCode(fieldValue, descValue, errorMessage, line, curRec, lineType);
					 }
					if ((curText == '' || curText == undefined || curText == null) && nsFieldId != 'taxcode') {
						//throw error
						//UNLESS it's taxcode, which will return nothing until after the line has been committed, because NetSuite
						curRec.setCurrentLineItemValue(lineType, nsFieldId, null); //reset field to blank
						nlapiLogExecution('Error', 'Error directly setting descValue for ' + nsFieldId, descValue + ', ' + fieldValue + '. ');
						errorMessage += 'Could not set record field exactly for NetSuite field ' + nsFieldId + '. Internal ID ' + descValue + ' for ' + fieldValue + ' not found. ';
					} else if ((curText == '' || curText == undefined || curText == null) && nsFieldId == 'taxcode') {
						//tax code won't show as having a value until after the line is saved anyway
						//field is required where it is used, so an incorrect field will already cause an error
						nlapiLogExecution('debug', 'tax code - ' + nsFieldId, 'continuing, set as ' + descValue);

					}
					// nlapiLogExecution('debug', 'entered. checking value', descValue + ' =? ' + curRec.getCurrentLineItemValue('expense', nsFieldId));
					// nlapiLogExecution('debug', 'checking text value', curRec.getCurrentLineItemText('expense', nsFieldId) + ', ' + typeof curRec.getCurrentLineItemText('expense', nsFieldId));
					// nlapiLogExecution('debug', 'entering descValue directly', 'End. Returning...');
					return errorMessage;
//					}
			}catch (ex) {
				nlapiLogExecution('error', 'Error directly setting descValue for ' + nsFieldId, descValue + ', ' + fieldValue + '. ');
				errorMessage += 'Could not set record field exactly for NetSuite field ' + nsFieldId;
			}
		}
		nlapiLogExecution('debug', 'context', nlapiGetContext());
		nlapiLogExecution('debug', 'getExecutionContext', nlapiGetContext().getExecutionContext());
		nlapiLogExecution('debug', 'lineType', lineType);
		if (nlapiGetContext().getExecutionContext() == 'scheduled') {
			var nsFieldObj = curRec.getLineItemField(lineType, nsFieldId, line);
		} else {
			var nsFieldObj = nlapiGetLineItemField(lineType, nsFieldId, line);
		}
	}
	nlapiLogExecution('debug', 'nsFieldObj', nsFieldObj);
	if (nsFieldObj == null) {
		errorMessage += 'Could not find field ' + nsFieldId;
		nlapiLogExecution('error', 'error in setListField','Could not find field object ' + nsFieldId);
		//nlapiLogExecution('audit', 'setListField Error', errorMessage);
		return errorMessage;
	}
	


	try {
	var selectOption = [];
	selectOption = nsFieldObj.getSelectOptions(); //need this, otherwise it limits itself to the list fetched in the first line, for some unknown NS quirk reason
	nlapiLogExecution('debug', 'selectOptionlist', selectOption.length + " for line " + line + '. Is from header? ' + isHeader);
	//var selectOption = nsFieldObj.getSelectOptions(fieldValue, 'is');
	} catch (ex) {
		nlapiLogExecution('error', 'error in select option for line ' + line, ex.message);
	}

	//Messy workaround for a bug in NS - otherwise later lines will not allow us to get the full range of select option
	if (optionListArray[nsFieldId] == null || optionListArray[nsFieldId] == undefined) {
		for (var q = 0; q<selectOption.length; q++) {
			var currentSOText = selectOption[q].getText();
			//nlapiLogExecution('debug', 'currentSOText 1', currentSOText + ', ' + typeof currentSOText);
			currentSOText = currentSOText.replace(/^(&nbsp;)+/gi,'');

			optionListArray[currentSOText] = new selectListObj(nsFieldId, currentSOText, selectOption[q].getId());
			//nlapiLogExecution('debug', 'selectOption[q].getText()', '"'+currentSOText +'"' +  ' : ' +  selectOption[q].getId());
		}
	} else {
		nlapiLogExecution('debug', 'already made a list for field', nsFieldId);
	}


	if (optionListArray[fieldValue] != null && optionListArray != undefined) {
		selectFieldValue = optionListArray[fieldValue].selectId;

		try {
			if (isHeader) {
				curRec.setFieldValue(nsFieldId, selectFieldValue);
			} else {
				curRec.setCurrentLineItemValue(lineType, nsFieldId, selectFieldValue);
			}
		} catch(ex) {
			nlapiLogExecution('error', 'error setting field ' + nsFieldId, ex.message);
			errorMessage += "There was an error adding info to field " + nsFieldId + ex.message;
		}
		//if that doesn't work, try internal id?

	} else {
		try {
			//try setting it directly with the field value, which might be the internal ID of the value
			nlapiLogExecution('debug', 'Trying field Value directly', 'Could not find matching value for ' + fieldValue + '. Trying to enter it directly');

			if (typeof fieldValue == 'number' || fieldValue.match(/^\d+$/) != null) { //only if value is entirely numbers is this possible
				nlapiLogExecution('debug', 'is digits only');
				fieldValue = parseInt(fieldValue);
				if (isHeader) {
					nlapiLogExecution('debug', 'fieldVale is int for ns field ' + nsFieldId, fieldValue + typeof fieldValue);
					curRec.setFieldValue(nsFieldId, fieldValue);

				} else {
					curRec.setCurrentLineItemValue(lineType, nsFieldId, fieldValue);
				}
			} else {
				nlapiLogExecution('debug', 'value not integers', 'stopping');
				//throw field error
				nlapiLogExecution('ERROR', 'ERROR in Select Options', 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue);
				errorMessage += 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue + '\n';
			}
		} catch (ex) {
			//throw field error
			nlapiLogExecution('ERROR', 'ERROR in Select Options', 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue);
			errorMessage += 'Select options for AI field: ' + AIFieldName + ' cannot find value: ' + fieldValue + '\n';
		}
	}
	//nlapiLogExecution('audit', 'setListField Error', errorMessage);
	return errorMessage;
}

function handleTaxCode(fieldValue, descValue, errorMessage, line, curRec, lineType) {
	try {
		//GET AMOUNT
		var aiAmount = curRec.getCurrentLineItemValue(lineType, 'amount');
		var isOneWorld = nlapiGetContext().getFeature('SUBSIDIARIES');
//Formula:		newAmount + newAmount*taxRate = AIAmount

		//look up tax code info
		var tcFieldList = ['rate', 'country'];
		if (isOneWorld) {
			tcFieldList.push('subsidiary');
		}
		var taxCodeFields = nlapiLookupField('salestaxitem', descValue, tcFieldList);
		//not sure subsidiary is an allowed lookup here
		//only need to check country if it's a oneworld account, as otherwise it's US
		if (isOneWorld) {
			if (taxCodeFields != null) {
				var country = taxCodeFields['country'];
			} else {
				var country = null;
			}

			var subsidiary = curRec.getFieldValue('subsidiary'); //pulls 2 letter country code
			if (subsidiary != null) {
				var subsidCountry = nlapiLookupField('subsidiary', subsidiary, 'country'); //pulls 2 letter country code
			} else {
				subsidCountry = null;
			}

			if (country == subsidCountry && country != null && country != '') {

				var rate = taxCodeFields['rate'];

				rate = rate.slice(0, -1);
				rate = parseFloat(rate);
				rate = rate/100;
				//nlapiLogExecution('debug', 'tax rate', rate + ', ' + typeof rate);
				var multiple = rate + 1;
				//nlapiLogExecution('debug', 'tax code multiple', multiple);

				//GET AMOUNT
				var aiAmount = curRec.getCurrentLineItemValue(lineType, 'amount');
				var subTotal = (aiAmount / multiple).toFixed(2);
				var difference = aiAmount - subTotal;
				//curRec.setCurrentLineItemValue(lineType, 'taxamt', difference);
				nlapiLogExecution('debug', 'subTotal', subTotal);
				curRec.setCurrentLineItemValue(lineType, 'amount', subTotal);
				//curRec.setCurrentLineItemValue(lineType, 'taxtotal', difference);
				//curRec.setCurrentLineItemValue(lineType, 'grossamt', aiAmount);
				//curRec.setCurrentLineItemValue(lineType, 'grossamt', aiAmount);
			} else {
				nlapiLogExecution('error', 'Tax Code Mismatch', 'The selected tax code,' + descValue + ', is not available for this vendor in this subsidiary.');
				curRec.setCurrentLineItemValue(lineType, 'grossamt', aiAmount);
				errorMessage += " The selected tax code is not valid for the vendor/subsidiary on line " + line + ". The amount listed on this line INCLUDES tax, and may need to be adjusted." + '\n';
			}
		}


	} catch(ex) {
		nlapiLogExecution('error', 'error in handleTaxCode', ex.message);
		errorMessage += "There was an error in handling the tax code. " + ex.message + '\n';
	}
	return errorMessage;
}

function setDateField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType) {
	try {
//		nlapiLogExecution('debug', 'datecheck1', fieldValue);
		if (fieldValue != null) {
			var date = formatDate(fieldValue);
			if (isHeader) {
				curRec.setFieldValue(nsFieldId, date);
			} else {
				curRec.setCurrentLineItemValue(lineType, nsFieldId, date);
			}
		}
	} catch(ex) {
		errorMessage += "There was an error adding info to field " + nsFieldId + ': ' + ex.message + '\n';
	}
	//nlapiLogExecution('audit', 'setDateField Error', errorMessage);
	return errorMessage;
}

function setOtherField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType) {
	nlapiLogExecution('debug', 'start setOtherField', nsFieldId);
	try {
			if (fieldValue != null) {
				fieldValue = fieldValue.toString();
			} else {
				fieldValue = '';
			}
//			nlapiLogExecution('debug', 'otherField fieldValue typeof for ' + nsFieldId, typeof fieldValue);
			if (isHeader) {
				curRec.setFieldValue(nsFieldId, fieldValue);
			} else {
				curRec.setCurrentLineItemValue(lineType, nsFieldId, fieldValue);
			}
	} catch(ex) {
		var lineNum = c + 1;
		errorMessage += 'There was an error adding info to field ' + nsFieldId + ': ' + ex.message + '\n';
	}
	//nlapiLogExecution('audit', 'setOtherField Error', errorMessage);
	return errorMessage;
}

function setCurrencyField(fieldValue, nsFieldId, errorMessage, curRec, isHeader, lineType) {
	
	try {
		if (isHeader) {
			nlapiSetFieldValue(nsFieldId, fieldValue.toFixed(2));
		} else {
			curRec.setCurrentLineItemValue(lineType, nsFieldId, fieldValue.toFixed(2));
		}
	} catch(ex) {
		//var lineNum = c + 1;
		errorMessage += 'There was an error adding info to field ' + nsFieldId + ': ' + ex.message + '\n';
	}
	//nlapiLogExecution('audit', 'setCurrencyField Error', errorMessage);
	return errorMessage;
}

function getDotData(data, aiFieldName) {
	try{
		nlapiLogExecution('debug', 'getDotData aiFieldName start', aiFieldName);
//		nlapiLogExecution('debug', 'getDotData data start', data);

		var topLevelName = aiFieldName.substring(0, aiFieldName.indexOf('.'));
		var remainingName = aiFieldName.substring((aiFieldName.indexOf('.') + 1));
		nlapiLogExecution('debug', 'top level/remaining name', topLevelName + ' / ' + remainingName);

		var remainingData = data[topLevelName];
//		nlapiLogExecution('debug', 'remainingData', remainingData);

		if (remainingName.indexOf('.') != -1) {
			nlapiLogExecution('debug', 'getDotData - rerun', 'remainingData: ' + remainingData + ' remainingName: ' + remainingName);
			return getDotData(remainingData, remainingName);
		} else {

			return remainingData[remainingName];
		}
	} catch(ex) {
		nlapiLogExecution('error', 'error in getDotData', ex.message);
	}
}

function addToLineFields(mapArray, errorMessage, curRec, lineNum, optionListArray, lineType) {
	var curErrorMessage = errorMessage;
	var nullValue = nlapiGetContext().getSetting('SCRIPT', 'custscript_pp_null_value');
	nlapiLogExecution('debug', 'addToLineFields lineType check', lineType);

	for (var d = 0; d < mapArray.length; d++) {
		var fieldType = mapArray[d].nsFieldType;
		var nsFieldId = mapArray[d].nsFieldId;
		var AIFieldName = mapArray[d].aiField;
		var fieldValue = mapArray[d].aiValue;

		if (nullValue == fieldValue) {
			fieldValue = null;
			nlapiLogExecution('debug', 'AI Field ' + AIFieldName + ' is set to null value ' + nullValue + '. Setting value to null.');
		}

		if (fieldValue != null) {
			switch (fieldType) {
				case 'List/Record':
					errorMessage = setListField(fieldValue, nsFieldId, AIFieldName, errorMessage, lineNum, optionListArray, curRec, false, null, lineType);
					break;
				case 'Check Box':
					errorMessage = setCheckBoxField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
					break;
				case 'Date':
					errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
					break;
				case 'Date/Time':
					errorMessage = setDateField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
					break;
				case 'Currency':
					errorMessage = setCurrencyField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
					break;
				default:
					curErrorMessage = setOtherField(fieldValue, nsFieldId, errorMessage, curRec, false, lineType);
			}
		}
	}
	//nlapiLogExecution('audit', 'addToLineFields Error', errorMessage);
	return curErrorMessage;
}

function formatDate(jsonDate) {
	var t = jsonDate.indexOf('T');
	var date = jsonDate.substring(0,t);
	var dateParts = date.split('-');
	date = dateParts[1]+'/'+dateParts[2]+'/'+dateParts[0];
	var day = parseInt(dateParts[2], 10);
	var month = parseInt(dateParts[1], 10);
	month -= 1;
	var year = parseInt(dateParts[0]);
	//dateParts[1] = parseInt(dateParts[1]);
	//nlapiLogExecution('debug',' datePart1', dateParts[1] + ' ' + typeof dateParts[1])
	var dateObj = new Date(year, month, day);
	//nlapiLogExecution('debug', 'formatDate', dateObj + ' ' + typeof dateObj);
	return dateObj;
}