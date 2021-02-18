//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		only schedules a map/reduce script
 * 
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */


define(['N/runtime','N/record','N/error','N/search','N/file','N/task','./PRI_RIEM_Common'],

		
	function(runtime,record,error,search,file,task,riemCommon) {
   
		var scriptName = "pri_RIEM_SC_ScheduleExportMapReduce."
	   
		function execute(scriptContext) {
			
	
			var funcName = scriptName + "execute";
			
			try {
			
				riemCommon.scheduleExportMapReduceScript(); 
				
			} catch (e) {
	    		log.error(funcName, e);				
			}
			
    		
	    } // execute
	
    	/* ======================================================================================================================================== */
		
        return {
            execute: execute
        };    
	}
);
