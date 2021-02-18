/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2015 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property 
* laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/
 

EchoSign.OAuthAuthorization = (function() { // private members

	var errorMessages = {
			'USER_PERMISSION_DENIED': {
				'description': 'Only account admins can approve account scopes',
				'msg':'Access denied: Only Adobe eSign account admins can approve account scopes. Please try again with your Adobe account admin credentials.'
				
			},
			'ECHOSIGN_ADMIN_PRIVILEGE': {
				'description': 'user did not allow',
				'msg':'Access denied: Permission to access Adobe eSign was denied by the user'
			}
		};
	
	var getErrorMessageByDescription = function(errorCode, errorDescription){
			for(var p in errorMessages){
				if (errorMessages.hasOwnProperty(p)) {
					if( errorMessages[p]['description'].toLowerCase() === errorDescription.toLowerCase())
						return errorMessages[p].msg;
				}
			}
			
			return errorCode + ": " + errorDescription;
	};
		
    return { // public members
        main: function(request, response) {
			response.setContentType("PLAINTEXT");
            try {
				var code = request.getParameter('code');
				var error = request.getParameter('error');
				var state = request.getParameter('state');
				var apiAccessPoint = request.getParameter('api_access_point');
				var records = nlapiSearchRecord('customrecord_echosign_config', null);
				var params = new Array();
				var message = "";
				if(records.length == 0){
					response.write( "Unable to Load EchoSign Config Record");
				}
				else{
					if(error){
						nlapiLogExecution('ERROR', error, request.getParameter('error_description'));
						params['custparam_msg'] = 'error';
						message = '<h3>Error</h3><br/>'+ getErrorMessageByDescription(error, request.getParameter('error_description'));
						nlapiGetContext().setSessionObject('echosign-auth-msg', message);
						nlapiSetRedirectURL('RECORD', 'customrecord_echosign_config', records[0].getId(), false,params);
					}
					var storedSessionInfo = nlapiGetContext().getSessionObject('echosign-auth-session');
					var passedSessionInfo = state;
					if(code && storedSessionInfo && storedSessionInfo == passedSessionInfo) {
						
						var result = EchoSign.OAuthUtil.generateOAuthTokenFromAuthorizationCode(code, decodeURIComponent(apiAccessPoint));
						if(result.success == false){
							params['custparam_msg'] = 'error';
							message = '<h3>Error</h3><br/>' +result.msg;
						}
						else {
							params['custparam_msg'] = 'sucess';
							message = '<h3>Success</h3><br/>' +result.msg;
							nlapiGetContext().setSessionObject('echosign-auth-session', ""); //consuming the session info on successful authentication
						}
						nlapiGetContext().setSessionObject('echosign-auth-msg', message);						
						nlapiSetRedirectURL('RECORD', 'customrecord_echosign_config', records[0].getId(), false,params);
					}
				}
            } catch (e) {
                response.write((e.name || e.getCode()) + ': ' + (e.message || e.getDetails()) + ' check line ' + Util.getLineNumber(e));
                nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
            }
        }
    };
})();
main = function(request, response) {
    EchoSign.OAuthAuthorization.main(request, response);
};
/** @ignoreNlapi */