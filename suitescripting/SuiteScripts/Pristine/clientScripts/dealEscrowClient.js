/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

/**
	 * -----------------------------------------------------------
	 * dealEscrowClient.js
	 * ___________________________________________________________
	 * Deal Escrow client script
	 *
	 * Version 1.0
	 * Author: Ken Crossman
	 * Date: 2018-11-29	
	 *
	 * ATP-498 2018-11-28 Ken Crossman
	 * ATO-100 2019-05-09 Marko Obradovic  
	 * ___________________________________________________________
	 */
	
define(['N/format', 'N/runtime', 'N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/url', 'N/https', 'N/ui/message', 'N/ui/dialog', ],
	function(format, runtime, currentRecord, log, record, search, url, https, msg, dialog) {

		var scriptName = "dealEscrowClient.js";

		//=====================================================================================================
		//=====================================================================================================
		function pageInit(context) {
			var rcd = context.currentRecord;

			de_escrow_tax_rptg_rqd = rcd.getValue('custrecord_de_escrow_tax_rptg_rqd');
        	if (de_escrow_tax_rptg_rqd == 1) { 
				var objField = context.currentRecord.getField({ fieldId:'custrecord_de_escrow_tax_no_rptg_reason' });
				objField.isDisabled = true;
        	}			
		}
		
		
		
		//=====================================================================================================
		//=====================================================================================================
		function validateField(context) {
			
			var rcd = context.currentRecord;          
	        var fieldId = context.fieldId;
	        
            switch (fieldId) {
            case 'custrecord_de_escrow_tax_rptg_rqd':
            	if (rcd.getValue('custrecord_de_escrow_tax_rptg_rqd') == 1) { // YES 
            		if (rcd.getValue('custrecord_de_escrow_tax_no_rptg_reason') > "") {
            			var msg = "Changing 'ESCROW TAX REPORTING REQUIRED' from 'NO' to 'YES' will cause field 'ESCROW TAX NO REPORTING REASON' to be cleared.";
            			if (   rcd.getValue('custrecord_de_tax_no_reporting_notes').toString().trim() > ""
            			    && rcd.getValue('custrecord_de_escrow_tax_no_rptg_reason') == 4 ) {
            				msg = msg + '\r\n\r\n' + "If you continue, since 'ESCROW TAX NO REPORTING REASON' is set to 'OTHER', you should review the contents of field \r\n'ESCROW TAX REPORTING NOTES' and remove any content related to why 'ESCROW TAX REPORTING REQUIRED' was set to 'NO'. ";
            			}
                		var userResponse = confirm(msg);
                		if (!userResponse) { return false; }  
                		return true;
            		}
            	}
    			de_escrow_tax_rptg_rqd = rcd.getValue('custrecord_de_escrow_tax_rptg_rqd');
            	break;
            }
            
    		return true;          
		}
		

		//=====================================================================================================
		//=====================================================================================================
		function fieldChanged(context) {
			
			var rcd = context.currentRecord;          
	        var fieldId = context.fieldId;
	        
            switch (fieldId) {
            case 'custrecord_de_escrow_tax_rptg_rqd':
            	if (rcd.getValue('custrecord_de_escrow_tax_rptg_rqd') == 1) { // YES
					rcd.setValue({ fieldId:'custrecord_de_escrow_tax_no_rptg_reason' ,value:"" ,ignoreFieldChange:true});
					var objField = context.currentRecord.getField({ fieldId:'custrecord_de_escrow_tax_no_rptg_reason' });
					objField.isDisabled = true;
            	}
            	else { // NO
					var objField = context.currentRecord.getField({ fieldId:'custrecord_de_escrow_tax_no_rptg_reason' });
					objField.isDisabled = false;
            	}
            	break;
            }
          
		}
		
		
		//=====================================================================================================
		//=====================================================================================================
		function saveRecord(context) {

			var rcd = context.currentRecord;
			if (rcd.getValue('custrecord_de_escrow_tax_rptg_rqd') == 2) {
				if (rcd.getValue('custrecord_de_escrow_tax_no_rptg_reason') == "") { 
					showErrorMessage("Escrow Tax Reporting Error", "If ESCROW TAX REPORTING REQUIRED is set to 'NO' then a value must be selected for ESCROW TAX NO REPORTING REASON.");
					return false; 
				}
			}
			if (rcd.getValue('custrecord_de_escrow_tax_no_rptg_reason') == 4) { 
				if (rcd.getValue('custrecord_de_tax_no_reporting_notes').toString().trim() == "") {
					showErrorMessage("Escrow Tax Reporting Error", "'Other' is selected for ESCROW TAX NO REPORTING REASON, an explanation must be entered in ESCROW TAX REPORTING NOTES.");					
					return false; 
				}
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
		function firstDayFundingComplete() {
			console.log('firstDayFundingComplete');
			// Offer confirmation dialog before proceeding
			// To enable user to confirm Bank Fee is acceptable
			var options = {
				message: 'By clicking ok, you are verifying the following items match the terms of the agreement:<table><tr><td>-</td><td>Rate/Product Code</td></tr><tr><td>-</td><td>Term of Escrow</td></tr><tr><td valign=top>-</td><td>Deposit Date and Amount (Booked at Bank and NetSuite)</td></tr><tr><td>-</td><td>Correct GL account and Deal</td></tr></table>',
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function(result) {
					if (result) {
						//If user presses OK then go ahead and void
						console.log('firstDayFundingComplete', 'First Day Funding Complete Requested');
						fdfComplete();
					}
				})
				.catch(function(reason) {});
		}

		function fdfComplete() {
			var currentDERec = currentRecord.get();
			var currentUser = runtime.getCurrentUser().id;
			var timeStamp = getCurrentDateTime();
			var timestampObject = {
				'custrecord_de_fdf_completed_by': currentUser,
				'custrecord_de_fdf_completed_dt': timeStamp
			};
			setTimeStamp(currentDERec.id, timestampObject);
			location.reload(true);
		}

		function reviewComplete() {
			console.log('reviewComplete');
			// Offer confirmation dialog before proceeding
			// To enable user to confirm Bank Fee is acceptable
			var options = {
				message: 'By clicking ok, you are verifying the following items match the terms of the agreement:<table><tr><td>-</td><td>Rate/Product Code</td></tr><tr><td>-</td><td>Term of Escrow</td></tr><tr><td valign=top>-</td><td>Deposit Date and Amount (Booked at Bank and NetSuite)</td></tr><tr><td>-</td><td>Correct GL account and Deal</td></tr></table>',
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function(result) {
					if (result) {
						//If user presses OK then go ahead and void
						console.log('firstDayFundingComplete', 'First Day Funding Complete Requested');
						revComplete();
					}
				})
				.catch(function(reason) {});
		}

		function revComplete() {
			var currentDERec = currentRecord.get();
			var currentUser = runtime.getCurrentUser().id;
			var timeStamp = getCurrentDateTime();
			var timestampObject = {
				'custrecord_de_review_completed_by': currentUser,
				'custrecord_de_review_completed_dt': timeStamp
			};
			setTimeStamp(currentDERec.id, timestampObject);
			location.reload(true);
		}

		function setTimeStamp(dealEscrowId, timestampObject) {
			console.log('setTimeStamp', 'dealEscrowId: ' + JSON.stringify(dealEscrowId));
			console.log('setTimeStamp', 'timestampObject: ' + JSON.stringify(timestampObject));

			try {
				var id = record.submitFields({
					type: 'customrecord_deal_escrow',
					id: dealEscrowId,
					values: timestampObject
				});
			} catch (e) {
				console.log('setTimeStamp', 'e: ' + JSON.stringify(e));
			}

		}

		function getCurrentDateTime() {
			var now = new Date();
			return format.format({
				value: now,
				type: format.Type.DATETIMETZ
			});
		}

		function createGLAccountSL() {
			console.log("createGLAccountSL");
			// Offer confirmation dialog before proceeding
			// To enable user to confirm Bank Fee is acceptable
			var options = {
				message: 'Are you sure you want to continue?',
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function(result) {
					if (result) {
						//If user presses OK then go ahead and void
						console.log('createGLAccountSL', 'Create GL Account Requested');
						createGLAccount();
					}
				})
				.catch(function(reason) {});
		}
		function ReceiveFeesSL() {
			console.log("ReceiveFeesSL");
			// Offer confirmation dialog before proceeding
			// To confirm Receive Fees
			var options = {
				message: 'Are you sure you want to continue?',
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function(result) {
					if (result) {
						//If user presses OK then go ahead and void
						console.log('ReceiveFeesSL', 'Receive Fees Requested');
						ReceiveFees();
					}
				})
				.catch(function(reason) {});
		}
		
		function ReceiveFees() {
			var currentDERec = currentRecord.get();
			var deRecID = currentDERec.id;
			var parmFieldValues = "Testing";

			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_de_utilities_sl',
				deploymentId: 'customdeploy_de_utilities_sl',
				returnExternalUrl: false
			});

			var domain = url.resolveDomain({
				hostType: url.HostType.APPLICATION
			});
			console.log("domain: " + domain);

			var fullSuiteletURL = "https://" + domain + suiteletURL + "&fieldValues=" + parmFieldValues + "&action=ReceiveFees" + "&dealEscrowId=" + deRecID;
			console.log("fullSuiteletURL: " + fullSuiteletURL);

//			var response = https.get({
//				url: fullSuiteletURL
//			});
			
			var myMsg2 = msg.create({
	            title: "Receive Fees Request Started", 
	            message: "Creating Invoice, Customer Payment, Vendor Bill, Bill Payment, and Corporate Invoice. Please wait...", 
	            type: msg.Type.INFORMATION
	        });

			
	        myMsg2.show();
		        
			
			https.post.promise({
			    url: fullSuiteletURL,
			    body: {}
			})
		    .then(function(response)
		    {
		    	
		    	location.reload(true);

		    })
		    .catch(function onRejected(reason) {
//		        log.debug({
//		            title: 'Invalid Request: ',
//		            details: reason
//		        });
		    	location.reload(true);
		    })
			
			

			//
		}

		function createGLAccount() {
			var currentDERec = currentRecord.get();
			var deRecID = currentDERec.id;
			var parmFieldValues = "Testing";

			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_de_utilities_sl',
				deploymentId: 'customdeploy_de_utilities_sl',
				returnExternalUrl: false
			});

			var domain = url.resolveDomain({
				hostType: url.HostType.APPLICATION
			});
			console.log("domain: " + domain);

			var fullSuiteletURL = "https://" + domain + suiteletURL + "&fieldValues=" + parmFieldValues + "&action=createGLAccount" + "&dealEscrowId=" + deRecID;
			console.log("fullSuiteletURL: " + fullSuiteletURL);

			var response = https.get({
				url: fullSuiteletURL
			});

			location.reload(true);
		}

		function createInvoiceSL() {
			console.log("createInvoiceSL");
			// Offer confirmation dialog before proceeding
			// To enable user to confirm Bank Fee is acceptable
			var options = {
				message: 'Are you sure you want to continue?',
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function(result) {
					if (result) {
						//If user presses OK then go ahead and void
						console.log('createInvoiceSL', 'Create Invoice Requested');
						createInvoice();
					}
				})
				.catch(function(reason) {});
		}

		function createInvoice() {
			var currentDERec = currentRecord.get();
			var deRecID = currentDERec.id;
			var parmFieldValues = "Testing";

			var suiteletURL = url.resolveScript({
				scriptId: 'customscript_de_utilities_sl',
				deploymentId: 'customdeploy_de_utilities_sl',
				returnExternalUrl: false
			});

			var domain = url.resolveDomain({
				hostType: url.HostType.APPLICATION
			});
			console.log("domain: " + domain);

			var fullSuiteletURL = "https://" + domain + suiteletURL + "&fieldValues=" + parmFieldValues + "&action=createInvoice" + "&dealEscrowId=" + deRecID;
			console.log("fullSuiteletURL: " + fullSuiteletURL);

			var response = https.get({
				url: fullSuiteletURL
			});

			location.reload(true);
		}

		function escrowAgentActionSL() {
			console.log("escrowAgentActionSL");
			// Offer confirmation dialog before proceeding
			// To enable user to confirm Bank Fee is acceptable
			var options = {
				message: 'Are you sure you want to continue?',
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function(result) {
					if (result) {
						//If user presses OK then go ahead and void
						console.log('escrowAgentActionSL', 'Escrow Agent Action Requested');
						// escrowAgentAction(); // Code to come later
					}
				})
				.catch(function(reason) {});
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			validateField: validateField,
			saveRecord: saveRecord,
			firstDayFundingComplete: firstDayFundingComplete,
			reviewComplete: reviewComplete,
			ReceiveFeesSL : ReceiveFeesSL,
			createGLAccountSL: createGLAccountSL,
			createInvoiceSL: createInvoiceSL,
			escrowAgentActionSL: escrowAgentActionSL
		};
	});