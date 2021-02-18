/**
 * autoPopulateTaxFormLibrary.js
 * @NApiVersion 2.x
 * @NModuleScope public
 * A library of utilities for auto-populating the Tax Form Collected field on Exchange Records.
 *
 *
 * Version    Date            Author           Remarks
 *	1.0		  05/13/2019	  Paul Shea 	   Will find the corresponding Tax Form Collected value based on the Tax Method Identification selected on an Exchange Record
 *
 */

define(['N/search'],

    function(search) {

        /**
         * This function will take a Tax Method Identification field value and find the corresponding Tax Form Collected value.
         *
         * @param {string} taxMethod - Internal ID of the Tax Method Identification value from the Exchange Record
         * @returns {string} taxFormCollectedValue - The Internal ID of the Tax Form Collected value that corresponds with the provided Tax Identification Method value
         */
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
                name: 'custrecord_tim_tax_form_collected'
            }));

            search.create({
                type: 'customrecord_acq_taxidmethod',
                columns: columns,
                filters: filters
            }).run().each(function(result) {

                taxFormCollectedValue = result.getValue({name: 'custrecord_tim_tax_form_collected'});
            });

            return taxFormCollectedValue;
        }

        return {

            getCorrespondingTaxFormCollectedValue: getCorrespondingTaxFormCollectedValue
        };

    });
