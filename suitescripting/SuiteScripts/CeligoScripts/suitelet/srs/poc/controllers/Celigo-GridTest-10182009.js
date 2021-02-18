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
		
		//methods
		this.write = function(response){
			var file = nlapiLoadFile(6056);
			Util.log('html', nlapiEscapeXML(file.getValue()));
			response.write(file.getValue());
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


