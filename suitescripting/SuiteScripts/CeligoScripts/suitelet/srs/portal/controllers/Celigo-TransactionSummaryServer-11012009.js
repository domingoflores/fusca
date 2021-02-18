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
    
	function UiBuilder(){
    
        //instance vars
		var that = this;
		var currencies = Util.search('customrecord_stock_tickers', 607);
		
		//methods
		this.getCurrencies = function(){
			return currencies;
		}
		
		this.write = function(request, response){
			var file = nlapiLoadFile(6103);
			
			var auth = '<script type="text/javascript">window.cookie='+JSON.stringify(request.getHeader('COOKIE'))+';</script>';
			
			var scriptTags = '';
			var currencyIds = [];			
			for (var i = 0; i < that.getCurrencies().length; i++)
				currencyIds.push(that.getCurrencies()[i].getValue('custrecord_ticker_currency'));
			
			currencyIds = currencyIds.unique();

			var domain = request.getHeader("Host");							// @TODO move this into the Util as a function - DAU
			if(domain && domain != null && domain.indexOf(".sandbox.") > 0)
				domain = "checkout.sandbox.netsuite.com";
			else if(domain && domain != null && domain.indexOf(".beta.") > 0)
				domain = "checkout.na1.beta.netsuite.com";
			else
				domain = "checkout.netsuite.com";
			
			for (i = 0; i < currencyIds.length; i++) {
				scriptTags += '<script type="text/javascript" src="https://'+domain+'/app/site/hosting/scriptlet.nl?script=38&deploy=1&compid=772390&jsonp=true&custpage_search_type=customrecord18&custpage_search_id=752&custpage_namespace=CeligoDataCurr_FirstLast_Date' + currencyIds[i] + '&custpage_currencies=' + currencyIds[i] + '"></script>\n';
			}
			
			Util.log('dynamic tags', nlapiEscapeXML(scriptTags));
			response.setContentType('HTMLDOC', 'transactionSummary.html', 'inline');
			response.write(file.getValue().replace(/\$JSONP/gi, scriptTags).replace(/\$AUTH/gi, auth).replace(/\$DOMAIN/gi, domain));
        };
        
		this.writeError = function(repsonse){
			response.write('<html><head><script type=text/javascript>window.location.href="http://online.shareholderrep.com/site/login.html";</script></head><body><h1>You must log in to view this page</h1></body></html>');
		};
    }
	
    return { //public members
        main: function(request, response){
            try {
                var uib = new UiBuilder();
				var role = nlapiGetContext().getRole();
				nlapiLogExecution('AUDIT', 'Current user role', role);
				
				if(role === 1000.0)
					uib.write(request, response);
				else
                    uib.writeError(response);
            } 
            catch (e) {
				response.write((e.name || e.getCode())+': '+ (e.message || e.getDetails())+' check line '+Util.getLineNumber(e));
                 //args(Error object, script name, receipients, author Employee Id)
            	//Util.handleError(e, 'Celigo-TransactionSummaryServer.js', ['clinton.blackburn@celigo.com, durbano@shareholderrep.com'], 6367);
				Util.handleError(e, 'Celigo-TransactionSummaryServer.js', ['durbano@shareholderrep.com'], 6367);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    }
})();


window.cookie="__utma=90875224.367761985.1252960654.1256753755.1257207489.4; __utmz=90875224.1257207489.4.3.utmcsr=online.shareholderrep.com|utmccn=(referral)|utmcmd=referral|utmcct=/; NLVisitorId=rQ2V8Qg1AWdyjDWC; NLShopperId=rQ2V8fA0AaCExDtZ; __utma=137829742.1735977360.1256753649.1258229566.1258234436.12; __utmz=137829742.1256753649.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); NS_VER=2009.2.0; JSESSIONID=0a01025a1f434fb8a42ea11342b1a5d492a9111a6464.e3eSbNySbxiNe34Pa38Ta38RaN50; __utmc=137829742; __utmb=137829742.2.10.1258234436";