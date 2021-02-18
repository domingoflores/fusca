/**
 * This script will pull in any Exchange Record that has a Tax Identification Method field filled out
 * while the Tax Form Collected field is blank. It will take the value in the Tax Identification Method field
 * and populate the Tax Form Collected field with the appropriate value.
 *
 * @author Paul Shea
 *
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope public
 */
define(['N/record', 'N/search'],

    function(record, search) {

        var recordsUpdated = 0;

        const FIELDS = {
            EXCHANGE_RECORD: {
                INTERNAL_ID     : 'customrecord_acq_lot',
                TAX_METHOD      : 'custrecordacq_loth_2_de1_taxidmethod',
                FORM_COLLECTED  : 'custrecord_exrec_tax_form_collected'
            },
            TAX_ID_METHOD_RECORD: {
                INTERNAL_ID     : 'customrecord_acq_taxidmethod',
                FORM_COLLECTED  : 'custrecord_tim_tax_form_collected'

            }
        };

        function getCorrespondingTaxFormCollectedValue(taxMethod) {

            var taxFormCollectedValue = '';
            var columns = [];
            var filters = [];

            filters.push(search.createFilter({
                name: 'internalidnumber',
                operator: search.Operator.EQUALTO,
                values: taxMethod
            }));

            columns.push(search.createColumn({
                name: FIELDS.TAX_ID_METHOD_RECORD.FORM_COLLECTED
            }));

            search.create({
                type: FIELDS.TAX_ID_METHOD_RECORD.INTERNAL_ID,
                columns: columns,
                filters: filters
            }).run().each(function(result) {

                taxFormCollectedValue = result.getValue({name: FIELDS.TAX_ID_METHOD_RECORD.FORM_COLLECTED});
            });

            return taxFormCollectedValue;
        }

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {

            log.audit({
                title: 'START OF RUN'
            });

            return search.load({
                id: 'customsearch_missing_tax_form_collected'
            });
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {

            var result = JSON.parse(context.value);

            var exchangeRecId = result.id;
            var taxMethod = result.values[FIELDS.EXCHANGE_RECORD.TAX_METHOD].value;
            var taxMethodName = result.values[FIELDS.EXCHANGE_RECORD.TAX_METHOD].text;
            var taxFormCollected = getCorrespondingTaxFormCollectedValue(taxMethod);

            // If no corresponding Tax Form Collected value was found, skip updating this record
            if (!Boolean(taxFormCollected)) {

                log.audit({
                    title: 'No Corresponding Tax Form Collected found for Tax Method: ' + taxMethodName,
                    details: 'No Changes Were Made To Exchange Record Internal ID: ' + exchangeRecId
                });

                return;
            }

            try {

                record.submitFields({
                    type: FIELDS.EXCHANGE_RECORD.INTERNAL_ID,
                    id: exchangeRecId,
                    values: {
                        'custrecord_exrec_tax_form_collected': taxFormCollected
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                recordsUpdated++;

            } catch (e) {

                log.error({
                    title: 'Error Updating Tax Form Collected Field on Exchange Record with Internal ID: ' + exchangeRecId,
                    details: e
                });
            }

        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {

            var mapKeys = [];
            summary.mapSummary.keys.iterator().each(function(key){
                mapKeys.push(key);
                return true;
            });

            // Log any errors that occurred
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error({
                    title: 'Map Error for key: ' + key,
                    details: error
                });
            });

            log.audit({
                title: 'END OF RUN',
                details: 'Number Of Exchange Records Update = ' + recordsUpdated
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
