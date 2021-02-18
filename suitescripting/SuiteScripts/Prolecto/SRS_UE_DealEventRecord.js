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
 * code related to the Deal Event Record record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget'
	   ,'./Shared/SRS_Constants'
	   ,'./Shared/SRS_Functions'
	   ,'/.bundle/132118/PRI_ServerLibrary'
	   ,'/.bundle/132118/PRI_AS_Engine'],
				
		function(record, search, runtime, error, format, url, serverWidget, srsConstants, srsFunctions, priLibrary, appSettings) {
	
			var scriptName = "SRS_UE_DealEventRecord.";
			// ATO-131
			var executionContext     = runtime.executionContext;
			var objUser    = runtime.getCurrentUser();
			var arrTaxAnalystGroupMembers;
			var taxAnalystFuntionalityAccess = false;
			var opsApprovedToPayAccess = false;
			// END ATO-131

			var priorityPaymentType_Vesting = "7";			// ATP-1612 
			var paymentSuspenseReason_Unfunded = "29";		// ATP-1612

			
			// ATO-131
			//======================================================================================================================================
			//======================================================================================================================================
			function evaluateTaxAnalystFuntionalityAccess() {
				arrTaxAnalystGroupMembers = JSON.parse( appSettings.readAppSetting("Lot Certificate", "Tax Analyst group members") );
				taxAnalystFuntionalityAccess = (objUser.role === srsConstants.USER_ROLE.ADMINISTRATOR && runtime.envType == "SANDBOX");
				if (arrTaxAnalystGroupMembers.indexOf(objUser.name) > -1) {taxAnalystFuntionalityAccess = true;}
			}
			
			function evaluateOpsApprovedToPayAccess() {
				opsApprovedToPayAccess = (objUser.role === srsConstants.USER_ROLE.ADMINISTRATOR && runtime.envType == "SANDBOX");
				if (objUser.role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER) { opsApprovedToPayAccess = true; }
			}
			// END ATO-131
			
			
			//======================================================================================================================================
			//======================================================================================================================================
			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
				evaluateTaxAnalystFuntionalityAccess();
				evaluateOpsApprovedToPayAccess();
				
				var REC = context.newRecord;
    			
				// ATO-131
				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && (context.type === 'edit' || context.type === 'create')) {
					if (!opsApprovedToPayAccess) { setFieldDisplayType(context, ["custrecord_pay_import_approved_pay"], "DISABLED") }
				
					if (!taxAnalystFuntionalityAccess) { setFieldDisplayType(context, ["custrecord_pay_import_tax_reporting"], "DISABLED") }
					
					if (objUser.department != srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT) { setFieldDisplayType(context, ["custrecord_pay_import_acq_approved_pay"], "DISABLED") }
					
					
					var disableField = false;
    	        	if (!(srsFunctions.userIsAdmin() || 
    	        			(runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS && runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER)))
    	        		disableField = true;
    	        	else 
    	        		if (REC.getValue("custrecord_pay_import_other_charges") === "")
    	        			disableField = true;
    	        		else
    	        			if (REC.getValue("custrecord_pay_import_other_charges_user") == runtime.getCurrentUser().id)
    	        				disableField = true;
    	        	
    	        	if (disableField)
    	        		setFieldDisplayType(context, ["custrecord_pay_import_other_approved"], "DISABLED"); 

					
				} // if (context.type == context.UserEventType.EDIT)
				// END ATO-131

    			if (context.type == context.UserEventType.VIEW || context.type == context.UserEventType.EDIT) {
  					showTieoutSublist(context); 
    			}
    			
    			if (context.type == context.UserEventType.VIEW) {

    				
    				// ATP-1141: calculate various fields
    				REC.setValue("custrecord_de_tie_out", getPaymentAllocations(REC)); 
    				REC.setValue("custrecord_pay_import_paid_amount", getPaidCertificateAmount(REC));
    				REC.setValue("custrecord_pay_import_unpaid", getUnpaidCertificateAmount(REC));
    				
    				var totalTieOut = REC.getValue("custrecord_de_tie_out") 
    					- Math.abs(REC.getValue("custrecord_pay_import_paid_amount"))
    					- Math.abs(REC.getValue("custrecord_pay_import_unpaid"))
    					- REC.getValue("custrecord_pay_import_other_charges");
    					   					
    				REC.setValue("custrecord_pay_import_tie_out", totalTieOut); 
    				    				
    	        	if (srsFunctions.userIsAdmin() || 
    	        			(runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS 
    	        		&& (runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER 
    	        				|| runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_ANALYST))) {
    	        		
    					log.audit("custrecord_pay_import_deficiencies", REC.getValue("custrecord_pay_import_deficiencies"));
    					//ATP-1132
    					
    					if (srsFunctions.validateDER_Promote5BERs(REC))
    					{
    						context.form.clientScriptModulePath = 'SuiteScripts/Pristine/clientScripts/DealEventRecord_Client.js';
    						
    						var suiteletURL = url.resolveScript({
    		                      scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
    		                      deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
    		                      returnExternalUrl: 	false,
    		                      params:{"action": "MoveToPaymentDashboard", "derid": REC.id}});

    						context.form.addButton({
    	                        id: 'custpage_move_to_payment_dashboard',
    	                        label: 'Promote 5B ERs',
    	                        functionName: 'moveToPaymentDashboard("'+suiteletURL+'")'
    	                    });
    					}
    					//ATP-1132 end
    					
    					
    					// ATP-1726 -- start of changes
    					//		instead of calling suitelet to create the invoice, just open a page and navigate to it, and let the user finish editing before saving
    					
    					/* commented out for ATP-1726 and replaced by invoiceURL below
        				var utilURL = url.resolveScript({
                            scriptId:			srsConstants.SCRIPT_NAMES.UTILITIES_SUITELET,
                            deploymentId:		srsConstants.SCRIPT_DEPLOYMENTS.UTILITIES_SUITELET,
                            returnExternalUrl: 	false,
                            params:{"action": "createInvoiceDeposit", "derId": REC.id}});
						*/

	        			const ITEM_SHAREHOLDER_PROCEEDS = 264;

        				var invoiceURL = url.resolveRecord({
                            recordType:			record.Type.INVOICE,
                            params:{
                            		"cf":							srsConstants.CUSTOM_FORMS.ACQUIOM_INVOICE,                                    		
                            		"entity": 						REC.getValue("custrecord_pay_import_deal"),
                            		"record.memo":					"Deposit Amount",
                            		"record.custbodyacq_deal_link":	REC.getValue("custrecord_pay_import_deal"),
                            		"record.department":			srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM,
                            		"record.class":					srsConstants.CLASS.CLIENT_ACCOUNTS_ACQUIOM,
                            		"itemid":						ITEM_SHAREHOLDER_PROCEEDS,
                            		"itemqty":						"1",
                            		"itemdept":						srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM
                            		}
        				});
                     
        				// var scr = "null; if (confirm('Are you sure?')) window.location.href='" + invoiceURL + "'; console.log";
        				var scr = "null; if (confirm('Are you sure?')) window.open('" + invoiceURL + "');";

        				// ATP-1726 -- end of changes
                     
        				context.form.addButton({
        					id : "custpage_create_invoice_deposit",
        					label : "Create Invoice Deposit",
        					functionName: scr
        				});    				   

        				
        	        	//
        				var invoiceSearch = search.create({
        					type:		record.Type.INVOICE,
        					filters:	[
        					        	 	["mainline",search.Operator.IS,true]
        					        	 	,"AND",["status",search.Operator.ANYOF,["CustInvc:A"]]
        					        	 	,"AND",["department",search.Operator.ANYOF,[srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM]]
        					        	 	,"AND",["entity",search.Operator.ANYOF,[REC.getValue("custrecord_pay_import_deal")]]
        					        	 ],
        				}).run().each(function (result) {
        				
        					var INV = record.load({type: record.Type.INVOICE, id: result.id}); 
        					
        					if (INV.getValue("customform") == srsConstants.CUSTOM_FORMS.ACQUIOM_INVOICE) {

        						//ATP-1812: find the details of the first GL and use those

        						var glAccountId = ""; 
        						var currency = "";
        						
        						if (REC.getValue("custrecord_pay_import_glaccounts")) {
        							glAccountId = REC.getValue("custrecord_pay_import_glaccounts")[0];
        							if (glAccountId) {
            							var ACCT = record.load({type: record.Type.ACCOUNT, id: glAccountId}); 
            							currency = ACCT.getValue("currency");         								
        							}
        						}
        						
                				var paymentURL = url.resolveRecord({
                                    recordType:			record.Type.CUSTOMER_PAYMENT,
                                    params:{
                                    		"entity": 						REC.getValue("custrecord_pay_import_deal"),
                                    		"record.currency":				currency, 
                                    		"record.memo":					"Deposit Received",
                                    		"record.department":			srsConstants.DEPT.CLIENT_ACCOUNTS_ACQUIOM,
                                    		"record.class":					srsConstants.CLASS.CLIENT_ACCOUNTS_ACQUIOM,
                                    		"record.custbodyacq_deal_link":	REC.getValue("custrecord_pay_import_deal"),
                                    		"record.custbody_deal_event":	REC.id,
//                                    		"account":						REC.getValue("custrecord_pay_import_glaccount"),	// ATP-1812: this is not needed
                                    		"record.account":				glAccountId 		// ATP-1812: use the value derived above
                                    		}
                				});

                                var scr = "null; window.location.href='" + paymentURL + "'; console.log";

                				context.form.addButton({
                					id : "custpage_payment",
                					label : "Accept Payment",
                					functionName: scr
                				});    				                    	
                				return false;	// exit the .each function
        					} else
        						return true;	// keep going through the .each function
        				}); 
        				
        				
    	        	} // if authorized user
    	        	
    			} 
    						    	
			}


			//======================================================================================================================================

			function showTieoutSublist(context) {
				var funcName = scriptName + "showTieoutSublist " + context.newRecord.id; 
				
	    		var form = context.form;
				
				const TAB_LABEL = "Tie Out";
				
    			var newSubtabId = "custpage_tab_tieout";  
    			
	    		var subTabId = findTabId(form, TAB_LABEL); 

	    		if (subTabId) {
					log.debug(funcName, "Adding field to tab " + subTabId); 
					
		    		var batchTab = form.addSubtab({id : newSubtabId,label : "Tieout", tab: subTabId});
					
					var scriptURL = url.resolveScript({
						scriptId : 		'customscript_srs_sl_payment_tieout',
						deploymentId : 	'customdeploy_srs_sl_payment_tieout',
						params : 		{derId: context.newRecord.id}
					});
					
					var fld = form.addField({
						id : 'custpage_tieout_container',
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
		    		
	    		} 
			}

			function findTabId(form, tabLabel) {
				
				var tabList = form.getTabs();
				
				for (var i = 0; i < tabList.length; i++) {					
					var tab = form.getTab(tabList[i]);
					if (tab.label == tabLabel)
						return tabList[i];
				}
			}
			
			//======================================================================================================================================
			
			function getPaymentAllocations(REC) {			
				var ss = search.create({
					type:		"customrecord_pmt_allocation",
					filters:	[
					        	 	["isinactive",search.Operator.IS,false]
					        	 	,"AND",["custrecord_pa_deal_event",search.Operator.ANYOF,[REC.id]]					        	 	
					        	 ],
					columns:	[
				                   search.createColumn({name: "custrecord_pa_amount", summary: "sum", sort: search.Sort.ASC})
					        	 ]
				}).run().getRange(0,1);
				
				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_pa_amount", summary: search.Summary.SUM}) || "0");				
			}

			function getPaidCertificateAmount(REC) {
			
				var ss = search.create({
					type: 			"customrecord_acq_lot",
					filters:		[
						        	 	["isinactive",search.Operator.IS,false] 
						        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
						        	 	,"AND",["custrecord_acq_loth_related_trans","noneof","@NONE@"]
						        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.id]]					        	 	
						        	 	,"AND",[			// ATP-1612
						        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
						        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
						        	 	       ]
						        	 ],
					columns:		[
					        		 	search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM", sort: search.Sort.ASC})
					        		 ]
				}).run().getRange(0,1); 

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.SUM}) || "0");								
			}
			
			function getUnpaidCertificateAmount(REC) {
				
				var ss = search.create({
					type: 			"customrecord_acq_lot",
					filters:		[
						        	 	["isinactive",search.Operator.IS,false] 
						        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive",search.Operator.IS,false]
						        	 	,"AND",["custrecord_acq_loth_related_trans","anyof","@NONE@"]
						        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.id]]					        	 	
						        	 	,"AND",[		// ATP-1612
						        	 	       	["custrecord_acq_lot_priority_payment",search.Operator.NONEOF,[priorityPaymentType_Vesting]]
						        	 	       	,"OR",["custrecord_suspense_reason",search.Operator.NONEOF,[paymentSuspenseReason_Unfunded]]
						        	 	       ]
						        	 ],
					columns:		[
					        		 	search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: "SUM", sort: search.Sort.ASC})
					        		 ]
				}).run().getRange(0,1); 
				

				if (ss.length == 0)
					return 0;
				else
					return parseFloat(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT", summary: search.Summary.SUM}) || "0");								
			}
			
					

			// ATO-131
			//======================================================================================================================================
			//======================================================================================================================================
			function beforeSubmit(context) {
		    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
				evaluateTaxAnalystFuntionalityAccess(); 
				evaluateOpsApprovedToPayAccess();
				
				var fieldLabel;
				var message = '';
				var oldRec;
				try {
					log.debug('context.oldRecord=', JSON.stringify(context.oldRecord) );
					if (context.oldRecord) {
						oldRec = context.oldRecord 
					}
				}catch(e){
					log.error('ATP-1565 stringify context=', JSON.stringify(context) );
					log.error('ATP-1565 exe context='+JSON.stringify(runtime.executionContext), e.message );
					log.error('ATP-1565 ctxt='+context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id"), JSON.stringify(e) );
				}
				var newRec = context.newRecord;
				
				
				// ATP-1609: has the user added or removed any GL ACCOUNTS; if so, validate the adds or deletions
				
    			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
    				
    				var removedAccountList = getRemovedAccountList(context); 
    				
    				// first, take a look at what which accounts were just de-selected from the multi-select field; if it's not ok to remove them, throw an error message; 
    				//	the afterSubmit function will remove the associated TieOut records
    				for (var x = 0; x < removedAccountList.length; x++) {
    					var msg = okToRemoveAccount(context, removedAccountList[x]); 
    						
    					if (msg)
    						throw msg;
    				}

    				var addedAccountList = getAddedAccountList(context); 

    				// then find the accounts which were just added to the multi-select field; if it's not ok to add to add them, throw an error message
    				//		the afterSubmit function will add the required TieOut records 
    				for (var x = 0; x < addedAccountList.length; x++) {
    					var msg = okToAddAccount(context, addedAccountList[x]);

    					if (msg)
    						throw msg;
    				}
    			}
			
				
				
				log.debug(funcName ,"executionContext" + executionContext);
				switch (executionContext) {
					case 'CSVIMPORT':
						
						if (context.type == "edit" || context.type == "create") {
							if (!opsApprovedToPayAccess) {
								message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_approved_pay" ,"Operations Approved to Pay")
							}
							if (!taxAnalystFuntionalityAccess) {
								message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_tax_reporting" ,"Tax Review Status")
							}
							if (objUser.department != srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT) {
								message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_acq_approved_pay" ,"Acquiom Approved To Pay")
							}
							
							if (priLibrary.fieldChanged(context, "custrecord_pay_import_other_approved")) {
			    	        	if (srsFunctions.userIsAdmin() || 
			    	        			(runtime.getCurrentUser().department == srsConstants.DEPT.ACQUIOM_OPERATIONS && runtime.getCurrentUser().role == srsConstants.USER_ROLE.SRS_OPERATIONS_MANAGER)) {
			    	        		// field has changed, and user is authorized to change it; now set or clear related fields
			    	        		if (newRec.getValue("custrecord_pay_import_other_approved")) {
			    	        			// if there is no amount yet, or the current user set it, then we have a problem
			    	        			
			        	        		if (newRec.getValue("custrecord_pay_import_other_charges") === "")
			        	        			throw "You can't set the APPROVE OTHER CHARGES field since the OTHER CHARGES are blank";
			        	        		
			        	        		if (newRec.getValue("custrecord_pay_import_other_charges_user") == runtime.getCurrentUser().id)
			        	        			throw "You can't set the APPROVE OTHER CHARGES field since YOU created the OTHER CHARGES";
			    	        			
			    						newRec.setValue("custrecord_pay_import_other_mgr_approval", runtime.getCurrentUser().id);
			    						newRec.setValue("custrecord_pay_import_other_approval_dt", new Date());			    	        			
			    	        		} else {
			    						newRec.setValue("custrecord_pay_import_other_mgr_approval", "");
			    						newRec.setValue("custrecord_pay_import_other_approval_dt", "");			    	        						    	        			
			    	        		}
			    	        	} else
			    	        		message = "You are not authorized to change field 'APPROVE OTHER CHARGES'";
							}							
						}
						
						if (message) { throw message; }
						break; // case 'CSVIMPORT'
				
					//---------------------------------------------------------------------------------------------------------------------
					case 'USERINTERFACE':
					case 'USEREVENT':
					case 'SUITELET':
						
						switch (context.type) {
							case 'xedit':
								log.debug('beforeSubmit', 'xedit ' );
								fieldList = newRec.getFields();
								
								if (!opsApprovedToPayAccess) {
									if (fieldList.indexOf("custrecord_pay_import_approved_pay") >= 0) {
										message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_approved_pay" ,"Operations Approved to Pay")
									}
								}
								
								if (!taxAnalystFuntionalityAccess) {
									if (fieldList.indexOf("custrecord_pay_import_tax_reporting") >= 0) {
										message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_tax_reporting" ,"Tax Review Status")
									}
								}
								
								if (objUser.department != srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT) {
									if (fieldList.indexOf("custrecord_pay_import_acq_approved_pay") >= 0) {
										message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_acq_approved_pay" ,"Acquiom Approved To Pay")
									}
								}

								break; // xedit
								
							case 'edit':
							case 'create':
								if (!opsApprovedToPayAccess) {
									message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_approved_pay" ,"Operations Approved to Pay")
								}
								if (!taxAnalystFuntionalityAccess) {
									message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_tax_reporting" ,"Tax Review Status")
								}
								if (objUser.department != srsConstants.DEPT.GLOBAL_BUSINESS_DEVELOPMENT) {
									message = testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,"custrecord_pay_import_acq_approved_pay" ,"Acquiom Approved To Pay")
								}

						} // switch (context.type)
						
						if (message) { throw message; }
						break;
					default:
						break;
				}

				
			}

			
			/*
			 * ATP-1609: start of support functions 
			 */
			
			function okToRemoveAccount(context, accountId) {
				// if it's OK to remove the account, return nothing; else return an error message
				
				var exchgSearch = priLibrary.searchAllRecords(search.create({
					type:		"customrecord_acq_lot",
					filters:	[
					        	 	["isinactive",search.Operator.IS,false]
					        	 	,"AND",["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,context.newRecord.id]					        	 	
					        	 ]
				}));
				
				var recList = [];
				for (var i = 0; i < exchgSearch.length; recList.push(exchgSearch[i++].id)); 
				
				var ACCT = record.load({type: record.Type.ACCOUNT, id: accountId}); 
				
				// var accountFields = search.lookupFields({type: record.Type.ACCOUNT, id: accountId, columns: ["currency","name"]}); 

				if (recList.length > 0) {
					var ss = search.create({
						type:		"customrecord_acq_lot_cert_entry",
						filters:	[
						        	 	["isinactive",search.Operator.IS,false]
						        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot",search.Operator.ANYOF,recList]
						        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,ACCT.getValue("currency")]
						        	 ],					
					}).run().getRange(0,1);
					
					if (ss.length > 0)
						return "You may not Remove Account '" + ACCT.getValue("acctnumber") + " - " + ACCT.getValue("acctname") + " because there are one or more LOT Certificate Entry records in the Currency of this account (" + ACCT.getText("currency") + ")";					
				}
				
				
				// we also can't remove if there are any Payment Allocation Records in the same currency
				var ss = search.create({
					type:		"customrecord_pmt_allocation",
					filters:	[
					        	 	["custrecord_pa_deal_event",search.Operator.ANYOF,context.newRecord.id]
					        	 	,"AND",["custrecord_pa_payment_currency",search.Operator.ANYOF,ACCT.getValue("currency")]
					        	 ],					
				}).run().getRange(0,1); 
				
				if (ss.length > 0)
					return "You may not Remove Account '" + ACCT.getValue("acctnumber") + " - " + ACCT.getValue("acctname") + " because there are one or more PAYMENT ALLOCATION RECORDS in the Currency of this account (" + ACCT.getText("currency") + ")";
										
			}

			
			function okToAddAccount(context, accountId) {
				// if it's OK to add the account, return nothing; else return an error message
				
				// if multiple accounts are using the same currency, then we don't allow that				
				// because the CURRENCY field from the ACCOUNT record can't be retrieved in search or via lookupFields, we have no choice but to LOAD every record
				
				var ACCT = record.load({type: record.Type.ACCOUNT, id: accountId}); 
								
				var accountList = context.newRecord.getValue("custrecord_pay_import_glaccounts");
				
				for (var i = 0; i < accountList.length; i++) {
					var acctId = accountList[i];
					
					if (acctId && acctId != accountId) {
						var A = record.load({type: record.Type.ACCOUNT, id: acctId});
						
						if (A.getValue("currency") == ACCT.getValue("currency"))
							return "You may not Add Account '" + ACCT.getValue("acctnumber") + " - " + ACCT.getValue("acctname") + " because you may not select multiple accounts that use the same Currency (" + ACCT.getText("currency") + ")"; 
					}
				}
				
			}

			
			function getAddedAccountList(context) {

				if (context.type == context.UserEventType.CREATE)
					var oldAccountList = []; 
				else
					oldAccountList = context.oldRecord.getValue("custrecord_pay_import_glaccounts");
				
				var newAccountList = context.newRecord.getValue("custrecord_pay_import_glaccounts");

				var accountList = []; 
				
				for (var x = 0; x < newAccountList.length; x++) 
					if (oldAccountList.indexOf(newAccountList[x]) < 0) 
						accountList.push(newAccountList[x]);

				if (accountList.length > 0)					
					log.debug("ADDED these accounts", accountList);
				
				return accountList; 
			}


			function getRemovedAccountList(context) {
				if (context.type == context.UserEventType.CREATE)
					var oldAccountList = []; 
				else
					oldAccountList = context.oldRecord.getValue("custrecord_pay_import_glaccounts");
				
				var newAccountList = context.newRecord.getValue("custrecord_pay_import_glaccounts");

				var accountList = []; 
				
				// first, take a look at what was removed, and make sure that it's OK to remove those accounts; if they are removed, then the afterSubmit will remove the corresponding Tie Out record
				for (var x = 0; x < oldAccountList.length; x++) 
					if (newAccountList.indexOf(oldAccountList[x]) < 0) 
						accountList.push(oldAccountList[x]); 

				if (accountList.length > 0)					
					log.debug("REMOVED these accounts", accountList);

				return accountList; 
			}
			
			/*
			 * ATP-1609: end of support functions 
			 */


			//======================================================================================================================================
			//======================================================================================================================================
			function testProtectedFieldForUnauthorizedChange(context ,newRec ,oldRec ,message ,fieldName ,fieldLabel) {
				if (context.type == "edit" || context.type == "xedit") {
					if (oldRec.getValue(fieldName) !== newRec.getValue(fieldName)) {
						return message +=  "You are not permitted to update field '" + fieldLabel + "' (" + fieldName + ");   ";
					}
				}
				else 
				if (context.type == "create") {
					var fieldValue = newRec.getValue(fieldName);
					if (fieldValue > "") {
						return message +=  "You are not permitted to assign a value to field '" + fieldLabel + "' (" + fieldName + ");   ";
					}
				}
				return message;
			}
			// END ATO-131

			
			//======================================================================================================================================
			//======================================================================================================================================
			function afterSubmit(context) {
		    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);
				evaluateTaxAnalystFuntionalityAccess();  // ATO-131
				
		    	// once we establish a relationship, don't allow user to change the key information
				var REC = context.newRecord;
    			if (REC.getValue("custrecord_pay_enable_rsm"))
				{
    				// ATO-121: also track field custrecord_de_ch_section_config
					if (priLibrary.fieldChanged(context, "custrecord_pay_import_acq_approved_pay") || priLibrary.fieldChanged(context, "custrecord_pay_import_approved_pay") || priLibrary.fieldChanged(context, "custrecord_de_ch_section_config"))
						srsFunctions.writeExchangeRecordsToRSMQueue([["custrecord_acq_lot_payment_import_record",search.Operator.ANYOF,[REC.id]]]); 		
                }
    			

    			// ATP-1609
    			if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {

    				// for any accounts which were removed, get rid of the Tie Out record
    				var removedAccountList = getRemovedAccountList(context); 
    				
    				if (removedAccountList.length > 0) {
        				var ss = search.create({
        					type:		"customrecord_payment_tie_out",
        					filters:	[
        					        	 		["custrecord_pto_der_link",search.Operator.ANYOF,[context.newRecord.id]]
        					        	 		,"AND",["custrecord_pto_gl_account",search.Operator.ANYOF,removedAccountList]
        					        	 ]    					
        				}).run().getRange(0,1000); 
        				
        				for (var i = 0; i < ss.length; i++) {
        					log.debug(funcName, "Deleting Tie Out record (internal id " + ss[i].id + " as its account was removed"); 
        					record.delete({type: "customrecord_payment_tie_out", id: ss[i].id});
        				}    					
    				}
    				
    				
    				// now search to see which tie-outs are left; any accounts that exist, but don't have a tie-out record need to have one created
    				
    				var ss = search.create({
    					type:		"customrecord_payment_tie_out",
    					filters:	[
    					        	 		["custrecord_pto_der_link",search.Operator.ANYOF,[context.newRecord.id]]
    					        	 ],
    					columns:	["custrecord_pto_gl_account"]
    				}).run().getRange(0,1000); 

    				var accountList = context.newRecord.getValue("custrecord_pay_import_glaccounts");
    				
    				for (var i = 0; i < accountList.length; i++) {
    					var accountId = accountList[i];
    					
    					if (accountId) {
    						var accountFound = false;
    						
    						// do we have a TieOut with the same account id?
    						for (var j = 0; j < ss.length; j++) 
    							if (ss[j].getValue("custrecord_pto_gl_account") == accountId) 
    								accountFound = true;
    						
    						if (!accountFound) {
    							var TIEOUT = record.create({type: "customrecord_payment_tie_out"});
    							
    							TIEOUT.setValue("custrecord_pto_der_link", context.newRecord.id); 
    							TIEOUT.setValue("custrecord_pto_gl_account", accountId);
    							var id = TIEOUT.save();
    							log.audit(funcName, "Created TieOut " + id + " for GL Account internal id " + accountId);    							
    						}
    					}
    				}
    				
    			}

    			
			}

			
			
			// ATO-131
			//======================================================================================================================================
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
			   ,beforeSubmit:beforeSubmit
			    ,afterSubmit:afterSubmit
		}
});