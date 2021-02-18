//------------------------------------------------------------------
// Copyright 2015-2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
// oAuth originally created by Netsite's Mark Keaton
// adapted to work in SuiteScirpts by Marko Obradovic
//------------------------------------------------------------------
define(['./cryptojs'], function(cryptojs) {
    /**
     * Constructor
     * @param {Object} opts consumer key and secret
     */
	var auth = null;
    function OAuth(opts) 
	{
        if(!(this instanceof OAuth)) 
		{
            return new OAuth(opts);
        }

        if(!opts) {
            opts = {};
        }

        if(!opts.consumer) {
            throw new Error('consumer option is required');
        }
        this.nonce = "";
        this.consumerToken = "";
        this.token = "";
        this.signature = "";
        this.timestamp = "";
        
        this.consumer            = opts.consumer;
        this.nonce_length        = opts.nonce_length || 32;
        this.version             = opts.version || '1.0';
        this.realm               = opts.realm || '';
        this.parameter_seperator = opts.parameter_seperator || ', ';

        if(typeof opts.last_ampersand === 'undefined') {
            this.last_ampersand = true;
        } else {
            this.last_ampersand = opts.last_ampersand;
        }

        // default signature_method is 'PLAINTEXT'
        this.signature_method = opts.signature_method || 'PLAINTEXT';

        if(this.signature_method == 'PLAINTEXT' && !opts.hash_function) {
            opts.hash_function = function(base_string, key) {
                return key;
            }
        }

        if(!opts.hash_function) {
            throw new Error('hash_function option is required');
        }

        this.hash_function = opts.hash_function;
    }

    /**
     * OAuth request authorize
     * @param  {Object} request data
     * {
     *     method,
     *     url,
     *     data
     * }
     * @param  {Object} key and secret token
     * @return {Object} OAuth Authorized data
     */
    OAuth.prototype.authorize = function(request, token) {
    	
    	request.options.timestamp = (request.options && request.options.timestamp) ? request.options.timestamp : this.getTimeStamp();
    	request.options.nounce = (request.options && request.options.nounce) ? request.options.nounce : this.getNonce();
    	
    	
        var oauth_data = {
            oauth_consumer_key: this.consumer.key,
            oauth_nonce: request.options.nounce,
            oauth_signature_method: this.signature_method,
            oauth_timestamp: request.options.timestamp,
            oauth_version: this.version
        };

        if(!token) {
            token = {};
        }

        if(token.key) {
            oauth_data.oauth_token = token.key;
        }

        if(!request.data) {
            request.data = {};
        }

        if (request.options.basestring_target == "restlet")
        {
        	oauth_data.oauth_signature = this.getSignature(request, token.secret, oauth_data);
    	}
        else if(request.options.basestring_target == "webservice")
        {
        	oauth_data.oauth_webservice_signature = this.getWebServiceSignature(request, oauth_data);
        	auth.webservice_signature = oauth_data.oauth_webservice_signature;
        }
        //throw oauth_data.oauth_webservice_signature;
        return oauth_data;
    };

    /**
     * Create a OAuth Signature
     * @param  {Object} request data
     * @param  {Object} token_secret key and secret token
     * @param  {Object} oauth_data   OAuth data
     * @return {String} Signature
     */
    OAuth.prototype.getSignature = function(request, token_secret, oauth_data) {
        return this.hash_function(this.getBaseString(request, oauth_data), this.getSigningKey(token_secret));
    };
    
    OAuth.prototype.getWebServiceSignature = function(request, oauth_data) {
    	var signing_key=request.options.secret.consumer.secret + "&" + request.options.secret.token.secret;
    	
    	var basestring = this.getWebServiceBaseString(request, oauth_data);
    	//throw basestring;
    	
    	var hash_result = this.hash_function(basestring, signing_key); 
    	return hash_result;
    };
    
    
    OAuth.prototype.getWebServiceBaseString = function(request, oauth_data) 
    {
    	var baseString = request.options.secret.realm + '&' + this.percentEncode(request.options.secret.consumer.public) + '&' + this.percentEncode(request.options.secret.token.public) + '&' + this.percentEncode(request.options.nounce) + '&' + this.percentEncode(request.options.timestamp); 
    	return baseString; 
    };

    /**
     * Base String = Method + Base Url + ParameterString
     * @param  {Object} request data
     * @param  {Object} OAuth data
     * @return {String} Base String
     */
    OAuth.prototype.getBaseString = function(request, oauth_data) {
        return request.method.toUpperCase() + '&' + this.percentEncode(this.getBaseUrl(request.url)) + '&' + this.percentEncode(this.getParameterString(request, oauth_data));
    };

    /**
     * Get data from url
     * -> merge with oauth data
     * -> percent encode key & value
     * -> sort
     *
     * @param  {Object} request data
     * @param  {Object} OAuth data
     * @return {Object} Parameter string data
     */
    OAuth.prototype.getParameterString = function(request, oauth_data) {
        var base_string_data = this.sortObject(this.percentEncodeData(this.mergeObject(oauth_data, this.mergeObject(request.data, this.deParamUrl(request.url)))));

        var data_str = '';

        //base_string_data to string
        for(var key in base_string_data) {
            var value = base_string_data[key];
            // check if the value is an array
            // this means that this key has multiple values
            if (value && Array.isArray(value)){
                // sort the array first
                value.sort();

                var valString = "";
                // serialize all values for this key: e.g. formkey=formvalue1&formkey=formvalue2
                value.forEach((function(item, i){
                    valString += key + '=' + item;
                    if (i < value.length){
                        valString += "&";
                    }
                }).bind(this));
                data_str += valString;
            } else {
                data_str += key + '=' + value + '&';
            }
        }

        //remove the last character
        data_str = data_str.substr(0, data_str.length - 1);
        return data_str;
    };

    /**
     * Create a Signing Key
     * @param  {String} token_secret Secret Token
     * @return {String} Signing Key
     */
    OAuth.prototype.getSigningKey = function(token_secret) {
        token_secret = token_secret || '';

        if(!this.last_ampersand && !token_secret) {
            return this.percentEncode(this.consumer.secret);
        }

        return this.percentEncode(this.consumer.secret) + '&' + this.percentEncode(token_secret);
    };

    /**
     * Get base url
     * @param  {String} url
     * @return {String}
     */
    OAuth.prototype.getBaseUrl = function(url) {
        return url.split('?')[0];
    };

    /**
     * Get data from String
     * @param  {String} string
     * @return {Object}
     */
    OAuth.prototype.deParam = function(string) {
        var arr = string.split('&');
        var data = {};

        for(var i = 0; i < arr.length; i++) {
            var item = arr[i].split('=');

            // '' value
            item[1] = item[1] || '';

            data[item[0]] = decodeURIComponent(item[1]);
        }

        return data;
    };

    /**
     * Get data from url
     * @param  {String} url
     * @return {Object}
     */
    OAuth.prototype.deParamUrl = function(url) {
        var tmp = url.split('?');

        if (tmp.length === 1)
            return {};

        return this.deParam(tmp[1]);
    };

    /**
     * Percent Encode
     * @param  {String} str
     * @return {String} percent encoded string
     */
    OAuth.prototype.percentEncode = function(str) {
        return encodeURIComponent(str)
            .replace(/\!/g, "%21")
            .replace(/\*/g, "%2A")
            .replace(/\'/g, "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29");
    };

    /**
     * Percent Encode Object
     * @param  {Object} data
     * @return {Object} percent encoded data
     */
    OAuth.prototype.percentEncodeData = function(data) {
        var result = {};

        for(var key in data) {
            var value = data[key];
            // check if the value is an array
            if (value && Array.isArray(value)){
                var newValue = [];
                // percentEncode every value
                value.forEach((function(val){
                    newValue.push(this.percentEncode(val));
                }).bind(this));
                value = newValue;
            } else {
                value = this.percentEncode(value);
            }
            result[this.percentEncode(key)] = value;
        }

        return result;
    };

    /**
     * Get OAuth data as Header
     * @param  {Object} oauth_data
     * @return {String} Header data key - value
     */
    OAuth.prototype.toHeader = function(options, oauth_data) {
        oauth_data = this.sortObject(oauth_data);

        var header_value = 'OAuth ';

        if (this.realm) {
            header_value += this.percentEncode('realm') + '="' + this.percentEncode(this.realm) + '"' + this.parameter_seperator;
        }

        for(var key in oauth_data) {
            if (key.indexOf('oauth_') === -1)
            {
                continue;
            }
            if (key === "oauth_consumer_key")
        	{
        		this.consumerkey = this.percentEncode(oauth_data[key]);
        		//throw JSON.stringify(this);
        	}
            if (key === "oauth_nonce")
        	{
        		this.nonce = this.percentEncode(oauth_data[key]);
        	}
            if (key === "oauth_timestamp")
        	{
        		this.timestamp = this.percentEncode(oauth_data[key]);
        	}
            if (key === "oauth_signature")
        	{
        		this.signature = this.percentEncode(oauth_data[key]);
        	}
            if (key === "oauth_token")
        	{
        		this.token = this.percentEncode(oauth_data[key]);
        	}
            if (key === "realm")
        	{
        		this.realm = this.percentEncode(oauth_data[key]);
        	}
            header_value += this.percentEncode(key) + '="' + this.percentEncode(oauth_data[key]) + '"' + this.parameter_seperator;
        }

//        return (options.basestring_target == "restlet") ? {
//            Authorization: header_value.substr(0, header_value.length - this.parameter_seperator.length) //cut the last chars
//        } : {};
        
        
        return {
            Authorization: header_value.substr(0, header_value.length - this.parameter_seperator.length) //cut the last chars
        };
        
    };

    /**
     * Create a random word characters string with input length
     * @return {String} a random word characters string
     */
    OAuth.prototype.getNonce = function() {
        var word_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var result = '';

        for(var i = 0; i < this.nonce_length; i++) {
            result += word_characters[parseInt(Math.random() * word_characters.length, 10)];
        }

        return result;
    };

    /**
     * Get Current Unix TimeStamp
     * @return {Int} current unix timestamp
     */
    OAuth.prototype.getTimeStamp = function() {
        return parseInt(new Date().getTime()/1000, 10);
    };

    ////////////////////// HELPER FUNCTIONS //////////////////////

    /**
     * Merge object
     * @param  {Object} obj1
     * @param  {Object} obj2
     * @return {Object}
     */
    OAuth.prototype.mergeObject = function(obj1, obj2) {
        obj1 = obj1 || {};
        obj2 = obj2 || {};

        var merged_obj = obj1;
        for(var key in obj2) {
            merged_obj[key] = obj2[key];
        }
        return merged_obj;
    };

    /**
     * Sort object by key
     * @param  {Object} data
     * @return {Object} sorted object
     */
    OAuth.prototype.sortObject = function(data) {
        var keys = Object.keys(data);
        var result = {};

        keys.sort();

        for(var i = 0; i < keys.length; i++) {
            var key = keys[i];
            result[key] = data[key];
        }

        return result;
    };

    function getQueryParams(url) {
        if (typeof url !== 'string') {
            throw TypeError("getQueryParams requires a String argument.")
        }

        var paramObj = {};

        if (url.indexOf('?') === -1) {
            return paramObj;
        }

        // Trim any anchors
        url = url.split('#')[0];

        var queryString = url.split('?')[1];
        var params = queryString.split('&');
        for (var i in params) {
            var paramString = params[i];
            var keyValuePair = paramString.split('=');
            var key = keyValuePair[0];
            var value = keyValuePair[1];

            if (key in paramObj) {
                if (typeof paramObj[key] === 'string') {
                    paramObj[key] = [paramObj[key]]
                }
                paramObj[key].push(value);
            } else {
                paramObj[key] = value;
            }
        }
        return paramObj;
    }

    //these are for something else. Netsuite help with answer id Answer Id: 44241 
    //seems to be misleading. Issue appears to be that 44241 works with utf8 which
    //proudces signature duble the size length of the one restlet singature 
    
//    function hash_function_sha1_webservice(base_string, key) {
//		
//		var result =  cryptojs.HmacSHA1(base_string, key).toString();
//		
//		var encryptedWord = cryptojs.enc.Utf8.parse(result);
//		var encrypted = cryptojs.enc.Base64.stringify(encryptedWord);
//		
//		return encrypted;
//	}
//    function hash_function_sha256_webservice(base_string, key) {
//		
//		var result =  cryptojs.HmacSHA256(base_string, key).toString();
//		
//		var encryptedWord = cryptojs.enc.Utf8.parse(result);
//		var encrypted = cryptojs.enc.Base64.stringify(encryptedWord);
//		
//		return encrypted;
//	}
    
	function hash_function_sha1(base_string, key) {
		return cryptojs.HmacSHA1(base_string, key).toString(cryptojs.enc.Base64);
	}

	function hash_function_sha256(base_string, key) 
	{		
		return cryptojs.HmacSHA256(base_string, key).toString(cryptojs.enc.Base64);
	}

	function get_hashfunction(options)
	{
		var retvalue = null; 
//		if (options.basestring_target === "restlet")
//		{
			if (options.hash_algorithm === "HMAC-SHA1")
			{
				retvalue = hash_function_sha1;	
			}
			else if (options.hash_algorithm === "HMAC-SHA256")
			{
				retvalue = hash_function_sha256
			}
				
//		}
//		else if (options.basestring_target === "webservice")
//		{
//			if (options.hash_algorithm === "HMAC-SHA1")
//			{
//				//retvalue = hash_function_sha1_webservice;
//				retvalue = hash_function_sha1;
//			}
//			else if (options.hash_algorithm === "HMAC-SHA256")
//			{
//				//retvalue = hash_function_sha256_webservice
//				retvalue = hash_function_sha256;
//			}
//			
//		}
		if (!retvalue)
		{
			throw "Hash Function has not been defined for " + options.basestring_target + ":" + options.hash_algorithm;  
		}
		return retvalue;
	}
	function getOAuthDetail()
	{
		return {
			consumerkey : auth.consumerkey,
			timestamp : auth.timestamp,
			nonce : auth.nonce,
			token : auth.token,
			signature : auth.signature,
			realm : auth.realm,
			webservice_signature : auth.webservice_signature
		}
	}
	function getHeaders(options) 
	{
		
		
		
		
		var data = null;
		auth = OAuth({
			realm: options.secret.realm,
			consumer: {
				key: options.secret.consumer.public,
				secret: options.secret.consumer.secret
			},
			signature_method: (options.hash_algorithm === "HMAC-SHA1") ? "HMAC-SHA1" : "HMAC-SHA256",
			hash_function: get_hashfunction(options)
		});
		
		if (options.method.toUpperCase() === 'GET') 
		{
			data = getQueryParams(options.url);
		}

		var requestData = 
		{
			url: options.url,
			method: options.method,
			data: data
		};
		requestData.options = options;
		
		var token = {
			key: options.secret.token.public,
			secret: options.secret.token.secret
		};
		return auth.toHeader(options, auth.authorize(requestData, token));
	}

    return {
        getHeaders: getHeaders,
        getOAuthDetail : getOAuthDetail
    }

});
