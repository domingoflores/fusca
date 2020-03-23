/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime', 'N/search'],

    function(record, runtime, search) {


        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         */
        function getInputData() {

            log.audit({title: 'START', details: 'START OF RUN'});

            // add code here
            var customrecord_paymt_instr_histSearchObj = search.create({
                type: "customrecord_paymt_instr_hist",
                filters:
                [
                ],
                columns:
                [
                   search.createColumn({
                      name: "id",
                      sort: search.Sort.DESC,
                      label: "ID"
                   }),
                   search.createColumn({
                      name: "internalid",
                      join: "CUSTRECORD_PIHS_EP_BANKCOUNTRYNAME",
                      label: "History Name ID"
                   }),
                   search.createColumn({name: "custrecord_pihs_ep_bankcountryname", label: "History Name"}),
                   search.createColumn({name: "custrecord_pihs_paymt_instr", label: "Payment Instruction"}),
                   search.createColumn({
                      name: "formulatext",
                      formula: "{custrecord_pihs_paymt_instr.custrecord_pi_ep_bankcountryname.id}",
                      label: "PI Name ID"
                   }),
                   search.createColumn({
                      name: "custrecord_pi_ep_bankcountryname",
                      join: "CUSTRECORD_PIHS_PAYMT_INSTR",
                      label: "PI Name"
                   }),
                   search.createColumn({name: "custrecord_pihs_submission", label: "Submission"}),
                   search.createColumn({
                      name: "formulatext",
                      formula: "{custrecord_pihs_submission.custrecord_pisb_ep_bankcountryname.id}",
                      label: "PISB Code"
                   }),
                   search.createColumn({
                      name: "custrecord_pisb_ep_bankcountryname",
                      join: "CUSTRECORD_PIHS_SUBMISSION",
                      label: "PISB Name"
                   })
                ]
             });


             return customrecord_paymt_instr_histSearchObj;

        }






        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {

            log.debug("JSON.stringify(context)", JSON.stringify(context) );
            //log.debug("JSON.stringify(context.value)", JSON.parse(context.value.values) );

            var result = JSON.parse(context.value)
            //log.debug("JSON.stringify(result)", JSON.stringify(result) );

            result = result.values;
            //log.debug("JSON.stringify(result) --2", JSON.stringify(result) );
            //var recResult = result.values.custrecord88.value
            log.debug('JSON.stringify(result)=', JSON.stringify(result) );

            var myId = result.id;            // id = 14991
            var correctCountry = result.formulatext;

            log.debug( "myId="+myId,'correctCountry='+correctCountry );

            // update record
            record.submitFields({ 
                type: 'customrecord_paymt_instr_hist', 
                id: myId,
                values: {
                    'custrecord_pihs_ep_bankcountryname' : correctCountry
                },
                options: {
                    enableSourcing: false, 
                    ignoreMandatoryFields : true
                }
            });



            context.write({
                key: context.key,
                value: context.values
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

            log.debug('summarize','end');
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });
