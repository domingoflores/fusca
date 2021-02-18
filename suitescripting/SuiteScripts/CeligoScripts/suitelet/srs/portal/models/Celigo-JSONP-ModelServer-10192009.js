/*
 * 2005-2008 Celigo, Inc. All Rights Reserved.
 * 
 * Version:    1.0.0
 * Type:       Suitelet
 *
 * Purpose: 
 *    <What the script does>
 *
 * Revisions:
 *    <Date in MM/DD/YYYY format> - Initial version
 *
 */

var SRS = {};
SRS.CustomerPortal = (function(){ //private members
    
	function JSONPDataServer(request){
    
        //instance vars
		var that = this;
		this.searchId = request.getParameter('custpage_search_id');
		this.data;
		this.escrowIds = [];
		
		this.getData = function(){
			if(that.data)
				return that.data;
			
			var filters = [];
			if(request.getParameter('custpage_search_type') === 'customrecord18')
				filters.push(that.getSecurityFilter(request.getParameter('custpage_shareholder_id')));
			if(request.getParameter('custpage_search_type') === 'customrecord12')
				filters.push(that.getSecurityFilter(null));
			if(request.getParameter('custpage_search_type') === 'customrecord28')
				filters.push(that.getEscrowNewsSecurityFilter(null));	
			if(request.getParameter('custpage_search_type') === 'customrecord18' && request.getParameter('custpage_acct_type'))
				filters.push(new nlobjSearchFilter('custrecord68', null, 'anyof', request.getParameter('custpage_acct_type').split('_')));
			if(request.getParameter('custpage_search_type') === 'customrecord18' && request.getParameter('custpage_escrow_id'))
				filters.push(new nlobjSearchFilter('custrecord66', null, 'anyof', request.getParameter('custpage_escrow_id').split('_')));
			if(request.getParameter('custpage_currencies'))
				filters.push(new nlobjSearchFilter('custrecord85', null, 'anyof', request.getParameter('custpage_currencies').split('_')));
				
			if(request.getParameter('custpage_search_type') === 'customrecord18'){
				if(request.getParameter('custpage_date')){
					filters.push(new nlobjSearchFilter('custrecord65', null, 'onorbefore', request.getParameter('custpage_date')));	
				}
			}
			if(request.getParameter('custpage_search_type') === 'calendarevent')
				filters.push(that.getEscrowSecurityFilter('custevent1'));
			if(request.getParameter('action') === 'getCurrencies')
			{
				return that.getCurrencies(request);
			}
			
			var nsrc = new NlobjSearchResultConverter();
						
		   	var results;
			nlapiLogExecution('AUDIT', 'Running Saved Search', that.searchId);
			if (filters.length > 0) 
				that.data = nsrc.toJS(Util.search(request.getParameter('custpage_search_type'), that.searchId, filters, null), false);
			else
				that.data = nsrc.toJS(Util.search(request.getParameter('custpage_search_type'), that.searchId, null, null), false);
			
			//filter zero balances in summary view
			// we can implement this in Celigo-TransactionSummaryController-10252009.js but GridFilters plugin is resetting the store.filterBy results
			if(that.searchId == 290){
				if(that.data){
					var ACTIVE_DATE = new Date(request.getParameter('custpage_date'));
					
					for(var i=0; that.data && i<that.data.length; i++){
						if(parseFloat(that.data[i].custrecord70_val_9) == 0){
							var MAX_DATE = new Date(that.data[i].custrecord65_MAX_12);
							MAX_DATE.setDate(MAX_DATE.getDate() + 31);
							if(MAX_DATE < ACTIVE_DATE)
							{
								that.data.splice(i--,1);
							}
						}
					}
				}
			}
			
			// add total to detail transaction page - DAU - move this to controller
			if(that.searchId == 542)
			{
				if(that.data)
				{
					var total = parseFloat("0.00");
					var dateS = "";
					var denom = "";
					var id = -1;
					for(var i = 0; i < that.data.length; i++)
					{
						total = total + parseFloat(that.data[i].custrecord70_val_4);
						dateS = that.data[i].custrecord65_val_0;
						denom = that.data[i].custrecord85_val_5;
						id = i + 1;
					}
					that.data.push({"custrecord70_val_4":total,
									"formulatext_val_8":"Total as of date",
									"custrecord65_val_0":dateS,
									"custrecord65_GROUP_0":dateS,
									"custrecord85_GROUP_5":denom,
									"id":id});					
				}
			}
			
			return that.data || null;
        };
        
		this.getSecurityFilter = function(shareholderId){//nlobjSearchFilter
			
			nlapiLogExecution('AUDIT', 'Requesting user id (Company)', nlapiGetContext().getUser());
			nlapiLogExecution('AUDIT', 'Requesting user name', nlapiGetContext().getName());
			nlapiLogExecution('AUDIT', 'Requesting user email', nlapiGetContext().getEmail());
			
			var results = Util.search('contact', null, new nlobjSearchFilter('email', null, 'is', nlapiGetContext().getEmail()));
			
			if (results && results.length === 1) {
				//Find all Customer records of type Investor Group || Shareholder where the Contact (results[0]) is present
				var custResults = Util.search('customer', null, [new nlobjSearchFilter('internalid', 'contact', 'anyof', results[0].getId()), new nlobjSearchFilter('category', null, 'anyof', ['1','2'])]);
				if (custResults) {
					nlapiLogExecution('AUDIT', 'Found related Investor Group or Shareholder Customers', custResults.length);
					
					var parents = [];
					for (var i=0; i<custResults.length; i++) 
						parents.push(custResults[i].getId());
					
					//Find all child Customers of the Customer results
					var childCustResults = Util.search('customer', null, [new nlobjSearchFilter('parent', null, 'anyof', parents), new nlobjSearchFilter('category', null, 'anyof', ['2'])]);
					if (childCustResults) {
						nlapiLogExecution('AUDIT', 'Found child Shareholder Customers', childCustResults.length);
						var shareholderIds = [];
						for (var i = 0; i < childCustResults.length; i++) 
							shareholderIds.push(childCustResults[i].getId());
						
						shareholderIds.unique();
						nlapiLogExecution('AUDIT', 'Permitted Escrow Customers', shareholderIds.join());
					
						if (shareholderId) {
							if (shareholderIds.indexOf(shareholderId) > -1) 
								shareholderIds = [shareholderId];
							
							nlapiLogExecution('AUDIT', 'Filtering for Escrow Customer', shareholderIds.join());	
						}
						if (request.getParameter('custpage_search_type') === 'customrecord12') {
							return new nlobjSearchFilter('custrecord16', null, 'anyof', shareholderIds);
						}
						else {
							return new nlobjSearchFilter('custrecord67', null, 'anyof', shareholderIds);
						}
					}
				}
				if (request.getParameter('custpage_search_type') === 'customrecord12') {
					return new nlobjSearchFilter('custrecord16', null, 'anyof', [0]);
				}
				else {
					return new nlobjSearchFilter('custrecord66', null, 'anyof', []);
				}
			}
			else 
				throw nlapiCreateError('Unique Contact record not found for user: ' + nlapiGetContext().getEmail());
			
		};
    
		this.getEscrowNewsSecurityFilter = function(){//nlobjSearchFilter
			
			nlapiLogExecution('AUDIT', 'Requesting user id (Company)', nlapiGetContext().getUser());
			nlapiLogExecution('AUDIT', 'Requesting user name', nlapiGetContext().getName());
			nlapiLogExecution('AUDIT', 'Requesting user email', nlapiGetContext().getEmail());
			
			var results = Util.search('contact', null, new nlobjSearchFilter('email', null, 'is', nlapiGetContext().getEmail()));
			
			if (results && results.length === 1) {
				//Find all Customer records of type Investor Group || Shareholder where the Contact (results[0]) is present
				var custResults = Util.search('customer', null, [new nlobjSearchFilter('internalid', 'contact', 'anyof', results[0].getId()), new nlobjSearchFilter('category', null, 'anyof', ['1','2'])]);
				if (custResults) {
					nlapiLogExecution('AUDIT', 'Found related Investor Group or Shareholder Customers', custResults.length);
					
					var parents = [];
					for (var i=0; i<custResults.length; i++) 
						parents.push(custResults[i].getId());					
					
					return new nlobjSearchFilter('custrecord88', null, 'anyof', parents);
				}				
				return new nlobjSearchFilter('custrecord88', null, 'anyof', [0]);
			}
			else 
				throw nlapiCreateError('Unique Contact record not found for user: ' + nlapiGetContext().getEmail());
			
		};
		
		this.getEscrowSecurityFilter = function(columnId)
		{
			nlapiLogExecution('AUDIT', 'Requesting user id (Company)', nlapiGetContext().getUser());
			nlapiLogExecution('AUDIT', 'Requesting user name', nlapiGetContext().getName());
			nlapiLogExecution('AUDIT', 'Requesting user email', nlapiGetContext().getEmail());
			nlapiLogExecution('AUDIT', 'Requesting user columnId', columnId);
			
			var results = Util.search('contact', null, new nlobjSearchFilter('email', null, 'is', nlapiGetContext().getEmail()));
			
			if (results && results.length === 1) {
				//Find all Customer records of type Investor Group || Shareholder where the Contact (results[0]) is present
				var escrowsResults = Util.search('customer', null, [new nlobjSearchFilter('internalid', 'contact', 'anyof', results[0].getId()), new nlobjSearchFilter('category', null, 'anyof', ['1'])]);
				
				var escrowIds = new Array();
				for (var i=0; i < escrowsResults.length; i++) 
					escrowIds.push(escrowsResults[i].getId());

				escrowIds.unique();
				nlapiLogExecution('AUDIT', 'Permitted Escrows', escrowIds.join());
				
				return new nlobjSearchFilter(columnId, null, 'anyof', escrowIds);
			}
		}
		
		this.getCurrencies = function(request)
		{
			// get the list of escrows the currency user has access to
			var escrowsFilter = new Array();
			nlapiLogExecution('AUDIT', 'getCurrencies', 'BEFORE Escrow Security Filter');
			escrowsFilter.push(this.getEscrowSecurityFilter('custbody2'));		// limit results by Escrow in the transaction search

			var currencies = Util.search('transaction', '808', escrowsFilter, null);
			if(currencies == null || currencies.length == 0)
				throw nlapiCreateError("Transaction search did not return any currencies");
			
			// with the list of currencies, build a filter for the saved search
			var currenciesArray = new Array();
			for(var i = 0; i < currencies.length; i++)
			{
				var currency = currencies[i];
				currenciesArray.push(currency.getValue("currency"),null,"group");
			}
			
			var currencyFilter = new nlobjSearchFilter('custrecord_ticker_currency', null, 'anyof', currenciesArray);
			var currencyColumns = new Array();
			currencyColumns[0] = new nlobjSearchColumn('name',null,null);
			currencyColumns[1] = new nlobjSearchColumn('custrecord_ticker_currency',null,null);
			currencyColumns[2] = new nlobjSearchColumn('custrecord_exchange_code',null,null);
			currencyColumns[3] = new nlobjSearchColumn('custrecordquote_date',null,null);
			currencyColumns[4] = new nlobjSearchColumn('custrecord_srs_quote_long',null,null);
			currencyColumns[5] = new nlobjSearchColumn('custrecord_srs_usd_quote',null,null);
			currencyColumns[1].setSort();
			currencyColumns[3].setSort();
			
			var currencyValues = Util.search('customrecord_stock_tickers','749',currencyFilter,currencyColumns);
			if(currencyValues == null || currencyValues.length == 0)
				throw nlapiCreateError("No currency values found for list of currencies " + currenciesArray);
			
			var data = new Array();
			for (var i = 0; i < currencies.length; i++)
			{
				var currency = currencies[i];
				var currencyName = currency.getText("currency",null,"group");
				
				var description = new Array(); // the portion of the JSON object containing name, currency, and exchange
				var values = new Array();	   // the inner portion of the JSON object that contains each quote date, value and USD value
				var name = null;
				var currency = null;
				var exchange = null;
				var currency_id = null;
				var stock_ticker_id = null;
				var exchange_code_id = null;
				for (var j = 0; j < currencyValues.length; j++)
				{
					var currencyValue = currencyValues[j];
					var ticker = currencyValue.getText("custrecord_ticker_currency");
					
					if(currencyName != ticker) continue;
					
					if (name == null) {
						name = currencyValue.getValue("name");
						currency = ticker;
						exchange = currencyValue.getText("custrecord_exchange_code");
						currency_id = currencyValue.getValue("custrecord_ticker_currency");
						stock_ticker_id = currencyValue.getId();
						exchange_code_id = currencyValue.getValue("custrecord_exchange_code");
					}
					
					var value = {
							 "quote_date":currencyValue.getValue("custrecordquote_date")
							 ,"native_quote_value":currencyValue.getValue("custrecord_srs_quote_long")
							 ,"usd_quote_value":currencyValue.getValue("custrecord_srs_usd_quote")}
							 
					values.push(value);
				}
				
				description = {
					"name": name,
					"currency": currency,
					"exchange": exchange,
					"stock_ticker_id": stock_ticker_id,
					"currency_id": currency_id,
					"exchange_code_id": exchange_code_id,
					"values":values
				}
					
				nlapiLogExecution('AUDIT', 'getCurrencies', 'Done building root JSON object');
				
				if (description.length == 0) 
					throw nlapiCreateError("Currency " + currencyName + " not found");
				
				data.push(description);
			}

			nlapiLogExecution('AUDIT', 'getCurrencies', 'returning data');
						
			return data;
		}
	
	}
	
    return { //public members
        main: function(request, response){
            try {
			if(!request.getParameter('custpage_search_id'))
				throw nlapiCreateError('MISSING_REQUIRED_PARAMETER', '"custpage_search_id parameter is required to call this service');
			if(!request.getParameter('custpage_search_type'))
				throw nlapiCreateError('MISSING_REQUIRED_PARAMETER', '"custpage_search_type parameter is required to call this service');
			
                var tss = new JSONPDataServer(request);
				if (request.getParameter('jsonp') === 'true') {
					if(!request.getParameter('custpage_namespace'))
						throw nlapiCreateError('MISSING_REQUIRED_PARAMETER', '"custpage_namespace parameter is required to call this service');
					
					var jsDoc = '';
					if (request.getParameter('custpage_include_cookie') === 'true') {
						jsDoc = 'var ' + request.getParameter('custpage_namespace') + ' = {' +
						'get' +
						tss.searchId +
						': function(){' +
						'return ' +
						JSON.stringify(tss.getData()) +
						';' +
						'},' +
						'getCookie: function(){' +
						'return ' +
						JSON.stringify(request.getHeader('COOKIE')) +
						';' +
						'}' +
						'};';
					}
					else {
						jsDoc = 'var ' + request.getParameter('custpage_namespace') + ' = {' +
						'get' +
						tss.searchId +
						': function(){' +
						'return ' +
						JSON.stringify(tss.getData()) +
						';' +
						'}};';
					}
					response.setContentType('JAVASCRIPT', 'd.js'); 
					response.write(jsDoc);
				}
				else{
					if(tss.getData())
						response.write(JSON.stringify(tss.getData()));
					else
						response.write('[]');
				}
            } 
            catch (e) {
				response.write((e.name || e.getCode())+': '+ (e.message || e.getDetails())+' check line '+Util.getLineNumber(e));
                 //args(Error object, script name, receipients, author Employee Id)
            	//Util.handleError(e, 'Celigo-JSONP-ModelServer.js', ['clinton.blackburn@celigo.com, durbano@shareholderrep.com'], 6367);
				Util.handleError(e, 'Celigo-JSONP-ModelServer.js', ['shiva.alluri@celigo.com'], 6367);
				//Util.handleError(e, 'Celigo-JSONP-ModelServer.js', ['durbano@shareholderrep.com'], 6367);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    }
})();


