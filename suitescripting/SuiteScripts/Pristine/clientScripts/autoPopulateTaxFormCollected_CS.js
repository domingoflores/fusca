/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search', '/SuiteScripts/Pristine/libraries/autoPopulateTaxFormLibrary.js'],

    function(search, taxFormLib) {

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

            var exchangeRec = scriptContext.currentRecord;
            var taxMethodField = 'custrecordacq_loth_2_de1_taxidmethod';
            var taxMethod = exchangeRec.getValue({fieldId: taxMethodField});
            var taxFormCollectedField = 'custrecord_exrec_tax_form_collected';
            var taxFormCollected = exchangeRec.getValue({fieldId: taxFormCollectedField});

            if (Boolean(taxMethod) && scriptContext.fieldId === taxMethodField) {

                taxFormCollected = taxFormLib.getCorrespondingTaxFormCollectedValue(taxMethod);

                exchangeRec.setValue({fieldId: taxFormCollectedField, value: taxFormCollected});
            }

            if (!Boolean(taxMethod) && Boolean(taxFormCollected)) {

                exchangeRec.setValue({fieldId: taxFormCollectedField, value: ''});
            }

        }

        return {
            fieldChanged: fieldChanged
        };

    });
