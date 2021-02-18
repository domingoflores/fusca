/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * ATP-1072 - ATP-1073
 */

define(['N/runtime', 'N/ui/dialog', 'N/currentRecord', 'N/record', "N/url", 'N/ui/message', 'N/https', 'N/search', 'SuiteScripts/Pristine/libraries/clientReleaseFundTrackingLibrary.js', '/SuiteScripts/Pristine/libraries/toolsLibraryClient.js' ],

    /**
        Client Fund Release Tracking - Client Script
    */
    function (runtime, dialog, currentRecord, record, url, message, https, search, crflibrary, toolslibclient) {

        var scriptName = "clientReleaseFundTracking_CL.js";
        var currencies_and_balances;
        var activeCRFtotal = 0;
        var currentREC;

        // beginning of pageInit
        function pageInit(context) {

            console.log('PAGEINIT: page init entered')
            console.log('PAGEINIT: Runtime ContextType: ', JSON.stringify(runtime.executionContext));

            var currentREC = context.currentRecord;

            var crfID = currentREC.getValue('id');
            console.log("PAGEINIT: CURRENTRECORDID: " + crfID);

            var dealID = currentREC.getValue('custrecord_crf_trk_deal');

            var currencyID = currentREC.getValue('custrecord_crf_trk_currency');
            if (currencyID) {} else {
                currencyID = currentREC.getValue('custpage_crf_currency');
            }

            currentREC.setValue({
                fieldId: 'custrecord_crf_trk_currency',
                value: currencyID,
                ignoreFieldChange: true
            })

            var crf_amount = currentREC.getValue({
                fieldId: 'custrecord_crf_trk_amount'
            });
            console.log("PAGEINIT: crf_amount =" + crf_amount);

            if (currencyID) {
                currencies_and_balances = crflibrary.currencies_and_balances(dealID);
                console.log("PAGEINIT: currencies_and_balances =" + JSON.stringify(currencies_and_balances));
                console.log("pAGEINIT: dealID, currencyID, crfID " + dealID + " " + currencyID + " " + crfID)
                activeCRFtotal = crflibrary.active_crf_amounts(dealID, currencyID, crfID);
            }
            console.log("PAGEINIT: active CRF TOTAL " + activeCRFtotal);
            console.log("PAGEINIT: activeCRF TOTAL TYPE " + (typeof activeCRFtotal));

            var selectedCurrency = currentREC.getValue('custpage_crf_currency');
            console.log("PAGEINIT: selectedCurrency " + selectedCurrency);
            var custDepositBal = crflibrary.getCustomerDepositBalance(selectedCurrency, currencies_and_balances);

            var availableBalanceInit = 0;
            availableBalanceInit = custDepositBal - activeCRFtotal;
            availableBalanceInit = availableBalanceInit.toFixed(2);

            currentREC.setValue({
                fieldId: 'custrecord_crf_trk_cus_deposit_bal',
                value: custDepositBal,
                ignoreFieldChange: true
            })

            currentREC.setValue({
                fieldId: 'custrecord_crf_trk_available_bal',
                value: availableBalanceInit,
                ignoreFieldChange: true
            })
        }
        // end of pageInit

        // beginning of fieldChanged
        function fieldChanged(context, activeCRFtotal) {

            // Do not let the user enter negative amounts
            if (context.fieldId === 'custrecord_crf_trk_amount') {
                var amount = context.currentRecord.getValue({
                    fieldId: 'custrecord_crf_trk_amount'
                });
                if (amount < 0) {
                    dialog.alert({
                        title: 'Invalid Amount',
                        message: 'Amount may not be negative. Click OK to continue.'
                    }).then().catch();
                    context.currentRecord.setValue({
                        fieldId: 'custrecord_crf_trk_amount',
                        value: ''
                    });
                }
            }


            try {
                console.log('fieldChanged', 'context.fieldId: ' + context.fieldId);
                var currentREC = context.currentRecord;
                var activeCRFtotal = 0;
                var crf_deposit_balance = 0;

                if (context.fieldId === 'custpage_crf_currency') {
                    var selectedCurrency = currentREC.getValue('custpage_crf_currency');
                    var custDepositBal = crflibrary.getCustomerDepositBalance(selectedCurrency, currencies_and_balances);

                    console.log("FIELDCHANGED: custDepositBal" + custDepositBal);

                    currentREC.setValue({
                        fieldId: 'custrecord_crf_trk_currency',
                        value: selectedCurrency,
                        ignoreFieldChange: true
                    })

                    currentREC.setValue({
                        fieldId: 'custrecord_crf_trk_amount',
                        value: '',
                        ignoreFieldChange: true
                    })

                    //mapping the selectedCurrency with the id in the currencies_and_balances object
                    for (var i = 0; i < currencies_and_balances.length; i++) {
                        if (currencies_and_balances[i]["currencyID"] == selectedCurrency) {
                            currentREC.setValue({
                                fieldId: 'custrecord_crf_trk_cus_deposit_bal',
                                value: currencies_and_balances[i]["balance"],
                                ignoreFieldChange: true
                            });
                            break;
                        }
                    }

                    console.log("FIELDCHANGED: currency " + selectedCurrency)
                    //re-calculate customer available balance because currency has changed.

                    var dealID = currentREC.getValue('custrecord_crf_trk_deal');
                    var crf_amount = currentREC.getValue('custrecord_crf_trk_amount');
                    console.log("Current Amount FIELDCHANGE : " + crf_amount + " CURRENCY ID : " + selectedCurrency + " DEAL ID: " + dealID);

                    var crfID = currentREC.getValue('id');
                    console.log("FIELDCHANGE: CURRENTRECORDID: " + crfID);

                    var activeCRFtotallib = crflibrary.active_crf_amounts(dealID, selectedCurrency, crfID);
                    activeCRFtotal = activeCRFtotallib + crf_amount;

                    var availableBalanceCurrencyChange = custDepositBal - activeCRFtotal;
                    var setavailable = availableBalanceCurrencyChange.toFixed(2);
                    console.log("FIELDCHANGE: availableBalanceCurrencyChange" + setavailable);

                    if (setavailable >= 0) {
                        currentREC.setValue({
                            fieldId: 'custrecord_crf_trk_available_bal',
                            value: setavailable,
                            ignoreFieldChange: true
                        })
                    }
                    if (setavailable < 0) {
                        currentREC.setValue({
                            fieldId: 'custrecord_crf_trk_available_bal',
                            value: 0,
                            ignoreFieldChange: true
                        })
                    }

                }
            } catch (e) {
                log.error("try catch: ", e.message)
                log.error("try catch: ", JSON.stringify(e))
            }

        } // end of fieldChanged

        // beginning of saveRecord
        function saveRecord(context) {
            var currentREC = context.currentRecord;
            var crf_amount = currentREC.getValue('custrecord_crf_trk_amount');
            var bal_available = currentREC.getValue('custrecord_crf_trk_available_bal');
            var status = currentREC.getValue('custrecord_crf_trk_status');
            var inactive = currentREC.getValue('isinactive');
            console.log("inactive flag is: " + inactive);

            //do not allow amount to be higher than what is available
            if (crf_amount > bal_available) {
                dialog.alert({
                    'title': 'Invalid Amount',
                    'message': 'The entered amount is higher than what is available in the selected currency. Please enter a valid amount before saving.'
                });
                return false;
            }
            //if approval is rejected set the record back to in progress after first edit
            if (status == crflibrary.status_rejected) { 
                currentREC.setValue({
                    fieldId: 'custrecord_crf_trk_status',
                    value: crflibrary.status_in_progress,
                    ignoreFieldChange: true
                })
            }
            //if record is inactivated set status to cancelled
            if (inactive) { 
                currentREC.setValue({
                    fieldId: 'custrecord_crf_trk_status',
                    value: crflibrary.status_cancelled,
                    ignoreFieldChange: true
                })
            }

            return true;
        }
        // end of saveRecord

        //  buttons functions
        function sendForReview() {
            var currentREC = currentRecord.get();
            updateStatus(currentREC.id);
            location.reload(true);
        }
        
        /**
         * Description: Updating status of current record after pressing send for review
         * @param {integer} recID 
         */
        function updateStatus(recID) {
            try {
                var id = record.submitFields({
                    type: 'customrecord_client_release_tracking',
                    id: recID,
                    values: {
                        'custrecord_crf_trk_status': crflibrary.status_pending_approval
                    }

                });
            } catch (e) {
                console.log('updateStatus', 'e: ' + JSON.stringify(e));
            }
        }

        /**
         * Description: Reject button functionality
         * @param {integer} recID 
         * @param {string} recTYPE
         */
        function reject(recID, recTYPE) {
            var rejectReason;
            var rejectReason = prompt('Please enter an explanation for Rejecting the release');
            console.log("whats saved in the prompt: " + rejectReason);
            log.debug("reject button: ", recID + "-" + recTYPE + "-" + rejectReason )
            toolslibclient.addUserNote(recID, recTYPE, "REJECT", rejectReason);
            if (rejectReason) {
                try {
                    var id = record.submitFields({
                        type: 'customrecord_client_release_tracking',
                        id: recID,
                        values: {
                            'custrecord_crf_trk_status': crflibrary.status_rejected
                        }

                    });
                } catch (e) {
                    console.log('updateStatus', 'e: ' + JSON.stringify(e));
                }
                location.reload(true);
            }
        }

        /**
         * Description: Approve button functionality
         * @param {integer} currencyID 
         * @param {integer} dealID 
         * @param {float} crf_amount 
         * @param {integer} recID
         * @param {integer} approver
         */
        function approve(currencyID, dealID, crf_amount, recID, approver) {
            console.log("currencyID: " + currencyID + " dealID: " + dealID + " crf_amount: " + crf_amount);
            try {
                var currentREC = currentRecord.get();
                log.debug("current record: ", JSON.stringify(currentREC));
                console.log("current record" + JSON.stringify(currentREC));
                var validateResults = crflibrary.validate(currencyID, dealID, crf_amount, recID);
                console.log("validate results: " + validateResults);
                if (validateResults) { 
                    console.log("before update status function call");
                    updateStatus_approved(currentREC.id, approver);
                    location.reload(true)
                }

            } catch (e) { 
                log.error("e message: ", e.message);
                log.error("e object: ", JSON.stringify(e));

            }
        }
        /**
         * Description: Extends approve button functionality
         * @param {integer} recID 
         * @param {integer} approver 
         */
        function updateStatus_approved(recID, approver) {

            try {
                record.submitFields({
                    type: 'customrecord_client_release_tracking',
                    id: recID,
                    values: {
                        'custrecord_crf_trk_status': crflibrary.status_approved
                    }
                });
                console.log("approver is: " + approver);
                record.submitFields({
                    type: 'customrecord_client_release_tracking',
                    id: recID,
                    values: {
                        'custrecord_crf_trk_approved_by': approver
                    }
                });
                record.submitFields({
                    type: 'customrecord_client_release_tracking',
                    id: recID,
                    values: {
                        'custrecord_crf_trk_approve_dt': new Date()
                    }
                });
                
            } catch (e) {
                console.log('updateStatus', 'e: ' + JSON.stringify(e));
            }
        }
        function createRelatedTransactionsSL(suiteleturl) 
		{
			var currentRec = currentRecord.get();
			var RecID = currentRec.id;
			var messagetype = null;
			var suiteletURL = suiteleturl;
			  
			var myMsg2 = message.create({
	            title: "Creating Related Client Fund Tracking Transactions...", 
	            message: "Please wait...", 
	            type: message.Type.INFORMATION
	        });


	        myMsg2.show();
		        
			
			https.post.promise({
			    url: suiteletURL,
			    body: {}
			})
		    .then(function(response)
		    {
		    	
				location.reload(true);

		    })
		    .catch(function onRejected(reason) {
		        log.error({
		            title: 'Invalid Request: ',
		            details: reason
		        });
		    	location.reload(true);
		    })
		}
        /**
         * Description checkpoint for processing transactions based on approval
         */
        function processTransactions(suiteleturl) 
        {
        	var balanceCheckResult = {};
        	//console.log("processTransactions 1: " + suiteleturl);
        	// Offer confirmation dialog before proceeding
			msg = "Please click OK to create <br>- Bill <br> - Bill Payment <br> - Invoice <br> - Deposit Application";
			//console.log("processTransactions 1: ");
			var options = {
				message: msg,
				title: 'Press OK to Continue'
			};
			dialog.confirm(options).then(function(answer) {
					if (answer) 
					{
						var currentREC = currentRecord.get();
						var crfID = currentREC.id;
						var retValue = crflibrary.customerBalanceAvailable(crfID);
						if (!retValue.success)
			        	{
			        	
							var myMsg2 = message.create({
			    	            title: "Insufficient Customer Balance", 
			    	            message: 'Customer Deposit Balance '+retValue.deposit+' is less than Amount '+retValue.amount+'.  <a href="javascript:location.reload(true)">Refresh View</a>', 
			    	            type: message.Type.ERROR
			    	        });


			    	        myMsg2.show();

			        		
			        		
			                return false;
			        	}
						else
						{
							createRelatedTransactionsSL(suiteleturl);
						}
					}
				})
				.catch(function() {
					
				});
        	
        	
        }
        // end of buttons functions


        //=====================================================RETURN==============================================================

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            sendForReview: sendForReview,
            reject: reject,
            approve: approve,
            processTransactions: processTransactions

        };
    });