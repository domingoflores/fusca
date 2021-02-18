//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 * 
 * Prolecto Record Import/Export Manager
 * 
 * 		Default Plugin for the Import process
 * 
 */


/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType plugintypeimpl
 */


define(['N/runtime','N/log','N/record','N/search'],
	function(runtime,log,record,search) {
	
		var scriptName = "PRI_RIEM_PLT_Import.";

		
		function createRecord(REC, context) {
			
			var funcName = scriptName + "createRecord";
			
			// REC is a record of type customrecord_pri_riem_imp_staging
			//	this script should update the STATUS and/or the MESSAGE fields
			//		status is taken from the values of Staging Import Status list (customlist_pri_riem_import_status)
			
			log.debug(funcName, "*** NOT IMPLEMENTED ***");
		}
				
    	/* ======================================================================================================================================== */


    return {
        createRecord:	createRecord
    }
});