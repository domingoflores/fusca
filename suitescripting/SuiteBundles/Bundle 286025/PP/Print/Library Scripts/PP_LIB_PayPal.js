/**
 * Library containing common paypal functions
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Mar 2014     maxm
 *
 */


var PPSLibPayPal = {
		getSandboxNvpUrl : function(){
			// get url from company preferences first because it will most likely be a proxy url
			var url = nlapiGetContext().getPreference('custscript_pp_paypal_sandbox_nvp_url');
			if(!url){
				// The sandbox urls do not work from netsuite do to SLL certificate validation errors, but here they are for reference
				url = 'https://api-3t.sandbox.paypal.com/nvp';
			}
			return url;
		},
		getSandboxVerifyIPNUrl : function(){
			// get url from company preferences first because it will most likely be a proxy url
			var url = nlapiGetContext().getPreference('custscript_pp_paypal_sandbox_verify_url');
			if(!url){
				// The sandbox urls do not work from netsuite do to SLL certificate validation errors, but here they are for reference
				url = 'https://www.sandbox.paypal.com/cgi-bin/webscr';
			}
			return url;
		},
		//productionNvpUrl : 'https://api-3t.paypal.com/nvp',
		getProductionNvpUrl : function(){
			return 'https://api-3t.paypal.com/nvp';
		},
		getProductionVerifyIPNUrl : function(){
			return 'https://www.paypal.com/cgi-bin/webscr';
		},
		/**
		 * Parses name value pair strings sent from PayPal into a usable object
		 * 
		 * @param {String} body
		 * @returns {Object}
		 */
		extractNameValuePairs : function(body){
			var parameters = {};
		    body = decodeURI(body);
		    body = body.replace(/\+/g,' ');
			var pairsStrs = body.split('&');
			for(var i = 0; i < pairsStrs.length; i++){
				var pairs = pairsStrs[i].split('=');
				parameters[decodeURIComponent(pairs[0])] = decodeURIComponent(pairs[1]);
			}
			return parameters;
		},
		/**
		 * THIS METHOD SHOULD NOT BE USED
		 */
		sendPayments : function(settings,transactionIds){

			// initialize configuration
			var config = {
					paypalApiVersion : '109.0',
					currencyCode : 'USD'
			};
			
			if(typeof settings.paypalUsername == 'undefined' || settings.paypalUsername == ''){
				throw nlapiCreateError('NO_PAYPAL_USERNAME', 'No PayPal username set', true);
			}
			
			if(typeof settings.paypalApiPassword == 'undefined' || settings.paypalApiPassword == ''){
				throw nlapiCreateError('NO_PAYPAL_PASSWORD', 'No PayPal password set', true);
			}
			
			if(typeof settings.paypalApiSignature == 'undefined' || settings.paypalApiSignature == ''){
				throw nlapiCreateError('NO_PAYPAL_API_SIGNATURE', 'No PayPal API signature set', true);
			}
			
			config.paypalUsername = settings.paypalUsername;
			config.paypalApiPassword = settings.paypalApiPassword;
			config.paypalApiSignature = settings.paypalApiSignature;
			config.apiUrl = (settings.paypalSandbox ? PPSLibPayPal.getSandboxNvpUrl() : PPSLibPayPal.getProductionNvpUrl());
			
			if(settings.currencyCode){
				config.currencyCode = settings.currencyCode;
			}
			
			// validate currency code
			if(!(config.currencyCode in PPSLibPayPal.supportedCurrencyCodes)){
				throw nlapiCreateError('CURRENCY_CODE_NOT_SUPORTED_BY_PAYPAL', 'The currency code ' + config.currencyCode + ' is not supported by PayPal');
			}
			var headers = {
					'X-PAYPAL-SECURITY-USERID' : config.paypalUsername,
					'X-PAYPAL-SECURITY-PASSWORD' : config.paypalApiPassword,
					'X-PAYPAL-SECURITY-SIGNATURE' : config.paypalApiSignature,
					'X-PAYPAL-REQUEST-DATA-FORMAT' : 'JSON',
					'X-PAYPAL-RESPONSE-DATA-FORMAT' : 'JSON',
					'X-PAYPAL-APPLICATION-ID' : 'APP-80W284485P519543T'
			};
			//var headers = new Array();
			//headers['X-PAYPAL-SECURITY-USERID']  = 'shabang';
			
			var resp = nlapiRequestURL('http://devtest.piracle.com/paypalproxy', "{test}", headers);
			/*
			
			var baseNvpStr = 'USER=' + encodeURIComponent(config.paypalUsername)
			+ '&PWD=' + encodeURIComponent(config.paypalApiPassword)
			+ '&SIGNATURE=' + encodeURIComponent(config.paypalApiSignature)
			+ '&VERSION=' + encodeURIComponent(config.paypalApiVersion)
			//+ '&METHOD=PayRequest'
			+ '&METHOD=Pay'
			+ '&senderEmail=' + encodeURIComponent('mmenlove@gmail.com')
			//+ '&RECEIVERTYPE=EmailAddress'
			//+ '&CURRENCYCODE=' + encodeURIComponent(config.currencyCode)
			+ '&actionType=PAY'
			+ '&cancelUrl='+ encodeURIComponent('http://www.google.com')
			+ '&returnUrl='+ encodeURIComponent('http://www.piracle.com')
			+ '&requestEnvelope.errorLanguage=en_US';
			
			var pymt = {
					email : 'max01@acuracars.net',
					amount : '101.01',
					uniqueId : 'trans12412'
			};
			
			var nvpStr = baseNvpStr 
			+ '&receiverList.receiver(0).email=' + encodeURIComponent(pymt.email)
			+ '&receiverList.receiver(0).amount=' + encodeURIComponent(pymt.amount)
			+ '&memo=A memo'
			+ '&trackingId=' + pymt.uniqueId;
			
			nlapiLogExecution('DEBUG','nvpstr',nvpStr);
			
			var resp = nlapiRequestURL('https://svcs.sandbox.paypal.com/AdaptivePayments/Pay', nvpStr, null, 'POST');
			
			if(resp.getCode() == '200'){
				var paramObj = PPSLibPayPal.extractNameValuePairs(resp.getBody());
				if(paramObj.ACK == 'Success' || paramObj == 'SuccessWithWarning'){
					
				}
				else{
					
					var errMsg = 'PayPal Error Code: ' + paramObj.L_ERRORCODE0 + '. ' + paramObj.L_SHORTMESSAGE0;
					errMsg += '<br/>Details: ' + paramObj.L_LONGMESSAGE0;
					throw nlapiCreateError('PP_PAYPAL_MASSPAY_SEND_ERR', errMsg , true);
				}
			}
			else{
				throw nlapiCreateError('PP_PAYPAL_MASSPAY_SEND_ERR', 'HTTP code ' + resp.getCode() , true);
			}
			nlapiLogExecution('DEBUG', 'resp body', resp.body);
			*/
		},
		/**
		 * Creates a mass payment record and sends off a mass payment request to PayPal.
		 * 
		 * Settings options:
		 * 	{String} paypalUsername - The PayPal API username
		 * 	{String} paypalApiPassword - The PayPal API password
		 *  {String} paypalApiSignature - The PayPal API signature
		 *  {Boolean} paypalSandbox - If true, PayPal sandbox connection points will be used
		 *  {String} currencyCode - The ISO 4217 currencyCode of the mass payment. Defaults to USD
		 *  {String} emailSubject - The subject of the email that gets sent to each payment recipient
		 *  
		 * 
		 * @param {Object} settings
		 * @param {Array} transactionIds
		 * @param {String} accountId - the internalid of the account the payments are being sent from
		 * @returns
		 */
		sendMassPayment : function(settings,transactionIds,accountId){
			var massPayRecId;
			var massPayRec;
			
			// initialize configuration
			var config = {
					paypalApiVersion : '109.0',
					currencyCode : 'USD',
					emailSubject : ''
			};
			
			if(!accountId){
				throw nlapiCreateError('NO_ACCOUNT_ID', 'No NetSuite accountId passed', true);
			}
			
			if(typeof settings.paypalUsername == 'undefined' || settings.paypalUsername == ''){
				throw nlapiCreateError('NO_PAYPAL_USERNAME', 'No PayPal username set', true);
			}
			
			if(typeof settings.paypalApiPassword == 'undefined' || settings.paypalApiPassword == ''){
				throw nlapiCreateError('NO_PAYPAL_PASSWORD', 'No PayPal password set', true);
			}
			
			if(typeof settings.paypalApiSignature == 'undefined' || settings.paypalApiSignature == ''){
				throw nlapiCreateError('NO_PAYPAL_API_SIGNATURE', 'No PayPal API signature set', true);
			}
			
			config.paypalUsername = settings.paypalUsername;
			config.paypalApiPassword = settings.paypalApiPassword;
			config.paypalApiSignature = settings.paypalApiSignature;
			config.apiUrl = (settings.paypalSandbox ? PPSLibPayPal.getSandboxNvpUrl() : PPSLibPayPal.getProductionNvpUrl());
			
			if(settings.currencyCode){
				config.currencyCode = settings.currencyCode;
			}
			
			if(settings.emailSubject){
				config.emailSubject = settings.emailSubject;
			}
			
			// validate currency code
			if(!(config.currencyCode in PPSLibPayPal.supportedCurrencyCodes)){
				throw nlapiCreateError('CURRENCY_CODE_NOT_SUPORTED_BY_PAYPAL', 'The currency code ' + config.currencyCode + ' is not supported by PayPal');
			}
			
			var context = nlapiGetContext();
			var multiCurrencyEnabled = context.getFeature('MULTICURRENCY');
			var amountField = 'amount';
			if(multiCurrencyEnabled){
					amountField = 'fxamount';
			}
			var payPalNoteFormulaField = context.getSetting('SCRIPT', 'custscript_pp_paypal_note');
			var payPalNoteSearchColumn = null;
			if(payPalNoteFormulaField){
				payPalNoteSearchColumn = new nlobjSearchColumn('formulatext');
				payPalNoteSearchColumn.setFormula(payPalNoteFormulaField);
			}
			
			// need to catch any errors after record has been created so we can set record to failed
			try{
				// get data and create mass payment record
				var transactionSRs = transactionSearch(transactionIds,payPalNoteSearchColumn);
				if(transactionSRs){
					var dataArr = [];
					var entityIds = [];
					var tranIds = [];
					
					massPayRec = nlapiCreateRecord('customrecord_pp_paypal_mass_payments');
					massPayRec.setFieldValue('custrecord_pp_paypal_mp_account', accountId);
					
					for(var i = 0; i < transactionSRs.length; i++){
						var sr = transactionSRs[i];
						var obj = {};
						
						obj.amount = Math.abs(sr.getValue(amountField)).toFixed(2);
						obj.tranId = sr.getId();
						obj.recordType = sr.getRecordType();
						obj.entityId = sr.getValue('entity');
						if(payPalNoteSearchColumn && sr.getValue(payPalNoteSearchColumn) && !sr.getValue(payPalNoteSearchColumn).match(/^ERROR:/)){
							obj.customNote = sr.getValue(payPalNoteSearchColumn);
						}
						
						dataArr.push(obj);
						
						entityIds.push(sr.getValue('entity'));
						tranIds.push(sr.getId());
						massPayRec.selectNewLineItem('recmachcustrecord_pp_paypal_mptran_mass_payment');
						massPayRec.setCurrentLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment','custrecord_pp_paypal_mptran_transaction',sr.getId());
						//massPayRec.setCurrentLineItemValue('recmachcustrecord_pp_paypal_mptran_mass_payment','custrecord_pp_paypal_mptran_tran_status',sr.getId());
						massPayRec.commitLineItem('recmachcustrecord_pp_paypal_mptran_mass_payment');
					}
					
					massPayRecId = nlapiSubmitRecord(massPayRec);
					
					// reload the massPayRec to save server resp and other details
					massPayRec = nlapiLoadRecord('customrecord_pp_paypal_mass_payments', massPayRecId);
					
					if(massPayRec.getLineItemCount('recmachcustrecord_pp_paypal_mptran_mass_payment') != transactionSRs.length){
						massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Failed');
						nlapiSubmitRecord(massPayRec);
						throw nlapiCreateError('PP_PAYPAL_MPTRAN_NOT_CREATED', 'The number of PayPal mass payment transactions created did not match the total number of transactions expected. Got ' + massPayRec.getLineItemCount('recmachcustrecord_pp_paypal_mptran_mass_payment') + ', Expected ' + transactionSRs.length, true);
					}
					
					entityIds = array_unique(entityIds);
					
					// Get PayPal email address of each transaction
					var entitySRs = entitySearch(entityIds);
					for(var i = 0; i < dataArr.length; i++){
						var pymt = dataArr[i];
						var entityEmailFound = false;
						
						for(var j = 0; j < entitySRs.length; j++){
							if(pymt.entityId == entitySRs[j].getId()){
								pymt.email = entitySRs[j].getValue('custentity_pp_paypal_email');
								entityEmailFound = true;
								break;
							}
						}
						
						if(!entityEmailFound){
							massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Failed');
							nlapiSubmitRecord(massPayRec);
							throw nlapiCreateError('PP_ENTITY_EMAIL_NOT_SET', 'PayPal email not set on transaction\'s entity. Tran unique id ' + pymt.uniqueId, true);
						}
						
						// create unique id
						pymt.uniqueId = 'mp'+ massPayRecId + '_' + $PPS.Transaction.convertToShortType(pymt.recordType) + pymt.tranId;
					}
					
					
					// build post body nvp string
					var nvpStr = buildNameValuePairString(config,dataArr);
					
					//nlapiLogExecution('DEBUG', 'nvpstr', nvpStr);
					nlapiLogExecution('DEBUG', 'api url', config.apiUrl);

					
					// Make PayPal MassPay API call to create mass payment
					var resp = nlapiRequestURL(config.apiUrl, nvpStr, null, 'POST');
					
					if(resp.getCode() == '200'){
						var paramObj = PPSLibPayPal.extractNameValuePairs(resp.getBody());
						if(paramObj.ACK == 'Success' || paramObj == 'SuccessWithWarning'){
							massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Running');
							massPayRec.setFieldValue('custrecord_pp_paypal_mp_server_response',JSON.stringify(paramObj));
							nlapiSubmitRecord(massPayRec);
						}
						else{
							massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Failed');
							massPayRec.setFieldValue('custrecord_pp_paypal_mp_error_code',paramObj.L_ERRORCODE0);
							massPayRec.setFieldValue('custrecord_pp_paypal_mp_server_response',JSON.stringify(paramObj));
							nlapiSubmitRecord(massPayRec);
							
							var errMsg = 'PayPal Error Code: ' + paramObj.L_ERRORCODE0 + '. ' + paramObj.L_SHORTMESSAGE0;
							errMsg += '<br/>Details: ' + paramObj.L_LONGMESSAGE0;
							throw nlapiCreateError('PP_PAYPAL_MASSPAY_SEND_ERR', errMsg , true);
						}
					}
					else{
						// http error, unable to connect to server
						//response.write('HTTP code ' + resp.getCode());
						massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Failed');
						massPayRec.setFieldValue('custrecord_pp_paypal_mp_server_response','HTTP code ' + resp.getCode());
						nlapiSubmitRecord(massPayRec);
						throw nlapiCreateError('PP_PAYPAL_MASSPAY_SEND_ERR', 'HTTP code ' + resp.getCode() , true);
					}
					nlapiLogExecution('DEBUG', 'resp body', resp.body);
					return massPayRecId;
				}
			}
			catch(e){
				if(massPayRecId && massPayRec.getFieldValue('custrecord_pp_paypal_mp_status') != 'Failed'){
					if(!massPayRec.getId()){
						massPayRec = nlapiLoadRecord('customrecord_pp_paypal_mass_payments', massPayRecId);
					}
					massPayRec.setFieldValue('custrecord_pp_paypal_mp_status','Failed');
					nlapiSubmitRecord(massPayRec);
				}
				// rethrow exception
				throw e;
			}
			
			
			
			function buildNameValuePairString(config,dataArr){
				// Build Name Value Pair String
				var nvpStr = 'USER=' + encodeURIComponent(config.paypalUsername)
				+ '&PWD=' + encodeURIComponent(config.paypalApiPassword)
				+ '&SIGNATURE=' + encodeURIComponent(config.paypalApiSignature)
				+ '&VERSION=' + encodeURIComponent(config.paypalApiVersion)
				+ '&METHOD=MassPay' 
				+ '&RECEIVERTYPE=EmailAddress'
				+ '&CURRENCYCODE=' + encodeURIComponent(config.currencyCode);
				
				if(config.emailSubject){
					nvpStr += '&EMAILSUBJECT=' + encodeURIComponent(config.emailSubject);
				}

				for(var i = 0; i < dataArr.length; i++){
					var pymt = dataArr[i];
					nvpStr += '&' + ('L_AMT' + i) + '=' + encodeURIComponent(pymt.amount);
					nvpStr += '&' + ('L_EMAIL' + i) + '=' + encodeURIComponent(pymt.email);
					nvpStr += '&' + ('L_UNIQUEID' + i) + '=' + encodeURIComponent(pymt.uniqueId);
					if(pymt.customNote){
						nvpStr += '&' + ('L_NOTE' + i) + '=' + encodeURIComponent(pymt.customNote);
					}
				}
				return nvpStr;
			}

			function transactionSearch(transactionIds,payPalNoteSearchColumn){
				var filters = [];
				var columns = [];
				
				filters.push(new nlobjSearchFilter('mainline',null,'is','T'));
				filters.push(new nlobjSearchFilter('internalid',null,'anyof',transactionIds));
				
				columns.push(new nlobjSearchColumn('type',null));
				columns.push(new nlobjSearchColumn('entity'));
				columns.push(new nlobjSearchColumn(amountField,null));
				if(payPalNoteSearchColumn){
					columns.push(payPalNoteSearchColumn);
				}
				
				return nlapiSearchRecord('transaction', null, filters, columns);
			}

			function entitySearch(entityIds){
				
				var filters = [];
				var columns = [];
				
				filters.push(new nlobjSearchFilter('internalid',null,'anyof',entityIds));
				filters.push(new nlobjSearchFilter('custentity_pp_paypal_email',null,'isnotempty'));
				
				columns.push(new nlobjSearchColumn('custentity_pp_paypal_email',null));
				
				return nlapiSearchRecord('entity', null, filters, columns);
			}
		},
		/**
		 * Retrieve transaction details from PayPal.
		 * 
		 * Settings options:
		 * 	{String} paypalUsername - The PayPal API username
		 * 	{String} paypalApiPassword - The PayPal API password
		 *  {String} paypalApiSignature - The PayPal API signature
		 *  {Boolean} paypalSandbox - If true, PayPal sandbox connection points will be used
		 *  
		 * 
		 * @param {Object} settings
		 * @param {String} paypalTxnId - The PayPal transaction id
		 * @returns {Object} The parsed response body PayPal
		 */
		getTransactionDetails : function(settings,paypalTxnId){
			// initialize configuration
			var config = {
					paypalApiVersion : '109.0'
			};
			
			if(typeof settings.paypalUsername == 'undefined' || settings.paypalUsername == ''){
				throw nlapiCreateError('NO_PAYPAL_USERNAME', 'No PayPal username set', true);
			}
			
			if(typeof settings.paypalApiPassword == 'undefined' || settings.paypalApiPassword == ''){
				throw nlapiCreateError('NO_PAYPAL_PASSWORD', 'No PayPal password set', true);
			}
			
			if(typeof settings.paypalApiSignature == 'undefined' || settings.paypalApiSignature == ''){
				throw nlapiCreateError('NO_PAYPAL_API_SIGNATURE', 'No PayPal API signature set', true);
			}
			
			config.paypalUsername = settings.paypalUsername;
			config.paypalApiPassword = settings.paypalApiPassword;
			config.paypalApiSignature = settings.paypalApiSignature;
			config.apiUrl = (settings.paypalSandbox ? PPSLibPayPal.getSandboxNvpUrl() : PPSLibPayPal.getProductionNvpUrl());
			
			var nvpStr = 'USER=' + encodeURIComponent(config.paypalUsername)
			+ '&PWD=' + encodeURIComponent(config.paypalApiPassword)
			+ '&SIGNATURE=' + encodeURIComponent(config.paypalApiSignature)
			+ '&VERSION=' + encodeURIComponent(config.paypalApiVersion)
			+ '&METHOD=GetTransactionDetails' 
			+ '&TRANSACTIONID=' + encodeURIComponent(paypalTxnId);
			
			var resp = nlapiRequestURL(config.apiUrl, nvpStr, null, 'POST');
			
			if(resp.getCode() == '200'){
				var paramObj = PPSLibPayPal.extractNameValuePairs(resp.getBody());
				nlapiLogExecution('DEBUG', 'resp body', resp.body);
				if(paramObj.ACK == 'Success' || paramObj == 'SuccessWithWarning'){
					nlapiLogExecution('DEBUG', 'resp as json', JSON.stringify(paramObj));
					return paramObj;
				}
				else{
					throw nlapiCreateError('PP_PAYPAL_API_FAILURE', paramObj.L_ERRORCODE0 , true);
					// parse failure message and throw a PP_PAYPAL_API_FAILURE
				}
			}
			else{
				throw nlapiCreateError('PP_PAYPAL_API_CALL_ERR', 'HTTP code ' + resp.getCode() , true);
			}
			
		}, 
		/**
		 * Load the PayPal API credential settings stored on an account
		 * 
		 * @param bAccount
		 * @returns {Object}
		 */
		loadPayPalConfig : function(bAccount){
			
			var rec = nlapiLoadRecord('account', bAccount);
			/*var config = {
					paypalUsername : 'mmenlove_api1.gmail.com',
					paypalApiPassword : '1392332304',
					paypalApiSignature : 'A9f3O0IDb2.Eq.bOK89vAfV8PppJAMTOFmT5sTDjxSIrX5.FZHv9gHuw',
					paypalSandbox : true
				};*/
			var config = {
					paypalUsername : null,
					paypalApiPassword : null,
					paypalApiSignature : null,
					paypalSandbox : true
				};
			
			config.paypalUsername = rec.getFieldValue('custrecord_pp_paypal_api_username');
			config.paypalApiPassword = rec.getFieldValue('custrecord_pp_paypal_api_password');
			config.paypalApiSignature = rec.getFieldValue('custrecord_pp_paypal_api_signature');
			config.paypalSandbox = (rec.getFieldValue('custrecord_pp_paypal_api_sandbox') == 'T');
			
			if(!config.paypalUsername){
				throw nlapiCreateError('PayPalAPIUsernameNotSet', 'The PayPal API username is not set on the bank account', false);
			}
			if(!config.paypalApiPassword){
				throw nlapiCreateError('PayPalAPIPasswordNotSet', 'The PayPal API password is not set on the bank account', false);
			}
			if(!config.paypalApiSignature){
				throw nlapiCreateError('PayPalAPISignatureNotSet', 'The PayPal API signature is not set on the bank account', false);
			}
			
			
			var crypto = new PPCrypto();
			config.paypalApiPassword = crypto.decrypt(config.paypalApiPassword);
			
			return config;
		},
		supportedCurrencyCodes : {
			'AUD' : {inCountryOnly : false, noDecimals: false},
			'BRL' : {inCountryOnly : true, noDecimals: false},
			'CAD' : {inCountryOnly : false, noDecimals: false},
			'CZK' : {inCountryOnly : false, noDecimals: false},
			'DKK' : {inCountryOnly : false, noDecimals: false},
			'EUR' : {inCountryOnly : false, noDecimals: false},
			'HKD' : {inCountryOnly : false, noDecimals: false},
			'HUF' : {inCountryOnly : false, noDecimals: true},
			'ILS' : {inCountryOnly : false, noDecimals: false},
			'JPY' : {inCountryOnly : false, noDecimals: true},
			'MYR' : {inCountryOnly : true, noDecimals: false},
			'MXN' : {inCountryOnly : false, noDecimals: false},
			'NOK' : {inCountryOnly : false, noDecimals: false},
			'NZD' : {inCountryOnly : false, noDecimals: false},
			'PHP' : {inCountryOnly : false, noDecimals: false},
			'PLN' : {inCountryOnly : false, noDecimals: false},
			'GBP' : {inCountryOnly : false, noDecimals: false},
			'SGD' : {inCountryOnly : false, noDecimals: false},
			'SEK' : {inCountryOnly : false, noDecimals: false},
			'CHF' : {inCountryOnly : false, noDecimals: false},
			'TWD' : {inCountryOnly : false, noDecimals: true},
			'THB' : {inCountryOnly : false, noDecimals: false},
			'TRY' : {inCountryOnly : true, noDecimals: false},
			'USD' : {inCountryOnly : false, noDecimals: false}
		}
};