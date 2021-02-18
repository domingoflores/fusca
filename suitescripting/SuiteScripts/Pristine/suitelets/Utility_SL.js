//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 *
 * This suitelet is a container for a collection of server side functions
 * which can be called from a client and specified with the action parameter.
 *
 * 2019-12 Modified as part of ticket ATP-1350 by Ken C
 *
 */
define(['N/record' ,'N/runtime' ,'N/search' ,'N/task'
         ,'/.bundle/132118/PRI_AS_Engine'
         ,'/.bundle/132118/PRI_ShowMessageInUI'
         ,'/SuiteScripts/Pristine/libraries/voidTrackingLibrary.js'
	],    //  
    function(record ,runtime ,search ,task
                ,appSettings
                ,priMessage
                ,vtLib
        ) {
     
        var scriptName = "Utility_SL.js";

       
        function onRequest(context) {
            funcName = scriptName + "-->onRequest ";
            log.debug(funcName, "Starting: " + JSON.stringify(context.request.parameters));
            var action = context.request.parameters.action || "";
        
            funcName += " action=" + action;
         
            var result = {};
            var voidRecords;
            
            try {
                switch (action.toLowerCase()) {
            		case "mapreducetaskstatus": //Only needed once
            			context.response.write(mapReduceTaskStatus(context));
            			break;
                    case "oneoffsetpaymentmethodonvoidtracking": //Only needed once
                        oneOffSetPaymentMethodOnVoidTracking(context);
                        break;
                    case "processvoidpayment":
                        processVoidPayment(context);
                        break;
                    case "processvoidpaymentfccpayment":
                        processVoidPaymentFCCPayment(context);
                        break;
                    case "mapreduceutilityfunctionsstart":
                    	context.response.write(mapReduceUtilityFunctionsStart(context));
                    	break;
                    default:
                        log.error(funcName, "Error: 'action' parameter specified an action that is not defined in this suitelet: " + action);
                    }
            } catch (e) { log.error(funcName, e); } 

       } // onRequest function
        
        
        //==================================================================================================================
        //==================================================================================================================
        function mapReduceTaskStatus(context) {
     	   var mapReduceStatus = task.checkStatus(context.request.parameters.taskID);
     	   log.debug("mapReduceTaskStatus","status: " + JSON.stringify(mapReduceStatus));
     	   return mapReduceStatus.status;
        }

        
        //==================================================================================================================
        //==================================================================================================================
       function mapReduceUtilityFunctionsStart(context) {
           var parmObjRequest     = context.request.parameters.objRequest;
           if (parmObjRequest == "objRequestInBody") { parmObjRequest = context.request.body }
           var parmFunctionName   = context.request.parameters.functionName;
           var parmScriptName     = context.request.parameters.scriptName;
           var parmRecordType     = context.request.parameters.recordType;
           var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
           mapReduceTask.scriptId     = 'customscript_utility_functions_mr';
           mapReduceTask.params       = { 'custscript_mr_uf_json_object'       : parmObjRequest
										 ,'custscript_mr_uf_function'          : parmFunctionName
										 ,'custscript_mr_uf_callingscript'     : parmScriptName
										 ,'custscript_mr_uf_record_type'       : parmRecordType
					                    };
           var mapReduceTaskId = mapReduceTask.submit();
           var returnValue = '{"mapReduceTaskId":"{0}"}'.replace("{0}",mapReduceTaskId);
           log.debug(funcName ,"returnValue: " + returnValue);
           return returnValue;
       }

        
        //==================================================================================================================
        //==================================================================================================================
       function oneOffSetPaymentMethodOnVoidTracking(context) {
        // Remove this function after it has been run the first time - no need to keep
           try {
                voidRecords = getAllVoidRecords();
                log.audit(funcName, 'voidRecords count: ' + JSON.stringify(voidRecords.length));
                log.audit(funcName, 'voidRecords: ' + JSON.stringify(voidRecords));
                var newPayMethod;
                for (var i = 0; i < voidRecords.length; i++) {
                    newPayMethod = voidRecords[i].getValue({
                        name: 'paymentmethod',
                        join: 'custrecord_vt_customer_refund'
                    });
                    // log.audit(funcName, 'newPayMethod: ' + newPayMethod);
                    record.submitFields({type: "customrecord_void_tracking", id: voidRecords[i].id, values: {"custrecord_vt_paymethod": newPayMethod}});
                }   

            } catch (e) {
                log.error(funcName, e);
                if (e.message) {
                    priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                } else {
                    priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                }
            }
       }

       
       //==================================================================================================================
       //==================================================================================================================
       function processVoidPayment(context) {
            try {
                var vtRecID = context.request.parameters.vtRecID;
                log.debug(funcName, "vtRecID: " + JSON.stringify(vtRecID));
                result = vtLib.processVoidPayment(vtRecID);
                log.debug(funcName, "result: " + JSON.stringify(result));
                if (result.success) {
                    priMessage.prepareMessage("Completed", result.voidActivity, priMessage.TYPE.CONFIRMATION);
                } else {
                    priMessage.prepareMessage('FAILED', result.voidActivity, priMessage.TYPE.WARNING);
                }
             
            } catch (e) {
                log.error(funcName, e);
                if (e.message)
                {
                    priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                } else {
                    priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                }
            }
            log.debug(funcName,'curr session: ' + runtime.getCurrentSession().get({name: "pri_msgTitle"}));
       }

       
       //==================================================================================================================
       //==================================================================================================================
       function processVoidPaymentFCCPayment(context) {
            try {
                var vtRecID = context.request.parameters.vtRecID;
                log.debug(funcName, "vtRecID: " + JSON.stringify(vtRecID));
                result = vtLib.processVoidPaymentFCCPayment(vtRecID);
                log.debug(funcName, "result: " + JSON.stringify(result));
                if (result.success) {
                    priMessage.prepareMessage("Completed", result.voidActivity, priMessage.TYPE.CONFIRMATION);
                } else {
                    priMessage.prepareMessage('FAILED', result.voidActivity, priMessage.TYPE.WARNING);
                }
             
            } catch (e) {
                log.error(funcName, e);
                if (e.message)
                {
                    priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
                } else {
                    priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
                }
            }
            log.debug(funcName,'curr session: ' + runtime.getCurrentSession().get({name: "pri_msgTitle"}));
       }

       
       //==================================================================================================================
       //==================================================================================================================
       function getAllVoidRecords() {

            var funcName = scriptName + "-->getAllVoidRecords";
            log.audit(funcName);
            var ss = search.create({
                type: "customrecord_void_tracking",
                filters: [
                       ["isinactive","is","F"]
                       ,"AND",["custrecord_vt_paymethod","anyof","@NONE@"]
                       ,"AND",["custrecord_vt_customer_refund.mainline","is","T"]
                       ],
                columns:
                      [search.createColumn({name: "paymentmethod",join: "custrecord_vt_customer_refund"})
                      ]
                }).run().getRange(0,1000);
                   
            return ss;     
        }

    return {
        onRequest : onRequest
    };
});