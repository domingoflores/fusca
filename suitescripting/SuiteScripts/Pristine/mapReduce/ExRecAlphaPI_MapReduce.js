/**
* @NApiVersion 2.x
* @NScriptType MapReduceScript
* @NModuleScope SameAccount
*/

define(['N/runtime' ,'N/record' ,'N/error' ,'N/search' ,'N/file' ,'N/task'
	   ,'/.bundle/132118/PRI_ServerLibrary'
	   ,'/SuiteScripts/Pristine/libraries/ExRecAlphaPILibrary.js'
	   ],
            
      function(runtime ,record ,error ,search ,file ,task ,priLibrary ,ExRecAlphaPI) {

      var scriptName = "ExRecAlphaPI_MapReduce.js-->";


      function getInputData() {

            var funcName = scriptName + "getInputData";

            log.debug(funcName, "Process is starting");

            var exchangeRecordList = runtime.getCurrentScript().getParameter({ name:'custscript_exrec_mr_exrec_list'  });
    	    var shareholder        = runtime.getCurrentScript().getParameter({ name:'custscript_exrec_mr_shareholder' });
    	    var deal               = runtime.getCurrentScript().getParameter({ name:'custscript_exrec_mr_deal'        });
    	    var callingScript      = runtime.getCurrentScript().getParameter({ name:'custscript_exrec_mr_callingscript' });
            
            log.debug(funcName, "exchangeRecordList: " + exchangeRecordList);
            log.debug(funcName, "shareholder: " + shareholder);
            log.debug(funcName, "deal: " + deal);
            log.debug(funcName, "callingScript: " + callingScript);
    	    
            var exchangeRecordArray = JSON.parse(exchangeRecordList);
    	    
    	    var shareholderDealText = "'" + shareholder + "/" + deal + "'";
    	    
    		var arrColumns              = new Array();
    		var col_InternalId          = search.createColumn({ "name":"internalid"  });
    		var col_formula_Shareholder_deal = search.createColumn({ "name":"formulatext" ,"type":"text" ,"formula":shareholderDealText });
    		arrColumns.push(col_InternalId);
    		arrColumns.push(col_formula_Shareholder_deal);
    		
    		var arrFilters   = [         ['isinactive'    ,'IS'       ,false ]
    		                    ,'AND'  ,['internalid'    ,'ANYOF'    ,exchangeRecordArray ]
    	                       ];
    		var searchMapReduceObj = search.create({'type':'customrecord_acq_lot'
    		                                           ,'filters':arrFilters 
    	                                               ,'columns':arrColumns 	       });
                              
            return searchMapReduceObj;        
      }
      
      
      //================================================================================================================================
      //================================================================================================================================
      function map(context) {
    	  var funcName = scriptName + "map ";
    	  var success = "success";
    	  var exchangeRecordId = null;

    	  try {
            
    		  var callingScript;
    		  try { callingScript = runtime.getCurrentScript().getParameter({ name:'custscript_exrec_mr_callingscript' }); } catch(e) {}
    		  log.debug(funcName, context + " ,  " + "callingScript: " + callingScript); 

    		  var obj = JSON.parse(context.value);
            
    		  /* {"type":"mapreduce.MapContext","isRestarted":false,"executionNo":1,"key":"644590"
    		    ,"value":"{\"recordType\":\"customrecord_acq_lot\"
    		              ,\"id\":\"644590\"
    		              ,\"values\":{\"internalid\":{\"value\":\"644590\",\"text\":\"644590\"}
    		                          ,\"formulatext\":\"676777/5557\"}
    		              }"\
    		     }            
    		  */
            
    		  exchangeRecordId = obj.id;
    		  var currDatetime = new Date();
    		  funcName = funcName + "id:" + exchangeRecordId + " time:" + currDatetime.getTime();
    		  
    		  var shareholderDeal    = obj.values["formulatext"];    		  
    		  var objShareholderDeal = shareholderDeal.split("/");    		  
    		  var shareholder        = objShareholderDeal[0];
    		  var deal               = objShareholderDeal[1];
    		  if (deal == 'null') { deal = null; }
            
    		  log.debug(funcName, "shareholder: " + shareholder + ",   deal: " + deal + ""); 
    		  
    		  try {
    			  var objReturn = ExRecAlphaPI.updateRelatedExRecs(shareholder, deal, exchangeRecordId);
    			  if (!objReturn.success) { throw objReturn.message }
    		  }
    		  catch(e) {
        		  log.error(funcName, "AlphaPI exception: " + e);
        		  success = "Failed in AlphaPI processing";
    		  }
            
    	  } 
    	  catch (e) { log.error(funcName, e); success = "Failed"; }
            
		  context.write(exchangeRecordId, success);                   
      }

      
      //================================================================================================================================
      //================================================================================================================================
      function summarize(summary) {
    	  var funcName = scriptName + "summarize";

		  var callingScript;
		  try { callingScript = runtime.getCurrentScript().getParameter({ name:'custscript_exrec_mr_callingscript' }); } catch(e) {}
		  log.debug(funcName, "callingScript: " + callingScript); 
    	  log.debug(funcName, summary); 
      
    	  var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	  if (errorMsgs && errorMsgs.length > 0) 
    		  log.error(funcName, JSON.stringify(errorMsgs));

    	  var exchangeRecordsProcessed = 0;
      
    	  summary.output.iterator().each(function(key, value) { exchangeRecordsProcessed++; return true; });

    	  log.audit(funcName, exchangeRecordsProcessed + " Exchange Records were processed."); 

    	  summary.output.iterator().each(function(key, value) { log.debug(funcName, key + " - " + value); return true; });
    	  
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