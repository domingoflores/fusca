//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['./creLibrary20.js','N/runtime'],

function(lib,runtime) {
   
    /**
     * Description: before load script that adds button to record used to execute CRE profile
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    		if(scriptContext.type=='view'){
    			try{
    				var buttonLabel=runtime.getCurrentScript().getParameter({name : 'custscript_cre_button_name_20'});
        			var profileId=runtime.getCurrentScript().getParameter({name : 'custscript_cre_profile_id_button_20'});
        			
        			buttonParamObj={form:scriptContext.form,profileId:profileId,recid:scriptContext.newRecord.id,buttonId:'custpage_pri_cre_buttonid_20',buttonLabel:buttonLabel};
        			lib.addCREtriggerButton(buttonParamObj);
    			}
    			catch(e){
    				var stErrMsg = '';
    				if (e.getDetails != undefined) stErrMsg = 'Script Error: '+e.getCode() + ', ' + e.getDetails()+', '+e.getStackTrace();    
    				else stErrMsg = 'Script Error: '+e.toString();     
    				log.error('Script Error',stErrMsg);
    			}
    		}
    }
    return {
        beforeLoad: beforeLoad,
    };    
});
