//-----------------------------------------------------------------------------------------------------------
//Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
//No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType MassUpdateScript
* 
* This script simply loads/saves a record, firing off User Event scripts 
*/

define(['N/record', 'N/search','N/runtime'],
	function(record, search, runtime) {

		function each(params) {
			var funcName = "PRI_MU_Touch " + params.type + " " + params.id;
			try {
				record.load({type: params.type, id: params.id}).save();
				log.debug(funcName, "Record Loaded/Saved");
			} catch (e) {
				log.error(funcName + " error", e);
			}								
		}
	
		//------------------------------------------------------------------------------------------------------------------------------------
  
		return {
			each: each
		};
	}
);