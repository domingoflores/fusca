//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/log", "N/runtime", "N/ui/serverWidget",'./Shared/SRS_Constants'],
    function(log,runtime, serverWidget, srsConstants) 
    {
        var scriptName = "SRS_UE_RSM_Customizatons.";
        
        function beforeLoad(context) 
        {
            var funcName = scriptName + "beforeLoad";
            log.debug("starting ", funcName);
            //test record situation where we will perform lock
             //hard code the roles that will not get locked down
        	var form = context.form;
			var overrideDeficienciesButton = form.getButton({
			    id : 'custpage_rsm_override_rules'
			});
				
			if (overrideDeficienciesButton)
			{
				overrideDeficienciesButton.isHidden  = true; 
			}
            
        }
        return {
            beforeLoad: beforeLoad
        }
    }
);