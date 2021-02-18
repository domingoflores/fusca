/**
* @NApiVersion 2.x
* @NScriptType MapReduceScript
* @NModuleScope SameAccount
*/

define(['N/runtime' ,'N/record' ,'N/error' ,'N/search' ,'N/file' ,'N/task'
	   ,'/SuiteScripts/Pristine/libraries/MapReduceUtilityFunctions.js'
	   ,'/.bundle/132118/PRI_ServerLibrary'
	   ],
            
      function(runtime ,record ,error ,search ,file ,task 
    		  ,functionsLibrary
    		  ,priLibrary 
    		  ) {

      var scriptName = "MapReduceUtilityFunctions_MR.js-->";

      function getInputData() {

            var funcName = scriptName + "getInputData";

            log.debug(funcName, "Process is starting");

            var jsonObject         = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_json_object'      });
    	    var callingScript      = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_callingscript'    });
    	    var utilityFunction    = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_function'         });
    	    var recordType         = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_record_type'      });
    	    
            log.audit(funcName, "jsonObject: "      + jsonObject);
            log.audit(funcName, "utilityFunction: " + utilityFunction);
            log.audit(funcName, "recordType: "      + recordType);
            log.audit(funcName, "callingScript: "   + callingScript);
    	    
    	    var functionFound = false;
//    	    for (var i=0; i<arrayFunctions.length; i++) {
//    	    	if (utilityFunction.toLowerCase() == arrayFunctions[i].toLowerCase()) { functionFound = true; }
//    	    }
    	    for (var propertyFunction in functionsLibrary.availableFunctions){
    	    	if (utilityFunction == propertyFunction) { functionFound = true; }
    	    }
	    	if (!functionFound) { throw "Function " + utilityFunction + " is invalid" }
	    	
	    	
	    	var objFunctionProperties;
	    	var arrFilters;
 
	    	try {
	  	    	objFunctionProperties = functionsLibrary.availableFunctions[utilityFunction](null ,null ,true);
  	    		arrFilters = functionsLibrary.availableFunctions[objFunctionProperties.getInputDataFunction](jsonObject);
	    	}
	    	catch(e){
	        	log.error(funcName, "Exception: " + e); 
	        	throw e;
	    	}
            
    		var arrColumns              = new Array();
    		var col_InternalId          = search.createColumn({ "name":"internalid"  });
    		arrColumns.push(col_InternalId);
    		var searchMapReduceObj = search.create({'type':recordType
    		                                           ,'filters':arrFilters 
    	                                               ,'columns':arrColumns 	       });
                              
            log.debug(funcName, "searchMapReduceObj: " + JSON.stringify(searchMapReduceObj));
            return searchMapReduceObj;        
      }
      
      
      //================================================================================================================================
      //================================================================================================================================
      function map(context) {
    	  var funcName = scriptName + "map ";
    	  var success = "success";
    	  var recordId = null;

    	  try {
    		  var callingScript;
    		  try { callingScript   = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_callingscript' }); } catch(e) {}
    		  var utilityFunction;
    		  try { utilityFunction = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_function' });      } catch(e) {}
    		  var jsonObject;
    		  try { jsonObject      = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_json_object' });   } catch(e) {}

    		  /* {"type":"mapreduce.MapContext","isRestarted":false,"executionNo":1,"key":"644590"
    		    ,"value":"{\"recordType\":\"customrecord_acq_lot\"
    		              ,\"id\":\"644590\"
    		              ,\"values\":{\"internalid\":{\"value\":\"644590\",\"text\":\"644590\"}
    		              }"\
    		     }            
    		  */
            
    		  recordId = context.key;
    		  var currDatetime = new Date();
    		  funcName = funcName + "id:" + recordId + " time:" + currDatetime.getTime();
    		  
    		  
    		  try {
    			  
    			  var objReturn = functionsLibrary.availableFunctions[utilityFunction](recordId ,jsonObject);
    			      			  
    			  if (!objReturn.success) { throw objReturn.message }
    		  }
    		  catch(e) {
        		  log.error(funcName, utilityFunction + ": " + e);
        		  success = "Failed in function " + utilityFunction + " processing";
    		  }
            
    	  } 
    	  catch (e) { log.error(funcName, e); success = "Failed"; }
            
		  context.write(recordId, success);                   
      }
      
      
      //================================================================================================================================
      //================================================================================================================================
      function summarize(summary) {
    	  var funcName = scriptName + "summarize";

          var jsonObject         = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_json_object'      });
  	      var callingScript      = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_callingscript'    });
  	      var utilityFunction    = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_function'         });
  	      var recordType         = runtime.getCurrentScript().getParameter({ name:'custscript_mr_uf_record_type'      });
		  log.debug(funcName, "callingScript: " + callingScript); 
    	  log.debug(funcName, summary); 
          
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	  if (errorMsgs && errorMsgs.length > 0) 
    		  log.error(funcName, JSON.stringify(errorMsgs));
    	  
    	  try {
  	    		var objFunctionProperties = functionsLibrary.availableFunctions[utilityFunction](null ,null ,true);
  	    		// The function may expose a separate function to be executed in this summarize step
  	    		if (objFunctionProperties.summarizeFunction > "") {
  	    			functionsLibrary.availableFunctions[objFunctionProperties.summarizeFunction](jsonObject ,summary);
  	    		}
    	  }
    	  catch(e){
        	  log.error(funcName, "Exception: " + e); 
    	  }

    	  var recordsProcessed = 0;
      
    	  summary.output.iterator().each(function(key, value) { recordsProcessed++; return true; });

    	  log.audit(funcName, recordsProcessed + " Records were processed."); 

    	  //summary.output.iterator().each(function(key, value) { log.debug(funcName, key + " - " + value); return true; });
    	  
    	  log.debug(funcName, "Exiting,    " + "callingScript: " + callingScript);    
      }


    //================================================================================================================================
    //================================================================================================================================
    return { getInputData: getInputData
                     ,map: map
               ,summarize: summarize
           };

}
);