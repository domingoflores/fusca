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


EchoSign.PasswordUtil = (function() { // private members

	var ALPHA_NUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var PASSWORD_SYMBOL_CHARS = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
	var ALPHA_UPPER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var ALPHA_LOWER_CHARS = "abcdefghijklmnopqrstuvwxyz";
	var NUMERIC_CHARS = "0123456789";
	var PASSWORD_MIN_LENGTH = 12;
	
	var hasLowerCase = function(str) {
		return	/[a-z]/.test(str);
	};
	var hasUpperCase = function (str) {
		return	/[A-Z]/.test(str);
	};
	var hasNumericCharacter = function(str) {
		return /\d/.test(str);
	};
	
	var insertRandomChar= function(password, source) {
		var index = Math.floor(Math.random() * password.length);
		var symbol = source.charAt(Math.floor(Math.random() * source.length));
		password= password.substr(0, index) + symbol + password.substr(index);
		return password;
	};
	
    return { // public members
	
		generatePassword : function(minLength) {
			minLength = minLength || PASSWORD_MIN_LENGTH;//in case minLength is not passed initialize with PASSWORD_MIN_LENGTH
			var password = '';
			for(var i=0,clen=ALPHA_NUMERIC_CHARS.length;i<minLength;i++)
				password += ALPHA_NUMERIC_CHARS.charAt(Math.floor(Math.random() * clen));
		   
			password = insertRandomChar(password , PASSWORD_SYMBOL_CHARS);
			
			if(!hasLowerCase(password)){
				password = insertRandomChar(password , ALPHA_LOWER_CHARS);
			}
			if(!hasUpperCase(password)){
				password = insertRandomChar(password , ALPHA_UPPER_CHARS);
			}
			if(!hasNumericCharacter(password)){
				password = insertRandomChar(password , NUMERIC_CHARS);
			}
			return password;
		}
    };
})();