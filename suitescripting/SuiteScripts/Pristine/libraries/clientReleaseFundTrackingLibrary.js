/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * Library for ATP-1072 - ATP-1073
 */

define(['N/search', 'N/runtime', 'N/ui/dialog'],
       
    /**
        Client Fund Release Tracking - UserEvent Script
    */
    function (search, runtime, dialog) {

        /**
         * // Description: Finds CFRT records on the same deal that are not cancelled or completed and adds the amount. 
         * @param {integer} current_deal_id 
         * @param {integer} currencyID
         * @param {integer} crfID
         * @returns {float} totalAmount
         */
        function active_crf_amounts(current_deal_id, currencyID, crfID) {
            var totalAmount = 0;
            var crfIDfilters = [];

            if (Boolean(crfID)) {
                crfIDfilters.push(search.createFilter({
                    name: 'internalid',
                    operator: 'noneof',
                    values: crfID
                }));
            }
            crfIDfilters.push(search.createFilter({
                name: 'custrecord_crf_trk_deal',
                operator: 'anyof',
                values: current_deal_id
            }));
            crfIDfilters.push(search.createFilter({
                name: 'custrecord_crf_trk_status',
                operator: 'noneof',
                values: ["5", "6", "7"]
            }));
            crfIDfilters.push(search.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: "F"
            }));
            crfIDfilters.push(search.createFilter({
                name: 'custrecord_crf_trk_currency',
                operator: 'anyof',
                values: currencyID
            }));

            var customrecord_client_release_trackingSearchObj = search.create({
                type: "customrecord_client_release_tracking",
                filters: crfIDfilters,
                columns: [
                    search.createColumn({
                        name: "custrecord_crf_trk_amount",
                        summary: "SUM",
                        label: "Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_crf_trk_deal",
                        summary: "GROUP",
                        label: "Deal"
                    }),
                    search.createColumn({
                        name: "custrecord_crf_trk_currency",
                        summary: "GROUP",
                        label: "Currency"
                    })
                ]
            })
            var result = customrecord_client_release_trackingSearchObj.run().getRange({
                start: 0,
                end: 1
            })[0];
            log.debug("search result", JSON.stringify(result));

            if (result != undefined) {
                totalAmount = result.getValue({
                    name: 'custrecord_crf_trk_amount',
                    summary: 'SUM'
                });
                log.debug('total amount from library: ', totalAmount);
            } else {
                log.debug('search result is undefined');
            }
            return totalAmount;

        }

        /**
         * // Description: This search sums the amount deposited in each currency for that deal
         * @param {integer} current_deal_id
         * @returns {object} currencies_and_balances [currency, balance, currencyID]
         */
        function currencies_and_balances(current_deal_id) {
            var currencies_and_balances = [];
            var currencyJSONlist = currencyJSON();

            var customerSearchObj = search.create({
                type: "customer",
                filters: [
                    ["category", "anyof", "1"],
                    "AND",
                    ["isinactive", "is", "F"],
                    "AND",
                    ["internalidnumber", "equalto", current_deal_id]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "entityid",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "currency",
                        join: "customerCurrencyBalance",
                        label: "Currency"
                    }),
                    search.createColumn({
                        name: "fxdepositbalance",
                        join: "customerCurrencyBalance",
                        label: "Deposit Balance (Foreign Currency)"
                    })
                ]
            });
            var searchResultCount = customerSearchObj.runPaged().count;
            log.debug("customerSearchObj result count", searchResultCount);
            customerSearchObj.run().each(function (result) {
                currencies_and_balances.push({
                    currency: result.getValue({
                        'name': 'currency',
                        'join': 'customerCurrencyBalance'
                    }),
                    balance: result.getValue({
                        'name': 'fxdepositbalance',
                        'join': 'customerCurrencyBalance'
                    })
                })

                return true;
            });

            // matching and assigning id to the currencies and balances object
            for (var i = 0; i < currencies_and_balances.length; i++) {

                for (var x = 0; x < currencyJSONlist.length; x++) {
                    if (currencies_and_balances[i].currency == currencyJSONlist[x].name) {
                        currencies_and_balances[i].currencyID = currencyJSONlist[x].internalid;
                    }
                }
            }

            log.debug('currencies & balances', currencies_and_balances);
            return currencies_and_balances;

        }

        /**
         * Description: returns a name and id of all currencies in the system
         * @returns {object} currencyList 
         */
        function currencyJSON() {
            var currencyList = [];
            var customerSearchObj = search.create({
                type: "currency",
                filters: [],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "name",
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "symbol",
                        label: "SYMBOL"
                    })
                ]
            });
            var searchResultCount = customerSearchObj.runPaged().count;
            log.debug("customerSearchObj result count", searchResultCount);
            customerSearchObj.run().each(function (result) {
                currencyList.push({
                    name: result.getValue({
                        'name': 'name'
                    }),
                    internalid: result.getValue({
                        'name': 'internalid'
                    })
                })
                return true;
            });
            return currencyList;
        }

        /**
         * Description: This function ensures that the current amount does not exceed the available balance
         * @param {integer} currencyID 
         * @param {integer} dealID
         * @param {float} crf_amount 
         * @param {integer} recID
         * @returns {boolean} success
         */
        function validate(currencyID, dealID, crf_amount, recID) { 
            var success = true;
            var message;
            var balanceOnCurrency;
            var activeCRFtotal;
            var custDepositBal;
            var availableBalanceInit;
            try {
                balanceOnCurrency = currencies_and_balances(dealID);
                console.log("currencies and balances" + balanceOnCurrency);
                activeCRFtotal = active_crf_amounts(dealID, currencyID, recID);
                console.log("active crf total - " + activeCRFtotal);
                custDepositBal = getCustomerDepositBalance(currencyID, balanceOnCurrency); //".00"
                console.log("cust dep bal - " + custDepositBal);
                availableBalanceInit = 0;
                availableBalanceInit = custDepositBal - activeCRFtotal;
                availableBalanceInit = availableBalanceInit.toFixed(2);
                console.log("approve: activeCRFtotal: " + activeCRFtotal);
                console.log("approve: custDepositBal: " + custDepositBal);
                console.log("approve: availableBalance: " + availableBalanceInit);

                if (availableBalanceInit < 0) { 
                    alert("negative available   balance");
                    success = false;
                }

                log.debug("crf amount in the library: ", crf_amount);
                log.debug("available balance init: ", availableBalanceInit);
                function dialogsuccess(result) { if (result) { location.reload(true) } }

                if (crf_amount > availableBalanceInit) {
                    success = false;
                    dialog.alert({
                        title: 'Invalid Amount',
                        message: "The current amount is higher than what is available in the selected currency. Please reject the record for edit and re-evaluation.",
                    }).then(dialogsuccess).catch();
                }  

            } catch (e) {
                log.error("e message: ", e.message);
                log.error("e object: ", JSON.stringify(e));

            }
            return success;
        }

        /**
         * Description: Return the amount that is deposited in the selected currency for the deal
         * @param {integer} selectedCurrency 
         * @param {object} currencies_and_balances
         * @returns {float} currencyAmount
         */
        function getCustomerDepositBalance(selectedCurrency, currencies_and_balances) {
            var currencyAmount = 0;
            for (var i = 0; i < currencies_and_balances.length; i++) {
                if (currencies_and_balances[i].currencyID == selectedCurrency) {
                    currencyAmount = currencies_and_balances[i].balance;
                    break;
                }

            }
            return currencyAmount;
        }
        function customerBalanceAvailable(crfID)
        {
        		log.debug("customerBalanceAvailable", "starting");
        	    var balanceIsAvailable = false;
        	    var retValue = {};
        	    if (!crfID)
        	    {
        	    	return;
        	    }
	        	var recLookup = search.lookupFields({
					type: "customrecord_client_release_tracking",
					id: crfID,
					columns: ["custrecord_crf_trk_amount", "custrecord_crf_trk_currency", "custrecord_crf_trk_deal", "custrecord_crf_trk_activity"]
				});
	        	var currencyID = (recLookup["custrecord_crf_trk_currency"] && recLookup["custrecord_crf_trk_currency"][0] && recLookup["custrecord_crf_trk_currency"][0].value) || 0;
	        	var DealID = (recLookup["custrecord_crf_trk_deal"] && recLookup["custrecord_crf_trk_deal"][0] && recLookup["custrecord_crf_trk_deal"][0].value) || 0;
	        	var activity = recLookup["custrecord_crf_trk_activity"];
				var currencies_and_balances_result = currencies_and_balances(DealID);
				var custDepositBal = getCustomerDepositBalance(currencyID, currencies_and_balances_result);
	        	
				log.debug("currencyID", currencyID);
				log.debug("DealID", DealID);
				log.debug("custDepositBal", custDepositBal);
				
	        	
	        	var amount = recLookup["custrecord_crf_trk_amount"];
	        	retValue.deposit = custDepositBal;
	        	retValue.amount = amount;
	        	if (parseFloat(custDepositBal)>=parseFloat(amount)) //for created CRF records, amount is already included against available ballance
	        	{
	        		balanceIsAvailable = true;
	        	}
	        	retValue.success = balanceIsAvailable;
	        	return retValue;
        }
        return {
            currencies_and_balances: currencies_and_balances,
            currencyJSON: currencyJSON,
            active_crf_amounts: active_crf_amounts,
            getCustomerDepositBalance: getCustomerDepositBalance,
            customerBalanceAvailable : customerBalanceAvailable,
            validate: validate,
            status_in_progress : 1,
            status_pending_approval : 2,
            status_approved : 3,
            status_rejected : 4,
            status_cancelled : 5,
            status_completed: 6,
            status_failed: 7
        };
    });