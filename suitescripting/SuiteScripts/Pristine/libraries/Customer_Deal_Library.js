/**
 * @NApiVersion 2.x
 * @NModuleScope public
 * Library for Customer Deal
 */

define(['N/search'],

    function (search) {

        function paymentBankCurrencies(paymentBankID) {
            log.debug("paymentBANKID inside search function: ", paymentBankID);
            var pbCurrencies = [];
            var customrecord_payment_bankSearchObj = search.create({
                type: "customrecord_payment_bank",
                filters: [
                    ["internalidnumber", "equalto", "" + paymentBankID + ""]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        join: "CUSTRECORD_PB_SETTLEMENT_CURRENCIES"
                    }),
                    search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_PB_SETTLEMENT_CURRENCIES"
                    })
                ]
            });
            var searchResultCount = customrecord_payment_bankSearchObj.runPaged().count;
            log.debug("customrecord_payment_bankSearchObj result count", searchResultCount);
            customrecord_payment_bankSearchObj.run().each(function (result) {
                pbCurrencies.push({
                    name: result.getValue({
                        'name': "name",
                        join: "CUSTRECORD_PB_SETTLEMENT_CURRENCIES"
                    }),
                    internalid: result.getValue({
                        'name': "internalid",
                        join: "CUSTRECORD_PB_SETTLEMENT_CURRENCIES"
                    })
                })
                return true;
            });
            return pbCurrencies;

        }

        function removedCurrenciesExRecCheck(dealID, removedCurrencies) {
            if (!removedCurrencies.length) {
                // array does not exist, is not an array, or is empty
                // do not attempt to process array
                return;
            }
            var customrecord_acq_lotSearchObj = search.create({
                type: "customrecord_acq_lot",
                filters: [
                    ["custrecord_acq_loth_zzz_zzz_deal", "anyof", dealID],
                    "AND",
                    ["custrecord_exrec_shrhldr_settle_curr", "anyof", removedCurrencies]
                ]
            });
            var searchResultCount = customrecord_acq_lotSearchObj.runPaged().count;
            log.debug("###customrecord_acq_lotSearchObj result count###", searchResultCount);
            return searchResultCount;
        }

        function haveCurrenciesBeenRemoved(newRecCurrencies, oldRecCurrencies) {
            var removedCurrencies = [];
            for (ix in oldRecCurrencies) {
                var found = false;
                for (jx in newRecCurrencies) {
                    if (newRecCurrencies[jx] == oldRecCurrencies[ix]) {
                        found = true;
                    }
                }
                if (!found) {
                    removedCurrencies.push(oldRecCurrencies[ix])
                }
                //removing USD from the removed fx currencies list
                var index = removedCurrencies.indexOf("1");
                if (index > -1) {
                    removedCurrencies.splice(index, 1);
                }
            }
            return removedCurrencies;
        }

        return {
            paymentBankCurrencies: paymentBankCurrencies,
            removedCurrenciesExRecCheck: removedCurrenciesExRecCheck,
            haveCurrenciesBeenRemoved: haveCurrenciesBeenRemoved
        };
    });