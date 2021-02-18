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
    
	function UserInfoServer(request){
    
        //instance vars
		var that = this;		
		
		this.isUserChangedPassword = function(){				
			var results = nlapiSearchRecord('customrecord_users_changed_password', null, new nlobjSearchFilter('custrecord_user_changed_pwd_email', null, 'is', nlapiGetContext().getEmail()));
			return (results && results.length > 0);
		};
		
		this.getUserInfo = function(){			
		
			nlapiLogExecution('AUDIT', 'this.getUserInfo', nlapiGetContext().getEmail());
			
			var columns = [];
			columns.push(new nlobjSearchColumn('entityid'));
			columns.push(new nlobjSearchColumn('company'));
			
			var filters = [];
			filters.push(new nlobjSearchFilter('email', null, 'is', nlapiGetContext().getEmail()));
			filters.push(new nlobjSearchFilter('email', null, 'isnot', '@NONE@'));
			
			var usr = nlapiSearchRecord('contact', null, filters, columns);
			
			//var recon = nlapiSearchRecord('customrecord18', null
			//								,new nlobjSearchFilter('custrecord_et_status', null, 'anyof', ['4'])	// filter - 4 = RELEASED
			//								,new nlobjSearchColumn('custrecord65',null,'max'));						// column

//mgs

var reconFilters = new Array();
			reconFilters[0] = new nlobjSearchFilter('custrecord_et_status', null, 'anyof', ['4'])	// filter - 4 = RELEASED
			reconFilters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
			
			var recon = nlapiSearchRecord('customrecord18', null
											,reconFilters
											//,new nlobjSearchFilter('custrecord_et_status', null, 'anyof', ['4'])	// filter - 4 = RELEASED
											,new nlobjSearchColumn('custrecord65',null,'max'));						// column

//end mgs

			var data = {
				"name": 		(usr 	? 	usr[0].getValue("entityid") : ""),
				"company": 		(usr 	? 	usr[0].getText("company") : ""),
				"reconciled": 	(recon 	? 	recon[0].getValue('custrecord65',null,'max') : "")
			};
			response.setContentType('JAVASCRIPT', 'd.js');
			
			if(request.getParameter('page') === "home"){				
				response.write('jQuery("span#usrInfo").html("' + (data.name + (data.company ? (", " + data.company) : "") + (data.name ? " &nbsp; | " : "")) + '");');
				response.write('jQuery("span#srsReconcileInfo").html("' + (data.reconciled ? ("Reconciled as of " + data.reconciled) : "") + '");');
			}else{
				response.write('function getUserInfo() {return ' + JSON.stringify(data) + '}');	
			}			
		};
		
		this.userChangedPassword = function(){
			nlapiLogExecution('AUDIT', 'User Info Server', "this.userChangedPassword");
			var results = nlapiSearchRecord('customrecord_users_changed_password', null, new nlobjSearchFilter('custrecord_user_changed_pwd_email', null, 'is', nlapiGetContext().getEmail()));
			if (!results) {
				var newRecord = nlapiCreateRecord("customrecord_users_changed_password");
				newRecord.setFieldValue("custrecord_user_changed_pwd_email", nlapiGetContext().getEmail());
				nlapiSubmitRecord(newRecord);
			}
			response.setContentType('JAVASCRIPT', 'd.js');
			
			var domain = request.getHeader('Host');
			if(!domain || domain == null)
			{
				domain = "online.shareholderrep.com";
			}
			else if(domain.toLowerCase().search("sandbox") == -1)
			{
				domain = "online.shareholderrep.com";
			}
			
			response.write("window.location.href='http://" + domain + "/';");
		};
		
	}
	
    return { //public members
        main: function(request, response){
            try {
				
				nlapiLogExecution('AUDIT', 'User ', nlapiGetContext().getUser());
				nlapiLogExecution('AUDIT', 'User Email', nlapiGetContext().getEmail());
				//nlapiLogExecution('AUDIT', 'User Info Server Action', request.getParameter('action'));

				/*var referrer = request.getHeader('Referer');
				nlapiLogExecution('AUDIT', 'referrer', 'referrer = ' + referrer);
				if(referrer.toLowerCase().search('/app/center/changepwd.nl') != -1)
				{
					uis.userChangedPassword();
					//return;
				}*/
				//
				
                var uis = new UserInfoServer(request);
				if(nlapiGetContext().getUser() == 0)		// this appears to happen when noone is logged in - DAU
				{
					response.write("");
					return;
				}else if (request.getParameter('action') === 'new') {
					uis.userChangedPassword();	
				}else if (request.getParameter('action') === 'ui') {
					uis.getUserInfo();	
				}else{
					response.setContentType('JAVASCRIPT', 'd.js');					
					if (nlapiGetContext().getEmail() && !uis.isUserChangedPassword()) {	
						var domain = request.getHeader('Host');
						if(!domain || domain == null)
						{
							domain = "checkout.netsuite.com";
						}
						else if(domain.toLowerCase().search("sandbox") == -1)
						{
							domain = "checkout.netsuite.com";
						}

						response.write("window.location.href='https://" + domain + "/app/center/changepwd.nl';");
					}else{
						response.write("");
					}
				}				
            } 
            catch (e) {
				response.write((e.name || e.getCode())+': '+ (e.message || e.getDetails())+' check line '+Util.getLineNumber(e));
                 //args(Error object, script name, receipients, author Employee Id)
            	//Util.handleError(e, 'Celigo-JSONP-ModelServer.js', ['clinton.blackburn@celigo.com, durbano@shareholderrep.com'], 6367);
				//Util.handleError(e, 'Celigo-JSONP-ModelServer.js', ['shiva.alluri@celigo.com'], 6367);
				Util.handleError(e, 'Celigo-UserInfoServer-06262010.js', ['durbano@shareholderrep.com'], 6367);
				nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    }
})();