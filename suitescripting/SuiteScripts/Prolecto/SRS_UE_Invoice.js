//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the Invoice record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary) {
	
			var scriptName = "SRS_UE_Invoice.";
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	log.debug(funcName, "Starting"); 
		    	
		    	var REC = context.newRecord;
                var paymentURL = ''; 

/* 2019.01.18 - this story rolled back for now		    	
		    	//ATP-549		    	
				if (context.type == context.UserEventType.PRINT) {
					REC = record.load({type: record.Type.INVOICE, id: REC.id});
					if (REC.getValue("customform") == srsConstants.CUSTOM_FORMS.ACQUIOM_INVOICE)
						throw "You are not permitted to print this Invoice";
				} 				
*/
		    	
    			if (context.type == context.UserEventType.VIEW) {

    				log.debug(funcName, "status=" + REC.getValue("status") + "; escrow=" + REC.getValue("custbody_deal_escrow")); 
    				
    				if (runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR ||
                       (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT ||
                        runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS ||
                        runtime.getCurrentUser().department == srsConstants.DEPT.DATA_MANAGEMENT_AND_RELEASE)) {
        				if (REC.getValue("status") == "Open" && REC.getValue("custbody_deal_escrow")) {
            				var paymentURL = url.resolveRecord({
                                recordType:			record.Type.CUSTOMER_PAYMENT,
                                params:{
                                		"entity": 						REC.getValue("entity"),
                                		"record.currency":				REC.getValue("currency"),
                                		"record.memo":					"Deposit Received",
                                		"record.department":			srsConstants.DEPT.ACQUIOM_ESCROW_AGENT,
                                		"record.class":					srsConstants.CLASS.ACQUIOM_ESCROW_AGENT,
                                		"record.custbodyacq_deal_link":	REC.getValue("custbodyacq_deal_link"),
                                		"record.custbody_deal_escrow": 	REC.getValue("custbody_deal_escrow"),
                                		"aracct":						REC.getValue("account")
                                		}
            				});
                        }
                    } else {
                        if (! ( REC.getValue("class") == srsConstants.CLASS.CLIENT_ACCOUNTS_ACQUIOM ||
                                REC.getValue("class") == srsConstants.CLASS.ACQUIOM_ESCROW_AGENT ||
                                REC.getValue("class") == srsConstants.CLASS.CLIENT_ACCOUNTS_SRS)
                            ) {
      
                            if (REC.getValue("status") == "Open") {
                                paymentURL = url.resolveRecord({
                                    recordType:         record.Type.CUSTOMER_PAYMENT,
                                    params:{
                                            "entity":                       REC.getValue("entity"),
                                            // "subsidiary":                   1, 
                                            "inv":                          REC.getValue("id"),    
                                            "currency":                     REC.getValue("currency"),
                                            "record.memo":                  REC.getValue("memo"),
                                            "record.department":            REC.getValue("department"),
                                            "record.class":                 REC.getValue("class"),
                                            "record.custbodyacq_deal_link": REC.getValue("custbodyacq_deal_link")
                                            }
                                });
                            }
                        }
                    }
        
                    log.debug(funcName, 'paymentURL: ' + paymentURL);
                    if (paymentURL) {
                        var scr = "window.location.href='" + paymentURL + "'; console.log";

        				context.form.addButton({
        					id : "custpage_payment",
        					label : "Accept Payment",
        					functionName: scr
        				});    				                    	

        				priLibrary.hideButtons("acceptpayment", context.form); 
					}

    			}

			}


    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */



		return {
			beforeLoad: 	beforeLoad
		}
});

