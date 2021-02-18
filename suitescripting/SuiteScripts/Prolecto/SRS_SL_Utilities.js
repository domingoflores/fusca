//-----------------------------------------------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

/*
 *	general utility suitelet; receives a parm to tell it what action to perform.
 */

define(['N/record', 'N/runtime', 'N/url', 'N/search', 'N/email', 'N/task', 'N/format', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ShowMessageInUI', '/.bundle/132118/PRI_AS_Engine', '/.bundle/132118/PRI_QM_Engine', '/.bundle/132118/PRI_ServerLibrary'
	,'SuiteScripts/Pristine/libraries/serverReleaseFundTrackingLibrary'
	,'SuiteScripts/Pristine/libraries/clientReleaseFundTrackingLibrary.js'
	],  
	function(record, runtime, url, search, email, task, format, srsConstants, srsFunctions, priMessage, appSettings, qmEngine, priLibrary
	,srftLibrary		
	,crftLibrary
	) {

		var scriptName = "SRS_SL_Utilities";

		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

		function onRequest(context) {
							
			var funcName = scriptName + ".onRequest ";
	        log.debug(funcName, "Starting: " + JSON.stringify(context.request.parameters));

	        var action = context.request.parameters.action || "";
	        var parmClientFundId = null;
	        var options = {};
	        var fundActivityUpdates = {};
            
	        
	        try {
	        	
	        	switch (action.toLowerCase()) {

	        	case "ProcessClientFundTransactions".toLowerCase():
                    
	        		try 
	        		{
		        		parmClientFundId = context.request.parameters.cfid;
		        		
		        		log.audit("parmClientFundId", parmClientFundId);
		        		
		        		options = {};
		        		options.clientfund = {};
	                    options.clientfund.internalid = parmClientFundId;
	                    
	                    options.all_messages = "";
	
	                    options.vendorbill = {};
	                    options.vendorpayment = {};
	
	                    result = srftLibrary.callCreateVendorBill(options);
	                    if (!result.success)
	                    {
	                        return;
	                    }
	                  
	                    log.audit("vendoribll id ", options.vendorbill.internalid);
	                    result = srftLibrary.callCreateVendorPayment(options);
	                    if (!result.success)
	                    {
	                        return;
	                    }
	                    log.audit("vendoribll id2 ", options.vendorbill.internalid);
	                    
	                    result = srftLibrary.callCreateInvoice(options);

                        if (!result.success)
                        {
                            return;
                        }
                     
                        var balanceCheck = crftLibrary.customerBalanceAvailable(parmClientFundId);
                        if (balanceCheck.success)
                        {
	                        result = srftLibrary.callCreatePayment(options);
	                        if (!result.success)
	                        {
	                            return;
	                        }
                        }
	                    else
	                    {
	                    	//throw "Customer Deposit Balance is less than the Release Amount. ";
	                    	
	                    	priMessage.prepareMessage("Creation of Deposit Application Failed", "Customer Deposit Balance " +balanceCheck.deposit+" is less than Amount "+balanceCheck.amount+".", priMessage.TYPE.ERROR, "customrecord_client_release_tracking", parmClientFundId);					    	
			        		fundActivityUpdates.custrecord_crf_trk_status = srsConstants["Client Fund Release Status"]["Failed"];
				            fundActivityUpdates.custrecord_crf_trk_activity = "Customer Deposit Balance is less than Amount";
				            srftLibrary.updateFundActivityFields(options.clientfund.internalid, fundActivityUpdates);
					    	context.response.sendRedirect({type: "RECORD", identifier: "customrecord_client_release_tracking", id: parmClientFundId, editMode: false});
	                    	return;
	                    	
	                    }
	        		}
		        	catch (e) {
	        			log.error(funcName + " occurred: ", e);
				    		priMessage.prepareMessage("Error Creating Client Release Fund Transactions", e.message, priMessage.TYPE.ERROR, "customrecord_client_release_tracking", parmClientFundId);					    	
		        		
				    	 fundActivityUpdates.custrecord_crf_trk_status = srsConstants["Client Fund Release Status"]["Failed"];
			             fundActivityUpdates.custrecord_crf_trk_activity = e.message;
			             srftLibrary.updateFundActivityFields(options.clientfund.internalid, fundActivityUpdates);
				    	
				    	
				    	context.response.sendRedirect({type: "RECORD", identifier: "customrecord_client_release_tracking", id: parmClientFundId, editMode: false});			        				        			
	        		}
                    	break;
	        		case "createInvoiceDeposit".toLowerCase():
	        			
	        			const ITEM_SHAREHOLDER_PROCEEDS = 264;
	        			
		        		try {
			        		var derId = context.request.parameters.derId;

		    	        	if (srsFunctions.userIsAdmin() || 
		    	        			(runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS && (runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER || runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST))) {

		    	        		
		    	        		var DER = record.load({type: "customrecord_payment_import_record", id: derId});
		    	        		
		    	        		var INV = record.create({type: record.Type.INVOICE}); 
		    	        		
		    	        		INV.setValue("customform", srsConstants.CUSTOM_FORMS.ACQUIOM_INVOICE); 
		    	        		INV.setValue("entity",DER.getValue("custrecord_pay_import_deal")); 
		    	        		INV.setValue("trandate", new Date());
		    	        		INV.setValue("memo", "Deposit Amount"); 
		    	        		INV.setValue("custbodyacq_deal_link", DER.getValue("custrecord_pay_import_deal")); 
		    	        		//INV.setValue("currency", DER.getValue("custrecord_pay_import_currency")); 
		    	        		INV.setValue("currency", 1);    
		    	        		INV.setValue("department",srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM); 
		    	        		INV.setValue("class", srsConstants.CLASS.CLIENT_ACCOUNTS_ACQUIOM); 
		    	        		
		    	        		INV.setSublistValue({sublistId: "item", fieldId: "item", value: ITEM_SHAREHOLDER_PROCEEDS, line: 0}); 
		    	        		INV.setSublistValue({sublistId: "item", fieldId: "quantity", value: "1", line: 0});
		    	        		INV.setSublistValue({sublistId: "item", fieldId: "department", value: srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM, line: 0});		    	        		
		    	        		INV.setSublistValue({sublistId: "item", fieldId: "amount", value: DER.getValue("custrecord_pay_import_release_amount"), line: 0}); 
		    	        		
		    	        		var invId = INV.save(); 
		    	        		
		    	        		log.debug(funcName, "Invoice id " + invId + " created");
		    	        		 
		    	        		var invTranId = search.lookupFields({type: record.Type.INVOICE, id: invId, columns: ["tranid"]}).tranid; 
		    	        		
		    	        		var invAmt = format.format({value: DER.getValue("custrecord_pay_import_release_amount"), type: format.Type.CURRENCY2});

		    	        		var msg = "Deposit Invoice " + "<a href='" + url.resolveRecord({recordType:record.Type.INVOICE, recordId: invId})+"'>" + invTranId + "</a> for $" + invAmt + " has been created.";
		    	        		
		    	        		log.debug(funcName, msg); 
		    	        		
						    	priMessage.prepareMessage("Deposit Created", msg, priMessage.TYPE.CONFIRMATION);

				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_payment_import_record", id: derId, editMode: false});			        		

		    	        	} else
		    	        		throw error.create({
		    	        			name: "NOT_AUTHORIZED",                    
		    	        			message: "You are not authorized to perform perform this task."
		    	        		}); 
		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_payment_import_record", id: derId, editMode: false});			        				        			
		        		}

		        		break;
	        		
	        			
	        			
                    
        		case "aea_Statement_mass_approve".toLowerCase():
        			
	        		var batchId = context.request.parameters.batchId;
        		
        			if (batchId) {
        				
                		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.APPROVING}}); 

	        			var scriptTask = task.create({
	        				taskType: 	task.TaskType.MAP_REDUCE,
	        				scriptId: 	"customscript_srs_mr_aea_mass_update_btch",
	        				params:		{custscript_mr_escrow_agent_stmt_batch_2: batchId}				
	        			});
	        			
	                    var scriptTaskId = scriptTask.submit();
	                    
	                    log.debug(funcName, "Script Scheduled: ID=" + scriptTaskId);

				    	priMessage.prepareMessage("Request Submitted", "Your request to MASS APPROVE the GENERATED detail records has been submitted.  Please refresh this record periodically to update its STATUS.", priMessage.TYPE.CONFIRMATION);

		        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_agent_stmt_batch", id: batchId, editMode: false});			        		

        			} else
        				throw "No Batch ID Specified.";

        			break; 

        		
        		case "aea_Statement_mass_reject".toLowerCase():
        			
	        		var batchId = context.request.parameters.batchId;
        		
        			if (batchId) {
        				
                		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.REJECTING}}); 

	        			var scriptTask = task.create({
	        				taskType: 	task.TaskType.MAP_REDUCE,
	        				scriptId: 	"customscript_srs_mr_aea_mass_update_btch",
	        				params:		{custscript_mr_escrow_agent_stmt_batch_2: batchId}				
	        			});
	        			
	                    var scriptTaskId = scriptTask.submit();
	                    
	                    log.debug(funcName, "Script Scheduled: ID=" + scriptTaskId);

				    	priMessage.prepareMessage("Request Submitted", "Your request to MASS REJECT the GENERATED detail records has been submitted.  Please refresh this record periodically to update its STATUS.", priMessage.TYPE.CONFIRMATION);

		        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_agent_stmt_batch", id: batchId, editMode: false});			        		

        			} else
        				throw "No Batch ID Specified.";

        			break; 
	        	
        			

        		case "aea_Statement_send".toLowerCase():
        			
	        		var batchId = context.request.parameters.batchId;
        		
        			if (batchId) {
        				
                		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.SENDING}}); 

	        			var scriptTask = task.create({
	        				taskType: 	task.TaskType.MAP_REDUCE,
	        				scriptId: 	"customscript_srs_mr_aea_mass_update_btch",
	        				params:		{custscript_mr_escrow_agent_stmt_batch_2: batchId}				
	        			});
	        			
	                    var scriptTaskId = scriptTask.submit();
	                    
	                    log.debug(funcName, "Script Scheduled: ID=" + scriptTaskId);

				    	priMessage.prepareMessage("Request Submitted", "Your request to SEND the APPROVED detail records has been submitted.  Please refresh this record periodically to update its STATUS.", priMessage.TYPE.CONFIRMATION);

		        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_agent_stmt_batch", id: batchId, editMode: false});			        		

        			} else
        				throw "No Batch ID Specified.";

        			break; 
        			
        			
        			
	        	
        		case "aea_Statement_cancel".toLowerCase():
        			
	        		var batchId = context.request.parameters.batchId;
        		
        			if (batchId) {
        				
                		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.CANCELLED}}); 

				    	priMessage.prepareMessage("Batch Cancelled", "This batch has been CANCELLED as requested.  You may not perform any further actions on it.", priMessage.TYPE.CONFIRMATION);

		        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_agent_stmt_batch", id: batchId, editMode: false});			        		

        			} else
        				throw "No Batch ID Specified.";

        			break; 
        			
        			
        			
        		case "aea_Statement_regenerate".toLowerCase():
        			
	        		var batchId = context.request.parameters.batchId;
        		
        			if (batchId) {
        				
                		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.GENERATING}}); 

	        			var scriptTask = task.create({
	        				taskType: 	task.TaskType.MAP_REDUCE,
	        				scriptId: 	"customscript_srs_mr_gen_esc_agt_stmt_dtl",
	        				params:		{custscript_mr_escrow_agent_stmt_batch_1: batchId}				
	        			});
	        			
	                    var scriptTaskId = scriptTask.submit();
	                    
	                    log.debug(funcName, "Script Scheduled: ID=" + scriptTaskId);

				    	priMessage.prepareMessage("Request Submitted", "Your request to REGENERATE new detail records has been submitted.  Please refresh this record periodically to update its STATUS.", priMessage.TYPE.CONFIRMATION);

		        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_agent_stmt_batch", id: batchId, editMode: false});			        		

        			} else
        				throw "No Batch ID Specified.";

        			break; 
        			
        			

	        	case "scheduleMonthlyStatementRecordGenerationScript".toLowerCase():
	        			
		        		var jobId = context.request.parameters.jobId;
	        		
	        			if (jobId) {
		        			var scriptTask = task.create({
		        				taskType: 	task.TaskType.MAP_REDUCE,
		        				scriptId: 	"customscript_srs_mr_gen_mthly_stmt_recs",
		        				params:		{custscript_mr_prepared_email_job_id: jobId}				
		        			});
		        			
		                    var scriptTaskId = scriptTask.submit();
		                    
		                    log.debug(funcName, "Script Scheduled: ID=" + scriptTaskId);
		                    
	        			} else
	        				throw "No Job ID Specified.";

	        			break; 

	        		
	        		case "scheduleMonthlyStatementRecordSetupScript".toLowerCase():
	        			
		        		var jobId = context.request.parameters.jobId;
	        		
	        			if (jobId) {
		        			var scriptTask = task.create({
		        				taskType: 	task.TaskType.MAP_REDUCE,
		        				scriptId: 	"customscript_srs_mr_setup_mthly_stmt_rec",
		        				params:		{custscript_mr_prepared_email_job_id_b: jobId}				
		        			});
		        			
		                    var scriptTaskId = scriptTask.submit();	        				

		                    log.debug(funcName, "Script Scheduled: ID=" + scriptTaskId);
	        			} else
	        				throw "No Job ID Specified.";

	        			break; 

	        		
		        		
	        		case "preparedEmailHandleMassStatusChange".toLowerCase():
	        			
		        		var jobId = context.request.parameters.jobId;
	        			var statusCode = context.request.parameters.statusCode; 
	        		
	        			if (jobId) {
		        			var scriptTask = task.create({
		        				taskType: 	task.TaskType.MAP_REDUCE,
		        				scriptId: 	"customscript_srs_mr_prep_eml_stat_chg",
		        				params:		{custscript_mr_prepared_email_job_id_c: jobId, custscript_mr_prepared_email_job_status: statusCode}				
		        			});
		        			
		                    var scriptTaskId = scriptTask.submit();	        				

		                    log.debug(funcName, "Script Scheduled: ID=" + scriptTaskId);
	        			} else
	        				throw "No Job ID Specified.";

	        			break; 

	        		
	        	
/******* <ATP-503> ********/        	
		        	case "approvekyc": 
		        		try {
		        			if (srsFunctions.userCanApproveKYC()) {
				        		var custId = context.request.parameters.custId;
				        		
				        		record.submitFields({type: record.Type.CUSTOMER, id: custId, values: {custentity_kyc_approved_by: runtime.getCurrentUser().id, custentity_kyc_approved_date: priLibrary.currentDateTimeStr()}}); 				        	
						    	priMessage.prepareMessage("KYC Approved", "The Deal has been flagged as KYC Approved by you.", priMessage.TYPE.CONFIRMATION);
						    	
		        			} else {
						    	priMessage.prepareMessage("Request Denied", "You are not authorized to indicate KYC Appoval.  See an administrator if you should be authorized.", priMessage.TYPE.ERROR);		        				
		        			}
		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
		        		}
	
		        		context.response.sendRedirect({type: "RECORD", identifier: record.Type.CUSTOMER, id: custId, editMode: false});			        		
						break;



						case "unapprovekyc": 
		        		try {
		        			if (srsFunctions.userCanApproveKYC()) {
				        		var custId = context.request.parameters.custId;
				        		
				        		record.submitFields({type: record.Type.CUSTOMER, id: custId, values: {custentity_kyc_approved_by: null, custentity_kyc_approved_date: null }}); 				        	
						    	priMessage.prepareMessage("KYC Approval Removed", "The Deal has removed the KYC Approval by you.", priMessage.TYPE.CONFIRMATION);
						    	
		        			} else {
						    	priMessage.prepareMessage("Request Denied", "You are not authorized to Undo a KYC Appoval.  See an administrator if you should be authorized.", priMessage.TYPE.ERROR);		        				
		        			}
		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
		        		}
	
		        		context.response.sendRedirect({type: "RECORD", identifier: record.Type.CUSTOMER, id: custId, editMode: false});			        		
						break;						
                    
						
						
						// SHAREHOLDER letters (kicked ott from SRS_UE_ReleaseApprovalProcess.js
						
		        	case "generateshareholderletterrecords":
		        		
		        		try {
			        		var rapId = context.request.parameters.rapId;

			        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_rap_shr_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.SUBLIST_GENERATION_IN_PROGRESS}}); 

			        		log.debug(funcName, "SCRIPT=" + srsConstants.SCRIPT_NAMES.GENERATE_SHAREHOLDER_LETTER_RECORDS); 
			        		
			        		qmEngine.addQueueEntry(srsConstants.QUEUE_NAMES.GENERATE_SHAREHOLDER_LETTER_RECORDS, rapId, null, true, srsConstants.SCRIPT_NAMES.GENERATE_SHAREHOLDER_LETTER_RECORDS);

					    	priMessage.prepareMessage("Request Submitted", "The request to Generate Shareholder Letter Records has been submitted to the queue.  Please refresh this record periodically to check the SHAREHOLDER LETTER STATUS.", priMessage.TYPE.CONFIRMATION);

			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
		        		}

		        		break;

		        	case "sendshareholderletters":
		        		
		        		try {
			        		var rapId = context.request.parameters.rapId;

			        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_rap_shr_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.SENDING_SHAREHOLDER_LETTERS}}); 

							var scriptTask = task.create({'taskType': task.TaskType.SCHEDULED_SCRIPT});
				            scriptTask.scriptId = srsConstants.SCRIPT_NAMES.SEND_SHAREHOLDER_LETTERS; 
				            var scriptTaskId = scriptTask.submit();

			        		// try to schedule the script to send these
			        		
					    	priMessage.prepareMessage("Request Submitted", "The request to Send Shareholder Letter Records has been submitted.  Please refresh this record periodically to view the DISTRIBUTION STATUS of each Letter.", priMessage.TYPE.CONFIRMATION);

			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
		        		}

		        		break;

		        	case "cancelshareholderletters":
		        		
		        		try {
			        		var rapId = context.request.parameters.rapId;

			        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_rap_shr_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.READY_TO_GEN_SUBLIST}}); 

					    	priMessage.prepareMessage("Process Cancelled", "The Generate Shareholder Letters process has been cancelled, and reset back to initial status.", priMessage.TYPE.CONFIRMATION);

			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
		        		}

		        		break;

		        	case "resetshareholderletters":
		        		
		        		try {
			        		var rapId = context.request.parameters.rapId;

			        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_rap_shr_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.READY_TO_GEN_SUBLIST}}); 

					    	priMessage.prepareMessage("Process Reset", "You are now ready to generation new Shareholder Letter records.", priMessage.TYPE.CONFIRMATION);

			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
		        		}

		        		break;


		        		
						
						// EXPIRATION letters (kicked ott from SRS_UE_ReleaseApprovalProcess.js
							
			        	case "generateexpirationletterrecords":
			        		
			        		try {
				        		var rapId = context.request.parameters.rapId;

				        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_exp_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.SUBLIST_GENERATION_IN_PROGRESS}}); 

				        		log.debug(funcName, "SCRIPT=" + srsConstants.SCRIPT_NAMES.GENERATE_EXPIRATION_LETTER_RECORDS); 
				        		
				        		qmEngine.addQueueEntry(srsConstants.QUEUE_NAMES.GENERATE_EXPIRATION_LETTER_RECORDS, rapId, null, true, srsConstants.SCRIPT_NAMES.GENERATE_EXPIRATION_LETTER_RECORDS);

						    	priMessage.prepareMessage("Request Submitted", "The request to Generate Expiration Letter Records has been submitted to the queue.  Please refresh this record periodically to check the EXPIRATION LETTER STATUS.", priMessage.TYPE.CONFIRMATION);

				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

			        			
			        		} catch (e) {
			        			log.error(funcName, e);
						    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
			        		}

			        		break;

			        	case "sendexpirationletters":
			        		
			        		try {
				        		var rapId = context.request.parameters.rapId;

				        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_exp_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.SENDING_SHAREHOLDER_LETTERS}}); 

								var scriptTask = task.create({'taskType': task.TaskType.SCHEDULED_SCRIPT});
					            scriptTask.scriptId = srsConstants.SCRIPT_NAMES.SEND_EXPIRATION_LETTERS; 
					            var scriptTaskId = scriptTask.submit();

				        		// try to schedule the script to send these
				        		
						    	priMessage.prepareMessage("Request Submitted", "The request to Send Expiration Letter Records has been submitted.  Please refresh this record periodically to view the DISTRIBUTION STATUS of each Letter.", priMessage.TYPE.CONFIRMATION);

				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

			        			
			        		} catch (e) {
			        			log.error(funcName, e);
						    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
			        		}

			        		break;

			        	case "cancelexpirationletters":
			        		
			        		try {
				        		var rapId = context.request.parameters.rapId;

				        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_exp_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.READY_TO_GEN_SUBLIST}}); 

						    	priMessage.prepareMessage("Process Cancelled", "The Generate Expiration Letters process has been cancelled, and reset back to initial status.", priMessage.TYPE.CONFIRMATION);

				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

			        			
			        		} catch (e) {
			        			log.error(funcName, e);
						    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
			        		}

			        		break;

			        	case "resetexpirationletters":
			        		
			        		try {
				        		var rapId = context.request.parameters.rapId;

				        		record.submitFields({type: "customrecord_escrow_payment_approvals", id: rapId, values: {custrecord_exp_letter_proc_status: srsConstants.SHAREHOLDER_LETTER_STATUS.READY_TO_GEN_SUBLIST}}); 

						    	priMessage.prepareMessage("Process Reset", "You are now ready to generation new Expiration Letter records.", priMessage.TYPE.CONFIRMATION);

				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        		

			        			
			        		} catch (e) {
			        			log.error(funcName, e);
						    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_escrow_payment_approvals", id: rapId, editMode: false});			        				        			
			        		}

			        		break;


			        		
		        		
		        		
		        		
		        	case "sendforexternalentry":
		        		
		        		try {
			        		var custId = context.request.parameters.custId;

			        		// var CUST = record.load({type: record.Type.CUSTOMER, id: custId}); 
			        		
			        		var custFields = search.lookupFields({type: record.Type.CUSTOMER, id: custId, columns: ["companyname","custentity8","custentity_enterprisedps"]});  

			        		var companyName = custFields.companyname; 

			        		if (!custFields.custentity_enterprisedps) 
			        			throw "This is not an ENTERPRISE DPS Customer record"; 

			        		
			        		var emailBody = "A new deal is ready for deal point study entry at SRS<br><br>"; 
			        		emailBody += ' "Deal: <b>' + companyName + "</b>"; 
			        		emailBody += "<br>Closing Date:<b>" + custFields.custentity8 + "</b>";
			        		
							email.send({
								'author' : runtime.getCurrentUser().id,
								'recipients' : appSettings.readAppSetting(srsConstants.LUNA_APP_NAME, "OT Email Address"),
								'subject' : "Deal ready for deal point study entry " + companyName,
								'body' : emailBody,
								'relatedRecords' : {
									'entityId' : custId
								}
							});
			        		
					    	priMessage.prepareMessage("Email Sent", "An email has been sent to the OT team.", priMessage.TYPE.CONFIRMATION);

			        		context.response.sendRedirect({type: "RECORD", identifier: "customer", id: custId, editMode: false});			        		
		        			
		        		} catch (e) {
		        			log.error(funcName, e);
		        			if (e.message)
		        				priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
		        			else
		        				priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
			        		context.response.sendRedirect({type: "RECORD", identifier: "customer", id: custId, editMode: false});			        				        			
		        		}

		        		break;

		        		//ATP-1132
		        	case "movetopaymentdashboard":

		        		try {
			        		var ersstring = context.request.parameters.exchangeRecords;
			        		var derid = context.request.parameters.derid;
			        		var ers = JSON.parse(ersstring).list;
			        		var DER = record.load({type: "customrecord_payment_import_record", id: derid});
			        		
			        		if (srsFunctions.validateDER_Promote5BERs(DER))
	    					{

			        		log.audit("ers to process  ", JSON.stringify(ers));
			        		
				        		var mapReduceTask = task.create({ taskType:task.TaskType.MAP_REDUCE });
				    			mapReduceTask.scriptId     = srsConstants.SCRIPT_NAMES.MOVE_ERS_TO_PAYMENT_DASHBOARD;
				    			//mapReduceTask.deploymentId = 'customdeploy';
				    			mapReduceTask.params = { 'custscript_exchange_records_to_update'   : ers };
			        		
				    			log.debug(funcName ,"mapReduceTask: " + JSON.stringify(mapReduceTask));
				    			var mapReduceTaskId = mapReduceTask.submit();

						    	priMessage.prepareMessage("Request Submitted", "The request to move ERs to Payment Dashboard has been submitted..", priMessage.TYPE.CONFIRMATION);

			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_payment_import_record", id: derid, editMode: false});			        		
	    					}
			        		else
			        		{
			        			priMessage.prepareMessage("Request Failed", "RSM State of DER has changed. Please review RSM Deficiencies and try again.", priMessage.TYPE.ERROR);

				        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_payment_import_record", id: derid, editMode: false});			        		
			        		}
		        			
		        		} catch (e) {
		        			log.error(funcName, e);
					    	priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);					    	
			        		context.response.sendRedirect({type: "RECORD", identifier: "customrecord_payment_import_record", id: derid, editMode: false});			        				        			
		        		}

		        		break;
		        		
		        	case "markotdpscomplete":
		        		
		        		try {
			        		var custId = context.request.parameters.custId;


			        		var dateTimeStr = format.format({value: new Date(), type: format.Type.DATETIME});
			        		
			        		record.submitFields({type: record.Type.CUSTOMER, id: custId, values: {custentity_deal_point_study_completed_by: runtime.getCurrentUser().id, custentity_deal_point_study_completed_dt: dateTimeStr}}); 
			        		
			        		
			        		var custFields = search.lookupFields({type: record.Type.CUSTOMER, id: custId, columns: ["companyname","custentity8","custentity_enterprisedps"]});  

			        		var companyName = custFields.companyname; 

			        		
			        		var emailBody = "Deal docket ready for QA<br><br>"; 
			        		emailBody += ' "Deal: <b>' + companyName + "</b>"; 
			        		emailBody += "<br>Closing Date:<b>" + custFields.custentity8 + "</b>";
			        		
							email.send({
								'author' : runtime.getCurrentUser().id,
								'recipients' : appSettings.readAppSetting(srsConstants.LUNA_APP_NAME, "QA Email Address"),
								'subject' : "Deal docket ready for QA: " + companyName,
								'body' : emailBody,
								'relatedRecords' : {
									'entityId' : custId
								}
							});
			        		
			        		
					    	priMessage.prepareMessage("Completed", "This Deal Point Study has been marked as COMPLETE.", priMessage.TYPE.CONFIRMATION);
			        		context.response.sendRedirect({type: "RECORD", identifier: "customer", id: custId, editMode: false});			        		
		        			
		        		} catch (e) {
		        			log.error(funcName, e);
		        			if (e.message)
		        				priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
		        			else
		        				priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
			        		context.response.sendRedirect({type: "RECORD", identifier: "customer", id: custId, editMode: false});			        				        			
		        		}

		        		break;

		        	case "markdpscomplete":
		        		
		        		try {
			        		var custId = context.request.parameters.custId;


			        		var dateTimeStr = format.format({value: new Date(), type: format.Type.DATETIME});
			        		
			        		record.submitFields({type: record.Type.CUSTOMER, id: custId, values: {custentity_dps_reviewed_by: runtime.getCurrentUser().id, custentity_dps_reviewed_dt: dateTimeStr}}); 
			        		
					    	priMessage.prepareMessage("Completed", "This Deal Point Study has been marked as COMPLETE.", priMessage.TYPE.CONFIRMATION);
			        		context.response.sendRedirect({type: "RECORD", identifier: "customer", id: custId, editMode: false});			        		
		        			
		        		} catch (e) {
		        			log.error(funcName, e);
		        			if (e.message)
		        				priMessage.prepareMessage("Error", e.message, priMessage.TYPE.ERROR);
		        			else
		        				priMessage.prepareMessage("Error", e, priMessage.TYPE.ERROR);
			        		context.response.sendRedirect({type: "RECORD", identifier: "customer", id: custId, editMode: false});			        				        			
		        		}

		        		break;



		        		// 
		        		
		        	default: 
		        		log.error(funcName, "action was not handled.");
		        	

	        	} // CASE
	        	
    			
	    	} catch (e) {
	    		log.error(funcName, e);
	    	}				
		} // onRequest function
		
		return {
			onRequest : onRequest
		};
});