/**
 * This script can either be triggered by a User Event script tied to the Document Template record, which will pass parameters to the script
 * to indicate which Document (Custom) records to update. Or, it can be run manually with no parameters to mass update all Document (Custom) records
 * to have the Audience value from their respective Document Template records.
 *
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search'],

    function(record, runtime, search) {

        const FIELDS = {
            DOCUMENT: {
                ID: 'customrecord_document_management',
                STATUS: {
                    ID: 'custrecord_dm_status',
                    VALUES: ['4', '5']
                },
                SIGNED_STATUS: {
                    ID: 'custrecord_doc_signed_status',
                    VALUES: ['1']
                },
                TEMPLATE: 'custrecord_doc_template',
                EXC_REC: 'custrecord_acq_lot_exrec',
                AUDIENCE: 'custrecord_doc_audience'
            },
            TEMPLATE: {
                AUDIENCE: 'custrecord_dt_audience',
                ID: 'customrecord_doc_template',
                JOIN: 'custrec_doc_template'
            }
        };

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

            log.audit({title: 'START', details: 'START OF RUN'});

            var templateId = runtime.getCurrentScript().getParameter({name: 'custscript_template_id'});

            var filters = [];
            var columns = [];

            // If the Template ID was passed as a parameter, set a filter for it. If not, we'll assume this is a manual run
            // to update all Document (Custom) records that meet the criteria
            if (Boolean(templateId)) {

                filters.push(search.createFilter({
                    name: FIELDS.DOCUMENT.TEMPLATE,
                    operator: search.Operator.ANYOF,
                    values: templateId
                }));
            }

            filters.push(search.createFilter({
                name: FIELDS.DOCUMENT.STATUS.ID,
                operator: search.Operator.ANYOF,
                values: FIELDS.DOCUMENT.STATUS.VALUES
            }));
            filters.push(search.createFilter({
                name: FIELDS.DOCUMENT.SIGNED_STATUS.ID,
                operator: search.Operator.ANYOF,
                values: FIELDS.DOCUMENT.SIGNED_STATUS.VALUES
            }));
            filters.push(search.createFilter({
                name: FIELDS.DOCUMENT.EXC_REC,
                operator: search.Operator.NONEOF,
                values: '@NONE@'
            }));

            columns.push(search.createColumn({
                name: FIELDS.TEMPLATE.AUDIENCE,
                join: 'CUSTRECORD_DOC_TEMPLATE'
            }));

            try {
                return search.create({
                    type: FIELDS.DOCUMENT.ID,
                    columns: columns,
                    filters: filters
                });
            } catch (e) {

                log.error({title: 'e', details: e});
            }

        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {

            var searchResult = JSON.parse(context.value);

            var audience = JSON.parse(runtime.getCurrentScript().getParameter({name: 'custscript_doc_template_audience'}));

            // If no audience parameter was passed, we'll assume this is a manual run
            // to update all Document (Custom) records and use the value from the search results
            if (!Boolean(audience)) {

                audience = searchResult.values['custrecord_dt_audience.CUSTRECORD_DOC_TEMPLATE'].value;
            }

            var docRec = record.load({
                type: FIELDS.DOCUMENT.ID,
                id: searchResult.id
            });

            docRec.setValue({fieldId: 'custrecord_doc_audience', value: audience});

            var recId = docRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });
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

        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
