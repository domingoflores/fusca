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
		
		this.write = function(response){
			var file = nlapiLoadFile(6103);
			
			var scriptTags = '';
			for (var i=0; i<that.getCurrencies().length; i++) 
				scriptTags += '<script type="text/javascript" src="https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=38&deploy=1&custpage_search_type=customrecord18&custpage_search_id=605&custpage_namespace=CeligoDataCurr'+that.getCurrencies()[i].getValue('custrecord_ticker_currency')+'&custpage_currencies='+that.getCurrencies()[i].getValue('custrecord_ticker_currency')+'"></script>';
			
			Util.log('dynamic tags', nlapiEscapeXML(scriptTags));
			response.setContentType('HTMLDOC', 'transactionSummary.html', 'inline');
			response.write(file.getValue().replace(/$JSONP/gi, scriptTags));
        };
        
    }
	
    return { //public members
        main: function(request, response){
            try {
                var uib = new UiBuilder();
				uib.write(response);
            } 
            catch (e) {
				response.write((e.name || e.getCode())+': '+ (e.message || e.getDetails())+' check line '+Util.getLineNumber(e));
                 //args(Error object, script name, receipients, author Employee Id)
            	Util.handleError(e, 'Celigo-GridTest.js', ['clinton.blackburn@celigo.com'], 6367);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    }
})();


