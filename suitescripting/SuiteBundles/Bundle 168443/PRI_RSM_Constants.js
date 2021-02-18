//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_Constants.js
//Description: 	Constants for the PRI State Engine bundle  	
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

define([], function() {
    
    return {
        
    	CUSTOM_RECORD_TYPE : {
    		PRI_RSM_RECORD_TYPE : "customrecord_pri_rsm_rectype",
    		PRI_RSM_RULE : "customrecord_pri_rsm_rule",
    		PRI_RSM_RULE_INSTANCE : "customrecord_pri_rsm_rule_instance"
    		
    	},

		CUSTOM_LIST : {
			PRI_RSM_RULE_STATUS : "customlist_pri_rsm_rule_status"			
		},

		RULE_TYPE : {
			FIXED:		1,
			OPTIONAL:	2,
			AD_HOC:		3
		},

		RULE_STATUS_CHECK_TYPE : {
			RECORD_CREATE: 1,
			RECORD_EDIT: 2,
			ALL_RULES: 3
		},
		
    	RULE_STATUS : {
    		NOT_APPLICABLE: 1,
    		NOT_YET_CHECKED: 2,
    		PASSED: 3,
    		FAILED: 4,
    		OVERRIDDEN: 5    		
    	},
    	
    	ROLE_IS_ADMIN: 3, 
    	
    	PLUGIN_NAME: "customscript_pri_rsm_plugin", 
    	
    	QUEUE_NAME: "PRI_RSM", 
    	
    	SCHEDULED_SCRIPT_ID: "customscript_pri_rsm_sc_evaluate_record", 

    	RULE_TEST_SUITELET_SCRIPT_ID: "customscript_pri_rsm_sl_rule_evaluator",
    	RULE_TEST_SUITELET_DEPLOYMENT_ID: "customdeploy_pri_rsm_sl_rule_evaluator",
    	
    	
    	FORM_DELIMITERS: {
				FIELD_DELIMITER: /\u0001/,
				LINE_DELIMITER: /\u0002/						
		}
    		
    };
});
