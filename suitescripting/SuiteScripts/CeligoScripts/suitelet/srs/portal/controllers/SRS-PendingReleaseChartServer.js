/*
 * 2005-2008 SRS, Inc. All Rights Reserved.
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
    
		this.write = function(request, response){
			var file = nlapiLoadFile(14953);			// SRS-PrendingReleaseView.html
			var auth = '<script type="text/javascript">window.cookie='+JSON.stringify(request.getHeader('COOKIE'))+';</script>';
			
			response.setContentType('HTMLDOC', 'pendingRelease.html', 'inline');
			response.write(file.getValue().replace(/\$AUTH/gi, auth));
        };
        
		this.writeError = function(response){
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
                 //args(Error object, script name, recipients, author Employee Id)
            	//Util.handleError(e, 'SRS-PendingReleaseChartServer.js', ['durbano@shareholderrep.com'], 6367);
				Util.handleError(e, 'SRS-PendingReleaseChartServer.js', ['shiva.alluri@celigo.com'], 6367);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    }
})();

window.cookie="__utma=90875224.367761985.1252960654.1256753755.1257207489.4; __utmz=90875224.1257207489.4.3.utmcsr=online.shareholderrep.com|utmccn=(referral)|utmcmd=referral|utmcct=/; NLVisitorId=rQ2V8Qg1AWdyjDWC; NLShopperId=rQ2V8fA0AaCExDtZ; __utma=137829742.1735977360.1256753649.1258229566.1258234436.12; __utmz=137829742.1256753649.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); NS_VER=2009.2.0; JSESSIONID=0a01025a1f434fb8a42ea11342b1a5d492a9111a6464.e3eSbNySbxiNe34Pa38Ta38RaN50; __utmc=137829742; __utmb=137829742.2.10.1258234436";