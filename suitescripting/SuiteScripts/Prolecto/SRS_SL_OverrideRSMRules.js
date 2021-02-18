//-----------------------------------------------------------------------------------------------------------
// Copyright 2020 All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */


/*
 * allows user to override specific RSM rule on many records 
 */

define(['N/record', 'N/runtime', 'N/search', 'N/format', "N/task", 'N/error', 'N/url', 'N/ui/serverWidget', 'N/ui/message'
        ,'/.bundle/132118/PRI_AS_Engine'
        ,'/.bundle/132118/PRI_QM_Engine'
        ,'/.bundle/132118/PRI_ServerLibrary'
        ,'/.bundle/132118/PRI_BackgroundJobMonitor'],		
		
	function(record, runtime, search, format, task, error, url, ui, message, appSettings, qmEngine, priLibrary,priBackgroundJob) {

		"use strict" 
	
		var scriptName = "SRS_SL_OverrideRSMRules.";

		const APP_ID = "RSM";

		const RULE_STATUS_IS_FAILED = "4";

		const CASE_STATUS_IS_COMPLETED = "6";

		const CASE_EXISTS = "Y";
		const CASE_DOESNT_EXIST = "N";
		
				
		function onRequest(context) {
			
			var funcName = scriptName + "onRequest";
					
			const PAGE_FUNCTIONS = {
					INITIAL_VIEW: 		0,
					CHANGE_CRITERIA:	1,
					SUBMIT_FORM:		2
			};

	        try {
	        		    		
//	        	log.debug(funcName, context); 
	        	
				var msg = {title: "", text: "", type: message.Type.INFORMATION};
			
				var selectionCriteria = {
						recordType:			"customrecord_acq_lot",
						ruleId:				"103",		// the RSM rule to process; for now we are hard-coding, but in the future the user will be able to select
						dealName:			"",
						lotPaymentMethod:	"",
						casePresent:		"",						
				}; 
	        	
	        	var pageFunction = (context.request.method == "GET") ? PAGE_FUNCTIONS.INITIAL_VIEW : ((context.request.parameters.custpage_refresh_action == "REFRESH") ? pageFunction = PAGE_FUNCTIONS.CHANGE_CRITERIA : pageFunction = PAGE_FUNCTIONS.SUBMIT_FORM ); 
	        		        	
	        	var form = ui.createForm({title: "Override RSM Rules"});
	        	
	        	
	        	loadParameters(context, selectionCriteria); 

	        	log.debug(funcName, selectionCriteria); 
	        	
	        	addSelectionFields(form, selectionCriteria);

	            priLibrary.addFormRefreshFields(form, "custpage_deal_name,custpage_lot_pmt_method,custpage_case");

    			if (pageFunction == PAGE_FUNCTIONS.SUBMIT_FORM) {
    				processFormPost(context, msg); 
				}

            	var subList = createSublist(form);
            	populateSublist(form, subList, selectionCriteria); 
	            	
            	
        		form.addSubmitButton('Process Selected Records');
	        		        		            
	    	    form.clientScriptModulePath = "./SRS_CL_OverrideRSMRules.js";


	        } catch (e) {
	    		log.error(funcName, e);

				msg.text = e.message;
				msg.title = "Error"
				msg.type = message.Type.ERROR; 
	        }
		

	        if (msg.text)
	        	form.addPageInitMessage({type: msg.type, title: msg.title, message: msg.text}); 

    		context.response.writePage(form);
	        	
    		log.debug(funcName, "Usage Remaining: " + runtime.getCurrentScript().getRemainingUsage()); 
    		
		}
		
		// ================================================================================================================================

		function populateSublist(form, theList, selectionCriteria) {
			
			var funcName = scriptName + "populateSublist";
			
			var listData = [];
			
			var searchFilters = [
					        	 	["isinactive",search.Operator.IS,false]					        	 		
					        	 	,"AND",["custrecord_acq_rsm_run_status","is","T"]
					        	 	,"AND",["custrecord_acq_loth_zzz_zzz_deal.custentity_marketing_attributes","noneof","196"]
					        	 	,"AND",["custrecord_pri_rsm_rule_inst_exchg_ref.custrecord_pri_rsm_rule_inst_rule","anyof",selectionCriteria.ruleId]
					        	 	,"AND",["custrecord_pri_rsm_rule_inst_exchg_ref.custrecord_pri_rsm_rule_inst_status","anyof",[RULE_STATUS_IS_FAILED]]
					        	 	,"AND",["custrecord_acq_loth_zzz_zzz_deal","anyof","@ALL@"]
					        	 ];
			
			if (selectionCriteria.dealName) {
				searchFilters.push("AND");
				searchFilters.push(["custrecord_acq_loth_zzz_zzz_deal.entityid",search.Operator.CONTAINS,selectionCriteria.dealName]);
			}

			if (selectionCriteria.lotPaymentMethod) {
				searchFilters.push("AND");
				searchFilters.push(["custrecord_acq_loth_4_de1_lotpaymethod",search.Operator.ANYOF,[selectionCriteria.lotPaymentMethod]]);
			}

			var recSearch = search.create({
				type:		selectionCriteria.recordType,
				filters:	searchFilters,
				columns:	["custrecord_acq_loth_zzz_zzz_deal","custrecord_acq_loth_1_src_shrhldname","custrecord_acq_loth_1_de1_shrhldname","custrecord_acq_loth_2_de1_irsname","custrecord_exrec_disregarded_ent_name"
				        	 ,"custrecord_pri_rsm_rule_inst_exchg_ref.internalid","custrecord_acq_loth_4_de1_lotpaymethod","custrecord_acq_loth_5a_de1_nameonbnkacct","custrecord_acq_loth_5b_de1_frthrcrdtname"
				        	 ,"custrecord_acq_loth_5b_de1_nameonbnkacct","CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD.custrecord_de_ch_section_config","custrecord_acq_loth_5c_de1_checkspayto"
				        	 ]
			}); 
			
			recSearch = priLibrary.searchAllRecords(recSearch); 
			
			
			log.debug(funcName, "Found " + recSearch.length + " Exchange Records"); 
			
			if (recSearch.length == 0) {
				throw error.create({message:'No Exchange Records Found using these Filters.', name: 'NO_RECORDS_FOUND', notifyOff: true});
			}
			
			// now find all Case records linked to any of the instance records
			
			var ruleInstances = [];
			
			for (var i = 0; i < recSearch.length; ruleInstances.push(recSearch[i++].getValue({name: "internalid", join: "custrecord_pri_rsm_rule_inst_exchg_ref"})));
			
			var caseSearch = priLibrary.searchAllRecords(search.create({
				type:		record.Type.SUPPORT_CASE,
				filters:	[
				        	 	["isinactive",search.Operator.IS,false]
				        	 	,"AND",["custevent_rsm_rule_instance",search.Operator.ANYOF,ruleInstances]
				        	 ],
				columns:	["status","casenumber","custevent_rsm_rule_instance"]
			}));
			
			var instanceCase = {};
			
			for (var i = 0; i < caseSearch.length; i++) 
				instanceCase[caseSearch[i].getValue("custevent_rsm_rule_instance")] = {id: caseSearch[i].id, caseNumber: caseSearch[i].getValue("casenumber"), caseStatus: caseSearch[i].getValue("status")};
			
			log.debug(funcName, instanceCase); 
			
			
			var lineNbr = 0; 
			
			theList.label = "Exchange Records"; 
			
			var existCount = 0;
			
			for (var i = 0; i < recSearch.length; i++) {
				var result = recSearch[i];

				var instanceId = result.getValue({name: "internalid", join: "custrecord_pri_rsm_rule_inst_exchg_ref"});

				if (!(!instanceCase[instanceId] || instanceCase[instanceId].caseStatus == CASE_STATUS_IS_COMPLETED))
					continue;
				
				if (selectionCriteria.casePresent == CASE_EXISTS)
					if (!instanceCase[instanceId])
						continue;
				
				if (selectionCriteria.casePresent == CASE_DOESNT_EXIST)
					if (instanceCase[instanceId])
						continue;
				
				var theLink = "<a href='" + url.resolveRecord({recordType: result.recordType, recordId: result.id}) + "'>" + result.id + "</a>";
				theList.setSublistValue({id: "id", line: lineNbr, value: theLink});
				theList.setSublistValue({id: "exchangeid", line: lineNbr, value: result.id});
	   	    	
				theLink = "<a href='" + url.resolveRecord({recordType: record.Type.CUSTOMER, recordId: result.getValue("custrecord_acq_loth_zzz_zzz_deal")}) + "'>" + result.getText("custrecord_acq_loth_zzz_zzz_deal") + "</a>";				
				theList.setSublistValue({id: "deal", line: lineNbr, value: theLink});
				theList.setSublistValue({id: "de0holdername", line: lineNbr, value: "<b>" + result.getValue("custrecord_acq_loth_1_src_shrhldname") || "</b> "});
				theList.setSublistValue({id: "de1holdername", line: lineNbr, value: result.getValue("custrecord_acq_loth_1_de1_shrhldname") || " "});
				
				var de0Name = result.getValue("custrecord_acq_loth_1_src_shrhldname");
				
				var irsName;
				
				if (result.getValue("custrecord_exrec_disregarded_ent_name"))
					irsName = result.getValue("custrecord_exrec_disregarded_ent_name");
				else
					irsName = result.getValue("custrecord_acq_loth_2_de1_irsname");
				
				if (irsName != de0Name)
					irsName = "<font color='red'><b>" + irsName + "</b></font>";
				
				theList.setSublistValue({id: "irsname", line: lineNbr, value: irsName || " "});
				
				
				var payMethod = result.getText("custrecord_acq_loth_4_de1_lotpaymethod").toUpperCase();
				
				var payeeName = " ";
				if (payMethod.indexOf("ACH") >= 0)
					payeeName = result.getValue("custrecord_acq_loth_5a_de1_nameonbnkacct");
				else if (payMethod.indexOf("WIRE") >= 0) {
					if (!result.getValue("custrecord_acq_loth_5b_de1_frthrcrdtname"))
						payeeName = result.getValue("custrecord_acq_loth_5b_de1_nameonbnkacct");
					else
						payeeName = result.getValue("custrecord_acq_loth_5b_de1_nameonbnkacct") + "<br>FFC: " + result.getValue("custrecord_acq_loth_5b_de1_frthrcrdtname");
				} else if (payMethod.indexOf("CHECK") >= 0) {
					if (result.getValue("custrecord_acq_loth_5c_de1_checkspayto"))
						payeeName = result.getValue("custrecord_acq_loth_5c_de1_checkspayto");
					else
						payeeName = result.getValue("custrecord_acq_loth_1_de1_shrhldname");
				}


				if (payeeName != de0Name)
					payeeName = "<font color='red'><b>" + payeeName + "</b></font>";
					
				theList.setSublistValue({id: "payeename", line: lineNbr, value: payeeName || " "});
				
				theList.setSublistValue({id: "paymentmethod", line: lineNbr, value: result.getText("custrecord_acq_loth_4_de1_lotpaymethod") || " "});
				theList.setSublistValue({id: "configuration", line: lineNbr, value: result.getText({name: "custrecord_de_ch_section_config", join: "CUSTRECORD_ACQ_LOT_PAYMENT_IMPORT_RECORD"}) || " "});
				
				
				theLink = "<a href='" + url.resolveRecord({recordType: "customrecord_pri_rsm_rule_instance", recordId: instanceId}) + "'>" + instanceId + "</a>";
				theList.setSublistValue({id: "ruleinstance", line: lineNbr, value: theLink});

				theList.setSublistValue({id: "ruleinstanceid", line: lineNbr, value: instanceId});

				if (instanceCase[instanceId]) {
					theLink = "<a href='" + url.resolveRecord({recordType: record.Type.SUPPORT_CASE, recordId: instanceCase[instanceId].id}) + "'>" + instanceCase[instanceId].caseNumber + "</a>";
					theList.setSublistValue({id: "case", line: lineNbr, value: theLink});					
				}
				
				
				lineNbr++;
			}
			
    	    theList.label += " (" + lineNbr + " listed)"; 

		}

		
		// ================================================================================================================================
		
		function createSublist(form) {

			log.debug("createSubList","Starting "); 
			
    	    var subList = form.addSublist({
    	    	id: "custpage_list",
    	    	label: "Exchange Record List",
    	    	type: ui.SublistType.LIST
    	    });
    	    
    	    
    	    // NOTE: if you add or remove columns, then check the sublistFields[x] index in processFormPost, as that uses the columns in a POSITIONAL way
    	    // NOTE: if you add or remove columns, then check the sublistFields[x] index in processFormPost, as that uses the columns in a POSITIONAL way
    	    // NOTE: if you add or remove columns, then check the sublistFields[x] index in processFormPost, as that uses the columns in a POSITIONAL way
    	    // NOTE: if you add or remove columns, then check the sublistFields[x] index in processFormPost, as that uses the columns in a POSITIONAL way
    	    
   	    	subList.addField({id: "override", type: ui.FieldType.CHECKBOX, label: "Override"});
   	    	subList.addField({id: "createcase", type: ui.FieldType.CHECKBOX, label: "Case"});
   	    	subList.addField({id: "id", type: ui.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "exchangeid", type: ui.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:ui.FieldDisplayType.HIDDEN});
   	    	subList.addField({id: "ruleinstanceid", type: ui.FieldType.TEXT, label: "ID"}).updateDisplayType({displayType:ui.FieldDisplayType.HIDDEN});
   	    	subList.addField({id: "deal", type: ui.FieldType.TEXT, label: "Deal"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "de0holdername", type: ui.FieldType.TEXT, label: "DE0 Holder Name"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "de1holdername", type: ui.FieldType.TEXT, label: "DE1 Holder Name"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "irsname", type: ui.FieldType.TEXT, label: "IRS Name"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "payeename", type: ui.FieldType.TEXT, label: "Payee Name"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "paymentmethod", type: ui.FieldType.TEXT, label: "Payment Method"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "configuration", type: ui.FieldType.TEXT, label: "DER Configuration"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "notes", type: ui.FieldType.TEXTAREA, label: "Notes"}).updateDisplayType({displayType:ui.FieldDisplayType.ENTRY}).updateDisplaySize({width: 40, height: 1}); 
   	    	subList.addField({id: "case", type: ui.FieldType.TEXT, label: "Deficiency Case"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});
   	    	subList.addField({id: "ruleinstance", type: ui.FieldType.TEXT, label: "Rule Instance"}).updateDisplayType({displayType:ui.FieldDisplayType.DISABLED});

    	    return subList; 
		}

		// ================================================================================================================================

		function processFormPost(context, msg) {
			
            var sublistLines = context.request.parameters.custpage_listdata.split(priLibrary.FORM_DELIMITERS.LINE_DELIMITER);
            
            var QUEUE_NAME = appSettings.readAppSetting(APP_ID, "Override RSM Rules Queue Name"); 

			var qEntries = []; 
			
            for (var i = 0; i < sublistLines.length; i++) {
            	var sublistFields = sublistLines[i].split(priLibrary.FORM_DELIMITERS.FIELD_DELIMITER);
            	if (sublistFields[0] == "T" || sublistFields[1] == "T") {

            		var paramObj = {
            				exchangeId: 		sublistFields[3],
            				ruleInstanceId:		sublistFields[4],
            				notes:				sublistFields[12],
            				userId:				runtime.getCurrentUser().id            		
            		}
            		
            		if (sublistFields[1] == "T") {
            			// we are creating a new case, so we need more information
            			
            			if (!sublistFields[12] || !sublistFields[12].trim()) {
            				msg.text = "You must enter a NOTE if you request to create a case.  The NOTE field is empty on row " + (i+1) + " for Exchange Record " + sublistFields[3];
            				msg.title = "Required field NOTE is Missing";
            				msg.type = message.Type.ERROR; 
            				return;
            			}
            			
            			paramObj.caseDepartment = "35"; 	// Ops & Tech : Client Ops : Acquiom Ops
            			paramObj.caseQueue = "119";			// Payment Support
            			paramObj.caseCategory = "564";		// LOT Deficiency
            			
            			paramObj.action = "Create Case";
            		} else
            			paramObj.action = "Override Rule";
            			

					var qEntry = {
							queueName: QUEUE_NAME,
							paramString: JSON.stringify(paramObj),
							giveUpAfter: 3
					}
					
					qEntries.push(qEntry); 

            	}
           	}		


            if (qEntries.length > 0) {
            	qmEngine.addQueueEntries(qEntries);

            	// this command will kick off the map/reduce script, and then redirect the user to a suitelet where they can monitor the progress of that map/reduce script

//    			var job = task.create({taskType: task.TaskType.MAP_REDUCE, scriptId: "customscript_srs_mr_override_rsm_rules"});
//    			
//    			var jobId = job.submit(); 
    			
                var suiteletURL = url.resolveScript({
                    scriptId:          runtime.getCurrentScript().id,
                    deploymentId:      runtime.getCurrentScript().deploymentId,
                    returnExternalUrl: false
                  });

            	priBackgroundJob.scheduleJob({
            		scriptId:		"customscript_srs_mr_override_rsm_rules",
            		taskType:		task.TaskType.MAP_REDUCE,
            		processingMsg:	"Please wait while your request is processed.",
            		completeMsg:	"The script to process your request has completed.  Click <a href='" + suiteletURL + "'>here</a> to return to the Override Suitelet.",
            		failedMsg:		"There was an error while trying to process your request.  Please ask an Administrator to investigate."
            	});
            	
            } else {

				msg.text = "You did not select any rows.";
				msg.title = "Nothing Requested";
				msg.type = message.Type.INFORMATION; 

            }
            
            
		}

		// ================================================================================================================================
		
		function loadParameters(context, selectionCriteria) {
        	if (context.request.parameters.custpage_deal_name)
        		selectionCriteria.dealName = context.request.parameters.custpage_deal_name; 
        	if (context.request.parameters.custpage_lot_pmt_method)
        		selectionCriteria.lotPaymentMethod = context.request.parameters.custpage_lot_pmt_method; 
        	if (context.request.parameters.custpage_case)
        		selectionCriteria.casePresent = context.request.parameters.custpage_case; 
		}
		
		// ================================================================================================================================
		
		function addSelectionFields(form, selectionCriteria) {
	        var containerId = "filter";        
	        var grp = form.addFieldGroup({id: containerId, label: "Filters (changing these will cause the list below to refresh immediately, and all selections will have to be made again)"});

	        
	        fld = form.addField({
	            id: "custpage_deal_name",
	            type: ui.FieldType.TEXT,
	            container: containerId,
	            label: "Deal Name (contains)"
	        });         
	        fld.defaultValue = selectionCriteria.dealName;  


	        
			var fld = form.addField({
                id: "custpage_lot_pmt_method",
                type: ui.FieldType.SELECT,
	            container: containerId,                
                source: "customlist_acq_lot_payment_method",
                label: "LOT Payment Method",
            });

			fld.defaultValue = selectionCriteria.lotPaymentMethod;
			
			
			
			var fld = form.addField({
                id: "custpage_case",
                type: ui.FieldType.SELECT,
	            container: containerId,
                label: "Attached Deficiency Case",
            });

    		fld.addSelectOption({value: "", text: "Either"});            	
    		fld.addSelectOption({value: CASE_EXISTS, text: "Case Exists"});            	
    		fld.addSelectOption({value: CASE_DOESNT_EXIST, text: "Case Doesn't Exist"});            	

			fld.defaultValue = selectionCriteria.casePresent;
			
		}
		
		// ================================================================================================================================
		// ================================================================================================================================
		
	return {
		onRequest : onRequest
	};
});