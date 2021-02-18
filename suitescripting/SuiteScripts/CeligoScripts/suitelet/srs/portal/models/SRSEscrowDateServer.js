var SRS = {};
SRS.CustomerPortal = (function(){ //private members
    
	function EscrowDateServer(request){
    
        //instance vars
		var that = this;		
		
		this.getEscrowDate = function(){			
			var columns = [];
			columns.push(new nlobjSearchColumn('entityid'));
			columns.push(new nlobjSearchColumn('company'));

			var results = nlapiSearchRecord('contact', null, new nlobjSearchFilter('email', null, 'is', nlapiGetContext().getEmail()), columns);

			var data = {
				"date": (results ? results[0].getValue("entityid") : "")
			};
			response.setContentType('JAVASCRIPT', 'd.js');
			
			if(request.getParameter('page') === "home"){				
				response.write('jQuery("span#dateInfo").html("' + (data.name + (data.company ? (", " + data.company) : "") + (data.name ? " &nbsp; | " : "")) + '");');				
			}else{
				response.write('function getEscrowDate() {return ' + JSON.stringify(data) + '}');	
			}			
		};
	}
	
    return { //public members
        main: function(request, response){
            try {
				
				nlapiLogExecution('AUDIT', 'User Email', nlapiGetContext().getEmail());
				
                var eds = new EscrowDateServer(request);
				if (request.getParameter('action') === 'ui') {
					eds.getUserInfo();	
				}
            } 
            catch (e) {
				response.write((e.name || e.getCode())+': '+ (e.message || e.getDetails())+' check line '+Util.getLineNumber(e));
				Util.handleError(e, 'Celigo-JSONP-ModelServer.js', ['durbano@shareholderrep.com'], 6367);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    }
})();