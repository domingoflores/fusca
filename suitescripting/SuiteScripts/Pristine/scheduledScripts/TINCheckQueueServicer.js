//----------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

//----------------------------------------------------------------------------------------------------
//Script: 		TINCheckQueueServicer.js
//Description:	Scheduled Script which processes TINCheck records that have been Queued for processing 
//Developer: 	Alex Fodor
//Date: 		Sep 2018
//----------------------------------------------------------------------------------------------------
var scriptName = "TINCheckQueueServicer.js";
var SCRIPT_ID = "customscript_tinchk_q_servicer";
var MIN_USAGE_THRESHOLD = 1000;
var doNotReschedule = false;

define([ 'N/record' ,'N/runtime' ,'N/search' ,'N/task' ,'N/format'
	    ,'/SuiteScripts/Pristine/libraries/TINCheckLibrary.js'
		,'/.bundle/132118/PRI_AS_Engine'
	   ],
		
	function(record ,runtime ,search ,task ,format ,TINCheckInvoker ,appSettings) {

		function execute(context) {

			var funcName = scriptName + ".execute";
		    var objRequestStatus      = {Invoking:1
                    ,Deferred:2
                    ,Requested:3
                    ,Scheduled:4
                    ,Pending:5
                    ,Processed:6
                    ,Canceled:7
                    ,Duplicate:8
                    ,ServiceInactive:9
                    ,PendingDuplicate:10};
            
            try {
            	log.audit(funcName, "Starting");
    	    	try { objAppSettings = appSettings.createAppSettingsObject("TIN Check"); }
    	    	catch(e11) { log.error(scriptName, "exception getting appSettings: " + e11.message); return; }
            	
            	// RUN Search for records queued to process
            	var arrColumns        = new Array();
            	var col_id            = search.createColumn({ name:'id'  });
            	var col_RequestStatus = search.createColumn({ name:'custrecord_tinchk_req_sts'  });
            	var col_ReservedUntil = search.createColumn({ name:'custrecord_tinchk_reserved_until_ts'  });
            	arrColumns.push(col_id);
            	arrColumns.push(col_RequestStatus);
            	arrColumns.push(col_ReservedUntil);
            	
            	// M/d/yy h:mm a
            	
            	var objDateTimeNow = new Date();
        	    var textDateNow = formattedDate(objDateTimeNow);
            	log.audit(funcName, "textDateNow: " + textDateNow);  //  CURRENT_TIMESTAMP
            	
            	var arrStatus = JSON.parse( objAppSettings.settings["TINCHK Queue Servicer Status List"] );
            	
            	var arrFilters = [        ['isinactive' ,'IS' ,false]
            	                  ,'AND' ,['custrecord_tinchk_req_sts' ,'ANYOF' ,arrStatus ]
            	                  ,'AND' ,[       ['custrecord_tinchk_reserved_until_ts' ,'BEFORE'  ,textDateNow]
            	                           ,'OR' ,['custrecord_tinchk_reserved_until_ts' ,'ISEMPTY' ,'']         ]
                                 ];

        		var objTinCheckSearch = search.create({    'type':'customrecord_tin_check'
        		                                          ,'filters':arrFilters 
                                                          ,'columns':arrColumns 	       });

        		var TinCheckSearch = objTinCheckSearch.run();
                var TinCheckSearchResults = TinCheckSearch.getRange(0,1000); 
                
                
            	log.debug(scriptName, "TinCheckSearchResults.length: " +  TinCheckSearchResults.length);
            	
            	// If results empty exit
            	if (TinCheckSearchResults.length == 0) { log.debug(funcName, "TinCheckSearchResults.length == 0  Exiting"); return; }
            	
            	var reschedule = false;
            	
            	// Process Search Results
            	for (var ix = 0; ix < TinCheckSearchResults.length; ix++) {
            	    var RemainingUsage = runtime.getCurrentScript().getRemainingUsage();
            	    if (RemainingUsage < MIN_USAGE_THRESHOLD) { rescheduleSelf(); return; }
            	    
            	    var tinCheckRecordId = TinCheckSearchResults[ix].getValue(col_id);
            	    var tinCheckRequestStatus  = TinCheckSearchResults[ix].getValue(col_RequestStatus);

            	    log.audit(scriptName + "(" + runtime.getCurrentScript().deploymentId + ")", "Processing record: " + tinCheckRecordId + ",  Status: " + tinCheckRequestStatus );
            	    
            	    if (tinCheckRequestStatus == objRequestStatus.PendingDuplicate) { 
            	    	log.debug(funcName, "PendingDuplicate " );
            	    	try {
                    	    var rcdTinCheck = record.load({type:'customrecord_tin_check' ,id:tinCheckRecordId } );
                			if (rcdTinCheck) { 
                				var duplicatedRecordId = rcdTinCheck.getValue("custrecord_duplicated_tin_chk_record");
                				log.debug(funcName, "duplicatedRecordId: " + duplicatedRecordId );
                				if (duplicatedRecordId > "") {
                					var objLookupFields = search.lookupFields({type:"customrecord_tin_check" ,id:duplicatedRecordId ,columns:["custrecord_tinchk_req_sts" ]});
                					log.debug(funcName, "objLookupFields: " + JSON.stringify(objLookupFields) );
                					if (objLookupFields.custrecord_tinchk_req_sts[0].value == objRequestStatus.Processed) {
                    					log.debug(funcName, "updating duplicate " );
                    					rcdTinCheck.setValue("custrecord_tinchk_req_sts" ,objRequestStatus.Duplicate)
                    					rcdTinCheck.save();
                    					
                					}
                				} // if (duplicatedRecordId > "")
                			} // if (rcdTinCheck)
            	    	} 
            	    	catch(e0) {log.error(funcName, e0);}

            	    }
            	    else {
            	    	reschedule = true;
                	    var objTINCheckRresponse = TINCheckInvoker.invokeTINCheck(tinCheckRecordId);
                	    var str1 = JSON.stringify(objTINCheckRresponse);
            			log.debug(funcName, "TINCheckRresponse: " + str1); 
            	    }

            	} // for (var ix = 0; ix < TinCheckSearchResults.length; ix++)
            	
            	// Reschedule self in case new records were added to queue during processing
            	if (reschedule) {	rescheduleSelf(); }

            	log.debug(funcName, "Exiting");

            } catch (e) {
                log.error(funcName, e);
            }
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
		
		function formattedDate(objDate) {
			var formattedDateString = '';
			
    	    var month    = (objDate.getMonth() + 1);
    	    var day      = objDate.getDate();
    	    var year     = objDate.getFullYear();
    	    var hour     = objDate.getHours() + 1;
    	    var minute   = objDate.getMinutes();
    	    var ampm     = 'AM'; 
    	    if (hour > 11) { ampm = 'PM'; }
    	    if (hour > 12) {hour = hour - 12;}
    	    var formattedDateString = month + "/" + day + "/" + year + " " + hour + ":" + minute + " " + ampm;

			return formattedDateString;
		}
		
		
        return {
            execute: execute
        };
    }
);