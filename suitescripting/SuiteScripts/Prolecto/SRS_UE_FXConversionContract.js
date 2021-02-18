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
 * code related to the FOREIGN CURRENCY CONVERSION CONTRACT custom record
 * 
 */

define(['N/record', 'N/search', 'N/runtime', 'N/error', 'N/format', 'N/url', 'N/ui/serverWidget'
        ,'/.bundle/132118/PRI_ShowMessageInUI','./Shared/SRS_Constants','./Shared/SRS_Functions','/.bundle/132118/PRI_QM_Engine','/.bundle/132118/PRI_ServerLibrary'   ],
				
		function(record, search, runtime, error, format, url, serverWidget, priMessage, srsConstants, srsFunctions, qmEngine, priLibrary) {
	
			var scriptName = "SRS_UE_FXConversionContract.";
			
			"use strict"; 
			
			const FX_CONTRACT_STATUS = {
					ACTIVE:						"1",
					PENDING_FIRST_APPROVAL:		"2",
					CONFIRMED_SETTLED:			"6"
			};

			const LOT_DELIVERY_METHOD = {
					VENDOR_PAYMENT:			"13"
			}; 
			
			//======================================================================================================================================
			//======================================================================================================================================

			function beforeLoad(context) {

		    	var funcName = scriptName + "beforeLoad " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

				var REC = context.newRecord;

    			if (context.type == context.UserEventType.VIEW) {
    				if (REC.getValue("custrecord_fx_conv_orig_currency") && REC.getValue("custrecord_fx_conv_orig_amount") && REC.getValue("custrecord_fx_conv_converted_currency"))
    					if (REC.getValue("custrecord_fx_conv_status") == FX_CONTRACT_STATUS.ACTIVE || REC.getValue("custrecord_fx_conv_status") == FX_CONTRACT_STATUS.PENDING_FIRST_APPROVAL)
    						addSuiteletToForm(context.form, "customscript_srs_sl_sel_fx_k_exch_recs", "customdeploy_srs_sl_sel_fx_k_exch_recs", {custpage_recid: REC.id}, "Select Exchange Records", null, "100%", "800px");     				
    			}
		    	
    			if (context.type == context.UserEventType.VIEW || context.type == context.UserEventType.EDIT) {
    				
    				generateExchangeRecordSublist(context); 
    				
    				drawTieoutTable(context);     				

    			}
    			
    			
			}
			

			//======================================================================================================================================
			//======================================================================================================================================

			function beforeSubmit(context) {

		    	var funcName = scriptName + "beforeSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

				var REC = context.newRecord;

				if (priLibrary.fieldChangedToValue(context, "custrecord_fx_conv_status", FX_CONTRACT_STATUS.CONFIRMED_SETTLED))
					if (!REC.getValue("custrecord_fx_conv_ctr_rate"))
						throw "You must provide a value for CONTRACT RATE when changing the status to CONFIRMED/SETTLED";

			}
			

			//======================================================================================================================================
			//======================================================================================================================================

			function afterSubmit(context) {

		    	var funcName = scriptName + "afterSubmit " + context.type + " " + context.newRecord.type + " " + context.newRecord.getValue("id") + " via " + JSON.stringify(runtime.executionContext);

				var REC = context.newRecord;

    			if (context.type == context.UserEventType.EDIT) {
    				
    				if (priLibrary.fieldChangedToValue(context, "custrecord_fx_conv_status", FX_CONTRACT_STATUS.CONFIRMED_SETTLED)) {
    					
    					var updateList = [];
    					
    					if (REC.getValue("custrecord_fx_conv_cert_to_settle_curr"))
    						convertLotCertificateRecords(context, updateList); 
    					
    					if (REC.getValue("custrecord_fx_conv_calc_exch_fx_amt"))
    						calculateExchangeFXAmount(context, updateList);
    					
    					if (updateList.length > 0) {
    						// now we either process these right now (if there is enough capacity to do so), or we submit them all to a QM job
    						
    						log.debug(funcName, updateList.length + " record(s) need to be updated"); 
    						
    						var governanceNeeded = (updateList.length * 2) + 100;		// 2 units per submitfields on custom record; 100 units of "buffer"
    						
    						if (governanceNeeded > runtime.getCurrentScript().getRemainingUsage()) {

    							log.debug(funcName, "Too many records to update; using QM instead"); 
    							
    							const QUEUE_NAME = "SubmitFields";
    							
    							const SUBMIT_FIELDS_QUEUE_SCRIPT = "customscript_srs_sc_submitfields_qm"; 
    							
    							var qEntries = [];
    							
    							for (var i in updateList) {
	    	    					var qEntry = {
	    	    							queueName: QUEUE_NAME,
	    	    							paramString: JSON.stringify(updateList[i]),
	    	    							giveUpAfter: 3
	    	    					}
	    	    					
	    	    					qEntries.push(qEntry); 	    								
    							}
    							
    			            	qmEngine.addQueueEntries(qEntries, SUBMIT_FIELDS_QUEUE_SCRIPT , Math.max(10,qEntries.length));
    			            		    							
    	                    	priMessage.prepareMessage("Background Update Scheduled", updateList.length + " Exchange/Lot Cert records will be updated via a background script.", priMessage.TYPE.INFORMATION);					    	
    			            	
    						} else {

    							log.debug(funcName, "Records being updated immediately"); 

    							for (var i in updateList) { 
    								log.debug(funcName, updateList[i]); 
    								record.submitFields(updateList[i]); 
    							}
    							
    	                    	priMessage.prepareMessage("Record(s) Updated", updateList.length + " Exchange/Lot Cert record(s) were updated.", priMessage.TYPE.INFORMATION);					    	
    						}
    					} else
    						log.debug(funcName, "Status moved to Confirmed/Settled, but nothing to update."); 
    				}
    			}

		    	
			} // afterSubmit
			

			//======================================================================================================================================
			
			function drawTieoutTable(context) {
				var funcName = scriptName + "drawTieoutTable " + context.newRecord.id;

				const MATCH_STRING = "<span style='font-weight:bold;background-color:#34eb7a;text-align: right;'>Match</span>";
				const NO_MATCH_STRING = "<span style='font-weight:bold;background-color:#eb4934;text-align: right;'>Does Not Match</span>"; 
					
				var REC = context.newRecord;
				
				try {
					
					var sourceAmtFromCerts = getAmountFromCerts(REC, true);
					var settleAmtFromCerts = getAmountFromCerts(REC, false);
					var amtFromCMs = getExchangeSum(REC, "custrecord_credit_memo_amount");
					var amtFromRefunds = getExchangeSum(REC, "custrecord_cust_refund_amount");
					var amtFromFX = getExchangeSum(REC, "custrecord_exrec_fx_settlement_amount");
					var amtFromVendorPayments = getAmountFromVendorPayments(REC); 
					
					var sourceAmt = 0; 
					var settlementAmt = REC.getValue("custrecord_fx_conv_foreign_total"); 

					var contractConverted = REC.getValue("custrecord_fx_conv_status") == FX_CONTRACT_STATUS.CONFIRMED_SETTLED && REC.getValue("custrecord_fx_conv_cert_to_settle_curr"); 

					
					var sourceAmt = REC.getValue("custrecord_fx_conv_orig_amount"); 
					var targetAmt = 0; 
					
					if (REC.getValue("custrecord_fx_conv_tieout_src") == "Certificates") {
						targetAmt = sourceAmtFromCerts; 
					} else if (REC.getValue("custrecord_fx_conv_tieout_src") == "Credit Memos") {
						targetAmt = amtFromCMs; 
					} else if (REC.getValue("custrecord_fx_conv_tieout_src") == "Customer Refund") {
						targetAmt = amtFromRefunds; 
					} else if (REC.getValue("custrecord_fx_conv_tieout_src") == "FX Settlements") {
						targetAmt = amtFromFX; 
					} else if (REC.getValue("custrecord_fx_conv_tieout_src") == "Vendor Records") {
						targetAmt = amtFromVendorPayments;
					}
					
    				var sourceMatch = (sourceAmt == targetAmt) ? MATCH_STRING : NO_MATCH_STRING;
    				
					log.debug(funcName, sourceAmt + " | " + targetAmt + " | " + sourceMatch);
    				
    				

					sourceAmt = REC.getValue("custrecord_fx_conv_foreign_total"); 
					targetAmt = 0; 
					
					if (REC.getValue("custrecord_fx_conv_tie_out_settlement") == "Certificates") {
						targetAmt = settleAmtFromCerts; 
					} else if (REC.getValue("custrecord_fx_conv_tie_out_settlement") == "Credit Memos") {
						targetAmt = amtFromCMs; 
					} else if (REC.getValue("custrecord_fx_conv_tie_out_settlement") == "Customer Refund") {
						targetAmt = amtFromRefunds; 
					} else if (REC.getValue("custrecord_fx_conv_tie_out_settlement") == "FX Settlements") {
						targetAmt = amtFromFX; 
					}
					
    				var settleMatch = (sourceAmt == targetAmt) ? MATCH_STRING : NO_MATCH_STRING;
    				
					log.debug(funcName, sourceAmt + " | " + targetAmt + " | " + settleMatch);
					
					var defValue = '<table border="0" class="table_fields" cellspacing="0" cellpadding="0" width="100%" role="presentation"><tbody><tr>'
						+ '<td colspan="2" align="center">'
						+ '<span class="bgmd totallingbg" style="display:inline-block;">'
						+ ' <img class="totallingTopLeft" src="/images/nav/ns_x.gif" alt="">'
						+ ' <img class="totallingTopRight" src="/images/nav/ns_x.gif" alt="">'
						+ ' <img class="totallingBottomLeft" src="/images/nav/ns_x.gif" alt="">'
						+ ' <img class="totallingBottomRight" src="/images/nav/ns_x.gif" alt="">'

						+ ' <table class="totallingtable" cellspacing="2" cellpadding="0px" border="0px">'
						+ '     <caption style="display: none">' + "Tie Out" + '</caption>'; 

					defValue += generateSummaryLine("", "SOURCE","SETTLEMENT"); 
					defValue += generateSummaryLine(" ", formatCurrency(REC.getValue("custrecord_fx_conv_orig_amount")) , formatCurrency(REC.getValue("custrecord_fx_conv_foreign_total"))); 
					defValue += generateSummaryLine(" ", REC.getText("custrecord_fx_conv_orig_currency"), REC.getText("custrecord_fx_conv_converted_currency"));
					defValue += generateSummaryLine("Tie Out To", REC.getValue("custrecord_fx_conv_tieout_src"), REC.getValue("custrecord_fx_conv_tie_out_settlement")); 
					
					defValue += generateSummaryLine("", sourceMatch, settleMatch);   

					defValue += generateSummaryLine("", "", "");    

//					defValue += generateSummaryLine("ISO Code", "", REC.getValue("custrecord_fx_conv_iso")); 
					defValue += generateSummaryLine("Certificates", formatCurrency(sourceAmtFromCerts), formatCurrency(settleAmtFromCerts)); 
					defValue += generateSummaryLine("Credit Memos", formatCurrency(amtFromCMs), formatCurrency(amtFromCMs)); 
					defValue += generateSummaryLine("Customer Refunds", formatCurrency(amtFromRefunds), formatCurrency(amtFromRefunds)); 
					defValue += generateSummaryLine("FX Settlements", formatCurrency(amtFromFX), formatCurrency(amtFromFX)); 
					defValue += generateSummaryLine("Vendor Payments", formatCurrency(amtFromVendorPayments), " ");  

					defValue += generateSummaryLine("", "", "");    

					var settlementAmount = REC.getValue("custrecord_fx_conv_orig_amount") * REC.getValue("custrecord_fx_conv_ctr_rate"); 
					
					defValue += generateSummaryLine("Rate Tie Out", REC.getValue("custrecord_fx_conv_ctr_rate"), formatCurrency(settlementAmount));  

					var diff = settlementAmount - REC.getValue("custrecord_fx_conv_foreign_total");
					
					log.debug(funcName, "diff=" + diff); 
					
					if (Math.abs(diff) < 0.01) // (diff < 0.01 && diff > -0.01)
						defValue += generateSummaryLine("", "", MATCH_STRING);
					else
						defValue += generateSummaryLine("", "", NO_MATCH_STRING);
					


					defValue += '</td></tr></tbody></table>';

					REC.setValue("custrecord_fx_conv_tie_out_summary", defValue); 

				} catch (e) {
					log.error(funcName, e); 
				}
				
			}
			
			function matchString() {
				
			}
			
			function noMatchString() {
				
			}
			
			
			function formatCurrency(amt) {
				amt = amt || 0.0; 
				amt = Number(Number(amt).toFixed(2));
				return format.format({value: amt, type: format.Type.CURRENCY2}); 
			}

			function generateSummaryLine(lineLabel, col1, col2) {

				var funcName = scriptName + "generateSummaryLine";

				return '<tr><td style="align:right"><span class="smalltextnolink uir-label" style="align:right">' + lineLabel + '</span></td>' 
				+ "<td><span class='uir-field inputreadonly'>" + col1  + "</span></td>"
				+ "<td><span class='uir-field inputreadonly'>" + col2 + "</span></td>"
				+ "<td></td></tr>";

			}

			
			function getExchangeSum(REC, sumField) {

				var ss = search.create({
					type:		"customrecord_acq_lot",
					filters:	["custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]],
					columns:	[search.createColumn({name: sumField, summary: search.Summary.SUM})]
				}).run().getRange(0,1); 
				if (ss.length > 0)
					return Number(Number(ss[0].getValue({name: sumField, summary: search.Summary.SUM})).toFixed(2));
				else
					return 0;				
			}
						
			function getAmountFromVendorPayments(REC) {
				if (!REC.getValue("custrecord_fx_conv_vnd_pmt_recs") || REC.getValue("custrecord_fx_conv_vnd_pmt_recs").length == 0)
					return 0; 
				
				var ss = search.create({
					type:		"customrecord_acq_lot_cert_entry",
					filters:	[
					        	 	["isinactive",search.Operator.IS,false]
					        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.internalid",search.Operator.ANYOF,REC.getValue("custrecord_fx_conv_vnd_pmt_recs")]
//					        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
					        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_acq_loth_zzz_zzz_lotdelivery",search.Operator.ANYOF,[LOT_DELIVERY_METHOD.VENDOR_PAYMENT]]
					        	 ],
					columns:	[search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", summary: search.Summary.SUM})]
				}).run().getRange(0,1); 
				if (ss.length > 0)
					return Number(Number(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", summary: search.Summary.SUM})).toFixed(2));
				else
					return 0;								
			}

			function getAmountFromCerts(REC, sourceAmount) {
				/*
				 * we are calculating one of 4 totals:
				 * 		BEFORE CONVERSION
				 * 			sourceAmount
				 * 			!sourceAmount (settlement amount)
				 * 
				 * 		AFTER CONVERSION
				 * 			sourceAmount
				 * 			!sourceAmount (settlement amount)
				 * 						 * 
				 */

				var searchFilter = [];
				
				if (sourceAmount) {
					// before or after a conversion
					if (REC.getValue("custrecord_fx_conv_status") == FX_CONTRACT_STATUS.CONFIRMED_SETTLED && REC.getValue("custrecord_fx_conv_cert_to_settle_curr")) {
						searchFilters = [
							        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
							        	 	,"AND",["custrecord_acq_lotce_orig_currency",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
											,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_converted_currency")]]
							        	 ];						
						searchColumn = "custrecord_acq_lotce_orig_pmt_amt"; 
					} else {
						searchFilters = [
							        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
											,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
							        	 ];
						searchColumn = "custrecord_acq_lotce_zzz_zzz_payment"; 						
					}
				} else {
					if (REC.getValue("custrecord_fx_conv_status") == FX_CONTRACT_STATUS.CONFIRMED_SETTLED && REC.getValue("custrecord_fx_conv_cert_to_settle_curr")) {
						searchFilters = [
							        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
							        	 	,"AND",["custrecord_acq_lotce_orig_currency",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
											,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_converted_currency")]]
							        	 ];						
						searchColumn = "custrecord_acq_lotce_zzz_zzz_payment"; 
					} else {
						searchFilters = [
							        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
											,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
							        	 ];
						searchColumn = "custrecord_acq_lotce_zzz_zzz_payment"; 						
					}					
				}
				
				var ss = search.create({
					type:		"customrecord_acq_lot_cert_entry",
					filters:	searchFilters,
					columns:	[search.createColumn({name: searchColumn, summary: search.Summary.SUM})]
				}).run().getRange(0,1); 
				if (ss.length > 0)
					return Number(Number(ss[0].getValue({name: searchColumn, summary: search.Summary.SUM})).toFixed(2));
				else
					return 0;						
				
				
				return;
				
				
				
				// if we want the conversion amount, and it HAS been converted
				if (REC.getValue("custrecord_fx_conv_status") == FX_CONTRACT_STATUS.CONFIRMED_SETTLED && REC.getValue("custrecord_fx_conv_cert_to_settle_curr") && !sourceAmount) {
					var ss = search.create({
						type:		"customrecord_acq_lot_cert_entry",
						filters:	[
						        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
										,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_converted_currency")]]
						        	 	,"AND",["custrecord_acq_lotce_orig_currency",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
						        	 ],
						columns:	[search.createColumn({name: "custrecord_acq_lotce_orig_pmt_amt", summary: search.Summary.SUM})]
					}).run().getRange(0,1); 
					if (ss.length > 0)
						return Number(Number(ss[0].getValue({name: "custrecord_acq_lotce_orig_pmt_amt", summary: search.Summary.SUM})).toFixed(2));
					else
						return 0;						
				} else {
					var ss = search.create({
						type:		"customrecord_acq_lot_cert_entry",
						filters:	[
						        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
										,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
						        	 ],
						columns:	[search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", summary: search.Summary.SUM})]
					}).run().getRange(0,1); 					
					if (ss.length > 0)
						return Number(Number(ss[0].getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", summary: search.Summary.SUM})).toFixed(2));
					else
						return 0;
				}				

			}
			
			//======================================================================================================================================

			function calculateExchangeFXAmount(context, updateList) {
				var funcName = scriptName + "calculateExchangeFXAmount " + context.newRecord.id;

				var REC = context.newRecord;
				
				/*
				 * 
				 * the way this function is supposed to work is that if flag "custrecord_fx_conv_cert_to_settle_curr" is checked, then the Exchange Record is updated simply with the sum of the linked Lot Cert Records
				 * 		the reason being is that those Lot Cert Records have already been updated with the exchange rate
				 * 		this ASSUMES that this Lot Cert Conv Rate updated ALREADY happened -- and so we can just sum up the records
				 * 
				 * and if the above flag is NOT true, then the Exchange Record is updated by performing the exchange rate conversion right now
				 * 
				 * HOWEVER, the ASSUMPTION above is incorrect, in the sense that function "convertLotCertificateRecords" (below) doesn't actually PERFORM the update.  it simply builds a queue of records to be updated
				 * 		thus, we need to take the exchange rate into account in this function
				 * 
				 * WHICH MEANS that in either case, we have "unconverted" Lot Cert Records, and so we always have to perform the conversion here
				 * 
				 */
				
				
				if (REC.getValue("custrecord_fx_conv_cert_to_settle_curr")) 
					log.debug(funcName, "Totaling LOT Gross Amounts on Exchange Record"); 
				else
					log.debug(funcName, "Totaling and Converting LOT Gross Amounts on Exchange Record");
					
					
				var ss = search.create({
					type:		"customrecord_acq_lot_cert_entry",
					filters:	[
					        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
					        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
					        	 	
					        	 ],
					columns:	[
					        	 search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_parentlot", summary: search.Summary.GROUP, sort: search.Sort.ASC}),
					        	 search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment", summary: search.Summary.SUM, sort: search.Sort.ASC})
						        	 ]
					}); 
					
				ss = priLibrary.searchAllRecords(ss);   
 
				for (var i in ss) {
					var result = ss[i];

					var exchangeId = result.getValue({name: "custrecord_acq_lotce_zzz_zzz_parentlot", summary: search.Summary.GROUP}); 
					
					var newAmount = Number((Number(result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment", summary: search.Summary.SUM})) * REC.getValue("custrecord_fx_conv_ctr_rate")).toFixed(2)); 
					
					// store newAmount on exchange record in field FX Settlement Amount (custrecord_exrec_fx_settlement_amount)
					updateList.push({type: "customrecord_acq_lot", id: exchangeId, values: {custrecord_exrec_fx_settlement_amount: newAmount}}); 						
					
				}
				
				
			}

			// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------

			function convertLotCertificateRecords(context, updateList) {
				var funcName = scriptName + "convertLotCertificateRecords " + context.newRecord.id;

				var REC = context.newRecord;

				// find all lot certificate records whose linked exchange record points to THIS record
				
				var ss = search.create({
					type:		"customrecord_acq_lot_cert_entry",
					filters:	[
					        	 	["custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,[REC.id]]
					        	 	,"AND",["custrecord_acq_lotce_zzz_zzz_currencytyp",search.Operator.ANYOF,[REC.getValue("custrecord_fx_conv_orig_currency")]]
					        	 ],
					columns:	["custrecord_acq_lotce_zzz_zzz_payment","custrecord_acq_lotce_zzz_zzz_currencytyp" /*"custrecord_acq_lotce_zzz_zzz_grossamount"*/]
				}); 
				
				ss = priLibrary.searchAllRecords(ss);   
				
				
				for (var i in ss) {
					var result = ss[i];
					
					var newAmount = Number((result.getValue("custrecord_acq_lotce_zzz_zzz_payment") * REC.getValue("custrecord_fx_conv_ctr_rate")).toFixed(2)); 
					
					updateList.push({type: "customrecord_acq_lot_cert_entry", id: result.id, values: 
						{
							custrecord_acq_lotce_zzz_zzz_payment: newAmount, 
							custrecord_acq_lotce_zzz_zzz_currencytyp: REC.getValue("custrecord_fx_conv_converted_currency"),
							custrecord_acq_lotce_orig_pmt_amt: result.getValue("custrecord_acq_lotce_zzz_zzz_payment"),
							custrecord_acq_lotce_orig_currency: result.getValue("custrecord_acq_lotce_zzz_zzz_currencytyp")
						}					
					}); 						

					// log.debug(funcName, "Old Value=" + result.getValue("custrecord_acq_lotce_zzz_zzz_grossamount") + "    New Value=" + newAmount); 
				}
				
			}

			
			
			//======================================================================================================================================
			//======================================================================================================================================


			
			function generateExchangeRecordSublist(context) {
			
				var funcName = scriptName + "generateExchangeRecordSublist " + context.newRecord.id;

				var REC = context.newRecord; 

				try {
					if (REC.getValue("custrecord_fx_conv_status") == FX_CONTRACT_STATUS.CONFIRMED_SETTLED && REC.getValue("custrecord_fx_conv_cert_to_settle_curr"))
						drawSettledSublist(context);
					else
						drawUnsettledSublist(context);
					
				} catch (e) {
					log.error(funcName, e);
				}
				
			}
			
			
			function drawUnsettledSublist(context) {

				var funcName = scriptName + "drawUnsettledSublist " + context.newRecord.id;
				
				var REC = context.newRecord; 
				
				var tabId = findTabId(context.form,"Associated Exchange Records");
				
	            var theList = context.form.addSublist({
	    	    	id: "custpage_aer",
	    	    	label: "Associated ERs (unsettled)",
	    	    	type: serverWidget.SublistType.STATICLIST,
	    	    	tab: tabId
	    	    });
	    	    
	            theList.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "ID/View"});
	            theList.addField({id: "shareholder", type: serverWidget.FieldType.TEXT, label: "Shareholder"});
	            theList.addField({id: "deal", type: serverWidget.FieldType.TEXT, label: "Deal"});
	            theList.addField({id: "der", type: serverWidget.FieldType.TEXT, label: "Deal - Deal Event"});
	            theList.addField({id: "status", type: serverWidget.FieldType.TEXT, label: "Acquiom Status"});
	            theList.addField({id: "paymenttype", type: serverWidget.FieldType.TEXT, label: "Priority Payment Type"});	            
	            theList.addField({id: "payment", type: serverWidget.FieldType.CURRENCY, label: "Payment Amount"});
	            
	            var ss = search.create({
		            type: 		"customrecord_acq_lot",
		            filters:	[
		                    	 	["isinactive","is","F"] 
		                    	 	,"AND",["custrecord_exrec_fx_conv_contract.isinactive","is","F"] 
		                    	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive","is","F"] 
		                    	 	,"AND",["custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,REC.id] 
		                    	 	,"AND",["formulanumeric: CASE WHEN {custrecord_exrec_fx_conv_contract.custrecord_fx_conv_orig_currency} = {custrecord_acq_lotce_zzz_zzz_parentlot.custrecord_acq_lotce_zzz_zzz_currencytyp} THEN 1 ELSE 0 END","equalto","1"]
		                    	 ],
		            columns:	[
		                    	 search.createColumn({name: "id",summary: "GROUP"}),
		                    	 search.createColumn({name: "custrecord_acq_loth_zzz_zzz_shareholder",summary: "GROUP",label: "Shareholder"}),
		                    	 search.createColumn({name: "custrecord_acq_loth_zzz_zzz_deal",summary: "GROUP",label: "Deal"}),
		                    	 search.createColumn({name: "custrecord_acq_lot_payment_import_record",summary: "GROUP",label: "DER - Deal Event"}),
		                    	 search.createColumn({name: "custrecord_acq_loth_zzz_zzz_acqstatus",summary: "GROUP",label: "Acquiom Status"}),
		                    	 search.createColumn({name: "formulatext",summary: "GROUP",formula: "CASE WHEN {custrecord_acq_lot_priority_payment} is NULL THEN ' ' ELSE {custrecord_acq_lot_priority_payment} END",label: "Priority Payment Type"}),
		                    	 search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM",sort: search.Sort.DESC}),
		                    	 ]
	            }); 

	            ss = priLibrary.searchAllRecords(ss); 
	            
	            var rowNbr = 0;
	            
	            var totalPayment = 0;
	            
	            for (i in ss) {
	            	var result = ss[i];

	            	var id = result.getValue({name: "id",summary: "GROUP"});
	            	
	    			var theLink = "<a href=\"" +url.resolveRecord({recordType: "customrecord_acq_lot", recordId: id})+ "\" target=\"_blank\" style=\"\">"+id+"</a>"        	    			       				
           			theList.setSublistValue({id: "id", line: rowNbr, value: theLink });
	       			
	            	theList.setSublistValue({id: "shareholder", line: rowNbr, value: result.getText({name: "custrecord_acq_loth_zzz_zzz_shareholder",summary: "GROUP"})});
	            	theList.setSublistValue({id: "deal", line: rowNbr, value: result.getText({name: "custrecord_acq_loth_zzz_zzz_deal",summary: "GROUP"})});
	            	theList.setSublistValue({id: "der", line: rowNbr, value: result.getText({name: "custrecord_acq_lot_payment_import_record",summary: "GROUP"})});
	            	theList.setSublistValue({id: "status", line: rowNbr, value: result.getText({name: "custrecord_acq_loth_zzz_zzz_acqstatus",summary: "GROUP"})});
	            	theList.setSublistValue({id: "paymenttype", line: rowNbr, value: priLibrary.getSearchResultValueByLabel(result,"Priority Payment Type")});
	            	theList.setSublistValue({id: "payment", line: rowNbr, value: result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM"})});
	            	
            		totalPayment += Number(result.getValue({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM"})); 
	            	
	            	rowNbr++;
	            }
				
       			theList.setSublistValue({id: "id", line: rowNbr, value: "<b>Overall Total</b>"});
            	theList.setSublistValue({id: "payment", line: rowNbr, value: totalPayment});            		

			}

			// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
			
			
			function drawSettledSublist(context) {
			
				var funcName = scriptName + "generateExchangeRecordSublist " + context.newRecord.id;
				
				var REC = context.newRecord; 
				
				var tabId = findTabId(context.form,"Associated Exchange Records");
				
	            var theList = context.form.addSublist({
	    	    	id: "custpage_aer",
	    	    	label: "Associated ERs (settled)",
	    	    	type: serverWidget.SublistType.STATICLIST,
	    	    	tab: tabId
	    	    });
	    	    
	            theList.addField({id: "id", type: serverWidget.FieldType.TEXT, label: "ID/View"});
	            theList.addField({id: "shareholder", type: serverWidget.FieldType.TEXT, label: "Shareholder"});
	            theList.addField({id: "deal", type: serverWidget.FieldType.TEXT, label: "Deal"});
	            theList.addField({id: "der", type: serverWidget.FieldType.TEXT, label: "Deal - Deal Event"});
	            theList.addField({id: "status", type: serverWidget.FieldType.TEXT, label: "Acquiom Status"});
	            theList.addField({id: "paymenttype", type: serverWidget.FieldType.TEXT, label: "Priority Payment Type"});
	            
	            theList.addField({id: "exchg_amount", type: serverWidget.FieldType.CURRENCY, label: "Exch Rec Amount"});
		        theList.addField({id: "lotce_amount", type: serverWidget.FieldType.CURRENCY, label: "LOT Cert Amount"});	            	

	            searchFilters = [
		                    	 	["isinactive","is","F"] 
		                    	 	,"AND",["custrecord_exrec_fx_conv_contract.isinactive","is","F"] 
		                    	 	,"AND",["custrecord_acq_lotce_zzz_zzz_parentlot.isinactive","is","F"] 
		                    	 	,"AND",["custrecord_exrec_fx_conv_contract",search.Operator.ANYOF,REC.id]
		                    	 ];

		            
	            var f = "CASE WHEN {CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_currencytyp.id} = " + REC.getValue("custrecord_fx_conv_converted_currency") +
	            	" AND {CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_orig_currency.id} = " + REC.getValue("custrecord_fx_conv_orig_currency") + " THEN {CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT.custrecord_acq_lotce_zzz_zzz_payment} ELSE 0 END";
        	 
	            
	            var ss = search.create({
		            type: 		"customrecord_acq_lot",
		            filters:	searchFilters,
		            columns:	[
		                    	 search.createColumn({name: "id",summary: "GROUP"}),
		                    	 search.createColumn({name: "custrecord_acq_loth_zzz_zzz_shareholder",summary: "GROUP",label: "Shareholder"}),
		                    	 search.createColumn({name: "custrecord_acq_loth_zzz_zzz_deal",summary: "GROUP",label: "Deal"}),
		                    	 search.createColumn({name: "custrecord_acq_lot_payment_import_record",summary: "GROUP",label: "DER - Deal Event"}),
		                    	 search.createColumn({name: "custrecord_acq_loth_zzz_zzz_acqstatus",summary: "GROUP",label: "Acquiom Status"}),
		                    	 search.createColumn({name: "formulatext",summary: "GROUP",formula: "CASE WHEN {custrecord_acq_lot_priority_payment} is NULL THEN ' ' ELSE {custrecord_acq_lot_priority_payment} END",label: "Priority Payment Type"}),
		                    	 search.createColumn({name: "custrecord_acq_lotce_zzz_zzz_payment",join: "CUSTRECORD_ACQ_LOTCE_ZZZ_ZZZ_PARENTLOT",summary: "SUM",sort: search.Sort.DESC}),

		                    	 search.createColumn({name: "formulacurrency",summary: "SUM",formula: f, label: "LOTCE Payment"}),
		                    	 search.createColumn({name: "custrecord_exrec_fx_settlement_amount",summary: "MAX"}),		                    	 
		                    	 ]
	            }); 

	            log.debug(funcName, ss);
	            
	            ss = priLibrary.searchAllRecords(ss); 
	            
	            var rowNbr = 0;
	            
	            var totalPayment = 0, totalExchange = 0, totalLOT = 0;
	            
	            for (i in ss) {
	            	var result = ss[i];

	            	var id = result.getValue({name: "id",summary: "GROUP"});
	            	
	    			var theLink = "<a href=\"" +url.resolveRecord({recordType: "customrecord_acq_lot", recordId: id})+ "\" target=\"_blank\" style=\"\">"+id+"</a>"        	    			       				
           			theList.setSublistValue({id: "id", line: rowNbr, value: theLink });
	       			
	            	theList.setSublistValue({id: "shareholder", line: rowNbr, value: result.getText({name: "custrecord_acq_loth_zzz_zzz_shareholder",summary: "GROUP"})});
	            	theList.setSublistValue({id: "deal", line: rowNbr, value: result.getText({name: "custrecord_acq_loth_zzz_zzz_deal",summary: "GROUP"})});
	            	theList.setSublistValue({id: "der", line: rowNbr, value: result.getText({name: "custrecord_acq_lot_payment_import_record",summary: "GROUP"})});
	            	theList.setSublistValue({id: "status", line: rowNbr, value: result.getText({name: "custrecord_acq_loth_zzz_zzz_acqstatus",summary: "GROUP"})});
	            	theList.setSublistValue({id: "paymenttype", line: rowNbr, value: priLibrary.getSearchResultValueByLabel(result,"Priority Payment Type")});
	            	
	            	theList.setSublistValue({id: "exchg_amount", line: rowNbr, value: result.getValue({name: "custrecord_exrec_fx_settlement_amount",summary: "MAX"})});
	            	theList.setSublistValue({id: "lotce_amount", line: rowNbr, value: priLibrary.getSearchResultValueByLabel(result, "LOTCE Payment")});
            		
	            	totalExchange += Number(result.getValue({name: "custrecord_exrec_fx_settlement_amount",summary: "MAX"}));
	            	totalLOT += Number(priLibrary.getSearchResultValueByLabel(result, "LOTCE Payment"));
	            	
	            	rowNbr++;
	            }
				
       			theList.setSublistValue({id: "id", line: rowNbr, value: "<b>Overall Total</b>"});
            	theList.setSublistValue({id: "exchg_amount", line: rowNbr, value: totalExchange});
            	theList.setSublistValue({id: "lotce_amount", line: rowNbr, value: totalLOT});
        						
			}
			
			
			//======================================================================================================================================
			//======================================================================================================================================
			
			/*
			 * addSuiteletToForm
			 * 		purpose:		adds a suitelet as an IFRAME to the current form, on any tab, or the main tab
			 * 		parameters:
			 * 			scriptId:		the scriptID of the suitelet to add
			 * 			deploymentId: 	the deploymentId of the suitelet to add
			 * 			scriptParams:	the script parameters to pass to the suitelet
			 * 			tabLabel:		the label of the Tab to target (eg "Related Records").  if this is non-blank, and doesn't exist, it will be created
			 * 			groupLabel:		this will be ONLY used if tabLabel is blank, and the suitelet is being added to the "main" part of the page
			 * 			width/height	the width and height that the iframe should occupy; if suitelet is being rendered on the main page, in a specific group, then it will be automatically set to 100% width
			 */
			
			function addSuiteletToForm(form, scriptId, deploymentId, scriptParms, tabLabel, groupLabel, width, height) {
				
				var funcName = scriptName + "addSuiteletToForm ";  

				var scriptURL = url.resolveScript({
					scriptId: 		scriptId, 
					deploymentId: 	deploymentId, 
					params: 		scriptParms
				});

				
				if (tabLabel) {
		    		var tabId = findTabId(form, tabLabel);
		    		
		    		if (!tabId) {
		    			tabId = "custpage_tab_" + scriptId.toLowerCase();  
		    			form.addTab({id: tabId, label: tabLabel});
		    		} 

		    		containerId = tabId; 					
				} else {
					// add it to the "main" page
				
					var containerId; 
					
					if (groupLabel) {
						containerId = "custpage_g_" + scriptId.toLowerCase(); 						
						form.addFieldGroup({id: containerId, label: groupLabel});						
						var forceFullWidth = true; 
						width = "100%"; 
					}
					
				}

				var fldObj = {
						id: 		'custpage_c_' + scriptId.toLowerCase(),
						label: 		'HTML IFRAME Container',
						type: 		serverWidget.FieldType.INLINEHTML,
				};
				
				if (containerId)
					fldObj.container = containerId; 
				
				var fld = form.addField(fldObj); 


				fld.defaultValue = '<iframe name="custpage_i_' + scriptId.toLowerCase() + '"' 
					+ 'src="'
					+ scriptURL
					+ '&custparam_hidenavbar=T&ifrmcntnr=T'
					+ '" '
					+ 'width="' + width + '" height="' + height + '" '
					+ 'frameborder="0" '
					+ 'longdesc="Show input UI to select and apply money to DERs"></iframe>';
				

				// if this is being rendered on the main tab, in the "main" area, then add a script which will push this out to "full width" 
				
				if (forceFullWidth) {
					form.addField({id : 'custpage_h_' + scriptId.toLowerCase(),label : 'hidden script',type : serverWidget.FieldType.INLINEHTML}).defaultValue = '<script>'
						 +'jQuery(document).ready(function() {'
							 +'jQuery("#tr_fg_' + containerId + '")'
							 	+'.find("td").first().attr("width", "100%");'
						 +'})'
					 +'</script>';
					
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
			
		return {
			beforeLoad:		beforeLoad,
			beforeSubmit:	beforeSubmit,
			afterSubmit:	afterSubmit
		}
});


