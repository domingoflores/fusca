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



EchoSign.OAuthAuthorization = (function(){ //private members

	//randomStr is used to generate random session variable used for oauth state parameter
	var randomStr = function() {
			var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var string_length = 10;
            var randomstring = '';
            for (var i = 0; i < string_length; i++) {
                var rnum = Math.floor(Math.random() * chars.length);
                randomstring += chars.substring(rnum, rnum + 1);
            }
			return randomstring;
	};
	
	return { //public members
        beforeLoad: function(type, form, request){   
			try{
				if(type.toLowerCase() === 'view'){		
					
					var oauthSessionInfo =  nlapiGetContext().getSessionObject('echosign-auth-session');
					if( !oauthSessionInfo) {
						oauthSessionInfo = nlapiEncrypt(randomStr(), 'sha1');
						nlapiGetContext().setSessionObject('echosign-auth-session', oauthSessionInfo);
					}
					
					var url=  EchoSign.OAuthUtil.generateNetSuiteDynamicURL(oauthSessionInfo);
					form.addButton('custpage_send_oauth_button', 'Log In With Adobe eSign', "window.location.href= '" + url + "'");
					var msg = request.getParameter('custparam_msg');
					if(msg && msg != ""){
						var oauthMessageInfo =  nlapiGetContext().getSessionObject('echosign-auth-msg');
						if(oauthMessageInfo) {
							var html = '<div style="border-radius:20px;padding:20px;background:#FFB6C1">'+oauthMessageInfo+'</div>';
							var label = form.addField('custpage_echosign_request_message', 'inlinehtml', 'message');
							label.setDefaultValue (html);
							form.insertField(label, 'custrecord_echosign_access_token');
							nlapiGetContext().setSessionObject('echosign-auth-msg', "");
						}
						
					}
				} 
			}
			 catch (e) {
                nlapiLogExecution('ERROR', e.name || e.getCode(), e.message || e.getDetails());
				nlapiLogExecution('ERROR', 'check line', Util.getLineNumber(e));
            }
        }
    };
})();

function beforeLoad(type, form, request){
	EchoSign.OAuthAuthorization.beforeLoad(type, form, request);
}