//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */

/*
 *
 * each row in the queue represents an RSM "Map/Reduce" execution (which executes RSM against many records)
 * 
 */

define(['N/search', 'N/record', 'N/runtime', 'N/task', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_QM_Engine'],
    function(search, record, runtime, task, srsConstants, srsFunctions, qmEngine) {

		"use strict";

		var scriptName = "SRS_SC_SubmitRSMMapReduce.";

    	var MIN_USAGE_THRESHOLD = 500;
    	
		function execute(context) {
        
			var funcName = scriptName + "execute";
			            
        	var allDone = false;
        	
        	log.debug(funcName, "Starting");
        	
        	do {
            	var obj = qmEngine.getNextQueueEntry(srsConstants.QUEUE_NAMES.RSM_MAP_REDUCE);
            	
				if (obj !== null && typeof obj === 'object') {
					
					try {

						var searchObj = JSON.parse(obj.parms); 

						if (srsFunctions.executeRSMMapReduceScript(searchObj)) 						
							qmEngine.markQueueEntryComplete(obj.id);
						else
							qmEngine.abandonQueueEntry(obj.id); 
						

					} catch (e) {
						// couldn't complete it, so update the status and let it try again
						log.error(funcName, e);
						qmEngine.abandonQueueEntry(obj.id, null, "ERROR: " + e.message);
					}
										
					
				} else	// we didn't get anything back from the queue
					return;
				            		
	    	} while (true);

            	
        	log.debug(funcName, "*** EXITING ***");
        	
        }
	
		// ================================================================================================================================

        return {
            execute: execute
        };
    }
);