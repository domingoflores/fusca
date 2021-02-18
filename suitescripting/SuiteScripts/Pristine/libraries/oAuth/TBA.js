//------------------------------------------------------------------
// Copyright 2015-2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------
/**
 * TBA.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * Functions needed for TBA
 */

define(['N/search', 'N/https', 'N/url', 'N/record', "N/runtime"
       , "./PRI_oAuth"
       ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
       ,'/.bundle/132118/PRI_AS_Engine'
	   ],

	function (search, https, url, record, runtime
			,oauth 
			,srsConstants
			,appSettings
			 ) {
		var scriptName = "TBA.js";
	
		function formatResponse(clientResponse)
		{
			var retValue = "";
			if (clientResponse && isJSONString(clientResponse.body))
	        {
				retValue = JSON.stringify(JSON.parse(clientResponse.body), null, "\t");
	        }
	        else 
	        {
	        	retValue = (clientResponse && clientResponse.body)||"";
	        }
			return retValue;
		}
	
		function isJSONString (str) 
		{
			var retvalue = false; 
			try
			{
			   var json = JSON.parse(str);
			   retvalue = true; 
			}
			catch(e)
			{
			   ;
			   //invalid json 
			}
			return retvalue; 
		}
		
	    function getDataCenterURLs(account)
	    {
	    	if (!account)
	    	{
	    		throw "Account not specified ";
	    	}
	    	var getResponse = https.get({url: srsConstants.DATACENTER_URLS + account});
			log.debug("getResponse", getResponse.body);	
			return JSON.parse(getResponse.body);
	    }
	    function Call(request_options, tba_options) 
        {
			//reference your RESTlet
			
	    	//throw "consumer " + appSettings.readAppSetting("General Settings", "Restlet TBA SRS Consumer Token");
	    	
	    	var secret = {
					name : runtime.accountId,
					consumer: JSON.parse(appSettings.readAppSetting("General Settings", "Restlet TBA SRS Consumer Token")),
			        token: tba_options.access_token,
			        realm: runtime.accountId
			    };

			var datacenterURLs = getDataCenterURLs(secret.realm);
			//throw "request_options " + JSON.stringify(request_options);
		    var options = {
			        url: datacenterURLs.restDomain +  url.resolveScript({
			        	scriptId : tba_options.restlet_scriptid,
	    				deploymentId : tba_options.restlet_deployid
					}),
			        method: "POST",
			        secret: secret,
//			        timestamp : 1433763248,	//use this to pass in know values and evaluate output
//			        nounce: "SzKHYlAxGy1fOshMb4cl",			//use this to pass in know values and evaluate output
			        hash_algorithm: "HMAC-SHA256",
			        basestring_target : "restlet"
			    }
		    
		    var headers = oauth.getHeaders(options);
		    var detailjson = detailjson = oauth.getOAuthDetail(); 
			var signature = headers.Authorization;
		    
		    var headers = {};
			headers["Content-Type"] = "application/json";
	   		headers["Authorization"] = signature;
			
	   		//throw "options.url" + JSON.stringify(headers);
	   		
	   		clientResponse = https.post({
                url : options.url,
                headers : headers,
                body : JSON.stringify(request_options)
              });
	   		
	   		//throw "clientResponse " + JSON.stringify(clientResponse);
	   		
	   		return formatResponse(clientResponse);
		    
        }
		return {
			Call : Call
		};
	});