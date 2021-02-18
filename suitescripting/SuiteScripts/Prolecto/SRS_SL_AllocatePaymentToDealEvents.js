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
 * shows all the matching Deal Events for a Payment, and allows the user to select where money should be allocated
 * 
 */

define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/url', 'N/ui/message', '/.bundle/132118/PRI_ServerLibrary'],		
		
function(record, runtime, search, format, serverWidget, url, message, priLibrary) {

	var scriptName = "SRS_SL_AllocatePaymentToDealEvents.";

	
	function onRequest(context) {
		
		var funcName = scriptName + "onRequest";

		log.debug(funcName, "ENTERING");

    	var tranId = context.request.parameters.custpage_tran_id;
    	
    	var formPosted = (context.request.method != "GET"); 
		var msg = {title: "", text: "", type: message.Type.INFORMATION};
			        	
    	var form = serverWidget.createForm({title: "Allocate Payment"});
		
        try {
        	
        	var fld;
        	
     		var SEL_CRITERIA_GROUP = "custpage_selection_criteria_group";

     		var SUMMARY_GROUP = "custpage_summary_group";
     		
 			fld = form.addField({
 				id: "custpage_tran_id",
 				type: serverWidget.FieldType.INTEGER,
 				label: "Transaction",
 				container : SEL_CRITERIA_GROUP		                	
 			}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN}).defaultValue = tranId; 

 			var tranFields = search.lookupFields({type: record.Type.CUSTOMER_PAYMENT, id: tranId, columns: ["fxamount"]}); 

 			fld = form.addField({
 				id: "custpage_total_amount",
 				type: serverWidget.FieldType.CURRENCY,
 				label: "Total Amount",
 				container : SEL_CRITERIA_GROUP		                	
 			}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN}).defaultValue = tranFields.fxamount;  

 			
   	    	var permissionCode = "TRAN_" + search.lookupFields({type: search.Type.TRANSACTION, id: tranId, columns: ["type"]}).type[0].value.toUpperCase();
    	    
    	    log.debug(funcName, "Permission=" + permissionCode + " | " + runtime.getCurrentUser().getPermission(permissionCode)); 
    	    
    	    var userHasPermission = (runtime.getCurrentUser().getPermission(permissionCode) == runtime.Permission.FULL || runtime.getCurrentUser().getPermission(permissionCode) == runtime.Permission.EDIT); 
     		
 			
            var theList = form.addSublist({
    	    	id: "custpage_list",
    	    	label: "Deal Events",
    	    	type: serverWidget.SublistType.LIST
    	    });
    	    
           	theList.addField({id: "selected", type: serverWidget.FieldType.CHECKBOX, label: "Apply"});
    	    theList.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
    	    theList.addField({id: "derid", type: serverWidget.FieldType.TEXT, label: "DER ID"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "name", type: serverWidget.FieldType.TEXT, label: "DER Name"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "total", type: serverWidget.FieldType.CURRENCY, label: "DER Total"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "amount", type: serverWidget.FieldType.CURRENCY, label: "Amount to Allocate"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.ENTRY});
    	    theList.addField({id: "allocated", type: serverWidget.FieldType.CURRENCY, label: "Total Already Allocated"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});

			var sublistLines = [];

    	    if (formPosted) {
                sublistLines = context.request.parameters.custpage_listdata.split(priLibrary.FORM_DELIMITERS.LINE_DELIMITER);

                processFormPost(sublistLines, tranId);

     			fld = form.addField({
     				id: "custpage_message",
     				type: serverWidget.FieldType.TEXT,
     				label: "?",
     				container : SEL_CRITERIA_GROUP		                	
     			}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN}).defaultValue = "Updates complete"; 

    	    }

    	    var dealEventList = getDealEventList(tranId); 

    	    var lineNbr = 0; 
    	    
    	    for (var ndx = 0; ndx < dealEventList.length; ndx++) {
    	    	
    	    	var result = dealEventList[ndx]; 
    	    	
    	    	if (result.isSelected) 
        	    	theList.setSublistValue({id: "selected",line: lineNbr, value: "T"});
    	    		
    	    	theList.setSublistValue({id: "id",line: lineNbr, value: result.id || " "});
    	    	theList.setSublistValue({id: "derid",line: lineNbr, value: result.derId});
    	    	
    			var derLink = "<a href=\"" +url.resolveRecord({recordType: "customrecord_payment_import_record", recordId: result.derId})+ "\" target=\"_blank\" style=\"\">"+result.name+"</a>"
    			log.debug(funcName, derLink); 
    			theList.setSublistValue({id: "name", line: lineNbr, value: derLink });

//    	    	theList.setSublistValue({id: "name",line: lineNbr, value: result.name});
    	    	theList.setSublistValue({id: "total",line: lineNbr, value: result.total || 0});

    	    	theList.setSublistValue({id: "allocated",line: lineNbr, value: result.amtAllocated || 0});

    	    	if (result.isSelected) {
        	    	theList.setSublistValue({id: "amount",line: lineNbr, value: result.amount});
    	    		
    	    	}
    	    	
    	    	lineNbr++; 
    	    }

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

	    form.clientScriptModulePath = "./SRS_CL_AllocatePaymentToDealEvents.js";

	    if (userHasPermission) {
	    	form.addSubmitButton("Save");
	    	
			form.addButton({
                id: 'custpage_enable_edit',
                label: 'Edit',
                functionName: 'enableEdit'
            });
	    }

	    
	    context.response.writePage(form);
    	
		log.debug(funcName, "EXITING");
		        	
	}

	// ================================================================================================================================
	
	function processFormPost(sublistLines, tranId) {
		var funcName = scriptName + "processFormPost " + tranId;  

		var tranFields = search.lookupFields({type: search.Type.TRANSACTION, id: tranId, columns: ["fxamount","currency"]}); 

		log.debug(funcName, tranFields); 
		
        for (lineNbr = 0; lineNbr < sublistLines.length; lineNbr++) {
        	var sublistFields = sublistLines[lineNbr].split(priLibrary.FORM_DELIMITERS.FIELD_DELIMITER);

    		var recId = sublistFields[1].trim(); 
    		var fileId = sublistFields[2]; 

    		log.debug(funcName, "line=" + lineNbr + "; recId=" + recId + "; fileId=" + fileId);  
    		
        	if (sublistFields[0] == "T") {
        		if (recId == "") {
        			var REC = record.create({type: "customrecord_pmt_allocation"});
        			
        			REC.setValue("custrecord_pa_pmt_transaction", tranId); 
        			REC.setValue("custrecord_pa_amount", sublistFields[5]); 
        			REC.setValue("custrecord_pa_deal_event", sublistFields[2]); 
        			REC.setValue("custrecord_pa_payment_amount", tranFields.fxamount); 
        			REC.setValue("custrecord_pa_payment_currency", tranFields.currency[0].value); 
        			
					REC.save();         			
        		} else {
        			var REC = record.load({type: "customrecord_pmt_allocation", id: recId});
        			REC.setValue("custrecord_pa_amount", sublistFields[5]); 
        			REC.save(); 
        		}
        	} else {
        		if (recId) {
            		log.debug(funcName, "removing allocation"); 
            		record.delete({type: "customrecord_pmt_allocation", id: recId});         			        		        			
        		}
        	}        		
        }
	}
	
	// ================================================================================================================================

	function getDealEventList(tranId) {
		var funcName = scriptName + "getDealEventList " + tranId; 
		
		// first, find all Deal Events for the selected Deal, which match the currency

		var tranFields = search.lookupFields({type: search.Type.TRANSACTION, id: tranId, columns: ["custbodyacq_deal_link","currency"]}); 

		var dealEventList = []; 
		
		log.debug(funcName, tranFields); 
		
		var ss = search.create({
			type:		"customrecord_payment_import_record",
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pay_import_deal",search.Operator.IS,tranFields.custbodyacq_deal_link[0].value]
//			        	 	,"AND",["custrecord_pay_import_currency",search.Operator.IS,tranFields.currency[0].value]
			        	 	,"AND",["custrecord_pto_der_link.custrecord_pto_currency",search.Operator.IS,tranFields.currency[0].value]	// PTM-1634: the currency of the TIE OUT record must match the desired currency
			        	 ],
			columns:	["name","custrecord_pay_import_release_amount"]
		}).run().getRange(0,1000); 
		
		log.debug(funcName, "Found " + ss.length + " Deal Events for this Deal/Currency"); 
		
		var dealList = [];
		
		for (var i = 0; i < ss.length; i++) {
			var result = ss[i]; 

			var obj = {};
			
			obj.derId = result.id; 
			obj.name = result.getValue("name"); 
			obj.total = result.getValue("custrecord_pay_import_release_amount")
			
			dealEventList.push(obj);
			dealList.push(result.id); 
		}
		
		// next find the allocation records that already exist
		
		var ss = search.create({
			type:		"customrecord_pmt_allocation",
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pa_pmt_transaction",search.Operator.IS,tranId]
			        	 ],
			columns:	["custrecord_pa_amount","custrecord_pa_deal_event"]
		}).run().getRange(0,1000); 
		
		for (var i = 0; i < ss.length; i++) {
			var result = ss[i]; 

			for (var j = 0; j < dealEventList.length; j++) {
				if (result.getValue("custrecord_pa_deal_event") == dealEventList[j].derId) {
					dealEventList[j].isSelected = true; 
					dealEventList[j].id = result.id;
					dealEventList[j].amount = result.getValue("custrecord_pa_amount"); 
					break;
				}
			}
		}

		// finally, find the total amounts allocated to each deal
		var ss = search.create({
			type:		"customrecord_pmt_allocation",
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pa_deal_event",search.Operator.ANYOF,dealList]					        	 	
			        	 ],
			columns:	[
			        	 	search.createColumn({name: "custrecord_pa_deal_event", summary: search.Summary.GROUP}),
			        	 	search.createColumn({name: "custrecord_pa_amount", summary: "sum", sort: search.Sort.ASC})
			        	 ]
		}).run().getRange(0,1000); 
		
		for (var i = 0; i < ss.length; i++) {
			var result = ss[i]; 

			for (var j = 0; j < dealEventList.length; j++) {
				if (result.getValue({name: "custrecord_pa_deal_event", summary: search.Summary.GROUP}) == dealEventList[j].derId) {
					dealEventList[j].amtAllocated = Number(result.getValue({name: "custrecord_pa_amount", summary: "sum"})).toFixed(2); 
					break;
				}
			}
		}
		
		return dealEventList;
		
	}
	
	// ================================================================================================================================

	
	return {
		onRequest : onRequest
	};
});