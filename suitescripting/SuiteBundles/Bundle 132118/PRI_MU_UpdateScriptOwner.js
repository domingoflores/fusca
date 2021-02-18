//------------------------------------------------------------------
//Copyright 2019, All rights reserved, Prolecto Resources, Inc.

//No part of this file may be copied or used without express, written
//permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Description: Mass Update script for reassigning script owner from the current owner to the selected Employee on the Mass Update record.
//Developer: Elie Ciment	
//Date: 06/03/2019
/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime'], 
		
function(record, runtime) {
    
    /**
     * Definition of Mass Update trigger point.
     *
     * @param {Object} params
     * @param {string} params.type - Record type of the record being processed by the mass update
     * @param {number} params.id - ID of the record being processed by the mass update
     *
     * @since 2016.1
     */
    function each(params) {
    	var REC = record.load({ type: params.type, id: params.id });
    	var replaceWith = runtime.getCurrentScript().getParameter({ name: 'custscript_pri_update_script_owner_to' });
    	REC.setValue({ fieldId: 'owner', value: replaceWith });
    	REC.save();    		
    }

    return {
        each: each
    };
    
});
