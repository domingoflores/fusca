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
 * code related to the Deal Escrow Record record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary) {
	
			var scriptName = "SRS_UE_Payment.";

			const SHAREHOLDER_PROCEEDS_ITEM_ID = 264;
			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    	// Changed by Ken C while smoke testing deployment to Staging 2/8/2019
		    	// const CLASS_ACQUIOM_ESCROW_AGENT = 127; 
		    	const CLASS_ACQUIOM_ESCROW_AGENT = srsConstants.CLASS.ACQUIOM_ESCROW_AGENT;
		    	// const DEPT_ACQUIOM_ESCROW_AGENT = 40;
		    	const DEPT_ACQUIOM_ESCROW_AGENT = srsConstants.DEPT.ACQUIOM_ESCROW_AGENT;
		    	
		    	var REC = context.newRecord; 
		    	
    			if (context.type == context.UserEventType.CREATE) {

    				if (REC.getValue("custbodyacq_deal_link") && REC.getValue("custbody_deal_escrow")) {
    					log.debug(funcName, "Triggering special logic"); 

    	                var accountFld = context.form.addField({
    	                    id:		'custpage_account',
    	                    label:	'Account',
    	                    type: 	'select'
    	                });

    					var ss = search.create({
    						type:		record.Type.ACCOUNT,
    						filters:	[
    						        	 	["isinactive",search.Operator.IS,false]
    						        	 	,"AND",["custrecord_deal_escrow",search.Operator.ANYOF,[REC.getValue("custbody_deal_escrow")]]
    						        	 ],
    						columns:	["name"]
    					}).run().each(function (result) {
        	                accountFld.addSelectOption({value:result.id, text: result.getValue("name")});    						
    						return true;
    					}); 
    					
    	                
    	                context.form.insertField({field: accountFld, nextfield: "trandate"}); 

    				}
    			}

    			
    			// only show the suitelet if there is a Deal on this record
    			// ATP-1185: only show the suitelet if dept/class apply
    			if (context.type == context.UserEventType.VIEW && REC.getValue("custbodyacq_deal_link") && usePaymentAllocations(context)) {
        			showPaymentAllocationSuitelet(context);     				
    			}    			
    			
			}

			
    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function afterSubmit(context) {

		    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
                log.debug('entered afterSubmit',funcName);
		    	
		    	var REC = context.newRecord; 
                log.debug('Rec.id: ' + REC.id, funcName);
		    			    	
    			if (context.type == context.UserEventType.CREATE) {

    				// ATP-1185: only create allocation if dept/class are appropriate
    				// ATP-1185: don't create allocations if this payment has been applied to a journal
    				if (usePaymentAllocations(context) && !paymentAppliedToJournal(context) && REC.getValue("custbodyacq_deal_link")) {
    					// if a specific Deal Event (custbody_deal_event) was provided, then allocate the entire payment to that Deal Event
    					// otherwise, attempt to allocate the entire amount to the first available event
    					
    					if (REC.getValue("custbody_deal_event")) {
    						var derId = REC.getValue("custbody_deal_event"); 
    						log.debug(funcName, "Deal " + derId  + " selected from UI"); 
    					} else {
    						var ss = search.create({
    							type:		"customrecord_payment_import_record",
    							filters:	[
    							        	 	["isinactive",search.Operator.IS,false]
    							        	 	,"AND",["custrecord_pay_import_deal",search.Operator.IS,REC.getValue("custbodyacq_deal_link")]
//    							        	 	,"AND",["custrecord_pay_import_currency",search.Operator.IS,REC.getValue("currency")]
    							        	 	,"AND",["custrecord_pto_der_link.custrecord_pto_currency",search.Operator.IS,REC.getValue("currency")]	// PTM-1634: the currency of the TIE OUT record must match the desired currency
    							        	 ],
    							columns:	["name","custrecord_pay_import_release_amount","custrecord_pto_der_link.internalid"]    							
    						}).run().getRange(0,10); 

    						log.debug(funcName, "Deal found through search " + JSON.stringify(ss)); 
    						
    						if (ss.length > 0) 
    							var derId = ss[0].id; 
    					}
    					
    					if (derId) 
    					{
    						//ATP-1208 Turns out that customer payment could be converted to 
    						//deposit application, in which case payment ID returned by netsuite is 0 
    						//no need to record such examples, as no payment has been created 
    						if (parseInt(REC.id,10)!== 0)
    						{
	    	        			var PA = record.create({type: "customrecord_pmt_allocation"});
	    	        			PA.setValue("custrecord_pa_pmt_transaction", REC.id); 
	    	        			PA.setValue("custrecord_pa_amount", REC.getValue("total")); 
	    	        			PA.setValue("custrecord_pa_deal_event", derId); 
	    	        			PA.setValue("custrecord_pa_payment_amount", REC.getValue("total")); 
	    	        			PA.setValue("custrecord_pa_payment_currency", REC.getValue("currency")); 
	    	        			PA.save();         			
    						}
    					}

    				}
    			}
    			
    			//ATP-1185: if this payment was applied to a Journal, it is essentially a "void" and all payment allocations associated with it should be deleted
    			if (context.type == context.UserEventType.EDIT && paymentAppliedToJournal(context)) {
    				log.debug(funcName, "Payment Applied to Journal.  Looking for Payment Allocations to delete"); 
    				var ss = search.create({
    					type:		"customrecord_pmt_allocation",
    					filters:	[
    					        	 	["custrecord_pa_pmt_transaction",search.Operator.ANYOF,[REC.id]]
    					        	 ]
    				}).run().getRange(0,1000); 
    				
    				for (var i = 0; i < ss.length; i++) {
    					log.audit(funcName, "Deleting Payment Allocation " + ss[i].id + " because this Payment has been applied to a Journal"); 
    					record.delete({type: "customrecord_pmt_allocation", id: ss[i].id}); 
    				}
    			}

    			
    			
    			//ATP-1185: deleting a PAYMENT may result in Payment Allocation record which no longer have a reference to a Payment
    			//			these should be deleted
    			if (context.type == context.UserEventType.DELETE) {
    				log.debug(funcName, "Payment just deleted.  Looking for Payment Allocations to delete"); 
    				var ss = search.create({
    					type:		"customrecord_pmt_allocation",
    					filters:	[
    					        	 	["custrecord_pa_pmt_transaction",search.Operator.ANYOF,["@NONE@"]]
    					        	 ]
    				}).run().getRange(0,1000); 
    				
    				for (var i = 0; i < ss.length; i++) {
    					log.audit(funcName, "Deleting Payment Allocation " + ss[i].id + " because it does not have a Payment reference"); 
    					record.delete({type: "customrecord_pmt_allocation", id: ss[i].id}); 
    				}
    			}

    			
			}

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function showPaymentAllocationSuitelet(context) {
				var funcName = scriptName + "showPaymentAllocationSuitelet " + context.newRecord.id; 
				
	    		var form = context.form;
				
	        	var tabName = "applications"; 

    			var newSubtabId = "custpage_tab_pmtappl";  
    			
	    		var subTab = form.getTab(tabName);

	    		if (subTab) {
		    		var batchTab = form.addSubtab({id : newSubtabId,label : "DER Allocation", tab: tabName});
					
					var scriptURL = url.resolveScript({
						scriptId : 		'customscript_srs_sl_alloc_pmt_2_der',
						deploymentId : 	'customdeploy_srs_sl_alloc_pmt_2_der',
						params : 		{custpage_tran_id: context.newRecord.id}
					});
					
					var fld = form.addField({
						id : 'custpage_pmt_allocator',
						label : 'HTML IFRAME Container',
						type : serverWidget.FieldType.INLINEHTML,
						container : newSubtabId
					});
					
					fld.defaultValue = '<iframe name="custpage_iframe_suiteletinput" '
							+ 'src="'
							+ scriptURL
							+ '&custparam_hidenavbar=T&ifrmcntnr=T'
							+ '" '
							+ 'width="100%" height="600" '
							+ 'frameborder="0" '
							+ 'longdesc="Show input UI to select and apply money to DERs"></iframe>';		    		
		    		
		    		log.debug(funcName, "EXITING");	    			
	    		} 
			}

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */

			function paymentAppliedToJournal(context) {
				var REC = context.newRecord; 
				
				for (var i = 0; i < REC.getLineCount({sublistId: "apply"}); i++) {
					if (REC.getSublistValue({sublistId: "apply", fieldId: "trantype", line: i}) == "Journal")
						return true;
				}
			}
			
			
			function usePaymentAllocations(context) {
				// determines whether this payment should use the payment allocation feature
				
				if (context.newRecord.getValue("department") != srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM || context.newRecord.getValue("class") != srsConstants.CLASS.CLIENT_ACCOUNTS_ACQUIOM)
					return false;
				
				// loop through all the applications, and if any invoice is using the "Shareholder Proceeds" item, then we're OK; otherwise we do not allocate
				
				var REC = context.newRecord; 
				
				for (var i = 0; i < REC.getLineCount({sublistId: "apply"}); i++) {
					if (REC.getSublistValue({sublistId: "apply", fieldId: "trantype", line: i}) == "CustInvc") {
						var invoiceId = REC.getSublistValue({sublistId: "apply", fieldId: "internalid", line: i});
						
						var INV = record.load({type: record.Type.INVOICE, id: invoiceId});
						
						for (var x = 0; x < INV.getLineCount({sublistId: "item"}); x++) 
							if (INV.getSublistValue({sublistId: "item", fieldId: "item", line: x}) == SHAREHOLDER_PROCEEDS_ITEM_ID) 
								return true;
					}					
				}
				
				return false;
			}

    		/* ------------------------------------------------------------------------------------------------------------------------------------------------------ */


		return {
			beforeLoad: 	beforeLoad,
			afterSubmit:	afterSubmit
		}
});
