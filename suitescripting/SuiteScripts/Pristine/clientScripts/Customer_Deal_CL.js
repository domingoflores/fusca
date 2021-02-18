/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * ATP-1679
 */

define(['N/runtime', 'N/ui/dialog', 'N/currentRecord', 'N/record', 'N/ui/message', 'N/search', '/SuiteScripts/Pristine/libraries/Customer_Deal_Library.js'],

    /**
        Customer - Deal - Client Script
    */
    function (runtime, dialog, currentRecord, record, message, search, cuDealLibrary) {

        var scriptName = "Customer_Deal_CL.js";
        var conditional_fields = ['custentity_acq_deal_fx_level', 'custentity_acq_deal_fx_provider'];
        var conditional_fields_notemp = ['custentity_acq_deal_fx_level', 'custentity_acq_deal_fx_provider'];
        var cust_field = ['custpage_acq_deal_fx_settle_currencies', 'custpage_acq_deal_funded_currency'];
        var SRS_Deal_Form_copy_082213 = 120;

        // beginning of pageInit
        function pageInit(context) {

            console.log('PAGEINIT: page init entered')
            console.log('PAGEINIT: Runtime Execution Context: ', JSON.stringify(runtime.executionContext));
            console.log('PAGEINIT: Runtime ContextType: ', JSON.stringify(runtime.ContextType));

            var currentREC = context.currentRecord;

            var cuID = currentREC.getValue('id');
            console.log("PAGEINIT: CURRENTRECORDID: " + cuID);

            var fx_currency_cb = currentREC.getValue('custentity_acq_deal_fx_curr_cbox');
            var fxlevel = currentREC.getValue('custentity_acq_deal_fx_level');
            var fxprovider = currentREC.getValue('custentity_acq_deal_fx_provider');
            var fxcurrencies = currentREC.getField('custpage_acq_deal_fx_settle_currencies');
            var funded_currency = currentREC.getValue('custentity_acq_deal_funded_currency');
            var custom_funded_currency = currentREC.getValue('custpage_acq_deal_funded_currency');
            var custom_form = currentREC.getValue('customform');


            console.log("PAGEINIT: checkbox_value: " + fx_currency_cb);
            console.log("PAGEINIT: fxlevel_value: " + fxlevel);
            console.log("PAGEINIT: fxprovider_value: " + fxprovider);
            console.log("PAGEINIT: fxcurrencies_value: " + JSON.stringify(fxcurrencies));
            console.log("PAGEINIT: funded_currency: " + JSON.stringify(funded_currency));
            console.log("PAGEINIT: custom_funded_currency: " + JSON.stringify(custom_funded_currency));

            if(custom_form == SRS_Deal_Form_copy_082213 && !fx_currency_cb){
                disableFields(context, cust_field)
            }

            if(custom_form == SRS_Deal_Form_copy_082213 && fx_currency_cb){
                enableFields(context, cust_field)
            }

            if (!fx_currency_cb && fxcurrencies) {
                notMandatory(context, cust_field)
            }

            if (Boolean(fx_currency_cb)) { //if the checkbox is true
                enableFields(context, conditional_fields_notemp)
                yesMandatory(context, conditional_fields_notemp)
            } else if (Boolean(fx_currency_cb === false)) {
                disableFields(context, conditional_fields_notemp)
                clearFields(context, conditional_fields_notemp)
                notMandatory(context, conditional_fields_notemp)
            }
        }

        // end of pageInit

        // beginning of fieldChanged
        function fieldChanged(context) {

            console.log('FIELDCHANGED', 'context.fieldId: ' + context.fieldId);
            var currentREC = context.currentRecord;

            if (context.fieldId === 'custentity_acq_deal_fx_curr_cbox') {
                var fx_currency_cb = currentREC.getValue('custentity_acq_deal_fx_curr_cbox');
                console.log("FIELDCHANGED: checkbox_value: " + fx_currency_cb);

                if (Boolean(fx_currency_cb)) {
                    enableFields(context, cust_field)
                    enableFields(context, conditional_fields)
                    yesMandatory(context, cust_field)
                    yesMandatory(context, conditional_fields)

                } else if (fx_currency_cb === false) {
                    clearFields(context, cust_field)
                    disableFields(context, cust_field)
                    disableFields(context, conditional_fields)
                    clearFields(context, conditional_fields)
                    notMandatory(context, conditional_fields)
                    notMandatory(context, cust_field)
                }

            }

            if (context.fieldId === 'custentity_acq_deal_fx_provider') {
                var paymentBankID = currentREC.getValue('custentity_acq_deal_fx_provider');
                console.log("FIELDCHANGED: paymentBankID: " + paymentBankID);

                var fx_settlement_currencies = context.currentRecord.getField({
                    fieldId: 'custpage_acq_deal_fx_settle_currencies'
                });

                var custom_funded_currency = context.currentRecord.getField({
                    fieldId: 'custpage_acq_deal_funded_currency'
                });

                console.log('field object of custom fx settlement field client side: ' + JSON.stringify(fx_settlement_currencies));
                console.log('field object of custom funded currency field client side: ' + JSON.stringify(custom_funded_currency));


                if (Boolean(fx_settlement_currencies)) {
                    resetList(fx_settlement_currencies);
                }

                if (Boolean(custom_funded_currency)) {
                    resetList(custom_funded_currency);
                }

                if (Boolean(paymentBankID)) {
                    yesMandatory(context, cust_field)
                    var pb_currencies_result = cuDealLibrary.paymentBankCurrencies(paymentBankID);

                    console.log("currencyList from PaymentBankCurrencies() SEARCH: ", JSON.stringify(pb_currencies_result));

                    for (var i = 0, len = pb_currencies_result.length; i < len; i++) {
                        fx_settlement_currencies.insertSelectOption({
                            text: pb_currencies_result[i].name,
                            value: pb_currencies_result[i].internalid,
                        });

                    }
                }
                if (Boolean(paymentBankID)) {
                    yesMandatory(context, cust_field)
                    var pb_currencies_result = cuDealLibrary.paymentBankCurrencies(paymentBankID);

                    console.log("currencyList from PaymentBankCurrencies() SEARCH: ", JSON.stringify(pb_currencies_result));
                    custom_funded_currency.insertSelectOption({
                        value: " ",
                        text: " "
                    });  
                    for (var i = 0, len = pb_currencies_result.length; i < len; i++) {
                        custom_funded_currency.insertSelectOption({
                            text: pb_currencies_result[i].name,
                            value: pb_currencies_result[i].internalid,
                        });

                    }
                }
            }


            if (context.fieldId === 'custpage_acq_deal_fx_settle_currencies') {
                var selectedCurrencies = currentREC.getValue('custpage_acq_deal_fx_settle_currencies');
                console.log("FIELDCHANGED: selectedCurrencies on temp field: " + selectedCurrencies);

                currentREC.setValue({
                    fieldId: 'custentity_acq_deal_fx_settle_currencies',
                    value: selectedCurrencies,
                    ignoreFieldChange: true
                })
            }

            if (context.fieldId === 'custpage_acq_deal_funded_currency') {
                var selectedFundedCurrency = currentREC.getValue('custpage_acq_deal_funded_currency');
                console.log("FIELDCHANGED: selectedCurrencies on temp field: " + selectedFundedCurrency);

                currentREC.setValue({
                    fieldId: 'custentity_acq_deal_funded_currency',
                    value: selectedFundedCurrency,
                    ignoreFieldChange: true
                })
            }

        } // end of fieldChanged

        function saveRecord(context) {

            var currentREC = context.currentRecord;

            var selectedCurrencies = currentREC.getValue('custpage_acq_deal_fx_settle_currencies');
            console.log("SAVERECORD: selectedCurrencies on temp field: " + selectedCurrencies);
            try {
                currentREC.setValue({
                    fieldId: 'custentity_acq_deal_fx_settle_currencies',
                    value: selectedCurrencies,
                    ignoreFieldChange: true
                });
            } catch (e) {
                console.log(e.message)
            }
            console.log('on save after SaveRecord')

            var selectedFundedCurrency = currentREC.getValue('custpage_acq_deal_funded_currency');
            console.log("SAVERECORD: selectedFundedCurrency on temp field: " + selectedFundedCurrency);
            try {
                currentREC.setValue({
                    fieldId: 'custentity_acq_deal_funded_currency',
                    value: selectedFundedCurrency,
                    ignoreFieldChange: true
                });
            } catch (e) {
                console.log(e.message)
            }

            var fx_currencies_allowed = currentREC.getValue('custentity_acq_deal_fx_curr_cbox');
            var fx_level = currentREC.getValue('custentity_acq_deal_fx_level');
            var fx_provider = currentREC.getValue('custentity_acq_deal_fx_provider');


            if (fx_currencies_allowed && !fx_level) {
                dialog.alert({
                    title: 'FX LEVEL is a mandatory field',
                    message: 'Please set a value and try again'
                }).then().catch();
                return false;
            }
            if (fx_currencies_allowed && !fx_provider) {
                dialog.alert({
                    title: 'FX Provider is a mandatory field',
                    message: 'Please set a value and try again'
                }).then().catch();
                return false;
            }

            return true;
        }

        //===========================================HELPER FUNCTIONS===========================================================

        function resetList(list) {
            list.removeSelectOption({
                value: null,
            });
        }

        function disableFields(context, array) {
            for (var i = 0; i < array.length; i++) {
                fieldObject = context.currentRecord.getField({
                    fieldId: array[i]
                });
                fieldObject.isDisabled = true;
            }
        }

        function clearFields(context, array) {

            for (var i = 0; i < array.length; i++) {
                context.currentRecord.setValue(array[i], '')
            };
        }

        function notMandatory(context, array) {

            for (var i = 0; i < array.length; i++) {
                fieldObject = context.currentRecord.getField({
                    fieldId: array[i]
                });
                fieldObject.isMandatory = false;
            }
        }

        function yesMandatory(context, array) {

            for (var i = 0; i < array.length; i++) {
                fieldObject = context.currentRecord.getField({
                    fieldId: array[i]
                });
                fieldObject.isMandatory = true;
            }

        }

        function enableFields(context, array) {
            for (var i = 0; i < array.length; i++) {
                fieldObject = context.currentRecord.getField({
                    fieldId: array[i]
                });
                fieldObject.isDisabled = false;
            }
        }
        //=====================================================RETURN==============================================================

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });