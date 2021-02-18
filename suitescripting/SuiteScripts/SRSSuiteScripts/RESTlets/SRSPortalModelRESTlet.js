/**
 * @author durbano
 */

var privateFunctions = [];
var PRIVATE_FUNCTIONS =
{
	 GET_USER_DATA: 			'getUserData'
	,GET_DENOMINATION_DATA: 	'getDenominationData'
	,GET_RELEASE_DATA: 			'getReleaseData'
	,GET_TX_DETAILS:			'getTransactionDetails'
	,GET_TX_SUMMARY:			'getTransactionSummary'
};

var DEPLOYMENT = {
	SANDBOX: {
		SEARCH_SUITLET_URL: '' //https://system.sandbox.netsuite.com/app/site/hosting/scriptlet.nl?script=175&deploy=1' 
	}
	,PRODUCTION: {
		SEARCH_SUITLET_URL: ''
	}
};

// RESTlet public methods
function get(detain)
{
	// setup deployment specific variables
	//detain.deployment = nlapiGetContext().getEnvironment() == 'PRODUCTION' ? DEPLOYMENT.PRODUCTION : DEPLOYMENT.SANDBOX;

	try
	{
		validateRequest(detain);		// will throw any error if found
		
		return detain;
		
		return privateFunctions[detain.method](detain);			// call the function
	}
	catch(error)
	{
		nlapiLogExecution("ERROR", "SRSPortalModelRESTlet.get", "ERROR: " + error);
		detain.ERROR = error;
		return detain;
	}
}

// private local methods
function translateCommonObjects(detain)
{
	if(detain.translated && detain.translated == true)	return detain;
	
	if(detain.deals) 			detain.deals 			= detain.deals.split(',');
	if(detain.shareholders) 	detain.shareholders 	= detain.shareholders.split(',');
	if(detain.denominations)	detain.denominations 	= detain.denominations.split(',');
	if(detain.accounts)			detain.accounts 		= detain.accounts.split(',');
	detain.translated = true;
	
	return detain;
}

function validateRequest(detain)
{
	// validate that the function to be called exists
	if(!privateFunctions.hasOwnProperty(detain.method))		throw 'Request denied: Method \'' + detain.method + '\' does not exist';

	// check to see if the properties 'deals' and 'shareholders' exist
	if(!detain.deals)		  								throw 'Request denied: Deals missing from request';
	if(!detain.shareholders && !detain.topLevelParent) 		throw 'Request denied: Shareholders and Top Level Parent missing from request';
	
	// @TODO With the following, need to figure out the role id of the web-services only user, and then validate WITH THAT ROLE
	if(detain.method == PRIVATE_FUNCTIONS.GET_RELEASE_DATA 	&& nlapiGetContext().getRole() != '1000')	return true;		// this is the only function accessible by non-customer center role
	if(nlapiGetContext().getRole() != '1000')				throw 'Request denied: Role not allowed for this method.';
	if(detain.method == PRIVATE_FUNCTIONS.GET_USER_DATA)	return true;
	if(!detain.sdaId)										throw 'Request denied: Access ID field is required';
	
	var userData = privateFunctions[PRIVATE_FUNCTIONS.GET_USER_DATA](detain);
	
	if(!userData.records || userData.records.length != 1)	throw 'Request denied: Invalid Access Record';
	
	// validate that the list of shareholders requested are in the access record
	var topLevelParent = userData.records[0].topLevelParent;
	if(detain.topLevelParent != topLevelParent)				throw 'Request denied: Top Level Parent Does Not Match Access Record';
	
	var msg = 'Request denied: Shareholders do not match access record';

	var shareholders = userData.records[0].shareholders;
	if(!arrayComparison(detain.shareholders,shareholders,msg))	throw msg;
	
	// validate that the list of deals requested are in the access record
	
	// @TODO Need a way to get the list of child funds if shareholders are requested, but 
	
	
}

function arrayComparison(testArray,safeArray,errorPrepend)
{
	if((testArray == null || testArray.length == 0 ) && (safeArray == null || safeArray.length == 0)) return true;
	if((testArray != null && testArray.length >  0 ) && (safeArray == null || safeArray.length == 0)) throw errorPrepend;
	
	// make sure every element in testArray is in safeArray
	var safeLookup = {};
	
	for(var i in safeArray)	safeLookup[safeArray[i]] = safeArray[i];
	
	for(var test in testArray)
		if(!safeLookup.hasOwnProperty(test))	throw errorPrepend + ' - Id ' + test + 'not included.';
	
	return true;
}

privateFunctions[PRIVATE_FUNCTIONS.GET_USER_DATA] = function (detain)
{
	detain = translateCommonObjects(detain);
	
	var ctxt 		= nlapiGetContext();
	detain.email 	= ctxt.getEmail();
	detain.firmId 	= ctxt.getUser();		// you'd think you would get the contact's id here, but that's not the case
	detain.firm 	= ctxt.getName();
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('email','custrecord_user','is',detain.email));
		filters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	if(detain.sdaId)
		filters.push(new nlobjSearchFilter('internalid',null,'is',detain.sdaId));

	var search = nlapiSearchRecord('customrecord_shareholder_data_access','customsearch_v3_restlet_user_access', filters, null);
	
	var data = {};
	if (search == null || search.length == 0)
	{
		data.error = 'No records found';
		return data;
	}
	data.email  = detain.email;
	data.firm = detain.firm;
	data.firmId = detain.firmId;
	
	var records = new Array();
	for (var i = 0; i < search.length; i++)
	{
		var result = search[i];
		
		if(!data.userId)	result.getValue('custrecord_user');
		if(!data.user)		result.getText('custrecord_user');
		
		var record = {};
			record.sdaId		  = result.getId();
			record.topLevelParent = result.getValue('custrecord_toplevelparent');
			record.topLevelParentName = result.getText('custrecord_toplevelparent');
			record.deals 		  = result.getValue('custrecord_escrow');
			record.shareholders   = result.getValue('custrecord_shareholder');
			
		records.push(record);
	}
	data.records = records;
	
	return data;
}

privateFunctions[PRIVATE_FUNCTIONS.GET_TX_SUMMARY] = function(detain)
{
	detain = translateCommonObjects(detain);
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord66'			,null,'anyOf'		,detain.deals));
		filters.push(new nlobjSearchFilter('custrecord_et_status'	,null,'anyof'		,[4]));	// only RELEASED transactions
	if(detain.asOfDate)																			filters.push(new nlobjSearchFilter('custrecord65'	,null,'onOrBefore',detain.asOfDate));
	if(detain.shareholders && detain.shareholders != null && detain.shareholders.length > 0)	filters.push(new nlobjSearchFilter('custrecord67'	,null,'anyOf',detain.shareholders));
	else																						filters.push(new nlobjSearchFilter('parent'			,'custrecord67','anyOf',[detain.topLevelParent]));
		
	var search = nlapiSearchRecord('customrecord18','customsearch_v3_restlet_tx_summary', filters, null);
	if (search == null || search.length == 0)	return new Array();
	
	// @TODO may need to add in a loop here that will get around the 1000 record problem. Perhaps just call itself at the end if 1000 records returned, but will need to make sure the search is sorted by internal id
	var data = new Array();
	var denominations = new Array();
	for (var i = 0; i < search.length; i++)
	{
		var result = search[i];
		var denominationTxt = result.getText('custrecord85', null, 'group');
		var denominationIdValue = result.getValue('custrecord85', null, 'group');
		
		var datum = {
			 deal:result.getValue('companyname','custrecord66','group')
			,dealId:result.getValue('internalid','custrecord66','group')
			,account:result.getText('custrecord_glaccount',null,'group')
			,accountId:result.getValue('custrecord_glaccount',null,'group')
			,shareholder:result.getValue('companyname','custrecord67','group')
			,shareholderId:result.getValue('internalid','custrecord67','group')
			,denomination:denominationTxt
			,denominationId:denominationIdValue
			,deposits_holdbacks:parseFloat(result.getValue('custrecord74',null,'sum'))
			,investment_earnings:parseFloat(result.getValue('custrecord76',null,'sum'))
			,claims_paid:parseFloat(result.getValue('custrecord77',null,'sum'))
			,expenses:parseFloat(result.getValue('custrecord78',null,'sum'))
			,disbursements:parseFloat(result.getValue('custrecord103',null,'sum'))
			,balance:parseFloat(result.getValue('custrecord70',null,'sum'))
			,usdBalance:'UNKNOWN'												// #### WE WANT TO ENFORCE the translation process below, or make sure this appears as an error to whomever calls this function
			,firstTxDate:result.getValue('custrecord65',null,'min')
			,lastTxDate:result.getValue('custrecord65',null,'max')
			,currencyQuoteDate:null
		};
		
		if(denominationTxt == 'USD')	datum.usdBalance = datum.balance;
		else							denominations.push(denominationIdValue);

		data.push(datum);
	}
	
	denominations = denominations.unique();
	if(denominations == null || denominations.length == 0)	return data;
	
	detain.denominations = denominations;
	detain.denomination_last_quote = 'TRUE';		// this will give me the last quote
	var denomData = privateFunctions[PRIVATE_FUNCTIONS.GET_DENOMINATION_DATA](detain)
		
	for(var i = 0; i < data.length; i++)
	{
		var datum = data[i];
		var denominationId = datum.denominationId;
		
		for(var j = 0; j < denomData.length; j++)
		{
			if(denominationId != denomData[j].denominationId)	continue;	// keep looking
			datum.usdBalance = Math.round(datum.balance * denomData[j].usdQuote * 100) / 100;
			datum.currencyQuoteDate = denomData[j].quoteDate;
			break;										// done
		}
	}
	
	return data;
}

privateFunctions[PRIVATE_FUNCTIONS.GET_TX_DETAILS] = function(detain)
{
	detain = translateCommonObjects(detain);

	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord66'			,null,'anyOf'		,detain.deals));
		filters.push(new nlobjSearchFilter('custrecord_et_status'	,null,'anyof'		,[4]));						// only RELEASED transactions
		filters.push(new nlobjSearchFilter('custrecord_glaccount'	,null,'anyOf'		,detain.accounts));
	if(detain.asOfDate)																			filters.push(new nlobjSearchFilter('custrecord65'	,null,'onOrBefore',detain.asOfDate));
	if(detain.shareholders && detain.shareholders != null && detain.shareholders.length > 0)	filters.push(new nlobjSearchFilter('custrecord67'	,null,'anyOf',detain.shareholders));
	else																						filters.push(new nlobjSearchFilter('parent'			,'custrecord67','anyOf',[detain.topLevelParent]));
		
	var search = nlapiSearchRecord('customrecord18','customsearch_v3_restlet_tx_details', filters, null);
	if (search == null || search.length == 0)	return new Array();
	
	
	// @TODO need to add in a loop here that will get around the 1000 record problem. Perhaps just call itself at the end if 1000 records returned, but will need to make sure the search is sorted by internal id
	var data = new Array();
	for (var i = 0; i < search.length; i++)
	{
		var result = search[i];
		var denominationTxt = result.getText('custrecord85', null, 'group');
		var denominationIdValue = result.getValue('custrecord85', null, 'group');
		var amountVal = parseFloat(result.getValue('custrecord70',null,'sum'));
		
		if(amountVal == 0.00) continue;		// skip zero dollar transactions
		
		var datum = {
			 date:result.getValue('custrecord65',null,'group')
			,deal:result.getText('custrecord66',null,'group')
			,dealId:result.getValue('custrecord66',null,'group')
			,account:result.getText('custrecord_glaccount',null,'group')
			,accountId:result.getValue('custrecord_glaccount',null,'group')
			,shareholder:result.getText('custrecord67',null,'group')
			,shareholderId:result.getValue('custrecord67',null,'group')
			,denomination:denominationTxt
			,denominationId:denominationIdValue
			,transactionType:result.getText('custrecord69',null,'group')
			,transactionTypeId:result.getValue('custrecord69',null,'group')
			,amount:amountVal
		};

		data.push(datum);
	}
	
	return data;
}

privateFunctions[PRIVATE_FUNCTIONS.GET_DENOMINATION_DATA] = function(detain)
{
	detain = translateCommonObjects(detain);
	
	if(!detain.denomination_last_quote)	detain.denomination_last_quote = 'FALSE';					// in case it is not passed in...
	detain.denomination_last_quote = (detain.denomination_last_quote == 'TRUE');
	
	// now get the denomination values for non USD denominated escrows, if any were found
	var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_ticker_currency',null,'anyOf',detain.denominations));
	var search = nlapiSearchRecord('customrecord_stock_tickers','customsearch_v3_restlet_denominations', filters, null);
	if(search == null || search.length == 0) return new Array();
	
	// get the denomination value/asOfDate data
	var data = new Array();
	var lastCurrencyId = -1;
	for(var i = 0; i < search.length; i++)			// Translate the amount into USD
	{
		var result = search[i];
		var currencyId = result.getValue('custrecord_ticker_currency',null,null);
		if(detain.denomination_last_quote === true && lastCurrencyId === currencyId)	continue;	// skip until you find a new currency
		lastCurrencyId = currencyId;
		var datum = {
			 stockTickerId:result.getId()
			,denomination:result.getText('custrecord_ticker_currency',null,null)
			,denominationId:currencyId
			,exchange:result.getText('custrecord_exchange_code',null,null)
			,exchangeId:result.getValue('custrecord_exchange_code',null,null)
			,quoteDate:result.getValue('custrecordquote_date',null,null)
			,usdQuote:result.getValue('custrecord_srs_usd_quote',null,null)
		};
		data.push(datum);
	}
	return data;
}

privateFunctions[PRIVATE_FUNCTIONS.GET_RELEASE_DATA] = function(detain)
{
	detain = translateCommonObjects(detain);
	
	var filters = new Array();
		filters.push(new nlobjSearchFilter('attendee',null,'anyOf',detain.deals));

	var search = nlapiSearchRecord('calendarevent','customsearch_v3_restlet_releases', filters, null);
	if(search == null || search.length == 0) return new Array();

	var data = new Array();
	for(var i = 0; i < search.length; i++)
	{
		var result = search[i];
		
		var datum = {
			 releaseId:result.getId()
			,status:result.getValue('status')
			,date:result.getValue('startdate')
			,accountId:result.getValue('custevent_gl_account')
			,percentage:result.getValue('custevent29')
		};
		data.push(datum);
	}

	return data;
}

// need to put the following into a common library
Array.prototype.unique =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
  };






