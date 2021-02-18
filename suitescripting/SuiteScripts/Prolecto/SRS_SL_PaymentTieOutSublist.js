//-----------------------------------------------------------------------------------------------------------
// Copyright 2020, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */


/*
 * shows all PAYMENT TIEOUT RECORDS for a given DER; designed to be shown as a tab on the DER record
 * 
 */

define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/url', 'N/ui/message', '/.bundle/132118/PRI_ServerLibrary'],		
		
function(record, runtime, search, format, serverWidget, url, message, priLibrary) {

	var scriptName = "SRS_SL_PaymentTieOutSublist.";
	
	const BUS_DEV_TEST_TRANSACTION_TAG = 196;
	const NO_STATUS_SELECTED = "@NONE@"; 

	var priorityPaymentType_Vesting = "7"; 			// ATP-1612
	var paymentSuspenseReason_Unfunded = "29"; 		// ATP-1612
	
	
	function onRequest(context) {
		
		var funcName = scriptName + "onRequest";

		log.debug(funcName, "ENTERING");

		var msg = {title: "", text: "", type: message.Type.INFORMATION};


		var selectionCriteria = {
				derId:	null
		}; 

		
    	var form = serverWidget.createForm({title: " "});
		
        try {
        	
        	selectionCriteria.derId = context.request.parameters.derId;
        	
            var theList = form.addSublist({
    	    	id: "custpage_list",
    	    	label: "Payment Tie Outs",
    	    	type: serverWidget.SublistType.LIST
    	    });
    	    
			var fieldList = []; 

    	    fieldList.push(theList.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "glaccount", type: serverWidget.FieldType.TEXT, label: "GL Account"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "currency", type: serverWidget.FieldType.TEXT, label: "Currency"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "tieout", type: serverWidget.FieldType.CURRENCY, label: "DER Tie Out"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "dealtieout", type: serverWidget.FieldType.CURRENCY, label: "Deal Tie Out"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "pmtalloc", type: serverWidget.FieldType.CURRENCY, label: "Payment Allocations"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "paidamt", type: serverWidget.FieldType.CURRENCY, label: "Paid Amount (From Certificates)"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "unpaidamt", type: serverWidget.FieldType.CURRENCY, label: "Unpaid Amount (From Certificates)"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "other", type: serverWidget.FieldType.CURRENCY, label: "Other"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
    	    fieldList.push(theList.addField({id: "glbalance", type: serverWidget.FieldType.CURRENCY, label: "GL Balance"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));

    	    var tieoutList = getPaymentTieoutList(selectionCriteria); 
    	    
    	    if (tieoutList.length == 0)
    	    	return;
    	    
    	    
//    	    log.debug(funcName, tieoutList); 
    	    
    	    var lineNbr = 0; 
    	    
    	    var tieoutFailure = false;
    	    
    	    for (var ndx = 0; ndx < tieoutList.length; ndx++) {
    	    	
    	    	var result = tieoutList[ndx]; 
    	    	
    	    	log.debug(funcName, result); 
        	    
    			var theLink = "<a href=\"" +url.resolveRecord({recordType: "customrecord_payment_tie_out", recordId: result.id})+ "\" target=\"_blank\" style=\"\">"+result.id+"</a>"        	    		
       			theList.setSublistValue({id: "id", line: lineNbr, value: theLink });

       	    	theList.setSublistValue({id: "glaccount",line: lineNbr, value: result.glAccountName});
       	    	theList.setSublistValue({id: "currency",line: lineNbr, value: result.currencyName});

       	    	theList.setSublistValue({id: "pmtalloc",line: lineNbr, value: result.paymentAllocation});
       	    	theList.setSublistValue({id: "paidamt",line: lineNbr, value: result.paidAmt});
       	    	theList.setSublistValue({id: "unpaidamt",line: lineNbr, value: result.unpaidAmt});
       	    	theList.setSublistValue({id: "other",line: lineNbr, value: result.other});
       	    	theList.setSublistValue({id: "glbalance",line: lineNbr, value: result.dtoBalanceByTransaction});       			
       	    	       	    	
       	    	var currTieOut = result.paymentAllocation - Math.abs(result.paidAmt) - Math.abs(result.unpaidAmt) - result.other;  
       	    	
       	    	currTieOut = Number(currTieOut.toFixed(2));
       	    	theList.setSublistValue({id: "tieout",line: lineNbr, value: currTieOut});
       	    	
       	    	if (currTieOut != 0.00)
       	    		tieoutFailure = true 

       	    	
    			var dealTieOut = result.dtoBalanceByTransaction 
    			- result.dtoAllocationOnUnappliedDERs
    			+ result.dto4025Balance 
    			+ result.dtoOpenShareholderInvoices
    			- result.dtoUnpaidCertificateOnApprovedDERs;

       	    	dealTieOut = Number(dealTieOut.toFixed(2));
       	    	
       	    	if (dealTieOut != 0.00)
       	    		tieoutFailure = true 
    			
       	    	theList.setSublistValue({id: "dealtieout",line: lineNbr, value: dealTieOut});

       	    	lineNbr++; 
    	    		
    	    }

    	    theList.label += " (" + lineNbr + " listed)"; 

            
            fld = form.addField({
                id: "custpage_banner_info",
                type: serverWidget.FieldType.TEXT,
                label: " "
            });         
            
            fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            
            if (tieoutFailure) 
            	var msgDetails = {
    					title: 		"Tieout Failure",
    					message:	"One or more Payment Tie Out records have non-zero Tie Out values",
    					type:		message.Type.ERROR
    				}
            else
            	var msgDetails = {
					title: 		"Tieout Success",
					message:	"All Payment Tie Out Records have Tie Out values of zero",
					type:		message.Type.INFORMATION
				}
            	
            fld.defaultValue = JSON.stringify(msgDetails);   

     
    	    form.clientScriptModulePath = "./SRS_CL_PaymentTieOutSublist.js";


        } catch (e) {
    		log.error(funcName, e);

			msg.text = e.message;
			msg.title = "Error"
			msg.type = message.Type.ERROR; 
        }
	
        if (msg.text) {
        	form.addPageInitMessage({type: msg.type, title: msg.title, message: msg.text}); 
        	log.debug(funcName, "Writing message...");
        }

    	context.response.writePage(form);

		log.debug(funcName, "EXITING");
		        	
	}

	// ================================================================================================================================

	function getPaymentTieoutList(selectionCriteria) {
		var funcName = scriptName + "getPaymentTieoutList"; 
		
		var tieoutList = []; 
		
		var ss = search.create({
			type:		"customrecord_payment_tie_out",
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pto_der_link",search.Operator.ANYOF,selectionCriteria.derId]
			        	 ],
			
			columns:	["custrecord_pto_deal","custrecord_pto_gl_account","custrecord_pto_currency","custrecord_pto_other_charges"
			        	 ,search.createColumn({name: "internalid", sort: search.Sort.ASC})]
		}); 
		
		priLibrary.startTimer();
		ss = priLibrary.searchAllRecords(ss); 
		
		log.debug(funcName, priLibrary.elapsedTimeInSeconds().toFixed(2) + " seconds to perform initial search"); 
		
		var accountList = [];

		var dealId;
		
		priLibrary.startTimer();
		for (var i = 0; i < ss.length; i++) {
			var result = ss[i]; 

			var obj = {paymentAllocation: 0, paidAmt: 0, unpaidAmt: 0, other: 0};
			
			dealId = result.getValue("custrecord_pto_deal");
						
			obj.id = result.id;
			obj.glAccountId = result.getValue("custrecord_pto_gl_account"); 
			obj.glAccountName = result.getText("custrecord_pto_gl_account"); 
			
			obj.currencyName = result.getText("custrecord_pto_currency"); 
			obj.currencyId = result.getValue("custrecord_pto_currency"); 
			obj.other = result.getValue("custrecord_pto_other_charges") || 0.0; 
			
			obj.dtoBalanceByTransaction = 0;
			obj.dtoAllocationOnUnappliedDERs = 0;
			obj.dto4025Balance = 0;
			obj.dtoOpenShareholderInvoices = 0;
			obj.dtoUnpaidCertificateOnApprovedDERs = 0;
		
			accountList.push(obj.glAccountId); 
			
			tieoutList.push(obj); 
			// tieoutList[result.id] = obj;
		}
		
		log.debug(funcName, priLibrary.elapsedTimeInSeconds().toFixed(2) + " seconds to load initial data"); 
		
		if (tieoutList.length == 0)
			return [];
				
		getPaymentAllocations(selectionCriteria.derId, tieoutList); 
		getPaidCertificateAmount(selectionCriteria.derId, tieoutList);
		getUnpaidCertificateAmount(selectionCriteria.derId, tieoutList);
		
		
		getDTOBalanceByTransaction(accountList, tieoutList); 		
		getDTOAllocationsOnUnapprovedDERs(dealId, accountList, tieoutList); 		
		getDTO004025Balance(dealId, accountList, tieoutList); 		
		getDTOOpenShareholderInvoices(dealId, accountList, tieoutList); 		
		getDTOUnpaidCertificatesOnApprovedDERs(dealId, accountList, tieoutList); 

		return tieoutList;
				
	}

	// ================================================================================================================================

	
	function getDTOUnpaidCertificatesOnApprovedDERs(dealId, accountList, tieoutList) {
		
		const LOT_STATUS_IS_APPROVED_FOR_PAYMENT = "5";
		
		var ss = search.create({
			type: 		"customrecord_acq_lot",
			filters:	[
			        	 	["isinactive","is","F"] 
			        	 	,"AND",["custrecord_acq_loth_zzz_zzz_deal",search.Operator.ANYOF,[dealId]]
			        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive","is","F"]
			        	 	,"AND",["custrecord_acq_loth_zzz_zzz_acqstatus",search.Operator.NONEOF,[LOT_STATUS_IS_APPROVED_FOR_PAYMENT]]
			        	 ],
			columns:	[
			        	 search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_currencytyp", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "GROUP"})
			        	 ,search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "custrecord_acq_lotce_zzz_zzz_parentlot",summary: "SUM", sort: search.Sort.ASC})
			        	 ]
		}).run().getRange(0,99); 
		
		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 

			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].currencyId == result.getValue({name: "custrecord_acq_lotce_zzz_zzz_currencytyp", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "GROUP"}))
					tieoutList[j].dtoUnpaidCertificateOnApprovedDERs = parseFloat(result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "custrecord_acq_lotce_zzz_zzz_parentlot",summary: "SUM"}));
		}
			
	}

	function getDTOOpenShareholderInvoices(dealId, accountList, tieoutList) {

		const CUSTOMER_CATEGORY_IS_ENTERPRISE = "2";
		const DEPT_IS_CLIENT_ACCOUNTS_ACQUIOM = "20";
		
		var ss = search.create({
			type:		record.Type.INVOICE, 
			filters:	[
			        	 	["status","anyof","CustInvc:A"] 
			        	 	,"AND",["customermain.category","anyof",CUSTOMER_CATEGORY_IS_ENTERPRISE] 
			        	 	,"AND",["department","anyof",DEPT_IS_CLIENT_ACCOUNTS_ACQUIOM] 
			        	 	,"AND",["mainline","is","T"]
			        	 	,"AND",["custbodyacq_deal_link",search.Operator.ANYOF,[dealId]]
			        	 ],
			 columns:	[
			        	 search.createColumn({name: "currency", summary: search.Summary.GROUP})
			         	 ,search.createColumn({name: "fxamount",summary: "SUM"})					        	 
			         	 ]
		}).run().getRange(0,99); 

		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 

			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].currencyId == result.getValue({name: "currency", summary: search.Summary.GROUP}))
					tieoutList[j].dtoOpenShareholderInvoices = parseFloat(result.getValue({name: "fxamount", summary: search.Summary.SUM}));
		}
	}


	function getDTO004025Balance(dealId, accountList, tieoutList) {
		
		var ss = search.create({
			type:		search.Type.TRANSACTION,
			filters:	[
			        	 	["account","anyof","3080"] 
			        	 	,"AND",["posting","is","T"] 
			        	 	,"AND",["trandate","onorbefore","lastmonth"] 
			        	 	,"AND",["sum(fxamount)","notequalto","0.00"]
			        	 	,"AND",["custbodyacq_deal_link",search.Operator.ANYOF,[dealId]]
			        	 ],
			columns:	[
			        	 search.createColumn({name: "currency", summary: search.Summary.GROUP})
					     ,search.createColumn({name: "fxamount",summary: "SUM"})					        	 
			        	 ]
		}).run().getRange(0,99); 
		
		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 

			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].currencyId == result.getValue({name: "currency", summary: search.Summary.GROUP}))
					tieoutList[j].dto4025Balance = parseFloat(result.getValue({name: "fxamount", summary: search.Summary.SUM}));
		}
		
	}
	


	function getDTOBalanceByTransaction(accountList, tieoutList) {
		
		const ACCT_410000 = "3065";
		const ACCT_800000 = "16287";
		
		var ss = search.create({
			type: 		search.Type.TRANSACTION,
			filters:	[
			        	 	["mainline","is","T"] 
			        	 	,"AND",["posting","is","T"]
			        	 	,"AND",["account.parent","anyof",[ACCT_410000,ACCT_800000]]
			        	 	,"AND",["account",search.Operator.ANYOF,accountList]


			        	 ],					        	 
			columns:	[
			        	 search.createColumn({name: "account", summary: search.Summary.GROUP})
			        	 ,search.createColumn({name: "fxamount",summary: "SUM"})
			        	 ]
		}).run().getRange(0,99); 
		
		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 
			
			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].glAccountId == result.getValue({name: "account", summary: search.Summary.GROUP}))
					tieoutList[j].dtoBalanceByTransaction = parseFloat(result.getValue({name: "fxamount", summary: "SUM"}));
		}			
	}

	
	function getDTOAllocationsOnUnapprovedDERs(dealId, accountList, tieoutList) {
		
		var ss = search.create({
			type: 		"customrecord_payment_import_record",
			filters:	[
			        	 	["isinactive","is","F"] 
			        	 	,"AND",["custrecord_pay_import_glaccount",search.Operator.ANYOF,accountList]
			        	 	,"AND",["custrecord_pay_import_deal",search.Operator.ANYOF,[dealId]]
							,"AND",["custrecord_pay_import_approved_pay",search.Operator.IS,false]
			        	 	,"AND",[["custrecord_pa_deal_event.isinactive","is","F"],"OR",["custrecord_pa_deal_event.internalidnumber","isempty",""]]
			        	 ],					        	 
			columns:	[
			        	 search.createColumn({name: "custrecord_pay_import_glaccount", summary: search.Summary.GROUP})
			        	 ,search.createColumn({name: "custrecord_pa_amount",join: "CUSTRECORD_PA_DEAL_EVENT",summary: "SUM", sort: search.Sort.ASC}),
			        	 ]
		}).run().getRange(0,99); 
		
		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 
			
			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].glAccountId == result.getValue({name: "custrecord_pay_import_glaccount", summary: search.Summary.GROUP}))
					tieoutList[j].dtoAllocationOnUnappliedDERs = parseFloat(result.getValue({name: "custrecord_pa_amount",join: "CUSTRECORD_PA_DEAL_EVENT",summary: "SUM"}) || "0");
		}			
	}


	// ================================================================================================================================
	// ================================================================================================================================
	
	function getPaymentAllocations(derId, tieoutList) {			
		var ss = search.create({
			type:		"customrecord_pmt_allocation",
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pa_deal_event",search.Operator.ANYOF,[derId]]
			        	 ],
			columns:	[
			        	 	search.createColumn({name: "custrecord_pa_payment_currency", summary: search.Summary.GROUP}),
			        	 	search.createColumn({name: "custrecord_pa_amount", summary: "sum", sort: search.Sort.ASC})
			        	 ]
		}); 
		
		ss = priLibrary.searchAllRecords(ss); 

		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 

			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].currencyId == result.getValue({name: "custrecord_pa_payment_currency", summary: search.Summary.GROUP}))
					tieoutList[j].paymentAllocation = parseFloat(result.getValue({name: "custrecord_pa_amount", summary: search.Summary.SUM}));
		}
	}

	// ================================================================================================================================
	
	function getPaidCertificateAmount(derId, tieoutList) {
	
		var ss = search.create({
			type: 			"customrecord_acq_lot",
			filters:		[
				        	 	["isinactive",search.Operator.IS,false] 
				        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_acq_loth_related_trans","noneof","@NONE@"]
				        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,derId]
				        	 	,"AND",[
				        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
				        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
				        	 	       ]
				        	 ],
			columns:		[
				        	 	search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_currencytyp", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.GROUP, sort: search.Sort.ASC})
			        		 	,search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"})
			        		 ]
		}).run().getRange(0,99);  

		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 
			
			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].currencyId == result.getValue({name: "custrecord_acq_lotce_zzz_zzz_currencytyp", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.GROUP}))
					tieoutList[j].paidAmt = parseFloat(result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"}));
		}			
	}
	
	function getUnpaidCertificateAmount(derId, tieoutList) {
		
		var ss = search.create({
			type: 			"customrecord_acq_lot",
			filters:		[
				        	 	["isinactive",search.Operator.IS,false] 
				        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_acq_loth_related_trans","anyof","@NONE@"]
				        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[derId]]
				        	 	,"AND",[
				        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
				        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
				        	 	       ]
				        	 ],
			columns:		[
				        	 	search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_currencytyp", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.GROUP})
			        		 	,search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM", sort: search.Sort.ASC})
			        		 ]
		}).run().getRange(0,99); 
		

		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 
			
			for (var j = 0; j < tieoutList.length; j++)
				if (tieoutList[j].currencyId == result.getValue({name: "custrecord_acq_lotce_zzz_zzz_currencytyp", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.GROUP}))
					tieoutList[j].unpaidAmt = parseFloat(result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"}));
		}			

	}
		
	//======================================================================================================================================
	
		return {
		onRequest : onRequest
	};
});