/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/email', 'N/error', 'N/search', 'N/file', 'N/record', 'N/runtime', 'N/transaction' ,'N/ui/serverWidget' ,'N/https' ,'N/task' ,'N/format'
    ,'/SuiteScripts/Pristine/libraries/TINCheckLibrary.js'
	,'/.bundle/132118/PRI_AS_Engine'
    ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	    ],
/**
 * @param {email} email
 * @param {error} error
 * @param {file} file
 * @param {record} record
 * @param {runtime} runtime
 * @param {transaction} transaction
 */

function(email, error, search, file, record, runtime, transaction ,ui ,https ,task ,format ,tinCheck ,appSettings ,srsConstants ) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    
	var scriptFileName = "TINCheck_UE.js";
	
	
	/*========================================================================================================================================*/
    /*========================================================================================================================================*/
    function beforeLoad(context) {
    	
    	var scriptFunctionName = "beforeLoad";
    	var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
    	log.debug(scriptFullName, "========================================================================");
    	log.debug(scriptFullName, "========================================================================");
    	log.debug(scriptFullName, "UserEventType: " + context.type);
   
    	
        // ATO-54
    	var userObj = runtime.getCurrentUser();
    	log.debug(scriptFullName, "role:" + userObj.role );
    	if (  userObj.role == srsConstants.USER_ROLE.ADMINISTRATOR  ) {
    		var field = context.form.getField("custrecord_duplicated_tin_chk_record");
    		if (field) { field.updateDisplayType({ displayType:ui.FieldDisplayType.NORMAL }); log.debug(scriptFullName, "==="); }
    	} // END ATO-54
    	
    	return;
    	
    } // beforeLoad(context)

    
    
    
    /*========================================================================================================================================*/
    /*========================================================================================================================================*/
    function beforeSubmit(context) {
    	
    	var scriptFunctionName = "beforeSubmit";
    	var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
    	
    	log.debug(scriptFullName, "========================================================================");
    	log.debug(scriptFullName, "========================================================================");
    	log.debug(scriptFullName, "UserEventType: " + context.type);
    	
    	if (context.type == context.UserEventType.CREATE) {
    		var hash = tinCheck.getRequestHash(null ,context.newRecord);
    		context.newRecord.setValue("custrecord_tinchk_req_hash" ,hash);
    		
    		if (context.newRecord.getValue("custrecord_tinchk_notif_sts") == null) {		
    			if (context.newRecord.getValue("custrecord_tinchk_trg_sys") > "") 
    			     { context.newRecord.setValue("custrecord_tinchk_notif_sts" ,tinCheck.objNotificationStatus.Pending); }
    			else { context.newRecord.setValue("custrecord_tinchk_notif_sts" ,tinCheck.objNotificationStatus.NotApplicable); }
    		}
    	}

    	if (context.type == context.UserEventType.EDIT) {
    		var UserId = runtime.getCurrentUser().id;
//    		if (UserId == 1015772){
//        		var hash = tinCheck.getRequestHash(null ,context.newRecord);
//        		context.newRecord.setValue("custrecord_tinchk_req_hash" ,hash);
//    		}
//        	log.debug(scriptFullName, "custrecord_tinchk_req_sts: " + context.newRecord.getValue("custrecord_tinchk_req_sts") 
//        			+ ",     custrecord_tinchk_notif_sts:" + context.newRecord.setValue("custrecord_tinchk_notif_sts" ,5));
    		if (context.newRecord.getValue("custrecord_tinchk_req_sts") != context.oldRecord.getValue("custrecord_tinchk_req_sts") ) { 
        		if (context.newRecord.getValue("custrecord_tinchk_req_sts") == tinCheck.objRequestStatus.Canceled) {	// If Request Status cancelled then set Notify Status to cancelled	
        			log.debug(scriptFullName, "changed " );
        			context.newRecord.setValue("custrecord_tinchk_notif_sts" ,tinCheck.objNotificationStatus.Canceled);
        		}
        		else if (context.newRecord.getValue("custrecord_tinchk_req_sts" ) == tinCheck.objRequestStatus.Pending) {        			
        			if (context.newRecord.getValue("custrecord_tinchk_trg_sys" ) > "") 
        			     { context.newRecord.setValue("custrecord_tinchk_notif_sts" ,tinCheck.objNotificationStatus.Pending); }
        			else { context.newRecord.setValue("custrecord_tinchk_notif_sts" ,tinCheck.objNotificationStatus.NotApplicable); }
        		}
    		}
    	}
    	
    	if ( context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT ) {
    		var newStatus;
    		if ( context.type == context.UserEventType.XEDIT ) {
				if (context.newRecord.getFields().indexOf("custrecord_tinchk_req_sts") >= 0) 
				     { newStatus = context.newRecord.getText("custrecord_tinchk_req_sts"); }
				else { newStatus = context.oldRecord.getText("custrecord_tinchk_req_sts"); }
    		}
    		else     { newStatus = context.newRecord.getText("custrecord_tinchk_req_sts"); }
        	var oldStatus = context.oldRecord.getText("custrecord_tinchk_req_sts");
        	log.debug(scriptFullName, "newStatus: " + newStatus + ",   oldStatus: " + oldStatus);
        		
        	if (newStatus != oldStatus) {        		
        		if (newStatus == "Processed" && oldStatus == "Pending") {
        	    	context.newRecord.setValue("custrecord_tinchk_req_processed_ts" ,new Date());
        		}  // if (newStatus == "Processed" && oldStatus == "Pending")
        	} // if (newStatus != oldStatus)
     	
    	} // if ( context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT )

    	
    	return;
    	
    } // beforeSubmit(context)


    
    
    /*========================================================================================================================================*/
    /*========================================================================================================================================*/
    function afterSubmit(context) {
    	var scriptFunctionName = "afterSubmit";
    	var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
   	
    	log.debug(scriptFullName, "========================================================================");
    	log.debug(scriptFullName, "========================================================================");
    	log.debug(scriptFullName, "UserEventType: " + context.type + ",   context.newRecord.id: " + context.newRecord.id);

    	if (context.type == context.UserEventType.CREATE) {
    		
//    		var submitTinCheck = true;
//        	if ( !(   (   context.newRecord.getValue("custrecord_acq_loth_2_de1_ssnein")  > ""
//	                   && context.newRecord.getValue("custrecord_acq_loth_2_de1_irsname") > "" )  
//		           || ( context.newRecord.getValue("custrecord_exrec_giin") > ""                )      )   ) 
//	        { submitTinCheck = false; }
//    		
//    		if (submitTinCheck == false) {  
//                incompleteDataError = error.create({
//                    name: 'TINCHECK_DATA_INCOMPLETE',
//                    message: 'TIN Check data is incomplete, minimum required data is not present. ',
//                    notifyOff: true
//                });
//                throw incompleteDataError.name + ': ' + incompleteDataError.message;
//    		}
    		
    		
    		// If someone creates a TIN Check record schedule the Q Servicer script.
    		// If the Q Servicer is already running we the schedule attempt may fail
    		// We will ignore that failure and the servicer will eventually pickup and process the record
    		var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});
    		scriptTask.scriptId = "customscript_tinchk_q_servicer";
    		try { var scriptTaskId = scriptTask.submit(); } catch(e) { log.audit(scriptFullName, "TIN Check Queue Servicer submit failed " ); }
    	}
    	
    	if ( context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT ) {
    		var newStatus;
    		if ( context.type == context.UserEventType.XEDIT ) {
				if (context.newRecord.getFields().indexOf("custrecord_tinchk_req_sts") >= 0) 
				     { newStatus = context.newRecord.getText("custrecord_tinchk_req_sts"); }
				else { newStatus = context.oldRecord.getText("custrecord_tinchk_req_sts"); }
    		}
    		else     { newStatus = context.newRecord.getText("custrecord_tinchk_req_sts"); }
        	
    		
//    		if (   newStatus == "Invoking"
//    			|| newStatus == "Deferred"
//    			|| newStatus == "Requested"
//    			|| newStatus == "Scheduled" ) {
//    			
//        		var submitTinCheck = true;
//            	if ( !(   (   context.newRecord.getValue("custrecord_acq_loth_2_de1_ssnein")  > ""
//    	                   && context.newRecord.getValue("custrecord_acq_loth_2_de1_irsname") > "" )  
//    		           || ( context.newRecord.getValue("custrecord_exrec_giin") > ""                )      )   ) 
//    	        { submitTinCheck = false; }
//        		
//        		if (submitTinCheck == false) {  
//                    incompleteDataError = error.create({
//                        name: 'TINCHECK_DATA_INCOMPLETE',
//                        message: 'TIN Check data is incomplete, minimum required data is not present. ',
//                        notifyOff: true
//                    });
//                    throw incompleteDataError.name + ': ' + incompleteDataError.message;
//        		}
//    		}
    		
        	var oldStatus = context.oldRecord.getText("custrecord_tinchk_req_sts");
        	log.debug(scriptFullName, "newStatus: " + newStatus + ",   oldStatus: " + oldStatus);
        		
        	if (newStatus != oldStatus) {        		
        		if (newStatus == "Processed" && oldStatus == "Pending") {
        	    	log.debug(scriptFullName, "Queueing Target Notify ");
        	    	if (context.newRecord.getValue("custrecord_tinchk_trg_sys") > "") {
        	    		if (context.newRecord.getValue("custrecord_tinchk_trg_id") > "") { 
                			tinCheck.notifyTargetAddToQueue(context.newRecord);
        	    		}
        	    	}
        		}  // if (newStatus == "Processed" && oldStatus == "Pending")
        		else 
        		if (newStatus == "Duplicate") {
        			try {
            			duplcateTinCheckProcessing(context);
        			} 
        			catch(e){
        				log.error(scriptFullName ,"Exception in duplcateTinCheckProcessing: " + e.message );
        			}
        		}  // if (newStatus == "Duplicate")	
        	}
     	
    	} // if(context.type == context.UserEventType.EDIT)
     	
     	
    } // afterSubmit(context)
    
    
    /*========================================================================================================================================*/
    /*========================================================================================================================================*/
    function duplcateTinCheckProcessing(context) {
    	var scriptFunctionName = "duplcateTinCheckProcessing";
    	var scriptFullName = scriptFileName + "--->" + scriptFunctionName;
    	log.debug(scriptFullName ,"started ");
    	 
    	var arrFieldsToCopy = JSON.parse( appSettings.readAppSetting("TIN Check", "TINCHK Duplicate Request Fields To Copy") ); 
    	var objFieldsAndValues = {};
    	
		var objTinCheckFields = search.lookupFields({type:'customrecord_tin_check' ,id:context.newRecord.id ,columns: ["custrecord_duplicated_tin_chk_record"]});
        var str1 = JSON.stringify(objTinCheckFields);
		log.debug(scriptFullName ,"objTinCheckFields: " + str1 );
    	log.debug(scriptFullName ,"custrecord_duplicated_tin_chk_record: " + objTinCheckFields.custrecord_duplicated_tin_chk_record[0].value );
 	    var rcdMatchedTinCheck  = record.load({type:'customrecord_tin_check' ,id:objTinCheckFields.custrecord_duplicated_tin_chk_record[0].value });
    	
    	for (var ix=0; ix<arrFieldsToCopy.length; ix++) {
    		var objFieldToCopy = arrFieldsToCopy[ix];
    		if (objFieldToCopy.isDatetime) { 
    			var dateTime = rcdMatchedTinCheck.getValue( objFieldToCopy.fieldName );
    			var dateTimeString = format.format({ value:dateTime ,type:format.Type.DATETIME });
    			objFieldsAndValues[objFieldToCopy.fieldName] = dateTimeString; 
    			}
    		else 
    		if (objFieldToCopy.isDate) {
    			var date = rcdMatchedTinCheck.getValue( objFieldToCopy.fieldName );
    			var dateString = format.format({ value:dateTime ,type:format.Type.DATE });
    			objFieldsAndValues[objFieldToCopy.fieldName] = dateString; 
    			}
    		else { objFieldsAndValues[objFieldToCopy.fieldName] = rcdMatchedTinCheck.getValue( objFieldToCopy.fieldName ); }
    		
    	}
    	
    	var str1 = JSON.stringify(objFieldsAndValues);
    	log.debug(scriptFullName ,"objFieldsAndValues: " + str1);

    	log.debug(scriptFullName ,"context.newRecord.id: " + context.newRecord.id );
		record.submitFields({ type:'customrecord_tin_check' ,id:context.newRecord.id ,values:objFieldsAndValues });
    	
    	if (context.newRecord.getValue("custrecord_tinchk_trg_sys") > "") {
    		if (context.newRecord.getValue("custrecord_tinchk_trg_id") > "") { 
    		   	tinCheck.notifyTargetAddToQueue(context.newRecord);
    		}
    	}
    	
    }
    
    
    /*========================================================================================================================================*/
    /*========================================================================================================================================*/
    return {
          beforeLoad: beforeLoad,
          beforeSubmit: beforeSubmit
         ,afterSubmit: afterSubmit
    };
    
});