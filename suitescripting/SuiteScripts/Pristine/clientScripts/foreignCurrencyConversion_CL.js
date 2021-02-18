/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currency', 'N/record', 'N/runtime'],

    function(currency, record, runtime) {

        const FIELDS = {
            OG_AMOUNT: 'custrecord_fx_conv_orig_amount',
            CONV_AMT_CERTS: 'custrecord_fx_conv_amt_certs',
            CONV_ISO: 'custrecord_fx_conv_iso',
            OG_ISO: 'custrecord_fx_conv_orig_currency',
            CONV_CURRENCY: 'custrecord_fx_conv_converted_currency',
            FIRST_APPROVER: 'custrecord_fx_conv_first_approver',
            FIRST_APPROVED: 'custrecord_fx_conv_first_approved',
            FIRST_APPROVED_TS: 'custrecord_fx_conv_first_apr_ts',
            SECOND_APPROVER: 'custrecord_fx_conv_second_approver',
            SECOND_APPROVED: 'custrecord_fx_conv_second_approved',
            SECOND_APPROVED_TS: 'custrecord_fx_conv_second_apr_ts',
            CONV_RATE_COMPARE: 'custrecord_fx_conv_rate_comparison',
            CONTRACT_DATE: 'custrecord_fx_conv_ctr_date'
        };

        var rec = '';
        var user = '';

        var fxISOCode = '';
        var ISOCode = '';
        var contractDate = '';

        function pageInit(scriptContext) {

        }

        function fieldChanged(scriptContext) {

            rec = scriptContext.currentRecord;
            user = runtime.getCurrentUser();
            var isChecked = '';

            var firstField = rec.getField({fieldId: FIELDS.FIRST_APPROVED});
            var secondField = rec.getField({fieldId: FIELDS.SECOND_APPROVED});

            switch (scriptContext.fieldId) {

                case FIELDS.FIRST_APPROVED:

                    isChecked = rec.getValue({fieldId: FIELDS.FIRST_APPROVED});
                    var isSecondChecked = rec.getValue({fieldId: FIELDS.SECOND_APPROVED});

                    if (isChecked) {

                        rec.setValue({fieldId: FIELDS.FIRST_APPROVER, value: user.id});
                        rec.setValue({fieldId: FIELDS.FIRST_APPROVED_TS, value: new Date()});

                        // Disable the second checkbox so the same person checking the first can't check the second as well
                        secondField.isDisabled = true;

                    } else {

                        rec.setValue({fieldId: FIELDS.FIRST_APPROVER, value: ''});
                        rec.setValue({fieldId: FIELDS.FIRST_APPROVED_TS, value: ''});

                        /* If the second checkbox is checked when the first is unchecked
                         * we'll check if the current user is the second approver, if they are
                         * we'll disable the first checkbox so they can't double approve
                         */
                        if (isSecondChecked) {

                            var secondApprover = rec.getValue({fieldId: FIELDS.SECOND_APPROVER});

                            if (secondApprover == user.id) {

                                firstField.isDisabled = true;
                            }
                        }

                        // Disable the second checkbox so the same user can't check both boxes
                        secondField.isDisabled = true;
                    }

                    break;

                case FIELDS.SECOND_APPROVED:

                    isChecked = rec.getValue({fieldId: FIELDS.SECOND_APPROVED});

                    if (isChecked) {

                        rec.setValue({fieldId: FIELDS.SECOND_APPROVER, value: user.id});
                        rec.setValue({fieldId: FIELDS.SECOND_APPROVED_TS, value: new Date()});

                        firstField.isDisabled = true;

                    } else {

                        rec.setValue({fieldId: FIELDS.SECOND_APPROVER, value: ''});
                        rec.setValue({fieldId: FIELDS.SECOND_APPROVED_TS, value: ''});
                    }

                    break;

                case FIELDS.CONTRACT_DATE:
                case FIELDS.CONV_ISO:
                case FIELDS.OG_ISO:
                	
                	getExchangeRate(scriptContext); 
                	/*
                    fxISOCode = rec.getValue({fieldId: FIELDS.CONV_ISO});
                    ISOCode = rec.getValue({fieldId: FIELDS.OG_ISO});
                    contractDate = rec.getValue({fieldId: FIELDS.CONTRACT_DATE});

                    if (Boolean(fxISOCode) && Boolean(ISOCode)) {

                        var exchangeRate = currency.exchangeRate({
                            source: fxISOCode,
                            target: ISOCode,
                            date: new Date(contractDate)
                        });

                        rec.setValue({fieldId: FIELDS.CONV_RATE_COMPARE, value: exchangeRate});
                    }
                    */
            }

        }

        function postSourcing(scriptContext) {

            rec = scriptContext.currentRecord;
            user = runtime.getCurrentUser();

            switch (scriptContext.fieldId) {

                case FIELDS.CONV_CURRENCY:

                	getExchangeRate(scriptContext);
                	
                	/*
                    fxISOCode = rec.getValue({fieldId: FIELDS.CONV_ISO});
                    ISOCode = rec.getValue({fieldId: FIELDS.OG_ISO});
                    contractDate = rec.getValue({fieldId: FIELDS.CONTRACT_DATE});

                    var exchangeRate = currency.exchangeRate({
                        source: fxISOCode,
                        target: ISOCode,
                        date: new Date(contractDate)
                    });

                    rec.setValue({fieldId: FIELDS.CONV_RATE_COMPARE, value: exchangeRate});
					*/
                    break;
            }

        }

        
        function getExchangeRate(scriptContext) {
        	
        	rec = scriptContext.currentRecord;
        	
            fxISOCode = rec.getValue({fieldId: FIELDS.CONV_ISO});
            ISOCode = rec.getValue({fieldId: FIELDS.OG_ISO});
            contractDate = rec.getValue({fieldId: FIELDS.CONTRACT_DATE});

            if (fxISOCode && ISOCode && contractDate) {
                var exchangeRate = currency.exchangeRate({
                    source: fxISOCode,
                    target: ISOCode,
                    date: new Date(contractDate)
                });

                rec.setValue({fieldId: FIELDS.CONV_RATE_COMPARE, value: exchangeRate});            	
            }            
            
        }
        
        function sublistChanged(scriptContext) {

        }

        function lineInit(scriptContext) {

        }

        function validateField(scriptContext) {

        }

        function validateLine(scriptContext) {

        }

        function validateInsert(scriptContext) {

        }

        function validateDelete(scriptContext) {

        }

        function saveRecord(scriptContext) {

        }

        return {
            //pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            // saveRecord: saveRecord
        };

    });
