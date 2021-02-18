//-----------------------------------------------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/*
 *
 * Takes an Escrow Agent Statement Batch record, and performs one of the following actions, depending on the current status:
 * 	APPROVE
	REJECT
	SEND
 * 
 */


/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime','N/record','N/error','N/search','N/file','N/task','N/email','N/file','./Shared/SRS_Constants','/.bundle/132118/PRI_ServerLibrary', '/.bundle/132118/PRI_AS_Engine'],
		
	function(runtime,record,error,search,file,task,email,file,srsConstants,priLibrary,appSettings) {

	var scriptName = "SRS_MR_MassUpdateEscrowAgentStatementDetails.";

//	const ESCROW_STATEMENT_SENDER = 268072;
	

	const ESCROW_AGENT_STATEMENTS_APP_NAME = "Escrow Agent Statements"; 
	
	
    function getInputData() {

		var funcName = scriptName + "getInputData";

		log.debug(funcName, "Process is starting");

		var batchId = runtime.getCurrentScript().getParameter({'name':"custscript_mr_escrow_agent_stmt_batch_2"});
		
		log.debug(funcName, "Processing Batch " + batchId); 
		
		var batchStatus = search.lookupFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, columns: ["custrecord_easb_status"]}).custrecord_easb_status; 

		var currentDetailStatus;  
		
		if (batchStatus && batchStatus.length > 0 && (batchStatus[0].value == srsConstants.AEA_STATEMENT_BATCH_STATUS.APPROVING || batchStatus[0].value == srsConstants.AEA_STATEMENT_BATCH_STATUS.REJECTING)) {
			// if we are about to approve or reject, then only take details which are in GENERATED status
			currentDetailStatus = srsConstants.AEA_STATEMENT_DETAIL_STATUS.GENERATED; 
		}

		if (batchStatus && batchStatus.length > 0 && batchStatus[0].value == srsConstants.AEA_STATEMENT_BATCH_STATUS.SENDING) {
			currentDetailStatus = srsConstants.AEA_STATEMENT_DETAIL_STATUS.APPROVED; 			
		}
		
		// if (batchStatus && batchStatus.length > 0 && batchStatus[0].value == srsConstants.AEA_STATEMENT_BATCH_STATUS.SENDING) {

		
		var detailSearch = search.create({
				type:		"customrecord_escrow_agent_stmt_detail",
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_easd_batch_id",search.Operator.ANYOF,[batchId]]
				        	    ,"AND",["custrecord_easd_status",search.Operator.ANYOF,[currentDetailStatus]]
				        	 ],
				columns:	["custrecord_easd_batch_id","custrecord_easd_batch_id.custrecord_easb_status","custrecord_easd_deal","custrecord_easd_statement", 
				        	 "custrecord_easd_deal_escrow","custrecord_easd_batch_id.custrecord_easb_thru_date","custrecord_easd_recipient","custrecord_easd_deal_contact"]
			}); 
    
		return detailSearch; 
		 		
	}
	
	
	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function map(context) {
    	var funcName = scriptName + "map ";

    	try {
    		
    		log.debug(funcName, context); 
    		
        	var obj = JSON.parse(context.value);
        	
        	var recId = obj.id; 
        	var batchId = obj.values.custrecord_easd_batch_id.value;  
        	var recStatus = obj.values["custrecord_easb_status.custrecord_easd_batch_id"].value;
        	
        	if (recStatus == srsConstants.AEA_STATEMENT_BATCH_STATUS.APPROVING) {
        		record.submitFields({type: "customrecord_escrow_agent_stmt_detail", id: recId, values: {"custrecord_easd_status": srsConstants.AEA_STATEMENT_DETAIL_STATUS.APPROVED}});
            	log.debug(funcName, "    Updating record " + recId + " to APPROVED");  
        	} else if (recStatus == srsConstants.AEA_STATEMENT_BATCH_STATUS.REJECTING) {
        		record.submitFields({type: "customrecord_escrow_agent_stmt_detail", id: recId, values: {"custrecord_easd_status": srsConstants.AEA_STATEMENT_DETAIL_STATUS.REJECTED}});
            	log.debug(funcName, "    Updating record " + recId + " to REJECTED");         		
        	} else if (recStatus == srsConstants.AEA_STATEMENT_BATCH_STATUS.SENDING) {

        		try {

	            	var dealId = obj.values.custrecord_easd_deal.value;
	            	var emailRecipient = obj.values.custrecord_easd_recipient; 
	            	
	            	if (!emailRecipient)
	            		// throw "Recipient email address is missing.";
	            		throw error.create({name: "MISSING_EMAIL_ADDRESS", message: "Recipient Email Address is Missing"}); 
	            	
	            	
	            	var dealEscrowId = obj.values.custrecord_easd_deal_escrow.value;
	            	var dealContactId = obj.values.custrecord_easd_deal_contact.value;
	            	var fileId = obj.values.custrecord_easd_statement.value;
	            	var contactId = search.lookupFields({type: "customrecord16", id: dealContactId, columns: ["custrecord60"]}).custrecord60[0].value;  
	            	
	            	var accountName = "", accountNbr = "", relMgrName = "", relMgrEmail = "", relMgrPhone = ""; 
	                var thruDate = obj.values["custrecord_easb_thru_date.custrecord_easd_batch_id"]; 
	            		
	                var dealEscrowFields = search.lookupFields({type: "customrecord_deal_escrow", id: dealEscrowId, columns: ["custrecord_de_bank_account_name", "custrecord_de_bank_account_nbr"]});
        			accountName = dealEscrowFields.custrecord_de_bank_account_name; 
        			accountNbr = dealEscrowFields.custrecord_de_bank_account_nbr; 	                
	                
	                /*
	        		var accountSearch = search.create({
	        			   type: 		record.Type.ACCOUNT,
	        			   filters:		[
	        			           		 	["isinactive","is","F"]
	        			           		 	,"AND",["custrecord_deal_escrow",search.Operator.ANYOF,[dealEscrowId]]
	        			           		 	],
	        			   columns:		["name","number"]
	        		}).run().getRange(0,1); 
	        		if (accountSearch.length > 0) {
	        			var ACCT = record.load({type: record.Type.ACCOUNT, id: accountSearch[0].id}); 
	        			accountName = ACCT.getValue("acctname");
	        			accountNbr = ACCT.getValue("acctnumber"); 
	        		}
	*/
	        		var dealFields = search.lookupFields({type: record.Type.CUSTOMER, id: dealId, columns: ["custentitycustentity_acq_deal_relationma"]});
	        		
	        		if (dealFields && dealFields.custentitycustentity_acq_deal_relationma && dealFields.custentitycustentity_acq_deal_relationma.length > 0) {
	            		var relMgrId = dealFields.custentitycustentity_acq_deal_relationma[0].value; 
	            		relMgrName = dealFields.custentitycustentity_acq_deal_relationma[0].text; 
	            		if (relMgrId) {
	                		relMgrEmail = search.lookupFields({type: record.Type.EMPLOYEE, id: relMgrId, columns: ["email"]}).email;         			
	                		relMgrPhone = search.lookupFields({type: record.Type.EMPLOYEE, id: relMgrId, columns: ["phone"]}).phone;
	            		}
	        		}
	        		
	        		var msgBody = appSettings.readAppSetting(ESCROW_AGENT_STATEMENTS_APP_NAME, "Email Body");
	        		var msgSubject = appSettings.readAppSetting(ESCROW_AGENT_STATEMENTS_APP_NAME, "Email Subject");
	        		var emailSender  = appSettings.readAppSetting(ESCROW_AGENT_STATEMENTS_APP_NAME, "Email Sender");
	        		
	        		/*
	        		var msgBody = "Hello,<p/>Thank you for choosing SRS Acquiom. Please find attached your statement dated {statementDate} for Escrow Account {escrowAccount}<p/>";
	        		msgBody += "Should you have any questions, please contact your relationship manager {relMgrName} at <a href='mailto:'${relMgrEmail}'>{relMgrEmail}</a>"; 
	        		
	        		msgBody += "<p>Thank you,<br></p><br><table width='100%' cellpadding='0' cellspacing='0' border='0'> <tbody><tr>    <td align='left'>";
	        		msgBody += "<span style='font-family:Arial; color:#121212; font-weight: bold; font-size:14px; line-height:1.5'>Client Services Team</span>   </td>  </tr>  <tr>    <td align='left'>";
	        		msgBody += "     <span style='font-family:Arial; color:#8d8d8d; font-size:14px; line-height:1.5'>SRS Acquiom</span>    </td>  </tr>  <tr>    <td height='10' style='font-size:10px; line-height:10px;'><br></td>";
	        		msgBody += "  </tr>  <tr>    <td align='left'>      <span style='font-family:Arial; color:#8d8d8d; font-size:14px; line-height:1.5'></span> <a href='tel:415.263.9018” target=' _blank'='' style='font-family:Arial; color:#121212; font-weight: normal; font-size:14px; line-height:1.5; text-decoration: underline'><span style='font-family:Arial; color:#121212; text-decoration: underline'>415.263.9018</span></a>";
	        		msgBody += "    </td>  </tr>  <tr>    <td align='left'>           <a href='mailto:support@srsacquiom.com' target='_blank' style='font-family:Arial; color:#121212; font-weight: normal; font-size:14px; line-height:1.5; text-decoration: underline'><span style='font-family:Arial; color:#121212; text-decoration: underline'>support@srsacquiom.com</span></a>";
	        		msgBody += "    </td>  </tr>  <tr>    <td align='left'>      <a href='http://srsacquiom.com/' target='_blank'><img src='https://srsacquiom.com/assets/brand/email/srsa_logo.png' width='250' alt='SRS Acquiom / Elevate Your Gain'></a>";
	        		msgBody += "    </td>  </tr>  <tr>    <td align='left'>      <a href='http://srsacquiom.com/' target='_blank' style='font-family:Arial; color:#8d8d8d; font-weight: normal; font-size:14px; line-height:1.5; text-decoration: none'><span style='font-family:Arial; color:#8d8d8d; text-decoration: underline'>srsacquiom.com</span></a>";
	        		msgBody += "    </td>  </tr>  <tr>    <td height='20' style='font-size:20px; line-height:20px;'>&nbsp;</td>  </tr></tbody></table><table align='left' cellpadding='0' cellspacing='0' border='0'>  <tbody>    <tr>";
	        		msgBody += "      <td height='10' style='border-top:1px solid #cccccc; font-size:10px; line-height:10px;'>&nbsp;</td>    </tr>    <tr>";
	        		msgBody += "      <td align='left' valign='top' style='font-family:Arial; color:#8d8d8d; font-size:10px; line-height:1.5'>";
	        		msgBody += "        We do not provide legal, financial or tax advice, and nothing in this message is intended to be used for such purpose. You must consult your own legal, investment, and tax advisor for such advice.";
	        		msgBody += "<p>This email, along with any attachments, is considered confidential and may be legally privileged, legally protected work product, and/or subject to a common interest or joint defense agreement with the intended recipient. This email may contain the impressions, conclusions, opinions, research, or theories of an attorney or a non-attorney acting on an attorney's behalf or in anticipation of litigation. This email is intended only for the addressee. If you have received this transmission in error, you are on notice of its status. Please notify us immediately by reply email and then delete or destroy any electronic and paper copies of this message. Please do not copy this email, use it for any purposes, or disclose its contents to any other person. Thank you. <br>";
	        		msgBody += "      </p></td>  </tr></tbody></table>"; 
	        		*/
	        		
	        		msgBody = msgBody.replaceAll("{escrowAccountName}", accountName);
	        		msgBody = msgBody.replaceAll("{escrowAccountNbr}", accountNbr);
	        		msgBody = msgBody.replaceAll("{relMgrName}", relMgrName); 
	        		msgBody = msgBody.replaceAll("{relMgrEmail}", relMgrEmail); 
	        		msgBody = msgBody.replaceAll("{relMgrPhone}", relMgrPhone); 
	        		msgBody = msgBody.replaceAll("{statementDate}", thruDate); 
	        		
	        		log.debug(funcName, "BODY=" + msgBody); 
	        		
	        		// var msgSubject = "Secure Email: Escrow Statement from SRS Acquiom"; 

	        		var STATEMENT = file.load({id: fileId}); 
	        		
	        		// emailRecipient = "meckberg@srsacquiom.com;boban.dragojlovic@prolecto.com"; 
	        		
        			email.send({		        				
                        'author'    : emailSender,
                        'recipients': emailRecipient, 
                        'subject'   : msgSubject,  
                        'body'      : msgBody,
                        'attachments': [STATEMENT],
                        'relatedRecords' :{
                            'entityId' : contactId
                        }
        			}); 
        			record.submitFields({type: "customrecord_escrow_agent_stmt_detail", id: recId, values: {custrecord_easd_status: srsConstants.AEA_STATEMENT_DETAIL_STATUS.SENT, custrecord_easd_error_msg: ""}});
        			log.debug(funcName, "Email sent to " + emailRecipient + " for Detail Record " + recId); 
        			
        		} catch (e) {
        			log.error(funcName, e); 
        			record.submitFields({type: "customrecord_escrow_agent_stmt_detail", id: recId, values: {custrecord_easd_error_msg: e.message}}); 
        		}
        		
        	}
        	
	    	context.write(batchId, recId);  	    	        	
    		
    	} catch (e) {
    		log.error(funcName, e); 
    	}
		
	}

	// ================================================================================================================================
	// ================================================================================================================================
	// ================================================================================================================================

    function summarize(summary) {
    	var funcName = scriptName + "summarize";

    	log.debug(funcName, summary); 
    	
    	var errorMsgs = priLibrary.extractMapReduceErrorMessages(summary);

    	if (errorMsgs && errorMsgs.length > 0) 
    		log.error(funcName, JSON.stringify(errorMsgs));
    	else {
    		var batchId;
    		var recCount = 0;
        	summary.output.iterator().each(function(key, value) {
        		batchId = key;
        		recCount++; 
        		return true;	    		
        	});
        	
        	log.debug(funcName, "BATCH=" + batchId); 
        	
        	if (batchId) {
        		var batchStatus = search.lookupFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, columns: ["custrecord_easb_status"]}).custrecord_easb_status; 
        		
        		
        		if (batchStatus && batchStatus.length > 0 && batchStatus[0].value == srsConstants.AEA_STATEMENT_BATCH_STATUS.APPROVING) {
                	log.audit(funcName, "APPROVED " + recCount + " detail records for batch " + batchId);  
            		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.READY_TO_SEND}}); 
        		} else if (batchStatus && batchStatus.length > 0 && batchStatus[0].value == srsConstants.AEA_STATEMENT_BATCH_STATUS.REJECTING) {
                	log.audit(funcName, "REJECTED " + recCount + " detail records for batch " + batchId);  
            		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.REJECTED}});         			
        		} else if (batchStatus && batchStatus.length > 0 && batchStatus[0].value == srsConstants.AEA_STATEMENT_BATCH_STATUS.SENDING) {
        			// if any are still in GENERATED status, go to GENERATED
        			// otherwise, if any are still in APPROVED status, go to READY TO SEND
        			// otherwise, go to COMPLETE
        			
            		var statusSearch = search.create({
         			   type: 		"customrecord_escrow_agent_stmt_detail",
         			   filters:		[
         			           		 	["isinactive","is","F"]
         			           		 	,"AND",["custrecord_easd_batch_id",search.Operator.ANYOF,[batchId]]
         			           		 	,"AND",["custrecord_easd_status",search.Operator.ANYOF,[srsConstants.AEA_STATEMENT_DETAIL_STATUS.GENERATED]]
         			           		 	]
            		}).run().getRange(0,1);
            		if (statusSearch.length > 0) {
                    	log.audit(funcName, "Some detail records are still in GENERATED status, so moving batch " + batchId + " to GENERATED");  
                		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.GENERATED}});         			
            		} else {
                		var statusSearch = search.create({
              			   type: 		"customrecord_escrow_agent_stmt_detail",
              			   filters:		[
              			           		 	["isinactive","is","F"]
              			           		 	,"AND",["custrecord_easd_batch_id",search.Operator.ANYOF,[batchId]]
              			           		 	,"AND",["custrecord_easd_status",search.Operator.ANYOF,[srsConstants.AEA_STATEMENT_DETAIL_STATUS.APPROVED]]
              			           		 	]
                 		}).run().getRange(0,1);
                		if (statusSearch.length > 0) {
                        	log.audit(funcName, "Some detail records are still in APPROVED status, so moving batch " + batchId + " to READY TO SEND");  
                    		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.READY_TO_SEND}});         			
                		} else {
                        	log.audit(funcName, "No detail records left to process.  Moving batch " + batchId + " to COMPLETE");  
                    		record.submitFields({type: "customrecord_escrow_agent_stmt_batch", id: batchId, values: {"custrecord_easb_status": srsConstants.AEA_STATEMENT_BATCH_STATUS.COMPLETE}});         			                			
                		}
                		
            		}
        			
        			
        		}
        	}    		
    	}
    	
    		
    	log.debug(funcName, "Exiting");    	
    }


	// ================================================================================================================================
	// ================================================================================================================================


    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };

}
);
