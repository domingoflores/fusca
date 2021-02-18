//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------


/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType plugintypeimpl
 */


//	PRI Record Import/Export Manager - Default Export Plugin


define(['N/runtime','N/log','N/record','N/search'],
	function(runtime,log,record,search) {
	
		var scriptName = "PRI_RIEM_PLT_Export.";

		
		function getInputData(JOB, savedSearch) {
			log.debug(scriptName+".getInputData", "*** NOT IMPLEMENTED ***");
		}
		
		function reduce(context, searchResult, obj) {
			log.debug(scriptName+".map", "*** NOT IMPLEMENTED ***");
		}
		
    	/* ======================================================================================================================================== */


    return {
        getInputData: 	getInputData,
        reduce:			reduce
    }
});