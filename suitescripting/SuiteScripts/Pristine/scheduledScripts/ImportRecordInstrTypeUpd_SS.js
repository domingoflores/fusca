//----------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

//----------------------------------------------------------------------------------------------------
//Script: 		ImportRecordInstrTypeUpd_SS.js
//Description:	Scheduled Script which  
//Developer: 	Alex Fodor
//Date: 		Sep 2018
//----------------------------------------------------------------------------------------------------
var scriptName = "ImportRecordInstrTypeUpd_SS.js";
var SCRIPT_ID = "customscript_import_instrtypupd";
var MIN_USAGE_THRESHOLD = 700;
var doNotReschedule = false;

define([ 'N/record' ,'N/runtime' ,'N/search' ,'N/task' ,'N/format'
	   ],
		
	function(record ,runtime ,search ,task ,format ) {

		function execute(context) {

			var funcName = scriptName + ".execute";
            
            try {
            	log.debug(funcName, "Starting");
            	
    			var objImportRecordIdFields = search.lookupFields({type:'customrecord_alex_import_internal_id' ,id:1 ,columns: ["custrecord_import_record_id"]});
            	var internalId = objImportRecordIdFields.custrecord_import_record_id;
            	log.debug(funcName, "Starting internal id: " + internalId);
            	
            	// RUN Search for records queued to process
            	var arrColumns        = new Array();
            	// var col_id0           = search.createColumn({ name:'id' ,sort:"ASC" });
            	var col_id            = search.createColumn({ name:'internalid' ,sort:"ASC" });
            	// arrColumns.push(col_id0);
            	arrColumns.push(col_id);
            	            	
            	var arrFilters = [        ['isinactive' ,'IS' ,false]
            	                  ,'AND' ,['internalidnumber' ,'greaterthan' ,internalId ]
                                  ,'AND' ,['custrecord_imp_instruction_type' ,'ANYOF' ,["@NONE@"] ]
                                 ];


        		var objImportSearch = search.create({    'type':'customrecord_import_record'
        		                                          ,'filters':arrFilters 
                                                          ,'columns':arrColumns 	       });

        		var ImportSearch = objImportSearch.run();
                var ImportSearchResults = ImportSearch.getRange(0,1000); 
                
                
            	log.debug(scriptName, "ImportSearchResults.length: " +  ImportSearchResults.length);
            	
            	// If results empty exit
            	if (ImportSearchResults.length == 0) { log.debug(funcName, "ImportSearchResults.length == 0  Exiting"); return; }
            	
            	
//            	for (var ix = 0; ix < ImportSearchResults.length; ix++) {
//            		var rcdId = ImportSearchResults[ix].getValue(col_id);
//            		log.debug(scriptName, "rcdId: " +  rcdId);
//            	}
//            	return;
            	
            	// Process Search Results
            	for (var ix = 0; ix < ImportSearchResults.length; ix++) {
            	    
            	    var rcdId = ImportSearchResults[ix].getValue(col_id);
            	    
        	    	try {
        	            var rcd = record.load({ type:"customrecord_import_record" ,id:rcdId });        	            
        	            rcd.save();        	    		
        	    	} 
        	    	catch(e0) { 
        	    		log.error(scriptName, "Exception - rcdId: " + rcdId + ",   message:" + e0.message );
        	    		log.audit(scriptName, "message:" + e0.message );
        	    	}
        	    	
        	    	//if (ix > 18) { log.debug(scriptName, "Testing, stopping after 20 records");  return;}

        	    	
            	    var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            	    if (RemainingUsage < MIN_USAGE_THRESHOLD) { UpdateImportRecordId(rcdId); rescheduleSelf(); return; }
        	    	
            	} // for (var ix = 0; ix < ImportSearchResults.length; ix++)
            	
            	// Since there were records reschedule self in case new records were added to queue during processing
				UpdateImportRecordId(rcdId);
            	rescheduleSelf();

            	log.debug(funcName, "Exiting");

            } catch (e) {
                log.error(funcName, e);
            }
        }
		
		
		
		function UpdateImportRecordId(rcdId) {
			var rcd = record.load({type: 'customrecord_alex_import_internal_id', id:1});
			rcd.setValue("custrecord_import_record_id" ,rcdId);
			rcd.save();
		}
		
		
		
		function rescheduleSelf() {
			var funcName = scriptName + ".rescheduleSelf";
			if (doNotReschedule) return;
			log.debug(funcName, "Rescheduling");
			try {
        		var scriptTask = task.create({'taskType' : task.TaskType.SCHEDULED_SCRIPT});                                   
        		scriptTask.scriptId = SCRIPT_ID;                                   
        		var scriptTaskId = scriptTask.submit();                                 
			} catch(e) { log.error(funcName, "Reschedule Failed - " + e.message); }
		}
		
		
        return {
            execute: execute
        };
    }
);