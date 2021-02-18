/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/runtime'],
    function(runtime) {
        function onRequest(context) 
        {
        	var msg = "";
        	
        	if (context.request.method === 'GET') 
            {
        		if (!context.request.parameters.ID)
            	{
            		msg = msg + "ID parameter is required.\n";
            	}
            	if (!context.request.parameters.profileID)
            	{
            		msg = msg + "profileID parameter is required.\n";
            	}
            	if (!context.request.parameters.status)
            	{
            		msg = msg + "status parameter is required.\n";
            	}
        		if (msg)
            	{
            		context.response.write(msg);
            	}
        		else 
        		{
        			context.response.write("Profile ID: " + context.request.parameters.profileID + "\n");
        			context.response.write("ID: " + context.request.parameters.ID+ "\n");
        			context.response.write("Status: " + context.request.parameters.status+ "\n");
        			
        			log.debug("Profile ID ", context.request.parameters.profileID);
        			log.debug("ID ", context.request.parameters.ID);
        			log.debug("Status ", context.request.parameters.status);
        			log.debug("Data ", context.request.parameters.data);
        			
        		}
            } 
            else if (context.request.method === 'POST')
            {
            	context.response.write("Post Request");
            	
            }
        }
        return {
            onRequest: onRequest
        };
    });