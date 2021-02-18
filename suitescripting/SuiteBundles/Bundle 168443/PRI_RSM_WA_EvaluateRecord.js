//------------------------------------------------------------------
// Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

/**
 *@NApiVersion 2.x
 *@NScriptType workflowactionscript
 */

//------------------------------------------------------------------
//Script: 		PRI_RSM_WA_EvaluateRecord.js
//Description:	Prolecto Record State Manager: Workflow Action to re-evaluate a record 
//Developer: 	Boban
//Date: 		Feb 2017
//------------------------------------------------------------------

define(['N/record','./PRI_RSM_Engine','./PRI_RSM_Constants'],
		
	function(record, rsmEngine, rsmConstants) {
        
        function onAction(context) {
        	
        	var funcName = "PRI_RSM_WA_EvaluateRecord " + context.newRecord.type + ":" + context.newRecord.id;
        	
        	try {
        		
            	log.debug(funcName, "Starting: " + JSON.stringify(context));
              
              	var REC = record.load({'type':context.newRecord.type,'id':context.newRecord.id});
              
				var rsm = rsmEngine.createRecordStateManager(REC);      
				rsm.evaluateRecord(rsmConstants.RULE_STATUS_CHECK_TYPE.ALL_RULES);

            } catch(e){
                log.error(funcName, e);
            }
        }

        return {
            onAction: onAction
        };
    }
);