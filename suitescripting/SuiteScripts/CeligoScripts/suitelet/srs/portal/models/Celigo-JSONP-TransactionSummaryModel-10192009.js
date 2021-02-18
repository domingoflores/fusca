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
    
	function JSONPDataServer(){
    
        //instance vars
		var that = this;
		this.searchId = nlapiGetContext().getSetting('SCRIPT', 'custscript_celigo_ts_model_search');
		this.data;
		
		
		this.getData = function(){
			if(that.data)
				return that.data;
			
			var nsrc = new NlobjSearchResultConverter();
		   	
			var results = Util.search(
			   		'customrecord18',
					that.searchId,
					null,
					null
				);
			var d = [];
			if(!results)
				return null;
			
			var columns = results[0].getAllColumns();
			for (var i = 0; i < results.length; i++) {
				var o = {};
				for (var j=0; columns && j< columns.length; j++) {
					if (results[i].getValue(columns[j])) //|| parseFloat(results[i].getValue(columns[j].getName())) === 0.0) 
						o[columns[j].getName()] = results[i].getValue(columns[j]);
				}
				
				/*o['companyname_custrecord66'] = results[i].getValue('companyname', 'custrecord66');
				o['formulatext'] = results[i].getValue('formulatext');
				o['companyname_custrecord67'] = results[i].getValue('companyname', 'custrecord67');
				o['custrecord85'] = results[i].getValue('custrecord85');
				o['formulanumeric'] = results[i].getValue('formulanumeric');
				o['custrecord75'] = results[i].getValue('custrecord75');
				o['custrecord76'] = results[i].getValue('custrecord76');
				o['custrecord77'] = results[i].getValue('custrecord77');
				o['custrecord78'] = results[i].getValue('custrecord78');
				o['custrecord103'] = results[i].getValue('custrecord103');
				o['formulacurrency'] = results[i].getValue('formulacurrency');*/
				
				d.push(o);
			}
			that.data = d;
			return d;
        };
        
    }
	
    return { //public members
        main: function(request, response){
            try {
                var tss = new JSONPDataServer();
				var jsDoc = 'var CeligoData = {'+
					'get'+tss.searchId+': function(){'+
						'return '+JSON.stringify(tss.getData())+');'+
					'},'+
					'cookie: '+JSON.stringify(request.getHeader('COOKIE'))+
				'};';
				response.setContentType('JAVASCRIPT', 'd.js');
				response.write(jsDoc);
            } 
            catch (e) {
				response.write((e.name || e.getCode())+': '+ (e.message || e.getDetails())+' check line '+Util.getLineNumber(e));
                 //args(Error object, script name, receipients, author Employee Id)
            	Util.handleError(e, 'Celigo-JSONP-ModelServer.js', ['clinton.blackburn@celigo.com'], 6367);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    }
})();


