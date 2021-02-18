/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *
 * This suitelet is a container for a collection of server side functions
 * which can be called from a client and specified with the action parameter.
 */
define(['N/record' ,'N/search' ,'N/file' ,'N/redirect'
       ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
       ,'/.bundle/132118/PRI_ShowMessageInUI'
       ],

    function(record ,search ,file ,redirect
    		,tools
    		,priMessage
    		) {

        var scriptName = "generalUtilitiesSL.js";
        var funcName;

        function onRequest(context) {
            funcName = scriptName + ".onRequest ";
            log.debug(funcName, "Starting: " + JSON.stringify(context.request.parameters));
            var action = context.request.parameters.action || "";
            funcName += " action=" + action;
            var result = {};
            var options = {};

      
            log.audit(funcName, action);
            try {
                switch (action.toLowerCase()) {
            		//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++    
                	case "downloadpaymentfile":
            			downloadPaymentFile(context);
                    break;
            		//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++    
                	case "paymentfiledeliverycomplete":
            			paymentFileDeliveryComplete(context);
                    break;
                	//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++    
                    case "seteventorganizer":
                        try
                        {
                            var eventId = context.request.parameters.eventId;
                            var userId = context.request.parameters.userId;
                            result = setEventOrganizer(eventId, userId);
                            log.debug(funcName, "result: " + JSON.stringify(result));

                        } catch (e) {
                            log.error(funcName, e);
                            if (e.message)
                            {
                                priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                            }
                            else
                            {
                                priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                            }
                        }
                        break;
                    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++    
                    default:
                    	log.error(funcName, "Error: 'action' parameter specified an action that is not defined in this suitelet: " + action);
                }

            } 
            catch (e) { log.error(funcName, e); }

        } //function onRequest

        //====================================================================================================================
        //====================================================================================================================
        function paymentFileDeliveryComplete(context) {
		    paymentFileCreationId      = context.request.parameters.recordId;
		    if (!paymentFileCreationId) { throw "recordId parameter missing"; }
		    
	        var objValues = {};
    		var deliveryStatus_complete = 3;
		    objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_complete;
			objValues["custrecord_pay_file_deliv_user"]       = context.request.parameters.userid; 
			objValues["custrecord_pay_file_deliv_datetime"]   = new Date(); 
	        record.submitFields({ type:"customrecord_payment_file" ,id:paymentFileCreationId ,values:objValues });						
        	
			redirect.toRecord({ type:"customrecord_payment_file" ,id:paymentFileCreationId ,parameters:{ rejectEdit:true } });
	        
        }

        //====================================================================================================================
        //====================================================================================================================
        function downloadPaymentFile(context) {
    		try {
    		    paymentFileCreationId      = context.request.parameters.recordId;
    		    if (!paymentFileCreationId) { throw "recordId parameter missing"; }
    			var objPaymentFileCreationFields = search.lookupFields({type:'customrecord_payment_file' ,id:paymentFileCreationId
    		                                                        ,columns:["custrecord_pay_file_linktofile" 
    		     	                                                         ]});
        	    var paymentFile = file.load({id: objPaymentFileCreationFields.custrecord_pay_file_linktofile[0].value});
    	        if (paymentFile && paymentFile.fileType) {
    	        	noteText = "File " + paymentFile.name + " downloaded";
    				tools.addUserNote(paymentFileCreationId ,"customrecord_payment_file" ,"Payment File Downloaded" ,noteText ,7 ,funcName)
    	            objValues = {};
    	            var deliveryStatus_downloaded = 6;
    	            objValues["custrecord_pay_file_deliv_status"]     = deliveryStatus_downloaded;
    				objValues["custrecord_pay_file_deliv_user"]       = context.request.parameters.userid; 
    				objValues["custrecord_pay_file_deliv_datetime"]   = new Date(); 
    	            record.submitFields({ type:"customrecord_payment_file" ,id:paymentFileCreationId ,values:objValues });
    	            
    	            switch (paymentFile.fileType) 
    	            {
            			case "PDF":
            				context.response.setHeader({name: "Content-Type", value: "application/pdf"});
            				break;
	                    default:
	                    	context.response.setHeader({name: "Content-Type", value: "text/csv"});
	    	            
    	            }
    	            context.response.setHeader({name: 'Content-Disposition', value: 'attachment; filename=' + paymentFile.name});
    	            context.response.write(paymentFile.getContents());
    	            context.response.end();
    	        }
    			log.audit(funcName, "File downloaded: " + objPaymentFileCreationFields.custrecord_pay_file_linktofile[0].text);
    		} 
    		catch (e) { log.error(funcName, e); }
        	
        }

        //====================================================================================================================
        //====================================================================================================================
        function setEventOrganizer(eventId, userId) {
            log.debug('setEventOrganizer');
            var message = '';

            try {
                 var id = record.submitFields({
                     type: 'calendarevent',
                     id: eventId,
                     values:    {   
                                    'organizer': userId
                                }
                 });
                message += 'Organizer changed to ' + userId + '.<br>';
                success = true;
            } catch (e) {
                 log.debug('setEventOrganizer', 'e: ' + JSON.stringify(e));
                 message += 'Failed to set Organizer to current user.<br>';
                 success = false;
            }

            return {
                "success": success,
                "message": message
            };
        }

        //====================================================================================================================
        //====================================================================================================================
        return {
            onRequest: onRequest
        };
});
