//-----------------------------------------------------------------------------------------------------------
// Copyright 2018 All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */


/*
 * 
 * allows user to enter parameters for creating an Escrow Agent Statement Batch record, which will in turn create the detailed records
 * 
 */

define(["N/redirect",'N/record', 'N/runtime', 'N/search', 'N/task', 'N/format', "N/url", 'N/ui/serverWidget', 'N/ui/message', './Shared/SRS_Constants', './Shared/SRS_Functions', '/.bundle/132118/PRI_ServerLibrary', "/.bundle/132118/PRI_AS_Engine"],
		
	function(redirect,record, runtime, search, task, format, url, ui, message, srsConstants, srsFunctions, priLibrary, appSettings) {

		var scriptName = "SRS_SL_CreateEscrowAgentStatementBatch.";

		const TYPE_IS_MONTHLY = "M";
		const TYPE_IS_ADHOC = "A";
		const THIS_SCRIPT_ID = "customscript_srs_sl_cr_esc_agt_stmt_btch";
		const THIS_DEPLOYMENT_ID = "customdeploy_srs_sl_cr_esc_agt_stmt_btch";
		const APPLISTNAME = "Confirmation Messages";
		const APPSETTINGNAME = "SRS Create Escrow Agent Stmt Batch (SL) Message";
		
		var selectionCriteria = {statementType: TYPE_IS_MONTHLY, deal: "", relMgr: "", dealEscrow: "", dealContact: "", fromDate: "", thruDate: "", zeroBalanceStatements: false}; 

		var msg = {title: "", text: "", type: ""}; 
		
		//given a url and parameter, return value of the parameter
		//example
		// "script", "https://772390-sb3.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1404&deploy=1" returns 1404
		function getParameterByName(name, url) 
		{
			var retvalue = "";
			
			if (name && url)
			{
			    name = name.replace(/[\[\]]/g, "\\$&");
			    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
			    var results = regex.exec(url);
			    if (!results) 
			    {
			    	retvalue = null;
			    }
			    if (!results[2]) 
			    {
			    	retvalue = "";
			    }
			    else 
			    {
			    	retvalue = decodeURIComponent(results[2].replace(/\+/g, " "));
			    }
			}
			return retvalue;
		}
		function getScriptParameter(script, deployment, param)
		{
			var retvalue = "";
			if (script && deployment && param)
			{
				var urlloc = url.resolveScript({
	                "scriptId": script,
	                "deploymentId": deployment
	            });
				
				retvalue = getParameterByName(param, urlloc);
			}
			return retvalue;
		}

		
		
		function onRequest(context) {
			
			var funcName = scriptName + "onRequest";
						
        	var formPosted = false;

        	log.debug(funcName, context.request.parameters); 
        	
        	
        	if (context.request.method != "GET") 
        		formPosted = true;
        	
        	var form = ui.createForm({title: "Create Escrow Agent Statement Batch"});

        	if (!(runtime.getCurrentUser().role == srsConstants.USER_ROLE.ADMINISTRATOR || runtime.getCurrentUser().department == srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT || runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS || runtime.getCurrentUser().department == srsConstants.DEPT.DATA_MANAGEMENT_AND_RELEASE)) { 
   	        	form.addPageInitMessage({type: message.Type.ERROR, title: "Not Authorized", message: "Only users from GLOBAL BUSINESS DEVELOPMENT, ACQUIOM OPERATIONS, or DATA MANAGEMENT & RELEASE are authorized to use this function"}); 
   	   	    	context.response.writePage(form);
        		return; 
        	}
        	
	        try {

		if (context.request.method === "GET") 
        	{
        		if (context.request.parameters.msgid)
        		{
        			var confirmation_msg = JSON.parse(appSettings.readAppSetting(APPLISTNAME, APPSETTINGNAME, context.request.parameters.msgid));
        			if (!confirmation_msg.read)
        			{
        				msg.title = confirmation_msg.title; 
		     			msg.text = confirmation_msg.text;
		     			msg.type = confirmation_msg.type;
		     			confirmation_msg.read = true;
		     			appSettings.writeAppSetting(APPLISTNAME, APPSETTINGNAME, JSON.stringify(confirmation_msg));
        			}
        			
        		}
        	}

            	if (context.request.parameters.custpage_statement_type)
            		selectionCriteria.statementType = context.request.parameters.custpage_statement_type;
            	if (context.request.parameters.custpage_deal)
            		selectionCriteria.deal = context.request.parameters.custpage_deal;
            	if (context.request.parameters.custpage_deal_contact)
            		selectionCriteria.dealContact = context.request.parameters.custpage_deal_contact;
            	if (context.request.parameters.custpage_deal_escrow)
            		selectionCriteria.dealEscrow = context.request.parameters.custpage_deal_escrow;
            	if (context.request.parameters.custpage_rel_mgr)
            		selectionCriteria.relMgr = context.request.parameters.custpage_rel_mgr; 
            	if (context.request.parameters.custpage_from_date)
            		selectionCriteria.fromDate = context.request.parameters.custpage_from_date;
            	if (context.request.parameters.custpage_thru_date)
            		selectionCriteria.thruDate = context.request.parameters.custpage_thru_date;
            	if (context.request.parameters.custpage_include_no_trans)
            		selectionCriteria.zeroBalanceStatements = (context.request.parameters.custpage_include_no_trans == "T");
            	
            	if (context.request.parameters.custpage_refresh_action == "REFRESH")
            		formPosted = false;

	     		if (formPosted) {
	     			
	     			if (validateSelectionCriteria()) {
		     			var BATCH = record.create({type: "customrecord_escrow_agent_stmt_batch"});
		     			
		     			log.debug(funcName, selectionCriteria); 
		     			
		     			BATCH.setValue("custrecord_easb_rel_mgr", selectionCriteria.relMgr);
		     			BATCH.setValue("custrecord_easb_deal", selectionCriteria.deal);
		     			
		     			if (selectionCriteria.dealEscrow) 		     				
		     				BATCH.setValue("custrecord_easb_deal_escrow", selectionCriteria.dealEscrow.split(priLibrary.FORM_DELIMITERS.MULTI_SELECT_FIELD_DELIMITER)); 

		     			if (selectionCriteria.statementType == TYPE_IS_MONTHLY) {
			     			BATCH.setValue("custrecord_easb_monthly_statement", true);
			     			
			     			var dt = new Date(selectionCriteria.thruDate); 
			     			
			     			// dt = dt.addMonths(-1);
			     			// dt = dt.addDays(1);
			     			selectionCriteria.fromDate = dt.getMonth()+1 + "/01/" + dt.getFullYear();  			     			
		     			}

		     			BATCH.setValue("custrecord_zero_balance_statements", selectionCriteria.zeroBalanceStatements);
		     			BATCH.setValue("custrecord_easb_deal_contact", selectionCriteria.dealContact);
		     			if (selectionCriteria.fromDate)
		     				BATCH.setValue("custrecord_easb_from_date", new Date(selectionCriteria.fromDate));
		     			if (selectionCriteria.thruDate)
		     			BATCH.setValue("custrecord_easb_thru_date", new Date(selectionCriteria.thruDate)); 
		     			
		     				
		     			var batchId = BATCH.save(); 
		     			
	        			var scriptTask = task.create({
	        				taskType: 	task.TaskType.MAP_REDUCE,
	        				scriptId: 	"customscript_srs_mr_gen_esc_agt_stmt_dtl",
	        				params:		{custscript_mr_escrow_agent_stmt_batch_1: batchId}				
	        			});

	                    var scriptTaskId = scriptTask.submit();
	                    
	                    //since we are redirecting now, this will not be used 
//	                    msg.title = "Request Submitted"; 
//		     			msg.text = "Batch " + batchId + " has been created, and the detail records are getting generated.";
//		     			msg.type = message.Type.CONFIRMATION;
	                    var setting = {
	                    		"title":"Request Submitted",
	                    		"text":"Batch " + batchId + " has been created, and the detail records are getting generated.",
	                    		"type":message.Type.CONFIRMATION,
	                    		"read":false
	                    		};
	                    var confirmationid = appSettings.writeAppSetting(APPLISTNAME, APPSETTINGNAME, JSON.stringify(setting));
	                    
	                    var params = {};
	                    params.custpage_statement_type = selectionCriteria.statementType;
	                    params.custpage_deal = selectionCriteria.deal;
	                    params.custpage_deal_contact = selectionCriteria.dealContact;
	                    params.custpage_deal_escrow = selectionCriteria.dealEscrow;
	                    params.custpage_rel_mgr = selectionCriteria.relMgr;
	                    params.custpage_from_date = selectionCriteria.fromDate;
	                    params.custpage_thru_date = selectionCriteria.thruDate;
	                    params.custpage_include_no_trans = selectionCriteria.zeroBalanceStatements;
	                    params.msgid = confirmationid;
	                    
	                    
	                    
	                    redirect.toSuitelet({
	            		    scriptId: getScriptParameter(THIS_SCRIPT_ID, THIS_DEPLOYMENT_ID, "script") ,
	            		    deploymentId: getScriptParameter(THIS_SCRIPT_ID, THIS_DEPLOYMENT_ID, "deploy"),
	            		    parameters: params 
	                    });

				
	     			}	     			
	     		}

	     		addSelectionFields(form, formPosted); 

	     		
	     		
	        } catch (e) {
	    		log.error(funcName, e);

				msg.text = e.message;
				msg.title = "Error"
				msg.type = message.Type.ERROR; 
	        }

	        if (msg.text)
	        	form.addPageInitMessage({type: msg.type, title: msg.title, message: msg.text}); 

    	    form.addSubmitButton('Submit');

    	    form.clientScriptModulePath = "SuiteScripts/Prolecto/SRS_CL_CreateEscrowAgentStatementBatch.js";

   	    	context.response.writePage(form);

		} // onRequest


		// ================================================================================================================================

		function validateSelectionCriteria() {
			if (selectionCriteria.statementType == TYPE_IS_ADHOC)
				if (!selectionCriteria.fromDate) {
					msg = {title: "Missing From Date", text: "You must enter a From Date for Ad Hoc reports.", type: message.Type.ERROR};
					return false;
				}
			
			if (!selectionCriteria.thruDate) {
				msg = {title: "Missing Thru / Month End Date", text: "You must enter the Thru / Month End Date.", type: message.Type.ERROR};
				return false;
			}
			
			
			if (selectionCriteria.statementType == TYPE_IS_MONTHLY) {
				var dt1 = new Date(selectionCriteria.thruDate); 
				var dt2 = new Date(selectionCriteria.thruDate);
				dt2.addDays(1);
				
				if (dt1.getMonth() == dt2.getMonth()) {					
					msg = {title: "Invalid Month End Date", text: "For Monthly statement, you must enter the LAST date of a month.", type: message.Type.ERROR};
					return false;
				}				
			}
			
			if (selectionCriteria.statementType == TYPE_IS_ADHOC) {
				var dt1 = new Date(selectionCriteria.fromDate); 
				var dt2 = new Date(selectionCriteria.thruDate);
				
				if (dt1 > dt2) {
					msg = {title: "Invalid Date Range", text: "The FROM DATE must not be AFTER the THRU DATE.", type: message.Type.ERROR};
					return false;
					
				}
			}
			
			
			return true; 
		}

		// ================================================================================================================================
		


		function addSelectionFields(form, formPosted) {
            var fld = form.addField({
                id: "custpage_statement_type",
                type: ui.FieldType.SELECT,
                label: "Statement Type"
            });

    		fld.addSelectOption({value: TYPE_IS_MONTHLY, text: "Monthly"});
    		fld.addSelectOption({value: TYPE_IS_ADHOC, text: "Ad Hoc"});
            	
            fld.defaultValue = selectionCriteria.statementType;    


    		// var selectionCriteria = {statementType: TYPE_IS_MONTHLY, deal: "", dealEscrow: "", dealContact: "", fromDate: "", thruDate: ""}; 


            if (selectionCriteria.statementType == TYPE_IS_MONTHLY) {
                fld = form.addField({
                    id: "custpage_thru_date",
                    type: ui.FieldType.DATE,
                    label: "Month End Date"
                });
                fld.defaultValue = selectionCriteria.thruDate;             	
            } else {
                fld = form.addField({
                    id: "custpage_from_date",
                    type: ui.FieldType.DATE,
                    label: "From Date"
                });
                fld.defaultValue = selectionCriteria.fromDate;             	

                fld = form.addField({
                    id: "custpage_thru_date",
                    type: ui.FieldType.DATE,
                    label: "Thru Date"
                });
                fld.defaultValue = selectionCriteria.thruDate;             	            	
            }
            

			var relMgrList = priLibrary.searchAllRecords(search.create({
				type:		record.Type.CUSTOMER,
				filters:	[
				        	 	["custentitycustentity_acq_deal_relationma",search.Operator.NONEOF,"@NONE@"] 
				        	 	,"AND",["category",search.Operator.ANYOF,"1"] 
				        	    ,"AND",["isinactive",search.Operator.IS,false]
				        	 ],
				columns: 	[search.createColumn({name: "custentitycustentity_acq_deal_relationma", summary: search.Summary.GROUP})
				         	 ,search.createColumn({name: "internalid",join: "CUSTENTITYCUSTENTITY_ACQ_DEAL_RELATIONMA",summary: search.Summary.GROUP})
				         	 ]
			})); 
            
            var fld = form.addField({
                id: "custpage_rel_mgr",
                type: ui.FieldType.SELECT,
                label: "Relationship Manager"
            });

    		fld.addSelectOption({value: "", text: "*** ALL RMs ***"});            	

            for (var i = 0; i < relMgrList.length; i++) {
        		fld.addSelectOption({
        			value: relMgrList[i].getValue({name: "internalid",join: "CUSTENTITYCUSTENTITY_ACQ_DEAL_RELATIONMA",summary: search.Summary.GROUP}), 
        			text: relMgrList[i].getText({name: "custentitycustentity_acq_deal_relationma", summary: search.Summary.GROUP})});            	
            }
            fld.defaultValue = selectionCriteria.relMgr;      
            

            var dealSearchFilters = [
     				        	 	["category","anyof","1"] 
    				        	    ,"AND",["custentity_acq_escrow_agent","is","T"]
    				        	 ];
            if (selectionCriteria.relMgr) {
            	dealSearchFilters.push("AND");
            	dealSearchFilters.push(["custentitycustentity_acq_deal_relationma",search.Operator.ANYOF,[selectionCriteria.relMgr]]);            	
            }
            	
            
			var dealList = priLibrary.searchAllRecords(search.create({
				type:		record.Type.CUSTOMER,
				filters:	dealSearchFilters,
				columns: 	["entityid","custentitycustentity_acq_deal_relationma"]
			})); 
            
            var fld = form.addField({
                id: "custpage_deal",
                type: ui.FieldType.SELECT,
                label: "Deal"
            });

    		fld.addSelectOption({value: "", text: "*** ALL DEALS ***"});            	

    		
        	// if there is a Relationship Manager, and the select one suddenly invalidates the selected deal, then clear the deal selection
            if (selectionCriteria.relMgr) {
            	var dealFound = false;

                for (var i = 0; i < dealList.length; i++) {
                	var relMgr = dealList[i].getValue("custentitycustentity_acq_deal_relationma");
                	
                	for (var j = 0; j < relMgrList.length; j++)
                		if (relMgrList[j].getValue({name: "internalid",join: "CUSTENTITYCUSTENTITY_ACQ_DEAL_RELATIONMA",summary: search.Summary.GROUP}) == relMgr)
                			dealFound = true;                	
                }
                
                if (!dealFound)
                	selectionCriteria.deal = "";
            } 
            	

            for (var i = 0; i < dealList.length; i++) {
        		fld.addSelectOption({value: dealList[i].id, text: dealList[i].getValue("entityid")});            	
            }
            fld.defaultValue = selectionCriteria.deal;     
            
            if (selectionCriteria.deal) {
    			var dealEscrowList = priLibrary.searchAllRecords(search.create({
    				type:		"customrecord_deal_escrow",
    				filters:	[
    				        	 	["isinactive",search.Operator.IS,false] 
    				        	    ,"AND",["custrecord_de_deal",search.Operator.ANYOF,[selectionCriteria.deal]]
    				        	 ],
    				columns: 	["name"]
    			})); 
                
                var fld = form.addField({
                    id: "custpage_deal_escrow",
                    type: ui.FieldType.MULTISELECT,
                    label: "Deal Escrow"
                });

                for (var i = 0; i < dealEscrowList.length; i++) {
            		fld.addSelectOption({value: dealEscrowList[i].id, text: dealEscrowList[i].getValue("name")});            	
                }
                fld.defaultValue = selectionCriteria.dealEscrow;
                
                
                
    			var dealContactList = priLibrary.searchAllRecords(search.create({
    				type:		"customrecord16",		// Deal Contact
    				filters:	[
    				        	 	["isinactive",search.Operator.IS,false] 
    				        	    ,"AND",["custrecord_dc_rcv_aea_stmts",search.Operator.IS,true]
    				        	 	,"AND",["custrecord59",search.Operator.ANYOF,[selectionCriteria.deal]]
    				        	 ],
    				columns: 	["name"]
    			})); 
                
                var fld = form.addField({
                    id: "custpage_deal_contact",
                    type: ui.FieldType.SELECT,
                    label: "Deal Contact"
                });

        		fld.addSelectOption({value: "", text: "*** ALL CONTACTS ***"});            	

                for (var i = 0; i < dealContactList.length; i++) {
            		fld.addSelectOption({value: dealContactList[i].id, text: dealContactList[i].getValue("name")});            	
                }
                fld.defaultValue = selectionCriteria.dealContact;
                
            }

            
    	    fld = form.addField({
    	    	id: "custpage_include_no_trans",
    	    	label: "Generate Statements Even if $0 Balance and No Activity",
    	    	type: ui.FieldType.CHECKBOX
    	    });
   	    	fld.defaultValue = selectionCriteria.zeroBalanceStatements ? "T" : "F";


     		var fld = form.addField({
     			id: "custpage_batch_link",
     			label: " ",
     			type: ui.FieldType.URL,
     		});
     		fld.updateDisplayType({displayType:ui.FieldDisplayType.INLINE});
     		fld.linkText = "Click here to view Existing Batches";
     		fld.defaultValue = "/app/common/custom/custrecordentrylist.nl?rectype=" + priLibrary.getCustomRecordTypeInternalId("customrecord_escrow_agent_stmt_batch"); 
     		fld.padding = 2; 
            fld.updateLayoutType({layoutType : ui.FieldLayoutType.STARTROW});
     		

            
     		var fld = form.addField({
     			id: "custpage_refresh_field_list",
     			label: "?",
     			type: ui.FieldType.TEXT,
     		});
     		fld.updateDisplayType({displayType:ui.FieldDisplayType.HIDDEN});
     		fld.defaultValue = "custpage_deal,custpage_statement_type,custpage_rel_mgr";


     		var fld = form.addField({
     			id: "custpage_refresh_action",
     			label: "?",
     			type: ui.FieldType.TEXT,
     		});
     		fld.updateDisplayType({displayType:ui.FieldDisplayType.HIDDEN});

     		
     		var fld = form.addField({
     			id: "custpage_instructions",
     			label: "Instructions",
     			type: ui.FieldType.LONGTEXT,
     		});
     		fld.updateDisplayType({displayType:ui.FieldDisplayType.INLINE});
     		fld.defaultValue = "Select the STATEMENT TYPE, and enter either the DATE RANGE, or the MONTH END DATE, depending on the type.  Then, you can optionally select any other fields.<p><ul><li>If you select a RELATIONSHIP MANAGER, you will get only Deals for that Manager.</li><li>If you select a specific DEAL, you will only get ESCROWS for that deal, and then you can optionally select specific DEAL ESCROWS and/or DEAL CONTACTS.</li></ul>";
     		fld.padding = 1;
     		

		} // addSelectionFields
		
            
		// ================================================================================================================================
		// ================================================================================================================================
		// ================================================================================================================================
		
		return {
			onRequest : onRequest
		};
	});