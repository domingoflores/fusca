/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/format', 'N/runtime', 'N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/ui/message'
		, '/SuiteScripts/Prolecto/Shared/SRS_Constants'
		, '/.bundle/132118/PRI_AS_Engine'
	    , 'SuiteScripts/Pristine/libraries/PaymentFileCreation_Library.js'
        ],

	function(format ,runtime ,currentRecord ,log ,record ,search ,msg
		, srsConstants
		, appSettings
		, pftLibrary	
	) {

		var scriptName = "PaymentFileCreation_CL.js";
		var de_escrow_tax_rptg_rqd;
		var userInternalId;
		var deliverMethod_Manual = 2;
		var deliverMethod_Manual_other = 3;
    	var fileReference;
    	var creFileReference;

    	
    	//=====================================================================================================
		//=====================================================================================================
		function pageInit(context) {
			var rcd = context.currentRecord;
			
	    	fileReference    = rcd.getValue({ fieldId:'custrecord_pay_file_linktofile'});
	    	creFileReference = rcd.getValue({ fieldId:'custrecord_pay_file_cre_generated_file'});

			var objToday = new Date();
			getNextBusinessDay(objToday); // This causes the holidays search to occur during page load so there is no delay when checkbox is clicked later

			var objFieldManualReason  = context.currentRecord.getField({ fieldId:'custrecord_pay_file_manual_reason' });        	
			var objFieldManualExplain = context.currentRecord.getField({ fieldId:'custrecord_pay_file_man_deliv_explain' });        	
			var deliveryMethod = rcd.getValue("custrecord_pay_file_deliv_method");
			if (deliveryMethod == deliverMethod_Manual) {
				objFieldManualReason.isDisplay  = true;
				var deliveryMethodManualReason = rcd.getValue("custrecord_pay_file_manual_reason");
				if (deliveryMethodManualReason == deliverMethod_Manual_other) { objFieldManualExplain.isDisplay = true;	 }
				else                                                          { objFieldManualExplain.isDisplay = false; }
			}
			else {
				objFieldManualReason.isDisplay  = false;
				objFieldManualExplain.isDisplay = false;
			}

			// ATP-1413 - Setting these fields isMandatory to true in client script so they show the asterisk when displayed
			//            NetSuite does not enforce the isMandatory when the field is NOT displayed, so we can just 
			//            set isMandatory to true here and forget about it and let the setting "isDisplay" take care of the rest
			objFieldManualReason.isMandatory  = true;
			objFieldManualExplain.isMandatory = true;
			// end ATP-1413
			
			
			//disable these two fields on page init, and following functions will properly update them if needed
			var custom_account_field = rcd.getField({ fieldId:'custpage_glaccount' });
        	custom_account_field.isDisabled = true;
    		custom_account_field.isMandatory = false;
    		
    		var custom_currency_field = rcd.getField({ fieldId:'custpage_currency' });
			custom_currency_field.isDisabled = true;
        	custom_currency_field.isMandatory = false;

        	// Warning to DEVELOPERS =======  W A R N I N G  ==================================================
        	// The following function loads fields 'custpage_glaccount' and 'custpage_currency' using 
        	// a promise call, that means if you add any code after this point that interacts with 
        	// either of those fields your code may execute before the code invoked with a promise finishes
        	promiseLoadPFTData(rcd);
        	
		}
		
		//=====================================================================================================
		function promiseLoadPFTData(rcd)
		{
			var payment_file_type = rcd.getValue("custrecord_pay_file_type");
			if (payment_file_type) 
        	{
				search.lookupFields.promise(
				{
    				type:"customrecord_pay_file_type" 
    				,id:payment_file_type
    				,columns:["custrecord_pft_currency_selection_req", "custrecord_pft_account_options"]
				})
				.then(function(results) 
				{
					loadPFC_Currencies(rcd, results);
					loadPFC_GAAccounts(rcd, results);
				})
				.catch(function(reason) 
				{
	                log.error("promiseLoadPFTData Failed: " + reason);
	                //console.log("Failed" + reason);
	                //do something on failure
	            });
        	}
		}
		
		function loadPFC_GAAccounts(rcd, pft_results)
		{
			var promise = new Promise(function(resolve, reject)
			{
				var custom_account_field = rcd.getField({ fieldId:'custpage_glaccount' });
	        	var savedGlAccountValue = rcd.getValue({ fieldId:'custrecord_pay_file_account'});
	        	var bank_name_vendor = rcd.getValue({ fieldId:'custrecord_pay_file_bank_name_vendor'});
	        	var isSelected = false;
	        	try
				{
	        		//console.log(pft_results);
	        		
        			if (
        				!(
        				pft_results 
    					&& pft_results.custrecord_pft_account_options 
    					&& pft_results.custrecord_pft_account_options.length>0
    					&& ((parseInt(pft_results.custrecord_pft_account_options[0].value,10))
    						=== parseInt(srsConstants["PFT Account Options"]["GL Account Selection Required"],10))
        				))
        			{
        				//all above must be true
        				//must have results
        				//must have account options
        				//it must have results
        				//account options value must equal GL Account Selection Required
        				//. Otherwise, disable field. 
						rcd.setValue({ fieldId:'custrecord_pay_file_account' ,value:""}); 
		        		rcd.setValue({ fieldId:'custpage_glaccount' ,value:0}); 
		        		disableField(custom_account_field);
					}
					else
					{
		    			custom_account_field.isDisabled = false;
		        		custom_account_field.isMandatory = true;
    		
						custom_account_field.removeSelectOption({
						    value: null
						});
	            
						custom_account_field.insertSelectOption({
						    value: " ",
						    text: " "
						});  
				 
						search.create.promise(
						{
							type: "account",
							filters:
						   [
						      ["custrecord_gl_account_bank_name","anyof",bank_name_vendor], 
						      "AND", 
						      ["custrecord_escrow_account_type","anyof",srsConstants["Escrow Type"]["Paying Account"]], 
						      "AND", 
						      ["isinactive","is","F"]
						   ],
						   columns:
						   [
						      search.createColumn({
						         name: "name",
						         label: "Name"
						      }),
						      search.createColumn({
							         name: "internalid",
							         label: "InternalID"
							      })
						   ]
						})
						.then(function(customerSearchObj) 
						{
						
							customerSearchObj.run().each.promise(function(result){
								   // .run().each has a limit of 4,000 results
								//console.log("internalid " + result.getValue("internalid"));
								isSelected = false;
								if (savedGlAccountValue) 
		    	            	{
		    		            	if (result.getValue("internalid") == savedGlAccountValue) 
		    		            	{ 
		    		            		isSelected = true; 
		    		            	} 
		    	            	}
								custom_account_field.insertSelectOption({
						                value: result.getValue("internalid"),
						                text: result.getValue("name"),
						                isSelected:isSelected
						            }); 
									return true;
							})
							.catch(function(reason) 
							{
				                log.error("customerSearchObj.run().each.promise Failed: " + reason);
				                //console.log("Failed" + reason);
				                rcd.setValue({ fieldId:'custrecord_pay_file_account' ,value:""}); 
				        		rcd.setValue({ fieldId:'custpage_glaccount' ,value:0}); 
				        		disableField(custom_account_field);
				                //do something on failure
				            });
						})
						.catch(function(reason) 
						{
			                log.error("search.create.promise Failed: " + reason);
			                //console.log("Failed" + reason);
			                rcd.setValue({ fieldId:'custrecord_pay_file_account' ,value:""}); 
			        		rcd.setValue({ fieldId:'custpage_glaccount' ,value:0}); 
			        		disableField(custom_account_field);
			                //do something on failure
			            });
					}
				}
				catch (e)
				{
					log.error("loadPFC_GAAccounts: ",e.toString());
					//console.log(e);
					rcd.setValue({ fieldId:'custrecord_pay_file_account' ,value:""}); 
	        		rcd.setValue({ fieldId:'custpage_glaccount' ,value:0}); 
	        		disableField(custom_account_field);
				}
			});
        	if (fileReference || creFileReference) { 
            	var custom_account_field  = rcd.getField({ fieldId:'custpage_glaccount' });
        		custom_account_field.isDisabled  = true;
        	}
			return promise;
		}
		function disableField(field)
		{
			if (field)
			{
				field.defaultValue = null;
				field.isDisabled   = true;
				field.isMandatory  = false;
			}
		}
		//=====================================================================================================
		//=====================================================================================================
		function loadPFC_Currencies(rcd, pft_results) 
		{
			var promise = new Promise(function(resolve, reject)
			{
	        	var payment_bank          = rcd.getValue("custrecord_pay_file_payment_bank");
	        	var custom_currency_field = rcd.getField({ fieldId:'custpage_currency' });
	        	var results = null;
	        	
	        	try {
	        		//if results are empty, or currency selection is not required, disable currency field 
        			if (!pft_results || (pft_results && !pft_results.custrecord_pft_currency_selection_req))
					{
        				rcd.setValue({ fieldId:'custrecord_pay_file_currency' ,value:""}); 
		        		rcd.setValue({ fieldId:'custpage_currency'            ,value:0}); 
		        		disableField(custom_currency_field);
		        	}
        			else 
        			{
						var savedCurrencyValue    = rcd.getValue({ fieldId:'custrecord_pay_file_currency'});
		        	
				        custom_currency_field.isDisabled = false;
			        	custom_currency_field.isMandatory = true;
			        		
			           	var filter0     = search.createFilter({ name:'internalid' ,operator:"anyof" ,values:[payment_bank] });
			        	var column0     = search.createColumn({ name:'internalid' ,join:'custrecord_pb_settlement_currencies'	  });
			        	var column1     = search.createColumn({ name:'name'	      ,join:'custrecord_pb_settlement_currencies'	  });
			    		search.create.promise(
	    				{ 
	    					type:"customrecord_payment_bank"
	    			        ,filters: [ filter0 ]
	    			        ,columns: [ column0 ,column1 ]
	    				})
	    				.then(function(pbSearchObj) 
	    				{
	    					return pbSearchObj.run().getRange.promise({
						    start: 0,
						    end: 1000
						    });
	    				})
					    .then(function(pbSearchresults)
					    {
					    	if (pbSearchresults.length > 0) 
					    	{
			        			custom_currency_field.removeSelectOption({ value:null});
			 		            custom_currency_field.insertSelectOption({ value:" "  ,text:" " });
			 		            var result = null;
			 		            var ix = null;
				        		for (ix in pbSearchresults) 
				        		{
				        			var fieldValue = pbSearchresults[ix].getValue(column0);
				        			var fieldText  = pbSearchresults[ix].getValue(column1);
				                	var isSelected = false;
				        			if (savedCurrencyValue)
				        			{
				        				if (parseInt(fieldValue,10) === parseInt(savedCurrencyValue,10)) 
				        				{ 
				        					isSelected = true; 
				        				} 
				 		        	}
				 		        	custom_currency_field.insertSelectOption(
				 		        			{value:fieldValue 
				 		        			,text:fieldText 
				 		        			,isSelected:isSelected 
				 		        			});
				        		}
					    	}
				    		else 
				    		{
				    			showErrorMessage("Currency List Could not be Loaded", "Payment File Type --> CURRENCY SELECTION REQUIRED is checked, but no currencies were retrieved."); 
								log.error("loadPFC_Currencies: ","currency list expected but not found for Payment File Type " + rcd.getText("custrecord_pay_file_type")); 
								rcd.setValue({ fieldId:'custrecord_pay_file_currency' ,value:""}); 
				        		rcd.setValue({ fieldId:'custpage_currency'            ,value:0}); 
				        		disableField(custom_currency_field);
				    		}
					    	
					    })
					    .catch(function(reason) 
						{
			                log.error("pbSearchObj.run().getRange.promise Failed: " + reason);
			                //console.log("Failed" + reason);
			                //do something on failure
			                rcd.setValue({ fieldId:'custrecord_pay_file_currency' ,value:""}); 
			        		rcd.setValue({ fieldId:'custpage_currency'            ,value:0}); 
			        		disableField(custom_currency_field);
			            });
        			}
		
				}
				catch (e) 
				{
					log.error("loadPFC_Currencies: ",e.toString()); 
					//console.log("Failed" + e);
					rcd.setValue({ fieldId:'custrecord_pay_file_currency' ,value:""}); 
					rcd.setValue({ fieldId:'custpage_currency'});
					disableField(custom_currency_field);
				}
			});
        	if (fileReference || creFileReference) { 
            	var custom_currency_field = rcd.getField({ fieldId:'custpage_currency'  });
        		custom_currency_field.isDisabled = true;
        	}
			return promise;
		}
		
		//=====================================================================================================
		//=====================================================================================================
		function validateField(context) {
			
			var rcd = context.currentRecord;          
	        var fieldId = context.fieldId;
	        
            switch (fieldId) {
            case 'custrecord_pay_file_chg_pymts_date_chk':
            	if (!window.confirm('Are you sure you want to change the Payment File Date?')) {
            		return false; 
            	}
            	break;
            }
            
    		return true;          
		}
		

		//=====================================================================================================
		//=====================================================================================================
		function fieldChanged(context) {
			
			var rcd = context.currentRecord;          
	        var fieldId = context.fieldId;
	        var glaccount_value = null;
	        var custpage_currency = null;
			userInternalId = runtime.getCurrentUser().id;

	        
            switch (fieldId) 
            {
            case 'custrecord_pay_file_chg_pymts_date_chk':
    		    var now = new Date();
    		    var localDate = format.format({ value:now ,type:format.Type.DATETIME ,timezone:format.Timezone.AMERICA_DENVER });
        		var objToday = new Date(localDate);
            	if (rcd.getValue('custrecord_pay_file_chg_pymts_date_chk') == true) { // YES
            		var objNextBusinessDay = getNextBusinessDay(objToday);
					rcd.setValue({ fieldId:'custrecord_pay_file_payments_date' ,value:objNextBusinessDay ,ignoreFieldChange:true});
            	}
            	else { 
            		//objToday = new Date("7/23/2019");
					rcd.setValue({ fieldId:'custrecord_pay_file_payments_date' ,value:objToday ,ignoreFieldChange:true});
            	}
            	break;
            case 'custrecord_pay_file_deliv_method':
    			var objFieldManualReason  = context.currentRecord.getField({ fieldId:'custrecord_pay_file_manual_reason' });        	
    			var objFieldManualExplain = context.currentRecord.getField({ fieldId:'custrecord_pay_file_man_deliv_explain' });        	
            	if (rcd.getValue(fieldId) == deliverMethod_Manual) { 
            		objFieldManualReason.isDisplay = true;	
        			var objFieldManualExplain = context.currentRecord.getField({ fieldId:'custrecord_pay_file_man_deliv_explain' });        	
                	if (rcd.getValue('custrecord_pay_file_manual_reason') == deliverMethod_Manual_other) { objFieldManualExplain.isDisplay = true;	}
                	else                                                     { objFieldManualExplain.isDisplay = false; }
            	}
            	else {
            		objFieldManualReason.isDisplay  = false;	
            		objFieldManualExplain.isDisplay = false;
            	}
            	break;
            case 'custrecord_pay_file_manual_reason':
    			var objFieldManualExplain = context.currentRecord.getField({ fieldId:'custrecord_pay_file_man_deliv_explain' });        	
            	if (rcd.getValue(fieldId) == deliverMethod_Manual_other) { objFieldManualExplain.isDisplay = true;	}
            	else                                                     { objFieldManualExplain.isDisplay = false; }
            	break;
            case 'custpage_glaccount':
            	glaccount_value = context.currentRecord.getValue({
	                fieldId: "custpage_glaccount"
	            });
            	context.currentRecord.setValue({
	                fieldId: "custrecord_pay_file_account", 
	                value: glaccount_value
	            });
			    break;
            case 'custpage_currency':
            	custpage_currency = context.currentRecord.getValue({
	                fieldId: "custpage_currency"
	            });
            	context.currentRecord.setValue({
	                fieldId: "custrecord_pay_file_currency", 
	                value: custpage_currency
	            });
			    break;
				
				case 'custrecord_pay_file_type':
					
					//console.log("entered field change for PAYMENT FILE TYPE");
					
					var final_approver_temp = context.currentRecord.getField({
						fieldId: 'custpage_pay_file_final_approver'
					});
					//console.log('field object of custom final approver field client side: ' + JSON.stringify(final_approver_temp));

					if (Boolean(final_approver_temp)) {
						resetList(final_approver_temp);
					}

            		var PFT_ID = context.currentRecord.getValue({
					fieldId: "custrecord_pay_file_type"
					});
					
					//console.log("PFT ID? ", PFT_ID);
					if (PFT_ID) { 
					var isFinraReq = pftLibrary.isFinraReq(PFT_ID);
					}
					//console.log("does this bank require finra req cb? ", isFinraReq);
					var approvers = null;
					if (isFinraReq == true) {
						approvers = pftLibrary.finraApproverList();

					} else { 
						approvers = pftLibrary.finalApproverList();
					}
					if (approvers) {
						var i = 0;
						var len = approvers.length;
						for (i = 0; i < len; i++) {
							final_approver_temp.insertSelectOption({
								text: approvers[i].name,
								value: approvers[i].internalid
							});
						}
					}
					break;
				
				case 'custpage_pay_file_final_approver':
					var finalApprover = context.currentRecord.getValue({
						fieldId: "custpage_pay_file_final_approver"
					});

					if (parseInt(finalApprover)) {
						context.currentRecord.setValue({
							fieldId: "custrecord_pay_file_final_approver",
							value: finalApprover
						});
					} else {
						context.currentRecord.setValue({
							fieldId: "custrecord_pay_file_final_approver",
							value: null
						});
					 }
					
					break;
            }
		}
		//===========================================HELPER FUNCTIONS===========================================================

		function resetList(list) {
			list.removeSelectOption({
				value: null
			});
			list.insertSelectOption({
				value: 0,
				text: " "
			});  
		}
		
		//===============================================================================================================================
		//===============================================================================================================================
		function postSourcing(context) {
			var rcd = context.currentRecord;
	        var fieldId = context.fieldId;
	        
			userInternalId = runtime.getCurrentUser().id;
	        
            switch (fieldId) {
            case 'custrecord_pay_file_payment_bank':
            	evaluatePaymentFileType(context);
            	break;
            case 'custrecord_pay_file_deliv_method':
            	evaluatePaymentFileType(context);
            	break;
            case "custrecord_pay_file_type":
            	promiseLoadPFTData(rcd);
            	break;
            }

		}
		
		
		//===============================================================================================================================
		//===============================================================================================================================
		function evaluatePaymentFileType(context) {
			var funcName = scriptName + "--->PaymentFileCreation_CL.js";
			var rcd = context.currentRecord;          
	        var fieldId = context.fieldId;

        	var fieldValuePB = rcd.getValue({ fieldId:'custrecord_pay_file_payment_bank' });
        	var fieldValueDM = rcd.getValue({ fieldId:'custrecord_pay_file_deliv_method' });

			var objField = context.currentRecord.getField({ fieldId:'custrecord_pay_file_type' });
        	
        	if (!fieldValuePB || !fieldValueDM) { 
        		rcd.setValue({ fieldId:'custrecord_pay_file_type' ,value:null ,ignoreFieldChange:false}); 
				objField.isDisabled = true;
        		return;
        	}

			objField.isDisabled = false;
        	
    		var arrColumns = new Array();
    		var col_internalid                = search.createColumn({ name:'internalid'  });
    		arrColumns.push(col_internalid);
    		
    		var arrFilters   = [         ['isinactive'                     ,'IS'       ,false ]
            					,'AND'  ,['custrecord_pft_payment_bank'    ,'ANYOF'    ,fieldValuePB ]
								,'AND'  ,['custrecord_pft_delivery_method' ,'ANYOF'    ,fieldValueDM ]
    						   ];
    		
    		var searchPftObj = search.create({'type':"customrecord_pay_file_type"
    		                                     ,'filters':arrFilters 
    	                                         ,'columns':arrColumns 	       });
    		var searchPft        = searchPftObj.run();
    		var searchPftResults = searchPft.getRange(0,100);
    		
            if (searchPftResults.length == 0) {
				rcd.setValue({ fieldId: 'custrecord_pay_file_type', value: null, ignoreFieldChange: false}); 
            }
            else
    		if (searchPftResults.length == 1) {
    			rcd.setValue({ fieldId:'custrecord_pay_file_type' ,value:searchPftResults[0].getValue(col_internalid) ,ignoreFieldChange:false});	
    		}
	        
		}
		
		
		
		var millisecs24Hours; 
		var searchHolidaysResults;
		
		//===============================================================================================================================
		//===============================================================================================================================
		function getNextBusinessDay(objToday) {
			
			var objNextBusinessDay = new Date(objToday.getTime());
			var nbrMillisecs;
			var nbd0 = (objNextBusinessDay.getMonth() + 1) + "/" + objNextBusinessDay.getDate() + "/" + objNextBusinessDay.getFullYear(); 

			var col_name           = search.createColumn({ "name":"name"  });
			var col_dateObserved   = search.createColumn({ "name":"custrecord_date_observed" ,"sort":search.Sort.ASC  });

			try {
				if (!searchHolidaysResults) {
					var arrColumns         = new Array();
					arrColumns.push(col_name);
					arrColumns.push(col_dateObserved);
					var arrFilters   = [         ['isinactive'                        ,'IS'              ,false ]
			                            ,'AND'  ,['custrecord_date_observed'          ,'after'           ,["today"] ]
			                           ];
					
					var searchHolidaysObj     = search.create({    'type':'customrecord_bank_holiday'
                                                               ,'filters':arrFilters 
                                                               ,'columns':arrColumns 	       });
					var searchHolidays        = searchHolidaysObj.run();
					var searchHolidaysResults = searchHolidays.getRange(0,1000); 
					
					millisecs24Hours = 24 * 60 * 60 * 1000; // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
				}
				
				var tryAnotherDay = true;
				while (tryAnotherDay) {
					nbrMillisecs = objNextBusinessDay.getTime() + millisecs24Hours; //Add 1 day
					objNextBusinessDay.setTime(nbrMillisecs); // Update datetime variable using new milliseconds value
					var nbd = (objNextBusinessDay.getMonth() + 1) + "/" + objNextBusinessDay.getDate() + "/" + objNextBusinessDay.getFullYear(); 
					var dayOfWeek = objNextBusinessDay.getDay();
					if (dayOfWeek>0 && dayOfWeek<6) {
						var skipThisDate = false;
						var i=0;
						for (i=0; i<searchHolidaysResults.length; i++) { if (searchHolidaysResults[i].getValue(col_dateObserved) == nbd) { skipThisDate = true; break; } }
						if (!skipThisDate) { tryAnotherDay = false; }
					} // if (dayOfWeek>0 && dayOfWeek<6)
				} // while (tryAnotherDay)
			} 
			catch(e) { alert(e.message); }
		    return objNextBusinessDay;
			
		}
		
		
		//=====================================================================================================
		//=====================================================================================================
		function saveRecord(context) {

			var rcd = context.currentRecord;
			
			var glAccount = rcd.getValue("custpage_glaccount");
			var currency = rcd.getValue("custpage_currency");
        	
			
			var pay_file_type          = rcd.getValue("custrecord_pay_file_type");
        	var results = null;
        	
        	if (pay_file_type) 
        	{
        		results = search.lookupFields({type:"customrecord_pay_file_type" ,id:pay_file_type
	            ,columns:["custrecord_pft_currency_selection_req", "custrecord_pft_account_options"]});
        	}
        	
        	if (results)
        	{
        		if (results.custrecord_pft_currency_selection_req)
        		{
					if (!parseInt(currency,10))
					{
						showErrorMessage("Currency is Required", "Currency is required for Payment File Type " + rcd.getText("custrecord_pay_file_type")); 
						return false;
					}
				}
	        	if (results 
	        		&& results.custrecord_pft_account_options 
	        		&& results.custrecord_pft_account_options[0] 
	        		&& parseInt(results.custrecord_pft_account_options[0].value,10) === parseInt(srsConstants["PFT Account Options"]["GL Account Selection Required"],10))
				{
					if (!parseInt(glAccount,10))
					{
						showErrorMessage("GL Account Required", "GL Account is required when 'PAYMENT FILE TYPE'-->'Account Options'-->'GL Account Selection Required' is selected."); 
						return false;
					}
				}
        	}
			
			
			var finalaprover_custfield = rcd.getValue("custpage_pay_file_final_approver");
			if (!parseInt(finalaprover_custfield)) {
				showErrorMessage("Final Approver is Required.", "Please select one of the available options");
				return false;
			}

			var deliveryMethod = rcd.getValue("custrecord_pay_file_deliv_method");
			if (deliveryMethod == deliverMethod_Manual) {
				var deliveryMethodManualReason = rcd.getValue("custrecord_pay_file_manual_reason");
				if (deliveryMethodManualReason < 1) { 
					showErrorMessage("MANUAL DELIVERY REASON is Required", "When Delivery Method is 'Manual', then field 'MANUAL DELIVERY REASON' must have a value selected"); 
					return false;
				}
				if (deliveryMethodManualReason == deliverMethod_Manual_other) { 
					var deliveryMethodManualExplain = rcd.getValue("custrecord_pay_file_man_deliv_explain");
					if (deliveryMethodManualExplain <= "") { 
						showErrorMessage("MANUAL DELIVERY EXPLANATION is Required", "When Manual Delivery Reason is set to 'OTHER', then field 'MANUAL DELIVERY EXPLANATION' must be entered"); 
						return false;
					}
				}
				else { rcd.setValue("custrecord_pay_file_man_deliv_explain"  ,null); }
			}
			else {
				rcd.setValue("custrecord_pay_file_manual_reason"      ,'');
				rcd.setValue("custrecord_pay_file_man_deliv_explain"  ,null);
			}
			

			return true;
		}
		
		//=====================================================================================================
		//=====================================================================================================
		function showErrorMessage(msgTitle, msgText) {
			var myMsg = msg.create({ title:msgTitle ,message: msgText ,type: msg.Type.ERROR });
			myMsg.show({ duration:9900 });
            window.scrollTo(0, 0);
		}


		
		//=====================================================================================================
		//=====================================================================================================
		function adminSetStatusCancelled() {
            var objValues = {};
            var pfc_status_cancelled = 5;
            objValues["custrecord_pay_file_status"]        = pfc_status_cancelled;     			
            try {
                var rcd = currentRecord.get();
        		record.submitFields({ type:"customrecord_payment_file" ,id:rcd.id ,values:objValues });
          		location.reload(true);
            }
            catch(e) {alert(e.message);}
		}
		
		
		return {
			                pageInit: pageInit
			           ,fieldChanged: fieldChanged
				      ,validateField: validateField
				       ,postSourcing: postSourcing
			             ,saveRecord: saveRecord
			,adminSetStatusCancelled: adminSetStatusCancelled
		};
	});