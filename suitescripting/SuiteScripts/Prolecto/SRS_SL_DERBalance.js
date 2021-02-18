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
 * shows all DER records which do not "tie out" (have a balance)
 * 
 */

define(['N/record', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget', 'N/url', 'N/ui/message', '/.bundle/132118/PRI_ServerLibrary'],		
		
function(record, runtime, search, format, serverWidget, url, message, priLibrary) {

	var scriptName = "SRS_SL_DERBalance.";
	
	const BUS_DEV_TEST_TRANSACTION_TAG = 196;
	const NO_STATUS_SELECTED = "@NONE@"; 

	const VALUE_SHOW_IF_BALANCE = "Y"; 
	const VALUE_SHOW_IF_NO_BALANCE = "N";
	
	var priorityPaymentType_Vesting = "7"; 			// ATP-1612
	var paymentSuspenseReason_Unfunded = "29"; 		// ATP-1612
	
	
	function onRequest(context) {
		
		var funcName = scriptName + "onRequest";

		log.debug(funcName, "ENTERING");

		var msg = {title: "", text: "", type: message.Type.INFORMATION};


		var selectionCriteria = {
				
//				unpaidAmountMin:	"",
//				unpaidAmountMax:	"",
//				otherAmountMin:		"",
//				otherAmountMax:		"",
				derStatus:			"",
				dealName:			"",
				derPayDateMin:		"",
				derPayDateMax:		"",
				opsApprovedToPay:	"",
				unpaidAmount:		"",
				otherAmount:		"",
				showZeroBalance:	false
					
		}; 

		
    	var form = serverWidget.createForm({title: "DER Deal Events Which Do NOT Tie Out"});
		
        try {
        	
        	var generateDownload = false;
        	
    		if (context.request.parameters.custpage_download == "T")
    			generateDownload = true; 

     		
        	if (context.request.parameters.custpage_unpaid_amount)
        		selectionCriteria.unpaidAmount = context.request.parameters.custpage_unpaid_amount;
        	if (context.request.parameters.custpage_other_amount)
        		selectionCriteria.otherAmount = context.request.parameters.custpage_other_amount;
        	
        	if (context.request.parameters.custpage_pay_date_min)
        		selectionCriteria.derPayDateMin = context.request.parameters.custpage_pay_date_min;
        	if (context.request.parameters.custpage_pay_date_max)
        		selectionCriteria.derPayDateMax = context.request.parameters.custpage_pay_date_max;
        	
        	if (context.request.parameters.custpage_ops_approved_to_pay)
        		selectionCriteria.opsApprovedToPay = context.request.parameters.custpage_ops_approved_to_pay;
        	if (context.request.parameters.custpage_der_status)
        		selectionCriteria.derStatus = context.request.parameters.custpage_der_status;

        	if (context.request.parameters.custpage_deal_name)
        		selectionCriteria.dealName = context.request.parameters.custpage_deal_name;
        	
        	if (context.request.parameters.custpage_show_zero_balance)
        		selectionCriteria.showZeroBalance = (context.request.parameters.custpage_show_zero_balance == "T"); 
        	
        	log.debug(funcName, selectionCriteria); 
        	
        	addSelectionFields(form, selectionCriteria); 
        		
        	
        	// do not show results on initial display
        	if (context.request.method != "GET" || generateDownload) {
                var theList = form.addSublist({
        	    	id: "custpage_list",
        	    	label: "DERs",
        	    	type: serverWidget.SublistType.LIST
        	    });
        	    
    			var fieldList = []; 

        	    fieldList.push(theList.addField({id: "derid", type: serverWidget.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "name", type: serverWidget.FieldType.TEXT, label: "Name"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "dealname", type: serverWidget.FieldType.TEXT, label: "Deal Name"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "status", type: serverWidget.FieldType.TEXT, label: "Status"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "paydate", type: serverWidget.FieldType.DATE, label: "Pay Date"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "approved", type: serverWidget.FieldType.CHECKBOX, label: "Approved"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "pmtalloc", type: serverWidget.FieldType.CURRENCY, label: "Payment Allocations"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "paidamt", type: serverWidget.FieldType.CURRENCY, label: "Paid Amount (From Certificates)"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "unpaidamt", type: serverWidget.FieldType.CURRENCY, label: "Unpaid Amount (From Certificates)"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "other", type: serverWidget.FieldType.CURRENCY, label: "Other Charges"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));
        	    fieldList.push(theList.addField({id: "tieout", type: serverWidget.FieldType.CURRENCY, label: "Tie Out"}).updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED}));

        	    var derList = getDERList(selectionCriteria); 
        	    
        	    var derIds = Object.keys(derList);  
        	    
        	    var lineNbr = 0; 
        	    
        	    for (var ndx = 0; ndx < derIds.length; ndx++) {
        	    	
        	    	var result = derList[derIds[ndx]]; 
        	    	
        	    	var derTieout = result.paymentAllocation - Math.abs(result.paidAmt) - Math.abs(result.unpaidAmt) - result.other;  
        	    	
        	    	derTieout = Number(derTieout.toFixed(2));

        	    	if (selectionCriteria.showZeroBalance)
        	    		var showRow = true;
        	    	else
        	    		var showRow = (derTieout < -0.005 || derTieout > 0.005); 
        	    	
       	    	    if (showRow && selectionCriteria.unpaidAmount) {
       	    	    	if (selectionCriteria.unpaidAmount == VALUE_SHOW_IF_BALANCE) 
       	    	    		showRow = (result.unpaidAmt < -0.005 || result.unpaidAmt > 0.005);
       	    	    	else 
       	    	    		showRow = (result.unpaidAmt > -0.005 && result.unpaidAmt < 0.005);
       	    	    } 
       	    	    if (showRow && selectionCriteria.otherAmount) {
       	    	    	if (selectionCriteria.otherAmount == VALUE_SHOW_IF_BALANCE)
       	    	    		showRow = (result.other < -0.005 || result.other > 0.005);
       	    	    	else
       	    	    		showRow = (result.other > -0.005 && result.other < 0.005);
       	    	    } 
        	        	    	
        	    	
        	    	if (showRow) {    	    		
            	    	theList.setSublistValue({id: "derid",line: lineNbr, value: result.derId});
            	    	
            	    	if (generateDownload) 
            	    		var derLink = result.name;
            	    	else 
                			var derLink = "<a href=\"" +url.resolveRecord({recordType: "customrecord_payment_import_record", recordId: result.derId})+ "\" target=\"_blank\" style=\"\">"+result.name+"</a>"        	    		

            			theList.setSublistValue({id: "name", line: lineNbr, value: derLink });

            			theList.setSublistValue({id: "dealname", line: lineNbr, value: result.dealName || " "});
            			if (result.payDate)
            				theList.setSublistValue({id: "paydate", line: lineNbr, value: format.format({type: format.Type.DATE, value: result.payDate})});	// result.payDate
            			theList.setSublistValue({id: "approved", line: lineNbr, value: result.approved ? "T" : "F"});
            			theList.setSublistValue({id: "status", line: lineNbr, value: result.status || "?"});
            	    	theList.setSublistValue({id: "other",line: lineNbr, value: result.other || 0});
            	    	theList.setSublistValue({id: "pmtalloc",line: lineNbr, value: result.paymentAllocation || 0});
            	    	theList.setSublistValue({id: "paidamt",line: lineNbr, value: result.paidAmt || 0});
            	    	theList.setSublistValue({id: "unpaidamt",line: lineNbr, value: result.unpaidAmt || 0});
            	    	        	    	
            	    	theList.setSublistValue({id: "tieout",line: lineNbr, value: derTieout || 0});
            	    	
            	    	lineNbr++; 
        	    		
        	    	}
        	    	
        	    }

        	    theList.label += " (" + lineNbr + " listed)"; 
        		
        	} 
        	

    	    form.clientScriptModulePath = "./SRS_CL_DERBalance.js";


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

	    form.addSubmitButton('Refresh');

		form.addButton({
			id : "custpage_download",
			label : "Download",
			// functionName: "window.open(window.location+'&custpage_download=T'); console.log"
			functionName: "downloadCSV"
		});    				                    	


	    if (generateDownload) {
			var csvData = generateCSVFromSublist(theList, fieldList);
			var fileName = "DERTieOut_" + new Date().format("yyyymmdd_hhnnss") + ".csv"; 
	    	context.response.setHeader({name: "Content-Type", value: "text/csv"});
	    	context.response.setHeader({name: "Content-Disposition", value: "attachment; filename=" + fileName});
	    	context.response.write(csvData);
	    } else
	    	context.response.writePage(form);

		log.debug(funcName, "EXITING");
		        	
	}

	// ================================================================================================================================

	function generateCSVFromSublist(subList, fieldList) {
		
		var fileStr = "";
		
		for (var i = 0; i < fieldList.length; i++) {
			if (i > 0)
				fileStr += ",";
			fileStr += formatCSValue(fieldList[i].label); 
		}
		
		fileStr += "\r\n";
		
		for (var j = 0; j < subList.lineCount; j++) {
			for (var i = 0; i < fieldList.length; i++) {
				if (i > 0)
					fileStr += ",";
				fileStr += formatCSValue(subList.getSublistValue({id: fieldList[i].id, line: j})); 
			}				
			fileStr += "\r\n";				
		}
		
		return fileStr; 
		
	}
	
	

	function formatCSValue(val) {
		if (!val)
			return ""; 
		
		if (val.indexOf(",") >= 0 || val.indexOf('"') >= 0) 
			return '"' + val.replace(/"/g,'""') + '"';
		else 
			return val;				
	}
	
	
	// ================================================================================================================================

	function getDERList(selectionCriteria) {
		var funcName = scriptName + "getDERList"; 
		
		var derList = {}; 
		
		var ssFilter = [
		                ["isinactive",search.Operator.IS,false]
		                ,"AND",["custrecord_pay_import_deal.custentity_marketing_attributes",search.Operator.NONEOF,[BUS_DEV_TEST_TRANSACTION_TAG]]
		                ];
		
		
		if (selectionCriteria.opsApprovedToPay) {
			ssFilter.push("AND");
			ssFilter.push(["custrecord_pay_import_approved_pay",search.Operator.IS,selectionCriteria.opsApprovedToPay])
		}
			
		if (selectionCriteria.derPayDateMin) {
			ssFilter.push("AND");
			ssFilter.push(["custrecord_pay_import_pay_date",search.Operator.ONORAFTER,selectionCriteria.derPayDateMin]);
		}

		if (selectionCriteria.derPayDateMax) {
			ssFilter.push("AND");
			ssFilter.push(["custrecord_pay_import_pay_date",search.Operator.ONORBEFORE,selectionCriteria.derPayDateMax]);
		}

		if (selectionCriteria.derStatus) {
	    	var theList = selectionCriteria.derStatus.split(priLibrary.FORM_DELIMITERS.MULTI_SELECT_FIELD_DELIMITER);
			ssFilter.push("AND");
			ssFilter.push(["custrecord_pay_import_event_status",search.Operator.ANYOF,theList]);
		}

		if (selectionCriteria.dealName) {
			ssFilter.push("AND");
			ssFilter.push(["custrecord_pay_import_deal.entityid",search.Operator.CONTAINS,selectionCriteria.dealName]);
		}


		log.debug(funcName, ssFilter); 
		
		
		var ss = search.create({
			type:		"customrecord_payment_import_record",
			filters:	ssFilter,
			columns:	["name","custrecord_pay_import_approved_pay","custrecord_pay_import_pay_date","custrecord_pay_import_event_status","custrecord_pay_import_other_charges","custrecord_pay_import_deal",search.createColumn({name: "internalid", sort: search.Sort.ASC})]
		}); 
		
		priLibrary.startTimer();
		ss = priLibrary.searchAllRecords(ss); 
		
		log.debug(funcName, priLibrary.elapsedTimeInSeconds().toFixed(2) + " seconds to perform initial search"); 
		
		
		priLibrary.startTimer();
		for (var i = 0; i < ss.length; i++) {
			var result = ss[i]; 

			var obj = {paymentAllocation: 0, paidAmt: 0, unpaidAmt: 0, other: 0};
			
			obj.id = result.id;
			obj.derId = result.id; 
			obj.name = result.getValue("name");
			obj.approved = result.getValue("custrecord_pay_import_approved_pay");
			if (result.getValue("custrecord_pay_import_pay_date")) {
				var theDate = new Date(result.getValue("custrecord_pay_import_pay_date"));
				theDate.setHours(0);
	    		theDate.setMinutes(0);
	    		theDate.setSeconds(0);
	    		obj.payDate = theDate;
			}
			obj.dealName = result.getText("custrecord_pay_import_deal"); 
			obj.status = result.getText("custrecord_pay_import_event_status"); 
			obj.other = Number(result.getValue("custrecord_pay_import_other_charges") || "0");
	
			derList[result.id] = obj;
		}
		log.debug(funcName, priLibrary.elapsedTimeInSeconds().toFixed(2) + " seconds to load initial data"); 
		
		
		priLibrary.startTimer();
		getPaymentAllocations(derList); 
		log.debug(funcName, priLibrary.elapsedTimeInSeconds().toFixed(2) + " seconds to load Payment Allocations"); 

		priLibrary.startTimer();
		getPaidCertificateAmount(derList);
		log.debug(funcName, priLibrary.elapsedTimeInSeconds().toFixed(2) + " seconds to load Paid Certificate Amounts"); 

		priLibrary.startTimer();
		getUnpaidCertificateAmount(derList);
		log.debug(funcName, priLibrary.elapsedTimeInSeconds().toFixed(2) + " seconds to load Unpaid Certificate Amounts"); 

		
		return derList;
				
	}
	
	// ================================================================================================================================
	
	function getPaymentAllocations(derList) {			
		var ss = search.create({
			type:		"customrecord_pmt_allocation",
			filters:	[
			        	 	["isinactive",search.Operator.IS,false]
			        	 	,"AND",["custrecord_pa_deal_event",search.Operator.NONEOF,["@NONE@"]]					        	 	
			        	 ],
			columns:	[
			        	 	search.createColumn({name: "custrecord_pa_deal_event", summary: search.Summary.GROUP}),
			        	 	search.createColumn({name: "custrecord_pa_amount", summary: "sum", sort: search.Sort.ASC})
			        	 ]
		}); 
		
		ss = priLibrary.searchAllRecords(ss); 

		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 
			
			var derId = result.getValue({name: "custrecord_pa_deal_event", summary: search.Summary.GROUP}); 
			
			if (derList[derId])
				derList[derId].paymentAllocation = parseFloat(result.getValue({name: "custrecord_pa_amount", summary: search.Summary.SUM})); 
//			else
//				log.error("getPaymentAlloc","Could not find DER " + derId); 
		}
	}

	// ================================================================================================================================
	
	function getPaidCertificateAmount(derList) {
	
		var ss = search.create({
			type: 			"customrecord_acq_lot",
			filters:		[
				        	 	["isinactive",search.Operator.IS,false] 
				        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_acq_loth_related_trans","noneof","@NONE@"]
				        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.NONEOF,["@NONE@"]]					        	 	
				        	 	,"AND",[
				        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
				        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
				        	 	       ]
				        	 ],
			columns:		[
				        	 	search.createColumn({name: "custrecord_acq_lot_payment_import_record", summary: search.Summary.GROUP})
			        		 	,search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"})
			        		 ]
		}); 
		
		ss = priLibrary.searchAllRecords(ss); 

		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 
			
			var derId = result.getValue({name: "custrecord_acq_lot_payment_import_record", summary: search.Summary.GROUP}); 
			
			if (derList[derId])
				derList[derId].paidAmt = parseFloat(result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"})); 
//			else
//				log.error("getPaidCert","Could not find DER " + derId); 
		}
	}
	
	function getUnpaidCertificateAmount(derList) {
		
		var ss = search.create({
			type: 			"customrecord_acq_lot",
			filters:		[
				        	 	["isinactive",search.Operator.IS,false] 
				        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
				        	 	,"AND",["custrecord_acq_loth_related_trans","anyof","@NONE@"]
				        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.NONEOF,["@NONE@"]]					        	 	
				        	 	,"AND",[
				        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
				        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
				        	 	       ]
				        	 ],
			columns:		[
				        	 	search.createColumn({name: "custrecord_acq_lot_payment_import_record", summary: search.Summary.GROUP})
			        		 	,search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM", sort: search.Sort.ASC})
			        		 ]
		});  
		

		ss = priLibrary.searchAllRecords(ss); 

		for (var i = 0; i < ss.length; i++) {
			result = ss[i]; 
			
			var derId = result.getValue({name: "custrecord_acq_lot_payment_import_record", summary: search.Summary.GROUP}); 
			
			if (derList[derId])
				derList[derId].unpaidAmt = parseFloat(result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM"})); 
//			else
//				log.error("getUnPaidCert","Could not find DER " + derId); 
		}		
	}
		
	//======================================================================================================================================
	

	function addSelectionFields(form, selectionCriteria) {

		var funcName = scriptName + "addSelectionFields"; 
		
        var listFilter = [];
	   	 
        log.debug(funcName, selectionCriteria); 

        var containerId = "amounts";        
        var grp = form.addFieldGroup({id: containerId, label: "Balances"});
        
        fld = form.addField({
            id: "custpage_unpaid_amount",
            type: serverWidget.FieldType.SELECT,
            container: containerId,
            label: "Unpaid Amount"
        });
        fld.addSelectOption({value: "", text: ""});
        fld.addSelectOption({value: VALUE_SHOW_IF_BALANCE, text: "Yes"});
        fld.addSelectOption({value: VALUE_SHOW_IF_NO_BALANCE, text: "No"});
        
        fld.defaultValue = selectionCriteria.unpaidAmount; 

        
        
        fld = form.addField({
            id: "custpage_other_amount",
            type: serverWidget.FieldType.SELECT,
            container: containerId,
            label: "Other Charges"
        });
        fld.addSelectOption({value: "", text: ""});
        fld.addSelectOption({value: VALUE_SHOW_IF_BALANCE, text: "Yes"});
        fld.addSelectOption({value: VALUE_SHOW_IF_NO_BALANCE, text: "No"});
        
        fld.defaultValue = selectionCriteria.otherAmount; 

        
        fld = form.addField({
            id: "custpage_show_zero_balance",
            type: serverWidget.FieldType.CHECKBOX,
            container: containerId,
            label: "Include DERs with Zero Tie Out Values"
        });         
        fld.defaultValue = selectionCriteria.showZeroBalance ? "T" : "F";
        

        
        containerId = "payDate";        
        grp = form.addFieldGroup({id: containerId, label: "DER Instructed to Pay Date"});

        
        fld = form.addField({
            id: "custpage_pay_date_min",
            type: serverWidget.FieldType.DATE,
            container: containerId,
            label: "On Or After"
        });
        if (selectionCriteria.derPayDateMin)
        	fld.defaultValue = selectionCriteria.derPayDateMin;
        
        fld = form.addField({
            id: "custpage_pay_date_max",
            type: serverWidget.FieldType.DATE,
            container: containerId,
            label: "On Or Before"
        });
        if (selectionCriteria.derPayDateMax)
        	fld.defaultValue = selectionCriteria.derPayDateMax;
        fld.updateBreakType({breakType: serverWidget.FieldBreakType.STARTCOL});
        
        containerId = "other";        
        grp = form.addFieldGroup({id: containerId, label: "Other"});

        
        fld = form.addField({
            id: "custpage_der_status",
            type: serverWidget.FieldType.MULTISELECT,
            container: containerId,
            label: "Status"
        });         

        var ss = search.create({
        	type:		"customlist_pay_import_mpr_status",
        	filters:	["isinactive",search.Operator.IS,false],
        	columns:	["name"]
        }).run().getRange(0,1000);
        fld.addSelectOption({value: "", text: "         "});
        fld.addSelectOption({value: NO_STATUS_SELECTED, text: "- None -"});
        for (var i = 0; i < ss.length; i++) 
        	fld.addSelectOption({value: ss[i].id, text: ss[i].getValue("name")});
        fld.defaultValue = selectionCriteria.derStatus;
                
        
        fld = form.addField({
            id: "custpage_ops_approved_to_pay",
            type: serverWidget.FieldType.SELECT,
            container: containerId,
            label: "Operations Approved to Pay"
        });         
        fld.addSelectOption({value: "", text: "Either"});
        fld.addSelectOption({value: "T", text: "Yes"});
        fld.addSelectOption({value: "F", text: "No"});

        fld.defaultValue = selectionCriteria.opsApprovedToPay; 
   

        
        fld = form.addField({
            id: "custpage_deal_name",
            type: serverWidget.FieldType.TEXT,
            container: containerId,
            label: "Deal Name (contains)"
        });         
        fld.defaultValue = selectionCriteria.dealName;  


        
		var scriptURL = url.resolveScript({scriptId : runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId});

//		log.debug(funcName, scriptURL); 
		
        var fld = form.addField({
            id: "custpage_url",
            type: serverWidget.FieldType.TEXT,
            label: "url"
        });
        fld.defaultValue = scriptURL;   
        fld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

	}
	
	
	
	return {
		onRequest : onRequest
	};
});