/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/error' ,'N/record' ,'N/runtime'
       ,'/.bundle/132118/PRI_AS_Engine'
   	   ,'/SuiteScripts/Pristine/libraries/toolsLibrary.js'
	],

    function(error ,record ,runtime 
    		,appSettings 
    		,tools 
    		) {

        var scriptFileName = "ABA_Status_Codes_UE.js";
        var scriptFullName = scriptFileName;

        var obj_ABA_Status = {
        		"FedWire":{      "recordId":"customrecord415"
		   		               ,"fieldName":"custrecord158"
		   		         ,"arrayGoodValues":["Y" ,"y"]
	        		      ,"fieldABAStatus":"custrecord_fedwire_aba_status_code"
        		          }
        	   ,"FedACH": {      "recordId":"customrecord416"
        		   		       ,"fieldName":"custrecord165"
        			     ,"arrayGoodValues":["0" ,"1"]
        		   		  ,"fieldABAStatus":"custrecord_fedach_aba_status_code"
        		          }
        	}

        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeLoad(context) {
            var funcName = scriptFileName + "--->beforeSubmit  recType(" + context.newRecord.type + ")";
                	

            return;

        } // beforeLoad(context)



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeSubmit(context) {
            var funcName = scriptFileName + "--->beforeSubmit  recType(" + context.newRecord.type + ")";
 
            if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT || context.type == context.UserEventType.CREATE) {
            	
            	var objABAStatusUpdate;
            	
            	switch (context.newRecord.type) {
            	case obj_ABA_Status.FedWire.recordId:
            		objABAStatusUpdate          = obj_ABA_Status.FedWire;
            		break;
            	case obj_ABA_Status.FedACH.recordId:
            		objABAStatusUpdate          = obj_ABA_Status.FedACH;
            		break;
            	}
            	
            	if (objABAStatusUpdate) {
                	if (fieldHasChanged(context ,objABAStatusUpdate.fieldName)) {
                		updateABAStatus(context ,objABAStatusUpdate);
                	}
            	}
            	
            }

            return;
        } // beforeSubmit(context)
        


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function updateABAStatus(context ,objABAStatusUpdate) {
        
        	var abaStatus_Good = 1;
        	var abaStatus_Bad  = 3;
        	
        	var fieldValue  = context.newRecord.getValue(objABAStatusUpdate.fieldName);
        	var updateValue = abaStatus_Bad;
        	
        	if (objABAStatusUpdate.arrayGoodValues.indexOf(fieldValue) > -1) { updateValue = abaStatus_Good; }
        	
        	context.newRecord.setValue(objABAStatusUpdate.fieldABAStatus ,updateValue);
        }
        


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function afterSubmit(context) {
            var funcName = scriptFileName + "--->afterSubmit  recType(" + context.newRecord.type + ")";

            
            return;

            
        } // afterSubmit(context)


        
        
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function fieldHasChanged(context ,fieldName) {
        	if (context.type == context.UserEventType.CREATE) {
        		if (context.newRecord.getValue(fieldName) > "" ) { 
        			return true; 
        		}
        	} 
        	else 
        	if (context.type == context.UserEventType.XEDIT) {
				fieldPos = context.newRecord.getFields().indexOf(fieldName);
				if (fieldPos != -1) {
					return true;
				}
        	}
        	else
            if (context.oldRecord.getValue(fieldName) != context.newRecord.getValue(fieldName) ) {
            	return true;            
        	}
        	return false;
        }
        
        


        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        return {
//             beforeLoad: beforeLoad
            beforeSubmit: beforeSubmit
//            ,afterSubmit: afterSubmit
        };

    });