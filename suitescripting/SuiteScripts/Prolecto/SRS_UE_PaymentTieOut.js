//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/

/*
 * code related to the Deal Event Record record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget'
	   ,'./Shared/SRS_Constants'
	   ,'./Shared/SRS_Functions'
	   ,'/.bundle/132118/PRI_ServerLibrary'
	   ,'/.bundle/132118/PRI_AS_Engine'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary, appSettings) {
	
			var scriptName = "SRS_UE_PaymentTieOut.";

			var priorityPaymentType_Vesting = "7";			// ATP-1612 
			var paymentSuspenseReason_Unfunded = "29";		// ATP-1612

			//======================================================================================================================================
			//======================================================================================================================================
			
			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
		    	
				var REC = context.newRecord;
    			
				
				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE)) {
									
					var disableField = false;
    	        	if (!(srsFunctions.userIsAdmin() || 
    	        			(runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS && runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER)))
    	        		disableField = true;
    	        	else 
    	        		if (REC.getValue("custrecord_pto_other_charges") === "")
    	        			disableField = true;
    	        		else
    	        			if (REC.getValue("custrecord_pto_other_charges_user") == runtime.getCurrentUser().id)
    	        				disableField = true;
    	        	
    	        	if (disableField)
    	        		setFieldDisplayType(context, ["custrecord_pto_other_charges_approved"], "DISABLED"); 

					
				} // if (context.type == context.UserEventType.EDIT)

				
				
    			if (context.type == context.UserEventType.VIEW) {

    				REC.setValue("custrecord_pto_pmt_allocation", getPaymentAllocations(REC)); 
    				REC.setValue("custrecord_pto_paid_amt_from_cert", getPaidCertificateAmount(REC));
    				REC.setValue("custrecord_pto_unpaid_amt_from_cert", getUnpaidCertificateAmount(REC));
    				
    				REC.setValue("custrecord_pto_total_cert_amt", getTotalCertificateAmount(REC)); 
    				REC.setValue("custrecord_pto_paid_amt_from_rfnds", getPaidAmountFromRefunds(REC));
    				REC.setValue("custrecord_pto_fees_chgd_from_cm", getFeesChargedFromCMs(REC));
    				
    				// BAL BY TRAN
    				REC.setValue("custrecord_pto_dto_bal_by_tran", getDTOBalanceByTransaction(REC));     				
    				REC.setValue("custrecord_pto_dto_alloc_on_unapp_ders", getDTOAllocationsOnUnapprovedDERs(REC)); 
    				REC.setValue("custrecord_pto_dto_4025_bal", getDTO004025Balance(REC)); 
    				REC.setValue("custrecord_pto_dto_open_shareholder_inv", getDTOOpenShareholderInvoices(REC));
    				REC.setValue("custrecord_pto_dto_unpd_crts_appr_ders", getDTOUnpaidCertificatesOnApprovedDERs(REC));
    				
    				
    				var totalTieOut = REC.getValue("custrecord_pto_pmt_allocation") 
    					- Math.abs(REC.getValue("custrecord_pto_paid_amt_from_cert"))
    					- Math.abs(REC.getValue("custrecord_pto_unpaid_amt_from_cert"))
    					- REC.getValue("custrecord_pto_other_charges");
    				
//    				log.debug(funcName, "1=" + REC.getValue("custrecord_pto_pmt_allocation"));
//    				log.debug(funcName, "2=" + REC.getValue("custrecord_pto_paid_amt_from_cert"));
//    				log.debug(funcName, "3=" + REC.getValue("custrecord_pto_unpaid_amt_from_cert"));
//    				log.debug(funcName, "4=" + REC.getValue("custrecord_pto_other_charges"));
//    				
//    				log.debug(funcName, "tieout=" + totalTieOut); 
//    				    				
    				REC.setValue("custrecord_pto_tie_out", totalTieOut);
    				
    				var dealTieOut = REC.getValue("custrecord_pto_dto_bal_by_tran") 
    					- REC.getValue("custrecord_pto_dto_alloc_on_unapp_ders")
    					+ REC.getValue("custrecord_pto_dto_4025_bal")
    					+ REC.getValue("custrecord_pto_dto_open_shareholder_inv")
    					- REC.getValue("custrecord_pto_dto_unpd_crts_appr_ders");     					
    					
    				REC.setValue("custrecord_pto_dto_deal_tie_out", dealTieOut);     				
    			} 
    						    	
			}


			
			//======================================================================================================================================
			
			function getPaymentAllocations(REC) {
				
				var funcName = scriptName + "getPaymentAllocations " + REC.id;

				var ss = search.create({
					type:		"customrecord_pmt_allocation",
					filters:	[
					        	 	["isinactive",search.Operator.IS,false]
					        	 	,"AND",["custrecord_pa_deal_event",search.Operator.ANYOF,[REC.getValue("custrecord_pto_der_link")]]
					        	 	,"AND",["custrecord_pa_payment_currency",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
					        	 ],
					columns:	[
				                   search.createColumn({name: "custrecord_pa_amount", summary: "sum", sort: search.Sort.ASC})
					        	 ]
				}).run().getRange(0,1);
				
				log.debug(funcName, ss); 

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_pa_amount", summary: search.Summary.SUM}) || "0");				
			}

			function getPaidCertificateAmount(REC) {
			
				var funcName = scriptName + "getPaidCertificateAmount " + REC.id;

				var ss = search.create({
					type: 			"customrecord_acq_lot",
					filters:		[
						        	 	["isinactive",search.Operator.IS,false] 
						        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.getValue("custrecord_pto_der_link")]]					        	 	
						        	 	,"AND",["CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
						        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
						        	 	,"AND",["custrecord_acq_loth_related_trans","noneof","@NONE@"]
						        	 	,"AND",[			// ATP-1612
						        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
						        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
						        	 	       ]
						        	 ],
					columns:		[
					        		 	search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM", sort: search.Sort.ASC})
					        		 ]
				}).run().getRange(0,1); 

				log.debug(funcName, ss); 

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.SUM}) || "0");								
			}
			
			function getUnpaidCertificateAmount(REC) {
				
				var funcName = scriptName + "getUnpaidCertificateAmount " + REC.id;
				
				var ss = search.create({
					type: 			"customrecord_acq_lot",
					filters:		[
						        	 	["isinactive",search.Operator.IS,false] 
						        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.getValue("custrecord_pto_der_link")]]					        	 	
						        	 	,"AND",["CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
						        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
						        	 	,"AND",["custrecord_acq_loth_related_trans","anyof","@NONE@"]
						        	 	,"AND",[		
						        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
						        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
						        	 	       ]
						        	 ],
					columns:		[
					        		 	search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM", sort: search.Sort.ASC})
					        		 ]
				}).run().getRange(0,1); 
				
				log.debug(funcName, ss); 

				if (ss.length == 0)
					return 0;
				else 
					return parseFloat(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.SUM}) || "0");								
			}
			
					
			
			function getTotalCertificateAmount(REC) {
				
				var funcName = scriptName + "getTotalCertificateAmount " + REC.id;

				var ss = search.create({
					type: 			"customrecord_acq_lot",
					filters:		[
					        		 	["isinactive","is","F"] 
						        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.getValue("custrecord_pto_der_link")]]					        	 	
						        	 	,"AND",["CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
					        		 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive","is",false] 
					        		 	,"AND",[
					        		 	        ["custrecord_acq_lot_priority_payment","noneof","7"]
					        		 	        ,"OR",["custrecord_suspense_reason","anyof","29"]
					        		 	       ]
					        		 	],
					columns:		[
					        		 search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM", sort: search.Sort.ASC})
					        		 ]
				}).run().getRange(0,1); 
				
				log.debug(funcName, ss); 

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM"}) || "0");								
									
			} 
			
			
			function getPaidAmountFromRefunds(REC) {
				
				var funcName = scriptName + "getPaidAmountFromRefunds " + REC.id;

				var ss = search.create({
					type:		"customrecord_acq_lot",
					filters:	[
					        	 	["isinactive","is","F"]
					        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.getValue("custrecord_pto_der_link")]]					        	 	
					        	 	,"AND",["CUSTRECORD_ACQ_LOTH_RELATED_REFUND.currency",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
					        	 	,"AND",["custrecord_acq_loth_related_refund.mainline","is","T"] 
					        	 	,"AND",[
					        	 	        ["custrecord_acq_lot_priority_payment","noneof","7"]
					        	 	        ,"OR",["custrecord_suspense_reason","noneof","29"]
					        	 	        ]
					        	 ],
					columns:	[
					        	 search.createColumn({name: "fxamount",join: "CUSTRECORD_ACQ_LOTH_RELATED_REFUND",summary: "SUM", sort: search.Sort.ASC})
					        	 ]
				}).run().getRange(0,1); 
				
				log.debug(funcName, ss); 

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "fxamount",join: "CUSTRECORD_ACQ_LOTH_RELATED_REFUND",summary: "SUM"}) || "0");								
				
			}
			
			function getFeesChargedFromCMs(REC) {

				var funcName = scriptName + "getFeesChargedFromCMs " + REC.id;

				var ss = search.create({
					type:		"customrecord_acq_lot",
					filters:	[
							      	["isinactive","is","F"] 
					        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.getValue("custrecord_pto_der_link")]]					        	 	
					        	 	,"AND",["CUSTRECORD_ACQ_LOTH_RELATED_TRANS.currency",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
							      	,"AND",["custrecord_acq_loth_related_trans.item","anyof","178","314","315","317","316","318","179","180","181","182","183"] 
							      	,"AND",[
							      	        ["custrecord_acq_lot_priority_payment","noneof","7"]
							      	        ,"OR",["custrecord_suspense_reason","noneof","29"]
							      	        ]
							      	],
									columns:	[
									        	 	search.createColumn({name: "fxamount",join: "CUSTRECORD_ACQ_LOTH_RELATED_TRANS",summary: "SUM", sort: search.Sort.ASC})
									        	 ]
				}).run().getRange(0,1); 
							     
				log.debug(funcName, ss); 

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "fxamount",join: "CUSTRECORD_ACQ_LOTH_RELATED_TRANS",summary: "SUM"}) || "0");													
			}

			
			
			function getDTOBalanceByTransaction(REC) {
				
				var ss = search.create({
					type: 		search.Type.TRANSACTION,
					filters:	[
					        	 	["mainline","is","T"] 
					        	 	,"AND",["posting","is","T"]
					        	 	,"AND",["account.parent","anyof","3065","16287"]
					        	 	,"AND",["account",search.Operator.ANYOF,[REC.getValue("custrecord_pto_gl_account")]]


					        	 ],					        	 
					columns:	[
					        	 search.createColumn({name: "fxamount",summary: "SUM"})
					        	 ]
				}).run().getRange(0,1); 
				
				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "fxamount",summary: "SUM"}) || "0");													
			}

			


			function getDTOAllocationsOnUnapprovedDERs(REC) {
				
				var ss = search.create({
					type: 		"customrecord_payment_import_record",
					filters:	[
					        	 	["isinactive","is","F"] 
					        	 	,"AND",["custrecord_pay_import_glaccount",search.Operator.ANYOF,[REC.getValue("custrecord_pto_gl_account")]]
					        	 	,"AND",["custrecord_pay_import_deal",search.Operator.ANYOF,[REC.getValue("custrecord_pto_deal")]]
									,"AND",["custrecord_pay_import_approved_pay",search.Operator.IS,false]
					        	 	,"AND",[["custrecord_pa_deal_event.isinactive","is","F"],"OR",["custrecord_pa_deal_event.internalidnumber","isempty",""]]
					        	 ],					        	 
					columns:	[
					        	 search.createColumn({name: "custrecord_pa_amount",join: "CUSTRECORD_PA_DEAL_EVENT",summary: "SUM", sort: search.Sort.ASC}),
					        	 ]
				}).run().getRange(0,1); 
				
				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_pa_amount",join: "CUSTRECORD_PA_DEAL_EVENT",summary: "SUM"}) || "0");													
			}

			
			
			function getDTO004025Balance(REC) {
						
				var ss = search.create({
					type:		search.Type.TRANSACTION,
					filters:	[
					        	 	["account","anyof","3080"] 
					        	 	,"AND",["posting","is","T"] 
					        	 	,"AND",["trandate","onorbefore","lastmonth"] 
					        	 	,"AND",["sum(fxamount)","notequalto","0.00"]
					        	 	,"AND",["custbodyacq_deal_link",search.Operator.ANYOF,[REC.getValue("custrecord_pto_deal")]]
					        	 	,"AND",["currency",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
					        	 ],
					columns:	[
							      search.createColumn({name: "fxamount",summary: "SUM"})					        	 
					        	 ]
				}).run().getRange(0,1); 
				
				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "fxamount",summary: "SUM"}) || "0");													
			}
			
			
			function getDTOOpenShareholderInvoices(REC) {

				var ss = search.create({
					type:		record.Type.INVOICE, 
					filters:	[
					        	 	["status","anyof","CustInvc:A"] 
					        	 	,"AND",["customermain.category","anyof","2"] 
					        	 	,"AND",["department","anyof","20"] 
					        	 	,"AND",["mainline","is","T"]
					        	 	,"AND",["custbodyacq_deal_link",search.Operator.ANYOF,[REC.getValue("custrecord_pto_deal")]]
					        	 	,"AND",["currency",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
					        	 ],
					 columns:	[
					         	 search.createColumn({name: "fxamount",summary: "SUM"})					        	 
					         	 ]
				}).run().getRange(0,1); 

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "fxamount",summary: "SUM"}) || "0");													
			}

			
			function getDTOUnpaidCertificatesOnApprovedDERs(REC) {
				
				var ss = search.create({
					type: 		"customrecord_acq_lot",
					filters:	[
					        	 	["isinactive","is","F"] 
					        	 	,"AND",["custrecord_acq_loth_zzz_zzz_deal",search.Operator.ANYOF,[REC.getValue("custrecord_pto_deal")]]
					        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive","is","F"]
					        	 	,"AND",["custrecord_acq_loth_zzz_zzz_acqstatus",search.Operator.NONEOF,["5"]]
					        	 	,"AND",["CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_pto_currency")]]
					        	 ],
					columns:	[
					        	 search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "custrecord_acq_lotce_zzz_zzz_parentlot",summary: "SUM", sort: search.Sort.ASC})
					        	 ]
				}).run().getRange(0,1); 
				
				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "custrecord_acq_lotce_zzz_zzz_parentlot",summary: "SUM"}) || "0");													
					
			}
			
			//======================================================================================================================================
			//======================================================================================================================================
			
			function afterSubmit(context) {
				
		    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
				
		    	// once we establish a relationship, don't allow user to change the key information
				var REC = context.newRecord;
			}
			
			//======================================================================================================================================
			
			function setFieldDisplayType(context, fields, displayType, makeMandatory) {
				for (var i = 0; i < fields.length; i++) {
					var tempField = context.form.getField({ id:fields[i] });
					if (tempField) {
						// Only do something if the argument has been supplied
						if (typeof displayType !== 'undefined') {
							tempField.updateDisplayType({ displayType:displayType });
						}
						// Only do something if the argument has been supplied
						if (typeof makeMandatory !== 'undefined') {
							makeMandatory = makeMandatory.toUpperCase();
							switch (makeMandatory) {
								case 'MANDATORY':
									tempField.isMandatory = true;
									break;
								case 'OPTIONAL':
									tempField.isMandatory = false;
									break;
								default:
									break;
							}
						}
					}
				}
			}
			// END ATO-131
			



		//======================================================================================================================================
		//======================================================================================================================================
		return {
			      beforeLoad:beforeLoad
//			   ,beforeSubmit:beforeSubmit
//			    ,afterSubmit:afterSubmit
		}
});