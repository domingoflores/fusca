/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 0.1.1      15 Dec 2014     TJTyrrell
 *
 */

var mcp = (function(){

	/*
	 * Declare private / public
	 */
	var public = {},
		private = {};

	public.libraries = {};

	/*
	 * Execution Time Variables
	 */
	private._startTime = new Date().getTime();
	private._executionTime = [];

	private._callType = '';
	private._callFile = '';
	private._callModule = '';
	private._callFunction = '';
	private._callVariables = '';
	private._arguments = '';
	private._dataIn = {};
	private._requestPost = {};

	/*
	 * Declare environment info
	 */
	public.context = nlapiGetContext();
	private._nsEnvironment = public.context.getEnvironment(); // Get NetSuite environment
	private._nsUserId = public.context.getUser(); // Get NetSuite User ID
	private._nsUserName = public.context.getName(); // Get NetSuite User Full Name
	private._nsUserEmail = public.context.getEmail(); // Get NetSuite User Email

	private._environment = '';
	private._scriptUrl = false;

	/*
	 * Declare payload information for Restlets
	 */
	private._returnStatus = { SUCCESS : "Success", ERROR : "Error", WARNING : "Warning", INCOMPLETE : "Incomplete" };
	private._messages = [];
	private._status;
	private._data;
	private._payloadOnly = false;

	private._response;


	/**
	 *
	 * Constructor function
	 *
	 */
	private.__construct = function() {

		/*
		 * ------------------------------------------------------------------------------------------------
		 * Determine the environment
		 * ------------------------------------------------------------------------------------------------
		 */

		var scriptSrc = '';

		var iosuiteFilters = [],
			iosuiteColumns = [],
			iosuiteUserIdKey = false,
			iosuiteEnvironmentKey = 0,
			results = null,
			urlInfo = null,
			userDir = '',
			url = '';

		iosuiteColumns.push( new nlobjSearchColumn('custrecord_iosuite_employee') );
		iosuiteColumns.push( new nlobjSearchColumn('custrecord_iosuite_url') );
		iosuiteColumns.push( new nlobjSearchColumn('custrecord_iosuite_is_production') );
		iosuiteColumns.push( new nlobjSearchColumn('custrecord_iosuite_is_staging') );

		switch( private._nsEnvironment ) {

			case 'PRODUCTION':

				// Staging Environment
				iosuiteFilters  = [
				                   	[ 'custrecord_iosuite_is_production', 'is', 'T' ],
				                   	'or',
				                   	[ 'custrecord_iosuite_is_staging', 'is', 'T' ]
				                  ];
				results = nlapiSearchRecord('customrecord_iosuite_users', null, iosuiteFilters, iosuiteColumns) || [];

				if( results.length > 0 ) {
					for( var i = 0; i < results.length; i++ ) {

						// Match the ioSuite user based on user ID
						if( results[i].getValue('custrecord_iosuite_employee') == private._nsUserId) {
							iosuiteUserIdKey = i;
						}
						// Match the ioSuite user based on environment
						if( results[i].getValue('custrecord_iosuite_employee') == '' && (results[i].getValue('custrecord_iosuite_is_staging') == 'T' || results[i].getValue('custrecord_iosuite_is_production') == 'T' )) {
							iosuiteEnvironmentKey = i;
						}
					}

					// Use the user ID match if it was set
					if( iosuiteUserIdKey !== false ) {
						nlapiLogExecution('DEBUG', 'iosuiteUserIdKey', iosuiteUserIdKey);
						iosuiteEnvironmentKey = iosuiteUserIdKey;
					}
				}

				private._environment = 'production';
				url = results[ iosuiteEnvironmentKey ].getValue('custrecord_iosuite_url');
				nlapiLogExecution('DEBUG', 'IOSUITE EMPLOYEE?', results[iosuiteEnvironmentKey].getText('custrecord_iosuite_employee'));
				nlapiLogExecution('DEBUG', 'IS STAGING?', results[iosuiteEnvironmentKey].getValue('custrecord_iosuite_is_staging'));
				nlapiLogExecution('DEBUG', 'IS PRODUCTION?', results[iosuiteEnvironmentKey].getValue('custrecord_iosuite_is_production'));
				nlapiLogExecution('DEBUG', 'URL', url);
				break;




			case 'SANDBOX':

				// Staging Environment
				iosuiteFilters  = [
				                   	[ 'custrecord_iosuite_is_staging', 'is', 'T' ],
				                    'or',
				                    [ 'custrecord_iosuite_employee', 'is', private._nsUserName ]
				                  ];
				results = nlapiSearchRecord('customrecord_iosuite_users', null, iosuiteFilters, iosuiteColumns) || [];

				if( results.length > 0 ) {
					for( var i = 0; i < results.length; i++ ) {

						if( results[i].getValue('custrecord_iosuite_employee') == private._nsUserId ) {
							iosuiteUserIdKey = i;
						}
						if( results[i].getValue('custrecord_iosuite_employee') == '' && results[i].getValue('custrecord_iosuite_is_staging') == 'T'  ) {
							iosuiteEnvironmentKey = i;
						}
					}

					if( iosuiteUserIdKey !== false ) {
						iosuiteEnvironmentKey = iosuiteUserIdKey;
					}
				}

				private._environment = ( iosuiteUserIdKey !== false ) ? 'development' : 'staging';
				url = results[ iosuiteEnvironmentKey ].getValue('custrecord_iosuite_url');
				break;

		}


		private._scriptUrl = url.toLowerCase();
		private._scriptUrl = ( private._scriptUrl.slice(-1) != '/' ) ? private._scriptUrl + '/' : private._scriptUrl;

		public.setStatus( 'INCOMPLETE' );

	}

	private.masterControlProceedure = function() {

		/*
		 * ------------------------------------------------------------------------------------------------
		 * This is the master control, prep and call
		 * ------------------------------------------------------------------------------------------------
		 */

		var call, url, urlObject,
			contents,
			code, error,
			response = {},
			fnstring;

		call = private._callType + private._callModule + private._callFile;// + '/' + private._deploymentId
		url = private._scriptUrl + call + private._arguments;

		try{

			public.addExecutionTime('start:' + call );

			// Call the URL and get contents
			nlapiLogExecution('DEBUG', 'url', url);
			urlObject = nlapiRequestURL(url); //, postdata, headers, callback, httpMethod);
			contents = urlObject.getBody();
			nlapiLogExecution('DEBUG', 'contents', contents);

			public.addExecutionTime('load:' + call );

			nlapiLogExecution('DEBUG', 'function', private._callFunction);

			fnstring = private._callModule.replace('/', '').toLowerCase() + '_' + private._callFile.replace('/', '').toLowerCase();

			switch(fnstring) {
				case 'clearinghouse_exchangerecord':
					nlapiLogExecution('DEBUG', 'nscode', fnstring);
				  	code = clearinghouse_exchangerecord();
				  	break;
				case 'generic_crud':
					nlapiLogExecution('DEBUG', 'nscode', fnstring);
					code = generic_crud();
				  	break;
				default:
					nlapiLogExecution('DEBUG', 'iosuite', fnstring);
					code = eval( contents );
			}

			nlapiLogExecution('DEBUG', 'code', code);

			public.addExecutionTime('loaded:' + call );

			response = code[ private._callFunction ]( private._dataIn );

			nlapiLogExecution('DEBUG', 'response', response);

			public.addExecutionTime('finishExecute:' + call );

		} catch(error) {

			//var errorCode, errorDetails, errorLineNum, errorStackString = '', errorStack, errorAssocRecord, errorMisc;
			var responseError = {};

			responseError.url = url;
			responseError.call = call;
			responseError.callFunction = private._callFunction;

			if(error instanceof nlobjError ) {

				//error = error.getCode() + '\n' + error.getDetails();
				nlapiLogExecution( 'ERROR', 'system error', error + '. DUMP: ' + error.toString());

				responseError.code = error.getCode();
				responseError.details = error.getDetails();
				responseError.lineNum = 'Unknown';
				responseError.stack = error.getStackTrace();
				responseError.assocRecord = error.getInternalId();
				responseError.misc = error.getUserEvent();

				if( private._callType == 'client' ) {
					console.error( 'system error | ' + error.getCode() + ': ' + error.getDetails() + '. DUMP: ' + error.toString());
				}

			} else {

				nlapiLogExecution('DEBUG', 'unexpected error', error.toString() );
				nlapiLogExecution('DEBUG', 'error', error.rhinoException );
				nlapiLogExecution('DEBUG', 'error', error.lineNumber );

				responseError.code = error.name;
				responseError.details = error.message;
				responseError.lineNum = error.lineNumber;
				var stackString = error.stack;
				responseError.assocRecord = 'Unknown';
				responseError.misc = error.rhinoException;

				responseError.stack = stackString.split('at');


				if( private._callType == 'client' ) {
					console.error( 'system error | ' + error.toString());
					console.error( error.lineNumber );
				}

			}

			response = private._formatError( responseError );

			public.setReturnPayload( response );

			public.setStatus( 'ERROR' );
			public.addMessage(197, 'Attempted URL: ' + url);
			public.addMessage( 197, 'Invalid API Call: ' + error + ". Request: [ " + private._callType + ' | ' + private._callFunction + " ]" );

		}

		switch( private._callType ) {
			case 'restlet':
				// Further processing for RESTlets
				return private._return();
				break;
			case 'suitelet':
				return response;
				break;
		}

	}

	/**
	 *
	 * Suitelet Function
	 *
	 */

	public.suitelet = function( request, response ) {

		private._response = response;

		var parameters = request.getAllParameters(),
			arguments = '',
			callFile = '',
			callModule = '',
			output,
			deploymentInfo = [],
			deploymentId = public.context.getDeploymentId();


		for( parameter in parameters ) {
			switch( parameter ) {
				case 'suitelet':
					callFile = '/' + parameters[ parameter ];
					break;
				case 'module':
					callModule = '/' + parameters[ parameter ];
					break;
				default:
					var argument = parameter + "=" + encodeURIComponent( parameters[ parameter ] );
					arguments += ( arguments == '' ) ? '?' + argument : '&' + argument;
					break;
			}
		}

		if( callModule == '' && callFile == '' ) {
			deploymentInfo = deploymentId.split('_');
			nlapiLogExecution('DEBUG', 'Deployment Info Length', deploymentInfo.length);
			switch( deploymentInfo.length ) {
				case 3:
					callFile = '/' + deploymentInfo[2];
					break;
				case 4:
					callModule = '/' + deploymentInfo[2];
					callFile = '/' + deploymentInfo[3];
					break;
				default:
					break;
			}
		}

		nlapiLogExecution('DEBUG', 'callFile', callFile);

		private._callType = 'suitelet';
		private._callFile = callFile;
		private._callModule = callModule;
		private._callFunction = 'load';
		private._arguments = arguments;
		private._dataIn = request;

		output = private.masterControlProceedure();

		if( typeof output == 'string' ) {
			response.write( output );
		} else {
			response.writePage( output );
		}

	};

	/**
	 * --------------------------------------------------------
	 * Restlet Controls
	 * --------------------------------------------------------
	 */

	private._restletRouter = function( dataIn ) {

		var arguments = '',
			callFile = '',
			callModule = '',
			tempDataIn;

		try {
			/*
			 * Due to environment/posttype inconsistencies, try to force DataIn to be an object.
			 * If this fails, dataIn should be able to be accessed like a JavaScript parameter
			 */
			tempDataIn = JSON.parse( dataIn.toString() );
		} catch(e) {
			tempDataIn = dataIn;
		}

		dataIn = tempDataIn;

		for( var parameter in dataIn ) {

			switch( parameter ) {

				case 'restlet':
					callFile = dataIn[ parameter ];
					break;
				case 'module':
					callModule = dataIn[ parameter ];
					break;
				default:
					var argument = parameter + "=" + encodeURIComponent( dataIn[ parameter ] );
					arguments += ( arguments == '' ) ? '?' + argument : '&' + argument;
					break;
			}
		}

		private._callType = 'restlet';
		private._callFile = '/' + callFile;
		private._callModule = '/' + callModule;
		private._arguments = arguments;
		private._dataIn = dataIn;

	};

	public.restletCreate = function( dataIn ) {

		private._restletRouter( dataIn );

		private._callFunction = 'createCall';

		return private.masterControlProceedure();

	};

	public.restletRead = function( dataIn ) {

		private._restletRouter( dataIn );

		private._callFunction = 'readCall';

		return private.masterControlProceedure();

	};

	public.restletUpdate = function( dataIn ) {

		private._restletRouter( dataIn );

		private._callFunction = 'updateCall';

		return private.masterControlProceedure();

	};

	public.restletDelete = function( dataIn ) {

		private._restletRouter( dataIn );

		private._callFunction = 'deleteCall';

		return private.masterControlProceedure();

	};

	/*
	 * "Is Status" functions
	 */
	public.isStatus = function( status ){
		return private._status == private._returnStatus[ status ];
	};

	/*
	 * Setters/Adders
	 */
	public.setStatus = function( status ) {
		private._status = private._returnStatus[ status ];
	};

	public.setReturnPayload = function( payload, payloadOnly ) {
		private._payloadOnly = ( payloadOnly === true ) ? true : false;
		private._data = payload;
	};

	public.addMessage = function( code, message ) {
		private._messages.push( { 'code' : code, 'message' : message } );
	};

	/*
	 * Getters
	 */
	public.getStatus = function() {
		return private._status;
	};

	public.getReturnPayload = function() {
		return private._data;
	};

	public.getMessages = function() {
		return private._messages;
	};

	/**
	 * @returns {String} Output string based on return type
	 */
	private._return = function() {

		var returnObject = {};

		if( private._payloadOnly ) {

			returnObject = public.getReturnPayload();

		} else {
			returnObject.status = public.getStatus();
			returnObject.messages = public.getMessages();
			returnObject.data = public.getReturnPayload();
			returnObject.executionTime = public.getExecutionTime();
		}

		return returnObject;

	};

	/**
	 *
	 * User Event Functions
	 *
	 */

	public.userEventBeforeLoad = function( type, form, request ) {

		private._callType = 'userEvent';
		private._callFunction = 'beforeLoad';
		private._arguments.type = type;
		private._arguments.form = form;
		private._arguments.request = request;

		private.masterControlProceedure();

	};

	public.userEventBeforeSubmit = function( type ) {

		private._callType = 'userEvent';
		private._callFunction = 'beforeSubmit';
		private._arguments.type = type;

		private.masterControlProceedure();

	};

	public.userEventAfterSubmit = function( type ) {

		private._callType = 'userEvent';
		private._callFunction = 'afterSubmit';
		private._arguments.type = type;

		private.masterControlProceedure();

	};

	/**
	 *
	 * Client Functions
	 *
	 */

	public.clientMaster = function( callFile, callModule ) {

		private._callType = 'client';
		private._callFile = '/' + callFile;
		private._callModule = '/' + callModule;
		private._callFunction = 'init';

		private.masterControlProceedure();

	};

	public.clientPageInit = function( type ) {

		private._callType = 'client';
		private._callFunction = 'pageInit';
		private._arguments.type = type;

		private.masterControlProceedure();

	};

	public.clientSaveRecord = function( type ) {

		private._callType = 'client';
		private._callFunction = 'saveRecord';

		private.masterControlProceedure();

	};

	public.clientValidateField = function( type, name, linenum ) {

		private._callType = 'client';
		private._callFunction = 'validateField';
		private._arguments.type = type;
		private._arguments.name = name;
		private._arguments.linenum = linenum;

		private.masterControlProceedure();

	};

	public.clientFieldChanged = function( type, name, linenum ) {

		private._callType = 'client';
		private._callFunction = 'fieldChanged';
		private._arguments.type = type;
		private._arguments.name = name;
		private._arguments.linenum = linenum;

		private.masterControlProceedure();

	};

	public.clientPostSourcing = function( type, name ) {

		private._callType = 'client';
		private._callFunction = 'postSourcing';
		private._arguments.type = type;
		private._arguments.name = name;

		private.masterControlProceedure();

	};

	public.clientLineInit = function( type ) {

		private._callType = 'client';
		private._callFunction = 'lineInit';
		private._arguments.type = type;

		private.masterControlProceedure();

	};

	public.clientValidateLine = function( type ) {

		private._callType = 'client';
		private._callFunction = 'validateLine';
		private._arguments.type = type;

		private.masterControlProceedure();

	};

	public.clientRecalc = function( type ) {

		private._callType = 'client';
		private._callFunction = 'recalc';
		private._arguments.type = type;

		private.masterControlProceedure();

	};

	public.clientValidateInsert = function( type ) {

		private._callType = 'client';
		private._callFunction = 'validateInsert';
		private._arguments.type = type;

		private.masterControlProceedure();

	};

	public.clientValidateDelete = function( type ) {

		private._callType = 'client';
		private._callFunction = 'validateDelete';
		private._arguments.type = type;

		private.masterControlProceedure();

	};


	/*
	 * Execution Time Functions
	 */

	public.trackTime = function() {

		var testTime = new Date().getTime(),
			executionTime = testTime - public.getStartTime();

		return executionTime;

	};

	public.addExecutionTime = function( action ) {
		private._executionTime.push( { 'action' : action, 'time' : public.trackTime() } );
	};

	public.getExecutionTime = function() {
		return private._executionTime;
	};

	public.getStartTime = function() {
		return private._startTime;
	};

	private._formatError = function( error ) {

		var errorTemplate = '<html><head><title>Error: {{code}}</title></head><body><div style="width: 500px; margin: 0 auto;"><h1 style="text-align:center;">{{code}}</h1><table cellspacing="0" style="width: 500px; border: 1px solid #E82C15; text-align: left;"><thead style=""><tr style="background: #E82C15;"><th colspan="3" style="width: 500px;"><h2 style="color: #FFFFFF; line-height: 50px; margin: 0 0 0 5px;">{{details}}</h2><ul><li><strong>Associated Record: </strong>{{assocRecord}}</li><li><strong>Line Number: </strong>{{lineNum}}</li><li><strong>URL: </strong>{{url}}</li><li><strong>Call: </strong>{{call}}</li><li><strong>Call Function: </strong>{{callFunction}}</li><li><strong>Misc. Info: </strong>{{misc}}</li></ul></th></tr></thead><tbody><tr><td colspan="3"><h3 style="margin: 5px 0 0 5px;">Call Stack</h3></td></tr><tr><td style="padding-left: 5px;">ID</td><td>File</td><td>Line Number</td></tr>{{stackRows}}</tbody></table></div></body></html>',
			stackRow = '<tr><td style="padding-left: 5px;">{{id}}</td><td>{{file}}</td><td>{{lineNumber}}</td></tr>',
			stackString = '';

		errorTemplate = errorTemplate.replace(/{{code}}/g, error.code);
		errorTemplate = errorTemplate.replace(/{{details}}/g, error.details);
		errorTemplate = errorTemplate.replace(/{{assocRecord}}/g, error.assocRecord);
		errorTemplate = errorTemplate.replace(/{{lineNum}}/g, error.lineNum);
		errorTemplate = errorTemplate.replace(/{{misc}}/g, error.misc);
		errorTemplate = errorTemplate.replace(/{{url}}/g, error.url);
		errorTemplate = errorTemplate.replace(/{{call}}/g, error.call);
		errorTemplate = errorTemplate.replace(/{{callFunction}}/g, error.callFunction);

		if( error.stack.length > 0 ) {
			for( var i = 0; i < error.stack.length; i++ ) {

				var cleanString = error.stack[i].replace(/ at/g, '').replace(/at /g, '').replace(/ /g, '').trim(),
					id = cleanString.substring(cleanString.indexOf('$') + 1, cleanString.indexOf(':') ),
					file = cleanString.substring(0, cleanString.indexOf('$') ),
					lineNumber = cleanString.substring(cleanString.indexOf(':') + 1, cleanString.length ),
					rowString = '';

				rowString = stackRow.replace(/{{id}}/g, id);
				rowString = rowString.replace(/{{file}}/g, file);
				stackString += rowString.replace(/{{lineNumber}}/g, lineNumber);
			}
		}

		errorTemplate = errorTemplate.replace(/{{stackRows}}/g, stackString );

		return errorTemplate;

	};


	private.__construct();

	/*

	1.) Create Search Filters/Columns for Exchange Records
	2.) Execute Exchange Record Search

	3.) Create Search Filters/Columns for Certificate Records
	4.) Exectute Certificate Record Search
	5.) Map Certificate Records to Exchange Records

	6.) Create Search Filters/Columns for Document Records
	7.) Construct formatted Document Records
	8.) Map Document Records to Exchange readyState

	9.) Retrieve raw Master Payment Records
	10.) Construct formatted Clearinghouse Configuration Records
	11.) Map Clearinghouse Configuration Records to Exchange readyState

	 * Module Description
	 *
	 * Version    Date            Author           Remarks
	 * 1.00       01 Dec 2014     TJTyrrell
	 * 2.00       28 Feb 2017     Peter Gail
	 *
	 */
	function clearinghouse_exchangerecord() {

		// Constants
		var EXCHANGE_REC_NETSUITE_ID = 'customrecord_acq_lot';
		var DEAL_EVENT_REC_NETSUITE_ID = 'customrecord_payment_import_record';
		var CERT_REC_NETSUITE_ID = 'customrecord_acq_lot_cert_entry';
		var DOC_REC_NETSUITE_ID = 'customrecord_document_management';
		var DOC_PREFILL_REC_NETSUITE_ID = 'customrecord_ch_doc_prefill';
		var CH_CONFIG_REC_NETSUITE_ID = 'customrecord_ch_section_config';
		var RECORD_HELPER = RecordHelper();
		var DOC_PREFILL_REC_HELPER = DocumentPrefillRecordHelper();
		var CERT_REC_HELPER = CertificateRecordHelper(RECORD_HELPER, DOC_PREFILL_REC_HELPER);
		var DOC_REC_HELPER = DocumentRecordHelper(DOC_PREFILL_REC_HELPER);
		var CH_CONFIG_HELPER = ClearinghouseConfigRecordHelper();
		var EXCHANGE_REC_HELPER = ExchangeRecordHelper(RECORD_HELPER, CERT_REC_HELPER, DOC_PREFILL_REC_HELPER, DOC_REC_HELPER, CH_CONFIG_HELPER);

		// Public module
		// Contains functions used to overwrite global public object
		var module = {

			createCall: function (dataIn) { },

			readCall: function (dataIn) {

				var returnPayload = {};
				var exchangeRecords = [];
				var exchangeRecord;

				public.addExecutionTime('startReadRecord');
				nlapiLogExecution('DEBUG', 'readRecord', 'readRecord start');


				/* -------------------- EXCHANGE RECORD -------------------- */
				try {


					// STEPS 1 & 2.) Build and execute search for Exchange Records
					exchangeRecords = EXCHANGE_REC_HELPER.getExchangeRecords(dataIn);

					if (exchangeRecords != null) {

						EXCHANGE_REC_HELPER.buildMappedExchangeRecords(exchangeRecords, returnPayload);

						public.addExecutionTime('finishReadRecord');
						public.setStatus('SUCCESS');
						nlapiLogExecution('DEBUG', 'readRecord', 'PARAMS: ' + dataIn.id);
						public.setReturnPayload(returnPayload);
					} else {

						/*
						*  No associated Exchange Records
						*/
						public.setStatus('ERROR');
						public.addMessage('rhino', 'There are no associated Exchange Records with this request');
						nlapiLogExecution('ERROR', 'readRecord', 'There are no associated Exchange Records with this request');
					}
				} catch (e) {
					RECORD_HELPER.handleError(e);
				}
			},

			updateCall: function (dataIn) { },

			deleteCall: function (dataIn) { }
		};


		/* ***************** HELPER FUNCTIONS ***************** */

		/* ******************************************************************
		********************* EXCHANGE RECORD HELPERS ***********************
		****************************************************************** */

		/**
		 * Exchange Record Module contains logic for queryinng and building a Exchange Record
		 * @param  {object} RecordHelper   RecordHelper module
		 * @param  {object} CertificateRecordHelper   CertificateRecordHelper module
         * @param  {object} DocumentPrefillRecordHelper   DocumentPrefillRecordHelper module
		 * @param  {object} DocumentRecordHelper   DocumentRecordHelper module
		 * @param  {object} ClearinghouseConfigRecordHelper   ClearinghouseConfigRecordHelper module
		 * @return {object}        publicly available Exchange Record methods
		 */
		function ExchangeRecordHelper(RecordHelper, CertificateRecordHelper, DocumentPrefillRecordHelper, DocumentRecordHelper, ClearinghouseConfigRecordHelper) {

			// Publicly available methods
			var module = {
				/**
				 * Builds search criteria and executes query for Exchange Records
				 * @param  {object} dataIn Client request object
				 * @return {array}        List of unmapped/unformatted Exchange Records
				 */
				getExchangeRecords: function (dataIn) {

					// STEP 1.) Create search filters/columns for Exchange Records
					var exRecSearchFilters = createExRecSearchFilters(dataIn);
					var exRecSearchCols = createExRecSearchCols(dataIn, exRecSearchFilters);

					// STEP 2.) Exectute Exchange Record search
					var unmappedExchangeRecords = nlapiSearchRecord(EXCHANGE_REC_NETSUITE_ID, null, exRecSearchFilters, exRecSearchCols);

					return unmappedExchangeRecords;
				},

				/**
				 * Constructs a formatted list of Exchange Records
				 * with associated records mapped to each instance
				 * @param  {array} exchangeRecords List of Exhange Record search results
				 * @param  {object} returnPayload   Response to requestor
				 * @return {null}                 void
				 */
				buildMappedExchangeRecords: function (exchangeRecords, returnPayload) {
					var exchangeRecord = null;
					var letter_of_transmittals = [];
					var letterOfTransmittal = null;
					var deal = '';
					var sectionConfiguration = null;
					var dealEventRecord = null;
					var prefillRecords = null;

					returnPayload.lot_identifier_code = exchangeRecords[0].getValue('custrecord_acq_loth_zzz_zzz_identcode');

					for (var i = 0; i < exchangeRecords.length; i++) {
						exchangeRecordOriginal = exchangeRecords[i];
						deal = RecordHelper.getDealInfo(exchangeRecordOriginal.getValue('custrecord_acq_loth_zzz_zzz_deal'));

						// Get the Exchange Record Level Prefill Records
						prefillRecords = DocumentPrefillRecordHelper.buildDocPrefillRecord('custrecord_cdp_exrec', exchangeRecordOriginal.getId());

						letterOfTransmittal = buildUnmappedLOT(deal, exchangeRecordOriginal);

						// Only return ER if deal if custentity_acq_deal_lot_send_lots on deal is checked OR if ER is sales demonstration
						var payoutType = letterOfTransmittal.custrecord_acq_lot_payout_type ? letterOfTransmittal.custrecord_acq_lot_payout_type.value : "";
						var sendLots = deal.custentity_acq_deal_lot_send_lots;
						if (sendLots == 'T' || payoutType.toLowerCase() === 'sales demonstration') {
							letterOfTransmittal = DocumentPrefillRecordHelper.mapPrefillRecordsToLOT(letterOfTransmittal, prefillRecords);

							/* -------------------- CERTIFICATE RECORD -------------------- */
							// STEPS 3, 4, & 5.)
							letterOfTransmittal = CertificateRecordHelper.getLOTWithCertificates(letterOfTransmittal, exchangeRecordOriginal);

							/* ---------------------- DOCUMENT RECORD ---------------------- */
							// STEP 6, 7, & 8.)
							letterOfTransmittal = DocumentRecordHelper.getLOTWithDocumentRecords(letterOfTransmittal, exchangeRecordOriginal);

							/* ------------ CLEARINGHOUSE CONFIGURATION RECORD ------------ */

							// STEP 9, 10, & 11.) Retrieve raw Clearinghouse Configuration Records

							// Retrieve Deal Event Record if already loaded OR load it for this Exchange Record
							dealEventRecord = checkForDERecInMemory(letterOfTransmittal.lot_deal_event_id, dealEventRecord);

							// Deal Event Record has been found for this LOT
							if (dealEventRecord) {
								letterOfTransmittal.lot_deal_event_name = dealEventRecord.getFieldValue('name');
								letterOfTransmittal.custrecord_de_title = dealEventRecord.getFieldValue('custrecord_de_title');
							}

							sectionConfiguration = dealEventRecord ? dealEventRecord.getFieldValue('custrecord_de_ch_section_config') : null;

							letterOfTransmittal = ClearinghouseConfigRecordHelper.getLOTWithCHConfigRecords(letterOfTransmittal, exchangeRecordOriginal, sectionConfiguration);

							// SETUP EXCHANGE RECORD PAYMENT INFO
							letterOfTransmittal.letter_of_transmittal_payments[0] = _getPaymentValues(exchangeRecordOriginal);

							removeEmptyFields(letterOfTransmittal);
							letter_of_transmittals.push(letterOfTransmittal);
						}
					}

					returnPayload.letter_of_transmittals = letter_of_transmittals;

					return null;
				}
			}; // Module

			/* ------------- PRIVATE MEHTODS ------------- */

			/**
			 * Check if an LOT's associated Deal Event has been loaded, else retrieve and assign it
			 * @param  {integer} lotDealEventID Individual Deal Event ID for a given LOT
			 * @param  {object} dealEventRecord  Deal Event already loaded in memory
			 * @return {object} dealEventRecord  Deal Event already loaded in memory
			 */
			function checkForDERecInMemory(lotDealEventID, dealEventRecord) {
				lotDealEventID = parseInt(lotDealEventID);

				// Have not yet loaded Deal Events for this LOT
				var dealEventID = dealEventRecord ? parseInt(dealEventRecord.id) : lotDealEventID;

				var deRecInMemory = (dealEventRecord && (lotDealEventID === dealEventID));

				// No Deal Event record in memory OR incorrect Deal Event is in memory
				if (!deRecInMemory) {
					dealEventRecord = getDealEvents(lotDealEventID);
				}

				return dealEventRecord;
			}

			/**
			 * Builds search criteria and executes query for Clearinghouse Configuration Records
			 * @param  {string} dealID internalid of an individual Exchange Record's Master Payment Record
			 * @return {array}        List of unmapped/unformatted Clearinghouse Configuration Records
			 */
			function getDealEvents(dealID) {
				if (!dealID) {
					return null;
				}
				var dealEvent = nlapiLoadRecord(DEAL_EVENT_REC_NETSUITE_ID, dealID);

				return dealEvent;
			}

			/**
			 * Generates the Exchange Record Search Filters to load the records
			 * @param  {object} dataIn Client request object
			 * @return {array}        Exchange Record Search Filters
			 */
			function createExRecSearchFilters(dataIn) {

				var exchangeRecordSearchFilters = [];

				if (typeof dataIn.exchangeHash != 'undefined') {
					exchangeRecordSearchFilters = [new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_identcode', null, 'is', dataIn.exchangeHash)];
				} else if (typeof dataIn.contactId != 'undefined') {
					exchangeRecordSearchFilters = [new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_contact', null, 'is', dataIn.contactId)];
				} else {
					public.setStatus('ERROR');
					public.addMessage('rhino', 'Contact ID or Exchange Hash not set');
					nlapiLogExecution('ERROR', 'readRecord', 'Contact ID or Exchange Hash not set');

					return false;
				}

				exchangeRecordSearchFilters.push(new nlobjSearchFilter('custrecord_acq_loth_zzz_zzz_lotdelivery', null, 'anyof', [5, 12]));
				exchangeRecordSearchFilters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
				// Filter out Exchange Records if the Deal Record associated with it is an incomplete deal.
				// This is the Deal Legal Wording Final Compliance field on the Deal
				// exchangeRecordSearchFilters.push(new nlobjSearchFilter('custrecord_deal_legalwordingfinal', null, 'is', 'T'));

				return exchangeRecordSearchFilters;
			}

			/**
			 * Generates the Exchange Record Search Columns to load the records
			 * @param  {object} dataIn        Client request object
			 * @param  {array} searchFilters Exchange Record Search Filters
			 * @return {array}               Exchange Record Search Columns
			 */
			function createExRecSearchCols(dataIn, searchFilters) {

				var exchangeRecordSearchColumns = exchRecSearchColumns();
				var lotCertificatePaymentGetColumns = CertificateRecordHelper.getLotCertificatePaymentColumns();

				// Set the column filters for the Payment Information
				for (var column in lotCertificatePaymentGetColumns) {
					exchangeRecordSearchColumns.push(new nlobjSearchColumn(lotCertificatePaymentGetColumns[column]));
				}

				return exchangeRecordSearchColumns;
			}

			/**
			 * Constructs an individual Letter Of Transmittal
			 * @param  {object} exchangeRecord Individual Exchange Record
			 * @return {object}      Constructed LOT
			 */
			function buildUnmappedLOT(deal, exchangeRecord) {
				var exchangeRecordReturnCleanColumns = _getExchangeRecordReturnCleanColumns();
				var exchangeRecordReturnColumns = _getExchangeRecordReturnColumns();

				// Basic LOT structure
				var letterOfTransmittal = {
					lot_deal_event_id: exchangeRecord.getValue('custrecord_acq_lot_payment_import_record'),
					lot_deal_event_name: '',
					custrecord_acq_lot_payout_type: exchangeRecord.getValue('custrecord_acq_lot_payout_type'),
					custrecord_exrec_shrhldr_settle_curr: exchangeRecord.getValue('custrecord_exrec_shrhldr_settle_curr'),
					custrecord_de_title: '',
					custrecord_acq_loth_zzz_zzz_docs4sign: exchangeRecord.getValue('custrecord_acq_loth_zzz_zzz_docs4sign'),
					custrecord_ch_status: exchangeRecord.getValue('custrecord_ch_status'),
					custrecord_ch_completed_datetime: exchangeRecord.getValue('custrecord_ch_completed_datetime'),
					legal_letter_text: deal.custentity_acq_deal_zzz_zzz_legal_text,
					insert_before_lot: deal.insert_before_lot,
					insert_after_lot: deal.insert_after_lot,
					legal_text: deal.legal_text,
					custentity_acq_deal_fx_curr_cbox: deal.custentity_acq_deal_fx_curr_cbox,
					custentity_acq_deal_fx_settle_currencies: deal.custentity_acq_deal_fx_settle_currencies,
					deal_currency: deal.custentity_acq_deal_funded_currency.value, /*deal.currency,*/
					/* fx_enabled: exchangeRecord.getValue('custrecord_exrec_fx_level'), TEMP deactivating due to business decision */
					fx_enabled: deal.custentity_acq_deal_fx_level, /* TEMP reactivating due to business decision */
					deal_funded_currency: deal.custentity_acq_deal_funded_currency,	// Deal Funded Currency
					letter_of_transmittal_fees: {
						custentity_acq_deal_lotach: deal.custentity_acq_deal_lotach,
						custentity_qx_acq_deal_domesticwire: deal.custentity_qx_acq_deal_domesticwire,
						custentity_qx_acq_deal_internationalwire: deal.custentity_qx_acq_deal_internationalwire,
						custentity_qx_acq_deal_domesticcheck: deal.custentity_qx_acq_deal_domesticcheck,
						custentity_qx_acq_deal_internationalchec: deal.custentity_qx_acq_deal_internationalchec
					},
					paying_bank: deal.custentity_acq_deal_financial_bank_compa, // Paying Bank Company
					lot_uuid: exchangeRecord.getId(),
					letter_of_transmittal_certificates: [],
					letter_of_transmittal_payments: []
				};

				// Set Clean Column Names
				for (var cleanColumnName in exchangeRecordReturnCleanColumns) {
					letterOfTransmittal[cleanColumnName] = RecordHelper.getRecordValue(exchangeRecord, exchangeRecordReturnCleanColumns[cleanColumnName]);
				}

				// Set Regular Column Names
				for (var columnNameId in exchangeRecordReturnColumns) {
					var replacedColumnName = exchangeRecordReturnColumns[columnNameId].replace('DEX', 'de1');
					letterOfTransmittal[replacedColumnName] = RecordHelper.getRecordValue(exchangeRecord, exchangeRecordReturnColumns[columnNameId]);
				}

				return letterOfTransmittal;
			}

			function _getPaymentValues(record) {

				var lotCertificatePaymentGetColumns = CertificateRecordHelper.getLotCertificatePaymentColumns();
				var exchangeRecordPaymentReturnColumns = _getExchangeRecordPaymentReturnColumns();
				var payMethod = record.getText('custrecord_acq_loth_4_de1_lotpaymethod');
				var payMethodId = record.getValue('custrecord_acq_loth_4_de1_lotpaymethod');

				payMethod = payMethod.toString().toLowerCase().replace(' ', '_');

				var paymentObject = {
					enum_acq_lot_payment_method_type_uuid: payMethodId,
					enum_acq_lot_payment_method_type: payMethod
				};

				for (var j = 0; j < exchangeRecordPaymentReturnColumns.length; j++) {
					/*
					 *  Set empty values for all necessary keys
					 */
					paymentObject[exchangeRecordPaymentReturnColumns[j]] = '';
				}

				for (var columnNameId in lotCertificatePaymentGetColumns) {
					var columnName = lotCertificatePaymentGetColumns[columnNameId];
					paymentObject[columnName] = RecordHelper.getRecordValue(record, lotCertificatePaymentGetColumns[columnNameId].replace('de1', 'DEX'));
				}

				switch (payMethod) {

					case 'ach':
					case 'aes_ach':
						paymentObject.payment_payable_to_name = record.getValue('custrecord_acq_loth_5a_de1_nameonbnkacct');
						paymentObject.payment_bank_acct_number_iban = record.getValue('custrecord_acq_loth_5a_de1_bankacctnum');
						paymentObject.payment_bank_acct_aba_swift_number = record.getValue('custrecord_acq_loth_5a_de1_abaswiftnum');
						paymentObject.payment_bank_acct_bank_name = record.getValue('custrecord_acq_loth_5a_de1_bankname');
						paymentObject.payment_bank_acct_type = record.getText('custrecord_acq_loth_5a_de1_bankaccttype');
						paymentObject.payment_bank_acct_type_uuid = record.getValue('custrecord_acq_loth_5a_de1_bankaccttype');
						paymentObject.payment_address1 = record.getValue('custrecord_acq_loth_5a_de1_bankaddr');
						paymentObject.payment_city = record.getValue('custrecord_acq_loth_5a_de1_bankcity');
						paymentObject.payment_state = record.getText('custrecord_acq_loth_5a_de1_bankstate');
						paymentObject.payment_postal_code = record.getValue('custrecord_acq_loth_5a_de1_bankzip');
						paymentObject.payment_bank_acct_bank_contact_name = record.getValue('custrecord_acq_loth_5a_de1_bankcontact');
						paymentObject.payment_bank_acct_bank_contact_phone = record.getValue('custrecord_acq_loth_5a_de1_bankphone');
						break;

					case 'domestic_check':
					case 'international_check':
					case 'aes_domestic_check':
					case 'aes_international_check':

						paymentObject.payment_payable_to_name = record.getValue('custrecord_acq_loth_5c_de1_checkspayto');
						paymentObject.payment_mail_to_name = record.getValue('custrecord_acq_loth_5c_de1_checksmailto');
						paymentObject.payment_address1 = record.getValue('custrecord_acq_loth_5c_de1_checksaddr1');
						paymentObject.payment_address2 = record.getValue('custrecord_acq_loth_5c_de1_checksaddr2');
						paymentObject.payment_city = record.getValue('custrecord_acq_loth_5c_de1_checkscity');
						paymentObject.payment_state = record.getText('custrecord_acq_loth_5c_de1_checksstate');
						paymentObject.payment_postal_code = record.getValue('custrecord_acq_loth_5c_de1_checkszip');
						paymentObject.payment_country = record.getText('custrecord_acq_loth_5c_de1_checkscountry');

						break;

					case 'domestic_wire':
					case 'international_wire':
					case 'aes_domestic_wire':
					case 'aes_international_wire':

						paymentObject.payment_bank_acct_bank_name = record.getValue('custrecord_acq_loth_5b_de1_nameonbnkacct');
						paymentObject.payment_bank_acct_number_iban = record.getValue('custrecord_acq_loth_5b_de1_bankacctnum');
						paymentObject.payment_bank_acct_aba_swift_number = record.getValue('custrecord_acq_loth_5b_de1_abaswiftnum');
						paymentObject.bank_sort_number = record.getText('custrecord_acq_loth_5b_de1_sortcode');
						paymentObject.payment_bank_acct_bank_name = record.getValue('custrecord_acq_loth_5b_de1_bankname');
						paymentObject.payment_address1 = record.getValue('custrecord_acq_loth_5b_de1_bankaddr');
						paymentObject.payment_city = record.getValue('custrecord_acq_loth_5b_de1_bankcity');
						paymentObject.payment_state = record.getText('custrecord_acq_loth_5b_de1_bankstate');
						paymentObject.payment_country = record.getText('custrecord_acq_loth_5b_de1_bankcountry');
						paymentObject.payment_postal_code = record.getValue('custrecord_acq_loth_5b_de1_bankzip');
						paymentObject.payment_bank_acct_bank_contact_name = record.getValue('custrecord_acq_loth_5b_de1_bankcontact');
						paymentObject.payment_bank_acct_bank_contact_phone = record.getText('custrecord_acq_loth_5b_de1_bankphone');
						paymentObject.payment_bank_acct_further_credit_account_number = record.getValue('custrecord_acq_loth_5b_de1_frthrcrdtacct');
						paymentObject.payment_bank_acct_further_credit_account_name = record.getValue('custrecord_acq_loth_5b_de1_frthrcrdtname');
						paymentObject.instructions = record.getValue('custrecord_acq_loth_5b_de1_addlinstrct');
	                    paymentObject.residency_id = record.getValue('custrecord_exrec_type_of_residency');

						break;
				}

				return paymentObject;
			}

			/* ------------- RECORD COLUMNS ------------- */

			function exchRecSearchColumns() {
				return [
					/*
					 * General Fields
					 */
					new nlobjSearchColumn('custrecord_acq_lot_payment_import_record'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_identcode'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_deal'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_shareholder'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_contact'),
					new nlobjSearchColumn('custrecord_qx_acq_loth_buyername'),
					new nlobjSearchColumn('custrecord_qx_acq_loth_sellername'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_lotdelivery'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_rcvdtimestmp'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_w9esigndoc'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_esigndoc'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_esigndoclink'),
					new nlobjSearchColumn('custrecord_exrec_lotechosign_url'),
					new nlobjSearchColumn('custrecord_exrec_w9echosign_url'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_acqstatus'),
					new nlobjSearchColumn('custrecord_exrec_exception_url'),
					new nlobjSearchColumn('custrecord_exrec_exceptionechosign_url'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_w8_9timestmp'),
					new nlobjSearchColumn('custrecord_acq_lot_payout_type'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_docs4sign'),
					new nlobjSearchColumn('custrecord_ch_status'),
					new nlobjSearchColumn('custrecord_ch_completed_datetime'),
					/* new nlobjSearchColumn('custrecord_exrec_fx_level'), TEMP deactivating due to business decision */
					
					/*
					 * Sub-States Fields
					 */
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_login_status'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_lockout_stas'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_vrfy_hldngs'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_cntct_info'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_tax_doc_stas'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_pay_info'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_mdlin_status'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_esign_status'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_add_doc_stat'),
					new nlobjSearchColumn('custrecord_acq_loth_zzz_zzz_de_status'),

					/*
					 * DE0 Fields
					 */
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldname'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldaddr1'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldaddr2'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldaddr3'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldcity'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldstate'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldpostalcd'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldcountry'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldemail'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldphone'),
					new nlobjSearchColumn('custrecord_acq_loth_2_src_ssnein'),
					new nlobjSearchColumn('custrecord_acq_loth_1_src_shrhldauth'),

					/*
					 * DE1 Fields
					 */
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldname'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldaddr1'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldaddr2'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldaddr3'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldcity'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldstate'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldpostalcd'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldcountry'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldemail'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldphone'),
					new nlobjSearchColumn('custrecord_acq_loth_2_de1_ssnein'),
					new nlobjSearchColumn('custrecord_acq_loth_2_de1_taxsigpresent'),
					new nlobjSearchColumn('custrecord_acq_loth_2_de1_bckupwholding'),
					new nlobjSearchColumn('custrecord_acq_loth_6_de1_medallion'),
					new nlobjSearchColumn('custrecord_acq_loth_2_de1_taxsigpresent'),
					new nlobjSearchColumn('custrecord_acq_loth_2_de1_taxclass'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldauth'),
					new nlobjSearchColumn('custrecord_acq_loth_1_de1_shrhldtitle'),
					new nlobjSearchColumn('custrecord_acq_loth_2_de1_irsname'),
					new nlobjSearchColumn('custrecordacq_loth_2_de1_taxidmethod'),
					new nlobjSearchColumn('custrecord_exrec_ch_otp_required')
				];
			}

			function _getExchangeRecordReturnColumns() {
				return [

					/*
					 * General Fields
					 */
					'custrecord_acq_loth_zzz_zzz_identcode',
					'custrecord_acq_loth_zzz_zzz_deal',
					'custrecord_acq_loth_zzz_zzz_shareholder',
					'custrecord_acq_loth_zzz_zzz_contact',
					'custrecord_qx_acq_loth_buyername',
					'custrecord_qx_acq_loth_sellername',
					'custrecord_acq_loth_zzz_zzz_lotdelivery',
					'custrecord_acq_loth_zzz_zzz_rcvdtimestmp',
					'custrecord_acq_loth_zzz_w9esigndoc',
					'custrecord_acq_loth_zzz_zzz_esigndoc',
					'custrecord_acq_loth_zzz_esigndoclink',
					'custrecord_acq_loth_zzz_zzz_acqstatus',
					'custrecord_exrec_lotechosign_url',
					'custrecord_exrec_w9echosign_url',
					'custrecord_exrec_exception_url',
					'custrecord_exrec_exceptionechosign_url',
					'custrecord_acq_loth_zzz_zzz_w8_9timestmp',
					'custrecord_acq_lot_payout_type',
					'custrecord_exrec_ch_otp_required',

					/*
					 * Sub-States Fields
					 */
					'custrecord_acq_loth_zzz_zzz_login_status',
					'custrecord_acq_loth_zzz_zzz_lockout_stas',
					'custrecord_acq_loth_zzz_zzz_vrfy_hldngs',
					'custrecord_acq_loth_zzz_zzz_cntct_info',
					'custrecord_acq_loth_zzz_zzz_tax_doc_stas',
					'custrecord_acq_loth_zzz_zzz_pay_info',
					'custrecord_acq_loth_zzz_zzz_mdlin_status',
					'custrecord_acq_loth_zzz_zzz_esign_status',
					'custrecord_acq_loth_zzz_zzz_add_doc_stat',
					'custrecord_acq_loth_zzz_zzz_de_status',

					/*
					 * DE Fields
					 */
					'custrecord_acq_loth_1_DEX_shrhldname',
					'custrecord_acq_loth_1_DEX_shrhldaddr1',
					'custrecord_acq_loth_1_DEX_shrhldaddr2',
					'custrecord_acq_loth_1_DEX_shrhldaddr3',
					'custrecord_acq_loth_1_DEX_shrhldcity',
					'custrecord_acq_loth_1_DEX_shrhldstate',
					'custrecord_acq_loth_1_DEX_shrhldpostalcd',
					'custrecord_acq_loth_1_DEX_shrhldcountry',
					'custrecord_acq_loth_1_DEX_shrhldemail',
					'custrecord_acq_loth_1_DEX_shrhldphone',
					'custrecord_acq_loth_2_DEX_ssnein',
					'custrecord_acq_loth_2_DEX_taxsigpresent',
					'custrecord_acq_loth_2_DEX_bckupwholding',
					'custrecord_acq_loth_6_DEX_medallion',
					'custrecord_acq_loth_2_DEX_taxsigpresent',
					'custrecord_acq_loth_2_DEX_taxclass',
					'custrecord_acq_loth_1_DEX_shrhldauth',
					'custrecord_acq_loth_1_DEX_shrhldtitle',
					'custrecord_acq_loth_2_DEX_irsname',
					'custrecordacq_loth_2_DEX_taxidmethod'
				];
			}

			function _getExchangeRecordReturnCleanColumns() {
				return {
					'lot_identifier_code': 'custrecord_acq_loth_zzz_zzz_identcode',
					'deal_uuid': 'custrecord_acq_loth_zzz_zzz_deal',
					'shareholder_uuid': 'custrecord_acq_loth_zzz_zzz_shareholder',
					'contact_uuid': 'custrecord_acq_loth_zzz_zzz_contact',
					'buyer_name': 'custrecord_qx_acq_loth_buyername',
					'seller_name': 'custrecord_qx_acq_loth_sellername',
					'enum_acq_lot_sent_status': 'custrecord_acq_loth_zzz_zzz_lotdelivery',
					'lot_received_from_shareholder_date': 'custrecord_acq_loth_zzz_zzz_rcvdtimestmp',
					'w9_esign_document_link': 'custrecord_acq_loth_zzz_w9esigndoc',
					'lot_shareholder_name': 'custrecord_acq_loth_1_DEX_shrhldname',
					'lot_shareholder_address1': 'custrecord_acq_loth_1_DEX_shrhldaddr1',
					'lot_shareholder_address2': 'custrecord_acq_loth_1_DEX_shrhldaddr2',
					'lot_shareholder_address3': 'custrecord_acq_loth_1_DEX_shrhldaddr3',
					'lot_shareholder_city': 'custrecord_acq_loth_1_DEX_shrhldcity',
					'lot_shareholder_state': 'custrecord_acq_loth_1_DEX_shrhldstate',
					'lot_shareholder_postal_code': 'custrecord_acq_loth_1_DEX_shrhldpostalcd',
					'lot_shareholder_country': 'custrecord_acq_loth_1_DEX_shrhldcountry',
					'lot_shareholder_email_address': 'custrecord_acq_loth_1_DEX_shrhldemail',
					'lot_shareholder_phone': 'custrecord_acq_loth_1_DEX_shrhldphone',
					'lot_shareholder_tax_ident': 'custrecord_acq_loth_2_DEX_ssnein',
					'lot_shareholder_tax_signature_present': 'custrecord_acq_loth_2_DEX_taxsigpresent',
					'lot_shareholder_backup_witholding': 'custrecord_acq_loth_2_DEX_bckupwholding',
					'medallion_required': 'custrecord_acq_loth_6_DEX_medallion',
					'lot_esign_document_link': 'custrecord_acq_loth_zzz_zzz_esigndoc',
					'lot_signature_present': 'custrecord_acq_loth_2_DEX_taxsigpresent',
					'enum_tax_classification': 'custrecord_acq_loth_2_DEX_taxclass',
					'lot_shareholder_authorized_signer': 'custrecord_acq_loth_1_DEX_shrhldauth',
					'lot_shareholder_authorized_signer_title': 'custrecord_acq_loth_1_DEX_shrhldtitle',
					'lot_shareholder_tax_name': 'custrecord_acq_loth_2_DEX_irsname',
					'enum_tax_identification_method_id': 'custrecordacq_loth_2_DEX_taxidmethod',
					'tax_identification_method': 'custrecordacq_loth_2_DEX_taxidmethod',
					'custrecord_acq_loth_zzz_zzz_lockout_stas': 'custrecord_acq_loth_zzz_zzz_lockout_stas' // Status of user lockout
				};
			}

			function _getExchangeRecordPaymentReturnColumns() {
				return [
					'payment_payable_to_name',
					'payment_mail_to_name',
					'payment_mail_to_method_uuid',
					'payment_mail_to_method',
					'payment_bank_acct_number_iban',
					'payment_bank_acct_aba_swift_number',
					'payment_bank_acct_type_uuid',
					'payment_bank_acct_type',
					'payment_bank_acct_bank_name',
					'payment_address1',
					'payment_address2',
					'payment_address3',
					'payment_address4',
					'payment_city',
					'payment_state_uuid',
					'payment_state',
					'payment_country_uuid',
					'payment_country',
					'payment_postal_code',
					'payment_bank_acct_bank_contact_name',
					'payment_bank_acct_bank_contact_phone',
					'payment_bank_acct_further_credit_account_number',
					'payment_bank_acct_further_credit_account_name',
					'final_payment_amount',
					'final_payment_denomination_uuid',
					'final_payment_denomination',
					'instructions',
					'bank_sort_number'
				];
			}
			/**
			 * Removes fields for which there are no values as requested by Clearinghouse
			 * @param  {object} exchRecord The object representation of the Exchange Record to clean
			 * @return {null}        void
			 */
			function removeEmptyFields(exchRecord) {
				if (!exchRecord.letter_of_transmittal_certificates || exchRecord.letter_of_transmittal_certificates.length === 0) {
					delete exchRecord.letter_of_transmittal_certificates;
					return null;
				}
			}

			return module;
		} // EXCHANGE RECORD HELPER MODULE


		/* ******************************************************************
		******************* CERTIFICATE RECORD HELPERS **********************
		****************************************************************** */

		/**
		 * Certificate Record Module contains logic for queryinng and building a Certificate Record
		 * @param  {object} RecordHelper   RecordHelper module
         * @param  {object} DocumentPrefillRecordHelper   DocumentPrefillRecordHelper module
		 * @return {object}        publicly available Certificate Record methods
		 */
		function CertificateRecordHelper(RecordHelper, DocumentPrefillRecordHelper) {

			// Publicly available methods
			var module = {
				/**
				 * Retrieve Certificate Records and attaches them to the LOT
				 * @param  {object} lot Letter Of Transmittal to associate Certificate Records
				 * @param  {object} exchangeRecord Raw Exchange Record search result
				 * @return {object}     Letter Of Transmittal with assigned Certificate Records
				 */
				getLOTWithCertificates: function getLOTWithCertificates(lot, exchangeRecord) {
					// STEPS 3 & 4.) Build and execute search for Certificate Records
					var lotCertificates = getCertificateRecords(exchangeRecord.getId()) || null;
					// STEP 5 Map Document Records To LOT
					if (lotCertificates != null) {
						lot = mapCertsToLOT(lot, lotCertificates);
					}

					return lot;
				},

				/**
				 * Retrieves the list of Certificate Record search columns
				 * @return {array} Search columns for Certificate Record searches
				 */
				getLotCertificatePaymentColumns: function () {
					return _getLotCertificatePaymentColumns();
				}
			}; // Module

			/* ------------- PRIVATE METHODS ------------- */

			/**
			 * Certificate Record Class
			 * @param {object} certRecord raw NetSuite Certificate Record
			 */
			function CertificateRecord(certRecord) {
				this.letter_of_transmittal_certificates_uuid = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_zzz_zzz_rowhash');
				this.enum_acq_lot_cert_detail_status = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_zzz_zzz_lotcestatus');
				this.certificate_number = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_de1_certnumber');
				this.certificate_description = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_de1_certdesc');
				this.number_of_shares = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_de1_numbershares');
				this.is_certificate_lost = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_de1_lostcert');
				this.custrecord_acq_lotce_zzz_zzz_rowhash = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_zzz_zzz_rowhash');
				this.custrecord_acq_lotce_zzz_zzz_lotcestatus = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_zzz_zzz_lotcestatus');
				this.custrecord_acq_lotce_3_de1_certnumber = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_DEX_certnumber');
				this.custrecord_acq_lotce_3_de1_certdesc = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_DEX_certdesc');
				this.custrecord_acq_lotce_3_de1_numbershares = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_DEX_numbershares');
				this.custrecord_acq_lotce_3_de1_lostcert = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_de1_lostcert');
				this.custrecord_acq_lotce_3_de1_certtype = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_3_DEX_certtype');
				this.custrecord_hide_in_ch = RecordHelper.getRecordValue(certRecord, 'custrecord_hide_in_ch');
				this.isinactive = RecordHelper.getRecordValue(certRecord, 'isinactive');
				this.custrecord_acq_lotce_zzz_zzz_acqdate = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_zzz_zzz_acqdate');
				this.custrecord_acq_lotce_zzz_zzz_costbasis = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_zzz_zzz_costbasis');
				this.custrecord_acq_lotce_zzz_zzz_currencytyp = RecordHelper.getRecordValue(certRecord, 'custrecord_acq_lotce_zzz_zzz_currencytyp');
				this.customrecord_ch_doc_prefill = DocumentPrefillRecordHelper.buildDocPrefillRecord('custrecord_cdp_cert', certRecord.getId());
			}

			/**
			 * Determines if a Certificate Record associated with an LOT allows
			 * should be returned with that LOT to Clearinghouse
			 * @param  {object} lotCertificate Individual Certificates Record
			 * @return {boolean}                     Whether or not to send Certificate Records for this LOT
			 */
			function hideRecordFromCH(lotCertificate) {
				if (lotCertificate.getValue('custrecord_hide_in_ch').toLowerCase() == 't') {
					return true;
				}
				return false;
			}

			/**
			 * Generates the Certificate Record Search Filters to load the records
			 * @param  {string} exchangeRecordId internalid of an individual Exchange Record
			 * @return {array}        Certificate Record Search Filters
			 */
			function createCertRecSearchFilters(exchangeRecordId) {
				var lotCertificateSearchFilters = [
					new nlobjSearchFilter('custrecord_acq_lotce_zzz_zzz_parentlot', null, 'is', exchangeRecordId),
					new nlobjSearchFilter('isinactive', null, 'is', 'F'),
					new nlobjSearchFilter('custrecord_hide_in_ch', null, 'is', 'F')
				];

				return lotCertificateSearchFilters;
			}

			/**
			 * Generates the Certificate Record Search Columns to load the records
			 * @return {array}               Certificate Record Search Columns
			 */
			function createCertRecSearchCols() {

				var lotCertificateGetColumns = _getLotCertificateGetColumns(); // returns array of search columns
				var lotCertificateSearchColumns = [];

				for (var lotCertificateColumnId in lotCertificateGetColumns) {
					lotCertificateSearchColumns.push(new nlobjSearchColumn(lotCertificateGetColumns[lotCertificateColumnId]));
				}

				return lotCertificateSearchColumns;
			}

			/**
			 * Builds search criteria and executes query for Certificate Records
			 * @param  {string} exchangeRecordId internalid of an individual Exchange Record
			 * @return {array}        List of unmapped/unformatted Certificate Records
			 */
			function getCertificateRecords(exchangeRecordId) {

				// STEP 3.) Create search filters/columns for Certificate Records
				var lotCertificateSearchFilters = createCertRecSearchFilters(exchangeRecordId);
				var lotCertificateSearchColumns = createCertRecSearchCols(exchangeRecordId);

				// STEP 4.) Execute Certificate Record search
				var lotCertificates = nlapiSearchRecord(CERT_REC_NETSUITE_ID, null, lotCertificateSearchFilters, lotCertificateSearchColumns);

				return lotCertificates;
			}

			/**
			 * Formats Certificate Records and assigns them to
			 * their associated Letter Of Transmittal
			 * @param  {object} letterOfTransmittal Individual LOT instance to be mapped to
			 * @param  {array} lotCertificates     List of Certificate Record results
			 * @return {object}                     Individual LOT with associated Certificate Records
			 */
			function mapCertsToLOT(letterOfTransmittal, lotCertificates) {

				var lotCertRecord = null;
				var certRecordInstance = null;

				letterOfTransmittal.letter_of_transmittal_certificates = [];

				for (var i = 0; i < lotCertificates.length; i++) {
					lotCertRecord = lotCertificates[i];

					certRecordInstance = new CertificateRecord(lotCertRecord);
					if (certRecordInstance) {
						certRecordInstance.letter_of_transmittal_certificates_uuid = lotCertRecord.getId();
						letterOfTransmittal.letter_of_transmittal_certificates.push(certRecordInstance);

						// Move Document Prefill Record from Cert Record Level into LOT Level
						for (var j = 0; j < certRecordInstance.customrecord_ch_doc_prefill.length; j++) {
							letterOfTransmittal.customrecord_ch_doc_prefill.push(certRecordInstance.customrecord_ch_doc_prefill[j]);
						}
						delete certRecordInstance.customrecord_ch_doc_prefill;
					}
				}

				return letterOfTransmittal;
			}

			/* ------------- RECORD COLUMNS ------------- */

			/**
			 * Retrieves the list of Certificate Record search columns
			 * @return {array} Search columns for Certificate Record searches
			 */
			function _getLotCertificatePaymentColumns() {
				return [
					/*
					 * Payment Method DE1
					 */
					'custrecord_acq_loth_4_de1_lotpaymethod',

					/*
					 * ACH Payment Method DE1
					 */
					'custrecord_acq_loth_5a_de1_nameonbnkacct',
					'custrecord_acq_loth_5a_de1_bankacctnum',
					'custrecord_acq_loth_5a_de1_abaswiftnum', // ABA Routing Number
					'custrecord_acq_loth_5a_de1_bankname',
					'custrecord_acq_loth_5a_de1_bankaccttype',
					'custrecord_acq_loth_5a_de1_bankaddr',
					'custrecord_acq_loth_5a_de1_bankcity',
					'custrecord_acq_loth_5a_de1_bankstate',
					'custrecord_acq_loth_5a_de1_bankzip',
					'custrecord_acq_loth_5a_de1_bankcontact',
					'custrecord_acq_loth_5a_de1_bankphone',

					/*
					 * Wire Payment Method DE1
					 */
					'custrecord_exrec_shrhldr_settle_curr',
					'custrecord_acq_loth_5b_de1_nameonbnkacct',
					'custrecord_acq_loth_5b_de1_bankacctnum',
					'custrecord_acq_loth_5b_de1_abaswiftnum', // ABA / Swift Number
					//					'custrecord_acq_loth_5b_de1_wireverify',
					'custrecord_acq_loth_5b_de1_sortcode',
					'custrecord_acq_loth_5b_de1_bankname',
					'custrecord_acq_loth_5b_de1_bankaddr',
					'custrecord_acq_loth_5b_de1_bankcity',
					'custrecord_acq_loth_5b_de1_bankstate',
					'custrecord_acq_loth_5b_de1_bankcountry',
					'custrecord_acq_loth_5b_de1_bankzip',
					'custrecord_acq_loth_5b_de1_bankcontact',
					'custrecord_acq_loth_5b_de1_bankphone',
					'custrecord_acq_loth_5b_de1_frthrcrdtacct', // For further credit account number
					'custrecord_acq_loth_5b_de1_frthrcrdtname', // For further credit account name
					'custrecord_acq_loth_5b_de1_addlinstrct',
					'custrecord_exrec_type_of_residency',

					/*
					 * Check Payment Method DE1
					 */
					'custrecord_acq_loth_5c_de1_checkspayto',
					'custrecord_acq_loth_5c_de1_checksmailto',
					'custrecord_acq_loth_5c_de1_checksaddr1',
					'custrecord_acq_loth_5c_de1_checksaddr2',
					'custrecord_acq_loth_5c_de1_checkscity',
					'custrecord_acq_loth_5c_de1_checksstate',
					'custrecord_acq_loth_5c_de1_checkszip',
					'custrecord_acq_loth_5c_de1_checkscountry'
				];
			}


			function _getLotCertificateGetColumns() {
				return [
					'custrecord_acq_lotce_zzz_zzz_rowhash',
					'custrecord_acq_lotce_zzz_zzz_lotcestatus',
					'custrecord_acq_lotce_3_src_certnumber',
					'custrecord_acq_lotce_3_src_certdesc',
					'custrecord_acq_lotce_3_src_numbershares',
					'custrecord_acq_lotce_3_src_certtype',
					'custrecord_acq_lotce_3_de1_certnumber',
					'custrecord_acq_lotce_3_de1_certdesc',
					'custrecord_acq_lotce_3_de1_numbershares',
					'custrecord_acq_lotce_3_de1_lostcert',
					'custrecord_acq_lotce_3_de1_certtype',
					'custrecord_hide_in_ch',
					'custrecord_acq_lotce_zzz_zzz_acqdate',
					'custrecord_acq_lotce_zzz_zzz_costbasis',
					'custrecord_acq_lotce_zzz_zzz_currencytyp',
					'isinactive'
				];
			}


			return module;
		} // CERTIFICATE RECORD HELPER MODULE


		/* ******************************************************************
		******************** DOCUMENT RECORD HELPERS ************************
		****************************************************************** */

		/**
		 * Document Record Module contains logic for queryinng and building a Document Record
		 * @param {object} DocumentPrefillRecordHelper raw Doc Document Prefill Record Helper
		 * @return {object}        publicly available Document Record methods
		 */
		function DocumentRecordHelper(DocumentPrefillRecordHelper) {

			// Publicly available methods
			var module = {
				/**
				 * Retrieve Document Records and attaches them to the LOT
				 * @param  {object} lot Letter Of Transmittal to associate Document Records
				 * @param  {object} exchangeRecord Raw Exchange Record search result
				 * @return {object}     Letter Of Transmittal with assigned Document Records
				 */
				getLOTWithDocumentRecords: function getLOTWithDocumentRecords(lot, exchangeRecord) {
					var lotDocuments = getDocumentRecords(exchangeRecord.getId()) || null;
					// STEP 7.) Construct formatted Document Records
					lotDocuments = buildDocumentRecords(lotDocuments);
					// STEP 8.) Map Document Records To LOT
					lot = mapDocumentRecsToLOT(lot, lotDocuments);

					return lot;
				}
			}; // Module

			/* ------------- PRIVATE METHODS ------------- */

			/**
			 * Document Record Class
			 * @param {object} lotDoc raw NetSuite Document Record
			 */
			function DocumentRecord(lotDoc) {
				if (lotDoc) {

					this.isinactive = lotDoc.getValue('isinactive');
					this.internalid = lotDoc.id;
					// Name field
					this.altname = lotDoc.getValue('altname');
					// Document Signed Status
					this.custrecord_doc_signed_status = lotDoc.getValue('custrecord_doc_signed_status');
					// Esign URL
					this.custrecord_doc_esign_link = lotDoc.getValue('custrecord_doc_esign_link');
					// Google Drive URL
					this.custrecord_doc_backup_link = lotDoc.getValue('custrecord_doc_backup_link');
					// Document Signed Date/Time
					this.custrecord_doc_signed_datetime = lotDoc.getValue('custrecord_doc_signed_datetime');
					// Document Type
					this.custrecord_doc_type = lotDoc.getValue('custrecord_doc_type');
					// Document Agreement ID
					this.custrecord_doc_agreement_id = lotDoc.getValue('custrecord_doc_agreement_id');
					// Esign Widget ID
					this.custrecord_doc_esign_widget_id = lotDoc.getValue('custrecord_doc_esign_widget_id');
					// Document Order number
					this.custrecord_document_order = lotDoc.getValue('custrecord_document_order');
					// Shareholder Required Action
					this.custrecord_doc_sh_req_action = {
						value: lotDoc.getText('custrecord_doc_sh_req_action'),
						id: lotDoc.getValue('custrecord_doc_sh_req_action')
					};
					// Document Prefill Fields
					this.customrecord_ch_doc_prefill = DocumentPrefillRecordHelper.buildDocPrefillRecord('custrecord_cdp_document', this.internalid);
				}
			}

			/**
			 * Generates the Document Record Search Filters to load the records
			 * @param  {string} exchangeRecordId internalid of an individual Exchange Record
			 * @return {array}        Document Record Search Filters
			 */
			function createDocRecSearchFilters(exchangeRecordId) {
				var lotDocumentSearchFilters = [
					new nlobjSearchFilter('isinactive', null, 'is', 'F'),
					new nlobjSearchFilter('custrecord_acq_lot_exrec', null, 'is', exchangeRecordId),
					new nlobjSearchFilter('custrecord_doc_created_by_script', null, 'isnotempty'),
					new nlobjSearchFilter('custrecord_doc_esign_widget_id', null, 'isnotempty')
				];

				return lotDocumentSearchFilters;
			}

			/**
			 * Generates the Document Record Search Columns to load the records
			 * @return {array}               Document Record Search Columns
			 */
			function createDocRecSearchCols() {

				var searchColumns = documentRecordSearchColumns();
				var documentSearchColumns = [];

				for (var i = 0; i < searchColumns.length; i++) {
					documentSearchColumns.push(new nlobjSearchColumn(searchColumns[i]));
				}

				return documentSearchColumns;
			}

			/**
			 * Builds search criteria and executes query for Document Records
			 * @param  {string} exchangeRecordId internalid of an individual Exchange Record
			 * @return {array}        List of unmapped/unformatted Document Records
			 */
			function getDocumentRecords(exchangeRecordId) {
				var lotDocumentSearchFilters = createDocRecSearchFilters(exchangeRecordId);
				var lotDocumentSearchColumns = createDocRecSearchCols(exchangeRecordId);
				var lotDocuments = nlapiSearchRecord(DOC_REC_NETSUITE_ID, null, lotDocumentSearchFilters, lotDocumentSearchColumns);

				return lotDocuments;
			}

			/**
			 * Builds instances of the Document Record for each result in query response
			 * @param  {array} lotDocuments List of Document Record results to be formatted
			 * @return {array}        List of formatted Document Records
			 */
			function buildDocumentRecords(lotDocuments) {
				var formattedLOTDocs = [];
				if (lotDocuments != null && lotDocuments.length > 0) {
					for (var i = 0; i < lotDocuments.length; i++) {
						formattedLOTDocs[i] = new DocumentRecord(lotDocuments[i]);
					}
				} else {
					formattedLOTDocs = [];
				}

				return formattedLOTDocs;
			}

			/**
			 * Generates the list of Document Record Search Columns
			 * @return {array} NS Search Columns for Document Record
			 */
			function documentRecordSearchColumns() {
				return [
					'isinactive',
					'altname',
					'custrecord_doc_signed_status',
					'custrecord_doc_esign_link',
					'custrecord_doc_backup_link',
					'custrecord_doc_signed_datetime',
					'custrecord_doc_type',
					'custrecord_doc_agreement_id',
					'custrecord_doc_esign_widget_id',
					'custrecord_doc_sh_req_action',
					'custrecord_document_order'
				];
			}

			/**
			 * Formats Document Records and assigns them to
			 * their associated Letter Of Transmittal
			 * @param  {object} letterOfTransmittal Individual LOT instance to be mapped to
			 * @param  {array} lotDocuments     List of Document Record results
			 * @return {object}                     Individual LOT with associated Document Records
			 */
			function mapDocumentRecsToLOT(letterOfTransmittal, lotDocuments) {

				//Moving the customrecord_ch_doc_prefill to the LOT level
				for (var lotCount = 0; lotCount < lotDocuments.length; lotCount++) {

					var prefillLength = lotDocuments[lotCount].customrecord_ch_doc_prefill.length;
					for (var prefillCount = 0; prefillCount < prefillLength; prefillCount++) {
						letterOfTransmittal.customrecord_ch_doc_prefill.push(lotDocuments[lotCount].customrecord_ch_doc_prefill[prefillCount]);
					}

					delete lotDocuments[lotCount].customrecord_ch_doc_prefill;
				}

				letterOfTransmittal.documents = lotDocuments;

				return letterOfTransmittal;
			}

			return module;
		} // DOCUMENT RECORD HELPER MODULE


		/* ******************************************************************
		**************** DOCUMENT PREFILL RECORD HELPERS ********************
		****************************************************************** */

        /**
         * Document Prefill Record Module contains logic for queryinng and building a Document Record
         * @return {object}        publicly available Document Record methods
         */
		function DocumentPrefillRecordHelper() {

			// Publicly available methods
			var module = {
				buildDocPrefillRecord: buildDocPrefillRecord,
				mapPrefillRecordsToLOT: mapPrefillRecordsToLOT
			}; // Module


			/* ------------- PRIVATE METHODS ------------- */

            /**
             * Document Prefill Record Class
             * @param {object} docPrefillRecord raw NetSuite Document Prefill Record
             */
			function DocumentPrefillRecord(docPrefillRecord) {
				if (docPrefillRecord) {
					//Document Prefill Record ID
					this.internalid = docPrefillRecord.getId();
					// The description of the data point to be presented in AdobeSign as a tooltip
					this.custrecord_cdp_label = docPrefillRecord.getValue('custrecord_cdp_label');
					// The field name AdobeSign would know to populate the data
					this.custrecord_cdp_key = docPrefillRecord.getValue('custrecord_cdp_key');
					// The data point to be populated
					this.custrecord_cdp_value = docPrefillRecord.getValue('custrecord_cdp_value');

					// Update Field if the Prefill Record is associated with an Exchange Record
					this.custrecord_cdp_exrec = docPrefillRecord.getValue('custrecord_cdp_exrec') || '';

					// Update Field if the Prefill Record is associated with a Certificate Record
					this.custrecord_cdp_cert = docPrefillRecord.getValue('custrecord_cdp_cert') || '';

				}
			}

            /**
             * Generates the Document Prefill Record Search Filters to load the records
             * @param  {string} parentRecField Field Id of requesting parent record
             * @param  {string} parentRecId internalid of requesting parent record
             * @return {array}        Document Prefill Record Search Filters
             */
			function createDocPrefillRecSearchFilters(parentRecField, parentRecId) {
				var docPrefillRecSearchFilters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')];

				if (parentRecField && parentRecId) {
					docPrefillRecSearchFilters.push(new nlobjSearchFilter(parentRecField, null, 'is', parentRecId));
				}

				return docPrefillRecSearchFilters;
			}

            /**
             * Generates the Document Prefill Record Search Columns to load the records
             * @param  {string} parentRecField Field Id of requesting parent record
             * @return {array}               Document Prefill Record Search Columns
             */
			function createDocPrefillRecSearchCols(parentRecField) {
				var docPrefillRecSearchCols = [
					new nlobjSearchColumn('isinactive'),
					new nlobjSearchColumn('custrecord_cdp_document'),
					new nlobjSearchColumn('custrecord_cdp_label'),
					new nlobjSearchColumn('custrecord_cdp_value'),
					new nlobjSearchColumn('custrecord_cdp_key')
				];

				if (parentRecField) {
					docPrefillRecSearchCols.push(new nlobjSearchColumn(parentRecField));
				}

				return docPrefillRecSearchCols;
			}

            /**
             * Builds search criteria and executes query for Document Prefill Records
             * @param  {string} parentRecField Field Id of requesting parent record
             * @param  {string} parentRecId internalid of requesting parent record
             * @return {array}        List of Document Prefill Records
             */
			function getDocumentPrefillRecords(parentRecField, parentRecId) {
				var docPrefillRecSearchColumns = createDocPrefillRecSearchCols(parentRecField);
				var docPrefillRecSearchFilters = createDocPrefillRecSearchFilters(parentRecField, parentRecId);

				var docPrefillRecords = nlapiSearchRecord(DOC_PREFILL_REC_NETSUITE_ID, null, docPrefillRecSearchFilters, docPrefillRecSearchColumns);

				return docPrefillRecords;
			}

            /**
             * Builds instances of the Document Prefill Record for each result in query response
             * @param  {string} parentRecField Field Id of requesting parent record
             * @param  {string} parentRecId internalid of requesting parent record
             * @return {array}        List of formatted Document Records
             */
			function buildDocPrefillRecord(parentRecField, parentRecId) {
				var formattedDocPrefillRecords = [];
				if (parentRecId && parentRecId !== null) {
					var docPrefillRecs = getDocumentPrefillRecords(parentRecField, parentRecId);

					if (docPrefillRecs && docPrefillRecs !== null) {
						for (var i = 0; i < docPrefillRecs.length; i++) {
							formattedDocPrefillRecords.push(new DocumentPrefillRecord(docPrefillRecs[i]));
						}
					}
				}

				return formattedDocPrefillRecords;
			}

            /**
			 * Formats Clearinghouse Prefill Records and assigns them to
			 * their associated Letter Of Transmittal
			 * @param  {object} letterOfTransmittal Individual LOT instance to be mapped to
			 * @param  {object} prefillRecords     Formatted Clearinghouse Prefill Records
			 * @return {object}                     Individual LOT with associated Clearinghouse Configuration Records
			 */
			function mapPrefillRecordsToLOT(letterOfTransmittal, prefillRecords) {
				letterOfTransmittal.customrecord_ch_doc_prefill = prefillRecords;

				return letterOfTransmittal;
			}

			return module;
		} // DOCUMENT PREFILL RECORD HELPER MODULE


		/* ******************************************************************
		*********** CLEARINGHOUSE CONFIGURATION RECORD HELPERS **************
		****************************************************************** */

		/**
		 * Clearinghouse Configuration Record Module contains logic for querying and building a Clearinghouse Configuration Record
		 * @return {object}        publicly available Clearinghouse Configuration Record methods
		 */
		function ClearinghouseConfigRecordHelper() {
			// Publicly available methods
			var module = {
				/**
				 * Retrieve Clearinghouse Configuration Records and attaches them to the LOT
				 * @param  {object} lot Letter Of Transmittal to associate Clearinghouse Configuration Records
				 * @param  {object} exchangeRecord Raw Exchange Record search result
				 * @param  {string} chConfigRecID internalid of an individual Exchange Record's Clearinghouse Configuration Record
				 * @return {object}     Letter Of Transmittal with assigned Clearinghouse Configuration Records
				 */
				getLOTWithCHConfigRecords: function getLOTWithCHConfigRecords(lot, exchangeRecord, chConfigRecID) {

					var chConfigRec = getCHConfigRec(chConfigRecID) || null;
					// STEP 10.) Construct formatted Clearinghouse Configuration Records
					chConfigRec = new CHConfigurationRecord(chConfigRec);
					// STEP 11.) Map Clearinghouse Configuration Records To LOT
					lot = mapCHConfigRecsToLOT(lot, chConfigRec);

					return lot;
				}

			}; // Module

			/* ------------- PRIVATE METHODS ------------- */

			/**
			 * Clearinghouse Configureation Record Class
			 * @param {object} rawCHConfigDoc Unformatted Clearinghouse Configureation Record
			 * @return {object}                     Individual formatted Clearinghouse Configuration Record
			 */
			function CHConfigurationRecord(rawCHConfigDoc) {
				if (rawCHConfigDoc) {

					this.custrecord_chsc_verify_holdings = rawCHConfigDoc.getFieldValue('custrecord_chsc_verify_holdings');
					this.custrecord_chsc_contact_info = rawCHConfigDoc.getFieldValue('custrecord_chsc_contact_info');
					this.custrecord_chsc_documents = rawCHConfigDoc.getFieldValue('custrecord_chsc_documents');
					this.custrecord_chsc_tax_info = rawCHConfigDoc.getFieldValue('custrecord_chsc_tax_info');
					this.custrecord_chsc_payment_instr = rawCHConfigDoc.getFieldValue('custrecord_chsc_payment_instr');
					this.custrecord_chsc_sign_submit = rawCHConfigDoc.getFieldValue('custrecord_chsc_sign_submit');
				}
			}

			/**
			 * Builds search criteria and executes query for Clearinghouse Configuration Records
			 * @param  {string} chConfigRecID internalid of an individual Exchange Record's Clearinghouse Configuration Record
			 * @return {array}        List of unmapped/unformatted Clearinghouse Configuration Records
			 */
			function getCHConfigRec(chConfigRecID) {
				var chConfigRec = null;
				if (chConfigRecID) {
					chConfigRec = nlapiLoadRecord(CH_CONFIG_REC_NETSUITE_ID, chConfigRecID);
				}

				return chConfigRec;
			}

			/**
			 * Formats Clearinghouse Configuration Records and assigns them to
			 * their associated Letter Of Transmittal
			 * @param  {object} letterOfTransmittal Individual LOT instance to be mapped to
			 * @param  {object} chConfigRec     Formatted Clearinghouse Configuration Record
			 * @return {object}                     Individual LOT with associated Clearinghouse Configuration Records
			 */
			function mapCHConfigRecsToLOT(letterOfTransmittal, chConfigRec) {
				letterOfTransmittal.presentation = chConfigRec;

				return letterOfTransmittal;
			}

			return module;
		} // CLEARINGHOUSE CONFIGURATION RECORD HELPER MODULE


		/* ------------------------ OTHER HELPERS ------------------------ */

		/**
		 * Record Helper Module contains generic logic for NetSuite Records
		 * @return {object}        publicly available NetSuite Record methods
		 */
		function RecordHelper() {

			// Publicly available methods
			var module = {

				/**
				 * Writes error log message
				 * and sends an error code to requestor
				 * @param  {object} e Caught exception
				 * @return {null}   void
				 */
				handleError: function (e) {
					var msg = '';

					if (e instanceof nlobjError) {

						msg = e.getCode() + '\n' + e.getDetails();
						nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n' + e.getDetails());

					} else {

						for (var prop in e) {
							msg += "Property: " + prop + ", Value: [" + e[prop] + "] -- ";
						}
						nlapiLogExecution('DEBUG', 'unexpected error', e);
					}

					public.setStatus('ERROR');
					public.addMessage(1999, "System Error: " + msg);
				},

				getRecordValue: function (record, recordColumnName) {

					var columnValue = '';
					var columnValueText = false;

					nsColumnName = recordColumnName.replace('DEX', 'de1');
					columnValue = record.getValue(nsColumnName);

					if (columnValue == null || columnValue == '') {

						nsColumnName = nsColumnName.replace('de1', 'src');
						columnValue = record.getValue(nsColumnName);
					}

					columnValueText = record.getText(nsColumnName) || false;

					//return (columnValueText) ? columnValueText : columnValue;
					if (columnValueText) {
						return {
							"value": columnValueText,
							"id": columnValue
						};
					} else {
						return columnValue;
					}
				},

				getDealInfo: function (dealId) {

					var _dealLegal = [];
					var columns = [], filters = [];
					var searchObject, searchResultSet, searchResults;
					var hasLegalText = false, hasLegalDocs = false;

					var deal = {
						insert_before_lot: false,
						insert_after_lot: false,
						legal_text: false,
						custentity_acq_deal_zzz_zzz_legal_text: '',
						currency: 'USD',
					};

					if (!dealId || dealId == ' ') {
						return null;
					}

					if (typeof _dealLegal[dealId] != 'undefined') {
						deal.custentity_acq_deal_zzz_zzz_legal_text = _dealLegal[dealId].custentity_acq_deal_zzz_zzz_legal_text;
						deal.insert_before_lot = _dealLegal[dealId].insert_before_lot;
						deal.insert_after_lot = _dealLegal[dealId].insert_after_lot;
						deal.legal_text = _dealLegal[dealId].legal_text;

						return deal;
					} else {
						/*
						 *  Setup object
						 */
						_dealLegal[dealId] = deal;
					}

					// additional field search
					columns.push(new nlobjSearchColumn('custrecord_doc_type'));
					columns.push(new nlobjSearchColumn('custrecord_linked_file'));

					filters.push(new nlobjSearchFilter('custrecord_escrow_customer', null, 'is', dealId));
					filters.push(new nlobjSearchFilter('custrecord_dm_status', null, 'anyof', 5));
					filters.push(new nlobjSearchFilter('custrecord_doc_type', null, 'anyof', [38, 39, 41]));
					searchObject = nlapiCreateSearch(DOC_REC_NETSUITE_ID, filters, columns);
					searchResultSet = searchObject.runSearch();
					searchResults = searchResultSet.getResults(0, 100);

					if (searchResults && searchResults.length > 0) {
						for (var i in searchResults) {
							var doc_type = searchResults[i].getText('custrecord_doc_type') || 'None';
							doc_type = doc_type.toLowerCase().replace(/ /g, '_');

							_dealLegal[dealId][doc_type] = searchResults[i].getValue('custrecord_linked_file') || false;
							deal[doc_type] = _dealLegal[dealId][doc_type];
						}
					} else {
						_dealLegal[dealId].insert_before_lot = false;
						_dealLegal[dealId].insert_after_lot = false;
						_dealLegal[dealId].legal_text = false;
						deal.insert_before_lot = _dealLegal[dealId].insert_before_lot;
						deal.insert_after_lot = _dealLegal[dealId].insert_after_lot;
						deal.legal_text = _dealLegal[dealId].legal_text;
					}

					// get deal Records and merge with deal object
					var dealRecord = getDealRecord(dealId);
					for (var recordField in dealRecord) {
						deal[recordField] = dealRecord[recordField];
					}

					return deal;
				}

			}; // Module

			/* ------------- PRIVATE METHODS ------------- */

			/**
			 * Resolves a Netsuite bug with sublists of a multiselect field
			 * Responsible for utilizing the search column names to retrieve
			 * the correct IDS from the original multiselect record
			 * @param  {object} 		   searchResults
			 * @param  {nlobjSearchColumn} nameColumn
			 * @param  {nlobjSearchColumn} internalidColumn
			 * @return {object}
			 */
            function getRecordIdsForMultiSelects(searchResults, nameColumn, internalidColumn) {
                var multiSelectObject = [];
                var object = {};

                if(!(nameColumn instanceof nlobjSearchColumn) ||
                    !(internalidColumn instanceof nlobjSearchColumn)
                ) {
                    return false;
                }

                for (var i in searchResults) {
                    object = {
                        "value": searchResults[i].getValue(nameColumn),
                        "id": searchResults[i].getValue(internalidColumn)
                    }

                    multiSelectObject[i] = object;
                }

                return multiSelectObject;
            }

            /**
             * Loops a result column to convert multiselect return from a string
             * to an associated object with value and id keys
             * @param  {object} searchResults
             * @param  {string} columnName    Field name for column
             * @return {object}
             */
			function getMultiSelectObjects(searchResults, columnName) {
				var multiSelectObject = [];
				var object = {};
				var multiSelectValues = searchResults.getValue(columnName).split(',');
				var multiSelectTexts = searchResults.getText(columnName).split(',');

				for (var i in multiSelectValues) {
					object = {
						"value": multiSelectTexts[i],
						"id": multiSelectValues[i]
					}

					multiSelectObject[i] = object;
				}

				return multiSelectObject;
			}

			/**
			 * Get data on the deal record
			 * @param  dealId
			 * @return {object}
			 */
			function getDealRecord(dealId) {

				if (!dealId || dealId == '') {
					return null;
				}

				var _deal = {};
				var columns = [],
					filters = [];
				var searchObject, searchResultSet, searchResults;

				/* ---- BUILD THE SEARCH COLUMN ---- */
				var searchColumnFields = [
					'custentity_acq_deal_zzz_zzz_legal_text',
					// Payment fee columns
					'custentity_acq_deal_lotach',
					'custentity_qx_acq_deal_domesticwire',
					'custentity_qx_acq_deal_internationalwire',
					'custentity_qx_acq_deal_domesticcheck',
					'custentity_qx_acq_deal_internationalchec',
					'custentity_acq_deal_lot_send_lots',
					'custentity_acq_deal_fx_level', /* TEMP reactivating due to business decision */
                    'custentity_acq_deal_fx_curr_cbox',
                    'custentity_acq_deal_financial_bank_compa',
                    'custentity_acq_deal_funded_currency'
                ];

                for (var i = 0; i < searchColumnFields.length; i++) {
                    columns.push(new nlobjSearchColumn(searchColumnFields[i]));
                }

                var nameColumn = new nlobjSearchColumn('name' ,"custentity_acq_deal_fx_settle_currencies");
                var internalidColumn = new nlobjSearchColumn('internalid' ,"custentity_acq_deal_fx_settle_currencies");
                columns.push(nameColumn);
                columns.push(internalidColumn);

				/* ---- BUILD THE SEARCH FILTERS ---- */

				filters.push(new nlobjSearchFilter('internalid', null, 'is', dealId));

				try {
					searchObject = nlapiCreateSearch('customer', filters, columns);

					/* ---- RUN THE SEARCH ---- */

					searchResultSet = searchObject.runSearch();
					searchResults = searchResultSet.getResults(0,1000);

					/* ---- BUILD SEARCH RESULT SET ---- */

					if (searchResults && searchResults.length > 0) {
						for (var j = 0; j < searchColumnFields.length; j++) {
							_deal[searchColumnFields[j]] = searchResults[0].getValue(searchColumnFields[j]) || '';

							//Deal FX level [Shareholder | Deal] -- TEMP reactivating due to business decision
							if (searchColumnFields[j] == 'custentity_acq_deal_fx_level') {
								_deal[searchColumnFields[j]] = searchResults[0].getValue(searchColumnFields[j]) || 0;
							}
							//Get the Paying Bank name/title[value] and it's corresponding id
							if (searchColumnFields[j] == 'custentity_acq_deal_financial_bank_compa'){
								var _payingBank = {'value': searchResults[0].getText(searchColumnFields[j]) || '',
										'id': searchResults[0].getValue(searchColumnFields[j]) || 0
								};
								_deal[searchColumnFields[j]] = _payingBank;
							}
							//Get the Deal Funded Currency name/title[value] and it's corresponding id
							if (searchColumnFields[j] == 'custentity_acq_deal_funded_currency'){
								var _dealFundedCurrency = {'value': searchResults[0].getText(searchColumnFields[j]) || '',
										'id': searchResults[0].getValue(searchColumnFields[j]) || 0
								};
								_deal[searchColumnFields[j]] = _dealFundedCurrency;
							}
						}

	                    //Loop through named column and value column of rows to extract the global currencies IDs
                        _deal["custentity_acq_deal_fx_settle_currencies"] = getRecordIdsForMultiSelects(searchResults, nameColumn, internalidColumn);
					}

				} catch (e) {
					module.handleError(e);
				}

				return _deal;
			}
			return module;
		} // RECORD HELPER MODULE



		// Overwrite global public object methods with this module's methods
		public.createCall = module.createCall;
		public.readCall = module.readCall;
		public.updateCall = module.updateCall;
		public.deleteCall = module.deleteCall;


		return public;

	} // IIFE


/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       20 Oct 2014     TJTyrrell
 *
 */

function generic_crud() {

	var private = {};

	//public.libraries.global = {{library:global}};

	handleError = function (e) {
		var msg = '';

		if (e instanceof nlobjError) {

			msg = e.getCode() + '\n' + e.getDetails();
			nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n' + e.getDetails());

		} else {

			for (var prop in e) {
				msg += "Property: " + prop + ", Value: [" + e[prop] + "] -- ";
			}
			nlapiLogExecution('DEBUG', 'unexpected error', e);
		}

		public.setStatus('ERROR');
		public.addMessage(1999, "System Error: " + msg);
	}


	public.createCall = function( dataIn ) {

		var returnPayload,
			record, // nlapiCreateRecord object
			value, // Values of dataIn fields
			sublistCount = 1,
			recordId, // nlapiSubmitRecord id
			recordIds = [],
			nlobj,
			contactFilters, contactColumns, contactSearchObject,
			contacts = [],
			companies = {}; // nlapiLoadRecord object

		public.addExecutionTime( 'startCreateRecord' );
		nlapiLogExecution('DEBUG','createRecord','createRecord');

		if (!dataIn.recordtype) {

			public.setStatus( 'ERROR' );
			public.addMessage( 1999, 'System Error: Missing RecordType' );

			return false;

		}

		if (!dataIn.records) {

			public.setStatus( 'ERROR' );
			public.addMessage( 1998, 'System Error: No Records to create' );

			return false;

		}

		switch( dataIn.recordtype ){
			case "supportcase":
				/*
				 *  Since we don't know what the "customer" field is from Portal/Clearinghouse, we need to look it up
				 */
				for( var cases in dataIn.records ) {
					if( dataIn.records[cases].company == false ) {
						contacts.push( dataIn.records[cases].contact );
					}
				}

				contactFilters = [
						new nlobjSearchFilter( 'internalid', null, 'anyof', contacts )
					];
				contactColumns = [
						new nlobjSearchColumn( 'company' )
					];
				contactSearchObject = nlapiSearchRecord('contact', null, contactFilters, contactColumns );
				if( contactSearchObject != null ) {
					for( var contact in contactSearchObject ) {
						companies[ contactSearchObject[contact].getId() ] = contactSearchObject[contact].getValue('company');
					}
				}
				break;
		}

		for( var recordItem in dataIn.records ) {

			record = nlapiCreateRecord(dataIn.recordtype);

			public.addExecutionTime( 'finishCreateRecord' );

			if( dataIn.recordtype == 'supportcase' ) {
				dataIn.records[ recordItem ].company = companies[ dataIn.records[ recordItem ].contact ];
			}


			for( var fieldname in dataIn.records[recordItem] ) {

				if (dataIn.records[recordItem].hasOwnProperty(fieldname)) {
					if (fieldname != 'recordtype' && fieldname != 'id') {
						value = dataIn.records[recordItem][fieldname];
						if (value != null && typeof value != 'object') {

							nlapiLogExecution('DEBUG','createRecord',fieldname + ':' + value);
							record.setFieldValue(fieldname, value);

						} else {

							if(typeof value == 'object') {

								nlapiLogExecution('DEBUG','createRecord', fieldname);


								for(var listName in value) {

									var listvalue = value[listName];
									for(var lv in listvalue) {

										var listvalue2 = listvalue[lv];
										nlapiLogExecution('DEBUG','createRecord:'+fieldname,lv + ':' + listvalue2);

										if(listvalue2 != null) {
											if(lv == 'selectedOptions') {

												var optionslist = '';
												for(var optionValues in listvalue2) {
													if(optionslist != '') {
														optionslist = optionslist + String.fromCharCode(4);
													}
													optionslist = optionslist +  listvalue2[optionValues].optionId+String.fromCharCode(3)+'F'+String.fromCharCode(3)+listvalue2[optionValues].optionText+String.fromCharCode(3)+listvalue2[optionValues].optionValue;
												}
												record.setLineItemValue(fieldname, 'options', sublistCount, optionslist);

											} else if(lv == 'addressbookaddress') {

												nlapiLogExecution('DEBUG','address loop START', null);
												for(var lv2prop in listvalue2) {
													var listvalue3 = listvalue2[lv2prop];
													nlapiLogExecution('DEBUG','address loop:'+lv,lv2prop + ':' + listvalue3);
													record.setLineItemValue(fieldname, lv2prop, sublistCount, listvalue3);
												}

											} else {
												record.setLineItemValue(fieldname, lv, sublistCount, listvalue2);
											}
										}
									}
									sublistCount++;
								}
							}
						}
					}
				}
			} // Record fields loop

			try {

				nlapiLogExecution('DEBUG','BEFORE SAVE','BEFORE SAVE');

				public.addExecutionTime( 'startSubmitRecord: ' + recordItem );
				recordId = nlapiSubmitRecord(record, false, true);
				recordIds.push( recordId );
				public.addExecutionTime( 'finishSubmitRecord: ' + recordItem );
				nlapiLogExecution('DEBUG','id='+recordId);

				// 2014-12-31 - Commented out because I am not sure why we need to waste time loading the record we just saved
//				public.addExecutionTime( 'startLoadRecord: ' + recordItem );
//				nlobj = nlapiLoadRecord(dataIn.recordtype,recordId);
//				public.addExecutionTime( 'finishLoadRecord: ' + recordItem );

//				public.setReturnPayload( nlobj );
//				public.setStatus( 'SUCCESS' );

			} catch(err) {
				var error = handleError(err);
				nlapiLogExecution('ERROR','createRecord',JSON.stringify(error));

				//var error = public.libraries.global.handleError( err, 'createError' );
				//nlapiLogExecution('ERROR','createRecord',err);
				public.setStatus( 'ERROR' );
				public.addMessage( 1999, JSON.stringify(error) );
				nlapiLogExecution('DEBUG', 'There was an error', JSON.stringify(err) );

			}

		} // Records loop

		if( public.getStatus != 'ERROR' ) {
			public.setStatus( 'SUCCESS' );
		}
		public.setReturnPayload( recordIds );
	};

	public.readCall = function( dataIn ) {

		var returnPayload;

		public.addExecutionTime( 'startReadRecord' );
		nlapiLogExecution('DEBUG','readRecord','readRecord');

		try {

			if(dataIn.hasOwnProperty( "customform" ) && dataIn.customform !=null && dataIn.customform !='') {
				returnPayload = nlapiLoadRecord( dataIn.recordtype, dataIn.id, {"customform":dataIn.customform} );
			} else {
				returnPayload = nlapiLoadRecord( dataIn.recordtype, dataIn.id );
			}

			public.addExecutionTime( 'finishReadRecord' );

			public.setStatus( 'SUCCESS' );

			nlapiLogExecution( 'DEBUG', 'readRecord', 'PARAMS: ' + dataIn.recordtype + '~' + dataIn.id );

			public.setReturnPayload( returnPayload );

		} catch(e) {

			var msg = '';

			if(e instanceof nlobjError ) {

				msg = e.getCode() + '\n' + e.getDetails();
				nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails());

			} else {

				msg = e;
				nlapiLogExecution('DEBUG', 'unexpected error', e);

			}

			public.setStatus( 'ERROR' );
			public.addMessage( 1999, "System Error: " + msg );

		}

	};

	public.updateCall = function( dataIn ) {

		var record, // nlapiLoadRecord object
			linesChanged = 0,
			sublistCount = 1,
			recordId,
			recordIds = [],
			nlobj,
			recordtype = false;

		nlapiLogExecution('DEBUG','updateRecord','updateRecord');

		if(!dataIn.recordtype) {

			/*public.setStatus( 'ERROR' );
			public.addMessage( 1999, "System Error: Update(Missing RecordType)" );
			return false;*/

		} else {
			recordtype = dataIn.recordtype;
		}

		if (!dataIn.records) {

			public.setStatus( 'ERROR' );
			public.addMessage( 1998, 'System Error: No Records to create' );

			return false;

		}

		for( var recordItem in dataIn.records ) {

			try {

				if(dataIn.recordtype == 'salesorder') {
					public.setReturnPayload( updateSalesorder( dataIn.records[recordItem]) );
				}

				if( !recordtype && !dataIn.records[recordItem].recordtype ) {
					public.setStatus( 'ERROR' );
					public.addMessage( 1999, "System Error: Update(Missing RecordType)" );
					return false;
				} else {
					recordtype = ( !dataIn.records[recordItem].recordtype ) ? recordtype : dataIn.records[recordItem].recordtype;
				}

				record = nlapiLoadRecord(recordtype,dataIn.records[recordItem].id);

			} catch(e) {

				public.setStatus( 'ERROR' );
				public.addMessage( 1009, e );

				return false;

			}

			if(record == null) {

				public.setStatus( 'ERROR' );
				public.addMessage( 1010, 'Unable to load record' );
				return false;

			}

			for (var fieldname in dataIn.records[recordItem] ) { /* root level properties */

				if (dataIn.records[recordItem].hasOwnProperty(fieldname)) {
					if (fieldname != 'recordtype' && fieldname != 'id') {
						var value = dataIn.records[recordItem][fieldname];

						if(value != null && record.getFieldValue(fieldname) != value) {
							record.setFieldValue(fieldname, value);
						}
					}
				}
			}

			try {

				nlapiLogExecution('DEBUG','BEFORE SAVE');
				recordId = nlapiSubmitRecord(record);
				recordIds.push( recordId );
				/* Commented out because I don't see why we need to waste time reloading record if we aren't even validating the data
				nlapiLogExecution('DEBUG','id='+recordId);
				nlobj = nlapiLoadRecord(dataIn.recordtype,recordId);

				public.setReturnPayload( nlobj );
				public.setStatus( 'SUCCESS' );*/

			} catch(err) {

				public.setStatus( 'ERROR' );
				public.addMessage( 1999, "System Error: " + err.code );
				public.addMessage( 1999, "System Error: " + err.message);
				public.addMessage( 1999, "System Error: " + err.description);

				nlapiLogExecution('ERROR','record update', err);

			}

		} // Loop through records to update

		if( public.getStatus != 'ERROR' ) {
			public.setStatus( 'SUCCESS' );
		}

		public.setReturnPayload( recordIds );

	}

	public.deleteCall = function( dataIn ) {

		return {};

	}

	return public;

}

	return public;

}());
