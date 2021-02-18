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
 * This suitelet is shown on an FX Conversion Contract record, and allows the user to select one or more associated Exchange Records
 * 
 */

define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/url', 'N/ui/message', '/.bundle/132118/PRI_ServerLibrary'],		
		
function(record, runtime, search, format, serverWidget, url, message, priLibrary) {

	var scriptName = "SRS_SL_SelectFXContractExchangeRecords.";

	const PAGE_FUNCTIONS = {
			INITIAL_VIEW: 		0,
			CHANGE_CRITERIA:	1,
			SUBMIT_FORM:		2
	};

	function onRequest(context) {
		
		var funcName = scriptName + "onRequest";

		
		log.debug(funcName, "ENTERING");

    	var formPosted = (context.request.method != "GET"); 
		var msg = {title: "", text: "", type: message.Type.INFORMATION};
			       
		var selectionCriteria = {
				fxContractId:		"",
				dealId:				""
		}; 
		
    	var form = serverWidget.createForm({title: "Select Exchange Records"});
		
        try {

        	var pageFunction = (context.request.method == "GET") ? PAGE_FUNCTIONS.INITIAL_VIEW : ((context.request.parameters.custpage_refresh_action == "REFRESH") ? pageFunction = PAGE_FUNCTIONS.CHANGE_CRITERIA : pageFunction = PAGE_FUNCTIONS.SUBMIT_FORM ); 

        	
        	loadParameters(context, selectionCriteria); 

        	addSelectionFields(form, selectionCriteria);

            priLibrary.addFormRefreshFields(form, "custpage_deal_id");


            
 			var userHasPermission = true; 
 			
 			
            var theList = form.addSublist({
    	    	id: "custpage_list",
    	    	label: "Exchange Records",
    	    	type: serverWidget.SublistType.LIST
    	    });
    	    
            
            // NOTE: if you add or remove fields from this sublist, or change their sequence, then you need to review function "processFormPost" because it relies on the relative sequence of these fields
            // NOTE: if you add or remove fields from this sublist, or change their sequence, then you need to review function "processFormPost" because it relies on the relative sequence of these fields
            // NOTE: if you add or remove fields from this sublist, or change their sequence, then you need to review function "processFormPost" because it relies on the relative sequence of these fields
            // NOTE: if you add or remove fields from this sublist, or change their sequence, then you need to review function "processFormPost" because it relies on the relative sequence of these fields
            
           	theList.addField({id: "selected", type: serverWidget.FieldType.CHECKBOX, label: "Select"});
           	theList.addField({id: "wasselected", type: serverWidget.FieldType.CHECKBOX, label: "Was Select"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
    	    theList.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "id"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
    	    theList.addField({id: "link", type: serverWidget.FieldType.TEXT, label: "Exchange Record"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "name", type: serverWidget.FieldType.TEXT, label: "Shareholder"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "deal", type: serverWidget.FieldType.TEXT, label: "Deal"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "dealevent", type: serverWidget.FieldType.TEXT, label: "Deal Event"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "payouttype", type: serverWidget.FieldType.TEXT, label: "Payout Type"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "status", type: serverWidget.FieldType.TEXT, label: "Status"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
    	    theList.addField({id: "amount", type: serverWidget.FieldType.CURRENCY, label: "Certificate Amount"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});

    	    theList.addMarkAllButtons();
			
			var sublistLines = [];

			if (pageFunction == PAGE_FUNCTIONS.SUBMIT_FORM) {

                sublistLines = context.request.parameters.custpage_listdata.split(priLibrary.FORM_DELIMITERS.LINE_DELIMITER);

                processFormPost(sublistLines, selectionCriteria);

                // refresh the parent, so that the user can see the updates                
            	var html = "<script>";
            	html += "window.top.location.reload();"; 		            	
            	html += "window.close();"            		
            	html += "</script>";
            	
            	context.response.write(html);
            	return;	            		                			            	
    	    }

    	    var exchangeRecordList = getExchangeRecordList(selectionCriteria); 

    	    var lineNbr = 0; 
    	    
    	    theList.label += " (" + exchangeRecordList.length + " shown)"; 
    	    
    	    for (var ndx = 0; ndx < exchangeRecordList.length; ndx++) {
    	    	
    	    	var result = exchangeRecordList[ndx]; 
    	    	
    	    	if (result.isSelected) {
        	    	theList.setSublistValue({id: "selected",line: lineNbr, value: "T"});
        	    	theList.setSublistValue({id: "wasselected",line: lineNbr, value: "T"});    	    		
    	    	}

    			theList.setSublistValue({id: "id", line: lineNbr, value: result.id});

    			var theLink = "<a href=\"" +url.resolveRecord({recordType: "customrecord_acq_lot", recordId: result.id})+ "\" target=\"_blank\" style=\"\">"+result.id+"</a>"
    			theList.setSublistValue({id: "link", line: lineNbr, value: theLink});
    			    			
    	    	theList.setSublistValue({id: "name",line: lineNbr, value: result.shareHolder});
    	    	theList.setSublistValue({id: "deal",line: lineNbr, value: result.deal});
    	    	theList.setSublistValue({id: "dealevent",line: lineNbr, value: result.dealEvent});
    	    	theList.setSublistValue({id: "payouttype",line: lineNbr, value: result.payoutType});
    	    	theList.setSublistValue({id: "status",line: lineNbr, value: result.status});
    	    	
    	    	theList.setSublistValue({id: "amount",line: lineNbr, value: result.certAmount || 0});
    	    	
    	    	lineNbr++; 
    	    }

        } catch (e) {
    		log.error(funcName, e);

			msg.text = e.message;
			msg.title = "Error"
			msg.type = message.Type.ERROR; 
        }
	
        
        if (msg.text) {
            var fld = form.addField({
                id: "custpage_msg",
                type: serverWidget.FieldType.INLINEHTML,
                label: msg.title,
            }).updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});


            if (msg.type == message.Type.ERROR)
                fld.defaultValue = "<span style='font-size:12pt; color:red'><b>" + msg.title + ": " + msg.text + "</b></span>";
            else if (msg.type == message.Type.CONFIRMATION)
                fld.defaultValue = "<span style='font-size:12pt; color:blue'><b>" + msg.title + ": " + msg.text + "</b></span>";
            else
                fld.defaultValue = "<span style='font-size:12pt; color:black'><b>" + msg.title + ": " + msg.text + "</b></span>";
        }
        
	    if (userHasPermission) 
	    	form.addSubmitButton("Update");
	    
	    
	    context.response.writePage(form);
    	
		log.debug(funcName, "EXITING");
		        	
	}

	// ================================================================================================================================
	
	function loadParameters(context, selectionCriteria) {
    	if (context.request.parameters.custpage_recid)
    		selectionCriteria.fxContractId = context.request.parameters.custpage_recid;  
    	if (context.request.parameters.custpage_deal_id)
    		selectionCriteria.dealId = context.request.parameters.custpage_deal_id; 
	}
	
	// ================================================================================================================================
	
	
	function addSelectionFields(form, selectionCriteria) {
        fld = form.addField({
            id: "custpage_recid",
            type: serverWidget.FieldType.TEXT,
            label: "Deal Name (contains)"
        }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN}).defaultValue = selectionCriteria.fxContractId;
        
        
		var fld = form.addField({
            id: "custpage_deal_id",
            type: serverWidget.FieldType.SELECT,
            source: record.Type.CUSTOMER,
            label: "Deal",
        });

		fld.defaultValue = selectionCriteria.dealId; 
		
	}
	
	// ================================================================================================================================
		

	function processFormPost(sublistLines, selectionCriteria) {
		var funcName = scriptName + "processFormPost " + selectionCriteria.fxContractId;  

		var totalAmt = 0; 
		
        for (lineNbr = 0; lineNbr < sublistLines.length; lineNbr++) {
        	var sublistFields = sublistLines[lineNbr].split(priLibrary.FORM_DELIMITERS.FIELD_DELIMITER);

    		var isSelected = (sublistFields[0] == "T"); 
    		var wasSelected = (sublistFields[1] == "T"); 
    		var recId = sublistFields[2];  

    		if (isSelected != wasSelected) {
    			log.debug(funcName, "Selection on row " + lineNbr + " for exchange record " + recId + " changed from " + wasSelected + " to " + isSelected);
    			
    			if (isSelected) {
    				record.submitFields({type: "customrecord_acq_lot", id: recId, values: {custrecord_exrec_fx_conv_contract: selectionCriteria.fxContractId}});
    				log.debug(funcName, "Exchange Record " + recId + " linked to this contract"); 
    			} else {
    				record.submitFields({type: "customrecord_acq_lot", id: recId, values: {custrecord_exrec_fx_conv_contract: ""}})    				
    				log.debug(funcName, "Exchange Record " + recId + " cleared"); 
    			}
    		}
    		
        }
        
	}
	
	// ================================================================================================================================

	function getExchangeRecordList(selectionCriteria) {
		var funcName = scriptName + "getExchangeRecordList " + selectionCriteria.fxContractId;  
		
		const EXCHANGE_STATUS_5B = "7";		// 5b. Upon Approval Ready for Payment 
		
		log.debug(funcName, "Starting"); 
		
		// find matching Exchange Records	

		var fxContractFields = search.lookupFields({type: "customrecord_fx_conv_contract", id: selectionCriteria.fxContractId, columns: ["custrecord_fx_conv_orig_currency","custrecord_fx_conv_converted_currency"/*,"custrecord_fx_conv_der"*/]}); 
		
		log.debug(funcName, fxContractFields);
		
		
		var ssFilters = [
			        	 	["isinactive",search.Operator.IS,false]
//			        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[fxContractFields.custrecord_fx_conv_der[0].value]]
			        	 	,"AND",["custrecord_acq_loth_zzz_zzz_acqstatus",search.Operator.ANYOF,[EXCHANGE_STATUS_5B]]
			        	 	,"AND",["custrecord_acq_loth_related_trans",search.Operator.ANYOF,["@NONE@"]]
			        	 	,"AND",["custrecord_acq_loth_related_refund",search.Operator.ANYOF,["@NONE@"]]
			        	 	,"AND",["custrecord_exrec_shrhldr_settle_curr",search.Operator.ANYOF,fxContractFields.custrecord_fx_conv_converted_currency[0].value]
			        	 	,"AND",["CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,fxContractFields.custrecord_fx_conv_orig_currency[0].value]		// lot certificate currency
			        	 	,"AND",[
			        	 	        	["custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,["@NONE@"]]
			        	 	        	,"OR",["custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[selectionCriteria.fxContractId]]
			        	 	        ]
			        	 ];
		
		if (selectionCriteria.dealId) {
			ssFilters.push("AND");
			ssFilters.push(["custrecord_acq_loth_zzz_zzz_deal",search.Operator.ANYOF,[selectionCriteria.dealId]])
		}
		
		log.debug(funcName, ssFilters); 
		
		var ss = search.create({
			type:		"customrecord_acq_lot",
			filters:	ssFilters,
			columns:	[	search.createColumn({name: "internalid",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_acq_loth_zzz_zzz_shareholder",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_acq_loth_zzz_zzz_lotdelivery",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_acq_lot_payout_type",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_acq_loth_zzz_zzz_acqstatus",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_acq_loth_4_de1_lotpaymethod",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_acq_loth_zzz_zzz_deal",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_acq_lot_payment_import_record",summary: "GROUP"}),
			        	 	search.createColumn({name: "custrecord_exrec_fx_conv_contract",summary: "GROUP", sort: search.Sort.DESC}),
			        	 	search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM"})

			        	 ]
		}); 
		
		
		// 	custrecord_acq_loth_zzz_zzz_deal
		// 	custrecord_acq_lot_payment_import_record
		
		ss = priLibrary.searchAllRecords(ss); 
		
			      
		var recordList = [];
		
		for (var i = 0; i < ss.length; i++) {
			var result = ss[i]; 

			var obj = {};
			
			obj.id = result.getValue({name: "internalid",summary: "GROUP", sort: search.Sort.ASC}); 
			obj.certAmount = result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM"}); 
			obj.shareHolder = result.getText({name: "custrecord_acq_loth_zzz_zzz_shareholder",summary: "GROUP"});
			obj.lotDelivery = result.getValue({name: "custrecord_acq_loth_zzz_zzz_lotdelivery",summary: "GROUP"});
			obj.deal = result.getText({name: "custrecord_acq_loth_zzz_zzz_deal",summary: "GROUP"});
			obj.dealEvent = result.getText({name: "custrecord_acq_lot_payment_import_record",summary: "GROUP"});
			obj.payoutType = result.getText({name: "custrecord_acq_lot_payout_type",summary: "GROUP"});
			obj.status = result.getText({name: "custrecord_acq_loth_zzz_zzz_acqstatus",summary: "GROUP"});
			
			if (result.getValue({name: "custrecord_exrec_fx_conv_contract",summary: "GROUP"}) == selectionCriteria.fxContractId)
				obj.isSelected = true; 
			
			recordList.push(obj);
		}
		
		
		return recordList;
		
	}
	
	// ================================================================================================================================

	
	return {
		onRequest : onRequest
	};
});