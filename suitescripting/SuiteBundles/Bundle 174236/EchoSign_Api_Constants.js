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


EchoSign.APIConstants = (function() { 

    return { // public members
	
			STATUS: 
			{
			
				OK : 200,
		
				CREATED : 201,
			
				ACCEPTED : 202,
			
				NO_CONTENT : 204,
			
				MOVED_PERMANENTLY : 301,
			
				SEE_OTHER : 303,
				
				NOT_MODIFIED : 304,
				
				TEMPORARY_REDIRECT : 307,
				
				BAD_REQUEST : 400,
				
				UNAUTHORIZED : 401,
				
				FORBIDDEN : 403,
				
				USER_ALREADY_EXISTS : 409,
				
				INVALID_ACCESS_TOKEN : 401
			},
			MIME_TYPE:
			{
				JSON: 'application/json',
				PLAINTEXT: 'text/plain',
			},
			
			MAX_ECHOSIGN_API_RETRY_COUNT : 1,
			
			ESIGN_API_CLIENT_ID: 'NetSuite_4.0.0'
    };
})();