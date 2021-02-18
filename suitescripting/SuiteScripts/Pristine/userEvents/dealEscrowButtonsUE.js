/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 
 * -----------------------------------------------------------
 * dealEscrowButtons.js
 * ___________________________________________________________
 * 
 * 
 * Version 1.0  Ken Crossman
 * Add buttons to Deal Escrow record
 * ___________________________________________________________
 */

define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/record','N/ui/serverWidget' 
	   ,'/SuiteScripts/Prolecto/Shared/SRS_Constants'
	   ,'/SuiteScripts/Prolecto/Shared/SRS_Functions'
	   ,'/.bundle/132118/PRI_ShowMessageInUI'
	   ,'/SuiteScripts/Pristine/libraries/dealEscrowLibrary.js'
	   ],
	function(serverWidget, search, runtime, record,ui , srsConstants, srsFunctions, priMessage, dealEscrowLib) {

		function beforeLoad(context) {
			// log.debug('beforeLoad');

			switch (context.type) {
			
				case context.UserEventType.VIEW:
					
					
					priMessage.showPreparedMessage(context);
					var dealEscrowId = context.newRecord.getValue('id') || null;
					// Show Create GL Account button
					context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/dealEscrowClient.js';
					context.form.addButton({
						id: 'custpage_create_gl_account_button',
						label: 'Create GL Account',
						functionName: 'createGLAccountSL()'
					});
					// Show Create Invoice button only if there is a GL account for this Deal Escrow 
					var dealEscrowGLAccounts = dealEscrowLib.getDealEscrowGLAccounts(dealEscrowId);
					if (dealEscrowGLAccounts.length > 0) {
						context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/dealEscrowClient.js';
						context.form.addButton({
							id: 'custpage_create_invoice_button',
							label: 'Create Invoice Deposit',
							functionName: 'createInvoiceSL()'
						});
					}
                
                	/* this code is now in srs_UE_DealEscrow.js
                	 * 
					// Show Create Escrow Agent Action button only if there is a GL account for this Deal Escrow 
					var dealEscrowGLAccounts = dealEscrowLib.getDealEscrowGLAccounts(dealEscrowId);
					if (dealEscrowGLAccounts.length > 0) {
						context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/dealEscrowClient.js';
						context.form.addButton({
							id: 'custpage_ea_action_button',
							label: 'Escrow Agent Action',
							functionName: 'escrowAgentActionSL()'
						});
					}
                    */
					// Show First Day Funding Complete button
					var fdfCompletedBy = context.newRecord.getValue('custrecord_de_fdf_completed_by') || null;
					if (!fdfCompletedBy) {					
						if (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS || srsFunctions.userIsAdmin() ) {
							context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/dealEscrowClient.js';
							context.form.addButton({
								id: 'custpage_fdf_complete_button',
								label: 'First Day Funding Complete',
								functionName: 'firstDayFundingComplete()'
							});
						}					
					}
					// Show Review Complete button
					var reviewCompletedBy = context.newRecord.getValue('custrecord_de_review_completed_by') || null;
					if (fdfCompletedBy && !reviewCompletedBy && fdfCompletedBy != runtime.getCurrentUser().id) {
						if (runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS || srsFunctions.userIsAdmin() ) {
							context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/dealEscrowClient.js';
							context.form.addButton({
								id: 'custpage_review_complete_button',
								label: 'Review Complete',
								functionName: 'reviewComplete()'
							});
						}
					}
					
					
					if (	
							(runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR)
    					|| (runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST)
    					|| (runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER
    					&& runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS) 
    					|| (runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_SALES_MANAGER
    					&& runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT)		
    				) 
    				{
    					var ss = search.create({
        					type:		record.Type.ACCOUNT,
        					filters:	[
        					        	 	["custrecord_deal_escrow",search.Operator.ANYOF,[context.newRecord.id]]
        					        	],
        					columns:	["name"]
        				}).run().getRange(0,1); 
        				
    					log.audit("GL acctnumber length ", ss.length);
        				
        				if (ss.length > 0 && parseFloat(context.newRecord.getValue("custrecord_de_fee_amount"))>0) 
        				{
        					context.form.addButton({
	        					id : "custpage_receivefees",
	        					label : "Receive Fees",
	        					functionName: "ReceiveFeesSL()"
	        				});
        				}
//					
    				}



					break;
				default:
					return;
			}
		}



        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function beforeSubmit(context) {
        	
			var rcd = context.newRecord;
			
			// ATP-587 ---------------------------------------------------------------------------------------------------------------------------
			var de_escrow_tax_rptg_rqd;
			var de_escrow_tax_no_rptg_reason;
			var de_tax_no_reporting_notes;

			switch (context.type) {						
			    case context.UserEventType.CREATE:
			    case context.UserEventType.EDIT:
					de_escrow_tax_rptg_rqd       = rcd.getValue('custrecord_de_escrow_tax_rptg_rqd');
					de_escrow_tax_no_rptg_reason = rcd.getValue('custrecord_de_escrow_tax_no_rptg_reason');
					de_tax_no_reporting_notes    = rcd.getValue('custrecord_de_tax_no_reporting_notes');
					break;
				case context.UserEventType.XEDIT:
					   var objLookupFields = search.lookupFields({type:rcd.type ,id:rcd.id
                           ,columns: ["custrecord_de_escrow_tax_rptg_rqd" ,"custrecord_de_escrow_tax_no_rptg_reason" ,"custrecord_de_tax_no_reporting_notes" ]});
						fieldList = rcd.getFields();
						if (fieldList.indexOf('custrecord_de_escrow_tax_rptg_rqd') >= 0) { de_escrow_tax_rptg_rqd = rcd.getValue('custrecord_de_escrow_tax_rptg_rqd'); }
						else { de_escrow_tax_rptg_rqd = objLookupFields.custrecord_de_escrow_tax_rptg_rqd; }
						if (fieldList.indexOf('custrecord_de_tax_no_reporting_notes') >= 0) { de_tax_no_reporting_notes = rcd.getValue('custrecord_de_tax_no_reporting_notes'); }
						else { de_tax_no_reporting_notes = objLookupFields.custrecord_de_tax_no_reporting_notes; }
						if (fieldList.indexOf('custrecord_de_escrow_tax_no_rptg_reason') >= 0) { de_escrow_tax_no_rptg_reason = rcd.getValue('custrecord_de_escrow_tax_no_rptg_reason'); }
						else { 
							if (objLookupFields.custrecord_de_escrow_tax_no_rptg_reason.length > 0) 
							     { de_escrow_tax_no_rptg_reason = objLookupFields.custrecord_de_escrow_tax_no_rptg_reason[0].value; }
							else { de_escrow_tax_no_rptg_reason = "" }						
							
						}

						try {
							var arrayOfFieldNames = ["custrecord_de_escrow_tax_rptg_rqd" ,"custrecord_de_escrow_tax_no_rptg_reason" ,"custrecord_de_tax_no_reporting_notes" ];
							objFields = getNeededFieldValuesForXEDIT(context ,rcd ,arrayOfFieldNames);
							log.debug("beforeSubmit" ,"objFields: " + JSON.stringify(objFields) );
						}
						catch(eee) {}
						
						break;
			}
			
			if (de_escrow_tax_rptg_rqd == 1) { 
				rcd.setValue('custrecord_de_escrow_tax_no_rptg_reason' ,null);
			}
			else 
			if ( de_escrow_tax_no_rptg_reason > "" ) {
				if (de_escrow_tax_rptg_rqd.length == 0) { throw "Escrow Tax Reporting Error: If ESCROW TAX REPORTING REQUIRED must be set to 'NO' if a value is selected for ESCROW TAX NO REPORTING REASON."; }  
			}
			
			if (de_escrow_tax_rptg_rqd == 2) {
				if (!(de_escrow_tax_no_rptg_reason > "") ) { 
					throw "Escrow Tax Reporting Error: If ESCROW TAX REPORTING REQUIRED is set to 'NO' then a value must be selected for ESCROW TAX NO REPORTING REASON.";
				}
			}
			if (de_escrow_tax_no_rptg_reason == 4) { 
				if (de_tax_no_reporting_notes.toString().trim() == "") {
					throw "Escrow Tax Reporting Error: 'Other' is selected for ESCROW TAX NO REPORTING REASON, an explanation must be entered in ESCROW TAX REPORTING NOTES.";					
				}
			}
			// End ATP-587 -----------------------------------------------------------------------------------------------------------------------
        	
        	
        }
        
        //=========================================================================================================================================
        //=========================================================================================================================================
        function getNeededFieldValuesForXEDIT(context ,rcd ,arrayOfFieldNames) {
        	
        	var objFields = {};
        	var objLookupFields = search.lookupFields({type:rcd.type ,id:rcd.id ,columns:arrayOfFieldNames});
        	fieldList = rcd.getFields();
				
        	arrayOfFieldNames.forEach( function(fieldName) {
        				var fieldValue;
        				if (fieldList.indexOf(fieldName) >= 0) { fieldValue = rcd.getValue('custrecord_de_escrow_tax_no_rptg_reason'); }
        				else { 
        					var objField = objLookupFields[fieldName];
        					if (typeof objField === 'object') { fieldValue = objField[0].value; }
        					else { fieldValue = objField; }        					 
        					}
        				objFields[fieldName] = fieldValue;
						});
				        	
        	return objFields;
        }


		return {
			   beforeLoad: beforeLoad
			,beforeSubmit: beforeSubmit
		};
	}
);