	//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
**
     * ----------------------------------------------------------------------------------------------
     * SRS_UE_DealEscrow.js
     * ______________________________________________________________________________________________
     * Deal Escrow User Event script
     *
     *
     * ATO-103 2019-05-28 Ken Crossman  Add Create Disbursement button
     * ______________________________________________________________________________________________
     */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/ui/message', 'N/redirect', 'N/url', 'N/ui/serverWidget', 
    './Shared/SRS_Constants', './Shared/SRS_Functions', '/SuiteScripts/Pristine/libraries/dealEscrowLibrary.js', 
    '/.bundle/132118/PRI_ServerLibrary'],
				
		function(record, search, runtime, error, format, message, redirect, url, serverWidget, 
            srsConstants, srsFunctions, dealEscrowLib, priLibrary) {
	
			var scriptName = "SRS_UE_DealEscrow.";
            var disbursementRecTypeID = 970;
            var dealEscrowGLAccounts;
			
			/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */
			
			function userIsAuthorizedToEdit() {
				return (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || runtime.getCurrentUser().department == srsConstants.DEPT.DATA_MANAGEMENT_AND_RELEASE ||runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS || srsFunctions.userIsAdmin() );
			}

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    
		    	var REC = context.newRecord; 
		    	
		    	priLibrary.preventEdit(context, userIsAuthorizedToEdit(), "You are not permitted to edit this record.");
		    	
                // var createDepositURL = url.resolveRecord({recordType: record.Type.CUSTOMER_DEPOSIT, params: {customer: REC.getValue("entity"), custbody_mts_trust_ref: REC.id, class: REC.getValue("class"), location: REC.getValue("location")}});
                var fdfCompletedBy = REC.getValue('custrecord_de_fdf_completed_by') || null;

    			if (context.type == context.UserEventType.VIEW) {
                    // We will need to know if there are GL Accounts to determine whether to show certain buttons
                    dealEscrowGLAccounts = dealEscrowLib.getDealEscrowGLAccounts(REC.id);
    				
    		    	var linkURL = "/app/crm/calendar/event.nl?&record.company={1}&record.custevent_deal_escrow={2}";
    		    	linkURL = linkURL.replace("{1}",context.newRecord.getValue("custrecord_de_deal")).replace("{2}",context.newRecord.id);
    		        var setWindow = "window.location = '" + linkURL + "','New Important Date','';";
    				context.form.addButton({ id:'custpage_new_imp_date' ,label:'New Important Date' ,functionName:setWindow });

    				// ATO-103 - Add Create Disbursement button
                    if (fdfCompletedBy && dealEscrowGLAccounts.length > 0) {
                        if (dealEscrowLib.userIsAuthorizedToDisburse()) {
                            var disbursementURL;
                   
                            disbursementURL = url.resolveRecord({
                            recordType:         'customrecord_escrow_agent_disbursement',
                            params:{
                                        // "record.custrecord_ead_deal":                     REC.getValue("custrecord_de_deal"),
                                        "record.custrecord_ead_deal_escrow":              REC.id,
                                        "record.custrecord_ead_disbursement_dt":          new Date().format("mm/dd/yyyy"),
                                        }
                            });
                            
                            // Find out if there is already an active and incomplete Disbursement record
                            // If so, warn the user
                            var existingDisbursementRecID = getExistingDisbursementRec(REC.id, '');
                            log.debug(funcName,'existingDisbursementRecID: ' + existingDisbursementRecID);
                            if (existingDisbursementRecID) {
                                var scr = 'if (confirm("Are you sure? There is at least one initiated Disbursement for this deal escrow.")) window.location.href="' + disbursementURL + '"; console.log';
                            } else {
                                var scr = "window.location.href='" + disbursementURL + "'; console.log";    
                            }
                                                       
                            context.form.addButton({
                                id: 'custpage_create_disbursement_button',
                                label: 'Create Disbursement',
                                functionName: scr
                            });
                        }
                    }
                    // End of ATO-103 - Add Create Disbursement button

    				if (runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR || (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS || runtime.getCurrentUser().department == srsConstants.DEPT.DATA_MANAGEMENT_AND_RELEASE)) {
        				// find any open invoices for this escrow, and if found, create a button to accept payment
        				
        				var ss = search.create({
        					type:		record.Type.INVOICE,
        					filters:	[
        					        	 	["mainline",search.Operator.IS,true]
        					        	 	,"AND",["status",search.Operator.ANYOF,["CustInvc:A"]]
        					        	 	,"AND",["custbody_deal_escrow",search.Operator.ANYOF,[REC.id]]
        					        	 ],
        					columns:	["account"]
        				}).run().getRange(0,1); 
        				
        				if (ss.length > 0) {
            				var paymentURL = url.resolveRecord({
                                recordType:			record.Type.CUSTOMER_PAYMENT,
                                params:{
                                		"entity": 						REC.getValue("custrecord_de_deal"),
                                		"record.currency":				REC.getValue("custrecord_de_currency"),
                                		"record.memo":					"Deposit Received",
                                		"record.department":			srsConstants.DEPT.ACQUIOM_ESCROW_AGENT,
                                		"record.class":					srsConstants.CLASS.ACQUIOM_ESCROW_AGENT,
                                		"record.custbodyacq_deal_link":	REC.getValue("custrecord_de_deal"),
                                		"record.custbody_deal_escrow": 	REC.id,
                                		"aracct":						ss[0].getValue("account")
                                		}
            				});

                            var scr = "window.location.href='" + paymentURL + "'; console.log";

            				context.form.addButton({
            					id : "custpage_payment",
            					label : "Accept Payment",
            					functionName: scr
            				});    				                    	

        				}
    					
    				} // if the right role or department

    				
    				
    				if (runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR || (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT)) {
    					// Show Create Escrow Agent Action button only if First Day Funding complete (added by Ken 2019-02-11)
                        // var fdfCompletedBy = context.newRecord.getValue('custrecord_de_fdf_completed_by') || null;
                        if (fdfCompletedBy) {  
        					// Show Create Escrow Agent Action button only if there is a GL account for this Deal Escrow 
        					// var dealEscrowGLAccounts = dealEscrowLib.getDealEscrowGLAccounts(REC.id);
        					if (dealEscrowGLAccounts.length > 0) {
        					
                				var escrowURL = url.resolveRecord({
                                    recordType:			"customrecord_deal_action",
                                    params:{
                                    		"record.custrecord_deal2":				REC.getValue("custrecord_de_deal"),
                                    		"record.custrecord_da_deal_escrow":		REC.id,
                                    		"record.custrecord_da_department":		srsConstants.PROJECT_TASK_MGMT_DEPT.ACQUIOM_ESCROW_AGENT,
                                    		"record.custrecord_action_date":		new Date().format("mm/dd/yyyy"),
                                    		"record.custrecord_response_due_date":	new Date().addDays(30).format("mm/dd/yyyy"),
                                    		"cf":									srsConstants.CUSTOM_FORMS.DEAL_ESCROW_AGENT 
                                    		}
                				});

                				var scr = "window.location.href='" + escrowURL + "'; console.log";

                				context.form.addButton({
                					id : "custpage_escrow_btn",
                					label : "Escrow Agent Action",
                					functionName: scr
                				});    				                    	    						
        						
        					}
                        }
    				} // if the right role or department


    			}
			}

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

            function getExistingDisbursementRec(dealEscrowID, disbursementRecID) {
                var funcName = scriptName + "getExistingDisbursementRec";   
                log.debug(funcName, 'disbursementRecID: ' + disbursementRecID);
                var existingdisbursementRecID = null;
                var searchFilters = [];
                searchFilters.push({
                    name: 'custrecord_ead_deal_escrow',
                    operator: search.Operator.IS,
                    values: dealEscrowID
                }, {
                    name: 'custrecord_ead_status',
                    operator: search.Operator.ANYOF,
                    // values: [disbursementStatus.Failed, disbursementStatus.Canceled, disbursementStatus.Completed]
                    values: srsConstants.ESCROW_AGENT_DISBURSEMENT_STATUS["Initiated"]
                });
                if (disbursementRecID) {
                    searchFilters.push({
                        name: 'internalid',
                        operator: search.Operator.NONEOF,
                        values: disbursementRecID
                    });
                }

                var eadSearch = search.create({
                    type: 'customrecord_escrow_agent_disbursement',
                    title: 'EAD Search',
                    columns: [{
                        name: 'internalid'
                    }],
                    filters: searchFilters
                }).run();
                var searchResults = eadSearch.getRange(0, 1); //I only expect one row to return

                if (searchResults.length > 0) {
                    existingdisbursementRecID = searchResults[0].getValue({
                        name: 'internalid'
                    });
                }
                return existingdisbursementRecID;
            }

		return {
			beforeLoad: 	beforeLoad
		}
});
